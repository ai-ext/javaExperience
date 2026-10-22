#!/usr/bin/env bash
# 호스트에 JDK가 없어서 Gradle을 컨테이너로 실행한다. 사용법: gradle-docker.sh <프로젝트 디렉터리> <gradle 인자...>
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "사용법: $0 <프로젝트 디렉터리> [gradle 인자...]" >&2
  exit 2
fi

dir=$(cd "$1" && pwd -P) || { echo "디렉터리를 찾을 수 없다: $1" >&2; exit 2; }
shift

# Colima는 $HOME만 VM에 공유하므로 밖의 경로는 마운트가 비어 보인다
home=$(cd "$HOME" && pwd -P)
case "$dir/" in
  "$home"/*) ;;
  *) echo "오류: $dir 는 \$HOME($home) 밖이다. Colima는 \$HOME만 마운트한다." >&2; exit 2 ;;
esac

# 프로젝트와 같은 경로로 마운트해야 Testcontainers가 띄운 형제 컨테이너의 bind mount 경로도 맞는다
exec docker run --rm --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v jx-gradle:/root/.gradle \
  -v "$dir":"$dir" -w "$dir" \
  -e TESTCONTAINERS_RYUK_DISABLED=true \
  eclipse-temurin:21-jdk \
  ./gradlew --console=plain "$@"
