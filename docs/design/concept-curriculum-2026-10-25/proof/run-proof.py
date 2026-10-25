#!/usr/bin/env python3
"""별도 최소 fixture의 실행·원시 로그·주장 범위를 기록한다. learner 코드는 실행하지 않는다."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import os
import platform
import subprocess
import xml.etree.ElementTree as ET

proof = Path(__file__).resolve().parent
repo = proof.parents[3]
raw = proof / 'raw'
raw.mkdir(exist_ok=True)
command = [str(repo / 'gradlew'), '-p', str(proof), 'test', '--rerun-tasks', '--no-daemon', '--max-workers=1']
started = datetime.now(timezone.utc).isoformat()
environment = os.environ.copy()
if platform.system() == 'Darwin':
    # Gradle 시작 JVM도 21로 고정한다. 사용자 전역 JAVA_HOME은 변경하지 않는다.
    java_home = subprocess.check_output(['/usr/libexec/java_home', '-v', '21'], text=True).strip()
    environment['JAVA_HOME'] = java_home
with (raw / 'gradle-test.log').open('w') as log:
    result = subprocess.run(command, cwd=repo, env=environment, stdout=log, stderr=subprocess.STDOUT, timeout=180)
if result.returncode:
    raise SystemExit(f'최소 fixture 실패: exit={result.returncode}; raw/gradle-test.log 확인')
xml_path = proof / 'build/test-results/test/TEST-learning.CoreConceptTest.xml'
xml = ET.parse(xml_path).getroot()
tests = xml.findall('testcase')
assert len(tests) == 8, f'예상한 8개 관찰과 다름: {len(tests)}'
assert all(case.find('failure') is None and case.find('error') is None and case.find('skipped') is None for case in tests)
facts = {}
for output in xml.findall('.//system-out'):
    for line in (output.text or '').splitlines():
        if line.startswith('PROOF|'):
            _, unit, key, value = line.split('|', 3)
            assert (unit, key) not in facts or facts[(unit, key)] == value
            facts[(unit, key)] = value
expected = {'C01': ['reference'], 'C02': ['http', 'loopbackPort', 'closed'],
            'C03': ['retention'], 'C04': ['injection', 'missing'],
            'C05': ['generated', 'processor', 'delombok'], 'C06': ['order', 'scope']}
for unit, keys in expected.items():
    for key in keys:
        assert (unit, key) in facts, f'관찰 누락: {unit}/{key}'
assert facts[('C02', 'closed')] == 'true'
assert facts[('runtime', 'boot')] == '4.1.1'
assert facts[('runtime', 'java')].startswith('21.')
inputs = [proof / 'build.gradle', proof / 'settings.gradle', Path(__file__).resolve(),
          proof / 'src/test/java/learning/CoreConceptTest.java', repo / 'gradle/wrapper/gradle-wrapper.properties']
manifest = [{'path': str(p.relative_to(repo)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]
(raw / 'TEST-learning.CoreConceptTest.xml').write_bytes(xml_path.read_bytes())
receipt = {
    'schemaVersion': 1, 'startedAtUTC': started, 'finishedAtUTC': datetime.now(timezone.utc).isoformat(),
    'status': 'passed', 'exitCode': result.returncode, 'testCount': len(tests),
    'command': ['./gradlew', '-p', 'docs/design/concept-curriculum-2026-10-25/proof', *command[3:]],
    'sourceRelation': '새 최소 fixture의 관찰이다. 기존 원문 전체 예제를 실행한 결과가 아니다.',
    'runtime': {key: value for (unit, key), value in facts.items() if unit == 'runtime'},
    'launcher': 'macOS는 설치된 JDK21을 이 subprocess에만 지정; 다른 OS는 Gradle을 시작할 호환 JVM과 JDK21 toolchain 필요',
    'inputs': manifest,
    'tests': [{'name': case.attrib['name'], 'result': 'passed'} for case in tests],
    'units': {unit: {'facts': {key: facts[(unit, key)] for key in keys}} for unit, keys in expected.items()},
    'limits': {
        'C01': '현재 fixture의 객체·참조·생성자 관찰만 확인. P09/P04 전체 실행 아님.',
        'C02': 'DB 없는 최소 MVC 앱의 단일 loopback 요청. learner 앱·전체 API·DB 검증 아님.',
        'C03': 'RUNTIME/CLASS 보존과 메타데이터·명시 호출만 실행. AOP 프록시와 모든 애노테이션 실행 아님.',
        'C04': '최소 생성자 주입·싱글턴 조회·누락 의존성 실패만 실행. 모든 scope/순환/qualifier 검사 아님.',
        'C05': 'Getter/RequiredArgsConstructor와 delombok/processor on-off만 실행. Builder/Data/JPA 전체 검증 아님.',
        'C06': 'setter 주입으로 단계를 구분한 정상 context.close 관찰. 생성자 주입은 생성 시 인자를 받는다. 강제 종료·prototype 소멸은 실험하지 않음.',
    },
    'raw': ['raw/gradle-test.log', 'raw/TEST-learning.CoreConceptTest.xml', 'raw/LombokCompile.java',
            'raw/delombok-output.java.txt', 'raw/processor-enabled.txt', 'raw/processor-disabled.txt'],
}
(proof / 'execution.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'tests': len(tests), 'runtime': receipt['runtime']}, ensure_ascii=False))
