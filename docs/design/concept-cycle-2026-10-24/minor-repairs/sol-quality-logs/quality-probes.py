import concurrent.futures, json, pathlib, subprocess, sys
root=pathlib.Path('LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night')
logs=root/'docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs'
url=lambda f:(root/f).as_uri()

def hook(controller, old, new, test, count='all'):
    transform=f"source=source.replaceAll({json.dumps(old)},{json.dumps(new)});" if count=='all' else f"const token={json.dumps(old)};const position=source.lastIndexOf(token);if(position<0)throw Error('transform target absent');source=source.slice(0,position)+{json.dumps(new)}+source.slice(position+token.length);"
    return "import {registerHooks} from 'node:module';registerHooks({load(url,context,nextLoad){const result=nextLoad(url,context);if(url==="+json.dumps(url(controller))+"){let source=String(result.source);"+transform+"return {...result,source};}return result;}});await import("+json.dumps(url(test))+");"

old="if (requestScene !== sceneVersion || requestId !== copyRequestId) return;"
cases=[
 ('w11-baseline',f'await import({json.dumps(url("tools/site/test-w11-learning.mjs"))});',0,root),
 ('w11-failure-scene-guard-removed',hook('tools/site/w11-learning.js',old,"if (requestId !== copyRequestId) return;",'tools/site/test-w11-learning.mjs','last'),1,root),
 ('w11-failure-request-guard-removed',hook('tools/site/w11-learning.js',old,"if (requestScene !== sceneVersion) return;",'tools/site/test-w11-learning.mjs','last'),1,root),
 ('p16-dom-mark-removed',hook('tools/site/p16-contract-learning.js',"stage.active.includes(i) ? 'mark' : 'span'","'span'",'tools/site/test-p16-contract-learning.mjs'),1,root),
 ('s09-dom-mark-removed',hook('tools/site/s09-learning.js',"stage.active.includes(i) ? 'mark' : 'span'","'span'",'tools/site/test-s09-learning.mjs'),1,root),
 ('d02-generated-arbitrary-cwd',f'await import({json.dumps(url("tools/site/test-d02-generated.mjs"))});',0,pathlib.Path('/tmp')),
 ('jpg-baseline',f'await import({json.dumps(url("tools/site/test-jpg-migration.mjs"))});',0,root),
]
for name,module,export,selector,mutation in [
 ('p16-active-empty','p16-contract-data.mjs','P16_CONTRACT_LESSONS','data[0].stages[0]','[]'),
 ('p16-active-out-of-range','p16-contract-data.mjs','P16_CONTRACT_LESSONS','data[0].stages[0]','[999]'),
 ('s09-active-out-of-range','s09-lesson-data.mjs','S09_LESSONS','data.flatMap(l=>l.stages).find(s=>s.id==="fetch-join")','[999]')]:
    test='test-p16-contract-learning.mjs' if name.startswith('p16') else 'test-s09-learning.mjs'
    code=f'import {{{export} as data}} from {json.dumps(url("tools/site/"+module))};({selector}).active={mutation};await import({json.dumps(url("tools/site/"+test))});'
    cases.append((name,code,1,root))

if len(sys.argv)>1: cases=[case for case in cases if any(token in case[0] for token in sys.argv[1:])]

def run(case):
    name,code,expected,cwd=case
    process=subprocess.run(['node','--input-type=module','-e',code],cwd=cwd,text=True,capture_output=True)
    (logs/(name+'.log')).write_text(process.stdout+process.stderr)
    return {'name':name,'exitCode':process.returncode,'expectedExit':expected,'matched':process.returncode==expected and (expected==0 or 'AssertionError' in process.stderr),'cwd':str(cwd),'code':code}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(run,cases))
(logs/'quality-probes.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps([{k:v for k,v in row.items() if k!='code'} for row in results],ensure_ascii=False,indent=2))
