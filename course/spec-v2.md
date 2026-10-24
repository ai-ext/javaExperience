# 명세서 v2 (커뮤니티 게시판 + 관리자 + 포인트·쿠폰 상점)

> 기존 10장 명세와 응답 형식이 다르다. 응답 래퍼 `ApiResponse`는 없고 에러는 ProblemDetail로 통일한다. 인증은 인터셉터가 아니라 Spring Security 필터 체인이 맡는다.
> 이 문서의 엔드포인트 문자열(`메서드 경로`)이 일자 페이지·정답 서버·실습의 기준 계약이다. 표기를 바꾸지 않는다.

## 1. 개요

도메인은 세 영역이다.

| 영역 | 기능 |
|---|---|
| 게시판 | 회원, 글, 태그, 댓글, 좋아요, 목록·검색 |
| 상점 | 활동 포인트 적립, 포인트 충전(외부 PG 모의), 쿠폰 발급(1인 1매, 선착순), 쿠폰·포인트로 아이템 구매 |
| 관리자 | 신고 처리·글 숨김, 쿠폰 대량 지급, 감사 로그, 역할별 권한 |

스택은 Java 21, Spring Boot 4.1, Spring Security, JPA(Hibernate 7), MyBatis, MySQL 8.4, Redis(Spring Data Redis·Lettuce), Testcontainers, WireMock(+Toxiproxy)이다. 로컬에서는 `docker`·`docker compose` 명령이 동작하는 Docker 런타임을 쓴다.

쓰기는 JPA, 목록·검색은 MyBatis를 쓴다(D06).

## 2. 공통 규칙

- 요청·응답 본문은 JSON(`application/json`)이다. 성공 응답은 래퍼 없이 리소스를 그대로 돌려준다.
- 에러는 ProblemDetail(`application/problem+json`)이다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `type` | string(URI) | 에러 종류. 예: `/errors/validation` |
| `title` | string | 짧은 제목 |
| `status` | int | HTTP 상태 코드 |
| `detail` | string | 사람이 읽는 설명 |
| `instance` | string | 요청 경로 |
| `errors[]` | array | 필드 검증 실패 목록. 항목은 `{field, reason}` |

- 상태 코드: 400 검증 실패, 401 인증 없음·만료, 403 권한 없음, 404 대상 없음, 409 중복·충돌, 422 같은 `Idempotency-Key`에 다른 본문, 429 시도 횟수 초과, 502 PG 거절·PG에 닿지 못함, 504 PG 결과 불명(시간 초과·5xx 재시도 소진).
- 401·403도 같은 ProblemDetail 형식이다(`SecurityFilterChain`의 진입점·거부 핸들러에서 만든다).
- 예외: 허용 목록 밖 출처의 CORS 요청(preflight 포함) 거부는 Spring CORS 처리기의 기본 응답(403, `text/plain` `Invalid CORS request`)이다. 브라우저는 CORS 거부 응답의 본문을 스크립트에 넘기지 않으므로 ProblemDetail로 바꾸지 않는다.
- 시간은 ISO-8601 KST 오프셋 문자열이다. 예: `2026-10-22T09:30:00+09:00`.
- 목록은 커서 방식이다. 요청 파라미터는 `cursor`(생략하면 처음부터), `size`(기본 20, 최대 50)이다. 응답은 `items`와 `nextCursor`이며, 마지막 쪽이면 `nextCursor`는 `null`이다.
- `size`가 1 미만이거나 50 초과면 400이다.

## 3. 인증·권한

- 인증은 JWT를 `Authorization: Bearer <token>` 헤더로 보낸다. 역할은 `USER`, `ADMIN` 두 가지다.
- 규칙은 위에서부터 처음 매치된 것만 적용된다. 구체적인 경로를 먼저 쓴다.
- 경로별 공개 범위:

| 범위 | 대상 |
|---|---|
| 공개 | 가입·로그인(`/api/auth/signup`, `/api/auth/login`), 헬스(`/actuator/health`), 공개 GET(글 상세·목록·인기글, 댓글 목록, 랭킹, 상점 아이템), Swagger(`/swagger-ui/**`, `/v3/api-docs/**`), PG 콜백(`/api/pg/callbacks`, `X-PG-Signature` 서명 검증으로 보호) |
| USER | 글·댓글 쓰기, 좋아요, 내 정보·포인트·쿠폰, 쿠폰 발급, 구매, 충전, 신고. 수정·삭제는 작성자 본인만 |
| ADMIN | `/api/admin/**` 전체. 댓글 삭제는 작성자 또는 ADMIN |

- 공개 GET이라도 `/actuator/health`를 제외한 `/actuator/**`는 공개하지 않는다.
- CORS 허용 출처는 `http://localhost:3000`, `http://127.0.0.1:8765` 두 곳이다. preflight(`OPTIONS`)는 인증 필터보다 먼저 처리한다.
- 로그인 시도는 계정당 10분에 5회까지다(D09, 8절).

## 4. 엔드포인트

`Idempotency-Key` 헤더는 `POST /api/shop/orders`와 `POST /api/me/points/charges`에서 필수다.

| 메서드 | 경로 | 권한 | 설명 | 도입일 |
|---|---|---|---|---|
| GET | /actuator/health | 공개 | 헬스 체크 | D01 |
| POST | /api/auth/signup | 공개 | 회원 가입 | D03 |
| POST | /api/auth/login | 공개 | 로그인, JWT 발급 | D03 |
| GET | /api/members/me | USER | 내 정보 조회 | D03 |
| POST | /api/posts | USER | 글 작성 | D04 |
| GET | /api/posts/{postId} | 공개 | 글 상세 조회 | D05 |
| PUT | /api/posts/{postId} | USER(작성자) | 글 전체 수정 | D05 |
| PATCH | /api/posts/{postId} | USER(작성자) | 글 부분 수정 | D05 |
| DELETE | /api/posts/{postId} | USER(작성자) | 글 소프트 삭제 | D05 |
| POST | /api/posts/{postId}/comments | USER | 댓글 작성 | D05 |
| GET | /api/posts/{postId}/comments | 공개 | 댓글 목록 | D05 |
| DELETE | /api/comments/{commentId} | USER(작성자)·ADMIN | 댓글 삭제 | D05 |
| PUT | /api/posts/{postId}/like | USER | 좋아요 등록(멱등) | D05 |
| DELETE | /api/posts/{postId}/like | USER | 좋아요 취소(멱등) | D05 |
| GET | /api/posts | 공개 | 글 목록·검색(커서) | D06 |
| GET | /api/me/points | USER | 내 포인트 잔액 | D07 |
| GET | /api/me/points/history | USER | 포인트 적립·차감 이력(커서) | D07 |
| POST | /api/coupons/{couponId}/issue | USER | 쿠폰 발급(1인 1매, 선착순) | D07 |
| GET | /api/me/coupons | USER | 내 쿠폰 목록 | D07 |
| GET | /api/shop/items | 공개 | 상점 아이템 목록 | D07 |
| POST | /api/shop/orders | USER | 쿠폰·포인트로 아이템 구매 | D07 |
| POST | /api/me/points/charges | USER | 포인트 충전(외부 PG 승인) | D08 |
| POST | /api/pg/callbacks | 공개(서명) | PG 결제 완료 콜백 수신 | D08 |
| GET | /api/posts/popular | 공개 | 인기글 목록(캐시) | D09 |
| GET | /api/rankings/activity | 공개 | 활동 랭킹 | D09 |
| POST | /api/posts/{postId}/reports | USER | 글 신고 | D10 |
| GET | /api/admin/reports | ADMIN | 신고 목록 | D10 |
| POST | /api/admin/posts/{postId}/hide | ADMIN | 글 숨김 | D10 |
| POST | /api/admin/coupons/{couponId}/bulk-issue | ADMIN | 쿠폰 대량 지급(엑셀 업로드) | D10 |
| GET | /api/admin/audit-logs | ADMIN | 감사 로그 조회(커서) | D10 |

## 5. 필드 규칙

검증 실패는 400이며 `errors[]`에 `{field, reason}`을 담는다. 표의 "위반 시"는 `errors[].reason`이 아니라 응답 상태와 `type`이다.

### 5-1. 인증·회원

| 엔드포인트 | 필드 | 타입 | 필수 | 길이·형식 | 위반 시 |
|---|---|---|---|---|---|
| POST /api/auth/signup | `email` | string | O | 이메일 형식, 최대 100 | 400 `/errors/validation` |
| POST /api/auth/signup | `password` | string | O | 8~64자, 영문·숫자 각 1자 이상 | 400 `/errors/validation` |
| POST /api/auth/signup | `nickname` | string | O | 2~20자, 한글·영문·숫자 | 400 `/errors/validation` |
| POST /api/auth/signup | (중복) | - | - | `email`·`nickname`은 각각 유일 | 409 `/errors/duplicate` |
| POST /api/auth/login | `email` | string | O | 이메일 형식 | 400 `/errors/validation` |
| POST /api/auth/login | `password` | string | O | 비어 있지 않음 | 400 `/errors/validation` |
| POST /api/auth/login | (불일치) | - | - | 이메일·비밀번호 중 무엇이 틀렸는지 알리지 않는다 | 401 `/errors/unauthorized` |
| POST /api/auth/login | (횟수 초과) | - | - | 10분 5회 초과 | 429 `/errors/too-many-attempts` |

로그인 응답은 `{accessToken, tokenType: "Bearer", expiresIn}`이다. `GET /api/members/me` 응답은 `id`, `email`, `nickname`, `role`, `createdAt`이며 비밀번호 해시는 절대 포함하지 않는다.

### 5-2. 글·댓글·좋아요

| 엔드포인트 | 필드 | 타입 | 필수 | 길이·형식 | 위반 시 |
|---|---|---|---|---|---|
| POST /api/posts, PUT /api/posts/{postId} | `title` | string | O | 1~100자, 공백만 불가 | 400 `/errors/validation` |
| POST /api/posts, PUT /api/posts/{postId} | `content` | string | O | 1~5000자 | 400 `/errors/validation` |
| POST /api/posts, PUT /api/posts/{postId} | `tags` | string[] | X | 최대 5개, 각 1~20자, 중복 제거 | 400 `/errors/validation` |
| PATCH /api/posts/{postId} | `title`, `content`, `tags` | 위와 같음 | X | 보낸 필드만 위 규칙으로 검증, 전부 없으면 불가. 생략한 필드와 `null`인 필드는 둘 다 바꾸지 않는다 | 400 `/errors/validation` |
| POST /api/posts/{postId}/comments | `content` | string | O | 1~500자 | 400 `/errors/validation` |
| (경로) | `postId`, `commentId` | long | O | 양수 | 400 `/errors/validation` |
| (대상 없음) | - | - | - | 없는 글·댓글, 삭제·숨김 처리된 글 | 404 `/errors/not-found` |
| (작성자 아님) | - | - | - | 수정·삭제를 작성자 외가 시도 | 403 `/errors/forbidden` |

좋아요 `PUT`·`DELETE`는 본문이 없다. 이미 눌렀는데 또 `PUT`이어도 204이고 상태는 그대로다(같은 회원·글의 중복 저장을 DB에서도 거부하도록 설계한다).

### 5-3. 목록·검색

`GET /api/posts` 쿼리 파라미터:

| 필드 | 타입 | 필수 | 길이·형식 | 위반 시 |
|---|---|---|---|---|
| `cursor` | string | X | 서버가 준 불투명 문자열 | 400 `/errors/validation` |
| `size` | int | X | 1~50, 기본 20 | 400 `/errors/validation` |
| `keyword` | string | X | 2~50자, 제목·본문 검색 | 400 `/errors/validation` |
| `tag` | string | X | 1~20자 | 400 `/errors/validation` |
| `sort` | string | X | `latest`(기본)만 허용 | 400 `/errors/validation` |

`GET /api/posts/popular`, `GET /api/rankings/activity`, `GET /api/posts/{postId}/comments`, `GET /api/me/points/history`, `GET /api/admin/audit-logs`는 `cursor`·`size`만 받는다(규칙은 2절과 같다).

### 5-4. 포인트·쿠폰·상점

| 엔드포인트 | 필드 | 타입 | 필수 | 길이·형식 | 위반 시 |
|---|---|---|---|---|---|
| POST /api/coupons/{couponId}/issue | (본문 없음) | - | - | 이미 받은 회원 | 409 `/errors/duplicate` |
| POST /api/coupons/{couponId}/issue | (소진) | - | - | 잔여 수량 0 | 409 `/errors/coupon-exhausted` |
| POST /api/shop/orders | `Idempotency-Key` | header | O | 8~64자, 영문·숫자·`-` | 400 `/errors/validation` |
| POST /api/shop/orders | `itemId` | long | O | 양수 | 400 `/errors/validation` |
| POST /api/shop/orders | `quantity` | int | O | 1~10 | 400 `/errors/validation` |
| POST /api/shop/orders | `memberCouponId` | long | X | 본인 소유·미사용·유효기간 내 | 409 `/errors/coupon-unusable` |
| POST /api/shop/orders | (잔액 부족) | - | - | 포인트 < 결제 금액 | 409 `/errors/insufficient-points` |
| POST /api/shop/orders | (재고 부족) | - | - | 남은 재고 < `quantity` | 409 `/errors/out-of-stock` |

결제 금액은 `price × quantity`이고, 쿠폰을 쓰면 10% 할인한다(할인액은 소수점 이하 버림).

같은 `Idempotency-Key`로 같은 본문을 다시 보내면 처음 응답을 그대로 돌려준다. 같은 키에 다른 본문이면 422다.

### 5-5. 포인트 충전·PG 콜백

| 엔드포인트 | 필드 | 타입 | 필수 | 길이·형식 | 위반 시 |
|---|---|---|---|---|---|
| POST /api/me/points/charges | `Idempotency-Key` | header | O | 8~64자, 영문·숫자·`-` | 400 `/errors/validation` |
| POST /api/me/points/charges | `amount` | int | O | 1,000~1,000,000, 1,000 단위 | 400 `/errors/validation` |
| POST /api/me/points/charges | (PG 시간 초과) | - | - | 결과 불명, 충전 요청의 상태 `UNKNOWN`으로 남긴다 | 504 `/errors/pg-timeout` |
| POST /api/me/points/charges | (PG 5xx, 재시도 소진) | - | - | 결과 불명(PG가 처리했을 수 있다), `UNKNOWN`으로 남긴다 | 504 `/errors/pg-timeout` |
| POST /api/me/points/charges | (PG 거절·PG에 닿지 못함) | - | - | 승인 실패(4xx 거절, 연결 실패·커넥션 풀 대기 초과), `FAILED`로 남긴다 | 502 `/errors/pg-declined` |
| POST /api/pg/callbacks | `X-PG-Signature` | header | O | 7절 서명 규칙 | 401 `/errors/invalid-signature` |
| POST /api/pg/callbacks | `orderId` | string | O | 저장된 충전 요청의 `orderId`와 같아야 함 | 404 `/errors/not-found` |
| POST /api/pg/callbacks | `paymentKey` | string | O | 1~64자 | 400 `/errors/validation` |
| POST /api/pg/callbacks | `status` | string | O | `DONE`, `FAILED` 중 하나 | 400 `/errors/validation` |
| POST /api/pg/callbacks | `amount` | int | O | 양수, 저장된 충전 금액과 같아야 함 | 400 `/errors/validation` |

같은 `paymentKey`의 콜백이 여러 번 와도 포인트는 한 번만 적립한다.

같은 `Idempotency-Key`로 다시 보내면 PG를 다시 부르지 않고 저장된 상태로 답한다(`DONE`은 처음 응답, `FAILED`는 502, `REQUESTED`·`UNKNOWN`은 504).

`UNKNOWN` 충전은 콜백이나 `GET /pg/v1/payments?orderId={orderId}` 조회(예: 재처리 워커)로만 확정하고, 추측으로 성공·실패를 정하지 않는다.

### 5-6. 신고·관리자

| 엔드포인트 | 필드 | 타입 | 필수 | 길이·형식 | 위반 시 |
|---|---|---|---|---|---|
| POST /api/posts/{postId}/reports | `reason` | string | O | `SPAM`, `ABUSE`, `ETC` 중 하나 | 400 `/errors/validation` |
| POST /api/posts/{postId}/reports | `detail` | string | X | 최대 300자 | 400 `/errors/validation` |
| POST /api/posts/{postId}/reports | (중복) | - | - | 같은 회원이 같은 글을 다시 신고 | 409 `/errors/duplicate` |
| GET /api/admin/reports | `status` | string | X | `OPEN`(기본), `RESOLVED` | 400 `/errors/validation` |
| GET /api/admin/reports | `cursor`, `size` | - | X | 2절과 같음 | 400 `/errors/validation` |
| POST /api/admin/posts/{postId}/hide | `reportId` | long | X | 연결할 신고. 있으면 해당 신고를 `RESOLVED`로 바꾼다 | 404 `/errors/not-found` |
| POST /api/admin/coupons/{couponId}/bulk-issue | `file` | multipart | O | `.xlsx`, 최대 5MB, 최대 1,000행, 첫 열 `memberId` | 400 `/errors/validation` |
| POST /api/admin/coupons/{couponId}/bulk-issue | (행 오류) | - | - | 없는 회원·이미 보유한 행은 건너뛰고 응답에 `{issued, skipped[]}`로 알린다 | 200 |

관리자 동작(`hide`, `bulk-issue`)은 모두 감사 기록으로 남는다.

## 6. 데이터 요구사항

테이블·컬럼·키·제약·인덱스는 학습자가 직접 설계한다. 아래는 저장할 사실과 지켜야 할 성질이며 물리 이름이나 테이블 분할을 지정하지 않는다. API 필드 이름·enum·오류 코드는 2~5절의 계약을 유지한다. `schema.sql`은 내 설계를 생성하는 파일로 쓴다.

설계하는 순서마다 **설계 메모**를 남긴다: 만든 테이블·키·제약·인덱스와 각각의 이유, 고려했다 버린 대안 1개. DB가 직접 보장하는 불변식은 실패해야 할 INSERT·UPDATE와 실제 거부 결과로 확인한다. 여러 행의 합·추가 전용 정책처럼 단일 제약만으로 보장하기 어려운 성질은 트랜잭션·권한·애플리케이션의 책임을 구분하고 검증 쿼리·테스트로 확인한다. 예시 서버의 제약 구현이 모든 요구를 보장한다고 가정하지 않는다.

### 6-1. 기동용 기준 데이터 (D02)

- 저장할 사실: 금칙어 문자열, 공통코드의 그룹·코드·표시 이름.
- 불변식: 같은 금칙어와 같은 그룹 안의 같은 코드는 중복되지 않는다.
- 조회: 기동이 준비된 뒤 전체를 읽어 메모리에 적재한다. 변경 후 재기동으로 새 값을 확인한다.
- 보존: 기준 데이터 변경이 과거 업무 이력의 의미를 바꾸거나 지우지 않도록 한다.

### 6-2. 회원 (D03)

- 저장할 사실: 회원 식별, 이메일, 비밀번호 해시, 닉네임, 역할(`USER`/`ADMIN`), 가입·변경 시각.
- 불변식: 이메일·정규화한 닉네임은 각각 중복 불가다. 비밀번호 원문은 저장·응답하지 않는다. 참조 대상인 회원을 식별할 수 있어야 한다.
- 조회: 이메일로 로그인 대상 찾기, 인증된 회원의 내 정보 조회.
- 보존: 회원과 연결된 글·금전 이력·감사 기록을 임의 연쇄 삭제하지 않는다. 탈퇴 API는 이번 계약에 없다.

### 6-3. 글·태그 (D04~D06)

- 저장할 사실: 작성자, 제목, 본문, 공개 상태(`ACTIVE`/`HIDDEN`/`DELETED`), 작성·변경 시각, 태그 이름과 글에 붙은 태그, 좋아요 수(저장한다면 원본 관계와 일치).
- 불변식: 작성자는 존재하는 회원이다. 같은 이름의 태그를 공유하고 한 글에 같은 태그를 중복 연결하지 않는다. 필드 길이·최대 5개 등은 5-2절과 같다.
- 조회: 공개 글 최신순 20건과 커서 다음 쪽(동률에도 순서가 안정적이어야 함), 제목·본문 검색, 태그 필터, 작성자·태그를 포함한 상세, 좋아요가 많은 공개 글.
- 보존: 삭제는 `DELETED`, 숨김은 `HIDDEN`으로 남긴다. 두 상태는 공개 상세·목록과 수정·댓글 작성 대상에서 제외한다. 글 하나에서 태그를 빼거나 글을 삭제해도 다른 글이 쓰는 태그를 지우지 않는다.

### 6-4. 댓글·좋아요 (D05)

- 저장할 사실: 어느 글에 누가 쓴 댓글인지, 내용·삭제 여부·시각, 어느 회원이 어느 글을 좋아하는지와 시각.
- 불변식: 연결한 글·회원이 존재한다. 한 회원은 한 글에 좋아요 1번만 가능하다. 등록·취소 재요청에도 상태·합계는 한 번만 바뀐다.
- 조회: 글별 댓글 목록(안정적인 커서 순서), 댓글 작성자, 글별 댓글·좋아요 수와 회원별 활동 집계.
- 보존: 댓글은 삭제 여부를 남기고 공개 조회에서 제외한다. 글 소프트 삭제가 관련 사실의 물리 삭제를 뜻하지 않는다.

### 6-5. 포인트 (D07)

- 저장할 사실: 회원별 현재 잔액, 적립·차감·충전 이력(`EARN`/`SPEND`/`CHARGE`), 증감액, 반영 후 잔액, 발생 사유·참조 대상·시각.
- 불변식: 잔액 = 부호 있는 이력 합, 차감은 음수, 잔액은 음수가 되지 않는다. 잔액과 이력은 함께 확정하거나 함께 취소한다. 이력은 추가 전용이며 수정·삭제하지 않는다.
- 조회: 내 잔액(이력 0건이면 0), 회원별 최신 이력 커서 목록, 잔액 대사, 활동 적립만 집계한 랭킹 원천.
- 보존: 업무 실패 때 부분 기록이 남지 않게 하고 확정된 이력은 과거 사실로 보존한다.

### 6-6. 쿠폰·상점·주문 (D07)

- 저장할 사실: 쿠폰 이름·총량·발급량·만료 시각, 회원별 보유 쿠폰과 사용 상태(`UNUSED`/`USED`)·사용 시각, 아이템 이름·가격·재고, 구매자·아이템·수량·실제 결제 금액·사용 쿠폰·요청 멱등 키·시각.
- 불변식: 발급량은 0 이상 총량 이하, 같은 회원에게 같은 쿠폰은 1매, 재고 ≥ 0. 소유자·만료·미사용 조건과 가격·할인은 5-4절을 따른다. 같은 회원의 같은 `Idempotency-Key` 주문은 1건이다. 동일 키·동일 본문은 같은 결과, 다른 본문은 422다.
- 조회: 아이템 목록, 회원별 보유 쿠폰, 멱등 재요청의 기존 주문, 수량·잔액·사용 상태 대사.
- 보존: 주문과 포인트 차감·재고·쿠폰 사용은 함께 확정/취소한다. 확정된 구매 사실을 아이템 수정이나 숨김으로 잃지 않는다.

### 6-7. 충전·외부 PG (D08)

- 저장할 사실: 요청 회원, 서버가 만든 `orderId`, 요청 금액·멱등 키, PG의 `paymentKey`, 상태(`REQUESTED`/`DONE`/`FAILED`/`UNKNOWN`), 요청·응답 시각.
- 불변식: 충전 멱등 키·`orderId`·값이 있는 `paymentKey`는 각각 중복 불가다. 승인 전에는 `paymentKey`가 없을 수 있다. 동일 결제의 성공 콜백이 반복되어도 충전 적립은 한 번이다. 상점 주문의 회원별 키 범위와 충전의 키 범위를 구분한다.
- 조회: 키·`orderId`·`paymentKey`로 요청 추적, 상태별 건수·금액 집계, 미확정 요청 확인.
- 보존: PG 호출 전 요청 사실을 남기고 결과 불명을 임의 성공·실패로 바꾸지 않는다. 5-5절의 전이·재요청 규칙을 따른다.

### 6-8. 신고·감사 (D10)

- 저장할 사실: 신고 대상 글·신고자·사유(`SPAM`/`ABUSE`/`ETC`)·상세·처리 상태(`OPEN`/`RESOLVED`)·시각, 관리자 행위자·동작·대상 종류·대상 식별·상세·시각.
- 불변식: 같은 회원이 같은 글을 중복 신고할 수 없다. 감사 기록은 추가 전용이다. 숨김에 연결한 신고는 `RESOLVED`로 바뀐다.
- 조회: 상태별 신고 커서 목록, 글별 신고 누적, 관리자 감사 로그 최신순 커서 목록.
- 보존: 글이 숨겨지거나 대상이 바뀌어도 신고·감사 이력은 남는다. 감사 기록의 수정·삭제를 허용하지 않는 저장소·권한 정책과 확인 방법을 설계 메모에 남긴다.

<details>
<summary>구현 예시의 설계(board-server)</summary>

직접 설계한 뒤 비교용으로 펼친다. 아래는 기존 구현 예시의 설계이며 정해진 정답이나 채점할 물리 이름이 아니다. 실제 정의는 [board-server의 schema.sql](../board-server/src/main/resources/schema.sql)에서 대조한다. 아래 공통 필드 설명과 달리 기준 데이터 등에는 감사 필드가 없는 예외도 있다.

공통: 모든 테이블은 `id BIGINT PK AUTO_INCREMENT`, `created_at`, `updated_at`(BaseEntity 감사 필드)을 가진다. 시각 컬럼은 `DATETIME(6)`, 저장은 KST 기준이다. 열거형은 문자열(`@Enumerated(STRING)`)이다.

| 테이블 | 핵심 컬럼 | 핵심 제약 |
|---|---|---|
| `member` | `email`, `password_hash`, `nickname`, `role`, `point_balance` | UNIQUE(`email`), UNIQUE(`nickname`) |
| `post` | `member_id`, `title`, `content`, `status`(`ACTIVE`/`HIDDEN`/`DELETED`), `like_count` | FK `member_id`, 목록 인덱스(`status`, `id`) |
| `tag` | `name` | UNIQUE(`name`) |
| `post_tag` | `post_id`, `tag_id` | UNIQUE(`post_id`, `tag_id`) |
| `comment` | `post_id`, `member_id`, `content`, `deleted` | FK `post_id`, 인덱스(`post_id`, `id`) |
| `post_like` | `post_id`, `member_id` | **UNIQUE(`post_id`, `member_id`)** |
| `coupon` | `name`, `total_quantity`, `issued_quantity`, `expires_at` | `issued_quantity` <= `total_quantity` |
| `member_coupon` | `coupon_id`, `member_id`, `status`(`UNUSED`/`USED`), `used_at` | **UNIQUE(`coupon_id`, `member_id`)** |
| `point_ledger` | `member_id`, `type`(`EARN`/`SPEND`/`CHARGE`), `amount`, `balance_after`, `ref_type`, `ref_id` | 적립·차감 이력, 행은 수정·삭제하지 않는다. 인덱스(`member_id`, `id`) |
| `shop_item` | `name`, `price`, `stock` | `stock` >= 0 |
| `shop_order` | `member_id`, `item_id`, `quantity`, `paid_amount`, `member_coupon_id`, `idempotency_key` | UNIQUE(`member_id`, `idempotency_key`) |
| `pg_payment` | `member_id`, `order_id`(서버가 만든 문자열, 예: `CHG-` + UUID), `amount`, `payment_key`, `status`(`REQUESTED`/`DONE`/`FAILED`/`UNKNOWN`), `idempotency_key`, `requested_at`, `responded_at` | **UNIQUE(`idempotency_key`)**, UNIQUE(`order_id`), UNIQUE(`payment_key`) |
| `report` | `post_id`, `reporter_id`, `reason`, `detail`, `status` | UNIQUE(`post_id`, `reporter_id`) |
| `audit_log` | `actor_id`, `action`, `target_type`, `target_id`, `detail`, `created_at` | 관리자 동작 기록, 추가 전용, 인덱스(`id`) |
| `banned_word` | `word` | UNIQUE(`word`). 기동 시(`ApplicationReadyEvent`) 메모리에 적재하는 금칙어(D02) |
| `common_code` | `group_code`, `code`, `name` | UNIQUE(`group_code`, `code`). 기동 시 메모리에 적재하는 공통코드(D02) |

포인트 잔액은 `member.point_balance` 컬럼을 원자적 `UPDATE`로 갱신하고, 같은 트랜잭션에서 `point_ledger`에 이력을 쌓는다. 잔액과 이력의 합은 항상 일치해야 한다.

</details>

## 7. 외부 PG 계약 (WireMock)

로컬·테스트에서 PG는 WireMock이 흉내 낸다. 시간 초과·지연 장애는 Toxiproxy로 주입한다. 아래 표는 외부 서버의 계약이며 우리 서버의 엔드포인트가 아니다.

| 호출 | 대상 | 설명 |
|---|---|---|
| POST | `/pg/v1/payments` | 승인 요청. 본문 `{orderId, amount}`이며 `orderId`는 저장된 충전 요청의 식별 값이다. 헤더 `Idempotency-Key`. 응답 `{paymentKey, status, amount, approvedAt}` |
| GET | `/pg/v1/payments?orderId={orderId}` | 우리 `orderId`로 결제 조회. 시간 초과로 `paymentKey`를 받지 못했을 때 결과를 확인하는 데 쓴다 |
| GET | `/pg/v1/payments/{paymentKey}` | `paymentKey`로 결제 조회 |

- 승인 응답 `status`는 `DONE`, `FAILED`, `PENDING` 중 하나다. 같은 `Idempotency-Key`의 승인 재요청은 처음 결과를 돌려준다.
- 콜백은 PG가 `POST /api/pg/callbacks`로 보낸다. 본문은 `{orderId, paymentKey, status, amount}`다. 서명 헤더는 `X-PG-Signature`이며, 값은 요청 **본문 원문 바이트**를 PG 비밀키로 HMAC-SHA256한 결과의 16진 소문자 문자열이다.
- 서버는 본문을 파싱하기 전에 원문으로 서명을 계산해 상수 시간 비교로 확인한다. 불일치하면 401이다.
- 비밀키는 설정 파일에 두지 않고 환경 변수로 주입한다.

## 8. 운영 값

| 항목 | 값 |
|---|---|
| HTTP 연결 타임아웃 | 1s |
| HTTP 응답 타임아웃 | 3s |
| HTTP 커넥션 풀 대기 타임아웃 | 2s |
| Hikari `maximum-pool-size` | 10 |
| Hikari `connection-timeout` | 2000ms |
| Redis 명령 타임아웃 | 500ms |
| 인기글 캐시 TTL | 60s |
| 로그인 시도 제한 | 5회 / 10분 |

- 외부 PG 호출은 DB 트랜잭션 밖에서 한다. 트랜잭션 안에서 부르면 PG 지연이 Hikari 풀(10)을 고갈시킨다.
- Redis 지연·장애는 캐시 조회 실패로 처리하고 DB로 폴백한다. 글쓰기 같은 핵심 경로로 번지지 않게 한다.
