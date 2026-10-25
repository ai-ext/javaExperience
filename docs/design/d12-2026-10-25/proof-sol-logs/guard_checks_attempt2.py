import ast,contextlib,hashlib,io,json,os,pathlib,runpy,subprocess,tempfile
from unittest.mock import patch
B=pathlib.Path(__file__).resolve().parent.parent
P=B/'source-proof/proof.py';R=B/'source-proof/run_proof.py';OUT=B/'proof-sol-logs'
result={'schema':'d12-sol-guard-checks-v1','proofSha256':hashlib.sha256(P.read_bytes()).hexdigest(),'runnerSha256':hashlib.sha256(R.read_bytes()).hexdigest(),'tests':[]}
# Proof import and host guard: intercept mutation calls. No fixture function is executed.
for run_name in ('d12_review_import','__main__'):
 with patch('pathlib.Path.mkdir',side_effect=AssertionError('mkdir before guard')) as mk,patch('os.chmod',side_effect=AssertionError('chmod before guard')) as ch:
  refused=False
  try:runpy.run_path(str(P),run_name=run_name)
  except SystemExit as exc:refused='guard refused' in str(exc)
  assert mk.call_count==ch.call_count==0
  assert refused==(run_name=='__main__')
 result['tests'].append({'name':'proof-'+run_name,'mkdirCalls':0,'chmodCalls':0,'guardRefused':refused,'pass':True})
# Runner import under hostile Docker overrides. No external command is run.
overrides={'DOCKER_HOST':'tcp://review.invalid:2375','DOCKER_CONTEXT':'review-remote','DOCKER_TLS_VERIFY':'1','DOCKER_CERT_PATH':'/review/nonexistent','DOCKER_API_VERSION':'0.0'}
with patch.dict(os.environ,overrides),patch('pathlib.Path.mkdir'):
 ns=runpy.run_path(str(R),run_name='d12_review_runner')
assert not any(k in ns['DOCKER_ENV'] for k in overrides)
result['tests'].append({'name':'docker-override-removal','removedKeys':list(overrides),'pass':True})
for endpoint,expected_refused in [('tcp://review.invalid:2375',True),('unix://',True)]:
 calls=[]
 def fake(argv,**kw):
  calls.append({'argv':argv,'envOverrideKeys':[k for k in overrides if k in kw.get('env',{})]})
  assert not calls[-1]['envOverrideKeys']
  if argv==['docker','context','show']:return subprocess.CompletedProcess(argv,0,'desktop-linux\n','')
  if argv[:3]==['docker','context','inspect']:return subprocess.CompletedProcess(argv,0,json.dumps(endpoint)+'\n','')
  raise AssertionError('unverified endpoint command')
 with patch('subprocess.run',side_effect=fake):
  try:ns['main']();raise AssertionError('endpoint accepted')
  except SystemExit as e:assert 'not a local Unix socket' in str(e)
 result['tests'].append({'name':'reject-unverified-endpoint','endpoint':endpoint,'calls':calls,'pass':True})
# Actual call() implementation must prefix all operations with verified --host.
ns['call'].__globals__['DOCKER_SOCKET']='unix:///Users/ds/.docker/run/docker.sock'
def fixed(argv,**kw):
 assert argv==['docker','--host','unix:///Users/ds/.docker/run/docker.sock','image','inspect','review-synthetic']
 assert not any(k in kw['env'] for k in overrides)
 return subprocess.CompletedProcess(argv,0,'synthetic\n','')
with patch('subprocess.run',side_effect=fixed):fixed_result=ns['call'](['docker','image','inspect','review-synthetic'])
result['tests'].append({'name':'fixed-endpoint-call','record':fixed_result,'pass':True})
# Compile only the existing cleanup finally block, and mock every subprocess call.
module=ast.parse(R.read_text());main=next(n for n in module.body if isinstance(n,ast.FunctionDef) and n.name=='main');tr=next(n for n in main.body if isinstance(n,ast.Try));cleanup=compile(ast.fix_missing_locations(ast.Module(body=tr.finalbody,type_ignores=[])),str(R)+':cleanup','exec')
for label_matches,id_matches in ((True,True),(False,True),(True,False)):
 cid='a'*64;nonce='review_mock_nonce';calls=[]
 def cleanup_fake(argv,**kw):
  calls.append(argv)
  assert argv[:3]==['docker','--host','unix:///Users/ds/.docker/run/docker.sock']
  assert not any(k in kw['env'] for k in overrides)
  if argv[3]=='inspect':
   assert argv[-1]==cid
   obj={'Id':cid if id_matches else 'b'*64,'Name':'/another-display-name','Config':{'Labels':{'javaexperience.d12.proof.nonce':nonce if label_matches else 'foreign'}}}
   return subprocess.CompletedProcess(argv,0,json.dumps(obj),'')
  if argv[3:5]==['rm','--force']:
   assert label_matches and id_matches and argv[-1]==cid
   return subprocess.CompletedProcess(argv,0,cid+'\n','')
  raise AssertionError('unexpected cleanup operation')
 folder=pathlib.Path(tempfile.mkdtemp(prefix='cleanup-mock-',dir=OUT))
 scope=dict(ns['call'].__globals__);scope.update({'container_id':cid,'idle_id':None,'nonce':nonce,'records':[],'base':{},'LOGS':folder})
 with patch('subprocess.run',side_effect=cleanup_fake),contextlib.redirect_stdout(io.StringIO()):exec(cleanup,scope)
 rm=[x for x in calls if x[3:5]==['rm','--force']]
 assert bool(rm)==(label_matches and id_matches)
 saved=json.loads((folder/f'attempt-{nonce}.json').read_text());(folder/f'attempt-{nonce}.json').unlink();folder.rmdir()
 result['tests'].append({'name':'cleanup-exact-id-and-nonce','labelMatches':label_matches,'idMatches':id_matches,'subprocessCalls':calls,'records':saved['commands'],'pass':True})
(OUT/'guard-checks-attempt2.json').write_text(json.dumps(result,indent=2)+'\n')
print('guard checks passed:',len(result['tests']))
