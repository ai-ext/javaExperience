# D12 초기 anchor 최종 독립 검수

명세 **PASS** 후 품질 **PASS**. **C0 / I0 / M0**.

초기 hash를 저장하는 생성 classic guard가 CDN module보다 먼저 실행됨을 독립 eval로 확인했다. 빈 초기 hash와 늦은 hash를 구분하고, 사용자 입력과 다른 hash, 닫힌 target, dispose를 존중한다. 최초 안정 batch 뒤 한 번만 보정하며 Tab과 Shift+Tab도 취소 조건에 포함된다.

마지막 변경은 테스트의 capture-aware 계수와 실제 EventTarget dispatch 대조뿐이다. Window와 root의 잘못된 capture 제거 변이를 모두 검출했고, root once 자동 제거의 의미상 동등한 대조군은 정상 통과했다. 직전 동일 runtime source에서 검출한 기존 29개 변이는 유지하며, 이번에 전부 다시 실행했다고 주장하지 않는다.

최종 `npm run test:d12`를 직접 실행해 exit 0을 확인했다. helper·build·CSS·package·MD·45개 상태·proof·이미지와 기존 보고서는 바뀌지 않았다. 입력 158개 SHA는 검수 시작과 종료 사이에 변하지 않았다.

JSDOM은 조건과 호출 횟수만 확인한다. 실제 target 위치와 96px 여백은 메인의 CDN/Chrome 증거로 별도 판정한다. 이전 FAIL 보고서와 변이 원출력은 불변으로 보존했으며, 추적 문서는 과거 review와 구분한다.
