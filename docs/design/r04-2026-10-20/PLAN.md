# R04 SQL 개념 보강 계획

초기 실행 전 계획이다. 현재 구현·실행·브라우저 확인 범위는 VERIFICATION.md를 따른다. 원문 전체 완료를 뜻하지 않는다.

원문351줄을전문검토했다. /Users/ds/research/java-spring/R04-sql-crud-join.md 와현재repo원문은동일바이트다. 다른프로젝트리서치dssd-repos의R04는대상이아니다. 원문13fence(sql7/bash2/Java1/Kotlin1/yaml1/mermaid1)를행시작기준으로추출해들여쓴목록코드를보존했다.

1. 원문SQL7/Java원문및외부study schema/seed사본출처확인 → 원문SHA·전체HTML/text/code/anchor/map기준을고정한다.
2. R03에서검증한공식portableMySQL8.4.11로매번새private datadir/socket인스턴스만사용 → 기존사용자DB·3306·설정·Docker를사용하지않는다. SQL사본의DROP을전달하기전에실제@@datadir/socket/PID/네트워크조건을검증한다.
3. 원문SHOW/DESCRIBE/정렬/LIMIT/INNER·LEFT·RIGHT·CROSS·SELF/ON·EXISTS/합계/GROUPHAVING/원문DMLrollback을실행 → 관측값과추가fixture를분리한다. ROW_COUNT()직전에추가writerSELECT를넣지않는다. 비정렬결과의실측순서를보장순서로표시하지않는다.
4. 원문OrderReadRepository는수정없이별도JDK21/Spring7.0.9/ConnectorJ9.7.0fixture로컴파일·실행경로를확인 → Boot앱·Java25·원문datasource설정·HTTP와구분한다. Java25는현재설치목록에없다. JDBC에TCP가필요하면새인스턴스전용127.0.0.1임시port/새임시root암호/암호화연결만사용하고기존서비스포트/인증정보를읽지않는다. 이초안당시에는미실행이었다. 최종기록은VERIFICATION.md에구분한다.
5. 추가NULL/COUNT/LEFT WHERE/동금액DISTINCT함정/NOTIN/UPSERT고유키·영향행/autocommit·rollback/ONLY_FULL_GROUP_BY/별칭/safe-updates를실측 → 논리처리와물리계획·사전SELECT와동시성보장을구분한다.
6. Luna/OpenAI공식근거+메인실측대조 → 실제imagegen/좁은UI위임/기존원문보존/브라우저두크기/필수감사/독립리뷰. 이초안당시실행·이미지·UI는미완료였고최종기록을별도로남긴다.
