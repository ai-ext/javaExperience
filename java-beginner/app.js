// Embedded into java-beginner.html by build.mjs. No imports or network dependencies.
const course=JSON.parse(document.getElementById('course-data').textContent);
const apis=course.modules.flatMap(m=>m.apis.map(a=>({...a,module:m})));
const byId=new Map(apis.map(a=>[a.id,a]));
const progressKey='java-beginner.standalone.progress.v2';
const content=document.getElementById('content');
let completed=[];
try {
  const currentSaved=localStorage.getItem(progressKey);
  const saved=currentSaved===null?migrateLegacyProgress(JSON.parse(localStorage.getItem('java-beginner.standalone.progress.v1')||'[]')):JSON.parse(currentSaved);
  if(Array.isArray(saved)) completed=[...new Set(saved.filter(x=>Number.isInteger(x)&&x>=1&&x<=60))];
  if(currentSaved===null) localStorage.setItem(progressKey,JSON.stringify(completed));
} catch {}
let current=null, selectedApi=null, selectedCase=null, target='http://127.0.0.1:8080';
let vars={}, csrf='', bearer='', generation=0, pending=null, blobUrl=null;
let runnerReady=false, toastTimer;
const $=id=>document.getElementById(id);
function toast(message){const node=$('toast');node.textContent=message;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.hidden=true,3500);}
function releaseBlob(){if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}}
function navigationState(){
  if(location.hash==='#setup') return {view:'setup'};
  const params=new URLSearchParams(location.hash.slice(1));
  const m=course.modules.find(m=>m.id===params.get('m'));
  if(!m) return {view:'home'};
  const d=m.days.find(d=>d.day===Number(params.get('d'))) || m.days[0];
  const tab=['task','brief','data','api'].includes(params.get('t'))?params.get('t'):'task';
  return {view:'module',m,d,tab};
}
function render(keepScroll=false){
  generation++;
  if(pending){pending.abort();pending=null;}
  releaseBlob();
  current=navigationState();selectedApi=null;selectedCase=null;
  if(current.view==='setup') content.innerHTML=setupMarkup(course);
  else if(current.view==='module') content.innerHTML=moduleMarkup(current.m,current.d,current.tab,completed);
  else content.innerHTML=homeMarkup(course,completed);
  for(const link of document.querySelectorAll('[data-module]')) {
    link.classList.toggle('active',link.dataset.module===current.m?.id);
    if(link.classList.contains('active')) link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
    const m=course.modules.find(m=>m.id===link.dataset.module);
    const count=m.days.filter(d=>completed.includes(d.day)).length;
    const label=link.querySelector('.nav-complete');label.textContent=count===m.days.length?'✓':'';
  }
  $('nav-overview').classList.toggle('active',current.view==='home');
  $('progress-count').textContent=`${completed.length} / 60`;
  $('progress-fill').style.width=`${completed.length/60*100}%`;
  $('header-status').textContent=current.d?`Day ${pad(current.d.day)} / 60`:`${completed.length}회차 완료`;
  document.title=current.d?`Day ${pad(current.d.day)} · ${current.d.title} — 처음 만드는 Java 실무`:'처음 만드는 Java 실무 · 60회차';
  if(current.view==='module'){
    $('complete-day').addEventListener('click',()=>{
      const n=current.d.day;
      completed=completed.includes(n)?completed.filter(x=>x!==n):[...completed,n];
      try{localStorage.setItem(progressKey,JSON.stringify(completed));}catch{toast('이 브라우저에서는 진도를 저장하지 못했습니다. 현재 창에서만 유지합니다.');}
      render(true);$('complete-day').focus({preventScroll:true});
    });
    const all=course.modules.flatMap(m=>m.days.map(d=>({m,d})));
    const index=all.findIndex(x=>x.d.day===current.d.day);
    const prev=all[index-1],next=all[index+1];
    $('day-pagination').innerHTML=`${prev?`<a href="${route(prev.m,prev.d)}">← Day ${pad(prev.d.day)}</a>`:''}${next?`<a href="${route(next.m,next.d)}">Day ${pad(next.d.day)} →</a>`:'<a href="#overview">전체 과정으로 →</a>'}`;
    if(current.tab==='api') mountApi();
  }
  for(const button of document.querySelectorAll('[data-copy]')) button.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(button.dataset.copy);toast('실행 명령을 복사했습니다.');}catch{toast('복사가 지원되지 않습니다. 옆의 실행 명령을 선택해 복사하세요.');}
  });
  if(!keepScroll) window.scrollTo({top:0,behavior:'instant'});
}

async function mountApi(){
  const pageGeneration=generation;
  const preferred=[...new Set(current.d.apiIds.length?current.d.apiIds:current.m.apis.map(a=>a.id))];
  const options=ids=>ids.map(id=>byId.get(id)).filter(Boolean).map(a=>`<option value="${esc(a.id)}">${esc(a.method)} · ${esc(a.title)}</option>`).join('');
  $('api-select').innerHTML=`<optgroup label="오늘 확인할 API">${options(preferred)}</optgroup>${course.modules.map(m=>`<optgroup label="${m.number} ${esc(m.title)}">${options(m.apis.map(a=>a.id).filter(id=>!preferred.includes(id)))}</optgroup>`).join('')}`;
  $('api-select').value=preferred[0] || current.m.apis[0].id;
  $('csrf-token').value=csrf;$('bearer-token').value=bearer;
  $('csrf-token').addEventListener('input',e=>{csrf=e.target.value;clearResponse('토큰을 변경했습니다. 다시 요청하면 새 입력이 반영됩니다.');});
  $('bearer-token').addEventListener('input',e=>{bearer=e.target.value;clearResponse('토큰을 변경했습니다. 다시 요청하면 새 입력이 반영됩니다.');});
  $('api-select').addEventListener('change',selectApi);
  $('case-select').addEventListener('change',fillCase);
  $('restore-example').addEventListener('click',fillCase);
  $('send-request').addEventListener('click',sendRequest);
  for(const id of ['api-path','api-query','api-headers','api-body','api-file','http-method']) $(id).addEventListener('input',()=>{
    if(id==='api-path') renderVars({},true);
    if(id==='http-method') updateBodyVisibility();
    clearResponse('요청을 수정했습니다. 이전 응답은 제거했으며 아직 새 요청을 보내지 않았습니다.');
  });
  runnerReady=false;selectApi();$('send-request').disabled=true;
  if(!['http:','https:'].includes(location.protocol)) {
    $('connection-label').textContent='파일 열기 · 읽기 모드';$('file-notice').hidden=false;$('send-request').disabled=true;return;
  }
  try{
    const config=await fetch('/__config',{cache:'no-store',signal:AbortSignal.timeout(3000)});
    if(!config.ok) throw new Error('Not the local runner');
    const data=await config.json();
    if(!data.target) throw new Error('Missing API target');
    if(pageGeneration!==generation) return;
    target=data.target;runnerReady=true;$('api-target').textContent=target;
    $('connection-label').textContent='전용 실행기 연결됨';$('send-request').disabled=false;
  }catch{
    if(pageGeneration!==generation) return;
    $('connection-label').textContent='전용 실행기에서 열어 주세요';$('file-notice').hidden=false;$('send-request').disabled=true;
  }
}
function selectApi(){
  selectedApi=byId.get($('api-select').value);
  $('case-select').innerHTML=selectedApi.cases.map((c,i)=>`<option value="${i}">${esc(c.label)} · ${c.expect}</option>`).join('');
  fillCase();
}
function fillCase(){
  selectedCase=selectedApi.cases[Number($('case-select').value)] || selectedApi.cases[0];
  const c=selectedCase,a=selectedApi;
  $('http-method').value=c.method || a.method;$('api-path').value=c.path || a.path;
  $('api-query').value=Object.hasOwn(c,'query')?c.query:a.query || '';
  let body=Object.hasOwn(c,'body')?c.body:a.body;
  if(body && typeof body==='object'){
    body=JSON.parse(JSON.stringify(body));
    if(body.productId===1 && vars.productId) body.productId=Number(vars.productId);
  }
  $('api-body').value=body===undefined?'':JSON.stringify(body,null,2);
  const headers=Object.hasOwn(c,'headers')?c.headers:a.id==='order-idempotent'?{'Idempotency-Key':'practice-order-001'}:{};
  $('api-headers').value=JSON.stringify(headers,null,2);
  // 실패 예시의 임시 id를 실제 생성한 자원 번호에 섞지 않는다.
  renderVars(c.vars || {});
  updateBodyVisibility();
  $('api-prepare').textContent=`${a.prepare}${c.withoutAuth?' 이 사례는 먼저 로그아웃하고 새 CSRF 토큰을 준비한 뒤 실행하세요. 쿠키를 자동으로 제거하지 않습니다.':''}`;
  $('api-note').textContent=a.note || '';
  $('expected-status').textContent=`선택한 사례의 예상 HTTP 상태: ${c.expect}${c.expect>=400?' · 의도한 실패 응답':' · 정상 처리/호환 사례'}`;
  const expectedResponse=Object.hasOwn(c,'response')?c.response:c.expect>=400?{code:'서버가 정한 오류 코드',message:'실패 원인 안내'}:a.response;
  $('expected-body-label').textContent=c.expect>=400?'선택한 실패 응답의 구조 예시':'정상 응답 구조 예시';
  $('expected-body').textContent=expectedResponse===null?(a.id==='file-download'?'파일 바이트 · JSON 응답 아님':'본문 없음'):JSON.stringify(expectedResponse,null,2);
  $('api-fields').innerHTML=a.requestFields.length?`<div class="api-field-list">${a.requestFields.map(f=>`<div><code>${esc(f.name)}</code><strong>${esc(f.type)} · ${f.required?'필수':'선택'}</strong><p>${esc(f.note)}</p></div>`).join('')}</div>`:'<p class="subtle">별도 JSON 입력 필드가 없습니다. 경로·쿼리·준비 조건을 확인하세요.</p>';
  clearResponse();
}
function renderVars(overrides={},retainCurrent=false){
  const previous={};for(const input of document.querySelectorAll('[data-path-var]')) previous[input.dataset.pathVar]=input.value;
  const names=[...new Set([...$('api-path').value.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(m=>m[1]))];
  $('path-vars').innerHTML=names.map(name=>`<label class="field"><span>${esc(name)} <small>실제 자원 번호</small></span><input data-path-var="${esc(name)}" value="${esc(overrides[name] ?? (retainCurrent?previous[name]:undefined) ?? vars[name] ?? '')}" placeholder="생성 응답의 id" spellcheck="false"></label>`).join('');
  for(const input of document.querySelectorAll('[data-path-var]')) input.addEventListener('input',()=>{vars[input.dataset.pathVar]=input.value;clearResponse('경로 번호를 바꿨습니다. 아직 새 요청을 보내지 않았습니다.');});
}
function updateBodyVisibility(){
  const sendsBody=!['GET','HEAD'].includes($('http-method').value);
  $('body-field').hidden=!sendsBody || selectedApi.multipart;
  $('file-field').hidden=!sendsBody || !selectedApi.multipart;
}
function clearResponse(message='직접 보낼 때만 실행됩니다. 삭제·주문·취소는 실제 데이터를 변경합니다.'){
  releaseBlob();
  $('response-badge').textContent='미실행';$('response-badge').className='response-badge';
  $('response-meta').textContent='요청을 보내면 실제 HTTP 상태와 소요 시간이 표시됩니다.';
  $('response-body').textContent='';$('response-body').hidden=true;
  $('response-empty').hidden=false;$('response-check').textContent='';$('response-headers').hidden=true;
  $('download-area').hidden=true;$('download-area').replaceChildren();
  $('send-message').textContent=message;$('send-message').className='send-message';
}
async function sendRequest(){
  if(!runnerReady || pending) return;
  const pathVars=Object.fromEntries([...document.querySelectorAll('[data-path-var]')].map(input=>[input.dataset.pathVar,input.value]));
  let request;
  try {
    request=buildRequest({method:$('http-method').value,path:$('api-path').value,vars:pathVars,query:$('api-query').value,headers:$('api-headers').value,body:$('api-body').value,csrf,token:bearer,multipart:selectedApi.multipart,file:$('api-file').files[0]});
  }catch(error){$('send-message').textContent=error.message;$('send-message').className='send-message error';return;}
  clearResponse('요청을 보내는 중입니다.');
  const snapshot={generation,api:selectedApi,case:selectedCase,expected:Number(selectedCase.expect),method:request.init.method};
  const controller=new AbortController();pending=controller;
  const controls=[...content.querySelectorAll('input,select,textarea,button')];for(const control of controls) control.disabled=true;
  const start=performance.now();const timeout=setTimeout(()=>controller.abort(),35000);
  try {
    const response=await fetch(request.url,{...request.init,signal:controller.signal});
    const type=response.headers.get('content-type') || '';
    const isText=/json|text|xml|javascript/.test(type) || !type || response.status===204;
    const raw=isText?await response.text():await response.blob();
    if(snapshot.generation!==generation) return;
    const elapsed=Math.round(performance.now()-start);
    let body=null;if(isText && raw){try{body=JSON.parse(raw);}catch{body=raw;}}
    const fromUpstream=response.headers.get('x-java-beginner-upstream')==='true';
    const fields=snapshot.case.expectedFields ?? (snapshot.expected>=400?['code','message']:snapshot.api.responseFields.map(f=>f.name));
    const inspection=inspectResponse(response.status,body,{expect:snapshot.expected,fields});
    $('response-empty').hidden=true;$('response-badge').textContent=`HTTP ${response.status}`;
    $('response-badge').className=`response-badge ${fromUpstream&&inspection.statusMatch?'success':'error'}`;
    $('response-meta').textContent=`${fromUpstream?'실제 API 서버 응답':'전달 실행기 응답 · API 도달 실패'} · ${elapsed} ms · ${snapshot.method} ${request.path}`;
    if(isText){$('response-body').hidden=false;$('response-body').textContent=raw?(typeof body==='string'?body:JSON.stringify(body,null,2)):'(응답 본문 없음)';}
    else {
      blobUrl=URL.createObjectURL(raw);
      const a=document.createElement('a');a.href=blobUrl;a.className='download-button';
      const disposition=response.headers.get('content-disposition') || '';
      let name='attachment.bin';
      try{name=decodeURIComponent(disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] || disposition.match(/filename="?([^";]+)/i)?.[1] || name);}catch{}
      a.download=name.replace(/[\\/]/g,'_').slice(0,200);a.textContent=`파일 내려받기 · ${raw.size.toLocaleString()} bytes`;
      $('download-area').replaceChildren(a);$('download-area').hidden=false;
    }
    $('response-headers').hidden=false;$('response-header-body').textContent=[...response.headers.entries()].map(([k,v])=>`${k}: ${v}`).join('\n');
    if(!fromUpstream) $('response-check').textContent='API 실행 결과가 아닙니다. 전달 실행기의 오류 안내를 확인하세요.';
    else $('response-check').textContent=`${inspection.statusMatch?'예상 HTTP 상태와 일치합니다.':'예상 HTTP '+snapshot.expected+'와 다릅니다.'} ${fields.length?(inspection.fieldsMatch?'필수 최상위 필드가 있습니다.':'필수 최상위 필드가 없거나 JSON 형식이 다릅니다.'):'본문 형식은 해당 API 정책으로 확인하세요.'} 값과 DB 결과·권한·동시성은 별도 확인이 필요합니다.`;
    if(fromUpstream&&response.ok&&body&&typeof body==='object'){
      const captured=captureResource(snapshot.api.id,body);vars={...vars,...pathVars,...captured};
      $('send-message').textContent=Object.keys(captured).length?`${Object.entries(captured).map(([k,v])=>k+'='+v).join(', ')}를 현재 창의 다음 요청에 이어 씁니다. 자동 완료는 하지 않습니다.`:'요청을 마쳤습니다. 실제 응답과 DB 상태를 직접 확인하세요.';
    }else $('send-message').textContent='요청을 마쳤습니다. 예상 상태와 실제 응답의 차이를 확인하세요.';
  }catch(error){
    if(snapshot.generation!==generation) return;
    $('send-message').textContent=error.name==='AbortError'?'요청 제한 시간이 지났습니다. 응답을 못 받았어도 변경이 적용됐을 수 있으니 사후 조회 후 재시도하세요.':'브라우저에서 실행기에 연결하지 못했습니다. 로컬 실행기가 켜져 있는지 확인하세요.';
    $('send-message').className='send-message error';$('response-badge').textContent='응답 확인 실패';$('response-badge').className='response-badge error';
  }finally{
    clearTimeout(timeout);
    if(snapshot.generation===generation){pending=null;for(const control of controls) if(control.isConnected) control.disabled=false;}
  }
}

$('course-search').addEventListener('input',event=>{
  const query=event.target.value.trim().toLocaleLowerCase();
  const node=$('search-results');
  if(!query){node.hidden=true;node.replaceChildren();return;}
  const found=course.modules.flatMap(m=>m.days.map(d=>({m,d}))).filter(({m,d})=>`${m.title} ${d.day} day${d.day} ${d.title} ${d.concept}`.toLocaleLowerCase().includes(query)).slice(0,10);
  node.hidden=false;node.innerHTML=found.length?found.map(({m,d})=>`<a href="${route(m,d)}"><span>DAY ${pad(d.day)} · ${esc(m.title)}</span><strong>${esc(d.title)}</strong></a>`).join(''):'<p>검색 결과가 없습니다. 게시판·로그인·재고 같은 기능 이름으로 찾아보세요.</p>';
});
$('search-results').addEventListener('click',event=>{if(event.target.closest('a')){$('course-search').value='';$('search-results').hidden=true;}});
document.addEventListener('keydown',event=>{
  if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('course-search').focus();}
  if(event.key==='Escape'){$('course-search').value='';$('search-results').hidden=true;}
});
window.addEventListener('hashchange',()=>render());
render();
