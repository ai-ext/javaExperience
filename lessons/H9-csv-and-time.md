# H9. CSV 내려받기와 시간 다루기

> 개념 레슨 · 40분

## 이게 뭐냐

운영자가 "신고 목록을 엑셀로 받고 싶어요"라고 한다. 서버는 **CSV**(쉼표로 칸을 나눈 텍스트 파일)를 응답으로 내려준다. 동시에 그 목록의 "신고 시각"을 어떻게 적을지도 정해야 한다. 이 레슨은 둘을 같이 본다. CSV에는 시각 칸이 꼭 들어가기 때문이다.

### CSV 응답에 필요한 다섯 가지

| 무엇 | 어떻게 | 왜 |
|---|---|---|
| 형식 | `Content-Type: text/csv;charset=UTF-8` | 받는 쪽이 글자 인코딩을 안다 |
| 파일 이름 | `Content-Disposition: attachment; filename*=UTF-8''…` | H2와 같다. 한글 이름은 `filename*` |
| BOM | 본문 맨 앞에 `EF BB BF` 3바이트 | Excel이 "UTF-8 파일"로 알아보게(Microsoft 안내) |
| 칸 규칙(RFC 4180) | 쉼표·큰따옴표·줄바꿈이 든 칸은 `"…"`로 감싸고, 안의 `"`는 `""`로. 줄 끝은 `\r\n` | 칸이 밀리지 않게 |
| 수식 막기 | `=` `+` `-` `@` 등으로 시작하는 칸은 앞에 `'`를 붙인다 | 스프레드시트가 수식으로 실행하지 않게(OWASP) |

### 시간 타입 넷

| 타입 | 담는 것 | 예 | 쓰는 곳 |
|---|---|---|---|
| `LocalDateTime` | 벽시계 날짜·시각. **어느 나라 시계인지 없다** | `2026-10-10T14:30` | "서울 기준 14시 30분"처럼 지역이 정해진 값 |
| `Instant` | 세계 어디서나 같은 **한 순간**(UTC) | `2026-10-10T05:30:00Z` | 일이 일어난 시점(로그, 생성 시각) |
| `OffsetDateTime` | 순간 + UTC와의 차이 | `2026-10-10T14:30+09:00` | 차이까지 보여 줄 때 |
| `ZonedDateTime` | 순간 + 지역 규칙(`Asia/Seoul`) | `…+09:00[Asia/Seoul]` | 서머타임이 있는 지역의 예약 |

`LocalDateTime.now()`는 **JVM 기본 시간대**의 벽시계를 읽는다. 내 맥은 서울이지만 배포 서버는 UTC일 수 있다. 그래서 "지금"은 `Clock`에서 읽는다(H3).

DB도 둘이다. MySQL `DATETIME`은 넣은 글자 그대로 저장하고 그대로 돌려준다. `TIMESTAMP`는 넣을 때 **세션 시간대 → UTC**로 바꿔 저장하고, 꺼낼 때 **UTC → 세션 시간대**로 바꾼다.

## 예시

포트 `18300` 앱과 `practice` DB에서 실행한 결과다.

### CSV 컨트롤러

```java
final class Csv {
    // RFC 4180: 쉼표·큰따옴표·줄바꿈이 있으면 큰따옴표로 감싸고, 안의 큰따옴표는 두 번 쓴다
    static String cell(String value) {
        String v = (value == null) ? "" : value;
        if (v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r")) {
            return "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }

    // 수식 막기: = + - @ 탭 CR로 시작하면 작은따옴표를 붙여 글자로 만든다
    static String safeCell(String value) {
        String v = (value == null) ? "" : value;
        if (!v.isEmpty() && "=+-@\t\r".indexOf(v.charAt(0)) >= 0) {
            return "\"'" + v.replace("\"", "\"\"") + "\"";
        }
        return cell(v);
    }
}
```

```java
@GetMapping("/h9/posts.csv")
public ResponseEntity<byte[]> csv(@RequestParam(defaultValue = "true") boolean bom,
                                  @RequestParam(defaultValue = "true") boolean safe) {
    StringBuilder sb = new StringBuilder();
    if (bom) sb.append('﻿');                       // UTF-8 BOM: 맨 앞에 한 번
    for (List<String> row : ROWS) {
        sb.append(Csv.row(row, safe));                  // 칸을 쉼표로 잇고 끝에 \r\n
    }
    ContentDisposition cd = ContentDisposition.attachment()
            .filename("게시글목록.csv", StandardCharsets.UTF_8).build();
    return ResponseEntity.ok()
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
            .body(sb.toString().getBytes(StandardCharsets.UTF_8));
}
```

`ROWS`에는 일부러 까다로운 값을 넣었다: `쉼표, 있는 제목`, `따옴표 "인용" 제목`, 줄바꿈이 든 `두 줄⏎제목`, `=HYPERLINK("http://evil.example","클릭")`, `-1+2`.

### 헤더와 첫 바이트

```text
$ curl -s -D - -o posts.csv "$B/h9/posts.csv"
HTTP/1.1 200
Content-Disposition: attachment; filename="_____________.csv"; filename*=UTF-8''%EA%B2%8C%EC%8B%9C%EA%B8%80%EB%AA%A9%EB%A1%9D.csv
Content-Type: text/csv;charset=UTF-8
Content-Length: 248

$ xxd posts.csv | head -1
00000000: efbb bf69 642c ec9e 91ec 84b1 ec9e 902c  ...id,.........,
```

`ef bb bf`가 BOM, 그 뒤 `69 64 2c`가 `id,`다. `?bom=false`로 받으면 첫 바이트가 바로 `6964 2c…`였다.

### 줄마다 — 무엇이 감싸졌나

BOM을 떼고 `\r\n`으로 잘라 한 줄씩 찍었다(파이썬 `repr`이라 바깥 작은따옴표는 표시용이다).

```text
'id,작성자,제목'
'1,김자바,첫 글'
'2,이스프링,"쉼표, 있는 제목"'
'3,박디비,"따옴표 ""인용"" 제목"'
'4,최줄바꿈,"두 줄\n제목"'
'5,해커,"\'=HYPERLINK(""http://evil.example"",""클릭"")"'
'6,정마이너스,"\'-1+2"'
```

- 2번: 쉼표가 있어 통째로 `"…"`.
- 3번: 안의 `"`가 `""`로 두 번.
- 4번: 칸 **안의** 줄바꿈(`\n`)은 따옴표 안이라 줄이 끝난 게 아니다. 줄 끝은 `\r\n`이다.
- 5·6번: 앞에 `'`가 붙었다. `safe=false`로 받으면 `5,해커,"=HYPERLINK(…)"`, `6,정마이너스,-1+2` 그대로였다.

규칙대로 썼는지는 CSV 읽는 프로그램으로 다시 읽어 확인한다. 파이썬 `csv` 모듈로 읽었더니 **7행, 모든 행이 3칸**이었고 값도 원래대로 돌아왔다(`['4', '최줄바꿈', '두 줄\n제목']`).

> Excel에서 BOM이 있어야 한글이 안 깨지는 것, `'`·탭 접두가 수식 실행을 막는 것은 Microsoft·OWASP 문서의 내용이다. 이 레슨에서는 Excel로 열어 보지 않았다. OWASP는 Excel에서 저장 후 다시 열면 `'` 방식이 풀릴 수 있다며, Excel용으로는 따옴표 안에 **탭**을 붙이는 방법(`"\t=1+2"`)을 따로 적어 두었다. 탭은 데이터에 남는다.

### 시간 — 같은 한 순간, JSON에서는

`Clock`을 `2026-10-10T05:30:00Z`(서울 14:30)에 고정하고 타입별로 응답에 넣었다. Boot 4.1(Jackson 3) **기본 설정** 그대로의 출력이다.

```java
Instant instant = Instant.now(clock);
m.put("instant", instant);
m.put("localDateTime", LocalDateTime.now(clock));
m.put("offsetDateTime", OffsetDateTime.now(clock));
m.put("zonedDateTime", ZonedDateTime.now(clock));
m.put("zonedNewYork", instant.atZone(ZoneId.of("America/New_York")));
```

```text
"instant":"2026-10-10T05:30:00Z"
"localDateTime":"2026-10-10T14:30:00"
"offsetDateTime":"2026-10-10T14:30:00+09:00"
"zonedDateTime":"2026-10-10T14:30:00+09:00"
"zonedNewYork":"2026-10-10T01:30:00-04:00"
```

전부 ISO 문자열이다. `localDateTime`에는 어느 나라 시각인지가 **없다.** `zonedDateTime`도 `[Asia/Seoul]` 없이 `+09:00`만 나갔다. 지역 이름이 필요하면 따로 칸을 둔다.

### JVM 시간대가 바뀌면

같은 앱을 `-Duser.timezone=UTC`로 켜서(서버가 UTC라고 치고) 진짜 시계로 불렀다.

```text
"localDateTime":"2026-10-10T16:49:16.813507"         ← LocalDateTime.now(clock) — Clock이 서울
"jvmDefaultZone":"UTC"
"localDateTimeNoClock":"2026-10-10T07:49:16.814203"  ← LocalDateTime.now()
```

`LocalDateTime.now()`만 9시간 이른 값이 됐다. `Clock`을 `Clock.system(ZoneId.of("Asia/Seoul"))`로 만들어 주입한 쪽은 그대로였다.

### DATETIME과 TIMESTAMP

```sql
CREATE TABLE lesson_h9_time (id BIGINT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(40) NOT NULL,
                             dt DATETIME NOT NULL, ts TIMESTAMP NOT NULL);
```

```text
mysql> SET time_zone = '+09:00';
mysql> INSERT INTO lesson_h9_time (label, dt, ts) VALUES ('cli +09:00', '2026-10-10 14:30:00', '2026-10-10 14:30:00');
mysql> SELECT label, dt, ts FROM lesson_h9_time;
| cli +09:00 | 2026-10-10 14:30:00 | 2026-10-10 14:30:00 |
mysql> SET time_zone = '+00:00';
mysql> SELECT label, dt, ts FROM lesson_h9_time;
| cli +09:00 | 2026-10-10 14:30:00 | 2026-10-10 05:30:00 |
```

`dt`는 그대로, `ts`는 세션 시간대를 바꾸자 **보이는 값이 바뀌었다.** 저장된 건 UTC 05:30 한 순간이고, 보여 줄 때 세션 시간대로 바꾼 것이다. `TIMESTAMP`는 2038-01-19까지만 담는다.

```text
mysql> INSERT INTO lesson_h9_time (label, dt, ts) VALUES ('범위 밖', '2040-01-01 00:00:00', '2040-01-01 00:00:00');
ERROR 1292 (22007): Incorrect datetime value: '2040-01-01 00:00:00' for column 'ts' at row 1
```

## 따라 해 보기

15분.

**1. CSV.** 위 `Csv`와 컨트롤러를 앱에 넣고(`Csv.row`는 칸을 `cell` 또는 `safeCell`로 바꿔 쉼표로 잇고 `\r\n`을 붙이는 한 줄짜리), `curl -s -D - -o posts.csv …`로 헤더를, `xxd posts.csv | head -1`로 `efbb bf`를 확인한다. `python3 -c "import csv; print(list(csv.reader(open('posts.csv', encoding='utf-8-sig', newline=''))))"`로 다시 읽어 행마다 3칸인지 본다.

**2. TIMESTAMP.** G3의 mysql 접속 명령에서 맨 끝 `community`를 `practice`로 바꿔 들어가, 위 `CREATE`·`SET time_zone`·`INSERT`·`SELECT`를 순서대로 친다. 서버 기본 시간대는 `SELECT @@global.time_zone, @@system_time_zone;`로 본다. 이 레슨을 쓸 때 실험한 MySQL 컨테이너는 `SYSTEM`, `UTC`였다.

**3. 정리.** `DROP TABLE lesson_h9_time`.

## 일부러 틀려 보기

**1. 바깥만 따옴표로 감싸기.** `"따옴표 "인용" 제목"`처럼 안의 `"`를 두 번 쓰지 않고, 쉼표 칸은 감싸지 않은 줄을 파이썬 `csv`로 읽었다.

```text
3,박디비,"따옴표 "인용" 제목"   →  ['3', '박디비', '따옴표 인용" 제목"']
2,이스프링,쉼표, 있는 제목      →  ['2', '이스프링', '쉼표', ' 있는 제목']     (4칸)
```

값이 망가지거나 칸이 하나 밀렸다.

**2. `serverTimezone`이면 세션도 서울인 줄 알기.** 앱(JVM은 서울)에서 같은 `LocalDateTime` 14:30을 `dt`·`ts`에 넣고, mysql에서 세션 `+00:00`으로 읽었다. URL만 바꿨다.

| JDBC URL에 붙인 것 | `dt` | `ts`(UTC로 읽음) | 서울로 읽은 `ts` |
|---|---|---|---|
| (없음) | 14:30 | 14:30 | **23:30** |
| `serverTimezone=Asia/Seoul` | 14:30 | 14:30 | **23:30** |
| `connectionTimeZone=Asia/Seoul&forceConnectionTimeZoneToSession=true` | 14:30 | 05:30 | 14:30 |

앞의 둘은 앱 연결에서 `@@session.time_zone`을 찍어 보니 `SYSTEM`(서버 기본, 이 DB는 UTC) 그대로였다. 그래서 서울 14:30이 "UTC 14:30"으로 저장됐다. 서울 세션으로 읽으면 23:30이다. 세션까지 바꾸는 건 마지막 줄뿐이었다(Connector/J 9.7). `DATETIME`은 세 경우 모두 14:30이다. 그래서 "벽시계 값을 그대로"면 `DATETIME`, `TIMESTAMP`를 쓰면 연결 설정까지 같이 정한다.

**3. `LocalDateTime.now()`.** 예시의 `localDateTimeNoClock`. 서버 시간대가 바뀌면 같이 바뀐다.

## 확인 문제

**1.** 칸 값이 `A,"B"`다. RFC 4180으로 쓰면?

<details>
<summary>정답</summary>

**`"A,""B"""`.** 쉼표가 있으니 통째로 큰따옴표로 감싸고, 안의 `"`는 `""`로 두 번 쓴다.
</details>

**2.** 셀을 큰따옴표로 감싸면 `=1+2`가 수식으로 실행되는 것도 막히나?

<details>
<summary>정답</summary>

**아니다.** 따옴표는 CSV 칸을 나누는 규칙일 뿐, 읽은 뒤 값은 `=1+2`다. 수식 막기는 따로 한다(앞에 `'` 붙이기, Excel용으로는 따옴표 안 탭 — OWASP).
</details>

**3.** UTF-8로 잘 만든 CSV인데 Excel에서 한글이 깨진다는 연락이 왔다. 응답에서 무엇을 확인하나?

<details>
<summary>정답</summary>

본문 맨 앞에 **BOM(`EF BB BF`)**이 있는지 `xxd`로 본다. `charset=UTF-8` 헤더도 함께 둔다. BOM은 맨 앞에 한 번만.
</details>

**4.** 글 작성 시각을 기록한다. `LocalDateTime.now()`와 `Instant.now(clock)` 중 무엇이 서버 시간대에 흔들리나?

<details>
<summary>정답</summary>

**`LocalDateTime.now()`.** JVM 기본 시간대의 벽시계를 읽어서, 서버를 UTC로 띄우면 9시간 달라진다(실험에서 16:49 → 07:49). 일이 일어난 순간은 `Instant`, 지역 시각이 필요하면 시간대를 정한 `Clock`에서 읽는다.
</details>

**5.** 세션 시간대를 `+09:00`에서 `+00:00`으로 바꾸고 같은 행을 다시 읽었다. `DATETIME` 칸과 `TIMESTAMP` 칸 중 어느 쪽 값이 바뀌나?

<details>
<summary>정답</summary>

**`TIMESTAMP`.** UTC로 저장해 두고 세션 시간대로 바꿔 보여 준다(14:30 → 05:30). `DATETIME`은 넣은 글자 그대로다.
</details>

## 더 깊이

- [W20 시간과 시간대](../docs/knowledge/W20-time-timezone.md) — "언제"와 "몇 시", DST의 빈 시각·겹친 시각, JPA·MySQL 연결 설정
- [H2 파일 업로드·다운로드](./H2-file-upload-download.md) — `Content-Disposition`, `filename*`
- [D1 JSON과 Jackson](./D1-json-jackson.md) — 응답 JSON 모양 정하기
- RFC 4180 — CSV: https://www.rfc-editor.org/rfc/rfc4180.txt
- OWASP — CSV Injection: https://owasp.org/www-community/attacks/CSV_Injection
- Microsoft — Excel에서 UTF-8 CSV 열기: https://support.microsoft.com/en-us/excel/opening-csv-utf-8-files-correctly-in-excel
- Spring Framework 7 API — `ContentDisposition`: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ContentDisposition.html
- MySQL 8.0 — DATE, DATETIME, TIMESTAMP: https://dev.mysql.com/doc/refman/8.0/en/datetime.html
- Java 21 API — `LocalDateTime`·`Instant`·`ZonedDateTime`·`Clock`: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/package-summary.html

행이 수만 개면 문자열을 다 만들어 `byte[]`로 돌려주지 않고, `StreamingResponseBody`로 쓰면서 DB도 나눠 읽는다(Spring 문서).

## 다음

- [13-6. 신고 내역 CSV 내려받기](../scenario/ch13-operations/13-6-csv-export.md) — 이 레슨의 BOM·한글 파일명·수식 주입 막기를 신고 목록 내려받기에 그대로 쓴다.

시간 다루기는 아래 실습에서 그대로 쓴다.

- [13-1. 운영 역할 — 글 숨김·복구](../scenario/ch13-operations/13-1-roles-and-hide.md) — `LocalDateTime.now()`의 마이크로초가 `DATETIME`에서 반올림되는 함정
- [13-3. 작성자 기간 정지](../scenario/ch13-operations/13-3-member-suspension.md) — 끝 시각 저장과 `Clock`으로 "지금" 비교
- [15-1. 명예의 전당](../scenario/ch15-scheduling-batch/15-1-hall-of-fame.md) — `app.fixed-now`로 고정한 "오늘"
