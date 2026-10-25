import path from 'node:path';

const spaces = [
  { label: '홈', target: 'index.html' },
  { label: '과정 지도', target: 'course/map.html' },
  { label: '서비스 만들기', target: 'scenario/README.html' },
  { label: '실전 미션', target: 'practice/MISSIONS.html' },
  { label: '개념 학습', target: 'docs/knowledge/README.html' },
];

// 문서 제목 대신 소속 폴더로 판별한다. 예외 문서를 홈으로 표시하지 않는다.
export function siteSection(sourcePath) {
  if (sourcePath === 'README.md') return '홈';
  if (sourcePath === 'course/map.md') return '과정 지도';
  if (sourcePath.startsWith('course/')) return '서비스 만들기';
  if (sourcePath.startsWith('scenario/')) return '서비스 만들기';
  if (/^(practice|tickets)\//.test(sourcePath)) return '실전 미션';
  if (/^(docs\/knowledge|lessons)\//.test(sourcePath)) return '개념 학습';
  return null;
}

export function renderSiteNavigation(sourcePath) {
  const current = siteSection(sourcePath);
  const href = (target) => path.posix.relative(path.posix.dirname(sourcePath), target);
  const links = spaces.map(({ label, target }) => `<a href="${href(target)}"${label === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const setup = current === '홈' ? '<a class="home-header-setup" href="#home-environment">개발 환경 ↗</a>' : '';
  const courseItems = [
    ['서비스 기능 목록', 'scenario/README.html', false],
    ['일정 · 원본 과정', 'course/spring/README.html', sourcePath.startsWith('course/spring/')],
    ['연습 · Java', 'index.html#course-java-entry', sourcePath.startsWith('course/java/')],
    ['과제 · 티켓', 'index.html#course-ticket-entry', sourcePath.startsWith('course/tickets/')],
    ['참고 · 출발 자료', 'course/start/README.html', sourcePath.startsWith('course/start/')],
  ];
  const courseNav = sourcePath.startsWith('course/') || sourcePath === 'README.md'
    ? `<nav class="course-content-nav" aria-label="과정 콘텐츠 종류">${courseItems.map(([label, target, active]) => `<a href="${href(target)}"${active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>` : '';
  return `<header class="topbar site-topbar"><a class="home-brand" href="${href('index.html')}"><span aria-hidden="true">&lt;/&gt;</span> javaExperience</a><nav aria-label="주 메뉴">${links}</nav>${setup}</header>${courseNav}`;
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
