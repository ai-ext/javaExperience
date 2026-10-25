"""원문 Java의 자체 로컬 JAR/HTTP 증거와 미실행 설명 모델을 구분한다."""
from pathlib import Path
import argparse, hashlib, json, os, re, shutil, socket, subprocess, tempfile, time, urllib.request, urllib.error, zipfile

OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--project-root', default=str(OUT.parents[3]))
parser.add_argument('--runtime-root', required=True)
parser.add_argument('--freeze', action='store_true')
args = parser.parse_args()
ROOT = Path(args.project_root).resolve()
JAVA = Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
base = Path(args.runtime_root).resolve()
base.mkdir(parents=True, exist_ok=True)
run = Path(tempfile.mkdtemp(prefix='run-', dir=base))
os.chmod(run, 0o700)
project = run/'project'
shutil.copytree(OUT/'fixture', project)
gradle_env = os.environ.copy()
gradle_env.update(JAVA_HOME=str(JAVA), TZ='UTC', LC_ALL='C')
java_env = {'PATH': os.environ['PATH'], 'JAVA_HOME': str(JAVA), 'TZ': 'UTC', 'LC_ALL': 'C'}
apps, checks, facts = [], [], {}
raw = {'run': str(run), 'commands': [], 'apps': [], 'requests': []}
completed = False

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def check(name, predicate, value):
    if not predicate:
        raise AssertionError(name)
    checks.append(name)
    facts[name] = value
    print('PASS '+name, flush=True)

def command(name, argv):
    r = subprocess.run(list(map(str, argv)), cwd=run, env=gradle_env, stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=180)
    log = run/(name+'.log')
    log.write_text(r.stdout+r.stderr)
    raw['commands'].append({'name': name, 'argv': list(map(str, argv)), 'exitCode': r.returncode, 'log': str(log)})
    if r.returncode:
        raise AssertionError(name+' failed; inspect '+str(log))
    return r.stdout+r.stderr

def closed(port):
    with socket.socket() as client:
        client.settimeout(.25)
        return client.connect_ex(('127.0.0.1', port)) != 0

def pid_gone(pid):
    try:
        os.kill(pid, 0)
        return False
    except ProcessLookupError:
        return True

def request(app, path, label):
    url = f'http://127.0.0.1:{app["port"]}'+path
    req = urllib.request.Request(url, headers={'Connection': 'close'})
    try:
        response = urllib.request.urlopen(req, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        row = {'label': label, 'url': url, 'status': response.status, 'headers': dict(response.headers), 'bodyText': response.read().decode()}
    raw['requests'].append(row)
    return row

def start(name, jar):
    log = run/(name+'.log')
    stream = log.open('w')
    argv = [str(JAVA/'bin/java'), '-jar', str(jar), '--server.address=127.0.0.1', '--server.port=0']
    process = subprocess.Popen(argv, cwd=run, env=java_env, stdin=subprocess.DEVNULL, stdout=stream, stderr=subprocess.STDOUT)
    app = {'name': name, 'pid': process.pid, 'jar': str(jar), 'argv': argv, 'log': str(log), 'port': None, 'killFallback': False}
    apps.append((process, stream, app))
    raw['apps'].append(app)
    end = time.monotonic()+45
    while time.monotonic()<end:
        text = log.read_text()
        port = re.search(r'Tomcat started on port (\d+)', text)
        if port and 'Started DemoApplication' in text:
            app['port'] = int(port[1])
            return process, app
        if process.poll() is not None:
            raise AssertionError(name+' stopped during startup')
        time.sleep(.05)
    raise AssertionError(name+' startup timeout')

def stop(process, app):
    if process.poll() is None:
        process.terminate()
    try:
        app['exitCode'] = process.wait(timeout=30)
    except subprocess.TimeoutExpired:
        app['killFallback'] = True
        process.kill()
        app['exitCode'] = process.wait(timeout=5)
    app['pidGone'] = pid_gone(app['pid'])
    if app['port'] is not None:
        app['portClosed'] = closed(app['port'])

try:
    source = json.loads((OUT/'source.json').read_text())
    markdown = (ROOT/source['source']).read_bytes()
    blocks = list(re.finditer(r'^```([^\n]*)\n(.*?)^```[ \t]*$', markdown.decode(), re.M|re.S))
    exact = len(blocks)==8 and all(m[1].strip()==s['language'] and m[2].encode()==(OUT/'original'/s['file']).read_bytes() for m,s in zip(blocks,source['originalBlocks']))
    java_exact = (project/'java/com/example/demo/DemoApplication.java').read_bytes()==(OUT/'original/block-04.java').read_bytes()
    docker_exact = (project/'Dockerfile').read_bytes()==(OUT/'original/block-06.Dockerfile').read_bytes()
    check('source-bodies-preserved-java25-container-unrun', sha(ROOT/source['source'])==source['sha256'] and exact and java_exact and docker_exact,
          {'sourceSHA256': source['sha256'], 'lines': 300, 'blocks': 8, 'javaByteExact': java_exact, 'dockerfileByteExact': docker_exact, 'originalJava25Executed': False, 'dockerBuildOrRunExecuted': False})
    java_version = command('java-version', [JAVA/'bin/java', '-version'])
    gradle_version = command('gradle-version', [ROOT/'gradlew', '-p', project, '--offline', '--no-daemon', '--version'])
    check('additional-java21-gradle-runtime', '21.0.6' in java_version and 'Gradle 9.8.0' in gradle_version,
          {'java': '21.0.6', 'gradle': '9.8.0', 'scope': 'additional Gradle build; original source Java unchanged, original Java25 environment unrun'})
    command('compile-bootjar', [ROOT/'gradlew', '-p', project, '--offline', '--no-daemon', '--console=plain', '--max-workers=2', 'recordRuntime', 'bootJar'])
    deps = json.loads((project/'dependencies.json').read_text())
    coordinates = [x['coordinate'] for x in deps]
    required = ['org.springframework.boot:spring-boot:4.1.1', 'org.springframework:spring-webmvc:7.0.9', 'org.apache.tomcat.embed:tomcat-embed-core:11.0.24']
    check('pinned-runtime-artifacts-and-sha', all(x in coordinates for x in required) and all(sha(x['file'])==x['sha256'] for x in deps),
          {'artifacts': len(deps), 'springBoot': '4.1.1', 'springFramework': '7.0.9', 'tomcat': '11.0.24', 'allArtifactSHA256Matched': True,
           'snapshot': [{'coordinate': x['coordinate'], 'sha256': x['sha256']} for x in deps]})
    classes = {p.name: int.from_bytes(p.read_bytes()[6:8], 'big') for p in sorted((project/'build/classes/java/main/com/example/demo').glob('*.class'))}
    check('original-java-compiled-on-added-target21', classes=={'DemoApplication.class':65, 'HealthController.class':65} and java_exact,
          {'sourceJavaByteExact': True, 'compiledSourceClasses': classes, 'classfileTargetJava': 21})
    jars = list((project/'build/libs').glob('*.jar'))
    assert len(jars)==1
    jar = jars[0]
    with zipfile.ZipFile(jar) as z:
        manifest = z.read('META-INF/MANIFEST.MF').decode()
        libs = sorted(x for x in z.namelist() if x.startswith('BOOT-INF/lib/') and x.endswith('.jar'))
        source_classes_exact = all(z.read('BOOT-INF/classes/com/example/demo/'+name)==(project/'build/classes/java/main/com/example/demo'/name).read_bytes() for name in classes)
    jar_fact = {'file':jar.name, 'bytes':jar.stat().st_size, 'sha256':sha(jar), 'nestedLibraries':len(libs), 'startClass':'com.example.demo.DemoApplication', 'sourceClassBytesExact':source_classes_exact}
    check('executable-jar-keeps-original-compiled-classes', 'Main-Class: org.springframework.boot.loader.launch.JarLauncher' in manifest and 'Start-Class: com.example.demo.DemoApplication' in manifest and source_classes_exact and len(libs)>0, jar_fact)
    raw['jar'] = {**jar_fact, 'manifest':manifest, 'nestedLibraryFiles':libs}
    copies = []
    for name in ['local-a','local-b']:
        path = run/name/'app.jar'
        path.parent.mkdir()
        shutil.copy2(jar,path)
        copies.append(path)
    check('same-jar-two-own-path-copies', all(sha(p)==jar_fact['sha256'] and p.stat().st_size==jar_fact['bytes'] for p in copies),
          {'copies':2, 'aliases':['local-a/app.jar','local-b/app.jar'], 'sameSHA256':jar_fact['sha256'], 'sameBytes':jar_fact['bytes'], 'rebuiltBetweenCopies':False})
    pa,a = start('local-a',copies[0])
    pb,b = start('local-b',copies[1])
    first = request(a,'/health','a-before-stop')
    second = request(b,'/health','b-before-stop')
    check('two-own-local-http-processes-not-two-azs', first['status']==second['status']==200 and first['bodyText']==second['bodyText']=='ok' and a['port']!=b['port'] and pa.pid!=pb.pid,
          {'processes':2,'sameMac':True,'differentAllocatedLoopbackPorts':True,'explicitProfileSelected':False,'statuses':[200,200],'bodies':['ok','ok'],'VMOrAZExperiment':False})
    missing = request(a,'/actuator/health','a-actuator-unconfigured')
    check('literal-health-is-not-actuator-or-db-diagnosis', missing['status']==404 and not any('actuator' in x for x in coordinates),
          {'manualHealthStatus':first['status'],'manualHealthBody':first['bodyText'],'actuatorHealthStatus':missing['status'],'actuatorDependencyPresent':False,'sourceChecksExternalState':False,'DBNodeRegionDiagnosticsProven':False})
    stop(pa,a)
    alive = pb.poll() is None
    remaining = request(b,'/health','b-after-a-stopped')
    check('stopping-one-local-process-leaves-other-answering', a['exitCode']==143 and a['portClosed'] and alive and remaining['status']==200 and remaining['bodyText']=='ok',
          {'stoppedAExitCode':a['exitCode'],'stoppedAPortClosed':a['portClosed'],'bAlive':alive,'bHealthStatus':remaining['status'],'bHealthBody':remaining['bodyText'],'scope':'direct request to still-running own JVM; no automatic routing/VM/AZ/HA proof'})
    stop(pb,b)
    check('all-own-http-processes-and-ports-closed', all(app['exitCode']==143 and app['portClosed'] and app['pidGone'] and not app['killFallback'] for _,_,app in apps) and all(sha(p)==jar_fact['sha256'] for p in copies),
          {'trackedLongRunningHTTPJVMs':2,'exitCodes':[app['exitCode'] for _,_,app in apps],'allPIDsGone':True,'allPortsClosed':True,'killFallbackUsed':False,'artifactCopiesUnchanged':True,'scope':'only these two HTTP JVMs; separate command JVMs exit0'})
    execution = {'checks':checks,'facts':facts,'models':json.loads((OUT/'models.json').read_text())}
    assert len(checks)==10 and len(execution['models'])==6 and all(m['executed'] is False for m in execution['models'].values())
    expected = OUT/'checkpoints/expected-execution.json'
    if args.freeze:
        assert not expected.exists(), 'frozen baseline already exists; do not overwrite'
        expected.parent.mkdir(exist_ok=True)
        expected.write_text(json.dumps(execution,ensure_ascii=False,indent=2)+'\n')
    else:
        assert execution==json.loads(expected.read_text()), 'full actual execution differs from frozen baseline'
    (OUT/'execution.json').write_text(json.dumps(execution,ensure_ascii=False,indent=2)+'\n')
    (OUT/'dependencies.json').write_text(json.dumps(deps,indent=2)+'\n')
    completed = True
    print('FULL_EXECUTION_MATCH; models6 remain unexecuted',flush=True)
finally:
    for process,stream,app in apps:
        if process.poll() is None:
            stop(process,app)
        stream.close()
    raw['completed'] = completed
    raw['checksReached'] = checks
    (run/'runtime.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')
    (OUT/'runtime-last.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')
    (OUT/'run-status.json').write_text(json.dumps({'run':str(run),'completed':completed,'checksReached':len(checks),'freeze':args.freeze},indent=2)+'\n')
