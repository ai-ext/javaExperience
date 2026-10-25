import { P09_LESSONS } from './p09-lesson-data.mjs';
import { P09_ASSETS, p09AssetRoot } from './p09-assets.mjs';

export function initP09Learning(doc = document, win = window) {
  const root = doc.querySelector('[data-p09-learning]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  doc.body.classList.add('knowledge-detail-page');
  const $ = (selector) => root.querySelector(selector);
  const available = P09_LESSONS.filter((lesson) => lesson.stages.every((stage) => P09_ASSETS[stage.image]));
  const key = '__javaExperienceP09';
  const defaultLesson=available.find((item)=>item.id==='references')||available[0];
  let lesson = defaultLesson, index = 0, comparison = false;
  const mobile = win.matchMedia?.('(max-width:700px)');
  let zoom = mobile?.matches === true, zoomManual = false;
  let renderGeneration = 0, copyRequestId = 0;
  const element = (name, text, className) => {
    const node = doc.createElement(name); node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function save() {
    try {
      win.history.replaceState({ ...win.history.state, [key]: { topic: lesson.id, stage: lesson.stages[index].id, comparison } }, '');
    } catch { /* 저장을 사용할 수 없어도 현재 장면은 조작할 수 있다. */ }
  }
  function renderStages() {
    $('[data-p09-stage-select]').replaceChildren(...lesson.stages.map((stage,i) => {
      const option=element('option',`${i+1}/${lesson.stages.length} · ${stage.title}`);option.value=stage.id;return option;
    }));
    $('[data-p09-stages]').replaceChildren(...lesson.stages.map((stage, i) => {
      const button = element('button', stage.title); button.type = 'button'; button.dataset.p09Stage = stage.id;
      button.addEventListener('click', () => { index = i; render(); save(); });
      return button;
    }));
  }
  function renderReference(reference,code,active) {
    const holder=$('[data-p09-reference-mobile]');holder.replaceChildren();
    if(!reference)return;
    const current=element('pre','','p09-ref-current');current.setAttribute('aria-label','현재 설명하는 코드');current.append(element('code',code.split('\n').filter((line,i)=>active.includes(i)).join('\n')));holder.append(current);
    for(const [identity,value] of [['A',reference.objectA],['B',reference.objectB]]){
      if(!value)continue;
      const group=element('section','','p09-ref-group');
      const edges=[];
      if(identity==='A')edges.push(['caller','호출자 main']);
      if(reference.parameter===identity)edges.push(['parameter','매개변수 p']);
      const sources=element('div','','p09-ref-sources');sources.dataset.count=String(edges.length);
      for(const [kind,label] of edges){
        const source=element('div','','p09-ref-source');source.dataset.p09RefSource=kind;source.dataset.refTarget=identity;
        const binding=element('div','','p09-ref-binding');binding.append(element('span',label),element('code',`p → ${identity}`));
        const arrow=element('span','↓','p09-ref-arrow');arrow.setAttribute('aria-hidden','true');source.append(binding,arrow);sources.append(source);
      }
      if(edges.length)group.append(sources);
      const object=element('article','','p09-ref-object');object.dataset.p09RefObject=identity;
      object.append(element('h4',`Profile · ${identity}`));
      const field=element('div','','p09-ref-field');const valueNode=element('span','','p09-ref-value');
      if(identity==='A'&&reference.previousA)valueNode.append(element('small',reference.previousA+' → '));
      valueNode.append(element('strong',value));field.append(element('span','nickname'),valueNode);object.append(field);
      if(identity==='B'&&reference.unreachableB){object.classList.add('p09-ref-unreachable');object.append(element('p','이 예제에 B로 접근할 참조가 남지 않았습니다. GC 수거 시점은 미정입니다.'));}
      group.append(object);holder.append(group);
    }
    if(reference.copy)holder.append(element('p','참조값 A를 복사했으므로 두 변수가 같은 객체를 가리킵니다.','p09-ref-context'));
    if(reference.status==='before')holder.append(element('p',`${reference.method} 호출 전 · 매개변수는 아직 없습니다.`,'p09-ref-context'));
    if(reference.status==='returned')holder.append(element('p',`${reference.method} 복귀 · 매개변수의 범위가 끝났습니다.`,'p09-ref-context'));
    holder.append(element('p','A와 B는 객체를 구별하는 설명용 기호이며 실제 메모리 주소가 아닙니다.','p09-ref-context'));
  }
  function renderComparison() {
    const holder = $('[data-p09-comparison]'); holder.replaceChildren();
    holder.append(element('h3', '같은 값 전달 규칙, 서로 다른 대입 대상'));
    const cases = [
      ['같은 객체의 필드 변경', 'p.nickname = "Grace";', '호출자 p → A / 매개변수 p → A', 'A.nickname: Ada → Grace', '복귀 후 호출자 p → A · Grace'],
      ['매개변수의 참조 재할당', 'p = new Profile("Local only");', '호출자 p → A / 매개변수 p → B', 'A: Grace 유지 / B: Local only', '복귀 후 호출자 p → A · Grace'],
    ];
    const columns = element('div', '', 'p09-comparison-columns');
    for (const [title, code, during, changed, after] of cases) {
      const section = element('section', '', 'p09-comparison-case');
      section.append(element('h4', title), element('code', code), element('p', during), element('p', changed), element('strong', after));
      columns.append(section);
    }
    holder.append(columns, element('p', '두 번째 호출은 원문의 실행 순서대로 Grace에서 시작합니다. 두 경우 모두 참조값이 복사되며, 대입하는 대상이 필드인지 매개변수인지가 다릅니다.'));
  }
  function codeForDisplay(stage){return lesson.id==='references'?stage.code.split('\n').filter((line,i)=>stage.active.includes(i)).join('\n'):stage.code;}
  function render() {
    renderGeneration += 1;
    const stage = lesson.stages[index], asset = P09_ASSETS[stage.image];
    root.dataset.topic=lesson.id;
    const referenceMobile=Boolean(stage.reference&&mobile?.matches);
    renderReference(stage.reference,stage.code,stage.active);
    $('[data-p09-reference-mobile]').hidden=!referenceMobile;
    $('.p09-value-sheet').hidden=referenceMobile;
    root.dataset.referenceMobile=String(referenceMobile);
    $('[data-p09-topic]').value = lesson.id;
    $('[data-p09-question]').textContent = lesson.question;
    $('[data-p09-source]').textContent = lesson.source;
    $('[data-p09-title]').textContent = stage.title;
    $('[data-p09-lead]').textContent = stage.lead;
    $('[data-p09-note]').textContent = stage.note||lesson.note;
    const img = $('[data-p09-image]');
    img.src = p09AssetRoot + asset.file; img.alt = asset.alt + ' · 현재 설명: ' + stage.title;
    img.width = asset.width; img.height = asset.height;
    $('[data-p09-image-link]').href = img.getAttribute('src');
    const focus = asset.focus?.[stage.id], overlay = $('[data-p09-focus]');
    const zoomed = zoom && Boolean(focus) && !referenceMobile;
    overlay.hidden = !focus || zoomed;
    if (focus) for (const [property, value] of Object.entries({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] })) overlay.style[property] = value + '%';
    const frame = $('.p09-image-frame'); frame.dataset.zoom = String(zoomed);
    frame.hidden=referenceMobile;
    const imageWindow=$('.p09-image-window');
    const ratio=zoomed?String(asset.width*focus[2]/(asset.height*focus[3])):'';
    frame.style.aspectRatio=ratio;imageWindow.style.aspectRatio=ratio;
    imageWindow.style.setProperty('--p09-mobile-crop-width',zoomed?`${asset.width*.85*focus[2]/100}px`:'100%');
    frame.scrollLeft=0;
    if(zoomed&&mobile?.matches){frame.tabIndex=0;frame.setAttribute('aria-label','확대한 그림 · 좌우로 이동해 읽기');}
    else{frame.removeAttribute('tabindex');frame.removeAttribute('aria-label');}
    img.style.width = zoomed ? (10000 / focus[2]) + '%' : '100%';
    img.style.transform = zoomed ? `translate(-${focus[0]}%, -${focus[1]}%)` : 'none';
    $('[data-p09-zoom]').hidden = !focus||referenceMobile;
    $('[data-p09-zoom]').setAttribute('aria-pressed', String(zoomed));
    $('[data-p09-zoom]').textContent = zoomed ? '전체 그림 보기' : '강조 구간 확대';
    $('[data-p09-figure-label]').textContent = referenceMobile ? '같은 참조 연결을 모바일에 맞춰 배치했어요' : zoomed ? (mobile?.matches?'현재 구간 확대 · 그림을 좌우로 밀어 읽어요':'현재 강조 구간을 확대한 그림') : '전체 관계 그림 · 강조한 구간을 읽어요';
    $('[data-p09-state]').replaceChildren(...stage.values.flatMap(([label, value]) => [element('dt', label), element('dd', value)]));
    const code = $('[data-p09-code]'); code.replaceChildren();
    const isReference=lesson.id==='references';
    $('[data-p09-context]').hidden=!isReference;
    if(!isReference)$('[data-p09-context]').open=false;
    $('[data-p09-context-code]').textContent=isReference?stage.code:'';
    $('[data-p09-code-title]').textContent=isReference?'현재 읽는 코드':'함께 읽을 코드';
    $('[data-p09-copy]').textContent=isReference?'현재 코드 복사':'코드 복사';
    codeForDisplay(stage).split('\n').forEach((line, i, lines) => {
      const active=isReference||stage.active.includes(i),token=active&&stage.activeToken?line.indexOf(stage.activeToken):-1;
      if(token>=0)code.append(element('span',line.slice(0,token)),element('mark',stage.activeToken),element('span',line.slice(token+stage.activeToken.length)));
      else code.append(element(active ? 'mark' : 'span', line || ' '));
      if (i < lines.length - 1) code.append(doc.createTextNode('\n'));
    });
    const firstMark=code.querySelector('mark'),pre=code.parentElement;
    if(firstMark){const offset=firstMark.getBoundingClientRect().top-pre.getBoundingClientRect().top+pre.scrollTop;pre.scrollTop=Math.max(0,offset-24);}
    $('[data-p09-copy-status]').textContent = '';
    $('[data-p09-prev]').disabled = index === 0;
    $('[data-p09-next]').disabled = index === lesson.stages.length - 1;
    $('[data-p09-mobile-prev]').disabled=index===0;
    $('[data-p09-mobile-next]').disabled=index===lesson.stages.length-1;
    $('[data-p09-position]').textContent = `${index + 1} / ${lesson.stages.length}`;
    $('[data-p09-stage-select]').value=stage.id;
    root.querySelectorAll('[data-p09-stage]').forEach((button) => {
      if (button.dataset.p09Stage === stage.id) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    });
    $('[data-p09-compare]').hidden = lesson.id !== 'references';
    $('[data-p09-compare]').setAttribute('aria-pressed', String(comparison));
    $('[data-p09-comparison]').hidden = !comparison;
  }
  function selectTopic(id) {
    lesson = available.find((item) => item.id === id) || defaultLesson;
    index = 0; comparison = false; renderStages(); render(); save();
  }
  function restore(record) {
    lesson = available.find((item) => item.id === record?.topic) || defaultLesson;
    const i = lesson.stages.findIndex((stage) => stage.id === record?.stage);
    index = i < 0 ? 0 : i; comparison = lesson.id === 'references' && record?.comparison === true;
    renderStages(); render();
  }
  $('[data-p09-topic]').addEventListener('change', (event) => selectTopic(event.target.value));
  $('[data-p09-stage-select]').addEventListener('change',(event)=>{const i=lesson.stages.findIndex((stage)=>stage.id===event.target.value);if(i>=0){index=i;render();save();}});
  function moveStep(delta){const next=Math.max(0,Math.min(lesson.stages.length-1,index+delta));if(next===index)return;const focus=doc.activeElement;index=next;render();save();if(focus?.disabled){const target=mobile?.matches?$('[data-p09-stage-select]'):$(`[data-p09-stage="${lesson.stages[index].id}"]`);target.focus();}}
  $('[data-p09-prev]').addEventListener('click',()=>moveStep(-1));
  $('[data-p09-next]').addEventListener('click',()=>moveStep(1));
  $('[data-p09-mobile-prev]').addEventListener('click',()=>moveStep(-1));
  $('[data-p09-mobile-next]').addEventListener('click',()=>moveStep(1));
  $('[data-p09-compare]').addEventListener('click', () => { comparison = !comparison; render(); save(); });
  $('[data-p09-zoom]').addEventListener('click', () => { zoom = !zoom; zoomManual = true; render(); });
  mobile?.addEventListener('change', (event) => { if (!zoomManual) zoom = event.matches; render(); });
  $('[data-p09-stages]').addEventListener('keydown', (event) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    const buttons = [...root.querySelectorAll('[data-p09-stage]')];
    const current = buttons.indexOf(doc.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1)));
    buttons[next].focus();
  });
  $('[data-p09-copy]').addEventListener('click', async () => {
    const requestedGeneration = renderGeneration, requestId = ++copyRequestId, copyText = codeForDisplay(lesson.stages[index]);
    const isCurrentRequest = () => requestedGeneration === renderGeneration && requestId === copyRequestId;
    try { await win.navigator.clipboard.writeText(copyText); if (isCurrentRequest()) $('[data-p09-copy-status]').textContent = '코드를 복사했습니다.'; }
    catch { if (!isCurrentRequest()) return; const range = doc.createRange(); range.selectNodeContents($('[data-p09-code]')); const selection = win.getSelection(); selection.removeAllRanges(); selection.addRange(range); $('[data-p09-copy-status]').textContent = '코드를 선택했습니다. 복사 키를 눌러 주세요.'; }
  });
  function revealSource() {
    let id; try { id = decodeURIComponent(win.location.hash.slice(1)); } catch { return; }
    const target = doc.getElementById(id);
    if (!target) return;
    let details = target.closest('details');
    while (details) { details.open = true; details = details.parentElement?.closest('details'); }
  }
  root.querySelector('a[href="#p09-original"]').addEventListener('click', () => { const original = doc.getElementById('p09-original'); if (original) original.open = true; });
  win.addEventListener('hashchange', revealSource);
  win.addEventListener('popstate', () => {
    const record = win.history.state?.[key];
    if (record) restore(record);
    else save(); // 원문 앵커의 새 history 항목에는 현재 장면을 이어 둔다.
    revealSource();
  });
  renderComparison(); restore(win.history.state?.[key]); revealSource();
}

if (typeof document !== 'undefined') initP09Learning(document, window);
