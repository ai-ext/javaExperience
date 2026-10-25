# 기존24개 잔여 minor9 수정 사양

기준 HEAD a41846fc37607aa0db83e5fd99b8d0ce050acf79. 초기 Sol24개 review.json/coverage/기존 raw·source-proof·frozen·원문135/학습자17은 보존한다. 기존 미커밋 AGENTS.md/RESUME.md를 수정·stage하지 않는다. 전체 원문 완성 판정과 이번 bounded 수정 승인은 구분한다.

1. P09-M1: numeric-boundary 출처 155→실제152줄. 문서 SHA 보존. 역사 browser record의 source를 고쳐 통과시키지 않는다.
2. P09-M2: 기존 questions.json의79개 PNG 증거를 삭제·JPG 문자열 치환하지 않는다. conversion-manifest의 source→destination, sourceSHA256/sourceGitBlob, destination SHA256 체인으로 현행 JPG를 실제 파일과 검증한다. 미존재·미등록·해시 불일치면 실패. 이미지의 기술 정확성/시각 검증을 했다고 확대하지 않는다.
3. P16-Q1: 20상태 active가 빈 배열이 아니며 정수·범위 유효성을 검사하고 DOM mark 줄과 텍스트를 대조. property-out의 user_id/display_name 줄처럼 의도한 핵심 구간을 소수 독립 assertion으로 확인. 메모리 active=[999]와 비어있는 active 변이가 nonzero인 회귀, 정상 통과. 제품 의미 변경 불필요.
4. S09-Q01: fetch-join의2줄 code를 active=[0,1]로 수정. 모든31상태 active 범위 검사 및 실제 HQL/호출 DOM 강조. out-of-range 변이는 실패.
5. W11-Q01: R04의 sceneVersion 패턴처럼 render마다 세대 증가, 복사 시작 code/세대 캡처, 성공·실패 completion은 같은 세대일 때만 표시/선택. 연속 복사에는 request ID로 최신 요청만 반영. 장면 전환·A→B→A·역순 resolve/reject 회귀, 정상/실패 수동 선택 유지. 다른 controller 일괄 리팩터링 금지.
6. V04-Q01: source-proof/source.json의 준비 runtimeScope와 최종 status는 역사 원본으로 보존. 공개 supplementary에 해당 runtimeScope가 이전 준비 메모임을 명시하고, 실행 범위 최종 정정 자료를 새 별도 파일(이번 evidence 폴더 current-v04-scope.json)에 기록해 먼저 표시한다. native9/Java28·JUnit22/facts32 중첩, Java21 추가 환경, TC 컴파일만/Docker·SC·원문Java25 미실행과 일치. source.json을 현재 최종 범위로 무주석 제시하지 않는다. raw바이트 불변+generated DOM 검사.
7. B01-Q01: 기존 B01Proof.java 정확 발췌로 encoder encode와 실제 correct/wrong matches, issuedVersion!=currentVersion 판단식을 보여 준다. check/map plumbing 전부 쌓지 않고 predicate 부분을 분명히 구분한다. codeFiles.some(includes) 보존과 조화시키고 표시·강조·실제복사 회귀. 새 JWT 검증/재실행 주장 금지.
8. D02-Q01: 기존 raw의 httpHandlerCallsAdded=0은 완료 proxyRequests 기록 증가량이므로 raw 유지. 화면의 title/lead/values/note/모델 라벨을 completedProxyRequestsAdded/완료 프록시 기록 증가0으로 좁히고 handler진입은 별도 미계측이라고 표시한다. raw 필드명과 의미 연결은 명시. source-proof 코드를 AST/분리 실행하는 네트워크 없는 회귀로 upstream예외 시 do_GET 진입1/완료기록0을 재현한다. TLS실험을 새로 실행했다고 쓰지 않는다. 해당 TLS 그림도 메인이 교정한 JPG 자산으로 교체 예정(아직 없으면 등록 대기하고 보고); 과거 raw/check값·이미지 baseline 보존.
9. D04-Q1: 원문 링크 바로 바깥에 §1 L23/§3.4 L108의 test→JAR 선형 서술은 고정 실행순서를 뜻하지 않는다고 안내한다. 기존 graph-branches 및 assemble-boundary 장면으로 실제 동작하는 이동 조작을 제공한다(단순 anchor로 stage 선택이 안 되면 클릭 handler 최소 추가). 기존 Markdown·보존 본문 불변. generated DOM·조작 회귀.

검증: 의미 있는 RED→GREEN, 관련 npm8개(P09/P16/S09/W11/V04/B01/D02/D04). main이 최종 build·24harness·3audit·desktop/mobile·source135/server17 보존. Luna는 구현·관련테스트까지만, 새 Sol spec pass 후 quality review. 전체134 완료/전체24완료 표시 금지. 새 raster는 JPG만.
