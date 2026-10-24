import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderContentVisual, renderContentKinds, CONTENT_KINDS } from './course-content.mjs';

test('여섯 종류와 페이지 용도가 구분되고 재적용해도 표지가 중복되지 않는다', () => {
  assert.equal(Object.keys(CONTENT_KINDS).length, 6);
  for (const [source, kind] of [['course/README.md','guide'],['course/spring/README.md','action'],['course/spring/D02.md','action'],['course/java/J01.md','practice'],['course/tickets/B01.md','action'],['course/start/README.md','reference']]) {
    const result = renderContentKinds(source, '<h1>제목</h1><section class="guide-section"><h2>설명</h2><p>읽기</p></section>');
    const doc = new JSDOM(result).window.document;
    assert.equal(doc.querySelector('.content-page-kind').dataset.contentKind, kind);
    assert.equal(renderContentKinds(source, result), result);
  }
});

test('파일 카드의 경로·역할·포인트·비교 범위가 원문대로 남고 HTML은 탈출한다', () => {
  const doc = new JSDOM(renderContentVisual({type:'files',title:'파일 연결',items:[{day:'D02',step:'①',path:'board-server/ErrorCode.java',layer:'공통',role:'상태는 `HttpStatus`다.',points:['유형은 /errors/... 경로다.'],comparison:'different',comparisonNote:'Java와 Spring 타입이 다르다.'}]})).window.document;
  assert.equal(doc.querySelectorAll('.visual-file').length, 1);
  assert.match(doc.querySelector('.file-role').textContent,/HttpStatus/);
  assert.equal(doc.querySelector('.file-path').textContent,'board-server/ErrorCode.java');
  assert.match(doc.querySelector('.file-relation').textContent,/오늘과 다름/);
  assert.throws(()=>renderContentVisual({type:'files',items:[{path:'x',comparison:'same'}]}),/역할/);
  const escaped = renderContentVisual({type:'files',items:[{path:'<script>alert(1)</script>',role:'코드',layer:'공통'}]});
  assert.equal(new JSDOM(escaped).window.document.querySelector('script'),null);
});

test('관계도는 명시한 연결만 그리며 잘못된 끝점을 거절한다', () => {
  const diagram={type:'relations',title:'예외 계층',nodes:[{id:'base',label:'RuntimeException',level:0},{id:'child',label:'BusinessException',level:1}],edges:[{from:'child',to:'base',label:'extends'}]};
  const doc=new JSDOM(renderContentVisual(diagram)).window.document;
  assert.equal(doc.querySelectorAll('svg .relation-node').length,2);
  assert.equal(doc.querySelectorAll('svg .relation-edge').length,1);
  assert.match(doc.querySelector('figcaption').textContent,/BusinessException.*extends.*RuntimeException/);
  assert.throws(()=>renderContentVisual({...diagram,edges:[{from:'missing',to:'base',label:'extends'}]}),/끝점/);
});

test('분류·변환이 닫힌 원인과 정답을 꺼내거나 목차·라벨·ARIA로 복제하지 않는다', () => {
  const html='<h1>B01</h1><section class="exercise-section"><h2>환경과 재현</h2><ol><li>실행</li><li>관찰</li></ol></section><section class="exercise-answer"><h2>원인과 정답</h2><details><summary>펼치기</summary><p>비밀_원인_913</p><ul><li>D02 ① <code>board-server/Secret.java</code> — 비밀_원인_913</li></ul></details></section><pre id="copy"><code>명령 그대로</code></pre><button data-copy-target="copy">복사</button>';
  const doc=new JSDOM(renderContentKinds('course/tickets/B01.md',html)).window.document;
  assert.equal(doc.querySelector('details').open,false);
  assert.equal(doc.querySelectorAll('.visual-file').length,0);
  assert.equal([...doc.querySelectorAll('*')].filter(n=>n.childNodes.length===1&&n.firstChild.nodeType===3&&n.textContent.includes('비밀_원인_913')&&!n.closest('details')).length,0);
  assert.equal(doc.querySelector('#copy').textContent,'명령 그대로');
  assert.equal(doc.querySelector('[data-copy-target]').dataset.copyTarget,'copy');
});

test('규칙·절차는 순서·중첩·링크와 닫힌 코드 내용을 보존한다', () => {
  const doc=new JSDOM(renderContentKinds('course/java/J01.md','<h1>연습</h1><section class="exercise-section"><h2>오늘 실험</h2><ol start="3"><li><a href="#result">실행</a><ul><li>예외도 관찰</li></ul></li><li>기록</li></ol><p>규칙:</p><ul><li>음수 거절</li><li>범위 보존</li></ul></section>')).window.document;
  assert.equal(doc.querySelector('.visual-procedure').getAttribute('start'),'3');
  assert.equal(doc.querySelector('.visual-procedure a').getAttribute('href'),'#result');
  assert.equal(doc.querySelectorAll('.visual-rules > li').length,2);
  assert.match(doc.querySelector('.visual-procedure ul').textContent,/예외도 관찰/);
});

test('원본 파일 카드 데이터는 필수 필드와 실제 비교 경계를 갖는다', async () => {
  const fs = await import('node:fs');
  let count = 0;
  for (const file of fs.readdirSync(new URL('../../course/java/',import.meta.url)).filter(f=>/^J\d{2}\.md$/.test(f))) {
    const source=fs.readFileSync(new URL(`../../course/java/${file}`,import.meta.url),'utf8');
    for (const match of source.matchAll(/```course-visual\n([\s\S]*?)\n```/g)) {
      const data=JSON.parse(match[1]);
      assert.ok(renderContentVisual(data),file);
      if (data.type!=='files') continue;
      for(const item of data.items) {
        assert.match(item.day,/^D\d{2}$/);
        assert.match(item.step,/^[①②③④⑤⑥⑦⑧⑨⑩]$/);
        assert.ok(item.layer);
        assert.ok(fs.existsSync(new URL('../../'+item.path,import.meta.url)),`${file}: ${item.path}`);
        count++;
      }
    }
  }
  assert.equal(count,72);
});

test('흐름이 없는 날의 숨긴 빈 자리에 라벨을 넣지 않는다', () => {
  const doc=new JSDOM(renderContentKinds('course/spring/D00.md','<h1>워밍업</h1><div class="day-flow" hidden></div>')).window.document;
  assert.equal(doc.querySelector('.day-flow').children.length,0);
  assert.equal(doc.querySelector('.day-flow').hidden,true);
});

test('코드의 엔티티와 공백 줄을 재직렬화하지 않고 바이트대로 보존한다', () => {
  const code='<code data-lazy-lang="diff">@@ changed\n&#32;\n+ value = &quot;a&quot;\n</code>';
  const html=renderContentKinds('course/spring/D02.md','<h1>일정</h1><pre>'+code+'</pre>');
  assert.ok(html.includes(code));
});
