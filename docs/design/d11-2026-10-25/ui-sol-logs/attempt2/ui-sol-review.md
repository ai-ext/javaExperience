# D11 UI 독립 Sol 검토 — attempt 2

**spec PASS → quality FAIL · C/I/M 0/1/0.** HEAD는 `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`다. 최초 attempt1 FAIL 보고와 raw는 보존했다.

기존 두 지적은 해소됐다. CORS 기본 DOM에 실제 서버 허용 조건과 현재 case의 false/true, Origin/method/header 및 wildcard/credentials 조건이 나타난다. 하네스에는 독립 38상태 값·bind·codeKind·evidenceKind·source/active 기대값, 모든 상태의 실제 복사payload, 정확한 A→B→sameA와 양방향 역순 완료 검사가 추가됐다. 이 대조 결과를 먼저 spec PASS로 기록한 뒤 quality를 실행했다.

**Q1 Important — 실제 화면 출처 라벨의 의미상 회귀를 검사하지 않는다.** /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-d11-learning.mjs:373의 전수 검사는 data의 codeKind/evidenceKind만 대조하고 실제 `data-d11-code-kind`/`data-d11-evidence-kind` 표시를 독립 기대값과 비교하지 않는다. /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d11-learning.js:115의 CORS 라벨을 `Python fixture 서버 응답 조건 · Chrome 결과 별도`에서 `원문 Spring Security Java 실제 실행`으로 바꾼 메모리 변이가 전체 test-d11-learning을 exit 0으로 통과했다. 현재 제품 라벨은 올바르며, 이 지적은 잘못된 실행 출처를 화면에 표시하는 회귀를 놓치는 검사 공백이다. 38개 상태의 실제 두 라벨을 독립 기대표로 검증하고 해당 변이의 assertion 실패를 확인해야 한다.

정상 제어군과 D11/P09/reader/dark 검사는 모두 exit 0이었다. 메모리 변이9개 중 결과 owner·bind owner·denied 조건 false→true·source range·native evidenceKind·generation guard·request success/rejection guard 등8개는 실제 assertion 실패로 검출됐다. 화면 source 라벨 변이1개가 생존했다. 변이는 esbuild onLoad로 메모리에만 주입한 뒤 별도 Node 프로세스로 실행했으며 디스크 제품 소스는 고치지 않았다. 별도 Git HEAD 기반 W15 literal 검사에서 현재 source는 일치하고 잘못된 문구 재유입 변이는 검출됐다.

입력9,753개 SHA 전후 변경은0개다. 원문·기존 source/controller·proof/raw·이미지·manifest를 수정하지 않았다. 실제PC/CUA·build·외부CLI·리서치·다른LLM·Git조작은 수행하지 않았다. 실제PC 및 OS clipboard 수용 검증은 부모의 별도 관문이다.

상세 JSON: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-review.json

spec/quality/raw: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/attempt2/

최초 FAIL 보존: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-sol-logs/attempt1/ui-sol-review.json
