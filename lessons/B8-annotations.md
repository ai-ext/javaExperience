# B8. 어노테이션은 무엇인가 — 붙여 둔 표시, 읽는 쪽은 따로 있다

> 개념 레슨 · 30분

## 이게 뭐냐

Spring 코드는 `@`투성이다. `@RestController`, `@GetMapping("/posts")`, `@RequestBody`, `@Service`, `@Override`, `@JsonProperty`… 이것들을 **어노테이션**(annotation, "주석을 단다")이라고 한다.

결론부터 말하면 **어노테이션은 표시(라벨)일 뿐이다. 그 자체로는 아무 일도 하지 않는다.** 택배 상자에 붙인 "취급 주의" 스티커와 같다. 스티커가 상자를 지켜 주지는 않는다. 그 스티커를 **읽는 사람**(배달 기사)이 조심해서 다룰 뿐이다. 어노테이션도 누군가 읽어야 의미가 생긴다.

### 함수가 아니라 데이터다

`@GetMapping("/posts")`는 괄호까지 있어서 함수 호출처럼 보인다. 하지만 Java 어노테이션은 함수가 아니다. 클래스·메서드·매개변수에 **데이터를 붙여 둘 뿐**이다. 실행되는 코드는 어노테이션 안이 아니라 **그것을 읽는 쪽**에 있다.

### 누가 읽나

| 읽는 쪽 | 언제 | 예 | 표시가 없으면 |
|---|---|---|---|
| **컴파일러**(javac) | 컴파일할 때 | `@Override` — "부모의 메서드를 덮어쓴다. 아니면 에러를 내 줘" | 오타가 있어도 조용히 컴파일된다 |
| **컴파일 도구**(어노테이션 프로세서) | 컴파일할 때, 코드를 만들어 넣음 | Lombok의 `@Getter`·`@RequiredArgsConstructor` — getter·생성자를 대신 써 준다 | 그 메서드가 없다 |
| **Spring** | 앱을 띄울 때 | `@RestController`·`@Service` — "이 클래스의 객체를 만들어 관리해라", `@GetMapping("/posts")` — "이 주소는 이 메서드로" | 객체를 안 만든다. 주소표에 없다 → `404` |
| **Spring**(요청마다) | 요청이 올 때 | `@RequestBody` — "본문 JSON을 이 매개변수로", `@PathVariable` — "경로의 이 부분을 이 매개변수로" | 본문·경로에서 값을 가져오지 않는다 |
| **Jackson** | JSON으로 바꿀 때 | `@JsonProperty("user_name")` — "키 이름을 이걸로", `@JsonIgnore` — "이건 빼라" | getter·record 이름 그대로(B4) |
| **JPA** | 앱을 띄울 때·DB에 갈 때 | `@Entity`·`@Id`·`@Column` | 테이블과 짝을 안 짓는다 |

실행 중에 읽는 쪽(Spring·Jackson·JPA)은 **리플렉션**으로 읽는다. 리플렉션은 "실행 중에 클래스를 들여다보는 기능"이다. "이 클래스에 어떤 메서드가 있고, 각각 어떤 어노테이션이 붙어 있나"를 코드로 물어볼 수 있다. 아래 예시에서 직접 해 본다.

### 괄호 안의 값

`@GetMapping("/posts")`, `@RequestParam(defaultValue = "1")`처럼 괄호 안에 값을 넣을 수 있다. 이 값도 읽는 쪽이 꺼내 쓰는 데이터다. 이름 없이 하나만 쓰면 `value`라는 이름의 값이다.

## 예시

### ① 내 어노테이션을 만들고 내가 읽는다 — `AnnotationDemo.java`

Spring이 `@GetMapping`을 읽는 방식을 아주 작게 흉내 낸다.

```java
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Comparator;

public class AnnotationDemo {

    // 내 어노테이션 만들기 — "이 메서드는 주소 path를 맡는다"는 표시
    @Retention(RetentionPolicy.RUNTIME)   // 실행 중에도 남겨 둔다(그래야 읽을 수 있다)
    @interface Route {
        String value();
    }

    static class PostController {
        @Route("/posts")
        public String list() {
            return "글 목록";
        }

        @Route("/posts/new")
        public String form() {
            return "글쓰기 화면";
        }

        public String helper() {           // 표시 없음
            return "도우미";
        }

        @Override                          // 컴파일러에게: 부모(Object)의 toString을 덮어쓴다
        public String toString() {
            return "PostController";
        }
    }

    public static void main(String[] args) throws Exception {
        PostController controller = new PostController();
        System.out.println("객체: " + controller);   // toString()이 불린다

        // 어노테이션은 붙여 두기만 해서는 아무 일도 안 한다. 누군가 읽어야 한다 — 여기서는 내가 읽는다
        Method[] methods = PostController.class.getDeclaredMethods();
        Arrays.sort(methods, Comparator.comparing(Method::getName));   // 이름순으로(순서를 고정하려고)
        for (Method m : methods) {
            Route route = m.getAnnotation(Route.class);
            if (route != null) {
                System.out.println(route.value() + " → " + m.getName() + "() → " + m.invoke(controller));
            } else {
                System.out.println("(표시 없음) " + m.getName() + "()");
            }
        }
    }
}
```

```text
$ java AnnotationDemo.java
객체: PostController
/posts/new → form() → 글쓰기 화면
(표시 없음) helper()
/posts → list() → 글 목록
(표시 없음) toString()
```

- `@interface Route` — 어노테이션을 만드는 문법이다. `String value();`는 괄호 안에 넣을 값이다.
- `PostController.class.getDeclaredMethods()` — 리플렉션. "이 클래스의 메서드 목록을 줘".
- `m.getAnnotation(Route.class)` — "이 메서드에 `@Route`가 붙어 있나? 있으면 줘". 없으면 `null`.
- `@Route`가 붙은 메서드만 주소와 함께 실행됐다. Spring도 같은 일을 한다. 앱을 띄울 때 `@RestController`가 붙은 클래스를 찾고, 그 안에서 `@GetMapping`이 붙은 메서드를 찾아 "주소 → 메서드" 표를 만든다.

### ② Jackson이 읽는 어노테이션 — Spring 앱에서

Boot 4.1(Jackson 3.1.5)에서 실행했다. Boot 4의 Jackson 3는 패키지가 `tools.jackson`으로 바뀌었지만, **어노테이션은 그대로 `com.fasterxml.jackson.annotation`**이다(아래 import로 컴파일·실행 확인).

```java
package org.example.lesson;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AnnotationLessonController {

    public record UserResponse(
            @JsonProperty("user_name") String userName,   // JSON 키를 user_name으로
            @JsonIgnore String password,                  // JSON에서 뺀다
            int age) {
    }

    public record PlainUserResponse(String userName, String password, int age) {
    }

    @GetMapping("/api/lesson/b8/user")
    public UserResponse user() {
        return new UserResponse("김자바", "secret123", 20);
    }

    @GetMapping("/api/lesson/b8/plain-user")
    public PlainUserResponse plainUser() {
        return new PlainUserResponse("김자바", "secret123", 20);
    }
}
```

| 요청 | 응답(`200`) |
|---|---|
| `GET /api/lesson/b8/plain-user` | `{"userName":"김자바","password":"secret123","age":20}` |
| `GET /api/lesson/b8/user` | `{"user_name":"김자바","age":20}` |

같은 값인데 어노테이션 두 개로 키 이름이 바뀌고 `password`가 빠졌다. Java 코드의 `userName()`은 그대로다. 바뀐 것은 Jackson이 JSON을 만드는 방식뿐이다.

### ③ Spring이 읽는 어노테이션 — 없으면 Spring이 모른다

```java
package org.example.lesson;

import org.springframework.web.bind.annotation.GetMapping;

// @RestController가 없다 — Spring이 이 클래스를 모른다
public class NoAnnotationController {

    @GetMapping("/api/lesson/b8/hello")
    public String hello() {
        return "hello";
    }
}
```

`GET /api/lesson/b8/hello` → **`404`** `{"timestamp":"…","status":404,"error":"Not Found","path":"/api/lesson/b8/hello"}`. 서버 로그에는 아무것도 없다. `@GetMapping`은 붙어 있지만, Spring은 `@RestController`(또는 `@Controller`)가 붙은 클래스 안에서만 `@GetMapping`을 찾는다. 이 클래스는 아예 들여다보지 않는다.

## 따라 해 보기

15분.

1. `AnnotationDemo.java`를 만들고 `java AnnotationDemo.java` → 다섯 줄이 같은지 본다.
2. `helper()` 위에 `@Route("/help")`를 붙이고 다시 실행한다. `(표시 없음) helper()`가 `/help → helper() → 도우미`로 바뀐다. 메서드 안의 코드는 하나도 안 바꿨다. **읽는 쪽**이 표시를 보고 다르게 다뤘을 뿐이다.
3. javaExperience의 `org.example.lesson` 패키지에 `AnnotationLessonController.java`와 `NoAnnotationController.java`를 그대로 넣고 앱을 띄운다.

```bash
BASE=http://localhost:8080
curl -i "$BASE/api/lesson/b8/plain-user"
curl -i "$BASE/api/lesson/b8/user"
curl -i "$BASE/api/lesson/b8/hello"
```

기대: 위 표의 두 본문, 그리고 `hello`는 `404`.

4. `NoAnnotationController`의 `public class` 바로 위에 `@RestController`를 붙이고(import `org.springframework.web.bind.annotation.RestController`) 다시 띄운다. `hello`가 `200` `hello`로 바뀐다.
5. 지금까지 B 레슨에서 쓴 어노테이션을 하나씩 짚어 "누가 읽나"를 말해 본다: `@Override`(컴파일러), `@RestController`·`@GetMapping`·`@PostMapping`·`@RequestBody`·`@PathVariable`·`@ExceptionHandler`(Spring), `@JsonProperty`·`@JsonIgnore`(Jackson).

## 일부러 틀려 보기

줄 번호는 고친 파일 기준이다.

### ① `@Override`를 붙인 채 이름을 틀린다

`AnnotationDemo.java`의 `toString()`을 `tostring()`(소문자 s)으로 바꾼다.

```text
AnnotationDemo.java:30: error: method does not override or implement a method from a supertype
        @Override                          // 컴파일러에게: 부모(Object)의 toString을 덮어쓴다
        ^
1 error
error: compilation failed
```

컴파일러가 `@Override`를 읽고 "덮어쓴다더니 부모에 `tostring`이 없다"고 알려 준다.

이번엔 `@Override` 줄도 지우고 실행한다(`tostring()` 그대로).

```text
$ java AnnotationDemo.java
객체: AnnotationDemo$PostController@6ca8564a
/posts/new → form() → 글쓰기 화면
(표시 없음) helper()
/posts → list() → 글 목록
(표시 없음) tostring()
```

에러 없이 실행된다. 하지만 첫 줄이 `객체: PostController`가 아니다. `tostring()`은 덮어쓰기가 아니라 새 메서드가 됐고, `toString()`은 원래 것(`클래스이름@번호`)이 불렸다. `@Override`는 이런 **조용한 실수**를 컴파일 에러로 바꿔 주는 표시다. **고치기**: 이름을 `toString`으로 고치고 `@Override`를 다시 붙인다.

### ② `@Retention`을 지운다

`@Retention(RetentionPolicy.RUNTIME)` 줄을 지우고 실행한다.

```text
$ java AnnotationDemo.java
객체: PostController
(표시 없음) form()
(표시 없음) helper()
(표시 없음) list()
(표시 없음) toString()
```

`@Route`가 분명히 붙어 있는데 하나도 못 읽었다. `@Retention`을 안 쓰면 어노테이션은 클래스 파일에는 남지만 **실행 중에는 보이지 않는다**. 실행 중에 읽어야 하는 어노테이션(Spring·Jackson·JPA가 읽는 것들)은 모두 `RUNTIME`으로 만들어져 있다. **고치기**: 줄을 되돌린다.

### ③ `@RestController`를 빠뜨린다

위 [예시](#예시)의 ③ `NoAnnotationController`가 이 경우다. `404`이고 로그가 없어서 경로 오타와 구별이 안 된다. 0-2에서 이 고장을 하나씩 내 본다. 에러 도감: [경로 오타 (404)](../errors.md#경로-오타-404).

## 확인 문제

**1.** "어노테이션을 붙이면 그 코드가 실행된다"는 말은 맞나?

<details>
<summary>정답</summary>

틀리다. 어노테이션은 표시(데이터)일 뿐이다. 그것을 읽는 쪽(컴파일러·Lombok·Spring·Jackson·JPA)이 있어야 의미가 생긴다. 예시에서도 `@Route`를 붙였을 뿐인 메서드가 실행된 건, `main`의 리플렉션 코드가 그 표시를 찾아 불렀기 때문이다. 어노테이션 스스로 실행되는 코드는 없다.
</details>

**2.** 다음 어노테이션은 각각 누가 읽나? `@Override`, `@GetMapping`, `@JsonProperty`, `@Getter`(Lombok)

<details>
<summary>정답</summary>

`@Override` — 컴파일러(컴파일할 때 검사). `@GetMapping` — Spring(앱을 띄울 때 주소표를 만든다). `@JsonProperty` — Jackson(JSON으로 바꿀 때 키 이름). `@Getter` — Lombok 어노테이션 프로세서(컴파일할 때 getter 코드를 만들어 넣는다).
</details>

**3.** `@Override` 없이 `public String tostring()`을 쓰면 무슨 일이 생기나?

<details>
<summary>정답</summary>

컴파일도 실행도 된다. 하지만 `toString`을 덮어쓴 게 아니라 이름이 비슷한 새 메서드가 생긴다. 객체를 출력하면 원래 `toString`이 불려 `AnnotationDemo$PostController@6ca8564a` 같은 값이 나온다(실측). `@Override`를 붙였다면 `method does not override or implement a method from a supertype`으로 컴파일 단계에서 잡혔다.
</details>

**4.** 응답 record의 `String userName`을 JSON에서 `user_name`으로 내보내고 싶다. 무엇을 붙이나? Java 코드에서 값을 꺼내는 메서드 이름도 바뀌나?

<details>
<summary>정답</summary>

`@JsonProperty("user_name") String userName`. 실측 응답 `{"user_name":"김자바","age":20}`. Java 쪽 메서드는 그대로 `userName()`이다. 어노테이션은 Jackson이 JSON을 만드는 방식만 바꾼다.
</details>

**5.** 클래스에 `@GetMapping("/api/x")` 메서드가 있는데 요청하면 `404`다. 로그에는 아무것도 없다. 가장 먼저 무엇을 보나?

<details>
<summary>정답</summary>

클래스에 `@RestController`가 붙어 있는지 본다. Spring은 `@RestController`(또는 `@Controller`)가 붙은 클래스에서만 `@GetMapping`을 찾는다. 실측에서 `@RestController` 없는 클래스의 주소는 `404`였다. 그다음은 경로 오타, 클래스가 `org.example` 패키지 밖에 있는지(0-2).
</details>

## 더 깊이

- [P03 애노테이션이란 — 실무에서 매일 쓰는 것 총정리](../docs/knowledge/P03-annotations-cheatsheet.md)
- [P27 애노테이션은 누가·언제 실행하나](../docs/knowledge/P27-annotations-when-how.md) — 컴파일 시점·기동 시점·요청 시점 지도
- [J06 enum·애노테이션·리플렉션](../docs/knowledge/J06-enum-annotation-reflection.md) — `@Retention`·`@Target`과 리플렉션의 원리
- [W19 Lombok을 쓸까 말까](../docs/knowledge/W19-lombok-or-not.md) — 컴파일할 때 코드를 만들어 넣는 어노테이션
- [0-2 어노테이션은 무엇인가](../scenario/ch0-first-steps/0-2-annotations.md) — `@RestController`·`@GetMapping`을 떼어 보는 실습

## 다음

다음은 실습 [0-4. DTO 만들기](../scenario/ch0-first-steps/0-4-dto-rules.md) — B2~B4에서 본 생성자·`static`·record 규칙을 DTO에 그대로 써 보고, 일부러 고장 내 실제 에러를 본다.
