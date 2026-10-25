# task68: P18 · P18. 동시성 문제 실전 — 재고 차감·좌석 예약을 안전하게

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P18-concurrency-inventory.md
- 원문 SHA256: `7c5b2d57d5ce514c43435d4a99f9c413715193e551aa8a1dc134a3cc1e49becf` / 377줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Lost update와 원자 조건부 UPDATE, 비관적·낙관적 DB 락, JVM lock·Redis lease·queue 범위, 멱등키·좌석 unique 제약, Redis lease and queues
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P18. 동시성 문제 실전 — 재고 차감·좌석 예약을 안전하게
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L15: 2.1 문제는 `읽기 → 판단 → 쓰기`가 분리될 때 생긴다
- L29: 2.2 가장 싼 해결책: 조건부 원자 UPDATE
- L47: 2.3 비관적 락은 읽은 뒤 여러 판단을 해야 할 때 쓴다
- L57: 2.4 낙관적 락은 충돌을 허용하고 재시도한다
- L66: 2.5 JVM 락의 범위를 오해하지 않는다
- L72: 2.6 Redis 락은 데이터 정합성 락과 구분한다
- L78: 2.7 중복 요청은 동시성 락이 해결하지 않는다
- L82: 2.8 좌석은 재고보다 유니크 제약이 핵심이다
- L91: 2.9 큐는 강한 직렬화가 필요할 때의 선택지다
- L95: 3. 따라 하기
- L97: 3.1 순수 Java로 경쟁 상태 재현
- L141: 3.2 Spring Boot 프로젝트 뼈대
- L177: 3.3 조건부 원자 차감 구현
- L245: 3.4 비관적·낙관적 락의 형태
- L266: 3.5 동시 요청 테스트
- L272: 4. 치트시트
- L297: 5. 자주 나는 에러와 해결
- L307: 6. 한 단계 더
- L313: 7. 자가점검 Q&A (면접 대비)
- L315: Q1. `synchronized`로 재고 차감을 감싸면 충분한가?
- L323: Q2. `stock > 0`을 Java에서 검사하고 `stock - 1`을 저장하면 왜 틀리는가?
- L331: Q3. 비관적 락과 낙관적 락은 어떻게 고르는가?
- L339: Q4. `SELECT ... FOR UPDATE`를 호출했는데도 락이 안 걸리는 것 같다. 이유는?
- L347: Q5. Redis Redlock이면 결제 좌석을 안전하게 보호할 수 있는가?
- L355: Q6. 멱등키와 락은 무엇이 다른가?
- L363: Q7. 좌석 예약에서 `existsByShowIdAndSeatNo()` 후 insert하면 왜 부족한가?
- L371: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p18`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task68/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
