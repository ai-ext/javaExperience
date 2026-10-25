# task25: D11 · D11. 웹 보안 기초 — 백엔드 개발자가 막아야 할 것들

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D11-web-security-basics.md
- 원문 SHA256: `a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba` / 314줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 인증·인가·object 소유권, CORS·CSRF·TLS·입출력 경계, password·secret·dependency·log 보안
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: D11. 웹 보안 기초 — 백엔드 개발자가 막아야 할 것들
- L7: 1. 큰 그림
- L29: 2. 용어 사전
- L60: 3. 단계별로 보기
- L62: 3.1 요청 경계: HTTPS, Origin, CORS
- L90: 3.2 인증과 인가: 신원 확인 후 객체까지 확인
- L112: 3.3 입력·출력·데이터베이스 경계
- L118: 3.4 상태 변경과 CSRF
- L124: 3.5 운영 경계: 비밀번호, 비밀값, 의존성, 로그
- L134: 4. 직접 해보기
- L138: 4.1 안전한 SQL 바인딩과 IDOR 방어를 먼저 설계하기
- L164: 4.2 Spring Security의 기본 방어를 켠 최소 설정
- L202: 4.3 CORS preflight 관찰
- L215: 4.4 보안 헤더와 의존성 점검
- L225: 5. 자주 하는 오해와 실수
- L236: 6. 시각화 설계 메모
- L243: 7. 자가점검 Q&A (면접 대비)
- L245: Q1. 인증과 인가를 실제 API에서 어떻게 나누나?
- L253: Q2. CORS와 CSRF는 어떻게 다른가?
- L261: Q3. PreparedStatement가 SQL Injection을 막는 원리는?
- L269: Q4. IDOR를 식별자 UUID로 바꾸면 왜 충분하지 않나?
- L277: Q5. 비밀번호 해시와 암호화의 차이는?
- L285: Q6. HSTS가 해결하지 못하는 것은?
- L293: Q7. 취약 의존성 경고를 받으면 어떤 순서로 처리하나?
- L301: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:d11`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task25/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
