# task53: J25 · J25. 자료구조 개념 지도 — 배열·연결 리스트·스택·큐·힙·해시·트리·그래프

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J25-data-structures-map.md
- 원문 SHA256: `90f3aef2d90c6a3569890e00a64d8b54394dfd86ccf0ead3ddc6d43a66553ff0` / 331줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: ADT·연산비용·보조공간, ArrayList·LinkedList·ArrayDeque·PriorityQueue, 해시·정렬 tree·동등성, 그래프 표현 선택, LRU와 순서 계약
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J25. 자료구조 개념 지도 — 배열·연결 리스트·스택·큐·힙·해시·트리·그래프
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L39: 연산 비용을 먼저 보는 총괄표
- L55: 3. 내부 동작·원리
- L57: 배열과 연결 리스트
- L74: 스택, 큐, 덱
- L86: 힙과 우선순위 큐
- L100: 해시 테이블과 집합
- L106: 트리와 그래프
- L126: 4. 코드로 확인
- L237: 5. 버전별 변화 — 왜 바뀌었나
- L244: 6. 실무 가이드
- L256: 7. 함정·안티패턴
- L266: 8. 자가점검 Q&A (면접 대비)
- L268: Q1. 목록의 기본 구현으로 왜 `ArrayList`를 고르는가?
- L274: Q2. 연결 리스트의 삽입은 정말 O(1)인가?
- L280: Q3. 자료구조의 스택/힙과 JVM 스택/힙은 어떤 관계인가?
- L286: Q4. `PriorityQueue`의 반복자 결과는 왜 정렬 순서가 아닌가?
- L292: Q5. 해시 조회 O(1)을 무조건 말할 수 없는 이유는?
- L298: Q6. 중복 제거에 `HashSet`과 `TreeSet` 중 무엇을 쓰나?
- L304: Q7. 희소 그래프를 인접 행렬 대신 인접 리스트로 저장하는 이유는?
- L310: Q8. HTTP 요청 대기열을 `ArrayDeque`로 공유해도 되나?
- L316: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j25`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task53/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
