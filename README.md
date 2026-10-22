# javaExperience

Spring Boot 백엔드를 **직접 만들면서** 배우는 공개 실습 레포다. 게시판 API 101단계를 이어서 만들고, Codex 또는 Claude Code로 단계별 채점과 피드백을 받을 수 있다. 시나리오와 HTML은 GitHub 로그인 없이 읽거나 다운로드할 수 있다.

> 과정 v2(일자 페이지 D00~D15·Java 트랙·2단계 티켓)는 [과정 안내](course/README.md)와 [학습 홈](index.html)에서 시작한다. 아래 `scenario/`·`practice/`·`docs/knowledge/`·`tickets/`는 그 과정에서 찾아보는 참고 도감이다.

| 폴더 | 내용 |
|---|---|
| [`index.html`](index.html) | 학습 홈 — 시작점 선택, 6개 과제의 진도·마지막 장면 이어하기, 게시판 예시와 환경 준비 안내 |
| [`scenario/`](scenario/README.md) | **따라 만들기 시나리오** — 101단계 요구사항·난이도·역할별 전체 코드 접기, 쿼리 연습 18개, JWT 이후 세션 인증과 interface/impl 선택 실습. 여기서 시작한다 |
| [`practice/`](practice/MISSIONS.md) | 학습용 미션 — 함정이 섞인 많은 데이터(`practice` DB)로 조회·쿼리 연습 |
| [`docs/knowledge/`](docs/knowledge/README.md) | 공부자료 134개 — 단계마다 "필요한 지식"으로 링크된다 |
| `docker/` | 실습 DB(MySQL 8.4) 초기 데이터 dump(`mysql/init/`)와 CloudBeaver(웹 DBeaver) 설정 |
| `src/` | 직접 이어서 구현할 Spring Boot 4.1 프로젝트 — `/hello`와 Todo·Post 학습 코드가 있으며 구현 상태는 브랜치에 따라 다르다 |
| `tools/site/` | `.md` → `.html` 빌드 도구(문서를 고칠 때만 쓴다) |

## 시작하기

준비물: Docker 런타임(사내 표준은 Colima. `docker`·`docker compose` 명령이 동작하면 된다), IntelliJ IDEA, JDK 21(없으면 Gradle이 찾는다 — `gradle/gradle-daemon-jvm.properties`). AI 채점을 원하면 Codex 또는 Claude Code를 선택해 쓸 수 있다.

```bash
git clone https://github.com/ai-ext/javaExperience.git
cd javaExperience
git switch -c <내이름>/ch1          # 각자 자기 브랜치에서 개발한다
docker compose up -d        # DB와 CloudBeaver 띄우기(처음 한 번은 1~2분)
```

1. IntelliJ로 폴더를 열고(Gradle 프로젝트로 가져오기), `org.example.Main`을 실행한다.
2. 브라우저로 `http://localhost:8080/hello` → `hello`가 보이면 준비 끝.
3. 아래 명령으로 문서 서버를 켜고 브라우저에서 `http://127.0.0.1:8765/index.html`을 연다. 홈에서 백엔드 첫걸음(0-1), 게시글 작성(1-1), DB 학습(DB-01) 중 시작점을 고른다. 전체 단계는 상단의 **서비스 만들기**에서 볼 수 있다. GitHub에서는 `scenario/README.md`를 바로 읽을 수 있다.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

문서 서버는 정적 HTML과 단계별 전체 코드 파일을 제공한다. 홈의 게시판 예시와 개념 화면의 예상값은 설명용이며 실제 서버·DB를 사용하지 않는다. API 요청 도구가 있는 단계에서는 별도로 실행한 Spring Boot 서버의 주소를 입력하고 요청 버튼으로 직접 호출한다. `community`·`practice`·10장 `project` DB는 서로 다른 데이터이므로 DB를 바꿀 때 이전 단계의 글 ID를 재사용하지 않는다.

홈의 이어하기는 0-1·0-2·1-1·1-2·DB-01·DB-02의 진도와 마지막 장면을 같은 브라우저의 저장소에 보관한다. 완료 표시는 학습자가 직접 기록하며 서버 구현의 자동 채점 결과는 아니다.

상단의 **개념 학습**에서는 기존 공부자료 134개를 분류별로 찾고 제목·소제목을 검색한 뒤 목록이나 하던 과제로 돌아올 수 있다. 대표 상세인 [P16 JSON·Jackson](docs/knowledge/P16-json-jackson-practical.html)은 원문 §3.2의 요청 JSON → Java 객체 → 응답 JSON 예상값을 비교한다. 134개 모두의 고유 상세 화면을 새로 완성한 범위는 아니다.

## 실행

| 하고 싶은 것 | 명령 |
|---|---|
| DB·CloudBeaver 띄우기 | `docker compose up -d` |
| DB 상태 | `docker compose ps` (`healthy`면 준비됨) |
| 앱 실행 | IntelliJ에서 `Main` 실행, 또는 `./gradlew bootRun` |
| 학습용 데이터로 앱 실행 | `./gradlew bootRun --args='--spring.profiles.active=practice'` |
| 격리된 성능 DB 만들기 | `tools/db-perf-fixture.sh up` — 게시판·회원·글·좋아요·댓글·태그 데이터, 기본 좋아요 50만 행 |
| 테스트 | `./gradlew test` (Docker가 켜져 있어야 한다 — 아래 "테스트") |
| DB를 처음 상태로 | `docker compose down -v && docker compose up -d` |
| 지금 DB 상태를 떠 두기 | `./docker/mysql/dump.sh` → `docker/mysql/backup/<시각>/` (git에 안 올라감) |
| 레포의 초기 데이터를 지금 상태로 바꾸기 | `./docker/mysql/dump.sh --seed` → `docker/mysql/init/` 교체 후 커밋 |
| DB에 SQL 한 줄 | `docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "SELECT COUNT(*) FROM post"` |

## DB 접속 정보

| 항목 | 값 |
|---|---|
| 호스트·포트 | `localhost` · `13308` (컨테이너 안에서는 `3306`) |
| 계정 | `community` / `community` |
| DB | `community` — 본편 기본 DB · `practice` — 쿼리·배치용 학습 데이터 · `project` — 10장 별도 프로젝트(빈 DB) |

지금 main의 `src/main/resources/application.yml`은 활성 URL이 `jdbc:mysql://localhost:3306/community`다(학습자가 이어서 고치는 연습 코드라 그대로 둔다). 위 compose DB를 쓰려면 이 포트를 `13308`(`DB_PORT`를 바꿨다면 그 값)로 바꾼다. `practice`·`project` 프로파일 파일(`application-practice.yml`·`application-project.yml`)은 이미 `13308`이다.

느린 쿼리와 인덱스 실습은 별도 `javaexperience_perf` DB를 쓴다. [DB-14 실제 스키마부터 느린 쿼리까지](scenario/db-query-journey/db-14-live-schema-to-slow-query.md)에서 DBeaver/CloudBeaver로 열·인덱스·FK를 직접 확인하고, 같은 목록 쿼리의 실행 계획을 인덱스 전후로 비교한다. 이 DB는 `127.0.0.1:13319`의 전용 임시 컨테이너이며 `practice` 데이터와 분리된다.

10장은 `./gradlew bootRun --args='--spring.profiles.active=project'`로 실행한다. 기존 Docker 볼륨에는 새 `project` DB가 자동으로 생기지 않는다. 데이터를 지우지 않고 추가하려면 `docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS project; GRANT ALL PRIVILEGES ON project.* TO 'community'@'%';"`를 한 번 실행한다.

**CloudBeaver(웹 DBeaver) — compose에 들어 있다**

| 항목 | 값 |
|---|---|
| 주소 | `http://localhost:8978` |
| 로그인 | `cbadmin` / `Admin1234` |
| 연결 | `community (시나리오)` · `practice (학습용)` · `project (10장)` — 새 CloudBeaver 작업 공간에 미리 들어 있다 |

- 연결 설정은 `docker/cloudbeaver/data-sources.json`이고 처음 뜰 때 한 번 들어간다. 바꿨다면 `docker compose rm -sf cloudbeaver && docker volume rm <폴더이름>_cloudbeaver-data && docker compose up -d`.
- 아이디가 `admin`이 아닌 이유: CloudBeaver에 같은 이름의 기본 팀이 있어 쓸 수 없다. 비밀번호는 CloudBeaver 규칙(8자 이상·대소문자·숫자)에 맞춘 것이다.
- 데스크톱 DBeaver를 쓰면: 새 연결 → MySQL → 위 DB 값 입력 → Driver properties에서 `allowPublicKeyRetrieval` = `true`.
- Docker 안에서 도는 다른 도구에서 붙을 때는 호스트를 `localhost`가 아니라 `host.docker.internal`로 넣는다(컨테이너 안의 localhost는 컨테이너 자신이다).
- 13308·8978가 이미 쓰이고 있으면 `DB_PORT=13318 CB_PORT=8989 docker compose up -d`로 바꾼다. DB 포트를 바꾸면 `application.yml`의 포트도 같이 바꾼다.

## 테스트

`./gradlew test`는 위 DB를 쓰지 않는다. Testcontainers가 일회용 MySQL 8.4 컨테이너를 띄우고, 시나리오용 dump(`docker/mysql/init/01-community.sql`)를 넣은 뒤 테스트한다(`src/test/resources/application-test.yml`). 그래서 테스트가 개발용 데이터를 망가뜨리지 않는다. Docker 런타임(Colima 등)이 꺼져 있으면 실패한다. Colima에서 Testcontainers가 Docker를 찾지 못하면 Testcontainers 문서의 Colima 안내대로 `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock`와 `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`를 설정한다.

## 작업 방식

- 각자 `<이름>/<장>` 브랜치(예: `hyemin/ch1`)에서 개발하고 push한다. 리뷰를 받고 싶으면 PR을 연다.
- `main`에는 직접 push하지 않는다(무료 플랜이라 보호 규칙으로 막혀 있지는 않다 — 약속으로 지킨다).
- 시나리오·문서를 고치면 `cd tools/site && npm install && npm run build`로 `.html`을 다시 만들어 함께 커밋한다(깨진 링크가 있으면 빌드가 실패한다). 누적 전체 코드를 제공하는 시나리오에는 canonical `snapshots/<id>.json`과 `snapshots/blobs/*.txt`를 `scenario/snapshots/`에 함께 둔다. canonical snapshot을 복사한 뒤 `python3 tools/site/localize-snapshots.py`를 실행해 공개 DB 포트 설정과 blob 참조를 갱신한다. HTML은 목록과 파일 코드를 사용자가 펼칠 때 각각 지연 로드한다.
