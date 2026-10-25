# R03 스키마·타입·제약 개념 보강 계획

원문217줄을전문검토했다. ds_practice원본은현재저장소에없다는knowledgeREADME안내를읽고원래학습공간의schema.sql/seed.sql을읽어SHA사본을보관했다. 저장소practice정답/기존DB와구별한다.

1. 원문SQL/bash추출/SHA·외부학습schema/seed출처 → 실제SQL과기대값/추가probe를구별한다.
2. macOS15.6.1arm64에서공식MySQL8.4 portable배포본의독립실행경로확인 → 기존mysqld/Docker/사용자DB·전역설정변경없이새private datadir/Unixsocket/skipnetworking조건만사용한다. 아직실행한결과로표시하지않는다.
3. 독립instance가확인되면사본을적재해원문SHOW/복사DDL/CHECK실패/DECIMALvsDOUBLE/가격+1rollback을실행 → 추가varchar문자·바이트/제약/PKFK/default/DDL암묵commit/시간/키폭probe와구분한다. 원래서버·practice데이터에접속하거나seed를변경하지않는다.
4. Luna/OpenAI공식근거와메인출처·실제결과대조 → 실제imagegen·좁은UI·원문보존·브라우저·필수감사·독립리뷰. MySQL미실행이면H2를MySQL결과로대체하지않는다.
