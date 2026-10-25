# task100: S17 · S17. Spring Boot 애플리케이션 성능

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S17-performance-tuning.md
- 원문 SHA256: `ac9ff62e79374c261fdb4e8b0722e3318c90538741de7ce544c398c52a1924b1` / 293줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Tomcat worker·연결·대기열, HikariCP와 전체 DB 연결 예산, timeout과 deadline 전파, 기동 시간과 lazy initialization, heap·RSS·컨테이너 메모리
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S17. Spring Boot 애플리케이션 성능
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L28: 헷갈리는 한계값
- L44: 3. 내부 동작·원리
- L46: 요청 경로와 포화 전파
- L80: 시간 제한의 전파
- L94: 기동 시간 계측과 lazy initialization
- L100: 메모리 사용을 추적하는 순서
- L112: 4. 코드로 확인
- L116: 예제 1 — Tomcat, Hikari, 시간 제한의 출발 설정
- L119: application.yml — Boot 4.1 설정 예시 (미실행)
- L145: 예제 2 — 단계별 Spring 기동 기록
- L169: 예제 3 — k6에서 요청률과 SLO를 함께 고정
- L201: 5. 버전별 변화 — 왜 바뀌었나
- L207: 6. 실무 가이드
- L219: 부하 시험 설계
- L229: 7. 함정·안티패턴
- L240: 8. 자가점검 Q&A (면접 대비)
- L242: Q1. Tomcat worker를 늘렸는데 처리량이 줄 수도 있는 이유는?
- L248: Q2. Tomcat thread 수와 `max-connections`는 어떻게 다른가?
- L254: Q3. Hikari 풀을 키우면 DB 처리량이 항상 늘지 않는 이유는?
- L260: Q4. `server.tomcat.connection-timeout`을 요청 제한 시간으로 써도 될까?
- L266: Q5. `BufferingApplicationStartup`은 어떤 문제를 해결하나?
- L272: Q6. lazy initialization은 언제 좋은 선택인가?
- L278: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s17`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task100/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
