#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './browser.mjs';
import { inspectDom } from './inspect.mjs';
import { interactionTargets } from './states.mjs';
const args = process.argv.slice(2);
const opt = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = path.resolve(opt('--root', fileURLToPath(new URL('../../../', import.meta.url))));
const out = path.resolve(opt('--out', path.join(os.tmpdir(), 'javaexperience-contrast')));
const quick = args.includes('--quick');
const representatives = ['index.html','course/README.html','course/spring/D01.html','course/spring/D05.html','course/spring/D11.html','course/java/J01.html','course/tickets/B01.html','scenario/ch0-first-steps/0-1-ts-to-java.html','scenario/ch1-create-post/1-1-receive-request.html','scenario/ch1-create-post/1-5-validation.html','scenario/ch10-project/10-4-login-jwt.html','scenario/labs/l12-query-methods/README.html','docs/knowledge/P02-mvc-layered-architecture.html'];
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.name.startsWith('.') || e.name === 'node_modules' ? [] : e.isDirectory() ? walk(path.join(dir,e.name)) : e.name.endsWith('.html') ? [path.relative(root,path.join(dir,e.name))] : []);
const discover = () => (quick ? representatives : walk(root).sort()).filter(file => !opt('--match','') || new RegExp(opt('--match','')).test(file)).slice(0, Number(opt('--limit', '0')) || undefined);
const result = { viewport:{width:1440,height:900}, startedAt:new Date().toISOString(), pages:0, states:0, textNodes:0, controlEdges:0, findings:[], errors:[], coverage:{html:[],stateTypes:{}} };
let server, browser;
let files = [];
const found = new Map();
async function main() {
  const { chromium } = loadPlaywright();
  files = discover();
  if (!files.length) throw new Error('검사할 HTML이 없습니다. --root와 --match를 확인하세요.');
  fs.mkdirSync(out, {recursive:true});
  const externalBase = process.env.SITE_BASE_URL;
  if (!externalBase) server = http.createServer((req,res) => {
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname)); } catch { res.writeHead(400).end(); return; }
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  if (server) await new Promise((resolve,reject) => { server.once('error',reject); server.listen(0,'127.0.0.1',resolve); });
  const base = externalBase ? externalBase.replace(/\/$/, '') + '/' : `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({headless:true});
  let cursor = 0;
  async function worker() {
    const page = await browser.newPage({viewport:result.viewport, colorScheme:'light'});
    while (cursor < files.length) {
      const rel = files[cursor++];
      try {
        await page.goto(base + rel.split(path.sep).map(encodeURIComponent).join('/'), {waitUntil:'load',timeout:30000});
        if (await page.locator('pre.mermaid').count()) await page.waitForFunction(() => [...document.querySelectorAll('pre.mermaid')].every(e=>e.querySelector('svg')), null, {timeout:15000});
        const scan = async state => {
          const r = await page.evaluate(inspectDom,args.includes('--icons-only')?{state,iconsOnly:true}:state);
          result.states++; result.textNodes += r.nodes; result.controlEdges += r.edges;
          const type = state.split(':')[0]; result.coverage.stateTypes[type] = (result.coverage.stateTypes[type] || 0) + 1;
          for (const f of r.findings) {
            f.page = rel;
            const key = [rel,f.kind,f.selector,f.text,f.color,f.background,f.threshold].join('|');
            const old = found.get(key);
            if (old) { old.observations++; if(!old.states.includes(state)) old.states.push(state); }
            else { f.observations=1; f.states=[state]; found.set(key,f); result.findings.push(f); }
          }
        };
        await scan('default');
        await page.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=true));
        await scan('details-open');
        const controls = await page.locator('button,[role="tab"],input[type="radio"]').evaluateAll(es=>es.map((e,i)=>({i,key:[...e.attributes].map(a=>a.name).find(x=>/^data-.*(go|select|format|scene|stage|step|expand|tab|view|mode)$/.test(x)) || (e.getAttribute('role')==='tab'?'tab':e.hasAttribute('aria-pressed')?'pressed':e.textContent.includes('모두 펼쳐')?'expand':null)})).filter(x=>x.key));
        for (const c of controls) {
          await page.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=true));
          await page.evaluate(i=>document.querySelectorAll('button,[role="tab"],input[type="radio"]')[i]?.click(),c.i);
          await scan(`${c.key}:${c.i}`);
        }
        await page.evaluate(()=>document.querySelectorAll('details').forEach(e=>e.open=true));
        const targets = await page.evaluate(interactionTargets);
        for (const t of targets) {
          const target = page.locator(`[data-contrast-interaction~="${t.id}"]`).first();
          await page.mouse.move(0,0);
          await page.evaluate(()=>document.activeElement?.blur());
          if (t.type === 'hover') await target.hover({force:true,timeout:1500});
          else { await page.keyboard.press('Tab'); await target.focus({timeout:1500}); }
          await scan(`${t.type}:${t.selector}`);
        }
        await page.mouse.move(0,0);
        for (let i=0;i<5;i++) { await page.keyboard.press('Tab'); await scan(`keyboard-tab:${i}`); }
        result.pages++; result.coverage.html.push(rel);
        if (result.pages % 25 === 0 || quick) { console.log(`pages=${result.pages}/${files.length} states=${result.states} findings=${result.findings.length} ${rel}`); fs.writeFileSync(path.join(out,'progress.json'),JSON.stringify(result,null,2)); }
      } catch(e) { result.errors.push({page:rel,error:e.message}); console.error(rel, e.message.slice(0,180)); }
    }
    await page.close();
  }
  const workers=Number(opt('--workers','3'));
  if(!Number.isInteger(workers)||workers<1)throw new Error('--workers는 1 이상의 정수여야 합니다.');
  await Promise.all(Array.from({length:workers},worker));
  result.finishedAt = new Date().toISOString();
  result.summary = { severe: result.findings.filter(f=>f.ratio<1.5).length, below3:result.findings.filter(f=>f.ratio<3).length, text:result.findings.filter(f=>['text','code','placeholder'].includes(f.kind)).length, border:result.findings.filter(f=>f.kind==='border').length, svg:result.findings.filter(f=>f.kind==='svg').length, errors:result.errors.length };
  fs.writeFileSync(path.join(out,'contrast-results.json'),JSON.stringify(result,null,2));
  fs.rmSync(path.join(out,'progress.json'),{force:true});
  console.log(JSON.stringify({pages:result.pages,states:result.states,...result.summary}));
  process.exitCode = result.errors.length ? 2 : result.findings.length ? 1 : 0;
}
try { await main(); } catch(e) { console.error(e.message); process.exitCode=2; }
finally { await browser?.close(); if(server) await new Promise(resolve=>server.close(resolve)); }
