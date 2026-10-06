# J07. 컬렉션 프레임워크 내부

> 컬렉션은 필요한 연산과 순서 계약을 기준으로 선택한다.
> 배열·해시의 용량 정책은 구현 세부이며 공개 계약과 다를 수 있다.
> 불변성·정렬·fail-fast의 범위를 구분한다.

## 1. 왜 알아야 하나

키의 `hashCode()` 대상 필드를 삽입 뒤 바꾸면 객체는 이전 버킷에 남아 조회가 실패한다.

대량 목록에서 `LinkedList.get(i)`를 반복하면 매번 리스트를 훑는다. 반대로 `ArrayList` 중간 삽입은 뒤 요소를 밀어야 한다. 이름이 아니라 실제 접근 경로로 골라야 한다.

`Collections.unmodifiableList(list)`는 복사본이 아니므로 원본 변경이 뷰에 보인다. LRU용 `LinkedHashMap`에서 `get()`은 순서를 바꿔 순회 중 `ConcurrentModificationException`을 일으킬 수도 있다.

## 2. 핵심 개념

Java 컬렉션은 인터페이스가 “어떤 연산 의미를 보장하는가”를 말하고, 구현 클래스가 “어떤 표현과 비용으로 이를 제공하는가”를 정한다. `Map`은 키와 값의 매핑이므로 `Collection`의 하위 타입이 아니다.

| 인터페이스 | 의미 | 대표 구현 | 선택 기준 |
|---|---|---|---|
| `List<E>` | 위치 순서와 중복 허용 | `ArrayList`, `LinkedList` | 인덱스·순회가 많으면 `ArrayList` |
| `Set<E>` | 중복 원소 없음 | `HashSet`, `LinkedHashSet`, `TreeSet` | 해시, 삽입 순서, 정렬 순서 중 필요한 계약 선택 |
| `Map<K,V>` | 키별 매핑, 키 중복 없음 | `HashMap`, `LinkedHashMap`, `TreeMap` | 빠른 조회, 순서 또는 정렬·범위 조회 중 선택 |
| `Queue<E>` | 처리할 원소를 대기열로 다룸 | `ArrayDeque`, `LinkedList` 등 | 실패 시 반환값/예외를 정함 |
| `Deque<E>` | 양 끝 삽입·삭제 | `ArrayDeque`, `LinkedList` | 스택·양방향 큐 연산 |
| `SequencedCollection<E>` | 정의된 encounter order와 양 끝 연산 | `List`, `Deque`, `LinkedHashSet` 등 | 첫/마지막 원소와 역순 뷰를 공통 API로 표현 |

```text
Iterable
└─ Collection
   ├─ List ───────── ArrayList / LinkedList
   ├─ Set ────────── HashSet / LinkedHashSet / SortedSet ─ TreeSet
   └─ Queue ──────── Deque ─ ArrayDeque / LinkedList
Map (Collection 바깥) ─ HashMap / LinkedHashMap / SortedMap ─ TreeMap
```

| 헷갈리는 쌍 | 차이 |
|---|---|
| encounter order vs 정렬 순서 | encounter order는 반복 순서 계약이다. 삽입 순서(`LinkedHashMap`)나 comparator 순서(`TreeMap`)일 수 있다. `HashMap`은 순서를 보장하지 않는다. |
| `Queue` 예외 vs 특수값 메서드 | `add/remove/element`는 예외, `offer/poll/peek`는 `false`/`null`로 실패·빈 상태를 표현한다. |
| unmodifiable view vs unmodifiable value | `unmodifiableList(x)`는 원본 변경을 비추는 뷰다. `List.of`·`List.copyOf`는 구조 변경 불가지만 원소 내부까지 동결하지 않는다. |
| fail-fast vs thread-safe | fail-fast는 외부 구조 변경을 찾는 최선 노력 진단이며 잠금·가시성은 제공하지 않는다. 동시성 컬렉션은 J11 참조. |

### 구현별 연산 비용의 기본형

| 구현 | 조회/접근 | 추가·삭제 | 순회·공간의 특징 |
|---|---|---|---|
| `ArrayList` | `get/set` O(1) | 끝 추가 amortized O(1), 중간 삽입·삭제 O(n) | 배열에 참조를 연속 배치, 재할당 때 복사 |
| `LinkedList` | 인덱스 `get/set` O(n) | 끝은 O(1), 인덱스를 먼저 찾는 삽입·삭제는 O(n); 이미 iterator 위치를 안다면 노드 조작 O(1) | 노드와 링크 유지, 순회는 O(n) |
| `HashMap` / `HashSet` | 평균 기대 O(1) | 평균 기대 O(1) | 해시 분포와 용량에 영향, `HashMap` 순회 O(capacity + size) |
| `LinkedHashMap` / `LinkedHashSet` | 평균 기대 O(1) | 평균 기대 O(1) | 해시 구조에 연결 순서용 링크 추가, 순회 O(size) |
| `TreeMap` / `TreeSet` | O(log n) | O(log n) | 정렬 순회 O(n), 범위 뷰 제공 |
| `ArrayDeque` | 양 끝 확인 O(1) | 양 끝 연산 amortized O(1) | 인덱스 조회용 List가 아님 |

해시 기반 O(1)은 해시가 잘 분산된다는 기대 복잡도다. `Queue` 인터페이스만으로 처리 순서나 비용은 정해지지 않는다.

## 3. 내부 동작·원리

### 3.1 `ArrayList`: 배열 공간을 미리 마련하고 복사를 드물게 한다

`ArrayList`는 크기 변경 가능한 `Object[]`와 원소 수 `size`를 관리한다. 끝 추가 공간이 있으면 바로 쓰고, 부족하면 더 큰 배열로 기존 참조를 복사한다. 확장 한 번은 O(n)이지만 반복 추가의 총 비용은 추가당 amortized O(1)이다.

OpenJDK 소스는 기존 용량의 절반(`oldCapacity >> 1`)을 preferred growth로 사용해 대략 1.5배 확장을 시도한다. 증가율은 구현 세부 사항이며 API는 상각 추가 비용만 보장한다. 큰 배치를 알고 있으면 `ensureCapacity`로 복사를 줄이되 과예약은 피한다.

인덱스 중간 삽입·삭제는 뒤쪽 참조를 이동시킨다. 연속 배열은 공간 지역성이 좋으므로 `LinkedList`의 링크 변경이 O(1)이라는 사실만으로 목록 작업이 더 빠르다고 할 수 없다.

### 3.2 `LinkedList`: 양방향 노드지만 인덱스는 공짜가 아니다

`LinkedList`는 원소와 이전·다음 링크를 가진 노드로 구성된다. 양 끝 `Deque` 연산은 링크만 바꾸지만 `get(i)`는 가까운 끝에서 출발해도 O(n)이다.

`listIterator(i)`도 먼저 i까지 찾는다. 위치를 이미 찾은 뒤 iterator로 추가·삭제하면 링크 갱신은 O(1)이므로, 순차 이동하며 여러 번 수정할 때만 이점이 있다. 일반 목록은 `ArrayList`, 큐 양끝 작업은 보통 배열 기반 `ArrayDeque`가 단순하다.

### 3.3 `HashMap`: 해시에서 버킷을 찾고, 동등성으로 키를 확인한다

OpenJDK `HashMap`의 삽입·조회 흐름은 다음과 같다.

```text
key.hashCode()
      │ 상위 비트를 하위 쪽으로 섞음 (h ^ (h >>> 16))
      ▼
index = (table.length - 1) & hash ──► bucket
                                      ├─ 첫 노드의 hash/key 비교
                                      ├─ 연결 노드를 따라 equals 비교
                                      └─ 트리 버킷이면 트리 탐색
```

테이블 길이가 2의 거듭제곱이면 `(length - 1) & hash`가 버킷 인덱스를 만든다. 마스크는 낮은 비트만 쓰므로 상위 비트를 섞어 충돌을 줄인다. 같은 버킷에서는 `==` 또는 `equals`로 키를 판정한다.

`put`은 빈 버킷에 노드를 놓거나 같은 키의 값을 교체한다. 충돌은 버킷 리스트 또는 트리에서 비교한다. `null` 키는 하나, null 값은 여러 개 가능하다. `equals`가 같은 키는 같은 해시를 내야 한다. 삽입 뒤 해시 필드를 바꾸면 엔트리가 새 버킷으로 옮겨가지 않아 조회가 실패한다.

기본 load factor는 0.75, 기본 초기 용량은 16이다. 임계값(대체로 용량 × load factor)을 넘으면 테이블을 두 배로 늘린다. 각 노드는 기존 인덱스에 남거나 `old index + old capacity`로 이동해 재분류가 단순하다. 확장은 드물지만 초기 용량을 과하게 잡으면 메모리와 O(capacity + size) 순회 비용이 커진다.

충돌 리스트가 임계 길이를 넘으면 조건에 따라 트리화한다. 현재 소스 상수는 `TREEIFY_THRESHOLD=8`, `MIN_TREEIFY_CAPACITY=64`다. 테이블이 작으면 트리화보다 확장을 택하고, 버킷이 작아지면 리스트로 되돌릴 수 있다. JEP 180의 목표는 고충돌에서 `Comparable` 키 탐색을 O(n)에서 O(log n)으로 완화하는 것이며, 임계값은 공개 계약이 아니다.

### 3.4 `LinkedHashMap`: 해시 조회에 별도의 순서 링크를 얹는다

`LinkedHashMap`은 버킷에 순서 링크도 둔다. 기본은 삽입 순서, `accessOrder=true`는 오래된 접근부터 최근 접근까지 유지한다. 접근 순서형에서 `get`은 반복 순서를 바꾸는 구조적 변경일 수 있다.

`removeEldestEntry`로 크기 초과 시 오래된 항목을 제거하면 작은 LRU를 만들 수 있다. 동시성·만료·분산 일관성은 별도 기능이며 이 맵은 thread-safe하지 않다.

### 3.5 `TreeMap`: 비교 순서를 레드블랙 트리로 유지한다

`TreeMap`은 자연 순서 또는 `Comparator` 순서로 키를 정렬한다. OpenJDK 구현은 레드블랙 트리로 높이를 O(log n)으로 유지하므로 조회·삽입·삭제가 O(log n)이다. `firstKey`, `lastKey`, `subMap` 등으로 경계와 범위를 조회한다.

정렬 맵은 `compare(a,b)==0`을 같은 키로 취급한다. 이 결과가 `equals`와 다르면 예상 밖 덮어쓰기가 생긴다. comparator 기준은 안정적이어야 하며 범위 뷰는 원본에 연결되어 있다.

### 3.6 iterator의 fail-fast: 버그 감지 장치이지 동기화가 아니다

`ArrayList` 같은 구현은 구조 변경 때 `modCount`를 올리고 iterator는 생성 시점 값을 `expectedModCount`로 기억한다. 반복 중 외부 추가·삭제로 값이 달라지면 다음 검사에서 `ConcurrentModificationException`을 던질 수 있다. iterator 자신의 `remove()`는 기대값도 갱신한다.

```text
iterator 생성: expectedModCount = collection.modCount
       │ next/remove 호출
       ├─ 값이 같음 → 계속
       └─ 값이 다름 → ConcurrentModificationException (best effort)
```

fail-fast는 best effort라 예외 발생을 보장하지 않는다. 동기화·가시성을 제공하지 않으며, 반복 중 구조 변경을 찾는 진단 편의다. 공유 상태는 별도 동기화나 동시성 컬렉션으로 다룬다.

## 4. 코드로 확인

### 예제 1: 읽기 전용 뷰와 복사본의 차이

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CollectionContractsDemo {
    public static void main(String[] args) {
        List<String> source = new ArrayList<>(List.of("alpha", "beta"));
        List<String> view = Collections.unmodifiableList(source);
        List<String> copy = List.copyOf(source);

        source.add("gamma");
        System.out.println("view=" + view);
        System.out.println("copy=" + copy);
        try {
            view.add("delta");
        } catch (UnsupportedOperationException ex) {
            System.out.println("view mutation=UnsupportedOperationException");
        }
        try {
            List.of("alpha", null);
        } catch (NullPointerException ex) {
            System.out.println("List.of(null)=NullPointerException");
        }
    }
}
```

JDK 21 실제 출력:

```text
view=[alpha, beta, gamma]
copy=[alpha, beta]
view mutation=UnsupportedOperationException
List.of(null)=NullPointerException
```

`List.of`와 `List.copyOf`는 구조 변경 불가이며 null 원소를 받지 않는다. 이를 “원소 객체까지 재귀적으로 불변”이라고 확장하면 안 된다. 원소가 mutable이면 원소 내부 상태는 그대로 바뀔 수 있다.

### 예제 2: `LinkedHashMap`으로 만드는 크기 제한 LRU

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LruCacheDemo {
    private static final class LruCache<K, V> extends LinkedHashMap<K, V> {
        private final int maxEntries;

        LruCache(int maxEntries) {
            super(16, 0.75f, true);
            this.maxEntries = maxEntries;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxEntries;
        }
    }

    public static void main(String[] args) {
        LruCache<Integer, String> cache = new LruCache<>(3);
        cache.put(1, "one");
        cache.put(2, "two");
        cache.put(3, "three");
        cache.get(1);
        cache.put(4, "four");
        System.out.println("LRU→MRU=" + cache.keySet());
        System.out.println("contains 2=" + cache.containsKey(2));
    }
}
```

JDK 21 실제 출력:

```text
LRU→MRU=[3, 1, 4]
contains 2=false
```

`get(1)` 후 1이 가장 최근 항목이 되고, 4를 넣을 때 가장 오래된 2가 제거된다. production 캐시라면 동시성, 만료와 적중률 계측까지 별도로 설계한다.

### 예제 3: Sequenced Collections와 정렬 범위

```java
import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;

public class SequencedAndSortedDemo {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>(List.of("Ada", "Bjarne", "James"));
        System.out.println("ends=" + names.getFirst() + "/" + names.getLast());
        System.out.println("reverse view=" + names.reversed());
        names.addFirst("Barbara");
        System.out.println("after addFirst=" + names);

        TreeMap<Integer, String> ordered = new TreeMap<>();
        ordered.put(3, "c");
        ordered.put(1, "a");
        ordered.put(2, "b");
        System.out.println("sorted=" + ordered);
        System.out.println("range[2,4)=" + ordered.subMap(2, true, 4, false));
    }
}
```

JDK 21 실제 출력:

```text
ends=Ada/James
reverse view=[James, Bjarne, Ada]
after addFirst=[Barbara, Ada, Bjarne, James]
sorted={1=a, 2=b, 3=c}
range[2,4)={2=b, 3=c}
```

`reversed()`는 역순 복사본이 아니라 반대 encounter order를 제공하는 뷰다. Java 21에서 정식화된 API이며 Java 25에서도 사용할 수 있다.

### 예제 4: 충돌 키와 `TreeMap` 순서

```java
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

public class HashCollisionDemo {
    private record Key(int id) {
        @Override
        public int hashCode() {
            return 7;
        }
    }

    public static void main(String[] args) {
        Map<Key, String> collisions = new HashMap<>(64);
        for (int i = 0; i < 12; i++) {
            collisions.put(new Key(i), "v" + i);
        }
        System.out.println("collision size=" + collisions.size());
        System.out.println("equal key lookup=" + collisions.get(new Key(7)));

        TreeMap<Integer, String> sorted = new TreeMap<>();
        sorted.put(30, "thirty");
        sorted.put(10, "ten");
        sorted.put(20, "twenty");
        System.out.println("TreeMap first=" + sorted.firstEntry());
        System.out.println("TreeMap keys=" + sorted.keySet());
    }
}
```

JDK 21 실제 출력:

```text
collision size=12
equal key lookup=v7
TreeMap first=10=ten
TreeMap keys=[10, 20, 30]
```

모든 키가 같은 해시를 반환해도 `equals`가 식별하는 키별 매핑은 유지된다. 테스트 출력만으로 내부 버킷이 트리화됐다고 단정할 수는 없다. 그 임계값과 표현은 공개 계약이 아니며, 런타임 검증이 필요하면 구현별 계측 또는 소스 분석을 해야 한다.

## 5. 버전별 변화 — 왜 바뀌었나

| 버전 | 변화와 이전 한계 | 근거 |
|---|---|---|
| Java 8 | `HashMap`·`LinkedHashMap`의 충돌 버킷을 연결 리스트에서 균형 트리로 바꿀 수 있게 했다. 기존 리스트 버킷은 동일 버킷 충돌이 많으면 조회가 O(n)이어서 고충돌 입력에 취약했다. JEP 180은 `Comparable` 키가 있는 고충돌 상황에서 O(log n)을 목표로 했다. | [JEP 180](https://openjdk.org/jeps/180) |
| Java 9 | `List.of`, `Set.of`, `Map.of` 등 정적 팩터리로 작고 수정 불가능한 컬렉션을 한 식으로 만들었다. 이전에는 빈 가변 컬렉션을 만들고 채운 뒤 unmodifiable wrapper로 감싸는 반복 코드가 필요했다. | [JEP 269](https://openjdk.org/jeps/269) |
| Java 21 | `SequencedCollection`, `SequencedSet`, `SequencedMap`과 처음·마지막·역순 API를 추가했다. 순서가 있는 타입이 `List`, `Deque`, `LinkedHashSet`처럼 여러 갈래에 분산되어 첫/마지막 접근과 역순 순회가 일관되지 않았던 문제를 줄였다. | [JEP 431](https://openjdk.org/jeps/431) |
| Java 25 기준 | 본 문서는 Java SE 25 API 계약을 기준으로 삼는다. 위의 공개 동작을 대체하는 별도 컬렉션 프레임워크 변화는 여기서 추가로 주장하지 않는다. ArrayList의 증가 배수, HashMap의 버킷 임계값은 API 보장이 아니라 구현 세부 사항이다. | [Java SE 25 API](https://docs.oracle.com/en/java/javase/25/docs/api/index.html) |

## 6. 실무 가이드

**기본값 추천:** 순차 목록은 `ArrayList`, 일반 키-값 조회는 `HashMap`, FIFO 큐·스택은 `ArrayDeque`를 먼저 선택한다. 특별한 정렬·삽입 순서·삭제 패턴이 요구될 때만 다른 구현을 택한다.

- if 인덱스 조회·순회가 많으면 then `ArrayList`를 쓴다. `get/set`이 O(1)이다.
- if 예상 크기를 알면 then `ArrayList` 초기 용량이나 `ensureCapacity`로 확장을 줄인다. 과예약은 피한다.
- if 큐·스택 양끝 연산이면 then `ArrayDeque`를 우선 쓴다. 앞쪽 List 삽입은 O(n)이다.
- if iterator로 순차 이동하며 같은 위치 주변을 자주 편집하면 then `LinkedList`를 검토한다. 반복 인덱스 탐색은 이점을 없앤다.
- if 순서 없는 빠른 키 조회면 then `HashMap`/`HashSet`을 쓴다. 반복 순서에 기대지 않는다.
- if 삽입 순서를 보존해야 하면 then `LinkedHashMap`/`LinkedHashSet`을 쓴다.
- if 작은 LRU가 필요하면 then access-order `LinkedHashMap`과 `removeEldestEntry`를 쓴다. 동시성·TTL은 별도 설계한다.
- if 정렬·경계·범위 조회가 필요하면 then `TreeMap`/`TreeSet`을 쓴다. comparator 안정성과 `equals` 정합성을 확인한다.
- if 입력의 이후 구조 변경을 차단하면 then `List.copyOf(input)`을 쓴다. 원본 연동 뷰가 목적일 때만 `unmodifiableList`를 쓴다.
- if `List`보다 넓은 encounter order 타입이면 then Java 21+ `SequencedCollection`을 쓴다.
- if 반복 중 제거해야 하면 then iterator의 `remove()`를 쓴다. CME를 제어 흐름으로 쓰지 않는다.

## 7. 함정·안티패턴

1. **키 필드를 삽입 후 수정** — 조회 실패 → 해시가 바뀌어도 기존 엔트리는 이동하지 않음 → 키는 불변으로 둔다.
2. **`LinkedList` 인덱스 루프** — 대형 목록이 느려짐 → 각 `get(i)`가 O(n), 전체 O(n²) → iterator 순회 또는 `ArrayList`를 쓴다.
3. **`unmodifiableList`를 복사본으로 오해** — 외부 변경이 보임 → wrapper는 원본을 비추는 뷰 → 방어 복사는 `List.copyOf`로 한다.
4. **`HashMap` 순서에 의존** — 출력·테스트 순서가 바뀜 → 순서는 API 계약이 아님 → 필요하면 `LinkedHashMap`/`TreeMap`을 명시한다.
5. **반복 중 외부 구조 변경** — CME 또는 경합 오류 → iterator가 변경을 감지할 수 있음 → iterator 변경 API나 별도 동기화를 쓴다.
6. **`TREEIFY_THRESHOLD`에 의존** — JDK 구현 변화에 취약 → 임계값은 공개 계약이 아님 → 프로파일 근거 없이 튜닝하지 않는다.
7. **`TreeMap` comparator가 다른 키를 0으로 비교** — 한 매핑으로 덮임 → comparator 결과가 키 동일성을 정함 → `equals`와 정합성을 맞춘다.
8. **초기 용량 과다 지정** — 공간·순회 비용 증가 → 순회 비용은 용량에도 영향 → 실제 예상 크기에 맞춘다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `ArrayList` 끝 추가가 왜 O(1)인가?

매번 O(1)이 아니라 amortized O(1)이다. 꽉 찬 배열의 추가는 O(n) 복사지만 확장 간격이 커져 n회 추가 총비용은 O(n)이다.

**꼬리질문: 증가율을 1.5배로 고정해도 되는가?** 아니다. OpenJDK 구현일 뿐 API는 상각 비용만 보장한다.

### Q2. `LinkedList`의 중간 삽입이 O(1)이라면 왜 기본 리스트로 잘 안 쓰나?

O(1)은 위치를 찾은 뒤 링크를 바꾸는 비용이다. `get(i)`와 `listIterator(i)`는 먼저 O(n) 탐색을 하므로, 인덱스 조회·순회에는 대개 `ArrayList`가 적합하다.

**꼬리질문: 언제 이득인가?** iterator가 위치를 이미 찾은 뒤 주변을 반복 편집할 때다.

### Q3. `HashMap`에서 `hashCode`가 같으면 키가 같은가?

아니다. 해시는 버킷을 정하고 같은 버킷에서는 `equals`로 키를 구별한다. 서로 다른 키의 충돌은 정상이며 분산이 좋을수록 평균 조회가 빠르다.

**꼬리질문: 가변 키는 왜 위험한가?** 엔트리는 이전 버킷에 남고 조회는 새 해시를 찾는다.

### Q4. `HashMap` 확장 때 왜 모든 키를 다시 `% newCapacity` 하지 않는가?

2배 확장에서는 항목이 원래 인덱스 또는 `old index + oldCapacity`로 이동한다. 새 용량에서 추가된 한 비트로 나누므로 전체를 처음부터 재해시하지 않아도 된다.

**꼬리질문: 크게 잡으면 좋은가?** 아니다. 공간과 순회 비용도 커진다.

### Q5. `Collections.unmodifiableList(x)`와 `List.copyOf(x)` 중 방어 복사에 맞는 것은?

원본 변경을 차단하려면 `List.copyOf`를 쓴다. wrapper는 원본 변화를 비춘다. 두 방식 모두 원소 내부의 가변성은 막지 않는다.

**꼬리질문: `List.of`에 null을 넣으면?** `NullPointerException`이다.

### Q6. fail-fast iterator가 동시성 안전을 보장하는가?

아니다. CME는 최선 노력 진단이며 감지가 누락될 수 있다. 락이나 가시성도 제공하지 않는다.

**꼬리질문: 순회 중 제거는?** 해당 iterator의 `remove()`를 쓴다.

### Q7. `TreeMap`과 `LinkedHashMap`은 둘 다 순서가 있는데 언제 각각 쓰나?

`LinkedHashMap`은 삽입 또는 접근 순서를 보존하고 해시로 탐색한다. `TreeMap`은 comparator 정렬과 O(log n) 탐색을 제공한다. 범위·최솟값이면 `TreeMap`, 삽입·접근 순서면 `LinkedHashMap`을 고른다.

**꼬리질문: `compare(a,b)==0`이나 `equals`는 false면?** 같은 키처럼 취급되므로 comparator를 도메인 동등성에 맞춘다.

다른 컬렉션 주제: 동시성 컬렉션은 → J11 참조.

## 9. 참고문헌

- JEP 431: Sequenced Collections — https://openjdk.org/jeps/431 — encounter order 공통 API.
- OpenJDK `HashMap.java` — https://raw.githubusercontent.com/openjdk/jdk/master/src/java.base/share/classes/java/util/HashMap.java — 해시·resize·treeify 구현.
- OpenJDK `ArrayList.java` — https://raw.githubusercontent.com/openjdk/jdk/master/src/java.base/share/classes/java/util/ArrayList.java — 용량 확장과 상각 비용.
- Java SE 25 `LinkedList` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedList.html — List/Deque API.
- Java SE 25 `HashMap` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html — 해시 맵 계약.
- Java SE 25 `Collections` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Collections.html — unmodifiable view.
- Java SE 25 `List` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/List.html — 팩터리 목록 계약.
- Java SE 25 `LinkedHashMap` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedHashMap.html — 순서와 LRU.
- Java SE 25 `TreeMap` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeMap.html — 정렬·범위 API.
- Java SE 25 `SequencedCollection` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/SequencedCollection.html — 양 끝·역순 API.
- JEP 180: Handle Frequent HashMap Collisions with Balanced Trees — https://openjdk.org/jeps/180 — 충돌 성능 목표.
- JEP 269: Convenience Factory Methods for Collections — https://openjdk.org/jeps/269 — 불변 팩터리 도입.
