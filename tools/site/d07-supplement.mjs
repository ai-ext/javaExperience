import fs from 'node:fs';
import { readHistoricalSource } from './learning-source-baseline.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const base = new URL('../../docs/design/d07-2026-10-21/', import.meta.url);
export function renderD07Supplementary() {
  const source = JSON.parse(fs.readFileSync(new URL('source-proof/source.json', base), 'utf8'));
  const fixture = JSON.parse(fs.readFileSync(new URL('source-proof/fixture-files.json', base), 'utf8'));
  const files = [
    ['실행 당시 원문300줄 사본 · 2026-10-21', null],
    ['원문 Java·한정된 native·미실행 모델 범위', 'source-proof/README.md'],
    ['원문8block SHA', 'source-proof/source.json'],
    ...source.originalBlocks.map(block => [`원문 block${block.block} 전체 · ${block.language}`, 'source-proof/original/' + block.file]),
    ...fixture.map(row => ['fixture 전체 · 원문 Java/Dockerfile 사본과 추가 Gradle 설정 구분 · ' + row.file, 'source-proof/' + row.file]),
    ['추가 Java21 빌드·복사·HTTP 관찰기 전체', 'source-proof/run-proof.py'],
    ['최종 native CHECK10·모델6 전체', 'source-proof/execution.json'],
    ['미실행 분류·책임 모델6 원본 JSON', 'source-proof/models.json'],
    ['변경하지 않는 frozen 전체 비교 기준', 'source-proof/checkpoints/expected-execution.json'],
    ['실제 JAR·명령·두 own JVM·4 HTTP 원자료 전체 JSON', 'source-proof/runtime-last.json'],
    ['fixture4개 SHA', 'source-proof/fixture-files.json'],
    ['해석 dependency39개 SHA', 'source-proof/dependencies.json'],
    ['main fresh 전체 재현 로그', 'source-proof/replay.log'],
    ['독립 temp 전체 frozen·원문·실물·종료 대조', 'source-proof/independent-replay.json'],
    ['공식 문헌 메인 검증·연구 범위 정정·한계', 'research/main-verification.json'],
  ];
  return `<details class="d07-supplement"><summary>원문·실제 로컬 관측·미실행 모델 전체 근거</summary>
    <p>아래 실행 기록과 원문 사본은 2026-10-21 기준입니다. 현재 환경 안내는 설명 읽기에서 확인하며, 실행 당시 사본과 구분합니다.</p>
    <p>D07에는 원문 Java가 있습니다. 원문300줄8block와 Java/Dockerfile을 byte 그대로 보존하고 원문 Java를 추가 Java21.0.6·Gradle9.8.0·Boot4.1.1/FW7.0.9/Tomcat11.0.24에서 실행했습니다. 원문 Java25·Dockerfile·컨테이너 명령은 미실행입니다. fixture4개는 원문 Java/Dockerfile 사본2개와 추가 Gradle 설정2개입니다. 원문 두 class는 target21/major65이며 dependency39개와 JAR nested lib34개는 다른 목록입니다.</p>
    <p>실제 JAR d07-native-proof-1.0.0.jar는19902934bytes이며 full SHA·manifest·class bytes와 동일 사본을 대조했습니다. local-a/app.jar/local-b/app.jar와 local-a/b는 관찰기 별칭으로 실제 JVM 시스템 이름이나 profile이 아닙니다. 명시 profile 선택은 없었고 한 Mac의 서로 다른 loopback 임시 port에서 두 own HTTP JVM을 실행했습니다. CHECK10개·미실행 모델6개는 main fresh와 독립 temp에서 전체 frozen과 일치했습니다.</p>
    <p>HTTP4건은 A/health200ok·B/health200ok·A의 미등록/actuator/health404·A 종료 뒤 직접B/health200ok입니다. 원문 literal ok는 기본 HTTP 프로브 응답으로 사용할 수 있지만 DB·node·region 진단이나 Actuator UP가 아닙니다. Actuator dependency와 등록 route가 없으며 실제404 본문은 application/json이지 text/plain NotFound 본문이 아닙니다. A 종료 뒤 B로 직접 요청한 것이지 자동 LB failover·VM/AZ/HA 실험이 아닙니다. 두 추적 HTTP JVM은 자체SIGTERM143·PID/port 종료·kill fallback 없음이고 별도 version/build 명령은 exit0입니다.2개를 모든 Java 실행의 분모로 일반화하지 않습니다.</p>
    <p>모델28상태는 executed=false인 분류·책임 JSON 또는 미실행 원문 Dockerfile/bash 발췌이며 PASS를 붙이지 않습니다. NIST5특성/3서비스/4배치와 위치·전용성·운영 주체를 나눕니다. Azure broad Applications Shared는 고객이 공급자 제품 소스를 운영한다는 뜻이 아닙니다. 고객 설정·자체 확장 코드가 있으면 그 코드·access/data와 공급자 제품 운영을 구분합니다. VM 생성 서비스 제공과 고객의 생성 요청·VM 구성, PaaS scaling 서비스와 고객 정책 설정도 별개입니다.</p>
    <p>같은 Linux host의 일반 container kernel 모델과 Mac의 Docker Desktop Linux VM·Darwin 경계, managed node/Fargate 같은 서비스 옵션을 구분합니다. EXPOSE는 metadata이고 publish와 다릅니다. wildcard COPY가 다중 source이면 directory 목적지 조건을 확인해야 하며 이 Dockerfile을 실제 build한 결과는 없습니다. 일반적인 AZ·복제·세션·복구는 별도 설계/검증이며 두 local JVM으로 인증하지 않습니다.</p>
    <p>S3 flat 예시는 general purpose bucket으로 한정합니다. directory bucket은 hierarchical namespace이며 모든 S3를 flat이라고 하지 않습니다. prefix는 UI 장식만이 아니라 List API 검색·설정된 정책 조건에도 쓰이고 OS directory와는 다릅니다. Azure HNS의 directory semantics/atomic operations를 모든 POSIX 보장으로 확대하지 않습니다. 제품 비교표는 유사 기능 예이며 완전 API/SKU/책임 호환·요금 인증이 아닙니다. Usage×Rate는 사용기반 성분의 단순 예시로 fixed/tiered/commitment·남은 팀 운영비를 포함한 TCO 공식이 아닙니다. 구매 옵션 자체가 autoscale을 구현하지 않습니다.</p>
    <p>7R은 조직마다 평가할 선택지이며 모든 조직의 필수 순서가 아닙니다. Relocate는 같은 platform/app 구조를 보존한 환경·region·account 이전 범위로 읽고 OS/runtime 변경을 섞지 않습니다. Rehost가 항상 최속·자동 운영 부담 감소라는 결론이나 실제 가격·할인·절감액·성능을 만들지 않습니다. cloud/VM/container/AZ/DB/가격·약정·실제 migration을 실행하지 않았고 UI·학습자 이해·전수 pixel parity까지 완료했다는 뜻도 아닙니다. 연구의 기본 설정 조회만으로 Luna 접근 불가라던 추정은 메인의 명시 override와 성공 실행 기록으로 정정됐으며 원본 보고서·frozen은 바꾸지 않았습니다.</p>
    ${files.map(([label, file]) => { const raw = file === null ? readHistoricalSource(new URL('../../', import.meta.url), source.source) : fs.readFileSync(new URL(file, base), 'utf8'); let text = raw; try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 원문·코드·로그 문자열 보존 */ } return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`; }).join('')}
  </details>`;
}
