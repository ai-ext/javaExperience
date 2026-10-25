import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { renderSiteNavigation, renderSiteBreadcrumb, siteSection } from './site-navigation.mjs';

const labels = ['홈', '45일 과정', '서비스 만들기', '실전 미션', '개념 학습'];
const destinations = ['index.html', 'course/spring/README.html', 'scenario/README.html', 'practice/MISSIONS.html', 'docs/knowledge/README.html'];
const examples = [
  ['README.md', '홈'], ['course/spring/D11.md', '45일 과정'], ['course/map.md', '45일 과정'],
  ['course/README.md', '45일 과정'], ['course/resources.md', '45일 과정'], ['course/archive.md', '45일 과정'],
  ['course/java/README.md', '45일 과정'], ['course/java/J01.md', '45일 과정'],
  ['course/tickets/README.md', '45일 과정'], ['course/tickets/B01.md', '45일 과정'],
  ['course/start/dummy/README.md', '45일 과정'], ['scenario/README.md', '서비스 만들기'],
  ['scenario/ch1-create-post/1-2-dto-response.md', '서비스 만들기'],
  ['scenario/labs/l12-query-methods/README.md', '서비스 만들기'], ['practice/MISSIONS.md', '실전 미션'],
  ['tickets/README.md', '서비스 만들기'], ['tickets/001-board-list-api.md', '서비스 만들기'],
  ['docs/knowledge/README.md', '개념 학습'], ['docs/knowledge/P02-mvc-layered-architecture.md', '개념 학습'],
  ['lessons/concept-core.md', '개념 학습'], ['docs/knowledge/S01-ioc-di.md', '개념 학습'], ['lessons/nested/example.md', '개념 학습'], ['course/spec-v2.md', '45일 과정'], ['errors.md', null],
];
for (const [source, section] of examples) {
  const pageUrl = new URL(source, 'https://learn.example/');
  const dom = new JSDOM(renderSiteNavigation(source), { url: pageUrl.href });
  const header = dom.window.document.querySelector('header.topbar');
  const nav = header.querySelector('nav[aria-label="주 메뉴"]');
  assert.ok(nav, `${source}: 이름이 있는 공통 메뉴`);
  const links = [...nav.querySelectorAll('a')];
  assert.deepEqual(links.map((link) => link.textContent), labels, `${source}: 메뉴 이름과 순서`);
  assert.deepEqual(links.map((link) => new URL(link.href).pathname.slice(1)), destinations, `${source}: 폴더 깊이별 이동 경로`);
  assert.equal(header.querySelector('.home-brand').href, 'https://learn.example/index.html');
  assert.match(header.querySelector('.home-brand').textContent, /javaExperience/);
  assert.equal(siteSection(source), section);
  const current = [...nav.querySelectorAll('[aria-current="page"]')];
  assert.deepEqual(current.map((link) => link.textContent), section ? [section] : [], `${source}: 현재 공간만 선택`);
  assert.equal(links.length, 5, `${source}: 전역 항목은 다섯 개`);
  assert.equal(new Set(links.map(link => link.href)).size, 5, '중복 목적지 없음');
  assert.equal(header.querySelectorAll('nav').length, 1, `${source}: 전역 메뉴 한 층`);
  assert.equal(header.querySelector('.course-content-nav,.home-header-setup'), null, `${source}: 보조 전역 메뉴 제거`);
  const crumb = new JSDOM(renderSiteBreadcrumb(source), {url:pageUrl.href});
  if (section === '홈') assert.equal(crumb.window.document.querySelector('nav'), null);
  else {
    const trail = crumb.window.document.querySelector('nav.site-breadcrumb');
    assert.equal(trail.getAttribute('aria-label'), '현재 위치');
    assert.equal(trail.querySelector('a').href, 'https://learn.example/index.html');
    assert.deepEqual([...trail.querySelectorAll('a')].map(link=>link.textContent), section ? ['홈', section] : ['홈']);
  }
  crumb.window.close();
  dom.window.close();
}
assert.equal(siteSection('scenario-other/README.md'), null, '폴더 이름 접두어만 같아도 시나리오로 처리하지 않음');
assert.equal(siteSection('docs/README.md'), null, '공통 문서를 홈으로 잘못 표시하지 않음');

const builder = fs.readFileSync(new URL('build.mjs', import.meta.url), 'utf8');
assert.match(builder, /import\s*\{[^}]*renderSiteNavigation[^}]*\}\s*from '\.\/site-navigation\.mjs'/);
assert.match(builder, /\$\{renderSiteNavigation\(rel\(abs\)\)\}/, '모든 생성 페이지가 공통 렌더러 사용');
assert.doesNotMatch(builder, /<header class="topbar/,'분기별 예전 헤더를 남기지 않음');
assert.doesNotMatch(builder, /<p class="crumbs">.*?>시나리오<\/a>/, '현재 공간 안내도 메뉴와 같은 이름 사용');
const css = fs.readFileSync(new URL('site.css', import.meta.url), 'utf8');
assert.match(css, /\.site-topbar[^{}]*a:focus-visible\s*\{[^}]*outline:/, '키보드 포커스 표시');
assert.match(css, /\.site-topbar[^{}]*nav[^{}]*\{[^}]*overflow-x:\s*auto/, '긴 메뉴의 가로 탐색 보존');
assert.match(css, /\.site-topbar[^{}]*\[aria-current="page"\]/, '현재 공간 표시 스타일');
console.log('공통 메뉴: 공간 분류·이름·상대 경로·현재 표시·한 층·다섯 항목·경로 표시·빌드 연결 검사 통과');

// 빌드 뒤에는 각 산출물이 공통 메뉴를 실제로 사용했는지 전체 경로에서 확인한다.
if (process.argv.includes('--generated')) {
  const root = new URL('../../', import.meta.url);
  const sources = ['README.md', 'errors.md'];
  function collect(folder) {
    if (folder === 'course/days') return;
    if (folder === 'course/days') return;
    for (const entry of fs.readdirSync(new URL(folder, root), { withFileTypes: true })) {
      const source = `${folder}/${entry.name}`;
      if (entry.isDirectory()) collect(source);
      else if (entry.name.endsWith('.md')) sources.push(source);
    }
  }
  for (const folder of ['docs/knowledge', 'scenario', 'practice', 'lessons', 'tickets', 'course']) collect(folder);
  for (const source of sources) {
    const html = fs.readFileSync(new URL(source.replace(/\.md$/, '.html'), root), 'utf8');
    const header = html.match(/<header class="topbar[^"\n]*">[\s\S]*?<\/header>/)?.[0];
    assert.equal(header, renderSiteNavigation(source), `${source}: 생성된 메뉴·선택 상태 일치`);
    const dom = new JSDOM(html);
    assert.equal(dom.window.document.querySelectorAll('script[src*="tools/site/syntax-highlight.js"]').length, 1, `${source}: syntax-highlight.js 단일 등록`);
    dom.window.close();
  }
  assert.equal(fs.readFileSync(new URL('index.html', root), 'utf8'), fs.readFileSync(new URL('README.html', root), 'utf8'), '홈 진입 두 경로 일치');
  for (const [source, expected] of [['scenario/README.md', '서비스 만들기'], ['practice/MISSIONS.md', '실전 미션'], ['docs/knowledge/README.md', '개념 학습']]) {
    const dom = new JSDOM(fs.readFileSync(new URL(source.replace(/\.md$/, '.html'), root), 'utf8'));
    assert.ok(dom.window.document.querySelector('h1').textContent.replace(/^#/, '').startsWith(expected), `${source}: 도착 화면 제목`);
    assert.ok(dom.window.document.title.startsWith(expected), `${source}: 브라우저 탭 제목`);
    dom.window.close();
  }
  console.log(`공통 메뉴 생성물: ${sources.length}쪽 + index.html 헤더·상대 경로·현재 공간 검사 통과`);
}

const { renderCatalogHeading, catalogPageTitle } = await import('./site-navigation.mjs');
for (const [source, before, after] of [
  ['scenario/README.md', '시나리오 — 게시판 API', '서비스 만들기 — 게시판 API'],
  ['practice/MISSIONS.md', '학습용 미션 — 조회 연습', '실전 미션 — 조회 연습'],
  ['docs/knowledge/README.md', '공부자료 (백엔드)', '개념 학습 (백엔드)'],
]) {
  const original = `<h1 id="old-id"><a class="anchor" href="#old-id" aria-hidden="true">#</a>${before}</h1><p>원문 그대로</p>`;
  const result = renderCatalogHeading(source, original);
  assert.ok(result.includes(after)); assert.ok(result.includes('id="old-id"')); assert.ok(result.includes('href="#old-id"')); assert.ok(result.includes('<p>원문 그대로</p>'));
  assert.equal(catalogPageTitle(source, before), after);
}
assert.equal(renderCatalogHeading('scenario/ch1/example.md', '<h1>시나리오 예시</h1>'), '<h1>시나리오 예시</h1>');
console.log('목차 제목: 탭과 같은 이름, 기존 제목 설명·앵커·본문 보존 통과');
