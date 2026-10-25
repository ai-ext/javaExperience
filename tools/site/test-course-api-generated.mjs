import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';
import {COURSE_API_CONTRACTS} from './course-api-contracts.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
let tools=0;
for(let day=0;day<=45;day++){
  const id='D'+String(day).padStart(2,'0');
  const d=new JSDOM(fs.readFileSync(path.join(root,'course/spring/'+id+'.html'),'utf8'));
  assert.equal(d.window.document.documentElement.dataset.theme,'dark',id);
  const expected=new Set(COURSE_API_CONTRACTS.filter(c=>c.stepId.startsWith(id+'-')).map(c=>c.stepId));
  const panels=[...d.window.document.querySelectorAll('[data-ca-root]')];
  assert.equal(d.window.document.querySelectorAll('[data-cpv-root]').length,id==='D04'?1:0,id+': 서비스 설명에만 객체/DB 비교 제공');
  assert.equal(panels.length,expected.size,id+': 필요한 순서에서만 도구 제공');
  for(const p of panels){
    const config=JSON.parse(p.querySelector('[data-ca-data]').textContent);
    assert.ok(expected.has(config.stepId));
    assert.equal(p.closest('.day-step').id,'step-'+config.stepId.toLowerCase());
    assert.equal(p.querySelector('[data-ca-send]').disabled,true);
    assert.equal(p.querySelector('[data-ca-status]').textContent,'미실행');
    assert.equal(p.querySelectorAll('.step-check').length,0);
    tools++;
  }
  if(expected.size){
    const scripts=[...d.window.document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
    assert.ok(scripts.some(s=>s.includes('course-api.bundle.js')));
    assert.ok(d.window.document.querySelector('link[href*="course-api-workspace.css"]'));
  }
  d.window.close();
}
assert.equal(tools,5);
for(const p of ['index.html','scenario/README.html','practice/MISSIONS.html','docs/knowledge/README.html','docs/knowledge/P16-json-jackson-practical.html']){
  const d=new JSDOM(fs.readFileSync(path.join(root,p),'utf8'));
  assert.equal(d.window.document.documentElement.dataset.theme,'dark',p);d.window.close();
}
const theme=fs.readFileSync(path.join(root,'tools/site/site-theme.css'),'utf8');
assert.match(theme,/color-scheme:\s*dark/);assert.doesNotMatch(theme,/prefers-color-scheme|color-scheme:\s*light/);
console.log('v2 API8개를5개순서에연결,46일페이지·대표5페이지 다크·비전송초기상태 확인');
