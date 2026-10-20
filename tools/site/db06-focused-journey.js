document.querySelectorAll('.db06-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db06-panel]')];
  const show = (name) => {
    const active = panels.find((panel) => panel.dataset.db06Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db06Screen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db06-go]')) button.addEventListener('click', () => show(button.dataset.db06Go));
  const mini = { 101: '101은 북마크 행이 없으므로 남습니다.', 102: '102는 북마크 행이 있어 제외됩니다.', 103: '103은 북마크 행이 있어 제외됩니다.' };
  for (const button of journey.querySelectorAll('[data-db06-mini]')) button.addEventListener('click', () => {
    for (const item of journey.querySelectorAll('[data-db06-mini]')) item.setAttribute('aria-pressed', String(item === button));
    journey.querySelector('[data-db06-mini-result]').textContent = mini[button.dataset.db06Mini];
  });
  for (const button of journey.querySelectorAll('[data-db06-match]')) button.addEventListener('click', () => {
    for (const item of journey.querySelectorAll('[data-db06-match]')) item.setAttribute('aria-pressed', String(item === button));
    journey.querySelector('[data-db06-decision]').textContent = button.dataset.db06Match === 'yes'
      ? '매칭 행이 있으므로 NOT EXISTS가 FALSE → 결과에서 제외'
      : '매칭 행이 없으므로 NOT EXISTS가 TRUE → 결과에 남김';
  });
  for (const button of journey.querySelectorAll('[data-db06-copy]')) button.addEventListener('click', async () => {
    const key = button.dataset.db06Copy;
    const code = journey.querySelector(`[data-db06-sql="${key}"]`);
    const state = journey.querySelector(`[data-db06-copy-state="${key}"]`);
    try {
      await navigator.clipboard.writeText(code.textContent);
      state.textContent = 'SQL을 복사했습니다. practice DB에서 직접 실행하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.addRange(range);
      state.textContent = 'SQL을 선택했습니다. 직접 복사해 DB에서 실행하세요.';
    }
  });
  const records = new Map([...journey.querySelectorAll('[data-db06-record]')].map((input) => [input.dataset.db06Record, input]));
  const status = journey.querySelector('[data-db06-comparison-status]');
  const parse = (value) => {
    const raw = value.trim();
    if (!raw) return null;
    if (raw === '없음') return [];
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    return parts.every((part) => /^[1-9]\d*$/.test(part)) ? parts : undefined;
  };
  const refresh = () => {
    const keys = ['not-exists', 'not-in', 'left-join'];
    const parsed = keys.map((key) => parse(records.get(key).value));
    keys.forEach((key) => { journey.querySelector(`[data-db06-display="${key}"]`).textContent = records.get(key).value.trim() || '아직 기록 전'; });
    if (parsed.includes(undefined)) status.textContent = '글 ID를 양수로 쉼표·공백·줄바꿈으로 구분해 적거나, 결과가 없으면 “없음”이라고 적으세요.';
    else if (parsed.includes(null)) status.textContent = '세 SQL을 실행한 뒤 각 장면에 결과를 기록하세요.';
    else status.textContent = parsed.every((list) => list.join(',') === parsed[0].join(','))
      ? '입력한 세 기록의 글 ID와 순서가 같습니다. 실제 DB 실행 여부는 직접 확인하세요.'
      : '입력한 세 기록의 글 ID 또는 순서가 다릅니다. SQL 조건과 정렬을 다시 확인하세요.';
  };
  for (const input of records.values()) input.addEventListener('input', refresh);
  refresh();
  show('scenario');
});
