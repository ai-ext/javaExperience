# D12 Mermaid 독립 검수 · attempt2

기능 명세 **PASS** 후 품질 의미 변이 **PASS**. C0 / I0 / M1이며, 무효 CSS 1줄 제거를 끝내기 전에는 최종 수용을 완료하지 않는다.

지연 성공·실패가 dispose 뒤 완료되는 두 독립 재현을 통과했다. whenIdle은 종료되고 원문이 복원되며 오류 안내가 다시 삽입되지 않는다. `npm run test:d12`와 `npm run test:concept-reader`를 직접 실행해 exit 0을 확인했다.

양수 폭, 읽기 경계, 내부 details 관찰, single-flight, 원문 cache·복원, processed marker, 빠른 모드 복귀, error SVG, fallback, 재시도, 중복 초기화, 완료 SVG 재사용, dispose, await를 바꾸는 의미 변이 17개를 모두 검출했다. 생존과 timeout은 0이다. 입력 150개 SHA는 검수 시작과 종료 사이에 바뀌지 않았다.

D12 CSS의 `.d12-learning .d12-mermaid-error` 한 줄은 실제 notice에 매칭되지 않는다. 메인의 승인에 따라 현 fingerprint에서 의미 변이를 먼저 마쳤다. 이 줄을 제거한 뒤 수정 전 CSS와 바이트 동일성을 확인하고, helper와 나머지 입력이 그대로인지 한정 검수해야 한다.

builder는 D12 flag·Mermaid 분기만 변경됐고, Git 추적 HTML 349개 중 D12만 바뀌었다. 45개 상태 payload와 원문 3개 도식, proof, 이미지, 기존 보고서는 보존됐다. 최초 RED가 신규 helper MODULE_NOT_FOUND였다는 한계와 실제 CDN/Chrome는 메인 관문이라는 구분을 유지한다.
