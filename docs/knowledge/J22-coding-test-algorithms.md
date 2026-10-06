# J22. 코딩테스트 알고리즘 — Java로 빠르게 구현하기

> 입력은 `BufferedReader`로 받고 출력은 `StringBuilder`에 모은다.
> 입력 크기에서 허용 복잡도를 먼저 정한 뒤, 정렬·탐색·그래프·DP의 불변식을 코드로 옮긴다.
> Java에서는 `Scanner`, 재귀 깊이, `int` 오버플로, `PriorityQueue`의 순회 순서를 특히 경계한다.

## 1. 왜 알아야 하나

코딩테스트에서 알고리즘을 알고도 틀리는 지점은 경계와 구현 비용이다. 입력이 1,000,000개인데 `Scanner.nextInt()`와 `O(n log n)`을 함께 쓰면 이론 복잡도와 실제 시간이 어긋난다. `Arrays.binarySearch`의 음수 반환값을 인덱스로 쓰거나, `PriorityQueue`를 `for` 문으로 훑고 정렬됐다고 믿는 것도 즉시 오답이다.

시간 제한은 연산량으로 환산한다. 초당 1억 회는 CPU·JVM 워밍업·객체 할당·입력량에 따라 달라지는 경험칙이다. 따라서 `n=10^5`의 `O(n^2)`는 우선 배제하고 `O(n log n)` 또는 `O(n)`을 찾는다. `n=20`이면 `O(2^n)` 백트래킹을 검토하되, 같은 상태가 반복되면 DP로 줄인다.

문제지를 받으면 다음을 순서대로 확인한다.

1. `n`, 값의 범위, 질의 수로 허용 복잡도를 정한다.
2. 정렬 뒤 조건이 단조적으로 변하는지 본다.
3. 연속 구간이면 투 포인터·슬라이딩 윈도우·누적합을 의심한다.
4. 그래프라면 가중치가 0/1인지, 음수인지 확인한다.
5. 합·거리·곱의 최댓값을 계산해 `long` 필요 여부를 정한다.

컬렉션 내부 구현은 J07, 일반 자료구조 사용법은 P10을 참조한다. 이 문서는 제한 시간 안에 유형을 판별하고 Java로 구현하는 데 집중한다.

## 2. 핵심 개념

| 문제 신호 | 먼저 떠올릴 도구 | 전형적 복잡도 |
|---|---|---:|
| 전체 순서가 필요 | `Arrays.sort`, 커스텀 정렬 | `O(n log n)` |
| 정렬 배열의 첫 위치 | lower bound | `O(log n)` |
| 양끝 경계를 유지 | 투 포인터·슬라이딩 윈도우 | `O(n)` |
| 구간 합 질의 | 누적합 | 전처리 `O(n)`, 질의 `O(1)` |
| 최솟값을 반복 선택 | `PriorityQueue` | 삽입·삭제 `O(log n)` |
| 동일 비용 격자 | BFS | `O(V+E)` |
| 비음수 가중치 | Dijkstra | `O((V+E)log V)` |
| 그룹 합치기·같은 그룹 질의 | Union-Find | 거의 `O(1)` amortized |
| 부분 문제 중복 | DP | 상태 수 × 전이 수 |

lower bound는 `a[i] >= x`인 첫 인덱스, upper bound는 `a[i] > x`인 첫 인덱스다. 중복된 `x`의 개수는 `upper(x)-lower(x)`다. `Arrays.binarySearch`는 존재하는 원소의 임의 위치를 찾고, 없으면 음수 인코딩 값을 주므로 경계 탐색 API가 아니다.

| 헷갈리는 쌍 | 판단 기준 |
|---|---|
| 투 포인터 / 슬라이딩 윈도우 | 투 포인터는 두 인덱스의 관계 전체, 슬라이딩 윈도우는 `[left,right]`의 상태를 유지하는 특수형이다. |
| BFS / DFS | BFS는 레벨 순서라 무가중치 최단거리, DFS는 연결성·경로·백트래킹에 맞다. |
| `Stack` / `ArrayDeque` | `ArrayDeque`는 양끝 연산을 제공하고 `Stack`보다 스택 용도로 적합하다. `null`은 금지된다. |
| `PriorityQueue` / 정렬 배열 | 동적으로 최솟값 하나씩 필요하면 힙, 전체 순서·인덱스가 필요하면 정렬 배열이다. |
| 그리디 / DP | 그리디는 교환 논증이 필요하고, DP는 상태에 여러 선택의 최적값을 저장한다. |
| `int` / `long` | 원소 타입과 합·거리 타입은 별개다. 계산식 시작부터 `long`으로 승격한다. |

API 치트시트:

- `Arrays.sort(int[])`: 기본형 오름차순. 객체 배열은 `Arrays.sort(a, comparator)`를 쓴다.
- `list.sort(comparator)`: `List`의 커스텀 정렬. 큰 수치 데이터는 박싱 없는 `int[]`를 우선한다.
- `new PriorityQueue<>()`: 자연 순서 최소 힙. 최대 힙은 `Comparator.reverseOrder()`다.
- `ArrayDeque<Integer>`: 큐는 `addLast`/`pollFirst`, 스택은 `push`/`pop`이다.
- 빈도는 `map.put(k, map.getOrDefault(k, 0) + 1)`처럼 읽고 다시 저장한다.
- `Integer.MAX_VALUE`를 거리 무한대로 쓰면 `INF+w`가 넘칠 수 있다. `long INF = Long.MAX_VALUE / 4`가 안전하다.

## 3. 내부 동작·원리

### 입력과 출력

`BufferedReader`는 `Reader` 위에 문자 버퍼를 둬 작은 읽기마다 underlying stream을 호출하지 않는다. `readLine()` 뒤 `StringTokenizer`를 쓰는 방식은 공백·개행이 구분자인 입력에 맞다. 토큰이 줄을 넘을 수 있으면 바이트 기반 FastScanner를 쓰거나 다음 줄을 보충하는 로직이 필요하다.

```text
System.in → InputStreamReader → BufferedReader → readLine()
                                                ↓
                                      StringTokenizer → parse
결과들 → StringBuilder → System.out.print(한 번)
```

### 정렬·경계 탐색

정렬은 이후 조건을 단조 함수로 만드는 전처리다. `[left,right)`를 답 후보로 두고 `a[mid] < x`면 `left=mid+1`, 아니면 `right=mid`로 줄이면 반복마다 후보가 절반 가까이 사라진다. `left==right`가 경계이며 빈 배열도 자연스럽게 `0`을 반환한다. Oracle API의 `Arrays`는 정렬·검색을 제공하지만 구현 세부를 알고리즘 명세로 가정하지 말고, 문제에서 필요한 경계는 직접 불변식을 세운다.

### BFS·DFS·최단거리

BFS에서 거리 `d`의 정점을 큐에서 꺼내면 새 이웃은 뒤에 들어가 거리 `d+1` 레벨에서 처리된다. 그러므로 처음 방문한 순간 최단거리가 확정된다. Dijkstra는 현재 `dist`가 가장 작은 정점을 꺼내 간선을 완화한다. 음수 간선이 없을 때만 이미 꺼낸 정점이 뒤늦게 더 짧아지지 않는다.

```text
BFS       시작 → 거리 0 → 거리 1 → 거리 2
Dijkstra  (최소 거리 v) → relax(to, dist[v] + w)
                          더 짧아지면 새 pair를 힙에 삽입
                          오래된 pair는 poll 뒤 버림
```

Java `PriorityQueue`는 전체 정렬 배열이 아니라 최소 원소가 머리인 힙이다. `offer`·`poll`은 `O(log n)`, `peek`는 `O(1)`이고 iterator 순회는 정렬을 보장하지 않는다. Dijkstra는 우선순위 갱신 대신 새 항목을 넣는 lazy deletion을 사용한다. `poll()`한 `(d,v)`가 현재 `dist[v]`와 다르면 오래된 항목이다.

DFS는 재귀 호출 스택에 현재 정점과 다음 이웃 위치를 저장한다. 정점 수가 큰 일자형 그래프에서는 `O(V)` 알고리즘이어도 Java 호출 스택이 먼저 고갈될 수 있어 `ArrayDeque` 반복 DFS가 안전하다. 백트래킹은 `선택 → 재귀 → 선택 취소`를 한 묶음으로 유지한다.

### 누적합·투 포인터·스택

`prefix[i+1]=prefix[i]+a[i]`로 두면 `[l,r]` 합은 `prefix[r+1]-prefix[l]`이다. 음수가 섞여도 성립하므로 임의 구간 질의에 강하다. 반면 슬라이딩 윈도우는 오른쪽을 늘리거나 왼쪽을 줄일 때 조건이 한 방향으로 움직여야 한다.

단조 스택은 인덱스를 넣되 값이 증가 또는 감소하는 불변식을 유지한다. 현재 값이 불변식을 깨면 pop한 인덱스의 “다음 큰 원소”가 현재 값으로 확정된다. 한 번 들어간 인덱스가 한 번만 pop되므로 `O(n)`이다.

### 그리디·DP·Union-Find

DP는 `상태 정의 → 초기값 → 전이 → 계산 순서 → 정답 위치`를 먼저 쓴다. 0-1 배낭의 `dp[c]`는 용량 `c`에서의 최대 가치다. 같은 물건을 다시 쓰지 않으려면 `c`를 큰 쪽에서 작은 쪽으로 순회한다. 순방향이면 이번 라운드에 갱신한 값이 다시 사용되어 완전 배낭이 된다.

그리디는 현재 선택이 최적해를 잃지 않는다는 교환 논증이나 컷 성질이 있어야 한다. 임의의 동전 체계에서 큰 동전부터 고르는 것은 최소 동전을 보장하지 않는다. Union-Find는 대표 부모와 `find` 경로 압축, union by size/rank로 집합을 관리한다. 두 원소의 대표가 같으면 같은 컴포넌트다.

## 4. 코드로 확인

아래 네 예제는 모두 import를 포함한 독립 파일이며, 지정된 Corretto JDK 21로 실행한 실제 출력이다.

### 예제 1 — 정렬·커스텀 정렬·lower/upper bound

```java
import java.util.*;
public class SearchDemo {
  static int lowerBound(int[] a,int x){int l=0,r=a.length;while(l<r){int m=(l+r)>>>1;if(a[m]<x)l=m+1;else r=m;}return l;}
  static int upperBound(int[] a,int x){int l=0,r=a.length;while(l<r){int m=(l+r)>>>1;if(a[m]<=x)l=m+1;else r=m;}return l;}
  public static void main(String[] z){int[] a={7,2,4,2,9};Arrays.sort(a);String[] w={"pear","apple","kiwi"};Arrays.sort(w,Comparator.comparingInt(String::length).thenComparing(String::compareTo));System.out.println(Arrays.toString(a));System.out.println("lower="+lowerBound(a,2)+", upper="+upperBound(a,2));System.out.println(Arrays.toString(w));}
}
```

```text
[2, 2, 4, 7, 9]
lower=0, upper=2
[kiwi, pear, apple]
```

### 예제 2 — 격자/그래프 BFS와 Dijkstra

```java
import java.util.*;
public class GraphDemo {
  static int[] bfs(List<Integer>[] g,int s){int[] d=new int[g.length];Arrays.fill(d,-1);ArrayDeque<Integer> q=new ArrayDeque<>();d[s]=0;q.add(s);while(!q.isEmpty()){int v=q.remove();for(int to:g[v])if(d[to]==-1){d[to]=d[v]+1;q.add(to);}}return d;}
  static long[] dij(List<long[]>[] g,int s){long[] d=new long[g.length];Arrays.fill(d,Long.MAX_VALUE/4);d[s]=0;PriorityQueue<long[]>q=new PriorityQueue<>(Comparator.comparingLong(x->x[0]));q.add(new long[]{0,s});while(!q.isEmpty()){long[]c=q.poll();long dv=c[0];int v=(int)c[1];if(dv!=d[v])continue;for(long[]e:g[v]){int to=(int)e[0];long nd=dv+e[1];if(nd<d[to]){d[to]=nd;q.add(new long[]{nd,to});}}}return d;}
  public static void main(String[]z){List<Integer>[]u=new List[5];List<long[]>[]w=new List[4];for(int i=0;i<5;i++)u[i]=new ArrayList<>();for(int i=0;i<4;i++)w[i]=new ArrayList<>();int[][]e={{0,1},{0,2},{1,3},{2,3},{3,4}};for(int[]x:e){u[x[0]].add(x[1]);u[x[1]].add(x[0]);}w[0].add(new long[]{1,4});w[0].add(new long[]{2,1});w[2].add(new long[]{1,2});w[1].add(new long[]{3,1});w[2].add(new long[]{3,5});w[3].add(new long[]{3,0});System.out.println("BFS="+Arrays.toString(bfs(u,0)));System.out.println("Dijkstra="+Arrays.toString(dij(w,0)));}
}
```

```text
BFS=[0, 1, 1, 2, 3]
Dijkstra=[0, 3, 1, 4]
```

### 예제 3 — 누적합·단조 스택·0-1 배낭

```java
import java.util.*;
public class DpDemo {
  static int bag(int[]w,int[]v,int cap){int[]d=new int[cap+1];for(int i=0;i<w.length;i++)for(int c=cap;c>=w[i];c--)d[c]=Math.max(d[c],d[c-w[i]]+v[i]);return d[cap];}
  static int[] next(int[]a){int[]r=new int[a.length];Arrays.fill(r,-1);ArrayDeque<Integer>s=new ArrayDeque<>();for(int i=0;i<a.length;i++){while(!s.isEmpty()&&a[s.peek()]<a[i])r[s.pop()]=a[i];s.push(i);}return r;}
  public static void main(String[]z){int[]a={2,1,3,4};long[]p={0,2,3,6,10};System.out.println("sum[1..3]="+(p[3]-p[1]));System.out.println("nextGreater="+Arrays.toString(next(a)));System.out.println("knapsack="+bag(new int[]{2,3,4},new int[]{3,4,5},5));}
}
```

```text
sum[1..3]=4
nextGreater=[3, 3, 4, -1]
knapsack=7
```

### 예제 4 — 입출력·StringBuilder·Union-Find·빈도

```java
import java.io.*;import java.util.*;
public class IoUnionDemo {
 static int[]p={0,1,2,3};static int find(int x){return p[x]==x?x:(p[x]=find(p[x]));}static void union(int a,int b){p[find(a)]=find(b);}
 public static void main(String[]z)throws Exception{BufferedReader br=new BufferedReader(new StringReader("3 a b a"));StringTokenizer st=new StringTokenizer(br.readLine());int n=Integer.parseInt(st.nextToken());Map<String,Integer>m=new HashMap<>();for(int i=0;i<n;i++){String s=st.nextToken();m.put(s,m.getOrDefault(s,0)+1);}union(1,2);StringBuilder o=new StringBuilder();o.append(find(1)==find(2)).append(' ').append(find(1)==find(3)).append('\n').append(m);System.out.print(o);}
}
```

```text
true false
{a=2, b=1}
```

## 5. 버전별 변화 — 왜 바뀌었나

이 주제에서 Java 21부터 Java 25까지 알고리즘 선택을 바꿀 큰 변화는 없다. 예제는 온라인 저지 호환성을 위해 JDK 21 문법으로 작성했고, 기준 Java 25 API에서도 `Arrays`, `PriorityQueue`, `ArrayDeque`, `BufferedReader`의 핵심 사용 방식은 동일하다. 특정 버전 전용 문법을 사용하지 않았으므로 붙일 JEP도 없다.

현재 Java 25 API에서 확인한 실무상 주의점은 `PriorityQueue`의 용량 성장 정책을 코드가 의존해서는 안 된다는 것, `ArrayDeque`가 `null`을 금지하고 대부분 연산이 amortized constant time이라는 것, `BufferedReader`가 버퍼 없이 매번 Reader를 호출하는 비용을 줄인다는 것이다. 이는 알고리즘 변화가 아니라 표준 API 계약을 정확히 읽어야 하는 이유다.

## 6. 실무 가이드

- 입력이 크고 공백 토큰이면 `BufferedReader` + `StringTokenizer`를 써라. 기본값으로 추천한다. 줄 경계를 넘는 토큰이면 바이트 기반 FastScanner를 검토한다.
- 전체 순서가 필요하면 `Arrays.sort`를 써라. 기본형 배열은 박싱이 없다.
- 정렬 배열에서 첫 위치·개수를 묻는다면 `[l,r)` lower/upper bound를 써라. `binarySearch`의 반환 인코딩을 해석하는 실수를 줄인다.
- 음수가 있거나 임의의 구간 합 질의가 많으면 `long` 누적합, 양수 조건이 단조롭게 유지되면 슬라이딩 윈도우를 써라.
- 최솟값 후보가 동적으로 들어오면 `PriorityQueue`를 쓰고, 전체 정렬 순서가 필요하면 배열을 정렬하라.
- 격자·그래프의 모든 간선 비용이 1이면 BFS, 0/1이면 0-1 BFS, 음수 없는 일반 가중치면 Dijkstra를 써라.
- 그룹 병합과 연결 여부 질의가 반복되면 경로 압축과 union by size를 넣은 Union-Find를 써라.
- 같은 `(i, 용량, 합, 마지막 값)`이 반복되면 DP 상태를 정의하라. 그리디는 교환 논증이 있을 때만 선택한다.
- 거리·합·곱은 입력 상한을 먼저 곱해 `long`으로 충분한지 확인하라. `INF`는 `Long.MAX_VALUE/4`로 둔다.

| 입력 크기 | 보통 출발 복잡도 | 후보 |
|---:|---|---|
| `n ≤ 20` | `O(2^n)` | 백트래킹·비트마스크 DP |
| `n ≤ 500` | `O(n^2)` | 2차원 DP·모든 쌍 관계 |
| `n ≤ 5,000` | `O(n^2)` 조건부 | 정렬·상태 축소 |
| `n ≤ 100,000` | `O(n log n)` | 정렬·힙·해시·그래프 탐색 |
| `n ≤ 1,000,000` | `O(n)` | 선형 스캔·누적합·카운팅 |

### 복잡도와 경계 검증 절차 (보강)

기존 표는 입력 크기별로 고려할 알고리즘을 제안하지만, 복잡도별 성장 폭과 보조 공간은 따로 읽어야 한다. `O(1)`은 입력이 커져도 작업 수가 일정하고, `O(log n)`은 매 단계 후보를 절반으로 줄인다. `O(n)`은 모든 항목을 한 번 훑고, `O(n log n)`은 각 단계에서 전체 항목을 처리하며 단계 수가 로그만큼 늘어나는 정렬에서 볼 수 있다. `n`을 두 배로 할 때 대표 작업량은 아래처럼 변한다.

| 시간 복잡도 | 대표 작업 | n → 2n일 때 작업량 | 보조 공간 예 |
|---|---|---:|---|
| `O(1)` | 배열 인덱스 접근 | 1 → 1 | `O(1)` |
| `O(log n)` | 정렬 배열 lower bound | `log₂n` → `log₂n + 1` | `O(1)` |
| `O(n)` | 배열 전체 스캔 | n → 2n | `O(1)` |
| `O(n log n)` | 병합 정렬 | `n log₂n` → `2n(log₂n + 1)` | `O(n)` 버퍼 |

`n=2²⁰`에서 `2²¹`로 커지면 `log₂n`은 20→21, `n`은 약 100만→200만, `n log₂n`은 약 2,100만→4,400만 작업으로 늘어난다. 성장 비교는 실제 실행 시간 예측이 아니다. 주어진 입력 배열을 제외하고 추가로 보관하는 메모리를 보조 공간으로 센다. 병합 정렬은 버퍼 `O(n)`과 호출 스택 `O(log n)`을 써 총 `O(n)` 보조 공간을 쓴다. 시간 `O(n)` 스캔도 변수 몇 개만 쓰면 공간은 `O(1)`이다.

문제 풀이 전에 최대 `n`, 질의 수 `q`, 정렬 여부, 값의 범위, 시간·메모리 제한을 적는다. 한 번 정렬한 뒤 질의한다면 총 시간은 정렬 `O(n log n)`과 질의 `O(q log n)`의 합이다. 매 질의마다 훑으면 `O(qn)`이다. `n=10⁶`, `q=10⁵`에서 후자는 최악에 약 `10¹¹`번 비교하므로 제외할 수 있다. 복사본·DP 배열·재귀 깊이도 메모리에 포함하고, 값의 최대 합·곱으로 자료형을 정한다.

복잡도 후보를 고른 다음에는 코드의 불변식과 경계를 적는다. 아래 lower bound는 오름차순 배열을 전제로 하며, 반복 중 답이 `[lo, hi)` 안에 남고 `lo` 앞의 값은 모두 `x`보다 작다는 사실을 유지한다. 빈 구간도 같은 규칙으로 처리해 빈 배열이면 `0`, 모든 값보다 큰 `x`면 `n`을 반환한다. 병합 정렬은 매 재귀 호출이 `[lo, hi)`의 원소를 정렬된 순서로 합쳐 원래 구간의 모든 원소를 보존한다. 이런 설명은 “왜 절반으로 줄여도 답을 잃지 않는가”와 “임시 배열이 왜 필요한가”를 코드와 연결한다.

검증은 작은 반례를 손으로 추적한 뒤 경계 입력을 넣는다. lower bound는 빈 배열, 원소 하나, 첫 값보다 작은 값, 마지막 값보다 큰 값, 중복 원소가 핵심이다. `[1, 2, 2, 2, 5]`에서 `x=2`의 답은 첫 중복 위치 `1`이다. 조건을 `a[mid] < x` 대신 `a[mid] <= x`로 바꾸면 첫 위치가 아니라 중복 구간 끝을 찾는다. 또 `[1]`, `x=2`에서 `lo=mid`로 갱신하면 `lo`가 움직이지 않아 반복이 끝나지 않는다. 최대 크기에서는 인덱스·중간값 계산·정수 합의 오버플로와 보조 메모리도 점검한다. 탐색 전제가 정렬이라면 정렬되지 않은 두 원소 배열을 작은 반례로 넣어 전제 누락을 드러낸다.

다음 순수 Java 예제는 각 방식의 작업 수를 세고, 경계 입력의 lower bound 결과를 확인한다. 병합 정렬 비교 횟수는 입력에 따라 달라지므로 `n log n`의 정확한 등식이 아니라 증가 양상을 보여 준다.

```java
import java.util.Arrays;

public class ComplexityWalkthrough {
    static int binary, linear, merge;

    static int lowerBound(int[] a, int x) { // sorted input, O(log n), O(1) space
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            binary++;
            if (a[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    static int linearMiss(int[] a, int x) { // O(n), O(1) space
        for (int i = 0; i < a.length; i++) {
            linear++;
            if (a[i] == x) return i;
        }
        return -1;
    }

    static void mergeSort(int[] a) { sort(a, new int[a.length], 0, a.length); }
    static void sort(int[] a, int[] t, int lo, int hi) {
        if (hi - lo < 2) return;
        int mid = lo + (hi - lo) / 2;
        sort(a, t, lo, mid);
        sort(a, t, mid, hi);
        int i = lo, j = mid;
        for (int k = lo; k < hi; k++) {
            if (i == mid) t[k] = a[j++];
            else if (j == hi) t[k] = a[i++];
            else {
                merge++;
                if (a[i] <= a[j]) t[k] = a[i++];
                else t[k] = a[j++];
            }
        }
        System.arraycopy(t, lo, a, lo, hi - lo);
    }

    static void check(int[] a, int x, int expected) {
        if (lowerBound(a, x) != expected) throw new AssertionError("x=" + x);
    }

    public static void main(String[] args) {
        for (int n : new int[] {8, 16, 32}) {
            int[] a = new int[n], reversed = new int[n];
            for (int i = 0; i < n; i++) { a[i] = i; reversed[i] = n - i; }
            binary = linear = merge = 0;
            int direct = a[n / 2]; // O(1)
            lowerBound(a, n);
            linearMiss(a, -1);
            mergeSort(reversed); // O(n log n) time, O(n) buffer + O(log n) stack
            System.out.printf("n=%d: direct=1, lowerBound=%d, linearMiss=%d, mergeSortComparisons=%d%n",
                    n, binary, linear, merge);
            if (n == 8) System.out.println("mergeSort result n=8: " + Arrays.toString(reversed));
        }
        check(new int[0], 4, 0);
        check(new int[] {7}, 7, 0);
        check(new int[] {1, 2, 2, 2, 5}, 2, 1);
        check(new int[] {1, 2, 2, 2, 5}, 0, 0);
        check(new int[] {1, 2, 2, 2, 5}, 9, 5);
        System.out.println("lowerBound boundaries: empty, singleton, duplicate, below, above OK");
    }
}
```

JDK 21 실행 출력:

```text
n=8: direct=1, lowerBound=3, linearMiss=8, mergeSortComparisons=12
mergeSort result n=8: [1, 2, 3, 4, 5, 6, 7, 8]
n=16: direct=1, lowerBound=4, linearMiss=16, mergeSortComparisons=32
n=32: direct=1, lowerBound=5, linearMiss=32, mergeSortComparisons=80
lowerBound boundaries: empty, singleton, duplicate, below, above OK
```

BST처럼 정렬 순서를 보존하며 탐색하는 트리의 구현은 높이에 따라 `O(log n)`에서 `O(n)`까지 달라질 수 있다. 노드 구조, 삽입·순회와 편향 트리의 검증은 [J23 트리 자료구조와 순회](J23-tree-traversal.md)를 참고한다.

참고: Analysis of Algorithms — https://algs4.cs.princeton.edu/14analysis/
참고: Binary Search — https://cp-algorithms.com/num_methods/binary_search.html

## 7. 함정·안티패턴

1. `Scanner`로 큰 입력 → 시간 초과 → `BufferedReader` 파서로 바꾸고, 그래도 부족하면 바이트 파서를 쓴다.
2. 깊은 재귀 DFS → `StackOverflowError` → 반복 DFS와 `ArrayDeque`를 쓴다.
3. `Integer.MAX_VALUE + w` → 음수 거리와 잘못된 완화 → 도달 가능한 경우만 더하고 `long INF`를 쓴다.
4. `PriorityQueue` iterator → 전체 정렬이라고 착각 → `poll()` 순서를 사용하거나 복사본을 poll한다.
5. 0-1 배낭의 용량을 순방향 순회 → 한 물건을 여러 번 사용 → 용량을 역순으로 순회한다.
6. `l<=r`와 `[l,r)`를 섞은 이분 탐색 → 빈 배열·마지막 원소 경계 오류 → `while(l<r)` 불변식을 고정한다.
7. `ArrayDeque`에 `null` 삽입 → `NullPointerException` → 빈 상태는 `isEmpty()`로 표현한다.
8. `getOrDefault`만 호출 → 빈도가 늘지 않음 → `put(key, getOrDefault(key,0)+1)`까지 수행한다.
9. 백트래킹 선택 취소 누락 → 형제 가지가 이전 상태 공유 → `choose → recurse → unchoose`를 한 블록에 둔다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `Arrays.binarySearch` 대신 lower bound를 직접 구현하는 이유는?

`binarySearch`는 존재하는 값의 임의 인덱스를 찾는 API이고, lower bound는 첫 경계를 찾는 문제다. 중복 개수는 `upper-lower`로 계산한다. 꼬리질문: 빈 배열의 답은? `0`이다.

### Q2. BFS가 무가중치 최단거리를 보장하는 이유는?

큐가 거리 `d`를 처리한 뒤 거리 `d+1`을 뒤에 넣으므로 처음 방문한 순서가 거리 오름차순이다. 가중치가 다르면 이 순서가 거리 순서가 아니어서 Dijkstra가 필요하다. 꼬리질문: 0/1 가중치는? 0은 앞, 1은 뒤에 넣는 0-1 BFS다.

### Q3. Dijkstra에서 같은 정점이 힙에 여러 번 들어가도 되는가?

된다. Java 힙에서 우선순위 갱신 대신 더 짧은 pair를 새로 넣고, `poll`한 거리와 현재 `dist`가 다르면 버린다. 음수 간선에서는 이미 확정한 정점이 개선될 수 있어 정당성이 깨진다. 꼬리질문: 이 방식의 핵심은? lazy deletion이다.

### Q4. 투 포인터와 누적합은 어떻게 선택하는가?

윈도우 조건이 한 방향으로만 변하면 투 포인터가 `O(n)`이다. 음수 때문에 단조성이 깨지거나 임의 구간 합 질의가 많으면 누적합을 쓴다. 꼬리질문: 누적합으로 구간 최솟값도 `O(1)`인가? 아니다.

### Q5. 0-1 배낭에서 용량을 역순으로 순회하는 이유는?

현재 물건을 처리하기 전 라운드의 `dp[c-w]`를 읽어야 한 번만 선택된다. 순방향이면 방금 갱신한 값이 재사용되어 완전 배낭이 된다. 꼬리질문: 메모리 `O(nW)` 2차원 DP에서는? 이전 행을 명시해 방향 함정이 줄어든다.

### Q6. 재귀 DFS를 반복 DFS로 바꾸면 무엇을 저장하는가?

단순 방문이면 정점만 스택에 넣으면 된다. 재귀의 후처리 순서가 필요하면 현재 정점, 다음 이웃 인덱스, 부모 등 호출 프레임도 저장해야 한다. 꼬리질문: `O(V)`인데 왜 실패하는가? 호출 스택은 힙 자료구조와 별도 한계이기 때문이다.

### Q7. `PriorityQueue`를 향상된 for 문으로 출력하면 왜 안 되는가?

힙은 부모가 자식보다 작다는 조건만 보장하고 전체 배열을 정렬하지 않는다. 정렬 순서가 필요하면 복사본을 만들어 `poll()`하거나 별도로 정렬한다. 꼬리질문: `peek`와 `poll`의 차이는? 전자는 제거하지 않고, 후자는 제거한다.

### Q8. `int` 배열의 최단거리도 `long`이어야 하는 경우는?

간선 하나가 `int` 범위여도 여러 간선의 합은 넘을 수 있다. `d+w`를 계산하기 전부터 `long`으로 승격하고 `INF` 덧셈도 안전하게 만든다. 꼬리질문: 곱셈도 넘으면? 입력 상한의 곱을 계산해 `long` 범위를 확인한다.

## 9. 참고문헌

- Java SE 25 `Arrays` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/Arrays.html — 배열 정렬·검색 API.
- Java SE 25 `PriorityQueue` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/PriorityQueue.html — 최소 힙 의미와 연산 복잡도.
- Java SE 25 `ArrayDeque` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/ArrayDeque.html — 큐·스택 연산, `null` 금지, amortized 복잡도.
- Java SE 25 `BufferedReader` API — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/BufferedReader.html — 버퍼링과 `readLine()`.
- CP-Algorithms — https://cp-algorithms.com/ — 경쟁 프로그래밍 알고리즘 색인.
- Binary Search — https://cp-algorithms.com/num_methods/binary_search.html — 경계 탐색 불변식.
- Dijkstra — https://cp-algorithms.com/graph/dijkstra.html — 비음수 가중치 최단거리와 완화.
