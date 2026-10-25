import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { renderCourseOutline } from './course-outline.mjs';

const open = (source, html) => new JSDOM(renderCourseOutline(source, html)).window.document;

test('일자 선택 카드는 현재 일자 진입과 제목·진도·필수 구분에 집중한다', () => {
  const html = '<h2 id="days">일자</h2><table><thead><tr><th>일</th><th>마일스톤</th><th>오늘의 Java</th></tr></thead><tbody><tr><td><a href="D05.html">D05</a></td><td>조회·수정·삭제</td><td><a href="J05.html">J05</a></td></tr></tbody></table>';
  const doc = open('course/spring/README.md', html);
  assert.equal(doc.querySelectorAll('table').length, 0);
  assert.equal(doc.querySelectorAll('ol.course-outline > li').length, 1);
  assert.equal(doc.querySelector('#days').textContent, '일자');
  assert.deepEqual([...doc.querySelectorAll('.guide-content a')].map(a => [a.textContent, a.getAttribute('href')]), [['D05', 'D05.html']]);
  assert.match(doc.querySelector('.course-outline > li').textContent, /조회·수정·삭제/);
  assert.match(doc.querySelector('.schedule-status').textContent, /구현 0\/6.*필수/);
  assert.equal(doc.querySelector('.guide-index a').getAttribute('href'), '#days');
});

test('기술 명세 표와 대상 밖 페이지를 그대로 둔다', () => {
  const html = '<table><thead><tr><th>HTTP</th><th>결과</th></tr></thead><tbody><tr><td>GET</td><td>200</td></tr></tbody></table>';
  assert.ok(open('course/README.md', html).querySelector('table'));
  assert.equal(renderCourseOutline('scenario/README.md', html), html);
});

test('출발 자료의 파일·의존성 단계는 흐름으로 바꾸고 설정 표는 보존한다', () => {
  const html = '<h1>출발</h1><table><thead><tr><th>파일</th><th>둘 위치</th></tr></thead><tbody><tr><td><a download href="compose.yaml">compose.yaml</a></td><td><code>루트</code></td></tr></tbody></table><h2 id="settings">설정</h2><table><thead><tr><th>항목</th><th>값</th></tr></thead><tbody><tr><td>Java</td><td>21</td></tr></tbody></table>';
  const doc = open('course/start/README.md', html);
  assert.equal(doc.querySelectorAll('.course-outline > li').length, 1);
  assert.equal(doc.querySelectorAll('table').length, 1);
  assert.equal(doc.querySelector('a[download]').getAttribute('href'), 'compose.yaml');
  assert.equal(doc.querySelector('.course-outline code').textContent, '루트');
});

test('Java·티켓·훈련·자료를 같은 레일과 본문으로 묶되 원인·접힌 제목은 목차에 싣지 않는다', () => {
  const html = '<article class="exercise-sheet"><h1 id="title">작업</h1><section class="exercise-section"><h2 id="repro">환경과 재현</h2><button data-copy-target="cmd">복사</button><pre id="cmd"><code>run</code></pre></section><section class="exercise-answer"><h2 id="answer">원인과 정답</h2><details><summary>펼치기</summary><h2 id="secret">커넥션을 쥔 진짜 원인</h2><p>해법의 본문</p></details></section></article>';
  for (const source of ['course/java/J00.md', 'course/java/J45.md', 'course/tickets/B01.md', 'course/tickets/E01.md', 'course/tickets/drill.md', 'course/start/ops/README.md', 'course/spec-v2.md']) {
    const doc = open(source, html);
    assert.equal(doc.querySelectorAll('.guide-layout > .guide-rail').length, 1, source);
    assert.equal(doc.querySelectorAll('.guide-content .exercise-sheet').length, 1, source);
    assert.deepEqual([...doc.querySelectorAll('.guide-index a')].map(a => a.getAttribute('href')), ['#repro'], source);
    assert.equal(doc.querySelector('#secret').closest('details').open, false, source);
    assert.equal(doc.querySelector('[data-copy-target]').dataset.copyTarget, 'cmd', source);
    assert.equal(doc.querySelector('#cmd').textContent, 'run', source);
  }
});

test('제목이 반복돼도 목차 앵커는 유일하며 다시 적용해도 구조가 겹치지 않는다', () => {
  const html = '<h1 id="title">과정</h1><h2>준비</h2><p>첫 내용</p><h2>준비</h2><p>다음 내용</p>';
  const rendered = renderCourseOutline('course/README.md', html);
  const doc = new JSDOM(rendered).window.document;
  const targets = [...doc.querySelectorAll('.guide-index a')].map(a => a.getAttribute('href'));
  assert.equal(new Set(targets).size, 2);
  for (const target of targets) assert.ok(doc.getElementById(target.slice(1)));
  assert.equal(renderCourseOutline('course/README.md', rendered), rendered);
});

test('빈 줄로 끊긴 과정 일정의 연속 행도 같은 흐름에 남긴다', () => {
  const html = '<h2 id="days">일정</h2><table id="timeline"><thead><tr><th>일</th><th>마일스톤</th><th>오늘의 Java</th><th>말하기 카드</th></tr></thead><tbody><tr id="day15"><td id="day15-label">D15</td><td>중간 점검</td><td>J15</td><td>5</td></tr></tbody></table><p>| D16 | 개인 경로 | <a href="java/J16.html">J16</a> | 3 |\n| D17 | 반례 | J17 | 3 |</p>';
  const doc = open('course/README.md', html);
  const flow = doc.querySelector('.course-outline');
  assert.equal(flow.children.length, 3);
  assert.equal(flow.id, 'timeline');
  assert.equal(doc.querySelector('#day15 #day15-label').textContent, '일D15');
  assert.equal(flow.querySelector('a').getAttribute('href'), 'java/J16.html');
  assert.equal(doc.querySelector('.guide-content > p'), null);
});

test('실제 과정 안내의 D00~D45는 빠짐없는 46개 흐름이며 pipe 행을 남기지 않는다', () => {
  const source = fs.readFileSync(new URL('../../course/README.md', import.meta.url), 'utf8');
  const doc = open('course/README.md', marked.parse(source));
  const items = [...doc.querySelectorAll('.course-outline > li')];
  assert.equal(items.length, 46);
  assert.deepEqual(items.map(item => item.querySelector('h3').textContent.replace(/^일/, '').trim()), ['D0', ...Array.from({ length: 45 }, (_, index) => `D${String(index + 1).padStart(2, '0')}`)]);
  assert.equal([...doc.querySelectorAll('.guide-content p')].some(p => /^\|\s*D\d/.test(p.textContent.trim())), false);
});
