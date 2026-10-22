# VERIFY

자동 테스트로 만들기 어려운 `done` 항목을 실제로 실행한 기록이다. 실행 환경은 호스트에 JDK가 없어
`tools/course/gradle-docker.sh`(eclipse-temurin:21-jdk 컨테이너, `--network host`)를 쓴다.

## D01-2

`docker compose up -d` 뒤 `bootRun`으로 기동하고 헬스를 호출했다.

```
$ cd board-server && docker compose up -d --wait
 Container board-server-mysql-1 Healthy
$ tools/course/gradle-docker.sh board-server bootRun
... com.zaxxer.hikari.HikariDataSource : HikariPool-1 - Start completed.
$ curl -i localhost:8080/actuator/health
HTTP/1.1 200
{"groups":["liveness","readiness"],"status":"UP"}
```

## D01-3

compose의 MySQL을 띄운 상태에서 실행했다 (`SERVER_PORT`, `DB_*`는 스크립트가 컨테이너로 전달한다).

```
$ SERVER_PORT=8081 tools/course/gradle-docker.sh board-server bootRun --args=--spring.profiles.active=local
... BoardApplication : The following 1 profile is active: "local"
... TomcatWebServer  : Tomcat started on port 8081 (http) with context path '/'
$ curl localhost:8081/actuator/health   -> 200   (yml의 server.port 8080보다 환경 변수가 이긴다)
$ curl localhost:8081/actuator/env      -> 404
$ curl localhost:8080/actuator/health   -> 연결 실패 (8080은 열리지 않았다)
```

```
$ tools/course/gradle-docker.sh board-server bootRun --args=--spring.profiles.active=prod   (DB_PASSWORD 없음)
... The following 1 profile is active: "prod"
... PlaceholderResolutionException: Could not resolve placeholder 'DB_PASSWORD' in value "${DB_PASSWORD}"
BUILD FAILED
```
