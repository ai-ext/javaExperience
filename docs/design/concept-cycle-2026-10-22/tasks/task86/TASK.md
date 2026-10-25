# task86: S01 · S01. IoC 컨테이너·DI·빈 생명주기

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md
- 원문 SHA256: `44113a25a6394e51a8a3d94970c2757b020844f864d54fa20ca5cce38e500a5c` / 351줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: IoC/DI와 BeanDefinition·ApplicationContext, Bean 생명주기, scope, extension point, 이벤트 한계
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S01. IoC 컨테이너·DI·빈 생명주기
- L7: 1. 왜 알아야 하나
- L17: 2. 핵심 개념
- L58: 3. 내부 동작·원리
- L60: 컨텍스트 시작과 빈 하나의 생성
- L87: 스코프 프록시는 왜 필요한가
- L97: 생명주기와 종료
- L105: ApplicationEvent
- L111: 4. 코드로 확인
- L115: 예제 1 — 생성자 주입으로 의존성 조립 (미실행)
- L160: 예제 2 — singleton에 request 빈 연결 (미실행)
- L195: 예제 3 — 초기화 콜백과 컨텍스트 이벤트 (미실행)
- L228: 5. 버전별 변화 — 왜 바뀌었나
- L239: 6. 실무 가이드
- L257: 7. 함정·안티패턴
- L274: 8. 자가점검 Q&A (면접 대비)
- L276: Q1. 생성자 주입을 권장하는 근거는 무엇인가?
- L283: Q2. 생성자 순환 참조와 setter 순환 참조의 차이는?
- L290: Q3. singleton에 prototype을 넣으면 매 호출마다 새 인스턴스인가?
- L298: Q4. BeanFactoryPostProcessor와 BeanPostProcessor는 어디에서 갈리는가?
- L306: Q5. 요청 범위 빈을 싱글턴 서비스에 주입할 수 있는 이유는?
- L313: Q6. @Configuration(proxyBeanMethods=false)를 선택하면 무엇을 바꿔야 하나?
- L320: Q7. @PostConstruct와 SmartLifecycle은 어떤 차이가 있는가?
- L328: Q8. ApplicationEvent가 메시지 큐를 대체하는가?
- L335: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s01`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task86/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
