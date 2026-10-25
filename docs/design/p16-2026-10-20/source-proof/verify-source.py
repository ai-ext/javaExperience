"""P16 추가 독립 실행. 원문/학습자 서버를 수정하거나 Boot를 시작하지 않는다."""
from pathlib import Path
import re,json,subprocess,tempfile,hashlib
from urllib.request import urlopen
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
CACHE=Path('/Users/ds/.gradle/caches/modules-2/files-2.1')
JDK=Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home/bin')
coords=[('tools.jackson.core','jackson-core','3.1.5'),('tools.jackson.core','jackson-databind','3.1.5'),('com.fasterxml.jackson.core','jackson-annotations','2.21')]
jars={f'{g}:{a}:{v}':next((CACHE/g/a/v).glob('*/*.jar')) for g,a,v in coords}
for entry in json.loads((ROOT/'docs/design/p04-2026-10-20/source-proof/Spring.verification.json').read_text())['jars']:
    if entry['artifact']!='lombok':jars[f"{entry['group']}:{entry['artifact']}:{entry['version']}"]=Path(entry['file'])
for name in ['spring-webmvc','spring-test']:
    jars[f'org.springframework:{name}:7.0.9']=next((CACHE/'org.springframework'/name/'7.0.9').glob('*/*.jar'))
# Servlet API is a compile dependency of spring-test's servlet support. Version fixed explicitly.
dep=OUT/'dependencies';dep.mkdir(exist_ok=True);(dep/'.gitignore').write_text('*\n!.gitignore\n')
target=dep/'jakarta.servlet-api-6.1.0.jar'
url='https://repo.maven.apache.org/maven2/jakarta/servlet/jakarta.servlet-api/6.1.0/jakarta.servlet-api-6.1.0.jar'
if not target.exists():
    with urlopen(url,timeout=30) as response:target.write_bytes(response.read())
jars['jakarta.servlet:jakarta.servlet-api:6.1.0']=target
source=ROOT/'docs/knowledge/P16-json-jackson-practical.md';text=source.read_text()
blocks=re.findall(r'```java\n(.*?)\n```',text,re.S)
(OUT/'MapperExample.java').write_text(next(b for b in blocks if 'public class MapperExample' in b)+'\n')
classpath=':'.join(map(str,jars.values()))
with tempfile.TemporaryDirectory(prefix='p16-proof-') as tmp:
    compile=subprocess.run([str(JDK/'javac'),'-cp',classpath,'-d',tmp,*map(str,OUT.glob('*.java'))],capture_output=True,text=True)
    (OUT/'All.compile.txt').write_text(compile.stdout+compile.stderr)
    assert compile.returncode==0,compile.stderr
    counts={}
    for classname in ['example.demo.MapperExample','example.proof.P16MapperProof','example.proof.P16MvcProof']:
        run=subprocess.run([str(JDK/'java'),'-cp',tmp+':'+classpath,classname],capture_output=True,text=True)
        name=classname.split('.')[-1];(OUT/f'{name}.stdout.txt').write_text(run.stdout);(OUT/f'{name}.stderr.txt').write_text(run.stderr)
        assert run.returncode==0,run.stderr
        counts[name]=run.stdout.count('PASS ');print(run.stdout)
    assert counts=={'MapperExample':0,'P16MapperProof':24,'P16MvcProof':11},counts
    assert (OUT/'MapperExample.stdout.txt').read_text()=='{"name":"Kim","age":29}\nKim:29\n'
    report={'sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'originalExamples':1,'checks':counts,'jdk':'21.0.6','jackson':'3.1.5','spring':'7.0.9','servletApi':'6.1.0','scope':'isolated JsonMapper and MockMvc; instrumented additional controller has same source DTO/return expression; no socket/Boot/Java25/JPA; HTTP statuses are MockMvc results','download':url,'jars':[{'coordinate':k,'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for k,p in jars.items()]}
    (OUT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
