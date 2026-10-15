# J09. Stream API

> 3줄 요약 — Stream은 컬렉션이 아니라 데이터 소스에 적용할 계산의 파이프라인이며, 중간 연산은 최종 연산 전까지 실행되지 않는다.
> 순차 스트림부터 정확한 결과와 가독성을 확보하고, 병렬화는 분할 가능성·연산 비용·결합 법칙이 맞을 때 측정 후 적용한다.
> `groupingBy`·`toMap`·`flatMap`으로 집계를 명시하고, Java 24의 Gatherers(JEP 485)는 기존 연산으로 어색한 사용자 정의 중간 변환에 쓴다.

## 1. 왜 알아야 하나

배치에 `.parallel()`을 덧붙였더니 DB 호출이 한꺼번에 몰려 풀이 막히고, 요청별 `ThreadLocal` 정보가 사라질 수 있다. `ArrayList`를 `reduce`에서 수정하거나 순서 의존 누산기를 병렬화하면 결과도 달라진다. `toMap`은 중복 키에서 기본 수집기가 예외를 내며, `peek` 로그는 최적화로 생략될 수 있다.

Stream API를 단순히 “람다로 컬렉션을 도는 문법”으로 보면 이런 문제를 놓친다. 스트림은 값을 저장하지 않고 계산을 기술한다. 구현은 필요한 값만 읽거나, 여러 단계를 한 번에 수행하거나, 순차 연산을 생략할 수도 있다.

병렬 모드에서는 입력을 분할해 여러 스레드에서 실행하고 부분 결과를 결합한다. 따라서 순서, 부수 효과, 연산의 결합 가능성, 소스의 분할 특성이 모두 결과와 성능에 영향을 준다. 람다와 함수형 인터페이스의 원리는 → J08 참조.

## 2. 핵심 개념

스트림은 소스의 원소를 파이프라인에 전달하는 1회성 계산 객체다. `Collection`처럼 원소를 보관하거나 인덱스로 조회하지 않는다. 소스는 컬렉션·배열·생성 함수·I/O 등일 수 있다.

| 용어 | 뜻 | 예 |
|---|---|---|
| 소스(source) | 원소를 제공하는 곳 | `list.stream()`, `Stream.of(...)`, `IntStream.range(...)` |
| 중간 연산 | 다른 스트림을 반환하며 파이프라인을 구성 | `filter`, `map`, `flatMap`, `distinct`, `sorted`, `limit`, `gather` |
| 최종 연산 | 파이프라인을 실행해 결과 또는 부수 효과를 만듦 | `toList`, `collect`, `reduce`, `count`, `forEach`, `findFirst` |
| stateless 연산 | 각 원소를 이전 원소의 처리 결과와 무관하게 처리 | `map`, `filter` |
| stateful 연산 | 원소 간 상태를 유지하거나 전체 입력을 참조 | `distinct`, `sorted`, 일부 `Gatherer` |
| 단락(short-circuit) | 답이 정해지면 나머지 입력 처리를 멈출 수 있음 | `findFirst`, `anyMatch`, `limit` |
| encounter order | 소스가 정의한 관찰 순서 | `List`의 순서, 정렬된 스트림의 순서 |
| Collector | 원소를 누적·결합·마무리하는 수집 전략 | `groupingBy`, `toMap`, `joining` |

**중간 연산과 최종 연산:** `map`·`filter`만 호출하면 계산되지 않는다. 최종 연산 하나가 스트림을 소비하고, 재사용하려면 `Supplier<Stream<T>>` 등으로 새 스트림을 만든다. `findFirst`, `anyMatch`, `limit`은 결과가 확정되면 입력을 더 읽지 않을 수 있다.

**지연 평가와 단락:** 전자는 연산 시점, 후자는 처리량의 특성이다. `iterate(...).filter(...).findFirst()`는 첫 일치 값에서 멈출 수 있지만 무한 입력에 `sorted()`를 먼저 적용하면 입력 끝을 알 수 없어 완료하지 못한다.

**`map`과 `flatMap`:** `map`은 원소 하나를 결과 하나로 바꾼다. `flatMap`은 원소 하나를 하위 스트림으로 바꾼 다음 하위 스트림들을 이어 붙인다. `List<List<T>>`를 평탄화하거나 주문별 품목을 한 줄의 품목 흐름으로 만드는 데 적합하다. 하위 결과가 없으면 빈 스트림을 반환하면 된다.

**`groupingBy`, `partitioningBy`, `toMap`:** `groupingBy(classifier)`는 분류 키마다 원소 목록을 만든다. downstream `Collector`를 붙이면 목록 대신 합계·개수·최댓값 등을 그룹별로 바로 계산한다. `partitioningBy(predicate)`는 분류 키가 `true`와 `false`뿐인 두 갈래 분할이다.

`toMap(keyMapper, valueMapper)`은 키가 유일하다고 가정한다. 중복 키가 허용되면 병합 함수가 있는 오버로드를 사용하고, 더 구체적인 맵이 필요하면 맵 공급자도 지정한다.

| 선택 | 결과 모양 | 예시 |
|---|---|---|
| `groupingBy` | 임의의 분류 키 → 그룹 결과 | 부서별 급여 합계 |
| `partitioningBy` | 조건별 `true`/`false` 두 그룹 | 기준 이상/미만 주문 |
| `toMap` | 키 → 값 | SKU별 재고 합계; 중복 정책을 병합 함수로 결정 |

**`reduce`와 `collect`:** `reduce`는 불변 값의 누적 결과(합계·곱 등)를 만든다. 병렬 reduction은 임의의 묶음 순서로 계산될 수 있으므로 누산 연산은 결합법칙을 만족해야 하며 항등값도 맞아야 한다.

`collect`는 컬렉션처럼 변경 가능한 컨테이너를 만들고, 분할 처리 시 각 부분 컨테이너를 결합하는 용도다. 여러 스레드가 같은 `ArrayList`를 공유하도록 `reduce`하지 말고 `collect(Collectors.toList())`처럼 Collector의 생성·누적·결합 계약을 사용한다.

**원시 스트림:** `IntStream`, `LongStream`, `DoubleStream`은 기본형 특화 스트림이다. `mapToInt`, `sum`, `average`, `summaryStatistics`는 `Integer` 등의 박싱과 언박싱을 줄이고 수치 연산을 직접 표현한다.

`Stream<T>`에는 객체 참조, 원시 특화 스트림에는 해당 숫자형이 흐른다. Java는 `boolean`이나 `char`용 특화 스트림은 제공하지 않는다.

## 3. 내부 동작·원리

### 파이프라인은 어떻게 실행되나

```text
소스(Collection / 배열 / 생성기 / I/O)
      │ Spliterator가 원소를 공급하고 필요하면 분할
      ▼
중간 연산 체인: filter → map → flatMap → ...
      │ 최종 연산이 시작되기 전에는 보통 원소 순회 없음
      ▼
최종 연산: reduce / collect / findFirst / forEach
      │ 필요한 만큼 원소를 당겨오고, 결과가 확정되면 종료 가능
      ▼
결과 또는 지정된 부수 효과
```

1. `list.stream()`은 원소를 복사하지 않고 소스와 순회 방법을 연결한다.
2. `filter`, `map`은 다음 동작을 체인에 등록한다. 대개 이때 소스 순회는 시작하지 않는다.
3. 최종 연산은 소스의 `Spliterator`에서 원소를 요청한다. stateless 단계는 원소별로 이어 처리할 수 있지만, `sorted`처럼 전체 입력이 필요한 연산은 버퍼링할 수 있다.
4. 결과가 정해지면 단락 연산이 상류에 취소를 전파한다. 단, 앞선 stateful 연산이 전체 입력을 요구하면 소스 순회를 줄이지 못할 수 있다.
5. 스트림은 한 번만 소비한다. 닫아야 하는 I/O 스트림은 `try`-with-resources로 닫는다.

### 왜 부수 효과를 피해야 하나

Stream 구현은 결과에 영향 없는 단계를 생략할 수 있다. 크기를 아는 소스의 `map(...).count()`에서는 매핑 결과가 필요 없을 수 있으므로 람다 호출 횟수나 `peek` 출력을 보장으로 삼지 않는다. 파라미터는 결과값을 계산하게 하고 업무 상태 갱신·파일 쓰기는 숨기지 않는다. `peek`는 디버깅 보조다.

처리 중 소스를 바꾸지 말고, 행동 파라미터에서 외부 변경 상태에 의존하지 않는다. `forEach`에 지정한 최종 효과와 중간 단계의 우연한 부수 효과를 구별한다.

### 병렬 스트림: 분할, 처리, 결합

```text
                 source Spliterator
                   /           \
              분할 입력 A      분할 입력 B     ...
                 │                │
          worker가 연산 수행  worker가 연산 수행
                 └──── Collector의 combiner ────┘
                              │
                       최종 결과 조립
```

`parallel()`은 입력을 나눠 처리할 수 있게 한다. `Spliterator.trySplit()`이 균형 있게 입력을 쪼개야 하며, 원소당 일이 작으면 작업·스케줄링·결합 비용이 이득보다 클 수 있다. JEP 107도 기존 코드를 일괄 병렬화하는 것을 목표로 하지 않았다.

병렬 reduction은 분할별 부분 결과를 combiner로 합친다. 합계에는 자연스럽지만 순서 의존 연산에는 맞지 않을 수 있다. Collector의 `CONCURRENT` 특성이 없으면 작업들이 한 가변 컨테이너를 함께 갱신한다고 가정하지 않는다. `forEach`는 순서를 보장하지 않으므로 순서가 계약이면 `forEachOrdered`나 순차 처리를 쓴다.

OpenJDK의 일반적인 병렬 Stream은 `ForkJoinPool` 공용 풀을 활용한다. 다른 Fork/Join 작업과 경쟁하며, 블로킹 I/O가 끼어도 워커 확장이 보장되지 않는다.

JDBC·HTTP 호출을 넣지 말고, 트랜잭션·MDC·보안 문맥 등 `ThreadLocal` 상태의 전파도 가정하지 않는다. Stream API에는 실행기를 지정하는 메서드가 없으므로, 사용자 풀에 제출해 병렬 Stream을 실행하는 관행은 구현 의존으로 취급하고 계약으로 삼지 않는다.

### Stream Gatherers (JEP 485)

Java 24에서 정식화된 Gatherers는 사용자 정의 **중간 연산**을 구성하는 API다. 기존 `map`, `filter`, `flatMap`만으로 어색했던 고정/슬라이딩 윈도, 연속 중복 제거, 누적 스캔 등을 `gather(gatherer)`로 파이프라인에 넣는다. 최종 연산인 `collect`와 역할이 다르다.

Gatherer는 타입 `T`·`A`·`R`와 상태 초기화 `initializer`, 입력 통합 `integrator`, 부분 상태 결합 `combiner`, 종료 처리 `finisher`로 정의된다. 의미를 보존하는 combiner가 있을 때만 병렬화하고, 순서가 본질이면 순차 Gatherer를 쓴다.

`windowFixed(n)`은 겹치지 않는 창, `windowSliding(n)`은 겹치는 창을 만든다. 마지막 고정 창은 작을 수 있고 출력 목록은 수정 불가능하다. 큰 창은 메모리를 많이 쓸 수 있다. `mapConcurrent(maxConcurrency, mapper)`는 가상 스레드로 함수를 지정 한도까지 동시 실행한다. `parallel()`과 별개 기능이므로 중복 동시성을 주의한다.

## 4. 코드로 확인

아래 첫 두 프로그램은 JDK 21.0.6에서 단일 파일 실행으로 확인했다. 세 번째는 Java 24 이상이 필요한 API 예제다.

### 예제 1 — 지연 평가와 단락

```java
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

public class LazyShortCircuitDemo {
    public static void main(String[] args) {
        AtomicInteger generated = new AtomicInteger();
        Stream<Integer> pipeline = Stream.generate(generated::incrementAndGet)
                .filter(n -> n % 2 == 0)
                .limit(2);

        System.out.println("before terminal=" + generated.get());
        List<Integer> result = pipeline.toList();
        System.out.println("result=" + result);
        System.out.println("generated=" + generated.get());
    }
}
```

`Stream.generate`는 무한 입력도 만들 수 있지만, 최종 연산이 두 짝수를 요구하므로 홀수까지 포함해 네 값만 생성한다. 파이프라인 구성 시에는 입력을 읽지 않는다.

```text
before terminal=0
result=[2, 4]
generated=4
```

### 예제 2 — 그룹 집계, 중복 키 병합, 분할과 평탄화

```java
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class CollectorCompositionDemo {
    record Line(String category, String sku, int quantity) {}

    public static void main(String[] args) {
        List<Line> lines = List.of(
                new Line("book", "B1", 2),
                new Line("book", "B2", 4),
                new Line("book", "B1", 3),
                new Line("game", "G1", 6));

        Map<String, Integer> totalsByCategory = lines.stream().collect(
                Collectors.groupingBy(Line::category, TreeMap::new,
                        Collectors.summingInt(Line::quantity)));
        Map<String, Integer> quantitiesBySku = lines.stream().collect(
                Collectors.toMap(Line::sku, Line::quantity, Integer::sum, TreeMap::new));
        Map<Boolean, List<Line>> largeLines = lines.stream().collect(
                Collectors.partitioningBy(line -> line.quantity() >= 5));
        List<String> tags = List.of(List.of("java", "stream"), List.of("collector"))
                .stream().flatMap(List::stream).toList();

        System.out.println("category totals=" + totalsByCategory);
        System.out.println("sku totals=" + quantitiesBySku);
        System.out.println("large line counts=" + largeLines.get(true).size()
                + "/" + largeLines.get(false).size());
        System.out.println("flattened=" + tags);
    }
}
```

`toMap`의 세 번째 인자인 `Integer::sum`이 중복 SKU `B1`의 수량을 합산한다. 분류 결과는 `TreeMap`으로 키 순서를 고정해 출력한다.

```text
category totals={book=9, game=6}
sku totals={B1=5, B2=4, G1=6}
large line counts=1/3
flattened=[java, stream, collector]
```

### 예제 3 — 고정 창 Gatherer

```java
// Java 24+ (JEP 485)
import java.util.List;
import java.util.stream.Gatherers;
import java.util.stream.Stream;

public class FixedWindowDemo {
    public static void main(String[] args) {
        List<List<Integer>> windows = Stream.of(1, 2, 3, 4, 5, 6, 7, 8)
                .gather(Gatherers.windowFixed(3))
                .toList();
        System.out.println(windows);
    }
}
```

```text
(JDK 21 환경이라 미실행)
예상 출력: [[1, 2, 3], [4, 5, 6], [7, 8]]
```

## 5. 버전별 변화 — 왜 바뀌었나

| 버전 | 변화와 배경 |
|---|---|
| Java 8 (2014) | JEP 107로 컬렉션 대량 처리에 filter/map/reduce와 순차·병렬 연산을 도입했다. 반복문만으로는 선언적 변환과 병렬 처리를 함께 표현하기 어려웠기 때문이다. JEP의 비목표는 기존 코드를 일괄 병렬화하는 것이었다. |
| Java 22 (2024) | JEP 461에서 Gatherers가 프리뷰로 등장했다. 고정된 내장 중간 연산만으로 사용자 정의 윈도·누적 변환을 표현하기 어려웠기 때문이다. |
| Java 23 (2024) | JEP 473으로 두 번째 프리뷰를 제공했다. API 경험과 피드백을 더 얻기 위해 동작 변경 없이 다시 노출했다. |
| Java 24 (2025) | JEP 485가 Gatherers를 최종화했다. JDK 25 API의 `Gatherers` 클래스는 Since 24로 표기한다. |

기준 버전 Java 25에서는 위 Gatherer API를 정식 API로 사용한다. 구체적인 변화는 해당 JEP와 Java SE API 문서에서 확인한다.

## 6. 실무 가이드

- **기본값:** 순차 스트림과 순수한 변환·집계를 먼저 선택한다. 코드가 짧다는 이유로 병렬 스트림을 기본값으로 두지 않는다.
- 한 입력을 여러 출력으로 펼칠 때는 `flatMap`을 쓴다.
- 키별 집계에는 `groupingBy(key, downstream)`을 써 목록 생성 후 재순회하는 비용을 줄인다. 두 갈래 분류는 `partitioningBy`, 임의 키→값 변환은 `toMap`을 택한다.
- 중복 키가 가능한 `toMap`에는 업무 규칙을 드러내는 merge 함수를 지정한다.
- 숫자 계산은 `mapToInt`·`mapToLong`·`mapToDouble`과 원시 스트림 연산으로 이어 박싱을 줄인다.
- 첫 결과만 필요하면 `findFirst`·`findAny`·`anyMatch` 등 단락 연산을 쓴다. 순서가 무관하면 `findAny`가 병렬 처리에 더 자유롭다.
- 윈도·증분 변환은 Java 24+ `Gatherer`를 검토한다. 사용자 구현은 상태와 순서, combiner 의미를 검증한다.
- 병렬 스트림은 충분한 CPU 작업, 분할 가능한 소스, 비블로킹 동작, 올바른 결합이 모두 맞을 때 실제 부하로 측정한다.
- for문과 stream 성능은 작업량·자료형·JIT·할당·결합 비용에 달렸다. 핫 패스에서 같은 계산을 비교해 JMH와 프로파일링으로 정한다. 임의의 `nanoTime` 반복은 근거가 아니다.

| 상황 | 시작점 | 이유 |
|---|---|---|
| 필터·변환·집계를 직선적으로 연결 | 순차 stream | 데이터 흐름이 드러나고 중간 임시 컬렉션을 줄이기 쉽다. |
| 복잡한 `break`/`continue`, 여러 상태 갱신 | for문 | 제어 흐름과 변경 시점을 직접 읽기 쉽다. |
| 충분히 크고 독립적인 CPU 작업 | 병렬 stream 후보 | 분할·결합 비용을 감당할 만큼 원소당 작업이 있어야 한다. |
| 네트워크·DB 등 블로킹 작업 | 한도 있는 실행 모델 | 공용 ForkJoinPool을 점유하지 않도록 동시성을 통제한다. |

stream이 for문보다 항상 빠르다는 규칙은 없다. 두 방식의 입력, 결과, 예외·순서 의미를 같게 맞춘 뒤 워밍업과 반복을 포함한 JMH 측정 및 운영 프로파일을 기준으로 고른다.

## 7. 함정·안티패턴

1. **스트림 재사용** — 두 번째 최종 연산이 예외를 내거나 구현별 오동작 위험 → 한 파이프라인은 한 번만 소비한다 → 다시 필요하면 `list.stream()`을 새로 호출하거나 `Supplier<Stream<T>>`를 둔다.
2. **`peek`로 업무 처리** — `count()` 최적화 등으로 콜백이 실행되지 않아 상태 갱신·로그가 빠짐 → 중간 단계 부수 효과를 보장으로 착각 → 업무 부수 효과는 명시적인 최종 연산이나 별도 루프로 처리하고 `peek`는 진단용으로 제한한다.
3. **중복 키를 고려하지 않은 `toMap`** — 중복이 유입되는 순간 `IllegalStateException` → 데이터가 유일 키라고 가정했지만 현실은 중복 → 병합 함수로 정책을 정의하고, 중복 금지가 규칙이면 입력 검증과 오류 메시지를 추가한다.
4. **변경 가능한 누적 객체를 `reduce`로 공유** — 순차에서는 되는 듯해도 병렬 분할 간 공유·결합이 잘못돼 데이터 손상 또는 중복이 발생 → 가변 축적과 값 축약 혼동 → `collect`와 Collector의 supplier/accumulator/combiner를 사용한다.
5. **I/O를 병렬 스트림에 넣기** — 외부 호출이 공용 ForkJoinPool 워커를 막고 무관한 작업까지 지연 → Fork/Join은 블로킹 보장이 없다 → I/O 동시성 한도를 가진 전용 실행기, 비동기 클라이언트 또는 가상 스레드 기반 작업 모델을 택한다.
6. **병렬 `forEach`에서 순서 가정** — 로그·파일·응답이 입력 순서와 다르게 나오거나 공유 상태가 경합 → 병렬 `forEach`의 실행 순서는 보장되지 않음 → 결과 순서가 계약이면 `forEachOrdered` 또는 순차 흐름을 사용한다.
7. **병렬 누산에서 비결합 연산 사용** — 실행마다 합계/결과가 달라짐 → 분할별 계산 후 결합 순서는 고정이 아님 → `+` 같은 결합 가능한 누산을 사용하고 부동소수점 결과도 순서에 따른 미세 차이가 허용되는지 검토한다.
8. **무한 소스 앞에 전체 정렬** — `findFirst()`조차 끝나지 않음 → `sorted`가 전체 입력을 알아야 첫 결과를 정할 수 있음 → 유한성·정렬 필요를 먼저 확인하고, 입력 경계나 단락 가능한 연산을 앞에 둔다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 컬렉션과 스트림의 핵심 차이는?

컬렉션은 원소를 저장하고 조회하는 데이터 구조다. 스트림은 원소를 저장하지 않고 소스에서 값을 흘려보내며 계산 단계를 연결한다. 스트림은 한 번만 소비하지만, 컬렉션은 새 스트림을 만들어 여러 번 처리할 수 있다.

**꼬리질문:** `list.stream().map(...);`만 호출하면 변환되나?

아니다. `map`은 중간 연산이므로 최종 연산이 시작돼야 값이 요청된다.

### Q2. 중간 연산은 모두 한 원소씩 바로 흘려보내나?

아니다. `filter`와 `map`은 대체로 stateless라 한 원소씩 연결 처리할 수 있다. `sorted`나 `distinct` 같은 stateful 연산은 전역 정보를 위해 원소를 저장하거나 상태를 유지할 수 있다. 따라서 모든 파이프라인이 일정한 메모리와 지연 시간이라고 단정하면 안 된다.

**꼬리질문:** 무한 스트림에 `sorted().limit(10)`을 적용하면?

정렬하려면 끝을 알아야 하므로 무한 입력에서는 결과를 내기 전에 끝나지 않는다.

### Q3. `findFirst()`와 `findAny()` 차이와 선택 기준은?

`findFirst`는 encounter order가 있을 때 첫 원소를 보장한다. `findAny`는 어느 원소든 허용해 순서 제약을 덜어 주므로 병렬 처리에서 유리할 수 있다. 결과가 사용자에게 순서 의미를 가지면 `findFirst`를 택한다.

**꼬리질문:** 둘 다 최종 연산인가?

그렇다. 둘 다 `Optional` 결과를 내며 필요한 값이 발견되면 입력 처리를 끝낼 수 있는 short-circuit 연산이다.

### Q4. mutable reduction은 왜 `reduce`보다 `collect`에 맞나?

`reduce`는 부분 결과를 값으로 결합하는 연산이다. `collect`는 각 부분 작업에 컨테이너를 제공하고 요소를 누적한 뒤 컨테이너를 결합하도록 설계됐다. 공유 `ArrayList`를 `reduce`에서 수정하면 병렬 분할 시 안전한 격리와 결합을 잃는다.

**꼬리질문:** 병렬 `collect`가 항상 하나의 동시성 컨테이너를 공유하나?

아니다. Collector의 특성과 구현에 따라 부분 컨테이너를 따로 만들고 병합할 수 있다. `CONCURRENT` 계약 없이 동시 갱신을 가정하면 안 된다.

### Q5. `groupingBy` 대신 `toMap`을 택할 때 확인할 점은?

`toMap`은 결과가 키당 값 하나인 사상이고 기본 오버로드는 중복 키를 병합하지 않는다. 중복 가능성이 있으면 merge 함수를 넣어 업무 규칙을 정의한다. 그룹 원소 전체나 downstream 집계가 목적이면 `groupingBy`가 더 정확하다.

**꼬리질문:** merge 함수는 병렬에서도 아무 방식이나 써도 되나?

아니다. 결합 순서가 달라도 같은 의미를 내도록 연산을 설계해야 한다. “마지막 값” 같은 순서 의존 규칙은 병렬 스트림에서 의도한 값과 다를 수 있다.

### Q6. 병렬 스트림이 빨라지는 조건은?

큰 데이터, 균형 있게 분할 가능한 소스, 충분히 큰 CPU 작업, 병렬로 안전하고 결합 가능한 계산이 함께 있어야 이득을 기대할 수 있다. 작은 작업은 분할·스케줄링·병합 비용이 더 크다. 실제 데이터와 부하에서 순차 처리와 비교해야 한다.

**꼬리질문:** 외부 API 요청 목록을 병렬 스트림으로 호출하면 좋은가?

대개 기본 선택으로는 부적절하다. 블로킹 요청이 공용 ForkJoinPool을 점유할 수 있고 외부 시스템의 허용 동시성을 제어하기 어렵다. 명시적인 동시성 한도와 I/O에 맞는 실행 모델을 사용한다.

### Q7. `mapToInt`가 `map(x -> x.getCount())`보다 나을 수 있는 이유는?

`mapToInt`는 `IntStream`으로 전환해 기본형 int 값을 전달한다. `map`은 보통 `Stream<Integer>`처럼 박싱된 객체 스트림을 만든다. 수치 집계에서는 특화 스트림의 `sum`·`average`·`summaryStatistics`로 객체 변환을 줄일 수 있다.

**꼬리질문:** 성능이 항상 더 빠른가?

항상은 아니다. 작업량과 최적화 결과가 다르므로 핫 패스에서 동등한 계산을 벤치마크하고 프로파일링한다.

### Q8. Gatherer는 Collector와 무엇이 다른가?

Gatherer는 `gather`로 연결하는 중간 연산이며 입력을 다른 출력 흐름으로 바꾼다. Collector는 `collect`에서 파이프라인을 종료하며 모든 원소를 최종 결과로 모은다. 윈도·증분 변환은 Gatherer, 그룹별 맵·목록·합계는 Collector가 자연스럽다.

**꼬리질문:** 사용자 정의 Gatherer를 병렬로 쓰려면?

각 분할 상태의 결합 함수가 필요하고, 결합 결과가 순차 처리와 같은 의미를 보장해야 한다. 결합법칙을 정의할 수 없거나 encounter order가 핵심이면 순차 Gatherer로 제한한다.

## 9. 참고문헌

- JEP 107: Bulk Data Operations for Collections — https://openjdk.org/jeps/107 — Java 8의 순차·병렬 대량 연산 도입 목표와 범위.
- Package `java.util.stream` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html — 스트림의 비저장성·지연성·1회 소비와 파이프라인 개념.
- `Stream<T>` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Stream.html — 순차/병렬 aggregate, 파이프라인과 부수 효과 최적화 유의점.
- `Collectors` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Collectors.html — `groupingBy`, `partitioningBy` 등 표준 수집기.
- `ForkJoinPool` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/ForkJoinPool.html — work-stealing, 공용 풀 및 블로킹 한계.
- JEP 461: Stream Gatherers (Preview) — https://openjdk.org/jeps/461 — Java 22 Gatherers 프리뷰 목적과 배경.
- JEP 473: Stream Gatherers (Second Preview) — https://openjdk.org/jeps/473 — Java 23 두 번째 프리뷰 이력.
- JEP 485: Stream Gatherers — https://openjdk.org/jeps/485 — Java 24 최종화 및 사용자 정의 중간 연산의 설계 목적.
- `Gatherer<T,A,R>` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Gatherer.html — 초기화·통합·결합·마무리 계약과 병렬화 조건.
- `Gatherers` (Java SE 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Gatherers.html — 표준 윈도·스캔·fold·동시 매핑 연산과 창 의미.
Gatherer는 사용자 정의 중간 연산을 만드는 Java 24 API다. `gather`에 연결해 윈도·연속 중복 제거·누적 스캔을 표현한다. Collector가 파이프라인을 끝내는 최종 연산인 것과 다르다.
