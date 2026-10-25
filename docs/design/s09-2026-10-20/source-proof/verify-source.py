"""원문4파일과격리61관찰검사를재실행한다. pagination의예상과관측을구분한다."""
from pathlib import Path
import hashlib,json,re,subprocess,os
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
source=ROOT/'docs/knowledge/S09-jpa-hibernate.md';meta=json.loads((OUT/'source.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'```java\n(.*?)\n```',source.read_text(),re.S)
for name in ['PurchaseOrder','OrderLine','OrderService','OrderReadService']:
 b=next(b for b in blocks if re.search(r'public class '+name+r'\b',b))+'\n';assert (OUT/'original'/f'{name}.java').read_text()==b,name
expected=json.loads((OUT/'checkpoints/expected-current-execution.json').read_text())
env=os.environ.copy();env['JAVA_HOME']='/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home'
cmd=[str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','recordDependencies','runProof'];r=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True);(OUT/'gradle-run.txt').write_text(r.stdout+r.stderr)
assert r.returncode==0,r.stdout+r.stderr
x=json.loads((OUT/'execution.json').read_text());assert x['checks']==61 and r.stdout.count('PASS ')==61
assert x==expected,'frozen facts/SQL/pagination observations changed; inspect actual new result, do not assume latest docs apply'
assert x['runtimeVersions']['hibernate']=='7.4.5.Final'
assert x['firstFind']['hibernateLoadedState']=={'title':'첫 글','version':0}
assert x['changedAfterFlush']['hibernateLoadedState']=={'title':'수정된 글','version':1}
assert x['rollbackFinalRow']['title']=='첫 글' and x['rollbackFinalRow']['version']==0
assert x['originalFetchJoin']=={'ormParents':3,'children':6,'separateRawSqlRows':6}
assert x['originalService']['versionAfterFlush']==0
p={r['variant']:r for r in x['paginationCases']}
assert p['fetch-api-max1']['configuredMaxResults']==1 and p['fetch-api-max1']['parentIds']==[1,2,3]
assert p['fetch-memory-hint-max1']['parentIds']==[1] and p['fetch-memory-hint-max1']['rawObserverRows']==6
assert p['fetch-hql-limit1']['parentIds']==[1] and p['fetch-hql-limit1']['rawObserverRows']==2
assert p['plain-root-api-max1']['parentIds']==[1]
for d in json.loads((OUT/'dependencies.json').read_text()):assert hashlib.sha256(Path(d['file']).read_bytes()).hexdigest()==d['sha256']
meta.update(checks=61,scope=x['scope'],runtimeVersions=x['runtimeVersions'],additionalEntity='ProbePost.java is not in original source',pagination='API max1 observation differs from latest7.4.13guide. Cause/upstream fix unconfirmed; controls/HQL/hint preserved. Assertions certify observations, not pagination correctness.');(OUT/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':61,'original4FilesUnchanged':True,'runtimeVersions':x['runtimeVersions'],'paginationVariantObservedParents':{k:v['parentIds']for k,v in p.items()},'scope':x['scope']},ensure_ascii=False,indent=2))
