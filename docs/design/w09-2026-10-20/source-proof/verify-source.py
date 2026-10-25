"""원문 추출본을 대조하고 별도 Gradle 프로젝트/H2 메모리 DB만 실행한다."""
from pathlib import Path
import os,re,json,hashlib,subprocess,shutil
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
source=ROOT/'docs/knowledge/W09-why-dto.md'
metadata=json.loads((OUT/'source.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==metadata['sha256']
blocks=re.findall(r'~~~java\n(.*?)\n~~~',source.read_text(),re.S)
for name,signature in [('OrderEntity','public class OrderEntity '),('OrderItemEntity','public class OrderItemEntity '),('CustomerEntity','public class CustomerEntity '),('OrderSummary','public record OrderSummary'),('OrderSummaryMapStruct','public interface OrderSummaryMapStruct')]:
    original=next(b for b in blocks if signature in b)+'\n'
    assert (OUT/'original'/f'{name}.java').read_text()==original,name
command=[str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','recordDependencies','runProof']
environment=os.environ.copy();environment['JAVA_HOME']='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home'
run=subprocess.run(command,cwd=ROOT,env=environment,capture_output=True,text=True)
(OUT/'gradle-run.txt').write_text(run.stdout+run.stderr)
assert run.returncode==0,run.stdout+run.stderr
assert run.stdout.count('PASS ')==28
result=json.loads((OUT/'execution.json').read_text());assert result['checks']==28
expected={'closedFind':1,'closedFailure':0,'openGetter':1,'entitySerialization':2,'listRoot':1,'manualMapping':3,'mapstructRoot':1,'mapstructMapping':3,'originalSingleProjection':1,'projection':1}
for phase,count in expected.items():assert len(result[phase+'Sql'])==count,(phase,result)
assert result['projectionJson']==result['summaryJson']
assert result['closedCause']=='org.hibernate.LazyInitializationException'
assert result['serializationCauseChain'].startswith('tools.jackson.core.exc.StreamConstraintsException')
for entry in json.loads((OUT/'dependencies.json').read_text()):assert hashlib.sha256(Path(entry['file']).read_bytes()).hexdigest()==entry['sha256']
generated=OUT/'runtime/build/generated/sources/annotationProcessor/java/main/example/order/OrderSummaryMapStructImpl.java'
(OUT/'generated').mkdir(exist_ok=True);shutil.copy2(generated,OUT/'generated'/generated.name)
metadata.update(checks=28,generatedMapperSHA256=hashlib.sha256(generated.read_bytes()).hexdigest(),verification='verify-source.py executed isolated fixture; source unchanged')
(OUT/'source.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':28,'sqlPhases':expected,'scope':result['scope']},ensure_ascii=False,indent=2))
