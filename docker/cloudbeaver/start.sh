#!/bin/sh
# CloudBeaver 시작 스크립트 — compose.yaml이 이 폴더를 /config 에 읽기 전용으로 마운트하고 이 파일로 시작한다.
# 처음 뜰 때만(작업 공간 볼륨이 비어 있을 때) 미리 만든 DB 연결(data-sources.json)을 작업 공간에 복사한다.
# 작업 공간에 바로 마운트하지 않는 이유: CloudBeaver가 처음 접속할 때 이 파일을 다시 쓰며 비밀번호를 암호화 저장소로 옮긴다(레포 파일이 바뀐다).
# 연결 설정을 바꿨다면 작업 공간을 비우고 다시 만든다:
#   docker compose rm -sf cloudbeaver && docker volume rm <프로젝트이름>_cloudbeaver-data && docker compose up -d
set -e
TARGET=/opt/cloudbeaver/workspace/GlobalConfiguration/.dbeaver
if [ ! -f "$TARGET/data-sources.json" ]; then
  mkdir -p "$TARGET"
  cp /config/data-sources.json "$TARGET/data-sources.json"
  echo "[javaExperience] 미리 만든 DB 연결(community·practice)을 넣었다"
fi
cd /opt/cloudbeaver
exec ./run-server.sh
