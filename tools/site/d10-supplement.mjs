import fs from 'node:fs';
const base = new URL('../../docs/design/d10-2026-10-21/', import.meta.url);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderD10Supplementary() {
 const read = path => fs.readFileSync(new URL(path, base), 'utf8');
 const source = JSON.parse(read('source-proof/source.json')), manifest = JSON.parse(read('source-proof/fixture-manifest.json')), raw = JSON.parse(read('source-proof/runtime-last.json'));
 const record = 'source-proof/records/replay/' + raw.run.split('/').at(-1) + '/';
 const files = [
  ['원문449줄 전체 Markdown','../../knowledge/D10-database-basics.md'],
  ['추가 SQLite 번역·원문/실행·시점/제품 경계','source-proof/README.md'],
  ['원문13block SHA','source-proof/source.json'],
  ...source.originalBlocks.map(row=>['원문 block'+row.block+' 전체 · '+row.language+' · 미실행','source-proof/original/'+row.file]),
  ...manifest.files.map(row=>['추가 fixture 전체 · '+row.file,'source-proof/fixture/'+row.file]),
  ['추가 관찰기 전체','source-proof/run-proof.py'],
  ['최종 실제27CHECK·미실행6모델 전체','source-proof/execution.json'],
  ['미실행 문헌 모델6 전체','source-proof/models.json'],
  ['변경하지 않는 frozen 비교 기준','source-proof/checkpoints/expected-execution.json'],
  ['실제 SQL/연결/시점 raw 전체','source-proof/runtime-last.json'],
  ['fixture9·runner SHA','source-proof/fixture-manifest.json'],
  ['최초 freeze 기록','source-proof/freeze-verification.json'],
  ['작성자 새 실행 전체 대조','source-proof/author-fresh-verification.json'],
  ['메인 새 실행 전체 대조','source-proof/main-fresh-verification.json'],
  ['메인 실제27PASS 전체 로그','source-proof/main-replay.log'],
  ['독립 사본 전체 재현과 자체 DB 재조회','source-proof/independent-replay.json'],
  ['raw SQL template/bindings/trace/시점 전체',record+'raw-sqlite.json'],
  ['실제 SQLite 관찰 전체',record+'observed.json'],
  ['미실행 모델 독립 정적 검토·교정 이력','model-review.json'],
  ['원문·기존 학습 경로 정적 대조','source-review-independent.json'],
  ['직접 Luna 공식 조사 원본 보고서','research/REPORT.md'],
  ['공식 출처24개','research/sources.json'],
  ['메인 공식28페이지·원자료 수치/문구 정정','research/main-verification.json'],
 ].filter(([,path])=>fs.existsSync(new URL(path,base)));
 return `<details class="d10-supplement"><summary>원문·SQLite 추가 관찰·미실행 문헌 모델 전체 근거</summary>
 <p>원문449줄13block(Mermaid4/SQL4/shell3/Kotlin1/properties1)을 보존했습니다. PostgreSQL18·MySQL8.4·Docker·Boot4.1.1/Java25/JDBC 앱은 미실행입니다. 추가 Python3.14.3/SQLite3.53.0의 별도 DB파일4개·연결5개·새0700 runtime만 사용했습니다. INTEGER PRIMARY KEY rowid alias/TEXT/NUMERIC affinity는 PG IDENTITY·VARCHAR 길이·TIMESTAMPTZ·NUMERIC(12,2) 정밀도 검증이 아닙니다. 원문 MySQL block11에는 FK/CHECK 선언이 없습니다.</p>
 <p>native27CHECK는 고유 assertion ID이며 독립27실험이나 전체44상태 PASS가 아닙니다. native22·모델18·원문4상태를 구분합니다. 미실행 모델6에는 PASS를 붙이지 않습니다. 메인 fresh와 독립 사본에서 전체 frozen을 대조했으며 작성자의 모델0 probe와 freeze 덮어쓰기 거부를 별도로 보존합니다.</p>
 <p>추가 수강 seed 학생2/과목1/분반2/신청1의13개 잘못된 쓰기를 실제 SQLite 오류명/확장코드로 거부하고 savepoint 뒤 전체 seed를 대조했습니다. 별도 nullable UNIQUE의 NULL2개와 required UNIQUE의 NULL/중복 거부는 학생 업무 키와 다른 toy입니다. 모든 연결에서 FK pragma1·foreign_key_check 빈값·integrity ok·close를 확인했습니다.</p>
 <p>고객1의 PAID125+75/PENDING50·고객2 CANCELLED25·고객3 무주문은 별도 commerce seed입니다. 원문 HAVING을 제거하고 COUNT(*)를 더한 추가 ON query는 1의2/2/200과 2·3의각1/0/0입니다. WHERE PAID 및 원문 최종 HAVING 번역은 고객1만 남깁니다. 고객 날짜 필터는 c.created_at이며 집계에 주문/결제 시각 필터는 없습니다. EXISTS는 o.created_at만 제한하고 상태 조건이 없어 고객2의 최근 CANCELLED도 포함됩니다. 조회는501 추가 전이며 observer id정렬은 추가 규칙입니다. 별도501 입력 PENDING→PAID UPDATE rowcount1/재적용0/CANCELLED DELETE0·최종PAID는 SQLite cursor 관찰입니다.</p>
 <p>WAL의 같은 own파일 두 연결에서 미커밋 writer20/observer10→commit 뒤 새read20, reader snapshot20/다른writer30commit 뒤도20→reader종료후 새read30을 관찰했습니다. 다른 BEGIN IMMEDIATE가 timeout0 설정에서 SQLITE_BUSY5인 사례와 rollback 뒤양쪽30, stock5/qty3 순차guard rowcount1→0/최종2를 구분합니다. PG 행락/deadlock·다중 앱 부하/보편적 oversell 증명이 아닙니다. 실제 DB경로/phase/시점 marker는 raw에 보존합니다.</p>
 <p>별도512행·같은 SELECT/bind/order를 index 전후/drop/복원으로 대조했습니다. SQLite SCAN/TEMP B-TREE→SEARCH와 네 SELECT 동일14행을 확인했지만 속도·물리 scanned rows·I/O·PG cost/ms/EXPLAIN ANALYZE를 측정하지 않았습니다. raw tuple의216/51은 해석하지 않습니다. cached_statements=0은 schema 변경 후 prepared EQP 재사용을 피하는 관찰 설정이며 index 강제 힌트가 아닙니다.</p>
 <p>raw wrapper SQL688행과 trace callback688항목·시점 marker4개는 서로 다른 기록 종류입니다. 같은 숫자를 네트워크 wire SQL 수나 물리 I/O 계측으로 부르지 않습니다. 원문에는 Java 앱 source가 없고 Kotlin 설정과 properties가 있습니다. 풀·replica·sharding·NoSQL·PG/MySQL 격리·운영 RPO/RTO는 문헌 모델이며 실제 서비스를 조작하지 않았습니다. R03/R04의 이전 MySQL 관찰이나 practice API 검증을 이 toy로 승계하지 않습니다.</p>
 <p>직접 Codex gpt-6-luna/OpenAI 공식 조사와 메인28페이지 검증을 대조했습니다. raw source-check의18533은 Unicode문자 수이고 실제 UTF8은31008bytes입니다. REPORT의 “그이후 결제”는 주문 날짜 조건으로 해석하지 않으며, MySQL UNIQUE NULL 근거와 MongoDB schema validation은 메인이 확인한 별도 공식 URL로 보완합니다. 정규화의 모든 후보키·prime attribute 조건은 실제 열어 본 UTA 강의노트에 근거합니다. 전체 pixel·학습자 이해·모든 원문 장면 완료를 인증하지 않습니다.</p>
 ${files.map(([label,path])=>{const raw=read(path);let value=raw;try{value=JSON.stringify(JSON.parse(raw),null,2);}catch{/* 원문·실제 코드·로그 개행 보존 */}return `<details><summary>${escape(label)}</summary><pre><code>${escape(value)}</code></pre></details>`;}).join('')}
 </details>`;
}
