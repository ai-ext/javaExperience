# H7. 캐시 — @Cacheable과 무효화

> 개념 레슨 · 35분

## 이게 뭐냐

8-2의 인기글은 좋아요·댓글을 기간으로 집계하는 무거운 쿼리다. 메인 화면을 여는 사람마다 이 쿼리가 돈다. 그런데 결과는 몇십 초 동안 거의 안 바뀐다. 한 번 계산한 결과를 **서버 메모리에 잠깐 두고 다시 쓰면** DB가 쉰다. 이것이 캐시다.

Spring에서는 메서드에 표시만 붙인다.

```java
@Cacheable(cacheNames = "post", key = "#id")
public PostView find(Long id) { … }
```

H6의 `@Async`처럼 **프록시**가 이 호출을 먼저 받는다.

1. 캐시 `post`에서 키 `id`를 찾는다.
2. 있으면(**적중**, hit) 그 값을 바로 돌려준다. **메서드 본문은 실행되지 않는다.** SQL도 안 나간다.
3. 없으면(**미적중**, miss) 메서드를 실행하고, 돌려줄 값을 캐시에 넣어 둔다.

캐시는 공짜가 아니다. 대가가 두 가지 있다.

| 대가 | 예 | 대처 |
|---|---|---|
| **오래된 값** | 제목을 고쳤는데 캐시에는 옛 제목이 남아 있다 | 일정 시간 뒤 자동으로 버린다(**TTL**, 만료 시간) |
| **보이면 안 되는 값** | 글을 비공개로 돌렸는데 인기글에 계속 뜬다 | 바꾸는 쪽이 캐시를 **직접 지운다**(무효화, `@CacheEvict`) |

| 어노테이션 | 하는 일 |
|---|---|
| `@EnableCaching` | `@Configuration` 클래스 하나에. 없으면 캐시 어노테이션이 전부 무시된다 |
| `@Cacheable` | 있으면 꺼내 주고, 없으면 실행해서 넣는다 |
| `@CacheEvict` | 메서드가 **성공하면** 캐시 항목을 지운다. `allEntries = true`면 그 캐시를 통째로 |

캐시를 실제로 담는 곳은 따로 고른다. 의존성 `spring-boot-starter-cache`만 넣으면 Boot는 `ConcurrentHashMap`(그냥 맵)을 쓴다. 만료도 크기 제한도 없다. 여기에 `com.github.ben-manes.caffeine:caffeine`을 더하면 Boot가 **Caffeine**(만료·크기 제한이 있는 메모리 캐시)으로 바꾼다.

## 예시

이 레슨을 쓰면서 작은 Spring Boot 4.1 앱(포트 `18310`)을 만들어 돌렸다. `practice` DB의 글 다섯 개를 복사한 연습 테이블 `lesson_h7_post`를 읽는다. SQL 로그(`org.hibernate.SQL: debug`)가 찍히면 미적중, 안 찍히면 적중이다.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-cache'
implementation 'com.github.ben-manes.caffeine:caffeine'
```

```yaml
spring:
  cache:
    cache-names: post,me
    caffeine:
      spec: maximumSize=100,expireAfterWrite=5s   # 최대 100개, 넣은 지 5초 지나면 버림
```

```java
@Configuration
@EnableCaching
public class CacheConfig {}

public record PostView(Long id, String title) {}   // 캐시에 넣는 값은 불변으로

@Service
public class H7PostService {
    @Cacheable(cacheNames = "post", key = "#id")
    public PostView find(Long id) {
        H7Post p = posts.findById(id).orElseThrow();
        return new PostView(p.getId(), p.getTitle());
    }
}
```

캐시에서 꺼낸 값은 **매번 같은 객체**다(같은 키로 두 번 꺼내 `==`로 비교하니 `true`였다). 누가 그 객체를 고치면 다음 사람이 고친 걸 받는다. 그래서 record처럼 고칠 수 없는 값으로 넣는다.

**적중과 만료.** 같은 글을 세 번, 6초 쉬고 두 번 읽었다.

```text
$ curl http://localhost:18310/h7/posts/1
{"id":1,"title":"MySQL 인덱스 설계 질문드립니다"}
16:06:59.032 org.hibernate.SQL : select hp1_0.id,hp1_0.title from lesson_h7_post hp1_0 where hp1_0.id=?
$ curl http://localhost:18310/h7/posts/1
{"id":1,"title":"MySQL 인덱스 설계 질문드립니다"}
$ curl http://localhost:18310/h7/posts/1
{"id":1,"title":"MySQL 인덱스 설계 질문드립니다"}
(6초 대기)
$ curl http://localhost:18310/h7/posts/1
{"id":1,"title":"MySQL 인덱스 설계 질문드립니다"}
16:07:06.492 org.hibernate.SQL : select hp1_0.id,hp1_0.title from lesson_h7_post hp1_0 where hp1_0.id=?
$ curl http://localhost:18310/h7/posts/1
{"id":1,"title":"MySQL 인덱스 설계 질문드립니다"}
```

첫 요청만 SQL, 둘째·셋째는 SQL 없음. 5초가 지나 항목이 버려지자 다시 SQL 한 번.

**무효화.** 글 2를 읽어 캐시에 넣은 뒤 제목을 고쳤다. 먼저 `@CacheEvict` **없는** 수정 메서드로.

```text
$ curl http://localhost:18310/h7/posts/2
{"id":2,"title":"[공지] 커뮤니티 이용 규칙 안내"}
… select … where hp1_0.id=?
$ curl -X PATCH "http://localhost:18310/h7/posts/2?title=제목 바꿈"
… update lesson_h7_post set title=? where id=?
$ curl http://localhost:18310/h7/posts/2
{"id":2,"title":"[공지] 커뮤니티 이용 규칙 안내"}
```

DB에는 `제목 바꿈`이 들어갔는데(`SELECT`로 확인) 응답은 옛 제목이다. `@Cacheable`은 DB가 바뀐 것을 모른다. 이번엔 지우는 메서드로 고쳤다.

```java
@Transactional
@CacheEvict(cacheNames = "post", key = "#id")
public void renameAndEvict(Long id, String title) {
    posts.findById(id).orElseThrow().changeTitle(title);
}
```

```text
$ curl -X PATCH "http://localhost:18310/h7/posts/2?title=두 번째 바꿈&evict=true"
… update lesson_h7_post set title=? where id=?
$ curl http://localhost:18310/h7/posts/2
{"id":2,"title":"두 번째 바꿈"}
… select … where hp1_0.id=?
```

지운 뒤 첫 조회가 미적중이 되어 새 값을 읽었다.

**최대 크기.** `maximumSize=2`로 두고 글 1~5를 차례로 읽은 뒤 Caffeine에 남은 키를 꺼내 봤다. 앱을 세 번 새로 띄워 세 번 다 같았다.

```text
"estimatedSize":2,"keys":["1","5"]
```

개수는 2로 지켰다. 그런데 남은 것은 **가장 오래된 1과 가장 최근 5**다. Caffeine은 "오래된 것부터 버리기"가 아니라 자기 규칙(얼마나 자주 쓰였나 등)으로 버릴 것을 고른다. 크기 제한은 **메모리가 끝없이 커지지 않게** 하는 장치이지, 어느 항목이 남을지 약속하는 장치가 아니다.

**맵 캐시(기본)와 비교.** `spring.cache.type=simple`로 Caffeine 대신 맵을 쓰게 하자 캐시 관리자가 `ConcurrentMapCacheManager`가 되었고, 6초 뒤에도 SQL 없이 옛 값을 줬다. `caffeine.spec`의 만료는 Caffeine에서만 통한다.

## 따라 해 보기

15분. 실습 레포에서 한다. 16-3에서 그대로 쓸 설정이다.

**1.** `build.gradle`에 위 두 의존성을 넣고, `@EnableCaching`이 붙은 `CacheConfig`를 만든다. `application.yml`에는 연습용으로 짧게 둔다.

```yaml
spring:
  cache:
    cache-names: popularPosts
    caffeine:
      spec: maximumSize=100,expireAfterWrite=10s
```

**2.** 8-2의 인기글 서비스 메서드에 `@Cacheable(cacheNames = "popularPosts", key = "#days + ':' + #limit")`을 붙인다(매개변수 이름이 `days`·`limit`가 아니면 맞춰 고친다). 앱을 띄우고 같은 요청을 연달아 보낸다.

```bash
for i in 1 2 3; do curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8080/api/posts/popular?days=7&limit=5"; done
```

앱 로그에서 인기글 SQL이 **첫 번째에만** 찍히는지 본다. `days=30`으로 바꾸면 키가 달라 다시 한 번 찍힌다.

**3.** 10초 넘게 쉬고 한 번 더 보낸다. SQL이 다시 찍힌다. 끝나면 `expireAfterWrite`를 16-3의 값(`60s`)으로 바꿔 둔다.

## 일부러 틀려 보기

**1. 같은 클래스에서 부른다.** 서비스 안에 `findViaThis(id) { return this.find(id); }`를 두고 이걸로 두 번 읽었다.

```text
$ curl http://localhost:18310/h7/posts/3/via-this
{"id":3,"title":"첫 코드리뷰 받은 날"}
16:07:17.447 org.hibernate.SQL : select hp1_0.id,hp1_0.title from lesson_h7_post hp1_0 where hp1_0.id=?
$ curl http://localhost:18310/h7/posts/3/via-this
{"id":3,"title":"첫 코드리뷰 받은 날"}
16:07:17.944 org.hibernate.SQL : select hp1_0.id,hp1_0.title from lesson_h7_post hp1_0 where hp1_0.id=?
```

두 번 다 SQL이고, 캐시를 들여다보니 키 `3`이 아예 없었다. H6과 같은 이유다. `this.`는 프록시를 안 거친다. 캐시 메서드는 **다른 빈**(컨트롤러나 다른 서비스)에서 부른다.

**2. `@EnableCaching`을 뺀다.** 매번 SQL이 나가고 에러는 없다. `CacheManager` 빈도 아예 만들어지지 않았다. "캐시를 붙였는데 효과가 없다"면 이것부터 본다.

**3. 회원마다 다른 값을 캐시한다 — 사고.** "내 정보"를 캐시했다. 이 실험 코드는 로그인한 회원을 메서드 **인자가 아니라** 요청에 묶인 곳(`LoginUser.get()`)에서 꺼낸다. 실습 레포는 `@LoginMember`로 받아 인자로 넘기지만, 로그인 정보를 인자 밖에서 꺼내는 코드라면 이렇게 된다.

```java
@Cacheable(cacheNames = "me")          // key 없음
public Map<String, Object> myInfo() {
    Long memberId = LoginUser.get();   // 키에 안 들어간다
    return jdbc.queryForMap("SELECT id, nickname, email FROM member WHERE id = ?", memberId);
}
```

회원 4가 먼저 부르고, 이어서 회원 2가 불렀다.

```text
$ curl -H 'X-Member-Id: 4' http://localhost:18310/h7/me
{"id":4,"nickname":"스프링요정","email":"user04@example.invalid"}
… DB에서 내 정보 읽음 memberId=4
$ curl -H 'X-Member-Id: 2' http://localhost:18310/h7/me
{"id":4,"nickname":"스프링요정","email":"user04@example.invalid"}
```

**회원 2가 회원 4의 이메일을 받았다.** 캐시의 키는 `SimpleKey []` 하나였다. 키는 **메서드 인자**로만 만들어진다. 인자가 없으니 모두가 같은 칸을 쓴다. 회원 id를 인자로 받아 `key = "#memberId"`로 고치자 키가 `2`·`4`로 나뉘었다. 다만 고친 뒤에도 남는 숙제가 있다. 회원별 값은 회원 수만큼 캐시가 커지고, 회원 정보가 바뀌면 그 키를 지워야 한다. 모두에게 같은 값(인기글)이 캐시하기 좋은 값이다. (덤으로 이 예시는 고칠 수 있는 `Map`을 캐시에 넣었다. 앞에서 본 "같은 객체" 문제도 같이 안고 있다.)

## 확인 문제

**1.** `@Cacheable(cacheNames = "post", key = "#id")`인 `find(1)`을 TTL 안에 세 번 불렀다. 본문(SQL)은 몇 번 실행되나?

<details>
<summary>정답</summary>

**한 번.** 첫 호출은 미적중이라 실행하고 결과를 넣는다. 둘째·셋째는 적중이라 프록시가 캐시 값을 바로 돌려주고 본문을 건너뛴다. 실측에서도 첫 요청에만 `select`가 찍혔다.
</details>

**2.** 제목을 고치는 메서드에 아무 캐시 어노테이션도 없다. 고친 직후 `find`를 부르면?

<details>
<summary>정답</summary>

**옛 제목**이 나온다(TTL이 지나기 전까지). `@Cacheable`은 DB 변경을 모른다. 바꾸는 메서드에 `@CacheEvict(cacheNames = "post", key = "#id")`를 붙여 성공하면 그 항목을 지운다. 16-3처럼 한 글이 여러 키(기간·개수 조합)에 들어 있을 수 있으면 `allEntries = true`로 통째로 지운다.
</details>

**3.** 같은 서비스의 다른 메서드에서 `this.find(id)`를 부르면 캐시가 쓰이나?

<details>
<summary>정답</summary>

**안 쓰인다.** 캐시는 프록시가 처리하는데 `this.`는 프록시를 거치지 않는다. 실측에서 매번 SQL이 나갔고 캐시에 키가 생기지도 않았다. 다른 빈에서 부르게 구조를 바꾼다.
</details>

**4.** `maximumSize=2`인 Caffeine 캐시에 키 1·2·3·4·5를 차례로 넣었다. 남는 것은 4·5인가?

<details>
<summary>정답</summary>

**그렇다고 약속할 수 없다.** 실측에서는 세 번 모두 1·5가 남았다. Caffeine은 개수만 지키고, 무엇을 버릴지는 사용 빈도 등 자기 규칙으로 정한다. "가장 오래된 것부터"를 믿고 코드를 짜면 안 된다.
</details>

**5.** 인자 없는 `myInfo()`에 `@Cacheable("me")`를 붙였다. 무슨 일이 생기고, 왜인가?

<details>
<summary>정답</summary>

**처음 부른 회원의 정보가 모든 회원에게 나간다.** 기본 키는 메서드 인자로 만든다. 인자가 없으면 키가 늘 `SimpleKey []` 하나다. 로그인 정보가 키에 자동으로 들어가지 않는다. 회원별 값이면 회원 id를 인자·키에 넣고, 가능하면 회원별 값은 캐시하지 않는다.
</details>

## 더 깊이

- [W17 — B. 한 JVM에서 Caffeine](../docs/knowledge/W17-where-to-cache.md#b-한-jvm에서-caffeine-미실행)
- [W23 — 생명주기와 정합성](../docs/knowledge/W23-cache-and-in-memory.md#생명주기와-정합성)
- [W23 — 캐시에 TTL을 지정했으면 무효화 로직은 필요 없는가?](../docs/knowledge/W23-cache-and-in-memory.md#q5-캐시에-ttl을-지정했으면-무효화-로직은-필요-없는가)
- [S11 — 메서드 캐시 호출 흐름](../docs/knowledge/S11-cache-redis-migration.md#메서드-캐시-호출-흐름)
- [S11 — 만료와 스탬피드](../docs/knowledge/S11-cache-redis-migration.md#만료와-스탬피드) — 만료 순간 요청이 몰리면
- Spring Boot 4.1 Reference — Caching: https://docs.spring.io/spring-boot/4.1/reference/io/caching.html
- Spring Framework Reference — Declarative Annotation-based Caching(키 만들기, `@CacheEvict`, 프록시): https://docs.spring.io/spring-framework/reference/integration/cache/annotations.html
- Spring Boot 4.1.1 API — `CacheType`: https://docs.spring.io/spring-boot/api/java/org/springframework/boot/autoconfigure/cache/CacheType.html

## 다음

- 실습: [16-3. 인기글 캐시 — 60초 동안 재사용, 숨기면 바로 빼기](../scenario/ch16-events-async-cache/16-3-popular-cache.md) — `(days, limit)` 키로 60초 캐시하고, 글 수정·삭제가 성공하면 `allEntries = true`로 비운다. `X-Cache: HIT/MISS` 헤더로 적중을 눈으로 본다.
- 레슨: [H8. 외부 HTTP 호출 — RestClient와 타임아웃](H8-rest-client-timeout.md) — 처음으로 우리 서버가 남의 서버를 부른다.
