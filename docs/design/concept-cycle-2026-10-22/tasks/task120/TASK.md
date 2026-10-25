# task120: W10 · W10. 검증은 어디서 하나 — 프론트·서버·DB, 왜 둘 다 하나

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W10-where-to-validate.md
- 원문 SHA256: `bed27e48966ef79fa487448c235ceb64f1ad0658a71165dbd7e147d1307cbdd9` / 364줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 검증 신뢰 경계: client, server, database, Bean Validation DTO constraints and groups, Current business state and authorization belong to service/security boundary, Database constraints and check-then-act race, Validation error response as API contract, Contract rule sharing and drift control
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W10. 검증은 어디서 하나 — 프론트·서버·DB, 왜 둘 다 하나
- L7: 1. 질문
- L15: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L42: 각 층에서 확인할 것
- L59: 중복 검사와 경쟁 조건
- L76: 4. 선택지 비교
- L88: 5. 코드로 보기
- L92: 5.1 프론트: 제출 전 피드백
- L112: 5.2 서버: DTO 제약과 검증 오류 응답
- L201: 5.3 서비스와 DB: 안내 검사와 최종 고유성
- L282: 6. 실무에서는 실제로
- L293: 7. 흔한 오해와 실수
- L305: 8. 자가점검 Q&A (면접 대비)
- L307: Q1. 브라우저에서 검증했는데 서버에서 또 검사하는 이유는?
- L315: Q2. `@NotBlank`와 서비스의 `if (name.isBlank())`를 둘 다 쓰나?
- L323: Q3. Bean Validation 그룹은 언제 필요한가?
- L331: Q4. 가입 이메일 중복을 `existsByEmail`로 검사했는데 왜 UNIQUE가 필요한가?
- L339: Q5. 재고 수량이 0 이상이어야 한다면 DTO, 서비스, DB 중 어디가 맞나?
- L347: Q6. 모든 검증 오류를 HTTP 400으로 반환해도 되나?
- L357: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w10`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task120/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
