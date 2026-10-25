# task107: V01 · V01. 무엇을 어떻게 테스트하나 — 대상 고르기부터 테스트 하나의 구조까지

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V01-what-and-how-to-test.md
- 원문 SHA256: `a03fdd8ce086fb887ee1d5e6c34bdb6e59ce927e1dc71ef317a6ee6265e4bf74` / 276줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 위험도에 따른 테스트 대상 선택, 검증 경계별 테스트 범위, AAA·assertion·테스트 비용
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: V01. 무엇을 어떻게 테스트하나 — 대상 고르기부터 테스트 하나의 구조까지
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L15: 2.1 요구사항에서 테스트할 행동을 고른다
- L21: 2.2 검증할 계약에 맞춰 범위를 정한다
- L33: 2.3 피라미드와 트로피는 비율표가 아니다
- L39: 2.4 테스트 하나는 한 행동을 준비·실행·검증한다
- L53: 2.5 이름에서 입력과 기대 결과를 읽을 수 있어야 한다
- L63: 2.6 단언은 실패 원인을 드러내게 쓴다
- L75: 2.7 테스트 수와 실행 시간은 얻는 정보로 판단한다
- L81: 3. 따라 하기
- L85: 1단계: 기존 구현과 테스트를 읽는다
- L96: 2단계: 테스트 의존성을 확인한다
- L116: 3단계: 성공과 실패 HTTP 계약을 분리한다
- L177: 4단계: DB 쿼리에는 통합 테스트를 선택한다
- L185: 5단계: 수정 중 빠른 테스트부터 넓힌다
- L191: 4. 치트시트
- L208: 5. 자주 나는 에러와 해결
- L222: 6. 한 단계 더
- L230: 7. 자가점검 Q&A (면접 대비)
- L232: Q1. 테스트는 왜 필요한가요? 컴파일만으로 안 되나요?
- L238: Q2. Service와 Controller 테스트 범위를 왜 나누나요?
- L244: Q3. `@WebMvcTest`와 `@SpringBootTest`+MockMvc는 언제 쓰나요?
- L250: Q4. `@DataJpaTest`에서 통과했는데 운영 MySQL에서 실패할 수 있나요?
- L256: Q5. 테스트마다 assertion 하나만 둬야 하나요?
- L262: Q6. 테스트 피라미드와 트로피 중 무엇이 맞나요?
- L268: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:v01`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task107/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
