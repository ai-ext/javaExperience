# CloudBeaver(웹 DBeaver) 이미지 — 미리 만든 DB 연결과 시작 스크립트를 넣는다(마운트 대신 COPY인 이유는 docker/mysql/Dockerfile 참고).
FROM dbeaver/cloudbeaver:24.3.1
COPY data-sources.json start.sh /config/
ENTRYPOINT ["/bin/sh", "/config/start.sh"]
