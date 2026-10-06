# J17. Java 버전 로드맵·LTS·마이그레이션

> 3줄 요약 — Java는 6개월마다 기능 릴리스가 나오고, 2023년 Java 21부터 LTS 간격은 2년이다.
> 운영 기본값은 공급자의 지원 기간과 애플리케이션 호환성을 함께 확인한 LTS이며, 기준일에는 Java 25가 그 선택지다.
> 마이그레이션은 소스 컴파일만 통과시키는 일이 아니라 JDK 내부 API·제거 API·배포판 지원 정책·운영 옵션까지 검증하는 작업이다.

## 1. 왜 알아야 하나

운영 중인 서비스가 Java 8에서 Java 17로 올라간 뒤 갑자기 시작하지 않는 경우가 있다. `sun.misc`가 아닌 내부 JDK 클래스에 리플렉션으로 접근하던 라이브러리가 Java 17의 강한 캡슐화에 막혔기 때문이다. Java 11에서는 Java EE와 CORBA 모듈이 JDK에서 빠졌고, Java 17에서는 RMI Activation과 실험적 AOT/JIT 컴파일러가 제거됐다. “바이트코드 버전만 올리면 된다”는 마이그레이션 계획이 깨지는 지점이다.

반대로 오래된 버전에 머물러도 비용이 생긴다. Java 17은 기능적으로 안정적이어도 공급자별 지원 종료일이 다르고, 보안 패치·컨테이너 베이스 이미지·프레임워크의 최소 JDK 요구사항이 먼저 바뀐다. 기준일의 Oracle 표만 보더라도 Oracle JDK 17의 Premier Support 종료는 2026-09-30, 21은 2028-09-30, 25는 2030-09-30이다. 같은 “Java 17”이라도 Corretto, Temurin, Zulu의 지원 종료일은 동일하다고 가정하면 안 된다.

면접에서도 LTS를 “장기 지원되는 특별한 언어 버전”이라고만 답하면 부족하다. LTS는 Java 사양의 별도 종류가 아니라 공급자들이 장기 유지보수를 약속하는 릴리스 라벨이다. 기능 릴리스는 6개월마다 나오며, LTS가 아닌 26·27은 운영에 선택할 수 없는 버전이라는 뜻이 아니라 짧은 수명과 마이그레이션 비용을 감수하고 최신 기능을 검증하는 버전이라는 뜻이다.

## 2. 핵심 개념

| 용어 | 뜻 | 실무 판단 |
|---|---|---|
| Feature release | 6개월마다 나오는 Java SE 기능 릴리스 | 새 언어·JVM·라이브러리를 먼저 검증하는 채널 |
| LTS | 공급자들이 장기 지원 대상으로 지정한 릴리스 | 운영 기준선으로 삼기 좋지만 공급자별 정책 확인 필요 |
| GA | General Availability, 정식 배포 시작 | Early Access·Preview와 달리 제품 빌드 후보 |
| Preview | 구현·사양은 있지만 최종 확정 전인 기능 | 컴파일·실행에 `--enable-preview`; 운영 의존 금지 |
| Incubator | API를 피드백 받기 위한 비최종 모듈 | API·패키지명이 바뀔 수 있음 |
| JDK | 컴파일러, 런처, 도구, JVM, 표준 라이브러리 묶음 | 개발·빌드·운영 이미지 모두 버전을 고정 |
| JRE | 실행에 필요한 런타임이라는 전통적 구분 | 현대 JDK 배포판은 별도 JRE 배포를 보장하지 않을 수 있음 |
| 배포판(distribution) | OpenJDK 소스에서 빌드·시험·패치한 공급자별 바이너리 | 라이선스보다 지원 SLA·패치 일정까지 비교 |
| 바이너리 호환성 | 기존 `.class`를 새 JVM이 읽고 실행하는 성질 | 소스·리플렉션·네이티브 라이브러리 호환성과 다름 |

LTS와 최신 버전은 다음처럼 비교한다.

| 구분 | LTS | 비LTS 기능 릴리스 |
|---|---|---|
| 목적 | 장기간 보안 패치와 안정적 운영 | 다음 LTS에 들어갈 기능의 조기 검증 |
| 업그레이드 압력 | 대체로 2년 주기의 계획적 전환 | 약 6개월 안에 다음 릴리스로 이동 |
| 위험 | 오래 머물면 누적된 마이그레이션 위험 | 짧은 지원 기간, Preview 의존 위험 |
| 추천 | 운영 기본값 | 플랫폼·라이브러리 호환성 검증, 실험/특정 요구 |

“OpenJDK”와 “Oracle JDK”도 같은 말이 아니다. OpenJDK는 프로젝트와 참조 구현·소스 생태계를 가리키며, Oracle JDK는 TCK 인증된 OpenJDK 기반의 Oracle 빌드이자 Oracle의 상업적 지원 정책을 가진 제품이다. Temurin은 Eclipse Adoptium의 TCK 인증·AQAvit 검증 빌드, Corretto는 Amazon이 장기 지원하는 OpenJDK 빌드, Zulu는 Azul의 OpenJDK 제품군이다.

## 3. 내부 동작·원리

### 3.1 릴리스가 6개월 주기가 된 이유

Java 9까지는 큰 기능을 한 릴리스에 오래 모으는 방식이었다. 기능을 기다리는 시간이 길고, 한 번에 바뀌는 범위가 커서 피드백이 늦었다. 6개월 주기는 기능을 작은 단위로 통합하고, 다음 릴리스에서 계속 다듬는 흐름을 만든다. 그래서 “Java 25의 기능”에는 정식 기능뿐 아니라 Preview·Incubator가 함께 보인다.

```text
main 개발선
   │  기능 통합 → 테스트 → rampdown → RC
   ▼
6개월마다 GA 기능 릴리스 ──→ 다음 기능 릴리스
          └─ 공급자가 장기 유지보수 대상으로 지정하면 LTS
```

Oracle 지원 로드맵은 Java 10 이후 6개월 주기, OpenJDK 17 이후 2년 주기의 새 LTS를 명시한다. LTS라는 사실이 모든 배포판에 동일한 종료일을 강제하지는 않는다. Oracle은 Premier Support와 Extended Support를 나누고, Corretto는 자체 무료 지원 종료일을 정하며, Azul은 LTS에 Production Support와 Extended Support를 별도로 둔다.

### 3.2 기능이 언어에 들어오는 단계

JEP가 제안되면 구현이 곧바로 영구 표준이 되는 것이 아니다. Preview 언어 기능은 `javac --enable-preview --release N`으로 시험하고, 실행도 같은 계열의 `java --enable-preview`가 필요하다. Incubator API는 모듈 경로와 `--add-modules`가 필요할 수 있다. 최종화된 기능만 장기 소스 계약으로 취급해야 한다.

예를 들어 Java 21의 Virtual Threads(JEP 444), Sequenced Collections(JEP 431), Record Patterns(JEP 440), Pattern Matching for `switch`(JEP 441)는 정식 기능이다. 반면 Structured Concurrency(JEP 453), Scoped Values(JEP 446)는 당시 Preview였다. Java 25의 Scoped Values(JEP 506)는 정식화됐지만 Structured Concurrency(JEP 505)는 여전히 Preview다. 같은 이름의 기능이라도 “언제 처음 나왔는가”와 “언제 최종화됐는가”를 구분해야 한다.

### 3.3 호환성은 여러 층이다

```text
소스 코드 ─javac─> class 파일 ─JVM─> 실행
   │                 │              │
  API/문법           class-file      내부 API·리플렉션·옵션
  변경               major 버전      native/JNI·GC·TLS
```

새 JDK의 JVM은 보통 이전 class 파일을 읽지만, 반대 방향은 안 된다. `--release`는 현재 JDK에 존재하는 API를 실수로 사용하면서 낮은 바이트코드만 생성하는 문제를 줄인다. 그러나 `jdeps`가 찾지 못하는 리플렉션 문자열, 서비스 로더, JNI, 실행 시 생성되는 클래스까지 자동으로 보장하지는 않는다.

Java 17의 JEP 403은 JDK 내부 요소를 강하게 캡슐화했다. 과거의 `--illegal-access` 완화에 기대던 라이브러리는 표준 API로 바꾸거나, 모듈별 `--add-opens`를 임시로 사용해야 한다. 임시 옵션은 원인 해결이 아니라 호환성 유예다. Java 11의 Java EE/CORBA 모듈 제거처럼 컴파일 단계에서 드러나는 변화도 있지만, JEP 407의 RMI Activation 제거처럼 특정 기능을 실제로 호출할 때만 드러나는 변화도 있다.

## 4. 코드로 확인

### 예제 1: 런타임 버전과 LTS 전환 지점 확인

아래는 Java 21에서 실행한 예제다. Java 21의 `SequencedCollection`과 Virtual Threads는 21에서 정식화된 API다.

```java
import java.util.List;
import java.util.SequencedCollection;
import java.util.concurrent.Executors;

public class VersionRoadmapDemo {
    public static void main(String[] args) throws Exception {
        System.out.println("runtime=" + Runtime.version().feature());

        SequencedCollection<String> releases =
                new java.util.ArrayList<>(List.of("17", "21", "25"));
        System.out.println("first=" + releases.getFirst() + ", last=" + releases.getLast());

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var task = executor.submit(() ->
                    "virtual-thread=" + Thread.currentThread().isVirtual());
            System.out.println(task.get());
        }
    }
}
```

실행 명령: `java _scratch/J17/VersionRoadmapDemo.java`

```text
runtime=21
first=17, last=25
virtual-thread=true
```

`Runtime.version().feature()`를 배포판 판별에 쓰면 안 된다. 이 값은 기능 버전만 알려준다. 실제 운영에서는 `java -version`, 컨테이너 이미지 digest, 공급자, 패치 레벨을 함께 기록한다.

### 예제 2: 낮은 실행 기준을 명시한 컴파일

소스 호환성을 검사하는 빌드에서는 설치된 JDK의 기본 API를 그대로 노출하지 말고 다음처럼 `--release`를 사용한다.

```bash
javac --release 21 -d out src/main/java/example/App.java
java -cp out example.App
```

이 명령은 Java 25 컴파일러로 실행해도 Java 21의 언어·표준 API를 기준으로 검사한다. 단, 실행할 JVM이 21 이상이어야 한다. Maven이면 `maven.compiler.release=21`, Gradle이면 `java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }`처럼 CI와 로컬의 기준을 고정한다. (Spring 예제 아님)

### 예제 3: 단계적 마이그레이션 진단

```bash
# 애플리케이션과 의존 JAR가 참조하는 JDK 내부/모듈 의존성
jdeps --multi-release 21 --recursive --jdk-internals build/libs/app.jar

# 컴파일된 클래스/JAR의 제거 예정 API 사용
jdeprscan --release 21 --class-path 'build/libs/lib/*' build/libs/app.jar
```

`jdeps`는 정적 바이트코드 참조와 모듈 의존성을 보여주고, `jdeprscan`은 deprecated-for-removal API 사용을 찾는다. 둘 다 리플렉션·문자열 기반 로딩·JNI를 완전히 찾아내지 못하므로 테스트와 운영 트래픽 검증이 필수다. 명령이 아무것도 출력하지 않았다는 사실도 “안전 증명”이 아니다.

## 5. 버전별 변화 — 왜 바뀌었나

아래 표의 기능명 뒤 JEP 번호가 담당 문서 링크다. 상세 문법은 J05, Spring Boot 3→4 전환은 S21에서 다룬다.

| 버전 | 핵심 변화 | 이전 방식의 한계 → 변화의 이유 |
|---|---|---|
| Java 8 (2014, LTS) | Lambda/Stream(JEP 126·335 계열), Default Methods, `java.time`, Optional | 익명 클래스·낡은 날짜 API가 반복 코드와 오류를 만들었다 → 함수형 컬렉션 처리와 불변 시간 타입을 표준화했다. |
| Java 11 (2018, LTS) | HTTP Client(JEP 321), 단일 파일 실행(JEP 330), Flight Recorder(JEP 328), TLS 1.3(JEP 332), ZGC 실험, Java EE/CORBA 모듈 제거(JEP 320) | 외부 HTTP 클라이언트와 별도 실행 포장이 필요했고 오래된 모듈이 JDK를 끌어안았다 → 표준 클라이언트·관측 도구를 넣고 비핵심 모듈을 제거했다. |
| Java 17 (2021, LTS) | Sealed Classes(JEP 409), 내부 API 강한 캡슐화(JEP 403), Pattern `switch` Preview(JEP 406), Security Manager 제거 예정(JEP 411), RMI Activation 제거(JEP 407) | 내부 API 의존과 오래된 보안/분산 기능이 업그레이드를 막았다 → 공개 API 경계를 강화하고 실제 사용이 거의 없는 기능을 정리했다. |
| Java 21 (2023, LTS) | Virtual Threads(JEP 444), Sequenced Collections(JEP 431), Record Patterns(JEP 440), `switch` 패턴(JEP 441), Generational ZGC(JEP 439), FFM 3차 Preview | 플랫폼 스레드 수에 묶인 동시성과 앞·뒤 순서 API의 불일치가 있었다 → 가벼운 동시성 단위와 일관된 컬렉션 계약을 정식화했다. |
| Java 25 (2025, LTS) | Scoped Values(JEP 506), Module Import Declarations(JEP 511), Compact Source Files/Instance Main(JEP 512), Flexible Constructor Bodies(JEP 513), KDF API(JEP 510), Compact Object Headers(JEP 519), Generational Shenandoah(JEP 521) | 컨텍스트 전달·초보 진입 코드·암호 API·객체 헤더 최적화가 각각 실험/장황한 방식에 머물렀다 → 관련 기능을 표준화하거나 생산 환경에 맞게 다듬었다. 다만 Structured Concurrency는 Preview다. |
| Java 26 (2026-03-17, 비LTS) | Applet API 제거(JEP 504), HTTP/3 Client(JEP 517), AOT Object Caching(JEP 516), G1 동기화 개선(JEP 522), `final` 변경 경고 준비(JEP 500), Structured Concurrency 6차 Preview | 브라우저 Applet은 오래전에 사용이 끝났고 HTTP/3·빠른 시작 요구가 커졌다 → 낡은 API를 제거하고 네트워크·시작 시간·GC를 개선했다. |
| Java 27 (2026-09-15, 비LTS) | G1을 모든 환경의 기본 GC로(JEP 523), PQ TLS 1.3 하이브리드 키 교환(JEP 527), Compact Object Headers 기본화(JEP 534), JFR 데이터 마스킹(JEP 536), Lazy Constants 3차 Preview(JEP 531) | 환경별 GC 선택과 양자컴퓨터 대비, 관측 데이터의 민감정보 노출이 운영 부담이었다 → 일반 기본값·암호·관측 안전성을 조정했다. |

Java 26·27은 “다음 LTS까지의 중간 실험”으로 보는 편이 안전하다. Preview·Incubator 기능을 사용하면 다음 릴리스에서 소스 수정이 생길 수 있고, Corretto FAQ도 26·27을 짧은 기능 릴리스로 분류한다. 장기 제품이면 25에서 검증하고, 26·27은 별도 호환성 파이프라인에서 시험한다.

## 6. 실무 가이드

기본값 추천은 **Java 25 LTS + 조직이 선택한 OpenJDK 배포판 1개 + `--release 25` 기준 빌드**다. 단, 현재 프레임워크·모니터링 에이전트가 25를 지원하지 않으면 지원되는 최신 LTS를 유지한다.

- 상황이 새 서비스이고 의존 라이브러리가 25를 지원하면 Java 25를 써라. 이유는 2026-09-28 기준 최신 LTS이며, 다음 LTS 전까지 기능 릴리스에 끌려가지 않는다.
- 상황이 이미 Java 21이고 제품 변경 위험이 크면 21을 유지하라. 이유는 21의 지원 창이 남아 있고, 25로 올릴 때 언어 기능보다 에이전트·네이티브 라이브러리·빌드 이미지 검증이 먼저다.
- 상황이 Java 8·11·17이면 먼저 17/21/25 중 목표를 정하고, 중간 버전을 실제 운영에 순차 배포할지 일괄 점프할지 정하라. 이유는 11의 모듈 제거, 17의 강한 캡슐화, 애플리케이션 프레임워크의 최소 버전이 위험을 결정하기 때문이다.
- 상황이 Virtual Threads를 고려하면 Java 21 이상에서 부하 테스트하라. 이유는 동기식 블로킹 코드의 확장성은 좋아져도 JDBC 커넥션 풀·외부 API rate limit·`ThreadLocal` 수명은 자동으로 해결되지 않는다.
- 상황이 HTTP/3가 필요하면 Java 26의 `HttpClient` 지원을 별도 검증하라. 이유는 애플리케이션 서버·프록시·로드밸런서가 HTTP/3를 지원해야 하며 JDK 버전만 올려서는 경로가 바뀌지 않는다.
- 상황이 6개월 릴리스의 기능이 꼭 필요하면 해당 릴리스와 공급자의 EOL을 배포 캘린더에 기록하라. 이유는 다음 기능 릴리스로 빠르게 이동하는 운영 책임이 생긴다.
- 상황이 배포판을 고르면 라이선스, TCK 인증, CPU/PSU 제공 시점, 지원 종료일, 상업 SLA를 표로 남겨라. 이유는 “무료 다운로드”와 “무료 보안 패치·장애 지원”이 같은 뜻이 아니기 때문이다.
- 상황이 Oracle JDK를 생산에 쓰면 계약·사용 형태·지원 등급을 구매 담당과 확인하라. Oracle의 무료 조건은 릴리스와 사용 목적에 따라 달라질 수 있다.
- 상황이 소스/바이너리 호환성을 확인하면 CI에서 `jdeps`, `jdeprscan`, `--release`, 전체 테스트, 실제 컨테이너 이미지를 한 세트로 실행하라. 이유는 각 도구가 서로 다른 층의 위험만 잡기 때문이다.
- 상황이 `--add-opens`로만 통과하면 이 옵션을 장애 티켓으로 등록하라. 이유는 내부 API 의존을 숨길 뿐 장기 호환성을 회복하지 않는다.

배포 전략은 다음 순서가 안전하다.

```text
목표 LTS/배포판 결정
 → 의존성·에이전트·네이티브 라이브러리 목록화
 → jdeps/jdeprscan + 컴파일
 → 단위/통합/성능/보안 테스트
 → 동일 이미지로 스테이징
 → 카나리에서 GC·CPU·지연·로그·TLS 확인
 → 롤백 가능한 프로덕션 전환
```

`javax.*`에서 `jakarta.*`로의 전환은 JDK 자체 변화가 아니라 Jakarta EE/Spring 생태계의 네임스페이스 전환이다. JDK 버전 업 계획에 섞어 한 줄로 추적하되, 실제 Spring Boot 전환은 S21을 참조한다.

## 7. 함정·안티패턴

1. **증상 →** “Java 21 LTS니까 2031년까지 모두 지원”이라고 계약서에 쓴다. **원인 →** Java 사양의 LTS와 Oracle·Corretto·Temurin·Zulu의 지원 기간을 동일시했다. **대처 →** 선택한 배포판의 버전별 EOL, CPU/PSU 일정, 상업 SLA를 증거 링크와 함께 고정한다.

2. **증상 →** Java 17에서 라이브러리 초기화 중 `InaccessibleObjectException`이 난다. **원인 →** `sun.*` 또는 공개 패키지 안의 비공개 JDK 요소를 리플렉션으로 열었다. **대처 →** 최신 라이브러리로 올리고 표준 API로 교체한다. 당장 `--add-opens`를 쓰더라도 제거 기한을 둔다.

3. **증상 →** 컴파일은 성공했지만 Java 11 실행에서 `ClassNotFoundException`이 난다. **원인 →** Java EE/CORBA 모듈이 JDK 11에서 제거됐거나, 예전 JDK에 우연히 있던 모듈을 런타임에 기대했다. **대처 →** 외부 의존성을 명시하고 `jdeps --print-module-deps`와 통합 테스트로 런타임 이미지를 점검한다.

4. **증상 →** `jdeprscan`은 깨끗하지만 신규 JDK에서 기능이 사라졌다. **원인 →** 리플렉션 문자열, 서비스 로더, JNI, 설정 파일은 정적 스캔이 놓친다. **대처 →** 검색 키워드(`sun.`, `com.sun.`, 제거 예정 API), 런타임 로그, 실제 대표 트래픽 테스트를 추가한다.

5. **증상 →** Java 26의 Preview 코드를 넣고 Java 27에서 빌드가 실패한다. **원인 →** Preview는 최종 API 계약이 아니며 릴리스별 `--enable-preview` 대상이 다르다. **대처 →** Preview는 실험 모듈로 격리하고, 운영 코드는 최종화된 기능만 사용한다.

6. **증상 →** Virtual Threads 도입 후 요청 수는 늘었지만 DB 대기열과 지연이 폭증한다. **원인 →** 스레드 비용만 줄고 DB 커넥션·외부 시스템 용량은 그대로다. **대처 →** 동시성 제한, 커넥션 풀, rate limit, 타임아웃을 별도로 설계하고 기존 플랫폼 스레드 대비 부하를 비교한다.

7. **증상 →** `javac -source 21 -target 21`인데 낮은 런타임에서 동작하지 않는다. **원인 →** 컴파일러가 현재 JDK의 새 API를 참조할 수 있다. **대처 →** `--release 21`과 toolchain을 사용하고, 실제 최소 런타임 이미지로 실행한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. LTS는 Java SE 사양의 어떤 특수한 종류인가?

아니다. Java 릴리스는 같은 Java SE 흐름에서 나오며 LTS는 공급자들이 장기 유지보수 대상으로 지정한 릴리스다. 따라서 “LTS=모든 벤더가 같은 날짜까지 지원”도 아니다. 지원 기간과 패치 정책은 배포판별로 확인한다.

꼬리질문: 기준일에 운영 기본값은? 답: 프레임워크 호환성을 확인한 Java 25 LTS를 우선 추천하고, 불가능하면 21 LTS를 유지한다.

### Q2. 6개월 릴리스와 2년 LTS 주기를 함께 설명하라.

기능 릴리스는 6개월 간격으로 빠르게 기능을 전달하고, LTS는 그중 장기 운영 대상으로 선택된다. Java 21부터 LTS 사이 간격은 2년이다. LTS가 아닌 Java 26·27은 검증 채널이지 자동으로 나쁜 버전은 아니다.

꼬리질문: 비LTS를 운영에 쓰는 조건은? 답: 짧은 EOL을 감당할 조직의 업그레이드 자동화와 명확한 기능 이득이 둘 다 있어야 한다.

### Q3. `--release`가 `-source`/`-target`보다 안전한 이유는?

`-source`와 `-target`은 문법과 class 파일 버전만 제한할 수 있어 현재 JDK의 새 API를 참조하는 실수를 남긴다. `--release N`은 해당 Java 릴리스의 언어, API, class 파일 기준을 함께 적용한다. 실행 JVM과 의존 라이브러리 호환성까지 대신 검증하지는 않는다.

꼬리질문: Java 25 컴파일러로 Java 21을 만들면? 답: `javac --release 21`로 컴파일하고 Java 21 이상에서 실행한다.

### Q4. `jdeps`와 `jdeprscan`의 차이는?

`jdeps`는 클래스가 어떤 모듈·패키지·JDK 내부 API를 참조하는지 정적 분석한다. `jdeprscan`은 deprecated 또는 removal 예정 API 사용을 탐지한다. 둘 다 리플렉션과 JNI를 완전히 분석하지 못하므로 테스트와 운영 관찰이 뒤따라야 한다.

꼬리질문: 스캔 결과가 0이면 마이그레이션 완료인가? 답: 아니다. 동적 로딩, 설정, 네이티브 코드, 에이전트는 별도 검증 대상이다.

### Q5. Java 17에서 내부 API 문제가 더 드러난 이유는?

JEP 403이 JDK 내부 요소를 강하게 캡슐화해 Java 9~16에서 완화되던 접근이 더 이상 단일 옵션으로 풀리지 않기 때문이다. 목적은 보안·유지보수 경계를 지키고 표준 API로 이동시키는 것이다. `--add-opens`는 임시 호환책이지 공개 계약이 아니다.

꼬리질문: 어떤 순서로 고치는가? 답: 문제 라이브러리 업그레이드, 표준 API 교체, 최후에 제한된 `--add-opens`와 제거 일정 순서다.

### Q6. Java 25와 Java 27 중 신규 서비스에 무엇을 고르는가?

기본은 Java 25 LTS다. Java 27은 G1 기본 GC, PQ TLS 하이브리드 교환 같은 변화가 있지만 비LTS이고 Preview·Incubator도 포함한다. 27의 특정 기능이 사업 요구이고 6개월 업그레이드 체계를 이미 운영할 때만 별도 선택한다.

꼬리질문: Java 26의 HTTP/3를 쓰려면 JDK만 바꾸면 되는가? 답: 아니다. 서버·프록시·로드밸런서·관측 도구까지 HTTP/3 경로를 검증해야 한다.

### Q7. Temurin·Corretto·Zulu·Oracle JDK를 어떻게 비교하는가?

먼저 모두 같은 Java SE 호환성(TCK) 계열인지 확인하고, 그다음 GPLv2+CPE 등 라이선스, 무료 패치 범위, 지원 종료일, 플랫폼, 상업 SLA를 비교한다. Corretto는 Amazon의 무료 장기 지원, Temurin은 Adoptium의 무료 OpenJDK 바이너리, Azul은 무료/상업 제품과 별도 지원 수명을 제공한다. Oracle은 제품 라이선스와 Oracle Support 정책을 따로 읽는다.

꼬리질문: “무료”만으로 결정하면 안 되는 이유는? 답: 무료 다운로드, 보안 업데이트, 장애 원인 분석 SLA는 서로 다른 권리이기 때문이다.

## 9. 참고문헌

- Oracle JDK — endoflife.date — 릴리스별 GA·Premier/Extended Support와 6개월/2년 주기 확인: https://endoflife.date/oracle-jdk
- Java SE Support Roadmap — Oracle — Oracle의 LTS·Premier·Extended 지원 정책과 일정: https://www.oracle.com/java/technologies/java-se-support-roadmap.html
- JDK 8 Features — OpenJDK — Lambda, 날짜/시간 API, 컬렉션·보안 API 등 Java 8 기능 목록: https://openjdk.org/projects/jdk8/features
- JDK 11/17/21/25/26/27 프로젝트 페이지 — OpenJDK — 각 릴리스의 GA 날짜와 JEP 목록: https://openjdk.org/projects/jdk/11/ · https://openjdk.org/projects/jdk/17/ · https://openjdk.org/projects/jdk/21/ · https://openjdk.org/projects/jdk/25/ · https://openjdk.org/projects/jdk/26/ · https://openjdk.org/projects/jdk/27/
- The Arrival of Java 26 — Oracle Java — Java 26의 JEP별 의도와 Preview·Incubator 설명: https://blogs.oracle.com/java/the-arrival-of-java-26
- Oracle JDK Migration Guide, Release 26 — Oracle — JDK 마이그레이션 절차 안내: https://docs.oracle.com/en/java/javase/26/migrate/index.html
- The `jdeps` Command — Oracle Java SE 26 Tools — JDK 내부 API·모듈 정적 분석 명령: https://docs.oracle.com/en/java/javase/26/docs/specs/man/jdeps.html
- The `jdeprscan` Command — Oracle Java SE 26 Tools — deprecated-for-removal API 탐지 명령: https://docs.oracle.com/en/java/javase/26/docs/specs/man/jdeprscan.html
- JEP 403: Strongly Encapsulate JDK Internals — OpenJDK — Java 17 내부 API 캡슐화 근거: https://openjdk.org/jeps/403
- JEP 407: Remove RMI Activation — OpenJDK — Java 17 제거 API와 제거 이유: https://openjdk.org/jeps/407
- Eclipse Temurin — Adoptium — TCK 인증·AQAvit 검증 OpenJDK 바이너리와 무료 배포 설명: https://adoptium.net/temurin/
- Amazon Corretto FAQs — AWS — GPLv2+CPE, 무료 장기 지원, 버전별 지원 캘린더: https://aws.amazon.com/corretto/faqs/
- Java Support Roadmap & Lifecycle — Azul — Zulu/Core/Prime의 LTS·STS 및 지원 기간: https://www.azul.com/products/azul-support-roadmap/
- Open Source, Fully Supported OpenJDK — Azul Core — 상업 지원 등급과 패치/SLA 차이: https://www.azul.com/products/core/
