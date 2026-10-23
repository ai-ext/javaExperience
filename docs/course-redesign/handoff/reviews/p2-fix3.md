**1) 판정: PASS-with-issues**

`6a0176b4`의 **정렬 통일 방식은 타당합니다.** `utf8mb4_0900_ai_ci`에서 ASCII 숫자로 표현한 양수 ID 문자열은 Redis의 바이트 사전순과 같은 순서로 비교됩니다.

정상 형식 데이터에서는 기존 동점 정렬·페이지 내부 합산 문제가 해소됐습니다. 다만 **0패딩 member가 남은 환경은 정리 전까지 FAIL**이며, 재구축 경합과 테스트 공백은 남습니다.

대상 커밋과 현재 `board-server` 사이에 차이가 없음을 확인했습니다. 파일 수정·JUnit 실행·DB 및 Redis 데이터 변경은 하지 않았습니다.

**2) 문제 목록**

**① major — 조건부: 이전 0패딩 member가 남으면 중복·점수 분리가 지속됨**

위치: [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/java/com/example/board/point/ActivityRankingService.java:51](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/java/com/example/board/point/ActivityRankingService.java:51), 같은 파일 103행.

```java
redis.opsForZSet().incrementScore(KEY, memberId.toString(), score)
```

```java
.map(t -> new MemberScore(Long.valueOf(t.getValue()), t.getScore().longValue()))
```

키는 기존 `ranking:activity` 그대로입니다. 패딩 member `"0000000000000000009"=10`이 남은 상태에서 `add(9L, 2)`를 실행하면 `"9"=2`가 별도로 생기고, 조회에서는 둘 다 `memberId=9`가 됩니다. **패딩만 남아 있어도 동점 정렬이 DB의 비패딩 문자열 정렬과 달라집니다.**

이는 코드에서 도출한 결과이며, **현재 Redis에 패딩 데이터가 실제 남았는지는 미확인**입니다.

**고칠 방법:** 이전 패딩 버전을 실행한 환경에서 활동 쓰기 중단 → 진행 중 트랜잭션·AFTER_COMMIT 완료 → 패딩을 쓰는 구버전 인스턴스 제거 → 원장 기반 `rebuild()` → member 유일성과 점수 대조 → 쓰기 재개. 패딩 버전을 실행하지 않은 환경에는 이 전환이 필요 없습니다.

**② minor — 기존 유보: 온라인 rebuild가 정상 적립을 덮어쓸 수 있음**

위치: [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/java/com/example/board/point/ActivityRankingService.java:85](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/java/com/example/board/point/ActivityRankingService.java:85), 86·95·96행.

```java
List<MemberScore> scores = ledgerRepository.sumActivityScores(SCORED_REF_TYPES, Pageable.unpaged());
...
redis.opsForZSet().add(REBUILD_KEY, tuples);
redis.rename(REBUILD_KEY, KEY);
```

`원장 10점 조회 → 추가 적립 커밋·Redis 12점 → RENAME으로 10점 교체`가 가능합니다. **이전 리뷰의 재구축 경합은 이번 수정에서도 그대로입니다.** 실행 순서를 통한 정적 판단이며 이번에 재현 실행하지 않았습니다.

**고칠 방법:** 위 ①의 쓰기 중단 절차를 적용하거나, 온라인 재구축이 필요하면 스냅샷 이후 증분을 보존하는 별도 절차를 구현해야 합니다. RENAME의 원자성만으로 집계부터 교체까지 보호되지는 않습니다.

**③ minor — 전환 테스트가 실제 DB 폴백 실행을 단언하지 않음**

위치: [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/test/java/com/example/board/point/ActivityRankingApiTest.java:171](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/test/java/com/example/board/point/ActivityRankingApiTest.java:171), 172~185행.

```java
guard.call("테스트 장애 주입", () -> {
    throw new RedisConnectionFailureException("주입한 장애");
}, () -> null);
```

```java
assertThat(ids).containsExactly(nine, tenPlusOne, ten);
```

주입 후에도 실제 Redis는 정상이고 같은 데이터를 보유합니다. Guard의 5초 우회가 회귀하거나 긴 실행 지연으로 만료되면 **두 번째 페이지도 Redis에서 읽으면서 통과할 수 있습니다.** 실제 관찰한 실패가 아닌 정적 검증 공백입니다.

**고칠 방법:** 두 번째 요청에서 repository 호출을 spy로 확인하거나, 첫 페이지 이후 테스트 Redis 데이터를 제거해 조회 원천을 구별하십시오. 큰 커서 테스트도 정상·폴백 경로 실행 여부를 구별하면 좋습니다.

**3) 확인한 것 목록**

- **숫자 문자열 정렬은 지정한 collation에서 일치합니다.** Redis는 동점에서 사전순, 역방향 조회에서는 사전순 역순을 사용합니다. [Redis 공식 문서](https://redis.io/docs/latest/commands/zrange/)

  MySQL의 `utf8mb4_0900_ai_ci`는 UCA 9.0 기반이며, ASCII `0`~`9`는 서로 다른 증가하는 primary weight를 갖습니다. 숫자열 전체를 수치로 비교하는 정렬이 아닙니다. 따라서 첫 번째로 다른 숫자가 순서를 결정하고, 접두사가 같으면 짧은 문자열이 먼저입니다. `ai_ci`가 숫자들을 동등하게 만들지 않으며, 이 입력에는 공백도 없어 패딩 속성의 영향이 없습니다. **이 규칙에서 임의 길이 ASCII 숫자 문자열의 순서 일치가 도출됩니다.** [MySQL 문서](https://dev.mysql.com/doc/refman/8.4/en/charset-unicode-sets.html), [UCA 9.0 가중치표](https://www.unicode.org/Public/UCA/9.0.0/allkeys.txt), [MySQL 구현](https://github.com/mysql/mysql-server/blob/8.4/strings/ctype-uca.cc)

- **단, 실제 CAST collation은 연결 설정을 확인해야 합니다.**

  [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/java/com/example/board/point/PointLedgerRepository.java:20](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/java/com/example/board/point/PointLedgerRepository.java:20):

  ```java
  + " group by l.member.id order by sum(l.amount) desc, cast(l.member.id as string) desc")
  ```

  명시적 collation 지정이 없습니다. MySQL의 `CAST(... AS CHAR)`는 `character_set_connection`·`collation_connection`을 따르므로 **서버 기본값만으로 실제 표현식의 collation을 확정하면 안 됩니다.** 연결에서 `COLLATION(CAST(1 AS CHAR))`를 확인하면 됩니다. 이번에는 실제 연결 값을 조회하지 않았습니다. [MySQL CAST 문서](https://dev.mysql.com/doc/refman/8.4/en/cast-functions.html)

- **이전 랭킹 지적의 해소 범위**

  | 이전 문제 | 이번 판정 |
  |---|---|
  | 최초 리뷰 ④: Redis 문자열 역순과 DB 숫자순 불일치 | 정상 형식·동일 점수 데이터에서 해결 |
  | 형식 혼재에 따른 중복·점수 분리 | 패딩 버전 미실행 환경은 해결, 잔존 환경은 ① |
  | 페이지 내부 합산으로 `size`마다 점수·순위 변경 | 합산 제거로 정상 형식에서 해결 |
  | 합산 후 순위 번호 건너뜀 | 정상 형식에서 해결 |
  | 큰 커서의 int 오버플로 500 | 범위 검사 유지로 해결 |
  | 재구축 중 정상 적립 덮어쓰기 | 미해결, 기존 유보 |

- **정렬 회귀를 잡는 테스트는 유효합니다.**

  [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/test/java/com/example/board/point/ActivityRankingApiTest.java:153](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/test/java/com/example/board/point/ActivityRankingApiTest.java:153)의 기대 순서 `[9p, 10p+1, 10p]`는 숫자 ASC·DESC 모두와 다릅니다. 같은 파일 200~216행은 Redis와 repository를 각각 기대 순서 `[9p, 2p, 19p, 10p, p]`와 비교하므로 **DB 숫자 정렬 회귀를 독립적으로 잡습니다.**

  다만 패딩 잔존 상태의 재구축, 동점 다중 페이지 전체의 `score`·`rank`, 큰 커서 검사 경계 바로 전·동일·직후는 검증하지 않습니다.

- **큰 커서 검사에는 오프바이원이 없습니다.**

  ```java
  if (offset > Integer.MAX_VALUE - count) {
      return List.of();
  }
  ```

  HTTP의 `size=1~50`에서 `count=2~51`이며, 합계가 정확히 `Integer.MAX_VALUE`인 경우까지 허용합니다. 다만 이보다 큰 위치를 빈 목록으로 처리하는 정책이므로, 실제 랭킹 cardinality가 그 범위를 넘는 경우까지 Redis와 동일하다고 보장하지는 않습니다.

- **정렬 통일은 점수·스냅샷 일치까지 보장하지 않습니다.** 장애 중 누락된 Redis 가산, 페이지 사이 활동 변경이 있으면 위치 커서의 중복·누락은 여전히 가능합니다. 이번 변경으로 생긴 회귀는 아닙니다.

- **실행 증거는 기존 기록만 확인했습니다.** [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/build/test-results/test/TEST-com.example.board.point.ActivityRankingApiTest.xml:2](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/build/test-results/test/TEST-com.example.board.point.ActivityRankingApiTest.xml:2)에 변경된 테스트 이름을 포함한 **11건, 실패 0건**이 기록돼 있습니다. 이번 재실행 결과나 대상 커밋과 결박된 검증 증거로 간주하지 않았습니다. Luna CLI는 app-server 초기화 권한 오류로 실행되지 않았으며, 정렬 판단은 공식 자료를 직접 대조한 결과입니다.

model=gpt-6-astra
