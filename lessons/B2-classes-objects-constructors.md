# B2. 클래스·객체·생성자·this — 객체를 찍어 내는 틀

> 개념 레슨 · 30분

## 이게 뭐냐

0-1에서 컨트롤러 클래스를 만들고, 응답은 `new Greeting(...)`으로 찍어 냈다. Java에서는 거의 모든 코드가 클래스 안에 있다. 클래스는 **객체를 찍어 내는 틀**이고, `new`로 찍어 낸 하나하나가 **객체**(인스턴스)다. 값을 담는 그릇은 class나 **record**(B4)로, 메서드 약속은 **interface**(B5)로 적는다. 이 레슨은 class다.

```java
public class Member {
    private String name;      // 필드 — 타입 이름;
    private int age;

    public Member(String name, int age) {   // 생성자 — 이름이 클래스 이름과 같다
        this.name = name;
        this.age = age;
    }
}
Member kim = new Member("김자바", 20);
```

| 낱말 | 뜻 |
|---|---|
| **필드** | 객체마다 갖는 값 |
| **생성자** | `new` 할 때 한 번 불려 필드를 채우는 특별한 메서드. **이름이 클래스 이름과 같고, 반환 타입을 쓰지 않는다**(`void`도 안 쓴다) |
| **`this`** | "지금 이 객체". `this.name`은 이 객체의 필드 `name` |
| **`private`** | 이 클래스 안에서만 보인다. 밖에서 `kim.name`으로 꺼내면 컴파일 에러 |

### 꼭 알아야 할 규칙 두 가지

**① 생성자를 여러 개 둘 수 있다(오버로딩).** 매개변수 모양이 다르면 생성자를 여러 개 쓸 수 있다. 한 생성자에서 다른 생성자를 부를 때는 `this(...)`를 **첫 줄**에 쓴다.

**② 기본 생성자는 "아무것도 안 썼을 때만" 생긴다.** 생성자를 하나도 쓰지 않으면 Java가 빈 생성자 `public Member() {}`를 몰래 넣어 준다. 이걸 **기본 생성자**라고 한다. 그런데 생성자를 **하나라도 쓰는 순간** 기본 생성자는 만들어 주지 않는다. 이 규칙이 백엔드에서 중요하다. Jackson(JSON 변환기)과 JPA(DB 도구)가 빈 생성자로 객체를 먼저 만들고 값을 채우는 방식을 쓰기 때문이다.

## 예시

`Member.java` — 그대로 실행한 결과다(Java 21).

```java
public class Member {
    // 필드 — 객체마다 하나씩 갖는 값
    private String name;
    private int age;

    // 생성자 1 — 이름과 나이를 받는다
    public Member(String name, int age) {
        this.name = name;   // this.name = 이 객체의 필드, name = 매개변수
        this.age = age;
    }

    // 생성자 2 — 이름만 받는다. 나이는 0으로 두고 생성자 1에 넘긴다
    public Member(String name) {
        this(name, 0);      // 같은 클래스의 다른 생성자 부르기 — 첫 줄에만 쓸 수 있다
    }

    // 메서드 — 이 객체의 필드를 쓴다
    public String introduce() {
        return name + " (" + age + "살)";
    }

    public void birthday() {
        this.age = this.age + 1;
    }

    public static void main(String[] args) {
        Member kim = new Member("김자바", 20);
        Member lee = new Member("이프론");
        System.out.println(kim.introduce());
        System.out.println(lee.introduce());

        Member same = kim;          // 객체를 복사하지 않는다 — 같은 객체를 가리킨다
        same.birthday();
        System.out.println(kim.introduce());
        System.out.println(kim == same);
        System.out.println(kim == new Member("김자바", 21));
    }
}
```

```text
$ java Member.java
김자바 (20살)
이프론 (0살)
김자바 (21살)
true
false
```

- `new Member("이프론")`은 매개변수가 하나인 생성자 2를 고른다. 생성자 2는 `this(name, 0)`으로 생성자 1에 일을 넘긴다.
- `Member same = kim;`은 객체를 복사하지 않는다. 화살표만 하나 더 생긴다. 그래서 `same.birthday()` 뒤에 `kim`도 21살이다.
- `kim == new Member("김자바", 21)`은 값이 같아도 `false`다. 다른 객체다(B1의 `==`와 같은 이야기).

## 따라 해 보기

10분. 터미널(IntelliJ 아래쪽 Terminal 탭도 된다)에서 한다.

1. 빈 폴더에 위 `Member.java`를 만들고 `java Member.java`로 실행한다. 다섯 줄이 위와 같으면 된다.
2. `main`에 한 줄 더 넣는다: `Member park = new Member("박백엔", 30); park.birthday(); System.out.println(park.introduce());` → `박백엔 (31살)`이 추가로 나오면 된다.
3. 생성자 2를 지우고 다시 실행한다. `new Member("이프론")` 줄에서 컴파일 에러가 나는지 본다(`required: String,int` / `found: String`). 확인했으면 되돌린다.
4. 이제 기본 생성자 규칙을 직접 확인한다. 새 폴더에 `Post.java`:

```java
public class Post {
    private String title;

    public static void main(String[] args) {
        Post post = new Post();      // 생성자를 하나도 안 썼는데 된다
        System.out.println("만들었다: " + post);
    }
}
```

```text
$ java Post.java
만들었다: Post@71248c21
```

생성자를 쓰지 않았는데 `new Post()`가 된다. Java가 기본 생성자를 넣어 줬기 때문이다. `@` 뒤 숫자는 실행할 때마다 다르다(객체를 문자열로 바꾸는 법을 안 정해서 "클래스이름@번호"가 찍힌 것이다).

## 일부러 틀려 보기

### ① 생성자를 하나 쓰면 기본 생성자가 사라진다

`Post.java`에 생성자를 추가한다. `main`은 그대로 `new Post()`다.

```java
    public Post(String title) {
        this.title = title;
    }
```

```text
Post.java:9: error: constructor Post in class Post cannot be applied to given types;
        Post post = new Post();      // 생성자를 하나 쓰는 순간 빈 생성자는 사라진다
                    ^
  required: String
  found:    no arguments
  reason: actual and formal argument lists differ in length
1 error
error: compilation failed
```

`required:`는 생성자가 원하는 것, `found:`는 내가 넘긴 것이다. **고치기**: `new Post("첫 글")`처럼 인자를 맞추거나, 빈 생성자가 꼭 필요하면 `public Post() {}`를 직접 쓴다. 같은 에러를 Spring 코드에서 만나는 모습은 에러 도감 [생성자 인자 불일치](../errors.md#생성자-인자-불일치)에 있다. JPA 엔티티는 빈 생성자가 반드시 필요한데, 이 규칙을 몰라서 나는 에러가 [엔티티 기본 생성자 없음](../errors.md#엔티티-기본-생성자-없음)이다.

### ② `this.`를 빠뜨린다 — 에러 없이 틀린다

```java
public class Post {
    private String title;

    public Post(String title) {
        title = title;               // this. 를 빠뜨렸다
    }

    public String getTitle() {
        return title;
    }

    public static void main(String[] args) {
        Post post = new Post("첫 글");
        System.out.println("제목: " + post.getTitle());
    }
}
```

```text
$ java Post.java
제목: null
```

컴파일도 되고 실행도 된다. 그런데 제목이 `null`이다. 생성자 안에서 `title`은 **매개변수** `title`을 가리킨다(이름이 같으면 가까운 쪽이 이긴다). `title = title`은 매개변수에 자기 자신을 넣을 뿐, 필드는 건드리지 않는다. 필드는 기본값 `null`인 채로 남는다. **고치기**: `this.title = title;`. 에러가 안 나는 실수라 더 위험하다.

### ③ 생성자에 `void`를 붙인다

메서드처럼 반환 타입을 쓰면 생성자가 아니라 **이름이 클래스와 같은 보통 메서드**가 된다.

```java
    public void Post(String title) {  // 생성자에 void를 붙였다
        this.title = title;
    }
```

`new Post("첫 글")`을 하면:

```text
Post.java:9: error: constructor Post in class Post cannot be applied to given types;
        Post post = new Post("첫 글");
                    ^
  required: no arguments
  found:    String
  reason: actual and formal argument lists differ in length
```

`required: no arguments` — 진짜 생성자는 Java가 넣어 준 빈 기본 생성자뿐이라는 뜻이다. **고치기**: `void`를 지운다.

## 확인 문제

**1.** 아래 클래스로 `new Comment()`를 할 수 있나?

```java
public class Comment {
    private String body;
    public Comment(String body) { this.body = body; }
}
```

<details>
<summary>정답</summary>

없다. 생성자 `Comment(String)`을 하나 썼기 때문에 Java가 기본 생성자를 만들어 주지 않는다. `new Comment()`는 `constructor Comment in class Comment cannot be applied to given types` 컴파일 에러다. 필요하면 `public Comment() {}`를 직접 추가한다.
</details>

**2.** 생성자와 보통 메서드를 겉모양으로 어떻게 구분하나?

<details>
<summary>정답</summary>

생성자는 이름이 클래스 이름과 같고 **반환 타입이 없다**. `public Post(String title)`은 생성자, `public void Post(String title)`은 반환 타입(`void`)이 있으니 이름만 같은 보통 메서드다.
</details>

**3.** `Member a = new Member("김자바", 20); Member b = a; b.birthday();` 뒤에 `a`의 나이는?

<details>
<summary>정답</summary>

21이다. `b = a`는 객체를 복사하지 않고 같은 객체를 가리키게 할 뿐이다. 예시의 `same`과 같다. 실행 결과 `김자바 (21살)`.
</details>

**4.** 생성자 안에서 `title = title;`이라고 쓰면 무슨 일이 생기나? 왜 컴파일러가 막지 않나?

<details>
<summary>정답</summary>

필드가 채워지지 않고 `null`로 남는다. 매개변수 `title`이 필드 `title`을 가려서, 양쪽 모두 매개변수를 가리킨다. 자기 자신에게 넣는 것도 문법상으로는 맞으니 컴파일러가 막지 않는다. `this.title = title;`로 고친다.
</details>

**5.** Jackson이나 JPA가 "빈 생성자"를 원한다는 말과 기본 생성자 규칙은 어떻게 이어지나?

<details>
<summary>정답</summary>

두 도구는 먼저 빈 생성자로 객체를 만들고 나중에 값을 채우는 방식을 쓴다(JPA는 언제나, Jackson은 setter 방식 클래스일 때). 생성자를 하나도 안 쓰면 기본 생성자가 저절로 생기지만, 인자 있는 생성자를 쓰는 순간 사라진다. 그래서 그런 클래스에는 `public Post() {}`(JPA는 `protected`도 된다)를 직접 넣어야 한다. Jackson은 record를 쓰면 이 고민이 없다(B4).
</details>

## 더 깊이

- [P09 Java 문법 기초](../docs/knowledge/P09-java-syntax-basics.md) — 클래스·필드·메서드·생성자 선언과 호출
- [P04 객체 생성 — 생성자·정적 팩토리·Builder](../docs/knowledge/P04-constructors-builder.md) — 생성자가 많아질 때 쓰는 방법들
- [J02 OOP와 Object 규약](../docs/knowledge/J02-oop-object-contracts.md) — `equals`·`hashCode`·`toString`은 언제 직접 쓰나
- [0-1 단계](../scenario/ch0-first-steps/0-1-ts-to-java.md) — 생성자 있는 클래스와 record를 나란히

## 다음

[B3. static과 안쪽 클래스](B3-static-and-inner-classes.md) — 객체 없이 쓰는 `static`, 그리고 첫 수업에서 "기본 생성자가 없다"는 에러를 낸 진짜 범인.
