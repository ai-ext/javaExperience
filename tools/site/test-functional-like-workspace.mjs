import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderFunctionalLikeWorkspace} from './functional-like-workspace.mjs';
import {getLikeVisualModel} from './functional-like-model.mjs';
import {renderFunctionalWorkspace} from './functional-scenario.mjs';
import {FUNCTIONAL_LIKE_TASKS} from './functional-like-data.mjs';
const controller=readFileSync(new URL('./functional-scenario.js',import.meta.url),'utf8');
const key='javaExperience.functional.like.capturedId.v1';
const baseKey='javaExperience.functional.like.serverBase.v1';
const tick=()=>new Promise(r=>setTimeout(r,0));
function mount(id='like',{storedLikeId,fetch}={}) {
  const dom=new JSDOM(renderFunctionalLikeWorkspace({task:id}),{url:`http://learning.test/scenario/flow/${id}-post.html`,runScripts:'outside-only'});
  const w=dom.window;w.sessionStorage.setItem('javaExperience.functional.capturedId.v1','88');
  w.sessionStorage.setItem('javaExperience.functional.serverBase.v1','http://localhost:8080');
  if(storedLikeId){w.sessionStorage.setItem(key,storedLikeId);w.sessionStorage.setItem(baseKey,'http://localhost:8080');}
  w.fetch=fetch||(()=>{throw new Error('선택만으로 전송하면 안 됨');});w.eval(controller);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {dom,w,d:w.document};
}
test('두 작업은 실제 시작 메서드·추가자료·본문 없는 요청과 명시적 자기확인을 제공한다',()=>{
  for(const id of ['like','unlike']) {
    const html=renderFunctionalLikeWorkspace({task:id});const dom=new JSDOM(html);const d=dom.window.document;
    assert.equal(d.querySelector('h1').textContent,id==='like'?'좋아요 설정':'좋아요 취소');
    assert.ok(d.querySelector('.fw-code-panel code').textContent.includes('UnsupportedOperationException'));
    assert.ok(d.querySelector('[href$="like-extension.zip"]'));
    assert.equal(d.querySelector('[data-fw-body]'),null);
    assert.ok(d.querySelector('[data-fw-send]').disabled);
    assert.ok(d.querySelector('[data-fw-id]').required);
    assert.equal(d.querySelectorAll('[data-fw-check]').length,4);
    assert.equal(JSON.parse(d.querySelector('[data-fw-data]').textContent).captureScope,'like');
    dom.window.close();
  }
});
test('시각 자료6시점의 카운터·관계행·외부관찰은 순수 모델 값과 일치한다',()=>{
  for(const [id,method] of [['like','PUT'],['unlike','DELETE']]) {
    const dom=new JSDOM(renderFunctionalLikeWorkspace({task:id}));const d=dom.window.document;
    for(const phase of ['before','service','flushed','commit','repeat','rollback']) {
      const m=getLikeVisualModel({method,phase});const panel=d.querySelector(`[data-like-phase="${phase}"]`);
      assert.equal(panel.querySelector('[data-like-java-count]').textContent,String(m.java.post.likeCount));
      assert.equal(panel.querySelectorAll('[data-like-observer-row]').length,m.observer.post_like.length);
      assert.equal(panel.querySelector('[data-like-observer-count]').textContent,String(m.observer.post.like_count));
      assert.equal(panel.querySelectorAll('[data-like-app-row]').length,m.appDatabase?.post_like.length||0);
      assert.ok(panel.textContent.includes('실제 서버 미실행'));
    }
    assert.equal(d.querySelectorAll('#fw-request').length,1);dom.window.close();
  }
});
test('준비 조건은 닫힌 상태에도 보이고 정확한 구현 지시는 별도로 보존한다',()=>{
  for(const task of FUNCTIONAL_LIKE_TASKS) {
    const dom=new JSDOM(renderFunctionalLikeWorkspace({task}));const d=dom.window.document;
    const setup=d.querySelector('details#functional-setup');
    assert.ok(setup.classList.contains('flv-preparation'));
    assert.ok(setup.querySelector('summary [data-like-prep-note]'));
    assert.equal(setup.querySelectorAll('summary a,summary button,summary input').length,0);
    assert.equal(d.querySelectorAll('.fw-actions>li').length,3);
    for(const action of task.actions)assert.ok(d.querySelector('.flv-implementation-guide').textContent.includes(action));
    assert.equal(d.querySelector('[data-fw-form]').closest('details'),null);
    assert.equal(d.querySelectorAll('[data-fw-begin]').length,1);dom.window.close();
  }
});
test('이미 같은 준비 hash에 있어도 도움말 링크를 다시 누르면 안내를 연다',async()=>{
  for(const id of ['like','unlike']) {
    const e=mount(id,{storedLikeId:'42'});e.w.location.hash='#functional-setup';await tick();
    const details=e.d.querySelector('#functional-setup');assert.equal(details.open,true);details.open=false;
    const token=e.d.querySelector('[data-fw-token]');token.value='manual-fixture';
    const link=e.d.querySelector('.fw-setup-link');link.addEventListener('click',event=>event.preventDefault());link.click();await tick();
    assert.equal(details.open,true);assert.equal(token.value,'manual-fixture');assert.equal(e.d.querySelector('[data-fw-id]').value,'42');
    assert.equal(e.d.querySelector('[data-fw-status]').textContent,'미실행');e.dom.window.close();
  }
});
test('기존 CRUD id를 자동 채우지 않고 좋아요 성공 id만 별도 범위로 이어간다',async()=>{
  let request;
  const e=mount('like',{fetch:async(url,init)=>{request={url,init};return {status:200,headers:{get:()=>null},text:async()=>'{"postId":42,"liked":true,"likeCount":3}'};}});
  assert.equal(e.d.querySelector('[data-fw-id]').value,'');
  e.d.querySelector('[data-fw-id]').value='42';e.d.querySelector('[data-fw-token]').value='fixture-manual';
  e.d.querySelector('[data-fw-form]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
  assert.equal(request.init.method,'PUT');assert.equal(request.init.body,undefined);
  assert.equal(e.w.sessionStorage.getItem(key),'42');
  assert.equal(e.w.sessionStorage.getItem('javaExperience.functional.capturedId.v1'),'88');
  assert.ok(![...Array(e.w.sessionStorage.length).keys()].map(i=>e.w.sessionStorage.getItem(e.w.sessionStorage.key(i))).some(v=>v.includes('fixture-manual')));
  e.dom.window.close();
  const next=mount('unlike',{storedLikeId:'42'});assert.equal(next.d.querySelector('[data-fw-id]').value,'42');assert.equal(next.d.querySelector('[data-fw-token]').value,'');next.dom.window.close();
});
test('실패하거나 postId가 다른 응답을 유효한 id로 저장하지 않는다',async()=>{
  for(const [status,body] of [[404,'{}'],[200,'{"postId":99,"liked":true,"likeCount":3}']]) {
    const e=mount('like',{fetch:async()=>({status,headers:{get:()=>null},text:async()=>body})});
    e.d.querySelector('[data-fw-id]').value='42';e.d.querySelector('[data-fw-token]').value='fixture-manual';
    e.d.querySelector('[data-fw-form]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
    assert.equal(e.w.sessionStorage.getItem(key),null);assert.ok(e.d.querySelector('[data-fw-response]').textContent.endsWith('\n\n'+body));e.dom.window.close();
  }
});
test('비교 조작과 키 이동은 전송·폼·진도·저장된 id를 바꾸지 않는다',()=>{
  const e=mount();const before=e.w.sessionStorage.getItem('javaExperience.functional.capturedId.v1');
  const first=e.d.querySelector('[data-fw-state]');first.dispatchEvent(new e.w.KeyboardEvent('keydown',{key:'End',bubbles:true}));
  assert.equal(e.d.querySelector('[data-fw-state="like-rollback"]').getAttribute('aria-selected'),'true');
  assert.equal(e.d.querySelector('[data-fw-status]').textContent,'미실행');
  assert.equal(e.d.querySelectorAll('[data-fw-check]:checked').length,0);
  assert.equal(e.w.sessionStorage.getItem('javaExperience.functional.capturedId.v1'),before);e.dom.window.close();
});

function mountDelete({status=204,likeId='22',likeBase='http://localhost:8080',fetch}={}) {
  const dom=new JSDOM(renderFunctionalWorkspace({task:'delete'}),{url:'http://learning.test/scenario/flow/delete-post.html',runScripts:'outside-only'});
  const w=dom.window;
  w.sessionStorage.setItem('javaExperience.functional.capturedId.v1','22');
  w.sessionStorage.setItem('javaExperience.functional.serverBase.v1','http://localhost:8080');
  w.sessionStorage.setItem(key,likeId);w.sessionStorage.setItem(baseKey,likeBase);
  w.fetch=fetch|| (async()=>({status,headers:{get:()=>null},text:async()=>status===204?'':'{"status":403}'}));
  w.eval(controller);w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {dom,w,d:w.document};
}
test('확정한 글 삭제는 같은 서버·같은 좋아요 id만 해제하고 CRUD 확인 id는 유지한다',async()=>{
  for(const opts of [{expected:null},{likeId:'23',expected:'23'},{likeBase:'http://localhost:8081',expected:'22'},{status:403,expected:'22'}]) {
    const e=mountDelete(opts);
    e.d.querySelector('[data-fw-form]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));await tick();
    assert.equal(e.w.sessionStorage.getItem(key),opts.expected);
    assert.equal(e.w.sessionStorage.getItem(baseKey),opts.likeBase||'http://localhost:8080');
    assert.equal(e.w.sessionStorage.getItem('javaExperience.functional.capturedId.v1'),'22');
    assert.equal(e.d.querySelectorAll('[data-fw-check]:checked').length,0);e.dom.window.close();
  }
});
test('전송 중 입력을 바꿔도 실제 삭제 응답의 원래 id만 해제하고 새 입력은 보존한다',async()=>{
  let resolveReply;
  const e=mountDelete({fetch:()=>new Promise(resolve=>{resolveReply=resolve;})});
  e.d.querySelector('[data-fw-form]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));
  const input=e.d.querySelector('[data-fw-id]');input.value='23';input.dispatchEvent(new e.w.Event('input',{bubbles:true}));
  resolveReply({status:204,headers:{get:()=>null},text:async()=>''});await tick();
  assert.equal(e.w.sessionStorage.getItem(key),null);
  assert.equal(input.value,'23');
  assert.match(e.d.querySelector('[data-fw-status]').textContent,/입력이 바뀌어/);e.dom.window.close();
});
