import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const day = id => JSON.parse(fs.readFileSync(new URL(`../../course/days/${id}.json`, import.meta.url), 'utf8'));
const guide = (id, step) => day(id).roadmap.steps[step - 1].visualGuide;

test('D11 요청을 읽는 네 경계는 각자 기록할 다음 호출을 갖는다', () => {
  const visual = guide('D11', 1);
  assert.equal(visual.kind, 'sequence');
  assert.equal(visual.rows.length, 4);
  for (const [index, boundary] of ['진입점', '필터', 'Controller', 'Service·저장소'].entries()) {
    assert.ok(visual.rows[index][0].includes(boundary));
    assert.ok(visual.rows[index][1].trim());
  }
  assert.match(visual.note, /지도 1장/);
});

test('D26은 신호·처리 완료·재기동을 별개 관찰 시점으로 남긴다', () => {
  const visual = guide('D26', 2);
  assert.equal(visual.kind, 'timeline');
  assert.deepEqual(visual.rows.map(row => row[0]), ['요청 진행 중', 'SIGTERM 전송', '처리 종료', '동일 이미지 재기동']);
  const text = visual.rows.flat().join(' ');
  assert.match(text, /신규 수용 중단/);
  assert.match(text, /기존 요청 완료/);
  assert.match(text, /종료 제한 시간/);
  assert.match(text, /데이터 유지.*실패 요청/);
  assert.match(visual.note, /강제 종료.*비교/);
  assert.match(visual.note, /이전 이미지.*앱/);
});

test('D45는 관찰·가설 배제·조치·복구 증거를 구획하고 비공개 평가 한계를 유지한다', () => {
  const visual = guide('D45', 1);
  assert.equal(visual.kind, 'evidence');
  assert.deepEqual(visual.rows.map(row => row[0]), ['최초 공유·영향 관찰', '증거 확보·완화', '가설·배제', '복구·대사']);
  const text = visual.rows.flat().join(' ');
  assert.match(text, /요청\/DB.*자원/);
  assert.match(text, /받은 도움.*추가 증거/);
  assert.match(visual.note, /시각.*직접 기록/);
  assert.match(visual.note, /독립 주입자.*확인 불가/);
});
