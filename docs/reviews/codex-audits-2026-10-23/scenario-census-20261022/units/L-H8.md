# L-H8. H8. 외부 HTTP 호출 — RestClient와 타임아웃

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md)

원문 SHA-256: `80b69911c479fd2a9f73cc84219bb5d98cc516c003c1f72eb1a4752a703c23b7`

## 판정

timeout을 YAML 선언이 아니라 slow fake endpoint elapsed와 예외로 확인한다. 사용자 URL fetch의 SSRF safety는 별도 고위험 전이로 남는다.

## 목표·선수 지식·학습자 작업

RestClient의 동기 호출, 연결/읽기 timeout 설정, HTTP 상태 오류와 전송 예외, 실패 허용 preview 및 HTML 제목 파싱을 익힌다.

문서에 Spring Boot 4.1 임시 app, fake delayed site, client factory 설정 비교, timeout/status 예시, fail-open 처리와 Jsoup parsing이 있다. 저장소에 임시 app source/test는 없고 원문 출력은 저자 실행 관찰이다.

## 요구·구현·검사 대조

### 1. connect/read timeout을 실제 지연 응답으로 확인하고, HTTP status 예외와 transport failure를 분리한다. 보조 preview 요청 실패는 post 저장을 취소하지 않는다.

구현 대조: 원문은 RestClient.Builder bean이 없는 의존성 조합, starter/direct factory 두 구성, 5초 페이지 및 2초 timeout, RestClient.create config 차이, connect refusal, onStatus 4xx, optional title parsing 및 실패 시 저장되는 예시를 보여준다. 이는 인쇄된 저자 실행 결과다.

검사 대조: 따라하기는 fake delay 0/1500/5000 요청, timeout 제거 후 전체 5초 대조, 404/500 및 post persistence 관찰을 안내한다. 실행 파일/JUnit은 없고 이번 실행도 안 했다.

공백 또는 한계: 사용자가 보낸 전체 URL을 서버가 fetch하는 경우는 SSRF 범위다. lesson은 timeout/client parsing을 가르치며 resolved destination/private IP/redirect/DNS policy를 구현하지 않는다. 16-4는 localhost fake site를 위해 실습에서 열어 둔다고 주석을 달고 D13 SSRF로 연결한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md:1) — 1~266행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

RestClient는 blocking이므로 request thread가 response 또는 timeout까지 기다린다. post create transaction 안에서 호출하면 DB connection/transaction도 점유한다. timeout은 wait duration을 제한할 뿐 URL trust, retry, pool capacity나 response body memory를 해결하지 않는다.

- 현재 난이도: 독립 개념 레슨(실무 외부 의존 호출)
- 판정 이유: client 생성, network timeout, response errors, fail-open과 parsing을 작은 fake endpoint로 비교한다.
- 다음 단계: 16-4는 preview를 post creation에 적용하고 fetch를 transaction 밖에 두며 timeout/body 64KB/title 200자 제한을 둔다. D13은 SSRF, P25는 client config.

## 부족한 점

### L-H8-G1 · high

문서가 client timeout 및 HTTP failure를 검증하지만 사용자 전체 URL이 internal/private/link-local/metadata destinations나 redirect로 향하는 것을 막는 정책과 negative tests는 제공하지 않는다.

판정 범위: 16-4의 본문 주석은 내부 주소 차단이 필요하다고 밝히며 실습 localhost fake server를 허용한다. 문서가 client lesson인 범위를 유지하되 이 실습 설정을 production URL policy라고 오해하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md:1) — 1~266행
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/scenario/ch16-events-async-cache/16-4-link-preview.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/scenario/ch16-events-async-cache/16-4-link-preview.md:164) — 164~174행
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/scenario/ch16-events-async-cache/16-4-link-preview.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/scenario/ch16-events-async-cache/16-4-link-preview.md:589) — 589~630행

## 확장 개발 명세

### timeout과 SSRF 목적지 제어를 별도 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

응답을 2초 뒤 끊는 것은 어느 목적지로 연결할지 통제하는 대신이 아니다. 보조 preview timeout, body cap, URL destination policy가 각각 독립 조건이다.

**시작 상태**

문서의 내부 fake-site만 쓴다. H8 sample 1000ms connect/2000ms read timeout, 5000ms delayed endpoint를 사용한다. 임의 외부/internal endpoint로 요청하지 않는다.

**학습자가 할 일**

- delay 0, 1500, 5000 요청을 builder-configured, RestClient.create, direct request-factory 클라이언트로 보내 elapsed/status를 기록한다.
- 1초 connect timeout 대상, closed local port, 404/500 response를 각각 호출해 ResourceAccessException과 HTTP status exception을 구별한다.
- onStatus 4xx handler가 response가 없는 timeout을 처리하지 않는지 확인한다.
- post create 전 preview fetch를 transaction 밖에서 실행해 timeout 때 link title null인 채 HTTP 201 및 DB row가 남는지 확인한다.
- fake page의 og:title 없음/일반 title/HTML entity 및 response body 64KB 초과를 테스트하고 title 200자 상한을 확인한다.
- 보안 후속에서 allowlist scheme/host/port, resolved IP block, redirects disabled/revalidated, DNS rebinding, egress policy 및 connected address를 별도 negative test로 정의한다.

**정상 사례**

- fake delay 0/1500은 title을 반환하고 5000은 configured read timeout 즈음 종료된다.
- 404/500은 HTTP response 예외, timeout/refused는 transport exception이다.
- preview failure가 post save를 막지 않는다.

**실패·경계 사례**

- Boot builder 대신 RestClient.create()를 쓰면 Boot client settings를 적용받지 않는 경우가 있다.
- HttpClientErrorException만 catch하면 ResourceAccessException은 처리하지 못한다.
- timeout이 있어도 arbitrary URL 목적지 내부망 노출을 막지 못한다.
- body String 전체를 무제한 받으면 큰 응답이 memory pressure를 만든다.

**동시성·성능**

동기 호출은 request thread를 잡는다. timeout 값과 요청량에 따른 connection/thread pool 영향을 구분한다. 원문 ~2초 관찰은 개발 환경 한 번의 결과다.

**DB 관찰**

- request factory, timeout 설정 경로와 elapsed time.
- status/exception/cause, post row 및 title/null 상태.
- 보안 확장에서 파싱된 host, DNS 결과, 연결 IP, redirect 목적지와 egress 정책.

**합격 기준**

- timeout을 실제 delay로 재현하고 status/transport failure를 분류한다.
- timeout/fake upstream failure 이후 post가 저장되고 preview title은 null임을 검증한다.
- SSRF policy와 URL parsing validation은 separate requirement로 기록하며, timeout/regex를 그 증거로 세지 않는다.

**기존 과제와 중복·연결**

16-4는 integration path를 구현하고 D13/P25는 SSRF/client configuration 지식 연결이다. H8은 RestClient/timeout 소개다.

**우선순위**

high

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H8/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H8/screen.jpg)
- 관찰: HTML/캡처를 실제로 열지 않았다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H8/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H8/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H8-rest-client-timeout.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H8-rest-client-timeout.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H8-rest-client-timeout.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H8-rest-client-timeout.html)
- html_same: 아니오
- difference: 원문은 최신 source와 같다고 corpus가 기록한다. HTML byte diff의 원인/화면은 미검토.

- 저자 기록 출력 및 timeout 값은 이번 감사에서 재실행하지 않았다.
- SSRF 외부 근거는 sources/lessons-h.md에 적은 OWASP 및 Spring Boot 공식 문서이며 현재 앱 구성/실행 결과를 대신하지 않는다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H8-rest-client-timeout.md:1) — 1~266행 (원리·client/fake site 코드·기록된 실행 실패/응답·따라 하기·확인 문제)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H8.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H8.json)
