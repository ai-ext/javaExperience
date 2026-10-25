# task12: W15 · W15. 페이징 — OFFSET vs 커서(키셋), 무엇을 언제

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W15-paging-offset-vs-cursor.md
- 원문 SHA256: `9937498a3b948f96099dca7bb625573bdc40879254c82c67afc465dee663108b` / 283줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/VERIFICATION.md
- 참고 개념: OFFSET, Page/Slice와 깊은 페이지 비용, 키셋 커서와 deterministic composite ordering
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W15. 페이징 — OFFSET vs 커서(키셋), 무엇을 언제
- L7: 1. 질문
- L15: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L27: OFFSET은 위치 번호를 알아내기 위해 앞부분을 지나간다
- L35: MySQL에서 실제 계획을 비교한다
- L41: 커서 경계는 완전한 정렬 순서여야 한다
- L51: OFFSET과 키셋의 동시성 차이는 스냅샷과 다르다
- L68: 총 건수는 별도 질문이다
- L74: 4. 선택지 비교
- L88: 5. 코드로 보기
- L198: 6. 실무에서는 실제로
- L213: 7. 흔한 오해와 실수
- L225: 8. 자가점검 Q&A (면접 대비)
- L227: Q1. OFFSET이 깊은 페이지에서 느려지는 이유는 무엇인가?
- L233: Q2. 키셋 페이징은 동시 삽입·삭제에 완전히 안전한가?
- L239: Q3. `ORDER BY created_at DESC`와 `WHERE created_at < :last`면 충분한가?
- L245: Q4. Spring Data의 `Page`, `Slice`, `Window`는 각각 무엇을 표현하나?
- L251: Q5. 내림차순 복합 정렬의 커서 조건은 어떻게 쓰나?
- L257: Q6. `Slice`나 `Window`를 쓰면 DB 쿼리가 항상 더 빨라지나?
- L263: Q7. 번호 페이지 UI를 키셋으로 바꿀 수 있나?
- L269: Q8. cursor를 Base64로 인코딩하면 변조를 막을 수 있나?
- L275: 9. 참고문헌

## 기존 관련 파일

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-learning.bundle.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-learning.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-learning.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-learning.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-lesson-data.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w15-supplement.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w15`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task12/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
