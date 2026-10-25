"""원문3블록과 추가 Spring JDBC/H2 관측을 재실행해 frozen 사실과 대조한다."""
from pathlib import Path
import hashlib,json,re,subprocess,os

ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
meta=json.loads((OUT/'source.json').read_text())
source=ROOT/meta['source']
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'```java\n(.*?)\n```',source.read_text(),re.S)
assert len(blocks)==3
for block,entry in zip(blocks,meta['originalJava'],strict=True):
    raw=(block+'\n').encode()
    assert (OUT/'original'/entry['file']).read_bytes()==raw
    assert hashlib.sha256(raw).hexdigest()==entry['sha256']
expected=json.loads((OUT/'checkpoints/expected-current-execution.json').read_text())
env=os.environ.copy()
env['JAVA_HOME']='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home'
command=[str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','recordDependencies','runProof']
result=subprocess.run(command,cwd=ROOT,env=env,capture_output=True,text=True)
(OUT/'gradle-run.txt').write_text(result.stdout+result.stderr)
assert result.returncode==0,result.stdout+result.stderr
actual=json.loads((OUT/'execution.json').read_text())
assert actual==expected,'관측이 달라졌다. fixture·버전·설정을 먼저 확인한다.'
assert actual['checks']==42 and result.stdout.count('PASS ')==42
assert actual['versions']=={'spring':'7.0.9','h2':'2.4.240','java':21}
assert actual['observerConnection']=={'autoCommit':True,'jdbcIsolation':2}
assert actual['originalTransfer']['observerBalances']==[750,350]
assert actual['originalCheckedRollback']['observerBalances']==[1000,100]
assert actual['directOriginal']['observerBalances']==[750,100]
assert actual['requiredRollbackOnly']['ledger']==[]
assert actual['requiresNew']['ledger']==['inner-new']
assert actual['nested']['ledger']==['outer']
assert actual['afterCommitFailure']['ledger']==['order']
assert 'TransactionSynchronization.afterCompletion threw exception' in result.stderr
assert 'gateway-failure' in result.stderr
for dependency in json.loads((OUT/'dependencies.json').read_text()):
    assert hashlib.sha256(Path(dependency['file']).read_bytes()).hexdigest()==dependency['sha256']
meta.update(checks=42,runtimeVersions=actual['versions'],scope=actual['scope'])
(OUT/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':42,'original3BlocksUnchanged':True,'runtimeVersions':actual['versions'],
                  'expectedLoggedListenerFailure':True,'scope':actual['scope']},ensure_ascii=False,indent=2))
