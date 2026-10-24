# L-H4. H4. 대량 데이터 처리 — 나눠서 지우고 바꾸기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/H4-bulk-processing.md](../../../../../lessons/H4-bulk-processing.md)

원문 SHA-256: `715c29c7f9a2abce33f0bc7f57c8459075bb929bc0140a5e6e40bdbb49b1a1b8`

## 판정

잠금 범위, FK dependency, persistence context, JDBC statement batching을 혼동하지 않도록 서로 다른 실험을 준다. sample은 성능 결론을 일반화하지 않는다.

## 목표·선수 지식·학습자 작업

대량 삭제/입력에서 FK 순서, transaction chunk, JPA persistence context flush/clear, JDBC batch 전송을 서로 다른 축으로 구분한다.

문서의 practice 전용 lesson_h4_post/comment 10,000/30,000 seed, 두 MySQL 세션 잠금 순서, TransactionTemplate loop, JPA persist/flush/clear, JDBC batch 실험을 복사해 수동 실행한다. 별도 source/test file은 저장소에 없다.

## 요구·구현·검사 대조

### 1. 자식 댓글을 먼저 지우고 parent를 다음에 지운다. LIMIT1000 삭제 청크/commit, 영속성 컨텍스트 clear, SQL batch transport를 분리해 결과·잠금·메모리 수치를 확인한다.

구현 대조: 원문은 parent-first 1451, comment 18,000 및 post 6,000 row chunk, multi-table delete+LIMIT 오류, B의 1205 lock wait, outer transaction에서 chunk join/rollback, 20,000 persist와 500 clear, saveAll IDENTITY zero batch 및 2000-row JDBC 결과를 기록한다. 실행 로그는 원문에 있는 저자 관찰이다.

검사 대조: 계약은 10,000 post/30,000 comment seed, 청크별 행 수, 나머지 4,000/12,000, lock timeout, entity count와 batch statistics를 제시한다. repo runnable code/test는 확인되지 않으며 이번 재실행도 없다.

공백 또는 한계: 청크 루프는 0행까지 지우며 다시 실행 가능한 예지만, process 중단 checkpoint, 동시 cutoff 변경/행 삽입, 청크별 실패 후 운영 재개 정책은 별도 job 수준에서 다루지 않는다. 15-4가 실제 schema와 FK 전체/경계/cleanup을 맡는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H4-bulk-processing.md](../../../../../lessons/H4-bulk-processing.md) — 1~284행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

FK에서 child 먼저 삭제한다. DELETE LIMIT은 한 statement 최대 행 수다. tx.execute는 ambient transaction이 있으면 그 경계를 대체하지 않고 합류할 수 있다. flush는 SQL을 전송하고 clear는 entity를 detach하지만 어느 것도 commit은 아니다. Hibernate IDENTITY batching과 JDBC batch는 별도다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: 대량 삭제/입력에서 FK 순서, transaction chunk, JPA persistence context flush/clear, JDBC batch 전송을 서로 다른 축으로 구분한다.
- 다음 단계: H4는 격리 표에서 원리를 보인다. 15-4는 실제 post/comment/like/bookmark/tag/notification FK, 답글, 30일 경계, 청크 commit을 한다. S15 Batch가 checkpoint/history 확장이다.

## 부족한 점

### L-H4-G1 · low

문서는 resume/checkpoint, 동시 데이터 변경과 chunk failure 재시작을 구현하지 않는다. 이 작은 lesson의 필요 기능 누락으로 세지 않고 15-4/S15 operational 연결로 분리한다.

판정 범위: 청크 루프는 0행까지 지우며 다시 실행 가능한 예지만, process 중단 checkpoint, 동시 cutoff 변경/행 삽입, 청크별 실패 후 운영 재개 정책은 별도 job 수준에서 다루지 않는다. 15-4가 실제 schema와 FK 전체/경계/cleanup을 맡는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H4-bulk-processing.md](../../../../../lessons/H4-bulk-processing.md) — 1~284행

## 확장 개발 명세

### 대량 삭제/입력에서 FK 순서, transaction chunk, JPA persistence context flush/cle 구체 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

문서는 resume/checkpoint, 동시 데이터 변경과 chunk failure 재시작을 구현하지 않는다. 이 작은 lesson의 필요 기능 누락으로 세지 않고 15-4/S15 operational 연결로 분리한다.

**시작 상태**

기존 post/comment를 지우지 않는다. E2/G3 instructions에 맞춰 practice schema에 임시 lesson_h4_post와 lesson_h4_comment를 만들고 10,000/30,000 count를 확인한다.

**학습자가 할 일**

- parent DELETE를 먼저 실행해 FK 1451을 기록한다.
- comment target 18,000개를 ORDER BY id LIMIT 1000으로 반복 삭제해 마지막 0행까지 기록하고 post target 6,000개도 동일하게 수행한다.
- 한 transaction에서 18,000 comment를 지우고 commit 전에 B가 target id17000과 kept id25000를 수정해 target/kept row lock 결과를 비교한다.
- 1000 row chunk를 한 번 실행했을 때 current chunk row가 잠기고, commit 뒤 lock이 풀리는지 확인한다.
- Chunk loop를 outer transaction으로 감싸 동일 로그가 찍혀도 마지막 rollback에 모든 target rows가 복구되는지 확인한다.
- 20,000 persist에 500마다 flush/clear 적용 전후 managed count와 detached entity 변경의 DB 반영 여부를 확인한다.
- Hibernate IDENTITY saveAll 통계와 JDBC batchUpdate의 2000개 update count를 구분하고 rewriteBatchedStatements 설정 결과를 기록한다.

**정상 사례**

- 댓글 18,000, 글 6,000 삭제 뒤 4,000 posts/12,000 comments가 남는다.
- 500개 단위 flush/clear에서는 managed entity 수 500 이내지만 한 transaction은 그대로다.

**실패·경계 사례**

- parent first delete는 1451.
- multi-table delete와 LIMIT은 예시 MySQL 8에서 syntax error.
- outer transaction은 청크별 commit을 무효화하고 row locks/rollback 범위를 늘린다.
- clear 뒤 변경한 entity는 managed 상태가 아니어서 update되지 않는다.
- saveAll IDENTITY가 batch_size를 설정해도 개별 INSERT일 수 있다.

**동시성·성능**

원문 heap 차이 30MB/23MB와 JDBC 475~402ms vs 189~210ms는 좁은 sample 관찰이다. 반복 수도 적고 시간은 3.9~9.3초로 흔들렸으므로 우열/운영 이득을 일반화하지 않는다.

**DB 관찰**

- FK rows와 대상/잔여 counts.
- A/B session transaction state, lock timeout, 청크별 affected rows.
- EntityManager managed count, contains, SQL update.
- Hibernate statement/batch statistics 및 JDBC int[] count, 측정 설정.

**합격 기준**

- FK 순서와 6000/18000 대상 수, 4000/12000 잔여 수가 일치한다.
- outer transaction 재현으로 chunk log와 실제 commit 경계를 구분한다.
- flush/clear가 메모리 관리는 하지만 transaction을 쪼개지 않는다고 설명한다.
- Hibernate batching과 JDBC batching을 각각 근거로 보고한다.

**기존 과제와 중복·연결**

H1은 row lock, G3/E7은 transaction·persistence context를 맡는다. 15-4는 실제 schema purge이며 H4는 저수준 원리를 분리하는 선행 레슨이다.

**우선순위**

low

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H4/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H4/screen.jpg`)
- 관찰: HTML/캡처를 실제 열어 보지 않았다. source와 HTML 차이만으로 시각 검토를 완료하지 않는다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H4/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H4/dom.txt`)

- source: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/H4-bulk-processing.md](../../../../../lessons/H4-bulk-processing.md)
- source_same: 예
- html: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/H4-bulk-processing.html](../../../../../lessons/H4-bulk-processing.html)
- html_same: 아니오
- difference: source는 corpus에서 최신 원문과 같다고 기록되어 있다. HTML byte hash가 다르지만 화면/원인을 미검토했다.

- 인쇄된 임시 앱 출력은 원문에 기록된 과거 저자 관찰이며 이번 실행이 아니다.
- 레슨별 runnable app/자동 테스트가 저장소에 확인되지 않아 수치를 이번 실행이나 자동 검증 성공으로 주장하지 않는다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H4-bulk-processing.md](../../../../../lessons/H4-bulk-processing.md) — 1~284행 (원리·코드 예시·기록된 저자 실행·따라 하기·실패 반례·답안·후속 경로)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-H4.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-H4.json`)
