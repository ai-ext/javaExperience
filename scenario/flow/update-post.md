# 4. 게시글 부분 수정

작성자가 보낸 값만 검증해 바꾸고, 생략·null·빈 태그 배열의 의미를 구분합니다.

작성한 글의 제목만 고칩니다. 본문과 태그는 유지하며, 태그를 전부 떼려면 별도로 빈 배열을 보냅니다.

## 시작 상태와 제공물

계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. ZIP은 중간 합류용 새 폴더 초기화 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 마세요. 현재 및 이후 기능은 미구현이므로 이후 API의 미구현 오류는 이번 과제의 실패가 아닙니다.

- 앞 과제: 게시글 작성 → 게시글 상세 조회 → 게시글 목록 조회
- 이번 구현: `src/main/java/org/example/post/PostService.java`의 `patch(...)` 메서드 본문 하나
- 공통 제공: Controller·DTO·인증·예외 처리·Repository·Entity·가시성 정책·검증/태그 helper
- 이후 미구현: 게시글 삭제
- [중간 합류용 시작 패키지](packages/update.zip) · [공통 3-2 참고 완성본](packages/reference.zip)

코드를 수정했다면 기존 bootRun 터미널에서 Ctrl+C로 앱만 종료하고 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다. DB·Compose·작성 응답 id는 유지합니다.

## 구현할 일

1. 글을 찾고 canView 실패를 404로 처리한 다음 작성자 여부를 검사합니다.
2. 제목·본문·태그·공개 범위가 non-null일 때만 제공된 validate helper로 검사합니다.
3. 검사한 값만 changeTitle/changeContent/replaceTags/changeVisibility로 변경합니다.
4. tags가 []이면 연결을 비웁니다. null이나 생략이면 태그를 유지합니다.
5. 성공한 요청은 빈 객체여도 touchUpdatedAt(now)를 호출하고 필요한 연관을 읽어 Post를 반환합니다.

## 기능 계약

`PATCH /api/posts/{id}` → **200**

유효한 작성자 토큰이 필요합니다. 볼 수 있는 남의 글은 403, 볼 수 없는 글은 404입니다.

title·content·tags·visibility의 생략과 null은 모두 유지입니다. tags=[]는 모든 태그 연결을 해제합니다. tag 원본 행은 지우지 않습니다. boardSlug와 authorId는 DTO 필드가 아니므로 글의 게시판과 작성자를 변경하지 않습니다.

보낸 non-null 값만 검증합니다. title은 공백 불가·1~200자, content는 공백 불가입니다. tags는 최대 5개이고 각 원소는 null/공백 불가·30자 이하입니다. visibility는 PUBLIC 또는 FOLLOWERS입니다. 검증에서 처음 실패한 필드가 오류가 되며 JSON 파싱 오류에는 같은 errors 필드가 없을 수 있습니다.

canView를 통과한 뒤 작성자 여부를 검사합니다. ADMIN이라는 이유만으로 남의 글을 수정할 수 없습니다. {}나 모든 필드가 null인 성공 요청도 updated_at을 갱신합니다. PATCH 자체는 조회수를 올리지 않습니다. 나중 필드 검증이 실패하면 앞서 바꾼 메모리 값도 DB에는 저장되지 않습니다. rollback은 DB 변경을 취소하며 이미 바뀐 Java 객체를 자동으로 원복한다는 뜻은 아닙니다.

정적 상태 설명은 기본 제목 수정과 tags=[] 예시 범위입니다. 제목·태그 객체 변경 장면은 flush 전이고, 별도의 commit 장면에서 기본 제목 요청의 확정 결과를 비교합니다. 다른 PATCH 본문은 요청 옵션으로 계산한 모델을 확인합니다. 상태를 순서대로 모두 통과할 필요는 없습니다.

화면의 t1>t0는 설명 가정입니다. 서버는 성공 요청에서 touchUpdatedAt(now)를 호출하지만 실제 updated_at이 항상 이전과 다른 시각이라는 보장은 없습니다.

### 보낼 요청

앞서 작성한 글의 제목을 바꿉니다. 실제 작성 응답에서 받은 id로 요청하세요.

```http
PATCH /api/posts/{id}
Authorization: Bearer tok-kimjava
Content-Type: application/json

{
  "title": "수정한 제목"
}
```

`{id}`는 앞 POST 응답에서 기록한 `capturedId`로 바꿉니다.

## 완료 기준

- 보낸 non-null 값만 변경되고 생략/null인 필드는 유지됩니다.
- tags=[]는 post_tag 연결만 없애며 기존 tag 행은 삭제하지 않습니다.
- canView → 작성자 순서로 검사합니다. ADMIN도 남의 글 수정 권한은 없습니다.
- 나중 필드 검증이 실패해도 앞서 바꾼 객체 값을 DB에 일부 저장하지 않습니다.
- {}와 all-null 성공 요청도 updated_at은 갱신하고 조회수는 올리지 않습니다.

성공 응답 필드: `id`, `boardSlug`, `title`, `content`, `tags`, `visibility`, `author.id`, `author.nickname`, `viewCount`, `likeCount`, `commentCount`, `createdAt`

실패 응답: `400` 검증 실패(첫 필드 오류) 또는 JSON·타입 오류 · `401` 인증 없음·오류 · `403` 비활성 회원 또는 볼 수 있으나 작성자 아님 · `404` 없는 글·삭제 글·볼 수 없는 글

## 결과를 확인하는 방법

실제 요청 전에 비교할 값을 기록합니다. 아래 SQL은 검산용 SELECT이며 실제 Hibernate 실행 로그가 아닙니다. 별도 DB 클라이언트의 새 autocommit SELECT로 확인합니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.

:capturedId는 실제 응답 id로 바꿉니다. 목록의 :boardSlug는 따옴표를 포함한 게시판 값(예: 'dev'), :viewerId는 토큰 회원 id 또는 NULL, :size와 :offset은 숫자입니다. :offset은 page × size입니다. 화면은 이 SQL을 자동 실행하지 않습니다.

### PATCH 전·후 · 보낸 필드와 유지 값

보낸 non-null 값은 반영되고 생략/null인 값은 유지됩니다. updated_at에는 서버 now를 대입하며 조회수는 증가하지 않습니다.

```sql
SELECT id, board_id, author_id, title, content, status, visibility,
       view_count, like_count, comment_count,
       created_at, updated_at, published_at, deleted_at
FROM post
WHERE id = :capturedId;
```

### PATCH 전·후 · 글과 태그의 연결

tags 생략/null은 같은 연결, []는 연결 0개, 값 배열은 중복을 제거한 이름 집합인지 비교합니다.

```sql
SELECT pt.post_id, t.id AS tag_id, t.name
FROM post_tag pt
JOIN tag t ON t.id = pt.tag_id
WHERE pt.post_id = :capturedId
ORDER BY t.id;
```

### PATCH 전·후 · 태그 원본 보존

tags=[] 요청 전에 있던 tag id·이름이 후에도 남는지 비교합니다. 연결 수 0과 tag 원본 삭제를 구분합니다. 큰 DB에서는 요청 전에 기록한 tag id로 조회 범위를 좁히세요.

```sql
SELECT id, name
FROM tag
ORDER BY id;
```

### 각 완료 항목의 확인 근거

- 보낸 non-null 값만 변경되고 생략/null인 필드는 유지됩니다.
  확인: 요청·DB: title을 직접 정한 값으로 보내 비교하고, 다른 필드는 생략/null인 별도 요청으로 유지되는지 확인합니다.
- tags=[]는 post_tag 연결만 없애며 기존 tag 행은 삭제하지 않습니다.
  확인: 요청·DB: [] 전후에 아래 태그 연결과 tag 원본 SELECT를 기록해 연결만 사라졌는지 봅니다.
- canView → 작성자 순서로 검사합니다. ADMIN도 남의 글 수정 권한은 없습니다.
  확인: 권한 요청: 공개 글을 볼 수 있고 양방향 차단이 없는 다른 활성 회원 토큰으로 PATCH하면 403입니다. 예제의 김자바 글은 tok-lee로 비교할 수 있습니다. 볼 수 없는 글은 먼저 404입니다. ADMIN도 남의 글 PATCH를 허용하는 조건을 넣지 않습니다.
- 나중 필드 검증이 실패해도 앞서 바꾼 객체 값을 DB에 일부 저장하지 않습니다.
  확인: 실패 요청·DB: {"title":"실패 전 변경","content":"   "}를 보내 400을 확인합니다. 요청 전후 SELECT의 title·content·updated_at이 같은지 봅니다. Java 객체의 자동 원복을 채점하지 않습니다.
- {}와 all-null 성공 요청도 updated_at은 갱신하고 조회수는 올리지 않습니다.
  확인: 요청·DB: {}를 보내 200을 확인하고 updated_at 대입과 조회수 유지를 봅니다. 시각 정밀도에 따라 전후 시각이 같을 수 있으므로 항상 큰 값이라고 채점하지 않습니다.

## 필요한 개념

- [W21 · null 처리](../../docs/knowledge/W21-null-handling.md) — 이 DTO는 생략과 null을 둘 다 유지로 해석합니다. 구분하는 다른 설계와 혼동하지 않습니다.
- [S09 · 변경 감지](../../docs/knowledge/S09-jpa-hibernate.md#조회부터-변경-저장까지) — 객체 변경과 DB 확정 시점을 연결합니다.
- [P20 · 다대다 연결](../../docs/knowledge/P20-jpa-entity-mapping.md#25-cascade-orphanremoval-다대다) — 태그 원본과 연결 해제를 구분합니다.

## 원문과 기술 정본

다섯 과제는 [3-2 manifest](../snapshots/3-2.json)의 파일별 blob 한 버전으로 연결합니다. manifest의 기록 commit으로 추출한 소스는 통합 blob 내용과 다르므로 참고 완성본을 대체하지 않습니다. 아래 원문은 보존된 설명·검증 자료이고, 앞 단계의 고정 id·시드 수를 이 과제의 현재 결과로 복사하지 않습니다.

- [3-1 · 부분 수정](../ch3-update-delete/3-1-patch.md#만들-것) — PATCH 필드별 규칙과 원문 검증 요청입니다.
- [2-3 · 가시성](../ch2-read-post/2-3-visibility.md#만들-것) — 수정 권한보다 먼저 글이 보이는지 판정합니다.

다음: [게시글 삭제](delete-post.md)
