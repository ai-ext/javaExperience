// 정답 파일과 누적 스냅샷의 실제 목록을 공통 코드 워크벤치로 표시한다.
(() => {
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function buildWorkbench(host, files) {
    const groups = new Map();
    files.forEach((file) => {
      if (!groups.has(file.role)) groups.set(file.role, []);
      groups.get(file.role).push(file);
    });
    const root = make('section', 'code-workbench-ui');
    root.setAttribute('aria-label', '구현 코드 파일 탐색기');
    const roles = make('div', 'workbench-role-chips');
    roles.setAttribute('aria-label', '파일 역할');
    roles.setAttribute('role', 'group');
    const layout = make('div', 'workbench-layout');
    const fileNav = make('nav', 'workbench-file-nav');
    fileNav.setAttribute('aria-label', '역할별 코드 파일');
    const viewer = make('section', 'workbench-viewer');
    viewer.setAttribute('aria-label', '선택한 파일 코드');
    const viewerHead = make('header', 'workbench-viewer-head');
    const identity = make('div', 'workbench-file-identity');
    const filename = make('strong', 'workbench-filename', '파일을 선택하세요');
    const filepath = make('small', 'workbench-filepath', '');
    identity.append(filename, filepath);
    const copy = make('button', 'workbench-copy', '코드 복사');
    copy.type = 'button';
    copy.disabled = true;
    viewerHead.append(identity, copy);
    const status = make('p', 'workbench-status', '역할과 파일을 선택하면 코드를 확인할 수 있습니다.');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const codeArea = make('div', 'workbench-code-area');
    viewer.append(viewerHead, status, codeArea);
    layout.append(fileNav, viewer);
    root.append(roles, layout);
    host.replaceChildren(root);

    let activeRole = '';
    let activeFile = null;
    function selectFile(file, button) {
      activeFile = file;
      fileNav.querySelectorAll('.workbench-file-button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      filename.textContent = file.name;
      filepath.textContent = file.path;
      codeArea.replaceChildren();
      copy.disabled = true;
      Promise.resolve(file.load()).then((node) => {
        if (activeFile !== file) return;
        codeArea.replaceChildren(node);
        const code = node.matches('pre') ? node.querySelector('code') : node.querySelector?.('pre code');
        copy.disabled = !code;
        status.textContent = code ? `${file.path} 코드입니다.` : '이 단계에서 삭제한 파일입니다.';
      }).catch((error) => {
        if (activeFile === file) status.textContent = `파일을 불러오지 못했습니다: ${error.message}`;
      });
    }
    function selectRole(role) {
      activeRole = role;
      roles.querySelectorAll('.workbench-role-button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.role === role)));
      fileNav.replaceChildren();
      for (const file of groups.get(role) || []) {
        const button = make('button', 'workbench-file-button', file.name);
        button.type = 'button';
        button.setAttribute('aria-pressed', 'false');
        button.title = file.path;
        button.addEventListener('click', () => selectFile(file, button));
        fileNav.append(button);
      }
      const first = fileNav.querySelector('button');
      if (first) first.click();
    }
    for (const [role, roleFiles] of groups) {
      const button = make('button', 'workbench-role-button', `${role} · ${roleFiles.length}`);
      button.type = 'button';
      button.dataset.role = role;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => selectRole(role));
      roles.append(button);
    }
    copy.addEventListener('click', async () => {
      const code = codeArea.querySelector('pre code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent);
        status.textContent = '코드를 복사했습니다.';
      } catch {
        status.textContent = '코드 복사에 실패했습니다. 코드 영역을 선택해 복사하세요.';
      }
    });
    const firstRole = groups.keys().next().value;
    if (firstRole) selectRole(firstRole);
  }

  document.querySelectorAll('[data-code-workbench]').forEach((host) => {
    const files = [...host.querySelectorAll(':scope > .code-workbench-source > details.code-file')].map((details) => {
      const summary = details.querySelector('summary')?.textContent || '';
      const splitAt = summary.indexOf(' — ');
      const role = splitAt < 0 ? '기타' : summary.slice(0, splitAt);
      const path = splitAt < 0 ? summary : summary.slice(splitAt + 3);
      const pre = details.querySelector('pre');
      const deleted = details.querySelector('p');
      return { role, path, name: path.split('/').at(-1), load: () => Promise.resolve(pre || deleted || make('p', '', '코드가 없습니다.')) };
    });
    buildWorkbench(host, files);
  });

  document.querySelectorAll('.cumulative-code').forEach((container) => {
    const content = container.querySelector('.snapshot-content');
    const status = container.querySelector('.snapshot-status');
    let loaded = false;
    let loading = false;
    async function loadSnapshot() {
      if (loaded || loading) return;
      loading = true;
      status.textContent = '현재 코드 파일 목록을 불러오는 중입니다.';
      try {
        const snapshotUrl = new URL(container.dataset.snapshotUrl, document.baseURI);
        const response = await fetch(snapshotUrl);
        if (!response.ok) throw new Error(`목록 요청 실패 (HTTP ${response.status})`);
        const snapshot = await response.json();
        if (!Array.isArray(snapshot.files) || !snapshot.files.length) throw new Error('표시할 파일 목록이 없습니다.');
        const files = snapshot.files.filter((file) => file && typeof file.path === 'string' && typeof file.blob === 'string').map((file) => ({
          role: typeof file.role === 'string' && file.role ? file.role : '기타',
          path: file.path,
          name: file.path.split('/').at(-1),
          load: async () => {
            const blobUrl = new URL(`blobs/${encodeURIComponent(file.blob)}.txt`, snapshotUrl);
            const blobResponse = await fetch(blobUrl);
            if (!blobResponse.ok) throw new Error(`파일 요청 실패 (HTTP ${blobResponse.status})`);
            const pre = make('pre');
            pre.append(make('code', '', await blobResponse.text()));
            return pre;
          },
        }));
        buildWorkbench(content, files);
        status.textContent = `${files.length}개 파일을 역할별로 탐색할 수 있습니다.`;
        loaded = true;
      } catch (error) {
        status.textContent = `현재 코드 목록을 불러오지 못했습니다: ${error.message} 다시 열어 재시도할 수 있습니다.`;
      }
      loading = false;
    }
    container.addEventListener('toggle', () => { if (container.open) loadSnapshot(); });
  });
})();
