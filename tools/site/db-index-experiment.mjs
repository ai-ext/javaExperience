const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Render the one-page index experiment. All plan and runtime fields intentionally start blank. */
export function renderDbIndexExperiment() {
  return `<section class="db-index-lab" aria-labelledby="db-index-title" data-db-index-lab>
    <header class="db-index-hero">
      <div>
        <p class="db-index-eyebrow"><span>DB 실험실</span><span>EXPLAIN · INDEX</span></p>
        <h3 id="db-index-title">GET /api/me/likes</h3>
        <p>같은 조회 조건으로 인덱스 상태를 비교하고, 계획과 실제 실행을 따로 기록합니다.</p>
      </div>
      <a class="db-index-contract-link" href="#직접-확인">API 요청으로 응답 확인 <span aria-hidden="true">↗</span></a>
    </header>

    <div class="db-index-legend" aria-label="비교 상태">
      <span><i class="db-dot db-dot-base"></i>기준 계획</span>
      <span><i class="db-dot db-dot-added"></i>인덱스 추가 후</span>
      <span><i class="db-dot db-dot-invisible"></i>별도 실습 인덱스</span>
      <span class="db-index-not-measured">측정값은 실행 후 직접 입력</span>
    </div>

    <div class="db-index-workspace">
      <div class="db-index-states" role="group" aria-label="인덱스 상태 선택">
        <button class="db-state-card is-active" type="button" data-state="before" aria-pressed="true">
          <span class="db-state-card-top"><span class="db-state-step">01</span><span class="db-state-badge db-badge-base">기준</span></span>
          <strong>기존 인덱스</strong>
          <span class="db-state-db">practice · post_like</span>
          <span class="db-state-index"><code>member_id</code> 중심</span>
          <span class="db-state-flow" aria-hidden="true"><i>GET 요청</i><b>↓</b><i>post_like</i><b>↓</b><i class="db-flow-question">계획에서 확인</i></span>
          <span class="db-state-question">확인: 선택 key · 정렬 처리 · 추정 rows</span>
        </button>

        <button class="db-state-card" type="button" data-state="after" aria-pressed="false">
          <span class="db-state-card-top"><span class="db-state-step">02</span><span class="db-state-badge db-badge-added">V2 적용</span></span>
          <strong>복합 인덱스 추가</strong>
          <span class="db-state-db">practice · post_like</span>
          <span class="db-state-index"><code>(member_id, created_at, id)</code></span>
          <span class="db-state-flow" aria-hidden="true"><i>GET 요청</i><b>↓</b><i>post_like</i><b>↓</b><i class="db-flow-question">계획에서 확인</i></span>
          <span class="db-state-question">같은 SQL·파라미터·응답으로 비교</span>
        </button>

        <button class="db-state-card" type="button" data-state="invisible" aria-pressed="false">
          <span class="db-state-card-top"><span class="db-state-step">03</span><span class="db-state-badge db-badge-invisible">50만 행 격리 실습</span></span>
          <strong>INVISIBLE 전환</strong>
          <span class="db-state-db">javaexperience_perf · post_like</span>
          <span class="db-state-index"><code>ix_post_like_member_created</code></span>
          <span class="db-state-flow" aria-hidden="true"><i>SELECT 실습</i><b>↓</b><i>post_like</i><b>↓</b><i class="db-flow-muted">옵티마이저 후보 제외</i></span>
          <span class="db-state-question">API DB는 그대로 두고 격리 fixture만 전환</span>
        </button>
      </div>

      <section class="db-plan-panel" aria-labelledby="db-plan-title">
        <div class="db-plan-heading">
          <div><p class="db-index-eyebrow">선택한 상태</p><h3 id="db-plan-title" data-state-title>기존 인덱스 · practice</h3></div>
          <span class="db-plan-state" data-state-mark>01 / 03</span>
        </div>
        <div class="db-plan-tabs" role="tablist" aria-label="실행 계획 보기">
          <button type="button" id="db-tab-estimate" role="tab" aria-selected="true" aria-controls="db-plan-estimate" tabindex="0" data-plan-tab="estimate">EXPLAIN <span>추정 계획</span></button>
          <button type="button" id="db-tab-actual" role="tab" aria-selected="false" aria-controls="db-plan-actual" tabindex="-1" data-plan-tab="actual">EXPLAIN ANALYZE <span>실제 실행</span></button>
        </div>
        <div class="db-query-label"><span>현재 비교 쿼리</span><a href="#explain-추정치와-실제-실행을-나눠-기록한다">실습 방법 ↗</a></div>
        <pre class="db-query"><code data-query>EXPLAIN SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 6;</code></pre>
        <p class="db-query-scope">이 쿼리는 인덱스와 정렬을 분리해 보는 단일 테이블 실습입니다. 전체 권한 JOIN 계획과 API 응답은 아래 문서·요청에서 따로 확인하세요.</p>

        <div id="db-plan-estimate" role="tabpanel" aria-labelledby="db-tab-estimate" data-plan-panel="estimate">
          <p class="db-panel-caption">옵티마이저가 고른 접근 방법과 <b>예상</b> 행 수입니다. 이 명령은 조회를 실제 실행하지 않습니다.</p>
          <div class="db-plan-fields">
            <label>선택 key <input type="text" data-field="key" placeholder="EXPLAIN에서 기록" autocomplete="off"></label>
            <label>추정 rows <input type="text" data-field="estimatedRows" inputmode="numeric" placeholder="예: 실제 출력값"></label>
            <label>Extra / 정렬 <input type="text" data-field="extra" placeholder="EXPLAIN에서 기록"></label>
          </div>
        </div>
        <div id="db-plan-actual" role="tabpanel" aria-labelledby="db-tab-actual" data-plan-panel="actual" hidden>
          <p class="db-panel-caption"><b>EXPLAIN ANALYZE는 SELECT를 실행</b>합니다. iterator의 actual rows·loops·time을 실제 출력에서 옮기세요.</p>
          <div class="db-plan-fields db-plan-fields-actual">
            <label>actual rows <input type="text" data-field="actualRows" inputmode="numeric" placeholder="실제 출력값"></label>
            <label>loops <input type="text" data-field="loops" inputmode="numeric" placeholder="실제 출력값"></label>
            <label>actual time <input type="text" data-field="actualTime" placeholder="단위 포함해 기록"></label>
          </div>
        </div>
        <p class="db-plan-disclaimer" data-state-notice>V2 전후만 같은 API의 비교 대상입니다. 계획은 데이터와 통계에 따라 달라집니다.</p>
      </section>
    </div>

    <section class="db-index-result" aria-label="응답과 복원 기준">
      <div class="db-result-response">
        <span class="db-result-icon" aria-hidden="true">✓</span>
        <div><strong>응답 계약은 그대로</strong><p><code>GET /api/me/likes?size=5</code>를 V2 전·후 각각 보내 ID 순서를 비교</p><div class="db-result-ids" aria-label="기대 postId 순서"><span>145</span><span>143</span><span>140</span><span>139</span><span>142</span></div></div>
      </div>
      <div class="db-result-separation"><strong>비교 범위</strong><p><span class="db-dot db-dot-base"></span> V2 전 · <span class="db-dot db-dot-added"></span> V2 후는 같은 API</p><p><span class="db-dot db-dot-invisible"></span> INVISIBLE은 별도 <code>javaexperience_perf.post_like</code> 실습</p></div>
      <div class="db-result-restore"><strong>복원</strong><p>격리 fixture의 인덱스를 VISIBLE로 되돌린 뒤, 그 인덱스만 DROP 합니다.</p><a href="../../scenario/db-query-journey/DB-10-performance-fixture.html">격리 fixture · VISIBLE 복원 · DROP 순서 ↗</a><br><a href="../../docs/knowledge/R05-index-btree.html#5단계-인덱스-가시성을-바꿔-계획을-관찰한다">R05 인덱스 개념 보기 ↗</a></div>
    </section>
    <p class="db-state-live" data-lab-status role="status" aria-live="polite">선택된 상태: 기존 인덱스 · practice</p>
    <p class="db-index-footnote"><b>DBeaver</b>는 MySQL에 직접 연결해 계획을 관찰하는 도구입니다. 브라우저 → Controller → Service → Repository → MySQL의 API 요청 경로에는 포함되지 않습니다. API 비교와 대량 측정은 다른 DB에서 합니다. fixture에 남긴 측정 예시는 그 실행 환경의 기록이며, 직접 실행한 결과와 구분합니다.</p>
  </section>`;
}
