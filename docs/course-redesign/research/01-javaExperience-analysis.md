# 01. javaExperience 분석 (2026-10-22, main `1f443fa`)

저장소: `~/code/javaExperience` ← `github.com/ai-ext/javaExperience` (커밋 50개, `.git` 881MB — 시안 이미지가 큼)

## 무엇인가

프론트 경험자·백엔드 입문자가 **게시판 API 하나를 101단계로 키우며** Spring Boot를 배우는 공개 실습 레포. Spring Boot 4.1.1 / Java 21 / MySQL 8.4(compose, 13308) / Testcontainers.

| 구성 | 규모 | 성격 |
|---|---|---|
| `scenario/` ch0~ch16 | 101단계, md 약 8.9만 줄 | 단계별 요구사항. **본 과제** |
| `scenario/answers/*.json`, `snapshots/*.json` | 단계별 diff + 누적 전체 코드(9-5는 185파일) | 정답. 접기로 열람 |
| `tickets/` T-001~030 | 쉬움 10 · 중급 12 · 고급 8 | **실무 티켓형** 과제(새 API·버그·성능·스키마·리팩터) |
| `practice/MISSIONS.md` + `practice` DB | 글 145·좋아요 568, 함정 데이터 | SQL·조회 정답값 미션 |
| `scenario/db-query-journey`, `labs/` L12~L16 | DB-01~14, 쿼리 18개 | SQL·EXPLAIN·인덱스·세션·interface/impl |
| `lessons/` A0~J2 | 50개 | 개념 레슨 |
| `docs/knowledge/` | 134개 | 공부자료(단계마다 "필요한 지식"으로 링크) |
| `errors.md` | 에러 도감 | Boot 4.1.1에서 실제 재현한 에러 원문 |
| `tools/site/` | 238파일 | md→HTML 빌드·시각 감사 도구 |

## 단계 한 장의 형식 (예: 4-2 동시 좋아요)

상황 → 화면 시나리오(사용자→HTTP→서버→DB→응답 흐름) → **만들 것**(계약) → 구현 가이드 → **직접 확인**(curl·xargs -P) → **채점 기준** → 필요한 지식 → 힌트(접기) → 다음 단계

채점 기준 표는 4종으로 나뉜다.

| 코드 | 의미 | 판정 |
|---|---|---|
| C | HTTP 확인 (필수) | 상태·헤더·본문 |
| D | DB 확인 (필수, SELECT만) | 실제 행 값 |
| T | 테스트 실행 | 학습자가 쓴 지정 이름 테스트 |
| R | 코드 리뷰 (피드백용) | 설계 이유 설명 가능 여부 |

채점은 `tools/site/build.mjs:253` 의 **"결과 테스트 프롬프트"** 를 Codex/Claude Code에 붙여 넣어 받는다. 규칙: 코드 수정 금지, DB는 SELECT만, 채점 기준 표만이 기준, 마지막 줄 `결과: 필수 N/M 통과`.

## 강점

1. **계약이 검증 가능하다.** "좋아요가 동시에 맞게" 같은 말이 아니라 "글 16에 20명 동시 PUT → 전부 200, `like_count = COUNT(post_like) = 20`" 처럼 고정 데이터·고정 ID 기준이다.
2. **시드 데이터에 함정이 설계돼 있다.** 차단·팔로워 공개·임시저장·삭제·숨김 글, 만료/폐기 토큰, 동시성용 회원 20명, practice DB의 어긋난 카운트.
3. **실무 난제를 정면으로 다룬다.** 갱신 손실·교착·커넥션 풀 고갈·Idempotency-Key·낙관적 락·expand/contract·백필·N+1·커서 페이징·AFTER_COMMIT 이벤트.
4. **실측 근거.** 힌트에 "실측 20건 중 8건 교착" 같은 실제 재현 값, 에러 도감은 버전 고정 재현 원문.
5. **티켓 30개가 실무 형식**(요청자·배경·완료 조건·하지 말 것)이라 "시나리오 따라하기 → 실무 티켓" 전환이 이미 준비돼 있다.

## 약점·리스크 (온보딩에 그대로 쓰기 전에 확인할 것)

| # | 무엇 | 근거 | 영향 |
|---|---|---|---|
| 1 | **티켓의 기준 코드·DB 리셋 스크립트가 이 레포에 없다** | `tickets/001:13` "studymate 레포 루트에서 `bash scripts/java-db.sh --reset`". 레포에 `scripts/` 없음. 단, `scenario/snapshots/9-5.json`이 Flyway V1~V6를 포함해 티켓 전제("다음 번호 V7")와 일치 → 기준 코드로 추정 | 티켓을 과제로 주려면 기준 브랜치를 따로 만들어야 함 |
| 2 | 티켓이 홈·README·목차 어디에도 링크돼 있지 않다 | `README.md`·`index.html`·`scenario.json`에서 `tickets` 0건 | 학습자가 존재를 모름 |
| 3 | main의 `src/`가 깨끗한 시작점이 아니다 | Todo·Post 연습 코드, `application.yml`이 MySQL **3306**(compose는 13308), `intent.md`는 "기본 H2"라고 기술 → 서로 어긋남 | 첫 실행에서 DB 연결 실패 가능 |
| 4 | 채점이 LLM 프롬프트에 의존 | 자동 인수 테스트(숨은 테스트 스위트) 없음. T 항목도 학습자가 쓴 테스트 | 채점 재현성·공정성이 모델·프롬프트에 좌우 |
| 5 | 문서 규모가 과하다 | 시나리오 md 8.9만 줄, `docs/` 271MB, 시각 감사 도구 238파일 | 온보딩 기간 내 완주 불가. 경로를 잘라 줘야 함 |
| 6 | README가 **Docker Desktop** 전제 | `README.md` 준비물 | 사내는 라이선스로 Colima. Testcontainers는 `DOCKER_HOST`·`TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE` 설정 필요할 수 있음(이 맥에선 미검증) |
| 7 | `AGENTS.md`가 Codex 전용 지시 포함 | `~/.codex/skills/gpt-image-prompt`, `imagegen` | 학습 화면 개편 작업용 규칙. Claude로 채점할 때는 무관 |

## 이번에 한 것 / 못 한 것

- 한 것: `~/code/javaExperience`에 clone, 로컬 `CLAUDE.md` = `@AGENTS.md`(미커밋), `~/reference/projects.md` 등록.
- 못 한 것: **빌드·테스트 미실행** — 이 맥에 JDK가 없다(`java -version` → "Unable to locate a Java Runtime"). Gradle wrapper 자체가 JVM을 요구하므로 toolchain 자동 탐색 이전 단계에서 막힌다. Docker(Colima)는 떠 있음.
