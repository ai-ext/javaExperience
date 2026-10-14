# 12-1. 댓글 수정 — "수정됨" 표시

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고, 11장은 `community`였다). 12장은 1~9장에서 만든 게시판에 사람 사이의 기능(수정·멘션·알림함·팔로우·피드·신고)을 붙인다.

## 상황

> "댓글 오타를 고칠 수가 없어서 지우고 다시 쓰는 분이 많아요. 수정할 수 있게 해 주세요. 대신 고친 댓글에는 '수정됨'을 꼭 붙여 주세요. 답글이 달린 뒤에 내용을 바꿔 버리면 대화가 엉뚱해지거든요."

5장에서 댓글을 만들고(5-1) 지웠다(5-3). 이번에는 **고치기**다. 3-1(글 PATCH)과 비슷하지만 두 가지가 다르다.

- 누가 고칠 수 있나 — 작성자만. 수정에서는 없거나 볼 수 없으면 404를 먼저 확인하고, 남의 댓글이면 403을 반환한다.
- "수정됨"을 무엇으로 판단하나 — `comment.updated_at`은 이미 있지만 5-3의 삭제도 이 값을 바꾼다. 그래서 "수정했다"는 사실만 담는 컬럼을 새로 둔다. 내용이 그대로인 요청은 수정이 아니다.

> 글의 "수정됨"은 티켓 [T-002](../../tickets/002-post-edited-flag.md)가 `updated_at`과 `created_at` 비교로 다룬다. 댓글은 삭제도 `updated_at`을 바꾸므로 같은 방법을 쓸 수 없다 — 이 차이가 이 단계의 핵심이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 — 댓글 고치기",
  "summary": "내 댓글의 [수정]을 눌러 내용을 바꾸면 '수정됨'이 붙는다. 남의 댓글에는 [수정]이 없지만 서버도 막아야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "이직 준비 근황", "right": "자바초보탈출" },
    {
      "type": "list",
      "id": "comments",
      "label": "댓글",
      "items": [
        { "id": "c-mine", "title": "[채점] 수정한 댓글", "meta": "자바초보탈출 · 방금 전 · 수정됨", "badge": "수정됨" }
      ]
    },
    { "type": "field", "id": "edit-box", "label": "댓글 고치기", "value": "[채점] 수정한 댓글", "multiline": true },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        { "id": "save", "label": "저장", "variant": "primary" },
        { "id": "cancel", "label": "취소", "variant": "ghost" }
      ]
    },
    { "type": "toast", "id": "toast-forbidden", "value": "본인 댓글만 수정할 수 있습니다.", "tone": "error" }
  ],
  "flows": [
    {
      "name": "내 댓글 고치기",
      "steps": [
        { "kind": "user", "text": "내 댓글의 [수정]을 눌러 내용을 바꾸고 [저장]", "focus": ["edit-box", "save"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/comments/361",
          "headers": ["Authorization: Bearer tok-p03", "Content-Type: application/json"],
          "body": "{\"content\": \"[채점] 수정한 댓글\"}"
        },
        { "kind": "server", "text": "댓글 찾기(지웠으면 404) → 그 글을 볼 수 있나(2-3 규칙, 아니면 404) → 작성자인가(아니면 403) → 내용이 다를 때만 바꾸고 edited_at을 찍는다" },
        { "kind": "db", "sql": "UPDATE comment SET content = '[채점] 수정한 댓글', edited_at = NOW(), updated_at = NOW() WHERE id = 361", "note": "변경 감지(더티 체킹) — 내용이 같으면 UPDATE 자체가 나가지 않는다" },
        { "kind": "response", "status": 200, "body": "{\"id\": 361, \"postId\": 32, \"content\": \"[채점] 수정한 댓글\", \"edited\": true, \"editedAt\": \"2026-10-10T14:03:11\", ...}" },
        { "kind": "screen", "text": "댓글 옆에 '수정됨'이 붙는다", "focus": ["c-mine"] }
      ]
    },
    {
      "name": "남의 댓글 — 서버가 막는다",
      "steps": [
        { "kind": "user", "text": "화면에는 [수정]이 없지만, 누군가 요청을 직접 만들어 보낸다" },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/comments/361",
          "headers": ["Authorization: Bearer tok-p04", "Content-Type: application/json"],
          "body": "{\"content\": \"남이 바꿈\"}"
        },
        { "kind": "server", "text": "댓글도 있고 글도 볼 수 있다 → 작성자가 아니다 → 403" },
        { "kind": "response", "status": 403, "body": "{\"status\": 403, \"detail\": \"본인 댓글만 수정할 수 있습니다.\"}" },
        { "kind": "screen", "text": "오류 토스트", "focus": ["toast-forbidden"] }
      ]
    }
  ]
}
```

## 만들 것

**V30** — `db/migration/V30__add_comment_edited_at.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `comment.edited_at` | `DATETIME NULL` — 내용을 실제로 바꾼 마지막 시각. 기존 댓글은 `NULL`(채울 값이 없다) |

> 12장은 Flyway 번호 V30~V39를 쓴다(11장이 V20~V29). 장을 순서대로 하지 않아도 번호가 겹치지 않게 미리 나눠 둔 것이다.

**API** — `PATCH /api/comments/{id}` (토큰 필요)

| 항목 | 내용 |
|---|---|
| 요청 본문 | `{ "content": "..." }` — 아래 필드 규칙(작성 5-1과 같다) |
| 응답 `200` | 작성 응답(5-1)과 같은 모양 + `"edited": true/false`, `"editedAt": 시각 또는 null` |
| 내용이 그대로 | `200`, 아무것도 바꾸지 않는다 — 처음 쓴 그대로면 `edited`=false |
| `404` | 없는 댓글, 지운 댓글, 볼 수 없는 글(2-3 규칙)의 댓글 — **403보다 먼저** |
| `403` | 남의 댓글 |
| `401` | 토큰 없음 |

**필드 규칙** — 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `content` | 필수 | 안 됨 — 없음·`null`·`""`·공백만 모두 거절 | 1~1000자(정확히 1000자는 성공, 1001자는 거절) | 문자열 | 없음 | `400`, `errors`에 `content` |
| `{id}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400`, 없는 댓글 `404` |
| 본문 전체 | 필수 | — | — | JSON | — | JSON이 아니면 `400`; `content`가 숫자·배열이어도 문자열로 강제 변환하지 않고 `400` |

**목록에도 표시** — `GET /api/posts/{id}/comments`(5-3)의 최상위 댓글·답글 항목에 `"edited"`를 더한다. "삭제된 댓글입니다" 자리는 `false`. 다른 필드는 그대로다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 댓글 찾기(지웠으면 404) → 그 글을 볼 수 있나(2-3 규칙, 아니면 404) → 작성자인가(아니면 403) → 내용이 다를 때만 바꾸고 edited_at을 찍는다
- 변경 감지(더티 체킹) — 내용이 같으면 UPDATE 자체가 나가지 않는다
- 댓글도 있고 글도 볼 수 있다 → 작성자가 아니다 → 403

<details>
<summary>Controller — HTTP 연결</summary>

`CommentController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PatchMapping("/api/comments/{id}")`. 변경된 메서드: `edit`.


```java
// 12-1 — 내용만 고친다. 응답은 작성(5-1)과 같은 모양 + 수정 여부
    @PatchMapping("/api/comments/{id}")
    public CommentResponse edit(@PathVariable Long id,
                                @LoginMember AuthenticatedMember loginMember,
                                @RequestBody CommentUpdateRequest request) {
        return CommentResponse.from(commentService.edit(id, loginMember, request));
    }
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`CommentReplyResponse.java`, `CommentResponse.java`, `CommentThreadResponse.java`, `CommentUpdateRequest.java`. 원문 `JsonNode`의 타입을 검사한 뒤 작성(5-1)과 같은 길이·공백 규칙을 적용한다. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.


```java
package org.example.comment;

import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.Map;

// 원문 JSON 타입을 보존해 숫자·배열을 문자열로 강제 변환하지 않는다.
// 작성(5-1)의 1~1000자·공백 금지 규칙을 수정에도 적용한다.
public record CommentUpdateRequest(JsonNode content) {
    public String validatedContent() {
        if (content == null || content.isNull() || !content.isTextual()) {
            throw new InvalidParametersException(Map.of("content", "댓글은 문자열이어야 합니다."));
        }
        String value = content.asText();
        if (value.isBlank()) {
            throw new InvalidParametersException(Map.of("content", "댓글을 입력해 주세요."));
        }
        if (value.length() > 1000) {
            throw new InvalidParametersException(Map.of("content", "댓글은 1000자 이하여야 합니다."));
        }
        return value;
    }
}

package org.example.comment;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id, Long postId, Long parentId, CommentAuthorResponse author,
        String content, LocalDateTime createdAt, boolean deleted,
        boolean edited, LocalDateTime editedAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(comment.getId(), comment.getPost().getId(),
                comment.getParent() == null ? null : comment.getParent().getId(),
                new CommentAuthorResponse(comment.getMember().getId(),
                        comment.getMember().getNickname()),
                comment.getContent(), comment.getCreatedAt(), comment.getDeletedAt() != null,
                comment.isEdited(), comment.getEditedAt());
    }
}

package org.example.comment;

import org.example.post.AuthorResponse;

import java.time.LocalDateTime;
import java.util.List;

// 최상위 댓글 — 지워졌지만 살아 있는 답글이 있으면 author=null, deleted=true로 자리만 남긴다
public record CommentThreadResponse(
        Long id,
        AuthorResponse author,
        String content,
        LocalDateTime createdAt,
        boolean edited,
        boolean deleted,
        List<CommentReplyResponse> replies
) {
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`CommentService.java`, `CommentRepository.java`. 댓글 행을 잠근 뒤 권한·내용을 검사하고 수정한다. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `edit`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.


```java
// 12-1 — 작성자만 고친다. 확인 순서: 없거나 지운 댓글·볼 수 없는 글의 댓글 404 → 남의 댓글 403.
    // 내용이 그대로면 아무것도 바꾸지 않는다(edited_at이 안 찍혀 "수정됨"이 붙지 않는다).
    @Transactional
    public Comment edit(Long commentId, AuthenticatedMember loginMember, CommentUpdateRequest request) {
        Comment comment = commentRepository.findByIdForUpdate(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(CommentNotFoundException::new);
        if (!accessPolicy.canView(loginMember, comment.getPost())) {
            throw new CommentNotFoundException();
        }
        if (!comment.getMember().getId().equals(loginMember.id())) {
            throw new CommentForbiddenException("본인 댓글만 수정할 수 있습니다.");
        }

        comment.edit(request.validatedContent(), LocalDateTime.now());

        // 컨트롤러가 세션 밖에서 DTO를 만든다 — 지연 로딩 연관을 미리 읽어 둔다
        comment.getMember().getNickname();
        comment.getPost().getId();
        if (comment.getParent() != null) {
            comment.getParent().getId();
        }
        return comment;
    }
```

</details>

<details>
<summary>JPA / Repository — 수정과 삭제의 행 잠금</summary>

`CommentRepository.java`의 수정 조회는 같은 댓글의 수정·삭제를 직렬화한다. 삭제가 먼저 끝나면 수정은 지운 댓글을 보고 `404`, 수정이 먼저 끝나면 삭제가 그 뒤에 적용되어 댓글이 되살아나지 않는다.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT c FROM Comment c WHERE c.id = :id")
Optional<Comment> findByIdForUpdate(@Param("id") Long id);
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Comment.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `edit`.


```java
package org.example.comment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.member.Member;
import org.example.post.Post;

import java.time.LocalDateTime;

// 댓글 — parent_id가 있으면 답글(1단계까지만)
@Entity
@Table(name = "comment")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 자기 참조 — 부모 댓글(답글일 때만). 지연 로딩
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Comment parent;

    @Column(nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // 12-1 — 내용을 실제로 바꾼 마지막 시각. 한 번도 안 고쳤으면 null
    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    protected Comment() {
        // JPA
    }

    public Comment(Post post, Member member, Comment parent, String content, LocalDateTime now) {
        this.post = post;
        this.member = member;
        this.parent = parent;
        this.content = content;
        this.createdAt = now;
        this.updatedAt = now;
    }

    // 내용이 같으면 아무것도 바꾸지 않는다("수정됨"이 붙지 않는다). 바꿨으면 true
    public boolean edit(String newContent, LocalDateTime now) {
        if (this.content.equals(newContent)) {
            return false;
        }
        this.content = newContent;
        this.editedAt = now;
        this.updatedAt = now;
        return true;
    }

    public Long getId() {
        return id;
    }

    public Post getPost() {
        return post;
    }

    public Member getMember() {
        return member;
    }

    public Comment getParent() {
        return parent;
    }

    public String getContent() {
        return content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public LocalDateTime getDeletedAt() {
        return deletedAt;
    }

    public LocalDateTime getEditedAt() {
        return editedAt;
    }

    public boolean isEdited() {
        return editedAt != null;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V30__add_comment_edited_at.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.


```sql
-- V30 — 댓글 수정(12-1). 수정한 시각을 따로 둔다.
-- updated_at은 삭제(5-3)에도 바뀌므로 "수정됨" 판단에 쓸 수 없다 — 수정만 기록하는 컬럼이 필요하다.
-- 기존 댓글은 수정한 적이 없으므로 NULL 그대로 둔다(채울 값이 없다).
ALTER TABLE comment ADD COLUMN edited_at DATETIME NULL AFTER updated_at;
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`CommentForbiddenException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다.


```java
package org.example.comment;

// 댓글은 있지만(404 아님) 작성자가 아니라서 지울 수 없을 때 — 전역 핸들러가 403으로 변환한다
public class CommentForbiddenException extends RuntimeException {

    public CommentForbiddenException() {
        super("본인 댓글만 삭제할 수 있습니다.");
    }

    public CommentForbiddenException(String message) {
        super(message);
    }
}
```

</details>
<details>
<summary>MyBatis Mapper — 댓글 수정 SQL 대체 구현</summary>

정답의 **MyBatis 대체 구현 코드** 토글에서 `CommentEditMapper.java`·`CommentEditMapper.xml`·수정된 `CommentService.java` 전문을 볼 수 있다. 작성자·글 공개 범위를 먼저 확인하고, Java에서 다른 내용인지 검사하고, SQL은 `deleted_at IS NULL`인 행만 바꾼다.

```xml
<update id="editIfLive">
    UPDATE comment
    SET content = #{content}, edited_at = #{now}, updated_at = #{now}
    WHERE id = #{id} AND deleted_at IS NULL
</update>
```

Mapper가 행을 바꾼 뒤에는 `EntityManager.refresh(comment)`로 JPA가 관리하던 댓글을 다시 읽는다. 그래야 같은 트랜잭션의 응답에 새 내용과 `editedAt`이 들어간다. 값이 같으면 UPDATE하지 않는다. MySQL의 기본 문자열 비교는 대소문자를 무시할 수 있으므로 변경 여부는 행 잠금 뒤 Java `String.equals`로 판단한다.

</details>


## 직접 확인

학습용 DB의 32번 글(회원 2의 글, 댓글 없음)에 회원 3(`tok-p03`)이 댓글을 달고 고친다.

```bash
BASE=http://localhost:8080
A='Authorization: Bearer tok-p03'; B='Authorization: Bearer tok-p04'; J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }

CID=$(curl -s -X POST "$BASE/api/posts/32/comments" -H "$A" -H "$J" -d '{"content":"[채점] 수정 전 댓글"}' | jid); echo $CID   # K
curl -s -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":"[채점] 수정 전 댓글"}'; echo   # S 같은 내용 → edited false
curl -s -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d "{\"content\":\"$(python3 -c 'print("가"*1000)')\"}" | head -c 80; echo   # VM 정확히 1000자 → 200
curl -s -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":"[채점] 수정한 댓글"}'; echo     # E 고침 → edited true
curl -s "$BASE/api/posts/32/comments"; echo                                                                 # L 목록
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$B" -H "$J" -d '{"content":"남이 바꿈"}'                     # F 남의 댓글
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{}'                                         # V0 content 없음
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":null}'                           # VN null
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":""}'                             # VE 빈 문자열
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":"   "}'                          # V 공백만
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d "{\"content\":\"$(python3 -c 'print("가"*1001)')\"}"   # VL 1001자
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":123}'   # VT 숫자 타입 → 400
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":["x"]}' # VA 배열 타입 → 400
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d 'content=abc'                                # VB JSON 아님
curl -i -X PATCH "$BASE/api/comments/abc" -H "$A" -H "$J" -d '{"content":"x"}'                             # VI 경로가 숫자 아님
curl -i -X PATCH "$BASE/api/comments/99999999" -H "$A" -H "$J" -d '{"content":"x"}'                        # VX 없는 댓글
curl -i -X DELETE "$BASE/api/comments/$CID" -H "$A"                                                         # D 지우기(뒷정리)
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$A" -H "$J" -d '{"content":"지운 뒤"}'                       # G 지운 댓글
curl -i -X PATCH "$BASE/api/comments/$CID" -H "$J" -d '{"content":"토큰 없음"}'                              # N
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 마지막에 만든 댓글을 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {
      "id": "K",
      "title": "회원 3이 댓글",
      "method": "POST",
      "path": "/api/posts/32/comments",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 수정 전 댓글"
      }
    },
    {
      "id": "S",
      "title": "같은 내용으로 수정",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 수정 전 댓글"
      }
    },
    {
      "id": "VM",
      "title": "정확히 1000자(상한 바로 안)",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "E",
      "title": "내용을 바꿔 수정",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 수정한 댓글"
      }
    },
    {
      "id": "L",
      "title": "댓글 목록",
      "method": "GET",
      "path": "/api/posts/32/comments"
    },
    {
      "id": "F",
      "title": "남의 댓글 수정(회원 4)",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p04"
      },
      "body": {
        "content": "남이 바꿈"
      }
    },
    {
      "id": "V0",
      "title": "content 없음",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {}
    },
    {
      "id": "VN",
      "title": "content가 null",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": null
      }
    },
    {
      "id": "VE",
      "title": "빈 문자열",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": ""
      }
    },
    {
      "id": "V",
      "title": "공백만",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "   "
      }
    },
    {
      "id": "VL",
      "title": "1001자(상한 바로 밖)",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "VT",
      "title": "숫자 content 타입 오류",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": 123
      }
    },
    {
      "id": "VA",
      "title": "배열 content 타입 오류",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": [
          "x"
        ]
      }
    },
    {
      "id": "VB",
      "title": "JSON이 아닌 본문",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03",
        "Content-Type": "application/json"
      },
      "body": "content=abc"
    },
    {
      "id": "VI",
      "title": "경로가 숫자 아님",
      "method": "PATCH",
      "path": "/api/comments/abc",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "x"
      }
    },
    {
      "id": "VX",
      "title": "없는 댓글",
      "method": "PATCH",
      "path": "/api/comments/99999999",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "x"
      }
    },
    {
      "id": "D",
      "title": "지우기(뒷정리)",
      "method": "DELETE",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      }
    },
    {
      "id": "G",
      "title": "지운 댓글 수정",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "지운 뒤"
      }
    },
    {
      "id": "N",
      "title": "토큰 없이 수정",
      "method": "PATCH",
      "path": "/api/comments/{{K.body.id}}",
      "body": {
        "content": "토큰 없음"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "K",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "S",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.content",
                "equals": "[채점] 수정 전 댓글"
              },
              {
                "path": "$.edited",
                "equals": false
              },
              {
                "path": "$.editedAt",
                "type": "null"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "E",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.id",
                "equals": "{{K.body.id}}"
              },
              {
                "path": "$.content",
                "equals": "[채점] 수정한 댓글"
              },
              {
                "path": "$.edited",
                "equals": true
              },
              {
                "path": "$.editedAt",
                "type": "string"
              }
            ]
          }
        },
        {
          "request": "L",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$[*].id",
                "contains": "{{K.body.id}}"
              },
              {
                "path": "$[*].content",
                "contains": "[채점] 수정한 댓글"
              },
              {
                "path": "$[*].edited",
                "contains": true
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "F",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "V0",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "VN",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "VE",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "V",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "VL",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "VT",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "VA",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "VB",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "VI",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "VX",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C4",
      "request": "VM",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.content",
            "matches": "^가{1000}$"
          },
          {
            "path": "$.edited",
            "equals": true
          }
        ]
      }
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "D",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "G",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "N",
          "expect": {
            "status": 401
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | K / S | `201` / `200`, 같은 내용으로 고치면 `edited`=false, `editedAt`=null — 바뀐 게 없으면 "수정됨"이 아니다 |
| C2 | E / L | `200`, `content`가 바뀌고 `edited`=true·`editedAt` 시각 / 댓글 목록에도 그 댓글이 바뀐 내용·`edited`=true로 나온다 |
| C3 | F / V0·VN·VE·V·VL·VT·VA / VB·VI / VX | 남의 댓글 `403` / `content` 없음·`null`·빈 문자열·공백만·1001자는 모두 `400`이고 `errors`에 `content` / JSON 아님·경로가 숫자 아님 `400` / 없는 댓글 `404` — 어느 것도 `500`이 아니다 |
| C4 | VM | 정확히 1000자는 `200` — 경계 바로 안쪽은 통과(E 앞에서 보내므로 마지막 내용은 E의 것이다) |
| C5 | D / G / N | 지우기 `204` → 지운 댓글 수정 `404` / 토큰 없음 `401` |
| D1 | `SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'practice' AND table_name = 'comment' AND column_name = 'edited_at'` | `1` |
| D2 | `SELECT content, edited_at IS NOT NULL, deleted_at IS NOT NULL FROM comment WHERE post_id = 32 ORDER BY id DESC LIMIT 1` | `[채점] 수정한 댓글`, `1`, `1` — 고친 내용이 저장됐고 마지막에 지워졌다 |
| D3 | `SELECT COUNT(*) FROM comment WHERE edited_at IS NOT NULL AND BINARY content NOT LIKE BINARY '[채점]%'` | `0` — 마이그레이션이 기존 댓글을 "수정됨"으로 만들지 않았다 |
| R1 | 판단 기준 | "수정됨"을 `updated_at`과 `created_at` 비교가 아니라 `edited_at IS NOT NULL`로 판단한다. 삭제가 `updated_at`을 바꾼다는 이유를 말할 수 있다 |
| R2 | 확인 순서 | 404(없음·지움·볼 수 없는 글) → 403(남의 것) 순서다. 거꾸로면 볼 수 없는 글의 댓글이 있다는 사실이 403으로 드러난다(3-1과 같은 이유) |
| R3 | 바꾸는 곳 | JPA에서는 내용 비교·`edited_at` 기록이 엔티티 `edit`에 있고, 같은 내용이면 더티 체킹 UPDATE가 없다. MyBatis 대안에서는 행 잠금 뒤 Service가 Java 문자열을 비교하고 Mapper가 `edited_at`을 기록하며, 같은 내용이면 Mapper를 호출하지 않는다 |
| R4 | 검증 재사용 | 작성(5-1)의 `@NotBlank`·`@Size(max = 1000)`과 같은 값 규칙을 수정 DTO의 `validatedContent()`에도 적용한다. 원문 `JsonNode`로 숫자·배열을 거르므로 문자열 강제 변환을 막는다. 1001자를 그대로 저장하려다 DB 오류(`500`)가 나는 대신 저장 전에 `400`으로 막는다 |
| R5 | 수정·삭제 경합 | 수정 조회에 `SELECT ... FOR UPDATE`에 해당하는 행 잠금이 있어, 삭제와 경합해도 삭제된 댓글이 수정 UPDATE로 되살아나지 않는다 |

## 필요한 지식

- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — PATCH의 의미
- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기) — 화면에 버튼이 없어도 서버가 막아야 하는 이유
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — 변경 감지(더티 체킹)
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 엔티티 메서드</summary>

`Comment`에 `editedAt` 필드와 `edit(String newContent, LocalDateTime now)`를 둔다. 내용이 같으면 아무것도 하지 않고, 다르면 `content`·`editedAt`·`updatedAt`을 바꾼다. 서비스는 `findById` → 지웠으면 404 → `PostAccessPolicy.canView(나, 댓글의 글)`이 아니면 404 → 작성자가 아니면 403 → `edit(...)`. 저장 호출은 필요 없다(변경 감지).
</details>

<details>
<summary>힌트 2 — LazyInitializationException</summary>

컨트롤러가 트랜잭션 밖에서 응답 DTO를 만들면 `comment.getMember().getNickname()`에서 터진다(`findById`로 읽은 댓글의 작성자는 지연 프록시). 3-1에서처럼 서비스 메서드 끝에서 DTO가 쓸 연관을 미리 읽어 두거나, 서비스가 DTO를 돌려준다.
</details>

## 다음 단계

[12-2. 댓글 멘션 알림 — @닉네임](12-2-mention-notification.md)
