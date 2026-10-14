# E5. MyBatis 첫걸음 — SQL을 내가 쥐는 방식

> 개념 레슨 · 35분

## 이게 뭐냐

E3·E4의 JPA는 **객체를 설명하면 SQL은 Hibernate가 쓴다.** 편하지만 "정렬 두 가지, 페이지 방식 두 가지, 태그·검색어는 있을 수도 없을 수도"(10-7 목록 API) 같은 조회에서는 Hibernate가 어떤 SQL을 만들지 짐작하기 어렵다.

MyBatis는 반대다. **SQL은 내가 쓰고**, MyBatis는 두 가지만 대신해 준다. ① 자바 값을 SQL의 `?` 자리에 넣고, ② 결과 행을 자바 객체에 옮겨 담는다.

MyBatis는 이 SQL을 자바 코드 안이 아니라 **XML 파일**에 따로 모아 둔다.

| | JPA (E3·E4) | MyBatis |
|---|---|---|
| SQL은 누가 | Hibernate가 만든다 | 내가 XML에 쓴다 |
| 결과는 | 엔티티(연관·프록시·변경 감지 포함) | 그냥 자바 객체(한 줄 = 한 객체) |
| 잘하는 일 | 저장·수정, 연관을 따라가는 읽기 | 조건이 많은 목록·검색·통계 |
| 10장에서 | 기본 경로 전부(10-5 쓰기, 10-7 목록) | 선택: 10-7 "MyBatis로 짜 보기" 칸, 10-12 |

### 세 조각 — 인터페이스 · XML · 설정 세 줄

1. **Mapper 인터페이스** — 메서드 모양만 적는다. 구현 클래스는 만들지 않는다(E3의 `TagRepository`처럼).
2. **XML** — 메서드마다 실행할 SQL. 둘을 잇는 규칙은 하나다. **XML의 `namespace` = 인터페이스의 전체 이름, 각 SQL의 `id` = 메서드 이름.** `org.example.e5.PostMapper` + `findById`가 SQL 하나를 찾는 열쇠다.
3. **설정 세 줄**(`application.yml`)

| 설정 | 뜻 | 없으면 |
|---|---|---|
| `mybatis.mapper-locations` | XML이 어디 있나(`classpath:mapper/*.xml`) | XML을 아예 안 읽는다 — 서버는 뜨고, 부를 때 터진다(일부러 틀려 보기 2) |
| `mybatis.type-aliases-package` | 이 패키지의 클래스는 XML에서 짧은 이름(`PostRow`)으로 쓴다 | `org.example.e5.PostRow`처럼 전체 이름을 써야 한다 |
| `mybatis.configuration.map-underscore-to-camel-case` | 열 `author_id` → 필드 `authorId` | 밑줄 있는 열이 전부 `null`·`0`이 된다(일부러 틀려 보기 1) |

### `#{}` — 값은 SQL 글자에 붙이지 않는다

XML에 `WHERE author_id = #{authorId}`라고 쓰면 MyBatis는 SQL을 `WHERE author_id = ?`로 바꾸고 값 `5`를 따로 보낸다. E3에서 본 `binding parameter`와 같다. 로그에서는 이렇게 보인다.

```text
==>  Preparing: SELECT … FROM post WHERE author_id = ? AND title LIKE CONCAT('%', ?, '%') ORDER BY id
==> Parameters: 5(Long), Docker(String)
```

`${q}`라고 쓰면 다르다. 값이 SQL 글자에 그대로 박힌다. 실제로 바꿔 보니 `… AND title LIKE '%Docker%' …`가 되고 `Parameters`에는 `5(Long)`만 남았다. 사용자가 보낸 글자가 SQL이 되는 셈이라 SQL 주입의 통로다. **값은 언제나 `#{}`**. `${}`가 왜, 언제 필요한지는 랩 L7에서 다룬다.

### resultType과 resultMap

| | 쓰는 법 | 언제 |
|---|---|---|
| `resultType="PostRow"` | 열 이름 ↔ 필드 이름을 MyBatis가 맞춰 넣는다 | 대부분. 목록을 돌려줘도 `List`가 아니라 **한 줄의 타입**을 쓴다 |
| `resultMap="postRowMap"` | 열 → 필드를 표로 직접 적는다 | 이름이 안 맞을 때, 글 안에 작성자 객체를 넣는 식의 중첩 결과(랩 L6) |

### insert와 `useGeneratedKeys`

`INSERT` 뒤에 DB(`AUTO_INCREMENT`)가 붙인 번호를 객체에 받으려면 `useGeneratedKeys="true" keyProperty="id"`를 붙인다. JPA의 `save` 후 id가 채워지던 것(E3 ④⑤)을 직접 부탁하는 셈이다.

## 예시

`practice` DB의 `post` 테이블을 읽는다. 쓰기는 연습용 테이블 `lesson_post`에 한다. 따라 해 보기에서 그대로 실행한 코드다.

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml        # ① XML이 어디 있나
  type-aliases-package: org.example.e5           # ② resultType에 짧은 이름(PostRow)을 쓰게
  configuration:
    map-underscore-to-camel-case: true           # ③ author_id → authorId

logging:
  level:
    org.example.e5: debug                         # 매퍼가 보내는 SQL과 값을 본다
```

```java
// SQL 결과 한 줄을 담는 그릇. MyBatis가 열 이름과 같은 필드에 값을 넣는다
public class PostRow {
    private Long id;
    private Long authorId;
    private String title;
    private int viewCount;
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public Long getAuthorId() { return authorId; }
    public String getTitle() { return title; }
    public int getViewCount() { return viewCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    @Override
    public String toString() {
        return "PostRow{id=" + id + ", authorId=" + authorId + ", title=" + title
                + ", viewCount=" + viewCount + ", createdAt=" + createdAt + "}";
    }
}
```

setter가 없어도 MyBatis가 필드에 직접 넣는다(10-7 선택 칸의 `PostListRow`도 이렇게 한다). INSERT에 넘길 `NewPost`는 `id`(비워 둠)·`authorId`·`title` 필드와 생성자 `NewPost(Long authorId, String title)`, getter만 있는 클래스다.

```java
// 구현 클래스는 없다 — MyBatis가 같은 이름의 XML(namespace + id)에서 SQL을 찾아 실행한다
@Mapper
public interface PostMapper {

    PostRow findById(Long id);

    PostRow findByIdWithMap(Long id);

    List<PostRow> search(@Param("authorId") Long authorId, @Param("q") String q);

    int insert(NewPost post);
}
```

`src/main/resources/mapper/PostMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- namespace = 인터페이스의 전체 이름 -->
<mapper namespace="org.example.e5.PostMapper">

    <!-- id = 메서드 이름. resultType = 결과 한 줄을 담을 클래스 -->
    <select id="findById" resultType="PostRow">
        SELECT id, author_id, title, view_count, created_at
        FROM post
        WHERE id = #{id}
    </select>

    <!-- resultMap = 열 → 필드를 하나하나 적어 둔 표 -->
    <resultMap id="postRowMap" type="PostRow">
        <id     column="id"         property="id"/>
        <result column="author_id"  property="authorId"/>
        <result column="title"      property="title"/>
        <result column="view_count" property="viewCount"/>
        <result column="created_at" property="createdAt"/>
    </resultMap>

    <select id="findByIdWithMap" resultMap="postRowMap">
        SELECT id, author_id, title, view_count, created_at
        FROM post
        WHERE id = #{id}
    </select>

    <!-- 조건이 있을 때만 붙인다. WHERE와 맨 앞 AND는 where 태그가 정리한다 -->
    <select id="search" resultType="PostRow">
        SELECT id, author_id, title, view_count, created_at
        FROM post
        <where>
            <if test="authorId != null">
                AND author_id = #{authorId}
            </if>
            <if test="q != null and q != ''">
                AND title LIKE CONCAT('%', #{q}, '%')
            </if>
        </where>
        ORDER BY id
    </select>

    <!-- DB가 붙인 번호를 post.id에 넣어 달라 -->
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO lesson_post (author_id, title)
        VALUES (#{authorId}, #{title})
    </insert>
</mapper>
```

`search`의 `if`·`where` 태그가 **동적 SQL**이다. 조건이 둘 다 비면 `WHERE`째 사라지고, 첫 조건이 비면 둘째 조건 앞의 `AND`를 지워 준다. 실제로 만들어진 SQL은 따라 해 보기 ④~⑥에서 본다.

`@Param`은 XML의 `#{authorId}`가 어느 인자인지 이름을 붙여 준다. 이 프로젝트(Spring Boot Gradle 플러그인)는 매개변수 이름을 남기도록 컴파일해서 빼도 동작했지만, 10장·랩 코드처럼 인자가 둘 이상이면 붙여 둔다.

## 따라 해 보기

15분. E4처럼 연습용 프로젝트를 하나 만든다(패키지 `org.example.e5`). 의존성은 둘이다. `implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'`(Spring Boot 4.1용, 10장·랩과 같은 버전)과 `runtimeOnly 'com.mysql:mysql-connector-j'`. `application.yml`에는 E4의 `spring.datasource` 세 줄(`practice` DB)과 위 예시의 `mybatis`·`logging`을 넣는다. 웹 의존성이 없으니 포트는 쓰지 않는다.

**1. 연습 테이블을 만든다.** E2의 `sql` 함수는 `community` DB용이라 `practice`용을 하나 더 만든다.

```bash
sqlp() { docker exec -i studymate-mysql-1 mysql --default-character-set=utf8mb4 -t -ucommunity -pcommunity practice -e "$1"; }
sqlp "CREATE TABLE lesson_post (id BIGINT AUTO_INCREMENT PRIMARY KEY, author_id BIGINT NOT NULL, title VARCHAR(200) NOT NULL)"
```

**2. 예시의 파일과 연습 파일을 만든다.**

```java
// 연습용 — 서버가 뜰 때 한 번 실행된다
@Component
public class E5Playground implements CommandLineRunner {

    private final PostMapper postMapper;

    public E5Playground(PostMapper postMapper) {
        this.postMapper = postMapper;
    }

    @Override
    public void run(String... args) {
        System.out.println("① 매퍼의 실제 클래스: " + postMapper.getClass().getName());
        System.out.println("② " + postMapper.findById(5L));
        System.out.println("③ " + postMapper.findByIdWithMap(5L));
        System.out.println("④ 조건 없음: " + postMapper.search(null, null).size() + "건");
        System.out.println("⑤ 작성자 5: " + postMapper.search(5L, null).size() + "건");
        System.out.println("⑥ 작성자 5 + 'Docker': " + postMapper.search(5L, "Docker").size() + "건");

        NewPost post = new NewPost(1L, "MyBatis로 넣은 글");
        System.out.println("⑦ insert 전 id: " + post.getId());
        int rows = postMapper.insert(post);
        System.out.println("⑧ 바뀐 행: " + rows + ", insert 후 id: " + post.getId());
    }
}
```

**3. 켜고 콘솔을 읽는다.** 실제로 나온 것이다(로그 앞부분 시각·스레드는 지웠다. 수는 시드 기준).

```text
① 매퍼의 실제 클래스: jdk.proxy2.$Proxy49
PostMapper.findById: ==>  Preparing: SELECT id, author_id, title, view_count, created_at FROM post WHERE id = ?
PostMapper.findById: ==> Parameters: 5(Long)
PostMapper.findById: <==      Total: 1
② PostRow{id=5, authorId=28, title=JPA N+1 문제 비교해보기, viewCount=36, createdAt=2026-07-03T05:13:20}
③ PostRow{id=5, authorId=28, title=JPA N+1 문제 비교해보기, viewCount=36, createdAt=2026-07-03T05:13:20}
PostMapper.search: ==>  Preparing: SELECT id, author_id, title, view_count, created_at FROM post ORDER BY id
④ 조건 없음: 145건
PostMapper.search: ==>  Preparing: SELECT id, author_id, title, view_count, created_at FROM post WHERE author_id = ? ORDER BY id
⑤ 작성자 5: 12건
PostMapper.search: ==>  Preparing: SELECT id, author_id, title, view_count, created_at FROM post WHERE author_id = ? AND title LIKE CONCAT('%', ?, '%') ORDER BY id
⑥ 작성자 5 + 'Docker': 3건
⑦ insert 전 id: null
PostMapper.insert: ==>  Preparing: INSERT INTO lesson_post (author_id, title) VALUES (?, ?)
PostMapper.insert: ==> Parameters: 1(Long), MyBatis로 넣은 글(String)
PostMapper.insert: <==    Updates: 1
⑧ 바뀐 행: 1, insert 후 id: 1
```

| 번호 | 볼 것 |
|---|---|
| ① | 인터페이스만 만들었는데 실행 중 만들어진 프록시가 들어왔다(E3의 저장소와 같다) |
| ②③ | 같은 결과. ②는 밑줄→카멜 설정이, ③은 `resultMap` 표가 `author_id`를 `authorId`에 넣었다 |
| ④ | 조건이 없으면 `WHERE`가 통째로 사라진다 → **145건 전부**. 목록 API라면 페이지(`LIMIT`)를 꼭 붙인다(10-7) |
| ⑤⑥ | 조건이 있을 때만 그 줄이 붙고, `#{}` 자리는 `?`다 |
| ⑦⑧ | `useGeneratedKeys` 덕에 INSERT 뒤 `id`가 채워졌다(새 테이블이라 1) |

**4. 연습 테이블을 지운다.** `sqlp "DROP TABLE lesson_post"`. 연습 파일(`E5Playground`)도 지운다.

## 일부러 틀려 보기

메시지는 Spring Boot 4.1.1 · mybatis-spring-boot-starter 4.1.0(MyBatis 3.5.19)에서 재현한 원문이다.

**1. `map-underscore-to-camel-case`를 `false`로 바꾼다**

```text
② PostRow{id=5, authorId=null, title=JPA N+1 문제 비교해보기, viewCount=0, createdAt=null}
③ PostRow{id=5, authorId=28, title=JPA N+1 문제 비교해보기, viewCount=36, createdAt=2026-07-03T05:13:20}
```

에러가 없다. 밑줄 있는 열(`author_id`·`view_count`·`created_at`)만 조용히 빈 값이 된다. 이름이 같은 `id`·`title`은 멀쩡하다. 직접 짝을 적은 `resultMap`(③)은 설정과 상관없다.

**2. `Invalid bound statement (not found)` — 원인 둘, 메시지 하나**

(가) XML의 `<select id="findById"`를 `id="findOne"`으로 바꾼다. (나) 되돌리고, XML 폴더 이름을 `mapper` → `mappers`로 바꾼다(`mapper-locations`와 안 맞게). 둘 다 똑같이 나온다.

```text
org.apache.ibatis.binding.BindingException: Invalid bound statement (not found): org.example.e5.PostMapper.findById
	…
	at jdk.proxy2/jdk.proxy2.$Proxy49.findById(Unknown Source) ~[na:na]
	at org.example.e5.E5Playground.run(E5Playground.java:19) ~[!/:0.0.1-SNAPSHOT]
```

`namespace + id`(`org.example.e5.PostMapper.findById`)로 SQL을 찾았는데 없다는 뜻이다. 두 경우 모두 **서버는 멀쩡히 떴다**(①이 찍혔다). 경고도 한 줄 없다. 그 메서드를 **부르는 순간** 터진다. 그래서 순서대로 본다.

1. XML의 `namespace`가 인터페이스 전체 이름과 같은가(`namespace="org.example.e5.PostMappr"` 같은 오타도 같은 메시지였다)
2. `id`가 메서드 이름과 같은가
3. XML이 `mapper-locations`가 가리키는 곳에 있는가. `src/main/java` 안에 XML을 두어도 같은 메시지였다. Gradle은 그 폴더의 XML을 빌드 결과에 넣지 않는다. XML은 `src/main/resources` 아래에 둔다.

**3. `resultType="PostRow"`를 `"PostRoww"`로 틀린다**

```text
Caused by: org.apache.ibatis.type.TypeException: Could not resolve type alias 'PostRoww'.  Cause: java.lang.ClassNotFoundException: Cannot find class: PostRoww
```

이번엔 **서버가 안 뜬다.** XML을 읽는 시점(시작할 때)에 클래스 이름을 확인하기 때문이다. 바로 위에 `Error parsing Mapper XML. The XML location is 'class path resource [mapper/PostMapper.xml]'`이 있어 어느 파일인지도 알려 준다. 2와 달리 일찍, 친절하게 실패한다.

**4. `useGeneratedKeys="true" keyProperty="id"`를 지운다** — `⑧ 바뀐 행: 1, insert 후 id: null`. 행은 들어갔는데 번호를 못 받았다. 10-5처럼 "만든 글의 id로 `Location` 헤더를 만드는" 코드라면 여기서 `null`이 샌다.

## 확인 문제

**1.** `PostMapper.search(...)`를 부르면 MyBatis는 XML에서 무엇을 보고 SQL을 고르나?

<details>
<summary>정답</summary>

`namespace`(= `org.example.e5.PostMapper`, 인터페이스의 전체 이름)와 `id`(= `search`, 메서드 이름)를 이은 `org.example.e5.PostMapper.search`가 열쇠다. 하나라도 다르거나 XML을 아예 못 읽었으면 `Invalid bound statement (not found): org.example.e5.PostMapper.search`.
</details>

**2.** `List<PostRow>`를 돌려주는 메서드의 `resultType`에는 무엇을 쓰나?

<details>
<summary>정답</summary>

`PostRow`(별칭 설정이 없으면 `org.example.e5.PostRow`). `resultType`은 **결과 한 줄**을 담을 타입이다. 몇 줄이든 MyBatis가 메서드의 반환 타입을 보고 `List`에 모아 준다.
</details>

**3.** `search(null, null)`이 145건을 돌려준 이유는? 목록 API에서 무엇을 조심해야 하나?

<details>
<summary>정답</summary>

두 `if`가 모두 거짓이라 `where` 태그가 `WHERE`째 지웠다. SQL이 `SELECT … FROM post ORDER BY id`가 되어 전부 읽는다. `where` 태그는 SQL을 문법에 맞게 다듬어 줄 뿐, 조건이 하나도 없을 때 막아 주지 않는다. 목록 API에는 `LIMIT`(페이지)과 기본 조건(삭제 안 된 글, 공개 글 등)을 늘 붙인다(10-7).
</details>

**4.** 서버는 잘 떴는데 API를 부르자 `Invalid bound statement (not found)`가 났다. 볼 곳 두 가지는?

<details>
<summary>정답</summary>

① **이름이 맞나** — XML `namespace`가 인터페이스 전체 이름과, `id`가 메서드 이름과 글자까지 같은가. ② **XML이 읽혔나** — 파일이 `src/main/resources` 아래, `mapper-locations` 패턴(`classpath:mapper/*.xml`)이 가리키는 곳에 있는가. 둘 다 메시지가 같고 시작할 때 경고도 없어서, 메시지만으로는 어느 쪽인지 모른다.
</details>

**5.** 검색어 `q`를 `LIKE '%${q}%'`로 쓰면 무엇이 달라지나?

<details>
<summary>정답</summary>

값이 `?`로 따로 가지 않고 SQL 글자에 그대로 박힌다(로그의 `Preparing`에 `'%Docker%'`가 보이고 `Parameters`에서 빠진다). 사용자가 `'`나 SQL 조각을 보내면 SQL 자체가 바뀐다(SQL 주입). 값은 `#{q}`로 쓰고 `LIKE CONCAT('%', #{q}, '%')`처럼 만든다.
</details>

## 더 깊이

- [W04 MyBatis XML 쿼리 실무](../docs/knowledge/W04-mybatis-xml-practical.md) — mapper·동적 SQL·`#{}`와 `${}`
- [W05 JPA vs MyBatis — 언제 무엇을, 섞어 쓰는 전략](../docs/knowledge/W05-jpa-vs-mybatis-strategy.md) · [W03 DB 접근 방식 총비교](../docs/knowledge/W03-db-access-comparison.md)
- 노하우 랩(Java 학습 → 노하우 랩): **L6** MyBatis 기초 — resultMap·association·collection · **L7** MyBatis 동적 SQL — `#{}`·`${}`, 안전한 정렬·조건 · **L9** JPA+MyBatis 한 트랜잭션
- 원문: [MyBatis Spring Boot Starter](https://mybatis.org/spring-boot-starter/mybatis-spring-boot-autoconfigure/) — 설정 항목·`@Mapper` 스캔 · [Mapper XML](https://mybatis.org/mybatis-3/sqlmap-xml.html) — `#{}`·resultType·resultMap·`useGeneratedKeys` · [동적 SQL](https://mybatis.org/mybatis-3/dynamic-sql.html) · [MyBatis-Spring 트랜잭션](https://mybatis.org/spring/transactions.html)

## 다음

- 실습: [10-7. 목록](../scenario/ch10-project/10-7-post-list.md)의 **선택 칸 "같은 목록을 MyBatis로 짜 보기"** — 기본은 JPA로 만들고, 같은 목록을 정렬·페이지·커서·태그·검색을 `if`·`choose`로 한 XML에 담아 다시 짠다. 확인 버튼은 같아서 어느 쪽으로 짜도 통과한다.
- 실습(선택): [10-12. JPA와 MyBatis를 한 트랜잭션에서](../scenario/ch10-project/10-12-jpa-mybatis-flush.md) — 둘을 같이 쓸 때 flush가 왜 필요한지.
- 실습: [8-4. 조합 검색](../scenario/ch8-query-deep/8-4-dynamic-search.md) — 8장도 같은 `practice` DB에서 SQL을 먼저 완성하고 API로 옮긴다.
- 레슨: [F1. 검증과 에러 응답(ProblemDetail)](F1-validation-errors.md)
