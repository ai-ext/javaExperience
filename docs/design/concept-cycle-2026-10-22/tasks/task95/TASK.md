# task95: S12 · S12. Spring Security 아키텍처

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S12-security-architecture.md
- 원문 SHA256: `5c19eecfe69e48d516ab8acec6e25a34679ca83e2d5f34ab1432f2280d8b22c2` / 377줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Security filter chain·authentication, Session·CSRF/CORS·method security·password
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S12. Spring Security 아키텍처
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L32: 헷갈리는 경계
- L42: 3. 내부 동작·원리
- L44: 필터 체인 진입과 선택
- L63: 사용자 이름/비밀번호 인증 흐름
- L83: 세션 수명과 고정 공격
- L89: 로그인부터 로그아웃까지 (보강)
- L184: 컨텍스트 수명과 스레드
- L190: 인가 흐름
- L196: 4. 코드로 확인
- L200: 예제 1: HTTP 요청 규칙과 기본 로그인
- L230: 예제 2: 비밀번호 인코더와 사용자 조회
- L263: 5. 버전별 변화 — 왜 바뀌었나
- L273: 6. 실무 가이드
- L285: 7. 함정·안티패턴
- L297: 8. 자가점검 Q&A (면접 대비)
- L299: Q1. `DelegatingFilterProxy`와 `FilterChainProxy`의 역할을 구분해 설명하라.
- L307: Q2. `AuthenticationManager`와 `AuthenticationProvider`를 나눈 이유는?
- L315: Q3. 인증 후 컨텍스트를 `SecurityContextHolder`에 넣으면 왜 충분하지 않을 수 있나?
- L323: Q4. `permitAll()`과 Security 필터 체인 제외는 어떻게 다른가?
- L331: Q5. CORS preflight와 CSRF를 함께 다룰 때 핵심은?
- L339: Q6. `hasRole("ADMIN")`인데 권한이 거부되는 흔한 이유는?
- L347: Q7. HTTP 인가와 메서드 인가를 둘 다 쓰는 이유는?
- L355: Q8. 비밀번호 저장에 빠른 SHA-256 해시를 쓰면 안 되는 까닭은?
- L363: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s12`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task95/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
