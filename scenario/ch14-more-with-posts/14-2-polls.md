# 14-2. 글 투표 — 한 사람 한 표

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "글에 투표를 붙일 수 있게 해 주세요. 글쓴이만 만들 수 있고, 글 하나에 투표 하나, 선택지는 2~5개요. 한 사람은 한 번만 투표하고 바꿀 수 없어요. 결과는 선택지마다 몇 표인지, 그리고 내가 뭘 골랐는지 보여 주세요."

테이블이 세 개 생긴다(투표 → 선택지 → 표). 이 단계의 핵심은 **"한 번만"을 어느 테이블의 어느 칼럼으로 막느냐**다. 표 테이블에 `option_id`만 있으면 DB는 "선택지마다 한 번"까지만 막는다. 같은 사람이 김밥에 한 표, 라면에 한 표를 넣을 수 있다. 그래서 표에 `poll_id`를 같이 두고 `UNIQUE(poll_id, member_id)`를 건다.

또 하나는 **"이 선택지가 이 투표의 것인가"**다. `optionId`는 요청 본문으로 들어오는 숫자라서, 확인하지 않으면 남의 투표의 선택지 id로 표를 넣을 수 있다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 안의 투표",
  "summary": "글쓴이가 만든 투표에 한 번만 투표하고, 선택지별 표 수를 본다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "점심 투표", "right": "김자바" },
    { "type": "text", "id": "question", "value": "점심 뭐 먹을까요?", "emphasis": "title" },
    {
      "type": "list",
      "id": "options",
      "items": [
        { "id": "o1", "title": "김밥", "meta": "2표", "badge": "내 선택", "tone": "success" },
        { "id": "o2", "title": "라면", "meta": "1표" },
        { "id": "o3", "title": "돈가스", "meta": "0표" }
      ],
      "footer": "총 3표"
    },
    { "type": "actions", "id": "buttons", "items": [{ "id": "vote", "label": "투표하기", "variant": "primary" }] },
    { "type": "toast", "id": "toast", "value": "이미 투표했어요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "투표하기",
      "steps": [
        { "kind": "user", "text": "'김밥'을 고르고 투표한다", "focus": ["o1", "vote"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/22/poll/votes",
          "headers": ["Content-Type: application/json", "Authorization: Bearer tok-kimjava"],
          "body": "{\"optionId\": 1}"
        },
        { "kind": "server", "text": "글을 볼 수 있나(2-3) → 이 글의 투표 찾기 → optionId가 이 투표의 선택지인가 → 이미 투표했나" },
        { "kind": "db", "sql": "INSERT INTO poll_vote (poll_id, option_id, member_id, created_at) VALUES (1, 1, 2, ?)", "note": "UNIQUE(poll_id, member_id)가 두 번째 표를 막는다" },
        { "kind": "db", "sql": "SELECT o.id, o.label, COUNT(v.id) AS votes FROM poll_option o LEFT JOIN poll_vote v ON v.option_id = o.id WHERE o.poll_id = 1 GROUP BY o.id, o.label, o.position ORDER BY o.position" },
        {
          "kind": "response",
          "status": 201,
          "headers": ["Content-Type: application/json"],
          "body": "{\"postId\": 22, \"question\": \"점심 뭐 먹을까요?\", \"options\": [{\"id\": 1, \"label\": \"김밥\", \"votes\": 1}, {\"id\": 2, \"label\": \"라면\", \"votes\": 0}, {\"id\": 3, \"label\": \"돈가스\", \"votes\": 0}], \"totalVotes\": 1, \"myVoteOptionId\": 1}"
        },
        { "kind": "screen", "text": "'김밥'에 내 선택 표시, 표 수가 갱신된다", "focus": ["options"] }
      ]
    },
    {
      "name": "또 투표하기",
      "steps": [
        { "kind": "user", "text": "마음이 바뀌어 '라면'으로 또 투표한다", "focus": ["o2", "vote"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts/22/poll/votes",
          "headers": ["Content-Type: application/json", "Authorization: Bearer tok-kimjava"],
          "body": "{\"optionId\": 2}"
        },
        { "kind": "db", "sql": "SELECT COUNT(*) FROM poll_vote WHERE poll_id = 1 AND member_id = 2", "note": "1 — 이미 있다" },
        { "kind": "response", "status": 409, "headers": ["Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "'이미 투표했어요'", "focus": ["toast"] }
      ]
    },
    {
      "name": "결과 보기(비로그인)",
      "steps": [
        { "kind": "user", "text": "로그인하지 않고 글을 연다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/22/poll" },
        { "kind": "db", "sql": "SELECT o.id, o.label, COUNT(v.id) AS votes FROM poll_option o LEFT JOIN poll_vote v ON v.option_id = o.id WHERE o.poll_id = 1 GROUP BY o.id, o.label, o.position ORDER BY o.position", "note": "LEFT JOIN이라 0표인 '돈가스'도 나온다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"postId\": 22, \"question\": \"점심 뭐 먹을까요?\", \"options\": [{\"id\": 1, \"label\": \"김밥\", \"votes\": 2}, {\"id\": 2, \"label\": \"라면\", \"votes\": 1}, {\"id\": 3, \"label\": \"돈가스\", \"votes\": 0}], \"totalVotes\": 3, \"myVoteOptionId\": null}"
        },
        { "kind": "screen", "text": "선택지 세 개와 표 수, 총 3표", "focus": ["options"] }
      ]
    }
  ]
}
```

## 만들 것

**V51** — `db/migration/V51__create_poll.sql`

| 테이블 | 컬럼·제약 |
|---|---|
| `poll` | `id`, `post_id`(FK, **`UNIQUE`** — 글 하나에 투표 하나), `question VARCHAR(200)`, `created_at` |
| `poll_option` | `id`, `poll_id`(FK), `label VARCHAR(50)`, `position INT`(1부터, 만든 순서), `UNIQUE(poll_id, position)` |
| `poll_vote` | `id`, `poll_id`(FK), `option_id`(FK), `member_id`(FK), `created_at`, **`UNIQUE(poll_id, member_id)`** |

**API**

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `POST /api/posts/{postId}/poll` | 만들기 `{ "question": "...", "options": ["김밥", "라면", "돈가스"] }` | `201`, `Location: /api/posts/{postId}/poll`, 결과 JSON |
| `POST /api/posts/{postId}/poll/votes` | 투표 `{ "optionId": 1 }` | `201`, 결과 JSON |
| `GET /api/posts/{postId}/poll` | 결과 — **비로그인 가능** | `200`, 결과 JSON |

결과 JSON — 선택지는 만든 순서, 표가 없는 선택지도 `0`으로 나온다. `myVoteOptionId`는 비로그인이거나 아직 투표하지 않았으면 `null`.

```json
{ "postId": 22, "question": "점심 뭐 먹을까요?",
  "options": [ { "id": 1, "label": "김밥", "votes": 2 }, { "id": 2, "label": "라면", "votes": 1 }, { "id": 3, "label": "돈가스", "votes": 0 } ],
  "totalVotes": 3, "myVoteOptionId": 1 }
```

**필드 규칙** — 틀리면 `400`이고 `errors`에 틀린 필드가 **모두** 들어간다(선택지 하나가 틀리면 `options[1]`처럼 몇 번째인지까지). 잘못된 입력은 어떤 경우에도 500이 아니다.

`POST /api/posts/{postId}/poll`

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `question` | 예 | 안 됨(`null`·`""`·공백만) | 1~**200**자 | 문자열 | 없음 | `400`, `errors`에 `question` |
| `options` | 예 | 안 됨(`null`·`[]`) | **2~5**개 | 문자열 배열 | 없음 | `400`, `errors`에 `options` |
| `options[i]` | 예 | 안 됨(`null`·`""`·공백만) | 1~**50**자, 앞뒤 공백을 자르고 서로 겹치면 안 됨 | 문자열 | 없음 | `400`, `errors`에 `options[i]`(겹침은 `options`) |

`POST /api/posts/{postId}/poll/votes`

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `optionId` | 예 | 안 됨 | **이 투표의** 선택지 id | 숫자(`"abc"` → 400) | 없음 | `400`, `errors`에 `optionId` |
| 경로 `{postId}` | 예 | — | — | 숫자 | — | 없는 글 `404` |

| 상황 | 결과 |
|---|---|
| 위 필드 규칙을 어김 | `400` + `errors` |
| 글쓴이가 아닌 사람이 만들기 | `403` |
| 이미 투표가 있는 글에 또 만들기 | `409`(본문이 틀렸으면 그보다 먼저 `400`) |
| 이미 투표한 사람이 또 투표(같은 선택지든 다른 선택지든) | `409` |
| 없는 글, 2-3 규칙상 볼 수 없는 글, 투표가 없는 글 | `404` |
| 만들기·투표에 토큰 없음 | `401` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 글을 볼 수 있나(2-3) → 이 글의 투표 찾기 → optionId가 이 투표의 선택지인가 → 이미 투표했나
- UNIQUE(poll_id, member_id)가 두 번째 표를 막는다
- 1 — 이미 있다
- LEFT JOIN이라 0표인 '돈가스'도 나온다

<details>
<summary>Controller — HTTP 연결</summary>

`PollController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/posts/{postId}/poll")`, `@PostMapping("/api/posts/{postId}/poll/votes")`, `@GetMapping("/api/posts/{postId}/poll")`. 변경된 메서드: `create`, `vote`, `get`.

`src/main/java/org/example/poll/PollController.java`

```java
package org.example.poll;

import jakarta.validation.Validator;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class PollController {

    private final PollService pollService;
    private final Validator validator;

    public PollController(PollService pollService, Validator validator) {
        this.pollService = pollService;
        this.validator = validator;
    }

    @PostMapping("/api/posts/{postId}/poll")
    public ResponseEntity<PollResponse> create(@PathVariable Long postId, @LoginMember AuthenticatedMember loginMember,
                                               @RequestBody JsonNode body) {
        PollCreateRequest.Parsed parsed = PollCreateRequest.parse(body);
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(parsed.request()).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString().replace(".<list element>", ""), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        PollResponse response = pollService.create(postId, loginMember, parsed.request());
        return ResponseEntity.created(URI.create("/api/posts/" + postId + "/poll")).body(response);
    }

    // 한 표는 새로 생기는 자원이라 POST·201. 같은 사람이 또 보내면 409(PUT처럼 멱등이 아니다)
    @PostMapping("/api/posts/{postId}/poll/votes")
    public ResponseEntity<PollResponse> vote(@PathVariable Long postId, @LoginMember AuthenticatedMember loginMember,
                                             @RequestBody JsonNode body) {
        VoteRequest.Parsed parsed = VoteRequest.parse(body);
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(parsed.request()).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString().replace(".<list element>", ""), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(pollService.vote(postId, loginMember, parsed.request().optionId()));
    }

    @GetMapping("/api/posts/{postId}/poll")
    public PollResponse get(@PathVariable Long postId, @LoginMember AuthenticatedMember viewer) {
        return pollService.get(postId, viewer);
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PollCreateRequest.java`, `PollOptionRow.java`, `PollResponse.java`, `VoteRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/poll/PollCreateRequest.java`

```java
package org.example.poll;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// Jackson의 숫자→문자열 강제변환 전에 원문 타입을 검사한다. 길이는 앞뒤 공백을 제거한 값 기준이다.
public record PollCreateRequest(
        @NotBlank(message = "질문을 입력해 주세요.")
        @Size(max = 200, message = "질문은 200자 이하여야 합니다.")
        String question,

        @NotNull(message = "선택지를 입력해 주세요.")
        @Size(min = 2, max = 5, message = "선택지는 2~5개여야 합니다.")
        List<@NotBlank(message = "빈 선택지는 안 됩니다.") @Size(max = 50, message = "선택지는 50자 이하여야 합니다.") String> options
) {
    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        String question = text(body.get("question"), "question", errors);
        JsonNode rawOptions = body.get("options");
        List<String> options = null;
        if (rawOptions != null && !rawOptions.isNull()) {
            if (!rawOptions.isArray()) {
                errors.put("options", "선택지는 문자열 배열이어야 합니다.");
            } else {
                options = new ArrayList<>();
                for (int i = 0; i < rawOptions.size(); i++) {
                    options.add(text(rawOptions.get(i), "options[" + i + "]", errors));
                }
            }
        }
        return new Parsed(new PollCreateRequest(question, options), Map.copyOf(errors));
    }

    public record Parsed(PollCreateRequest request, Map<String, String> errors) {
    }

    private static String text(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            errors.put(field, field + "는 문자열이어야 합니다.");
            return null;
        }
        return value.asText().strip();
    }
}
```

`src/main/java/org/example/poll/PollOptionRow.java`

```java
package org.example.poll;

public interface PollOptionRow {
    Long getId();

    String getLabel();

    long getVotes();
}
```

`src/main/java/org/example/poll/PollResponse.java`

```java
package org.example.poll;

import java.util.List;

// myVoteOptionId — 비로그인이거나 아직 투표하지 않았으면 null
public record PollResponse(
        Long postId,
        String question,
        List<Option> options,
        long totalVotes,
        Long myVoteOptionId
) {
    public record Option(Long id, String label, long votes) {
    }
}
```

`src/main/java/org/example/poll/VoteRequest.java`

```java
package org.example.poll;

import jakarta.validation.constraints.NotNull;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

// 정수 JSON만 받는다. "1"이나 1.2를 Long으로 자동 변환하지 않는다.
public record VoteRequest(@NotNull(message = "선택지를 골라 주세요.") Long optionId) {
    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        JsonNode value = body.get("optionId");
        Long optionId = null;
        if (value != null && !value.isNull()) {
            if (!value.isIntegralNumber() || !value.canConvertToLong()) {
                errors.put("optionId", "optionId는 정수여야 합니다.");
            } else {
                optionId = value.longValue();
            }
        }
        return new Parsed(new VoteRequest(optionId), Map.copyOf(errors));
    }

    public record Parsed(VoteRequest request, Map<String, String> errors) {
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PollService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `create`, `vote`, `get`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/poll/PollService.java`

```java
package org.example.poll;

import org.example.auth.AuthenticatedMember;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostForbiddenException;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

// 글 투표 — 만들기(작성자만, 글마다 하나), 투표(한 사람 한 표, 바꾸기 없음), 결과(GROUP BY로 센다)
@Service
public class PollService {

    private final PollRepository pollRepository;
    private final PollVoteRepository voteRepository;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public PollService(PollRepository pollRepository, PollVoteRepository voteRepository,
                       PostRepository postRepository, PostAccessPolicy accessPolicy, Clock clock) {
        this.pollRepository = pollRepository;
        this.voteRepository = voteRepository;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public PollResponse create(Long postId, AuthenticatedMember me, PollCreateRequest request) {
        Post post = findViewablePost(postId, me);
        if (!post.getAuthor().getId().equals(me.id())) {
            throw new PostForbiddenException();
        }
        List<String> labels = request.options().stream().map(String::strip).toList();
        if (new HashSet<>(labels).size() != labels.size()) {
            throw new InvalidPollException("options", "같은 선택지가 두 번 있습니다.");
        }
        if (pollRepository.existsByPost_Id(postId)) {
            throw new PollConflictException("이 글에는 이미 투표가 있습니다.");
        }
        try {
            // 먼저 확인해도 동시에 두 요청이 오면 둘 다 통과할 수 있다 — 그때는 UNIQUE(post_id)가 막는다
            pollRepository.saveAndFlush(new Poll(post, request.question().strip(), labels, LocalDateTime.now(clock)));
        } catch (DataIntegrityViolationException e) {
            throw new PollConflictException("이 글에는 이미 투표가 있습니다.");
        }
        return result(postId, me);
    }

    @Transactional
    public PollResponse vote(Long postId, AuthenticatedMember me, Long optionId) {
        findViewablePost(postId, me);
        Poll poll = pollRepository.findByPost_Id(postId).orElseThrow(PollNotFoundException::new);
        // 선택지 id만 믿으면 남의 투표의 선택지에 표를 넣을 수 있다 — 이 투표의 선택지인지 확인한다
        if (!poll.hasOption(optionId)) {
            throw new InvalidPollException("optionId", "이 투표에 없는 선택지입니다.");
        }
        if (voteRepository.existsByPollIdAndMemberId(poll.getId(), me.id())) {
            throw new PollConflictException("이미 투표했습니다.");
        }
        try {
            voteRepository.saveAndFlush(new PollVote(poll.getId(), optionId, me.id(), LocalDateTime.now(clock)));
        } catch (DataIntegrityViolationException e) {
            throw new PollConflictException("이미 투표했습니다.");
        }
        return result(postId, me);
    }

    @Transactional(readOnly = true)
    public PollResponse get(Long postId, AuthenticatedMember viewer) {
        findViewablePost(postId, viewer);
        return result(postId, viewer);
    }

    private PollResponse result(Long postId, AuthenticatedMember viewer) {
        Poll poll = pollRepository.findByPost_Id(postId).orElseThrow(PollNotFoundException::new);
        List<PollResponse.Option> options = pollRepository.tally(poll.getId()).stream()
                .map(row -> new PollResponse.Option(row.getId(), row.getLabel(), row.getVotes()))
                .toList();
        long total = options.stream().mapToLong(PollResponse.Option::votes).sum();
        Long mine = viewer == null ? null
                : voteRepository.findByPollIdAndMemberId(poll.getId(), viewer.id())
                        .map(PollVote::getOptionId).orElse(null);
        return new PollResponse(postId, poll.getQuestion(), options, total, mine);
    }

    private Post findViewablePost(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
        return post;
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PollRepository.java`, `PollVoteRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/poll/PollRepository.java`

```java
package org.example.poll;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PollRepository extends JpaRepository<Poll, Long> {

    Optional<Poll> findByPost_Id(Long postId);

    boolean existsByPost_Id(Long postId);

    // 선택지별 표 수 — LEFT JOIN이라 표가 없는 선택지도 0으로 나온다. 순서는 만든 순서(position)
    @Query(nativeQuery = true, value = """
            SELECT o.id AS id, o.label AS label, COUNT(v.id) AS votes
              FROM poll_option o
              LEFT JOIN poll_vote v ON v.option_id = o.id
             WHERE o.poll_id = :pollId
             GROUP BY o.id, o.label, o.position
             ORDER BY o.position
            """)
    List<PollOptionRow> tally(@Param("pollId") Long pollId);
}
```

`src/main/java/org/example/poll/PollVoteRepository.java`

```java
package org.example.poll;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PollVoteRepository extends JpaRepository<PollVote, Long> {

    boolean existsByPollIdAndMemberId(Long pollId, Long memberId);

    Optional<PollVote> findByPollIdAndMemberId(Long pollId, Long memberId);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Poll.java`, `PollOption.java`, `PollVote.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `hasOption`.

`src/main/java/org/example/poll/Poll.java`

```java
package org.example.poll;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.example.post.Post;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// 글 투표 — 선택지는 투표와 함께 만들어지고 함께 저장된다(cascade PERSIST). 만든 뒤에는 바꾸지 않는다
@Entity
@Table(name = "poll")
public class Poll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false)
    private String question;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "poll", cascade = CascadeType.PERSIST)
    @OrderBy("position ASC")
    private List<PollOption> options = new ArrayList<>();

    protected Poll() {
        // JPA
    }

    public Poll(Post post, String question, List<String> labels, LocalDateTime now) {
        this.post = post;
        this.question = question;
        this.createdAt = now;
        for (int i = 0; i < labels.size(); i++) {
            options.add(new PollOption(this, labels.get(i), i + 1));
        }
    }

    public boolean hasOption(Long optionId) {
        return options.stream().anyMatch(o -> o.getId().equals(optionId));
    }

    public Long getId() {
        return id;
    }

    public String getQuestion() {
        return question;
    }

    public List<PollOption> getOptions() {
        return options;
    }
}
```

`src/main/java/org/example/poll/PollOption.java`

```java
package org.example.poll;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "poll_option")
public class PollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poll_id", nullable = false)
    private Poll poll;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private Integer position;

    protected PollOption() {
        // JPA
    }

    PollOption(Poll poll, String label, int position) {
        this.poll = poll;
        this.label = label;
        this.position = position;
    }

    public Long getId() {
        return id;
    }
}
```

`src/main/java/org/example/poll/PollVote.java`

```java
package org.example.poll;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

// 한 표 — UNIQUE(poll_id, member_id). 연관 객체 대신 id만 들고 있다(저장만 하고 따라갈 일이 없다)
@Entity
@Table(name = "poll_vote")
public class PollVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "poll_id", nullable = false)
    private Long pollId;

    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PollVote() {
        // JPA
    }

    public PollVote(Long pollId, Long optionId, Long memberId, LocalDateTime now) {
        this.pollId = pollId;
        this.optionId = optionId;
        this.memberId = memberId;
        this.createdAt = now;
    }

    public Long getOptionId() {
        return optionId;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V51__create_poll.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V51__create_poll.sql`

```sql
-- 14-2 글 투표 — 글 하나에 투표 하나(UNIQUE post_id), 선택지 2~5개, 한 사람 한 표.
-- poll_vote에 option_id만 두면 "이 투표에 한 번"을 DB가 막을 수 없다(선택지마다 한 번이 된다).
-- 그래서 poll_id를 같이 두고 UNIQUE(poll_id, member_id)를 건다.
CREATE TABLE poll (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    post_id    BIGINT       NOT NULL,
    question   VARCHAR(200) NOT NULL,
    created_at DATETIME     NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_poll_post (post_id),
    CONSTRAINT fk_poll_post FOREIGN KEY (post_id) REFERENCES post (id)
);

CREATE TABLE poll_option (
    id       BIGINT      NOT NULL AUTO_INCREMENT,
    poll_id  BIGINT      NOT NULL,
    label    VARCHAR(50) NOT NULL,
    position INT         NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_poll_option_position (poll_id, position),
    CONSTRAINT fk_poll_option_poll FOREIGN KEY (poll_id) REFERENCES poll (id)
);

CREATE TABLE poll_vote (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    poll_id    BIGINT   NOT NULL,
    option_id  BIGINT   NOT NULL,
    member_id  BIGINT   NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_poll_vote_member (poll_id, member_id),
    KEY ix_poll_vote_option (option_id),
    KEY fk_poll_vote_member (member_id),
    CONSTRAINT fk_poll_vote_poll FOREIGN KEY (poll_id) REFERENCES poll (id),
    CONSTRAINT fk_poll_vote_option FOREIGN KEY (option_id) REFERENCES poll_option (id),
    CONSTRAINT fk_poll_vote_member FOREIGN KEY (member_id) REFERENCES member (id)
);
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `InvalidPollException.java`, `PollConflictException.java`, `PollNotFoundException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handlePollNotFound`, `handleInvalidPoll`, `handlePollConflict`.

`src/main/java/org/example/common/ApiExceptionHandler.java`

```java
package org.example.common;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.core.JacksonException;
import org.example.admin.AdminOnlyException;
import org.example.admin.ModerationConflictException;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.MemberNotActiveException;
import org.example.auth.MemberSuspendedException;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardWriteForbiddenException;
import org.example.bookmark.BookmarkFolderNotFoundException;
import org.example.bookmark.InvalidBookmarkFieldException;
import org.example.bookmark.BookmarkNotFoundException;
import org.example.bookmark.DuplicateBookmarkFolderNameException;
import org.example.bookmark.InvalidBookmarkFolderException;
import org.example.comment.CommentForbiddenException;
import org.example.comment.CommentNotFoundException;
import org.example.comment.InvalidParentCommentException;
import org.example.image.EmptyImageException;
import org.example.image.ImageNotFoundException;
import org.example.image.UnsupportedImageException;
import org.example.like.SelfLikeNotAllowedException;
import org.example.member.MemberNotFoundException;
import org.example.moderation.BannedContentException;
import org.example.moderation.BannedWordNotFoundException;
import org.example.moderation.DuplicateBannedWordException;
import org.example.notification.NotificationNotFoundException;
import org.example.post.InvalidParametersException;
import org.example.post.InvalidPostFieldException;
import org.example.post.InvalidSearchConditionException;
import org.example.post.PostForbiddenException;
import org.example.post.PostNotDeletedException;
import org.example.revision.RevisionForbiddenException;
import org.example.post.PostNotDraftException;
import org.example.post.PostRestoreExpiredException;
import org.example.post.PostRestoreForbiddenException;
import org.example.post.PostNotFoundException;
import org.example.post.PostStatusConflictException;
import org.example.post.TooManyPostsException;
import org.example.report.DuplicateReportException;
import org.example.report.NothingToResolveException;
import org.example.report.ReportTargetNotFoundException;
import org.example.report.SelfReportNotAllowedException;
import org.example.social.FollowBlockedException;
import org.example.social.SelfFollowNotAllowedException;
import org.example.social.SelfMuteNotAllowedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.net.URI;
import java.util.List;
import java.util.Map;
import org.example.poll.InvalidPollException;
import org.example.poll.PollConflictException;
import org.example.poll.PollNotFoundException;

// 모든 컨트롤러의 에러 응답을 한 곳에서 RFC 9457 Problem Details로 만든다.
// 컨트롤러마다 try-catch를 두지 않는다.
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> Map.of(
                        "field", fieldError.getField(),
                        "message", fieldError.getDefaultMessage() == null ? "" : fieldError.getDefaultMessage()
                ))
                .toList();
        problem.setProperty("errors", errors);
        return problem;
    }

    // 13-4 금칙어 — 1-5 검증 오류와 같은 모양(어느 필드인지 errors에)
    @ExceptionHandler(BannedContentException.class)
    public ProblemDetail handleBannedContent(BannedContentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors());
        return problem;
    }

    @ExceptionHandler(DuplicateBannedWordException.class)
    public ProblemDetail handleDuplicateBannedWord(DuplicateBannedWordException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BannedWordNotFoundException.class)
    public ProblemDetail handleBannedWordNotFound(BannedWordNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        // 11-1 JSON 문법은 맞는데 한 필드의 형식이 틀린 경우(숫자 자리에 "abc", 목록 자리에 문자열) —
        // Jackson이 남긴 경로로 어느 필드인지 errors에 담는다. 목록 안이면 Bean Validation과 같은 모양(imageIds[0]).
        // JSON 문법 자체가 깨졌으면 경로가 비어 있어 errors 없이 400만 나간다. Jackson은 첫 오류에서 멈추므로 하나만 들어간다.
        if (ex.getCause() instanceof JacksonException jackson && !jackson.getPath().isEmpty()) {
            problem.setProperty("errors", List.of(Map.of("field", fieldPath(jackson), "message", "형식이 올바르지 않습니다.")));
        }
        return problem;
    }

    // 11-1 경로·쿼리 값의 형식 오류(/api/posts/abc, ?size=abc) — 그대로 두면 Spring 기본 응답이라 어느 값이 틀렸는지 없다
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getName(),
                "message", "형식이 올바르지 않습니다: " + ex.getValue())));
        return problem;
    }

    private static String fieldPath(JacksonException jackson) {
        StringBuilder field = new StringBuilder();
        for (JacksonException.Reference ref : jackson.getPath()) {
            if (ref.getPropertyName() != null) {
                if (!field.isEmpty()) {
                    field.append('.');
                }
                field.append(ref.getPropertyName());
            } else {
                field.append('[').append(ref.getIndex()).append(']');
            }
        }
        return field.toString();
    }

    @ExceptionHandler(BoardNotFoundException.class)
    public ProblemDetail handleBoardNotFound(BoardNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostNotFoundException.class)
    public ProblemDetail handlePostNotFound(PostNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BoardWriteForbiddenException.class)
    public ProblemDetail handleBoardWriteForbidden(BoardWriteForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfLikeNotAllowedException.class)
    public ProblemDetail handleSelfLikeNotAllowed(SelfLikeNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostForbiddenException.class)
    public ProblemDetail handlePostForbidden(PostForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-1 임시저장이 아닌 글을 발행 — 지금 상태와 충돌
    @ExceptionHandler(PostNotDraftException.class)
    public ProblemDetail handlePostNotDraft(PostNotDraftException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-6 이력은 작성자·운영자만
    @ExceptionHandler(RevisionForbiddenException.class)
    public ProblemDetail handleRevisionForbidden(RevisionForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-5 복구
    @ExceptionHandler(PostNotDeletedException.class)
    public ProblemDetail handlePostNotDeleted(PostNotDeletedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostRestoreForbiddenException.class)
    public ProblemDetail handlePostRestoreForbidden(PostRestoreForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostRestoreExpiredException.class)
    public ProblemDetail handlePostRestoreExpired(PostRestoreExpiredException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.GONE, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-2 이미지 업로드
    @ExceptionHandler(EmptyImageException.class)
    public ProblemDetail handleEmptyImage(EmptyImageException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(UnsupportedImageException.class)
    public ProblemDetail handleUnsupportedImage(UnsupportedImageException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // spring.servlet.multipart.max-file-size를 넘으면 컨트롤러에 오기 전에(요청을 읽는 단계에서) 터진다
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUploadSize(HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONTENT_TOO_LARGE, "파일은 1MB까지 올릴 수 있습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ImageNotFoundException.class)
    public ProblemDetail handleImageNotFound(ImageNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-4 쿼리 파라미터 여러 개를 한꺼번에 검사한 결과
    @ExceptionHandler(InvalidParametersException.class)
    public ProblemDetail handleInvalidParameters(InvalidParametersException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.of("field", e.getKey(), "message", e.getValue()))
                .toList());
        return problem;
    }

    @ExceptionHandler(InvalidPostFieldException.class)
    public ProblemDetail handleInvalidPostField(InvalidPostFieldException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ProblemDetail handleCommentNotFound(CommentNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidParentCommentException.class)
    public ProblemDetail handleInvalidParentComment(InvalidParentCommentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(CommentForbiddenException.class)
    public ProblemDetail handleCommentForbidden(CommentForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BookmarkFolderNotFoundException.class)
    public ProblemDetail handleBookmarkFolderNotFound(BookmarkFolderNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BookmarkNotFoundException.class)
    public ProblemDetail handleBookmarkNotFound(BookmarkNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidBookmarkFolderException.class)
    public ProblemDetail handleInvalidBookmarkFolder(InvalidBookmarkFolderException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(DuplicateBookmarkFolderNameException.class)
    public ProblemDetail handleDuplicateBookmarkFolderName(DuplicateBookmarkFolderNameException ex,
                                                           HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidCursorException.class)
    public ProblemDetail handleInvalidCursor(InvalidCursorException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidSearchConditionException.class)
    public ProblemDetail handleInvalidSearchCondition(InvalidSearchConditionException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(AdminOnlyException.class)
    public ProblemDetail handleAdminOnly(AdminOnlyException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostStatusConflictException.class)
    public ProblemDetail handlePostStatusConflict(PostStatusConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ModerationConflictException.class)
    public ProblemDetail handleModerationConflict(ModerationConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NotificationNotFoundException.class)
    public ProblemDetail handleNotificationNotFound(NotificationNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(MemberNotFoundException.class)
    public ProblemDetail handleMemberNotFound(MemberNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfFollowNotAllowedException.class)
    public ProblemDetail handleSelfFollow(SelfFollowNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfMuteNotAllowedException.class)
    public ProblemDetail handleSelfMute(SelfMuteNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(FollowBlockedException.class)
    public ProblemDetail handleFollowBlocked(FollowBlockedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ReportTargetNotFoundException.class)
    public ProblemDetail handleReportTargetNotFound(ReportTargetNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfReportNotAllowedException.class)
    public ProblemDetail handleSelfReport(SelfReportNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NothingToResolveException.class)
    public ProblemDetail handleNothingToResolve(NothingToResolveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(DuplicateReportException.class)
    public ProblemDetail handleDuplicateReport(DuplicateReportException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 13-5 도배 방지 — 429 + Retry-After(몇 초 뒤에 다시 하면 되는지). 본문에도 같은 값을 싣는다
    @ExceptionHandler(TooManyPostsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyPosts(TooManyPostsException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("retryAfterSeconds", ex.getRetryAfterSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(problem);
    }

    @ExceptionHandler(PollNotFoundException.class)
    public ProblemDetail handlePollNotFound(PollNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPollException.class)
    public ProblemDetail handleInvalidPoll(InvalidPollException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(PollConflictException.class)
    public ProblemDetail handlePollConflict(PollConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidBookmarkFieldException.class)
    public ProblemDetail handleInvalidBookmarkField(InvalidBookmarkFieldException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    // 누구인지 모름 — WWW-Authenticate 헤더를 함께 내려준다
    @ExceptionHandler(AuthenticationRequiredException.class)
    public ResponseEntity<ProblemDetail> handleAuthenticationRequired(AuthenticationRequiredException ex,
                                                                       HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
                .body(problem);
    }

    // 13-3 기간 정지 중 쓰기 — 언제 풀리는지·왜인지를 함께 준다(화면이 안내 문구를 만들 수 있게)
    @ExceptionHandler(MemberSuspendedException.class)
    public ProblemDetail handleMemberSuspended(MemberSuspendedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("suspendedUntil", ex.getSuspendedUntil());
        problem.setProperty("reason", ex.getReason());
        return problem;
    }

    // 누구인지는 알지만(토큰은 유효) 회원 상태 때문에 안 됨
    @ExceptionHandler(MemberNotActiveException.class)
    public ProblemDetail handleMemberNotActive(MemberNotActiveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
```

`src/main/java/org/example/poll/InvalidPollException.java`

```java
package org.example.poll;

// 요청 내용이 규칙에 맞지 않음(겹치는 선택지, 이 투표에 없는 선택지) — 400. 어느 필드가 틀렸는지 함께 담는다
public class InvalidPollException extends RuntimeException {

    private final String field;

    public InvalidPollException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
```

`src/main/java/org/example/poll/PollConflictException.java`

```java
package org.example.poll;

// 이미 있음(이 글에 투표가 있음, 이미 투표함) — 409
public class PollConflictException extends RuntimeException {
    public PollConflictException(String message) {
        super(message);
    }
}
```

`src/main/java/org/example/poll/PollNotFoundException.java`

```java
package org.example.poll;

// 글에 투표가 없음 — 404
public class PollNotFoundException extends RuntimeException {
    public PollNotFoundException() {
        super("투표가 없습니다.");
    }
}
```

</details>

### MyBatis 대안

아래 코드는 투표·선택지·표 테이블의 JPA `PollService`를 MyBatis 버전으로 교체한다. 글의 조회·작성자·차단 정책은 앞 단계의 `PostRepository`/`PostAccessPolicy`를 그대로 쓴다. `PollController`·요청/응답 DTO·Flyway V51도 같다. `poll` INSERT의 generated key를 받아 같은 트랜잭션에서 선택지를 저장하고, `poll_vote`의 `UNIQUE(poll_id, member_id)`가 동시 중복 표를 막는다.

<details>
<summary>MyBatis / 설정 — 의존성·XML 로딩</summary>

`build.gradle`의 `dependencies`에 추가:

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
```

`src/main/resources/application.yml`에 추가:

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
```

</details>

<details>
<summary>MyBatis / DTO — 생성 키·투표·집계 행</summary>

`src/main/java/org/example/poll/PollInsert.java`

```java
package org.example.poll;

import java.time.LocalDateTime;

// INSERT의 generated key를 MyBatis가 id에 채운다.
public class PollInsert {
    private Long id;
    private final Long postId;
    private final String question;
    private final LocalDateTime createdAt;

    public PollInsert(Long postId, String question, LocalDateTime createdAt) {
        this.postId = postId;
        this.question = question;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPostId() { return postId; }
    public String getQuestion() { return question; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
```

`src/main/java/org/example/poll/PollData.java`

```java
package org.example.poll;

// 글 하나에 속한 투표의 기본 정보.
public record PollData(Long id, String question) {
}
```

`src/main/java/org/example/poll/PollTallyRow.java`

```java
package org.example.poll;

// LEFT JOIN 집계 결과. 0표 선택지도 한 행으로 나온다.
public record PollTallyRow(Long id, String label, Long votes) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — 투표·선택지·표 연산</summary>

`src/main/java/org/example/poll/PollMapper.java`

```java
package org.example.poll;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface PollMapper {
    PollData findByPostId(@Param("postId") Long postId);

    void insertPoll(PollInsert draft);

    void insertOption(@Param("pollId") Long pollId, @Param("label") String label,
                      @Param("position") int position);

    boolean optionBelongs(@Param("pollId") Long pollId, @Param("optionId") Long optionId);

    boolean alreadyVoted(@Param("pollId") Long pollId, @Param("memberId") Long memberId);

    void insertVote(@Param("pollId") Long pollId, @Param("optionId") Long optionId,
                    @Param("memberId") Long memberId, @Param("now") LocalDateTime now);

    List<PollTallyRow> tally(@Param("pollId") Long pollId);

    Long myVoteOptionId(@Param("pollId") Long pollId, @Param("memberId") Long memberId);
}
```

</details>

<details>
<summary>MyBatis / SQL — 고유키·선택지 소속·LEFT JOIN</summary>

`src/main/resources/mapper/PollMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.poll.PollMapper">
    <resultMap id="pollData" type="org.example.poll.PollData">
        <constructor>
            <arg column="id" javaType="java.lang.Long"/>
            <arg column="question" javaType="java.lang.String"/>
        </constructor>
    </resultMap>
    <resultMap id="tallyRow" type="org.example.poll.PollTallyRow">
        <constructor>
            <arg column="id" javaType="java.lang.Long"/>
            <arg column="label" javaType="java.lang.String"/>
            <arg column="votes" javaType="java.lang.Long"/>
        </constructor>
    </resultMap>

    <select id="findByPostId" resultMap="pollData">
        SELECT id, question FROM poll WHERE post_id = #{postId}
    </select>
    <insert id="insertPoll" parameterType="org.example.poll.PollInsert"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO poll (post_id, question, created_at)
        VALUES (#{postId}, #{question}, #{createdAt})
    </insert>
    <insert id="insertOption">
        INSERT INTO poll_option (poll_id, label, position)
        VALUES (#{pollId}, #{label}, #{position})
    </insert>
    <select id="optionBelongs" resultType="boolean">
        SELECT EXISTS (SELECT 1 FROM poll_option WHERE poll_id = #{pollId} AND id = #{optionId})
    </select>
    <select id="alreadyVoted" resultType="boolean">
        SELECT EXISTS (SELECT 1 FROM poll_vote WHERE poll_id = #{pollId} AND member_id = #{memberId})
    </select>
    <insert id="insertVote">
        INSERT INTO poll_vote (poll_id, option_id, member_id, created_at)
        VALUES (#{pollId}, #{optionId}, #{memberId}, #{now})
    </insert>
    <select id="tally" resultMap="tallyRow">
        SELECT o.id, o.label, COUNT(v.id) AS votes
          FROM poll_option o LEFT JOIN poll_vote v ON v.option_id = o.id
         WHERE o.poll_id = #{pollId}
         GROUP BY o.id, o.label, o.position
         ORDER BY o.position
    </select>
    <select id="myVoteOptionId" resultType="java.lang.Long">
        SELECT option_id FROM poll_vote WHERE poll_id = #{pollId} AND member_id = #{memberId}
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — 생성·중복·결과 흐름</summary>

`src/main/java/org/example/poll/PollService.java`

```java
package org.example.poll;

import org.example.auth.AuthenticatedMember;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostForbiddenException;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

// MyBatis 대안: 투표·선택지·표는 Mapper가 쓰고, 글 접근 정책은 기존 PostRepository를 재사용한다.
@Service
public class PollService {
    private final PollMapper pollMapper;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public PollService(PollMapper pollMapper, PostRepository postRepository,
                       PostAccessPolicy accessPolicy, Clock clock) {
        this.pollMapper = pollMapper;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public PollResponse create(Long postId, AuthenticatedMember me, PollCreateRequest request) {
        Post post = findViewablePost(postId, me);
        if (!post.getAuthor().getId().equals(me.id())) {
            throw new PostForbiddenException();
        }
        List<String> labels = request.options().stream().map(String::strip).toList();
        if (new HashSet<>(labels).size() != labels.size()) {
            throw new InvalidPollException("options", "같은 선택지가 두 번 있습니다.");
        }
        if (pollMapper.findByPostId(postId) != null) {
            throw new PollConflictException("이 글에는 이미 투표가 있습니다.");
        }
        PollInsert draft = new PollInsert(postId, request.question().strip(), LocalDateTime.now(clock));
        try {
            pollMapper.insertPoll(draft);
        } catch (DataIntegrityViolationException e) {
            // 동시 생성은 UNIQUE(post_id)가 마지막에 막는다.
            throw new PollConflictException("이 글에는 이미 투표가 있습니다.");
        }
        for (int i = 0; i < labels.size(); i++) {
            pollMapper.insertOption(draft.getId(), labels.get(i), i + 1);
        }
        return result(postId, me);
    }

    @Transactional
    public PollResponse vote(Long postId, AuthenticatedMember me, Long optionId) {
        findViewablePost(postId, me);
        PollData poll = findPoll(postId);
        if (!pollMapper.optionBelongs(poll.id(), optionId)) {
            throw new InvalidPollException("optionId", "이 투표에 없는 선택지입니다.");
        }
        if (pollMapper.alreadyVoted(poll.id(), me.id())) {
            throw new PollConflictException("이미 투표했습니다.");
        }
        try {
            pollMapper.insertVote(poll.id(), optionId, me.id(), LocalDateTime.now(clock));
        } catch (DataIntegrityViolationException e) {
            // 동시 표 두 장은 UNIQUE(poll_id, member_id)가 마지막에 막는다.
            throw new PollConflictException("이미 투표했습니다.");
        }
        return result(postId, me);
    }

    @Transactional(readOnly = true)
    public PollResponse get(Long postId, AuthenticatedMember viewer) {
        findViewablePost(postId, viewer);
        return result(postId, viewer);
    }

    private PollData findPoll(Long postId) {
        PollData poll = pollMapper.findByPostId(postId);
        if (poll == null) {
            throw new PollNotFoundException();
        }
        return poll;
    }

    private PollResponse result(Long postId, AuthenticatedMember viewer) {
        PollData poll = findPoll(postId);
        List<PollResponse.Option> options = pollMapper.tally(poll.id()).stream()
                .map(row -> new PollResponse.Option(row.id(), row.label(), row.votes()))
                .toList();
        long total = options.stream().mapToLong(PollResponse.Option::votes).sum();
        Long mine = viewer == null ? null : pollMapper.myVoteOptionId(poll.id(), viewer.id());
        return new PollResponse(postId, poll.question(), options, total, mine);
    }

    private Post findViewablePost(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
        return post;
    }
}
```

</details>

## 직접 확인

이스프링이 자유 게시판에 글을 하나 쓰고(다시 실행할 때마다 새 글) 투표를 붙인다. 김자바·박디비·이스프링이 투표한다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; P='Authorization: Bearer tok-park'; J='Content-Type: application/json'
jget() { python3 -c 'import sys,json; d=json.load(sys.stdin); print(eval("d"+sys.argv[1]))' "$1"; }

PID=$(curl -s -X POST "$BASE/api/posts" -H "$L" -H "$J" -d '{"boardSlug":"free","title":"[채점] 점심 투표","content":"점심 메뉴를 골라 주세요."}' | jget '["id"]')   # V1
POLL=$(curl -s -X POST "$BASE/api/posts/$PID/poll" -H "$L" -H "$J" -d '{"question":"점심 뭐 먹을까요?","options":["김밥","라면","돈가스"]}'); echo "$POLL"   # V2
O1=$(echo "$POLL" | jget '["options"][0]["id"]'); O2=$(echo "$POLL" | jget '["options"][1]["id"]')
curl -i -X POST "$BASE/api/posts/$PID/poll" -H "$L" -H "$J" -d '{"question":"또","options":["가","나"]}'          # V3 409
curl -i -X POST "$BASE/api/posts/$PID/poll" -H "$K" -H "$J" -d '{"question":"남의 글","options":["가","나"]}'     # V4 403
curl -i -X POST "$BASE/api/posts/$PID/poll" -H "$L" -H "$J" -d '{"question":"   ","options":["가","나"]}'      # V5c 400 question
curl -i -X POST "$BASE/api/posts/$PID/poll" -H "$L" -H "$J" -d '{"question":"하나","options":["가"]}'            # V5g 400 options
curl -i -X POST "$BASE/api/posts/$PID/poll" -H "$L" -H "$J" -d '{"question":null,"options":null}'               # V5l 400 둘 다
curl -i -X POST "$BASE/api/posts/$PID/poll" -H "$L" -H "$J" -d '{"question":"겹침","options":["가","가 "]}'      # V6 400
curl -s -X POST "$BASE/api/posts/$PID/poll/votes" -H "$K" -H "$J" -d "{\"optionId\":$O1}"; echo                  # V7
curl -i -X POST "$BASE/api/posts/$PID/poll/votes" -H "$K" -H "$J" -d "{\"optionId\":$O2}"                        # V8 409
curl -s -X POST "$BASE/api/posts/$PID/poll/votes" -H "$P" -H "$J" -d "{\"optionId\":$O1}" > /dev/null             # V9
curl -s -X POST "$BASE/api/posts/$PID/poll/votes" -H "$L" -H "$J" -d "{\"optionId\":$O2}" > /dev/null             # V10
curl -s "$BASE/api/posts/$PID/poll"; echo                                                                          # V11 비로그인
curl -i -X POST "$BASE/api/posts/$PID/poll/votes" -H 'Authorization: Bearer tok-c01' -H "$J" -d '{"optionId":0}'      # V13 400
curl -i -X POST "$BASE/api/posts/$PID/poll/votes" -H 'Authorization: Bearer tok-c01' -H "$J" -d '{"optionId":"abc"}'  # V13c 400
curl -i "$BASE/api/posts/12/poll"                                                                                 # V14 404
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "V1",
      "title": "이스프링 글쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 점심 투표",
        "content": "점심 메뉴를 골라 주세요."
      }
    },
    {
      "id": "V2",
      "title": "투표 만들기",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "점심 뭐 먹을까요?",
        "options": [
          "김밥",
          "라면",
          "돈가스"
        ]
      }
    },
    {
      "id": "V3",
      "title": "같은 글에 또 만들기",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "또",
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V4",
      "title": "남의 글에 만들기(김자바)",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "question": "남의 글",
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V5a",
      "title": "잘못된 입력 — question 없음",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V5b",
      "title": "잘못된 입력 — question null",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": null,
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V5c",
      "title": "잘못된 입력 — question 공백만",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "   ",
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V5d",
      "title": "잘못된 입력 — question 201자",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가",
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V5e",
      "title": "잘못된 입력 — options 없음",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "없음"
      }
    },
    {
      "id": "V5f",
      "title": "잘못된 입력 — options 빈 배열",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "빈 배열",
        "options": []
      }
    },
    {
      "id": "V5g",
      "title": "잘못된 입력 — 선택지 1개",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "하나",
        "options": [
          "가"
        ]
      }
    },
    {
      "id": "V5h",
      "title": "잘못된 입력 — 선택지 6개",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "여섯",
        "options": [
          "가",
          "나",
          "다",
          "라",
          "마",
          "바"
        ]
      }
    },
    {
      "id": "V5i",
      "title": "잘못된 입력 — 빈 선택지",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "빈 선택지",
        "options": [
          "가",
          ""
        ]
      }
    },
    {
      "id": "V5j",
      "title": "잘못된 입력 — null 선택지",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "null 선택지",
        "options": [
          "가",
          null
        ]
      }
    },
    {
      "id": "V5k",
      "title": "잘못된 입력 — 51자 선택지",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "긴 선택지",
        "options": [
          "가",
          "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"
        ]
      }
    },
    {
      "id": "V5l",
      "title": "잘못된 입력 — 둘 다 null",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": null,
        "options": null
      }
    },
    {
      "id": "V6",
      "title": "잘못된 입력 — 겹치는 선택지(공백 자르면 같음)",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "겹침",
        "options": [
          "가",
          "가 "
        ]
      }
    },
    {
      "id": "V5m",
      "title": "없는 글에 만들기",
      "method": "POST",
      "path": "/api/posts/999999/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "없는 글",
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V7",
      "title": "김자바 '김밥'",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": "{{V2.body.options[0].id}}"
      },
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V8",
      "title": "김자바 또 '라면'",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": "{{V2.body.options[1].id}}"
      },
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V9",
      "title": "박디비 '김밥'",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": "{{V2.body.options[0].id}}"
      },
      "headers": {
        "Authorization": "Bearer tok-park"
      }
    },
    {
      "id": "V10",
      "title": "이스프링 '라면'",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": "{{V2.body.options[1].id}}"
      },
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "V11",
      "title": "결과(비로그인)",
      "method": "GET",
      "path": "/api/posts/{{V1.body.id}}/poll"
    },
    {
      "id": "V12",
      "title": "결과(김자바)",
      "method": "GET",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V13",
      "title": "잘못된 입력 — 이 투표에 없는 선택지",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": 0
      },
      "headers": {
        "Authorization": "Bearer tok-c01"
      }
    },
    {
      "id": "V13b",
      "title": "잘못된 입력 — optionId null",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": null
      },
      "headers": {
        "Authorization": "Bearer tok-c01"
      }
    },
    {
      "id": "V13c",
      "title": "잘못된 입력 — optionId 자리에 문자",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": "abc"
      },
      "headers": {
        "Authorization": "Bearer tok-c01"
      }
    },
    {
      "id": "V13d",
      "title": "잘못된 입력 — optionId 없음",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {},
      "headers": {
        "Authorization": "Bearer tok-c01"
      }
    },
    {
      "id": "V13e",
      "title": "없는 글에 투표",
      "method": "POST",
      "path": "/api/posts/999999/poll/votes",
      "body": {
        "optionId": 1
      },
      "headers": {
        "Authorization": "Bearer tok-c01"
      }
    },
    {
      "id": "V14",
      "title": "투표가 없는 글",
      "method": "GET",
      "path": "/api/posts/12/poll"
    },
    {
      "id": "V15",
      "title": "토큰 없이 투표",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "body": {
        "optionId": "{{V2.body.options[0].id}}"
      }
    },
    {
      "id": "V16",
      "title": "박디비 글쓰기(경계값 확인용)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-park"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 경계값 투표",
        "content": "경계값 확인"
      }
    },
    {
      "id": "V17",
      "title": "경계값 안쪽 — 질문 200자·선택지 5개·선택지 50자",
      "method": "POST",
      "path": "/api/posts/{{V16.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-park"
      },
      "body": {
        "question": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가",
        "options": [
          "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나",
          "나",
          "다",
          "라",
          "마"
        ]
      }
    },
    {
      "id": "V18",
      "title": "질문에 숫자 JSON — 자동 문자열 변환 금지",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": 123,
        "options": [
          "가",
          "나"
        ]
      }
    },
    {
      "id": "V19",
      "title": "선택지 원소에 숫자 JSON — 원소별 오류",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "타입",
        "options": [
          1,
          2
        ]
      }
    },
    {
      "id": "V20",
      "title": "선택지 배열 자리에 문자열",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "타입",
        "options": "가,나"
      }
    },
    {
      "id": "V21",
      "title": "optionId 문자열 JSON — 자동 정수 변환 금지",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "optionId": "1"
      }
    },
    {
      "id": "V22",
      "title": "optionId 소수 JSON — 정수만 허용",
      "method": "POST",
      "path": "/api/posts/{{V1.body.id}}/poll/votes",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "optionId": 1.2
      }
    },
    {
      "id": "V23",
      "title": "원문 길이가 아니라 저장값 길이 검증용 새 글",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 공백 정규화 투표",
        "content": "저장값 길이 확인"
      }
    },
    {
      "id": "V24",
      "title": "앞뒤 공백을 벗긴 뒤 질문·선택지 200·50자",
      "method": "POST",
      "path": "/api/posts/{{V23.body.id}}/poll",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "question": "  가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가  ",
        "options": [
          "  나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나  ",
          "라"
        ]
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "V2",
      "expect": {
        "status": 201,
        "headers": {
          "Location": {
            "endsWith": "/api/posts/{{V1.body.id}}/poll"
          }
        },
        "json": [
          {
            "path": "$.options[*].label",
            "equals": [
              "김밥",
              "라면",
              "돈가스"
            ]
          },
          {
            "path": "$.options[*].votes",
            "equals": [
              0,
              0,
              0
            ]
          },
          {
            "path": "$.totalVotes",
            "equals": 0
          }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "V3",
          "expect": {
            "status": 409
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 403
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "V5a",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "question"
              }
            ]
          }
        },
        {
          "request": "V5b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "question"
              }
            ]
          }
        },
        {
          "request": "V5c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "question"
              }
            ]
          }
        },
        {
          "request": "V5d",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "question"
              }
            ]
          }
        }
      ],
      "note": "question이 없거나 null·공백만·201자면 400이고 errors에 question이 있다(500·201이 아니다)"
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "V5e",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options"
              }
            ]
          }
        },
        {
          "request": "V5f",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options"
              }
            ]
          }
        },
        {
          "request": "V5g",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options"
              }
            ]
          }
        },
        {
          "request": "V5h",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options"
              }
            ]
          }
        },
        {
          "request": "V5i",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options[1]"
              }
            ]
          }
        },
        {
          "request": "V5j",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options[1]"
              }
            ]
          }
        },
        {
          "request": "V5k",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options[1]"
              }
            ]
          }
        },
        {
          "request": "V6",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C5",
      "request": "V5l",
      "expect": {
        "status": 400,
        "json": [
          {
            "path": "$.errors[*].field",
            "contains": "question"
          },
          {
            "path": "$.errors[*].field",
            "contains": "options"
          }
        ]
      },
      "note": "틀린 필드가 둘이면 errors에 둘 다 있다"
    },
    {
      "id": "C6",
      "request": "V5m",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C7",
      "request": "V7",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.options[*].votes",
            "equals": [
              1,
              0,
              0
            ]
          },
          {
            "path": "$.myVoteOptionId",
            "equals": "{{V2.body.options[0].id}}"
          }
        ]
      }
    },
    {
      "id": "C8",
      "request": "V8",
      "expect": {
        "status": 409
      }
    },
    {
      "id": "C9",
      "request": "V11",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.options[*].votes",
            "equals": [
              2,
              1,
              0
            ]
          },
          {
            "path": "$.totalVotes",
            "equals": 3
          },
          {
            "path": "$.myVoteOptionId",
            "type": "null"
          }
        ]
      }
    },
    {
      "id": "C10",
      "request": "V12",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.myVoteOptionId",
            "equals": "{{V2.body.options[0].id}}"
          }
        ]
      }
    },
    {
      "id": "C11",
      "all": [
        {
          "request": "V13",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "optionId"
              }
            ]
          }
        },
        {
          "request": "V13b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "optionId"
              }
            ]
          }
        },
        {
          "request": "V13c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "optionId"
              }
            ]
          }
        },
        {
          "request": "V13d",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "optionId"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C12",
      "all": [
        {
          "request": "V13e",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V14",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "V15",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C13",
      "request": "V17",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.options",
            "length": 5
          },
          {
            "path": "$.question",
            "matches": "^가{200}$"
          }
        ]
      },
      "note": "경계값 바로 안쪽(200자·5개·50자)은 성공한다"
    },
    {
      "id": "C14",
      "all": [
        {
          "request": "V18",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "question"
              }
            ]
          }
        },
        {
          "request": "V19",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options[0]"
              },
              {
                "path": "$.errors[*].field",
                "contains": "options[1]"
              }
            ]
          }
        },
        {
          "request": "V20",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "options"
              }
            ]
          }
        },
        {
          "request": "V21",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "optionId"
              }
            ]
          }
        },
        {
          "request": "V22",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "optionId"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C15",
      "all": [
        {
          "request": "V23",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "V24",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.question",
                "equals": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
              },
              {
                "path": "$.options[0].label",
                "equals": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"
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

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{PID}`는 V1 응답의 글 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | V2 | `201`, `Location`이 `/api/posts/{PID}/poll`로 끝남, 선택지 `김밥·라면·돈가스` 순서, 모두 0표 |
| C2 | V3 / V4 | `409` / `403` |
| C3 | V5a~V5d(question 없음·null·공백만·201자) | 모두 `400`, `errors`에 `question` |
| C4 | V5e~V5k·V6(options 없음·빈 배열·1개·6개·빈 선택지·null 선택지·51자·겹침) | 모두 `400`, `errors`에 `options` 또는 `options[1]` |
| C5 | V5l(둘 다 null) | `400`, `errors`에 `question`과 `options` 둘 다 |
| C6 | V5m | `404` — 없는 글 |
| C7 | V7 | `201`, 표 `[1, 0, 0]`, `myVoteOptionId`=김밥의 id |
| C8 | V8 | `409` — 다른 선택지로도 두 번째 표는 안 된다 |
| C9 | V11 | `200`, 표 `[2, 1, 0]`, `totalVotes`=3, `myVoteOptionId`=`null` |
| C10 | V12 | `200`, `myVoteOptionId`=김밥의 id |
| C11 | V13~V13d(없는 선택지·null·문자·없음) | 모두 `400`, `errors`에 `optionId` |
| C12 | V13e / V14 / V15 | `404` / `404` / `401` |
| C13 | V17 | `201`, 선택지 5개 — 경계값 바로 안쪽(질문 200자·선택지 5개·선택지 50자)은 성공한다 |
| C14 | V18~V22 | 숫자 질문·숫자 선택지·문자열 배열·문자열/소수 optionId 모두 `400`; `errors`에 해당 필드(선택지 인덱스 포함) |
| C15 | V23~V24 | 원문 앞뒤 공백을 제거한 뒤 질문 200자·선택지 50자는 `201`; 응답에는 공백 없는 값 |
| D1 | `SELECT COUNT(*) FROM poll_vote v JOIN poll p ON p.id = v.poll_id WHERE p.post_id = {PID}` | `3` — V8·V13~V13d는 아무것도 만들지 않았다 |
| D2 | `SELECT COUNT(*) FROM poll WHERE post_id = {PID}` | `1` — V3·V5a~V6이 아무것도 만들지 않았다 |
| D3 | `SHOW INDEX FROM poll_vote WHERE Non_unique = 0 AND Key_name <> 'PRIMARY'` | `poll_id`·`member_id` 두 칼럼으로 된 UNIQUE 인덱스가 있다 |
| R1 | 한 번만 | 서비스에서 "이미 투표했나"를 먼저 보더라도, 동시에 두 요청이 오면 둘 다 통과할 수 있다. 마지막 방어는 `UNIQUE(poll_id, member_id)`이고 그 예외(`DataIntegrityViolationException`)를 409로 바꾼다(6-2 R1과 같은 모양) |
| R2 | 선택지 소속 | `optionId`가 이 투표의 선택지인지 확인한다. 확인하지 않으면 다른 글의 투표에 표가 들어간다 |
| R3 | 결과 | 선택지마다 따로 세지 않고 `LEFT JOIN … GROUP BY` 한 번으로 센다. `INNER JOIN`이면 0표인 선택지가 사라진다 |
| R4 | 저장 | 투표와 선택지가 한 트랜잭션에서 함께 저장된다(cascade든 리포지토리 두 번이든). 선택지 저장이 실패하면 투표도 남지 않는다 |

## 필요한 지식

- [W10 — 서비스와 DB: 안내 검사와 최종 고유성](../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성) — 409를 어디서 만드나
- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기) — 요청으로 들어온 id를 믿지 않기
- [R04 — JOIN 결과 확인](../../docs/knowledge/R04-sql-crud-join.md#3단계-join-결과-확인) — `LEFT JOIN`과 0건
- [P20 — cascade, orphanRemoval](../../docs/knowledge/P20-jpa-entity-mapping.md#25-cascade-orphanremoval-다대다) — 투표와 선택지를 같이 저장
- [E4 레슨 — JPA 연관관계](../../lessons/E4-jpa-associations.md)
- [G3 레슨 — 첫 트랜잭션](../../lessons/G3-first-transaction.md)
- [F1 레슨 — 검증과 오류 응답](../../lessons/F1-validation-errors.md) — `List<@NotBlank String>`처럼 원소에 거는 제약

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 확인 순서</summary>

만들기: 본문 검증(`@Valid`) → 글이 보이나(404) → 글쓴이인가(403) → 선택지 겹침(400) → 이미 있나(409) → 저장(`saveAndFlush`로 UNIQUE 위반을 이 자리에서 터뜨려 409로). 투표: 글이 보이나(404) → 투표가 있나(404) → 이 투표의 선택지인가(400) → 이미 투표했나(409) → 저장.
</details>

<details>
<summary>힌트 2 — 결과 쿼리</summary>

```sql
SELECT o.id AS id, o.label AS label, COUNT(v.id) AS votes
  FROM poll_option o
  LEFT JOIN poll_vote v ON v.option_id = o.id
 WHERE o.poll_id = :pollId
 GROUP BY o.id, o.label, o.position
 ORDER BY o.position
```

`COUNT(*)`가 아니라 `COUNT(v.id)`다 — 표가 없는 선택지도 `LEFT JOIN` 결과에 한 줄(v 쪽이 NULL)이 있어서 `COUNT(*)`는 1이 된다.
</details>

## 다음 단계

[14-3. 공지·상단 고정 글](14-3-pinned-posts.md)
