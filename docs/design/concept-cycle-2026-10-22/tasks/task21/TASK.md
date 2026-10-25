# task21: D07 · D07. 온프레미스 vs 클라우드 — 서버는 어디에 있고 누가 관리하나

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D07-onprem-vs-cloud.md
- 원문 SHA256: `0945450013d203109827f96fe2450233a1c79de1ce6caa4e904ccebd3da228b2` / 300줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/VERIFICATION.md
- 참고 개념: 배포 모델과 공동 책임, 가상화와 availability zone, 비용과 migration 전략
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: D07. 온프레미스 vs 클라우드 — 서버는 어디에 있고 누가 관리하나
- L7: 1. 큰 그림
- L34: 2. 용어 사전
- L64: 3. 단계별로 보기
- L66: 3.1 서버 위치와 책임 경계
- L83: 3.2 가상화와 컨테이너
- L98: 3.3 리전·AZ·트래픽 흐름
- L120: 3.4 서비스 선택과 실제 대응
- L135: 3.5 비용과 전환
- L143: 4. 직접 해보기
- L147: 4.1 Spring Boot 애플리케이션을 로컬 프로세스로 실행
- L180: HTTP/1.1 200
- L181: ok
- L186: 4.2 같은 애플리케이션을 컨테이너로 패키징
- L207: 4.3 실행 위치를 세 가지로 그려 보기
- L226: 5. 자주 하는 오해와 실수
- L236: 6. 시각화 설계 메모
- L244: 7. 자가점검 Q&A (면접 대비)
- L246: Q1. 온프레미스와 퍼블릭 클라우드의 본질적 차이는 무엇인가?
- L252: Q2. IaaS에서 고객이 반드시 관리해야 하는 것은?
- L258: Q3. 리전과 AZ를 어떻게 선택하는가?
- L264: Q4. VM과 컨테이너를 비교해 보라.
- L270: Q5. 관리형 Kubernetes를 쓰면 무엇이 편해지고 무엇이 남는가?
- L276: Q6. 클라우드 비용을 온프레미스와 비교할 때 무엇을 포함해야 하는가?
- L282: Q7. Rehost, Replatform, Refactor를 언제 선택하는가?
- L288: 8. 참고문헌

## 기존 관련 파일

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-learning.bundle.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-learning.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-learning.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-learning.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-lesson-data.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d07-supplement.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:d07`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task21/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
