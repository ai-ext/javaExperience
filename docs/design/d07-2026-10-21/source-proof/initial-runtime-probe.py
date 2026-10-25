"""원문 Java의 두 자체 로컬 프로세스만 관찰한다. VM·컨테이너·클라우드 실험이 아니다."""
from pathlib import Path
import hashlib, json, os, re, shutil, socket, subprocess, time, urllib.request, urllib.error, zipfile

OUT = Path(__file__).resolve().parent
meta = json.loads((OUT / 'initial-probe.json').read_text())
run = Path(meta['run'])
project = run / 'project'
JAVA = Path('LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
env = {'PATH': os.environ['PATH'], 'JAVA_HOME': str(JAVA), 'TZ': 'UTC', 'LC_ALL': 'C'}
apps = []
raw = {'run': str(run), 'scope': 'two own JVMs on one Mac; no VM/container/cloud/AZ/registry action', 'apps': [], 'requests': []}

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def closed(port):
    with socket.socket() as client:
        client.settimeout(.25)
        return client.connect_ex(('127.0.0.1', port)) != 0

def request(app, path, label):
    url = f'http://127.0.0.1:{app["port"]}' + path
    req = urllib.request.Request(url, headers={'Connection': 'close'})
    try:
        response = urllib.request.urlopen(req, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        result = {'label': label, 'url': url, 'status': response.status, 'headers': dict(response.headers), 'bodyText': response.read().decode()}
    raw['requests'].append(result)
    return result

def start(name, jar):
    log = run / (name + '.log')
    stream = log.open('w')
    argv = [str(JAVA/'bin/java'), '-jar', str(jar), '--server.address=127.0.0.1', '--server.port=0']
    process = subprocess.Popen(argv, cwd=run, env=env, stdin=subprocess.DEVNULL, stdout=stream, stderr=subprocess.STDOUT)
    app = {'name': name, 'pid': process.pid, 'jar': str(jar), 'argv': argv, 'log': str(log), 'port': None}
    apps.append((process, stream, app))
    raw['apps'].append(app)
    end = time.monotonic() + 45
    while time.monotonic() < end:
        text = log.read_text()
        found = re.search(r'Tomcat started on port (\d+)', text)
        if found and 'Started DemoApplication' in text:
            app['port'] = int(found[1])
            return process, app
        if process.poll() is not None:
            raise AssertionError(name + ' stopped during startup')
        time.sleep(.05)
    raise AssertionError(name + ' startup timed out')

def stop(process, app):
    if process.poll() is None:
        process.terminate()
    try:
        app['exitCode'] = process.wait(timeout=30)
    except subprocess.TimeoutExpired:
        app['killFallback'] = True
        process.kill()
        app['exitCode'] = process.wait(timeout=5)
    if app['port'] is not None:
        app['portClosed'] = closed(app['port'])

try:
    jars = list((project/'build/libs').glob('*.jar'))
    assert len(jars) == 1
    jar = jars[0]
    with zipfile.ZipFile(jar) as z:
        raw['jar'] = {'file': jar.name, 'bytes': jar.stat().st_size, 'sha256': sha(jar),
                      'manifest': z.read('META-INF/MANIFEST.MF').decode(),
                      'nestedLibraries': sorted(x for x in z.namelist() if x.startswith('BOOT-INF/lib/') and x.endswith('.jar'))}
    raw['dependencies'] = json.loads((project/'dependencies.json').read_text())
    (OUT/'dependencies.json').write_text(json.dumps(raw['dependencies'], indent=2)+'\n')
    raw['sourceJavaByteExact'] = (project/'java/com/example/demo/DemoApplication.java').read_bytes() == (OUT/'original/block-04.java').read_bytes()
    raw['dockerfileByteExactUnexecuted'] = (project/'Dockerfile').read_bytes() == (OUT/'original/block-06.Dockerfile').read_bytes()
    raw['sourceClassMajors'] = {p.name: int.from_bytes(p.read_bytes()[6:8], 'big') for p in sorted((project/'build/classes/java/main/com/example/demo').glob('*.class'))}
    copies = []
    for name in ['local-a', 'local-b']:
        target = run/name/'app.jar'
        target.parent.mkdir()
        shutil.copy2(jar, target)
        copies.append(target)
    raw['copies'] = [{'alias': p.parent.name+'/app.jar', 'bytes': p.stat().st_size, 'sha256': sha(p)} for p in copies]
    pa, a = start('local-a', copies[0])
    pb, b = start('local-b', copies[1])
    one = request(a, '/health', 'a-before-stop')
    two = request(b, '/health', 'b-before-stop')
    missing = request(a, '/actuator/health', 'a-actuator-unconfigured')
    assert raw['sourceJavaByteExact'] and raw['dockerfileByteExactUnexecuted']
    assert one['status'] == two['status'] == 200 and one['bodyText'] == two['bodyText'] == 'ok'
    assert missing['status'] == 404 and a['port'] != b['port']
    stop(pa, a)
    raw['bAliveAfterAStopped'] = pb.poll() is None
    three = request(b, '/health', 'b-after-a-stopped')
    assert a['exitCode'] == 143 and a['portClosed'] and raw['bAliveAfterAStopped']
    assert three['status'] == 200 and three['bodyText'] == 'ok'
    stop(pb, b)
    assert b['exitCode'] == 143 and b['portClosed']
    assert all(p['sha256'] == raw['jar']['sha256'] for p in raw['copies'])
    print(json.dumps({'sourceJavaExact': True, 'dockerfileExactButUnexecuted': True,
                      'dependencies': len(raw['dependencies']), 'nestedLibraries': len(raw['jar']['nestedLibraries']),
                      'jarBytes': raw['jar']['bytes'], 'jarSHA256': raw['jar']['sha256'],
                      'classMajors': raw['sourceClassMajors'], 'recordedHTTPStatuses': [x['status'] for x in raw['requests']],
                      'bAliveAfterAStopped': raw['bAliveAfterAStopped'], 'ownHTTPExitCodes': [a['exitCode'], b['exitCode']],
                      'allOwnHTTPPortsClosed': a['portClosed'] and b['portClosed']}), flush=True)
finally:
    for process, stream, app in apps:
        if process.poll() is None:
            stop(process, app)
        stream.close()
    (run/'initial-runtime-probe.json').write_text(json.dumps(raw, indent=2)+'\n')
    (OUT/'initial-runtime-probe.json').write_text(json.dumps(raw, indent=2)+'\n')
