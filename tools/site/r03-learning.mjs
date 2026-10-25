import fs from 'node:fs';
import { R03_LESSONS, R03_ASSETS, r03AssetRoot } from './r03-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const r03AvailableLessons = () => R03_LESSONS.filter(lesson => lesson.stages.every(stage => R03_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 R03 보충 section이다.
export function renderR03Learning() {
  const available = r03AvailableLessons();
  if (!available.length) return '<section class="p09-learning r03-learning" data-r03-learning aria-labelledby="r03-learning-heading"><h2 id="r03-learning-heading">MySQL 스키마·타입 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = R03_ASSETS[stage.image];
  return `<section class="p09-learning r03-learning" data-r03-learning aria-labelledby="r03-learning-heading">
    <header class="r03-intro"><p>MySQL 스키마 · 문자·제약·transaction 관찰</p><h2 id="r03-learning-heading" data-r03-question>${escape(lesson.question)}</h2></header>
    <p class="r03-scope">별도 datadir·socket의 native MySQL 8.4.11·PyMySQL 1.1.2에서 외부 연습 schema/seed 사본과 추가 r03_extra를 실행했습니다. TCP·mysqlx는 비활성화했습니다. 원문 bash 접속 명령·HTTP·Java/JPA·Docker는 미실행이며 물리 파일/page 내부·속도는 측정하지 않았습니다.</p>
    <label class="p09-topic-label" for="r03-topic">살펴볼 질문<select id="r03-topic" data-r03-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="MySQL 스키마·타입 보충 학습 장면">
      <header class="p09-question"><p data-r03-source>${escape(lesson.source)}</p></header>
      <p class="r03-source-note" data-r03-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-r03-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-r03-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="r03-stage-select">장면<select id="r03-stage-select" data-r03-stage-select></select></label><button type="button" data-r03-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-r03-title>${escape(stage.title)}</h3><p class="p09-lead" data-r03-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame r03-image-frame"><div class="p09-image-window"><img data-r03-image src="${r03AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-r03-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-r03-figure-label>전체 관계 그림</span><button type="button" data-r03-zoom aria-pressed="false">강조 구간 확대</button><a data-r03-image-link href="${r03AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 값·제약·DB 관찰값</h3><dl data-r03-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-r03-copy>코드 복사</button></div><pre><code data-r03-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-r03-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-r03-note>${escape(lesson.note)}</p>
      <details class="r03-output" data-r03-output hidden><summary>추가 실행 검증 로그 보기</summary><p>실제 격리 MySQL 관측 JSON 발췌입니다. 원문 SQL2~5는 클라이언트 표시 명령 \\G를 서버 전송 시 ;로 바꾸고 분할용 주석을 제거했으며 SQL 표현식은 유지했습니다. 외부 연습 사본과 추가 r03_extra를 구분하며 임시 setup guard 경로는 이 발췌에 포함하지 않습니다.</p><pre><code data-r03-stdout></code></pre><div class="r03-runs" data-r03-runs></div></details>
      <footer class="p09-controls"><button type="button" data-r03-prev disabled>← 이전</button><span data-r03-position role="status"></span><button type="button" data-r03-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#r03-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
export function renderR03Supplementary() {
 const sources=[['원문 SQL 추출·SHA·외부 학습 사본 출처·실행 범위','source-proof/source.json'],['새 private MySQL 초기화·접속 guard·전체 추가 실험','source-proof/run-proof.py'],['실제 35관측·원문 SQL·추가 probe·SQL trace 전체','source-proof/execution.json'],['공식 출처 메인 대조·다운로드·검증 한계','research/main-verification.json'],['외부 학습 schema 사본 · 기존 DB에 재적재하지 않음','source-proof/original/external-study-schema.sql'],['외부 학습 seed 사본 · fake 학습 데이터','source-proof/original/external-study-seed.sql'],...['02','03','04','05'].map(n=>['수정 없이 추출한 원문 SQL block-'+n,'source-proof/original/block-'+n+'.sql'])];
 return `<details class="r03-supplement"><summary>원문 SQL·추가 실험 전체 코드·실행 근거</summary>
 <p>원문 bash 접속 명령의 사용자 placeholder는 실행하지 않았습니다. 원문 SQL2~5는 mysql 클라이언트 표시 명령 \\G를 서버에 전달할 때만 ;로 바꾸고 분할용 주석을 제거했습니다. 비교·UPDATE·DDL 표현식과 추출 파일은 보존했습니다.</p>
 <p>원래 연습 자료는 저장소 practice DB와 다른 외부 학습 schema/seed입니다. 원본 SHA를 보존한 사본을 공식 MySQL 8.4.11 macOS ARM64 portable 바이너리의 새 datadir에만 적재했습니다. --no-defaults·전용 Unix socket·TCP 비활성화·mysqlx OFF와 실제 @@datadir/socket을 확인한 뒤 사본의 DROP DATABASE를 실행했습니다. 기존 서버와 학습자 DB는 사용하지 않았습니다.</p>
 <p>PyMySQL 1.1.2의 별도 writer/observer는 autocommit이며 transaction은 명시 START TRANSACTION으로 시작했습니다. observer는 READ COMMITTED이고 가격 UPDATE 중9700을 읽었으며 writer는9701을 읽었습니다. ROLLBACK 뒤 양쪽9700입니다. 추가 DDL 실험에서는 CREATE 전/후 독립 observer의 marker 조회를 비교했고, ROLLBACK 뒤 marker는 writer, 새 테이블 존재는 information_schema로 확인했습니다.</p>
 <p>추가 r03_extra 테이블의 NULL·UNIQUE·BOOLEAN·CASCADE·SET NULL·키 폭·시간대 조건은 원래 schema의 선언과 구분합니다. 원래 subscription.auto_renew에는0/1 CHECK가 없어2 UPDATE가 통과했으며 해당 변경은 롤백했습니다. 원문 예상 가격 오류3819도 실행했습니다.</p>
 <p>길이 접두사2바이트는 공식 문서의 규칙입니다. 이번 CHAR_LENGTH/OCTET_LENGTH 관측은 문자·payload 길이이며 물리 레코드·디스크 크기 계측이 아닙니다. UNIQUE 키 폭은 page16KiB·DYNAMIC·utf8mb4 조건의 DDL 결과입니다. HTTP·Java/JPA·Docker·쿼리 속도·실제 학습자의 이해도는 검증하지 않았습니다. GPG 서명은 확인하지 않았고 공식 목록 MD5 일치와 파일 SHA만 기록했습니다.</p>
 ${sources.map(([label,file])=>{const raw=fs.readFileSync(new URL('../../docs/design/r03-2026-10-20/'+file,import.meta.url),'utf8');let text=raw;try{text=JSON.stringify(JSON.parse(raw),null,2);}catch{}return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;}).join('')}
 </details>`;
}
