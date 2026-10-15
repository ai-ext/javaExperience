# P26. 메일 발송 실무 — JavaMailSender와 로컬 테스트

> 3줄 요약 — Spring Boot는 `spring-boot-starter-mail`과 `spring.mail.*` 설정으로 `JavaMailSender`를 자동 구성한다.
> 개발 중에는 실제 수신자 대신 Mailpit의 SMTP(기본 1025)와 웹 UI(8025)에 연결해 HTML·첨부·헤더를 검증한다.
> 운영 발송은 요청 스레드에서 직접 보내지 말고, 발송 기록·재시도·중복 방지·도메인 인증까지 한 덩어리로 설계한다.

## 1. 한 줄로 말하면

`JavaMailSender`는 Jakarta Mail의 SMTP/MIME 처리를 Spring 방식으로 감싼 발송 인터페이스다. `SimpleMailMessage`는 텍스트 메일, `MimeMessageHelper`는 HTML·첨부·인라인 리소스를 다룬다. Boot는 SMTP 호스트와 starter가 있으면 기본 sender를 자동 생성하므로 애플리케이션 코드가 SMTP 프로토콜을 직접 다루지 않는다.

“메일을 보냈다”는 “수신자가 읽었다”가 아니다. 로컬에서는 Mailpit으로 SMTP·MIME을 확인하고, 운영에서는 연결 실패·인증 실패·스팸·중복 발송을 별도로 처리한다.

## 2. 당장 알아야 할 것

### 2.1 의존성은 starter 하나에서 시작한다

Boot 4.1.1 기준 Gradle Kotlin DSL이다. 메일 라이브러리 버전은 Boot BOM에 맡긴다.

```kotlin
// build.gradle.kts
plugins {
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

Maven은 같은 starter를 추가하고 버전은 Boot parent/BOM에 맡긴다.

### 2.2 SMTP 포트와 보안 방식을 구분한다

| 구분 | 일반적 의미 | 실무 판단 |
|---|---|---|
| 25 | 서버 간 SMTP 릴레이 | 클라우드에서 outbound 제한·차단이 흔하다. 앱 인증 발송의 기본값으로 선택하지 않는다. |
| 587 | 제출 + STARTTLS | 평문 연결 후 `STARTTLS`로 TLS로 올리고 인증하는 대표 선택이다. |
| 465 | implicit TLS | 처음부터 TLS로 연결한다. 제공업체가 요구할 때 사용한다. |
| Mailpit 1025 | 로컬 캡처 SMTP | 기본값은 암호화·인증 없음이며 외부로 릴레이하지 않는다. |

587의 STARTTLS와 465의 TLS는 같은 옵션이 아니다. 서버 방식과 클라이언트 설정을 맞춘다.

### 2.3 Boot 설정의 최소 형태

```yaml
# src/main/resources/application.yml
spring:
  mail:
    host: localhost
    port: 1025
    username: ""
    password: ""
    properties:
      "[mail.smtp.auth]": false
      "[mail.smtp.starttls.enable]": false
      "[mail.smtp.connectiontimeout]": 5000
      "[mail.smtp.timeout]": 3000
      "[mail.smtp.writetimeout]": 5000
```

Boot 문서가 지적하듯 일부 JavaMail timeout 기본값은 무한대다. 서버가 응답하지 않을 때 요청 스레드가 끝없이 붙잡히지 않도록 연결·읽기·쓰기 timeout을 명시한다. 운영 SMTP라면 `auth: true`, 제공업체에 맞는 STARTTLS/TLS를 켜고 인증정보는 `${MAIL_USERNAME}`, `${MAIL_PASSWORD}`처럼 외부화한다.

### 2.4 단순 텍스트는 `SimpleMailMessage`

```java
private final JavaMailSender mailSender;

public void sendText(String to, String orderId) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom("no-reply@example.test");
    message.setTo(to);
    message.setSubject("주문 접수: " + orderId);
    message.setText("주문번호 " + orderId + "가 접수되었습니다.");
    mailSender.send(message);
}
```

`send()`가 정상 반환하면 SMTP 서버가 메시지를 받아들였다는 뜻이지 최종 배달 성공의 영수증은 아니다. `MailException`을 잡아 로그만 남기면 성공 응답 뒤 메일이 유실된다. 최소한 발송 상태와 원인, 재시도 횟수를 기록한다.

### 2.5 HTML·첨부·인라인 이미지는 MIME으로 만든다

```java
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

public void sendHtml(Path invoice, String to) throws MessagingException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(
            message, true, StandardCharsets.UTF_8.name());
    helper.setFrom("no-reply@example.test");
    helper.setTo(to);
    helper.setSubject("청구서");
    helper.setText("<html><body><h1>청구서</h1>"
            + "<img src='cid:logo'></body></html>", true);
    helper.addInline("logo", new ClassPathResource("mail/logo.png"));
    helper.addAttachment("invoice.pdf", invoice.toFile());
    mailSender.send(message);
}
```

`multipart=true`가 빠지면 첨부를 담을 수 없다. 본문을 먼저 `setText`한 다음 `addInline`하고, 사용자 입력은 템플릿 엔진으로 escape한다.

### 2.6 제목과 본문 인코딩

`MimeMessageHelper(..., UTF_8.name())`처럼 charset을 명시한다. `SimpleMailMessage`는 MIME multipart 기능이 없고, `setText(body, true)`의 `true`는 HTML 본문이라는 뜻이다.

### 2.7 템플릿은 비즈니스 코드와 분리한다

```html
<!-- src/main/resources/templates/mail/order-completed.html -->
<!doctype html><html><body>
<p th:text="|안녕하세요, ${customerName}님|">안녕하세요.</p>
<p>주문번호: <strong th:text="${orderId}">ORD-1</strong></p>
</body></html>
```

```java
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
public class OrderMailService {
    private final JavaMailSender sender;
    private final SpringTemplateEngine templateEngine;

    public OrderMailService(JavaMailSender sender, SpringTemplateEngine templateEngine) {
        this.sender = sender;
        this.templateEngine = templateEngine;
    }

    public void send(String to, String name, String orderId) {
        Context context = new Context(Locale.KOREA);
        context.setVariable("customerName", name);
        context.setVariable("orderId", orderId);
        String html = templateEngine.process("mail/order-completed", context);
        MimeMessage message = sender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, false, StandardCharsets.UTF_8.name());
            helper.setTo(to);
            helper.setSubject("주문이 완료되었습니다");
            helper.setText(html, true);
            sender.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("메일 MIME 생성 실패", ex);
        }
    }
}
```

실제 프로젝트에서는 Boot가 만든 Thymeleaf 설정을 주입받는다.

### 2.8 동기·비동기·커밋 시점을 나눈다

주문 API에서 SMTP까지 동기로 기다리면 외부 서버 지연이 API latency와 장애 전파로 이어진다. `@Async`는 작업 스레드를 분리하지만, 트랜잭션 커밋 전에 호출되면 롤백된 주문 메일이 나갈 수 있다. 도메인 이벤트를 발행하고 `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)`에서 발송하거나, 더 견고하게 outbox/발송 큐를 둔다.

이 문서에서는 연동 코드만 다루며 비동기·이벤트의 전체 설계는 → S15를 참조한다. 템플릿 엔진 일반론은 → P02를 참조한다.

## 3. 따라 하기

### 3.1 Mailpit을 compose로 실행

```yaml
# compose.yaml
services:
  mailpit:
    image: axllent/mailpit
    container_name: p26-mailpit
    restart: unless-stopped
    ports:
      - "8025:8025" # 웹 UI
      - "1025:1025" # SMTP
```

```bash
docker compose up -d mailpit
docker compose ps
```

확인 방법: `docker compose ps`에서 `p26-mailpit`이 `running`인지 확인하고 `http://localhost:8025`를 연다. 앱도 컨테이너에서 실행하면 host는 `mailpit`이다.

### 3.2 Spring Boot 앱 설정

호스트 실행은 `localhost:1025`, 컨테이너 실행은 `mailpit:1025`다. 컨테이너의 `localhost`는 앱 자신이다.

확인 방법: 시작 로그에 sender 생성 오류가 없는지 확인한다. Mailpit은 기본적으로 인증·암호화 없이 1025를 듣는다.

### 3.3 발송 엔드포인트를 연결

```java
// src/main/java/com/example/mail/MailController.java
package com.example.mail;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class MailController {
    private final OrderMailService mailService;

    @PostMapping("/test-mails")
    ResponseEntity<Void> send(@RequestBody Map<String, String> body) {
        mailService.send(body.get("to"), body.getOrDefault("name", "테스트 사용자"),
                body.getOrDefault("orderId", "ORD-LOCAL-1"));
        return ResponseEntity.accepted().build();
    }
}
```

```bash
curl -i -X POST http://localhost:8080/test-mails \
  -H 'Content-Type: application/json' \
  -d '{"to":"receiver@example.test","name":"홍길동","orderId":"ORD-2026-001"}'
```

확인 방법: API `202 Accepted`와 `http://localhost:8025`의 새 메일, HTML·Raw MIME·첨부를 확인한다. Spring 예제는 `(미실행)`이다.

### 3.4 실패를 기록하고 재시도한다

발송 테이블에는 `id`, `recipient`, `deduplication_key`, `status`, `attempt_count`, `next_attempt_at`, `last_error`, `sent_at`를 둔다. 고유 키를 unique로 만들면 재처리 중복을 막는다.

```java
@Transactional
public void requestOrderMail(Order order) {
    String key = "ORDER:" + order.id();
    if (mailLogRepository.existsByDeduplicationKey(key)) return;
    mailLogRepository.save(MailLog.pending(key, order.email()));
    eventPublisher.publishEvent(new OrderMailRequested(order.id()));
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onCommitted(OrderMailRequested event) {
    // 큐에 넣거나 별도 worker가 PENDING을 가져가게 한다.
}
```

SMTP의 일시 장애만 재시도하고 주소 오류·인증 실패·정책 거부는 영구 실패로 분류한다. worker 장애에 대비해 lease/visibility timeout과 deduplication key를 사용한다.

### 3.5 실서비스 SMTP로 교체

```yaml
spring:
  mail:
    host: ${MAIL_HOST}
    port: ${MAIL_PORT:587}
    username: ${MAIL_USERNAME}
    password: ${MAIL_PASSWORD}
    properties:
      "[mail.smtp.auth]": true
      "[mail.smtp.starttls.enable]": true
      "[mail.smtp.starttls.required]": true
```

Gmail SMTP는 계정 비밀번호 대신 조직 정책상 허용되는 앱 비밀번호/OAuth 방식을 확인한다. AWS SES 같은 전용 서비스는 SMTP 자격증명, sandbox·발송 한도, 리전, 반송·complaint 웹훅을 먼저 확인한다. 어느 제공자든 발신 도메인의 SPF와 DKIM을 설정하고 DMARC 정책까지 운영해야 한다. 한도는 계정·리전·시점에 따라 제공자의 현재 콘솔을 기준으로 한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `JavaMailSender` | Spring 발송 진입점 | `sender.send(message)` | 성공은 SMTP 수락까지만 의미한다. |
| `SimpleMailMessage` | 평문 메일 | `setTo`, `setSubject`, `setText` | HTML·첨부 불가. |
| `MimeMessageHelper` | MIME 메일 | `new MimeMessageHelper(msg, true, "UTF-8")` | 첨부·인라인이면 multipart 필요. |
| `setText(html, true)` | HTML 본문 | `helper.setText(html, true)` | 사용자 입력 escape. |
| `addAttachment` | 파일 첨부 | `addAttachment("a.pdf", file)` | 파일 크기·개인정보 점검. |
| `addInline` | 본문 이미지 | `addInline("logo", resource)` | 본문 설정 후 호출. `cid:logo`와 일치. |
| `spring.mail.host` | SMTP 주소 | `localhost` / `mailpit` | 컨테이너 안의 localhost에 주의. |
| `spring.mail.properties[...]` | JavaMail 옵션 | `connectiontimeout=5000` | 기본 무한 timeout을 방치하지 않는다. |
| `@TransactionalEventListener` | 커밋 뒤 후속 작업 | `phase = AFTER_COMMIT` | 큐·재처리 없이 단독 보장 수단은 아니다. |
| Mailpit UI | 로컬 검증 | `http://localhost:8025` | 운영 SMTP로 착각하지 않는다. |

## 5. 자주 나는 에러와 해결

1. **`535 5.7.8 Username and Password not accepted` / `AuthenticationFailedException` →** 계정·앱 비밀번호가 틀렸거나 SMTP AUTH가 차단됐거나 STARTTLS 전에 인증했다. **해결 →** 제공자의 인증 정책을 확인하고 587+STARTTLS 또는 465+implicit TLS 조합을 맞춘다. 비밀값은 로그에 출력하지 않는다.

2. **`Could not connect to SMTP host: localhost, port: 1025` →** Mailpit이 꺼졌거나 앱이 컨테이너 안에서 `localhost`를 사용한다. **해결 →** `docker compose ps`, `docker compose logs mailpit`을 보고 compose 네트워크에서는 host를 `mailpit`으로 바꾼다.

3. **`SocketTimeoutException: Read timed out` 또는 요청이 오래 끝나지 않는다 →** SMTP timeout 기본값이 무한대이거나 네트워크가 패킷을 버린다. **해결 →** connection/read/write timeout을 설정하고 연결성·포트·provider allowlist를 점검한다.

4. **한글 제목이 `=?UTF-8?...`처럼 보이거나 깨진다 →** MIME charset이 없거나 클라이언트가 헤더를 잘못 해석한다. **해결 →** Helper 생성 시 UTF-8을 지정하고 제목을 직접 Base64 인코딩하지 않는다. Raw MIME과 실제 클라이언트에서 함께 확인한다.

5. **HTML 메일이 평문으로 보이거나 첨부가 본문에 섞인다 →** `setText(body, true)` 또는 `multipart=true`가 빠졌다. **해결 →** HTML 여부와 multipart 생성자를 구분하고 Mailpit의 Raw MIME 구조를 확인한다.

6. **메일은 정상인데 스팸함으로 간다 →** SMTP 연결 성공과 발신자 평판·도메인 인증은 별개다. **해결 →** SPF/DKIM/DMARC, From 도메인 정렬, 반송 주소, 발송량 증가 속도와 내용 품질을 점검한다.

7. **주문 한 건에 메일이 두 번 온다 →** 재시작 또는 timeout 후 서버가 이미 수락했는데 클라이언트가 실패로 판단했다. **해결 →** unique deduplication key, 발송 상태 전이, lease, provider Message-ID를 설계한다. 예외면 무조건 다시 보내지 않는다.

## 6. 한 단계 더

호출 흐름은 `서비스 → JavaMailSender → Jakarta Mail Session → SMTP 서버 → 수신 시스템`이다. `send()`의 예외는 `MailException`으로 추상화되지만 재시도 분류는 애플리케이션 책임이다. Mailpit은 SMTP 수신과 UI/API 검증을 제공한다.

운영에서는 SMTP를 HTTP 성공의 필수 조건으로 두지 말고 커밋 이후 durable job으로 넘긴다. 세부 비동기는 → S15, MVC 계층은 → P02.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `JavaMailSender`와 `SimpleMailMessage`의 관계는?

`JavaMailSender`는 보내는 행위와 MIME 메시지 생성을 제공하는 인터페이스다. `SimpleMailMessage`는 To·From·Subject·평문 값을 담는 객체다. HTML·첨부가 필요하면 `createMimeMessage()`와 `MimeMessageHelper`를 쓴다.

꼬리질문: `send()`가 성공하면 최종 수신을 보장하는가? 아니다. SMTP 서버가 수락한 시점일 뿐이며 반송·스팸 분류·수신자 정책은 별도다.

### Q2. 587 STARTTLS와 465 TLS를 왜 구분하는가?

587은 평문 SMTP 연결 후 STARTTLS로 암호화 채널로 전환하는 제출 포트다. 465는 연결 시작부터 TLS인 implicit TLS다. 서버의 handshake와 클라이언트 속성을 일치시키지 않으면 연결 또는 인증이 실패한다.

꼬리질문: 로컬 Mailpit에서 왜 둘 다 끄는가? 기본 1025는 인증·암호화 없는 캡처 서버이며 개발용 격리 환경에서는 결과 확인이 목적이기 때문이다.

### Q3. HTML 메일에 `MimeMessageHelper`를 쓰는 이유는?

HTML·첨부·inline image는 MIME multipart 구조가 필요하다. Helper가 multipart 경계·Content-Type·charset·Content-ID 설정을 감싼다. 단, `setText(..., true)`와 multipart 생성 여부는 개발자가 명시해야 한다.

꼬리질문: 인라인 이미지가 안 보이면? HTML의 `cid:`와 `addInline` Content-ID, 호출 순서, Raw MIME의 관련 파트를 확인한다.

### Q4. 주문 트랜잭션 안에서 바로 메일을 보내면 안 되는 경우는?

SMTP 지연이 DB 트랜잭션과 API 응답을 붙잡고, 트랜잭션이 롤백돼도 메일이 먼저 나갈 수 있다. 커밋 후 이벤트나 outbox로 발송 의도를 영속화하고 worker가 보낸다.

꼬리질문: `AFTER_COMMIT`만으로 완전한가? 아니다. 커밋 직후 프로세스가 죽으면 작업이 실행되지 않을 수 있으므로 내구성이 필요하면 outbox/큐가 필요하다.

### Q5. 재시도 대상과 즉시 실패 대상을 어떻게 나누는가?

timeout·connection reset·provider 4xx 같은 transient 오류는 제한 횟수와 지수 backoff로 재시도한다. 535 인증 실패·잘못된 주소·정책 거부는 설정을 고치기 전에는 성공하지 않으므로 permanent failure다. 모든 시도와 원인을 기록한다.

꼬리질문: timeout 뒤 중복되는 이유는? 클라이언트가 응답을 못 받아도 SMTP 서버는 이미 수락했을 수 있기 때문이다. deduplication key를 둔다.

### Q6. Mailpit 테스트가 운영 품질을 모두 보장하지 못하는 이유는?

Mailpit은 캡처·렌더링·MIME 검증에는 좋지만 실제 provider의 rate limit, 평판, SPF/DKIM/DMARC 평가, 수신자별 스팸 필터를 재현하지 않는다. 통합 테스트는 Mailpit으로 하고, 운영 전에는 테스트 도메인과 provider 샌드박스/소량 발송으로 검증한다.

꼬리질문: 기본 포트는? SMTP 1025, Docker 기본 웹 UI 매핑은 8025다.

## 8. 참고문헌

- Spring Framework — Email — https://docs.spring.io/spring-framework/reference/integration/email.html — `MailSender`, `JavaMailSender`, `SimpleMailMessage`, `MimeMessageHelper`, 첨부·인라인·템플릿 사용법.
- Spring Boot — Sending Email — https://docs.spring.io/spring-boot/reference/io/email.html — starter 자동설정, `spring.mail.*`, timeout 설정, 기준 버전 표시.
- Mailpit — Features — https://mailpit.axllent.org/docs/ — SMTP 캡처 서버, 웹 UI, API, MIME·HTML 확인 기능.
- Mailpit — SMTP server — https://mailpit.axllent.org/docs/configuration/smtp/ — 기본 1025 포트, STARTTLS/SSL/TLS와 인증 옵션.
- Mailpit — Docker images — https://mailpit.axllent.org/docs/install/docker/ — Docker 실행·compose 예제와 8025/1025 포트 매핑.
- Docker Hub — axllent/mailpit — https://hub.docker.com/r/axllent/mailpit — 공식 이미지 개요와 기능 요약.
