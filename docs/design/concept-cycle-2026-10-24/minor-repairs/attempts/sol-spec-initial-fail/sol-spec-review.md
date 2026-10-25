# minor9 독립 Sol spec 검토 — 중간 snapshot

확인 시각: 2026-10-24T13:04:03.901543+00:00

판정: **FAIL / 후속 수정 진행 중**. bounded minor9만 대상으로 하며 전체24·전체134 완료를 뜻하지 않는다. 제품 파일을 수정하지 않았다.

| 항목 | 판정 | 근거 |
|---|---|---|
| P09-M1 | pass | lesson 출처152와 원문152 일치, MD SHA 보존 |
| P09-M2 | pass | PNG79증거 보존, manifest source Git blob SHA와 현행 JPG destination SHA 연결 검증 |
| P16-Q1 | pass | 20상태 active 유효성 및 DOM mark·property-out 핵심3행 확인. [999]/[] 독립 변이는 요구 assertion exit1 |
| S09-Q01 | pass | fetch-join active=[0,1],31상태 active/DOM mark 일치. [999] 변이 exit1 |
| W11-Q01 | pass | sceneVersion/requestId guard, 독립8분기 pass. guard 제거2변이는 실패 검출 |
| V04-Q01 | pass | 역사 source.json 불변, 준비 runtimeScope라는 공개 주석과 currentScope가 먼저 노출. native9/Java28/JUnit22/facts32 중첩·compile-only·Java21/25 경계 대조 |
| B01-Q01 | fail | 초기 snapshot에서 CHECK/map 전체행 표시·강조. 수정 중이므로 최종 판정 보류 |
| D02-Q01 | fail | 초기 snapshot에서 diagnose-layers 잘못된 이름 TLS 값이 handler 추가0로 잔존. tls-v2 JPG는 직접 시각 확인 pass. 수정 중 최종 판정 보류 |
| D04-Q1 | pass | 원문 링크 직전 §1 L23/§3.4 L108 비고정 실행순서 안내와 버튼2개 실제 stage 이동. MD/보존본문 불변 |

남은 finding: critical0 / important0 / minor2. B01은 predicate와 CHECK/JSON plumbing을 분리하고, D02 diagnose-layers의 handler 추가0를 좁혀야 한다. 메인에게 두 수정 요청을 보냈으며, 현재 후속 구현 중이라 최종 승인을 보류한다.

보존 검증: preexistingDirty2·historicalProof1366·initial24Reviews24의 baseline SHA와 원문 MD135·학습자 src17의 HEAD 바이트가 모두 일치했다.

검증 강도: Node/JSDOM DOM·복사·history·상태 및 network-free Python AST 단위 재현이다. DB·Java·TLS·서비스 재실행과 브라우저 레이아웃 검증은 하지 않았다. D02 tls-v2.jpg는 view_image로 실제 확인했고 완료 프록시 기록 증가량/handler진입 미계측 footer가 맞는다.

RED/GREEN: P09 numeric/S09/W11/D02/D04의 기존 RED는 실제 실패다. p09-jpg-red.log는 exit0이므로 RED로 인정하지 않는다. P16의 activeValid false 단정만으로는 nonzero 검증이 아니지만 reviewer의 [999]/[] 변이가 요구 assertion exit1을 독립 확인했다. W11 독립8분기는 현재 pass이며 scene guard와 request guard를 제거한 메모리 변이2개는 실패한다. V04 최초 RED는 current-scope 파일 누락이므로 의미 모순 검출보다 좁은 근거다.

현재 npm8 중6개 통과, B01/D02는 후속 RED 테스트 변경 시점과 겹쳐 실패했다. 이를 안정 snapshot의 최종 결과로 해석하지 않는다. main stable handoff/build 후 재실행한다.

승인 한계: 원문 전체 coverage 공백을 닫는 검토가 아니며, 새 P09 completion9상태/2질문은 제외한다. 후속 quality review는 이 spec 통과 뒤 별도로 필요하다.
