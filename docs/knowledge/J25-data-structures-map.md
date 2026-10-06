# J25. 자료구조 개념 지도 — 배열·연결 리스트·스택·큐·힙·해시·트리·그래프

> 3줄 요약 — 자료구조는 데이터를 담는 모양이며, 모양이 달라지면 접근·삽입·삭제·정렬 비용도 달라진다.
> 기본 선택은 순차 접근과 끝 추가가 많으면 `ArrayList`, 양끝 작업이면 `ArrayDeque`, 키 조회면 `HashMap`/`HashSet`이다.
> 순서·우선순위·관계 탐색이 요구되면 각각 트리·힙·그래프를 택하고, 평균 비용과 최악 조건 및 메모리 배치까지 함께 본다.

## 1. 왜 알아야 하나

요청마다 최근 이벤트를 `LinkedList` 인덱스로 찾으면 O(n) 노드 탐색이 든다. 대기열을 `ArrayList` 0번에서 반복 삭제해도 나머지를 당기느라 O(n)씩 든다. “리스트니까 편하다”는 이유로 고르면 처리량이 떨어진다.

또 해시 기반 중복 제거를 기대하면서 가변 객체를 `HashSet`에 넣은 뒤 `equals()`에 쓰이는 필드를 바꾸면, 객체가 들어 있던 버킷과 새 해시가 가리키는 버킷이 달라져 `contains()`가 실패할 수 있다. `PriorityQueue`를 정렬된 리스트처럼 순회하다가 우선순위가 뒤섞인 결과를 반환하는 버그도 흔하다. 컬렉션의 이름보다 계약과 연산 비용을 봐야 한다.

자료구조는 저장 형식과 연산을 묶은 추상화다. Collections Framework는 공통 인터페이스, 교체 가능한 구현, 재사용 알고리즘을 제공한다.[1] 같은 `Queue`라도 덱·연결 리스트·동시성 큐는 메모리와 동시성 특성이 다르다. 최대 크기, 분포, 정렬, 스레드 접근도 선택 기준이다.

## 2. 핵심 개념

| 용어 | 뜻 | 판단할 점 |
|---|---|---|
| 자료구조 | 데이터를 배치하고 연산하는 규칙 | 빠르게 할 연산을 정한다 |
| 추상 자료형(ADT) | 값과 허용 연산의 계약 | 스택은 LIFO 계약, 구현은 배열일 수도 연결 구조일 수도 있다 |
| 시간복잡도 | 입력 n에 따른 연산 증가율 | O(1), O(log n), O(n)은 상수 접근, 단계 탐색, 전체 훑기다 |
| 공간복잡도 | 필요한 추가 저장 공간 | 포인터·버킷·여유 용량도 비용이다 |
| 순서 | 원소 관찰 기준 | 삽입 순서, 우선순위, 키 정렬, 미보장을 구분한다 |
| 상각 비용 | 여러 연산에 나눈 비용 상한 | 확장 순간 O(n)이어도 끝 추가는 O(1) 상각일 수 있다 |

**자료구조의 힙과 JVM 힙은 다른 말이다.** 힙(Heap)은 우선순위가 가장 높은 원소를 빠르게 꺼내도록 완전 이진 트리 형태로 구성하는 자료구조다. `PriorityQueue` 객체는 일반 Java 객체이므로 JVM 힙에 놓인다. JVM 힙은 객체와 배열이 할당되는 런타임 메모리 영역이다. 마찬가지로 스택 자료구조의 LIFO 규칙과 JVM 스택은 동일한 말이 아니다. JVM 스택은 스레드별 호출 프레임과 지역 변수·피연산자 스택 등을 담는 실행 영역이다.[11]

| 헷갈리는 쌍 | 구분 |
|---|---|
| 자료구조 스택 vs JVM 스택 메모리 | 전자는 마지막에 넣은 값을 먼저 꺼내는 ADT. 후자는 메서드 호출 프레임을 관리하는 런타임 영역. |
| 자료구조 힙 vs JVM 힙 메모리 | 전자는 우선순위 큐를 만들 수 있는 트리 규칙. 후자는 객체 할당 영역. |
| 큐 vs 우선순위 큐 | FIFO는 도착 순서대로 꺼낸다. 우선순위 큐는 비교 기준에서 가장 앞선 값부터 꺼낸다. |
| 배열 vs `ArrayList` | 배열은 고정 길이. `ArrayList`는 내부 배열 용량을 키우는 `List` 구현이다. |
| 리스트 vs 집합 | 리스트는 위치와 중복을 유지한다. `Set`은 중복을 허용하지 않는 포함 관계 중심 계약이다. |
| 해시 집합 vs 정렬 집합 | `HashSet`은 빠른 평균 멤버십 검사. `TreeSet`은 정렬 순서·범위 연산을 제공한다. |

### 연산 비용을 먼저 보는 총괄표

아래는 일반적인 구현의 대표 비용이다. `n`은 원소 수, `V`는 정점 수, `E`는 간선 수다. “평균”은 해시가 잘 분산되는 입력을 전제로 하고, 연결 리스트의 위치 비용은 노드를 이미 알고 있는지에 따라 달라진다.

| 구조 / Java 대응 | 조회·탐색 | 삽입 | 삭제 | 정렬 유지 | 공간·특성 |
|---|---:|---:|---:|---|---|
| 배열 / `T[]` | 인덱스 O(1), 검색 O(n) | 빈 칸 O(1), 중간 O(n) | 끝 O(1), 중간 O(n) | 없음 | 연속 슬롯, 고정 길이 |
| `ArrayList` | 인덱스 O(1), 검색 O(n) | 끝 O(1) 상각, 중간 O(n) | 끝 O(1), 중간 O(n) | 없음 | 참조 배열, 여유 용량 |
| `LinkedList` | 인덱스·값 O(n) | 노드/끝을 알면 O(1), 위치 찾기 포함 O(n) | 노드/끝을 알면 O(1), 인덱스 삭제 O(n) | 없음 | 노드 링크 오버헤드 |
| `ArrayDeque` | 양끝 O(1), 검색 O(n) | 양끝 O(1) 상각 | 양끝 O(1) 상각 | FIFO/LIFO | 원형 배열, null 불가, 비동기화 |
| `PriorityQueue` | 최솟값 O(1), 포함 O(n) | O(log n) | 최솟값 O(log n), 임의 O(n) | 순회 정렬 안 됨 | 배열 기반 최소 힙 |
| `HashMap`, `HashSet` | 평균 O(1) | 평균 O(1) | 평균 O(1) | 없음, 순서 미보장 | 버킷·엔트리, 용량/로드 팩터 |
| `TreeMap`, `TreeSet` | O(log n) | O(log n) | O(log n) | 키·원소 정렬 | 균형 트리, 범위·이웃 탐색 |
| 그래프 인접 리스트 | 간선 확인 O(deg(v)) | 평균 O(1) | O(deg(v)) | 없음 | O(V+E), 희소 그래프 |
| 그래프 인접 행렬 | 간선 확인 O(1) | O(1) | O(1) | 없음 | O(V²), 조밀 그래프 |

## 3. 내부 동작·원리

### 배열과 연결 리스트

```text
배열 / ArrayList 내부 참조 배열
index:   0       1       2       3
       [ref] -> [ref] -> [ref] -> [null]
        주소 계산으로 원하는 슬롯에 바로 접근

이중 연결 리스트
 head -> [prev | 값 | next] <-> [prev | 값 | next] <-> [prev | 값 | next] <- tail
         링크를 따라가며 찾고, 위치를 안 뒤 링크를 다시 연결
```

배열은 슬롯 번호로 위치를 계산해 인덱스 접근이 일정하다. 연속 슬롯을 훑으면 캐시 지역성이 좋다. Java 배열/`ArrayList`가 연속으로 담는 것은 대개 객체 참조이고 객체 자체는 따로 할당될 수 있다. `ArrayList`가 꽉 차면 새 배열에 참조를 복사한다. 확장 순간은 O(n)이지만 끝 추가는 O(1) 상각이며, 구체적인 증가 배율은 API 계약이 아니다.[5]

연결 리스트는 이전·다음 링크로 노드를 잇는다. 노드를 알고 있으면 주변 링크만 바꿔 삽입·삭제하지만 `get(i)`는 노드를 찾아 이동한다. 따라서 “중간 삽입 O(1)”은 위치 탐색을 뺀 비용이다. 인덱스 연산은 양 끝 중 가까운 곳에서 시작한다.[6] 노드 링크·객체 헤더와 분산 메모리 접근 때문에 작은 리스트에서도 `ArrayList`보다 유리하다고 단정할 수 없다.

### 스택, 큐, 덱

```text
스택 LIFO                 큐 FIFO                 덱 양끝 연산
push -> [top]             offer -> [front ... back] <- offer
pop  <- [below]           poll  <- front           pollFirst / pollLast
```

스택은 마지막 값을 먼저 꺼내므로 함수 중첩 호출, 괄호 검사, 되돌리기 기록에 맞는다. 여는 괄호를 `push`, 닫는 괄호에서 `pop`해 짝을 비교하면 O(n) 시간·최악 O(n) 공간이다. 자료구조 스택은 일반 컬렉션이고 JVM 호출 스택은 런타임 영역이다.

큐는 먼저 온 작업부터 내보내므로 작업 대기열과 이벤트 처리에 맞는다. 양끝 덱(`Deque`)은 스택·큐를 모두 표현한다. `ArrayDeque`의 기본 연산 대부분은 O(1) 상각이고 null을 받지 않는다. API는 `Stack`과 큐 용도의 `LinkedList`보다 빠를 가능성을 안내한다.[7] 동기화는 없으므로 다중 스레드 공유에는 용량·차단 정책이 있는 큐를 고른다.

### 힙과 우선순위 큐

힙은 마지막 층을 왼쪽부터 채운 완전 이진 트리다. 배열에서 자식은 `2i+1`, `2i+2`, 부모는 `(i-1)/2`다. 최소 힙은 부모가 자식보다 크지 않아 루트가 최솟값이다.

```text
          1                 배열 [1, 4, 3, 8, 6]
        /   \               부모 i의 자식: 2i+1, 2i+2
       4     3              새 값은 위로(sift-up), 루트 교체 후 아래로(sift-down)
      / \
     8   6
```

삽입은 끝에 둔 값을 부모와 비교하며 올리고, 제거는 루트를 마지막 값으로 바꿔 내려보낸다. 높이가 log₂n이므로 `offer`/`poll`은 O(log n), `peek`은 O(1)이다. 기본은 자연 순서상 **최솟값 우선**이며 비교자로 바꿀 수 있다. 동률과 반복자 순회는 정렬 순서가 아니다. 전체 정렬은 복사 후 정렬하거나 반복 `poll`한다.[3] 작업 우선순위·만료 예정 작업·상위 K개에 쓰며 정렬 목록과 구별한다.

### 해시 테이블과 집합

해시 테이블은 해시로 버킷을 정한다. 충돌은 정상이고 버킷 안에서 키를 다시 구별한다. 평균 조회 O(1)은 해시 분산이 좋고 `equals()` 비용이 적다는 가정이다. 같은 `hashCode()`가 몰리면 느려진다. `equals()`가 참인 두 키는 같은 해시를 가져야 하며 삽입 후 해시 필드를 바꾸지 않는다.

`HashMap`의 기본 로드 팩터는 0.75다. 크기가 용량×로드 팩터를 넘으면 재구성한다. 용량이 크면 순회는 용량+크기에 비례하며 순서는 보장되지 않는다.[4] `HashSet`은 요청 ID 중복 제거와 권한 포함 검사에 쓴다. 순서를 가정하지 않는다.

### 트리와 그래프

이진 트리 노드는 자식이 최대 둘이다. BST는 왼쪽 키 < 노드 < 오른쪽 키 규칙을 따른다. 정렬 입력으로 한쪽에 치우치면 탐색은 O(n), 균형 트리는 높이를 log n으로 유지한다. `TreeMap`은 Red-Black tree로 O(log n)을 보장하고 `TreeSet`은 `TreeMap` 기반으로 정렬한다.[8][9] 범위·이웃 키 검색에 맞는다. DB 인덱스 B-Tree는 → R05 참조.

그래프는 정점(vertex)과 간선(edge)의 관계다. 간선은 방향·가중치를 가질 수 있다. 서비스 의존성, 작업 선후행, 사용자 연결, 라우팅이 그래프 문제다.

```text
인접 리스트: Map<Integer, List<Integer>>
1 -> [2, 3]       1에서 나가는 이웃만 저장
2 -> [3]
3 -> []

인접 행렬:   1  2  3
          1 [0, 1, 1]
          2 [0, 0, 1]
          3 [0, 0, 0]
```

희소 그래프는 공간 O(V+E)인 인접 리스트가 유리하다. 간선 판정이 잦고 그래프가 작거나 조밀하면 O(V²) 행렬의 O(1) 판정이 나을 수 있다. 이웃 순회는 차수(degree)에 비례한다. 무방향 간선은 양쪽에 기록하고, 가중치는 `(neighbor, weight)`로 저장한다. 탐색 구현은 → J22 참조.

## 4. 코드로 확인

아래 예제는 JDK 21에서 실행했다. 배열부터 그래프 인접 리스트까지 각 구조의 핵심 동작을 한 파일에서 확인한다.

```java
import java.util.*;

public class DataStructuresMapDemo {
    public static void main(String[] args) {
        int[] array = {10, 20, 30};
        System.out.println("array index 1=" + array[1]);

        List<Integer> dynamicArray = new ArrayList<>(List.of(10, 20, 30));
        dynamicArray.add(1, 15);
        System.out.println("ArrayList=" + dynamicArray);

        LinkedList<String> linked = new LinkedList<>();
        linked.addFirst("middle");
        linked.addFirst("head");
        linked.addLast("tail");
        System.out.println("LinkedList=" + linked);

        Deque<String> stack = new ArrayDeque<>();
        stack.push("outer");
        stack.push("inner");
        System.out.println("stack pop=" + stack.pop() + ", next=" + stack.peek());

        Deque<String> queue = new ArrayDeque<>();
        queue.offer("request-1");
        queue.offer("request-2");
        System.out.println("queue poll=" + queue.poll() + ", next=" + queue.peek());

        PriorityQueue<Integer> jobs = new PriorityQueue<>();
        jobs.offer(5);
        jobs.offer(1);
        jobs.offer(3);
        System.out.println("heap poll=" + jobs.poll() + ", next=" + jobs.peek());

        Map<String, Integer> counts = new HashMap<>();
        counts.put("ok", 2);
        counts.merge("ok", 1, Integer::sum);
        Set<String> uniqueIds = new HashSet<>(List.of("u1", "u2", "u1"));
        System.out.println("HashMap ok=" + counts.get("ok") + ", unique=" + uniqueIds.size());

        TreeMap<Integer, String> ranking = new TreeMap<>();
        ranking.put(30, "C");
        ranking.put(10, "A");
        ranking.put(20, "B");
        TreeSet<Integer> sortedUnique = new TreeSet<>(List.of(30, 10, 20, 10));
        System.out.println("TreeMap keys=" + ranking.keySet() + ", ceiling(15)=" + ranking.ceilingKey(15));
        System.out.println("TreeSet=" + sortedUnique);

        Map<Integer, List<Integer>> graph = new HashMap<>();
        graph.put(1, new ArrayList<>(Arrays.asList(2, 3)));
        graph.put(2, new ArrayList<>(List.of(3)));
        graph.put(3, new ArrayList<>());
        System.out.println("graph neighbors(1)=" + graph.get(1));
    }
}
```

실제 출력:

```text
array index 1=20
ArrayList=[10, 15, 20, 30]
LinkedList=[head, middle, tail]
stack pop=inner, next=outer
queue poll=request-1, next=request-2
heap poll=1, next=3
HashMap ok=3, unique=2
TreeMap keys=[10, 20, 30], ceiling(15)=20
TreeSet=[10, 20, 30]
graph neighbors(1)=[2, 3]
```

LRU 캐시는 “키로 빠르게 찾기”와 “최근 사용 순서” 두 요구를 같이 가진다. `LinkedHashMap`의 access-order 옵션과 `removeEldestEntry`를 이용하면 최근 사용 순서를 갱신하고 용량 초과 시 가장 오래된 항목을 제거할 수 있다.[12] 아래는 용량 2에서 `profile:1`을 다시 읽은 뒤 세 번째 키를 넣어 `profile:2`가 빠지는 예다.

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LruCacheDemo {
    static final class LruCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;
        LruCache(int capacity) {
            super(capacity + 1, 0.75f, true);
            this.capacity = capacity;
        }
        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacity;
        }
    }
    public static void main(String[] args) {
        LruCache<String, String> cache = new LruCache<>(2);
        cache.put("profile:1", "A");
        cache.put("profile:2", "B");
        cache.get("profile:1");
        cache.put("profile:3", "C");
        System.out.println("keys oldest-to-newest=" + cache.keySet());
        System.out.println("profile:2 cached=" + cache.containsKey("profile:2"));
    }
}
```

```text
keys oldest-to-newest=[profile:1, profile:3]
profile:2 cached=false
```

## 5. 버전별 변화 — 왜 바뀌었나

- **Collections Framework의 공통 모델:** 구현마다 다른 자료형은 API 간 교환과 알고리즘 재사용을 어렵게 한다. Java는 공통 인터페이스·구현·알고리즘으로 컬렉션을 표현한다.[1]
- **JDK 1.5 — `PriorityQueue`:** FIFO만으로 우선순위 처리가 어려워 힙 기반 큐가 추가됐다(`Since: 1.5`).[3]
- **JDK 1.6 — `ArrayDeque`:** 배열 기반 `Deque`가 추가됐다. API는 `Stack`·큐 용도의 `LinkedList`보다 빠를 가능성을 안내한다.[7]
- **JDK 21 — JEP 431:** encounter order를 표현할 공통 타입이 없어 `SequencedCollection`, `SequencedSet`, `SequencedMap`과 first/last/reversed API가 추가됐다.[10]

## 6. 실무 가이드

- **기본값:** 일반 목록은 `ArrayList`. 인덱스 접근 O(1), 끝 추가 O(1) 상각이며 선형 연산 상수도 API상 `LinkedList`보다 낮다.[5]
- 인덱스 조회가 많으면 `ArrayList`; 중간 삽입은 위치 탐색까지 포함해 판단한다.
- 스택/단일 스레드 큐는 `ArrayDeque`가 기본이다. 양끝 연산 O(1) 상각이며 API가 `Stack` 용도로 권한다.[7]
- 최우선 작업은 `PriorityQueue`에 넣되 비교자를 명시하고 동률 순서를 기대하지 않는다. 전체 정렬이 필요하면 정렬 구조를 쓴다.
- ID 조회·중복 제거는 `HashMap`/`HashSet`; 출력 순서가 계약이면 별도 정렬 또는 순서 보장 구현을 쓴다.
- 키 정렬·범위·이웃 검색은 `TreeMap`/`TreeSet`으로 O(log n)을 선택한다.[8][9]
- 희소 그래프는 `Map<Integer, List<Integer>>`, 조밀하고 간선 판정이 잦으면 행렬을 고려한다.
- 다중 스레드 큐는 동시성 구현을 택하고 최대 크기 및 대기·거부 정책을 정한다.
- 큰 `HashMap` 사전 용량은 재해시를 줄이지만 메모리·순회 비용을 키운다. 예상 항목 수와 기본 로드 팩터 0.75를 고려한다.[4]

## 7. 함정·안티패턴

1. **증상:** `LinkedList.get(i)` 반복이 느리다 → **원인:** 매번 노드를 찾아 O(n²)에 가까워진다 → **대처:** 인덱스 순회는 `ArrayList`, 순차 순회는 반복자를 쓴다.
2. **증상:** 배열 기반 리스트의 0번 삭제가 대량 이벤트에서 비싸다 → **원인:** 뒤 원소를 앞으로 이동한다 → **대처:** 소비 대기열은 `ArrayDeque`/적절한 큐 구현으로 바꾼다.
3. **증상:** `PriorityQueue` 출력이 정렬되지 않는다 → **원인:** 힙은 최우선 원소만 루트로 보장하고 내부 배열 전체 정렬이나 반복자 순서는 보장하지 않는다 → **대처:** `poll()` 반복 또는 복사 후 정렬한다.[3]
4. **증상:** `HashMap`/`HashSet`에서 같은 ID가 두 개처럼 보이거나 조회가 실패한다 → **원인:** `equals`와 `hashCode` 계약 위반, 혹은 삽입 후 해시 필드를 변경했다 → **대처:** 키를 불변으로 만들고 두 메서드를 한 쌍으로 정의한다.
5. **증상:** `HashMap`을 순회할 때 API 응답 필드 순서가 바뀐다 → **원인:** 해시 맵은 순서를 약속하지 않는다 → **대처:** 정렬이 필요하면 `TreeMap`, 입력/접근 순서면 명시적으로 그 순서를 보장하는 구현을 사용한다.[4]
6. **증상:** 동시 요청에서 큐·맵이 일관되지 않거나 `ConcurrentModificationException`을 만난다 → **원인:** `ArrayDeque`, `HashMap`, `TreeMap` 등 일반 구현은 여러 스레드의 변경을 자동 직렬화하지 않는다 → **대처:** 소유 스레드를 제한하거나 concurrent 컬렉션/명시적 동기화를 선택한다. fail-fast 예외는 동기화 대체제가 아니다.[4][7][8]
7. **증상:** `TreeSet`이 서로 다른 객체 중 하나를 버린다 → **원인:** 비교 결과 0을 같은 원소로 취급하는데 `equals()`와 비교 결과가 일치하지 않는다 → **대처:** `Comparator`/`Comparable` 순서를 동등성 계약과 일치시킨다.[9]

## 8. 자가점검 Q&A (면접 대비)

### Q1. 목록의 기본 구현으로 왜 `ArrayList`를 고르는가?

인덱스 접근이 O(1)이고 끝 추가가 O(1) 상각이어서 흔한 조회·순회·끝 추가를 잘 처리한다. 내부 참조 슬롯이 연속되어 순회 지역성도 좋고 노드 링크 오버헤드가 없다. 앞/중간 삽입이 잦다면 그 이동 비용을 별도로 평가한다.

**꼬리질문:** `ArrayList` 끝 추가가 언제 O(n)인가? **답:** 내부 배열 용량을 넘어서 확장하며 기존 참조를 새 배열로 복사할 때다. 그래서 단일 확장은 O(n)이지만 여러 번의 추가에 나눈 상각 비용은 O(1)이다.

### Q2. 연결 리스트의 삽입은 정말 O(1)인가?

노드를 이미 알고 있을 때 링크 수정만 보면 O(1)이다. 인덱스로 삽입 위치를 찾는 과정은 O(n)이고 `LinkedList`는 인덱스 연산 때 양끝 중 가까운 곳에서 순회한다. 따라서 연산 전체 비용과 삽입 지점 보유 여부를 말해야 한다.

**꼬리질문:** 어떤 상황에서 연결 리스트가 맞을 수 있나? **답:** 이미 위치를 가리키는 반복자/노드가 있고 그 주변에서 잦은 삽입·삭제가 일어나는 작업이다. Java `LinkedList` 노드 비용과 캐시 지역성도 측정한다.

### Q3. 자료구조의 스택/힙과 JVM 스택/힙은 어떤 관계인가?

자료구조 스택은 LIFO 연산 규칙이고 힙은 우선순위 트리다. JVM 스택은 스레드별 메서드 호출 프레임, JVM 힙은 객체/배열 할당 런타임 영역이다. `PriorityQueue`는 힙 자료구조를 구현한 객체이며 JVM 힙에 할당될 수 있다.

**꼬리질문:** 지역 변수는 모두 JVM 스택에 저장되나? **답:** 사양은 프레임에 지역 변수 배열을 정의하지만 실제 물리 배치와 최적화는 구현 세부다. 여기서 자료구조 스택을 곧바로 물리 메모리 배치와 동일시하면 안 된다.[11]

### Q4. `PriorityQueue`의 반복자 결과는 왜 정렬 순서가 아닌가?

힙 불변식은 부모와 자식 사이의 우선순위 관계만 지킨다. 배열 내부 전체를 정렬하지 않아 루트 외의 원소 간 전순서를 보장할 필요가 없다. 반복자 순회는 임의 순서이고 가장 작은 값부터 받으려면 `poll()`한다.[3]

**꼬리질문:** 모든 항목을 매번 정렬 출력해야 한다면? **답:** 매번 큐를 소진하거나 복사 후 정렬해야 한다. 정렬 상태를 계속 유지하며 범위 조회도 필요하면 `TreeMap`/`TreeSet`이 후보지만 삽입 비용은 O(log n)이다.

### Q5. 해시 조회 O(1)을 무조건 말할 수 없는 이유는?

해시 값이 버킷에 잘 분산되고 키의 `hashCode`/`equals`가 적절해야 평균 O(1)이다. 충돌이 한 곳에 몰리면 비교가 늘어 느려질 수 있다. 반복 순회는 `HashMap`의 용량과 크기 모두에 영향을 받는다.[4]

**꼬리질문:** 같은 `hashCode()`를 반환하는 서로 다른 키는 저장할 수 있나? **답:** `equals()`가 서로 다르면 별도 키로 저장 가능하다. 다만 한 버킷 충돌이 많아져 성능이 저하될 수 있다.

### Q6. 중복 제거에 `HashSet`과 `TreeSet` 중 무엇을 쓰나?

순서가 중요하지 않고 포함 검사와 중복 제거가 목적이면 평균 O(1) `HashSet`이 기본이다. 정렬 출력, 범위 질의, 가장 가까운 원소가 필요하면 O(log n) `TreeSet`을 쓴다. 정렬 집합은 비교자에서 0인 원소를 같은 원소로 본다.

**꼬리질문:** `TreeSet`의 comparator가 `equals()`와 일치하지 않으면? **답:** Set 일반 계약을 어길 수 있다. 정렬 기준의 0과 논리적 동등성이 일치하도록 설계해야 한다.[9]

### Q7. 희소 그래프를 인접 행렬 대신 인접 리스트로 저장하는 이유는?

인접 리스트 공간은 O(V+E)로 저장한 간선 수에 비례한다. 행렬은 간선이 없어도 모든 정점 쌍 칸을 두므로 O(V²) 공간을 쓴다. 희소 연결망에서는 인접 리스트가 메모리와 이웃 순회에 효율적이다.

**꼬리질문:** 간선 유무를 아주 자주 검사한다면? **답:** 행렬은 O(1) 인덱스 접근으로 빠르지만 O(V²) 공간을 감당해야 한다. 정점 수·밀도·질의 횟수로 손익을 정한다.

### Q8. HTTP 요청 대기열을 `ArrayDeque`로 공유해도 되나?

단일 스레드 안의 FIFO 버퍼라면 쓸 수 있지만 `ArrayDeque`는 thread-safe하지 않고 용량 제한도 없다. 여러 생산자·소비자가 공유한다면 동시성 큐를 선택하고, 큐가 꽉 찼을 때 대기·거절 등 역압 정책을 둔다. 무제한 적재는 메모리 장애로 이어질 수 있다.[7]

**꼬리질문:** 작업 우선순위별로 꺼내려면? **답:** 도착 순서 FIFO 대신 우선순위와 tie-break 규칙을 정의해 `PriorityQueue`나 동시성 우선순위 큐를 사용한다. 동률 순서는 자동 보장되지 않으므로 필요하면 시퀀스 번호를 포함한다.

## 9. 참고문헌

1. Oracle Java Tutorials, “Introduction to Collections” — https://docs.oracle.com/javase/tutorial/collections/intro/index.html — 프레임워크 구성.
2. Princeton, “Algorithms, 4th Edition” — https://algs4.cs.princeton.edu/home/ — 주요 자료구조 주제와 응용.
3. Java SE 25 API, `PriorityQueue` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/PriorityQueue.html — 순서·복잡도·동시성 계약.
4. Java SE 25 API, `HashMap` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/HashMap.html — 성능 조건·로드 팩터·순서.
5. Java SE 25 API, `ArrayList` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayList.html — 추가·인덱스 연산 비용.
6. Java SE 25 API, `LinkedList` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedList.html — 링크 구조·인덱스 탐색.
7. Java SE 25 API, `ArrayDeque` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayDeque.html — 덱 비용·null·동시성.
8. Java SE 25 API, `TreeMap` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeMap.html — Red-Black tree와 O(log n).
9. Java SE 25 API, `TreeSet` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/TreeSet.html — 정렬 집합·비교자 계약.
10. OpenJDK, JEP 431 — https://openjdk.org/jeps/431 — Java 21 Sequenced Collections.
11. Java Virtual Machine Specification, Java SE 25, Chapter 2 — https://docs.oracle.com/javase/specs/jvms/se25/html/jvms-2.html — JVM 실행 영역과 프레임.
12. Java SE 25 API, `LinkedHashMap` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/LinkedHashMap.html — encounter order와 LRU 구현 기반.

컬렉션 사용법·내부 구현은 → P10·J07, 트리 순회는 → J23, 알고리즘은 → J22, JVM 메모리는 → J14 참조.
