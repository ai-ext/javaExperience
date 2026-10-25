import datetime,hashlib,json,os,pathlib,secrets,subprocess,tempfile,shutil
BASE=pathlib.Path(__file__).resolve().parent.parent
OUT=BASE/'proof-sol-logs'
NONCE=secrets.token_hex(8)
LABEL='javaexperience.d12.sol-review.nonce'
ENV={k:v for k,v in os.environ.items() if not k.startswith('DOCKER_') and k not in ('BASH_ENV','ENV')}
commands=[]
def cmd(argv,timeout=30):
 p=subprocess.run(argv,env=ENV,capture_output=True,text=True,timeout=timeout)
 r={'argv':argv,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr};commands.append(r);return r
def dock(*args,timeout=30):return cmd(['docker','--host',ENDPOINT,*args],timeout)
ctx=json.loads(cmd(['docker','context','inspect'])['stdout'])[0]
ENDPOINT=ctx['Endpoints']['docker']['Host']
assert ctx['Name']=='desktop-linux' and ENDPOINT=='unix://LOCAL_HOME/.docker/run/docker.sock'
old=json.loads((BASE/'proof-logs/attempt-0665b1344c5b.json').read_text())
IMAGE=old['ownedImage']['Id']
im=json.loads(dock('image','inspect',IMAGE,'--format','{{json .}}')['stdout'])
assert im['Id']==IMAGE and im['Os']=='linux'
source=(BASE/'source-proof/proof.py').read_text()
assert hashlib.sha256(source.encode()).hexdigest()=='68db36173308d620a1baa12cd2d097c62fca11c3ed59084fda183c302b8c21a9'
root=pathlib.Path(tempfile.mkdtemp(prefix='d12-sol-proof-',dir=str(OUT))).resolve()
report={'nonce':NONCE,'startedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'endpoint':ENDPOINT,'imageId':IMAGE,'sourceSha256':old['sourceSha256'],'runs':[]}

def launch(case,script=None,idle=False):
 name=f'd12-sol-review-{NONCE}-{case}'
 folder=root/case;folder.mkdir();(folder/'proof.py').write_text(source if script is None else script)
 cid=None
 run={'case':case,'scriptSha256':hashlib.sha256((folder/'proof.py').read_bytes()).hexdigest()}
 report['runs'].append(run)
 try:
  argv=['create','--name',name,'--label',f'{LABEL}={NONCE}','--network','none','--read-only','--cpus=1','--memory=256m','--pids-limit=128','--tmpfs','/tmp:rw,exec,nosuid,nodev,size=128m','--mount',f'type=bind,src={folder},dst=/proof,readonly','--env','D12_LAB_MARKER=D12_LINUX_PROOF_20261025']
  if idle:argv+=['--entrypoint','/bin/sh',IMAGE,'-c',"printf 'SOL synthetic bootline\\n'; exec sleep 300"]
  else:argv+=[IMAGE]
  created=dock(*argv);assert created['exit']==0;cid=created['stdout'].strip()
  ci=json.loads(dock('inspect',cid,'--format','{{json .}}')['stdout']); hc=ci['HostConfig']
  assert ci['Id']==cid and ci['Name']=='/'+name and ci['Config']['Labels'][LABEL]==NONCE
  assert hc['NetworkMode']=='none' and hc['ReadonlyRootfs'] and not hc['Privileged']
  assert hc['NanoCpus']==1000000000 and hc['Memory']==268435456 and hc['PidsLimit']==128
  assert hc['PidMode']=='' and hc['IpcMode']!='host' and not hc['CapAdd'] and not hc['Devices'] and not hc['PortBindings']
  assert hc['Tmpfs']=={'/tmp':'rw,exec,nosuid,nodev,size=128m'}
  assert len(ci['Mounts'])==1 and ci['Mounts'][0]['Source']==str(folder) and ci['Mounts'][0]['Destination']=='/proof' and not ci['Mounts'][0]['RW']
  run['containerBeforeStart']=ci
  started=dock('start',*(() if idle else ('--attach',)),cid,timeout=90);run['execution']=started
  if idle:
   for key,args in [('logs',('logs',cid)),('pid1Before',('exec',cid,'cat','/proc/1/comm')),('execProcess',('exec',cid,'sh','-c',"printf 'exec_pid=%s\\n' $$")),('pid1After',('exec',cid,'cat','/proc/1/comm'))]:run[key]=dock(*args)
   assert run['pid1Before']['stdout']==run['pid1After']['stdout']=='sleep\n'
  elif started['exit']==0:
   run['linuxActual']=json.loads(started['stdout'])
  run['containerAfterRun']=json.loads(dock('inspect',cid,'--format','{{json .}}')['stdout'])
 finally:
  if cid:
   inspected=dock('inspect',cid,'--format','{{json .}}')
   obj=json.loads(inspected['stdout']) if inspected['exit']==0 else None
   if obj and obj['Id']==cid and obj['Name']=='/'+name and obj['Config']['Labels'].get(LABEL)==NONCE:
    run['cleanup']=dock('rm','--force',cid)
    assert run['cleanup']['exit']==0
    run['absentAfterCleanup']=dock('inspect',cid,'--format','{{.Id}}')['exit']!=0
   else:run['cleanupWithheld']=True
 return run

INDEPENDENT=r'''import json,subprocess,pathlib,os
out={}
def run(args):
 p=subprocess.run(args,text=True,capture_output=True);return {'argv':args,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
for mode in ('default','pipefail'):
 script=('set -o pipefail; ' if mode=='pipefail' else 'set +o pipefail; ')+"(printf 'out\\n'; printf 'err\\n' >&2; exit 7) | cat; captured=(\"$?\" \"${PIPESTATUS[@]}\"); printf 'aggregate=%s producer=%s consumer=%s\\n' \"${captured[@]}\"; exit \"${captured[0]}\""
 out[mode]=run(['bash','--noprofile','--norc','-c',script])
assert out['default']['exit']==0 and 'aggregate=0 producer=7 consumer=0' in out['default']['stdout']
assert out['pipefail']['exit']==7 and 'aggregate=7 producer=7 consumer=0' in out['pipefail']['stdout']
d=pathlib.Path('/tmp/sol-disk');d.mkdir();p=d/'bytes';out['df_before_write']=run(['df','-B1',str(d)]);a=os.statvfs(d)
with p.open('wb') as f:f.write(b'x'*(8*1024*1024));f.flush();os.fsync(f.fileno())
fd=os.open(p,os.O_RDONLY);b=os.statvfs(d);out['df_after_write']=run(['df','-B1',str(d)]);p.unlink();c=os.statvfs(d);out['df_after_unlink']=run(['df','-B1',str(d)]);os.close(fd);e=os.statvfs(d);out['df_after_close']=run(['df','-B1',str(d)])
out['bfree']=[v.f_bfree for v in (a,b,c,e)];assert a.f_bfree-b.f_bfree==2048 and c.f_bfree==b.f_bfree and e.f_bfree==a.f_bfree
out['links']=run(['ip','-brief','link']);out['routes']=run(['ip','route']);assert 'eth0' not in out['links']['stdout'] and out['routes']['stdout']==''
print(json.dumps(out,indent=2))
'''
try:
 launch('baseline')
 assert source.count('pipefail_script = \"set -o pipefail; ')==1
 mutant=source.replace('pipefail_script = \"set -o pipefail; ','pipefail_script = \"set +o pipefail; ',1)
 launch('pipefail-disabled-mutant',mutant)
 launch('independent',INDEPENDENT)
 launch('pid1',idle=True)
finally:
 report['commands']=commands;report['finishedAtUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 path=OUT/f'independent-attempt2-{NONCE}.json';path.write_text(json.dumps(report,indent=2)+'\n');shutil.rmtree(root)
 print(path)
print(json.dumps([{'case':r['case'],'exit':r['execution']['exit'],'cleanup':r.get('cleanup',{}).get('exit'),'absent':r.get('absentAfterCleanup')} for r in report['runs']]))
