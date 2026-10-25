# 5. 게시글 삭제

작성자 또는 권한 있는 운영자가 삭제 시각을 기록하고, 이후 상세와 목록에서 글을 제외합니다.

글을 삭제한 뒤 기존 링크로 돌아가도 보이지 않아야 합니다. DB 행과 태그·좋아요·댓글은 보존합니다.

## 시작 상태와 제공물

계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. ZIP은 중간 합류용 새 폴더 초기화 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 마세요. 현재 및 이후 기능은 미구현이므로 이후 API의 미구현 오류는 이번 과제의 실패가 아닙니다.

- 앞 과제: 게시글 작성 → 게시글 상세 조회 → 게시글 목록 조회 → 게시글 부분 수정
- 이번 구현: `src/main/java/org/example/post/PostService.java`의 `delete(...)` 메서드 본문 하나
- 공통 제공: Controller·DTO·인증·예외 처리·Repository·Entity·가시성 정책·검증/태그 helper
- 이후 미구현: 없음
- [중간 합류용 시작 패키지](packages/delete.zip) · [공통 3-2 참고 완성본](packages/reference.zip)

코드를 수정했다면 기존 bootRun 터미널에서 Ctrl+C로 앱만 종료하고 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다. DB·Compose·작성 응답 id는 유지합니다.

## 구현할 일

1. findById로 글을 찾고 canView 실패를 먼저 404로 처리합니다.
2. 인증 회원이 작성자 또는 ADMIN인지 검사하고 그 외는 PostForbiddenException을 던집니다.
3. post.delete(LocalDateTime.now())를 호출해 deletedAt과 updatedAt을 함께 변경합니다.
4. repository.delete나 연관 삭제를 호출하지 않습니다. Controller의 빈 204 응답을 확인합니다.
5. 삭제 후 같은 id의 상세·PATCH·DELETE 404와 목록 제외를 확인합니다.

## 기능 계약

`DELETE /api/posts/{id}` → **204**

작성자 또는 ADMIN이면서 canView를 먼저 통과해야 합니다. ADMIN이 FOLLOWERS를 무조건 우회하지 않습니다.

canView가 먼저이고 그다음 작성자 또는 ADMIN 여부를 검사합니다. ADMIN도 FOLLOWERS 글의 가시성을 무조건 우회하지 않습니다. 삭제 성공은 204이며 본문이 없습니다.

post.delete(now)는 deleted_at과 updated_at을 같은 now로 바꿉니다. id·제목·본문·status·공개 범위·생성/발행 시각·카운터는 유지합니다. post_tag·tag·좋아요·댓글도 물리 삭제하지 않습니다. repository.delete를 호출하지 않습니다.

삭제 뒤 같은 id의 상세·수정·재삭제는 404이고 목록에서 빠집니다. 직접 SELECT에는 행이 남습니다. status=HIDDEN으로 숨기는 동작과 구분합니다. 연관 데이터가 원래 0개인 글만으로는 보존을 충분히 검증할 수 없으므로 제공 통합 테스트의 연결 데이터 확인도 참고합니다.

### 보낼 요청

앞 과제에서 만든 같은 글을 삭제합니다. 본문은 보내지 않습니다.

```http
DELETE /api/posts/{id}
Authorization: Bearer tok-kimjava
```

`{id}`는 앞 POST 응답에서 기록한 `capturedId`로 바꿉니다.

## 완료 기준

- 삭제 성공은 204이며 응답 본문이 없습니다.
- 행은 남고 deleted_at과 updated_at만 같은 now로 바뀝니다.
- post_tag·tag·좋아요·댓글을 물리 삭제하지 않습니다.
- 삭제 뒤 상세/PATCH/재삭제는 404이고 목록에서 제외됩니다.
- canView → 작성자 또는 ADMIN 순서를 지킵니다.

성공 응답 필드: 없음

실패 응답: `401` 인증 없음·오류 · `403` 비활성 회원 또는 볼 수 있으나 작성자/ADMIN 아님 · `404` 없는 글·이미 삭제·볼 수 없는 글

## 결과를 확인하는 방법

실제 요청 전에 비교할 값을 기록합니다. 아래 SQL은 검산용 SELECT이며 실제 Hibernate 실행 로그가 아닙니다. 별도 DB 클라이언트의 새 autocommit SELECT로 확인합니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.

:capturedId는 실제 응답 id로 바꿉니다. 목록의 :boardSlug는 따옴표를 포함한 게시판 값(예: 'dev'), :viewerId는 토큰 회원 id 또는 NULL, :size와 :offset은 숫자입니다. :offset은 page × size입니다. 화면은 이 SQL을 자동 실행하지 않습니다.

### DELETE 전·후 · 행과 두 시각

행은 남고 deleted_at·updated_at에 같은 now가 저장됩니다. 나머지 값은 요청 전에 기록한 값과 같습니다.

```sql
SELECT id, board_id, author_id, title, content, status, visibility,
       view_count, like_count, comment_count,
       created_at, updated_at, published_at, deleted_at
FROM post
WHERE id = :capturedId;
```

### DELETE 전·후 · 연관 행 수

삭제 전에 세 수를 기록하고 삭제 후 같은지 비교합니다. 같은 수만으로 행 id·모든 내용의 보존까지 입증하지는 않습니다. 코드에 repository.delete나 연관 삭제 호출이 없는지도 확인합니다. 원래 0개인 관계만으로는 검증이 충분하지 않습니다.

```sql
SELECT
  (SELECT COUNT(*) FROM post_tag WHERE post_id = :capturedId) AS tag_links,
  (SELECT COUNT(*) FROM post_like WHERE post_id = :capturedId) AS likes,
  (SELECT COUNT(*) FROM comment WHERE post_id = :capturedId) AS comments;
```

### DELETE 전·후 · 태그 원본

삭제 전에 기록한 tag id·이름이 후에도 남는지 비교합니다. 실제 tag 원본과 글의 post_tag 연결을 별도로 봅니다.

```sql
SELECT id, name
FROM tag
ORDER BY id;
```

### 각 완료 항목의 확인 근거

- 삭제 성공은 204이며 응답 본문이 없습니다.
  확인: 응답: 204와 본문 빈 문자열을 확인합니다. JSON 파싱 성공을 요구하지 않습니다.
- 행은 남고 deleted_at과 updated_at만 같은 now로 바뀝니다.
  확인: DB: 삭제 전후 글 한 행을 비교해 행 보존·두 시각 일치·다른 값 유지를 확인합니다.
- post_tag·tag·좋아요·댓글을 물리 삭제하지 않습니다.
  확인: DB·격리 테스트: 관계 수와 tag 원본을 전후 비교합니다. 관계가 원래 모두 0이면 Docker가 켜진 상태에서 ./gradlew test --tests org.example.post.PostDeleteControllerTest로 제공 검사를 실행합니다. Gradle이 test 프로필을 켜고 일회용 MySQL을 만듭니다. 이 검사는 Tx 내부 flush이며 별도 연결의 commit 관찰과 구분합니다.
- 삭제 뒤 상세/PATCH/재삭제는 404이고 목록에서 제외됩니다.
  확인: 후속 요청: 같은 id의 GET, PATCH {}, DELETE가 각각 404인지 확인하고, 같은 게시판 목록에서 그 id가 없는지 봅니다.
- canView → 작성자 또는 ADMIN 순서를 지킵니다.
  확인: 삭제 전 코드·권한 요청: canView 다음 작성자/ADMIN 검사 순서를 봅니다. 양방향 차단 없이 글을 볼 수 있는 다른 일반 회원은 403입니다. 예제의 김자바 글은 삭제 전에 tok-lee로 비교합니다. 접근할 수 없는 글은 먼저 404이며, 이미 삭제한 id에서도 403을 기대하지 않습니다.

## 필요한 개념

- [P20 · 연관 삭제](../../docs/knowledge/P20-jpa-entity-mapping.md#25-cascade-orphanremoval-다대다) — 같이 지워지면 안 되는 연결을 판단합니다.
- [S09 · 변경 감지](../../docs/knowledge/S09-jpa-hibernate.md#조회부터-변경-저장까지) — delete 메서드 호출과 실제 SQL DELETE를 구분합니다.
- [R06 · 별도 DB 관찰](../../docs/knowledge/R06-db-client-tools.md) — 행 보존은 API 응답과 별도로 SELECT로 확인합니다.

## 원문과 기술 정본

다섯 과제는 [3-2 manifest](../snapshots/3-2.json)의 파일별 blob 한 버전으로 연결합니다. manifest의 기록 commit으로 추출한 소스는 통합 blob 내용과 다르므로 참고 완성본을 대체하지 않습니다. 아래 원문은 보존된 설명·검증 자료이고, 앞 단계의 고정 id·시드 수를 이 과제의 현재 결과로 복사하지 않습니다.

- [3-2 · soft delete](../ch3-update-delete/3-2-soft-delete.md#만들-것) — 행과 연관 데이터를 보존하는 삭제 계약입니다.
- [2-3 · 삭제 글 가시성](../ch2-read-post/2-3-visibility.md#만들-것) — 상세와 목록에서 제외하는 공통 조건입니다.

다섯 기능을 같은 프로젝트·DB에서 연결해 작성 → 상세 → 목록 → 수정 → 삭제 후 상세 404·목록 제외까지 확인합니다.
