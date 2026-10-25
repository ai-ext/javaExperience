import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {FUNCTIONAL_LIKE_TASKS} from './functional-like-data.mjs';
for(const task of FUNCTIONAL_LIKE_TASKS) {
  const path=new URL('../../'+task.sourcePath.replace(/\.md$/,'.html'),import.meta.url);
  assert.ok(existsSync(path),'실제 좋아요 작업 페이지가 필요합니다: '+path.pathname);
  const html=readFileSync(path,'utf8');const dom=new JSDOM(html);const d=dom.window.document;
  assert.equal(d.querySelector('[data-fw-root]')?.dataset.fwTask,task.id);
  assert.equal(d.querySelectorAll('h1').length,1);
  assert.ok(d.querySelector('[data-home-controller]')?.dataset.homeTask==='flow-'+task.id);
  assert.match(html,/functional-like-workspace\.css/);
  const ids=[...d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
  for(const e of d.querySelectorAll('[aria-labelledby],[aria-controls]'))for(const attr of ['aria-labelledby','aria-controls']) {
    for(const id of (e.getAttribute(attr)||'').split(/\s+/).filter(Boolean))assert.ok(d.getElementById(id),`${task.id} ${attr} ${id}`);
  }
  for(const a of d.querySelectorAll('a[href],link[href],script[src],img[src]')) {
    const raw=a.getAttribute('href')||a.getAttribute('src');if(!raw||/^(?:https?:|#)/.test(raw))continue;
    const target=new URL(raw,path);assert.ok(existsSync(new URL(target.pathname,'file://')),raw);
  }
  dom.window.close();
}
console.log('좋아요 작업2쪽: 실제 경로·자산·ARIA·홈 과제 연결 검사 통과 (native 브라우저/실서버 검증 아님)');
