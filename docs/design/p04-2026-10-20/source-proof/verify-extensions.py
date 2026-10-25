"""추가 생성자·Lombok·독립 Spring 컨텍스트 검사를 재현한다."""
from pathlib import Path
import subprocess,tempfile,json,sys,hashlib
OUT=Path(__file__).resolve().parent
JDK=Path('LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home/bin')
subprocess.run([sys.executable,str(OUT/'verify-spring-local.py')],check=True)
spring=json.loads((OUT/'Spring.verification.json').read_text())
jar=Path(next(x['file'] for x in spring['jars'] if x['artifact']=='lombok'))
lombok=json.loads((OUT/'Lombok.verification.json').read_text())
assert hashlib.sha256(jar.read_bytes()).hexdigest()==lombok['jarSha256']
constructors=json.loads((OUT/'Constructor.verification.json').read_text())
with tempfile.TemporaryDirectory(prefix='p04-extensions-') as tmp:
    for case in constructors['negativeCases']:
        file=Path(tmp)/(case['name']+'.java');file.write_text(case['code'])
        command=[str(JDK/'javac'),'-XDrawDiagnostics','-cp',str(jar),'-processorpath',str(jar),'-d',tmp,str(file)]
        result=subprocess.run(command,capture_output=True,text=True)
        expected=case['diagnostic'].split(': compiler.')[1].split(':')[0] if ': compiler.' in case['diagnostic'] else ''
        assert result.returncode!=0 and expected and ('compiler.'+expected) in result.stderr,(case['name'],result.stderr)
    for name,code in [
        ('ImplicitNoArg','class User {} class ImplicitNoArg { User value = new User(); }'),
        ('ExplicitNoArg','class User { User(String name) {} User() { this("guest"); } } class ExplicitNoArg { User value = new User(); }'),
    ]:
        file=Path(tmp)/(name+'.java');file.write_text(code)
        subprocess.run([str(JDK/'javac'),'-d',tmp,str(file)],capture_output=True,text=True,check=True)
    for name in ['P04LombokProof','P04ConstructorProof']:
        command=[str(JDK/'javac'),'-cp',str(jar),'-processorpath',str(jar),'-d',tmp,str(OUT/(name+'.java'))]
        compiled=subprocess.run(command,capture_output=True,text=True,check=True)
        if name=='P04LombokProof':(OUT/'Lombok.compile.txt').write_text(compiled.stdout+compiled.stderr)
        result=subprocess.run([str(JDK/'java'),'-cp',tmp+':'+str(jar),name],capture_output=True,text=True,check=True)
        assert result.stdout==(OUT/(name+'.stdout.txt')).read_text(),name+' 실행 출력'
print('P04 확장: Lombok12 · 생성자 거부4/긍정2/override3 · Spring9 재현 통과')
