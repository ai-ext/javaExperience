import fs from 'node:fs';
import { W11_LESSONS, W11_ASSETS, w11AssetRoot } from './w11-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const w11AvailableLessons = () => W11_LESSONS.filter(lesson => lesson.stages.every(stage => W11_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명 화면을 보존하며 먼저 보여 주는 독립 보충 section이다.
export function renderW11Learning() {
  const available = w11AvailableLessons();
  if (!available.length) return '<section class="p09-learning w11-learning" data-w11-learning aria-labelledby="w11-learning-heading"><h2 id="w11-learning-heading">서비스 트랜잭션 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = W11_ASSETS[stage.image];
  return `<section class="p09-learning w11-learning" data-w11-learning aria-labelledby="w11-learning-heading">
    <header class="w11-intro"><p>트랜잭션 위치 · 같은 요청의 주문·재고 관찰</p><h2 id="w11-learning-heading" data-w11-question>${escape(lesson.question)}</h2></header>
    <p class="w11-scope">원문 A/B/C/D 코드는 그대로 두고 B/C 동명 대안을 별도 source set·JVM에서 실행했습니다. 추가 H2 schema·관찰 코드·메모리 Risk stub을 붙인 Spring 7.0.9 CGLIB·H2 2.4.240·JDK 21 실험이며 Boot 4.1.1 BOM만 사용했습니다. Controller는 Java 직접 호출이고 HTTP/MVC·201 응답·직렬화·실제 알림·broker는 미실행입니다.</p>
    <label class="p09-topic-label" for="w11-topic">살펴볼 질문<select id="w11-topic" data-w11-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="서비스 트랜잭션 보충 학습 장면">
      <header class="p09-question"><p data-w11-source>${escape(lesson.source)}</p></header>
      <p class="w11-source-note" data-w11-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-w11-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-w11-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="w11-stage-select">장면<select id="w11-stage-select" data-w11-stage-select></select></label><button type="button" data-w11-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-w11-title>${escape(stage.title)}</h3><p class="p09-lead" data-w11-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame w11-image-frame"><div class="p09-image-window"><img data-w11-image src="${w11AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-w11-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-w11-figure-label>전체 관계 그림</span><button type="button" data-w11-zoom aria-pressed="false">강조 구간 확대</button><a data-w11-image-link href="${w11AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 주문·재고·연결 관찰값</h3><dl data-w11-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-w11-copy>코드 복사</button></div><pre><code data-w11-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-w11-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-w11-note>${escape(lesson.note)}</p>
      <details class="w11-output" data-w11-output hidden><summary>추가 실행 검증 로그 보기</summary><p>실제 추가 실험 관측입니다. 각 JSON은 run 전체의 timeline·sourceSql·writer/독립 observer·완료값입니다. sourceSql에는 원문 PreparedStatement 문자열·setter 바인딩값·affectedRows가 기록됐으며 관찰 SELECT·setup·assert 쿼리는 제외합니다. wire·속도 로그가 아닙니다.</p><pre><code data-w11-stdout></code></pre><div class="w11-runs" data-w11-runs></div></details>
      <footer class="p09-controls"><button type="button" data-w11-prev disabled>← 이전</button><span data-w11-position role="status"></span><button type="button" data-w11-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#w11-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
export function renderW11Supplementary() {
  const sources=[['원문 5Java 추출·SHA·별도 B/C 실행 범위','source-proof/source.json'],['추가 JDBC 관찰·컨텍스트 전체 Java','source-proof/probe/W11Proof.java'],['추가 listener observer subclass','source-proof/probeC/ObservedListener.java'],['실제 B/C 관측·SQL·바인딩·사건 순서','source-proof/execution.json'],['공식 출처 확인·실행 한계','research/main-verification.json']];
  return `<details class="w11-supplement"><summary>추가 실험 전체 코드·원문 대안·SQL 관찰 근거</summary>
    <p>원문 5Java블록은 수정 없이 추출했습니다. B/C는 같은 OrderUseCase 이름을 가진 선택지이므로 각각 별도 source set·JVM으로 컴파일했습니다. 클래스 이름을 바꾸어 원문 코드라고 표시하지 않았습니다. 공통 저장소·A Controller·D CheckedOrderUseCase도 원문 그대로 사용했습니다.</p>
    <p>추가 schema는 orders(product_id,quantity)·inventory(product_id,quantity)이며 run마다 상품7·재고5로 초기화했습니다. 수량2는 성공, 수량6은 원문 guard UPDATE가0행인 실패를 관찰했습니다. Spring7.0.9 CGLIB·DataSourceTransactionManager·H2 2.4.240·JDK21을 사용했고 Boot4.1.1은 BOM으로만 사용했습니다.</p>
    <p>sourceSql에는 원문 PreparedStatement 문자열·실제 setter 바인딩값·affectedRows와 그 문장 직후 동일 writer/별도 JDBC observer의 상태가 있습니다. observer는 READ_COMMITTED·autocommit입니다. 관찰 SELECT·초기화·assert 쿼리는 sourceSql에 포함하지 않으며 원문 DML의 문장 수와 변경 행 수, wire·속도 계측을 구분합니다. tracked connection1/2는 각 run 안의 wrapper 식별자이고 DB 세션 번호·pool 개수가 아닙니다.</p>
    <p>D의 RiskClient 구현은 추가 메모리 stub입니다. 거부 run의 trackedConnectionsOpened0은 Spring DataSource wrapper 경로에서 연 연결0을 뜻하며 setup/raw observer/assert JDBC 연결을 제외합니다. 전체 실험의 모든 DB 연결0이라고 말하지 않습니다. Controller는 Spring 프록시 Java 메서드 호출로 검사했으며 HTTP/MVC·201 응답·응답 직렬화는 실행하지 않았습니다.</p>
    <p>C의 원문 OrderNotificationListener.afterCommit 본문은 주석뿐인 no-op입니다. 추가 ObservedListener subclass가 super.afterCommit을 호출한 다음 관찰을 기록했습니다. 이를 실제 알림·broker·내구성 있는 이벤트 전달로 표시하지 않습니다. 관찰 sequence5는 physical commit sequence4 뒤이며 callback의 active=true·sync=false는 DB가 미커밋이라는 뜻이 아닙니다. sequence는 로컬 사건 순서이며 시간이 아닙니다.</p>
    <p>공식 문서는 동일 DataSource/manager/스레드에서 JdbcTemplate의 연결 참여와 지연 연결 획득의 예외를 설명합니다. 본 실험은 H2 JDBC 조건이며 OSIV·JPA·MySQL·Java25·Boot 앱·Docker·실제 네트워크·결제·batch/message framework·broker·outbox·CDC·연결 풀·잠금 대기·속도·reactive를 실행하지 않았습니다. Controller 원자성의 성공과 서비스 유스케이스의 설계상 재사용 이유도 구분합니다.</p>
    <p>공식 근거: <a href="https://docs.spring.io/spring-framework/reference/data-access/transaction/tx-resource-synchronization.html">자원 동기화</a> · <a href="https://docs.spring.io/spring-framework/reference/data-access/jdbc/connections.html">JDBC 연결·지연 획득</a> · <a href="https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html">TransactionTemplate</a> · <a href="https://martinfowler.com/eaaCatalog/unitOfWork.html">Unit of Work</a> · <a href="https://raw.githubusercontent.com/spring-projects/spring-framework/v7.0.9/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/ServletInvocableHandlerMethod.java">7.0.9 MVC 반환값 처리 원문·실측 아님</a></p>
    ${sources.map(([title,file])=>`<details><summary>${escape(title)}</summary><pre><code>${escape(file.endsWith('.json') ? JSON.stringify(JSON.parse(fs.readFileSync(new URL('../../docs/design/w11-2026-10-20/'+file,import.meta.url),'utf8')), null, 2) : fs.readFileSync(new URL('../../docs/design/w11-2026-10-20/'+file,import.meta.url),'utf8'))}</code></pre></details>`).join('')}
  </details>`;
}
