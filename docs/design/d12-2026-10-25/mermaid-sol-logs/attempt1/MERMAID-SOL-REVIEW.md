# D12 Mermaid 독립 검수 · attempt1

명세 **FAIL**, 품질 **명세 관문 미통과로 미실행**. C0 / I1 / M0.

지연 중인 Mermaid가 dispose 이후 성공하면 원문은 복원되지만 renderAgain 플래그가 남아 whenIdle 대기가 끝나지 않는다. dispose 이후 실패하면 catch가 오류 안내를 다시 삽입한다. 현재 npm run test:d12는 이 두 조건을 검사하지 않아 통과한다.

성공·실패 모두 dispose 이후 결과를 폐기하고 pending 플래그와 idle 대기를 정리해야 한다. queued dispose와 in-flight 성공·실패 dispose 검사를 추가해야 한다. 재현 원출력과 소스는 mermaid-sol-logs/attempt1에 보존했다.

이 재현은 JSDOM과 지연 fake renderer를 사용한 계약 검수다. 실제 CDN/Chrome와 원문 도식의 최종 수용은 메인의 별도 관문이다. 최초 RED 기록은 신규 helper의 MODULE_NOT_FOUND였다는 한계를 유지한다. 제품·기존 보고서·원문은 수정하지 않았다.
