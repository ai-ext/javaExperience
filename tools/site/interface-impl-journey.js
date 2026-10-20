document.querySelectorAll('.reader-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-reader-panel]')];
  const baseInput = journey.querySelector('[data-reader-base]');
  const commands = [...journey.querySelectorAll('[data-reader-command]')];
  const templates = new Map(commands.map((code) => [code, code.textContent]));
  let seedId = '6';
  const refreshCommands = () => {
    const base = (baseInput.value.trim() || 'http://localhost:8080').replace(/\/+$/, '');
    for (const code of commands) code.textContent = templates.get(code).replaceAll('{{BASE}}', base).replaceAll('{{ID}}', seedId);
  };
  baseInput.addEventListener('input', refreshCommands);
  refreshCommands();

  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.readerPanel !== name;
    journey.dataset.readerScreen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-reader-go]')) {
    button.addEventListener('click', () => show(button.dataset.readerGo));
  }
  for (const link of journey.querySelectorAll('[data-reader-source]')) {
    link.addEventListener('click', () => {
      const details = document.querySelector('#reader-original');
      if (details) details.open = true;
    });
  }

  for (const button of journey.querySelectorAll('[data-reader-mode]')) {
    button.addEventListener('click', () => {
      const jdbc = button.dataset.readerMode === 'jdbc';
      for (const item of journey.querySelectorAll('[data-reader-mode]')) item.setAttribute('aria-pressed', String(item === button));
      journey.querySelector('[data-reader-bean]').textContent = jdbc ? 'JdbcPostSummaryReader 한 개' : 'JpaPostSummaryReader 한 개';
      journey.querySelector('[data-reader-condition]').textContent = jdbc ? 'jdbc · 설정한 경우만 등록' : 'jpa · 설정이 없어도 기본값';
    });
  }

  const seeds = {
    6: ['PUBLISHED · 통과', 'FOLLOWERS · 실패', 'NULL · 통과'],
    7: ['DRAFT · 실패', 'PUBLIC · 통과', 'NULL · 통과'],
    8: ['PUBLISHED · 통과', 'PUBLIC · 통과', '값 있음 · 실패'],
    10: ['HIDDEN · 실패', 'PUBLIC · 통과', 'NULL · 통과'],
    999: ['행 없음', '행 없음', '행 없음'],
  };
  for (const button of journey.querySelectorAll('[data-reader-seed]')) {
    button.addEventListener('click', () => {
      seedId = button.dataset.readerSeed;
      for (const item of journey.querySelectorAll('[data-reader-seed]')) item.setAttribute('aria-pressed', String(item === button));
      journey.querySelector('[data-reader-seed-id]').textContent = seedId === '999' ? '없는 id' : seedId;
      const [status, visibility, deleted] = seeds[seedId];
      journey.querySelector('[data-reader-seed-status]').textContent = status;
      journey.querySelector('[data-reader-seed-visibility]').textContent = visibility;
      journey.querySelector('[data-reader-seed-deleted]').textContent = deleted;
      refreshCommands();
    });
  }
  for (const button of journey.querySelectorAll('[data-reader-fake]')) {
    button.addEventListener('click', () => {
      const found = button.dataset.readerFake === 'found';
      for (const item of journey.querySelectorAll('[data-reader-fake]')) item.setAttribute('aria-pressed', String(item === button));
      journey.querySelector('[data-reader-fake-input]').textContent = found ? 'Optional.of(PostSummary id 2)' : 'Optional.empty()';
      journey.querySelector('[data-reader-fake-result]').textContent = found ? '정상 DTO 반환' : '404로 변환';
    });
  }

  for (const button of journey.querySelectorAll('[data-reader-copy]')) {
    button.addEventListener('click', async () => {
      const name = button.dataset.readerCopy;
      const code = journey.querySelector(`[data-reader-command="${name}"]`);
      const state = journey.querySelector(`[data-reader-copy-state="${name}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = '명령을 복사했습니다. 한 번에 서버 하나만 실행하세요.';
      } catch {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.addRange(range);
        state.textContent = '명령을 선택했습니다. 직접 복사해 터미널에서 실행하세요.';
      }
    });
  }
  journey.querySelector('[data-reader-copy-sql]').addEventListener('click', async () => {
    const code = journey.querySelector('[data-reader-sql]');
    const state = journey.querySelector('[data-reader-sql-state]');
    try {
      await navigator.clipboard.writeText(code.textContent);
      state.textContent = 'SQL을 복사했습니다. 별도 DB 도구에서 직접 실행하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.addRange(range);
      state.textContent = 'SQL을 선택했습니다. 직접 복사해 DB 도구에서 실행하세요.';
    }
  });
  show('scenario');
});
