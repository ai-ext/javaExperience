# 시나리오 — 게시판 API를 단계별로 키우며 만들기

API 하나를 처음부터 끝까지 만든다. 1장에서는 `POST /api/posts`(게시글 작성) 하나를 **"success만 돌려주기"에서 시작해 DTO 응답 → 계층 분리 → DB 저장 → 입력 검증 → 토큰 인증**까지 단계마다 조금씩 키운다. 실제 백엔드에서 API 하나가 만들어지는 순서 그대로다. 이후 장에서 조회·수정·좋아요·댓글·북마크로 넓혀 간다.

## 진행 방법

1. **준비** — 레포 루트에서 `docker compose up -d`로 DB를 띄우고, IntelliJ에서 `Main`을 실행한다([README의 "실행"](../README.md#실행)).
2. **단계 페이지를 읽는다** — 상황, 만들 것(요청·응답 명세), 채점 기준, 필요한 지식 링크가 있다.
3. **만든다** — 막히면 "필요한 지식"의 문서를 먼저 보고, 그래도 막히면 페이지 아래 힌트를 연다.
4. **직접 확인한다** — 페이지의 curl 명령(또는 IntelliJ HTTP Client)으로 호출해 본다.
5. **결과 테스트** — 서버를 띄운 채로 페이지 맨 아래 "결과 테스트 프롬프트"를 복사해 **Claude Code에 붙여 넣는다.** Claude가 API를 호출하고 DB를 조회해서 채점표와 피드백(잘한 점·부족한 점·다음 단계 전에 고칠 것·더 볼 문서)을 준다. 코드는 고치지 않는다.
6. 피드백을 반영하고 커밋한 뒤 다음 단계로 간다.

> **채점은 그 단계의 계약만 본다.** 1-1은 `success`, 1-2부터는 JSON을 돌려주는 것처럼 단계마다 응답이 바뀐다. 다음 단계로 넘어가면 이전 단계의 채점은 실패하는 게 정상이다.

- **작업 브랜치** — 각자 자기 브랜치에서 한다(예: `git switch -c hyemin/ch1`). 단계마다 커밋해 두면 diff로 "무엇이 바뀌었나"를 볼 수 있다. `main`에는 직접 push하지 않는다.
- **채점이 만드는 데이터** — 결과 테스트는 실제로 글을 만든다. 제목이 `[채점]`으로 시작하는 글이 그것이다. DB를 처음 상태로 돌리려면 `docker compose down -v && docker compose up -d`.

## 시나리오 데이터 (`community` DB)

게시글은 여러분이 API로 만든다. 처음에는 아래 데이터만 있다. 2장부터는 이 데이터로 채점하므로 **채점 결과가 이상하면 먼저 DB를 처음 상태로 돌린다**(`docker compose down -v && docker compose up -d`).

**회원과 토큰** — 요청 헤더 `Authorization: Bearer <토큰>`

| 회원 id | 닉네임 | 역할·상태 | 토큰 | 관계 |
|---|---|---|---|---|
| 1 | 운영자 | ADMIN | `tok-admin` | 숨김 글을 볼 수 있다 |
| 2 | 김자바 | USER — **여러분의 기본 계정** | `tok-kimjava` · 만료 `tok-kimjava-old` · 폐기 `tok-kimjava-revoked` | 이스프링(3)을 팔로우 |
| 3 | 이스프링 | USER | `tok-lee` | 북마크 6개·폴더 2개 |
| 4 | 박디비 | USER | `tok-park` | 좋아요 8개, **폴더 10개(한도)** |
| 5 | 최정지 | USER, **정지(SUSPENDED)** | `tok-choi` | |
| 6 | 한차단 | USER | `tok-han` | **김자바를 차단** |
| 7~26 | 동시성01~20 | USER | `tok-c01` ~ `tok-c20` | 동시 요청 확인용(4-2) |

**게시판** — `notice`(공지, 운영자만 글쓰기) · `dev`(개발) · `qna`(질문) · `free`(자유)

**미리 있는 글 21개** — 여러분이 만드는 글은 id 22부터 붙는다.

| id | 게시판 | 작성자 | 특징 |
|---|---|---|---|
| 1 | notice | 운영자 | 공지 |
| 2 | dev | 이스프링 | 좋아요 1 |
| 3 | qna | 박디비 | |
| 4 · 5 | free | 이스프링 · 박디비 | 공개 |
| 6 | free | 이스프링 | **팔로워 공개**(`FOLLOWERS`) — 김자바만 볼 수 있다 |
| 7 | free | 박디비 | **임시저장**(`DRAFT`) — 박디비만 볼 수 있다 |
| 8 | free | 이스프링 | **삭제됨**(`deleted_at`) — 아무도 못 본다 |
| 9 | free | 한차단 | 김자바를 차단한 회원의 글 — 김자바에게만 안 보인다 |
| 10 | free | 박디비 | **운영자 숨김**(`HIDDEN`) — 운영자만 볼 수 있다 |
| 11 | qna | 이스프링 | 댓글 6개(답글·삭제된 댓글·차단한 회원의 댓글 포함) |
| 12~21 | free | 이스프링·박디비 번갈아 | 페이징 확인용 "자유글 01~10" |

- 태그 8개: `java`, `spring`, `jpa`, `mysql`, `docker`, `테스트`, `회고`, `질문`
- 테이블 구조와 데이터는 dump 파일 [`docker/mysql/init/01-community.sql`](../docker/mysql/init/01-community.sql)에 있다. 눈으로 보려면 CloudBeaver(`http://localhost:8978`, `cbadmin` / `Admin1234`)의 `community (시나리오)` 연결을 연다.

## 8·9장은 학습용 데이터(`practice` DB)

8장(쿼리 심화)과 9장(스키마 변경)은 데이터가 많은 학습용 DB로 한다 — 회원 30·글 145·좋아요 568에 일부러 숫자가 어긋난 글, 삭제·숨김 글 등이 섞여 있다([학습용 미션](../practice/MISSIONS.md)의 "데이터에 숨겨 둔 함정").

- 앱 실행: `./gradlew bootRun --args='--spring.profiles.active=practice'` (IntelliJ: Active profiles에 `practice`)
- 토큰: `tok-p01` ~ `tok-p30` — 번호가 회원 id다. 회원 1이 운영자(`ADMIN`), 28은 정지, 29는 탈퇴
- "지금 시각"은 `2026-10-05 00:00`으로 고정한다(`application-practice.yml`의 `app.fixed-now`, 8-2에서 `Clock` 빈으로 연결)
- 결과 테스트 프롬프트도 이 장에서는 `practice` DB를 조회한다

## 목차

<!-- toc:start — tools/site/build.mjs가 scenario.json으로 다시 쓴다. 직접 고치지 마라 -->
### 1장. 게시글 작성 — POST /api/posts

같은 API 하나를 "success만 돌려주기"에서 시작해 DTO 응답 → 계층 분리 → DB 저장 → 검증 → 토큰 인증까지 키운다. 백엔드 API 하나가 만들어지는 순서 그대로다.

- [1-1. 요청 받기 — 일단 success](ch1-create-post/1-1-receive-request.md)
- [1-2. DTO로 응답하기 — 201과 Location](ch1-create-post/1-2-dto-response.md)
- [1-3. 서비스·저장소로 나누기](ch1-create-post/1-3-service-layer.md)
- [1-4. DB에 저장하기 — JPA](ch1-create-post/1-4-save-to-db.md)
- [1-5. 입력 검증과 에러 응답](ch1-create-post/1-5-validation.md)
- [1-6. 토큰으로 작성자 정하기](ch1-create-post/1-6-token-auth.md)

### 2장. 게시글 조회 — GET /api/posts

단건 조회부터 게시판 목록·페이징, "이 사람이 볼 수 있는 글만" 규칙, 쿼리 수 줄이기까지. 조회 API는 토큰 없이도 되고, 토큰이 있으면 그 회원 기준으로 판단한다.

- [2-1. 단건 조회와 404](ch2-read-post/2-1-get-one.md)
- [2-2. 게시판 목록과 페이징](ch2-read-post/2-2-board-list.md)
- [2-3. 볼 수 있는 글만 — 임시저장·삭제·숨김·팔로워·차단](ch2-read-post/2-3-visibility.md)
- [2-4. 쿼리 수 줄이기(N+1)](ch2-read-post/2-4-n-plus-1.md)

### 3장. 게시글 수정·삭제

본인 글만 고치고 지우기. 지운 글은 행을 남기고(soft delete) 조회에서만 숨긴다.

- [3-1. 부분 수정(PATCH)과 본인 확인](ch3-update-delete/3-1-patch.md)
- [3-2. 삭제 — soft delete](ch3-update-delete/3-2-soft-delete.md)

### 4장. 좋아요

몇 번 눌러도 결과가 같은 좋아요, 동시에 눌러도 맞는 숫자, 내가 좋아요한 글 목록(커서 페이징).

- [4-1. 좋아요·취소(멱등)](ch4-like/4-1-like-toggle.md)
- [4-2. 동시에 눌러도 맞는 like_count](ch4-like/4-2-like-concurrency.md)
- [4-3. 내가 좋아요한 글 — 커서 페이징](ch4-like/4-3-my-likes.md)

### 5장. 댓글·답글

댓글과 1단계 답글, 지운 댓글 자리 남기기, 댓글 수 맞추기.

- [5-1. 댓글 작성](ch5-comment/5-1-create-comment.md)
- [5-2. 답글(1단계까지)](ch5-comment/5-2-reply.md)
- [5-3. 댓글 목록과 삭제](ch5-comment/5-3-comment-list-delete.md)

### 6장. 북마크(즐겨찾기)

북마크와 폴더, 내 북마크 목록. 볼 수 없게 된 글을 "빼지 않고 표시"하는 점이 좋아요 목록과 다르다.

- [6-1. 북마크 추가·삭제](ch6-bookmark/6-1-bookmark.md)
- [6-2. 폴더 — 최대 10개, 이름 중복 불가](ch6-bookmark/6-2-folders.md)
- [6-3. 내 북마크 목록](ch6-bookmark/6-3-my-bookmarks.md)

### 7장. 테스트로 지키기

지금까지 만든 API를 계층별 테스트로 고정한다. 결과 테스트는 여러분이 쓴 테스트를 실행해 보고 리뷰한다.

- [7-1. 컨트롤러 슬라이스 테스트](ch7-tests/7-1-controller-slice.md)
- [7-2. 서비스 단위 테스트 — mock과 spy](ch7-tests/7-2-service-unit.md)
- [7-3. 통합 테스트 — Testcontainers](ch7-tests/7-3-integration.md)

### 8장. 쿼리 심화 — 학습용 데이터(practice)

글 145·좋아요 568에 함정이 섞인 학습용 DB로, SQL을 먼저 짜고 API로 옮긴다. 집계·랭킹·관계·조합 검색·정합성 배치.

- [8-1. 회원별 활동 요약 — LEFT JOIN과 집계](ch8-query-deep/8-1-activity-summary.md)
- [8-2. 최근 N일 인기글 랭킹 — 조건부 집계와 고정 시계](ch8-query-deep/8-2-popular-ranking.md)
- [8-3. 관계 쿼리 — 맞팔·맞팔 추천·친구의 친구](ch8-query-deep/8-3-relations.md)
- [8-4. 조합 검색 — 동적 쿼리](ch8-query-deep/8-4-dynamic-search.md)
- [8-5. 정합성 배치 — 어긋난 숫자 찾아 고치기](ch8-query-deep/8-5-recount-batch.md)

### 9장. 스키마 변경 — 데이터가 이미 있을 때

운영 중인 DB를 가정하고 Flyway로 스키마를 바꾼다. 인덱스, 컬럼 추가와 백필, 새 테이블, 서비스를 멈추지 않는 이름 변경.

- [9-1. Flyway 도입 — 지금 스키마를 기준선으로](ch9-schema-change/9-1-flyway.md)
- [9-2. 인덱스와 실행 계획](ch9-schema-change/9-2-index-explain.md)
- [9-3. 컬럼 추가와 백필](ch9-schema-change/9-3-add-column-backfill.md)
- [9-4. 새 테이블과 API — 알림](ch9-schema-change/9-4-notifications.md)
- [9-5. 서비스를 멈추지 않는 이름 변경 — expand와 contract](ch9-schema-change/9-5-expand-contract.md)
<!-- toc:end -->
