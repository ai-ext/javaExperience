# 1단계 출발 자료

1단계(D01~D10)는 빈 프로젝트에서 [명세서 v2](../spec-v2.md)의 서버를 직접 만든다. 이 폴더에는 출발에 필요한 것만 있다. 정답 코드는 각 일자 페이지의 순서 칸 안에 있다.

| 파일 | 쓰는 곳 | 내 프로젝트에 둘 위치 |
|---|---|---|
| [compose.yaml](compose.yaml) | MySQL 8.4·Redis 7.4·WireMock·Toxiproxy | 프로젝트 루트 `compose.yaml` |
| [toxiproxy.json](toxiproxy.json) | Toxiproxy 프록시 정의(`pg` → WireMock) | 프로젝트 루트 `toxiproxy.json` |
| [wiremock/mappings/pg-approve.json](wiremock/mappings/pg-approve.json) | PG 승인 모의 응답 | `src/test/resources/wiremock/mappings/` |
| [wiremock/mappings/pg-approve-declined.json](wiremock/mappings/pg-approve-declined.json) | 금액 999000은 항상 거절 | `src/test/resources/wiremock/mappings/` |

## 1. 준비물

- JDK 21
- Colima(docker CLI 런타임). 처음 한 번 `colima start`로 띄운다
- IntelliJ IDEA

## 2. start.spring.io 설정값

[start.spring.io](https://start.spring.io)에서 아래 값으로 프로젝트를 만든다. 값은 정답 서버 `board-server/build.gradle`과 같다.

| 항목 | 값 |
|---|---|
| Project | Gradle - Groovy |
| Language | Java |
| Spring Boot | 4.1.1 (목록에 없으면 4.1.x 중 최신을 고르고 `build.gradle`의 버전을 `4.1.1`로 고친다) |
| Group | `com.example` |
| Artifact / Name | `board` |
| Package name | `com.example.board` |
| Packaging | Jar |
| Configuration | YAML |
| Java | 21 |

**처음 넣을 의존성(D01 순서 ①)**: Spring Web, Spring Boot Actuator, Validation, Lombok 네 개만 넣는다. Boot 4에서는 Spring Web이 `spring-boot-starter-webmvc`로 들어간다.

나머지 의존성은 그 기능을 만드는 날 `build.gradle`에 직접 추가한다. 미리 넣으면 아직 설정하지 않은 자동 구성(예: DB 연결)이 기동을 막는다.

| 날·순서 | 추가할 의존성 (`build.gradle`) |
|---|---|
| D01 ② | `spring-boot-starter-data-jpa`, `mysql-connector-j`(runtimeOnly), 테스트용 `spring-boot-starter-data-jpa-test`·`spring-boot-testcontainers`·`testcontainers-junit-jupiter`·`testcontainers-mysql` |
| D03 ① | `spring-boot-starter-security`, 테스트용 `spring-boot-starter-security-test` |
| D03 ④ | `jjwt-api`·`jjwt-impl`·`jjwt-jackson` 0.13.0 |
| D06 ① | `mybatis-spring-boot-starter` 4.1.0 |
| D08 ① | `httpclient5`(Apache HttpClient 5), 테스트용 `testcontainers-toxiproxy` |
| D09 ① | `spring-boot-starter-data-redis` |
| D10 ④ | `spring-boot-starter-aspectj` |
| D10 ⑤ | `poi-ooxml` 5.5.1 |

## 3. compose 실행

`compose.yaml`, `toxiproxy.json`을 프로젝트 루트에, 스텁 두 개를 `src/test/resources/wiremock/mappings/`에 복사한 뒤 프로젝트 루트에서 실행한다.

```bash
docker compose up -d --wait
docker compose ps
```

| 서비스 | 내 컴퓨터 포트 | 쓰기 시작하는 날 | 서버 설정 값 |
|---|---|---|---|
| mysql | 13310 | D01 ② | `jdbc:mysql://localhost:13310/board`, 계정 `board` / 비밀번호는 환경 변수 `DB_PASSWORD`(compose 기본값 `board`) |
| redis | 16379 | D09 ① | `spring.data.redis.port=16379` |
| wiremock | 18080 | D08 ① | 테스트에서 스텁 확인용 |
| toxiproxy | 8474(관리 API), 18666(PG 프록시) | D08 ① | `board.pg.base-url=http://localhost:18666` |

- 포트·계정은 정답 서버(`board-server`)와 같다. 그래야 순서 칸의 정답 설정을 그대로 붙여도 연결된다. 그래서 `board-server/compose.yaml`과 동시에 띄우지 않는다.
- D01 ②의 만들 파일에 `compose.yaml`이 있다. 이 파일을 그대로 복사해 써도 되고, MySQL만 먼저 쓰고 D08 ①에 WireMock·Toxiproxy를, D09 ①에 Redis를 옮겨 붙여도 된다. 완료 조건은 어느 쪽이든 같다.
- 지연을 주입할 때는 `curl -X POST localhost:8474/proxies/pg/toxics -d '{"type":"latency","attributes":{"latency":5000}}'`, 지울 때는 `curl -X DELETE localhost:8474/proxies/pg/toxics/latency_downstream`.
- 멈출 때는 `docker compose down`, 데이터까지 지울 때는 `docker compose down -v`.

## 4. 첫날로 가기

- Java가 처음이면 [D00 워밍업](../spring/D00.md)(선택)부터 한다.
- 준비가 끝났으면 [D01 프로젝트 뼈대](../spring/D01.md)의 오늘 순서 ①부터 시작한다.
- 전체 일정은 [일자 목록](../spring/README.md)에 있다.
