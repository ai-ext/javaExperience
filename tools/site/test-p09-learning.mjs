import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

assert.ok(fs.existsSync(new URL('./p09-learning.mjs', import.meta.url)), 'P09 학습 화면이 아직 구현되지 않았다');
const { renderP09Learning } = await import('./p09-learning.mjs');
const { initP09Learning } = await import('./p09-learning.js');
const page = new JSDOM(renderP09Learning(), { url: 'https://learn.example/docs/knowledge/P09-java-syntax-basics.html' });
const win = page.window, doc = win.document;
const $ = (selector) => doc.querySelector(selector);
const text = () => $('[data-p09-state]').textContent;
for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { throw Error('저장 차단'); } });
win.fetch = () => { throw Error('학습 장면은 서버 요청을 실행하지 않는다'); };
win.scrollTo = () => {};
win.HTMLElement.prototype.scrollIntoView = () => {};
win.history.replaceState({ foreign: { keep: true } }, '');
initP09Learning(doc, win);

function topic(value) {
  assert.ok($(`[data-p09-topic] option[value="${value}"]`), `${value} 질문의 이미지와 구현이 아직 준비되지 않았다`);
  $('[data-p09-topic]').value = value;
  $('[data-p09-topic]').dispatchEvent(new win.Event('change', { bubbles: true }));
}
function stage(value) { $(`[data-p09-stage="${value}"]`).click(); }

topic('references');
stage('mutation-before');
assert.match(text(), /Ada/);
assert.doesNotMatch(text(), /Local only/);
assert.equal($('[data-p09-prev]').disabled, true);
$('[data-p09-next]').click();
assert.match(text(), /호출|매개변수/);
assert.match(text(), /Ada/);
$('[data-p09-next]').click();
assert.match(text(), /Grace/);
assert.match($('[data-p09-code]').textContent, /p.nickname = "Grace"/);
assert.doesNotMatch($('[data-p09-code]').textContent,/System.out.println/,'현재 줄이 주변 코드 아래로 밀리지 않도록 발췌 표시');
assert.match($('[data-p09-context-code]').textContent,/System.out.println/,'주변 코드도 별도로 보존');
const mutationImage = $('[data-p09-image]').getAttribute('src');
stage('mutation-return');
assert.match(text(), /Grace/);
stage('reassignment-before');
assert.match(text(), /Grace/);
assert.doesNotMatch(text(), /Ada/);
stage('reassignment-local');
assert.match(text(), /Grace/);
assert.match(text(), /Local only/);
assert.notEqual($('[data-p09-image]').getAttribute('src'), mutationImage, '필드 변경과 재할당은 다른 실제 생성 이미지를 사용');
assert.match($('[data-p09-code]').textContent, /p = new Profile\("Local only"\)/);
stage('reassignment-return');
assert.match(text(), /Grace/);
assert.match(text(), /참조|접근/);
assert.match($('[data-p09-lead]').textContent, /GC|수거/);
assert.equal($('[data-p09-next]').disabled, true);
$('[data-p09-compare]').click();
assert.equal($('[data-p09-comparison]').hidden, false);
assert.match($('[data-p09-comparison]').textContent, /Grace/);
assert.match($('[data-p09-comparison]').textContent, /Local only/);
assert.equal($('[data-p09-compare]').getAttribute('aria-pressed'), 'true');

topic('primitive');
stage('primitive-assignment');
assert.match(text(), /99/);
assert.match(text(), /1/);
stage('primitive-return');
assert.match(text(), /1/);
assert.doesNotMatch(text(), /99/);

topic('shortcircuit');
stage('and');
assert.match(text(), /0/);
assert.match(text(), /건너|미평가/);
stage('or');
assert.match(text(), /0/);
stage('boolean-and');
assert.match(text(), /1/);
assert.match(text(), /false/);
stage('zero-guard');
assert.match(text(), /건너|미평가/);
assert.match($('[data-p09-code]').textContent, /divisor != 0 && 24 \/ divisor > 3/);

const existingState = structuredClone(win.history.state);
assert.deepEqual(existingState.foreign, { keep: true });
assert.equal(win.history.length, 1, '장면 선택으로 브라우저 뒤로가기 기록을 늘리지 않는다');
const prev = $('[data-p09-prev]');
prev.focus(); prev.click();
assert.equal(doc.activeElement, prev, '전환 후 조작 포커스 유지');
assert.ok(doc.querySelector('mark'), '현재 코드 구간을 선택 가능한 DOM으로 강조');
assert.ok($('a[href="#p09-original"]'), '원문 전체 접근');
assert.ok($('[data-kc-catalog-return]'), '기존 목록·검색 복귀 계약 유지');
assert.equal($('[data-p09-comparison]').hidden, true, '다른 질문에서는 기존 비교를 숨김');
const current = $('[data-p09-topic]').value;
initP09Learning(doc, win);
assert.equal($('[data-p09-topic]').value, current, '중복 초기화로 현재 장면을 덮지 않는다');
win.close();

console.log('P09: 필드 변경·지역 재할당·기본형·단락 평가·이미지/값/코드 동기화·비교·포커스·진도 분리 검사 통과');
