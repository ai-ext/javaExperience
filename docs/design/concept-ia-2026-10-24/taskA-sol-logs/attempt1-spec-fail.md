# Task A 독립 검토 — 최초 입력

- 검토 기준: `119a8c5cb3a7fbf328ffb2db7412ec4de2e0449b` 위의 최초 Task A 미커밋 변경.
- 작업 공간: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night
- 입력 CSS SHA-256: `da667857cf869d5a955102c137168ec26a8df8a1e947f04aa35335c76b958144`.
- 범위: PC 다크 공통 기반만. Task B/C와 전체 개념 학습 완성도는 대상 밖이다.

## 1. 명세 검토: FAIL — C0 / I1 / M0

**TASKA-I1 (Important): 기존 고정 light 제목과 보충 원문 패널이 남는다.**

LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-learning.css:5, LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/r03-learning.css:5, LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/v04-learning.css:5는 실제 생성 HTML의 핵심 질문 H2에 `color:#142943`를 명시한다. 최초 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/knowledge-dark.css에는 이를 우선하는 heading 교정이 없다. 기존 자식의 명시 color는 부모의 dark 전경 상속으로 바뀌지 않는다. 실제 HTML과 stylesheet 순서를 사용한 정적 JSDOM 조회에서 세 H2 모두 `rgb(20,41,67)`을 유지했다. 선언된 `#0c111b` 배경과의 수학적 대비는 **1.285:1**이다. 또한 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-learning.css:24의 `.s09-legacy`는 `#fff` 배경을 유지했다.

재현: `node LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskA-sol-logs/contrast-probe.cjs`.
근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskA-sol-logs/contrast-probe.json.
이 프로브는 정적 cascade 근거이며 브라우저 렌더·시각 검증이라고 부르지 않는다.

최소 수정: dark stylesheet의 기존 scope를 유지하고 실제 intro heading/paragraph, legacy/output 패널의 고정 light 선언을 충분한 selector 강도로 교정한다. 원문·코드·이미지와 모바일 분기는 수정하지 않는다. CSS 전체를 미러링하는 테스트를 요구하지 않는다. 최종 빌드 후 원문/scope 회귀와 실제 PC 색·대비 확인이 필요하다.

## 2. 확인된 통과 항목

- 홈1·목록1·상세134의 논리136 surface와 README 홈 alias를 포함한 물리137 HTML이 정확히 대상 집합과 같다. 비대상 변경은 없다.
- 137 HTML에서 추가 표식2개와 dark link를 제거하면 HEAD 바이트와 전부 같다. 원문·코드·앵커·기존 body class 및 JS 의미 변경이 없다. CSS hash12도 실제 초기 CSS 바이트와 일치한다.
- 개념 Markdown135·src17은 HEAD와 같다. 리뷰 시작 시점의 추적 design 증거·비HTML 개념 원문·src·기존 dirty AGENTS/RESUME를 포함한 6,129개 보호 파일도 바이트가 같다. 과거 proof1366/초기 리뷰24를 새 개수로 재정의하지 않았다.
- root `:has()` override는 기존 light root보다 구체적이고, body에 명시된8개 토큰은 상속/fallback 의존 없이 제공된다. 홈·목록의 기존 body 변수도 scope와 후순위 규칙으로 교정한다.
- 의존성·모바일/라이트 분기·filter·불필요한 원문/renderer 리팩터링 추가가 없다.
- theme·home·catalog·navigation 4개 명령 모두 exit0. 결과 로그는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-ia-2026-10-24/taskA-sol-logs에 있다.
- 별도 fixture baseline은 exit0, HTML scope 제거·body scope 제거·마지막 CSS 순서 변경·CSS 누락·비대상 scope 오염·원문 Markdown 변경·code 변경·기존 id 삭제의8개 변형은 모두 exit1로 차단됐다. 제품 파일에 변형하지 않았다. fixture는 검사 후 제거했다.

## 3. 코드 품질 검토: NOT RUN

명세 단계가 실패했으므로 순차 관문에 따라 품질 검토를 수행하거나 승인하지 않았다. 등록·원문 테스트 통과는 색상/가독성 명세 통과를 뜻하지 않는다. 메인은 실제 PC 검증에서 동일 문제와 별도 홈/P16 문제를 확인하고 수정 작업을 시작했다고 전달했다. 이 결과는 최초 입력에만 적용하며 수정본은 fresh spec 통과 후 quality 검토가 필요하다.

브라우저·외부 CLI 조사·DB/Java 실행·제품 코드 수정·commit/push/PR을 수행하지 않았다. reviewer는 제품 build도 재실행하지 않았다. 이는 생성물을 쓰지 않는 검토 범위를 지키기 위한 것이며 실제 생성 HTML의 독립 바이트 대조로 검증했다. reader 구현이나 전체134 고유 학습 장면의 완성을 승인하는 결과가 아니다.
