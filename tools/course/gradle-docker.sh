#!/usr/bin/env bash
# 호스트에 JDK가 없어서 Gradle을 컨테이너로 실행한다. 사용법: gradle-docker.sh <프로젝트 디렉터리> <gradle 인자...>
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "사용법: $0 <프로젝트 디렉터리> [gradle 인자...]" >&2
  exit 2
fi

dir=$(cd "$1" && pwd -P) || { echo "디렉터리를 찾을 수 없다: $1" >&2; exit 2; }
shift

# 런타임의 파일 공유 설정에 프로젝트 경로를 포함해야 한다. HOME 내부인지로 판단하지 않는다.
# /var/run/docker.sock은 Docker 데몬 쪽 표준 소켓이다(호스트 CLI의 소켓 경로와 다를 수 있다).
# 아래 컨테이너 실행은 host networking이 필요하다. Docker Desktop에서는 해당 기능을 켜야 한다.
# 런타임 설정과 무관한 기본 방법: 호스트 JDK 21의 JAVA_HOME을 지정하고 프로젝트에서 ./gradlew 실행.

# 값 없는 -e는 호스트에 설정된 변수만 전달한다 (bootRun 환경 변수 검증용)
# 프로젝트와 같은 경로로 마운트해야 Testcontainers가 띄운 형제 컨테이너의 bind mount 경로도 맞는다
exec docker run --rm --network host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v jx-gradle:/root/.gradle \
  -v "$dir":"$dir" -w "$dir" \
  -e SERVER_PORT -e DB_URL -e DB_USERNAME -e DB_PASSWORD \
  eclipse-temurin:21-jdk \
  ./gradlew --console=plain "$@"
