# javaExperience

Java·Spring 서버 전환 과정 v2 · 45일이다. D15 중간 점검 뒤 D16~D45에서 설계·운영 변경·새 업무·회의·독립 수행을 검증한다. 빠른 학습자는 체크한 만큼 다음 날로 간다. 매일 **Java → Spring → 채점** 순서로 진행한다. Spring에서는 데이터 요구사항을 보고 테이블을 직접 설계하고 매일 SQL을 푼다. [더미 SQL](course/start/dummy/README.md)은 내 테이블 이름에 맞춰 붙여 넣으며, board-server는 구현 예시로 비교한다.

## 과정 v2 시작하기

준비물: **JDK 21 · IntelliJ IDEA · Docker 런타임 · Python 3**. 문서 빌드에만 Node.js·npm이 필요하다. AI 채점은 Codex 또는 Claude Code를 쓴다.

1. 저장소를 받은 뒤 **저장소 루트**에서 문서 서버를 켠다.

   ```bash
   git clone https://github.com/ai-ext/javaExperience.git
   cd javaExperience
   python3 -m http.server 8765 --bind 127.0.0.1
   ```

2. [학습 홈](index.html)을 `http://127.0.0.1:8765/index.html`에서 연다. Java 워밍업이 필요하면 [D00(선택)](course/spring/D00.md), 바로 시작하면 [D01 프로젝트 뼈대](course/spring/D01.md)로 간다.
3. [1단계 출발 자료](course/start/README.md)의 설정값으로 **새 Spring 프로젝트**를 만든다. compose·PG 모의 파일을 복사한 뒤 **새 프로젝트 루트**에서 `docker compose up -d --wait`를 실행한다.
4. Java는 저장소의 `java-track/`에서 채우고 **저장소 루트**에서 `./gradlew :java-track:test --tests 'J01*'`를 실행한다. Spring D01~D10은 **새 프로젝트 루트**에서 `./gradlew bootRun`으로 시작한다(D01 ③ 이후에는 `--args='--spring.profiles.active=local'` 추가).
5. 일자 페이지의 완료 조건을 확인하고 하단 AI 채점 프롬프트를 실행한다. D11~D14는 `messy-server/`를 다룬다. D16~D18은 그 사본에서 개인 과제를 처리하고 D19 이후는 1단계의 내 프로젝트에서 진행한다.

[후반 설계·분량 근거](docs/course-redesign/plans/2026-10-24-p9-d16-d30.md) · [과정 안내·티켓 규칙](course/README.md) · [명세서 v2](course/spec-v2.md) · [일자 목록](course/spring/README.md)

## 참고 자료(이전 과정)

아래 101단계 과정과 루트 앱·DB 실행법은 이전 과정의 참고 자료다. v2 D01~D10의 작업 대상과 실행 위치는 위 안내를 따른다.

Spring Boot 백엔드를 **직접 만들면서** 배우는 공개 실습 레포다. 게시판 API 101단계를 이어서 만들고, Codex 또는 Claude Code로 단계별 채점과 피드백을 받을 수 있다. 시나리오와 HTML은 GitHub 로그인 없이 읽거나 다운로드할 수 있다.

> 과정 v2(일자 페이지 D00~D45·Java 트랙·2단계 티켓)는 [과정 안내](course/README.md)와 [학습 홈](index.html)에서 시작한다. 아래 `scenario/`·`practice/`·`docs/knowledge/`·`tickets/`는 그 과정에서 찾아보는 참고 도감이다.

| 폴더 | 내용 |
|---|---|
| [`index.html`](index.html) | 학습 홈 — 시작점 선택, 6개 과제의 진도·마지막 장면 이어하기, 게시판 예시와 환경 준비 안내 |
| [`scenario/`](scenario/README.md) | **따라 만들기 시나리오** — 101단계 요구사항·난이도·역할별 전체 코드 접기, 쿼리 연습 18개, JWT 이후 세션 인증과 interface/impl 선택 실습. 이전 과정을 순서대로 볼 때 사용한다 |
| [`practice/`](practice/MISSIONS.md) | 학습용 미션 — 함정이 섞인 많은 데이터(`practice` DB)로 조회·쿼리 연습 |
| [`docs/knowledge/`](docs/knowledge/README.md) | 공부자료 134개 — 단계마다 "필요한 지식"으로 링크된다 |
| `docker/` | 실습 DB(MySQL 8.4) 초기 데이터 dump(`mysql/init/`)와 CloudBeaver(웹 DBeaver) 설정 |
| `src/` | 직접 이어서 구현할 Spring Boot 4.1 프로젝트 — `/hello`와 Todo·Post 학습 코드가 있으며 구현 상태는 브랜치에 따라 다르다 |
| `tools/site/` | `.md` → `.html` 빌드 도구(문서를 고칠 때만 쓴다) |

### 이전 과정 시작하기

준비물: Docker 런타임(`docker`·`docker compose` 명령이 동작하면 된다), IntelliJ IDEA, JDK 21(없으면 Gradle이 찾는다 — `gradle/gradle-daemon-jvm.properties`). AI 채점을 원하면 Codex 또는 Claude Code를 선택해 쓸 수 있다.

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
| DB를 처음 상태로 | `docker compose down -v && docker compose up -d` — 세 DB와 CloudBeaver 작업 공간도 초기화(아래 백업·복원 절차 확인) |
| 지금 DB 상태를 떠 두기 | `./docker/mysql/dump.sh` → `docker/mysql/backup/<시각>/` (git에 안 올라감) |
| 레포의 초기 데이터를 지금 상태로 바꾸기 | `./docker/mysql/dump.sh --seed` → `docker/mysql/init/` 교체 후 커밋 |
| DB에 SQL 한 줄 | `docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "SELECT COUNT(*) FROM post"` |

## 초기화 전 백업과 DB 복원

루트 compose의 `down -v`는 `community`·`practice`·`project`와 CloudBeaver 작업 공간(저장한 SQL·바꾼 연결 설정)을 함께 지운다. 먼저 `./docker/mysql/dump.sh`로 DB를 백업하고, CloudBeaver 자료는 별도로 복사한다. DB 덤프에는 CloudBeaver 작업 공간이 들어 있지 않으며, 다시 띄우면 저장소 기본 계정·연결로 시작한다.

`dump.sh`의 `--compact` 덤프에는 기존 테이블을 지우는 `DROP TABLE`이 없다. 초기화로 시드가 다시 적재된 DB 위에 덮어 넣으면 테이블·키 중복이 나므로, **앱을 멈추고 아래 대상 DB를 지워도 되는지 확인한 뒤** 빈 DB에 복원한다. 이 절차는 현재 DB 내용을 백업 시점으로 교체한다. `--seed`가 아닌 일반 백업 디렉터리를 지정한다(`project`가 없었던 백업은 그 DB를 건너뜀).

```bash
# javaExperience 레포 루트에서 실행. 실제 백업 디렉터리 이름으로 바꾼다.
backup_dir=docker/mysql/backup/20261024-120000
test -s "$backup_dir/01-community.sql" && test -s "$backup_dir/02-practice.sql" || exit 1
docker compose up -d mysql
# docker compose ps에서 mysql이 healthy가 된 다음 아래를 실행한다.
for db in community practice project; do
  case "$db" in
    community) file=01-community.sql ;;
    practice) file=02-practice.sql ;;
    project) file=03-project.sql ;;
  esac
  if [ ! -s "$backup_dir/$file" ]; then continue; fi
  docker compose exec -T mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS $db; CREATE DATABASE $db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; GRANT ALL PRIVILEGES ON $db.* TO 'community'@'%';" || exit 1
  docker compose exec -T mysql mysql -uroot -proot "$db" < "$backup_dir/$file" || exit 1
done
```

`01-community.sql`에는 `USE`가 없어 대상 DB를 인자로 준다. 나머지 덤프는 `CREATE DATABASE`·`USE`를 포함한다. 백업 시점에 각 DB의 테이블·정확한 행 수·대표 조회 결과를 따로 기록하고, 복원 뒤 같은 조회로 대조한다. `project`의 `flyway_schema_history`도 백업에 포함되므로 정상 복원한 뒤 앱을 시작한다. 파일 크기만으로 복원 성공을 판단하지 않는다.

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

`./gradlew test`는 위 DB를 쓰지 않는다. Testcontainers가 일회용 MySQL 8.4 컨테이너를 띄우고, 시나리오용 dump(`docker/mysql/init/01-community.sql`)를 넣은 뒤 테스트한다(`src/test/resources/application-test.yml`). 그래서 테스트가 개발용 데이터를 망가뜨리지 않는다. Docker 런타임이 꺼져 있으면 실패한다. 먼저 `docker info`와 `docker compose version`이 성공하는지 확인하고, 호스트 JDK 21에서 테스트를 실행한다. 런타임 전용 환경 변수는 기본 실행에 필요하지 않다.

## 작업 방식

- 각자 `<이름>/<장>` 브랜치(예: `hyemin/ch1`)에서 개발하고 push한다. 리뷰를 받고 싶으면 PR을 연다.
- `main`에는 직접 push하지 않는다(무료 플랜이라 보호 규칙으로 막혀 있지는 않다 — 약속으로 지킨다).
- 시나리오·문서를 고치면 `cd tools/site && npm install && npm run build`로 `.html`을 다시 만들어 함께 커밋한다(깨진 링크가 있으면 빌드가 실패한다). 누적 전체 코드를 제공하는 시나리오에는 canonical `snapshots/<id>.json`과 `snapshots/blobs/*.txt`를 `scenario/snapshots/`에 함께 둔다. canonical snapshot을 복사한 뒤 `python3 tools/site/localize-snapshots.py`를 실행해 공개 DB 포트 설정과 blob 참조를 갱신한다. HTML은 목록과 파일 코드를 사용자가 펼칠 때 각각 지연 로드한다.
