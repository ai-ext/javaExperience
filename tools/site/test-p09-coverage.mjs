// 이 검사는 기계적인 장면·근거 연결 범위를 확인한다. 이미지의 기술·시각 검토를 대체하지 않는다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { P09_LESSONS } from './p09-lesson-data.mjs';
import { P09_ASSETS } from './p09-assets.mjs';
import { renderP09Learning, p09AvailableLessons } from './p09-learning.mjs';
const root=new URL('../../',import.meta.url);
const ready=p09AvailableLessons();
const missing=P09_LESSONS.filter(l=>!ready.some(item=>item.id===l.id));
assert.deepEqual(missing.map(l=>l.id),[],`이미지·구현이 아직 빠진 묶음: ${missing.map(l=>l.id).join(', ')}`);
const page=new JSDOM(renderP09Learning());
assert.equal(page.window.document.querySelectorAll('[data-p09-topic] option').length,P09_LESSONS.length);
for(const lesson of P09_LESSONS){
  assert.ok(lesson.source&&lesson.question&&lesson.stages.length,lesson.id+' 원문·질문·상태');
  for(const stage of lesson.stages){
    const asset=P09_ASSETS[stage.image];assert.ok(asset,stage.id+' 실제 시안 연결');
    assert.ok(fs.existsSync(new URL('docs/design/p09-2026-10-20/images/'+asset.file,root)),stage.id+' 실제 파일');
    assert.ok(stage.code&&stage.lead&&stage.values.length,stage.id+' 코드·설명·값');
    for(const index of stage.active)assert.ok(index>=0&&index<stage.code.split('\n').length,stage.id+' 정확한 코드 강조 범위');
  }
}
const numeric=P09_LESSONS.find(lesson=>lesson.id==='numeric-boundary');
assert.equal(numeric.source,'§2 연산 보강 · 원문 152줄','numeric-boundary는 실제 원문 마지막 행을 가리킨다');
const numericSource=fs.readFileSync(new URL('docs/knowledge/P09-java-syntax-basics.md',root),'utf8').split('\n');
assert.match(numericSource[151],/정수 나눗셈은 소수 부분을 버린다/);
assert.doesNotMatch(numericSource[152],/정수 나눗셈은 소수 부분을 버린다/);
const questions=JSON.parse(fs.readFileSync(new URL('docs/design/p09-2026-10-20/questions.json',root))).questions;
for(const q of questions){
  assert.ok(['implemented','verified'].includes(q.status),q.id+' 질문별 구현 근거 미완료');
  assert.ok(q.checks.length,q.id+' 검사 근거 없음');
  if(q.id!=='p09-deep')assert.ok(q.imageEvidence.length,q.id+' 실제 이미지 근거 없음');
}
const observed=JSON.parse(fs.readFileSync(new URL('docs/design/p09-2026-10-20/browser-all-states.json',root))).observations;
const inventory=fs.readFileSync(new URL('docs/design/visual-inventory.jsonl',root),'utf8').trim().split('\n').map(JSON.parse).filter(x=>x.kind==='p09_learning_state');
const historicalIds=new Set(observed.map((x)=>`${x.topic}/${x.expected}`));
const historicalStages=P09_LESSONS.flatMap((lesson)=>lesson.stages.filter((stage)=>historicalIds.has(`${lesson.id}/${stage.id}`)).map((stage)=>({lesson,stage})));
assert.equal(historicalIds.size,84,'기존 browser history의 84상태만 과거 브라우저 기록으로 검사');
const newIds=new Set(['shared-before','shared-after-a','shared-after-b','sum-empty','sum-items','sum-array','choose-fixed','choose-array','choose-empty'].map((id)=>`${id.startsWith('shared-')?'shared-state':'varargs-selection'}/${id}`));
const inventoryIds=new Set(inventory.map((x)=>`${x.topicId}/${x.stageId}`));
assert.ok([84,93].includes(inventory.length),'P09 inventory는 기존84상태이거나 새 9상태까지 등록한93상태여야 한다');
assert.deepEqual(new Set([...inventoryIds].filter((id)=>newIds.has(id))),inventory.length===93?newIds:new Set(),'새 inventory 항목은 지정한 9상태 전체 단위로만 등록');
for(const {lesson,stage} of historicalStages){
  assert.ok(inventory.some(x=>x.topicId===lesson.id&&x.stageId===stage.id),stage.id+' 개별 목록');
  for(const mode of ['desktop','mobile']){
    const record=observed.find(x=>x.topic===lesson.id&&x.expected===stage.id&&x.mode===mode);
    assert.ok(record?.loaded&&!record.overflow,stage.id+' 실제 '+mode+' 관찰');
    assert.equal(record.title,stage.title);assert.equal(record.question,lesson.question);
    assert.equal(record.values,stage.values.flat().join(''));
    const expected=lesson.id==='references'?stage.code.split('\n').filter((l,i)=>stage.active.includes(i)).join('\n'):stage.code.split('\n').map(l=>l||' ').join('\n');
    assert.equal(record.code,expected,stage.id+' 저장된 실제 브라우저 코드와 현재 명세');
  }
}
page.window.close();
console.log(`P09 기계적 연결: ${P09_LESSONS.length}묶음·${P09_LESSONS.reduce((n,l)=>n+l.stages.length,0)}상태·${questions.length}질문. 개별 기술·시각·브라우저 검증은 별도.`);
