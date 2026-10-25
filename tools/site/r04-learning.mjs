import fs from 'node:fs';
import { R04_LESSONS, R04_ASSETS, r04AssetRoot } from './r04-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const r04AvailableLessons = () => R04_LESSONS.filter(lesson => lesson.stages.every(stage => R04_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 R04 보충 section이다.
export function renderR04Learning() {
  const available = r04AvailableLessons();
  if (!available.length) return '<section class="p09-learning r04-learning" data-r04-learning aria-labelledby="r04-learning-heading"><h2 id="r04-learning-heading">SQL 조회·변경 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = R04_ASSETS[stage.image];
  return `<section class="p09-learning r04-learning" data-r04-learning aria-labelledby="r04-learning-heading">
    <header class="r04-intro"><p>SQL 조회·JOIN·변경 · writer와 observer</p><h2 id="r04-learning-heading" data-r04-question>${escape(lesson.question)}</h2></header>
    <p class="r04-scope">새 datadir의 native MySQL 8.4.11에서 원문 SQL과 원문 Java OrderReadRepository를 실행했습니다. JDBC는 추가 SELECT-only 계정·loopback TLS·JDK 21·Spring 7.0.9·Connector/J 9.7.0이며 Boot 4.1.1 BOM만 사용했습니다. 원문 Java 25·Boot 앱·YAML/bash 3306·HTTP·물리 계획·성능은 미실행·미측정입니다.</p>
    <label class="p09-topic-label" for="r04-topic">살펴볼 질문<select id="r04-topic" data-r04-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="SQL 조회·변경 보충 학습 장면">
      <header class="p09-question"><p data-r04-source>${escape(lesson.source)}</p></header>
      <p class="r04-source-note" data-r04-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-r04-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-r04-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="r04-stage-select">장면<select id="r04-stage-select" data-r04-stage-select></select></label><button type="button" data-r04-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-r04-title>${escape(stage.title)}</h3><p class="p09-lead" data-r04-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame r04-image-frame"><div class="p09-image-window"><img data-r04-image src="${r04AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-r04-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-r04-figure-label>전체 관계 그림</span><button type="button" data-r04-zoom aria-pressed="false">강조 구간 확대</button><a data-r04-image-link href="${r04AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 결과 행·writer·observer</h3><dl data-r04-state></dl></section><section class="p09-code-sheet"><div class="r04-code-heading"><h3>함께 읽을 코드</h3><div class="r04-copy-actions"><button type="button" data-r04-copy>코드 복사</button><button type="button" data-r04-copy-full hidden>전체 트랜잭션 복사</button></div></div><pre><code data-r04-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-r04-copy-status role="status"></p><details class="r04-full-manual" data-r04-full-manual hidden><summary>전체 트랜잭션 SQL · 수동 복사</summary><p>전체 원문을 아래에서 직접 선택해 복사하세요.</p><pre><code data-r04-full-code></code></pre></details></section></div></div>
      <p class="p09-note" data-r04-note>${escape(lesson.note)}</p>
      <details class="r04-output" data-r04-output hidden><summary>추가 실행 검증 로그 보기</summary><p>원문 SQL·Java와 추가 probe의 실제 관측 JSON 발췌입니다. 원문 파일의 표현식은 보존하고 SQL 줄 주석만 분할용으로 제거했습니다. writer snapshot과 독립 observer, 원문 변경과 추가 r04_extra를 구분합니다. JDBC 추적 연결은 원문2호출만 포함하며 setup guard·pool 개수가 아닙니다.</p><pre><code data-r04-stdout></code></pre><div class="r04-runs" data-r04-runs></div></details>
      <footer class="p09-controls"><button type="button" data-r04-prev disabled>← 이전</button><span data-r04-position role="status"></span><button type="button" data-r04-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#r04-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
export function renderR04Supplementary() {
 const sources=[['원문 추출·SHA·실행 조건','source-proof/source.json'],['새 private MySQL guard·SQL·독립 writer/observer 전체','source-proof/run-proof.py'],['원문 Java 그대로 · OrderReadRepository','source-proof/original/java/example/OrderReadRepository.java'],['추가 JdbcTemplate·바인딩·자원 관찰 Java','source-proof/probe/example/R04JdbcProof.java'],['native41/JDBC8 관측·실제 SQL 전체','source-proof/execution.json'],['공식 출처 메인 대조·조회 한계','research/main-verification.json'],...['01','04','08','09','10','11','13'].map(n=>['추출한 원문 SQL block-'+n,'source-proof/original/block-'+n+'.sql'])];
 return `<details class="r04-supplement"><summary>원문 SQL·JDBC와 추가 실험 전체 코드·실측 근거</summary>
 <p>원문 SQL7블록은 줄 주석을 분할할 때만 제거하고 표현식은 유지했습니다. 원문 Java는 public 클래스 파일명으로 복사해 그대로 컴파일했습니다. Java25·원문 Kotlin build·datasource YAML·bash의3306 접속·Boot 앱·HTTP는 실행하지 않았습니다. 추가 fixture는 JDK21/Spring7.0.9/ConnectorJ9.7.0과 Boot4.1.1 BOM만 사용했습니다.</p>
 <p>외부 학습 schema/seed 사본은 새 MySQL8.4.11 datadir에만 적재했습니다. --no-defaults·전용 socket·실제 datadir/socket/port/bind/자체PID를 확인한 뒤에만 사본의 DROP DATABASE를 실행했습니다. JDBC에는 새127.0.0.1 전용 임시port와 SELECT 전용 계정·매run 임시 암호·sslMode=REQUIRED를 사용했습니다. 기존 DB·서비스·설정·인증정보는 사용하지 않았고 생성 암호도 trace/log에 넣지 않았습니다. mysqlx는 비활성화했으며 자기 서버는 정상 종료했습니다.</p>
 <p>원문 DML은 모두 한 transaction에서 마지막 ROLLBACK했습니다. INSERT3건 뒤와 ROW_COUNT조회2건 뒤에만 writer snapshot을 추가했습니다. UPDATE/DELETE와 ROW_COUNT 사이에는 별도 observer의 SELECT만 있어 writer 세션의 영향 행 수를 덮어쓰지 않습니다. observer는 autocommit READ COMMITTED입니다. 원문 coupon UPSERT는 신규 삽입 경로이며 중복 UNIQUE·1/2/0은 별도 upsert_probe입니다. CLIENT_FOUND_ROWS=false라는 PyMySQL 실험 조건을 JDBC의 기본 모드나 모든 연결로 일반화하지 않습니다.</p>
 <p>추가 r04_extra의 같은 금액 합계·NULL·alias/group 오류·autocommit·COMMIT·CHECK 문장 오류·safe updates·제어한 두 연결 interleaving은 원래 연습 사본과 다른 실험입니다. 특정 CHECK3819만 관찰했으며 모든 오류·deadlock이 같은 범위를 롤백한다고 하지 않습니다. race_probe는 순서 제어 사례이고 동시 부하·지연시간 검사가 아닙니다. 추가 observer 연결은 이 interleaving 한 사례에서 다른 writer 역할도 했습니다.</p>
 <p>원문 JDBC의 setLong index1/value1·181, 실제 ServerPreparedStatement, BigDecimal 매핑, 두 source 호출의 연결2·statement2·resultset2 종료를 관찰했습니다. 이 수에는 setup·guard·metadata 연결이 빠져 있으며 pool 크기가 아닙니다. PreparedStatement SQL·바인딩 관찰은 추가 wrapper 기록이고 wire 캡처가 아닙니다.</p>
 <p>ORDER BY 없는 CROSS·EXISTS의 관측 순서는 보장 순서가 아닙니다. 논리 처리 순서 그림은 교육용 설명이며 물리 실행계획·optimizer 순서·성능을 측정하지 않았습니다. 전수 픽셀 비교·학습자 이해도도 미검증입니다.</p>
 ${sources.map(([label,file])=>{const raw=fs.readFileSync(new URL('../../docs/design/r04-2026-10-20/'+file,import.meta.url),'utf8');let text=raw;try{text=JSON.stringify(JSON.parse(raw),null,2);}catch{}return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;}).join('')}
 </details>`;
}
