import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

test('시나리오 난이도는 해시·뒤로 가기·키보드로 실제 목록을 전환한다', () => {
  const source=fs.readFileSync(new URL('./learning-journey.mjs',import.meta.url),'utf8');
  const script=source.slice(source.indexOf('  (() => {'),source.lastIndexOf('  </script>'));
  const dom=new JSDOM(`<main><section class="learning-journey"><input data-journey-search><select data-journey-method><option value="all">전체</option></select><p data-journey-result></p><input data-visual-search-input><p data-visual-result></p><div class="visual-grade-filter">${['all','basic','intermediate','advanced'].map(g=>`<button data-visual-filter="${g}">${g}</button>`).join('')}</div><details class="visual-chapter"><a class="visual-stage-card" data-visual-grade="basic" data-visual-search="test">기초</a><a class="visual-stage-card" data-visual-grade="advanced" data-visual-search="test">고급</a></details></section></main>`,{url:'https://example.test/scenario/README.html#visual-grade-basic',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;win.eval(script);
  const cards=[...doc.querySelectorAll('.visual-stage-card')],buttons=[...doc.querySelectorAll('[data-visual-filter]')];
  assert.deepEqual(cards.map(c=>c.hidden),[false,true]);
  buttons[1].dispatchEvent(new win.KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));
  assert.equal(win.location.hash,'#visual-grade-advanced');
  assert.equal(doc.activeElement,buttons[3]);assert.deepEqual(cards.map(c=>c.hidden),[true,false]);
  win.history.replaceState({},'','#visual-grade-all');win.dispatchEvent(new win.PopStateEvent('popstate'));
  assert.deepEqual(cards.map(c=>c.hidden),[false,false]);assert.equal(buttons[0].getAttribute('aria-pressed'),'true');
  win.close();
});
