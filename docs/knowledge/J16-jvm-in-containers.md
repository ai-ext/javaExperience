# J16. 컨테이너 환경의 JVM

> 3줄 요약 — 컨테이너 메모리·CPU 한도는 cgroup으로 적용되고, HotSpot은 이를 읽어 힙과 내부 스레드 풀의 기본 크기를 정한다.
> `-Xmx`는 전체 프로세스 메모리 한도가 아니다. 힙 밖 네이티브 메모리와 RSS를 같이 관찰해야 `OOMKilled`를 설명할 수 있다.
> CDS/AOT 캐시는 HotSpot의 시작·워밍업을 줄이고, CRaC는 실행 중인 JVM을 복원하며, GraalVM Native Image는 아예 별도 런타임 실행 파일을 만든다.

## 1. 왜 알아야 하나

컨테이너 메모리 한도가 512MiB인데 `-Xmx512m`으로 배포하면, 힙을 꽉 채우기도 전에 커널이 프로세스를 죽일 수 있다. 힙 외에 Metaspace, JIT 코드 캐시, GC 자료구조, 스레드 스택, direct buffer, JNI 라이브러리와 메모리 매핑 파일이 같은 한도를 나눠 쓴다. Kubernetes 상태가 `OOMKilled`로 끝나고 Java 로그나 heap dump가 남지 않는 전형적인 이유다.

CPU 제한도 마찬가지다. 컨테이너가 0.5 CPU만큼의 실행 시간을 받는데 JVM이 호스트의 CPU 수를 기준으로 GC·공용 풀을 크게 만들면 스레드가 과도하게 경쟁하고 CPU throttling이 늘어난다. 반대로 JVM이 관측한 CPU 수가 실제보다 작으면 병렬 처리량을 못 낸다. `-XX:ActiveProcessorCount`는 JVM의 풀 크기 계산에 쓰는 CPU 수를 바꾸지만 컨테이너의 실제 CPU quota를 바꾸지는 않는다.

장애 대응 때도 구분이 중요하다. 애플리케이션 로그에 `java.lang.OutOfMemoryError: Java heap space`가 찍힌 상황과, 컨테이너 런타임이 프로세스를 `SIGKILL`해서 `OOMKilled`로 기록한 상황은 진단 자료와 해결책이 다르다. 전자는 JVM이 메모리 할당 실패를 관측했지만 후자는 JVM이 예외를 기록할 기회 없이 커널이 먼저 종료했을 수 있다.

## 2. 핵심 개념

| 용어 | 뜻 |
|---|---|
| cgroup / 컨테이너 인식 | Linux 자원 한도와 사용량을 관리하는 기능 / HotSpot이 그 한도를 읽어 VM 기본값에 반영하는 기능 |
| Java heap | 객체가 사는 GC 관리 영역. `-Xmx`는 이 영역만 제한한다. |
| `MaxRAMPercentage` / `InitialRAMPercentage` | JVM이 인식한 메모리 중 최대 힙 / 초기 힙을 계산하는 비율 |
| CPU quota / `ActiveProcessorCount` | 커널의 CPU 실행 시간 제한 / JVM 풀 크기 계산에 쓰는 프로세서 수 재정의 |
| RSS / NMT | 실제 상주 페이지 / HotSpot 내부 메모리 추적 기능 |
| CDS / AppCDS / AOT cache | JDK 또는 앱 클래스 데이터 / 클래스 준비 상태와 실행 프로파일을 공유·재사용하는 캐시 |
| CRaC | 실행 중인 JVM을 체크포인트하고 자원을 조정해 복원하는 방식 |
| GraalVM Native Image | Java 프로그램을 정적으로 분석해 OS용 네이티브 실행 파일로 만드는 기술 |

| 비교 | 구분 |
|---|---|
| `-Xmx` vs 컨테이너 limit | 전자는 힙 상한, 후자는 힙·네이티브·스택 등 전체 자원 상한이다. |
| OOME vs `OOMKilled` | 전자는 JVM 예외, 후자는 보통 커널/런타임이 프로세스를 강제 종료한 상태다. |
| CPU quota vs CPU 개수 | quota는 CPU 실행 시간, 개수는 JVM 내부 풀 크기 산정값이다. |
| NMT committed vs RSS | NMT는 HotSpot 기록, RSS는 OS의 실제 상주 페이지라 일치하지 않는다. |
| AOT cache vs CRaC vs Native Image | HotSpot 캐시 / JVM 상태 복원 / HotSpot 없는 네이티브 런타임으로 서로 다른 층위다. |

## 3. 내부 동작·원리

### 3.1 cgroup 한도에서 JVM 기본값까지

Linux 컨테이너는 호스트 커널을 공유한다. 런타임은 프로세스를 cgroup에 넣어 메모리와 CPU 사용을 제한한다. HotSpot은 컨테이너 지원으로 사용 가능한 메모리·프로세서를 감지해 힙과 내부 풀의 기본값을 계산한다. Java 25 문서는 이 지원이 Linux 전용이며 `UseContainerSupport` 기본값이 `true`라고 명시한다.

```text
컨테이너 런타임 → cgroup 한도 → Linux 커널 → HotSpot 컨테이너 인식
                                                 ├─ 메모리 → 힙 산정
                                                 └─ CPU 수 → 내부 풀 산정
                                                     ↓
                  힙 + 비힙 + 스택 + 네이티브 + 매핑 페이지가 메모리 limit 공유
                                                     ↓
                                       한도 초과 → OOMKilled 가능
```

기대와 다른 값이 보이면 옵션을 바꾸기 전에 JVM 관측값부터 확인한다.

```bash
java -Xlog:os+container=trace -XshowSettings:system -XX:+PrintCommandLineFlags -version
```

`-Xlog:os+container=trace`는 감지 과정, `-XshowSettings:system`은 시스템 설정을 확인한다. Linux 컨테이너 안에서 실행해야 cgroup 결과를 본다.

### 3.2 힙 백분율과 전체 메모리 예산

대략 최대 힙은 `R × MaxRAMPercentage / 100`이다. `R`은 JVM이 최대 메모리로 인식한 기준이다. Java 25 `MaxRAMPercentage` 기본값은 25.0, `InitialRAMPercentage` 기본값은 1.5625다. 두 비율은 전체 프로세스 limit이 아니다. `-Xmx`와 `-Xms`를 명시하면 실제 유효값이 바뀔 수 있으므로 `-XX:+PrintFlagsFinal`로 확인한다.

1GiB를 기준으로 `MaxRAMPercentage=50`이면 최대 힙은 대략 512MiB다. 남은 절반은 Metaspace, JIT code cache, GC 자료구조, 스레드 스택, direct buffer, JNI 라이브러리와 매핑 페이지가 나눠 쓴다. 스레드·요청·GC 피크도 고려한다.

```text
컨테이너 메모리 limit = Java heap + Metaspace/code cache/GC
                      + thread stack + direct/native + 매핑 페이지 + 피크 여유
```

이는 정확한 덧셈식이 아니다. 일부 페이지는 공유되고 주소 공간 예약은 곧바로 RSS가 되지 않는다. 힙 상한을 정한 뒤 cgroup 사용량·RSS·NMT로 안전 여유를 확인한다.

### 3.3 CPU quota와 `ActiveProcessorCount`

CPU quota는 주기별 CPU 실행 시간을 제한한다. 0.5 CPU는 코어 절반을 따로 배정한다기보다 스레드들이 경쟁해도 평균 실행 시간이 제한된다는 뜻이다. `ActiveProcessorCount=N`은 GC와 ForkJoinPool 같은 JVM 풀 크기 산정에 쓸 CPU 수를 강제한다. `UseContainerSupport`가 꺼져 있어도 적용되지만 quota·affinity를 변경하거나 앱 스레드를 제한하지 않는다. quota와 감지값이 다를 때만 조정하고 throttling과 지연시간을 함께 본다.

### 3.4 힙, 네이티브 메모리, RSS와 NMT

힙 그래프가 평평해도 RSS가 증가할 수 있다. RSS는 상주 중인 힙 페이지뿐 아니라 스택, Metaspace, 코드 캐시, GC 구조, direct buffer, JNI 및 라이브러리·파일 매핑도 포함할 수 있다. 공유 CDS 페이지는 프로세스별 RSS를 단순 합산하면 중복 계산될 수 있다.

NMT는 HotSpot 내부 메모리를 `summary`(하위 시스템) 또는 `detail`(호출 위치)로 추적한다. 기본 꺼짐이며 Java 25 문서는 활성화 오버헤드를 5~10%로 기재한다. 제3자 native 코드, JDK 라이브러리와 CDS 아카이브 메모리 일부는 완전하게 추적하지 않는다. NMT committed와 RSS는 다른 관측값이므로 차이를 곧바로 누수로 단정할 수 없다.

```bash
# JVM 시작 때 켜야 한다. 실행 중 사후 활성화는 불가하다.
java -XX:NativeMemoryTracking=summary -jar service.jar
# 다른 터미널에서 (1은 예시 PID)
jcmd 1 VM.native_memory summary scale=MB
jcmd 1 VM.native_memory baseline
jcmd 1 VM.native_memory summary.diff scale=MB
```

### 3.5 Java OOM과 `OOMKilled`

| 결과 | JVM/커널에서 일어난 일 | 먼저 볼 증거 |
|---|---|---|
| `OutOfMemoryError: Java heap space` | JVM이 힙 할당 실패를 감지해 Java 예외를 던짐 | 오류, heap dump, GC 로그, 할당 추세 |
| `OutOfMemoryError: Metaspace` 등 | JVM이 특정 영역의 할당 한도에 도달 | 오류 종류, Metaspace/direct memory 관측 |
| `OOMKilled` | 한도 초과 후 커널/런타임이 강제 종료했을 수 있음 | Pod 상태·이벤트, cgroup 피크, 직전 RSS |

커널이 먼저 죽이면 JVM이 예외나 heap dump를 남기지 못한다. 종료 코드 137도 SIGKILL과 연관될 뿐 단독으로 OOM 증거가 아니다. 컨테이너 상태·이벤트와 같이 본다.

### 3.6 CDS, AppCDS, AOT cache

CDS는 클래스 메타데이터를 아카이브로 만들어 시작 때 매핑한다. Oracle Java 25 문서에 따르면 JDK 12부터 Oracle JDK에 기본 아카이브가 포함되고 기본 활성화된다. AppCDS는 앱 클래스도 공유해 여러 JVM의 중복과 시작 작업을 줄인다. 메모리 공유는 같은 호스트 내에서만 이뤄진다.

JEP 483은 JDK 24에서 전달된 AOT cache로 클래스 로딩·링킹 결과를 다음 JVM 시작에 재사용한다. JEP 514(JDK 25)는 캐시 생성 명령을 단순화했고, JEP 515(JDK 25)는 학습 실행의 메서드 프로파일을 캐시에 넣어 JIT 워밍업을 줄인다.

```bash
# JDK 25: 대표 실행으로 학습하며 캐시를 만든다.
java -XX:AOTCacheOutput=orders.aot -jar orders.jar
# 배포 실행
java -XX:AOTCache=orders.aot -jar orders.jar
```

AOT cache를 써도 HotSpot은 계속 실행된다. JEP 483 초기 범위는 JDK 내장 class loader가 classpath·module path·JDK에서 읽는 클래스이며 사용자 정의 class loader 클래스는 제외한다. 학습과 운영의 앱·JDK 구성이 다르면 캐시를 다시 만들고, 학습 중 외부 부작용이 발생하지 않도록 격리한다.

### 3.7 CRaC와 Native Image

CRaC는 준비된 JVM 상태를 체크포인트하고 복원해 시작·워밍업을 줄인다. 파일과 소켓 등 외부 자원은 체크포인트 전 닫고 복원 뒤 다시 획득하도록 조정한다. JDK 배포판·체크포인트 엔진 지원은 환경별로 검증해야 한다.

Native Image는 빌드 시 정적 reachability 분석으로 필요한 코드와 리소스를 찾아 OS별 네이티브 바이너리로 만든다. 리플렉션·프록시·동적 리소스는 분석에 잡히지 않을 수 있어 metadata가 필요하다. 빌드 시 초기화가 환경설정·비밀을 고정하지 않게 주의한다. 실행 때 HotSpot은 뜨지 않지만 GraalVM 런타임, Java heap과 GC는 남는다. HotSpot 플래그·NMT를 그대로 적용하면 안 된다. GraalVM 문서상 기본 GC는 저메모리 지향 Serial이다.

## 4. 코드로 확인

다음 두 순수 Java 예제는 `Runtime.availableProcessors()`와 JVM 관리 인터페이스의 최대 힙을 읽는다. 컨테이너에서 실행하면 JVM이 인식한 값을 확인할 수 있다. 두 파일 모두 지정 JDK 21로 실제 실행했다. 두 번째 예제의 `MEMORY_LIMIT_BYTES`는 cgroup을 자동 읽는 값이 아니라 예산 계산을 보여주기 위해 입력한 가상 한도다.

### 예제 1 — JVM이 인식한 CPU와 최대 힙

```java
import java.lang.management.ManagementFactory;

public class ContainerProbe {
    public static void main(String[] args) {
        long maxHeap = ManagementFactory.getMemoryMXBean()
                .getHeapMemoryUsage()
                .getMax();
        System.out.printf("availableProcessors=%d%n", Runtime.getRuntime().availableProcessors());
        System.out.printf("maxHeapMiB=%d%n", maxHeap / (1024 * 1024));
    }
}
```

```bash
java -XX:ActiveProcessorCount=2 -Xmx128m _scratch/J16/ContainerProbe.java
```

실제 출력:

```text
availableProcessors=2
maxHeapMiB=128
```

### 예제 2 — 힙 최대치가 컨테이너 예산에서 차지하는 양

```java
import java.lang.management.ManagementFactory;

public class MemoryBudget {
    public static void main(String[] args) {
        long containerBudget = Long.parseLong(System.getenv("MEMORY_LIMIT_BYTES"));
        long maxHeap = ManagementFactory.getMemoryMXBean()
                .getHeapMemoryUsage()
                .getMax();
        long remaining = containerBudget - maxHeap;
        System.out.printf("containerBudgetMiB=%d%n", containerBudget / (1024 * 1024));
        System.out.printf("maxHeapMiB=%d%n", maxHeap / (1024 * 1024));
        System.out.printf("remainingBudgetMiB=%d%n", remaining / (1024 * 1024));
    }
}
```

```bash
MEMORY_LIMIT_BYTES=1073741824 java -Xmx640m _scratch/J16/MemoryBudget.java
```

실제 출력:

```text
containerBudgetMiB=1024
maxHeapMiB=640
remainingBudgetMiB=384
```

384MiB는 네이티브 여유가 충분하다는 뜻이 아니다. 예산에서 힙 상한을 뺀 단순 잔여량이므로 실제 RSS·cgroup 피크와 비교해야 한다.

### 예제 3 — 컨테이너 감지와 유효 플래그 확인

```bash
java -Xlog:os+container=trace -XX:+PrintFlagsFinal -XshowSettings:system -version 2>&1 \
  | grep -E 'container|MaxRAM|RAMPercentage|ActiveProcessorCount|UseContainerSupport'
```

이 진단은 Linux 컨테이너에서 수행한다. 호스트 macOS에서 실행하면 Linux cgroup을 조회할 수 없다. 플래그 출력은 실제 JVM 버전과 명령행 인자에 따라 달라지므로, 배포 이미지 안에서 관측한다.

## 5. 버전별 변화 — 왜 바뀌었나

| 시기 | 변화와 이전 방식의 한계 | 근거 |
|---|---|---|
| Java 컨테이너 인식의 초기 제안 | JEP 8182070은 cgroup 기반 컨테이너 인식과 내부 자원 정보 API를 제안했지만 현재 상태는 `Closed / Withdrawn`인 draft다. 이 문서만으로 기능 최초 정식 제공 릴리스를 특정하지 않는다. 현재 Java 25 명령 문서에는 Linux 컨테이너 자동 감지 옵션이 기재돼 있다. | [JEP draft 8182070](https://openjdk.org/jeps/8182070), [Java 25 `java` command](https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html) |
| JDK 12부터 (Oracle JDK 문서 기준) | 기본 CDS 아카이브를 배포해 매 JVM 시작마다 JDK 클래스 메타데이터를 다시 만드는 비용과 여러 JVM의 중복을 줄였다. | [Class Data Sharing](https://docs.oracle.com/en/java/javase/25/vm/class-data-sharing.html) |
| JDK 24 — JEP 483 | 클래스 로딩·링킹을 매번 처음부터 수행하던 시작 비용을 이전 실행에서 만든 AOT cache로 옮겼다. 클래스가 미리 로드·링크된 형태로 다음 JVM에 제공된다. | [JEP 483](https://openjdk.org/jeps/483) |
| JDK 25 — JEP 514 | JDK 24의 record/create 2단계 명령은 일반적인 사용에 번거로웠다. `AOTCacheOutput`으로 보통의 학습·생성 절차를 단순화했다. | [JEP 514](https://openjdk.org/jeps/514) |
| JDK 25 — JEP 515 | 클래스 시작 시간을 줄여도 JIT 프로파일을 새로 모으는 워밍업은 남았다. 이전 실행의 메서드 프로파일을 AOT cache에 저장해 시작 직후 컴파일을 진행하도록 했다. | [JEP 515](https://openjdk.org/jeps/515) |
| CRaC | OpenJDK CRaC는 체크포인트·복원 생명주기 API와 통합을 연구하는 프로젝트다. 이 자료에서 읽은 프로젝트 문서는 이를 특정 JDK 메이저의 표준 옵션으로 규정하지 않으므로 실제 배포판 지원 버전은 별도 확인한다. | [OpenJDK CRaC](https://openjdk.org/projects/crac/) |

## 6. 실무 가이드

- if Linux에서 HotSpot을 컨테이너로 실행한다면 then 기본 `UseContainerSupport`를 유지한다. cgroup 제한을 JVM 기본 산정에 반영한다.
- if 첫 배포라 RSS 프로파일이 없다면 then `-Xmx=limit`으로 잡지 않는다. **기본값 추천은 JDK 25 HotSpot에서 컨테이너 인식을 켜고 `MaxRAMPercentage` 기본값으로 시작해 부하 피크를 관찰하는 것**이다. 기본 25%가 처리량 요구에 부족하면 측정 결과를 근거로 올린다.
- if 힙 비율을 조정한다면 then 스레드 수, direct buffer, Metaspace, RSS 피크와 여유를 함께 본다. 힙만으로 컨테이너 limit을 채우지 않는다.
- if CPU 감지값이 quota와 어긋난다면 then `-Xlog:os+container=trace`로 확인하고 필요할 때만 `-XX:ActiveProcessorCount=N`을 쓴다. CPU throttling도 확인한다.
- if 힙은 평평한데 RSS가 증가한다면 then cgroup/RSS를 확보하고 재현 JVM 시작 때부터 NMT를 켠다. NMT 추적 범위 밖도 조사한다.
- if 기동이 병목이면 then CDS/AppCDS/AOT cache를 검토한다. 초기 요청 워밍업까지 문제면 JDK 25 JEP 515 학습 프로파일을 실제 운영 패턴으로 검증한다.
- if 복원 가능한 준비 JVM이 필요하면 then 지원 JDK·CRaC 엔진을 확인하고 파일·소켓을 복원 후 재연결하도록 한다.
- if 베이스 이미지를 고른다면 then 호환성이 우선일 때 벤더 JRE, 포함 모듈을 줄일 때 jlink, 셸·패키지 관리자를 빼고 싶을 때 distroless를 비교한다. JRE/jlink는 Java 런타임 구성, distroless는 OS 이미지 구성이라 서로 조합할 수 있다. 리플렉션·서비스 로더 기반 모듈 누락과 디버깅 절차를 검증한다.
- if 동적 기능을 제한할 수 있고 기동/footprint가 우선이면 then Native Image를 검토한다. reachability metadata와 플랫폼별 제약을 시험하고 HotSpot 옵션을 옮기지 않는다.

Spring Boot 레이어드 JAR·buildpacks·Spring AOT/native 빌드는 여기서 다루지 않는다 → S19 참조.

## 7. 함정·안티패턴

1. **증상:** 힙이 `-Xmx`에 닿기 전에 `OOMKilled`. → **원인:** limit을 힙으로 다 써 네이티브 영역이 모자란다. → **대처:** 힙 상한을 낮추거나 limit을 늘리고 cgroup/RSS/NMT를 수집한다.
2. **증상:** heap dump 없이 종료 코드 137. → **원인:** JVM보다 커널이 먼저 프로세스를 죽였을 수 있다. → **대처:** 상태·이벤트·메모리 피크를 확인한다. 137만으로 OOM을 단정하지 않는다.
3. **증상:** 힙은 안정적인데 RSS 상승. → **원인:** native, 스택, direct buffer, 매핑 페이지를 힙 그래프에서 못 본다. → **대처:** RSS와 NMT를 대조하고 NMT 밖 라이브러리/매핑도 조사한다.
4. **증상:** CPU limit을 낮춰도 지연시간 악화. → **원인:** `ActiveProcessorCount`가 quota를 조정한다고 오해하거나 스레드 풀 크기를 검증하지 않았다. → **대처:** JVM 감지값·풀 크기를 확인하고 필요할 때만 재정의한다.
5. **증상:** NMT보다 RSS가 훨씬 크다. → **원인:** NMT가 제3자 native와 일부 공유 메모리를 추적하지 않는다. → **대처:** 차이를 누수로 단정하지 말고 OS 매핑과 cgroup 지표를 본다.
6. **증상:** AOT cache 효과가 없거나 CRaC 복원 뒤 연결이 실패한다. → **원인:** 학습 프로파일이 운영과 다르거나 체크포인트 전 외부 자원을 정리하지 않았다. → **대처:** 운영 경로로 다시 학습하고 복원 시 자원을 재획득한다.
7. **증상:** jlink/Native Image에서 클래스·리소스를 찾지 못한다. → **원인:** 동적 의존성을 정적 분석이 발견하지 못했다. → **대처:** 통합 테스트로 모듈이나 reachability metadata를 보완한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. 컨테이너에서 `-Xmx`를 memory limit과 같게 주면 왜 위험한가?

힙은 JVM 프로세스 메모리의 일부다. Metaspace, 코드 캐시, GC 구조, 스택과 direct/native 영역도 같은 컨테이너 한도를 쓴다. `-Xmx`가 한도를 다 차지하면 힙이 꽉 차기 전에 커널 OOM이 날 수 있다.

**꼬리질문:** 힙 상한은 무엇으로 정하는가? **답:** `MaxRAMPercentage`나 `-Xmx`로 정하되 cgroup 피크와 비힙 여유로 검증한다.

### Q2. `OutOfMemoryError`와 `OOMKilled`는 같은 문제인가?

아니다. `OutOfMemoryError`는 JVM이 할당 실패를 감지해 던지는 Java 예외다. `OOMKilled`는 커널/런타임 강제 종료 상태로 JVM 로그나 dump가 없을 수 있다. 종료 코드만 아니라 상태와 이벤트를 확인한다.

**꼬리질문:** exit code 137이면 무조건 OOM인가? **답:** 아니다. SIGKILL과 연관되지만 다른 강제 종료도 가능하다.

### Q3. `MaxRAMPercentage`와 `InitialRAMPercentage`의 차이는?

전자는 최대 힙, 후자는 초기 힙을 JVM 인식 메모리 비율로 계산한다. 둘 다 프로세스 전체 한도가 아니다. `-Xmx`/`-Xms`가 있을 때는 유효값을 확인한다.

**꼬리질문:** MaxRAMPercentage를 컨테이너 limit까지 올려도 되는가? **답:** 비힙 영역이 남지 않으므로 위험하다. RSS와 네이티브 피크를 먼저 본다.

### Q4. CPU quota와 `ActiveProcessorCount`의 차이는?

quota는 커널이 주는 CPU 실행 시간을 제한한다. `ActiveProcessorCount`는 JVM 내부 풀의 크기 산정값을 바꾼다. 실제 quota나 앱 스레드 수를 변경하지 않는다.

**꼬리질문:** 언제 강제 지정하는가? **답:** 감지값이 실제 limit과 어긋난 것을 확인한 뒤 제한적으로 사용하고 throttling·latency를 검증한다.

### Q5. NMT와 RSS가 왜 다를 수 있는가?

NMT는 HotSpot 내부 메모리를 추적하고 RSS는 OS의 상주 페이지를 센다. NMT는 제3자 native와 일부 공유 영역을 온전히 포함하지 않고 committed와 RSS도 같은 뜻이 아니다. 범위가 다른 지표다.

**꼬리질문:** NMT가 전체 누수를 찾는가? **답:** 아니다. cgroup/RSS와 함께 보고 NMT 밖 할당을 조사한다.

### Q6. CDS/AOT cache, CRaC, Native Image는 어떻게 다른가?

CDS/AOT cache는 HotSpot 시작·워밍업을 위해 클래스 데이터나 프로파일을 재사용한다. CRaC는 JVM 프로세스 상태를 체크포인트하고 자원을 조정해 복원한다. Native Image는 HotSpot 없이 별도 네이티브 런타임으로 실행한다.

**꼬리질문:** Native Image도 Java heap을 쓰는가? **답:** 그렇다. GraalVM 런타임의 Java heap/GC는 있지만 HotSpot 자체는 아니다.

## 9. 참고문헌

- JEP 483 — https://openjdk.org/jeps/483 — JDK 24 AOT class loading/linking.
- JEP 514 — https://openjdk.org/jeps/514 — JDK 25 AOT cache 명령.
- JEP 515 — https://openjdk.org/jeps/515 — 메서드 프로파일과 워밍업.
- Class Data Sharing — https://docs.oracle.com/en/java/javase/25/vm/class-data-sharing.html — CDS/AppCDS 개요.
- The `java` Command — https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html — 컨테이너·메모리·CPU 옵션.
- Native Memory Tracking — https://docs.oracle.com/en/java/javase/25/vm/native-memory-tracking.html — NMT 범위와 사용법.
- JEP draft 8182070 — https://openjdk.org/jeps/8182070 — 초기 컨테이너 인식 제안.
- OpenJDK: CRaC — https://openjdk.org/projects/crac/ — 프로젝트 목표.
- What CRaC is — https://crac.github.io/about/about-crac/index.html — 복원 전후 자원 조정.
- Native Image — https://www.graalvm.org/latest/reference-manual/native-image/ — 빌드와 정적 분석.
- Memory Management — https://docs.oracle.com/en/graalvm/jdk/25/docs/reference-manual/native-image/optimizations-and-performance/MemoryManagement/ — 자체 런타임·GC.
- JEP 282: jlink: The Java Linker — https://openjdk.org/jeps/282 — 모듈 의존성 기반 사용자 정의 런타임 이미지.
- GoogleContainerTools/distroless — https://github.com/GoogleContainerTools/distroless — 셸 없는 런타임 이미지.
