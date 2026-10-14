# B4. record·getter·불변 — DTO가 record인 이유

> 개념 레슨 · 30분

## 이게 뭐냐

0-1의 `Greeting`처럼, API가 주고받는 값의 모양은 **record**로 적는다(Java 16+).

```java
public record MemberResponse(String name, int age) {
}
```

이 한 줄로 Java가 **저절로** 만드는 것:

| 생기는 것 | 모양 | 뜻 |
|---|---|---|
| 필드 | `private final String name;` `private final int age;` | `final` — 한 번 넣으면 못 바꾼다 |
| 생성자 | `new MemberResponse("김자바", 20)` | 괄호 안 순서 그대로 받는다 |
| 꺼내는 메서드 | `name()`, `age()` | **`getName()`이 아니다.** 이름 그대로 + 괄호 |
| `equals` | 값이 모두 같으면 같다 | 보통 클래스는 직접 써야 한다(B2의 `==` 이야기) |
| `toString` | `MemberResponse[name=김자바, age=20]` | 로그에 찍기 좋다 |

record는 모양만 적은 이름이 아니라 **진짜 클래스**다. 그래서 Jackson(JSON 변환기)이 실행 중에 record를 보고 JSON을 만들고, JSON에서 record를 만든다.

### 불변(immutable)

record에는 setter가 없고 필드가 `final`이다. 한번 만든 값을 바꿀 수 없다. 바꾸고 싶으면 **새로 만든다**(`new MemberResponse(a.name(), a.age() + 1)`).

DTO가 불변이면 좋은 점: 컨트롤러·서비스를 지나가는 동안 누가 몰래 값을 바꿀 수 없다. 받은 그대로, 만든 그대로다.

### getter가 JSON이 되는 길

컨트롤러가 객체를 `return`하면 Jackson이 그 객체를 JSON으로 바꾼다. 이때 Jackson은 **필드를 직접 보지 않는다**(private이라 못 본다). 대신 **꺼내는 메서드**를 찾는다.

| 객체에 있는 메서드 | JSON 키 |
|---|---|
| record의 `name()` | `"name"` |
| `getName()` | `"name"` (`get`을 떼고 첫 글자를 소문자로) |
| `boolean isAdult()` | `"adult"` (`boolean`은 `is`도 된다) |
| 아무것도 없음(private 필드만) | 없음 → `{}` |

즉 **getter가 곧 JSON 키 목록**이다. 필드가 없어도 getter가 있으면 키가 생기고, 필드가 있어도 getter가 없으면 키가 없다. 요청 쪽은 반대 방향이다. JSON → 객체로 만들 때 record는 생성자로 한 번에 넣는다. 보통 클래스는 빈 생성자로 만든 뒤 setter로 채운다(B2의 기본 생성자 이야기).

### 그래서 DTO는 record로

| DTO에 필요한 것 | record | 보통 클래스로 하려면 |
|---|---|---|
| Jackson이 만들 수 있다(요청) | 생성자 자동, 안쪽에 둬도 자동 static(B3) | 기본 생성자 + setter, 안쪽이면 `static` |
| Jackson이 꺼낼 수 있다(응답) | `name()` 자동 | getter를 필드마다 |
| 값이 안 바뀐다 | 자동 | `final` + setter 없음 |
| 로그에 찍으면 읽힌다 | `toString` 자동 | 직접 작성 |

record 한 줄이 이 네 가지를 한 번에 지킨다. 이 과정의 DTO가 모두 record인 이유다. 단, JPA 엔티티(DB 테이블과 짝인 클래스)는 값을 바꿔 가며 쓰기 때문에 record로 만들지 않는다(E3).

## 예시

### ① record와 보통 클래스 — `RecordDemo.java`

```java
public class RecordDemo {

    // 한 줄로 끝. 필드(private final)·생성자·name()·age()·equals·hashCode·toString이 저절로 생긴다
    record MemberResponse(String name, int age) {
    }

    // 같은 것을 보통 클래스로 쓰면 — getter만 만들고 equals·toString은 생략했다
    static class MemberClass {
        private final String name;
        private final int age;

        MemberClass(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public String getName() { return name; }
        public int getAge() { return age; }
    }

    public static void main(String[] args) {
        MemberResponse a = new MemberResponse("김자바", 20);
        MemberResponse b = new MemberResponse("김자바", 20);

        System.out.println(a);                    // toString
        System.out.println(a.name() + ", " + a.age());   // 꺼내기 — getName()이 아니라 name()
        System.out.println(a.equals(b));          // 값이 같으면 같다
        System.out.println(a == b);               // 그래도 객체는 둘

        MemberResponse older = new MemberResponse(a.name(), a.age() + 1);  // 바꾸지 않고 새로 만든다
        System.out.println(a + " → " + older);

        MemberClass c = new MemberClass("김자바", 20);
        System.out.println(c.getName() + ", " + c.getAge());
        System.out.println(c);                    // toString을 안 만들면 클래스이름@해시
    }
}
```

```text
$ java RecordDemo.java
MemberResponse[name=김자바, age=20]
김자바, 20
true
false
MemberResponse[name=김자바, age=20] → MemberResponse[name=김자바, age=21]
김자바, 20
RecordDemo$MemberClass@7d3a22a9
```

마지막 줄의 `@` 뒤 숫자는 실행할 때마다 다르다.

### ② Spring 앱에서 — 무엇이 JSON이 되나

Boot 4.1(Jackson 3.1.5)에서 실행했다.

```java
package org.example.lesson;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MemberLessonController {

    // ① record — name()·age()가 저절로 생긴다
    public record MemberRecord(String name, int age) {
    }

    // ② 보통 클래스 + getter
    public static class MemberWithGetter {
        private final String name;
        private final int age;

        public MemberWithGetter(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public String getName() { return name; }
        public int getAge() { return age; }
        public boolean isAdult() { return age >= 19; }   // 필드는 없지만 getter가 있다
    }

    // ③ 보통 클래스, getter 없음
    public static class MemberNoGetter {
        private final String name;
        private final int age;

        public MemberNoGetter(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }

    @GetMapping("/api/lesson/b4/record")
    public MemberRecord record() {
        return new MemberRecord("김자바", 20);
    }

    @GetMapping("/api/lesson/b4/getter")
    public MemberWithGetter getter() {
        return new MemberWithGetter("김자바", 20);
    }

    @GetMapping("/api/lesson/b4/no-getter")
    public MemberNoGetter noGetter() {
        return new MemberNoGetter("김자바", 20);
    }
}
```

| 요청 | 응답(모두 `200`, `Content-Type: application/json`) |
|---|---|
| `GET /api/lesson/b4/record` | `{"name":"김자바","age":20}` |
| `GET /api/lesson/b4/getter` | `{"name":"김자바","age":20,"adult":true}` |
| `GET /api/lesson/b4/no-getter` | `{}` |

- `getter`의 `"adult"` — `adult`라는 필드는 없다. `isAdult()` 메서드가 있어서 키가 생겼다.
- `no-getter`의 `{}` — 필드에 값이 다 있는데 JSON이 비었다. 에러도 로그도 없다.

## 따라 해 보기

15분.

1. `RecordDemo.java`를 만들고 `java RecordDemo.java` → 일곱 줄이 예시와 같은지 본다(마지막 줄 숫자만 다르다).
2. `main` 끝에 `System.out.println(a.hashCode() == b.hashCode());`를 넣어 본다. `true` — `equals`가 같으면 `hashCode`도 같게 만들어진다. `Map`의 키로 쓸 때 필요하다(B6).
3. javaExperience의 `org.example.lesson` 패키지(B3에서 만든 곳)에 `MemberLessonController.java`를 그대로 넣고 앱을 띄운다.
4. 세 요청을 보낸다.

```bash
BASE=http://localhost:8080
curl -i "$BASE/api/lesson/b4/record"
curl -i "$BASE/api/lesson/b4/getter"
curl -i "$BASE/api/lesson/b4/no-getter"
```

기대: 위 표와 같은 본문 세 개.

5. `MemberWithGetter`에 `public String getGreeting() { return name + "님"; }`을 추가하고 다시 띄워 `getter`를 부른다. 응답이 `{"name":"김자바","age":20,"adult":true,"greeting":"김자바님"}`처럼 키가 하나 더 생기는지 본다(실측). getter 이름이 곧 키라는 것을 확인하는 단계다.

## 일부러 틀려 보기

### ① record의 값을 바꾼다

`RecordDemo.java`의 `System.out.println(a.equals(b));` 위에 `a.age = 21;`을 넣는다.

```text
RecordDemo.java:27: error: cannot assign a value to final variable age
        a.age = 21;                               // 나이를 바꿔 보자
         ^
1 error
error: compilation failed
```

record의 필드는 `final`이다. **고치기**: `new MemberResponse(a.name(), 21)`처럼 새로 만든다.

### ② record에 `getName()`을 부른다

`a.name()`을 `a.getName()`으로 바꾼다. 보통 클래스 습관이나 Lombok 코드를 보고 흔히 쓰는 실수다.

```text
RecordDemo.java:26: error: cannot find symbol
        System.out.println(a.getName());
                            ^
  symbol:   method getName()
  location: variable a of type MemberResponse
1 error
error: compilation failed
```

**고치기**: record는 `name()`. 보통 클래스는 `getName()`. 둘을 섞지 않는다.

### ③ getter 없는 응답 클래스 — 에러 없이 `{}`

위 `no-getter`가 이 경우다. 서버 로그에도 아무것도 없어서 찾기 어렵다. 응답 본문이 `{}`이면 이걸 먼저 의심한다. **고치기**: record로 바꾼다. 클래스로 둬야 하면 필드마다 getter를 만든다. 에러 도감: [응답이 빈 {}](../errors.md#응답이-빈-).

## 확인 문제

**1.** `record PostResponse(Long id, String title)`가 저절로 만드는 것 네 가지를 말하라.

<details>
<summary>정답</summary>

`private final` 필드 `id`·`title`, 두 값을 받는 생성자, 꺼내는 메서드 `id()`·`title()`, 그리고 `equals`·`hashCode`·`toString`. setter는 만들지 않는다.
</details>

**2.** 보통 클래스에 `private String title;`만 있고 getter가 없다. 이 객체를 컨트롤러에서 돌려주면 응답은?

<details>
<summary>정답</summary>

`{}`(200). Jackson은 private 필드를 직접 보지 않고 getter(또는 record의 꺼내는 메서드)로 키를 찾는다. 찾을 게 없으니 빈 객체가 된다. Boot 4(Jackson 3)에서는 에러 없이 `{}`가 나온다.
</details>

**3.** 클래스에 필드 `name`·`age`, 메서드 `getName()`·`getAge()`·`isAdult()`가 있다. `adult`라는 필드는 없다. 이 객체를 돌려주면 응답 JSON의 키는?

<details>
<summary>정답</summary>

`name`·`age`·`adult` 세 개다. 실측 `{"name":"김자바","age":20,"adult":true}`. 메서드 이름 `isAdult`에서 `is`를 떼고 소문자로 시작한 `adult`가 키가 된다. 키를 정하는 건 필드가 아니라 메서드다.
</details>

**4.** record의 나이를 한 살 올리려면 어떻게 하나? 왜 이렇게 만들었을까?

<details>
<summary>정답</summary>

`new MemberResponse(m.name(), m.age() + 1)`처럼 새 객체를 만든다. record는 불변이라 바꿀 수 없다. 여러 곳을 지나가는 DTO가 도중에 바뀌지 않으니 "받은 그대로·만든 그대로"를 믿을 수 있다.
</details>

**5.** record에 값을 꺼낼 때 `m.getName()`이 아니라 `m.name()`인데, 그러면 Jackson은 JSON 키를 `"name"`으로 어떻게 아나?

<details>
<summary>정답</summary>

Jackson은 record를 알아본다. record의 구성 요소 이름(`name`, `age`)을 키로 쓰고, 값은 `name()`·`age()`로 꺼낸다. 실측 `{"name":"김자바","age":20}`.
</details>

## 더 깊이

- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 엔티티를 그대로 돌려주면 생기는 일
- [P16 JSON·Jackson 실무](../docs/knowledge/P16-json-jackson-practical.md) — 키 이름 바꾸기·날짜·null 처리
- [J05 모던 문법](../docs/knowledge/J05-modern-syntax.md) — record와 함께 들어온 문법들
- [W19 Lombok을 쓸까 말까](../docs/knowledge/W19-lombok-or-not.md) — 실무 코드의 `@Getter`·`@Data`가 만드는 것
- [0-4 DTO 만들기](../scenario/ch0-first-steps/0-4-dto-rules.md#dto-규칙-세-가지) — DTO 규칙 세 가지를 고장 내며 확인

## 다음

[B5. 인터페이스와 구현](B5-interfaces.md) — Spring 코드에 `PostRepository`가 왜 클래스가 아니라 인터페이스인지.
