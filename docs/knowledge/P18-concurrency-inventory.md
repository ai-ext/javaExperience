# P18. 동시성 문제 실전 — 재고 차감·좌석 예약을 안전하게

> 재고·좌석의 정답은 애플리케이션 변수의 값이 아니라 DB가 원자적으로 보장해야 한다.
> 기본값은 `UPDATE ... WHERE stock > 0`이고, 여러 행을 함께 판단하거나 충돌 시나리오가 복잡하면 DB 락을 선택한다.
> 락을 써도 중복 요청은 별도 문제이므로 멱등키와 유니크 제약을 함께 둔다.

## 1. 한 줄로 말하면

동시성 문제는 여러 요청이 같은 상태를 읽고 각자 계산한 뒤 저장하면서, 한 요청의 변경이 다른 요청의 변경을 덮어쓰는 문제다. 재고 100개에 100건이 들어와도 `SELECT stock` 후 Java에서 `stock - 1`을 계산해 `UPDATE stock=?`를 하면 0이 아니라 99, 80처럼 남을 수 있다. 해결은 같은 자원을 경쟁하는 경계에서 하나의 원자적 DB 연산, 행 잠금, 버전 검증, 또는 직렬화 중 하나를 선택하는 것이다.

이 문서의 기본 추천은 단순 차감이면 `UPDATE inventory SET stock = stock - 1 WHERE id = ? AND stock > 0`이다. 반환 행 수가 1이면 성공, 0이면 품절이다. 좌석처럼 “특정 좌석 하나”를 예약하는 경우에는 `( 공연_id, 좌석번호 )` 유니크 제약과 트랜잭션을 추가한다.

## 2. 당장 알아야 할 것

### 2.1 문제는 `읽기 → 판단 → 쓰기`가 분리될 때 생긴다

다음 코드는 두 요청이 모두 10을 읽고 9를 쓰는 전형적인 lost update다.

```java
int current = inventory.getStock();
if (current > 0) {
    inventory.setStock(current - 1);
    repository.save(inventory);
}
```

`if`와 `save` 사이에 다른 트랜잭션이 끼어들 수 있다. `synchronized`를 붙여도 서버가 두 대면 각 JVM의 모니터가 서로 다르므로 DB 앞에서는 여전히 경쟁한다.

### 2.2 가장 싼 해결책: 조건부 원자 UPDATE

```java
@Modifying
@Query("update Inventory i set i.stock = i.stock - 1 "
     + "where i.id = :id and i.stock > 0")
int decreaseIfAvailable(@Param("id") Long id);
```

DB의 한 `UPDATE` 문은 같은 행에 대해 직렬화된다. 반환값을 반드시 검사한다.

```java
int changed = repository.decreaseIfAvailable(productId);
if (changed == 0) throw new SoldOutException();
```

재고 이력, 주문 생성 등 여러 테이블을 함께 변경한다면 이 메서드를 `@Transactional` 경계 안에서 호출한다. `@Modifying(clearAutomatically = true)`를 고려할 이유는 벌크 UPDATE가 이미 영속성 컨텍스트에 로드된 객체를 자동으로 갱신하지 않기 때문이다.

### 2.3 비관적 락은 읽은 뒤 여러 판단을 해야 할 때 쓴다

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select i from Inventory i where i.id = :id")
Optional<Inventory> findForUpdate(@Param("id") Long id);
```

조회 순간 DB가 행을 잠그고 트랜잭션 커밋·롤백 때 해제한다. 따라서 조회와 차감을 반드시 같은 `@Transactional` 호출 안에 둔다. MySQL InnoDB의 `SELECT ... FOR UPDATE`도 검색된 인덱스 레코드와 관련 인덱스 엔트리를 잠그며, 자동 커밋 상태에서는 locking read가 의미가 없으므로 명시적 트랜잭션이 필요하다.

### 2.4 낙관적 락은 충돌을 허용하고 재시도한다

```java
@Version
private long version;
```

Hibernate는 UPDATE 조건에 버전을 포함한다. 다른 요청이 먼저 커밋해 버전이 바뀌면 UPDATE 행 수가 0이 되고 예외가 난다. 예외를 잡아 같은 트랜잭션에서 계속 처리하지 말고, 새 트랜잭션으로 다시 읽고 제한 횟수만 재시도한다.

### 2.5 JVM 락의 범위를 오해하지 않는다

`ReentrantLock`은 한 프로세스 내부에서만 유효하다. 인스턴스가 하나이고 DB 작업도 같은 임계구역에서 끝난다는 강한 조건이면 쓸 수 있지만, 수평 확장·장애 조정·락 획득 타임아웃을 해결하지 않는다.

특히 `@Transactional` 메서드 안에서 `lock.unlock()`한 즉시 DB 커밋이 끝났다고 볼 수 없다. Spring 트랜잭션 인터셉터는 대상 메서드가 반환된 뒤 커밋할 수 있으므로, 다음 요청이 락을 얻었을 때 앞 요청의 커밋 전 상태를 읽을 수 있다. 애플리케이션 락을 정답으로 삼지 말고 DB 원자 연산을 우선한다.

### 2.6 Redis 락은 데이터 정합성 락과 구분한다

단일 Redis 인스턴스의 `SET resource token NX PX 30000`은 토큰과 만료시간이 있는 임대(lease)다. 해제는 반드시 “내 토큰일 때만 삭제”하는 Lua 스크립트여야 한다. TTL이 지나 작업이 끝나지 않았거나, GC pause·네트워크 지연 뒤 이전 소유자가 DB를 쓰면 새 소유자와 겹칠 수 있다.

Redis 공식 문서는 Redlock을 다수 노드 과반으로 취득하는 알고리즘으로 설명하지만, Kleppmann은 시간이 만료된 클라이언트가 여전히 작업을 수행하는 문제를 지적한다. 재고·결제처럼 락 실패가 데이터 손상을 뜻하면 Redis 락만으로 보호하지 말고 DB 조건부 UPDATE, 유니크 제약, 펜싱 토큰을 함께 검토한다.

### 2.7 중복 요청은 동시성 락이 해결하지 않는다

사용자가 결제 버튼을 두 번 누르거나 클라이언트가 타임아웃 후 재전송하면, 순차적으로 와도 두 번 차감될 수 있다. `Idempotency-Key`를 요청에 받고 `(user_id, key)` 유니크 키를 저장하여 같은 키의 재요청은 최초 결과를 반환한다. 락과 멱등성은 각각 “동시에 처리하지 않기”와 “같은 의도를 한 번만 반영하기”를 담당한다.

### 2.8 좌석은 재고보다 유니크 제약이 핵심이다

```sql
create unique index uq_booking_seat
    on booking (show_id, seat_no);
```

좌석 행이 미리 있다면 `seat set reserved=true where id=? and reserved=false`의 행 수를 검사한다. 예약 행을 새로 삽입하는 모델이면 두 요청이 모두 “없음”을 읽더라도 유니크 인덱스가 하나를 거부해야 한다. 애플리케이션의 사전 조회만으로 중복 좌석을 막지 않는다.

### 2.9 큐는 강한 직렬화가 필요할 때의 선택지다

상품 ID 또는 공연 ID를 파티션 키로 삼아 같은 키의 명령을 한 소비자가 순서대로 처리하면 충돌 재시도가 줄어든다. 대신 큐 지연, 재처리, 중복 메시지, 소비자 장애, 최종 일관성을 설계해야 한다. 큐에 넣었다고 DB 트랜잭션이 사라지는 것은 아니며 소비자에서 여전히 멱등 처리해야 한다.

## 3. 따라 하기

### 3.1 순수 Java로 경쟁 상태 재현

파일은 `_scratch/P18/LostUpdateDemo.java`에 두고 JDK 21로 실행한다. 모든 스레드가 시작한 뒤 `stock`을 읽게 하고 잠시 멈춰 경쟁 창을 넓혔다.

```java
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;

public class LostUpdateDemo {
    static int stock = 100;

    public static void main(String[] args) throws Exception {
        CountDownLatch start = new CountDownLatch(1);
        List<Thread> workers = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            Thread worker = new Thread(() -> {
                try {
                    start.await();
                    int current = stock;
                    Thread.sleep(1);
                    stock = current - 1;
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            workers.add(worker);
            worker.start();
        }
        start.countDown();
        for (Thread worker : workers) worker.join();
        System.out.println("expected=0, actual=" + stock);
    }
}
```

확인 방법:

```text
expected=0, actual=99
```

100개 요청이 각각 한 번씩 차감했지만, 여러 스레드가 같은 `current`를 읽고 마지막 쓰기가 앞선 쓰기를 덮었다. 실행 스케줄에 따라 실제 값은 달라질 수 있으며, `99`는 한 번의 실행에서 관측한 값이다. `volatile`을 붙여도 읽기와 쓰기 두 동작을 하나로 만들지 못하므로 해결되지 않는다.

### 3.2 Spring Boot 프로젝트 뼈대

Boot 4.1.1과 Spring Data JPA 4.1.x 기준의 Gradle Kotlin DSL이다. MySQL 드라이버 버전은 프로젝트의 Boot dependency management에 맡긴다.

`settings.gradle.kts`

```kotlin
rootProject.name = "inventory-concurrency"
```

`build.gradle.kts`

```kotlin
plugins {
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
    java
}

group = "example"
version = "0.0.1-SNAPSHOT"

java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.mysql:mysql-connector-j")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

Maven 대응은 `org.springframework.boot:spring-boot-starter-parent:4.1.1`을 parent로 두고 같은 starter를 `<dependencies>`에 추가하는 방식이다.

### 3.3 조건부 원자 차감 구현

`src/main/java/example/inventory/Inventory.java`

```java
package example.inventory;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory")
public class Inventory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private int stock;
    protected Inventory() {}
    public Long getId() { return id; }
    public int getStock() { return stock; }
}
```

`src/main/java/example/inventory/InventoryRepository.java`

```java
package example.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    @Modifying(clearAutomatically = true)
    @Query("update Inventory i set i.stock = i.stock - 1 "
         + "where i.id = :id and i.stock > 0")
    int decreaseIfAvailable(@Param("id") Long id);
}
```

`src/main/java/example/inventory/InventoryService.java`

```java
package example.inventory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
    private final InventoryRepository repository;
    public InventoryService(InventoryRepository repository) { this.repository = repository; }

    @Transactional
    public void decrease(Long id) {
        if (repository.decreaseIfAvailable(id) != 1) {
            throw new SoldOutException();
        }
    }
    static class SoldOutException extends RuntimeException {}
}
```

확인 방법: 실제 MySQL에서 재고 1인 상품에 동시에 요청을 보내고 성공 응답이 정확히 하나인지, DB의 `stock`이 음수가 아닌지 확인한다. 이 예제는 외부 주문 저장을 생략했으므로, 주문까지 묶을 때는 같은 서비스 트랜잭션에 넣고 실패 시 차감도 롤백되게 한다. Spring 예제는 Boot 4.1 실행 환경이 없어 미실행이다.

### 3.4 비관적·낙관적 락의 형태

비관적 락 저장소:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select i from Inventory i where i.id = :id")
Optional<Inventory> findForUpdate(@Param("id") Long id);
```

서비스는 `@Transactional`에서 `findForUpdate()` → 재고 확인 → `save()` 순으로 실행한다. 대기 시간을 제한하려면 DB별 `NOWAIT`/timeout 설정을 확인한다. MySQL의 `SKIP LOCKED`는 큐처럼 잠긴 행을 건너뛸 때만 쓰며, 일반 재고 조회에는 일관되지 않은 결과가 되어 부적합하다.

낙관적 락 엔티티:

```java
@Version
private long version;
```

서비스는 `for (int attempt = 1; attempt <= 3; attempt++)`처럼 새 트랜잭션 호출을 반복하고, `ObjectOptimisticLockingFailureException`을 받으면 짧은 backoff 후 재시도한다. 세 번 모두 충돌하면 409 응답이나 “잠시 후 다시 시도”를 반환한다. 트랜잭션 안에서 자기 자신을 직접 호출해 재시도하면 Spring 프록시를 통과하지 않아 새 트랜잭션이 되지 않을 수 있으므로 재시도 메서드를 별도 빈으로 분리한다.

### 3.5 동시 요청 테스트

Spring 통합 테스트에서는 `CountDownLatch`로 100개 작업을 동시에 시작하고 `ExecutorService`로 HTTP 또는 서비스 호출을 한다. 검증값은 “성공 횟수 + 초기 재고 = 최종 재고”와 “성공 횟수 ≤ 초기 재고”다.

서비스 메서드를 단위 테스트로 순차 호출하는 것만으로는 경쟁 상태를 검출하지 못한다. 테스트 DB가 실제 운영 DB와 다른 락·격리 동작을 가지면 Testcontainers로 같은 MySQL 계열을 사용한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 조건부 UPDATE | 단일 카운터 차감 | `stock=stock-1 where stock>0` | 반환 행 수 검사 |
| `@Lock(PESSIMISTIC_WRITE)` | 읽고 여러 판단 후 수정 | `findForUpdate()` | 트랜잭션·대기시간 필요 |
| `@Version` | 충돌 감지 | `private long version` | 실패 재시도 필요 |
| `synchronized` | 단일 JVM 임계구역 | `synchronized` 메서드 | 서버 여러 대에 무효 |
| `ReentrantLock` | JVM 락 타임아웃·공정성 | `tryLock()` | DB 커밋 경계와 불일치 |
| Redis `SET NX PX` | 분산 효율 락·짧은 작업 | 토큰+TTL | lease 만료·펜싱 문제 |
| 유니크 인덱스 | 좌석 중복 차단 | `(show_id, seat_no)` | 예외를 정상 경쟁 결과로 변환 |
| 큐 파티션 | 키별 순차 처리 | `productId` 파티션 | 지연·중복·재처리 설계 |
| 멱등키 | 재전송 중복 차단 | `Idempotency-Key` | 키와 결과 저장 필요 |

선택 기준 비교:

| 방식 | 정확성 | 처리량 | 데드락 | 서버 수 | 복잡도 |
|---|---|---|---|---|---|
| JVM 락 | 한 JVM에서만 | 낮음~중간 | 가능 | 1대 전제 | 낮음 |
| 원자 UPDATE | 높음 | 높음 | 낮음 | 무관 | 낮음 |
| 비관적 락 | 높음 | 경합 시 낮음 | 가능 | 무관 | 중간 |
| 낙관적 락 | 재시도 전제 높음 | 충돌 적을 때 높음 | DB deadlock은 별도 | 무관 | 중간 |
| Redis 락 | 설정·실패 모델 의존 | 높음 | TTL에 의존 | 무관 | 높음 |
| 큐 | 순서·멱등 설계 시 높음 | 지연 허용 시 높음 | 소비자에서 가능 | 무관 | 높음 |

## 5. 자주 나는 에러와 해결

1. `재고가 남았는데 실제 값이 줄지 않음` → 읽기와 저장 사이에 lost update가 발생했다 → 조건부 UPDATE 또는 락으로 판단과 변경의 경계를 DB에 둔다.
2. `재고가 -1이 됨` → `if (stock > 0)` 검사가 UPDATE와 분리됐다 → `where stock > 0`을 UPDATE에 포함하고 영향받은 행을 검사한다.
3. `PessimisticLockException`, `LockTimeoutException` → 다른 트랜잭션이 행을 오래 잡았거나 락 순서가 다르다 → 트랜잭션을 짧게 하고 접근 순서를 통일하며 timeout·재시도를 둔다.
4. `ObjectOptimisticLockingFailureException` → 같은 엔티티를 다른 트랜잭션이 먼저 커밋했다 → 새 트랜잭션에서 재조회 후 제한 재시도, 초과 시 충돌 응답을 반환한다.
5. `@Modifying` 호출 뒤 조회 객체가 예전 재고를 보임 → 벌크 UPDATE가 영속성 컨텍스트의 기존 객체를 갱신하지 않았다 → `clearAutomatically = true` 또는 명시적 `entityManager.clear()` 후 다시 조회한다.
6. `좌석 중복키 예외` → 동시에 두 요청이 같은 좌석을 삽입했다 → 유니크 제약은 유지하고 해당 예외를 “이미 예약됨” 409로 변환한다. 사전 `exists` 조회만 추가하는 것은 해결이 아니다.
7. `Redis 락을 풀었는데 다른 작업의 락까지 삭제됨` → 고정 키 `DEL`을 사용했다 → 소유 토큰을 비교하는 원자 Lua 해제 스크립트를 쓴다. 그래도 만료 후 작업 문제는 남는다.

## 6. 한 단계 더

DB 원자 UPDATE는 한 행의 조건과 변경을 한 문장으로 묶어 경쟁을 DB 엔진에 맡긴다. 비관적 락은 충돌을 미리 막고, 낙관적 락은 충돌을 감지해 재시도한다. Redis 락은 DB 상태 자체를 잠그는 기능이 아니라 시간 제한 임대이므로 정합성의 유일한 방어선이 되면 안 된다. 큐는 동시성을 없애는 대신 지연과 재처리를 시스템으로 옮긴다. 어떤 방식을 택해도 유니크 제약, 멱등성, timeout, 관측 가능한 성공·충돌 지표가 필요하다.

JMM과 happens-before의 세부 원리 → J10 참조. 트랜잭션 격리수준 → S08 참조. JPA 영속성 컨텍스트와 락 상세 → S09 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `synchronized`로 재고 차감을 감싸면 충분한가?

단일 JVM의 모든 요청이 같은 객체를 통과할 때만 해당 JVM 안에서 충분하다. 서버가 두 대면 모니터가 분리되고, `@Transactional` 커밋이 unlock 뒤에 일어나면 DB 상태까지 보호하지 못한다. 단순 차감은 조건부 UPDATE가 더 직접적이다.

꼬리질문: 서버가 한 대여도 언제 DB 연산을 택하는가?

답: 재시작·스케일아웃·배치 작업까지 같은 정합성 규칙으로 묶어야 하므로 기본적으로 DB를 택한다.

### Q2. `stock > 0`을 Java에서 검사하고 `stock - 1`을 저장하면 왜 틀리는가?

두 트랜잭션이 같은 값을 읽을 수 있고, 각각 계산한 결과를 순서대로 써서 앞선 차감을 덮는다. 원자성은 `읽기`, `판단`, `쓰기`를 분리하지 않는 데서 나온다. 조건부 UPDATE의 영향 행 수가 성공 여부가 된다.

꼬리질문: `AtomicInteger`면 DB 재고도 안전한가?

답: 아니다. 한 JVM 메모리 값만 원자화하며 DB·다른 서버·트랜잭션 롤백과 연결되지 않는다.

### Q3. 비관적 락과 낙관적 락은 어떻게 고르는가?

충돌이 빈번하고 실패 재시도가 비싸거나 여러 행을 순서대로 판단해야 하면 비관적 락을 검토한다. 충돌이 드물고 대기 없이 높은 동시성을 원하면 `@Version` 낙관적 락과 제한 재시도가 적합하다. 둘 다 트랜잭션 경계와 timeout을 설계해야 한다.

꼬리질문: 낙관적 락 예외를 같은 트랜잭션에서 다시 시도해도 되는가?

답: 실패한 영속성 컨텍스트의 상태를 그대로 쓰지 말고, 새 트랜잭션에서 다시 읽어야 한다.

### Q4. `SELECT ... FOR UPDATE`를 호출했는데도 락이 안 걸리는 것 같다. 이유는?

자동 커밋이면 SELECT 문이 끝날 때 트랜잭션도 끝나 락을 유지할 작업 구간이 없다. 명시적 트랜잭션에서 조회·판단·수정을 실행해야 한다. 인덱스가 없어 예상보다 넓은 범위를 잠그는 문제도 실행 계획으로 확인한다.

꼬리질문: `SKIP LOCKED`를 재고 차감에 써도 되는가?

답: 잠긴 행을 빠뜨려 일관되지 않은 뷰가 되므로 일반 재고 판단에는 부적합하며, 큐 소비처럼 건너뛰기가 의미 있는 경우에만 쓴다.

### Q5. Redis Redlock이면 결제 좌석을 안전하게 보호할 수 있는가?

Redlock은 다수 Redis 노드에서 임대를 취득하는 알고리즘이지만, TTL 만료·GC 정지·네트워크 지연 뒤 이전 작업이 계속 쓰는 문제를 없애지 않는다. correctness가 핵심이면 DB 유니크 제약이나 조건부 UPDATE가 최종 방어선이어야 한다.

꼬리질문: Redis 락이 유용한 경우는?

답: 중복 계산을 줄이는 효율성 락처럼 실패해도 데이터가 망가지지 않는 작업에 적합하다. 정합성 락이면 펜싱 토큰 등 별도 설계가 필요하다.

### Q6. 멱등키와 락은 무엇이 다른가?

락은 겹치는 시간의 동시 실행을 조정하고, 멱등키는 같은 의도의 재전송을 한 번의 결과로 만든다. 요청이 순차적으로 두 번 와도 락만으로는 두 번 차감된다. 따라서 주문·결제 API는 멱등키 저장과 DB 원자 차감을 함께 둔다.

꼬리질문: 멱등키 저장과 업무 저장이 분리되면?

답: 키만 저장되고 업무가 실패하거나 반대 순서로 커밋될 수 있으므로 같은 DB 트랜잭션 또는 상태 머신으로 결과와 키를 함께 관리한다.

### Q7. 좌석 예약에서 `existsByShowIdAndSeatNo()` 후 insert하면 왜 부족한가?

두 요청이 동시에 exists 결과를 false로 읽은 뒤 모두 insert할 수 있다. DB의 `unique(show_id, seat_no)`가 최종 경쟁 판정자가 되어야 하며, 중복키 예외를 정상적인 예약 실패 응답으로 바꾼다. 좌석이 미리 존재하면 조건부 UPDATE도 사용할 수 있다.

꼬리질문: 큐를 쓰면 유니크 제약이 필요 없는가?

답: 중복 메시지·재처리·운영자 재전송이 있으므로 여전히 멱등키와 유니크 제약이 필요하다.

## 8. 참고문헌

- Hibernate ORM 7.0 User Guide — https://docs.jboss.org/hibernate/orm/7.0/userguide/html_single/Hibernate_User_Guide.html#locking — `@Version`과 비관적·낙관적 락 동작을 확인한 Hibernate 공식 가이드.
- MySQL 8.4 Reference Manual, Locking Reads — https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html — `FOR UPDATE`, `NOWAIT`, `SKIP LOCKED`, 트랜잭션 해제 규칙을 확인한 문서.
- Spring Data JPA, Locking — https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html — repository 메서드의 `@Lock` 사용법과 Spring Data JPA 4.1.1 문서 버전을 확인.
- Distributed Locks with Redis — https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/ — `SET NX PX`, Redlock의 안전성·생존성 모델과 구현 링크를 확인.
- How to do distributed locking — https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html — Redis 락을 효율성 락과 정합성 락으로 구분하고 lease·펜싱 한계를 설명한 비평.
