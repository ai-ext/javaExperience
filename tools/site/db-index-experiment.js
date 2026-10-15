(() => {
  const root = document.querySelector('[data-db-index-lab]');
  if (!root) return;

  const selectValues = {
    before: {
      title: '기존 인덱스 · practice', mark: '01 / 03',
      relation: 'practice · post_like',
      query: `SELECT l.id, l.post_id, l.created_at\nFROM post_like AS l\nWHERE l.member_id = 12\nORDER BY l.created_at DESC, l.id DESC\nLIMIT 6;`,
      notice: 'V2 전후만 같은 API의 비교 대상입니다. 계획은 데이터와 통계에 따라 달라집니다.'
    },
    after: {
      title: '복합 인덱스 추가 · practice', mark: '02 / 03',
      relation: 'practice · post_like',
      query: `SELECT l.id, l.post_id, l.created_at\nFROM post_like AS l\nWHERE l.member_id = 12\nORDER BY l.created_at DESC, l.id DESC\nLIMIT 6;`,
      notice: 'V2가 VISIBLE인 상태에서 같은 API를 확인합니다. key·정렬 처리·실제 수행 정보는 실행 결과를 기록하세요.'
    },
    invisible: {
      title: '독립 실습 인덱스 · javaexperience_perf', mark: '03 / 03',
      relation: 'javaexperience_perf · post_like · 500,000행 fixture',
      query: `SELECT l.id, l.post_id, l.created_at\nFROM post_like AS l\nWHERE l.member_id = 42\nORDER BY l.created_at DESC, l.id DESC\nLIMIT 11;`,
      notice: '이 상태는 별도 javaexperience_perf fixture에서만 측정합니다. practice DB의 V2 인덱스와 GET API에는 적용하지 않습니다.'
    }
  };
  const fields = ['key', 'estimatedRows', 'extra', 'actualRows', 'loops', 'actualTime'];
  const records = Object.fromEntries(Object.keys(selectValues).map((state) => [state, Object.fromEntries(fields.map((field) => [field, '']))]));
  let activeState = 'before';
  let activeTab = 'estimate';
  const query = root.querySelector('[data-query]');
  const title = root.querySelector('[data-state-title]');
  const mark = root.querySelector('[data-state-mark]');
  const notice = root.querySelector('[data-state-notice]');
  const tabs = [...root.querySelectorAll('[data-plan-tab]')];
  const panels = [...root.querySelectorAll('[data-plan-panel]')];
  const cards = [...root.querySelectorAll('[data-state]')];

  const saveRecord = () => {
    for (const field of fields) {
      const input = root.querySelector(`[data-field="${field}"]`);
      if (input) records[activeState][field] = input.value;
    }
  };
  const render = () => {
    const item = selectValues[activeState];
    title.textContent = item.title;
    mark.textContent = item.mark;
    notice.textContent = item.notice;
    query.textContent = `${activeTab === 'estimate' ? 'EXPLAIN' : 'EXPLAIN ANALYZE'}\n${item.query}`;
    for (const card of cards) {
      const selected = card.dataset.state === activeState;
      card.classList.toggle('is-active', selected);
      card.setAttribute('aria-pressed', String(selected));
    }
    for (const tab of tabs) {
      const selected = tab.dataset.planTab === activeTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.planPanel !== activeTab;
    for (const field of fields) {
      const input = root.querySelector(`[data-field="${field}"]`);
      if (input) input.value = records[activeState][field];
    }
  };

  for (const card of cards) card.addEventListener('click', () => {
    saveRecord();
    activeState = card.dataset.state;
    render();
    const status = root.querySelector('[data-lab-status]');
    if (status) status.textContent = `${selectValues[activeState].title} 상태를 선택했습니다.`;
  });
  for (const field of fields) {
    const input = root.querySelector(`[data-field="${field}"]`);
    input?.addEventListener('input', () => { records[activeState][field] = input.value; });
  }
  const activateTab = (tab) => {
    saveRecord();
    activeTab = tab.dataset.planTab;
    render();
    tab.focus();
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      let index = tabs.indexOf(tab);
      if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[index]);
    });
  }
  render();
})();
