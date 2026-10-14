# 13-4. 금칙어 필터

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "도박 광고가 계속 올라와요. 특정 단어가 들어간 글·댓글은 아예 못 올리게 막아 주세요. '도 박 사 이 트'처럼 띄어 써서 피해 가는 것도요. 욕설은 막기까지는 말고 별표로 가려서 올라가게 해 주세요. 단어 목록은 운영자가 화면에서 직접 넣고 빼게요."

신고 처리(13-2)는 이미 올라온 글을 나중에 처리한다. 금칙어는 **저장하기 전에** 거른다. 단어마다 처리 방법이 둘이다.

| 처리 | 동작 | 응답 |
|---|---|---|
| `BLOCK` | 저장하지 않는다. 공백을 모두 지우고 대소문자를 무시해 비교한다("도 박 사 이 트"도 걸린다) | `400` + `errors`에 걸린 필드 **모두**(1-5와 같은 모양) |
| `MASK` | 그 단어를 같은 길이의 `*`로 바꿔 저장한다("바보" → "\*\*") | 평소와 같다(`201`·`200`), 내용만 가려져 있다 |

검사는 글 작성·복사·전체 교체(PUT)·부분 수정(PATCH), 오래된 임시저장 발행·휴지통 복구, 댓글 작성·수정(12-1) **여덟 경로 모두**에서 한 부품을 거친다. 한 곳이라도 빠지면 그 길로 광고가 들어온다(댓글 수정이 가장 흔히 빠진다).

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 금칙어",
  "summary": "BLOCK 단어는 저장 전에 400(어느 칸인지), MASK 단어는 *로 가려 저장. 단어 목록은 운영자 API로.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "동시성05" },
    { "type": "field", "id": "title", "label": "제목", "value": "바카라 후기", "error": "사용할 수 없는 단어가 들어 있습니다: 바카라" },
    { "type": "field", "id": "content", "label": "본문", "value": "토토사이트 추천", "multiline": true, "error": "사용할 수 없는 단어가 들어 있습니다: 토토사이트" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    { "type": "list", "id": "comments", "label": "댓글", "items": [{ "id": "c-masked", "title": "[채점] 너 정말 ** 같아", "meta": "동시성05 · 방금 전" }] }
  ],
  "flows": [
    {
      "name": "BLOCK 단어가 든 글",
      "steps": [
        { "kind": "user", "text": "제목·본문에 금칙어를 넣고 [등록]", "focus": ["title", "content", "submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts", "headers": ["Authorization: Bearer tok-c05", "Content-Type: application/json"], "body": "{\"boardSlug\": \"free\", \"title\": \"바카라 후기\", \"content\": \"토토사이트 추천\"}" },
        { "kind": "server", "text": "필드 검증(1-5) → 금칙어 검사: 공백 지우고 소문자로 맞춘 값에 BLOCK 단어가 있나 — 걸린 필드를 모두 모아 400" },
        { "kind": "db", "sql": "SELECT * FROM banned_word ORDER BY id", "note": "INSERT는 나가지 않는다" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"detail\": \"입력값이 올바르지 않습니다.\", \"errors\": [{\"field\": \"title\", ...}, {\"field\": \"content\", ...}]}" },
        { "kind": "screen", "text": "두 칸 모두 아래에 오류 문구", "focus": ["title", "content"] }
      ]
    },
    {
      "name": "MASK 단어가 든 댓글",
      "steps": [
        { "kind": "user", "text": "댓글에 '바보'를 넣어 등록", "focus": ["comments"] },
        { "kind": "request", "method": "POST", "path": "/api/posts/2/comments", "headers": ["Authorization: Bearer tok-c05", "Content-Type: application/json"], "body": "{\"content\": \"[채점] 너 정말 바보 같아\"}" },
        { "kind": "db", "sql": "INSERT INTO comment (..., content, ...) VALUES (..., '[채점] 너 정말 ** 같아', ...)" },
        { "kind": "response", "status": 201, "body": "{\"id\": 30, \"content\": \"[채점] 너 정말 ** 같아\", ...}" },
        { "kind": "screen", "text": "가려진 채로 보인다", "focus": ["c-masked"] }
      ]
    }
  ]
}
```

## 만들 것

**V44** — `db/migration/V44__create_banned_word.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `word` | `VARCHAR(30) NOT NULL`, `UNIQUE` |
| `action` | `VARCHAR(10)`, `CHECK (action IN ('BLOCK', 'MASK'))` |
| `created_by` | `BIGINT NULL`, FK → `member` (마이그레이션으로 넣은 단어는 `NULL`) |
| `created_at` | 만든 시각 |
| 처음 데이터 | `바카라`·`토토사이트`(BLOCK), `바보`·`멍청이`(MASK) — 회원 id 같은 DB마다 다른 값이 없어서 마이그레이션에 넣어도 된다 |

**금칙어 관리 API** — 권한 `MANAGE_BANNED_WORD`(13-1 표에 추가: **ADMIN만**)

| 메서드·경로 | 응답 |
|---|---|
| `GET /api/admin/banned-words` | `200` `[{ "id", "word", "action" }]` — id 순 |
| `POST /api/admin/banned-words` | `201` `{ "id", "word", "action" }`. 이미 있는 단어 `409` |
| `DELETE /api/admin/banned-words/{id}` | `204`. 없는 id `404` |

**필드 규칙** — 금칙어 추가

| 필드 | 필수 | null·빈 값 | 길이 | 형식·허용 값 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `word` | 필수 | 안 됨 — 없음·`null`·공백만 거절 | 2~30자(2·30 성공, 1·31 거절) | **공백 없음**(전각 공백 등 Unicode 공백도 금지; 검사 때 본문 공백을 지우고 비교하므로) | 없음 | `400`, `errors`에 `word` |
| `action` | 필수 | 안 됨 | — | `BLOCK`·`MASK` | 없음 | `400`, `errors`에 `action` |
| 본문 전체 | 필수 | — | — | JSON | — | JSON이 아니면 `400` |

**검사하는 곳** — 기존 입력 규칙(1-5·3-1·5-1·12-1)을 통과한 뒤에

| API | 검사하는 필드 |
|---|---|
| `POST /api/posts` | `title`, `content` |
| `POST /api/posts/{sourceId}/copies` | 새 제목, 원본에서 복사할 본문 |
| `PUT /api/posts/{id}` | 교체할 `title`, `content` |
| `PATCH /api/posts/{id}` | 보낸 필드만(`null`은 안 바꾸니 건너뛴다) |
| `POST /api/posts/{id}/publish` | 기존 임시저장의 제목·본문을 발행 직전에 재검사 |
| `POST /api/posts/{id}/restore` | 기존 휴지통 글의 제목·본문을 복구 직전에 재검사 |
| `POST /api/posts/{id}/comments` | `content` |
| `PATCH /api/comments/{id}` | `content` |

- 금칙어는 요청마다 DB에서 읽는다. 그래서 운영자가 지운 단어는 바로 풀린다.
- 12-2 멘션은 가린 뒤의 본문으로 뽑는다.

## 구현 가이드

글 생성·복사·PUT·PATCH·발행·복구와 댓글 생성·수정은 모두 `ContentFilter`를 거친다. BLOCK은 저장 전에 필드별 오류를 만들고, MASK는 가린 값을 저장한다. 아래 접기는 실제 답안 코드이며, 파일 전문은 **구현 코드**와 **MyBatis 대체 구현 코드** 토글에서도 볼 수 있다.

<details>
<summary>Controller — 관리 API·입력 타입</summary>

```java
package org.example.moderation;

import jakarta.validation.Validator;
import org.example.admin.Permission;
import org.example.admin.RequirePermission;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 13-4 — 금칙어 관리는 운영자(ADMIN)만(13-1 표의 MANAGE_BANNED_WORD)
@RestController
@RequirePermission(Permission.MANAGE_BANNED_WORD)
public class BannedWordController {

    private final BannedWordService bannedWordService;
    private final Validator validator;

    public BannedWordController(BannedWordService bannedWordService, Validator validator) {
        this.bannedWordService = bannedWordService;
        this.validator = validator;
    }

    @GetMapping("/api/admin/banned-words")
    public List<BannedWordResponse> list() {
        return bannedWordService.list();
    }

    @PostMapping("/api/admin/banned-words")
    @ResponseStatus(HttpStatus.CREATED)
    public BannedWordResponse add(@LoginMember AuthenticatedMember me, @RequestBody JsonNode body) {
        BannedWordRequest.Parsed parsed = BannedWordRequest.parse(body);
        BannedWordRequest request = parsed.request();
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(request).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return bannedWordService.add(me, request);
    }

    @DeleteMapping("/api/admin/banned-words/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bannedWordService.delete(id);
    }
}
```

</details>

<details>
<summary>DTO — 금칙어 요청·응답</summary>

```java
package org.example.moderation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

// 금칙어 안에는 공백을 둘 수 없다 — 검사할 때 본문의 공백을 지우고 비교하므로(띄어 쓰기로 피해 가기 방지)
public record BannedWordRequest(
        @NotBlank(message = "금칙어를 적어 주세요.")
        @Size(min = 2, max = 30, message = "금칙어는 2~30자입니다.")
        @Pattern(regexp = "(?U)^\\S*$", message = "금칙어에는 공백을 넣을 수 없습니다.")
        String word,

        @NotNull(message = "처리 방법을 골라 주세요.")
        @Pattern(regexp = "BLOCK|MASK", message = "처리 방법은 BLOCK 또는 MASK입니다.")
        String action
) {
    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        String word = text(body.get("word"), "word", errors);
        String action = text(body.get("action"), "action", errors);
        return new Parsed(new BannedWordRequest(word, action), Map.copyOf(errors));
    }

    public record Parsed(BannedWordRequest request, Map<String, String> errors) {
    }

    private static String text(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) return null;
        if (!value.isTextual()) {
            errors.put(field, field + "은 문자열이어야 합니다.");
            return null;
        }
        return value.asText();
    }
}

package org.example.moderation;

public record BannedWordResponse(Long id, String word, String action) {
}
```

</details>

<details>
<summary>Service — 관리 명령·중복 처리</summary>

```java
package org.example.moderation;

import org.example.auth.AuthenticatedMember;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BannedWordService {

    private final BannedWordRepository bannedWordRepository;
    private final Clock clock;

    public BannedWordService(BannedWordRepository bannedWordRepository, Clock clock) {
        this.bannedWordRepository = bannedWordRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<BannedWordResponse> list() {
        return bannedWordRepository.findAllByOrderByIdAsc().stream()
                .map(w -> new BannedWordResponse(w.getId(), w.getWord(), w.getAction()))
                .toList();
    }

    // 중복은 409 — 대소문자만 다른 것도 같은 단어로 본다(utf8mb4_0900_ai_ci 비교 + UNIQUE)
    @Transactional
    public BannedWordResponse add(AuthenticatedMember me, BannedWordRequest request) {
        String word = request.word().strip();
        if (bannedWordRepository.existsByWord(word)) {
            throw new DuplicateBannedWordException();
        }
        try {
            BannedWord saved = bannedWordRepository.saveAndFlush(new BannedWord(word, request.action(), me.id(),
                    LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS)));
            return new BannedWordResponse(saved.getId(), saved.getWord(), saved.getAction());
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateBannedWordException();
        }
    }

    @Transactional
    public void delete(Long id) {
        BannedWord word = bannedWordRepository.findById(id).orElseThrow(BannedWordNotFoundException::new);
        bannedWordRepository.delete(word);
    }
}
```

</details>

<details>
<summary>ContentFilter — BLOCK·MASK 판단</summary>

```java
package org.example.moderation;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// 13-4 금칙어 검사 한 곳 — 글(작성·수정)과 댓글(작성·수정)이 같이 쓴다.
// 1) BLOCK: 공백을 모두 지우고 소문자로 맞춘 본문에 금칙어가 있으면 거절("바 카 라"도 잡는다)
// 2) MASK: 본문에서 그 단어(대소문자 무시)를 같은 길이의 *로 바꾼다 — 공백을 끼운 변형은 가리지 않는다
// 금칙어는 요청마다 DB에서 읽는다(바로 반영). 자주 불리면 캐시가 필요하다 — 16장
@Component
public class ContentFilter {

    private static final String BLOCK = "BLOCK";

    private final BannedWordRepository bannedWordRepository;

    public ContentFilter(BannedWordRepository bannedWordRepository) {
        this.bannedWordRepository = bannedWordRepository;
    }

    // fields: 필드 이름 → 값(null이면 검사하지 않는다 — PATCH에서 안 바꾸는 필드). BLOCK에 걸리면 걸린 필드 모두를 담아 400
    public Map<String, String> apply(Map<String, String> fields) {
        List<BannedWord> words = bannedWordRepository.findAllByOrderByIdAsc();
        List<Map<String, String>> errors = new ArrayList<>();
        for (Map.Entry<String, String> e : fields.entrySet()) {
            if (e.getValue() == null) {
                continue;
            }
            String normalized = normalize(e.getValue());
            for (BannedWord w : words) {
                if (BLOCK.equals(w.getAction()) && normalized.contains(normalize(w.getWord()))) {
                    errors.add(Map.of("field", e.getKey(), "message", "사용할 수 없는 단어가 들어 있습니다: " + w.getWord()));
                    break;
                }
            }
        }
        if (!errors.isEmpty()) {
            throw new BannedContentException(errors);
        }
        Map<String, String> masked = new LinkedHashMap<>();
        fields.forEach((k, v) -> masked.put(k, v == null ? null : mask(v, words)));
        return masked;
    }

    private static String mask(String text, List<BannedWord> words) {
        String result = text;
        for (BannedWord w : words) {
            if (BLOCK.equals(w.getAction())) {
                continue;
            }
            Matcher m = Pattern.compile(Pattern.quote(w.getWord()), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                    .matcher(result);
            result = m.replaceAll(r -> "*".repeat(r.group().length()));
        }
        return result;
    }

    private static String normalize(String text) {
        return text.replaceAll("(?U)\\s+", "").toLowerCase(Locale.ROOT);
    }
}
```

</details>

<details>
<summary>글·댓글 Service — 네 저장 경로</summary>

```java
package org.example.post;

import org.example.auth.AuthenticatedMember;
import org.example.board.Board;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardRepository;
import org.example.board.BoardWriteForbiddenException;
import org.example.image.PostImage;
import org.example.image.PostImageRepository;
import tools.jackson.databind.JsonNode;
import org.example.member.Member;
import org.example.member.MemberRepository;
import org.example.revision.PostRevision;
import org.example.revision.PostRevisionRepository;
import org.example.moderation.ContentFilter;
import org.example.tag.Tag;
import org.example.tag.TagRepository;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.List;
import java.util.Set;

// 글 만들기·고치기 규칙. HTTP(ResponseEntity, 헤더 등)는 알지 않는다.
@Service
public class PostService {

    private static final String ADMIN_WRITE_ROLE = "ADMIN";
    private static final String ADMIN_ROLE = "ADMIN";
    private static final String DEFAULT_VISIBILITY = "PUBLIC";
    private static final String PUBLISHED = "PUBLISHED";
    private static final String DRAFT = "DRAFT";
    // 11-5 지운 뒤 이 기간 안에만 되살릴 수 있다
    private static final int RESTORE_DAYS = 30;

    // 1-5(PostCreateRequest)와 같은 규칙 — PATCH는 Bean Validation(@Valid)으로 표현할 수 없다
    // (null=그대로, 값이 있을 때만 검사해야 하는데 @NotBlank는 null도 실패로 본다). 숫자만이라도
    // 같은 값을 쓰도록 여기 모아 둔다.
    private static final int TITLE_MAX_LENGTH = 200;
    private static final int TAGS_MAX_COUNT = 5;
    private static final int TAG_NAME_MAX_LENGTH = 30;

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final TagRepository tagRepository;
    private final PostAccessPolicy accessPolicy;
    private final PostImageRepository postImageRepository;
    private final Clock clock;
    private final PostRevisionRepository revisionRepository;
    private final ContentFilter contentFilter;

    public PostService(PostRepository postRepository, BoardRepository boardRepository,
                        MemberRepository memberRepository, TagRepository tagRepository,
                        PostAccessPolicy accessPolicy, PostImageRepository postImageRepository, Clock clock,
                        PostRevisionRepository revisionRepository, ContentFilter contentFilter) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
        this.tagRepository = tagRepository;
        this.accessPolicy = accessPolicy;
        this.postImageRepository = postImageRepository;
        this.clock = clock;
        this.revisionRepository = revisionRepository;
        this.contentFilter = contentFilter;
    }

    @Transactional
    public Post create(Long authorId, PostCreateRequest request) {
        Board board = boardRepository.findBySlug(request.boardSlug())
                .orElseThrow(() -> new BoardNotFoundException(request.boardSlug()));
        // 작성자는 요청 본문이 아니라 토큰으로 인증된 회원에서 받는다(authorId 같은 값은 무시한다)
        Member author = memberRepository.getReferenceById(authorId);

        if (ADMIN_WRITE_ROLE.equals(board.getWriteRole()) && !ADMIN_ROLE.equals(author.getRole())) {
            throw new BoardWriteForbiddenException(board.getSlug());
        }

        // 13-4 금칙어 — BLOCK이면 400(걸린 필드 모두), MASK면 가린 값으로 저장
        Map<String, String> filtered = contentFilter.apply(fieldsOf(request.title(), request.content()));

        String visibility = request.visibility() != null ? request.visibility() : DEFAULT_VISIBILITY;
        // 11-1 상태를 안 보내면 지금처럼 바로 발행. DRAFT면 published_at은 비워 둔다(Post 생성자)
        String status = request.status() != null ? request.status() : PUBLISHED;
        LocalDateTime now = LocalDateTime.now();
        Post post = new Post(board, author, filtered.get("title"), filtered.get("content"),
                status, visibility, now);

        for (Tag tag : resolveTags(request.tags(), now)) {
            post.addTag(tag);
        }

        Post saved = postRepository.save(post);
        attachImages(saved, authorId, request.imageIds());
        // 트랜잭션(영속성 컨텍스트) 안에서 지연 로딩 연관을 미리 읽어 둔다.
        // open-in-view: false라서 컨트롤러가 트랜잭션 밖에서 건드리면 LazyInitializationException이 난다.
        saved.getAuthor().getNickname();
        saved.getTags().forEach(Tag::getName);
        return saved;
    }

    // 11-2 내가 올렸고 아직 어느 글에도 안 붙은 이미지만 붙일 수 있다. 하나라도 아니면 400(글도 저장 안 됨 — 같은 트랜잭션)
    private void attachImages(Post post, Long authorId, JsonNode imageIds) {
        if (imageIds == null || imageIds.isNull()) {
            return;
        }
        if (!imageIds.isArray()) {
            throw new InvalidPostFieldException("imageIds", "이미지 ID는 숫자 배열이어야 합니다.");
        }
        if (imageIds.size() == 0) {
            return;
        }
        List<Long> requestedIds = new java.util.ArrayList<>();
        for (int index = 0; index < imageIds.size(); index++) {
            JsonNode id = imageIds.get(index);
            if (!id.isIntegralNumber() || !id.canConvertToLong()) {
                throw new InvalidPostFieldException("imageIds[" + index + "]", "이미지 ID는 정수여야 합니다.");
            }
            requestedIds.add(id.longValue());
        }
        List<Long> ids = requestedIds.stream().distinct().sorted().toList();
        if (ids.size() > 10) {
            throw new InvalidPostFieldException("imageIds", "이미지는 10개까지입니다.");
        }
        List<PostImage> images = postImageRepository.findAllByIdForUpdate(ids);
        boolean allUsable = images.size() == ids.size() && images.stream().allMatch(image ->
                image.getUploader().getId().equals(authorId) && image.getPost() == null);
        if (!allUsable) {
            throw new InvalidPostFieldException("imageIds", "내가 올렸고 아직 글에 붙지 않은 이미지만 붙일 수 있습니다.");
        }
        images.forEach(image -> {
            image.attachTo(post);
            post.getImages().add(image);
        });
    }

    @Transactional
    public Post copy(Long sourceId, Long authorId, boolean copyTags, CopyPostRequest request) {
        Post source = postRepository.findById(sourceId).orElseThrow(PostNotFoundException::new);
        if (source.getDeletedAt() != null || !"PUBLISHED".equals(source.getStatus())
                || !"PUBLIC".equals(source.getVisibility())) {
            throw new PostNotFoundException();
        }
        Member author = memberRepository.getReferenceById(authorId);
        if (ADMIN_WRITE_ROLE.equals(source.getBoard().getWriteRole())
                && !ADMIN_ROLE.equals(author.getRole())) {
            throw new BoardWriteForbiddenException(source.getBoard().getSlug());
        }
        LocalDateTime now = LocalDateTime.now();
        Map<String, String> copiedFields = contentFilter.apply(fieldsOf(request.title(), source.getContent()));
        Post copied = new Post(source.getBoard(), author, copiedFields.get("title"), copiedFields.get("content"),
                "PUBLISHED", "PUBLIC", now);
        if (copyTags) {
            source.getTags().forEach(copied::addTag);
        }
        Post saved = postRepository.save(copied);
        saved.getBoard().getSlug();
        saved.getAuthor().getNickname();
        saved.getTags().forEach(Tag::getName);
        return saved;
    }

    @Transactional
    public PostDetailResponse replace(Long id, AuthenticatedMember me, PostReplaceRequest request) {
        Post post = postRepository.findByIdForUpdate(id).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(me, post)) {
            throw new PostNotFoundException();
        }
        if (!post.getAuthor().getId().equals(me.id())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        LocalDateTime now = LocalDateTime.now();
        Set<Tag> tags = new LinkedHashSet<>();
        for (String name : distinctTagNames(request.tags())) {
            tags.add(tagRepository.findByName(name)
                    .orElseGet(() -> tagRepository.save(new Tag(name, now))));
        }
        Map<String, String> filtered = contentFilter.apply(fieldsOf(request.title(), request.content()));
        post.replace(filtered.get("title"), filtered.get("content"), request.visibility(), tags, now);

        return new PostDetailResponse(post.getId(), post.getBoard().getSlug(), post.getTitle(),
                post.getContent(), post.getTags().stream().map(Tag::getName).toList(),
                post.getVisibility(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getViewCount(), post.getLikeCount(), post.getCommentCount(),
                post.getImages().stream().map(i -> new ImageResponse(i.getId(), i.url())).toList(),
                post.getStatus(), post.getPublishedAt(), post.getCreatedAt());
    }

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

        // 13-4 금칙어 — 형식 검사를 통과한 뒤, 바꾸는 필드만 검사한다(null은 그대로라 건너뛴다).
        // BLOCK이면 400(걸린 필드 모두), MASK면 가린 값으로 바꾼다 — 이력·변경 비교도 가린 값으로 한다
        Map<String, String> filtered = contentFilter.apply(fieldsOf(title, content));
        String newTitle = filtered.get("title");
        String newContent = filtered.get("content");

        LocalDateTime now = LocalDateTime.now();

        // 11-6 바꾸기 전 모습을 떠 둔다 — 실제로 바뀐 필드가 있을 때만 이력으로 남긴다
        String beforeTitle = post.getTitle();
        String beforeContent = post.getContent();
        List<String> beforeTags = sortedTagNames(post.getTags());
        String beforeVisibility = post.getVisibility();
        List<String> changed = new ArrayList<>();

        if (newTitle != null && !newTitle.equals(beforeTitle)) {
            post.changeTitle(newTitle);
            changed.add("title");
        }
        if (newContent != null && !newContent.equals(beforeContent)) {
            post.changeContent(newContent);
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

    // 11-1 임시저장 글 발행 — 404(볼 수 없음) → 403(작성자 아님) → 409(임시저장이 아님) 순서
    @Transactional
    public Post publish(Long id, AuthenticatedMember loginMember) {
        // 같은 임시저장 글의 발행 요청을 직렬화해 두 번째 요청은 커밋 뒤 상태를 본다.
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(loginMember, post)) {
            throw new PostNotFoundException();
        }
        if (!post.getAuthor().getId().equals(loginMember.id())) {
            throw new PostForbiddenException();
        }
        if (!DRAFT.equals(post.getStatus())) {
            throw new PostNotDraftException();
        }
        // 금칙어가 새로 추가된 뒤 오래된 임시저장을 발행하는 우회도 막는다.
        Map<String, String> filtered = contentFilter.apply(fieldsOf(post.getTitle(), post.getContent()));
        post.changeTitle(filtered.get("title"));
        post.changeContent(filtered.get("content"));
        post.publish(LocalDateTime.now());

        post.getBoard().getSlug();
        post.getAuthor().getNickname();
        post.getTags().forEach(Tag::getName);
        post.getImages().forEach(PostImage::getStoredName);
        return post;
    }

    // 11-1 내 임시저장 글 — 최근에 고친 것부터. 지운 글은 빠진다
    @Transactional(readOnly = true)
    public MyDraftsResponse myDrafts(AuthenticatedMember loginMember) {
        List<MyDraftItemResponse> items = postRepository.findMyDrafts(loginMember.id()).stream()
                .map(p -> new MyDraftItemResponse(p.getId(), p.getBoard().getSlug(), p.getTitle(), p.getUpdatedAt()))
                .toList();
        return new MyDraftsResponse(items);
    }

    // 11-5 휴지통 — 내가 지운 내 글 중 아직 복구할 수 있는 것(지운 지 30일 안), 최근에 지운 순
    @Transactional(readOnly = true)
    public MyTrashResponse myTrash(AuthenticatedMember loginMember) {
        LocalDateTime now = LocalDateTime.now(clock);
        List<MyTrashItemResponse> items = postRepository.findMyTrash(loginMember.id(), now.minusDays(RESTORE_DAYS)).stream()
                .map(p -> new MyTrashItemResponse(p.getId(), p.getBoard().getSlug(), p.getTitle(), p.getDeletedAt(),
                        p.getDeletedAt().plusDays(RESTORE_DAYS)))
                .toList();
        return new MyTrashResponse(items);
    }

    // 11-5 복구 — 404(없음·내 글 아님) → 409(지운 글 아님) → 403(내가 지운 게 아님) → 410(30일 지남) 순서.
    // 지운 글은 2-3 규칙(canView)으로는 아무도 못 보므로, 여기서는 "작성자인가"를 직접 확인한다.
    @Transactional
    public Post restore(Long id, AuthenticatedMember loginMember) {
        // 삭제·중복 복구와 경합할 때 판정 이후의 상태 변경까지 직렬화한다.
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);
        if (!post.getAuthor().getId().equals(loginMember.id())) {
            throw new PostNotFoundException();
        }
        if (post.getDeletedAt() == null) {
            throw new PostNotDeletedException();
        }
        if (!loginMember.id().equals(post.getDeletedBy())) {
            throw new PostRestoreForbiddenException();
        }
        if (post.getDeletedAt().plusDays(RESTORE_DAYS).isBefore(LocalDateTime.now(clock))) {
            throw new PostRestoreExpiredException();
        }
        // 삭제된 동안 금칙어가 추가됐으면 복구 전에 다시 검사한다.
        Map<String, String> filtered = contentFilter.apply(fieldsOf(post.getTitle(), post.getContent()));
        post.changeTitle(filtered.get("title"));
        post.changeContent(filtered.get("content"));
        post.restore();

        post.getBoard().getSlug();
        post.getAuthor().getNickname();
        post.getTags().forEach(Tag::getName);
        post.getImages().forEach(PostImage::getStoredName);
        return post;
    }

    @Transactional
    public void delete(Long id, AuthenticatedMember loginMember) {
        // 발행과 삭제가 같은 글을 동시에 갱신하지 않도록 행을 잠근다.
        Post post = postRepository.findByIdForUpdate(id)
                .orElseThrow(PostNotFoundException::new);

        // 404(볼 수 없음·이미 삭제됨) → 403(작성자도 운영자도 아님) 순서
        if (!accessPolicy.canView(loginMember, post)) {
            throw new PostNotFoundException();
        }
        boolean isAuthor = post.getAuthor().getId().equals(loginMember.id());
        boolean isAdmin = ADMIN_ROLE.equals(loginMember.role());
        if (!isAuthor && !isAdmin) {
            throw new PostForbiddenException();
        }

        post.delete(LocalDateTime.now(clock), loginMember.id());
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

    private static void collect(Map<String, String> errors, Runnable validation) {
        try {
            validation.run();
        } catch (InvalidPostFieldException e) {
            errors.put(e.getField(), e.getMessage());
        }
    }

    private static List<String> sortedTagNames(Set<Tag> tags) {
        return tags.stream().map(Tag::getName).sorted().toList();
    }

    private static Map<String, String> fieldsOf(String title, String content) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("title", title);
        fields.put("content", content);
        return fields;
    }

    private void validateTitle(String title) {
        if (title.isBlank()) {
            throw new InvalidPostFieldException("title", "제목을 입력해 주세요.");
        }
        if (title.length() > TITLE_MAX_LENGTH) {
            throw new InvalidPostFieldException("title", "제목은 " + TITLE_MAX_LENGTH + "자 이하여야 합니다.");
        }
    }

    private void validateContent(String content) {
        if (content.isBlank()) {
            throw new InvalidPostFieldException("content", "본문을 입력해 주세요.");
        }
    }

    private void validateTags(List<String> tags) {
        if (tags.size() > TAGS_MAX_COUNT) {
            throw new InvalidPostFieldException("tags", "태그는 " + TAGS_MAX_COUNT + "개까지입니다.");
        }
        for (String tag : tags) {
            if (tag == null || tag.isBlank() || tag.length() > TAG_NAME_MAX_LENGTH) {
                throw new InvalidPostFieldException("tags", "태그 이름은 1~" + TAG_NAME_MAX_LENGTH + "자여야 합니다.");
            }
        }
    }

    private void validateVisibility(String visibility) {
        if (!"PUBLIC".equals(visibility) && !"FOLLOWERS".equals(visibility)) {
            throw new InvalidPostFieldException("visibility", "공개 범위는 PUBLIC 또는 FOLLOWERS여야 합니다.");
        }
    }

    // 이름으로 찾고 없으면 만든다. 요청 안의 중복은 제거한다(1-4/1-5와 같은 규칙, 3-1에서도 재사용).
    private Set<Tag> resolveTags(List<String> tagNames, LocalDateTime now) {
        Set<Tag> tags = new LinkedHashSet<>();
        for (String tagName : distinctTagNames(tagNames)) {
            Tag tag = tagRepository.findByName(tagName)
                    .orElseGet(() -> tagRepository.save(new Tag(tagName, now)));
            tags.add(tag);
        }
        return tags;
    }

    private List<String> distinctTagNames(List<String> tags) {
        if (tags == null) {
            return List.of();
        }
        Set<String> seen = new LinkedHashSet<>(tags);
        return List.copyOf(seen);
    }
}


package org.example.comment;

import org.example.auth.AuthenticatedMember;
import org.example.member.Member;
import org.example.member.MemberRepository;
import org.example.moderation.ContentFilter;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.notification.CommentCreatedEvent;
import org.example.notification.CommentMentionedEvent;
import org.example.post.AuthorResponse;
import org.example.post.PostRepository;
import org.example.social.BlockPolicy;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private static final String PUBLISHED = "PUBLISHED";

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final BlockPolicy blockPolicy;
    private final ApplicationEventPublisher eventPublisher;
    private final ContentFilter contentFilter;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository,
                           MemberRepository memberRepository, PostAccessPolicy accessPolicy,
                           BlockPolicy blockPolicy, ApplicationEventPublisher eventPublisher,
                           ContentFilter contentFilter) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.blockPolicy = blockPolicy;
        this.eventPublisher = eventPublisher;
        this.contentFilter = contentFilter;
    }

    // 댓글 저장과 comment_count 증가를 한 트랜잭션으로 묶는다 — 둘 중 하나만 반영되면 숫자가 틀어진다
    @Transactional
    public Comment create(Long postId, AuthenticatedMember loginMember, CommentCreateRequest request) {
        Post post = findCommentablePost(postId, loginMember);
        Comment parent = resolveParent(postId, request.parentId());

        // 13-4 금칙어 — BLOCK 400, MASK는 가린 내용으로 저장(멘션은 가린 뒤 본문 기준)
        String content = contentFilter.apply(Map.of("content", request.content())).get("content");
        Member author = memberRepository.getReferenceById(loginMember.id());
        Comment saved = commentRepository.save(new Comment(post, author, parent, content, LocalDateTime.now()));
        postRepository.incrementCommentCount(postId);
        // 9-4: 글 작성자에게 COMMENT 알림(자기 글에 자기 댓글은 리스너 쪽에서 거른다). 같은 트랜잭션에서 만든다
        eventPublisher.publishEvent(new CommentCreatedEvent(postId, saved.getId(), loginMember.id()));
        // 12-2: 본문의 @닉네임 — 누구에게 보낼지(존재·차단·볼 수 있나)는 알림 쪽에서 판단한다
        publishMentions(postId, saved.getId(), loginMember.id(), Mentions.extract(content));

        // 트랜잭션 안에서 지연 로딩 연관을 미리 읽어 둔다(컨트롤러가 세션 밖에서 DTO를 만든다)
        saved.getMember().getNickname();
        return saved;
    }

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

        String requestedContent = request.validatedContent();
        String before = comment.getContent();
        String content = contentFilter.apply(Map.of("content", requestedContent)).get("content");  // 13-4
        if (comment.edit(content, LocalDateTime.now())) {
            // 12-2: 고치면서 새로 넣은 멘션에만 알린다(이미 알린 사람에게 또 보내지 않는다)
            publishMentions(comment.getPost().getId(), comment.getId(), loginMember.id(),
                    Mentions.added(before, content));
        }

        // 컨트롤러가 세션 밖에서 DTO를 만든다 — 지연 로딩 연관을 미리 읽어 둔다
        comment.getMember().getNickname();
        comment.getPost().getId();
        if (comment.getParent() != null) {
            comment.getParent().getId();
        }
        return comment;
    }

    // 작성자만 지운다(soft delete). 없거나 이미 지운 댓글은 404, 남의 댓글은 403.
    // comment_count 감소는 같은 트랜잭션에서 원자적으로 한다.
    @Transactional
    public void delete(Long commentId, AuthenticatedMember loginMember) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(CommentNotFoundException::new);

        if (!comment.getMember().getId().equals(loginMember.id())) {
            throw new CommentForbiddenException();
        }

        // 앞선 읽기와 별개로 DB에서 deleted_at IS NULL을 다시 검사한다.
        // 동시에 같은 댓글을 지울 때 한 요청만 1행을 변경하고 댓글 수를 내린다.
        if (commentRepository.softDeleteIfLive(commentId, LocalDateTime.now()) != 1) {
            throw new CommentNotFoundException();
        }
        if (postRepository.decrementCommentCount(comment.getPost().getId()) != 1) {
            throw new IllegalStateException("댓글 수 변경 실패");
        }
    }

    // 그 글의 댓글을 작성자와 함께 한 번에 읽어(N+1 없음) 메모리에서 트리로 조립한다.
    // 표시 규칙: 지운 최상위는 살아 있는 답글이 있을 때만 "삭제된 댓글입니다" 자리를 남긴다,
    // 지운 답글은 뺀다, 보는 사람과 차단 관계인 회원의 댓글은 뺀다(최상위면 답글까지).
    @Transactional(readOnly = true)
    public List<CommentThreadResponse> list(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }

        List<Comment> all = commentRepository.findByPostIdWithMember(postId);
        Long viewerId = viewer == null ? null : viewer.id();
        Set<Long> blockedMemberIds = viewerId == null ? Set.of() : blockPolicy.blockRelatedIds(viewerId);

        Map<Long, List<Comment>> repliesByParent = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId(), LinkedHashMap::new, Collectors.toList()));

        List<CommentThreadResponse> result = new ArrayList<>();
        for (Comment top : all) {
            if (top.getParent() != null) {
                continue; // 답글은 부모와 함께 처리
            }
            if (blockedMemberIds.contains(top.getMember().getId())) {
                continue; // 차단 — 최상위째 뺀다(답글도 함께)
            }

            // "살아 있는 답글"은 지운 것·차단으로 빠지는 것을 제외하고 센다
            List<Comment> visibleReplies = repliesByParent.getOrDefault(top.getId(), List.of()).stream()
                    .filter(r -> r.getDeletedAt() == null)
                    .filter(r -> !blockedMemberIds.contains(r.getMember().getId()))
                    .toList();

            boolean deleted = top.getDeletedAt() != null;
            if (deleted && visibleReplies.isEmpty()) {
                continue; // 지웠고 남은 답글도 없으면 자리도 남기지 않는다
            }

            List<CommentReplyResponse> replies = visibleReplies.stream()
                    .map(r -> new CommentReplyResponse(r.getId(), toAuthor(r.getMember()), r.getContent(), r.getCreatedAt(),
                            r.isEdited()))
                    .toList();

            result.add(new CommentThreadResponse(
                    top.getId(),
                    deleted ? null : toAuthor(top.getMember()),
                    deleted ? "삭제된 댓글입니다" : top.getContent(),
                    top.getCreatedAt(),
                    !deleted && top.isEdited(),
                    deleted,
                    replies
            ));
        }
        return result;
    }

    private void publishMentions(Long postId, Long commentId, Long actorId, Set<String> nicknames) {
        if (!nicknames.isEmpty()) {
            eventPublisher.publishEvent(new CommentMentionedEvent(postId, commentId, actorId, nicknames));
        }
    }

    // 볼 수 있는 PUBLISHED 글인가 — 아니면 404(4-1 LikeService.findLikeablePost와 같은 규칙)
    private Post findCommentablePost(Long postId, AuthenticatedMember loginMember) {
        Post post = postRepository.findById(postId)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(loginMember, post) || !PUBLISHED.equals(post.getStatus())) {
            throw new PostNotFoundException();
        }
        return post;
    }

    // 부모 댓글 검증 — 같은 글의, 최상위, 지워지지 않은 댓글이어야 한다.
    // 부모가 없으면 404(CommentNotFoundException), 있는데 규칙에 안 맞으면 400(InvalidParentCommentException).
    private Comment resolveParent(Long postId, Long parentId) {
        if (parentId == null) {
            return null;
        }
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(CommentNotFoundException::new);
        if (!parent.getPost().getId().equals(postId)) {
            throw new InvalidParentCommentException("다른 글의 댓글에는 답글을 달 수 없습니다.");
        }
        if (parent.getParent() != null) {
            throw new InvalidParentCommentException("답글에는 답글을 달 수 없습니다.");
        }
        if (parent.getDeletedAt() != null) {
            throw new InvalidParentCommentException("지워진 댓글에는 답글을 달 수 없습니다.");
        }
        return parent;
    }

    private AuthorResponse toAuthor(Member member) {
        return new AuthorResponse(member.getId(), member.getNickname());
    }
}
```

</details>

<details>
<summary>JPA / Repository — 목록·중복</summary>

```java
package org.example.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannedWordRepository extends JpaRepository<BannedWord, Long> {

    boolean existsByWord(String word);

    List<BannedWord> findAllByOrderByIdAsc();
}
```

</details>

<details>
<summary>Entity — 금칙어 행</summary>

```java
package org.example.moderation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// 금칙어(V44) — action: BLOCK(저장 거절)·MASK(*로 가리기)
@Entity
@Table(name = "banned_word")
public class BannedWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String word;

    @Column(nullable = false, length = 10)
    private String action;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected BannedWord() {
        // JPA
    }

    public BannedWord(String word, String action, Long createdBy, LocalDateTime now) {
        this.word = word;
        this.action = action;
        this.createdBy = createdBy;
        this.createdAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getWord() {
        return word;
    }

    public String getAction() {
        return action;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 테이블·초기 데이터</summary>

```sql
-- V44 — 금칙어(13-4). BLOCK이면 글·댓글 저장을 거절(400), MASK면 그 부분을 *로 바꿔 저장한다.
-- 처음 몇 개는 마이그레이션으로 넣는다 — 회원 id 같은 DB마다 다른 값이 없어서 community·practice 어디에 돌아도 같다.
CREATE TABLE banned_word (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    word       VARCHAR(30) NOT NULL,
    action     VARCHAR(10) NOT NULL,
    created_by BIGINT      NULL,
    created_at DATETIME    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_banned_word (word),
    CONSTRAINT fk_banned_word_created_by FOREIGN KEY (created_by) REFERENCES member (id),
    CONSTRAINT ck_banned_word_action CHECK (action IN ('BLOCK', 'MASK'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '금칙어 — BLOCK(저장 거절)·MASK(가리기)';

INSERT INTO banned_word (word, action, created_by, created_at) VALUES
    ('바카라', 'BLOCK', NULL, NOW()),
    ('토토사이트', 'BLOCK', NULL, NOW()),
    ('바보', 'MASK', NULL, NOW()),
    ('멍청이', 'MASK', NULL, NOW());
```

</details>

<details>
<summary>예외 처리 — 필드별 BLOCK 오류</summary>

```java
package org.example.moderation;

import java.util.List;
import java.util.Map;

// BLOCK 금칙어가 들어 있는 입력 — 전역 핸들러가 1-5와 같은 모양(400 + errors[field, message])으로 바꾼다
public class BannedContentException extends RuntimeException {

    private final List<Map<String, String>> errors;

    public BannedContentException(List<Map<String, String>> errors) {
        super("사용할 수 없는 단어가 들어 있습니다.");
        this.errors = errors;
    }

    public List<Map<String, String>> getErrors() {
        return errors;
    }
}

@ExceptionHandler(BannedContentException.class)
    public ProblemDetail handleBannedContent(BannedContentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors());
        return problem;
    }
```

</details>

<details>
<summary>권한 표 — MANAGE_BANNED_WORD</summary>

```java
package org.example.admin;

// 13-1 운영 권한 — 역할(Role)이 어떤 권한을 갖는지는 Role 한 곳에서 정한다.
// 컨트롤러는 "운영자인가"가 아니라 "이 일을 할 권한이 있나"(@RequirePermission)만 적는다.
public enum Permission {
    MODERATE_POST,   // 글 숨김·복구, 숨김 글 보기
    MANAGE_ROLE,     // 역할 바꾸기
    RUN_BATCH,       // 8-5 정합성 배치 수동 실행
    HANDLE_REPORT,   // 13-2 신고 목록·처리
    SUSPEND_MEMBER,  // 13-3 기간 정지·해제
    MANAGE_BANNED_WORD  // 13-4 금칙어 관리(ADMIN만)
}

package org.example.admin;

import java.util.EnumSet;
import java.util.Set;

// 13-1 역할 → 권한 표. 새 역할·권한이 생기면 여기만 고친다(문자열 "ADMIN" 비교를 여기저기 두지 않는다)
public enum Role {
    USER(EnumSet.noneOf(Permission.class)),
    MODERATOR(EnumSet.of(Permission.MODERATE_POST, Permission.HANDLE_REPORT, Permission.SUSPEND_MEMBER)),
    ADMIN(EnumSet.allOf(Permission.class));

    private final Set<Permission> permissions;

    Role(Set<Permission> permissions) {
        this.permissions = permissions;
    }

    public boolean can(Permission permission) {
        return permissions.contains(permission);
    }

    // member.role 문자열(DB 값)로 판정 — 모르는 값이면 아무 권한도 없다
    public static boolean has(String role, Permission permission) {
        for (Role r : values()) {
            if (r.name().equals(role)) {
                return r.can(permission);
            }
        }
        return false;
    }
}
```

</details>

<details>
<summary>MyBatis Mapper — 목록·중복·추가·삭제</summary>

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.moderation.BannedWordMapper">
    <select id="findAll" resultType="org.example.moderation.BannedWordRow">
        SELECT id, word, action FROM banned_word ORDER BY id
    </select>

    <select id="existsByWord" resultType="boolean">
        SELECT COUNT(*) > 0 FROM banned_word WHERE word = #{word}
    </select>

    <insert id="insert" parameterType="org.example.moderation.BannedWordWrite"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO banned_word (word, action, created_by, created_at)
        VALUES (#{word}, #{action}, #{createdBy}, #{createdAt})
    </insert>

    <delete id="delete">
        DELETE FROM banned_word WHERE id = #{id}
    </delete>
</mapper>
```

</details>

## 직접 확인

회원 11(`tok-c05`, 동시성05)이 글·댓글을 쓴다. 운영자가 `도박사이트`를 더했다가 끝에서 지운다.

```bash
BASE=http://localhost:8080
AD='Authorization: Bearer tok-admin'; C5='Authorization: Bearer tok-c05'; J='Content-Type: application/json'

WID=$(curl -s -X POST "$BASE/api/admin/banned-words" -H "$AD" -H "$J" -d '{"word":"도박사이트","action":"BLOCK"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'); echo $WID   # A1
curl -s -X POST "$BASE/api/posts" -H "$C5" -H "$J" -d '{"boardSlug":"free","title":"[채점] 홍보","content":"도 박 사 이 트 놀러 오세요"}'; echo   # B2 400
curl -s -X POST "$BASE/api/posts" -H "$C5" -H "$J" -d '{"boardSlug":"free","title":"바카라 후기","content":"토토사이트 추천"}'; echo       # B3 400 — errors 둘
CID=$(curl -s -X POST "$BASE/api/posts/2/comments" -H "$C5" -H "$J" -d '{"content":"[채점] 너 정말 바보 같아"}' | tee /dev/stderr | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')   # M1 — ** 로 가려짐
curl -s -X PATCH "$BASE/api/comments/$CID" -H "$C5" -H "$J" -d '{"content":"[채점] 바카라"}'; echo                                        # M3 400 — 수정도 막힌다
for b in '{}' '{"word":"뷁","action":"BLOCK"}' '{"word":"도박 사이트","action":"BLOCK"}' '{"word":"뷁뷁","action":"HIDE"}'; do
  curl -s -o /dev/null -w "$b → %{http_code}\n" -X POST "$BASE/api/admin/banned-words" -H "$AD" -H "$J" -d "$b"; done                  # 모두 400
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/admin/banned-words/$WID" -H "$AD"                                         # DA 204
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/comments/$CID" -H "$C5"                                                   # 뒷정리
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 더한 금칙어와 만든 댓글을 끝에서 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {"id": "A1", "title": "운영자가 금칙어 추가(BLOCK)", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "도박사이트", "action": "BLOCK"}},
    {"id": "A2", "title": "같은 단어 또 추가", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "도박사이트", "action": "MASK"}},
    {"id": "L", "title": "금칙어 목록", "method": "GET", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "B1", "title": "본문에 BLOCK 단어", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 홍보", "content": "최고의 도박사이트 안내"}},
    {"id": "B2", "title": "띄어 써서 피해 가기", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 홍보", "content": "도 박 사 이 트 놀러 오세요"}},
    {"id": "B3", "title": "제목·본문 둘 다", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "바카라 후기", "content": "토토사이트 추천"}},
    {"id": "B4", "title": "댓글에 BLOCK 단어", "method": "POST", "path": "/api/posts/2/comments", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "바카라 하실 분"}},
    {"id": "B6", "title": "전각 공백으로 BLOCK 우회 시도", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 홍보", "content": "도　박　사　이　트 안내"}},
    {"id": "P0", "title": "글 수정 확인용 글", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 정상 글", "content": "안전한 내용"}},
    {"id": "P3", "title": "글 본문 수정 BLOCK", "method": "PATCH", "path": "/api/posts/{{P0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "바카라 안내"}},
    {"id": "P4", "title": "글 본문 수정 MASK", "method": "PATCH", "path": "/api/posts/{{P0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "바보"}},
    {"id": "P5", "title": "글 제목 수정 BLOCK", "method": "PATCH", "path": "/api/posts/{{P0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"title": "도 박 사 이 트"}},
    {"id": "P6", "title": "글 전체 교체 PUT도 BLOCK", "method": "PUT", "path": "/api/posts/{{P0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"title": "[채점] 전체 교체", "content": "바카라 안내", "tags": [], "visibility": "PUBLIC"}},
    {"id": "P7", "title": "글 전체 교체 PUT의 MASK", "method": "PUT", "path": "/api/posts/{{P0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"title": "[채점] 전체 교체", "content": "바보", "tags": [], "visibility": "PUBLIC"}},
    {"id": "B7", "title": "글 생성 MASK", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "바보", "content": "안전한 내용"}},
    {"id": "M1", "title": "댓글에 MASK 단어", "method": "POST", "path": "/api/posts/2/comments", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "[채점] 너 정말 바보 같아"}},
    {"id": "M2", "title": "댓글 고치며 MASK 단어", "method": "PATCH", "path": "/api/comments/{{M1.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "[채점] 멍청이 아니야"}},
    {"id": "M3", "title": "댓글 고치며 BLOCK 단어", "method": "PATCH", "path": "/api/comments/{{M1.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "[채점] 바카라"}},
    {"id": "W0", "title": "빈 본문", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {}},
    {"id": "WB", "title": "word가 공백만", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "   ", "action": "BLOCK"}},
    {"id": "W1", "title": "word 1자(하한 밖)", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁", "action": "BLOCK"}},
    {"id": "WL", "title": "word 31자(상한 밖)", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁", "action": "BLOCK"}},
    {"id": "WS", "title": "word에 공백", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "도박 사이트", "action": "BLOCK"}},
    {"id": "WA", "title": "action이 없는 값", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁뷁", "action": "HIDE"}},
    {"id": "WN", "title": "action이 null", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁뷁", "action": null}},
    {"id": "WJ", "title": "JSON이 아닌 본문", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin", "Content-Type": "application/json"}, "body": "word=x"},
    {"id": "WU", "title": "word에 전각 공백", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "도박　사이트", "action": "BLOCK"}},
    {"id": "WT", "title": "word 숫자 타입 거절", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": 123, "action": "BLOCK"}},
    {"id": "AT", "title": "action 숫자 타입 거절", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁뷁", "action": 1}},
    {"id": "K2", "title": "word 2자(경계 안)", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁뷁", "action": "MASK"}},
    {"id": "K30", "title": "word 30자(경계 안)", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁뷁", "action": "BLOCK"}},
    {"id": "P1", "title": "일반 회원이 추가", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-kimjava"}, "body": {"word": "뷁뷁뷁", "action": "BLOCK"}},
    {"id": "P2", "title": "토큰 없이 목록", "method": "GET", "path": "/api/admin/banned-words"},
    {"id": "DN", "title": "없는 금칙어 지우기", "method": "DELETE", "path": "/api/admin/banned-words/99999999", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "DA", "title": "뒷정리 — 도박사이트 지우기", "method": "DELETE", "path": "/api/admin/banned-words/{{A1.body.id}}", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "B5", "title": "지운 뒤 같은 댓글", "method": "POST", "path": "/api/posts/2/comments", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"content": "[채점] 도박사이트라는 말은 이제 됩니다"}},
    {"id": "D2", "title": "뒷정리 — 뷁뷁", "method": "DELETE", "path": "/api/admin/banned-words/{{K2.body.id}}", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "D30", "title": "뒷정리 — 30자", "method": "DELETE", "path": "/api/admin/banned-words/{{K30.body.id}}", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "S0", "title": "나중에 금칙어가 될 원본 글", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 원본 글", "content": "임시금칙어 내용"}},
    {"id": "F0", "title": "나중에 금칙어가 될 임시저장", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 임시 글", "content": "임시금칙어 내용", "status": "DRAFT"}},
    {"id": "T0", "title": "나중에 금칙어가 될 휴지통 글", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"boardSlug": "free", "title": "[채점] 휴지통 글", "content": "임시금칙어 내용"}},
    {"id": "TD", "title": "휴지통으로 이동", "method": "DELETE", "path": "/api/posts/{{T0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "FA", "title": "기존 글 작성 후 금칙어 추가", "method": "POST", "path": "/api/admin/banned-words", "headers": {"Authorization": "Bearer tok-admin"}, "body": {"word": "임시금칙어", "action": "BLOCK"}},
    {"id": "CP1", "title": "복사로 금칙어 우회 거절", "method": "POST", "path": "/api/posts/{{S0.body.id}}/copies", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"title": "[채점] 복사 글"}},
    {"id": "FP1", "title": "옛 임시저장 발행 거절", "method": "POST", "path": "/api/posts/{{F0.body.id}}/publish", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "TR1", "title": "옛 휴지통 글 복구 거절", "method": "POST", "path": "/api/posts/{{T0.body.id}}/restore", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "FD", "title": "임시 금칙어 삭제", "method": "DELETE", "path": "/api/admin/banned-words/{{FA.body.id}}", "headers": {"Authorization": "Bearer tok-admin"}},
    {"id": "CP2", "title": "금칙어 삭제 뒤 복사", "method": "POST", "path": "/api/posts/{{S0.body.id}}/copies", "headers": {"Authorization": "Bearer tok-c05"}, "body": {"title": "[채점] 복사 글"}},
    {"id": "FP2", "title": "금칙어 삭제 뒤 발행", "method": "POST", "path": "/api/posts/{{F0.body.id}}/publish", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "TR2", "title": "금칙어 삭제 뒤 복구", "method": "POST", "path": "/api/posts/{{T0.body.id}}/restore", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "CS", "title": "뒷정리 — 원본 글", "method": "DELETE", "path": "/api/posts/{{S0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "CF", "title": "뒷정리 — 발행 글", "method": "DELETE", "path": "/api/posts/{{F0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "CT", "title": "뒷정리 — 복구 글", "method": "DELETE", "path": "/api/posts/{{T0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "CC", "title": "뒷정리 — 복사 글", "method": "DELETE", "path": "/api/posts/{{CP2.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XP", "title": "뒷정리 — 글 수정 확인용", "method": "DELETE", "path": "/api/posts/{{P0.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XB7", "title": "뒷정리 — MASK 글", "method": "DELETE", "path": "/api/posts/{{B7.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XM", "title": "뒷정리 — M1 댓글", "method": "DELETE", "path": "/api/comments/{{M1.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "X5", "title": "뒷정리 — B5 댓글", "method": "DELETE", "path": "/api/comments/{{B5.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XB1", "title": "뒷정리 — B1이 저장됐다면", "method": "DELETE", "path": "/api/posts/{{B1.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XB2", "title": "뒷정리 — B2가 저장됐다면", "method": "DELETE", "path": "/api/posts/{{B2.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XB3", "title": "뒷정리 — B3이 저장됐다면", "method": "DELETE", "path": "/api/posts/{{B3.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}},
    {"id": "XB4", "title": "뒷정리 — B4가 저장됐다면", "method": "DELETE", "path": "/api/comments/{{B4.body.id}}", "headers": {"Authorization": "Bearer tok-c05"}}
  ],
  "checks": [
    {"id": "C1", "all": [{"request": "A1", "expect": {"anyOf": [{"status": 201, "json": [{"path": "$.word", "equals": "도박사이트"}, {"path": "$.action", "equals": "BLOCK"}, {"path": "$.id", "type": "number"}]}, {"status": 409}]}}, {"request": "A2", "expect": {"status": 409}}, {"request": "L", "expect": {"status": 200, "json": [{"path": "$[*].word", "contains": "도박사이트"}, {"path": "$[*].word", "contains": "바카라"}, {"path": "$[*].word", "contains": "바보"}]}}]},
    {"id": "C2", "all": [{"request": "B1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "B2", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "B3", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "title"}, {"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "B4", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}]},
    {"id": "C3", "all": [{"request": "M1", "expect": {"status": 201, "json": [{"path": "$.content", "equals": "[채점] 너 정말 ** 같아"}]}}, {"request": "M2", "expect": {"status": 200, "json": [{"path": "$.content", "equals": "[채점] *** 아니야"}]}}, {"request": "M3", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}]},
    {"id": "C4", "all": [{"request": "W0", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}, {"path": "$.errors[*].field", "contains": "action"}]}}, {"request": "WB", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}]}}, {"request": "W1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}]}}, {"request": "WL", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}]}}, {"request": "WS", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}]}}, {"request": "WA", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "action"}]}}, {"request": "WN", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "action"}]}}, {"request": "WJ", "expect": {"status": 400}}, {"request": "K2", "expect": {"anyOf": [{"status": 201}, {"status": 409}]}}, {"request": "K30", "expect": {"anyOf": [{"status": 201}, {"status": 409}]}}]},
    {"id": "C5", "all": [{"request": "P1", "expect": {"status": 403}}, {"request": "P2", "expect": {"status": 401}}, {"request": "DN", "expect": {"status": 404}}, {"request": "DA", "expect": {"status": 204}}, {"request": "B5", "expect": {"status": 201, "json": [{"path": "$.content", "equals": "[채점] 도박사이트라는 말은 이제 됩니다"}]}}, {"request": "XM", "expect": {"status": 204}}]}
    ,{"id": "C6", "all": [{"request": "B6", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "P0", "expect": {"status": 201}}, {"request": "P3", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "P4", "expect": {"status": 200, "json": [{"path": "$.content", "equals": "**"}]}}, {"request": "P5", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "title"}]}}, {"request": "P6", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "P7", "expect": {"status": 200, "json": [{"path": "$.content", "equals": "**"}]}}, {"request": "B7", "expect": {"status": 201, "json": [{"path": "$.title", "equals": "**"}]}}, {"request": "XP", "expect": {"status": 204}}, {"request": "XB7", "expect": {"status": 204}}]},
    {"id": "C7", "all": [{"request": "WU", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}]}}, {"request": "WT", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "word"}]}}, {"request": "AT", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "action"}]}}]}
    ,{"id": "C8", "all": [{"request": "S0", "expect": {"status": 201}}, {"request": "F0", "expect": {"status": 201}}, {"request": "T0", "expect": {"status": 201}}, {"request": "TD", "expect": {"status": 204}}, {"request": "FA", "expect": {"status": 201}}, {"request": "CP1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "FP1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "TR1", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}]}}, {"request": "FD", "expect": {"status": 204}}, {"request": "CP2", "expect": {"status": 201}}, {"request": "FP2", "expect": {"status": 200}}, {"request": "TR2", "expect": {"status": 200}}, {"request": "CS", "expect": {"status": 204}}, {"request": "CF", "expect": {"status": 204}}, {"request": "CT", "expect": {"status": 204}}, {"request": "CC", "expect": {"status": 204}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | A1 / A2 / L | 금칙어 추가 `201`(처음) 또는 `409`(남아 있었다면) / 같은 단어 `409` / 목록에 `도박사이트`와 처음 데이터(`바카라`·`바보`) |
| C2 | B1 / B2 / B3 / B4 | 본문에 BLOCK 단어 `400`(`content`) / 띄어 써도 `400` / 제목·본문 둘 다 걸리면 `errors`에 `title`·`content` 둘 다 / 댓글도 `400` |
| C3 | M1 / M2 / M3 | 댓글의 `바보` → `**`로 가려 `201` / 고칠 때 `멍청이` → `***` / 고칠 때 BLOCK 단어 `400` |
| C4 | W0 / WB·W1·WL·WS / WA·WN / WJ / K2·K30 | 빈 본문 `400`(`errors`에 `word`·`action` 둘 다) / 공백만·1자·31자·공백 포함 `400`(`word`) / 없는 값·null `400`(`action`) / JSON 아님 `400` / 경계 안쪽 2자·30자는 통과(`201`, 남아 있었다면 `409`) |
| C5 | P1 / P2 / DN / DA / B5 / XM | 일반 회원 `403` / 토큰 없음 `401` / 없는 id `404` / 금칙어 지우기 `204` → 같은 단어가 든 댓글이 **바로** `201` / 뒷정리 `204` |
| C6 | B6 / P0·P3·P4·P5 / B7 / XP·XB7 | 전각 공백 BLOCK 우회도 `400`; 글 PATCH·PUT의 BLOCK `400`·MASK 저장 `200`, 글 생성 MASK `201`, 뒷정리 `204` |
| C7 | WU / WT / AT | 전각 공백 포함 단어와 숫자 타입의 word·action은 `400` 및 필드 오류 |
| C8 | S0~CC | 금칙어 추가 전에 만든 글도 복사·발행·복구 시 재검사해 `400`; 삭제 뒤에는 각각 성공, 뒷정리 `204` |
| D1 | `SELECT word, action FROM banned_word WHERE created_by IS NULL ORDER BY id` | `바카라 BLOCK` · `토토사이트 BLOCK` · `바보 MASK` · `멍청이 MASK` |
| D2 | 실행 **전**과 **후**에 `SELECT COUNT(*) FROM post WHERE author_id = 11 AND (title LIKE '%바카라%' OR content LIKE '%토토사이트%' OR REPLACE(content, ' ', '') LIKE '%도박사이트%')` | 전후 값이 같다 — BLOCK에 걸린 글은 저장되지 않았다(구현 전에 눌러 저장된 행이 있을 수 있어 "늘지 않았다"로 본다) |
| D3 | `SELECT content FROM comment WHERE member_id = 11 AND content LIKE '[채점] %아니야' ORDER BY id DESC LIMIT 1` | `[채점] *** 아니야` — DB에도 가려진 채로 저장됐다 |
| R1 | 한 부품 | 검사가 한 부품(예: `ContentFilter`)에 있고 글 생성·복사·PUT·PATCH·발행·복구와 댓글 생성·수정 여덟 경로가 모두 그것을 부른다 |
| R2 | 오류 모양 | BLOCK 오류가 1-5의 검증 오류와 같은 모양(`errors[].field`)이라 화면이 어느 칸인지 안다. 걸린 필드를 하나만이 아니라 모두 알려 준다 |
| R3 | 정규화의 한계 | 공백 제거·소문자로 "도 박 사 이 트"는 잡지만 "도.박.사.이.트"·초성·유사 문자는 못 잡는다는 것을 알고, 막기만 하는 대신 신고(13-2)와 함께 쓰는 이유를 말할 수 있다 |
| R4 | 매번 읽기 | 금칙어를 요청마다 읽어 삭제가 바로 반영된다(C5). 글쓰기가 많아지면 캐시가 필요하고, 그때는 추가·삭제 때 캐시를 비워야 한다는 것을 안다(16장) |

## 필요한 지식

- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md) — 형식 검증(1-5)과 내용 규칙(금칙어)의 자리
- [J01 타입과 문자열](../../docs/knowledge/J01-types-string.md) — `replaceAll`·`Pattern.quote`·대소문자
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md) — 같은 오류 모양
- [W17 캐시는 어디에](../../docs/knowledge/W17-where-to-cache.md) — R4

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 검사 부품</summary>

`apply(Map<String, String> fields)` 하나로 만든다. 값이 `null`인 필드는 건너뛰고, BLOCK 단어는 `값.replaceAll("\\s+", "").toLowerCase()`에 `단어.toLowerCase()`가 들어 있는지 본다. 걸린 필드를 모두 모아 예외를 던지고, 전역 핸들러가 `errors` 목록으로 만든다. 걸린 게 없으면 MASK 단어를 `Pattern.compile(Pattern.quote(단어), CASE_INSENSITIVE).matcher(값).replaceAll(r -> "*".repeat(r.group().length()))`로 바꾼 값을 돌려준다.
</details>

<details>
<summary>힌트 2 — 글 수정에서 빠지기 쉬운 것</summary>

3-1 PATCH는 `null`이면 그 필드를 안 바꾼다. 금칙어 검사도 보낸 필드만 해야 한다. `Map.of`는 `null` 값을 못 넣으니 `LinkedHashMap`을 쓴다.
</details>

## 다음 단계

[13-5. 도배 방지 — 429](13-5-rate-limit.md)
