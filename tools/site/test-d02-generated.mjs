import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';
import {D02_ASSETS,D02_LESSONS,D02_RUNS,d02Run} from './d02-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),base=JSON.parse(read('docs/design/d02-2026-10-20/html-baseline.json'));
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/D02-server-network-basics.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/D02-server-network-basics.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/D02-server-network-basics.html'}),d=page.window.document;
const source=d.querySelector('#d02-original'),clone=source.cloneNode(true);clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);assert.deepEqual([...source.querySelectorAll('.mermaid')].map(n=>n.textContent),base.mermaid);clone.querySelectorAll('.mermaid').forEach(n=>n.remove());assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.withoutMermaidText);
for(const id of base.ids)assert.ok(d.getElementById(id));assert.deepEqual([...d.querySelectorAll('.d02-legacy>.knowledge-page-map')].map(n=>n.outerHTML),base.oldVisual);const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
const selected=JSON.parse(read('docs/design/d02-2026-10-20/image-records.json')).images.filter(image=>image.selected);assert.equal(selected.length,10);
const tlsRepair=JSON.parse(read('docs/design/concept-cycle-2026-10-24/minor-repairs/image-record.json'));
assert.equal(tlsRepair.destination,'docs/design/d02-2026-10-20/images/tls-v2.jpg');
assert.equal(tlsRepair.sha256,'aabf8192c948cecd4342aa7aabad958852f63a36267c828eb5920f34a8b9f14c');
const tlsBytes=fs.readFileSync(new URL(tlsRepair.destination,root));assert.equal(crypto.createHash('sha256').update(tlsBytes).digest('hex'),tlsRepair.sha256);
assert.equal(D02_ASSETS['D02-tls'].file,'tls-v2.jpg','TLS 자산은 승인된 JPG 교정본을 가리킨다');
for(const asset of Object.values(D02_ASSETS)){
 assert.equal(asset.ready,true);const raw=fs.readFileSync(new URL('docs/design/d02-2026-10-20/images/'+asset.file,root));assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);if(asset.file==='tls-v2.jpg')assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),tlsRepair.sha256);else assert.ok(selected.some(image=>image.destination.endsWith('/'+asset.file)&&image.sha256===crypto.createHash('sha256').update(raw).digest('hex')));
 for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="d02-learning.bundle.js"]'));page.window.eval(read('tools/site/d02-learning.bundle.js'));const ui=d.querySelector('[data-d02-learning]');
for(const lesson of D02_LESSONS){const topic=ui.querySelector('[data-d02-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));for(const stage of lesson.stages){ui.querySelector(`[data-d02-stage="${stage.id}"]`).click();assert.equal(ui.querySelector('[data-d02-code]').textContent,stage.code);assert.equal(ui.querySelector('[data-d02-title]').textContent,stage.title);assert.equal(ui.querySelector('[data-d02-output]').open,false);for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-d02-runs]').textContent.includes(JSON.stringify(d02Run(key),null,2)));}}
const actual=JSON.parse(read('docs/design/d02-2026-10-20/source-proof/execution.json'));
assert.deepEqual(D02_RUNS,actual);assert.equal(actual.checks.length,17);assert.equal(Object.keys(actual.models).length,3);
assert.deepEqual(actual,JSON.parse(read('docs/design/d02-2026-10-20/source-proof/checkpoints/expected-execution.json')));
const python=String.raw`import ast, http.server, json, pathlib, sys
source=pathlib.Path(sys.argv[1]).read_text()
tree=ast.parse(source)
proxy=next(node for node in ast.walk(tree) if isinstance(node,ast.ClassDef) and node.name=='Proxy')
handler=next(node for node in proxy.body if isinstance(node,ast.FunctionDef) and node.name=='do_GET')
completed=[]
def upstream(*args): raise RuntimeError('upstream failed before response')
namespace={'http':http,'proxy_requests':completed,'http_get':upstream,'port':1}
exec(compile(ast.Module(body=[proxy],type_ignores=[]),'run-proof.py','exec'),namespace)
class Fake:
 path='/api/probe'
 class Headers:
  def get(self,*args): return 'on'
 headers=Headers()
entered=0
try:
 entered+=1
 namespace['Proxy'].do_GET(Fake())
except RuntimeError: pass
print(json.dumps({'handlerEntries':entered,'completedProxyRequestsAdded':len(completed)}))`;
const simulated=JSON.parse(execFileSync('python3',['-c',python,fileURLToPath(new URL('docs/design/d02-2026-10-20/source-proof/run-proof.py',root))],{encoding:'utf8'}));assert.deepEqual(simulated,{handlerEntries:1,completedProxyRequestsAdded:0},'AST-분리 실행에서 upstream 예외는 handler 진입 뒤 완료 proxy 기록 전에 난다');
assert.deepEqual([...new Set(D02_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),actual.checks);
const supplement=d.querySelector('.d02-supplement');assert.ok(supplement);
for(const phrase of ['Java21','TLS','UDP','0600']){assert.ok(supplement.textContent.includes(phrase),phrase);}
for(const file of ['source-proof/source.json','source-proof/execution.json','source-proof/independent-replay.json','research/main-verification.json'])assert.ok([...supplement.querySelectorAll('pre code')].some(n=>{try{return JSON.stringify(JSON.parse(n.textContent))===JSON.stringify(JSON.parse(read('docs/design/d02-2026-10-20/'+file)));}catch{return false;}}),file);
assert.equal(D02_LESSONS.length,10);assert.equal(D02_LESSONS.flatMap(l=>l.stages).length,27);page.window.close();console.log(`D02 생성HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/Mermaid${base.mermaid.length}/id${base.ids.length}/map1·27상태·10JPG·17관측/3모델 보존 통과`);
