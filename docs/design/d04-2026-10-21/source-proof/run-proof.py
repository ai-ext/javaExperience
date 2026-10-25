"""추가 Java21 빌드 fixture에서 태스크·파일·JUnit·캐시의 경계를 관찰한다."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, subprocess, tempfile, zipfile
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[3]
JAVA = Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
parser = argparse.ArgumentParser()
parser.add_argument('--runtime-root', required=True)
parser.add_argument('--freeze', action='store_true')
args = parser.parse_args()
base = Path(args.runtime_root).resolve()
base.mkdir(parents=True, exist_ok=True)
run = Path(tempfile.mkdtemp(prefix='run-', dir=base))
os.chmod(run, 0o700)
env = os.environ.copy()
env.update(JAVA_HOME=str(JAVA), TZ='UTC', LC_ALL='C')
checks, facts, raw = [], {}, {'run': str(run), 'commands': []}


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def check(name, ok, value):
    if not ok:
        raise AssertionError(name)
    checks.append(name)
    facts[name] = value
    print('PASS ' + name, flush=True)


def project(name):
    target = run / name
    shutil.copytree(OUT / 'fixture', target)
    return target


def command(target, name, *options, success=True):
    argv = [str(ROOT / 'gradlew'), '-p', str(target), '--offline', '--no-daemon',
            '--console=plain', '--max-workers=2', *options]
    result = subprocess.run(argv, cwd=run, env=env, capture_output=True, text=True, timeout=150)
    output = result.stdout + result.stderr
    logfile = run / (name + '.log')
    logfile.write_text(output)
    tasks = [{'task': match.group(1), 'outcome': match.group(2) or 'EXECUTED'}
             for match in re.finditer(r'^> Task :([^\s]+)(?: ([A-Z][A-Z-]+))?\s*$', output, re.M)]
    raw['commands'].append({'name': name, 'argv': argv, 'exitCode': result.returncode,
                            'tasks': tasks, 'log': str(logfile)})
    if (result.returncode == 0) != success:
        raise AssertionError(name + '; inspect ' + str(logfile))
    return output, tasks


def outcome(tasks, name):
    return next((entry['outcome'] for entry in tasks if entry['task'] == name), None)


def junit(target):
    reports = list((target / 'build/test-results/test').glob('TEST-*.xml'))
    totals = {'tests': 0, 'failures': 0, 'errors': 0, 'skipped': 0}
    for report in reports:
        suite = ET.parse(report).getroot()
        for key in totals:
            totals[key] += int(suite.attrib.get(key, 0))
    return totals


def jars(target):
    return target / 'build/libs/demo-0.0.1-SNAPSHOT.jar', target / 'build/libs/demo-0.0.1-SNAPSHOT-plain.jar'


metadata = json.loads((OUT / 'source.json').read_text())
assert sha(ROOT / metadata['source']) == metadata['sha256']
for block in metadata['originalBlocks']:
    assert sha(OUT / 'original' / block['file']) == block['sha256']
original_config = (OUT / 'original/block-05.gradle.kts').read_text()
fixture_config = (OUT / 'fixture/build.gradle.kts').read_text()
assert original_config.replace('JavaLanguageVersion.of(25)', 'JavaLanguageVersion.of(21)') in fixture_config

try:
    main = project('main')
    version = subprocess.run([str(JAVA / 'bin/java'), '-version'], capture_output=True, text=True, check=True)
    assert '"21.0.6"' in version.stderr
    wrapper, _ = command(main, 'wrapper-version', '--version')
    check('source-java25-preserved-added-java21-runtime', 'Gradle 9.8.0' in wrapper,
          {'originalJava': 25, 'originalKotlinPreserved': True, 'addedJava': '21.0.6',
           'wrapper': '9.8.0', 'bootPlugin': '4.1.1', 'scope': 'added Java21 variant/bootstrap/tests/resources; source Java25 not run'})
    command(main, 'record-proof', 'recordProof')
    graph = json.loads((main / 'task-graph.json').read_text())
    dependencies = json.loads((main / 'dependencies.json').read_text())
    assert all(sha(row['file']) == row['sha256'] for row in dependencies)
    coordinates = {row['coordinate'].split(':')[1]: row['coordinate'].split(':')[2] for row in dependencies}
    check('actual-task-prerequisites-have-two-build-branches',
          graph['build'] == ['assemble', 'check'] and graph['check'] == ['test']
          and graph['assemble'] == ['bootJar', 'jar'] and 'test' not in graph['bootJar'],
          {'graph': graph, 'scope': 'direct prerequisites of this added plugin fixture, not a fixed chronological pipeline'})
    check('actual-bom-and-transitive-runtime-files', coordinates['spring-boot'] == '4.1.1' and coordinates['junit-jupiter'] == '6.0.3',
          {'artifacts': len(dependencies), 'boot': coordinates['spring-boot'], 'junit': coordinates['junit-jupiter'],
           'launcher': coordinates['junit-platform-launcher'], 'scope': 'resolved files SHA; not independently authenticated upstream artifacts'})
    dry, _ = command(main, 'dry-run', 'clean', 'build', '--dry-run')
    check('dry-run-plan-is-not-task-output', ':compileJava SKIPPED' in dry and ':test SKIPPED' in dry and not (main / 'build').exists(),
          {'plannedCompile': True, 'plannedTest': True, 'buildDirectoryExists': False,
           'scope': 'configuration was evaluated; task actions disabled'})
    _, tasks = command(main, 'compile-main', 'compileJava')
    class_file = main / 'build/classes/java/main/example/build/BuildPolicy.class'
    major = int.from_bytes(class_file.read_bytes()[6:8], 'big')
    boot, plain = jars(main)
    check('compile-produces-class-not-jar-resource-report', major == 65 and not boot.exists()
          and not (main / 'build/resources/main/lesson.properties').exists() and not (main / 'build/test-results/test').exists(),
          {'classMajor': major, 'jarExists': False, 'resourceCopied': False, 'testReportExists': False})
    class_sha = sha(class_file)
    command(main, 'resources', 'processResources')
    resource = main / 'build/resources/main/lesson.properties'
    check('process-resources-copies-main-file', resource.read_bytes() == (main / 'src/main/resources/lesson.properties').read_bytes()
          and sha(class_file) == class_sha,
          {'resourceText': resource.read_text(), 'classUnchanged': True, 'jarExists': boot.exists()})
    _, tasks = command(main, 'junit-test', 'test')
    test_result = junit(main)
    check('actual-junit-executes-two-tests', test_result == {'tests': 2, 'failures': 0, 'errors': 0, 'skipped': 0}
          and outcome(tasks, 'test') == 'EXECUTED' and not boot.exists(),
          {**test_result, 'junit': coordinates['junit-jupiter'], 'jarExists': False,
           'scope': 'additional standalone JUnit tests; no Docker/DB/source learner tests'})
    command(main, 'baseline-cache-build', 'clean', 'build', '--build-cache')
    jar_sha = sha(boot)
    with zipfile.ZipFile(boot) as archive:
        entries = archive.namelist()
        manifest = archive.read('META-INF/MANIFEST.MF').decode()
    with zipfile.ZipFile(plain) as archive:
        plain_entries = archive.namelist()
    check('bootjar-and-plain-jar-have-different-structure',
          'BOOT-INF/classes/example/build/BuildPolicy.class' in entries
          and any(name.startswith('BOOT-INF/lib/') and name.endswith('.jar') for name in entries)
          and 'example/build/BuildPolicy.class' in plain_entries
          and not any('BuildPolicyTest' in name for name in entries + plain_entries),
          {'bootClassPath': 'BOOT-INF/classes/example/build/BuildPolicy.class',
           'bootLibraries': sum(name.startswith('BOOT-INF/lib/') and name.endswith('.jar') for name in entries),
           'plainClassPath': 'example/build/BuildPolicy.class', 'testClassPackaged': False,
           'bootStartClass': 'example.build.BuildDemoApplication', 'plainClassifier': 'plain'})
    assert 'Start-Class: example.build.BuildDemoApplication' in manifest
    launched = subprocess.run([str(JAVA / 'bin/java'), '-jar', str(boot)], cwd=run, env=env,
                              capture_output=True, text=True, timeout=30)
    (run / 'bootjar-launch.log').write_text(launched.stdout + launched.stderr)
    check('actual-bootjar-launch-loads-resource', launched.returncode == 0
          and 'D04_RESOURCE=build-ready' in launched.stdout and 'D04_POLICY=READY' in launched.stdout,
          {'exitCode': 0, 'resource': 'build-ready', 'policy': 'READY',
           'scope': 'own non-web Boot process exited; no HTTP/container/registry/deploy'})
    _, repeated = command(main, 'same-input-build', 'build', '--build-cache')
    check('same-workspace-up-to-date-is-not-from-cache',
          all(outcome(repeated, name) == 'UP-TO-DATE' for name in ['compileJava', 'processResources', 'test', 'bootJar']),
          {'compileJava': outcome(repeated, 'compileJava'), 'processResources': outcome(repeated, 'processResources'),
           'test': outcome(repeated, 'test'), 'bootJar': outcome(repeated, 'bootJar'), 'scope': 'unchanged declared inputs in same workspace'})
    _, cached = command(main, 'clean-cached-build', 'clean', 'build', '--build-cache')
    check('clean-build-can-restore-compile-output-from-private-cache', outcome(cached, 'compileJava') == 'FROM-CACHE',
          {'compileJava': outcome(cached, 'compileJava'), 'test': outcome(cached, 'test'),
           'processResources': outcome(cached, 'processResources'),
           'scope': 'own project .task-cache populated by earlier clean build; no remote cache/global cache deletion'})
    test_file = main / 'src/test/java/example/build/BuildPolicyTest.java'
    original_test = test_file.read_text()
    test_file.write_text(original_test.replace('assertEquals("READY",', 'assertEquals("BLOCKED",'))
    failed, failed_tasks = command(main, 'junit-failure-existing-jar', 'build', '--no-build-cache', success=False)
    failed_result = junit(main)
    check('junit-failure-does-not-remove-existing-jar', outcome(failed_tasks, 'test') == 'FAILED'
          and failed_result['tests'] == 2 and failed_result['failures'] == 1 and sha(boot) == jar_sha,
          {'firstFailedTask': 'test', **failed_result, 'existingJarUnchanged': True,
           'scope': 'JAR came from prior successful baseline; file presence is not current successful build'})
    test_file.write_text(original_test)
    source_resource = main / 'src/main/resources/lesson.properties'
    source_resource.write_text('lesson.message=updated-resource\n')
    _, changed = command(main, 'resource-input-change', 'build', '--build-cache')
    check('resource-change-does-not-recompile-unchanged-java', outcome(changed, 'compileJava') == 'UP-TO-DATE'
          and outcome(changed, 'processResources') == 'EXECUTED' and sha(class_file) == class_sha
          and resource.read_text() == 'lesson.message=updated-resource\n',
          {'compileJava': outcome(changed, 'compileJava'), 'processResources': outcome(changed, 'processResources'),
           'classUnchanged': True, 'resourceText': resource.read_text(), 'jarBytesChanged': sha(boot) != jar_sha,
           'scope': 'task input boundary; not a measured performance improvement'})
    source_resource.write_text('lesson.message=build-ready\n')
    broken = project('broken')
    policy = broken / 'src/main/java/example/build/BuildPolicy.java'
    policy.write_text(policy.read_text().replace('return "READY";', 'return MISSING_VALUE;'))
    compile_log, compile_tasks = command(broken, 'main-compile-failure', 'clean', 'build', success=False)
    check('compile-failure-is-before-test-execution', outcome(compile_tasks, 'compileJava') == 'FAILED'
          and 'cannot find symbol' in compile_log and not (broken / 'build/test-results/test').exists(),
          {'firstFailedTask': 'compileJava', 'diagnostic': 'cannot find symbol', 'junitReportExists': False})
    shutil.copy2(OUT / 'fixture/src/main/java/example/build/BuildPolicy.java', policy)
    broken_test = broken / 'src/test/java/example/build/BuildPolicyTest.java'
    broken_test.write_text(broken_test.read_text().replace('assertEquals("READY",', 'assertEquals(UNKNOWN_EXPECTED,'))
    test_compile_log, test_compile_tasks = command(broken, 'test-compile-failure', 'clean', 'test', success=False)
    check('test-compilation-failure-is-not-junit-assertion', outcome(test_compile_tasks, 'compileTestJava') == 'FAILED'
          and 'cannot find symbol' in test_compile_log and not (broken / 'build/test-results/test').exists(),
          {'firstFailedTask': 'compileTestJava', 'diagnostic': 'cannot find symbol', 'junitReportExists': False})
    empty = project('empty-test-source')
    (empty / 'src/test/java/example/build/BuildPolicyTest.java').unlink()
    _, empty_tasks = command(empty, 'no-source-tests', 'test')
    check('test-no-source-is-not-two-tests-passed', outcome(empty_tasks, 'test') == 'NO-SOURCE'
          and not (empty / 'build/test-results/test').exists(),
          {'compileTestJava': outcome(empty_tasks, 'compileTestJava'), 'test': outcome(empty_tasks, 'test'),
           'junitReportExists': False, 'scope': 'own copied fixture test source removed; not learner source'})
    _, skipped = command(main, 'onlyif-skipped', 'policySkip')
    check('onlyif-skipped-action-was-not-run', outcome(skipped, 'policySkip') == 'SKIPPED'
          and not (main / 'build/unexpected-skip-action.txt').exists(),
          {'task': 'policySkip', 'outcome': 'SKIPPED', 'actionOutputExists': False})
    assembly = project('assemble-only')
    _, assembly_tasks = command(assembly, 'assemble-only', 'assemble')
    assembly_jar, _ = jars(assembly)
    check('assemble-can-package-without-running-junit', assembly_jar.exists()
          and outcome(assembly_tasks, 'test') is None and not (assembly / 'build/test-results/test').exists(),
          {'jarExists': True, 'testTaskSelected': False, 'junitReportExists': False,
           'scope': 'fresh added fixture; assemble is not full build validation'})
    twin = project('twin-clean-build')
    command(twin, 'twin-clean-build', 'clean', 'build', '--no-build-cache')
    twin_jar, _ = jars(twin)
    check('two-scoped-clean-builds-have-equal-jar-bytes', sha(twin_jar) == jar_sha,
          {'sha256': jar_sha, 'twoJarBytesEqual': True,
           'scope': 'same fixture/JDK21.0.6/Gradle9.8.0/dependency files, separate workspace; not universal reproducibility'})
    command(main, 'write-runtime-lock', 'dependencies', '--configuration', 'runtimeClasspath', '--write-locks')
    lock_text = (main / 'gradle.lockfile').read_text()
    check('dependency-lock-records-selected-versions', 'org.springframework.boot:spring-boot:4.1.1=' in lock_text,
          {'lockedBoot': 'org.springframework.boot:spring-boot:4.1.1', 'containsVersionSelection': True,
           'scope': 'runtime lock state, not artifact checksum or repository availability guarantee'})
    command(main, 'write-verification', 'recordProof', '--write-verification-metadata', 'sha256')
    verification = main / 'gradle/verification-metadata.xml'
    tree = ET.parse(verification)
    ET.register_namespace('', tree.getroot().tag.split('}')[0][1:])
    changed_checksum = False
    for element in tree.getroot().iter():
        if element.tag.endswith('artifact') and element.attrib.get('name') == 'spring-boot-4.1.1.jar':
            for child in element:
                if child.tag.endswith('sha256'):
                    child.set('value', '0' * 64)
                    changed_checksum = True
    assert changed_checksum
    tree.write(verification, encoding='unicode', xml_declaration=True)
    verification_log, _ = command(main, 'private-checksum-mismatch', 'clean', 'compileJava', success=False)
    check('private-verification-mismatch-rejects-unchanged-dependency',
          'Dependency verification failed' in verification_log
          and all(sha(row['file']) == row['sha256'] for row in dependencies),
          {'diagnostic': 'Dependency verification failed', 'privateExpectedChecksumAltered': True,
           'globalDependencyBytesUnchanged': True, 'scope': 'only private project expected hash changed; no cache corruption or trust weakening'})
    (OUT / 'dependencies.json').write_text(json.dumps(dependencies, indent=2) + '\n')
    raw['initialJarManifest'] = manifest
    raw['initialJarSHA256'] = jar_sha
    raw['taskGraph'] = graph
finally:
    raw['completedChecks'] = checks
    raw['completedFacts'] = facts
    (OUT / 'runtime-last.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n')

models = {
    'local-vs-ci-inputs': {'kind': 'source-derived input comparison model', 'inputs': ['commit/tracked and untracked files', 'Wrapper', 'JDK/toolchain', 'dependency selection/files', 'OS/environment', 'cache'], 'scope': 'no actual CI runner or secret/config mutation'},
    'docker-registry-boundary': {'kind': 'source-derived optional process model', 'steps': ['JAR', 'image build', 'tag/reference', 'registry push', 'deployment'], 'scope': 'no Docker build/login/push/deployment executed'},
    'failure-layers': {'kind': 'source/literature diagnosis model', 'layers': ['configuration/plugin', 'dependency/verification', 'compileJava/compileTestJava', 'JUnit test', 'packaging', 'worker memory', 'image/registry'], 'scope': 'native observed subset distinguished; no real memory failure or registry incident fabricated'},
}
observed = {'checks': sorted(checks), 'facts': facts, 'models': models}
(OUT / 'execution.json').write_text(json.dumps(observed, ensure_ascii=False, indent=2) + '\n')
expected = OUT / 'checkpoints/expected-execution.json'
if args.freeze:
    expected.parent.mkdir(exist_ok=True)
    expected.write_text(json.dumps(observed, ensure_ascii=False, indent=2) + '\n')
else:
    assert observed == json.loads(expected.read_text()), 'whole frozen mismatch'
print(json.dumps({'run': str(run), 'checks': len(checks), 'models': len(models), 'wholeFrozenMatch': not args.freeze}), flush=True)
