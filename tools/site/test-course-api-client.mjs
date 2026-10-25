import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderCourseApiWorkspace} from './course-api-workspace.mjs';
import {mountCourseApiTools} from './course-api-client.mjs';
import {spawnSync} from 'node:child_process';

const contextKey='javaexperience.course.api-context.v1';
const progressKey='javaexperience.course.progress.v1';
const tick=()=>new Promise(r=>setTimeout(r,0));
const reply=(status,body='',headers={})=>({status,headers:new Headers(headers),text:async()=>body});
function mount(stepId='D04-5',{fetchImpl,stored,storage,clipboard}={}){
  const dom=new JSDOM('<input class="step-check" data-step="D04-5" type="checkbox" checked>'+renderCourseApiWorkspace({stepId}),{url:'http://localhost:3000/course/spring/D04.html'});
  const w=dom.window,d=w.document;w.sessionStorage.setItem(progressKey,'original-progress');
  if(stored)w.sessionStorage.setItem(contextKey,JSON.stringify(stored));
  const options={fetchImpl:fetchImpl||(()=>{throw Error('초기화만으로 전송하면 안 됨');}),clipboard:clipboard||{writeText:async()=>{}}};
  if(storage!==undefined)options.storage=storage;
  mountCourseApiTools(d,options);
  const input=(name,value)=>{const e=d.querySelector('[data-ca-'+name+']');e.value=value;e.dispatchEvent(new w.Event('input',{bubbles:true}));return e;};
  const choose=id=>{const e=d.querySelector('[data-ca-contract]');e.value=id;e.dispatchEvent(new w.Event('change',{bubbles:true}));};
  const send=()=>d.querySelector('[data-ca-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  return {dom,w,d,input,choose,send};
}
test('전송할 때만 호출하고201 빈본문 Location으로만 id를 이어가며 토큰/진도는 저장하지 않는다',async()=>{
  const calls=[];const e=mount('D04-5',{fetchImpl:async(url,init)=>{calls.push({url,init});return reply(201,'',{Location:'/api/posts/42'});}});
  assert.equal(calls.length,0);e.input('token','fixture-token');e.input('body','{"title":"first","content":"text"}');
  assert.equal(calls.length,0);e.send();await tick();
  assert.equal(calls.length,1);assert.equal(calls[0].init.method,'POST');assert.equal(calls[0].init.headers.Authorization,'Bearer fixture-token');
  const saved=JSON.parse(e.w.sessionStorage.getItem(contextKey));assert.equal(saved.id,'42');assert.equal(saved.base,'http://localhost:8080');assert.equal(saved.provenance,'location');
  assert.equal(e.d.querySelector('[data-ca-id]').value,'42');
  assert.equal(e.d.querySelector('[data-ca-response]').textContent,'');
  assert.equal(e.w.sessionStorage.getItem(progressKey),'original-progress');assert.equal(e.d.querySelector('.step-check').checked,true);
  assert.ok(!e.w.sessionStorage.getItem(contextKey).includes('fixture-token'));e.dom.window.close();
});
test('Location을 못 읽으면 JSON id를 만들지 않고 명시적으로 확인한 id만 수동 연결한다',async()=>{
  const e=mount('D04-5',{fetchImpl:async()=>reply(201)});e.send();await tick();
  assert.equal(e.w.sessionStorage.getItem(contextKey),null);assert.match(e.d.querySelector('[data-ca-verdict]').textContent,/Location/);
  e.input('id','55');e.d.querySelector('[data-ca-remember]').click();
  const saved=JSON.parse(e.w.sessionStorage.getItem(contextKey));assert.equal(saved.id,'55');assert.equal(saved.provenance,'manual');
  assert.match(e.d.querySelector('[data-ca-context]').textContent,/수동|직접|입력/);e.dom.window.close();
});
test('API 선택은 전송 없이 초안을 복원하고 마지막 실제 응답을 원문으로 보존한다',async()=>{
  let count=0;const raw='{"id":42,"title":"<img src=x>","content":"text","tags":[]}\n';
  const e=mount('D05-2',{fetchImpl:async()=>{count++;return reply(200,raw);}});e.input('id','42');e.input('token','fixture');e.input('body','{"title":"custom","content":"my text"}');
  e.send();await tick();assert.equal(count,1);assert.equal(e.d.querySelector('[data-ca-response]').textContent,raw);assert.equal(e.d.querySelectorAll('img').length,0);
  e.choose('partial');e.choose('replace');assert.equal(count,1);assert.equal(e.d.querySelector('[data-ca-body]').value,'{"title":"custom","content":"my text"}');
  assert.equal(e.d.querySelector('[data-ca-response]').textContent,raw);assert.equal(e.d.querySelector('[data-ca-token]').value,'fixture');e.dom.window.close();
});
test('좋아요취소204는 글id를 유지하며 글삭제204는 같은서버·같은id만 해제한다',async()=>{
  const stored={version:1,base:'http://localhost:8080',id:'42',provenance:'manual'};
  const u=mount('D05-6',{stored,fetchImpl:async()=>reply(204)});u.choose('unlike');u.send();await tick();assert.equal(JSON.parse(u.w.sessionStorage.getItem(contextKey)).id,'42');u.dom.window.close();
  const e=mount('D05-2',{stored,fetchImpl:async()=>reply(204)});e.choose('delete');e.send();await tick();assert.equal(e.w.sessionStorage.getItem(contextKey),null);assert.equal(e.d.querySelector('[data-ca-id]').value,'');e.dom.window.close();
});
test('요청중 입력이 바뀐 생성응답은 새컨텍스트를 덮지 않고 삭제도 전송snapshot으로만 해제한다',async()=>{
  let resolve;const e=mount('D04-5',{fetchImpl:()=>new Promise(r=>{resolve=r;})});e.send();e.input('base','http://localhost:8081');e.input('id','99');e.d.querySelector('[data-ca-remember]').click();resolve(reply(201,'',{Location:'/api/posts/42'}));await tick();
  assert.equal(JSON.parse(e.w.sessionStorage.getItem(contextKey)).id,'99');assert.equal(e.d.querySelector('[data-ca-id]').value,'99');assert.match(e.d.querySelector('[data-ca-sent-request]').textContent,/localhost:8080/);e.dom.window.close();
  let finish;const f=mount('D05-2',{stored:{version:1,base:'http://localhost:8080',id:'42',provenance:'location'},fetchImpl:()=>new Promise(r=>{finish=r;})});f.choose('delete');f.send();f.input('id','99');f.d.querySelector('[data-ca-remember]').click();finish(reply(204));await tick();assert.equal(JSON.parse(f.w.sessionStorage.getItem(contextKey)).id,'99');assert.equal(f.d.querySelector('[data-ca-id]').value,'99');f.dom.window.close();
});
test('저장소·클립보드가 막혀도 요청과 명시적 복사 대체란이 동작하고 자동전송은 없다',async()=>{
  let calls=0;const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}};
  const e=mount('D05-6',{storage:blocked,clipboard:{writeText:async()=>{throw Error('denied');}},fetchImpl:async()=>{calls++;return reply(204);}});e.input('id','42');e.input('token','fixture-only');e.d.querySelector('[data-ca-copy]').click();await tick();assert.equal(calls,0);
  assert.equal(e.d.querySelector('[data-ca-fallback]').hidden,false);assert.match(e.d.querySelector('[data-ca-curl]').value,/Authorization/);
  e.send();await tick();assert.equal(calls,1);e.dom.window.close();
});
test('이중 mount와 실패 응답은 중복 전송·유효id 기록을 만들지 않는다',async()=>{
  let count=0;const fetchImpl=async()=>{count++;return reply(400,'{"detail":"bad input"}');};const e=mount('D04-5',{fetchImpl});mountCourseApiTools(e.d,{fetchImpl});e.send();await tick();assert.equal(count,1);assert.equal(e.w.sessionStorage.getItem(contextKey),null);assert.equal(e.d.querySelector('[data-ca-response]').textContent,'{"detail":"bad input"}');e.dom.window.close();
});
test('다음 문서에서 기본 포트가 아닌 실제 서버를 복원하고 다른 문서의 메모리를 섞지 않는다',()=>{
  const a=mount('D05-1',{stored:{version:1,base:'http://localhost:49123',id:'42',provenance:'manual'}});
  assert.equal(a.d.querySelector('[data-ca-base]').value,'http://localhost:49123');
  assert.equal(a.d.querySelector('[data-ca-id]').value,'42');
  const b=mount('D05-1');assert.equal(b.d.querySelector('[data-ca-id]').value,'');a.dom.window.close();b.dom.window.close();
});
test('직접 바꾼 id는 표시 SQL에도 즉시 반영되어 다른 글을 조회하지 않게 한다',()=>{
  const e=mount('D05-1',{stored:{version:1,base:'http://localhost:8080',id:'42',provenance:'manual'}});
  e.input('id','99');const sql=e.d.querySelector('[data-ca-sql]').textContent;assert.match(sql,/WHERE id = 99/);assert.doesNotMatch(sql,/WHERE id = 42/);e.dom.window.close();
});
test('새 요청의 네트워크 실패를 이전 성공 응답으로 표시하지 않는다',async()=>{
  let count=0;const raw='{"id":42,"title":"old","content":"text","tags":[]}';
  const e=mount('D05-1',{fetchImpl:async()=>{if(count++===0)return reply(200,raw);throw Error('offline');}});e.input('id','42');e.send();await tick();e.send();await tick();
  assert.doesNotMatch(e.d.querySelector('[data-ca-status]').textContent,/HTTP 200/);assert.notEqual(e.d.querySelector('[data-ca-response]').textContent,raw);assert.match(e.d.querySelector('[data-ca-feedback]').textContent,/offline|네트워크/);e.dom.window.close();
});
test('복사한 curl은 작은따옴표가 든 JSON과 토큰도 원래 인자로 파싱된다',async()=>{
  let copied;const body=JSON.stringify({title:"it's a test",content:'$HOME `literal`'});const token="fixture'quoted";
  const e=mount('D04-5',{clipboard:{writeText:async text=>{copied=text;}}});e.input('token',token);e.input('body',body);e.d.querySelector('[data-ca-copy]').click();await tick();
  const parsed=spawnSync('python3',['-c','import sys,shlex,json;print(json.dumps(shlex.split(sys.stdin.read())))'],{input:copied,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
  const args=JSON.parse(parsed.stdout);assert.equal(args[args.indexOf('--data-raw')+1],body);assert.ok(args.includes('Authorization: Bearer '+token));e.dom.window.close();
});
test('저장소 자체가 없는 환경에서도 수동 연결은 유지하되 저장되지 않았음을 알린다',()=>{
  const e=mount('D05-1',{storage:null});e.input('id','42');e.d.querySelector('[data-ca-remember]').click();
  assert.match(e.d.querySelector('[data-ca-context]').textContent,/42/);
  assert.match(e.d.querySelector('[data-ca-storage]').textContent,/저장소|이 화면/);e.dom.window.close();
});
