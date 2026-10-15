# 학습용 미션 — 함정이 섞인 데이터로 조회·쿼리 연습 (practice DB)

`scenario/`(따라 만들기)와 별개인 **학습용 트랙**이다. 같은 스키마에 데이터가 많이 들어 있는 `practice` DB를 쓴다.
더미 데이터에는 실무에서 만나는 함정을 일부러 섞어 두었고, 미션마다 **정답 확인값**(실제 DB에서 뽑은 값)이 있다 — 테스트의 기대값으로 쓴다.

## 실행

```bash
docker compose up -d          # MySQL 8.4 (localhost:13308, 계정 community/community, 이 트랙은 DB practice)
./gradlew bootRun --args='--spring.profiles.active=practice'   # IntelliJ: Run 설정 Active profiles에 practice
docker compose down -v && docker compose up -d   # 데이터를 처음 상태로(community·practice 둘 다)
```

- 테스트(`./gradlew test`)는 compose DB를 쓰지 않는다. Testcontainers가 일회용 MySQL을 띄운다(Docker 필요, `src/test/resources/application-test.yml`). 기본은 시나리오용 dump(`01-community.sql`)를 넣으므로, 이 트랙의 정답 확인값으로 테스트하려면 그 테스트에서 `spring.sql.init.schema-locations`를 `file:docker/mysql/init/02-practice.sql`로 바꾸고 DB 이름을 `practice`로 맞춘다(예: `@TestPropertySource`).
- IntelliJ에서 테스트를 돌릴 때 Gradle로 실행되게 두면(기본값) 위 설정이 그대로 적용된다.
- 데이터는 dump 파일 `docker/mysql/init/02-practice.sql`이다(테이블 12개, 시나리오와 같은 구조). 실습하다 바꾼 상태를 남기려면 `./docker/mysql/dump.sh`(→ `docker/mysql/backup/`).
- CloudBeaver(`http://localhost:8978`, `cbadmin` / `Admin1234`)의 `practice (학습용)` 연결로 먼저 둘러보자.

## 데이터 한눈에

| 테이블 | 행 | | 테이블 | 행 |
|---|---|---|---|---|
| member | 30 | | post_like | 568 |
| board | 4 (notice·dev·qna·free) | | bookmark | 264 |
| post | 145 | | bookmark_folder | 28 |
| comment | 351 | | follow | 102 |
| tag / post_tag | 15 / 169 | | member_block | 5 |

기준 시각은 **2026-10-05 00:00**(모든 데이터가 이 시각 이전). "지금"이 필요한 로직은 `Clock` 빈으로 받고, 테스트에서는 이 시각으로 고정한다.

| 회원 | 특징 |
|---|---|
| 1 운영자 | ADMIN. 공지 작성, 숨김(HIDDEN) 글 열람 가능 |
| 2~5 | 글을 많이 쓰고 팔로워가 많다. 2↔3, 4↔5 맞팔 |
| 6 | 북마크 폴더 10개(한도 꽉 참). 6↔7 맞팔, 5가 6을 차단 |
| 7 | 2번을 차단 → 2번 글이 안 보인다 |
| 8 | 북마크 18개, 폴더 2개 |
| 10 ↔ 11 | 서로 차단. 14는 3을 차단 |
| 12 | 좋아요 29개(지금 볼 수 있는 건 26개) |
| 26, 27 | 글은 안 쓰고 좋아요·북마크만 |
| 28 | 정지(SUSPENDED, 2026-09-10) |
| 29 | 탈퇴(WITHDRAWN, 2026-09-01) — 쓴 글 3개가 남아 있다 |
| 30 | 2026-10-03 가입, 활동 없음 |

## 업무 규칙 (모든 미션 공통)

**R1. 글을 볼 수 있나** (보는 사람 v, 글 p)
1. 삭제된 글(`deleted_at` 있음)은 아무도 못 본다.
2. `status`: PUBLISHED는 공개, DRAFT는 작성자만, HIDDEN은 운영자(ADMIN)만.
3. `visibility = FOLLOWERS`면 작성자 본인과 작성자를 **지금** 팔로우하는 회원만.
4. 둘 중 한 명이라도 상대를 차단했으면 서로의 글·댓글이 안 보인다.
5. 비로그인(헤더 없음)은 PUBLISHED + PUBLIC + 삭제 안 된 글만.
6. 볼 수 없는 글의 상세는 403이 아니라 **404**(있다는 사실도 숨긴다).
7. 작성자가 탈퇴한 글은 보이되 작성자 이름은 `"탈퇴한 회원"`.

**R2. 반응(좋아요·북마크·댓글)**
- 볼 수 있는 PUBLISHED 글에만 할 수 있다. ACTIVE 회원만 가능(정지 회원은 403).
- 본인 글에 좋아요는 안 된다(400). 북마크·댓글은 된다.
- 좋아요·북마크는 멱등: 이미 했으면 다시 해도 성공, 행은 하나.
- `like_count`·`comment_count`는 행이 바뀔 때 같이 바꾼다. `comment_count` = 삭제 안 된 댓글 수(답글 포함).

**R3. 북마크 폴더**: 회원당 최대 10개(초과 400). 이름은 회원 안에서 중복 불가(409). 폴더를 지우면 안의 북마크는 기본 폴더(`folder_id = NULL`)로 옮긴다. 남의 폴더 id를 쓰면 404.

**R4. 정렬·페이지**: 최신순 = `published_at DESC, id DESC`(동시각 대비). 목록은 커서(keyset) 페이지네이션.

**R5. 로그인 대신** 요청 헤더 `X-Member-Id: 7`로 회원을 정한다. 1-6처럼 토큰을 쓰고 싶으면 `Authorization: Bearer tok-p07`(번호 = 회원 id, `tok-p01`~`tok-p30`)도 들어 있다. 이 미션 일부는 채점할 수 있는 단계로 [시나리오 8장](../scenario/ch8-query-deep/8-1-activity-summary.md)에 옮겨 두었다.

## 데이터에 숨겨 둔 함정

| 함정 | 위치 |
|---|---|
| `like_count`가 실제 좋아요 행 수와 다름 | 글 93, 119, 120 |
| `comment_count`가 실제 댓글 수와 다름 | 글 22, 75 |
| 임시저장(DRAFT) | 글 7, 35, 45, 83, 102, 126, 129 |
| 운영자 숨김(HIDDEN) — 숨기기 전에 달린 좋아요·북마크가 남아 있음 | 글 36, 99, 105, 108 |
| 작성자 삭제 — 좋아요·북마크가 남아 있음 | 글 42, 59, 60, 67, 109, 127 |
| 처음엔 PUBLIC이었다가 FOLLOWERS로 바뀜 — 팔로워 아닌 회원의 예전 좋아요·북마크가 남아 있음 | 글 15, 57 |
| 삭제된 댓글 밑에 살아 있는 답글 | 댓글 12(글 4) 외 |
| 본문이 아주 긴 글 / 이모지 글 | 글 124 / 글 122 |
| 같은 제목의 글 | 35개 제목이 중복 |

---

## 미션

각 미션의 완료 기준 = 정답 확인값을 기대값으로 한 테스트가 통과.

### M1. 게시판 글 목록·상세 — 서비스 로직 분리
- `GET /api/boards/{slug}/posts?size=20&cursor=` → `id, title, authorNickname, likeCount, commentCount, tags[], publishedAt`(본문은 빼기 — 글 124)
  - 목록에는 PUBLISHED만 나온다(내 임시저장 글은 목록에 섞지 않는다). 나머지는 R1 그대로
- `GET /api/posts/{id}` → 본문 + `likedByMe`, `bookmarkedByMe`. 조회수 +1(작성자 본인 조회는 제외)
- 분리 포인트: R1을 한 클래스(예: `PostAccessPolicy`)로. 상세는 자바 코드로 판정하고 목록은 WHERE 조건으로 걸러야 한다 — **같은 규칙을 두 군데서 어떻게 하나로 관리할지**가 핵심 고민
- 정답 확인
  - `dev` 비로그인: 50개, 첫 5개 `145, 144, 143, 140, 138`
  - `dev` + `X-Member-Id: 7`: 44개(2번 차단 효과)
  - 글 7(DRAFT, 작성자 5): 5번만 200, 나머지 404 / 글 36(HIDDEN): 1번만 200 / 글 42(삭제): 모두 404
  - 글 15(FOLLOWERS, 작성자 2): 2번 팔로워만 200
- 덤: 목록 20개를 가져올 때 SQL이 몇 번 나가는지 세기(작성자·태그 N+1)

### M2. 좋아요·취소와 동시성
- `PUT /api/posts/{id}/like`, `DELETE /api/posts/{id}/like` → `{liked, likeCount}`
- 테스트: 본인 글 400, 회원 28(정지) 403, PUT 두 번 해도 행 1개, 볼 수 없는 글 404
- 동시성: 서로 다른 회원 25명이 한 글에 동시에 PUT → `like_count`가 행 수와 같아야 한다
  - 먼저 "엔티티 읽고 +1 해서 저장"으로 짜서 깨지는 걸 확인 → `UPDATE post SET like_count = like_count + 1` 또는 락으로 고치기

### M3. 내가 좋아요한 글
- `GET /api/me/likes?size=20&cursor=` — **좋아요 누른 시각** 최신순(`post_like.created_at DESC, id DESC`), 커서 = 마지막 항목의 `(likedAt, likeId)`
- 지금 볼 수 없는 글은 뺀다
- 정답 확인(회원 12): 26개, 첫 5개 `145, 143, 140, 139, 142`, 빠지는 글 `59, 67, 105`
- 개선: `EXPLAIN` 해 보면 정렬에 인덱스를 못 쓴다 → `post_like (member_id, created_at, id)` 인덱스 추가 전후 비교

### M4. 북마크(즐겨찾기)와 폴더
- `PUT /api/posts/{id}/bookmark` `{folderId?, memo?}`, `DELETE /api/posts/{id}/bookmark`
- 폴더: `POST /api/me/bookmark-folders`, `PATCH /api/me/bookmark-folders/{id}`(이름 변경), `DELETE ...`(R3), `PATCH /api/me/bookmarks/{id}` `{folderId}`(폴더 이동)
- `GET /api/me/bookmarks?folderId=&cursor=` — 북마크한 시각 최신순. 지금 볼 수 없는 글은 **빼지 말고** `{postId, available: false}`로 내려준다(사용자가 저장한 걸 말없이 지우지 않기 — M3와 규칙이 다르다)
- 정답 확인(회원 8): 기본 폴더 6개, `사이드 프로젝트`(id 2) 7개(그중 글 108은 `available: false`), `나중에 읽기`(id 10) 5개
- 회원 6이 폴더를 하나 더 만들면 400

### M5. 피드
- `GET /api/me/feed?cursor=` — 내가 팔로우하는 사람의 글 + 내 글, PUBLISHED, R1 적용, 최신순
- 정답 확인(회원 7): 41개, 첫 5개 `145, 144, 139, 138, 137`

### M6. 인기글
- `GET /api/posts/popular?days=7` — 점수 = 기간 안 좋아요 수 × 3 + 기간 안 댓글 수(삭제 제외) × 1. 기간은 `[지금 − days, 지금)`, 비로그인 기준으로 볼 수 있는 글만, 동점은 `published_at DESC, id DESC`, 상위 10개
- 정답 확인(지금 = 2026-10-05 00:00): `145(61점), 143(61점), 144(10), 140(9), 139(5)`
  - 145와 143은 동점이라 최신인 145가 먼저
  - 누적 좋아요 1위인 글 18·55·103(각 22개)은 최근 7일 순위에 없다 → "누적 좋아요순"과 다른 결과
- SQL로 먼저 완성 → JPQL·QueryDSL·네이티브 쿼리 중 골라 옮기기

### M7. 댓글·답글
- `GET /api/posts/{id}/comments` — 최상위 댓글은 작성순, 답글은 그 아래 작성순
- 삭제된 댓글은 살아 있는 답글이 있으면 `"삭제된 댓글입니다"`로 자리를 남기고, 없으면 목록에서 뺀다(글 4의 댓글 12로 확인)
- `POST /api/posts/{id}/comments` `{content, parentId?}` — 답글의 답글은 400. 차단 관계인 회원의 댓글은 안 보인다
- 댓글 작성·삭제 때 `comment_count` 갱신

### M8. 카운트 정합성 배치
- `@Scheduled`(매일 04:00): `like_count`·`comment_count`를 실제 행 수로 맞추고, 고친 글 id를 로그로 남긴다. 두 번 돌려도 결과가 같아야 한다
- 정답 확인: `like_count` 93(6→4), 119(10→5), 120(3→4) / `comment_count` 22(9→8), 75(2→4)

### M9. 쿼리 미션 — SQL을 먼저 짜고 리포지토리로 옮기기
1. 회원별 활동 요약: 쓴 글(삭제 제외)·쓴 댓글·받은 좋아요·누른 좋아요. 활동 없는 회원(30)도 0으로 나와야 한다
2. 맞팔 목록 — 회원 2: `3, 4`
3. 나를 팔로우하지만 내가 팔로우하지 않는 회원(맞팔 추천) — 회원 2: 정지·탈퇴 회원(28, 29)을 빼면 `8, 9, 11, 12, 15, 16, 20, 21, 22, 24, 27`
4. 친구의 친구 추천: 내가 팔로우하는 사람들이 팔로우하는 사람 중 아직 안 팔로우·차단 관계 없음·본인 제외, 겹치는 수 많은 순 — 회원 7: `3(3명), 10(3명), 11(2명)`
5. 태그별 최근 30일 글 수와 받은 좋아요 합
6. 좋아요는 눌렀는데 북마크는 안 한 글(회원 12)
7. 같은 제목의 글 묶기

### M10. 일부러 고장 내고 찾기
1. M1 목록의 SQL 개수를 로그로 세고 fetch join이나 DTO 조회로 줄이기
2. M2를 "읽고 +1 저장"으로 둔 채 동시성 테스트 → 숫자가 틀어지는 걸 재현하고 원인 설명하기
3. `spring.datasource.hikari.maximum-pool-size=2` + 트랜잭션 안에 `Thread.sleep(3000)` → 동시 요청 5개로 `Connection is not available, request timed out` 재현
4. IntelliJ 브레이크포인트로 M1 상세의 열람 판정을 한 줄씩 따라가기

## 참고 문서 ([`docs/knowledge`](../docs/knowledge/README.md))
W01·W02(작업 순서·계층) · W09(DTO) · W12(인터페이스) · P19·P20(JPA 연결·매핑) · P21(QueryDSL) · W15(커서 페이징) · P18·W25(동시성) · R04·R05(SQL·인덱스) · P30(스케줄링) · V01~V05(테스트) · D05·W06·R08(디버깅·커넥션)
