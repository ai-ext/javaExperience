# J02. OOP와 Object 규약

> 객체지향의 중심은 데이터와 행위를 한 타입의 경계 안에 두고, 구현 대신 지켜야 할 계약으로 협력하는 것이다.
> 오버로딩은 컴파일 시 시그니처 선택, 오버라이딩은 실행 시 수신 객체에 따른 구현 선택이다.
> `equals`가 같다고 판정한 두 객체는 반드시 같은 `hashCode`를 내야 하며, 정렬 순서도 그 동등성과 맞춰야 컬렉션이 일관된다.

## 1. 왜 알아야 하나

운영 중 `HashSet`에 같은 키가 두 번 들어가면 `equals`만 구현하고 `hashCode`를 빠뜨렸는지 확인한다. 반대로 가변 객체를 `HashMap` 키로 넣고 비교 필드를 바꾸면 `get`이 `null`을 반환할 수 있다. 객체 동등성은 해시 컬렉션의 저장 규칙이기도 하다.

하위 클래스에 `process(String)`을 추가하고 상위 타입 참조로 호출해 자식 구현이 실행되길 기대하는 실수도 흔하다. 컴파일 때 상위 타입의 `process(Object)`가 선택되고, 런타임에는 그 시그니처의 오버라이드만 디스패치된다.

상속은 코드 중복만으로 결정하면 곤란하다. 부모 생성자가 재정의 메서드를 호출하면 초기화 전 자식 필드를 읽을 수 있고, 부모 구현 변경은 하위 타입 전체에 영향을 준다. 이 문서는 OOP 설계와 `Object`/정렬 계약을 다룬다. record·sealed는 → J05, 제네릭은 → J03.

## 2. 핵심 개념

| 개념 | 의미 | 실무에서 확인할 것 |
|---|---|---|
| 캡슐화 | 상태와 연산을 함께 두고 외부 경계를 공개 | 생성 시 검증과 상태 전이를 타입이 보장하는가 |
| 추상화 | 사용할 기능과 계약을 드러내고 구현을 숨김 | 공개 API에 구현 세부사항이 새지 않는가 |
| 상속 | 하위 타입이 상위 멤버와 계약을 이어받음 | 하위 객체가 상위 타입을 대체할 수 있는가 |
| 다형성 | 같은 계약 호출이 실제 객체 구현을 실행 | 정적 타입과 런타임 타입을 구분했는가 |
| 객체 계약 | `equals`·`hashCode`·`toString`·`compareTo`의 약속 | 상태 변경 뒤에도 지키는가 |
| 불변 객체 | 생성 뒤 관찰 가능한 상태가 바뀌지 않음 | 가변 입력·반환 참조도 격리했는가 |

### 접근 제어자

| 지정자 | 접근 범위 | 보통의 용도 |
|---|---|---|
| `public` | 어디서나, 모듈 경계까지 고려해 공개 | 의도한 외부 API |
| `protected` | 같은 패키지와 다른 패키지의 하위 클래스 | 하위 타입 확장 지점. 외부 확장 계약이 될 수 있으므로 신중히 공개 |
| 지정자 없음(package-private) | 같은 패키지 | 패키지 내부 협력 구현 |
| `private` | 선언한 최상위 클래스 내부(중첩 클래스 포함 접근 규칙 적용) | 표현 방식과 불변식의 보호 |

접근 제어(access)는 참조 가능성을, 스코프(scope)는 단순 이름을 쓸 코드 구역을 정한다. 필드는 보통 `private`으로 둔다. 무조건 getter/setter를 만들면 저장 형태가 API에 새고 객체가 불변식을 지키기 어려워진다.

### 추상 클래스와 인터페이스

| 구분 | 추상 클래스 | 인터페이스 |
|---|---|---|
| 타입 관계 | 클래스는 직접 상속할 상위 클래스가 하나 | 클래스는 여러 인터페이스 구현 가능 |
| 상태·생성 | 인스턴스 필드, 생성자, 접근 제어가 있는 구현을 가질 수 있음 | 인스턴스 상태·생성자는 없음. 상수와 메서드 계약 중심 |
| 메서드 | 추상·구현 메서드를 함께 두고 하위 타입에 골격을 제공 | 추상 인스턴스 메서드, `default`, `static`, `private` 메서드 제공 |
| 적합한 경우 | 하위 타입끼리 공유할 상태와 불변식, 순차적인 기본 구현이 있을 때 | 서로 다른 클래스가 공유할 역할·능력 계약을 정의할 때 |

`default`는 기존 구현체를 깨지 않고 더하는 기본 구현, `static`은 인터페이스 타입 소속 메서드, `private`은 내부 헬퍼다. 충돌하면 클래스 구현과 더 구체적인 인터페이스 구현이 우선하며, 모호하면 직접 재정의한다.

### 오버로딩·오버라이딩·동적 디스패치

| 구분 | 판정 시점 | 메서드 구분 | 핵심 |
|---|---|---|---|
| 오버로딩(overloading) | 컴파일 시 | 같은 이름, 다른 매개변수 타입/개수 | 인자 표현식의 컴파일 타입, 적용 가능한 변환과 가장 구체적인 후보로 선택 |
| 오버라이딩(overriding) | 실행 시 구현 선택 | 하위 클래스가 상위 인스턴스 메서드의 시그니처를 재정의 | 선택된 시그니처에 대해 수신 객체의 런타임 클래스 구현을 호출 |
| 숨김(hiding) | 컴파일 시 타입 선택 | `static` 메서드나 필드의 동일 이름 선언 | 인스턴스 다형적 재정의가 아니다 |

재정의 메서드는 상위보다 접근 범위를 좁히거나 더 넓은 검사 예외를 던질 수 없다. 호환되는 반환 타입은 가능하고 참조 타입은 공변 반환을 허용한다. `@Override`로 오타가 새 오버로드로 남는 일을 컴파일 때 막는다.

### Object 및 정렬 메서드 계약

| 메서드 | 지켜야 할 규칙 | 놓치기 쉬운 결과 |
|---|---|---|
| `equals(Object)` | 반사·대칭·추이·일관성을 지키고, null과 비교하면 false | 상속 계층에서 대칭성이나 추이성이 깨질 수 있다 |
| `hashCode()` | 실행 중 비교 상태가 안 바뀌면 같은 객체의 값은 일관적. `a.equals(b)`이면 해시도 같아야 함 | 반대 방향은 보장하지 않는다. 다른 객체가 같은 해시를 내도 계약 위반은 아니다 |
| `toString()` | 사람이 객체를 파악할 진단 문자열을 제공 | 직렬화 프로토콜로 취급하지 말고 비밀·개인정보를 넣지 않는다 |
| `compareTo(T)` | 부호가 반대 방향 비교와 반대, 추이성, 동등한 비교값의 일관성 등 전체 순서 규약 | `compareTo()==0`과 `equals()`가 다르면 `TreeSet`/`TreeMap`이 논리적으로 다른 방식으로 원소를 합치거나 유지할 수 있다 |

“같으면 해시도 같다”는 한 방향 규칙이다. 다른 객체끼리의 충돌은 허용되지만 충돌이 많으면 성능이 떨어진다. 자연 순서는 일반적으로 `equals`와 일치시키고, 다르게 설계했다면 문서화한다.

### 중첩 클래스 종류

| 종류 | 선언 위치·관계 | 주 용도 |
|---|---|---|
| 정적 중첩 클래스 | 다른 클래스의 멤버로 `static class` 선언; 바깥 인스턴스가 필요 없음 | 한 타입 구현에 밀접하지만 바깥 상태에는 의존하지 않는 보조 타입 |
| 내부 클래스 | `static`이 아닌 멤버 클래스; 바깥 인스턴스와 연결 | 바깥 객체 상태를 사용해야 하는 작은 협력 객체 |
| 지역 클래스 | 메서드/블록 안에 이름 붙여 선언 | 좁은 범위의 구현. 캡처하는 지역 변수는 final 또는 사실상 final이어야 함 |
| 익명 클래스 | 표현식 안에서 이름 없이 클래스 구현·확장 | 한 번만 쓰는 짧은 구현. 람다와 달리 클래스 문법·상태가 필요할 때 |

## 3. 내부 동작·원리

### 호출은 두 단계로 해석된다

`ref.work(arg)`의 시그니처는 `ref`의 선언 타입과 `arg`의 컴파일 타입으로 먼저 선택된다. 인스턴스 호출의 구현은 런타임 수신 객체에서 찾는다. 오버로딩은 런타임 인자 클래스에 따라 다시 선택되지 않는다.

```text
컴파일 시
선언 타입 + 인자 표현식의 컴파일 타입
       └─ 오버로드 후보/시그니처 선택
                  ↓
실행 시
실제 수신 객체 클래스 + 이미 선택된 인스턴스 시그니처
       └─ 가장 구체적인 재정의 구현으로 디스패치
```

필드와 `static` 메서드는 호출 객체의 런타임 타입으로 재선택되지 않는다. 인터페이스 타입 변수로 호출하더라도 런타임 객체가 실제 구현한 인스턴스 메서드가 선택되기 때문에 호출자는 구현체별 조건문 없이 계약에 의존할 수 있다. 호출 평가는 JLS 15.12.4에 정의되어 있다.

### equals와 hashCode가 함께 움직이는 이유

`Object.equals`의 기본 구현은 같은 참조인지 보는 동일성 비교다. 값 타입은 논리적 정체성으로 볼 상태를 정해 `equals`에 반영하며, API는 이를 동치 관계로 요구한다.

해시 컬렉션은 `hashCode`로 후보를 좁힌 뒤 `equals`로 확인한다. 같은 객체가 다른 해시를 내면 같은 논리 키를 찾을 수 없다. 비교 상태는 두 메서드에서 일치시킨다. `Objects.hash(...)`는 간단한 합성 수단이다.

### 비교 순서는 컬렉션의 동등성 규칙이 된다

`Comparable` 또는 `Comparator`가 두 값을 0으로 비교하면 `TreeSet`·`TreeMap`은 정렬상 같은 원소로 취급한다. 일반 `Set`의 동등성은 `equals`로 설명되므로 두 기준이 다르면 추가·포함 여부가 기대와 다를 수 있다.

### 불변 객체는 상태 계약을 고정한다

`final` 필드만으로 불변성이 보장되지는 않는다. 생성자에서 검증하고 변경 메서드를 두지 않으며, 가변 입력과 내부 반환값은 방어 복사한다. 복사된 중첩 원소도 가변인지 확인한다.

불변 객체는 공유하기 쉽고 해시 키 변경을 막는다. 재구성 비용이 병목인지 측정한 뒤 가변성을 택한다. 생성자에서 `this`를 노출하는 초기화 오류는 별도 위험이다.

### 상속은 계약과 초기화 순서를 함께 물려준다

상위 생성자 실행 중에도 런타임 클래스는 하위 클래스다. 재정의 메서드를 호출하면 자식 필드 초기화 전에 자식 코드가 실행될 수 있다. 생성자는 할당과 검증에 집중하고 오버라이드 훅을 호출하지 않는다.

상속을 쓰려면 하위 클래스가 상위 전제조건을 지키고 결과 보장을 약화하지 않아야 한다. `is-a`는 이름상 분류가 아니라 대체 가능성이다. 구현 재사용만 필요하고 하위 타입 관계가 아니라면 조합(composition)과 위임으로 변경 영향을 줄인다.

## 4. 코드로 확인

### 4.1 오버로딩 선택과 동적 디스패치

`value`의 정적 타입은 `DispatchBase`라 `"x"`는 `describe(Object)`와 맞는다. 실행 시 객체가 `DispatchChild`이므로 같은 시그니처의 재정의 구현이 선택된다. 자식 타입으로 캐스팅하면 컴파일 시 `describe(String)` 오버로드가 선택된다. `static`은 클래스 이름으로 선택한다.

```java
public class DispatchDemo {
    public static void main(String[] args) {
        DispatchBase value = new DispatchChild();
        System.out.println("value.describe(\"x\") = " + value.describe("x"));
        System.out.println("((DispatchChild) value).describe(\"x\") = "
                + ((DispatchChild) value).describe("x"));
        System.out.println("DispatchBase.type() = " + DispatchBase.type());
        System.out.println("DispatchChild.type() = " + DispatchChild.type());
    }
}

class DispatchBase {
    String describe(Object value) { return "Base:Object"; }
    static String type() { return "Base"; }
}

class DispatchChild extends DispatchBase {
    @Override String describe(Object value) { return "Child:Object"; }
    String describe(String value) { return "Child:String"; }
    static String type() { return "Child"; }
}
```

실행: JDK 21 Corretto 21.0.6

```text
value.describe("x") = Child:Object
((DispatchChild) value).describe("x") = Child:String
DispatchBase.type() = Base
DispatchChild.type() = Child
```

### 4.2 값 객체의 네 가지 규약

`AccountId`는 불변 클래스여서 비교 상태가 생성 뒤 변하지 않는다. `equals`와 `hashCode`가 같은 `value`를 기준으로 하고, 자연 순서도 같은 값을 사전식으로 비교한다. 중복 ID를 `TreeSet`에 넣어도 값 객체의 동등성과 순서가 맞기 때문에 한 원소로 정리된다.

```java
import java.util.Objects;
import java.util.TreeSet;

public class AccountIdDemo {
    public static void main(String[] args) {
        AccountId first = new AccountId("acct-17");
        AccountId same = new AccountId("acct-17");
        AccountId next = new AccountId("acct-21");
        System.out.println("equals = " + first.equals(same));
        System.out.println("hash codes equal = " + (first.hashCode() == same.hashCode()));
        System.out.println("compareTo = " + first.compareTo(next));
        TreeSet<AccountId> ids = new TreeSet<>();
        ids.add(next);
        ids.add(first);
        ids.add(same);
        System.out.println("sorted unique ids = " + ids);
    }
}

final class AccountId implements Comparable<AccountId> {
    private final String value;
    AccountId(String value) { this.value = Objects.requireNonNull(value, "value"); }

    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof AccountId that)) return false;
        return value.equals(that.value);
    }
    @Override public int hashCode() { return value.hashCode(); }
    @Override public String toString() { return "AccountId[" + value + "]"; }
    @Override public int compareTo(AccountId other) { return value.compareTo(other.value); }
}
```

실행: JDK 21 Corretto 21.0.6

```text
equals = true
hash codes equal = true
compareTo = -1
sorted unique ids = [AccountId[acct-17], AccountId[acct-21]]
```

### 4.3 조합과 네 가지 중첩 클래스 형태

`ReportService`는 `Formatter` 구현에 일을 위임한다. 정적 중첩 클래스는 바깥 객체 없이 생성해 기본 구현으로 사용하고, 익명 클래스는 테스트 구현으로 끼운다. 내부 `CallCounter`는 바깥 `ReportService` 인스턴스에 묶이고, 지역 클래스는 메서드 인자 `label`을 캡처한다. 필드가 `private`이므로 외부에는 보고 동작만 노출된다.

```java
public class CompositionNestingDemo {
    public static void main(String[] args) {
        ReportService service = new ReportService(new ReportService.PrefixFormatter("[INFO] "));
        System.out.println(service.report("ready"));
        Formatter anonymous = new Formatter() {
            @Override public String format(String message) { return "[TEST] " + message; }
        };
        ReportService testService = new ReportService(anonymous);
        System.out.println(testService.report("ready"));
        System.out.println(service.reportWithLocalLabel("ready", "LOCAL"));
        ReportService.CallCounter counter = service.new CallCounter();
        System.out.println("calls = " + counter.next() + ", " + counter.next());
    }
}

interface Formatter { String format(String message); }

final class ReportService {
    private final Formatter formatter;
    ReportService(Formatter formatter) { this.formatter = formatter; }
    String report(String message) { return formatter.format(message); }

    final class CallCounter {
        private int calls;
        int next() { return ++calls; }
    }

    String reportWithLocalLabel(String message, String label) {
        class LabelFormatter implements Formatter {
            @Override public String format(String text) { return label + ": " + text; }
        }
        return new LabelFormatter().format(message);
    }

    static final class PrefixFormatter implements Formatter {
        private final String prefix;
        PrefixFormatter(String prefix) { this.prefix = prefix; }
        @Override public String format(String message) { return prefix + message; }
    }
}
```

실행: JDK 21 Corretto 21.0.6

```text
[INFO] ready
[TEST] ready
LOCAL: ready
calls = 1, 2
```

## 5. 버전별 변화 — 왜 바뀌었나

- **Java 8 — 인터페이스 `default`와 `static` 메서드**: 기존 인터페이스에 추상 메서드만 추가하면 모든 기존 구현 클래스에 구현 의무가 생기는 한계가 있어, 호환 가능한 기본 인스턴스 동작을 추가할 수 있게 했다. 기존 구현을 깨지 않고 라이브러리 인터페이스를 확장하려는 목적이다. [Default Methods](https://docs.oracle.com/javase/tutorial/java/IandI/defaultmethods.html)
- **Java 9 — 인터페이스 `private` 메서드**: 여러 default 구현에서 중복 코드를 공유하려고 이를 public API로 노출하거나 복사하던 한계를 줄이기 위해, 인터페이스 내부 전용 헬퍼를 허용했다. [JEP 213](https://openjdk.org/jeps/213)은 인터페이스의 private 메서드 허용을 Java 9 변경에 포함한다.
- **`Object`의 값 동등성·해시 규약과 인스턴스 재정의 모델**: 최근 의미 변화는 확인되지 않아 Java SE 25 API를 기준으로 삼는다.

## 6. 실무 가이드

- 값으로 비교해야 할 식별자·금액·범위라면 불변 클래스를 만들고, 모든 생성 경로에서 입력을 검증한 뒤 `equals`·`hashCode`·`toString`을 함께 정의한다. 정렬할 일이 있으면 `compareTo()==0`도 그 `equals` 기준과 맞춘다.
- `equals`를 구현하면 비교에 쓰는 필드로 `hashCode`도 구현한다. 상위 클래스가 있으면 대칭성·추이성을 먼저 검토하고, 상속을 허용해야 할 이유가 없다면 `final` 값 타입을 기본으로 둔다.
- 호출자가 여러 구현을 바꿔 쓸 수 있는 역할이면 인터페이스를 정의하고 생성자에서 받는다. 구현 코드만 재사용하려는 목적이라면 상속보다 조합과 위임을 기본값으로 선택한다.
- 공유할 인스턴스 상태, 생성 규칙, 하위 타입이 지켜야 하는 골격까지 한 덩어리인 경우에만 추상 클래스를 쓴다. 클래스 상속은 하나뿐이므로 라이브러리 확장점으로 공개하기 전 실제 하위 타입 요구를 확인한다.
- 기존 인터페이스의 여러 구현체에 공통으로 적용 가능한 얕은 기본 동작이면 `default` 메서드를 고려한다. 특정 구현에서 의미가 달라질 수 있거나 상태가 필요한 동작은 각 구현체에 남긴다. 작은 헬퍼만 `private`으로 공유한다.
- 메서드 서명이 비슷해도 하위 구현을 호출해야 하는 동작이면 상위 시그니처를 그대로 재정의하고 `@Override`를 붙인다. 인자 타입에 따라 다른 API를 제공하려는 경우에만 오버로딩을 쓴다.
- 구현 세부 타입이 바깥 클래스 안에서만 쓰이고 외부 인스턴스가 필요 없으면 정적 중첩 클래스를 쓴다. 바깥 인스턴스 필드가 반드시 필요한 경우에만 내부 클래스를 둔다.
- **기본값 추천:** 외부 계약은 최소 public 인터페이스로 정의하고, 구현은 `final` 클래스와 생성자 주입된 협력 객체 조합으로 만든다. 상속은 명확한 대체 가능성이 확인될 때만 선택한다.

## 7. 함정·안티패턴

1. `equals`만 재정의 → `HashSet`에는 중복이 남거나 `HashMap` 조회가 실패 → `equals` 비교 필드와 같은 논리 상태로 `hashCode`를 함께 재정의한다.
2. 해시 키를 넣은 뒤 비교 필드를 수정 → `get`/`remove`가 해당 키를 찾지 못함 → 불변 키를 쓰고, 부득이한 변경은 제거 후 새 상태의 키로 다시 넣는다.
3. 상위 클래스는 `instanceof`로 하위 타입을 허용하는데 하위 클래스 `equals`는 자기 타입만 허용 → `base.equals(child)`와 역방향 결과가 달라짐 → 값 계층을 `final`로 닫거나 계층 전체가 합의한 비교 정책을 설계한다.
4. `compareTo`가 0인 서로 다른 객체를 `TreeSet`에 추가 → 둘 중 하나가 정렬상 같은 원소로 취급됨 → 0의 의미를 `equals`와 맞추거나, 정렬 기준이 다른 의도라면 그 정렬의 원소 축약 효과를 문서화한다.
5. 재정의하려던 메서드 매개변수 타입이 달라져 새 오버로드가 됨 → 상위 참조 호출에서 상위 구현만 동작 → 재정의 메서드마다 `@Override`를 사용한다.
6. 생성자에서 재정의 가능 메서드를 호출 → 하위 클래스의 필드 초기화 전에 자식 구현이 실행되어 `null` 상태나 잘못된 계산이 발생 → 생성자에서 오버라이드 훅을 호출하지 말고 완성 후 별도 초기화 경로를 쓴다.
7. `final` 참조만으로 불변이라고 판단 → 내부 리스트나 배열을 외부가 변경해 값·해시가 바뀜 → 입력·출력 참조를 방어 복사하고 내부 원소의 가변성까지 확인한다.
8. `toString()`에 토큰·개인정보·전체 요청 객체를 포함 → 예외 로그나 모니터링에 민감 정보가 저장됨 → 로그 목적의 최소 식별 정보만 남기고 직렬화 포맷으로 사용하지 않는다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 상위 타입 변수로 하위 객체의 오버로드와 오버라이드 메서드를 호출하면 각각 무엇이 결정하는가?

오버로드 후보는 변수의 선언 타입과 인자 표현식 타입으로 컴파일 때 선택된다. 그 뒤 인스턴스 메서드라면 선택된 시그니처의 실제 구현은 수신 객체의 런타임 타입에 맞춰진다. `static`은 런타임 객체에 따라 동적으로 선택되지 않는다.

**꼬리질문:** `@Override`의 이점은? — 재정의가 아니면 컴파일 오류가 나 조용한 오버로드를 막는다.

### Q2. `a.equals(b)`가 true이면 해시 코드도 같아야 한다. 해시 코드가 같은데 `equals`가 false인 경우는 가능한가?

가능하다. 해시는 후보 탐색용 값이라 충돌이 허용된다. 다만 많은 서로 다른 값이 같은 해시를 내면 해시 테이블의 성능이 떨어질 수 있으므로 비교 필드를 균형 있게 사용한다.

**꼬리질문:** 실행 간에도 고정이어야 하나? — 아니다. `Object` 계약은 한 실행 내 일관성을 요구한다.

### Q3. 상속 가능한 값 클래스에서 `equals`를 구현할 때 대칭성이 깨지는 상황은?

부모는 `instanceof Parent`로 자식도 같은 값으로 보는데, 자식은 자기 타입만 같다고 보면 부모→자식과 자식→부모 비교가 다를 수 있다. 자식 필드를 비교에 더하면 추이성 문제까지 생길 수 있다. 확장을 허용할지 먼저 결정한다.

**꼬리질문:** `getClass()` 비교로 해결되는가? — 대칭성은 단순해지지만 상하위 값 비교를 거부한다.

### Q4. `compareTo`가 0이면 `equals`도 true여야 하는가?

API상 자연 순서는 일반적으로 `equals`와 일치하도록 권장되지만 반드시 일치해야 하는 것은 아니다. 불일치는 정렬 집합이 `compareTo()==0`을 중복 판정으로 삼아 일반 `Set` 사용자의 기대를 어긋나게 할 수 있다. 의도적으로 다르면 타입 문서에 적는다.

**꼬리질문:** 두 Set의 기준은 같은가? — `HashSet`은 `equals`, `TreeSet`은 비교 결과 0으로 구분한다.

### Q5. 인터페이스 `default` 메서드의 두 구현이 충돌하면 어떻게 하는가?

클래스의 구현이 인터페이스 default보다 우선한다. 더 구체적인 상위 인터페이스에서 온 구현도 선택 규칙에 따라 우선될 수 있다. 모호한 충돌은 클래스가 명시적으로 재정의해 어느 동작을 쓸지 정한다.

**꼬리질문:** 인터페이스 `static`은 어떻게 호출하는가? — `InterfaceName.method()`처럼 타입 이름으로 호출한다.

### Q6. 모든 필드를 `final`로 선언하면 객체는 불변인가?

아니다. `final`은 참조 재대입을 막을 뿐 참조 대상의 상태 변경을 막지 않는다. 생성자로 받은 가변 객체를 공유하거나 내부 컬렉션을 그대로 반환하면 외부 코드가 상태를 바꿀 수 있다. 복사와 노출 여부를 함께 관리한다.

**꼬리질문:** 읽기 전용 래퍼면 충분한가? — 내부 원본이나 원소가 바뀌면 변경이 보일 수 있다.

### Q7. 상속보다 조합을 기본 선택으로 권하는 이유는?

상속은 상위 구현과 생성 순서, 재정의 가능 지점까지 하위 타입에 노출한다. 조합은 필요한 역할을 필드로 받아 위임하므로 구현 교체가 쉽고 우연히 상위 내부 동작에 결합되는 범위가 작다. 실제 `is-a` 대체 관계가 분명하면 상속도 정당하다.

**꼬리질문:** 중복 코드면 부모 클래스를 만드는가? — 아니다. 위임을 먼저 고려하고 상태·불변식까지 공유할 때 추상 클래스를 쓴다.

### Q8. 생성자 안에서 `normalize()` 같은 오버라이드 가능한 메서드를 호출하면 왜 위험한가?

수신 객체는 생성 중에도 하위 런타임 타입으로 디스패치될 수 있다. 하위 필드 초기화가 끝나기 전에 하위 오버라이드가 실행되면 null 또는 기본값을 읽는다. 생성자는 검증과 할당에 집중한다.

**꼬리질문:** private 메서드도 같은가? — 재정의되지는 않지만 생성자에서 `this`를 외부에 노출할 위험은 남는다.

## 9. 참고문헌

- `Object` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Object.html — `equals`의 동치 관계와 `hashCode` 일관성 계약.
- `Comparable<T>` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Comparable.html — 자연 순서와 `compareTo` 규약.
- `Comparator<T>` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Comparator.html — 정렬 순서와 `equals` 불일치가 정렬 컬렉션에 미치는 영향.
- JLS 25, Chapter 8: Classes — https://docs.oracle.com/javase/specs/jls/se25/html/jls-8.html — 클래스·상속·중첩 타입·메서드 선언의 언어 규칙.
- JLS 25, Chapter 9: Interfaces — https://docs.oracle.com/javase/specs/jls/se25/html/jls-9.html — 인터페이스 선언과 다중 타입 상속.
- JLS 25, 15.12 Method Invocation Expressions — https://docs.oracle.com/javase/specs/jls/se25/html/jls-15.html — 컴파일 시 메서드 선택과 실행 시 호출 평가 흐름.
- JLS 25, 6.6 Access Control — https://docs.oracle.com/javase/specs/jls/se25/html/jls-6.html — 선언 접근성 규칙.
- Default Methods (The Java Tutorials) — https://docs.oracle.com/javase/tutorial/java/IandI/defaultmethods.html — 인터페이스 기본 메서드가 기존 구현의 호환성을 지원하는 배경. JDK 8 기반 튜토리얼.
- JEP 213: Milling Project Coin — https://openjdk.org/jeps/213 — Java 9에서 인터페이스 private 메서드를 허용한 변경.
- Immutable Objects (The Java Tutorials) — https://docs.oracle.com/javase/tutorial/essential/concurrency/immutable.html — 불변 객체의 상태 특성과 동시성상 이점. JDK 8 기반 튜토리얼.
- A Strategy for Defining Immutable Objects (The Java Tutorials) — https://docs.oracle.com/javase/tutorial/essential/concurrency/imstrat.html — final 필드, 상속 차단, 가변 참조 방어 복사 지침. JDK 8 기반 튜토리얼.
