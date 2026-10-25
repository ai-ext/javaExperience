# task83: R06 · R06. DB 클라이언트 도구 — DBeaver는 무엇이고 왜 여러 DB에 붙을 수 있나

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R06-db-client-tools.md
- 원문 SHA256: `71526557b37d9734caa2492ac55d3bc232e5a7335048215f1df9f42153d348a9` / 272줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: DB client·JDBC driver·server 역할, port mapping과 DB 인증, SQL 실행·ERD·데이터 변경, SSH·TLS·권한과 export 보안
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: R06. DB 클라이언트 도구 — DBeaver는 무엇이고 왜 여러 DB에 붙을 수 있나
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L40: 3. 따라 하기
- L55: 1단계 — 실행 중인 연습 DB의 포트와 계정 확인
- L71: 2단계 — DBeaver에서 연결 만들기
- L88: 3단계 — 문자셋과 로컬 공개키 검색 옵션
- L112: 4단계 — 테이블을 살펴보고 쿼리 결과 읽기
- L128: 5단계 — 안전하게 데이터 편집 연습하기
- L150: 6단계 — ERD와 CSV 내보내기
- L158: 원격 DB — SSH 터널과 TLS
- L171: 4. 치트시트
- L188: 5. 자주 나는 에러와 해결
- L204: 6. 한 단계 더
- L222: 7. 자가점검 Q&A (면접 대비)
- L224: Q1. DBeaver가 꺼져 있어도 MySQL 데이터는 남는가?
- L230: Q2. 한 프로그램이 MySQL, PostgreSQL, Oracle에 붙는 원리는 무엇인가?
- L236: Q3. 로컬에서 `allowPublicKeyRetrieval=true`를 켰다면 운영에도 켜도 되는가?
- L242: Q4. 컨테이너 안 MySQL이 3306인데 DBeaver에는 왜 13307을 입력할 수 있는가?
- L248: Q5. DBeaver의 read-only와 auto-commit off 중 무엇이 운영 안전을 보장하는가?
- L254: Q6. 조회 결과를 CSV로 보내 달라는 요청을 받으면 무엇을 확인하는가?
- L260: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:r06`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task83/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
