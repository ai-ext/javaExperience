# W19. Lombok을 쓸까 말까 — 편리함과 함정

> Lombok은 컴파일 시 반복 코드를 만들어 주므로 런타임 성능 기능이나 프레임워크 마법은 아니다.
> DTO·값 객체에는 record를 먼저 검토하고, Lombok은 팀이 코드를 확인할 수 있는 범위에 좁혀 쓴다.
> 기본 추천은 `@Data`를 기본값으로 두지 않고, 필요한 `@Getter`, 생성자, `@Builder`만 선택적으로 쓰는 것이다.

## 1. 질문

신입 개발자가 기존 Spring 서비스에 합류해 `@Data` 한 줄만 있는 `Order`를 연다. IDE에는 필드만 보이는데 API JSON에 모든 연관 객체가 따라 나오고, 로그를 찍자 `Order ↔ Customer`가 서로 `toString()`을 호출해 스택이 터진다. 코드 리뷰에서 보이지 않는 setter와 `equals()`가 실제 문제의 절반이다.

새 기능에서 요청 객체를 만들 때도 선택이 생긴다. 필드, 생성자, getter, `equals()`까지 직접 쓸지, Lombok을 붙일지, Java record를 쓸지, IDE가 생성한 코드를 남길지 팀 기준이 없다. 라이브러리를 하나 더 넣을 만큼 이득이 있는가?

마지막으로 Java 버전을 올리면서 빌드는 `NoSuchFieldError` 또는 컴파일러 내부 타입 오류로 멈춘다. 애플리케이션은 Java 25로 바뀌었지만 annotation processor와 IDE의 Lombok 플러그인은 예전 버전이다. Lombok은 실행 중보다 **컴파일 도구 체인**과 팀의 코드 읽기 방식에 선택 비용이 생긴다.

## 2. 짧은 답

- 데이터 운반 전용 타입이면 먼저 `record`를 검토한다. 언어 문법이라 별도 annotation processor와 플러그인이 필요 없다.
- 일반 클래스를 유지해야 한다면 IDE 생성 또는 Lombok 모두 선택지다. IDE 생성은 소스에 결과가 보이고, Lombok은 반복 코드를 감춘다.
- Lombok을 쓰면 프로젝트가 잠근 버전과 IDE 지원을 맞춘다. Spring Boot 4.1.1 기준 관리 버전은 1.18.46이다.
- 기본 허용 목록은 `@Getter`, 접근 범위를 정한 생성자, DTO의 명시적 `@Builder` 정도로 시작한다.
- `@Data`는 엔티티와 도메인 객체의 기본 어노테이션으로 쓰지 않는다. setter·동등성·문자열 변환을 모두 한 번에 정하기 때문이다.
- JPA 엔티티는 ID와 생명주기, 지연 로딩, 프록시를 고려해 동등성 정책을 별도로 정한다.
- **기본값 추천:** record가 맞는 DTO는 record, 그렇지 않은 클래스는 필요한 Lombok 기능만 허용하고 `@Data`는 금지한다.

## 3. 왜 그런가 — 원리

Lombok을 `@Getter` 한 줄짜리 런타임 라이브러리라고 생각하면 잘못된 의존성을 만든다. 주요 애노테이션은 Java 소스를 컴파일할 때 처리된다. Lombok은 일반 annotation processor로 발견되지만 단순히 새 `.java` 파일을 생성하는 방식에 그치지 않고, `javac` 또는 Eclipse 컴파일러가 쓰는 구문 트리(AST)에 멤버를 추가하거나 수정한다.

이후 컴파일러가 그 메서드들을 포함한 클래스 파일을 만든다. 실행 시점의 호출은 보통 `getName()`이라는 평범한 바이트코드 호출이다.

```mermaid
flowchart LR
    A[Java 소스와 Lombok 애노테이션] --> B[컴파일러가 processor 발견]
    B --> C[Lombok이 컴파일러 트리에 멤버 추가]
    C --> D[컴파일러가 타입 검사와 바이트코드 생성]
    D --> E[실행 시 생성된 메서드 호출]
    F[IDE 플러그인 또는 delombok] -. 편집 화면 보완 .-> A
```

`javac`는 classpath에서 `META-INF/services/javax.annotation.processing.Processor`를 찾아 processor를 로드한다. Lombok은 숨김용 진입점과 자체 class loader를 둬 개발 의존성이 일반 타입 자동완성에 섞이지 않도록 하고, 컴파일러 종류에 따라 `javac`용 또는 Eclipse 컴파일러용 경로를 선택한다.

이 구조가 편리함과 호환 비용의 양쪽 원인이다. Java 소스 문법을 처리하는 공통 규약만 쓰는 것이 아니라 컴파일러 내부 트리에 기대는 부분이 있어 새 JDK가 내부 구현을 바꾸면 Lombok도 맞춰 배포해야 한다.

애플리케이션이 Lombok을 런타임에서 실행하는 것은 일반적인 사용 방식이 아니다. Gradle에서는 보통 `compileOnly`와 `annotationProcessor`를 분리하고 테스트에서 생성 코드가 필요하면 각각 테스트 구성도 둔다. Maven에서는 `provided`와 compiler annotation processor 설정을 팀의 빌드 방식에 맞춘다.

JPMS 모듈이라면 Lombok 문서의 `requires static lombok;`처럼 컴파일 전용 의존성을 표현할 수 있다. 중요 포인트는 IDE가 코드를 보여주는 기능과 빌드가 실제로 annotation processor를 실행하는 기능은 서로 다르다는 점이다.

무엇이 생성되는지는 애노테이션 조합으로 구체화된다. `@Data`는 `@ToString`, `@EqualsAndHashCode`, 전체 필드 getter, 비-final 필드 setter, `@RequiredArgsConstructor`의 묶음이다.

즉 “보일러플레이트를 줄인다”는 선언은 동시에 “모든 필드의 공개 변경 방법, 값 비교 범위, 로그 표현”을 한꺼번에 기본값에 맡긴다는 뜻이다. 동작이 필요하면 `@Getter`처럼 범위가 작은 도구를 고르고, 원치 않는 멤버는 `AccessLevel.NONE`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` 등으로 명시한다.

record는 다른 층의 기능이다. JEP 395로 Java 16에서 정식화됐고, 데이터 운반을 위한 언어 구성으로 생성자·접근자·`equals()`·`hashCode()`·`toString()`을 컴파일러가 규칙에 따라 제공한다. component는 final이며 접근자는 `getName()`이 아닌 `name()` 형태다.

얕은 불변성이지 component가 가리키는 컬렉션까지 자동으로 불변이 되는 것은 아니다. record는 상속 기반 프록시가 필요한 JPA 엔티티의 대체물이 아니다.

## 4. 선택지 비교

| 선택지 | 어떻게 동작 | 장점 | 단점 | 언제 쓰나 | 국내 실무에서 흔한가 |
|---|---|---|---|---|---|
| 직접 작성 | 생성자·접근자·동등성을 Java 소스에 선언 | 검토 시 동작이 그대로 보이고 빌드 도구 의존성 없음 | 코드가 길고 반복 수정이 생김 | 규칙이 복잡한 도메인, 민감한 공개 API | 조직·저장소별 편차. 비교 가능한 공개 통계는 확인하지 못함 |
| IDE 생성 | IDE가 표준 Java 메서드를 소스 파일에 작성 | 컴파일러 독립, 생성 결과 리뷰 가능, 런타임 비용 없음 | 생성된 코드도 소스 diff와 유지보수 대상 | 소수의 값 타입, 팀이 숨은 생성 규칙을 줄이려는 경우 | 공개 근거의 빈도 통계는 확인하지 못함 |
| Lombok | 컴파일 시 processor가 AST를 바꾸고 컴파일러가 결과를 생성 | 소스와 반복 코드가 짧아지고 여러 Java 버전에서 사용 가능 | IDE·빌드·컴파일러 호환을 함께 관리, 생성 코드가 소스에서 즉시 안 보임 | 기존 Java 코드베이스, 보일러플레이트를 줄이되 팀 규칙을 둘 수 있는 경우 | Spring 프로젝트에서 보이지만 보편 비율을 주장할 근거는 없음 |
| Java record | 언어가 데이터 운반 타입의 멤버를 생성 | 외부 processor 없이 의도가 드러나며 값 동등성이 기본 제공 | final·얕은 불변, 상속·JPA 프록시 제약, 접근자 형태 차이 | API 요청/응답, 이벤트, 안정된 값 객체 | Java 16+ 신규 코드에서 자연스러운 선택. 빈도 통계는 미확인 |
| Kotlin `data class` | Kotlin 컴파일러가 주 생성자 속성으로 메서드 생성 | 언어 기능으로 `copy`, 구조 분해 등 지원 | Kotlin 빌드·언어 도입, Java 상호 운용 및 프레임워크 설정 고려 | Kotlin을 채택한 서비스의 데이터 타입 | Kotlin 채택 여부에 달림. 빈도 통계는 미확인 |

어느 방식이 “더 짧은가”만으로 정하지 않는다. 코드 생성 결과를 누가 검토하는지, 모듈을 누가 컴파일하는지, IDE가 멤버를 추적하는지, 타입이 변경 가능한 엔티티인지가 선택 기준이다. 국내 실무 빈도에 대한 신뢰 가능한 조사 수치는 이번 조사에서 확인하지 못했으므로 관행을 숫자로 꾸미지 않는다.

## 5. 코드로 보기

아래는 식별자와 이름을 가진 조회 응답이라는 같은 기능이다. 명시적 Java 클래스와 record는 Java 21 단일 파일로 실행했다. Lombok과 Kotlin 예시는 해당 컴파일러/processor가 필요하므로 미실행이다.

### 5.1 직접 작성한 Java 클래스 — 실제 실행

```java
import java.util.Objects;

public class LombokAlternatives {
    public static void main(String[] args) {
        var recordView = new CustomerView(42, "Ada");
        var classView = new CustomerViewClass(42, "Ada");
        System.out.println(recordView);
        System.out.println(recordView.equals(new CustomerView(42, "Ada")));
        System.out.println(classView);
        System.out.println(classView.equals(new CustomerViewClass(42, "Ada")));
    }
}

record CustomerView(long id, String name) {}

final class CustomerViewClass {
    private final long id;
    private final String name;

    CustomerViewClass(long id, String name) {
        this.id = id;
        this.name = Objects.requireNonNull(name);
    }

    long id() { return id; }
    String name() { return name; }

    @Override public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof CustomerViewClass that)) return false;
        return id == that.id && name.equals(that.name);
    }

    @Override public int hashCode() { return Objects.hash(id, name); }

    @Override public String toString() {
        return "CustomerViewClass[id=" + id + ", name=" + name + "]";
    }
}
```

JDK 21 실행 출력:

```text
CustomerView[id=42, name=Ada]
true
CustomerViewClass[id=42, name=Ada]
true
```

### 5.2 Lombok으로 같은 값 타입 작성 — 미실행

```java
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CustomerView {
    long id;
    String name;
}
```

이 선언은 두 필드를 final로 두고 getter, 값 기반 `equals()`/`hashCode()`, `toString()`, 생성자를 만든 뒤 builder를 추가한다. 손으로 쓴 결과보다 짧지만 생성 규칙을 알아야 한다. 동일한 기능을 record로 만들면 다음 한 줄이다.

```java
public record CustomerView(long id, String name) {}
```

Lombok 클래스에 `@Builder`를 붙이는 것과 `@Builder`를 생성자나 팩토리 메서드에 붙이는 것은 의미가 다르다. 클래스 방식은 빌더가 필드를 모아 생성자를 호출한다. 생성자/메서드 방식은 그 대상의 매개변수를 그대로 빌더 입력으로 삼으므로 검증과 기본값을 팩토리 안에 둘 수 있다. 기본값은 자동으로 필드 초기화식을 따라오지 않는다.

```java
import java.time.Duration;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JobOptions {
    @Builder.Default
    private final Duration timeout = Duration.ofSeconds(3);
    private final boolean dryRun;
}
```

`JobOptions.builder().build()`는 `@Builder.Default`가 있어야 3초를 사용한다. 해당 어노테이션 없이 클래스 수준 빌더를 만들면 빌더의 미설정 필드값(참조형이면 `null`, primitive면 0/false)이 들어갈 수 있다. 반대로 `timeout(null)`을 명시하면 “미설정”이 아니므로 기본값을 쓰지 않는다.

불변식을 검증해야 한다면 생성자 또는 정적 팩토리에 `@Builder`를 붙이고 그곳에서 검사하는 편이 분명하다. Lombok 의존성과 annotation processor 설정 없이는 미실행이다.

### 5.3 엔티티에서 좁게 사용 — Spring Boot 4.1 / JPA, 미실행

```java
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PurchaseOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status;

    public PurchaseOrder(String status) {
        this.status = status;
    }

    public void markPaid() {
        if (!"PENDING".equals(status)) {
            throw new IllegalStateException("결제 대기 상태만 변경할 수 있습니다");
        }
        status = "PAID";
    }
}
```

이 예시는 모든 필드를 외부 setter로 열지 않고, 상태 전이를 도메인 메서드로 제한한다. 실제 ID 전략·동등성은 저장소의 데이터베이스와 상속 구조에 맞춰 설계해야 한다. `@Data`를 엔티티에 붙여 이를 생략하면 동등성 비교가 연관 관계를 읽거나, 변경 가능한 필드가 hash 기반 컬렉션의 위치를 바꾸는 식으로 예기치 않은 동작이 생길 수 있다.

같은 형태는 Kotlin에서 `data class CustomerView(val id: Long, val name: String)`로 표현한다. Kotlin의 생성 `equals()` 등은 주 생성자에 선언된 속성만 기준으로 삼는다. Kotlin을 쓰지 않는 Java 프로젝트에 data class 한 줄을 위해 Kotlin 컴파일러를 추가하는 것은 같은 비교가 아니다.

## 6. 실무에서는 실제로

**신규 Java 서비스:** API 입출력 DTO, 메시지 이벤트, 단순 조회 결과처럼 생성 후 값이 바뀌지 않는 타입은 record를 우선한다. 요청 값 검증이나 컬렉션 복사 등 생성 규칙이 필요하면 compact constructor 또는 명시적인 팩토리를 둔다. 상호 운용성이 필요한 프레임워크나 JavaBean 계약이 명확하다면 일반 클래스를 택하고, 그때만 Lombok을 붙인다.

**레거시 Spring 서비스:** 이미 Lombok과 IDE 설정이 표준이라면 Lombok을 일괄 제거할 이유가 없다. 새 코드부터 금지 목록과 허용 목록을 정하고 `@Data`를 작은 어노테이션으로 치환한다. 보이지 않는 API를 점검할 때 `delombok` 출력이나 IDE의 생성 멤버 탐색을 활용한다. 변경 때마다 실제 빌드에 processor가 연결되어 있는지 CI에서 확인한다.

**SI·금융 등 도구 체인 통제가 중요한 팀:** 컴파일 JDK, IDE, 빌드 플러그인, annotation processor 버전을 고정한다. 코드 리뷰에서 생성 결과를 보기 어려운 정책이면 record 또는 IDE 생성 메서드가 설명하기 쉽다. 보안·감사에서 의존성 목록을 엄격히 보더라도 Lombok은 대체로 컴파일 전용이지만, processor 자체의 공급망과 빌드 재현성은 의존성 검토 대상이다.

**스타트업 또는 Kotlin 신규 서비스:** Java 코드에 Lombok을 이미 썼다면 팀원이 생성 규칙과 IDE 설정을 공유하고 한 버전으로 정렬한다. Kotlin을 선택한 서비스는 data class를 언어 기능으로 사용하되, 모든 도메인 객체를 data class로 만들지는 않는다. 값 비교와 `copy()`가 상태 변경 가능성 및 민감 데이터 노출에 맞는지 확인한다.

**점진적 마이그레이션:** DTO부터 `@Data`를 `record` 또는 명시적 불변 타입으로 바꾸고, 엔티티는 setter를 업무 메서드로 바꾸며 동등성을 따로 검토한다. `@AllArgsConstructor` 호출부는 매개변수 순서에 의존하지 않도록 정적 팩토리나 builder로 옮긴다.

Java 업그레이드에서는 IDE 플러그인만 최신으로 해서는 충분하지 않다. 빌드에 실제 쓰이는 Lombok 버전, `javac` 버전, processor 설정, CI의 컴파일 결과를 한 묶음으로 점검한다.

기준 버전은 Java 25, Spring Boot 4.1.1이다. Boot 4.1.1 의존성 좌표표가 관리하는 Lombok은 1.18.46이다. 별도 버전으로 올릴 때는 팀이 최신이라고 부르는 버전만 좇지 말고 Boot의 테스트 조합과 플러그인 호환을 확인한다.

Lombok changelog는 1.18.46에서 JDK 26 지원, 1.18.48에서 JDK 27 지원을 기록한다. 컴파일러 내부에 결합된 도구는 JDK 업그레이드 시점마다 호환 릴리스가 생기는지 확인해야 한다.

## 7. 흔한 오해와 실수

1. **오해: `@Data`는 getter/setter만 만든다.** 증상: 필드 전체를 출력하는 로그가 민감 정보를 남기거나, 엔티티 변경이 어디서 발생했는지 추적하기 어렵다. 실제: `equals()`, `hashCode()`, `toString()`, getter, 비-final setter, required-args 생성자가 묶인다. 대처: 작은 애노테이션을 각각 명시하고 setter는 필요한 필드에만 연다.

2. **오해: JPA 엔티티도 데이터 클래스이므로 `@Data`가 편하다.** 증상: 로깅 중 연관 엔티티가 순환 참조해 스택 오버플로가 나거나, getter가 지연 로딩 쿼리를 촉발한다. 실제: 기본 `toString()`은 정적 필드를 빼고 나머지 필드를 다루며, 기본 동등성은 비-static·비-transient 필드를 사용한다. 양방향 연관과 가변 필드에 위험하다. 대처: 엔티티 `toString` 포함 필드를 제한하고, equals/hashCode 포함 규칙을 ID·불변 business key 등으로 따로 결정한다.

3. **오해: 빌더는 필드 초기값을 그대로 쓴다.** 증상: `timeout`이 기대한 3초 대신 null/0이 된다. 실제: builder가 모은 값으로 생성자를 호출하므로 미설정 필드의 선언부 초기화가 기본으로 보존되지 않는다. 대처: 필요하면 `@Builder.Default`; 더 중요한 생성 불변식은 빌더를 생성자/팩토리에 붙여 그 안에서 검증한다.

4. **오해: `@AllArgsConstructor`는 필드가 늘어도 안전하다.** 증상: 모두 `String`인 필드 순서를 바꾸자 컴파일은 성공하지만 호출부 의미가 바뀐다. 실제: 위치 기반 생성자 API라 같은 타입의 인수는 잘못 배치해도 타입 검사로 잡히지 않는다. 대처: public all-args 생성자를 줄이고 명시적 이름이 있는 팩토리나 검증 가능한 builder를 사용한다.

5. **오해: `toString()`은 디버깅에만 쓰여 무해하다.** 증상: 비밀번호·토큰·개인 정보가 로그로 유출되거나 순환 참조에서 무한 재귀한다. 실제: Lombok 기본 `@ToString`은 static 외 필드를 포함한다. 대처: 포함할 필드를 화이트리스트로 정하거나 `@ToString.Exclude`를 쓰고 민감 데이터를 값 객체로 분리한다.

6. **오해: `hashCode()`는 객체 생성 뒤에도 바뀌어도 상관없다.** 증상: `HashSet`에 저장한 엔티티가 `contains()`에서 사라진 것처럼 보인다. 실제: `hashCode()`에 쓰인 상태가 바뀌면 객체가 다른 버킷을 가리킨다. Lombok 기본 equals/hashCode는 많은 필드를 포함할 수 있다. 대처: 가변 엔티티를 값 타입처럼 비교하지 않고, 영속화 전후에도 일관된 동등성 규칙을 정한다.

7. **오해: IDE에서 생성된 멤버가 보이면 CI도 컴파일한다.** 증상: 로컬은 성공하는데 CI에서 getter를 찾지 못하거나 새 JDK에서 processor 오류가 난다. 실제: IDE 플러그인, javac processor, 빌드 classpath는 별도 설정이다. 대처: 빌드 파일에서 processor를 명시하고 CI가 같은 JDK·의존성 구성을 사용하게 고정한다.

8. **오해: record는 모든 Lombok 클래스를 대체한다.** 증상: JPA 엔티티를 record로 바꾸려다 프록시·가변 상태 요구와 충돌한다. 실제: record는 final인 얕은 불변 값 운반 타입을 위한 언어 기능이다. 대처: DTO와 엔티티의 역할을 구분하고, 수정 가능한 생명주기 객체에는 일반 클래스를 유지한다.

## 8. 자가점검 Q&A (면접 대비)

**Q1. Lombok은 실행 중 reflection으로 getter를 만드는가?**

아니다. Lombok은 컴파일 단계의 annotation processor로 컴파일러 트리를 수정하고, 컴파일러가 그 메서드를 포함한 클래스 파일을 만든다. 런타임은 일반 Java 메서드처럼 호출한다. 따라서 문제가 생기면 먼저 실행 JVM보다 컴파일 JDK와 processor 설정을 본다.

꼬리질문: 빌드 classpath에서 Lombok을 제외해도 실행할 수 있나? 보통 생성 멤버 호출 자체는 가능하다. 클래스 파일에 메서드가 이미 들어 있으므로 Lombok은 일반적으로 컴파일 전용으로 구성한다.

**Q2. `@Data`와 record의 핵심 차이는 무엇인가?**

`@Data`는 일반 클래스에 getter·setter·동등성·문자열 표현·required-args 생성자를 조합한다. record는 데이터 운반용 언어 문법이며 component가 final이고 접근자 이름도 component 이름 그대로다. record는 얕은 불변이며 엔티티 프록시처럼 상속이 필요한 사용처와 다르다.

꼬리질문: component가 `List<String>`이면 리스트도 불변인가? 아니다. 참조만 final이므로 필요하면 생성 시 복사하고 방어적 복사를 제공한다.

**Q3. 왜 JPA 엔티티에 `@Data`를 피하는가?**

엔티티에는 변경 가능한 생명주기와 지연 로딩 프록시가 있다. 모든 필드를 포함하는 `toString()`은 순환·쿼리·민감정보 노출을 일으킬 수 있고, 가변 필드 기반 `hashCode()`는 hash 컬렉션의 안정성을 깬다. 엔티티의 동등성 정책은 별도 설계해야 한다.

꼬리질문: 그럼 Lombok을 전혀 못 쓰나? 아니다. `@Getter`와 보호된 기본 생성자처럼 범위를 제한해 쓸 수 있지만 접근 수준과 프록시 요구를 검토한다.

**Q4. builder에서 필드 초기값이 사라지는 이유는?**

클래스 수준 builder는 별도 builder 객체에 값을 모은 후 생성자를 호출한다. builder에 값이 설정되지 않아도 필드 initializer를 실행한 객체를 만들지 않으면 그 초기값이 반영되지 않는다. `@Builder.Default`를 지정하거나 팩토리/생성자 수준 builder로 초기화 정책을 명확히 한다.

꼬리질문: builder에서 해당 필드에 명시적으로 null을 넣으면 default가 사용되나? 아니다. 필드를 지정한 것으로 처리되어 null이 전달된다.

**Q5. Lombok을 쓰면 Java 버전 업그레이드가 쉬워지는가?**

애플리케이션 소스가 짧아져도 Lombok은 컴파일러 구현에 기대므로 호환성을 따로 확인해야 한다. changelog는 JDK 지원을 릴리스별로 추가한다. 프로젝트의 dependency management, IDE 지원, annotation processor 경로, CI JDK를 함께 올려야 한다.

꼬리질문: 현재 기준 Boot 4.1.1 관리 버전은? Lombok 1.18.46이다. 새 버전을 고정할 때는 Boot BOM을 덮어쓰는 이유와 도구 체인 검증을 기록한다.

**Q6. `@AllArgsConstructor`가 소스 호환 사고를 낼 수 있는 이유는?**

생성자 매개변수 순서가 필드 선언 순서와 결합된다. 타입이 같은 매개변수가 여럿이면 필드 순서를 바꾸어도 호출부가 컴파일되면서 의미만 달라질 수 있다. 공개 API라면 이름이 드러나는 factory 또는 builder가 안전하다.

꼬리질문: 모든 내부 클래스에서도 위험이 같은가? 외부 호출자가 적은 내부 타입은 비용이 작지만, 필드 추가·재정렬 시 영향 범위를 리뷰해야 한다.

**Q7. IDE가 Lombok 코드를 표시하는 것과 annotation processing은 같은가?**

아니다. IDE 플러그인은 편집기와 분석기에서 생성 멤버를 인식하도록 돕는다. 빌드는 Maven/Gradle compiler 설정에서 processor를 발견해야 실제 바이트코드에 멤버가 생성된다. 로컬 IDE 성공만으로 CI 성공을 가정하면 안 된다.

꼬리질문: 실패 재현은 어디서 하는가? IDE 플러그인 효과를 걷어낸 명령행 빌드와 CI가 사용하는 JDK·processor 경로에서 확인한다.

**Q8. 신규 Java 서비스의 기본 선택은?**

요청/응답처럼 불변 값 운반이 목적이면 record가 단순하다. 도메인 상태 변경, 프록시, JavaBean 연동 등 일반 클래스가 필요하면 필요한 멤버만 명시하거나 Lombok 허용 목록을 사용한다. 핵심은 한 프로젝트 안에서 DTO와 엔티티의 규칙을 섞지 않는 것이다.

꼬리질문: record에서 검증은 어디에 두나? compact constructor에서 입력을 검사하고 불변식을 강제할 수 있다.

## 9. 참고문헌

- Lombok Features — https://projectlombok.org/features/ — 주요 애노테이션과 생성 기능의 전체 안내.
- `@Data` — https://projectlombok.org/features/Data — `@Data`가 묶는 애노테이션과 생성 동작.
- Lombok Execution Path — https://projectlombok.org/contributing/lombok-execution-path — javac/Eclipse 경로에서 processor가 시작되는 방식.
- Lombok JavaC Setup — https://projectlombok.org/setup/javac — javac와 모듈에서 Lombok을 컴파일 전용으로 설정하는 방법.
- Lombok Changelog — https://projectlombok.org/changelog — JDK 호환성 릴리스 이력과 최신 변경 사항.
- `@Builder` — https://projectlombok.org/features/Builder — builder 생성 규칙, `@Builder.Default`, 도입 이력.
- Lombok Constructors — https://projectlombok.org/features/constructor — 세 생성자 어노테이션의 대상 필드와 매개변수 순서.
- `@Getter` and `@Setter` — https://projectlombok.org/features/GetterSetter — 접근자 이름·접근 수준·생성 제외 규칙.
- `@EqualsAndHashCode` — https://projectlombok.org/features/EqualsAndHashCode — 기본 포함 필드와 상속 관련 동작.
- `@ToString` — https://projectlombok.org/features/ToString — 기본 문자열 필드 포함 및 제외 방법.
- JEP 395: Records — https://openjdk.org/jeps/395 — record의 설계와 Java 16 정식화.
- Hibernate ORM User Guide 7.4 — https://docs.hibernate.org/orm/7.4/userguide/html_single/Hibernate_User_Guide.html — 엔티티 기본 요건, 생성자, 프록시 및 `equals()`/`hashCode()` 논점.
- Kotlin Data Classes — https://kotlinlang.org/docs/data-classes.html — 주 생성자 속성으로부터 data class 멤버를 생성하는 규칙.
- Spring Boot Managed Dependency Coordinates — https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html — Boot 4.1.1의 Lombok 관리 버전 1.18.46.

생성자·Builder 설계 전반은 → P04 참조. Java 애노테이션의 기본 문법과 처리 모델은 → P03 참조.
