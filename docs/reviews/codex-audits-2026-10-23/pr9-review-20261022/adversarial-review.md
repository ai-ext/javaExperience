# PR #9 adversarial · 트랜잭션 정적 검토

확인 날짜: 2026-10-22. native pass receipt: `4e2ad80a-76fd-46e5-b80e-14618bb839f1`.

- 고정 HEAD: `c9786af3b97c48ec118cade5777bc015fe282a88`
- 비교 base: `1f443faae406324f8c5a3c87b2741ad0b74913a6`
- 현재 증거 checkout: /Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022
- 최초 읽은 임시 checkout이 제거되어 잠시 `git show c9786af3:<path>`로 고정 객체를 읽었으며, 이후 위 checkout의 HEAD 일치를 확인했다. 소스 수정·커밋·원격 댓글은 하지 않았다.
- `git diff --name-status` 전체 217개를 먼저 확인했다. GitHub 파일 응답의 100개 절단에 의존하지 않았다. `board-server/src/main/java` 변경 103개 전부, main 설정·schema·mapper, build.gradle 및 명세 관련 부분을 직접 읽었다.
- 테스트 59개 Java 파일과 WireMock/도구 fixture는 파일 목록과 문서의 목적·결과 요약만 사용했다. 테스트 원문·공격 fixture의 raw payload를 읽거나 신규 공격 payload를 작성하지 않았다. 따라서 실제 테스트 assertion의 충분성은 이 pass가 입증하지 않으며, 테스트 심층 검토는 별도 담당 범위다.
- DB·서버·원본 테스트는 이 담당자가 실행하지 않았다. 아래는 코드 경로와 입력·실행 순서를 대조한 정적 결과다. 문서의 252개 통과 기록을 현재 재실행 결과 또는 결함 부재의 증거로 쓰지 않았다.

## 결론

D08의 결제 상태 결정에서 **결과 불명 결제를 복구 불가능한 FAILED로 확정할 수 있는 P1**을 발견했다. 먼저 재현·수정하고 병합하는 것이 적절하다. PG 응답 금액 검증 누락은 별도 P2다. 게시글 dirty checking의 stale write는 다른 담당자에게 전달했으며 실제 SQL·교차 요청 검증이 남은 P2 후보로 분리했다.

## A1 — P1 / FIXABLE / 신뢰도 높음(0.98)

### 재시도의 마지막 연결 실패가 앞선 PG 처리 가능성을 지워 실제 승인 건을 FAILED로 고정한다

핵심 위치: [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgRetryPolicy.java:35](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgRetryPolicy.java:35), [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:158](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:158).

**전체 경로:** 인증된 `POST /api/me/points/charges` → `ChargeController.charge`의 헤더/금액 검증 → `ChargeService.charge` → `start`가 REQUESTED를 별도 트랜잭션으로 커밋 → `PgClient.approve` → `PgRetryPolicy.execute` → 마지막 `PgException`만 throw → `ChargeService.fail` → `markFailed` → 이후 callback/reconcile에서 복구 불가.

**구체적인 정상 요청·장애 순서:**

1. 회원이 유효한 키로 1,000포인트 충전을 요청한다.
2. 첫 PG 시도는 승인까지 처리되었지만 HTTP 5xx를 돌려준다. 구현 자체가 SERVER_ERROR를 UNKNOWN으로 분류하므로 이 상태의 처리 여부가 불명이라는 가정은 코드와 일치한다.
3. 정책대로 동일 키로 다시 시도하지만 2·3번째는 연결 실패다. 또는 첫 5xx 뒤 두 번째 시도에서 HTTP 풀 대기 실패가 난다.
4. retry 정책은 과거 SERVER_ERROR 이력을 보존하지 않고 최종 UNREACHABLE/POOL_TIMEOUT만 반환한다. `fail`은 이를 “PG에 닿지 않음”으로 해석해 FAILED로 저장한다.
5. 원래 첫 승인에 대한 올바른 서명의 DONE 콜백이 뒤늦게 도착해도 `markDone` 조건은 REQUESTED/UNKNOWN만 허용하므로 영향 행 0, 포인트 미적립이다. 콜백 컨트롤러는 200을 반환한다.
6. `reconcile` 역시 FAILED를 최종 상태로 보아 외부 조회 전에 반환한다. 같은 키 재요청은 `replay`에서 승인 거절로 끝난다.

**근거:** retry의 마지막 예외 전달은 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgRetryPolicy.java:30](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgRetryPolicy.java:30), HTTP 5xx·연결 실패 분류는 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgClient.java:62](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgClient.java:62), SERVER_ERROR와 UNREACHABLE의 서로 다른 상태 저장은 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:146](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:146), 콜백 진입은 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:82](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:82), DONE 전이 조건은 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgPaymentRepository.java:21](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/PgPaymentRepository.java:21), 적립 조건은 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:166](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:166), reconcile 조기 종료는 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:63](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:63)다. 명세는 결과 불명 충전을 추측으로 확정하지 않도록 한다([/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/course/spec-v2.md:171](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/course/spec-v2.md:171)).

**영향:** PG에서는 금액이 승인되었는데 서비스는 영구 실패·포인트 0으로 남는다. 적립 중복 차단 자체가 이 경우 정상적인 복구를 막는다. 단순 에러 응답의 차이가 아니라 결제와 잔액의 불일치다.

**권고:** 승인 요청 전체에서 한 번이라도 전송·처리 여부가 불명인 시도가 있었는지 보존한다. 그 뒤 연결 실패/풀 실패만으로 FAILED로 낮추지 말고 UNKNOWN을 유지해 callback/조회로 확정한다. 명시적 PG 거절과 “이번 시도만 전송 전 실패”를 구분한다.

**완료 검증:** 첫 5xx 후 연결 실패, 첫 5xx 후 풀 대기 실패를 각각 만들고 최종 UNKNOWN → 정상 DONE callback/조회 → 적립 정확히 1회, 원장/잔액 일치를 확인한다. 전 시도가 전송 전 실패인 경우와 기존 5xx→200 성공도 유지해야 한다. 이 보고서에서 실행한 검증은 아니다.

## A2 — P2 / FIXABLE / 신뢰도 높음(0.96)

### 승인·조회 응답의 amount를 검증하지 않고 요청 금액으로 적립한다

핵심 위치: [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:129](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:129), [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:66](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:66).

**전제:** PG 또는 그 앞단의 연계 오류로 응답의 승인 금액이 요청과 다르다. 외부 응답 오류를 전제로 한 신뢰 경계 문제이며, 일반 사용자가 임의 PG 응답을 만들 수 있다고 주장하지 않는다.

**전체 경로:**

- HTTP 충전 → `ChargeService.charge` → `PgClient.approve`가 `PgApproval`로 역직렬화 → `apply`가 status만 분기 → `settleDone` → 저장 요청 amount로 `PointService.charge`.
- 결과 불명 건 → `reconcile` → `PgClient.findByOrderId` → found.status만 분기 → 동일 `settleDone`.

**구체적 상태:** 저장 요청 금액이 10,000인데 upstream DONE 응답의 amount가 1,000이면, 두 경로 모두 금액 비교 없이 DONE으로 전환하고 10,000을 적립한다. 콜백에서는 동일한 불일치를 400으로 막지만 승인·조회 경로에는 그 보호가 없다. 이후 정상 조회도 DONE 조기 종료에 막힌다.

**근거:** `PgApproval`에 amount가 있지만 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:131](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:131)와 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:68](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:68)는 읽지 않는다. 적립은 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:168](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:168)에서 `payment.getAmount()`를 사용하고, [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/point/PointService.java:38](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/point/PointService.java:38)가 그 값을 잔액과 원장에 반영한다. 콜백 금액 비교는 [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:86](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/payment/ChargeService.java:86)에만 있다. 명세의 외부 응답은 amount를 포함한다([/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/course/spec-v2.md:219](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/course/spec-v2.md:219)). 명세가 승인 응답 금액 불일치의 정확한 HTTP 코드까지 규정한 것은 아니므로, 이를 특정 상태 코드 계약 위반이라고 단정하지 않는다.

**영향:** 자체 원장 합과 잔액은 일치해도 PG 실승인 금액과는 다르다. 잔액/원장 합계 테스트만으로 검출할 수 없다.

**권고·완료 검증:** 승인·조회 양쪽에서 상태 확정 전에 요청 금액과 응답 금액 일치를 검증하고, 불일치 응답은 적립 없이 조사 가능한 상태로 남긴다. 두 경로의 정상 금액/불일치 금액을 각각 확인하고, 불일치 시 DONE·CHARGE 원장·잔액 증가가 없어야 한다. 자동 복구·오류 응답 정책은 명세에 명시한다.

## A3 — P2 후보 / INVESTIGATE / 신뢰도 중상(0.90)

### 게시글 일반 수정과 bulk 좋아요 갱신·삭제 사이의 stale write

핵심 위치: [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/PostServiceImpl.java:60](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/PostServiceImpl.java:60), [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/PostServiceImpl.java:69](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/PostServiceImpl.java:69), [/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/Post.java:29](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/Post.java:29).

`PostController.update/patch/delete` → 트랜잭션 서비스 → `findOwned` → 비잠금 `findActiveDetail` → 엔티티 변경 → flush 경로에 optimistic version/행 잠금/조건부 변경이 없다. `Post`에는 `@Version`, `@DynamicUpdate`가 없다. 반면 좋아요는 독립 조건부 bulk UPDATE다([/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/PostRepository.java:24](/Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022/board-server/src/main/java/com/example/board/post/PostRepository.java:24)). 작성자 검사와 ACTIVE 필터는 **읽은 시점**에만 적용된다.

- 순서 1: 수정 T1이 likeCount=0인 Post를 읽음 → 좋아요 T2가 count=1 및 post_like 한 행을 커밋 → T1이 제목 변경을 flush. Hibernate 기본 전체 컬럼 UPDATE가 적용되면 stale likeCount=0이 덮여 관계 행 1개와 카운트 0이 된다.
- 순서 2: 수정 T1이 ACTIVE 읽음 → 작성자의 삭제 T2가 DELETED 커밋 → T1이 수정 flush. 같은 전체 컬럼 UPDATE이면 stale ACTIVE를 덮어 삭제 글이 재노출된다.

핵심 조건은 현재 Hibernate가 실제로 내보내는 UPDATE SQL이다. 이 담당자는 DB/런타임 실행을 하지 않아 해당 SQL과 교차 트랜잭션 결과는 아직 직접 관찰하지 않았다. 게시글 담당자와 메인에게 전달했다. 좋아요↔좋아요만 직렬화한 테스트 통과는 이 **수정↔좋아요/삭제** 조합의 증거가 아니다. 이 항목을 확정 결함으로 집계하기 전 실제 SQL과 위 순서를 확인한다.

## 이미 선언된 범위·보호 장치

- D09 Redis·로그인 시도 제한·인기글·랭킹, D10 관리자·신고·AOP·엑셀 미완료는 README가 명시한 진행 범위다. D01~D08 회귀나 신규 발견으로 집계하지 않았다. 환불 API도 현 명세의 약속된 범위에 없다.
- README에 이미 적힌 환경변수 문구, 쿠폰 할인율/재고 오류 명세, 좋아요 예외 전체 삼킴, prod 주석, 새 태그 동시 생성 충돌 5건은 재발견으로 세지 않았다. 특히 “minor (deferred)”라는 문서 표기가 실질 위험도를 자동으로 결정하지는 않는다.
- 주문: 회원 잠금 → 기존 키 본문 비교 → 조건부 재고 차감 → 소유/미사용/만료 조건부 쿠폰 사용 → 주문 → 포인트 차감이 하나의 TransactionTemplate에 묶인다. 이를 무시하고 repository만 보고 “이중 차감/타인 쿠폰 사용 가능”이라고 판정하지 않았다.
- 포인트: 원자적 잔액 UPDATE와 ledger INSERT는 REQUIRED 트랜잭션에 함께 묶인다. 일반 중복 callback은 payment 상태 UPDATE 영향 행 1인 경로만 적립한다.
- PG: 원문 HMAC 확인이 JSON 파싱보다 먼저이며, 금액 비교는 callback 경로에 있다. 외부 승인/조회 호출은 현재 서비스 경로에서 DB 트랜잭션 밖이다. 이 장점들이 A1·A2를 제거하지는 않는다.

## 전체 변경 파일 인벤토리

아래는 위 base..HEAD의 native Git 출력이다. A=추가, M=수정이다. 상대 경로는 Git 출력 보존용이며 해석 기준 checkout 절대경로는 /Users/ds/code/javaExperience/.worktrees/pr9-holistic-review-20261022이다.

```text
A	board-server/.gitignore
A	board-server/VERIFY.md
A	board-server/build.gradle
A	board-server/compose.yaml
A	board-server/gradle/wrapper/gradle-wrapper.jar
A	board-server/gradle/wrapper/gradle-wrapper.properties
A	board-server/gradlew
A	board-server/gradlew.bat
A	board-server/settings.gradle
A	board-server/src/main/java/com/example/board/BoardApplication.java
A	board-server/src/main/java/com/example/board/comment/Comment.java
A	board-server/src/main/java/com/example/board/comment/CommentController.java
A	board-server/src/main/java/com/example/board/comment/CommentPage.java
A	board-server/src/main/java/com/example/board/comment/CommentRepository.java
A	board-server/src/main/java/com/example/board/comment/CommentRequest.java
A	board-server/src/main/java/com/example/board/comment/CommentResponse.java
A	board-server/src/main/java/com/example/board/comment/CommentService.java
A	board-server/src/main/java/com/example/board/common/BaseEntity.java
A	board-server/src/main/java/com/example/board/common/BusinessException.java
A	board-server/src/main/java/com/example/board/common/CommonCodeRegistry.java
A	board-server/src/main/java/com/example/board/common/CursorPage.java
A	board-server/src/main/java/com/example/board/common/ErrorCode.java
A	board-server/src/main/java/com/example/board/common/ForbiddenWordChecker.java
A	board-server/src/main/java/com/example/board/common/ForbiddenWordLoader.java
A	board-server/src/main/java/com/example/board/common/GlobalExceptionHandler.java
A	board-server/src/main/java/com/example/board/common/MultipleOf.java
A	board-server/src/main/java/com/example/board/common/NicknameNormalizer.java
A	board-server/src/main/java/com/example/board/common/RequestIdFilter.java
A	board-server/src/main/java/com/example/board/config/BoardProperties.java
A	board-server/src/main/java/com/example/board/config/CorsConfig.java
A	board-server/src/main/java/com/example/board/config/JpaConfig.java
A	board-server/src/main/java/com/example/board/config/JwtAuthenticationFilter.java
A	board-server/src/main/java/com/example/board/config/JwtProvider.java
A	board-server/src/main/java/com/example/board/config/PgClientConfig.java
A	board-server/src/main/java/com/example/board/config/ProblemDetailSecurityHandler.java
A	board-server/src/main/java/com/example/board/config/ProdSecretsCheck.java
A	board-server/src/main/java/com/example/board/config/SecurityConfig.java
A	board-server/src/main/java/com/example/board/coupon/Coupon.java
A	board-server/src/main/java/com/example/board/coupon/CouponController.java
A	board-server/src/main/java/com/example/board/coupon/CouponRepository.java
A	board-server/src/main/java/com/example/board/coupon/CouponService.java
A	board-server/src/main/java/com/example/board/coupon/CouponStatus.java
A	board-server/src/main/java/com/example/board/coupon/MemberCoupon.java
A	board-server/src/main/java/com/example/board/coupon/MemberCouponRepository.java
A	board-server/src/main/java/com/example/board/coupon/MemberCouponResponse.java
A	board-server/src/main/java/com/example/board/member/AuthController.java
A	board-server/src/main/java/com/example/board/member/AuthMember.java
A	board-server/src/main/java/com/example/board/member/AuthService.java
A	board-server/src/main/java/com/example/board/member/LoginRequest.java
A	board-server/src/main/java/com/example/board/member/Member.java
A	board-server/src/main/java/com/example/board/member/MemberController.java
A	board-server/src/main/java/com/example/board/member/MemberRepository.java
A	board-server/src/main/java/com/example/board/member/MemberResponse.java
A	board-server/src/main/java/com/example/board/member/Role.java
A	board-server/src/main/java/com/example/board/member/SignupRequest.java
A	board-server/src/main/java/com/example/board/member/SignupResponse.java
A	board-server/src/main/java/com/example/board/member/TokenResponse.java
A	board-server/src/main/java/com/example/board/payment/ChargeController.java
A	board-server/src/main/java/com/example/board/payment/ChargeRequest.java
A	board-server/src/main/java/com/example/board/payment/ChargeResponse.java
A	board-server/src/main/java/com/example/board/payment/ChargeService.java
A	board-server/src/main/java/com/example/board/payment/PgApproval.java
A	board-server/src/main/java/com/example/board/payment/PgCallbackController.java
A	board-server/src/main/java/com/example/board/payment/PgCallbackRequest.java
A	board-server/src/main/java/com/example/board/payment/PgClient.java
A	board-server/src/main/java/com/example/board/payment/PgException.java
A	board-server/src/main/java/com/example/board/payment/PgPayment.java
A	board-server/src/main/java/com/example/board/payment/PgPaymentRepository.java
A	board-server/src/main/java/com/example/board/payment/PgPaymentStatus.java
A	board-server/src/main/java/com/example/board/payment/PgRetryPolicy.java
A	board-server/src/main/java/com/example/board/payment/PgSignatureVerifier.java
A	board-server/src/main/java/com/example/board/point/PointBalanceResponse.java
A	board-server/src/main/java/com/example/board/point/PointController.java
A	board-server/src/main/java/com/example/board/point/PointHistoryItem.java
A	board-server/src/main/java/com/example/board/point/PointHistoryMapper.java
A	board-server/src/main/java/com/example/board/point/PointHistoryRequest.java
A	board-server/src/main/java/com/example/board/point/PointLedger.java
A	board-server/src/main/java/com/example/board/point/PointLedgerRepository.java
A	board-server/src/main/java/com/example/board/point/PointLedgerType.java
A	board-server/src/main/java/com/example/board/point/PointService.java
A	board-server/src/main/java/com/example/board/post/Post.java
A	board-server/src/main/java/com/example/board/post/PostController.java
A	board-server/src/main/java/com/example/board/post/PostCreateRequest.java
A	board-server/src/main/java/com/example/board/post/PostDetailResponse.java
A	board-server/src/main/java/com/example/board/post/PostLike.java
A	board-server/src/main/java/com/example/board/post/PostLikeController.java
A	board-server/src/main/java/com/example/board/post/PostLikeRepository.java
A	board-server/src/main/java/com/example/board/post/PostLikeService.java
A	board-server/src/main/java/com/example/board/post/PostListRequest.java
A	board-server/src/main/java/com/example/board/post/PostPatchRequest.java
A	board-server/src/main/java/com/example/board/post/PostQueryMapper.java
A	board-server/src/main/java/com/example/board/post/PostQueryService.java
A	board-server/src/main/java/com/example/board/post/PostRepository.java
A	board-server/src/main/java/com/example/board/post/PostResponse.java
A	board-server/src/main/java/com/example/board/post/PostSearchCondition.java
A	board-server/src/main/java/com/example/board/post/PostService.java
A	board-server/src/main/java/com/example/board/post/PostServiceImpl.java
A	board-server/src/main/java/com/example/board/post/PostStatus.java
A	board-server/src/main/java/com/example/board/post/PostSummary.java
A	board-server/src/main/java/com/example/board/post/PostTag.java
A	board-server/src/main/java/com/example/board/post/PostUpdateRequest.java
A	board-server/src/main/java/com/example/board/post/Tag.java
A	board-server/src/main/java/com/example/board/post/TagRepository.java
A	board-server/src/main/java/com/example/board/shop/OrderRequest.java
A	board-server/src/main/java/com/example/board/shop/OrderResponse.java
A	board-server/src/main/java/com/example/board/shop/OrderService.java
A	board-server/src/main/java/com/example/board/shop/ShopController.java
A	board-server/src/main/java/com/example/board/shop/ShopItem.java
A	board-server/src/main/java/com/example/board/shop/ShopItemRepository.java
A	board-server/src/main/java/com/example/board/shop/ShopItemResponse.java
A	board-server/src/main/java/com/example/board/shop/ShopOrder.java
A	board-server/src/main/java/com/example/board/shop/ShopOrderRepository.java
A	board-server/src/main/resources/application-local.yml
A	board-server/src/main/resources/application-prod.yml
A	board-server/src/main/resources/application.yml
A	board-server/src/main/resources/data-local.sql
A	board-server/src/main/resources/logback-spring.xml
A	board-server/src/main/resources/mapper/PointHistoryMapper.xml
A	board-server/src/main/resources/mapper/PostQueryMapper.xml
A	board-server/src/main/resources/schema.sql
A	board-server/src/test/java/com/example/board/ApiTestSupport.java
A	board-server/src/test/java/com/example/board/ApplicationYmlTest.java
A	board-server/src/test/java/com/example/board/BoardApplicationTests.java
A	board-server/src/test/java/com/example/board/HealthEndpointTest.java
A	board-server/src/test/java/com/example/board/PgContainers.java
A	board-server/src/test/java/com/example/board/ProfileConfigTest.java
A	board-server/src/test/java/com/example/board/TestcontainersConfig.java
A	board-server/src/test/java/com/example/board/comment/CommentApiTest.java
A	board-server/src/test/java/com/example/board/comment/CommentRepositoryTest.java
A	board-server/src/test/java/com/example/board/common/ForbiddenWordCheckerTest.java
A	board-server/src/test/java/com/example/board/common/ForbiddenWordLoaderTest.java
A	board-server/src/test/java/com/example/board/common/GlobalExceptionHandlerTest.java
A	board-server/src/test/java/com/example/board/common/JpaAuditingTest.java
A	board-server/src/test/java/com/example/board/common/NicknameNormalizerTest.java
A	board-server/src/test/java/com/example/board/common/RequestIdFilterTest.java
A	board-server/src/test/java/com/example/board/config/BoardPropertiesBootTest.java
A	board-server/src/test/java/com/example/board/config/BoardPropertiesTest.java
A	board-server/src/test/java/com/example/board/config/HikariPoolConfigTest.java
A	board-server/src/test/java/com/example/board/config/JwtProviderTest.java
A	board-server/src/test/java/com/example/board/config/SecurityRulesTest.java
A	board-server/src/test/java/com/example/board/coupon/CouponIssueApiTest.java
A	board-server/src/test/java/com/example/board/coupon/CouponRepositoryTest.java
A	board-server/src/test/java/com/example/board/member/AuthApiTest.java
A	board-server/src/test/java/com/example/board/member/MemberApiTest.java
A	board-server/src/test/java/com/example/board/member/MemberRepositoryTest.java
A	board-server/src/test/java/com/example/board/payment/ChargeApiTest.java
A	board-server/src/test/java/com/example/board/payment/ChargeTransactionBoundaryTest.java
A	board-server/src/test/java/com/example/board/payment/PgApiTestSupport.java
A	board-server/src/test/java/com/example/board/payment/PgCallbackApiTest.java
A	board-server/src/test/java/com/example/board/payment/PgCallbackOrderingTest.java
A	board-server/src/test/java/com/example/board/payment/PgClientRetryTest.java
A	board-server/src/test/java/com/example/board/payment/PgClientTest.java
A	board-server/src/test/java/com/example/board/payment/PgPaymentRepositoryTest.java
A	board-server/src/test/java/com/example/board/payment/PgSignatureVerifierTest.java
A	board-server/src/test/java/com/example/board/payment/PgSignatures.java
A	board-server/src/test/java/com/example/board/payment/PgTimeoutTest.java
A	board-server/src/test/java/com/example/board/point/PointApiTest.java
A	board-server/src/test/java/com/example/board/point/PointConcurrencyTest.java
A	board-server/src/test/java/com/example/board/point/PostEarnApiTest.java
A	board-server/src/test/java/com/example/board/post/EntityRulesTest.java
A	board-server/src/test/java/com/example/board/post/MyBatisInjectionTest.java
A	board-server/src/test/java/com/example/board/post/PostCreateApiTest.java
A	board-server/src/test/java/com/example/board/post/PostCreateRequestTest.java
A	board-server/src/test/java/com/example/board/post/PostCrudApiTest.java
A	board-server/src/test/java/com/example/board/post/PostLikeApiTest.java
A	board-server/src/test/java/com/example/board/post/PostLikeRepositoryTest.java
A	board-server/src/test/java/com/example/board/post/PostListApiTest.java
A	board-server/src/test/java/com/example/board/post/PostListExplainTest.java
A	board-server/src/test/java/com/example/board/post/PostQueryMapperTest.java
A	board-server/src/test/java/com/example/board/post/PostQueryServiceTest.java
A	board-server/src/test/java/com/example/board/post/PostRepositoryTest.java
A	board-server/src/test/java/com/example/board/post/PostServiceImplTest.java
A	board-server/src/test/java/com/example/board/post/TagRepositoryTest.java
A	board-server/src/test/java/com/example/board/shop/LocalProfileSeedTest.java
A	board-server/src/test/java/com/example/board/shop/OrderApiTest.java
A	board-server/src/test/java/com/example/board/shop/OrderIdempotencyConcurrencyTest.java
A	board-server/src/test/java/com/example/board/shop/OrderServiceRulesTest.java
A	board-server/src/test/java/com/example/board/shop/ShopItemTest.java
A	board-server/src/test/java/com/example/board/shop/ShopOrderRepositoryTest.java
A	board-server/src/test/resources/wiremock/mappings/pg-approve-declined.json
A	board-server/src/test/resources/wiremock/mappings/pg-approve.json
A	board-server/toxiproxy.json
A	course/README.html
A	course/README.md
A	course/roadmap.json
A	course/spec-v2.html
A	course/spec-v2.md
A	course/talk-cards.html
A	course/talk-cards.md
A	docs/course-redesign/README.md
A	docs/course-redesign/plans/2026-10-22-00-overall-roadmap.md
A	docs/course-redesign/plans/2026-10-22-p1-ledger.md
A	docs/course-redesign/plans/2026-10-22-p1-spec-roadmap.md
A	docs/course-redesign/plans/2026-10-22-p2-answer-server.md
A	docs/course-redesign/plans/2026-10-22-p2-ledger.md
A	docs/course-redesign/research/01-javaExperience-analysis.md
A	docs/course-redesign/research/02-external-references.md
A	docs/course-redesign/research/03-assignment-design.md
A	docs/course-redesign/research/04-scenario-evaluation.md
A	docs/course-redesign/research/05-competency-bar-3to6yrs.md
A	docs/course-redesign/research/06-spring-practical-fundamentals.md
A	docs/course-redesign/research/07-db-practical-scenarios.md
A	docs/course-redesign/research/08-incidents-and-brownfield-curricula.md
A	docs/course-redesign/research/09-reference-codebases-and-structure.md
A	docs/course-redesign/research/10-operational-layer.md
A	docs/course-redesign/research/11-community-feature-inventory.md
A	docs/course-redesign/research/13-netmarble-backend.md
A	docs/course-redesign/research/14-redesign-design.md
A	docs/course-redesign/research/README.md
A	tools/course/fixtures/cards.md
A	tools/course/fixtures/roadmap.json
A	tools/course/fixtures/spec.md
A	tools/course/gradle-docker.sh
A	tools/course/validate.mjs
A	tools/course/validate.test.mjs
M	tools/site/build.mjs
M	tools/site/package.json
```

최종 권고: **A1을 우선 재현·수정한 뒤 병합**. A2의 upstream 검증을 보강하고 A3를 실제 동시성 실행으로 확정한다. D09/D10의 의도된 미완료와 D01~D08의 결함을 분리해 완료 상태를 표시한다.
