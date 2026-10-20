document.querySelectorAll('.db08-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db08-panel]')];
  const show = (name) => {
    const active = panels.find((panel) => panel.dataset.db08Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db08Screen = name;
    for (const button of journey.querySelectorAll('.db08-progress [data-db08-go]')) button.setAttribute('aria-current', button.dataset.db08Go === name ? 'step' : 'false');
    journey.scrollIntoView({block:'start',behavior:'instant'});
  };
  for (const button of journey.querySelectorAll('[data-db08-go]')) button.addEventListener('click', () => show(button.dataset.db08Go));
  for (const button of journey.querySelectorAll('[data-db08-copy]')) button.addEventListener('click', async () => {
    const key = button.dataset.db08Copy;
    const snippet = journey.querySelector(`[data-db08-code="${key}"]`);
    const state = journey.querySelector(`[data-db08-copy-state="${key}"]`);
    try {
      await navigator.clipboard.writeText(snippet.textContent);
      state.textContent = '복사했습니다. 연결한 DB를 확인하고 직접 실행하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(snippet);
      selection.addRange(range);
      state.textContent = '명령을 선택했습니다. 직접 복사해 사용하세요.';
    }
  });
  const storageKey = 'javaexperience-db08-plan-v1';
  const records = [...journey.querySelectorAll('[data-db08-record]')];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    for (const record of records) record.value = saved[record.dataset.db08Record] || '';
  } catch { /* 저장소 접근이 막힌 환경에서는 빈 입력으로 시작한다. */ }
  for (const record of records) record.addEventListener('input', () => {
    try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(records.map((item)=>[item.dataset.db08Record,item.value])))); }
    catch { /* 로컬 저장 없이도 입력은 유지된다. */ }
  });
  show('scenario');
});
