"""원문 Java4파일 보존과 별도 Boot/H2 non-web·Hikari·타입 컴파일을 재검증한다."""
from pathlib import Path
import os,re,json,hashlib,subprocess
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
source=ROOT/'docs/knowledge/P19-mysql-jpa-setup.md'
meta=json.loads((OUT/'source.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest()==meta['sha256']
blocks=re.findall(r'```java\n(.*?)\n```',source.read_text(),re.S)
for name in ['P19Application','Customer','CustomerRepository','CustomerController']:
    block=next(b for b in blocks if re.search(r'public (?:class|interface) '+name+r'\b',b))+'\n'
    assert (OUT/'original'/f'{name}.java').read_text()==block,name
cmd=[str(ROOT/'gradlew'),'-p',str(OUT/'runtime'),'--no-daemon','--console=plain','recordDependencies','runProof']
env=os.environ.copy();env['JAVA_HOME']='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home'
r=subprocess.run(cmd,cwd=ROOT,env=env,capture_output=True,text=True);(OUT/'gradle-run.txt').write_text(r.stdout+r.stderr)
assert r.returncode==0,r.stdout+r.stderr
assert r.stdout.count('PASS ')==19
result=json.loads((OUT/'execution.json').read_text());assert result['checks']==19
assert json.loads(result['customerJson'])=={'id':1,'displayName':'Kim'}
assert result['observerRow']=={'id':1,'display_name':'Kim'}
assert result['poolIdle']=={'total':1,'idle':1,'active':0,'waiting':0}
assert result['poolBorrowed']=={'total':1,'idle':0,'active':1,'waiting':0}
assert result['poolWaiting']=={'total':1,'idle':0,'active':1,'waiting':1}
assert result['poolReturned']==result['poolIdle']
cases=json.loads((OUT/'dependency-cases.json').read_text())
assert all(cases[k]['resolved'] for k in ['originalMain','originalWeb','originalTest','correctedMysqlTest'])
assert not cases['originalMysqlTest']['resolved']
assert not any(x.startswith('com.h2database:h2:')for x in cases['originalMain']['artifacts'])
assert 'org.testcontainers:testcontainers-mysql:2.0.5'in cases['correctedMysqlTest']['artifacts']
for jar in json.loads((OUT/'dependencies.json').read_text()):assert hashlib.sha256(Path(jar['file']).read_bytes()).hexdigest()==jar['sha256']
meta.update(checks=19,originalJavaFiles=4,scope=result['scope'],verification='verify-source.py executed; original document unchanged; MySQL unavailable')
(OUT/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checks':19,'originalMainH2':False,'dependencyCases':{k:v['resolved']for k,v in cases.items()},'scope':result['scope']},ensure_ascii=False,indent=2))
