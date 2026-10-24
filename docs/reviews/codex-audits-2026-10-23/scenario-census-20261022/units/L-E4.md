# L-E4. E4. JPA 연관관계 첫걸음 — 글·작성자·태그·댓글을 잇기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/E4-jpa-associations.md](../../../../../lessons/E4-jpa-associations.md)

원문 SHA-256: `73080af0a1346cdf16718b4f3001eb1b4aa397741a513b7b13e6033bbfc31b29`

## 판정

관계읽기·LAZY/EAGER·N+1은 깊게다룬다. 관계수명/매핑변경은 텍스트로지칭한외부랩의실재·경로를확인해야 한다. 보완: 179행 DB는옛 3306이다. 심화로 적힌 L2/L3/L4b/L5/L10은 클릭가능한문서링크가아니며 현재 scenario/labs에는 L12~16만 있다. cascade/orphanRemoval과연결엔티티를 실제로 찾아가서 실행하는 경로를 이문서만으로 검증할수없다.

## 목표·선수 지식·학습자 작업

관계읽기·LAZY/EAGER·N+1은 깊게다룬다. 관계수명/매핑변경은 텍스트로지칭한외부랩의실재·경로를확인해야 한다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 관계주인과 LAZY 프록시의 ID/값접근 차이를 관찰한다.

구현 대조: 주인누락의제약오류와초기화상태 예시가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 179행 DB는옛 3306이다. 심화로 적힌 L2/L3/L4b/L5/L10은 클릭가능한문서링크가아니며 현재 scenario/labs에는 L12~16만 있다. cascade/orphanRemoval과연결엔티티를 실제로 찾아가서 실행하는 경로를 이문서만으로 검증할수없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E4-jpa-associations.md](../../../../../lessons/E4-jpa-associations.md) — 17~53행

### 2. 목록 N+1·fetchjoin·EntityGraph·세션밖읽기를 비교한다.

구현 대조: SQL 11/8/1/1과세션밖예외를현재 seed 조건으로설명한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 179행 DB는옛 3306이다. 심화로 적힌 L2/L3/L4b/L5/L10은 클릭가능한문서링크가아니며 현재 scenario/labs에는 L12~16만 있다. cascade/orphanRemoval과연결엔티티를 실제로 찾아가서 실행하는 경로를 이문서만으로 검증할수없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E4-jpa-associations.md](../../../../../lessons/E4-jpa-associations.md) — 120~269행

### 3. EAGER·mappedBy 오류·엔티티직렬화를 재현하고 DTO로 고친다.

구현 대조: 200이어도깨진 JSON 인실패와 DTO 결과가 구체적이다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 179행 DB는옛 3306이다. 심화로 적힌 L2/L3/L4b/L5/L10은 클릭가능한문서링크가아니며 현재 scenario/labs에는 L12~16만 있다. cascade/orphanRemoval과연결엔티티를 실제로 찾아가서 실행하는 경로를 이문서만으로 검증할수없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E4-jpa-associations.md](../../../../../lessons/E4-jpa-associations.md) — 271~338행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 관계읽기·LAZY/EAGER·N+1은 깊게다룬다. 관계수명/매핑변경은 텍스트로지칭한외부랩의실재·경로를확인해야 한다. 14-4에는 position/created_at을 가진 연결 엔티티와 이동 시 삭제·flush 과제가 이미 있다. 새 확장은 공유 태그 수명·cascade 선택으로 한정한다.

- 현재 난이도: 입문·기초
- 판정 이유: 관계읽기·LAZY/EAGER·N+1은 깊게다룬다. 관계수명/매핑변경은 텍스트로지칭한외부랩의실재·경로를확인해야 한다.
- 다음 단계: - S-2-4
  - S-3-1
  - S-10-5
  - S-10-6
  - DB-04
  - DB-13
  - S-14-4

## 부족한 점

### L-E4-G1 · low

179행 DB는옛 3306이다. 심화로 적힌 L2/L3/L4b/L5/L10은 클릭가능한문서링크가아니며 현재 scenario/labs에는 L12~16만 있다. cascade/orphanRemoval과연결엔티티를 실제로 찾아가서 실행하는 경로를 이문서만으로 검증할수없다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E4-jpa-associations.md](../../../../../lessons/E4-jpa-associations.md)

## 확장 개발 명세

### L-E4의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

179행 DB는옛 3306이다. 심화로 적힌 L2/L3/L4b/L5/L10은 클릭가능한문서링크가아니며 현재 scenario/labs에는 L12~16만 있다. cascade/orphanRemoval과연결엔티티를 실제로 찾아가서 실행하는 경로를 이문서만으로 검증할수없다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

2-4의실제 query-count 테스트와 DB-04/13으로직접연결하고, N:N 연결행에 createdAt/정렬순서를추가하는연결엔티티실습을별도로설계한다. 공유 Tag 삭제금지/한부모의자식제거/부모삭제/rollback 각각의행수를확인하고 collectionfetch+page 반례를고정 fixture로검증한다.

**정상 사례**

관계주인과 LAZY 프록시의 ID/값접근 차이를 관찰한다.

**실패·경계 사례**

2-4의실제 query-count 테스트와 DB-04/13으로직접연결하고, N:N 연결행에 createdAt/정렬순서를추가하는연결엔티티실습을별도로설계한다. 공유 Tag 삭제금지/한부모의자식제거/부모삭제/rollback 각각의행수를확인하고 collectionfetch+page 반례를고정 fixture로검증한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

2-4의실제 query-count 테스트와 DB-04/13으로직접연결하고, N:N 연결행에 createdAt/정렬순서를추가하는연결엔티티실습을별도로설계한다. 공유 Tag 삭제금지/한부모의자식제거/부모삭제/rollback 각각의행수를확인하고 collectionfetch+page 반례를고정 fixture로검증한다.

**기존 과제와 중복·연결**

- S-2-4
- S-3-1
- S-10-5
- S-10-6
- DB-04
- DB-13

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: inspected
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E4/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E4/screen.jpg`)
- 관찰: - 메인이 실제 첫 화면에서 N:1/N:N/1:N 관계표·연관관계 주인 설명과 본문 가독성을 확인했다.
- 검증 한계: 첫 화면만 관찰했다. 긴 본문 전체·모바일·Spring 실습 실행 검증이 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E4/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E4/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E4-jpa-associations.md](../../../../../lessons/E4-jpa-associations.md) — 1~394행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-E4.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-E4.json`)
