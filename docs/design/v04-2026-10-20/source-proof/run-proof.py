"""V04 source/추가 TestContext 실험을 새 private MySQL에서만 실행한다."""
from pathlib import Path
import argparse,datetime,decimal,hashlib,json,os,re,secrets,socket as net,subprocess,tempfile,time,xml.etree.ElementTree as ET
import pymysql
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--mysql-base',required=True);p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
BASE=Path(a.mysql_base).resolve();runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
meta=json.loads((OUT/'source.json').read_text());source=ROOT/meta['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'^[ \t]*```(\w+)[ \t]*\n(.*?)^[ \t]*```[ \t]*$',source.read_text(),re.M|re.S);assert len(blocks)==9
for (lang,body),e in zip(blocks,meta['originalBlocks'],strict=True):assert lang==e['language']and body.encode()==(OUT/'original'/e['file']).read_bytes()and hashlib.sha256(body.encode()).hexdigest()==e['sha256']
assert (OUT/'original/block-03.java').read_bytes()==(OUT/'original-test/java/com/example/practice/product/ProductRepositoryTest.java').read_bytes()
assert (OUT/'original/block-05.sql').read_bytes()==(OUT/'test-resources/sql/product-fixture.sql').read_bytes()
for e in meta['externalStudyData']:assert hashlib.sha256((OUT/e['copy']).read_bytes()).hexdigest()==e['sha256']and hashlib.sha256(Path(e['source']).read_bytes()).hexdigest()==e['sha256']
run=Path(tempfile.mkdtemp(prefix='run-',dir=runtime));os.chmod(run,0o700);short=Path(tempfile.mkdtemp(prefix='v04-mysql-',dir='/tmp'));os.chmod(short,0o700)
data=run/'data';sock=short/'mysql.sock';log=run/'server.log';pid=run/'mysqld.pid'
with net.socket()as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
common=[str(BASE/'bin/mysqld'),'--no-defaults',f'--basedir={BASE}',f'--datadir={data}']
r=subprocess.run(common+['--initialize-insecure'],capture_output=True,text=True);(run/'initialize.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
args=common+[f'--socket={sock}',f'--pid-file={pid}',f'--log-error={log}',f'--port={port}','--bind-address=127.0.0.1','--mysqlx=OFF','--innodb-buffer-pool-size=64M','--mysql-native-password=OFF','--default-time-zone=+00:00']
server=subprocess.Popen(args,stdout=(run/'stdout.log').open('w'),stderr=subprocess.STDOUT)
root_password=secrets.token_urlsafe(32);jdbc_password=secrets.token_urlsafe(32);writer=None
result={'runtime':{},'source':{},'java':{},'junit':[],'checks':[]};trace=[]
def clean(v):
 if isinstance(v,dict):return {k:clean(x)for k,x in v.items()}
 if isinstance(v,(tuple,list)):return [clean(x)for x in v]
 if isinstance(v,decimal.Decimal):return str(v)
 if isinstance(v,datetime.datetime):return v.isoformat(sep=' ')
 return v

def connect(password):return pymysql.connect(unix_socket=str(sock),user='root',password=password,charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
def sql(q):
 with writer.cursor()as c:n=c.execute(q);r={'sql':q,'rows':clean(c.fetchall())if c.description else None,'affectedRows':None if c.description else n}
 trace.append(r);return r

def rows(q):return sql(q)['rows']
def check(name,value):assert value,name;result['checks'].append(name);print('PASS '+name,flush=True)
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
 (run/'isolation.json').write_text(json.dumps({'pid':server.pid,'arguments':args,'guard':guard,'mysqlx':x,'socketMode':oct(short.stat().st_mode&0o777),'passwords':'fresh eachrun not recorded; new JDBC CRUD on two private schemas only'},indent=2)+'\n');trace.clear()
 with writer.cursor()as c:c.execute("ALTER USER 'root'@'localhost' IDENTIFIED BY %s",(root_password,))
 client=[str(BASE/'bin/mysql'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','--default-character-set=utf8mb4'];client_env=os.environ.copy();client_env['MYSQL_PWD']=root_password
 for name in ['external-study-schema.sql','external-study-seed.sql']:
  r=subprocess.run(client,input=(OUT/'original'/name).read_text(),env=client_env,capture_output=True,text=True);(run/(name+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 sql('CREATE DATABASE v04_extra CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');sql('CREATE TABLE v04_extra.case_probe(id INT PRIMARY KEY,word VARCHAR(30) NOT NULL UNIQUE)')
 result['runtime']=rows('SELECT VERSION()AS mysql,@@version_compile_machine AS machine,@@version_compile_os AS os,@@sql_mode AS sqlMode,@@autocommit AS autocommit,@@transaction_isolation AS isolation,@@time_zone AS timeZone')[0];check('private-native-mysql8.4.11',result['runtime']['mysql']=='8.4.11')
 before=rows('SELECT COUNT(*)AS total,SUM(deleted_at IS NULL)AS active FROM ds_practice.product')[0];check('source-seed-products80-active79',before=={'total':80,'active':'79'});result['source']['before']=before
 with writer.cursor()as c:
  c.execute("CREATE USER 'v04_probe'@'127.0.0.1' IDENTIFIED BY %s",(jdbc_password,))
  for schema in ['ds_practice','v04_extra']:c.execute(f"GRANT SELECT,INSERT,UPDATE,DELETE ON {schema}.* TO 'v04_probe'@'127.0.0.1'")
 env=os.environ.copy();env.update(JAVA_HOME='/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home',V04_DB_URL=f'jdbc:mysql://127.0.0.1:{port}/ds_practice?characterEncoding=UTF-8&sslMode=REQUIRED&useServerPrepStmts=true',V04_DB_PASSWORD=jdbc_password,V04_EXPECTED_DATADIR=str(data),V04_EXPECTED_PORT=str(port),V04_JAVA_OUTPUT=str(run/'java.json'),V04_RUNTIME_DIR=str(run))
 r=subprocess.run([str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','cleanTest','test','recordDependencies'],cwd=ROOT,env=env,capture_output=True,text=True);(OUT/'java-run.log').write_text(r.stdout+r.stderr);assert r.returncode==0,'Java suite failed; see source-proof/java-run.log'
 listener=json.loads((run/'http-listener.json').read_text());assert listener['address']=='127.0.0.1'
 with net.socket()as probe:probe.settimeout(2);http_closed=probe.connect_ex(('127.0.0.1',listener['port']))!=0
 (run/'http-stop-check.json').write_text(json.dumps({'listener':listener,'tcpClosedAfterWorkerExit':http_closed},indent=2)+'\n');check('private-http-server-stopped',http_closed)
 result['java']=json.loads((run/'java.json').read_text());passes=re.findall(r'(?m)^\s*PASS ([^\r\n]+)$',r.stdout);check('java-explicit-checks-match-stdout',sorted(passes)==result['java']['checks']and len(passes)==len(set(passes)))
 for file in sorted((OUT/'runtime/build/test-results/test').glob('TEST-*.xml')):
  xml=ET.parse(file).getroot()
  for case in xml.findall('testcase'):
   result['junit'].append({'class':case.attrib['classname'],'method':case.attrib['name'],'passed':case.find('failure')is None and case.find('error')is None,'skipped':case.find('skipped')is not None})
  (run/file.name).write_bytes(file.read_bytes())
 expected_ids=set();expected_records=set()
 for file in (OUT/'probe/java').rglob('*.java'):
  text=file.read_text();expected_ids.update(re.findall(r'Proof\.check\("([^"]+)"',text));expected_records.update(re.findall(r'Proof\.record\("([^"]+)"',text))
 check('java-check-and-fact-ids-cover-declared-probes',set(result['java']['checks'])==expected_ids and set(result['java']['facts'])==expected_ids|expected_records)
 expected_classes={'com.example.practice.product.DefaultStaticReplaceTest':1,'com.example.practice.product.DefaultDynamicReplaceTest':1,'com.example.practice.product.ExplicitNoneReplaceTest':1,'com.example.practice.product.ExplicitAnyReplaceTest':1,'com.example.practice.product.NativeAdapterTest':2,'com.example.practice.product.SqlFixtureTest':2,'com.example.practice.product.ProductServiceUnitTest':2,'v04.extra.EngineDifferentialTest':1,'v04.toy.ToyTransactionTest':8,'v04.http.HttpBoundaryTest':2,'v04.support.ObservationSnapshotTest':1}
 actual_classes={name:sum(c['class']==name for c in result['junit'])for name in {c['class']for c in result['junit']}};check('junit-exact22-cases-in11-expected-classes',actual_classes==expected_classes)
 result['junit'].sort(key=lambda c:(c['class'],c['method']));check('junit-all-discovered-cases-pass-no-skips',bool(result['junit'])and all(c['passed']and not c['skipped']for c in result['junit']));check('source-tc-class-not-run',all(c['class']!='com.example.practice.product.ProductRepositoryTest'for c in result['junit']))
 after=rows('SELECT COUNT(*)AS total,SUM(deleted_at IS NULL)AS active FROM ds_practice.product')[0];fixture=rows('SELECT(SELECT COUNT(*)FROM ds_practice.product WHERE id=9001)AS product,(SELECT COUNT(*)FROM ds_practice.category WHERE id=9001)AS category')[0];result['source'].update(after=after,fixtureAfter=fixture);check('source-seed-row-counts-preserved-fixture-cleaned',after==before and fixture=={'product':0,'category':0})
 result['trace']=trace;(OUT/'execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');frozen=OUT/'checkpoints/expected-current-execution.json'
 if a.freeze:frozen.parent.mkdir(exist_ok=True);frozen.write_bytes((OUT/'execution.json').read_bytes())
 else:assert json.loads(frozen.read_text())==result,'frozen differs; investigate before updating'
 print(json.dumps({'nativeChecks':len(result['checks']),'javaChecks':len(result['java']['checks']),'junitCases':len(result['junit']),'observations':len(result['java']['facts']),'privateRuntime':str(run),'frozenMatch':not a.freeze},indent=2))
finally:
 if writer:
  writer.close();env=os.environ.copy();env['MYSQL_PWD']=root_password
  r=subprocess.run([str(BASE/'bin/mysqladmin'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','shutdown'],env=env,capture_output=True,text=True,timeout=15);(run/'shutdown.log').write_text(r.stdout+r.stderr)
 try:server.wait(timeout=15)
 except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=10)
 (OUT/'runtime-last.json').write_text(json.dumps({'run':str(run),'pid':server.pid,'serverExit':server.returncode,'serverStopped':server.poll()is not None},indent=2)+'\n')
