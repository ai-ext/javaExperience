# task122: W13 · W13. 프론트와 백엔드의 경계 — 무엇을 서버에서만 해야 하나

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W13-frontend-backend-boundary.md
- 원문 SHA256: `d3573fd2b4ca4c6a64f805f4e081c640e16c7e63263bc5a0b903c463fbd704ca` / 309줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 브라우저 신뢰경계와 서버 검증·인가, CSR·SSR·BFF·세션과 렌더링/토큰 경계
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W13. 프론트와 백엔드의 경계 — 무엇을 서버에서만 해야 하나
- L7: 1. 질문
- L15: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L27: 브라우저는 사용자 영역이다
- L39: 검증을 중복하는 이유
- L47: 렌더링 위치와 API 경계
- L71: CORS가 생긴 자리
- L77: 상태와 비밀값의 위치
- L89: 4. 선택지 비교
- L101: 5. 코드로 보기
- L105: 잘못된 나눔: 브라우저가 계산한 금액을 서버가 믿음
- L122: 바로잡기: 요청은 명령, 값은 서버 데이터로 재계산
- L198: 빠른 UX와 최종 검증은 역할이 다르다
- L202: 출처 제한 CORS 설정 예
- L225: 6. 실무에서는 실제로
- L235: 7. 흔한 오해와 실수
- L246: 8. 자가점검 Q&A (면접 대비)
- L248: Q1. 프론트 검증과 서버 검증을 둘 다 하는 이유는?
- L254: Q2. 관리자 메뉴를 숨긴 것과 API 권한 검사의 차이는?
- L260: Q3. 프론트가 보낸 `totalAmount`를 서버가 그대로 써도 되는 경우가 있는가?
- L266: Q4. CORS는 인증인가, 방화벽인가?
- L272: Q5. SSR이면 백엔드 API 권한 판정을 줄일 수 있는가?
- L278: Q6. `HttpOnly` 쿠키가 XSS를 완전히 막는가?
- L284: Q7. BFF는 모든 SPA에 도입해야 하나?
- L290: Q8. 서버에서 권한을 확인하고 재고를 읽은 뒤 차감하면 충분한가?
- L296: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w13`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task122/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
