# L-J1. J1. 실행 계획(EXPLAIN) 읽기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md)

원문 SHA-256: `a61e373052a9cb1c518e118e355836a6717558a8f4fb99f0111eb1f7bf0d7795`

## 판정

계획 필드와 추정/실측 구분을 지도하지만 문서의 145행 결과는 과거 예시다. 현재 compose와 helper의 컨테이너 타깃이 달라 그대로 실행되는지는 미확인이다.

## 목표·선수 지식·학습자 작업

MySQL EXPLAIN에서 접근 방식, 추정 행 수, 정렬 신호를 읽고 EXPLAIN ANALYZE의 실제 iterator 관찰값과 구분한다. SQL SELECT/WHERE/ORDER BY 기본 지식이 선수다.

practice DB의 기본키/목록/LIKE/작성자 검색 계획을 읽고, 쿼리와 인덱스를 바꾸기 전 EXPLAIN을 실행한다. 별도 EXPLAIN ANALYZE는 실제 실행값으로, 결과 ID를 보는 SELECT는 따로 기록한다.

## 요구·구현·검사 대조

### 1. EXPLAIN은 계획과 estimates를 보여준다. EXPLAIN ANALYZE는 SELECT를 실제 실행해 iterator별 actual rows, loops, actual time을 보여준다. Using filesort는 별도 정렬 단계 표시이지 디스크 I/O나 API 지연을 단정하지 않는다.

구현 대조: 레슨은 145-row practice의 기본키/게시판 목록/LIKE/작성자 계획 및 인덱스 무시/EXPLAIN ANALYZE 예시를 제공한다. 직접 연습은 type/key/rows/Extra를 기록하고 두 측정 명령을 구분한다.

검사 대조: 레슨에 기록된 145행 practice 계획 및 EXPLAIN ANALYZE 출력은 문서 예시다. 자동 레슨 테스트는 없고 이번 담당자가 실행하지 않았다. 별도 메인 runtime-query는 L12~L14 체크이지 J1 쿼리 예시의 재실행 증거가 아니다.

공백 또는 한계: helper가 studymate-mysql-1을 지정하지만 이 worktree compose는 mysql 서비스를 정의하고 고정 container_name을 지정하지 않는다. 연결 schema를 확인하지 않은 계획은 이 저장소의 practice DB 결과라고 볼 수 없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 7~37행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 39~103행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 105~154행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 156~194행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 224~265행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 275~278행
- [$WORKTREE_ROOT/concept-census-20261021/compose.yaml](../../../../../compose.yaml) — 15~35행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

type/key/rows/filtered/Extra의 설명과 EXPLAIN vs EXPLAIN ANALYZE 구분은 기록되어 있다. 현재 practice/MySQL은 이 repo의 compose 서비스 mysql이다. 연결 helper 경로를 맞춰야 한다. 9-2/DB-08/09/10에 실행계획을 실제 쿼리로 확장한다.

- 현재 난이도: 개념 레슨(입문~심화 전이)
- 판정 이유: EXPLAIN에서 접근 경로·예상 행·필터·정렬을 읽고 계획과 actual 실행 관측을 구분한다.
- 다음 단계: DB-08 추정 가설→DB-09 실제 EXPLAIN ANALYZE→DB-10~11 인덱스 전후 비교로 연결.

## 부족한 점

### L-J1-G1 · medium

sqlp helper가 studymate-mysql-1 container를 지정하지만 현재 compose에는 해당 container_name이 없고 service 이름은 mysql이다.

판정 범위: CloudBeaver 연결은 별도로 안내되어 있어 DB 이론/예시 자체와 helper 연결 오류를 구분한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 39~47행
- [$WORKTREE_ROOT/concept-census-20261021/compose.yaml](../../../../../compose.yaml) — 15~35행

## 확장 개발 명세

### 현재 repo practice에 계획·실행값 기록

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

EXPLAIN 계획은 추정치이며 실제 실행량은 별도 TREE로 관찰해야 한다.

**시작 상태**

이 repo의 compose.yaml에서 MySQL service 이름 mysql을 확인한 뒤 practice schema에 연결한다. SELECT DATABASE(), VERSION()을 기록하고 145행 문서 예시는 참고값으로만 둔다.

**학습자가 할 일**

- id=42 기본키 조회, board_id=2 최신 목록, title LIKE 검색, author_id 정렬 검색 각각 EXPLAIN을 실행해 type/key/rows/filtered/Extra를 표에 기록한다.
- board_id=2 목록을 IGNORE INDEX로 한 번 더 계획하고 동일 SQL 조건에서 key·rows·filesort 변화를 비교한다.
- 읽기 전용인 같은 두 SELECT에 EXPLAIN ANALYZE를 실행해 TREE의 estimated rows와 actual rows/loops/time을 구분한다.
- board2 목록의 정렬 동률이 생기도록 created_at이 같은 두 행을 확인하고 id tie-breaker 유무에 따라 LIMIT 5 경계 ID가 안정적인지 별도로 검증한다.

**정상 사례**

- 각 계획 기록에 SELECT DATABASE(), MySQL version, SQL 전문, type/key/rows/Extra를 함께 남긴다.
- EXPLAIN ANALYZE 출력에는 iterator별 actual rows/loops/time을 적고 EXPLAIN estimates와 별도 열로 둔다.

**실패·경계 사례**

- Using filesort만으로 디스크 spill이나 API 지연을 결론내리지 않는다.
- EXPLAIN ANALYZE는 SELECT를 실제 실행하므로 쓰기 문장이나 비용/영향을 모르는 운영 쿼리에는 사용하지 않는다.
- studymate-mysql-1로 접속한 결과 또는 문서에 인쇄된 145행 숫자를 현재 repo DB 실측으로 제출하지 않는다.

**동시성·성능**

단발 actual time은 서비스 응답 보장이 아니다. 동일 데이터에서 rows/loops와 반복 조건을 기록한다.

**DB 관찰**

- 연결 schema/version, query, 계획 필드, TREE 실제 측정 필드.

**합격 기준**

- 4개 SELECT의 현재 practice 계획과 schema/version이 기록되어 있다.
- 인덱스 강제 무시 전후의 estimated rows 및 정렬 표시를 비교하고, EXPLAIN ANALYZE의 actual rows/loops/time을 estimates와 분리한다.
- 동일 created_at 동률에서 id tie-breaker 유무의 LIMIT 경계 ID를 보고한다.

**기존 과제와 중복·연결**

DB-08은 가설, DB-09는 실행값, DB-10은 index 전후, S-9-2는 application EXPLAIN 연결을 다룬다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J1/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J1/screen.jpg`)
- 관찰: 레슨 HTML 시각 검토 전
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J1/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J1/dom.txt`)

- source: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md)
- source_same: 예
- html: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/J1-reading-explain.html](../../../../../lessons/J1-reading-explain.html)
- html_same: 아니오
- difference: latest HTML未검토.

- lesson 실행은 하지 않음.
- 브라우저 렌더 미검토.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/J1-reading-explain.md](../../../../../lessons/J1-reading-explain.md) — 1~278행 (개념, 예시, 따라하기, 일부러 틀려 보기 및 확인 문제)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-J1.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-J1.json`)
