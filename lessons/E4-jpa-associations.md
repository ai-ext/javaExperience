# E4. JPA 연관관계 첫걸음 — 글·작성자·태그·댓글을 잇기

> 개념 레슨 · 40분

## 이게 뭐냐

글 상세 API의 응답 JSON은 `{ "author": {…}, "tags": […], "comments": […] }`처럼 한 덩어리다. DB에는 이런 덩어리가 없다. 테이블이 따로 있고 **번호(외래키)** 로 이어져 있을 뿐이다(E2). E3에서 `@ManyToOne`으로 "번호 대신 객체"를 맛봤다. 이번에는 게시판에 나오는 세 가지 관계를 다 잇는다.

| 관계 | DB에서는 | 엔티티에서는 | 어노테이션 |
|---|---|---|---|
| 글 → 작성자 (글 여러 개가 회원 하나를) | `post.author_id` | `Post.author` | `@ManyToOne` 다대일 |
| 글 ↔ 태그 (서로 여러 개) | 연결 테이블 `post_tag(post_id, tag_id)` | `Post.tags` | `@ManyToMany` 다대다 |
| 글 → 댓글 (글 하나에 댓글 여러 개) | `comment.post_id` — **외래키는 댓글 쪽에** | `Post.comments` | `@OneToMany` 일대다 |

엔티티의 연관 필드는 데이터 그 자체가 아니라 **DB에서 찾아갈 수 있는 길**이다. 길을 따라가는 순간(`post.getAuthor().getNickname()`) Hibernate가 SQL을 만들어 보낸다. 그래서 이 레슨의 절반은 "SQL이 언제, 몇 번 나가나"를 세는 일이다.

### 연관관계의 주인 — 외래키 열을 누가 쓰나

`comment.post_id` 열은 댓글 테이블에 있다. 이 열과 짝인 자바 필드 `Comment.post`(`@ManyToOne`)가 **주인**이다. 저장할 때 Hibernate는 주인 필드만 보고 `post_id`를 채운다.

`Post.comments`는 같은 관계를 반대쪽에서 보는 **거울**이다. `@OneToMany(mappedBy = "post")`라고 쓰는데, `mappedBy`는 "이 관계의 진짜 주인은 `Comment`의 `post` 필드다"라는 뜻이다. **열 이름(`post_id`)이 아니라 자바 필드 이름**을 쓴다(틀리면 서버가 안 뜬다 — 일부러 틀려 보기 2).

거울에만 넣고 저장하면 어떻게 되나. 실제로 `post.getComments().add(comment)`만 하고 `comment.post`는 비운 채 저장해 봤다. SQL이 나가기도 전에 막혔다.

```text
org.springframework.dao.DataIntegrityViolationException: not-null property references a null or transient value for entity org.example.e4.Comment.post
```

`Comment.post`(주인)가 비어 있다는 말이다. 주인 쪽을 채우자 `insert … (author_id,content,post_id) values (?,?,?)`에 `post_id` = `1`이 들어갔다. 다대다도 같다. `@JoinTable`을 단 `Post.tags`가 주인이라 `post_tag` 행을 쓴다.

### 언제 읽나 — LAZY와 EAGER, 기본값이 다르다

| 어노테이션 | 기본값 | 뜻 |
|---|---|---|
| `@ManyToOne` | **EAGER** | 글을 읽으면 작성자도 **반드시 바로** 읽는다 |
| `@OneToMany` · `@ManyToMany` | LAZY | 컬렉션은 처음 쓸 때 읽는다 |

ToOne 쪽 기본값이 EAGER라서, 우리는 늘 `@ManyToOne(fetch = FetchType.LAZY)`라고 **직접 적는다**. 안 적으면 쓰지도 않는 작성자를 매번 읽는다(일부러 틀려 보기 1에서 센다).

LAZY 필드에는 진짜 `Member` 대신 **프록시(대리 객체)** 가 들어 있다. 겉은 `Member`인데 안에 `id`만 들고 있다가, 다른 값을 처음 물을 때 SQL을 보낸다. 따라 해 보기 ①~④의 실제 출력이다.

```text
SQL: select p1_0.id,p1_0.author_id,p1_0.title from post p1_0 where p1_0.id=?
① 작성자 클래스: org.example.e4.Member$HibernateProxy
② 읽었나? false / id: 4
SQL: select m1_0.id,m1_0.nickname from member m1_0 where m1_0.id=?
③ 닉네임: 스프링요정
④ 읽었나? true
```

① 클래스가 실행 중에 만들어진 `Member$HibernateProxy`다. ② `getId()`로는 SQL이 안 나간다(`post.author_id`에서 이미 안다). ③ `getNickname()`에서 비로소 `member`를 읽는다.

프록시가 DB를 읽으려면 **열린 DB 세션(트랜잭션)** 이 있어야 한다. 트랜잭션이 끝난 뒤 처음 물으면 `LazyInitializationException`이 난다(따라 해 보기 ⑨).

## 예시

`practice` DB(8장에서도 쓰는 학습용 DB)의 `member`·`post`·`tag`·`post_tag`·`comment`에 맞춘 엔티티다. 쓰는 열만 매핑했다. 따라 해 보기에서 그대로 실행한 코드다.

```java
@Entity
@Table(name = "post")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;

    // ① 다대일: 글 여러 개 → 작성자 하나. post.author_id 열을 이 필드가 맡는다(주인)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private Member author;

    // ② 다대다: 글 ↔ 태그. 연결 테이블 post_tag를 이 필드가 맡는다(주인)
    @ManyToMany
    @JoinTable(name = "post_tag",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new LinkedHashSet<>();

    // ③ 일대다: 글 하나 → 댓글 여러 개. 외래키는 Comment.post가 맡는다 — 여기는 읽기용 거울
    @OneToMany(mappedBy = "post")
    private List<Comment> comments = new ArrayList<>();

    protected Post() {}
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public Member getAuthor() { return author; }
    public Set<Tag> getTags() { return tags; }
    public List<Comment> getComments() { return comments; }
}
```

```java
@Entity
@Table(name = "comment")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String content;

    // 댓글 여러 개 → 글 하나. comment.post_id 열을 이 필드가 맡는다(주인)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member author;

    protected Comment() {}
    public Long getId() { return id; }
    public String getContent() { return content; }
    public Post getPost() { return post; }
    public Member getAuthor() { return author; }
}
```

`Member`(테이블 `member`, 필드 `id`·`nickname`)와 `Tag`(테이블 `tag`, 필드 `id`·`name`)는 E3의 `Tag`처럼 `@Entity`·`@Table`·`@Id`·`@GeneratedValue(strategy = GenerationType.IDENTITY)`·`protected` 기본 생성자·getter만 있는 클래스다. import는 `jakarta.persistence.*`와 `java.util.*`다.

### N+1 — 목록 1번 + 글마다 1번

글 10개를 읽고 글마다 댓글 수를 세면 SQL이 몇 번 나갈까. 따라 해 보기 ⑤의 실제 로그다(가운데를 줄였다).

```text
SQL: select p1_0.id,p1_0.author_id,p1_0.title from post p1_0 order by p1_0.id limit ?
⑤ 글 10개 읽음 — 이제 댓글 수를 센다
SQL: select c1_0.post_id,c1_0.id,c1_0.member_id,c1_0.content from comment c1_0 where c1_0.post_id=?
   글 1 댓글 0개
SQL: select c1_0.post_id,c1_0.id,c1_0.member_id,c1_0.content from comment c1_0 where c1_0.post_id=?
   글 2 댓글 1개
…(같은 SQL이 글 10까지 한 번씩)
```

목록 **1번** + 글마다 **1번씩 10번** = 11번. 글이 50개면 51번이다. 이것이 **N+1**이다. 화면은 멀쩡하고 에러도 없어서 로그를 세 보지 않으면 모른다.

작성자는 조금 다르다(⑥). 글 10개인데 `member` SELECT는 **8번**만 나갔다. 글 6·7은 같은 회원(쿼리장인), 글 1·9도 같은 회원(스프링요정)이다. 한 트랜잭션 안에서 이미 읽은 회원은 Hibernate가 기억해 두고(영속성 컨텍스트) 다시 읽지 않는다. 그래도 "글 수만큼 늘어난다"는 성질은 같다.

### 줄이기 — join fetch와 @EntityGraph

"이 조회에서는 댓글(또는 작성자)도 같이 읽어라"를 저장소 메서드에 적는다.

```java
public interface PostRepository extends JpaRepository<Post, Long> {
    // 기본: 글만 읽는다(작성자·댓글은 나중에 쓸 때)
    List<Post> findTop10ByOrderByIdAsc();

    // 작성자를 같이 읽는다 — 이 메서드에만 적용
    @EntityGraph(attributePaths = "author")
    List<Post> findTop10WithAuthorByOrderByIdAsc();

    // 댓글을 같이 읽는다 — JPQL에 join fetch
    @Query("select p from Post p left join fetch p.comments where p.id <= 10 order by p.id")
    List<Post> findFirstTenWithComments();
}
```

`WithAuthor`는 사람이 읽으라고 붙인 이름표다. Spring Data는 `find`와 `By` 사이에서 `Top10`만 읽는다. 실제로 나간 SQL은 각각 **한 번**이었다(⑦·⑧).

```text
SQL: select p1_0.id,p1_0.author_id,c1_0.post_id,c1_0.id,c1_0.member_id,c1_0.content,p1_0.title from post p1_0 left join comment c1_0 on p1_0.id=c1_0.post_id where p1_0.id<=10 order by p1_0.id
⑦ join fetch: 글 10개, 댓글 합계 19개
SQL: select p1_0.id,p1_0.author_id,a1_0.id,a1_0.nickname,p1_0.title from post p1_0 join member a1_0 on a1_0.id=p1_0.author_id order by p1_0.id limit ?
⑧ @EntityGraph: 글 10개, 작성자 8명
```

댓글 JOIN 결과는 댓글 수만큼 행이 불어나지만(22행), 돌아온 `List`는 글 10개 그대로였다(Hibernate 7이 같은 글을 하나로 합친다). 컬렉션을 join fetch 하면서 페이지를 자르는 일은 따로 조심할 게 있어 랩 L3에서 다룬다.

## 따라 해 보기

15분. 연습용 프로젝트를 하나 만든다. 실습 레포에는 이미 `Post`·`Tag` 엔티티가 있어서 같은 이름을 또 만들면 부딪힌다.

**1. 프로젝트.** start.spring.io에서 Gradle·Java 21·Spring Boot 4.1.1, 의존성 **Spring Web · Spring Data JPA · MySQL Driver**를 골라 받는다(화면 설명은 10-1에 있다). 패키지는 `org.example.e4`. `build.gradle`의 의존성이 `spring-boot-starter-webmvc`·`spring-boot-starter-data-jpa`·`runtimeOnly 'com.mysql:mysql-connector-j'` 세 줄이면 된다. `application.yml`은 이렇게 둔다.

```yaml
server:
  port: 18160
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/practice?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  jpa:
    hibernate:
      ddl-auto: none        # 테이블은 건드리지 않는다(읽기만 한다)
    open-in-view: false     # 실습 레포·10장과 같다 — 트랜잭션이 끝나면 DB 세션도 닫힌다
logging:
  level:
    org.hibernate.SQL: debug
```

**2. 파일.** 예시의 엔티티 네 개와 `PostRepository`, 그리고 아래 연습 파일을 만든다.

```java
// 연습용 — 서버가 뜰 때 한 번 실행된다
@Component
public class E4Playground implements CommandLineRunner {
    private final PostRepository postRepository;
    private final TransactionTemplate tx;
    public E4Playground(PostRepository postRepository, TransactionTemplate tx) {
        this.postRepository = postRepository;
        this.tx = tx;
    }

    @Override
    public void run(String... args) {
        // tx.executeWithoutResult(…) 안 = 트랜잭션 안(서비스의 @Transactional 메서드 안과 같다)
        tx.executeWithoutResult(s -> {
            Post post = postRepository.findById(1L).orElseThrow();
            Member author = post.getAuthor();
            System.out.println("① 작성자 클래스: " + author.getClass().getName());
            System.out.println("② 읽었나? " + Hibernate.isInitialized(author) + " / id: " + author.getId());
            System.out.println("③ 닉네임: " + author.getNickname());
            System.out.println("④ 읽었나? " + Hibernate.isInitialized(author));
        });

        tx.executeWithoutResult(s -> {
            List<Post> posts = postRepository.findTop10ByOrderByIdAsc();
            System.out.println("⑤ 글 " + posts.size() + "개 읽음 — 이제 댓글 수를 센다");
            for (Post p : posts) {
                System.out.println("   글 " + p.getId() + " 댓글 " + p.getComments().size() + "개");
            }
            System.out.println("⑥ 이번엔 작성자 닉네임");
            for (Post p : posts) {
                System.out.println("   글 " + p.getId() + " 작성자 " + p.getAuthor().getNickname());
            }
        });

        tx.executeWithoutResult(s -> {
            List<Post> posts = postRepository.findFirstTenWithComments();
            int total = posts.stream().mapToInt(p -> p.getComments().size()).sum();
            System.out.println("⑦ join fetch: 글 " + posts.size() + "개, 댓글 합계 " + total + "개");
        });

        tx.executeWithoutResult(s -> {
            List<Post> posts = postRepository.findTop10WithAuthorByOrderByIdAsc();
            long authors = posts.stream().map(p -> p.getAuthor().getNickname()).distinct().count();
            System.out.println("⑧ @EntityGraph: 글 " + posts.size() + "개, 작성자 " + authors + "명");
        });

        // 트랜잭션 밖 — 저장소 메서드가 끝나면 DB 세션도 닫힌다
        Post outside = postRepository.findById(1L).orElseThrow();
        try {
            System.out.println("⑨ 밖에서 닉네임: " + outside.getAuthor().getNickname());
        } catch (Exception e) {
            System.out.println("⑨ " + e);
        }
    }
}
```

import는 `org.hibernate.Hibernate`, `org.springframework.transaction.support.TransactionTemplate`, `java.util.List` 등이다. `TransactionTemplate`은 "이 람다를 트랜잭션 하나로 묶어 실행해 줘"다. 연습 파일에서 `@Transactional` 메서드를 따로 만들지 않으려고 썼다(G3에서 `@Transactional`을 배운다).

**3. 켜고 SQL 줄을 센다.** `①`~`⑨` 사이의 `org.hibernate.SQL` 줄이 몇 개인지 센다. 시드 그대로인 DB에서 나온 수다.

| 구간 | SQL 수 | 볼 것 |
|---|---|---|
| ①~④ | 2 | 글 1번, 닉네임을 물을 때 회원 1번 |
| ⑤ | 1 + 10 | 목록 1 + 글마다 댓글 1 — N+1 |
| ⑥ | 8 | 글 10개, 같은 회원은 다시 안 읽어서 8 |
| ⑦ · ⑧ | 1 · 1 | JOIN 한 번으로 끝 |
| ⑨ | 1 + 에러 | 글은 읽었지만 작성자는 못 읽는다 |

⑨는 이렇게 나온다.

```text
⑨ org.hibernate.LazyInitializationException: Could not initialize proxy [org.example.e4.Member#4] - no session
```

`[org.example.e4.Member#4]`는 "id 4인 `Member`의 프록시"다. `findById`가 끝나면서 트랜잭션과 DB 세션이 닫혔고, 프록시가 읽으러 갈 곳이 없다. 실제 API에서는 컨트롤러에서 DTO를 만들다 이렇게 터진다. → [에러 도감: 지연 로딩 — no session](../errors.md#지연-로딩--no-session)

## 일부러 틀려 보기

메시지는 Spring Boot 4.1.1 · Hibernate 7.4.5에서 재현한 원문이다.

**1. `Post.author`에서 `fetch = FetchType.LAZY`를 지운다** — 기본값 EAGER가 된다.

```text
SQL: select p1_0.id,p1_0.author_id,a1_0.id,a1_0.nickname,p1_0.title from post p1_0 join member a1_0 on a1_0.id=p1_0.author_id where p1_0.id=?
① 작성자 클래스: org.example.e4.Member
…
SQL: select p1_0.id,p1_0.author_id,p1_0.title from post p1_0 order by p1_0.id limit ?
SQL: select m1_0.id,m1_0.nickname from member m1_0 where m1_0.id=?
…(member SELECT가 8번)
⑤ 글 10개 읽음 — 이제 댓글 수를 센다
```

`findById`는 JOIN 한 번으로 바뀌고 ①이 프록시가 아닌 진짜 `Member`가 된다. 그런데 목록(⑤ 앞)에서는 작성자를 **쓰지도 않았는데** `member` SELECT가 8번 먼저 나갔다. EAGER는 "바로 읽어라"일 뿐 "JOIN 한 번으로 읽어라"가 아니다. 댓글 join fetch(⑦)에도 같은 8번이 붙었다. 다시 `LAZY`로 돌려 놓는다.

**2. `mappedBy`에 열 이름을 쓴다** — `@OneToMany(mappedBy = "post_id")`

```text
Caused by: org.hibernate.AnnotationException: Collection 'org.example.e4.Post.comments' is 'mappedBy' a property named 'post_id' which does not exist in the target entity 'org.example.e4.Comment'
```

서버가 안 뜬다. `Comment`에 `post_id`라는 **필드**가 없다는 말이다. `mappedBy`는 상대 엔티티의 필드 이름(`"post"`)이다.

**3. 엔티티를 그대로 응답한다.** 컨트롤러에 `@GetMapping("/e4/posts/{id}/entity")`로 `postRepository.findById(id).orElseThrow()`를 그대로 돌려주는 메서드를 만든다(나쁜 예).

`curl localhost:18160/e4/posts/5/entity` → `500`. 서버 로그에는 ⑨와 같은 원인이 JSON 쓰기 단계에서 나온다.

```text
WARN … Resolved [org.springframework.http.converter.HttpMessageNotWritableException: Could not write JSON: Could not initialize proxy [org.example.e4.Member#28] - no session]
```

Jackson이 응답을 만들려고 `getAuthor()`의 프록시를 건드렸는데 세션이 이미 닫혔다. `open-in-view: true`(Spring Boot의 원래 기본값)로 켜면 더 나쁘다. 세션이 응답 끝까지 살아 있어서 `Post → comments → post → comments …`를 끝없이 따라간다. 상태 코드는 **`200`** 인데 본문은 39880바이트에서 잘린 깨진 JSON이었고(`"hibernateLazyInitializer":{}` 같은 내부 필드까지 섞였다), 로그에는 이렇게 남았다.

```text
WARN … Ignoring exception, response committed already: org.springframework.http.converter.HttpMessageNotWritableException: Could not write JSON: Document nesting depth (501) exceeds the maximum allowed (500, from `StreamWriteConstraints.getMaxNestingDepth()`)
```

클라이언트는 `200`을 받았는데 본문 JSON을 읽다가 터진다. 상태 코드만 보는 모니터링에도 안 잡히는 최악의 버그다. 고치는 법은 하나다. **트랜잭션 안에서 필요한 값만 DTO로 옮겨** 돌려준다.

```java
@Service
public class PostQueryService {
    private final PostRepository postRepository;
    public PostQueryService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public record AuthorResponse(Long id, String nickname) {}
    public record PostResponse(Long id, String title, AuthorResponse author, List<String> tags, int commentCount) {}

    @Transactional(readOnly = true)
    public PostResponse find(Long id) {
        Post post = postRepository.findById(id).orElseThrow();
        return new PostResponse(
                post.getId(),
                post.getTitle(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getTags().stream().map(Tag::getName).toList(),
                post.getComments().size());
    }
}
```

컨트롤러는 `postQueryService.find(id)`를 돌려주기만 한다. `curl localhost:18160/e4/posts/5` → `200`, `{"id":5,"title":"JPA N+1 문제 비교해보기","author":{"id":28,"nickname":"말많은회원"},"tags":["spring","jpa"],"commentCount":4}`(태그 순서는 실행마다 바뀔 수 있다). SQL은 글·작성자·태그(`post_tag join tag`)·댓글 4번이었다.

## 확인 문제

**1.** `Post.comments`와 `Comment.post` 중 `comment.post_id` 열에 값을 쓰는 쪽은? `mappedBy = "post"`의 `"post"`는 무엇을 가리키나?

<details>
<summary>정답</summary>

`Comment.post`다. 외래키 열이 `comment` 테이블에 있고, 그 열과 짝인 `@ManyToOne` 필드가 **주인**이다. `"post"`는 `Comment` 클래스의 **자바 필드 이름**이다. 열 이름 `post_id`를 쓰면 `is 'mappedBy' a property named 'post_id' which does not exist`로 서버가 안 뜬다. 거울(`Post.comments`)에만 넣고 저장하면 `not-null property references a null or transient value … Comment.post`로 막힌다.
</details>

**2.** `@ManyToOne`에 `fetch`를 안 적고 `findTop10ByOrderByIdAsc()`를 부른 뒤 작성자는 한 번도 안 건드렸다. SQL은 1번인가?

<details>
<summary>정답</summary>

아니다. `@ManyToOne`의 기본값은 **EAGER**라서 작성자를 바로 읽어야 한다. 실습 DB에서는 목록 1번 뒤에 `member` SELECT가 8번 더 나갔다. EAGER는 JOIN을 약속하지 않는다. 그래서 ToOne에는 늘 `fetch = FetchType.LAZY`를 직접 적고, 필요한 조회에서만 join fetch나 `@EntityGraph`로 같이 읽는다.
</details>

**3.** ⑥에서 글은 10개인데 `member` SELECT는 8번이었다. 왜 10번이 아닌가? 그래도 N+1이라고 부르는 이유는?

<details>
<summary>정답</summary>

한 트랜잭션 안에서 이미 읽은 회원은 Hibernate가 기억해 두고(영속성 컨텍스트) 다시 읽지 않는다. 글 6·7, 글 1·9가 같은 작성자라 두 번이 줄었다. 하지만 작성자가 다양할수록 SELECT 수가 글 수를 따라 늘어나는 구조는 그대로다. 목록 1번 + 행마다 추가 조회 = N+1이다.
</details>

**4.** ⑨에서 `outside.getAuthor().getId()`였다면 에러가 났을까?

<details>
<summary>정답</summary>

안 난다. 프록시는 처음부터 `id`를 들고 있다(②에서 `읽었나? false`인데도 id 4가 나왔다). `post.author_id` 열에서 이미 알기 때문이다. DB를 읽어야 하는 `getNickname()` 같은 값을 물을 때만 세션이 필요하다. 그래서 "`getId()`로는 괜찮던데요"가 지연 로딩 버그를 늦게 발견하게 만든다.
</details>

**5.** 엔티티 `Post`를 컨트롤러에서 그대로 응답하면 어떤 일이 생기나(`open-in-view`가 꺼졌을 때와 켜졌을 때)? 어떻게 고치나?

<details>
<summary>정답</summary>

꺼져 있으면(실습 레포·10장 설정) JSON을 만들다 프록시를 건드려 `Could not write JSON: Could not initialize proxy … - no session`, 응답은 `500`이다. 켜져 있으면 `post → comments → post …`를 끝없이 따라가다 `Document nesting depth (501) exceeds the maximum allowed (500 …)`가 나는데, 이미 `200`을 보낸 뒤라 클라이언트는 잘린 JSON을 받는다. 서비스의 트랜잭션 안에서 필요한 값만 **DTO(record)** 로 옮겨 돌려준다.
</details>

## 더 깊이

- [P20 — 연관관계의 주인](../docs/knowledge/P20-jpa-entity-mapping.md#24-연관관계의-주인) — 양방향 편의 메서드, cascade·orphanRemoval, 다대다를 연결 엔티티로 푸는 법
- [S09 — 관계형 매핑과 주인](../docs/knowledge/S09-jpa-hibernate.md#관계형-매핑과-주인) — 영속성 컨텍스트, LAZY와 N+1(심화)
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) · [W11 트랜잭션은 왜 서비스 계층에 거나](../docs/knowledge/W11-why-tx-in-service.md)
- 노하우 랩(Java 학습 → 노하우 랩): **L2** 지연 로딩과 LazyInitializationException · **L3** N+1과 조회 전략 선택(컬렉션 fetch join과 페이지) · **L4b** Spring 트랜잭션 경계와 프록시 · **L5** Cascade와 orphanRemoval · **L10** 코드 리뷰 — JPA 냄새 모음 PR
- 원문: [Jakarta Persistence `ManyToOne`](https://javadoc.io/static/jakarta.persistence/jakarta.persistence-api/3.2.0/jakarta.persistence/jakarta/persistence/ManyToOne.html) · [`OneToMany`](https://javadoc.io/static/jakarta.persistence/jakarta.persistence-api/3.2.0/jakarta.persistence/jakarta/persistence/OneToMany.html) · [`ManyToMany`](https://javadoc.io/static/jakarta.persistence/jakarta.persistence-api/3.2.0/jakarta.persistence/jakarta/persistence/ManyToMany.html) — 기본 fetch 값 · [Hibernate ORM 사용자 가이드](https://docs.hibernate.org/orm/7.2/userguide/html_single/) — fetch join, batch fetching · [Spring Data JPA `@EntityGraph`](https://docs.spring.io/spring-data/data-jpa/docs/4.1.0/api/org/springframework/data/jpa/repository/EntityGraph.html)

## 다음

- 실습: [3-1. 부분 수정과 본인 확인](../scenario/ch3-update-delete/3-1-patch.md) — 읽은 글의 작성자·게시판이 프록시라서, 트랜잭션 밖에서 DTO를 만들면 ⑨처럼 터진다.
- 실습: [10-5. 게시글 작성](../scenario/ch10-project/10-5-create-post.md) — `@ManyToOne` 작성자와 `@ManyToMany` 태그(`post_tags`)로 처음 저장한다. 10장 DB는 테이블 이름이 `users`·`posts`·`tags`·`post_tags`·`comments`로 다를 뿐 모양은 같다.
- 실습: [10-6. 게시글 상세](../scenario/ch10-project/10-6-post-detail.md) — 작성자·태그·댓글을 쿼리 수를 고정한 채 읽는다. 10장 풀이는 `Post.comments` 컬렉션 대신 댓글 저장소에서 `join fetch c.author`로 읽는다. 둘 다 된다.
- 레슨: [E5. MyBatis 첫걸음](E5-mybatis-first-steps.md) — SQL을 직접 쓰는 다른 방식.
