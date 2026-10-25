"""원문실패/추가한식교정/격리27검사와SQL·JDBC관찰의한계를재검증한다."""
from pathlib import Path
import hashlib,json,re,subprocess,os
ROOT=Path(__file__).resolve().parents[4];OUT=Path(__file__).resolve().parent
source=ROOT/'docs/knowledge/P20-jpa-entity-mapping.md';meta=json.loads((OUT/'source.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'```java\n(.*?)\n```',source.read_text(),re.S)
names=['ShopApplication','BaseEntity','Order','OrderLine','OrderResponse','OrderController']
for name in names:
 b=next(b for b in blocks if re.search(r'public (?:abstract )?(?:class|record) '+name+r'\b',b))+'\n'
 assert (OUT/'original'/f'{name}.java').read_text()==b,name
assert(OUT/'corrected/OrderResponse.java').read_text()==(OUT/'original/OrderResponse.java').read_text().replace('l.getStatus().name()','String.valueOf(l.getStatus())')
deps=json.loads((OUT/'dependencies.json').read_text());jdk='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home'
compile_out=OUT/'compile-output';compile_out.mkdir(exist_ok=True)
r=subprocess.run([jdk+'/bin/javac','-cp',os.pathsep.join(d['file']for d in deps),'-d',str(compile_out),*[str(OUT/'original'/f'{n}.java')for n in names]],capture_output=True,text=True)
(OUT/'original-compile.txt').write_text(r.stdout+r.stderr)
assert r.returncode!=0 and 'Enum.name() is defined in an inaccessible class or interface'in r.stderr
cmd=[str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','recordDependencies','runProof'];env=os.environ.copy();env['JAVA_HOME']=jdk
r=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True);(OUT/'gradle-run.txt').write_text(r.stdout+r.stderr)
assert r.returncode==0,r.stdout+r.stderr
assert r.stdout.count('PASS ')==27
x=json.loads((OUT/'execution.json').read_text());assert x['checks']==27 and x['observerIsolation']==2
assert x['pureStdout']==['after add: count=1, attached=true','after remove: count=0, attached=false']
assert x['newObject']['orderId']=='null' and x['newObject']['lineId']=='null'
assert x['afterPersistTxRow']['id']==x['afterPersistTxRow']['order_id']==x['afterPersistTxRow']['line_id']==1
assert x['afterPersistTxRow']['status']=='PENDING' and x['afterPersistTxRow']['created_by']=='local-user'
assert x['beforeCommitObserver']=={'orders':0,'order_lines':0}
assert x['committedRow']==x['afterPersistTxRow']
assert x['rollbackBranch']=={'orderId':2,'txOrders':1,'outsideOrdersBefore':0}
assert x['orphanAfterFlush']=={'insideLines':0,'outsideLines':1}
sql=x['sqlPhases'];assert len(sql['persistSql'])==2 and sql['explicitFlushSql']==[] and sql['commitSql']==[]
assert sql['orphanFlushSql']==['delete from order_lines where id=?'] and sql['orphanCommitSql']==[]
assert len(sql['inverseOnlySql'])==1 and sql['inverseOnlySql'][0].startswith('insert into orders ')
for d in json.loads((OUT/'dependencies.json').read_text()):assert hashlib.sha256(Path(d['file']).read_bytes()).hexdigest()==d['sha256']
meta.update(checks=27,originalCompile='failed: inaccessible LineStatus Enum.name',correction='separate OrderResponse expression only',scope=x['scope']);(OUT/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':27,'originalCompileFails':True,'correctedFixtureRuns':True,'scope':x['scope']},ensure_ascii=False,indent=2))
