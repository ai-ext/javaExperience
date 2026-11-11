import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';

test('로컬 실행기는 실제 HTTP 메서드·본문·오류·쿠키를 전달한다', async (t) => {
  const {createCourseServer} = await import('./server.mjs');
  const received=[];
  const backend=createServer(async(req,res)=>{
    const chunks=[]; for await (const part of req) chunks.push(part);
    received.push({url:req.url,method:req.method,body:Buffer.concat(chunks).toString(),cookie:req.headers.cookie,csrf:req.headers['x-csrf-token']});
    if(req.url==='/partial'){
      res.writeHead(200,{'Content-Type':'application/json','Content-Length':1000});res.flushHeaders();res.write('{');
      setTimeout(()=>res.destroy(),10);return;
    }
    if(req.url==='/redirect'){res.writeHead(302,{Location:'http://outside.test/'});res.end();return;}
    res.setHeader('Content-Type','application/json');
    res.setHeader('Set-Cookie','JSESSIONID=fixture; HttpOnly; Path=/; SameSite=Lax');
    res.writeHead(req.url==='/missing'?404:201);res.end(JSON.stringify({id:42}));
  });
  backend.listen(0,'127.0.0.1');await once(backend,'listening');
  const app=createCourseServer({target:`http://127.0.0.1:${backend.address().port}`});
  app.listen(0,'127.0.0.1');await once(app,'listening');
  t.after(()=>{app.closeAllConnections();app.close();backend.closeAllConnections();backend.close();});
  const base=`http://127.0.0.1:${app.address().port}`;
  assert.equal((await fetch(base,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,200,'새 탭의 최초 문서 탐색은 허용한다');
  const response=await fetch(`${base}/__api/api/posts?x=1`,{method:'POST',headers:{'Content-Type':'application/json',Cookie:'JSESSIONID=fixture','X-CSRF-TOKEN':'csrf-fixture',Origin:base},body:'{"title":"한글 공지"}'});
  assert.equal(response.status,201);assert.equal((await response.json()).id,42);
  assert.match(response.headers.get('set-cookie'), /Path=\/__api/);
  assert.deepEqual(received[0],{url:'/api/posts?x=1',method:'POST',body:'{"title":"한글 공지"}',cookie:'JSESSIONID=fixture',csrf:'csrf-fixture'});
  assert.equal((await fetch(`${base}/__api/missing`)).status,404);
  const partial=await fetch(`${base}/__api/partial`);
  assert.equal(partial.status,502);
  assert.equal(partial.headers.get('x-java-beginner-upstream'),null,'중간 연결 단절은 완성된 API 응답으로 표시하지 않는다');
  assert.equal((await partial.json()).code,'API_CONNECTION_FAILED');
  const redirect=await fetch(`${base}/__api/redirect`,{redirect:'manual'});
  assert.equal(redirect.status,502);
  assert.equal((await fetch(`${base}/__api/api/posts`,{method:'POST',headers:{Origin:'http://outside.test'}})).status,403);
  assert.equal((await fetch(`${base}/build.gradle`)).status,404);
  assert.equal((await fetch(`${base}/__config`)).status,200);
  await new Promise(resolve=>backend.close(resolve));
  const offline=await fetch(`${base}/__api/offline`);
  assert.equal(offline.status,502);assert.equal((await offline.json()).code,'API_CONNECTION_FAILED');
});

test('서비스 과정은 선택한 로컬 프로젝트 서버로 전달하고 대상 URL 파라미터를 upstream에 넘기지 않는다',async(t)=>{
  const {createCourseServer}=await import('./server.mjs');
  let received='';
  const backend=createServer((req,res)=>{received=req.url;res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');});
  backend.listen(0,'127.0.0.1');await once(backend,'listening');
  const app=createCourseServer();app.listen(0,'127.0.0.1');await once(app,'listening');
  t.after(()=>{app.closeAllConnections();app.close();backend.closeAllConnections();backend.close();});
  const base=`http://127.0.0.1:${app.address().port}`;
  const target=`http://127.0.0.1:${backend.address().port}`;
  const response=await fetch(`${base}/__api/api/posts?keyword=한글&__course_target=${encodeURIComponent(target)}`);
  assert.equal(response.status,200);
  assert.equal(received,'/api/posts?keyword=%ED%95%9C%EA%B8%80');
  const rejected=await fetch(`${base}/__api/api/posts?__course_target=${encodeURIComponent('http://example.com')}`);
  assert.equal(rejected.status,400);
  assert.equal((await rejected.json()).code,'INVALID_TARGET');
});

test('실행기 설정 응답은 화면이 실행기를 알아보도록 API 대상 주소를 돌려준다', async (t) => {
  const {createCourseServer} = await import('./server.mjs');
  const runner=createCourseServer({target:'http://127.0.0.1:8081'});
  runner.listen(0,'127.0.0.1'); await once(runner,'listening'); t.after(()=>runner.close());
  const response=await fetch(`http://127.0.0.1:${runner.address().port}/__config`);
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{target:'http://127.0.0.1:8081'},'빈 설정이면 화면이 요청 버튼을 막는다');
});
