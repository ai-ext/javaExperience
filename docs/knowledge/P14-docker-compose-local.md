# P14. Docker·docker compose로 로컬 개발 환경 만들기

> 3줄 요약 — Docker는 프로세스와 실행 파일을 격리하고, 이미지는 그 프로세스를 만들기 위한 불변 템플릿이다.
> `docker compose`는 MySQL·Redis처럼 여러 컨테이너의 설정, 네트워크, 볼륨, 생명주기를 `compose.yaml` 하나로 관리한다.
> Spring Boot 앱이 호스트에서 실행되면 `localhost:호스트포트`, Compose 안에서 실행되면 `서비스명:컨테이너포트`로 접속한다.

## 1. 한 줄로 말하면

Docker 컨테이너는 호스트 커널을 공유하면서 프로세스와 파일 시스템을 격리한 실행 단위다. 이미지는 읽기 전용 템플릿이고, 레지스트리는 이미지를 저장·배포하는 곳이다. `docker compose`는 여러 컨테이너를 서비스·네트워크·볼륨으로 선언한다.

로컬 개발에서 PC에 DB를 직접 설치하지 않고 팀의 버전과 설정을 재현한다. 컨테이너 삭제와 볼륨 데이터 삭제는 별개다.

## 2. 당장 알아야 할 것

### 2.1 이미지·컨테이너·레지스트리

| 용어 | 의미 | 실무에서 기억할 점 |
|---|---|---|
| 이미지 | 컨테이너를 만들기 위한 레이어 묶음 | `mysql:8.4`, `redis:7-alpine`처럼 태그를 명시한다 |
| 컨테이너 | 이미지로 생성해 실행 중인 격리 프로세스 | 컨테이너의 쓰기 레이어는 삭제하면 사라진다 |
| 레지스트리 | 이미지를 저장하고 내려받는 서버 | Docker Hub가 대표적이며 `docker pull`이 읽어 온다 |
| 서비스 | Compose 파일의 컨테이너 정의 | 서비스명은 Compose 내부 DNS 이름이 된다 |

```bash
docker pull mysql:8.4
docker run --name demo-mysql -e MYSQL_ROOT_PASSWORD=devroot -p 3307:3306 -d mysql:8.4
docker ps
docker logs -f demo-mysql
docker exec -it demo-mysql mysql -uroot -pdevroot
docker stop demo-mysql
docker rm demo-mysql
docker images
```

`-p 3307:3306`의 왼쪽은 호스트 포트, 오른쪽은 컨테이너 포트다. 호스트의 3307로 들어온 연결을 컨테이너의 3306으로 전달한다.

### 2.2 Compose 파일과 프로젝트 이름

파일 이름은 보통 프로젝트 루트의 `compose.yaml` 또는 `compose.yml`이다. Compose는 파일의 서비스들을 하나의 기본 네트워크에 넣고, 서비스명으로 서로를 찾게 한다.

```yaml
services:
  db:
    image: mysql:8.4
```

다른 컨테이너에서는 DB 주소가 `db`이고, IntelliJ의 호스트 앱에서는 `127.0.0.1:3307`이다.

### 2.3 포트, 볼륨, 환경변수

포트 공개는 호스트에서 컨테이너로 들어오는 통로다. 컨테이너끼리 통신할 때는 필수가 아니지만 호스트의 Spring Boot·DB 클라이언트에는 필요하다.

```yaml
ports:
  - "3307:3306"
volumes:
  - mysql-data:/var/lib/mysql
environment:
  MYSQL_DATABASE: app
  MYSQL_USER: app
  MYSQL_PASSWORD: app
```

`mysql-data`는 named volume이라 컨테이너를 제거해도 남는다. 비밀번호는 실제 팀에서 `.env`나 비밀 관리 시스템으로 주입하고 저장소에 올리지 않는다.

### 2.4 `depends_on`은 “실행됨”과 “사용 가능”을 구분한다

짧은 배열 문법은 시작 순서만 보장한다.

```yaml
depends_on:
  - db
```

MySQL 프로세스가 실행 중이어도 내부 초기화가 끝나지 않았을 수 있다. 앱이 바로 JDBC 연결을 만들면 `Communications link failure`가 날 수 있다. `healthcheck`와 `condition: service_healthy`를 함께 써야 Compose가 건강 상태를 확인한 뒤 앱을 시작한다.

```yaml
depends_on:
  db:
    condition: service_healthy
```

healthcheck는 시작 순서를 개선할 뿐, 런타임 네트워크 장애를 없애지는 않는다.

### 2.5 초기 SQL은 “빈 데이터 디렉터리에서 한 번” 실행된다

MySQL 공식 이미지의 `/docker-entrypoint-initdb.d`에 `.sql`, `.sql.gz`, 실행 가능한 `.sh`를 마운트하면 최초 초기화 과정에서 실행된다.

```yaml
volumes:
  - ./docker/mysql/init:/docker-entrypoint-initdb.d:ro
```

이미 `mysql-data`가 초기화되어 있으면 스크립트를 수정해도 다시 실행되지 않는다. 반복 가능한 변경에는 Flyway·Liquibase를 사용한다.

### 2.6 `down`, `stop`, `rm`, `down -v`의 차이

`docker compose stop`은 컨테이너를 멈추지만 다시 `start`할 수 있다. `docker compose down`은 컨테이너와 Compose 네트워크를 제거하지만 named volume은 기본적으로 남긴다. `docker compose down -v`는 named volume까지 삭제하므로 DB 데이터가 사라진다.

```bash
docker compose stop                 # 잠시 멈춤, 데이터 유지
docker compose start                # 기존 컨테이너 재시작
docker compose down                 # 컨테이너/네트워크 제거, 볼륨 유지
docker compose down -v              # 로컬 DB까지 초기화
docker compose up -d --remove-orphans
```

### 2.7 Apple Silicon에서는 이미지 아키텍처를 확인한다

공식 이미지가 `amd64`, `arm64v8`를 지원하는지 확인하고, 사내 이미지처럼 한 아키텍처만 지원할 때만 `platform: linux/amd64`를 검토한다.

```yaml
services:
  legacy-db:
    image: example/legacy-db:1.0
    platform: linux/amd64
```

기본값은 플랫폼을 지정하지 않는 공식 멀티 아키텍처 태그다.

### 2.8 Spring Boot의 Docker Compose 지원과 Testcontainers는 목적이 다르다

Spring Boot 4.1은 `spring-boot-docker-compose`를 `developmentOnly`로 추가하면 Compose 파일을 발견하고 서비스 연결 정보를 처리한다. 이미 서비스가 실행 중이면 다시 올리지 않는다. 공식 문서 기준 최소 Compose 버전은 2.2.0이다. Testcontainers는 테스트 수명주기에 맞춰 컨테이너를 시작하므로, 공유 로컬 DB는 Compose, 테스트별 격리는 Testcontainers를 선택한다.

## 3. 따라 하기

### 3.1 디렉터리 만들기

Spring Boot 프로젝트 루트에 다음 경로를 만든다.

```text
my-app/
├── build.gradle.kts
├── settings.gradle.kts
├── compose.yaml
├── docker/
│   └── mysql/
│       └── init/
│           └── 01-schema.sql
└── src/main/resources/
    └── application.yaml
```

확인 방법: `ls compose.yaml docker/mysql/init src/main/resources`로 확인한다.

### 3.2 `compose.yaml` 작성하기

아래 파일은 MySQL과 Redis를 띄운다. 앱은 IntelliJ에서 호스트 프로세스로 실행한다는 전제라 MySQL을 3307로 매핑했다. Redis는 기본 포트 6379를 그대로 매핑했다.

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: app
      MYSQL_USER: app
      MYSQL_PASSWORD: app
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3307:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/mysql/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -uroot -p\"$${MYSQL_ROOT_PASSWORD}\" --silent"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 20s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

volumes:
  mysql-data:
```

`$${...}`는 Compose가 환경변수를 먼저 치환하지 않고 컨테이너 안의 셸이 `$MYSQL_ROOT_PASSWORD`를 읽게 하는 이스케이프다. healthcheck는 컨테이너의 `localhost`에서 MySQL을 검사하므로 `3307`이 아니라 컨테이너 포트 3306을 검사한다.

```bash
docker compose config
docker compose up -d
docker compose ps
```

확인 방법: `docker compose config`가 YAML을 정규화해 출력하고, `docker compose ps`에서 `mysql`과 `redis`가 `running` 또는 `healthy`가 된다. 실패하면 먼저 `docker compose logs mysql`을 본다.

### 3.3 초기 스키마 넣기

`docker/mysql/init/01-schema.sql`의 전체 내용이다.

```sql
CREATE TABLE IF NOT EXISTS hello_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO hello_message (message) VALUES ('docker local database is ready');
```

이미 한 번 기동했다면 스크립트를 추가해도 실행되지 않는다. 실습을 처음 상태로 되돌릴 때만 다음을 실행한다.

```bash
docker compose down -v
docker compose up -d
docker compose exec mysql mysql -uapp -papp app -e 'SHOW TABLES; SELECT * FROM hello_message;'
```

확인 방법: `hello_message` 테이블과 한 행이 출력된다. `down -v` 전에는 데이터를 확인한다.

### 3.4 Gradle Kotlin DSL과 Spring 설정

`build.gradle.kts`의 핵심 의존성은 다음과 같다. Boot 4.1.1을 기준으로 한 예다.

```kotlin
plugins {
    id("java")
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    runtimeOnly("com.mysql:mysql-connector-j")
    developmentOnly("org.springframework.boot:spring-boot-docker-compose")
}
```

직접 `docker compose up -d`를 실행한다면 `developmentOnly` 의존성은 생략할 수 있다. Maven 대응은 다음과 같다.

| Gradle Kotlin DSL | Maven |
|---|---|
| `implementation("org.springframework.boot:spring-boot-starter-jdbc")` | `spring-boot-starter-jdbc` 의존성 |
| `runtimeOnly("com.mysql:mysql-connector-j")` | `com.mysql:mysql-connector-j` 의존성 |
| `developmentOnly("org.springframework.boot:spring-boot-docker-compose")` | `spring-boot-docker-compose`, `optional=true` |

`src/main/resources/application.yaml`은 호스트에서 실행하는 앱용이다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3307/app?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: app
    password: app
  sql:
    init:
      mode: never
```

자동 Compose 지원은 MySQL 이미지 이름을 기준으로 `JdbcConnectionDetails`를 만들고 매핑 포트를 찾는다. 이 연결 정보가 직접 적은 datasource 속성보다 우선할 수 있으므로 처음에는 자동 연결과 수동 URL 중 한 방식을 선택한다.

확인 방법: `./gradlew bootRun`이 `HikariPool` 초기화 실패 없이 기동하는지 본다.

### 3.5 앱이 Compose 안에서 실행될 때

앱까지 컨테이너로 실행하려면 `localhost`를 바꿔야 한다. Compose 서비스 이름이 DNS 이름이므로 JDBC 주소는 `mysql:3306`이다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://mysql:3306/app?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: app
    password: app
```

이 설정을 호스트에서 쓰면 `mysql`을 찾지 못한다. 실행 위치별 프로파일을 분리하거나 환경변수로 주입한다.

### 3.6 앱 자체의 최소 Dockerfile

앱을 컨테이너로 돌릴 때의 최소 예다.

```dockerfile
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

앱 서비스도 Compose에 넣는다면 `build: .`, `mysql:3306` 주소, `service_healthy` 조건을 사용한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `docker pull` | 이미지 내려받기 | `docker pull mysql:8.4` | 태그를 생략하면 `latest`가 될 수 있다 |
| `docker run` | 단일 컨테이너 실행 | `docker run -d --name redis redis:7-alpine` | 반복 실행 시 이름 충돌 |
| `docker compose up -d` | 서비스 생성·백그라운드 실행 | `docker compose up -d` | 이미지/빌드 변경은 `--build` 필요 |
| `docker compose ps` | 상태와 포트 확인 | `docker compose ps` | healthy인지 함께 본다 |
| `docker compose logs -f` | 실시간 로그 | `docker compose logs -f mysql` | 종료는 `Ctrl-C`, 서비스는 계속 실행 |
| `docker compose exec` | 실행 중 컨테이너 명령 | `docker compose exec mysql sh` | 컨테이너가 running이어야 한다 |
| `docker compose stop` | 서비스 일시 정지 | `docker compose stop` | 컨테이너·볼륨 유지 |
| `docker compose rm` | 멈춘 컨테이너 제거 | `docker compose rm` | named volume은 별도다 |
| `docker compose down` | 스택 제거 | `docker compose down` | 기본적으로 named volume 유지 |
| `docker compose down -v` | 데이터까지 초기화 | `docker compose down -v` | DB 데이터 삭제 |
| `docker compose pull` | 선언된 이미지 갱신 | `docker compose pull` | 태그가 움직이면 결과가 달라진다 |
| `docker compose config` | YAML·변수 검증 | `docker compose config` | 실행 전 필수 점검 |
| `docker volume ls` | 볼륨 목록 | `docker volume ls` | 프로젝트 접두사가 붙는다 |
| `docker network ls` | 네트워크 목록 | `docker network ls` | Compose 네트워크를 확인한다 |

## 5. 자주 나는 에러와 해결

### `Bind for 0.0.0.0:3307 failed: port is already allocated`

증상 → 호스트 3307을 다른 프로세스나 컨테이너가 점유했다. 해결 → `lsof -nP -iTCP:3307 -sTCP:LISTEN`과 `docker ps`로 원인을 확인하고, 기존 프로세스를 정리하거나 `"3310:3306"`처럼 왼쪽 포트만 바꾼다. 앱 JDBC URL도 함께 바꿔야 한다.

### `Communications link failure`

증상 → Spring이 MySQL에 연결하지 못한다. 원인 → MySQL 초기화 중이거나, 앱이 호스트에서 실행되는데 `mysql:3306`을 사용했거나, 앱 컨테이너인데 `localhost:3307`을 사용한 경우다. 해결 → 실행 위치에 따라 `127.0.0.1:3307` 또는 `mysql:3306`을 선택하고 `docker compose ps`, `docker compose logs mysql`로 healthy 상태를 확인한다.

### `Table 'app.hello_message' doesn't exist`

증상 → 초기 SQL이 반영되지 않았다. 원인 → named volume이 이미 초기화되어 init 디렉터리를 다시 읽지 않았다. 해결 → 개발 데이터가 필요 없을 때만 `docker compose down -v && docker compose up -d`로 재초기화한다. 유지해야 할 데이터라면 SQL을 직접 실행하거나 마이그레이션 도구를 사용한다.

### `Access denied for user 'app'`

증상 → 사용자 인증 실패. 원인 → 환경변수를 수정했지만 기존 MySQL 데이터 디렉터리에는 이전 비밀번호가 남아 있다. 공식 이미지는 기존 DB의 사용자를 매번 다시 만들지 않는다. 해결 → 기존 비밀번호를 사용하거나, 로컬 데이터 삭제가 허용될 때만 볼륨을 지우고 재생성한다.

### `no matching manifest for linux/arm64`

증상 → Apple Silicon에서 이미지 다운로드가 실패한다. 원인 → 해당 태그에 arm64 이미지가 없다. 해결 → arm64 지원 태그로 바꾸거나, 공급자가 제공한 멀티 아키텍처 태그를 찾는다. 정말 필요할 때만 `platform: linux/amd64`를 사용하며 성능 저하를 감수한다.

## 6. 한 단계 더

Compose는 서비스 정의로 컨테이너를 만들고 네트워크·볼륨을 연결한다. 서비스명은 내부 DNS 이름이고, `depends_on`은 생성 순서와 healthcheck 조건을 그래프로 만든다. 포트 매핑은 호스트 경계에서만 필요하며, 볼륨은 컨테이너와 데이터의 수명을 분리한다. Spring Boot 지원은 이 과정을 개발 중 자동화하는 기능이다.

운영 이미지는 → S19, 컨테이너 JVM은 → J16 참조. Redis는 → S11, Kafka는 → S14 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. 이미지와 컨테이너의 차이는 무엇인가?

이미지는 컨테이너를 만들기 위한 읽기 전용 템플릿이고, 컨테이너는 그 이미지로 실행된 프로세스다. 같은 이미지로 여러 컨테이너를 만들 수 있다. 컨테이너의 쓰기 레이어는 컨테이너 삭제와 함께 사라지므로 DB 데이터는 볼륨에 둔다.

꼬리질문: 이미지를 레지스트리에서 받는 명령은?

답: `docker pull 이미지:태그`다. `docker run`도 로컬에 이미지가 없으면 기본 레지스트리에서 내려받을 수 있지만, 팀 문서에서는 명시적으로 pull하거나 태그를 고정하는 편이 추적하기 쉽다.

### Q2. 호스트에서 실행한 Spring Boot와 MySQL 컨테이너가 각각 어떤 주소로 통신하는가?

호스트 앱은 공개된 호스트 포트를 사용하므로 예제에서는 `127.0.0.1:3307`이다. Compose 안의 앱 컨테이너는 같은 네트워크에서 서비스명 `mysql`과 컨테이너 포트 `3306`을 사용한다. `localhost`는 요청을 보내는 현재 환경 자신이므로 두 경우의 의미가 다르다.

꼬리질문: 컨테이너끼리 통신할 때 `ports`가 반드시 필요한가?

답: 아니다. 같은 Compose 네트워크에서는 서비스명과 컨테이너 포트로 통신한다. 호스트의 IDE나 외부 클라이언트가 들어와야 할 때만 호스트 포트를 공개한다.

### Q3. `depends_on`만 쓰면 DB 연결 문제가 해결되는가?

아니다. 짧은 `depends_on`은 DB 컨테이너가 먼저 생성·시작되게 할 뿐, MySQL이 SQL 연결을 받을 준비가 됐는지는 기다리지 않는다. `healthcheck`를 정의하고 앱 쪽에 `condition: service_healthy`를 사용해야 한다. 그래도 런타임 재시작과 일시적 장애에 대한 재시도는 별도다.

꼬리질문: healthcheck는 무엇을 검사해야 하는가?

답: 프로세스 존재가 아니라 실제 요청 가능성을 검사해야 한다. MySQL은 `mysqladmin ping`, Redis는 `redis-cli ping`처럼 서비스가 제공하는 진단 명령을 사용한다.

### Q4. `docker compose down`과 `down -v`의 차이는?

둘 다 컨테이너와 네트워크를 제거하지만 `down`은 named volume을 기본적으로 보존한다. `down -v`는 선언된 named volume도 삭제해 MySQL 데이터가 초기화된다. 따라서 init SQL을 다시 실행하려고 `down -v`를 쓰기 전에 데이터를 지워도 되는지 확인해야 한다.

꼬리질문: 컨테이너만 다시 만들고 데이터는 유지하려면?

답: `docker compose down` 후 `docker compose up -d`를 사용하거나, 단순히 `docker compose restart`를 사용한다. 볼륨 이름과 마운트 대상이 유지되어야 한다.

### Q5. `/docker-entrypoint-initdb.d`의 SQL을 수정했는데 반영되지 않는 이유는?

공식 MySQL 이미지는 데이터 디렉터리가 비어 있을 때 초기화 루틴을 실행한다. 이미 named volume에 데이터가 있으면 재초기화하지 않으므로 스크립트가 다시 실행되지 않는다. 개발용 초기화라면 볼륨을 삭제하고, 지속적인 변경이라면 Flyway·Liquibase 같은 마이그레이션을 사용한다.

꼬리질문: 운영 데이터에 `down -v`를 실행하면?

답: 해당 볼륨의 DB 데이터가 삭제될 수 있다. 운영에서는 Compose 파일을 학습용 명령처럼 다루지 말고 백업·복구 정책과 배포 절차를 먼저 확인해야 한다.

### Q6. Spring Boot Docker Compose 지원과 Testcontainers를 언제 선택하는가?

개발자가 IDE에서 앱을 실행하면서 공용 로컬 MySQL·Redis를 필요로 하면 Docker Compose 지원이 편하다. 테스트마다 깨끗한 실제 의존성을 만들고 종료해야 하면 Testcontainers가 적합하다. Testcontainers는 JUnit과 통합되어 테스트 수명주기를 관리하며, Compose는 개발 서비스의 수명주기를 관리한다.

꼬리질문: Spring 테스트에서 컨테이너를 static field로 관리할 때 주의할 점은?

답: 컨테이너가 테스트 클래스 종료 후 멈췄는데 Spring의 ApplicationContext가 캐시되어 다음 테스트가 이미 멈춘 서비스에 접근할 수 있다. Spring Bean으로 컨테이너를 관리하거나 컨텍스트 캐시와 컨테이너 수명을 맞추는 방식을 우선 검토한다.

## 8. 참고문헌

- What is a container? — https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/ — 컨테이너·이미지·포트 개념.
- Docker Compose — https://docs.docker.com/compose/ — Compose의 목적과 생명주기.
- Define services in Docker Compose — https://docs.docker.com/reference/compose-file/services/ — 서비스 정의 문법.
- Control startup and shutdown order in Compose — https://docs.docker.com/compose/how-tos/startup-order/ — `depends_on`과 healthcheck.
- Use containerized databases — https://docs.docker.com/guides/databases/ — 컨테이너 DB와 볼륨.
- mysql Docker official image overview — https://hub.docker.com/_/mysql — MySQL 이미지 환경변수·초기화·아키텍처.
- Development-time Services :: Spring Boot — https://docs.spring.io/spring-boot/reference/features/dev-services.html — Boot 4.1 Compose 지원.
- Docker Compose :: Spring Boot — https://docs.spring.io/spring-boot/how-to/docker-compose.html — Compose 연동 속성.
- Testcontainers :: Spring Boot — https://docs.spring.io/spring-boot/reference/testing/testcontainers.html — 테스트 컨테이너 수명주기.
