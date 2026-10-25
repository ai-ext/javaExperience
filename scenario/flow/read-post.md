# 2. 게시글 상세 조회

작성한 글의 상세를 반환하고, 볼 수 있는 글의 조회수만 1 증가시킵니다.

등록 직후 받은 id로 글을 엽니다. 없는 글과 볼 수 없는 글은 같은 404로 처리합니다.

## 시작 상태와 제공물

계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. ZIP은 중간 합류용 새 폴더 초기화 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 마세요. 현재 및 이후 기능은 미구현이므로 이후 API의 미구현 오류는 이번 과제의 실패가 아닙니다.

- 앞 과제: 게시글 작성
- 이번 구현: `src/main/java/org/example/post/PostQueryService.java`의 `getDetail(...)` 메서드 본문 하나
- 공통 제공: Controller·DTO·인증·예외 처리·Repository·Entity·가시성 정책·검증/태그 helper
- 이후 미구현: 게시글 목록 조회 · 게시글 부분 수정 · 게시글 삭제
- [중간 합류용 시작 패키지](packages/detail.zip) · [공통 3-2 참고 완성본](packages/reference.zip)

코드를 수정했다면 기존 bootRun 터미널에서 Ctrl+C로 앱만 종료하고 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다. DB·Compose·작성 응답 id는 유지합니다.

## 구현할 일

1. findById로 글을 찾고 없으면 PostNotFoundException을 던집니다.
2. 제공된 accessPolicy.canView를 먼저 검사하고 실패하면 조회수를 바꾸지 않고 404를 냅니다.
3. post.increaseViewCount를 호출합니다. 이 GET은 쓰기 트랜잭션입니다.
4. 제공된 toDetailResponse로 트랜잭션 안에서 작성자·태그를 DTO에 옮겨 반환합니다.

## 기능 계약

`GET /api/posts/{id}` → **200**

Authorization 없이 조회할 수 있습니다. 선택해서 보낸 토큰은 유효해야 합니다.

PUBLIC·PUBLISHED·미삭제인 작성 글은 토큰 없이도 읽습니다. Authorization을 선택해서 보내면 그 토큰은 유효해야 합니다. canView는 삭제 여부·상태·팔로우·양방향 차단을 확인합니다. 없는 글과 볼 수 없는 글은 모두 404이고 조회수를 올리지 않습니다.

조회수는 조회 전 v를 읽어 객체에서 v+1로 바꾸는 구현입니다. 증가한 값을 응답하고 트랜잭션 변경 감지로 저장합니다. GET이지만 DB 쓰기가 있으므로 readOnly=true를 붙이지 않습니다. updated_at·created_at·published_at은 바뀌지 않습니다. 잠금이나 @Version은 없으므로 동시 요청 N건의 정확한 +N까지 보장한다고 해석하지 않습니다.

### 보낼 요청

작성 응답에서 받은 id를 사용합니다.

```http
GET /api/posts/{id}

```

`{id}`는 앞 POST 응답에서 기록한 `capturedId`로 바꿉니다.

## 완료 기준

- 가시성 검사를 통과한 글은 200 상세 DTO를 반환합니다.
- 응답과 DB의 조회수는 요청 전 v에서 v+1이 됩니다. 연속 2회는 v+2입니다.
- 없는 글·삭제 글·볼 수 없는 글은 404이며 조회수 변화가 없습니다.
- 상세 GET은 updated_at·created_at·published_at을 바꾸지 않습니다.

성공 응답 필드: `id`, `boardSlug`, `title`, `content`, `tags`, `visibility`, `author.id`, `author.nickname`, `viewCount`, `likeCount`, `commentCount`, `createdAt`

실패 응답: `400` 숫자가 아닌 id · `404` 없는 글·삭제된 글·canView 실패 · `401/403` 선택 토큰의 인증 오류·비활성 회원

## 결과를 확인하는 방법

실제 요청 전에 비교할 값을 기록합니다. 아래 SQL은 검산용 SELECT이며 실제 Hibernate 실행 로그가 아닙니다. 별도 DB 클라이언트의 새 autocommit SELECT로 확인합니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.

:capturedId는 실제 응답 id로 바꿉니다. 목록의 :boardSlug는 따옴표를 포함한 게시판 값(예: 'dev'), :viewerId는 토큰 회원 id 또는 NULL, :size와 :offset은 숫자입니다. :offset은 page × size입니다. 화면은 이 SQL을 자동 실행하지 않습니다.

### GET 전·후 · 같은 SELECT를 두 번

전송 전 view_count를 v로 기록합니다. 정상 GET 뒤 v+1이고 created_at·updated_at·published_at은 같습니다. 비교용 GET을 추가 호출하면 조회수가 또 증가하므로 DB SELECT로 비교합니다.

```sql
SELECT id, board_id, author_id, title, content, status, visibility,
       view_count, like_count, comment_count,
       created_at, updated_at, published_at, deleted_at
FROM post
WHERE id = :capturedId;
```

### 각 완료 항목의 확인 근거

- 가시성 검사를 통과한 글은 200 상세 DTO를 반환합니다.
  확인: 요청: 앞 작성 응답 id로 상세를 열고 글·작성자·태그를 비교합니다.
- 응답과 DB의 조회수는 요청 전 v에서 v+1이 됩니다. 연속 2회는 v+2입니다.
  확인: 전후 비교: DB 값을 기록하고 GET 한 번 뒤 v+1을 확인합니다. 다른 요청이 없는 상태에서 한 번 더 요청하면 v+2입니다.
- 없는 글·삭제 글·볼 수 없는 글은 404이며 조회수 변화가 없습니다.
  확인: 실패 요청: DB에서 없는 것으로 확인한 id로 404를 봅니다. 삭제·가시성 거절 시 조회수 증가가 없도록 canView 호출 순서를 코드에서 확인합니다. 기존 삭제/비공개 fixture가 있다면 해당 조회자로 검증하고, 새 글의 삭제 뒤 404는 마지막 과제에서 다시 확인합니다.
- 상세 GET은 updated_at·created_at·published_at을 바꾸지 않습니다.
  확인: DB: GET 전·후 같은 SELECT의 created_at·updated_at·published_at을 비교합니다.

## 필요한 개념

- [S09 · OSIV와 경계](../../docs/knowledge/S09-jpa-hibernate.md#osiv와-경계) — 연관 데이터를 서비스 안에서 DTO로 읽는 이유입니다.
- [W09 · 응답 DTO](../../docs/knowledge/W09-why-dto.md) — 상세 응답의 필드를 Entity 전체와 구분합니다.

## 원문과 기술 정본

다섯 과제는 [3-2 manifest](../snapshots/3-2.json)의 파일별 blob 한 버전으로 연결합니다. manifest의 기록 commit으로 추출한 소스는 통합 blob 내용과 다르므로 참고 완성본을 대체하지 않습니다. 아래 원문은 보존된 설명·검증 자료이고, 앞 단계의 고정 id·시드 수를 이 과제의 현재 결과로 복사하지 않습니다.

- [2-1 · 상세와 404](../ch2-read-post/2-1-get-one.md#만들-것) — 최소 상세 구현의 원문입니다. 최종 정책은 2-3도 함께 적용합니다.
- [2-3 · 가시성](../ch2-read-post/2-3-visibility.md#만들-것) — 삭제·상태·팔로우·양방향 차단 판단의 배경입니다.

다음: [게시글 목록 조회](list-posts.md)
