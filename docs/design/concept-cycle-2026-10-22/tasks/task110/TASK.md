# task110: V05 · V05. 까다로운 대상 테스트하기 — 보안·예외·비동기·동시성·파일

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V05-testing-tricky-things.md
- 원문 SHA256: `a3f5b0fad8eefe56bb76d4ee2074470a0d31daa61727bf8e94ba22d41f8007c7` / 323줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 보안 identity·인가·CSRF 검증, 비동기·예약 작업·AFTER_COMMIT 검증, DB 경쟁 조건과 원자적 갱신, 파일·시간·원격 timeout 경계
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: V05. 까다로운 대상 테스트하기 — 보안·예외·비동기·동시성·파일
- L7: 1. 한 줄로 말하면
- L11: 2. 당장 알아야 할 것
- L22: 3. 따라 하기
- L26: 1단계 — 테스트 의존성과 Boot 4 import
- L46: 2단계 — 실제 상품 API 인증·인가·CSRF
- L82: 3단계 — ProblemDetail·검증 실패 응답
- L109: 4단계 — `@Async`·`@Scheduled` 결과 기다리기
- L139: 5단계 — 이벤트 발행과 커밋 후 부수 효과
- L158: 6단계 — 마지막 재고 한 개를 두 스레드가 구매
- L197: 7단계 — 파일·Clock·외부 timeout
- L245: 4. 치트시트
- L261: 5. 자주 나는 에러와 해결
- L272: 6. 한 단계 더
- L278: 7. 자가점검 Q&A (면접 대비)
- L280: Q1. 인증 실패와 권한 부족을 왜 구별하나?
- L285: Q2. CSRF 테스트에 유효 토큰만 넣으면 충분한가?
- L290: Q3. Async 메서드 테스트에서 `sleep`이 불안정한 이유는?
- L295: Q4. AFTER_COMMIT 테스트가 롤백 테스트에서 동작하지 않는 이유는?
- L300: Q5. 동시성 테스트에서 외부 트랜잭션을 끄는 이유는?
- L305: Q6. MockMultipartFile 테스트가 컨테이너 업로드 크기도 검증하나?
- L310: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:v05`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task110/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
