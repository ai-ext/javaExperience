# D12 UI 폴리시 한정 추가 검수

명세 **PASS** 후 품질 **PASS**. C0 / I0 / M0.

세 focus 좌표와 memory-available의 code·note·evidence 문구만 바뀌었다. 원문과 보강 설명의 귀속, original-prose 유형과 source fragment는 보존됐다. 나머지 41개 상태와 42개 focus, controller·CSS·render·bundle·proof·선택 이미지·collector·registry는 후보 3과 같다.

`npm run test:d12`와 독립 45개 상태 source DOM 검사를 통과했다. 복사 역순 응답, 동일 상태 재선택, A→B→A의 지연 실패, 산문 fallback의 실제 선택 노드도 통과했다. 생성 HTML payload 전체는 현재 데이터와 같고, payload 밖 DOM은 후보 3과 같다. 검수 중 입력 140개 SHA 변화는 0이었다.

기존 보고서 6개는 이번 검수 시작과 종료 사이에 바뀌지 않았다. 폴리시 이전의 별도 보고서 SHA baseline은 없어 그 이전 바이트 보존 증거로 확대하지 않는다. 이전 19개 변이는 로직이 바뀌지 않아 반복하지 않았다.

실제 PC의 새 캡처 눈검수와 전체 D12 완료 판정은 메인의 별도 관문이다. 이 추가 검수에서는 제품·기존 보고서 수정, Docker, 외부 CLI, 커밋을 수행하지 않았다.
