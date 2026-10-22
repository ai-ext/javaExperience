# javaExperience 작업 의도

## 학습 화면 개편

### 목표

프론트엔드 경험은 있지만 백엔드는 처음인 사람이, 게시판 기능 한 건을 만들면서 요청·Java 코드·SQL·실제 DB 행을 눈으로 연결할 수 있게 한다. 설명은 중고등학생에게 전달할 만큼 친절하게 시작하되, 실무에서 중요한 트랜잭션 경계·쿼리 수·권한·동시성 같은 조건을 생략하지 않는다.

이 단계의 작업 대상은 **javaExperience만**이다. 다른 저장소와의 시각적 호환성은 고려하지만, 다른 저장소의 파일은 이번 작업의 수정·완료 대상으로 간주하지 않는다.

### 학습자가 매 화면에서 답할 수 있어야 하는 질문

1. 사용자가 화면에서 무엇을 했고 어떤 HTTP 요청이 만들어졌는가?
2. Controller·DTO·Service·Repository/Mapper는 각자 무엇을 받거나 결정하는가?
3. Java 객체와 DB 테이블/행은 무엇이 같고 다른가? 지금 값은 어디에 있는가?
4. 어떤 SQL이 언제 실행되며, 트랜잭션의 commit 또는 rollback 뒤 데이터가 어떻게 되는가?
5. DBeaver/CloudBeaver는 앱의 처리 경로가 아닌 별도 관찰 도구로 무엇을 볼 수 있는가?
6. 앞 단계에서 만든 데이터가 다음 POST/GET/PUT/PATCH/DELETE에서 어떻게 이어지는가?
7. 직접 버튼을 눌렀을 때 기대 응답과 실제 응답을 어떻게 비교하는가?
8. API 응답 필드에서 필요한 테이블·열·WHERE·JOIN·정렬을 어떻게 유도하고, 작성한 SQL과 실제 실행 계획을 어떻게 검증하는가?

### 콘텐츠와 시각 설계 원칙

- 2026-10-15 사용자 교정: **학습 화면이라는 이유로 재질과 제작 정밀도를 낮추지 않는다.** 원래의 `gpt-image-prompt` 구성과 한 작업에 집중한 화면 방식을 같은 스킬 안에 통합한다. 복잡도는 크게 낮춘다. 한 화면에는 지금 만들 파일·보낼 요청·확인할 값만 먼저 보이고, 깊은 내용은 작업 순서에 따라 별도 화면·심화 영역으로 이어 준다. 실제 이미지는 `imagegen`으로 만든다.

- 실제 데이터 한 건을 여러 프레임에서 계속 사용해 **전·후 값**을 비교한다. 개념 이름만 적은 상자와 화살표로 끝내지 않는다.
- 설명 순서는 **장면 → 관찰할 값 → 움직임의 이유 → Java/SQL 원문 → 예외·경계 → 직접 확인**이다. 난도가 높은 정보는 단계적으로 열되 핵심 설명을 모두 숨기지 않는다.
- 첫 진입의 기본 경로는 0-1의 작은 Java API다. Java가 익숙한 사람은 1-1의 `POST /api/posts → 200 success`부터 시작할 수 있지만, 이 단계에는 DB 저장·새 id가 없다. 글을 저장하고 `201`·새 id를 받는 연결은 1-2에서 시작하며 이후 조회·수정의 같은 글로 이어진다. DB SQL만 연습할 때는 DB-01부터 시작할 수 있다.
- `EntityManager`는 영속성 컨텍스트를 다루는 API이고, `Entity`는 메모리 객체이며, MySQL 테이블의 행은 별도 저장 상태다. `flush`의 SQL 실행과 `commit`의 확정, 다른 연결에서 보이는 결과를 구분한다.
- 시각 자료는 실제 `imagegen` 시안을 먼저 만들고, 이미지의 잘못된 글자·코드·기술 표현은 구현 전에 원문과 대조한다. 시안은 방향이고 기술 사실의 근거가 아니다.
- 모든 화면·절·산문·표·코드·토글은 `docs/design/visual-inventory.jsonl`에 식별한다. 상태는 증거에 따라 `unreviewed → mockup_ready → implemented → verified`로만 올린다. 공통 컴포넌트 하나를 적용했다고 모든 개별 화면을 완료로 표시하지 않는다.
- 정답 코드와 채점 기준, API 계약은 UI 재구성 중 손상하지 않는다. 예상 흐름 애니메이션을 실제 서버 계측으로 표현하지 않는다.
- DB 학습은 [DB 시나리오 확장 계획](docs/design/DB-SCENARIO-PLAN.md)의 연속 경로로 설계한다. `EXPLAIN` 추정, `EXPLAIN ANALYZE` 실측, `ANALYZE TABLE` 통계 갱신을 분리하고 기존 `practice` 정답 데이터는 보존한다.

### 현재 확인된 상태

- 이전 반복에서 101개 시나리오의 화면 DOM/SVG와 코드 탐색기, 공부자료 접기 카드가 구현됐다. 이는 **모든 화면의 개별 imagegen 시안·이해도 검증이 완료됐다**는 뜻이 아니다.
- `docs/design/hibernate-knowledge-screen-v1.png`의 **버전 카드 배치**와 `scenario-code-workbench-v1.png`의 **코드 탐색 구조**는 일부 적용됐다. 시안의 전체 화면 구성·모바일 세부 요소까지 픽셀 단위로 구현한 것은 아니다.
- `docs/design/jpa-entity-db-journey-v1.png`는 EntityManager·Entity·DB 행의 값 변화를 설명하기 위한 시안이다. S09 상단에 `id=42`의 단계별 값 비교를 **부분 구현**했다. commit/rollback은 순차 단계가 아닌 분기 카드로 표시한다.
- `docs/design/p20-order-entity-mapping-v1.png`는 P20 원문의 `Order`·`OrderLine`을 별도로 설계한 시안이다. P20 상단에 필드→열/FK 강조와 객체 생성→`persist`→예시 INSERT→commit 후 행 비교를 **부분 구현**했다. 시안의 잘못된 작은 코드·SQL 시점 표현은 실제 HTML에 옮기지 않았다. 두 화면 밖의 다른 공부자료·시나리오를 완료로 표시하지 않는다.

### 완료 기준

`docs/design/VISUAL-PLAN.md`의 단계별 체크와 `visual-inventory.jsonl`의 각 항목에 시안·구현·검증 근거가 기록된다. 사용자가 첫 화면의 시각적 사례만 보고도 요청과 DB 결과를 설명할 수 있어야 하고, 펼친 원문에서 깊은 기술 설명과 실제 코드를 확인할 수 있어야 한다. 자동 검사, 데스크톱·360px 브라우저 확인, 기술 내용 대조를 모두 통과한 항목만 `verified`로 표시한다.

## 실습 서버의 H2 연습 코드 기록

### 왜 바꿨나

시나리오 1장(게시글 작성)을 따라가기 전에 컨트롤러가 요청을 어떻게 받는지 손으로 먼저 익히려는 연습이다.
MySQL 컨테이너 없이도 앱이 바로 뜨게 하려고 기본 DB를 인메모리 H2로 바꿨다.

### 무엇을 바꿨나

| 파일 | 변경 | 의도 |
|---|---|---|
| `HelloController.java` | `GET /dashboard/{page}`, `POST /api/v1/posts` 추가 | `@PathVariable`, `@RequestBody`, 응답 DTO 연습 |
| `service/DashboardService.java`, `ProductService.java` | 빈 `@Service` 추가 | 생성자 주입(DI) 연습 |
| `build.gradle` | `runtimeOnly 'com.h2database:h2'` | 인메모리 DB 드라이버 |
| `application.yml` | 기본 datasource를 H2로, `ddl-auto: update`. MySQL 설정은 주석으로 남김 | Docker 없이 `./gradlew bootRun` |

### 아직 연습 중인 부분 (의도적으로 남김)

- `POST /api/v1/posts`: 제목 5글자 미만이면 `ResponseDto(401, ...)`을 반환한다. 이 경우 HTTP 상태는 그대로 200이고, 401은 인증 실패를 뜻하는 코드라 의미도 맞지 않는다. 시나리오 1-5(검증)에서 `400` + `@Valid`로 고칠 예정이다.
- `@RequestHeader(name="hi")`가 `@RequestBody`와 같은 파라미터에 함께 붙어 있다. 헤더는 별도 파라미터로 나눠야 한다(1-6 토큰 인증에서 정리).
- 쓰지 않는 import(`StringUtil`, `Map`, `Controller`, `ProductService`)와 `TODO`가 남아 있다.

### 되돌리는 법

MySQL(community DB)로 돌아가려면 `application.yml`에서 H2 블록을 지우고 주석 처리된 MySQL 설정을 살린다.
그 뒤 `docker compose up -d`를 실행한다. 테스트(`application-test.yml`, Testcontainers)는 이번 변경과 관계없다.
