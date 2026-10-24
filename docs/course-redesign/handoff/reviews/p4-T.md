**1) 판정: FAIL**

결함 주입과 정답 패치의 방향은 대체로 설계에 맞지만, **B05의 결정적 재현 요건 미충족, B01·B06 확인 테스트의 관측 조건 누락** 때문에 검증 완료로 판정할 수 없습니다.

검토 HEAD는 `d1efa9188ce9b26cbf78a9a06e18d6319c344102`입니다. 대상 파일은 `fdb7604c` 이후 변경이 없었습니다. 파일은 수정하지 않았으며, Gradle·Docker·재현 스크립트는 실행하지 않았습니다. 아래에서 실행 결과와 정적 분석을 구분합니다.

**2) 문제 목록**

**① [major] B05 — CyclicBarrier가 결함 발생 순서를 보장하지 않는다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B05/answer/B05ConfirmTest.java:51](../../../../messy-server/tickets/B05/answer/B05ConfirmTest.java)

```java
barrier.await(10, TimeUnit.SECONDS);
if (checker.contains(dirty ? DIRTY : CLEAN) != dirty) {
    wrong.incrementAndGet();
}
```

- **근거:** 동기화는 `contains()` 진입 전에만 있습니다. 공유 필드 쓰기·덮어쓰기·읽기 사이에는 없습니다. 4스레드×3000회는 충돌 가능성을 높이지만, 스레드가 차례로 실행되면 결함 상태에서도 통과할 수 있습니다.
- 계획의 “공유 필드 쓰기 → 다른 요청 덮어쓰기 → 첫 요청 읽기 순서를 제어” 조건을 충족하지 못합니다. 페이지의 “매번” 재현 설명도 과장입니다.
- **수정:** 테스트 전용 계측으로 해당 교차 순서를 제어하고 결과를 단언해야 합니다. 반복 부하는 보조 검사로 남깁니다. 정상적인 지역 변수·동기화 방식의 수정까지 특정 필드 존재 여부로 제한해서는 안 됩니다.

**② [major] B01 — 충전 부하가 실제로 걸리지 않아도 통과할 수 있다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B01/answer/B01ConfirmTest.java:59](../../../../messy-server/tickets/B01/answer/B01ConfirmTest.java)

```java
while (PgContainers.approveRequestCount() < 10 && System.nanoTime() < deadline) {
    Thread.sleep(20);
}
...
assertThat(status).isEqualTo(200);
assertThat(elapsedMillis).isLessThan(1000);
```

- **근거:** 대기 종료 후 PG 요청이 있었는지, 아직 진행 중인지 확인하지 않습니다. 저장한 `charges`의 결과도 읽지 않습니다. 충전 API가 전부 즉시 실패하는 수정도 글 목록만 빠르면 통과합니다.
- 대기 상한 3초가 PG 응답 타임아웃 3초와 같습니다. 부하가 늦게 형성되면 측정 전에 일부 트랜잭션이 끝나 결함을 놓칠 가능성도 있습니다.
- **수정:** 정확히 10건이라는 구현 제약 대신, 유효한 충전이 실제 PG 대기 구간에 있다는 조건을 확인하고 충전 결과도 검사해야 합니다. 벌크헤드 같은 다른 올바른 수정은 허용해야 합니다.
- **CPU 경합 위험:** 예열은 했지만 1초 절대 상한에는 스케줄링·GC·컨테이너 지연도 포함됩니다. 정상 수정의 오탈락 가능성이 있습니다.

**③ [major] B06 — ALTER 관측 실패를 무시하고 다음 단계로 진행한다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B06/answer/B06ConfirmTest.java:89](../../../../messy-server/tickets/B06/answer/B06ConfirmTest.java)

```java
waitUntil(1000, () -> alter.isDone() || alterWaitingForMetadataLock());

pool.submit(() -> order(second, itemId));
boolean applied = waitUntil(1500, () -> balance(second) == 900);
```

- **근거:** 첫 `waitUntil()`의 반환값을 버립니다. ALTER 작업이 아직 시작되지 않아도 두 번째 주문을 보낼 수 있어, 의도한 “ALTER 뒤 주문” 순서가 보장되지 않습니다.
- 4초짜리 웹훅 지연과 1.5초 판정 창도 실제 경과 시간에 의존합니다. CPU 경합에서는 정상 수정의 오탈락과 결함 상태의 미검출이 모두 가능합니다.
- **수정:** ALTER 완료 또는 실제 MDL 대기 관측을 필수 전제로 단언하고, 미관측은 환경·준비 실패로 구분해야 합니다. 웹훅은 해제 신호까지 대기하게 만들어 관찰 구간을 고정하고, 두 번째 주문의 `Future`도 회수해 응답을 확인하는 편이 정확합니다.

**④ [major, 정적 추론] B06 — 기본 DB 계정으로 진단 조회가 실패할 가능성이 높다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B06/repro.sh:26](../../../../messy-server/tickets/B06/repro.sh), 같은 파일 67줄

```bash
sql() { docker compose exec -T mysql mysql -uboard -pboard board -e "$1" 2>/dev/null; }
...
sql "SELECT trx_mysql_thread_id, trx_started, trx_state, LEFT(trx_query, 60) FROM information_schema.innodb_trx"
```

- **근거:** `INNODB_TRX` 조회에 필요한 `PROCESS` 권한을 부여하는 설정은 현재 compose에 없습니다. 기본 `board` 계정에서 실패하면 `set -e`로 종료하며, 오류 출력도 버려 원인이 보이지 않습니다.
- **미확인:** 실제 컨테이너의 `SHOW GRANTS`는 조회하지 않았습니다. 사용자가 별도로 권한을 부여한 환경에서는 달라질 수 있습니다.
- **수정:** 진단 조회는 B07처럼 별도 관리 계정을 사용하거나 필요한 권한을 전제로 명시하고, 조회 오류를 출력해야 합니다.

**⑤ [minor] B07 — 자동 확인이 1213과 다른 실패를 구분하지 않는다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B07/answer/B07ConfirmTest.java:35](../../../../messy-server/tickets/B07/answer/B07ConfirmTest.java), 48줄

```java
assertThat(statuses).containsOnly(201);
...
assertThat(statuses).containsOnly(201, 409);
```

- **근거:** 테스트는 HTTP 상태와 발급 수량만 확인합니다. 500의 원인이 1213인지 다른 오류인지 구분하지 않고, 409도 `/errors/coupon-exhausted`인지 검사하지 않습니다.
- 커밋 `926ddfc8`에는 **1213·SQLState 40001 확인 보고**가 있습니다. 따라서 “1213을 확인한 적 없다”고 판정하지는 않습니다. 다만 이번 검토에서 원시 로그까지 독립 확인하지는 못했습니다.
- 재현 스크립트의 `LATEST DETECTED DEADLOCK` 출력도 이번 요청에서 발생한 기록인지 확인하지 않습니다.
- **수정:** 결함 검증 단계에서 해당 실행의 SQL 오류 코드·데드락 기록을 보관하고, 정상 동작 테스트에서는 409의 오류 유형까지 확인합니다.

**⑥ [minor] B10 — 재현 스크립트는 ‘포인트 두 번 적립’까지 실행하지 않는다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B10/repro.sh:14](../../../../messy-server/tickets/B10/repro.sh)

```bash
# UNKNOWN 건은 PG 콜백이나 재처리 워커(ChargeService.reconcile)가
# PG 조회로 DONE이 되면서 한 번 더 적립된다
# ... 스크립트는 콜백을 보내지 않는다.
```

- **근거:** 스크립트는 중복 PG 요청과 `UNKNOWN 1건 + DONE 1건`까지 만듭니다. 실제 운영 소스에서 `reconcile()`을 호출하는 워커도 찾지 못했습니다. 따라서 스크립트만 실행하면 두 번째 적립은 일어나지 않습니다.
- 확인 테스트는 조회 스텁을 추가하고 `reconcile()`을 직접 호출하므로 이 공백을 보완합니다. 스크립트와 테스트의 재현 범위가 다릅니다.
- **수정:** “중복 승인 요청 재현”과 “정산 후 중복 적립 재현”을 구분하고, 후자까지 실행할 별도 절차를 제공해야 합니다.

**⑦ [minor] B05 — 제출물에 원인 단서가 접기 밖으로 노출된다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/course/tickets/B05.md:20](../../../../course/tickets/B05.md)

> “어떤 값이 어디에 저장되어 다른 요청과 섞였는가, `volatile`은 왜 막지 못했는가”

- **근거:** 학습자가 조사하기 전에 `volatile` 사용과 그 실패를 직접 알려 줍니다. “증상만 공개, 원인은 접기 안” 기준에 어긋납니다.
- **수정:** 제출물은 “동시 요청에서 결과가 달라지는 원인과 재현 근거”로 쓰고, `volatile` 질문은 힌트 접기 안으로 이동합니다.

**⑧ [minor] B07 — 일부 설명이 실제 코드·남아 있는 테스트와 다르다**

파일: [$WORKTREE_ROOT/p1-spec-roadmap/course/tickets/B07.md:37](../../../../course/tickets/B07.md), 62줄

> “상대의 `insert intention`을 기다리는 모습”  
> “동시 발급 테스트가 … 지워져 있다”

- **근거:** 실제 경로는 `increaseIssued()`가 먼저 쿠폰 행을 잠급니다. 페이지 53줄의 설명처럼 한쪽은 INSERT의 갭 락을, 다른 쪽은 쿠폰 행 락을 기다리는 순환이 핵심입니다. 두 요청이 모두 INSERT 대기라는 힌트는 맞지 않습니다.
- 해당 동시 발급 테스트들은 삭제가 아니라 단언이 약화됐으며, 다른 동시성 검사도 남아 있습니다.
- **수정:** 힌트를 실제 잠금 순서와 맞추고 “일부 동시 발급 단언을 약화했다”로 정정합니다.

**3) 확인한 것 목록**

| 티켓 | 결함·패치 대조 결과 | 확인 테스트 평가 |
|---|---|---|
| B01 | PG 호출이 `tx.execute()` 안에 있음. 패치는 외부 호출을 밖으로 이동하며 저장·반영 트랜잭션 유지 | 사용자 관측 동작을 검사하지만 부하 전제·1초 상한 문제 있음 |
| B03 | self-invocation과 별도 빈 REQUIRED 예외 경로 모두 존재. 패치는 실제 주문 트랜잭션·회원 잠금 복구 및 쿠폰 소진 예외 제거 | 바깥 테스트 트랜잭션 없이 주문·재고·쿠폰·잔액 확인. 특정 애노테이션이나 메서드 구조를 강제하지 않음 |
| B05 | 싱글톤의 `lastText`·`lastFolded` 공유 상태가 실제 경쟁 원인. 지역 변수 패치는 타당 | 동작 기반이며 `synchronized` 같은 수정도 허용하지만 결정적 RED는 아님 |
| B06 | 실제 주문 후 알림 경로가 읽기 트랜잭션 안에서 웹훅 대기. 패치는 본문 생성만 짧은 트랜잭션으로 분리 | MDL 관측 조건과 시간 창 보완 필요. 비동기 알림 같은 대안 자체를 금지하지 않음 |
| B07 | 없는 발급 행의 잠금 조회 → 쿠폰 UPDATE → INSERT 구조 확인. 패치는 비잠금 조회·UNIQUE 방어 유지 | 결과 기반이나 1213 원인 증거와 409 유형 검증은 별도 보완 필요 |
| B10 | 응답 타임아웃 후 새 UUID·새 주문으로 재충전. 패치는 재요청을 제거하고 UNKNOWN 확정 경로 유지 | 첫 지연·후속 즉시 응답 시나리오와 실제 요청 `orderId` 기반 정산 확인. 승인 수는 독립 승인 장부가 아니라 서로 다른 키 수로 추정하는 한계가 있음 |

추가 확인 결과입니다.

- **누적 패치:** 정방향·역방향 `git apply --check` 모두 종료 코드 0. 메모리 내 정확한 문맥 대조에서도 **720개 적용 순서 모두 충돌 없음**. B01/B10, B03/B07의 공유 파일과 B06의 별도 알림 파일을 확인했습니다. 컴파일·실행 성공까지 의미하지는 않습니다.
- **스크립트:** 6개 모두 `bash -n` 통과. MySQL `13311`, Redis 프록시 `16380`, PG 프록시 `18667`은 현재 설정과 일치합니다. B03·B06은 로컬 시드 상품·남은 재고, B05는 금칙어 삽입 후 재기동이 필요합니다.
- **페이지:** 6개 모두 증상·환경·제출물·접힌 힌트·접힌 정답 구조를 갖춥니다. 같은 날 표기는 B01 D12①, B03 D12③, B05 D12④, B06 D13①, B07 D13②, B10 D13④로 roadmap과 일치합니다.
- **결함 표시 주석:** 대상 운영 코드에 티켓 번호나 “심은 결함”을 직접 알리는 주석은 발견하지 못했습니다. 잘못된 설계를 합리화하는 주석 형태입니다.
- **자체 테스트 약화:** B01 경계 테스트 삭제, B03 원자성·멱등성 검사 삭제/약화, B07 동시 발급 단언 약화, B10 재시도·시간 상한 단언 제거는 각 결함과 연결됩니다. B05는 기존 검사에서 `volatile` 필드를 허용해 통과하는 구조입니다.
- **자체 테스트 통과 여부:** 실행하지 않았으므로 확정하지 않습니다. 특히 B07에는 `Redis_수량이_DB보다_많아도_DB_총량까지만_발급된다` 등 강한 동시성 단언이 남아 있어, 반복 실행 안정성은 별도 확인 대상입니다.
- **`@Value` 영향:** B03은 기본값 `0`, B06은 빈 URL로 비활성화됩니다. 확인 테스트에서만 속성을 켭니다. 기존 `BoardPropertiesTest`는 해당 빈을 로드하거나 `@Value` 사용을 전역 검사하지 않으므로, 이것만으로 다른 테스트가 깨지는 직접 경로는 발견하지 못했습니다.
- 원장의 “전체 테스트·6건 `--full`·누적 검증 OK”는 **구현자 보고**로 확인했으며, 이번 검증에서 재실행한 결과로 취급하지 않았습니다.

model=gpt-6-astra
