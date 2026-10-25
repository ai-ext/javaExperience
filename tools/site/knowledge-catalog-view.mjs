const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** 원문 데이터와 검토된 탐색 분류를 받아 상태별 공통 셸을 그린다. */
export function renderKnowledgeCatalog(documents, categories, aliases = {}, coreUnits = []) {
  const byId = new Map(documents.map((item) => [item.id, item]));
  const link = (id, text) => { const item = byId.get(id); return `<a href="${esc(item.href)}" data-kc-open="${id}">${esc(text)} →</a>`; };
  const fields = [{ id: 'all', label: '전체', count: documents.length }, ...categories.map((category) => ({ ...category, count: documents.filter((doc) => doc.category === category.id).length }))];
  const filters = fields.map((field) => `<button type="button" data-kc-category="${field.id}" data-kc-label="${esc(field.label)}" aria-pressed="${field.id === 'all'}">${esc(field.label)} <span>${field.count}</span></button>`).join('');
  const options = fields.map((field) => `<option value="${field.id}"${field.id === 'all' ? ' selected' : ''}>${esc(field.label)} · ${field.count}개</option>`).join('');
  const priorities = [['required', '필수'], ['optional', '선택'], ['all', '전체']];
  const depths = [['foundation', '기초'], ['applied', '응용'], ['advanced', '심화'], ['all', '전체']];
  const rows = documents.map((item) => {
    const primaryRank = { P09: 0, P01: 1, P03: 2, P12: 3, W19: 4, S01: 5 }[item.id];
    const browseRank = primaryRank ?? 10 + (item.browseRank ?? item.rank ?? 100);
    const title = item.title;
    const taskLinks = item.relatedTasks?.length ? `<dt>연결 실습</dt><dd>${item.relatedTasks.map((task) => `<a href="${esc(task.href)}">${esc(task.title)}</a>`).join('<br>')}</dd>` : '';
    const practice = item.practice ? `<dt>문서 예제</dt><dd><a href="${esc(item.practice.href)}" data-kc-open="${item.id}" data-kc-practice>${esc(item.practice.title)}</a></dd>` : '';
    const description = item.description || String(item.summary).replace(/^- /, '').replace(/`/g, '');
    return `<li class="kc-result visual-file" data-kc-document="${item.id}" data-kc-category="${esc(item.category)}" data-kc-priority="${esc(item.priority)}" data-kc-depths="${esc(item.depths.join(' '))}" data-kc-content-review="${esc(item.contentReview)}" data-kc-classification-basis="${esc(item.classificationBasis)}" data-kc-search="${esc(item.search)}" data-kc-rank="${item.rank ?? 100}" data-kc-browse-rank="${browseRank}" data-kc-question="${esc(item.displayQuestion || item.question || item.title)}" data-kc-title="${esc(title)}" hidden>
    <div class="kc-result-main"><span class="kc-result-badge" data-kc-badge hidden>지금 과제와 연결</span><h3><a href="${esc(item.href)}" data-kc-open="${item.id}">${esc(title)}</a></h3><p class="kc-result-question">${esc(item.question || item.displayQuestion || '')}</p><p class="kc-result-description">${esc(description)}</p><p class="kc-source">${esc(item.title)}</p><p class="kc-match-reason" data-kc-match-reason hidden></p></div>
    <div class="kc-result-aside"><dl>${item.reason ? `<dt>선택 이유</dt><dd>${esc(item.reason)}</dd>` : ''}${taskLinks}${practice}</dl></div>
    <a class="kc-result-open" href="${esc(item.href)}${item.href.includes('?') ? '&' : '?'}read=1" data-kc-open="${item.id}" aria-label="${esc(title + ' 설명 읽기')}">설명 읽기 →</a></li>`;
  }).join('');
  const unitLinks = coreUnits.map((item) => `<li><a data-kc-unit="${esc(item.id)}" data-kc-source="${esc(item.primarySourceId)}" data-kc-prerequisites="${esc((item.prerequisites || []).join(' '))}" href="${esc(item.href)}"><span>${esc(item.title)}</span><small>${esc(item.primarySourceId)} · ${esc(item.why)}</small></a></li>`).join('');
  const domainTiles = categories.map(category => {
    const count = documents.filter(doc => doc.category === category.id).length;
    const days = category.relatedDays || [];
    return `<article class="visual-file kc-domain-tile" data-concept-domain="${esc(category.id)}"><header><span class="file-layer">${count}문서</span></header><h3><a href="#kc-category-${esc(category.id)}" data-kc-domain-open="${esc(category.id)}">${esc(category.label)} →</a></h3><p>${esc({java:'객체·타입·컬렉션과 Java 코드',spring:'Bean·설정·요청 처리와 트랜잭션',request:'HTTP 계약·DTO·인증과 통신',data:'테이블·SQL·영속성·인덱스',testing:'테스트 경계·mock·격리 DB',delivery:'빌드·디버깅·배포와 운영'}[category.id] || '')}</p><small>${days.length ? `관련 일자 ${days.slice(0,4).map(day => `<a href="../../course/spring/${esc(day)}.html">${esc(day)}</a>`).join(' · ')}${days.length > 4 ? ` 외 ${days.length-4}일` : ''}` : '연결된 일자 없음'}</small></article>`;
  }).join('');
  const coreStart = coreUnits[0] ? `<a data-kc-core-start href="${esc(coreUnits[0].href)}">필수 기초 6단원 시작 →</a>` : '';
  return `<section class="kc-catalog" aria-labelledby="knowledge-visual-title">
  <header class="kc-hero"><h1 id="knowledge-visual-title" data-kc-hero-title>막힌 개념을, 값의 변화로 이해하세요.</h1><p data-kc-discovery>질문이나 기술명으로 찾고, 코드·요청·결과를 함께 살펴보세요.<br>개발은 IDE에서, 여기서는 개념을 확인합니다.</p>
  <form class="kc-search" role="search" autocomplete="off"><label for="knowledge-search-input">어떤 개념이 궁금한가요?</label><div class="kc-search-row"><div class="kc-search-field"><span aria-hidden="true">⌕</span><input id="knowledge-search-input" type="search" placeholder="예: DTO · new · 트랜잭션" aria-controls="kc-results" maxlength="160"><button class="kc-search-clear" type="button" data-kc-search-clear aria-label="검색어 지우기" hidden>×</button></div><button type="submit">검색</button></div><p data-kc-draft role="status" hidden></p></form>
  <div class="kc-quick" data-kc-discovery><span>자주 찾는 개념</span>${['IoC','애노테이션','Lombok','DTO','객체','트랜잭션'].map((q) => `<button type="button" data-kc-query="${q}">${q}</button>`).join('')}</div></header>
  <p class="kc-task-context" data-kc-task-context hidden><a class="kc-task-return" data-kc-task-return hidden></a></p>
  <section class="kc-context" data-kc-context data-kc-discovery hidden><h2>지금 과제와 연결해서 보기</h2><span class="kc-context-tag" data-kc-context-tag></span><div class="kc-recommendation" data-kc-context-body></div></section>
  <section class="kc-intro" data-kc-discovery><div><h2>Java · Spring Boot 필수 기초</h2><p>객체 생성부터 Bean 생명주기까지 코드·상태·실제 관찰을 연결합니다.</p></div><div>${coreStart}<a href="#kc-sequence">학습 순서 보기 ↓</a></div></section>
  <section class="kc-browse" aria-labelledby="kc-browse-title"><h2 id="kc-browse-title" data-kc-discovery>분야별로 찾아보기</h2><div class="visual-file-grid kc-domain-grid" data-kc-discovery>${domainTiles}</div>
  <div class="kc-filters" role="group" aria-label="개념 분야">${filters}</div><label class="kc-filter-mobile">분야<select data-kc-category-select aria-label="개념 분야 선택">${options}</select></label>
  <div class="kc-classification-filters"><label>학습 우선순위<select data-kc-priority aria-label="학습 우선순위">${priorities.map(([id, label]) => `<option value="${id}"${id === 'required' ? ' selected' : ''}>${label}</option>`).join('')}</select></label><label>학습 깊이<select data-kc-depth aria-label="학습 깊이">${depths.map(([id, label]) => `<option value="${id}"${id === 'foundation' ? ' selected' : ''}>${label}</option>`).join('')}</select></label><button type="button" data-kc-filter-reset>검색어 유지하고 필터 초기화</button></div>
  <div class="kc-results-heading"><div><h2 id="knowledge-search-results" data-kc-results-title role="status" aria-live="polite" tabindex="-1">개념 목록</h2><p data-kc-results-basis>문서를 선택해 개념을 살펴보세요.</p></div><label>정렬<select data-kc-sort aria-label="개념 정렬"><option value="relevance">관련도순</option><option value="title">제목순</option></select></label></div>
  <ul class="kc-results visual-file-grid" id="kc-results" data-kc-results>${rows}</ul>
  <div class="kc-empty" data-kc-empty hidden><span class="kc-empty-icon" aria-hidden="true">⌕</span><h3 data-kc-empty-title></h3><p data-kc-empty-description></p><button type="button" data-kc-filter-reset>모든 필터 해제 · 검색어 유지</button><button type="button" data-kc-reset>검색어 지우고 탐색하기</button></div><button class="kc-browse-more" type="button" data-kc-more>필터에 맞는 문서 모두 보기</button></section>
  <section class="kc-sequence" id="kc-sequence" data-kc-discovery><h2>처음이라면, 이 순서로 이해해 보세요</h2><p>필수 순서는 아닙니다. 필요한 개념부터 골라도 좋아요.</p><ol>${unitLinks}</ol></section>
  <section class="kc-original-link" data-kc-discovery><div><h2>기존 문서를 그대로 읽고 싶다면</h2><p>원문 목차와 전체 설명을 그대로 볼 수 있습니다.</p></div><a href="#kc-original" data-kc-original>원문 전체 ${documents.length}개 보기 →</a></section>
  <p class="kc-search-limit">필수·깊이는 기본 API 입문 기준 탐색 분류입니다. 134개 원문별 내용·실행 검증은 진행 중이며 전수 리서치가 완료된 상태가 아닙니다. 문서 제목·소제목과 등록한 질문으로 찾습니다. 본문 전체 검색은 제공하지 않습니다. 학습 장면은 예시이며 실제 서버 실행 결과는 과제에서 확인합니다.</p><span data-kc-evidence-status data-content-review="not_reassessed" hidden></span>
  <script type="application/json" data-kc-aliases>${JSON.stringify(aliases).replace(/</g, "\\u003c")}</script>
  <noscript><p>검색에는 JavaScript가 필요합니다. 아래 기존 문서 전체 표에서 모든 개념을 읽을 수 있습니다.</p></noscript></section>`;
}
