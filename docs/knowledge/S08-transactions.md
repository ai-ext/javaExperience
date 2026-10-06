# S08. 트랜잭션 관리

> 3줄 요약 — Spring 트랜잭션은 `PlatformTransactionManager`가 자원 트랜잭션을 시작·커밋·롤백하고, `@Transactional`은 그 경계를 선언하는 방법이다.  
> 기본값은 대개 기존 트랜잭션에 참여하는 `REQUIRED`, 데이터베이스 기본 격리수준, 읽기 전용 아님, `RuntimeException`·`Error` 롤백이며 checked 예외는 기본 롤백 대상이 아니다.  
> 트랜잭션은 한 자원 경계 안에서만 원자적이다. 데이터베이스 변경과 메시지 발행을 함께 보장하려면 아웃박스로 내구성 있는 이벤트 전달을 설계한다.

## 1. 왜 알아야 하나

주문 저장은 성공했는데 결제 메시지가 전송되지 않거나, 재고 차감은 실패했는데 주문 행은 남는 장애는 DB 커밋과 브로커 전송을 하나의 원자적 작업이라 착각해 생긴다. `@Transactional`은 두 시스템을 묶지 않는다.

`IOException` 같은 checked 예외는 기본 롤백 대상이 아니므로 변경이 커밋될 수 있다. 내부 호출이나 `private` 메서드에만 붙인 애노테이션도 프록시를 통과하지 않으면 적용되지 않는다.

면접에서는 `REQUIRES_NEW`의 풀 고갈, `readOnly=true`의 힌트 성격, `SERIALIZABLE`의 재시도 비용까지 설명해야 설계 판단으로 이어진다.

## 2. 핵심 개념

| 용어 | 의미 | 알아둘 점 |
|---|---|---|
| 트랜잭션 경계 | 원자적으로 성공·실패할 작업 구간 | 대개 서비스 메서드에 둔다. |
| `PlatformTransactionManager` | 명령형 자원의 시작·커밋·롤백 계약 | JDBC·JPA·JTA 등 자원에 맞는 구현이 필요하다. |
| 논리·물리 트랜잭션 | 애노테이션 호출 범위 / DB 자원에서 실제 시작된 경계 | 여러 논리 범위가 한 물리 트랜잭션에 참여할 수 있다. |
| 전파 | 기존 트랜잭션 참여·중단·신규 생성 규칙 | 중첩 호출의 물리 경계를 정한다. |
| 격리 | 동시 작업의 읽기·쓰기 상호 영향을 제한하는 수준 | DB 기본값과 구현이 다를 수 있다. |
| rollback-only | 최종 커밋 대신 롤백하라는 상태 | 바깥 커밋 시 `UnexpectedRollbackException`으로 드러날 수 있다. |

### `PlatformTransactionManager`의 역할

`getTransaction(TransactionDefinition)`은 기존 상태를 얻거나 새 트랜잭션을 시작하고, `commit`·`rollback`이 완료한다. 애플리케이션은 보통 애노테이션이나 `TransactionTemplate`을 쓰며, 공통 전파·동기화 처리는 `AbstractPlatformTransactionManager`, 자원 처리는 JDBC·JPA·JTA별 구현체가 맡는다. 지원하지 않는 옵션은 거부될 수 있고 `ISOLATION_DEFAULT`는 기반 저장소 기본값이다. JPA 영속성 컨텍스트는 → S09 참조.

### 전파 7종

| 전파 | 기존 트랜잭션이 있을 때 | 없을 때 | 흔한 용도·주의 |
|---|---|---|---|
| `REQUIRED` | 참여 | 새로 시작 | 기본 선택. 내부 범위의 rollback-only가 외부 범위에도 영향을 준다. |
| `REQUIRES_NEW` | 바깥 트랜잭션을 보류하고 독립 트랜잭션 시작 | 새로 시작 | 감사 로그처럼 바깥 롤백과 독립시킬 때. 추가 커넥션이 필요해 풀 고갈 가능성이 있다. |
| `NESTED` | 하나의 물리 트랜잭션 안에서 savepoint 생성 | 새로 시작 | 부분 롤백. 주로 JDBC savepoint 지원에 의존하며 모든 매니저에서 같은 동작을 보장하지 않는다. |
| `SUPPORTS` | 참여 | 트랜잭션 없이 실행 | 읽기 전용 코드에 쓸 수 있으나 실제 트랜잭션 없이도 동기화 범위가 생길 수 있다. |
| `MANDATORY` | 참여 | 예외 | 호출자가 반드시 트랜잭션을 열어야 하는 내부 계약을 강제한다. |
| `NOT_SUPPORTED` | 바깥 트랜잭션을 보류하고 트랜잭션 없이 실행 | 트랜잭션 없이 실행 | 트랜잭션이 필요 없는 느린 작업을 분리할 때. 보류·재개 의미는 관리자에 좌우된다. |
| `NEVER` | 예외 | 트랜잭션 없이 실행 | 트랜잭션 안에서 호출되면 안 되는 경계를 검증할 때 쓴다. |

`REQUIRED`는 서비스-저장소 호출의 기본 선택이다. 안쪽이 rollback-only를 표시하면 같은 물리 트랜잭션을 쓰는 바깥 커밋도 실패하며 `UnexpectedRollbackException`이 발생한다. `REQUIRES_NEW`는 보류된 바깥 커넥션 외에 새 커넥션을 요구하므로 풀을 동시 스레드 수보다 최소 하나 크게 잡는 등 고갈을 고려한다. `NESTED`는 한 물리 트랜잭션의 savepoint 롤백이고 `REQUIRES_NEW`는 독립 커밋이다. 전자는 JDBC 매니저·드라이버의 savepoint 지원을 확인한다.

### 격리수준과 동시성 이상

| 수준 | 방지하는 이상(표준 정의) | 남을 수 있는 이상 |
|---|---|---|
| `READ_UNCOMMITTED` | 보장 없음 | dirty read, non-repeatable read, phantom read |
| `READ_COMMITTED` | dirty read | non-repeatable read, phantom read |
| `REPEATABLE_READ` | dirty read, non-repeatable read | phantom read |
| `SERIALIZABLE` | 세 가지 읽기 이상 | 직렬화 실패·교착으로 인한 트랜잭션 실패 및 재시도 필요성 |

- **Dirty read**: 커밋 전 값을 읽음. 작성 트랜잭션이 롤백하면 존재하지 않을 값을 처리한 셈이다.
- **Non-repeatable read**: 같은 행을 다시 읽었을 때 다른 트랜잭션의 커밋으로 값이 달라진다.
- **Phantom read**: 조건 검색 결과 행 집합이 다른 트랜잭션의 커밋으로 달라진다.
- **Serialization anomaly**: 동시 실행 결과가 어떤 직렬 실행 순서와도 같지 않은 현상이다.

표는 SQL 표준 기준이며 DB별 구현은 다르다. PostgreSQL 18은 `READ UNCOMMITTED`를 `READ COMMITTED`처럼 구현하고 `REPEATABLE READ`에서 phantom도 막는다. `ISOLATION_DEFAULT`는 DB 기본값이므로 잠금·MVCC 동작과 함께 확인한다.

### `@Transactional` 속성

| 속성 | 의미와 실무 주의 |
|---|---|
| `propagation` | 위 일곱 전파 규칙. 명시하지 않으면 `REQUIRED`. |
| `isolation` | 새 물리 트랜잭션의 격리수준. 이미 있는 트랜잭션에 참여하면 기본적으로 내부 선언은 적용되지 않는다. |
| `readOnly` | 읽기 최적화를 위한 힌트. DB와 매니저에 따라 최적화가 다르며 쓰기 금지를 보장하는 보안 규칙은 아니다. |
| `timeout` / `timeoutString` | 트랜잭션 시간 제한(초 또는 프로퍼티 기반). 보통 새 트랜잭션에만 적용되고 자원·관리자 지원이 필요하다. |
| `rollbackFor` / `noRollbackFor` | 예외 타입 기준 롤백·커밋 규칙. 타입 안전성이 있어 패턴보다 우선 고려한다. |
| `rollbackForClassName` / `noRollbackForClassName` | 예외 이름 부분 문자열 기준. 와일드카드가 아니며 유사 이름도 매치할 수 있다. |
| `transactionManager` / `value` | 여러 관리자가 있을 때 사용할 관리자 빈을 지정한다. 기본 관리자 선택이 모호하면 명시한다. |

메서드 설정은 클래스 기본값을 덮어쓴다. 참여 중인 `REQUIRED`에서 격리·timeout은 바뀌지 않는다. 설정 불일치 검출에는 `validateExistingTransaction`을 검토한다.

## 3. 내부 동작·원리

### 선언적 경계의 호출 흐름

```text
호출자
  │ 프록시를 통한 메서드 호출
  ▼
TransactionInterceptor ── @Transactional 메타데이터 읽기
  │
  ├─ PlatformTransactionManager.getTransaction(definition)
  │    ├─ REQUIRED: 현재 트랜잭션에 참여하거나 새 트랜잭션 시작
  │    ├─ REQUIRES_NEW: 현재 트랜잭션 보류, 새 트랜잭션 시작
  │    └─ TransactionStatus와 자원 문맥 준비
  ▼
대상 서비스 메서드 실행 ── JDBC/JPA 접근
  │
  ├─ 정상 반환 ── commit(status)
  └─ 예외 발생 ── 롤백 규칙 매칭 → rollback 또는 commit
       (rollback-only도 최종 커밋 시 반영)
  ▼
커넥션 등 자원 정리, 보류한 트랜잭션이 있으면 재개
```

애노테이션은 설정 메타데이터다. `TransactionInterceptor`가 호출을 감싸 매니저에 경계를 요청한다. JDBC 트랜잭션 자원은 보통 현재 스레드에 묶이므로 새 스레드로 전파되지 않으며, 리액티브 작업은 Reactor Context를 따른다. 기본 롤백 대상은 `RuntimeException`과 `Error`; checked 예외를 내부에서 잡아 정상 반환하면 인터셉터는 롤백할 근거가 없으므로 필요 시 rollback-only를 표시한다.

### 전파는 호출 경계와 물리 자원을 나눈다

전파는 논리 호출 범위를 기존 자원에 참여시키거나 보류·분리한다. 격리수준과 timeout은 새 물리 트랜잭션에서만 설정된다. 기존 트랜잭션 참여 시 내부 설정은 기본적으로 무시되며, 불일치를 오류로 만들려면 `validateExistingTransaction`을 켠다.

### 롤백 규칙 매칭

기본 동작은 `RuntimeException`과 `Error` 롤백, checked 예외 커밋이다. 따라서 업무 실패를 checked 예외로 표현한다면 `rollbackFor = DomainException.class`처럼 타입을 구체적으로 선언한다. 반대로 특정 예외여도 커밋해야 한다면 `noRollbackFor`를 사용한다. 충돌하는 규칙이 있을 때는 예외 계층에서 더 구체적으로 일치하는 규칙을 의도해야 하며, 이름 일부를 포함하는 문자열 규칙은 유사 접미사나 중첩 예외까지 맞을 수 있어 피하는 편이 안전하다.

Spring Framework 6.2부터 `@EnableTransactionManagement(rollbackOn = RollbackOn.ALL_EXCEPTIONS)`로 애플리케이션의 기본 정책을 모든 예외 롤백으로 바꿀 수 있다. 설정한 기본 정책보다 개별 트랜잭션의 명시적인 규칙이 우선한다. Kotlin은 checked 예외 강제가 없으므로 checked 예외에 의존하지 않는 전역 정책이 특히 유용하다. 한편 비동기 `Future`/`CompletableFuture`는 원래 메서드가 반환할 당시 이미 예외 완료 상태인 경우 롤백과 연결될 수 있지만, 반환 후 나중에 실패하는 비동기 작업까지 원래 DB 트랜잭션이 기다려 보장하지 않는다.

### 이벤트와 커밋의 관계

`@TransactionalEventListener`는 Spring 애플리케이션 이벤트를 트랜잭션 단계에 묶는다. 기본 `AFTER_COMMIT`은 DB 커밋이 성공한 뒤 처리하고, `BEFORE_COMMIT`, `AFTER_ROLLBACK`, `AFTER_COMPLETION`도 선택할 수 있다. 트랜잭션이 없으면 기본적으로 리스너를 호출하지 않으며, 일반 이벤트처럼 실행하려는 특수 상황에서만 `fallbackExecution=true`를 쓴다. 이는 프로세스 안에서 커밋 여부와 후처리 시점을 맞추는 기능이지, 브로커까지 원자적 전달을 보장하는 큐가 아니다.

## 4. 코드로 확인

### 예제 1 — 서비스 경계와 checked 예외 롤백

Spring 7 API 예제다. 저장소 구현·컨테이너·DB 구성에 연결해야 한다. **(미실행: Spring 컨테이너 및 DB 구성 필요)**

```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

interface TransferRepository {
    void debit(long accountId, long cents) throws InsufficientFundsException;
    void credit(long accountId, long cents);
}

final class InsufficientFundsException extends Exception { }

@Service
class TransferService {
    private final TransferRepository repository;

    TransferService(TransferRepository repository) {
        this.repository = repository;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, timeout = 3,
                   rollbackFor = InsufficientFundsException.class)
    public void transfer(long from, long to, long cents)
            throws InsufficientFundsException {
        repository.debit(from, cents);
        repository.credit(to, cents);
    }
}
```

`timeout=3`은 3초이며 기존 트랜잭션에 참여하면 새 제한시간이 되지 않는다. 동시 잔액 변경 제어는 → P18 참조.

### 예제 2 — `TransactionTemplate`으로 좁은 구간을 명시

특정 구간만 명령형으로 묶을 때 쓴다. **(미실행: Spring 컨테이너 및 DB 구성 필요)**

```java
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

interface ImportRepository {
    boolean insertIfAbsent(String key, String value);
}

@Component
class ImportService {
    private final ImportRepository repository;
    private final TransactionTemplate transactions;

    ImportService(ImportRepository repository,
                  PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.transactions = new TransactionTemplate(transactionManager);
    }

    boolean importOne(String key, String value) {
        return Boolean.TRUE.equals(transactions.execute(status -> {
            boolean inserted = repository.insertIfAbsent(key, value);
            if (!inserted) {
                status.setRollbackOnly();
            }
            return inserted;
        }));
    }
}
```

예외는 롤백 규칙을 따르고 `setRollbackOnly()`는 예외 없이 롤백을 표시한다. 리액티브 흐름에는 `TransactionalOperator`를 쓴다.

### 예제 3 — 커밋 후 알림과 그 한계

커밋 이후 실행하는 리스너 예다. **(미실행: Spring 컨테이너 구성 필요)**

```java
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

record OrderCommitted(long orderId) { }

interface NotificationGateway {
    void publishOrderCommitted(long orderId);
}

@Component
class OrderNotificationListener {
    private final NotificationGateway gateway;

    OrderNotificationListener(NotificationGateway gateway) {
        this.gateway = gateway;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void afterCommit(OrderCommitted event) {
        gateway.publishOrderCommitted(event.orderId());
    }

}
```

트랜잭션 안에서 이벤트를 발행하면 롤백 시 리스너는 실행되지 않는다. 다만 커밋 후 전송 전 프로세스가 종료되면 유실될 수 있어, 중요한 외부 이벤트는 아웃박스에 기록한다.

## 5. 버전별 변화 — 왜 바뀌었나

| 버전 | 변화와 이전 방식의 한계 | 근거 |
|---|---|---|
| Spring 4.2 | `@TransactionalEventListener`로 일반 이벤트에서 부족했던 커밋·롤백 단계 선택을 지원했다. | [Transaction-bound Events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html) |
| Spring 6.1 | 반환 시 이미 실패한 `Future`/`CompletableFuture` 롤백 지원과 리액티브 트랜잭션 이벤트를 추가했다. 후자는 Reactor Context를 이벤트에 담아야 한다. | [Rollback](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html), [Events](https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html) |
| Spring 6.2 | `@EnableTransactionManagement`에서 checked 예외를 포함한 `ALL_EXCEPTIONS` 기본 롤백을 선택할 수 있다. 이전 기본값은 checked 예외를 커밋했다. | [API](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/EnableTransactionManagement.html) |
| 기준: Framework 7.0.9 / Boot 4.1.1 | 현재 API와 예제 기준. 세부 자원 지원은 DB·드라이버마다 확인한다. | [관리 버전](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html) |

## 6. 실무 가이드

- **기본값 추천:** 같은 DB의 변경 여러 개를 묶는 서비스 진입 메서드에 `@Transactional`과 `REQUIRED`를 쓴다. 저장소 호출이 한 커밋에 참여한다.
- if 내부 실패가 전체 업무를 취소해야 하면 `REQUIRED`; 안쪽 예외를 삼킨다면 rollback-only와 바깥 결과를 명시한다.
- if 로그처럼 바깥 롤백과 독립시킬 DB 작업이면 `REQUIRES_NEW`를 검토하되 추가 커넥션과 독립 커밋을 감당할지 확인한다.
- if 일부 작업만 되돌려 계속해야 하면 `NESTED`의 savepoint 지원을 확인한다. 독립 커밋은 `REQUIRES_NEW`다.
- if 호출자가 트랜잭션을 열어야 하면 `MANDATORY`, 트랜잭션 안에서 실행되면 안 되면 `NEVER`로 계약한다.
- if checked 예외가 업무 실패면 구체 `rollbackFor` 타입이나 6.2+ `ALL_EXCEPTIONS`를 선택한다. 이름 패턴은 피한다.
- if 조회 최적화가 목적이면 `readOnly=true`를 힌트로만 쓰고 권한 통제는 DB에서 보장한다. 격리수준을 올릴 때는 성능·잠금·재시도를 평가한다.
- if 외부 작업이 길면 DB 경계를 짧게 둔다. 커밋 뒤 메시지 유실을 허용할 수 없으면 outbox를 쓰고 소비자는 멱등하게 만든다. 다중 서비스 업무 흐름은 → S20 참조.

### 아웃박스: DB 커밋과 메시지 전달 사이를 메우기

이중 쓰기는 DB와 브로커의 결과가 어긋날 수 있다. 비즈니스 변경과 이벤트 행을 **같은 DB 트랜잭션**에 저장하고, 별도 폴러나 CDC 릴레이가 커밋된 행을 발행한다.

```sql
CREATE TABLE outbox_event (
    event_id     UUID PRIMARY KEY,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type   VARCHAR(200) NOT NULL,
    payload      TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL,
    published_at TIMESTAMP NULL
);
```

삽입과 비즈니스 변경을 같은 메서드에서 커밋한다. 발행 후 표시 전 릴레이가 죽으면 중복될 수 있으므로 `event_id`로 중복을 제거하고 필요한 순서·재시도·정리 규칙을 둔다. 여러 서비스 DB에 걸친 업무는 → S20 참조.

## 7. 함정·안티패턴

1. **checked 예외를 던졌는데 데이터가 저장됨** → 기본 롤백 규칙은 `RuntimeException`과 `Error` 중심이라 checked 예외에서 커밋 가능 → `rollbackFor` 타입 규칙이나 전역 `ALL_EXCEPTIONS`를 적용하고 실제 예외 타입을 확인한다.
2. **내부 호출의 `REQUIRES_NEW`가 무시됨** → 같은 객체의 `this.other()` 호출이 프록시를 통과하지 않아 내부 `@Transactional` 메타데이터가 적용되지 않음 → 트랜잭션 경계가 다른 책임을 별도 빈으로 분리해 외부 빈 호출로 만들거나 적절한 프로그램 방식 API를 사용한다. 프록시 원리는 → S02 참조.
3. **`private` 메서드 트랜잭션이 시작되지 않음** → 프록시가 가로챌 호출 경로가 없음 → 외부 진입점인 서비스 메서드에 경계를 둔다.
4. **안쪽 작업 실패 뒤 `UnexpectedRollbackException`** → `REQUIRED`가 rollback-only를 표시했는데 바깥이 커밋을 시도함 → 실패를 호출 계약에 드러내고 전체 롤백 여부를 결정한다.
5. **`REQUIRES_NEW` 뒤 풀 대기·교착** → 보류된 바깥 트랜잭션이 커넥션을 점유한 채 안쪽이 추가 자원을 요구함 → 동시성 기준으로 풀과 독립 커밋 필요성을 검토한다.
6. **`readOnly=true`인데 쓰기가 성공함** → 읽기 전용은 최적화 힌트이지 보안 규칙이 아님 → 권한은 DB에서 통제한다.
7. **커밋 후 이벤트 유실** → `@TransactionalEventListener`와 브로커 사이에 프로세스 종료 구간이 있음 → outbox와 멱등 소비를 쓴다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. `PlatformTransactionManager`와 `@Transactional`의 관계는?

`@Transactional`은 속성 메타데이터고, `PlatformTransactionManager`는 명령형 자원에서 실제 경계를 만든다. 인터셉터가 속성을 읽고 `getTransaction`, `commit`, `rollback`을 호출한다. 매니저가 관리하지 않는 메시지 브로커까지 자동으로 하나의 DB 트랜잭션이 되지는 않는다.  
꼬리질문: 리액티브에서는 무엇이 다른가? **Reactor Context를 쓰는 `ReactiveTransactionManager`를 사용하며 ThreadLocal 트랜잭션과 구분한다.**

### Q2. 내부 `REQUIRED` 메서드가 rollback-only가 되면 왜 바깥 커밋에서 예외가 나는가?

둘은 논리 호출 범위는 달라도 같은 물리 트랜잭션에 참여한다. 안쪽 범위의 실패를 바깥이 예외 처리했다고 실제 자원 트랜잭션이 커밋 가능 상태로 돌아오는 것은 아니다. 바깥 호출자가 성공으로 오해하지 않도록 `UnexpectedRollbackException`으로 롤백 사실을 알린다.  
꼬리질문: 둘 중 하나만 롤백하려면? **JDBC savepoint 기반 `NESTED`를 검토하되 자원 지원을 확인한다.**

### Q3. `REQUIRES_NEW` 대신 `NESTED`를 선택할 수 있는 상황은?

안쪽 작업 일부를 되돌려도 바깥 물리 트랜잭션을 계속 커밋해야 한다면 savepoint를 제공하는 `NESTED`가 맞을 수 있다. `REQUIRES_NEW`는 물리 트랜잭션이 독립이라 안쪽이 커밋한 뒤 바깥이 실패해도 안쪽 데이터가 남는다. 독립 커넥션이 필요해 풀 압박도 커진다.  
꼬리질문: JPA에서 `NESTED`가 항상 동작하는가? **아니다. 매니저·드라이버의 savepoint 지원에 의존한다.**

### Q4. checked 예외를 던졌는데 롤백되지 않는 이유와 해결책은?

Spring 기본 규칙이 `RuntimeException` 및 `Error`에 롤백하고 checked 예외에는 커밋하는 정책이기 때문이다. 업무 실패 checked 예외에 `rollbackFor = SomeException.class`를 선언한다. Spring 6.2 이상에서는 전역 기본을 `ALL_EXCEPTIONS`로 바꿀 수도 있다.  
꼬리질문: 예외 이름 패턴 대신 타입을 권하는 이유는? **부분 문자열 매칭이라 유사한 이름이나 중첩 예외까지 뜻밖에 일치할 수 있다.**

### Q5. `isolation=SERIALIZABLE`이면 재시도 코드는 필요 없는가?

아니다. 직렬화 결과를 보장하기 위해 DB가 충돌하는 트랜잭션을 실패시키는 구현이 흔하다. 실패를 전체 업무 단위에서 재시도할 수 있도록 멱등성, 최대 재시도, backoff를 준비해야 한다. 또 격리수준은 새 물리 트랜잭션에만 적용되는지 확인한다.  
꼬리질문: Spring의 `ISOLATION_DEFAULT`는 항상 `READ_COMMITTED`인가? **아니다. 기반 데이터베이스의 기본 격리수준을 따른다.**

### Q6. `@TransactionalEventListener(AFTER_COMMIT)`와 아웃박스의 차이는?

전자는 Spring 프로세스 안에서 커밋 후 리스너를 실행하는 시점을 맞춰준다. 커밋 뒤 프로세스가 죽으면 외부 메시지 전송이 누락될 수 있다. 아웃박스는 이벤트 발행 의도를 DB 변경과 같은 커밋에 저장해 릴레이 재시도를 가능하게 한다.  
꼬리질문: 아웃박스가 중복 전달을 없애는가? **아니다. 소비자 멱등 처리와 이벤트 ID 기반 중복 제거를 설계한다.**

## 9. 참고문헌

- Transaction Management — https://docs.spring.io/spring-framework/reference/data-access/transaction.html — 공식 개요.
- `PlatformTransactionManager` API — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/PlatformTransactionManager.html — 관리자 계약.
- `TransactionDefinition` API — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/TransactionDefinition.html — 전파·격리 상수.
- Transaction Propagation — https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html — 범위별 전파 동작.
- Using `@Transactional` — https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html — 선언적 설정.
- Rolling Back a Declarative Transaction — https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html — 기본 규칙과 예외 롤백.
- `@EnableTransactionManagement` API — https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/EnableTransactionManagement.html — 6.2 정책 설정.
- Programmatic Transaction Management — https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html — `TransactionTemplate`.
- Transaction-bound Events — https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html — 트랜잭션 단계 이벤트.
- PostgreSQL Transaction Isolation — https://www.postgresql.org/docs/current/transaction-iso.html — 이상 현상과 DB 차이.
- Transactional outbox pattern — https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html — 이중 쓰기 대응.
- Spring Boot managed dependencies — https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html — 관리 버전.
