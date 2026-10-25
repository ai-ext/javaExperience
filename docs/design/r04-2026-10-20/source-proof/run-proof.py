"""R04 원문과 추가 probe를 새 MySQL 인스턴스에서만 실행한다. 기존 DB 접속 금지."""
from pathlib import Path
import argparse,datetime,decimal,hashlib,json,os,re,secrets,socket as net,subprocess,tempfile,time
import pymysql

OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--mysql-base',required=True);p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
BASE=Path(a.mysql_base).resolve();runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
meta=json.loads((OUT/'source.json').read_text());source=ROOT/meta['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'^[ \t]*```(\w+)[ \t]*\n(.*?)^[ \t]*```[ \t]*$',source.read_text(),re.M|re.S)
assert len(blocks)==13
for (lang,body),e in zip(blocks,meta['originalBlocks'],strict=True):
 assert lang==e['language']and body.encode()==(OUT/'original'/e['file']).read_bytes()and hashlib.sha256(body.encode()).hexdigest()==e['sha256']
assert (OUT/'original/block-07.java').read_bytes()==(OUT/'original/java/example/OrderReadRepository.java').read_bytes()
for e in meta['externalStudyData']:assert hashlib.sha256((OUT/'original'/Path(e['copy']).name).read_bytes()).hexdigest()==e['sha256']
run=Path(tempfile.mkdtemp(prefix='run-',dir=runtime));os.chmod(run,0o700);short=Path(tempfile.mkdtemp(prefix='r04-mysql-',dir='/tmp'));os.chmod(short,0o700)
data=run/'data';sock=short/'mysql.sock';log=run/'server.log';pid=run/'mysqld.pid'
with net.socket()as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
common=[str(BASE/'bin/mysqld'),'--no-defaults',f'--basedir={BASE}',f'--datadir={data}']
r=subprocess.run(common+['--initialize-insecure'],capture_output=True,text=True);(run/'initialize.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
args=common+[f'--socket={sock}',f'--pid-file={pid}',f'--log-error={log}',f'--port={port}','--bind-address=127.0.0.1','--mysqlx=OFF','--innodb-buffer-pool-size=64M','--mysql-native-password=OFF']
server=subprocess.Popen(args,stdout=(run/'stdout.log').open('w'),stderr=subprocess.STDOUT)
root_password=secrets.token_urlsafe(32);jdbc_password=secrets.token_urlsafe(32);writer=observer=None
result={'runtime':{},'source':{},'extra':{},'jdbc':{},'checks':[]};trace=[]
def clean(v):
 if isinstance(v,dict):return {k:clean(x)for k,x in v.items()}
 if isinstance(v,(tuple,list)):return [clean(x)for x in v]
 if isinstance(v,decimal.Decimal):return str(v)
 if isinstance(v,datetime.datetime):return v.isoformat(sep=' ')
 if isinstance(v,(datetime.date,datetime.time)):return v.isoformat()
 return v

def connect(password):return pymysql.connect(unix_socket=str(sock),user='root',password=password,charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
def sql(q,params=None,connection=None):
 c=connection or writer
 with c.cursor()as cur:
  try:
   n=cur.execute(q,params);r={'sql':q,'parameters':clean(params),'rows':clean(cur.fetchall())if cur.description else None,'affectedRows':None if cur.description else n,'connection':'observer'if c is observer else 'writer'}
  except pymysql.MySQLError as e:r={'sql':q,'parameters':clean(params),'error':{'code':e.args[0],'message':e.args[1]},'connection':'observer'if c is observer else 'writer'}
 trace.append(r);return r

def ok(q,params=None,connection=None):
 r=sql(q,params,connection);assert 'error'not in r,r;return r

def rows(q,connection=None):return ok(q,connection=connection)['rows']
def check(name,value):
 assert value,name;result['checks'].append(name);print('PASS '+name,flush=True)
def err(name,q,code):
 r=sql(q);check(name,r.get('error',{}).get('code')==code);return r

def observer_state():
 return {'product1':rows('SELECT id,stock FROM ds_practice.product WHERE id=1',observer),'sourceNewProducts':rows("SELECT id,name,price,stock FROM ds_practice.product WHERE name IN('R04 상품 A','R04 상품 B') ORDER BY id",observer),'couponRows':rows("SELECT COUNT(*)AS n FROM ds_practice.coupon WHERE code='R04-DEMO'",observer)[0]['n'],'pointRows':rows("SELECT COUNT(*)AS n FROM ds_practice.point_history WHERE memo='R04 실습'",observer)[0]['n'],'memberCoupon300':rows('SELECT COUNT(*)AS n FROM ds_practice.member_coupon WHERE id=300',observer)[0]['n']}
def writer_state():
 return {'product1':rows('SELECT id,name,stock,updated_at FROM ds_practice.product WHERE id=1'),'sourceNewProducts':rows("SELECT id,name,price,stock FROM ds_practice.product WHERE name IN('R04 상품 A','R04 상품 B') ORDER BY id"),'coupon':rows("SELECT id,code,discount_amount FROM ds_practice.coupon WHERE code='R04-DEMO'"),'points':rows("SELECT id,member_id,order_id,amount,memo FROM ds_practice.point_history WHERE memo='R04 실습' ORDER BY id"),'memberCoupon300':rows('SELECT id,member_id,member_coupon_status FROM ds_practice.member_coupon WHERE id=300')}
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
 assert Path(guard[0]['datadir']).resolve()==data.resolve()and Path(guard[0]['socket']).resolve()==sock.resolve()and guard[0]['port']==port and guard[0]['bindAddress']=='127.0.0.1'and guard[0]['skipNetworking']==0
 assert int(pid.read_text())==server.pid
 x=rows("SELECT PLUGIN_NAME,PLUGIN_STATUS FROM information_schema.plugins WHERE PLUGIN_NAME='mysqlx'");assert x==[]or x[0]['PLUGIN_STATUS']=='DISABLED'
 (run/'isolation.json').write_text(json.dumps({'pid':server.pid,'arguments':args,'guard':guard,'mysqlx':x,'socketMode':oct(short.stat().st_mode&0o777),'passwords':'fresh generated per run, not recorded; JDBC SELECT-only loopback user'},indent=2)+'\n');trace.clear()
 # 새 인스턴스의 root만 초기화한다. 암호 SQL·값은 trace/log에 기록하지 않는다.
 with writer.cursor()as c:c.execute("ALTER USER 'root'@'localhost' IDENTIFIED BY %s",(root_password,))
 client=[str(BASE/'bin/mysql'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','--default-character-set=utf8mb4'];client_env=os.environ.copy();client_env['MYSQL_PWD']=root_password
 for name in ['external-study-schema.sql','external-study-seed.sql']:
  r=subprocess.run(client,input=(OUT/'original'/name).read_text(),env=client_env,capture_output=True,text=True);(run/(name+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 ok('USE ds_practice');observer=connect(root_password);ok('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED');ok('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED',connection=observer)
 result['runtime']=rows('SELECT VERSION()AS mysql,@@version_compile_machine AS machine,@@version_compile_os AS os,@@sql_mode AS sqlMode,@@autocommit AS autocommit,@@transaction_isolation AS isolation,@@character_set_connection AS charset,@@collation_connection AS collation')[0]
 result['runtime']['jdbcTransport']='separate fresh127.0.0.1-only port / new random SELECT-only account / sslMode REQUIRED; no existing server or original3306';check('private-native-mysql8.4.11',result['runtime']['mysql']=='8.4.11')
 result['runtime']['clientFoundRows']=bool(writer.client_flag & pymysql.constants.CLIENT.FOUND_ROWS)
 result['source']['initialWriter']=writer_state()
 result['source']['initialObserver']=observer_state();check('initial-source-stock33-and-no-demo-rows',result['source']['initialObserver']=={'product1':[{'id':1,'stock':33}],'sourceNewProducts':[],'couponRows':0,'pointRows':0,'memberCoupon300':1})
 for e in meta['originalBlocks']:
  if e['language']!='sql':continue
  raw=(OUT/'original'/e['file']).read_text();qs=[q.strip()for q in re.sub(r'(?m)^[ \t]*--[^\n]*','',raw).split(';')if q.strip()];events=[]
  for q in qs:
   r=ok(q);events.append(r)
   if e['block']==13 and q.startswith(('INSERT','UPDATE','DELETE')):events.append({'additionalIndependentObserverAfterStatement':observer_state()})
   if e['block']==13 and (q.startswith('INSERT')or q.startswith('SELECT ROW_COUNT()')):events.append({'additionalWriterAfterStatement':writer_state()})
  result['source']['block'+str(e['block'])]={'adapter':'remove line comments for splitting only; original SQL expressions/indentation in source file unchanged','events':events}
 b=result['source'];check('source-show16tables',len(b['block4']['events'][0]['rows'])==16)
 check('source-sorted-limit-member1-six', [r['id']for r in b['block1']['events'][0]['rows']]==[1,901,721,541,361,181])
 join=b['block8']['events'];check('source-inner-member1-six', [r['order_id']for r in join[0]['rows']]==[1,181,361,541,721,901]);check('source-left181182-null',len(join[1]['rows'])==2 and all(r['order_id']is None for r in join[1]['rows']));check('source-right181-null',join[2]['rows']==[{'member_id':181,'order_id':None}]);check('source-cross2x2-four',len(join[3]['rows'])==4 and {(r['category_id'],r['member_id'])for r in join[3]['rows']}=={(1,181),(1,182),(2,181),(2,182)});check('source-self-category3-parent1',join[4]['rows']==[{'id':1,'name':'상품','parent_id':None,'parent_name':None},{'id':3,'name':'세부카테고리01','parent_id':1,'parent_name':'상품'}])
 on=b['block9']['events'][0]['rows'];check('source-left-paid-on-preserves181182',len(on)==2 and all(r['paid_order_id']is None for r in on));exists=b['block9']['events'][1]['rows'];check('source-exists-unique96-members',len(exists)==96 and len({r['id']for r in exists})==96)
 aggregate=b['block10']['events'][0]['rows'];check('source-join-sum17919-times3-is53757',aggregate==[{'id':1,'total_amount':'17919','item_rows':3,'wrong_total':'53757'}]);groups=b['block11']['events'][0]['rows'];check('source-group-having-limit20',len(groups)==20 and all(decimal.Decimal(r['order_total'])>=100000 for r in groups))
 snapshots=[r['additionalWriterAfterStatement']for r in b['block13']['events']if 'additionalWriterAfterStatement'in r]
 check('source-insert-writer-sees-two-products-coupon-point',len(snapshots)==5 and [r['name']for r in snapshots[0]['sourceNewProducts']]==['R04 상품 A','R04 상품 B']and len(snapshots[1]['coupon'])==1 and len(snapshots[2]['points'])==1)
 check('source-stock32-and-deleted-membercoupon-only-writer',snapshots[3]['product1']==[{'id':1,'name':'상품A-01','stock':32,'updated_at':'2026-09-28 00:00:00'}]and snapshots[4]['memberCoupon300']==[])
 dml=b['block13']['events'];update=next(r for r in dml if r.get('sql','').startswith('SELECT ROW_COUNT() changed_rows'));delete=next(r for r in dml if r.get('sql','').startswith('SELECT ROW_COUNT() deleted_rows'));check('source-update-delete-each1',update['rows']==[{'changed_rows':1}]and delete['rows']==[{'deleted_rows':1}]);dml_observers=[r['additionalIndependentObserverAfterStatement']for r in dml if 'additionalIndependentObserverAfterStatement'in r];check('source-uncommitted-mutations-invisible',len(dml_observers)==5 and all(r==b['initialObserver']for r in dml_observers));b['afterRollback']=observer_state();b['afterRollbackWriter']=writer_state();check('source-rollback-restores-stock-and-coupon-point-membercoupon',b['afterRollback']==b['initialObserver']and b['afterRollbackWriter']==b['initialWriter']);check('source-final-original-selects', [r['rows']for r in dml[-4:]]==[[{'id':1,'stock':33}],[{'coupon_rows':0}],[{'point_rows':0}],[{'member_coupon_rows':1}]])
 ok('CREATE DATABASE r04_extra CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');ok('USE r04_extra')
 result['extra']['leftWhere']=rows("SELECT m.id,o.id AS paid_order_id FROM ds_practice.member m LEFT JOIN ds_practice.orders o ON o.member_id=m.id WHERE m.id BETWEEN 181 AND 182 AND o.order_status='PAID'");check('extra-left-right-condition-in-where-drops-unmatched',result['extra']['leftWhere']==[])
 result['extra']['countNull']=rows('SELECT m.id,COUNT(*)AS expanded_rows,COUNT(o.id)AS actual_orders FROM ds_practice.member m LEFT JOIN ds_practice.orders o ON o.member_id=m.id WHERE m.id IN(181,182) GROUP BY m.id ORDER BY m.id');check('extra-left-count-star1-count-id0',result['extra']['countNull']==[{'id':181,'expanded_rows':1,'actual_orders':0},{'id':182,'expanded_rows':1,'actual_orders':0}])
 result['extra']['nullComparisons']=rows('SELECT NULL=NULL AS equals_null,NULL IS NULL AS is_null,2 NOT IN(1,NULL)AS not_in,NOT EXISTS(SELECT 1 FROM(SELECT 1 AS value UNION ALL SELECT NULL)q WHERE q.value=2)AS not_exists');check('extra-null-unknown-notin-vs-notexists',result['extra']['nullComparisons']==[{'equals_null':None,'is_null':1,'not_in':None,'not_exists':1}])
 ok('CREATE TABLE header_probe(id INT PRIMARY KEY,total INT NOT NULL)');ok('CREATE TABLE item_probe(id INT PRIMARY KEY,order_id INT NOT NULL)');ok('INSERT INTO header_probe VALUES(1,100),(2,100)');ok('INSERT INTO item_probe VALUES(101,1),(102,1),(103,2)');result['extra']['equalAmounts']=rows('SELECT COUNT(*)AS join_rows,SUM(h.total)AS wrong_total,SUM(DISTINCT h.total)AS wrong_distinct,(SELECT SUM(total)FROM header_probe)AS correct_total FROM header_probe h JOIN item_probe i ON i.order_id=h.id');check('extra-sum-distinct-loses-equal-separate-orders',result['extra']['equalAmounts']==[{'join_rows':3,'wrong_total':'300','wrong_distinct':'100','correct_total':'200'}])
 result['extra']['aliasWhere']=err('extra-select-alias-where1054','SELECT total_amount AS amount FROM ds_practice.orders WHERE amount>0',1054);result['extra']['ambiguous']=err('extra-unqualified-id1052','SELECT id FROM ds_practice.member m JOIN ds_practice.orders o ON o.member_id=m.id',1052);result['extra']['aggregateWhere']=err('extra-aggregate-in-where1111','SELECT member_id,COUNT(*) FROM ds_practice.orders WHERE COUNT(*)>1 GROUP BY member_id',1111);result['extra']['notGrouped']=err('extra-nondetermined-order-no1055','SELECT member_id,order_no,COUNT(*) FROM ds_practice.orders GROUP BY member_id',1055)
 result['extra']['functionalDependency']=rows('SELECT id,order_no,COUNT(*)AS n FROM ds_practice.orders WHERE id=1 GROUP BY id');check('extra-pk-functional-dependency-allowed',result['extra']['functionalDependency']==[{'id':1,'order_no':'ORD-2026-00001','n':1}]);result['extra']['identifierMarker']=err('extra-table-name-parameter1064',"PREPARE bad_identifier FROM 'SELECT * FROM ?'",1064)
 ok('CREATE TABLE upsert_probe(id INT PRIMARY KEY,email VARCHAR(40) NOT NULL UNIQUE,amount INT NOT NULL)');new=ok("INSERT INTO upsert_probe VALUES(1,'a@example.invalid',10)AS incoming ON DUPLICATE KEY UPDATE amount=incoming.amount");dup=ok("INSERT INTO upsert_probe VALUES(2,'a@example.invalid',20)AS incoming ON DUPLICATE KEY UPDATE amount=incoming.amount");same=ok("INSERT INTO upsert_probe VALUES(2,'a@example.invalid',20)AS incoming ON DUPLICATE KEY UPDATE amount=incoming.amount");result['extra']['upsert']={'new':new,'uniqueConflictChanged':dup,'unchanged':same,'rows':rows('SELECT * FROM upsert_probe')};check('extra-upsert-any-unique-not-only-pk',result['extra']['upsert']['rows']==[{'id':1,'email':'a@example.invalid','amount':20}]);check('extra-upsert-affected1-2-0-default-client-flags',[new['affectedRows'],dup['affectedRows'],same['affectedRows']]==[1,2,0])
 ok('CREATE TABLE autocommit_probe(id INT PRIMARY KEY)');ok('INSERT INTO autocommit_probe VALUES(1)');ok('ROLLBACK');result['extra']['autocommitAfterRollback']=rows('SELECT * FROM r04_extra.autocommit_probe',observer);check('extra-autocommit-insert-survives-later-rollback',result['extra']['autocommitAfterRollback']==[{'id':1}]);ok('START TRANSACTION');ok('INSERT INTO autocommit_probe VALUES(2)');before=rows('SELECT * FROM r04_extra.autocommit_probe ORDER BY id',observer);ok('COMMIT');ok('ROLLBACK');after=rows('SELECT * FROM r04_extra.autocommit_probe ORDER BY id',observer);result['extra']['explicitCommit']={'observerBeforeCommit':before,'observerAfterCommitThenRollback':after};check('extra-explicit-commit-survives-later-rollback',before==[{'id':1}]and after==[{'id':1},{'id':2}])
 ok('CREATE TABLE statement_probe(id INT PRIMARY KEY,amount INT CHECK(amount>=0))');ok('START TRANSACTION');ok('INSERT INTO statement_probe VALUES(1,10)');failed=err('extra-check-statement3819','INSERT INTO statement_probe VALUES(2,-1)',3819);inside=rows('SELECT * FROM statement_probe');outside=rows('SELECT * FROM r04_extra.statement_probe',observer);ok('ROLLBACK');result['extra']['statementError']={'failed':failed,'writerBeforeExplicitRollback':inside,'observerBeforeExplicitRollback':outside,'afterRollback':rows('SELECT * FROM statement_probe')};check('extra-statement-error-does-not-auto-rollback-earlier-insert',inside==[{'id':1,'amount':10}]and outside==[]and result['extra']['statementError']['afterRollback']==[])
 ok('CREATE TABLE safe_probe(id INT PRIMARY KEY,value INT)');ok('INSERT INTO safe_probe VALUES(1,10),(2,20)');ok('SET SESSION sql_safe_updates=1');result['extra']['safeUpdate']=err('extra-safe-update-no-key1175','UPDATE safe_probe SET value=99',1175);check('extra-safe-update-rows-unchanged',rows('SELECT * FROM safe_probe ORDER BY id')==[{'id':1,'value':10},{'id':2,'value':20}]);ok('SET SESSION sql_safe_updates=0')
 ok('CREATE TABLE race_probe(id INT PRIMARY KEY,stock INT NOT NULL)');ok('INSERT INTO race_probe VALUES(1,1)');ok('START TRANSACTION');first=rows('SELECT id,stock FROM race_probe WHERE id=1');other=ok('UPDATE r04_extra.race_probe SET stock=0 WHERE id=1',connection=observer);changed=ok('UPDATE race_probe SET stock=stock-1 WHERE id=1 AND stock>0');ok('ROLLBACK');result['extra']['controlledInterleaving']={'firstPlainSelect':first,'otherConnectionAutocommitUpdate':other,'guardedUpdate':changed,'final':rows('SELECT * FROM race_probe')};check('extra-precheck-select-does-not-lock-out-other-writer',first==[{'id':1,'stock':1}]and other['affectedRows']==1 and changed['affectedRows']==0 and result['extra']['controlledInterleaving']['final']==[{'id':1,'stock':0}])
 # Java에는 이 새 인스턴스의 SELECT 전용 계정만 전달한다. 인증값을 파일/로그에 남기지 않는다.
 with writer.cursor()as c:
  c.execute("CREATE USER 'r04_probe'@'127.0.0.1' IDENTIFIED BY %s",(jdbc_password,));c.execute("GRANT SELECT ON ds_practice.* TO 'r04_probe'@'127.0.0.1'")
 env=os.environ.copy();env.update(JAVA_HOME='/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home',R04_DB_URL=f'jdbc:mysql://127.0.0.1:{port}/ds_practice?characterEncoding=UTF-8&sslMode=REQUIRED&useServerPrepStmts=true',R04_DB_PASSWORD=jdbc_password,R04_EXPECTED_DATADIR=str(data),R04_EXPECTED_PORT=str(port),R04_JDBC_OUTPUT=str(run/'jdbc.json'))
 r=subprocess.run([str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','runProof'],cwd=ROOT,env=env,capture_output=True,text=True);(OUT/'jdbc-run.log').write_text(r.stdout+r.stderr);assert r.returncode==0,r.stdout+r.stderr
 result['jdbc']=json.loads((run/'jdbc.json').read_text());check('jdbc-eight-checks-passed',len(result['jdbc']['checks'])==8 and r.stdout.count('PASS ')==8);check('jdbc-original-result-agrees-native-sql',result['jdbc']['member1']==[{'id':r['id'],'orderNo':r['order_no'],'totalAmount':r['total_amount']}for r in b['block1']['events'][0]['rows']]);check('jdbc-server-prepared-statement-observed',all(q['statementClass']=='com.mysql.cj.jdbc.ServerPreparedStatement'for q in result['jdbc']['queries']))
 result['trace']=trace;(OUT/'execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');frozen=OUT/'checkpoints/expected-current-execution.json'
 if a.freeze:frozen.parent.mkdir(exist_ok=True);frozen.write_bytes((OUT/'execution.json').read_bytes())
 else:assert json.loads(frozen.read_text())==result,'frozen result differs; investigate before updating'
 print(json.dumps({'nativeChecks':len(result['checks']),'jdbcChecks':len(result['jdbc']['checks']),'mysql':result['runtime']['mysql'],'privateRuntime':str(run),'frozenMatch':not a.freeze},indent=2))
finally:
 if observer:observer.close()
 if writer:
  writer.close();env=os.environ.copy();env['MYSQL_PWD']=root_password
  r=subprocess.run([str(BASE/'bin/mysqladmin'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','shutdown'],env=env,capture_output=True,text=True,timeout=15);(run/'shutdown.log').write_text(r.stdout+r.stderr)
 try:server.wait(timeout=15)
 except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=10)
 (OUT/'runtime-last.json').write_text(json.dumps({'run':str(run),'pid':server.pid,'serverExit':server.returncode,'serverStopped':server.poll()is not None},indent=2)+'\n')
