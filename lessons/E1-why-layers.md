# E1. 계층을 나누는 이유

> 개념 레슨 · 30분

## 이게 뭐냐

글 하나를 저장하는 API도 하는 일이 세 가지다.

1. **HTTP 다루기** — 본문 JSON을 객체로 받고, `201`·`Location`으로 돌려준다.
2. **규칙 지키기** — 제목이 비면 안 된다, 작성 시각은 서버 시계로 정한다.
3. **보관하기** — 메모리든 DB든 어딘가에 넣고 번호를 붙인다.

이 셋을 한 메서드에 다 넣어도 돌아간다. 문제는 **고칠 때**다. 세 가지는 바뀌는 이유가 서로 다르다. 그래서 백엔드는 보통 세 층으로 나눈다.

| 층 | 이름(관례) | 바뀌는 이유 |
|---|---|---|
| HTTP 층 | `PostController` | URL·상태 코드·헤더 같은 API 모양이 바뀔 때 |
| 규칙 층 | `PostService` | 업무 규칙이 바뀔 때("하루 10개까지만") |
| 보관 층 | `PostRepository` | 저장 방식이 바뀔 때(메모리 → MySQL) |

왜 나누는지는 [1-3 단계의 "왜 나누나"](../scenario/ch1-create-post/1-3-service-layer.md#왜-나누나)에서도 본다. 이 레슨은 나눈 뒤에 생기는 질문 하나를 다룬다. **나눠진 조각을 누가 이어 붙이나?**

### 의존성과 주입

- **의존성**: A가 일하려면 B가 있어야 하면 "A는 B에 의존한다"고 한다. 서비스는 저장소가 있어야 글을 저장할 수 있다. 그러니 서비스는 저장소에 의존한다.
- **주입**: A가 B를 **자기 안에서 만들지 않는다.** 바깥에서 만들어 A에게 넣어 준다.

서비스가 안에서 `new MemoryPostRepository()`를 하면, 저장소를 MySQL용으로 바꾸거나 테스트용 가짜로 바꿀 때마다 서비스 코드를 고쳐야 한다. 그래서 서비스는 **생성자 인자**로 저장소를 받기만 하고(생성자 주입), 무엇을 넣을지는 바깥이 정한다. 넣어 주는 쪽만 바꾸면 서비스는 그대로다.

그 "바깥"이 **Spring 컨테이너**다. 서버를 켤 때 객체를 만들고, 생성자 인자를 보고 필요한 객체를 넣어 준다. 컨테이너가 만든 객체 하나를 필요한 모든 곳이 같이 쓴다.

- **빈(bean)**: Spring이 만들어 보관하는 객체. `@Service`·`@Repository`·`@RestController`가 붙은 클래스는 서버를 켤 때 하나씩 만들어진다.
- **방향은 한쪽**: 컨트롤러 → 서비스 → 저장소. 아래층은 위층을 모른다. 저장소가 서비스를 부르면 순서가 꼬여서 서버가 뜨지 않는다.

## 예시

Spring 없이 **손으로** 조립해 본다. Spring이 대신 해 주는 일이 무엇인지 먼저 보려는 것이다. JDK 21의 `jshell`에서 실행한 그대로다.

```java
import java.util.*;

record Post(Long id, String title) {}

// 보관 층의 약속 — 몸통 없이 "이런 메서드가 있다"만 적는다
interface PostRepository {
    Post save(String title);
    List<Post> findAll();
}

// 약속의 메모리 구현
class MemoryPostRepository implements PostRepository {
    private final List<Post> store = new ArrayList<>();
    public Post save(String title) {
        Post p = new Post((long) store.size() + 1, title);
        store.add(p);
        return p;
    }
    public List<Post> findAll() { return store; }
}

// 규칙 층 — 저장소를 직접 만들지 않고 생성자로 받는다
class PostService {
    private final PostRepository repo;
    PostService(PostRepository repo) { this.repo = repo; }
    Post create(String title) {
        if (title.isBlank()) throw new IllegalArgumentException("제목이 비었다");
        return repo.save(title.strip());
    }
    List<Post> list() { return repo.findAll(); }
}
```

이제 조립한다. **저장소를 먼저 만들고, 그것을 넣어 서비스를 만든다.**

```text
jshell> PostRepository repo = new MemoryPostRepository()
repo ==> MemoryPostRepository@6a4f787b

jshell> PostService service = new PostService(repo)
service ==> PostService@7cd62f43

jshell> service.create("  첫 글  ")
$8 ==> Post[id=1, title=첫 글]

jshell> service.list()
$9 ==> [Post[id=1, title=첫 글]]
```

`@6a4f787b` 같은 뒷자리와 `$8` 같은 번호는 실행할 때마다 다르다.

Spring을 쓰면 위의 조립 두 줄을 직접 쓰지 않는다. 클래스에 표시만 해 둔다.

```java
@Repository
public class MemoryPostRepository implements PostRepository { ... }

@Service
public class PostService {
    private final PostRepository postRepository;

    // 생성자가 하나면 Spring이 이 인자를 보고 PostRepository 빈을 넣어 준다
    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }
}
```

서버를 켤 때 Spring은 손으로 조립할 때와 같은 순서로 일한다. 저장소를 만들고, 그것을 넣어 서비스를 만들고, 그 서비스를 넣어 컨트롤러를 만든다. 실제 Spring 코드와 실행 결과는 [1-3 단계의 따라 치기](../scenario/ch1-create-post/1-3-service-layer.md#따라-치기)에 있다.

## 따라 해 보기

10분. 터미널에서 `jshell`을 연다(JDK 21. `jshell --version`이 21이 아니면 IntelliJ가 쓰는 JDK의 `bin/jshell`을 쓴다).

**1. 위 예시를 붙여 넣고 조립한다.** `record`부터 `class PostService`까지 한 덩어리씩 붙여 넣는다. 그다음 `repo`·`service`를 만들고 `service.create("  첫 글  ")`를 실행한다. `Post[id=1, title=첫 글]`이 나와야 한다. 앞뒤 공백이 빠진 건 서비스의 규칙(`strip()`) 덕분이다.

**2. 저장소를 하나 더 만들어 본다.**

```text
jshell> PostService other = new PostService(new MemoryPostRepository())
other ==> PostService@5649fd9b

jshell> other.list()
$11 ==> []
```

방금 저장한 글이 `other`에서는 안 보인다. `other`는 **다른 저장소 객체**를 받았기 때문이다. 이 실수를 막으려고 Spring은 빈을 **하나만** 만들어 필요한 모든 곳에 같은 객체를 넣는다. 서비스 안에서 `new MemoryPostRepository()`를 하면 안 되는 이유가 이것이다.

**3. 구현을 갈아 끼운다.** 서비스는 한 글자도 안 고치고, 넣어 주는 저장소만 바꾼다.

```java
class LoggingPostRepository implements PostRepository {
    private final List<Post> store = new ArrayList<>();
    public Post save(String title) {
        System.out.println("[저장소] INSERT 대신 로그: " + title);
        Post p = new Post((long) store.size() + 100, title);
        store.add(p);
        return p;
    }
    public List<Post> findAll() { return store; }
}
```

```text
jshell> PostService swapped = new PostService(new LoggingPostRepository())
swapped ==> PostService@20322d26

jshell> swapped.create("둘째 글")
[저장소] INSERT 대신 로그: 둘째 글
$14 ==> Post[id=100, title=둘째 글]
```

실습(1-2부터)에서는 이 "구현"을 Spring Data JPA가 만들어 넣는다. 서비스는 `PostRepository`라는 **인터페이스**에만 기대므로, 테스트에서 가짜 저장소로 바꿔 넣는 일(7-2)도 이것과 같다.

## 일부러 틀려 보기

**1. 규칙을 어겨 본다.**

```text
jshell> service.create("   ")
|  Exception java.lang.IllegalArgumentException: 제목이 비었다
|        at PostService.create (#5:5)
|        at (#10:1)
```

규칙은 서비스에 있다. 그래서 컨트롤러를 거치든, 나중에 관리자 화면에서 부르든 똑같이 막힌다. (실제 API에서 이 실패를 `400`으로 돌려주는 일은 F1에서 한다.)

**2. 저장소 없이 서비스를 만들어 본다.**

```text
jshell> new PostService()
|  Error:
|  constructor PostService in class PostService cannot be applied to given types;
|    required: PostRepository
|    found:    no arguments
|    reason: actual and formal argument lists differ in length
```

생성자가 저장소를 요구하니, 저장소 없이 서비스를 만들 방법이 없다. 이게 생성자 주입의 장점이다. 빠뜨리면 실행 전에 막힌다. Spring 프로젝트에서도 같은 메시지가 나온다. → [에러 도감: 생성자 인자 불일치](../errors.md#생성자-인자-불일치)

Spring에서 표시(`@Service`)를 빠뜨리면 "빈을 찾을 수 없음"이 난다. 방향을 거꾸로 하면 "순환 참조"가 난다. 둘 다 1-3 단계의 "일부러 망가뜨리기"에서 직접 낸다. → [빈을 찾을 수 없음](../errors.md#빈을-찾을-수-없음) · [빈 순환 참조](../errors.md#빈-순환-참조)

## 확인 문제

**1.** 글 목록 응답에 전체 개수를 알려 주는 헤더 `X-Total-Count`를 추가하기로 했다. 어느 층을 고치나?

<details>
<summary>정답</summary>

**컨트롤러.** 헤더는 HTTP의 일이다. 서비스는 "전체 개수"라는 값을 돌려줄 수는 있지만, 그것을 헤더에 실을지 본문에 실을지는 모른다.
</details>

**2.** "한 회원은 1분에 글을 3개까지만 쓸 수 있다"는 규칙이 생겼다. 어느 층에 넣나?

<details>
<summary>정답</summary>

**서비스.** 업무 규칙이다. 컨트롤러에 넣으면 같은 기능을 다른 경로(관리자 API, 배치 작업)로 부를 때 규칙이 빠진다. 저장소는 "어디에 어떻게 보관하나"만 안다.
</details>

**3.** 따라 해 보기 2번에서 `other.list()`가 `[]`였다. 왜인가? Spring은 이 문제를 어떻게 막나?

<details>
<summary>정답</summary>

`other`는 새로 만든 **다른** `MemoryPostRepository`를 받았다. 저장소 객체가 둘이면 보관함도 둘이다. Spring은 `@Repository` 클래스로 빈을 **하나** 만들어 두고, 그 저장소가 필요한 모든 생성자에 **같은 객체**를 넣는다. 그래서 다른 빈은 직접 `new` 하지 않고 생성자로 받는다.
</details>

**4.** 저장소를 메모리에서 MySQL로 바꿀 때 `PostService` 코드를 고쳐야 하나?

<details>
<summary>정답</summary>

**안 고친다.** 서비스는 `PostRepository` 인터페이스 타입으로 받는다. 구현이 `MemoryPostRepository`에서 JPA 구현으로 바뀌어도, 서비스가 부르는 `save`라는 약속은 같다. 따라 해 보기 3번에서 `LoggingPostRepository`로 바꿀 때 서비스를 안 고친 것과 같다.
</details>

**5.** 저장소 안에서 "글을 저장하면 알림을 보내자"며 `PostService`를 생성자로 받게 했다. 무엇이 문제인가?

<details>
<summary>정답</summary>

**방향이 거꾸로다.** 서비스는 저장소를 받고 저장소는 서비스를 받으니, 둘 다 서로가 먼저 있어야 만들어진다. Spring은 `The dependencies of some of the beans in the application context form a cycle`로 서버를 띄우지 않는다. 알림은 서비스가 저장 **다음에** 부른다. 저장소는 위층을 몰라야 한다.
</details>

## 더 깊이

- [W02 왜 Controller·Service·Repository로 나누나](../docs/knowledge/W02-why-layers.md) — 안 나눴을 때와 나눴을 때의 코드 비교
- [W12 인터페이스는 왜 만드나](../docs/knowledge/W12-why-interfaces.md) — 구현을 갈아 끼우는 이유
- [P12 왜 빈과 IoC인가](../docs/knowledge/P12-why-beans-ioc-intro.md) — `new`를 직접 안 쓰는 이유
- [P11 빈 등록과 의존성 주입](../docs/knowledge/P11-bean-registration-di.md) — `@Service`·`@Repository`와 생성자 주입
- [S01 IoC와 DI](../docs/knowledge/S01-ioc-di.md) — 컨테이너가 빈을 만드는 순서(심화)

## 다음

- 실습: [1-3. 서비스로 나누기](../scenario/ch1-create-post/1-3-service-layer.md) — 컨트롤러에서 서비스를 떼어 내 태그까지 한 트랜잭션으로 저장하고, 일부러 망가뜨려 본다.
- 레슨: [E2. DB와 테이블·SQL 기초](E2-db-sql-basics.md) — 1-2에서 저장할 곳(MySQL)을 먼저 둘러본다.
