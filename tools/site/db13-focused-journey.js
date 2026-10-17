document.querySelectorAll('.db13-focused').forEach((journey)=>{
  const panels=[...journey.querySelectorAll('[data-db13-panel]')];
  const show=(name)=>{
    const active=panels.find((panel)=>panel.dataset.db13Panel===name);
    if(!active)return;
    for(const panel of panels)panel.hidden=panel!==active;
    journey.dataset.db13Screen=name;
    for(const button of journey.querySelectorAll('.db13-progress [data-db13-go]'))button.setAttribute('aria-current',button.dataset.db13Go===name?'step':'false');
    journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for(const button of journey.querySelectorAll('[data-db13-go]'))button.addEventListener('click',()=>show(button.dataset.db13Go));
  for(const button of journey.querySelectorAll('[data-db13-copy]'))button.addEventListener('click',async()=>{
    const key=button.dataset.db13Copy;
    const snippet=journey.querySelector(`[data-db13-code="${key}"]`);
    const status=journey.querySelector(`[data-db13-copy-state="${key}"]`);
    try{await navigator.clipboard.writeText(snippet.textContent);status.textContent='원문 예시를 복사했습니다. 실제 API 계약과 바인딩을 확인하세요.';}
    catch{const selection=window.getSelection();selection.removeAllRanges();const range=document.createRange();range.selectNodeContents(snippet);selection.addRange(range);status.textContent='예시 코드를 선택했습니다. 직접 복사해 사용하세요.';}
  });
  for(const button of journey.querySelectorAll('[data-db13-method]'))button.addEventListener('click',()=>{
    for(const item of journey.querySelectorAll('[data-db13-method]'))item.setAttribute('aria-pressed',String(item===button));
    journey.querySelector('[data-db13-method-status]').textContent=button.dataset.db13Method==='jpa'
      ?'JPA를 사용한다면 Hibernate의 실행 SQL을 확인하세요.'
      :'MyBatis를 사용한다면 Executor나 datasource에서 실행 SELECT를 세세요. Hibernate Statistics만으로는 Mapper SQL을 셀 수 없습니다.';
  });
  const fields=[...journey.querySelectorAll('[data-db13-record]')];
  const storageKey='javaexperience-db13-query-trace-v1';
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const field of fields)field.value=saved[field.dataset.db13Record]||'';}catch{/* 로컬 저장이 막힌 환경에서도 기록할 수 있다. */}
  const count=(name)=>{
    const raw=journey.querySelector(`[data-db13-record="${name}"]`).value.trim();
    if(!raw)return null;
    return /^[1-9]\d*$/.test(raw)?Number(raw):undefined;
  };
  const refresh=()=>{
    const before5=count('before-5'),before20=count('before-20');
    const baseline=journey.querySelector('[data-db13-count-status]');
    if(before5===undefined||before20===undefined)baseline.textContent='실제 SELECT 문장 수를 양의 정수로 적으세요.';
    else if(before5===null||before20===null)baseline.textContent='아직 측정 전 · 두 크기의 실제 로그를 기록하세요.';
    else baseline.textContent=before20>before5
      ?'입력한 문장 수가 size=20에서 늘었습니다. 반복 SQL 서명과 실제 반환 글 수를 확인하세요.'
      :'입력한 문장 수가 크기와 함께 늘지 않았습니다. 마지막 페이지 count 생략과 실제 응답도 확인하세요.';
    const after5=count('after-5'),after20=count('after-20');
    const after=journey.querySelector('[data-db13-after-status]');
    if(after5===undefined||after20===undefined)after.textContent='재측정한 SELECT 문장 수를 양의 정수로 적으세요.';
    else if(after5===null||after20===null)after.textContent='아직 재측정 전 · 응답과 실제 SQL 수를 기록하세요.';
    else after.textContent=after20>after5
      ?'변경 후에도 큰 페이지에서 문장 수가 늘었습니다. SQL 서명과 컬렉션 조회를 다시 확인하세요.'
      :'입력한 문장 수가 크기와 함께 늘지 않았습니다. 변경 전후 JSON 값·순서를 직접 비교하세요.';
  };
  for(const field of fields)field.addEventListener('input',()=>{
    try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(fields.map((item)=>[item.dataset.db13Record,item.value]))));}catch{/* 입력은 현재 페이지에 남는다. */}
    refresh();
  });
  refresh();show('scenario');
});
