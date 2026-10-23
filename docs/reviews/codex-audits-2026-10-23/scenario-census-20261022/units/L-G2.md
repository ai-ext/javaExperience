# L-G2. G2. 권한 규칙을 한 곳에

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md)

원문 SHA-256: `39ff52e3befb7a82fb90686176854b7af08f95aa3b4ee768815daf2183b53847`

## 판정

canView/canEdit/canDelete를 중앙화하고 접근 불가 여부를 404, 볼 수 있으나 행위 권한 없음은 403으로 구분한다. Java detail policy와 SQL list 정책 parity는 실제 기능 2-3/10-7에서 검증한다.

## 목표·선수 지식·학습자 작업

canView/canEdit/canDelete 정책을 한 곳에 모으고 접근 여부를 먼저 404, capability를 뒤에 403으로 판단해 object existence를 숨긴다. 목록은 동등 predicate를 WHERE에서 적용한다.

JDK21 jshell에서 viewer/post policy matrix, edit rule 변경, copied rule과 check order 오류를 관찰하고 실제 API에 연결한다.

## 요구·구현·검사 대조

### 1. deleted/invisible object는 authorization 전에 404이며 viewable non-owner는 403; admin capability별 권한도 구분한다.

구현 대조: 순수 Java policy/service가 deleted/status/author/admin별 응답을 돌려주는 예시가 있다.

검사 대조: historical jshell outcomes; 이 감사자는 재실행 안 함.

공백 또는 한계: in-memory model은 DB에 쓰거나 실제 행을 바꾸지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:5) — 5~145행

### 2. resource ID endpoint는 UI에서 버튼을 숨겨도 서버에서 owner를 검사해야 한다.

구현 대조: 복사한 rule은 deleted post edit를 허용하고 순서 역전은 existence를 노출하는 IDOR 예시다.

검사 대조: 예제/확인 문제만 제공. 실제 앱 test는 이 레슨에 없다.

공백 또는 한계: GET/PATCH/DELETE 모두 owner check가 필요하다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:146) — 146~239행

### 3. 목록 policy는 page/count 전에 WHERE로 옮기고 Java detail policy와 의미를 맞춘다.

구현 대조: source는 in-memory filtering이 page size/count를 깨뜨리며 Java/JPQL 두 표현이 drift할 수 있음을 말한다.

검사 대조: 이 순수 Java 레슨은 SQL execution/parity test가 없다.

공백 또는 한계: 실제 query predicate는 2-3/10-7에서 구현한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:140) — 140~180행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: in-memory Map example 자체에는 DB가 없다. production list에서는 동일 접근 조건을 SQL WHERE에서 LIMIT/COUNT 전에 적용해야 하며 Java와 JPQL 표현이 달라질 수 있다.
- current_scope: canView/canEdit/canDelete 메서드, 404→403 검사 순서, resource ID 소유권 및 목록 query predicate.
- missing_scope: SQL/JPQL parity test와 모든 project endpoint 검증은 이 레슨 범위가 아니며 2-3/3-1/4-1/5-3/10-7에 연결된다.
- existing_links: 2-3 visibility, 3-1 PATCH/3-2 soft delete, F7 IDOR, 4-1/5-3 권한, 10-7 list query.

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: 접근 가능 여부와 행위 권한을 분리해 보이고, 이를 상세 Java policy와 list query로 연결한다.
- 다음 단계: - 2-3 visibility
  - 3-1 PATCH/3-2 soft delete
  - F7 IDOR
  - 4-1/5-3 authorization
  - 10-7 list predicates

## 부족한 점

### G1 · medium

SQL/JPQL parity test와 모든 project endpoint 검증은 이 레슨 범위가 아니며 2-3/3-1/4-1/5-3/10-7에 연결된다.

판정 범위: source historical output은 이번 감사 실행이 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:5) — 5~239행

## 확장 개발 명세

### 실제 detail/list policy matrix 일치성 테스트

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

SQL/JPQL parity test와 모든 project endpoint 검증은 이 레슨 범위가 아니며 2-3/3-1/4-1/5-3/10-7에 연결된다.

**시작 상태**

원문이 지정한 isolated app/DB에서 시작하고 과거 output과 새 관찰을 나눠 기록한다. 기존 volume은 초기화하지 않는다.

**학습자가 할 일**

- viewer×post status/deleted/follow/block/owner matrix를 만든다.
- Detail Java policy와 repository list/count SQL이 같은 노출 집합을 내는지 비교한다.

**정상 사례**

- source가 제시한 정상 case 결과와 상태를 확인한다.

**실패·경계 사례**

- 실패 예시의 exception/HTTP response/DB side effect를 분리 확인한다.

**동시성·성능**

원문에서 직접 다루는 동시성/성능이 있으면 환경과 요청수를 기록해 측정한다.

**DB 관찰**

- 핵심 row/SQL/log 상태 전후.

**합격 기준**

- 재현 조건과 기대 결과를 기록한다.
- 이번 실행이 없으면 과거 로그를 통과 근거로 쓰지 않는다.

**기존 과제와 중복·연결**

실제 endpoint implementation은 progression link의 scenario/lesson에서 맡는다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G2/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G2/screen.jpg)
- 관찰: 렌더 캡처 미제공으로 시각 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G2/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G2/dom.txt)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 구현 없음. lesson output은 과거 관찰이며 auditor는 실행/build하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:5) — 5~145행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:146) — 146~239행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G2-access-rules-in-one-place.md:140) — 140~180행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-G2.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-G2.json)
