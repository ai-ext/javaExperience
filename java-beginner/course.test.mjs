import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

test('독립 과정은 기능별 기획서와 60개의 구체적인 학습 회차를 제공한다', async () => {
  assert.ok(existsSync(new URL('./course.mjs', import.meta.url)), '새 입문 과정 데이터가 필요합니다');
  const {course} = await import('./course.mjs');
  const days = course.modules.flatMap(m => m.days);
  assert.deepEqual(days.map(d => d.day), Array.from({length:60}, (_, i) => i + 1));
  assert.equal(new Set(course.modules.map(m => m.id)).size, course.modules.length);
  const apiIds = new Set(course.modules.flatMap(m => m.apis.map(a => a.id)));
  for (const m of course.modules) {
    assert.ok(m.brief.purpose && m.brief.story && m.brief.scope && m.brief.excluded);
    assert.ok(m.screens.length > 0 && m.tables.length > 0 && m.policies.length > 1);
    for (const table of m.tables) assert.ok(table.name && table.fields.length >= 3 && table.check);
    for (const api of m.apis) {
      assert.ok(api.id && api.method && api.path.startsWith('/') && api.success && api.prepare);
      assert.ok(api.cases.length >= 2, `${api.id} 정상/실패 예시 필요`);
      assert.ok(api.requestFields && api.responseFields);
    }
    for (const d of m.days) {
      assert.ok(d.title && d.concept && d.goal && d.tasks.length >= 2 && d.check.length >= 2, `Day ${d.day} 구체 내용 필요`);
      for (const id of d.apiIds) assert.ok(apiIds.has(id), `Day ${d.day} API ${id} 누락`);
    }
  }
  assert.equal(new Set(days.map(d => d.title)).size, 60);
});

test('사내 공지 게시판으로 시작하고 운영 변경 업무까지 60회차로 이어진다', async () => {
  const {course} = await import('./course.mjs');
  assert.equal(course.modules[0].id,'board');
  assert.equal(course.modules[0].number,'01');
  assert.equal(course.modules[0].days[0].day,1);
  assert.ok(!course.modules.some(m=>m.id==='first-api'));
  assert.deepEqual(course.modules.map(m=>m.number),Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')));
  const recovery=course.modules.find(m=>m.id==='recovery');
  assert.ok(recovery,'운영 중 삭제 공지 복구 요구사항 필요');
  assert.deepEqual(recovery.days.map(d=>d.day),[54,55,56,57]);
  const tickets=course.modules.flatMap(m=>m.days.filter(d=>d.ticket).map(d=>d.ticket));
  assert.ok(tickets.length>=8);
  assert.equal(new Set(tickets.map(t=>t.id)).size,tickets.length);
  for(const t of tickets) assert.ok(t.from && t.situation && t.request && t.constraints.length && t.acceptance.length);
});

test('공통 기획서와 오늘의 과제·업무 요청을 구분해 표시한다', async () => {
  const {course}=await import('./course.mjs');
  const {moduleMarkup}=await import('./view.mjs');
  const board=course.modules[0];
  const first=moduleMarkup(board,board.days[0],'brief');
  const second=moduleMarkup(board,board.days[1],'brief');
  assert.match(first,/공통 기획서/);
  assert.ok(first.includes(board.brief.purpose) && second.includes(board.brief.purpose));
  assert.ok(first.includes(board.days[0].goal) && second.includes(board.days[1].goal));
  const m=course.modules.find(m=>m.id==='recovery');
  assert.ok(moduleMarkup(m,m.days[0],'task').includes(m.days[0].ticket.id));
});
