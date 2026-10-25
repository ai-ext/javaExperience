import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const modules = [
  ['p04', 'P04'], ['p16-contract', 'P16Contract'], ['w09', 'W09'],
  ['p19', 'P19'], ['p20', 'P20'], ['s09', 'S09'], ['s08', 'S08'],
  ['r03', 'R03'], ['w15', 'W15'], ['v04', 'V04'], ['b01', 'B01'],
  ...Array.from({ length: 10 }, (_, i) => [`d${String(i + 1).padStart(2, '0')}`, `D${String(i + 1).padStart(2, '0')}`]),
];

const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

for (const [prefix, exportName] of modules) {
  const renderer = await import(`./${prefix}-learning.mjs`);
  const initializer = await import(`./${prefix}-learning.js`);
  const render = renderer[`render${exportName}Learning`];
  const init = initializer[`init${exportName}Learning`];
  assert.equal(typeof render, 'function', `${prefix}: renderer export`);
  assert.equal(typeof init, 'function', `${prefix}: initializer export`);

  function setup() {
    const page = new JSDOM(`${render()}<details id="${prefix}-original"><summary>원문</summary><details><summary>legacy</summary><a href="#old">old</a></details></details>`, {
      runScripts: 'outside-only', url: `https://learn.example/${prefix}.html`, pretendToBeVisual: true,
    });
    const { window: win } = page, doc = win.document;
    win.matchMedia = () => ({ matches: false, addEventListener() {} });
    win.HTMLElement.prototype.scrollIntoView = () => {};
    const requests = [];
    Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: {
      writeText(text) { const request = deferred(); requests.push({ text, ...request }); return request.promise; },
    } });
    init(doc, win);
    const $ = selector => doc.querySelector(`[data-${prefix}-${selector}]`);
    assert.ok($('copy'), `${prefix}: copy control`);
    assert.ok($('next') && !$('next').disabled, `${prefix}: at least two stages`);
    const text = () => $('code').textContent;
    return { page, win, doc, $, requests, text };
  }

  // 같은 상태에서 성공하면 클릭 당시 코드가 복사되고 성공 안내가 보인다.
  {
    const f = setup(), initialCode = f.text();
    f.$('copy').click();
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].text, initialCode);
    f.requests[0].resolve(); await tick();
    assert.equal(f.$('copy-status').textContent, '코드를 복사했습니다.');
    f.page.window.close();
  }

  // 같은 상태에서 거절되면 현재 코드 선택과 fallback 안내를 제공한다.
  {
    const f = setup(), currentCode = f.text();
    f.$('copy').click();
    f.requests[0].reject(new Error('clipboard unavailable')); await tick();
    assert.equal(f.win.getSelection().toString(), currentCode);
    assert.equal(f.$('copy-status').textContent, '코드를 선택했습니다. 복사 키를 눌러 주세요.');
    f.page.window.close();
  }

  // 장면 변경 뒤 늦은 성공은 새 장면의 안내를 만들지 않는다.
  {
    const f = setup();
    f.$('copy').click(); f.$('next').click();
    const nextCode = f.text();
    f.requests[0].resolve(); await tick();
    assert.equal(f.$('copy-status').textContent, '');
    assert.equal(f.text(), nextCode);
    f.page.window.close();
  }

  // 장면 변경 뒤 늦은 거절은 새 장면을 선택하거나 안내하지 않는다.
  {
    const f = setup();
    f.$('copy').click(); f.$('next').click();
    const nextCode = f.text();
    f.requests[0].reject(new Error('clipboard unavailable')); await tick();
    assert.equal(f.$('copy-status').textContent, '');
    assert.equal(f.win.getSelection().toString(), '');
    assert.equal(f.text(), nextCode);
    f.page.window.close();
  }

  // A→B→A로 돌아와도 첫 A 요청의 지연 성공은 현재 상태에 반영되지 않는다.
  {
    const f = setup();
    f.$('copy').click(); f.$('next').click(); f.$('prev').click();
    f.requests[0].resolve(); await tick();
    assert.equal(f.$('copy-status').textContent, '');
    assert.equal(f.win.getSelection().toString(), '');
    f.page.window.close();
  }

  // 같은 장면의 최신 요청만 유효하다. 오래된 거절은 최신 성공을 덮지 않는다.
  {
    const f = setup(), currentCode = f.text();
    f.$('copy').click(); f.$('copy').click();
    assert.equal(f.requests.length, 2);
    assert.ok(f.requests.every(request => request.text === currentCode));
    f.requests[1].resolve(); await tick();
    assert.equal(f.$('copy-status').textContent, '코드를 복사했습니다.');
    f.requests[0].reject(new Error('older clipboard request')); await tick();
    assert.equal(f.$('copy-status').textContent, '코드를 복사했습니다.');
    assert.equal(f.win.getSelection().toString(), '');
    f.page.window.close();
  }
}

console.log(`PASS ${modules.length} modules × 6 observable clipboard race cases = ${modules.length * 6}`);
