# F4. 비밀번호 저장 — 해시·salt·BCrypt

> 개념 레슨 · 30분

## 이게 뭐냐

가입 요청 본문의 `password` 칸에는 사용자가 친 비밀번호 원문이 들어 있다. 그다음은 서버 몫이다. 서버는 그 값을 DB에 **그대로 저장하면 안 된다.** DB는 생각보다 자주 샌다(백업 파일, 잘못 연 포트, 실수로 올린 덤프). 원문이 있으면 공격자는 바로 로그인한다. 사람들은 비밀번호를 여러 사이트에 같이 쓰니 다른 서비스까지 뚫린다.

그럼 무엇을 저장하나? 로그인할 때 서버가 알아야 하는 것은 "**지금 입력한 것이 가입할 때 그것과 같은가**"뿐이다. 원래 비밀번호를 **되찾을** 필요가 없다.

| | 암호화(encryption) | 해시(hash) |
|---|---|---|
| 되돌릴 수 있나 | 키가 있으면 원문이 나온다 | 못 한다. 결과에서 원문을 구할 수 없다 |
| 같은 입력이면 | (방식에 따라) | 같은 결과 |
| 비밀번호에 | 키가 새면 전부 원문 노출 | **이쪽.** 입력을 같은 방식으로 해시해 비교 |

### 그냥 해시(SHA-256)로는 부족한 이유

SHA-256은 파일이 바뀌었는지 확인하는 데 쓰는 **빠른** 해시다. 비밀번호에 쓰면 두 가지가 문제다.

1. **같은 비밀번호면 같은 결과.** 공격자는 흔한 비밀번호 수백만 개의 해시를 미리 계산한 표(레인보우 테이블)를 갖고 있다. 유출된 해시를 표에서 찾기만 하면 된다. 같은 비밀번호를 쓰는 회원끼리도 해시가 같아 한눈에 드러난다.
2. **너무 빠르다.** 아래 예시에서 SHA-256 10만 번이 42ms였다. 공격자는 후보를 그 속도로 대입해 본다.

해결도 두 가지다.

- **salt** — 해시할 때 회원마다 다른 **무작위 값**을 섞는다. 같은 비밀번호도 결과가 달라지고, 미리 만든 표가 쓸모없어진다. salt는 **비밀이 아니다.** 해시와 함께 저장한다. 확인할 때 같은 salt를 다시 섞어야 하기 때문이다.
- **일부러 느린 해시** — 한 번 계산하는 데 수십~수백 ms가 걸리게 만든 해시(BCrypt, Argon2id, scrypt, PBKDF2). 로그인하는 사람에게 0.06초는 티가 안 나지만, 후보 수억 개를 대입하는 공격자에게는 수억 배로 쌓인다. 얼마나 느리게 할지(**cost**, work factor)를 정할 수 있다.

### BCrypt 결과 한 줄 해부

10장(10-3)이 쓰는 `BCryptPasswordEncoder`의 결과는 60자 문자열 하나다. salt와 cost가 **그 안에** 들어 있어서 컬럼 하나(`password_hash`)면 된다.

```text
$2a$10$QF5ElCZPmnWIYT1ovudc.udThmRoRE.IUdV/0gav5DDrE3RfnxDGW
└┬─┘└┬┘└─────────┬──────────┘└──────────────┬──────────────┘
 │   │           │                          └ 해시 31자
 │   │           └ salt 22자(매번 새로 뽑는다)
 │   └ cost 10 — 2의 10승 번 반복
 └ 알고리즘 BCrypt(2a판)
```

### 확인은 `matches`

로그인 때 `encoder.matches(입력한원문, 저장된해시)`를 부른다. 저장된 문자열에서 cost와 salt를 꺼내, 입력을 **같은 방식으로** 다시 해시해서 뒤 31자를 비교한다. 복호화가 아니다. `encode` 결과를 `equals`로 비교하면 salt가 매번 달라서 **항상 틀린다**(아래 예시).

### cost는 얼마로

cost를 1 올리면 시간이 약 2배다(아래 예시: 10에서 59ms, 12에서 236ms, 14에서 970ms). Spring `BCryptPasswordEncoder`의 기본은 10이다. OWASP는 BCrypt라면 최소 10을 권하고, 새로 고른다면 Argon2id를 먼저 권한다. 정답 숫자는 없다. **서버에서 재 보고** 로그인이 너무 느리지 않은 선에서 정한다. 로그인 요청마다 이 시간이 서버 CPU를 쓰므로, 로그인 시도 횟수 제한도 같이 둔다.

### 로그인 실패는 한 가지 말로

"없는 이메일입니다"와 "비밀번호가 틀렸습니다"를 나눠 답하면, 공격자는 어떤 이메일이 가입돼 있는지 알아낸다. 10장 명세가 로그인 실패를 **둘 다 같은 `401`**로 정한 이유다([10-4](../scenario/ch10-project/10-4-login-jwt.md)). 응답 시간 차이로도 드러날 수 있어서, 없는 이메일일 때도 가짜 해시로 `matches`를 한 번 돌려 시간을 맞추는 방법이 있다(OWASP Authentication Cheat Sheet).

## 예시

javaExperience에는 BCrypt가 없다. `build.gradle`의 `dependencies`에 10-3과 같은 한 줄을 더한다(C2). Spring Security 전체가 아니라 암호화 모듈만이다.

```groovy
implementation 'org.springframework.security:spring-security-crypto'
```

Boot 4.1.1이 고른 버전은 `spring-security-crypto-7.1.1`이었다. 그다음 `org.example.lesson`에 아래 클래스를 만들고 IntelliJ에서 `main` 옆 ▶로 실행한다(C1).

```java
package org.example.lesson;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// 연습용 — 비밀번호 해시를 눈으로 본다. IntelliJ에서 main 옆 ▶로 실행. 다 보면 지운다
public class PasswordDemo {

    public static void main(String[] args) throws Exception {
        String raw = "password1234";

        // ① SHA-256 — 빠른 범용 해시. 같은 입력이면 늘 같은 결과
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        System.out.println("sha256 1: " + HexFormat.of().formatHex(sha.digest(raw.getBytes(StandardCharsets.UTF_8))));
        System.out.println("sha256 2: " + HexFormat.of().formatHex(sha.digest(raw.getBytes(StandardCharsets.UTF_8))));

        // ② BCrypt — 10장 PasswordConfig와 같은 도구(cost 기본 10)
        PasswordEncoder encoder = new BCryptPasswordEncoder();
        String h1 = encoder.encode(raw);
        String h2 = encoder.encode(raw);
        System.out.println("bcrypt 1: " + h1);
        System.out.println("bcrypt 2: " + h2);
        System.out.println("h1.equals(h2): " + h1.equals(h2));

        // ③ 확인은 matches(입력한 원문, 저장된 해시)
        System.out.println("matches(raw, h1): " + encoder.matches(raw, h1));
        System.out.println("matches(raw, h2): " + encoder.matches(raw, h2));
        System.out.println("matches(틀린 값, h1): " + encoder.matches("password1235", h1));

        // ④ 10장 시드 김자바의 password_hash(비밀번호는 password1234)
        String seed = "$2a$10$jmTUgTXkmVjHx6KM72lBku3ufsYi0KFoYZ6y8BzknkrxDUPnvfpaO";
        System.out.println("matches(raw, seed): " + encoder.matches(raw, seed));

        // ⑤ 해시 문자열 자르기 — 알고리즘 | cost | salt 22자 | 해시 31자
        System.out.println("length: " + h1.length());
        System.out.println(h1.substring(0, 4) + " | " + h1.substring(4, 7) + " | " + h1.substring(7, 29) + " | " + h1.substring(29));
    }
}
```

```text
sha256 1: b9c950640e1b3740e98acb93e669c65766f6670dd1609ba91ff41052ba48c6f3
sha256 2: b9c950640e1b3740e98acb93e669c65766f6670dd1609ba91ff41052ba48c6f3
bcrypt 1: $2a$10$QF5ElCZPmnWIYT1ovudc.udThmRoRE.IUdV/0gav5DDrE3RfnxDGW
bcrypt 2: $2a$10$5zDtAzFXhufUndmg8Y02fOzcZKRmEeS0J5dk./H613PcgBSUBDyom
h1.equals(h2): false
matches(raw, h1): true
matches(raw, h2): true
matches(틀린 값, h1): false
matches(raw, seed): true
length: 60
$2a$ | 10$ | QF5ElCZPmnWIYT1ovudc.u | dThmRoRE.IUdV/0gav5DDrE3RfnxDGW
```

- SHA-256은 두 번 다 같다. 이 64자를 미리 만든 표에서 찾으면 `password1234`가 나온다.
- BCrypt는 같은 입력인데 두 결과가 다르다(salt). 그래도 `matches`는 둘 다 `true`다. `bcrypt` 줄은 실행할 때마다 바뀐다.
- `seed`는 10장 DB(`project`)의 `users` 표에서 그대로 가져온 값이다. 시드의 세 회원은 비밀번호가 모두 `password1234`인데 `password_hash`는 셋 다 다르다(`$2a$10$jmTU…`, `$2a$10$iIfM…`, `$2a$10$p3sn…`). 다른 컴퓨터에서 만든 해시도 `matches`가 확인한다. 필요한 것이 전부 문자열 안에 있기 때문이다.

cost별 시간을 재 본다(같은 패키지에 하나 더).

```java
package org.example.lesson;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// 연습용 — cost를 1 올리면 시간이 얼마나 늘어나나. 숫자는 컴퓨터마다 다르다
public class BcryptCostDemo {

    public static void main(String[] args) throws Exception {
        for (int cost : new int[] {4, 8, 10, 12, 14}) {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(cost);
            encoder.encode("warmup");                    // 첫 실행은 준비 시간이 섞여 빼고 잰다
            long start = System.nanoTime();
            for (int i = 0; i < 3; i++) {
                encoder.encode("password1234");
            }
            System.out.println("bcrypt cost " + cost + ": 1번에 " + (System.nanoTime() - start) / 3 / 1_000_000 + " ms");
        }

        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] input = "password1234".getBytes(StandardCharsets.UTF_8);
        long start = System.nanoTime();
        for (int i = 0; i < 100_000; i++) {
            sha.digest(input);
        }
        System.out.println("sha256 10만 번: " + (System.nanoTime() - start) / 1_000_000 + " ms");
    }
}
```

```text
bcrypt cost 4: 1번에 1 ms
bcrypt cost 8: 1번에 16 ms
bcrypt cost 10: 1번에 59 ms
bcrypt cost 12: 1번에 236 ms
bcrypt cost 14: 1번에 970 ms
sha256 10만 번: 42 ms
```

cost 2 차이마다 약 4배다. 같은 시간에 SHA-256은 BCrypt(cost 10)보다 **십만 배 넘게** 많이 계산한다. 공격자에게도 그만큼 빠르다는 뜻이다.

## 따라 해 보기

10분.

1. javaExperience `build.gradle`에 `spring-security-crypto` 한 줄을 넣고 Gradle을 새로 고친다(IntelliJ의 코끼리 버튼).
2. `PasswordDemo`를 만들어 실행한다. 두 번 실행해서 `sha256` 줄은 그대로이고 `bcrypt` 줄은 바뀌는지 본다.
3. `BcryptCostDemo`를 실행해 내 컴퓨터의 숫자를 본다. cost 10이 몇 ms인지 적어 둔다.
4. `PasswordDemo`의 `seed` 자리에 10장 시드의 다른 회원 해시(`users` 표의 `password_hash`, 10-1을 했다면 CloudBeaver에서 `SELECT email, password_hash FROM users`)를 넣고 `matches`가 `true`인지 본다.
5. 두 클래스를 지운다. 의존성 줄은 10-3에서 board-api에 다시 넣으니 javaExperience에서는 지워도 된다.

## 일부러 틀려 보기

### ① 로그인을 `equals`로 비교한다

```java
// 틀린 로그인 — 입력을 다시 encode해서 저장된 값과 비교
boolean ok = encoder.encode(input).equals(user.getPasswordHash());
```

위 예시의 `h1.equals(h2): false`가 이 경우다. 비밀번호가 맞아도 salt가 달라 **항상 `false`** — 아무도 로그인하지 못한다. **고치기**: `encoder.matches(input, user.getPasswordHash())`.

### ② 72바이트를 넘는 비밀번호

BCrypt는 입력의 **앞 72바이트**만 쓴다. 글자 수가 아니라 바이트다. UTF-8에서 영문은 1바이트, 한글은 3바이트라 **한글 25자(75바이트)**면 넘는다. `PasswordDemo`의 `main` 끝에 붙여 실행했다.

```java
String a72 = "a".repeat(72);
String a73 = "a".repeat(73);
String k25 = "가".repeat(25);                    // 한글 25자
System.out.println("한글 25자 바이트: " + k25.getBytes(StandardCharsets.UTF_8).length);
String h72 = encoder.encode(a72);
System.out.println("matches(73바이트, 72바이트의 해시): " + encoder.matches(a73, h72));
encoder.encode(k25);
```

```text
한글 25자 바이트: 75
matches(73바이트, 72바이트의 해시): true
Exception in thread "main" java.lang.IllegalArgumentException: password cannot be more than 72 bytes
	at org.springframework.security.crypto.bcrypt.BCrypt.hashpw(BCrypt.java:616)
```

- `encode`(가입)는 72바이트를 넘으면 **예외**를 던진다. 처리하지 않으면 가입 요청이 `500`이 된다.
- `matches`(로그인)는 예외 없이 **앞 72바이트만** 비교한다. 72바이트 뒤에 무엇을 붙여도 `true`다.
- `@Size(max = 64)`는 **글자 수**만 본다. 한글 64자(192바이트)도 통과시킨다. 그래서 10장 명세는 "8~64자 **그리고 UTF-8 72바이트 이하**"로 정해 두었고, 10-3에서 바이트 수(`password.getBytes(StandardCharsets.UTF_8).length`)를 따로 검사해 `400`으로 답한다. 이 검사를 빼면 한글 25자 비밀번호 가입이 실제로 `500`이 된다.

### ③ 블로그 코드의 `{bcrypt}` 접두사

인터넷 예제는 `PasswordEncoderFactories.createDelegatingPasswordEncoder()`를 자주 쓴다. 이 인코더는 결과 앞에 알고리즘 이름을 붙인다. 나중에 알고리즘을 바꿔도 옛 해시를 구별하려는 것이다.

```text
{bcrypt}$2a$10$TTAWz13930BVlxXZkuH4FuxR9GsmPCW1LM./cLx3dijcuWLJhH5Oi
```

10장은 `BCryptPasswordEncoder`를 써서 접두사가 없다. 둘을 섞으면 깨진다. 접두사 없는 10장 시드 해시를 이 인코더의 `matches`에 넣었더니:

```text
Exception in thread "main" java.lang.IllegalArgumentException: Given that there is no default password encoder configured, each password must have a password encoding prefix. Please either prefix this password with '{noop}' or set a default password encoder in `DelegatingPasswordEncoder`.
```

반대로 `{bcrypt}…`를 `BCryptPasswordEncoder.matches`에 넣으면 예외 없이 `false`가 나오고 `WARN … Encoded password does not look like BCrypt` 로그만 남는다. 한 프로젝트에서는 **한 가지**만 쓴다.

## 확인 문제

**1.** 비밀번호를 암호화(AES 등)해서 저장하지 않고 해시로 저장하는 이유는?

<details>
<summary>정답</summary>

로그인은 "입력이 가입 때와 같은가"만 확인하면 되니 원문을 되찾을 일이 없다. 암호화는 키만 있으면 원문이 나오는 방식이라, DB와 키가 함께 새면 모든 비밀번호가 원문으로 드러난다. 해시는 결과에서 원문을 구할 수 없고, 확인은 입력을 같은 방식으로 해시해 비교(`matches`)하면 된다.
</details>

**2.** 10장 시드의 세 회원은 비밀번호가 모두 `password1234`인데 `password_hash`가 다르다. 왜? 그 차이를 만드는 값은 숨겨야 하나?

<details>
<summary>정답</summary>

해시할 때마다 새 **salt**(무작위 값)를 섞기 때문이다. salt는 `$2a$10$` 뒤 22자로 해시 문자열 안에 그대로 있다. 숨길 필요가 없다. salt의 목적은 "같은 비밀번호 = 같은 해시"를 깨서 미리 계산한 표와 같은 비밀번호 사용자 찾기를 막는 것이다. 확인할 때 같은 salt를 다시 써야 하니 함께 저장한다.
</details>

**3.** SHA-256도 되돌릴 수 없는 해시인데 비밀번호에 쓰지 않는 이유 두 가지는?

<details>
<summary>정답</summary>

① salt 없이 쓰면 같은 비밀번호가 늘 같은 결과라 미리 만든 표로 바로 찾힌다(예시의 `sha256` 두 줄이 같다). ② 너무 빠르다. 실측 10만 번에 42ms로, BCrypt cost 10 한 번(59ms)보다 짧다. 공격자가 후보를 대입하는 속도도 그만큼 빠르다. BCrypt는 salt를 넣고 cost로 일부러 느리게 만든다.
</details>

**4.** 저장된 값이 `$2a$12$…`이다. `12`는 무엇이고, `matches`는 salt를 어디서 알아내나?

<details>
<summary>정답</summary>

`12`는 cost다. 2의 12승 번 반복하라는 뜻이고 cost 10보다 약 4배 느리다(실측 236ms 대 59ms). `matches`는 저장된 문자열에서 cost(`12`)와 그 뒤 22자(salt)를 꺼내 입력을 똑같이 해시한 뒤 나머지 31자와 비교한다. 그래서 cost가 다른 해시가 섞여 있어도 확인할 수 있다.
</details>

**5.** 비밀번호 검증이 `@Size(min = 8, max = 64)` 하나뿐인 서버에 한글 30자 비밀번호로 가입하면 무슨 일이 생기나? 어떻게 막나?

<details>
<summary>정답</summary>

한글 30자는 90바이트라 BCrypt 한계(72바이트)를 넘는다. `@Size(max = 64)`는 글자 수만 보니 검증을 통과하고, `encoder.encode`가 `IllegalArgumentException: password cannot be more than 72 bytes`를 던진다. 처리하지 않으면 `500`이다. 비밀번호의 UTF-8 바이트 수가 72 이하인지 검증에서 따로 확인해 `400`으로 답한다(10장 10-3이 이렇게 한다). 로그인 쪽 `matches`는 예외 없이 앞 72바이트만 비교한다는 점도 기억한다.
</details>

## 더 깊이

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — salt·work factor, Argon2id·scrypt·bcrypt·PBKDF2 권장값, 72바이트 한계
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — 로그인 실패 메시지·응답 시간으로 가입 여부가 새는 문제
- [Spring Security — Password Storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html) — `PasswordEncoder`, `DelegatingPasswordEncoder`와 `{id}` 접두사
- [BCryptPasswordEncoder API](https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/crypto/bcrypt/BCryptPasswordEncoder.html) · [PasswordEncoderFactories API](https://docs.spring.io/spring-security/reference/api/java/org/springframework/security/crypto/factory/PasswordEncoderFactories.html)
- [B01 계정 생애주기](../docs/knowledge/B01-account-lifecycle.md) · [D11 웹 보안 기초](../docs/knowledge/D11-web-security-basics.md) · [S12 Spring Security 아키텍처](../docs/knowledge/S12-security-architecture.md)

## 다음

- 레슨: [F5. JWT 해부](./F5-jwt-anatomy.md) — 로그인에 성공하면 서버가 주는 토큰 안에 무엇이 있는지.
- 실습: [10-3. 회원 가입 — BCrypt 해시와 이메일 중복 409](../scenario/ch10-project/10-3-signup.md) — `PasswordEncoder`를 빈으로 등록하고 가입 때 해시만 저장한다.
