"""원문 migration과 추가 계정 경계를 새 socket-only MySQL 사본에서 관찰한다."""
from pathlib import Path
import argparse,concurrent.futures,datetime,hashlib,hmac,json,os,secrets,socket,subprocess,tempfile,threading,time
import pymysql
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--mysql-base',required=True);p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
base=Path(a.mysql_base).resolve();runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
meta=json.loads((OUT/'source.json').read_text());assert hashlib.sha256((ROOT/meta['source']).read_bytes()).hexdigest()==meta['sha256']
for r in meta['externalStudyData']:assert hashlib.sha256((OUT/r['copy']).read_bytes()).hexdigest()==r['sha256']==hashlib.sha256(Path(r['source']).read_bytes()).hexdigest()
for r in meta['originalBlocks']:assert hashlib.sha256((OUT/'original'/r['file']).read_bytes()).hexdigest()==r['sha256']
run=Path(tempfile.mkdtemp(prefix='mysql-run-',dir=runtime));os.chmod(run,0o700);short=Path(tempfile.mkdtemp(prefix='b01-mysql-',dir='/tmp'));os.chmod(short,0o700)
data=run/'data';sock=short/'mysql.sock';pid=run/'mysqld.pid';root_password=secrets.token_urlsafe(32);probe_password=secrets.token_urlsafe(32)
common=[str(base/'bin/mysqld'),'--no-defaults',f'--basedir={base}',f'--datadir={data}'];r=subprocess.run(common+['--initialize-insecure'],capture_output=True,text=True);(run/'initialize.log').write_text(r.stdout+r.stderr);assert r.returncode==0
args=common+[f'--socket={sock}',f'--pid-file={pid}',f'--log-error={run/"server.log"}','--skip-networking','--mysqlx=OFF','--default-time-zone=+00:00','--innodb-buffer-pool-size=64M']
server=subprocess.Popen(args,stdout=(run/'stdout.log').open('w'),stderr=subprocess.STDOUT);admin=None;writer=None;facts={};checks=[]
NOW=datetime.datetime(2026,10,20);AFTER=NOW+datetime.timedelta(minutes=5)
def connect(user='b01_probe',password=None):return pymysql.connect(unix_socket=str(sock),user=user,password=probe_password if password is None else password,charset='utf8mb4',autocommit=True,cursorclass=pymysql.cursors.DictCursor)
def query(c,sql,params=()):
 with c.cursor()as cursor:n=cursor.execute(sql,params);return cursor.fetchall()if cursor.description else n
def check(id,ok,value):assert ok,id;checks.append(id);facts[id]=json.loads(json.dumps(value,default=str));print('PASS '+id,flush=True)
def ident(n):return n.to_bytes(16,'big')
def mac(code):return hmac.new(b'public-b01-demo-key-not-a-production-secret',code.encode(),hashlib.sha256).hexdigest()
def member(n,email=None):return query(writer,"INSERT INTO ds_practice.member(id,login_id,name,email,member_status,password_hash,created_at,updated_at)VALUES(%s,%s,'추가 계정 fixture',%s,'PENDING','demo-hash-v1',%s,%s)",(n,'demo-'+str(n),email or f'demo-{n}@example.invalid',NOW,NOW))
def challenge(n,member_id=90002,expires=AFTER,attempts=0):return query(writer,"INSERT INTO ds_practice.verification_challenge VALUES(%s,%s,'SIGNUP','EMAIL',%s,1,%s,%s,NULL,%s)",(ident(n),member_id,mac('000042'),expires,attempts,NOW))
CONSUME="UPDATE ds_practice.verification_challenge SET consumed_at=%s WHERE id=%s AND code_mac=%s AND consumed_at IS NULL AND expires_at>%s AND attempts<3 AND purpose='SIGNUP' AND channel='EMAIL'"
def consume(c,n,code='000042'):return query(c,CONSUME,(NOW,ident(n),mac(code),NOW))
def activate(c,owner,n):
 changed=query(c,CONSUME+' AND member_id=%s',(NOW,ident(n),mac('000042'),NOW,owner))
 if changed==1:query(c,"UPDATE ds_practice.member SET member_status='ACTIVE',email_verified_at=%s WHERE id=%s AND member_status='PENDING'",(NOW,owner))
 return changed

def race(action):
 barrier=threading.Barrier(2)
 def worker(i):
  c=connect()
  try:return action(c,i,barrier)
  finally:c.close()
 with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:return list(pool.map(worker,range(2)))
def reset_token(n,owner):return query(writer,"INSERT INTO ds_practice.password_reset_token VALUES(%s,%s,%s,%s,NULL,%s)",(ident(n),owner,hashlib.sha256(f'public-reset-fixture-{n}'.encode()).digest(),NOW+datetime.timedelta(minutes=15),NOW))
def snapshot(owner,n):
 row=query(writer,"SELECT password_hash,credential_version FROM ds_practice.member WHERE id=%s",(owner,))[0]
 return {'hashMarker':row['password_hash'],'version':row['credential_version'],'tokenUsed':query(writer,"SELECT used_at IS NOT NULL AS used FROM ds_practice.password_reset_token WHERE id=%s",(ident(n),))[0]['used'],'sessionRows':query(writer,"SELECT COUNT(*)AS n FROM ds_practice.b01_session WHERE member_id=%s",(owner,))[0]['n'],'unusedResetRows':query(writer,"SELECT COUNT(*)AS n FROM ds_practice.password_reset_token WHERE member_id=%s AND used_at IS NULL",(owner,))[0]['n'],'auditRows':query(writer,"SELECT COUNT(*)AS n FROM ds_practice.b01_audit WHERE member_id=%s",(owner,))[0]['n']}
def reset(c,owner,n,fail=False):
 c.begin()
 try:
  changed=query(c,"UPDATE ds_practice.password_reset_token SET used_at=%s WHERE id=%s AND member_id=%s AND token_hash=%s AND used_at IS NULL AND expires_at>%s",(NOW,ident(n),owner,hashlib.sha256(f'public-reset-fixture-{n}'.encode()).digest(),NOW))
  if changed==0:c.rollback();return 0
  query(c,"UPDATE ds_practice.member SET password_hash='demo-hash-v2',credential_version=credential_version+1 WHERE id=%s",(owner,))
  if fail:raise RuntimeError('injected failure before session cleanup')
  query(c,"DELETE FROM ds_practice.b01_session WHERE member_id=%s",(owner,));query(c,"UPDATE ds_practice.password_reset_token SET used_at=%s WHERE member_id=%s AND used_at IS NULL",(NOW,owner));query(c,"INSERT INTO ds_practice.b01_audit(member_id,event_kind)VALUES(%s,'RESET')",(owner,));c.commit();return 1
 except Exception:c.rollback();raise
try:
 deadline=time.monotonic()+30
 while time.monotonic()<deadline:
  if server.poll()is not None:raise RuntimeError('private MySQL startup failed')
  if sock.exists():
   try:admin=connect('root','');break
   except pymysql.MySQLError:pass
  time.sleep(.1)
 assert admin,'private MySQL timeout'
 guard=query(admin,'SELECT @@datadir AS datadir,@@socket AS socket,@@skip_networking AS skipNetworking,@@port AS port')[0]
 assert Path(guard['datadir']).resolve()==data.resolve()and Path(guard['socket']).resolve()==sock.resolve()and guard['skipNetworking']==1 and int(pid.read_text())==server.pid
 x=query(admin,"SELECT PLUGIN_STATUS FROM information_schema.plugins WHERE PLUGIN_NAME='mysqlx'");assert not x or x[0]['PLUGIN_STATUS']=='DISABLED'
 (run/'guard.json').write_text(json.dumps(dict(pid=server.pid,guard=guard,mysqlx=x,directoryMode=oct(short.stat().st_mode&0o777),passwords='fresh perrun/not logged'),indent=2)+'\n')
 query(admin,"ALTER USER 'root'@'localhost' IDENTIFIED BY %s",(root_password,))
 client=[str(base/'bin/mysql'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','--default-character-set=utf8mb4'];env=os.environ.copy();env['MYSQL_PWD']=root_password
 for name in ['external-study-schema.sql','external-study-seed.sql','block-03.sql']:
  cmd=client+(['ds_practice']if name=='block-03.sql'else[]);r=subprocess.run(cmd,input=(OUT/'original'/name).read_text(),env=env,capture_output=True,text=True);(run/(name+'.log')).write_text(r.stdout+r.stderr);assert r.returncode==0,r.stderr
 query(admin,'CREATE TABLE ds_practice.b01_session(id INT PRIMARY KEY,member_id BIGINT NOT NULL)');query(admin,'CREATE TABLE ds_practice.b01_audit(id INT AUTO_INCREMENT PRIMARY KEY,member_id BIGINT NOT NULL,event_kind VARCHAR(20)NOT NULL)')
 query(admin,"CREATE USER 'b01_probe'@'localhost' IDENTIFIED BY %s",(probe_password,));query(admin,"GRANT SELECT,INSERT,UPDATE,DELETE ON ds_practice.* TO 'b01_probe'@'localhost'");writer=connect()
 version=query(writer,'SELECT VERSION()AS v')[0]['v'];check('private-native-mysql-socket-only',version=='8.4.11',dict(version=version,skipNetworking=True,mysqlx=False,scope='fresh datadir/socket/ownPID; application probe CRUD only'))
 baseline=query(writer,'SELECT COUNT(*)AS n FROM ds_practice.member')[0]['n'];columns=query(writer,"SELECT COLUMN_NAME,IS_NULLABLE,COLUMN_DEFAULT FROM information_schema.columns WHERE TABLE_SCHEMA='ds_practice'AND TABLE_NAME='member'AND COLUMN_NAME IN('member_status','password_hash','credential_version')ORDER BY COLUMN_NAME")
 check('source-migration-applied-private-copy',columns==[{'COLUMN_NAME':'credential_version','IS_NULLABLE':'NO','COLUMN_DEFAULT':'0'},{'COLUMN_NAME':'member_status','IS_NULLABLE':'NO','COLUMN_DEFAULT':'PENDING'},{'COLUMN_NAME':'password_hash','IS_NULLABLE':'YES','COLUMN_DEFAULT':None}],dict(columns=columns,scope='original DDL unchanged; existing hash backfill/NOT NULL step not executed'))
 def signup(c,i,barrier):
  c.begin();seen=query(c,"SELECT COUNT(*)AS n FROM ds_practice.member WHERE email='race@example.invalid'")[0]['n'];barrier.wait(timeout=5)
  try:query(c,"INSERT INTO ds_practice.member(login_id,name,email,member_status,created_at,updated_at)VALUES(%s,'경합 fixture','race@example.invalid','PENDING',%s,%s)",('race-'+str(i),NOW,NOW));c.commit();return[seen,1]
  except pymysql.IntegrityError as e:c.rollback();return[seen,e.args[0]]
 results=race(signup);count=query(writer,"SELECT COUNT(*)AS n FROM ds_practice.member WHERE email='race@example.invalid'")[0]['n'];check('extra-signup-two-prechecks-unique-one-winner',sorted(results)==[[0,1],[0,1062]]and count==1,dict(precheckCounts=sorted(r[0]for r in results),insertOutcomes=sorted(r[1]for r in results),storedRows=count,scope='two independent connections; same literal email; no normalization or HTTP409 implementation'))
 for n in range(90001,90006):member(n)
 challenge(1,90001);observer=connect();writer.begin();changed=activate(writer,90001,1);before=query(observer,"SELECT member_status FROM ds_practice.member WHERE id=90001")[0]['member_status'];writer.commit();after=query(observer,"SELECT member_status FROM ds_practice.member WHERE id=90001")[0]['member_status'];observer.close()
 check('extra-consume-activation-commit-observer',changed==1 and before=='PENDING'and after=='ACTIVE'and consume(writer,1)==0,dict(consumeAffected=changed,independentBeforeCommit=before,independentAfterCommit=after,reuseAffected=0,scope='added email-only policy/direct SQL; source registration service absent'))
 challenge(6,90002,expires=NOW);challenge(7,90002)
 wrong_owner=activate(writer,90003,7);expired_activation=activate(writer,90002,6)
 states=[r['member_status']for r in query(writer,'SELECT member_status FROM ds_practice.member WHERE id IN(90002,90003)ORDER BY id')]
 check('extra-activation-requires-matching-live-challenge',wrong_owner==0 and expired_activation==0 and states==['PENDING','PENDING'],dict(wrongOwnerAffected=wrong_owner,expiredAffected=expired_activation,memberStates=states,scope='added guarded helper; mismatched owner/expired paths do not activate; not HTTP auth'))
 challenge(2)
 def consume_race(c,i,barrier):c.begin();barrier.wait(timeout=5);n=consume(c,2);c.commit();return n
 raced=sorted(race(consume_race));check('extra-challenge-concurrent-consume-one-winner',raced==[0,1],dict(affectedRows=raced,scope='two connections/same added conditional UPDATE'))
 challenge(3,expires=NOW);expired=consume(writer,3);challenge(4,attempts=3);limited=consume(writer,4)
 check('extra-expiry-boundary-and-attempt-limit',expired==0 and limited==0,dict(expiresEqualsNowAffected=expired,attemptsAtLimitAffected=limited,addedMaxAttempts=3,scope='extra policy; not source store implementation'))
 challenge(5)
 wrong="UPDATE ds_practice.verification_challenge SET attempts=attempts+1 WHERE id=%s AND consumed_at IS NULL AND expires_at>%s AND attempts<3 AND code_mac<>%s"
 writer.begin();query(writer,wrong,(ident(5),NOW,mac('000043')));writer.rollback();rolled=query(writer,'SELECT attempts FROM ds_practice.verification_challenge WHERE id=%s',(ident(5),))[0]['attempts']
 attempts=[]
 for _ in range(3):writer.begin();attempts.append(query(writer,wrong,(ident(5),NOW,mac('000043'))));writer.commit()
 final=query(writer,'SELECT attempts FROM ds_practice.verification_challenge WHERE id=%s',(ident(5),))[0]['attempts'];accepted=consume(writer,5)
 check('extra-failure-counter-needs-commit',rolled==0 and attempts==[1,1,1]and final==3 and accepted==0,dict(afterRolledBackWrongAttempt=rolled,committedWrongAffected=attempts,finalAttempts=final,correctCodeAfterLimitAffected=accepted,scope='added direct SQL experiment; throwing+rollback would lose increment'))
 challenge(11,90003);writer.begin();deleted=query(writer,'DELETE FROM ds_practice.verification_challenge WHERE member_id=90003 AND consumed_at IS NULL');challenge(12,90003);writer.commit();old=consume(writer,11);new=consume(writer,12)
 check('extra-sequential-resend-replaces-old-challenge',deleted==1 and old==0 and new==1,dict(oldChallengeDeleted=deleted,oldConsumeAffected=old,newConsumeAffected=new,scope='added single transaction/sequential resend; concurrent resend not tested'))
 for owner,first in [(90004,41),(90005,51)]:
  reset_token(first,owner);reset_token(first+1,owner)
  for i in range(2):query(writer,'INSERT INTO ds_practice.b01_session VALUES(%s,%s)',(owner*10+i,owner))
 before=snapshot(90004,41)
 owner_a=before;owner_b=snapshot(90005,51);mismatch=reset(writer,90005,41)
 check('extra-reset-token-owner-mismatch-no-write',mismatch==0 and snapshot(90004,41)==owner_a and snapshot(90005,51)==owner_b,dict(affected=mismatch,tokenOwnerUnchanged=True,requestedOwnerUnchanged=True,scope='added token/member_id predicate; no HTTP handle/authentication tested'))
 try:reset(writer,90004,41,True)
 except RuntimeError:pass
 rollback=snapshot(90004,41);check('extra-reset-mid-failure-rolls-back-all',before==rollback,dict(before=before,afterRollback=rollback,scope='added DB hash marker/session rows only; not external Redis/JWT revocation'))
 success=reset(writer,90004,41);committed=snapshot(90004,41);reuse=reset(writer,90004,41)
 expected={'hashMarker':'demo-hash-v2','version':1,'tokenUsed':1,'sessionRows':0,'unusedResetRows':0,'auditRows':1}
 check('extra-reset-commit-hash-version-sessions-tokens',success==1 and reuse==0 and committed==expected,dict(affected=success,reuseAffected=reuse,afterCommit=committed,scope='symbolic demo hash marker; Java PasswordEncoder separate; same DB session table not real session/JWT validation'))
 def reset_race(c,i,barrier):barrier.wait(timeout=5);return reset(c,90005,51)
 raced=sorted(race(reset_race));after=snapshot(90005,51);check('extra-reset-concurrent-one-version-increment',raced==[0,1]and after==expected,dict(affectedRows=raced,after=after,scope='two connections same token; no HTTP status or timing test'))
 query(writer,'DELETE FROM ds_practice.b01_session');query(writer,'DELETE FROM ds_practice.b01_audit');query(writer,'DELETE FROM ds_practice.verification_challenge');query(writer,'DELETE FROM ds_practice.password_reset_token');query(writer,"DELETE FROM ds_practice.member WHERE id BETWEEN 90001 AND 90005 OR email='race@example.invalid'")
 remaining=query(writer,'SELECT COUNT(*)AS n FROM ds_practice.member')[0]['n'];fixture_counts={table:query(writer,'SELECT COUNT(*)AS n FROM ds_practice.'+table)[0]['n']for table in ['b01_session','b01_audit','verification_challenge','password_reset_token']};check('private-account-fixtures-cleaned-seed-count-kept',remaining==baseline and all(n==0 for n in fixture_counts.values()),dict(seedMemberCount=baseline,afterMemberCount=remaining,remainingFixtureRows=fixture_counts,scope='rowcount only; copied migration remains private; not all seed values compared'))
 result={'checks':sorted(checks),'facts':facts};(OUT/'mysql-execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');frozen=OUT/'checkpoints/expected-mysql.json'
 if a.freeze:frozen.parent.mkdir(exist_ok=True);frozen.write_bytes((OUT/'mysql-execution.json').read_bytes())
 else:assert json.loads(frozen.read_text())==result,'frozen differs; investigate first'
 print(json.dumps(dict(checks=len(checks),privateRuntime=str(run),frozenMatch=not a.freeze),indent=2))
finally:
 if writer:writer.close()
 if admin:
  admin.close();env=os.environ.copy();env['MYSQL_PWD']=root_password;r=subprocess.run([str(base/'bin/mysqladmin'),'--no-defaults','--no-login-paths','--protocol=SOCKET',f'--socket={sock}','-uroot','shutdown'],env=env,capture_output=True,text=True,timeout=15);(run/'shutdown.log').write_text(r.stdout+r.stderr)
 try:server.wait(timeout=15)
 except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=5)
 (OUT/'mysql-runtime-last.json').write_text(json.dumps(dict(run=str(run),pid=server.pid,serverExit=server.returncode,serverStopped=server.poll()is not None),indent=2)+'\n');assert server.returncode==0
