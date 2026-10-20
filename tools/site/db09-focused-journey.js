document.querySelectorAll('.db09-focused').forEach((journey)=>{
  const panels=[...journey.querySelectorAll('[data-db09-panel]')];
  const show=(name)=>{
    const active=panels.find((panel)=>panel.dataset.db09Panel===name);
    if(!active)return;
    for(const panel of panels)panel.hidden=panel!==active;
    journey.dataset.db09Screen=name;
    for(const button of journey.querySelectorAll('.db09-progress [data-db09-go]'))button.setAttribute('aria-current',button.dataset.db09Go===name?'step':'false');
    journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for(const button of journey.querySelectorAll('[data-db09-go]'))button.addEventListener('click',()=>show(button.dataset.db09Go));
  const copy=journey.querySelector('[data-db09-copy]');
  copy.addEventListener('click',async()=>{
    const code=journey.querySelector('[data-db09-code]');
    const state=journey.querySelector('[data-db09-copy-state]');
    try{await navigator.clipboard.writeText(code.textContent);state.textContent='SQL을 복사했습니다. 격리 DB 연결을 확인하고 직접 실행하세요.';}
    catch{const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(code);selection.addRange(range);state.textContent='SQL을 선택했습니다. 직접 복사해 사용하세요.';}
  });
  const fields=[...journey.querySelectorAll('[data-db09-record]')];
  const checks=[...journey.querySelectorAll('[data-db09-check]')];
  const key='javaexperience-db09-record-v1';
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    for(const field of fields)field.value=saved[field.dataset.db09Record]||'';
    for(const check of checks)check.checked=Boolean(saved[`check-${check.dataset.db09Check}`]);
    const prior=JSON.parse(localStorage.getItem('javaexperience-db08-plan-v1')||'{}');
    const priorSummary=['type','key','rows','extra'].filter((item)=>prior[item]).map((item)=>`${item}: ${prior[item]}`).join(' · ');
    journey.querySelector('[data-db09-db08-summary]').textContent=priorSummary||'DB-08 기록이 없으면 이전 장면의 내 EXPLAIN 결과를 먼저 확인하세요.';
  }catch{journey.querySelector('[data-db09-db08-summary]').textContent='DB-08 결과는 직접 확인해 적으세요.';}
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(Object.fromEntries([...fields.map((item)=>[item.dataset.db09Record,item.value]),...checks.map((item)=>[`check-${item.dataset.db09Check}`,item.checked])])));}catch{/* 저장소를 쓸 수 없어도 화면 입력은 계속된다. */}};
  for(const field of fields)field.addEventListener('input',save);
  for(const check of checks)check.addEventListener('change',save);
  show('scenario');
});
