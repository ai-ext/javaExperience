(() => {
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  async function loadSnapshot(details) {
    if (details.dataset.loaded === 'true' || details.dataset.loading === 'true') return;
    details.dataset.loading = 'true';
    const status = details.querySelector('.snapshot-status');
    const content = details.querySelector('.snapshot-content');
    status.textContent = '현재 코드 목록을 불러오는 중입니다.';
    try {
      const snapshotUrl = new URL(details.dataset.snapshotUrl, document.baseURI);
      const response = await fetch(snapshotUrl);
      if (!response.ok) throw new Error(`목록 요청 실패 (HTTP ${response.status})`);
      const snapshot = await response.json();
      if (!Array.isArray(snapshot.files)) throw new Error('코드 목록 형식이 올바르지 않습니다.');

      const groups = new Map();
      for (const file of snapshot.files) {
        if (!file || typeof file.path !== 'string' || typeof file.blob !== 'string') continue;
        const role = typeof file.role === 'string' && file.role ? file.role : '기타';
        if (!groups.has(role)) groups.set(role, []);
        groups.get(role).push(file);
      }
      if (!groups.size) throw new Error('표시할 코드 파일이 없습니다.');

      const fragment = document.createDocumentFragment();
      for (const [role, files] of groups) {
        const roleDetails = make('details', 'snapshot-role');
        roleDetails.append(make('summary', '', `${role} (${files.length})`));
        for (const file of files) {
          const fileDetails = make('details', 'code-file snapshot-file');
          fileDetails.dataset.blob = file.blob;
          fileDetails.dataset.snapshotUrl = snapshotUrl.href;
          fileDetails.append(make('summary', '', file.path));
          const fileStatus = make('p', 'snapshot-file-status', '파일을 열면 내용을 불러옵니다.');
          fileStatus.setAttribute('role', 'status');
          fileDetails.append(fileStatus);
          fileDetails.addEventListener('toggle', () => {
            if (fileDetails.open) loadBlob(fileDetails);
          });
          roleDetails.append(fileDetails);
        }
        fragment.append(roleDetails);
      }
      content.replaceChildren(fragment);
      details.dataset.loaded = 'true';
      status.textContent = `${snapshot.files.length}개 파일이 준비되었습니다. 파일을 펼쳐 전문을 확인하세요.`;
    } catch (error) {
      status.textContent = `현재 코드 목록을 불러오지 못했습니다: ${error.message} 다시 열어 재시도할 수 있습니다.`;
      delete details.dataset.loading;
      return;
    }
    delete details.dataset.loading;
  }

  async function loadBlob(details) {
    if (details.dataset.loaded === 'true' || details.dataset.loading === 'true') return;
    details.dataset.loading = 'true';
    const status = details.querySelector('.snapshot-file-status');
    status.textContent = '파일 내용을 불러오는 중입니다.';
    try {
      const snapshotUrl = new URL(details.dataset.snapshotUrl);
      const blobUrl = new URL(`blobs/${encodeURIComponent(details.dataset.blob)}.txt`, snapshotUrl);
      const response = await fetch(blobUrl);
      if (!response.ok) throw new Error(`파일 요청 실패 (HTTP ${response.status})`);
      const source = await response.text();
      const pre = make('pre');
      const code = make('code', '', source);
      pre.append(code);
      details.append(pre);
      status.remove();
      details.dataset.loaded = 'true';
    } catch (error) {
      status.textContent = `파일을 불러오지 못했습니다: ${error.message} 다시 열어 재시도할 수 있습니다.`;
    }
    delete details.dataset.loading;
  }

  document.querySelectorAll('.cumulative-code').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) loadSnapshot(details);
    });
  });
})();
