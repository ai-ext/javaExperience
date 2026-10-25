"""추가 JAR/loopback/router/H2 사본에서만 배포 개념의 관측 범위를 확인한다."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse, hashlib, json, os, re, shutil, socket, subprocess, tempfile, threading, time, zipfile
import urllib.request, urllib.error

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
gradle_env = os.environ.copy()
gradle_env.update(JAVA_HOME=str(JAVA), TZ='UTC', LC_ALL='C')
# 자체 Java 서버에는 필요한 공개 fixture 설정만 전달한다. 사용자 전체 환경값을 출력하거나 전달하지 않는다.
java_env = {'PATH': os.environ['PATH'], 'JAVA_HOME': str(JAVA), 'TZ': 'UTC', 'LC_ALL': 'C'}
checks, facts, apps = [], {}, []
raw = {'run': str(run), 'commands': [], 'apps': [], 'requests': []}
router, router_thread = None, None


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def check(name, predicate, value):
    if not predicate:
        raise AssertionError(name)
    checks.append(name)
    facts[name] = value
    print('PASS ' + name, flush=True)


def command(name, argv, *, env=None, timeout=180):
    result = subprocess.run(argv, cwd=run, env=env or gradle_env, capture_output=True, text=True, timeout=timeout)
    logfile = run / (name + '.log')
    logfile.write_text(result.stdout + result.stderr)
    raw['commands'].append({'name': name, 'argv': list(map(str, argv)), 'exitCode': result.returncode, 'log': str(logfile)})
    if result.returncode:
        raise AssertionError(name + '; inspect ' + str(logfile))
    return result.stdout + result.stderr


def request(port, path, method='GET', *, timeout=5, label='direct'):
    url = f'http://127.0.0.1:{port}' + path
    req = urllib.request.Request(url, method=method, data=b'' if method == 'POST' else None,
                                 headers={'Accept': 'application/json', 'Connection': 'close'})
    try:
        try:
            response = urllib.request.urlopen(req, timeout=timeout)
        except urllib.error.HTTPError as error:
            response = error
        body = response.read().decode()
        row = {'label': label, 'url': url, 'method': method, 'status': response.status,
               'headers': dict(response.headers), 'bodyText': body, 'body': json.loads(body)}
    except Exception as error:
        row = {'label': label, 'url': url, 'method': method, 'status': None,
               'errorClass': type(error).__name__, 'error': str(error)}
    raw['requests'].append(row)
    return row


def closed(port):
    with socket.socket() as client:
        client.settimeout(.5)
        return client.connect_ex(('127.0.0.1', port)) != 0


def await_condition(predicate, label, timeout=30):
    end = time.monotonic() + timeout
    while time.monotonic() < end:
        if predicate():
            return
        time.sleep(.025)
    raise AssertionError('timeout: ' + label)


class App:
    def __init__(self, name, jar, profile='local', *, system=None, options=None, environment=None):
        self.name, self.jar, self.port = name, jar, None
        self.log = run / (name + '.log')
        self.output = self.log.open('w')
        env = {**java_env, 'SPRING_PROFILES_ACTIVE': profile, 'SERVER_ADDRESS': '127.0.0.1',
               'SERVER_PORT': '0', **(environment or {})}
        argv = [str(JAVA / 'bin/java'), *(system or []), '-jar', str(jar), *(options or [])]
        self.process = subprocess.Popen(argv, cwd=run, env=env, stdout=self.output, stderr=subprocess.STDOUT)
        self.record = {'name': name, 'argv': argv, 'pid': self.process.pid, 'profile': profile,
                       'fixtureEnvironment': {k: env[k] for k in ['SPRING_PROFILES_ACTIVE', 'SERVER_ADDRESS', 'SERVER_PORT']},
                       'log': str(self.log)}
        raw['apps'].append(self.record)
        apps.append(self)

        def started():
            text = self.log.read_text()
            if self.process.poll() is not None:
                raise AssertionError(name + ' exited during startup; ' + text[-2500:])
            match = re.search(r'Tomcat started on port (\d+)', text)
            if match and 'Started DeployApplication' in text:
                self.port = int(match[1])
                return True
            return False

        await_condition(started, name + ' startup', timeout=40)
        self.record['port'] = self.port
        await_condition(lambda: self.get('/fixture/state', label='startup')['body']['readiness'] == 'ACCEPTING_TRAFFIC', name + ' ready')

    def get(self, path, method='GET', **kwargs):
        return request(self.port, path, method, label=kwargs.pop('label', self.name), **kwargs)

    def stop(self):
        if self.process.poll() is None:
            self.process.terminate()
        try:
            code = self.process.wait(timeout=25)
        except subprocess.TimeoutExpired:
            self.process.kill()
            code = self.process.wait(timeout=5)
            self.record['cleanupKillUsed'] = True
        self.output.close()
        self.record.update(exitCode=code, portClosed=closed(self.port) if self.port else None)
        return code


def slow_request(app, name):
    result = {}
    worker = threading.Thread(target=lambda: result.update(request(app.port, '/slow', timeout=35, label=name)), daemon=True)
    worker.start()
    return worker, result


source = json.loads((OUT / 'source.json').read_text())
assert sha(ROOT / source['source']) == source['sha256']
for block in source['originalBlocks']:
    assert sha(OUT / 'original' / block['file']) == block['sha256']
assert (OUT / 'original/block-04.gradle').read_text() in (OUT / 'fixture/build.gradle').read_text()
assert (OUT / 'original/block-05.yaml').read_bytes() == (OUT / 'fixture/resources/application.yaml').read_bytes()

try:
    project = run / 'project'
    shutil.copytree(OUT / 'fixture', project)
    gradle = [str(ROOT / 'gradlew'), '-p', str(project), '--offline', '--no-daemon', '--console=plain', '--max-workers=2']
    version = command('java-version', [str(JAVA / 'bin/java'), '-version'], env=java_env)
    wrapper = command('wrapper-version', gradle + ['--version'])
    check('source-fragments-preserved-added-java21', '21.0.6' in version and 'Gradle 9.8.0' in wrapper,
          {'originalJava': 25, 'originalPort': 8080, 'originalAppProvided': False, 'sourceActuatorBlockPreserved': True,
           'sourceYaml20sPreserved': True, 'addedJava': '21.0.6', 'wrapper': '9.8.0', 'scope': 'all Java/bootstrap/router/schema are added fixtures'})
    command('build-artifact-a', gradle + ['-PproofVersion=1.0.0', 'recordRuntime', 'bootJar'])
    dependencies = json.loads((project / 'dependencies.json').read_text())
    assert all(sha(x['file']) == x['sha256'] for x in dependencies)
    coordinates = {x['coordinate'].split(':')[1]: x['coordinate'].split(':')[2] for x in dependencies}
    check('actual-pinned-runtime-and-separate-h2', coordinates['spring-boot'] == '4.1.1' and coordinates['h2'] == '2.4.240',
          {'artifacts': len(dependencies), 'runtimeArtifacts': sum(x['scope'] == 'runtimeClasspath' for x in dependencies),
           'proofArtifacts': sum(x['scope'] == 'proofRuntime' for x in dependencies), 'boot': coordinates['spring-boot'],
           'framework': coordinates['spring-webmvc'], 'tomcat': coordinates['tomcat-embed-core'], 'h2': coordinates['h2'],
           'scope': 'H2 is separate proofRuntime, not app DB/health or packaged dependency'})
    artifacts = run / 'artifacts'
    artifacts.mkdir()
    jar_a = artifacts / 'A-1.0.0.jar'
    shutil.copy2(project / 'build/libs/d06-deploy-proof-1.0.0.jar', jar_a)
    hash_a = sha(jar_a)
    with zipfile.ZipFile(jar_a) as archive:
        entries = archive.namelist()
        yaml = archive.read('BOOT-INF/classes/application.yaml')
    check('actual-executable-jar-preserves-source-yaml', yaml == (OUT / 'original/block-05.yaml').read_bytes()
          and 'BOOT-INF/classes/example/deploy/DeployApplication.class' in entries and not any('/h2-' in name for name in entries),
          {'sha256': hash_a, 'bytes': jar_a.stat().st_size, 'sourceTimeout': '20s', 'bootLayout': True, 'h2Packaged': False})
    copies = []
    for name in ['local-label', 'stg-label']:
        target = run / 'environment-copies' / name / 'app.jar'
        target.parent.mkdir(parents=True)
        shutil.copy2(jar_a, target)
        copies.append(target)
    blue = App('blue-a-local', copies[0])
    green_a = App('green-a-stg', copies[1], 'stg', options=['--demo.feature=true'])
    blue_state, green_state = blue.get('/fixture/state')['body'], green_a.get('/fixture/state')['body']
    check('same-jar-two-profile-labels', all(sha(x) == hash_a for x in copies)
          and blue_state['greeting'] == 'from-local' and green_state['greeting'] == 'from-stg'
          and blue_state['artifact'] == green_state['artifact'] == '1.0.0',
          {'sameJarSHA256': hash_a, 'local': blue_state, 'stg': green_state,
           'scope': 'two own JVM/profile labels on one computer; not real staging/production promotion'})
    precedence = App('precedence-a', jar_a, system=['-Ddemo.greeting=from-system'],
                     options=['--demo.greeting=from-cli'], environment={'DEMO_GREETING': 'from-env'})
    precedence_state = precedence.get('/fixture/state')['body']
    tiers = [row['tier'] for row in precedence_state['greetingSources']]
    check('external-greeting-source-precedence', precedence_state['greeting'] == 'from-cli'
          and tiers == ['CLI', 'system', 'environment', 'profile-local', 'base-properties'],
          {'selected': precedence_state['greeting'], 'sourcesHighToLow': precedence_state['greetingSources'],
           'profile': precedence_state['profiles'], 'scope': 'same demo.greeting conflict; active profile selects config and is a separate role'})
    precedence.stop()
    off, on = blue.get('/feature'), green_a.get('/feature')
    check('deployed-artifact-and-feature-release-differ', off['status'] == 404 and on['status'] == 200
          and off['body']['artifact'] == on['body']['artifact'] == '1.0.0',
          {'sameArtifact': '1.0.0', 'flagOff': {'status': off['status'], 'released': off['body']['released']},
           'flagOn': {'status': on['status'], 'released': on['body']['released']},
           'scope': 'startup flag differs between own JVMs, not hot runtime toggle/provider/cohort service'})
    green_a.stop()
    command('build-artifact-b', gradle + ['-PproofVersion=2.0.0', 'bootJar'])
    jar_b = artifacts / 'B-2.0.0.jar'
    shutil.copy2(project / 'build/libs/d06-deploy-proof-2.0.0.jar', jar_b)
    hash_b = sha(jar_b)
    check('versioned-artifact-b-does-not-rebuild-a', hash_b != hash_a and sha(jar_a) == hash_a,
          {'artifactA': {'version': '1.0.0', 'sha256': hash_a, 'bytes': jar_a.stat().st_size},
           'artifactB': {'version': '2.0.0', 'sha256': hash_b, 'bytes': jar_b.stat().st_size},
           'scope': 'B changes fixture version/default business property; no repository/registry deployment'})
    green_b = App('green-b-stg', jar_b, 'stg', options=['--demo.feature=true'])
    health, readiness, business = green_b.get('/actuator/health'), green_b.get('/actuator/health/readiness'), green_b.get('/business')
    check('health-up-does-not-test-business-success', health['status'] == readiness['status'] == 200
          and health['body']['status'] == 'UP' and business['status'] == 500,
          {'artifact': '2.0.0', 'health': health['body'], 'readiness': readiness['body'], 'businessStatus': 500,
           'businessBody': business['body'], 'scope': 'fixture business default false; default availability indicator has no business check'})
    routing = {'schedule': ['blue'], 'position': 0, 'guardReadiness': True}
    targets = {'blue': blue.port, 'green': green_b.port}

    class Router(BaseHTTPRequestHandler):
        def do_GET(self):
            schedule = routing['schedule']
            alias = schedule[routing['position'] % len(schedule)]
            routing['position'] += 1
            if routing['guardReadiness']:
                ready = request(targets[alias], '/actuator/health/readiness', label='router-readiness-' + alias)
                if ready['status'] != 200:
                    self.respond(503, {'route': alias, 'reason': 'readiness refused', 'readinessStatus': ready['status']})
                    return
            response = request(targets[alias], self.path, label='router-forward-' + alias)
            self.respond(response['status'] or 502, {'route': alias, 'backendStatus': response['status'], 'body': response.get('body')})

        def respond(self, status, value):
            body = json.dumps(value).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            pass

    router = ThreadingHTTPServer(('127.0.0.1', 0), Router)
    router_port = router.server_port
    router_thread = threading.Thread(target=router.serve_forever, daemon=True)
    router_thread.start()
    route_blue = request(router_port, '/business', label='router-blue-baseline')
    routing.update(schedule=['green'], position=0)
    route_green = request(router_port, '/business', label='router-green-switch')
    routing.update(schedule=['blue'], position=0)
    route_rollback = request(router_port, '/business', label='router-blue-rollback')
    check('toy-route-switch-and-rollback', [route_blue['status'], route_green['status'], route_rollback['status']] == [200, 500, 200],
          {'routes': ['blue', 'green', 'blue'], 'artifacts': ['1.0.0', '2.0.0', '1.0.0'], 'statuses': [200, 500, 200],
           'artifactARebuilt': False, 'scope': 'own Python loopback router; not DNS/LB/Kubernetes/production blue-green or zero downtime proof'})
    blue.get('/__fixture/readiness/refuse', 'POST')
    all_health, live, ready, direct = (blue.get(path) for path in ['/actuator/health', '/actuator/health/liveness', '/actuator/health/readiness', '/business'])
    guarded = request(router_port, '/business', label='router-readiness-guarded')
    routing['guardReadiness'] = False
    bypassed = request(router_port, '/business', label='router-readiness-bypassed')
    check('readiness-is-signal-not-direct-request-blocking', all_health['status'] == ready['status'] == 503
          and live['status'] == 200 and direct['status'] == bypassed['status'] == 200 and guarded['status'] == 503,
          {'readinessState': 'REFUSING_TRAFFIC', 'globalHealth': {'status': all_health['status'], 'body': all_health['body']},
           'liveness': {'status': live['status'], 'body': live['body']}, 'readiness': {'status': ready['status'], 'body': ready['body']},
           'directBusiness': 200, 'routerGuarded': 503, 'routerBypassed': 200,
           'scope': 'application publication alone does not enforce HTTP exclusion; own router must read the signal'})
    blue.get('/__fixture/readiness/accept', 'POST')
    routing.update(guardReadiness=True, schedule=['blue'], position=0)
    accepted = request(router_port, '/business', label='router-readiness-restored')
    check('readiness-restored-without-restarting-app', blue.get('/actuator/health/readiness')['status'] == 200 and accepted['status'] == 200,
          {'readinessState': 'ACCEPTING_TRAFFIC', 'routerStatus': 200, 'appRestarted': False})
    routing.update(schedule=['blue'] * 7 + ['green'] * 3, position=0)
    batch = [request(router_port, '/business', label='finite-canary-' + str(i + 1)) for i in range(10)]
    observations = [{'route': row['body']['route'], 'artifact': row['body']['body']['artifact'], 'status': row['status']} for row in batch]
    check('finite-scheduled-canary-not-general-error-probability', [x['route'] for x in observations] == ['blue'] * 7 + ['green'] * 3
          and [x['status'] for x in observations] == [200] * 7 + [500] * 3,
          {'schedule': ['blue'] * 7 + ['green'] * 3, 'observations': observations, 'requests': 10, 'observedFailures': 3,
           'scope': 'deterministic toy schedule/finite observations; no random population estimate, performance benchmark or recommended production ratio'})
    routing.update(schedule=['blue'], position=0)
    after_stop = request(router_port, '/business', label='canary-stop-to-blue')
    check('fixture-stop-rule-restores-blue-route', after_stop['status'] == 200 and after_stop['body']['route'] == 'blue'
          and green_b.get('/business')['status'] == 500,
          {'fixtureRule': 'any observed500 stops expansion', 'afterStopRoute': 'blue', 'afterStopStatus': 200,
           'greenDirectStatus': 500, 'scope': 'route change did not fix B property/data or undo external side effects'})
    router.shutdown()
    router.server_close()
    router_thread.join(timeout=5)
    router = None
    check('own-router-socket-closed', closed(router_port) and not router_thread.is_alive(), {'socketClosed': True, 'threadJoined': True})
    enter, release = run / 'drain-entered.txt', run / 'drain-release.txt'
    drain = App('graceful-drain-a', jar_a, options=['--demo.enter-file=' + str(enter), '--demo.release-file=' + str(release)])
    drain_state = drain.get('/fixture/state')['body']
    worker, completion = slow_request(drain, 'slow-drain')
    await_condition(enter.exists, 'slow request entered')
    drain.process.terminate()
    await_condition(lambda: 'Commencing graceful shutdown' in drain.log.read_text(), 'graceful shutdown commenced')
    waiting_while_gate_held = drain.process.poll() is None and not release.exists()
    release.write_text('release\n')
    drain_exit = drain.process.wait(timeout=25)
    worker.join(timeout=5)
    drain.stop()
    check('own-inflight-request-drains-after-sigterm', drain_state['shutdownTimeout'] == '20s' and waiting_while_gate_held
          and completion.get('status') == 200 and completion['body']['slow'] == 'completed'
          and not worker.is_alive() and closed(drain.port),
          {'sourceTimeout': '20s', 'requestEnteredBeforeSignal': True, 'signal': 'SIGTERM', 'waitingBeforeReleaseObserved': True,
           'releasedAfterShutdownCommenced': True, 'inflightStatus': completion['status'], 'body': completion['body'],
           'processExitCode': drain_exit, 'portClosed': True, 'scope': 'one controlled own request, not all background jobs/connections or production SLA'})
    timeout_enter, timeout_release = run / 'timeout-entered.txt', run / 'timeout-release.txt'
    bounded = App('timeout-one-second-a', jar_a, options=['--spring.lifecycle.timeout-per-shutdown-phase=1s',
                  '--demo.enter-file=' + str(timeout_enter), '--demo.release-file=' + str(timeout_release)])
    timeout_state = bounded.get('/fixture/state')['body']
    timeout_worker, timeout_result = slow_request(bounded, 'slow-timeout')
    await_condition(timeout_enter.exists, 'timeout request entered')
    bounded.process.terminate()
    timeout_exit = bounded.process.wait(timeout=25)
    timeout_worker.join(timeout=5)
    bounded.stop()
    check('explicit-timeout-variant-does-not-guarantee-completion', timeout_state['shutdownTimeout'] == '1s'
          and timeout_result.get('status') != 200 and not timeout_release.exists() and not timeout_worker.is_alive(),
          {'artifactSourceTimeout': '20s', 'addedCliOverride': '1s', 'gateReleased': False,
           'completed200': False, 'processExitCode': timeout_exit, 'portClosed': closed(bounded.port),
           'scope': 'specific own bounded fixture; raw exception/status retained outside canonical, no universal supervisor timing claim'})
    cp = (project / 'proof-classpath.txt').read_text()
    schema_output = command('h2-schema-proof', [str(JAVA / 'bin/java'), '-cp', cp, 'example.deploy.SchemaProof'], env=java_env)
    schema = dict(line.split('=', 1) for line in schema_output.splitlines() if '=' in line)
    check('separate-memory-schema-expand-keeps-old-query', schema['AUTOCOMMIT'] == 'true'
          and schema['BASE_OLD'] == schema['EXPAND_OLD'] == schema['BACKFILL_OLD'] == 'Ada  Lovelace',
          {'db': 'H2 2.4.240 in-memory', 'autoCommit': True, 'rows': 1, 'oldFullName': schema['BASE_OLD'],
           'originalLength': int(schema['BASE_LENGTH']), 'expandOldQuery': schema['EXPAND_OLD'],
           'backfillGiven': 'Ada', 'backfillFamily': 'Lovelace', 'backfillOldQuery': schema['BACKFILL_OLD'],
           'scope': 'separate manual seed/backfill, not application DB, universal name splitting, MySQL/Flyway or online migration'})
    check('contract-breaks-old-column-query', schema['CONTRACT_OLD_SQLSTATE'] == '42S22',
          {'removedColumn': 'full_name', 'oldQuerySqlState': schema['CONTRACT_OLD_SQLSTATE'],
           'scope': 'old SELECT fails after own H2 column drop; route/app rollback does not recreate schema'})
    check('down-ddl-does-not-restore-lossy-data', schema['DOWN_RECREATED'] == 'Ada Lovelace'
          and schema['ORIGINAL_BYTES_RESTORED'] == 'false' and schema['ROW_COUNT'] == '1'
          and schema['OWN_MEMORY_CONNECTION_CLOSED'] == 'true',
          {'original': schema['BASE_OLD'], 'originalLength': int(schema['BASE_LENGTH']),
           'recreated': schema['DOWN_RECREATED'], 'recreatedLength': int(schema['DOWN_LENGTH']), 'originalRestored': False,
           'rowCount': 1, 'ownConnectionClosed': True, 'scope': 'specific manual normalization lost one space; down DDL executable is not data-equality proof'})
    for app in apps:
        app.stop()
    check('all-own-jvms-and-target-ports-closed', all(app.process.poll() is not None and closed(app.port) for app in apps)
          and sha(jar_a) == hash_a and all(sha(x['file']) == x['sha256'] for x in dependencies),
          {'ownJvmCount': len(apps), 'exitCodes': [app.process.returncode for app in apps], 'allPortsClosed': True,
           'artifactAUnchanged': True, 'dependencyBytesUnchanged': True, 'sourceFixtureUntouched': True,
           'scope': 'native proof JVMs/router only; separate learning preview can remain running'})
    models = {
        'environments-and-promotion': {'modelOnly': ['local/dev/QA/stg/prod responsibilities', 'approval/freeze/hotfix/launch decisions'],
                                     'nativeSubset': 'same A JAR copied to two own profile-labeled paths and launched locally', 'notRealProduction': True},
        'strategies-and-platform-responsibilities': {'modelOnly': ['Rolling capacity/maxUnavailable/maxSurge', 'real LB/DNS/Kubernetes Service/Gateway weights', 'nohup/systemd/container/PaaS lifecycle'],
                                                   'nativeSubset': 'own finite Python route changes and startup flag', 'noZeroDowntimeOrSlaClaim': True},
        'rollback-and-incomplete-evidence': {'modelOnly': ['session/message compatibility', 'real external side-effect compensation', 'general canary confidence/observability thresholds'],
                                             'nativeSubset': 'finite10 requests, own route rollback, separate H2 lossy manual example', 'noUniversalDataRecoveryOrPerformanceClaim': True}
    }
    result = {'checks': checks, 'facts': facts, 'models': models}
    encoded = json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + '\n'
    (run / 'execution.json').write_text(encoded)
    expected = OUT / 'checkpoints/expected-execution.json'
    if args.freeze:
        assert not expected.exists(), '기존 기대값을 덮어쓰지 않는다.'
        expected.parent.mkdir(exist_ok=True)
        expected.write_text(encoded)
        (OUT / 'execution.json').write_text(encoded)
        (OUT / 'dependencies.json').write_text(json.dumps(dependencies, ensure_ascii=False, indent=2) + '\n')
    else:
        assert json.loads(expected.read_text()) == result, '전체 frozen 결과 불일치'
    print(f'RESULT {len(checks)}CHECK {len(models)}models; runtime={run}', flush=True)
finally:
    if router is not None:
        router.shutdown()
        router.server_close()
        if router_thread is not None:
            router_thread.join(timeout=5)
    for app in apps:
        app.stop()
    (OUT / 'runtime-last.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n')
    (run / 'runtime.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2) + '\n')
