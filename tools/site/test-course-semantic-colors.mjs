import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { HTTP_COLORS, LAYER_COLORS, renderSemanticColors, fileLayer } from './course-semantic-colors.mjs';

const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

test('HTTP 상태와 파일 층은 고유색이고 모든 공통 다크 면에서 글자와 경계 대비를 충족한다',()=>{
  for (const palette of [HTTP_COLORS,LAYER_COLORS]) {
    assert.equal(new Set(Object.values(palette)).size,Object.keys(palette).length);
    for (const [meaning,color] of Object.entries(palette)) for(const surface of ['#141619','#1d2025','#282c33','#171a1f']) {
      assert.ok(contrast(color,surface)>=4.5,`${meaning}: ${color} / ${surface}`);
    }
  }
});

test('HTTP 결과만 구분하며 200ms·파일명·코드 원문·문장 내용은 보존한다',()=>{
  const body='<p>GET 응답 200 / 생성 201 / 오류 400 / 없음 404 / 타임아웃</p><p>대기 200ms 파일 D200.java 값 1400</p><pre><code>HTTP 400</code></pre>';
  const result=renderSemanticColors(body),doc=new JSDOM(result).window.document;
  assert.deepEqual([...doc.querySelectorAll('[data-http-status]')].map(e=>e.dataset.httpStatus),['200','201','400','404','timeout']);
  assert.equal(doc.body.textContent,new JSDOM(body).window.document.body.textContent);
  assert.equal(doc.querySelector('pre').innerHTML,'<code>HTTP 400</code>');
  assert.equal(renderSemanticColors(result),result);
  const original = '<pre><code>Order.create(&quot;kim&quot;);</code></pre><script>const tag = "&quot;";</script>';
  assert.equal(renderSemanticColors(original),original,'코드와 스크립트의 이스케이프 표기도 보존한다');
});

test('파일층과 흐름 노드의 같은 의미는 동일 토큰을 사용하며 가린 원인을 공개하지 않는다',()=>{
  assert.equal(fileLayer('PostController.java'),'controller');
  assert.equal(fileLayer('PostServiceTest.java'),'test');
  assert.equal(fileLayer('PostMapper.xml'),'query');
  assert.equal(fileLayer('PostRepository.java'),'repository');
  const doc=new JSDOM(renderSemanticColors('<b class="file-name">PostService.java</b><li class="flow-node" data-node="service">Service</li><li class="flow-node is-masked" data-node="mysql">원인 쪽</li>')).window.document;
  assert.equal(doc.querySelector('.file-name').dataset.fileLayer,'service');
  assert.equal(doc.querySelector('[data-node="service"]').dataset.nodeKind,'service');
  assert.equal(doc.querySelector('.is-masked').hasAttribute('data-node-kind'),false);
});

test('동적 요청 결과도 내용 보존과 상태별 색 적용을 유지한다',async()=>{
  const dom=new JSDOM('<p class="response-status"></p>',{runScripts:'outside-only'});
  dom.window.eval(fs.readFileSync(new URL('./course-semantic-colors.js',import.meta.url),'utf8'));
  const result=dom.window.document.querySelector('p');
  result.textContent='200 OK\n404 Not Found';
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.deepEqual([...result.querySelectorAll('[data-http-status]')].map(e=>e.dataset.httpStatus),['200','404']);
  assert.equal(result.textContent,'200 OK\n404 Not Found');
  result.textContent='요청 타임아웃';
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(result.querySelector('[data-http-status]').dataset.httpStatus,'timeout');
  const dynamic=dom.window.document.createElement('strong');dynamic.className='p16-error-status';dynamic.textContent='400 Bad Request · 예상 결과';dom.window.document.body.append(dynamic);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(dynamic.querySelector('[data-http-status]').dataset.httpStatus,'400','나중에 생성된 학습 장면도 같은 상태색을 사용한다');
  assert.equal(dynamic.textContent,'400 Bad Request · 예상 결과');
  dom.window.close();
});
