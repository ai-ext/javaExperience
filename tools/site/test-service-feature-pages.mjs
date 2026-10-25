import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mergeServiceFeatureEntry, mountServiceFeaturePages, renderServiceCatalog, renderServiceFeature } from './service-feature-pages.mjs';

const recipe = {
  id: 'fixture-create', label: '기록 저장', project: 'board', method: 'POST', path: '/api/records', bodyKind: 'json', body: { title: '테스트' }, sourceUnits: ['unit-record-create'],
  requestFields: [{ name: 'title', label: '제목', type: 'string', required: true, help: '공백 불가' }],
  expected: { statuses: [201], bodyMode: 'empty', description: '생성 결과', fields: [] }, failures: [{ statuses: [400], when: '제목 누락', result: '검증 오류' }], sourceRefs: ['fixture-source'],
};
const relatedRecipe = { ...recipe, id: 'fixture-create-related', label: '원문 사례', requestFields: [{ name: 'content', label: '본문', type: 'string', required: false, help: '원문 단계 사례' }], expected: { ...recipe.expected, statuses: [202], description: '관련 정상 결과' }, sourceRefs: [{ path: 'scenario/source.md', pointer: '#normal' }] };

const feature = {
  id: 'fixture-record', title: '기록 저장하고 다시 읽기', summary: 'fixture summary', group: '게시글과 소통', difficulty: '기초', projects: ['board'], prerequisites: ['members-auth'], status: 'authored',
  variants: [
    { id: 'board', project: 'board', label: 'board 프로젝트', stages: [{ id: 'create', title: '기록 저장', sourceUnits: ['unit-record-create'], recipeIds: ['fixture-create'], hints: ['누가 이 기록을 작성하는지 서버는 어떻게 알까요?', '실패하면 기존 데이터는 어떻게 되나요?'], executionChecks: [{ title: '로컬 실행 확인', command: './gradlew bootRun', expected: '서버가 시작됨', record: true }], brief: {
      purpose: '저장된 기록을 나중에 다시 읽습니다.', task: '로그인한 사용자의 제목과 내용을 저장하세요.', preconditions: ['서버와 DB가 실행 중입니다.'],
      scenario: [{ start: '사용자가 로그인함', action: '기록을 제출함', result: '새 기록이 생성됨', after: '생성된 기록을 조회함' }],
      data: [{ name: 'title', reason: '목록에서 구별합니다.' }], policies: ['작성자는 로그인한 사용자입니다.'], inputs: ['title · content'],
      success: ['201 Created'], failures: [{ when: '제목 누락', result: '400 응답', unchanged: '기존 기록을 유지' }], examples: ['요청 사례'], work: ['Controller와 Service를 작성합니다.'], done: ['저장 후 같은 데이터를 조회합니다.'],
    }, concepts: [{ label: 'DTO 개념', href: 'docs/knowledge/P16-json-jackson-practical.html' }], references: [{ label: '기존 시나리오', href: 'scenario/README.html#api-map-title' }], choices: ['로그인한 사용자 기준으로 처리'] }] },
    { id: 'community', project: 'community', label: 'community 프로젝트', stages: [{ id: 'create', title: '기록 생성', brief: { task: 'community variant fixture' }, hints: ['어떤 입력을 검증하나요?'] }] },
  ],
};

const sourceIndex = { version: 1, units: [{ id: 'unit-record-create', kind: 'scenario', title: '기록 생성 원문', href: 'scenario/ch1-create-post/1-2-dto-response.html#post', project: 'board', required: true, requirements: ['제목을 입력받습니다.'], hints: ['실패 응답도 확인하세요.'], apiRefs: ['fixture-create'], sourceRefs: ['원본 문장'] }] };

test('catalog metadata survives merging with the detailed feature body', () => {
  const merged = mergeServiceFeatureEntry({ id: 'fixture-record', title: '목록 이름', group: '개발 준비', projects: ['board'], preview: { kind: 'posts' }, status: 'authored', file: 'features/fixture-record.json' }, { id: 'fixture-record', title: '본문 제목', variants: feature.variants });
  assert.equal(merged.title, '목록 이름');
  assert.deepEqual(merged.projects, ['board']);
  assert.deepEqual(merged.preview, { kind: 'posts' });
  assert.equal(merged.group, '개발 준비');
  assert.equal(merged.status, 'authored');
  assert.equal(merged.variants.length, 2);
});

test('catalog renders one feature card, grouping, filters, Explorer routes and canonical anchors', () => {
  const prerequisite = { id: 'members-auth', title: '회원 가입과 로그인', group: '시작과 계정', projects: ['board'] };
  const html = renderServiceCatalog({ features: [feature, prerequisite], sourceIndex, apiRecipes: [recipe, relatedRecipe], rootPrefix: '../' });
  assert.equal((html.match(/data-sf-id="fixture-record"/g) || []).length, 1, '같은 기능 카드는 한 번만 표시해야 함');
  assert.match(html, /data-sf-feature-group/);
  assert.match(html, /게시글과 소통/);
  assert.match(html, /data-sf-difficulty/);
  assert.match(html, /data-sf-project/);
  assert.match(html, /data-sf-method-filter="POST"/);
  assert.match(html, /id="visual-catalog"/);
  assert.match(html, /id="journey-all-apis"/);
  assert.match(html, /scenario\/features\/fixture-record\.html/);
  assert.match(html, /회원 가입과 로그인/);
  assert.equal((html.match(/data-sf-api-row data-sf-method=/g) || []).length, 1, '동일 project+method+path를 한 행으로 묶어야 함');
  assert.match(html, /요청 사례·원문 자료 2개 보기/);
  assert.match(html, /#api-map-title/);
  assert.match(html, /단계별 시안으로 고르기/);
  assert.match(html, /완성할 기능으로 묶었습니다\. 예전 세부 단계도 안에서 볼 수 있어요\./);
  assert.doesNotMatch(html, /기능 카드는 한 번씩만 표시합니다/);
  assert.match(html, /sf-preview-comparison/);
  assert.match(html, /data-sf-projects="board"/);
  const withRoutes = renderServiceCatalog({ features: [feature], sourceIndex, apiRecipes: { recipes: [recipe, relatedRecipe], routes: [{ project: 'board', method: 'POST', path: '/api/records', recipeIds: [recipe.id, relatedRecipe.id] }] }, rootPrefix: '../' });
  assert.equal((withRoutes.match(/data-sf-api-row data-sf-method=/g) || []).length, 1);
});

test('feature renderer exposes full brief without script, hides hints until a click, and preserves root-relative references', () => {
  const html = renderServiceFeature({ feature, features: [feature, { id: 'members-auth', title: '회원 가입과 로그인' }], sourceIndex, apiRecipes: [recipe, relatedRecipe], rootPrefix: '../../' });
  assert.equal((html.match(/data-sf-stage-panel/g) || []).length, 2);
  for (const text of ['이번에 할 일', '시작 조건', '사용자 시나리오', '데이터와 이유', '업무 정책', '입력과 출력', '성공 기준', '실패와 데이터 보존', '입력 사례', '개발 과제', '완료 확인']) assert.match(html, new RegExp(text));
  assert.match(html, /data-srq-root/);
  assert.match(html, /선택한 API 계약/);
  assert.match(html, /공백 불가/);
  assert.match(html, /401|400|제목 누락/);
  assert.match(html, /원문 사례/);
  assert.match(html, /회원 가입과 로그인/);
  assert.match(html, /힌트 보기/);
  assert.match(html, /누가 이 기록을 작성하는지 서버는 어떻게 알까요\?/);
  assert.match(html, /href="\.\.\/\.\.\/scenario\/ch1-create-post\/1-2-dto-response\.html#post"/);
  assert.match(html, /href="\.\.\/\.\.\/docs\/knowledge\/P16-json-jackson-practical\.html"/);
  assert.match(html, /data-sf-stage-complete/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
});

test('unmapped API binding displays its source id and leaves the actual method and path unset', () => {
  const binding = { id: 'binding-fixture', label: '내 글 요청', project: 'board', binding: { key: 'postId', label: '내 글 id', sourceId: 'unit-record-create' }, requestFields: [], expected: { statuses: [], description: '과제 자료를 확인한 뒤 직접 정할 계약' } };
  const boundFeature = { ...feature, variants: [{ ...feature.variants[0], stages: [{ ...feature.variants[0].stages[0], recipeIds: [binding.id] }] }] };
  const html = renderServiceFeature({ feature: boundFeature, sourceIndex, apiRecipes: [binding], rootPrefix: '../../' });
  assert.match(html, /아직 정하지 않은 내 프로젝트 계약/);
  assert.match(html, /unit-record-create/);
  assert.match(html, /실제 경로를 입력하세요/);
  assert.match(html, /data-srq-path value=""/);
  assert.doesNotMatch(html, /<code>\/api\/[^<]+<\/code>/);
});

test('manual progress is isolated by feature, project variant, and stage without migrating old booleans', async () => {
  const threeProjectFeature = { ...feature, variants: [...feature.variants, { id: 'project-v1', project: 'project-v1', label: 'project-v1 프로젝트', stages: [{ id: 'create', title: '기록 생성', brief: { task: 'project-v1 fixture' } }] }] };
  const html = renderServiceFeature({ feature: threeProjectFeature, sourceIndex, apiRecipes: [recipe, relatedRecipe], rootPrefix: '../../' });
  assert.equal((html.match(/data-sf-stage-panel/g) || []).length, 3);
  assert.equal((html.match(/data-sf-stage-panel[^>]* hidden/g) || []).length, 0, 'JS 실행 전에는 모든 기획 단계를 읽을 수 있어야 함');
  const dom = new JSDOM(`<main>${html}</main>`, { url: 'https://example.test/scenario/features/fixture-record.html' });
  const storage = dom.window.localStorage;
  storage.setItem('course.progress', '{"legacy":"unchanged"}');
  storage.setItem('javaexperience.service.progress.v1', JSON.stringify({ version: 1, completed: { 'fixture-record': true }, untouched: 'keep' }));
  mountServiceFeaturePages(dom.window.document, { storage });
  const root = dom.window.document.querySelector('[data-sf-feature]');
  const panels = [...root.querySelectorAll('[data-sf-stage-panel]')];
  assert.equal(panels.filter((panel) => !panel.hidden).length, 1);
  const progressCheckbox = root.querySelector('[data-sf-stage-complete]');
  assert.equal(progressCheckbox.checked, false, '과거 기능 boolean은 새 단계 완료로 환산하지 않아야 함');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '0 / 1');
  assert.equal(root.querySelectorAll('[data-sf-aside-stage]:not([hidden])').length, 1, '활성 단계의 힌트 패널만 보여야 함');
  assert.equal(panels.filter((panel) => panel.hidden).length, 2, '비활성 단계의 본문은 숨겨야 함');
  assert.equal(root.querySelector('[data-sf-api-contract] [data-sf-contract-view] .sf-contract-table code').textContent, 'title');
  const recipePicker = root.querySelector('[data-srq-recipe]');
  assert.equal(recipePicker.options.length, 2, '명시 사례 뒤에 같은 프로젝트·원문 단계를 공유하는 사례를 추가해야 함');
  recipePicker.value = '1';
  recipePicker.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.querySelector('[data-sf-api-contract] .sf-contract-route strong').textContent, '202');
  assert.equal(root.querySelector('[data-sf-api-contract] .sf-contract-table code').textContent, 'content');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '0 / 1', 'API 요청 사례 변경은 진도가 아니어야 함');
  const firstHint = root.querySelector('[data-sf-aside-stage]:not([hidden])');
  assert.equal(firstHint.querySelector('[data-sf-hint-card]').hidden, true);
  firstHint.querySelector('[data-sf-hint-open]').click();
  assert.equal(firstHint.querySelector('[data-sf-hint-text]').textContent, '누가 이 기록을 작성하는지 서버는 어떻게 알까요?');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '0 / 1', '힌트 열기는 진도가 아니어야 함');
  firstHint.querySelector('[data-sf-hint-next]').click();
  assert.equal(firstHint.querySelector('[data-sf-hint-text]').textContent, '실패하면 기존 데이터는 어떻게 되나요?');
  progressCheckbox.click();
  const boardProgress = JSON.parse(storage.getItem('javaexperience.service.progress.v1'));
  assert.equal(boardProgress.stages['fixture-record'].board.create, true);
  assert.equal(boardProgress.completed['fixture-record'], true);
  assert.equal(boardProgress.untouched, 'keep');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '1 / 1');
  assert.equal(root.querySelector('[data-sf-stage-link][data-sf-variant="board"] [data-sf-stage-indicator]').textContent, '완료');
  assert.equal(root.querySelector('[data-sf-aside-stage][data-sf-variant="board"] [data-sf-aside-progress]').textContent, '이 단계의 완료 기록 있음');
  assert.match(root.querySelector('[data-sf-progress-status]').textContent, /모든 단계\(1\/1\)/);
  root.querySelector('[data-sf-stage-link][data-sf-variant="community"]').click();
  assert.equal(panels.filter((panel) => !panel.hidden)[0].dataset.sfVariant, 'community');
  assert.equal(root.querySelector('[data-sf-stage-panel]:not([hidden]) [data-sf-stage-complete]').checked, false, 'community 진도는 board 완료를 상속하지 않아야 함');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '0 / 1', '다른 variant의 진도를 합산하지 않아야 함');
  assert.match(root.querySelector('[data-sf-progress-status]').textContent, /0\/1단계/);
  assert.equal(dom.window.location.search, '?variant=community&stage=create');
  assert.equal(dom.window.location.hash, '#sf-stage-community-create');
  assert.equal(dom.window.document.activeElement, root.querySelector('[data-sf-stage-panel]:not([hidden]) .sf-stage-title h2'));
  assert.equal(root.querySelector('[data-sf-stage-panel]:not([hidden]) .sf-stage-title h2').textContent, '기록 생성');
  const navigatedBack = new Promise((resolve) => dom.window.addEventListener('popstate', resolve, { once: true }));
  dom.window.history.back();
  await navigatedBack;
  assert.equal(root.querySelector('[data-sf-stage-panel]:not([hidden])').dataset.sfVariant, 'board');
  root.querySelector('[data-sf-variant-select]').value = 'project-v1';
  root.querySelector('[data-sf-variant-select]').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.querySelector('[data-sf-stage-panel]:not([hidden]) [data-sf-stage-complete]').checked, false, 'project-v1 진도도 독립이어야 함');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '0 / 1');
  root.querySelector('[data-sf-variant-select]').value = 'board';
  root.querySelector('[data-sf-variant-select]').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  assert.equal(root.querySelector('[data-sf-stage-panel]:not([hidden]) [data-sf-stage-complete]').checked, true, 'board stage를 다시 열면 저장 상태를 복원해야 함');
  assert.equal(root.querySelector('[data-sf-progress-count]').textContent, '1 / 1');
  const saved = JSON.parse(storage.getItem('javaexperience.service.progress.v1'));
  assert.equal(saved.stages['fixture-record'].board.create, true);
  assert.equal(saved.completed['fixture-record'], true);
  assert.equal(storage.getItem('course.progress'), '{"legacy":"unchanged"}');
});

test('catalog filtering exposes matching groups and reset restores the first group', async () => {
  const other = { ...feature, id: 'fixture-delete', title: '기록 삭제', group: '신뢰성·운영', variants: [] };
  const html = renderServiceCatalog({ features: [feature, other], sourceIndex, apiRecipes: [recipe, relatedRecipe], rootPrefix: '../' });
  const dom = new JSDOM(`<main>${html}</main>`, { url: 'https://example.test/scenario/README.html' });
  dom.window.localStorage.setItem('javaexperience.service.progress.v1', JSON.stringify({ version: 1, completed: { 'fixture-record': true }, stages: { 'fixture-record': { board: { create: true } } } }));
  mountServiceFeaturePages(dom.window.document, { storage: dom.window.localStorage });
  const catalog = dom.window.document.querySelector('[data-sf-catalog]');
  const badge = catalog.querySelector('[data-sf-id="fixture-record"] [data-sf-progress-badge]');
  assert.equal(badge.hidden, false);
  assert.equal(badge.textContent, '진행 기록 있음', '목록 배지는 특정 variant 완료를 주장하지 않아야 함');
  const group = [...catalog.querySelectorAll('[data-sf-feature-group]')].find((item) => item.dataset.sfGroupName === '게시글과 소통');
  group.querySelector('[data-sf-group-collapse]').click();
  assert.equal(group.querySelector('[data-sf-group-cards]').hidden, true);
  catalog.querySelector('[data-sf-search]').value = '/api/records';
  catalog.querySelector('[data-sf-search]').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  assert.equal(group.hidden, false);
  assert.equal(group.querySelector('[data-sf-feature-card]').hidden, false);
  catalog.querySelector('[data-sf-method-filter="POST"]').click();
  assert.equal(catalog.querySelector('[data-sf-api-row]').hidden, false);
  catalog.querySelector('[data-sf-method-filter="GET"]').click();
  assert.equal(catalog.querySelector('[data-sf-api-row]').hidden, true);
  const communityProject = { ...feature, id: 'fixture-community', title: '커뮤니티 기록', projects: ['community'], group: '개발 준비', variants: [] };
  const projectHtml = renderServiceCatalog({ features: [feature, other, communityProject], sourceIndex, apiRecipes: [recipe], rootPrefix: '../' });
  const projectDom = new JSDOM(`<main>${projectHtml}</main>`, { url: 'https://example.test/scenario/README.html' });
  mountServiceFeaturePages(projectDom.window.document, { storage: projectDom.window.localStorage });
  const projectCatalog = projectDom.window.document.querySelector('[data-sf-catalog]');
  const groups = [...projectCatalog.querySelectorAll('[data-sf-feature-group]')];
  assert.equal(groups[0].dataset.sfGroupName, '개발 준비');
  assert.equal(groups.find((item) => item.dataset.sfGroupName === '개발 준비').querySelector('[data-sf-group-cards]').hidden, false);
  assert.ok(groups.filter((item) => item.dataset.sfGroupName !== '개발 준비').every((item) => item.querySelector('[data-sf-group-cards]').hidden));
  projectCatalog.querySelector('[data-sf-project]').value = 'community';
  projectCatalog.querySelector('[data-sf-project]').dispatchEvent(new projectDom.window.Event('change', { bubbles: true }));
  const filtered = projectCatalog.querySelector('[data-sf-id="fixture-community"]');
  assert.equal(filtered.hidden, false);
  assert.equal(filtered.closest('[data-sf-feature-group]').querySelector('[data-sf-group-cards]').hidden, false);
  projectCatalog.querySelector('[data-sf-filter-form]').reset();
  await new Promise((resolve) => projectDom.window.setTimeout(resolve, 0));
  assert.equal(projectCatalog.querySelector('[data-sf-id="fixture-community"]').hidden, false);
  assert.equal(projectCatalog.querySelector('[data-sf-feature-group][data-sf-group-name="개발 준비"] [data-sf-group-cards]').hidden, false);
});
