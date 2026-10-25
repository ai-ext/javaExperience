# task117: W06 · W06. 디버깅은 왜 서버에선 브레이크포인트·로그로, 프론트에선 console.log로 하나

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W06-why-server-debugging.md
- 원문 SHA256: `f5eb14dd389f7f5b1e588d0545d8c8eca93aee09b0ad99ce96c8bc2dbc6f471b` / 340줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 디버깅 도구 선택은 실행 위치·재현성·중단 영향에 따른다, Breakpoint, Logpoint, logger and JDWP semantic difference, 로그와 관측성 신호의 역할
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W06. 디버깅은 왜 서버에선 브레이크포인트·로그로, 프론트에선 console.log로 하나
- L7: 1. 질문
- L17: 2. 짧은 답
- L27: 3. 왜 그런가 — 원리
- L29: 코드가 실행되는 위치가 도구의 모양을 결정한다
- L48: 중단점은 순간을 정지시켜 상태를 깊게 보는 도구다
- L56: 로그와 텔레메트리는 실행을 계속하면서 사후에 조사한다
- L64: JDWP는 JVM에 디버거를 연결하는 통로다
- L74: 사후 관찰은 문제 발생 전에 일부 문맥을 준비한다
- L80: 4. 선택지 비교
- L91: 고르는 순서
- L98: 5. 코드로 보기
- L102: 브라우저 탭에서 확인하기
- L129: Spring Boot 서버에서 확인하기
- L188: 같은 서버 위치를 출력으로 관찰하기
- L222: 원격 JVM에 붙는 설정은 관측 설정과 다르다
- L234: 6. 실무에서는 실제로
- L236: 신규 서비스
- L240: 레거시 서비스
- L244: SI·금융·규제 환경
- L248: 스타트업·작은 팀
- L252: 혼합 사용과 전환 경로
- L267: 7. 흔한 오해와 실수
- L281: 8. 자가점검 Q&A (면접 대비)
- L283: Q1. 브라우저에도 브레이크포인트가 있는데 왜 `console.log`가 자주 보이나?
- L291: Q2. 로컬 Spring 서버에서 장애가 재현되면 왜 로그보다 중단점이 빠를 수 있나?
- L299: Q3. 운영 JVM에 JDWP를 열어 두면 어떤 위험이 있나?
- L307: Q4. 운영에서 로그와 트레이스는 각각 어떤 질문에 답하나?
- L315: Q5. 운영 이슈의 기본 선택지를 하나만 추천한다면?
- L323: Q6. `println`은 왜 운영 조사에 기본 권장되지 않나?
- L331: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w06`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task117/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
