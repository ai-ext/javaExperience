# J20. I/O·NIO·HttpClient·JDBC 기초

> 3줄 요약 — 바이트 스트림은 바이트, Reader는 문자이므로 경계에서 문자 인코딩을 명시한다.
> NIO의 `Buffer`는 `position`·`limit` 상태를 옮기며, `Selector`는 논블로킹 채널의 준비된 이벤트를 모아준다.
> JDBC 입력값은 `PreparedStatement` 바인딩으로 SQL 문법과 분리하고, 풀의 대기·연결 상한을 DB 예산에 맞춘다.

## 1. 왜 알아야 하나

UTF-8 파일을 기본 문자셋으로 읽으면 배포 환경에 따라 한글이 깨진다. 큰 파일을 `readAllBytes`로 읽으면 파일 크기만큼 힙을 잡고, 소켓을 동기 `read`하면 요청 스레드가 입력을 기다린다. NIO에서 `flip()`을 빼먹으면 버퍼에 쓴 데이터가 읽기 범위 밖에 남는다.

요청마다 DB 연결을 만들면 연결·인증 비용을 반복하고 DB 세션이 불어난다. 반대로 풀을 과도하게 키우면 느린 쿼리가 DB를 포화시켜 앱 대기만 늘린다. 사용자 값을 SQL 문자열에 붙이면 값이 SQL 문법이 되어 조회 조건을 우회할 수 있다. HTTP 요청도 타임아웃과 본문 소비 방식을 정하지 않으면 스레드·메모리가 응답을 기다리며 쌓인다.

## 2. 핵심 개념

| 용어 | 뜻 | 기억할 점 |
|---|---|---|
| `InputStream` / `OutputStream` | 바이트 입력·출력 추상화 | 문자 인코딩은 해석하지 않는다. |
| `Reader` / `Writer` | 문자 입력·출력 추상화 | 바이트 변환 경계에 `Charset`을 명시한다. |
| 버퍼링 | 작은 읽기·쓰기를 모아 호출 횟수를 줄이는 래퍼 | 전체 파일을 메모리에 올리는 동작이 아니다. |
| `Path` / `Files` | 파일 위치 값 / 파일 작업 API | `Path`는 열린 핸들이 아니며 `Files.lines` 결과는 닫아야 한다. |
| `Channel` / `Buffer` | 채널은 I/O 통로, 버퍼는 데이터와 위치 상태 | 한 번의 `read`·`write`가 전체를 처리한다고 가정하지 않는다. |
| `Selector` / `SelectionKey` | 채널 준비 이벤트 감시 / 등록·관심·준비 상태 | 논블로킹 채널을 등록하며 `select()` 자체는 기다릴 수 있다. |
| `HttpClient` / Request / Response | 재사용 클라이언트 / 요청 / 응답 | `send`는 동기, `sendAsync`는 `CompletableFuture`를 돌려준다. |
| `Connection` / `PreparedStatement` / `ResultSet` | DB 세션 / SQL과 파라미터 / 결과 커서 | 세 자원 모두 `try-with-resources`로 닫는다. |
| `DataSource` / 커넥션 풀 | 연결 공급 인터페이스 / 물리 연결 대여·반납 관리 | 풀 상한과 대기시간은 DB 예산에 맞춘다. |

### 헷갈리는 쌍

| 비교 | 핵심 차이 |
|---|---|
| `InputStream` vs `Reader` | 바이트 대 문자. Java 문자는 UTF-16 코드 단위라 보조 문자는 `char` 두 개일 수 있다. |
| 버퍼링 vs 전체 읽기 | 버퍼링은 하위 호출을 묶고, `readAllBytes`·`readString`은 전체 내용을 힙에 담는다. |
| 동기 vs 논블로킹 | 동기는 호출 스레드가 I/O를 기다린다. 논블로킹 채널은 지금 할 수 없는 작업에서 즉시 돌아올 수 있다. |
| `flip` vs `clear` vs `compact` | 읽기 모드 전환 / 새 쓰기 상태 / 미소비 데이터 보존 후 이어쓰기. |
| SQL 결합 vs 바인딩 | 결합은 사용자 값이 구문이 될 수 있고, `PreparedStatement` 값 바인딩은 둘을 분리한다. 식별자는 바인딩할 수 없다. |
| 물리 연결 vs 풀 연결 | 풀 연결을 닫으면 대개 세션 종료가 아니라 풀 반환이다. 닫지 않으면 다른 요청이 대기한다. |

## 3. 내부 동작·원리

### 3.1 바이트에서 문자까지

```text
파일/소켓 → InputStream.read(byte[]) → [선택] BufferedInputStream
         → InputStreamReader(CharsetDecoder) → [선택] BufferedReader → 앱
```

`read(byte[])`는 배열을 항상 가득 채우지 않는다. 네트워크는 일부 바이트만 도착할 수 있으므로 길이·구분자·EOF를 기준으로 반복한다. `available()`은 즉시 읽을 수 있는 양이지 입력 전체 길이가 아니다. `InputStreamReader`는 지정한 문자셋으로 바이트를 디코딩하므로 UTF-8처럼 인코딩을 명시한다. 전체 계층은 바깥 Reader를 `try-with-resources`로 닫아 함께 정리한다.

### 3.2 `Path`와 `Files`

`Path`는 파일 시스템 제공자가 해석할 위치이고, 파일을 연 자원이 아니다. `Files`가 실제 연산을 제공자에 위임한다. 크기가 작은 설정은 `readString`이 편하지만 큰 입력은 `newBufferedReader` 등으로 순차 처리한다. `Files.lines`·`walk`는 지연 스트림이므로 닫는다. `exists` 검사와 실제 열기 사이에 파일이 바뀔 수 있고, `ATOMIC_MOVE`도 제공자가 지원하지 않으면 실패할 수 있다.

### 3.3 NIO의 버퍼·채널·셀렉터

버퍼는 `0 ≤ mark ≤ position ≤ limit ≤ capacity`를 지킨다. 쓰기 뒤 `flip()`은 `limit=position`, `position=0`으로 바꿔 방금 기록한 범위를 읽게 한다. `clear()`는 내용이 아니라 상태를 초기화하고, `compact()`는 아직 안 읽은 바이트를 앞에 옮겨 다음 쓰기를 준비한다.

논블로킹 채널은 읽을 것이 없을 때 0을 반환할 수 있고, `write`도 일부만 보낼 수 있다. 이벤트 루프는 남은 버퍼를 연결별로 보존한다. `Selector`는 준비된 채널을 모으므로 연결마다 스레드를 대기시키지 않아도 되지만, `select()`는 준비 이벤트까지 호출 스레드를 재운다.

```text
채널을 non-blocking 설정·등록(OP_READ/OP_WRITE)
                 ↓
        Selector.select() 대기
                 ↓ 준비된 SelectionKey
       readyOps 확인 → 일부 읽기/쓰기
                 ↓
       연결별 버퍼·상태 갱신 → 반복
```

선택된 키는 `selectedKeys()`에서 처리 뒤 제거한다. `write`할 데이터가 없는데 `OP_WRITE`를 계속 구독하면 대부분 즉시 준비 상태라 루프가 바쁘게 돌 수 있다. 보낼 데이터가 남을 때만 쓰기를 구독한다. `Selector`는 소켓용이며 모든 파일 I/O에 쓸 수 있는 도구는 아니다. 직접 버퍼는 할당·회수 비용도 있으므로 측정 없이 기본으로 쓰지 않는다.

### 3.4 `HttpClient` 요청 흐름

클라이언트 빌더에서 타임아웃·프록시 등을 정하고 여러 요청에 재사용한다. 요청에는 URI·메서드·헤더·본문 게시자를 담고, 전송 시 응답 본문을 받을 `BodyHandler`를 선택한다. `send`는 호출이 응답을 기다리고, `sendAsync`는 `CompletableFuture<HttpResponse<T>>`를 반환한다. `ofString()`은 본문 전체를 메모리에 담는다. 큰 응답은 파일·스트림 소비를 선택하고 스트림을 닫는다. 연결 타임아웃과 전체 요청 제한은 다른 대기 구간을 제어한다.

### 3.5 JDBC와 풀

```text
DataSource에서 연결 대여 → Connection.prepareStatement(SQL ?)
 → setX(index, 값) → 실행 → ResultSet 순회 → close로 반환
```

`Connection`은 DB 세션이며 JDBC 기본 auto-commit은 켜져 있다. `PreparedStatement`는 SQL 텍스트와 `setString` 같은 값 설정 API를 분리한다. 드라이버가 실제 서버 준비문을 언제 생성하는지와 별개로, 앱에서 값을 SQL 문자열로 합치지 않는 경계가 핵심이다. `ResultSet`은 보통 행 커서다.

풀은 물리 연결을 재사용하고 대수를 제한한다. 유휴 연결이 없고 상한에 도달하면 `getConnection()` 호출은 기다리므로 풀은 대기열이기도 하다. 상한을 늘리면 DB 동시 쿼리가 증가해 포화를 악화시킬 수 있다. 인스턴스 수를 곱한 총 연결량과 DB 처리 용량으로 맞춘다. 트랜잭션·JPA는 각각 → S08, → S09 참조.

## 4. 코드로 확인

아래 세 예제는 JDK 21의 단일 파일 실행으로 실제 실행했다. HTTP 요청은 루프백 서버를 대상으로 해 외부 네트워크에 의존하지 않는다.

### 예제 1 — 문자 디코딩, 버퍼링, 파일 왕복

```java
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class IoDemo {
    public static void main(String[] args) throws Exception {
        String source = "alpha\n한글\n";
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        new ByteArrayInputStream(source.getBytes(StandardCharsets.UTF_8)),
                        StandardCharsets.UTF_8))) {
            String line;
            int number = 0;
            while ((line = reader.readLine()) != null) {
                System.out.printf("line[%d]=%s%n", number++, line);
            }
        }

        Path file = Files.createTempFile("j20-io-", ".txt");
        try {
            Files.writeString(file, source, StandardCharsets.UTF_8);
            System.out.println("fileRoundTrip=" + Files.readString(file, StandardCharsets.UTF_8)
                    .replace("\n", "|"));
        } finally {
            Files.deleteIfExists(file);
        }
        System.out.println("deleted=" + Files.notExists(file));
    }
}
```

실행 출력:

```text
line[0]=alpha
line[1]=한글
fileRoundTrip=alpha|한글|
deleted=true
```

### 예제 2 — `ByteBuffer` 읽기·쓰기 상태

```java
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

public class ByteBufferDemo {
    public static void main(String[] args) {
        ByteBuffer buffer = ByteBuffer.allocate(8);
        buffer.put("ABCD".getBytes(StandardCharsets.US_ASCII));
        System.out.printf("write: position=%d limit=%d%n", buffer.position(), buffer.limit());

        buffer.flip();
        byte first = buffer.get();
        System.out.println("consumed=" + (char) first);
        buffer.compact();
        System.out.printf("compact: position=%d limit=%d%n", buffer.position(), buffer.limit());

        buffer.put((byte) 'X');
        buffer.flip();
        System.out.println("remaining=" + StandardCharsets.US_ASCII.decode(buffer));
    }
}
```

실행 출력:

```text
write: position=4 limit=8
consumed=A
compact: position=3 limit=8
remaining=BCDX
```

### 예제 3 — `HttpClient.sendAsync`와 응답 본문 핸들러

루프백 서버를 사용한다. 실제 서비스에서는 서버 부분을 원격 URI로 바꾸고 요청·연결 시간 제한과 본문 핸들러를 그대로 정한다.

```java
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

public class HttpClientDemo {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/demo", exchange -> {
            byte[] body = "ok".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try (HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2)).build()) {
            HttpRequest request = HttpRequest.newBuilder(URI.create(
                    "http://127.0.0.1:" + server.getAddress().getPort() + "/demo"))
                    .timeout(Duration.ofSeconds(5)).GET().build();
            HttpResponse<String> response = client.sendAsync(
                    request, HttpResponse.BodyHandlers.ofString()).join();
            System.out.printf("status=%d body=%s version=%s%n",
                    response.statusCode(), response.body(), response.version());
        } finally {
            server.stop(0);
        }
    }
}
```

실행 출력:

```text
status=200 body=ok version=HTTP_1_1
```

## 5. 버전별 변화 — 왜 바뀌었나

| 버전 | 변화와 이전 한계 | 근거 |
|---|---|---|
| Java 7 | `Path`·`Files` 중심의 NIO.2가 파일·디렉터리 작업을 플랫폼 제공자 API로 정리했다. 이전 `File` 중심 API는 작업 종류와 오류 표현이 제한적이었다. | [Files API](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/file/Files.html) |
| Java 9 | JEP 290이 역직렬화 입력에 클래스 및 객체 그래프 복잡도 필터를 적용하는 통로를 추가했다. 기존 `ObjectInputStream`은 입력이 만드는 객체 종류·그래프 크기를 제한할 표준 지점이 부족했다. | [JEP 290](https://openjdk.org/jeps/290) |
| Java 9 → 10 → 11 | HTTP Client는 9·10에서 인큐베이팅을 거쳐 Java 11에서 `java.net.http` 표준 API가 됐다. 기존 `HttpURLConnection`보다 HTTP/2, 비동기 `CompletableFuture`, Flow 기반 본문 흐름을 표준 API로 제공하려는 변화다. | [JEP 321](https://openjdk.org/jeps/321) |
| Java 17 | JEP 415가 역직렬화 작업마다 컨텍스트에 맞는 필터를 선택할 JVM-wide factory를 추가했다. 단일 전역 정책만으로 서로 다른 입력 경계의 허용 클래스를 구분하기 어려웠다. | [JEP 415](https://openjdk.org/jeps/415) |

이 문서에서 다룬 기본 `InputStream`·`Reader`·`Buffer`·`Channel`·`Selector` 사용 원리는 Java 25에서도 유효하다. Java 25 기준 `HttpClient` API 문서는 종료·대기 메서드까지 제공하므로 장기 실행 클라이언트의 수명도 관리할 수 있다. Boot 4.1.1의 의존성 기준 HikariCP는 7.0.2다. 버전 숫자보다 프로젝트 BOM이 실제 채택 버전을 결정한다.

## 6. 실무 가이드

- 텍스트 경계에는 UTF-8을 명시한다. 큰 파일은 전체 문자열보다 버퍼 스트림으로 순차 처리한다.
- 동시 소켓 연결이 많아 스레드 대기가 병목일 때 Selector를 검토한다. 연결 수가 적고 단순한 작업은 동기 I/O를 기본으로 둔다.
- HTTP 클라이언트는 애플리케이션 수명 동안 재사용한다. 연결·요청 제한을 지정하고 본문 크기에 맞는 핸들러를 선택한다.
- 일반 Boot 서비스의 기본 선택은 관리되는 `DataSource`에서 빌려 `try-with-resources`로 반납하는 것이다. Boot 4.1.1 기준 HikariCP 7.0.2를 쓰고, 풀 상한은 전체 인스턴스 수와 DB 연결 예산에 맞춘다.
- 외부 SQL 값은 `PreparedStatement`에 바인딩한다. 열 이름 등 식별자는 허용 목록에서 고른다.
- Java 역직렬화 입력은 기본적으로 신뢰하지 않는다. 불가피하면 필터와 스키마 검증을 함께 적용한다.

HikariCP README 기준 `connectionTimeout` 기본은 30초, `idleTimeout`은 10분, `leakDetectionThreshold` 0은 비활성이다. 대기 시간을 늘려도 DB 처리량은 늘지 않으며, 누수 탐지는 진단 기준으로 쓴다.

## 7. 함정·안티패턴

1. **증상:** 한글이 환경별로 깨진다 → **원인:** 기본 문자셋에 의존 → **대처:** 경계에 `UTF_8`을 지정하고 엄격한 검증은 디코더 `REPORT`를 쓴다.
2. **증상:** 대형 파일에서 OOM → **원인:** 전체 입력을 배열·문자열에 적재 → **대처:** 스트리밍으로 처리하고 최대 크기를 검증한다.
3. **증상:** NIO 버퍼가 비어 보이거나 데이터를 잃는다 → **원인:** `flip`·`compact`·`clear` 상태 오해 → **대처:** 읽기 전환과 잔여 데이터 보존을 구분한다.
4. **증상:** Selector 이벤트 루프 CPU가 높다 → **원인:** 선택 키를 남기거나 출력이 없는데 `OP_WRITE` 구독 → **대처:** 처리 키를 제거하고 출력이 있을 때만 쓰기를 구독한다.
5. **증상:** HTTP 응답 지연에 스레드·힙이 쌓인다 → **원인:** 타임아웃 누락 또는 큰 본문 전체 문자열화 → **대처:** 각 타임아웃과 소비 핸들러를 정한다.
6. **증상:** 특수 입력이 조회 결과를 바꾼다 → **원인:** 입력을 SQL 문자열에 연결 → **대처:** `PreparedStatement` 값 바인딩, 식별자는 허용 목록을 쓴다.
7. **증상:** DB 연결 대기와 CPU가 함께 증가한다 → **원인:** 누수·느린 쿼리 상태에서 풀만 확장 → **대처:** close 경로와 쿼리를 먼저 진단하고 전체 연결 예산을 지킨다.
8. **증상:** 역직렬화 중 의도치 않은 클래스 동작·자원 폭증 → **원인:** 신뢰하지 않는 `ObjectInputStream` 데이터 → **대처:** 스키마 포맷으로 바꾸거나 허용 클래스와 그래프 한계를 필터링한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `InputStream.read(byte[])`가 배열 전체를 채운다고 가정하면?

네트워크 등은 일부 바이트만 준비돼 반환될 수 있다. 길이·구분자·EOF에 도달할 때까지 읽기를 반복한다. `available()`은 전체 스트림 길이가 아니다.

**꼬리질문:** `available()`이 파일 크기를 돌려주나? **답:** 아니다. 즉시 읽을 수 있는 추정량이다.

### Q2. 바이트를 `Reader`로 바꿀 때 문자셋이 왜 필요한가?

바이트 배열에는 문자 경계가 없다. `InputStreamReader`의 디코더가 지정한 Charset으로 문자를 복원한다. 기본 문자셋은 환경마다 다를 수 있다.

**꼬리질문:** `Reader.read()`가 코드 포인트 하나를 읽나? **답:** `char` 하나를 읽으므로 보조 문자는 두 번일 수 있다.

### Q3. `flip()`과 `compact()`는 언제 구분해 쓰나?

`flip()`은 쓰기 완료 뒤 읽을 범위를 만든다. `compact()`는 읽고 남은 바이트를 앞에 옮겨 다음 쓰기를 이어간다. `clear()`는 데이터 삭제가 아니라 쓰기 상태 초기화다.

**꼬리질문:** 채널 `write()`가 버퍼 전부를 보내지 않았다면? **답:** 남은 데이터를 보존하고 다음 쓰기 준비 이벤트에서 이어 보낸다.

### Q4. 논블로킹 채널이면 호출 스레드는 절대 기다리지 않나?

채널 I/O는 준비되지 않았을 때 바로 돌아올 수 있지만, `Selector.select()`는 준비 이벤트를 기다릴 수 있다. 연결 상태·부분 읽기·부분 쓰기는 애플리케이션이 추적한다.

**꼬리질문:** `OP_WRITE`를 상시 구독하면? **답:** 보통 소켓은 쓸 준비가 되어 있어 루프가 바쁘게 돌 수 있다.

### Q5. `PreparedStatement`가 SQL Injection을 막는 경계는?

SQL 문장과 파라미터 값을 분리해 입력이 구문이 되는 것을 막는다. 이는 드라이버가 서버 준비문을 실제로 쓰는지와 별개로 앱 문자열 결합을 피하는 방법이다.

**꼬리질문:** `ORDER BY ?`로 열을 정할 수 있나? **답:** 불가하다. 바인딩 값은 식별자가 아니므로 허용 목록에서 고른다.

### Q6. 풀이 부족해 보일 때 풀 크기를 늘리는 게 정답인가?

대기 시간은 줄어도 DB 쿼리 동시성이 늘어 포화를 악화할 수 있다. 전체 앱 인스턴스 연결량, 느린 쿼리, close 누수를 같이 확인한다.

**꼬리질문:** 풀의 `Connection.close()`는? **답:** 보통 물리 연결 종료가 아니라 풀 반납이다.

### Q7. `sendAsync()`면 HTTP 작업에 타임아웃이 필요 없나?

아니다. Future를 반환해도 원격 응답과 본문은 자원을 점유한다. 연결·요청 대기와 본문 소비를 정해야 한다.

**꼬리질문:** 큰 본문에 `ofString()`이 적절한가? **답:** 전체를 힙에 담으므로 파일·스트림 소비를 고려한다.

### Q8. 역직렬화 필터가 데이터 신뢰성을 보장하나?

필터는 허용 클래스와 그래프 복잡도를 제한하지만 값의 진위나 업무 규칙은 검증하지 않는다. 신뢰할 수 없는 Java 직렬화는 가능하면 받지 않는다.

**꼬리질문:** JEP 290과 415 차이는? **답:** 290은 입력 필터를 추가했고, 415는 역직렬화 컨텍스트에 따른 필터 선택을 보탰다.

## 9. 참고문헌

- `InputStream` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/InputStream.html — 바이트 읽기·닫기·전송 API.
- `Reader` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/io/Reader.html — 문자 스트림의 추상화와 하위 구현.
- `ByteBuffer` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/ByteBuffer.html — 버퍼 상태와 `flip`·`compact` 메서드.
- `Selector` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/channels/Selector.html — 선택 키·준비 이벤트·선택·깨우기 동작.
- `Files` — https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/nio/file/Files.html — 파일 API와 스트림·문자열 작업.
- `HttpClient` — https://docs.oracle.com/en/java/javase/25/docs/api/java.net.http/java/net/http/HttpClient.html — 클라이언트 생성, 동기·비동기 전송, 종료 메서드.
- JEP 321 — https://openjdk.org/jeps/321 — HTTP Client 표준화와 비동기·Flow 설계 배경.
- `PreparedStatement` — https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/PreparedStatement.html — SQL 값 파라미터와 타입 설정 API.
- `Connection` — https://docs.oracle.com/en/java/javase/25/docs/api/java.sql/java/sql/Connection.html — DB 세션 및 auto-commit 기본 동작.
- JEP 290 — https://openjdk.org/jeps/290 — 입력 역직렬화 필터, 클래스·그래프 제한.
- JEP 415 — https://openjdk.org/jeps/415 — 컨텍스트별 역직렬화 필터 팩토리.
- HikariCP README — https://github.com/brettwooldridge/HikariCP — 풀 설정값의 의미와 기본 대기·유휴·누수 감지 동작.
- Spring Boot 관리 의존성 좌표 — https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html — Boot 4.1.1의 HikariCP 7.0.2 관리 버전.
