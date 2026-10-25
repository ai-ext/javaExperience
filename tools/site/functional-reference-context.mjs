// 공개 과제 맥락만 다룬다. 학습 진도·요청 입력·저장소·네트워크에는 접근하지 않는다.
const taskPaths = new Map([
  ['flow-create', 'scenario/flow/create-post.html'],
  ['flow-detail', 'scenario/flow/read-post.html'],
  ['flow-list', 'scenario/flow/list-posts.html'],
  ['flow-update', 'scenario/flow/update-post.html'],
  ['flow-delete', 'scenario/flow/delete-post.html'],
  ['flow-like', 'scenario/flow/like-post.html'],
  ['flow-unlike', 'scenario/flow/unlike-post.html'],
]);
const relativeHtml = value => typeof value === 'string'
  && /^(?:[A-Za-z0-9_-]+\/)+[A-Za-z0-9_-]+\.html$/.test(value);
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 200;
const samePage = (left, right) => left.protocol === right.protocol && left.origin === right.origin && left.pathname === right.pathname;

/** 빌드가 넣은 공개 metadata와 현재 URL만 읽는다. 무효 입력은 항상 null이다. */
export function readReferenceContext(doc, location) {
  try {
    const scripts = doc.querySelectorAll('script[type="application/json"][data-frc-data]');
    if (scripts.length !== 1) return null;
    const data = JSON.parse(scripts[0].textContent);
    const pageUrl = new URL(location.href);
    if (!['https:', 'http:', 'file:'].includes(pageUrl.protocol)) return null;
    const values = pageUrl.searchParams.getAll('fromTask');
    if (values.length !== 1 || !taskPaths.has(values[0])) return null;
    if (data?.version !== 1 || !relativeHtml(data.pagePath)
      || typeof data.rootHref !== 'string' || !/^(?:\.\.\/)*index\.html$/.test(data.rootHref)) return null;
    const rootIndex = new URL(data.rootHref, pageUrl);
    const rootUrl = new URL('./', rootIndex);
    if (!samePage(new URL(data.pagePath, rootUrl), pageUrl)) return null;
    const validPaths = (paths, prefix) => Array.isArray(paths) && paths.length > 0
      && new Set(paths).size === paths.length
      && paths.every(path => relativeHtml(path) && path.startsWith(prefix));
    if (!validPaths(data.legacyPaths, 'scenario/') || !validPaths(data.knowledgePaths, 'docs/knowledge/')) return null;
    const kind = data.legacyPaths.includes(data.pagePath) ? 'legacy'
      : data.knowledgePaths.includes(data.pagePath) ? 'knowledge' : null;
    if (!kind || !Array.isArray(data.tasks) || data.tasks.length !== taskPaths.size) return null;
    const ids = new Set();
    for (const task of data.tasks) {
      if (!task || !taskPaths.has(task.id) || ids.has(task.id) || task.href !== taskPaths.get(task.id)
        || !text(task.title) || !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(task.api?.method)
        || !text(task.api?.path) || !task.api.path.startsWith('/api/')) return null;
      ids.add(task.id);
    }
    const task = data.tasks.find(task => task.id === values[0]);
    const allowedUrls = new Set([...data.legacyPaths, ...data.knowledgePaths].map(path => new URL(path, rootUrl).href));
    return { kind, task, rootUrl, pageUrl, allowedUrls };
  } catch { return null; }
}

/** 원문 구조는 보존하고 유효한 과제 맥락의 읽기 톤과 참고 링크를 연결한다. */
export function initFunctionalReferenceContext(doc, win) {
  const aside = doc.querySelector('aside[data-frc-root]');
  if (aside) aside.hidden = true;
  const context = readReferenceContext(doc, win.location);
  doc.documentElement.classList.toggle('functional-reference-reading', Boolean(context));
  if (!context) return null;
  if (context.kind === 'legacy') {
    const title = aside?.querySelector('[data-frc-task]');
    const method = aside?.querySelector('[data-frc-method]');
    const api = aside?.querySelector('[data-frc-api]');
    const open = aside?.querySelector('a[data-frc-open]');
    if (title && method && api && open) {
      title.textContent = context.task.title;
      method.textContent = context.task.api.method;
      api.textContent = context.task.api.path;
      open.textContent = `${context.task.title} 과제 열기 ↗`;
      open.href = new URL(context.task.href, context.rootUrl).href;
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      open.setAttribute('aria-label', `${context.task.title} 과제 열기 · 새 탭`);
      aside.hidden = false;
    }
  }
  for (const link of doc.querySelectorAll('a[href]')) {
    const raw = link.getAttribute('href');
    if (!raw?.trim() || raw.trimStart().startsWith('#') || link.hasAttribute('download')) continue;
    try {
      const target = new URL(raw, win.location.href);
      if (target.username || target.password) continue;
      const page = new URL(target); page.search = ''; page.hash = '';
      if (!context.allowedUrls.has(page.href)) continue;
      target.searchParams.delete('fromTask');
      target.searchParams.set('fromTask', context.task.id);
      link.setAttribute('href', target.href);
    } catch { /* 원문에 잘못된 URL이 있어도 나머지 본문을 보존한다. */ }
  }
  return context;
}
