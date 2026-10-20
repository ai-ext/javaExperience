document.querySelectorAll('.db07-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db07-panel]')];
  const names = { derived: '파생 메서드', jpql: 'JPQL @Query', native: 'native SQL', mybatis: 'MyBatis XML', querydsl: 'QueryDSL' };
  const show = (name) => {
    const active = panels.find((panel) => panel.dataset.db07Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db07Screen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db07-go]')) button.addEventListener('click', () => show(button.dataset.db07Go));
  for (const button of journey.querySelectorAll('[data-db07-method]')) button.addEventListener('click', () => {
    for (const item of journey.querySelectorAll('[data-db07-method]')) item.setAttribute('aria-pressed', String(item === button));
    journey.querySelector('[data-db07-selected-method]').textContent = `${names[button.dataset.db07Method]} 한 개`;
  });
  for (const button of journey.querySelectorAll('[data-db07-copy]')) button.addEventListener('click', async () => {
    const key = button.dataset.db07Copy;
    const code = journey.querySelector(`[data-db07-code="${key}"]`);
    const state = journey.querySelector(`[data-db07-copy-state="${key}"]`);
    try {
      await navigator.clipboard.writeText(code.textContent);
      state.textContent = key === 'baseline'
        ? '읽기 전용 SQL을 복사했습니다. practice DB에서 직접 실행하세요.'
        : '원문 코드 조각을 복사했습니다. 현재 프로젝트의 의존성과 타입을 먼저 확인하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.addRange(range);
      state.textContent = '코드를 선택했습니다. 직접 복사해 사용하세요.';
    }
  });
  const records = [...journey.querySelectorAll('[data-db07-record]')];
  const status = journey.querySelector('[data-db07-compare-status]');
  const parse = (value) => {
    const raw = value.trim();
    if (!raw) return null;
    const ids = raw.split(/[\s,]+/).filter(Boolean);
    return ids.every((id) => /^[1-9]\d*$/.test(id)) ? ids : undefined;
  };
  const refresh = () => {
    const parsed = records.map((record) => parse(record.value));
    if (parsed.includes(undefined)) status.textContent = '글 ID를 양수로 쉼표·공백·줄바꿈으로 구분해 적으세요.';
    else if (parsed.includes(null)) status.textContent = '각 구현을 하나씩 실행한 뒤 실제 첫 다섯 ID를 기록하세요.';
    else status.textContent = parsed.every((ids) => ids.join(',') === parsed[0].join(','))
      ? '입력한 다섯 기록의 ID 순서가 같습니다. 실제 실행과 DTO 필드는 별도로 확인하세요.'
      : '입력한 기록의 ID 또는 순서가 다릅니다. 조건·정렬·매핑을 다시 확인하세요.';
  };
  for (const record of records) record.addEventListener('input', refresh);
  refresh();
  show('scenario');
});
