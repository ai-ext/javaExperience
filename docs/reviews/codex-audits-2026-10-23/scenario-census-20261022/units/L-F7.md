# L-F7. F7. 권한과 역할 — 관리자·내 것만

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md)

원문 SHA-256: `01f390ba57a950553939f485d375f33971328c50f740d8f48dee730f5e3e9d3e`

## 판정

Role과 resource ownership은 authentication 뒤 server가 검사해야 하며, 로그인만으로 IDOR가 막히지 않는다. SQL owner predicate는 검증 principal에서 온다. 예제 interceptor/JDBC를 실제 route 전체의 integration test로 대체하는 일은 13-1/S12 후속이다.

## 목표·선수 지식·학습자 작업

역할 권한과 객체 소유권은 인증 뒤 서버가 검사한다. 로그인만으로 IDOR가 막히지 않는다. F2/1-6/3-1/3-2/G2/13-1과 이어진다.

Standalone practice DB 예제에서 @AdminOnly interceptor 순서, id-only memo read/update와 owner-qualified SQL을 비교하고 실제 project API에서는 3-1/3-2를 확인한다.

## 요구·구현·검사 대조

### 1. 토큰 없음은 401, USER의 admin 호출은 403, ADMIN은 200이며 role은 검증된 principal/DB에서 온다.

구현 대조: Custom @AdminOnly annotation/interceptor, 등록 순서와 HTTP 응답 예시가 있다.

검사 대조: 과거 standalone DB 관찰 결과이며 이번 감사에서 재실행하지 않았다.

공백 또는 한계: interceptor는 학습용 직접 구현이며 실무 보안 체계는 S12/Spring Security로 확장한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 5~90행

### 2. id만 조건에 둔 resource query는 IDOR를 만든다. GET/PATCH는 인증 사용자 owner id까지 WHERE 조건으로 묶어야 한다.

구현 대조: 외부 사용자 memo GET/PATCH leak을 보여 준 뒤 id+owner_id predicate와 404 결과를 제시한다.

검사 대조: 과거 SQL/API 결과이며 새 자동 테스트는 없다.

공백 또는 한계: resource id를 받는 모든 endpoint에 owner check를 적용한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 91~190행

### 3. AuthInterceptor가 role check보다 먼저 실행되고 owner id는 request body에서 받지 않는다.

구현 대조: interceptor 순서를 뒤집은 경우 valid admin이 401을 받고 body ownerId 위조 예시를 보여 준다.

검사 대조: source에 적힌 과거 결과이며 이번 감사에서 재현하지 않았다.

공백 또는 한계: 실제 project의 route registration/order를 테스트해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 191~239행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: 소유권은 id와 인증 사용자 owner id를 함께 SQL WHERE에 넣어 제한한다. Role은 검증된 principal/DB에서 가져오고 client body 값은 신뢰하지 않는다.
- current_scope: 인증 뒤 role/object ownership, IDOR, SQL owner predicate 및 endpoint별 검사.
- missing_scope: Custom interceptor/JDBC는 교육용 예제다. 모든 CRUD endpoint의 통합 검증과 Spring Security 이전은 13-1/S12 후속 범위다.
- existing_links: 1-6 token principal, 3-1 PATCH와 3-2 soft delete, G2 접근 정책, 13-1 권한표, S12 Spring Security.

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: 역할 권한과 객체 소유권은 인증 뒤 서버가 검사한다. 로그인만으로 IDOR가 막히지 않는다. F2/1-6/3-1/3-2/G2/13-1과 이어진다.
- 다음 단계: - 1-6 token principal
  - 3-1/3-2 ownership
  - G2 shared policy
  - 13-1 permissions
  - S12 Spring Security

## 부족한 점

### G1 · medium

Custom interceptor/JDBC는 교육용 예제다. 모든 CRUD endpoint의 통합 검증과 Spring Security 이전은 13-1/S12 후속 범위다.

판정 범위: 예시/과거 관찰을 본편 구현 또는 이번 감사 실행으로 혼동하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 5~239행

## 확장 개발 명세

### role·owner·resource 상태 권한 행렬

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

Custom interceptor/JDBC는 교육용 예제다. 모든 CRUD endpoint의 통합 검증과 Spring Security 이전은 13-1/S12 후속 범위다.

**시작 상태**

원문 지정 앱/격리 DB를 준비하고 source의 과거 출력과 이번 관찰을 분리한다. 기존 DB volume은 초기화하지 않는다.

**학습자가 할 일**

- GET/PATCH/DELETE 각각에서 role×owner×resource-state matrix를 실행한다.
- SQL이 인증 principal에서 온 owner id로 범위를 제한하는지 확인하고 foreign/absent 모두 같은 404인지 검사한다.

**정상 사례**

- ADMIN-only endpoint는 ADMIN 200, USER 403, token absent 401.

**실패·경계 사례**

- 본문에 가짜 ownerId를 보내도 타인 resource를 읽거나 수정할 수 없다.

**동시성·성능**

원문에서 직접 다루는 동시성/성능만 환경과 요청수를 기록해 측정한다.

**DB 관찰**

- 핵심 row/cookie/SQL output 전후를 연결한다.

**합격 기준**

- 원문의 역사적 실행과 새 재현을 구분하고, 새 assertion이 해당 단위의 고유 계약을 검사한다.
- 격리 상태/버전/실행 결과를 기록하며 이번 감사가 재실행하지 않은 기존 출력은 통과로 쓰지 않는다.

**기존 과제와 중복·연결**

후속 실습의 실제 구현 책임은 그대로 유지한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F7/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F7/screen.jpg`)
- 관찰: 렌더 캡처 미제공으로 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F7/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F7/dom.txt`)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 답안은 없다. 본문에 포함된 실행 결과는 과거 기록이며 감사자는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 5~90행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 91~190행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F7-roles-and-ownership.md](../../../../../lessons/F7-roles-and-ownership.md) — 191~239행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F7.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F7.json`)
