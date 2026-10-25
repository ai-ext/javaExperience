import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const moduleURL = new URL('./functional-query-visual.mjs', import.meta.url);
const renderer = await import(moduleURL).catch(() => ({}));
assert.equal(typeof renderer.renderFunctionalQueryVisual, 'function', '목록·PATCH native 렌더러가 필요합니다.');
const { renderFunctionalQueryVisual: render } = renderer;
const { initFunctionalQueryVisuals: init } = await import('./functional-query-visual-controller.mjs');
const mount = (specs, other = '') => {
  const dom = new JSDOM(`<main data-fw-root>${other}${specs.map(render).join('')}</main>`);
  init(dom.window.document);
  return { dom, d: dom.window.document, w: dom.window };
};
const change = (env, name, value, index = 0) => {
  const el = env.d.querySelectorAll(`[data-fqv-control="${name}"]`)[index];
  assert.ok(el, `조작 ${name} 존재`); el.value = value;
  el.dispatchEvent(new env.w.Event('change', { bubbles: true }));
};
const click = (env, name, value, index = 0) => {
  const el = [...env.d.querySelectorAll(`[data-fqv-action="${name}"]`)].filter(e => value == null || e.dataset.fqvValue === value)[index];
  assert.ok(el, `동작 ${name}/${value} 존재`); el.click();
};
const keys = (d, sel) => [...d.querySelectorAll(sel)].map(el => el.dataset.fqvRow);
const listSpec = stateId => ({ taskId: 'list', stateId, idPrefix: stateId });
{
  const e = mount(['list-condition', 'list-select', 'list-response'].map(listSpec), '<textarea data-fw-body>KEEP</textarea>');
  assert.equal(e.d.querySelectorAll('[data-fqv="list"]').length, 3);
  const first = () => e.d.querySelector('[data-fqv="list"]');
  assert.deepEqual(keys(first(), '[data-fqv-candidate]'), ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.deepEqual(keys(first(), '[data-fqv-item]'), ['B', 'A']);
  assert.equal(first().querySelector('[data-fqv-count]').textContent, '3');
  assert.match(first().textContent, /6개.*가상|가상.*6개/);
  assert.match(first().textContent, /실제 API 기본 size=10/);
  click(e, 'page', 'next');
  assert.deepEqual(keys(first(), '[data-fqv-item]'), ['C']);
  change(e, 'follow', 'off');
  assert.deepEqual(keys(first(), '[data-fqv-item]'), ['B', 'A']);
  assert.equal(first().querySelector('[data-fqv-count]').textContent, '2');
  assert.ok([...e.d.querySelectorAll('[data-fqv-control="follow"]')].every(el => el.value === 'off'), '상태 패널 간 선택 유지');
  change(e, 'block', 'in');
  assert.equal(first().querySelector('[data-fqv-candidate][data-fqv-row="D"]').dataset.included, 'false', '역방향 차단도 제외');
  change(e, 'viewer', 'anonymous');
  assert.deepEqual(keys(first(), '[data-fqv-item]'), ['D', 'A']);
  change(e, 'viewer', 'admin'); change(e, 'estatus', 'HIDDEN');
  assert.equal(first().querySelector('[data-fqv-candidate][data-fqv-row="E"]').dataset.included, 'false', 'ADMIN도 HIDDEN을 우회하지 않음');
  change(e, 'fboard', 'dev'); change(e, 'fdeleted', 'no');
  assert.equal(first().querySelector('[data-fqv-candidate][data-fqv-row="F"]').dataset.included, 'true');
  assert.equal(e.d.querySelector('[data-fw-body]').value, 'KEEP');
  e.dom.window.close();
}
{
  const e = mount(['patch-title', 'patch-tags', 'patch-commit', 'patch-rollback'].map(stateId => ({ taskId: 'update', stateId, idPrefix: stateId })));
  click(e, 'request', 'empty');
  const active = e.d.querySelector('[data-fqv-state="patch-title"]');
  assert.equal(active.querySelector('[data-fqv-set]').dataset.size, '0');
  assert.match(active.querySelector('[data-fqv-set]').textContent, /Set@Ptags/);
  assert.equal(active.querySelectorAll('[data-fqv-app-links] tbody tr').length, 2, '객체변경 시 앱 DB 관계는 미동기화');
  assert.equal(active.querySelectorAll('[data-fqv-commit-links] tbody tr').length, 0, 'commit 비교 연결은 빈집합');
  assert.equal(active.querySelectorAll('[data-fqv-tag-table] tbody tr').length, 2, '[]는 tag 원본행 보존');
  const committed = e.d.querySelector('[data-fqv-state="patch-commit"]');
  assert.equal(committed.querySelectorAll('[data-fqv-observer-links] tbody tr').length, 0, 'commit 후 외부에서도 연결 해제');
  assert.ok([...e.d.querySelectorAll('[data-fqv-action="request"][data-fqv-value="empty"]')].every(el => el.getAttribute('aria-pressed') === 'true'));
  click(e, 'request', 'values');
  assert.equal(active.isConnected, false, '패널 내용 갱신');
  const next = e.d.querySelector('[data-fqv-state="patch-tags"]');
  assert.equal(next.querySelectorAll('[data-fqv-tag-table] tbody tr').length, 3, '새 Tag IDENTITY 앱 Tx 행 표시');
  assert.equal(next.querySelectorAll('[data-fqv-observer-tags] tbody tr').length, 2, '외부에는 아직 신규 Tag 없음');
  assert.match(next.textContent, /clear\(\).*addAll/);
  const rollback = e.d.querySelector('[data-fqv-state="patch-rollback"]');
  assert.match(rollback.textContent, /자동.*원복|자동.*복구/);
  e.dom.window.close();
}
{
  const e = mount([{ taskId: 'update', stateId: 'patch-title' }, { taskId: 'update', stateId: 'patch-commit' }]);
  for (const preset of ['omit', 'null', 'object']) {
    click(e, 'request', preset);
    const panel = e.d.querySelector('[data-fqv-state="patch-title"]');
    assert.equal(panel.querySelector('[data-fqv-set]').dataset.size, '2', `${preset}는 태그 원소 유지`);
    const updated = [...panel.querySelectorAll('.fqv-field-comparison tbody tr')].find(r => r.querySelector('th').textContent === 'updatedAt');
    assert.deepEqual([...updated.querySelectorAll('td')].map(el => el.textContent), ['t0', 't1', 't0', 't0'], 'now 대입과 DB·외부 관찰은 구분');
  }
  click(e, 'request', 'values');
  const commit = e.d.querySelector('[data-fqv-state="patch-commit"]');
  assert.equal(commit.querySelectorAll('[data-fqv-observer-tags] tbody tr').length, 3, 'commit 후 외부 새 Tag 관찰');
  assert.equal(commit.querySelectorAll('[data-fqv-observer-links] tbody tr').length, 2, '중복 제거된 두 관계');
  assert.ok(commit.querySelector('[data-fqv-tag-table]').textContent.includes('spring'), '관계가 빠져도 spring 원본 보존');
  assert.doesNotMatch(commit.textContent, /아직 외부에 확정되지/, 'commit 뒤 관찰 가능한 새 Tag를 미확정이라고 설명하지 않음');
  assert.match(e.d.querySelector('[data-fqv-state="patch-title"]').textContent, /아직 외부에 확정되지/, 'commit 전 앱 Tx의 새 Tag와 외부 관찰을 구분');
  e.dom.window.close();
}

{
  const input = '<img src=x onerror=alert(1)>';
  const d = new JSDOM(render({ taskId: 'update', stateId: 'patch-title', options: { request: { title: input, tags: [input] } }, idPrefix: '\" onclick=\"evil' })).window.document;
  assert.equal(d.querySelectorAll('img, script, [onclick], [onerror]').length, 0, '입력은 HTML로 실행하지 않음');
  assert.ok(d.body.textContent.includes(input));
}
{
  const input = '"><img src=x onerror=alert(1)>';
  const d = new JSDOM(render({ taskId: 'list', stateId: 'list-select', options: { rowOverrides: { A: { key: input, id: input, authorId: input } } } })).window.document;
  assert.equal(d.querySelectorAll('img, [onerror]').length, 0, '가상 행 문자열도 HTML로 해석하지 않음');
}

{
  const e = mount([listSpec('list-select')], '<button data-fw-state="other">상위 상태</button>');
  let bubbled = 0;
  e.d.querySelector('[data-fw-root]').addEventListener('click', () => { bubbled++; });
  init(e.d); init(e.d);
  click(e, 'page', 'next');
  assert.equal(bubbled, 0, '모델 조작 이벤트는 상위 workspace 동작과 격리');
  assert.deepEqual(keys(e.d, '[data-fqv-item]'), ['C'], '중복 초기화 시 한 번만 이동');
  e.d.querySelector('[data-fw-state]').click();
  assert.equal(bubbled, 1, '시각화 외부 이벤트는 유지');
  e.dom.window.close();
}
{
  const dom = new JSDOM(`<main data-fw-root>${render(listSpec('list-condition'))}${render(listSpec('list-response'))}</main><aside data-fw-root>${render(listSpec('list-select'))}</aside>`);
  init(dom.window.document);
  const e = { dom, d: dom.window.document, w: dom.window };
  e.d.querySelector('.fqv-advanced').open = true;
  e.d.querySelector('[data-fqv-control="estatus"]').focus();
  change(e, 'estatus', 'PUBLISHED');
  assert.equal(e.d.activeElement.dataset.fqvControl, 'estatus', '재렌더 후 키보드 초점 유지');
  assert.equal(e.d.querySelector('.fqv-advanced').open, true, '심화 조작 영역 열린 상태 유지');
  assert.equal(e.d.querySelector('aside [data-fqv-control="estatus"]').value, 'DRAFT', '다른 workspace의 선택은 변경하지 않음');
  dom.window.close();
}


{
  const e = mount([listSpec('list-response')]);
  const pageButton = direction => e.d.querySelector(`[data-fqv-action="page"][data-fqv-value="${direction}"]`);
  pageButton('next').focus();
  pageButton('next').click();
  assert.equal(e.d.querySelector('[data-fqv-page]').textContent, '1');
  assert.equal(pageButton('next').disabled, true);
  assert.equal(e.d.activeElement, pageButton('prev'), '마지막 페이지에서는 활성 이전 버튼으로 초점 유지');
  pageButton('prev').click();
  assert.equal(e.d.querySelector('[data-fqv-page]').textContent, '0');
  assert.equal(pageButton('prev').disabled, true);
  assert.equal(e.d.activeElement, pageButton('next'), '첫 페이지에서는 활성 다음 버튼으로 초점 유지');
  e.d.activeElement.blur();
  pageButton('next').click();
  assert.equal(e.d.activeElement, e.d.body, '초점을 두지 않은 마우스 조작에 새 초점을 강제하지 않음');
  e.dom.window.close();
}


{
  const e = mount([{ taskId: 'update', stateId: 'patch-before' }]);
  click(e, 'request', 'empty');
  assert.equal(e.d.querySelector('[data-fqv-set]').dataset.size, '2', '요청 전에는 []를 골라도 기존 Set을 아직 비우지 않음');
  assert.match(e.d.querySelector('.fqv-set-operation').textContent, /아직 변경하지 않음/);
  assert.doesNotMatch(e.d.querySelector('.fqv-set-operation').textContent, /clear/);
  e.dom.window.close();
}


{
  const e = mount([listSpec('list-response')]);
  for (const viewer of ['member', 'anonymous', 'admin']) {
    change(e, 'viewer', viewer); change(e, 'block', 'none');
    const authorCell = e.d.querySelector('[data-fqv-row="B"] td');
    assert.equal(authorCell.textContent, 'U · 기준 회원', '선택 조회자가 달라도 작성자 U를 무조건 본인이라고 표시하지 않음');
    assert.doesNotMatch(e.d.querySelector('[data-fqv-candidate][data-fqv-row="D"] td').textContent, /차단 대상/, '차단 없음 선택과 고정 인물 라벨을 혼동하지 않음');
  }
  e.dom.window.close();
}

console.log('functional query visuals: model/DOM/isolation checks passed (실제 브라우저 레이아웃 미검증)');
