document.querySelectorAll('.session-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-session-panel]')];
  const baseInput = journey.querySelector('[data-session-base]');
  const idInput = journey.querySelector('[data-session-member-id]');
  const commands = [...journey.querySelectorAll('[data-session-command]')];
  const templates = new Map(commands.map((code) => [code, code.textContent]));
  const refreshCommands = () => {
    const base = (baseInput.value.trim() || 'http://localhost:8080').replace(/\/+$/, '');
    for (const code of commands) code.textContent = templates.get(code).replaceAll('{{BASE}}', base);
  };
  baseInput.addEventListener('input', refreshCommands);
  refreshCommands();
  idInput.addEventListener('input', () => {
    const value = Number(idInput.value);
    const id = Number.isSafeInteger(value) && value > 0 ? String(value) : 'N';
    for (const node of journey.querySelectorAll('[data-session-id-label]')) node.textContent = id;
  });
  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.sessionPanel !== name;
    journey.dataset.sessionScreen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-session-go]')) {
    button.addEventListener('click', () => show(button.dataset.sessionGo));
  }
  for (const button of journey.querySelectorAll('[data-session-copy]')) {
    button.addEventListener('click', async () => {
      const name = button.dataset.sessionCopy;
      const code = journey.querySelector(`[data-session-command="${name}"]`);
      const state = journey.querySelector(`[data-session-copy-state="${name}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = '명령을 복사했습니다. TOKEN·JWT 자리표시자를 실제 값으로 바꿔 터미널에서 실행하세요.';
      } catch {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.addRange(range);
        state.textContent = '명령을 선택했습니다. 직접 복사하고 자리표시자를 바꿔 실행하세요.';
      }
    });
  }
  show('scenario');
});
