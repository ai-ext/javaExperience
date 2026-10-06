# 실습 DB 이미지 — init/ 의 dump(초기 데이터)를 이미지에 넣는다. DB를 처음 만들 때 이름 순서로 한 번만 적재된다.
# 바인드 마운트 대신 COPY를 쓰는 이유: Docker Desktop은 "파일 공유"에 등록된 폴더만 마운트할 수 있어서,
# 레포를 그 밖(예: ~/IdeaProjects)에 clone하면 "path is not shared" 오류로 DB가 안 뜬다. COPY는 그 설정과 무관하다.
# init/ 을 바꿨다면: docker compose down -v && docker compose up -d --build
FROM mysql:8.4
COPY init/ /docker-entrypoint-initdb.d/
