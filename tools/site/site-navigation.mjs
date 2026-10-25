import path from 'node:path';

const spaces = [
  { label: '홈', target: 'index.html' },
  { label: '과정', target: 'course/spring/README.html' },
  { label: '지도', target: 'course/map.html' },
  { label: '자료', target: 'course/resources.html' },
  { label: '이전 과정', target: 'course/archive.html' },
];

// 문서 제목 대신 소속 폴더로 판별한다. 예외 문서를 홈으로 표시하지 않는다.
export function siteSection(sourcePath) {
  if (sourcePath === 'README.md') return '홈';
  if (sourcePath === 'course/map.md') return '지도';
  if (sourcePath === 'course/archive.md' || /^(scenario|practice|tickets|lessons)\//.test(sourcePath)) return '이전 과정';
  if (sourcePath.startsWith('course/spring/')) return '과정';
  if (sourcePath.startsWith('course/') || sourcePath.startsWith('docs/knowledge/')) return '자료';
  return null;
}

export function renderSiteNavigation(sourcePath) {
  const current = siteSection(sourcePath);
  const href = target => path.posix.relative(path.posix.dirname(sourcePath), target);
  const study = /^course\/(?:spring\/D\d{2}|java\/J\d{2}|tickets\/)/.test(sourcePath);
  const links = spaces.map(({ label, target }) => `<a href="${href(target)}"${label === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<header class="topbar site-topbar${study ? ' study-topbar' : ''}"><a class="home-brand" href="${href('index.html')}"><span aria-hidden="true">&lt;/&gt;</span> javaExperience</a><nav aria-label="주 메뉴">${links}</nav></header>`;
}

// 현재 문서 제목은 본문 머리에서 한 번만 읽고, 경로에는 소속 공간만 표시한다.
export function renderSiteBreadcrumb(sourcePath) {
  const current = siteSection(sourcePath);
  if (current === '홈') return '';
  const href = target => path.posix.relative(path.posix.dirname(sourcePath), target);
  const space = spaces.find(entry => entry.label === current);
  const group = space ? `<span aria-hidden="true">›</span> <a href="${href(space.target)}">${space.label}</a>` : '';
  return `<nav class="site-breadcrumb" aria-label="현재 위치"><a href="${href('index.html')}">홈</a>${group}</nav>`;
}

const catalogNames = {
  'scenario/README.md': ['시나리오', '서비스 만들기'],
  'practice/MISSIONS.md': ['학습용 미션', '실전 미션'],
  'docs/knowledge/README.md': ['공부자료', '개념 학습'],
};
export function catalogPageTitle(sourcePath, original) {
  const names = catalogNames[sourcePath];
  return names && original.startsWith(names[0]) ? names[1] + original.slice(names[0].length) : original;
}
// 표시 이름만 맞춘다. 기존 원문 제목의 id와 permalink는 바꾸지 않는다.
export function renderCatalogHeading(sourcePath, html) {
  if (!Object.hasOwn(catalogNames, sourcePath)) return html;
  return html.replace(/(<h1\b[^>]*>)([\s\S]*?)(<\/h1>)/, (_, open, content, close) => {
    const anchor = content.match(/^<a\b[^>]*class="anchor"[^>]*>[\s\S]*?<\/a>/)?.[0] || '';
    return open + anchor + catalogPageTitle(sourcePath, content.slice(anchor.length)) + close;
  });
}
