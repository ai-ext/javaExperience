import { renderServiceRequestTool } from './service-request-renderer.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const list = (value) => Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
const rootHref = (rootPrefix, path) => `${String(rootPrefix ?? '../').replace(/\/?$/, '/')}${path}`;
const detailHref = (feature, rootPrefix) => feature.href ? linkHref(feature.href, rootPrefix) : rootHref(rootPrefix, `scenario/features/${encodeURIComponent(feature.id)}.html`);
const human = (value) => typeof value === 'string' ? value : value && typeof value === 'object' ? value.text ?? value.label ?? value.title ?? JSON.stringify(value) : String(value ?? '');

function sourceEntries(sourceIndex) {
  if (Array.isArray(sourceIndex?.units)) return sourceIndex.units;
  return [];
}

function sourceLink(sourceId, sourceIndex, rootPrefix) {
  const record = sourceEntries(sourceIndex).find((item) => item.id === sourceId);
  if (!record) return `<span class="sf-source-id">${esc(sourceId)}</span>`;
  const href = record.href || record.url;
  const label = record.label || record.title || sourceId;
  return href ? `<a href="${esc(linkHref(href, rootPrefix))}">${esc(label)}</a>` : `<span>${esc(label)}</span>`;
}

function linkHref(href, rootPrefix) {
  if (/^(?:https?:|mailto:|\/\/|#)/i.test(href)) return href;
  return rootHref(rootPrefix, href.replace(/^\//, ''));
}

function apiData(value) {
  return Array.isArray(value) ? { recipes: value, routes: [] } : { recipes: list(value?.recipes), routes: list(value?.routes) };
}

function jsonForScript(value) {
  return JSON.stringify(value ?? []).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function routesFor(recipes, declaredRoutes = []) {
  const routes = new Map();
  const input = declaredRoutes.length ? declaredRoutes : recipes;
  for (const route of input) {
    if (!route?.method || !route?.path || !route?.project) continue;
    const key = `${route.project}\u0000${route.method}\u0000${route.path}`;
    const matching = recipes.filter((recipe) => recipe.project === route.project && recipe.method === route.method && recipe.path === route.path);
    const explicitIds = list(route.recipeIds).concat(list(route.recipes).concat(list(route.cases)).map((recipe) => typeof recipe === 'string' ? recipe : recipe.id));
    const declared = explicitIds.map((id) => recipes.find((recipe) => recipe.id === id)).filter(Boolean);
    const previous = routes.get(key);
    const cases = [...new Map([...(previous?.cases || []), ...(declared.length ? declared : matching)].map((recipe) => [recipe.id, recipe])).values()];
    routes.set(key, { ...previous, ...route, cases });
  }
  return [...routes.values()];
}

function featureLookup(features) {
  return new Map(list(features).filter((item) => item?.id).map((item) => [item.id, item]));
}

export function mergeServiceFeatureEntry(entry = {}, body = {}) {
  return { ...body, ...entry, ...body, id: entry.id || body.id, title: entry.title || body.title, summary: entry.summary || body.summary,
    group: entry.group || body.group, difficulty: entry.difficulty || body.difficulty,
    projects: entry.projects ?? body.projects, prerequisites: entry.prerequisites ?? body.prerequisites,
    preview: entry.preview ?? body.preview, status: entry.status || body.status };
}

function stageRecipesFor(variant, stage, recipes) {
  const selectedIds = [...new Set(list(stage.recipeIds).filter(Boolean))];
  const selected = selectedIds.map((id) => recipes.find((recipe) => recipe.id === id)).filter(Boolean);
  const ids = new Set(selected.map((recipe) => recipe.id));
  const sourceIds = new Set(list(stage.sourceUnits));
  const related = recipes.filter((recipe) => recipe.project === variant.project && list(recipe.sourceUnits).some((id) => sourceIds.has(id)) && !ids.has(recipe.id));
  return [...selected, ...related];
}

function prerequisiteMarkup(prerequisites, featureId, features, rootPrefix) {
  const lookup = featureLookup(features);
  const items = list(prerequisites).filter((id) => id && id !== featureId);
  if (!items.length) return '준비 기능 없음';
  return items.map((id) => {
    const feature = lookup.get(id);
    return feature ? `<a href="${esc(detailHref(feature, rootPrefix))}">${esc(feature.title)}</a>` : '선행 기능';
  }).join(' · ');
}

function requestFieldMarkup(fields, binding = false) {
  const items = list(fields);
  if (!items.length) return `<p class="sf-no-fields">${binding ? '원문에 등록된 요청 필드가 없습니다. 실제 과제와 서버를 확인해 직접 계약을 입력하세요.' : '별도 요청 필드가 없습니다.'}</p>`;
  return `<div class="sf-contract-table-wrap"><table class="sf-contract-table"><thead><tr><th>필드</th><th>위치</th><th>형식</th><th>필수</th><th>조건·설명</th></tr></thead><tbody>${items.map((field) => `<tr><th scope="row"><span>${esc(field.label || field.name || '필드')}</span>${field.label && field.name ? `<code>${esc(field.name)}</code>` : ''}</th><td>${esc(field.in || field.location || 'JSON')}</td><td>${esc(field.type || '미정')}</td><td>${field.required ? '필수' : '선택'}</td><td>${esc(field.help || field.constraint || '')}</td></tr>`).join('')}</tbody></table></div>`;
}

function apiFailures(recipe) {
  return list(recipe?.failures || recipe?.expected?.failures || recipe?.sourceCases);
}

function failureMarkup(failures) {
  const items = list(failures);
  if (!items.length) return '<p class="sf-no-fields">등록된 실패 사례가 없습니다.</p>';
  return `<ul class="sf-contract-failures">${items.map((failure) => {
    const status = list(failure?.expected?.statuses || failure?.statuses || failure?.status).filter(Boolean).join(' / ');
    const label = failure?.label || failure?.when || failure?.condition || failure?.expected?.description || human(failure);
    const result = failure?.result || failure?.expected?.description || '';
    return `<li>${status ? `<span>${esc(status)}</span>` : ''}<strong>${esc(label)}</strong>${result && result !== label ? `<small>${esc(result)}</small>` : ''}</li>`;
  }).join('')}</ul>`;
}

function serviceContractMarkup(recipes) {
  if (!recipes.length) return '';
  const first = recipes[0];
  const description = first.expected?.description || first.description || '';
  const bindingNotice = first.binding?.key ? `<p class="sf-contract-binding">아직 정하지 않은 내 프로젝트 계약 · 원문 ${esc(first.binding.sourceId || '출처 미지정')} · 실제 API 값을 직접 입력하세요.</p>` : '';
  return `<section class="sf-api-contract" data-sf-api-contract><h3>선택한 API 계약</h3><div class="sf-contract-view" data-sf-contract-view>${bindingNotice}<div class="sf-contract-route"><span class="sf-method sf-method-${esc(String(first.method || '').toLowerCase())}">${esc(first.method || (first.binding ? '직접 등록' : '미정'))}</span><code>${esc(first.path || (first.binding ? '실제 경로를 입력하세요' : '경로 미정'))}</code><strong>${esc(list(first.expected?.statuses).join(' / ') || (first.binding ? '상태를 직접 정함' : '상태 미정'))}</strong></div>${description ? `<p class="sf-contract-description">${esc(description)}</p>` : ''}<h4>요청 필드</h4>${requestFieldMarkup(first.requestFields, !!first.binding)}<h4>API 실패 사례</h4>${failureMarkup(apiFailures(first))}</div><script type="application/json" data-sf-contract-data>${jsonForScript(recipes)}</script></section>`;
}

function apiSourceMarkup(recipe, sourceIndex, rootPrefix) {
  const refs = list(recipe.sourceRefs);
  const units = list(recipe.sourceUnits);
  if (!refs.length && !units.length) return '';
  const unitLinks = units.map((id) => `<li>${sourceLink(id, sourceIndex, rootPrefix)}</li>`).join('');
  const refItems = refs.map((ref) => {
    if (typeof ref === 'string') return `<li>${esc(ref)}</li>`;
    const href = ref.href ? linkHref(ref.href, rootPrefix) : '';
    const label = [ref.label || ref.path || ref.sourceId || '원문 자료', ref.pointer].filter(Boolean).join(' · ');
    return `<li>${href ? `<a href="${esc(href)}">${esc(label)}</a>` : esc(label)}</li>`;
  }).join('');
  return `<ul class="sf-api-source-list">${unitLinks}${refItems}</ul>`;
}

function apiRouteCasesMarkup(cases, sourceIndex, rootPrefix, route) {
  if (!cases.length && !list(route.sourceRefs).length && !list(route.sourceUnits).length) return '';
  return `<details class="sf-api-cases"><summary>요청 사례·원문 자료 ${cases.length}개 보기</summary>${apiSourceMarkup(route, sourceIndex, rootPrefix)}<ul>${cases.map((recipe) => {
    const statuses = list(recipe.expected?.statuses).join(' / ');
    const sourceCases = list(recipe.sourceCases || recipe.failures);
    return `<li><strong>${esc(recipe.label || recipe.id || '요청 사례')}</strong><span>${esc(recipe.method || '')} ${esc(recipe.path || '')}${statuses ? ` · ${esc(statuses)}` : ''}</span>${recipe.expected?.description ? `<p>${esc(recipe.expected.description)}</p>` : ''}${sourceCases.length ? `<ul>${sourceCases.map((item) => `<li>${esc(list(item.expected?.statuses || item.status).join(' / '))} ${esc(item.label || item.condition || item.expected?.description || '')}</li>`).join('')}</ul>` : ''}${apiSourceMarkup(recipe, sourceIndex, rootPrefix)}</li>`;
  }).join('')}</ul></details>`;
}

function textList(title, values, className = '', kind = 'reference') {
  const items = list(values);
  if (!items.length) return '';
  return `<section class="sf-brief-section ${className}" data-content-kind="${esc(kind)}"><h4>${esc(title)}</h4><ul>${items.map((item) => `<li>${esc(human(item))}</li>`).join('')}</ul></section>`;
}

function referenceList(title, values, sourceIndex, rootPrefix) {
  const items = list(values);
  if (!items.length) return '';
  return `<section class="sf-brief-section"><h4>${esc(title)}</h4><ul>${items.map((item) => {
    const value = typeof item === 'string' ? item : item?.sourceId ?? item?.id ?? '';
    const unit = value ? sourceEntries(sourceIndex).find((entry) => entry.id === value) : null;
    const rawHref = typeof item === 'string' && /^(?:https?:|\/\/|(?:\.\.\/|\/)?[\w./-]+\.html(?:#[-\w:.]+)?$)/i.test(item) ? item : item?.href || unit?.href;
    const href = rawHref ? linkHref(rawHref, rootPrefix) : '';
    const label = typeof item === 'string' ? unit?.title || item : item?.label ?? item?.title ?? unit?.title ?? item?.sourceId ?? item?.href ?? JSON.stringify(item);
    return `<li>${href ? `<a href="${esc(href)}">${esc(label)}</a>` : esc(label)}</li>`;
  }).join('')}</ul></section>`;
}

function exampleMarkup(item) {
  if (typeof item === 'string') return `<li><code>${esc(item)}</code></li>`;
  const title = esc(human(item?.title ?? item?.label ?? '사례'));
  const description = item?.description ? ` · ${esc(item.description)}` : '';
  const states = [['입력 전', item?.start], ['행동', item?.action], ['결과', item?.result]].filter(([, value]) => value != null).map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(human(value))}</dd></div>`).join('');
  const value = item?.value == null ? '' : `<pre><code>${esc(typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2))}</code></pre>`;
  return `<li><strong>${title}</strong>${description}${states ? `<dl class="sf-example-states">${states}</dl>` : ''}${value}</li>`;
}

function briefMarkup(brief = {}) {
  const scenario = list(brief.scenario);
  const scenarioMarkup = scenario.length ? `<section class="sf-brief-section sf-scenario-section" data-content-kind="guide"><h3>4 · 사용자 시나리오</h3><div class="sf-scenario">${scenario.map((step) => `<article><dl>${[['시작 상태', step.start], ['요청', step.action], ['응답', step.result], ['이후 상태', step.after]].filter(([, value]) => value != null && value !== '').map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(human(value))}</dd></div>`).join('')}</dl></article>`).join('')}</div></section>` : '';
  const data = list(brief.data);
  const dataMarkup = data.length ? `<section class="sf-brief-section" data-content-kind="example"><h4>데이터와 이유</h4><dl class="sf-data-list">${data.map((item) => `<div><dt>${esc(human(item.name ?? item.label ?? '데이터'))}</dt><dd>${esc(human(item.reason ?? item.value ?? item.description))}</dd></div>`).join('')}</dl></section>` : '';
  const examples = list(brief.examples);
  const exampleBlock = examples.length ? `<section class="sf-brief-section" data-content-kind="example"><h4>입력 사례</h4><ul>${examples.map(exampleMarkup).join('')}</ul></section>` : '';
  const requirementRows = [
    ['입력과 출력', list(brief.inputs)], ['성공 기준', list(brief.success)], ['개발 과제', list(brief.work)],
  ].filter(([, values]) => values.length).map(([label, values]) => `<tr><th scope="row">${label}</th><td><ul>${values.map((item) => `<li>${esc(human(item))}</li>`).join('')}</ul></td></tr>`).join('');
  const policy = policyMarkup(brief.policies, brief.failures);
  const requirementsContent = [requirementRows ? `<div class="sf-requirements-table-wrap"><table class="sf-requirements-table"><tbody>${requirementRows}</tbody></table></div>` : '', dataMarkup, policy, exampleBlock].filter(Boolean).join('');
  const requirements = requirementsContent ? `<section class="sf-brief-section sf-requirements" data-content-kind="practice"><h3>3 · 세부 요구사항</h3>${requirementsContent}</section>` : '';
  const taskContent = brief.task || list(brief.preconditions).length;
  const taskSection = taskContent ? `<section class="sf-brief-section sf-task" data-content-kind="action"><h3>1 · 이번에 할 일</h3>${brief.task ? `<p>${esc(brief.task)}</p>` : ''}${list(brief.preconditions).length ? `<div class="sf-preconditions"><h4>2 · 시작 조건</h4><ul>${list(brief.preconditions).map((item) => `<li>${esc(human(item))}</li>`).join('')}</ul></div>` : ''}</section>` : '';
  return `<div class="sf-brief">
    ${brief.purpose ? `<p class="sf-purpose">${esc(brief.purpose)}</p>` : ''}
    <div class="sf-brief-core">${taskSection}${requirements}</div>
    ${scenarioMarkup}
  </div>`;
}

function policyMarkup(policies, failures) {
  const items = list(policies);
  const rules = items.filter((item) => !String(human(item)).startsWith('원문 완료 기준:'));
  const sourceCriteria = items.filter((item) => String(human(item)).startsWith('원문 완료 기준:'));
  const cases = list(failures);
  if (!rules.length && !cases.length && !sourceCriteria.length) return '';
  const policyRows = cases.map((item) => `<tr><th scope="row">${esc(human(item.when || item.condition || '조건'))}</th><td>${esc(human(item.result || item.expected || ''))}</td><td>${esc(human(item.unchanged || ''))}</td></tr>`).join('');
  const criteria = sourceCriteria.length ? `<section class="sf-source-criteria"><h5>원문 완료 기준·검증 메모</h5><ul>${sourceCriteria.map((item) => `<li>${esc(human(item).replace(/^원문 완료 기준:\s*/, ''))}</li>`).join('')}</ul></section>` : '';
  return `<section class="sf-brief-section sf-policy" data-content-kind="practice"><h4>업무 정책</h4>${policyRows ? `<div class="sf-policy-table-wrap"><table><thead><tr><th>조건</th><th>결과</th><th>유지할 상태</th></tr></thead><tbody>${policyRows}</tbody></table></div>` : ''}${rules.length ? `<ul>${rules.map((item) => `<li>${esc(human(item))}</li>`).join('')}</ul>` : ''}${criteria}</section>`;
}

function sourceUnitsMarkup(ids, sourceIndex, rootPrefix) {
  const items = list(ids);
  if (!items.length) return '';
  const units = sourceEntries(sourceIndex);
  return `<section class="sf-source-units"><h4>원문 단계와 세부 자료</h4><ul>${items.map((id) => {
    const unit = units.find((item) => item.id === id);
    if (!unit) return `<li>${sourceLink(id, sourceIndex, rootPrefix)}</li>`;
    const href = unit.href ? linkHref(unit.href, rootPrefix) : '';
    const link = href ? `<a href="${esc(href)}">${esc(unit.title || id)} ↗</a>` : esc(unit.title || id);
    const refs = [...list(unit.sourceRefs), ...list(unit.apiRefs)];
    return `<li><details><summary>${link}<span> · ${esc(unit.kind || '원문')}</span></summary>${unit.project ? `<p>프로젝트 · ${esc(unit.project)}</p>` : ''}${unit.required != null ? `<p>필수 여부 · ${unit.required ? '필수' : '선택'}</p>` : ''}${textList('원문 요구사항', unit.requirements)}${textList('원문 질문 힌트', unit.hints)}${referenceList('원문 API·참고 링크', refs, sourceIndex, rootPrefix)}</details></li>`;
  }).join('')}</ul></section>`;
}

function referencesMarkup(stage, feature, sourceIndex, rootPrefix) {
  const concepts = list(stage.concepts);
  const references = list(stage.references);
  const units = list(stage.sourceUnits);
  if (!concepts.length && !references.length && !units.length) return '';
  return `<aside class="sf-references" aria-label="원문과 관련 자료">${units.length ? sourceUnitsMarkup(units, sourceIndex, rootPrefix) : ''}${concepts.length ? `<section><h4>관련 개념</h4><ul>${concepts.map((item) => `<li><a href="${esc(linkHref(item.href, rootPrefix))}">${esc(human(item.label ?? item.title))} ↗</a></li>`).join('')}</ul></section>` : ''}${references.length ? `<section><h4>참고 자료</h4><ul>${references.map((item) => `<li><a href="${esc(linkHref(item.href, rootPrefix))}">${esc(human(item.label ?? item.title))} ↗</a></li>`).join('')}</ul></section>` : ''}</aside>`;
}

function executionChecksMarkup(stage, feature, variant) {
  const checks = list(stage.executionChecks);
  if (!checks.length) return '';
  const sid = `${feature.id}-${variant.id}-${stage.id}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `<details class="sf-execution"><summary>직접 시도한 뒤 보기 · 실행 예시와 기록</summary><p>명령을 자동 실행하지 않습니다. 직접 실행한 뒤 결과를 기록하세요.</p><ol>${checks.map((check, index) => `<li><label><input type="checkbox" data-sf-execution-check="${index}"> <strong>${esc(check.title)}</strong></label>${check.command ? `<pre><code>${esc(check.command)}</code></pre>` : ''}${check.expected ? `<p><b>확인할 결과</b> · ${esc(check.expected)}</p>` : ''}<label class="sf-record-label" for="sf-record-${sid}-${index}">실행 기록</label><textarea id="sf-record-${sid}-${index}" rows="2" placeholder="직접 확인한 결과를 적어 두세요."></textarea></li>`).join('')}</ol></details>`;
}

function hintMarkup(stage) {
  const hints = list(stage.hints);
  if (!hints.length) return '';
  return `<section class="sf-hints" data-sf-hints data-hint-count="${hints.length}"><div class="sf-hints-heading"><div><h4>막힐 때만 힌트</h4><p>질문을 하나씩 열어 생각할 방향을 확인하세요.</p></div><span data-sf-hint-count aria-live="polite">힌트를 열지 않았습니다</span></div><button type="button" data-sf-hint-open>힌트 보기 ↓</button><div class="sf-hint-card" data-sf-hint-card hidden><p data-sf-hint-text></p><div><button type="button" data-sf-hint-prev disabled>이전 힌트</button><button type="button" data-sf-hint-next>다음 힌트</button></div></div><script type="application/json" data-sf-hints-data>${JSON.stringify(hints).replace(/</g, '\\u003c')}</script></section>`;
}

function stageMarkup(feature, variant, stage, stageIndex, variantIndex, apiRecipes, sourceIndex, rootPrefix) {
  const stageRecipes = stageRecipesFor(variant, stage, apiRecipes);
  const contract = serviceContractMarkup(stageRecipes);
  const request = stageRecipes.length ? renderServiceRequestTool({ scopeKey: `feature-${feature.id}-${variant.id}-${stage.id}`, project: variant.project, recipes: stageRecipes, rootPrefix }) : '';
  const choices = list(stage.choices);
  const done = textList('완료 확인', stage.brief?.done, '', 'check');
  return `<article class="sf-stage-panel" id="sf-stage-${esc(variant.id)}-${esc(stage.id)}" data-sf-stage-panel data-sf-variant="${esc(variant.id)}" data-sf-stage="${esc(stage.id)}" data-sf-stage-index="${stageIndex}" data-sf-variant-index="${variantIndex}">
    <header class="sf-stage-title"><p>${esc(variant.label || variant.project || '실습 단계')} · ${stageIndex + 1}단계</p><h2 tabindex="-1">${esc(stage.title)}</h2></header>
    <div class="sf-stage-materials">
      ${briefMarkup(stage.brief || '')}${choices.length ? `<section class="sf-choices"><h4>선택해서 확장하기</h4><ul>${choices.map((choice) => `<li>${esc(human(choice))}</li>`).join('')}</ul></section>` : ''}
      <section class="sf-stage-flow-section sf-stage-hints" aria-label="필요할 때 보는 힌트"><h3>5 · 필요할 때 보는 힌트</h3><section class="sf-aside-stage" data-sf-aside-stage data-sf-variant="${esc(variant.id)}" data-sf-stage="${esc(stage.id)}"><p class="sf-aside-progress" data-sf-aside-progress>이 단계의 완료 기록 없음</p>${hintMarkup(stage) || '<p>현재 단계에 등록된 질문형 힌트가 없습니다.</p>'}</section></section>
      <section class="sf-stage-flow-section sf-stage-api" aria-label="직접 호출하기"><h3>6 · 직접 호출하기</h3><div class="sf-api-workspace">${request ? `<div class="sf-request-entry">${request}<ul class="sf-request-checklist"><li>요청 전 준비 데이터를 확인합니다.</li><li>응답의 생성 id를 다음 요청에 이어 씁니다.</li><li>요청 뒤 조회와 DB 확인 SQL을 함께 대조합니다.</li></ul></div>` : '<p>이 단계에 연결된 API 요청 사례가 없습니다.</p>'}${contract ? `<div class="sf-expected-contract">${contract}</div>` : ''}</div></section>
      <section class="sf-stage-flow-section sf-stage-done" aria-label="완료 확인"><h3>7 · 완료 확인</h3>${done}<label class="sf-stage-completion"><input type="checkbox" data-sf-stage-complete><span>완료 조건을 직접 확인했습니다</span></label>${executionChecksMarkup(stage, feature, variant)}${referencesMarkup(stage, feature, sourceIndex, rootPrefix)}</section>
    </div>
  </article>`;
}

function featureStages(feature) {
  return list(feature.variants).flatMap((variant, variantIndex) => list(variant.stages).map((stage, stageIndex) => ({ variant, variantIndex, stage, stageIndex })));
}

function projectId(project) {
  return typeof project === 'string' ? project : project?.id ?? project?.name ?? project?.label ?? '';
}

function featurePreview(feature) {
  const kind = feature.preview?.kind || '';
  if (feature.preview?.asset) return `<img src="${esc(feature.preview.asset)}" alt="${esc(feature.title)} 기능 시안" loading="lazy">`;
  const stages = featureStages(feature);
  const labels = [...new Set(stages.map(({ stage }) => stage.title).filter(Boolean))].slice(0, 3);
  const workflow = kind === 'workflow';
  const rows = labels.map((label, index) => `<li><span>${index + 1}</span><b>${esc(label)}</b><i>${index === 0 ? '진행' : '다음'}</i></li>`).join('');
  const isPost = /글|게시글|게시물|댓글/.test(`${feature.title} ${feature.group}`);
  const isCoupon = /쿠폰|포인트|상점/.test(`${feature.title} ${feature.group}`);
  const comparison = isPost ? [['등록 전', '목록 상태'], ['등록 후', feature.title]]
    : isCoupon ? [['사용 전', '잔액 확인'], ['사용 후', '변경 결과 확인']]
      : [['시작 상태', '요구사항 확인'], ['완료 상태', '결과 직접 확인']];
  const content = workflow ? `<ol>${rows}</ol>` : `<div class="sf-preview-rail"><span>기능</span><span>요구사항</span><span>직접 구현</span></div><strong>${esc(feature.title)}</strong><p>${esc(feature.summary || '')}</p><div class="sf-preview-comparison">${comparison.map(([label, value], index) => `<div><small>${esc(label)}</small><b>${esc(value)}</b>${index === 0 ? '<span aria-hidden="true">→</span>' : ''}</div>`).join('')}</div>`;
  return `<div class="sf-preview-ui ${workflow ? 'is-workflow' : 'is-feature'}" aria-hidden="true"><div class="sf-preview-top"><span></span><span></span><span></span><b>${workflow ? '작업 흐름' : '기능 화면'}</b></div><div class="sf-preview-content">${content}</div></div>`;
}

/** 기능별 단일 목록과 프로젝트별 API Explorer를 한 번씩 그린다. */
export function renderServiceCatalog({ features = [], sourceIndex = [], apiRecipes = [], rootPrefix = '../' } = {}) {
  const api = apiData(apiRecipes);
  apiRecipes = api.recipes;
  const apiRoutes = routesFor(apiRecipes, api.routes);
  const authored = features.filter((feature) => feature && feature.id);
  const difficulties = [...new Set(authored.map((feature) => feature.difficulty).filter(Boolean))];
  const projects = [...new Set(authored.flatMap((feature) => list(feature.projects).map(projectId).filter(Boolean)))];
  const cardItems = authored.map((feature) => {
    const href = detailHref(feature, rootPrefix);
    const featureProjects = list(feature.projects).map((project) => typeof project === 'string' ? project : project.label ?? project.name ?? project.id);
    const stages = featureStages(feature);
    const uniqueStages = new Set(stages.map(({ stage }) => stage.id || stage.title));
    const recipesForFeature = [...new Set(stages.flatMap(({ stage }) => list(stage.recipeIds)))].map((id) => apiRecipes.find((recipe) => recipe.id === id)).filter(Boolean);
    const apiCount = new Set(recipesForFeature.map((recipe) => `${recipe.project}\u0000${recipe.method}\u0000${recipe.path}`)).size;
    const sourceTerms = stages.flatMap(({ stage }) => list(stage.sourceUnits).flatMap((id) => {
      const source = sourceEntries(sourceIndex).find((unit) => unit.id === id);
      return [id, source?.title, source?.dayId, source?.dayTitle, ...list(source?.searchAliases)].filter(Boolean);
    }));
    const apiPaths = stages.flatMap(({ stage }) => list(stage.recipeIds).map((id) => apiRecipes.find((recipe) => recipe.id === id)?.path || id));
    const preview = featurePreview(feature).replace(/src="([^"]+)"/, (_, asset) => `src="${esc(linkHref(asset, rootPrefix))}"`);
    const group = feature.group || '서비스 기능';
    const markup = `<article class="sf-feature-card" data-sf-feature-card data-sf-id="${esc(feature.id)}" data-sf-difficulty="${esc(feature.difficulty || '')}" data-sf-projects="${esc(featureProjects.join('|'))}" data-sf-group="${esc(group)}" data-sf-search="${esc([feature.id, feature.title, feature.summary, group, ...featureProjects, ...list(feature.prerequisites), ...sourceTerms, ...apiPaths].join(' '))}">
      <a class="sf-card-preview" href="${esc(href)}">${preview}</a><div class="sf-card-body"><div class="sf-card-meta"><span>${esc(group)}</span><span>${esc(feature.difficulty || '난이도 미정')}</span>${feature.status === 'authored' ? '<span class="sf-authored">기획서 작성</span>' : '<span class="sf-draft">기획 중</span>'}<span data-sf-progress-badge hidden>진행 기록 있음</span></div><h3><a href="${esc(href)}">${esc(feature.title)}</a></h3><p>${esc(feature.summary || '')}</p><dl><div><dt>먼저</dt><dd>${prerequisiteMarkup(feature.prerequisites, feature.id, authored, rootPrefix)}</dd></div><div><dt>프로젝트</dt><dd>${featureProjects.map(esc).join(' · ') || '프로젝트 미정'}</dd></div></dl><footer><span>${uniqueStages.size}개 단계 · API ${apiCount}개</span><a href="${esc(href)}">기획서 열기 →</a></footer></div></article>`;
    return { group, markup };
  });
  const cardGroups = new Map();
  for (const item of cardItems) cardGroups.set(item.group, [...(cardGroups.get(item.group) || []), item.markup]);
  const groupOrder = ['개발 준비', '회원과 접근', '게시글과 소통', '포인트와 상점', '예약과 지급', '조회와 성능', '데이터 정합성', '자동화와 작업', '배포와 복구', '운영과 안전', '개발과 검증'];
  const cards = [...cardGroups.entries()].sort(([left], [right]) => {
    const leftRank = groupOrder.indexOf(left);
    const rightRank = groupOrder.indexOf(right);
    return (leftRank < 0 ? groupOrder.length : leftRank) - (rightRank < 0 ? groupOrder.length : rightRank);
  }).map(([group, items]) => `<section class="sf-feature-group" data-sf-feature-group data-sf-group-name="${esc(group)}"><h3><button type="button" data-sf-group-collapse aria-expanded="true"><span aria-hidden="true">⌄</span>${esc(group)} <small><span data-sf-group-count>${items.length}</span>개 기능</small></button></h3><div class="sf-feature-grid" data-sf-group-cards>${items.join('')}</div></section>`).join('');
  const recipeGroups = new Map();
  for (const route of apiRoutes) {
    const project = route.project || '프로젝트 미정';
    recipeGroups.set(project, [...(recipeGroups.get(project) || []), route]);
  }
  const routeOwner = (route) => {
    const cases = route.cases || [];
    return authored.find((feature) => feature.id === route.featureId || featureStages(feature).some(({ stage }) => list(stage.recipeIds).some((id) => cases.some((recipe) => recipe.id === id))));
  };
  const apiGroupMap = new Map();
  for (const route of apiRoutes) {
    const project = route.project || '프로젝트 미정';
    const method = route.method || '미정';
    const owner = routeOwner(route);
    const featureKey = owner?.id || route.featureId || route.label || 'other';
    const key = `${project}\u0000${featureKey}\u0000${method}`;
    apiGroupMap.set(key, { project, method, featureTitle: owner?.title || route.label || '기능 미지정', routes: [...(apiGroupMap.get(key)?.routes || []), route] });
  }
  const apiRouteGroups = [...apiGroupMap.values()];
  const apiGroups = apiRouteGroups.map(({ project, method, featureTitle, routes }) => `<section class="sf-api-group" data-sf-api-group data-sf-api-project="${esc(project)}" data-sf-api-method-group="${esc(method)}"><h3><button type="button" data-sf-api-collapse aria-expanded="false"><span aria-hidden="true">›</span>${esc(featureTitle)} · ${esc(method)} <small>${routes.length}개 API</small></button></h3><div data-sf-api-rows hidden><div class="sf-api-table-head"><span>HTTP 메서드</span><span>경로</span><span>결과 요약</span><span>기능 기획서</span></div>${routes.map((route) => {
    const cases = route.cases || [];
    const owner = routeOwner(route);
    const featureHref = owner ? detailHref(owner, rootPrefix) : '#visual-catalog';
    const label = owner?.title || route.label || cases[0]?.label || '기능 찾기';
    const expected = route.expected || cases[0]?.expected || {};
    const routeSearch = [route.label, route.method, route.path, project, expected.description, owner?.title, ...cases.flatMap((recipe) => [recipe.label, recipe.id, ...list(recipe.sourceCases).map((item) => item.label || item.condition)])].join(' ');
    return `<article class="sf-api-row" data-sf-api-row data-sf-method="${esc(route.method || '')}" data-sf-project="${esc(project)}" data-sf-search="${esc(routeSearch)}"><span class="sf-method sf-method-${esc(String(route.method || '').toLowerCase())}">${esc(route.method || '미정')}</span><code>${esc(route.path || '경로 미정')}</code><span>${esc(list(expected.statuses).join(' / ') || '응답 미정')} · ${esc(expected.description || '')}</span><a href="${esc(featureHref)}">${esc(label)} →</a>${apiRouteCasesMarkup(cases, sourceIndex, rootPrefix, route)}</article>`;
  }).join('')}</div></section>`).join('');
  return `<div class="sf-catalog" data-sf-catalog data-sf-view="features">
    <header class="sf-catalog-header"><div><p class="sf-eyebrow">기능을 고르고, 직접 만들어 보세요</p><h1>서비스 만들기</h1><p>기능과 요구사항을 확인한 뒤 내 서버에서 하나씩 구현하세요.</p></div><a href="${esc(rootHref(rootPrefix, 'course/spring/README.html'))}">기존 일자별 자료 D00–D45 →</a></header>
    <nav class="sf-view-tabs" aria-label="서비스 만들기 보기"><button type="button" data-sf-view-button="features" aria-pressed="true">기능 목록</button><button type="button" data-sf-view-button="preview" aria-pressed="false">단계별 시안</button><button type="button" data-sf-view-button="api" aria-pressed="false">API EXPLORER</button></nav>
    <section class="sf-feature-list" id="visual-catalog" aria-labelledby="sf-feature-list-title"><div class="sf-section-heading"><div><h2 id="sf-feature-list-title">단계별 시안으로 고르기</h2><p>완성할 기능으로 묶었습니다. 예전 세부 단계도 안에서 볼 수 있어요.</p><p><span data-sf-visible-count>${authored.length}</span>개 기능</p></div><a href="#journey-all-apis">API 경로로 찾기 ↓</a></div>
      <form class="sf-filters" data-sf-filter-form role="search"><label class="sf-search"><span aria-hidden="true">⌕</span><input type="search" data-sf-search placeholder="기능 · API 경로 검색" aria-label="기능 또는 API 검색"></label><label>난이도<select data-sf-difficulty><option value="">전체 난이도</option>${difficulties.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label><label>프로젝트<select data-sf-project><option value="">전체 프로젝트</option>${projects.map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label><button type="reset" data-sf-reset>필터 해제</button></form>
      <p class="sf-empty" data-sf-empty hidden>검색 조건에 맞는 기능이 없습니다.</p><div data-sf-feature-groups>${cards}</div>
    </section>
    <section class="sf-api-explorer" hidden id="journey-all-apis" aria-labelledby="sf-api-title"><header><div><p class="sf-eyebrow">경로와 HTTP 메서드로 찾기</p><h2 id="sf-api-title">API Explorer</h2><p>API 정의를 살펴보고 연결된 기능 기획서에서 구현 내용을 확인하세요.</p></div><a href="#visual-catalog">기능 목록 ↑</a></header><form class="sf-api-filters" data-sf-api-filter><label class="sf-search"><span aria-hidden="true">⌕</span><input type="search" data-sf-api-search placeholder="경로 · 기능 검색" aria-label="API 경로 또는 기능 검색"></label><label>프로젝트<select data-sf-api-project-filter><option value="">전체 프로젝트</option>${[...recipeGroups.keys()].map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select></label><div class="sf-method-filters" role="group" aria-label="HTTP 메서드"><button type="button" data-sf-method-filter="" aria-pressed="true">전체</button>${['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => `<button type="button" data-sf-method-filter="${method}" aria-pressed="false">${method}</button>`).join('')}</div></form><div class="sf-api-groups" data-sf-api-groups>${apiGroups}</div><p class="sf-api-note">같은 경로도 프로젝트에 따라 요청과 응답이 다를 수 있습니다.</p></section>
    <footer class="sf-catalog-original"><span>원본 자료</span><a href="${esc(rootHref(rootPrefix, 'course/spring/README.html'))}">기존 일자 목록 D00–D45</a><a href="#journey-all-apis">API 전체 목록</a><a href="${esc(rootHref(rootPrefix, 'scenario/README.html'))}#legacy-scenarios">기존 시나리오 원문</a><a href="#api-map-title">API 전체 구조도 ↓</a></footer>
  </div>`;
}

/** 기능 선택 화면은 모든 원문 기획 정보를 서버 HTML로 렌더링해 JS 없이도 읽힌다. */
export function renderServiceFeature({ feature, features = [], apiRecipes = [], sourceIndex = [], rootPrefix = '../../' } = {}) {
  if (!feature?.id) return '';
  apiRecipes = apiData(apiRecipes).recipes;
  const variants = list(feature.variants);
  const projectOptions = variants.map((variant, index) => `<option value="${esc(variant.id)}"${index === 0 ? ' selected' : ''}>${esc(variant.label || variant.project || variant.id)}</option>`).join('');
  const stages = featureStages(feature);
  const nav = variants.map((variant, variantIndex) => `<section><h3>${esc(variant.label || variant.project || `실습 ${variantIndex + 1}`)}</h3><ol>${list(variant.stages).map((stage, stageIndex) => `<li><button type="button" data-sf-stage-link data-sf-variant="${esc(variant.id)}" data-sf-stage="${esc(stage.id)}" aria-current="${variantIndex === 0 && stageIndex === 0 ? 'step' : 'false'}"><span>${stageIndex + 1}</span>${esc(stage.title)}<small data-sf-stage-indicator aria-label="완료 기록 없음">미완료</small></button></li>`).join('')}</ol></section>`).join('');
  const panels = stages.map(({ variant, variantIndex, stage, stageIndex }) => stageMarkup(feature, variant, stage, stageIndex, variantIndex, apiRecipes, sourceIndex, rootPrefix)).join('');
  const prerequisites = prerequisiteMarkup(feature.prerequisites, feature.id, features, rootPrefix);
  return `<div class="sf-feature-page" data-sf-feature="${esc(feature.id)}" data-sf-title="${esc(feature.title)}"><header class="sf-feature-head"><nav aria-label="경로"><a href="${esc(rootHref(rootPrefix, 'scenario/README.html'))}">서비스 만들기</a><span aria-hidden="true">›</span><span>${esc(feature.title)}</span></nav><h1>${esc(feature.title)}</h1><p class="sf-feature-summary">${esc(feature.summary || '')}</p>${list(feature.prerequisites).some((id) => id !== feature.id) ? `<p class="sf-prerequisites"><strong>먼저 확인할 기능</strong> · ${prerequisites}</p>` : ''}<div class="sf-feature-controls"><label>실습 프로젝트<select data-sf-variant-select>${projectOptions}</select></label></div></header>
    <div class="sf-feature-layout"><nav class="sf-stage-nav" aria-label="이 기능의 단계">${nav}<div class="sf-progress"><span>현재 프로젝트 완료 단계</span><strong data-sf-progress-count>0 / ${variants[0]?.stages?.length || 0}</strong></div></nav><section class="sf-stage-content" data-sf-stage-content>${panels}</section></div>
    <footer class="sf-manual-progress"><p role="status" data-sf-progress-status></p><small>직접 확인한 단계만 이 브라우저에 저장합니다 · 자동 채점 아님</small></footer>
  </div>`;
}

export { mountServiceFeaturePages } from './service-feature-client.mjs';
