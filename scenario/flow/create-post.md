# 1. 게시글 작성

로그인한 회원의 글을 DB에 저장하고, 생성된 id와 글 정보를 201 응답으로 돌려줍니다.

회원이 dev 게시판에 제목·본문·태그를 입력해 등록합니다. 다음 과제는 이 응답에서 받은 id로 이어집니다.

## 시작 상태와 제공물

계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. ZIP은 중간 합류용 새 폴더 초기화 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 마세요. 현재 및 이후 기능은 미구현이므로 이후 API의 미구현 오류는 이번 과제의 실패가 아닙니다.

- 앞 과제: 없음
- 이번 구현: `src/main/java/org/example/post/PostService.java`의 `create(...)` 메서드 본문 하나
- 공통 제공: Controller·DTO·인증·예외 처리·Repository·Entity·가시성 정책·검증/태그 helper
- 이후 미구현: 게시글 상세 조회 · 게시글 목록 조회 · 게시글 부분 수정 · 게시글 삭제
- [중간 합류용 시작 패키지](packages/create.zip) · [공통 3-2 참고 완성본](packages/reference.zip)

코드를 수정했다면 기존 bootRun 터미널에서 Ctrl+C로 앱만 종료하고 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다. DB·Compose·작성 응답 id는 유지합니다.

## 구현할 일

1. boardSlug로 게시판을 찾고 없으면 BoardNotFoundException을 던집니다.
2. 인증 회원을 작성자로 연결하고 운영자 전용 게시판의 쓰기 권한을 검사합니다.
3. visibility가 null이면 PUBLIC으로 정하고, PUBLISHED·카운터 0인 Post를 만듭니다.
4. 제공된 resolveTags로 태그를 찾아 연결하고 postRepository.save로 저장합니다.
5. 트랜잭션 안에서 응답에 필요한 작성자·태그를 읽은 Post를 반환합니다.

## 기능 계약

`POST /api/posts` → **201**

쓰기에는 유효한 Bearer 토큰이 필요합니다. 작성자는 본문의 authorId가 아니라 인증된 회원입니다.

작성자는 요청 본문의 authorId로 고를 수 없습니다. Controller가 인증 회원 id를 Service에 전달합니다. 새 Post는 PUBLISHED이며 조회·좋아요·댓글 카운터가 모두 0입니다. visibility를 생략하거나 null로 보내면 PUBLIC을 사용합니다. 예시의 spring·새태그 모두 이름이 있으면 재사용하고 없으면 생성합니다. 현재 DB에 어떤 이름이 있는지는 직접 확인합니다. 정본은 Post 객체 생성 → resolveTags로 태그 조회·필요한 저장 → post.addTag로 연결 → postRepository.save 순서입니다. 요청 내 중복 이름은 제거합니다.

POST 태그의 원소는 null 불가·1~30자입니다. 정본 DTO에는 원소 @NotBlank가 없어 공백만 있는 태그 검증이 PATCH와 다릅니다. 이 차이를 개선하는 과제는 이번 범위에 포함하지 않습니다.

IDENTITY로 id를 받으려고 INSERT가 먼저 실행되더라도 commit은 별개입니다. 태그나 연결 저장이 실패하면 같은 트랜잭션의 글 저장도 취소됩니다. id가 생성됐다는 사실만으로 다른 연결에서 행을 볼 수 있다고 판단하지 않습니다.

### 보낼 요청

새 글의 예시입니다. 제목·본문을 바꿔 보낸 뒤 실제 응답의 id로 다음 기능을 이어갑니다.

```http
POST /api/posts
Authorization: Bearer tok-kimjava
Content-Type: application/json

{
  "boardSlug": "dev",
  "title": "새 게시글",
  "content": "본문",
  "tags": [
    "spring",
    "새태그"
  ],
  "visibility": "PUBLIC"
}
```

응답 `id`를 기록하고 이후 요청에 그대로 사용합니다.

## 완료 기준

- 201과 Location: /api/posts/{capturedId}를 받고 body.id를 다음 과제에 전달합니다.
- 인증 작성자·게시판·본문·태그 연결이 저장되고 카운터 0, deleted_at NULL입니다.
- 글·새 태그·연결은 같은 트랜잭션입니다. 중간 실패 시 전체 저장이 취소됩니다.
- visibility 생략/null은 PUBLIC이며 유효하지 않은 DTO 입력은 400으로 처리됩니다.

성공 응답 필드: `id`, `boardSlug`, `title`, `content`, `tags`, `visibility`, `author.id`, `author.nickname`, `createdAt`

실패 응답: `400` 빈 필수 필드·길이·공개 범위·깨진 JSON · `401` 토큰 없음·잘못된 형식·만료·폐기 · `403` 비활성 회원 또는 게시판 쓰기 권한 없음 · `404` 게시판 없음

## 결과를 확인하는 방법

실제 요청 전에 비교할 값을 기록합니다. 아래 SQL은 검산용 SELECT이며 실제 Hibernate 실행 로그가 아닙니다. 별도 DB 클라이언트의 새 autocommit SELECT로 확인합니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.

:capturedId는 실제 응답 id로 바꿉니다. 목록의 :boardSlug는 따옴표를 포함한 게시판 값(예: 'dev'), :viewerId는 토큰 회원 id 또는 NULL, :size와 :offset은 숫자입니다. :offset은 page × size입니다. 화면은 이 SQL을 자동 실행하지 않습니다.

### 작성 후 · 저장된 글 한 행

응답 id의 행이 있고 제목·본문·작성자·게시판이 요청과 맞는지 확인합니다. status=PUBLISHED, 카운터 0, deleted_at=NULL입니다.

```sql
SELECT id, board_id, author_id, title, content, status, visibility,
       view_count, like_count, comment_count,
       created_at, updated_at, published_at, deleted_at
FROM post
WHERE id = :capturedId;
```

### 작성 후 · 글에 연결된 태그

요청의 태그 이름 집합과 비교합니다. 입력 순서나 tag id를 고정하지 않습니다.

```sql
SELECT pt.post_id, t.id AS tag_id, t.name
FROM post_tag pt
JOIN tag t ON t.id = pt.tag_id
WHERE pt.post_id = :capturedId
ORDER BY t.id;
```

### 각 완료 항목의 확인 근거

- 201과 Location: /api/posts/{capturedId}를 받고 body.id를 다음 과제에 전달합니다.
  확인: 요청·응답: 작성 토큰으로 전송해 201, Location과 body.id 일치를 확인합니다.
- 인증 작성자·게시판·본문·태그 연결이 저장되고 카운터 0, deleted_at NULL입니다.
  확인: DB: 아래 글 한 행·태그 연결 SELECT를 응답 id로 조회합니다.
- 글·새 태그·연결은 같은 트랜잭션입니다. 중간 실패 시 전체 저장이 취소됩니다.
  확인: 코드·실패 검증: create의 @Transactional과 태그/글 저장이 같은 경계인지 봅니다. 저장 중 실패를 재현하는 격리 통합 테스트가 필요하며 201 한 번으로 체크하지 않습니다.
- visibility 생략/null은 PUBLIC이며 유효하지 않은 DTO 입력은 400으로 처리됩니다.
  확인: 요청: visibility를 생략한 경우와 null인 경우 각각 PUBLIC인지 봅니다. title을 빈 문자열로 보낸 경우 400인지 별도로 확인합니다.

## 필요한 개념

- [S09 · 영속 상태와 flush](../../docs/knowledge/S09-jpa-hibernate.md#조회부터-변경-저장까지) — save·flush·commit의 시점을 구분합니다.
- [P20 · ID와 기본 타입](../../docs/knowledge/P20-jpa-entity-mapping.md#22-id와-기본-타입) — IDENTITY id와 DB 열을 연결합니다.
- [W09 · DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — Entity와 HTTP 응답을 구분합니다.

## 원문과 기술 정본

다섯 과제는 [3-2 manifest](../snapshots/3-2.json)의 파일별 blob 한 버전으로 연결합니다. manifest의 기록 commit으로 추출한 소스는 통합 blob 내용과 다르므로 참고 완성본을 대체하지 않습니다. 아래 원문은 보존된 설명·검증 자료이고, 앞 단계의 고정 id·시드 수를 이 과제의 현재 결과로 복사하지 않습니다.

- [1-4 · DB 저장의 기초](../ch1-create-post/1-4-save-to-db.md#만들-것) — 이전 버전의 학습 설명입니다. 활성 API 계약은 공통 3-2입니다.
- [1-5 · 입력 검증](../ch1-create-post/1-5-validation.md#만들-것) — 필수값·길이 제약을 확인합니다.
- [1-6 · 토큰 인증](../ch1-create-post/1-6-token-auth.md#만들-것) — 인증된 작성자를 연결하는 근거입니다.

다음: [게시글 상세 조회](read-post.md)
