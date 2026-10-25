# 기존24개 개념 문서 감사 · 2026-10-22

기준 제품 버전은 `4b0493af52b1a06decca909d6bf9a8b6f9610686`이다. **24개를 모두 감사했고, 전체 문서 완료 판정은 0개다.** 자동검사 통과와 학습 범위 완성은 다르다.

수정 전 Sol high review의 초기 판정은 needs_completion21 / needs_fix3이며, 당시 품질 finding은 important4 / minor9 / critical0이었다. 문서별 원문 의미 단위 합은1488개(covered535/partial640/missing170/unrun143)이며, 고유 개념 수나 완성률이 아니다. 초기 판정과 finding은 원래 review.json에 보존한다.

최신 메인 실행 기록 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/main-existing24.log](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/main-existing24.log>)은 기존24개 관련 npm 검사 24/24 통과를 기록한다. [SUMMARY.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/SUMMARY.json)과 [summary-validation.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/summary-validation.json)의 최신 `--require24` 집계도 historicalPassed24 / currentPassed24 / stale0, review24/24, validation errors0이다.

## 중요4건의 수정 후 현재 상태

각 행의 초기 needs_fix는 수정 전 전체 문서 review.json의 판정이다. 수정 후 bounded priority finding 상태는 별도 Sol 검토와 메인 검증을 반영한다. 네 수정의 독립 검토는 spec pass 후 quality approved, critical/important/minor 신규 finding 모두 0이다. 이는 네 수정에 한정한 승인이고, 각 전체 문서의 판정·완료를 다시 쓰지 않는다.

| task / finding | 수정 전 전체 review 판정 | priority 수정 후 상태 | 메인 브라우저 근거 |
|---|---|---|---|
| task10 / R03-F01 숫자 범위 | needs_fix (초기 review) | 수정 완료 · Sol spec/quality 승인 · 메인 24 하네스 통과 | [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task10/browser-desktop.json](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task10/browser-desktop.json>) · [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task10/browser-mobile.json](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task10/browser-mobile.json>) |
| task10 / R03-F02 FK 그림 | needs_fix (초기 review) | 수정 완료 · Sol spec/quality 승인 · 메인 24 하네스 통과 | 같은 task10 desktop/mobile 근거 |
| task11 / R04-Q01 DML 복사 문맥 | needs_fix (초기 review) | 수정 완료 · Sol spec/quality 승인 · 메인 24 하네스 통과 | [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task11/browser-desktop.json](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task11/browser-desktop.json>) · [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task11/browser-mobile.json](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task11/browser-mobile.json>) |
| task20 / D06-Q1 Local/Dev 그림 | needs_fix (초기 review) | 수정 완료 · Sol spec/quality 승인 · 메인 24 하네스 통과 | [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task20/browser-desktop.json](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task20/browser-desktop.json>) · [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task20/browser-mobile.json](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after/tasks/task20/browser-mobile.json>) |

메인 browser-after는 R03/R04/D06 desktop·mobile 6개 결과, 총188상태 행, 복사 payload 6/6 일치, 각 errors 배열 비어 있음을 기록한다. 이는 해당 세 문서의 수정 후 화면 결과이며, 나머지21문서의 재검증이나 전체134문서 완료를 뜻하지 않는다. 근거 디렉터리는 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority/browser-after>)다.

원문·기존 실행 기록·frozen을 고쳐 검사를 통과시키지 않았다. 수정 사양, 수정 로그, 변환 provenance는 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority](<LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/repairs/priority>)에 있다. 초기 review.json 판정은 그대로 보존한다.

## 문서별 초기 감사 판정 (수정 전 review.json 보존)

| task | 문서 | 초기 판정 | covered / partial / missing / unrun | 품질 finding C / I / M |
|---|---|---|---|---|
| [task1](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/review.md) | P09 | needs_completion | 26 / 12 / 0 / 3 | 0 / 0 / 2 |
| [task2](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task2/review.md) | P04 | needs_completion | 12 / 14 / 0 / 4 | 0 / 0 / 0 |
| [task3](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/review.md) | P16 | needs_completion | 18 / 16 / 10 / 2 | 0 / 0 / 1 |
| [task4](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/review.md) | W09 | needs_completion | 7 / 27 / 15 / 1 | 0 / 0 / 0 |
| [task5](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task5/review.md) | P19 | needs_completion | 6 / 23 / 13 / 7 | 0 / 0 / 0 |
| [task6](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/review.md) | P20 | needs_completion | 18 / 17 / 12 / 3 | 0 / 0 / 0 |
| [task7](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/review.md) | S09 | needs_completion | 9 / 26 / 3 / 9 | 0 / 0 / 1 |
| [task8](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/review.md) | S08 | needs_completion | 14 / 27 / 9 / 13 | 0 / 0 / 0 |
| [task9](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/review.md) | W11 | needs_completion | 11 / 21 / 11 / 6 | 0 / 0 / 1 |
| [task10](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task10/review.md) | R03 | needs_fix | 10 / 24 / 9 / 2 | 0 / 2 / 0 |
| [task11](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task11/review.md) | R04 | needs_fix | 45 / 11 / 2 / 4 | 0 / 1 / 0 |
| [task12](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/review.md) | W15 | needs_completion | 18 / 22 / 7 / 2 | 0 / 0 / 0 |
| [task13](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task13/review.md) | V04 | needs_completion | 14 / 18 / 5 / 7 | 0 / 0 / 1 |
| [task14](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task14/review.md) | B01 | needs_completion | 10 / 26 / 8 / 12 | 0 / 0 / 1 |
| [task15](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task15/review.md) | D01 | needs_completion | 8 / 56 / 10 / 5 | 0 / 0 / 0 |
| [task16](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/review.md) | D02 | needs_completion | 16 / 31 / 10 / 7 | 0 / 0 / 1 |
| [task17](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task17/review.md) | D03 | needs_completion | 25 / 31 / 11 / 6 | 0 / 0 / 0 |
| [task18](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task18/review.md) | D04 | needs_completion | 33 / 45 / 4 / 4 | 0 / 0 / 1 |
| [task19](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task19/review.md) | D05 | needs_completion | 20 / 38 / 11 / 19 | 0 / 0 / 0 |
| [task20](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task20/review.md) | D06 | needs_fix | 32 / 48 / 8 / 5 | 0 / 1 / 0 |
| [task21](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/review.md) | D07 | needs_completion | 40 / 29 / 2 / 3 | 0 / 0 / 0 |
| [task22](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task22/review.md) | D08 | needs_completion | 58 / 24 / 5 / 6 | 0 / 0 / 0 |
| [task23](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/review.md) | D09 | needs_completion | 53 / 26 / 3 / 6 | 0 / 0 / 0 |
| [task24](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/review.md) | D10 | needs_completion | 32 / 28 / 2 / 7 | 0 / 0 / 0 |

## 기존 감사 기준의 브라우저와 하네스

초기 감사에서 메인은 전용 Chrome 탭으로 24문서의 신규 보강760상태를 desktop1672×819/mobile360×800으로 조작해1520행을 대조했다. 제목·질문·설명·출처·값·현재 코드·강조·이미지 로딩·접기 밖 핵심·문서 가로 넘침을 확인했다. P09의 집중 코드/토큰 강조와 초기 컴포넌트의 빈 줄 공백 표현을 명시적으로 구분했다. 코드 복사48회는 성공 표시 후 실제 payload를 읽었으며, 모바일 이전/다음과 원문 접근은24문서에서 확인했다. 첫 질문 대표48JPEG의 헤더/viewport/해시를 대조하고 메인이 실제48장을 열람했다. P09의 확대와 native가로pan15.5px는 대표 관측이다. 모든760상태의 캡처나 모든 legacy 조작/전수pixel/학습자 이해를 검증했다고 쓰지 않는다. 수정 후 task10/task11/task20 브라우저 결과는 위 priority 상태표의 `browser-after` 근거를 참조한다.

초기 P09 비교 가정·복사 비동기 대기·P04 모바일 DOM 대체·P16 이미지 decode 대기/legacy 원문 링크는 실패 관측과 확인 결과를 따로 남겼다. 반환 콘솔95개는 확장 출처이며 preview URL 관련0개다. 전체 브라우저 세션 무오류를 뜻하지 않는다. 메인 브라우저 근거는 infrastructure/browser-summary.json, 각 task의 browser-*.json/JPEG에 있다.

Luna high가 검사 하네스를 구현했고 Sol high가 처음4개, 다음1개 허점을 재현했다. 두 차례 수정 후21개 회귀가 통과했고 새 Sol의 계약 범위 spec→quality 승인을 받았다. 실행한 npm argv/HEAD/원문 SHA/코드 fingerprint/UTC/exit/raw를 task별 보존하며 실패·timeout·누락·변조를 pass로 합치지 않는다. npm 코드 자체의 OS sandbox는 아니다.

## 아직 남은 것

전체 원문의 선택 기준·예외·용어·운영 판단·직접 실습 연결이 문서별로 다르게 남아 있다. 각 review.json의 specReview.coverage와 remainingWork를 다음 구현 사양에 사용한다. 이미 있는 원문을 삭제하거나 모든 미실행 환경을 실제 실행한 것으로 쓰지 않는다. 이번 감사는 새 npm/JSDOM/보존 검사와 기존 native raw 대조이며 Java·MySQL·Redis·Prometheus 실험을 새로 재실행한 것이 아니다.

minor9개도 별도 남은 작업이다: P09 출처 줄/이미지 근거 검사, P16 강조 검사, S09 범위 밖 강조 인덱스, W11 지연 복사 상태, V04 준비 메타데이터, B01 표시 predicate, D02 완료 기록/진입 계수의 증명력, D04 원문 JAR 순서 표현이다. 중요4개 수정이 끝나도 이 항목들과 전체 범위 공백이 자동 해결되지 않는다.

## 전체134개 계획

LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/superpowers/plans/2026-10-22-concept-learning-cycle.md 와 이 폴더 TASKS.md/tasks.json에 task1~task134를 구분했다. 다음110개는 아직 새 구현하지 않았다. source 전문·의미 장면 사양→Luna high 구현→새 하네스→Sol high spec→quality→메인 실제 화면/보존→판정·로컬 커밋 순서다. 사용자 통합 전까지 push/PR/merge를 하지 않는다.

`PROGRESS.json`은 메인이 reviewed24·중요4건 해결·minor9건 잔여 상태로 갱신했다. SUMMARY.json은 초기 독립 판정을 보존하며, 수정 후 판정은 repairs/priority/sol-review.json과 browser-after/summary.json을 함께 본다.

최종 메인 체크: 중요4건 수정 후 전체24검사·build·audit:visual·audit:version-cards·audit:parity exit0. 3문서188상태와 복사6회 재관측, R04 전체·수동 SQL 각각2회 원문 일치. 초기 캐시 관측과 reload 후 결과를 구분해 보존했다. 새 인벤토리 항목은 미검토이며 페이지 전체 verified로 올리지 않았다.
