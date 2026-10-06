# 4-2. 동시에 눌러도 맞는 like_count

## 상황

인기 글에 좋아요가 몰리면, 4-1처럼 만든 코드에서도 숫자가 틀어지는 경우가 많다. 두 요청이 동시에 `like_count`를 읽고(5) 각자 +1 해서(6) 저장하면, 좋아요는 둘인데 숫자는 하나만 오른다(**갱신 손실**). 같은 사람이 동시에 두 번 누르면 "있나?" 확인을 둘 다 통과한 뒤 INSERT가 두 번 일어나 중복 키 오류(500)가 나기도 한다.

**동시에 와도 `like_count` = 실제 좋아요 행 수**가 되게 고치고, 이를 테스트로 재현·고정한다.

## 만들 것

1. 4-1의 API를 그대로 두고 동시성 문제를 고친다.
   - 서로 다른 회원 20명이 동시에 PUT → 모두 `200`, `like_count`는 정확히 그만큼 오른다.
   - 같은 회원이 동시에 5번 PUT → 모두 `200`(500 금지), 행은 1개.
2. 테스트 클래스 **`LikeConcurrencyTest`** 를 만든다(이름 그대로).
   - 여러 스레드(`ExecutorService` + `CountDownLatch`)로 같은 글에 동시에 좋아요를 보낸다.
   - 끝난 뒤 `like_count`와 `post_like` 행 수가 같다고 단언한다.
   - 테스트 DB에는 동시성용 회원 7~26번과 토큰(`tok-c01`~`tok-c20`)이 있다.

16번 글(이스프링의 "자유글 05")을 채점에 쓴다. 이 글의 좋아요는 처음에 0개다.

## 직접 확인

```bash
BASE=http://localhost:8080
# 20명이 동시에 좋아요
for i in $(seq -w 1 20); do curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/posts/16/like" -H "Authorization: Bearer tok-c$i" & done; wait     # P1
# 같은 사람이 동시에 5번
for i in 1 2 3 4 5; do curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/posts/16/like" -H 'Authorization: Bearer tok-c01' & done; wait      # P2
# 20명이 동시에 취소
for i in $(seq -w 1 20); do curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/posts/16/like" -H "Authorization: Bearer tok-c$i" & done; wait  # P3

./gradlew test --tests '*LikeConcurrencyTest'                                                                                                              # P4
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
</details>

<details>
<summary>힌트 2 — 테스트 뼈대</summary>

`ExecutorService pool = Executors.newFixedThreadPool(20); CountDownLatch ready = new CountDownLatch(1), done = new CountDownLatch(20);` 각 작업은 `ready.await()` 후 서비스(또는 MockMvc)를 호출하고 `done.countDown()`. 모두 제출한 뒤 `ready.countDown()`으로 동시에 출발시키고 `done.await()`.
</details>

## 다음 단계

[4-3. 내가 좋아요한 글](4-3-my-likes.md)
