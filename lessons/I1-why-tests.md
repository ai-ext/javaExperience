# I1. 테스트는 왜 쓰나·무엇을 시험하나

> 개념 레슨 · 30분

## 이게 뭐냐

지금까지 단계마다 이렇게 확인했다. 서버를 띄우고, curl을 보내고, 응답을 눈으로 보고, 결과 테스트 프롬프트로 채점을 받는다. 잘 된다. 문제는 **코드를 고칠 때마다 이걸 다시 해야 한다**는 것이다.

- 2-3에서 "볼 수 있는 글만" 조건을 넣다가 2-2의 전체 개수(`totalElements`)를 깨뜨렸다면?
- 4-2에서 좋아요 숫자를 고치다가 4-1의 "이미 눌렀으면 그대로"를 깨뜨렸다면?

사람이 매번 앞 단계까지 전부 다시 확인하기는 어렵다. 그래서 확인을 **코드로 적어 두고**, 명령 하나로 몇 초 만에 전부 다시 돌린다. 그게 테스트다. Java에서는 JUnit 5로 테스트를 만들고 AssertJ로 결과를 확인한다.

| 하는 일 | JUnit 5 + AssertJ |
|---|---|
| 테스트 하나 | `@Test void 테스트_이름() { … }` |
| 값이 같은지 | `assertThat(x).isEqualTo(3)` |
| 거짓인지 | `assertThat(x).isFalse()` |
| 전부 돌리기 | `./gradlew test` |

### 무엇을 시험하나

테스트는 "코드가 이렇게 생겼다"가 아니라 **"이 입력이면 이 결과"라는 약속(계약)** 을 적는다. 시나리오의 채점 기준표가 바로 그 약속 목록이다. "빈 제목이면 400", "볼 수 없는 글이면 404", "이미 좋아요면 숫자 그대로" 같은 것들이다.

어떤 입력을 고르나? 쉬운 경우 하나로는 부족하다. 버그는 **경계**에 숨는다.

- 처음과 끝: 첫 쪽, 마지막 쪽
- 딱 맞을 때와 하나 넘칠 때: 15개를 5개씩(딱 맞음), 14개를 5개씩(남음)
- 비었을 때: 글 0개
- 잘못된 입력: `size=0`, `page=-1`

### 테스트 하나의 모양

```text
준비(given) — 입력과 상황을 만든다
실행(when)  — 시험할 것을 한 번 부른다
검증(then)  — 결과가 약속과 같은지 단언(assert)한다
```

### 7장의 세 가지 테스트

7장에서 범위가 다른 테스트 세 가지를 쓴다. 오늘은 그 앞의, Spring도 DB도 없는 가장 작은 테스트를 해 본다.

| 단계 | 무엇을 | 진짜인 것 | 가짜로 바꾸는 것 | 속도 |
|---|---|---|---|---|
| 오늘 | 계산 하나 | 클래스 하나 | 없음 | 가장 빠름 |
| [7-2](../scenario/ch7-tests/7-2-service-unit.md) 서비스 단위 | 업무 규칙 | 서비스 | 저장소(mock) | 빠름 |
| [7-1](../scenario/ch7-tests/7-1-controller-slice.md) 컨트롤러 슬라이스 | HTTP 계약(상태 코드·JSON) | 컨트롤러·에러 처리 | 서비스(mock) | 중간 |
| [7-3](../scenario/ch7-tests/7-3-integration.md) 통합 | 다 붙였을 때 | 전부 + 진짜 MySQL | 없음 | 느림 |

범위가 좁을수록 빠르고, 실패했을 때 원인이 잘 보인다. 범위가 넓을수록 "진짜로 붙였을 때"만 나는 문제를 잡는다. 그래서 섞어 쓴다.

## 예시

G1의 페이지 계산(`PageInfo`)을 시험한다. 이 레슨을 쓰면서 Spring Boot 4.1 프로젝트(Java 21, 테스트 의존성 `spring-boot-starter-webmvc-test` — 실습 레포에 이미 있는 것과 같다)에서 실행한 그대로다.

`src/main/java/…/PageInfo.java`

```java
public record PageInfo(int page, int size, long totalElements) {
    public long offset()     { return (long) page * size; }
    public int totalPages()  { return (int) Math.ceil((double) totalElements / size); }
    public boolean hasNext() { return page + 1 < totalPages(); }
}
```

`src/test/java/…/PageInfoTest.java`

```java
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PageInfoTest {

    @Test
    void 글_14개를_5개씩_자르면_3쪽이다() {
        PageInfo first = new PageInfo(0, 5, 14);   // 준비

        int pages = first.totalPages();            // 실행

        assertThat(pages).isEqualTo(3);            // 검증
    }

    @Test
    void 마지막_쪽에는_다음_쪽이_없다() {
        assertThat(new PageInfo(2, 5, 14).hasNext()).isFalse();
        assertThat(new PageInfo(1, 5, 14).hasNext()).isTrue();
    }

    @Test
    void 딱_나누어떨어지면_빈_쪽을_만들지_않는다() {
        assertThat(new PageInfo(0, 5, 15).totalPages()).isEqualTo(3);
        assertThat(new PageInfo(2, 5, 15).hasNext()).isFalse();
    }

    @Test
    void 글이_하나도_없으면_0쪽이다() {
        PageInfo empty = new PageInfo(0, 10, 0);

        assertThat(empty.totalPages()).isZero();
        assertThat(empty.hasNext()).isFalse();
    }

    @Test
    void 세번째_쪽은_10개를_건너뛴다() {
        assertThat(new PageInfo(2, 5, 14).offset()).isEqualTo(10);
    }
}
```

- 테스트 메서드 이름에 한글을 써도 된다. 실패했을 때 이름만 보고 **어떤 약속이 깨졌는지** 알 수 있게 짓는다.
- `import static …assertThat`은 `Assertions.assertThat(...)`을 `assertThat(...)`으로 줄여 쓰게 해 준다. `static` 메서드를 클래스 이름 없이 부르는 import다.
- 테스트 클래스는 시험할 클래스와 **같은 패키지**에 둔다. 두 파일 맨 위에 프로젝트의 `package` 줄(예: `Main.java`와 같은 것)을 붙인다.

```text
$ ./gradlew test --tests '*PageInfoTest' --console=plain
> Task :compileJava
> Task :processResources UP-TO-DATE
> Task :classes
> Task :compileTestJava
> Task :processTestResources NO-SOURCE
> Task :testClasses
> Task :test

BUILD SUCCESSFUL in 1s
```

통과하면 아무 말이 없다. 테스트 결과 파일(`build/test-results/test/*.xml`)에는 5개가 모두 통과했고, 다섯 개를 다 도는 데 0.031초 걸렸다고 적혀 있었다. 서버를 띄우고 curl을 다섯 번 치는 것과 비교해 보자.

## 따라 해 보기

15분. 실습 레포(javaExperience)에서 한다. 작업 브랜치에서 하고, 끝나면 두 파일을 지우거나 커밋하지 않고 버려도 된다.

**1. 파일 두 개를 만든다.** `Main.java`가 있는 패키지에 `PageInfo.java`를, `src/test/java` 아래 **같은 패키지 경로**에 `PageInfoTest.java`를 만든다. 위 예시를 붙이고 맨 위에 `package` 줄을 넣는다.

**2. 돌린다.**

```bash
./gradlew test --tests '*PageInfoTest'
```

IntelliJ라면 테스트 클래스 이름 옆의 실행 버튼으로도 된다. 이 테스트는 Spring을 띄우지 않으니 Docker(Testcontainers)도 필요 없다.

**3. 일부러 버그를 넣는다.** `PageInfo`의 `totalPages()`를 정수 나눗셈으로 바꾼다. 흔한 실수다.

```java
    public int totalPages()  { return (int) (totalElements / size); }
```

다시 돌리면 이렇게 나온다.

```text
PageInfoTest > 글_14개를_5개씩_자르면_3쪽이다() FAILED
    org.opentest4j.AssertionFailedError at PageInfoTest.java:15

PageInfoTest > 마지막_쪽에는_다음_쪽이_없다() FAILED
    org.opentest4j.AssertionFailedError at PageInfoTest.java:21

5 tests completed, 2 failed

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':test'.
> There were failing tests. See the report at: file:///…/build/reports/tests/test/index.html
```

(`PageInfoTest.java:15` 같은 줄 번호는 위 예시 맨 위에 `package` 줄과 빈 줄 하나를 붙였을 때의 번호다.) 실패 이름만 봐도 "14개를 5개씩 자르면 3쪽"이라는 약속이 깨졌다는 것을 안다. 자세한 이유는 마지막 줄의 보고서(`index.html`)를 브라우저로 열거나 `build/test-results/test/`의 XML에서 본다.

```text
org.opentest4j.AssertionFailedError:
expected: 3
 but was: 2
	at lab.PageInfoTest.글_14개를_5개씩_자르면_3쪽이다(PageInfoTest.java:15)
```

```text
org.opentest4j.AssertionFailedError:
Expecting value to be true but was false
	at lab.PageInfoTest.마지막_쪽에는_다음_쪽이_없다(PageInfoTest.java:21)
```

(`lab.`은 이 레슨을 쓴 프로젝트의 패키지 이름이다. 실습 레포에서는 그 프로젝트의 패키지가 보인다.) 21번 줄은 "2쪽(`page=1`) 다음에는 3쪽이 있다"다. 쪽 수가 2로 줄었으니 2쪽이 마지막이 되어 버렸다. 고친 뒤 다시 돌려 통과하는 것까지 본다.

## 일부러 틀려 보기

**1. 쉬운 경우만 시험한다.** 따라 해 보기 3번의 버그가 있는 채로, 실패한 두 테스트를 지우고 돌려 본다.

남은 세 개(`딱_나누어떨어지면…`, `글이_하나도_없으면…`, `세번째_쪽은…`)는 **모두 통과한다.** 15 ÷ 5와 0 ÷ 10은 정수 나눗셈으로도 맞고, `offset()`은 나눗셈을 안 쓴다. 테스트가 초록색이어도 버그가 남아 있다. "나머지가 생기는 경우(14개)"라는 경계를 시험하지 않았기 때문이다.

**2. 단언을 빼먹는다.** 테스트를 이렇게 쓰면 어떨까.

```java
    @Test
    void 단언이_없는_테스트() {
        PageInfo info = new PageInfo(0, 5, 14);
        System.out.println("쪽 수: " + info.totalPages());
    }
```

같은 버그가 있는 상태에서 돌렸더니 **통과**했다. 출력에는 `쪽 수: 2`(틀린 값)가 찍혔다. 테스트는 `assertThat`이 실패하거나 예외가 날 때만 실패한다. 결과를 눈으로 보는 테스트는 사람이 보지 않으면 아무것도 지키지 않는다.

## 확인 문제

**1.** 테스트가 없으면 무엇이 어려운가? 한 문장으로.

<details>
<summary>정답</summary>

코드를 고칠 때마다 **이전에 되던 것이 여전히 되는지**(회귀)를 사람이 전부 다시 확인해야 한다. 테스트는 그 확인을 코드로 적어 두고 명령 하나로 다시 돌린다.
</details>

**2.** `PageInfo`의 `totalPages()`를 시험할 입력을 세 개만 고르라면? 이유는?

<details>
<summary>정답(예)</summary>

**14개를 5개씩(나머지 있음, 3쪽)**, **15개를 5개씩(딱 맞음, 3쪽)**, **0개(0쪽)**. 나머지가 있는 경우는 올림을 잊는 버그를, 딱 맞는 경우는 빈 쪽을 하나 더 만드는 버그를, 0개는 "글이 없을 때 1쪽"이 되는 버그를 잡는다. 쉬운 경우 하나만으로는 일부러 틀려 보기 1처럼 버그를 놓친다.
</details>

**3.** 아래 테스트는 무엇이 문제인가?

```java
@Test
void 목록_테스트() {
    service.list(0, 10);
}
```

<details>
<summary>정답</summary>

**단언이 없다.** 예외만 안 나면 무조건 통과한다. 무엇이 나와야 하는지(몇 개, 어떤 순서, `hasNext`)를 `assertThat`으로 적어야 한다. 이름도 `목록_테스트`라 실패했을 때 어떤 약속이 깨졌는지 알 수 없다. `첫_쪽은_최신_글_5개다`처럼 입력과 기대를 이름에 담는다.
</details>

**4.** "빈 제목으로 글을 쓰면 `400`과 `application/problem+json`"을 시험하고 싶다. 7장의 세 가지 중 무엇이 가장 알맞나?

<details>
<summary>정답</summary>

**7-1 컨트롤러 슬라이스.** 상태 코드·헤더·JSON 모양은 HTTP 계약이고, 검증(`@Valid`)과 에러 처리(`@RestControllerAdvice`)는 컨트롤러 쪽에서 일어난다. DB까지 띄울 필요가 없으니 서비스는 가짜로 두고 빠르게 확인한다.
</details>

**5.** "내 글엔 좋아요 금지" 규칙을 시험하는데, 매번 MySQL을 띄우고 회원·글 데이터를 넣고 있다. 더 나은 방법은?

<details>
<summary>정답</summary>

**7-2 서비스 단위 테스트.** 규칙은 서비스에 있으니 서비스만 진짜로 두고 저장소는 mock으로 바꾼다. "이 글의 작성자는 2번" 같은 상황을 코드로 바로 만들 수 있고, 1초 안팎으로 끝난다. "진짜로 붙였을 때"는 7-3 통합 테스트 하나가 따로 확인한다.
</details>

## 더 깊이

- [V01 무엇을 어떻게 테스트하나](../docs/knowledge/V01-what-and-how-to-test.md)
- [V01 — 테스트 하나는 한 행동을 준비·실행·검증한다](../docs/knowledge/V01-what-and-how-to-test.md#24-테스트-하나는-한-행동을-준비실행검증한다)
- [V01 — 이름에서 입력과 기대 결과를 읽을 수 있어야 한다](../docs/knowledge/V01-what-and-how-to-test.md#25-이름에서-입력과-기대-결과를-읽을-수-있어야-한다)
- [V01 — 검증할 계약에 맞춰 범위를 정한다](../docs/knowledge/V01-what-and-how-to-test.md#22-검증할-계약에-맞춰-범위를-정한다) — 7장 세 가지를 고르는 기준
- [J19 JUnit 테스트](../docs/knowledge/J19-testing-junit.md) — 경계 입력을 한꺼번에 시험하는 `@ParameterizedTest`
- [V02 계층별 테스트 따라 하기](../docs/knowledge/V02-layered-tests-handson.md) — 7장 예습

## 다음

- 실습: [7-1. 컨트롤러 슬라이스 테스트](../scenario/ch7-tests/7-1-controller-slice.md) — 서비스를 가짜로 두고 HTTP 계약만 빠르게.
