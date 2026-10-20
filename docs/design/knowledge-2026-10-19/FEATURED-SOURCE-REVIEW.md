# 대표 개념 질문·예시·관련 과제 로컬 출처 대조

확인일: 2026-10-19 (Asia/Seoul). 저장소 원문과 로컬 imagegen 시안을 직접 읽어 대조했다. 웹·공개 문헌 조사나 코드 실행 검증은 하지 않았다. 원문·생성 HTML·제품 코드는 수정하지 않았다.

대상 저장소: `/Users/ds/code/javaExperience/.worktrees/visual-learning-next`. 대상은 대표 문서 10개의 질문·예시 출처 검토이며, DTO 7건 전체 상세 화면이나 134개 문서의 학습 완료를 뜻하지 않는다.

## 1. 시안에서 먼저 교정할 내용

- K03과 K06B-v2의 `1-2 DTO 응답`은 현재 시나리오명과 다르다. 실제 h1은 `1-2. DB에 저장하고 201로 응답 — JPA 첫걸음`이다. 사용자에게는 이 실제 이름이나 사실에 맞는 짧은 이름을 표시해야 한다.
- P16과 1-2의 명시적 연결은 존재하지만, 현재 1-2의 링크는 P16의 날짜·시간 계약 절을 가리킨다. 요청 변환 질문과 1-2 전체가 같은 내용을 다룬다고 확대하지 않는다. 1-1은 P16의 @RequestBody 및 DTO 절을 직접 링크한다.
- K02의 Java·객체31 / 요청·응답31 / DB·데이터29 / 설계·운영43은 시안에 표시된 수다. 최종 134개 분류표를 아직 받지 못했으므로 실제 분류가 검증된 수치로 취급하지 않는다.
- K03·K06B-v2의 DTO 검색7건은 제목+Markdown h1~h3 기준 실제 결과와 맞는다. 일치 ID는 P02,P03,P06,P16,P25,W09,W10이다. P03/P25/W10의 개별 질문은 이 4장 시안에서 노출을 확인하지 못했다.
- P06의 `이 문서의 CRUD 따라 하기`는 실제 문서 내용과 맞는 링크 설명이다. 별도 시나리오와 명시적으로 연결된 과제로 기록하면 안 된다.

시안 파일:

- [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K01.png](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K01.png)
- [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K02.png](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K02.png)
- [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K03.png](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K03.png)
- [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K06B-v2.png](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/design/knowledge-2026-10-19/K06B-v2.png)

## 2. 문서별 질문과 원문 예시

### P09

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P09-java-syntax-basics.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P09-java-syntax-basics.md)

- 시안 질문: new로 객체를 만들면, 변수에는 무엇이 담길까요?
- 대조 결론: K02의 질문과 원문이 맞는다. 객체 자체와 참조값을 구분하며 메서드에도 참조값의 복사본이 전달된다는 범위까지 근거가 있다.
- 근거 줄: 7–9, 25–55, 125–127, 288–377, 445–455. 관련 제목: §2의 클래스·생성자 / 변수 종류 / Java는 항상 값 전달; §3 순수 Java 실행 검증 — 참조값도 값으로 전달.
- 실제 원문 도메인·값: Invoice.number, Greeting.message, Profile.nickname의 세 예제가 있다. HTTP 예제는 GET /greetings/Ada → message="Hello, Ada". 참조 전달 예제는 Ada → Grace 필드 변경, 매개변수에 새 Profile("Local only")를 대입해도 호출자의 nickname은 Grace, 기본 타입 n은 1 유지.
- 구현 시 피할 오인: 참조값을 실제 메모리 주소나 객체 복사라고 부르지 않는다. new만으로 DB에 저장되지 않는다. Greeting.name/nameLength는 이 문서의 Greeting 필드가 아니다. 현재 저장소 0-1의 Greeting 예시와 합치려면 별도 출처를 밝혀야 한다.

### P04

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P04-constructors-builder.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P04-constructors-builder.md)

- 시안 질문: 생성자·팩토리·Builder는 언제 골라 쓸까요?
- 대조 결론: K02 질문을 §1·§2·§3.4에서 직접 뒷받침한다. 선택값이 적으면 생성자/factory, 많으면 Builder라는 선택 이유가 있다.
- 근거 줄: 7–49, 75–127, 156–244. 관련 제목: §2 당장 알아야 할 것; §3.4 생성자 위임·factory·Builder 출력을 확인한다; §3.5 record compact constructor.
- 실제 원문 도메인·값: 주문 Order.of("ORD-1",2) → ORD-1 x 2 tags=[]; Order.builder().id("ORD-2").quantity(3).tag("gift").build() → ORD-2 x 3 tags=[gift]. 별도 SignupRequest는 공백 email을 user@example.com으로 정리하고 displayName=Mina를 보존한다.
- 구현 시 피할 오인: 정적 팩토리와 Builder는 생성자를 없애는 Java 문법이 아니다. factory는 캐시·하위 타입 반환도 가능하므로 항상 새 객체를 만든다고 일반화하지 않는다. 생성자 주입과 DTO/Entity 생성 규칙도 별개다.

### P29

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P29-static-complete.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P29-static-complete.md)

- 시안 질문: static 값은 객체마다 따로 생길까요?
- 대조 결론: K02 질문과 원문이 맞는다. static은 클래스에 속한 공유 상태이며 인스턴스 필드와 비교하는 실행 예제·Q&A가 있다.
- 근거 줄: 7–22, 201–280, 310–344. 관련 제목: §2 당장 알아야 할 것; §4 예제1 static 공유값, 메서드 숨김과 오버라이드; §7 Q1.
- 실제 원문 도메인·값: StaticBasicsDemo 두 객체의 number는 각각 1,2이고 total은 둘 다 2. Parent 타입 변수에 Child 객체를 넣으면 static label은 Parent static, 인스턴스 kind는 Child instance.
- 구현 시 피할 오인: 공유 범위는 클래스를 정의한 클래스 로더 기준이다. 여러 서버가 같은 static을 공유한다고 설명하지 않는다. 클래스 로드와 초기화를 같게 쓰지 않는다. Spring singleton과 static도 같은 범위가 아니다.

### P16

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P16-json-jackson-practical.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P16-json-jackson-practical.md)

- 시안 질문: 요청 JSON은 어떻게 DTO가 될까요?
- 대조 결론: K01·K03·K06B-v2 질문과 §2.1·2.2·3.2가 맞는다. DTO 생성과 응답 객체 생성/직렬화, 변환 실패를 나누어 설명할 수 있다.
- 근거 줄: 7–51, 89–113, 147–149, 186–224. 관련 제목: §2.1 요청과 응답은 DTO로 고정한다; §2.2 @RequestBody가 동작하는 지점; §3.2 DTO와 컨트롤러 작성.
- 실제 원문 도메인·값: POST /orders 요청 product="keyboard", quantity=2 → CreateOrderRequest → OrderResponse(id=1L, product="keyboard", quantity=2, createdAt=Instant.parse("2026-09-29T00:00:00Z")) → 200 JSON id=1. quantity="two"는 변환 실패 400.
- 구현 시 피할 오인: 원문에는 DB 저장이 없고 id와 시각은 고정값이다. 새 DB id·201로 바꾸지 않는다. @RequestBody가 Jackson을 직접 호출한다고 단순화하지 않는다. HTTP JSON quantity 숫자 2와 문자열 "two"를 구분한다.

### W09

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/W09-why-dto.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/W09-why-dto.md)

- 시안 질문: 엔티티를 그대로 응답하면 무엇이 노출될까요?
- 대조 결론: K03·K06B-v2 질문과 §1·§2·§3·§5가 맞는다. 내부 필드 노출과 응답 계약뿐 아니라 순환 참조·지연 로딩·N+1까지 원문 범위다.
- 근거 줄: 9–59, 76–87, 130–193, 235–310. 관련 제목: §1 질문; §2 짧은 답; §3 왜 그런가 — 원리; §5 코드로 보기.
- 실제 원문 도메인·값: 도입은 게시글 상세 API와 주문/항목 그래프. 주 코드 예시는 주문 요약 API: OrderEntity(id,status,total,customer,items), CustomerEntity(name,email,internalMemo)에서 OrderSummary(id,status,customerName,total)로 제한한다. 이 절에 고정 keyboard/2나 실행된 JSON 응답 로그는 없다.
- 구현 시 피할 오인: DTO를 썼다는 이유로 N+1이 사라지거나 안전한 조회가 보장된다고 말하지 않는다. 모든 Entity 필드가 조건 없이 항상 노출된다는 표현도 피한다. 원문은 getter·직렬화 설정과 객체 그래프에 따른 위험을 설명한다.

### P06

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P06-first-crud-api.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P06-first-crud-api.md)

- 시안 질문: 요청 DTO를 첫 CRUD API에 어떻게 연결할까요?
- 대조 결론: K03·K06B-v2 질문과 §3.3~3.6이 맞는다. 질문을 누르면 별도 게시글 CRUD 따라 하기 문서로 이동한다는 설명이 적절하다.
- 근거 줄: 7–20, 102–193, 195–281, 283–302. 관련 제목: §3.3 Entity와 Repository; §3.4 DTO와 Service; §3.5 오류 응답과 Controller; §3.6 curl로 확인.
- 실제 원문 도메인·값: Post(title,content), PostRequest(title,content), PostResponse(id,title,content). POST /api/posts body title="첫 글", content="CRUD 실습" → 201과 Location. 예제의 조회/수정/삭제 curl은 /api/posts/1을 사용. 수정값은 "수정"/"수정 내용". 기본 H2, 별도 mysql profile은 posts DB.
- 구현 시 피할 오인: 현재 community 시나리오와 같은 테이블/프로젝트로 오인시키지 않는다. 이 문서의 테이블은 posts이며 실제 시나리오 post와 다르다. H2 데이터가 MySQL로 자동 이전되지 않는다. 예제 예상값을 현재 사용자의 실행 결과로 표시하지 않는다.

### P02

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P02-mvc-layered-architecture.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P02-mvc-layered-architecture.md)

- 시안 질문: Controller·Service·Repository는 무엇을 맡길까요?
- 대조 결론: K03 질문과 원문이 맞는다. 역할 구분은 HTTP 입출력/유스케이스/저장·조회이며 MVC의 Model·View·Controller와 동일한 세 단계가 아니다.
- 근거 줄: 85–107, 107–213, 296–432, 476–492. 관련 제목: §2.3 MVC와 계층형 구조; §2.4 Controller; §2.5 Service; §2.6 Repository; §2.7 DTO와 Entity; §3.2~3.5.
- 실제 원문 도메인·값: 문서 상단은 게시글 "첫 글"/"수정한 글"과 id=42의 개념 그림이지만, 주 실행 예제는 Memo/MemoCreateRequest/MemoResponse와 POST /api/memos. ConcurrentHashMap+AtomicLong 저장소이며 Memo는 domain record이고 JPA Entity가 아니다. 비교 그림의 MemoResponse(1,"첫 메모")는 두 필드 설명용이고 주 실습 DTO는 id/title/content 세 필드.
- 구현 시 피할 오인: Repository를 언제나 DB·JPA와 동치로 쓰지 않는다. 이 예제에 SQL/commit/실제 MySQL 행이 있다고 붙이지 않는다. MVC Model=Repository라는 설명은 틀리다. 새 예시를 만들더라도 게시글 그림과 Memo 실습을 한 프로그램 실행처럼 혼합하지 않는다.

### P03

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P03-annotations-cheatsheet.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P03-annotations-cheatsheet.md)

- 시안 질문: 선택한 4장에는 이 문서의 개별 질문이 보이지 않음
- 대조 결론: DTO 검색 7건에 포함되는 근거는 §3의 h3 "3단계: 입력 DTO와 컨트롤러 작성"이다. 문서 자체는 애노테이션 메타데이터와 읽는 주체, 웹 매핑·검증·주입 등 광범위한 실무 안내다.
- 근거 줄: 7–99, 153–200. 관련 제목: §2.3 웹 매핑과 입력 위치; §2.4 요청 검증; §3.3단계 입력 DTO와 컨트롤러 작성.
- 실제 원문 도메인·값: 주문 CreateOrderRequest(customerName,email,sku). POST /api/orders with customerName="민수", email="minsu@example.com", sku="BOOK-1" → 201 {accepted:true,sku:"BOOK-1"}. GET /api/orders/10?view=brief → id=10,view=brief.
- 구현 시 피할 오인: DTO 검색에 나오는 이유를 JSON 변환 상세 시각화가 완성돼서라고 설명하지 않는다. @Valid는 starter/검증 실행 경계와 함께 봐야 하며 annotation 자체만으로 임의 코드가 실행되는 것은 아니다.

### P25

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P25-external-api-client.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/P25-external-api-client.md)

- 시안 질문: 선택한 4장에는 이 문서의 개별 질문이 보이지 않음
- 대조 결론: DTO 검색 포함 근거는 h3 "2.4 GET, POST, DTO, 상태 코드"다. 외부 HTTP 응답을 Product 타입으로 읽고 오류·타임아웃을 처리하는 문서이므로 서버의 요청 DTO 바인딩과 역할이 다르다.
- 근거 줄: 15–20, 65–160, 210–246. 관련 제목: §2.3 RestClient 빈 구성; §2.4 GET, POST, DTO, 상태 코드; §3.1 실제 로컬 서버 띄우기.
- 실제 원문 도메인·값: WireMock localhost:8089 GET /products/p-1 → {id:"p-1",name:"Keyboard",price:49000}. PartnerClient.find는 body(Product.class), create는 CreateProduct(name,price)+Idempotency-Key를 사용.
- 구현 시 피할 오인: P16의 소문자 keyboard·quantity=2 주문 예제와 섞지 않는다. 이 예제는 외부 product API의 typed response이며 입력 @RequestBody 변환만 설명하는 문서가 아니다. retrieve만 호출하고 최종 연산 없이 응답을 소비했다고 표시하지 않는다.

### W10

원문: [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/W10-where-to-validate.md](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/docs/knowledge/W10-where-to-validate.md)

- 시안 질문: 선택한 4장에는 이 문서의 개별 질문이 보이지 않음
- 대조 결론: DTO 검색 근거는 h3 "5.2 서버: DTO 제약과 검증 오류 응답" 및 Q5다. 역할별 검증과 동시성 경계가 핵심이다.
- 근거 줄: 7–75, 112–150, 201–280, 307–355. 관련 제목: §3 각 층에서 확인할 것 / 중복 검사와 경쟁 조건; §5.2 서버 DTO 제약과 검증 오류 응답; §5.3 서비스와 DB 안내 검사와 최종 고유성.
- 실제 원문 도메인·값: 회원 SignupRequest(email), POST /users → 201(no body), UserService의 strip/existsByEmail/save, users.email NOT NULL·UNIQUE. 경쟁 예시는 요청 A/B 모두 SELECT email 없음 → INSERT 경쟁. 재고 예시는 조건부 stock 차감이며 고정 주문·재고 수치는 없다.
- 구현 시 피할 오인: existsByEmail 선행 조회만으로 중복 방지가 보장된다고 말하지 않는다. 모든 무결성 오류를 이메일 중복409로 취급하지 않는다. 문서 SQL 예제는 PostgreSQL식 ALTER COLUMN 문법이므로 MySQL에서 그대로 실행 가능하다고 안내하지 않는다.

## 3. 명시적 Markdown 링크로 확인한 관련 항목

대상 문서 10개 자체에는 시나리오·미션으로 가는 로컬 Markdown 링크가 없다. 아래는 scenario/practice/tickets/lessons의 실제 Markdown 링크가 해당 문서를 가리키는 **역방향 근거**다. 제목·기술명 유사성으로 추정한 항목은 포함하지 않았다. lessons는 과제가 아니라 연결된 개념 문서로 따로 적는다. 링크가 특정 소제목을 가리키면 그 href를 그대로 기록한다. 명시 링크가 있다는 사실과 해당 화면의 시각적 구현 완료는 별개다.

### P09

**시나리오**

- 0-1. Java로 첫 API — 타입·변수·클래스·생성자·record — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-1-ts-to-java.md:430](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-1-ts-to-java.md:430); 링크 이름 `P09 Java 문법 기초`; 원문 href `../../docs/knowledge/P09-java-syntax-basics.md`.
- 0-8. Java 선언식으로 API 읽기 — 타입·변수·메서드 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-8-java-types-and-methods.md:155](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-8-java-types-and-methods.md:155); 링크 이름 `P09 Java 문법 기초`; 원문 href `../../docs/knowledge/P09-java-syntax-basics.md`.

**연결된 개념 문서**

- B1. 타입과 변수·메서드 — 타입이 이름 앞에 온다 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B1-types-variables-methods.md:277](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B1-types-variables-methods.md:277); 링크 이름 `P09 Java 문법 기초`; 원문 href `../docs/knowledge/P09-java-syntax-basics.md`.
- B2. 클래스·객체·생성자·this — 객체를 찍어 내는 틀 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B2-classes-objects-constructors.md:247](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B2-classes-objects-constructors.md:247); 링크 이름 `P09 Java 문법 기초`; 원문 href `../docs/knowledge/P09-java-syntax-basics.md`.

### P04

**시나리오**

- 0-1. Java로 첫 API — 타입·변수·클래스·생성자·record — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-1-ts-to-java.md:431](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-1-ts-to-java.md:431); 링크 이름 `P04 생성자와 빌더`; 원문 href `../../docs/knowledge/P04-constructors-builder.md`.
- 0-4. DTO 만들기 — record·static·기본 생성자 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:363](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:363); 링크 이름 `P04 생성자와 빌더`; 원문 href `../../docs/knowledge/P04-constructors-builder.md`.
- 0-7. Lombok DTO — 생성된 메서드와 JSON 확인 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-7-lombok-dto.md:150](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-7-lombok-dto.md:150); 링크 이름 `P04 생성자와 빌더`; 원문 href `../../docs/knowledge/P04-constructors-builder.md`.

**연결된 개념 문서**

- B2. 클래스·객체·생성자·this — 객체를 찍어 내는 틀 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B2-classes-objects-constructors.md:248](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B2-classes-objects-constructors.md:248); 링크 이름 `P04 객체 생성 — 생성자·정적 팩토리·Builder`; 원문 href `../docs/knowledge/P04-constructors-builder.md`.

### P29

**시나리오**

- 0-4. DTO 만들기 — record·static·기본 생성자 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:362](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:362); 링크 이름 `P29 static 완전 정리`; 원문 href `../../docs/knowledge/P29-static-complete.md`.

**연결된 개념 문서**

- B3. static과 안쪽 클래스 — DTO 함정의 뿌리 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B3-static-and-inner-classes.md:328](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B3-static-and-inner-classes.md:328); 링크 이름 `P29 static 완전 정리`; 원문 href `../docs/knowledge/P29-static-complete.md`.

### P16

**시나리오**

- 0-3. 요청의 네 자리 — 경로·쿼리·헤더·본문 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-3-request-four-places.md:408](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-3-request-four-places.md:408); 링크 이름 ``P16 JSON·Jackson — `@RequestBody`가 동작하는 지점``; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#22-requestbody가-동작하는-지점`.
- 0-4. DTO 만들기 — record·static·기본 생성자 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:360](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:360); 링크 이름 `P16 — 생성 규칙: getter, 생성자, record`; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#25-생성-규칙-getter-생성자-record`.
- 1-1. 요청 받기 — 일단 success — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-1-receive-request.md:400](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-1-receive-request.md:400); 링크 이름 ``P16 JSON·Jackson — `@RequestBody`가 동작하는 지점``; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#22-requestbody가-동작하는-지점`.
- 1-1. 요청 받기 — 일단 success — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-1-receive-request.md:401](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-1-receive-request.md:401); 링크 이름 `P16 — 요청과 응답은 DTO로 고정한다`; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#21-요청과-응답은-dto로-고정한다`.
- 1-2. DB에 저장하고 201로 응답 — JPA 첫걸음 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-2-dto-response.md:811](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-2-dto-response.md:811); 링크 이름 `P16 — 날짜·시간은 "문자열"이 아니라 계약이다`; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#26-날짜시간은-문자열이-아니라-계약이다`.
- 1-5. 입력 검증과 에러 응답 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:861](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:861); 링크 이름 `P16 — Enum은 이름과 표시값을 분리한다`; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#27-enum은-이름과-표시값을-분리한다`.
- 10-2. 공통 응답 틀과 전역 예외 처리 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-2-common-response.md:530](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-2-common-response.md:530); 링크 이름 `P16 JSON·Jackson`; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md`.
- 3-1. 부분 수정(PATCH)과 본인 확인 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch3-update-delete/3-1-patch.md:894](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch3-update-delete/3-1-patch.md:894); 링크 이름 `P16 — 알 수 없는 필드는 API 진화 정책으로 결정한다`; 원문 href `../../docs/knowledge/P16-json-jackson-practical.md#28-알-수-없는-필드는-api-진화-정책으로-결정한다`.

**실전 티켓**

- T-002. 글 상세에 '수정됨' 표시 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/002-post-edited-flag.md:205](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/002-post-edited-flag.md:205); 링크 이름 `P16 JSON·Jackson 실무`; 원문 href `../docs/knowledge/P16-json-jackson-practical.md`.

**연결된 개념 문서**

- A2. HTTP 해부 — 요청·응답 글을 칸별로 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/A2-http-anatomy.md:256](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/A2-http-anatomy.md:256); 링크 이름 `P16 JSON과 Jackson 실전`; 원문 href `../docs/knowledge/P16-json-jackson-practical.md`.
- B3. static과 안쪽 클래스 — DTO 함정의 뿌리 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B3-static-and-inner-classes.md:330](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B3-static-and-inner-classes.md:330); 링크 이름 `P16 JSON·Jackson 실무`; 원문 href `../docs/knowledge/P16-json-jackson-practical.md`.
- B4. record·getter·불변 — DTO가 record인 이유 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B4-record-getter-immutable.md:283](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B4-record-getter-immutable.md:283); 링크 이름 `P16 JSON·Jackson 실무`; 원문 href `../docs/knowledge/P16-json-jackson-practical.md`.
- D1. JSON과 Jackson — 본문이 객체가 되기까지 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/D1-json-jackson.md:314](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/D1-json-jackson.md:314); 링크 이름 `P16 JSON·Jackson 실무`; 원문 href `../docs/knowledge/P16-json-jackson-practical.md`.

### W09

**시나리오**

- 0-3. 요청의 네 자리 — 경로·쿼리·헤더·본문 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-3-request-four-places.md:410](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-3-request-four-places.md:410); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 0-4. DTO 만들기 — record·static·기본 생성자 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:361](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-4-dto-rules.md:361); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 1-2. DB에 저장하고 201로 응답 — JPA 첫걸음 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-2-dto-response.md:809](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-2-dto-response.md:809); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 10-3. 회원 가입 — BCrypt 해시와 이메일 중복 409 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-3-signup.md:367](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-3-signup.md:367); 링크 이름 `W09`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 2-1. 단건 조회와 404 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch2-read-post/2-1-get-one.md:395](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch2-read-post/2-1-get-one.md:395); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 2-2. 게시판 목록과 페이징 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch2-read-post/2-2-board-list.md:453](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch2-read-post/2-2-board-list.md:453); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 5-3. 댓글 목록과 삭제 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch5-comment/5-3-comment-list-delete.md:555](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch5-comment/5-3-comment-list-delete.md:555); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 9-3. 컬럼 추가와 백필 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch9-schema-change/9-3-add-column-backfill.md:465](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch9-schema-change/9-3-add-column-backfill.md:465); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.
- 9-5. 서비스를 멈추지 않는 이름 변경 — expand와 contract — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch9-schema-change/9-5-expand-contract.md:495](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch9-schema-change/9-5-expand-contract.md:495); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../../docs/knowledge/W09-why-dto.md`.

**실전 티켓**

- T-001. 게시판 목록 API — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/001-board-list-api.md:162](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/001-board-list-api.md:162); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- T-002. 글 상세에 '수정됨' 표시 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/002-post-edited-flag.md:203](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/002-post-edited-flag.md:203); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- T-007. 글 대표 이미지 주소 컬럼 추가 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/007-post-thumbnail.md:200](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/007-post-thumbnail.md:200); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- T-008. 알림 목록에 글 제목 넣기 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/008-notification-post-title.md:172](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/008-notification-post-title.md:172); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- T-011. 회원 프로필 API — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/011-member-profile-api.md:192](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/011-member-profile-api.md:192); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- T-014. 글 목록에 내 좋아요·북마크 표시 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/014-list-liked-bookmarked-by-me.md:178](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/014-list-liked-bookmarked-by-me.md:178); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- T-030. 엔티티가 컨트롤러까지 새어 나온다 — 서비스가 응답을 만들게 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/030-entity-out-of-controller.md:145](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/030-entity-out-of-controller.md:145); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.

**연결된 개념 문서**

- B4. record·getter·불변 — DTO가 record인 이유 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B4-record-getter-immutable.md:282](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B4-record-getter-immutable.md:282); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- D1. JSON과 Jackson — 본문이 객체가 되기까지 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/D1-json-jackson.md:314](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/D1-json-jackson.md:314); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- E4. JPA 연관관계 첫걸음 — 글·작성자·태그·댓글을 잇기 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/E4-jpa-associations.md:385](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/E4-jpa-associations.md:385); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- E6. 저장소 메서드 만들기 — 이름으로 쿼리·@Query·페이지 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/E6-repository-methods.md:528](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/E6-repository-methods.md:528); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.
- G1. 페이징과 정렬 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/G1-paging-and-sorting.md:272](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/G1-paging-and-sorting.md:272); 링크 이름 `W09 DTO는 왜 쓰나`; 원문 href `../docs/knowledge/W09-why-dto.md`.

### P06

명시적 연결 없음. P06 자체 CRUD 따라 하기만 원문 내부 실습으로 안내할 수 있다.

### P02

**시나리오**

- 1-3. 서비스로 나누기 — 태그까지 한 트랜잭션으로 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-3-service-layer.md:833](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-3-service-layer.md:833); 링크 이름 `P02 MVC 패턴과 계층형 구조`; 원문 href `../../docs/knowledge/P02-mvc-layered-architecture.md`.
- 1-9. 글의 태그 목록 조회 — 제네릭과 Stream — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-9-list-post-tags.md:168](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-9-list-post-tags.md:168); 링크 이름 `P02 계층형 아키텍처`; 원문 href `../../docs/knowledge/P02-mvc-layered-architecture.md`.

### P03

**시나리오**

- 0-2. 어노테이션은 무엇인가 — 떼어 보면 404 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-2-annotations.md:262](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-2-annotations.md:262); 링크 이름 `P03 애노테이션 — 웹 매핑과 입력 위치`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치`.
- 0-3. 요청의 네 자리 — 경로·쿼리·헤더·본문 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-3-request-four-places.md:407](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch0-first-steps/0-3-request-four-places.md:407); 링크 이름 `P03 애노테이션 — 웹 매핑과 입력 위치`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치`.
- 1-1. 요청 받기 — 일단 success — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-1-receive-request.md:399](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-1-receive-request.md:399); 링크 이름 `P03 애노테이션 — 웹 매핑과 입력 위치`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치`.
- 1-3. 서비스로 나누기 — 태그까지 한 트랜잭션으로 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-3-service-layer.md:835](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-3-service-layer.md:835); 링크 이름 `P03 — 생성자 주입과 빈 선택`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#22-생성자-주입과-빈-선택`.
- 1-5. 입력 검증과 에러 응답 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:859](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:859); 링크 이름 `P03 — 요청 검증`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증`.
- 1-5. 입력 검증과 에러 응답 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:859](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:859); 링크 이름 `예외 응답`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#25-예외-응답`.
- 1-9. 글의 태그 목록 조회 — 제네릭과 Stream — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-9-list-post-tags.md:169](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-9-list-post-tags.md:169); 링크 이름 `P03 애노테이션 — 웹 매핑과 입력 위치`; 원문 href `../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치`.

**연결된 개념 문서**

- B8. 어노테이션은 무엇인가 — 붙여 둔 표시, 읽는 쪽은 따로 있다 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B8-annotations.md:283](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/B8-annotations.md:283); 링크 이름 `P03 애노테이션이란 — 실무에서 매일 쓰는 것 총정리`; 원문 href `../docs/knowledge/P03-annotations-cheatsheet.md`.
- F1. 검증과 에러 응답(ProblemDetail) — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:260](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:260); 링크 이름 `P03 — 요청 검증`; 원문 href `../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증`.
- F1. 검증과 에러 응답(ProblemDetail) — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:260](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:260); 링크 이름 `예외 응답`; 원문 href `../docs/knowledge/P03-annotations-cheatsheet.md#25-예외-응답`.
- F6. 입력 검증 실전 — null·빈 값·길이, 400과 500이 갈리는 곳 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F6-validation-in-practice.md:293](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F6-validation-in-practice.md:293); 링크 이름 `P03 — 요청 검증`; 원문 href `../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증`.

### P25

**시나리오**

- 16-4. 링크 미리보기 — 외부 사이트가 느려도 2초만 기다리기 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch16-events-async-cache/16-4-link-preview.md:2978](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch16-events-async-cache/16-4-link-preview.md:2978); 링크 이름 `P25 — RestClient 빈 구성`; 원문 href `../../docs/knowledge/P25-external-api-client.md#23-restclient-빈-구성`.
- 16-4. 링크 미리보기 — 외부 사이트가 느려도 2초만 기다리기 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch16-events-async-cache/16-4-link-preview.md:2979](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch16-events-async-cache/16-4-link-preview.md:2979); 링크 이름 `P25 — connect timeout과 read timeout은 왜 둘 다 필요한가?`; 원문 href `../../docs/knowledge/P25-external-api-client.md#q3-connect-timeout과-read-timeout은-왜-둘-다-필요한가`.

**연결된 개념 문서**

- H8. 외부 HTTP 호출 — RestClient와 타임아웃 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/H8-rest-client-timeout.md:253](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/H8-rest-client-timeout.md:253); 링크 이름 `P25 — RestClient 빈 구성`; 원문 href `../docs/knowledge/P25-external-api-client.md#23-restclient-빈-구성`.
- H8. 외부 HTTP 호출 — RestClient와 타임아웃 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/H8-rest-client-timeout.md:254](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/H8-rest-client-timeout.md:254); 링크 이름 `P25 — connect timeout과 read timeout은 왜 둘 다 필요한가?`; 원문 href `../docs/knowledge/P25-external-api-client.md#q3-connect-timeout과-read-timeout은-왜-둘-다-필요한가`.

### W10

**시나리오**

- 1-5. 입력 검증과 에러 응답 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:856](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:856); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 1-5. 입력 검증과 에러 응답 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:857](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch1-create-post/1-5-validation.md:857); 링크 이름 `W10 — 서버: DTO 제약과 검증 오류 응답`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답`.
- 10-3. 회원 가입 — BCrypt 해시와 이메일 중복 409 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-3-signup.md:1121](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-3-signup.md:1121); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 10-5. 게시글 작성 — JPA, 검증 규칙·태그·작성자는 토큰 주인 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-5-create-post.md:359](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch10-project/10-5-create-post.md:359); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 12-6. 신고하기 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch12-community-features/12-6-report.md:692](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch12-community-features/12-6-report.md:692); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 13-4. 금칙어 필터 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch13-operations/13-4-banned-words.md:1416](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch13-operations/13-4-banned-words.md:1416); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 14-2. 글 투표 — 한 사람 한 표 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch14-more-with-posts/14-2-polls.md:2698](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch14-more-with-posts/14-2-polls.md:2698); 링크 이름 `W10 — 서비스와 DB: 안내 검사와 최종 고유성`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성`.
- 14-3. 공지·상단 고정 글 — 게시판마다 3개까지 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch14-more-with-posts/14-3-pinned-posts.md:2124](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch14-more-with-posts/14-3-pinned-posts.md:2124); 링크 이름 `W10 — 각 층에서 확인할 것`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#각-층에서-확인할-것`.
- 14-4. 시리즈(연재) — 글 묶기와 이전/다음 글 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch14-more-with-posts/14-4-series.md:3111](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch14-more-with-posts/14-4-series.md:3111); 링크 이름 `W10 — 각 층에서 확인할 것`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#각-층에서-확인할-것`.
- 2-2. 게시판 목록과 페이징 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch2-read-post/2-2-board-list.md:454](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch2-read-post/2-2-board-list.md:454); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 3-1. 부분 수정(PATCH)과 본인 확인 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch3-update-delete/3-1-patch.md:893](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch3-update-delete/3-1-patch.md:893); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 5-1. 댓글 작성 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch5-comment/5-1-create-comment.md:665](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch5-comment/5-1-create-comment.md:665); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../../docs/knowledge/W10-where-to-validate.md`.
- 5-2. 답글(1단계까지) — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch5-comment/5-2-reply.md:558](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch5-comment/5-2-reply.md:558); 링크 이름 `W10 — 서비스와 DB: 안내 검사와 최종 고유성`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성`.
- 6-2. 폴더 — 최대 10개, 이름 중복 불가 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch6-bookmark/6-2-folders.md:1116](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch6-bookmark/6-2-folders.md:1116); 링크 이름 `W10 — 서비스와 DB: 안내 검사와 최종 고유성`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성`.
- 6-2. 폴더 — 최대 10개, 이름 중복 불가 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch6-bookmark/6-2-folders.md:1117](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/scenario/ch6-bookmark/6-2-folders.md:1117); 링크 이름 `W10 — 중복 검사와 경쟁 조건`; 원문 href `../../docs/knowledge/W10-where-to-validate.md#중복-검사와-경쟁-조건`.

**실전 티켓**

- T-003. 게시판 글 목록 정렬 옵션 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/003-board-list-sort.md:178](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/003-board-list-sort.md:178); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.
- T-004. 아주 큰 페이지 번호에 엉뚱한 글·500 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/004-huge-page-number.md:177](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/004-huge-page-number.md:177); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.
- T-005. 닉네임 변경 API — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/005-change-nickname.md:206](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/005-change-nickname.md:206); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.
- T-006. 태그 입력 정리(#·공백·대소문자) — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/006-normalize-tags.md:200](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/006-normalize-tags.md:200); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.
- T-009. 태그에 null이 섞이면 500 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/009-null-tag-500.md:188](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/009-null-tag-500.md:188); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.
- T-013. 운영자 글 숨김·복구 API — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/013-admin-hide-post.md:244](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/tickets/013-admin-hide-post.md:244); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.

**연결된 개념 문서**

- F1. 검증과 에러 응답(ProblemDetail) — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:257](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:257); 링크 이름 `W10 검증은 어디서 하나`; 원문 href `../docs/knowledge/W10-where-to-validate.md`.
- F1. 검증과 에러 응답(ProblemDetail) — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:258](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F1-validation-errors.md:258); 링크 이름 `W10 — 서버: DTO 제약과 검증 오류 응답`; 원문 href `../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답`.
- F6. 입력 검증 실전 — null·빈 값·길이, 400과 500이 갈리는 곳 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F6-validation-in-practice.md:292](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F6-validation-in-practice.md:292); 링크 이름 `W10 — 서버: DTO 제약과 검증 오류 응답`; 원문 href `../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답`.
- F6. 입력 검증 실전 — null·빈 값·길이, 400과 500이 갈리는 곳 — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F6-validation-in-practice.md:292](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F6-validation-in-practice.md:292); 링크 이름 `서비스와 DB: 안내 검사와 최종 고유성`; 원문 href `../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성`.
- F8. 요청 수 제한·도배 방지 — 429와 Retry-After — [/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F8-rate-limiting.md:260](/Users/ds/code/javaExperience/.worktrees/visual-learning-next/lessons/F8-rate-limiting.md:260); 링크 이름 `W10 — 중복 검사와 경쟁 조건`; 원문 href `../docs/knowledge/W10-where-to-validate.md#중복-검사와-경쟁-조건`.

## 4. 보존 확인과 한계

- 보존 기준 파일: `/Users/ds/research/javaExperience-chatgpt-design-handoff-2026-10-18/_data/preservation-baseline.json`.
- 기준의 Markdown 135개를 SHA-256으로 대조: 변경 0개.
- h1~h3 목록과 위 관련 본문을 읽었으며, 문서의 모든 코드/각 세부절을 실행하거나 기술적으로 재검증한 것은 아니다.
- 문서에 과거 실행 출력이 있다고 쓰인 부분은 “원문에 기록된 출력”으로만 취급했다. 이번 조사에서 실행한 출력이 아니다.
- 관련 링크는 현재 Markdown 파일의 명시 링크를 열거한 결과다. 시안의 추천 관계는 별도 편집 판단이며 명시적 출처와 혼용하지 않는다.
- 최종 분류표·나머지 화면·실제 브라우저 렌더 및 학습자의 이해도는 이번 검토 대상이 아니다.
