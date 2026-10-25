// 콘텐츠의 용도와 시각 문법. 원문 노드를 옮기므로 링크·접기·복사 대상은 유지한다.
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import fs from 'node:fs';
import { DATA_STEPS, parseDaySql } from '../course/build-days.mjs';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const inline = value => marked.parseInline(String(value ?? ''));
export const CONTENT_KINDS = {
  action: { icon:'→', label:'행동', help:'오늘 할 일' },
  guide: { icon:'i', label:'가이드', help:'읽고 이해하기' },
  reference: { icon:'↗', label:'참고', help:'필요할 때 찾기' },
  example: { icon:'{ }', label:'구현 예시', help:'내 구현과 비교' },
  practice: { icon:'▷', label:'실습', help:'실행하고 관찰' },
  check: { icon:'✓', label:'확인', help:'끝났는지 판단' },
};
const badge = (kind, extra='') => `<span class="content-kind ${extra}" data-kind-label="${kind}"><span aria-hidden="true">${CONTENT_KINDS[kind].icon}</span> ${CONTENT_KINDS[kind].label}<small>${CONTENT_KINDS[kind].help}</small></span>`;
function requireText(value, label) { if (typeof value !== 'string' || !value.trim()) throw new Error(`시각 블록: ${label}이 필요하다`); }

// 일자별 SQL 맥락과 파일 범위는 학습 원본에서 가져온다.
export function loadDayDataGuide() {
  const read = name => fs.readFileSync(new URL(`../../course/${name}`, import.meta.url), 'utf8');
  const seed = parseDaySql(read('start/dummy/seed.sql'));
  const bulk = parseDaySql(read('start/dummy/bulk.sql'));
  const seedDays = [...seed.keys()].sort();
  const blockTitle = (blocks, id) => blocks.get(id)?.[0].match(/^-- 이 블록을 쓰는 날:\s*(.+)$/m)?.[1] || id;
  const guide = {};
  for (let day = 1; day <= 45; day++) {
    const id = `D${String(day).padStart(2,'0')}`;
    const source = JSON.parse(read(`days/${id}.json`));
    const sql = source.hints.sql;
    if (!sql?.context || !Array.isArray(sql.questions)) continue;
    const prior = seedDays.filter(key => key < id);
    const tables = [...new Set(Object.values(DATA_STEPS[id] || {}).flat())].filter(name => name !== 'bulk');
    const files = [];
    if (day <= 10 && seed.has(id)) files.push({name:'seed.sql',href:'seed.sql',scope:blockTitle(seed,id)});
    if (id === 'D06') files.push({name:'bulk.sql',href:'bulk.sql',scope:'seed.sql의 D02~D05 블록을 넣은 별도 실험 DB에서 전체를 한 번 실행한다.'});
    if (id === 'D04' && bulk.has(id)) files.push({name:'bulk.sql',href:'bulk.sql',scope:'D05까지 준비한 별도 DB에서 선택 재실험한다. 기본 DB에서는 지금 실행하지 않는다.'});
    const prerequisites = [];
    const steps = [];
    if (day <= 10 && seed.has(id)) {
      if (tables.length) prerequisites.push(`이번 블록에서 쓰는 테이블: ${tables.join(' · ')}. 테이블을 먼저 준비한다.`);
      if (prior.length) prerequisites.push(`앞선 seed 블록: ${prior.map(key => blockTitle(seed,key)).join(' → ')}. 이미 넣은 블록은 다시 실행하지 않는다.`);
      steps.push(`${blockTitle(seed,id)} 블록 전체(SET~COMMIT)를 한 번 실행하거나, 준비한 테이블 조각만 순서대로 실행한다. 두 방식을 중복 실행하지 않는다.`);
    } else if (id === 'D06') {
      prerequisites.push('seed.sql의 D02~D05 블록을 넣은 별도 실험 DB를 쓴다. D04·D05의 seed 전용 DB와 구분한다.');
      steps.push('bulk.sql 전체를 같은 연결에서 한 번 실행한다. 실패 시 임시 테이블과 cte_max_recursion_depth를 파일 끝의 문장으로 복구한다.');
    } else {
      prerequisites.push(sql.context);
      steps.push(...sql.questions.map(question => question.task));
    }
    const hasData = Object.hasOwn(DATA_STEPS,id);
    guide[id] = {id,title:source.roadmap.title,context:sql.context,files,prerequisites,steps,
      checks:sql.questions.map(({task,expect})=>({task,expect})),
      returnHref:`../../spring/${id}.html#${hasData ? `step-${id.toLowerCase()}-data` : '오늘의-sql'}`,
      returnLabel:`${id} ${hasData ? '데이터 넣기' : '오늘의 SQL'}로 돌아가기`,
      warnings:files.length ? ['고정 ID·고정 시각을 쓰므로 중복 실행은 오류다. 기존 앱 데이터와 섞지 않는다.','도중 오류는 COMMIT하지 말고 ROLLBACK 후 확인한다.'] : []};
  }
  return guide;
}

export function renderContentVisual(data) {
  const title = data.title ? `<h3 class="visual-title">${esc(data.title)}</h3>` : '';
  if (data.type === 'files') {
    if (!Array.isArray(data.items) || !data.items.length) throw new Error('시각 블록: 파일 목록이 필요하다');
    const cards = data.items.map((f,i) => {
      requireText(f.path,'파일 경로'); requireText(f.role,'역할');
      const relation = {same:'오늘과 같음',different:'오늘과 다름',mixed:'같은 점과 다른 점',connection:'Spring 연결 지점'}[f.comparison || 'connection'];
      if (!relation) throw new Error('시각 블록: 알 수 없는 비교 종류');
      if (f.comparison && f.comparison !== 'connection') requireText(f.comparisonNote,'비교 범위');
      return `<article class="visual-file"><header><span class="file-index">${String(i+1).padStart(2,'0')}</span><span class="file-day">${esc(f.day)} ${esc(f.step)}</span><span class="file-layer">${esc(f.layer || '코드')}</span></header><h4>${esc(f.path.split('/').at(-1))}</h4><code class="file-path">${esc(f.path)}</code><p class="file-role">${inline(f.role)}</p>${f.concepts?.length ? `<div class="file-concepts">${f.concepts.map(c=>`<code>${esc(c)}</code>`).join('')}</div>` : ''}${f.points?.length ? `<ul class="file-points">${f.points.map(p=>`<li>${inline(p)}</li>`).join('')}</ul>` : ''}<p class="file-relation" data-relation="${esc(f.comparison || 'connection')}"><b>${relation}</b>${f.comparisonNote ? `<span>${inline(f.comparisonNote)}</span>` : ''}</p></article>`;
    }).join('');
    return `<section class="content-visual visual-files" data-content-kind="example" data-visual-pattern="files">${badge('example')}${title}<div class="visual-file-grid">${cards}</div></section>`;
  }
  if (data.type === 'relations') {
    if (!data.nodes?.length || !Array.isArray(data.edges)) throw new Error('시각 블록: 관계 노드와 연결이 필요하다');
    const ids=new Set(data.nodes.map(n=>n.id));
    if (ids.size!==data.nodes.length) throw new Error('시각 블록: 중복 노드');
    for (const e of data.edges) if (!ids.has(e.from)||!ids.has(e.to)) throw new Error('시각 블록: 관계 끝점이 없다');
    const levels=[...new Set(data.nodes.map(n=>n.level??0))].sort((a,b)=>a-b);
    const width=880, boxW=240, boxH=64, gapY=120;
    const positions=new Map();
    for (const [levelIndex,level] of levels.entries()) {
      const row=data.nodes.filter(n=>(n.level??0)===level);
      if(row.length>3) throw new Error('시각 블록: 관계도 한 행은 세 노드 이하');
      row.forEach((n,i)=>positions.set(n.id,{x:(width/row.length)*(i+.5),y:levelIndex*gapY+44}));
    }
    const lines=data.edges.map(e=>{
      const a=positions.get(e.from),b=positions.get(e.to),up=a.y>b.y;
      const y1=a.y+(up?-boxH/2:boxH/2),y2=b.y+(up?boxH/2:-boxH/2),mid=(y1+y2)/2;
      return `<g class="relation-edge"><path d="M${a.x} ${y1} V${mid} H${b.x} V${y2}"/><path class="relation-arrow" d="M${b.x-6} ${y2+(up?8:-8)} L${b.x} ${y2} L${b.x+6} ${y2+(up?8:-8)}"/><text x="${(a.x+b.x)/2+12}" y="${mid-8}">${esc(e.label)}</text></g>`;
    }).join('');
    const nodes=data.nodes.map(n=>{requireText(n.label,'노드 이름');const p=positions.get(n.id);return `<g class="relation-node"><rect x="${p.x-boxW/2}" y="${p.y-boxH/2}" width="${boxW}" height="${boxH}" rx="6"/><text x="${p.x}" y="${p.y-3}" text-anchor="middle">${esc(n.label)}</text><text class="relation-node-kind" x="${p.x}" y="${p.y+20}" text-anchor="middle">${esc(n.kind||'클래스')}</text></g>`;}).join('');
    return `<figure class="content-visual visual-relations" data-content-kind="guide" data-visual-pattern="relations">${badge('guide')}${title}<svg viewBox="0 0 ${width} ${levels.length*gapY-20}" role="img" aria-label="${esc(data.title||'클래스 관계')}">${lines}${nodes}</svg><figcaption>${data.edges.map(e=>`${esc(data.nodes.find(n=>n.id===e.from).label)} <code>${esc(e.label)}</code> ${esc(data.nodes.find(n=>n.id===e.to).label)}`).join(' · ')}${data.note ? `<p>${inline(data.note)}</p>` : ''}</figcaption></figure>`;
  }
  if (['comparison','procedure','flow','rules'].includes(data.type)) {
    if (!data.items?.length) throw new Error('시각 블록: 항목이 필요하다');
    const kind = {comparison:'example',procedure:'action',flow:'practice',rules:'check'}[data.type];
    return `<section class="content-visual visual-${data.type}" data-content-kind="${kind}" data-visual-pattern="${data.type}">${badge(kind)}${title}<ol>${data.items.map((item,i)=>`<li><b class="visual-index">${String(i+1).padStart(2,'0')}</b><div><h4>${esc(item.title)}</h4><p>${inline(item.body)}</p></div></li>`).join('')}</ol>${data.note ? `<p class="visual-conclusion">${inline(data.note)}</p>` : ''}</section>`;
  }
  throw new Error(`시각 블록: 알 수 없는 종류 ${data.type}`);
}

export function coursePageType(source) {
  if (source==='README.md') return {kind:'action',label:'학습 홈',help:'오늘 할 일에서 시작하세요'};
  if (source==='course/README.md') return {kind:'guide',label:'과정 안내',help:'진행 방법과 약속을 읽는 가이드입니다'};
  if (source==='course/spring/README.md') return {kind:'action',label:'일정 · 일자 목록',help:'공부할 날을 고르고 오늘 할 일로 이동하세요'};
  if (/^course\/spring\/D\d{2}\.md$/.test(source)) return {kind:'action',label:'일정 · 오늘 할 일',help:'현재 순서를 구현하고 완료 조건을 확인하세요'};
  if (source.startsWith('course/java/')) return {kind:'practice',label:'연습 · Java',help:'직접 작성하고 실행한 뒤 연결된 일자로 돌아가세요'};
  if (source.startsWith('course/tickets/')) return {kind:'action',label:'과제 · 티켓',help:'증상을 재현하고 수정 근거를 제출하세요'};
  if (source==='course/map.md') return {kind:'reference',label:'참고 · 과정 지도',help:'날·Java·티켓의 연결을 찾아보세요'};
  if (source.startsWith('course/start/')) return {kind:'reference',label:'참고 · 출발 자료',help:'필요한 설정과 파일을 찾아 사용하세요'};
  if (source.startsWith('course/')) return {kind:'reference',label:'참고 자료',help:'필요한 계약·개념·채점 기준을 찾아보세요'};
  return null;
}

function classify(node, fallback='guide') {
  if (node.dataset.contentKind) return node.dataset.contentKind;
  if(node.matches('.fact-files,.day-step,.day-today,.ch-today,.ticket-selection,.exercise-received,.stage-transition')) return 'action';
  if(node.matches('.fact-done,.day-grade,.day-finish,.ch-progress,.exercise-submission,.step-done')) return 'check';
  if(node.matches('.day-sql,.day-data,.day-talk,.day-java,.day-flow,.implementation-flow,.ticket-flow,.step-observations,.exercise-repro')) return 'practice';
  if(node.matches('.step-references,.fact-spec,.fact-data-spec,.fact-answer-link,.ch-reference,.exercise-return,.course-exercise-nav')) return 'reference';
  const heading=node.querySelector(':scope > h2, :scope > h3, :scope > summary, :scope > .practice-heading h2');
  const name=heading?.textContent.replace(/^#\s*/,'').trim()||'';
  if(/원인|정답|구현 예시|비교|뼈대 발췌/.test(name)) return 'example';
  if(/완료|채점|제출물|통과|확인|실행과/.test(name)) return 'check';
  if(/만들 것|만들 파일|오늘 순서|받은 티켓|받은 요청|작업 순서|준비$/.test(name)) return 'action';
  if(/실험|관찰|재현|기본기 반복|타입 한 컷|실무 습관|진행$|스크립트|SQL|말하기/.test(name)) return 'practice';
  if(/자료|다시 만나는|재사용|링크|명세|다음|내일/.test(name)) return 'reference';
  return fallback;
}

function compareTables(doc,root) {
  for(const table of [...root.querySelectorAll('table')]) {
    if(table.closest('details,.content-visual')) continue;
    const headers=[...table.querySelectorAll('thead th')];
    if(headers.length<3 || headers.length>4 || !/static|인터페이스|오늘 만든|직접 작성/.test(headers[1].textContent)) continue;
    const rows=[...table.querySelectorAll('tbody tr')];
    const block=doc.createElement('section');block.className='content-visual visual-comparison';block.dataset.contentKind='example';block.dataset.visualPattern='comparison';
    block.innerHTML=badge('example');
    const panels=doc.createElement('div');panels.className='comparison-panels';
    for(let col=1;col<headers.length;col++) {
      const panel=doc.createElement('div');panel.className=col>2?'comparison-note':'comparison-side';
      const h=doc.createElement('h4');h.append(...headers[col].childNodes);panel.append(h);
      const dl=doc.createElement('dl');
      for(const row of rows){const cells=[...row.children];if(!cells[col])continue;const dt=doc.createElement('dt');dt.innerHTML=cells[0].innerHTML;const dd=doc.createElement('dd');dd.append(...cells[col].childNodes);dl.append(dt,dd);}
      panel.append(dl);panels.append(panel);
    }
    block.append(panels);
    const wrap=table.parentElement;
    if(wrap.classList.contains('table-wrap')&&wrap.children.length===1)wrap.replaceWith(block);else table.replaceWith(block);
  }
}

// 조작은 native 요소에 두고 본문만 감싼다. 접힌 구현 내용은 밖으로 복제하지 않는다.
function frameContentBlocks(doc, root, source) {
  for (const detail of root.querySelectorAll('.step-help > details,.exercise-section > details,.exercise-answer > details,details.fact-trap')) {
    const summary = detail.querySelector(':scope > summary');
    if (!summary || detail.querySelector(':scope > .disclosure-body')) continue;
    const body = doc.createElement('div');
    body.className = 'disclosure-body';
    for (const node of [...detail.childNodes]) if (node !== summary) body.append(node);
    detail.append(body);
    const chevron = doc.createElement('span');
    chevron.className = 'disclosure-chevron';
    chevron.setAttribute('aria-hidden','true');
    chevron.textContent = '▸';
    summary.append(chevron);
  }
  for (const table of root.querySelectorAll('table')) {
    for (const th of table.querySelectorAll('thead th')) th.setAttribute('scope','col');
    const labels = [...table.querySelectorAll('thead th')].map(node => node.textContent.trim());
    if (source.startsWith('course/java/') && labels.join('|') === '파일|채울 것|칸') table.classList.add('java-task-table');
  }
  let codeIndex = 0;
  for (const pre of root.querySelectorAll('pre')) {
    if (pre.closest('.code-block') || !pre.innerHTML.includes('course-preserved-code:')) continue;
    const figure = doc.createElement('figure');
    figure.className = 'code-block';
    const toolbar = doc.createElement('figcaption');
    toolbar.className = 'code-toolbar';
    const lang = pre.dataset.contentKind === 'reference' ? '코드 원문' : '코드';
    if (!pre.id) {
      let id;
      do { id = `content-code-${++codeIndex}`; } while (doc.getElementById(id));
      pre.id = id;
    }
    toolbar.innerHTML = `<span>${lang}</span><button type="button" data-copy-target="${esc(pre.id)}">코드 복사</button><span class="copy-status" role="status" aria-live="polite"></span>`;
    pre.before(figure);
    figure.append(toolbar,pre);
  }
  if (source.startsWith('course/start/')) {
    const content = root.querySelector('.guide-content');
    if (content) {
      content.classList.add(source === 'course/start/dummy/README.md' ? 'data-reference-layout' : 'start-reference-layout');
      for (const section of content.querySelectorAll(':scope > .guide-section')) {
        const name = section.querySelector(':scope > h2')?.textContent || '';
        section.dataset.referenceSection = /붙여 넣는 순서/.test(name) ? 'sequence' : /내 설계/.test(name) ? 'mapping' : /넣은 뒤/.test(name) ? 'verify' : /로그인/.test(name) ? 'login' : /compose/.test(name) ? 'run' : /설정값/.test(name) ? 'settings' : /준비물/.test(name) ? 'prepare' : 'reference';
        const heading = section.querySelector(':scope > h2');
        const kind = section.querySelector(':scope > .content-kind');
        if (heading && kind) {
          const header = doc.createElement('header');
          header.className = 'reference-heading';
          heading.before(header);
          header.append(heading,kind);
        }
        if (source === 'course/start/README.md' && section.dataset.referenceSection === 'settings') {
          const table = section.querySelector(':scope > .table-wrap');
          if (table) {
            const columns = doc.createElement('div');
            columns.className = 'reference-columns';
            const notes = doc.createElement('div');
            notes.className = 'reference-notes';
            table.before(columns);
            columns.append(table,notes);
            while (columns.nextElementSibling && !columns.nextElementSibling.matches('.course-outline')) notes.append(columns.nextElementSibling);
          }
        }
        if (source === 'course/start/dummy/README.md' && section.dataset.referenceSection === 'mapping') {
          for (const item of section.querySelectorAll(':scope > ul > li')) {
            const name = item.querySelector(':scope > strong');
            if (!name) continue;
            const detail = doc.createElement('details');
            detail.className = 'data-adjustment';
            const summary = doc.createElement('summary');
            summary.append(name);
            const body = doc.createElement('div');
            body.className = 'disclosure-body';
            body.append(...item.childNodes);
            item.append(detail);
            detail.append(summary,body);
          }
        }
      }
      if (source === 'course/start/dummy/README.md') {
        const reference = doc.createElement('div');
        reference.dataset.dayGuideReference = '';
        reference.className = 'data-reference-layout data-guide-reference';
        for (const node of [...content.children]) if (!node.matches('h1,.content-page-kind')) reference.append(node);
        const guide = doc.createElement('section');
        guide.dataset.dayGuide = '';
        guide.className = 'day-data-guide';
        guide.hidden = true;
        guide.setAttribute('aria-labelledby','day-data-guide-title');
        const payload = doc.createElement('script');
        payload.id = 'course-day-data-guide';
        payload.type = 'application/json';
        payload.textContent = JSON.stringify(loadDayDataGuide()).replace(/</g,'\\u003c');
        content.append(guide,payload,reference);
      }
    }
  }
  if (source.startsWith('course/java/')) {
    const sheet = root.querySelector('.exercise-java');
    for (const files of sheet?.querySelectorAll('.visual-files') || []) {
      const count = files.querySelectorAll('.visual-file').length;
      if (count < 3 || files.closest('details')) continue;
      const details = doc.createElement('details');
      details.className = 'exercise-file-reference';
      const summary = doc.createElement('summary');
      summary.textContent = `Spring 연결 파일 ${count}개 · 경로·역할·비교 확인`;
      files.before(details);
      details.append(summary,files);
    }
    for (const list of sheet?.querySelectorAll('.exercise-section > ul') || []) {
      const caption = list.previousElementSibling;
      if (!caption || !/^(통과시킬 테스트|테스트|확인 테스트)/.test(caption.textContent.trim()) || ![...list.children].every(li => li.querySelector('code'))) continue;
      const details = doc.createElement('details');
      details.className = 'exercise-test-index';
      const summary = doc.createElement('summary');
      summary.textContent = `확인할 테스트 이름 ${list.children.length}개`;
      list.before(details);
      details.append(summary,list);
    }
    const sections = [...(sheet?.querySelectorAll(':scope > .exercise-section') || [])];
    const supporting = sections.filter(section => /^(기본기 반복|타입 한 컷|실무 습관)$/.test(section.querySelector(':scope > h2')?.textContent.replace(/^#\s*/,'').trim() || ''));
    if (supporting.length > 1) {
      const grid = doc.createElement('div');
      grid.className = 'exercise-support-grid';
      supporting[0].before(grid);
      for (const section of supporting) grid.append(section);
    }
  }
}

// 구조화한 데이터만 렌더링하고 닫힌 정답을 복제하지 않는다.
export function renderContentKinds(source,html) {
  const type=coursePageType(source);
  if(!type || html.includes('class="content-page-kind"')) return html;
  const preservedCode=[];
  const protectedHtml=html.replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_,open,content,close)=>{
    // 파서가 보정한 빈 복제 표식만 제거한다. 실제 코드와 대상 ID는 그대로 둔다.
    const cleaned = content.replace(/<p><code id="([^"]+)"><\/code><\/p>/g, (duplicate,id,offset) => content.slice(0,offset).includes(`<code id="${id}">`) ? '' : duplicate);
    return `${open}<!--course-preserved-code:${preservedCode.push(cleaned)-1}-->${close}`;
  });
  const dom=new JSDOM(`<div id="content-root">${protectedHtml}</div>`);const doc=dom.window.document,root=doc.getElementById('content-root');
  const words = doc.createTreeWalker(root, 4);
  let word;
  while ((word = words.nextNode())) {
    if (word.parentElement.closest('pre, code, script, textarea')) continue;
    word.textContent = word.textContent.replace(/정답(은|을|과|으로|이라고|이나|이(?=\s))/g, (_, particle) => '구현 예시' + ({은:'는',을:'를',과:'와',으로:'로',이라고:'라고',이나:'나',이:'가'})[particle]).replace(/정답/g, '구현 예시').replace(/answer(?:-fix)?\((D\d{2}-\d+)\)/g, '$1').replace(/예시 · 구현 예시/g, '구현 예시');
  }
  const h1=root.querySelector('h1');
  if(h1){const identity=doc.createElement('p');identity.className='content-page-kind';identity.dataset.contentKind=type.kind;identity.innerHTML=`${badge(type.kind)}<strong>${esc(type.label)}</strong><span>${esc(type.help)}</span>`;h1.before(identity);}
  // 핵심 만들 것·규칙은 노출하고 긴 코드·정답만 접는다. 티켓의 접기는 건드리지 않는다.
  if(source.startsWith('course/java/')) {
    for(const section of root.querySelectorAll('.exercise-section')) {
      if(!/^(만들 것|오늘 실험)$/.test(section.querySelector('h2')?.textContent.replace(/^#\s*/,'').trim()))continue;
      const detail=section.querySelector(':scope > details');
      if(detail){for(const node of [...detail.children]){if(node.tagName==='SUMMARY')continue;if(node.matches('pre,.code-block,.code-wrap')||node.querySelector('pre')){const code=doc.createElement('details');code.className='exercise-code-source';code.innerHTML='<summary>뼈대 코드·실행 원문 펼치기</summary>';detail.before(code);code.append(node);}else detail.before(node);}detail.remove();}
    }
  }
  compareTables(doc,root);
  const blocks=root.querySelectorAll('.guide-section,.exercise-section,.exercise-answer,.day-step,.day-today,.day-java,.step-fact,.step-references,.implementation-flow,.step-help > details,.practice-panel,.day-flow,.ticket-flow,.stage-transition,.handoff-sheet,.ch-today,.ch-route,.ch-progress,.ch-entry,.ch-reference,.ticket-selection,.content-visual');
  for(const block of blocks) {
    const kind=classify(block, block.matches('.ch-entry')?'reference':'guide');block.dataset.contentKind=kind;
    // 접힌 영역의 제목이나 본문은 바깥 라벨로 복제하지 않는다.
    if(block.parentElement.closest('details') || block.classList.contains('content-visual') || (block.hidden && !block.children.length))continue;
    if(block.matches('details')) {const s=block.querySelector(':scope > summary');if(s)s.insertAdjacentHTML('afterbegin',badge(kind));}
    else if(!block.querySelector(':scope > .content-kind'))block.insertAdjacentHTML('afterbegin',badge(kind));
  }
  for(const list of root.querySelectorAll('.exercise-section ol,.guide-section ol,.step-observations ol')) {
    if(list.closest('details,.content-visual')||list.matches('.course-outline')||list.parentElement.closest('ol'))continue;
    list.classList.add('visual-procedure');list.dataset.visualPattern='procedure';
    if (list.hasAttribute('start')) list.style.counterReset = `procedure ${Number(list.getAttribute('start')) - 1}`;
  }
  for(const list of root.querySelectorAll('ul')) {
    if(list.closest('details,.content-visual')||list.parentElement.closest('ul'))continue;
    const section=list.closest('[data-content-kind]');
    if(/^규칙/.test(list.previousElementSibling?.textContent.trim()||'') || section?.dataset.contentKind==='check') {
      list.classList.add('visual-rules');list.dataset.visualPattern='rules';
    }
  }
  // 원형 번호만 있던 절차를 왼쪽 번호와 오른쪽 설명 흐름으로 표현한다.
  for(const p of root.querySelectorAll('p')) {
    if(p.closest('details,pre,code,nav,.content-visual')||!p.querySelector('br'))continue;
    const lines=p.innerHTML.split(/<br\s*\/?\s*>/i).map(x=>x.trim()).filter(Boolean);
    if(lines.length<2||!lines.every(line=>/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(line)))continue;
    const ol=doc.createElement('ol');ol.className='visual-flow';ol.dataset.visualPattern='flow';
    for(const line of lines){const li=doc.createElement('li');li.innerHTML=line.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/,'');ol.append(li);}p.replaceWith(ol);
  }
  for(const block of root.querySelectorAll('p,ul,ol,table,pre,blockquote,details')) {
    if(!block.dataset.contentKind)block.dataset.contentKind=block.closest('nav,.crumbs') ? 'reference' : block.closest('[data-content-kind]')?.dataset.contentKind||type.kind;
  }
  frameContentBlocks(doc, root, source);
  const result=root.innerHTML.replace(/<!--course-preserved-code:(\d+)-->/g, (_,index)=>preservedCode[Number(index)]);
  dom.window.close();return result;
}
