"""추가 own HTTP exporter·실제 Prometheus·SQLite/명시 샘플의 한정 관찰."""
from pathlib import Path
import argparse, collections, datetime, hashlib, json, os, re, shutil, socket, sqlite3, subprocess, sys, tempfile, time, urllib.error, urllib.parse, urllib.request

OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--project-root', default=str(OUT.parents[3]))
parser.add_argument('--runtime-root', required=True)
parser.add_argument('--component-only', action='store_true')
parser.add_argument('--probe', action='store_true')
parser.add_argument('--freeze', action='store_true')
parser.add_argument('--prometheus-binary')
parser.add_argument('--prometheus-version')
parser.add_argument('--prometheus-sha256')
args = parser.parse_args()
ROOT = Path(args.project_root).resolve()
BASE = Path(args.runtime_root).resolve()
FIXTURE = OUT/'fixture'
EXPECTED = OUT/'checkpoints/expected-execution.json'
assert not (args.freeze and (args.probe or args.component_only)), 'component/probe mode cannot freeze'
assert not (args.component_only and args.prometheus_binary), 'component-only never runs Prometheus'
if args.freeze and EXPECTED.exists():
    raise SystemExit('frozen baseline exists; --freeze never overwrites it')
if not args.component_only:
    assert args.prometheus_binary and args.prometheus_version and args.prometheus_sha256, 'full mode requires actual Prometheus binary/version/extracted binary SHA256'
    assert re.fullmatch('[0-9a-f]{64}', args.prometheus_sha256), 'expected extracted binary SHA256 required'
os.umask(0o077)
BASE.mkdir(parents=True, exist_ok=True)
RUN = Path(tempfile.mkdtemp(prefix='run-', dir=BASE))
os.chmod(RUN, 0o700)
MODE = 'component' if args.component_only else 'probe' if args.probe else 'freeze' if args.freeze else 'replay'
RECORDS = OUT/'records'/MODE/RUN.name
RECORDS.mkdir(parents=True)
checks, facts, processes = [], {}, []
LOCAL_HTTP = urllib.request.build_opener(urllib.request.ProxyHandler({}))
raw = {'mode':MODE, 'run':str(RUN), 'commands':[], 'processes':[], 'requests':[], 'promQueries':[], 'completed':False,
       'scope':'additional own-loopback exporter; Prometheus only in full mode; no existing 8080/9090/3000 services, source Actuator/Docker/Grafana/Java25, DB or learner application'}

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

def check(name, predicate, value):
    if not predicate:
        raise AssertionError(name)
    checks.append(name)
    facts[name] = value
    print('PASS '+name, flush=True)

def command(name, argv):
    result = subprocess.run(list(map(str, argv)), cwd=RUN, stdin=subprocess.DEVNULL,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30)
    path = RUN/(name+'.log'); path.write_bytes(result.stdout)
    raw['commands'].append({'name':name,'argv':list(map(str,argv)),'exitCode':result.returncode,'log':str(path)})
    assert result.returncode==0, name+' failed; inspect '+str(path)
    return result.stdout.decode()

def wait_for(predicate, label, timeout=25):
    end = time.monotonic()+timeout
    while time.monotonic()<end:
        result = predicate()
        if result is not None and result is not False:
            return result
        time.sleep(.1)
    raise AssertionError(label+' timed out')

def port_closed(port):
    with socket.socket() as client:
        client.settimeout(.25)
        return client.connect_ex(('127.0.0.1',port))!=0

def pid_gone(pid):
    try:
        os.kill(pid,0)
        return False
    except ProcessLookupError:
        return True

def start(name, argv, port=None):
    path=RUN/(name+'.log');stream=path.open('w')
    process=subprocess.Popen(list(map(str,argv)),cwd=RUN,stdin=subprocess.DEVNULL,stdout=stream,stderr=subprocess.STDOUT)
    row={'name':name,'pid':process.pid,'argv':list(map(str,argv)),'log':str(path),'port':port,'killFallback':False}
    processes.append((process,stream,row));raw['processes'].append(row)
    return process,row

def stop(process, row):
    if 'exitCode' in row:
        return
    if process.poll() is None:
        process.terminate()
    try:
        row['exitCode']=process.wait(timeout=20)
    except subprocess.TimeoutExpired:
        row['killFallback']=True;process.kill();row['exitCode']=process.wait(timeout=5)
    row['pidGone']=pid_gone(row['pid'])
    if row['port'] is not None:
        row['portClosedWhenStopped']=port_closed(row['port'])

def start_exporter(name, port):
    info=RUN/(name+'-listener.json')
    process,row=start(name,[sys.executable,FIXTURE/'exporter.py','--port',port,'--port-file',info,'--events-file',RUN/'business-events.jsonl'])
    def ready():
        assert process.poll() is None, name+' stopped during startup'
        if not info.exists():return None
        try:d=json.loads(info.read_text())
        except ValueError:return None
        assert d['pid']==process.pid and d['host']=='127.0.0.1'
        return d
    d=wait_for(ready,name+' startup');row['port']=d['port'];assert d['port'] not in [8080,9090,3000]
    return process,row

def request(port, path, label):
    assert port not in [8080,9090,3000]
    url='http://127.0.0.1:'+str(port)+path
    try:response=LOCAL_HTTP.open(url,timeout=3)
    except urllib.error.HTTPError as error:response=error
    with response:
        row={'label':label,'url':url,'status':response.status,'headers':dict(response.headers),'body':response.read().decode()}
    raw['requests'].append(row)
    return row

def metric_values(text):
    return {match[1]:int(match[2]) for match in re.finditer(r'^(d09_\S+) (\d+)$',text,re.M)}

SELECTORS = {
 'success':'d09_business_requests_total{job="d09-extra-exporter",outcome="success"}',
 'failure':'d09_business_requests_total{job="d09-extra-exporter",outcome="failure"}',
 'excluded':'d09_business_requests_total{job="d09-extra-exporter",outcome="excluded"}',
 'valid':'d09_valid_business_requests_total{job="d09-extra-exporter"}',
 'businessSuccess':'d09_business_successes_total{job="d09-extra-exporter"}',
 'validHTTP200':'d09_valid_http_200_total{job="d09-extra-exporter"}',
}

def query(port, expression):
    response=request(port,'/api/v1/query?'+urllib.parse.urlencode({'query':expression}),'actual-prometheus-query')
    data=json.loads(response['body']);assert response['status']==200 and data['status']=='success'
    row={'expression':expression,'response':data};raw['promQueries'].append(row)
    result=data['data']['result']
    if not result:return None
    assert data['data']['resultType']=='vector' and len(result)==1
    return float(result[0]['value'][1])

def query_is(port, expression, expected):
    return wait_for(lambda: True if query(port,expression)==expected else None,expression+'='+str(expected))

try:
    meta=json.loads((OUT/'source.json').read_text());source=(ROOT/meta['source']).read_bytes()
    blocks=list(re.finditer(r'^```([^\n]*)\n(.*?)^```[ \t]*$',source.decode(),re.M|re.S))
    exact=len(blocks)==9 and all(m[1].strip()==r['language'] and m[2].encode()==(OUT/'original'/r['file']).read_bytes() and sha(OUT/'original'/r['file'])==r['sha256'] for m,r in zip(blocks,meta['originalBlocks']))
    check('original-nine-blocks-preserved-unrun',hashlib.sha256(source).hexdigest()==meta['sha256'] and exact,
          {'sourceSHA256':meta['sha256'],'lines':309,'blocks':9,'languages':dict(collections.Counter(r['language'] for r in meta['originalBlocks'])),'sourceJavaPresent':False,'sourceActuatorJava25DockerGrafanaExecuted':False,'existingServicePortsContacted':False})
    fixture_hashes=[{'file':p.relative_to(FIXTURE).as_posix(),'sha256':sha(p)} for p in sorted(FIXTURE.rglob('*')) if p.is_file()]
    check('additional-private-stdlib-runtime', (RUN.stat().st_mode&0o777)==0o700,
          {'python':sys.version.split()[0],'sqlite':sqlite3.sqlite_version,'runMode':'0700','exporterScope':'additional Python stdlib /metrics, not source Actuator','thirdPartyPythonDependencies':0,'componentOnly':args.component_only})
    exporter,export_row=start_exporter('exporter-initial',0);export_port=export_row['port']
    before_metrics=request(export_port,'/metrics','metrics-before-business')
    cases=[('success',200,True,True,'success'),('httpfail',500,False,True,'failure'),('badpayload',200,False,True,'failure'),('invalid',400,False,False,'excluded')]
    responses=[]
    for case,status,business_ok,valid,outcome in cases:
        response=request(export_port,'/business?case='+case,'business-'+case);body=json.loads(response['body']);responses.append(body)
        check('business-'+case+'-observed',response['status']==status and body['http_status']==status and body['business_ok'] is business_ok and body['valid'] is valid and body['outcome']==outcome and body['request_id']=='d09-'+case,
              {'case':case,'method':'GET','httpStatus':status,'businessOK':business_ok,'valid':valid,'outcome':outcome,'requestID':'d09-'+case,'scope':'explicit toy cases; invalid is excluded by this toy definition only'})
    events=[json.loads(line) for line in (RUN/'business-events.jsonl').read_text().splitlines()]
    timestamps_valid=all(datetime.datetime.fromisoformat(row['timestamp']).tzinfo is not None for row in events)
    check('four-json-events-correlate-with-responses',len(events)==4 and events==responses and timestamps_valid,
          {'events':4,'caseOrder':[r['case'] for r in events],'requestIDs':[r['request_id'] for r in events],'actualTimestampsPresent':True,'responseEventFieldsMatch':True,'traceOrSpanGenerated':False})
    after_metrics=request(export_port,'/metrics','metrics-after-business');metrics=metric_values(after_metrics['body'])
    outcomes={name:metrics['d09_business_requests_total{outcome="'+name+'"}'] for name in ['success','failure','excluded']}
    check('bounded-business-counter-outcomes',outcomes=={'success':1,'failure':2,'excluded':1},
          {'outcomes':outcomes,'totalBusinessRequests':sum(outcomes.values()),'metric':'d09_business_requests_total','label':'outcome','classification':'valid and business_ok => success; valid false => excluded; other valid => failure'})
    check('valid-business-versus-http200-denominator',metrics['d09_valid_business_requests_total']==3 and metrics['d09_business_successes_total']==1 and metrics['d09_valid_http_200_total']==2,
          {'allRequests':4,'valid':3,'businessSuccess':1,'validHTTP200':2,'businessFailuresAmongValid':2,'excluded':1,'scope':'only explicit toy exclusion/semantic definition; not a universal SLI policy'})
    repeat_metrics=request(export_port,'/metrics','metrics-repeat-no-business')
    check('metrics-fetch-does-not-add-business-requests',before_metrics['status']==after_metrics['status']==repeat_metrics['status']==200 and metric_values(repeat_metrics['body'])==metrics,
          {'beforeBusinessTotal':sum(metric_values(before_metrics['body']).get('d09_business_requests_total{outcome="'+name+'"}',0) for name in outcomes),'afterBusinessTotal':4,'afterRepeatedMetricsTotal':sum(outcomes.values()),'metricsGETCountsAsBusiness':False})
    labels=re.findall(r'\{([^}]*)\}',after_metrics['body'])
    check('request-id-is-log-context-not-metric-label',set(labels)=={'outcome="success"','outcome="failure"','outcome="excluded"'} and 'request_id' not in after_metrics['body'] and not any(row['request_id'] in after_metrics['body'] for row in events),
          {'exporterLabelNames':['outcome'],'exporterOutcomeValues':['success','failure','excluded'],'requestIDInMetricLabels':False,'requestIDInJSONEvents':True,'scope':'exporter-defined labels; Prometheus adds its own job/instance labels'})
    if not args.component_only:
        binary=Path(args.prometheus_binary).resolve();assert binary.is_file() and sha(binary)==args.prometheus_sha256
        version=command('prometheus-version',[binary,'--version'])
        check('actual-prometheus-binary-version-sha',('version '+args.prometheus_version) in version,
              {'version':args.prometheus_version,'binarySHA256':args.prometheus_sha256,'versionOutput':version.strip(),'scope':'actual main-provided native binary; extracted executable SHA differs from archive SHA'})
        with socket.socket() as reservation:
            reservation.bind(('127.0.0.1',0));prom_port=reservation.getsockname()[1]
        assert prom_port not in [8080,9090,3000,export_port]
        config=(FIXTURE/'prometheus-extra.yml.in').read_text().replace('__OWN_EXPORTER_PORT__',str(export_port));(RUN/'prometheus-extra.yml').write_text(config)
        prom,prom_row=start('prometheus',[binary,'--config.file='+str(RUN/'prometheus-extra.yml'),'--storage.tsdb.path='+str(RUN/'new-tsdb'),'--storage.tsdb.retention.time=1h','--web.listen-address=127.0.0.1:'+str(prom_port)],prom_port)
        def ready():
            assert prom.poll() is None,'Prometheus stopped during startup; inspect '+prom_row['log']
            return True if 'Server is ready to receive web requests' in Path(prom_row['log']).read_text() else None
        wait_for(ready,'actual Prometheus readiness')
        up='up{job="d09-extra-exporter"}'
        readiness=request(prom_port,'/-/ready','actual-prometheus-readiness');assert readiness['status']==200
        query_is(prom_port,up,1);observed_up=query(prom_port,up)
        check('prometheus-scrape-up-despite-business-failures',observed_up==1,
              {'job':'d09-extra-exporter','metricsPath':'/metrics','prometheusReadinessStatus':readiness['status'],'up':int(observed_up),'validBusinessRequests':3,'businessSuccess':1,'businessFailure':2,'scope':'actual Prometheus API; up means target scrape succeeds, not that all business requests succeed'})
        expected={'success':1,'failure':2,'excluded':1,'valid':3,'businessSuccess':1,'validHTTP200':2}
        observed={}
        for alias,expression in SELECTORS.items():
            query_is(prom_port,expression,expected[alias]);observed[alias]=int(query(prom_port,expression))
        check('actual-prometheus-query-sees-selected-counters',observed==expected,
              {'businessEvents':4,'selectedCounterValues':observed,'queries':SELECTORS,'querySource':'actual Prometheus /api/v1/query vector samples','ratesOrLongWindowSLOMeasured':False})
        stop(exporter,export_row);query_is(prom_port,up,0);stopped_up=query(prom_port,up)
        check('exporter-stop-makes-actual-scrape-up-zero',stopped_up==0 and export_row['exitCode']==0 and export_row['portClosedWhenStopped'],
              {'exporterExited':True,'ownExporterPortClosedAtStop':True,'up':int(stopped_up),'prometheusStillRunning':prom.poll() is None,'scope':'controlled own-exporter stop, not existing service or real incident'})
        restarted,restart_row=start_exporter('exporter-restarted',export_port)
        restarted_metrics=request(export_port,'/metrics','restarted-exporter-metrics');zeros=metric_values(restarted_metrics['body'])
        query_is(prom_port,up,1)
        actual_zeros={}
        for alias,expression in SELECTORS.items():
            query_is(prom_port,expression,0);actual_zeros[alias]=int(query(prom_port,expression))
        recovered_up=query(prom_port,up)
        check('restart-same-own-port-resets-counter-and-up-recovers',recovered_up==1 and restart_row['port']==export_port and all(value==0 for value in zeros.values()) and all(value==0 for value in actual_zeros.values()),
              {'sameOwnPort':True,'newExporterProcess':True,'up':int(recovered_up),'selectedCounterValues':actual_zeros,'businessRequestsAfterRestart':0,'scope':'new in-memory exporter starts at zero; old Prometheus TSDB samples are not erased'})
    sqlite=json.loads(command('sqlite-restore',[sys.executable,FIXTURE/'sqlite_restore.py',RUN/'sqlite-toy']))
    check('sqlite-backup-captures-committed-seed-row',sqlite['beforeSnapshot']==[[1,'seed']] and sqlite['rows']['snapshot']==[[1,'seed']],
          {'beforeSnapshot':sqlite['beforeSnapshot'],'snapshotRows':sqlite['rows']['snapshot'],'snapshotMethod':'sqlite3.Connection.backup','sourceSeedCommitted':True,'scope':'additional new own SQLite files, not original application DB'})
    check('sqlite-restored-snapshot-differs-from-newer-source',sqlite['rows']['source']==[[1,'seed'],[2,'later']] and sqlite['rows']['restored']==[[1,'seed']],
          {'sourceRows':sqlite['rows']['source'],'restoredRows':sqlite['rows']['restored'],'sourceCount':2,'restoredCount':1,'existingSeedPreserved':True,'sourceRowsDeleted':False,'operationalRPOOrRTOAchieved':False})
    check('sqlite-restored-integrity-and-own-connections-close',all(v=='ok' for v in sqlite['integrity'].values()) and all(sqlite['connectionsClosed'].values()),
          {'integrity':sqlite['integrity'],'connectionsClosed':sqlite['connectionsClosed'],'scope':'data/file toy integrity only; not app restart, disk failure, service recovery or timed DR test'})
    samples=json.loads(command('explicit-sample-calculations',[sys.executable,FIXTURE/'sample_calculations.py']))
    budget=samples['budget']
    check('explicit-decimal-error-budget-not-measured-traffic',all(budget[k]==v for k,v in {'valid':'10000','success':'9980','failures':'20','targetPercent':'99.9','allowedFailures':'10','remaining':'-10','burn':'2','successPercent':'99.8'}.items()) and budget['timeOnlyExample']['minutes']=='43.2',budget)
    percentile=samples['percentile']
    check('explicit-nearest-rank-vector-not-latency',percentile['vector']==[10,20,30,40,50] and percentile['p50']=={'rank':3,'value':30} and percentile['p95']=={'rank':5,'value':50},percentile)
    for process,stream,row in processes:
        stop(process,row)
    own_ports=sorted({row['port'] for _,_,row in processes})
    check('all-own-processes-and-loopback-ports-closed',all(row['exitCode']==0 and row['pidGone'] and not row['killFallback'] for _,_,row in processes) and all(port_closed(port) for port in own_ports),
          {'trackedLongRunningProcesses':len(processes),'exporterProcesses':sum(row['name'].startswith('exporter') for _,_,row in processes),'prometheusProcesses':sum(row['name']=='prometheus' for _,_,row in processes),'allExitCodes':[row['exitCode'] for _,_,row in processes],'allTrackedPIDsGone':True,'allOwnPortsClosed':True,'killFallbackUsed':False,'existingServicesTouched':False,'scope':'own exporter/Prometheus only; separate SQLite/Decimal/version commands returned0'})
    assert hashlib.sha256((ROOT/meta['source']).read_bytes()).hexdigest()==meta['sha256']
    assert fixture_hashes==[{'file':p.relative_to(FIXTURE).as_posix(),'sha256':sha(p)} for p in sorted(FIXTURE.rglob('*')) if p.is_file()]
    assert len(checks)==(17 if args.component_only else 22) and len(set(checks))==len(checks)
    if args.component_only:
        execution={'mode':'component-only','prometheusExecuted':False,'checks':checks,'facts':facts}
        write_json(OUT/'component-execution.json',execution)
    else:
        models_path=OUT/'models.json';models=json.loads(models_path.read_text()) if models_path.exists() else {}
        execution={'checks':checks,'facts':facts,'models':models}
        if args.freeze:
            assert len(models)==6 and all(model['executed'] is False for model in models.values()),'wait for six main-authored unexecuted models before freeze'
            EXPECTED.parent.mkdir(exist_ok=True)
            with EXPECTED.open('x') as stream:stream.write(json.dumps(execution,ensure_ascii=False,indent=2)+'\n')
        elif not args.probe:
            assert execution==json.loads(EXPECTED.read_text()),'whole actual execution differs from frozen baseline'
        write_json(OUT/('probe-execution.json' if args.probe else 'execution.json'),execution)
    write_json(OUT/'fixture-manifest.json',{'files':fixture_hashes,'runnerSHA256':sha(__file__)})
    raw['completed']=True
    print('COMPONENT_ONLY_MATCH; no Prometheus execution or freeze' if args.component_only else 'FULL_EXECUTION_MATCH; native22 with actual Prometheus; models remain unexecuted',flush=True)
finally:
    for process,stream,row in processes:
        stop(process,row);stream.close()
    raw['checksReached']=checks
    write_json(RUN/'runtime.json',raw)
    write_json(OUT/('component-runtime-last.json' if args.component_only else 'runtime-last.json'),raw)
    write_json(OUT/('component-status.json' if args.component_only else 'run-status.json'),{'mode':MODE,'run':str(RUN),'completed':raw['completed'],'checksReached':len(checks),'freeze':args.freeze})
    for row in raw['commands']+raw['processes']:
        shutil.copyfile(row['log'],RECORDS/Path(row['log']).name)
    for name in ['business-events.jsonl','prometheus-extra.yml']:
        if (RUN/name).exists():shutil.copyfile(RUN/name,RECORDS/name)
