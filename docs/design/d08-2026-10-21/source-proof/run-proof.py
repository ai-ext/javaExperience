"""D08 추가 local Git·Java21 빌드 관찰. 원문 workflow/원격 CI·배포는 실행하지 않는다."""
from pathlib import Path
import argparse, collections, datetime, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time, xml.etree.ElementTree as ET, zipfile

OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--project-root', default=str(OUT.parents[3]))
parser.add_argument('--runtime-root', required=True)
parser.add_argument('--freeze', action='store_true')
parser.add_argument('--probe', action='store_true', help='observe without creating or comparing the frozen checkpoint')
args = parser.parse_args()
assert not (args.probe and args.freeze), '--probe and --freeze are mutually exclusive'
ROOT = Path(args.project_root).resolve()
BASE = Path(args.runtime_root).resolve()
JAVA = Path('LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home')
CACHE_SOURCE = Path('LOCAL_HOME/.gradle')
EXPECTED = OUT/'checkpoints/expected-execution.json'
if args.freeze and EXPECTED.exists():
    raise SystemExit('frozen baseline exists; --freeze never overwrites it')
os.umask(0o077)
BASE.mkdir(parents=True, exist_ok=True)
RUN = Path(tempfile.mkdtemp(prefix='run-', dir=BASE))
os.chmod(RUN, 0o700)
CACHE = RUN/'gradle-home'
FIXTURE = OUT/'fixture'
RECORDS = OUT/'records'/('probe' if args.probe else 'freeze' if args.freeze else 'replay')
RECORDS.mkdir(parents=True, exist_ok=True)
ENV = os.environ.copy()
ENV.update(JAVA_HOME=str(JAVA), GRADLE_USER_HOME=str(CACHE), TZ='UTC', LC_ALL='C',
           GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', GIT_TERMINAL_PROMPT='0',
           GIT_AUTHOR_NAME='D08 Fixture', GIT_AUTHOR_EMAIL='d08@example.invalid',
           GIT_COMMITTER_NAME='D08 Fixture', GIT_COMMITTER_EMAIL='d08@example.invalid')
ENV.pop('GRADLE_RO_DEP_CACHE', None)
checks, facts, repos = [], {}, []
raw = {'run':str(RUN), 'privateGradleUserHome':str(CACHE), 'commands':[], 'completed':False,
       'scope':'additional local fixtures only; no HTTP application launch, remote Git, CI, registry, cloud or deployment'}
tick = 0

def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

def check(name, predicate, value):
    if not predicate:
        raise AssertionError(name)
    checks.append(name)
    facts[name] = value
    print('PASS '+name, flush=True)

def command(label, argv, cwd=RUN, expected=0, extra=None, timeout=240):
    env = {**ENV, **(extra or {})}
    path = RUN/(f'{len(raw["commands"])+1:03d}-{label}.log')
    proc = subprocess.run(list(map(str, argv)), cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    path.write_bytes(proc.stdout)
    raw['commands'].append({'name':label,'argv':list(map(str,argv)),'cwd':str(cwd),
                            'exitCode':proc.returncode,'log':str(path)})
    if expected is not None and proc.returncode != expected:
        raise AssertionError(f'{label}: exit {proc.returncode}; expected {expected}; {path}')
    return proc.returncode, proc.stdout.decode(errors='replace')

def git(repo, *argv, expected=0, extra=None):
    return command('git-'+argv[0], ['git','-C',repo,*argv], expected=expected, extra=extra)

def text(repo, *argv):
    return git(repo,*argv)[1].strip()

def commit(repo, message):
    global tick
    tick += 1
    date = (datetime.datetime(2026,10,21,tzinfo=datetime.timezone.utc)+datetime.timedelta(seconds=tick)).strftime('%Y-%m-%dT%H:%M:%S+0000')
    git(repo,'add','--all')
    git(repo,'commit','--no-gpg-sign','-m',message,extra={'GIT_AUTHOR_DATE':date,'GIT_COMMITTER_DATE':date})
    return text(repo,'rev-parse','HEAD')

def repository(name, files):
    repo = RUN/name
    repo.mkdir(mode=0o700)
    git(repo,'init','--initial-branch=trunk','--object-format=sha1','--template=')
    git(repo,'config','core.autocrlf','false')
    git(repo,'config','commit.gpgsign','false')
    git(repo,'config','core.hooksPath','/dev/null')
    for file,content in files.items():
        target=repo/file; target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content)
    repos.append(repo)
    return repo,commit(repo,name+' baseline')

def parents(repo, ref='HEAD'):
    return text(repo,'rev-list','--parents','-n','1',ref).split()[1:]

def ancestor(repo, before, after):
    code,_ = git(repo,'merge-base','--is-ancestor',before,after,expected=None)
    assert code in (0,1)
    return code==0

def report(path):
    tree=ET.parse(path).getroot()
    suite=tree if tree.tag=='testsuite' else tree.find('testsuite')
    tests=[{'class':c.attrib['classname'],'method':c.attrib['name'],
            'failures':[{'type':f.attrib.get('type'),'message':f.attrib.get('message')} for f in c.findall('failure')]} for c in suite.findall('testcase')]
    return {key:int(suite.attrib[key]) for key in ['tests','failures','errors','skipped']}|{'cases':tests}

def task_rows(output):
    return [{'task':m[1],'outcome':m[2] or 'EXECUTED'} for m in re.finditer(r'^> Task (:\S+?)(?: (FAILED|UP-TO-DATE|NO-SOURCE|SKIPPED|FROM-CACHE))?$',output,re.M)]

try:
    source=json.loads((OUT/'source.json').read_text())
    original=(ROOT/source['source']).read_bytes()
    blocks=list(re.finditer(r'^```([^\n]*)\n(.*?)^```[ \t]*$',original.decode(),re.M|re.S))
    exact=len(blocks)==8 and all(m[1].strip()==b['language'] and m[2].encode()==(OUT/'original'/b['file']).read_bytes() and digest(OUT/'original'/b['file'])==b['sha256'] for m,b in zip(blocks,source['originalBlocks']))
    check('original-eight-blocks-preserved-unrun',hashlib.sha256(original).hexdigest()==source['sha256'] and exact,
          {'sourceSHA256':source['sha256'],'lines':319,'blocks':8,'languages':dict(collections.Counter(b['language'] for b in source['originalBlocks'])),
           'originalJavaPresent':False,'originalJava25CommandsExecuted':False,'originalYAMLGroovyExecuted':False})
    # 기존 Gradle cache는 읽어서 새 private copy만 만든다. 기존 파일 삭제/수정은 없다.
    shutil.copytree(CACHE_SOURCE/'caches/modules-2',CACHE/'caches/modules-2',ignore=shutil.ignore_patterns('*.lock','gc.properties'))
    shutil.copytree(CACHE_SOURCE/'wrapper/dists/gradle-9.8.0-bin',CACHE/'wrapper/dists/gradle-9.8.0-bin',ignore=shutil.ignore_patterns('*.lck','*.part'))
    java_version=command('java-version',[JAVA/'bin/java','-version'])[1]
    gradle_version=command('gradle-version',[ROOT/'gradlew','--offline','--no-daemon','--version'])[1]
    git_version=command('git-version',['git','--version'])[1].strip()
    check('additional-java21-gradle-private-cache', '21.0.6' in java_version and 'Gradle 9.8.0' in gradle_version and (RUN.stat().st_mode&0o777)==0o700,
          {'java':'21.0.6','gradle':'9.8.0','git':git_version,'runMode':'0700','gradleUserHome':'own private copied cache','existingCacheDeletedOrWritten':False,'offline':True,'applicationJVMStarted':False})
    branch,base=repository('branch',{'value.txt':'value=0\n'})
    git(branch,'switch','-c','feature')
    (branch/'value.txt').write_text('value=1\n')
    before={'trunk':text(branch,'rev-parse','trunk'),'feature':text(branch,'rev-parse','feature'),'working':(branch/'value.txt').read_text(),'committed':text(branch,'show','HEAD:value.txt')+'\n'}
    git(branch,'add','value.txt')
    (branch/'value.txt').write_text('value=2\n')
    staged=text(branch,'show',':value.txt')+'\n'
    # 명시한 index만 commit하여 working/index/commit의 구분을 관찰한다.
    tick+=1;date=f'2026-10-21T00:00:{tick:02d}+0000'
    git(branch,'commit','--no-gpg-sign','-m','branch stage value one',extra={'GIT_AUTHOR_DATE':date,'GIT_COMMITTER_DATE':date})
    first=text(branch,'rev-parse','HEAD')
    after={'trunk':text(branch,'rev-parse','trunk'),'feature':first,'working':(branch/'value.txt').read_text(),'committed':text(branch,'show','HEAD:value.txt')+'\n','index':staged}
    check('working-index-commit-and-branch-refs',before['trunk']==before['feature']==base and before['working']=='value=1\n' and after['trunk']==base and after['feature']!=base and after['working']=='value=2\n' and after['committed']==staged=='value=1\n',{'beforeCommit':before,'afterCommit':after})
    git(branch,'tag','demo-v1',first)
    moved=commit(branch,'branch commit working value two')
    check('lightweight-tag-stable-while-branch-moves',text(branch,'cat-file','-t','demo-v1')=='commit' and text(branch,'rev-parse','demo-v1')==first and moved!=first,
          {'tag':'demo-v1','kind':'lightweight','tagCommit':first,'branchAfterNextCommit':moved,'tagMoved':False,'scope':'not force-moving the tag; no remote release'})
    merge,mb=repository('merge',{'base.txt':'base\n'})
    git(merge,'switch','-c','feature');(merge/'feature.txt').write_text('feature\n');mf=commit(merge,'merge feature')
    git(merge,'switch','trunk');(merge/'main.txt').write_text('trunk\n');mt=commit(merge,'merge trunk')
    git(merge,'merge','--no-ff','feature','-m','merge integration',extra={'GIT_AUTHOR_DATE':'2026-10-21T00:01:00+0000','GIT_COMMITTER_DATE':'2026-10-21T00:01:00+0000'})
    mm=text(merge,'rev-parse','HEAD')
    check('no-ff-merge-keeps-two-parents',parents(merge)==[mt,mf] and ancestor(merge,mf,mm),{'base':mb,'trunkBefore':mt,'feature':mf,'merge':mm,'parents':parents(merge),'featureIsAncestor':True})
    rebase,rb=repository('rebase',{'base.txt':'base\n'})
    git(rebase,'switch','-c','feature');(rebase/'feature.txt').write_text('feature\n');rf=commit(rebase,'rebase feature');before_parent=parents(rebase)
    git(rebase,'switch','trunk');(rebase/'main.txt').write_text('trunk\n');rt=commit(rebase,'rebase trunk')
    git(rebase,'switch','feature');git(rebase,'rebase','trunk',extra={'GIT_COMMITTER_DATE':'2026-10-21T00:02:00+0000'})
    rn=text(rebase,'rev-parse','HEAD')
    check('rebase-changes-parent-and-commit-sha',rf!=rn and before_parent==[rb] and parents(rebase)==[rt] and (rebase/'feature.txt').read_text()=='feature\n',{'before':rf,'after':rn,'parentBefore':before_parent,'parentAfter':parents(rebase),'featureContent':'feature\n','scope':'own unshared toy repository only'})
    squash,sb=repository('squash',{'base.txt':'base\n'})
    git(squash,'switch','-c','feature');(squash/'feature.txt').write_text('one\n');sf1=commit(squash,'squash feature one');(squash/'feature.txt').write_text('two\n');sf2=commit(squash,'squash feature two')
    git(squash,'switch','trunk');git(squash,'merge','--squash','feature');sq=commit(squash,'squashed integration')
    same_tree=text(squash,'rev-parse','HEAD^{tree}')==text(squash,'rev-parse','feature^{tree}')
    check('squash-same-tree-without-feature-ancestry',same_tree and parents(squash)==[sb] and not ancestor(squash,sf1,sq) and not ancestor(squash,sf2,sq),{'base':sb,'featureCommits':[sf1,sf2],'squashCommit':sq,'parents':parents(squash),'sameTreeAsFeature':True,'featureCommitsAncestorsOfTrunk':[False,False]})
    conflict,cb=repository('conflict',{'result.py':(FIXTURE/'conflict-base.py').read_text()})
    git(conflict,'switch','-c','feature');shutil.copyfile(FIXTURE/'conflict-right.py',conflict/'result.py');cf=commit(conflict,'conflict right three')
    git(conflict,'switch','trunk');shutil.copyfile(FIXTURE/'conflict-left.py',conflict/'result.py');ct=commit(conflict,'conflict left two')
    conflict_exit,conflict_log=git(conflict,'merge','--no-ff','feature',expected=None)
    conflict_text=(conflict/'result.py').read_text();unmerged=text(conflict,'diff','--name-only','--diff-filter=U')
    check('real-overlapping-edit-produces-conflict',conflict_exit==1 and unmerged=='result.py' and '<<<<<<< HEAD' in conflict_text and '>>>>>>> feature' in conflict_text,{'mergeExit':conflict_exit,'unmerged':['result.py'],'conflictText':conflict_text,'leftCommit':ct,'rightCommit':cf})
    shutil.copyfile(FIXTURE/'conflict-resolved.py',conflict/'result.py');resolved=commit(conflict,'resolve both intended values')
    resolved_value=command('conflict-test',[sys.executable,conflict/'result.py'])[1].strip()
    check('conflict-resolution-tests-both-intents',resolved_value=='5' and parents(conflict)==[ct,cf] and text(conflict,'status','--porcelain')=='',{'resolvedCode':(conflict/'result.py').read_text(),'stdout':'5','parents':parents(conflict),'commit':resolved,'scope':'additional Python value toy; not learner application or GitHub review'})
    project=RUN/'build-example';project.mkdir(mode=0o700);repos.append(project)
    git(project,'init','--initial-branch=trunk','--object-format=sha1','--template=');git(project,'config','core.autocrlf','false');git(project,'config','commit.gpgsign','false');git(project,'config','core.hooksPath','/dev/null')
    shutil.copyfile(FIXTURE/'build-ungated.gradle',project/'build.gradle')
    shutil.copyfile(FIXTURE/'settings.gradle',project/'settings.gradle')
    shutil.copyfile(FIXTURE/'gitignore.txt',project/'.gitignore')
    src=project/'src/main/java/proof';src.mkdir(parents=True)
    test=project/'src/test/java/proof';test.mkdir(parents=True)
    shutil.copyfile(FIXTURE/'NativeApplication.java',src/'NativeApplication.java');shutil.copyfile(FIXTURE/'Calculator.bad.java',src/'Calculator.java');shutil.copyfile(FIXTURE/'CalculatorTest.java',test/'CalculatorTest.java')
    ungated_sha=commit(project,'additional buggy calculator without test gate')
    remotes={p.name:text(p,'remote') for p in repos}
    check('all-toy-git-repositories-have-no-remotes',len(repos)==6 and all(v=='' for v in remotes.values()),{'repositories':6,'remotesPerRepository':{k:0 for k in remotes},'sourceRepositoryModified':False,'fixedAuthor':'D08 Fixture <d08@example.invalid>','fixedCommitDates':True,'remoteHostingPolicyExecuted':False})
    build_argv=[ROOT/'gradlew','-p',project,'--offline','--no-daemon','--console=plain','--max-workers=2','clean','test','bootJar']
    ungated_exit,ungated_log=command('ungated-clean-test-bootjar',build_argv,expected=None)
    junit=project/'build/test-results/test/TEST-proof.CalculatorTest.xml'
    ungated_report=report(junit);ungated_tasks=task_rows(ungated_log)
    ungated_jars=list((project/'build/libs').glob('*.jar'))
    ungated_jar_rows=[{'file':x.name,'bytes':x.stat().st_size,'sha256':digest(x)} for x in ungated_jars]
    shutil.copyfile(junit,RECORDS/'ungated-TEST-proof.CalculatorTest.xml')
    check('ungated-test-failure-can-leave-boot-jar',ungated_exit!=0 and ungated_report['tests']==1 and ungated_report['failures']==1 and len(ungated_jars)==1 and next(i for i,x in enumerate(ungated_tasks) if x['task']==':bootJar')<next(i for i,x in enumerate(ungated_tasks) if x['task']==':test'),
          {'commit':ungated_sha,'exitCode':ungated_exit,'report':ungated_report,'tasks':ungated_tasks,'jarFiles':ungated_jar_rows,'bootJarExecutedBeforeTest':True,'scope':'actual additional ungated Gradle9.8/Boot4.1.1 build; CLI task listing alone does not establish a test dependency; not a hosted CI job observation'})
    shutil.copyfile(FIXTURE/'build.gradle',project/'build.gradle')
    bad_sha=commit(project,'add explicit test dependency before packaging')
    bad_exit,bad_log=command('buggy-clean-test-bootjar',build_argv,expected=None)
    junit=project/'build/test-results/test/TEST-proof.CalculatorTest.xml';bad_report=report(junit)
    shutil.copyfile(junit,RECORDS/'bad-TEST-proof.CalculatorTest.xml')
    shutil.copyfile(project/'build/reports/tests/test/index.html',RECORDS/'bad-test-index.html')
    bad_tasks=task_rows(bad_log)
    check('buggy-additional-junit-fails-one-test',bad_exit!=0 and bad_report['tests']==1 and bad_report['failures']==1 and bad_report['errors']==0 and 'expected: <5> but was: <-1>' in bad_report['cases'][0]['failures'][0]['message'],{'commit':bad_sha,'input':[2,3],'expected':5,'actual':-1,'exitCode':bad_exit,'report':bad_report,'tasks':bad_tasks})
    missing_jars=sorted(x.name for x in (project/'build/libs').glob('*.jar'))
    check('failed-test-stops-before-bootjar-and-no-jar',missing_jars==[] and any(x['task']==':test' and x['outcome']=='FAILED' for x in bad_tasks) and not any(x['task']==':bootJar' for x in bad_tasks),{'commit':bad_sha,'testTask':'FAILED','bootJarTaskExecuted':False,'jarFiles':missing_jars,'testReportProduced':True,'additionalBuildGate':"tasks.named('bootJar') { dependsOn tasks.named('test') }",'scope':'explicit additional task dependency; not guaranteed by the source command alone or a hosted downstream-job skipped result'})
    shutil.copyfile(FIXTURE/'Calculator.fixed.java',src/'Calculator.java');fixed_sha=commit(project,'correct calculator addition')
    good_exit,good_log=command('fixed-clean-test-bootjar',build_argv)
    good_report=report(junit);shutil.copyfile(junit,RECORDS/'fixed-TEST-proof.CalculatorTest.xml');shutil.copyfile(project/'build/reports/tests/test/index.html',RECORDS/'fixed-test-index.html')
    good_tasks=task_rows(good_log)
    check('corrected-same-command-junit-passes',good_exit==0 and good_report['tests']==1 and good_report['failures']==good_report['errors']==0,{'commit':fixed_sha,'sameCommandExceptUnchangedPrivatePath':True,'command':'./gradlew -p <own-project> --offline --no-daemon --console=plain --max-workers=2 clean test bootJar','input':[2,3],'actual':5,'exitCode':good_exit,'report':good_report,'tasks':good_tasks})
    jars=list((project/'build/libs').glob('*.jar'));assert len(jars)==1;jar=jars[0]
    check('successful-task-graph-produces-boot-jar',any(x['task']==':test' and x['outcome']=='EXECUTED' for x in good_tasks) and any(x['task']==':bootJar' and x['outcome']=='EXECUTED' for x in good_tasks),{'jarFile':jar.name,'exists':jar.is_file(),'testTask':'EXECUTED','bootJarTask':'EXECUTED','HTTPOrAppLaunchExecuted':False})
    classes={p.name:int.from_bytes(p.read_bytes()[6:8],'big') for p in sorted((project/'build/classes/java/main/proof').glob('*.class'))}
    check('additional-java-classes-target21',classes=={'Calculator.class':65,'NativeApplication.class':65},{'classfileMajors':classes,'testClassfileMajor':int.from_bytes((project/'build/classes/java/test/proof/CalculatorTest.class').read_bytes()[6:8],'big'),'sourceJava25Executed':False})
    command('record-dependency-sha',[ROOT/'gradlew','-p',project,'--offline','--no-daemon','--console=plain','--max-workers=2','recordDependencies'])
    deps=json.loads((project/'dependencies.json').read_text());union={x['coordinate']:x for group in deps.values() for x in group}
    normalized={k:[{'coordinate':x['coordinate'],'sha256':x['sha256']} for x in v] for k,v in deps.items()}
    required=['org.springframework.boot:spring-boot:4.1.1','org.springframework:spring-core:7.0.9','org.junit.jupiter:junit-jupiter-api:6.0.3']
    check('pinned-runtime-test-artifact-sha',all(x in union for x in required) and all(digest(x['file'])==x['sha256'] for x in union.values()),{'runtimeArtifacts':len(deps['runtime']),'testArtifacts':len(deps['test']),'uniqueArtifactUnion':len(union),'springBoot':'4.1.1','springFramework':'7.0.9','junitJupiter':'6.0.3','allSHA256Matched':True,'snapshot':normalized})
    with zipfile.ZipFile(jar) as z:
        manifest=z.read('META-INF/MANIFEST.MF').decode();nested=sorted(n for n in z.namelist() if n.startswith('BOOT-INF/lib/') and n.endswith('.jar'))
        exact_classes=all(z.read('BOOT-INF/classes/proof/'+name)==(project/'build/classes/java/main/proof'/name).read_bytes() for name in classes)
    jar_fact={'file':jar.name,'bytes':jar.stat().st_size,'sha256':digest(jar),'nestedLibraries':len(nested),'mainClass':'org.springframework.boot.loader.launch.JarLauncher','startClass':'proof.NativeApplication','compiledClassBytesExact':exact_classes}
    check('boot-jar-manifest-and-compiled-byte-evidence','Main-Class: org.springframework.boot.loader.launch.JarLauncher' in manifest and 'Start-Class: proof.NativeApplication' in manifest and exact_classes and len(nested)>0,jar_fact)
    mapping={'ungatedCommit':ungated_sha,'ungatedBuildExit':ungated_exit,'ungatedJarProduced':True,'badCommit':bad_sha,'badCalculatorSHA256':digest(FIXTURE/'Calculator.bad.java'),'badBuildExit':bad_exit,'badJarProduced':False,'fixedCommit':fixed_sha,'fixedCalculatorSHA256':digest(FIXTURE/'Calculator.fixed.java'),'fixedBuildExit':good_exit,'jarSHA256':jar_fact['sha256'],'mappingLocation':'separate observation metadata; no embedded source SHA claim'}
    check('artifact-mapped-to-actually-tested-commit',bad_sha!=fixed_sha and parents(project)==[bad_sha] and text(project,'status','--porcelain')=='' and text(project,'rev-parse','HEAD')==fixed_sha,mapping)
    copies=[]
    for env in ['dev','stg','prod']:
        dest=RUN/'local-copies'/env/'app.jar';dest.parent.mkdir(parents=True);shutil.copy2(jar,dest);copies.append(dest)
    check('same-jar-three-local-folder-copies',all(digest(p)==jar_fact['sha256'] for p in copies),{'aliases':['dev/app.jar','stg/app.jar','prod/app.jar'],'sha256':jar_fact['sha256'],'bytes':jar_fact['bytes'],'copies':3,'rebuiltBetweenCopies':False,'realEnvironmentPromotionExecuted':False})
    fixture_hashes=[{'file':p.relative_to(FIXTURE).as_posix(),'sha256':digest(p)} for p in sorted(FIXTURE.rglob('*')) if p.is_file()]
    source_final=hashlib.sha256((ROOT/source['source']).read_bytes()).hexdigest()
    check('source-fixtures-preserved-after-own-commands',source_final==source['sha256'] and all(digest(OUT/'original'/b['file'])==b['sha256'] for b in source['originalBlocks']),{'sourceSHA256':source_final,'originalBlocks':8,'additionalFixtureFiles':fixture_hashes,'scope':'all source snippets are additional fixtures; no learner code or original source changed'})
    check('bounded-local-command-scope-no-deployment',all(x['exitCode']==0 or x['name'] in ['git-merge','git-merge-base','ungated-clean-test-bootjar','buggy-clean-test-bootjar'] for x in raw['commands']) and all(text(p,'remote')=='' for p in repos),{'trackedLocalRepositories':6,'longRunningApplicationJVMsStarted':0,'HTTPExecuted':False,'remotePushOrPRExecuted':False,'hostedCIExecuted':False,'containerRegistryKubernetesArgoExecuted':False,'originalJava25YAMLGroovyExecuted':False,'gradleCommandsReturned':True,'cacheDeletionOrSpeedExperiment':False})
    assert len(checks)==22 and len(set(checks))==22
    models_path=OUT/'models.json'
    models=json.loads(models_path.read_text()) if models_path.exists() else {}
    execution={'checks':checks,'facts':facts,'models':models}
    if args.freeze:
        assert models_path.exists() and len(models)==6, 'wait for main-authored six unexecuted models before freezing'
        assert all(m['executed'] is False for m in models.values()), 'models are unexecuted; never create native PASS for models'
        EXPECTED.parent.mkdir(exist_ok=True)
        with EXPECTED.open('x') as frozen:
            frozen.write(json.dumps(execution,ensure_ascii=False,indent=2)+'\n')
    elif not args.probe:
        assert execution==json.loads(EXPECTED.read_text()),'whole native execution differs from frozen baseline'
    write_json(OUT/('probe-execution.json' if args.probe else 'execution.json'),execution);write_json(OUT/'dependencies.json',normalized)
    write_json(OUT/'fixture-manifest.json',{'files':fixture_hashes,'runnerSHA256':digest(__file__)})
    raw['jar']={**jar_fact,'manifest':manifest,'nestedLibraryFiles':nested,'path':str(jar)}
    raw['artifactCommitMapping']=mapping;raw['dependencyFiles']=deps;raw['completed']=True
    print('FULL_EXECUTION_MATCH; native22 only; no hosted CI or deployment',flush=True)
finally:
    raw['checksReached']=checks
    write_json(RUN/'runtime.json',raw);write_json(OUT/'runtime-last.json',raw)
    for row in raw['commands']:
        shutil.copyfile(row['log'],RECORDS/Path(row['log']).name)
    write_json(OUT/'run-status.json',{'run':str(RUN),'completed':raw['completed'],'checksReached':len(checks),'freeze':args.freeze,'probe':args.probe})
