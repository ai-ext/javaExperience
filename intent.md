# intent — 이번 변경의 의도

## 왜 바꿨나

시나리오 1장(게시글 작성)을 따라가기 전에 컨트롤러가 요청을 어떻게 받는지 손으로 먼저 익히려는 연습이다.
MySQL 컨테이너 없이도 앱이 바로 뜨게 하려고 기본 DB를 인메모리 H2로 바꿨다.

## 무엇을 바꿨나

| 파일 | 변경 | 의도 |
|---|---|---|
| `HelloController.java` | `GET /dashboard/{page}`, `POST /api/v1/posts` 추가 | `@PathVariable`, `@RequestBody`, 응답 DTO 연습 |
| `service/DashboardService.java`, `ProductService.java` | 빈 `@Service` 추가 | 생성자 주입(DI) 연습 |
| `build.gradle` | `runtimeOnly 'com.h2database:h2'` | 인메모리 DB 드라이버 |
| `application.yml` | 기본 datasource를 H2로, `ddl-auto: update`. MySQL 설정은 주석으로 남김 | Docker 없이 `./gradlew bootRun` |

## 아직 연습 중인 부분 (의도적으로 남김)

- `POST /api/v1/posts`: 제목 5글자 미만이면 `ResponseDto(401, ...)`을 반환한다. 이 경우 HTTP 상태는 그대로 200이고, 401은 인증 실패를 뜻하는 코드라 의미도 맞지 않는다. 시나리오 1-5(검증)에서 `400` + `@Valid`로 고칠 예정이다.
- `@RequestHeader(name="hi")`가 `@RequestBody`와 같은 파라미터에 함께 붙어 있다. 헤더는 별도 파라미터로 나눠야 한다(1-6 토큰 인증에서 정리).
- 쓰지 않는 import(`StringUtil`, `Map`, `Controller`, `ProductService`)와 `TODO`가 남아 있다.

## 되돌리는 법

MySQL(community DB)로 돌아가려면 `application.yml`에서 H2 블록을 지우고 주석 처리된 MySQL 설정을 살린다.
그 뒤 `docker compose up -d`를 실행한다. 테스트(`application-test.yml`, Testcontainers)는 이번 변경과 관계없다.
