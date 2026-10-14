# 12-5. 팔로잉 피드 — 뮤트

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "홈에 '내 피드'를 만들어 주세요. 내가 팔로우하는 사람들 글과 내 글을 최신순으로요. 그리고 언팔로우까지는 하기 싫은데 글이 너무 많이 올라오는 사람이 있대요. 그 사람 글만 **내 피드에서** 안 보이게 하는 '뮤트'를 넣어 주세요. 차단처럼 상대가 눈치채면 안 돼요."

피드 자체는 티켓 [T-012](../../tickets/012-following-feed-api.md)와 같은 기능이다. 대상은 (나 + 팔로잉)의 글, 순서는 최신순, 페이징은 커서, 차단 관계는 뺀다. T-012를 했다면 그 코드를 그대로 쓰고, 이 단계에서는 **뮤트**만 더하면 된다.

뮤트는 차단과 다르다.

| | 차단(2-3) | 뮤트(이번) |
|---|---|---|
| 상대가 아나 | 상대도 내 글을 못 본다 | 모른다(상대에게 아무 변화 없음) |
| 어디에 적용 | 상세·목록·댓글·좋아요 전부 | **내 피드만** — 게시판 목록·글 상세는 그대로 보인다 |
| 팔로우 | 할 수 없다(12-4) | 팔로우는 그대로 유지 |

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "홈 — 내 피드",
  "summary": "팔로잉 + 내 글을 커서로. 글의 [⋯] → [이 사람 글 안 보기]가 뮤트 — 피드에서만 빠진다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "내 피드", "right": "밤샘개발자" },
    {
      "type": "list",
      "id": "feed",
      "items": [
        { "id": "f-145", "title": "스프링 트랜잭션 전파 삽질기", "meta": "밤샘개발자(나) · 10-03" },
        { "id": "f-101", "title": "주말에 만든 사이드 프로젝트", "meta": "리액트에서왔어요 · 09-01" },
        { "id": "f-91", "title": "스터디원 구합니다", "meta": "밤샘개발자(나) · 08-26 · 팔로워 공개" },
        { "id": "f-44", "title": "MySQL 인덱스 설계 비교해보기", "meta": "리액트에서왔어요 · 07-29" }
      ],
      "footer": "모두 봤어요"
    },
    { "type": "actions", "id": "menu", "items": [{ "id": "mute", "label": "이 사람 글 안 보기", "variant": "ghost" }, { "id": "unmute", "label": "다시 보기", "variant": "ghost" }] }
  ],
  "flows": [
    {
      "name": "피드 열기",
      "steps": [
        { "kind": "user", "text": "홈의 [내 피드]를 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/me/feed?size=2", "headers": ["Authorization: Bearer tok-p06"] },
        { "kind": "db", "sql": "SELECT ... FROM post p JOIN member a ON a.id = p.author_id WHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND (a.id = 6 OR EXISTS (SELECT 1 FROM follow f WHERE f.follower_id = 6 AND f.followee_id = a.id)) AND NOT EXISTS (차단) AND NOT EXISTS (SELECT 1 FROM member_mute m WHERE m.muter_id = 6 AND m.muted_id = a.id) ORDER BY p.published_at DESC, p.id DESC LIMIT 3" },
        { "kind": "response", "status": 200, "body": "{\"items\": [{\"id\": 145, ...}, {\"id\": 101, ...}], \"nextCursor\": \"MjAyNi0wOS0wMVQwOToyMjo0MnwxMDE\"}" },
        { "kind": "screen", "text": "글 2개, 내리면 커서로 이어 받는다", "focus": ["feed"] }
      ]
    },
    {
      "name": "뮤트",
      "steps": [
        { "kind": "user", "text": "리액트에서왔어요의 글에서 [⋯] → [이 사람 글 안 보기]", "focus": ["mute", "f-101"] },
        { "kind": "request", "method": "PUT", "path": "/api/members/7/mute", "headers": ["Authorization: Bearer tok-p06"] },
        { "kind": "db", "sql": "INSERT IGNORE INTO member_mute (muter_id, muted_id, created_at) VALUES (6, 7, ...)" },
        { "kind": "response", "status": 200, "body": "{\"memberId\": 7, \"muted\": true}" },
        { "kind": "screen", "text": "피드에서 101·44가 빠진다. 게시판 목록·글 상세에서는 그대로 보인다", "focus": ["feed"] }
      ]
    }
  ]
}
```

## 만들 것

**V32** — `db/migration/V32__create_member_mute.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `muter_id` | 뮤트한 회원, FK → `member` |
| `muted_id` | 뮤트당한 회원, FK → `member` |
| `created_at` | 만든 시각 |
| 제약 | `UNIQUE (muter_id, muted_id)`, `CHECK (muter_id <> muted_id)` |

**뮤트 API** — 토큰 필요, 본문 없음. 12-4 팔로우와 같은 모양의 멱등 PUT·DELETE

| 메서드·경로 | 응답 `200` |
|---|---|
| `PUT /api/members/{id}/mute` | `{ "memberId": 7, "muted": true }` — 이미 뮤트해도 같은 응답 |
| `DELETE /api/members/{id}/mute` | `{ "memberId": 7, "muted": false }` |

| 값 | 틀렸을 때 |
|---|---|
| `{id}` = 나 | `400` |
| `{id}`가 숫자가 아님 | `400` |
| 없는 회원·탈퇴 회원 | `404` |
| 차단 관계 | 막지 않는다(`200`) — 내 피드만 바뀐다 |

**피드 API** — `GET /api/me/feed?size=10` 또는 `GET /api/me/feed?size=10&cursor={nextCursor}` (토큰 필수, 없으면 `401`)

| 항목 | 내용 |
|---|---|
| 대상 | 작성자가 **나** 또는 **내가 팔로우하는 회원**, `PUBLISHED`, 삭제 안 됨. 팔로워 공개 글도 포함(팔로우 중이니까) |
| 빼는 글 | 나와 차단 관계(어느 쪽이든)인 작성자, **내가 뮤트한** 작성자 |
| 정렬·커서 | `published_at DESC, id DESC`, 커서는 마지막 항목의 `(published_at, id)` |
| 응답 | `{ "items": [게시판 목록 항목과 같은 모양], "nextCursor": "…" 또는 null }` |

| 값 | 필수 | 범위·형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|
| `size` | 아니요 | 정수 1~50(1·50 성공, 0·51 거절) | 10 | `400` |
| `cursor` | 아니요 | 앞 응답의 `nextCursor` | 없음(첫 묶음) | 빈 값·깨진 값 `400` |

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

<details>
<summary>예외 처리</summary>

`ApiExceptionHandler.java`, `SelfMuteNotAllowedException.java`: 실패 상태와 응답 본문을 계약과 대조한다.


```java
package org.example.social;

// 자기 자신 뮤트 — 전역 핸들러가 400으로 변환한다
public class SelfMuteNotAllowedException extends RuntimeException {

    public SelfMuteNotAllowedException() {
        super("자기 자신은 뮤트할 수 없습니다.");
    }
}
```

</details>

<details>
<summary>Controller</summary>

`FeedController.java`, `MuteController.java`: HTTP 매핑과 입력·응답을 **만들 것**의 계약과 대조한다.


```java
package org.example.post;

import org.example.auth.AuthenticatedMember;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.LoginMember;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class FeedController {

    private final PostQueryService postQueryService;

    public FeedController(PostQueryService postQueryService) {
        this.postQueryService = postQueryService;
    }

    // GET이지만 "내 것"이라 인증 필수
    @GetMapping("/api/me/feed")
    public FeedResponse feed(@RequestParam(value = "size", required = false) String size,
                             @RequestParam(required = false) String cursor,
                             @LoginMember AuthenticatedMember me) {
        if (me == null) {
            throw new AuthenticationRequiredException("인증이 필요합니다.");
        }
        return postQueryService.feed(me, parseSize(size), cursor);
    }

    private int parseSize(String raw) {
        if (raw == null) {
            return 10;
        }
        if (!raw.matches("[0-9]{1,2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size는 1~50의 정수여야 합니다.");
        }
        int value = Integer.parseInt(raw);
        if (value < 1 || value > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "size는 1~50의 정수여야 합니다.");
        }
        return value;
    }
}

package org.example.social;

import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MuteController {

    private final MuteService muteService;

    public MuteController(MuteService muteService) {
        this.muteService = muteService;
    }

    @PutMapping("/api/members/{id}/mute")
    public MuteResponse mute(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
        return muteService.mute(me, id);
    }

    @DeleteMapping("/api/members/{id}/mute")
    public MuteResponse unmute(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
        return muteService.unmute(me, id);
    }
}
```

</details>

<details>
<summary>DTO / 결과 행</summary>

`FeedResponse.java`, `MuteResponse.java`: 필드 이름·타입을 요청·응답 예시와 대조한다.


```java
package org.example.post;

import java.util.List;

// 12-5 피드 — 항목은 게시판 목록(2-2)과 같은 모양, 다음 묶음이 없으면 nextCursor = null
public record FeedResponse(List<PostListItemResponse> items, String nextCursor) {
}

package org.example.social;

public record MuteResponse(Long memberId, boolean muted) {
}
```

</details>

<details>
<summary>Service</summary>

`PostQueryService.java`, `MuteService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.


```java
// 12-5 팔로잉 피드 — size+1개를 읽어 다음 묶음이 있는지 정한다(4-3·6-3과 같은 커서)
    @Transactional(readOnly = true)
    public FeedResponse feed(AuthenticatedMember me, int size, String cursor) {
        Cursor after = Cursor.decode(cursor);
        List<Post> rows = postRepository.findFeed(me.id(),
                after == null ? null : after.at(), after == null ? null : after.id(),
                PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        List<Post> page = hasNext ? rows.subList(0, size) : rows;
        String nextCursor = null;
        if (hasNext) {
            Post last = page.get(page.size() - 1);
            nextCursor = new Cursor(last.getPublishedAt(), last.getId()).encode();
        }
        return new FeedResponse(page.stream().map(this::toListItem).toList(), nextCursor);
    }


package org.example.social;

import org.example.auth.AuthenticatedMember;
import org.example.member.MemberNotFoundException;
import org.example.member.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

// 12-5 뮤트 — 팔로우(12-4)와 같은 모양의 멱등 PUT/DELETE. 차단 관계여도 된다(내 피드만 바뀐다)
@Service
public class MuteService {

    private static final String WITHDRAWN = "WITHDRAWN";

    private final MemberMuteRepository memberMuteRepository;
    private final MemberRepository memberRepository;
    private final Clock clock;

    public MuteService(MemberMuteRepository memberMuteRepository, MemberRepository memberRepository, Clock clock) {
        this.memberMuteRepository = memberMuteRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
    }

    @Transactional
    public MuteResponse mute(AuthenticatedMember me, Long targetId) {
        Long id = checkTarget(me, targetId);
        memberMuteRepository.insertIgnore(me.id(), id, LocalDateTime.now(clock));
        return new MuteResponse(id, true);
    }

    @Transactional
    public MuteResponse unmute(AuthenticatedMember me, Long targetId) {
        Long id = checkTarget(me, targetId);
        memberMuteRepository.deleteRelation(me.id(), id);
        return new MuteResponse(id, false);
    }

    private Long checkTarget(AuthenticatedMember me, Long targetId) {
        if (me.id().equals(targetId)) {
            throw new SelfMuteNotAllowedException();
        }
        return memberRepository.findById(targetId)
                .filter(m -> !WITHDRAWN.equals(m.getMemberStatus()) && m.getDeletedAt() == null)
                .orElseThrow(MemberNotFoundException::new)
                .getId();
    }
}
```

</details>

<details>
<summary>JPA / Repository</summary>

`PostRepository.java`, `MemberMuteRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.


```java
// 12-5 피드 — 작성자가 나이거나 내가 팔로우하는 회원인 게시된 글. 차단 관계(어느 쪽이든)와 내가 뮤트한 회원의 글은 뺀다.
    // 팔로워 공개 글은 따로 걸지 않는다 — 작성자가 나 또는 팔로잉뿐이라 저절로 볼 수 있다.
    // 키셋 커서 (published_at, id). 작성자는 함께 읽고 태그는 batch fetch(2-4)가 묶어 읽는다.
    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author a
            WHERE p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (a.id = :me OR EXISTS (SELECT 1 FROM Follow f WHERE f.follower.id = :me AND f.followee = a))
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                              WHERE (b.blocker.id = :me AND b.blocked = a) OR (b.blocked.id = :me AND b.blocker = a))
              AND NOT EXISTS (SELECT 1 FROM MemberMute m WHERE m.muter.id = :me AND m.muted = a)
              AND (
                   :cursorAt IS NULL
                   OR p.publishedAt < :cursorAt
                   OR (p.publishedAt = :cursorAt AND p.id < :cursorId)
              )
            ORDER BY p.publishedAt DESC, p.id DESC
            """)
    List<Post> findFeed(@Param("me") Long me,
                        @Param("cursorAt") LocalDateTime cursorAt,
                        @Param("cursorId") Long cursorId,
                        Pageable pageable);
}
package org.example.social;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface MemberMuteRepository extends JpaRepository<MemberMute, Long> {

    // 이미 있으면 0행 — 멱등(12-4 팔로우와 같은 방법)
    @Modifying
    @Query(value = "INSERT IGNORE INTO member_mute (muter_id, muted_id, created_at) VALUES (:muterId, :mutedId, :now)",
            nativeQuery = true)
    int insertIgnore(@Param("muterId") Long muterId, @Param("mutedId") Long mutedId, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM MemberMute m WHERE m.muter.id = :muterId AND m.muted.id = :mutedId")
    int deleteRelation(@Param("muterId") Long muterId, @Param("mutedId") Long mutedId);
}
```

</details>

<details>
<summary>Entity</summary>

`MemberMute.java`: 컬럼·관계 매핑을 DB 테이블과 대조한다.


```java
package org.example.social;

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

import java.time.LocalDateTime;

// 뮤트(V32) — muter의 피드(12-5)에서만 muted의 글을 뺀다. 저장은 INSERT IGNORE(리포지토리)로 한다
@Entity
@Table(name = "member_mute")
public class MemberMute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muter_id", nullable = false)
    private Member muter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "muted_id", nullable = false)
    private Member muted;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected MemberMute() {
        // JPA
    }

    public Long getId() {
        return id;
    }

    public Member getMuter() {
        return muter;
    }

    public Member getMuted() {
        return muted;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
```

</details>

<details>
<summary>Flyway / SQL</summary>

`V32__create_member_mute.sql`: DDL·백필 순서를 스키마 계약과 대조한다.


```sql
-- V32 — 뮤트(12-5). "이 사람 글을 내 피드에서만 안 보기". 차단(member_block)과 달리 상대는 모르고,
-- 글 상세·게시판 목록·댓글에는 아무 영향이 없다. 한 사람이 같은 사람을 두 번 뮤트할 수 없다(UNIQUE).
CREATE TABLE member_mute (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    muter_id   BIGINT   NOT NULL,
    muted_id   BIGINT   NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_member_mute (muter_id, muted_id),
    KEY ix_member_mute_muted (muted_id),
    CONSTRAINT fk_member_mute_muter FOREIGN KEY (muter_id) REFERENCES member (id),
    CONSTRAINT fk_member_mute_muted FOREIGN KEY (muted_id) REFERENCES member (id),
    CONSTRAINT ck_member_mute_self CHECK (muter_id <> muted_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '뮤트 — muter의 피드에서 muted의 글을 뺀다';
```

</details>
<details>
<summary>MyBatis Mapper — 피드·뮤트 SQL 대체 구현</summary>

정답의 **MyBatis 대체 구현 코드** 토글에서 `FeedPostMapper.java`·`FeedPostMapper.xml`·`MuteCommandMapper.java`·`MuteCommandMapper.xml`과 교체한 Service 전문을 볼 수 있다. 피드의 목록 행은 `PostListRow`에, 태그는 `PostTagRow`에 매핑한다. 글은 `size+1`개만 읽고 태그는 화면에 보여 줄 글 ID를 한 번에 읽는다.


```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.post.FeedPostMapper">
    <select id="findFeed" resultType="org.example.post.PostListRow">
        SELECT p.id, p.title, p.excerpt,
               a.id AS author_id, a.nickname AS author_nickname,
               p.like_count, p.comment_count, p.view_count, p.published_at
        FROM post p JOIN member a ON a.id = p.author_id
        WHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED'
          AND (a.id = #{me} OR EXISTS (
              SELECT 1 FROM follow f WHERE f.follower_id = #{me} AND f.followee_id = a.id))
          AND NOT EXISTS (
              SELECT 1 FROM member_block b
              WHERE (b.blocker_id = #{me} AND b.blocked_id = a.id)
                 OR (b.blocked_id = #{me} AND b.blocker_id = a.id))
          AND NOT EXISTS (
              SELECT 1 FROM member_mute m WHERE m.muter_id = #{me} AND m.muted_id = a.id)
        <if test="cursorAt != null">
          AND (p.published_at &lt; #{cursorAt}
               OR (p.published_at = #{cursorAt} AND p.id &lt; #{cursorId}))
        </if>
        ORDER BY p.published_at DESC, p.id DESC LIMIT #{limit}
    </select>
    <select id="findTagsByPostIds" resultType="org.example.post.PostTagRow">
        SELECT pt.post_id, t.name
        FROM post_tag pt JOIN tag t ON t.id = pt.tag_id
        WHERE pt.post_id IN
        <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
        ORDER BY t.name
    </select>
</mapper>
```


```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.social.MuteCommandMapper">
    <insert id="insertIgnore">
        INSERT IGNORE INTO member_mute (muter_id, muted_id, created_at)
        VALUES (#{muterId}, #{mutedId}, #{now})
    </insert>
    <delete id="deleteRelation">
        DELETE FROM member_mute WHERE muter_id = #{muterId} AND muted_id = #{mutedId}
    </delete>
</mapper>
```


</details>


## 직접 확인

회원 6(`tok-p06`)은 회원 7만 팔로우한다. 회원 6의 글은 145(공개)·91(팔로워 공개)·83(임시저장), 회원 7의 글은 101·44다.

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-p06'
ids() { python3 -c 'import sys,json; d=json.load(sys.stdin); print([i["id"] for i in d["items"]], d["nextCursor"])'; }

curl -s -X DELETE "$BASE/api/members/7/mute" -H "$H"; echo           # 처음 상태로
curl -s "$BASE/api/me/feed?size=2" -H "$H" | ids                       # A1 [145, 101] + 커서
curl -s "$BASE/api/me/feed?size=2&cursor=<A1의 nextCursor>" -H "$H" | ids   # A2 [91, 44] None
curl -s -X PUT "$BASE/api/members/7/mute" -H "$H"; echo              # M 뮤트
curl -s "$BASE/api/me/feed" -H "$H" | ids                              # B [145, 91] — 7의 글이 빠짐
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/44" -H "$H"   # D 200 — 상세는 그대로
curl -s -X DELETE "$BASE/api/members/7/mute" -H "$H"; echo           # U 다시 보기
curl -s "$BASE/api/me/feed" -H "$H" | ids                              # C [145, 101, 91, 44]
for q in 'size=0' 'size=51' 'size=abc' 'cursor=abc'; do curl -s -o /dev/null -w "$q → %{http_code}\n" "$BASE/api/me/feed?$q" -H "$H"; done   # 모두 400
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 끝에서 뮤트를 풀므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "X", "title": "처음 상태로(뮤트 풀기)", "method": "DELETE", "path": "/api/members/7/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "A1", "title": "피드 첫 묶음", "method": "GET", "path": "/api/me/feed?size=2", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "A2", "title": "피드 다음 묶음", "method": "GET", "path": "/api/me/feed?size=2&cursor={{A1.body.nextCursor}}", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "M", "title": "회원 7 뮤트", "method": "PUT", "path": "/api/members/7/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "M2", "title": "또 뮤트", "method": "PUT", "path": "/api/members/7/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "B", "title": "뮤트 뒤 피드", "method": "GET", "path": "/api/me/feed", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "D", "title": "뮤트한 회원의 글 상세", "method": "GET", "path": "/api/posts/44", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "U", "title": "뮤트 풀기", "method": "DELETE", "path": "/api/members/7/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "C", "title": "푼 뒤 피드", "method": "GET", "path": "/api/me/feed", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "MS", "title": "자기 자신 뮤트", "method": "PUT", "path": "/api/members/6/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "MN", "title": "없는 회원 뮤트", "method": "PUT", "path": "/api/members/99999999/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "MX", "title": "id가 숫자 아님", "method": "PUT", "path": "/api/members/abc/mute", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "S0", "title": "size=0", "method": "GET", "path": "/api/me/feed?size=0", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "S51", "title": "size=51", "method": "GET", "path": "/api/me/feed?size=51", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "SX", "title": "size가 숫자 아님", "method": "GET", "path": "/api/me/feed?size=abc", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "SE", "title": "빈 size", "method": "GET", "path": "/api/me/feed?size=", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "CE", "title": "빈 cursor", "method": "GET", "path": "/api/me/feed?cursor=", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "CX", "title": "깨진 커서", "method": "GET", "path": "/api/me/feed?cursor=abc", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "S1", "title": "size=1", "method": "GET", "path": "/api/me/feed?size=1", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "S50", "title": "size=50", "method": "GET", "path": "/api/me/feed?size=50", "headers": { "Authorization": "Bearer tok-p06" } },
    { "id": "NT", "title": "토큰 없이 피드", "method": "GET", "path": "/api/me/feed" }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        { "request": "A1", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [145, 101] }, { "path": "$.items[1].author", "equals": { "id": 7, "nickname": "리액트에서왔어요" } }, { "path": "$.items[0].excerpt", "type": "string" }, { "path": "$.nextCursor", "type": "string" }] } },
        { "request": "A2", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [91, 44] }, { "path": "$.nextCursor", "type": "null" }] } }
      ]
    },
    {
      "id": "C2",
      "all": [
        { "request": "M", "expect": { "status": 200, "json": [{ "path": "$", "equals": { "memberId": 7, "muted": true } }] } },
        { "request": "M2", "expect": { "status": 200, "json": [{ "path": "$", "equals": { "memberId": 7, "muted": true } }] } },
        { "request": "B", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [145, 91] }, { "path": "$.nextCursor", "type": "null" }] } }
      ]
    },
    {
      "id": "C3",
      "all": [
        { "request": "D", "expect": { "status": 200 } },
        { "request": "U", "expect": { "status": 200, "json": [{ "path": "$", "equals": { "memberId": 7, "muted": false } }] } },
        { "request": "C", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [145, 101, 91, 44] }] } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "MS", "expect": { "status": 400 } },
        { "request": "MN", "expect": { "status": 404 } },
        { "request": "MX", "expect": { "status": 400 } },
        { "request": "S0", "expect": { "status": 400 } },
        { "request": "S51", "expect": { "status": 400 } },
        { "request": "SX", "expect": { "status": 400 } },
        { "request": "CX", "expect": { "status": 400 } },
        { "request": "SE", "expect": { "status": 400 } },
        { "request": "CE", "expect": { "status": 400 } },
        { "request": "S1", "expect": { "status": 200, "json": [{ "path": "$.items[*].id", "equals": [145] }] } },
        { "request": "S50", "expect": { "status": 200 } },
        { "request": "NT", "expect": { "status": 401 } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | A1 / A2 | `145, 101`(항목은 게시판 목록 모양 — 작성자·요약) + 커서 / `91, 44`, `nextCursor`=null — 팔로워 공개 글(91)이 들어 있고 임시저장(83)은 없다 |
| C2 | M / M2 / B | 뮤트 `{memberId: 7, muted: true}` 두 번 다 같다 / 피드가 `145, 91` — 7의 글만 빠졌다 |
| C3 | D / U / C | 뮤트한 회원의 글 상세는 `200`(차단과 다르다) / 풀기 `muted: false` / 피드가 다시 `145, 101, 91, 44` |
| C4 | MS·MN·MX / S0·S51·SX·SE·CX·CE / S1·S50 / NT | 자기 자신 `400`·없는 회원 `404`·숫자 아님 `400` / 범위 밖·숫자 아님·깨진 커서 `400` / 경계 안쪽 `200` / 토큰 없음 `401` — 어느 것도 `500`이 아니다 |
| D1 | `SELECT COUNT(*) FROM member_mute WHERE muter_id = 6` | `0` — 끝에서 풀었다 |
| D2 | `SELECT p.id FROM post p WHERE p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND (p.author_id = 6 OR p.author_id IN (SELECT followee_id FROM follow WHERE follower_id = 6)) ORDER BY p.published_at DESC, p.id DESC` | `145 101 91 44` — C3과 같다 |
| R1 | 쿼리 한 번 | 팔로잉 목록을 읽어 회원마다 글을 따로 조회하지 않고, 팔로우·차단·뮤트 조건을 `EXISTS`/`NOT EXISTS`로 넣은 쿼리 하나 + 태그 묶음 조회로 끝낸다(T-012 R1과 같다) |
| R2 | 뮤트의 범위 | 뮤트 조건이 피드 쿼리에만 있고 `PostAccessPolicy`(상세·목록 공용 규칙)에는 없다. 넣으면 무엇이 깨지는지(상세 404 → 상대가 눈치챔) 말할 수 있다 |
| R3 | 차단은 따로 | 내가 팔로우한 뒤 상대가 나를 차단할 수 있으므로 피드에도 차단 조건이 필요하다(12-4가 새 팔로우는 막지만 이미 있는 관계는 남는다) |
| R4 | 인덱스 | `NOT EXISTS (SELECT 1 FROM member_mute WHERE muter_id = ? AND muted_id = 작성자)`가 `uk_member_mute`를 탄다는 것을 `EXPLAIN`으로 확인했다 |

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../../docs/knowledge/W15-paging-offset-vs-cursor.md)
- [R04 SQL CRUD와 JOIN](../../docs/knowledge/R04-sql-crud-join.md) — `EXISTS`·`NOT EXISTS`
- [G2 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 뮤트를 왜 여기에 넣지 않나(R2)
- [J1 EXPLAIN 읽기](../../lessons/J1-reading-explain.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 피드 쿼리</summary>

```sql
WHERE p.deletedAt IS NULL AND p.status = 'PUBLISHED'
  AND (a.id = :me OR EXISTS (SELECT 1 FROM Follow f WHERE f.follower.id = :me AND f.followee = a))
  AND NOT EXISTS (SELECT 1 FROM MemberBlock b WHERE (b.blocker.id = :me AND b.blocked = a) OR (b.blocked.id = :me AND b.blocker = a))
  AND NOT EXISTS (SELECT 1 FROM MemberMute m WHERE m.muter.id = :me AND m.muted = a)
  AND (:cursorAt IS NULL OR p.publishedAt < :cursorAt OR (p.publishedAt = :cursorAt AND p.id < :cursorId))
ORDER BY p.publishedAt DESC, p.id DESC
```

`JOIN FETCH p.author a`로 작성자를 함께 읽고, `PageRequest.of(0, size + 1)`.
</details>

<details>
<summary>힌트 2 — 뮤트 API</summary>

12-4 팔로우 코드를 거의 그대로 쓴다. `member_mute`에 `INSERT IGNORE`/`DELETE`, 차단 확인은 빼고, 응답은 `{memberId, muted}`.
</details>

## 다음 단계

[12-6. 신고하기](12-6-report.md)
