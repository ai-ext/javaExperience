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
