# D12 Task26 UI 독립 검수 · attempt2

명세 **PASS**, 품질 **FAIL**. C0 / I2 / M0. 최초4건은 해결됐고 현재 제품의 독립45상태 DOM/source/copy검사는 통과한다. 남은2건은 정상 제품의 동작 오류 판정이 아니라 요구된 회귀 보호의 공백이다.

## D12-UI-Q1 · sourceFragments의 실제 DOM 출처 표시에 대한 하네스 검증 공백

기존 product 하네스에서 controller의 source link label을 WRONG_SOURCE로 바꾸거나 source code본문을 WRONG_SOURCE_CONTENT로 바꿔도 exit0. 데이터 source range 비교는 있지만 렌더된 출처 표시를 보호하지 못한다. 같은 두 변이는 reviewer 독립probe에서 AssertionError로 검출된다.

수정 기준: 45상태의 sourceFragments에 대해 DOM 링크 텍스트·href, fragment heading, 실제 파일 범위와 같은 본문을 독립기대값으로 검사한다. 라벨·본문·href 변이가 하네스에서 실패해야 한다.

## D12-UI-Q2 · 복사 성공/실패 역순과 산문 fallback 선택 노드를 보호하지 못하는 하네스 공백

copy success request guard 제거, failure generation guard 제거, 산문 fallback을 숨은 code로 선택하도록 바꾸는3변이가 기존 product 하네스에서 모두 exit0. reviewer 독립probe는 newer reject→older resolve, ABA/sameA stale reject, selection Range의 visible prose node를 대조해3변이 모두 AssertionError로 검출한다.

수정 기준: 기존 테스트에 newer copy 실패 뒤 older 성공이 fallback을 덮지 않는 검사, A→B→A·동일 A 재선택의 stale rejection 검사, 산문 fallback selection Range가 숨은 code가 아닌 visible prose 노드에 걸리는 검사를 추가한다.

품질 변이18개 중13개 검출·5개 생존. 생존5개는 reviewer의 독립 probe에서 모두 검출됐다. source본문·라벨과 copy의 요청/세대/visible prose 선택을 검증하면 회귀를 막을 수 있다. npm test:d12/concept-reader/concept-dark는 직접 exit0으로 확인했다. 실제 PC와 clipboard는 메인 별도 범위이며 Docker와 외부CLI를 실행하거나 제품파일을 수정하지 않았다.
