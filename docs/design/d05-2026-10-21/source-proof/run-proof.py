"""원문 보존 사본과 추가 도구에서만 디버깅 증거를 관찰한다."""
from pathlib import Path
import argparse, hashlib, json, os, queue, re, shutil, socket, subprocess, sys, tempfile, threading, time
import urllib.request, urllib.error
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[3]
JAVA = Path('LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
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
facts, checks, processes = {}, [], []
raw = {'run': str(run), 'commands': [], 'http': [], 'interactive': {}}


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def check(name, predicate, value):
    if not predicate:
        raise AssertionError(name)
    checks.append(name)
    facts[name] = value
    print('PASS ' + name, flush=True)


def command(name, argv, cwd=None, success=True, timeout=150):
    result = subprocess.run(argv, cwd=cwd or run, env=env, capture_output=True, text=True, timeout=timeout)
    output = result.stdout + result.stderr
    log = run / (name + '.log')
    log.write_text(output)
    raw['commands'].append({'name': name, 'argv': list(map(str, argv)), 'exitCode': result.returncode, 'log': str(log)})
    if (result.returncode == 0) != success:
        raise AssertionError(name + '; inspect ' + str(log))
    return output, result.returncode


class Interactive:
    def __init__(self, name, argv, cwd=None):
        self.name, self.text, self.cursor, self.items = name, '', 0, queue.Queue()
        self.process = subprocess.Popen(argv, cwd=cwd or run, env=env, stdin=subprocess.PIPE,
                                        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        processes.append(self)
        raw['interactive'][name] = {'argv': list(map(str, argv)), 'pid': self.process.pid, 'sent': []}
        self.reader = threading.Thread(target=self.read, daemon=True)
        self.reader.start()

    def read(self):
        while True:
            char = self.process.stdout.read(1)
            if not char:
                self.items.put(None)
                return
            self.items.put(char)

    def until(self, pattern, timeout=20):
        deadline = time.monotonic() + timeout
        while True:
            match = re.search(pattern, self.text[self.cursor:], re.M)
            if match:
                end = self.cursor + match.end()
                output, self.cursor = self.text[self.cursor:end], end
                return output
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise AssertionError(self.name + ' timed out: ' + pattern + '\n' + self.text[-2000:])
            char = self.items.get(timeout=remaining)
            if char is None:
                raise AssertionError(self.name + ' exited before ' + pattern + '\n' + self.text[-2000:])
            self.text += char

    def send(self, text):
        raw['interactive'][self.name]['sent'].append(text)
        self.process.stdin.write(text + '\n')
        self.process.stdin.flush()

    def finish(self, timeout=15):
        code = self.process.wait(timeout=timeout)
        self.reader.join(timeout=2)
        while not self.items.empty():
            char = self.items.get_nowait()
            if char is not None:
                self.text += char
        (run / (self.name + '.log')).write_text(self.text)
        raw['interactive'][self.name]['exitCode'] = code
        return code


def junit(project):
    totals = dict(tests=0, failures=0, errors=0, skipped=0)
    for report in (project / 'build/test-results/test').glob('TEST-*.xml'):
        suite = ET.parse(report).getroot()
        for key in totals:
            totals[key] += int(suite.attrib.get(key, 0))
    return totals


def closed(port):
    with socket.socket() as client:
        client.settimeout(.5)
        return client.connect_ex(('127.0.0.1', port)) != 0


source = json.loads((OUT / 'source.json').read_text())
assert sha(ROOT / source['source']) == source['sha256']
for block in source['originalBlocks']:
    assert sha(OUT / 'original' / block['file']) == block['sha256']
original = (OUT / 'original/block-05.java').read_text()
assert (OUT / 'fixture/java/com/example/debuglab/DebugLabApplication.java').read_text() == original

try:
    project = run / 'project'
    shutil.copytree(OUT / 'fixture', project)
    gradle = [str(ROOT / 'gradlew'), '-p', str(project), '--offline', '--no-daemon', '--console=plain', '--max-workers=2']
    version, _ = command('java-version', [str(JAVA / 'bin/java'), '-version'])
    wrapper, _ = command('wrapper-version', gradle + ['--version'])
    check('original-source-preserved-added-java21', '21.0.6' in version and 'Gradle 9.8.0' in wrapper,
          {'sourceJava': 25, 'sourceExecutedAtJava25': False, 'addedJava': '21.0.6', 'wrapper': '9.8.0', 'originalJavaBytesPreserved': True})
    command('compile-record-test', gradle + ['recordRuntime', 'test'])
    cp = (project / 'classpath.txt').read_text()
    java = [str(JAVA / 'bin/java'), '-cp', cp]
    dependencies = json.loads((project / 'dependencies.json').read_text())
    assert all(sha(row['file']) == row['sha256'] for row in dependencies)
    versions = {row['coordinate'].split(':')[1]: row['coordinate'].split(':')[2] for row in dependencies}
    check('resolved-runtime-and-test-artifacts', versions['spring-boot'] == '4.1.1',
          {'artifactCount': len(dependencies), 'boot': versions['spring-boot'], 'framework': versions['spring-webmvc'],
           'tomcat': versions['tomcat-embed-core'], 'logback': versions['logback-classic'], 'junit': versions['junit-jupiter']})
    baseline_tests = junit(project)
    check('original-contract-two-junit-tests', baseline_tests == dict(tests=2, failures=0, errors=0, skipped=0), baseline_tests)
    probe, _ = command('source-probe', java + ['com.example.debuglab.SourceProbe'])
    check('source-exception-cause-and-first-app-frame',
          'TOP=java.lang.IllegalStateException:order lookup failed' in probe
          and 'TOP_FRAME=com.example.debuglab.OrderController.find' in probe
          and 'CAUSE=java.sql.SQLException:simulated database timeout' in probe and 'SOURCE_SUPPRESSED=0' in probe,
          {'top': 'java.lang.IllegalStateException', 'message': 'order lookup failed', 'firstAppFrame': 'com.example.debuglab.OrderController.find',
           'sourceLine': 29, 'cause': 'java.sql.SQLException', 'causeMessage': 'simulated database timeout', 'suppressed': 0,
           'dbCall': False, 'scope': 'source constructs a simulated exception; no JDBC/DB execution'})
    check('stack-common-frames-are-elided', '... 2 more' in probe,
          {'elidedCommonFrames': 2, 'bottomIsAutomaticRootCause': False, 'scope': 'this SourceProbe call shares two frames; HTTP stack differs'})
    info = probe.split('LEVEL_BEGIN=INFO\n')[1].split('LEVEL_END=INFO')[0]
    debug = probe.split('LEVEL_BEGIN=DEBUG\n')[1].split('LEVEL_END=DEBUG')[0]
    check('logger-level-does-not-decide-method-execution', 'D05_DEBUG_MARKER' not in info and 'D05_DEBUG_MARKER' in debug
          and 'METHOD_RESULT=OK' in info and 'METHOD_RESULT=OK' in debug,
          {'INFO': {'debugMarkerVisible': False, 'methodResult': 'OK'}, 'DEBUG': {'debugMarkerVisible': True, 'methodResult': 'OK'},
           'scope': 'additional direct Logback logger level controls; not automatic request-ID/tracing'})
    suppressed, _ = command('suppressed-probe', java + ['example.debug.SuppressedProbe'])
    check('try-with-resources-suppressed-is-not-cause', 'CAUSE_NULL=true' in suppressed and 'SUPPRESSED_COUNT=1' in suppressed,
          {'primary': 'java.lang.IllegalArgumentException:body failed', 'cause': None,
           'suppressed': ['java.lang.IllegalStateException:close failed'], 'scope': 'separate added Resource example, not OrderController/DB'})
    app = Interactive('boot-http', java + ['com.example.debuglab.DebugLabApplication', '--server.address=127.0.0.1', '--server.port=0', '--spring.output.ansi.enabled=never'])
    startup = app.until(r'Started DebugLabApplication[^\n]*\n', timeout=35)
    port = int(re.search(r'Tomcat started on port (\d+)', startup)[1])

    def request(path):
        req = urllib.request.Request(f'http://127.0.0.1:{port}' + path, headers={'Accept': 'application/json'})
        try:
            response = urllib.request.urlopen(req, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read().decode()
        row = {'path': path, 'status': response.status, 'headers': dict(response.headers), 'body': body}
        raw['http'].append(row)
        return row

    good = [request('/orders/7'), request('/orders/7')]
    bad = [request('/orders/13'), request('/orders/13')]
    malformed, missing = request('/orders/not-a-long'), request('/missing')
    check('actual-http-normal-repeat', all(row['status'] == 200 and json.loads(row['body']) == {'id': 7, 'status': 'OK'} for row in good),
          {'id': 7, 'statuses': [200, 200], 'body': {'id': 7, 'status': 'OK'}, 'scope': 'own loopback Boot, original Java at added Java21'})
    check('actual-http-simulated-failure-repeat', all(row['status'] == 500 for row in bad),
          {'id': 13, 'statuses': [500, 500], 'dbCall': False, 'messageIsSimulated': True})
    check('http-error-body-is-not-raw-server-stack', all('SQLException' not in row['body'] and 'simulated database timeout' not in row['body'] for row in bad),
          {'status': json.loads(bad[0]['body'])['status'], 'error': json.loads(bad[0]['body']).get('error'),
           'path': json.loads(bad[0]['body']).get('path'), 'keys': sorted(json.loads(bad[0]['body'])), 'exceptionClassInBody': False,
           'scope': 'actual default error JSON in this fixture; not all possible Boot configurations'})
    check('binding-400-differs-from-handler-500', malformed['status'] == 400 and missing['status'] == 404,
          {'malformedPathVariable': 400, 'missingRoute': 404, 'handlerId13': 500})
    app.process.terminate()
    app_exit = app.finish()
    check('own-http-process-and-port-closed', closed(port) and app.process.poll() is not None,
          {'processExited': True, 'portClosed': True, 'scope': 'own process terminated after observations; no existing service touched'})
    sourcefile = project / 'java/com/example/debuglab/DebugLabApplication.java'
    mutant = original.replace('if (id == 13)', 'if (id == 7)')
    assert mutant != original and mutant.replace('if (id == 7)', 'if (id == 13)') == original
    sourcefile.write_text(mutant)
    command('mutant-regression', gradle + ['test'], success=False)
    mutant_tests = junit(project)
    check('controlled-single-branch-mutation-fails-regression', mutant_tests['tests'] == 2 and mutant_tests['failures'] + mutant_tests['errors'] == 2,
          {**mutant_tests, 'changedCondition': 'id == 13 -> id == 7', 'scope': 'only private copy mutated; source intentionally simulates failure at13'})
    sourcefile.write_text(original)
    command('restored-regression', gradle + ['test'])
    restored_tests = junit(project)
    check('restored-original-regression-passes', restored_tests == baseline_tests and sourcefile.read_text() == original,
          {**restored_tests, 'originalBytesRestored': True, 'scope': 'restore original intended 7=OK/13=simulated failure, not repairing DB'})
    baseline = Interactive('debug-baseline', java + ['example.debug.DebugTarget'])
    baseline.until(r'DEBUG_READY\n')
    baseline.send('')
    assert baseline.finish() == 0
    assert 'DEBUG_RESULT=26' in baseline.text
    target = Interactive('debug-target', [str(JAVA / 'bin/java'), '-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=127.0.0.1:0', '-cp', cp, 'example.debug.DebugTarget'])
    ready = target.until(r'DEBUG_READY\n')
    debug_port = int(re.search(r'Listening for transport dt_socket at address: (\d+)', ready)[1])
    listeners, _ = command('debug-listener', ['lsof', '-nP', '-a', '-p', str(target.process.pid), '-iTCP', '-sTCP:LISTEN'])
    check('jdwp-own-loopback-ephemeral-listener', f'127.0.0.1:{debug_port}' in listeners and '*:' not in listeners,
          {'host': '127.0.0.1', 'port': 'allocated ephemeral P_DEBUG', 'suspendAtStartup': False, 'scope': 'own added DebugTarget only; no IDE/Kubernetes/user JVM attach'})
    debugger = Interactive('jdb', [str(JAVA / 'bin/jdb'), '-attach', f'127.0.0.1:{debug_port}'])
    debugger.until(r'^> ')
    debugger.send('help')
    helptext = debugger.until(r'^> ')
    assert 'eval <expr>' in helptext and 'step up' in helptext
    debugger.send('stop in example.debug.DebugTarget.inspect')
    debugger.until(r'^> ')
    target.send('')
    breakpoint = debugger.until(r'main\[1\] ')
    assert 'Breakpoint hit' in breakpoint and 'DebugTarget.inspect' in breakpoint

    def jdb(text):
        debugger.send(text)
        return debugger.until(r'main\[1\] ')

    local = jdb('locals')
    before = jdb('print example.debug.DebugTarget.counter')
    check('actual-jdb-breakpoint-and-locals', 'id = 13' in local and re.search(r'counter = 0', before) is not None,
          {'method': 'example.debug.DebugTarget.inspect', 'id': 13, 'counterBefore': 0, 'scope': 'actual JDK21 jdb CLI breakpoint, not IntelliJ UI'})
    evaluated = jdb('eval example.debug.DebugTarget.bump()')
    after = jdb('print example.debug.DebugTarget.counter')
    check('actual-jdb-evaluation-changes-target-state', 'bump() = 1' in evaluated and 'counter = 1' in after,
          {'expression': 'example.debug.DebugTarget.bump()', 'returned': 1, 'counterBefore': 0, 'counterAfter': 1,
           'scope': 'additional DebugTarget field changed by own jdb method invocation; not source OrderController or IDE UI'})
    into = jdb('step')
    into_where = jdb('where')
    out = jdb('step up')
    out_where = jdb('where')
    over = jdb('next')
    over_assignment = jdb('next')
    result = jdb('print result')
    check('actual-jdb-step-into-out-over', 'DebugTarget.compute' in into_where and 'DebugTarget.inspect' in out_where
          and 'DebugTarget.compute' not in out_where and 'result = 27' in result,
          {'stepIntoTop': 'DebugTarget.compute', 'stepUpTop': 'DebugTarget.inspect', 'stepUpCallerLine': 11,
           'firstNextBeforeResultAssignmentLine': 12, 'secondNextAfterAssignmentLine': 13, 'nextResult': 27,
           'scope': 'actual jdb step/step up/next; IDE conditional/log/exception breakpoint configurations remain model only'})
    debugger.send('cont')
    assert target.finish() == 0
    debugger.finish()
    check('evaluation-changes-later-observed-result', 'DEBUG_RESULT=27' in target.text and closed(debug_port),
          {'withoutDebuggerEvaluation': 26, 'afterBumpEvaluation': 27, 'counter': 1, 'ownDebugPortClosed': True})
    threads = Interactive('thread-target', java + ['example.debug.ThreadTarget'])
    threads.until(r'THREADS_READY\n')
    observed_states = []
    for i in range(2):
        dump, _ = command(f'thread-dump-{i+1}', [str(JAVA / 'bin/jcmd'), str(threads.process.pid), 'Thread.print'])
        states = {}
        for name in ['d05-holder', 'd05-blocked', 'd05-waiting']:
            section = re.search(r'"' + name + r'"[^\n]*\n([^\n]*)', dump)
            states[name] = re.search(r'java.lang.Thread.State: ([A-Z_]+)', section[1])[1]
        observed_states.append(states)
    check('two-own-thread-dumps-distinguish-monitor-and-latch', all(x == {'d05-holder': 'WAITING', 'd05-blocked': 'BLOCKED', 'd05-waiting': 'WAITING'} for x in observed_states),
          {'snapshots': observed_states, 'blockedReason': 'monitor held by d05-holder', 'waitingReason': 'CountDownLatch release',
           'scope': 'own controlled threads/two snapshots; not production deadlock, CPU usage, heap or latency proof'})
    threads.send('')
    check('own-thread-fixture-released-and-exited', threads.finish() == 0 and 'THREADS_DONE' in threads.text,
          {'releaseLatch': True, 'threadsJoined': True, 'exitCode': 0})
    # private Git에는 원문 사본과 한 조건 변이만 커밋한다. 판정 스크립트/출력은 저장소 밖에 둔다.
    gitdir = run / 'bisect-repo'
    gitdir.mkdir()
    command('git-init', ['git', 'init', '-b', 'lesson'], gitdir)
    commits = []
    for i in range(1, 8):
        (gitdir / 'DebugLabApplication.java').write_text(original if i < 4 else mutant)
        (gitdir / 'note.txt').write_text(f'private example commit C{i}\n')
        command(f'git-add-{i}', ['git', 'add', '.'], gitdir)
        command(f'git-commit-{i}', ['git', '-c', 'user.name=D05 Fixture', '-c', 'user.email=d05@example.invalid', 'commit', '-m', f'C{i}'], gitdir)
        commit, _ = command(f'git-head-{i}', ['git', 'rev-parse', 'HEAD'], gitdir)
        commits.append(commit.strip())
    bisect_probe = run / 'BisectProbe.java'
    bisect_probe.write_text('''package com.example.debuglab;
public class BisectProbe {
 public static void main(String[] args) {
  OrderController c = new OrderController();
  try { if (!"OK".equals(c.find(7).get("status"))) System.exit(1); }
  catch (Exception failure) { System.exit(1); }
  try { c.find(13); System.exit(1); }
  catch (IllegalStateException failure) { if (!(failure.getCause() instanceof java.sql.SQLException)) System.exit(1); }
  System.out.println("BISECT_CONTRACT_OK");
 }
}
''')
    criterion = run / 'bisect-criterion.py'
    criterion.write_text('''from pathlib import Path
import json,subprocess,sys
p=Path(__file__).resolve().parent
config=json.loads((p/'bisect-config.json').read_text())
out=p/'bisect-classes';out.mkdir(exist_ok=True)
compile=subprocess.run([config['javac'],'-parameters','-cp',config['classpath'],'-d',str(out),'DebugLabApplication.java',str(p/'BisectProbe.java')],capture_output=True,text=True)
if compile.returncode: print(compile.stderr);sys.exit(125)
r=subprocess.run([config['java'],'-cp',str(out)+':'+config['classpath'],'com.example.debuglab.BisectProbe'],capture_output=True,text=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
with (p/'bisect-predicates.jsonl').open('a') as f:f.write(json.dumps({'commit':head,'compileExit':compile.returncode,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr})+'\\n')
print('D05_PREDICATE_EXIT='+str(r.returncode));sys.exit(r.returncode)
''')
    (run / 'bisect-config.json').write_text(json.dumps({'javac': str(JAVA / 'bin/javac'), 'java': str(JAVA / 'bin/java'), 'classpath': cp}))
    command('bisect-start', ['git', 'bisect', 'start', commits[-1], commits[0]], gitdir)
    bisected, _ = command('bisect-run', ['git', 'bisect', 'run', sys.executable, str(criterion)], gitdir)
    predicates = [json.loads(line) for line in (run / 'bisect-predicates.jsonl').read_text().splitlines()]
    check('private-git-bisect-finds-controlled-first-bad', commits[3] + ' is the first bad commit' in bisected
          and all(x['compileExit'] == 0 and x['exit'] in [0, 1] for x in predicates),
          {'commits': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'], 'knownGood': 'C1', 'knownBad': 'C7', 'firstBad': 'C4',
           'branchMutation': 'id == 13 -> id == 7', 'predicate': 'same Java21/dependencies; 7=OK and13=simulated SQLException cause',
           'actualPredicateRuns': [{'commit': 'C' + str(commits.index(x['commit']) + 1), 'exit': x['exit']} for x in predicates],
           'scope': 'private source-copy history; bisect identifies contract regression boundary, not universal causal proof'})
    command('bisect-reset', ['git', 'bisect', 'reset'], gitdir)
    head, _ = command('bisect-final-head', ['git', 'rev-parse', 'HEAD'], gitdir)
    remotes, _ = command('bisect-remotes', ['git', 'remote'], gitdir)
    check('bisect-reset-preserves-own-start-and-no-remotes', head.strip() == commits[-1] and not remotes.strip(),
          {'resetTo': 'C7', 'remotes': 0, 'scope': 'own temp repository only; product worktree never bisected'})
    models = {
        'hypothesis-evidence': {'observation': 'id13 repeatedly500; original code constructs simulated cause', 'rejectedInference': 'message alone proves real DB timeout',
                                'singleVariable': 'same source/environment, compare id7 and13', 'limits': 'not measured DB pool, SQL, network, cache, latency or operating incident'},
        'ide-breakpoint-and-evaluation': {'modelOnly': ['IntelliJ conditional/exception/log breakpoint', 'All vs Thread suspension', 'IDE Evaluate'],
                                         'nativeObservedSeparately': 'jdb method breakpoint/step/step up/next/eval changed added counter', 'sameUIClaim': False},
        'incident-http-sql-boundary': {'modelOnly': ['request ID generation/propagation', 'Chrome Network UI', 'SQL/bind/plan and pool wait', 'metrics/traces/heap/Kubernetes/rollback/deploy'],
                                      'nativeObservedSeparately': ['own loopback HTTP', 'two own Thread.print snapshots'], 'noRealDBOrProductionClaim': True}
    }
    result = {'checks': checks, 'facts': facts, 'models': models}
    (run / 'execution.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    canonical = OUT / 'execution.json'
    frozen = OUT / 'checkpoints/expected-execution.json'
    if args.freeze:
        assert not frozen.exists(), '기존 기대값을 덮어쓰지 않는다.'
        frozen.parent.mkdir(exist_ok=True)
        frozen.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        canonical.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        (OUT / 'dependencies.json').write_text(json.dumps(dependencies, ensure_ascii=False, indent=2) + '\n')
    else:
        assert json.loads(frozen.read_text()) == result, '전체 frozen 결과 불일치'
    print(f'RESULT {len(checks)}CHECK {len(models)}models; runtime={run}', flush=True)
finally:
    for active in reversed(processes):
        if active.process.poll() is None:
            active.process.terminate()
            try:
                active.finish(timeout=8)
            except subprocess.TimeoutExpired:
                active.process.kill()
                active.finish(timeout=5)
        else:
            active.finish(timeout=5)
    (OUT / 'runtime-last.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n')
    (run / 'runtime.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n')
