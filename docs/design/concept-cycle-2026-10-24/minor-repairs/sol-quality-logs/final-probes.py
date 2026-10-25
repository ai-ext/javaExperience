import concurrent.futures, datetime, json, pathlib, subprocess
root=pathlib.Path('/Users/ds/code/javaExperience/.worktrees/concept-learning-night');logs=root/'docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs';url=lambda p:(root/p).as_uri()
initial={'status':'initial_quality_findings','counts':{'critical':0,'important':1,'minor':0},'finding':{'id':'B01-display-source-disconnected','file':'tools/site/test-b01-learning.mjs:19-28','description':'표시 code의 wrong matches !를 제거해도 원문 sourceFragments가 정상인 상태에서 test-b01-learning은 exit0이었다. 표시 code와 sourceFragments 동등성 검사가 없었다.','evidence':'sol-quality-logs/b01-negation-mutation.log','productChangedByReviewer':False}}
(logs/'initial-quality-finding.json').write_text(json.dumps(initial,ensure_ascii=False,indent=2)+'\n')
cases=[]
for name,id,old,new in [('b01-negation-mutation-final','password-encoder','&& !encoder.matches','&& encoder.matches'),('b01-version-mutation-final','password-version','issuedVersion != currentVersion','issuedVersion == currentVersion'),('b01-wrong-predicate-missing-final','password-encoder','&& !encoder.matches("public-demo-wrong-password", encoded)','&& true')]:
 code=f'import {{B01_LESSONS}} from {json.dumps(url("tools/site/b01-lesson-data.mjs"))};const state=B01_LESSONS.find(x=>x.id==="password").stages.find(x=>x.id==={json.dumps(id)});state.code=state.code.replace({json.dumps(old)},{json.dumps(new)});await import({json.dumps(url("tools/site/test-b01-learning.mjs"))});'
 cases.append((name,code,1))
for name,test in [('b01-baseline-final','test-b01-learning.mjs'),('d04-baseline-final','test-d04-learning.mjs'),('d04-generated-final','test-d04-generated.mjs'),('v04-generated-final','test-v04-generated.mjs')]: cases.append((name,f'await import({json.dumps(url("tools/site/"+test))});',0))
def run(case):
 name,code,expected=case;result=subprocess.run(['node','--input-type=module','-e',code],cwd=root,text=True,capture_output=True);(logs/(name+'.log')).write_text(result.stdout+result.stderr)
 return {'name':name,'exitCode':result.returncode,'expectedExit':expected,'expectedAssertionDetected':expected==0 or '표시된 연산자·피연산자가 원문 조각과 같다' in result.stderr,'code':code}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: result=list(pool.map(run,cases))
(logs/'final-probes.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps([{k:v for k,v in row.items() if k!='code'} for row in result],ensure_ascii=False,indent=2))
