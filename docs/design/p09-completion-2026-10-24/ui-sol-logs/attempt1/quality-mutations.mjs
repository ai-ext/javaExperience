import fs from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root='LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night';
const out=process.env.REVIEW_OUT || root+'/docs/design/p09-completion-2026-10-24/ui-sol-logs/attempt1';
const require=createRequire(root+'/tools/site/package.json');
const {build}=require('esbuild');
const {P09_LESSONS}=await import(root+'/tools/site/p09-lesson-data.mjs');
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const controller=read('tools/site/p09-learning.js');
const contract=fs.readFileSync(process.env.CONTRACT_SNAPSHOT || out+'/audited-test-p09-boundaries.mjs.txt','utf8');
const results=[];
async function run(name,changeController=s=>s,changeData=d=>d){
 const data=changeData(structuredClone(P09_LESSONS));
 const result=await build({stdin:{contents:changeController(controller),resolveDir:root+'/tools/site',sourcefile:'p09-learning.js',loader:'js'},write:false,bundle:true,format:'iife',platform:'browser',target:'es2022',plugins:[{name:'isolated-data',setup(b){b.onLoad({filter:/p09-lesson-data\.mjs$/},()=>({contents:'export const P09_LESSONS = '+JSON.stringify(data)+';',loader:'js'}));}}]});
 const code=contract
  .replace("import { JSDOM } from 'jsdom';",`import { JSDOM } from ${JSON.stringify('file://'+root+'/tools/site/node_modules/jsdom/lib/api.js')};`)
  .replace("import { P09_LESSONS } from './p09-lesson-data.mjs';",'const P09_LESSONS = '+JSON.stringify(data)+';')
  .replace("import { P09_ASSETS } from './p09-assets.mjs';",`import { P09_ASSETS } from ${JSON.stringify('file://'+root+'/tools/site/p09-assets.mjs')};`)
  .replace("const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');",'const root = '+JSON.stringify(root)+';')
  .replace("const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');",'const read = file => file === "tools/site/p09-learning.bundle.js" ? '+JSON.stringify(result.outputFiles[0].text)+' : fs.readFileSync(path.join(root,file),"utf8");')
  +'\n// isolated mutation '+name;
 try{await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));results.push({name,outcome:'SURVIVED'});}
 catch(e){results.push({name,outcome:'KILLED',errorName:e.name,message:e.message.split('\n')[0].replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g,'[isolated-data-module]').slice(0,500)});}
 console.log(JSON.stringify(results.at(-1)));
}
await run('baseline');
await run('remove-generation-guard',s=>s.replace('requestedGeneration === renderGeneration && requestId === copyRequestId','requestId === copyRequestId'));
await run('remove-request-id-guard',s=>s.replace('requestedGeneration === renderGeneration && requestId === copyRequestId','requestedGeneration === renderGeneration'));
await run('remove-catch-stale-guard',s=>s.replace('catch { if (!isCurrentRequest()) return; const range','catch { const range'));
await run('remove-success-stale-guard',s=>s.replace("if (isCurrentRequest()) $('[data-p09-copy-status]').textContent", "$('[data-p09-copy-status]').textContent"));
await run('corrupt-fixed-marker-literal',s=>s,d=>{const s=d.find(l=>l.id==='varargs-selection').stages.find(s=>s.id==='choose-fixed');s.code=s.code.replace('fixed(int,int)','fixed(int, int)');return d;});
await run('corrupt-derived-array-length',s=>s,d=>{const s=d.find(l=>l.id==='varargs-selection').stages.find(s=>s.id==='sum-items');s.values.find(([key])=>key==='배열 길이')[1]='99';return d;});
await run('corrupt-derived-array-elements',s=>s,d=>{const s=d.find(l=>l.id==='varargs-selection').stages.find(s=>s.id==='sum-array');s.values.find(([key])=>key==='values 배열 원소')[1]='[40, 60]';return d;});
fs.writeFileSync(out+'/quality-mutations.json',JSON.stringify(results,null,2)+'\n');
assert.equal(results.find(r=>r.name==='baseline').outcome,'SURVIVED');
