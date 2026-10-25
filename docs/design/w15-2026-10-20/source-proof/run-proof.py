"""W15의 원문과 추가 관찰을 매번 새 private MySQL에서만 실행한다."""
from pathlib import Path
import argparse,datetime,decimal,hashlib,json,os,re,secrets,socket as net,subprocess,tempfile,time
import pymysql
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--mysql-base',required=True);p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
BASE=Path(a.mysql_base).resolve();runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
meta=json.loads((OUT/'source.json').read_text());source=ROOT/meta['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'^[ \t]*```(\w+)[ \t]*\n(.*?)^[ \t]*```[ \t]*$',source.read_text(),re.M|re.S);assert len(blocks)==5
for (lang,body),e in zip(blocks,meta['originalBlocks'],strict=True):
 assert lang==e['language']and body.encode()==(OUT/'original'/e['file']).read_bytes()and hashlib.sha256(body.encode()).hexdigest()==e['sha256']
for no,name in [(3,'ArticleRepository'),(4,'ArticlePagingExample')]:assert (OUT/f'original/block-{no:02}.java').read_bytes()==(OUT/f'original/java/example/paging/{name}.java').read_bytes()
run=Path(tempfile.mkdtemp(prefix='run-',dir=runtime));os.chmod(run,0o700);short=Path(tempfile.mkdtemp(prefix='w15-mysql-',dir='/tmp'));os.chmod(short,0o700)
data=run/'data';sock=short/'mysql.sock';log=run/'server.log';pid=run/'mysqld.pid'
with net.socket()as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
common=[str(BASE/'bin/mysqld'),'--no-defaults',f'--basedir={BASE}',f'--datadir={data}']
r=subprocess.run(common+['--initialize-insecure'],capture_output=True,text=True);(run/'initialize.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
args=common+[f'--socket={sock}',f'--pid-file={pid}',f'--log-error={log}',f'--port={port}','--bind-address=127.0.0.1','--mysqlx=OFF','--innodb-buffer-pool-size=64M','--mysql-native-password=OFF','--default-time-zone=+00:00']
server=subprocess.Popen(args,stdout=(run/'stdout.log').open('w'),stderr=subprocess.STDOUT)
root_password=secrets.token_urlsafe(32);jdbc_password=secrets.token_urlsafe(32);writer=observer=None
result={'runtime':{},'fixture':{},'source':{},'extra':{},'java':{},'plans':{},'checks':[]};trace=[]
def clean(v):
 if isinstance(v,dict):return {k:clean(x)for k,x in v.items()}
 if isinstance(v,(tuple,list)):return [clean(x)for x in v]
 if isinstance(v,decimal.Decimal):return str(v)
 if isinstance(v,datetime.datetime):return v.isoformat(sep=' ')
 return v

def connect(password):return pymysql.connect(unix_socket=str(sock),user='root',password=password,charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
def sql(q,params=None,connection=None):
 c=connection or writer
 with c.cursor()as cur:
  n=cur.execute(q,params);r={'sql':q,'parameters':clean(params),'rows':clean(cur.fetchall())if cur.description else None,'affectedRows':None if cur.description else n,'connection':'observer'if c is observer else 'writer'}
 trace.append(r);return r

def rows(q,params=None,connection=None):return sql(q,params,connection)['rows']
def ids(q,params=None,connection=None):return [r['id']for r in rows(q,params,connection)]
def check(name,value):
 assert value,name;result['checks'].append(name);print('PASS '+name,flush=True)
def reset_timeline():
 sql('DELETE FROM timeline');sql("INSERT INTO timeline VALUES(5,'2026-09-01 15:00:00'),(4,'2026-09-01 14:00:00'),(3,'2026-09-01 13:00:00'),(2,'2026-09-01 12:00:00'),(1,'2026-09-01 11:00:00')")
ordered='SELECT id,published_at FROM w15_demo.timeline ORDER BY published_at DESC,id DESC'
seek="SELECT id,published_at FROM w15_demo.timeline WHERE published_at<'2026-09-01 13:00:00' OR(published_at='2026-09-01 13:00:00'AND id<3) ORDER BY published_at DESC,id DESC"
try:
 deadline=time.monotonic()+30
 while time.monotonic()<deadline:
  if server.poll()is not None:raise RuntimeError(log.read_text())
  if sock.exists():
   try:writer=connect('');break
   except pymysql.MySQLError:pass
  time.sleep(.1)
 assert writer,'private instance timeout'
 guard=rows('SELECT @@datadir AS datadir,@@socket AS socket,@@port AS port,@@bind_address AS bindAddress,@@skip_networking AS skipNetworking')
 assert Path(guard[0]['datadir']).resolve()==data.resolve()and Path(guard[0]['socket']).resolve()==sock.resolve()and guard[0]['port']==port and guard[0]['bindAddress']=='127.0.0.1'and guard[0]['skipNetworking']==0 and int(pid.read_text())==server.pid
 x=rows("SELECT PLUGIN_NAME,PLUGIN_STATUS FROM information_schema.plugins WHERE PLUGIN_NAME='mysqlx'");assert x==[]or x[0]['PLUGIN_STATUS']=='DISABLED'
 (run/'isolation.json').write_text(json.dumps({'pid':server.pid,'arguments':args,'guard':guard,'mysqlx':x,'socketMode':oct(short.stat().st_mode&0o777),'passwords':'generated each run, not recorded; JDBC SELECT-only loopback user'},indent=2)+'\n');trace.clear()
 with writer.cursor()as c:c.execute("ALTER USER 'root'@'localhost' IDENTIFIED BY %s",(root_password,))
 observer=connect(root_password)
 sql('CREATE DATABASE w15_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');sql('USE w15_demo')
 ddl='CREATE TABLE article(id BIGINT PRIMARY KEY,published_at DATETIME(6) NOT NULL,status VARCHAR(16) NOT NULL,title VARCHAR(160) NOT NULL,INDEX idx_feed(status,published_at DESC,id DESC,title))'
 sql(ddl);seed=[];base=datetime.datetime(2026,9,1,12)
 for i in range(600):seed.append((700049-i,base-datetime.timedelta(minutes=0 if i<70 else 1+(i-70)//50),'PUBLISHED',f'W15 article {i:03}'))
 for i in range(37):seed.append((1000001+i,base+datetime.timedelta(hours=1),'DRAFT',f'W15 draft {i:02}'))
 with writer.cursor()as c:c.executemany('INSERT INTO article(id,published_at,status,title)VALUES(%s,%s,%s,%s)',seed)
 result['fixture']={'scope':'added private Article assumption, not learner schema or original ds_practice.article','ddl':ddl,'published':600,'draft':37,'firstTimestampTieRows':70,'seed':clean(seed)}
 result['runtime']=rows('SELECT VERSION()AS mysql,@@version_compile_machine AS machine,@@version_compile_os AS os,@@sql_mode AS sqlMode,@@autocommit AS autocommit,@@transaction_isolation AS isolation,@@time_zone AS timeZone')[0]
 result['runtime']['jdbcTransport']='fresh127.0.0.1-only port / random SELECT-only account / sslMode REQUIRED; existing DB never used';check('private-native-mysql8.4.11',result['runtime']['mysql']=='8.4.11')
 raw=(OUT/'original/block-02.sql').read_text();qs=[q.strip()for q in re.sub(r'(?m)^[ \t]*--[^\n]*','',raw).split(';')if q.strip()];assert len(qs)==3
 source_queries=[sql(q)for q in qs];result['source']['sql']=source_queries
 check('source-first50-last700000',[r['id']for r in source_queries[0]['rows']]==list(range(700049,699999,-1)))
 check('source-offset450-is-row450-through499',[r['id']for r in source_queries[1]['rows']]==list(range(699599,699549,-1)))
 check('source-cursor51-from699999-through699949',[r['id']for r in source_queries[2]['rows']]==list(range(699999,699948,-1)))
 check('source-offset450-and-literal-cursor-different-pages',source_queries[1]['rows']!=source_queries[2]['rows'][:50])
 first=source_queries[0]['rows'];peek=source_queries[2]['rows'];stamp_only=ids("SELECT id FROM article WHERE status='PUBLISHED'AND published_at<TIMESTAMP '2026-09-01 12:00:00' ORDER BY published_at DESC,id DESC LIMIT 50")
 check('extra-timestamp-only-skips20-tied-rows',stamp_only[0]==699979 and peek[0]['id']==699999)
 response=peek[:50];last=response[-1];nextq="SELECT id,published_at,title FROM article WHERE status='PUBLISHED'AND(published_at<%s OR(published_at=%s AND id<%s))ORDER BY published_at DESC,id DESC LIMIT 50"
 correct_after=rows(nextq,(last['published_at'],last['published_at'],last['id']));wrong_after=rows(nextq,(peek[-1]['published_at'],peek[-1]['published_at'],peek[-1]['id']))
 result['extra']['cursorBoundary']={'firstLast':first[-1],'nextResponse50':response,'peek51':peek[-1],'correctLastReturnedCursorNext':correct_after,'wrongPeekCursorNext':wrong_after,'timestampOnlyIds':stamp_only}
 check('extra-cursor-last-returned-not-peek',correct_after[0]['id']==699949 and wrong_after[0]['id']==699948)
 boundary=rows("SELECT id,published_at FROM article WHERE status='PUBLISHED'ORDER BY published_at DESC,id DESC LIMIT 1 OFFSET 449")[0]
 aligned=rows(nextq,(boundary['published_at'],boundary['published_at'],boundary['id']));check('extra-aligned-keyset-equals-offset450',aligned==source_queries[1]['rows'])
 result['extra']['alignedPage']={'priorRow449':boundary,'rows':aligned}
 sql('ANALYZE TABLE article')
 for name,q,params in [('sourceFirst',qs[0],None),('sourceDeepOffset',qs[1],None),('sourceLiteralCursor',qs[2],None),('extraAlignedSeek',nextq,(boundary['published_at'],boundary['published_at'],boundary['id']))]:
  raw_plan=rows('EXPLAIN ANALYZE '+q,params)[0]['EXPLAIN'];raw_event=trace.pop();(run/(name+'-explain-raw.json')).write_text(json.dumps(raw_event,ensure_ascii=False,indent=2)+'\n');(run/(name+'-explain-analyze.txt')).write_text(raw_plan+'\n')
  # 실제 timing만 별도 원자료로 보존. iterator 이름·행·loop는 그대로 frozen 비교한다.
  structural=re.sub(r'\(actual time=[0-9.eE+\-]+\.\.[0-9.eE+\-]+ rows=([0-9.eE+\-]+) loops=([0-9]+)\)',r'(actual rows=\1 loops=\2)',raw_plan)
  result['plans'][name]={'sql':q,'parameters':clean(params),'actualOperatorsRowsLoops':structural,'timing':'per-run raw plan in private runtime; no fixed time or ratio claim'}
 check('extra-plan-deep500-vs-aligned-seek50',"actual rows=500 loops=1"in result['plans']['sourceDeepOffset']['actualOperatorsRowsLoops']and "using idx_feed"in result['plans']['sourceDeepOffset']['actualOperatorsRowsLoops']and "actual rows=50 loops=1"in result['plans']['extraAlignedSeek']['actualOperatorsRowsLoops']and "range scan"in result['plans']['extraAlignedSeek']['actualOperatorsRowsLoops'])
 sql('CREATE TABLE timeline(id INT PRIMARY KEY,published_at DATETIME NOT NULL)');reset_timeline();initial=ids(ordered+' LIMIT 3');check('extra-controlled-first-page543',initial==[5,4,3])
 sql("INSERT INTO timeline VALUES(6,'2026-09-01 16:00:00')",connection=writer);top={'firstPage':initial,'offset':ids(ordered+' LIMIT 3 OFFSET 3'),'keyset':ids(seek+' LIMIT 3')};result['extra']['insertAtFront']=top;check('extra-front-insert-offset-repeats3-keyset21',top['offset']==[3,2,1]and top['keyset']==[2,1])
 reset_timeline();sql('DELETE FROM timeline WHERE id=5');deleted={'offset':ids(ordered+' LIMIT 3 OFFSET 3'),'keyset':ids(seek+' LIMIT 3')};result['extra']['deletePrior']=deleted;check('extra-prior-delete-offset-skips2-keyset21',deleted=={'offset':[1],'keyset':[2,1]})
 reset_timeline();sql("INSERT INTO timeline VALUES(6,'2026-09-01 11:30:00')");late={'keyset':ids(seek+' LIMIT 3'),'idOnly':ids('SELECT id FROM timeline WHERE id<3 ORDER BY published_at DESC,id DESC LIMIT 3')};result['extra']['backdatedInsert']=late;check('extra-backdated-insert-changes-later-results',late=={'keyset':[2,6,1],'idOnly':[2,1]})
 reset_timeline();sql("UPDATE timeline SET published_at='2026-09-01 16:00:00'WHERE id=2");unseen=ids(seek+' LIMIT 3');reset_timeline();sql("UPDATE timeline SET published_at='2026-09-01 11:30:00'WHERE id=4");seen=ids(seek+' LIMIT 3');result['extra']['mutableSortKeys']={'unseenMovedBeforeBoundary':unseen,'seenMovedAfterBoundary':seen};check('extra-mutable-key-can-miss-and-repeat',unseen==[1]and seen==[2,4,1])
 reset_timeline();sql('SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ');sql('START TRANSACTION WITH CONSISTENT SNAPSHOT');snapshot_first=ids(ordered+' LIMIT 3');sql("INSERT INTO w15_demo.timeline VALUES(6,'2026-09-01 16:00:00')",connection=observer);snapshot_next=ids(ordered+' LIMIT 3 OFFSET 3');sql('COMMIT');fresh=ids(ordered+' LIMIT 3 OFFSET 3');result['extra']['explicitSnapshot']={'first':snapshot_first,'sameTransactionOffsetNext':snapshot_next,'afterCommitFreshOffsetNext':fresh};check('extra-one-rr-snapshot-vs-fresh-read',snapshot_first==[5,4,3]and snapshot_next==[2,1]and fresh==[3,2,1])
 mixed="SELECT id,published_at FROM article WHERE status='PUBLISHED'ORDER BY published_at DESC,id ASC"
 mix_first=rows(mixed+' LIMIT 3');m=mix_first[-1];mix_next=ids("SELECT id FROM article WHERE status='PUBLISHED'AND(published_at<%s OR(published_at=%s AND id>%s))ORDER BY published_at DESC,id ASC LIMIT 3",(m['published_at'],m['published_at'],m['id']));mix_wrong=ids("SELECT id FROM article WHERE status='PUBLISHED'AND(published_at<%s OR(published_at=%s AND id<%s))ORDER BY published_at DESC,id ASC LIMIT 3",(m['published_at'],m['published_at'],m['id']));result['extra']['mixedSort']={'first':mix_first,'correctNext':mix_next,'wrongLessNext':mix_wrong};check('extra-desc-asc-requires-id-greater',mix_next==[699983,699984,699985]and mix_wrong[:2]==[699980,699981])
 sql('CREATE TABLE nullable_probe(id INT PRIMARY KEY,published_at DATETIME NULL)');sql("INSERT INTO nullable_probe VALUES(3,'2026-09-01 12:00:00'),(2,'2026-09-01 11:00:00'),(1,NULL)");nullable=rows('SELECT id,published_at FROM nullable_probe ORDER BY published_at DESC,id DESC');plain=ids("SELECT id FROM nullable_probe WHERE published_at<'2026-09-01 11:00:00'ORDER BY published_at DESC,id DESC");result['extra']['nullable']={'fullOrder':nullable,'plainInequalityAfter11':plain,'scope':'separate nullable SQL fixture; original added Article mapping remains NOT NULL; no null JPA keyset execution'};check('extra-null-tail-not-returned-by-plain-inequality',[r['id']for r in nullable]==[3,2,1]and plain==[])
 with writer.cursor()as c:c.execute("CREATE USER 'w15_probe'@'127.0.0.1' IDENTIFIED BY %s",(jdbc_password,));c.execute("GRANT SELECT ON w15_demo.* TO 'w15_probe'@'127.0.0.1'")
 env=os.environ.copy();env.update(JAVA_HOME='/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home',W15_DB_URL=f'jdbc:mysql://127.0.0.1:{port}/w15_demo?characterEncoding=UTF-8&sslMode=REQUIRED&useServerPrepStmts=true',W15_DB_PASSWORD=jdbc_password,W15_EXPECTED_DATADIR=str(data),W15_EXPECTED_PORT=str(port),W15_JAVA_OUTPUT=str(run/'java.json'))
 r=subprocess.run([str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','runProof'],cwd=ROOT,env=env,capture_output=True,text=True);(OUT/'java-run.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stdout+r.stderr
 result['java']=json.loads((run/'java.json').read_text());check('java-all-recorded-checks-pass',len(result['java']['checks'])>=16 and r.stdout.count('PASS ')==len(result['java']['checks']))
 result['trace']=trace;(OUT/'execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');frozen=OUT/'checkpoints/expected-current-execution.json'
 if a.freeze:frozen.parent.mkdir(exist_ok=True);frozen.write_bytes((OUT/'execution.json').read_bytes())
 else:assert json.loads(frozen.read_text())==result,'frozen differs; investigate before updating'
 print(json.dumps({'nativeChecks':len(result['checks']),'javaChecks':len(result['java']['checks']),'privateRuntime':str(run),'frozenMatch':not a.freeze},indent=2))
finally:
 if observer:observer.close()
 if writer:
  writer.close();env=os.environ.copy();env['MYSQL_PWD']=root_password
  r=subprocess.run([str(BASE/'bin/mysqladmin'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','shutdown'],env=env,capture_output=True,text=True,timeout=15);(run/'shutdown.log').write_text(r.stdout+r.stderr)
 try:server.wait(timeout=15)
 except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=10)
 (OUT/'runtime-last.json').write_text(json.dumps({'run':str(run),'pid':server.pid,'serverExit':server.returncode,'serverStopped':server.poll()is not None},indent=2)+'\n')
