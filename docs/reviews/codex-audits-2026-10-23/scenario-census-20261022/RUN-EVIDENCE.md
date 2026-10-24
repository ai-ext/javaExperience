# 이번 실행과 판정의 범위

확인일: 2026-10-22. 기준 작업 공간은 /Users/ds/code/javaExperience/.worktrees/concept-census-20261021, 시작 HEAD는 `ac41c5ed24b883742821f55da4e68a0ffc215b79`이다. 문서·학습자 소스·정답 snapshot은 수정하지 않고 새 감사 폴더에만 결과를 추가했다.

## 실행 요약

| 대상 | 실제로 한 검증 | 결과 | 이 결과가 보장하지 않는 것 |
|---|---|---|---|
| 본편101 snapshot | 각 manifest의 blob을 새 임시 폴더로 복원하고 JDK21·격리 Testcontainers MySQL에서 원래 `gradlew test` 실행 | 89단계 테스트 통과, 10장12단계는 빌드 성공이나 테스트0건 | 원문 C/D/R의 모든 계약이나 모든 HTTP 요청을 실행한 결과가 아님 |
| L12~L14 | 제공 materializer로 단계별 복원·`test bootJar`·격리 practice DB·실제 앱 기동·원문 check의 요청/기대값 실행 | 빌드3개 성공, 원래 HTTP check 8+6+4=18개 통과 | 엔진 간 같은 결과가 독립 정답임을 보장하지 않음 |
| DB08~11/14 | 원래 fixture 생성 SQL, 좋아요50만 행, 핵심 SELECT/EXPLAIN/EXPLAIN ANALYZE, 인덱스 생성/숨김/복원/제거 | 좋아요11행·게시글20행·JOIN20행의 값과 순서 보존 | 전체 API 권한·p95·쓰기 부하·다른 분포 성능을 보장하지 않음 |
| 독립 Java 레슨 | B1/B2/B3/B4/B5/B7/B8/C4의 완전한 main 예시12개 | 예상 출력/의도한 예외12개 일치 | Spring·DB·IDE 예시와 모든 변형을 실행한 것이 아님 |
| 문서 연결 | 225단위의 HTML201개에 있는 내부 링크/앵커10,489개 | 깨진 파일 링크1개 | 링크 존재가 학습 순서의 적절함을 뜻하지 않음 |
| 브라우저 | Chrome에서225단위의 첫 화면/지정 앵커와 최신 기능형7개 화면 진입, DOM·캡처 저장 | 진입 증거232개 저장 | 전 화면·모바일·모든 조작·모든 API를 시각 QA한 것이 아님 |
| 최신 기능형 과제 | 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트 | 6개 통과 | 이번의7개 API 전체 재실행이 아님. 기존 API/DB 기록은 별도 날짜로 대조 |

본편에서 실행된 JUnit 건수는 단계별 반복을 포함해 **2,337건**이다. `classname + testcase name` 조합은 **46개**이며 같은 이름의 테스트 코드도 단계에 따라 달라질 수 있다. 따라서 2,337개의 서로 다른 시나리오를 검증했다고 해석하면 안 된다. 쿼리 랩 각각의 JUnit46개도16-4에서 상속된 기존 테스트다. 쿼리 요청18개는 별도로 실행한 HTTP 검사다.

## 환경과 격리

- Java: `/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home`.
- MySQL 성능·대상 HTTP 실험에서 관측한 버전:8.4.11. 저장소가 사용하는 `mysql:8.4` 이미지다.
- 본편 테스트는 임시 복사본의 datasource를 Testcontainers URL로 고정했다. 이 실행 환경 override를 적용한 결과이며 기존 개발 DB로 테스트한 것이 아니다.
- 쿼리·대상 HTTP·성능 컨테이너에는 이번 감사 라벨과 고유 이름을 붙였다. 기존 compose 서비스/볼륨을 사용하거나 초기화하지 않았다.
- 생성된 임시 프로젝트와 감사 소유 컨테이너는 결과·로그를 보존한 뒤 제거했다. 종료 시 남은 소유 컨테이너/실행 폴더0개를 확인했다. 감사용 브라우저 탭과 로컬 문서 서버도 닫았다.

## 확인된 구체 동작

### 연습용 토큰의 문자 비교

S-2-2의 원래 snapshot을 복원한 격리 practice 앱에서 다음을 실행했다. 이는 1-6부터 이어지는 교육용 `api_token` 조회 경로의 관측이며, 10장의 JWT 검증 결과가 아니다.

| Authorization | POST 결과 | 작성자 |
|---|---|---|
| `Bearer tok-p05` | 201 | 회원5 |
| `Bearer TOK-P05` | 201 | 회원5 |
| `bearer tok-p05` | 401 | 저장 거절 |

별도 SQL에서도 token 열의 `utf8mb4_0900_ai_ci` 비교가 대소문자 변형을 같게 보는 것을 확인했다. 토큰 값과 HTTP 인증 scheme 이름의 대소문자 규칙을 분리해 시나리오와 검사를 보강할 대상이다. 이것을 모든 인증 방식이 뚫린다는 주장으로 확대하지 않는다.

근거: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-targeted-v2/S-2-2/result.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-targeted-v2/S-2-2/result.json), [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-query/token-collation.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-query/token-collation.txt).

### 목록 파라미터 오류의 응답 형식

S-2-2의 `GET /api/boards/dev/posts`에 `page=-1`, `size=0`, `size=51`, `page=abc`를 각각 보냈다. 모두400이었지만 `application/json`의 `timestamp/status/error/path` 기본 응답이었다. 같은 앱의 인증 오류는 `application/problem+json`이었다. 상태 코드만 맞는 검사와 공통 오류 응답 계약 검사를 분리해야 한다.

첫 탐침에서는 목록 경로를 `/api/posts`로 잘못 지정해405를 받았다. 해당 로그는 실행기 실수로 남겼고 제품의 validation 결과로 사용하지 않았다. 위 결론은 실제 BoardPostController 경로를 확인한 **v2 재실행**에 근거한다.

### 삭제 댓글 수정 후보의 반증

S-12-1에 대해 정적 대조 중 “삭제 guard가 없다”는 후보가 나왔으나 실제 Service의 `.filter(c -> c.getDeletedAt() == null)`를 다시 읽었다. HTTP로 댓글 생성201→삭제204→삭제 댓글 PATCH404를 확인했고 DB의 content/deleted_at/edited_at은 PATCH 전후 같았다. **이 결함 후보는 철회했다.** Repository의 `WHERE id`만으로 Service 전체의 정책 부재를 추론하면 안 된다.

근거: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-targeted/S-12-1/result.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-targeted/S-12-1/result.json).

### 인덱스 비교

50만 좋아요 행의 회원12 조회에서 기본 계획은 `ix_post_like_member`와 `Using filesort`, 복합 인덱스 후에는 `ix_post_like_member_created`와 `Backward index scan`을 사용했다. 같은11행의 값과 순서는 생성·INVISIBLE·VISIBLE·DROP 후 모두 같았다. 게시판3의 게시글/작성자 JOIN 비교도20행이 유지됐다. 각 조건의 `EXPLAIN ANALYZE`는3회 저장했다. 이 실험에서 속도 개선 비율을 일반화하거나 실제 API p95라고 표시하지 않았다.

근거: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-db/summary.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-db/summary.json).

## 재실행 진입점

모든 실행기는 이 감사 폴더에 보존했다. 기존 개발 DB를 향하지 않도록 실행기 안의 격리·소유권 조건을 확인하고 실행한다.

- 본편: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_snapshots.py](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_snapshots.py)
- 쿼리: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_query_labs.py](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_query_labs.py)
- DB: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_db_experiments.py](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_db_experiments.py)
- 대상 HTTP: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_targeted_http_v2.py](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_targeted_http_v2.py), 삭제 댓글은 앞선 run_targeted_http.py의 S-12-1 결과를 사용한다.
- 독립 Java: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_lesson_java.py](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/run_lesson_java.py)

## 이번에 실행하지 않은 범위

L15/L16의 학습자 구현, 독립 티켓30개의 수정 답안, 미션10개의 모든 API, 모든 실패주입·다중프로세스·복구 시나리오, 전체 모바일/브라우저 조작은 실행하지 않았다. 이 부분은 제공된 요구/코드/검사 정의와 시작점·완료 기준을 정적으로 감사했다. 새 확장 X01~X20도 구현하거나 실행한 결과가 아니다.

## 조사 경로

원문 대조는 Luna 서브에이전트3명과 메인이 분담했고 메인이 실행·교차 검증을 했다. 공식 이론 조사는 외부 CLI 위임 스킬의 도움말/제공자 확인 절차를 거쳐 **OpenAI 제공자의 gpt-6-luna Codex CLI**로 직접 수행했다. LiteLLM을 사용하지 않았다. 첫 시도는 중첩 CLI 실행에서 실패했으며, 같은 모델의 현재 웹 도구를 직접 사용하도록 수정한 재시도에서 공식 문서 조사를 수행했다. 기록은 /Users/ds/research/javaexperience-scenario-census-20261022/_data/official-research에 보존했다.
