"""원문 순수 Java와 추가 상태를 임시 클래스 폴더에서 다시 확인한다."""
from pathlib import Path
import hashlib, json, re, subprocess, tempfile
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
JAVA = Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home/bin')
source = ROOT / 'docs/knowledge/P04-constructors-builder.md'
text = source.read_text()
records = []
for name in ['CreationDemo', 'RequestDemo']:
    matches = [m for m in re.finditer(r'```java\n(.*?)\n```', text, re.S) if f'public class {name} ' in m.group(1)]
    assert len(matches) == 1
    match = matches[0]
    code = match.group(1) + '\n'
    assert (OUT / f'{name}.java').read_text() == code, '추출 소스가 원문과 달라짐'
    expected = re.search(r'```text\n(.*?)\n```', text[match.end():], re.S).group(1) + '\n'
    result = subprocess.run([str(JAVA / 'java'), str(OUT / f'{name}.java')], capture_output=True, text=True, check=True)
    assert result.stdout == expected, name
    assert (OUT / f'{name}.stdout.txt').read_text() == expected
    records.append({'name': name, 'stdoutExact': True})
with tempfile.TemporaryDirectory(prefix='p04-proof-') as tmp:
    subprocess.run([str(JAVA/'javac'), '-d', tmp, *[str(OUT/f'{name}.java') for name in ['CreationDemo','RequestDemo','P04StateProof']]], check=True, capture_output=True, text=True)
    result = subprocess.run([str(JAVA/'java'), '-cp', tmp, 'P04StateProof'], check=True, capture_output=True, text=True)
    assert result.stdout == (OUT/'P04StateProof.stdout.txt').read_text()
report = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'originalExamples': records, 'additionalStateChecks': 15, 'counterSanityCheck': True, 'limits': 'JDK21 pure Java only; Spring/Lombok/JPA/Java25/HTTP not executed'}
(OUT/'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print('P04: 원문 Java2개 stdout 전체·추가15상태 일치')
