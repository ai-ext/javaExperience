# L-H7. H7. 캐시 — @Cacheable과 무효화

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md)

원문 SHA-256: `52e957da57277124e52733108186560f8900ee71b7c179db8d42762bde83a4b6`

## 판정

TTL/무효화, proxy와 cache key leak을 순차 사례로 보여 준다. 다중 instance 동기화나 race-free invalidation을 검증한 레슨으로 보지 않는다.

## 목표·선수 지식·학습자 작업

Spring method cache proxy와 key, provider, TTL/maximumSize, mutation eviction 및 사용자별 key 격리를 확인한다.

임시 Boot app에서 practice post1~5와 SQL logs/cache keys를 관찰한다. hit/miss, TTL, eviction, this-call, @EnableCaching 제거, member cache leak 사례를 실행하도록 안내한다. 별도 app source/test는 repo에 없다.

## 요구·구현·검사 대조

### 1. @EnableCaching과 cache provider를 설정하고 @Cacheable hit/miss, TTL, mutation eviction, method key isolation을 확인한다.

구현 대조: 원문은 첫 호출에만 SQL, 5초 만료, no-evict stale title, eviction 뒤 최신 제목, maximumSize=2 sample keys, simple map cache, this-call bypass, no-arg me key의 cross-user leak을 기록한다. 출력은 저자 실행 관찰이다.

검사 대조: 문서에 curl/SQL/cache manager 출력은 있으나 레슨 코드나 자동 테스트 파일은 없다. Caffeine key set 결과는 반복 저자 관찰이지 고정 보장이 아니다. 이번 실행은 하지 않았다.

공백 또는 한계: Caffeine/simple provider는 한 JVM의 local cache다. 동시 stale fill 및 여러 instance invalidation은 검증하지 않는다. 16-3는 same-JVM generation invalidation을 따로 구현한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md:1) — 1~254행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

Cache hit는 DB read를 피하지만 cache eviction과 DB commit은 별개의 동작이다. no-arg myInfo key는 SimpleKey[] 하나라 사용자별 값이 누출될 수 있다. concurrent stale fill과 multi-JVM invalidation은 이 레슨 범위가 아니다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: method cache 동작, freshness, key와 provider를 순차 관찰한다.
- 다음 단계: 16-3 popularPosts는 (days,limit) key, X-Cache, mutation eviction 및 same-JVM generation을 다룬다. S11/W23은 cache lifecycle과 stampede를 확장한다.

## 부족한 점

### L-H7-G1 · medium

순차 예제는 stale repopulation race와 다른 서버 인스턴스의 무효화를 검사하지 않는다. maximumSize는 특정 key가 남는다고 보장하지 않는다.

판정 범위: 개념 레슨은 한 JVM cache를 설명한다. 분산 cache 일관성을 필수 구현으로 강제하지 않고 16-3/S11로 연결한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md:37) — 37~59행
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md:159) — 159~194행

## 확장 개발 명세

### stale 응답과 key isolation 확인

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

cache hit는 DB 값을 자동으로 따라가지 않으며 key가 사용자 identity를 빠뜨리면 민감값을 다른 회원에게 돌려줄 수 있다.

**시작 상태**

isolated practice post1~5, Caffeine maxSize=100/expireAfterWrite=5s, SQL debug를 사용한다. 사용자 2와 4의 myInfo 테스트 identity를 사용한다.

**학습자가 할 일**

- post1을 TTL 이내 세 번 호출해 SELECT가 첫 호출에만 있는지 확인하고 6초 뒤 재조회한다.
- post2를 cache한 뒤 eviction 없는 rename을 실행해 DB 새 제목과 응답 stale 제목을 대조한다.
- successful rename eviction을 추가하고 다음 조회가 새 제목을 읽는지 확인한다.
- maximumSize=2에서 key1~5 조회 후 size와 retained keys를 3회 기록한다. 어떤 key가 남는지는 contract로 단정하지 않는다.
- simple provider를 사용해 caffeine.spec 만료가 적용되지 않는지 본다.
- this invocation과 @EnableCaching 제거를 각각 실행해 SQL이 다시 호출되는지 확인한다.
- 사용자4 조회 뒤 사용자2 no-arg myInfo를 호출해 leak을 확인하고, memberId key 적용 뒤 응답을 분리한다.
- 선택 확장으로 latch를 써서 오래된 get read→update+evict→stale cache put 순서를 만들어 race를 관찰한다.

**정상 사례**

- 동일 key TTL 안 반복은 SQL 없이 응답하고 TTL 후에는 SQL을 실행한다.
- update 후 eviction이 끝난 다음 read는 DB 새 제목을 반환한다.

**실패·경계 사례**

- evict가 없으면 TTL 내 stale title이 남는다.
- no-arg me cache key는 한 회원 값을 모든 회원에게 반환할 수 있다.
- this-call/disabled caching은 오류 없이 매번 SQL을 수행한다.
- 다른 JVM cache는 local eviction에 반응하지 않는다.

**동시성·성능**

SQL 횟수만 비교하며 API 전체 성능이나 다중 인스턴스 처리량은 측정하지 않는다. stale fill은 16-3 same-JVM generation과 분리해서 기록한다.

**DB 관찰**

- 응답 title, SELECT 횟수, TTL 및 cache keys/provider.
- 회원 ID와 실제 계산 cache key.
- update commit/eviction 및 concurrent GET 순서.

**합격 기준**

- TTL 안 hit, expiry miss, eviction 후 최신 DB title을 각 SQL/response로 증명한다.
- member-specific key 적용 후 사용자 2/4 응답이 교차하지 않는다.
- maxSize 결과 key 순서를 고정 정답으로 주장하지 않는다.
- 한 JVM/cache provider의 한계를 명시하고 16-3/S11과 연결한다.

**기존 과제와 중복·연결**

16-3는 popular endpoint의 실제 cache 적용을 맡고 S11/W23은 stampede/일관성 주제를 확장한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H7/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H7/screen.jpg)
- 관찰: HTML/캡처를 열어 보지 않았다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H7/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H7/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H7-cache-cacheable-evict.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H7-cache-cacheable-evict.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H7-cache-cacheable-evict.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H7-cache-cacheable-evict.html)
- html_same: 아니오
- difference: 원문은 동일하다고 corpus에 기록됐으며 HTML 차이 원인 및 화면은 미검토.

- 임시 Boot app 출력은 원문에 기록된 저자 실행 결과다. 이번 감사에서 실행하지 않았다.
- 레슨 전용 runnable project/자동 테스트 파일은 저장소에서 확인되지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H7-cache-cacheable-evict.md:1) — 1~254행 (원리·코드·저자 실행 기록·따라 하기·반례·확인 문제·후속 경로)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H7.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H7.json)
