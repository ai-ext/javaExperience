# PR9 계약·검사 읽기 전용 검토

- 확인일: 2026-10-22
- 검토 커밋: c9786af3b97c48ec118cade5777bc015fe282a88
- 비교 기준: 1f443faae406324f8c5a3c87b2741ad0b74913a6
- 코드 경로: $WORKTREE_ROOT/pr9-holistic-review-20261022
- 범위: board-server 인증·회원·공통·설정·게시글·댓글, 테스트 구성·assertion·동시성·상태 복구, D01~D08 계약. 기존 루트 src 학습 코드 제외.
- 방법/한계: 고정 커밋 git show로 정적 검토. 이 담당자는 서버/DB/테스트 실행을 하지 않았다. 아래 실행 후보는 메인 검토자의 재현 결과로 최종 확정해야 한다.

## 새 결함 후보: 메인 실행 검증 필요

### P1: 게시글 수정이 동시 좋아요 또는 소프트 삭제를 덮어쓸 수 있음

- 근거: board-server/src/main/java/com/example/board/post/PostServiceImpl.java:59-74,79-90. update/patch/delete는 findActiveDetail로 비잠금 조회한 Post를 변경하고 flush한다. PostRepository.java:13-20 조회에는 잠금이 없고 Post.java:29-58에는 @Version 또는 @DynamicUpdate가 없다. 반면 likeCount는 PostRepository.java:24-31 벌크 UPDATE로 변경한다.
- 트리거: 트랜잭션 A에서 ACTIVE, likeCount=0인 Post를 읽고 일시 중단한다. B에서 좋아요를 성공시키거나 DELETE를 커밋한다. A에서 title을 바꾼 뒤 flush한다.
- 영향: Hibernate 기본 전체 컬럼 UPDATE가 이전 likeCount 또는 status를 기록하면 좋아요 행 수와 카운트가 달라지거나 삭제된 글이 다시 공개된다. 단순 마지막 수정 우선 정책을 넘어 서로 다른 기능의 데이터가 소실되는 문제다.
- 기존 검사: PostCrudApiTest.java:65-170은 순차 CRUD만 확인. PostLikeApiTest.java:95-147은 수정·삭제 트랜잭션을 섞지 않는다.
- 판정: 소스상 보호 부재 확인. 메인에서 실제 Hibernate UPDATE/최종 DB 상태 확인 필요. 이미 알려진 5개 deferred와 별개.

### P2: 대소문자만 다른 태그가 단일 요청에서 중복 연결되어 500 가능

- 근거: PostServiceImpl.java:41-43과97-98은 문자열 LinkedHashSet으로만 중복 제거한다. TestcontainersConfig.java:16-17의 MySQL collation은 utf8mb4_0900_ai_ci이며 schema.sql:49-56의 tag.name UNIQUE는 해당 문자셋 기본 collation을 사용한다. post_tag에는 schema.sql:67 UNIQUE(post_id,tag_id)가 있다.
- 트리거: 정상 인증 회원이 title/content와 tags=["java","JAVA"]로 POST /api/posts. 또는 기존 글을 동일 태그 배열로 PUT/PATCH.
- 영향: 문자열 두 개가 DB 조회에서 같은 Tag id로 해석되고 Post.addTag가 두 번 호출되어 post_tag UNIQUE 충돌. Post.java:90-95의 replaceTags 역시 원본 tags 스트림에서 같은 엔티티를 두 번 추가할 수 있다. 정상 길이·형식의 요청 전체가 롤백되어 500이다.
- 기존 검사: PostCreateApiTest.java:108-116은 완전히 같은 문자열 두 개만 검사한다.
- 판정: ai_ci 설정 및 중복 경로 확인. 메인 실제 HTTP/DB 결과 필요. 알려진 '같은 새 태그 동시 생성'과 달리 한 요청만으로 발생하는 독립 문제.

### P2: 유효한 8~64자 비밀번호와 BCrypt 바이트 제한 불일치

- 근거: SignupRequest.java:10-11은 8~64자와 영문/숫자 포함만 검증해 한글 등도 허용한다. AuthService.java:51은 별도 바이트 검사 없이 BCryptPasswordEncoder(SecurityConfig.java:18-20)에 전달한다. GlobalExceptionHandler.java:53-58은 처리되지 않은 IllegalArgumentException을 500으로 반환한다.
- 트리거 후보: password = "a1" + "가" 24개 (26자, UTF-8 74바이트), 유일한 email/nickname으로 회원 가입.
- 영향: 현재 BCrypt 구현이 72바이트 초과를 거절하면 명세상 유효 입력이 서버 오류가 된다. AuthApiTest.java의 비밀번호 사례는 ASCII·최소길이만 있다.
- 판정: DTO/encoder 불일치 확인. 실제 의존 버전의 BCrypt encode 동작과 HTTP 결과는 메인 검증 필요.

## 정적으로 확정한 검사 결함

### P2: 좋아요/취소 혼합 동시성 테스트가 DELETE만 실행함

- 위치: board-server/src/test/java/com/example/board/post/PostLikeApiTest.java:137-141.
- 메서드 이름은 '동시에_좋아요와_취소가_섞여도_like_count는_행_수와_같다'이나 동시에 제출하는 두 Task 모두 DELETE다. PUT은 129-135행에서 모든 동시 작업 전에 순차 실행한다.
- 영향: PUT과 DELETE의 잠금 순서 불일치/교착/갱신 누락이 있어도 이 테스트는 해당 경로를 교차 실행하지 않아 검증하지 못한다. 두 번째 작업을 PUT으로 바꾸고 모든 요청 완료 후 실제 행 수와 like_count를 대조하는 별도 혼합 검증이 필요하다.
- 이는 테스트의 실행 내용에 관한 확정 사실이며 제품 경로가 실제 실패한다는 주장과 구분한다.

## 검사 강도 및 완료 범위

- 소스 @Test 개수는 정확히 252개다. 이 자체를 이번 실행 통과 증거로 쓰지 않는다.
- PointConcurrencyTest:41-47은 50개의 실제 service 호출과 최종 잔액·원장 행 수·합계를 대조한다. :72-87은 동시에 20건 차감해 정확히 10건 성공과 잔액 0·원장합 일치를 검사한다.
- CouponIssueApiTest:111-140은 같은 회원 10요청과 다른 회원20/수량10 요청에서 실제 HTTP 상태 개수와 DB 발급·소유 행 수를 함께 검사한다.
- OrderIdempotencyConcurrencyTest:58-76은 같은 키 동시 주문 응답/주문 수/잔액/SPEND 원장 수/재고를 확인한다. :97-108은 같은 키 다른 본문의 201/422를 확인한다.
- 위 동시성 헬퍼는 latch 이후 실제 호출하고 Future.get 결과/예외를 수집한다. 다만 시작 준비 완료용 barrier는 없어 특정 interleaving을 반드시 만들지는 않는다.
- MyBatis PostQueryMapperTest:52-68은 Hibernate 통계가 아니라 MySQL Com_select 전후 차이를 사용한다. 따라서 MyBatis 쿼리를 Hibernate 통계로 0건으로 오판하는 테스트가 아니다.
- PostListExplainTest:74-84는 DROP INDEX 이후 finally에서 인덱스를 복원한다. PgApiTestSupport:23-25의 @AfterEach는 실패 후에도 PgContainers.reset을 실행하고 proxy 재생성/임시 스텁 제거를 한다.
- ChargeTransactionBoundaryTest:26-52는 실제 PG 지연 구간의 Hikari active를 검사한다. 다만 요청 수 대기 deadline 후 해당 구간 진입을 별도 assert하지 않아 머신 정지 등 특수 스케줄에서는 지연 이후 측정 가능성이 남는다(검사 보완사항, 제품 결함으로 집계하지 않음).
- 커밋 트리에 .github/workflows, Jenkinsfile, .gitlab-ci.yml 등 CI 정의가 발견되지 않았다. CI 실행/강제 여부는 원격 상태에서 메인이 별도 확인해야 한다. 기존 루트 Gradle 실행이 독립 board-server 테스트 실행을 의미하지 않는다.
- D09 Redis/로그인 시도 제한, D10 관리자 구현은 README에 미완료로 명시되어 있어 이번 D01~D08 결함으로 집계하지 않았다.

## 알려진 유예/오탐에서 제외

- docs/course-redesign/README.md의 5개 deferred: 환경변수 문구, 할인율/재고오류 명세, PostLikeService 전체 DataIntegrityViolationException 삼킴, prod 설정 주석, 동시 새 태그 UNIQUE 충돌. 신규 발견으로 중복 집계하지 않음.
- P2 ledger는 댓글 +2 포인트를 D09-5에서 랭킹과 함께 구현하도록 명시했으므로 현재 CommentService 미적립은 D07 누락으로 신고하지 않음.
- GlobalExceptionHandler는 ResponseEntityExceptionHandler를 상속하고 :93-100에서 부모가 만든 ProblemDetail을 보정한다. 개별 MVC 예외 핸들러가 없다는 이유만으로 500/본문 누락을 주장하지 않음.
- 스키마는 D01~D08의 UNIQUE/FK/수량 CHECK를 실제 SQL에 둔다. banned_word/common_code에 감사 필드가 없는 점은 spec-v2 §6 '모든 테이블' 문구와 달라 보이나 본 기능 영향이 작은 문서 정합성 항목으로만 남김.
