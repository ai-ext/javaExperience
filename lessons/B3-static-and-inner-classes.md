# B3. static과 안쪽 클래스 — DTO 함정의 뿌리

> 개념 레슨 · 30분

## 이게 뭐냐

첫 수업에서 컨트롤러 **안에** DTO 클래스를 만들었더니 "기본 생성자가 없다"는 에러가 났다. 생성자는 분명히 있었다. 원인은 `static` 한 단어였다. 이 레슨은 그 이유를 끝까지 따라간다.

### `static` = 객체가 아니라 클래스에 붙은 것

B2에서 필드는 "객체마다 하나씩" 있었다. `static`을 붙이면 **클래스에 하나만** 있고, 모든 객체가 같이 쓴다. 메서드에 붙이면 **객체 없이** 클래스 이름으로 부른다.

| | 인스턴스(보통) | `static` |
|---|---|---|
| 필드 | 객체마다 따로(`kim.age`, `lee.age`) | 클래스에 하나(`Counter.total`) |
| 메서드 | 객체가 있어야 부른다(`kim.introduce()`) | 클래스 이름으로 부른다(`Integer.parseInt("42")`, `Math.max(3, 7)`) |
| `this` | 있다 | **없다** — 어느 객체인지 모르니까 |

이미 본 `static`도 있다. `public static void main(String[] args)` — 프로그램이 시작할 때는 아직 객체가 하나도 없으니 시작점은 `static`이어야 한다. 실무에서는 상수(`private static final int MAX_SIZE = 50;`)와 로거(`private static final Logger log`)에 주로 붙인다.

### 안쪽 클래스 — static이 붙느냐 마느냐

Java는 클래스 안에 클래스를 둘 수 있다. 두 종류가 있다.

```java
public class Board {
    class Inner { }          // static 없음 — Board 객체 하나에 "딸린" 클래스
    static class Nested { }  // static 있음 — 이름만 Board 안에 있는 독립 클래스
}
```

- **`Inner`(비정적 안쪽 클래스)** — 만들 때 **바깥 `Board` 객체가 반드시 있어야** 한다. 바깥 객체의 필드를 그냥 쓸 수 있는 대신, 컴파일러가 생성자에 **바깥 객체를 받는 숨은 매개변수**를 넣는다. 겉으로는 `Inner()`처럼 보여도 실제로는 `Inner(Board)`다.
- **`Nested`(static 안쪽 클래스)** — 바깥 객체와 상관없다. `new Board.Nested()`로 바로 만든다.
- **`record`** — 클래스 안에 두면 **저절로 static**이다.

`static` 한 단어 차이라 눈으로는 잘 안 보인다. 그런데 컨트롤러 안에 요청 DTO를 안쪽 클래스로 두는 일이 흔해서, 이 차이가 바로 에러로 이어진다.

### 그래서 Jackson이 못 만든다

요청 본문 JSON을 DTO로 바꾸는 Jackson은 DTO 객체를 **직접 만들어야** 한다. 비정적 안쪽 클래스는 바깥 객체(컨트롤러 객체)가 있어야 만들 수 있는데, Jackson은 그걸 갖고 있지 않다. 숨은 매개변수 때문에 "인자 없는 생성자"도 없다. 그래서 에러 문장이 "기본 생성자 없음"처럼 읽힌다.

## 예시

### ① static 필드와 메서드 — `Counter.java`

```java
public class Counter {
    static int total = 0;     // static 필드 — 클래스에 하나. 모든 객체가 같이 쓴다
    int mine = 0;             // 인스턴스 필드 — 객체마다 하나

    void click() {
        total++;
        mine++;
    }

    // static 메서드 — 객체 없이 부른다. 그래서 mine(객체의 필드)은 쓸 수 없다
    static String report() {
        return "전체 클릭 " + total + "번";
    }

    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = new Counter();
        a.click();
        a.click();
        b.click();
        System.out.println("a.mine = " + a.mine + ", b.mine = " + b.mine);
        System.out.println("Counter.total = " + Counter.total);
        System.out.println(Counter.report());

        // JDK에 있는 static 메서드들 — 객체를 만들지 않고 클래스 이름으로 부른다
        System.out.println(Integer.parseInt("42") + 1);
        System.out.println(Math.max(3, 7));
    }
}
```

```text
$ java Counter.java
a.mine = 2, b.mine = 1
Counter.total = 3
전체 클릭 3번
43
7
```

`mine`은 객체마다 따로 세서 2와 1, `total`은 하나를 같이 써서 3이다.

### ② 안쪽 클래스 세 종류 — `Board.java`

```java
public class Board {
    String boardName = "자유게시판";

    // static 없는 안쪽 클래스 — Board 객체 하나에 딸려 있다
    class Inner {
        String title = "첫 글";

        String where() {
            return boardName + "의 " + title;   // 바깥 객체의 필드를 그냥 쓴다
        }
    }

    // static 안쪽 클래스 — Board 객체와 상관없다. 이름만 Board 안에 있다
    static class Nested {
        String title = "공지";
    }

    // record — 클래스 안에 두어도 저절로 static이다
    record Item(String title) {
    }

    public static void main(String[] args) {
        Board board = new Board();
        Board.Inner inner = board.new Inner();      // 바깥 객체 board가 있어야 만든다
        Board.Nested nested = new Board.Nested();   // 바깥 객체 없이 만든다
        Board.Item item = new Board.Item("record 글");

        System.out.println(inner.where());
        System.out.println(nested.title);
        System.out.println(item.title());
    }
}
```

```text
$ java Board.java
자유게시판의 첫 글
공지
record 글
```

`board.new Inner()`라는 낯선 문법이 "바깥 객체가 있어야 만든다"를 그대로 보여 준다.

### ③ 숨은 매개변수를 눈으로 보기

`javac`로 컴파일한 뒤 `javap`(클래스 파일 안을 보여 주는 JDK 도구)로 생성자를 본다.

```text
$ javac Board.java
$ javap -p 'Board$Inner.class' 'Board$Nested.class'
Compiled from "Board.java"
class Board$Inner {
  java.lang.String title;
  final Board this$0;
  Board$Inner(Board);
  java.lang.String where();
}
Compiled from "Board.java"
class Board$Nested {
  java.lang.String title;
  Board$Nested();
}
```

- `Board$Inner(Board)` — 코드에는 생성자를 쓰지도 않았는데, 생성자가 `Board`를 받는다. 이것이 숨은 매개변수다.
- `final Board this$0` — 받은 바깥 객체를 여기 들고 있다. 그래서 `where()`가 `boardName`을 쓸 수 있었다.
- `Board$Nested()` — static 쪽은 진짜로 인자 없는 생성자다.
- 파일 이름의 `$`는 "안쪽 클래스"라는 표시다. 에러 메시지에 `ProfileController$ProfileRequest`처럼 나오면 `ProfileController` 안의 `ProfileRequest`라는 뜻이다.

### ④ Spring 앱에서 — Jackson이 만들 수 있나

컨트롤러 안에 DTO를 세 가지 방식으로 두고 같은 본문을 보냈다. Boot 4.1(Jackson 3.1.5)에서 실행한 결과다.

```java
package org.example.lesson;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class StaticLessonController {

    // ① static 없는 안쪽 클래스 — 바깥 객체(StaticLessonController)가 있어야 만들 수 있다
    public class InnerRequest {
        private String name;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    // ② static 안쪽 클래스 — 바깥 객체 없이 만들 수 있다
    public static class NestedRequest {
        private String name;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    // ③ record — 클래스 안에 두어도 저절로 static이다
    public record RecordRequest(String name) {
    }

    @PostMapping("/api/lesson/b3/inner")
    public String inner(@RequestBody InnerRequest request) {
        return "inner: " + request.getName();
    }

    @PostMapping("/api/lesson/b3/nested")
    public String nested(@RequestBody NestedRequest request) {
        return "nested: " + request.getName();
    }

    @PostMapping("/api/lesson/b3/record")
    public String record(@RequestBody RecordRequest request) {
        return "record: " + request.name();
    }
}
```

| 요청 | 응답 |
|---|---|
| `POST /api/lesson/b3/inner` `{"name":"김자바"}` | **`500`** `{"timestamp":"…","status":500,"error":"Internal Server Error","path":"/api/lesson/b3/inner"}` |
| `POST /api/lesson/b3/nested` 같은 본문 | `200` `nested: 김자바` |
| `POST /api/lesson/b3/record` 같은 본문 | `200` `record: 김자바` |

`inner`일 때 서버 로그(앞부분):

```text
ERROR … o.a.c.c.C.[.[.[/].[dispatcherServlet]    : Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.http.converter.HttpMessageConversionException: Type definition error: [simple type, class org.example.lesson.StaticLessonController$InnerRequest]] with root cause

tools.jackson.databind.exc.InvalidDefinitionException: Cannot construct instance of `org.example.lesson.StaticLessonController$InnerRequest`: non-static inner classes like this can only by instantiated using default, no-argument constructor
```

("can only by"는 Jackson 메시지 원문의 오타다.) 클라이언트가 잘못 보낸 게 아니라 **서버의 클래스 정의**가 문제라서 `400`이 아니라 `500`이다. 스택트레이스에 `at org.example…` 줄이 하나도 없다. 내 메서드가 불리기 전, 본문을 DTO로 바꾸다 실패했기 때문이다.

## 따라 해 보기

15분.

1. 빈 폴더에 `Counter.java`를 만들고 `java Counter.java` → 다섯 줄이 예시와 같은지 본다.
2. `Board.java`를 만들고 `java Board.java` → 세 줄. 이어서 `javac Board.java` 후 `javap -p 'Board$Inner.class'` → `Board$Inner(Board);` 줄을 찾는다. (zsh·bash에서는 `$` 때문에 작은따옴표가 필요하다.)
3. javaExperience 프로젝트에서 `org.example` 아래에 `lesson` 패키지를 만들고, 위 `StaticLessonController.java`를 그대로 넣는다. 앱을 띄운다(IntelliJ에서 `Main` 실행).
4. 세 요청을 보낸다.

```bash
BASE=http://localhost:8080
curl -i -X POST "$BASE/api/lesson/b3/inner"  -H 'Content-Type: application/json' -d '{"name":"김자바"}'
curl -i -X POST "$BASE/api/lesson/b3/nested" -H 'Content-Type: application/json' -d '{"name":"김자바"}'
curl -i -X POST "$BASE/api/lesson/b3/record" -H 'Content-Type: application/json' -d '{"name":"김자바"}'
```

기대: 첫 줄만 `HTTP/1.1 500`, 나머지는 `HTTP/1.1 200`과 `nested: 김자바`·`record: 김자바`. IntelliJ 실행 창에 위 `InvalidDefinitionException` 줄이 보이면 된다.

5. `InnerRequest`에 `static`을 붙여 `public static class InnerRequest`로 바꾸고 앱을 다시 띄운다. 첫 요청이 `200` `inner: 김자바`로 바뀌면 끝이다.

## 일부러 틀려 보기

### ① static 메서드에서 인스턴스 필드를 쓴다

`Counter.java`의 `report()`를 이렇게 바꾼다.

```java
        return "전체 클릭 " + total + "번, 내 클릭 " + mine + "번";
```

```text
Counter.java:12: error: non-static variable mine cannot be referenced from a static context
        return "전체 클릭 " + total + "번, 내 클릭 " + mine + "번";
                                               ^
1 error
error: compilation failed
```

`report()`는 객체 없이 불린다. `Counter.report()`를 부르면 "어느 객체의 `mine`?"에 답할 수 없다. **고치기**: `report()`에서 `static`을 빼고 `a.report()`처럼 객체로 부르거나, `mine`을 쓰지 않는다.

### ② 바깥 객체 없이 안쪽 클래스를 만든다

`Board.java`의 `board.new Inner()`를 `new Board.Inner()`로 바꾼다.

```text
Board.java:24: error: non-static variable this cannot be referenced from a static context
        Board.Inner inner = new Board.Inner();      // 바깥 객체 없이 만들어 보자
                            ^
1 error
error: compilation failed
```

`main`은 static이라 `this`(바깥 `Board` 객체)가 없다. 그런데 `Inner`를 만들려면 그게 필요하다. 컴파일러가 막아 준 이 상황을, 실행 중에 JSON으로 객체를 만드는 Jackson은 막을 수 없어서 `500`이 된 것이다. **고치기**: `class Inner`를 `static class Inner`로 바꾸거나(그러면 `boardName`은 못 쓴다), 바깥 객체로 `board.new Inner()`.

DTO에서는 고민할 것 없이 셋 중 하나다. **(1) record로 만든다** (2) `public static class`로 만든다 (3) 별도 파일로 뺀다. 에러 도감: [비정적 안쪽 DTO (500)](../errors.md#비정적-안쪽-dto-500).

## 확인 문제

**1.** `Integer.parseInt("42")`는 `new Integer(...)` 없이 부른다. 무엇 때문인가?

<details>
<summary>정답</summary>

`parseInt`가 `static` 메서드라서다. static 메서드는 객체가 아니라 클래스에 붙어 있어서 `클래스이름.메서드()`로 부른다. 문자열을 숫자로 바꾸는 데 특정 `Integer` 객체의 상태가 필요 없으니 static이 맞다.
</details>

**2.** static 메서드 안에서 `this`나 인스턴스 필드를 쓸 수 없는 이유는?

<details>
<summary>정답</summary>

static 메서드는 객체 없이 불리므로 "지금 이 객체"가 없다. 인스턴스 필드는 객체마다 따로 있는데 어느 객체의 것인지 정할 수 없다. 컴파일러는 `non-static variable … cannot be referenced from a static context`로 막는다.
</details>

**3.** 컨트롤러 안에 `public class CreateRequest { … }`(static 없음, 기본 생성자·setter 있음)를 두고 `@RequestBody CreateRequest`로 받으면 응답 상태 코드는? 왜 400이 아닌가?

<details>
<summary>정답</summary>

`500`이다. Jackson이 비정적 안쪽 클래스를 만들 수 없어서(`non-static inner classes like this can only by instantiated using default, no-argument constructor`) 실패한다. 클라이언트가 보낸 JSON은 멀쩡하고, 서버의 클래스 정의가 잘못된 것이라 서버 오류(5xx)로 분류된다.
</details>

**4.** 비정적 안쪽 클래스에 `public CreateRequest() {}`를 직접 써 넣으면 Jackson이 만들 수 있게 될까?

<details>
<summary>정답</summary>

아니다. 직접 쓴 `public WithCtor() {}`도 `javap`로 보면 `public JackInner$WithCtor(JackInner);`였다. 컴파일러가 바깥 객체를 받는 숨은 매개변수를 넣기 때문이다. Jackson 3.1.5로 실제로 읽혀 봐도 같은 `non-static inner classes like this can only by instantiated …` 에러가 났다. `static`을 붙이거나 record·별도 파일로 바꿔야 한다.
</details>

**5.** 컨트롤러 안에 `public record CreateRequest(String title) {}`로 두면 괜찮은가?

<details>
<summary>정답</summary>

괜찮다. 안쪽에 둔 record는 저절로 static이다. 실측에서도 `/api/lesson/b3/record`는 `200`이었다.
</details>

## 더 깊이

- [P29 static 완전 정리](../docs/knowledge/P29-static-complete.md) — 상수·유틸 메서드, Spring에서 static을 피하는 곳
- [0-4 DTO 만들기](../scenario/ch0-first-steps/0-4-dto-rules.md#static이-뭐길래) — 이 에러를 시나리오에서 고장 내고 고친다
- [P16 JSON·Jackson 실무](../docs/knowledge/P16-json-jackson-practical.md) — Jackson이 객체를 만드는 방법들
- 에러 도감 [비정적 안쪽 DTO (500)](../errors.md#비정적-안쪽-dto-500)

## 다음

[B4. record·getter·불변](B4-record-getter-immutable.md) — DTO를 record로 쓰는 이유, 그리고 Java 객체가 JSON 응답이 되는 길(getter).
