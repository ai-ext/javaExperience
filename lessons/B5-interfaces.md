# B5. 인터페이스와 구현 — 왜 Repository는 인터페이스인가

> 개념 레슨 · 30분

## 이게 뭐냐

Spring 코드를 열면 이런 게 자주 보인다.

```java
public interface PostRepository extends JpaRepository<Post, Long> {
}
```

몸통도 없는 **인터페이스**인데, 서비스는 이걸 받아서 `save`·`findById`를 부른다. 구현은 어디 있을까? 이 레슨에서 인터페이스가 무엇인지, 왜 저장소를 인터페이스로 두는지 본다.

### 인터페이스 = "이걸 할 수 있어야 한다"는 약속

```java
interface PostRepository {
    void save(String title);
    List<String> findAll();
}
```

메서드의 **모양만** 적고 몸통(`{ ... }`)은 없다. 이 약속을 지키는 클래스가 `implements PostRepository`라고 선언하고 메서드를 전부 채운다. 그 클래스를 **구현체**라고 한다.

### Java 인터페이스의 성질

| | Java `interface` |
|---|---|
| 무엇을 적나 | **메서드 약속**(`void save(...)`). 데이터 모양은 record나 class로(B4) |
| 맞는지 판단 | **`implements`라고 선언해야** 통과(이름 기반). 메서드 모양이 같다는 것만으로는 안 된다 |
| 실행할 때 | 남는다. 실행 중에 "이 객체가 `PostRepository`인가"를 안다 |

두 번째 줄이 가장 헷갈린다. Java는 메서드가 똑같아도 `implements`가 없으면 **다른 타입**이다. 아래 [일부러 틀려 보기](#일부러-틀려-보기)에서 직접 본다.

### 다형성 맛보기

```java
PostRepository repo = new MemoryPostRepository();
```

**변수의 타입은 인터페이스, 실제 객체는 구현체.** `repo.save(...)`를 부르면 실제 객체(`MemoryPostRepository`)의 `save`가 실행된다. 같은 코드 `repo.save(...)`가 어떤 객체가 들어 있느냐에 따라 다르게 동작한다. 이것을 **다형성**이라고 한다.

### 그래서 저장소가 인터페이스인 이유

서비스가 **인터페이스만** 알면, 구현을 바꿔도 서비스 코드는 그대로다.

- 메모리에 저장하는 구현을 DB에 저장하는 구현으로 바꿔도, 서비스가 저장소를 부르는 코드는 그대로 둘 수 있다. 실습 1장은 처음(1-2)부터 DB에 저장하는 구현을 쓴다. 그 구현은 아래 Spring Data JPA가 만든다.
- 테스트에서는 DB 없이 가짜 구현을 넣는다.
- **Spring Data JPA**는 한 걸음 더 간다. `interface PostRepository extends JpaRepository<Post, Long>`만 쓰면, 구현 클래스를 **Spring이 실행 중에 만들어** 넣어 준다. 그래서 코드에 구현체가 안 보인다. 이건 E3에서 다시 본다.

## 예시

`RepoDemo.java` — 그대로 실행한 결과다(Java 21). `List<String>`은 "문자열 리스트"다. 자세한 건 B6. `@Override`는 "인터페이스의 메서드를 채운다"는 표시다(B8).

```java
import java.util.ArrayList;
import java.util.List;

public class RepoDemo {

    // 인터페이스 — "저장소라면 이 두 가지를 할 수 있어야 한다"는 약속만 적는다. 몸통이 없다
    interface PostRepository {
        void save(String title);
        List<String> findAll();
    }

    // 구현 1 — 메모리(리스트)에 저장
    static class MemoryPostRepository implements PostRepository {
        private final List<String> posts = new ArrayList<>();

        @Override
        public void save(String title) {
            posts.add(title);
        }

        @Override
        public List<String> findAll() {
            return posts;
        }
    }

    // 구현 2 — 저장할 때마다 로그를 찍는 저장소(진짜라면 DB에 넣는 구현이 여기 온다)
    static class LoggingPostRepository implements PostRepository {
        private final List<String> posts = new ArrayList<>();

        @Override
        public void save(String title) {
            System.out.println("[로그] 저장: " + title);
            posts.add(title);
        }

        @Override
        public List<String> findAll() {
            return posts;
        }
    }

    // 서비스는 인터페이스만 안다 — 어떤 구현이 들어올지 모른다
    static class PostService {
        private final PostRepository repository;

        PostService(PostRepository repository) {
            this.repository = repository;
        }

        String write(String title) {
            repository.save(title);
            return "글 " + repository.findAll().size() + "개";
        }
    }

    public static void main(String[] args) {
        PostService a = new PostService(new MemoryPostRepository());
        System.out.println(a.write("첫 글"));
        System.out.println(a.write("둘째 글"));

        PostService b = new PostService(new LoggingPostRepository());   // 서비스 코드는 한 줄도 안 바꿨다
        System.out.println(b.write("첫 글"));

        PostRepository repo = new MemoryPostRepository();   // 변수 타입은 인터페이스, 객체는 구현
        System.out.println(repo.getClass().getSimpleName());
    }
}
```

```text
$ java RepoDemo.java
글 1개
글 2개
[로그] 저장: 첫 글
글 1개
MemoryPostRepository
```

- `PostService`는 생성자로 `PostRepository`를 받는다. 무엇을 넣을지는 **밖에서** 정한다. Spring 앱에서는 이 "밖"이 Spring이다(생성자 주입, 1-3).
- 마지막 줄 — 변수 타입은 `PostRepository`지만 실제 객체의 클래스는 `MemoryPostRepository`다.

## 따라 해 보기

10분.

1. `RepoDemo.java`를 만들고 `java RepoDemo.java` → 다섯 줄이 같은지 본다.
2. 구현을 하나 더 만든다. `LoggingPostRepository` 아래에 넣는다.

```java
    // 구현 3 — 제목을 대문자로 바꿔 저장
    static class UpperPostRepository implements PostRepository {
        private final List<String> posts = new ArrayList<>();

        @Override
        public void save(String title) {
            posts.add(title.toUpperCase());
        }

        @Override
        public List<String> findAll() {
            return posts;
        }
    }
```

3. `main` 끝에 두 줄을 넣는다.

```java
        PostService c = new PostService(new UpperPostRepository());
        System.out.println(c.write("hello") + " " + c.repository.findAll());
```

실행해서 마지막 줄이 `글 1개 [HELLO]`이면 된다. 서비스 코드는 손대지 않고 저장 방식만 바꿨다.

4. javaExperience에서 1-3을 했다면 `PostService`의 생성자를 열어 본다. 매개변수 타입이 인터페이스인지, 구현 클래스인지 확인한다.

## 일부러 틀려 보기

줄 번호는 고친 파일 기준이다.

### ① 약속한 메서드 하나를 안 채운다

`MemoryPostRepository`에서 `findAll()` 메서드를 지운다.

```text
RepoDemo.java:13: error: MemoryPostRepository is not abstract and does not override abstract method findAll() in PostRepository
    static class MemoryPostRepository implements PostRepository {
           ^
1 error
error: compilation failed
```

"`implements`라고 했으면 약속한 메서드를 **전부** 채워라"는 뜻이다. **고치기**: 빠진 메서드를 만든다. IntelliJ에서는 클래스 이름에 커서를 두고 `⌥↩`(Alt+Enter) → Implement methods로 빈 틀을 만들어 준다.

### ② 인터페이스를 `new` 한다

`PostRepository repo = new MemoryPostRepository();`를 `new PostRepository()`로 바꾼다.

```text
RepoDemo.java:65: error: PostRepository is abstract; cannot be instantiated
        PostRepository repo = new PostRepository();   // 변수 타입은 인터페이스, 객체는 구현
                              ^
1 error
error: compilation failed
```

약속에는 몸통이 없어서 객체로 만들 수 없다. **고치기**: 구현체를 `new` 한다.

### ③ 모양은 같은데 `implements`가 없다

`main` 위에 이런 클래스를 넣고 `new PostService(new FakePostRepository())`로 넘긴다.

```java
    // 메서드 모양은 똑같지만 implements PostRepository가 없다
    static class FakePostRepository {
        public void save(String title) { }
        public List<String> findAll() { return List.of(); }
    }
```

```text
RepoDemo.java:68: error: constructor PostService in class PostService cannot be applied to given types;
        PostService b = new PostService(new FakePostRepository());   // 서비스 코드는 한 줄도 안 바꿨다
                        ^
  required: PostRepository
  found:    FakePostRepository
  reason: argument mismatch; FakePostRepository cannot be converted to PostRepository
1 error
error: compilation failed
```

메서드 모양이 똑같아도 소용없다. Java는 `implements PostRepository`라고 **이름으로 선언**해야 그 타입으로 인정한다. **고치기**: `static class FakePostRepository implements PostRepository`.

## 확인 문제

**1.** `interface Notifier { void send(String message); }`를 구현하는 `EmailNotifier`를 선언하는 첫 줄을 써라.

<details>
<summary>정답</summary>

`class EmailNotifier implements Notifier {`. 그리고 몸통에 `public void send(String message) { … }`를 반드시 채워야 한다. 빠뜨리면 `is not abstract and does not override abstract method send(String)` 컴파일 에러다.
</details>

**2.** 메서드가 `PostRepository`와 똑같은 클래스를 `PostRepository` 자리에 넘겼더니 컴파일 에러가 났다. 왜이고, 어떻게 고치나?

<details>
<summary>정답</summary>

Java는 메서드 모양이 아니라 이름(선언)으로 타입을 판단한다. Java에서 어떤 클래스가 `PostRepository`로 인정받으려면 `implements PostRepository`를 직접 써야 한다. 실측 에러: `FakePostRepository cannot be converted to PostRepository`.
</details>

**3.** `PostRepository repo = new MemoryPostRepository(); repo.save("x");`에서 실행되는 `save`는 누구의 것인가?

<details>
<summary>정답</summary>

`MemoryPostRepository`의 `save`다. 변수 타입(인터페이스)은 "부를 수 있는 메서드 목록"을 정하고, 실제로 실행되는 몸통은 객체의 클래스가 정한다. 이것이 다형성이다.
</details>

**4.** 서비스가 `MemoryPostRepository`(구현 클래스)를 직접 받지 않고 `PostRepository`(인터페이스)를 받으면 무엇이 좋은가? 두 가지.

<details>
<summary>정답</summary>

(1) 저장 방식을 바꿔도(메모리 → DB) 서비스 코드를 고치지 않는다. 예시에서 `LoggingPostRepository`로 바꿔도 `PostService`는 그대로였다. (2) 테스트할 때 DB 없이 가짜 구현을 넣을 수 있다.
</details>

**5.** Spring Data JPA의 `interface PostRepository extends JpaRepository<Post, Long> {}`에는 구현 클래스가 안 보인다. 그런데 어떻게 `save`가 동작하나?

<details>
<summary>정답</summary>

Spring이 앱을 띄울 때 이 인터페이스의 구현 객체를 만들어 빈으로 등록하고, 그 객체를 서비스 생성자에 넣어 준다. 개발자는 약속(인터페이스)만 쓰고 구현은 Spring이 맡는다. 인터페이스이기 때문에 가능한 방식이다.
</details>

## 더 깊이

- [W12 인터페이스는 왜 만드나](../docs/knowledge/W12-why-interfaces.md) — DI·테스트, 그리고 언제는 만들지 말아야 하나
- [J02 OOP와 Object 규약](../docs/knowledge/J02-oop-object-contracts.md) — 상속·다형성·추상 클래스
- [P12 왜 new 대신 빈으로 받나](../docs/knowledge/P12-why-beans-ioc-intro.md) — 생성자로 구현을 받는 이유(IoC·DI)
- [1-3 서비스 계층](../scenario/ch1-create-post/1-3-service-layer.md) — 저장소를 서비스에 넣어 쓰는 실습

## 다음

[B6. List·Map·Optional·람다 맛보기](B6-collections-optional-lambda.md) — 목록을 거르고(`filter`) 바꾸는(`map`) 코드, 그리고 없을 수도 있는 값(`Optional`).
