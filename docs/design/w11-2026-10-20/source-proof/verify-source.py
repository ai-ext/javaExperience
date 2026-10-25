"""원문5블록을 별도 B/C JVM에서 재현하고 실제 SQL/바인딩/관측 순서를 대조한다."""
from pathlib import Path
import hashlib,json,re,os,subprocess

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
meta=json.loads((OUT/'source.json').read_text())
source=ROOT/meta['source']
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'```java\n(.*?)\n```',source.read_text(),re.S)
assert len(blocks)==5
for block,entry in zip(blocks,meta['originalJava'],strict=True):
    raw=(block+'\n').encode()
    assert (OUT/'original'/entry['file']).read_bytes()==raw
    assert hashlib.sha256(raw).hexdigest()==entry['sha256']
expected=json.loads((OUT/'checkpoints/expected-current-execution.json').read_text())
env=os.environ.copy();env['JAVA_HOME']='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home'
command=[str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','recordDependencies','runProof']
result=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True)
(OUT/'gradle-run.txt').write_text(result.stdout+result.stderr)
assert result.returncode==0,result.stdout+result.stderr
actual=json.loads((OUT/'execution.json').read_text())
assert actual==expected,'원문·버전·SQL·바인딩·관측순서가 달라졌다. 실제 원인을 먼저 확인한다.'
b=actual['variantB'];c=actual['variantC']
assert b['checks']==22 and c['checks']==9 and result.stdout.count('PASS ')==31
for variant in [b,c]:
    assert variant['versions']=={'spring':'7.0.9','h2':'2.4.240','java':21}
    assert variant['observerConnection']=={'autoCommit':True,'jdbcIsolation':2}
failure=b['repositoryFailure'];sql=failure['sourceSql']
assert sql[0]['parameters']=={'1':7,'2':6} and sql[0]['affectedRows']==1
assert sql[1]['parameters']=={'1':6,'2':7,'3':6} and sql[1]['affectedRows']==0
assert sql[0]['connection']==1 and sql[1]['connection']==2
first_commit=next(e['sequence'] for e in failure['timeline'] if e.get('action')=='commit')
assert sql[0]['sequence']<first_commit<sql[1]['sequence']
assert sql[0]['independentObserverAfterStatement']=={'orders':[],'stock':5}
assert failure['finalObserver']=={'orders':[{'productId':7,'quantity':6}],'stock':5}
for run in [b['controllerFailure'],b['templateFailure'],c['serviceFailure']]:
    assert run['finalObserver']=={'orders':[],'stock':5}
    assert [e['connection']for e in run['sourceSql']]==[1,1]
success=c['serviceSuccess'];sql=success['sourceSql']
assert sql[1]['writerAfterStatement']=={'orders':[{'productId':7,'quantity':2}],'stock':3}
assert sql[1]['independentObserverAfterStatement']=={'orders':[],'stock':5}
commit=next(e['sequence']for e in success['timeline']if e.get('action')=='commit')
listener=success['listenerObservations'][0]
assert sql[1]['sequence']<commit<listener['sequence']
assert listener['independentObserver']==success['finalObserver']
reject=b['templateRejected']
assert reject['trackedConnectionsOpened']==0 and reject['sourceSql']==[]
assert reject['riskObservations'][0]['springFlags']=={'active':False,'synchronization':False,'connection':None}
for d in json.loads((OUT/'dependencies.json').read_text()):
    assert hashlib.sha256(Path(d['file']).read_bytes()).hexdigest()==d['sha256']
meta.update(checks=31,variantChecks={'B':22,'C':9},runtimeVersions=b['versions'],scope={'B':b['scope'],'C':c['scope']})
(OUT/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':31,'variantChecks':{'B':22,'C':9},'original5BlocksUnchanged':True,
                  'runtimeVersions':b['versions'],'separateBAndCJvm':True,'sqlBindingsAndObservationOrderMatch':True},ensure_ascii=False,indent=2))
