# task129: W21 · W21. null 처리 전략 — Optional·JSpecify·DB NULL

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W21-null-handling.md
- 원문 SHA256: `ca3ba6bfca1c56b6feaadbd07ec2adeca1b049dfc196029761f7ef8193f00659` / 347줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Nullness contracts: Optional, JSpecify and empty collections, SQL NULL three-valued logic and JSON PATCH tri-state
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W21. null 처리 전략 — Optional·JSpecify·DB NULL
- L7: 1. 질문
- L15: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L27: null의 비용은 값보다 정보 손실과 거리에서 생긴다
- L49: `Optional`은 존재 여부를 반환 경계로 옮긴다
- L57: JSpecify는 주석보다 계약과 도구 생태계를 제공한다
- L65: DB의 NULL은 Java null과 비슷해 보여도 실행 규칙이 다르다
- L73: JSON은 필드의 부재와 null을 따로 보존해야 할 때가 있다
- L77: 버전 변화
- L83: 4. 선택지 비교
- L94: 5. 코드로 보기
- L96: 예제 1 — 순수 Java: 부재는 `Optional`, 다건 0건은 빈 목록, 필수 인자는 조기 실패
- L160: 예제 2 — Spring Framework 7: 패키지 기본값과 명시적 nullable 예외 (미실행)
- L207: 예제 3 — SQL NULL, 행 부재, Java nullable 컬럼 구분 (미실행)
- L230: 예제 4 — PATCH JSON에서 키 누락과 null 보존 (Jackson 3.1.5 API, 미실행)
- L269: 6. 실무에서는 실제로
- L279: 7. 흔한 오해와 실수
- L293: 8. 자가점검 Q&A (면접 대비)
- L295: Q1. 단건 조회에서 `null` 대신 `Optional<T>`를 반환하는 이유는?
- L301: Q2. `@NullMarked`가 있으면 null 인자를 전달할 때 무조건 런타임 예외가 나는가?
- L307: Q3. DB에서 행이 없고, 행은 있지만 컬럼이 NULL인 경우를 어떻게 다르게 표현하나?
- L313: Q4. SQL의 `WHERE value <> 5`는 value가 NULL인 행도 반환하는가?
- L319: Q5. `COUNT(*)`와 `COUNT(nickname)` 차이를 설명해 보라.
- L325: Q6. PATCH JSON에서 `{}`와 `{"nickname": null}`을 왜 구별하나?
- L331: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w21`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task129/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
