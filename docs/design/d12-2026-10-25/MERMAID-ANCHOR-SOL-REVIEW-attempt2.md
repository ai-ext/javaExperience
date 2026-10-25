# D12 초기 anchor 독립 검수 · attempt2

기능 명세 **PASS**, 품질 **FAIL**. C0 / I1 / M0.

이전 6개 하네스 공백은 해결됐다. 기존 17개와 anchor 11개, Tab 취소 변이까지 29개를 검출했다. root settled listener의 once 자동 제거는 의미상 동등한 대조군에서 PASS해 오탐하지 않았다. 원본 테스트를 바꾸지 않고 helper와 직렬화 HTML을 임시 사본에서 함께 변경했다.

Window listener 계수는 아직 callback만 기록한다. wheel 제거의 capture를 true에서 false로 바꿔도 테스트는 0개로 보고하며 변이가 살아남는다. 독립 native EventTarget 대조에서는 settled 뒤 wheel dispatch에 남은 handler가 1회 호출됐다. 현재 제품의 remove 값은 맞고, type·callback·capture 조합으로 계수를 보강하는 tests-only 수정이 필요하다.

`npm run test:d12`와 `npm run test:concept-reader`는 직접 exit 0을 확인했다. source는 후보 1 대비 Tab 한 항목만 추가됐고, 검수 입력 156개 SHA는 바뀌지 않았다. 실제 target 위치는 JSDOM으로 판정하지 않으며 메인의 Chrome 증거를 별도로 사용한다.
