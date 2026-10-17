document.querySelectorAll('.jpa-focused').forEach((root) => {
  const panels = [...root.querySelectorAll('[data-jpa-panel]')];
  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.jpaPanel !== name;
    root.dataset.jpaScreen = name;
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  root.querySelectorAll('[data-jpa-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.jpaGo)));
  const outcomeText = root.querySelector('[data-jpa-outcome-text]');
  root.querySelectorAll('[data-jpa-outcome]').forEach((button) => button.addEventListener('click', () => {
    for (const option of root.querySelectorAll('[data-jpa-outcome]')) option.setAttribute('aria-pressed', String(option === button));
    outcomeText.textContent = button.dataset.jpaOutcome === 'commit'
      ? 'commit: 변경이 확정됩니다. 새 트랜잭션에서 다시 읽으면 “수정된 글”을 볼 수 있습니다.'
      : 'rollback: 이 UPDATE는 취소됩니다. 새 트랜잭션에서 다시 읽으면 “첫 글”입니다.';
  }));
  const lifecycle = {
    new: ['아직 컨텍스트 밖', 'Post · new', 'id = null · title = "예시"', 'new로 만든 객체는 아직 영속성 컨텍스트가 추적하지 않습니다.', 'INSERT를 단정할 수 없음', 'persist/flush/식별자 전략에 따라 SQL 시점이 달라집니다.'],
    managed: ['현재 컨텍스트에서 관리', 'Post id=42 · managed', 'title = "기존 글"', 'find()로 읽은 이 객체는 현재 영속성 컨텍스트가 추적합니다.', '값을 바꾸면 flush 때 비교 대상', '변경 전 DB 행 title은 “기존 글”입니다. 아직 SQL 실행이나 commit을 주장하지 않습니다.'],
    detached: ['현재 컨텍스트 밖', 'Post id=42 · detached', 'title = "수정된 글"', '준영속 원본을 바꿔도 현재 컨텍스트의 변경 감지 대상이 아닙니다.', '자동 UPDATE 없음', '준영속 원본 수정만으로 SQL이 실행됐다고 볼 수 없습니다.'],
    merge: ['반환된 관리 객체 · 원본과 별개', 'Post id=42 · managed 반환값', 'title = "수정된 글"', 'merge()가 준영속 상태를 관리 객체로 복사해 반환합니다. 원본은 그대로 준영속입니다.', 'UPDATE는 이후 조건 확인', 'flush/commit 전에 SQL 시점을 단정하지 마세요. 반환된 관리 객체를 사용합니다.'],
  };
  root.querySelectorAll('[data-jpa-life]').forEach((button) => button.addEventListener('click', () => {
    const state = lifecycle[button.dataset.jpaLife];
    root.querySelectorAll('[data-jpa-life]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    for (const [selector, value] of [['[data-jpa-life-state]',state[0]],['[data-jpa-life-object]',state[1]],['[data-jpa-life-title]',state[2]],['[data-jpa-life-detail]',state[3]],['[data-jpa-life-sql]',state[4]],['[data-jpa-life-db]',state[5]]]) root.querySelector(selector).textContent = value;
  }));
  const authorAccess = new Set();
  let fetchMode = 'lazy';
  const renderFetch = () => {
    const count = fetchMode === 'join' ? 1 : 1 + authorAccess.size;
    root.querySelector('[data-jpa-sql-count]').textContent = `${count}회 · ${fetchMode === 'join' ? 'fetch join 비교' : authorAccess.size ? '목록 + 작성자 접근' : '글 목록만'}`;
    root.querySelector('[data-jpa-sql-formula]').textContent = fetchMode === 'join' ? '1회 · 설명용 fetch 계획' : `1 + ${authorAccess.size}`;
    root.querySelector('[data-jpa-sql-detail]').textContent = fetchMode === 'join'
      ? '이 예시의 단일값 작성자를 한 쿼리에서 함께 읽는 계획입니다. 실제 SQL과 행 수는 실행해 확인해야 합니다.'
      : authorAccess.size ? `서로 다른 작성자 ${authorAccess.size}명의 LAZY 값을 열었습니다. 각 작성자가 아직 로드되지 않았다고 가정한 수입니다.`
        : '현재는 목록만 읽었습니다. 작성자에 접근할 때마다 추가 SELECT가 발생할 수 있습니다.';
    root.querySelectorAll('[data-jpa-author]').forEach((button) => {
      const index = Number(button.dataset.jpaAuthor);
      button.setAttribute('aria-pressed', String(fetchMode === 'join' || authorAccess.has(index)));
      button.querySelector('span').textContent = fetchMode === 'join' ? '함께 조회' : authorAccess.has(index) ? '작성자 열림' : '작성자 보기';
    });
  };
  root.querySelectorAll('[data-jpa-fetch]').forEach((button) => button.addEventListener('click', () => {
    fetchMode = button.dataset.jpaFetch;
    if (fetchMode === 'lazy') authorAccess.clear();
    root.querySelectorAll('[data-jpa-fetch]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    renderFetch();
  }));
  root.querySelectorAll('[data-jpa-author]').forEach((button) => button.addEventListener('click', () => {
    if (fetchMode !== 'lazy') return;
    authorAccess.add(Number(button.dataset.jpaAuthor));
    renderFetch();
  }));
  root.querySelectorAll('[data-jpa-source]').forEach((link) => link.addEventListener('click', () => {
    for (let parent = document.getElementById(decodeURIComponent(link.hash.slice(1)))?.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
  }));
});
