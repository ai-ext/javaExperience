document.querySelectorAll('.db10-focused').forEach((journey)=>{
  const panels=[...journey.querySelectorAll('[data-db10-panel]')];
  const show=(name)=>{
    const active=panels.find((panel)=>panel.dataset.db10Panel===name);
    if(!active)return;
    for(const panel of panels)panel.hidden=panel!==active;
    journey.dataset.db10Screen=name;
    for(const button of journey.querySelectorAll('.db10-progress [data-db10-go]'))button.setAttribute('aria-current',button.dataset.db10Go===name?'step':'false');
    journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for(const button of journey.querySelectorAll('[data-db10-go]'))button.addEventListener('click',()=>show(button.dataset.db10Go));
  for(const button of journey.querySelectorAll('[data-db10-copy]'))button.addEventListener('click',async()=>{
    const key=button.dataset.db10Copy;
    const code=journey.querySelector(`[data-db10-code="${key}"]`);
    const state=journey.querySelector(`[data-db10-copy-state="${key}"]`);
    try{await navigator.clipboard.writeText(code.textContent);state.textContent='복사했습니다. 연결한 DB와 현재 인덱스를 확인하고 직접 실행하세요.';}
    catch{const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(code);selection.addRange(range);state.textContent='명령을 선택했습니다. 직접 복사해 사용하세요.';}
  });
  const fields=[...journey.querySelectorAll('[data-db10-record]')];
  const key='javaexperience-db10-comparison-v1';
  try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const field of fields)field.value=saved[field.dataset.db10Record]||'';}catch{/* 저장소 접근이 막히면 빈 기록으로 시작한다. */}
  const status=journey.querySelector('[data-db10-compare-status]');
  const parse=(value)=>{
    const text=value.trim();if(!text)return null;
    const ids=text.split(/[\s,]+/).filter(Boolean);
    return ids.every((id)=>/^[1-9]\d*$/.test(id))?ids:undefined;
  };
  const refresh=()=>{
    const before=parse(journey.querySelector('[data-db10-record="before-ids"]').value);
    const after=parse(journey.querySelector('[data-db10-record="after-ids"]').value);
    if(before===undefined||after===undefined)status.textContent='좋아요 ID를 양수로 쉼표·공백·줄바꿈으로 구분해 적으세요.';
    else if(before===null||after===null)status.textContent='전후 ID를 실제 실행해 기록하세요.';
    else status.textContent=before.join(',')===after.join(',')?'입력한 전후 ID 순서가 같습니다. 실제 DB 실행과 응답 필드는 별도로 확인하세요.':'입력한 ID 또는 순서가 다릅니다. 데이터·조건·정렬·LIMIT을 다시 확인하세요.';
  };
  for(const field of fields)field.addEventListener('input',()=>{
    try{localStorage.setItem(key,JSON.stringify(Object.fromEntries(fields.map((item)=>[item.dataset.db10Record,item.value]))));}catch{/* 저장되지 않아도 현재 입력은 유지된다. */}
    refresh();
  });
  refresh();show('scenario');
});
