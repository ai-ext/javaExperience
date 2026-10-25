"""새 private Redis 프로세스만 실행한다. 기존 서비스/설정은 사용하지 않는다."""
from pathlib import Path
import argparse,hashlib,json,os,secrets,socket,subprocess,tempfile,time
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--redis-base',required=True);p.add_argument('--runtime-root',required=True);p.add_argument('--freeze',action='store_true');a=p.parse_args()
base=Path(a.redis_base).resolve();runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
run=Path(tempfile.mkdtemp(prefix='redis-run-',dir=runtime));os.chmod(run,0o700)
short=Path(tempfile.mkdtemp(prefix='b01-redis-',dir='/tmp'));os.chmod(short,0o700)
sock=short/'redis.sock';pid=run/'redis.pid';password=secrets.token_urlsafe(32)
with socket.socket()as port_probe:port_probe.bind(('127.0.0.1',0));port=port_probe.getsockname()[1]
config=run/'redis.conf';config.write_text(f'bind 127.0.0.1\nport {port}\nprotected-mode yes\nrequirepass {password}\nunixsocket {sock}\nunixsocketperm 700\ndir {run}\npidfile {pid}\nsave ""\nappendonly no\ndaemonize no\nlogfile ""\n');os.chmod(config,0o600)
server=subprocess.Popen([str(base/'src/redis-server'),str(config)],stdout=(run/'server.log').open('w'),stderr=subprocess.STDOUT)
class Resp:
 def __init__(self):self.sock=socket.socket(socket.AF_UNIX);self.sock.settimeout(5);self.sock.connect(str(sock));self.f=self.sock.makefile('rb');self.command('AUTH',password)
 def read(self):
  line=self.f.readline()
  if not line:raise EOFError('Redis connection closed')
  kind,value=line[:1],line[1:-2]
  if kind==b'+':return value.decode()
  if kind==b'-':raise RuntimeError(value.decode())
  if kind==b':':return int(value)
  if kind==b'$':
   n=int(value)
   if n==-1:return None
   data=self.f.read(n);assert self.f.read(2)==b'\r\n';return data.decode()
  if kind==b'*':return[self.read()for _ in range(int(value))]
  raise AssertionError('RESP type')
 def command(self,*args):
  parts=[str(x).encode()for x in args];wire=b'*'+str(len(parts)).encode()+b'\r\n'+b''.join(b'$'+str(len(x)).encode()+b'\r\n'+x+b'\r\n'for x in parts);self.sock.sendall(wire);return self.read()
 def close(self):self.f.close();self.sock.close()
client=None
try:
 deadline=time.monotonic()+15
 while time.monotonic()<deadline:
  if server.poll()is not None:raise RuntimeError('private Redis startup failed; see runtime log')
  if sock.exists():
   try:client=Resp();break
   except (OSError,EOFError):pass
  time.sleep(.05)
 assert client,'private Redis timeout'
 info=dict(line.split(':',1)for line in client.command('INFO','server').splitlines()if line and not line.startswith('#'))
 settings={key:client.command('CONFIG','GET',key)[1]for key in ['bind','port','dir','save','appendonly']}
 assert int(info['process_id'])==server.pid and int(info['tcp_port'])==port and info['redis_version']=='8.10.2'
 assert settings=={'bind':'127.0.0.1','port':str(port),'dir':str(run),'save':'','appendonly':'no'}
 assert not pid.exists()or int(pid.read_text())==server.pid
 (run/'guard.json').write_text(json.dumps(dict(pid=server.pid,port=port,socket=str(sock),settings=settings,password='fresh perrun; not recorded',socketDirectoryMode=oct(short.stat().st_mode&0o777)),indent=2)+'\n')
 env=os.environ.copy();env.update(JAVA_HOME='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home',B01_REDIS_PORT=str(port),B01_REDIS_PASSWORD=password,B01_REDIS_PID=str(server.pid),B01_REDIS_RAW_OUTPUT=str(run/'raw-java.json'),B01_REDIS_JAVA_OUTPUT=str(run/'java.json'),B01_JAVA_OUTPUT=str(run/'crypto-java.json'))
 r=subprocess.run([str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','runProof','runRedisProof','recordDependencies'],cwd=ROOT,env=env,capture_output=True,text=True)
 raw=r.stdout+r.stderr;assert password not in raw,'unexpected secret in diagnostic output';(OUT/'redis-java-run.log').write_text(raw)
 assert r.returncode==0,'Java Redis probe failed; inspect source-proof/redis-java-run.log'
 crypto=json.loads((run/'crypto-java.json').read_text());redis=json.loads((run/'java.json').read_text());result={'crypto':crypto,'redis':redis}
 assert client.command('DBSIZE')==0,'unexpected private probe key left'
 (OUT/'java-execution.json').write_bytes((run/'crypto-java.json').read_bytes());(OUT/'redis-execution.json').write_text(json.dumps(redis,ensure_ascii=False,indent=2)+'\n');(OUT/'redis-raw-last.json').write_bytes((run/'raw-java.json').read_bytes())
 frozen=OUT/'checkpoints/expected-java-redis.json'
 if a.freeze:frozen.parent.mkdir(exist_ok=True);frozen.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 else:assert json.loads(frozen.read_text())==result,'frozen mismatch; investigate first'
 print(json.dumps(dict(cryptoChecks=len(crypto['checks']),redisChecks=len(redis['checks']),privateRuntime=str(run),frozenMatch=not a.freeze),indent=2))
finally:
 if client:
  try:client.command('SHUTDOWN','NOSAVE')
  except EOFError:pass
  finally:client.close()
 try:server.wait(timeout=10)
 except subprocess.TimeoutExpired:server.terminate();server.wait(timeout=5)
 with socket.socket()as probe:probe.settimeout(2);closed=probe.connect_ex(('127.0.0.1',port))!=0
 (OUT/'redis-runtime-last.json').write_text(json.dumps(dict(run=str(run),pid=server.pid,serverExit=server.returncode,serverStopped=server.poll()is not None,tcpClosed=closed),indent=2)+'\n')
 assert server.returncode==0 and closed,'own Redis shutdown not clean'
