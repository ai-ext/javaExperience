# W11 서비스 트랜잭션 개념 보강 검증

확인일: 2026-10-20. 원문 369줄·Java 5블록과 기존 설명 화면을 읽고 **6질문·19상태**를 부분 보강했다. 실제 image_gen 13장 중 최종 6장을 선택하고 초안 7장은 drafts에 보존했다. 원문의 모든 세부 주제나 전체 134개 개념의 완료를 뜻하지 않는다.

## 원문과 추가 실행의 구분

B와 C는 같은 `OrderUseCase` 이름을 쓰는 대안이다. 원문을 수정하거나 다른 클래스 이름으로 바꾸지 않고 별도 Gradle source set·JVM에서 실행했다. 공통 저장소와 A `OrderController`, D `CheckedOrderUseCase`도 원문 그대로 컴파일했다. 원문 5블록과 SHA를 대조했다.

추가한 것은 `orders(product_id,quantity)`·`inventory(product_id,quantity)` 스키마, 상품7/재고5 초기 데이터, 관찰 코드와 메모리 stub이다. 매 run을 초기화한 뒤 성공 수량2·실패 수량6을 사용했다. 환경은 standalone Spring 7.0.9 CGLIB·DataSourceTransactionManager·H2 2.4.240·JDK21이며 Boot 4.1.1은 의존성 BOM으로만 사용했다.

Controller는 Spring 프록시 빈의 **Java 메서드 호출**로 검사했다. HTTP/MVC·201 응답·응답 직렬화를 실행한 결과가 아니다. RiskClient 구현은 제어 가능한 메모리 stub이다. C의 빈 원문 리스너는 추가 subclass가 `super.afterCommit`을 호출한 뒤 관찰했으며, 실제 알림이나 broker 호출은 없다.

## 재현 검사와 관찰 방식

`source-proof/verify-source.py` 재실행은 **31 PASS(B22/C9)**, 원문 5블록/SHA, 실제 버전, 의존성 SHA, 전체 frozen JSON과 SQL 바인딩·관측 순서를 확인했다. 독립 검수도 source-proof를 임시 경로에 복제하고 ROOT만 원문 읽기 경로로 조정해 같은 결과를 재현했다.

추가 트래커는 원문 PreparedStatement 문자열·실제 setter 바인딩·affectedRows와 **문장 반환 직후** 동일 writer/별도 observer의 상태를 기록한다. 관찰 SELECT·초기화·assert 쿼리는 sourceSql 집계 밖이다. 문장 수와 변경 행 수를 구분하며 wire·속도 계측으로 표시하지 않는다. observer는 독립 READ_COMMITTED·autocommit JDBC다. 연결1/2는 각 run의 wrapper 식별자이며 DB 세션 번호나 pool 개수가 아니다.

## 9개 case의 결과

| case | 확인한 결과 |
|---|---|
| B repositoryFailure | INSERT(연결1) 직후 writer는 주문7/6·재고5, observer는 주문없음·재고5다. INSERT seq2 → 첫 commit seq3 → 두 번째 UPDATE seq7 순서를 확인했다. 연결2의 guard UPDATE는 실행됐지만0행을 변경했다. 이때 observer는 이미 주문7/6을 보며, 연결2 rollback 뒤에도 최종 주문7/6·재고5가 남았다. |
| B repositorySuccess | 별도 수량2는 연결1/2의 두 독립 commit 뒤 주문7/2·재고3이 됐다. 성공 최종값이 같다고 단일 업무 트랜잭션은 아니다. |
| A controllerFailure | 두 저장소 SQL이 같은 연결1에 참여했다. 수량6 guard0/IllegalStateException으로 한 번 rollback되어 최종 주문없음·재고5였다. Controller가 두 저장을 묶지 못한다고 주장하지 않는다. |
| A controllerSuccess | 별도 수량2는 같은 연결1/한 commit으로 주문7/2·재고3이 됐다. 실제 HTTP 응답은 측정하지 않았다. |
| C serviceSuccess | INSERT 뒤 writer 주문7/2·재고5/observer 없음5, UPDATE 뒤 writer 주문7/2·재고3/observer 없음5였다. physical commit seq4 뒤 추가 리스너 관찰 seq5가 주문7/2·재고3을 읽었다. |
| C serviceFailure | 별도 수량6의 guard가0행이라 같은 연결에서 한 번 rollback됐다. 최종 주문없음·재고5, 추가 리스너 기록0이며 publishEvent 줄에 도달하지 않았다. |
| D templateRejected | 추가 stub이 false면 원문 IllegalArgumentException을 던지고 sourceDML0·trackedConnectionsOpened0이었다. 이0은 setup/raw observer/assert 연결을 제외한 Spring DataSource wrapper 경로다. 전체 DB 연결0이라는 뜻이 아니다. |
| D templateSuccess | risk 관찰은 active=false/sync=false/bound없음(seq1)이며 첫 sourceSQL(seq3)보다 앞이다. 수량2의 두 저장소는 같은 연결1/한 commit으로 주문7/2·재고3을 확정했다. |
| D templateFailure | stub이 허용해도 수량6 guard는 별개로0행이다. UPDATE는 실행됐으며 두 DB 변경은 함께 rollback되어 최종 주문없음·재고5였다. |

원문 C 리스너의 본문은 주석뿐인 no-op다. 추가 `ObservedListener`가 원문 super handler를 호출한 다음 관찰했다. seq5의 Spring active=true·sync=false는 이미 완료된 physical commit4를 미커밋으로 바꾸지 않는다. sequence는 로컬 사건 순서이고 시간이 아니다. 원문 publishEvent 줄에 임의의 계측 sequence를 부여하지 않았다.

## 공식 근거와 이미지 교정

Luna 직접 OpenAI 조사 경로는 `/Users/ds/research/javaexperience-w11-20261020`이다. LiteLLM·재위임·모델 전환은 없었다. 메인은 공식 Spring7.0.9 자원 동기화/JDBC/TransactionTemplate, Fowler 원문과 pinned MVC 반환값 처리 소스를 직접 열었다. MVC 소스의 호출·반환값 처리 순서는 공식 근거이며 이번 HTTP 실측이 아니다.

초안의 잘못된 메서드 이름, 0행과 SQL 미실행의 혼동, 임의 sequence와 미측정 writer 조회를 실제 imagegen으로 교정했다. 최종 그림은 SQL 반환 직후 writer/observer, 순수 commit 기록, 최종 observer를 구분한다. 아직 호출하지 않은 메서드를 실행된 것으로 표시하지 않는다. 메인과 독립 검수가 최종 6그림을 직접 읽었고 미해소 소견은0이다.

## 브라우저·원문 보존·감사

- Chrome1672×941/390×844에서19상태씩 **38관찰**, 6쌍12 full-page 캡처를 저장했다. 질문·title·code·values·PASS·dotted run JSON·이미지 로드·넘침·검증 기본 접기를 대조해0실패였다. 독립 검수도38행을 현재 data와 별도 assert로 대조하고12캡처를 모두 읽었다.
- 특수10검사: 정확한 code copy, 확대 시 로그 열림 유지, ArrowRight 내부40px 이동, 모바일 다음/이전, 원문 앵커·reload·Back/Forward 장면 유지, desktop End/Enter, 깊은 원문 절 펼침이다. 기존 partial/atomic 설명 흐름도 양쪽4관찰로 확인했다. 기존 Tag/Post 예상값과 추가 orders/inventory 실측을 구분했다.
- 사이트 주소 필터 console 항목은0이다. 모바일 그림은 내부 pan으로 읽는다. 번역 확장 overlay·sticky header·스크롤 위치 차이를 전수 픽셀 동일성으로 표시하지 않는다.
- 생성 HTML 검사는 원문 **14,944자·code5·id22**, 기존 집중 화면/map outerHTML, 실제 classic bundle19상태·PNG6·31PASS/전체 run을 확인했다. 선택 근거 JSON은 화면에서 정돈해 표시하되 파싱한 값이 원본3파일과 같다는 검사도 추가했다. 원시 기계 출력은 고치지 않았다.
- 문서135개·학습자 서버17개 SHA가 같고, 원본 worktree3403파일 SHA 차이는0이다. 이전 parity555줄은 byte-identical로 보존하고6줄만 추가해 **총561/verified0**이다. 새19상태만 unreviewed → mockup_ready → implemented의38전이를 기록했다. 인벤토리의 과거 verified6은 이번 승격이 아니다.
- build는339HTML/link0이다. test:w11·s08·s09·jpa-images·concept-history·p20·p19·w09·p16·p04·p09·knowledge-catalog와 audit:visual·version-cards·parity가 통과했다. JSON 표시 정돈 후 W11 검사와 필수 감사3종도 재확인했다. 실행 로그와 결과는 checks에 있다.

## 미검증 범위

Boot 앱·JPA·MySQL·Java25·HTTP/MVC·응답 직렬화·OSIV·실제 Risk 네트워크·결제·batch/message framework·broker·outbox·CDC·실제 알림·연결 풀·잠금 대기·속도·전체 동시성·reactive·전수 픽셀 비교·다른 브라우저·학습자 검증은 미실행이다. 서비스의 설계상 재사용 이유와 실행한 DB 원자성 범위를 구분한다. 로컬 feature checkpoint이며 merge·push·PR은 하지 않는다.
