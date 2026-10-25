document.querySelectorAll('.l12-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-l12-panel]')];
  const original = document.querySelector('#l12-original');
  const base = document.querySelector('.server-url');
  const cards = new Map([...document.querySelectorAll('.api-request[data-request-id]')].map((card) => [card.dataset.requestId, card]));
  const requestPanel = {
    P: 'create', A: 'jpa-request', B: 'mybatis-request',
    C: 'board', D: 'author', E: 'search', F: 'exists', G: 'count', H: 'page',
    I: 'hide', J: 'hidden-get', K: 'restore',
  };
  for (const slot of journey.querySelectorAll('[data-l12-request-slot]')) {
    const card = cards.get(slot.dataset.l12RequestSlot);
    if (card) slot.append(card);
  }
  const firstBaseSlot = journey.querySelector('[data-l12-request-slot="P"] [data-l12-base-slot]');
  if (base && firstBaseSlot) firstBaseSlot.append(base);
  const originalRequests = original?.querySelector('.api-practice');
  if (originalRequests) {
    const note = document.createElement('p');
    note.className = 'l12-original-request-note';
    note.textContent = '이 요청들은 위의 16개 장면에 하나씩 배치했습니다. 순서에서 요청을 고르면 해당 장면으로 이동합니다.';
    originalRequests.querySelector('.request-panel-heading')?.after(note);
  }
  const show = (name, scroll = true) => {
    const active = panels.find((panel) => panel.dataset.l12Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.l12Screen = name;
    const baseSlot = active.querySelector('[data-l12-base-slot]');
    if (base && baseSlot) baseSlot.append(base);
    if (scroll) journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-l12-go]')) {
    button.addEventListener('click', () => show(button.dataset.l12Go));
  }
  for (const link of journey.querySelectorAll('[data-l12-source]')) {
    link.addEventListener('click', () => { if (original) original.open = true; });
  }
  for (const link of document.querySelectorAll('.request-steps a[href^="#browser-request-"]')) {
    const id = [...cards].find(([, card]) => `#${card.id}` === link.getAttribute('href'))?.[0];
    if (requestPanel[id]) link.addEventListener('click', () => show(requestPanel[id]));
  }
  show('scenario', false);
});
