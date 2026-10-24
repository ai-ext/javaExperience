# 06. Spring 실무 기본기 16개 주제: 시나리오에서 "겪게" 만들 소재와 근거

조사일: 2026-10-22. 대상: 3~6년차 수준의 Java/Spring Boot 백엔드 온보딩(게시판 신규 구축 후 어수선한 서버 유지보수·고도화).

> 14~16절(빈 생명주기·application.yml·JPA/MyBatis)은 추가 요청으로 보강했다.

## 0. 읽는 법

- 출처는 이번 조사에서 **실제로 열어 본 페이지**만 `[확인]`으로 표기했다. 검색 결과에서 제목·URL만 보고 본문은 읽지 못한 것은 `[검색결과만]`으로 구분했고, 사실 주장의 근거로는 쓰지 않았다.
- "흔한 실수 → 깨지는 것"은 출처가 말한 것과 내 추론을 구분했다. 추론에는 `(추론)`을 붙였다.
- Spring 공식 문서 중 Spring Boot 문서는 조사 시점 기준 4.1.x 페이지였다. 팀이 쓰는 Boot 버전과 다를 수 있으니 시나리오 작성 전 버전을 맞춰 재확인해야 한다.
- 시나리오 아이디어는 "설계"가 아니라 소재 제안이다. 게시판 도메인(게시글/댓글/회원/첨부/알림)에 얹는 것을 가정했다.

### 전체 관통 제안: "깨뜨리고, 증상에서 거꾸로 찾게 하기"

13개 주제 대부분은 "규칙을 알려 주는 것"보다 "**규칙을 어긴 어수선한 서버를 넘겨주고, 증상이 터지는 순간을 겪게 하는 것**"이 체득에 낫다. 아래 각 주제의 아이디어는 같은 레거시 게시판 서버 하나에 결함을 심어 두는 방식으로 합칠 수 있다(결함 지도는 17절).

---

## 1. 빈 vs static, 싱글톤 상태 공유, 빈 스코프

### 실무 기준/관례
- 컨테이너가 관리해야 하는 협력 객체(DB·외부 호출·정책·트랜잭션이 걸리는 것)는 빈으로, 입력만 받아 결과를 돌려주는 순수 함수(포맷팅·계산)는 static 유틸로 둔다. 빈이어야 하는 이유는 DI·AOP(트랜잭션, 보안)·테스트 대체가 되기 때문이다. `@Service`는 `@Component`의 특수화이며 도구와 aspect가 계층을 구분하는 데 쓰이고 "`@Component`와 `@Service` 사이에서는 `@Service`가 더 낫다"고 공식 문서가 말한다 `[확인]` Spring Framework 공식 classpath-scanning.
- 기본 스코프는 singleton이다. "싱글톤 스코프가 Spring의 기본 스코프"이며, singleton 빈이 prototype 빈에 의존하면 **주입은 생성 시점에 딱 한 번**이라 prototype의 새 인스턴스가 계속 공급되지 않는다 `[확인]` Spring Framework 공식 factory-scopes. 필요하면 `ObjectProvider`/메서드 주입을 쓴다.
- Google Java Style은 `static final`이라도 **깊은 불변(deeply immutable)** 일 때만 상수로 취급한다. 가변 객체를 `static final`에 둬도 상수가 아니다 `[확인]` Google Java Style 5절.

### 흔한 실수와 결과
- 싱글톤 빈의 인스턴스 필드에 요청별 값을 담는다. 읽기만 하면 안전하나 쓰는 순간 요청 간에 덮어쓴다. 간헐적이고 운영 부하에서만 재현되는 형태가 많다. (일반론: 국내 강의·개인 블로그 다수가 다루지만 이번에는 공신력 있는 단일 출처로 확인하지 못함. 아래 컬리 사례가 대신하는 실사례)
- 스레드 안전하지 않은 객체를 공유한다. **컬리 사례** `[확인]`: 공통 암호화 SDK에서 캐시(Caffeine)에 둔 Data Key 응답의 평문 `ByteBuffer`를 여러 요청 스레드가 공유했다. 1:1 문의에서 일부 요청만 `newPosition > limit` 예외가 나고 고객 화면에 마스킹된 전화번호 대신 빈 칸이 보였다. 100개 스레드 테스트에서 `clear()` 직후여야 할 position이 일부 스레드에서 32로 관찰됐다. 해결은 `synchronized`(성능 저하로 제외) 대신 `duplicate()`로 스레드별 독립 뷰를 만드는 것이었다. 글은 그 객체가 싱글톤 빈인지 static인지는 명시하지 않았다 — "공유되는 가변 객체"라는 본질만 확인된다.
- prototype 빈을 singleton에 주입해 놓고 요청마다 새로 생긴다고 믿는다(위 공식 문서).

### 시나리오로 체득시킬 방법
1. **"주문 금액 섞임" 재현형**: 레거시 `PostViewService`가 `private int currentViewCount`, `private SimpleDateFormat fmt`를 필드로 가진다. 부하 스크립트(스레드 N개)로 조회수·날짜가 섞이는 것을 먼저 **보게** 한 뒤 "왜 운영에서만 나오나"를 묻는다. 수정 후 같은 스크립트가 통과해야 완료. (`SimpleDateFormat`의 스레드 비안전성은 JDK 문서 사실이지만 이번 조사에서는 블로그 검색결과만 있어 `[검색결과만]`; 시나리오 작성 시 JDK Javadoc으로 확인할 것)
2. **스코프 함정**: 요청 컨텍스트를 담는 prototype/request 빈을 singleton에 주입해 둔 코드를 디버거로 열어 "같은 인스턴스 id"를 직접 확인하게 한다.

### 출처
- https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html `[확인]`
- https://docs.spring.io/spring-framework/reference/core/beans/classpath-scanning.html `[확인]`
- https://helloworld.kurly.com/blog/concurrency-issue-solving/ `[확인]` 컬리
- https://google.github.io/styleguide/javaguide.html `[확인]`

---

## 2. 의존성 주입: 생성자 vs 필드, `@RequiredArgsConstructor`

### 실무 기준/관례
- Spring 팀은 생성자 주입을 일반적으로 권장한다: "불변 객체로 컴포넌트를 만들 수 있고 필수 의존성이 null이 아님을 보장"하기 때문. 필수는 생성자, 선택은 setter `[확인]` Spring Framework 공식 factory-collaborators.
- 필드 주입 반대 논거(Oliver Drotbohm, Spring 팀) `[확인]`: ① 협력 객체 없이 객체를 만들 수 있어 "기본값부터 깨진" 객체가 된다(런타임 NPE) ② public 생성자가 의존성을 드러내지 않는다 ③ 테스트에서 리플렉션으로 private 필드에 mock을 꽂아야 한다 ④ 의존성이 조용히 늘어도 티가 안 난다(생성자가 길어지면 분리 신호) ⑤ `final`로 불변·필수/선택 구분이 안 된다.
- Lombok `@RequiredArgsConstructor`는 **초기화되지 않은 `final` 필드와 `@NonNull` 필드**에 대한 생성자를 선언 순서대로 만든다 `[확인]` Lombok 공식. 우아한형제들 신입 코드리뷰 회고도 "`@Autowired` 필드 주입 대신 생성자 주입, 인자가 많으면 롬복을 쓰되 필드 순서 변경의 영향을 고려"를 반복 지적으로 꼽았다 `[확인]`.

### 흔한 실수와 결과
- 생성자 주입이면 **순환 참조를 컨텍스트 기동 시점에** `BeanCurrentlyInCreationException`으로 드러낸다 `[확인]` 공식 문서. 필드/세터 주입은 순환이 가능은 하지만 권장되지 않는다(공식 문서) — 즉 설계 문제를 숨긴 채 운영까지 간다.
- 필드 주입 클래스를 `new`로 만들어 단위 테스트하면 의존성이 null이라 NPE (Drotbohm).
- `@RequiredArgsConstructor` + 같은 타입 두 개 필드 순서 바꿈: 생성자 파라미터 순서가 바뀌어 컴파일은 통과하는 오배선 가능성 (추론; 우아한형제들 리뷰가 "필드 순서 변경의 영향"을 언급한 것과 같은 맥락).
- 같은 타입 빈이 여러 개일 때 후보 선택은 `@Primary`/`@Priority`/이름 순이며 `@Qualifier`가 `@Primary`보다 우선한다는 카카오페이 글의 실험 결과가 있다 `[확인]` (글은 특정 버전 기준이므로 재확인 권고).

### 시나리오로 체득시킬 방법
1. **"순환 고치기"**: `PostService <-> CommentService`가 필드 주입으로 서로 부르는 레거시를 준다. 먼저 `spring.main.allow-circular-references` 동작/미동작을 확인한 뒤, 생성자 주입으로 바꾸면 기동이 실패하는 것을 **겪고**, 책임 분리(이벤트·제3 서비스)로 푼다. (Boot의 순환 참조 기본 허용 여부는 버전별 차이를 확인해야 함 — 확인 불가 절 참조)
2. **mock 꽂기 대결**: 같은 서비스를 필드 주입본/생성자 주입본으로 두고 단위 테스트를 쓰게 해 비용 차이를 체감시킨다.

### 출처
- https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html `[확인]`
- https://odrotbohm.de/2013/11/why-field-injection-is-evil/ `[확인]` (구 olivergierke.de에서 301)
- https://projectlombok.org/features/constructor `[확인]`
- https://techblog.woowahan.com/2614/ `[확인]` 우아한형제들 코드리뷰 적응기
- https://tech.kakaopay.com/post/martin-dev-honey-tip-2/ `[확인]` 카카오페이

---

## 3. 레이어·책임, 서비스 비대화, 패키지 구조

### 실무 기준/관례
- 계층 책임: Controller=요청 변환·검증·응답, Service=유스케이스·트랜잭션 경계, Repository=영속. `@Repository`는 예외 변환 대상이기도 하다 `[확인]` classpath-scanning 문서.
- 서비스 분리 사례(우아한형제들 정산 신입 회고) `[확인]`: 비즈니스 로직 서비스와 **조회 전용 서비스를 분리**해 `readOnly`를 메서드마다 붙이는 비효율을 없앴고, 엔티티→서비스 DTO→프레젠테이션 DTO 반복 포장을 QueryDSL 직접 조회로 바꿔 300줄 이상 제거. 리뷰어는 "애플리케이션 결합만 보지 말고 join으로 인한 **데이터 레이어 결합**도 보라"고 짚었다.
- 도메인 비대화 대응(우아한형제들 도메인 모듈 분리 글) `[확인]`: 연관관계 엔티티·join 제거, "엔티티를 외부로 반환하지 않고 다른 도메인의 리포지토리를 직접 쓰지 않는" 규칙, 모듈 간 **port(인터페이스)만 노출, adapter는 각 도메인 내부**, **ArchUnit**으로 규칙 강제, 영향 API 231개라 피처 플래그로 10→50→100% 점진 배포.
- 이벤트 분리(우아한형제들 회원시스템) `[확인]`: 내부 이벤트는 도메인 주 행위에서 부가 정책을 분리하는 것이 목적. `@TransactionalEventListener`는 기본 `AFTER_COMMIT`이고 트랜잭션이 없으면 리스너가 호출되지 않는다(`fallbackExecution`으로 변경) `[확인]` Spring 공식. 이벤트 발행을 트랜잭션 안에 두면 메시징 장애가 도메인 장애가 되고, 밖에 두면 발행 보장이 사라져 Outbox를 도입했다. 이벤트는 "무엇을 하라"가 아니라 "무엇이 일어났다".
- 패키지 구조: 계층형(controller/service/repository) vs 도메인형(`post/…`, `member/…`) 중 **우아한형제들 멀티모듈 글은 "모든 공통을 common에 몰아넣어 스파게티가 됐다"**며 역할·책임 경계로 모듈을 나누고 의존은 위→아래 단방향, 도메인 모듈과 내부 모듈은 서로 의존하지 않는다고 정리했다 `[확인]`. (단일 모듈 게시판의 패키지 구조 논쟁에 직접 맞는 기업 글은 이번 조사에서 확인 못 함)

### 흔한 실수와 결과
- 서비스 한 클래스에 조회·명령·알림·권한이 모두 들어가 테스트·변경이 서로 간섭 (추론; 위 도메인 분리 글의 "기능 하나 수정하려고 무관한 코드까지 봐야 한다"가 같은 현상).
- Service에서 외부 API 호출까지 같이 해 트랜잭션이 길어짐(7절 참조).
- 오케스트레이션 모듈이 다시 비대해짐: 도메인 분리 글이 같은 우려를 명시.

### 시나리오로 체득시킬 방법
1. **"게시글 등록 서비스 800줄"**: 등록 시 알림·조회수·검색 색인·포인트가 한 메서드에 있다. 신규 요구(알림 채널 추가)를 넣으려 할 때 어디가 깨지는지 겪게 한 뒤 도메인 이벤트로 분리, `AFTER_COMMIT` 리스너에서 DB 쓰기가 필요한 경우의 문제까지 확장.
2. **ArchUnit 경계 테스트**: "controller가 repository를 직접 참조하지 않는다" 규칙을 테스트로 주고 위반 코드를 찾아 고치게 한다.

### 출처
- https://techblog.woowahan.com/7828/ `[확인]`
- https://techblog.woowahan.com/22151/ `[확인]`
- https://techblog.woowahan.com/7835/ `[확인]`
- https://techblog.woowahan.com/2637/ `[확인]`
- https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html `[확인]`

---

## 4. DTO/Entity 경계, 캡슐화, OSIV

### 실무 기준/관례
- 엔티티: `@Data` 지양, setter 대신 **도메인 메서드**, 기본 생성자는 `protected`(JPA 프록시용), 상태 플래그는 문자열 대신 boolean/enum, 표시 포맷(날짜 등)은 엔티티가 아니라 응답 DTO에서 `[확인]` 우아한형제들 코드리뷰 적응기(2614).
- DTO는 **용도별로 분리**(목록용/엑셀용처럼 필드가 조금만 달라도), 사용 범위에 맞는 패키지에 둔다. 요청 DTO는 원시 타입 대신 래퍼로 null을 구분 `[확인]` 같은 글.
- 생성자 검증: "객체 상태 훼손"을 막는 검증은 생성자로(유효하지 않은 주문으로 지급금 생성 금지) `[확인]` 우아한형제들 정산 회고(7828). 양방향 객체 참조를 끊고 ID 참조로 바꾸는 선택도 소개되었으나 글쓴이 스스로 최선인지 확신하지 못한다고 밝힘.
- OSIV: Spring Boot는 **웹 앱에서 기본으로 `OpenEntityManagerInViewInterceptor`를 등록**한다. 원하지 않으면 `spring.jpa.open-in-view=false` `[확인]` Spring Boot 공식(data/sql). 같은 문서는 별도 경고 문구는 두지 않았다.

### 흔한 실수와 결과
- 엔티티를 그대로 응답: 비밀번호 해시 등 필드 노출, 엔티티 구조 변경이 곧 API 스펙 변경, 양방향 연관에서 Jackson 순환·지연 로딩 프록시 직렬화 예외 (영문 Medium 글들의 공통 설명이나 이번엔 공신력 낮아 `[검색결과만]`; 시나리오에서 직접 터뜨려 확인하는 쪽을 권장).
- OSIV를 끄면 트랜잭션 밖 지연 로딩에서 `LazyInitializationException`. 반대로 켜 두면 요청 전체 동안 영속성 컨텍스트·커넥션을 쥔다는 설명이 다수 있으나(Medium 검색결과) 기업 1차 출처는 이번 조사에서 읽지 못했다 → 확인 불가 절.
- Lombok 때문에 `toString`/`hashCode`가 지연 로딩 연관을 건드려 `LazyInitializationException` 또는 StackOverflow가 나는 사례를 강남언니가 다룬다 `[검색결과만]`: https://blog.gangnamunni.com/post/hibernate_lombok_lazy/
- 생성자 기반 Projection은 필드 순서가 어긋나도 컴파일 에러 없이 조용히 잘못 매핑될 수 있다 `[확인]` 우아한형제들 정산 회고(7828).

### 시나리오로 체득시킬 방법
1. **응답에 엔티티를 그대로 내는 레거시 `GET /posts/{id}`**: 회원 엔티티의 `password`가 JSON에 나오는 것을 curl로 확인 → 양방향 `Post<->Comment`로 순환 터뜨리기 → DTO로 끊기. 이어서 `open-in-view=false`로 바꿔 `LazyInitializationException`을 의도적으로 겪고 fetch join/DTO 조회로 해결.
2. **setter 전수 제거 리팩토링**: 엔티티 `setStatus("DELETED")`가 서비스 여기저기 흩어진 코드를 `post.delete()` 같은 도메인 메서드로 모으고, 상태 전이 규칙(이미 삭제된 글 재삭제 불가)을 한곳에 둔다.

### 출처
- https://docs.spring.io/spring-boot/reference/data/sql.html `[확인]`
- https://techblog.woowahan.com/2614/ `[확인]`
- https://techblog.woowahan.com/7828/ `[확인]`
- https://blog.gangnamunni.com/post/hibernate_lombok_lazy/ `[검색결과만]`

---

## 5. 네이밍·코드 컨벤션

### 공개된 컨벤션 (본문 확인한 것)
- **네이버 캠퍼스 핵데이 Java 컨벤션** `[확인]`: UTF-8/LF, 클래스 UpperCamel, 메서드·변수 lowerCamel, 상수 UPPER_SNAKE, 패키지 소문자, 임시 변수 외 한 글자 이름 금지, **한국어 발음 영문 표기 금지**, 와일드카드 import는 static에서만, 줄 120자, 들여쓰기는 **탭(너비 4)**, 한 줄 조건문도 중괄호. 부록에 Checkstyle·.editorconfig·IDE 설정이 있다.
- **우아한테크코스 Java 스타일** `[확인]`: Google Java Style 기반, 달라진 부분만 명시(들여쓰기 4칸, 열 제한 120자, 줄바꿈 이어쓰기 8칸 이상). IntelliJ 설정 파일 `intellij-java-wooteco-style.xml` 제공.
- **Google Java Style** `[확인]`: 패키지 소문자 무밑줄, 클래스는 명사, 메서드는 동사, 테스트 클래스는 `Test`로 끝, 약어도 일반 단어처럼(`XmlHttpRequest`), **잡은 예외를 조용히 무시하지 말 것**(로그/재던지기, 정말 비우려면 사유 주석).
- 주의: 네이버(탭)와 우테코(스페이스 4)는 **들여쓰기가 서로 다르다**. 사내 컨벤션을 하나로 고정하고 `.editorconfig`/Checkstyle로 강제하는 편이 논쟁 비용이 낮다 (추론).

### 코드리뷰에서 반복 지적되는 것 (우아한형제들 신입 회고 2건 `[확인]`)
- 필드명에서 타입·의미가 드러나게(`LocalDateTime`이면 `paymentDateTime`), 테스트 메서드명만 봐도 대상·기대가 보이게.
- 메서드명에 모든 정보를 우겨넣기보다 파라미터로 드러내는 짧은 이름.
- 중첩 if를 세부 메서드/조기 반환으로 단순화, 상태 플래그는 boolean, `Objects.isNull()` 같은 API는 의도(Predicate용)를 문서로 확인.
- 테스트: given/when/then 구분, 데이터 준비는 헬퍼 메서드로 추출.

### 시나리오로 체득시킬 방법
- **"컨벤션 위반 심기"**: 레거시에 `getList2()`, 한글 로마자 이름, 빈 catch, 타입이 안 드러나는 날짜 필드를 심고, PR 리뷰 연습(리뷰어 역할)을 시킨다. 이어서 Checkstyle을 CI에 걸어 사람이 반복 지적하는 부분을 도구로 넘기는 경험을 준다.

### 출처
- https://naver.github.io/hackday-conventions-java/ `[확인]`
- https://github.com/woowacourse/woowacourse-docs/tree/main/styleguide/java `[확인]`
- https://google.github.io/styleguide/javaguide.html `[확인]`
- https://techblog.woowahan.com/2614/ , https://techblog.woowahan.com/7828/ `[확인]`

---

## 6. Spring Security 실무 구성

### 실무 기준/관례 (공식 문서 확인)
- **인가 규칙은 위에서 아래로, 첫 매치만 적용**. 마지막에 `anyRequest()` catch-all, 놓친 규칙을 막으려면 `.anyRequest().denyAll()` 전략을 문서가 제시한다 `[확인]` authorize-http-requests.
- 정적 리소스는 `ignoring`보다 `permitAll`을 권장(보안 헤더를 못 쓰게 되므로). Spring Security 6부터 불필요하게 세션을 조회하지 않아 성능 이유가 사라졌다 `[확인]`.
- **CORS는 Spring Security보다 먼저** 처리되어야 한다. 프리플라이트(OPTIONS)에는 쿠키가 없어 Security가 먼저 보면 미인증으로 거부한다. `CorsFilter`+`CorsConfigurationSource` 사용 `[확인]` cors 문서.
- **CSRF는 브라우저 트래픽을 서빙하지 않는 백엔드에서만** 끌 수 있다. 브라우저도 서빙하면 유지하고 특정 엔드포인트만 `ignoringRequestMatchers` `[확인]` csrf 문서.
- 메서드 보안: Boot Starter Security는 **메서드 수준 인가를 기본으로 켜지 않는다**. `@EnableMethodSecurity`를 붙여야 `@PreAuthorize`가 동작하고, 어노테이션 없는 메서드는 보호되지 않으므로 HttpSecurity에 catch-all 규칙을 둔다 `[확인]` method-security. Spring AOP 기반이므로 self-invocation 제약이 같은 원리로 적용된다(문서 본문 직접 확인은 못 함, 7절 근거로부터의 추론).
- JWT 필터는 `UsernamePasswordAuthenticationFilter` 앞에 두고, 토큰 없으면 체인을 계속 진행, 유효하면 `SecurityContextHolder`에 저장하는 것이 일반 패턴이다. 직접 만들지 않고 `oauth2ResourceServer().jwt()`를 쓰는 대안도 있다. (영문 Medium 글들의 공통 설명 `[검색결과만]`; 시나리오 작성 시 Spring Security 공식 OAuth2 Resource Server 문서로 교차 확인 필요)
- 국내 사례: 우아한형제들 정산 팀은 처음에 인터셉터에서 URL+메서드를 자료구조로 등록해 권한을 분기하다 휴먼 에러가 잦았고(관련 버그에 4시간), **인터셉터는 토큰 유효성만, 권한은 AOP 어노테이션으로 분리**해 설정 코드가 약 1/3로 줄었다 `[확인]`. 리뷰에서는 Spring Security를 쓰라는 의견을 받았다.

### 흔한 실수와 결과
- `permitAll` 규칙을 `anyRequest().authenticated()` **뒤에** 두면 영원히 매치되지 않는다. 반대로 넓은 패턴을 앞에 두면 뒤의 세부 규칙이 무시되어 의도치 않은 개방/차단 (첫 매치 규칙에서 도출).
- CORS 설정이 Security 체인에 안 붙어 프리플라이트가 401/403 → 브라우저에서 "CORS 에러"로만 보여 원인 오인 (문서 근거 + 추론).
- 브라우저 쿠키 인증을 쓰면서 CSRF를 통째로 끔 (CSRF 문서의 조건 위반).
- 메서드 보안 미활성: `@PreAuthorize`를 붙였는데 아무도 막지 않음.
- 오래된 블로그의 `antMatchers`/`WebSecurityConfigurerAdapter` 코드를 복사 → 현재 버전에서 컴파일 불가 (인프런 답변 `[검색결과만]`).

### 시나리오로 체득시킬 방법
1. **"관리자 API가 열려 있다" 침투 체험**: 레거시 `SecurityFilterChain`에서 `permitAll("/api/**")`가 `/api/admin/**`보다 앞에 있다. 토큰 없이 관리자 삭제 API가 성공하는 것을 겪게 하고 순서·`denyAll` 전략으로 고치게 한다. 보안 통합 테스트(`MockMvc`, 인증 없음/일반/관리자 3종)를 통과 기준으로.
2. **프리플라이트 디버깅**: 프론트 도메인에서만 실패하는 CORS 재현 → 서버 로그에서 OPTIONS가 필터에서 막히는 것을 추적.

### 출처
- https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html `[확인]`
- https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html `[확인]`
- https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html `[확인]`
- https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html `[확인]`
- https://techblog.woowahan.com/7828/ `[확인]`

---

## 7. AOP 실무 용례와 프록시 한계, `@Transactional` 함정

### 실무 기준/관례
- 용례: 트랜잭션, 메서드 보안(`@PreAuthorize`), 재시도, 로깅/MDC 주입, 권한 어노테이션(우아한형제들 정산 팀 사례). Spring Framework 7 문서는 `@Retryable`(기본 최대 3회 재시도·1초 지연)과 `@ConcurrencyLimit`을 `@EnableResilientMethods`로 켜며 둘 다 **프록시를 통해 호출되는 메서드**에 적용된다 `[확인]` 공식 resilience 문서(버전 확인 필요).
- 프록시 한계(공식) `[확인]`: `private`·`final` 메서드는 CGLIB가 오버라이드할 수 없어 advice 불가, `final` 클래스는 프록시 불가. `this.bar()` 자기 호출은 프록시가 아닌 `this`에 가므로 **advice를 우회**한다. 해법은 "자기 호출을 피하라(가장 좋음)", 자기 참조 주입, `AopContext.currentProxy()`("강하게 비권장"). AspectJ 위빙은 이 문제가 없다.
- `@Transactional`(공식) `[확인]`: 프록시 모드에서는 **프록시로 들어오는 외부 호출만** 가로챈다. 자기 호출은 "실제 트랜잭션으로 이어지지 않는다". 가시성은 6.0부터 클래스 기반 프록시에서 protected/package-visible도 가능, 인터페이스 프록시는 public+인터페이스 선언 필요. **기본 롤백은 `RuntimeException`/`Error`만, 체크 예외는 롤백하지 않음.** 6.2부터 `@EnableTransactionManagement(rollbackOn = ALL_EXCEPTIONS)`로 전역 변경 가능, 특히 체크 예외가 강제되지 않는 Kotlin에서 권장.

### 흔한 실수와 결과 (국내 실사례 확인)
- **내부 `@Transactional` 메서드의 RuntimeException을 바깥에서 try/catch로 삼켜도 전체가 롤백**: 기본 전파 REQUIRED로 같은 트랜잭션에 참여한 내부 메서드가 예외를 던지면 rollback-only가 표시되고 바깥 커밋 시 `UnexpectedRollbackException`("Transaction silently rolled back because it has been marked as rollback-only"). `NESTED`로 부분 롤백을 시도했으나 JPA에서는 savepoint 미지원으로 실패 `[확인]` 우아한형제들(2606).
- **Spring Data의 기본 `SimpleJpaRepository`는 클래스 레벨 `@Transactional(readOnly=true)`**: 인터페이스에 직접 선언한 쿼리 메서드는 그렇지 않다는 지적과(컬리 `[검색결과만]` 일부), 카카오페이가 MySQL general log로 `readOnly` 조회 1회에 추가 쿼리 6개를 관찰하고 select 처리량이 `readOnly` 없는 쪽이 약 2~3배 높았다고 측정 `[확인]`. 이 측정은 특정 환경이므로 일반화하지 말 것.
- **트랜잭션 안에서 외부 API 호출**: 카카오페이는 "트랜잭션 구간에 3rd party API가 끼지 않도록 persistence layer 바깥에서는 `@Transactional`을 쓰지 않는다"는 컨벤션을 두었고 서비스 간 정합성은 Saga에 맡긴다 `[확인]`. 같은 글에 클래스 레벨 `@Transactional` 금지, 단건 수정은 트랜잭션 미사용, readOnly 조회는 커스텀 어노테이션으로 감싸기 같은 컨벤션이 정리돼 있다. 다른 글(카카오페이 JVM 웜업)은 커넥션을 쥔 채 작업이 길어져 풀 대기 타임아웃이 난 사례 `[검색결과만]`.
- **커밋 전에 외부 발행**: 외부 API 결과를 DB에 저장하고 Kafka를 직접 발행하는 구조에서 커밋 실패 시 메시지만 나가는 불일치를 컬리가 Outbox로 풀었다 `[검색결과만]` (https://helloworld.kurly.com/blog/2026-outbox-pattern-and-retry-topic). 우아한형제들 회원시스템의 BEFORE_COMMIT→AFTER_COMMIT→Outbox 3단계 변천은 읽어서 확인 `[확인]`(7835).
- 같은 클래스 내부 호출로 `@Transactional`/`@Retryable`/`@PreAuthorize`가 안 먹음 (공식 근거).

### 시나리오로 체득시킬 방법
1. **"저장했는데 롤백돼요"**: 알림 저장 실패를 try/catch로 삼키는 게시글 등록 코드를 준다. `UnexpectedRollbackException` 스택트레이스를 먼저 보여주고 원인을 추적시킨다(디버거로 TransactionStatus의 rollbackOnly 확인). 해법 비교: 이벤트 분리(`AFTER_COMMIT`), 별도 빈+`REQUIRES_NEW`, 삼키지 않기.
2. **"자기 호출 3종 세트"**: 한 서비스에 `@Transactional`, `@Cacheable`/`@Retryable`, `@PreAuthorize`를 가진 메서드가 `this.` 호출로 엮여 있다. 로그로 "프록시를 거쳤나"를 `AopUtils.isAopProxy` 또는 스택 프레임으로 직접 확인하게 한다.
3. **체크 예외 롤백**: `throws IOException`(첨부 업로드)에서 DB는 커밋되고 파일은 실패한 불일치를 재현하고 `rollbackFor`를 쓰게 한다.

### 출처
- https://docs.spring.io/spring-framework/reference/core/aop/proxying.html `[확인]`
- https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html `[확인]`
- https://docs.spring.io/spring-framework/reference/core/resilience.html `[확인]`
- https://techblog.woowahan.com/2606/ `[확인]`
- https://tech.kakaopay.com/post/jpa-transactional-bri/ `[확인]`
- https://techblog.woowahan.com/7835/ `[확인]`

---

## 8. 로깅: 레벨 기준, MDC, 구조화 로그, 마스킹, logback

### 실무 기준/관례
- **레벨 기준(컬리 딜리버리팀)** `[확인]`: ERROR=즉각 대응이 필요한 문제(발생 시 즉시 알람), WARN=지금은 괜찮지만 빈도가 높으면 문제(임계치 초과 시 알람; 팀 공통은 5분 내 약 100회), 의도된 비즈니스 예외는 ERROR에서 WARN으로 낮춘다. 외부 연동 타임아웃도 대부분 재처리되므로 WARN. 처음부터 완벽한 기준은 어렵고 운영하며 조정한다.
- **MDC 요청 추적(우아한형제들 "로그 및 SQL 진입점 정보")** `[확인]`: Spring MVC는 `HandlerInterceptor`의 `preHandle`에서 넣고 `afterCompletion`에서 비운다. 컨슈머·스케줄러는 인터셉터가 없으므로 AOP로 `@SqsListener`/`@KafkaListener`/`@Scheduled` 전후에 넣고 비운다. 비동기는 `TaskDecorator`로 컨텍스트 맵을 복사해 실행 스레드에서 set 후 clear. 함정: 멀티모듈에서 모듈마다 인터셉터 등록 누락, 배치에서 빈 생성 시점 쿼리(Reader)는 `JobLauncher.run()` 이전이라 MDC가 비어 `@JobScope`/`@StepScope` 필요, `Executors`와 `ThreadPoolTaskExecutor` 혼용 시 일부 경로 누락, `new`로 만든 JdbcTemplate 누락, 스레드 공유 시 반드시 clear.
- **Logback 공식**: MDC는 스레드 단위로 관리되며 풀에서는 값이 전달되지 않을 수 있어 `getCopyOfContextMap()`→`setContextMap()`으로 복사, 각 `put()`은 `finally`의 `remove()`와 짝, 서블릿 필터에서 시작에 넣고 끝에 제거 `[확인]`. (같은 페이지의 "자식 스레드가 부모 MDC를 상속하는가" 서술이 불일치해 보인다는 점은 확인 시 유의.)
- **Spring Boot 공식** `[확인]`: `logging.level.<logger>`, 로그 그룹, `logging.structured.format.console=ecs|gelf|logstash`로 구조화 JSON(MDC 키-값 전부 포함, SLF4J fluent `addKeyValue` 지원), `logback-spring.xml`(not `logback.xml`)을 써야 `<springProfile>`/`<springProperty>` 확장이 된다. Logback에는 FATAL이 없고 ERROR로 매핑. 상관 ID는 트레이싱 활성화 시 로그에 포함.

### 흔한 실수와 결과
- 모든 예외를 ERROR로 → 알람이 울려도 대응할 것이 없어 알람 피로, 정작 실장애를 놓침(컬리 글의 문제의식). Sentry 계열의 Rate Limit에 걸려 중요 로그 누락 위험은 우아한형제들 글 `[검색결과만]`.
- MDC를 비동기 경계에서 잃어 요청 ID가 끊김, 스레드풀에서 `remove` 누락으로 **이전 요청의 ID가 섞임** (Logback 문서 + 우아한형제들 글).
- 민감정보(비밀번호·토큰)가 로그/모니터링으로 전송됨. LINE 글은 Sentry 전송 전에 민감 헤더를 제거하라는 권고를 한다 `[검색결과만]`. **Logback에서의 마스킹 구현을 직접 다룬 국내 기업 글은 찾지 못했다**(확인 불가 절).

### 시나리오로 체득시킬 방법
1. **"장애 한 건 로그로 추적"**: 로그에 요청 ID가 없는 서버로 동시 요청 3건이 섞인 로그를 주고 "이 사용자의 요청만 골라내라"를 시킨 뒤, MDC 필터를 넣고 같은 작업을 반복해 시간 차이를 측정. 이어 `@Async` 구간에서 ID가 사라지는 것을 겪게 하고 `TaskDecorator`로 해결.
2. **레벨 재분류 실습**: 게시판 예외 20종(없는 게시글, 권한 없음, DB 타임아웃 등)을 ERROR/WARN/INFO로 분류하고 알람 정책을 쓰게 한다.
3. **마스킹**: 로그인 요청 body를 로그로 남기는 `Aspect`를 주고, 비밀번호가 평문으로 로그에 남는 것을 발견하게 한 뒤 필터/DTO `toString` 제외로 해결(구현 방식은 팀 결정이 필요).

### 출처
- https://helloworld.kurly.com/blog/deliveryproductteam-culture-1/ `[확인]`
- https://techblog.woowahan.com/13429/ `[확인]`
- https://logback.qos.ch/manual/mdc.html `[확인]`
- https://docs.spring.io/spring-boot/reference/features/logging.html `[확인]`

---

## 9. 디버깅

### 실무 기준/관례
- **컬리 딜리버리팀 주니어 디버깅 스터디** `[확인]`: 10주(이론 2주+실전 8주, 매주 1시간: 주제 선정 5분/개별 분석 15분/토론 30분/회고 10분). 에러 대응 순서는 현상 분석→원인 분석(로그·리소스로 가설을 세우고 사실과 아닌 것을 구분해 범위를 좁힘)→근본 해결. 인프콘 발표에서 가져온 시간 배분 "원인 파악 60%/해결 30%/사후 10%", 5단계(문제 정의→정상 동작 정의→최소 환경 구축·관찰→원인 탐색→가설 설정·검증). 팁 7가지 중 "검증되지 않은 가설을 믿지 않기", "단서(에러 메시지·스택트레이스·로그·재현 조건) 먼저 수집", "문제를 직접 재현해 사실 확인", "해결 후 회고·문서화". 실전 사례는 Redis 저장 중 `LocalDateTimeAdapter` NPE — null 가설을 목록화해 하나씩 점검하고 **null 필드명을 로그에 남기도록 에러 로그를 보강**. 이 글은 IntelliJ 디버거 사용법을 직접 다루지는 않는다.
- **IntelliJ 디버거(JetBrains 공식)** `[확인]`: 중단점의 **Condition**에 식을 넣으면 참일 때만 멈춘다. **Evaluate and log**는 멈추지 않고 식의 결과를 콘솔에 남긴다(Shift+거터 클릭으로 로깅 중단점 추가 가능). **Suspend** 정책은 All threads/Thread를 고를 수 있어 멀티스레드 재현에서 중요하다. Evaluate Expression(⌥F8)은 선택한 스택 프레임 컨텍스트에서 식/코드 조각을 평가한다 `[검색결과만]` (jetbrains.com/guide/java/tips/evaluate-expression 등).
- 재현 테스트 우선: 우아한형제들 레거시 글은 테스트가 없으면 변경 지점을 새 메서드·클래스로 **감싸(wrapping)** 영향 범위를 줄이고, 필요한 값만 담은 객체로 의존을 줄여 테스트를 쓴 뒤 리팩토링하라고 제시 `[확인]`(2613). (※ 글은 "특성화 테스트"라는 용어는 쓰지 않았다.)

### 흔한 실수와 결과
- 가설을 검증 없이 믿고 수정부터 → 증상만 가려지고 재발 (컬리 팁 1).
- 모든 요청에 걸리는 무조건 중단점 → 운영/부하 상황 재현 불가(추론). 조건부·로깅 중단점으로 해결.
- 에러 로그에 어떤 필드가 null인지가 없어 재현 조건 수집에 시간 소모(컬리 사례에서 로그 보강이 해결책으로 나옴).

### 시나리오로 체득시킬 방법
1. **"이 3건만 터진다"**: 게시글 10만 건 중 특정 조건의 3건에서만 NPE가 나는 코드. 무조건 중단점이 비실용적임을 겪게 하고 Condition(`post.getId() == 4821` 또는 `post.getAuthor() == null`)과 Evaluate and log로 좁히게 한다. 마지막은 **재현 테스트를 먼저 쓰고 수정**하는 것이 완료 조건.
2. **스택트레이스 읽기 훈련**: 중첩된 `Caused by`가 있는 트레이스(프록시·람다 프레임 포함)를 주고 "내 코드 첫 프레임"을 찾게 한다.
3. 컬리의 5단계(문제 정의→정상 정의→최소 환경→원인 탐색→가설·검증)를 **디버깅 로그 양식**으로 제출하게 한다.

### 출처
- https://helloworld.kurly.com/blog/2025-delivery-debug-study/ `[확인]`
- https://www.jetbrains.com/help/idea/using-breakpoints.html `[확인]`
- https://jetbrains.com/guide/java/tips/evaluate-expression `[검색결과만]`
- https://techblog.woowahan.com/2613/ `[확인]`

---

## 10. 예외 처리 설계

### 실무 기준/관례
- **우아한형제들 "IllegalArgumentException은 400 Bad Request인가?"** `[확인]`: `IllegalArgumentException`을 400으로 일괄 매핑하면 서버 버그가 클라이언트 잘못으로 오인되어 원인 파악이 늦다. 원칙은 "예상 못 한 상황은 5xx, 명백한 클라이언트 잘못은 4xx". 비즈니스 예외(최소 주문 금액 미달)=400, 시스템 예외(DB·외부 연동 실패, NPE)=5xx. `BusinessException`에 클라이언트 식별용 `code`와 부가 정보 `arguments` 맵을 두고 구체 예외가 상속, `@RestControllerAdvice`에서 `BusinessException` 한 번에 매핑.
- **Spring 공식** `[확인]`: RFC 9457 Problem Details 지원. `ProblemDetail`, `ErrorResponse`(모든 Spring MVC 예외가 구현), `ErrorResponseException`, `@ControllerAdvice`용 `ResponseEntityExceptionHandler`. Boot는 `spring.mvc.problemdetails.enabled`로 자동 구성.
- 로그 정책 연계: 의도된 비즈니스 예외는 ERROR가 아니라 WARN(컬리 글, 8절).
- 롤백 규칙 연계: 비즈니스 예외를 체크 예외로 만들면 기본 롤백이 안 된다(7절 공식 문서).
- 대안: 예외 대신 `Either`/`Result` 타입(토스 Kotlin Result 글, 우아한형제들 Flutter 글 `[검색결과만]`).

### 흔한 실수와 결과
- 모든 예외를 `RuntimeException("실패")` 한 종류로 → 클라이언트가 분기할 코드가 없고 모니터링이 4xx/5xx로 구분 안 됨 (위 글의 문제의식 + 추론).
- catch 후 삼키기/`e.printStackTrace()`: Google 스타일의 "예외 조용히 무시 금지" 위반. 삼킨 예외가 롤백 마킹을 남기면 7절의 `UnexpectedRollbackException`.
- `@ExceptionHandler(Exception.class)` 하나로 전부 200/400 반환 → 스프링 기본 예외(`MethodArgumentNotValidException` 등) 형식이 일관되지 않음 (추론).

### 시나리오로 체득시킬 방법
1. **"에러 응답 3종 혼재"**: 레거시가 에러를 200+`{success:false}`, 문자열, Spring 기본 JSON으로 섞어 낸다. 프론트 역할(가상의 클라이언트 스크립트)이 파싱에 실패하는 것을 겪게 한 뒤 에러 코드 표(도메인-번호-메시지-HTTP 상태)를 팀 계약으로 만들고 `ProblemDetail` 기반으로 통일.
2. **IAE 400 논쟁**: 일부러 서버 버그로 터지는 `IllegalArgumentException`을 400으로 숨기는 핸들러를 두고, 모니터링 대시보드(가짜 지표)에서 5xx가 0으로 보이는 문제를 발견하게 한다.

### 출처
- https://techblog.woowahan.com/21686/ `[확인]`
- https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html `[확인]`
- https://helloworld.kurly.com/blog/deliveryproductteam-culture-1/ `[확인]`

---

## 11. 테스트 전략

### 실무 기준/관례 (기업 글 3편 + 공식)
- **토스 "가치있는 테스트를 위한 전략과 구현"** `[확인]`(본문 앞 약 100,000자만 읽음): 핵심 기능(약 20%)에 집중, 단기 이벤트는 수동 테스트. 유형 4종: 도메인 정책 테스트(단위, 경계값, **실제 객체**), 유스케이스 테스트(통합, API 명세 기반 블랙박스, RestAssured), 직렬화/역직렬화 테스트(승인 테스트), 기타. **Mock 정책**: 기본은 실제 객체(고전파), mock 프레임워크 최소화. 대역은 상황별: 외부 서비스=Fake, 내부 서비스+부수효과=Dummy(테스트 프로파일 no-op), 데이터 확보 곤란=Stub. mock을 쓰면 컨텍스트 캐싱이 깨져 느려진다. 픽스처: 초기 `@Sql`은 컬럼 추가에 취약 → 테이블별 JSON+`TestExecutionListener`, 후 TRUNCATE, 여러 모듈은 test-fixtures. 한계: 반환값이 없으면 실패해도 통과하는 거짓 양성 → 응답값을 추가.
- **우아한형제들 "서버사이드 테스트 파랑새를 찾아서"** `[확인]`: 격리가 쉬운 유닛(엔티티)은 협동 테스트, 협력 객체가 있는 서비스는 단독 테스트+대역, 컨트롤러는 MockMvc. 통합은 사용자 시나리오 단위로 LocalStack/Testcontainers/Docker. 피라미드 비율 논쟁보다 빠르고 신뢰할 수 있는 테스트. 커버리지는 부정 지표로만. 트레이드오프: 단독 테스트는 구현이 침투해 리팩토링 내성이 낮다. 하위 브랜치는 유닛만, 운영 브랜치 병합 시 통합까지(DB 초기화를 프로시저로 바꿔 17.7초→7.6초).
- **컬리 "Testcontainers로 유저시나리오와 비슷한 통합테스트"** `[확인]`: 서버별 통합테스트가 외부 의존성을 mock으로 처리해 **서버 간 제약 불일치 버그(배송 가능 지역 조회 조건)를 못 잡고 QA에서야 발견**. Kafka/PostgreSQL/이벤트 수집 서버/주문 조회 서버를 컨테이너로. 삽질: 컨테이너 간 통신(공통 Network+alias, "2박 3일"), 인증은 local 프로필에서 우회, 이미지 캐시는 `alwaysPull`.
- **카카오페이 "테스트 코드로부터 피드백 받기"** `[확인]`: 테스트가 어렵다면 구현 구조의 신호. HTTP 통신은 Mock Server로(역직렬화 검증은 행위 기반 mock으로 불가), 복잡한 계산은 인프라 의존 없는 POJO(`OrderServiceSupport`)로 옮겨 mock 없이 테스트, 외부 라이브러리 타입을 모듈 밖으로 노출하지 않기.
- **Spring Boot 공식** `[확인]`: `@SpringBootTest`는 기본 서버 미기동(MOCK), 슬라이스 테스트는 필요한 부분만 로드(`@WebMvcTest`는 `@Controller`/`@ControllerAdvice` 등만 스캔하고 일반 `@Component`는 스캔 안 함, 한 테스트에 슬라이스 여러 개 불가), `@MockitoBean`, **컨텍스트 캐싱**. Testcontainers: `@ServiceConnection`, `@DynamicPropertySource`, 컨텍스트가 캐시되는 동안 컨테이너는 Spring 빈으로 관리하거나 `@ImportTestcontainers` 권장(컨테이너 생명주기와 캐시된 컨텍스트 불일치 주의).

### 흔한 실수와 결과
- **테스트에 `@Transactional`을 붙여 서비스의 트랜잭션 누락을 가림**: 서비스에는 `@Transactional`이 없는데 테스트에는 붙어 있어 통과 → 운영에서 더티체킹/지연 로딩 실패. `[검색결과만]` 우아한형제들 파랑새 글의 일부 인용이며 본문 전체 확인은 아님; 시나리오에서 직접 재현 가능.
- mock 남용으로 구현과 결합, 리팩토링마다 테스트 수정(토스·우아한형제들 공통).
- 외부 의존 mock만으로는 서버 간 불일치를 못 잡음(컬리).
- `@MockitoBean` 난립으로 컨텍스트 캐시가 계속 깨져 테스트가 느려짐(토스 + Boot 캐싱 문서).
- 거짓 양성(반환값 없는 유스케이스)과 H2 vs 실제 DB 차이(추론; 컬리·토스 글이 H2를 쓴 것과 Testcontainers 도입 맥락은 다르다. 컬리 글에는 H2에서 이관한 내용이 없었다).

### 시나리오로 체득시킬 방법
1. **"테스트 통과, 운영 장애"**: 테스트 `@Transactional`로 롤백되는 서비스 테스트가 통과하지만 `@Transactional` 없는 서비스에서 지연 로딩 예외가 나는 것을 겪게 하고, 테스트에서 `@Transactional`을 떼는 것만으로 실패가 드러나게 한다.
2. **레벨 분류 과제**: 같은 게시판 기능을 도메인 단위 / `@WebMvcTest` / `@DataJpaTest`+Testcontainers(MySQL) / `@SpringBootTest` 인수 테스트로 각각 하나씩 써 보고 속도·깨지는 조건을 표로 비교. mock 정책(Fake/Dummy/Stub)을 토스 기준표대로 적용.
3. **characterization 후 리팩토링**: 테스트 없는 레거시 서비스를 우아한형제들 wrapping 절차(변경 지점 찾기→의존 줄이기→테스트→리팩토링)로 개선.

### 출처
- https://toss.tech/article/test-strategy-server `[확인]`
- https://techblog.woowahan.com/14874/ `[확인]`
- https://helloworld.kurly.com/blog/delivery-testcontainer-apply/ `[확인]`
- https://tech.kakaopay.com/post/mock-test-code-part-2/ `[확인]`
- https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html `[확인]`
- https://docs.spring.io/spring-boot/reference/testing/testcontainers.html `[확인]`

---

## 12. interface/impl 구조, 과잉 추상화, 전략 패턴

### 실무 기준/관례
- **인터페이스를 두는 근거가 확인된 사례**: 모듈 경계의 port/adapter(우아한형제들 도메인 분리 `[확인]`: 모듈 간에는 port만 노출하고 adapter는 도메인 내부, ArchUnit으로 강제), 외부 서비스 대역(토스 `[확인]`: 외부 서비스=Fake 구현), 외부 라이브러리 타입의 누수 차단(카카오페이 `[확인]`).
- **인터페이스가 필요 없어진 근거**: Spring은 CGLIB 클래스 프록시로 인터페이스 없이도 프록시한다(공식 문서의 CGLIB 절 `[확인]`; "JDK 프록시 시절의 이유가 사라졌다"는 한국어 서술은 인프런 답변 `[검색결과만]`). 즉 "AOP/트랜잭션 때문에 인터페이스가 필요하다"는 관례는 현재 기본 설정에서는 약해졌다 (Boot의 기본 proxyTargetClass 동작은 확인 불가 절).
- 과잉 추상화 논쟁: "구현이 하나뿐이면 `XxxService`/`XxxServiceImpl` 쌍을 미리 만들지 말고 필요해질 때 분리"하는 입장과 "구현 은닉·인터페이스 기준 테스트"를 근거로 쌍을 두는 입장이 공존한다. 이번 조사로 공신력 있는 단일 기준을 찾지는 못했다(인프런·벨로그 `[검색결과만]`).
- 전략 패턴: 같은 인터페이스의 빈들을 `List`/`Map`으로 주입받아 키(enum 등)로 선택하는 방식이 널리 쓰인다. 다만 이번에는 공식 문서·기업 글로 확인하지 못하고 Medium 글만 확인 `[검색결과만]` → 확인 불가 절.

### 흔한 실수와 결과
- 구현 하나뿐인 인터페이스를 양산 → 이동/수정 시 파일 2배, IDE에서 호출 추적이 인터페이스에서 멈춤 (추론).
- 인터페이스가 구현 세부(JPA 엔티티, `ResponseEntity`)를 노출해 의미 있는 경계가 되지 못함(카카오페이: 외부 타입 노출 시 라이브러리 변경이 여러 모듈로 전파).
- 새 결제수단/알림 채널을 `if-else`로 계속 추가 → 변경이 한곳에 몰려 회귀(추론).

### 시나리오로 체득시킬 방법
1. **"알림 채널 추가" 요구 두 번**: 1차 요구(이메일)는 구현체 하나로 두게 하고, 2차(푸시)·3차(슬랙)에서 `if-else`가 어떻게 늘어나는지 겪게 한 뒤 전략 패턴으로 전환. 시점이 "필요해진 순간"임을 체득시키는 것이 목적 (YAGNI와 OCP의 균형).
2. **외부 연동을 Fake로 교체**: 게시판 첨부 저장소(S3)를 port로 두고 테스트에서 Fake 구현으로 바꿔 보게 한다. 같은 코드를 "인터페이스 없이" 시도하면 테스트가 얼마나 어려워지는지 비교.

### 출처
- https://techblog.woowahan.com/22151/ `[확인]`
- https://toss.tech/article/test-strategy-server `[확인]`
- https://tech.kakaopay.com/post/mock-test-code-part-2/ `[확인]`
- https://docs.spring.io/spring-framework/reference/core/aop/proxying.html `[확인]`

---

## 13. 프론트와의 API 계약 협업

### 실무 기준/관례
- **springdoc으로 OpenAPI 자동 생성 + 대상별 그룹화 + 통합·자동화(LINE)** `[확인]`: 수동 문서는 서비스·API가 늘수록 관리비가 급증, 하나의 문서에 내부/프론트/관리자 API가 섞이면 찾기 어렵고 배포 후에야 문서가 반영되어 초기 스펙 공유가 어렵다는 문제 → 패키지 기준 API 그룹, springdoc-openapi-gradle-plugin으로 JSON 추출, Redocly CLI로 통합·HTML 변환, GitHub Actions/Pages로 자동화. **운영 환경에서 Swagger UI는 노출하지 않는다**고 명시.
- **토스페이먼츠 Open API 버저닝** `[확인]`: 버전별로 "완전히 독립된 API처럼" 관리하고 서버가 요청 버전에 따라 검증·응답을 만든다. 금액 필드 타입 변경처럼 기존 연동이 깨질 변경은 새 버전으로 분리, 변경은 릴리즈 노트로 안내. 서버가 springdoc으로 OAS를 자동 생성하고 주기적으로 조회해 연동 문서를 갱신.
- 에러 응답 규약: RFC 9457(Problem Details)을 Spring이 공식 지원(10절).
- LINE 글은 API 서버에는 HeadVer 같은 버전 자동 증가가 부적합할 수 있다는 의견도 소개 `[검색결과만]`(HeadVer 글).
- 우아한형제들은 Swagger가 API 테스트에는 좋으나 문서만으로 연동 시스템을 만들기엔 부족하고 어노테이션이 코드에 많아진다고 지적 `[검색결과만]`.
- 하위 호환 규칙: "필드 추가는 호환, 삭제·이름 변경(=삭제+추가)·타입 변경은 breaking, 추가→전환→삭제 순서, 구 필드 사용량 로깅으로 0이 되면 제거, 소비자 주도 계약 테스트"는 Medium 글들의 공통 서술이며 `[검색결과만]`. 토스페이먼츠의 "금액 타입 변경은 새 버전"이 기업 1차 확인 사례다.

### 흔한 실수와 결과
- 응답 필드명/타입을 서버 리팩토링 중에 바꿈 → 프론트·모바일(앱은 구버전이 오래 남음)이 깨짐 (일반론, Medium 서술; 앱 구버전 잔존은 추론).
- 엔티티를 응답으로 직접 내서 DB 컬럼 변경이 API 변경이 됨(4절).
- 문서가 코드와 어긋남: 수동 문서의 본질적 문제(LINE 글).
- 운영에 Swagger UI 노출(LINE 글이 금지 사항으로 명시).

### 시나리오로 체득시킬 방법
1. **"필드명 바꾸자" 시나리오**: 서버 개발자 역할이 `authorName`→`writer`로 리팩토링 → 가상 프론트 클라이언트(스크립트)가 깨지는 것을 보게 한다. 이어서 (a) 새 필드 병행 노출+`deprecated` (b) 사용량 로깅 (c) 삭제의 3단계로 다시 한다. 계약 테스트(예: 응답 JSON 스키마 스냅샷)가 CI에서 breaking을 잡게 한다.
2. **springdoc 문서를 "계약"으로**: 문서를 먼저 합의하고(API 우선) 프론트가 mock으로 개발을 시작하는 흐름을 체험(우아한형제들 API 모킹 글 `[검색결과만]`).

### 출처
- https://techblog.lycorp.co.jp/ko/api-document-integration-and-documentation-automation `[확인]`
- https://toss.tech/article/payments-legacy-4 `[확인]`
- https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html `[확인]`
- https://techblog.woowahan.com/20154/ `[검색결과만]` (API 모킹)

---

## 14. 빈 생명주기와 주요 어노테이션

### 실무 기준/관례 (공식 문서 확인)
- **초기화/소멸 콜백**: `@PostConstruct`/`@PreDestroy`(jakarta)가 "현대 Spring 앱에서 콜백을 받는 모범 사례"다(Spring 인터페이스에 결합되지 않으므로). `InitializingBean`은 "불필요하게 Spring에 결합되므로 쓰지 말 것"을 권한다. 순서는 초기화: `@PostConstruct` → `afterPropertiesSet()` → `init-method`, 소멸: `@PreDestroy` → `destroy()` → `destroy-method`. **초기화 메서드는 싱글톤 생성 락 안에서 실행**되므로 설정 검증·상태 준비만 하고, 무겁거나 비동기인 후처리는 `SmartInitializingSingleton`이나 `ContextRefreshedEvent` 리스너(락 밖)에 둔다. `SmartLifecycle`은 phase(낮을수록 먼저 시작·나중에 종료)와 비동기 stop(phase당 기본 30초 타임아웃)을 지원 `[확인]` Spring Framework 공식 factory-nature. prototype 빈은 컨테이너가 소멸 콜백을 호출하지 않는다(스코프 문서 기반 서술이며 해당 페이지에서 직접 인용은 못 함).
- **기동 직후 작업**: 기동 시점 작업은 `@PostConstruct` 대신 **`CommandLineRunner`/`ApplicationRunner`**에서 하라고 Boot 문서가 명시. 이벤트 순서는 … → `ApplicationStartedEvent`(컨텍스트 refresh 후, runner 호출 전) → Liveness CORRECT → **runner 실행** → `ApplicationReadyEvent`(runner 후) → Readiness ACCEPTING_TRAFFIC. readiness는 runner 처리 중에는 REFUSING. 리스너는 기본 같은 스레드에서 실행되니 긴 작업 금지. liveness는 외부(DB) 검사에 의존하면 안 된다 `[확인]` Boot 공식 spring-application.
- **`@Configuration` vs `@Component`의 `@Bean`**: `@Configuration`은 시작 시 CGLIB로 서브클래싱되어 `@Bean` 메서드 간 직접 호출이 컨테이너의 캐시된 싱글톤을 돌려준다. `@Component`(또는 `proxyBeanMethods=false`)에서는 `@Bean` 메서드 간 호출이 **그냥 자바 호출이라 매번 새 인스턴스**이므로 파라미터/생성자 주입만 써야 한다. `@Configuration` 클래스는 `final` 불가 `[확인]` Spring 공식 configuration-annotation. Boot 문서의 예시도 `@Configuration(proxyBeanMethods = false)`를 기본 형태로 쓴다 `[확인]` Boot profiles.
- **`@ConfigurationProperties` vs `@Value`**: 묶음 설정은 `@ConfigurationProperties`(relaxed binding, 메타데이터, `@Validated` 검증, 생성자 바인딩+`@DefaultValue`)를 권장. `@Value`는 relaxed binding이 제한적이고(키는 kebab-case 정규형으로 쓰라고 안내) 대신 SpEL을 쓸 수 있다. 등록은 `@EnableConfigurationProperties` 또는 `@ConfigurationPropertiesScan` `[확인]` Boot external-config.
- **`@Conditional*`**: Boot 자동 구성은 대부분 `@ConditionalOnClass`+`@ConditionalOnMissingBean` 조합. **`@ConditionalOnBean`/`OnMissingBean`은 지금까지 처리된 빈 정의만 보므로 순서에 민감**해서 자동 구성 클래스에서만 쓰길 권장. `@Bean` 메서드 위의 `@ConditionalOnClass`는 반환 타입이 먼저 로드되어 실패할 수 있어 중첩 `@Configuration`으로 격리. `@ConditionalOnProperty`는 기본으로 "존재하고 `false`가 아니면" 매치, `havingValue`/`matchIfMissing`으로 조정 `[확인]` Boot developing-auto-configuration.
- **`@Profile`**: 클래스/메서드에 붙여 해당 프로파일 활성 시에만 등록, `!`·`&`·`|` 표현식(괄호 없이 `&`와 `|` 혼용 불가). 메서드 오버로드는 프로파일로 선택 불가 `[확인]` Spring 공식 environment.
- **`@Primary`/`@Qualifier`**: `@Primary`는 후보가 여럿일 때 기본값(정의 쪽), `@Qualifier`는 주입 지점의 명시적 선택이며 `@Primary`를 이긴다(후자는 이번에 해당 공식 페이지를 못 읽었고 카카오페이의 실험 글 `[확인]`(2절 출처)로 확인). 6.2부터 `@Fallback` `[확인]` 공식 autowired-primary.
- **`@EventListener`**: 기본은 **동기**라 `publishEvent()`가 리스너 종료까지 블록하고, 리스너는 발행자의 트랜잭션 안에서 돈다. `@Async` 리스너는 예외가 호출자에게 전파되지 않고, 반환값으로 후속 이벤트를 못 내며, **ThreadLocal·로깅 컨텍스트(MDC)가 전파되지 않는다**. lazy 빈에 정의하면 리스너가 등록되지 않는다 `[확인]` Spring 공식 context-introduction. 트랜잭션 후 처리는 `@TransactionalEventListener`(3절 근거).
- **Graceful shutdown**: Boot는 내장 서버 세 종류(Tomcat/Jetty/Reactor Netty) 모두에서 **기본 활성화**. 새 요청은 거절하고 기존 요청은 `spring.lifecycle.timeout-per-shutdown-phase`(예 `20s`) 동안 마무리. 끄려면 `server.shutdown=immediate`. **IDE에서의 종료는 SIGTERM이 아니어서 즉시 종료일 수 있으므로 `kill <pid>`/컨테이너 stop으로 검증**하라고 명시 `[확인]` Boot graceful-shutdown. (일부 문서·블로그는 `server.shutdown=graceful`을 필수로 소개하나 현행 문서 기준 기본값이다. 버전 확인 권고.)

### 흔한 착각과 결과
- `@PostConstruct`에서 외부 호출·긴 초기 적재 → 싱글톤 생성 락 안에서 실행되어 기동이 지연/교착(공식 문서의 경고에서 도출; 구체 장애 사례는 이번에 못 찾음). 기동 후 데이터 적재는 runner/`ApplicationReadyEvent`로.
- `@Component` 클래스 안에서 `@Bean` 메서드끼리 호출해 "같은 빈"이라 믿음 → 서로 다른 인스턴스(공식).
- `@ConditionalOnBean`을 일반 `@Configuration`에 써서 순서 때문에 간헐적으로 안 붙음(공식 경고).
- `@Value("${demo.itemPrice}")`로 `demo.item-price` 키를 못 읽음(공식 relaxed binding 설명: 키는 kebab-case로 써야 두 표기를 모두 받는다).
- `@Async @EventListener`에서 요청 ID(MDC)가 사라지고, 예외가 조용히 사라짐(공식 + 8절).
- 로컬에서 IDE 중지로 graceful shutdown을 "테스트했다"고 믿음 → 운영 배포 중 진행 중 요청 유실 가능(공식 주의문; 실제 유실 정도는 서버·LB 설정에 따라 다름).

### 시나리오로 체득시킬 방법
1. **"기동 로그 타임라인"**: 로그에 `@PostConstruct`/`ApplicationRunner`/`ApplicationStartedEvent`/`ApplicationReadyEvent`/readiness 변화를 찍게 하고 순서를 직접 그려 보게 한다. 이후 `@PostConstruct`에서 5초 sleep하는 캐시 워밍업을 runner로 옮기고 readiness가 어떻게 달라지는지 `/actuator/health/readiness`로 확인.
2. **"같은 빈인 줄 알았다"**: `@Component`+`@Bean` 서로 호출 코드를 주고 `System.identityHashCode`로 인스턴스가 다른 것을 발견 → `@Configuration`으로 바꾸는 방법과 파라미터 주입으로 푸는 방법 비교.
3. **Graceful shutdown 실험**: 오래 걸리는 업로드 요청 중 `kill -TERM`을 보내 요청이 끝까지 처리되는지, `server.shutdown=immediate`일 때와 비교.
4. **프로파일별 빈 교체**: 알림 발송 빈을 `@Profile("local")` Fake와 `@Profile("prod")` 실구현으로 두고 `@Primary`/`@Qualifier` 충돌을 일부러 만들어 `NoUniqueBeanDefinitionException`을 겪게 한다. (예외 이름은 공식 페이지에서 확인하지 못함 — 시나리오 작성 시 확인)

### 출처
- https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html `[확인]`
- https://docs.spring.io/spring-framework/reference/core/beans/java/configuration-annotation.html `[확인]`
- https://docs.spring.io/spring-boot/reference/features/spring-application.html `[확인]`
- https://docs.spring.io/spring-boot/reference/features/developing-auto-configuration.html `[확인]`
- https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html `[확인]`
- https://docs.spring.io/spring-framework/reference/core/beans/context-introduction.html `[확인]`
- https://docs.spring.io/spring-framework/reference/core/beans/environment.html `[확인]`
- https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-primary.html `[확인]`
- https://docs.spring.io/spring-boot/reference/features/external-config.html `[확인]`

---

## 15. application.yml 실무

### 실무 기준/관례 (Boot 공식 문서 확인)
- **설정 우선순위**: 나중 것이 앞 것을 덮는다. 상위권: OS 환경변수 < Java 시스템 프로퍼티 < `SPRING_APPLICATION_JSON` < **커맨드라인 인자**(가장 강함). 설정 파일(낮음→높음): jar 안 `application` → jar 안 `application-{profile}` → jar 밖 `application` → jar 밖 `application-{profile}`. 같은 위치에 `.properties`와 YAML이 함께 있으면 `.properties`가 우선. 값은 병합이 아니라 키 단위 덮어쓰기 `[확인]` Boot external-config(Framework `Environment` 문서도 "값은 병합되지 않고 앞선 항목이 완전히 덮는다"고 서술 `[확인]`).
- **프로파일별 파일 vs 한 파일 다문서**: `application-prod.yml`(파일 분리)과, 한 파일에서 `---` 구분 + `spring.config.activate.on-profile: prod`(문서 분리)가 모두 공식 방식. 문서는 위→아래 처리되며 뒤 문서가 덮는다. `#---`(properties)도 가능. **다문서 파일은 `@PropertySource`/`@TestPropertySource`로 로드할 수 없다** `[확인]`.
- **프로파일 활성화/그룹**: `spring.profiles.active`(커맨드라인이 `application.yml` 값을 이김), 활성 프로파일이 없으면 `default`. 그룹: `spring.profiles.group.production: [proddb, prodmq]`로 `--spring.profiles.active=production` 한 번에 여러 개 활성. `spring.profiles.include`는 active 앞에 추가. **`active/include/default/group`은 프로파일 전용 파일이나 `on-profile` 문서 안에 쓸 수 없다**(공식 예시: `on-profile: prod` 문서 안의 `profiles.active: metrics`는 무효) `[확인]` Boot profiles. 프로파일 이름은 영숫자와 `- _ . + @`만 가능.
- **`spring.config.import`**: `optional:file:./dev.properties`처럼 외부 파일을 끼워 넣고, 가져온 값이 선언 문서를 덮는다. `optional:`은 파일이 없어도 기동. 한 번만 로드 `[확인]`.
- **시크릿**: Boot에는 **내장 프로퍼티 암호화가 없고**(공식), 대안으로 환경변수, **`configtree:`**(마운트된 볼륨의 파일명=키, 내용=값; Docker/K8s secrets가 `/run/secrets/` 등), Spring Cloud Vault나 `EnvironmentPostProcessor`를 안내 `[확인]`. 팀 규약: yml에는 시크릿을 두지 않고 `${DB_PASSWORD}` 같은 플레이스홀더만 두며 값은 환경/시크릿 매니저에서 주입(이 규약 자체는 일반 관행으로, 이번에 기업 1차 출처는 확인 못 함).
- **자주 만지는 키**
  - `spring.datasource.url/username/password/driver-class-name`: URL을 안 주면 Boot가 **임베디드 DB를 자동 구성**하려 한다. 풀은 HikariCP를 항상 우선 선택하며 세부는 `spring.datasource.hikari.*`(키 목록은 HikariCP 문서를 보라고 안내). `connection-fetch: lazy`로 커넥션 획득 지연 `[확인]` Boot sql.
  - HikariCP 풀 크기: "작게 유지". 시작 공식 `connections = (core_count*2) + effective_spindle_count`는 출발점일 뿐이며 풀 크기가 과하면 오히려 느려진다. 한 스레드가 동시에 여러 커넥션을 쥐면 교착 가능, 하한 `Tn x (Cm - 1) + 1` `[확인]` HikariCP 위키. 국내 이론 정리: 한 트랜잭션이 커넥션을 쥔 채 또 하나를 요구하면(`REQUIRES_NEW` 등) 풀이 작을 때 서로 기다리다 `connectionTimeout`(기본 30초)까지 막히고 예외(우아한형제들 HikariCP 이론편) `[확인]`. 글은 최대 풀 크기 기본 10을 사용했고 계산식은 "실전편"에서 다룬다고 해 이 글이 명시한 공식은 없다.
  - `spring.jpa.hibernate.ddl-auto`: 기본으로 **임베디드 DB일 때만 자동 생성**, DDL 실행은 컨텍스트 기동 후로 지연 `[확인]`. (운영에서 `create-drop`/`update` 금지 경고는 공식 해당 페이지에 없음 — 팀 규약으로 정할 사항.) 하이버네이트 네이티브 속성은 `spring.jpa.properties.hibernate.*`로 준다. 우아한형제들 글은 `hibernate.jdbc.batch_size`를 반드시 `spring.jpa.properties.hibernate` 아래에 두라고 강조하고, `IDENTITY` 전략은 insert 배치가 비활성이며 `order_inserts/updates` 기본 false임을 설명 `[확인]`(2695). `spring.jpa.open-in-view`(4절).
  - `logging.level.*`, 로그 그룹(`web`, `sql`), `logging.structured.format.*`(8절).
  - `server.shutdown`, `spring.lifecycle.timeout-per-shutdown-phase`(14절).
  - `management.endpoints.web.exposure.include`: **기본은 `health`만 HTTP 노출**. `*`는 YAML에서 따옴표 필요, `exclude`가 `include`보다 우선. Spring Security가 있고 `SecurityFilterChain`을 직접 정의하면 **Boot의 actuator 보호 자동 구성이 물러나므로** actuator 접근 규칙을 직접 써야 한다 `[확인]` Boot actuator endpoints. 우아한형제들은 `env`(자격증명 노출), `heapdump`(힙에서 설정 노출), `shutdown` 위험을 짚고 `include`에 와일드카드를 쓰지 말고, 별도 `management.server.port`를 쓰라고 권한다 `[확인]`(9232).
  - 지연 초기화 `spring.main.lazy-initialization=true`: 기동은 빨라지나 잘못된 빈이 나중에 실패하고 전체 빈 메모리가 필요 `[확인]` Boot spring-application.

### 흔한 실수와 결과
- 환경변수와 yml 값이 달라 "yml을 고쳤는데 안 바뀐다": 우선순위상 환경변수·커맨드라인이 yml보다 강함(공식).
- 값은 `application-prod.yml`에 두었는데 프로파일이 활성화되지 않아 `default`로 기동 → 의도치 않은 로컬 설정(공식의 default 프로파일 동작).
- `on-profile` 문서 안에 `spring.profiles.active`를 써서 무효(공식 예시).
- `spring.datasource.url` 누락 시 임베디드 DB로 조용히 기동되어 "데이터가 사라진다"(공식 서술에서 도출 — 실제로는 임베디드 DB 의존성이 클래스패스에 있을 때).
- `include: "*"`로 actuator 전부 노출하고 직접 만든 `SecurityFilterChain`이 actuator를 안 막음 → `env`/`heapdump` 노출(공식 경고 + 우아한형제들 글).
- 시크릿을 yml에 커밋: Boot에 암호화가 없으므로 유출 시 그대로 평문(공식에서 도출).
- kebab/camel 표기 혼용으로 `@Value`가 못 읽음(14절).

### 시나리오로 체득시킬 방법
1. **"값이 어디서 왔나"**: `application.yml`, `application-dev.yml`, 환경변수, `--server.port=`가 모두 다른 `server.port`를 가진 상태로 기동시키고, `/actuator/env` 또는 기동 로그로 **최종 값과 출처**를 맞히게 한다. (개별 값의 출처 표시는 `env` 엔드포인트 응답에 포함되는 것이 일반적이나 이번에 해당 페이지는 확인하지 못함.)
2. **시크릿 사건**: 레거시 yml에 DB 비밀번호가 평문으로 있다. `git log`에서 찾아내게 하고 `${DB_PASSWORD}` + `configtree:`(로컬은 `/run/secrets` 흉내)로 옮기는 PR을 쓰게 한다.
3. **Hikari 고갈 재현**: `maximumPoolSize=2`로 두고 `REQUIRES_NEW`가 중첩된 서비스를 동시 호출해 `connectionTimeout` 예외를 겪게 하고, 풀 크기와 트랜잭션 구조 중 무엇이 원인인지 가설→검증(9절 방식).
4. **actuator 점검**: `include: "*"`인 서버에서 `/actuator/env`를 호출해 무엇이 보이는지 확인하게 하고 `include` 최소화+포트 분리로 고친다.

### 출처
- https://docs.spring.io/spring-boot/reference/features/external-config.html `[확인]`
- https://docs.spring.io/spring-boot/reference/features/profiles.html `[확인]`
- https://docs.spring.io/spring-boot/reference/data/sql.html `[확인]`
- https://docs.spring.io/spring-boot/reference/actuator/endpoints.html `[확인]`
- https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing `[확인]`
- https://techblog.woowahan.com/2664/ `[확인]`
- https://techblog.woowahan.com/9232/ `[확인]`
- https://techblog.woowahan.com/2695/ `[확인]`

---

## 16. JPA와 MyBatis: API를 개발하며 체득할 것

### 16-1. 어느 것을 언제 고르나 (실무 근거)
- **확인된 국내 기업 근거**: LINE 커머스(주문 DB 마이그레이션 글)는 JPA에서 "가장 위험한 부분은 지연 로딩 N+1"이라고 보고 **엔티티 간 연관관계를 최소화**, 함께 변경되는 단위로 애그리게이트를 나눠 **항상 fetch join으로 읽기**, 서비스↔퍼시스턴스 사이에 도메인 객체 대신 **업데이트에 필요한 정보만 담은 명세 객체**를 넘기도록 설계했다. MySQL auto increment는 JPA batch insert와 맞지 않아(영속성 컨텍스트가 ID를 요구해 객체마다 INSERT) Snowflake 방식 채번을 택했다 `[확인]`. 컬리는 1만 회원+약 3만 게시글 실험에서 JPA 78초 vs JDBC `batchUpdate` 1.7초로 **JPA는 대량 쓰기에 적합한 도구가 아니라고 보고**, JPA와 JDBC를 섞으면 영속성 컨텍스트가 관리하지 않는 데이터와 엔티티 상태가 어긋날 수 있다고 경고 `[확인]`(단일 환경 측정치). 우아한형제들 정산팀은 엔티티→DTO 반복 포장을 QueryDSL 직접 조회로 바꿔 300줄 이상을 줄였다(3절 `[확인]`). 이들은 **"JPA vs MyBatis" 대결이 아니라 "쓰기=JPA(애그리게이트 단위), 복잡·대량 조회=QueryDSL/JDBC"로 나누는 사례**다.
- 일반론으로 "트랜잭션 많은 쓰기 서버=JPA, 복잡·동적 쿼리 많음=MyBatis, 프로젝트에 따라 혼용(쓰기 JPA/읽기 MyBatis)"이라는 서술이 개인·해외 블로그에 다수 있다 `[검색결과만]`. 사내 표준 판단의 근거로는 약하다. **MyBatis 채택 이유를 설명하는 국내 기업 1차 출처는 이번에 찾지 못했다**(확인 불가 절).
- 시나리오 설계 관점의 정리: 팀이 JPA를 쓰면 "도메인 변경 규칙(영속성)과 단순 CRUD", MyBatis를 쓰면 "SQL 통제권과 복잡한 조회"를 얻는다. **둘 다 겪게 하되 선택 기준을 학습자가 근거와 함께 말하게** 하는 것이 목적이다(추론).

### 16-2. JPA에서 체득할 것
이번 조사에서 **Hibernate 공식 사용자 가이드의 해당 장(영속성 컨텍스트·flush)은 본문까지 확인하지 못했다**(문서 약 40만자 중 일부만 열람, 해당 절 미열람). 아래는 확인된 부분과 시나리오 아이디어이며, 개념 정의는 시나리오 작성 시 Hibernate/Jakarta Persistence 문서로 재확인해야 한다.

| 주제 | 확인된 근거 | 겪게 할 장면 |
|---|---|---|
| 영속성 컨텍스트/세션 | Hibernate Session은 "generally repeatable read 영속성 컨텍스트(1차 캐시)"를 유지하고 한 세션 내 한 행에 한 자바 인스턴스 `[확인]` Hibernate 가이드 | 같은 `findById` 두 번에 쿼리 1회, 동일성(`==`) 확인 |
| flush 시점 | HQL/JPQL 쿼리가 동기화 대상 테이블을 읽으면 보류 상태 변경을 flush한다는 서술 `[확인]`(`@Synchronize` 절). 일반론의 "쿼리 직전 AUTO flush"는 이 문서 발췌로 전체 확인 못 함 | 엔티티 수정 후 JPQL 조회 전 SQL 로그 순서 관찰 |
| 변경 감지 | 이번에 공식 본문 미확인(일반 개념) | setter 호출만으로 UPDATE가 나가는 것을 보고 "저장 안 했는데 저장됨"을 겪기 |
| 지연 로딩/프록시 | 지연 로딩은 런타임 프록시에 의존하며 **엔티티 클래스는 final이면 안 된다**, 양방향 `@OneToOne` 부모 쪽 LAZY는 하이버네이트가 지킬 수 없고(자식 유무를 알려면 쿼리 필요) N+1 원인, `@NotFound`는 LAZY 무시하고 항상 eager `[확인]` Hibernate 가이드 | 트랜잭션 밖 접근으로 `LazyInitializationException`(4절 OSIV 연계) |
| `@Data`/Lombok과 지연 로딩 | `@Data`가 만든 `toString/equals/hashCode`가 지연 프록시 컬렉션을 건드려 세션 종료 후 `LazyInitializationException`, 양방향이면 순환. `@JsonIgnore`는 직렬화만 막음. 해법: `exclude` 또는 `@Getter`/`@Setter`만 사용 `[확인]` 강남언니(`blog.gangnamunni.com/post/hibernate_lombok_lazy/`) | 저장 API가 이상한 검증 예외(`HV000041`)로 터지는 증상에서 원인 추적 |
| `equals/hashCode` | Hibernate 가이드에 전용 절(3.4.7)이 있음을 목차에서 확인했으나 본문은 못 읽음 `[검색결과만 수준]` | 식별자 기반 `equals`와 `Set` 중복 문제 재현 |
| 연관관계 주인/cascade/orphanRemoval | 우아한형제들: 연관관계 편의 메서드 예시와 "생명주기가 같은 엔티티끼리만 객체 참조, 나머지는 ID 참조" 규칙 `[검색결과만]`(2595, 10600). 공식 본문 미확인 | 부모 컬렉션에서 자식을 뺐는데 DB에 남는 경우와 삭제되는 경우 비교 |
| 벌크 연산 | Spring Data: `@Modifying @Query`는 **이미 로드된 엔티티를 갱신하지 않는다**. 자동으로 `clear`하지 않는 이유는 아직 flush 안 된 변경이 버려지기 때문이고, `clearAutomatically=true` 옵션이 있다. 파생 delete는 엔티티를 로드해 하나씩 지우므로 `@PreRemove`가 실행되나 벌크 쿼리는 콜백이 없다 `[확인]` Spring Data JPA 공식. (`flushAutomatically`는 해당 페이지에 없어 확인 못 함) | 벌크 update 후 같은 트랜잭션에서 재조회하면 옛 값이 보이는 것을 겪기 |
| `@Version` | Hibernate 가이드에 낙관적 락 절(11.1)이 있으나 본문 미확인 | 동시 수정으로 `OptimisticLockException` 재현(예외명은 일반 지식) |
| N+1 | Hibernate 가이드: 양방향 `@OneToOne` 부모 쪽 문제(위). 우아한형제들: `join fetch`를 쓰면 부모+자식 한 번에 조회, 대신 자식 엔티티가 업데이트 순서에 섞여 배치가 나뉘므로 `order_updates`를 함께 고려 `[확인]`(2695) | 목록 API에서 쿼리 수를 세어 N+1 확인 → fetch join/배치 |
| 쓰기 성능 | `IDENTITY`는 배치 insert 비활성(우아한형제들 2695 `[확인]`, LINE `[확인]`), `hibernate.jdbc.batch_size`는 `spring.jpa.properties.hibernate` 아래에 | 대량 insert 소요 시간 측정 후 JDBC `batchUpdate`와 비교(컬리 수치와 동일하게 나오리라 가정하지 말 것) |

### 16-3. MyBatis에서 체득할 것 (공식 문서 확인)
- **`#{}` vs `${}`**: `#{}`는 PreparedStatement 파라미터로 안전하게 바인딩. `${}`는 문자열을 그대로 삽입하므로 컬럼명·테이블명·`ORDER BY` 같은 메타데이터에만 쓰고, **"사용자 입력을 그대로 넣는 것은 안전하지 않다"**(입력을 금지하거나 직접 이스케이프·검증) `[확인]` MyBatis 공식 sqlmap-xml.
- **동적 SQL**: `if`, `choose/when/otherwise`, `where`(내용이 있을 때만 `WHERE`, 앞의 `AND/OR` 제거), `trim`, `set`(UPDATE의 불필요한 쉼표 제거), `foreach`(IN 목록), `bind` `[확인]` 동적 SQL 문서.
- **`resultMap` association/collection과 N+1**: `association`=has-one, `collection`=has-many(`ofType`). **중첩 select는 부모 행마다 별도 쿼리**를 실행해 "수백~수천 개의 SQL"이 될 수 있고, lazy loading은 지연시킬 뿐 목록을 순회하면 모두 실행된다. 해법은 **JOIN 하나로 가져오는 중첩 결과(nested results)**: 컬럼 별칭이 유일해야 하고 `<id>`를 선언하지 않으면 성능이 떨어진다 `[확인]` sqlmap-xml.
- 타입 핸들러·배치 `ExecutorType.BATCH`: 이번 조사에서 공식 페이지를 열지 못함(확인 불가).
- **우아한형제들 정산 리뷰의 교훈(MyBatis 아님, 데이터 계층 일반)**: 생성자 기반 Projection은 필드 순서가 어긋나도 조용히 잘못 매핑되고, 배치 Reader가 `setMethodName()`으로 다른 모듈 Repository를 **문자열로 참조**하면 메서드명 변경을 못 잡는다 `[확인]`(7828). MyBatis의 XML 문자열 id/컬럼 매핑에도 비슷한 위험이 있다는 것은 추론이다.

### 16-4. 같은 프로젝트에서 JPA와 MyBatis를 섞을 때
- MyBatis-Spring은 Spring 관리 트랜잭션에 참여하며 **트랜잭션 동안 하나의 `SqlSession`을 만들어 쓰고** 트랜잭션 완료 시 커밋/롤백한다. 표준은 `DataSourceTransactionManager`이며 **트랜잭션 매니저와 `SqlSessionFactoryBean`은 같은 `DataSource`를 써야** 트랜잭션이 동작한다. **`JpaTransactionManager` 지원 여부는 해당 페이지에 없다** `[확인]` MyBatis-Spring transactions(공식에서 `DataSourceTransactionManager`/JTA만 서술).
- JPA 쪽: JPA가 flush한 변경은 같은 트랜잭션(같은 커넥션)에서만 보이고 커밋 전에는 다른 연결에서 보이지 않는다는 서술이 있다 `[검색결과만]` 인프런. 따라서 MyBatis가 **같은 커넥션/트랜잭션에 참여하지 않으면** JPA의 미커밋 변경을 못 본다(추론). 두 방식을 같은 트랜잭션에서 쓰려면 flush/clear 시점과 조회 순서를 맞춰야 한다는 컬리 경고 `[확인]`. 반대로 MyBatis로 갱신한 값은 JPA 영속성 컨텍스트에 이미 로드된 엔티티에 반영되지 않아 옛 값이 남는 것은 위 벌크 연산과 같은 원리다(추론; 직접 재현으로 확인할 것).

### 흔한 실수와 결과 (요약)
- `${}`로 사용자 정렬 키를 받아 SQL 인젝션 가능(공식 경고).
- MyBatis `association`에 중첩 select를 써서 목록 API가 수천 쿼리(공식).
- JPA 엔티티를 수정(flush 전)한 뒤 MyBatis로 조회/집계해 수정 전 값 또는 일관되지 않은 결과(추론, 컬리의 혼용 경고와 일치).
- 벌크 `@Modifying` 후 같은 트랜잭션에서 옛 값 조회(Spring Data 공식).
- 엔티티 `@Data`로 지연 로딩 예외(강남언니).
- 대량 insert를 `saveAll`로 → IDENTITY라 건건 insert(우아한형제들, LINE, 컬리).

### 시나리오로 체득시킬 방법
1. **쿼리 수 세기**: 게시글 목록 API를 JPA(연관 LAZY)와 MyBatis(중첩 select)로 각각 구현된 상태로 주고 SQL 로그에서 쿼리 수가 N+1로 나오는 것을 세게 한다. 이어 fetch join/배치 크기(JPA), 중첩 결과 JOIN(MyBatis)으로 고쳐 쿼리 수를 1~2회로 줄이는 것이 완료 조건.
2. **인젝션 체험**: `ORDER BY ${sort}`로 정렬 파라미터를 받는 게시판 검색 API에 `sort=id; ...`를 넣어 실패/성공을 확인하고 화이트리스트로 고친다(로컬 DB에서만).
3. **혼용 함정**: 한 서비스 메서드에서 JPA로 게시글 제목을 수정하고 MyBatis 통계 쿼리로 같은 게시글을 읽게 한다. 트랜잭션 매니저/DataSource 설정에 따라 결과가 달라지는지 직접 실험하고, flush 위치와 매니저를 바꿔 본다. **결과는 설정에 따라 달라질 수 있으니 학습자가 실험으로 규칙을 도출**하게 한다.
4. **선택 토론**: 같은 요구 5개(단건 CRUD, 복잡 검색, 통계, 대량 배치, 상태 전이)에 대해 JPA/QueryDSL/MyBatis/JDBC 중 고르고 근거를 쓰게 한다. LINE(연관 최소화+fetch join), 컬리(대량은 JDBC), 정산(QueryDSL 직접 조회) 사례를 참고 자료로 준다.

### 출처
- https://mybatis.org/mybatis-3/sqlmap-xml.html `[확인]`
- https://mybatis.org/mybatis-3/dynamic-sql.html `[확인]`
- https://mybatis.org/spring/transactions.html `[확인]`
- https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html `[확인]`
- https://docs.hibernate.org/orm/current/userguide/html_single/ `[확인, 일부 열람]`
- https://techblog.lycorp.co.jp/ko/experience-in-migrating-order-db-on-ecommerce-platform `[확인]`
- https://helloworld.kurly.com/blog/bulk-performance-tuning/ `[확인]`
- https://techblog.woowahan.com/2695/ `[확인]`
- https://blog.gangnamunni.com/post/hibernate_lombok_lazy/ `[확인]`
- https://techblog.woowahan.com/7828/ `[확인]`

---

## 17. 한 서버에 심을 결함 지도 (시나리오 설계 입력)

| 심을 결함 | 겪는 증상 | 체득 주제 |
|---|---|---|
| 싱글톤 서비스 필드, 공유 `SimpleDateFormat` | 부하에서만 섞이는 값 | 1 |
| 필드 주입 + 서비스 간 순환 | 생성자 주입 전환 시 기동 실패 | 2 |
| 비대한 `PostService`(알림·포인트·색인 포함) | 요구 변경마다 회귀 | 3, 7 |
| 엔티티 직접 응답, setter 난무, 양방향 순환 | 비밀번호 노출, 직렬화 순환, 스키마 변경이 API 변경 | 4, 13 |
| 컨벤션 위반(`getList2`, 빈 catch, 로마자 이름) | 리뷰 연습, Checkstyle | 5 |
| `permitAll`이 `denyAll`/관리자 규칙 앞에, CORS 미연결, CSRF 무조건 off | 무인증 관리자 호출, 프리플라이트 실패 | 6 |
| 자기 호출 `@Transactional`/`@Retryable`/`@PreAuthorize`, 내부 예외 삼킴 | 적용 안 됨, `UnexpectedRollbackException` | 7 |
| 트랜잭션 안 외부 호출 | 커넥션 고갈, 지연 | 7 |
| 요청 ID 없는 로그, 비밀번호 로깅, 전부 ERROR | 추적 불가, 알람 피로 | 8 |
| 특정 3건만 터지는 NPE | 조건부 중단점·재현 테스트 | 9 |
| 에러 응답 3종 혼재, IAE→400 | 프론트 파싱 실패, 5xx 0 | 10 |
| 테스트 `@Transactional`로 통과, mock 남발 | 운영에서만 실패, 리팩토링마다 깨짐 | 11 |
| `if-else` 확장 채널, 쌍으로만 있는 인터페이스 | 변경 집중 / 과잉 구조 | 12 |
| 응답 필드 rename | 프론트·앱 깨짐 | 13 |
| `@PostConstruct`에서 무거운 적재, `@Component`+`@Bean` 상호 호출, `@Async` 리스너 | 기동 지연, 서로 다른 인스턴스, MDC/예외 유실 | 14 |
| yml 평문 시크릿, `include:"*"` actuator, 우선순위 착각 | 값 안 바뀜, 자격증명 노출 | 15 |
| 중첩 select N+1, `${sort}`, JPA+MyBatis 혼용 조회 | 쿼리 폭증, 인젝션, 옛 값 | 16 |

권장 진행: (a) 신규 구축 단계에서 규칙을 지키며 만들게 하고 (b) 유지보수 단계에서 위 결함을 하나씩 "증상→원인→수정→재발 방지 테스트" 순으로 겪게 한다. 평가 기준은 "원인 서술 + 재현 테스트 + 수정"의 3점 세트가 적합하다(컬리 디버깅 스터디의 구조와 정합).

---

## 확인 불가 / 한계

- **OSIV의 기업 1차 출처**: 커넥션 장시간 점유와 LazyInitializationException 트레이드오프를 다룬 국내 기업 글(예: 프렌트립 Medium "Spring Boot의 open-in-view, 그 위험성에 대하여")이 검색에는 나왔으나 서버가 403을 반환해 본문을 읽지 못했다. 이 글은 근거로 쓰지 않았다. Boot 공식 문서의 기본값 사실만 확인했다.
- **Boot 버전별 동작**: 순환 참조 기본 허용 여부(`spring.main.allow-circular-references`), 기본 `proxyTargetClass`, `@MockitoBean`/`@MockBean` 구분, Security 6/7 API 차이는 버전마다 다르다. 이번에 열어 본 Boot 문서는 4.1.x, Framework 문서는 7.x 계열(resilience 문서 존재)로 보인다. 사내 표준 버전에 맞춰 재확인해야 한다.
- **"단일 모듈 게시판의 패키지 구조(계층형 vs 도메인형)"**: 우아한형제들 멀티모듈 글은 모듈 단위 구조를 다루며, 단일 모듈 패키지 논쟁을 직접 다룬 기업 글은 이번에 확인하지 못했다. Medium 개인 글만 검색됨.
- **인터페이스 과잉 추상화 논쟁**과 **전략 패턴 Map/List 주입**: 권위 있는 단일 출처를 못 찾았다(인프런·벨로그·Medium만). Spring 공식 문서의 컬렉션 자동 주입 절을 직접 확인해 보강해야 한다.
- **로그 민감정보 마스킹(Logback `PatternLayout`/`Converter`/JSON 필드 마스킹)**: 국내 기업 글을 찾지 못했다. LINE의 Sentry 전송 전 헤더 제거 권고만 있다.
- **Spring Security JWT 필터**: 국내 기업의 구체 적용 글(EntryPoint/AccessDeniedHandler 포함)은 못 찾았다. 일반 패턴은 영문 Medium 글에 의존하므로 공식 OAuth2 Resource Server 문서로 교차 확인 필요.
- **IntelliJ 디버거**: Evaluate Expression의 단축키·제약은 JetBrains 가이드/구버전 도움말 검색결과 기준이다(현행 버전 문서는 읽지 못함). 조건부/로깅 중단점은 현행 문서를 확인했다.
- **`SimpleDateFormat` 스레드 비안전성**: JDK Javadoc 원문은 직접 열지 않았고 블로그 서술만 있다. 컬리의 ByteBuffer 사례는 확인된 실사례이나 싱글톤 빈 필드 사례는 아니다.
- **테스트의 `@Transactional` 함정**: 우아한형제들 파랑새 글(14874)에서 확인했다고 검색 요약이 인용했으나 해당 문장 자체는 본문 요약 fetch에서 재확인하지 못했다. 시나리오에서 직접 재현해 검증할 것.
- **토스 테스트 전략 글**: 본문 116,814자 중 앞 100,000자만 읽었다. 나머지에 반례/한계가 더 있을 수 있다.
- **API 하위 호환 규칙**(추가→전환→삭제, 소비자 주도 계약 테스트)의 국내 기업 1차 출처는 토스페이먼츠 버저닝 사례 외에는 못 찾았다.
- 수치(우아한형제들 17.7→7.6초, 카카오페이 readOnly 2~3배 처리량 차이 등)는 **각 글의 특정 환경 측정치**이며 일반화하지 말 것.
- 검색 도구가 미국 지역 한정이라 네이버 D2, 카카오(tech.kakao.com), 당근, 무신사 글은 해당 주제로 걸러지지 않았다. 이들 출처는 주제별로 직접 사이트 검색으로 보강할 여지가 있다.
- **(14~16절 추가분)** Hibernate 공식 사용자 가이드(약 40만자)에서 영속성 컨텍스트·변경 감지·AUTO flush·`equals/hashCode`·`orphanRemoval`·`@Version` 본문은 확인하지 못했다(열람한 구간에 해당 절이 없었음). 해당 개념 서술은 시나리오 작성 전 Hibernate/Jakarta Persistence 문서로 재확인 필요.
- MyBatis 타입 핸들러·`ExecutorType.BATCH`·MyBatis-Spring-Boot 자동 구성은 공식 페이지를 열지 못했다. JPA와 MyBatis를 **JpaTransactionManager 하나로 같은 트랜잭션에 묶을 수 있는지**는 MyBatis-Spring 공식 페이지에 서술이 없어 확인하지 못했다(인프런 질문 `[검색결과만]`에 혼용 시 트랜잭션 충돌 보고만 있음).
- "JPA vs MyBatis를 어느 쪽으로 고르는가"에 대한 **국내 기업의 MyBatis 채택/혼용 근거 글**은 찾지 못했다. LINE·컬리·우아한형제들은 JPA 측 설계 결정과 대량 처리 한계를 다룰 뿐 MyBatis 비교는 아니다.
- 14절: `@Qualifier` 공식 페이지(`autowired-qualifiers`)와 `NoUniqueBeanDefinitionException` 세부, prototype 소멸 콜백 비호출의 직접 인용은 확인하지 못했다. `@PostConstruct`로 인한 기동 교착의 실제 장애 사례는 찾지 못했다(공식 경고에서 도출한 추론).
- 15절: `/actuator/env`가 프로퍼티 출처를 보여 주는지는 해당 페이지에서 확인하지 못했다. `spring.jpa.show-sql`과 개별 `spring.datasource.hikari.*` 키 목록은 열람한 Boot 페이지에 없었다. Boot 문서는 4.1.x 기준이다. 시크릿을 yml에 두지 않는 규약의 기업 1차 출처는 찾지 못했다.
- 우아한형제들 10600/2595(연관관계 규칙)와 컬리 `2026-outbox…`는 검색결과 요약만 확인했다.
