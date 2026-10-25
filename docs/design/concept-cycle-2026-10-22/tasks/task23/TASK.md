# task23: D09 · D09. 운영과 관측 — 배포 이후 서버를 지켜보는 법

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D09-operations-observability.md
- 원문 SHA256: `6ed92233be6bfa75029c31c3bb89eff723192bdbc58d27677cf29b4247eeee79` / 309줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d09-2026-10-21/VERIFICATION.md
- 참고 개념: SLI·SLO·SLA와 error budget, log·metric·trace·alert 신호, 장애 대응·capacity·disaster recovery
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: D09. 운영과 관측 — 배포 이후 서버를 지켜보는 법
- L7: 1. 큰 그림
- L29: 2. 용어 사전
- L64: 3. 단계별로 보기
- L66: 3.1 사용자 관점의 목표를 정한다
- L74: 3.2 텔레메트리를 만들고 흐르게 한다
- L117: 3.3 대시보드와 알림을 운영 가능한 형태로 만든다
- L125: 3.4 탐지부터 복구까지 같은 상황판을 쓴다
- L150: 3.5 용량과 확장, 캐시를 함께 설계한다
- L158: 3.6 백업과 재해 복구를 실제로 시험한다
- L164: 4. 직접 해보기
- L229: 5. 자주 하는 오해와 실수
- L242: 6. 시각화 설계 메모
- L251: 7. 자가점검 Q&A (면접 대비)
- L253: Q1. SLI, SLO, SLA를 실제 결제 API 사례로 구분해 설명하라.
- L259: Q2. 모니터링과 관측성의 차이를 말하고, 왜 메트릭 하나로 장애를 설명하기 어려운가?
- L265: Q3. CPU 임계치 알림과 SLO 기반 알림을 어떻게 나눌 것인가?
- L271: Q4. 애플리케이션 인스턴스를 수평 확장했는데도 지연이 나아지지 않는 원인은?
- L277: Q5. RTO와 RPO가 각각 1시간이라면 백업 정책만 세워도 되는가?
- L283: Q6. 장애를 감지한 직후 조사자가 할 첫 행동은 무엇인가?
- L289: Q7. 포스트모템에서 “실수한 개발자가 설정을 잘못 바꿨다”로 끝내면 부족한 이유는?
- L297: 8. 참고문헌

## 기존 관련 파일

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d09-learning.bundle.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d09-learning.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d09-learning.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d09-learning.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d09-lesson-data.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d09-supplement.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:d09`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task23/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
