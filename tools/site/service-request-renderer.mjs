function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function safeJson(value) {
  return JSON.stringify(value ?? []).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function field(label, key, value = '', attrs = '') {
  return `<label class="srq-field"><span>${escapeHtml(label)}</span><input ${attrs} data-srq-${key} value="${escapeHtml(value)}"></label>`;
}

function recipeLabel(recipe) {
  if (recipe?.binding?.key) return `선택사항 · ${recipe.binding.label ?? recipe.label ?? recipe.id ?? '계약 연결'} · 내 프로젝트에서 정한 계약`;
  return recipe.label ?? recipe.title ?? recipe.id ?? '직접 등록 API';
}

export function renderServiceRequestTool({scopeKey = 'service', project = '', recipes = [], rootPrefix = ''} = {}) {
  const list = Array.isArray(recipes) ? recipes : [];
  const embeddedRecipes = list.map(recipe => {
    const headers = {...(recipe?.headers ?? {})};
    const hasAuthorization = Object.keys(headers).some(key => key.toLowerCase() === 'authorization');
    let removedManagedHeader = false;
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === 'authorization') delete headers[key];
      else if (['origin','cookie','cookie2','host','jsessionid'].includes(lower) || lower.startsWith('access-control-request-') || lower.startsWith('sec-') || lower.startsWith('proxy-')) { delete headers[key]; removedManagedHeader = true; }
    }
    const bound = Boolean(recipe?.binding?.key);
    return {...recipe, headers:bound ? {} : headers, body:bound ? null : recipe?.body,
      query:bound ? {} : recipe?.query, examples:bound ? [] : recipe?.examples,
      sourceCases:bound ? [] : recipe?.sourceCases, choices:bound ? [] : recipe?.choices,
      requiresToken:recipe?.requiresToken ?? recipe?.requiresAuth ?? hasAuthorization, removedManagedHeader};
  });
  const prefix = escapeHtml(rootPrefix);
  const options = list.map((recipe, index) => `<option value="${index}">${escapeHtml(recipeLabel(recipe))}</option>`).join('');
  const note = list.length ? '이 요청은 버튼을 눌렀을 때만 전송합니다. 상태 코드 일치는 기능 완성이나 DB 저장을 증명하지 않습니다.' : '등록된 API 요청이 없습니다. 아래 입력란에서 method, 경로, 기대 상태를 직접 정의하면 요청 도구를 사용할 수 있습니다.';
  const data = safeJson(embeddedRecipes);
  const projectValue = escapeHtml(project);
  const scope = escapeHtml(scopeKey);
  return `<section class="service-request-tool" data-srq-root data-srq-scope="${scope}" data-srq-project="${projectValue}" data-srq-prefix="${prefix}" aria-labelledby="srq-title-${scope}">
  <header class="srq-heading"><div><p class="srq-kicker">실제 HTTP 요청</p><h2 id="srq-title-${scope}">요청 실행 도구</h2></div><span class="srq-explicit">직접 실행</span></header>
  <p class="srq-note" data-srq-note>${note}</p>
  ${list.length ? `<label class="srq-field"><span>요청 사례</span><select data-srq-recipe>${options}</select></label>` : ''}
  <label class="srq-field srq-example-row" data-srq-example-row hidden><span>요청 예시</span><select data-srq-example></select></label>
  <div class="srq-plan" data-srq-plan><div><span>기획상 기대</span><strong data-srq-expected>API를 직접 등록해 주세요.</strong></div><p data-srq-description></p></div>
  <details class="srq-register" data-srq-register ${list.length ? '' : 'open'}><summary>${list.length ? 'API 미등록 작업 직접 연결' : '요청 계약 직접 등록'}</summary><p>원본에 없는 API 경로를 자동으로 만들지 않습니다. 실제 과제와 서버에 맞는 값을 입력하세요.</p>
    <div class="srq-grid"><label class="srq-field"><span>요청 방식(HTTP 메서드)</span><select data-srq-bind-method><option value="">선택</option><option>GET</option><option>HEAD</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>OPTIONS</option></select></label>${field('경로','bind-path','')}${field('기대 상태 코드','bind-status','', 'inputmode="numeric"')}${field('JSON 필수 필드 (쉼표로 구분)','bind-fields','')}</div>
    <button type="button" class="srq-secondary" data-srq-apply-binding>계약 등록 후 사용</button>
  </details>
  <div class="srq-controls">
    ${field('서버 주소','base','', 'type="url" placeholder="http://localhost:8080" autocomplete="url"')}
    <label class="srq-field"><span>요청 방식(HTTP 메서드)</span><select data-srq-method><option value="">선택</option><option>GET</option><option>HEAD</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>OPTIONS</option></select></label>
    ${field('요청 경로','path','', 'placeholder="/api/..." autocomplete="off"')}
    <div class="srq-params" data-srq-path-params></div>
    <div class="srq-manual-bindings" data-srq-manual-bindings hidden></div>
    <label class="srq-field"><span>검색·조회 조건(query, JSON)</span><textarea data-srq-query rows="2" spellcheck="false">{}</textarea></label>
    <label class="srq-field"><span>요청 헤더(JSON)</span><textarea data-srq-headers rows="3" spellcheck="false">{}</textarea><small>Origin, Cookie, Host, Access-Control-Request-*는 브라우저가 관리하므로 직접 넣을 수 없습니다. 실제 요청 값은 개발자 도구 Network에서 확인하세요.</small></label>
    <label class="srq-cookie-choice"><input type="checkbox" data-srq-cookies><span><strong>이 실습 서버의 쿠키 사용</strong><small>브라우저가 보관한 쿠키를 fetch credentials로 전송합니다. JSESSIONID와 Cookie 값은 앱에서 읽거나 저장하지 않습니다.</small><small data-srq-cookie-state>쿠키 전송 제외</small></span></label>
    <label class="srq-field"><span>Bearer 토큰 · 저장하지 않음</span><input type="password" data-srq-token autocomplete="off"></label>
    <label class="srq-field"><span>본문 유형</span><select data-srq-body-kind><option value="none">없음</option><option value="json">JSON</option><option value="text">text</option><option value="multipart">multipart file</option></select></label>
    <label class="srq-field srq-body-field"><span data-srq-body-label>요청 본문 (JSON 또는 text)</span><textarea data-srq-body rows="7" spellcheck="false"></textarea></label>
    <div class="srq-grid srq-file-field" data-srq-file-row hidden>${field('Multipart field 이름','file-field','file')}<label class="srq-field"><span>파일</span><input type="file" data-srq-file></label></div>
    <div class="srq-grid srq-resource-row" data-srq-resource-row hidden>${field('연결된 자원 ID','resource-id','', 'autocomplete="off" inputmode="numeric"')}<button type="button" class="srq-secondary" data-srq-clear-id>저장 ID 지우기</button><small data-srq-resource-label></small></div>
  </div>
  <div class="srq-actions"><label class="srq-inline"><input type="checkbox" data-srq-curl-token>curl 복사에 토큰 포함</label><button type="button" class="srq-secondary" data-srq-copy-curl>curl 복사</button><button type="button" class="srq-send" data-srq-send disabled>요청 보내기</button></div>
  <p class="srq-status" data-srq-status role="status" aria-live="polite">미실행</p>
  <div class="srq-result" data-srq-result hidden><div class="srq-result-metrics"><span>실제 HTTP 상태 <strong data-srq-actual-status>—</strong></span><span>실측 응답 시간 <strong data-srq-duration>—</strong></span></div><p data-srq-verdict></p><dl><dt>응답 headers</dt><dd><pre data-srq-response-headers></pre></dd><dt>응답 body 원문</dt><dd><pre data-srq-response-body></pre></dd></dl><p class="srq-snapshot" data-srq-snapshot></p></div>
  <aside class="srq-diagnostic" data-srq-diagnostic>브라우저가 CORS를 허용하지 않거나 API 서버에 연결할 수 없으면 요청 결과를 읽을 수 없습니다. 문서 사이트를 file://로 열었다면 http://localhost:3000에서 여세요. 실패 상태를 성공으로 추정하지 않습니다.</aside>
  <details class="srq-curl-fallback"><summary>curl 대체 실행 명령</summary><p>브라우저 CORS 제한을 확인할 때만 사용하세요. 복사 버튼은 별도 클릭이 필요하고 토큰은 체크하지 않으면 포함하지 않습니다. 브라우저 쿠키는 curl 복사에 포함되지 않으며, 실제 Origin·Cookie·preflight 값은 개발자 도구 Network에서 확인하세요.</p><textarea data-srq-curl readonly rows="5" aria-label="curl 명령"></textarea></details>
  <script type="application/json" data-srq-data>${data}</script>
</section>`;
}
