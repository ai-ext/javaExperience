import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {course} from '../java-beginner/course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {combineCourses} from './combined-course.mjs';
import {moduleMarkup} from './view.mjs';

const plan=JSON.parse(readFileSync(new URL('./merge-plan.json',import.meta.url),'utf8'));
const moved={
  'pinned-posts':['extend','members',22], 'emoji-reactions':['extend','members',22], 'polls':['append','게시글 상호작용'],
  'recent-history':['extend','members',22], 'my-marked-posts':['extend','members',22], 'tag-related-posts':['extend','performance',46],
  'follow-recommendations':['extend','members',22], 'activity-summary':['extend','performance',46], 'activity-ranking':['extend','performance',46],
  'ranking-window':['extend','performance',46], 'weekly-snapshots':['append','활동 집계·순위'], 'hall-of-fame':['append','활동 집계·순위'],
  'popular-cache':['extend','performance',46], 'community-popular-cache':['extend','performance',46], 'counter-reconcile':['extend','operations',53],
  'link-preview':['extend','members',22], 'coupon-bulk':['append','포인트와 상점'], 'report-csv':['append','신고·운영'],
  'report-moderation':['append','신고·운영'], 'community-moderation':['append','신고·운영'], 'change-delivery':['append','개발과 검증'],
};
const screenIds=['follow-recommendations','request-context','time-policy','db-result-integrity','jvm-capacity','api-compatibility','decision-review','independent-repair','explain-handoff','bounded-workers','incident-response','release-recovery','transaction-observation','legacy-schema-evolution','reservation-schema-evolution','change-delivery','independent-change','db-query-measure','contract-tests','reservation-plan','reservation-history-query','reservation-api','reservation-jobs'];

test('21개 재배치 기능은 지정 회차 또는 append 묶음에 존재한다',()=>{
  const service=loadServiceCourse();
  for(const [id,[type,module,after]] of Object.entries(moved)){
    const entry=plan.entries.find(item=>item.feature===id);
    assert.ok(entry,`${id} 배치 누락`);
    assert.equal(entry.type,type,id);
    if(type==='extend'){
      assert.equal(entry.module,module,id);
      assert.equal(entry.after,after,id);
      assert.ok(course.modules.find(item=>item.id===module)?.days.some(day=>day.day===after),`${id} 목적 회차 없음`);
    }else{
      assert.equal(service.modules.find(item=>item.id===id)?.group,module,`${id} append 그룹`);
    }
    assert.ok(entry.reason?.trim(),`${id} 이동 이유 누락`);
  }
  const appended=plan.entries.filter(item=>item.type==='append').map(item=>item.order).sort((a,b)=>a-b);
  assert.deepEqual(appended,Array.from({length:appended.length},(_,i)=>i+13));
  assert.equal(service.modules.reduce((n,module)=>n+module.days.length,0),138);
});

test('23개 화면과 단계별 업무 요청서는 근거와 화면 형식을 갖춘다',()=>{
  for(const id of screenIds){
    const view=JSON.parse(readFileSync(new URL(`../service/course-view/${id}.json`,import.meta.url),'utf8'));
    assert.ok(view.screens.length>0,`${id} 화면 누락`);
    for(const screen of view.screens){
      assert.ok(screen.name&&screen.columns.length&&screen.actions,`${id} 화면 형식`);
      assert.ok(screen.basis,`${id} 화면 근거 누락`);
      assert.ok(existsSync(resolve(screen.basis)),`${id} 근거 파일 없음: ${screen.basis}`);
      assert.ok(screen.columns.length<=8,`${id} 화면 열이 8개를 초과함`);
      assert.ok(!JSON.stringify(screen).includes('{{'),`${id} 화면에 템플릿 변수가 남음`);
      assert.ok(!/요청 결과 확인|화면 확인/.test(screen.name),`${id} 화면 이름이 범용적임`);
    }
    const screenKeys=view.screens.map(screen=>`${screen.name}\u0000${screen.columns.join('\u0000')}`);
    assert.equal(new Set(screenKeys).size,screenKeys.length,`${id} 같은 이름·열의 중복 화면`);
  }
  const service=loadServiceCourse();
  const stages=service.modules.flatMap(module=>module.days);
  const tickets=stages.map(day=>day.ticket).filter(Boolean);
  assert.ok(tickets.length>0);
  for(const ticket of tickets){
    assert.ok(ticket.id&&ticket.from&&ticket.request&&ticket.situation,`${ticket.id} 업무 요청 본문 누락`);
    assert.ok(ticket.from.includes(' · '),`${ticket.id} 요청자와 요청 종류 구분 누락`);
    assert.match(ticket.id,/^[a-z][a-z0-9-]*(?::[a-z0-9-]+){2}$/i,`${ticket.id} 식별자 형식 불일치`);
    assert.ok(ticket.constraints.length&&ticket.acceptance.length,`${ticket.id} 업무 조건 또는 확인 결과 누락`);
    assert.ok(ticket.basis&&existsSync(resolve(ticket.basis)),`${ticket.id} 업무 요청 근거 없음`);
    assert.ok(ticket.situation.length<=100,`${ticket.id} 상황이 100자를 초과함`);
    assert.ok(ticket.request.length<=140,`${ticket.id} 요청이 140자를 초과함`);
    assert.ok(!/[→{}]/.test(ticket.request),`${ticket.id} 요청에 금지 표기가 있음`);
    assert.ok(!/\/(?:api|v[0-9]|admin|posts|members)\b|https?:\/\//i.test(ticket.request),`${ticket.id} 요청에 경로가 있음`);
    assert.ok(ticket.constraints.length>=2&&ticket.constraints.length<=3,`${ticket.id} 조건 수가 범위를 벗어남`);
    assert.ok(ticket.acceptance.length>=2&&ticket.acceptance.length<=3,`${ticket.id} 확인 항목 수가 범위를 벗어남`);
    for(const item of [...ticket.constraints,...ticket.acceptance]){
      assert.ok(item.length<=80,`${ticket.id} 항목이 80자를 초과함: ${item}`);
      assert.ok(/[.!?。]$/.test(item),`${ticket.id} 항목이 완결된 한 문장이 아님: ${item}`);
    }
  }
});

test('입문·실무 과정 연결은 기능 ID 대신 기능 이름을 표시한다',()=>{
  const combined=combineCourses(course,loadServiceCourse(),plan);
  const beginner=combined.modules.find(module=>module.id==='search-comments');
  const beginnerMarkup=moduleMarkup(beginner,beginner.days[0],'task',[]);
  assert.ok(beginnerMarkup.includes('제목·본문·작성자로 글 검색하기'));
  assert.ok(!beginnerMarkup.includes('>integrated-search ↗</a>'));
  const service=combined.modules.find(module=>module.id==='change-delivery');
  const serviceMarkup=moduleMarkup(service,service.days[0],'task',[]);
  assert.ok(serviceMarkup.includes('재입고 업무를 맡아 마무리하기'));
});
