# D12 초기 anchor 독립 검수 · attempt1

기능 명세 **PASS**, 품질 **FAIL**. C0 / I1 / M0.

현재 제품은 독립 probe를 통과한다. 생성 classic guard가 CDN module 전에 실행되며, 실제 function 직렬화를 module scope 없이 실행해 초기 입력 취소와 리스너 정리를 확인했다. 기존 17개 Mermaid 변이는 모두 검출했다.

새 anchor 변이 11개 중 6개는 기존 하네스에서 살아남았다. 빈 초기 hash 뒤 이벤트 없는 늦은 hash, 실제 geometry가 있는 원문 밖 target, 첫 보정 뒤 두 번째 idle, hashchange 없는 hash 변경, settled/dispose 뒤 리스너 정리를 독립적으로 검사해야 한다. 같은 6개 변이는 reviewer oracle에서 모두 검출했다. 제품 로직 변경이 필요한 결함으로 판정한 것은 아니다.

JSDOM은 조건과 호출 횟수만 검증한다. 실제 target 위치와 96px 여백은 메인의 CDN/Chrome 증거로 확인해야 한다. 추적 문서는 mutable이며 기존 Sol 보고서와 원출력은 불변으로 보존한다.
