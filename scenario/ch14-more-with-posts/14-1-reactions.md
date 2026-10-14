# 14-1. 공감 종류 — 👍❤️😂😢 중 하나만

> 14장은 시나리오 DB(`community`)로 한다 — 앱을 기본 프로파일로 띄운다(13장과 같다). 이 장의 마이그레이션 번호는 **V50~V59**다(11~13장의 V20~V49 다음).

## 상황

> "하트 하나로는 부족하대요. 👍❤️😂😢 네 가지 중에 하나를 고르게 해 주세요. 한 사람이 한 글에 **한 종류만**이고, 다른 걸 누르면 **바뀌고**, 다시 취소할 수도 있어야 해요. 글 아래에는 종류별 개수를 보여 줄 거예요."

4장 좋아요는 "눌렀다/안 눌렀다" 두 상태였다. 이번에는 **상태가 다섯 개**다(없음·👍·❤️·😂·😢). 그래서 행이 "있다/없다"만으로는 부족하고, 행에 **종류 칼럼**이 생긴다. 다른 종류를 누르면 행을 지우고 새로 만드는 게 아니라 **그 행의 종류만 바꾼다**. 개수는 글 테이블에 칼럼 네 개를 두지 않고, 공감 테이블을 **`GROUP BY`로 센다**.

좋아요(4장)는 그대로 둔다. 둘은 서로 다른 기능이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 아래 공감 버튼",
  "summary": "네 종류 중 하나만 고른다. 다른 종류를 누르면 바뀌고, 개수는 종류별로 센다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유글 02", "right": "김자바" },
    { "type": "text", "id": "body", "value": "페이징 확인용 자유글 02입니다.", "emphasis": "body" },
    {
      "type": "stats",
      "id": "counts",
      "items": [
        { "id": "c-up", "label": "👍", "value": "0" },
        { "id": "c-heart", "label": "❤️", "value": "1" },
        { "id": "c-laugh", "label": "😂", "value": "1" },
        { "id": "c-sad", "label": "😢", "value": "0" }
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        { "id": "b-up", "label": "👍", "variant": "secondary" },
        { "id": "b-heart", "label": "❤️", "variant": "secondary" },
        { "id": "b-laugh", "label": "😂 (내 공감)", "variant": "primary" },
        { "id": "b-sad", "label": "😢", "variant": "secondary" }
      ]
    }
  ],
  "flows": [
    {
      "name": "❤️를 누르고 😂로 바꾸기",
      "steps": [
        { "kind": "user", "text": "❤️를 눌렀다가 마음을 바꿔 😂를 누른다", "focus": ["b-laugh"] },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/13/reaction",
          "headers": ["Content-Type: application/json", "Authorization: Bearer tok-kimjava"],
          "body": "{\"kind\": \"LAUGH\"}"
        },
        { "kind": "db", "sql": "SELECT id, kind FROM post_reaction WHERE post_id = 13 AND member_id = 2", "note": "이미 ❤️ 행이 있다" },
        { "kind": "db", "sql": "UPDATE post_reaction SET kind = 'LAUGH', updated_at = ? WHERE id = ?", "note": "지우고 새로 만들지 않는다 — 행은 하나 그대로" },
        { "kind": "db", "sql": "SELECT kind, COUNT(*) AS cnt FROM post_reaction WHERE post_id = 13 GROUP BY kind" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"postId\": 13, \"myReaction\": \"LAUGH\", \"counts\": {\"THUMBS_UP\": 0, \"HEART\": 1, \"LAUGH\": 1, \"SAD\": 0}, \"total\": 2}"
        },
        { "kind": "screen", "text": "😂 버튼이 내 공감으로 표시되고 ❤️ 1 · 😂 1", "focus": ["b-laugh", "counts"] }
      ]
    },
    {
      "name": "비로그인으로 개수 보기",
      "steps": [
        { "kind": "user", "text": "로그인하지 않고 글을 연다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/13/reactions" },
        { "kind": "server", "text": "글을 볼 수 있는지 먼저 확인한다(2-3 규칙) — 볼 수 없는 글이면 404" },
        { "kind": "db", "sql": "SELECT kind, COUNT(*) AS cnt FROM post_reaction WHERE post_id = 13 GROUP BY kind", "note": "아무도 누르지 않은 종류는 결과에 없다 → 0으로 채운다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"postId\": 13, \"myReaction\": null, \"counts\": {\"THUMBS_UP\": 0, \"HEART\": 1, \"LAUGH\": 1, \"SAD\": 0}, \"total\": 2}"
        },
        { "kind": "screen", "text": "네 종류의 개수가 모두 보인다(0 포함). 내 공감 표시는 없다", "focus": ["counts"] }
      ]
    },
    {
      "name": "없는 종류",
      "steps": [
        { "kind": "user", "text": "앱이 옛 버전이라 😡(ANGRY)를 보낸다" },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/13/reaction",
          "headers": ["Content-Type: application/json", "Authorization: Bearer tok-kimjava"],
          "body": "{\"kind\": \"ANGRY\"}"
        },
        { "kind": "server", "text": "JSON을 enum으로 읽다가 실패 → 400. DB까지 가지 않는다" },
        { "kind": "response", "status": 400, "headers": ["Content-Type: application/problem+json"] },
        { "kind": "screen", "text": "'앱을 업데이트해 주세요'", "focus": ["buttons"] }
      ]
    }
  ]
}
```

## 만들 것

**V50** — `db/migration/V50__create_post_reaction.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `post_id` · `member_id` | FK → `post` · `member`. **`UNIQUE(post_id, member_id)`** — 한 사람이 한 글에 행 하나 |
| `kind` | `VARCHAR(20)`, `CHECK (kind IN ('THUMBS_UP', 'HEART', 'LAUGH', 'SAD'))` |
| `created_at` · `updated_at` | 만든 시각 · 종류를 바꾼 시각 |

**API**

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `PUT /api/posts/{id}/reaction` | 공감하기·종류 바꾸기 `{ "kind": "HEART" }` | `200` 아래 요약 JSON |
| `DELETE /api/posts/{id}/reaction` | 취소(안 했어도 성공) | `200` 아래 요약 JSON |
| `GET /api/posts/{id}/reactions` | 개수 보기 — **비로그인 가능** | `200` 아래 요약 JSON |

```json
{ "postId": 13, "myReaction": "LAUGH", "counts": { "THUMBS_UP": 0, "HEART": 1, "LAUGH": 1, "SAD": 0 }, "total": 2 }
```

**필드 규칙** — `PUT /api/posts/{id}/reaction` 본문

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `kind` | 예 | 안 됨(`null`·`""`·공백만 → 400) | — | `THUMBS_UP`·`HEART`·`LAUGH`·`SAD` 중 하나(대문자 그대로, `heart`는 안 됨) | 없음 | `400`, `errors`에 `kind` |
| 본문 자체 | 예 | — | — | JSON 객체(배열·깨진 JSON → 400) | — | `400` |
| 경로 `{id}` | 예 | — | — | 숫자(`abc` → 400) | — | 없는 글이면 `404` |

**잘못된 입력은 어떤 경우에도 500이 아니다.** 종류를 enum으로 바로 받으면 Jackson이 JSON을 읽다가 실패해 어느 필드가 틀렸는지 흐려지므로, 문자열로 받아 `@NotBlank`·`@Pattern`으로 검사한 뒤 enum으로 바꾼다(1-5 `visibility`와 같은 방식).

| 상황 | 결과 |
|---|---|
| 같은 종류를 또 PUT | `200`, 아무것도 바뀌지 않는다(멱등) |
| 다른 종류를 PUT | `200`, 그 행의 `kind`만 바뀐다(행 수는 그대로) |
| `counts` | 네 종류를 **항상 모두** 담는다(0 포함). `myReaction`은 비로그인이거나 공감하지 않았으면 `null` |
| `kind`가 위 표의 규칙을 어김 | `400` + `errors`에 `kind` |
| 없는 글, 2-3 규칙상 볼 수 없는 글 | `404` |
| PUT·DELETE에 토큰 없음 | `401` |

## 구현 가이드

**먼저 위 계약을 직접 구현한 뒤**, 필요한 역할을 펼쳐 실제 실행한 파일 전문과 비교한다. JPA는 엔티티 변경 감지로 종류를 바꾸고, MyBatis는 `(post_id, member_id)` 고유키에 대한 UPSERT로 삽입·변경을 한 문장에 처리한다. 두 경로 모두 글 접근 정책과 DTO·Controller·Flyway 스키마는 같다. `created_at`은 처음 공감한 시각이므로 MyBatis의 중복 키 갱신에서는 바꾸지 않는다.

MyBatis 대안을 실행할 때 `build.gradle`의 `dependencies`에 `implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'`을 추가한다. 아래 MyBatis `ReactionService`가 JPA 버전을 **대체**하고, `ReactionMapper`·`ReactionCount`·XML을 추가한다. 글 조회·접근 정책은 기존 JPA `PostRepository`와 `PostAccessPolicy`를 재사용한다. MyBatis 대안은 공감 테이블의 조회·저장을 담당한다.

이 단계의 C 기준은 순차 요청이다. JPA 예시의 최초 공감은 `SELECT` 후 `INSERT`하므로 같은 회원·글의 **최초 PUT 두 건이 동시에 오면** 고유키 충돌로 한 요청이 실패할 수 있다. 동시 최초 요청까지 200으로 보장하려면 원자적 UPSERT나 잠금·재시도 정책을 별도로 설계해야 한다. 아래 MyBatis 대안은 고유키 기반 UPSERT를 사용한다.

<details>
<summary>MyBatis / 설정 — 의존성·Mapper XML 경로</summary>

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
<summary>Controller — 공감·취소·비로그인 조회</summary>

`src/main/java/org/example/reaction/ReactionController.java`

```java
package org.example.reaction;

import jakarta.validation.Valid;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReactionController {

    private final ReactionService reactionService;

    public ReactionController(ReactionService reactionService) {
        this.reactionService = reactionService;
    }

    // 공감하거나 종류 바꾸기 — PUT이라 같은 요청을 여러 번 보내도 결과가 같다
    @PutMapping("/api/posts/{id}/reaction")
    public ReactionSummaryResponse react(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember,
                                         @Valid @RequestBody ReactionRequest request) {
        return reactionService.react(id, loginMember, request.toKind());
    }

    @DeleteMapping("/api/posts/{id}/reaction")
    public ReactionSummaryResponse cancel(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        return reactionService.cancel(id, loginMember);
    }

    // 비로그인도 볼 수 있다(myReaction은 null)
    @GetMapping("/api/posts/{id}/reactions")
    public ReactionSummaryResponse get(@PathVariable Long id, @LoginMember AuthenticatedMember viewer) {
        return reactionService.get(id, viewer);
    }
}
```

</details>

<details>
<summary>DTO — 종류 검증·GROUP BY 결과·응답</summary>

`src/main/java/org/example/reaction/ReactionRequest.java`

```java
package org.example.reaction;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// 종류는 문자열로 받아 Bean Validation으로 검사한다(1-5의 visibility와 같은 방식) — 틀리면 400과 함께
// errors에 "kind"가 들어간다. enum으로 바로 받으면 JSON을 읽는 단계에서 실패해 어느 필드가 틀렸는지 흐려진다.
public record ReactionRequest(
        @NotBlank(message = "공감 종류를 골라 주세요.")
        @Pattern(regexp = "THUMBS_UP|HEART|LAUGH|SAD", message = "공감 종류는 THUMBS_UP·HEART·LAUGH·SAD 중 하나여야 합니다.")
        String kind
) {
    public ReactionKind toKind() {
        return ReactionKind.valueOf(kind);
    }
}
```

`src/main/java/org/example/reaction/ReactionCountRow.java`

```java
package org.example.reaction;

// GROUP BY kind 결과 한 줄 — 인터페이스 프로젝션(별칭 kind·cnt와 getter 이름을 맞춘다)
public interface ReactionCountRow {
    String getKind();

    long getCnt();
}
```

`src/main/java/org/example/reaction/ReactionSummaryResponse.java`

```java
package org.example.reaction;

import java.util.Map;

// counts는 네 종류를 항상 모두 담는다(0 포함). myReaction은 비로그인이거나 공감하지 않았으면 null
public record ReactionSummaryResponse(
        Long postId,
        ReactionKind myReaction,
        Map<ReactionKind, Long> counts,
        long total
) {
}
```

</details>

<details>
<summary>Service — 접근 검사·트랜잭션·0 채우기</summary>

`src/main/java/org/example/reaction/ReactionService.java`

```java
package org.example.reaction;

import org.example.auth.AuthenticatedMember;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

// 공감 — 한 사람이 한 글에 한 종류. 같은 종류 또 → 그대로(멱등), 다른 종류 → 바꾸기, 취소 → 행 삭제
@Service
public class ReactionService {

    private final PostReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public ReactionService(PostReactionRepository reactionRepository, PostRepository postRepository,
                           MemberRepository memberRepository, PostAccessPolicy accessPolicy, Clock clock) {
        this.reactionRepository = reactionRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public ReactionSummaryResponse react(Long postId, AuthenticatedMember me, ReactionKind kind) {
        Post post = findViewable(postId, me);
        LocalDateTime now = LocalDateTime.now(clock);
        reactionRepository.findByPost_IdAndMember_Id(postId, me.id())
                .ifPresentOrElse(
                        reaction -> reaction.changeKind(kind, now),
                        () -> reactionRepository.save(
                                new PostReaction(post, memberRepository.getReferenceById(me.id()), kind, now)));
        // 변경 감지로 바뀐 kind가 아래 COUNT 전에 DB에 반영되게 한다(JPQL·네이티브 쿼리 전에 자동 flush)
        return summary(postId, me);
    }

    @Transactional
    public ReactionSummaryResponse cancel(Long postId, AuthenticatedMember me) {
        findViewable(postId, me);
        reactionRepository.deleteMine(postId, me.id());
        return summary(postId, me);
    }

    @Transactional(readOnly = true)
    public ReactionSummaryResponse get(Long postId, AuthenticatedMember viewer) {
        findViewable(postId, viewer);
        return summary(postId, viewer);
    }

    private Post findViewable(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
        return post;
    }

    private ReactionSummaryResponse summary(Long postId, AuthenticatedMember viewer) {
        Map<ReactionKind, Long> counts = new EnumMap<>(ReactionKind.class);
        for (ReactionKind kind : ReactionKind.values()) {
            counts.put(kind, 0L);
        }
        for (ReactionCountRow row : reactionRepository.countByKind(postId)) {
            counts.put(ReactionKind.valueOf(row.getKind()), row.getCnt());
        }
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        ReactionKind mine = viewer == null ? null
                : reactionRepository.findByPost_IdAndMember_Id(postId, viewer.id())
                        .map(PostReaction::getKind).orElse(null);
        return new ReactionSummaryResponse(postId, mine, new LinkedHashMap<>(counts), total);
    }
}
```

</details>

<details>
<summary>JPA / Repository — 내 공감·삭제·종류별 집계</summary>

`src/main/java/org/example/reaction/PostReactionRepository.java`

```java
package org.example.reaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {

    Optional<PostReaction> findByPost_IdAndMember_Id(Long postId, Long memberId);

    @Modifying
    @Query("DELETE FROM PostReaction r WHERE r.post.id = :postId AND r.member.id = :memberId")
    int deleteMine(@Param("postId") Long postId, @Param("memberId") Long memberId);

    // 종류별 개수 — 공감이 하나도 없는 종류는 결과에 없다(0 채우기는 서비스에서)
    @Query(nativeQuery = true, value = """
            SELECT kind AS kind, COUNT(*) AS cnt
              FROM post_reaction
             WHERE post_id = :postId
             GROUP BY kind
            """)
    List<ReactionCountRow> countByKind(@Param("postId") Long postId);
}
```

</details>

<details>
<summary>Entity — 한 회원·한 글의 공감 종류</summary>

`src/main/java/org/example/reaction/PostReaction.java`

```java
package org.example.reaction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

// 글 공감 — (post_id, member_id) UNIQUE. 행이 있으면 그 종류로 공감한 상태다
@Entity
@Table(name = "post_reaction")
public class PostReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // ORDINAL(0,1,2…)로 저장하면 enum 순서를 바꾸는 순간 기존 데이터의 뜻이 바뀐다 — 이름으로 저장한다
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionKind kind;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PostReaction() {
        // JPA
    }

    public PostReaction(Post post, Member member, ReactionKind kind, LocalDateTime now) {
        this.post = post;
        this.member = member;
        this.kind = kind;
        this.createdAt = now;
        this.updatedAt = now;
    }

    // 다른 종류로 바꾸기 — 같은 종류면 아무것도 하지 않는다(UPDATE도 나가지 않는다)
    public void changeKind(ReactionKind kind, LocalDateTime now) {
        if (this.kind == kind) {
            return;
        }
        this.kind = kind;
        this.updatedAt = now;
    }

    public ReactionKind getKind() {
        return kind;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — UNIQUE·외래키·CHECK</summary>

`src/main/resources/db/migration/V50__create_post_reaction.sql`

```sql
-- 14-1 공감 종류 — 한 회원이 한 글에 한 종류만(UNIQUE). 종류를 바꾸면 행을 새로 만들지 않고 kind만 바꾼다.
-- 종류별 개수는 이 테이블을 GROUP BY로 센다(post에 종류별 카운터 컬럼을 두지 않는다).
CREATE TABLE post_reaction (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    post_id    BIGINT      NOT NULL,
    member_id  BIGINT      NOT NULL,
    kind       VARCHAR(20) NOT NULL,
    created_at DATETIME    NOT NULL,
    updated_at DATETIME    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_post_reaction (post_id, member_id),
    KEY fk_post_reaction_member (member_id),
    CONSTRAINT fk_post_reaction_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_post_reaction_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT ck_post_reaction_kind CHECK (kind IN ('THUMBS_UP', 'HEART', 'LAUGH', 'SAD'))
);
```

</details>

<details>
<summary>Enum — 허용한 네 종류</summary>

`src/main/java/org/example/reaction/ReactionKind.java`

```java
package org.example.reaction;

// 공감 종류 — DB에는 이름 그대로(VARCHAR) 저장한다. 순서를 바꾸면 응답의 counts 순서도 바뀐다
public enum ReactionKind {
    THUMBS_UP, HEART, LAUGH, SAD
}
```

</details>

<details>
<summary>MyBatis / DTO — 집계 행</summary>

`src/main/java/org/example/reaction/ReactionCount.java`

```java
package org.example.reaction;

// GROUP BY 결과의 한 행이다. 없는 종류는 Service에서 0으로 채운다.
public record ReactionCount(String kind, Long cnt) {
}
```

</details>

<details>
<summary>MyBatis / Mapper — DB 연산 인터페이스</summary>

`src/main/java/org/example/reaction/ReactionMapper.java`

```java
package org.example.reaction;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ReactionMapper {
    void upsert(@Param("postId") Long postId, @Param("memberId") Long memberId,
                @Param("kind") String kind, @Param("now") LocalDateTime now);

    int deleteMine(@Param("postId") Long postId, @Param("memberId") Long memberId);

    String findMine(@Param("postId") Long postId, @Param("memberId") Long memberId);

    List<ReactionCount> countByKind(@Param("postId") Long postId);
}
```

</details>

<details>
<summary>MyBatis / SQL — UPSERT·삭제·GROUP BY</summary>

`src/main/resources/mapper/ReactionMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.reaction.ReactionMapper">
    <resultMap id="reactionCount" type="org.example.reaction.ReactionCount">
        <constructor>
            <arg column="kind" javaType="java.lang.String"/>
            <arg column="cnt" javaType="java.lang.Long"/>
        </constructor>
    </resultMap>

    <insert id="upsert">
        INSERT INTO post_reaction (post_id, member_id, kind, created_at, updated_at)
        VALUES (#{postId}, #{memberId}, #{kind}, #{now}, #{now})
        ON DUPLICATE KEY UPDATE
            updated_at = IF(kind &lt;&gt; #{kind}, #{now}, updated_at),
            kind = #{kind}
    </insert>

    <delete id="deleteMine">
        DELETE FROM post_reaction WHERE post_id = #{postId} AND member_id = #{memberId}
    </delete>

    <select id="findMine" resultType="java.lang.String">
        SELECT kind FROM post_reaction WHERE post_id = #{postId} AND member_id = #{memberId}
    </select>

    <select id="countByKind" resultMap="reactionCount">
        SELECT kind, COUNT(*) AS cnt FROM post_reaction
        WHERE post_id = #{postId} GROUP BY kind
    </select>
</mapper>
```

</details>

<details>
<summary>MyBatis / Service — 동일 HTTP 계약</summary>

`src/main/java/org/example/reaction/ReactionService.java`

```java
package org.example.reaction;

import org.example.auth.AuthenticatedMember;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

// MyBatis 대안: 공감 테이블은 Mapper가 담당하고 글 접근 규칙은 기존 PostAccessPolicy를 재사용한다.
@Service
public class ReactionService {
    private final ReactionMapper reactionMapper;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public ReactionService(ReactionMapper reactionMapper, PostRepository postRepository,
                           PostAccessPolicy accessPolicy, Clock clock) {
        this.reactionMapper = reactionMapper;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public ReactionSummaryResponse react(Long postId, AuthenticatedMember me, ReactionKind kind) {
        findViewable(postId, me);
        reactionMapper.upsert(postId, me.id(), kind.name(), LocalDateTime.now(clock));
        return summary(postId, me);
    }

    @Transactional
    public ReactionSummaryResponse cancel(Long postId, AuthenticatedMember me) {
        findViewable(postId, me);
        reactionMapper.deleteMine(postId, me.id());
        return summary(postId, me);
    }

    @Transactional(readOnly = true)
    public ReactionSummaryResponse get(Long postId, AuthenticatedMember viewer) {
        findViewable(postId, viewer);
        return summary(postId, viewer);
    }

    private void findViewable(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
    }

    private ReactionSummaryResponse summary(Long postId, AuthenticatedMember viewer) {
        Map<ReactionKind, Long> counts = new EnumMap<>(ReactionKind.class);
        for (ReactionKind kind : ReactionKind.values()) {
            counts.put(kind, 0L);
        }
        for (ReactionCount row : reactionMapper.countByKind(postId)) {
            counts.put(ReactionKind.valueOf(row.kind()), row.cnt());
        }
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        String mine = viewer == null ? null : reactionMapper.findMine(postId, viewer.id());
        return new ReactionSummaryResponse(postId,
                mine == null ? null : ReactionKind.valueOf(mine), new LinkedHashMap<>(counts), total);
    }
}
```

</details>

## 직접 확인

13번 글(박디비의 "자유글 02")에 김자바와 이스프링이 공감한다. 처음 두 줄은 다시 실행해도 같은 결과가 나오게 둘의 공감을 지운다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; J='Content-Type: application/json'

curl -s -X DELETE "$BASE/api/posts/13/reaction" -H "$K" > /dev/null                      # E0 처음 상태로
curl -s -X DELETE "$BASE/api/posts/13/reaction" -H "$L" > /dev/null                      # E0b
curl -s -X PUT "$BASE/api/posts/13/reaction" -H "$K" -H "$J" -d '{"kind":"HEART"}'; echo  # E1
curl -s -X PUT "$BASE/api/posts/13/reaction" -H "$L" -H "$J" -d '{"kind":"HEART"}'; echo  # E2
curl -s -X PUT "$BASE/api/posts/13/reaction" -H "$K" -H "$J" -d '{"kind":"LAUGH"}'; echo  # E3 바꾸기
curl -s -X PUT "$BASE/api/posts/13/reaction" -H "$K" -H "$J" -d '{"kind":"LAUGH"}'; echo  # E4 또
curl -s "$BASE/api/posts/13/reactions"; echo                                             # E5 비로그인
curl -i -X PUT "$BASE/api/posts/13/reaction" -H "$K" -H "$J" -d '{"kind":"ANGRY"}'        # E6 없는 종류
curl -i -X PUT "$BASE/api/posts/13/reaction" -H "$K" -H "$J" -d '{"kind":null}'           # E6d null
curl -i -X PUT "$BASE/api/posts/13/reaction" -H "$K" -H "$J" -d '{"kind":123}'            # E7b 숫자
curl -i -X PUT "$BASE/api/posts/999999/reaction" -H "$K" -H "$J" -d '{"kind":"SAD"}'      # E8b 없는 글
curl -i -X PUT "$BASE/api/posts/9/reaction" -H "$K" -H "$J" -d '{"kind":"HEART"}'         # E8 차단한 회원의 글
curl -i -X PUT "$BASE/api/posts/13/reaction" -H "$J" -d '{"kind":"HEART"}'                # E9 토큰 없음
curl -s -X DELETE "$BASE/api/posts/13/reaction" -H "$L"; echo                            # E10 취소
curl -s -X PUT "$BASE/api/posts/12/reaction" -H 'Authorization: Bearer tok-c01' -H "$J" -d '{"kind":"THUMBS_UP"}'; echo   # E11
curl -s -X PUT "$BASE/api/posts/12/reaction" -H 'Authorization: Bearer tok-c02' -H "$J" -d '{"kind":"SAD"}'; echo         # E12
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "E0",
      "title": "처음 상태로(김자바 공감 지우기)",
      "method": "DELETE",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "E0b",
      "title": "처음 상태로(이스프링 공감 지우기)",
      "method": "DELETE",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "E1",
      "title": "김자바 ❤️",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "HEART"
      }
    },
    {
      "id": "E2",
      "title": "이스프링 ❤️",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "kind": "HEART"
      }
    },
    {
      "id": "E3",
      "title": "김자바 😂로 바꾸기",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "LAUGH"
      }
    },
    {
      "id": "E4",
      "title": "김자바 😂 또",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "LAUGH"
      }
    },
    {
      "id": "E5",
      "title": "비로그인으로 개수 보기",
      "method": "GET",
      "path": "/api/posts/13/reactions"
    },
    {
      "id": "E6",
      "title": "잘못된 입력 — 없는 종류 ANGRY",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "ANGRY"
      }
    },
    {
      "id": "E6b",
      "title": "잘못된 입력 — 소문자 heart",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "heart"
      }
    },
    {
      "id": "E6c",
      "title": "잘못된 입력 — 빈 문자열",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": ""
      }
    },
    {
      "id": "E6d",
      "title": "잘못된 입력 — null",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": null
      }
    },
    {
      "id": "E6e",
      "title": "잘못된 입력 — 공백만",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "   "
      }
    },
    {
      "id": "E7",
      "title": "잘못된 입력 — kind 없음",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "E7b",
      "title": "잘못된 입력 — 숫자 자리",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": 123
      }
    },
    {
      "id": "E7c",
      "title": "잘못된 입력 — 배열",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": [
          "HEART"
        ]
      }
    },
    {
      "id": "E7d",
      "title": "잘못된 입력 — JSON이 아님",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "kind=HEART"
    },
    {
      "id": "E8",
      "title": "나를 차단한 회원의 글(9번)",
      "method": "PUT",
      "path": "/api/posts/9/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "HEART"
      }
    },
    {
      "id": "E8b",
      "title": "없는 글",
      "method": "PUT",
      "path": "/api/posts/999999/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "HEART"
      }
    },
    {
      "id": "E8c",
      "title": "글 id 자리에 문자",
      "method": "PUT",
      "path": "/api/posts/abc/reaction",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "kind": "HEART"
      }
    },
    {
      "id": "E9",
      "title": "토큰 없이",
      "method": "PUT",
      "path": "/api/posts/13/reaction",
      "body": {
        "kind": "HEART"
      }
    },
    {
      "id": "E10",
      "title": "이스프링 취소",
      "method": "DELETE",
      "path": "/api/posts/13/reaction",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "E11",
      "title": "동시성01 👍(12번 글)",
      "method": "PUT",
      "path": "/api/posts/12/reaction",
      "headers": {
        "Authorization": "Bearer tok-c01"
      },
      "body": {
        "kind": "THUMBS_UP"
      }
    },
    {
      "id": "E12",
      "title": "동시성02 😢(12번 글)",
      "method": "PUT",
      "path": "/api/posts/12/reaction",
      "headers": {
        "Authorization": "Bearer tok-c02"
      },
      "body": {
        "kind": "SAD"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "E1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.myReaction",
            "equals": "HEART"
          },
          {
            "path": "$.counts.HEART",
            "equals": 1
          },
          {
            "path": "$.counts.THUMBS_UP",
            "equals": 0
          },
          {
            "path": "$.total",
            "equals": 1
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "E2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.counts.HEART",
            "equals": 2
          },
          {
            "path": "$.total",
            "equals": 2
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "E3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.myReaction",
                "equals": "LAUGH"
              },
              {
                "path": "$.counts.HEART",
                "equals": 1
              },
              {
                "path": "$.counts.LAUGH",
                "equals": 1
              },
              {
                "path": "$.total",
                "equals": 2
              }
            ]
          }
        },
        {
          "request": "E4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.myReaction",
                "equals": "LAUGH"
              },
              {
                "path": "$.counts.LAUGH",
                "equals": 1
              },
              {
                "path": "$.total",
                "equals": 2
              }
            ]
          }
        }
      ],
      "note": "바꾸기는 새 공감이 아니다 — total이 3이 되면 행을 하나 더 만든 것이다"
    },
    {
      "id": "C4",
      "request": "E5",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.myReaction",
            "type": "null"
          },
          {
            "path": "$.counts.THUMBS_UP",
            "equals": 0
          },
          {
            "path": "$.counts.HEART",
            "equals": 1
          },
          {
            "path": "$.counts.LAUGH",
            "equals": 1
          },
          {
            "path": "$.counts.SAD",
            "equals": 0
          }
        ]
      }
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "E6",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E6b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E6c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E6d",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E6e",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E7",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E7b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        },
        {
          "request": "E7c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "kind"
              }
            ]
          }
        }
      ],
      "note": "500이면 검증이 없거나 예외를 못 바꾼 것이다. 200이면 그냥 저장된 것이다"
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "E7d",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "E8c",
          "expect": {
            "status": 400
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "E8",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "E8b",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "E9",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C8",
      "request": "E10",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.myReaction",
            "type": "null"
          },
          {
            "path": "$.counts.HEART",
            "equals": 0
          },
          {
            "path": "$.counts.LAUGH",
            "equals": 1
          },
          {
            "path": "$.total",
            "equals": 1
          }
        ]
      }
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "E11",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.myReaction",
                "equals": "THUMBS_UP"
              }
            ]
          }
        },
        {
          "request": "E12",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.myReaction",
                "equals": "SAD"
              }
            ]
          }
        }
      ],
      "note": "규칙 안쪽 값(첫 종류·마지막 종류)은 성공한다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | E1 | `200`, `myReaction`=`HEART`, `counts.HEART`=1, `counts.THUMBS_UP`=0, `total`=1 |
| C2 | E2 | `200`, `counts.HEART`=2 |
| C3 | E3 / E4 | 둘 다 `200`, `myReaction`=`LAUGH`, ❤️ 1 · 😂 1, `total`=2 |
| C4 | E5 | `200`, `myReaction`=`null`, 네 종류 모두 있음(👍 0 · ❤️ 1 · 😂 1 · 😢 0) |
| C5 | E6~E7c(없는 종류·소문자·빈 문자열·null·공백만·없음·숫자·배열) | 모두 `400`, `errors[].field`에 `kind` — 500·200이 아니다 |
| C6 | E7d / E8c | `400`(JSON이 아님) / `400`(글 id 자리에 문자) |
| C7 | E8 / E8b / E9 | `404`(볼 수 없는 글) / `404`(없는 글) / `401` |
| C8 | E10 | `200`, `myReaction`=`null`, ❤️ 0 · 😂 1, `total`=1 |
| C9 | E11 / E12 | `200` — 규칙 안쪽 값(👍·😢)은 성공한다 |
| D1 | E10 뒤 `SELECT member_id, kind FROM post_reaction WHERE post_id = 13` | `2, LAUGH` 한 줄 |
| D2 | `SELECT COUNT(*) FROM post_reaction WHERE post_id = 13 AND member_id = 2` | `1` — E3(바꾸기)이 새 행을 만들지 않고 E1의 행을 바꿨다 |
| D3 | `SELECT COUNT(*) FROM information_schema.check_constraints WHERE constraint_schema = 'community' AND constraint_name LIKE '%reaction%'` | `1` 이상 — 종류 제약이 DB에도 있다 |
| R1 | enum 저장 | `@Enumerated(EnumType.STRING)`으로 이름을 저장한다. `ORDINAL`(0·1·2…)이면 enum 순서를 바꾸는 순간 기존 행의 뜻이 바뀐다 |
| R2 | 개수 | 글마다 종류별 카운터 칼럼을 두지 않고 `GROUP BY kind`로 센다. 아무도 누르지 않은 종류는 결과에 없으니 서비스에서 0으로 채운다. 목록 화면에서 글 20개의 개수를 보여 줘야 할 때 이 방식의 비용과 4-2 카운터 칼럼 방식의 비용을 비교할 수 있다 |
| R3 | 바꾸기 | "있으면 kind만 바꾸고, 없으면 만든다". 지우고 다시 만들면 `created_at`(처음 공감한 시각)을 잃는다 |
| R4 | 소유자 | 취소가 "내 공감"만 지운다(`WHERE post_id = ? AND member_id = ?`) |

> 같은 사람이 처음 공감을 **동시에** 두 번 보내면 둘 다 "없다"를 보고 INSERT해서 하나는 `UNIQUE` 위반이 난다. 이 장은 동시성을 다루지 않는다 — 막는 방법은 [4-2](../ch4-like/4-2-like-concurrency.md)와 [H1 레슨](../../lessons/H1-concurrency-taste.md)을 본다.

## 필요한 지식

- [P20 — Enum ORDINAL의 문제는?](../../docs/knowledge/P20-jpa-entity-mapping.md#q4-enum-ordinal의-문제는) — 왜 `STRING`인가
- [J06 — EnumMap·EnumSet](../../docs/knowledge/J06-enum-annotation-reflection.md#q2-enummap과-hashmapenum-v-중-언제-enummap을-고르나) — 네 종류를 0으로 채운 맵
- [S10 — Projection](../../docs/knowledge/S10-spring-data-query.md#specification과-projection은-서로-다른-문제를-푼다) — `GROUP BY` 결과를 인터페이스로 받기
- [R03 스키마와 제약](../../docs/knowledge/R03-schema-types-constraints.md#3단계-제약이-실제-오류를-막는지-확인한다) — `UNIQUE`·`CHECK`
- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 볼 수 없는 글이면 404
- [F1 레슨 — 검증과 오류 응답](../../lessons/F1-validation-errors.md) — `@NotBlank`·`@Pattern`과 `errors` 목록

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 바꾸기와 만들기를 한 메서드로</summary>

`findByPost_IdAndMember_Id(postId, memberId)`로 내 행을 찾는다. 있으면 엔티티의 `changeKind(kind)`(같은 종류면 아무것도 안 함)를 부르고, 없으면 `save(new PostReaction(...))`. 트랜잭션 안에서 엔티티 값만 바꾸면 커밋 때 UPDATE가 나간다(변경 감지). 이어서 개수를 세는 쿼리를 실행하기 전에 Hibernate가 바뀐 값을 먼저 DB에 반영(flush)하므로 개수에 바로 반영된다.
</details>

<details>
<summary>힌트 2 — 종류별 개수</summary>

```java
@Query(nativeQuery = true, value = "SELECT kind AS kind, COUNT(*) AS cnt FROM post_reaction WHERE post_id = :postId GROUP BY kind")
List<ReactionCountRow> countByKind(@Param("postId") Long postId);   // interface ReactionCountRow { String getKind(); long getCnt(); }
```

응답의 `counts`는 `EnumMap`에 네 종류를 0으로 넣어 두고 결과로 덮어쓴다.
</details>

## 다음 단계

[14-2. 글 투표](14-2-polls.md)
