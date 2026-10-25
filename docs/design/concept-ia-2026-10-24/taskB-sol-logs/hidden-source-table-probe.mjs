import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from '../../../../tools/site/node_modules/jsdom/lib/api.js';
const results=[];
for(const file of fs.readdirSync('docs/knowledge').filter(f=>f.endsWith('.html'))){
 const html=fs.readFileSync('docs/knowledge/'+file,'utf8');if(!html.includes('class="version-original"'))continue;
 const dom=new JSDOM(html,{url:'https://learn.example/docs/knowledge/'+file+'?read=1',runScripts:'outside-only'}),d=dom.window.document;
 const css=d.createElement('style');css.textContent=fs.readFileSync('tools/site/knowledge-reader.css','utf8');d.head.append(css);
 dom.window.eval(fs.readFileSync('tools/site/knowledge-reader.js','utf8'));d.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
 for(const node of d.querySelectorAll('.knowledge-reader-original .version-original'))results.push({file,open:node.open,summary:node.querySelector('summary').textContent,display:dom.window.getComputedStyle(node.querySelector('summary')).display,tableRows:node.querySelectorAll('table tr').length});
 dom.window.close();
}
const out='docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt3/';fs.writeFileSync(out+'hidden-source-tables.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
assert.ok(results.length>0);assert.ok(results.every(x=>x.open||x.display!=='none'),'닫힌 원문 표의 펼치기 summary가 숨겨짐');
