# D12 Mermaid 최종 독립 검수

명세 **PASS** 후 품질 **PASS**. **C0 / I0 / M0**.

초기 dispose 결함과 무효 CSS 한 줄은 해결됐다. 지연 성공·실패가 dispose 뒤 완료돼도 원문이 복원되고 whenIdle이 종료되며 오류 안내가 다시 삽입되지 않는다. 양수 폭, 내부 details, single-flight, 빠른 전환, 원문 복원, SVG 재사용, fallback, 재시도, dispose를 바꾸는 의미 변이 17개를 모두 검출했다.

무효 CSS 제거 뒤 `npm run test:d12`를 직접 실행해 exit 0을 확인했다. D12 CSS는 Mermaid 수정 전 snapshot과 바이트가 같고, 생성 HTML은 후보 2에서 CSS cache URL만 바뀌었다. helper·test·build·package와 나머지 147개 입력은 같다. 최종 입력 152개 SHA는 검수 중 바뀌지 않았다.

원문 3개 도식과 45개 학습 상태, proof, 선택 이미지, 공통 reader와 기존 보고서는 보존됐다. 구현 문서의 D12 HTML 해시도 실제 값으로 정정됐으며 현재 표의 6개 해시를 모두 대조했다.

실제 CDN/Chrome의 최종 수용, 최종 all26/3audit 재실행과 전체 D12 완료 판정은 메인의 별도 관문이다. 최초 RED는 새 helper의 MODULE_NOT_FOUND였다는 한계를 유지한다. 이전 FAIL과 CSS 제거 전 M1 보고서는 불변으로 보존했다.
