import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {COURSE_API_CONTRACTS,contractsForStep,readCreatedPostId,makeRequest,evaluateApiResponse} from './course-api-contracts.mjs';
import {renderCourseApiWorkspace} from './course-api-workspace.mjs';

test('main v2의8계약을 실제 구현 순서와 빈 성공 본문에 연결한다',()=>{
  assert.equal(COURSE_API_CONTRACTS.length,8);
  assert.deepEqual(contractsForStep('D04-5').map(c=>c.id),['create']);
  assert.deepEqual(contractsForStep('D05-2').map(c=>c.id),['replace','partial','delete']);
  assert.deepEqual(contractsForStep('D05-6').map(c=>c.id),['like','unlike']);
  assert.equal(contractsForStep('D04-1').length,0);
  assert.equal(contractsForStep('constructor').length,0);
  for(const id of ['like','unlike','delete'])assert.equal(COURSE_API_CONTRACTS.find(c=>c.id===id).expectedStatus,204);
  assert.equal(COURSE_API_CONTRACTS.find(c=>c.id==='create').expectedStatus,201);
});
test('Location의 같은origin·정확한글경로에서만 문자열id를 받는다',()=>{
  const url='http://localhost:8080/api/posts';
  assert.equal(readCreatedPostId('/api/posts/42',url),'42');
  assert.equal(readCreatedPostId('http://localhost:8080/api/posts/9007199254740993',url),'9007199254740993');
  for(const value of [null,'','/api/posts/0','/api/posts/042','//evil.test/api/posts/42','/api/members/42','/api/posts/42?x=1','/api/posts/42#x'])assert.equal(readCreatedPostId(value,url),null);
});
test('커서조건만URL에넣고token/body는요청에만둔다',()=>{
  const c=COURSE_API_CONTRACTS.find(c=>c.id==='list');
  const r=makeRequest(c,{base:'http://localhost:8080/',query:{cursor:'MjI+/=',size:'20',keyword:'테스트',tag:'spring',sort:'latest',page:'4'},token:'manual-token'});
  const u=new URL(r.url);assert.equal(u.searchParams.get('cursor'),'MjI+/=');assert.equal(u.searchParams.has('page'),false);assert.equal(u.searchParams.has('token'),false);assert.equal(r.headers.Authorization,'Bearer manual-token');assert.equal(r.body,undefined);
  const post=makeRequest(COURSE_API_CONTRACTS.find(c=>c.id==='create'),{base:'http://localhost:8080',body:'{"title":""}',token:'manual-token'});assert.equal(post.body,'{"title":""}');
});
test('201/204의빈본문과실제오류를구별하고JSONid를추정하지않는다',()=>{
  const c=id=>COURSE_API_CONTRACTS.find(c=>c.id===id);
  const input={status:201,body:'',location:'/api/posts/42',requestUrl:'http://localhost:8080/api/posts'};
  assert.equal(evaluateApiResponse(c('create'),input).createdId,'42');
  assert.equal(evaluateApiResponse(c('create'),{...input,location:null}).createdId,null);
  assert.equal(evaluateApiResponse(c('create'),{...input,location:null,body:'{"id":42}'}).createdId,null);
  assert.equal(evaluateApiResponse(c('like'),{status:204,body:'',requestUrl:'http://localhost:8080/api/posts/42/like'}).bodyMatches,true);
  assert.equal(evaluateApiResponse(c('like'),{status:200,body:'{"liked":true}'}).statusMatches,false);
  assert.equal(evaluateApiResponse(c('create'),{...input,status:400}).createdId,null);
});
test('API도구는선택적으로열고main구현체크와독립된DOM이다',()=>{
  for(const id of ['D04-5','D05-1','D05-2','D05-6','D06-4']){
    const dom=new JSDOM(renderCourseApiWorkspace({stepId:id}));const d=dom.window.document;
    assert.equal(d.querySelectorAll('[data-ca-root]').length,1);
    assert.ok(d.querySelector('[data-ca-root] summary'));
    assert.equal(d.querySelector('[data-ca-send]').disabled,true);
    assert.equal(d.querySelector('[data-ca-token]').type,'password');
    assert.equal(d.querySelectorAll('[data-step],.step-check').length,0);
    assert.equal(d.querySelectorAll('input[name],textarea[name],select[name]').length,0);
    assert.equal(d.querySelector('[data-ca-status]').textContent,'미실행');
    assert.ok(d.querySelector('[data-ca-sql]'));dom.window.close();
  }
  assert.equal(renderCourseApiWorkspace({stepId:'D03-1'}),'');
});
