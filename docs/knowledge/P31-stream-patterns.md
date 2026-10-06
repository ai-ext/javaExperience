# P31. Stream 실무 패턴 모음 — for문과 나란히, 언제 무엇을

> Stream은 데이터 변환·선별·집계를 파이프라인으로 읽기 좋게 쓴다.
> break·여러 상태 변경·예외별 복구가 중심이면 for문이 더 명료하다.
> 아래 35쌍은 한 파일로 실행해 결과를 확인했다.

## 1. 한 줄로 말하면

Stream은 소스 원소를 중간 연산으로 변환·선별해 최종 연산에서 소비하는 일회성 파이프라인이다. 복잡한 제어 흐름은 반복문이 낫다.

## 2. 당장 알아야 할 것

1. **지연·일회 소비** — `filter/map`은 최종 연산 때 실행된다. 재탐색은 수집 후 한다.
2. **연산 선택** — 1:1은 `map`, 제외는 `filter`, 중첩 원소는 `flatMap(o -> o.items().stream())`.
3. **정렬·중복** — `comparing(...).thenComparing(...)`, `.reversed()`, `nullsLast(...)`; `distinct()`는 `equals` 기준.
4. **그룹·Map** — `groupingBy(..., counting())` 등 downstream을 쓴다. `toMap` 충돌은 예외; 병합·Map 순서를 정한다.
5. **집계·결과** — `mapToInt(...).sum()/average()/summaryStatistics()`; 빈 값 처리가 필요하다. 가변 누적은 `collect`.
6. **흐름·디버깅** — break/continue·예외 복구는 for문. `forEach` 중 원본 변경·업무용 `peek`는 금지; Stream Trace로 본다.

## 3. 따라 하기

1. Boot 4.1/Java 25: Gradle은 `java { toolchain { languageVersion.set(JavaLanguageVersion.of(25)) } }`; Maven은 `<maven.compiler.release>25</maven.compiler.release>`. 추가 의존성 없음.
2. `_scratch/P31/StreamPatternsDemo.java`로 저장한다(JDK 21 검증).
3. 루트에서 실행한다. 같은 결과는 공통값으로 출력한다.

```sh
java _scratch/P31/StreamPatternsDemo.java
```

### 전체 예제

```java
import java.util.*;
import java.util.stream.*;
import static java.util.stream.Collectors.*;

public class StreamPatternsDemo {
 record E(int id,String name,String dept,int salary,boolean active,Integer score){}
 record DTO(int id,String name,String dept){}
 record Item(String sku,int qty){}
 record Order(int id,List<Item> items){}
 record Totals(long count,long sum,double average){}
 static final List<E> p=List.of(new E(1,"Hana","API",700,true,8),new E(2,"Min","DB",650,false,null),new E(3,"Jun","API",800,true,5),new E(4,"Ara","DB",750,true,9));
 static int n;
 static void show(String label,Object loop,Object stream){System.out.printf("%02d %s: %s%n",++n,label,Objects.equals(loop,stream)?loop:loop+" <> "+stream);}
 public static void main(String[] args){
  var a=new ArrayList<String>();for(var e:p)if(e.active())a.add(e.name());show("filter",a,p.stream().filter(E::active).map(E::name).toList());
  a=new ArrayList<>();for(var e:p)a.add(e.name().toUpperCase(Locale.ROOT));show("map",a,p.stream().map(e->e.name().toUpperCase(Locale.ROOT)).toList());
  var d=new ArrayList<DTO>();for(var e:p)d.add(new DTO(e.id(),e.name(),e.dept()));show("DTO",d,p.stream().map(e->new DTO(e.id(),e.name(),e.dept())).toList());
  var s=new ArrayList<>(p);s.sort(Comparator.comparingInt(E::salary));show("sort",s.stream().map(E::name).toList(),p.stream().sorted(Comparator.comparingInt(E::salary)).map(E::name).toList());
  s.sort(Comparator.comparing(E::dept).thenComparing(E::name));show("thenComparing",s.stream().map(E::name).toList(),p.stream().sorted(Comparator.comparing(E::dept).thenComparing(E::name)).map(E::name).toList());
  s.sort(Comparator.comparingInt(E::salary).reversed());show("reversed",s.stream().map(E::salary).toList(),p.stream().sorted(Comparator.comparingInt(E::salary).reversed()).map(E::salary).toList());
  var cmp=Comparator.comparing(E::score,Comparator.nullsLast(Comparator.naturalOrder()));s.sort(cmp);show("nullsLast",s.stream().map(E::name).toList(),p.stream().sorted(cmp).map(E::name).toList());
  var tags=List.of("java","spring","java","boot");var u=new ArrayList<String>();for(var t:tags)if(!u.contains(t))u.add(t);show("distinct",u,tags.stream().distinct().toList());
  var first=new LinkedHashMap<String,E>();for(var e:p)first.putIfAbsent(e.dept(),e);show("distinct key",first.values().stream().map(E::name).toList(),p.stream().collect(toMap(E::dept,e->e,(x,y)->x,LinkedHashMap::new)).values().stream().map(E::name).toList());
  var g=new TreeMap<String,List<String>>();for(var e:p)g.computeIfAbsent(e.dept(),k->new ArrayList<>()).add(e.name());show("grouping",g,p.stream().collect(groupingBy(E::dept,TreeMap::new,mapping(E::name,toList()))));
  var c=new TreeMap<String,Long>();for(var e:p)c.merge(e.dept(),1L,Long::sum);show("counting",c,p.stream().collect(groupingBy(E::dept,TreeMap::new,counting())));
  var sums=new TreeMap<String,Integer>();for(var e:p)sums.merge(e.dept(),e.salary(),Integer::sum);show("summingInt",sums,p.stream().collect(groupingBy(E::dept,TreeMap::new,summingInt(E::salary))));
  var sets=new TreeMap<String,Set<String>>();for(var e:p)sets.computeIfAbsent(e.dept(),k->new TreeSet<>()).add(e.name());show("mapping/toSet",sets,p.stream().collect(groupingBy(E::dept,TreeMap::new,mapping(E::name,toCollection(TreeSet::new)))));
  var part=new TreeMap<Boolean,List<String>>();part.put(true,new ArrayList<>());part.put(false,new ArrayList<>());for(var e:p)part.get(e.active()).add(e.name());show("partitioning",part,p.stream().collect(partitioningBy(E::active,mapping(E::name,toList()))));
  var ids=new TreeMap<Integer,String>();for(var e:p)ids.put(e.id(),e.name());show("toMap unique",ids,p.stream().collect(toMap(E::id,E::name,(x,y)->x,TreeMap::new)));
  String d1,d2;try{var m=new HashMap<String,Integer>();for(var t:tags)if(m.putIfAbsent(t,1)!=null)throw new IllegalStateException();d1="none";}catch(IllegalStateException ex){d1="IllegalStateException";}try{tags.stream().collect(toMap(t->t,t->1));d2="none";}catch(IllegalStateException ex){d2="IllegalStateException";}show("toMap duplicate",d1,d2);
  var tc=new LinkedHashMap<String,Integer>();for(var t:tags)tc.merge(t,1,Integer::sum);show("toMap merge",tc,tags.stream().collect(toMap(t->t,t->1,Integer::sum,LinkedHashMap::new)));
  var ordered=new LinkedHashMap<Integer,String>();for(var e:p)ordered.put(e.id(),e.name());show("LinkedHashMap",ordered.keySet(),p.stream().collect(toMap(E::id,E::name,(x,y)->x,LinkedHashMap::new)).keySet());
  var stock=new LinkedHashMap<String,Integer>();stock.put("pen",0);stock.put("book",3);stock.put("cup",2);var avail=new ArrayList<String>();stock.forEach((k,v)->{if(v>0)avail.add(k);});show("Map filter",avail,stock.entrySet().stream().filter(e->e.getValue()>0).map(Map.Entry::getKey).toList());
  var raised=new TreeMap<String,Integer>();for(var e:p)raised.put(e.name(),e.salary()+100);show("Map values",raised,p.stream().collect(toMap(E::name,e->e.salary()+100,(x,y)->x,TreeMap::new)));
  var orders=List.of(new Order(101,List.of(new Item("A",2),new Item("B",1))),new Order(102,List.of(new Item("C",4))));var lines=new ArrayList<String>();for(var o:orders)for(var i:o.items())lines.add(o.id()+":"+i.sku());show("flatMap",lines,orders.stream().flatMap(o->o.items().stream().map(i->o.id()+":"+i.sku())).toList());
  int total=0;for(var e:p)total+=e.salary();show("sum",total,p.stream().mapToInt(E::salary).sum());
  int st=0;for(var e:p)st+=e.salary();double avg=p.isEmpty()?0:(double)st/p.size();show("average",avg,p.stream().mapToInt(E::salary).average().orElse(0));
  var stat=new IntSummaryStatistics();for(var e:p)stat.accept(e.salary());show("statistics",stat.toString(),p.stream().mapToInt(E::salary).summaryStatistics().toString());
  E hi=null,lo=null;for(var e:p){if(hi==null||e.salary()>hi.salary())hi=e;if(lo==null||e.salary()<lo.salary())lo=e;}show("max/min",hi.name()+"/"+lo.name(),p.stream().max(Comparator.comparingInt(E::salary)).orElseThrow().name()+"/"+p.stream().min(Comparator.comparingInt(E::salary)).orElseThrow().name());
  boolean any=false,all=true,none=true;for(var e:p){any|=e.salary()>=800;all&=e.salary()>0;none&=e.active();}show("match",any+"/"+all+"/"+none,p.stream().anyMatch(e->e.salary()>=800)+"/"+p.stream().allMatch(e->e.salary()>0)+"/"+p.stream().noneMatch(e->!e.active()));
  String f="none";for(var e:p)if(e.active()){f=e.name();break;}show("findFirst",f,p.stream().filter(E::active).map(E::name).findFirst().orElse("none"));
  var joined=new StringBuilder();for(var e:p){if(joined.length()>0)joined.append(", ");joined.append(e.name());}show("joining",joined.toString(),p.stream().map(E::name).collect(joining(", ")));
  int page=1,size=2,from=Math.min(page*size,p.size()),to=Math.min(from+size,p.size());a=new ArrayList<>();for(int i=from;i<to;i++)a.add(p.get(i).name());show("page",a,p.stream().skip((long)page*size).limit(size).map(E::name).toList());
  var left=List.of("a","b","c");var right=List.of("1","2","3");var paired=new ArrayList<String>();for(int i=0;i<left.size();i++)paired.add(left.get(i)+right.get(i));show("IntStream.range",paired,IntStream.range(0,left.size()).mapToObj(i->left.get(i)+right.get(i)).toList());
  var names=Map.of(1,"Hana",2,"Min",3,"Jun");var owners=List.of(3,1);a=new ArrayList<>();for(int id:owners)a.add(names.get(id));show("join by key",a,owners.stream().map(names::get).toList());
  total=0;for(var e:p)total+=e.salary();show("reduce",total,p.stream().map(E::salary).reduce(0,Integer::sum));
  long n=0,sum=0;for(var e:p){n++;sum+=e.salary();}var ltot=new Totals(n,sum,(double)sum/n);var stot=p.stream().collect(teeing(counting(),summingInt(E::salary),(cnt,v)->new Totals(cnt,v,(double)v/cnt)));show("teeing",ltot,stot);
  a=new ArrayList<>();for(var e:p)a.add(e.name());a.add("Extra");var immutable=p.stream().map(E::name).toList();String mut;try{immutable.add("Extra");mut="mutable";}catch(UnsupportedOperationException ex){mut="unmodifiable";}var collected=p.stream().map(E::name).collect(toList());boolean cm;try{collected.add("Extra");cm=true;}catch(UnsupportedOperationException ex){cm=false;}show("toList/collect", "mutable size="+a.size(),"toList="+mut+", collect(toList) mutable="+cm);
  String found="not found";for(var e:p)if(e.id()==99){found=e.name();break;}show("Optional",found,p.stream().filter(e->e.id()==99).map(E::name).findFirst().orElse("not found"));
  System.out.println("reuse -> "+reused());
 }
 static boolean reused(){Stream<String>s=Stream.of("a","b");s.count();try{s.count();return false;}catch(IllegalStateException ex){return true;}}
}
```

### JDK 21 실제 출력

```text
01 filter: [Hana, Jun, Ara]
02 map: [HANA, MIN, JUN, ARA]
03 DTO: [DTO[id=1, name=Hana, dept=API], DTO[id=2, name=Min, dept=DB], DTO[id=3, name=Jun, dept=API], DTO[id=4, name=Ara, dept=DB]]
04 sort: [Min, Hana, Ara, Jun]
05 thenComparing: [Hana, Jun, Ara, Min]
06 reversed: [800, 750, 700, 650]
07 nullsLast: [Jun, Hana, Ara, Min]
08 distinct: [java, spring, boot]
09 distinct key: [Hana, Min]
10 grouping: {API=[Hana, Jun], DB=[Min, Ara]}
11 counting: {API=2, DB=2}
12 summingInt: {API=1500, DB=1400}
13 mapping/toSet: {API=[Hana, Jun], DB=[Ara, Min]}
14 partitioning: {false=[Min], true=[Hana, Jun, Ara]}
15 toMap unique: {1=Hana, 2=Min, 3=Jun, 4=Ara}
16 toMap duplicate: IllegalStateException
17 toMap merge: {java=2, spring=1, boot=1}
18 LinkedHashMap: [1, 2, 3, 4]
19 Map filter: [book, cup]
20 Map values: {Ara=850, Hana=800, Jun=900, Min=750}
21 flatMap: [101:A, 101:B, 102:C]
22 sum: 2900
23 average: 725.0
24 statistics: IntSummaryStatistics{count=4, sum=2900, min=650, average=725.000000, max=800}
25 max/min: Jun/Min
26 match: true/true/false
27 findFirst: Hana
28 joining: Hana, Min, Jun, Ara
29 page: [Jun, Ara]
30 IntStream.range: [a1, b2, c3]
31 join by key: [Jun, Hana]
32 reduce: 2900
33 teeing: Totals[count=4, sum=2900, average=725.0]
34 toList/collect: mutable size=5 <> toList=unmodifiable, collect(toList) mutable=true
35 Optional: not found
reuse -> true
```

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| filter/map | 선별·DTO | `.filter(...).map(...)` | 부수 효과 금지 |
| sorted/distinct | 정렬·중복 | `thenComparing`, `distinct` | null·equals 기준 |
| grouping/toMap | 집계·맵 | `groupingBy`, `toMap` | 정책·순서 지정 |
| Map/flatMap | 변환·평탄화 | `entrySet()`, `flatMap(...)` | 원본 수정 금지 |
| 숫자·검색 | 합계·조건 | `mapToInt(...).sum()`, `findFirst` | 빈 값 처리 |
| joining/page/index | 결합·슬라이스 | `joining`, `skip().limit()`, `range` | DB 페이징 아님 |
| 결과/debug/teeing | 변경·추적·결합 | `toList`, `peek`, `teeing` | 불변·부수 효과 유의 |

## 5. 자주 나는 에러와 해결

- `IllegalStateException: Duplicate key` → `toMap` 충돌 → 병합 규칙을 넣거나 중복을 검증한다.
- `UnsupportedOperationException` → `Stream.toList()` 결과 수정 → `toCollection(ArrayList::new)`.
- 두 번째 종단 연산 `IllegalStateException` → Stream 재사용 → 새 인스턴스 생성.
- `NoSuchElementException` → 빈 Optional의 `get()` → `orElseThrow` 등으로 처리.
- `ConcurrentModificationException`/누락 → 순회 중 원본 변경 → `filter`로 새 결과.

## 6. 한 단계 더

단락 연산은 일부만 소비하므로 `peek`에 의존하지 않는다. JDK 12 `teeing`, JDK 16 `Stream.toList()`. 내부·병렬 → J09, 람다 → J08, 컬렉션 → P10.

## 7. 자가점검 Q&A (면접 대비)

**Q1. `map`과 `flatMap` 차이는?**  
`map`은 입력 하나당 출력 하나를 만든다.  
`flatMap`은 각 입력이 만든 Stream을 하나로 편다.  
중첩된 주문 품목 등에 쓴다.  
꼬리: 주문 품목 전체는? → `flatMap`.

**Q2. 중간 연산은 언제 실행되나?**  
`filter/map`은 중간 연산이라 호출만으로 계산하지 않는다.  
최종 연산이 값을 요구할 때 원소가 흐른다.  
단락 연산은 답을 얻으면 멈춘다.  
꼬리: 빈 소스의 `peek`? → 호출되지 않는다.

**Q3. `toMap` 중복 키는?**  
기본 overload는 어떤 값을 남길지 정할 수 없어 예외를 낸다.  
merge overload는 기존 값과 새 값을 받아 병합한다.  
꼬리: 첫 값 보존은? → `(first, later) -> first`.

**Q4. 두 `toList` 방식은?**  
`Stream.toList()` 결과는 불변이다.  
`Collectors.toList()`는 수정 가능성을 보장하지 않는다.  
수정 보장이 필요하면 `toCollection(ArrayList::new)`를 쓴다.  
꼬리: 변경 불가 결과를 원하면? → `Stream.toList()`.

**Q5. `findFirst`와 `findAny`는?**  
`findFirst`는 순서상 첫 값을 반환한다.  
`findAny`는 순서가 중요하지 않을 때 임의의 값을 고른다.  
둘 다 값이 없을 수 있어 Optional을 반환한다.  
꼬리: 값이 없으면 예외? → `orElseThrow`.

**Q6. 언제 for문이 낫나?**  
break/continue로 반복 흐름을 직접 제어할 때다.  
여러 상태를 바꾸거나 항목별 예외 복구가 필요할 때도 그렇다.  
코드가 더 짧고 단계별 관찰이 쉬운 쪽을 고른다.  
꼬리: 복잡한 Stream 디버깅? → Trace 또는 for문.

## 8. 참고문헌

- Stream 패키지 (Java 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/package-summary.html — lazy·일회 소비.
- `Collectors` (Java 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Collectors.html — Collector API.
- `Stream` (Java 25) — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/stream/Stream.html — API.
- IntelliJ Stream Trace — https://www.jetbrains.com/help/idea/analyze-java-stream-operations.html — Trace 도구.
- `Collectors` (Java 12) — https://docs.oracle.com/en/java/javase/12/docs/api/java.base/java/util/stream/Collectors.html — `teeing`.
- `Stream` (Java 16) — https://docs.oracle.com/en/java/javase/16/docs/api/java.base/java/util/stream/Stream.html — `toList`.
