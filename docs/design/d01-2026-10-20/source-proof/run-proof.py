"""추가 temp Git/Gradle/JAR 실험이다. 학습자 코드·기존 Git 참조·원격·서비스는 바꾸지 않고 근거 파일만 기록한다."""
from pathlib import Path
import argparse,hashlib,json,os,shutil,stat,subprocess,tempfile,zipfile

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
p=argparse.ArgumentParser()
p.add_argument('--runtime-root',required=True)
p.add_argument('--freeze',action='store_true')
a=p.parse_args()
runtime=Path(a.runtime_root).resolve();runtime.mkdir(parents=True,exist_ok=True)
run=Path(tempfile.mkdtemp(prefix='run-',dir=runtime));os.chmod(run,0o700)
repo=run/'repo';repo.mkdir(mode=0o700)
templates=run/'empty-git-template';templates.mkdir()
raw=run/'logs';raw.mkdir()
env=os.environ.copy()
for key in list(env):
    if key.startswith('GIT_'):env.pop(key)
env.update(GIT_CONFIG_NOSYSTEM='1',GIT_CONFIG_GLOBAL='/dev/null',
           GIT_AUTHOR_DATE='2026-10-20T00:00:00Z',GIT_COMMITTER_DATE='2026-10-20T00:00:00Z',
           JAVA_HOME='LOCAL_HOME/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home',
           TZ='UTC',LC_ALL='C')
checks=[];facts={};commands=[]

def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def execute(args,label,cwd=repo,allowed=(0,),extra=None):
    child_env=env.copy();child_env.update(extra or {})
    result=subprocess.run(args,cwd=cwd,env=child_env,capture_output=True,text=True,timeout=120)
    output=result.stdout+result.stderr
    (raw/(label+'.log')).write_text(output)
    commands.append({'step':label,'arguments':args,'exitCode':result.returncode})
    if result.returncode not in allowed:raise AssertionError(label+' failed; inspect private raw log')
    return result,output
def git(*args):
    result,_=execute(['git','-C',str(repo),*args],f'git-{len(commands):02d}')
    return result.stdout.strip()
def gradle(task,label,revision,allowed=(0,)):
    args=[str(ROOT/'gradlew'),'-p',str(repo),'--offline','--no-daemon','--console=plain',
          '-PsourceRevision='+revision,*task]
    result,output=execute(args,label,allowed=allowed)
    (OUT/(label+'.log')).write_text(output)
    return result,output
def java(jar,label,extra=None):
    _,output=execute([str(Path(env['JAVA_HOME'])/'bin/java'),'-jar',str(jar)],label,
                     cwd=run,extra=extra)
    return dict(line.split('=',1)for line in output.splitlines()if '=' in line)
def check(id,ok,value):
    if not ok:raise AssertionError(id)
    checks.append(id);facts[id]=json.loads(json.dumps(value))
    print('PASS '+id,flush=True)
def gate(check_passed,reviewed):return check_passed and reviewed

meta=json.loads((OUT/'source.json').read_text())
assert sha(ROOT/meta['source'])==meta['sha256']
for block in meta['originalBlocks']:
    assert sha(OUT/'original'/block['file'])==block['sha256']
fixture=OUT/'fixture';fixture_manifest=[]
for file in sorted(fixture.rglob('*')):
    if file.is_file():fixture_manifest.append({'file':str(file.relative_to(OUT)),'sha256':sha(file)})
(OUT/'fixture-files.json').write_text(json.dumps(fixture_manifest,indent=2)+'\n')
root_head_before=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD']).decode().strip()
assert repo.resolve().is_relative_to(run.resolve())and repo!=ROOT
assert stat.S_IMODE(run.stat().st_mode)==0o700 and stat.S_IMODE(repo.stat().st_mode)==0o700

try:
    execute(['git','init','--initial-branch=baseline','--object-format=sha1',
             '--template='+str(templates),str(repo)],'git-init',cwd=run)
    for key,value in [('user.name','D01 Teaching Fixture'),('user.email','fixture@example.invalid'),
                      ('commit.gpgsign','false'),('core.autocrlf','false'),('gc.auto','0')]:git('config',key,value)
    assert Path(git('rev-parse','--show-toplevel')).resolve()==repo
    (repo/'README.md').write_text('# Additional lifecycle fixture\nNo remote, HTTP, database or deployment.\n')
    (repo/'.gitignore').write_text('.gradle/\nbuild/\n')
    git('add','README.md','.gitignore');git('commit','-m','docs: initialize private teaching fixture')
    baseline=git('rev-parse','HEAD')
    git('switch','-c','feat/post-like-demo')
    shutil.copytree(fixture/'common',repo,dirs_exist_ok=True)
    ledger=repo/'src/main/java/example/lifecycle/LikeLedger.java'
    shutil.copyfile(fixture/'variants/bad/LikeLedger.java',ledger)
    git('add','build.gradle','settings.gradle','src/main/java')
    git('commit','-m','feat: add intentionally failing duplicate-like fixture')
    bad_revision=git('rev-parse','HEAD')
    assemble,_=gradle(['assemble'],'bad-assemble',bad_revision)
    jar=repo/'build/libs/d01-lifecycle-fixture-1.0-demo.jar'
    assert jar.exists()
    bad_archive=run/'artifacts/bad-assembled.jar';bad_archive.parent.mkdir()
    shutil.copyfile(jar,bad_archive)
    bad_result,bad_stdout=gradle(['check'],'bad-check',bad_revision,allowed=(1,))
    bad_cli=java(bad_archive,'bad-jar-cli',{'D01_DEMO_FEATURE':'true'})
    check('local-assemble-is-not-contract-pass',assemble.returncode==0 and bad_result.returncode==1
          and jar.exists()and bad_cli['like_count']=='2'and 'observed_likes=2' in bad_stdout,
          {'assembleExit':0,'jarExists':True,'checkExit':1,'badCliLikeCount':2,
           'scope':'additional plain Java CLI/local Gradle; not GitHub CI or source Boot25 app'})
    blocked=run/'not-promoted/app.jar'
    if gate(bad_result.returncode==0,True):blocked.parent.mkdir();shutil.copyfile(bad_archive,blocked)
    check('local-failed-check-blocks-added-copy-gate',not blocked.exists(),
          {'checkPassed':False,'reviewInput':True,'fileCopied':False,
           'scope':'explicit extra local policy; not actual PR approval or branch protection'})

    shutil.copyfile(fixture/'variants/good/LikeLedger.java',ledger)
    git('diff','--check');git('add','src/main/java/example/lifecycle/LikeLedger.java')
    git('commit','-m','fix: count one like per actor and post in memory')
    fixed_revision=git('rev-parse','HEAD')
    fixed_result,fixed_stdout=gradle(['build'],'fixed-build',fixed_revision)
    archived=run/'artifacts/validated-like.jar';shutil.copyfile(jar,archived)
    artifact_sha=sha(archived)
    check('local-fixed-contract-and-build-pass',fixed_result.returncode==0
          and 'observed_likes=1' in fixed_stdout and fixed_stdout.count('PASS duplicate-like-is-one')==1,
          {'buildExit':0,'observedLikes':1,'contractPassLines':1,
           'scope':'one added CLI contract, not JUnit/HTTP/database/concurrency coverage'})
    check('private-git-branch-pointer-isolated',git('rev-parse','baseline')==baseline
          and git('rev-parse','feat/post-like-demo')==fixed_revision
          and git('rev-list','--count','baseline..feat/post-like-demo')=='2'and git('remote','-v')=='',
          {'baseline':baseline,'badCommit':bad_revision,'fixedCommit':fixed_revision,
           'featureCommitsAfterBaseline':2,'baselinePointerUnchanged':True,'remotes':0,
           'scope':'new private Git repository; fixed demo author dates; no user branch or remote commands'})
    with zipfile.ZipFile(archived)as z:
        entries=z.namelist();manifest=dict(line.split(': ',1)for line in z.read('META-INF/MANIFEST.MF').decode().splitlines()if ': ' in line)
    check('local-jar-manifest-ties-source-revision',manifest.get('Source-Revision')==fixed_revision
          and manifest.get('Main-Class')=='example.lifecycle.LikeDemo'
          and manifest.get('Implementation-Version')=='1.0-demo',
          {'manifest':manifest,'sha256':artifact_sha,'bytes':archived.stat().st_size,'zipEntries':entries,
           'scope':'actual JAR metadata/checksum; not container image digest/registry/attestation'})

    profiles={};hashes={}
    assert gate(True,True)
    for profile in ['dev','stg','prod']:
        target=run/'environment-copies'/profile/'app.jar';target.parent.mkdir(parents=True)
        shutil.copyfile(archived,target);hashes[profile]=sha(target)
        profiles[profile]=java(target,'cli-'+profile,{'D01_DEMO_ENV':profile,
            'D01_DEMO_DB_ALIAS':'d01-demo-'+profile,'D01_DEMO_FEATURE':'true'})
    check('local-copies-keep-one-artifact-byte-identity',len(set(hashes.values()))==1
          and next(iter(hashes.values()))==artifact_sha,
          {'copySha256':hashes,'allSameValidatedJar':True,
           'scope':'local files named dev/stg/prod only; no service deployment or registry'})
    check('local-config-output-does-not-change-git-branch',all(v['profile']==k
          and v['db_alias_string_only']=='d01-demo-'+k and v['like_count']=='1'
          for k,v in profiles.items())and git('branch','--show-current')=='feat/post-like-demo'
          and git('rev-parse','HEAD')==fixed_revision,
          {'cliOutputs':profiles,'branchStayed':'feat/post-like-demo',
           'scope':'environment strings/CLI output only; no DB connection or real environment provisioning'})
    off=java(archived,'cli-feature-off',{'D01_DEMO_ENV':'prod','D01_DEMO_FEATURE':'false'})
    on=java(archived,'cli-feature-on',{'D01_DEMO_ENV':'prod','D01_DEMO_FEATURE':'true'})
    check('local-cli-flag-changes-output-same-jar',off['like_count']=='0'and on['like_count']=='1'
          and off['feature_enabled']=='false'and on['feature_enabled']=='true'and sha(archived)==artifact_sha,
          {'offLikeCount':0,'onLikeCount':1,'sameJarSha256':artifact_sha,
           'scope':'extra CLI flag branch, not actual deployment/release/HTTP or flag provider'})
    project_cache=repo/'.gradle';assert project_cache.is_dir()
    shutil.move(project_cache,run/'saved-project-cache')
    check('local-project-cache-is-not-archived-artifact',not project_cache.exists()
          and archived.exists()and sha(archived)==artifact_sha,
          {'projectCacheMoved':True,'archiveStillExists':True,'archiveSha256':artifact_sha,
           'scope':'only new fixture project .gradle moved; global Gradle/dependency caches not removed or moved; Gradle may reuse/update its own caches'})
    rebuild,rebuild_stdout=gradle(['clean','build'],'rebuild-without-project-cache',fixed_revision)
    check('local-reproducible-fixture-rebuild',rebuild.returncode==0 and sha(jar)==artifact_sha,
          {'rebuildExit':0,'rebuiltJarSha256':sha(jar),'sameAsArchive':True,
           'scope':'this fixed-input Jar task disables timestamps/sorts entries; not all builds reproducible'})
    check('private-fixture-finished-clean',git('status','--porcelain')==''
          and sha(ROOT/meta['source'])==meta['sha256']
          and subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD']).decode().strip()==root_head_before,
          {'privateGitClean':True,'sourceUnchanged':True,'userWorktreeHeadUnchanged':True,
           'scope':'no user Git add/commit/pull/push/merge/PR/deployment performed'})

    models={
        'review-and-check':{'kind':'added boolean model','rows':[
            {'check':c,'review':r,'mayCopy':gate(c,r)}for c,r in [(False,False),(False,True),(True,False),(True,True)]],
            'scope':'model inputs only; not actual GitHub review/required checks/protection'},
        'schema-compatibility':{'kind':'added set comparison model','oldRequires':['like_count'],
            'beforeColumns':['like_count'],'afterRenameColumns':['like_total'],
            'beforeCompatible':{'like_count'}.issubset({'like_count'}),
            'afterRenameCompatible':{'like_count'}.issubset({'like_total'}),
            'afterAddCompatible':{'like_count'}.issubset({'like_count','like_total'}),
            'scope':'no actual DB/migration/rollback or production incident executed'},
        'incident-options':{'kind':'source-derived decision examples; unexecuted',
            'branches':['previous version safe and compatible: consider rollback',
                        'feature can be isolated: consider disabling flag',
                        'minimal correction safer: consider hotfix with verification'],
            'after':'observe recovery and create owned follow-up action',
            'scope':'no actual alert/incident/SLA/hotfix/rollout/postmortem'}
    }
    result={'checks':sorted(checks),'facts':facts,'models':models}
    (OUT/'execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    frozen=OUT/'checkpoints/expected-execution.json'
    if a.freeze:frozen.parent.mkdir(exist_ok=True);frozen.write_bytes((OUT/'execution.json').read_bytes())
    else:assert json.loads(frozen.read_text())==result,'frozen differs; investigate before updating'
    print(json.dumps({'checks':len(checks),'models':len(models),'runtime':str(run),'frozenMatch':not a.freeze},indent=2))
finally:
    (run/'commands.json').write_text(json.dumps(commands,ensure_ascii=False,indent=2)+'\n')
    (OUT/'runtime-last.json').write_text(json.dumps({'run':str(run),'repo':str(repo),
        'scope':'private CLI subprocesses; no server/remote deployment','commandCount':len(commands)},indent=2)+'\n')
