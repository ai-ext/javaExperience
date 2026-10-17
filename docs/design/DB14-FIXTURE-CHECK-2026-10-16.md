# DB-14 격리 fixture 확인 기록

2026-10-16. 전용 MySQL 8.4 fixture를 `PERF_ROW_COUNT=100000`으로 새로 시작해 DB-14 원문의 조회·계획·인덱스 추가·제거를 확인했다. 시작 전 전용 컨테이너는 없었고, 검증 후 `tools/db-perf-fixture.sh down`으로 제거했다. 기존 `practice` DB는 변경하지 않았다.

- 선택 DB는 `javaexperience_perf`, 테이블은 7개, `information_schema.key_column_usage`의 FK 참조는 8개였다. `board-03`의 ID는 이 fixture에서 3이었다.
- 기준 게시글 SELECT와 board/post/member JOIN 응답 SELECT는 각각 20행을 반환했다. 기준 첫 다섯 글 ID는 `19983, 19963, 19943, 19923, 19903`이었다. 이는 이번 합성 데이터의 관찰값이며 학습자 화면의 선입력 정답이 아니다.
- 인덱스 전 `EXPLAIN`은 `ix_post_board`를 선택했고 `Using where; Using filesort`를 표시했다.
- `ix_post_board_status_deleted_created (board_id,status,deleted_at,created_at,id)`를 추가하고 `ANALYZE TABLE post` 뒤 같은 조회에서 `key=ix_post_board_status_deleted_created`, `Using index condition; Backward index scan`을 확인했다. 두 상태 모두 같은 읽기 SELECT의 `EXPLAIN ANALYZE` TREE를 실행했다.
- 인덱스 전후의 게시글 ID·순서와 JOIN 응답 튜플·순서가 같았다. 마지막에 실험 인덱스를 `DROP`하고 통계를 갱신하자 기본 key·정렬 표시로 돌아왔다. 제거 후에도 ID 순서가 같고 실험 인덱스가 없음을 확인했다.

이는 **10만 행 합성 fixture의 단일 SQL 실험**이다. 기존 문서에 따로 있는 50만 행 관찰, 실제 Spring Boot HTTP API, 전체 visibility/R1 권한, DBeaver/CloudBeaver UI 조작, 이미지 시안과 DOM의 동일 뷰포트·모바일 비교를 대신하지 않는다. 실행 시간 한 번의 차이로 성능 향상 수치를 주장하지 않는다.
