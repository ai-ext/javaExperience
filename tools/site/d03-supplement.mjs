import fs from 'node:fs';

const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderD03Supplementary() {
  const files = [
    ['원문·추가 실행 범위와 재현 안내', 'source-proof/README.md'],
    ['원문332줄·6개 fence SHA', 'source-proof/source.json'],
    ['실제 CHECK19·별도 모델3 전체', 'source-proof/execution.json'],
    ['원문 그대로 TaskController·ApiErrors', 'source-proof/fixture/java/example/tasks/TaskExample.java'],
    ['추가 TasksApplication bootstrap', 'source-proof/fixture/java/example/tasks/TasksApplication.java'],
    ['추가 Java21·BOM·springdoc·컴파일 설정', 'source-proof/fixture/build.gradle'],
    ['추가 HTTP 관찰기 전체', 'source-proof/run-proof.py'],
    ['실제18 HTTP·두 JVM·UUID·생성 명세 원자료', 'source-proof/runtime-last.json'],
    ['추가 fixture4개 SHA', 'source-proof/fixture-files.json'],
    ['실제 의존성60개 SHA', 'source-proof/dependencies.json'],
    ['첫 offline 실패와 동일 버전 의존성 확보 기록', 'source-proof/attempt-notes.json'],
    ['독립 temp 재현·전체 frozen 대조', 'source-proof/independent-replay.json'],
    ['공식·규격 메인 대조와 확인 한계', 'research/main-verification.json'],
  ];
  return `<details class="d03-supplement"><summary>원문·추가 실험 전체 코드와 실제 검증 근거</summary>
    <p>원문332줄6fence와 완전한 TaskController·ApiErrors Java를 바이트 그대로 보존했습니다. 원문이 Initializr에 있다고 가정한 bootstrap과 Java21/Gradle9.8.0/BOM4.1.1/-parameters 설정은 추가 실험입니다. 실제 Java21.0.6·Boot4.1.1·Spring7.0.9·Tomcat11.0.24·springdoc3.1.1, 의존성60개·fixture4개 SHA를 기록했습니다. 새 loopback/port0에서18 HTTP 요청과19 CHECK를 관찰했으며19개 독립 실험이라는 뜻은 아닙니다. main·독립 temp 재현은 모델3개까지 전체 frozen과 일치했습니다.</p>
    <p>실제 POST201·Location/body UUID 일치, 반복 GET200, 같은 추가 Idempotency-Key로도 별도 UUID 생성,404 Problem Details와 입력·변환·media·mapping 경계를 구분했습니다. T1/T2는 실행마다 생성한 실제 UUID의 설명 별칭이며 실제 URI가 아닙니다. 모두0인 UUID는 실제 없는 자원 요청 입력입니다. @NotBlank는 trim을 하지 않았습니다. 전체 UUID·시각·동적 port·PID와 원시 응답은 아래 원자료에만 남깁니다.</p>
    <p>라이브러리 springdoc3.1.1과 실제 생성 문서 OpenAPI3.1.0은 다른 값입니다. 실제 POST201과 문서의200 응답 불일치를 확인했으며 해당 CHECK의 PASS는 불일치 재현이지 계약 일치가 아닙니다. minLength1과 공백 길이3의 추가 predicate 비교는 전체 JSON Schema 검증이 아닙니다. Swagger302→HTML200은 HTTP 관측이며 브라우저 UI·JavaScript·try-it-out을 실행하지 않았습니다.</p>
    <p>첫 JVM에서 조회한 T1은 새 JVM에서404였고 자체 프로세스2개·port2개를 종료했습니다. 원문 메모리 map의 재시작 경계이며 DB rollback·migration·복제 시험이 아닙니다. 소비자 호환성은 Python 집합 모델, HTTP 의미와 전달 과정은 원문·문헌 모델입니다. 실제 소비자/Jackson 설정·원문 Java25/8080 전체 설정·실DB·인증/인가·분산 멱등 store·목록/페이지·JUnit/WebMvcTest·PR/CI·스테이징·실제 배포/운영 관측은 미실행입니다. 이번 보강을 원문 전체의 구현·검증 완료로 표시하지 않습니다.</p>
    ${files.map(([label, file]) => {
      const raw = fs.readFileSync(new URL('../../docs/design/d03-2026-10-20/' + file, import.meta.url), 'utf8');
      let text = raw;
      try { text = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* 소스·Markdown은 원문 문자열을 보존한다. */ }
      return `<details><summary>${escape(label)}</summary><pre><code>${escape(text)}</code></pre></details>`;
    }).join('')}
  </details>`;
}
