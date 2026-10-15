# B6. List·Map·Optional·람다 맛보기 — 목록 거르기·바꾸기와 없는 값

> 개념 레슨 · 30분

## 이게 뭐냐

서비스 코드는 목록을 거르고, 바꾸고, 키로 찾고, 없을 수도 있는 값을 다룬다. 이 레슨은 **맛보기**다. 서비스 코드에서 자주 보는 모양만 익힌다.

### 한눈에

| 하고 싶은 일 | Java | 메모 |
|---|---|---|
| 빈 리스트 만들기 | `List<String> titles = new ArrayList<>();` | `List`는 약속(인터페이스, B5), `ArrayList`는 구현 |
| 넣기 | `titles.add("첫 글")` | |
| 꺼내기 | `titles.get(0)` | `titles[0]`처럼 `[]`로 꺼내지 않는다 |
| 개수 | `titles.size()` | 메서드다(괄호) |
| 값을 정해 두고 만들기 | `List.of(70, 85, 90)` | **바꿀 수 없는** 리스트 |
| 하나씩 돌기 | `for (String t : titles)` | `:` 뒤에 리스트 |
| 거르기 | `list.stream().filter(s -> s >= 80).toList()` | `->`는 람다(아래) |
| 바꾸기 | `list.stream().map(s -> s + 5).toList()` | |
| 키 → 값 묶음 | `Map<String, Integer> likes = new HashMap<>();` | |
| 키로 꺼내기 | `likes.get(key)` | 없으면 `null` |
| 없으면 기본값 | `likes.getOrDefault(key, 0)` | |
| 있을 수도 없을 수도 있는 값 하나 | `Optional<T>` + `map` `orElse` | 아래 설명 |

### `<String>` — 안에 무엇이 드나

`List<String>`은 "문자열이 든 리스트"다. 꺾쇠 안에는 **참조형만** 들어간다. `List<int>`는 안 되고 `List<Integer>`로 쓴다(B1의 기본형·참조형). 오른쪽 `new ArrayList<>()`의 빈 꺾쇠는 "왼쪽과 같은 타입"이라는 뜻이다.

### 람다 — 이름 없는 짧은 함수

`s -> s >= 80`은 "`s`를 받아 `s >= 80`을 돌려주는 함수"다. 매개변수 하나면 괄호를 생략하고, 둘이면 `(id, title) -> ...`. `String::toUpperCase`처럼 메서드 이름을 바로 넘기는 짧은 형태(메서드 참조)도 있다. 거르기·바꾸기는 `list.stream()`으로 **흐름**을 연 뒤 `filter`·`map`을 잇고, 마지막에 `.toList()`로 다시 리스트를 만든다.

### `Optional` — "없을 수도 있음"을 타입으로

저장소에서 글 하나를 찾으면 있을 수도, 없을 수도 있다. 이걸 `null`로 돌려주면 받는 쪽이 확인을 잊고 터진다. 그래서 "있거나 없는 값 하나"를 담는 상자 `Optional<T>`를 쓴다. 저장소의 `findById`가 `Optional`을 돌려주는 것이 대표적이다.

| 하고 싶은 일 | Java |
|---|---|
| 없으면 기본값 | `found.orElse("없음")` |
| 있으면 안의 값을 바꾸기 | `found.map(p -> p.title())` |
| 없으면 예외 | `found.orElseThrow(() -> new PostNotFoundException(id))` |
| 있는지 확인 | `found.isPresent()` |

백엔드에서 가장 많이 보는 줄은 마지막 `orElseThrow`다. "글이 없으면 예외 → 404 응답"으로 이어진다(B7).

## 예시

jshell에서 그대로 실행한 결과다(Java 21). `jshell>` 뒤가 입력, 그 아래가 출력이다. jshell은 `java.util`(List·Map·Optional 등)을 미리 import 해 둔다. 파일로 쓸 때는 `import java.util.*;`이 필요하다.

### List와 람다

```text
jshell> List<String> titles = new ArrayList<>();
titles ==> []
jshell> titles.add("첫 글");
$2 ==> true
jshell> titles.add("둘째 글");
$3 ==> true
jshell> titles.get(0)
$4 ==> "첫 글"
jshell> titles.size()
$5 ==> 2
jshell> List<Integer> scores = List.of(70, 85, 90, 55);
scores ==> [70, 85, 90, 55]
jshell> scores.stream().filter(s -> s >= 80).toList()
$7 ==> [85, 90]
jshell> scores.stream().map(s -> s + 5).toList()
$8 ==> [75, 90, 95, 60]
jshell> scores.stream().mapToInt(s -> s).sum()
$9 ==> 300
jshell> for (String t : titles) System.out.println("- " + t);
- 첫 글
- 둘째 글
```

### Map

```text
jshell> Map<String, Integer> likes = new HashMap<>();
likes ==> {}
jshell> likes.put("첫 글", 3);
$12 ==> null
jshell> likes.put("둘째 글", 10);
$13 ==> null
jshell> likes.get("첫 글")
$14 ==> 3
jshell> likes.get("없는 글")
$15 ==> null
jshell> likes.getOrDefault("없는 글", 0)
$16 ==> 0
jshell> likes.containsKey("둘째 글")
$17 ==> true
```

`put`이 `null`을 돌려준 건 "그 키에 원래 있던 값이 없었다"는 뜻이다.

### Optional

```text
jshell> Optional<String> found = titles.stream().filter(t -> t.startsWith("둘")).findFirst();
found ==> Optional[둘째 글]
jshell> Optional<String> missing = titles.stream().filter(t -> t.startsWith("셋")).findFirst();
missing ==> Optional.empty
jshell> found.orElse("없음")
$20 ==> "둘째 글"
jshell> missing.orElse("없음")
$21 ==> "없음"
jshell> missing.isPresent()
$22 ==> false
jshell> found.map(t -> t.length()).orElse(0)
$23 ==> 4
```

## 따라 해 보기

15분.

1. jshell을 열고 위 [예시](#예시)의 세 묶음을 순서대로 친다. 같은 순서로 치면 `$7` 같은 번호까지 같다. `/exit`로 나온다.
2. 새 jshell을 열고, 저장소의 `findById`를 흉내 낸다.

```text
jshell> Map<Long, String> posts = Map.of(1L, "첫 글", 2L, "둘째 글");
posts ==> {1=첫 글, 2=둘째 글}
jshell> Optional<String> findById(long id) { return Optional.ofNullable(posts.get(id)); }
|  created method findById(long)
jshell> findById(1)
$3 ==> Optional[첫 글]
jshell> findById(9)
$4 ==> Optional.empty
jshell> findById(9).orElseThrow(() -> new IllegalArgumentException("글이 없습니다: 9"))
|  Exception java.lang.IllegalArgumentException: 글이 없습니다: 9
|        at lambda$do_it$$0 (#5:1)
|        at Optional.orElseThrow (Optional.java:403)
|        at (#5:1)
```

`Optional.ofNullable(값)`은 값이 `null`이면 빈 상자, 아니면 값이 든 상자를 만든다. 마지막 줄의 예외가 B7에서 404 응답으로 바뀐다. 첫 줄의 `{1=첫 글, 2=둘째 글}` 순서는 실행마다 다를 수 있다(4번).

3. 이어서 람다를 두 가지로 써 본다.

```text
jshell> List<String> names = List.of("kim", "lee", "park");
names ==> [kim, lee, park]
jshell> names.stream().map(n -> n.toUpperCase()).toList()
$7 ==> [KIM, LEE, PARK]
jshell> names.stream().map(String::toUpperCase).toList()
$8 ==> [KIM, LEE, PARK]
```

두 줄은 같은 일을 한다. 실무 코드에서 `String::toUpperCase`, `PostResponse::from` 같은 모양을 보면 "그 메서드를 람다로 넘긴 것"이라고 읽는다.

4. **Map의 순서를 확인한다.** jshell을 껐다 켜며 `Map.of(1L, "a", 2L, "b", 3L, "c")`를 여러 번 쳐 본다. 실측에서는 여섯 번에 `{2=b, 1=a, 3=c}`, `{1=a, 3=c, 2=b}`, `{3=c, 2=b, 1=a}`처럼 실행마다 순서가 달랐다. `HashMap`·`Map.of`는 순서를 약속하지 않는다. 순서가 필요하면 `LinkedHashMap`을 쓴다. 3번에 이어서 치면:

```text
jshell> Map<String, Integer> ordered = new LinkedHashMap<>();
ordered ==> {}
jshell> ordered.put("다", 3);
$10 ==> null
jshell> ordered.put("가", 1);
$11 ==> null
jshell> ordered.put("나", 2);
$12 ==> null
jshell> ordered
ordered ==> {다=3, 가=1, 나=2}
```

## 일부러 틀려 보기

새 jshell에서 ①~③을 순서대로 친 결과다. `(#2:1)` 같은 표시는 "2번째 입력의 1번째 줄"이라는 뜻이다. 다른 줄을 끼워 치면 번호가 달라진다.

### ① `List.of`로 만든 리스트에 추가한다

```text
jshell> List<Integer> scores = List.of(70, 85, 90, 55);
scores ==> [70, 85, 90, 55]
jshell> scores.add(100);
|  Exception java.lang.UnsupportedOperationException
|        at ImmutableCollections.uoe (ImmutableCollections.java:142)
|        at ImmutableCollections$AbstractImmutableCollection.add (ImmutableCollections.java:147)
|        at (#2:1)
```

`List.of`·`Map.of`로 만든 것은 **바꿀 수 없다**(record처럼 불변). 컴파일은 되고 실행 중에 터진다. **고치기**: 바꿔야 하면 `new ArrayList<>(scores)`로 복사해서 쓴다.

```text
jshell> List<Integer> editable = new ArrayList<>(scores);
editable ==> [70, 85, 90, 55]
jshell> editable.add(100);
$4 ==> true
```

### ② 꺾쇠 안에 기본형을 넣는다

```text
jshell> List<int> nums = List.of(1, 2);
|  Error:
|  unexpected type
|    required: reference
|    found:    int
|  List<int> nums = List.of(1, 2);
|       ^-^
```

"참조형이 와야 하는데 `int`가 왔다". **고치기**: `List<Integer>`.

### ③ 빈 `Optional`에서 값을 꺼낸다

```text
jshell> Optional<String> missing = Optional.empty();
missing ==> Optional.empty
jshell> missing.get()
|  Exception java.util.NoSuchElementException: No value present
|        at Optional.get (Optional.java:143)
|        at (#6:1)
```

`get()`은 "당연히 있다"고 믿고 꺼낸다. 없으면 `No value present`. 로그에서 이 문장을 보면 누군가 빈 `Optional`에 `get()`을 부른 것이다. **고치기**: `orElse(기본값)`이나, 없을 때 의미 있는 예외를 던지는 `orElseThrow(() -> new PostNotFoundException(id))`.

## 확인 문제

**1.** `posts`에서 좋아요가 10개보다 많은 글의 제목만 뽑아 리스트로 만들어라. `posts`는 `List<Post>`, `Post`는 `record Post(String title, int likes)`.

<details>
<summary>정답</summary>

`posts.stream().filter(p -> p.likes() > 10).map(p -> p.title()).toList()`. `filter`로 거르고 `map`으로 제목만 남긴다. record 값은 `likes()`처럼 괄호로 꺼낸다. 앞에 `stream()`, 끝에 `toList()`가 붙는다. jshell 실측: 좋아요 5·20·11인 글 a·b·c에서 `[b, c]`.
</details>

**2.** `Map<String, Integer> likes`에 없는 키로 `likes.get("x")`를 하면? 0을 받고 싶으면?

<details>
<summary>정답</summary>

`null`이 나온다(실측 `$15 ==> null`). 0을 원하면 `likes.getOrDefault("x", 0)`. 주의: `int n = likes.get("x");`처럼 바로 `int`에 넣으면 실행 중에 터진다. 실측: `NullPointerException: Cannot invoke "java.lang.Integer.intValue()" because the return value of "java.util.Map.get(Object)" is null`(B1의 `Integer` → `int`).
</details>

**3.** `List.of("a", "b").add("c")`는 컴파일될까? 실행하면?

<details>
<summary>정답</summary>

컴파일은 된다(`List`에는 `add` 메서드가 있다). 실행하면 `UnsupportedOperationException`. `List.of`가 만든 리스트는 바꿀 수 없는 구현이다.
</details>

**4.** `findById(id)`가 `Optional<Post>`를 돌려준다. "없으면 `PostNotFoundException`을 던지고, 있으면 `Post`를 받는" 한 줄을 써라.

<details>
<summary>정답</summary>

`Post post = repository.findById(id).orElseThrow(() -> new PostNotFoundException(id));`. `orElseThrow`에는 "예외를 만드는 람다"를 넘긴다. 값이 있으면 그 값이 나오고, 없을 때만 람다가 실행되어 예외가 던져진다.
</details>

**5.** API 응답의 항목이 넣은 순서와 다르게 나오고, 서버를 다시 띄우면 순서가 또 바뀌기도 한다. 서버 코드에 `HashMap`·`Map.of`가 보인다. 무엇을 의심하나?

<details>
<summary>정답</summary>

`HashMap`(그리고 `Map.of`)은 순서를 약속하지 않는다. 넣은 순서를 지키지 않고, 실측에서 `Map.of`는 jshell을 새로 띄울 때마다 순서가 달랐다. 넣은 순서가 필요하면 `LinkedHashMap`, 정렬이 필요하면 리스트로 바꿔 `sorted`로 정렬한다.
</details>

## 더 깊이

- [P10 자료구조 실무 사용법](../docs/knowledge/P10-data-structures-usage.md) — List·Set·Map·Queue를 언제 쓰나
- [P31 Stream 실무 패턴](../docs/knowledge/P31-stream-patterns.md) — for문과 나란히 놓은 패턴들
- [J08 람다·함수형 인터페이스](../docs/knowledge/J08-lambda-functional.md) — `->` 뒤에서 무슨 일이 일어나나
- [J07 컬렉션 프레임워크 내부](../docs/knowledge/J07-collections-internals.md) — HashMap이 왜 순서를 안 지키나
- [J03 제네릭](../docs/knowledge/J03-generics.md) — `<T>`의 규칙
- [W21 null 처리 전략](../docs/knowledge/W21-null-handling.md) — Optional을 어디에 쓰고 어디에 안 쓰나

## 다음

[B7. 예외 — try/catch, 체크·언체크](B7-exceptions.md) — `orElseThrow`가 던진 예외가 어떻게 404 응답이 되는지.
