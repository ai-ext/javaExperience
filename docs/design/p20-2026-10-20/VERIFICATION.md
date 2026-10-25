# P20 보강 검증 기록

2026-10-20 KST. 원문 386줄·Java 8블록을 전문 검토했다. 컴파일 접근성·양쪽 메모리 관계·inverse-only 실패·IDENTITY·별도 rollback·managed orphan·열/감사·DTO의 8질문 21상태를 보강했다. SEQUENCE/AUTO·JSON mapping·Lombok equality·모든 지연 로딩 예외 등 원문의 모든 개별 장면을 새 이미지와 실행으로 완료한 것은 아니다.

## 원문과 추가 실행의 경계

원문 Java 6파일을 그대로 추출해 JDK 21로 컴파일했다. package-private LineStatus를 반환하는 getStatus().name()을 다른 web 패키지에서 호출해 실제 javac exit1과 접근성 오류가 발생했다. 원문은 수정하지 않고 별도 corrected/OrderResponse.java에서 한 식만 String.valueOf(l.getStatus())로 바꾸었다. 현재 enum에 toString override가 없으며 실제 DTO status는 PENDING이었다. 원문 5파일과 교정 DTO를 컴파일한 추가 fixture가 실행된 것이며, 원문 전체 앱이 그대로 실행 성공했다는 뜻이 아니다. correction.json과 verify-source.py가 이 한 식 차이와 추출본을 검사한다.

격리 Boot 4.1.1 non-web / JDK 21 / H2 2.4.240 / Hibernate 7.4.5.Final / Jackson 3.1.5에서 추가 27검사를 실행했다. 원문 ShopApplication의 auditing과 EntityManager를 사용하며 원문 Controller 메서드·HTTP는 호출하지 않았다. H2는 별도 메모리 DB이며 MySQL mode도 사용하지 않았다. 원문 MySQL·Java 25·Docker는 미실행이다. 사용자 Docker backend가 읽기 조회에 응답하지 않는 상태는 P19에 기록했고 재시작·설정 변경·실습 DB 접근을 하지 않았다.

원문 domain의 add/remove를 순수 Java로 실행해 원문 제시 stdout 두 줄과 일치했다. quantity0은 생성자가 정상 반환하기 전에 원문의 예외를 던졌다. 같은 commit 분기의 kim/coffee/4.50/quantity2에서 IDENTITY persist 중 부모·자식 INSERT 두 문장이 나왔고 ID는 각각1이었다. cascade된 자식도 managed였고 같은 transaction JDBC에서 행·FK·PENDING·감사 사용자를 읽었다. 명시 flush의 추가 SQL문은 0개였으며 별도 H2 READ_COMMITTED(2)·autocommit observer의 행 수는 persist/flush 후0/0, commit 후1/1이었다. SQL문 개수는 이 조건에만 한정하고 DB commit 작업량과 같다고 하지 않는다.

별도 transaction의 rolled/id2는 INSERT·flush 후 같은 transaction 부모1/외부0, rollback 뒤 외부 부모0/자식0을 확인했다. id1 commit 뒤 같은 주문을 rollback하는 연속 단계가 아니다. 다음 새 EntityManager에서 managed id1 자식을 removeLine하면 메모리 collection0/owner null, flush 전 외부 자식1이었다. flush의 실제 DELETE 뒤 같은 transaction 자식0/외부1, commit 뒤 외부 자식0/부모1을 확인했다. new/detached/already removed의 orphan 제외 조건은 공식 명세로 설명했고 그 세 조건을 추가 실행하지 않았다.

의도적 inverse-only 실패는 원문 getLines가 List.copyOf를 반환하므로 추가 probe의 reflection helper로 내부 컬렉션만 바꾼 실험이다. 부모 INSERT 한 문장 뒤 Hibernate PropertyValueException이 OrderLine.order를 지목했고 child INSERT는 없었다. rollback 뒤 broken 부모 행0이다. DB NOT NULL 오류가 실제 발생했다거나 null FK 자식이 저장됐다고 하지 않는다.

H2 JDBC metadata에서 PRICE NUMERIC(19,2), ORDER_ID NOT NULL/FK와 deleteRule3(NoAction)을 확인했다. JPA cascade/orphan DELETE와 DB ON DELETE CASCADE를 구분한다. status는 PENDING이며 H2 metadata 타입은 native ENUM이다. 원문 auditing의 created_by/updated_by는 local-user, 날짜는 non-null 동적 시각으로 기록했다. 로그인 사용자 실측이 아니며 날짜 상수는 만들지 않았다. DTO는 transaction 안에서 복사하고 commit/EntityManager close 뒤 동일 JSON을 다시 확인했다. 그 재직렬화의 추가 SQL 횟수는 별도 assertion이 없다.

## 근거와 화면

공식 문헌 조사는 Codex CLI gpt-6-luna/OpenAI 직접 경로로 LOCAL_HOME/research/javaexperience-p20-20261020 에 저장했다. LiteLLM·재위임·모델 대체는 없었다. 메인은 Jakarta Persistence 3.2 전체 명세와 Spring Data JPA auditing 본문을 열어 enum의 final String @EnumeratedValue 예외, orphan 상태 제외, ownership/persist/flush와 사용자 SPI를 대조했다. 두 API 개별 URL 열기는 실패했지만 같은 공식 전체 명세는 열렸다. research에 보고서·메모·메인 확인 범위를 기록했다. 원문 치트시트의 무인자 생성자 금지 오기는 보존하고, 별도 화면에 public/protected 무인자 생성자가 필요하다고 명시했다.

built-in image_gen 17장 중 8장 선택·9장 draft다. 원본/프롬프트/교정/SHA/실제 크기는 generation-records.json과 correction-prompts.json에 있다. 초기 이미지의 가짜 파일/클래스·getter·필드·반대 화살표·Kim 대소문자·상품값·미측정 추가 표를 제외했다. 최종 DTO v3는 entity LineStatus와 DTO String을 구분한다. 선택 8PNG는 실측1672×941이며 메인이 전부 읽고 독립 리뷰가 최종 교정을 대조했다.

Chrome 1672×941/360×800의 새 21상태씩42관찰을 현재 질문/제목/값/코드/PASS/SQL/이미지/로드/넘침/증거 접기와 전부 대조했다. 기존 설명용4단계씩8관찰과 필드 연결3개씩도 확인했다. 기존의 설명용 child id10과 추가 실험의 실제 child id1을 섞지 않는다. 선택 이미지별 양쪽 최종 캡처16개는 browser-captures.json의 stage와 일치한다. 모바일은 현재 구간을 확대하고 내부 좌우 이동으로 읽으며 페이지 가로 넘침은 없었다. 일부 번역 확장 overlay와 smooth scroll 중 header 위치는 사이트 내용과 구분한다.

실제 복사·증거 펼침 뒤 확대 유지·새로고침 복원·긴 SQL 펼침·그림 키보드 pan·End 포커스/Enter 선택·원문/깊은 앵커를 확인했다. 원문 앵커의 빈 history state 때문에 선택 장면이 초기화되는 오류를 재현했고 실패 회귀검사 뒤 listener를 고쳤다. 수정 뒤 실제 원문/깊은 앵커 이동과 기존 map 조작 모두 identity-commit을 유지했다. 이 오류 전 기록은 browser-legacy-before-history-fix.json이며 최종 결과와 구분한다.

원문 생성 텍스트13,279자/code13/id25·코드 공백·기존 map/generic 전체 구조를 보존했고 중복id없음·실제bundle21상태·27PASS/SQL 연결을 검사했다. 기준 문서135개와 학습자 서버17파일 SHA도 모두 그대로다. main 작업 트리는 별도 조회 시 깨끗했다.

## 검증 수준

원문 compile 실패와 교정 fixture 27PASS/JSON 전체는 독립 리뷰도 재현했다. 날짜는 동적 non-null 값만 정규화해 비교했다. 최종 UI/HTML/이미지/브라우저 기록 리뷰는 REVIEW.md다. 최종 추가27검사·build·test:p20/p19/w09/p16/p04/p09/knowledge-catalog·visual/version-cards/parity의 명령·출력·exit는 checks/final-checks.txt다.

새21항목은 mockup_ready를 거쳐 implemented로만 올렸고 전이42건을 보관했다. 전수 픽셀 정밀 대조·실제 학습자 이해도·Chrome 외 환경은 미검증이며 모든 원문 블록이나 다른 문서를 verified로 올리지 않는다. 추가 fixture 개발 중의 초기 컴파일 실패 로그와 안내 축약 전 보조 캡처는 checks/history의 과거 기록이다. 현재 source-proof/gradle-run.txt가 최종 실행이다.

이전 P09/P04/P16/W09/P19에도 같은 빈 history listener 패턴이 있어 별도 다음 checkpoint에서 회귀 검토한다. P20 수정으로 다른 페이지까지 고쳤다고 표시하지 않는다.
