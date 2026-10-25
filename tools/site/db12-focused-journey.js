document.querySelectorAll('.db12-focused').forEach((journey)=>{
  const panels=[...journey.querySelectorAll('[data-db12-panel]')];
  const show = (name, scroll = true) =>{
    const active=panels.find((panel)=>panel.dataset.db12Panel===name);
    if(!active)return;
    for(const panel of panels)panel.hidden=panel!==active;
    journey.dataset.db12Screen=name;
    for(const button of journey.querySelectorAll('.db12-progress [data-db12-go]'))button.setAttribute('aria-current',button.dataset.db12Go===name?'step':'false');
    if (scroll) journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for(const button of journey.querySelectorAll('[data-db12-go]'))button.addEventListener('click',()=>show(button.dataset.db12Go));
  for(const button of journey.querySelectorAll('[data-db12-copy]'))button.addEventListener('click',async()=>{
    const key=button.dataset.db12Copy;
    const code=journey.querySelector(`[data-db12-code="${key}"]`);
    const status=journey.querySelector(`[data-db12-copy-state="${key}"]`);
    try{await navigator.clipboard.writeText(code.textContent);status.textContent='읽기 SQL을 복사했습니다. practice DB에서 직접 실행하세요.';}
    catch{const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(code);selection.addRange(range);status.textContent='SQL을 선택했습니다. 직접 복사해 사용하세요.';}
  });
  const fields=[...journey.querySelectorAll('[data-db12-record]')];
  const storageKey='javaexperience-db12-comparison-v1';
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const field of fields)field.value=saved[field.dataset.db12Record]||'';}catch{/* 저장소 접근이 없어도 입력할 수 있다. */}
  const parseLike=(value)=>{
    if(!value.trim())return null;
    const lines=value.trim().split(/\n+/).map((line)=>line.trim()).filter(Boolean);
    if(!lines.length)return null;
    const tuples=lines.map((line)=>line.split(/\s*,\s*/));
    if(tuples.some((tuple)=>tuple.length!==3||!tuple.slice(0,2).every((id)=>/^[1-9]\d*$/.test(id))||!tuple[2]))return undefined;
    return tuples.map((tuple)=>tuple.join('|'));
  };
  const parseIds=(value)=>{
    if(!value.trim())return null;
    const ids=value.trim().split(/[\s,]+/).filter(Boolean);
    return ids.every((id)=>/^[1-9]\d*$/.test(id))?ids:undefined;
  };
  const compare=(a,b,parser,target,label)=>{
    const left=parser(journey.querySelector(`[data-db12-record="${a}"]`).value);
    const right=parser(journey.querySelector(`[data-db12-record="${b}"]`).value);
    if(left===undefined||right===undefined)target.textContent=label==='M3'?'like_id,post_id,liked_at을 한 행에 쉼표로 구분해 적으세요.':'글 ID를 양수로 쉼표·공백·줄바꿈으로 구분해 적으세요.';
    else if(left===null||right===null)target.textContent='아직 실행 전 · 두 결과를 기록하세요.';
    else target.textContent=left.join(',')===right.join(',')?'입력한 두 기록의 값과 순서가 같습니다. 실제 DB 실행과 권한 조건은 별도로 확인하세요.':'입력한 결과 또는 순서가 다릅니다. WHERE·ORDER BY·LIMIT·중복을 다시 확인하세요.';
  };
  const refresh=()=>{
    compare('like-join-result','like-exists-result',parseLike,journey.querySelector('[data-db12-like-status]'),'M3');
    compare('tag-join-result','tag-exists-result',parseIds,journey.querySelector('[data-db12-tag-status]'),'tag');
  };
  for(const field of fields)field.addEventListener('input',()=>{
    try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(fields.map((item)=>[item.dataset.db12Record,item.value]))));}catch{/* 저장 실패에도 현재 입력은 유지된다. */}
    refresh();
  });
  refresh();show('scenario', false);
});
