# DB-13 SQL 예시 확인 기록

2026-10-16. `docker/mysql/init/02-practice.sql`을 일회용 MySQL 8.4 컨테이너에 복사했다. 기존 `practice` DB와 학습자 서버 코드는 변경하지 않았고, 검사 뒤 컨테이너를 제거했다.

- DB-13의 작성자 projection SQL에서 `:board_slug='dev'`, `:size_plus_one=6`으로 바인딩한 **비로그인 공개 글 구조 예시**는 6행을 반환했다. 첫 다섯 글 ID는 `145, 144, 143, 140, 138`이었다.
- 그 첫 다섯 ID를 `:page_post_ids`에 펼쳐 바인딩한 태그 일괄 SQL은 7행을 반환했다. 태그 행의 `post_id`는 모두 해당 다섯 글 안에 있었다.
- 원문 `:page_post_ids`는 JDBC/JPA/MyBatis 코드에서 ID 목록으로 펼쳐야 하는 자리표시자이며 MySQL 클라이언트에 그대로 붙여 넣어 실행할 SQL이 아니다.

이는 **SQL 예시의 문법·조회 범위 확인**이다. M1 HTTP API의 실행, 실제 한 요청의 SQL 문장 수, `size=5`와 `size=20`의 N+1 계측, 로그인 R1 전체 권한, 커서 구현, 완성 DTO 응답을 검증한 결과가 아니다. 화면의 측정 입력칸은 실행 전 빈 상태로 둔다.
