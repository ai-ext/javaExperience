# task74: P26 · P26. 메일 발송 실무 — JavaMailSender와 로컬 테스트

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P26-mail-notification.md
- 원문 SHA256: `6597950573e84a2549852adad756e8c0d226350fba1566a8318502702fb33ef9` / 357줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: SMTP sender와 MIME, SMTP port·TLS·timeout 설정, commit 이후 outbox와 재시도, 메일 실제 전달 가능성
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P26. 메일 발송 실무 — JavaMailSender와 로컬 테스트
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L15: 2.1 의존성은 starter 하나에서 시작한다
- L35: 2.2 SMTP 포트와 보안 방식을 구분한다
- L46: 2.3 Boot 설정의 최소 형태
- L49: src/main/resources/application.yml
- L66: 2.4 단순 텍스트는 `SimpleMailMessage`
- L83: 2.5 HTML·첨부·인라인 이미지는 MIME으로 만든다
- L111: 2.6 제목과 본문 인코딩
- L115: 2.7 템플릿은 비즈니스 코드와 분리한다
- L167: 2.8 동기·비동기·커밋 시점을 나눈다
- L173: 3. 따라 하기
- L175: 3.1 Mailpit을 compose로 실행
- L178: compose.yaml
- L196: 3.2 Spring Boot 앱 설정
- L202: 3.3 발송 엔드포인트를 연결
- L237: 3.4 실패를 기록하고 재시도한다
- L258: 3.5 실서비스 SMTP로 교체
- L275: 4. 치트시트
- L290: 5. 자주 나는 에러와 해결
- L306: 6. 한 단계 더
- L312: 7. 자가점검 Q&A (면접 대비)
- L314: Q1. `JavaMailSender`와 `SimpleMailMessage`의 관계는?
- L320: Q2. 587 STARTTLS와 465 TLS를 왜 구분하는가?
- L326: Q3. HTML 메일에 `MimeMessageHelper`를 쓰는 이유는?
- L332: Q4. 주문 트랜잭션 안에서 바로 메일을 보내면 안 되는 경우는?
- L338: Q5. 재시도 대상과 즉시 실패 대상을 어떻게 나누는가?
- L344: Q6. Mailpit 테스트가 운영 품질을 모두 보장하지 못하는 이유는?
- L350: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p26`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task74/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
