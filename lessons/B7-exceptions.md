# B7. 예외 — try/catch, 체크·언체크

> 개념 레슨 · 30분

## 이게 뭐냐

예외는 "여기서는 더 진행할 수 없다"를 알리는 방법이다. 문제가 생긴 곳에서 **던지고**(`throw`), 처리할 수 있는 곳에서 **잡는다**(`catch`).

```java
try {
    String title = findTitle(7);
} catch (PostNotFoundException e) {
    System.out.println(e.getMessage());
} finally {
    System.out.println("끝");
}
```

| | Java |
|---|---|
| 던지기 | `throw new IllegalArgumentException("…")` — `new` 필수 |
| 잡기 | **`catch (타입 e)`** — 타입별로 여러 개 둘 수 있다. 위에서부터 처음 맞는 것 하나만 실행 |
| 메시지 | `e.getMessage()` |
| 예외 종류 | 클래스가 많다: `IllegalArgumentException`, `NullPointerException`, `IOException` … 직접 만들기도 한다 |
| `finally` | 예외가 났든 안 났든 마지막에 실행 |
| 안 잡으면 | 그 스레드가 멈추고 **스택트레이스**가 찍힌다 |

### 체크 예외와 언체크 예외

Java 예외는 두 갈래다.

| | 언체크 예외(unchecked) | 체크 예외(checked) |
|---|---|---|
| 부모 | `RuntimeException` | `Exception`(단, `RuntimeException`이 아닌 것) |
| 예 | `IllegalArgumentException`, `NullPointerException`, `NumberFormatException`, 내가 만든 `PostNotFoundException` | `IOException`(파일·네트워크), `SQLException` |
| 컴파일러가 | 아무 말 안 한다 | **"잡든지, `throws`로 밝히든지 해라"** — 안 하면 컴파일 에러 |

체크 예외는 "이 메서드는 이런 실패가 날 수 있다"를 메서드 시그니처에 적게 한다: `String readMemo(String path) throws IOException`. 부르는 쪽은 `try/catch`로 잡거나, 자기도 `throws IOException`을 붙여 위로 넘겨야 한다.

실무 Spring 코드에서는 **내가 만드는 예외는 거의 언체크**(`extends RuntimeException`)로 만든다. 체크 예외는 JDK나 라이브러리를 쓸 때 만난다.

### 백엔드에서 예외가 HTTP 상태가 되는 길

컨트롤러 메서드에서 예외가 밖으로 나가면 Spring이 받는다. 그다음은 세 갈래다.

| 던진 것 | 응답 | 서버 로그 |
|---|---|---|
| 아무도 처리하지 않는 예외(`IllegalArgumentException` 등) | **`500`** | `ERROR` + 스택트레이스 |
| `ResponseStatusException(HttpStatus.NOT_FOUND, "…")` | 그 상태 코드(`404`) | 기본 수준에선 **없음** |
| 내 예외 + `@ExceptionHandler`로 처리 | 내가 정한 상태 코드와 본문 | 없음(내가 찍지 않으면) |

클라이언트가 `404`를 받아 "글이 없어요"를 보여 준다면, 그 404는 서버 어딘가에서 예외를 이렇게 바꾼 결과다. 아무도 바꾸지 않으면 모든 실패가 `500`이 되고, 클라이언트는 원인을 알 수 없다. 이 장치들을 어디에 두는지는 F1(ProblemDetail)과 2장에서 다시 다룬다.

## 예시

### ① 예외 던지고 잡기 — `ExceptionDemo.java`

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class ExceptionDemo {

    // 내가 만든 언체크 예외 — RuntimeException을 상속한다
    static class PostNotFoundException extends RuntimeException {
        PostNotFoundException(long id) {
            super("글이 없습니다: " + id);
        }
    }

    static String findTitle(long id) {
        if (id != 1) {
            throw new PostNotFoundException(id);   // 던지기
        }
        return "첫 글";
    }

    // 체크 예외(IOException)를 던질 수 있는 메서드 — throws로 밝혀야 한다
    static String readMemo(String path) throws IOException {
        return Files.readString(Path.of(path));
    }

    public static void main(String[] args) {
        // 1) 언체크 예외 잡기
        try {
            System.out.println(findTitle(1));
            System.out.println(findTitle(7));
            System.out.println("여기는 실행되지 않는다");
        } catch (PostNotFoundException e) {
            System.out.println("잡았다: " + e.getMessage());
        }

        // 2) JDK가 던지는 언체크 예외
        try {
            int page = Integer.parseInt("둘");
        } catch (NumberFormatException e) {
            System.out.println("숫자가 아니다: " + e.getMessage());
        } finally {
            System.out.println("finally는 언제나 실행된다");
        }

        // 3) 체크 예외 — 잡지 않으면 컴파일이 안 된다
        try {
            System.out.println(readMemo("없는-파일.txt"));
        } catch (IOException e) {
            System.out.println("파일 문제: " + e.getClass().getSimpleName() + " " + e.getMessage());
        }

        // 4) 아무도 안 잡으면 — 프로그램이 멈추고 스택트레이스가 찍힌다
        findTitle(42);
    }
}
```

```text
$ java ExceptionDemo.java
첫 글
잡았다: 글이 없습니다: 7
숫자가 아니다: For input string: "둘"
finally는 언제나 실행된다
파일 문제: NoSuchFileException 없는-파일.txt
Exception in thread "main" ExceptionDemo$PostNotFoundException: 글이 없습니다: 42
	at ExceptionDemo.findTitle(ExceptionDemo.java:16)
	at ExceptionDemo.main(ExceptionDemo.java:53)
```

- `super("글이 없습니다: " + id)` — 부모(`RuntimeException`) 생성자에 메시지를 넘긴다. `getMessage()`가 이걸 돌려준다.
- `findTitle(7)`에서 예외가 나자 그 아래 줄(`여기는 실행되지 않는다`)은 건너뛰고 `catch`로 갔다.
- `NoSuchFileException`은 `IOException`의 한 종류라 `catch (IOException e)`에 잡혔다.
- 마지막 스택트레이스는 **위에서 아래로** 읽는다. 첫 줄 = 예외 종류와 메시지, 다음 `at` 줄 = 예외가 난 자리(`findTitle`, 16번 줄), 그다음 = 그걸 부른 자리(`main`, 53번 줄).

### ② Spring 앱에서 — 예외가 상태 코드가 된다

Boot 4.1에서 실행했다. 예외 클래스는 별도 파일로 둔다.

`PostNotFoundException.java`

```java
package org.example.lesson;

// 언체크 예외 — RuntimeException을 상속하면 throws를 안 써도 된다
public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(long id) {
        super("글이 없습니다: " + id);
    }
}
```

`ExceptionLessonController.java`

```java
package org.example.lesson;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class ExceptionLessonController {

    // ① 아무도 안 잡는 예외 → 500
    @GetMapping("/api/lesson/b7/raw/{id}")
    public String raw(@PathVariable Long id) {
        if (id != 1) {
            throw new IllegalArgumentException("글이 없습니다: " + id);
        }
        return "글 1";
    }

    // ② 상태 코드를 담은 예외 → 그 상태 코드
    @GetMapping("/api/lesson/b7/status/{id}")
    public String status(@PathVariable Long id) {
        if (id != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "글이 없습니다: " + id);
        }
        return "글 1";
    }

    // ③ 내 예외 + @ExceptionHandler → 내가 정한 상태 코드·본문
    @GetMapping("/api/lesson/b7/handled/{id}")
    public String handled(@PathVariable Long id) {
        if (id != 1) {
            throw new PostNotFoundException(id);
        }
        return "글 1";
    }

    @ExceptionHandler(PostNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(PostNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }
}
```

`id`가 1이면 셋 다 `200` `글 1`이다. `id`가 7일 때:

| 요청 | 상태 | 본문 |
|---|---|---|
| `GET /api/lesson/b7/raw/7` | `500` | `{"timestamp":"…","status":500,"error":"Internal Server Error","path":"/api/lesson/b7/raw/7"}` |
| `GET /api/lesson/b7/status/7` | `404` | `{"timestamp":"…","status":404,"error":"Not Found","path":"/api/lesson/b7/status/7"}` |
| `GET /api/lesson/b7/handled/7` | `404` | `{"message":"글이 없습니다: 7"}` |

- `raw`일 때만 서버 로그가 찍혔다.

```text
ERROR … o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: java.lang.IllegalArgumentException: 글이 없습니다: 7] with root cause

java.lang.IllegalArgumentException: 글이 없습니다: 7
	at org.example.lesson.ExceptionLessonController.raw(ExceptionLessonController.java:20) ~[!/:1.0-SNAPSHOT]
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103) ~[na:na]
	…(Spring·Tomcat 줄이 수십 줄 이어진다)
```

  읽을 줄은 예외 줄과 **첫 `at org.example` 줄**(`ExceptionLessonController.java:20`)이다. (줄 끝의 `~[!/:1.0-SNAPSHOT]`는 `java -jar`로 띄웠을 때 모양이고, `./gradlew bootRun`이면 `~[main/:na]`다.)
- `status`의 본문에는 내가 쓴 메시지 `글이 없습니다: 7`이 **없다**. Boot는 기본으로 예외 메시지를 응답에 넣지 않는다(내부 정보가 새지 않게). 로그도 없다.
- `handled`는 본문까지 내가 정했다. 실무에서는 이 `@ExceptionHandler`를 한 클래스(`@RestControllerAdvice`)에 모아 모든 컨트롤러에 적용한다(F1).

## 따라 해 보기

15분.

1. `ExceptionDemo.java`를 만들고 `java ExceptionDemo.java` → 여덟 줄이 같은지 본다. 스택트레이스의 `ExceptionDemo.java:16`이 `throw new PostNotFoundException(id);` 줄인지 파일에서 확인한다.
2. `findTitle(42);`를 `try { findTitle(42); } catch (PostNotFoundException e) { System.out.println("마지막도 잡았다"); }`로 감싼다. 다시 실행하면 스택트레이스 대신 `마지막도 잡았다`가 나온다.
3. javaExperience의 `org.example.lesson` 패키지에 `PostNotFoundException.java`와 `ExceptionLessonController.java`를 그대로 넣고 앱을 띄운다.
4. 요청을 보낸다.

```bash
BASE=http://localhost:8080
curl -i "$BASE/api/lesson/b7/raw/1"
curl -i "$BASE/api/lesson/b7/raw/7"
curl -i "$BASE/api/lesson/b7/status/7"
curl -i "$BASE/api/lesson/b7/handled/7"
```

기대: `200` → `500` → `404` → `404`. 본문은 위 표와 같다(`timestamp` 값만 다르다). IntelliJ 실행 창에는 `raw/7`일 때만 `ERROR`와 스택트레이스가 보이고, 첫 `at org.example` 줄을 누르면 20번 줄로 간다.

## 일부러 틀려 보기

줄 번호는 고친 파일 기준이다.

### ① 체크 예외를 잡지 않는다

`ExceptionDemo.java`의 3)번 `try { … } catch (IOException e) { … }`를 지우고 `System.out.println(readMemo("없는-파일.txt"));` 한 줄만 남긴다.

```text
ExceptionDemo.java:46: error: unreported exception IOException; must be caught or declared to be thrown
        System.out.println(readMemo("없는-파일.txt"));   // try/catch를 지웠다
                                   ^
1 error
error: compilation failed
```

"보고되지 않은 예외 `IOException` — 잡거나(`catch`), 던진다고 밝혀라(`throws`)". 실행해 보기도 전에 컴파일러가 막는다. 이것이 체크 예외다. **고치기**: `try/catch`로 감싸거나, `main`에 `throws IOException`을 붙인다. 같은 자리에서 `findTitle(42)`(언체크)는 아무 말 없이 컴파일됐다는 점과 비교한다.

### ② 넓은 예외를 먼저 잡는다

2)번의 `catch`를 이렇게 바꾼다.

```java
        } catch (RuntimeException e) {                    // 넓은 것을 먼저 잡았다
            System.out.println("뭔가 잘못됐다: " + e.getMessage());
        } catch (NumberFormatException e) {
            System.out.println("숫자가 아니다: " + e.getMessage());
        } finally {
```

```text
ExceptionDemo.java:41: error: exception NumberFormatException has already been caught
        } catch (NumberFormatException e) {
          ^
1 error
error: compilation failed
```

`NumberFormatException`은 `RuntimeException`의 한 종류다. 위의 `catch (RuntimeException e)`가 이미 다 잡으니 아래 `catch`에는 영영 갈 일이 없다. **고치기**: 좁은(구체적인) 예외를 위에, 넓은 예외를 아래에 둔다.

## 확인 문제

**1.** `class PostNotFoundException extends RuntimeException`과 `class PostNotFoundException extends Exception`의 차이는?

<details>
<summary>정답</summary>

앞은 언체크 예외라 던지는 메서드에 `throws`를 안 써도 되고, 부르는 쪽도 잡을 의무가 없다. 뒤는 체크 예외라 던지는 메서드마다 `throws PostNotFoundException`을 쓰고, 부르는 쪽은 잡거나 다시 `throws`해야 한다. 안 하면 `unreported exception … must be caught or declared to be thrown` 컴파일 에러. Spring에서 내 예외는 보통 앞의 방식으로 만든다.
</details>

**2.** 컨트롤러에서 `throw new IllegalArgumentException("글이 없습니다")`를 하고 아무 처리도 안 했다. 클라이언트가 받는 상태 코드는?

<details>
<summary>정답</summary>

`500`이다. 실측 `raw/7`이 `500`, 본문은 `{"timestamp":…,"status":500,"error":"Internal Server Error",…}`였다. 메시지 `글이 없습니다`도 본문에 없다. 클라이언트는 "서버 오류"밖에 알 수 없다.
</details>

**3.** "글이 없을 때 404"를 만드는 방법 두 가지를 말하라.

<details>
<summary>정답</summary>

(1) `throw new ResponseStatusException(HttpStatus.NOT_FOUND, "…")`. (2) 내 예외(`PostNotFoundException`)를 던지고 `@ExceptionHandler(PostNotFoundException.class)` 메서드에서 `ResponseEntity.status(HttpStatus.NOT_FOUND)…`를 돌려준다. (2)는 본문 모양까지 정할 수 있다. 실측 `{"message":"글이 없습니다: 7"}`.
</details>

**4.** 0-5 단계에서 실제로 찍힌 스택트레이스의 앞부분이다. 어느 파일 몇 번째 줄부터 보나? 무엇이 문제인가?

```text
java.lang.NullPointerException: Cannot invoke "String.toUpperCase()" because "nickname" is null
	at org.example.start.MemberController.find(MemberController.java:20) ~[main/:na]
	at java.base/jdk.internal.reflect.DirectMethodHandleAccessor.invoke(DirectMethodHandleAccessor.java:103) ~[na:na]
	at java.base/java.lang.reflect.Method.invoke(Method.java:580) ~[na:na]
```

<details>
<summary>정답</summary>

`MemberController.java`의 20번 줄. 첫 줄이 무엇이 터졌는지 말한다. `nickname`이 `null`인데 `toUpperCase()`를 불렀다. 그 아래 첫 `at org.example` 줄이 예외가 난 내 코드 자리다. 그 밑의 `java.base/…`·Spring 줄들은 내 메서드를 불러 준 쪽이라 처음엔 안 봐도 된다. 순서는 [에러 도감 — 스택트레이스 읽는 순서](../errors.md#스택트레이스-읽는-순서)에 정리돼 있다.
</details>

**5.** `catch (Exception e)`를 맨 위에 두고 그 아래 `catch (IOException e)`를 두면?

<details>
<summary>정답</summary>

컴파일 에러다. `IOException`은 `Exception`의 한 종류라 위에서 이미 다 잡힌다. `ExceptionDemo.java`의 3)번을 그렇게 바꿔 실행한 결과: `error: exception IOException has already been caught`. 구체적인 것을 위에, 넓은 것을 아래에 둔다.
</details>

## 더 깊이

- [J04 예외 처리](../docs/knowledge/J04-exceptions.md) — 예외 계층, 체크 예외 논쟁, 예외 감싸기(`Caused by`)
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 계층별 처리와 전역 핸들러(`@RestControllerAdvice`)
- [0-5 에러 읽기](../scenario/ch0-first-steps/0-5-read-stack-trace.md) — 앱 로그에서 내 코드 줄을 찾는 실습
- 에러 도감 [스택트레이스 읽는 순서](../errors.md#스택트레이스-읽는-순서)

## 다음

[B8. 어노테이션은 무엇인가](B8-annotations.md) — 이번에 쓴 `@ExceptionHandler`, `@RestController` 같은 `@` 표시는 누가 읽나.
