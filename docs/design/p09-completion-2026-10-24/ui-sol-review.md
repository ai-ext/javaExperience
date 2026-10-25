# P09 UI 독립 검수 최종

판정: attempt2 spec PASS / quality PASS, C0 / I0 / M0.

최초 M1이었던 배열 길이·원소 오표시 회귀검사 공백은 전체 9상태의 independent expectedStageValues 대조로 해결됐다. 기존 테스트에서 통과했던 `sum-items` 길이 `99`, `sum-array` 원소 `[40, 60]` 변형이 모두 새 assert에서 실패한다. clipboard guard4개 삭제와 문자열 리터럴 훼손을 포함한 총7개 변형도 모두 실패하고 정상 입력은 통과했다.

직접 실행: 최신 `npm run test:p09`, `git diff --check`, 독립 9상태 JSDOM/source/history/query/전체values 계약, write:false esbuild bundle byte 재생성 대조. reader/dark 테스트는 attempt1에서 직접 통과했다. 현재 승인 bundle SHA는 `0f0116de5ff9d7fd84508960dd05fd5b31613ee60c67c838e0443d2bd677e7c0`이다.

기존20질문84상태 데이터 전체와 asset44 객체, sourceRoot 전체 HTML이 HEAD와 같다. 사전 dirty2·historical proof1366·초기 review24·원문135·learner17 보존 mismatch는 0이다. 신규 질문2/상태9를 과거 history에 합성하지 않았다. sourceFragments는 source 순서와 절/열 범위를 따라 정확 byte로 일치하고 문자열 리터럴 정규화에 의존하지 않는다. 추가 전체 Java/raw13은 원문 영역 밖의 명확한 details에 있다.

재현 로그: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-completion-2026-10-24/ui-sol-logs/attempt2

실제 PC 시각·수정된 focus crop·확대/스크롤·정상 OS clipboard 및 inventory/전체24 harness는 parent의 별도 관문이다. native Java/JPG는 독립 proof 승인과 구분했다. 이번 승인은 새2질문9상태의 Node/정적 UI 계약에 한정하며 P09전체·24전체·134전체 완료를 뜻하지 않는다. 제품파일 수정·commit/push·외부CLI·브라우저·LLM 재위임은 하지 않았다.
