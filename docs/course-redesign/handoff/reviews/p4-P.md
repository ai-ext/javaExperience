**1) 판정: FAIL**

의도한 결함은 대체로 구현됐고 패치의 텍스트 충돌도 발견하지 못했습니다. 그러나 **B04의 미완성 수정을 통과시키는 확인 테스트, B15·E01 수정 후에도 남는 캐시 경합, 검증의 무제한 대기** 때문에 전체 PASS로 판정할 수 없습니다.

읽기 전용으로 검증했습니다. 파일 수정·패치 적용·Gradle·Docker 실행은 하지 않았으며, 아래 런타임 결과는 코드로 예상한 결과입니다. 구현자의 실행 성공 기록을 이번 검증의 실행 결과로 간주하지 않았습니다.

**2) 문제 목록**

**① major — B04 확인 테스트가 핵심 증상을 고치지 않은 수정도 통과시킵니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B04/answer/B04ConfirmTest.java:203](../../../../messy-server/tickets/B04/answer/B04ConfirmTest.java), 같은 파일 221행.

검사하는 구조 조건은 다음 두 가지입니다.

```java
assertThat(injected).as("필드 주입").isEmpty();
assertThat(findCycle(edges)).as("빈 의존 순환(이름 → 이름)").isEmpty();
```

필드 주입을 생성자 주입으로 바꾸고 댓글 작성자 조회를 Repository로 옮기면 순환을 끊을 수 있습니다. 하지만 **세 군데의 `switch (channel)`은 그대로 남겨도** 기존 알림 동작과 위 두 검사를 모두 만족합니다. 이 경우 `KAKAO`를 추가하면 여전히 세 API가 실패합니다.

수정 방법: 기존 채널의 동작 보존에 더해, 새 채널을 추가했을 때 글·댓글 서비스의 기존 분기를 수정하지 않고 확장할 수 있는지 검증해야 합니다. 특정 정답 클래스명이나 파일 개수를 강제하는 검사는 피해야 합니다.

**② major — B15·E01 패치를 함께 적용해도 이전 조회 결과가 숨김 커밋 후 캐시를 다시 채울 수 있습니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/E01/answer/fix.patch:66](../../../../messy-server/tickets/E01/answer/fix.patch), [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/src/main/java/com/example/board/post/PostCacheEvictListener.java:20](../../../../messy-server/src/main/java/com/example/board/post/PostCacheEvictListener.java).

```java
List<PopularPost> loaded = loadFromDb();
...
redis.opsForValue().set(KEY, value, TTL)
```

무효화는 별도로 `redis.delete(KEY)`만 수행합니다. 따라서 코드상 다음 경합이 가능합니다.

1. 캐시 미스 요청 A가 아직 ACTIVE인 글을 DB에서 읽습니다.
2. 숨김 요청 B가 커밋하고 AFTER_COMMIT에서 캐시를 삭제합니다.
3. A가 앞서 읽은 결과를 뒤늦게 Redis에 저장합니다.
4. 숨김 응답 이후의 요청에도 해당 글이 다시 노출됩니다.

E01의 진행 중인 `loading` 역시 무효화 세대를 구분하지 않습니다. 기존 B15 테스트는 인기글 조회를 **완료한 다음** 숨김 커밋을 허용하므로 이 순서를 검사하지 않습니다.

수정 방법: 적재 결과의 저장·공유와 무효화를 같은 동기화 규칙으로 묶고, 무효화 이전의 조회 결과를 폐기해야 합니다. `DB 조회 완료 → 숨김 커밋·삭제 → 늦은 캐시 저장` 순서의 테스트도 필요합니다. **실행 재현은 하지 않은 코드 기반 경합 분석입니다.**

**③ major — B15 정답 테스트가 무한 대기할 수 있고, 확인 테스트도 특정 SQL 모양에 의존합니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B15/answer/fix.patch:124](../../../../messy-server/tickets/B15/answer/fix.patch).

```java
while (jdbc.queryForObject(
        ... "AND INFO LIKE 'update post%'", Long.class) == 0) {
    Thread.sleep(20);
}
```

숨김 요청이 UPDATE 전에 실패하면 이 반복문은 끝나지 않습니다. 뒤에 있는 `hide.get(10, TimeUnit.SECONDS)`까지 도달하지 못하므로 그 제한 시간은 도움이 되지 않습니다.

또한 [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B15/answer/B15ConfirmTest.java:97](../../../../messy-server/tickets/B15/answer/B15ConfirmTest.java)는 제한 시간은 있지만 같은 UPDATE 문자열을 요구합니다. 학습자가 `SELECT … FOR UPDATE`로 먼저 잠그는 올바른 수정과 AFTER_COMMIT 무효화를 조합하면, UPDATE에 도달하기 전에 대기하므로 오탐할 수 있습니다.

수정 방법: 정답 테스트에도 마감 시간과 `hide.isDone()` 검사를 넣고 실패 원인을 회수해야 합니다. 동기화 지점은 특정 SQL 문자열 대신 대상 트랜잭션·행의 잠금 상태를 관찰하도록 보완해야 합니다.

**④ major — E01 확인 테스트가 결정적인 RED와 대기 상한을 검증하지 못합니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/E01/answer/E01ConfirmTest.java:77](../../../../messy-server/tickets/E01/answer/E01ConfirmTest.java).

```java
ready.await(10, TimeUnit.SECONDS);
start.countDown();
...
assertThat(queries.count("findPopular")).isEqualTo(1);
```

시작 신호를 맞춰도 여러 요청이 첫 캐시 저장 전에 실제로 캐시 미스를 관찰했다는 보장은 없습니다. **스케줄링에 따라 결함 코드가 우연히 통과할 가능성**이 있습니다. `ready.await`의 반환값도 확인하지 않습니다.

또한 지연 주입이 없으므로, 문서에서 금지한 상한 없는 `lock()`으로 수정해도 정상 환경에서는 통과합니다. `Future.get(30초)`는 테스트 종료 제한이지 서비스의 대기 상한 검증이 아닙니다.

수정 방법: 첫 적재를 제어된 지점에서 멈추고 후속 요청이 진입한 것을 확인한 뒤 해제하십시오. 별도로 느린 적재·적재 실패 상황에서 후속 요청의 제한 시간과 폴백을 검사해야 합니다.

**⑤ minor — B04·B15 페이지가 접기 밖에서 원인을 설명합니다. B04 재현 테스트 이름도 실제와 다릅니다.**

위치:

- [$WORKTREE_ROOT/p1-spec-roadmap/course/tickets/B04.md:16](../../../../course/tickets/B04.md)
- [$WORKTREE_ROOT/p1-spec-roadmap/course/tickets/B15.md:21](../../../../course/tickets/B15.md)

접기 밖에 다음 설명이 있습니다.

> “컨텍스트가 순환 참조(`postServiceImpl` ↔ `commentService`)로 뜨지 않는다.”

> “캐시 삭제·다른 요청의 재적재·커밋이 어떤 순서로 일어나 옛 값이 남는가”

증상만 제공하고 원인은 `<details>` 안에 둔다는 기준에서 벗어납니다. B04는 `PostCreateApiTest`·`CommentApiTest`·`PostCrudApiTest`가 실패한다고 안내하지만, 실제 스크립트는 `B04ReproTest`를 생성해 실행합니다.

수정 방법: 본문에는 관찰되는 응답·노출 현상과 중립적인 제출 조건을 남기고, 원인·구체적인 경합 순서는 접기 안으로 옮기십시오. 테스트 이름도 실제 실행 대상에 맞춰야 합니다.

**⑥ minor — E01의 일자 표기는 맞지만 roadmap 티켓 연결은 B15로 남아 있습니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/course/roadmap.json:1534](../../../../course/roadmap.json).

```json
"tickets": [
  "B15"
]
```

D14 ⑤ 제목과 과제는 E01의 스탬피드 방지인데 티켓 ID는 B15입니다. E01 페이지의 `D14 ⑤` 자체는 맞습니다.

수정 방법: D14 ⑤의 티켓 연결을 E01로 수정하십시오. B15는 관련 티켓으로 별도 연결할 수 있습니다. **P 담당 커밋 밖의 통합 정합성 문제입니다.**

**⑦ minor — B04 재현 스크립트는 환경·컴파일 실패를 숨기고 정상 종료할 수 있습니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/tickets/B04/repro.sh:86](../../../../messy-server/tickets/B04/repro.sh), 같은 파일 96행.

```bash
./gradlew ... >/dev/null 2>&1 || true
xml_failures "응답 코드"
```

Gradle이 테스트 전에 실패해 XML을 만들지 않으면 `xml_failures`는 아무것도 출력하지 않고 성공합니다. 두 실행 모두 이 방식이어서 증상을 재현하지 못해도 스크립트가 정상 종료할 수 있습니다.

수정 방법: Gradle 로그를 보존하고 XML 존재·실행 테스트 수·예상 실패 원인을 확인하십시오. JDK·컴파일·컨테이너 오류와 의도한 재현 결과를 구분해야 합니다.

**⑧ major — 정답 서버와 동시에 실행하면 Redis의 호스트 포트가 충돌합니다.**

위치: [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/compose.yaml:21](../../../../messy-server/compose.yaml), [$WORKTREE_ROOT/p1-spec-roadmap/board-server/compose.yaml:20](../../../../board-server/compose.yaml).

두 Compose 모두 다음 포트를 공개합니다.

```yaml
- "16379:6379"
```

messy 애플리케이션의 Redis 접속 포트는 16380으로 분리됐지만, Redis 컨테이너 자체의 16379 공개가 남아 있습니다. 원장의 “정답 서버와 동시 실행” 전제에서는 Compose 기동이 막힐 수 있습니다.

수정 방법: messy Redis의 직접 호스트 공개를 제거하거나 다른 포트로 분리하십시오. 현재 재현 스크립트의 `docker compose exec … redis-cli`에는 호스트 포트 공개가 필요하지 않습니다. **P 담당 6개 커밋의 직접 변경은 아니지만 B02·B15·E01 재현 환경에 영향을 줍니다.**

**⑨ major · 추가 확인 필요(추정) — B04 알림 추가가 상호 댓글 요청의 회원 잠금 교착을 만들 수 있습니다.**

위치:

- [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/src/main/java/com/example/board/comment/CommentService.java:48](../../../../messy-server/src/main/java/com/example/board/comment/CommentService.java)
- [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/src/main/java/com/example/board/post/PostServiceImpl.java:272](../../../../messy-server/src/main/java/com/example/board/post/PostServiceImpl.java)
- [$WORKTREE_ROOT/p1-spec-roadmap/messy-server/src/main/resources/schema.sql:109](../../../../messy-server/src/main/resources/schema.sql)

```java
Member member = memberRepository.findByIdForUpdate(memberId)
...
postService.notifyCommentAdded(postId, member, content);
```

```sql
FOREIGN KEY (member_id) REFERENCES member (id)
```

A가 B의 글에, B가 A의 글에 동시에 댓글을 달면 각자 자기 회원 행의 배타 잠금을 잡은 뒤 알림 INSERT의 FK 검사에서 상대 회원 행 잠금을 요구할 수 있습니다. B04 정답 패치도 이 흐름을 유지합니다.

수정 방법: 두 요청의 작성자 잠금 획득 뒤 알림 INSERT를 동시에 진행시키는 테스트로 먼저 확인하십시오. 재현된다면 필요한 회원 잠금을 일정한 순서로 확보하도록 수정해야 합니다. **이번에는 DB에서 재현하지 않았으므로 확정 발생 결과로 보고하지 않습니다.**

**3) 확인한 것 목록**

| 티켓 | 결함·확인 테스트·수정의 정적 대조 |
|---|---|
| **B02** | `(id,status)`와 최근 HIDDEN 집중 분포가 결합된 결함입니다. 실제 매퍼 SQL의 `EXPLAIN ANALYZE`에서 읽은 행 ≤100, 첫·다음 페이지의 결과 동일성을 검사합니다. 인덱스 이름을 강제하지 않습니다. `(status,id)` 패치는 타당하며 기존 DB에는 별도 ALTER가 필요하다는 안내도 있습니다. |
| **B04** | 세 채널 분기, 필드 주입 순환, `@Lazy`가 실제 존재합니다. 알림 동작 4개와 구조 검사 2개가 분리돼 있습니다. 패치는 채널별 구현·알림 서비스·생성자 주입으로 정리하지만 ①의 채점 공백이 있습니다. 800줄보다 작은 규모는 원장에 명시된 Ruling이므로 문제로 잡지 않았습니다. |
| **B09** | UTC `Clock`의 `LocalDate.now(clock)`이 원인입니다. 같은 KST 날짜 반복, KST 자정 넘김, UTC 자정 넘김을 모두 검사하며 HTTP 상태·출석 날짜·적립 건수·잔액을 봅니다. KST 기준으로 instant를 날짜로 변환하는 패치는 타당합니다. Clock 빈 자체를 KST로 바꾸는 수정은 허용하지 않는다는 원장의 제한도 확인했습니다. |
| **B15** | 트랜잭션 안의 직접 `evict()`가 원인입니다. 확인 테스트는 커밋 전 조회 끼워 넣기와 롤백 시 캐시 보존을 검사합니다. AFTER_COMMIT 수정은 해당 순서를 해결하지만 ②·③의 한계가 있습니다. |
| **E01** | 기존 적재 락과 동시성 테스트가 제거됐습니다. 확인 테스트는 100요청의 상태·조회 횟수·응답 동일성을 검사합니다. 패치에 캐시 재확인과 1초 대기가 있지만 ②·④를 보완해야 합니다. |

추가로 직접 확인한 사항입니다.

- 지정한 **6개 커밋 모두 종료 시점 HEAD `8c42899a0156e2319cdc6f588faef047cd06ca36`의 조상**입니다. 검증 중 다른 작업의 커밋으로 HEAD가 이동했지만, 대상 티켓 산출물은 `46aa001f` 이후 변경 및 미커밋 변경이 없었습니다.
- **5개 패치 모두 `git apply --check` 종료 코드 0**, **5개 재현 스크립트 모두 `bash -n` 종료 코드 0**입니다. 실제 적용·실행 성공을 의미하지는 않습니다.
- 메모리에서 패치 문맥을 순차 대조한 결과, 대상 5개는 **31개 hunk**, 전체 17개는 **70개 hunk**가 충돌 없이 매칭됐습니다. B15·E01 역순도 매칭됐습니다.
- B04의 `build.gradle` 수정은 ArchUnit 추가이며 다른 티켓 패치와 겹치지 않습니다. B15 정답 패치는 `AdminService`, E01 정답 패치는 `PopularPostService`를 수정합니다.
- MySQL **13311**, Redis 프록시 **16380**, PG 프록시 **18667**의 연결은 설정과 일치합니다. 별도의 16379 충돌은 ⑧에 기재했습니다.
- 대상 운영 코드에서 `결함`, 티켓 ID, `BUG`, `FIXME` 같은 직접적인 결함 표시를 발견하지 못했습니다.
- 자체 테스트에서 B02의 인덱스 검사와 E01의 동시 적재 검사만 제거한 방향은 적절합니다. B09는 날짜 경계를 검사하지 않는 얇은 테스트이고, B15의 기존 테스트는 조회가 끼어들지 않는 순차 흐름이라 의도한 결함을 드러내지 않습니다.
- 모든 티켓에 제출물과 원인·정답 `<details>`가 있습니다. 일자 표기는 B02 D12 ②, B04 D11 ②·④, B09 D13 ③, B15 D14 ③, E01 D14 ⑤로 맞습니다. 본문 원인 노출과 E01 ID 연결은 별도 문제입니다.
- **결함 상태의 실제 단언 실패, 수정 후 통과, messy 전체 테스트 통과는 이번 읽기 전용 검증에서 실행 확인하지 않았습니다.**

model=gpt-6-astra
