import fs from 'node:fs';
import { S08_LESSONS, S08_ASSETS, s08AssetRoot } from './s08-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const s08AvailableLessons = () => S08_LESSONS.filter(lesson => lesson.stages.every(stage => S08_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명 화면을 보존하며 먼저 보여 주는 독립 보충 section이다.
export function renderS08Learning() {
  const available = s08AvailableLessons();
  if (!available.length) return '<section class="p09-learning s08-learning" data-s08-learning aria-labelledby="s08-learning-heading"><h2 id="s08-learning-heading">Spring 트랜잭션 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = S08_ASSETS[stage.image];
  return `<section class="p09-learning s08-learning" data-s08-learning aria-labelledby="s08-learning-heading">
    <header class="s08-intro"><p>Spring 트랜잭션 · 호출 경계·연결·commit</p><h2 id="s08-learning-heading" data-s08-question>${escape(lesson.question)}</h2></header>
    <p class="s08-scope">원문 3클래스에 추가 저장소·제어 변형을 연결한 standalone Spring 7.0.9 CGLIB·DataSourceTransactionManager·H2 2.4.240·JDK 21 실험입니다. Boot 4.1.1 BOM만 사용했습니다. Boot 앱·JPA·MySQL·Java 25·HTTP·Docker·reactive·broker·CDC·outbox는 미실행입니다.</p>
    <label class="p09-topic-label" for="s08-topic">살펴볼 질문<select id="s08-topic" data-s08-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="Spring 트랜잭션 보충 학습 장면">
      <header class="p09-question"><p data-s08-source>${escape(lesson.source)}</p></header>
      <p class="s08-source-note" data-s08-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-s08-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-s08-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="s08-stage-select">장면<select id="s08-stage-select" data-s08-stage-select></select></label><button type="button" data-s08-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-s08-title>${escape(stage.title)}</h3><p class="p09-lead" data-s08-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame s08-image-frame"><div class="p09-image-window"><img data-s08-image src="${s08AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-s08-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-s08-figure-label>전체 관계 그림</span><button type="button" data-s08-zoom aria-pressed="false">강조 구간 확대</button><a data-s08-image-link href="${s08AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 호출·연결·DB 관찰값</h3><dl data-s08-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-s08-copy>코드 복사</button></div><pre><code data-s08-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-s08-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-s08-note>${escape(lesson.note)}</p>
      <details class="s08-output" data-s08-output hidden><summary>추가 실행 검증 로그 보기</summary><p>PASS와 JSON은 실제 추가 실험 관측입니다. JSON은 run 전체의 timeline·최종 결과·연결 메서드 기록이며 현재 중간 장면 시점과 구분합니다. wire SQL·쿼리 수·지연시간을 계측한 로그가 아닙니다.</p><pre><code data-s08-stdout></code></pre><div class="s08-runs" data-s08-runs></div></details>
      <footer class="p09-controls"><button type="button" data-s08-prev disabled>← 이전</button><span data-s08-position role="status"></span><button type="button" data-s08-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#s08-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
export function renderS08Supplementary() {
  const sources = [['원문 3Java 추출·SHA·실행 범위','source-proof/source.json'],['추가 Spring JDBC 실험 전체 Java','source-proof/probe/S08Proof.java'],['실제 호출·연결·최종 DB 관측','source-proof/execution.json'],['공식 출처·리스너 예외 경로 정정','research/main-verification.json']];
  return `<details class="s08-supplement"><summary>추가 실험 전체 코드·원문/추가 구성·관측 근거</summary>
    <p>원문 TransferService·ImportService·OrderNotificationListener는 그대로 컴파일했습니다. 원문에 없는 JDBC 저장소·계정 초기값·ledger·추가 전파 메서드와 standalone Spring 컨텍스트를 붙인 실험입니다. Spring7.0.9 CGLIB·DataSourceTransactionManager·H2 2.4.240·JDK21을 사용했고 Boot4.1.1은 의존성 BOM으로만 사용했습니다.</p>
    <p>추가 계정 저장소의 failDebit는 UPDATE 뒤 원문 checked 예외를 강제로 던집니다. 실제 잔액 부족 알고리즘이 아닙니다. 추가 ImportRepository는 INSERT한 뒤 false를 반환하도록 제어해 원문 setRollbackOnly 분기를 확인했습니다. 실제 insertIfAbsent 또는 중복 키 구현이 아닙니다. gatewayInvocations는 메모리 메서드 호출 기록이며 broker 전달 성공·ack가 아닙니다.</p>
    <p>tracked connection 번호는 비풀링 JDBC 연결을 감싼 추가 트래킹용 식별자입니다. DB 세션 번호·풀 점유량·wire SQL·쿼리 수·속도 계측을 뜻하지 않습니다. observer는 별도 READ_COMMITTED·autocommit JDBC입니다. resourceActions는 연결 메서드의 호출 기록이며 중간 장면에 표시한 값과 run 최종 결과를 구분합니다.</p>
    <p>원문 AFTER_COMMIT 이벤트 리스너는 이 버전에서 afterCompletion 경로로 실행됐습니다. 제어한 gateway 예외는 로그에 남고 호출자에게 전달되지 않았으며 이미 완료된 DB commit은 유지됐습니다. 이 enum phase는 직접 TransactionSynchronization.afterCommit 콜백과 다릅니다. callback의 active=true·sync=false 표시도 물리 DB 미커밋의 증거가 아닙니다.</p>
    <p>readOnly와 NESTED·전파 결과는 이 JDBC 관리자/H2 조건의 관측입니다. timeout=3의 만료·모든 DB 격리 이상·전역 ALL_EXCEPTIONS·private 메서드·Future 반환 시점·reactive·JPA·MySQL·Java25·HTTP·Boot 앱·Docker·broker·outbox·CDC·프로세스 종료·재전송은 실행하지 않았습니다. 원문의 표준 격리 표·DB별 차이·아웃박스 DDL과 선택 기준은 보존했으며 전부를 실측으로 표시하지 않습니다.</p>
    <p>공식 근거: <a href="https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html">Spring7.0.9 트랜잭션 선언·프록시</a> · <a href="https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html">전파·물리/논리 경계</a> · <a href="https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html">트랜잭션 이벤트</a> · <a href="https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/transaction/event/TransactionPhase.html">7.0.9 TransactionPhase API</a></p>
    ${sources.map(([title,file])=>`<details><summary>${escape(title)}</summary><pre><code>${escape(fs.readFileSync(new URL('../../docs/design/s08-2026-10-20/'+file,import.meta.url),'utf8'))}</code></pre></details>`).join('')}
  </details>`;
}
