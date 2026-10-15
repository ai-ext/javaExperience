# 4-2. 동시에 눌러도 맞는 like_count

## 상황

인기 글에 좋아요가 몰리면, 4-1처럼 만든 코드에서도 숫자가 틀어지는 경우가 많다. 두 요청이 동시에 `like_count`를 읽고(5) 각자 +1 해서(6) 저장하면, 좋아요는 둘인데 숫자는 하나만 오른다(**갱신 손실**). 같은 사람이 동시에 두 번 누르면 "있나?" 확인을 둘 다 통과한 뒤 INSERT가 두 번 일어나 중복 키 오류(500)가 나기도 한다.

**동시에 와도 `like_count` = 실제 좋아요 행 수**가 되게 고치고, 이를 테스트로 재현·고정한다.



## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

<section class="like-race-story" aria-labelledby="like-race-title">
  <div class="like-race-heading">
    <span class="like-race-kicker">설명용 장면 · 실제 글 16의 초기값은 0</span>
    <div class="like-race-title" id="like-race-title" role="heading" aria-level="2">두 번 눌렀는데, 왜 숫자는 한 번만 늘었을까요?</div>
    <p>서로 다른 두 회원이 같은 글을 누릅니다. 아래의 5는 원리를 보여 주기 위한 값입니다.</p>
  </div>
  <div class="like-race-post" aria-label="예시 게시글의 시작 좋아요 수"><span>게시글 · 첫 글</span><strong>♥ <span>5</span></strong></div>
  <div class="like-race-timeline" role="group" aria-label="읽고 더한 값을 저장할 때의 네 순간">
    <div class="like-race-timeline-head" aria-hidden="true"><span>시간</span><span>요청 A</span><span>DB like_count</span><span>요청 B</span></div>
    <div class="like-race-moment" id="like-race-t1"><span class="like-race-time">t1</span><span class="like-race-action a">5 읽기 → 6 계산</span><span class="like-race-db">5</span><span class="like-race-quiet">대기</span></div>
    <div class="like-race-moment" id="like-race-t2"><span class="like-race-time">t2</span><span class="like-race-quiet">아직 저장 전</span><span class="like-race-db">5</span><span class="like-race-action b">5 읽기 → 6 계산</span></div>
    <div class="like-race-moment" id="like-race-t3"><span class="like-race-time">t3</span><span class="like-race-action a">6 저장</span><span class="like-race-db changed">6</span><span class="like-race-quiet">저장 전</span></div>
    <div class="like-race-moment is-loss" id="like-race-t4"><span class="like-race-time">t4</span><span class="like-race-quiet">완료</span><span class="like-race-db changed">6</span><span class="like-race-action b">6 저장 · A의 증가분 덮음</span></div>
  </div>
  <div class="like-race-result"><div><small>두 명이 눌렀으니</small><strong>기대 7</strong></div><div><small>읽고 +1 저장하면</small><strong>실제 6</strong></div><p>두 요청이 모두 처음 값 5를 읽었기 때문에 두 번째 저장이 첫 번째 증가를 잃게 합니다.</p></div>
  <div class="like-race-fix"><div><span class="like-race-kicker">고치는 방법 1 · 서로 다른 회원</span><h3>더하기를 DB에서 한 번에</h3><p><code>UPDATE post SET like_count = like_count + 1 WHERE id = 16</code></p><div class="like-race-fixed-path" aria-label="각 원자 갱신이 DB의 현재 값에 더함"><span>요청 A</span><span>DB 5 → 6</span><span>요청 B</span><span>DB 6 → 7</span></div></div><div><span class="like-race-kicker">고치는 방법 2 · 같은 회원 연타</span><h3>중복 행도 막아야 합니다</h3><p><code>UNIQUE(post_id, member_id)</code>로 한 회원의 좋아요 행을 하나만 허용하고, 중복 시도는 이미 좋아요한 상태로 응답합니다.</p></div></div>
  <p class="like-race-caveat">원자 UPDATE만으로 기능이 완성되지는 않습니다. 좋아요 행 INSERT의 성공 여부에 따라 카운트를 갱신하고, 트랜잭션·중복 키·교착 재시도를 함께 검증합니다.</p>
  <a class="like-race-next" href="#만들-것">이제 20명 동시 요청의 완료 기준 보기 →</a>
</section>

```screen
{
  "title": "인기 글에 좋아요가 몰릴 때",
  "summary": "20명이 거의 같은 순간에 누른다. 숫자가 실제 좋아요 수와 같아야 한다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 보기"
    },
    {
      "type": "text",
      "id": "post-title",
      "value": "자유글 05",
      "emphasis": "title"
    },
    {
      "type": "stats",
      "id": "post-stats",
      "items": [
        {
          "id": "likes",
          "label": "좋아요",
          "value": "♥ 20"
        }
      ]
    },
    {
      "type": "text",
      "id": "note",
      "value": "20명이 1초 안에 눌렀다",
      "emphasis": "caption",
      "tone": "muted"
    },
    {
      "type": "code",
      "id": "race",
      "label": "고치기 전 — 갱신 손실",
      "value": "요청 A: like_count 읽음(5) → 6으로 저장\n요청 B: like_count 읽음(5) → 6으로 저장   ← A를 덮어씀\n좋아요는 2개인데 숫자는 1만 올랐다"
    }
  ],
  "flows": [
    {
      "name": "20명이 동시에",
      "steps": [
        {
          "kind": "user",
          "text": "20명이 같은 순간 하트를 누른다",
          "focus": [
            "likes"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/16/like",
          "headers": [
            "Authorization: Bearer tok-c01 … tok-c20 (20개 요청)"
          ]
        },
        {
          "kind": "server",
          "text": "고치기 전: 각 요청이 엔티티를 읽고 +1 해서 저장 → 서로 덮어써 숫자가 모자란다"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET like_count = like_count + 1 WHERE id = 16",
          "note": "고친 뒤: DB가 한 번에 더한다 — 읽고 쓰기 사이에 끼어들 틈이 없다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"postId\": 16, \"liked\": true, \"likeCount\": …} × 20"
        },
        {
          "kind": "screen",
          "text": "숫자 20 = 좋아요 행 20개",
          "focus": [
            "likes",
            "race"
          ]
        }
      ]
    },
    {
      "name": "같은 사람이 연타 5번",
      "steps": [
        {
          "kind": "user",
          "text": "한 사람이 하트를 아주 빠르게 5번 누른다(취소 없이 PUT 5번)"
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/16/like",
          "headers": [
            "Authorization: Bearer tok-c01 (5개 요청)"
          ]
        },
        {
          "kind": "server",
          "text": "다섯 요청이 동시에 '아직 없음'을 확인하고 모두 INSERT를 시도 → UNIQUE(post_id, member_id)가 하나만 받아들인다"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post_like ... -- 4개는 Duplicate entry",
          "note": "중복 키 오류를 '이미 좋아요'로 처리해 500을 내지 않는다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"liked\": true, ...} × 5"
        },
        {
          "kind": "screen",
          "text": "행은 1개, 응답은 모두 200",
          "focus": [
            "likes"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

1. 4-1의 API를 그대로 두고 동시성 문제를 고친다.
   - 서로 다른 회원 20명이 동시에 PUT → 모두 `200`, `like_count`는 정확히 그만큼 오른다.
   - 같은 회원이 동시에 5번 PUT → 모두 `200`(500 금지), 행은 1개.
2. 테스트 클래스 **`LikeConcurrencyTest`** 를 만든다(이름 그대로).
   - 여러 스레드(`ExecutorService` + `CountDownLatch`)로 같은 글에 동시에 좋아요를 보낸다.
   - 끝난 뒤 `like_count`와 `post_like` 행 수가 같다고 단언한다.
   - 테스트 DB에는 동시성용 회원 7~26번과 토큰(`tok-c01`~`tok-c20`)이 있다.

16번 글(이스프링의 "자유글 05")을 채점에 쓴다. 이 글의 좋아요는 처음에 0개다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 고치기 전: 각 요청이 엔티티를 읽고 +1 해서 저장 → 서로 덮어써 숫자가 모자란다
- 고친 뒤: DB가 한 번에 더한다 — 읽고 쓰기 사이에 끼어들 틈이 없다
- 다섯 요청이 동시에 '아직 없음'을 확인하고 모두 INSERT를 시도 → UNIQUE(post_id, member_id)가 하나만 받아들인다
- 중복 키 오류를 '이미 좋아요'로 처리해 500을 내지 않는다

<details>
<summary>Service — 처리 순서</summary>

`LikeService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `like`, `unlike`.

`like`와 `unlike` 모두 새 트랜잭션에서 실행하고, 교착으로 롤백된 요청만 새 트랜잭션으로 재시도한다. 같은 트랜잭션 안에서 오류 뒤 SQL만 재실행하면 이미 롤백 전용이어서 실패한다.

```java
public LikeResponse like(Long postId, AuthenticatedMember me) {
    return withDeadlockRetry(() ->
        transactionTemplate.execute(status -> doLike(postId, me)));
}

private LikeResponse doLike(Long postId, AuthenticatedMember me) {
    Post post = findLikeablePost(postId, me);
    if (post.getAuthor().getId().equals(me.id())) throw new SelfLikeNotAllowedException();
    int inserted = postLikeRepository.insertIgnore(postId, me.id());
    if (inserted > 0) postRepository.incrementLikeCount(postId);
    return new LikeResponse(postId, true, postRepository.findLikeCountById(postId));
}
```

DELETE도 실제 삭제 행 수가 1일 때만 `decrementLikeCount`를 호출한다. DB에서 다시 읽은 숫자로 DTO를 만든다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostLikeRepository.java`, `PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

```java
@Modifying
@Query(value = "INSERT IGNORE INTO post_like (post_id, member_id, created_at) " +
               "VALUES (:postId, :memberId, NOW())", nativeQuery = true)
int insertIgnore(@Param("postId") Long postId, @Param("memberId") Long memberId);

@Modifying
@Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :id")
int incrementLikeCount(@Param("id") Long id);
```

`INSERT IGNORE`의 결과 0은 이미 관계가 있다는 뜻이다. 1일 때만 숫자를 증가시킨다. `likeCount`를 엔티티에서 읽어 `+1` 후 저장하면 갱신 손실이 다시 생긴다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

좋아요 숫자 변경은 위 Repository의 원자적 UPDATE가 맡는다. `Post` 엔티티의 기존 증가 메서드를 이 동시성 경로에서 호출하지 않는다.

</details>

<details>
<summary>테스트 — 계약 확인</summary>

`LikeConcurrencyTest.java`. 테스트 요청과 기대값을 **직접 확인** 및 채점 기준과 대조한다.

여러 스레드가 출발 신호를 기다린 뒤 같은 글에 요청하고, 모두 끝난 다음 `post_like` 행 수와 `like_count`를 비교한다. 테스트 메서드에 `@Transactional`을 붙이면 요청별 실제 커밋 경계를 재현하기 어려우므로 붙이지 않는다.

</details>

<details>
<summary>MyBatis / Mapper — 중복 삽입 방지와 원자적 숫자 갱신</summary>

`MyBatisLikeService`도 `TransactionTemplate`로 두 쓰기를 묶고 교착 시 새 트랜잭션에서 재시도한다. `insertIgnoreLike`가 1을 돌려준 요청만 `increaseLikeCount`를 실행한다. DELETE는 `deleteLike`가 1을 돌려준 요청만 `decreaseLikeCount`를 실행한다.

```xml
<insert id="insertIgnoreLike">
  INSERT IGNORE INTO post_like(post_id, member_id, created_at)
  VALUES (#{postId}, #{memberId}, CURRENT_TIMESTAMP)
</insert>
<update id="increaseLikeCount">
  UPDATE post SET like_count = like_count + 1 WHERE id = #{postId}
</update>
```

두 경로 모두 새 SELECT로 저장된 `like_count`를 응답한다. 실행 가능한 Mapper Java/XML·Service·Controller·동시성 테스트 파일 전문은 아래 MyBatis 역할별 코드 접기에 있다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정하고, HTTP 요청은 아래 실행 패널에서 순서대로 보낸다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

```bash
# 20명이 동시에 좋아요
# 같은 사람이 동시에 5번
# 20명이 동시에 취소

./gradlew test --tests '*LikeConcurrencyTest'                                                                                                              # P4

```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "P1",
      "title": "P1 20명이 동시에 좋아요",
      "method": "PUT",
      "path": "/api/posts/16/like",
      "headers": {
        "Authorization": "Bearer {{tok}}"
      },
      "concurrent": {
        "count": 20,
        "vars": {
          "tok": [
            "tok-c01",
            "tok-c02",
            "tok-c03",
            "tok-c04",
            "tok-c05",
            "tok-c06",
            "tok-c07",
            "tok-c08",
            "tok-c09",
            "tok-c10",
            "tok-c11",
            "tok-c12",
            "tok-c13",
            "tok-c14",
            "tok-c15",
            "tok-c16",
            "tok-c17",
            "tok-c18",
            "tok-c19",
            "tok-c20"
          ]
        }
      }
    },
    {
      "id": "P2",
      "title": "P2 같은 사람(tok-c01)이 동시에 5번",
      "method": "PUT",
      "path": "/api/posts/16/like",
      "headers": {
        "Authorization": "Bearer tok-c01"
      },
      "concurrent": {
        "count": 5
      }
    },
    {
      "id": "P3",
      "title": "P3 20명이 동시에 취소",
      "method": "DELETE",
      "path": "/api/posts/16/like",
      "headers": {
        "Authorization": "Bearer {{tok}}"
      },
      "concurrent": {
        "count": 20,
        "vars": {
          "tok": [
            "tok-c01",
            "tok-c02",
            "tok-c03",
            "tok-c04",
            "tok-c05",
            "tok-c06",
            "tok-c07",
            "tok-c08",
            "tok-c09",
            "tok-c10",
            "tok-c11",
            "tok-c12",
            "tok-c13",
            "tok-c14",
            "tok-c15",
            "tok-c16",
            "tok-c17",
            "tok-c18",
            "tok-c19",
            "tok-c20"
          ]
        }
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "P1",
      "expect": {
        "status": 200
      }
    },
    {
      "id": "C2",
      "request": "P2",
      "expect": {
        "status": 200
      }
    },
    {
      "id": "C3",
      "request": "P3",
      "expect": {
        "status": 200
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | P1 | 20개 모두 `200` |
| D1 | P1 뒤 `SELECT like_count, (SELECT COUNT(*) FROM post_like WHERE post_id = 16) FROM post WHERE id = 16` | 두 값이 같고 `20` |
| C2 | P2 | 5개 모두 `200`(500이 하나도 없다) |
| D2 | P2 뒤 `SELECT COUNT(*) FROM post_like WHERE post_id = 16 AND member_id = 7` | `1` |
| C3 | P3 | 20개 모두 `200` |
| D3 | P3 뒤 D1과 같은 쿼리 | 두 값이 같고 `0` |
| T1 | P4 | 통과 |
| R1 | 숫자 갱신 | `like_count`를 "읽고 +1 해서 저장"하지 않고, `UPDATE post SET like_count = like_count + 1`처럼 DB에서 한 번에 바꾸거나 락(비관적·낙관적)을 쓴다. 고른 방법의 장단점을 설명할 수 있다 |
| R2 | 중복 행 | 동시에 같은 회원이 눌렀을 때 UNIQUE 위반을 잡아 "이미 좋아요"로 처리하거나, INSERT를 중복에 안전하게(`INSERT IGNORE` 등) 한다 |
| R3 | 테스트 | 스레드를 **동시에 출발**시킨다(`CountDownLatch`로 대기 후 한꺼번에). 고치기 전 코드에서 이 테스트가 실패하는 것을 확인했다 |
| R4 | 트랜잭션 | 테스트 메서드에 `@Transactional`을 붙이지 않았다(붙이면 다른 스레드가 커밋 전 데이터를 못 본다) |

## 필요한 지식

- [P18 — 문제는 읽기 → 판단 → 쓰기가 분리될 때 생긴다](../../docs/knowledge/P18-concurrency-inventory.md#21-문제는-읽기--판단--쓰기가-분리될-때-생긴다)
- [P18 — 가장 싼 해결책: 조건부 원자 UPDATE](../../docs/knowledge/P18-concurrency-inventory.md#22-가장-싼-해결책-조건부-원자-update)
- [P18 — 낙관적 락은 충돌을 허용하고 재시도한다](../../docs/knowledge/P18-concurrency-inventory.md#24-낙관적-락은-충돌을-허용하고-재시도한다)
- [W25 스프링이 멀티스레드라는 것](../../docs/knowledge/W25-spring-multithreading.md)
- [V05 — 마지막 재고 한 개를 두 스레드가 구매](../../docs/knowledge/V05-testing-tricky-things.md#6단계--마지막-재고-한-개를-두-스레드가-구매) — 동시성 테스트 쓰는 법
- [V04 — `@Transactional` 함정을 재현](../../docs/knowledge/V04-test-db-strategy.md#4단계--transactional-함정을-재현)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 숫자</summary>

리포지토리에 `@Modifying @Query("update Post p set p.likeCount = p.likeCount + 1 where p.id = :id")`. 이 쿼리는 영속성 컨텍스트를 거치지 않으므로, 응답에 줄 최신 값은 다시 조회하거나 `clearAutomatically = true`를 쓴다.

서로 다른 회원 20명이 동시에 누르면 MySQL이 `post_like` 유니크 인덱스 삽입과 `post` 행 갱신 사이에서 **교착 상태**를 감지해 일부 트랜잭션을 되돌릴 수 있다(`Deadlock found ... try restarting transaction` → Spring의 `ConcurrencyFailureException`, 실측 20건 중 8건). 원자적 UPDATE만으로는 이걸 막지 못한다 — 트랜잭션 **밖**에서 짧게(예: 3번, 수십 ms 간격) 다시 시도한다.

재시도는 같은 트랜잭션 안에서 하면 안 된다(이미 롤백 표시가 붙었다). </details>

<details>
<summary>힌트 2 — 테스트 뼈대</summary>

`ExecutorService pool = Executors.newFixedThreadPool(20); CountDownLatch ready = new CountDownLatch(1), done = new CountDownLatch(20);` 각 작업은 `ready.await()` 후 서비스(또는 MockMvc)를 호출하고 `done.countDown()`. 모두 제출한 뒤 `ready.countDown()`으로 동시에 출발시키고 `assertThat(done.await(10, SECONDS)).isTrue()` — 시간 제한을 둔 `await`는 반환값을 꼭 단언한다(버리면 스레드가 다 안 끝났어도 테스트가 통과한다).

테스트 클래스에는 다른 통합 테스트(처음부터 있는 `HelloControllerTest`)와 같은 애너테이션(`@SpringBootTest` + `@AutoConfigureMockMvc`)을 붙인다 — MockMvc를 안 쓰더라도. 하나라도 다르면 스프링 컨텍스트가 따로 만들어지고, 같은 테스트 DB에 스키마 초기화가 다시 돌아 "Table already exists"로 실패한다.
</details>

## 다음 단계

[4-3. 내가 좋아요한 글](4-3-my-likes.md)
