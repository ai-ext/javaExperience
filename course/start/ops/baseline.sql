-- 장치용 예시. 학습자는 예약·대상·지급의 실제 식별 집합/금액/상태별 SQL을 별도로 작성한다.
SELECT COUNT(*), COALESCE(SUM(amount),0) FROM ops_marker;
SELECT id,amount FROM ops_marker ORDER BY id;
SHOW CREATE TABLE ops_marker;
