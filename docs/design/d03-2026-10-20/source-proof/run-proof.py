"""원문 메모리 API와 실제 springdoc 설명을 추가 Java21/loopback 환경에서 관찰한다."""
from pathlib import Path
import argparse,hashlib,http.client,json,os,re,shutil,socket,subprocess,tempfile,time,uuid
from urllib.parse import urlsplit

OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
JAVA=Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
p=argparse.ArgumentParser();p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
run=Path(tempfile.mkdtemp(prefix='run-',dir=runtime));os.chmod(run,0o700)
checks=[];facts={};processes=[];raw={'run':str(run),'requests':[],'processes':[]}

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def check(id,ok,value):
    if not ok:raise AssertionError(id)
    checks.append(id);facts[id]=json.loads(json.dumps(value));print('PASS '+id,flush=True)
def command(arguments,label):
    env=os.environ.copy();env.update(JAVA_HOME=str(JAVA),TZ='UTC',LC_ALL='C')
    r=subprocess.run(arguments,cwd=run,env=env,capture_output=True,text=True,timeout=120)
    (run/(label+'.log')).write_text(r.stdout+r.stderr)
    if r.returncode:raise AssertionError(label+' failed; inspect private raw log')
    return r
def start(label):
    logfile=run/(label+'.log');stream=logfile.open('w')
    proc=subprocess.Popen([str(JAVA/'bin/java'),'-cp',(project/'classpath.txt').read_text(),'example.tasks.TasksApplication',
        '--server.address=127.0.0.1','--server.port=0','--spring.main.banner-mode=off'],
        cwd=run,stdout=stream,stderr=subprocess.STDOUT)
    processes.append((proc,stream,logfile));deadline=time.monotonic()+40
    while time.monotonic()<deadline:
        match=re.search(r'Tomcat started on port (\d+)',logfile.read_text())
        if match:
            port=int(match.group(1));raw['processes'].append({'label':label,'pid':proc.pid,'port':port});return proc,port
        if proc.poll()is not None:raise AssertionError('Boot ended before ready')
        time.sleep(.05)
    raise AssertionError('Boot ready deadline')
def stop(proc):
    if proc.poll()is None:proc.terminate()
    try:proc.wait(timeout=15)
    except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=5)
def request(port,method,path,payload=None,headers=None):
    h={'Accept':'application/json'};h.update(headers or {})
    if isinstance(payload,dict):payload=json.dumps(payload,ensure_ascii=False).encode();h.setdefault('Content-Type','application/json')
    elif isinstance(payload,str):payload=payload.encode()
    c=http.client.HTTPConnection('127.0.0.1',port,timeout=8)
    try:
        c.request(method,path,body=payload,headers=h);r=c.getresponse();body=r.read().decode();response={'method':method,'path':path,'status':r.status,'headers':dict((k.lower(),v)for k,v in r.getheaders()),'body':body}
        try:response['json']=json.loads(body)
        except json.JSONDecodeError:pass
        raw['requests'].append(response);return response
    finally:c.close()

meta=json.loads((OUT/'source.json').read_text());assert sha(ROOT/meta['source'])==meta['sha256']
for b in meta['originalBlocks']:assert sha(OUT/'original'/b['file'])==b['sha256']
assert(OUT/'original/block-05.java').read_bytes()==(OUT/'fixture/java/example/tasks/TaskExample.java').read_bytes()
try:
    version=command([str(JAVA/'bin/java'),'-version'],'java-version');assert '"21.0.6"'in version.stderr
    project=run/'project';shutil.copytree(OUT/'fixture',project)
    command([str(ROOT/'gradlew'),'-p',str(project),'--offline','--no-daemon','--console=plain','recordRuntime'],'compile')
    shutil.copyfile(run/'compile.log',OUT/'compile.log');deps=json.loads((project/'dependencies.json').read_text());assert all(sha(x['file'])==x['sha256']for x in deps)
    (OUT/'dependencies.json').write_text(json.dumps(deps,indent=2)+'\n')
    coords={x['coordinate'].split(':')[1]:x['coordinate'].split(':')[2]for x in deps}
    first,port=start('boot-first')
    check('source-java-byteexact-extra-loopback-runtime',coords['spring-boot']=='4.1.1'and coords['springdoc-openapi-starter-webmvc-ui']=='3.1.1',
        {'sourceJavaByteExact':True,'java':'21.0.6','boot':coords['spring-boot'],'spring':coords['spring-core'],'tomcat':coords['tomcat-embed-core'],
         'springdoc':coords['springdoc-openapi-starter-webmvc-ui'],'bind':'127.0.0.1','scope':'extra bootstrap/Java21/Gradle/-parameters/port0; not source Java25/8080/Initializr full setup'})
    collection='/api/v1/tasks';title='배포 점검';key={'Idempotency-Key':'d03-public-demo-key'}
    created=request(port,'POST',collection,{'title':title},key);task=created.get('json',{});identifier=task.get('id');parsed=uuid.UUID(identifier)
    check('source-create-201-location-and-body',created['status']==201 and task['title']==title and parsed.version==4 and created['headers'].get('location')==collection+'/'+identifier,
        {'status':created['status'],'locationMatchesBodyId':True,'uuidVersion':parsed.version,'responseFields':sorted(task),'title':task['title'],'resourceAlias':'T1','scope':'T1 is this run actual random UUID alias, raw UUID retained separately'})
    found=request(port,'GET',collection+'/'+identifier);again=request(port,'GET',collection+'/'+identifier)
    check('source-get-repeated-same-representation',found['status']==again['status']==200 and found.get('json')==again.get('json')==task,
        {'statuses':[found['status'],again['status']],'sameIdAndTitle':True,'resourceAlias':'T1','scope':'these two reads of one fixture, not load/concurrency proof'})
    repeated=request(port,'POST',collection,{'title':title},key)
    check('source-post-same-key-still-new-resource',repeated['status']==201 and repeated['json']['id']!=identifier,
        {'statuses':[created['status'],repeated['status']],'differentIds':True,'sameBody':True,'sameAddedHeader':'Idempotency-Key','aliases':['T1','T2'],'scope':'source has no idempotency-key implementation; a header alone does not deduplicate'})
    missing_id='00000000-0000-0000-0000-000000000000';missing=request(port,'GET',collection+'/'+missing_id);problem=missing.get('json',{})
    check('source-not-found-problem-detail',missing['status']==404 and problem.get('status')==404 and problem.get('type')=='https://api.example.test/problems/task-not-found'and problem.get('title')=='Task not found'and missing['headers'].get('content-type','').startswith('application/problem+json'),
        {'status':missing['status'],'contentType':missing['headers']['content-type'],'problem':problem,'scope':'original TaskNotFound advice; problem type URI is an identifier, not fetched'})
    results={}
    for label,payload in [('missing',{}),('null',{'title':None}),('blank',{'title':'   '})]:results[label]=request(port,'POST',collection,payload)['status']
    check('source-notblank-rejects-missing-null-blank',all(v==400 for v in results.values()),{'statuses':results,'scope':'Bean Validation; custom 404 advice does not itself handle these errors'})
    spaces='  배포 점검  ';padded=request(port,'POST',collection,{'title':spaces})
    check('source-notblank-does-not-trim-title',padded['status']==201 and padded['json']['title']==spaces,
        {'status':padded['status'],'storedResponseTitle':padded['json']['title'],'whitespacePreserved':True,'scope':'validation is not normalization; no DB storage involved'})
    malformed=request(port,'POST',collection,'{"title":',{'Content-Type':'application/json'})
    check('source-malformed-json-400',malformed['status']==400,{'status':malformed['status'],'scope':'HTTP message conversion, not NotBlank business validation'})
    media=request(port,'POST',collection,'hello',{'Content-Type':'text/plain'})
    check('source-unsupported-media-type-415',media['status']==415,{'status':media['status'],'requestContentType':'text/plain'})
    badid=request(port,'GET',collection+'/not-a-uuid')
    check('source-invalid-path-uuid-400',badid['status']==400,{'status':badid['status'],'pathId':'not-a-uuid','scope':'path conversion before TaskNotFound map lookup'})
    method=request(port,'GET',collection)
    check('source-collection-get-not-implemented-405',method['status']==405 and'POST'in method['headers'].get('allow',''),
        {'status':method['status'],'allow':method['headers'].get('allow'),'scope':'sample implements POST collection and GET item; no list API'})
    filtered=request(port,'GET',collection+'/'+identifier+'?status=closed&limit=1')
    check('source-query-does-not-add-filter-pagination',filtered['status']==200 and filtered.get('json')==task,
        {'status':filtered['status'],'sameTask':True,'addedQuery':'status=closed&limit=1','scope':'sample ignores these extra query parameters; no filter/page contract implemented'})
    description=request(port,'GET','/v3/api-docs');spec=description.get('json',{});paths=spec.get('paths',{});post=paths.get(collection,{}).get('post',{});response_codes=sorted(post.get('responses',{}))
    check('actual-openapi-document-available',description['status']==200 and collection in paths and collection+'/{taskId}'in paths,
        {'status':description['status'],'openapiVersion':spec.get('openapi'),'paths':sorted(paths),'postResponseCodes':response_codes,'scope':'actual generated springdoc description, not Swagger browser rendering'})
    check('actual-openapi-status-compared-to-runtime',created['status']==201 and response_codes==['200'],
        {'actualCreateStatus':created['status'],'documentedResponseCodes':response_codes,'documentsActual201':'201'in response_codes,'statusMismatch':'201'not in response_codes,'scope':'observed mismatch in this pinned fixture; PASS records reproduction, not contract agreement; original source unchanged'})
    schemas=spec.get('components',{}).get('schemas',{});create_schema=schemas.get('CreateTask',{});task_schema=schemas.get('Task',{})
    check('actual-openapi-schema-observed',bool(create_schema)and bool(task_schema),
        {'createTaskSchema':create_schema,'taskSchema':task_schema,'requestBodyRequired':post.get('requestBody',{}).get('required'),'scope':'actual generated schemas; not assumed equal to all runtime validation behavior'})
    check('actual-openapi-minlength-is-not-notblank-policy',create_schema['properties']['title'].get('minLength')==1 and len('   ')>=1 and results['blank']==400,
        {'documentedMinLength':create_schema['properties']['title']['minLength'],'extraBlankSampleLength':len('   '),'lengthPredicatePasses':len('   ')>=create_schema['properties']['title']['minLength'],'actualBlankRequestStatus':results['blank'],'scope':'extra length predicate compared with actual source validation; not a full JSON Schema validator'})
    swagger=request(port,'GET','/swagger-ui.html',headers={'Accept':'text/html'});location=swagger['headers'].get('location','');swagger_path=urlsplit(location).path
    static=request(port,'GET',swagger_path,headers={'Accept':'text/html'})if swagger_path else None
    check('actual-swagger-redirect-and-html',swagger['status']in[301,302,303,307,308]and static is not None and static['status']==200 and'Swagger UI'in static['body'],
        {'redirectStatus':swagger['status'],'redirectPath':swagger_path,'htmlStatus':static['status'],'scope':'HTTP/static HTML only, browser UI/JS/try-it-out not executed'})
    raw['uuidAliases']={'T1':identifier,'T2':repeated['json']['id']};raw['openapi']=spec
    stop(first);second,second_port=start('boot-restarted');after=request(second_port,'GET',collection+'/'+identifier)
    check('source-memory-resource-lost-after-process-restart',after['status']==404 and second.pid!=first.pid,
        {'beforeStatus':found['status'],'afterRestartStatus':after['status'],'differentProcess':True,'resourceAlias':'T1','scope':'source in-memory map; not DB rollback or data migration'})
finally:
    for proc,stream,logfile in reversed(processes):
        stop(proc);stream.close();shutil.copyfile(logfile,OUT/logfile.name)
    (OUT/'runtime-last.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2)+'\n')

closed=[]
for item in raw['processes']:
    try:socket.create_connection(('127.0.0.1',item['port']),timeout=1).close();closed.append(False)
    except OSError:closed.append(True)
check('private-boot-processes-and-ports-closed',len(processes)==2 and all(proc.poll()is not None for proc,_,_ in processes)and all(closed),
    {'processesEnded':2,'portsClosed':2,'scope':'only own subprocesses; existing user services unchanged'})
old_payload={'id':'T1','title':'배포 점검'};added_payload={**old_payload,'priority':'normal'}
models={
 'consumer-evolution':{'kind':'added Python contract model','oldFields':sorted(old_payload),'newFields':sorted(added_payload),'strictKnownFieldsAccept':set(added_payload)<=set(old_payload),'tolerantKnownFieldsAccept':set(old_payload)<=set(added_payload),'newRequiredInputAcceptedByOldRequest':{'title','priority'}<=set({'title':'배포 점검'}),'scope':'set comparison model; not actual client/Jackson configuration/production consumer'},
 'http-semantics':{'kind':'source/literature distinction','GET':'safe/idempotent intent','POST':'not generally idempotent','DELETE':'idempotent intended effect does not require identical responses','scope':'no source PUT/DELETE implementation or distributed idempotency store'},
 'delivery-review':{'kind':'source-derived process, unexecuted','steps':['acceptance/contract','implementation/tests','review/CI','staging/deploy','observe/follow-up'],'scope':'no actual PR/CI/staging/deployment/monitoring/rollback/JUnit slice tests'}
}
observed={'checks':sorted(checks),'facts':facts,'models':models};(OUT/'execution.json').write_text(json.dumps(observed,ensure_ascii=False,indent=2)+'\n')
frozen=OUT/'checkpoints/expected-execution.json';frozen.parent.mkdir(exist_ok=True)
if a.freeze:frozen.write_text(json.dumps(observed,ensure_ascii=False,indent=2)+'\n')
else:assert observed==json.loads(frozen.read_text()),'frozen mismatch; investigate before re-freezing'
print(json.dumps({'checks':len(checks),'models':len(models),'frozenMatch':not a.freeze}),flush=True)
