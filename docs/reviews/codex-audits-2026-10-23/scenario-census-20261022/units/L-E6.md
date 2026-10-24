# L-E6. E6. 저장소 메서드 만들기 — 이름으로 쿼리·@Query·페이지

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md)

원문 SHA-256: `8c49ca2e30b03ebf1c4f0cdba7c44ba06ea64670fca22a6cc1fe680725cb2a22`

## 판정

조회방식·오류·projection은깊다.안정정렬과동시변경시페이지계약을추가검증해야한다. 보완: 291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

## 목표·선수 지식·학습자 작업

조회방식·오류·projection은깊다.안정정렬과동시변경시페이지계약을추가검증해야한다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 파생조건·단일반환의다중행오류·패턴이스케이프를관찰한다.

구현 대조: 24개호출과시드기대값,SQL 형태가 제공된다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md) — 83~198행

### 2. Page/Slice/count·JPQL/native/projection을비교한다.

구현 대조: limit3/4와 DTO 필드·count 생략가능성을설명한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md) — 200~278행

### 3. 별도프로젝트에서조회 로그와검색 API를실행한다.

구현 대조: 두페이지의정확 ID와삭제행미필터범위를명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md) — 280~428행

### 4. 이름/필드/JPQL/native 오타의실패시점을구분한다.

구현 대조: 기동·호출 실패별메시지가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md) — 430~480행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 조회방식·오류·projection은깊다.안정정렬과동시변경시페이지계약을추가검증해야한다.

- 현재 난이도: 입문·기초
- 판정 이유: 조회방식·오류·projection은깊다.안정정렬과동시변경시페이지계약을추가검증해야한다.
- 다음 단계: - S-2-2
  - Q08
  - DB-02
  - T-027
  - L-E7

## 부족한 점

### L-E6-G1 · low

291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md)

## 확장 개발 명세

### L-E6의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

291행시작 DB 포트가옛 3306이다. viewCount 단일정렬로 page를자르며동률경계검증은없다. 삭제행미필터는 426행의명시적교육범위라보안결함으로세지않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

동일 viewCount 글을페이지크기보다많이만들어 id 보조정렬전후의중복/누락을대조하고 Page count와실제전체 ID 집합이같은지확인한다. Q08/DB-02와연결하며 offset 동시삽입의한계는 T-027에서비교한다.

**정상 사례**

파생조건·단일반환의다중행오류·패턴이스케이프를관찰한다.

**실패·경계 사례**

동일 viewCount 글을페이지크기보다많이만들어 id 보조정렬전후의중복/누락을대조하고 Page count와실제전체 ID 집합이같은지확인한다. Q08/DB-02와연결하며 offset 동시삽입의한계는 T-027에서비교한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

동일 viewCount 글을페이지크기보다많이만들어 id 보조정렬전후의중복/누락을대조하고 Page count와실제전체 ID 집합이같은지확인한다. Q08/DB-02와연결하며 offset 동시삽입의한계는 T-027에서비교한다.

**기존 과제와 중복·연결**

- S-2-2
- Q08
- DB-02
- T-027
- L-E7

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E6/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E6/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E6/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E6/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/E6-repository-methods.md](../../../../../lessons/E6-repository-methods.md) — 1~535행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-E6.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-E6.json`)
