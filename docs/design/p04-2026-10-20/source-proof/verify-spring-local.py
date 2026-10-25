"""로컬에 이미 있는 의존성으로 원문 클래스를 독립 컨텍스트에서 실행한다. HTTP/Boot는 시작하지 않는다."""
from pathlib import Path
import json,re,subprocess,tempfile,hashlib,xml.etree.ElementTree as ET
from urllib.request import urlopen
ROOT=Path(__file__).resolve().parents[4]
OUT=Path(__file__).resolve().parent
CACHE=Path('/Users/ds/.gradle/caches/modules-2/files-2.1')
JDK=Path('/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home/bin')
namespace={'m':'http://maven.apache.org/POM/4.0.0'}
resolved={}
DOWNLOADS=OUT/'dependencies'
DOWNLOADS.mkdir(exist_ok=True)
(DOWNLOADS/'.gitignore').write_text('*\n!.gitignore\n')
def dependency(group,name,version):
    key=(group,name,version)
    if key in resolved:return
    folder=CACHE/group/name/version
    jars=list(folder.glob(f'*/{name}-{version}.jar'))
    poms=list(folder.glob(f'*/{name}-{version}.pom'))
    if len(jars)!=1 or len(poms)!=1:
        local=DOWNLOADS/group/name/version
        local.mkdir(parents=True,exist_ok=True)
        files=[]
        for suffix in ['jar','pom']:
            target=local/f'{name}-{version}.{suffix}'
            if not target.exists():
                url=f'https://repo.maven.apache.org/maven2/{group.replace(".","/")}/{name}/{version}/{name}-{version}.{suffix}'
                with urlopen(url,timeout=30) as response: target.write_bytes(response.read())
            files.append(target)
        jars,poms=[files[0]],[files[1]]
    resolved[key]=jars[0]
    doc=ET.parse(poms[0]).getroot()
    for d in doc.findall('m:dependencies/m:dependency',namespace):
        get=lambda k: d.findtext('m:'+k,default='',namespaces=namespace)
        if get('scope') not in ('','compile','runtime') or get('optional')=='true':continue
        dependency(get('groupId'),get('artifactId'),get('version'))
for artifact in ['spring-context','spring-web']:dependency('org.springframework',artifact,'7.0.9')
dependency('org.projectlombok','lombok','1.18.46')
text=(ROOT/'docs/knowledge/P04-constructors-builder.md').read_text()
blocks=re.findall(r'```java\n(.*?)\n```',text,re.S)
for name in ['OrderIdGenerator','OrderService','OrderController','OrderRequest']:
    matches=[b for b in blocks if re.search(r'\b(?:class|record) '+name+r'\b',b)]
    assert len(matches)==1,name
    (OUT/'spring'/f'{name}.java').write_text(matches[0]+'\n')
classpath=':'.join(map(str,resolved.values()))
with tempfile.TemporaryDirectory(prefix='p04-spring-') as tmp:
    c=subprocess.run([str(JDK/'javac'),'-cp',classpath,'-processorpath',str(resolved[('org.projectlombok','lombok','1.18.46')]),'-d',tmp,*map(str,(OUT/'spring').glob('*.java'))],capture_output=True,text=True)
    (OUT/'Spring.compile.txt').write_text(c.stdout+c.stderr)
    assert c.returncode==0,c.stderr
    run=subprocess.run([str(JDK/'java'),'-cp',tmp+':'+classpath,'com.example.orders.P04SpringProof'],capture_output=True,text=True)
    (OUT/'P04SpringProof.stdout.txt').write_text(run.stdout)
    (OUT/'Spring.stderr.txt').write_text(run.stderr)
    assert run.returncode==0,run.stderr
    report={'dependencySource':'Existing local Gradle cache; missing declared coordinates from official Maven Central', 'scope':'original four P04 source files compiled, three Bean types explicitly registered in standalone Spring7.0.9 AnnotationConfigApplicationContext; Java21; Lombok1.18.46; direct Java method calls; NO Boot/HTTP/JPA/Java25','checks':9,'exitCode':run.returncode,'jars':[{'group':g,'artifact':a,'version':v,'file':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for (g,a,v),p in resolved.items()]}
    (OUT/'Spring.verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(run.stdout)
