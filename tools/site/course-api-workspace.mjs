import { contractsForStep } from './course-api-contracts.mjs';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function renderCourseApiWorkspace({ stepId } = {}) {
  const contracts = contractsForStep(typeof stepId === 'string' ? stepId : '');
  if (!contracts.length) return '';
  const sid = String(stepId).replace(/[^a-zA-Z0-9_-]/g, '-');
  const id = (key) => `ca-${sid}-${key}`;
  const selected = contracts[0];
  const optionMarkup = contracts.map((contract) => `<option value="${esc(contract.id)}">${esc(contract.label)}</option>`).join('');
  const sqlMarkup = selected.dbSql.map((item) => `<article><h5>${esc(item.title)}</h5><p>${esc(item.explanation)}</p><pre><code>${esc(item.sql)}</code></pre></article>`).join('');
  const checks = selected.expectedChecks.map((check) => `<li>${esc(check)}</li>`).join('');
  const body = selected.requestBody === null ? '' : JSON.stringify(selected.requestBody, null, 2);
  const isList = selected.id === 'list';
  const idField = `<div class="ca-id-field" data-ca-id-field><label for="${id('post-id')}">확인할 글 id</label><input id="${id('post-id')}" data-ca-id inputmode="numeric" pattern="[1-9][0-9]*" autocomplete="off"><small>생성·목록 요청에는 이 id를 보내지 않습니다.</small></div>`;
  const fields = [
    ['cursor', 'cursor · 다음 묶음'], ['size', 'size · 개수'], ['keyword', 'keyword · 검색어'], ['tag', 'tag · 태그'], ['sort', 'sort · 정렬'],
  ].map(([key, label]) => `<label>${label}<input data-ca-query="${key}" type="${key === 'size' ? 'number' : 'text'}"${key === 'size' ? ' min="1" value="20"' : key === 'sort' ? ' value="latest"' : ''}></label>`).join('');
  return `<section class="course-api-workspace" data-ca-root data-ca-step="${esc(stepId)}">
  <details>
    <summary>내 서버에서 결과 확인 <span class="ca-summary-contract">${esc(selected.method)} ${esc(selected.path)}</span></summary>
    <p data-ca-description>${esc(selected.description)}</p>
    <div class="ca-contract-picker"${contracts.length === 1 ? ' hidden' : ''}><label for="${id('contract')}">확인할 API</label>
    <select id="${id('contract')}" data-ca-contract>${optionMarkup}</select></div>
    <div class="ca-contract-bar"><span data-ca-method>${esc(selected.method)}</span><code data-ca-path>${esc(selected.path)}</code><span data-ca-expected>기대 ${esc(selected.expectedStatus)}</span></div>
    <div class="ca-grid">
      <form data-ca-form>
        <h4>내 서버로 보낼 요청</h4>
        <div class="ca-connection"><div><label for="${id('base')}">실습 서버 주소</label><input id="${id('base')}" data-ca-base type="url" value="http://localhost:8080" autocomplete="url"></div><div><label for="${id('token')}">Bearer 토큰 · 저장하지 않음</label><input id="${id('token')}" data-ca-token type="password" autocomplete="off" value=""></div></div>
        ${selected.requiresId ? idField : ''}
        <div data-ca-query-fields${isList ? '' : ' hidden'}><fieldset><legend>목록 query</legend>${fields}</fieldset></div>
        <div data-ca-body-field${selected.requestBody === null ? ' hidden' : ''}><label for="${id('body')}">요청 본문 (JSON)</label><textarea id="${id('body')}" data-ca-body spellcheck="false">${esc(body)}</textarea></div>
        <p data-ca-no-body${selected.requestBody === null ? '' : ' hidden'}>이 요청은 본문이 없습니다.</p>
        <p data-ca-preview></p>
        <div class="ca-actions"><button data-ca-send type="submit" disabled>요청 전송</button><button data-ca-copy type="button" disabled>요청 복사 · 토큰 포함</button></div>
        <p data-ca-feedback role="status"></p><label for="${id('curl')}" data-ca-fallback hidden>요청 복사 대체 텍스트</label><textarea id="${id('curl')}" data-ca-curl readonly hidden></textarea>
      </form>
      <section class="ca-response"><h4>실제 응답 · 마지막 전송</h4><p data-ca-status role="status">미실행</p><p data-ca-sent-request></p><details data-ca-last-request hidden><summary>실제 전송한 요청 본문</summary><pre data-ca-sent-body></pre></details><pre data-ca-response>아직 요청하지 않았습니다.</pre><h5>읽을 수 있는 응답 헤더</h5><pre data-ca-headers>요청 후 표시합니다.</pre><p data-ca-verdict>상태·본문 형식 확인이며 자동 채점이 아닙니다.</p></section>
    </div>
    <div class="ca-context"><p data-ca-context>연결한 글 id 없음</p>${selected.requiresId ? '' : idField}<button data-ca-remember type="button" disabled>입력한 id로 이어가기</button><p class="ca-context-note">직접 입력한 id는 서버에 존재하는지 확인한 값이 아닙니다. 생성 응답의 Location을 읽을 수 없으면 브라우저 Network의 기존 응답 헤더나 API 클라이언트에서 실제 id를 확인하세요. 복사한 POST를 다시 실행하면 새 글이 추가됩니다.</p><p data-ca-storage role="status"></p></div>
    <section class="ca-sql"><h4>DB는 직접 확인</h4><p>구현 예시의 테이블입니다. 내 스키마에 맞게 직접 실행하세요. 화면은 SQL을 실행하거나 완료를 판정하지 않습니다.</p><div data-ca-sql>${sqlMarkup}</div><ul data-ca-checks>${checks}</ul></section>
    <script type="application/json" data-ca-data>${JSON.stringify({ stepId, contractIds: contracts.map((contract) => contract.id) }).replace(/</g, '\\u003c')}</script>
  </details>
</section>`;
}
