"""공식 portable MySQL의 새 datadir/socket에서만 원문 SQL·추가 probe를 실행한다."""
from pathlib import Path
import argparse,datetime,decimal,hashlib,json,os,re,subprocess,tempfile,time
import pymysql

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--mysql-base',required=True);p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
BASE=Path(a.mysql_base).resolve();RUNTIME=Path(a.runtime_root).resolve();RUNTIME.mkdir(parents=True,exist_ok=True)
meta=json.loads((OUT/'source.json').read_text());source=ROOT/meta['source']
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'```(bash|sql)\n(.*?)\n```',source.read_text(),re.S)
assert len(blocks)==5
for (_,body),entry in zip(blocks,meta['originalBlocks'],strict=True):
 raw=(body+'\n').encode();assert raw==(OUT/'original'/entry['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==entry['sha256']
for entry in meta['externalStudyData']:
 assert hashlib.sha256((ROOT/entry['copy']).read_bytes()).hexdigest()==entry['sha256']
run=Path(tempfile.mkdtemp(prefix='run-',dir=RUNTIME));os.chmod(run,0o700)
short=Path(tempfile.mkdtemp(prefix='r03-mysql-',dir='/tmp'));os.chmod(short,0o700)
data=run/'data';socket=short/'mysql.sock';log=run/'server.log';pidfile=run/'mysqld.pid'
common=[str(BASE/'bin/mysqld'),'--no-defaults',f'--basedir={BASE}',f'--datadir={data}']
init=subprocess.run(common+['--initialize-insecure'],capture_output=True,text=True);(run/'initialize.log').write_text(init.stdout+init.stderr);assert init.returncode==0,init.stderr
args=common+[f'--socket={socket}',f'--pid-file={pidfile}',f'--log-error={log}','--skip-networking','--mysqlx=OFF','--innodb-buffer-pool-size=64M','--mysql-native-password=OFF']
server=subprocess.Popen(args,stdout=(run/'stdout.log').open('w'),stderr=subprocess.STDOUT)
writer=observer=None;result={'runtime':{},'source':{},'extra':{},'checks':[]};trace=[]
def clean(x):
 if isinstance(x,dict):return {k:clean(v)for k,v in x.items()}
 if isinstance(x,(tuple,list)):return [clean(v)for v in x]
 if isinstance(x,decimal.Decimal):return str(x)
 if isinstance(x,(datetime.date,datetime.datetime,datetime.time)):return x.isoformat(sep=' ')if isinstance(x,datetime.datetime)else x.isoformat()
 return x

def connect():return pymysql.connect(unix_socket=str(socket),user='root',charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
def sql(q,params=None,conn=None):
 c=conn or writer
 with c.cursor()as cur:
  try:
   n=cur.execute(q,params);rows=clean(cur.fetchall())if cur.description else None
   r={'sql':q,'parameters':clean(params),'rows':rows,'affectedRows':n if not cur.description else None}
  except pymysql.MySQLError as e:r={'sql':q,'parameters':clean(params),'error':{'code':e.args[0],'message':e.args[1]}}
 trace.append(r);return r

def rows(q,conn=None):
 r=sql(q,conn=conn);assert 'error'not in r,r;return r['rows']
def ok(q,params=None):
 r=sql(q,params);assert 'error'not in r,r;return r

def check(name,condition):
 assert condition,name;result['checks'].append(name);print('PASS '+name,flush=True)
def error(name,q,code,params=None):
 r=sql(q,params);check(name,r.get('error',{}).get('code')==code);return r

def state():return {'writer':rows('SELECT id, price, stock FROM ds_practice.product WHERE id=1'),'observer':rows('SELECT id, price, stock FROM ds_practice.product WHERE id=1',observer)}
try:
 deadline=time.monotonic()+30
 while time.monotonic()<deadline:
  if server.poll()is not None:raise RuntimeError(log.read_text())
  if socket.exists():
   try:writer=connect();break
   except pymysql.MySQLError:pass
  time.sleep(.1)
 assert writer is not None,'private server start timeout'
 guard=rows('SELECT @@datadir AS datadir, @@socket AS socket, @@skip_networking AS skip_networking')
 assert Path(guard[0]['datadir']).resolve()==data.resolve() and Path(guard[0]['socket']).resolve()==socket.resolve() and guard[0]['skip_networking']==1
 x=rows("SELECT PLUGIN_NAME, PLUGIN_STATUS FROM information_schema.plugins WHERE PLUGIN_NAME='mysqlx'");assert x==[]or x[0]['PLUGIN_STATUS']=='DISABLED'
 (run/'isolation.json').write_text(json.dumps({'pid':server.pid,'arguments':args,'guard':guard,'mysqlx':x,'socketDirectoryMode':oct(short.stat().st_mode&0o777)},indent=2)+'\n')
 # 매 실행마다 달라지는 PID/socket/datadir 검증은 run/isolation.json에만 보존한다.
 trace.clear()
 # 원본 DROP DATABASE는 이 새 인스턴스의 datadir/socket 검증 뒤에만 전달한다.
 client=[str(BASE/'bin/mysql'),'--no-defaults','--protocol=SOCKET',f'--socket={socket}','-uroot','--default-character-set=utf8mb4']
 for name in ['external-study-schema.sql','external-study-seed.sql']:
  r=subprocess.run(client,input=(OUT/'original'/name).read_text(),capture_output=True,text=True);(run/(name+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 ok('USE ds_practice');observer=connect();ok('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED');sql('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED',conn=observer)
 result['runtime']=rows('SELECT VERSION() AS mysql, @@version_compile_machine AS machine, @@version_compile_os AS os, @@sql_mode AS sqlMode, @@innodb_page_size AS pageSize, @@innodb_default_row_format AS rowFormat, @@character_set_connection AS charset, @@collation_connection AS collation')[0]
 check('native-8.4.11-arm64-private-no-tcp',result['runtime']['mysql']=='8.4.11'and guard[0]['skip_networking']==1)
 counts={t:rows(f'SELECT COUNT(*) AS n FROM `{t}`')[0]['n']for t in ['member','category','product','product_option','cart_item','orders','order_item','payment','delivery','subscription','coupon','member_coupon','point_history','article','comment','review']}
 result['source']['seedCounts']=counts;check('original-seed-16-tables',list(counts.values())==[200,10,80,160,120,1000,2500,1000,1000,150,10,300,1500,120,600,400])
 result['source']['initialProduct']=state();check('source-product1-price9700-stock33',result['source']['initialProduct']['writer']==[{'id':1,'price':'9700','stock':33}])
 # \G는 mysql client 표시 명령이다. PyMySQL 서버 전송 시만 ;로 치환하며 추출 파일은 보존한다.
 for blockno in range(2,6):
  raw=(OUT/'original'/f'block-{blockno:02}.sql').read_text();adapted=re.sub(r'\\G\b',';',raw)
  statements=[s.strip()for s in re.sub(r'(?m)^\s*--[^\n]*','',adapted).split(';')if s.strip()]
  events=[]
  for q in statements:
   r=sql(q);events.append(r)
   if r.get('error'):check('source-check-negative-price-error3819',blockno==4 and r['error']['code']==3819)
   else:assert 'error'not in r
   if blockno==5 and q.startswith('UPDATE'):events.append({'additionalIndependentObservationAfterUpdate':state()})
  result['source'][f'block{blockno}']={'adapter':'only mysql client \\G display terminator -> ;, SQL comments removed for splitting; SQL expressions unchanged','events':events}
 copyddl=result['source']['block3']['events'][2]['rows'][0]['Create Table']
 check('source-like-alter-name180-drop', '`name` varchar(180) NOT NULL'in copyddl and rows("SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema='ds_practice' AND table_name='r03_product_probe'")[0]['n']==0)
 originalddl=result['source']['block2']['events'][0]['rows'][0]['Create Table']
 check('like-keeps-check-index-omits-fk','CHECK'in copyddl and 'KEY `ix_product_stock`'in copyddl and 'FOREIGN KEY'not in copyddl and 'FOREIGN KEY'in originalddl)
 check('source-double0-decimal1',result['source']['block5']['events'][0]['rows']==[{'double_equal':0,'decimal_equal':1}])
 middle=next(e['additionalIndependentObservationAfterUpdate']for e in result['source']['block5']['events']if 'additionalIndependentObservationAfterUpdate'in e)
 check('source-update-writer9701-observer9700',middle['writer'][0]['price']=='9701'and middle['observer'][0]['price']=='9700')
 result['source']['afterRollback']=state();check('source-rollback9700-both',result['source']['afterRollback']==result['source']['initialProduct'])
 ok("CREATE DATABASE r03_extra CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci");ok('USE r03_extra')
 # 추가 probe는 원래 학습 스키마와 구분한다.
 ok('CREATE TABLE text_probe (id INT PRIMARY KEY, label VARCHAR(20), value VARCHAR(255) NOT NULL) ENGINE=InnoDB')
 for i,(label,value)in enumerate([('ASCII','a'*255),('KOREAN','가'*255),('EMOJI','😀'*255)],1):ok('INSERT INTO text_probe VALUES (%s,%s,%s)',(i,label,value))
 result['extra']['varchar']=rows('SELECT label,CHAR_LENGTH(value) AS characters,OCTET_LENGTH(value) AS bytes FROM text_probe ORDER BY id')
 check('varchar255-character-vs-payload',result['extra']['varchar']==[{'label':'ASCII','characters':255,'bytes':255},{'label':'KOREAN','characters':255,'bytes':765},{'label':'EMOJI','characters':255,'bytes':1020}])
 result['extra']['varcharTooLong']=error('varchar256-strict-error1406','INSERT INTO text_probe VALUES (4,\'TOO_LONG\',%s)',1406,('가'*256,))
 result['extra']['varcharMetadata']=rows("SELECT CHARACTER_MAXIMUM_LENGTH AS chars,CHARACTER_OCTET_LENGTH AS bytes FROM information_schema.columns WHERE table_schema='r03_extra' AND table_name='text_probe' AND column_name='value'")
 check('varchar-declared-max-255-1020',result['extra']['varcharMetadata']==[{'chars':255,'bytes':1020}])
 ok('CREATE TABLE nullable_check (id INT PRIMARY KEY, price DECIMAL(12,0), CONSTRAINT ck_probe_price CHECK(price>=0))')
 ok('INSERT INTO nullable_check VALUES(1,NULL)');result['extra']['nullableNegative']=error('nullable-check-negative3819','INSERT INTO nullable_check VALUES(2,-1)',3819)
 result['extra']['nullableCheck']=rows('SELECT id,price,price>=0 AS predicate FROM nullable_check');check('check-null-unknown-allowed',result['extra']['nullableCheck']==[{'id':1,'price':None,'predicate':None}])
 ok('CREATE TABLE required_default (id INT PRIMARY KEY, stock INT NOT NULL DEFAULT 0, price INT NOT NULL CHECK(price>=0))');ok('INSERT INTO required_default(id,price)VALUES(1,10)')
 result['extra']['requiredNull']=error('not-null-error1048','INSERT INTO required_default VALUES(2,NULL,10)',1048)
 result['extra']['missingRequired']=error('missing-required-error1364','INSERT INTO required_default(id)VALUES(3)',1364)
 result['extra']['default']=rows('SELECT * FROM required_default');check('omitted-stock-default0',result['extra']['default']==[{'id':1,'stock':0,'price':10}])
 ok('CREATE TABLE unique_probe(id BIGINT PRIMARY KEY,email VARCHAR(160) NULL UNIQUE)');ok("INSERT INTO unique_probe VALUES(1,NULL),(2,NULL),(3,'a@example.invalid')")
 result['extra']['uniqueDuplicate']=error('unique-non-null-duplicate1062',"INSERT INTO unique_probe VALUES(4,'a@example.invalid')",1062)
 result['extra']['uniqueNulls']=rows('SELECT COUNT(*) AS nullRows FROM unique_probe WHERE email IS NULL');check('unique-allows-two-null',result['extra']['uniqueNulls']==[{'nullRows':2}])
 result['extra']['pkDuplicate']=error('primary-duplicate1062','INSERT INTO unique_probe VALUES(1,NULL)',1062)
 result['extra']['pkNull']=error('primary-null1048','INSERT INTO unique_probe VALUES(NULL,NULL)',1048)
 ok('CREATE TABLE bool_probe(id INT PRIMARY KEY, loose BOOLEAN NOT NULL, closed BOOLEAN NOT NULL CHECK(closed IN(0,1)))');ok('INSERT INTO bool_probe VALUES(1,2,1)')
 result['extra']['boolean']=rows('SELECT * FROM bool_probe');check('boolean-alias-allows2-without-check',result['extra']['boolean']==[{'id':1,'loose':2,'closed':1}])
 result['extra']['booleanClosed']=error('boolean-domain-check3819','INSERT INTO bool_probe VALUES(2,1,2)',3819)
 ok('START TRANSACTION');result['extra']['sourceBoolean2']=ok('UPDATE ds_practice.subscription SET auto_renew=2 WHERE id=1');result['extra']['sourceBooleanValue']=rows('SELECT id,auto_renew FROM ds_practice.subscription WHERE id=1');ok('ROLLBACK');check('source-subscription-no-01-check',result['extra']['sourceBooleanValue']==[{'id':1,'auto_renew':2}])
 ok('START TRANSACTION');result['extra']['sourceFkChild']=error('source-invalid-member-fk1452','UPDATE ds_practice.orders SET member_id=999999 WHERE id=1',1452);ok('ROLLBACK')
 ok('START TRANSACTION');result['extra']['sourceFkParent']=error('source-parent-delete1451','DELETE FROM ds_practice.member WHERE id=1',1451);ok('ROLLBACK')
 ok('CREATE TABLE parent_probe(id BIGINT PRIMARY KEY)');result['extra']['fkMismatch']=error('fk-signedness-mismatch3780','CREATE TABLE child_bad(id INT PRIMARY KEY,parent_id BIGINT UNSIGNED,FOREIGN KEY(parent_id)REFERENCES parent_probe(id))',3780)
 ok('CREATE TABLE cascade_probe(id INT PRIMARY KEY,parent_id BIGINT,FOREIGN KEY(parent_id)REFERENCES parent_probe(id)ON DELETE CASCADE)');ok('CREATE TABLE null_probe(id INT PRIMARY KEY,parent_id BIGINT NULL,FOREIGN KEY(parent_id)REFERENCES parent_probe(id)ON DELETE SET NULL)');ok('INSERT INTO parent_probe VALUES(1)');ok('INSERT INTO cascade_probe VALUES(1,1)');ok('INSERT INTO null_probe VALUES(1,1)');ok('DELETE FROM parent_probe WHERE id=1')
 result['extra']['referentialActions']={'cascade':rows('SELECT * FROM cascade_probe'),'setNull':rows('SELECT * FROM null_probe')};check('extra-cascade-vs-set-null',result['extra']['referentialActions']=={'cascade':[],'setNull':[{'id':1,'parent_id':None}]})
 ok('CREATE TABLE key768(value VARCHAR(768) NOT NULL,UNIQUE KEY uk(value)) ENGINE=InnoDB ROW_FORMAT=DYNAMIC')
 result['extra']['key769']=error('unique-varchar769-error1071','CREATE TABLE key769(value VARCHAR(769) NOT NULL,UNIQUE KEY uk(value)) ENGINE=InnoDB ROW_FORMAT=DYNAMIC',1071)
 result['extra']['keyComposite']=error('unique-composite800-error1071','CREATE TABLE key800(a VARCHAR(400) NOT NULL,b VARCHAR(400) NOT NULL,UNIQUE KEY uk(a,b)) ENGINE=InnoDB ROW_FORMAT=DYNAMIC',1071)
 check('key768-3072-on-page16384',result['runtime']['pageSize']==16384 and rows("SELECT ROW_FORMAT AS rowFormat FROM information_schema.tables WHERE table_schema='r03_extra'AND table_name='key768'")==[{'rowFormat':'Dynamic'}])
 ok('CREATE TABLE ddl_marker(id INT PRIMARY KEY)');ok('START TRANSACTION');ok('INSERT INTO ddl_marker VALUES(1)');before=rows('SELECT * FROM r03_extra.ddl_marker',observer);ok('CREATE TABLE ddl_created(id INT PRIMARY KEY)');after=rows('SELECT * FROM r03_extra.ddl_marker',observer);ok('ROLLBACK')
 result['extra']['ddl']={'observerBeforeCreate':before,'observerAfterCreate':after,'markerAfterRollback':rows('SELECT * FROM ddl_marker'),'createdTableAfterRollback':rows("SELECT table_name FROM information_schema.tables WHERE table_schema='r03_extra'AND table_name='ddl_created'")}
 check('ddl-implicit-commits-prior-dml',before==[]and after==[{'id':1}]and result['extra']['ddl']['markerAfterRollback']==[{'id':1}]);check('ddl-not-undone-by-user-rollback',result['extra']['ddl']['createdTableAfterRollback']==[{'TABLE_NAME':'ddl_created'}]or result['extra']['ddl']['createdTableAfterRollback']==[{'table_name':'ddl_created'}])
 ok('CREATE TABLE time_probe(id INT PRIMARY KEY,d DATE,dt DATETIME,ts TIMESTAMP)');ok("SET SESSION time_zone='+00:00'");ok("INSERT INTO time_probe VALUES(1,'2026-10-20','2026-10-20 00:00:00','2026-10-20 00:00:00')");utc=rows('SELECT * FROM time_probe');ok("SET SESSION time_zone='+09:00'");seoul=rows('SELECT * FROM time_probe');result['extra']['timezones']={'utc':utc,'plus09':seoul}
 check('timestamp-converts-datetime-unchanged',utc[0]['dt']==seoul[0]['dt']=='2026-10-20 00:00:00'and utc[0]['ts']=='2026-10-20 00:00:00'and seoul[0]['ts']=='2026-10-20 09:00:00')
 result['extra']['timestampRange']=error('timestamp-2040-out-of-range1292',"INSERT INTO time_probe VALUES(2,'2040-01-01','2040-01-01 00:00:00','2040-01-01 00:00:00')",1292)
 # VARCHAR와 CHECK/FK/DDL 외 전체 원문·성능·물리 page를 검증했다고 확대하지 않는다.
 result['trace']=trace
 (OUT/'execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 expected=OUT/'checkpoints/expected-current-execution.json'
 if a.freeze:expected.parent.mkdir(exist_ok=True);expected.write_bytes((OUT/'execution.json').read_bytes())
 else:assert json.loads(expected.read_text())==result,'frozen execution differs; investigate before updating'
 (run/'summary.json').write_text(json.dumps({'checks':len(result['checks']),'runtime':result['runtime'],'scope':'original SQL2-5 with client terminator adapter, copied external schema/seed, additional r03_extra; no existing DB'},indent=2)+'\n')
 print(json.dumps({'checks':len(result['checks']),'mysql':result['runtime']['mysql'],'privateRuntime':str(run),'socket':str(socket),'frozenMatch':not a.freeze},indent=2))
finally:
 if observer:observer.close()
 if writer:
  writer.close()
  shutdown=subprocess.run([str(BASE/'bin/mysqladmin'),'--no-defaults','--protocol=SOCKET',f'--socket={socket}','-uroot','shutdown'],capture_output=True,text=True,timeout=15)
  (run/'shutdown.log').write_text(shutdown.stdout+shutdown.stderr)
 try:server.wait(timeout=15)
 except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=10)
 (OUT/'runtime-last.json').write_text(json.dumps({'run':str(run),'socket':str(socket),'pid':server.pid,'serverExit':server.returncode,'serverStopped':server.poll()is not None},indent=2)+'\n')
