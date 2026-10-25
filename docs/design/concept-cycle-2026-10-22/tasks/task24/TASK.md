# task24: D10 · D10. DB 기초 — 백엔드 개발자가 알아야 할 관계형 데이터베이스

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D10-database-basics.md
- 원문 SHA256: `05e6f3eabfeb1d915d88a79a6cda1da555f05744285247b74539de16a9ee7226` / 449줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d10-2026-10-21/VERIFICATION.md
- 참고 개념: 데이터 model·schema·constraint·normalization, query plan과 index, transaction·lock·운영 경계, NoSQL 모델과 저장소 선택
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: D10. DB 기초 — 백엔드 개발자가 알아야 할 관계형 데이터베이스
- L7: 1. 큰 그림
- L29: 2. 용어 사전
- L55: 3. 단계별로 보기
- L57: 3.1 모델링·스키마: 저장 규칙을 먼저 정한다
- L71: 업무 문장을 ERD와 키 제약으로 바꾸기 (보강)
- L158: 3.2 SQL 요청: 선언한 결과를 서버가 계획한다
- L202: 3.3 인덱스·실행계획: 빨라졌는지 계획과 결과로 확인한다
- L226: 3.4 트랜잭션·락: 동시 요청의 정합성을 지킨다
- L251: 3.5 연결·운영: 요청량은 결국 DB 자원으로 모인다
- L259: 3.6 NoSQL과 제품 선택: 데이터 접근 패턴을 먼저 본다
- L270: 4. 직접 해보기
- L349: application.properties — 로컬 예시 (미실행)
- L357: 5. 자주 하는 오해와 실수
- L365: 6. 시각화 설계 메모
- L372: 7. 자가점검 Q&A (면접 대비)
- L438: 8. 참고문헌

## 기존 관련 파일

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d10-learning.bundle.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d10-learning.css
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d10-learning.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d10-learning.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d10-lesson-data.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d10-supplement.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:d10`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task24/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
