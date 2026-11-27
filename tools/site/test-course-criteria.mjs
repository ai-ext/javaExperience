import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderLearningContent } from './course-criteria.mjs';
import fs from 'node:fs';
import { marked } from 'marked';
import { loadCourseSources } from '../course/sources.mjs';

const read = html => JSDOM.fragment(html);
const norm = text => text.replace(/\s+/g, ' ').trim();
const fixture = `<section class="day-step" id="step-d05-2"><div class="fact-done"><p class="fact-label">완료 조건</p><ul>
<li><code>PATCH /posts/1</code> → 200, 본문은 그대로</li>
<li><code>DELETE /posts/1</code> → 204, 이후 <code>GET</code> → 404</li>
<li><code>Java → SQL</code> 순서를 <a href="#proof">기록한다</a>.</li>
</ul></div><details class="step-observations"><summary>꼭 할 관찰 · 증거</summary><ul><li>Java는 local, DB는 old. flush와 commit을 구별한다.</li></ul></details>
<details class="step-observations"><summary>선택 관찰 실험</summary><ul><li>선택 실험</li></ul></details>
<details class="step-answer"><summary>구현 예시</summary><pre><code>return "→";</code></pre></details></section>
<ol class="sql-questions"><li><p>댓글 없는 글도 남긴다.</p><p><strong>확인할 성질</strong> 80행이다.</p></li></ol>`;

test('조건/기대 결과를 분리하면서 코드·연속 화살표·링크·원문을 보존한다', () => {
  const before = read(fixture);
  const after = read(renderLearningContent(fixture, [{id:'D05-2', presentation:'contract'}]));
  const items = [...after.querySelectorAll('.fact-done li')];
  assert.equal(items[0].querySelector('.criterion-condition').textContent, 'PATCH /posts/1');
  assert.equal(items[0].querySelector('.criterion-result').textContent, '200, 본문은 그대로');
  assert.equal(items[1].querySelector('.criterion-result').textContent, '204, 이후 GET → 404');
  assert.equal(items[2].querySelector('.criterion-result'), null, '코드 안의 화살표는 문장 구획이 아니다');
  assert.deepEqual(items.map(x=>norm(x.textContent)), [...before.querySelectorAll('.fact-done li')].map(x=>norm(x.textContent)));
  assert.equal(after.querySelector('a').getAttribute('href'), '#proof');
  assert.equal(after.querySelector('.day-step').dataset.presentation, 'contract');
});

test('필수 관찰은 노출하고 선택 관찰·구현 답은 접힌 상태로 보존한다', () => {
  const after = read(renderLearningContent(fixture, [{id:'D05-2',presentation:'comparison'}]));
  const obs = [...after.querySelectorAll('.step-observations')];
  assert.equal(obs[0].open, true);
  assert.equal(obs[1].open, false);
  assert.equal(after.querySelector('.step-answer').open, false);
  assert.equal(after.querySelector('.step-answer code').textContent, 'return "→";');
  assert.equal(obs[0].querySelector('li').textContent, 'Java는 local, DB는 old. flush와 commit을 구별한다.');
});

test('SQL 과제와 기대 성질을 노출한 대조 칸으로 표시한다', () => {
  const after = read(renderLearningContent(fixture, []));
  assert.equal(after.querySelector('.sql-task').textContent, '댓글 없는 글도 남긴다.');
  assert.equal(after.querySelector('.sql-evidence').textContent, '확인할 성질 80행이다.');
  assert.equal(after.querySelector('.sql-task').closest('details'), null);
});

test('긴 코드나 HTML을 텍스트로 다시 해석하지 않고 반복 적용도 안정적이다', () => {
  const html = renderLearningContent(fixture,[{id:'D05-2',presentation:'sequence'}]);
  assert.equal(renderLearningContent(html,[{id:'D05-2',presentation:'sequence'}]), html);
  assert.equal(read(html).querySelectorAll('section.day-step').length,1);
});

test('운영·증거 문장의 시간 순서 화살표를 입력/결과 구획으로 나누지 않는다', () => {
  for (const presentation of ['sequence', 'evidence']) {
    const doc = read(renderLearningContent(fixture, [{id:'D05-2',presentation}]));
    assert.equal(doc.querySelectorAll('.criterion-result').length, 0);
  }
});

test('모든 일자의 완료 조건·SQL·관찰·말하기를 원본과 대조한다', () => {
  const { roadmap, hints } = loadCourseSources();
  // 최신 stepper에서 바꾼 UI 용어 한 곳을 허용한다. 요구조건의 나머지 문장은 그대로 대조한다.
  const text = value => norm(read(marked.parseInline(value)).textContent).replaceAll('정답 접기', '구현 예시 접기');
  for (const day of roadmap.days) {
    const doc = new JSDOM(fs.readFileSync(new URL(`../../course/spring/${day.id}.html`, import.meta.url), 'utf8')).window.document;
    for (const step of day.steps) {
      const section = doc.querySelector(`#step-${day.id.toLowerCase()}-${step.no}`);
      assert.equal(section.dataset.presentation, step.presentation, `${day.id}-${step.no}: 표시 유형`);
      const criteriaNodes = [...section.querySelectorAll('.fact-done li')].filter(li => !li.closest('.task-visual'));
      const criteria = criteriaNodes.map(li=>norm(li.textContent));
      if (day.phase === 'maintain') for (const value of criteria) assert.match(value, /^\[(공통|[BE]\d{2} (필수|선택|연습|고도화))\] /);
      let actual = criteria.map(value=>day.phase === 'maintain' ? value.replace(/^\[[^\]]+\] /, '') : value);
      const expected = step.done.map(text);
      if (step.visualGuide?.coversDone?.length) {
        const covered = [...new Set(step.visualGuide.coversDone)].toSorted();
        assert.equal(covered.length, step.visualGuide.coversDone.length, `${day.id}-${step.no}: 중복 완료 조건 매핑 없음`);
        assert.ok(covered.every(index => Number.isInteger(index) && index >= 0 && index < expected.length), `${day.id}-${step.no}: 시각 안내 완료 조건 인덱스 유효`);
        const remaining = criteriaNodes.filter(li => li.hasAttribute('data-criterion-index'));
        const remainingIndexes = remaining.map(li => Number(li.dataset.criterionIndex)).toSorted();
        assert.deepEqual([...covered, ...remainingIndexes].toSorted(), expected.map((_, index) => index), `${day.id}-${step.no}: 시각 안내·접기 영역이 완료 조건을 빠짐없이 담당`);
        const visual = section.querySelector('.fact-done > .task-visual');
        assert.ok(visual, `${day.id}-${step.no}: 완료 조건 시각 안내 렌더`);
        const renderedRows = visual.querySelectorAll('ol > li, tbody > tr').length;
        assert.equal(renderedRows, step.visualGuide.rows.length, `${day.id}-${step.no}: 시각 안내 행 보존`);
        if (step.id === 'D01-1') {
          const visualText = norm(visual.textContent);
          assert.match(visualText, /\.\/gradlew bootRun/, 'D01-1 실행 명령 보존');
          assert.match(visualText, /GET \/actuator\/health/, 'D01-1 health endpoint 보존');
          assert.match(visualText, /200.*status: UP/, 'D01-1 기대 상태 보존');
        }
        for (const li of remaining) {
          const index = Number(li.dataset.criterionIndex);
          const value = norm(li.textContent).replace(/^\[[^\]]+\] /, '');
          assert.equal(value, expected[index], `${day.id}-${step.no}: 시각 안내 밖 완료 조건 ${index} 보존`);
        }
        actual = [];
      }
      // 현재 stepper는 선택·연습 조건을 티켓별 접기로 재배치한다. 조건의 중복·누락은 계속 검사한다.
      if (!step.visualGuide?.coversDone?.length) assert.deepEqual(day.phase === 'maintain' ? actual.toSorted() : actual, day.phase === 'maintain' ? expected.toSorted() : expected, `${day.id}-${step.no}: 완료 조건 보존`);
      for (const file of step.files) assert.ok(section.querySelector('.fact-files').textContent.includes(file), `${day.id}-${step.no}: ${file}`);
      const observations = hints.days[day.id].observations?.[String(step.no)] ?? [];
      const block = section.querySelector('.step-observations');
      if (observations.length) {
        assert.equal(block.open, observations.some(o=>o.required), `${day.id}-${step.no}: 관찰 노출`);
        assert.deepEqual([...block.querySelectorAll('.observation-records > li')].map(li=>norm(li.textContent)), observations.map(o=>text(o.text)));
      }
    }
    const questions = hints.days[day.id].sql.questions;
    assert.deepEqual([...doc.querySelectorAll('.sql-task')].map(p=>norm(p.textContent)), questions.map(q=>text(q.task)), `${day.id}: SQL 질문`);
    assert.equal(doc.querySelectorAll('.practice-talk-card').length, day.talkCards.length, `${day.id}: 말하기 카드`);
    doc.defaultView.close();
  }
});
