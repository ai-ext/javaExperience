document.querySelectorAll('.db11-focused').forEach((journey)=>{
  const panels=[...journey.querySelectorAll('[data-db11-panel]')];
  const show=(name)=>{
    const active=panels.find((panel)=>panel.dataset.db11Panel===name);
    if(!active)return;
    for(const panel of panels)panel.hidden=panel!==active;
    journey.dataset.db11Screen=name;
    for(const button of journey.querySelectorAll('.db11-progress [data-db11-go]'))button.setAttribute('aria-current',button.dataset.db11Go===name?'step':'false');
    journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for(const button of journey.querySelectorAll('[data-db11-go]'))button.addEventListener('click',()=>show(button.dataset.db11Go));
  for(const button of journey.querySelectorAll('[data-db11-copy]'))button.addEventListener('click',async()=>{
    const key=button.dataset.db11Copy;
    const code=journey.querySelector(`[data-db11-code="${key}"]`);
    const state=journey.querySelector(`[data-db11-copy-state="${key}"]`);
    try{await navigator.clipboard.writeText(code.textContent);state.textContent='복사했습니다. 현재 DB·인덱스 상태를 확인한 뒤 직접 실행하세요.';}
    catch{const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(code);selection.addRange(range);state.textContent='명령을 선택했습니다. 직접 복사해 사용하세요.';}
  });
  const fields=[...journey.querySelectorAll('[data-db11-record]')];
  const key='javaexperience-db11-index-v1';
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const field of fields)field.value=saved[field.dataset.db11Record]||'';}catch{/* 저장소 접근이 막혀도 빈 입력으로 진행한다. */}
  for(const field of fields)field.addEventListener('input',()=>{try{localStorage.setItem(key,JSON.stringify(Object.fromEntries(fields.map((item)=>[item.dataset.db11Record,item.value]))));}catch{/* 저장 실패 시 화면 입력은 유지된다. */}});
  for(const button of journey.querySelectorAll('[data-db11-choice]'))button.addEventListener('click',()=>{
    const drop=button.dataset.db11Choice==='drop';
    for(const item of journey.querySelectorAll('[data-db11-choice]'))item.setAttribute('aria-pressed',String(item===button));
    journey.querySelector('[data-db11-drop]').hidden=!drop;
  });
  show('scenario');
});
