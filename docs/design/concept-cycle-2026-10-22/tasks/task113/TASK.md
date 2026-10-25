# task113: W02 · W02. 왜 Controller·Service·Repository로 나누나 — 안 나누면 생기는 일

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W02-why-layers.md
- 원문 SHA256: `4ca28104cec76d2a8ae9a4f683324a8c5a65eb0734fb1b8127fb5b9332012c7d` / 346줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 계층을 나누는 기준은 변경 이유와 실행 경계, Service as application use case; when direct Repository access is enough, 트랜잭션 경계와 proxy 기반 적용, 인터페이스와 구현 분리의 선택 기준, Layered architecture and Hexagonal architecture distinction, 외부 계층에서 규칙을 재사용하고 테스트 경계를 분리하기
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W02. 왜 Controller·Service·Repository로 나누나 — 안 나누면 생기는 일
- L7: 1. 질문
- L19: 2. 짧은 답
- L29: 3. 왜 그런가 — 원리
- L42: 실행 경계와 책임
- L50: 의존 방향이 파급을 바꾸는 방식
- L56: 트랜잭션과 프록시
- L66: 무엇을 테스트하기 쉬워지는가
- L70: 4. 선택지 비교
- L83: 5. 코드로 보기
- L87: 공통 모델과 저장소
- L119: 선택지 A — Controller가 업무까지 수행
- L157: 선택지 B — 단순 Repository 읽기는 Controller에서 바로 호출
- L188: 선택지 C — Service가 유스케이스와 할인 규칙을 소유
- L247: Service 인터페이스와 `Impl`을 추가할 조건
- L251: 6. 실무에서는 실제로
- L253: 신규 서비스
- L257: 레거시
- L261: SI·금융·복잡한 도메인
- L265: 스타트업·소규모 도구
- L269: 섞어 쓰기와 이동 경로
- L277: 7. 흔한 오해와 실수
- L287: 8. 자가점검 Q&A (면접 대비)
- L289: Q1. Controller, Service, Repository로 나누는 가장 실질적인 이유는?
- L297: Q2. Controller에서 Repository를 바로 호출해도 되나?
- L305: Q3. Service는 반드시 업무 규칙을 직접 계산해야 하나?
- L313: Q4. Service 경계가 트랜잭션에 유리한 이유는?
- L321: Q5. Service 인터페이스와 구현 클래스는 항상 필요한가?
- L329: Q6. 헥사고날 아키텍처를 쓰면 Controller·Service·Repository가 사라지나?
- L337: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w02`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task113/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
