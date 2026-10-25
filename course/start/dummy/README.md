# 복사해서 붙여 넣는 더미 SQL

일자 페이지의 '이 날 데이터 넣기'에서 현재 날의 블록을 받는다. 기본 실습과 대량 실험은 DB를 분리한다.

## 붙여 넣는 순서

| 지금 상태 | 작업 DB | 가져올 범위 | 실행·확인 |
|---|---|---|---|
| D01 연결 확인 | 기본 학습 DB | SQL 데이터 없음 | 연결만 확인 |
| D02 → D03 → D04 → D05 | 빈 학습용 테이블에서 시작한 기본 DB | `seed.sql`의 해당 날 블록 | 테이블을 먼저 준비하고 **블록 전체(SET~COMMIT)를 한 번씩** 실행 |
| D04 커서·EXPLAIN 대량 재실험 | D05 seed까지 준비한 **별도 실험 DB** | `bulk.sql` 전체 | 선택 실험. D04·D05 기본 문항은 **seed만** 사용 |
| D06 인덱스·JOIN 비교 | D05 seed까지 준비한 **별도 실험 DB** | **seed+bulk** | 실행 계획·속도는 직접 측정 |
| D07 → D08 → D10 | **원래 seed DB로 복귀** | 해당 날 seed 블록 | 이미 반영된 스냅샷. API 이벤트 재발행·재고 재차감 금지 |

기본 순서: **D02 기준 데이터 → D03 회원 → D04 글·태그 → D05 댓글·좋아요 → D07 포인트·쿠폰·상점·주문 → D08 충전 → D10 신고·감사**.

**실행 조건:** 내 테이블을 먼저 만들고 MySQL 8.4 SQL 편집기를 사용한다. 처음부터 모든 테이블이 있으면 seed 파일 전체를 한 번 실행해도 된다. 블록 실행과 전체 실행을 중복하지 않는다.

**실패·복구:** 고정 ID·고정 시각이므로 중복 실행은 오류다. 기존 앱 데이터와 섞지 않는다. 도중 오류는 `COMMIT`하지 말고 `ROLLBACK` 후 확인한다. bulk는 같은 연결에서 실행하고, 실패 시 임시 테이블과 `cte_max_recursion_depth`도 파일 끝의 문장으로 복구한다.

<details class="data-file-details">
<summary>파일별 데이터 수와 일자별 잔액 기준</summary>

- [seed.sql](seed.sql): 회원 20명·글 100건의 작은 기본 데이터. `board-server/src/main/resources/schema.sql`의 테이블·컬럼 이름을 그대로 쓴다.
- [bulk.sql](bulk.sql): D04 커서·EXPLAIN 재실험, D06 인덱스·JOIN 비교용. seed의 D05까지 넣은 별도 실험 DB에 글 20,000건·댓글 40,000건·좋아요 40,000건을 **추가**한다. seed와 합치면 글 20,100건(공개 16,080건)이다. 실행 계획·속도는 직접 측정한다.
- D03에는 잔액 컬럼이 필요 없다. D07에는 잔액이 모두 900, D08에는 회원 1·5만 1,900이고 나머지는 900이다.

</details>

## 내 설계에 맞게 조정하기

SQL의 물리 구조는 예시다. 수정한 SQL과 결과를 함께 제출하면 직접 설계의 불변식으로 확인한다.

테이블 이름·컬럼이 다르면 블록의 `INSERT INTO 테이블 (컬럼, ...)` 줄과 관련 `UPDATE`·조회 이름만 내 이름으로 바꾼다. 추가 필수 열이 있으면 열 목록·VALUES도 보완한다. 키·상태 표현까지 다르게 설계했다면 참조 값도 함께 맞춘다. 이 SQL의 물리 이름은 직접 설계의 채점 기준이 아니다.

- **생략한 열**: 테이블에 없는 열은 INSERT의 열 목록과 VALUES의 같은 위치 값을 함께 뺀다. `bulk.sql`은 VALUES 대신 SELECT의 같은 위치 식을 뺀다. 추가 필수 열은 열과 값을 함께 더한다. 행의 참조 ID·상태·시각은 그대로 맞춘다.
- **복합 키**: `post_tag(post_id, tag_id)` 또는 `post_like(post_id, member_id)`를 복합 키로 골랐다면 독립 `id` 열과 각 행의 첫 값을 뺀다. 감사 열도 생략했다면 `created_at`·`updated_at`과 해당 값을 함께 뺀다. `member_coupon`의 독립 ID를 없앴다면 이를 참조하는 `shop_order.member_coupon_id`도 내가 고른 참조 방식으로 바꾼다. 외래 키를 끄거나 중복을 무시하지 않는다.
- **카운터 없는 좋아요**: `post.like_count`를 저장하지 않으면 seed·bulk의 post INSERT에서 열과 값을 빼고, D05의 `UPDATE post ... SET like_count ...`도 실행하지 않는다. 오늘의 SQL·검증 SQL에서 `like_count`는 원본 관계를 세는 식으로 바꾼다. 관계 중복 0건, 글별 논리적 좋아요 수, API 응답이 같아야 한다. D05 seed의 좋아요 관계는 150건, bulk를 더하면 40,150건이다.
- **D07 잔액 도입**: D07 테이블 설계 순서에서 잔액을 저장하는 방식을 정하고 `member.point_balance`를 추가한다. 이 컬럼이 아직 없다면 D07 seed를 실행하기 전에 준비한다. 예시 스키마처럼 이미 있으면 다시 추가하지 않는다. 이력 합으로 잔액을 계산하는 설계라면 D07·D08의 잔액 UPDATE는 빼고 아래 합계로 논리적 기대값을 확인한다. D07에는 회원별 900, D08에는 회원 1·5가 1,900이고 나머지는 900이다.

```sql
-- 독립 id나 카운터가 없어도 LEFT JOIN의 0건을 정확히 센다.
SELECT p.id, COUNT(l.post_id) AS like_count
FROM post p LEFT JOIN post_like l ON l.post_id=p.id
GROUP BY p.id;
-- 잔액을 저장하지 않는 설계의 논리적 잔액: D07·D08 이후 확인한다.
SELECT m.id, COALESCE(SUM(l.amount),0) AS point_balance
FROM member m LEFT JOIN point_ledger l ON l.member_id=m.id
GROUP BY m.id;
```

## 넣은 뒤 확인

```sql
-- D05까지 seed만: 20 / 100 / 80 / 150. seed+bulk: 20 / 20100 / 40080 / 40150.
SELECT (SELECT COUNT(*) FROM member) AS members,
       (SELECT COUNT(*) FROM post) AS posts,
       (SELECT COUNT(*) FROM comment) AS comments,
       (SELECT COUNT(*) FROM post_like) AS likes;
-- seed만: ACTIVE 80, HIDDEN 10, DELETED 10. seed+bulk: 16080 / 2010 / 2010.
SELECT status, COUNT(*) FROM post GROUP BY status;
-- 모두 0행: 좋아요 중복·카운터 불일치. D05 이후 실행한다.
SELECT post_id, member_id, COUNT(*) FROM post_like GROUP BY post_id, member_id HAVING COUNT(*) > 1;
SELECT p.id FROM post p LEFT JOIN post_like l ON l.post_id=p.id
GROUP BY p.id,p.like_count HAVING p.like_count<>COUNT(l.post_id);
-- D07 또는 D08 블록 직후 0행: 잔액 = 부호 있는 이력 합.
SELECT m.id FROM member m LEFT JOIN point_ledger l ON l.member_id=m.id
GROUP BY m.id,m.point_balance HAVING m.point_balance<>COALESCE(SUM(l.amount),0);
```

## 로그인

`learner001@example.test`~`learner020@example.test`, 첫 회원만 ADMIN이다. 공통 비밀번호는 **`Course1234`**. Spring `BCryptPasswordEncoder`가 읽는 `$2a$` BCrypt(cost 10) 해시를 넣었다. 저장된 해시를 다시 해시하지 않는다. 실제 앱 로그인은 별도로 확인한다.
