"""원문 Java 예제를 추출·실행하고 추가 컴파일 실패 사례를 검증한다."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
JDK = Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home/bin')
source = ROOT / 'docs/knowledge/P09-java-syntax-basics.md'
text = source.read_text()
report = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'originalExamples': [], 'additionalChecks': []}

for name in ('PassByValueDemo', 'MethodsDemo', 'OperatorsDemo'):
    block = next(m for m in re.finditer(r'```java\n(.*?)\n```', text, re.S) if f'public class {name}' in m.group(1))
    file = HERE / f'{name}.java'
    file.write_text(block.group(1) + '\n')
    expected = re.search(r'```text\n(.*?)\n```', text[block.end():], re.S).group(1) + '\n'
    result = subprocess.run([str(JDK / 'java'), str(file)], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert result.stdout == expected, (name, result.stdout, expected)
    (HERE / f'{name}.stdout.txt').write_text(result.stdout)
    report['originalExamples'].append({'name': name, 'stdoutExact': True, 'sourceLine': text[:block.start()].count('\n') + 2})

result = subprocess.run([str(JDK / 'java'), str(HERE / 'P09StateProof.java')], capture_output=True, text=True)
assert result.returncode == 0, result.stderr
(HERE / 'P09StateProof.stdout.txt').write_text(result.stdout)
report['additionalStateProof'] = {'exitCode': result.returncode, 'assertions': len(result.stdout.splitlines()), 'kind': 'additional explanatory examples, not original output'}

failures = {
    'LocalInitialization': ('class LocalInitialization { int value() { int x; return x; } }', 'compiler.err.var.might.not.have.been.initialized'),
    'StaticThis': ('class StaticThis { static Object value() { return this; } }', 'compiler.err.non-static.cant.be.ref'),
    'MissingReturn': ('class MissingReturn { int value(boolean enabled) { if (enabled) return 1; } }', 'compiler.err.missing.ret.stmt'),
    'ReturnOnlyOverload': ('class ReturnOnlyOverload { int find(long id) { return 1; } String find(long id) { return "x"; } }', 'compiler.err.already.defined'),
    'ParameterNameOnly': ('class ParameterNameOnly { int find(long id) { return 1; } int find(long code) { return 2; } }', 'compiler.err.already.defined'),
    'FinalReassignment': ('class FinalReassignment { void use() { final Object x = new Object(); x = new Object(); } }', 'compiler.err.cant.assign.val.to.var'),
    'VarargsPosition': ('class VarargsPosition { void use(String... names, int count) {} }', 'compiler.err.varargs.must.be.last'),
    'NumericCondition': ('class NumericCondition { void use() { int n = 1; if (n) {} } }', 'compiler.err.prob.found.req'),
    'ChainedComparison': ('class ChainedComparison { boolean use(int age) { return 0 < age < 100; } }', 'compiler.err.operator.cant.be.applied.1'),
    'WrongFilename': ('public class Invoice {}', 'compiler.err.class.public.should.be.in.file'),
    'FinalMethodOverride': ('class FinalMethodParent { final void run() {} } class FinalMethodChild extends FinalMethodParent { void run() {} }', 'compiler.err.override.meth'),
    'FinalClassExtend': ('final class LockedType {} class Other extends LockedType {}', 'compiler.err.cant.inherit.from.final'),
}
with tempfile.TemporaryDirectory(prefix='p09-compile-') as directory:
    package_root = Path(directory) / 'access'
    (package_root / 'p').mkdir(parents=True)
    (package_root / 'q').mkdir()
    base = package_root / 'p/Base.java'; base.write_text('package p; public class Base { protected int value; }')
    peer = package_root / 'p/Peer.java'; peer.write_text('package p; public class Peer { int read(Base other) { return other.value; } }')
    sub = package_root / 'q/Sub.java'; sub.write_text('package q; public class Sub extends p.Base { int read(Sub other) { return this.value + other.value; } }')
    allowed = subprocess.run([str(JDK / 'javac'), '-d', directory, str(base), str(peer), str(sub)], capture_output=True, text=True)
    assert allowed.returncode == 0, allowed.stderr
    bad = package_root / 'q/Bad.java'; bad.write_text('package q; public class Bad extends p.Base { int read(p.Base other) { return other.value; } }')
    denied = subprocess.run([str(JDK / 'javac'), '-XDrawDiagnostics', '-cp', directory, '-d', directory, str(bad)], capture_output=True, text=True)
    assert denied.returncode != 0 and 'compiler.err.report.access' in denied.stderr, denied.stderr
    report['protectedReceiver'] = {'samePackageAndSubclassReceiverCompile': True, 'baseReceiverRejected': True, 'negativeCode': bad.read_text(), 'diagnostic': denied.stderr}
    compiled = subprocess.run([str(JDK / 'javac'), '-d', directory, str(HERE / 'MethodsDemo.java'), str(HERE / 'P09MethodsProbe.java')], capture_output=True, text=True)
    assert compiled.returncode == 0, compiled.stderr
    methods = subprocess.run([str(JDK / 'java'), '-cp', directory, 'P09MethodsProbe'], capture_output=True, text=True)
    assert methods.returncode == 0, methods.stderr
    (HERE / 'P09MethodsProbe.stdout.txt').write_text(methods.stdout)
    report['additionalMethodsProof'] = {'exitCode': methods.returncode, 'assertions': len(methods.stdout.splitlines()), 'stdout': methods.stdout}
    for name, (code, diagnostic) in failures.items():
        file = Path(directory) / f'{name}.java'
        file.write_text(code + '\n')
        result = subprocess.run([str(JDK / 'javac'), '-XDrawDiagnostics', str(file)], capture_output=True, text=True)
        assert result.returncode != 0, (name, 'unexpectedly compiled')
        assert diagnostic in result.stderr, (name, result.stderr, diagnostic)
        report['additionalChecks'].append({'name': name, 'code': code, 'expectedDiagnostic': diagnostic, 'stderr': result.stderr, 'rejected': True})
report['javaVersion'] = subprocess.run([str(JDK / 'java'), '-version'], capture_output=True, text=True).stderr
(HERE / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f"Original examples: {len(report['originalExamples'])}; state assertions: {report['additionalStateProof']['assertions']}; compile rejections: {len(report['additionalChecks'])}")
