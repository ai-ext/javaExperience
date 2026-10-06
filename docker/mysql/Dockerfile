# 실습 DB 이미지 — DB 두 개를 한 컨테이너에 만든다.
#   community : 시나리오(따라 만들기)용. 거의 빈 상태에서 여러분이 API로 데이터를 만든다(앱 기본 연결)
#   practice  : 학습용. 글 145·좋아요 568 등 함정이 섞인 더미 데이터(practice 프로파일, practice/MISSIONS.md)
# 스키마는 sql/schema.sql 하나를 두 DB에 각각 적용한다(USE를 앞에 붙여서). 처음 뜰 때만 이름 순서대로 실행된다.
# 바인드 마운트 대신 COPY를 쓰는 이유: Docker Desktop(macOS)은 파일 공유에 등록된 폴더만 마운트할 수 있어 환경에 따라 실패한다.
FROM mysql:8.4
COPY sql/ /tmp/sql/
RUN set -e; D=/docker-entrypoint-initdb.d; \
    cp /tmp/sql/00-practice-db.sql $D/00-practice-db.sql; \
    { echo 'USE community;'; cat /tmp/sql/schema.sql; }        > $D/10-community-schema.sql; \
    { echo 'USE community;'; cat /tmp/sql/scenario-seed.sql; } > $D/11-community-seed.sql; \
    { echo 'USE practice;';  cat /tmp/sql/schema.sql; }        > $D/20-practice-schema.sql; \
    { echo 'USE practice;';  cat /tmp/sql/practice-seed.sql; } > $D/21-practice-seed.sql
