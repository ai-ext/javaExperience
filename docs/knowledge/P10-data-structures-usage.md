# P10. 자료구조 실무 사용법 — 배열·List·Set·Map·Queue·Deque·PriorityQueue

> 기본값은 `ArrayList`·`HashSet`·`HashMap`·`ArrayDeque`다.
> 순서·정렬·우선순위 요구에 따라 특화 구현을 고른다.
> 인터페이스 선언, 불변성, 빈 큐 처리를 구분해 자주 나는 오류를 피한다.

## 1. 한 줄로 말하면

자료구조는 여러 값을 담고 찾고 꺼내는 방식에 따라 연산 비용과 순서 규칙을 정하는 그릇이다. Java에서는 배열과 `java.util` 컬렉션을 사용하며, 자료구조 선택은 “어떤 연산을 자주 하고 어떤 순서가 필요한가”로 결정한다. 조회가 빠른 `Map`에 순서까지 기대하거나, 고정 크기·불변 리스트를 수정하면 운영 코드와 면접 답변 모두에서 문제가 생긴다.

## 2. 당장 알아야 할 것

### 2.1 구현체가 아닌 인터페이스로 선언한다

```java
List<String> names = new ArrayList<>();
Set<String> uniqueNames = new HashSet<>();
Map<Long, String> nameById = new HashMap<>();
Queue<Runnable> jobs = new ArrayDeque<>();
```

변수·매개변수에 구현체를 박으면 교체가 호출부까지 번진다. 구현은 생성 지점에서 고른다. `Map`은 `Collection`과 별도 인터페이스다.

### 2.2 배열은 크기가 고정이고, `Arrays.asList`도 크기를 못 바꾼다

```java
int[] scores = {82, 95, 71};
Arrays.sort(scores);
System.out.println(Arrays.toString(scores)); // [71, 82, 95]

String[] source = {"Kim", "Lee"};
List<String> view = Arrays.asList(source); // 고정 크기, 배열과 연결된 뷰
view.set(0, "Park");                       // source[0]도 "Park"로 바뀜
// view.add("Choi");                       // UnsupportedOperationException
```

`Arrays.asList`는 고정 크기 뷰다. 추가·삭제하려면 `new ArrayList<>(...)`로 복사한다. `Arrays.asList(intArray)`는 `List<int[]>` 한 원소가 된다. 중첩 배열은 `Arrays.deepToString`으로 출력한다.

### 2.3 `ArrayList`가 기본 `List`, `LinkedList`는 필요가 드물다

```java
List<String> orders = new ArrayList<>();
orders.add("A-101");
String first = orders.get(0);
orders.removeIf(order -> order.startsWith("cancelled-"));
```

`ArrayList`는 인덱스 조회와 끝 추가용이다. 중간 삽입·삭제는 뒤 원소를 옮긴다. `LinkedList`도 인덱스 접근은 선형이며 노드 비용이 있어 무조건 빠른 대체재가 아니다. 양 끝 큐·스택은 보통 `ArrayDeque`로 표현한다.

### 2.4 중복·순서 조건으로 `Set`을 고른다

```java
Set<String> unique = new HashSet<>();        // 순서 보장 없음
Set<String> arrival = new LinkedHashSet<>(); // 들어온 순서 유지
Set<String> sorted = new TreeSet<>();         // 자연 순서 또는 Comparator
unique.add("Kim");
boolean exists = unique.contains("Kim");
unique.remove("Kim");
sorted.add("Kim");
String smallest = sorted.iterator().next();
sorted.remove("Kim");
for (String name : arrival) System.out.println(name);
```

`add`는 신규 원소면 `true`, 중복이면 `false`다. `HashSet` 순서를 출력 계약으로 삼지 않는다. `TreeSet`은 비교 결과 0인 원소를 중복 처리하므로 `equals`와 비교 기준을 맞춘다.

### 2.5 키로 찾을 땐 `Map`; 목적에 맞는 메서드를 쓴다

```java
Map<Long, String> emailByUserId = new HashMap<>();
emailByUserId.put(42L, "dev@example.com");
String email = emailByUserId.getOrDefault(99L, "unknown@example.com");
Map<Long, String> insertionOrdered = new LinkedHashMap<>();
Map<Long, String> keySorted = new TreeMap<>();
insertionOrdered.put(42L, "dev@example.com");
String found = insertionOrdered.get(42L);
String removed = insertionOrdered.remove(42L);
keySorted.put(7L, "seven");
String bySortedKey = keySorted.get(7L);
keySorted.remove(7L);

Map<String, List<Long>> idsByStatus = new HashMap<>();
idsByStatus.computeIfAbsent("READY", key -> new ArrayList<>()).add(42L);

Map<String, Integer> counts = new HashMap<>();
counts.merge("READY", 1, Integer::sum);
for (Map.Entry<String, Integer> entry : counts.entrySet()) {
    System.out.println(entry.getKey() + "=" + entry.getValue());
}
```

`getOrDefault`는 키가 없을 때 기본값을 주며, 존재하는 null 매핑에는 null을 돌려준다. `computeIfAbsent`는 미등록/null 값을 계산하고 null 결과는 저장하지 않는다. `merge`는 카운터 누적에 편리하다. `HashMap` 순서는 미정이다.

### 2.6 FIFO·스택은 `ArrayDeque`; 빈 큐는 예외 대신 `poll`·`peek`

```java
Queue<String> fifo = new ArrayDeque<>();
fifo.offer("task-1");
String next = fifo.poll(); // 비었으면 null

Deque<String> stack = new ArrayDeque<>();
stack.push("page-1");
String lastIn = stack.pop();
```

`offer`/`poll`/`peek`는 실패·빈 상태를 반환값으로 표현하며 `add`/`remove`/`element`는 예외를 던진다. `ArrayDeque`는 null 금지다. 스택은 `Deque.push`/`pop`으로 구현하고, 레거시 `Stack`·`Vector`는 피한다.

### 2.7 우선순위가 필요하면 `PriorityQueue`

```java
Queue<Integer> smallestFirst = new PriorityQueue<>();
Queue<Integer> largestFirst = new PriorityQueue<>(Comparator.reverseOrder());
smallestFirst.offer(8);
smallestFirst.offer(2);
int smallest = smallestFirst.poll(); // 2
```

기본은 자연 순서 최소 힙이다. `iterator()`는 정렬 순서를 보장하지 않으므로 전체 순서가 필요하면 `poll()` 반복 또는 목록 정렬을 한다. 동률 순서가 필요하면 비교 기준에 키를 추가한다.

### 2.8 불변성·정렬·삭제는 호출 전에 의도를 정한다

`List.of`는 수정 불가이며 null도 금지한다. `Arrays.asList`는 `set`은 되지만 길이는 바뀌지 않는다. 대표 순서는 `Comparable`, 용도별 순서는 `Comparator`로 정한다. 순회 중 삭제는 `removeIf` 또는 `Iterator.remove`를 쓴다.

## 3. 따라 하기

예제는 ID로 상품을 조회하고 카테고리를 중복 없이 정렬해 반환하는 REST API다. 데이터는 재시작 시 사라지므로 영속 데이터에는 DB, 서버 간 작업 대기에는 메시지 브로커를 쓴다.

### 1단계: 프로젝트 준비

Spring Initializr에서 Spring Boot `4.1.1`, Java `25`, Gradle Kotlin DSL, Spring Web MVC를 선택해 생성한다. 아래 경로에 코드를 넣는다. 생성된 Gradle Wrapper를 사용한다.

`settings.gradle.kts`

```kotlin
rootProject.name = "collections-demo"
```

`build.gradle.kts`

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

repositories { mavenCentral() }

dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:4.1.1"))
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
```

Maven 대응: `spring-boot-starter-parent`를 `4.1.1`로 설정하고 `org.springframework.boot:spring-boot-starter-webmvc` 의존성 및 Java 25를 지정한다.

### 2단계: 모델과 ID 색인 작성

`src/main/java/example/catalog/Product.java`

```java
package example.catalog;

public record Product(long id, String name, String category) { }
```

`src/main/java/example/catalog/CatalogService.java`

```java
package example.catalog;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CatalogService {
    private final Map<Long, Product> byId;

    public CatalogService() {
        List<Product> seed = List.of(
                new Product(1L, "monitor", "display"),
                new Product(2L, "keyboard", "input"),
                new Product(3L, "mouse", "input"));

        Map<Long, Product> index = new HashMap<>();
        for (Product product : seed) {
            if (index.putIfAbsent(product.id(), product) != null) {
                throw new IllegalStateException("duplicate product id: " + product.id());
            }
        }
        this.byId = Map.copyOf(index); // 이후 변경 불가한 색인
    }

    public Product findById(long id) {
        Product product = byId.get(id);
        if (product == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "product not found");
        }
        return product;
    }

    public List<Product> findAll() {
        List<Product> result = new ArrayList<>(byId.values());
        result.sort(Comparator.comparingLong(Product::id));
        return List.copyOf(result);
    }

    public List<String> categories() {
        Set<String> uniqueSorted = new TreeSet<>();
        for (Product product : byId.values()) {
            uniqueSorted.add(product.category());
        }
        return List.copyOf(uniqueSorted);
    }
}
```

`HashMap`으로 ID를 색인하고 `Map.copyOf`로 변경을 막는다. 이 복사는 얕으므로 값까지 불변으로 만들지는 않는다. 전체 목록은 맵 순서 대신 ID로 정렬하고, 카테고리는 `TreeSet`으로 중복 제거와 정렬을 함께 한다.

### 3단계: 컨트롤러와 실행

`src/main/java/example/catalog/CatalogController.java`

```java
package example.catalog;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/catalog")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/items")
    public List<Product> items() {
        return catalog.findAll();
    }

    @GetMapping("/items/{id}")
    public Product item(@PathVariable("id") long id) {
        return catalog.findById(id);
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return catalog.categories();
    }
}
```

`src/main/java/example/catalog/CatalogApplication.java`

```java
package example.catalog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CatalogApplication {
    public static void main(String[] args) {
        SpringApplication.run(CatalogApplication.class, args);
    }
}
```

프로젝트 루트에서 `./gradlew bootRun` 후 확인한다. (Spring 예제 미실행: 이 작업의 실행 검증 환경은 JDK 21이다.)

```bash
curl -i http://localhost:8080/catalog/items/2
curl -i http://localhost:8080/catalog/categories
curl -i http://localhost:8080/catalog/items/99
```

확인 방법: 첫 응답은 `200`과 `{"id":2,"name":"keyboard","category":"input"}`, 둘째 응답은 `200`과 `["display","input"]`, 없는 ID는 `404`다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 배열 | 크기 고정, 기본형 저장 | `int[] a = {3, 1}; Arrays.sort(a);` | 길이 변경 불가 |
| `ArrayList` | 인덱스·끝 추가 | `List<T> xs = new ArrayList<>();` | 중간 변경 O(n), 구조 변경 순회 주의 |
| `LinkedList` | 양 끝 삽입·삭제 | `Deque<T> q = new LinkedList<>();` | 인덱스 O(n); 큐는 보통 `ArrayDeque` |
| `HashSet` | 중복 제거·멤버 확인 | `set.contains(value)` | 무순서, 기본 연산 평균 O(1) 가정 |
| `LinkedHashSet` | 입력 순서를 보존한 중복 제거 | `new LinkedHashSet<>()` | 순서 유지 비용 있음 |
| `TreeSet` | 정렬된 중복 제거 | `new TreeSet<>()` | 연산 O(log n), 비교 0이면 중복 |
| `HashMap` | 키 조회·갱신 | `map.get(id)`, `map.put(id, value)` | 무순서, 평균 O(1) 가정 |
| `LinkedHashMap` | 맵 순회 순서 보존 | `new LinkedHashMap<>()` | 순서가 불필요하면 `HashMap` |
| `TreeMap` | 정렬 키·범위 조회 | `new TreeMap<>()` | 연산 O(log n) |
| `ArrayDeque` | FIFO·LIFO | `offer/poll`, `push/pop` | 양 끝 분할 상환 O(1), null·동시 접근 불가 |
| `PriorityQueue` | 우선 원소부터 처리 | `new PriorityQueue<>(comparator)` | peek O(1), 삽입·제거 O(log n), iterator 무순서 |
| `List.of` | 수정 불가 목록 | `List<T> xs = List.of("a");` | 변경 시 예외, null 불가 |
| 정렬 | 자연 순서 또는 사용처별 순서 | `xs.sort(Comparator.comparing(...))` | `reversed()`를 연결한 위치에 따라 동률 정렬도 뒤집힐 수 있음 |

해시 O(1)은 기대 성능이며 `HashSet` 순회는 용량에도 비례한다.

## 5. 자주 나는 에러와 해결

1. `UnsupportedOperationException` — `List.of`/`Arrays.asList`를 수정했다. 가변 복사본은 `new ArrayList<>(source)`다.
2. `ConcurrentModificationException` — 향상된 `for` 중 `list.remove(x)`로 구조를 바꿨다. `removeIf` 또는 `Iterator.remove`를 쓴다. fail-fast는 동시성 제어가 아니다.
3. 빈 큐에서 `NoSuchElementException` — `remove`/`element`를 사용했다. 빈 상태가 정상일 땐 `poll`/`peek`를 쓰고 반환된 `null`을 확인한다.
4. `PriorityQueue`에 원소 추가 시 `ClassCastException` — 원소가 자연 순서로 비교되지 않는다. 생성자에 `Comparator`와 필요한 동률 기준을 전달한다.
5. `PriorityQueue`를 순회해도 정렬되지 않음 — 힙은 전체 원소 정렬을 보장하지 않는다. 복사본에서 `poll`을 반복하거나 목록을 정렬한다.
6. `Arrays.asList(intArray).size()`가 1 — 기본형 배열은 `List<int[]>` 한 원소로 처리된다. `int[]` API를 쓰거나 원소를 `List<Integer>`에 복사한다.
7. `HashMap`/`HashSet` 출력 순서가 테스트마다 다름 — 순서 계약이 없다. 필요하면 `LinkedHash*`/`Tree*`를 쓰거나 비교 전에 정렬한다.

## 6. 한 단계 더

- 자료구조는 연산 빈도와 순서 계약으로 고른다. 해시의 평균 O(1)은 `equals`/`hashCode`와 분포를 전제로 한다 → J07 참조.
- `unmodifiableList`는 원본 뷰, `List.copyOf`는 별도 불변 목록이다. fail-fast는 동시 접근을 안전하게 하지 않는다 → J11 참조.
- `Comparator` 조합은 정렬 기준을 명시한다. Stream API로 컬렉션 파이프라인을 구성하는 내용은 → J09 참조.
- 기본값은 `ArrayList`·`HashMap`·`HashSet`·`ArrayDeque`; 순서·정렬·우선순위 요구가 있을 때 특화 구현을 고른다.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `List<String> x = new ArrayList<>()`처럼 인터페이스로 선언하는 이유는?

인터페이스는 필요한 계약만 노출해 구현을 감춘다. 자료구조를 바꿀 때 호출부를 수정하지 않고 생성 지점만 교체할 수 있으며, 매개변수도 특정 구현에 묶이지 않는다.

꼬리질문: 구현체 타입 선언은 언제 하나? → 전용 API가 계약인 경우다.

### Q2. `Arrays.asList`와 `List.of`는 어떻게 다른가?

`Arrays.asList`는 배열에 연결된 고정 크기 목록이며 `set`은 배열에 반영된다. `List.of`는 수정 불가·null 금지다. 수정본은 `new ArrayList<>(source)`로 만든다.

꼬리질문: `List.copyOf`는 깊은 복사인가? → 아니다.

### Q3. 중복을 제거하면서 입력 순서를 유지하려면 무엇을 쓰나?

`LinkedHashSet`을 써서 처음 추가한 순서를 보존한다. `HashSet`은 순서를 계약하지 않고 `TreeSet`은 정렬 순서로 순회한다. 중복 판정 기준은 객체의 `equals`/`hashCode`다.

꼬리질문: `TreeSet`의 중복 기준은? → 비교 결과 0이다.

### Q4. `HashMap` 순회 결과를 사용자에게 그대로 보여도 되나?

안 된다. `HashMap`은 순서를 보장하지 않아 데이터나 키 상태에 따라 순회 결과가 달라진다. 입력 순서는 `LinkedHashMap`, 키 정렬은 `TreeMap`으로 보장한다.

꼬리질문: 왜 `entrySet`인가? → 키·값을 한 번에 얻는다.

### Q5. `Queue.remove()`와 `poll()`은 어떤 차이가 있나?

둘 다 맨 앞을 제거하지만 비었을 때 `remove()`는 `NoSuchElementException`, `poll()`은 `null`을 준다. 빈 상태가 정상 흐름이면 예외 대신 반환값을 검사한다.

꼬리질문: `ArrayDeque`에 null을 담나? → 안 된다.

### Q6. `PriorityQueue`를 순회하면 왜 정렬 순서가 아닌가?

힙은 최우선 원소만 머리에 두고 나머지 전체 정렬은 유지하지 않는다. iterator 순서는 미정이므로 전체 순서는 복사본에서 `poll`을 반복해 만든다.

꼬리질문: 최대값부터 꺼내려면? → 역순 `Comparator`를 준다.

### Q7. 반복 중 삭제에서 `ConcurrentModificationException`이 발생하면?

반복자가 만들어진 뒤 반복자 바깥에서 구조를 바꿔 발생한다. 조건 삭제는 `removeIf`, 반복자 직접 삭제는 `Iterator.remove`로 하고, 멀티스레드 안전성은 별도로 설계한다 → J11 참조.

꼬리질문: fail-fast는 정확성 보장인가? → 아니다.

## 8. 참고문헌

- Lesson: Interfaces — https://docs.oracle.com/javase/tutorial/collections/interfaces/index.html — 인터페이스 개념.
- Lesson: Implementations — https://docs.oracle.com/javase/tutorial/collections/implementations/ — 구현 선택.
- `ArrayList` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html — 시간 특성.
- `HashSet` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashSet.html — 순서·성능.
- `HashMap` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html — 순서·계산.
- `ArrayDeque` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayDeque.html — 큐·스택.
- `PriorityQueue` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/PriorityQueue.html — 우선 원소.
- `Comparator` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Comparator.html — 비교 조합.
- `Arrays` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html — sort·asList.
- `List` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html — 불변 목록.
- Build Systems — https://docs.spring.io/spring-boot/4.1/reference/using/build-systems.html — Gradle·MVC.
