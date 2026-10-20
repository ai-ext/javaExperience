# DB-08~11 격리 MySQL 확인 기록

2026-10-16. 이 기록은 **격리된 성능 fixture의 단일 실행**이며 `GET /api/me/likes` 앱 API나 기본 50만 행 fixture의 성능 결과가 아니다.

- 환경: Docker `mysql:8.4`, `javaexperience_perf`, `post_like` 합성 100,000행, 회원 12의 좋아요 2,000행.
- 시작: `PERF_ROW_COUNT=100000 tools/db-perf-fixture.sh up`. 시작 전 전용 컨테이너가 없음을 확인했다.
- 공통 조회: `post_like AS l`, `l.member_id = 12`, `ORDER BY l.created_at DESC, l.id DESC`, `LIMIT 11`.
- 인덱스 추가 전 `EXPLAIN`: `key=uq_post_like_member_post`, 추정 `rows=2000`, `Extra=Using filesort`. `EXPLAIN ANALYZE` TREE의 인덱스 조회 노드에서 `actual rows=2000`, `loops=1`; 뒤에 Sort 노드가 있었다.
- `CREATE INDEX ix_post_like_member_created ON post_like (member_id, created_at, id)`와 `ANALYZE TABLE post_like` 후 `EXPLAIN`: `key=ix_post_like_member_created`, 추정 `rows=2000`, `Extra=Backward index scan`. `EXPLAIN ANALYZE` TREE의 역방향 인덱스 조회 노드는 `actual rows=11`, `loops=1`이었고 앞서 보인 Sort 노드는 없었다.
- 동일 SELECT의 첫 11개 좋아요 ID는 전후 모두 `94886, 94836, 94986, 94936, 95086, 95036, 95186, 95136, 95286, 95236, 95386`이었다. 이 ID는 이번 합성 fixture의 실행값일 뿐 학습자 화면의 고정 기대값이 아니다.
- `ALTER INDEX ... INVISIBLE` 후 `SHOW INDEX`의 `Visible=NO`, `EXPLAIN`의 `key=uq_post_like_member_post`, `Extra=Using filesort`를 확인했다. `VISIBLE` 복원 후 `Visible=YES`를 확인했다. 마지막 `DROP INDEX`와 `ANALYZE TABLE` 뒤에는 기본 계획으로 돌아왔다.
- 검증 끝에 `tools/db-perf-fixture.sh down`으로 전용 컨테이너를 제거했다. 기본 `practice` DB는 건드리지 않았다.

실행 시간은 캐시·워밍업·하드웨어·통계에 따라 달라지는 단일 측정이므로 이 기록에 전후 속도 개선 수치로 적지 않는다. 이미지 시안과 실제 DOM의 동일 뷰포트 픽셀 대조, 브라우저 조작, 50만 행 기본 fixture, 실제 Spring Boot API·권한 JOIN 실행은 아직 확인하지 않았다.
