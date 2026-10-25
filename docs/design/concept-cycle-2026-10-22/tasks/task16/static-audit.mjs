import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),out=path.join(root,'docs/design/concept-cycle-2026-10-22/tasks/task16');
const {JSDOM}=await import(pathToFileURL(path.join(root,'tools/site/node_modules/jsdom/lib/api.js')));
const {D02_LESSONS,D02_ASSETS,D02_RUNS}=await import(pathToFileURL(path.join(root,'tools/site/d02-lesson-data.mjs')));
const {rasterDimensions}=await import(pathToFileURL(path.join(root,'tools/site/raster-size.mjs')));
const base='docs/design/d02-2026-10-20/',read=p=>fs.readFileSync(path.join(root,p),'utf8'),load=p=>JSON.parse(read(p));
const page=new JSDOM(read('docs/knowledge/D02-server-network-basics.html'));
const doc=page.window.document,stages=D02_LESSONS.flatMap(l=>l.stages);
const observations=load(base+'browser-observations.json').observations;
const errors=[];
for(const obs of observations){
 const s=stages.find(x=>x.id===obs.stage);
 for(const [field,actual] of [['code',obs.code],['title',obs.title],['values',obs.values]])if(JSON.stringify(s[field])!==JSON.stringify(actual))errors.push({stage:obs.stage,mode:obs.mode,field});
}
const captureNames=['desktop-url.jpg','mobile-proxy.jpg','desktop-transport.jpg'];
const captures=captureNames.map(name=>{const p=base+'captures/'+name,raw=fs.readFileSync(path.join(root,p));return{path:p,jpegHeader:raw[0]===255&&raw[1]===216,dimensions:rasterDimensions(raw),sha256:crypto.createHash('sha256').update(raw).digest('hex'),historicalViewport:name.startsWith('mobile')?{width:360,height:800}:{width:1672,height:941},note:'full-page capture dimensions are not viewport height'};});
const result={checkedAtUTC:new Date().toISOString(),mode:'static files and JSDOM read only; no browser/network/Java/DB',documentId:'D02',lessons:D02_LESSONS.length,stages:stages.length,stageIds:stages.map(s=>s.id),historicalObservations:observations.length,historicalObservationMismatch:errors,html:{originalOpen:doc.querySelector('#d02-original').open,legacyOpen:doc.querySelector('.d02-legacy').open,sourceIds:[...doc.querySelectorAll('#d02-original [id]')].map(n=>n.id),rootHeading:doc.querySelector('[data-d02-question]').textContent,rootSelectOptions:[...doc.querySelectorAll('[data-d02-topic] option')].map(n=>n.textContent),rootImage:doc.querySelector('[data-d02-image]').getAttribute('src')},selectedImages:Object.values(D02_ASSETS).map(a=>{const p=base+'images/'+a.file,raw=fs.readFileSync(path.join(root,p));return{path:p,jpegHeader:raw[0]===255&&raw[1]===216,dimensions:rasterDimensions(raw),matchesDeclared:rasterDimensions(raw).width===a.width&&rasterDimensions(raw).height===a.height};}),captures,checks:D02_RUNS.checks.length,models:Object.keys(D02_RUNS.models),frozenMatch:JSON.stringify(D02_RUNS)===JSON.stringify(load(base+'source-proof/execution.json'))};
fs.writeFileSync(path.join(out,'static-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));page.window.close();
