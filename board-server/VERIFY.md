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

## D01-4

`local` 프로파일로 기동하고 요청 3건을 동시에 보냈다. 요청마다 `X-Request-Id`를 달리 줬고, `DispatcherServlet` 로그를 DEBUG로 켜서 요청 안의 로그 줄을 만들었다.

```
$ tools/course/gradle-docker.sh board-server bootRun \
    --args="--spring.profiles.active=local --logging.level.org.springframework.web.servlet.DispatcherServlet=DEBUG"
$ for i in 1 2 3; do curl -s -o /dev/null -H "X-Request-Id: req-$i" localhost:8080/actuator/health & done; wait
... DEBUG [req-1] [http-nio-8080-exec-1] o.s.web.servlet.DispatcherServlet : GET "/actuator/health", parameters={}
... DEBUG [req-1] [http-nio-8080-exec-1] o.s.web.servlet.DispatcherServlet : Completed 200 OK
... DEBUG [req-2] [http-nio-8080-exec-2] o.s.web.servlet.DispatcherServlet : GET "/actuator/health", parameters={}
... DEBUG [req-2] [http-nio-8080-exec-2] o.s.web.servlet.DispatcherServlet : Completed 200 OK
... DEBUG [req-3] [http-nio-8080-exec-3] o.s.web.servlet.DispatcherServlet : GET "/actuator/health", parameters={}
... DEBUG [req-3] [http-nio-8080-exec-3] o.s.web.servlet.DispatcherServlet : Completed 200 OK
$ curl -i localhost:8080/actuator/health        # 헤더 없이
HTTP/1.1 200
X-Request-Id: d7d72884-12b1-4475-8674-2525718ffbc7
```

## D03-6

compose의 MySQL과 `local` 프로파일 bootRun(포트 8082)을 띄우고, `127.0.0.1:8765`에서 서빙한 HTML의 `fetch`로 로그인했다.
브라우저는 gstack browse를 썼다.

```
$ curl -si -X OPTIONS localhost:8082/api/auth/login -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST'
HTTP/1.1 200
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
$ curl -si -X OPTIONS localhost:8082/api/auth/login -H 'Origin: http://evil.example' -H 'Access-Control-Request-Method: POST' | head -1
HTTP/1.1 403
$ (127.0.0.1:8765 페이지에서) fetch('http://localhost:8082/api/auth/login', {method:'POST', ...})
status=200 tokenType=Bearer expiresIn=3600
$ browse console --errors
(no console errors)
```
