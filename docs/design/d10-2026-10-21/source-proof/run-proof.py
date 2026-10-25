"""D10 원문 보존 + 명시 번역한 별도 SQLite probe. 기존 DB/서비스와 원문 명령은 실행하지 않는다."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

OUT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser()
parser.add_argument('--project-root', default=str(OUT.parents[3]))
parser.add_argument('--runtime-root', required=True)
parser.add_argument('--probe', action='store_true')
parser.add_argument('--freeze', action='store_true')
args = parser.parse_args()
ROOT = Path(args.project_root).resolve()
BASE = Path(args.runtime_root).resolve()
EXPECTED = OUT/'checkpoints/expected-execution.json'
assert not (args.probe and args.freeze), '--probe and --freeze are mutually exclusive'
if args.freeze and EXPECTED.exists():
    raise SystemExit('frozen baseline exists; --freeze never overwrites it')
os.umask(0o077)
BASE.mkdir(parents=True,exist_ok=True)
RUN = Path(tempfile.mkdtemp(prefix='run-',dir=BASE));os.chmod(RUN,0o700)
MODE = 'probe' if args.probe else 'freeze' if args.freeze else 'replay'
RECORDS = OUT/'records'/MODE/RUN.name;RECORDS.mkdir(parents=True)
FIXTURE = OUT/'fixture'
checks, facts = [], {}
raw = {'mode':MODE,'run':str(RUN),'commands':[],'completed':False,
       'scope':'additional explicitly translated stdlib SQLite only; no PostgreSQL/MySQL/Docker/Java25/source commands, existing DB/service/cache/practice access'}

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def write_json(path,value):
    Path(path).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')

def check(name,predicate,value):
    assert name not in facts,'duplicate CHECK '+name
    if not predicate:raise AssertionError(name)
    checks.append(name);facts[name]=value;print('PASS '+name,flush=True)

try:
    source=json.loads((OUT/'source.json').read_text());markdown=(ROOT/source['source']).read_bytes()
    blocks=list(re.finditer(r'^```([^\n]*)\n(.*?)^```[ \t]*$',markdown.decode(),re.M|re.S))
    exact=len(blocks)==len(source['originalBlocks']) and all(m[1].strip()==b['language'] and m[2].encode()==(OUT/'original'/b['file']).read_bytes() and sha(OUT/'original'/b['file'])==b['sha256'] for m,b in zip(blocks,source['originalBlocks']))
    check('original-thirteen-blocks-preserved-unrun',hashlib.sha256(markdown).hexdigest()==source['sha256'] and exact,
          {'sourceSHA256':source['sha256'],'lines':source['lines'],'blocks':len(blocks),'originalSQLExecuted':False,'originalPostgreSQLMySQLDockerJava25CommandsExecuted':False,'scope':'original PostgreSQL DDL/query and distinct MySQL sample kept as bytes, not run or treated as one equivalent constraint schema'})
    fixture=[{'file':p.relative_to(FIXTURE).as_posix(),'sha256':sha(p)} for p in sorted(FIXTURE.rglob('*')) if p.is_file()]
    argv=[sys.executable,'-B',str(FIXTURE/'sqlite_probe.py'),str(RUN)]
    env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1','TZ':'UTC','LC_ALL':'C'}
    process=subprocess.run(argv,cwd=RUN,env=env,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=60)
    (RUN/'sqlite-probe.log').write_text(process.stdout)
    raw['commands'].append({'name':'additional-sqlite-probe','argv':argv,'cwd':str(RUN),'exitCode':process.returncode,'log':str(RUN/'sqlite-probe.log')})
    print(process.stdout,end='',flush=True)
    assert process.returncode==0,'SQLite probe failed; inspect '+str(RUN/'sqlite-probe.log')
    observed=json.loads((RUN/'observed.json').read_text());actual_ids=[line[5:] for line in process.stdout.splitlines() if line.startswith('PASS ')]
    assert actual_ids==observed['checks'] and len(actual_ids)==len(set(actual_ids)) and set(actual_ids)==set(observed['facts']),'actual PASS ids/facts must match uniquely; do not assume a fixed magic CHECK count'
    for name in actual_ids:
        assert name not in facts,'duplicate source/fixture CHECK '+name
        checks.append(name);facts[name]=observed['facts'][name]
    current_fixture=[{'file':p.relative_to(FIXTURE).as_posix(),'sha256':sha(p)} for p in sorted(FIXTURE.rglob('*')) if p.is_file()]
    native_raw=json.loads((RUN/'raw-sqlite.json').read_text())
    check('own-files-runtime-and-source-fixtures-preserved',current_fixture==fixture and sha(ROOT/source['source'])==source['sha256'] and (RUN.stat().st_mode&0o777)==0o700 and all(row['closed'] for row in native_raw['connections'].values()),
          {'runMode':'0700','fixtureFiles':fixture,'allFixtureSHA256Matched':True,'sourceSHA256':source['sha256'],'ownDatabaseFiles':len(set(row['dbFile'] for row in native_raw['connections'].values())),'allOwnedConnectionsClosed':True,'networkOrExistingServiceAccess':False,'practiceOrLearnerSourceModified':False})
    models_path=OUT/'models.json';models=json.loads(models_path.read_text()) if models_path.exists() else {}
    execution={'checks':checks,'facts':facts,'models':models}
    assert len(checks)==len(set(checks))==len(facts)
    if args.freeze:
        assert len(models)==6 and all(model['executed'] is False for model in models.values()),'wait for six main-authored unexecuted models before freeze'
        EXPECTED.parent.mkdir(exist_ok=True)
        with EXPECTED.open('x') as stream:stream.write(json.dumps(execution,ensure_ascii=False,indent=2)+'\n')
    elif not args.probe:
        assert execution==json.loads(EXPECTED.read_text()),'whole actual execution differs from frozen baseline'
    write_json(OUT/('probe-execution.json' if args.probe else 'execution.json'),execution)
    write_json(OUT/'fixture-manifest.json',{'files':fixture,'runnerSHA256':sha(__file__)})
    raw['sqliteRaw']=str(RUN/'raw-sqlite.json');raw['completed']=True;raw['actualCheckCount']=len(checks)
    print(('PROBE_COMPLETE' if args.probe else 'FULL_EXECUTION_MATCH')+f'; actual unique native CHECKs={len(checks)}; SQLite translation only; models={len(models)} remain unexecuted',flush=True)
finally:
    raw['checksReached']=checks
    if (RUN/'raw-sqlite.json').exists():raw['sqlite']=json.loads((RUN/'raw-sqlite.json').read_text())
    write_json(RUN/'runtime.json',raw);write_json(OUT/'runtime-last.json',raw)
    write_json(OUT/'run-status.json',{'mode':MODE,'run':str(RUN),'completed':raw['completed'],'actualUniqueCheckCount':len(set(checks)),'checksReached':len(checks),'freeze':args.freeze})
    for name in ['sqlite-probe.log','observed.json','raw-sqlite.json']:
        if (RUN/name).exists():shutil.copyfile(RUN/name,RECORDS/name)
