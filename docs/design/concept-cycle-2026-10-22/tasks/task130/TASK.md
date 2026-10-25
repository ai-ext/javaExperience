# task130: W22 · W22. 로컬에선 되는데 서버에선 왜 안 되나 — 환경 차이 점검

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W22-works-locally-not-on-server.md
- 원문 SHA256: `389185b8f5511e023c1f96438e7250b5c65ab31fd9167bd0d3644a40ff1ae8b0` / 297줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Environment fingerprinting and differential diagnosis, Configuration precedence, container networking and representative verification
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W22. 로컬에선 되는데 서버에선 왜 안 되나 — 환경 차이 점검
- L7: 1. 질문
- L17: 원인 분류 체크리스트
- L34: 2. 짧은 답
- L44: 3. 왜 그런가 — 원리
- L67: 설정과 프로세스 경계
- L77: 기본값·데이터·자원
- L87: 4. 선택지 비교
- L99: 5. 코드로 보기
- L101: 예제 1 — 실행 지문을 남겨 비교한다
- L137: 예제 2 — 같은 설정을 파일·환경 변수·명령행으로 공급한다
- L188: 예제 3 — DB와 앱을 컨테이너 네트워크 안에서 재현한다
- L226: 6. 실무에서는 실제로
- L237: 7. 흔한 오해와 실수
- L256: 8. 자가점검 Q&A (면접 대비)
- L258: Q1. 로컬에서는 DB 접속되고 운영에서는 timeout이다. 어디부터 확인하나?
- L262: Q2. `application.yaml`에 쓴 값이 런타임에 적용되지 않을 때?
- L266: Q3. Docker를 쓰면 “works on my machine” 문제가 없어지나?
- L270: Q4. 로컬에서 날짜 집계가 맞는데 서버에서 하루씩 어긋난다. 원인은?
- L274: Q5. 개발 PC의 한글 CSV가 운영에서 깨질 때 Java 기본 인코딩부터 바꾸면 되나?
- L278: Q6. Docker 로컬에서는 빠른데 운영에서만 timeout/OOM이 난다. 무엇이 다른가?
- L282: Q7. 레거시 서비스를 Docker로 옮기는 첫 단계는 무엇인가?
- L286: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w22`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task130/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
