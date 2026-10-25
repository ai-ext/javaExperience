# 1단계 출발 자료

1단계(D01~D10)는 빈 프로젝트에서 [명세서 v2](../spec-v2.md)의 서버를 직접 만든다. 이 폴더에는 출발에 필요한 것만 있다. 구현 예시 코드는 각 일자 페이지의 순서 칸 안에 있다.

## 1. 준비물

- JDK 21
- Docker 런타임. 실행한 뒤 `docker info`와 `docker compose version`이 성공하는지 확인한다
- IDE 선택 사항: IntelliJ IDEA, VS Code 또는 Eclipse. 어느 IDE든 Gradle 프로젝트를 가져오고 JDK 21·annotation processing·실행 profile을 맞춘다. D21의 스레드 중단 관찰은 디버거의 thread suspend를 사용한다.

Windows에서는 WSL2의 Linux 작업 경로에서 `./gradlew`, Docker CLI, Python 3 실습을 진행한다. WSL 안에서 `java -version`·`docker info`·`docker compose version`을 확인하고 LF 줄바꿈과 `gradlew` 실행 권한을 유지한다. PowerShell의 환경 변수·프로세스·signal 명령은 아래 bash 예시와 다르다.

## 2. start.spring.io 설정값

[start.spring.io](https://start.spring.io)에서 아래 값으로 프로젝트를 만든다. 값은 구현 예시 서버 `board-server/build.gradle`과 같다.

| 항목 | 값 |
|---|---|
| Project | Gradle - Groovy |
| Language | Java |
| Spring Boot | 4.1.1 (목록에 없으면 4.1.x 중 최신을 고르고 `build.gradle`의 버전을 `4.1.1`로 고친다) |
| Group | `com.example` |
| Artifact / Name | `board` |
| Package name | `com.example.board` |
| Packaging | Jar |
| Configuration | YAML 또는 Properties |
| Java | 21 |

**받은 뒤 바꿀 것**

- YAML을 선택하면 생성된 `src/main/resources/application.yaml`을 `application.yml`로 바꿔 예시와 맞춘다. Properties를 선택하면 `application.properties`를 그대로 사용한다. 설정 예시의 `yml | properties` 탭에서 같은 키·값을 확인한다. 프로파일은 `application-local.properties`·`application-prod.properties`·`application-test.properties`로 나눌 수 있다. 같은 위치에는 한 형식만 둔다.
- 구현 예시의 `ApplicationYmlTest`·`ProfileConfigTest`·`LocalProfileSeedTest`는 YAML 원문을 읽는 예시다. properties를 쓰면 같은 키·값과 프로파일 적용을 Spring Environment 또는 Properties 로딩으로 검증한다. 채점은 파일 확장자나 YAML 문서 개수가 아니라 동등한 설정·실행 결과를 기준으로 한다.
- Artifact를 `board`로 두면 `settings.gradle`의 `rootProject.name`과 `spring.application.name`이 `board`다. 구현 예시는 `board-server`다. 동작에는 차이가 없으니 그대로 둬도 되고, 구현 예시와 맞추려면 두 곳을 `board-server`로 바꾼다.
- 생성된 `build.gradle`에는 `spring-boot-starter-actuator-test`·`spring-boot-starter-validation-test` 같은 테스트 스타터가 더 들어 있을 수 있다. 동작에는 영향이 없으니 그대로 둔다.

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

먼저 파일을 복사하고, 그다음 의존 서비스를 기동한다.

| 파일 | 쓰는 곳 | 내 프로젝트에 둘 위치 |
|---|---|---|
| [compose.yaml](compose.yaml) | MySQL 8.4·Redis 7.4·WireMock·Toxiproxy | 프로젝트 루트 `compose.yaml` |
| [toxiproxy.json](toxiproxy.json) | Toxiproxy 프록시 정의(`pg` → WireMock) | 프로젝트 루트 `toxiproxy.json` |
| [wiremock/mappings/pg-approve.json](wiremock/mappings/pg-approve.json) | PG 승인 모의 응답 | `src/test/resources/wiremock/mappings/` |
| [wiremock/mappings/pg-approve-declined.json](wiremock/mappings/pg-approve-declined.json) | 금액 999000은 항상 거절 | `src/test/resources/wiremock/mappings/` |

D01 ①에서 프로젝트를 만든 뒤, **파일 4개를 먼저 복사하고** 프로젝트 루트에서 실행한다. `compose.yaml`, `toxiproxy.json`은 프로젝트 루트에, 스텁 두 개는 `src/test/resources/wiremock/mappings/`에 둔다.

```bash
docker compose up -d --wait
docker compose ps
curl -s localhost:8474/proxies   # "pg" 프록시가 보여야 한다
```

- 순서가 중요하다. compose는 `./toxiproxy.json`과 `./src/test/resources/wiremock`을 그대로 마운트하므로, 복사하기 전에 띄우면 둘이 **빈 디렉터리**로 생긴다. 그러면 Toxiproxy에 `pg` 프록시가 없고(`curl localhost:8474/proxies` → `{}`), 그 뒤 `cp`도 `Is a directory`로 실패한다.
- 이미 그렇게 됐다면 `docker compose down` → 생긴 빈 디렉터리 `toxiproxy.json`을 지우고(`rmdir toxiproxy.json`) → 파일 4개를 다시 복사한 뒤 → `docker compose up -d --wait`로 다시 띄운다.

| 서비스 | 내 컴퓨터 포트 | 쓰기 시작하는 날 | 서버 설정 값 |
|---|---|---|---|
| mysql | 13310 | D01 ② | `jdbc:mysql://localhost:13310/board`, 계정 `board` / 비밀번호는 환경 변수 `DB_PASSWORD`(compose 기본값 `board`) |
| redis | 16379 | D09 ① | `spring.data.redis.port=16379` |
| wiremock | 18080 | D08 ① | 테스트에서 스텁 확인용 |
| toxiproxy | 8474(관리 API), 18666(PG 프록시) | D08 ① | `board.pg.base-url=http://localhost:18666` |

- 포트·계정은 구현 예시 서버(`board-server`)와 같다. 그래야 순서 칸의 구현 예시 설정을 그대로 붙여도 연결된다. 그래서 `board-server/compose.yaml`과 동시에 띄우지 않는다.
- 컨테이너 간 연결은 compose 서비스 이름(`mysql`, `redis`, `wiremock`)을 쓰고, 호스트에서 실행한 앱은 공개된 `localhost` 포트를 쓴다. 다른 Docker 런타임에서 Testcontainers가 실패하면 먼저 `docker info`·`docker compose ps`·소켓 접근 권한과 테스트 컨테이너의 연결 주소를 확인한다. 특정 런타임의 호스트 이름이나 `/var/run/docker.sock`이 모든 런타임에서 같다고 가정하지 않는다. 호스트 JDK 21의 `./gradlew`가 기본 실행 경로다.
- D01 ②부터 이 `compose.yaml`을 쓴다. 그대로 복사해 써도 되고, MySQL만 먼저 쓰고 D08 ①에 WireMock·Toxiproxy를, D09 ①에 Redis를 옮겨 붙여도 된다. 완료 조건은 어느 쪽이든 같다. 나눠 붙일 때도 `toxiproxy.json`과 스텁은 Toxiproxy·WireMock을 처음 띄우기 전에 복사한다.
- 지연을 주입할 때는 `curl -X POST localhost:8474/proxies/pg/toxics -d '{"type":"latency","attributes":{"latency":5000}}'`, 지울 때는 `curl -X DELETE localhost:8474/proxies/pg/toxics/latency_downstream`.
- 멈출 때는 `docker compose down`, 데이터까지 지울 때는 `docker compose down -v`.

## 4. 데이터 설계와 매일 SQL

테이블·컬럼·키·제약·인덱스는 [데이터 요구사항 §6](../spec-v2.md#6-데이터-요구사항)을 보고 직접 설계한다. 명세의 접힌 board-server 설계는 설계한 뒤 비교한다. 파일 경로·테스트 이름은 구현 예시의 관례이며 물리 이름은 채점 기준이 아니다.

[더미 SQL·붙여 넣기 안내](dummy/README.md)를 보고 그날 만든 테이블에 seed.sql의 해당 블록을 붙여 넣는다. 대량 조회 실험은 별도 DB에 bulk.sql을 추가한다. D01은 연결부터, D02부터 필요한 데이터만 적재한다. D01~D15 일자 페이지에서 오늘의 SQL을 풀고 실제 SQL·결과를 보관한다. 테이블·컬럼 이름이 다르면 SQL의 해당 이름을 바꾼다.

## 5. 첫날로 가기

- Java가 처음이면 [D00 워밍업](../spring/D00.md)(선택)부터 한다.
- 준비가 끝났으면 [D01 프로젝트 뼈대](../spring/D01.md)의 오늘 순서 ①부터 시작한다.
- 전체 일정은 [일자 목록](../spring/README.md)에 있다.
