# R04 source notes

확인일 2026-10-20 (Asia/Seoul). 직접 웹 열람한 공식 1차 자료.

| URL | 절/API | 확인한 주장 | 버전/조건 및 한계 |
|---|---|---|---|
| https://dev.mysql.com/doc/refman/8.4/en/join.html | MySQL 8.4 §15.2.13.2 | JOIN 문법, LEFT NULL 확장, ON/WHERE 역할, RIGHT 대 LEFT 권고, FULL 부재 | MySQL 8.4 매뉴얼; 직접 열림 |
| https://dev.mysql.com/doc/refman/8.4/en/select.html | §15.2.13 | SELECT 절 구성, WHERE, LIMIT, alias clause 사용 | 직접 열림; 논리 순서가 물리 실행 순서라는 의미 아님 |
| https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html | §14.19.3 | ONLY_FULL_GROUP_BY, 함수 종속성, 별칭 | 직접 열림 |
| https://dev.mysql.com/doc/refman/8.4/en/aggregate-functions.html | §14.19.1 | COUNT(*) vs COUNT(expr) | 직접 열림 |
| https://dev.mysql.com/doc/refman/8.4/en/subquery-optimization-with-exists.html | §10.2.2.3 | EXISTS 전략 최적화 설명 | 직접 열림; EXISTS의 중복 반환 여부를 증명하는 의미론 페이지와는 구분 |
| https://dev.mysql.com/doc/refman/8.4/en/comparison-operators.html | §14.4 | NULL/UNKNOWN comparison | 직접 열람 호출은 안 함; 보고서 개념 검토 보조 출처 |
| https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html | §15.2.7.2 | row alias, any PK/UNIQUE conflict, affected-row modes | 직접 열림 |
| https://dev.mysql.com/doc/refman/8.4/en/commit.html | §15.3.1 | autocommit, transaction control, ROW_COUNT reference | 직접 열림 |
| https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html | §17.20.5 | statement vs transaction rollback error cases | 직접 열림 |
| https://dev.mysql.com/doc/refman/8.4/en/mysql-command-options.html | §6.5.1.1 | safe-updates is client option | 직접 열림; exact key/index/limit conditions remain context-dependent |
| https://dev.mysql.com/doc/refman/8.4/en/update.html | §15.2.17 | UPDATE without WHERE semantics; safe update context | 직접 열람 호출은 안 함 |
| https://dev.mysql.com/doc/refman/8.4/en/delete.html | §15.2.2 | DELETE without WHERE semantics | 직접 열람 호출은 안 함 |
| https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html | JdbcTemplate API | PreparedStatementCreator, query, RowMapper | 7.0.9, 직접 열림 |
| https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html | Java SE 21 | setLong and parameter index | 직접 열림 |
| https://dev.mysql.com/doc/connector-j/en/connector-j.html | Connector/J docs | 버전/호환성 관련 확인 시도 | 2026-10-20 web tool `Internal Error`, 확인 실패; Connector/J 9.7.0 주장 미확인 |

대상 원문 두 사본은 `cmp`로 동일함을 확인했다. 보고서에는 출처 접근 여부와 실제 실행 여부를 구분했다. 로컬 SQL, Java, 서버는 실행하지 않았다.
