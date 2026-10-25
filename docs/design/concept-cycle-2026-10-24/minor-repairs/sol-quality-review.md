# minor9 독립 코드 품질 검토

판정: **bounded quality approve**. 미해결 Critical 0 / Important 0 / Minor 0. 기준 HEAD `a41846fc37607aa0db83e5fd99b8d0ce050acf79`. 검토시각 2026-10-24T13:17:11.060392+00:00.

승인 범위는 기존 minor9와 B01 검증 보강, D04 제목 focus/mobile scroll-margin 최소 수정의 코드 품질이다. 전체24·전체134·원문전체 완료 판정이 아니다. 최종 build·24 harness·audit·실제 browser 검증은 main의 별도 gate다.

초기 Important 1건을 재현해 수정 후 닫았다. B01 표시 code와 sourceFragments가 분리되어 `!` 누락을 놓쳤고, 첫 공백 정규화는 문자열 내부 공백도 지웠다. 현재는 표시/원문 동등성 및 양쪽 literal 검사를 결합했다. `!` 삭제·`!=` 반전·wrong matches 삭제·literal 공백 주입이 각각 의미 assertion으로 실패하고 정상은 통과한다. 초기 실패 증거는 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/initial-quality-finding.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/initial-quality-finding.json)에 보존했다.

| 항목 | 품질 판단과 독립 근거 |
|---|---|
| P09-M1 | 152줄 내용에 대한 독립 assertion으로 잘못된 행 번호 재유입을 검출한다. 원문 변경이 없다. |
| P09-M2 | 역사 PNG79항목/44고유를 유지하고 Git blob source SHA→manifest destination SHA→실제 JPG를 연결한다. 정상 test:jpg exit0. source/destination 해시·미등록·미존재 거부 검사는 기존 fresh spec 증거와 코드를 대조했다. |
| P16-Q1 | nonempty/정수/범위 validation과 DOM mark 텍스트 검사는 서로 다른 실패를 검출한다. []/[999] 및 renderer mark 제거 메모리 변이가 각각 요구 assertion exit1이다. property-out 핵심3행은 독립 기대값이 있다. |
| S09-Q01 | fetch-join active=[0,1]과 전체31상태 범위·DOM 강조를 검사한다. [999] 및 DOM mark 제거 변이가 각각 요구 assertion exit1이다. |
| W11-Q01 | render generation과 copy request ID를 성공·실패 양쪽에서 검사하며, 캡처한 code만 clipboard에 전달한다. scene/request 보호의 실패분기만 각각 제거한 변이는 stale reject/역순 completion assertion으로 exit1이다. 정상·실패수동선택, A→B→A, 최신실패 후 구성공을 기존 테스트가 검증한다. 전역 리팩터링이나 제품 테스트 옵션이 없다. |
| V04-Q01 | 공개 supplementary의 첫 설명과 첫 JSON을 최종 범위로 고정하고 source.json을 이전 준비 기록으로 명시한다. native9/Java28/JUnit22/facts32는 중첩 단위이며 Java21추가환경·TCcompile-only·Docker/SC/원문Java25 미실행과 구분된다. generated 검사 exit0, 역사 raw hash 불변이다. |
| B01-Q01 | sourceFragments의 같은 원문 파일·순서·표시 code와의 공백제외 동등성, 양쪽 string literal 내부 공백 없음 검사를 결합했다. !삭제/!=반전/wrong matches 삭제는 동등성 assertion exit1, 표시 literal 공백 주입은 literal assertion exit1이다. 정상 표시·강조·복사 exit0. 현재 두 샘플에 한정한 간단한 검증이며 일반 Java parser로 주장하지 않는다. |
| D02-Q01 | 완료 proxyRequests 증가0과 do_GET 진입 미계측을 전체 화면 표현·raw 필드 연결에서 분리한다. 실제 source의 Proxy AST 분리실행은 Fake/예외 upstream만 사용하고 서버를 시작하지 않는다. cwd=/tmp에서 generated·AST 단위검사 exit0이다. TLS/native 재실행이나 새 계측값으로 주장하지 않는다. |
| D04-Q1 | 원문 anchor/보존 본문을 유지하고 두 native button이 실제 scene/state/history를 바꾼다. jump 후 H3의 tabIndex=-1/focus/scrollIntoView를 확인했다. 정상 source/generated exit0 및 focus 호출 제거 변이의 키보드 focus assertion exit1. 모바일700px이하의 D04 title에만 scroll-margin-top112px을 추가했다. 실제 header/bbox·desktop/mobile 시각 확인은 main 담당이다. |

리뷰어는 제품 파일을 수정하지 않고 import hook/프로세스 메모리 변이를 사용했다. W11 실패분기 보호2개·P16/S09 active3개·DOM mark2개·D04 focus 제거는 요구 assertion으로 실패했다. B01 보강 후 operator/누락3개와 literal1개도 검출했다. D02 generated/AST는 `/tmp`에서 통과했다. 관련 npm8 전체를 반복하지 않고 fresh spec 증거와 필요한 검사만 대조했다. 제품 테스트 전용 옵션은 추가되지 않았다.

보존 대조: 기존 dirty 2개, historical proof 1,366개, 초기 review 24개, 원문 Markdown 135개, 서버 source 17개 모두 불일치0. 검토 snapshot은 기존35개와 D04 CSS를 합친36개다.

- 구조화 판정: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-review.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-review.json)
- 최종 snapshot: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/reviewed-snapshot-sha256.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/reviewed-snapshot-sha256.json)
- 보존 근거: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/preservation.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/preservation.json)
- 의미 검사: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/quality-probes.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/quality-probes.json) 및 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/final-probes.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/final-probes.json)

이 reviewer는 browser/native/DB/Java/TLS를 실행하지 않았다. D04 실제 header/bbox·desktop/mobile 시각 결과는 main이 확인하며, 마지막 CSS의 viewport 효과를 이 보고서가 검증했다고 주장하지 않는다. 새 P09 completion2질문/9상태·이미지와 전체 IA/본문 구조 작업도 승인 범위 밖이다.
