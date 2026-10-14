# 시나리오 — 게시판 API를 단계별로 키우며 만들기

이 공개 저장소에는 **101개 단계의 요구사항과 HTML**, 각 단계의 구현 가이드·역할별 전체 코드 접기, JPA/MyBatis 대체 코드, 쿼리 연습 18개가 들어 있다. GitHub 로그인 없이 저장소를 다운로드해 따라갈 수 있다. 정답 코드는 직접 구현해 본 뒤 접기를 열어 비교한다.

**처음 시작하기:** [0-1 Java 첫 API부터](ch0-first-steps/0-1-ts-to-java.md) · [바로 게시글 API 만들기](ch1-create-post/1-1-receive-request.md) · [진행 방법 보기](#진행-방법)

각 단계에서 API 서버 주소를 확인하고 요청 버튼을 누르면 브라우저에서 응답을 볼 수 있다.

## 목차

<!-- toc:start — tools/site/build.mjs가 scenario.json으로 다시 쓴다. 직접 고치지 마라 -->
### 0장. 백엔드 첫걸음 — /api/start

백엔드가 처음이면 여기부터. /api/start 아래에 작은 API를 하나씩 만들며 Java·Spring 기본기를 익힌다 — 타입과 생성자, 어노테이션, 요청의 네 자리, DTO 규칙, 에러 로그 읽기, Gradle·설정 파일. 단계마다 완성 코드를 따라 치고, 일부러 망가뜨려 실제 에러를 읽는다.

- [0-1. Java로 첫 API — 타입·변수·클래스·생성자·record · 기초](ch0-first-steps/0-1-ts-to-java.md)
- [0-2. 어노테이션은 무엇인가 — 떼어 보면 404 · 기초](ch0-first-steps/0-2-annotations.md)
- [0-3. 요청의 네 자리 — 경로·쿼리·헤더·본문 · 기초](ch0-first-steps/0-3-request-four-places.md)
- [0-4. DTO 만들기 — record·static·기본 생성자 · 기초](ch0-first-steps/0-4-dto-rules.md)
- [0-5. 에러 읽기 — 스택트레이스에서 내 코드 찾기 · 기초](ch0-first-steps/0-5-read-stack-trace.md)
- [0-6. Gradle 의존성과 application.yml 읽기 · 기초](ch0-first-steps/0-6-gradle-and-yml.md)
- [0-7. Lombok DTO — 생성된 메서드와 JSON 확인 · 기초](ch0-first-steps/0-7-lombok-dto.md)
- [0-8. Java 선언식으로 API 읽기 — 타입·변수·메서드 · 기초](ch0-first-steps/0-8-java-types-and-methods.md)

### 1장. 게시글 작성 — POST /api/posts

같은 API 하나를 "success만 돌려주기"에서 시작해 JPA로 DB에 저장하고 201 응답 → 서비스로 나누기 → 엔티티·테이블 맞추기 → 검증 → 토큰 인증까지 키운다. 백엔드 API 하나가 만들어지는 순서 그대로다.

- [1-1. 요청 받기 — 일단 success · 기초](ch1-create-post/1-1-receive-request.md)
- [1-2. DB에 저장하고 201로 응답 — JPA 첫걸음 · 기초](ch1-create-post/1-2-dto-response.md)
- [1-3. 서비스로 나누기 — 태그까지 한 트랜잭션으로 · 기초](ch1-create-post/1-3-service-layer.md)
- [1-4. 엔티티와 테이블 정확히 맞추기 — 컬럼·NOT NULL·기본값 · 기초](ch1-create-post/1-4-save-to-db.md)
- [1-5. 입력 검증과 에러 응답 · 기초](ch1-create-post/1-5-validation.md)
- [1-6. 토큰으로 작성자 정하기 · 중급](ch1-create-post/1-6-token-auth.md)
- [1-7. DB 직접 조작 — 여러 테이블과 트랜잭션 · 중급](ch1-create-post/1-7-direct-db-dml.md)
- [1-8. 기존 글 복사 생성 — 경로·쿼리·본문을 함께 · 중급](ch1-create-post/1-8-copy-post.md)
- [1-9. 글의 태그 목록 조회 — 제네릭과 Stream · 중급](ch1-create-post/1-9-list-post-tags.md)

### 2장. 게시글 조회 — GET /api/posts

단건 조회부터 게시판 목록·페이징, "이 사람이 볼 수 있는 글만" 규칙, 쿼리 수 줄이기까지. 조회 API는 토큰 없이도 되고, 토큰이 있으면 그 회원 기준으로 판단한다.

- [2-1. 단건 조회와 404 · 기초](ch2-read-post/2-1-get-one.md)
- [2-2. 게시판 목록과 페이징 · 기초](ch2-read-post/2-2-board-list.md)
- [2-3. 볼 수 있는 글만 — 임시저장·삭제·숨김·팔로워·차단 · 중급](ch2-read-post/2-3-visibility.md)
- [2-4. 쿼리 수 줄이기(N+1) · 고급](ch2-read-post/2-4-n-plus-1.md)
- [2-5. JPA 쿼리 작성 — 예시에서 JOIN까지 · 중급](ch2-read-post/2-5-guided-jpa-query.md)

### 3장. 게시글 수정·삭제

PUT 전체 교체와 PATCH 부분 수정 뒤 본인 글을 지운다. 지운 글은 행을 남기고(soft delete) 조회에서만 숨긴다.

- [3-0. PUT으로 게시글 전체 교체 · 기초](ch3-update-delete/3-0-put-replace.md)
- [3-1. 부분 수정(PATCH)과 본인 확인 · 기초](ch3-update-delete/3-1-patch.md)
- [3-2. 삭제 — soft delete · 기초](ch3-update-delete/3-2-soft-delete.md)

### 4장. 좋아요

몇 번 눌러도 결과가 같은 좋아요, 동시에 눌러도 맞는 숫자, 내가 좋아요한 글 목록(커서 페이징).

- [4-0. 좋아요 설정 — 관계 행 하나와 숫자 하나 · 기초](ch4-like/4-0-set-like.md)
- [4-1. 좋아요·취소(멱등) · 중급](ch4-like/4-1-like-toggle.md)
- [4-2. 동시에 눌러도 맞는 like_count · 고급](ch4-like/4-2-like-concurrency.md)
- [4-3. 내가 좋아요한 글 — 커서 페이징 · 중급](ch4-like/4-3-my-likes.md)

### 5장. 댓글·답글

최상위 댓글 DTO 조회에서 시작해 댓글·답글 저장, 지운 댓글 자리 남기기, 댓글 수 맞추기로 확장한다.

- [5-0. 댓글 목록 — DB 행을 응답 DTO로 · 기초](ch5-comment/5-0-comment-list.md)
- [5-1. 댓글 작성 · 기초](ch5-comment/5-1-create-comment.md)
- [5-2. 답글(1단계까지) · 중급](ch5-comment/5-2-reply.md)
- [5-3. 댓글 목록과 삭제 · 중급](ch5-comment/5-3-comment-list-delete.md)

### 6장. 북마크(즐겨찾기)

북마크와 폴더, 내 북마크 목록. 볼 수 없게 된 글을 "빼지 않고 표시"하는 점이 좋아요 목록과 다르다.

- [6-0. 북마크 설정 — 내 글과 폴더까지 · 기초](ch6-bookmark/6-0-set-bookmark.md)
- [6-1. 북마크 추가·삭제 · 중급](ch6-bookmark/6-1-bookmark.md)
- [6-2. 폴더 — 최대 10개, 이름 중복 불가 · 중급](ch6-bookmark/6-2-folders.md)
- [6-3. 내 북마크 목록 · 중급](ch6-bookmark/6-3-my-bookmarks.md)
- [6-4. 북마크 메모 부분 수정 — 생략과 null 구분 · 중급](ch6-bookmark/6-4-patch-bookmark-memo.md)
- [6-5. 내가 표시한 글 — 좋아요·북마크 조건 조합 · 고급](ch6-bookmark/6-5-my-marked-posts.md)

### 7장. 테스트로 지키기

지금까지 만든 API를 계층별 테스트로 고정한다. 결과 테스트는 여러분이 쓴 테스트를 실행해 보고 리뷰한다.

- [7-1. 컨트롤러 슬라이스 테스트 · 중급](ch7-tests/7-1-controller-slice.md)
- [7-2. 서비스 단위 테스트 — mock과 spy · 중급](ch7-tests/7-2-service-unit.md)
- [7-3. 통합 테스트 — Testcontainers · 고급](ch7-tests/7-3-integration.md)

### 8장. 쿼리 심화 — 학습용 데이터(practice)

글 145·좋아요 568에 함정이 섞인 학습용 DB로, SQL을 먼저 짜고 API로 옮긴다. 집계·랭킹·관계·조합 검색·정합성 배치.

- [8-1. 회원별 활동 요약 — LEFT JOIN과 집계 · 고급](ch8-query-deep/8-1-activity-summary.md)
- [8-2. 최근 N일 인기글 랭킹 — 조건부 집계와 고정 시계 · 고급](ch8-query-deep/8-2-popular-ranking.md)
- [8-3. 관계 쿼리 — 맞팔·맞팔 추천·친구의 친구 · 고급](ch8-query-deep/8-3-relations.md)
- [8-4. 조합 검색 — 동적 쿼리 · 고급](ch8-query-deep/8-4-dynamic-search.md)
- [8-5. 정합성 배치 — 어긋난 숫자 찾아 고치기 · 고급](ch8-query-deep/8-5-recount-batch.md)

### 9장. 스키마 변경 — 데이터가 이미 있을 때

운영 중인 DB를 가정하고 Flyway로 스키마를 바꾼다. 인덱스, 컬럼 추가와 백필, 새 테이블, 서비스를 멈추지 않는 이름 변경.

- [9-1. Flyway 도입 — 지금 스키마를 기준선으로 · 고급](ch9-schema-change/9-1-flyway.md)
- [9-2. 인덱스와 실행 계획 · 고급](ch9-schema-change/9-2-index-explain.md)
- [9-3. 컬럼 추가와 백필 · 고급](ch9-schema-change/9-3-add-column-backfill.md)
- [9-4. 새 테이블과 API — 알림 · 고급](ch9-schema-change/9-4-notifications.md)
- [9-5. 서비스를 멈추지 않는 이름 변경 — expand와 contract · 고급](ch9-schema-change/9-5-expand-contract.md)

### 11장. 게시글 심화 — 임시저장·이미지·조회수·검색·휴지통·이력

9장까지 만든 레포를 이어서 쓴다. 글 하나에 실무에서 바로 붙는 기능 — 임시저장 뒤 발행, 이미지 첨부, 같은 사람은 하루 한 번만 세는 조회수, 제목·본문·작성자 통합 검색, 지운 글 휴지통과 복구, 수정 이력. 형식이 틀린 값도 어느 필드인지 알려 주는 공통 예외 처리를 여기서 한 번 고친다.

- [11-1. 임시저장했다가 발행하기 · 중급](ch11-post-advanced/11-1-draft-publish.md)
- [11-2. 글에 이미지 첨부 · 중급](ch11-post-advanced/11-2-image-upload.md)
- [11-3. 조회수 — 같은 사람은 하루 한 번 · 중급](ch11-post-advanced/11-3-view-count.md)
- [11-4. 통합 검색 — 제목·본문·작성자 · 고급](ch11-post-advanced/11-4-search.md)
- [11-5. 휴지통 — 지운 글 모아 보기와 복구 · 중급](ch11-post-advanced/11-5-trash-restore.md)
- [11-6. 글 수정 이력 · 중급](ch11-post-advanced/11-6-revisions.md)

### 12장. 소통 확장 — 수정·멘션·알림함·팔로우·신고

사람 사이의 기능을 붙인다. 댓글 수정과 "수정됨", @닉네임 멘션 알림, 안 읽은 수·전부 읽음·커서가 있는 알림함, 팔로우와 뮤트한 피드, 신고. 학습용 DB(practice)의 고정 시계에서 커서·동시 요청이 어떻게 깨지는지 본다.

- [12-1. 댓글 수정 — "수정됨" 표시 · 중급](ch12-community-features/12-1-comment-edit.md)
- [12-2. 댓글 멘션 알림 — @닉네임 · 중급](ch12-community-features/12-2-mention-notification.md)
- [12-3. 알림함 — 안 읽은 수·전부 읽음·커서 · 중급](ch12-community-features/12-3-notification-inbox.md)
- [12-4. 팔로우·언팔로우 · 중급](ch12-community-features/12-4-follow.md)
- [12-5. 팔로잉 피드 — 뮤트 · 고급](ch12-community-features/12-5-feed-mute.md)
- [12-6. 신고하기 · 중급](ch12-community-features/12-6-report.md)

### 13장. 운영 기능 — 역할·신고 처리·정지·금칙어·도배 방지

운영자가 쓰는 기능. 역할→권한 표와 모더레이터, 쌓인 신고 처리, 기간 정지, 금칙어(거절·가리기), 1분 5개를 넘으면 429와 Retry-After, 신고 내역 CSV, Swagger UI 문서. 실제로 흐르는 시간이 필요해서 시나리오 DB(community)로 돌아온다.

- [13-1. 운영 역할 — 모더레이터와 글 숨김·복구 · 중급](ch13-operations/13-1-roles-and-hide.md)
- [13-2. 신고 처리 · 고급](ch13-operations/13-2-report-handling.md)
- [13-3. 작성자 기간 정지 · 중급](ch13-operations/13-3-member-suspension.md)
- [13-4. 금칙어 필터 · 중급](ch13-operations/13-4-banned-words.md)
- [13-5. 도배 방지 — 429 · 중급](ch13-operations/13-5-rate-limit.md)
- [13-6. 신고 내역 CSV 내려받기 · 고급](ch13-operations/13-6-csv-export.md)
- [13-7. API 문서 — Swagger UI · 중급](ch13-operations/13-7-api-docs.md)

### 14장. 게시글로 더 만들기 — 공감·투표·고정·시리즈·추천

게시글 하나로 만들 수 있는 것을 더한다. 공감 종류, 한 사람 한 표 투표, 게시판마다 3개 상단 고정, 시리즈와 이전/다음 글, 최근 본 글 20개, 태그로 고르는 관련 글, 월별 아카이브, 읽기 전용 폴더 공유 링크. 볼 수 있는 글 규칙(2-3)을 새 기능마다 다시 쓰지 않고 재사용한다.

- [14-1. 공감 종류 — 👍❤️😂😢 중 하나만 · 중급](ch14-more-with-posts/14-1-reactions.md)
- [14-2. 글 투표 — 한 사람 한 표 · 중급](ch14-more-with-posts/14-2-polls.md)
- [14-3. 공지·상단 고정 글 — 게시판마다 3개까지 · 중급](ch14-more-with-posts/14-3-pinned-posts.md)
- [14-4. 시리즈(연재) — 글 묶기와 이전/다음 글 · 중급](ch14-more-with-posts/14-4-series.md)
- [14-5. 최근 본 글 — 내 기록 20개 · 중급](ch14-more-with-posts/14-5-recent-views.md)
- [14-6. 관련 글 추천 — 태그가 많이 겹치는 순 · 고급](ch14-more-with-posts/14-6-related-posts.md)
- [14-7. 월별 아카이브 — 연·월별 글 수와 그 달의 글 · 고급](ch14-more-with-posts/14-7-monthly-archive.md)
- [14-8. 폴더 공유 링크 — 읽기 전용 · 고급](ch14-more-with-posts/14-8-shared-folder.md)

### 15장. 스케줄링·배치로 게시판 돌리기

사람이 누르지 않아도 도는 일. 매일 0시 명예의 전당, 주간 랭킹 스냅샷, 1분마다 도는 예약 발행, 1000건씩 끊어 지우는 휴지통 비우기, 좋아요 달성 축하 알림, 실행 기록과 실패한 날만 다시 돌리기. 고정 시계(practice)에서 "그때 돌았다면"을 기준일 파라미터로 재현한다.

- [15-1. 명예의 전당 — 매일 0시 배치와 멱등 · 고급](ch15-scheduling-batch/15-1-hall-of-fame.md)
- [15-2. 주간 랭킹 스냅샷 — 기간 경계와 그때의 값 · 고급](ch15-scheduling-batch/15-2-weekly-ranking-snapshot.md)
- [15-3. 예약 발행 — 1분마다 도는 상태 전이 배치 · 고급](ch15-scheduling-batch/15-3-scheduled-publish.md)
- [15-4. 휴지통 비우기 — 자식 먼저, 1000건씩 · 고급](ch15-scheduling-batch/15-4-trash-purge.md)
- [15-5. 좋아요 달성 축하 알림 — 한 단계에 한 번만 · 고급](ch15-scheduling-batch/15-5-like-milestone.md)
- [15-6. 배치 실행 기록과 다시 돌리기 · 고급](ch15-scheduling-batch/15-6-job-runs-retry.md)

### 16장. 이벤트·비동기·캐시·외부 호출

글쓰기 요청 바깥에서 일어나는 일. 커밋된 뒤에만 보내는 새 글 알림, 느린 발송을 요청에서 떼어 내는 비동기, 60초 인기글 캐시와 즉시 무효화, 2초만 기다리는 외부 링크 미리보기.

- [16-1. 새 글 알림 — 커밋된 뒤에만 보내기 · 고급](ch16-events-async-cache/16-1-new-post-event.md)
- [16-2. 알림을 비동기로 — 느린 발송이 글쓰기를 막지 않게 · 고급](ch16-events-async-cache/16-2-async-notification.md)
- [16-3. 인기글 캐시 — 60초 동안 재사용, 숨기면 바로 빼기 · 고급](ch16-events-async-cache/16-3-popular-cache.md)
- [16-4. 링크 미리보기 — 외부 사이트가 느려도 2초만 기다리기 · 고급](ch16-events-async-cache/16-4-link-preview.md)

### 10장. 명세서 프로젝트 — 게시판 API v1(/api/v1)

회사에서 받은 명세서 한 장을 읽고 새 Spring 프로젝트를 빈 폴더에서 처음부터 만든다. project DB와 Flyway V1, 공통 응답 틀, 회원 가입·JWT 로그인, 게시글(JPA 쓰기·MyBatis 목록), 댓글, 좋아요까지 명세서의 표대로 채우고, 마지막에는 토글의 멱등 문제와 JPA·MyBatis를 한 트랜잭션에서 섞을 때의 flush를 직접 겪는다.

- [10-1. 새 프로젝트 시작 — 명세서 읽기, project DB·Flyway, 헬스 체크 · 기초](ch10-project/10-1-new-project.md)
- [10-2. 공통 응답 틀과 전역 예외 처리 · 기초](ch10-project/10-2-common-response.md)
- [10-3. 회원 가입 — BCrypt 해시와 이메일 중복 409 · 중급](ch10-project/10-3-signup.md)
- [10-4. 로그인과 JWT — 인터셉터와 @LoginUser, 내 정보 · 중급](ch10-project/10-4-login-jwt.md)
- [10-5. 게시글 작성 — JPA, 검증 규칙·태그·작성자는 토큰 주인 · 기초](ch10-project/10-5-create-post.md)
- [10-6. 게시글 상세 — 조회수·작성자·태그·댓글을 한 번에, N+1 없이 · 기초](ch10-project/10-6-post-detail.md)
- [10-7. 목록 — 최신·인기·페이지·커서·태그·검색, JPA(JPQL·Pageable) · 중급](ch10-project/10-7-post-list.md)
- [10-8. 수정(PUT 전체 교체)과 삭제(soft) — 작성자 검증 403 · 중급](ch10-project/10-8-update-delete.md)
- [10-9. 댓글 — 작성·목록(답글 트리)·삭제 · 중급](ch10-project/10-9-comments.md)
- [10-10. 좋아요 토글 · 중급](ch10-project/10-10-like-toggle.md)
- [10-11. 토글의 문제 — 멱등 PUT/DELETE를 v2로 나란히 · 중급](ch10-project/10-11-idempotent-like.md)
- [10-12. JPA로 쓰고 같은 트랜잭션에서 MyBatis로 읽기 — flush (선택) · 고급](ch10-project/10-12-jpa-mybatis-flush.md)
<!-- toc:end -->

## 진행 방법

1. 레포 루트에서 `docker compose up -d`로 DB를 띄우고 IntelliJ에서 `Main`을 실행한다([README의 실행](../README.md#실행)).
2. 목차에서 장·단계를 골라 **화면 시나리오 → 요청·응답 계약 → 구현 가이드** 순서로 읽는다. 화면 시나리오의 각 흐름을 펼치면 사용자 행동, HTTP, 서버, DB, 응답이 차례대로 보인다.
3. 직접 구현하고 `직접 확인`의 요청 버튼으로 HTTP 동작을 확인한다. SQL·테스트 등 수동 확인은 해당 단계 지시를 따른다. 막힐 때만 역할별 전체 코드 접기와 필요한 지식 문서를 연다.
4. 결과 테스트 프롬프트를 Codex 또는 Claude Code에 붙여 넣어 해당 단계의 계약을 검토한다. GitHub 로그인은 필요하지 않다.
5. 단계별로 커밋하고 이전·다음 링크로 진행한다. 본편은 9-5 다음에 11-1로 이어지며, 10장은 별도 명세서 프로젝트다.

> 단계가 진행되며 같은 API의 응답 계약이 확장된다. 이전 단계의 채점이 나중에 실패할 수 있다. `community`, `practice`, `project`는 서로 다른 DB이므로 DB를 바꾼 뒤에는 이전 글 ID를 그대로 사용할 수 없다.

- **작업 브랜치** — 각자 새 브랜치를 만들어 구현한다. 공개 저장소를 읽거나 다운로드할 때는 계정이 필요하지 않다. 원격에 push하거나 PR을 보낼 때는 GitHub 계정과 권한이 필요하다.
- **DB 초기화** — `docker compose down -v && docker compose up -d`는 로컬 실습 데이터를 모두 지운다. 필요한 데이터를 먼저 보관한다.

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

## 쿼리 설계 18개 연습

기존 게시판 기능으로 만든 데이터를 같은 ID로 계속 조회하고 검색한다. [L12: 파생 쿼리·MyBatis 8개](labs/l12-query-methods/README.md) → [L13: `@Query`·동적 SQL 6개](labs/l13-declared-queries/README.md) → [L14: QueryDSL 4개](labs/l14-querydsl-extension/README.md) 순서다.

각 Q 시나리오에 Controller·Service·DTO·Repository·Mapper 코드 접기가 있다. 이 연습용 완성 프로젝트는 `python3 tools/materialize-query-practice.py --output /tmp/query-practice`로 별도 폴더에 복원할 수 있다.



## 브라우저에서 API 요청 보내기

HTML 파일을 직접 열면(`file://`) 요청이 막힐 수 있다. 저장소 루트에서 아래 명령을 실행해 HTTP로 연다.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

그다음 `http://127.0.0.1:8765/scenario/README.html`을 연다. API 서버(기본 `http://localhost:8080`)의 CORS 설정에서 페이지 출처 `http://127.0.0.1:8765`를 허용해야 한다.
