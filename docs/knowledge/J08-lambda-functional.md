# J08. 람다·함수형 인터페이스

> 3줄 요약 — 람다는 **함수형 인터페이스의 추상 메서드 하나를 구현하는 표현식**이며, 대상형이 문맥에서 결정한다.
> 캡처한 지역 변수와 매개변수는 final 또는 effectively final이어야 하지만, 그 참조가 가리키는 객체의 변경까지 금지되지는 않는다.
> invokedynamic/LambdaMetafactory는 런타임 연결 방식을 설명할 뿐, 람다 객체의 클래스·동일성·할당 최적화를 코드가 가정하게 해주지 않는다.

## 1. 왜 알아야 하나

Optional.ofNullable(user).orElse(createGuest())는 결과가 이미 있어도 createGuest()를 먼저 실행한다. 외부 호출·기록 같은 부수 효과가 있으면 결과가 중복될 수 있다. 값이 있을 때 계산을 건너뛰려면 orElseGet(this::createGuest)를 쓴다.

루프 인덱스나 합계를 람다 안에서 바꾸려 하면 컴파일 오류가 난다. “람다는 변수 변경이 안 된다”고만 외우면 객체 변경까지 금지된 것으로 오해한다. 제약은 캡처 지역 변수 자체의 재대입에 적용되고, 참조가 가리키는 객체 상태는 바뀔 수 있다. 동시성 안전성은 별개다.

메서드 참조는 평가 시점도 중요하다. serviceFactory.create()::send는 참조를 만들 때 수신 객체를 평가하고 보관하므로 그때 null이면 즉시 예외가 난다. Function.compose와 andThen의 방향을 뒤집으면 검증·정규화 순서가 바뀔 수 있다.

면접에서는 “람다가 익명 내부 클래스와 똑같은 객체인가?”, “지역 변수가 effectively final인 이유는?”, “Optional은 언제 반환하는가?”를 한 덩어리로 묻는다. 문법, 타입 추론, 캡처와 런타임 연결을 분리해 설명할 수 있어야 한다.

## 2. 핵심 개념

람다는 함수형 인터페이스 타입에 맞춰 동작을 표현한다. Java의 람다 자체에는 독립적인 함수 타입이 없다. 예를 들어 x -> x + 1은 대입 대상이 IntUnaryOperator인지 Function<Integer, Integer>인지 문맥이 알려줘야 타입이 결정된다. 이처럼 문맥이 제공하는 함수형 인터페이스 타입을 대상형(target type)이라고 한다.

| 용어 | 뜻 | 대표 예 |
|---|---|---|
| 함수형 인터페이스 | 하나의 함수형 메서드 계약을 가진 인터페이스. default/static 메서드는 SAM 수를 늘리지 않으며 같은 계약의 상속 선언은 하나로 취급될 수 있다. | Runnable, Comparator<T>, Function<T,R> |
| SAM / 함수형 메서드 | 람다의 매개변수와 반환값이 대응하는 유일한 추상 메서드 계약 | Predicate<T>.test(T) |
| 대상형 | 람다 또는 메서드 참조에 필요한 매개변수·반환·예외 문맥을 제공하는 타입 | Predicate<String> p = String::isEmpty |
| 캡처 | 람다 동작이 바깥 지역 변수, this, super를 사용하도록 람다 생성 시 필요한 값을 보유하는 것 | int offset = 2; x -> x + offset |
| 함수 합성 | 한 동작의 결과를 다음 동작의 입력으로 전달 | f.andThen(g), f.compose(g) |
| Optional<T> | 존재할 수도 없는 값 하나를 표현하는 값 기반 컨테이너 | 검색 결과의 부재를 반환값으로 표현 |

@FunctionalInterface는 의도를 표시하고 컴파일러가 SAM 조건을 검사하도록 돕는다. 이 애노테이션이 없어도 조건에 맞으면 함수형 인터페이스이며, 붙였다고 해서 인터페이스가 람다 전용으로 바뀌는 것도 아니다.

### java.util.function에서 고르기

| 인터페이스 | 함수 모양 | 선택 기준 |
|---|---|---|
| Function<T,R> | T -> R | 입력을 다른 값으로 변환 |
| Consumer<T> | T -> void | 입력을 소비하고 부수 효과 수행 |
| Predicate<T> | T -> boolean | 조건을 판정; and, or, negate로 합성 |
| Supplier<T> | () -> T | 입력 없이 값을 제공 |
| UnaryOperator<T> | T -> T | 입력과 출력 타입이 같은 변환 |
| BiFunction<T,U,R> 등 | 두 입력을 받는 같은 계열 | 두 값으로 결과·조건·동작 구성 |

기본형 전문화는 오토박싱을 줄인다. int 입력에서 객체 결과를 만들면 IntFunction<R>, 객체 입력에서 int 결과를 만들면 ToIntFunction<T>, 조건에는 IntPredicate를 고른다. API는 int, long, double 중심이므로 모든 기본형 변형이 있는 것은 아니다. 박싱이 많은 수치 루프라면 제네릭 Function<Integer,Integer> 대신 전문화 타입을 검토한다.

Function<T,R>의 andThen은 현재 함수 후에 다음 함수를 실행한다. f.andThen(g)는 g(f(x)), f.compose(g)는 f(g(x))다. 타입이 이어지지 않으면 컴파일되지 않고, 합성 중 예외는 호출자에게 전달된다.

### 메서드 참조 네 가지 모양

| 모양 | 예 | 함수형 인터페이스 관점 |
|---|---|---|
| 정적 메서드 | Integer::parseInt | 입력을 정적 메서드 인자로 전달 |
| 특정 객체의 인스턴스 메서드(바인딩) | prefix::concat | prefix가 수신 객체이고 함수 인자는 메서드 인자 |
| 타입으로 지정한 인스턴스 메서드(언바인딩) | String::strip | 첫 함수 인자가 수신 객체, 이후 인자가 메서드 인자 |
| 생성자 | StringBuilder::new | 함수 인자를 생성자 인자로 전달; String[]::new 같은 배열 생성자 참조도 가능 |

오버로드된 메서드 참조는 대상형이 요구하는 시그니처에 따라 선택된다. String::valueOf처럼 모호할 수 있는 경우 타입을 명시하거나 람다로 인자 타입을 드러낸다. 실제 메서드 호출은 함수형 메서드가 실행될 때 일어난다.

### Optional을 쓰는 경계

Optional<T>은 주로 “값이 없을 수 있음”을 반환 타입에서 드러내는 용도다. Optional 변수 자신은 null이 아니어야 한다. Optional.of(value)는 null이면 오류를 내고, nullable 원천을 감쌀 때는 ofNullable(value)를 쓴다. 기본값 선택은 즉시 값이 필요하면 orElse(value), 계산을 부재 상황에만 지연할 수 있으면 orElseGet(supplier)다.

| 연산 | 결과와 용도 | 흔한 착각 |
|---|---|---|
| map(f) | 값이 있으면 변환해 감싼다. 변환이 null을 반환하면 빈 Optional이 된다. | Optional<Optional<T>>을 만들기 쉬움 |
| flatMap(f) | Optional을 반환하는 변환을 적용하고 한 겹으로 평탄화 | map과 같다고 생각해 중첩 타입을 방치 |
| filter(p) | 값이 있고 조건을 통과하면 유지, 아니면 비움 | 조건 불일치와 원래 부재를 구분한다고 생각 |
| orElse(v) | 값이 있으면 그 값, 없으면 v | v가 호출 시점에 이미 계산된다는 사실을 놓침 |
| orElseGet(s) | 값이 없을 때만 공급자를 호출 | 매번 호출하는 콜백이라고 오해 |
| ifPresent(action) | 존재할 때 동작 실행 | 반환값 계산 체인에서 부수 효과 용도로 남용 |

Optional은 부재를 반환값으로 드러낼 때 적합하며, 모든 필드·매개변수를 포장하는 규약은 아니다. 값 기반 클래스이므로 동일성 비교나 동기화에 쓰지 않는다.

다른 하위 주제인 Stream API는 → J09 참조.

## 3. 내부 동작·원리

### 소스의 람다가 실행되기까지

~~~text
소스 문맥
  Predicate<String> p = s -> !s.isBlank()
       │ javac: 대상형·함수형 메서드·변환·예외 검사
       ▼
클래스 파일의 invokedynamic 지점 + 부트스트랩 정보
       │ 최초 연결: LambdaMetafactory가 CallSite 구성
       ▼
CallSite 대상 = 함수 객체를 만드는 팩토리
       │ 캡처 값이 있으면 호출 인자로 전달
       ▼
함수형 인터페이스 인스턴스 ── test(value) ──▶ 구현 동작(MethodHandle)
~~~

1. **컴파일 시 타입을 정한다.** 대상형의 함수형 메서드에 맞춰 매개변수·결과를 추론하고 오버로드·제네릭·예외도 검사한다. Predicate<String>이면 입력은 String, 결과는 boolean이다.
2. **호출 지점을 남긴다.** 일반적인 구현은 클래스 파일의 invokedynamic과 부트스트랩 정보를 사용한다. LambdaMetafactory는 구현 MethodHandle과 인터페이스·시그니처를 받아 CallSite를 구성한다.
3. **연결된 팩토리가 함수 객체를 제공한다.** 람다 평가 때 객체가 생성되거나 재사용될 수 있다. 바깥 값이 필요하면 캡처 인자가 전달되며, 객체 동일성은 사양상 보장이 아니다.
4. **SAM 호출이 구현 동작에 연결된다.** 호출부에는 Predicate.test 같은 함수형 메서드가 보이지만 런타임은 연결된 동작으로 전달한다. 클래스 이름, == 결과, 매 호출 할당 여부는 계약이 아니다.

invokedynamic은 매번 리플렉션으로 메서드를 찾는다는 뜻이 아니다. 부트스트랩이 호출 지점을 연결하며, 람다를 익명 내부 클래스와 동일한 바이트코드나 객체 정체성 보장으로 간주해서는 안 된다.

### effectively final은 캡처한 지역 변수에 적용된다

지역 변수와 매개변수는 final 또는 effectively final이어야 캡처할 수 있다. JLS는 초기값이 있는 지역 변수에 재대입·증감이 없어야 한다고 정한다. 람다가 원래 스택 프레임 이후에도 실행될 수 있어 캡처 값과 실행 시점의 관계를 분명히 하는 제약이다.

~~~java
int limit = 5;                 // 허용: 선언 뒤 재대입 없음
Predicate<Integer> p = n -> n > limit;

int count = 0;
// Runnable r = () -> count++;  // 컴파일 오류: 캡처 지역 변수 재대입

StringBuilder log = new StringBuilder();
Runnable r = () -> log.append("x"); // 허용: log 참조 자체는 재대입되지 않음
~~~

log가 effectively final이라는 말은 StringBuilder가 불변이거나 스레드 안전하다는 뜻이 아니다. 참조는 고정되어도 객체 상태는 바뀌며, 여러 스레드에서 실행하면 동기화가 필요하다. 클래스 필드와 배열 원소도 가변 접근이 가능하지만 경쟁 조건은 그대로 남는다.

### 바인딩된 메서드 참조는 수신 객체를 먼저 평가한다

receiver::method 꼴에서 receiver가 식이면 참조 평가 시 수신 객체를 구하고 보관한다. 후속 함수형 메서드 호출 때마다 다시 실행하지 않는다.

~~~java
Supplier<Service> supplier = ...;
Function<Request, Result> bound = supplier.get()::handle; // get()은 지금 호출
Function<Request, Result> delayed = request -> supplier.get().handle(request); // 실행마다 get()
~~~

bound 생성 시 supplier.get()이 null이면 NullPointerException이 난다. Service::handle은 수신 객체가 함수 첫 인자로 오는 언바인딩 참조다.

## 4. 코드로 확인

세 예제는 지정된 Corretto JDK 21로 단일 파일 실행했고, 붙인 출력은 실행 결과다. 문법은 Java 8 이후 기능만 사용한다.

### 예제 1 — 함수형 타입과 합성

~~~java
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;

public class FunctionCompositionDemo {
    public static void main(String[] args) {
        Function<String, Integer> parse = Integer::parseInt;
        Function<Integer, Integer> twice = n -> n * 2;

        System.out.println("andThen=" + parse.andThen(twice).apply("21"));
        System.out.println("compose=" + twice.compose(parse).apply("21"));

        Predicate<Integer> positive = n -> n > 0;
        Predicate<Integer> even = n -> n % 2 == 0;
        System.out.println("positiveEven=" + positive.and(even).test(42));

        Supplier<String> fallback = () -> "anonymous";
        Consumer<String> print = System.out::println;
        print.accept("fallback=" + fallback.get());
    }
}
~~~

실행 출력:

~~~text
andThen=42
compose=42
positiveEven=true
fallback=anonymous
~~~

parse.andThen(twice)와 twice.compose(parse)는 둘 다 twice(parse(x))다. Predicate.and는 왼쪽 조건이 거짓이면 오른쪽을 평가하지 않는 단락 평가를 제공한다.

### 예제 2 — 메서드 참조 네 가지와 캡처

~~~java
import java.util.function.Function;
import java.util.function.IntUnaryOperator;
import java.util.function.Supplier;
import java.util.function.ToIntFunction;

public class MethodReferenceCaptureDemo {
    public static void main(String[] args) {
        ToIntFunction<String> parse = Integer::parseInt;
        System.out.println("static=" + parse.applyAsInt("42"));

        String prefix = "db";
        Function<String, String> bound = prefix::concat;
        System.out.println("bound=" + bound.apply("-prod"));

        Function<String, String> unbound = String::strip;
        System.out.println("unbound=" + unbound.apply("  abc  "));

        Supplier<StringBuilder> constructor = StringBuilder::new;
        System.out.println("constructor=" + constructor.get().append("ready"));

        int base = 40;
        IntUnaryOperator addBase = n -> n + base;
        System.out.println("capture=" + addBase.applyAsInt(5));

        StringBuilder state = new StringBuilder();
        Runnable appendOne = () -> state.append('1');
        appendOne.run();
        state.append('2');
        System.out.println("mutableHolder=" + state);
    }
}
~~~

실행 출력:

~~~text
static=42
bound=db-prod
unbound=abc
constructor=ready
capture=45
mutableHolder=12
~~~

base는 재대입하지 않아 캡처할 수 있다. state도 참조 재대입은 없으므로 캡처 가능하며, 이 예는 같은 빌더의 변경이 람다 밖에서도 관찰된다는 뜻이다. 그 변경이 여러 스레드에서 안전하다는 뜻은 아니다.

### 예제 3 — Optional 변환과 기본값 평가 시점

~~~java
import java.util.Optional;

public class OptionalUsageDemo {
    private static Optional<String> findEmail() {
        return Optional.empty();
    }

    private static String expensiveDefault() {
        System.out.println("default-computed");
        return "fallback";
    }

    public static void main(String[] args) {
        Optional<String> name = Optional.of("  Ada  ");
        String displayName = name.map(String::strip)
                .filter(value -> !value.isEmpty())
                .orElseGet(() -> "anonymous");
        System.out.println("displayName=" + displayName);

        String email = name.flatMap(ignored -> findEmail()).orElse("no-email");
        System.out.println("email=" + email);

        String eager = name.orElse(expensiveDefault());
        System.out.println("eager=" + eager);

        String lazy = name.orElseGet(OptionalUsageDemo::expensiveDefault);
        System.out.println("lazy=" + lazy);
    }
}
~~~

실행 출력:

~~~text
displayName=Ada
email=no-email
default-computed
eager=  Ada  
lazy=  Ada  
~~~

findEmail의 반환이 이미 Optional<String>이므로 flatMap은 중첩 컨테이너를 만들지 않는다. orElse 인자는 orElse 호출 전에 계산되기 때문에 값이 있는 경우에도 default-computed가 찍힌다. orElseGet은 값이 있어 공급자를 호출하지 않는다.

## 5. 버전별 변화 — 왜 바뀌었나

- **Java 8 — 람다, 메서드 참조, java.util.function (JEP 126, Delivered).** 익명 클래스는 짧은 동작 하나를 라이브러리에 전달하기에 보일러플레이트가 컸고, 반복·병렬 작업을 라이브러리가 제어하기도 어려웠다. 람다와 메서드 참조, 호출 지점 연결을 위한 라이브러리/JVM 지원이 함께 들어왔다. → [JEP 126](https://openjdk.org/jeps/126), [Java 25 java.util.function](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/function/package-summary.html).
- **Java 11 — 람다 매개변수에 var 허용 (JEP 323, Delivered).** 기존 암시적 타입 매개변수 문법은 매개변수에 애노테이션을 붙이거나 수식자를 쓸 때 명시적 타입으로 바꿔야 했다. 이제 (var x, var y) -> ...처럼 전체 매개변수를 일관되게 var로 선언해 애노테이션을 유지하면서 추론을 쓸 수 있다. (var x, y) -> ...처럼 var와 암시적 표기를 섞을 수는 없다. → [JEP 323](https://openjdk.org/jeps/323).
- **Java 25 기준.** Function.compose/andThen과 Optional API 설명은 Java SE 25 문서를 따른다. → [Function API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/function/Function.html), [Optional API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Optional.html).

## 6. 실무 가이드

- 입력→결과·조건·부수 효과·입력 없는 값 제공이면 Function/Predicate/Consumer/Supplier를 먼저 고른다. 타입으로 계약을 드러낼 수 있다.
- 함수의 의미가 비즈니스 도메인에 중요하거나, checked exception을 선언해야 하거나, 이름 있는 정책을 여러 계층에서 공유해야 하면 전용 @FunctionalInterface를 만든다. Function에는 throws IOException을 선언할 수 없으므로 억지로 런타임 예외로 감싸기보다 계약에서 예외를 표현하는 편이 분명하다.
- 본문이 짧고 의미가 선명하면 람다를 쓴다. 분기·예외 변환·상태 변경이 많아지면 이름 있는 메서드로 옮긴다.
- 이미 존재하는 메서드가 인터페이스 동작과 그대로 맞으면 메서드 참조를 쓴다. 오버로드가 모호하거나 입력 변환·널 처리·부수 효과가 추가되면 람다로 의도를 명시한다.
- 순수 변환을 합성할 때 andThen을 입력→출력 순서로 쓴다. compose를 섞으면 f(g(x)) 순서를 확인한다.
- nullable이던 조회 결과를 공개 API에서 표현할 때 Optional<T>를 반환한다. 인자 검증 오류나 권한 거부처럼 “조회 결과 없음”과 다른 실패는 예외나 명시적 결과 타입으로 표현한다.
- **기본값 추천:** 조회 메서드에는 Optional<T>를 반환하고 호출자는 map/flatMap/orElseGet으로 처리한다. 부재 여부가 API 계약에 직접 보이며, 기본값 생성이 부재일 때만 실행되도록 할 수 있다.
- 값 기반 객체를 ==로 비교하거나 synchronized(optional)로 잠그지 않는다. 값의 동일성은 equals/도메인 식별자로 판단하고 잠금은 명시적인 전용 락 객체에 둔다.

## 7. 함정·안티패턴

1. **증상:** 결과가 있는데도 기본 객체 생성·메트릭 기록이 일어난다 → **원인:** orElse(expensiveCall()) 인자를 호출 전에 평가 → **대처:** 계산이 비싸거나 부수 효과가 있으면 orElseGet(this::expensiveCall)을 쓴다.
2. **증상:** count++를 람다에 넣자 컴파일 오류 → **원인:** 캡처한 지역 변수 자체를 재대입/증감 → **대처:** 루프 구조를 유지하거나 명시적 가변 상태·누적 타입을 선택한다. 원자 카운터는 병렬 갱신이 실제 요구일 때만 선택한다.
3. **증상:** 람다를 여러 스레드에 넘겼더니 값이 유실된다 → **원인:** effectively final인 참조가 가변 객체를 가리키고 그 상태를 동기화 없이 공유 → **대처:** 불변 값 전달, 호출별 로컬 상태, 적절한 동시성 자료구조·락을 사용한다.
4. **증상:** serviceFactory.get()::send를 만들자마자 NPE가 난다 → **원인:** 바인딩된 참조의 수신 객체 식은 참조 평가 때 실행 → **대처:** 실제 실행 시 조회하려는 의도라면 request -> serviceFactory.get().send(request)로 쓴다.
5. **증상:** 검증과 변환 순서가 바뀌어 결과가 틀린다 → **원인:** andThen과 compose를 함수 표기 없이 교환 → **대처:** f.andThen(g) == g(f(x)), f.compose(g) == f(g(x))를 기준으로 이름 있는 중간 함수를 둔다.
6. **증상:** Optional.get()에서 NoSuchElementException → **원인:** 부재를 처리하지 않고 무조건 값을 꺼냄 → **대처:** map, flatMap, orElseThrow 또는 호출부가 선택한 부재 처리를 사용한다. isPresent() 검사 후 get()만 반복하는 흐름은 반환 계약을 정리한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 람다의 타입은 어디서 오는가?

대입·인자 전달·명시적 캐스트 등의 문맥에서 정해지는 대상형에서 온다. 이 타입의 함수형 메서드가 매개변수·반환·허용 예외의 계약을 제공한다. 그래서 대상형이 없는 var f = x -> x는 독립적인 함수 타입이 없어 컴파일되지 않는다.

꼬리질문: 오버로드된 메서드의 인자로 람다를 넘기면? → 각 후보의 대상형으로 적합성을 판단하므로 모호하면 인자 타입을 명시하거나 캐스트로 대상을 특정한다.

### Q2. @FunctionalInterface가 있어야 람다를 받을 수 있나?

아니다. 컴파일러는 인터페이스 구조가 함수형 인터페이스 조건에 맞는지 판단한다. 애노테이션은 “SAM 계약을 유지하겠다”는 의도를 선언하고, 추상 메서드가 추가되는 실수를 컴파일 오류로 잡는다.

꼬리질문: default 메서드를 추가하면 SAM 조건이 깨지는가? → default 메서드는 구현을 제공하므로 추상 메서드 계약 수를 늘리지 않는다.

### Q3. effectively final을 요구하는 이유는?

지역 변수의 저장 공간은 메서드 프레임의 수명과 연결되지만 람다 객체는 더 오래 살아남을 수 있다. Java는 캡처 변수 값과 실행 시점의 관계를 명료하게 하기 위해 재대입을 제한한다. 명시적으로 final을 쓰지 않아도 재대입이 없으면 같은 규칙으로 캡처할 수 있다.

꼬리질문: 참조가 가리키는 객체도 불변이어야 하나? → 아니다. 참조는 재대입하지 않아도 객체 상태 변경은 가능하지만, 가시성·경쟁 조건은 별도 해결이 필요하다.

### Q4. 익명 내부 클래스와 람다는 같은 구현인가?

같은 소스 문법도 같은 바이트코드 표현도 아니다. 현대 JDK의 일반적인 구현은 람다 지점에 invokedynamic을 두고 LambdaMetafactory로 호출 지점을 연결한다. 사양은 함수 동작을 보장하지 람다 클래스 이름이나 객체 동일성을 보장하지 않는다.

꼬리질문: 람다 객체를 ==로 비교해도 되는가? → 안 된다. 캐싱·할당 최적화에 따라 결과가 달라질 수 있으므로 identity를 계약으로 삼지 않는다.

### Q5. String::strip과 "abc"::strip은 어떻게 다른가?

첫 번째는 언바인딩 참조로, Function<String,String>에서 첫 인자가 수신 객체다. 두 번째는 바인딩 참조로, "abc"가 수신 객체이며 참조를 만들 때 그 객체 식을 평가한다. 뒤쪽 참조는 함수형 메서드의 인자를 받지 않는 Supplier<String> 같은 대상형에 맞는다.

꼬리질문: supplier.get()::run은 언제 get()을 부르는가? → 메서드 참조를 평가하는 그 시점이다. 함수가 나중에 실행될 때마다 조회하려면 람다 본문 안으로 조회를 옮긴다.

### Q6. andThen과 compose의 실행 방향을 설명하라.

f.andThen(g)는 먼저 f, 다음 g라서 g(f(x))다. f.compose(g)는 먼저 g, 다음 f라서 f(g(x))다. 타입이 연결되고 합성 함수의 실행 순서가 도메인 규칙과 맞는지 확인해야 한다.

꼬리질문: 중간 함수가 예외를 던지면? → 예외는 합성 함수 호출자에게 전달된다. 함수 합성이 예외를 자동 변환하거나 복구하지 않는다.

### Q7. 언제 Optional을 반환하고 orElseGet을 쓰는가?

조회 결과 부재가 정상적인 결과일 수 있고 호출자가 처리해야 할 때 반환 타입으로 표현한다. 존재 시 변환은 map, Optional을 반환하는 변환은 flatMap으로 이어간다. 기본값 계산이 부재일 때만 필요하면 orElseGet을 쓴다.

꼬리질문: orElse와 orElseGet은 존재 시 어떻게 다른가? → orElse 인자는 이미 평가되어 있지만 orElseGet 공급자는 호출하지 않는다. 따라서 비용이나 부수 효과가 있으면 뒤쪽을 선택한다.

## 9. 참고문헌

- java.util.function 패키지 요약 — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/function/package-summary.html — 대상형과 공통 함수 모양.
- Function<T,R> API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/function/Function.html — 합성 메서드의 타입과 실행 순서.
- JLS §4.12.4, final 변수 — https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html#jls-4.12.4 — effectively final 판정.
- JLS §9.8, 함수형 인터페이스 — https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html#jls-9.8 — SAM 계약.
- JLS §15.13, 메서드 참조 및 §15.27, 람다 — https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html#jls-15.13 — 참조 문법과 수신 식 평가.
- LambdaMetafactory API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/LambdaMetafactory.html — 연결·캡처·호출과 identity 비보장.
- Optional<T> API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Optional.html — 반환 용도, 값 기반 제약, 변환·기본값 API.
- JEP 126: Lambda Expressions & Virtual Extension Methods — https://openjdk.org/jeps/126 — Java 8 도입 범위와 기존 라이브러리·반복 모델의 한계를 확인.
- JEP 323: Local-Variable Syntax for Lambda Parameters — https://openjdk.org/jeps/323 — Java 11의 람다 매개변수 var 문법 및 혼용 제한을 확인.
