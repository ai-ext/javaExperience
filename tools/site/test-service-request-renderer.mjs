import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderServiceRequestTool} from './service-request-renderer.mjs';
import {mountServiceRequestTools} from './service-request-client.mjs';

test('요청 도구는 전달된 계약만 렌더링하고 전송 전에는 비활성 상태다', () => {
  const recipe = {id:'board-create',label:'게시글 생성',method:'POST',path:'/api/posts',bodyKind:'json',body:{title:'<원문>'},expected:{statuses:[201],bodyMode:'empty'},capture:{key:'postId',locationPattern:'/api/posts/{postId}'}};
  const dom = new JSDOM(renderServiceRequestTool({scopeKey:'stage-1',project:'board',recipes:[recipe]}));
  const root = dom.window.document.querySelector('[data-srq-root]');
  assert.ok(root);
  assert.equal(root.querySelector('[data-srq-send]').disabled, true);
  assert.equal(root.querySelector('[data-srq-method]').value, '');
  assert.ok(root.querySelector('[data-srq-cookies]'));
  assert.ok(root.textContent.includes('Cookie, Host'));
  assert.ok(root.textContent.includes('Network에서 확인'));
  assert.ok(root.textContent.includes('실제 HTTP 요청'));
  assert.ok(root.querySelector('[data-srq-data]').textContent.includes('"/api/posts"'));
  assert.equal(root.querySelectorAll('[data-srq-result]').length, 1);
  dom.window.close();
});

test('recipe의 Authorization raw value는 HTML data에 넣지 않고 token field 입력으로 안내한다', () => {
  const html=renderServiceRequestTool({scopeKey:'auth',project:'board',recipes:[{id:'auth-post',method:'POST',path:'/api/posts',headers:{Authorization:'Bearer do-not-embed'},requiresAuth:true,expected:{statuses:[201],bodyMode:'empty'}}]});
  assert.ok(!html.includes('do-not-embed'));
  assert.ok(!html.includes('Authorization\\":\\"Bearer'));
  const dom=new JSDOM(html),doc=dom.window.document;
  mountServiceRequestTools(doc);
  assert.equal(doc.querySelector('[data-srq-token]').value,'');
  assert.ok(doc.querySelector('[data-srq-status]').textContent.includes('token field'));
  dom.window.close();
});

test('recipe의 Cookie와 Origin 값은 HTML에 복제하지 않는다', () => {
  const html=renderServiceRequestTool({scopeKey:'cookie',recipes:[{id:'cookie-case',method:'GET',path:'/',headers:{Cookie:'JSESSIONID=private-cookie',Origin:'http://spoofed.test'},expected:{statuses:[200],bodyMode:'json'}}]});
  assert.ok(!html.includes('private-cookie'));
  assert.ok(!html.includes('spoofed.test'));
});
