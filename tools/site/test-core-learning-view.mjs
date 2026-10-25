import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadCoreLearning } from './core-learning-data.mjs';
import { renderCoreLearning } from './core-learning.mjs';
import { initCoreLearning } from './core-learning.js';

const root = new URL('../../', import.meta.url).pathname;
const data = loadCoreLearning(root);
const html = renderCoreLearning(root);
assert.match(html, /<section[^>]+data-core-learning/);
assert.match(html, /data-core-payload/);
assert.ok(html.includes('&quot;민수&quot;'));
assert.match(html, /<noscript>/);
assert.doesNotMatch(html, /이번에 배울 개념/);
assert.match(html, /단계 버튼은 설명을 재생/);
assert.match(html, /설명 재생/);
assert.match(html, /원문 절 링크를 열어 기존 문서를 읽어/);

const dom = new JSDOM(html, { url: 'https://learn.example/lessons/concept-core.html' });
const doc = dom.window.document;
const payload = JSON.parse(doc.querySelector('[data-core-payload]').textContent);
assert.equal(payload.units.length, 6);
assert.deepEqual([...doc.querySelectorAll('[data-core-unit]')].map(button => button.dataset.coreUnit), data.units.map(unit => unit.id));
assert.equal(doc.querySelectorAll('[data-core-unit]').length, 6);
assert.equal(doc.querySelectorAll('main').length, 0, 'renderer fragment must not nest the site main landmark');
assert.equal(doc.querySelector('.core-learning-header h1').textContent, 'Java · Spring Boot 필수 기초');
assert.equal(doc.querySelector('.core-learning-header .core-learning-lede'), null);
assert.equal(doc.querySelector('.core-learning-header').children.length, 3);
assert.equal(doc.querySelector('.core-learning-sidebar ol').nextElementSibling.matches('.core-prerequisites'), true);
assert.equal(doc.querySelector('.core-unit-heading [data-core-prerequisites]'), null);
assert.equal(doc.querySelector('.core-observation [data-core-runtime]').textContent.includes(data.runtime.java), true);
assert.equal(doc.querySelector('.core-stage-mode').textContent, '설명 재생');
assert.equal(doc.querySelectorAll('.core-stage-columns > section').length, 2);
assert.equal(doc.querySelector('.core-code-section h4').textContent, '핵심 코드 요약');
assert.equal(doc.querySelector('[data-core-runtime]').textContent.includes(data.runtime.java), true);
assert.equal(doc.querySelector('[data-core-runtime]').textContent.includes(data.runtime.boot), true);
assert.equal(doc.querySelector('[data-core-runtime]').textContent.includes(data.runtime.framework), true);
assert.equal(doc.querySelector('[data-core-runtime]').textContent.includes(data.runtime.lombokJar), true);
assert.equal(doc.querySelector('[data-core-code-link]').getAttribute('href'), data.codeHref);
assert.equal(doc.querySelector('[data-core-execution-link]').getAttribute('href'), data.executionHref);
assert.equal(doc.querySelector('[data-core-research-link]').getAttribute('href'), data.researchHref);
assert.equal(doc.querySelectorAll('[data-core-stage-nav] button').length, 0);

for (const unit of data.units) {
  for (let step = 1; step <= 3; step++) {
    const state = new JSDOM(html, {
      url: `https://learn.example/lessons/concept-core.html?unit=${unit.id}&step=${step}`,
    });
    initCoreLearning(state.window.document, state.window);
    const $ = name => state.window.document.querySelector(`[data-core-${name}]`);
    const current = unit.stages[step - 1];
    assert.equal($('title').textContent, unit.title, `${unit.id}/${step} title`);
    assert.equal($('definition').textContent, unit.definition, `${unit.id}/${step} definition`);
    assert.equal($('scenario').textContent, unit.scenario, `${unit.id}/${step} scenario`);
    assert.equal($('stage-title').textContent, current.title, `${unit.id}/${step} stage title`);
    assert.equal($('stage-description').textContent, current.explanation, `${unit.id}/${step} explanation`);
    assert.equal(state.window.document.querySelector('#core-comparison-title').textContent, current.comparisonTitle ?? '상태 비교');
    assert.deepEqual([...state.window.document.querySelectorAll('.core-comparison thead th')].map(cell => cell.textContent), current.columns ?? ['대상', '비교 A', '비교 B']);
    assert.equal($('code').textContent, current.code, `${unit.id}/${step} code`);
    assert.equal($('rows').querySelectorAll('tr').length, current.rows.length, `${unit.id}/${step} rows`);
    assert.deepEqual([...$('rows').querySelectorAll('tr')].map(row => [...row.cells].map(cell => cell.textContent)), current.rows, `${unit.id}/${step} comparison`);
    assert.equal($('counter').textContent, `${step} / 3`, `${unit.id}/${step} counter`);
    assert.deepEqual([...$('observations').children].map(node => node.textContent), unit.observations.map(({ key, value }) => `${key}: ${value}`));
    assert.equal($('limit').textContent, unit.limit, `${unit.id}/${step} visible limit`);
    assert.equal($('originals').querySelectorAll('a').length, unit.sourceLinks.length);
    assert.deepEqual([...$('originals').querySelectorAll('a')].map(anchor => anchor.getAttribute('href')), unit.sourceLinks.map(source => source.href));
    assert.equal($('sources').querySelectorAll('a').length, unit.officialSources.length);
    assert.deepEqual([...$('sources').querySelectorAll('a')].map(anchor => anchor.getAttribute('href')), unit.officialSources.map(source => source.url));
    assert.deepEqual([...$('prerequisites').querySelectorAll('a')].map(anchor => anchor.textContent.split(' ')[0]), unit.prerequisites);
    if (unit.id === 'C04') assert.equal($('prerequisites').textContent.includes('C05'), false);
    assert.equal($('stage-nav').querySelectorAll('button').length, 3);
    assert.equal(state.window.document.querySelectorAll('button:not([type])').length, 0);
    state.window.close();
  }
}

const transition = new JSDOM(html, { url: 'https://learn.example/lessons/concept-core.html' });
initCoreLearning(transition.window.document, transition.window);
transition.window.document.querySelector('[data-core-unit="C03"]').click();
transition.window.document.querySelector('[data-core-step="2"]').click();
assert.equal(transition.window.document.querySelector('#core-comparison-title').textContent, '애노테이션 처리 주체와 시점');
assert.deepEqual([...transition.window.document.querySelectorAll('.core-comparison thead th')].map(cell => cell.textContent), ['처리 시점', '표식·대상', '처리 주체와 역할']);
transition.window.document.querySelector('[data-core-unit="C02"]').click();
assert.equal(transition.window.document.querySelector('#core-comparison-title').textContent, '상태 비교');
assert.deepEqual([...transition.window.document.querySelectorAll('.core-comparison thead th')].map(cell => cell.textContent), ['대상', '비교 A', '비교 B']);
transition.window.close();

const xss = JSON.stringify({ korean: '한글', text: '</script><img src=x onerror=alert(1)>' }).replace(/</g, '\\u003c');
assert.equal(xss.includes('</script>'), false);
assert.equal(JSON.parse(xss).text, '</script><img src=x onerror=alert(1)>');
dom.window.close();
console.log('core learning view: six units × three URL states, renderer slots, evidence, source links and script escaping passed');
