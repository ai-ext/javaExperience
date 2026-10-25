# task97: S14 · S14. 메시징 (Kafka·RabbitMQ)

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S14-messaging.md
- 원문 SHA256: `e206b8e0b6ed34eda96686cc5d2c5085ec688728f4939c925449bc0843d6e771` / 370줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Kafka 로그와 RabbitMQ 큐, at-most-once·at-least-once·exactly-once, ack·offset commit·publisher confirm, 멱등 소비자와 Outbox, 재시도·DLT/DLQ와 순서
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S14. 메시징 (Kafka·RabbitMQ)
- L7: 1. 왜 알아야 하나
- L13: 2. 핵심 개념
- L25: Kafka 로그와 RabbitMQ 큐
- L37: 전달 보장 세 가지
- L45: 3. 내부 동작·원리
- L47: Kafka: 생산부터 커밋까지
- L66: RabbitMQ: 발행부터 ack까지
- L82: DB 변경과 이벤트를 함께 보장하기
- L101: 4. 코드로 확인
- L103: 예제 1 — Kafka 발행과 DB 멱등 소비
- L163: 예제 2 — RabbitMQ 토픽 라우팅과 listener
- L223: 예제 3 — 아웃박스 행을 업무 변경과 함께 저장
- L258: 5. 버전별 변화 — 왜 바뀌었나
- L267: 6. 실무 가이드
- L280: 7. 함정·안티패턴
- L290: 8. 자가점검 Q&A (면접 대비)
- L292: Q1. Kafka 토픽과 RabbitMQ 큐는 둘 다 메시지 목록 아닌가?
- L300: Q2. consumer group의 소비자를 무한히 늘리면 처리량도 계속 증가하나?
- L308: Q3. offset commit은 언제 해야 중복과 유실을 모두 막나?
- L316: Q4. “Kafka exactly-once”가 결제 API 호출 중복도 없애나?
- L324: Q5. 재시도 토픽과 blocking retry 중 무엇을 고르나?
- L332: Q6. 업무 DB 업데이트 후 이벤트 발행에 Kafka 트랜잭션을 걸면 아웃박스가 필요 없나?
- L340: Q7. RabbitMQ publisher confirm은 consumer ack와 같은가?
- L348: Q8. Spring Cloud Stream을 쓰면 Kafka와 RabbitMQ를 설정만 바꿔 교체할 수 있나?
- L356: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s14`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task97/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
