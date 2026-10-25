# task4: W09 · W09. DTO는 왜 쓰나 — 엔티티를 그대로 반환하면 생기는 일

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W09-why-dto.md
- 원문 SHA256: `168007fa2f8a3205c00186c9e96c11dc826aa235baff5076237a07a3997b8468` / 388줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/VERIFICATION.md
- 참고 개념: DTO as external API contract and mass-assignment boundary, Entity serialization, lazy loading, OSIV and cycles, Entity-to-DTO mapping methods, DTO projection and query cost, Record and nested mutability
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W09. DTO는 왜 쓰나 — 엔티티를 그대로 반환하면 생기는 일
- L9: 1. 질문
- L17: 2. 짧은 답
- L27: 3. 왜 그런가 — 원리
- L61: 4. 선택지 비교
- L76: 5. 코드로 보기
- L312: 6. 실무에서는 실제로
- L326: 7. 흔한 오해와 실수
- L335: 8. 자가점검 Q&A (면접 대비)
- L378: 9. 참고문헌

## 기존 관련 파일

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w09-learning.bundle.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w09-learning.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w09-learning.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w09-learning.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w09-lesson-data.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w09`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
