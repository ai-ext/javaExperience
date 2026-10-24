# 복사해서 붙여 넣는 더미 SQL

- [seed.sql](seed.sql): 회원 20명·글 100건의 작은 기본 데이터. `board-server/src/main/resources/schema.sql`의 테이블·컬럼 이름을 그대로 쓴다.
- [bulk.sql](bulk.sql): D04 커서·EXPLAIN 재실험, D06 인덱스·JOIN 비교용. seed의 D05까지 넣은 별도 실험 DB에 글 20,000건·댓글 40,000건·좋아요 40,000건을 **추가**한다. seed와 합치면 글 20,100건(공개 16,080건)이다. 실행 계획·속도는 직접 측정한다.

## 붙여 넣는 순서

내 프로젝트의 테이블을 만든 뒤 MySQL 8.4 SQL 편집기에서 실행한다. D01은 연결만 확인한다. 빈 학습용 테이블에서 시작해 `seed.sql`의 **해당 블록 전체(SET~COMMIT)를 한 번씩**, D02 기준 데이터 → D03 회원 → D04 글·태그 → D05 댓글·좋아요 → D07 포인트·쿠폰·상점·주문 → D08 충전 → D10 신고·감사 순서로 붙인다. 처음부터 모든 테이블이 있으면 파일 전체를 실행해도 된다.

테이블 이름·컬럼이 다르면 블록의 `INSERT INTO 테이블 (컬럼, ...)` 줄과 관련 `UPDATE`·조회 이름만 내 이름으로 바꾼다. 추가 필수 열이 있으면 열 목록·VALUES도 보완한다. 키·상태 표현까지 다르게 설계했다면 참조 값도 함께 맞춘다. 이 SQL의 물리 이름은 직접 설계의 채점 기준이 아니다.

D04·D05 문항은 **seed만**, D06은 **seed+bulk** 기준이다. D04의 대량 재실험은 D05 블록까지 준비한 별도 DB에서 bulk를 실행한다. D07 이후에는 원래 seed DB로 돌아와 해당 날 블록을 이어 넣는다. 이미 반영된 스냅샷이므로 API 이벤트를 재발행하거나 재고를 다시 차감하지 않는다. D03 잔액은 0, D07에는 모두 900, D08에는 회원 1·5만 1,900이고 나머지는 900이다.

고정 ID·고정 시각을 쓰므로 중복 실행은 오류다. 기존 앱 데이터와 섞지 않는다. 도중 오류는 `COMMIT`하지 말고 `ROLLBACK` 후 확인한다. bulk는 같은 연결에서 실행하고, 실패 시 임시 테이블과 `cte_max_recursion_depth`도 파일 끝의 문장으로 복구한다.

## 로그인

`learner001@example.test`~`learner020@example.test`, 첫 회원만 ADMIN이다. 공통 비밀번호는 **`Course1234`**. Spring `BCryptPasswordEncoder`가 읽는 `$2a$` BCrypt(cost 10) 해시를 넣었다. 저장된 해시를 다시 해시하지 않는다. 실제 앱 로그인은 별도로 확인한다.

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
GROUP BY p.id,p.like_count HAVING p.like_count<>COUNT(l.id);
-- D07 또는 D08 블록 직후 0행: 잔액 = 부호 있는 이력 합.
SELECT m.id FROM member m LEFT JOIN point_ledger l ON l.member_id=m.id
GROUP BY m.id,m.point_balance HAVING m.point_balance<>COALESCE(SUM(l.amount),0);
```
