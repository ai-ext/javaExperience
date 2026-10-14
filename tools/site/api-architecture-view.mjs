const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const methodClass = (method) => String(method || 'API').toLowerCase().replace(/[^a-z0-9_-]/g, '');
const asList = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const nodeText = (value) => typeof value === 'string' ? value : value?.filename ?? value?.file ?? value?.name ?? value?.label ?? String(value ?? '');
const fileList = (files) => asList(files).filter(Boolean).map((file) => `<code>${esc(nodeText(file))}</code>`).join('<br>');
const stageId = (stage) => typeof stage === 'string' ? stage : stage?.id;
const stageLabel = (stage) => typeof stage === 'string' ? stage : stage?.label ?? stage?.title ?? stage?.id;

function stageLinks(route, levelHrefFn) {
  const stages = asList(route.stages?.length ? route.stages : route.firstStage).filter(Boolean);
  return stages.map((stage) => {
    const id = stageId(stage);
    const label = stageLabel(stage);
    const href = id && typeof levelHrefFn === 'function' ? levelHrefFn(id) : null;
    return href ? `<a href="${esc(href)}">${esc(label)}</a>` : `<span>${esc(label)}</span>`;
  }).join(' · ');
}

function flowNode(title, files, optional = false) {
  const content = fileList(files);
  if (!content) return '';
  return `<div class="api-map-node"><span class="api-map-node-label">${esc(title)}${optional ? ' · 선택' : ''}</span><span class="api-map-node-files">${content}</span></div>`;
}

function routeMarkup(route, projectId, index, levelHrefFn) {
  const routeId = `${projectId}-${index}`.replace(/[^a-zA-Z0-9_-]/g, '-');
  const title = [route.method, route.path].filter(Boolean).join(' ');
  const flow = [
    flowNode('요청 DTO', route.requestDto, true),
    flowNode('Controller', route.controller),
    flowNode('Service', route.service),
    flowNode('Repository / Mapper', [...asList(route.repository), ...asList(route.mapper)]),
    flowNode('Entity', route.entity),
    flowNode('DB / SQL', route.db),
    flowNode('응답 DTO', route.responseDto, true),
  ].filter(Boolean);
  const links = stageLinks(route, levelHrefFn);
  const linkedStages = asList(route.stages?.length ? route.stages : route.firstStage).filter(Boolean);
  const stageMarkup = !links ? '' : linkedStages.length > 8
    ? `<details class="api-map-stage-list"><summary>연결된 시나리오 ${linkedStages.length}개 · 처음 ${esc(stageLabel(linkedStages[0]))}</summary><div>${links}</div></details>`
    : `<p class="api-map-stages"><strong>시나리오</strong> ${links}</p>`;
  return `<details class="api-map-route" id="${esc(routeId)}"><summary><span class="api-map-method method-${esc(methodClass(route.method))}">${esc(route.method || 'HTTP')}</span><code>${esc(route.path || '경로 미기록')}</code><span class="api-map-route-feature">${esc(route.feature || '')}</span></summary><div class="api-map-route-body">${route.notes ? `<p class="api-map-note">${esc(route.notes)}</p>` : ''}<div class="api-map-flow" aria-label="${esc(title)} 처리 흐름">${flow.join('<span class="api-map-arrow" aria-hidden="true">→</span>')}</div>${stageMarkup}</div></details>`;
}

function uniqueCounts(project) {
  const routes = asList(project.routes);
  const seen = new Set();
  const counts = {};
  for (const route of routes) {
    const method = String(route.method || '').toUpperCase();
    const path = String(route.path || '');
    if (!method || !path) continue;
    const key = `${method} ${path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[method] = (counts[method] || 0) + 1;
  }
  return counts;
}

function projectCounts(project) {
  const counts = uniqueCounts(project);
  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
    .map(([method, count]) => `<span class="api-map-count"><b>${esc(method)}</b> ${count}</span>`).join('');
}

function projectMarkup(project, levelHrefFn) {
  const byFeature = new Map();
  asList(project.routes).forEach((route) => {
    const feature = route.feature || '기능 미분류';
    if (!byFeature.has(feature)) byFeature.set(feature, []);
    byFeature.get(feature).push(route);
  });
  let routeIndex = 0;
  const groups = [...byFeature].map(([feature, routes]) => `<section class="api-map-feature"><h4>${esc(feature)}</h4>${routes.map((route) => routeMarkup(route, project.id || project.label || 'project', routeIndex++, levelHrefFn)).join('')}</section>`).join('');
  return `<details class="api-map-project"><summary><span class="api-map-project-title">${esc(project.label || project.id)}</span><span class="api-map-project-counts">${projectCounts(project)}</span></summary><div class="api-map-project-body">${project.description ? `<p>${esc(project.description)}</p>` : ''}${project.continuity ? `<p class="api-map-continuity"><strong>같은 글로 이어서 실습</strong> ${esc(project.continuity)}</p>` : ''}${groups || '<p class="api-map-muted">등록된 HTTP API가 없습니다.</p>'}</div></details>`;
}

function bulletList(items) {
  return asList(items).map((item) => `<li>${esc(typeof item === 'string' ? item : item?.label ?? item?.description ?? JSON.stringify(item))}</li>`).join('');
}

/** 카탈로그 전체를 접힌 상태로 시작하는 구조도 HTML로 렌더링한다. */
export function renderCatalog(catalog, levelHrefFn) {
  const projects = asList(catalog?.projects);
  const apiCount = projects.reduce((sum, project) => sum + Object.values(uniqueCounts(project)).reduce((a, n) => a + n, 0), 0);
  const methodTotals = {};
  for (const project of projects) for (const [method, count] of Object.entries(uniqueCounts(project))) {
    methodTotals[method] = (methodTotals[method] || 0) + count;
  }
  const totalsMarkup = Object.entries(methodTotals).sort(([a], [b]) => a.localeCompare(b))
    .map(([method, count]) => `<span class="api-map-count"><b>${esc(method)}</b> ${count}</span>`).join('');
  const nonHttp = asList(catalog?.nonHttp);
  const limitations = asList(catalog?.limitations);
  return `<section class="api-architecture" aria-labelledby="api-map-title"><header class="api-map-header"><p class="api-map-eyebrow">CODE ARCHITECTURE</p><h2 id="api-map-title">API 구조도</h2><p>프로젝트별 API와 구현 파일, 학습 시나리오를 연결했습니다.</p></header><details class="api-map-all"><summary><span class="api-map-summary-title">전체 구조도 보기</span><span class="api-map-summary-meta">React → Spring Boot → MySQL · DBeaver · ${apiCount} API</span></summary><div class="api-map-all-content"><div class="api-map-overview"><h3>서비스 요청과 데이터 저장</h3><div class="api-map-system-flow" aria-label="React 클라이언트에서 MySQL까지의 API 흐름"><div class="api-map-system-node"><strong>React 클라이언트</strong><span>화면에서 HTTP 요청</span></div><span class="api-map-arrow" aria-hidden="true">→</span><div class="api-map-system-node api-map-system-backend"><strong>Spring Boot API</strong><span>Controller → Service → Repository / Mapper</span></div><span class="api-map-arrow" aria-hidden="true">→</span><div class="api-map-system-node api-map-system-db"><strong>MySQL</strong><span>애플리케이션 데이터 저장</span></div></div><aside class="api-map-dbeaver"><span class="api-map-tool-icon" aria-hidden="true">↔</span><p><strong>DBeaver · 개발자 조회 도구</strong><br>사람이 MySQL에 직접 접속해 데이터를 조회하거나 수정할 때 사용합니다. 서비스 요청 처리 경로에 포함되는 홉은 아닙니다.</p><span class="api-map-tool-link" aria-hidden="true">MySQL 직접 접속</span></aside></div><div class="api-map-overall-counts" aria-label="메서드별 API 개수"><strong>메서드별 API</strong>${totalsMarkup}</div><h3 class="api-map-browse-title">실습 코드 묶음별 API와 내부 흐름</h3><div class="api-map-projects">${projects.map((project) => projectMarkup(project, levelHrefFn)).join('')}</div>${nonHttp.length ? `<details class="api-map-extra"><summary>HTTP API 외 동작 (${nonHttp.length})</summary><ul>${bulletList(nonHttp)}</ul></details>` : ''}${limitations.length ? `<details class="api-map-extra api-map-limitations"><summary>범위와 한계</summary><ul>${bulletList(limitations)}</ul></details>` : ''}</div></details></section>`;
}

/** 특정 시나리오 단계에 연결된 API를 렌더링한다. */
export function renderStage(catalog, id, levelHrefFn) {
  const routes = [];
  for (const project of asList(catalog?.projects)) {
    for (const route of asList(project.routes)) {
      const ids = [...asList(route.stages).map(stageId), stageId(route.firstStage)].filter(Boolean);
      if (ids.includes(id)) routes.push({ project, route });
    }
  }
  if (!routes.length) return '';
  return `<section class="api-map-stage" aria-label="이 단계의 API"><h3>이 단계에서 연결되는 API</h3><p class="api-map-stage-note">아래 역할과 파일은 완성 코드 기준입니다. 지금 단계에서 만들 범위는 본문의 ‘만들 것’과 ‘구현 가이드’를 따르세요.</p>${routes.map(({ project, route }, index) => `<p class="api-map-stage-project"><strong>${esc(project.label || project.id)}</strong></p>${routeMarkup(route, `${project.id || 'project'}-stage-${id}`, index, levelHrefFn)}`).join('')}</section>`;
}
