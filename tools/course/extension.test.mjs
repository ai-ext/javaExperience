import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCourseSources } from './sources.mjs';
import { validate, validateSql, parseDayPage } from './validate.mjs';
import { buildAll } from './build-days.mjs';
const root = new URL('../../', import.meta.url).pathname;
const data = loadCourseSources(root);

test('D15 중간 점검에서 45일 확장 과정으로 연속 연결된다', () => {
  assert.equal(data.roadmap.days.length, 45);
  assert.match(data.roadmap.days[14].tomorrow, /D16/);
  assert.doesNotMatch(data.roadmap.days[14].tomorrow, /다음 날은 없다/);
  for (let n=16;n<=45;n++) {
    const id = `D${n}`;
    const day = data.roadmap.days[n-1];
    assert.equal(day.id, id);
    assert.equal(day.phase, 'extend');
    assert.ok(day.purpose && day.prerequisite && day.workTarget);
    assert.ok(day.steps.length >= 2 && day.steps.length <= 3);
    assert.ok(data.hints.days[id].grader.focus.length >= 2);
    assert.ok(data.hints.days[id].steps['1'].length);
  }
  assert.deepEqual(validate({spec:fs.readFileSync(root+'course/spec-v2.md','utf8'),roadmap:data.roadmap,cards:data.cards}), []);
  assert.deepEqual(validateSql(data), []);
});

test('회의 네 종류는 반론과 결정 수정까지 개별 채점한다', () => {
  for (const [id,kind] of [['D30','API 협의'],['D35','일정 산정'],['D40','장애 회고'],['D41','설계 리뷰']]) {
    const g = data.hints.days[id]?.grader;
    assert.ok(g, id);
    assert.equal(g.meeting.kind, kind);
    assert.ok(g.meeting.objection.length > 20);
    assert.equal(g.meeting.criteria.length, 5);
    assert.match(g.meeting.criteria.join(' '), /사실.*가정/);
    assert.match(g.meeting.criteria.join(' '), /대안.*비용/);
    assert.match(g.meeting.criteria.join(' '), /결정 요청/);
    assert.match(g.meeting.criteria.join(' '), /검증.*배포.*실패/);
    assert.match(g.meeting.criteria.join(' '), /반론.*수정/);
  }
});

test('새 날·Java·채점은 원본에서 생성되고 티켓 원인을 선공개하지 않는다', () => {
  const { files } = buildAll(root);
  for (let n=16;n<=45;n++) {
    const id=`D${n}`;
    const md=files.get(`course/spring/${id}.md`);
    assert.ok(md, id);
    assert.equal(parseDayPage(md).steps.length, data.roadmap.days[n-1].steps.length);
    assert.doesNotMatch(md, /undefined|준비 중|\{\{[A-Z_]+\}\}/);
    assert.ok(files.get(`course/java/J${n}.md`), `J${n}`);
    assert.match(md, /확인 불가/);
  }
  for (const id of ['D16','D17','D18']) {
    const md=files.get(`course/spring/${id}.md`);
    assert.match(md, /사본/);
    assert.match(md, /개인 경로/);
    assert.doesNotMatch(md, /rollback-only|self-invocation|afterCommit|randomUUID|Lettuce/);
  }
  for (const id of ['D30','D35','D40','D41']) {
    const md=files.get(`course/spring/${id}.md`);
    assert.match(md, /\[M1\]/);
    assert.match(md, /\[M5\]/);
  }
});

test('확장 검증기는 선행 명세 참조와 회의 기준 누락을 거부한다', async () => {
  const {validateExtension} = await import('./validate.mjs');
  assert.equal(typeof validateExtension,'function');
  assert.deepEqual(validateExtension(data),[]);
  const bad=structuredClone(data);
  bad.hints.days.D30.grader.meeting.criteria.pop();
  assert.ok(validateExtension(bad).some(e=>e.includes('D30')&&e.includes('회의')));
  const broken=structuredClone(data);
  broken.roadmap.days[24].steps[0].dayRefs=[{day:'D99',step:1,label:'없는 명세'}];
  assert.ok(validateExtension(broken).some(e=>e.includes('D25')&&e.includes('D99')));
});

test('확장 채점 프롬프트는 오늘 SQL 과제를 포함하고 예시 답은 노출하지 않는다', () => {
  const {files}=buildAll(root);
  const md=files.get('course/spring/D25.md');
  const prompt=md.split('## AI 채점 프롬프트')[1].split('## 내일 미리보기')[0];
  for (const q of data.hints.days.D25.sql.questions) assert.ok(prompt.includes(q.task));
  assert.ok(!prompt.includes(data.hints.days.D25.sql.questions[0].example));
});
