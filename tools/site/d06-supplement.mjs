import fs from 'node:fs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const base = new URL('../../docs/design/d06-2026-10-21/', import.meta.url);
export function renderD06Supplementary() {
  const source = JSON.parse(fs.readFileSync(new URL('source-proof/source.json', base), 'utf8'));
  const fixture = JSON.parse(fs.readFileSync(new URL('source-proof/fixture-files.json', base), 'utf8'));
  const files = [
    ['원문264줄 전체 Markdown', '../../knowledge/D06-deployment-concepts.md'],
    ['원문·추가 로컬 실험·종료 범위', 'source-proof/README.md'],
    ['원문8block SHA', 'source-proof/source.json'],
    ...source.originalBlocks.map(block => [`원문 block${block.block} 전체 · ${block.language}`, 'source-proof/original/' + block.file]),
    ...fixture.map(row => ['명시적 추가 fixture 전체 · ' + row.file, 'source-proof/' + row.file]),
    ['추가 앱·Python router·종료·별도 H2 관찰기 전체', 'source-proof/run-proof.py'],
    ['최종 CHECK20·모델3 전체', 'source-proof/execution.json'],
    ['수정하지 않는 frozen 비교 기준 전체', 'source-proof/checkpoints/expected-execution.json'],
    ['실제 명령·6 Boot JVM·HTTP 원자료 전체 JSON', 'source-proof/runtime-last.json'],
    ['원문 YAML·A JAR nested library 실측 목록', 'source-proof/jar-observations.json'],
    ['추가 fixture8개 SHA', 'source-proof/fixture-files.json'],
    ['runtime49·별도 proof H2 1개 해석 파일 SHA', 'source-proof/dependencies.json'],
    ['main fresh 전체 재현 로그', 'source-proof/replay.log'],
    ['독립 temp 전체 frozen·실물 JAR·종료 검토', 'source-proof/independent-replay.json'],
    ['공식 문헌 메인 검증과 한계', 'research/main-verification.json'],
  ];
  return `<details class="d06-supplement"><summary>원문·추가 로컬 실험 전체 코드와 검증 근거</summary>
    <p>원문264줄8block의 Actuator Groovy·YAML20s·Java25/8080 명령을 보존했습니다. 원문에는 앱 Java가 없으므로 Java/bootstrap/router/schema는 모두 추가 fixture8개입니다. 실제 Java21.0.6·Wrapper9.8.0·Boot4.1.1/FW7.0.9/Tomcat11.0.24·별도 H2 2.4.240을 사용했습니다. runtime49+proofRuntime H2 1=50개 해석 파일과 각 Boot JAR nested lib42개는 다른 집합입니다. H2 driver는 앱 JAR에 없으며 SchemaProof만 별도로 H2에 연결했습니다. 실제 CHECK20개·모델3개는 main fresh·독립 temp에서 전체 frozen과 일치했습니다.</p>
    <p>A는21988506bytes·B는21988510bytes이며 full SHA는 원자료에 보존합니다. B는 version/default business property를 바꾼 별도 fixture이고 A를 재빌드하지 않았습니다. 동일 A 사본의 local/stg는 한 Mac의 profile 이름이지 실제 환경 승격이 아닙니다. 같은 demo.greeting의 CLI/system/environment/profile/base 우선순위를 관찰했고 profile의 파일 선택 역할과 구분합니다. feature 비교는 profile도local/stg로 다릅니다. 두 시작 설정의 flag가 다르고 endpoint 분기만 flag를 사용하는 것이며 유일 변수flag 시험이나 hot runtime toggle이 아닙니다.</p>
    <p>같은 B의 global health/readiness는UP/200인데 business-ok=false로 제어한 business는500/FAILED였습니다. Boot 자체 장애나 DB 오류를 만든 것이 아닙니다.</p>
    <p>별도 blue A1.0.0에서는 REFUSING_TRAFFIC 발행 뒤 global health/readiness503·liveness200·직접 business200을 구분했고 own router guard503/bypass200과 재시작 없는 ACCEPTING_TRAFFIC 복원을 관찰했습니다. readiness 신호만으로 모든 직접 HTTP를 차단하는 것은 아닙니다.</p>
    <p>Python loopback router의 A200→B500→A200과 고정10요청7blue200/3green500 뒤 fixture 정지 규칙으로blue200 복귀를 확인했습니다. B 직접 응답은 여전히500입니다. 확률 표본·추천 운영 비율·무중단/SLA·실제 LB/DNS/Kubernetes 가중치를 검증한 것이 아닙니다.20s drain은 own 요청 진입 후 SIGTERM·graceful 시작·gate 대기를 관찰하고 release 뒤200을 받았습니다. 별도 CLI1s·미해제 gate는completed200=false였습니다. raw 실패 유형을 모든 플랫폼의 고정 응답으로 일반화하지 않습니다.</p>
    <p>별도 SchemaProof는 autoCommit=true·row1의 full_name 실제값 Ada  Lovelace(중간공백2개·길이13)를 수동given Ada/family Lovelace로 backfill했습니다. expand 뒤 old SELECT는13을 유지하고 contract의옛컬럼 제거 뒤42S22였습니다. down DDL과 한 공백concat의 Ada Lovelace는길이12이며 원본과 같지 않습니다. 화면의 Ada··Lovelace/Ada·Lovelace에서 ·는공백1개이고 raw 실제값도 보존합니다. 새 컬럼 NULL 별도SELECT·보편 이름 파싱·Flyway/MySQL·온라인DDL·App A/B의 DB 접속 실험은 아닙니다. row1은 연결 닫기 전 COUNT이고 ownConnectionClosed는 이후 시점입니다.</p>
    <p>관측 종료 후 Boot HTTP JVM6개는 모두SIGTERM143이고 HTTP6+router1의7port가 닫혔습니다. 별도 단발 SchemaProof는exit0으로 연결을 닫았습니다. 모든 JVM이6개이거나 모두exit0이라는 뜻은 아닙니다. 기존 서비스·별도 학습 preview의 종료로 확대하지 않습니다. 조직 환경·승인/freeze/release·Rolling 용량·플랫폼 운영 책임·외부 부작용 보상·보편 canary confidence는 모델3개이며 PASS가 없습니다. 원문 전체 구현·실제 운영 배포·학습자 이해·전수 pixel parity 완료를 주장하지 않습니다.</p>
    ${files.map(([label, file]) => { const raw = fs.readFileSync(new URL(file, base), 'utf8'); let text = raw; try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 원문·코드·로그 문자열 보존 */ } return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`; }).join('')}
  </details>`;
}
