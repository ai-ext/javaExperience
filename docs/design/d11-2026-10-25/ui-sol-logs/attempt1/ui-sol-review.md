# D11 UI 독립 Sol 검토 — attempt 1

**spec FAIL · C/I/M 0/2/0. quality는 spec 관문 때문에 실행하지 않았다.** HEAD는 `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`다. 제품 코드는 수정하지 않았다.

1. **I1 — CORS 핵심 허용 조건이 접힌 출처 안에만 있다.** `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d11-lesson-data.mjs:114` 이후의 denied/allowed 기본 코드는 모두 `browser_fixture.py:88-92`의 동일 client 요청이다. 성공·실패를 가르는 Origin 일치, `Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`의 실제 조건은 `224-230`의 source fragment로만 존재하며 기본 닫힌 details에 들어간다. wildcard 상태도 기본 코드에는 `credentials: include`만 있고 응답 허용 헤더는 닫혀 있다. SPEC의 핵심 판단 기본 노출 계약을 충족하지 못한다. 요청과 서버 허용 조건을 기본 DOM에서 정확히 비교할 수 있게 하고 발췌·active·복사를 함께 갱신해야 한다.
2. **I2 — 하네스가 38개 상태의 정확값·복사payload를 검사하지 않는다.** `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-d11-learning.mjs:237`의 전수 loop는 이미지·제품 데이터와 같은 code·active·zoom만 확인한다. 표시 values 검사가 없고 copy를 누르지 않는다. 실제 payload assertion은 `200-207`의 other-unscoped 한 상태뿐이다. native raw의 고정 기대값은 검사하지만 각 state의 정확한 값·배열·bind·표시 DOM에 완전히 연결되지 않는다. `260-264`의 경로도 own→other-unscoped→other-scoped→other-unscoped로 원래 A에 복귀하는 A→B→A 검사가 아니다. 38상태의 독립 기대표·실제 복사payload·원래 A 복귀를 추가해야 한다. 변이 검증은 spec 통과 뒤 별도 수행한다.

독립 JSDOM 재현은 질문12/상태38, denied/allowed code 완전 동일, 모든 CORS 상태의 기본 code에 응답 허용 조건 없음, source details 기본 닫힘을 기록했다. `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/attempt1/01-spec-observations.json`에 38개 state의 현재 값·bind·코드·출처·이미지·focus 목록도 남겼다.

현재 소스로 `npm run test:d11`을 독립 실행해 exit 0을 확인했다. 이 통과는 위 명세 공백을 해소하지 않는다. 해당 검사의 원문 MD SHA, source subtree/legacy·고유ID·reader 전환 검사는 통과했다. 기존 이미지 검토의 선정14 PASS는 이미지에 한정된 이전 승인으로 읽었다. PC 시각 수용·D11 전체·134 전체 완료로 확대하지 않는다.

입력 2,189개 SHA를 probe·재실행 전후 대조한 결과 변경 0개다. 첫 읽기 전용 test:d11 뒤 시작 fingerprint를 수집했고 그 이후 독립 실행을 비교했다. 제품·raw·assets·manifest·source는 수정하지 않았다. CUA·외부CLI·새 리서치·다른 LLM·Git 조작을 수행하지 않았다. build는 부모의 W15 조사와 충돌하지 않도록 수행하지 않았다.

검토 JSON: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-review.json`

로그: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/attempt1/`
