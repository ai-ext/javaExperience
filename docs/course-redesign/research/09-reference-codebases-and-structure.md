# 09. 참고 코드베이스, 구조 변경 사례, Spring 자격시험 범위, Entity 설계 관례

조사일: 2026-10-22. 목적: 게시판/커뮤니티 서버를 빈 프로젝트부터 키우며 Entity 다수 생성 -> 서비스 분리 -> 레이어·패키지 재구성을 경험시키는 온보딩 설계의 근거.
범위 제외: DI, static vs bean, DTO/Entity 경계, Security, AOP, 로깅, yml, JPA/MyBatis 개별 주제(다른 조사 담당).

표기: **[직접 확인]** = 레포를 `git clone --depth 1` 로 받아 파일을 열어 확인. **[글 확인]** = 원문 페이지를 열어 확인. 수치는 clone 시점 기준이며 `java 파일 수`는 `find -name '*.java'` 총합(테스트 포함), `테스트 파일`은 파일명에 `Test`가 들어간 개수다.

---

## 1. 실서비스급 Spring Boot 코드베이스 (직접 clone 후 확인)

### 1.0 한눈에 보기

| # | 레포 | 규모(java 파일/엔티티류/모듈) | 패키지 구조 | Entity 스타일 | 이 온보딩에서의 용도 |
|---|------|------|------|------|------|
| 1 | woowacourse-teams/2023-hang-log (backend) | 298 / 16 / 단일 | 도메인형 + 각 도메인 내부 계층(domain, service, presentation, dto) | Getter + protected 기본 생성자, 정적 팩토리, Setter 없음 | **1순위 모델**. 커뮤니티(community)/좋아요(like)/이벤트 리스너를 가진 서버 |
| 2 | woowacourse-teams/2022-dallog (backend) | 217 / 8 / 단일 | 도메인형 + 계층 | **Lombok 미사용**, 수동 protected 생성자, `change()` | Lombok 없이 쓰는 엔티티, 인수 테스트 |
| 3 | woowacourse-teams/2021-zzimkkong (backend) | 281 / 7 / 단일 | **계층형**(controller, service, domain, dto, repository) | public `@NoArgsConstructor` + 클래스 `@Builder` | 계층형이 커진 모습, 반면교사 겸 비교용 |
| 4 | cheese10yun/spring-jpa-best-practices | 60 / 6 / 단일 | 도메인형(Account, order, delivery, coupon) | protected 생성자 + **생성자 레벨 `@Builder`** + `@Embedded` VO | JPA 엔티티 관례 교재 |
| 5 | thombergs/buckpal | 46 / 2 / 단일 | **헥사고날**(adapter/in, adapter/out, application/port, domain) | 도메인 모델과 JPA 엔티티 **분리** | 헥사고날 + ArchUnit 의존 규칙 테스트 |
| 6 | gothinkster/spring-boot-realworld-example-app | 116 / 0 (MyBatis) / 단일 | core, application, api, infrastructure (DDD풍 + CQRS 읽기 서비스) | JPA 아님. POJO + `@Getter @NoArgsConstructor` | 게시글/댓글/태그/팔로우 = 커뮤니티 도메인 그 자체, 읽기·쓰기 분리 |
| 7 | spring-petclinic/spring-petclinic-microservices | 64 / 6 / 8개 서비스 모듈 | 서비스별 독립 모듈 | Lombok 없음, 명시 getter/setter | 모듈/서비스 단위 분리의 최소 예제 |
| 8 | elunez/eladmin | 274 / 22 / 6개 Maven 모듈 | 모듈(system, maint, tools...) 안에서 계층형(rest, service, repository, domain) | 전 엔티티 `@Getter @Setter` | **반면교사**: Setter 개방 + MapStruct DTO |

보조(간단 확인만): spring-projects/spring-petclinic(50 / 6 / 단일, 도메인형 owner·vet·system, Lombok 없음, `BaseEntity`는 id만 + setId), citerus/dddsample-core(145 / 6, domain.model.cargo 등 DDD 구조, `protected Cargo()`), macrozheng/mall(524 java / 7개 모듈 / MyBatis Generator 모델, 엔티티 없음, 테스트 파일 5개).

> 주의: 한국 레포 3개(hang-log, dallog, zzimkkong)는 `woowacourse-teams` 조직의 팀 프로젝트다. 실제 트래픽 규모는 레포만으로 확인하지 못했다. "실서비스급 규모의 구조"로 보되 "대규모 운영 서버"라고 단정하지 않는다.

### 1.1 woowacourse-teams/2023-hang-log (backend)

- URL: https://github.com/woowacourse-teams/2023-hang-log (코드는 `backend/`, 마지막 커밋 2024-04-24)
- 규모: java 298, 테스트 파일 60, 엔티티류 16(`BaseEntity` 포함), Spring Boot 3.1.1, 단일 모듈. 서비스 클래스 15개 중 최대 `ItemService` 285줄, `TripService` 251줄, `CommunityService` 193줄.
- 패키지: `hanglog/{trip, community, like, member, expense, city, currency, category, image, login, auth, admin, global, listener}`. 도메인 안에 `domain`(+`repository`), `service`, `presentation`, `dto/{request,response}`. 전역 `global/exception`, `global/config`, `listener`(이벤트 리스너)는 도메인 밖.
- Entity 관례 [직접 확인]:
  - 엔티티 16개 중 15개가 `@Getter @NoArgsConstructor(access = PROTECTED)`. `@Setter`/`@Data`/`@Builder` 0건. 생성은 public 생성자 + 정적 팩토리(`Trip.of(...)`), 변경은 `update(...)`, 삭제는 `changeStatusToDeleted()` 같은 의도 메서드.
  - 일부(Likes, Category, City, Currency, Place, SharedTrip, PublishedTrip)는 `@AllArgsConstructor` 도 함께 사용.
  - `BaseEntity`(`@MappedSuperclass` + `AuditingEntityListener`): `createdAt`, `modifiedAt`, `status(USABLE/DELETED)`. 엔티티에 `@SQLDelete` + `@Where(clause = "status = 'USABLE'")` 로 소프트 삭제.
  - 연관관계: `@ManyToOne(fetch = LAZY)`, 부모-자식(Trip -> DayLog, SharedTrip)에만 `cascade = {PERSIST, REMOVE, MERGE}, orphanRemoval = true`. `@Enumerated(STRING)`.
- 서비스 분리 방식: 도메인별 서비스. `trip` 안에서도 `TripService`, `ItemService`, `DayLogService`, `LedgerService`, `ImageService`, `SharedTripService`로 쪼개짐. 결합은 `ApplicationEventPublisher`(`TripDeleteEvent`, `PublishEvent`, `S3ImageEvent`, `MemberDeleteEvent` 등)로 끊고 `listener/*EventListener`(`@TransactionalEventListener`, `@Async`)에서 처리. 추천 로직은 `community/domain/recommendstrategy/`에 Strategy 패턴. Querydsl 커스텀 레포(`CustomTripRepository` 등)는 `domain/repository` 아래.
- 테스트 구조: 도메인 패키지 미러링(`trip/{domain,dto,fixture,presentation,service}`) + 최상위 `integration/`.
- 읽어 볼 파일 3개:
  1. `backend/src/main/java/hanglog/trip/domain/Trip.java` (엔티티 한 개에 생성자, 팩토리, 변경 메서드, 연관관계 정책이 모두 있음)
  2. `backend/src/main/java/hanglog/trip/service/ItemService.java` (285줄. "서비스가 커졌을 때 어떻게 찢을까" 연습 소재)
  3. `backend/src/main/java/hanglog/listener/DeleteEventListener.java` + `trip/service/TripService.java`의 `publishEvent` 호출부 (이벤트로 결합 끊기)

### 1.2 woowacourse-teams/2022-dallog (backend)

- URL: https://github.com/woowacourse-teams/2022-dallog (코드는 `backend/`, 마지막 커밋 2023-07-31)
- 규모: java 217, 테스트 파일 50, 엔티티류 8, Gradle 단일 모듈. `javax.persistence`(Boot 2.x 계열).
- 패키지: `com/allog/dallog/{auth, category, categoryrole, externalcalendar, member, schedule, subscription, infrastructure, global}`, 각 도메인에 `domain`, `application`, `presentation`, `dto`, `exception`. 서비스 계층 이름이 `service`가 아니라 `application`.
- Entity 관례 [직접 확인]: **main 소스에서 lombok import 0건.** `protected Schedule() {}` 수동 선언, public 생성자 안에서 `validateTitleLength`, `validatePeriod` 같은 검증 후 대입, `change(...)` 메서드로 변경. `BaseEntity`에 `AuditingEntityListener`. `CategoryRole`에만 `@Version`(낙관적 락). 예외도 도메인별(`exception/`)로 분리.
- 테스트 구조: 도메인 미러링 + `acceptance/`(인수 테스트, `AcceptanceTest`, `*AcceptanceTest`) + `common/`(`DatabaseCleaner`, 빌더, 상수).
- 읽어 볼 파일 3개:
  1. `backend/src/main/java/com/allog/dallog/schedule/domain/Schedule.java` (Lombok 없이 쓴 엔티티 + 생성 시점 검증)
  2. `backend/src/test/java/com/allog/dallog/acceptance/AcceptanceTest.java` (인수 테스트 베이스)
  3. `backend/src/main/java/com/allog/dallog/global/entity/BaseEntity.java`

### 1.3 woowacourse-teams/2021-zzimkkong (backend)

- URL: https://github.com/woowacourse-teams/2021-zzimkkong (코드는 `backend/`, 마지막 커밋 2026-03-17)
- 규모: java 281, 테스트 파일 62, 엔티티류 7. 단일 모듈.
- 패키지: **계층형**. `com/woowacourse/zzimkkong/{controller, service, repository, domain, dto/{reservation,member,space,map,...}, exception/{reservation,member,...}, config/logaspect, infrastructure}`. `service/strategy/`(9개)에 전략 분리. exception 패키지가 가장 비대(reservation 17, member 8 ...).
- Entity 관례 [직접 확인]: 7개 중 5개가 클래스 레벨 `@Builder` + public `@NoArgsConstructor`(protected 아님), `Member`는 `@AllArgsConstructor`까지. `@Setter` 없음. `Space`에서 `map.addSpace(this)`, `allowedGroup.updateSpace(this)` 같은 연관관계 편의 메서드로 양방향 유지.
- 서비스 분리: `ReservationService` 355줄, `SpaceService` 265줄. 계층형에서 한 서비스가 커지고 `service/strategy`로 부분 분리한 흔적.
- 테스트 구조: `controller`, `domain`, `service`, `repository`, `infrastructure`, `config` 로 main 미러링 + `DatabaseCleaner`.
- 읽어 볼 파일 3개:
  1. `backend/src/main/java/com/woowacourse/zzimkkong/service/ReservationService.java` (355줄, 분리 연습 소재)
  2. `backend/src/main/java/com/woowacourse/zzimkkong/domain/Space.java` (Builder.Default, 연관관계 편의 메서드)
  3. `backend/src/main/java/com/woowacourse/zzimkkong/service/strategy/` (이미 분리된 부분)

### 1.4 cheese10yun/spring-jpa-best-practices

- URL: https://github.com/cheese10yun/spring-jpa-best-practices (마지막 커밋 2023-07-03)
- 규모: java 60, 테스트 파일 16, 엔티티 6(Account, Order, Delivery, DeliveryLog, Coupon + Auditing), 단일 모듈. 규모는 작지만 JPA 관례 교재로 가치가 큼.
- 패키지: 도메인형(`Account/{api,application,dao,domain,dto,exception}`, `order`, `delivery`, `coupon`, `common/model`, `error`, `config`). 단, 패키지명이 대문자 `Account`.
- Entity 관례 [직접 확인]: `@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)`, **`@Builder`를 생성자에 부착**(`@Builder public Account(Email, String, String, Password, Address)`), `@Embedded` VO(`Email`, `Password`, `Address`), 조회 서비스(`AccountFindService`)와 쓰기 서비스(`AccountService`) 분리, QueryDSL 지원 레포(`AccountSupportRepositoryImpl`). 
- 테스트: `OrderServiceTest`, `AccountRepositoryTest`, `AccountIntegrationTest`, `model/EmailTest` 등 VO 단위 테스트까지.
- 읽어 볼 파일 3개: `src/main/java/com/cheese/springjpa/Account/domain/Account.java`, `.../Account/dao/AccountSupportRepositoryImpl.java`, `.../delivery/Delivery.java`

### 1.5 thombergs/buckpal (헥사고날 레퍼런스)

- URL: https://github.com/thombergs/buckpal (책 "Get Your Hands Dirty on Clean Architecture"의 예제, 마지막 커밋 2023-07-24)
- 규모: java 46, 테스트 파일 11, JPA 엔티티 2, 단일 Gradle 모듈.
- 패키지: `adapter/in/web`, `adapter/out/persistence`, `application/domain/{model,service}`, `application/port/{in,out}`, `common`.
- Entity 관례 [직접 확인]: 도메인 모델 `Account`(`application/domain/model`)는 JPA와 무관한 순수 객체(`@AllArgsConstructor(access = PRIVATE)` + `@Getter`). JPA 엔티티 `AccountJpaEntity`는 `adapter/out/persistence`에 **package-private** 으로 두고 `@Data @AllArgsConstructor @NoArgsConstructor`를 사용, `AccountMapper`로 상호 변환.
- 테스트 구조: 도메인 단위(`AccountTest`), 서비스(`SendMoneyServiceTest`), 어댑터(`AccountPersistenceAdapterTest`, `SendMoneyControllerTest`), 시스템(`SendMoneySystemTest`), **ArchUnit 의존 규칙 테스트**(`DependencyRuleTests`, `archunit/HexagonalArchitecture.java`).
- 읽어 볼 파일 3개: `.../application/domain/model/Account.java`, `.../adapter/out/persistence/AccountJpaEntity.java` + `AccountMapper.java`, `src/test/java/io/reflectoring/buckpal/DependencyRuleTests.java`
- 관찰: 이 레포는 JPA 엔티티에 `@Data`를 허용한다(패키지 밖으로 노출되지 않아서). 헥사고날에서는 영속 모델이 "어댑터 내부 구현"이라 다른 규칙이 적용되는 사례. 즉 "Lombok 규칙은 엔티티가 도메인 모델이냐 영속 모델이냐에 따라 달라진다"는 학습 포인트.

### 1.6 gothinkster/spring-boot-realworld-example-app

- URL: https://github.com/gothinkster/spring-boot-realworld-example-app (마지막 커밋 2022-06-08)
- 규모: java 116, 테스트 파일 23, MyBatis 사용(JPA 엔티티 0). REST + GraphQL 두 진입점.
- 패키지: `io.spring.{api, graphql, application, core, infrastructure}`. `core/{article,comment,favorite,user,service}`(도메인 모델 + 도메인 서비스), `application/*QueryService`(읽기 전용 조회, `data/`에 읽기 모델 DTO, 커서 페이징), `infrastructure/{mybatis,repository,service}`.
- Entity 관례 [직접 확인]: `Article`은 `@Getter @NoArgsConstructor @EqualsAndHashCode(of = {"id"})`, 생성자에서 `UUID`, slug 계산. Setter 없음, id만으로 동등성 비교.
- 서비스 분리: **쓰기(core + api 직접 호출)와 읽기(`ArticleQueryService`, `CommentQueryService`, `ProfileQueryService` ...)를 분리**한 CQRS 풍. 게시글/댓글/태그/팔로우/즐겨찾기라 커뮤니티 도메인과 거의 일치.
- 테스트: `api`(웹 슬라이스), `application`, `core`, `infrastructure`(`DbTestBase`).
- 읽어 볼 파일 3개: `src/main/java/io/spring/core/article/Article.java`, `.../application/ArticleQueryService.java`, `.../infrastructure/mybatis/` 하위 매퍼
- 한계: JPA 아님. Entity 관례 학습에는 부분적으로만 유효.

### 1.7 spring-petclinic/spring-petclinic-microservices

- URL: https://github.com/spring-petclinic/spring-petclinic-microservices (마지막 커밋 2026-10-07)
- 규모: java 64, 테스트 파일 10, 엔티티 6, Maven 8개 모듈(`customers-service`, `vets-service`, `visits-service`, `genai-service`, `api-gateway`, `config-server`, `discovery-server`, `admin-server`).
- 패키지: 서비스 모듈 안에서 `model`, `web`, `config`. 예: `visits` 모듈 = `VisitsServiceApplication`, `web/VisitResource`, `model/{Visit,VisitRepository}`.
- Entity 관례 [직접 확인]: Lombok 미사용(`lombok` import 0, `@Data/@Setter` 0). `Visit`은 `@Entity @Table` + 명시 getter/setter, `pet_id`를 연관관계가 아닌 **`int petId` 값으로 보유**(서비스 경계를 넘는 참조는 객체 연관이 아닌 id).
- 읽어 볼 파일 3개: 루트 `pom.xml`(모듈 목록), `spring-petclinic-visits-service/.../model/Visit.java`, `.../visits/web/VisitResource.java`
- 관찰: "서비스를 가르면 엔티티 간 객체 참조가 id 참조로 바뀐다"를 보여 주는 가장 작은 예제.

### 1.8 elunez/eladmin (반면교사)

- URL: https://github.com/elunez/eladmin (마지막 커밋 2026-05-09)
- 규모: java 274, 테스트 파일 6(이름 기준), 엔티티류 22, Maven 멀티모듈(`eladmin-common, -generator, -logging, -system, -tools`).
- 패키지: `me.zhengjie.modules.{system,maint,security}` 각각 `rest`, `service/{impl,dto,mapstruct}`, `repository`, `domain`. 모듈 안 계층형 + 별도 `service/dto` + MapStruct.
- Entity 관례 [직접 확인]: 22개 전부 `@Getter @Setter`(일부 `@Data`), `BaseEntity`에도 `@Setter`. `@ManyToMany(fetch = EAGER)`(`User`, `Role`). 테스트 파일은 극히 적음.
- 용도: "Setter 전면 개방 + 얇은 테스트"가 어떤 모습인지 비교 소재. 좋은 예제로 권하지 않는다.
- 읽어 볼 파일 3개: `eladmin-system/src/main/java/me/zhengjie/modules/system/domain/User.java`, 같은 모듈 `service/mapstruct/`, `rest/`

### 1.9 학습 동선 제안 (근거: 위 관찰)

| 단계 | 읽을 코드 | 보여 주는 것 |
|------|-----------|--------------|
| 처음 엔티티를 만들 때 | cheese10yun `Account`, dallog `Schedule` | protected 생성자, 생성 시점 검증, 의도 메서드, VO |
| 엔티티가 10개 넘을 때 | hang-log `BaseEntity`, `Trip` | Auditing, 소프트 삭제, 부모-자식 cascade |
| 서비스가 300줄 넘을 때 | zzimkkong `ReservationService`, hang-log `ItemService` | 비대 서비스 실물 + 분리 시도 흔적 |
| 도메인 간 결합이 보일 때 | hang-log `listener/*` | 이벤트로 끊기 |
| 패키지 구조를 바꿀 때 | zzimkkong(계층형) vs hang-log(도메인형) | 같은 조직 다른 구조 비교 |
| 헥사고날을 시도할 때 | buckpal + `DependencyRuleTests` | 포트/어댑터, 의존 규칙 자동 검증 |
| 서비스를 물리적으로 나눌 때 | petclinic-microservices `Visit.petId` | 객체 참조 -> id 참조 |

---

## 2. 서비스 성장에 따라 구조를 바꾼 기업 사례 (원문 확인)

| # | 회사 / 제목 | 날짜 | 무엇이 문제였나 | 무엇으로 바꿨나 | URL |
|---|------|------|------|------|------|
| 1 | 우아한형제들 / 멀티모듈 설계 이야기 with Spring, Gradle | 2019-07-01 | 회원 시스템을 internal/external API, batch로 나눠 도메인 코드를 복사해 운영 -> 멀티모듈로 합치자 `common` 모듈이 비대해지고(수정 영향 범위 확대, 모든 스타터 자동설정 공유, 가장 민감한 앱 기준 설정이 전체에 적용) | 모듈을 책임 단위로: 독립/공통/도메인/내부/어플리케이션. 의존 방향 제한, "하나의 모듈은 최대 하나의 인프라에 대한 책임만 갖는다", 어플리케이션 계층에서 `implementation`으로 의존성 은닉, 모듈별 README | https://techblog.woowahan.com/2637/ |
| 2 | 우아한형제들 / 회원시스템 이벤트기반 아키텍처 구축하기 | 2022-04-12 | 본인인증 해제 시 가족계정 탈퇴 같은 정책이 회원 도메인에 얽힘. 시스템을 분리해도 "상대가 이걸 하라"는 메시지라 논리적 결합 유지 | 발행자는 사실(도메인 이벤트)만 발행, 구독자가 자기 로직 구현. 3계층 이벤트, 도메인과 같은 RDBMS에 이벤트 저장(Transactional Outbox), 5분 배치 재발행 | https://techblog.woowahan.com/7835/ |
| 3 | 우아한형제들(WMS플랫폼팀) / 전체 서비스를 관통하는 도메인 모듈을 안전하게 분리하기 | 2025-05-29 | 입고/재고/출고가 패키지 분리도 없이 한 도메인, 재고가 모두와 결합해 작은 수정도 큰 QA 범위. api/consumer/batch가 한 도메인 모듈에 의존 | `domain-inventory` 분리, 결합 클래스는 임시 `service-wms`에 격리, **엔티티 연관관계 제거 + QueryDSL join 제거 후 서비스 레이어에서 조합**, 포트-어댑터, 엔티티를 코어 서비스 밖으로 반환 금지, 영향 API 231개를 ~27개 피처 플래그로 센터별 점진 배포, ArchUnit 규칙 검증, ADR. 단점으로 "같은 기능에 코드가 더 필요" 언급 | https://techblog.woowahan.com/22151/ |
| 4 | 우아한형제들 / Spring Boot Kotlin Multi Module로 구성해보는 헥사고날 아키텍처 | 2023-07-11 | 기술 선택 논쟁 비용, 기술이 비즈니스 코드에 깊이 결합 | Domain / Application / Framework / Bootstrap 4개 헥사곤 멀티모듈. 트레이드오프로 수동 객체 변환 반복, 유사 객체 중복, outputPort 인터페이스 증가, 전 유스케이스 bean 등록 문제(`lazyInit`로 대응) 명시. 저자도 "완전한 헥사고날은 아니다"라고 밝힘 | https://techblog.woowahan.com/12720/ |
| 5 | 카카오뱅크 / 유일한 멀티모듈 헥사고날 아키텍처: 메시지 허브 적용기 | 2023-11-30 | 한 도메인을 api/data-api/loader/consumer 4개 서비스로 나눴는데 모두 DB 접근(커넥션 풀 한계), 브로커 메시지를 전부 수신, 서비스별 헥사고날이면 로직·어댑터 중복 | 프라이머리 어댑터 / 코어 / 세컨더리 어댑터를 모듈로 분리하고 서비스별로 조합(빌드 타임 선택). "개발 허들은 분명 존재" 언급 | https://tech.kakaobank.com/posts/2311-hexagonal-architecture-in-messaging-hub/ |
| 6 | 카카오뱅크 / MSA로의 여정에서 만난 Spring Modulith 체리픽 해본 후기 | 2025-07-04 | 모놀리스에서 빌드·테스트 지연, 한 팀 장애가 타 팀 배포 지연, 중복 기능, 도메인 경계 기준 부재 | 패키지 단위 논리 모듈로 시작(물리 분리는 나중), Spring Modulith `verify()` 로 경계 검증, 공통은 `OPEN` 모듈, 커스텀 모듈 탐지 전략, ADR. 한계: 테스트 의존, 논리 분리라 경계가 약함 | https://tech.kakaobank.com/posts/2507-legacy-to-modular-monolith-with-spring-modulith/ |
| 7 | **카카오페이 / Hexagonal Architecture, 진짜 하실 건가요?** (철회 사례) | 2025-01-21 | 카카오톡·페이 앱 홈 통합용 마이크로서비스에 헥사고날+멀티모듈 도입. out Port 40개 이상이라 기능 추가마다 Domain -> Port -> Adapter 수정, 외부 응답 기준으로 Port가 만들어져 의존 역전, 보호할 순수 도메인이 모호, 부서 간 연동 표준이 이미 변화를 막고 있어 중복 방어, 온보딩 부담 | 헥사고날 제거, 멀티모듈을 단일 모듈로, 레이어 대신 **기능(관심사) 단위 패키징**(`cards`, `card/money` ...), 변환은 Service가 담당. PR 기준 8,000줄 이상 감소. 인용: "적어도 카카오페이 홈에 있어서는 은탄환이 아니었습니다." | https://tech.kakaopay.com/post/home-hexagonal-architecture/ |
| 8 | 지그재그(카카오스타일) / 코드 사례로 보는 Domain-Driven 헥사고날 아키텍처 | 2025-03-21 | 상품상세페이지가 약 20개 마이크로서비스 정보를 조합. 로컬 캐시 추가, Redis->Valkey 교체, RDB 직접 조회 전환 등 **인프라 변경이 잦음** | Controller -> Input Port -> Aggregate -> Output Port -> Adapter, 어댑터 우선순위(로컬 캐시 -> Redis -> API). 글에 패키지/모듈 구조 설명은 없음 | https://devblog.kakaostyle.com/ko/2025-03-21-1-domain-driven-hexagonal-architecture-by-example/ |
| 9 | flex / 모놀리식인데, 도메인 하나만 따로 띄웁니다 | 2026-08-31(Velopers 기준) | 모듈러 모놀리식에서 도메인 하나를 검증하려 해도 전체 앱을 띄워야 함 | 이슈 도메인만 조립한 standalone 실행 단위, 크로스 도메인 의존을 빌드 단계에서 제한, 시드 데이터·MySQL 컨테이너·Swagger. 원문 URL은 Velopers 요약 페이지 경유로만 확인 | https://flex.team/blog/2026/09/01/backend40 (경유: https://velopers.kr/post/8514) |

### 헥사고날 도입/철회 논쟁 요약 (위 사례의 교차 읽기)

- 도입 쪽(4, 5, 8): 외부 연동/인프라가 자주 바뀌고, 한 도메인을 여러 실행 단위로 쓰고, 팀이 규칙을 강제할 도구(ArchUnit, 멀티모듈)를 갖춘 경우.
- 철회 쪽(7): 보호할 도메인이 모호하고, 외부 표준이 이미 변화를 막고, Port가 수십 개로 늘어 기능 추가 비용이 커진 경우.
- 두 쪽 공통: 매핑 코드·인터페이스 증가(4, 7, 3의 "코드가 더 필요")를 비용으로 인정. 구조 규칙은 문서가 아니라 **테스트로 강제**(3의 ArchUnit, 6의 `verify()`, buckpal `DependencyRuleTests`).
- 온보딩에 주는 시사: 학습자에게 "헥사고날이 정답"이 아니라 **레이어드 -> 도메인 패키지 -> (필요 시) 포트 도입 -> 비용 측정 -> 유지/철회 판단**을 겪게 하는 편이 근거와 맞다.

---

## 3. Spring 공식 자격시험 범위

### 3.0 확인된 사실

- 공식 문서: **Spring Professional Develop Exam Guide** (Broadcom 호스팅) https://docs.broadcom.com/doc/vmw-spring-professional-develop-exam-guide (PDF를 내려받아 본문 추출 후 확인)
- 시험명/코드: Spring Professional Develop **(2V0-72.22)** -> 자격명 **Spring Certified Professional 2024**
- 문서 "Last Updated: 26/01/2024", REV. 1/24. 60문항, 합격 점수 300(scaled), 130분, Pearson VUE 감독 시험. MQC(최소 합격 수준) 경험 권장치는 6~12개월.
- 시험 출제 참고 버전(공식 문서 "References"): **Spring Framework 5.3, Spring Data 2021.0, Spring Boot 2.5**. 즉 이 시험은 Spring 6 / Boot 3 기준이 아니다.
- 최신 버전 확인: 2026-10-22 시점에 이 가이드보다 새로운 공식 시험/가이드는 검색으로 찾지 못했다(실제 부재를 의미하지 않음, "확인 불가" 절 참조).

### 3.1 목차 수준 체크리스트 (공식 Objective 번호 그대로)

**Section 1 - Spring Core**
- [ ] 1.1 Introduction to Spring Framework
- [ ] 1.2 Java Configuration: Java 코드로 빈 정의 / ApplicationContext에서 빈 접근 / 여러 Configuration 파일 처리 / 빈 간 의존성 / Bean Scope
- [ ] 1.3 Properties and Profiles: 외부 프로퍼티로 설정 제어 / Profile의 목적 / SpEL
- [ ] 1.4 Annotation-Based Configuration and Component Scanning: 어노테이션 기반 설정 / 설정 방식 선택의 모범 사례 / `@PostConstruct`, `@PreDestroy` / Stereotype 어노테이션
- [ ] 1.5 Spring Bean Lifecycle: 생명주기 / `BeanFactoryPostProcessor`, `BeanPostProcessor` / 프록시가 런타임에 동작을 추가하는 방식 / 빈 생성 순서 결정 / 타입으로 주입할 때의 문제 회피
- [ ] 1.6 AOP: 개념과 해결하는 문제 / Spring AOP Advice 구현·배포 / Pointcut 표현식 / Advice 종류와 사용 시점

**Section 2 - Data Management**
- [ ] 2.1 Spring JDBC: `JdbcTemplate` 사용·설정 / 콜백으로 ResultSet 처리 / 데이터 접근 예외 처리
- [ ] 2.2 Transaction Management: 트랜잭션 관리 설명·사용 / 전파(propagation) 설정 / 롤백 규칙 / 테스트에서의 트랜잭션
- [ ] 2.3 Spring Boot and Spring Data: Boot로 JPA 애플리케이션 구현 / Spring Data JPA Repository 작성

**Section 3 - Spring MVC**
- [ ] 3.1 Web Applications with Spring Boot: MVC 애플리케이션 생성 / REST 요청 처리 생명주기 / GET용 REST 컨트롤러 / 배포 설정
- [ ] 3.2 REST Applications: 각 HTTP 메서드용 컨트롤러 / `RestTemplate`로 REST 호출

**Section 4 - Testing**
- [ ] 4.1 Testing Spring Applications: JUnit 5 / Spring 통합 테스트 / Profile로 테스트 설정 / DB 포함 테스트 확장
- [ ] 4.2 Advanced Testing with Spring Boot and MockMVC: Boot 테스트 활성화 / 통합 테스트 / MockMVC / 슬라이스 테스트

**Section 5 - Security**
- [ ] 5.1 기본 보안 개념 / 5.2 Spring Security 인증·인가 설정 / 5.3 메서드 레벨 보안

**Section 6 - Spring Boot**
- [ ] 6.1 Boot 기능 소개 + 의존성 관리(dependency management)
- [ ] 6.2 Properties와 Auto-configuration: 프로퍼티 정의·로딩 옵션 / 자동설정 활용 / 기본 설정 재정의
- [ ] 6.3 Actuator: 엔드포인트 설정 / HTTP 엔드포인트 보안 / 커스텀 메트릭 / 커스텀 헬스 인디케이터

### 3.2 온보딩 커리큘럼과의 대응 (제안, 근거는 위 목차)

| 시험 영역 | 게시판/커뮤니티 서버 안에서 만나는 지점 |
|-----------|-----------------------------------------|
| 1.2~1.5 컨테이너·생명주기 | 설정 클래스 분리, 서비스 분리 후 빈 순환 참조/타입 주입 충돌 |
| 2.2 트랜잭션 | 게시글 작성 + 알림/카운트 갱신 시 전파·롤백 규칙, `@TransactionalEventListener` 경계 (1.1의 hang-log listener 참조) |
| 2.3 Spring Data | Repository 설계, 커스텀 쿼리 분리 |
| 3.x MVC/REST | 게시글/댓글 API |
| 4.x 테스트 | 도메인 단위 -> 슬라이스 -> 인수 테스트 (dallog 구조) |
| 6.3 Actuator | 운영 지표/헬스 체크 |

범위 밖: 이 시험은 JdbcTemplate/RestTemplate 중심(Boot 2.5 시대)이라 Entity 설계·패키지 구조·서비스 분리는 **전혀 다루지 않는다**. 이 온보딩의 핵심 목표(구조 설계 감각)는 자격시험 대비만으로 채워지지 않는다.

---

## 4. Entity 설계 실무 관례 종합표 (관찰 근거 포함)

관찰 수치는 §1에서 clone한 레포 기준이며, 괄호 안은 `main` 소스의 엔티티/MappedSuperclass 파일 수 대비다. "어기면 생기는 일"에서 **[일반론]** 표시는 레포에서 직접 관측한 것이 아니라 JPA/Hibernate의 알려진 동작에 근거한 설명이다(레포에서 재현해 보지 않음).

| 관례 | 이유 | 어기면 생기는 일 | 관찰된 레포/글 |
|------|------|------------------|----------------|
| 기본 생성자는 `protected` (`@NoArgsConstructor(access = PROTECTED)` 또는 수동 `protected X(){}`) | JPA 스펙이 인자 없는 생성자를 요구, 프록시용. 외부에서 빈 객체를 못 만들게 | public이면 필수 값이 빠진 채 생성되어 불변식 우회 [일반론] | hang-log(15/16), dallog(수동 protected), cheese10yun, dddsample(`protected Cargo()`). 반례: zzimkkong 5개가 public `@NoArgsConstructor` |
| `@Setter`, `@Data` 금지, 의도가 드러나는 메서드(`change(...)`, `update(...)`, 정적 팩토리 `of`) | 변경 경로를 한곳에 모아 검증·도메인 규칙을 강제 | 어디서든 필드를 바꿀 수 있어 규칙 누락, 변경 추적 불가 [일반론] | hang-log·dallog·zzimkkong·cheese10yun: 0건 / **eladmin: 22/22 `@Setter`** (반면교사), petclinic은 수동 setter |
| 생성 시점 검증(생성자/팩토리 안 `validate*`) | 잘못된 상태의 엔티티가 영속 계층에 도달하지 않게 | 검증이 서비스마다 흩어져 일부 경로에서 누락 [일반론] | dallog `Schedule`(제목 길이, 기간 검증), cheese10yun `Email`/`Password` VO |
| `@Builder`는 클래스가 아닌 **생성자(또는 정적 팩토리)에** 붙인다 | 필수 인자만 빌더로 노출, 필드 추가 때 의도치 않은 파라미터 확장 방지 | 클래스 레벨 `@Builder`는 모든 필드가 빌더에 열려 id까지 설정 가능 [일반론] | cheese10yun(`@Builder public Account(...)`). 반례: zzimkkong 클래스 레벨 `@Builder` 5개. hang-log는 `@Builder` 자체를 안 씀(0건, 정적 팩토리 사용) |
| `@AllArgsConstructor` 주의(엔티티에는 가급적 피함) | id·연관관계까지 인자가 되어 필드 순서 변경이 컴파일 에러 없이 의미를 바꿈 | 같은 타입 인자 순서 뒤바뀜 [일반론] | hang-log 일부(Likes, City, Currency 등 7개)는 사용 중 -> 관례 위반 관찰 사례. buckpal은 도메인 모델에 `PRIVATE` 접근 제한으로 사용 |
| `BaseEntity`(`@MappedSuperclass` + Auditing)로 생성/수정 시각 공통화 | 모든 엔티티에 감사 컬럼 일괄 적용 | 엔티티마다 복붙, 누락 [일반론] | hang-log(`createdAt`, `modifiedAt`, `status`), dallog, eladmin. 예외: petclinic `BaseEntity`는 id만 |
| 연관관계 `@ManyToOne(fetch = LAZY)` 명시 | `@ManyToOne` 기본값이 EAGER이므로 의도해서 지연 로딩 | 조회 시 불필요한 조인/쿼리 폭증(N+1 등) [일반론] | hang-log, dallog, zzimkkong 모두 LAZY. EAGER 관찰: eladmin(`User`,`Role`), cheese10yun `Delivery`, petclinic |
| `@Enumerated(EnumType.STRING)` | 문자열로 저장해 enum 순서 변경에 안전 | ORDINAL이면 enum 순서 바꿀 때 기존 데이터 의미가 조용히 바뀜 [일반론] | 6개 레포 `main`에서 ORDINAL 사용 0건, hang-log `@Enumerated(value = STRING)` |
| `cascade`/`orphanRemoval`은 부모-자식(애그리거트 내부)에만 | 수명 주기가 부모에 종속된 관계에만 전파 | 독립 엔티티에 cascade REMOVE가 걸려 연쇄 삭제 사고 [일반론] | hang-log `Trip -> DayLog, SharedTrip`(PERSIST/REMOVE/MERGE + orphanRemoval), 연관 cascade를 쓰는 엔티티는 16개 중 3개뿐 |
| 소프트 삭제는 `status` + `@SQLDelete` + 필터 | 삭제 이력 유지, 조회 시 자동 제외 | 조회 쿼리마다 삭제 조건을 빠뜨림 [일반론] | hang-log 엔티티 다수(`@SQLDelete` + `@Where(clause = "status = 'USABLE'")`). Hibernate 6.3+에서 `@Where`가 deprecated이고 `@SQLRestriction` 대체라는 점은 일반 지식이며 이 레포(Boot 3.1.1)에서 확인한 것은 아님 |
| 값 객체는 `@Embedded` | 이메일/주소/금액 같은 개념에 검증과 동작을 모음 | 원시 타입 필드에 규칙이 흩어짐 [일반론] | cheese10yun(`Email`, `Password`, `Address`), zzimkkong `Settings`, hang-log `Amount` |
| 양방향 연관관계는 편의 메서드로 양쪽 동기화 | 메모리상 객체 그래프 일관성 | 한쪽만 설정해 저장/조회 결과 불일치 [일반론] | zzimkkong `Space.addSpace`/`updateSpace` 호출 패턴 |
| 낙관적 락 `@Version`은 동시 수정 대상에만 | 갱신 손실 방지 | 없으면 동시 수정 시 마지막 쓰기가 이김 [일반론] | dallog `CategoryRole`만 사용(8개 중 1개), 나머지 레포는 0건 |
| `equals/hashCode`는 신중히(id 기반 또는 비즈니스 키) | 컬렉션/영속성 컨텍스트에서 동등성 일관 | 프록시·미영속 상태에서 비교 불일치 [일반론] | realworld `@EqualsAndHashCode(of = {"id"})`, hang-log은 16개 중 4개(Amount, Expense, Category, Place)만 구현. **적정성 판단은 이 조사로는 불가** |
| 서비스 경계를 나눌 때 엔티티 간 객체 참조 -> id 참조 | 모듈/서비스 간 결합 제거, QueryDSL join 제거 | 한 도메인 수정이 다른 도메인 쿼리·테스트를 깨뜨림 | 우아한형제들 WMS 글(연관관계 제거 + 서비스에서 조합), petclinic-microservices `Visit.petId` |
| 도메인 모델과 영속 모델을 분리할지는 비용을 보고 결정 | 프레임워크 독립성 vs 변환·더티체킹 비용 | 분리하면 매퍼/중복 객체 증가, 합치면 JPA가 도메인에 침투 | buckpal(분리, `AccountMapper`), 우아한형제들 헥사고날 글(수동 변환 반복을 비용으로 명시), 나머지 JPA 레포는 합침 |

### 이 표에서 도출한 학습 과제 (온보딩 설계용 제안)

1. 엔티티 3개 단계: ① 안티 버전(`@Data` 엔티티)을 의도적으로 만들게 하고 ② hang-log식 `Trip`과 비교 리팩토링.
2. ORDINAL로 저장 -> enum 순서 변경 -> 데이터 오염을 **직접 재현**하는 실습(§4 "일반론" 항목을 실측으로 바꾸는 과제).
3. 서비스 300줄 돌파 시점에 zzimkkong/hang-log의 비대 서비스를 읽고 분리 -> 이벤트 도입 -> 비용 기록.
4. 패키지 구조를 계층형 -> 도메인형으로 바꾸는 PR 하나를 반드시 경험(zzimkkong vs hang-log 비교 근거).
5. ArchUnit 의존 규칙 테스트 1개 작성(buckpal, 우아한 WMS 글, 카카오뱅크 `verify()` 가 공통으로 쓰는 방식).

---

## 확인 불가

- **토스, 당근, 컬리, 무신사, LINE** 의 "서비스 클래스 분리/도메인 패키지 전환/헥사고날" 기술블로그 원문은 검색으로 찾지 못했다. 위 사례는 우아한형제들, 카카오뱅크, 카카오페이, 지그재그(카카오스타일), flex만 원문을 열어 확인했다. 당근은 Velopers 요약에서 "커뮤니티 시스템, 모듈과 이벤트 분리" 태그만 보았고 원문은 열지 못해 제외했다.
- **헥사고날 "철회" 사례는 카카오페이 1건만** 확인했다. 다른 기업의 명시적 철회 사례는 찾지 못했다.
- flex 글(§2-9)의 게시일은 Velopers 표기 기준이며 원문 페이지(flex.team)를 직접 열지는 않았다.
- **Spring 자격시험의 더 최신 버전**(Spring 6 / Boot 3 기준 개정판)이 있는지는 확인하지 못했다. 공식 가이드는 2024-01 개정판(2V0-72.22)이 마지막으로 확인된 것이며, 2026년 표기를 붙인 연습 시험 판매 페이지도 같은 시험 코드를 쓴다. Broadcom 자격 페이지에서 현재 상태를 직접 확인해야 한다. 응시 비용, 문항 수 외 운영 정보는 서드파티 간 수치가 엇갈려 기재하지 않았다.
- 한국 팀 프로젝트 레포(hang-log, dallog, zzimkkong)의 **실제 운영 규모/트래픽**은 확인하지 못했다.
- Entity 관례표의 **[일반론]** 항목(어기면 생기는 일)은 이 조사에서 해당 레포로 재현한 것이 아니다. 온보딩 실습에서 실측으로 바꿀 후보다.
- hang-log/dallog/zzimkkong은 학습 목적 팀 프로젝트라 "3~6년차 실무 수준 코드"의 기준으로 쓰기에는 한계가 있을 수 있다. 숙련자 리뷰로 보정이 필요하다.
- clone은 `--depth 1`이라 커밋 이력(구조가 언제 어떻게 바뀌었는지)은 분석하지 않았다. "구조 변경 경험"의 직접 근거는 §2의 글에서만 얻었다.
- `mall`(MyBatis 모듈 구조), `dddsample-core`, `spring-petclinic`(단일)은 구조 확인만 했고 상세 분석 및 읽을 파일 추천은 하지 않았다.
