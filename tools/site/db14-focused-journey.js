document.querySelectorAll('.db14-focused').forEach((journey)=>{
  const panels=[...journey.querySelectorAll('[data-db14-panel]')];
  const fields=[...journey.querySelectorAll('[data-db14-record]')];
  const idField=(key)=>journey.querySelector(`[data-db14-record="${key}"]`);
  const show=(name)=>{
    const active=panels.find((panel)=>panel.dataset.db14Panel===name);
    if(!active)return;
    if(name==='compare'&&!idField('before-ids').value.trim()&&idField('baseline-ids').value.trim())idField('before-ids').value=idField('baseline-ids').value;
    for(const panel of panels)panel.hidden=panel!==active;
    journey.dataset.db14Screen=name;
    for(const button of journey.querySelectorAll('.db14-progress [data-db14-go]'))button.setAttribute('aria-current',button.dataset.db14Go===name?'step':'false');
    journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for(const button of journey.querySelectorAll('[data-db14-go]'))button.addEventListener('click',()=>show(button.dataset.db14Go));
  for(const button of journey.querySelectorAll('[data-db14-copy]'))button.addEventListener('click',async()=>{
    const key=button.dataset.db14Copy;
    const snippet=journey.querySelector(`[data-db14-code="${key}"]`);
    const status=journey.querySelector(`[data-db14-copy-state="${key}"]`);
    try{await navigator.clipboard.writeText(snippet.textContent);status.textContent='복사했습니다. 연결한 DB와 현재 인덱스 상태를 확인하고 직접 실행하세요.';}
    catch{const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(snippet);selection.addRange(range);status.textContent='명령을 선택했습니다. 직접 복사해 사용하세요.';}
  });
  const storageKey='javaexperience-db14-schema-to-plan-v1';
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const field of fields)field.value=saved[field.dataset.db14Record]||'';}catch{/* 저장소가 막혀도 현재 화면에서 기록할 수 있다. */}
  const parseIds=(value)=>{
    if(!value.trim())return null;
    const ids=value.trim().split(/[\s,]+/).filter(Boolean);
    return ids.every((id)=>/^[1-9]\d*$/.test(id))?ids:undefined;
  };
  const refresh=()=>{
    const before=parseIds(idField('before-ids').value),after=parseIds(idField('after-ids').value);
    const status=journey.querySelector('[data-db14-id-status]');
    if(before===undefined||after===undefined)status.textContent='post ID를 양수로 쉼표·공백·줄바꿈으로 구분해 적으세요.';
    else if(before===null||after===null)status.textContent='아직 비교 전 · 실제 ID를 양쪽에 기록하세요.';
    else status.textContent=before.join(',')===after.join(',')
      ?'입력한 post ID와 순서가 같습니다. 실제 DB 실행·JOIN 응답·계획은 별도로 확인하세요.'
      :'입력한 post ID 또는 순서가 다릅니다. 데이터·WHERE·ORDER BY·LIMIT을 다시 확인하세요.';
  };
  for(const field of fields)field.addEventListener('input',()=>{
    try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(fields.map((item)=>[item.dataset.db14Record,item.value]))));}catch{/* 저장 실패에도 현재 입력은 유지된다. */}
    refresh();
  });
  refresh();show('scenario');
});
