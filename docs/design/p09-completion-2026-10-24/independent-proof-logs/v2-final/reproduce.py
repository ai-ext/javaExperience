import datetime
import hashlib
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path('LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night')
BASE = ROOT / 'docs/design/p09-completion-2026-10-24'
LOGS = pathlib.Path(__file__).resolve().parent
JDK = pathlib.Path('LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home/bin')
SOURCE = BASE / 'proof/P09BoundariesProof.java'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def run(name, argv):
    result = subprocess.run([str(x) for x in argv], cwd=ROOT, capture_output=True)
    stdout = LOGS / (name + '.stdout.log')
    stderr = LOGS / (name + '.stderr.log')
    stdout.write_bytes(result.stdout)
    stderr.write_bytes(result.stderr)
    row = {'name': name, 'argv': [str(x) for x in argv], 'cwd': str(ROOT),
           'exitCode': result.returncode, 'stdout': str(stdout), 'stderr': str(stderr),
           'stdoutSHA256': sha(stdout), 'stderrSHA256': sha(stderr)}
    runs.append(row)
    return result

records = json.loads((BASE / 'image-records.json').read_text())
selected = [r for r in records['images'] if r['name'] in ['shared-dark', 'varargs-dark']]
inputs = [BASE / p for p in ['SPEC.md', 'PLAN.md', 'image-records.json',
          'proof/P09BoundariesProof.java', 'proof/execution.json', 'proof/run.stdout.log',
          'proof/compile.stdout.log', 'proof/compile.stderr.log', 'proof/version.stderr.log']]
inputs += [ROOT / 'docs/knowledge/P09-java-syntax-basics.md']
inputs += [ROOT / r['destination'] for r in selected]
before = {str(p): sha(p) for p in inputs}
tempdir = pathlib.Path(tempfile.mkdtemp(prefix='p09-independent-proof-sol-'))
runs = []
version = run('java-version', [JDK / 'java', '-version'])
compiler = run('javac-version', [JDK / 'javac', '-version'])
compile_result = run('compile', [JDK / 'javac', '-d', tempdir, SOURCE])
execution = run('run', [JDK / 'java', '-cp', tempdir, 'P09BoundariesProof'])
bytecode = run('javap-main', [JDK / 'javap', '-classpath', tempdir, '-p', '-c', '-s', 'P09BoundariesProof'])
nested = run('javap-state', [JDK / 'javap', '-classpath', tempdir, '-p', '-c', '-s', 'P09BoundariesProof$RequestState'])
expected_record = json.loads((BASE / 'proof/execution.json').read_text())
lines = execution.stdout.decode().splitlines()
actual = dict(line.split('=', 1) for line in lines)
expected = expected_record['expected']
expected_bytes = ''.join(k + '=' + v + '\n' for k, v in expected.items()).encode()
images = []
for record in selected:
    path = ROOT / record['destination']
    meta = run(record['name'] + '-metadata', ['/usr/bin/sips', '-g', 'format', '-g', 'pixelWidth', '-g', 'pixelHeight', '-g', 'formatOptions', path])
    text = meta.stdout.decode()
    source = pathlib.Path(record['source'])
    encoded = tempdir / (record['name'] + '-independent-quality92.jpg')
    encoding = run(record['name'] + '-reencode-quality92', ['/usr/bin/sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '92', source, '--out', encoded])
    source_meta = run(record['name'] + '-source-metadata', ['/usr/bin/sips', '-g', 'format', '-g', 'pixelWidth', '-g', 'pixelHeight', source])
    quality_match = encoding.returncode == 0 and encoded.exists() and encoded.read_bytes() == path.read_bytes()
    images.append({'name': record['name'], 'path': str(path), 'sha256': sha(path),
                   'recordSHA256Matches': sha(path) == record['sha256'], 'bytes': path.stat().st_size,
                   'recordBytesMatch': path.stat().st_size == record['bytes'],
                   'formatAndCanvasMatch': all(x in text for x in ['format: jpeg', 'pixelWidth: 1672', 'pixelHeight: 941']),
                   'recordedQuality': record['quality'], 'qualityIndependentlyVerified': quality_match,
                   'qualityEvidence': 'Independent sips format jpeg / formatOptions 92 conversion of recorded source PNG in owned tempdir; complete bytes compared.',
                   'reencodedSHA256': sha(encoded) if encoded.exists() else None,
                   'reencodedBytesIdentical': quality_match,
                   'sourceNativePNG1672x941': all(x in source_meta.stdout.decode() for x in ['format: png', 'pixelWidth: 1672', 'pixelHeight: 941']),
                   'sourceExists': source.exists(), 'sourceSHA256Matches': sha(source) == record['sourceSHA256'] if source.exists() else None})
after = {str(p): sha(p) for p in inputs}
result = {'checkedAtUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'scope': 'additional standalone Java21 proof and two selected PC-dark JPEG images only; no UI approval',
          'suppliedHEAD': '90edde073041885f56661056e0532f4fc9ef4cc4', 'headIndependentlyQueried': False,
          'tempdir': str(tempdir), 'runs': runs, 'sourceSHA256': sha(SOURCE),
          'sourceHashMatchesRecord': sha(SOURCE) == expected_record['sourceSHA256'],
          'expected': expected, 'actual': actual, 'observationCount': len(lines),
          'uniqueKeyCount': len(actual), 'matchesExpected13': len(lines) == len(actual) == 13 and actual == expected,
          'matchesRecordedActual13': actual == expected_record['actual'],
          'matchesExpectedFullStdoutBytes': execution.stdout == expected_bytes,
          'matchesOriginalFullStdoutBytes': execution.stdout == (BASE / 'proof/run.stdout.log').read_bytes(),
          'chooseCallsiteDescriptors': [line.strip() for line in bytecode.stdout.decode().splitlines() if 'invokestatic' in line and '// Method choose:' in line],
          'images': images, 'inputHashesBefore': before, 'inputHashesAfter': after,
          'allInputsUnchanged': before == after,
          'classHashes': {p.name: sha(p) for p in sorted(tempdir.glob('*.class'))}}
(LOGS / 'reproduction.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['checkedAtUTC', 'tempdir', 'sourceSHA256', 'sourceHashMatchesRecord', 'observationCount', 'matchesExpected13', 'matchesRecordedActual13', 'matchesExpectedFullStdoutBytes', 'matchesOriginalFullStdoutBytes', 'allInputsUnchanged', 'chooseCallsiteDescriptors', 'images']}, ensure_ascii=False, indent=2))
assert all(r['exitCode'] == 0 for r in runs)
assert all(result[k] for k in ['sourceHashMatchesRecord', 'matchesExpected13', 'matchesRecordedActual13', 'matchesExpectedFullStdoutBytes', 'matchesOriginalFullStdoutBytes', 'allInputsUnchanged'])
assert len(result['chooseCallsiteDescriptors']) == 3
assert all(im['recordSHA256Matches'] and im['recordBytesMatch'] and im['formatAndCanvasMatch'] and im['qualityIndependentlyVerified'] and im['sourceNativePNG1672x941'] for im in images)
