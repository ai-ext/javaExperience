# J03. 제네릭

> - 제네릭은 타입을 매개변수로 받아 컴파일 시점에 잘못된 조합을 막는다. Java는 대부분의 타입 인자를 바이트코드 실행 전에 지우고, 캐스트와 브리지 메서드를 컴파일러가 보충한다.
> - `List<Integer>`는 `List<Number>`의 하위 타입이 아니다. 입력 전용은 `? super T`, 출력 전용은 `? extends T`로 표현하는 PECS를 기본으로 삼는다.
> - raw type, 제네릭 배열, 가변 인자 배열을 섞으면 힙 오염이 생길 수 있다. `@SafeVarargs`는 구현자가 지는 안전성 약속이다.

## 1. 왜 알아야 하나

`List`에 여러 종류의 객체를 넣고 나중에 캐스팅하는 코드는 잘못된 값이 들어온 지점과 `ClassCastException`이 난 지점이 멀다. API 호출부에서 한참 뒤 장애가 나고 원인은 예전 raw type 대입일 수 있다. `List<String>`처럼 정확히 선언하면 컴파일러가 잘못된 삽입을 그 자리에서 거부한다.

실무에서 자주 헷갈리는 것은 제네릭 타입 사이의 하위 타입 관계다. `Integer extends Number`라는 사실만 보고 `List<Integer>`를 `List<Number>`에 대입하면 컴파일 오류가 난다.

억지 캐스트로 우회하면 호출자가 `Double`을 넣을 수 있어 원래 `Integer` 전용 참조의 불변식이 깨진다. 이때 입력·출력 방향을 나타내는 와일드카드가 필요하다.

소거 뒤에도 컴파일러는 사용 지점에 캐스트와 브리지를 넣어 정적 타입과 동적 디스패치를 유지한다. raw type이나 배열 별칭이 검사를 우회하면 예외가 늦게 발생한다.[6][7]

## 2. 핵심 개념

제네릭 선언은 `<T>` 같은 타입 매개변수를 도입하고, `Box<String>`은 그 자리에 실제 타입 인자를 넣은 매개변수화 타입이다. 컴파일러가 선언과 사용처의 타입 관계를 검사한다. 런타임에 임의 타입의 클래스를 생성하는 템플릿 인스턴스화는 아니다.[10]

| 용어 | 뜻 | 예 |
|---|---|---|
| 타입 매개변수 | 제네릭 선언이 도입하는 타입 이름 | `class Box<T>`, `<T> T id(T x)` |
| 타입 인자 | 사용 지점에서 대입하는 구체 타입 | `Box<String>` |
| 매개변수화 타입 | 타입 인자가 적용된 제네릭 클래스·인터페이스 | `Map<String, Integer>` |
| 경계 타입 | 타입 인자가 만족할 상한. `extends`는 인터페이스 경계에도 사용 | `<T extends Number & Comparable<T>>` |
| 와일드카드 | 하나지만 모르는 타입을 표현하는 `?` | `List<?>`, `List<? extends Number>` |
| raw type | 타입 인자를 생략한 호환성 형태 | `List`, `Map` |
| 소거(erasure) | 타입 변수를 경계 또는 `Object`로 치환 | `T` → 첫 경계 또는 `Object` |
| 브리지 메서드 | 소거 뒤 오버라이드 관계를 보존하는 합성 메서드 | `setData(Object)` → `setData(Integer)` |
| 힙 오염 | 매개변수화 타입 참조가 선언한 타입 인자와 맞지 않는 객체를 가진 상태 | `List<String>`에서 실제 `Integer`가 나옴 |
| reifiable type | 런타임에도 타입을 완전히 확인할 수 있는 타입 | `String`, `List<?>`, `List` |
| 타입 토큰 | `Type`/`Class`로 타입 정보를 전달·보존하는 표현 | `Class<T>`, `TypeRef<T>` |

### 와일드카드와 불공변성

일반 클래스는 `Integer`가 `Number`의 하위 타입이면 `Integer`를 `Number` 변수에 대입할 수 있다. 제네릭은 기본적으로 불공변이다. `List<Integer>`와 `List<Number>`는 서로의 하위 타입이 아니다. `List<Number>`를 받는 코드는 `Double`도 추가할 수 있으므로 두 참조가 같은 리스트를 가리키게 허용하면 타입 불변식이 깨진다.[5][10]

`List<? extends Number>`는 “어떤 한 타입 `CAP`의 리스트이며 `CAP extends Number`”라는 뜻이다. 호출자는 `CAP`을 모르므로 `Number`로 읽을 수 있지만, 일반 값을 추가할 수 없다(`null`은 모든 참조 타입에 대입 가능).

`List<? super Integer>`는 미상 타입 `CAP`에 `Integer`가 대입 가능하다는 뜻이다. `Integer`를 넣을 수 있고 꺼낼 때 보장되는 것은 `Object`뿐이다.[4][5]

| 타입 | 읽기 | 쓰기 | 용도 |
|---|---|---|---|
| `List<T>` | `T` | `T` | 입력·출력을 같은 타입으로 연결 |
| `List<? extends T>` | `T` | `null` 외에는 불가 | 생산자, 복사 원본 |
| `List<? super T>` | `Object` | `T` | 소비자, 복사 대상 |
| `List<?>` | `Object` | `null` 외에는 불가 | 타입을 몰라도 읽기 전용으로 취급 |

PECS는 “Producer Extends, Consumer Super”다. `copy(List<? extends T> src, List<? super T> dst)`는 원본에서 `T`를 읽어 목적지에 넣는다. 양방향으로 같은 타입을 연결하면 이름 있는 `T`가 정확하다. 와일드카드 결과를 다시 써야 하면 캡처 도우미 메서드로 고정한다.[4][5]

### 배열과 제네릭의 차이

| 특성 | 배열 | 제네릭 |
|---|---|---|
| 하위 타입 관계 | 공변: `Integer[]` → `Number[]` | 불공변: `List<Integer>` ↛ `List<Number>` |
| 실행 시 정보 | 컴포넌트 타입이 reified되어 저장 검사 | 타입 인자는 대개 소거되어 개별 원소 타입 검사 불가 |
| 실패 시점 | 대입은 통과해도 `ArrayStoreException` 가능 | 보통 컴파일 단계, raw 경계를 넘으면 나중의 캐스트 실패 |
| 생성 | `new String[4]` | `new List<String>[4]` 금지, `new List<?>[4]` 허용 |

`Number[] a = new Integer[1]`은 공변성 때문에 컴파일되지만 `a[0] = 1.5`는 런타임 검사에서 실패한다. `List<Integer>[]`는 런타임에 `<Integer>`를 확인할 수 없어 직접 만들지 못한다.

`List<?>`는 reifiable하므로 배열 컴포넌트로 허용된다. unchecked 캐스트·별칭으로 `List<String>[]`처럼 가장하면 다른 종류의 리스트가 들어가고 읽을 때 `String` 캐스트에서 실패한다.[8][9][10]

### raw type과 `List<?>`

`List`는 제네릭 이전 코드와의 호환을 위한 raw type이다. 타입 인자 검사를 포기하므로 여러 종류를 넣을 수 있고 unchecked 경고가 생긴다. `List<?>`는 원소 타입을 모른다는 뜻이지만 타입 검사는 유지한다. 새 코드에서는 raw type 대신 `List<?>`를 사용하고, raw type은 레거시 API 경계에 격리한다.[1][10]

컬렉션 내부 구현은 J07 참조.

## 3. 내부 동작·원리

소스에서 타입 검사를 한 뒤, 클래스 파일에는 제네릭 서명 일부를 남길 수 있지만 실행 메서드 서명은 소거된 타입을 쓴다. JVM은 보통 `List<String>`과 `List<Integer>`의 개별 클래스를 만들지 않는다. 기존 바이트코드·라이브러리 호환성을 돕고, 인자마다 클래스를 복제하지 않는다. “런타임 비용 0”과 같지는 않다. 박싱, 삽입된 캐스트, 메서드 호출 비용은 별개다.[6][10]

~~~text
소스 선언              컴파일러의 검사·추론                 클래스 파일 / 실행
List<String>           잘못된 put을 거부               →     List (타입 인자 소거)
String s = list.get(0)  읽기 결과를 String으로 검사    →     Object 반환 뒤 checkcast String
Base<T>.put(T)          상속·오버라이드 관계 분석      →     bridge put(Object) → put(Integer)
~~~

JLS §4.6에서 타입 변수의 소거는 가장 왼쪽 경계의 소거이고, 경계가 없으면 `Object`다. 따라서 `<T>`의 `T`는 `Object`, `<T extends Number>`의 `T`는 `Number`, `<T extends Number & Comparable<T>>`의 소거도 첫 경계인 `Number`다. 클래스 경계가 있으면 첫 번째에 둔다. 컴파일러가 삽입한 캐스트는 호출자에게 정적 타입을 복원한다.[6][10]

`Node<T>.setData(T)`는 `Node.setData(Object)`로 소거된다. `MyNode extends Node<Integer>`가 정의한 메서드는 `setData(Integer)`다. 소거된 상위 서명과 다르면 raw `Node` 참조의 가상 호출이 하위 구현에 도달하지 않는다.

컴파일러는 `MyNode.setData(Object)` 브리지를 합성하고 `Integer`로 캐스팅한 뒤 실제 메서드를 부른다. raw 참조가 문자열을 넘기면 브리지 캐스트에서 실패한다.

브리지는 소스에 선언하지 않은 synthetic 메서드다. 리플렉션에서는 `isBridge()`·`isSynthetic()`으로 구별할 수 있다.[7]

제네릭 메서드의 `<T>`는 클래스 타입 매개변수와 별개 스코프다. `static <T> T identity(T value)`의 `T`는 인자 타입과 목표 타입을 바탕으로 호출마다 추론한다. 모호하거나 제약을 만족시키지 못하면 `Util.<String>identity(x)`처럼 타입 인자를 명시한다. Java 8 JEP 101은 메서드 인자 문맥과 연결 호출의 타입 추론을 개선했다.[2][14]

소거 때문에 `new T()`, `T.class`, `instanceof List<String>`, `new List<String>[n]`은 허용되지 않는다. `T`의 구체 런타임 클래스나 타입 인자를 알 수 없기 때문이다. `Class<T>`는 `String.class` 같은 토큰이지 `List<String>.class`는 아니다.

전체 구조에는 `Type`/`ParameterizedType` 토큰을 쓴다. `new TypeRef<List<String>>() {}`의 익명 하위 클래스 서명을 `getGenericSuperclass()`로 읽는 방식이며 소거된 변수 `T`의 인자를 복원하지는 못한다.[9][10]

## 4. 코드로 확인

다음 프로그램은 경계 타입과 제네릭 메서드, PECS, 브리지, 배열 공변성과 힙 오염, 타입 토큰을 한 번에 실행한다. raw 호출은 의도적으로 unchecked 경고를 낸다. `@SafeVarargs`는 배열을 바꾸거나 노출하지 않는 `first`에만 적용했다.

~~~java
import java.lang.reflect.Method;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class J03GenericsDemo {
    static <T extends Comparable<? super T>> T max(List<? extends T> values) {
        if (values.isEmpty()) return null;
        T best = values.get(0);
        for (T value : values) if (value.compareTo(best) > 0) best = value;
        return best;
    }
    static <T> void copyAll(List<? extends T> from, List<? super T> to) {
        for (T value : from) to.add(value);
    }
    static class Node<T> { void setData(T value) { } }
    static final class IntNode extends Node<Integer> {
        @Override void setData(Integer value) { }
    }
    @SafeVarargs
    static <T> T first(T... values) {
        return values.length == 0 ? null : values[0];
    }
    @SuppressWarnings("unchecked")
    static void demonstrateHeapPollution() {
        List<String>[] strings = (List<String>[]) new List<?>[1];
        Object[] alias = strings;
        alias[0] = List.of(42); // 런타임 컴포넌트 List 검사에는 통과
        try {
            String value = strings[0].get(0); // 삽입된 String 캐스트가 실패
            System.out.println(value);
        } catch (ClassCastException ex) {
            System.out.println("generic array read -> " + ex.getClass().getSimpleName());
        }
    }
    static abstract class TypeRef<T> {
        final Type type;
        TypeRef() {
            Type parent = getClass().getGenericSuperclass();
            this.type = ((ParameterizedType) parent).getActualTypeArguments()[0];
        }
    }
    public static void main(String[] args) {
        List<Integer> source = List.of(2, 8, 4);
        List<Number> destination = new ArrayList<>();
        copyAll(source, destination);
        System.out.println("max=" + max(source) + "; copied=" + destination);
        System.out.println("first=" + first("green", "blue"));

        IntNode node = new IntNode();
        for (Method method : IntNode.class.getDeclaredMethods()) {
            if (method.getName().equals("setData")) {
                System.out.println("setData(" + method.getParameterTypes()[0].getSimpleName()
                        + ") bridge=" + method.isBridge() + " synthetic=" + method.isSynthetic());
            }
        }
        try {
            @SuppressWarnings({"rawtypes", "unchecked"})
            Node raw = node;
            raw.setData("wrong");
        } catch (ClassCastException ex) {
            System.out.println("raw call -> " + ex.getClass().getSimpleName());
        }

        Number[] numbers = new Integer[1];
        try { numbers[0] = 3.14; }
        catch (ArrayStoreException ex) {
            System.out.println("covariant array store -> " + ex.getClass().getSimpleName());
        }
        demonstrateHeapPollution();

        TypeRef<List<String>> token = new TypeRef<List<String>>() { };
        System.out.println("captured type=" + token.type.getTypeName());
        System.out.println("Class token=" + List.class.getTypeName());
    }
}
~~~

JDK 21 소스 파일 모드로 실행했다. raw 호출에서 unchecked 경고 1건이 났고 출력은 다음과 같다.

~~~text
max=8; copied=[2, 8, 4]
first=green
setData(Integer) bridge=false synthetic=false
setData(Object) bridge=true synthetic=true
raw call -> ClassCastException
covariant array store -> ArrayStoreException
generic array read -> ClassCastException
captured type=java.util.List<java.lang.String>
Class token=java.util.List
~~~

`Class token=java.util.List`는 raw 선언의 클래스 객체다. 타입 토큰은 익명 하위 클래스의 `ParameterizedType` 서명에서 `List<String>`을 읽는다. unchecked 배열 캐스트는 우회 상황 재현용이다.

## 5. 버전별 변화 — 왜 바뀌었나

| 시기 | 변화와 이유 | 근거 |
|---|---|---|
| Java 5 / J2SE 5.0 | JSR 14 제네릭 도입. 컬렉션에서 수동 캐스트를 반복하고 런타임까지 타입 오류 발견이 늦던 문제를 컴파일 검사로 옮겼다. | [15] |
| Java 7 | Project Coin의 다이아몬드 `new ArrayList<>()`는 좌변 타입 인자 반복을 줄였다. Java 9 JEP 213은 익명 클래스에도 허용했다. | [12] |
| Java 8 | JEP 101이 메서드 문맥·연결 호출의 목표 타입 추론을 확장했다. 명시 타입 인자를 줄여도 인자·반환 제약이 복잡한 호출에는 추론 경계가 있었다. | [14] |
| Java 9 | JEP 213이 `@SafeVarargs`를 `private` 인스턴스 메서드까지 허용했다. 오버라이드될 수 없는 private 메서드도 안전성을 선언할 수 있었지만 기존 대상에 빠져 있었다. | [12] |
| Java 10 | JEP 286의 `var`가 초기화식이 있는 지역 변수의 정적 타입 추론을 추가했다. 선언 반복은 장황했지만 이를 메서드 인자·필드·반환 타입까지 넓히면 API 계약이 흐려질 수 있어 지역 범위로 제한했다. | [13] |

핵심 모델인 불공변성, 와일드카드, 타입 소거는 Java SE 25 명세에도 규정되어 있다. 이 모델 자체의 별도 변경은 확인한 자료에서 찾지 못했다. 타입 추론 문법 및 `@SafeVarargs` 적용 범위의 변화와 구분한다.[10][11][12][13][14]

## 6. 실무 가이드

- 기본값: 새 API는 가능한 한 구체 타입 변수 `T`를 유지하고, 입력·출력 방향이 한쪽으로 열릴 때만 와일드카드를 붙인다. 입력만 받으면 `? extends T`, 소비만 하면 `? super T`를 우선한다.
- if 원소를 읽어 상위 타입으로 처리한다면 then `List<? extends T>`를 받는다. 호출자는 안전하게 `T`로 읽을 수 있고 메서드는 임의 추가를 하지 못한다.
- if 받은 `T`를 컬렉션에 넣기만 한다면 then `List<? super T>`를 받는다. `T`와 그 하위 타입 리스트까지 호출할 수 있다.
- if 두 컬렉션 사이를 옮긴다면 then source는 `? extends T`, destination은 `? super T`로 선언한다.
- if 결과 타입이 입력 타입과 연결된다면 then `<T> T transform(T input)`처럼 이름 있는 `T`를 쓴다. 와일드카드 결과를 호출자에게 넘기지 않는다.
- if 비교 가능한 최대값을 구한다면 then `<T extends Comparable<? super T>>`를 고려한다. 비교 계약을 타입의 상위 경계까지 받을 수 있다.
- if 레거시 API가 raw type만 받는다면 then 한 경계 메서드에 raw 변환을 가두고 값을 검사·복사한다. 경고 억제 범위도 좁힌다.
- if 제네릭 배열처럼 보이는 저장소가 필요하다면 then 중첩 컬렉션·`List<?>[]`·`Collection<T>`를 먼저 고려한다. 배열 별칭과 런타임 타입 검사를 따져 선택한다.
- if 비-reifiable 원소의 varargs를 받는다면 then 배열을 수정·노출하지 않는지 증명한 뒤 `@SafeVarargs`를 쓴다. 대상은 생성자 또는 `static`·`final`·`private` 가변 인자 메서드다.[11][12]
- if 리플렉션 API가 `List<String>` 전체를 필요로 한다면 then `Class<T>`가 아닌 `Type`/`ParameterizedType` 기반 토큰을 전달한다. 토큰에 `T`를 넘겨도 소거된 인자가 복원된다고 가정하지 않는다.

## 7. 함정·안티패턴

1. **`List<Integer>`를 `List<Number>`로 대입** → 불공변이고 목적지에서 `Double`을 추가할 수 있다 → 읽기 목적은 `? extends Number`, 입력 목적은 `? super Integer`로 표현한다.
2. **`List<?>`에 임의 값 추가** → 물음표는 미상 타입 하나라 실제 타입과 불일치할 수 있다 → 읽기 계약으로 유지하거나 `? super T`로 바꾼다.
3. **unchecked 경고를 무시한 raw 캐스트** → 타입 검사를 건너뛰어 잘못된 값이 나중 캐스트에서 예외를 낸다 → 레거시 경계에 가두고 변환 시 검증한다.
4. **제네릭 배열을 Object 배열 별칭으로 우회** → 런타임은 `List`만 확인해 `List<Integer>` 저장을 통과시킨 뒤 읽기 캐스트에서 실패한다 → 제네릭 컬렉션을 우선하고 배열 별칭을 노출하지 않는다.
5. **경고를 지우려고 `@SafeVarargs` 추가** → 어노테이션은 런타임 검사 없이 구현이 안전하다는 단언이다 → 가변 배열을 쓰거나 반환하지 않는지 본문을 증명한다.[8][11]
6. **브리지도 소스 메서드라고 가정** → synthetic bridge를 리플렉션 프레임워크가 중복 등록할 수 있다 → 메서드 탐색 시 `isBridge()`·`isSynthetic()`을 확인한다.[7]
7. **`Class<List<String>>` 또는 `List<String>.class` 사용** → 클래스 리터럴은 매개변수화 타입을 나타내지 못한다 → raw `List.class`와 `Type` 토큰의 목적을 구분한다.
8. **generic varargs 배열 반환·저장** → 별칭을 통해 다른 타입의 값이 기록되어 힙 오염이 된다 → 필요한 원소를 `List<T>`로 복사하고 배열 자체를 보관·노출하지 않는다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 타입마다 런타임 클래스를 만들지 않는 이유는?
제네릭은 타입 인자별 코드 생성보다 컴파일 시점 검사와 소거를 택한다. 이는 기존 raw 코드·바이트코드 호환을 돕고 인자마다 클래스를 복제할 필요를 없앤다. 컴파일러는 캐스트로 호출자의 정적 타입을 유지한다.[6][10]

**꼬리질문:** 그러면 실행 비용은 0인가?  
아니다. 박싱·언박싱, 삽입 캐스트, 호출 비용은 별개로 남는다.

### Q2. `List<Integer>`가 `List<Number>`가 아닌 이유는?
후자를 받는 코드가 `Double`을 넣을 수 있어 같은 객체를 보는 `List<Integer>`의 불변식이 깨진다. 기본 타입 관계는 불공변이며, 읽기만 할 경우 `? extends Number`로 제한된 관계를 표현한다.[5]

**꼬리질문:** `? extends Number`에는 `Integer`를 추가할 수 있나?  
아니다. 실제 원소 타입이 `Double`일 수도 있어 안전하지 않다.

### Q3. PECS를 적용하는 상황은?
컬렉션에서 값을 꺼내 상위 타입으로 전달하는 producer는 `? extends T`, `T`를 받아 저장하는 consumer는 `? super T`로 쓴다. 복사 메서드는 원본과 목적지에 각각 적용한다. 양방향으로 연결하면 이름 있는 `T`가 명확하다.[4]

**꼬리질문:** `List<?>`와 `List<? extends Object>` 차이는?  
둘 다 여기서는 미상 타입의 값을 `Object`로 읽는다. 상한을 표시할 필요 없으면 `List<?>`가 간결하다.

### Q4. 브리지 메서드는 무엇을 보존하는가?
타입 소거 후 달라지는 상위·하위 메서드 서명을 연결해 동적 디스패치를 보존한다. 브리지에서 구체 타입으로 캐스팅하므로 잘못된 raw 호출은 그 지점에서 실패할 수 있다.[7]

**꼬리질문:** 리플렉션 검색에서 어떻게 다루나?  
`isBridge()`·`isSynthetic()`을 확인해 일반 API 메서드와 중복 처리하지 않는다.

### Q5. 배열은 공변인데 제네릭은 불공변인 이유는?
배열은 런타임 컴포넌트 타입을 알고 저장 때 검사해 `ArrayStoreException`을 낸다. 제네릭 인자는 소거되어 `List<String>`과 `List<Integer>`를 구별할 수 없으므로 대입을 컴파일 단계에서 차단한다.[9][10]

**꼬리질문:** `new List<?>[n]`은 왜 허용되나?  
`List<?>` 자체는 reifiable이라 런타임에 컴포넌트가 `List`임은 검사할 수 있다. 개별 타입 인자는 검사하지 않는다.

### Q6. raw type과 unbounded wildcard의 차이는?
`List`는 타입 인자를 생략한 호환성 표기라 쓰기와 읽기에 unchecked 위험이 있다. `List<?>`는 구체 타입을 몰라도 정적 타입 검사를 유지해 임의 원소 삽입을 금한다. 새 코드의 미상 타입 표현에는 wildcard가 맞다.[1][10]

**꼬리질문:** raw type을 써도 되는 때는?  
타입 인자가 없는 레거시 API 경계에서만 격리하고, 검증 후 타입 지정 영역으로 넘긴다.

### Q7. `@SafeVarargs`는 어떤 보장인가?
컴파일러 경고를 억제하며 개발자가 비-reifiable 가변 배열을 위험하게 다루지 않는다고 단언한다. 배열을 노출하거나 다른 타입 값을 쓰면 힙 오염이므로 본문 안전성 검토가 필요하다. 적용 대상은 생성자와 `static`·`final`·`private` 메서드다.[11][12]

**꼬리질문:** `String...`에도 붙여야 하나?  
`String`은 reifiable이라 경고가 나지 않으므로 불필요하며 컴파일러가 과용을 경고할 수 있다.

### Q8. 타입 토큰의 용도와 한계는?
리플렉션 API에 `List<String>` 같은 구조를 전달해야 하지만 `Class<T>`가 매개변수화 타입을 나타내지 못할 때 `Type` 기반 토큰을 사용한다. 익명 하위 클래스의 제네릭 서명을 읽는 방식이 대표적이다. 소거된 `T`를 전달해 잃은 인자를 되살릴 수는 없다.[10]

**꼬리질문:** `List.class`는 `Class<List<String>>`인가?  
아니다. raw 선언의 클래스 객체다. `List<String>.class` 문법은 허용되지 않는다.

## 9. 참고문헌

1. Lesson: Generics (Updated) — https://docs.oracle.com/javase/tutorial/java/generics/index.html — 제네릭의 목적과 튜토리얼 범위.
2. Generic Methods — https://docs.oracle.com/javase/tutorial/java/generics/methods.html — 제네릭 메서드와 추론.
3. Bounded Type Parameters — https://docs.oracle.com/javase/tutorial/java/generics/bounded.html — 경계 타입.
4. Wildcards — https://docs.oracle.com/javase/tutorial/java/generics/wildcards.html — 와일드카드.
5. Wildcards and Subtyping — https://docs.oracle.com/javase/tutorial/java/generics/subtyping.html — 불공변성과 하위 타입.
6. Type Erasure — https://docs.oracle.com/javase/tutorial/java/generics/erasure.html — 소거·캐스트·브리지 개요.
7. Effects of Type Erasure and Bridge Methods — https://docs.oracle.com/javase/tutorial/java/generics/bridgeMethods.html — 브리지의 디스패치 보존.
8. Non-Reifiable Types — https://docs.oracle.com/javase/tutorial/java/generics/nonReifiableVarargsType.html — reifiable 타입과 힙 오염.
9. Restrictions on Generics — https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html — 제네릭 사용 제한.
10. JLS §4: Types, Values, and Variables — https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html — Java SE 25 타입 규칙.
11. `SafeVarargs` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/SafeVarargs.html — 어노테이션 계약·적용 제한.
12. JEP 213: Milling Project Coin — https://openjdk.org/jeps/213 — Java 9 private 어노테이션·Project Coin 개선.
13. JEP 286: Local-Variable Type Inference — https://openjdk.org/jeps/286 — Java 10 `var` 범위.
14. JEP 101: Generalized Target-Type Inference — https://openjdk.org/jeps/101 — Java 8 목표 타입 추론.
15. J2SE 5.0 New Features — https://docs.oracle.com/javase/1.5.0/docs/relnotes/features.html — Java 5 제네릭 도입.

