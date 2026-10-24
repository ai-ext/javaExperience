# 45개 항목 전체 검증 목록

확인일: 2026-10-21 KST. 우선순위는 교육 보완 순서이며 제품 장애 심각도나 학습자 점수가 아니다.

- P0: Controller 이후 업무 구현을 독립 수행하기 위해 먼저 연결할 내용.
- P1: 정확성·재현 가능성 또는 실제 코드와의 연결을 우선 보완할 내용.
- P2: 기본 설명은 있으나 예외·판단·전이 평가를 보완할 내용.
- P3: 기존 내용과 관찰 근거가 비교적 충분해 재사용할 내용.

개념27 + 구현18 = 45개. 우선순위 분포: {'P2': 15, 'P3': 5, 'P1': 15, 'P0': 10}. 공식 근거35개.

| ID | 검증 주제 | 판정 | 우선순위 | 개별 파일 |
|---|---|---|---|---|
| C01 | IoC — 객체 조립과 컨테이너의 역할 | 설명 충분·입문 문장 과잉 일반화 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C01-ioc.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C01-ioc.md) |
| C02 | DI — 후보 선택과 실패 진단 | 기초 충분·학습자 코드 진단 연결 약함 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C02-di.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C02-di.md) |
| C03 | Bean 생명주기 — 초기화·종료와 프록시 준비 | 설명 충분·실행 과제 약함 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C03-bean-lifecycle.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C03-bean-lifecycle.md) |
| C04 | Bean scope — singleton·prototype·request | 핵심 설명 있음·범위 실험 분산 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C04-bean-scopes.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C04-bean-scopes.md) |
| C05 | Singleton thread safety — final과 요청 상태 | 핵심·재현 모두 있음 | P3 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C05-singleton-thread-safety.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C05-singleton-thread-safety.md) |
| C06 | AOP self-invocation — 호출 경로가 계약 | 실행·실패 비교 충분 | P3 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C06-aop-self-invocation.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C06-aop-self-invocation.md) |
| C07 | Entity·값 객체·DTO — 식별성과 불변식 | 정의 있음·한 모델 연결 약함 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C07-entity-value-object-dto.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C07-entity-value-object-dto.md) |
| C08 | DTO·엔티티 접근성 — P20 복사 실행의 차단점 | 원문 결함·최신 화면에 교정 안내 존재 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C08-dto-copy-compile.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C08-dto-copy-compile.md) |
| C09 | EntityManager — 주입 프록시·실제 컨텍스트·스레드 | 실무 연결 핵심 공백 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C09-entity-manager-proxy.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C09-entity-manager-proxy.md) |
| C10 | 영속 상태·merge·remove — 상태와 행을 구분 | 추가 실행으로 강하게 보강됨 | P3 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C10-entity-states.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C10-entity-states.md) |
| C11 | dirty checking·flush·commit — 같은 값의 시점 | 보강 충분·입문 문장 조건 연결 필요 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C11-dirtychecking-flush-commit.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C11-dirtychecking-flush-commit.md) |
| C12 | 트랜잭션 경계 — Repository·Service·Controller | 원자성 비교·실제 관측 있음 | P3 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C12-transaction-boundaries.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C12-transaction-boundaries.md) |
| C13 | rollback 규칙·catch·rollback-only | 기본 실험 충분·정책 판단 평가 추가 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C13-rollback-rules.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C13-rollback-rules.md) |
| C14 | readOnly·Transactional import — 힌트와 실제 동작 | 자료 존재·현재 코드 선택 연결 약함 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C14-readonly-annotation.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C14-readonly-annotation.md) |
| C15 | Propagation — 물리 연결·NESTED·풀 비용 | 전파 실험 충분·자원 운영 과제 부족 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C15-propagation.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C15-propagation.md) |
| C16 | Isolation — 1차 캐시와 DB 스냅샷을 혼동하지 않기 | DB 자료 있음·JPA 통합 판별 과제 약함 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C16-isolation-context.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C16-isolation-context.md) |
| C17 | 연관관계 주인 — mappedBy와 FK | 실제 실패·전후값 보강 충분 | P3 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C17-association-owner.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C17-association-owner.md) |
| C18 | Cascade·orphanRemoval — 삭제 책임과 범위 | 핵심 실행 있음·상태별 경계는 설명 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C18-cascade-orphan.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C18-cascade-orphan.md) |
| C19 | Fetch·N+1·컬렉션 페이징 — 정확성과 쿼리 수 | 관측 풍부·안전한 대안 완주 필요 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C19-fetch-pagination.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C19-fetch-pagination.md) |
| C20 | Repository.save·쿼리 — 상태판단과 SQL 계약 | 설명 풍부·save 일반화 경계 필요 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C20-repository-save-query.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C20-repository-save-query.md) |
| C21 | 단위 테스트·mock — 검증 경계와 실습 경로 | 교육 내용 있음·복제본 실행 진입점 차단 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C21-unit-mock-tests.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C21-unit-mock-tests.md) |
| C22 | 테스트 트랜잭션 함정 — flush·LAZY·commit·HTTP | 최신 실험 충분·원문과 보강 정합성 문제 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C22-transactional-test-illusion.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C22-transactional-test-illusion.md) |
| C23 | 실제 DB 테스트·Testcontainers — 원문/실행환경 정합성 | 지원자료 있음·원문 낡은 일반화·런타임 미완결 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C23-realdb-testcontainers.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C23-realdb-testcontainers.md) |
| C24 | Entity equals/hashCode·값 동등성·record 얕은 불변 | 경고 있음·엔티티 계약 검증 약함 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C24-entity-equality.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C24-entity-equality.md) |
| C25 | nullable wrapper·Optional·예외 — 저장 성공 뒤 조회 실패 | main NPE 실측·새 common primitive 변경으로 해소; 경계학습 연결 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C25-java-null-boundaries.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C25-java-null-boundaries.md) |
| C26 | Generic·interface·다형성 — Repository 계약 읽기 | 개념 충분·현재 타입에 대입하는 평가 약함 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C26-java-generics-polymorphism.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C26-java-generics-polymorphism.md) |
| C27 | 시간·Clock·BigDecimal — 값 의미와 저장 정밀도 | 설명·예제 충분·한 계약으로 엮는 실습 필요 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C27-java-time-money.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/concepts/C27-java-time-money.md) |
| I01 | Controller 다음의 Service 설계: 요청을 업무 결정 순서로 바꾸기 | 내용 있음 · 설계 전이 연습 부족 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I01-Controller-다음의-Service-설계.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I01-Controller-다음의-Service-설계.md) |
| I02 | 한 요청의 트랜잭션 경계와 실패 뒤 상태 | 설명·실험 있음 · 게시판 실패 설계 전이 부족 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I02-한-요청의-트랜잭션-경계와-실패-뒤-상태.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I02-한-요청의-트랜잭션-경계와-실패-뒤-상태.md) |
| I03 | 게시글 생성: 문자열 입력을 기존 엔티티와 새 엔티티로 해석 | 완성 경로 있음 · 최소 관계형 생성 발판 부족 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I03-게시글-생성.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I03-게시글-생성.md) |
| I04 | 상세 조회: Optional, 가시성, DTO, 조회수 쓰기 | 계약·화면 있음 · 자기 코드로 옮기는 연결 필요 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I04-상세-조회.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I04-상세-조회.md) |
| I05 | 목록: 조건·정렬·페이지·DTO와 N+1 | 풍부한 내용 있음 · 쿼리 설계 독립 수행 확인 부족 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I05-목록.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I05-목록.md) |
| I06 | PATCH와 PUT: 변경 의도와 관리 객체 변경 | 계약·rollback 분기 있음 · 검증 책임 표현 정정 필요 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I06-PATCH와-PUT.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I06-PATCH와-PUT.md) |
| I07 | Soft delete와 관계 데이터 수명 | 계약·전후 화면 있음 · 관계별 삭제 설계 전이 부족 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I07-Soft-delete와-관계-데이터-수명.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I07-Soft-delete와-관계-데이터-수명.md) |
| I08 | 좋아요 모델: Boolean에서 회원-글 관계와 멱등으로 | 내용 있음 · 학습자 모델에서 넘어가는 핵심 발판 부족 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I08-좋아요-모델.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I08-좋아요-모델.md) |
| I09 | 좋아요 동시성: UNIQUE, 조건부 증감, 실제 삭제 행수, 재시도 | 설명 정확성·기존 회귀테스트 공백 · 이번 동시 DELETE 실험은 통과 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I09-좋아요-동시성.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I09-좋아요-동시성.md) |
| I10 | 댓글 작성으로 1:N 연관관계 직접 구현 | 매핑·정답 있음 · FK에서 객체 코드 도출 연습 부족 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I10-댓글-작성으로-1.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I10-댓글-작성으로-1.md) |
| I11 | 답글 2단계와 평평한 행에서 트리 응답 조립 | 검증·조립 정답 있음 · 자료구조 전이 연습 부족 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I11-답글-2단계와-평평한-행에서-트리-응답-조립.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I11-답글-2단계와-평평한-행에서-트리-응답-조립.md) |
| I12 | 태그 N:M: 중복 제거와 공유 엔티티의 생명주기 | 매핑·연결교체 자료 있음 · 최신 학습자 seed/매핑 충돌 재현 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I12-태그-N.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I12-태그-N.md) |
| I13 | 인증과 업무 권한: 같은 회원도 기능마다 다른 결정 | 정책·행렬 있음 · 정책 직접 작성과 계약 대조 부족 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I13-인증과-업무-권한.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I13-인증과-업무-권한.md) |
| I14 | 입력·업무·DB 오류를 HTTP 계약으로 번역 | 검증 자료 있음 · 실제 학습자 오류 처리에서 전이 필요 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I14-입력·업무·DB-오류를-HTTP-계약으로-번역.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I14-입력·업무·DB-오류를-HTTP-계약으로-번역.md) |
| I15 | 테스트 작성: HTTP 성공에서 업무 불변식 증명으로 | 정답테스트·개념실험 있음 · 학습자 기능테스트는 아직 없음 | P0 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I15-테스트-작성.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I15-테스트-작성.md) |
| I16 | 스키마 제약과 마이그레이션: 업무규칙의 최종 경계 | DDL·Flyway 심화 있음 · 첫 관계설계와 연결 부족 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I16-스키마-제약과-마이그레이션.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I16-스키마-제약과-마이그레이션.md) |
| I17 | 이벤트·비동기·outbox: 지금의 업무경계에서 나중으로 연결 | 심화 내용 있음 · 기본학습 선행조건으로 확대하지 않음 | P2 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I17-이벤트·비동기·outbox.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I17-이벤트·비동기·outbox.md) |
| I18 | 관계 업무 확장: 북마크 폴더 한도·이동·소유권 | 실제 구현 있음 · 좋아요/댓글에서 규칙 확장 연습 부족 | P1 | [/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I18-관계-업무-확장.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/I18-관계-업무-확장.md) |

## 명시 요청과 검증 항목의 대응

| 사용자 요청 | 항목 |
|---|---|
| IoC·DI·Bean | C01~C05 |
| Entity·EntityManager | C07~C11, C24 |
| 트랜잭션·readOnly·rollback | C06, C12~C16, C22, I02 |
| Controller/DTO 다음 Service 구현 | I01~I07, I13~I15 |
| 테이블 1:N과 실제 관계 개발 | C17/C18, I10/I11/I12/I16 |
| 좋아요 | I08/I09, 이번 동시 PUT·DELETE 및 외부tx 검증 |
| 연차 표현에 대응하는 실무 깊이 | C19~C27, I13~I18: 쿼리·동시성·테스트·값/타입·권한·스키마·새 요구로 전이 |
| 하나하나 파일로 기록 | 위 45개 개별 Markdown + runtime3개 + 공식근거/종합/보완순서 |

공백 분석과 검증은 완료했지만, 제안 과제의 실제 콘텐츠 구현이나 사용자의 숙련도 확인을 완료했다는 뜻은 아니다.
