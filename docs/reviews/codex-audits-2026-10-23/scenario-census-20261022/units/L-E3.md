# L-E3. E3. JPA는 무엇인가

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/E3-what-is-jpa.md](../../../../../lessons/E3-what-is-jpa.md)

원문 SHA-256: `53bfc322cfc212d1288acea66bf2dc02f0b8093a2cf6156bdcfd162ea0ab305d`

## 판정

ORM 첫 저장·조회는 충분하며 영속상태/flush/merge는 E7과10-12로 이어야 한다. 보완: 162행 DB 전제와 158행 bind trace 기본값이 현행 환경과 다르다. save diagram의 id 있음→UPDATE를 detached/assigned-ID/merge 실험 없이 일반화하면 오해가 남는다. E7은 merge와반환객체를다루므로기존후속을직접연결해야 한다.

## 목표·선수 지식·학습자 작업

ORM 첫 저장·조회는 충분하며 영속상태/flush/merge는 E7과10-12로 이어야 한다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. Tag mapping/Repository 프록시/save 전후 ID/SQL을 연결한다.

구현 대조: 실습용 Tag 코드와현재1-3정답의역할을설명한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 162행 DB 전제와 158행 bind trace 기본값이 현행 환경과 다르다. save diagram의 id 있음→UPDATE를 detached/assigned-ID/merge 실험 없이 일반화하면 오해가 남는다. E7은 merge와반환객체를다루므로기존후속을직접연결해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E3-what-is-jpa.md](../../../../../lessons/E3-what-is-jpa.md) — 54~158행

### 2. CommandLineRunner로 count/find/save/delete를 관찰하고 태그0행을확인한다.

구현 대조: 실행순서와번호변동·runner 삭제를명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 162행 DB 전제와 158행 bind trace 기본값이 현행 환경과 다르다. save diagram의 id 있음→UPDATE를 detached/assigned-ID/merge 실험 없이 일반화하면 오해가 남는다. E7은 merge와반환객체를다루므로기존후속을직접연결해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E3-what-is-jpa.md](../../../../../lessons/E3-what-is-jpa.md) — 160~234행

### 3. 파생메서드 오타와 Entity 누락의 기동 실패를 재현한다.

구현 대조: 컴파일과기동검증을구분한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 162행 DB 전제와 158행 bind trace 기본값이 현행 환경과 다르다. save diagram의 id 있음→UPDATE를 detached/assigned-ID/merge 실험 없이 일반화하면 오해가 남는다. E7은 merge와반환객체를다루므로기존후속을직접연결해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E3-what-is-jpa.md](../../../../../lessons/E3-what-is-jpa.md) — 236~260행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: ORM 첫 저장·조회는 충분하며 영속상태/flush/merge는 E7과10-12로 이어야 한다.

- 현재 난이도: 입문·기초
- 판정 이유: ORM 첫 저장·조회는 충분하며 영속상태/flush/merge는 E7과10-12로 이어야 한다.
- 다음 단계: - S-1-2
  - S-1-3
  - L-E7

## 부족한 점

### L-E3-G1 · low

162행 DB 전제와 158행 bind trace 기본값이 현행 환경과 다르다. save diagram의 id 있음→UPDATE를 detached/assigned-ID/merge 실험 없이 일반화하면 오해가 남는다. E7은 merge와반환객체를다루므로기존후속을직접연결해야 한다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E3-what-is-jpa.md](../../../../../lessons/E3-what-is-jpa.md)

## 확장 개발 명세

### L-E3의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

162행 DB 전제와 158행 bind trace 기본값이 현행 환경과 다르다. save diagram의 id 있음→UPDATE를 detached/assigned-ID/merge 실험 없이 일반화하면 오해가 남는다. E7은 merge와반환객체를다루므로기존후속을직접연결해야 한다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

현재 DB 준비/로그설정을안내하고 E7로연결한다. 영속/준영속객체와 save 반환객체의동일성, INSERT/SELECT/UPDATE 시점, 외부 DB에서보이는커밋시점을기록한다. 생성 ID 획득을커밋성공과같게채점하지않는다.

**정상 사례**

Tag mapping/Repository 프록시/save 전후 ID/SQL을 연결한다.

**실패·경계 사례**

현재 DB 준비/로그설정을안내하고 E7로연결한다. 영속/준영속객체와 save 반환객체의동일성, INSERT/SELECT/UPDATE 시점, 외부 DB에서보이는커밋시점을기록한다. 생성 ID 획득을커밋성공과같게채점하지않는다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

현재 DB 준비/로그설정을안내하고 E7로연결한다. 영속/준영속객체와 save 반환객체의동일성, INSERT/SELECT/UPDATE 시점, 외부 DB에서보이는커밋시점을기록한다. 생성 ID 획득을커밋성공과같게채점하지않는다.

**기존 과제와 중복·연결**

- S-1-2
- S-1-3
- L-E7

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E3/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E3/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E3/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E3/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E3-what-is-jpa.md](../../../../../lessons/E3-what-is-jpa.md) — 1~321행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-E3.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-E3.json`)
