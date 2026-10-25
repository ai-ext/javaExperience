import path from 'node:path';
import { CORE_UNITS, DOMAINS } from './concept-curriculum.mjs';

export const siteDestinations = [
  { label: '홈', target: 'index.html', description: '오늘 할 일과 과정의 전체 흐름을 확인합니다.' },
  { label: '과정 지도', target: 'course/map.html', description: '일자·Java·티켓과 필요한 지식의 연결을 확인합니다.' },
  { label: '서비스 만들기', target: 'scenario/README.html', description: '기능을 고르고 요구사항·힌트·요청 도구로 직접 구현합니다.' },
  { label: '실전 미션', target: 'practice/MISSIONS.html', description: '주어진 데이터와 조건으로 조회·쿼리 문제를 해결합니다.' },
  { label: '개념 학습', target: 'docs/knowledge/README.html', description: 'Java·Spring·DB 원리를 살펴봅니다.' },
];
// 일자 과정의 URL과 저장 진도는 유지하고 서비스 만들기의 참고 메뉴로 연결한다.
export const courseDestinations = [
  {label:'기능 목록',target:'scenario/README.html'},
  {label:'단계별 시안',target:'scenario/README.html#visual-catalog'},
  {label:'API EXPLORER',target:'scenario/README.html#journey-all-apis'},
  {label:'일자 목록',target:'course/spring/README.html',reference:true},
  {label:'Java',target:'course/java/README.html'},
  {label:'티켓',target:'course/tickets/README.html'},
  {label:'출발 자료',target:'course/start/README.html'},
  {label:'더미 데이터',target:'course/start/dummy/README.html',child:true},
  {label:'운영 실습',target:'course/start/ops/README.html',child:true},
  {label:'과정 안내',target:'course/README.html'},
];
export const mapDestinations = [
  {label:'관계 지도',target:'course/map.html#course-map-view'},
  {label:'연결 목록',target:'course/map.html#course-relations-view'},
];
const spaces = siteDestinations;
export function siteSection(sourcePath) {
  if (sourcePath === 'README.md') return '홈';
  if (sourcePath === 'course/map.md') return '과정 지도';
  if (sourcePath.startsWith('course/')) return '서비스 만들기';
  if (sourcePath.startsWith('docs/knowledge/')) return '개념 학습';
  if (sourcePath.startsWith('scenario/') || sourcePath.startsWith('tickets/')) return '서비스 만들기';
  if (sourcePath.startsWith('practice/')) return '실전 미션';
  if (sourcePath.startsWith('lessons/')) return '개념 학습';
  return null;
}
export function renderSectionNavigation(sourcePath) {
  const current=siteSection(sourcePath);
  const groups={
    '홈':[{label:'오늘 할 일',target:'index.html#course-home-title'},{label:'과정 전체 설명',target:'index.html#home-course-overview'},{label:'대주제 안내',target:'index.html#home-menus'}],
    '과정 지도':mapDestinations,
    '서비스 만들기':courseDestinations,
    '실전 미션':[{label:'미션 목록',target:'practice/MISSIONS.html'}],
    '개념 학습':[
      {label:'개념 목록',target:'docs/knowledge/README.html'},
      ...DOMAINS.map(({id,label})=>({label,target:`docs/knowledge/README.html#kc-category-${id}`})),
      ...CORE_UNITS.map(({id,title})=>({label:`${id} · ${title}`,target:`lessons/concept-core.html?unit=${id}`})),
      {label:'레슨',target:'lessons/README.html'},
    ],
  };
  const entries=groups[current]||siteDestinations;
  const target=sourcePath.replace(/\.md$/,'.html');
  const exact=entries.find(e=>e.target===target);
  const baseTarget=value=>value.split(/[?#]/)[0];
  const coreDefault=target==='lessons/concept-core.html' ? entries.find(e=>e.target==='lessons/concept-core.html?unit=C01') : null;
  const mapDefault=current==='과정 지도' ? entries[0] : null;
  const active=exact || coreDefault || mapDefault || entries.filter(e=>e.target===baseTarget(e.target)).sort((a,b)=>b.target.length-a.target.length).find(e=>target.startsWith(path.posix.dirname(e.target)+'/'));
  return `<p class="page-sidebar-caption">${current||'학습 안내'}</p><nav class="section-navigation" aria-label="${current||'학습'} 영역">${entries.map(e=>`${e.reference ? '<p class="page-sidebar-caption section-navigation-reference">참고</p>' : ''}<a${e.child ? ' class="section-navigation-child"' : ''} href="${path.posix.relative(path.posix.dirname(sourcePath),e.target)}"${e===active?' aria-current="page"':''}>${e.label}</a>`).join('')}</nav>`;
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
