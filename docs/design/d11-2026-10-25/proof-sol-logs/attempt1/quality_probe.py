import datetime,hashlib,http.client,json,pathlib,signal,socket,sqlite3,subprocess,sys,tempfile,uuid
R=pathlib.Path.cwd(); D=R/'docs/design/d11-2026-10-25'; O=D/'proof-sol-logs/attempt1'; S=D/'source-proof'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda n,v:(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
# 실행 전에 reviewer 기대값을 별도 파일에 고정한다.
expected={'ownScoped':[{'id':1002,'owner_id':7}],'otherIdOnly':[{'id':1003,'owner_id':8}],'otherScoped':[],'uuidOtherScoped':[],'unsafeConcatenation':[{'id':1002,'owner_id':7},{'id':1003,'owner_id':8}],'safeBoundOwner7':[],'sortAllowed':[{'id':1002,'owner_id':7}],'unknownExecutedSQL':0,'HTTP':{'simple-blocked-read':[0,1],'preflight-denied':[1,0],'preflight-allowed':[1,1],'wildcard-credentials':[0,1]},'DOM':{'text':{'textContent':'<b>주문1002</b>','childTags':[],'bCount':0,'serializedHTML':'&lt;b&gt;주문1002&lt;/b&gt;'},'markup':{'textContent':'주문1002','childTags':['B'],'bCount':1,'serializedHTML':'<b>주문1002</b>'}}}
write('02-quality-expected.json',{'fixedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'expected':expected})
before={p.name:sha(p) for p in S.glob('*.py')}
proc=subprocess.run([sys.executable,str(S/'sqlite_proof.py')],text=True,capture_output=True)
write('03-sqlite-raw.json',{'argv':[sys.executable,str(S/'sqlite_proof.py')],'sourceSHABefore':before['sqlite_proof.py'],'sourceSHAAfter':sha(S/'sqlite_proof.py'),'returnCode':proc.returncode,'stdout':proc.stdout,'stderr':proc.stderr,'reviewerPython':sys.version,'reviewerSQLite':sqlite3.sqlite_version})
assert proc.returncode==0 and not proc.stderr
actual=json.loads(proc.stdout)
con=sqlite3.connect(':memory:'); trace=[]; con.set_trace_callback(trace.append)
con.execute('CREATE TABLE orders (id INTEGER PRIMARY KEY, owner_id INTEGER, title TEXT, created_at INTEGER, public_id TEXT UNIQUE)')
con.executemany('INSERT INTO orders VALUES (?,?,?,?,?)',[(1002,7,'내 주문',1,'00000000-0000-4000-8000-000000001002'),(1003,8,'다른 주문',2,'00000000-0000-4000-8000-000000001003')])
replay=[]
checks={**actual['queries'],'unsafeConcatenation':actual['titleSearch']['unsafeConcatenation'],'safeBoundOwner7':actual['titleSearch']['safeBoundOwner7'],'sortAllowed':actual['sorting']['allowed']}
for name,q in checks.items():
 rows=[{'id':a,'owner_id':b} for a,b in con.execute(q['sql'],q['bindParameters'])]
 assert rows==expected[name]==q['result'],name
 replay.append({'name':name,'sql':q['sql'],'bindParameters':q['bindParameters'],'reviewerRows':rows,'expected':expected[name]})
b= len(trace)
try:{'createdAt':'created_at','id':'id'}[actual['sorting']['rejectedInput']]
except KeyError:pass
else:raise AssertionError('unknown sort accepted')
assert len(trace)==b and actual['sorting']['queryExecutionsForRejectedInput']==0
assert actual['principalConversionExample']['numericResult']==int('7')==7
try:int('alice@example.test')
except ValueError:pass
else:raise AssertionError('text principal conversion')
write('04-sqlite-independent-replay.json',{'replays':replay,'trace':trace,'unknownInputSQLTraceDelta':len(trace)-b,'conRowCount':con.execute('SELECT COUNT(*) FROM orders').fetchone()[0],'runtime':{'python':sys.version,'sqlite':sqlite3.sqlite_version},'scope':'own :memory: only; not MySQL/JPA/JDBC'})
con.close()
# 소스를 디스크에 고치지 않고 expected-only와 actual-only 반례가 모두 실패하는지 확인한다.
src=(S/'sqlite_proof.py').read_text(); mutations=[]
for name,old,new,needle in [('expected-only','"ownScoped": [{"id": 1002, "owner_id": 7}]','"ownScoped": [{"id": 9999, "owner_id": 7}]','9999'),('actual-only','(1003, 8, "다른 주문", 2,','(1003, 9, "다른 주문", 2,','"owner_id": 9')]:
 assert old in src; mutated=src.replace(old,new,1)
 p=subprocess.run([sys.executable,'-c',mutated],capture_output=True,text=True)
 assert p.returncode!=0 and 'AssertionError' in p.stderr and needle in p.stderr
 mutations.append({'name':name,'transformation':[old,new],'inMemoryOnly':True,'returnCode':p.returncode,'stdout':p.stdout,'stderr':p.stderr})
write('05-sqlite-mutation-probes.json',mutations)
# fixture 새 프로세스, 자기소유 ephemeral 2포트와 임시 events 파일만 사용한다.
requests=[]
def request(origin,method,path,headers=None,body=None):
 from urllib.parse import urlparse
 u=urlparse(origin); c=http.client.HTTPConnection(u.hostname,u.port,timeout=5)
 c.request(method,path,headers=headers or {},body=body); r=c.getresponse(); hs=dict((k.lower(),v) for k,v in r.getheaders()); raw=r.read(); c.close()
 # 합성 Set-Cookie도 원문 로그 대신 존재 boolean만 기록한다.
 public_headers={k:v for k,v in hs.items() if k not in {'set-cookie','date','server'}}
 if 'set-cookie' in hs:public_headers['synthetic-set-cookie-present']=hs['set-cookie'].startswith('d11_fixture_session=')
 requests.append({'method':method,'url':origin+path,'requestOrigin':(headers or {}).get('Origin'),'responseStatus':r.status,'responseHeaders':public_headers,'responseBody':raw.decode('utf-8') if hs.get('content-type','').startswith('application/json') else '<page HTML stored separately>'})
 return r.status,hs,raw
with tempfile.TemporaryDirectory(prefix='d11-sol-http-') as td:
 events=pathlib.Path(td)/'events.jsonl'; argv=[sys.executable,str(S/'browser_fixture.py'),'--port-a','0','--port-b','0','--events-file',str(events)]
 p=subprocess.Popen(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 startup=json.loads(p.stdout.readline()); page=startup['pageOrigin']; api=startup['apiOrigin']; seen={}
 try:
  assert page!=api and page.startswith('http://127.0.0.1:') and api.startswith('http://127.0.0.1:')
  status,heads,html=request(page,'GET','/'); assert status==200 and heads['set-cookie'].startswith('d11_fixture_session=')
  (O/'fixture-page.html').write_bytes(html)
  for case,(options,post) in expected['HTTP'].items():
   run='sol-'+uuid.uuid4().hex; path='/case/'+case+'?run='+run; obs='/observations?case='+case+'&run='+run; h={'Origin':page}
   assert json.loads(request(api,'GET',obs+'&reset=1',h)[2])['events']==[]
   if options:
    status,hs,_=request(api,'OPTIONS',path,{**h,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-d11-probe'})
    assert status==204
    if case=='preflight-allowed':assert hs['access-control-allow-origin']==page and hs['access-control-allow-methods']=='POST' and hs['access-control-allow-headers']=='content-type,x-d11-probe' and hs['access-control-max-age']=='0'
    else:assert 'access-control-allow-origin' not in hs
   if post:
    ph={**h,'Content-Type':'application/json' if options else 'text/plain'}
    if options:ph['X-D11-Probe']='synthetic'
    if case=='wildcard-credentials':ph['Cookie']='d11_fixture_session=DEMO_ONLY'
    status,hs,body=request(api,'POST',path,ph,b'{"sample":"synthetic"}' if options else b'synthetic')
    assert status==200 and json.loads(body)=={'case':case,'message':'synthetic fixture response'}
    if case=='preflight-allowed':assert hs['access-control-allow-origin']==page
    elif case=='wildcard-credentials':assert hs['access-control-allow-origin']=='*' and hs['access-control-allow-credentials']=='true'
    else:assert 'access-control-allow-origin' not in hs
   for _ in range(2):
    status,hs,raw=request(api,'GET',obs,h); observation=json.loads(raw)
    assert hs['access-control-allow-origin']==page and [observation['optionsCount'],observation['postCount']]==[options,post]
   seen[case]=observation
  # 다른 Origin을 허용하지 않는 정확 일치 검사. 별도 run이므로 원래 네 case 카운터와 분리한다.
  foreign='http://127.0.0.1:1'; mismatch='sol-origin-'+uuid.uuid4().hex
  for method,headers,body in [('OPTIONS',{'Origin':foreign,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,x-d11-probe'},None),('POST',{'Origin':foreign,'Content-Type':'application/json'},b'{}')]:
   status,hs,_=request(api,method,'/case/preflight-allowed?run='+mismatch,headers,body); assert 'access-control-allow-origin' not in hs
  _,hs,_=request(api,'GET','/observations?case=preflight-allowed&run='+mismatch,{'Origin':foreign}); assert 'access-control-allow-origin' not in hs
  raw_events=events.read_text(); ev=[json.loads(v) for v in raw_events.splitlines()]
  assert len(ev)==7 and all(v['method'] in {'OPTIONS','POST'} for v in ev)
  assert all(set(v)=={'atUTC','method','case','run','origin','cookieNamePresent'} for v in ev)
  assert 'DEMO_ONLY' not in raw_events and 'Cookie' not in raw_events
  assert seen['wildcard-credentials']['events'][0]['cookieNamePresent'] is True
  (O/'06-http-events.jsonl').write_text(raw_events)
 finally:
  p.send_signal(signal.SIGINT); tail,stderr=p.communicate(timeout=8)
 assert p.returncode==0 and not stderr
 closed=[]
 from urllib.parse import urlparse
 for origin in [page,api]:
  u=urlparse(origin); s=socket.socket(); code=s.connect_ex((u.hostname,u.port));s.close();assert code!=0;closed.append({'origin':origin,'connectExAfterExit':code})
 write('06-http-independent.json',{'argv':argv,'startup':startup,'sourceSHA256':sha(S/'browser_fixture.py'),'requests':requests,'caseObservations':seen,'extraCounterScope':'foreign-Origin negative probe uses separate run; original cases total5 events, negative2, control GET0','eventsCount':len(ev),'serverExitCode':p.returncode,'stdoutTail':tail,'stderr':stderr,'portsClosed':closed,'temporaryEventsFileDeletedOnExit':True,'limitation':'stdlib http.client manual sequence/header assertions only; browser CORS enforcement NOT tested'})
base=json.loads((R/'docs/design/concept-cycle-2026-10-24/baseline.json').read_text()); preservation={}
for key in ['preexistingDirty','historicalProofFiles','initial24Reviews']:
 rows=base[key];preservation[key]={'count':len(rows),'mismatches':[f for f,h in rows.items() if not (R/f).exists() or sha(R/f)!=h]}
for key,prefix,suffix in [('sourceDocuments','docs/knowledge','.md'),('learnerServer','src',None)]:
 files=subprocess.check_output(['git','ls-files',prefix],text=True).splitlines();files=[f for f in files if suffix is None or f.endswith(suffix)]
 preservation[key]={'count':len(files),'mismatches':[f for f in files if sha(R/f)!=hashlib.sha256(subprocess.check_output(['git','show','HEAD:'+f])).hexdigest()]}
assert all(not x['mismatches'] for x in preservation.values())
assert before=={p.name:sha(p) for p in S.glob('*.py')}
write('08-preservation.json',preservation)
print(json.dumps({'status':'PASS','sqlReplays':len(replay),'negativeSQLMutations':2,'httpEvents':7,'httpCaseEvents':5,'sourceProofUnchanged':True,'preservation':preservation},ensure_ascii=False))
