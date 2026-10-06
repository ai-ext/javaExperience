# javaExperience

Spring Boot 백엔드를 **직접 만들면서** 배우는 실습 레포다. 게시판 API를 단계별로 키우고, 단계마다 Claude에게 채점과 피드백을 받는다.

| 폴더 | 내용 |
|---|---|
| [`scenario/`](scenario/README.md) | **따라 만들기 시나리오** — 단계별 요구사항·채점 기준·결과 테스트 프롬프트. 여기서 시작한다 |
| [`practice/`](practice/MISSIONS.md) | 학습용 미션 — 함정이 섞인 많은 데이터(`practice` DB)로 조회·쿼리 연습 |
| [`docs/knowledge/`](docs/knowledge/README.md) | 공부자료 133개 — 단계마다 "필요한 지식"으로 링크된다 |
| `docker/mysql/` | 실습 DB(MySQL 8.4) 이미지 — 스키마와 두 가지 데이터 |
| `src/` | 여러분이 개발할 Spring Boot 4.1 프로젝트(지금은 `/hello`만 있다) |
| `tools/site/` | `.md` → `.html` 빌드 도구(문서를 고칠 때만 쓴다) |

## 시작하기

준비물: Docker Desktop, IntelliJ IDEA, JDK 21(없으면 Gradle이 찾는다 — `gradle/gradle-daemon-jvm.properties`), Claude Code(결과 테스트용).

```bash
git clone https://github.com/ai-ext/javaExperience.git
cd javaExperience
git switch -c <내이름>/ch1          # 각자 자기 브랜치에서 개발한다
docker compose up -d --build        # DB 띄우기(처음 한 번은 1~2분)
```

1. IntelliJ로 폴더를 열고(Gradle 프로젝트로 가져오기), `org.example.Main`을 실행한다.
2. 브라우저로 `http://localhost:8080/hello` → `hello`가 보이면 준비 끝.
3. 파일 탐색기에서 **`scenario/README.html`** 을 브라우저로 열고 1-1부터 시작한다(GitHub에서 보면 `scenario/README.md`).

## 실행

| 하고 싶은 것 | 명령 |
|---|---|
| DB 띄우기 | `docker compose up -d --build` |
| DB 상태 | `docker compose ps` (`healthy`면 준비됨) |
| 앱 실행 | IntelliJ에서 `Main` 실행, 또는 `./gradlew bootRun` |
| 학습용 데이터로 앱 실행 | `./gradlew bootRun --args='--spring.profiles.active=practice'` |
| 테스트 | `./gradlew test` (Docker가 켜져 있어야 한다 — 아래 "테스트") |
| DB를 처음 상태로 | `docker compose down -v && docker compose up -d --build` |
| DB에 SQL 한 줄 | `docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "SELECT COUNT(*) FROM post"` |

## DB 접속 정보

| 항목 | 값 |
|---|---|
| 호스트·포트 | `localhost` · `13308` |
| 계정 | `community` / `community` |
| DB | `community` — 시나리오용(앱 기본 연결, 거의 빈 상태) · `practice` — 학습용(글 145·좋아요 568…) |

- **DBeaver(데스크톱 앱)**: 새 연결 → MySQL → 위 값 입력 → Driver properties에서 `allowPublicKeyRetrieval` = `true`.
- **CloudBeaver처럼 Docker 안에서 도는 도구**: 호스트를 `localhost`가 아니라 `host.docker.internal`로 넣는다(컨테이너 안의 localhost는 컨테이너 자신이다).
- 13308이 이미 쓰이고 있으면 `DB_PORT=13318 docker compose up -d`로 바꾸고 `application.yml`의 포트도 같이 바꾼다.

## 테스트

`./gradlew test`는 위 DB를 쓰지 않는다. Testcontainers가 일회용 MySQL 8.4 컨테이너를 띄우고, 시나리오용과 같은 스키마·데이터를 넣은 뒤 테스트한다(`src/test/resources/application-test.yml`). 그래서 테스트가 개발용 데이터를 망가뜨리지 않는다. Docker Desktop이 꺼져 있으면 실패한다.

## 작업 방식

- 각자 `<이름>/<장>` 브랜치(예: `hyemin/ch1`)에서 개발하고 push한다. 리뷰를 받고 싶으면 PR을 연다.
- `main`에는 직접 push하지 않는다(무료 플랜이라 보호 규칙으로 막혀 있지는 않다 — 약속으로 지킨다).
- 시나리오·문서를 고치면 `cd tools/site && npm install && npm run build`로 `.html`을 다시 만들어 함께 커밋한다(깨진 링크가 있으면 빌드가 실패한다).
