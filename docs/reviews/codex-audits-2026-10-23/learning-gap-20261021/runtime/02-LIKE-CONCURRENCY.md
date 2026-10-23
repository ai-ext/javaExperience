# 좋아요 정답 코드 동시성·트랜잭션 검증

확인일: 2026-10-21 KST.

## 실제 실행 대상

/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/4-2.json이 가리키는 83개 파일을 그대로 /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-snapshot-4-2/에 추출했다. `LikeService`와 Repository 구현은 수정하지 않았다. 누락된 실행용 wrapper 파일만 저장소에서 가져왔다.

출처·해시: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-snapshot-manifest.json

환경은 Java21, Boot4.1.1, Hibernate7.4.5.Final, 일회용 MySQL8.4.11이다. 개발 DB는 사용하지 않았다.

## 결과

| 검사 | 결과 | 증명 범위 |
|---|---|---|
| 원문 `LikeConcurrencyTest` 2개 | 통과 | 서로 다른 회원20 동시 PUT, 동일회원5 동시 PUT |
| 추가 동일회원5 동시 DELETE ×20라운드 | 100호출 모두 정상 반환, 매 라운드 관계행0·count0 | 이 환경·작업·반복에서 DELETE 숫자 깨짐은 재현되지 않음 |
| 외부 TransactionTemplate 안에서 `like()` 후 RuntimeException | 최종 관계행0·count0 | 내부 템플릿은 기존 트랜잭션에 참여하며 항상 독립 새 트랜잭션인 것은 아님 |

동시 DELETE는 Service를 스레드에서 직접 호출했다. **100개 HTTP 200을 네트워크로 확인한 시험이 아니다.** 모든 Future의 결과를 회수했고, 마지막 카운트와 관계 행 수를 별도 조회했다. 라운드마다 해당 글의 fixture를 초기화했다.

## 보존한 로그와 실행 코드

- 원문 테스트: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-baseline.log
- 원문 테스트 XML: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-baseline-results/TEST-org.example.like.LikeConcurrencyTest.xml
- 추가 DELETE 로그: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-unlike-audit.log
- 20라운드 관찰 XML: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-unlike-results/TEST-org.example.like.LikeUnlikeAuditTest.xml
- 외부 트랜잭션 로그: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-outer-transaction.log
- 외부 트랜잭션 XML: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-snapshot-4-2/build/test-results/test/TEST-org.example.like.LikeUnlikeAuditTest.xml
- 추가 테스트 소스: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/like-snapshot-4-2/src/test/java/org/example/like/LikeUnlikeAuditTest.java

## 확정할 수 있는 교육상 보완점

1. 문서의 “모두 새 트랜잭션” 설명에는 호출자가 트랜잭션을 갖지 않는다는 전제가 필요하다. 기본 `TransactionTemplate`은 `REQUIRED`이고, 이번 외부 롤백 시험도 이를 확인했다. [Spring 전파 규칙](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)
2. 원문 테스트 주석의 “테스트 @Transactional을 붙이면 모든 스레드가 같은 트랜잭션 공유”는 부정확하다. 별도 Executor worker는 테스트 스레드의 트랜잭션에 자동 참여하지 않는다. fixture 커밋과 정리를 설명해야 한다. [Spring 테스트 트랜잭션](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html)
3. 파생 `deleteBy...`의 반환 수를 native DELETE 영향행수와 동일한 계약처럼 설명하면 안 된다. 대상 조회·Entity remove·flush·예외와 rollback/retry를 구별해야 한다. 실제 구현은 선택된 목록의 크기를 반환한다. 다만 이번 결과에서 최종 카운트 불일치는 재현되지 않았으므로 **동시 취소 버그 확정으로 분류하지 않는다.** 공식근거는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md의 `spring-data-derived-delete` 관련 항목을 참조한다.
4. 동일회원 PUT 시험에도 관계행1뿐 아니라 전체 count 정합성을 단언하고, 테스트별 fixture를 명시하는 편이 학습 계약을 더 정확히 검증한다.
5. PUT/DELETE 혼합, 후행 count UPDATE 실패, 외부 트랜잭션 안의 교착 재시도, 취소 인터럽트 등은 기존 시험과 이번 추가 시험 모두 전부 검증하지 않았다. 빠진 회귀 과제로 구체화해야 한다.

이 검사는 경쟁 상태의 모든 가능한 스케줄을 증명하지 않는다. 통과한 실측과 문서 의미 오류, 아직 없는 검증을 분리한다.
