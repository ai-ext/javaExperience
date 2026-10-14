# G1. 페이징과 정렬

> 개념 레슨 · 30분

## 이게 뭐냐

목록 API는 `GET …/posts?page=2`처럼 몇 쪽을 달라는 요청을 받고, 그 쪽의 글(`items`)과 전체 쪽 수(`totalPages`)를 돌려준다. 이 레슨은 그 응답을 **만드는 쪽**이다.

글이 수천 개여도 한 번에 다 보내지 않는다. 화면에 필요한 한 쪽만 잘라 보낸다. 서버가 하는 일은 셋이다.

1. **줄 세우기(정렬)** — 최신 글부터. 줄을 먼저 세워야 "몇 번째부터"라는 말이 성립한다.
2. **한 쪽 자르기** — "앞에서 10개 건너뛰고 5개".
3. **전체 개수 세기** — 페이지 번호를 그리려면 전체가 몇 개인지 알아야 한다.

### SQL에서는

| 하는 일 | SQL |
|---|---|
| 줄 세우기 | `ORDER BY published_at DESC, id DESC` |
| 한 쪽 자르기 | `LIMIT 5 OFFSET 10` — 10개 건너뛰고 5개 |
| 전체 개수 | `SELECT COUNT(*) ...` — **목록 쿼리와 따로** 한 번 더 |

`page`와 `size`로 `OFFSET`을 계산한다. **`page`는 0부터** 센다(Spring의 관례). 화면의 "1쪽"이 `page=0`이다.

```text
OFFSET     = page × size
totalPages = 전체 개수 ÷ size 를 올림
hasNext    = page + 1 < totalPages
```

### 왜 정렬에 `id`까지 넣나

`ORDER BY published_at DESC`만 쓰면, 같은 시각에 올라온 글끼리의 순서는 **MySQL 마음대로**다. 그 순서가 쿼리마다 달라질 수 있다. 그러면 1쪽과 2쪽에 같은 글이 나오거나, 어떤 글은 어느 쪽에도 안 나온다. 아래 "일부러 틀려 보기"에서 실제로 낸다.

그래서 정렬 끝에 **겹칠 수 없는 열**(`id`)을 하나 더 붙인다. 그러면 모든 행의 자리가 하나로 정해진다. 2-2의 정렬 규칙 "`published_at` 최신순, 같으면 `id` 큰 순"이 이것이다.

## 예시

### SQL로 한 쪽 자르기

`community` DB의 자유 게시판(`board_id = 4`)이다. [E2](E2-db-sql-basics.md)에서 만든 `sql` 함수(터미널)나 CloudBeaver로 실행한다. 아래는 처음 상태(시드) DB에서 실행한 그대로다.

```text
$ sql "SELECT id, title, published_at FROM post
       WHERE board_id = 4 AND status = 'PUBLISHED' AND deleted_at IS NULL
       ORDER BY published_at DESC, id DESC
       LIMIT 5 OFFSET 0"
+----+--------------+---------------------+
| id | title        | published_at        |
+----+--------------+---------------------+
| 21 | 자유글 10    | 2026-10-04 09:00:00 |
| 20 | 자유글 09    | 2026-10-03 09:00:00 |
| 19 | 자유글 08    | 2026-10-02 09:00:00 |
| 18 | 자유글 07    | 2026-10-01 09:00:00 |
| 17 | 자유글 06    | 2026-09-30 09:00:00 |
+----+--------------+---------------------+

$ sql "SELECT COUNT(*) FROM post
       WHERE board_id = 4 AND status = 'PUBLISHED' AND deleted_at IS NULL"
+----------+
| COUNT(*) |
+----------+
|       14 |
+----------+
```

- 목록과 개수는 **조건(`WHERE`)이 같아야** 한다. 한쪽만 고치면 "14개라더니 13개뿐" 같은 화면이 나온다.
- 14개를 5개씩이면 3쪽이다. 3쪽(`page=2`)은 `OFFSET 10`이다.

```text
$ sql "SELECT id, title, published_at FROM post
       WHERE board_id = 4 AND status = 'PUBLISHED' AND deleted_at IS NULL
       ORDER BY published_at DESC, id DESC
       LIMIT 5 OFFSET 10"
+----+----------------------------------+---------------------+
| id | title                            | published_at        |
+----+----------------------------------+---------------------+
|  9 | 차단 확인용 글                   | 2026-09-23 18:00:00 |
|  6 | [팔로워 공개] 이직 고민          | 2026-09-22 10:00:00 |
|  5 | 스터디원 구해요                  | 2026-09-21 10:00:00 |
|  4 | 주말 회고                        | 2026-09-20 10:00:00 |
+----+----------------------------------+---------------------+
```

마지막 쪽이라 4개뿐이다. 2-2의 채점 기준 C1(`21, 20, 19, 18, 17`)·C3(`9, 6, 5, 4`)과 같은 결과다. 이 SQL이 정답 모양이다.

### 계산만 떼어 보기

`OFFSET`·`totalPages`·`hasNext` 계산을 Java로 옮기면 이렇다. JDK 21 `jshell`에서 실행한 그대로다.

```java
record PageInfo(int page, int size, long totalElements) {
    long offset()     { return (long) page * size; }
    int totalPages()  { return (int) Math.ceil((double) totalElements / size); }
    boolean hasNext() { return page + 1 < totalPages(); }
}
```

```text
jshell> var first = new PageInfo(0, 5, 14)
first ==> PageInfo[page=0, size=5, totalElements=14]

jshell> first.totalPages()
$4 ==> 3

jshell> first.hasNext()
$5 ==> true

jshell> var last = new PageInfo(2, 5, 14)
last ==> PageInfo[page=2, size=5, totalElements=14]

jshell> last.offset()
$7 ==> 10

jshell> last.hasNext()
$8 ==> false
```

`(double)`로 바꾼 뒤 올림(`Math.ceil`)하는 이유: `14 / 5`를 정수끼리 나누면 `2`가 되어 마지막 4개짜리 쪽이 사라진다. (I1에서 이 실수를 테스트로 잡는다.)

### Spring Data JPA는 이걸 대신 해 준다

실제 코드에서는 위 계산을 직접 하지 않는다. `PageRequest`(몇 쪽·몇 개·정렬)를 저장소 메서드에 넘기면, Spring Data JPA가 `LIMIT`·`OFFSET`이 붙은 SQL과 `COUNT` SQL을 만들어 실행하고, 결과를 `Page`에 담아 준다.

```java
Pageable pageable = PageRequest.of(page, size,
        Sort.by(Sort.Direction.DESC, "publishedAt").and(Sort.by(Sort.Direction.DESC, "id")));
Page<Post> result = postRepository.findAll(pageable);

result.getContent();        // 이번 쪽의 글들
result.getTotalElements();  // 전체 개수(COUNT 결과)
result.getTotalPages();
result.hasNext();
```

이 레슨을 쓰면서 글 14개를 넣은 작은 Spring Boot 4.1 앱에서 `GET /g1/posts?page=0&size=5`를 부르니, 응답 한 번에 SQL이 두 번 나갔다(`org.hibernate.SQL` 로그를 `debug`로 켠 상태).

```text
select p1_0.id,p1_0.like_count,p1_0.published_at,p1_0.title from lab_post p1_0 order by p1_0.published_at desc,p1_0.id desc limit ?,?
select count(p1_0.id) from lab_post p1_0
```

- `limit ?,?`는 MySQL의 `LIMIT 건너뛸수, 가져올수` 표기다. `LIMIT 5 OFFSET 0`과 같다.
- 두 번째 줄이 전체 개수 쿼리다. 2-2 채점의 R2("전체 건수를 구하는 쿼리가 따로 있다는 것을 로그로 확인")가 이것이다.
- 같은 앱에서 마지막 쪽(`page=2&size=5`)을 부르면 **첫 줄만** 나왔다. 가져온 글이 `size`보다 적으면 그게 마지막 쪽이라 전체 개수를 계산으로 알 수 있어서, Spring Data가 `count`를 건너뛴다. 로그로 확인할 때는 첫 쪽으로 본다.

`Page`를 응답으로 그대로 내보내지는 않는다. `Page` 객체를 JSON으로 바꾸면 라이브러리가 정한 필드가 줄줄이 나가고, 라이브러리가 바뀌면 응답 모양도 바뀐다. 필요한 값만 꺼내 목록 전용 DTO(`items`·`page`·`size`·`totalElements`·`totalPages`·`hasNext`)에 담는다(2-2 R3).

## 따라 해 보기

10분.

**1. 쪽 넘기기.** 위 SQL을 `OFFSET 0`·`5`·`10`·`15`로 바꿔 가며 실행한다. `OFFSET 15`는 결과가 없다(터미널은 아무것도 안 찍고, CloudBeaver는 빈 표). 14개를 5개씩 자르면 4번째 쪽은 없다.

**2. 조건 하나 빼 보기.** 목록 쿼리에서 `AND deleted_at IS NULL`을 빼고 `LIMIT 20`으로 실행한다. 삭제된 8번 글이 끼어든다. 개수 쿼리에서도 같은 조건을 빼면 `15`가 된다. 목록과 개수의 조건이 어긋나면 화면이 틀어진다는 것을 눈으로 본다.

**3. 계산 확인.** `jshell`에 `PageInfo`를 붙여 넣고 `new PageInfo(1, 5, 14)`의 `offset()`·`hasNext()`를 예측한 뒤 실행한다. (`5`, `true`)

## 일부러 틀려 보기

**1. 정렬 열이 겹치게 만든다.** 테이블을 안 만들고 쿼리 안에서 가짜 글 30개를 만든다(`WITH RECURSIVE`는 1~30 숫자를 만드는 문법이다. 지금은 모양만 보면 된다). 3의 배수 번호 10개가 같은 날(`10-02`)에 올라왔다고 하고, 날짜로만 정렬해 5개씩 자른다.

```text
$ sql "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 30)
       SELECT i AS id, IF(i % 3 = 0, '2026-10-02', '2026-10-01') AS published_at
       FROM n ORDER BY published_at DESC LIMIT 5 OFFSET 0"
+------+--------------+
| id   | published_at |
+------+--------------+
|   15 | 2026-10-02   |
|    9 | 2026-10-02   |
|   24 | 2026-10-02   |
|   12 | 2026-10-02   |
|   30 | 2026-10-02   |
+------+--------------+
```

같은 쿼리를 `OFFSET 5`(2쪽)로 바꾼다.

```text
+------+--------------+
| id   | published_at |
+------+--------------+
|   24 | 2026-10-02   |
|    9 | 2026-10-02   |
|   27 | 2026-10-02   |
|    3 | 2026-10-02   |
|    6 | 2026-10-02   |
+------+--------------+
```

**`9`와 `24`가 1쪽과 2쪽에 모두 나온다.** 대신 `18`·`21`은 두 쪽 어디에도 없다. MySQL 8.0(studymate 컨테이너)에서 여러 번 돌려도 같은 결과였다. 버전이나 데이터가 다르면 다른 번호가 겹칠 수 있지만, "같은 값끼리의 순서는 정해져 있지 않다"는 점은 같다.

이제 `ORDER BY published_at DESC, id DESC`로 고쳐 두 쪽을 다시 본다.

```text
1쪽 → 30, 27, 24, 21, 18
2쪽 → 15, 12, 9, 6, 3
```

겹침도 빠짐도 없다. 실제 서비스에서는 같은 초에 글이 올라오는 일이 흔하다. 정렬 끝의 `id`는 장식이 아니다.

**2. 이상한 `page`·`size`를 넣는다.**

```text
jshell> new PageInfo(0, 0, 14).totalPages()
$11 ==> 2147483647
```

`size=0`이면 `14 / 0.0`이 무한대가 되고, `int`로 바꾸면 `int`의 최댓값이 된다. 페이지 번호를 21억 개 그리라는 응답이다. Spring의 `PageRequest`는 이런 값을 아예 거부한다.

```text
jshell> PageRequest.of(-1, 5)
|  Exception java.lang.IllegalArgumentException: Page index must not be less than zero

jshell> PageRequest.of(0, 0)
|  Exception java.lang.IllegalArgumentException: Page size must not be less than one
```

(Spring 라이브러리를 `jshell`에 연결해 실행한 결과에서 `at …` 줄을 뺐다. 맨 jshell에는 없는 클래스라 직접 따라 할 필요는 없다.)

거부해 주니 안전한 것 같지만, 이 예외를 그냥 두면 **`500`** 이 된다. 위의 작은 앱에 `?page=-1`을 보냈더니 실제로 `HTTP/1.1 500`과 함께 로그에 `java.lang.IllegalArgumentException: Page index must not be less than zero`가 남았다. 잘못 보낸 쪽은 클라이언트인데 서버 잘못(`500`)으로 답한 것이다. 그래서 2-2는 `page`가 음수이거나 `size`가 1~50 밖이면 **`400`** 을 요구한다. `PageRequest`를 만들기 **전에** 컨트롤러에서 범위를 검사한다(2-2 힌트 2의 `@Min`·`@Max`).

## 확인 문제

**1.** `page=3`, `size=10`이면 SQL의 `OFFSET`은? 화면에서는 몇 번째 글부터 보이나?

<details>
<summary>정답</summary>

**`OFFSET 30`**, 31번째 글부터 10개다. `page`가 0부터라 `page=3`은 화면의 "4쪽"이다.
</details>

**2.** 조건에 맞는 글이 20개, `size=10`이다. `page=1` 응답의 `totalPages`와 `hasNext`는?

<details>
<summary>정답</summary>

`totalPages = 2`, `hasNext = false`. `page=1`이 두 번째이자 마지막 쪽이다(`1 + 1 < 2`가 거짓). 딱 나누어떨어질 때 빈 3쪽을 만들지 않는지가 흔한 실수 지점이다.
</details>

**3.** 정렬을 `ORDER BY published_at DESC`로만 했다. 지금 시드 데이터에서는 채점이 통과한다. 그래도 `id`를 붙여야 하는 이유는?

<details>
<summary>정답</summary>

지금 시드에는 같은 `published_at`이 없어서 우연히 순서가 하나로 정해졌을 뿐이다. 같은 시각의 글이 생기면 그 글들끼리의 순서는 MySQL이 정해 주지 않아서, 쪽마다 같은 글이 겹치거나 빠질 수 있다(일부러 틀려 보기 1). 겹치지 않는 `id`를 끝에 붙이면 모든 행의 순서가 하나로 정해진다.
</details>

**4.** "어차피 글이 몇백 개뿐이니 `findAll()`로 전부 가져와 Java에서 `subList`로 자르자"는 의견이 나왔다. 무엇이 문제인가?

<details>
<summary>정답</summary>

요청마다 **모든 행**을 DB에서 읽어 메모리에 올린다. 글이 늘면 한 쪽(5개)을 보여 주려고 수만 개를 읽게 된다. 자르기(`LIMIT`)와 세기(`COUNT`)는 DB에 맡긴다. 2-3에서 "볼 수 있는 글만" 거를 때도 같다. 메모리에서 거르면 쪽 크기와 `totalElements`가 틀어진다(2-3 R3).
</details>

**5.** `?size=0`이 들어왔다. 서버는 몇 번 상태 코드로 답해야 하나? 아무 검사도 안 하고 `PageRequest.of(page, size)`에 넘기면 몇 번이 나가나?

<details>
<summary>정답</summary>

**`400`** 이어야 한다. 보낸 쪽이 고칠 수 있는 잘못이다. 검사 없이 넘기면 `PageRequest`가 `IllegalArgumentException`을 던지고, 아무도 안 잡으니 **`500`** 이 나간다. 범위 검사를 먼저 해서 `400`으로 돌려준다.
</details>

## 더 깊이

- [W15 페이징 — OFFSET vs 커서](../docs/knowledge/W15-paging-offset-vs-cursor.md) — 깊은 쪽에서 OFFSET이 느려지는 이유(4-3에서 커서 방식)
- [W15 — 총 건수는 별도 질문이다](../docs/knowledge/W15-paging-offset-vs-cursor.md#총-건수는-별도-질문이다)
- [W15 — 커서 경계는 완전한 정렬 순서여야 한다](../docs/knowledge/W15-paging-offset-vs-cursor.md#커서-경계는-완전한-정렬-순서여야-한다) — 정렬 끝의 `id`
- [S10 — 페이징은 정렬과 건수 계산의 계약이다](../docs/knowledge/S10-spring-data-query.md#페이징은-정렬과-건수-계산의-계약이다)
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — `Page`를 그대로 내보내지 않는 이유

## 다음

- 레슨: [G2. 권한 규칙을 한 곳에](G2-access-rules-in-one-place.md) — "이 사람이 이 글을 볼 수 있나"를 한 곳에 모은다.
- 실습: [2-2. 게시판 목록과 페이징](../scenario/ch2-read-post/2-2-board-list.md) — 오늘의 SQL을 API로 옮긴다.
