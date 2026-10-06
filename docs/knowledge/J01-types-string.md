# J01. 기본 타입·참조 타입·박싱·String

> 기본 타입은 값을 직접 다루고, wrapper는 객체 참조와 `null`을 다룬다. `==`는 wrapper의 값 비교가 아니라 참조 비교다. `String`은 불변이며 `+`의 성능 구현은 컴파일러와 JDK에 맡겨져 있으므로 반복 누적에는 `StringBuilder`, 금액 계산에는 `BigDecimal`을 쓴다.

## 1. 왜 알아야 하나

결제 금액을 `double`로 계산하면 0.1과 0.2의 합이 정확히 0.3이 아니어서 정산 오차가 난다. `Integer`를 `==`로 비교하면 캐시 범위에 따라 결과가 달라지고, nullable wrapper를 산술식에 넣으면 자동 언박싱에서 `NullPointerException`이 난다. `int` 합산은 예외 없이 최댓값에서 최솟값으로 돌아가 검증을 무력화할 수 있다.

`==`는 같은 문자열 객체인지 확인하고 내용 비교는 `equals`가 한다. `+`를 루프에서 계속 실행하면 매 반복 결과 문자열이 필요해져 큰 입력에서 할당과 복사가 늘 수 있다.

## 2. 핵심 개념

| 용어 | 의미 | 실무에서 볼 점 |
|---|---|---|
| 기본 타입(primitive) | `boolean`, 숫자 8종(`byte`, `short`, `int`, `long`, `char`, `float`, `double`)의 값 타입 | `null`이 없다. 지역 변수는 초기화 전 읽을 수 없다. |
| 참조 타입(reference) | 클래스·인터페이스·배열 타입. 변수 값은 객체를 가리키는 참조 또는 `null` | 객체 자체와 변수의 참조를 구분한다. |
| wrapper | `Integer`, `Long`, `Boolean` 등 기본 타입 값을 감싸는 불변 참조 타입 | 제네릭·컬렉션·nullable 필드에서 필요하다. |
| 박싱 / 언박싱 | 기본 타입과 대응 wrapper 사이의 자동 또는 명시적 변환 | 언박싱은 `null`에서 실패하고, 박싱은 객체 참조 의미를 만든다. |
| widening / narrowing | 정보 보존이 가능한 확장 변환 / 값 일부가 잘릴 수 있는 축소 변환 | `int`→`long`은 확장, `long`→`int`는 명시적 축소다. 부동소수점 확장은 정밀도 보존을 보장하지 않는다. |
| 문자열 리터럴 / intern | 소스의 문자열 리터럴 및 컴파일 타임 상수 문자열은 정규화된 문자열 객체를 공유한다. `intern()`은 같은 내용의 정규 문자열을 돌려준다. | 문자열 내용 비교에는 `equals`를 사용한다. |
| `StringBuilder` | 변경 가능한 문자 시퀀스를 append해 최종 문자열을 만드는 도구 | 한 스레드에서 반복 조립하는 기본 선택이다. |
| `BigDecimal` | 임의 정밀도 십진수. 정수 unscaled value와 scale로 표현한다. | 십진 정확도가 필요하면 문자열로 생성하고 반올림 규칙을 명시한다. |

### 헷갈리는 비교

| 표현 | 비교 대상 | 예 |
|---|---|---|
| 기본 타입 `a == b` | 두 값의 수치/논리 동일성 | `3 == 3`은 참 |
| 참조 타입 `a == b` | 같은 객체를 가리키는지(identity) | 서로 다른 `new String("x")`는 거짓 |
| 객체 `a.equals(b)` | 클래스가 정의한 내용상 동등성 | `Integer.valueOf(1000).equals(Integer.valueOf(1000))`은 참 |
| `BigDecimal.compareTo` / `equals` | 수치상 값 / 수치와 scale 표현 모두 | `1.0.compareTo(1.00)==0`, `1.0.equals(1.00)==false` |

`==`에 wrapper와 기본 타입을 섞으면 wrapper가 언박싱되어 수치 비교가 된다. wrapper 둘만 비교하면 참조 비교다. 문맥 하나 차이로 의미가 바뀌므로 혼합 비교를 피하고 명시적으로 기본 타입으로 꺼내거나 `equals`를 쓴다.

## 3. 내부 동작·원리

### 3.1 기본 타입에서 wrapper로, 다시 값으로

컴파일러는 문맥에 따라 변환 규칙을 적용한다. 예를 들어 `Integer count = 3;`은 `int` 값을 `Integer` 참조로 박싱한다. `int next = count + 1;`에서는 `count`를 먼저 언박싱하고, 숫자 승격 규칙에 따라 `int` 산술을 수행한다. 연산 결과를 `Integer` 변수에 저장하면 다시 박싱한다. 자동 문법은 변환을 없애지 않고 코드 표면에서 숨긴다.

```text
Integer count = 3;
      │ 박싱
      ▼
Integer 객체 참조 ── 언박싱 ──> int 값 + 1 ── 박싱 ──> 다음 Integer
      │
      └── null일 수 있음 ── 언박싱 시 NullPointerException
```

`byte`, `short`, `char`의 산술 결과는 대개 `int`로 승격된다. 따라서 `Byte b = 1; b = (byte) (b + 1);`처럼 결과를 좁혀야 한다. `Integer`와 `Long`을 더하면 언박싱 뒤 `long` 결과가 되고, `Integer` 변수에 넣을 수 없다. 대입 문맥·메서드 호출 문맥·산술 문맥에서 허용되는 변환 종류가 다르므로, “자동 변환이 되겠지”보다 최종 표현식 타입을 추적해야 한다.

언박싱은 해당 wrapper의 숫자 추출 메서드 호출과 같은 의미다. `Integer x = null; int y = x;`는 변환 과정에서 NPE가 난다. 문제가 된 줄이 `x + 1`, `if (x == 1)`, 메서드 인자로 전달된 값처럼 보이지 않는 경우도 있다. DB nullable 컬럼, 외부 JSON 필드, 부분 입력은 wrapper로 받은 뒤 검증하고, 도메인 규칙에 맞는 기본값을 적용할지 오류로 거절할지 결정한다.

### 3.2 캐시와 `==`의 함정

박싱이 항상 새 객체를 만든다는 뜻은 아니다. JLS는 `int` -128부터 127까지의 상수값을 박싱할 때 같은 값에 동일 참조를 보장한다. OpenJDK 25의 `IntegerCache`는 이 구간과 더 높은 값까지 캐시할 수 있는 구현 설정을 둔다. 추가 캐시 범위는 애플리케이션 계약이 아니다.

따라서 `127` 비교는 참이고 `128` 비교는 거짓일 수 있다. 이는 수치 동등성이 아니라 캐시 참조의 차이다. 고정 구간 보장은 wrapper에 `==`를 써도 된다는 뜻이 아니다.

wrapper는 값 기반(value-based) 객체로 취급하고 잠금 객체로 쓰지 않는다. `new Integer(value)` 생성자는 deprecated이므로 박싱이나 `valueOf`를 사용한다.

### 3.3 오버플로와 부동소수점

`int`와 `long`은 고정 폭 2의 보수 정수라 범위를 넘으면 하위 비트만 남고 자동 예외가 없다. 오버플로가 허용되지 않으면 `Math.addExact`, `Math.multiplyExact`와 도메인 범위 검증을 사용한다.

`float`와 `double`은 2진 부동소수점이라 많은 십진 소수를 정확히 표현하지 못한다. `0.1 + 0.2 == 0.3`의 실패는 표현 체계의 결과다. 근삿값은 허용 오차로 비교하고, 십진 값이 계약인 영역은 `BigDecimal`을 쓴다. Java 17의 strict 의미는 이진 표현 오차를 없애지 않는다.

### 3.4 `BigDecimal`의 값과 표현

`BigDecimal`은 `unscaledValue × 10^(-scale)`로 값을 나타낸다. `1.00`은 100/scale 2, `1.0`은 10/scale 1이어서 수치는 같지만 표현은 다르다. `compareTo`는 수치, `equals`는 수치와 scale을 비교하므로 테스트와 키 사용에서 차이를 고려한다.

`new BigDecimal(0.1)`은 근사 `double` 값을 정확히 옮겨 긴 소수가 된다. 십진 입력은 `new BigDecimal("0.1")` 또는 `BigDecimal.valueOf(0.1)`로 표현한다. 무한 소수 나눗셈은 `ArithmeticException`이 날 수 있으므로 업무상 scale과 `RoundingMode`를 정한다. 통화 scale이 항상 2라고 가정하지 않는다.

### 3.5 String 불변성, pool, 연결

`String` 객체의 문자 값은 생성 뒤 바뀌지 않는다. `s = s + "!"`은 기존 객체를 수정하는 것이 아니라 결과 문자열을 만들고 변수 `s`가 새 참조를 가리키게 한다. 불변성 덕분에 문자열을 안전하게 공유할 수 있고, 해시값을 캐시하거나 키로 쓰기 쉽다. 변수 참조를 다른 문자열로 재할당하는 일과 문자열 객체의 변경은 구분한다.

문자열 리터럴과 컴파일 타임 상수 표현식은 intern된 정규 문자열이다. `new String("java")`는 별도 객체고, `intern()`은 pool의 정규 문자열을 돌려준다. 그러므로 리터럴 간 `==`가 참일 수 있어도 일반 내용 비교에는 `equals`를 쓴다.

`+` 연결은 왼쪽부터 평가하며 `null`은 문자 `"null"`이 된다. 상수끼리는 컴파일 시 합쳐질 수 있다. 런타임 연결은 Java 9부터 JEP 280에 따라 `invokedynamic`과 JDK `StringConcatFactory`에 연결될 수 있다.

```text
소스: name + " Boot " + version
   │ javac가 연결 의도를 invokedynamic 호출과 상수 recipe로 기록
   ▼
클래스 파일: InvokeDynamic + BootstrapMethods
   │ 첫 연결 시 부트스트랩
   ▼
StringConcatFactory가 인자 타입·recipe에 맞는 연결 CallSite 제공
   │
   └─ JVM/JDK가 연결 전략 최적화 (소스 작성자가 특정 임시 객체 수를 가정하지 않음)
```

예전 컴파일러는 `StringBuilder.append` 연쇄로 번역했다. JEP 280은 이후 JDK가 연결 전략을 개선하도록 연결 의도를 남긴다. `+`가 늘 builder 하나를 만든다고도 무조건 느리다고도 가정하지 않는다. 소수 연결은 `+`, 루프 누적은 매번의 결과 문자열 생성을 피하도록 `StringBuilder`를 쓴다.

`StringBuilder`는 변경 가능한 버퍼에 append한 뒤 결과 문자열을 만든다. 지역 조립의 기본 선택이며 공유 동기화가 필요한 경우에만 `StringBuffer`를 검토한다. Java 9 Compact Strings는 내부 저장을 바꾼 구현 변경이므로 항상 `char[]`라고 가정하지 않는다.

## 4. 코드로 확인

다음 예제 세 개를 Corretto JDK 21.0.6에서 각각 `java _scratch/J01/<파일명>.java`로 실행했다. 코드에는 필요한 import를 포함했다.

### 예제 1 — 박싱, 캐시, 언박싱

```java
public class BoxingDemo {
    public static void main(String[] args) {
        int primitive = 42;
        Integer boxed = primitive;
        int unboxed = boxed;
        System.out.println("value=" + unboxed);

        Integer cachedA = 127;
        Integer cachedB = 127;
        Integer outsideA = 128;
        Integer outsideB = 128;
        System.out.println("127 == 127: " + (cachedA == cachedB));
        System.out.println("128 == 128: " + (outsideA == outsideB));
        System.out.println("128 equals: " + outsideA.equals(outsideB));

        Integer absent = null;
        try {
            int invalid = absent;
            System.out.println(invalid);
        } catch (NullPointerException e) {
            System.out.println("null unboxing: NullPointerException");
        }
    }
}
```

실행 결과:

```text
value=42
127 == 127: true
128 == 128: false
128 equals: true
null unboxing: NullPointerException
```

### 예제 2 — 문자열 정체성, 불변성, 연결

```java
public class StringDemo {
    public static void main(String[] args) {
        String literal = "java";
        String anotherLiteral = "java";
        String heapObject = new String("java");
        System.out.println("literal == literal: " + (literal == anotherLiteral));
        System.out.println("new String == literal: " + (heapObject == literal));
        System.out.println("intern == literal: " + (heapObject.intern() == literal));

        String name = "Spring";
        String message = name + " Boot " + 4;
        System.out.println(message);
        System.out.println("original remains: " + name);

        StringBuilder builder = new StringBuilder("order=");
        builder.append(17).append(", state=").append("PAID");
        System.out.println(builder);
    }
}
```

실행 결과:

```text
literal == literal: true
new String == literal: false
intern == literal: true
Spring Boot 4
original remains: Spring
order=17, state=PAID
```

같은 클래스를 JDK 21 `javac`로 컴파일해 `javap -c -v`로 확인하면 동적 연결 지점과 부트스트랩이 보인다. 이는 특정 JDK의 컴파일 결과 관찰이지 모든 컴파일러의 유일한 구현을 요구하는 규칙은 아니다.

```text
InvokeDynamic ... makeConcatWithConstants:(Ljava/lang/String;)Ljava/lang/String;
BootstrapMethods:
  REF_invokeStatic java/lang/invoke/StringConcatFactory.makeConcatWithConstants
```

### 예제 3 — 정수 오버플로, 부동소수점, BigDecimal

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

public class NumericDemo {
    public static void main(String[] args) {
        System.out.println("int overflow: " + (Integer.MAX_VALUE + 1));
        System.out.println("0.1 + 0.2 == 0.3: " + (0.1 + 0.2 == 0.3));
        System.out.println("binary sum: " + (0.1 + 0.2));

        BigDecimal fromDouble = new BigDecimal(0.1);
        BigDecimal fromText = new BigDecimal("0.1");
        System.out.println("double constructor: " + fromDouble);
        System.out.println("text constructor: " + fromText);

        BigDecimal one = new BigDecimal("1.0");
        BigDecimal onePointZeroZero = new BigDecimal("1.00");
        System.out.println("compareTo: " + one.compareTo(onePointZeroZero));
        System.out.println("equals: " + one.equals(onePointZeroZero));
        System.out.println("rounded division: " + new BigDecimal("1")
                .divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP));
    }
}
```

실행 결과:

```text
int overflow: -2147483648
0.1 + 0.2 == 0.3: false
binary sum: 0.30000000000000004
double constructor: 0.1000000000000000055511151231257827021181583404541015625
text constructor: 0.1
compareTo: 0
equals: false
rounded division: 0.33
```

## 5. 버전별 변화 — 왜 바뀌었나

- **Java 5 — 박싱·언박싱**: 제네릭 컬렉션은 객체 참조를 받으므로 기본 타입과 wrapper를 매번 변환하던 번거로움에서 자동 변환이 나왔다. 변환 자체는 사라진 게 아니며 현재 JLS §5.1.7~§5.1.8에 규칙이 남아 있다. 근거: [Java 5 Autoboxing guide](https://docs.oracle.com/javase/1.5.0/docs/guide/language/autoboxing.html), [JLS §5](https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html).
- **Java 9 — 문자열 연결의 `invokedynamic` (JEP 280)**: `javac`의 `StringBuilder.append` 바이트코드 모양을 JIT가 취약하게 인식·최적화하던 한계 때문에 연결 의도를 호출 지점으로 남겨 런타임 라이브러리가 전략을 개선하게 했다. 근거: [JEP 280](https://openjdk.org/jeps/280), [StringConcatFactory API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/StringConcatFactory.html).
- **Java 9 — Compact Strings (JEP 254)**: 모든 문자열을 동일한 2바이트 문자 배열로 취급하던 저장 방식의 공간 부담을 줄이려 내부 표현을 더 효율적으로 바꿨다. 문자열의 불변성·언어 의미가 바뀐 것은 아니다. 근거: [JEP 254](https://openjdk.org/jeps/254).
- **Java 17 — 항상 strict인 부동소수점 의미 (JEP 306)**: 과거 기본 strict와 비strict 실행 의미의 차이가 수치 라이브러리 구현과 플랫폼 간 재현을 복잡하게 만들어 하나의 strict 의미로 정리했다. 십진 소수가 이진수로 정확히 표현되지 않는 문제를 해결한 변경은 아니다. 근거: [JEP 306](https://openjdk.org/jeps/306).

## 6. 실무 가이드

- nullable이 무의미한 값은 `int`, `long`, `boolean`으로 표현한다. `null`과 0을 구분해야 하는 DB/API 경계는 wrapper로 받고 진입점에서 검증한다.
- wrapper 값은 `Objects.equals`로 비교한다. overflow가 허용되지 않는 정수 연산에는 `Math.addExact` 등과 도메인 범위 검증을 둔다.
- 근삿값 허용 계산은 `double`과 명시적 오차 기준을 쓴다. 십진 계약인 가격·정산은 문자열 기반 `BigDecimal`과 고정된 반올림 지점을 쓴다.
- 짧은 문자열 연결은 `+`, 루프 누적은 `StringBuilder`를 쓴다. 내용 비교는 `equals`, 참조 identity 비교에만 `==`를 쓴다.

**기본값 추천:** nullable이 꼭 필요하지 않으면 기본 타입, 십진 통화 값이면 문자열 기반 `BigDecimal`, 반복 문자열 누적이면 `StringBuilder`, 문자열·wrapper 값 비교면 `equals` 계열을 기본으로 한다.

## 7. 함정·안티패턴

1. **증상:** `Integer`의 같은 숫자 비교가 범위에 따라 달라진다 → **원인:** wrapper끼리 `==`는 캐시 참조의 identity를 비교한다 → **대처:** `equals` 또는 `Objects.equals`를 사용한다.
2. **증상:** 입력이 비었을 때 산술 코드에서 NPE가 난다 → **원인:** nullable wrapper가 비교·산술·대입 중 자동 언박싱된다 → **대처:** 외부 경계에서 null을 검증하고 기본값/오류 정책을 명시한다.
3. **증상:** 수량이나 잔액이 갑자기 음수가 되거나 작아진다 → **원인:** `int`·`long` overflow는 기본 산술에서 예외가 아니다 → **대처:** 최대 범위 검증과 `Math.addExact`/`multiplyExact`를 적용한다.
4. **증상:** `0.1 + 0.2` 비교나 합계가 예상한 십진값과 다르다 → **원인:** `double`은 이진 부동소수점 근사값이다 → **대처:** 근사 오차가 허용되면 epsilon 규칙을, 정확한 십진 계약이면 `BigDecimal`을 사용한다.
5. **증상:** `new BigDecimal(0.1)`이 긴 소수로 출력된다 → **원인:** 이미 근사된 `double`의 실제 값을 십진수로 정확히 옮겼다 → **대처:** `new BigDecimal("0.1")` 또는 `BigDecimal.valueOf(0.1)`로 의도를 표시한다.
6. **증상:** `BigDecimal` map key 중 수치가 같은 값이 다른 키처럼 보인다 → **원인:** `equals`·`hashCode`는 scale 차이를 구분하지만 `compareTo`는 수치만 본다 → **대처:** 입력 scale을 정규화하거나 비교 의미에 맞는 키/정렬 규칙을 선택한다.
7. **증상:** 대량 문자열 조립에서 할당이 늘거나 느려진다 → **원인:** 루프의 `result = result + part`는 매 단계 새 결과 문자열을 만든다 → **대처:** 지역 `StringBuilder`에 append 후 마지막에 `toString()`을 호출한다.
8. **증상:** `s += suffix` 후 원본이 바뀌었다고 오해하거나 `==`로 내용 비교한다 → **원인:** 변수 재할당과 불변 객체 변경, 내용과 identity를 혼동한다 → **대처:** 새 문자열 반환을 변수에 저장하고 내용 비교는 `equals`로 쓴다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 기본 타입과 wrapper는 메모리 위치만 다른가?

아니다. 기본 타입 변수는 값을, wrapper 변수는 참조 또는 `null`을 갖는다. JVM의 실제 저장 위치는 최적화될 수 있으므로 “기본형은 스택, 객체는 힙”으로 정의하면 부정확하다. 차이는 null, identity, 제네릭과 자동 변환에서 드러난다.

**꼬리질문:** wrapper의 장점은? — `List<Integer>`처럼 객체 타입을 요구하는 제네릭과 “값 없음” 표현이 필요할 때 유용하다. 단, null 정책을 추가로 관리해야 한다.

### Q2. `Integer a = 127, b = 127; a == b`는 왜 참일 수 있고 왜 이 비교가 잘못인가?

박싱 규칙은 일부 상수값에서 같은 참조를 보장하며 구현은 더 캐시할 수도 있다. `==`는 참조 identity를 비교하므로 같은 수치라도 다를 수 있다. wrapper 값은 `equals`로 비교한다.

**꼬리질문:** `Integer x = 127; int y = 127; x == y`는? — 이 경우 wrapper가 언박싱되어 기본형 수치 비교를 한다. 이런 혼합 비교는 의미를 읽기 어렵게 하므로 피하는 편이 낫다.

### Q3. 오토언박싱이 NPE를 일으키는 표현을 말해보라.

`x + 1`, `if (x == 1)`, `switch (x)`처럼 기본형이 필요한 문맥에서 난다. wrapper는 nullable이지만 산술 연산은 null을 처리하지 않는다. DB/API 경계에서 먼저 검증한다.

**꼬리질문:** `Objects.equals(x, 1)`은 안전한가? — 안전하다. null도 비교할 수 있고 이 경우 숫자 wrapper 값의 동등성을 확인한다.

### Q4. `int` overflow가 왜 장애 원인이 되는가?

범위를 넘으면 하위 비트만 남고 예외가 없다. 양수 금액이 음수로 바뀌어 검증을 통과할 수 있다. 도메인 범위와 checked arithmetic을 함께 쓴다.

**꼬리질문:** 더 큰 타입이면 충분한가? — 사용 범위를 다시 따져야 한다. `long`도 overflow하며, 무제한 정밀도 누적이 필요하면 `BigInteger` 같은 타입을 검토한다.

### Q5. `double`을 돈에 쓰지 않는 이유는 무엇인가?

`double`은 0.1 같은 십진 소수를 정확히 표현하지 못한다. Java 17 strict 의미는 재현성을 다룰 뿐 십진 정밀도를 주지 않는다. `BigDecimal`에 scale·반올림 규칙을 명시한다.

**꼬리질문:** 부동소수점 값은 어떻게 비교하는가? — 도메인 오차 허용치를 정하고 `Math.abs(a - b) < epsilon`처럼 비교한다. epsilon은 숫자 크기와 단위에 맞춰야 한다.

### Q6. `new BigDecimal("1.0").equals(new BigDecimal("1.00"))`은 왜 거짓인가?

수치는 같지만 scale은 각각 1과 2다. `equals`는 scale을 포함하고 `compareTo`는 수치만 비교한다. 따라서 정렬과 hash 기반 컬렉션 결과가 다를 수 있다.

**꼬리질문:** 무조건 `stripTrailingZeros()`를 해도 되는가? — 표시 scale이나 통화 자릿수가 의미인 시스템에서는 안 된다. 저장·비교·표시의 scale 정책을 따로 정한다.

### Q7. String이 불변이라는 것은 변수에 다른 값을 넣을 수 없다는 뜻인가?

아니다. 변수는 다른 객체를 가리킬 수 있지만 기존 `String`의 문자값은 바뀌지 않는다. `s += "x"`는 새 연결 결과를 `s`에 대입한다. 불변성은 공유에는 유리하고 반복 조립에는 비용이 될 수 있다.

**꼬리질문:** 문자열 리터럴 비교에서 `==`가 참이면 내용 비교에 써도 되는가? — 안 된다. 리터럴 pooling은 특정 생성 규칙일 뿐 일반 문자열 identity 보장이 아니다. 내용은 `equals`로 비교한다.

### Q8. JEP 280 이후 `+`와 `StringBuilder`를 어떻게 나누어 쓰는가?

JEP 280은 Java 9부터 동적 연결을 `invokedynamic`으로 표현해 런타임 최적화 여지를 준다. 짧은 연결은 `+`, 반복 누적은 `StringBuilder`를 쓴다. 구현 전략은 언어 계약이 아니다.

**꼬리질문:** `StringBuilder`와 `StringBuffer` 차이는? — `StringBuffer`의 주요 연산은 동기화되고 `StringBuilder`는 동기화 비용 없이 단일 스레드 조립에 쓰인다. 공유 mutable 상태가 필요한 상황 자체를 먼저 점검한다.

`equals`/`hashCode` 규약 설계는 → J02 참조. 컬렉션 내부와 선택은 → J07 참조.

## 9. 참고문헌

- The Java Language Specification, Chapter 4: Types, Values, and Variables — https://docs.oracle.com/javase/specs/jls/se25/html/jls-4.html — 기본 타입·참조 타입·값 모델의 정의.
- The Java Language Specification, Chapter 5: Conversions and Contexts — https://docs.oracle.com/javase/specs/jls/se25/html/jls-5.html — widening/narrowing, boxing/unboxing과 문맥별 변환 규칙.
- The Java Language Specification, Chapter 15: Expressions — https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html — 연산자 우선순위·평가, 문자열 연결과 동등 연산의 언어 규칙.
- Autoboxing — Oracle Java 5 language guide — https://docs.oracle.com/javase/1.5.0/docs/guide/language/autoboxing.html — 자동 변환이 도입된 배경과 컬렉션 예.
- Integer (Java SE 25 API) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Integer.html — wrapper 특성, 값 기반 객체 주의와 기본 API.
- OpenJDK 25 `Integer.java` — https://github.com/openjdk/jdk/blob/jdk-25%2B36/src/java.base/share/classes/java/lang/Integer.java — `IntegerCache`의 필수 기본 범위와 구현 설정 설명.
- String (Java SE 25 API) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/String.html — 불변성, 리터럴 및 연결 구현이 컴파일러에 맡겨진다는 설명.
- JEP 280: Indify String Concatenation — https://openjdk.org/jeps/280 — Java 9 문자열 연결 변환의 동기와 `invokedynamic` 설계.
- StringConcatFactory (Java SE 25 API) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/StringConcatFactory.html — 연결 호출 지점과 recipe 기반 부트스트랩 API.
- BigDecimal (Java SE 25 API) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/math/BigDecimal.html — unscaled value·scale, 반올림, cohort 및 동등성 규칙.
- JEP 254: Compact Strings — https://openjdk.org/jeps/254 — Java 9 String 내부 표현의 공간 효율성 변경.
- JEP 306: Restore Always-Strict Floating-Point Semantics — https://openjdk.org/jeps/306 — Java 17 부동소수점 의미 통합의 배경.
