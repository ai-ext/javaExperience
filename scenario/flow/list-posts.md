# 3. 게시글 목록 조회

볼 수 있는 게시글을 최신순 한 페이지로 반환하고 전체 건수와 다음 페이지 여부를 알려줍니다.

dev 게시판을 열면 방금 작성한 글을 포함한 목록을 봅니다. 전체 데이터 건수를 특정 숫자로 가정하지 않습니다.

## 시작 상태와 제공물

계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. ZIP은 중간 합류용 새 폴더 초기화 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 마세요. 현재 및 이후 기능은 미구현이므로 이후 API의 미구현 오류는 이번 과제의 실패가 아닙니다.

- 앞 과제: 게시글 작성 → 게시글 상세 조회
- 이번 구현: `src/main/java/org/example/post/PostQueryService.java`의 `list(...)` 메서드 본문 하나
- 공통 제공: Controller·DTO·인증·예외 처리·Repository·Entity·가시성 정책·검증/태그 helper
- 이후 미구현: 게시글 부분 수정 · 게시글 삭제
- [중간 합류용 시작 패키지](packages/list.zip) · [공통 3-2 참고 완성본](packages/reference.zip)

코드를 수정했다면 기존 bootRun 터미널에서 Ctrl+C로 앱만 종료하고 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다. DB·Compose·작성 응답 id는 유지합니다.

## 구현할 일

1. boardSlug로 게시판을 찾고 없으면 404 예외를 던집니다.
2. viewer가 없으면 viewerId=null로 정합니다.
3. publishedAt DESC, id DESC 순서의 PageRequest를 만듭니다.
4. 제공된 findViewableByBoard와 countViewableByBoard를 같은 조건으로 모두 호출합니다.
5. toListItem과 PostListResponse로 items·page·size·totalElements·totalPages·hasNext를 반환합니다.

## 기능 계약

`GET /api/boards/{slug}/posts` → **200**

토큰 없이 조회할 수 있습니다. 선택 토큰이 있으면 그 회원의 가시성으로 조회합니다.

page 기본값은 0이고 0 이상이어야 합니다. size 기본값은 10이며 1~50입니다. 게시판이 없으면 404입니다. 목록은 PUBLISHED·미삭제 글만 대상으로 하고 PUBLIC/본인/팔로우 및 양방향 차단 조건을 쿼리에 적용합니다. 작성자의 임시저장 글이나 운영자가 볼 수 있는 숨김 글도 일반 목록에는 포함하지 않습니다.

publishedAt DESC, id DESC로 정렬합니다. 목록과 COUNT의 조건을 맞추고 둘 다 명시적으로 실행합니다. items에는 본문 content가 없으며 목록 GET은 조회수와 시각을 포함한 DB 값을 변경하지 않습니다.

기존 2-2 원문의 14건은 이전 버전의 fixture 설명입니다. 최종 3-2와 현재 DB의 건수를 고정 14로 채점하지 않습니다. fetch join·태그 배치 로딩은 제공되며 쿼리 수나 처리 속도는 실제 측정 없이 결과처럼 쓰지 않습니다.

### 보낼 요청

작성한 dev 게시판을 조회합니다. 실제 건수는 DB에 따라 달라집니다.

```http
GET /api/boards/{slug}/posts?page=0&size=10

```

`{slug}`는 앞서 작성한 게시판 `dev`로 바꿉니다.

## 완료 기준

- 200과 items·페이지 메타데이터를 반환하고 본문 content는 목록 항목에서 제외합니다.
- PUBLISHED·미삭제·게시판·공개/본인/팔로우·양방향 차단 조건을 DB 쿼리에 적용합니다.
- publishedAt DESC, id DESC로 정렬하고 같은 조건의 전체 건수를 구합니다.
- 목록 조회는 글의 조회수·시각·내용을 변경하지 않습니다.

성공 응답 필드: `items[].id`, `items[].title`, `items[].author.id`, `items[].author.nickname`, `items[].tags`, `items[].likeCount`, `items[].commentCount`, `items[].viewCount`, `items[].publishedAt`, `page`, `size`, `totalElements`, `totalPages`, `hasNext`

실패 응답: `400` page<0 또는 size가 1..50 밖 · `404` 게시판 없음 · `401/403` 선택 토큰 오류·비활성 회원

## 결과를 확인하는 방법

실제 요청 전에 비교할 값을 기록합니다. 아래 SQL은 검산용 SELECT이며 실제 Hibernate 실행 로그가 아닙니다. 별도 DB 클라이언트의 새 autocommit SELECT로 확인합니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.

:capturedId는 실제 응답 id로 바꿉니다. 목록의 :boardSlug는 따옴표를 포함한 게시판 값(예: 'dev'), :viewerId는 토큰 회원 id 또는 NULL, :size와 :offset은 숫자입니다. :offset은 page × size입니다. 화면은 이 SQL을 자동 실행하지 않습니다.

### 목록과 같은 조건 · 전체 건수

같은 게시판·조회자에서 응답 totalElements와 비교합니다. 익명은 :viewerId를 NULL로, 로그인은 토큰 회원의 실제 id로 바꿉니다. 건수가 고정 14라고 가정하지 않습니다.

```sql
SELECT COUNT(*) AS total_elements
FROM post p
WHERE p.board_id = (SELECT id FROM board WHERE slug = :boardSlug)
  AND p.deleted_at IS NULL
  AND p.status = 'PUBLISHED'
  AND (
    p.visibility = 'PUBLIC'
    OR (:viewerId IS NOT NULL AND p.author_id = :viewerId)
    OR (:viewerId IS NOT NULL AND EXISTS (
      SELECT 1 FROM follow f
      WHERE f.follower_id = :viewerId AND f.followee_id = p.author_id
    ))
  )
  AND (
    :viewerId IS NULL OR NOT EXISTS (
      SELECT 1 FROM member_block b
      WHERE (b.blocker_id = :viewerId AND b.blocked_id = p.author_id)
         OR (b.blocked_id = :viewerId AND b.blocker_id = p.author_id)
    )
  );
```

### 같은 조건 · 정렬된 글 id

응답 items의 id 순서를 비교합니다. :offset은 page × size입니다. API와 DB 조회 사이에 데이터가 바뀌면 같은 시점의 결과가 아니므로 조용한 실습 DB에서 비교합니다.

```sql
SELECT p.id, p.title, p.published_at
FROM post p
WHERE p.board_id = (SELECT id FROM board WHERE slug = :boardSlug)
  AND p.deleted_at IS NULL
  AND p.status = 'PUBLISHED'
  AND (
    p.visibility = 'PUBLIC'
    OR (:viewerId IS NOT NULL AND p.author_id = :viewerId)
    OR (:viewerId IS NOT NULL AND EXISTS (
      SELECT 1 FROM follow f
      WHERE f.follower_id = :viewerId AND f.followee_id = p.author_id
    ))
  )
  AND (
    :viewerId IS NULL OR NOT EXISTS (
      SELECT 1 FROM member_block b
      WHERE (b.blocker_id = :viewerId AND b.blocked_id = p.author_id)
         OR (b.blocked_id = :viewerId AND b.blocker_id = p.author_id)
    )
  )
ORDER BY p.published_at DESC, p.id DESC
LIMIT :size OFFSET :offset;
```

### 목록 요청 전·후 · 글 값 유지

목록 GET 전·후의 같은 글을 비교합니다. view_count·시각·내용이 모두 같습니다.

```sql
SELECT id, board_id, author_id, title, content, status, visibility,
       view_count, like_count, comment_count,
       created_at, updated_at, published_at, deleted_at
FROM post
WHERE id = :capturedId;
```

### 각 완료 항목의 확인 근거

- 200과 items·페이지 메타데이터를 반환하고 본문 content는 목록 항목에서 제외합니다.
  확인: 응답: items와 페이지 메타데이터를 보고 각 items에 content가 없는지 확인합니다.
- PUBLISHED·미삭제·게시판·공개/본인/팔로우·양방향 차단 조건을 DB 쿼리에 적용합니다.
  확인: 조건 비교: 아래 SQL에서 API와 같은 viewerId·boardSlug로 검산합니다. 익명/본인/팔로우/양방향 차단별 fixture가 없으면 코드 대조까지만 한 상태입니다.
- publishedAt DESC, id DESC로 정렬하고 같은 조건의 전체 건수를 구합니다.
  확인: DB·응답: 같은 조건 COUNT와 정렬 id를 비교합니다. page=0/size=1 뒤 page=1/size=1을 각각 요청해 순서·hasNext도 봅니다.
- 목록 조회는 글의 조회수·시각·내용을 변경하지 않습니다.
  확인: DB: 목록 요청 전·후의 글 한 행이 같은지 비교합니다. 비교를 위해 상세 GET을 호출하면 그 GET이 조회수를 쓰므로 사용하지 않습니다.

## 필요한 개념

- [S10 · 페이징 계약](../../docs/knowledge/S10-spring-data-query.md#페이징은-정렬과-건수-계산의-계약이다) — 조건·정렬·COUNT를 함께 판단합니다.
- [W15 · OFFSET 페이징](../../docs/knowledge/W15-paging-offset-vs-cursor.md) — 현재 페이지 번호 방식의 선택을 이해합니다.
- [S09 · LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1) — 제공된 fetch join·배치 로딩의 역할을 확인합니다.

## 원문과 기술 정본

다섯 과제는 [3-2 manifest](../snapshots/3-2.json)의 파일별 blob 한 버전으로 연결합니다. manifest의 기록 commit으로 추출한 소스는 통합 blob 내용과 다르므로 참고 완성본을 대체하지 않습니다. 아래 원문은 보존된 설명·검증 자료이고, 앞 단계의 고정 id·시드 수를 이 과제의 현재 결과로 복사하지 않습니다.

- [2-2 · 게시판 목록](../ch2-read-post/2-2-board-list.md#만들-것) — 페이지 메타데이터의 기초 설명이며 고정 시드 수는 재사용하지 않습니다.
- [2-3 · 가시성](../ch2-read-post/2-3-visibility.md#만들-것) — 최종 목록의 공개·차단 정책 배경입니다.
- [2-4 · N+1](../ch2-read-post/2-4-n-plus-1.md#만들-것) — 기능 완성 후 확인할 조회 성능 확장입니다.

다음: [게시글 부분 수정](update-post.md)
