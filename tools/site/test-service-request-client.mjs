import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderServiceRequestTool} from './service-request-renderer.mjs';
import {mountServiceRequestTools} from './service-request-client.mjs';

const recipe = {id:'create',project:'board',label:'글 등록',method:'POST',path:'/api/posts',bodyKind:'json',body:{title:'샘플'},expected:{statuses:[201],bodyMode:'empty'},capture:{key:'postId',locationPattern:'/api/posts/{postId}'}};
const response = (status, body, headers={}) => ({status, text:async()=>body, headers:new Headers(headers)});

test('명시적 전송은 실제 응답과 Location 자원 ID만 session에 연결한다', async () => {
  const dom = new JSDOM(renderServiceRequestTool({scopeKey:'test',project:'board',recipes:[recipe]}), {url:'http://localhost:3000'});
  const doc = dom.window.document;
  const calls = [];
  const [mounted] = mountServiceRequestTools(doc, {fetchImpl:async(url,init)=>{calls.push({url,init});return response(201,'',{location:'/api/posts/42'});},now:(()=>{let n=0;return()=>++n;})()});
  const root=doc.querySelector('[data-srq-root]');
  assert.equal(calls.length,0);
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  root.querySelector('[data-srq-base]').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  root.querySelector('[data-srq-token]').value='secret-token';
  root.querySelector('[data-srq-body]').value='{"title":"실제 입력"}';
  await mounted.sendRequest();
  assert.equal(calls.length,1);
  assert.equal(calls[0].init.credentials,'omit');
  assert.equal(calls[0].init.headers.Authorization,'Bearer secret-token');
  assert.ok(!root.querySelector('[data-srq-curl]').value.includes('secret-token'));
  root.querySelector('[data-srq-curl-token]').checked=true;
  root.querySelector('[data-srq-curl-token]').dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  assert.ok(root.querySelector('[data-srq-curl]').value.includes('secret-token'));
  assert.equal(root.querySelector('[data-srq-actual-status]').textContent,'201');
  assert.equal(root.querySelector('[data-srq-response-body]').textContent,'');
  assert.equal(root.querySelector('[data-srq-resource-id]').value,'42');
  const storage=dom.window.sessionStorage;
  assert.equal(storage.length,1);
  assert.equal(storage.getItem(storage.key(0)),'42');
  assert.ok(!storage.getItem(storage.key(0)).includes('secret-token'));
  assert.equal(dom.window.localStorage.length,0);
  dom.window.close();
});

test('session recipe는 명시한 credentials를 사용하고 쿠키 값을 요청 헤더나 저장소로 복사하지 않는다', async () => {
  const sessionRecipe={id:'session-cookie',project:'session-lab',method:'GET',path:'/',bodyKind:'none',credentials:'include',expected:{statuses:[204],bodyMode:'empty'}};
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'session',project:'session-lab',recipes:[sessionRecipe]}),{url:'http://localhost:3000'});
  const doc=dom.window.document,root=doc.querySelector('[data-srq-root]'),calls=[];
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:async(url,init)=>{calls.push({url,init});return response(204,'');}});
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  assert.equal(root.querySelector('[data-srq-cookies]').checked,true);
  await mounted.sendRequest();
  assert.equal(calls[0].init.credentials,'include');
  assert.equal(Object.keys(calls[0].init.headers).some(key=>['cookie','jsessionid'].includes(key.toLowerCase())),false);
  assert.equal(dom.window.sessionStorage.length,0);
  assert.equal(dom.window.localStorage.length,0);
  assert.ok(root.querySelector('[data-srq-cookie-state]').textContent.includes('include'));
  dom.window.close();
});

test('계약 미등록 도구는 method, 경로, 상태를 입력한 뒤에만 전송을 활성화한다', () => {
  const dom = new JSDOM(renderServiceRequestTool({scopeKey:'manual',project:'board',recipes:[]}), {url:'http://localhost:3000'});
  const doc=dom.window.document, root=doc.querySelector('[data-srq-root]');
  let calls=0;
  mountServiceRequestTools(doc,{fetchImpl:async()=>{calls++;return response(400,'{}');}});
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  root.querySelector('[data-srq-bind-method]').value='POST';
  root.querySelector('[data-srq-bind-path]').value='/api/posts';
  root.querySelector('[data-srq-bind-status]').value='201, 400';
  root.querySelector('[data-srq-apply-binding]').click();
  assert.equal(root.querySelector('[data-srq-send]').disabled,false);
  assert.equal(calls,0);
  assert.equal(root.querySelector('[data-srq-path]').value,'/api/posts');
  dom.window.close();
});

test('binding 계약은 project와 binding key에 저장되어 다른 문서·scope에서 복원된다', () => {
  const bindingRecipe={id:'choice',project:'reservation',label:'예약 생성',binding:{key:'reservation-create-v1',label:'예약 생성',sourceId:'D23'},bodyKind:'json',body:{password:'source-password'},examples:[{body:{password:'example-password'}}],expected:{bodyMode:'json'}};
  const sharedStorage=new JSDOM('',{url:'http://localhost:3000'}).window.localStorage;
  const firstHtml=renderServiceRequestTool({scopeKey:'D23',project:'reservation',recipes:[bindingRecipe]});
  assert.ok(!firstHtml.includes('source-password'));
  assert.ok(!firstHtml.includes('example-password'));
  const first=new JSDOM(firstHtml,{url:'http://localhost:3000'});
  const firstRoot=first.window.document.querySelector('[data-srq-root]');
  mountServiceRequestTools(first.window.document,{contractStorage:sharedStorage});
  assert.equal(firstRoot.querySelector('[data-srq-send]').disabled,true);
  assert.equal(firstRoot.querySelector('[data-srq-method]').value,'');
  assert.equal(firstRoot.querySelector('[data-srq-path]').value,'');
  assert.equal(firstRoot.querySelector('[data-srq-body]').value,'');
  firstRoot.querySelector('[data-srq-bind-method]').value='POST';
  firstRoot.querySelector('[data-srq-bind-path]').value='/';
  firstRoot.querySelector('[data-srq-bind-status]').value='201';
  firstRoot.querySelector('[data-srq-bind-fields]').value='id, reservation.id';
  firstRoot.querySelector('[data-srq-base]').value='http://localhost:8080';
  firstRoot.querySelector('[data-srq-body]').value='{"password":"fixture stays in memory"}';
  firstRoot.querySelector('[data-srq-token]').value='token-never-save';
  firstRoot.querySelector('[data-srq-apply-binding]').click();
  const saved=JSON.parse(sharedStorage.getItem('javaexperience.service.contracts.v1:reservation:reservation-create-v1'));
  assert.deepEqual(saved,{method:'POST',path:'/',statuses:[201],fields:['id','reservation.id']});
  assert.ok(!JSON.stringify(saved).includes('fixture stays in memory'));
  assert.ok(!JSON.stringify(saved).includes('token-never-save'));

  const next=new JSDOM(renderServiceRequestTool({scopeKey:'D25',project:'reservation',recipes:[bindingRecipe]}),{url:'http://localhost:3000'});
  const nextRoot=next.window.document.querySelector('[data-srq-root]');
  mountServiceRequestTools(next.window.document,{contractStorage:sharedStorage});
  assert.equal(nextRoot.querySelector('[data-srq-method]').value,'POST');
  assert.equal(nextRoot.querySelector('[data-srq-path]').value,'/');
  assert.equal(nextRoot.querySelector('[data-srq-bind-fields]').value,'id, reservation.id');
  assert.equal(nextRoot.querySelector('[data-srq-body]').value,'');
  assert.equal(nextRoot.querySelector('[data-srq-token]').value,'');
  assert.ok(nextRoot.querySelector('[data-srq-expected]').textContent.includes('내 프로젝트에서 정한 계약'));
  first.window.close(); next.window.close();
});

test('binding 등록은 절대 URL·query 문자열·안전하지 않은 필드 경로를 저장하지 않는다', () => {
  const bindingRecipe={id:'choice',project:'project',binding:{key:'reservation-create-v1',label:'예약 생성',sourceId:'D23'},expected:{bodyMode:'any'}};
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'invalid',project:'project',recipes:[bindingRecipe]}),{url:'http://localhost:3000'});
  const root=dom.window.document.querySelector('[data-srq-root]'),storage=dom.window.localStorage;
  mountServiceRequestTools(dom.window.document);
  root.querySelector('[data-srq-bind-method]').value='POST';
  root.querySelector('[data-srq-bind-path]').value='https://localhost/api?token=secret';
  root.querySelector('[data-srq-bind-status]').value='201';
  root.querySelector('[data-srq-bind-fields]').value='constructor.prototype';
  root.querySelector('[data-srq-apply-binding]').click();
  assert.equal(storage.length,0);
  assert.equal(root.querySelector('[data-srq-send]').disabled,true);
  assert.ok(root.querySelector('[data-srq-status]').textContent.includes('상대경로'));
  dom.window.close();
});

test('binding 정의는 다른 project에서 섞이지 않고 storage 실패 때 현재 문서 메모리로 복원된다', () => {
  const recipe=(project)=>({id:'choice',project,binding:{key:'reservation-create-v2',label:'예약 등록',sourceId:'D23'},expected:{bodyMode:'any'}});
  const sharedStorage=new JSDOM('',{url:'http://localhost:3000'}).window.localStorage;
  const first=new JSDOM(renderServiceRequestTool({scopeKey:'a',project:'project-a',recipes:[recipe('project-a')]}),{url:'http://localhost:3000'});
  const rootA=first.window.document.querySelector('[data-srq-root]');
  mountServiceRequestTools(first.window.document,{contractStorage:sharedStorage});
  rootA.querySelector('[data-srq-bind-method]').value='GET'; rootA.querySelector('[data-srq-bind-path]').value='/'; rootA.querySelector('[data-srq-bind-status]').value='200';
  rootA.querySelector('[data-srq-apply-binding]').click();
  const other=new JSDOM(renderServiceRequestTool({scopeKey:'b',project:'project-b',recipes:[recipe('project-b')]}),{url:'http://localhost:3000'});
  mountServiceRequestTools(other.window.document,{contractStorage:sharedStorage});
  assert.equal(other.window.document.querySelector('[data-srq-path]').value,'');

  const unavailable={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');},removeItem(){throw new Error('blocked');}};
  const fallbackRecipe=recipe('same-memory-project');
  const memoryOne=new JSDOM(renderServiceRequestTool({scopeKey:'first',project:'same-memory-project',recipes:[fallbackRecipe]}),{url:'http://localhost:3000'});
  const memoryRoot=memoryOne.window.document.querySelector('[data-srq-root]');
  mountServiceRequestTools(memoryOne.window.document,{contractStorage:unavailable});
  memoryRoot.querySelector('[data-srq-bind-method]').value='GET'; memoryRoot.querySelector('[data-srq-bind-path]').value='/'; memoryRoot.querySelector('[data-srq-bind-status]').value='200';
  memoryRoot.querySelector('[data-srq-apply-binding]').click();
  const memoryTwo=new JSDOM(renderServiceRequestTool({scopeKey:'second',project:'same-memory-project',recipes:[fallbackRecipe]}),{url:'http://localhost:3000'});
  mountServiceRequestTools(memoryTwo.window.document,{contractStorage:unavailable});
  assert.equal(memoryTwo.window.document.querySelector('[data-srq-method]').value,'GET');
  first.window.close(); other.window.close(); memoryOne.window.close(); memoryTwo.window.close();
});

test('전송 뒤 입력이 달라지면 늦은 응답의 ID를 현재 입력에 저장하지 않는다', async () => {
  const dom = new JSDOM(renderServiceRequestTool({scopeKey:'slow',project:'board',recipes:[recipe]}), {url:'http://localhost:3000'});
  const doc=dom.window.document, root=doc.querySelector('[data-srq-root]');
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  let finish;
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:()=>new Promise(resolve=>{finish=resolve;})});
  const request=mounted.sendRequest();
  root.querySelector('[data-srq-body]').value='{"title":"다른 입력"}';
  root.querySelector('[data-srq-body]').dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  finish(response(201,'',{location:'/api/posts/99'}));
  await request;
  assert.equal(root.querySelector('[data-srq-resource-id]').value,'');
  assert.equal(dom.window.sessionStorage.length,0);
  assert.ok(root.querySelector('[data-srq-snapshot]').textContent.includes('전송 뒤 입력이 변경'));
  dom.window.close();
});

test('컴파일된 template은 설명이 있는 입력값이 채워질 때만 전송하고 본문 원문 형식을 보존한다', async () => {
  const templateRecipe = {
    id:'legacy:3-0:U', project:'community', label:'전체 교체', method:'PUT',
    path:'/api/posts/{{P.body.id}}', pathParams:{}, query:{}, headers:{}, bodyKind:'json',
    body:{id:'{{P.body.id}}', title:'원문'}, expected:{statuses:[200]},
    manualBindings:[{name:'P.body.id',expression:'{{P.body.id}}',locations:['path','body'],required:true}],
    needsInput:['P.body.id'],
  };
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'template',project:'community',recipes:[templateRecipe]}),{url:'http://localhost:3000'});
  const doc=dom.window.document,root=doc.querySelector('[data-srq-root]'),calls=[];
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:async(url,init)=>{calls.push({url,init});return response(200,'{}');}});
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  const send=root.querySelector('[data-srq-send]');
  assert.equal(send.disabled,true);
  assert.match(root.querySelector('[data-srq-status]').textContent,/P\.body\.id/);
  assert.match(root.querySelector('[data-srq-manual-bindings]').textContent,/앞 요청|fixture/);
  const input=root.querySelector('[data-srq-manual-binding="P.body.id"]');
  input.value='42'; input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  const body=root.querySelector('[data-srq-body]');
  body.value=' {\n  "id" : "{{P.body.id}}",\n  "title":"원문"\n} ';
  body.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  assert.equal(send.disabled,false);
  await mounted.sendRequest();
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'http://localhost:8080/api/posts/42');
  assert.equal(calls[0].init.body,' {\n  "id" : "42",\n  "title":"원문"\n} ');
  assert.equal(JSON.parse(calls[0].init.body).id,'42');
  assert.equal(typeof JSON.parse(calls[0].init.body).id,'string');
  assert.ok(!dom.window.sessionStorage.length);
  assert.ok(!dom.window.localStorage.length);
  dom.window.close();
});

test('template 입력이 전송 중 바뀌면 늦은 응답을 현재 입력 snapshot이나 ID에 연결하지 않는다', async () => {
  const templated={...recipe,path:'/api/posts/{{P.body.id}}',manualBindings:[{name:'P.body.id',expression:'{{P.body.id}}',locations:['path']}],needsInput:['P.body.id']};
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'template-slow',project:'board',recipes:[templated]}),{url:'http://localhost:3000'});
  const doc=dom.window.document,root=doc.querySelector('[data-srq-root]');
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  let finish;
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:()=>new Promise(resolve=>{finish=resolve;})});
  root.querySelector('[data-srq-manual-binding="P.body.id"]').value='41';
  const request=mounted.sendRequest();
  const input=root.querySelector('[data-srq-manual-binding="P.body.id"]');
  input.value='42'; input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  finish(response(201,'',{location:'/api/posts/99'}));
  await request;
  assert.equal(root.querySelector('[data-srq-resource-id]').value,'');
  assert.equal(dom.window.sessionStorage.length,0);
  assert.ok(root.querySelector('[data-srq-snapshot]').textContent.includes('전송 뒤 입력이 변경'));
  dom.window.close();
});

test('Authorization template은 자동 복사하지 않고 Bearer 입력만 사용하며 저장하지 않는다', async () => {
  const authRecipe={id:'auth',project:'board',method:'GET',path:'/',bodyKind:'none',headers:{Authorization:'{{LOGIN.header.Authorization}}'},requiresToken:true,expected:{statuses:[200]},manualBindings:[{name:'LOGIN.header.Authorization',expression:'{{LOGIN.header.Authorization}}',locations:['headers']}],needsInput:['LOGIN.header.Authorization']};
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'auth-template',project:'board',recipes:[authRecipe]}),{url:'http://localhost:3000'});
  const doc=dom.window.document,root=doc.querySelector('[data-srq-root]'),calls=[];
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:async(url,init)=>{calls.push({url,init});return response(200,'{}');}});
  assert.equal(root.querySelector('[data-srq-send]').disabled,true);
  assert.equal(root.querySelector('[data-srq-manual-bindings]').hidden,true);
  const token=root.querySelector('[data-srq-token]');
  token.value='manual-bearer'; token.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  await mounted.sendRequest();
  assert.equal(calls[0].init.headers.Authorization,'Bearer manual-bearer');
  assert.ok(!root.querySelector('[data-srq-response-headers]').textContent.includes('manual-bearer'));
  assert.equal(dom.window.sessionStorage.length,0);
  assert.equal(dom.window.localStorage.length,0);
  dom.window.close();
});

test('성공했지만 생성 ID를 캡처하지 못하면 같은 project/server의 오래된 ID만 지운다', async () => {
  const create={id:'create',project:'board',method:'POST',path:'/api/posts',bodyKind:'none',expected:{statuses:[201],bodyMode:'empty'},capture:{key:'postId',locationPattern:'/api/posts/{postId}'}};
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'create-no-location',project:'board',recipes:[create]}),{url:'http://localhost:3000'});
  const doc=dom.window.document,root=doc.querySelector('[data-srq-root]');
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  const storage=dom.window.sessionStorage;
  storage.setItem('javaexperience.service.resources.v1:board:http%3A%2F%2Flocalhost%3A8080:postId','41');
  storage.setItem('javaexperience.service.resources.v1:other-project:http%3A%2F%2Flocalhost%3A8080:postId','77');
  root.querySelector('[data-srq-resource-id]').value='41';
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:async()=>response(201,'')});
  await mounted.sendRequest();
  assert.equal(root.querySelector('[data-srq-resource-id]').value,'');
  assert.equal(storage.getItem('javaexperience.service.resources.v1:board:http%3A%2F%2Flocalhost%3A8080:postId'),null);
  assert.equal(storage.getItem('javaexperience.service.resources.v1:other-project:http%3A%2F%2Flocalhost%3A8080:postId'),'77');
  assert.match(root.querySelector('[data-srq-status]').textContent,/생성 ID를 확인하지 못해 이 project\/server의 기존 postId 값을 지웠습니다/);
  dom.window.close();
});

test('응답 본문 읽기가 끝난 뒤 응답 시간을 계산한다', async () => {
  let now=0;
  const delayed={status:200,headers:new Headers(),text:async()=>{now=125;return 'ok';}};
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'duration',project:'board',recipes:[{id:'get',method:'GET',path:'/',bodyKind:'none',expected:{statuses:[200]}}]}),{url:'http://localhost:3000'});
  const root=dom.window.document.querySelector('[data-srq-root]');
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  const [mounted]=mountServiceRequestTools(dom.window.document,{fetchImpl:async()=>delayed,now:()=>now});
  await mounted.sendRequest();
  assert.equal(root.querySelector('[data-srq-duration]').textContent,'125.0 ms');
  dom.window.close();
});

test('template이 없는 서명용 raw text 본문은 입력한 공백과 개행을 그대로 보낸다', async () => {
  const raw='  {\n\t"signed" : "body"\n}\n';
  const dom=new JSDOM(renderServiceRequestTool({scopeKey:'raw-body',project:'board',recipes:[{id:'signed',method:'POST',path:'/signed',bodyKind:'text',body:'',expected:{statuses:[200]}}]}),{url:'http://localhost:3000'});
  const doc=dom.window.document,root=doc.querySelector('[data-srq-root]');
  root.querySelector('[data-srq-base]').value='http://localhost:8080';
  let sentBody;
  const [mounted]=mountServiceRequestTools(doc,{fetchImpl:async(url,init)=>{sentBody=init.body;return response(200,'ok');}});
  root.querySelector('[data-srq-body]').value=raw;
  await mounted.sendRequest();
  assert.equal(sentBody,raw);
  dom.window.close();
});
