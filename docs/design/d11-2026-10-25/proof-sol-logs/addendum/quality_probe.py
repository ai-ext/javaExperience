import datetime,hashlib,json,pathlib,runpy,sqlite3,subprocess,sys,contextlib,io
R=pathlib.Path.cwd();D=R/'docs/design/d11-2026-10-25';O=D/'proof-sol-logs/addendum';S=D/'source-proof/sqlite_compare_addendum.py';RUNNER=D/'source-proof/sqlite_compare_addendum_runner.py'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda n,v:(O/n).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
spec=json.loads((O/'01-spec-review.json').read_text());assert spec['verdict']=='PASS'
expected={'idOnly1002':[{'id':1002,'owner_id':7}],'uuidUnscoped1003':[{'id':1003,'owner_id':8}]}
write('02-quality-expected.json',{'fixedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'expected':expected,'scopeComparisons':{'ownScoped':[{'id':1002,'owner_id':7}],'uuidOtherScoped':[]}})
argv=[sys.executable,str(S)];p=subprocess.run(argv,capture_output=True,text=True)
write('03-addendum-raw.json',{'argv':argv,'sourceSHA256':sha(S),'runnerSourceSHA256':sha(RUNNER),'returnCode':p.returncode,'stdout':p.stdout,'stderr':p.stderr,'nativePython':sys.version,'nativeSQLite':sqlite3.sqlite_version})
assert p.returncode==0 and not p.stderr;actual=json.loads(p.stdout);assert actual['actual']==expected==actual['expected'];assert actual['runtime']=={'python':sys.version,'sqlite':sqlite3.sqlite_version}
oldlog=json.loads((D/'proof-logs/sqlite-proof-20261024T161249Z.json').read_text());old=json.loads(oldlog['stdout']);assert actual['syntheticRows']==old['syntheticRows']
con=sqlite3.connect(':memory:');trace=[];con.set_trace_callback(trace.append)
con.execute('CREATE TABLE orders(id INTEGER PRIMARY KEY, owner_id INTEGER NOT NULL, title TEXT NOT NULL, created_at INTEGER NOT NULL, public_id TEXT NOT NULL UNIQUE)')
con.executemany('INSERT INTO orders VALUES(?,?,?,?,?)',[(1002,7,'내 주문',1,'00000000-0000-4000-8000-000000001002'),(1003,8,'다른 주문',2,'00000000-0000-4000-8000-000000001003')])
replays={}
for key,q in actual['queries'].items():
 rows=[{'id':i,'owner_id':o} for i,o in con.execute(q['sql'],q['bindParameters'])];assert rows==expected[key]==q['result'];replays[key]={'sql':q['sql'],'bindParameters':q['bindParameters'],'result':rows}
scoped={}
for key in ['ownScoped','uuidOtherScoped']:
 q=old['queries'][key];rows=[{'id':i,'owner_id':o} for i,o in con.execute(q['sql'],q['bindParameters'])];assert rows==q['result'];scoped[key]={'sql':q['sql'],'bindParameters':q['bindParameters'],'result':rows}
assert replays['idOnly1002']['result']==scoped['ownScoped']['result'];assert replays['uuidUnscoped1003']['result']==[{'id':1003,'owner_id':8}] and scoped['uuidOtherScoped']['result']==[]
write('04-independent-replay.json',{'queries':replays,'existingScopedComparison':scoped,'trace':trace,'syntheticRowsEqualOriginal':True,'rowCount':con.execute('SELECT COUNT(*) FROM orders').fetchone()[0],'limitation':'own isolated SQLite; not Spring/MySQL/JPA/JDBC; no UI/images review'})
con.close()
src=S.read_text();mutations=[]
for name,oldtext,newtext in [('expected-id-only','"idOnly1002": [{"id": 1002, "owner_id": 7}]','"idOnly1002": [{"id": 9999, "owner_id": 7}]'),('expected-uuid-only','"uuidUnscoped1003": [{"id": 1003, "owner_id": 8}]','"uuidUnscoped1003": [{"id": 1003, "owner_id": 9}]'),('actual-seed-owner-only','(1003, 8, "다른 주문", 2,','(1003, 9, "다른 주문", 2,')]:
 assert oldtext in src; changed=src.replace(oldtext,newtext,1);m=subprocess.run([sys.executable,'-c',changed],capture_output=True,text=True);assert m.returncode!=0 and 'AssertionError' in m.stderr
 mutations.append({'name':name,'inMemoryOnly':True,'transformation':[oldtext,newtext],'returnCode':m.returncode,'stdout':m.stdout,'stderr':m.stderr})
write('05-mutation-probes.json',mutations)
# 원래 runner 코드의 기록 경로만 메모리에서 reviewer 폴더로 돌린다. 소스 파일은 변경하지 않는다.
g=runpy.run_path(str(RUNNER),run_name='reviewer_addendum_runner');g['main'].__globals__['LOG_DIR']=O/'runner-replay';stdout=io.StringIO()
with contextlib.redirect_stdout(stdout):code=g['main']()
assert code==0
runnerlogs=list((O/'runner-replay').glob('*.json'));assert len(runnerlogs)==1
rl=json.loads(runnerlogs[0].read_text());assert rl['sourceSHA256']==sha(S) and rl['runnerSourceSHA256']==sha(RUNNER) and rl['returnCode']==0 and not rl['stderr'];assert json.loads(rl['stdout'])['actual']==expected
write('06-runner-replay.json',{'scope':'unmodified runner loaded via runpy; only LOG_DIR runtime binding redirected to reviewer artifact folder','runnerSourceSHA256':sha(RUNNER),'returnCode':code,'stdout':stdout.getvalue(),'runnerLog':str(runnerlogs[0])})
before=json.loads((O/'00-preservation-before.json').read_text());mismatches=[f for f,h in before.items() if not pathlib.Path(f).exists() or sha(pathlib.Path(f))!=h];assert not mismatches
write('07-preservation-after.json',{'checkedFiles':len(before),'mismatches':mismatches,'existingApprovedSource4Unchanged':True,'existingApprovedRawLogsUnchanged':True,'addendumSourceRunnerAndOriginalLogUnchanged':True})
quality={'stage':'addendum quality','verdict':'PASS','specCompletedAtUTC':spec['completedAtUTC'],'completedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'findings':{'critical':0,'important':0,'minor':0},'queries':2,'existingScopedComparisons':2,'negativeMutationsRejected':3,'independentRuntime':{'python':sys.version,'sqlite':sqlite3.sqlite_version},'sourceSHA256':sha(S),'runnerSourceSHA256':sha(RUNNER),'runnerReplayPassed':True,'preservationMismatches':mismatches,'limitations':['제품 UI/images 제외','실제 Spring/Java/MySQL/JPA/JDBC 실행 아님','브라우저/Git/외부 CLI/다른 모델 호출 없음']}
write('08-quality-review.json',quality);print(json.dumps(quality,ensure_ascii=False))
