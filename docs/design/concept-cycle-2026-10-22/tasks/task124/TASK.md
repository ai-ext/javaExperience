# task124: W16 · W16. ID 생성 전략 — AUTO_INCREMENT vs UUID vs ULID·Snowflake

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W16-id-generation.md
- 원문 SHA256: `3a8a90f8bbac0d727c5eed2ff4bd3ccc61f0b086fd4627608f4384e563c10524` / 302줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: ID generator placement and JPA batching, Distributed identifier shape, storage cost, and security separation
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W16. ID 생성 전략 — AUTO_INCREMENT vs UUID vs ULID·Snowflake
- L7: 1. 질문
- L15: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L27: 생성 위치가 생명주기와 배치를 결정한다
- L47: InnoDB에서 PK는 단순한 행 번호가 아니다
- L55: 분산 유일성은 배치 상태 또는 확률에 의존한다
- L65: 4. 선택지 비교
- L78: 5. 코드로 보기
- L210: 6. 실무에서는 실제로
- L212: 신규 서비스
- L220: 레거시·SI·금융
- L226: 스타트업·여러 서비스
- L236: 7. 흔한 오해와 실수
- L247: 8. 자가점검 Q&A (면접 대비)
- L249: Q1. MySQL에서 UUIDv4 PK가 AUTO_INCREMENT보다 느려질 수 있는 이유는?
- L255: Q2. JPA `IDENTITY`와 `SEQUENCE`를 배치 INSERT 관점에서 비교하면?
- L261: Q3. `GenerationType.UUID`를 지정하면 UUIDv7이 생성되나?
- L267: Q4. UUIDv7은 정렬 가능한데 이벤트 순서 키로 쓰면 안 되나?
- L273: Q5. 내부 PK와 외부 공개 ID를 분리하면 무엇을 얻고 무엇을 내나?
- L279: Q6. Snowflake가 UUID보다 작은데도 모든 서비스의 기본 ID가 되지 않는 이유는?
- L285: Q7. 숫자 PK가 증가한다면 최대 ID를 통해 전체 레코드 수를 알 수 있나?
- L291: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w16`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task124/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
