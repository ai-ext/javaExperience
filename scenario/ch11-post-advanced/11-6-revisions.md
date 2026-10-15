# 11-6. 글 수정 이력

> 시나리오 DB(`community`). 이번 단계 마이그레이션은 `V23`이다.

## 상황

> "'처음엔 다른 말 써 놓고 나중에 슬쩍 바꿨다'는 신고가 들어와요. 누가 언제 무엇을 바꿨는지, 바뀌기 전엔 뭐였는지 운영자가 볼 수 있게 해 주세요. 작성자 본인도 자기 글 이력은 볼 수 있게요."

3-1의 수정(`PATCH /api/posts/{id}`)은 값을 **덮어쓴다** — 옛 제목·본문은 사라진다. [T-002](../../tickets/002-post-edited-flag.md)의 "(수정됨)" 표시는 "고친 적이 있다"만, [T-025](../../tickets/025-post-edit-conflict.md)의 버전 번호는 "몇 번 고쳤나"만 알려 준다. **무엇이 어떻게 바뀌었나**는 어디에도 없다.

수정이 저장될 때마다 **바뀌기 직전 모습**(스냅숏)을 별도 표에 한 행씩 남긴다. 같은 값으로 저장한 것은 수정이 아니므로 남기지 않는다. 잘못된 값이 섞인 수정은 아무것도 바꾸지 않고, 틀린 필드를 **모두** 알려 준다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 수정 이력",
  "summary": "수정이 저장될 때마다 바뀌기 전 모습을 남긴다. 작성자와 운영자만 본다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "수정 이력", "right": "운영자" },
    { "type": "text", "id": "post-title", "value": "[채점] 이력 제목 수정", "emphasis": "title" },
    {
      "type": "list",
      "id": "revisions",
      "label": "최신 수정부터",
      "items": [
        { "id": "rev-2", "title": "본문·태그 변경", "meta": "김자바 · 10월 10일 15:23 · 전: '처음 본문' / [java]" },
        { "id": "rev-1", "title": "제목 변경", "meta": "김자바 · 10월 10일 15:23 · 전: '[채점] 이력 원본'" }
      ]
    },
    { "type": "toast", "id": "forbidden", "value": "작성자와 운영자만 볼 수 있어요", "tone": "error" },
    { "type": "field", "id": "edit-title", "label": "제목(수정 화면)", "value": "", "error": "제목을 입력해 주세요." }
  ],
  "flows": [
    {
      "name": "수정 저장",
      "steps": [
        { "kind": "user", "text": "작성자가 제목을 고쳐 [저장]" },
        { "kind": "request", "method": "PATCH", "path": "/api/posts/69", "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"], "body": "{\"title\": \"[채점] 이력 제목 수정\"}" },
        { "kind": "server", "text": "보낸 필드 모두 검사 → 바뀌기 전 모습을 떠 둠 → 실제로 바뀐 필드만 적용 → 바뀐 게 있으면 이력 한 행" },
        { "kind": "db", "sql": "INSERT INTO post_revision (post_id, editor_id, title, content, tags, visibility, changed_fields, created_at)\nVALUES (69, 2, '[채점] 이력 원본', '처음 본문', 'java', 'PUBLIC', 'title', NOW());\nUPDATE post SET title = '[채점] 이력 제목 수정', updated_at = NOW() WHERE id = 69;" },
        { "kind": "response", "status": 200, "body": "{\"id\": 69, \"title\": \"[채점] 이력 제목 수정\", ...}" },
        { "kind": "screen", "text": "글 화면으로 돌아간다" }
      ]
    },
    {
      "name": "운영자가 이력 보기",
      "steps": [
        { "kind": "user", "text": "신고된 글에서 [수정 이력]" },
        { "kind": "request", "method": "GET", "path": "/api/posts/69/revisions", "headers": ["Authorization: Bearer tok-admin"] },
        { "kind": "server", "text": "로그인했나(401) → 볼 수 있는 글인가(404) → 작성자나 운영자인가(403)" },
        { "kind": "db", "sql": "SELECT r.*, m.nickname FROM post_revision r JOIN member m ON m.id = r.editor_id\nWHERE r.post_id = 69 ORDER BY r.id DESC" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 2, \"editor\": {\"id\": 2, \"nickname\": \"김자바\"}, \"editedAt\": \"…\", \"changedFields\": [\"content\", \"tags\"], \"before\": {\"title\": \"[채점] 이력 제목 수정\", \"content\": \"처음 본문\", \"tags\": [\"java\"], \"visibility\": \"PUBLIC\"}}, …]}" },
        { "kind": "screen", "text": "최신 수정부터, 바뀌기 전 값과 함께", "focus": ["revisions"] }
      ]
    },
    {
      "name": "잘못된 값이 섞인 수정",
      "steps": [
        { "kind": "user", "text": "제목을 비우고, 공개 범위를 이상한 값으로 보낸다" },
        { "kind": "request", "method": "PATCH", "path": "/api/posts/69", "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"], "body": "{\"title\": \"\", \"visibility\": \"SECRET\"}" },
        { "kind": "server", "text": "보낸 필드를 전부 검사해 틀린 것을 모은다 — 하나라도 틀리면 아무것도 안 바꾸고 이력도 안 남긴다" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"errors\": [{\"field\": \"title\", \"message\": \"제목을 입력해 주세요.\"}, {\"field\": \"visibility\", \"message\": \"공개 범위는 PUBLIC 또는 FOLLOWERS여야 합니다.\"}]}" },
        { "kind": "screen", "text": "두 입력칸에 각각 오류 문구", "focus": ["edit-title"] }
      ]
    }
  ]
}
```

## 만들 것

**V23** — `db/migration/V23__create_post_revision.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `post_id` | FK → `post` |
| `editor_id` | 고친 회원, FK → `member` |
| `title`, `content`, `visibility` | 수정 **직전** 값(`VARCHAR(200)`, `TEXT`, `VARCHAR(20)`) |
| `tags` | 수정 직전 태그 이름을 이름순으로 쉼표로 이은 것. 이름 안의 쉼표·역슬래시는 역슬래시로 이스케이프(`VARCHAR(500)`, 없으면 빈 문자열) |
| `changed_fields` | 이번 수정에서 바뀐 필드(`title,content,tags,visibility` 순으로 쉼표로 이음) |
| `created_at` | 고친 시각 |
| 인덱스 | `(post_id, id)` — 글 하나의 이력을 순서대로 |

**수정** — `PATCH /api/posts/{id}`(3-1)의 필드 규칙. 보낸 필드를 **먼저 모두 검사**하고, 하나라도 틀리면 아무것도 바꾸지 않고 `400` + `errors: [{field, message}]`(틀린 필드 **모두**). 어떤 값에도 `500`이 나오면 안 된다. JSON 원문 타입을 확인해 숫자를 문자열로 강제 변환하지 않는다. 타입 오류와 값 오류가 섞여도 모두 모은다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 아니오 | null·생략 = 그대로. 빈 문자열·공백만은 안 됨 | 1~200자 | 문자열 | 그대로 | 400(`title`) |
| `content` | 아니오 | null·생략 = 그대로. 빈 문자열·공백만은 안 됨 | — | 문자열 | 그대로 | 400(`content`) |
| `tags` | 아니오 | null·생략 = 그대로. `[]` = 모두 떼기. 원소 null·빈 문자열은 안 됨 | 5개까지, 이름 1~30자 | 문자열 **배열**(숫자 원소·문자열 하나는 400) | 그대로 | 400(`tags`) |
| `visibility` | 아니오 | null·생략 = 그대로 | — | `PUBLIC`·`FOLLOWERS` | 그대로 | 400(`visibility`) |
| `boardSlug` 등 그 밖의 필드 | — | — | — | 무시한다 | — | — |

**이력 남기기**

| 상황 | 이력 | `updated_at` |
|---|---|---|
| 보낸 값 중 하나라도 지금 값과 다름 | 한 행 — 바뀌기 **전** 제목·본문·태그·공개 범위 전체 + 바뀐 필드 목록 | 지금 시각 |
| 보낸 값이 모두 지금 값과 같음, 또는 `{}` | 남기지 않는다 | 그대로(3-1과 달라진 점 — 같은 값 저장은 수정이 아니다) |
| `400`·`403`·`404` | 남기지 않는다 | 그대로 |

태그 이름에 쉼표·역슬래시가 있어도 이력에서 원래 이름으로 복원한다. 태그는 이름 집합으로 비교한다(`["spring","java"]`와 `["java","spring"]`은 같다). 발행(11-1)·복구(11-5)는 내용 수정이 아니므로 이력을 남기지 않는다.

**이력 보기** — `GET /api/posts/{id}/revisions`

| 순서 | 상황 | 결과 |
|---|---|---|
| 1 | 토큰 없음 | `401` |
| 2 | 경로 `{id}`가 숫자가 아님 | `400` |
| 3 | 없는 글, 볼 수 없는 글(2-3) | `404` |
| 4 | 작성자도 운영자도 아님 | `403` |
| — | 그 밖 | `200` `{ "items": [ { "id", "editor": { "id", "nickname" }, "editedAt", "changedFields": [...], "before": { "title", "content", "tags": [...], "visibility" } } ] }` — 최신 수정부터 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 보낸 필드 모두 검사 → 바뀌기 전 모습을 떠 둠 → 실제로 바뀐 필드만 적용 → 바뀐 게 있으면 이력 한 행
- 로그인했나(401) → 볼 수 있는 글인가(404) → 작성자나 운영자인가(403)
- 보낸 필드를 전부 검사해 틀린 것을 모은다 — 하나라도 틀리면 아무것도 안 바꾸고 이력도 안 남긴다

<details>
<summary>Controller — HTTP 연결</summary>

`RevisionController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/posts/{id}/revisions")`. 변경된 메서드: `list`.


```java
package org.example.revision;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RevisionController {

    private final RevisionService revisionService;

    public RevisionController(RevisionService revisionService) {
        this.revisionService = revisionService;
    }

    // 11-6 글 수정 이력 — 최신 수정부터
    @GetMapping("/api/posts/{id}/revisions")
    public RevisionListResponse list(@PathVariable Long id, @LoginMember AuthenticatedMember viewer) {
        return revisionService.list(id, viewer);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`RevisionListResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.


```java
package org.example.post;

import tools.jackson.databind.JsonNode;

// 원문 JSON 타입을 보존해야 숫자→문자열 강제 변환과 첫 오류에서 검사가 중단되는 일을 막는다.
// null·생략은 "그대로", boardSlug 등 정의하지 않은 필드는 무시한다.
public record PostUpdateRequest(JsonNode title, JsonNode content, JsonNode tags, JsonNode visibility) {
}

package org.example.revision;

import org.example.post.AuthorResponse;

import java.time.LocalDateTime;
import java.util.List;

// 11-6 GET /api/posts/{id}/revisions
public record RevisionListResponse(List<Item> items) {

    public record Item(Long id, AuthorResponse editor, LocalDateTime editedAt, List<String> changedFields,
                       Before before) {
    }

    // 수정 직전 모습
    public record Before(String title, String content, List<String> tags, String visibility) {
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`, `RevisionService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `list`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.


```java
@Transactional
    public Post patch(Long id, AuthenticatedMember loginMember, PostUpdateRequest request) {
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);

        // 404(볼 수 없음)를 먼저 확인하고, 그다음에 403(작성자 아님)을 확인한다.
        // 반대로 하면 볼 수 없는 글의 존재가 403으로 드러난다.
        if (!accessPolicy.canView(loginMember, post)) {
            throw new PostNotFoundException();
        }
        if (!post.getAuthor().getId().equals(loginMember.id())) {
            throw new PostForbiddenException();
        }

        // 11-6 보낸 필드를 먼저 모두 검사하고, 틀린 것을 한꺼번에 400으로 돌려준다(하나라도 틀리면 아무것도 안 바꾼다)
        Map<String, String> errors = new LinkedHashMap<>();
        String title = readText(request.title(), "title", errors);
        String content = readText(request.content(), "content", errors);
        List<String> tags = readTags(request.tags(), errors);
        String visibility = readText(request.visibility(), "visibility", errors);
        if (title != null) collect(errors, () -> validateTitle(title));
        if (content != null) collect(errors, () -> validateContent(content));
        if (tags != null) collect(errors, () -> validateTags(tags));
        if (visibility != null) collect(errors, () -> validateVisibility(visibility));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }

        LocalDateTime now = LocalDateTime.now();

        // 11-6 바꾸기 전 모습을 떠 둔다 — 실제로 바뀐 필드가 있을 때만 이력으로 남긴다
        String beforeTitle = post.getTitle();
        String beforeContent = post.getContent();
        List<String> beforeTags = sortedTagNames(post.getTags());
        String beforeVisibility = post.getVisibility();
        List<String> changed = new ArrayList<>();

        if (title != null && !title.equals(beforeTitle)) {
            post.changeTitle(title);
            changed.add("title");
        }
        if (content != null && !content.equals(beforeContent)) {
            post.changeContent(content);
            changed.add("content");
        }
        if (tags != null) {
            Set<Tag> newTags = resolveTags(tags, now);
            if (!sortedTagNames(newTags).equals(beforeTags)) {
                post.replaceTags(newTags);
                changed.add("tags");
            }
        }
        if (visibility != null && !visibility.equals(beforeVisibility)) {
            post.changeVisibility(visibility);
            changed.add("visibility");
        }
        // boardSlug는 요청에 와도 무시한다(게시판은 못 옮긴다) — PostUpdateRequest에 아예 없다.

        // 같은 값으로 저장하면(바뀐 게 없으면) 이력도, 수정 시각도 남기지 않는다
        if (!changed.isEmpty()) {
            revisionRepository.save(new PostRevision(post, memberRepository.getReferenceById(loginMember.id()),
                    beforeTitle, beforeContent, beforeTags, beforeVisibility, changed, now));
            post.touchUpdatedAt(now);
        }

        // 트랜잭션 안에서 지연 로딩 연관을 미리 읽어 둔다(컨트롤러가 세션 밖에서 DTO를 만든다).
        // board는 findById로 읽은 프록시라 건드리지 않으면 LazyInitializationException이 난다
        // (create()의 board는 findBySlug로 이미 로딩된 엔티티라 같은 문제가 없었다).
        post.getBoard().getSlug();
        post.getAuthor().getNickname();
        post.getTags().forEach(Tag::getName);
        post.getImages().forEach(PostImage::getStoredName);
        return post;
    }

private static String readText(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isTextual()) {
            errors.put(field, field + "는 문자열이어야 합니다.");
            return null;
        }
        return value.asText();
    }

    private static List<String> readTags(JsonNode value, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isArray()) {
            errors.put("tags", "태그는 문자열 배열이어야 합니다.");
            return null;
        }
        List<String> tags = new java.util.ArrayList<>();
        for (JsonNode tag : value) {
            if (!tag.isTextual()) {
                errors.put("tags", "태그는 문자열 배열이어야 합니다.");
                return null;
            }
            tags.add(tag.asText());
        }
        return tags;
    }

package org.example.revision;

import org.example.auth.AuthenticatedMember;
import org.example.auth.AuthenticationRequiredException;
import org.example.post.AuthorResponse;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 11-6 이력 조회 — 401(누군지 모름) → 404(볼 수 없는 글) → 403(작성자·운영자 아님) 순서
@Service
public class RevisionService {

    private static final String ADMIN_ROLE = "ADMIN";

    private final PostRepository postRepository;
    private final PostRevisionRepository revisionRepository;
    private final PostAccessPolicy accessPolicy;

    public RevisionService(PostRepository postRepository, PostRevisionRepository revisionRepository,
                           PostAccessPolicy accessPolicy) {
        this.postRepository = postRepository;
        this.revisionRepository = revisionRepository;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public RevisionListResponse list(Long postId, AuthenticatedMember viewer) {
        if (viewer == null) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
        boolean isAuthor = post.getAuthor().getId().equals(viewer.id());
        if (!isAuthor && !ADMIN_ROLE.equals(viewer.role())) {
            throw new RevisionForbiddenException();
        }
        List<RevisionListResponse.Item> items = revisionRepository.findByPostIdNewestFirst(postId).stream()
                .map(r -> new RevisionListResponse.Item(
                        r.getId(),
                        new AuthorResponse(r.getEditor().getId(), r.getEditor().getNickname()),
                        r.getCreatedAt(),
                        r.getChangedFieldList(),
                        new RevisionListResponse.Before(r.getTitle(), r.getContent(), r.getTagList(), r.getVisibility())))
                .toList();
        return new RevisionListResponse(items);
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRevisionRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.


```java
package org.example.revision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRevisionRepository extends JpaRepository<PostRevision, Long> {

    // 최신 수정부터. 고친 사람 닉네임을 같이 쓰므로 fetch join(이력마다 회원을 따로 읽지 않는다)
    @Query("""
            SELECT r FROM PostRevision r JOIN FETCH r.editor
             WHERE r.post.id = :postId
             ORDER BY r.id DESC
            """)
    List<PostRevision> findByPostIdNewestFirst(@Param("postId") Long postId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`PostRevision.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.


```java
package org.example.revision;

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
import java.util.Arrays;
import java.util.List;

// 11-6 수정 이력(V23) — 수정 "직전"의 제목·본문·태그·공개 범위와, 이번에 바뀐 필드 목록
@Entity
@Table(name = "post_revision")
public class PostRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "editor_id", nullable = false)
    private Member editor;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    // 이름순으로 쉼표로 이은 태그 이름(없으면 빈 문자열)
    @Column(nullable = false, length = 500)
    private String tags;

    @Column(nullable = false, length = 20)
    private String visibility;

    @Column(name = "changed_fields", nullable = false, length = 100)
    private String changedFields;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PostRevision() {
        // JPA
    }

    public PostRevision(Post post, Member editor, String title, String content, List<String> tags,
                        String visibility, List<String> changedFields, LocalDateTime now) {
        this.post = post;
        this.editor = editor;
        this.title = title;
        this.content = content;
        this.tags = RevisionTagCodec.encode(tags);
        this.visibility = visibility;
        this.changedFields = String.join(",", changedFields);
        this.createdAt = now;
    }

    public Long getId() {
        return id;
    }

    public Member getEditor() {
        return editor;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public List<String> getTagList() {
        return RevisionTagCodec.decode(tags);
    }

    public String getVisibility() {
        return visibility;
    }

    public List<String> getChangedFieldList() {
        return Arrays.asList(changedFields.split(","));
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

package org.example.revision;

import java.util.ArrayList;
import java.util.List;

// 쉼표를 구분자로 쓰되 태그 이름 안의 쉼표·역슬래시는 이스케이프한다.
public final class RevisionTagCodec {
    private RevisionTagCodec() { }

    public static String encode(List<String> tags) {
        List<String> escaped = new ArrayList<>(tags.size());
        for (String tag : tags) {
            escaped.add(tag.replace("\\", "\\\\").replace(",", "\\,"));
        }
        return String.join(",", escaped);
    }

    public static List<String> decode(String encoded) {
        if (encoded.isEmpty()) return List.of();
        List<String> tags = new ArrayList<>();
        StringBuilder tag = new StringBuilder();
        boolean escaped = false;
        for (int i = 0; i < encoded.length(); i++) {
            char c = encoded.charAt(i);
            if (escaped) {
                tag.append(c);
                escaped = false;
            } else if (c == '\\') {
                escaped = true;
            } else if (c == ',') {
                tags.add(tag.toString());
                tag.setLength(0);
            } else {
                tag.append(c);
            }
        }
        if (escaped) throw new IllegalArgumentException("끝나지 않은 태그 이스케이프");
        tags.add(tag.toString());
        return List.copyOf(tags);
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V23__create_post_revision.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.


```sql
-- V23(11-6) — 글 수정 이력. 수정(PATCH)이 실제로 무언가를 바꿀 때마다 "바뀌기 전" 모습을 한 행씩 남긴다.
-- changed_fields는 그 수정에서 바뀐 필드 이름(쉼표로 이음, title,content,tags,visibility 순).
-- tags는 쉼표로 잇되 이름 안의 쉼표·역슬래시는 이스케이프한다(최대 5 × 30 × 2 + 구분 쉼표 4자).
CREATE TABLE post_revision (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    post_id        BIGINT       NOT NULL,
    editor_id      BIGINT       NOT NULL,
    title          VARCHAR(200) NOT NULL,
    content        TEXT         NOT NULL,
    tags           VARCHAR(500) NOT NULL,
    visibility     VARCHAR(20)  NOT NULL,
    changed_fields VARCHAR(100) NOT NULL,
    created_at     DATETIME     NOT NULL,
    PRIMARY KEY (id),
    KEY ix_post_revision_post (post_id, id),
    CONSTRAINT fk_post_revision_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_post_revision_editor FOREIGN KEY (editor_id) REFERENCES member (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '글 수정 이력 — 수정 직전 모습(스냅숏)';
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `RevisionForbiddenException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleRevisionForbidden`.


```java
@ExceptionHandler(RevisionForbiddenException.class)
    public ProblemDetail handleRevisionForbidden(RevisionForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
```

</details>
<details>
<summary>MyBatis Mapper — 이력 INSERT·JOIN 조회 대체 구현</summary>

정답의 **MyBatis 대체 구현 코드** 토글에서 `RevisionMapper.java`·`RevisionMapper.xml`·`RevisionRow.java`·수정된 `PostService.java`·`RevisionService.java` 전문을 볼 수 있다. 변경 전 값을 보관한 뒤 같은 트랜잭션 안에서 아래 INSERT를 실행한다. 조회는 편집자 닉네임을 JOIN해 한 번에 읽는다.

```xml
<insert id="insert">
    INSERT INTO post_revision (post_id, editor_id, title, content, tags, visibility, changed_fields, created_at)
    VALUES (#{postId}, #{editorId}, #{title}, #{content}, #{tags}, #{visibility}, #{changedFields}, #{now})
</insert>
<select id="findByPostIdNewestFirst" resultMap="revisionRow">
    SELECT r.id, r.editor_id, m.nickname AS editor_nickname, r.created_at,
           r.changed_fields, r.title, r.content, r.tags, r.visibility
    FROM post_revision r JOIN member m ON m.id = r.editor_id
    WHERE r.post_id = #{postId}
    ORDER BY r.id DESC
</select>
```

`#{...}`는 SQL 문자열 결합이 아니라 바인딩이다. 수정할 글의 잠금·모든 필드 검증·권한 확인은 JPA 경로와 동일하며, 이력 INSERT와 글 UPDATE가 함께 커밋하거나 롤백된다.

</details>


## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들어 고치므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {
      "id": "H0",
      "title": "H0 김자바의 새 글",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 이력 원본",
        "content": "처음 본문",
        "tags": [
          "java"
        ]
      }
    },
    {
      "id": "H1",
      "title": "H1 제목 수정",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 이력 제목 수정"
      }
    },
    {
      "id": "H2",
      "title": "H2 같은 제목으로 또 저장",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 이력 제목 수정"
      }
    },
    {
      "id": "H3",
      "title": "H3 본문·태그 수정",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "고친 본문",
        "tags": [
          "spring",
          "java"
        ]
      }
    },
    {
      "id": "H4",
      "title": "H4 빈 본문 {}",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "X1",
      "title": "X1 빈 제목 + 없는 공개 범위",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "",
        "visibility": "SECRET"
      }
    },
    {
      "id": "X2",
      "title": "X2 제목 201자",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "X3",
      "title": "X3 태그 6개",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ]
      }
    },
    {
      "id": "X4",
      "title": "X4 본문 공백만",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": "   "
      }
    },
    {
      "id": "X5",
      "title": "X5 빈 태그 이름",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [
          ""
        ]
      }
    },
    {
      "id": "X6",
      "title": "X6 tags가 배열이 아님",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": "java"
      }
    },
    {
      "id": "X7",
      "title": "X7 tags에 null",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [
          null
        ]
      }
    },
    {
      "id": "X8",
      "title": "X8 숫자 제목·숫자 태그",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": 123,
        "tags": [
          123
        ]
      }
    },
    {
      "id": "X9",
      "title": "X9 빈 제목·문자열 태그 타입 오류 함께",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "",
        "tags": "java"
      }
    },
    {
      "id": "L1",
      "title": "L1 작성자가 이력 보기",
      "method": "GET",
      "path": "/api/posts/{{H0.body.id}}/revisions",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "B1",
      "title": "B1 제목 정확히 200자",
      "method": "PATCH",
      "path": "/api/posts/{{H0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "L2",
      "title": "L2 이스프링이 이력 보기",
      "method": "GET",
      "path": "/api/posts/{{H0.body.id}}/revisions",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "L3",
      "title": "L3 운영자가 이력 보기",
      "method": "GET",
      "path": "/api/posts/{{H0.body.id}}/revisions",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    },
    {
      "id": "L4",
      "title": "L4 토큰 없이",
      "method": "GET",
      "path": "/api/posts/{{H0.body.id}}/revisions"
    },
    {
      "id": "L5",
      "title": "L5 없는 글",
      "method": "GET",
      "path": "/api/posts/99999999/revisions",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "L6",
      "title": "L6 숫자가 아닌 id",
      "method": "GET",
      "path": "/api/posts/abc/revisions",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "D0",
      "title": "D0 이스프링의 임시저장 글",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 남의 임시저장",
        "content": "x",
        "status": "DRAFT"
      }
    },
    {
      "id": "L7",
      "title": "L7 김자바가 남의 임시저장 글 이력 보기",
      "method": "GET",
      "path": "/api/posts/{{D0.body.id}}/revisions",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "T0",
      "title": "T0 쉼표·역슬래시 포함 태그 글",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 특수 태그 원본",
        "content": "x",
        "tags": [
          "a,b",
          "x\\y"
        ]
      }
    },
    {
      "id": "T1",
      "title": "T1 특수 태그 글 제목 수정",
      "method": "PATCH",
      "path": "/api/posts/{{T0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 특수 태그 수정"
      }
    },
    {
      "id": "T2",
      "title": "T2 특수 태그 수정 이력",
      "method": "GET",
      "path": "/api/posts/{{T0.body.id}}/revisions",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "H1",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "H2",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "H3",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "H4",
          "expect": {
            "status": 200
          }
        }
      ]
    },
    {
      "id": "C2",
      "request": "L1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "length": 2
          },
          {
            "path": "$.items[0].changedFields",
            "equals": [
              "content",
              "tags"
            ]
          },
          {
            "path": "$.items[0].before.content",
            "equals": "처음 본문"
          },
          {
            "path": "$.items[0].before.tags",
            "equals": [
              "java"
            ]
          },
          {
            "path": "$.items[0].editor.id",
            "equals": 2
          },
          {
            "path": "$.items[0].editedAt",
            "type": "string"
          },
          {
            "path": "$.items[1].changedFields",
            "equals": [
              "title"
            ]
          },
          {
            "path": "$.items[1].before.title",
            "equals": "[채점] 이력 원본"
          },
          {
            "path": "$.items[1].before.visibility",
            "equals": "PUBLIC"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "X1",
      "expect": {
        "status": 400,
        "json": [
          {
            "path": "$.errors[*].field",
            "contains": "title"
          },
          {
            "path": "$.errors[*].field",
            "contains": "visibility"
          }
        ]
      }
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "X2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "X3",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "X4",
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
          "request": "X5",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "X6",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "X7",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "X8",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "X9",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "L3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 3
              },
              {
                "path": "$.items[0].changedFields",
                "equals": [
                  "title"
                ]
              },
              {
                "path": "$.items[0].before.title",
                "equals": "[채점] 이력 제목 수정"
              },
              {
                "path": "$.items[0].before.tags",
                "equals": [
                  "java",
                  "spring"
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C6",
      "request": "L2",
      "expect": {
        "status": 403
      }
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "L4",
          "expect": {
            "status": 401
          }
        },
        {
          "request": "L5",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "L6",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "L7",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "T1",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "T2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "length": 1
              },
              {
                "path": "$.items[0].before.tags",
                "equals": [
                  "a,b",
                  "x\\y"
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{P}`는 H0에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | H1~H4 | 모두 `200` |
| C2 | L1(작성자) | 이력 **2개**(H2·H4는 바뀐 게 없어 안 남음). 첫 항목(최신): `changedFields`=`["content","tags"]`, `before.content`=`처음 본문`, `before.tags`=`["java"]`, `editor.id`=2. 둘째: `["title"]`, `before.title`=`[채점] 이력 원본` |
| C3 | X1(빈 제목 + `SECRET`) | `400`, `errors`에 `title`과 `visibility` **둘 다** |
| C4 | X2~X9(201자·태그 6개·공백 본문·빈 태그·배열 아님·null 원소·숫자 타입·복합 오류) | 모두 `400`(X6은 본문을 못 읽는 400, 나머지는 틀린 필드가 `errors`에) — 500이 아니다 |
| C5 | B1 / L3(운영자) | 제목 정확히 200자 `200` / 이력 **3개** — X1~X9는 이력을 남기지 않았다. 최신 항목 `before.tags`=`["java","spring"]`(이름순) |
| C6 | L2(이스프링) | `403` |
| C7 | L4 / L5 / L6 / L7 | `401` / `404` / `400` / 남의 임시저장 글 `404` |
| C8 | T0~T2 | 쉼표·역슬래시가 들어간 태그 이름도 수정 전 이력에서 그대로 복원된다 |
| D1 | `SELECT COUNT(*) FROM post_revision WHERE post_id = {P}` | `3` |
| D2 | `SELECT changed_fields, tags, editor_id FROM post_revision WHERE post_id = {P} ORDER BY id` | `title`, `java`, `2` / `content,tags`, `java`, `2` / `title`, `java,spring`, `2` |
| D3 | `SELECT title, content FROM post WHERE id = {P}` | 제목이 `가`×200, 본문 `고친 본문` — X1~X7이 아무것도 바꾸지 않았다 |
| R1 | 스냅숏 시점 | 바꾸기 **전에** 값을 떠 둔다(바꾼 뒤에 뜨면 "후" 값이 남는다). 엔티티를 고친 다음 이력을 만들면 왜 틀리는지 말할 수 있다 |
| R2 | 바뀐 것만 | 보낸 값과 지금 값을 비교해 바뀐 필드만 적용·기록한다. 같은 값 저장·`{}`는 이력도 `updated_at`도 건드리지 않는다 |
| R3 | 검증 먼저, 전부 모아서 | 보낸 필드를 모두 검사한 뒤에 바꾼다 — 제목은 바꾸고 태그에서 400이 나는 "반쯤 바뀐" 상태가 없다(같은 트랜잭션이라 롤백되더라도, 틀린 필드를 한 번에 알려 주려면 먼저 모아야 한다) |
| R4 | 권한 순서 | 401 → 404(볼 수 없는 글) → 403. 이력은 작성자·운영자만 — 남의 글의 옛 본문(지운 개인정보 등)이 새어 나가지 않는다 |
| R5 | 다른 방법 | 이력 테이블을 직접 쓰는 대신 Hibernate Envers(`@Audited`)나 DB 트리거·CDC로 남기는 방법이 있다는 것, 각각 무엇이 쉬워지고 무엇이 어려워지는지 말할 수 있다 |

## 필요한 지식

- [3-1. 부분 수정 — PATCH](../ch3-update-delete/3-1-patch.md)
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md) — 틀린 필드를 모두 알려 주기
- [G3 첫 트랜잭션](../../lessons/G3-first-transaction.md) — 이력 저장과 글 수정을 한 트랜잭션에
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md)
- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 검사를 먼저, 모아서</summary>

3-1의 `validateTitle`·`validateContent`… 는 틀리면 `InvalidPostFieldException(field, message)`를 던진다. 보낸 필드마다 불러서 예외를 잡아 `Map<String, String>`에 모으고, 비어 있지 않으면 그 맵을 담은 예외 하나를 던진다(11-4에서 만든 "여러 개 errors" 예외를 다시 써도 된다). 그다음에야 엔티티를 바꾼다.
</details>

<details>
<summary>힌트 2 — 스냅숏과 비교</summary>

```java
String beforeTitle = post.getTitle();
String beforeContent = post.getContent();
List<String> beforeTags = post.getTags().stream().map(Tag::getName).sorted().toList();
String beforeVisibility = post.getVisibility();
List<String> changed = new ArrayList<>();

if (request.title() != null && !request.title().equals(beforeTitle)) {
    post.changeTitle(request.title());
    changed.add("title");
}
// content·tags(이름 집합 비교)·visibility도 같은 모양
if (!changed.isEmpty()) {
    revisionRepository.save(new PostRevision(post, editor, beforeTitle, beforeContent, beforeTags,
            beforeVisibility, changed, now));
    post.touchUpdatedAt(now);
}
```

이력 목록은 `JOIN FETCH r.editor`로 고친 사람을 같이 읽고 `ORDER BY r.id DESC`.
</details>

## 다음 단계

11장 끝. 12장에서는 같은 레포로 댓글 수정·멘션·알림함·팔로우 같은 사람 사이의 기능을 붙인다 — 이번엔 `practice` 프로파일로 띄운다. [12-1. 댓글 수정 — "수정됨" 표시](../ch12-community-features/12-1-comment-edit.md)
