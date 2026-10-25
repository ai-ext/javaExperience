import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildServiceRequest, inspectServiceResponse, captureDeclaredResourceId, resolveManualBindings} from './service-request-model.mjs';

test('요청 빌더가 편집된 path/query/header/body와 토큰을 요청에만 적용한다', () => {
  const recipe = {id:'create',project:'board',method:'POST',path:'/api/posts',bodyKind:'json',body:{title:'예시'},expected:{statuses:[201],bodyMode:'empty'},capture:{key:'postId',locationPattern:'/api/posts/{postId}'}};
  const request = buildServiceRequest(recipe, {base:'http://localhost:8080',path:'/api/posts',pathParams:{},query:{q:'a b'},headers:{'X-Trace':'yes'},bodyText:'{"title":"수정"}',token:'secret'});
  assert.equal(request.url,'http://localhost:8080/api/posts?q=a+b');
  assert.equal(request.init.method,'POST');
  assert.equal(request.init.headers.Authorization,'Bearer secret');
  assert.equal(request.init.headers['X-Trace'],'yes');
  assert.equal(request.init.body,'{"title":"수정"}');
  const malformed = buildServiceRequest(recipe, {base:'http://localhost:8080',path:'/api/posts',bodyText:'{invalid json'});
  assert.equal(malformed.init.body,'{invalid json');
  assert.throws(() => buildServiceRequest({...recipe,path:'/api/posts/{postId}'},{base:'http://localhost:8080',pathParams:{postId:'042'}}), /양의 정수 ID/);
});

test('multipart는 브라우저가 boundary를 넣도록 Content-Type을 설정하지 않는다', () => {
  const recipe = {id:'upload',method:'POST',path:'/upload',bodyKind:'multipart',expected:{statuses:[201],bodyMode:'any'}};
  const file = new Blob(['x'], {type:'text/plain'});
  const request = buildServiceRequest(recipe,{base:'http://localhost:8080',bodyKind:'multipart',fields:{caption:'설명',tag:['a','b']},file,fieldName:'file',FormDataImpl:FormData});
  assert.equal(request.init.headers['Content-Type'],undefined);
  assert.ok(request.init.body instanceof FormData);
  assert.equal(request.init.body.get('caption'),'설명');
  assert.deepEqual(request.init.body.getAll('tag'),['a','b']);
});

test('수동 binding은 요청 위치마다 치환하고 JSON 문자열 ID 타입을 유지한다', () => {
  const recipe = {
    path: '/api/posts/{{P.body.id}}',
    query: { owner: '{{P.body.id}}' },
    headers: { 'X-Source': '{{P.body.id}}' },
    body: { id: '{{P.body.id}}', title: '원문' },
    manualBindings: [{ name: 'P.body.id', expression: '{{P.body.id}}', locations: ['path', 'query', 'headers', 'body'] }],
    needsInput: ['P.body.id'],
  };
  const resolved = resolveManualBindings(recipe, { 'P.body.id': '42' });
  assert.deepEqual(resolved.missing, []);
  assert.equal(resolved.recipe.path, '/api/posts/42');
  assert.deepEqual(resolved.recipe.query, { owner: '42' });
  assert.deepEqual(resolved.recipe.headers, { 'X-Source': '42' });
  assert.deepEqual(resolved.recipe.body, { id: '42', title: '원문' });
  assert.equal(typeof resolved.recipe.body.id, 'string');
  assert.equal(recipe.path, '/api/posts/{{P.body.id}}');
  const raw = resolveManualBindings({body:' { "title" : "{{P.body.id}}" } ', manualBindings:[{name:'P.body.id',expression:'{{P.body.id}}',locations:['body']}]},{'P.body.id':'a"b\\c'},{rawJsonBody:true});
  assert.equal(raw.recipe.body,' { "title" : "a\\"b\\\\c" } ');
});

test('unresolved template은 request builder가 path 외 query, headers, body에서도 거부한다', () => {
  const recipe = {id:'template',method:'POST',path:'/api/posts',bodyKind:'json',expected:{statuses:[201]}};
  for (const options of [
    {query:{id:'{{P.body.id}}'}},
    {headers:{'X-Ref':'{{P.header.Location}}'}},
    {bodyText:'{"id":"{{P.body.id}}"}'},
    {bodyKind:'multipart',fields:{metadata:'{{P.body.id}}'}},
  ]) {
    assert.throws(() => buildServiceRequest(recipe,{base:'http://localhost:8080',...options}), /템플릿 변수/);
  }
  const authenticated=buildServiceRequest({...recipe,headers:{Authorization:'{{X.header.Authorization}}'}},{base:'http://localhost:8080',token:'manual-token'});
  assert.equal(authenticated.init.headers.Authorization,'Bearer manual-token');
});

test('세션 요청은 browser credentials만 선택적으로 포함하고 Cookie·Origin 위조 헤더를 거부한다', () => {
  const recipe = {id:'session',method:'GET',path:'/api/v1/session/me',bodyKind:'none',credentials:'include',expected:{statuses:[200],bodyMode:'json'}};
  assert.equal(buildServiceRequest(recipe,{base:'http://localhost:8080'}).init.credentials,'include');
  assert.equal(buildServiceRequest({...recipe,credentials:'omit'},{base:'http://localhost:8080'}).init.credentials,'omit');
  assert.equal(buildServiceRequest({...recipe,credentials:undefined},{base:'http://localhost:8080'}).init.credentials,'omit');
  for (const header of ['Cookie','JSESSIONID','Origin','Host','Access-Control-Request-Method','access-control-request-headers']) {
    assert.throws(() => buildServiceRequest(recipe,{base:'http://localhost:8080',headers:{[header]:'forged'}}), /브라우저가 관리/);
  }
});

test('응답 성공 판단은 status와 body mode를 분리하고 캡처 ID만 안전하게 반환한다', () => {
  const recipe = {expected:{statuses:[201],bodyMode:'empty'},capture:{key:'postId',locationPattern:'/api/posts/{postId}'}};
  const result = inspectServiceResponse(recipe,{status:201,body:'',headers:{location:'/api/posts/42'},requestUrl:'http://localhost:8080/api/posts'});
  assert.equal(result.statusMatches,true); assert.equal(result.bodyMatches,true); assert.equal(result.resourceId,'42');
  assert.equal(captureDeclaredResourceId(recipe,{status:201,body:'{"id":9007199254740992}',headers:{},requestUrl:'http://localhost:8080/api/posts'}),null);
  assert.equal(captureDeclaredResourceId(recipe,{status:201,body:'',headers:{location:'https://evil.test/api/posts/42'},requestUrl:'http://localhost:8080/api/posts'}),null);
});

test('실제 board 생성 recipe의 빈 본문과 Location ID를 함께 확인한다', () => {
  const recipe={expected:{statuses:[201],bodyMode:'empty',fields:['postId']},capture:{key:'postId',locationPattern:'/api/posts/{postId}'}};
  const actual=inspectServiceResponse(recipe,{status:201,body:'',headers:{location:'/api/posts/42'},requestUrl:'http://localhost:8080/api/posts'});
  assert.equal(actual.bodyMatches,true);
  assert.equal(actual.resourceId,'42');
});
