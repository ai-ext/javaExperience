import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
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

test('94개 기능의 화면 이름과 표시 열은 읽기 쉬운 범위다',()=>{
  const viewFiles=readdirSync(new URL('../service/course-view/',import.meta.url)).filter(file=>file.endsWith('.json'));
  assert.equal(viewFiles.length,94,'94개 기능의 화면을 모두 검사해야 함');
  for(const file of viewFiles){
    const view=JSON.parse(readFileSync(new URL(`../service/course-view/${file}`,import.meta.url),'utf8'));
    const names=new Set();
    for(const screen of view.screens||[]){
      assert.ok(typeof screen.name==='string'&&screen.name.trim(),`${view.id} 화면 이름 누락`);
      assert.ok(!/^[a-z][a-z0-9-]*$/.test(screen.name),`${view.id} 화면 이름이 영문 ID 형식임: ${screen.name}`);
      assert.ok(!/요청 결과 확인|요청 처리 결과|화면 확인|결과 확인/.test(screen.name),`${view.id} 화면 이름이 범용적임: ${screen.name}`);
      assert.ok(!screen.name.includes('{{'),`${view.id} 화면 이름에 템플릿 변수가 남음`);
      assert.ok(!/(?:김자바|이스프링|박디비|\d+번|\b[PVHLWIE]\d+\b)/.test(screen.name),`${view.id} 화면 이름에 사람 이름 또는 테스트 번호가 있음: ${screen.name}`);
      assert.ok(Array.isArray(screen.columns),`${view.id} 화면 열 형식 오류`);
      assert.ok(screen.columns.length<=8,`${view.id} 화면 열이 8개를 초과함: ${screen.name}`);
      assert.ok(!JSON.stringify(screen).includes('{{'),`${view.id} 화면에 템플릿 변수가 남음`);
      assert.ok(typeof screen.actions==='string'&&screen.actions.trim(),`${view.id} 화면 동작 설명 누락`);
      assert.ok(!names.has(screen.name),`${view.id} 화면 이름 중복: ${screen.name}`);
      names.add(screen.name);
      if(screen.basis) assert.ok(existsSync(resolve(screen.basis)),`${view.id} 근거 파일 없음: ${screen.basis}`);
    }
  }
});

test('94개 기능 화면에는 기계적 열·동작 설명과 동사형 단계 이름이 없다',()=>{
  const viewFiles=readdirSync(new URL('../service/course-view/',import.meta.url)).filter(file=>file.endsWith('.json'));
  assert.equal(viewFiles.length,94,'94개 기능의 화면을 모두 검사해야 함');
  for(const file of viewFiles){
    const view=JSON.parse(readFileSync(new URL(`../service/course-view/${file}`,import.meta.url),'utf8'));
    for(const screen of view.screens||[]){
      for(const column of screen.columns){
        assert.ok(!/^(입력|결과) [A-Za-z]/.test(column),`${view.id} 기계적 표시 열: ${column}`);
      }
      assert.ok(!/^요청 입력 \/ 결과 확인|요청을 보내고 응답을 확인합니다\.?$/.test(screen.actions),`${view.id} 빈약한 동작 설명: ${screen.actions}`);
      assert.ok(!/(?:하기|시키기)$/.test(screen.name),`${view.id} 단계형 화면 이름: ${screen.name}`);
    }
  }
});

test('23개 단계별 업무 요청서는 근거와 화면 형식을 갖춘다',()=>{
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
  assert.equal(tickets.length,70,'단계별 업무 요청서 70개를 검사해야 함');
  const ids=new Set();
  const beginnerIds=new Set(course.modules.flatMap(module=>module.days.map(day=>day.ticket?.id).filter(Boolean)));
  for(const ticket of tickets){
    assert.ok(ticket.id&&ticket.from&&ticket.request&&ticket.situation,`${ticket.id} 업무 요청 본문 누락`);
    assert.match(ticket.from,/^[^·]+ · [^·]+$/,`${ticket.id} 요청자와 요청 종류 형식 불일치`);
    assert.ok(ticket.from.length<=24,`${ticket.id} 요청자 문구가 24자를 초과함`);
    assert.match(ticket.id,/^[A-Z][A-Z0-9]*-\d{3}$/,`${ticket.id} 식별자 형식 불일치`);
    assert.ok(!ids.has(ticket.id),`${ticket.id} 업무 요청 ID 중복`);
    assert.ok(!beginnerIds.has(ticket.id),`${ticket.id} 입문 업무 요청 ID와 중복`);
    ids.add(ticket.id);
    assert.ok(Array.isArray(ticket.constraints)&&Array.isArray(ticket.acceptance),`${ticket.id} 업무 조건 또는 확인 결과 누락`);
    assert.ok(ticket.basis&&existsSync(resolve(ticket.basis)),`${ticket.id} 업무 요청 근거 없음`);
    assert.ok(ticket.situation.length<=80,`${ticket.id} 상황이 80자를 초과함`);
    assert.ok(ticket.request.length<=120,`${ticket.id} 요청이 120자를 초과함`);
    assert.match(ticket.request,/주세요\.$/,`${ticket.id} 요청이 '주세요.'로 끝나지 않음`);
    assert.ok((ticket.request.match(/[.!?](?:\s|$)/g)||[]).length<=2,`${ticket.id} 요청이 세 문장 이상임`);
    assert.ok(ticket.constraints.length>=2&&ticket.constraints.length<=3,`${ticket.id} 조건 수가 범위를 벗어남`);
    assert.ok(ticket.acceptance.length>=2&&ticket.acceptance.length<=3,`${ticket.id} 확인 항목 수가 범위를 벗어남`);
    for(const item of [...ticket.constraints,...ticket.acceptance]){
      assert.ok(item.length<=60,`${ticket.id} 항목이 60자를 초과함: ${item}`);
      assert.match(item,/\.$/,`${ticket.id} 항목이 한 문장으로 끝나지 않음: ${item}`);
    }
    const prose=[ticket.from,ticket.situation,ticket.request,...ticket.constraints,...ticket.acceptance].join('\n');
    assert.ok(!/[→{}]|https?:\/\/|\/[A-Za-z][A-Za-z0-9._/-]*|fixture/i.test(prose),`${ticket.id} 설명에 금지 표기가 있음`);
    assert.ok(!/[가-힣][a-z]+/.test(prose),`${ticket.id} 한글과 영문 사이 공백 누락`);
    assert.ok(!/\b[a-z]+[A-Z][A-Za-z]*\b|\b[a-z]+_[a-z0-9_]+\b/.test(prose),`${ticket.id} 설명에 변수명이 있음`);
    for(const item of ticket.acceptance){
      assert.match(item,/[가-힣]+다\.$/,`${ticket.id} 확인 결과를 관찰 가능한 평서문으로 작성해야 함: ${item}`);
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
