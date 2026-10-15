# B1. 타입과 변수·메서드 — 타입이 이름 앞에 온다

> 개념 레슨 · 30분

## 이게 뭐냐

0-1에서 컨트롤러를 따라 치며 `String name`, `int nameLength` 같은 줄을 썼다. 변수와 메서드는 이렇게 생겼다.

```java
String name = "김자바";
final int maxLength = 10;
static int add(int a, int b) {
    return a + b;
}
```

규칙은 세 가지다.

1. **타입이 앞, 이름이 뒤.** `String name`이다. 첫 수업에서 가장 많이 틀린 곳이다.
2. **선언은 타입으로 시작한다.** 변수·메서드를 여는 따로 된 낱말이 없다. 바꾸지 못하게 하려면 `final`을 붙인다.
3. **문장 끝에 `;`가 반드시 있다.** 빠지면 컴파일이 안 된다.

### 자주 쓰는 타입

| Java | 담는 것 | 설명 |
|---|---|---|
| `String` | 글자 | **대문자로 시작한다.** `string`이라고 쓰면 "그런 클래스 없음" 에러 |
| `int` · `long` · `double` | 정수 · 큰 정수 · 소수 | 숫자는 크기·종류별로 나뉜다. DB의 id는 보통 `long`(또는 `Long`) |
| `boolean` | `true`·`false` | |
| `null` | 값 없음 | 참조형에만 넣을 수 있다(아래) |
| `List<T>` · `T[]` | 여러 개 | 배열 대신 거의 `List`를 쓴다(B6) |
| `Map<String, T>` | 키 → 값 | B6 |

### 기본형과 참조형

Java 타입은 두 종류다. 이 구분이 백엔드에서 자주 사고를 낸다.

| | 기본형(primitive) | 참조형(reference) |
|---|---|---|
| 예 | `int`, `long`, `double`, `boolean`, `char` | `String`, `Integer`, `Long`, `List`, 내가 만든 클래스 전부 |
| 이름 | **소문자**로 시작 | **대문자**로 시작 |
| 변수에 든 것 | 값 그 자체(`20`) | 객체를 가리키는 화살표 |
| `null` | **안 된다** | 된다 |
| 값이 없을 때 기본값 | `0`, `false` | `null` |

`int`마다 짝이 되는 참조형 `Integer`가 있다(`long` ↔ `Long`, `boolean` ↔ `Boolean`). `Integer`는 `int`를 감싼 상자다. 상자라서 `null`이 들어갈 수 있다. DB 컬럼처럼 "값이 없을 수도 있는 숫자"는 `Long`·`Integer`로 받는다.

### `var` — 타입을 오른쪽에서 알아내기

`var city = "서울";`이라고 쓰면 컴파일러가 오른쪽을 보고 `String`으로 정한다. 이것을 **타입 추론**이라고 한다. 단, **한 번 정해지면 그 타입으로 고정**이다. `var`는 메서드 안의 지역 변수에만 쓸 수 있다. 필드나 매개변수에는 못 쓴다.

### 메서드 시그니처

```text
static    int        add  (int a, int b)
[수식어]  [반환 타입]  [이름] ([매개변수 타입 이름, ...])
```

- 반환 타입이 **이름 앞**에 온다.
- 돌려줄 값이 없으면 반환 타입 자리에 `void`를 쓴다.
- `static`은 B3에서 설명한다. 지금은 "객체 없이 부를 수 있다"는 뜻으로만 알아 둔다.
- Java에는 함수만 따로 있을 수 없다. 메서드는 언제나 **클래스 안**에 있다.

## 예시

`Types.java` — 아래 파일을 그대로 실행한 결과다(Java 21).

```java
public class Types {

    // 메서드: 반환 타입 이름(매개변수 타입 이름, ...)
    static int add(int a, int b) {
        return a + b;
    }

    static String greet(String name, int age) {
        return name + "님(" + age + "살), 반가워요";
    }

    // 돌려줄 값이 없으면 void
    static void printLine(String text) {
        System.out.println("> " + text);
    }

    public static void main(String[] args) {
        // 기본형(primitive) — 값 자체가 변수에 들어 있다. null이 될 수 없다
        int age = 20;
        long views = 3_000_000_000L;
        double height = 172.5;
        boolean admin = false;

        // 참조형(reference) — 객체를 가리키는 화살표가 들어 있다. null이 될 수 있다
        String name = "김자바";
        Integer boxedAge = age;          // int를 감싼 객체
        String nickname = null;

        // var — 오른쪽을 보고 타입을 정한다. 정해진 뒤에는 못 바꾼다
        var city = "서울";               // String
        var count = 10;                  // int

        // final — 다시 넣을 수 없다
        final int maxLength = 10;

        printLine(greet(name, age));
        printLine("add(2, 3) = " + add(2, 3));
        printLine("views = " + views + ", height = " + height + ", admin = " + admin);
        printLine("city = " + city + ", count = " + count + ", maxLength = " + maxLength);
        printLine("boxedAge = " + boxedAge + ", nickname = " + nickname);
        printLine("name.length() = " + name.length());
    }
}
```

```text
$ java Types.java
> 김자바님(20살), 반가워요
> add(2, 3) = 5
> views = 3000000000, height = 172.5, admin = false
> city = 서울, count = 10, maxLength = 10
> boxedAge = 20, nickname = null
> name.length() = 3
```

- `3_000_000_000L` — `int`는 약 21억까지라 30억은 `long`이어야 한다. 숫자 끝의 `L`이 "long 값"이라는 표시다. `_`는 읽기 좋게 끊는 것뿐이다.
- `public static void main(String[] args)` — 프로그램의 시작점이다. Spring 앱의 `Main.main`도 같은 모양이다.
- `java 파일.java` — 컴파일과 실행을 한 번에 한다(Java 11부터). 작은 연습에 좋다.

## 따라 해 보기

**jshell**(Java를 한 줄씩 쳐서 바로 결과를 보는 JDK 도구)로 10분.

0. 터미널에서 `java -version`을 친다. `openjdk version "21...`이 나오면 된다. 명령을 못 찾으면 IntelliJ의 **File → Project Structure → SDKs**에 보이는 JDK 경로 아래 `bin/jshell`을 쓴다.
1. `jshell`을 친다. `jshell>` 프롬프트가 나온다.
2. 아래를 한 줄씩 친다. 각 줄 아래가 실제로 나온 결과다.

```text
jshell> String name = "김자바";
name ==> "김자바"
jshell> int age = 20;
age ==> 20
jshell> long views = 3_000_000_000L;
views ==> 3000000000
jshell> name.length()
$4 ==> 3
jshell> age + 1
$5 ==> 21
jshell> var city = "서울";
city ==> "서울"
jshell> Integer boxed = age;
boxed ==> 20
jshell> String nothing = null;
nothing ==> null
jshell> int add(int a, int b) { return a + b; }
|  created method add(int,int)
jshell> add(2, 3)
$10 ==> 5
jshell> void hello(String who) { System.out.println("안녕, " + who); }
|  created method hello(String)
jshell> hello("서버")
안녕, 서버
```

`$4` 같은 번호는 jshell이 결과에 붙인 이름이다. 위 순서대로 치면 같은 번호가 나오고, 다른 줄을 끼워 치면 달라진다.

3. 문자열 비교를 해 본다. 백엔드에서 자주 틀리는 곳이다.

```text
jshell> String a1 = new String("hi");
a1 ==> "hi"
jshell> String a2 = new String("hi");
a2 ==> "hi"
jshell> a1 == a2
$15 ==> false
jshell> a1.equals(a2)
$16 ==> true
```

`==`는 "같은 객체인가(화살표가 같은 곳을 가리키나)"를 본다. 글자가 같은지는 `equals`로 본다. `==`로 글자를 비교해도 컴파일은 되므로, 틀린 줄 모르고 지나가기 쉽다.

4. `/exit`로 나온다.

> jshell에서는 맨 바깥에 쓴 `final`이 무시된다(`final int max = 3;` 뒤에 `max = 4;`가 된다. 실측). `final`은 아래처럼 파일로 확인한다.

5. 위 [예시](#예시)의 `Types.java`를 아무 폴더에 만들고 `java Types.java`로 실행한다. 같은 여섯 줄이 나오면 된다.

## 일부러 틀려 보기

### ① `final` 변수에 다시 넣는다

`Types.java`의 `printLine(greet(name, age));` 바로 위에 `maxLength = 20;`을 넣고 실행한다.

```text
Types.java:36: error: cannot assign a value to final variable maxLength
        maxLength = 20;
        ^
1 error
error: compilation failed
```

`파일:줄: error: 메시지` 다음 줄에 코드, 그 아래 `^`가 문제 자리를 가리킨다. 모든 컴파일 에러가 이 모양이다. IntelliJ에서는 같은 문장이 Build 창에 나온다. **고치기**: 그 줄을 지운다. 바꿔야 하는 값이면 `final`을 뺀다.

### ② 기본형에 `null`을 넣는다

`int age = 20;`을 `int age = null;`로 바꾼다.

```text
Types.java:19: error: incompatible types: <null> cannot be converted to int
        int age = null;
                  ^
```

`int`는 `null`이 될 수 없다. 이건 컴파일러가 막아 준다. 더 무서운 건 **컴파일러가 못 막는** 경우다. `Integer`(상자)에 든 `null`을 `int`로 꺼내면 실행 중에 터진다. `Unbox.java`:

```java
public class Unbox {
    public static void main(String[] args) {
        Integer views = null;            // DB에서 값이 없어 null이 왔다고 하자
        int total = views + 1;           // Integer → int로 꺼내려다 터진다
        System.out.println(total);
    }
}
```

```text
$ java Unbox.java
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "java.lang.Integer.intValue()" because "<local1>" is null
	at Unbox.main(Unbox.java:4)
```

`<local1>`은 "첫 번째 지역 변수"라는 뜻이다. `java 파일.java`는 변수 이름을 기록하지 않고 컴파일해서 이렇게 나온다. `javac -g Unbox.java`로 컴파일한 뒤 `java Unbox`로 실행하면 `because "views" is null`로 이름이 나온다(실측). IntelliJ·Gradle로 빌드한 앱도 이름이 나온다. **고치기**: `null`일 수 있는 값은 꺼내기 전에 확인한다(`views == null ? 0 : views`). 이 에러를 앱에서 만나는 모습은 [0-5 에러 읽기](../scenario/ch0-first-steps/0-5-read-stack-trace.md)에 있다.

## 확인 문제

**1.** 가격 `1500`을 담는 변수 `price`를 Java로 선언하라. 그리고 `price`가 "없을 수도 있는 값"이라면 어떻게 바꾸나?

<details>
<summary>정답</summary>

`int price = 1500;`. 없을 수도 있으면 `Integer price = null;`처럼 참조형으로 쓴다. `int`는 `null`을 담을 수 없다.
</details>

**2.** `string title = "첫 글";`은 왜 컴파일이 안 되나?

<details>
<summary>정답</summary>

Java의 문자열 타입은 대문자 `String`이다. 소문자 `string`이라는 클래스는 없어서 `cannot find symbol` / `symbol: class string` 에러가 난다(jshell 실측). 대문자로 시작하면 클래스(참조형), 소문자면 기본형이라는 규칙을 기억하면 덜 틀린다.
</details>

**3.** `var count = 10;` 다음 줄에 `count = "열";`을 쓰면 어떻게 되나?

<details>
<summary>정답</summary>

컴파일 에러다. `var`는 첫 값(`10`)을 보고 타입을 `int`로 **고정**한다. jshell 실측: `incompatible types: java.lang.String cannot be converted to int`. 실행하기 전, 컴파일 단계에서 막힌다.
</details>

**4.** 메서드 `static String greet(String name, int age)`에서 반환 타입·이름·매개변수를 각각 짚어라. 돌려줄 값이 없는 메서드로 바꾸면 무엇이 달라지나?

<details>
<summary>정답</summary>

반환 타입 `String`, 이름 `greet`, 매개변수 `String name`과 `int age`. 돌려줄 값이 없으면 반환 타입 자리에 `void`를 쓰고(`static void greet(String name, int age)`), 본문에서 `return 값;`을 쓰지 않는다.
</details>

**5.** 두 문자열 `a`, `b`의 글자가 같은지 비교하려면 `a == b`와 `a.equals(b)` 중 무엇을 쓰나?

<details>
<summary>정답</summary>

`a.equals(b)`. `==`는 두 변수가 **같은 객체**를 가리키는지를 본다. jshell 실측에서 `new String("hi") == new String("hi")`는 `false`, `equals`는 `true`였다.
</details>

## 더 깊이

- [J01 기본 타입·참조 타입·박싱·String](../docs/knowledge/J01-types-string.md) — 박싱이 언제 일어나나, String이 왜 불변인가
- [P09 Java 문법 기초](../docs/knowledge/P09-java-syntax-basics.md) — 클래스·필드·메서드 선언을 더 많은 예로
- [W21 null 처리 전략](../docs/knowledge/W21-null-handling.md) — `null`을 어디서 막나
- [0-1 단계](../scenario/ch0-first-steps/0-1-ts-to-java.md) — 이 레슨의 내용을 Spring 컨트롤러에서 바로 쓴다

## 다음

[B2. 클래스·객체·생성자·this](B2-classes-objects-constructors.md) — 값과 메서드를 묶은 "클래스"를 만들고, `new`로 객체를 찍어 낸다. 첫 수업에서 막힌 "생성자"가 여기서 나온다.
