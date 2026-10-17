document.querySelectorAll('.first-java-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-first-java-panel]')];
  const show = (index, scroll = true) => {
    const active = panels[index];
    if (!active) return;
    for (const slot of active.querySelectorAll('[data-first-java-request]')) {
      const request = document.querySelector(`.api-request[data-request-id="${slot.dataset.firstJavaRequest}"]`);
      if (request && request.parentElement !== slot) {
        slot.classList.add('api-practice');
        slot.append(request);
      }
    }
    panels.forEach((panel) => { panel.hidden = panel !== active; });
    journey.dataset.firstJavaCurrent = String(index);
    journey.querySelectorAll('.first-java-rail [data-first-java-go]').forEach((button) => {
      button.setAttribute('aria-current', Number(button.dataset.firstJavaGo) === index ? 'step' : 'false');
    });
    if (scroll) journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-first-java-go]').forEach((button) => button.addEventListener('click', () => show(Number(button.dataset.firstJavaGo))));
  journey.querySelectorAll('[data-first-java-copy]').forEach((button) => button.addEventListener('click', async () => {
    const block = button.closest('.first-java-code');
    const value = block.querySelector('code').textContent;
    const state = block.querySelector('.first-java-copy-state');
    try { await navigator.clipboard.writeText(value); state.textContent = '복사했습니다.'; }
    catch {
      const range = document.createRange();
      range.selectNodeContents(block.querySelector('code'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      state.textContent = '코드를 선택했습니다. 직접 복사해 주세요.';
    }
  }));
  const requestSection = document.querySelector('#browser-requests-1.api-practice');
  const serverSlot = journey.querySelector('[data-first-java-server]');
  const serverInput = document.querySelector('.server-url');
  if (serverSlot && serverInput) serverSlot.append(serverInput);
  if (requestSection) {
    const moved = new Set();
    for (const slot of journey.querySelectorAll('[data-first-java-request]')) {
      const name = slot.dataset.firstJavaRequest;
      if (moved.has(name)) continue;
      const request = requestSection.querySelector(`.api-request[data-request-id="${name}"]`);
      if (slot && request) { slot.classList.add('api-practice'); slot.append(request); moved.add(name); }
    }
    if (!requestSection.querySelector('.api-request')) requestSection.hidden = true;
  }
  for (const observation of journey.querySelectorAll('[data-first-java-observe]')) {
    const field = observation.dataset.firstJavaObserve;
    const storageKey = field === 'required'
      ? 'javaexperience-0-1-required-observation'
      : `javaexperience-${journey.dataset.focusKey || '0-2'}-${field}`;
    try { observation.value = localStorage.getItem(storageKey) || ''; } catch {}
    observation.addEventListener('input', () => {
      try { localStorage.setItem(storageKey, observation.value); } catch {}
    });
  }
  show(0, false);
});
