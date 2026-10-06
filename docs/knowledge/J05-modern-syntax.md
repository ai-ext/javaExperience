# J05. 모던 문법 (Java 10~25)

> `var`는 타입을 지우지 않고 선언부의 반복만 줄인다.  
> `record`·`sealed`·패턴 매칭은 닫힌 데이터 모델을 안전하게 표현한다.  
> Java 25 문법은 프로젝트의 소스 버전과 실행 JDK가 지원할 때만 쓴다.

## 1. 왜 알아야 하나

Java 17 기준 코드에 `import module java.base;`를 넣으면 CI가 컴파일 오류를 낸다. JDK 설치 버전과 프로젝트의 문법 기준은 별개다. 반대로 Java 21 코드가 예전 `instanceof` 캐스팅과 수동 분기에 머물면 새 하위 타입 처리 누락을 컴파일 때 놓칠 수 있다.

면접에서도 “`var`를 쓰면 동적 타입인가?”, “record는 불변 객체인가?”, “`case ->`도 다음 case로 흘러가는가?”를 혼동하면 문법을 외운 수준으로 보인다. 각 기능의 핵심은 짧은 표기가 아니라 컴파일러가 보장하는 정적 타입, 생성 멤버, 허용된 상속 범위, 분기 완전성이다. 특히 preview로 시험된 문법과 정식 문법의 버전을 구분해야 프로젝트의 `--release` 설정이나 배포 JDK에서 컴파일 여부를 예측할 수 있다.

## 2. 핵심 개념

| 용어 | 의미 | 기억할 경계 |
|---|---|---|
| `var` | 초기화 식으로 지역 변수의 정적 타입을 추론 | 동적 타입 아님. 필드·매개변수·반환 타입에는 불가 |
| switch expression | 값을 산출하는 `switch` 식 | 모든 입력을 처리해야 한다. 화살표 규칙은 fall-through하지 않고 블록 규칙은 `yield`로 값 반환 |
| text block | `"""`로 감싼 여러 줄 `String` 리터럴 | raw string이나 문자열 보간이 아니다. 들여쓰기와 escape가 처리됨 |
| record | 컴포넌트 기반 데이터 클래스 | 얕은 불변성. 참조 대상은 자동 불변이 아님 |
| sealed 타입 | `permits`로 직접 하위 타입을 제한 | 하위 타입은 `final`, `sealed`, `non-sealed` 중 하나 |
| 패턴 매칭 | 타입 검사와 조건부 바인딩, 또는 record 분해를 한 패턴으로 표현 | 패턴 변수가 유효한 범위(scope)를 컴파일러가 분석 |
| unnamed `_` | 사용하지 않는 변수·패턴을 표시 | Java 22부터 허용 문맥에서만 가능. 일반 식별자로 쓸 수 없음 |
| module import | 모듈이 export하는 패키지의 공개 최상위 타입을 한 번에 on-demand import | 모듈 선언이나 모듈 의존성 자체를 대신하지 않음 |
| compact source / instance `main` | 클래스 껍데기 없이 작은 프로그램을 쓰고, 인스턴스 `main`으로 진입 | Java 25의 정식 문법. 일반 클래스 기반 프로그램은 그대로 유효 |
| flexible constructor body | 명시적 `super(...)`/`this(...)` 호출 전에 제한된 문장을 실행 | 초기화 문맥에서 생성 중인 인스턴스에 접근할 수 없음 |
| preview / final | preview는 다음 릴리스에서 변경·제거될 수 있는 미완성 시험 기능, final은 정식 언어 기능 | preview 코드는 해당 JDK의 `--enable-preview`와 일치하는 컴파일·실행 환경이 필요 |

헷갈리는 쌍을 요약하면 다음과 같다.

| 비교 | 구분 |
|---|---|
| `var` vs 동적 타입 | `var`는 선언 때 한 번 추론된 컴파일 시 타입을 유지한다. 다른 타입을 대입할 수 없다. |
| `switch` 문 vs 식 | 문은 제어 흐름, 식은 값 산출이다. 식은 빠진 경우가 없도록 완전성을 요구한다. |
| `case :` vs `case ->` | 콜론 규칙은 기존 fall-through 의미를 유지한다. 화살표 규칙은 다음 레이블로 자동 진입하지 않는다. |
| record vs 일반 클래스 | record는 상태를 헤더에 드러내고 구조적 멤버를 자동 제공한다. 상속 가능한 일반 클래스나 자동 깊은 복사 객체가 아니다. |
| sealed vs `final` | `final`은 하위 클래스를 전부 금지한다. `sealed`는 허용 목록 안에서만 확장을 허용한다. |
| record pattern vs 타입 패턴 | `Type t`는 타입 확인과 변수 바인딩, `Point(int x, int y)`는 record 컴포넌트까지 분해한다. |

## 3. 내부 동작·원리

### 3.1 컴파일러가 표면 문법을 정적 규칙으로 바꾼다

```text
소스의 표현식·패턴
        │
        ├─ var 초기화식 ──> 정적 타입 추론 ──> 일반 지역 변수 선언
        ├─ record 선언 ──> 컴포넌트 필드/접근자/생성자/equals·hashCode·toString
        ├─ sealed 선언 ──> 허용 하위 타입 검사 ──> 닫힌 계층 정보
        └─ switch 패턴 ──> 타입·패턴·가드·완전성 검사 ──> 분기 코드
```

`var`는 런타임 타입 검사가 아니라 컴파일 시 초기화 식에서 정적 타입을 추론한다. `var names = new ArrayList<String>();`는 `ArrayList<String>`이며 추상 계약을 드러내려면 `List<String> names = ...`라고 쓴다. 초기화가 없거나 `null`·람다·메서드 참조처럼 목표 타입이 없는 식은 추론할 수 없다. (JEP 286)

### 3.2 switch 식은 값의 완전성과 규칙의 범위를 검사한다

Java 14 switch expression은 `switch`가 값을 내게 하고 `yield`를 도입했다. `case X -> expression`은 fall-through하지 않으며 여러 문장은 `{ ... yield value; }`로 값을 반환한다. `break`는 값을 반환하지 않는다. 콜론 레이블에는 기존 fall-through가 남는다. (JEP 361)

Java 21 패턴 switch는 case에 타입·record 패턴을 허용하고 가능한 타입을 분석해 분기 완전성을 검사한다. sealed 계층에서 모든 하위 타입을 적고 `default`를 생략하면 새 하위 타입 추가 때 누락을 찾는다. 넓은 패턴 뒤에 이미 포함된 패턴을 두면 도달 불가 오류가 난다. 조건은 `case Card c when c.amount() > 0 -> ...`처럼 가드로 표현한다. (JEP 441)

switch는 기본적으로 null에서 예외를 던지며, 패턴 switch도 `case null`을 명시해야 null을 처리한다. record pattern은 컴포넌트를 중첩 분해하고, 구성요소가 맞지 않으면 해당 규칙과 일치하지 않는다. `var` 패턴은 컴포넌트 타입을 추론한다. (JEP 440, 441)

### 3.3 데이터 선언은 계층과 상태의 의도를 드러낸다

`record UserId(String value)`의 헤더는 상태 계약이다. 컴파일러가 final 컴포넌트 필드, `value()` 접근자, canonical constructor, 값 기반 `equals`·`hashCode`·`toString`을 제공한다. compact constructor에서 매개변수를 검증·정규화하고 끝에서 필드에 반영한다. record는 명목 타입이며 얕은 불변성만 제공하므로 `List`·배열 내용은 별도 방어 없이는 바뀐다. (JEP 395)

sealed 타입은 직접 하위 타입을 제한한다. 각 하위 타입은 `final`, `sealed`, `non-sealed` 중 하나여야 한다. 친구 접근 제어를 만들지는 않으며 named module/unnamed module의 패키지 규칙도 따른다. 닫힌 집합은 pattern switch 완전성 분석에 쓰인다. (JEP 409)

`instanceof` 패턴 변수는 검사 성공 흐름에서만 유효하다. `if (x instanceof String s && !s.isBlank())`에서는 `s`를 우변에서 쓸 수 있지만, 성공이 보장되지 않는 `||` 우변에서는 쓸 수 없다. 컴파일러가 조건 흐름에 따라 scope를 검사한다. (JEP 394)

### 3.4 문자열·시작 코드·생성자는 독립 규칙을 따른다

text block은 컴파일 시 들여쓰기를 정규화한 `String`이다. 여는 `"""` 뒤에는 줄바꿈이 필요하고, 닫는 구분자의 위치가 제거할 들여쓰기를 정한다. `\s`는 공백, 줄 끝의 `\`는 줄 연결에 쓴다. 문자열 보간·SQL 바인딩 기능은 없으므로 사용자 값을 붙이는 것은 여전히 위험하다. (JEP 378)

Java 25 `import module M;`은 해당 모듈이 export하는 공개 최상위 타입을 on-demand import한다. `module-info.java`의 선언이나 `requires`를 대신하지 않으며, 타입 이름이 충돌하면 기존 import 모호성 규칙이 적용된다. (JEP 511, Oracle Java 25 언어 가이드)

compact source file은 최상위 클래스 껍데기 없이 멤버와 `main`을 적는다. Java 25는 암묵 선언 클래스와 `void main()` 인스턴스 진입점을 제공해 작은 프로그램의 시작 문법을 줄인다. 별도 방언이 아니며 서비스의 패키지·공개 타입 구조를 대체하지 않는다. (JEP 512, Oracle Java 25 언어 가이드)

Java 25 flexible constructor body는 명시적 `super(...)`/`this(...)` 전 prologue를 허용한다. 이 early construction context에서는 생성 중 객체를 참조할 수 없지만 인자 검증·계산은 가능하다. 제한은 상위 생성자 호출 중 미초기화 객체가 노출되는 일을 막는다. (JEP 513, Oracle Java 25 언어 가이드)

## 4. 코드로 확인

### 예제 1 — `var`, text block, switch expression (Java 21 실행)

```java
import java.math.BigDecimal;

public class InvoiceSwitchDemo {
    enum Tier { BASIC, PRO, ENTERPRISE }

    static BigDecimal monthlyPrice(Tier tier) {
        return switch (tier) {
            case BASIC -> new BigDecimal("10.00");
            case PRO -> {
                var base = new BigDecimal("20.00");
                yield base.multiply(new BigDecimal("1.5"));
            }
            case ENTERPRISE -> new BigDecimal("100.00");
        };
    }

    public static void main(String[] args) {
        var tier = Tier.PRO;
        var sql = """
                SELECT id, total
                FROM invoice
                WHERE tier = ?
                """.strip();

        System.out.println(tier + " " + monthlyPrice(tier).toPlainString());
        System.out.println(sql.replace("\n", " | "));
    }
}
```

실제 출력 (JDK 21.0.6):

```text
PRO 30.000
SELECT id, total | FROM invoice | WHERE tier = ?
```

`tier`, `sql`의 타입은 `Tier`, `String`이다. `yield`는 블록 규칙의 값을 돌려주며 `.strip()`은 별도 런타임 연산이다.

### 예제 2 — record·sealed·타입/record 패턴 (Java 21 실행)

```java
public class PatternMatchDemo {
    static String describe(Payment payment) {
        if (payment instanceof CardPayment card && card.installments() > 1) {
            return "installments=" + card.installments();
        }
        return switch (payment) {
            case CardPayment(var last4, var installments) ->
                "card ****" + last4 + " / " + installments + "m";
            case CashPayment(var amount) -> "cash " + amount;
            case null -> "missing";
        };
    }

    public static void main(String[] args) {
        System.out.println(describe(new CardPayment("4242", 3)));
        System.out.println(describe(new CashPayment(1200)));
        System.out.println(describe(null));
    }
}

sealed interface Payment permits CardPayment, CashPayment { }
record CardPayment(String last4, int installments) implements Payment { }
record CashPayment(int amount) implements Payment { }
```

실제 출력 (JDK 21.0.6):

```text
installments=3
cash 1200
missing
```

두 record로 닫힌 `Payment` 계층은 분기 완전성을 검사할 수 있다. 조건 우변에서 `instanceof` 바인딩을 쓰고 switch에서 record pattern으로 분해한다.

### 예제 3 — Java 25 시작 코드와 생성자 검증

```java
// Java 25+ (JEP 511, JEP 512, JEP 513; _는 JEP 456, Java 22+)
import module java.base;

class PositiveBigInteger extends BigInteger {
    PositiveBigInteger(long value) {
        if (value <= 0) {
            throw new IllegalArgumentException("non-positive value");
        }
        super(Long.toString(value));
    }
}

void main() {
    var number = new PositiveBigInteger(42L);
    System.out.println(number);
    try {
        new PositiveBigInteger(-1L);
    } catch (IllegalArgumentException _) {
        System.out.println("rejected");
    }
}
```

(JDK 21 환경이라 미실행) Java 25 정식 문법의 compact source, module import, 인스턴스 `main`을 쓴다. catch의 `_`는 미사용 예외 매개변수이며, `super(...)` 전 검증은 인스턴스를 참조하지 않는다.

## 5. 버전별 변화 — 왜 바뀌었나

| 정식화 버전 | 기능과 JEP | 이전 방식의 한계 → 바뀐 이유 |
|---|---|---|
| Java 10 | 지역 변수 `var` — JEP 286 | 반복되는 긴 지역 타입 표기가 초기화식에서 명백한 경우에도 코드를 부풀렸다. 정적 타입 안전성은 유지하고 지역 선언의 타입 표기만 추론하게 했다. |
| Java 14 | switch expression — JEP 361 | 값 선택이 필요한 코드에서 임시 변수·`break`·할당 누락을 따로 관리했다. switch가 식으로 값을 반환하고 완전성을 검사하도록 바뀌었다. Java 12·13 preview 동안 `break` 대신 `yield`를 채택했다. |
| Java 15 | text block — JEP 378 | HTML·SQL 등 여러 줄 문자열을 따옴표·개행 escape로 조립해야 했다. 들여쓰기를 정규화하는 여러 줄 리터럴을 추가했다. Java 13·14 preview를 거쳤다. |
| Java 16 | `instanceof` 패턴 — JEP 394 | 타입 검사 직후 같은 값을 다시 캐스팅하고 변수 범위를 사람이 맞췄다. 검사와 바인딩을 한 패턴으로 묶었다. Java 14·15 preview 후 정식화됐다. |
| Java 16 | record — JEP 395 | 데이터 운반 클래스의 필드·생성자·접근자·값 기반 메서드가 상용구로 반복됐다. 컴포넌트가 드러나는 투명한 명목 데이터 타입을 추가했다. Java 14·15 preview 후 정식화됐다. |
| Java 17 | sealed class/interface — JEP 409 | 상속 가능 타입을 `final` 또는 무제한 확장으로만 표현해 제한된 계층을 선언하기 어려웠다. 허용 구현체를 명시해 API 확장 범위와 분기 완전성의 토대를 제공한다. Java 15·16 preview 후 정식화됐다. |
| Java 21 | record patterns — JEP 440 | record 타입 확인 뒤 각 접근자를 직접 호출하고 중첩 구조를 단계별로 풀어야 했다. 중첩 가능한 패턴으로 값 구조 탐색을 선언적으로 표현한다. Java 19·20 preview를 거쳤다. |
| Java 21 | switch 패턴 — JEP 441 | 여러 타입에 대한 `if/else`는 닫힌 계층에서도 누락 분기를 찾기 어려웠다. 패턴과 switch를 결합하고 완전성·도달 불가 분기를 검사한다. Java 17~20 preview를 거쳤다. |
| Java 22 | unnamed variables/patterns `_` — JEP 456 | 사용하지 않을 매개변수·패턴 바인딩도 이름을 붙여 경고·오해를 만들었다. 의도적으로 사용하지 않음을 표시한다. Java 21 preview 뒤 정식화됐다. |
| Java 25 | module import — JEP 511 | 모듈에서 함께 쓰는 공개 API도 패키지별 와일드카드 import를 반복했다. 읽는 모듈이 export하는 API를 한 선언으로 import한다. Java 23·24 preview 후 정식화됐다. |
| Java 25 | compact source / instance `main` — JEP 512 | 첫 프로그램부터 클래스·정적 메서드·배열 매개변수를 모두 설명해야 했다. 같은 Java 언어 안에서 작은 파일의 문법 부담을 줄인다. Java 21~24 preview 후 정식화됐다. |
| Java 25 | flexible constructor bodies — JEP 513 | 상위 생성자 인수를 계산하거나 검증하려 해도 명시적 `super(...)`가 첫 문장이어야 했다. 객체를 참조할 수 없는 초기화 문맥에서 선행 계산을 허용한다. Java 22~24 preview 후 정식화됐다. |

정식화 릴리스부터 preview 플래그 없이 쓸 수 있다. preview 예제는 최종 문법과 다를 수 있으므로 정식 JEP를 기준으로 한다. LTS 로드맵·마이그레이션 → J17, Stream Gatherers → J09 참조.

## 6. 실무 가이드

- **지역 초기화식만 보고 타입이 분명하면 `var`를 써라.** `var connection = dataSource.getConnection()`처럼 호출부가 구체 타입을 알아보기 어렵거나 추상 인터페이스를 계약으로 보여줘야 하면 명시 타입을 써라. 필드와 공개 API 경계는 추론 대상이 아니다.
- **문자열 자체가 여러 줄 형식을 표현하면 text block을 써라.** JSON 템플릿·SQL·HTML처럼 줄바꿈과 정렬이 검토 대상일 때 적합하다. 값 삽입은 문자열 연결이 아니라 PreparedStatement 등 해당 API의 파라미터 바인딩을 사용한다.
- **선택 결과가 값이면 switch expression을 기본으로 써라.** enum·분류 코드 변환에 임시 변수와 누락된 `default`를 남기지 않는다. 여러 문장 분기는 `yield`를 사용하고, 의도치 않은 fall-through는 화살표 레이블로 막는다.
- **동일한 형태의 값 객체면 record를 우선 검토하라.** 식별자·좌표·응답 DTO처럼 상태가 데이터 계약인 경우 적합하다. 가변 생명주기, 프록시 상속, 상속 가능한 동작이 모델의 핵심이면 일반 클래스를 쓴다. 컬렉션 컴포넌트는 생성 시 복사해도 그 내부 가변성 정책을 따로 정해야 한다.
- **타입 집합을 설계자가 소유하면 sealed를 써라.** 결제 방식처럼 내부 분류가 닫혔다면 `permits`와 switch를 함께 두어 새 타입 추가 때 처리 누락을 컴파일에서 찾는다. 플러그인처럼 외부 구현이 확장점이면 개방 인터페이스가 맞다.
- **값을 검사하고 즉시 쓰면 타입 패턴·record pattern을 써라.** `instanceof` 다음 캐스팅을 제거하되, 패턴 변수가 실제로 유효한 흐름에서만 쓰이도록 조건을 구성한다. record 구조를 분해할 때는 API의 컴포넌트 이름 변경 영향도 고려한다.
- **`_`는 “사용하지 않음”을 코드에서 확인시키고 싶을 때만 써라.** 무의미한 변수명을 줄이는 용도지 일반 변수 이름을 바꾸는 기능이 아니다. Java 21 이하 소스 대상에서는 허용되지 않는다.
- **Java 25 문법은 `--release`와 배포 런타임을 함께 확인한 뒤 선택하라.** 컴파일러만 새 버전이어도 `--release 21`이면 Java 25 언어 기능은 사용할 수 없다. 사용자에게 배포할 애플리케이션은 운영 JDK가 최소 언어·API 버전을 제공하는지 먼저 확인한다.

**기본값 추천:** 서비스 코드에서는 `var`를 명백한 지역 변수에 한정하고, 값 모델에는 record, 닫힌 도메인에는 sealed + 완전한 switch를 우선한다. Java 25 시작 문법은 컴파일 기준 25를 정하기 전 프로덕션 소스에 섞지 않는다.

## 7. 함정·안티패턴

1. **`var`가 동적 타입이라고 생각함** → 다른 타입을 나중에 넣을 수 있다고 가정해 컴파일 실패 → `var`는 초기화 때 결정되는 정적 타입임을 확인하고, 의도가 추상 타입이면 왼쪽에 인터페이스 타입을 선언한다.
2. **복잡한 초기화식에 `var`를 붙임** → 선언만 보고 타입·역할을 파악하기 어렵고 IDE 툴팁에 의존 → 변수명과 명시 타입으로 도메인 의미를 드러내거나 계산을 별도 메서드로 분리한다.
3. **record를 깊은 불변 객체로 간주함** → record에 담은 `List`나 배열이 외부에서 바뀌어 해시 키·캐시 결과가 흔들림 → 생성자에서 방어 복사하고 필요하면 불변 컬렉션·복사 반환 정책을 둔다.
4. **기존 콜론 switch를 화살표로 바꾸며 분기 동작을 대충 옮김** → 의도된 fall-through는 사라지거나, 블록 규칙에서 값을 `yield`하지 않아 컴파일 오류 → 변환 전 각 레이블의 실행 범위와 공통 처리를 확인한다.
5. **sealed switch에 `default`를 습관적으로 넣음** → 새 허용 하위 타입이 추가돼도 기존 분기에서 처리 누락을 컴파일러가 경고하지 않음 → 닫힌 내부 계층은 각 타입을 명시하고, 실제 미지 값 정책이 있을 때만 기본 분기를 둔다.
6. **`case null`을 빼고 null 입력도 패턴 매칭이 처리한다고 기대함** → switch 평가 중 `NullPointerException` → 도메인상 null이 가능한지 먼저 결정하고, 가능하면 `case null` 또는 호출 전 검증을 명시한다.
7. **text block이 SQL을 안전하게 만든다고 착각함** → 정렬된 문자열에 사용자 입력을 연결해 SQL injection 가능성이 남음 → text block은 표기법으로만 쓰고 DB 파라미터 바인딩을 적용한다.
8. **Java 25 예제를 JDK만 설치하면 빌드된다고 생각함** → `--release 21` 또는 JDK 21 CI에서 `import module`, compact source가 거부됨 → 컴파일 도구체인과 target release, 운영 JRE를 같은 배포 계획으로 관리한다.

## 8. 자가점검 Q&A (면접 대비)

**Q1. `var`는 컴파일 후에도 변수 타입을 없애는가?**  
아니다. 초기화식으로 컴파일 시 타입을 추론할 뿐, 바이트코드에는 확정된 정적 타입이 반영된다.  
필드·매개변수·반환 타입에는 쓸 수 없으며 초기화식도 필요하다.  
**꼬리질문:** `var x = new ArrayList<String>()`은 `List<String>`인가? → 아니다. 선언 타입은 `ArrayList<String>`이므로 추상 계약을 표현하려면 `List<String> x = ...`라고 쓴다.

**Q2. switch expression에서 `break`와 `yield`는 어떻게 다른가?**  
화살표 규칙은 값 식을 바로 반환하고, 여러 문장 블록에서는 `yield 값`으로 switch 식에 값을 전달한다.  
`break`는 기존 제어 흐름을 빠져나오는 의미이며 값을 반환하지 않는다.  
**꼬리질문:** `case A: ...`를 switch 식에서 쓸 수 있는가? → 가능하지만 기존 fall-through 의미가 적용되며, 값을 내는 모든 경로가 완전해야 한다.

**Q3. sealed 타입에서 switch에 `default`가 없어도 되는 이유는?**  
허용 하위 타입 목록이 닫혀 있어 컴파일러가 다룰 수 있는 타입 집합을 분석하기 때문이다.  
모든 분기를 적으면 향후 하위 타입 추가 후 재컴파일 시 누락을 발견한다.  
**꼬리질문:** sealed 타입이 모든 구현을 한 파일에 둬야 하는가? → 아니며 named module/패키지 규칙 안에서 `permits`에 선언하고 각 하위 타입의 최종성 규칙을 지켜야 한다.

**Q4. record는 불변 객체라고 단정할 수 있는가?**  
컴포넌트 필드는 final이지만 얕은 불변성이다. 가변 객체를 참조하면 그 내부는 바뀔 수 있다.  
생성자 방어 복사와 반환 정책으로 깊은 불변성 요구를 별도 충족해야 한다.  
**꼬리질문:** record는 기존 클래스를 상속할 수 있는가? → 아니다. record는 `java.lang.Record`를 직접 상속하는 final 클래스이며 인터페이스는 구현할 수 있다.

**Q5. record pattern은 타입 패턴과 무엇이 다른가?**  
`CardPayment c`는 타입 검사와 변수 바인딩을 한다. `CardPayment(var id, var amount)`는 record 타입 확인과 컴포넌트 분해까지 한다.  
중첩 패턴으로 데이터 구조를 직접 표현할 수 있다.  
**꼬리질문:** null record 값도 분해되는가? → null은 패턴과 일치하지 않으므로 null 정책을 별도 분기로 처리해야 한다.

**Q6. `case null`이 없으면 패턴 switch가 null-safe한가?**  
아니다. switch의 일반적인 null 동작은 예외다. 패턴 switch는 `case null`을 넣어 명시적으로 정책을 정할 수 있다.  
입력 검증이 앞서서 null이 불가능하다는 계약이라면 그 경계를 코드로 보장해야 한다.  
**꼬리질문:** `default`가 null까지 잡는가? → 아니다. null을 처리하려면 `case null`을 명시해야 한다.

**Q7. Java 25를 설치하면 Java 25 문법으로 컴파일되는가?**  
아니다. 빌드의 `--release` 또는 소스 버전 설정이 언어 기능을 제한한다. 런타임 배포 버전도 별개로 맞춰야 한다.  
특히 Java 25 기능을 사용하면 Java 21 기준으로 설정한 CI·서비스에서 컴파일하거나 실행할 수 없다.  
**꼬리질문:** preview 기능을 써도 되는가? → 시험 기능임을 감수하고 동일 JDK 버전으로 `--enable-preview`를 컴파일·실행하는 경우에만 제한적으로 선택한다.

## 9. 참고문헌

- JEP 286: Local-Variable Type Inference — https://openjdk.org/jeps/286 — 지역 변수 `var`의 범위와 도입 목적.
- JEP 361: Switch Expressions — https://openjdk.org/jeps/361 — switch 식, 화살표 레이블, `yield` 및 preview 이력.
- JEP 378: Text Blocks — https://openjdk.org/jeps/378 — text block 문법과 정식화 이력.
- JEP 394: Pattern Matching for instanceof — https://openjdk.org/jeps/394 — 타입 패턴의 변수 범위와 최종화.
- JEP 395: Records — https://openjdk.org/jeps/395 — record 의미, 멤버, preview에서 정식화까지.
- JEP 409: Sealed Classes — https://openjdk.org/jeps/409 — 상속 허용 목록과 계층 규칙.
- JEP 440: Record Patterns — https://openjdk.org/jeps/440 — record 분해 패턴과 정식화 이력.
- JEP 441: Pattern Matching for switch — https://openjdk.org/jeps/441 — 패턴 case, null·완전성·도달 불가 분기.
- JEP 456: Unnamed Variables & Patterns — https://openjdk.org/jeps/456 — `_`의 사용 문맥과 Java 22 정식화.
- JEP 511: Module Import Declarations — https://openjdk.org/jeps/511 — 모듈 import의 범위와 preview 이력.
- JEP 512: Compact Source Files and Instance Main Methods — https://openjdk.org/jeps/512 — compact source와 인스턴스 `main`의 설계·최종화.
- JEP 513: Flexible Constructor Bodies — https://openjdk.org/jeps/513 — 생성자 선행 구간과 early construction context.
- Compact Source Files and Instance `main` Methods — https://docs.oracle.com/en/java/javase/25/language/compact-source-files-instance-main-methods.html — Java 25 문법의 사용 목적과 언어 가이드.
- Module Import Declarations — https://docs.oracle.com/en/java/javase/25/language/module-import-declarations.html — `import module`의 형태와 읽는 모듈의 export 범위.
- Flexible Constructor Bodies — https://docs.oracle.com/en/java/javase/25/language/flexible-constructor-bodies.html — `super(...)` 앞 검증과 early construction context의 제한.
