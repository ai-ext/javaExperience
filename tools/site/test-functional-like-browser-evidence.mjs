import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadLikeBrowserEvidence,verifyLikeBrowserEvidence,compareLikeControllerSources} from './verify-functional-like-browser-evidence.mjs';
import {readFileSync} from 'node:fs';
const original=loadLikeBrowserEvidence();
test('원시23HTTP·18SQL관찰과 새 흐름의 보존 규칙을 대조한다',()=>{
  const result=verifyLikeBrowserEvidence(original);
  assert.equal(result.nativeHttpRequests,23);assert.equal(result.separateSqlObservationGroups,18);
});
test('숫자·관계행·헤더·이어가기·진도·토큰 보존을 훼손한 증거를 거절한다',()=>{
  const changes=[
    ['응답 숫자',e=>{const r=e.browser.records.find(x=>x.stage==='fresh-put');r.json.likeCount=99;r.body=JSON.stringify(r.json);r.raw=r.raw.slice(0,r.raw.indexOf('\n\n')+2)+r.body;}],
    ['타회원 행',e=>{e.runtime.likeObservations.find(x=>x.stage==='others-delete').post_like[0].id=999;}],
    ['인증 헤더',e=>{const r=e.browser.records.find(x=>x.stage==='anonymous-delete');r.raw=r.raw.replace('WWW-Authenticate: Bearer','WWW-Authenticate: 미확인');}],
    ['삭제 id',e=>{e.afterFix.nextLike.id='24';}],
    ['활성 과제',e=>{e.homeFinal.title='게시글 삭제';}],
    ['CLI를 브라우저로 오인',e=>{e.runtime.requests.push({method:'PUT'});}],
    ['입력 유지',e=>{e.tokenCopy.afterAuth=false;}],
  ];
  for(const [label,change] of changes){const e=structuredClone(original);change(e);assert.throws(()=>verifyLikeBrowserEvidence(e),assert.AssertionError,label);}
});
test('저장한 검증 소스와 다른 요청·응답 변경을 도움말 수정으로 허용하지 않는다',()=>{
  const tested=readFileSync(new URL('../../docs/design/scenario-like-2026-10-21/browser-api-2026-10-21/tested-controller.js',import.meta.url),'utf8');
  const current=readFileSync(new URL('./functional-scenario.js',import.meta.url),'utf8');
  assert.equal(compareLikeControllerSources(current,tested).transportCodeUnchanged,true);
  assert.throws(()=>compareLikeControllerSources(current.replace("response.status === 204","response.status === 200"),tested));
  assert.throws(()=>compareLikeControllerSources(current.replace('window.fetch(url','window.fetch(base'),tested));
});
