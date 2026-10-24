# 개념·테스트 교육 감사

2026-10-21, 최신 개념 worktree bfe39c1의 현재 파일과 main 기준 파일을 읽고 27주제를 개별 문서로 정리했다. D03 진행중 변경을 수정하지 않았고 빌드·서버·테스트를 실행하지 않았다.

핵심 결론은 **개념 자체의 대규모 부재가 아니라, 실행 진입점·원문과 최신 보강의 정합성·현재 학습자 코드로 옮겨가는 연결의 부족**이다. IoC/DI/Bean/EntityManager/트랜잭션/테스트 대부분은 상당한 설명과 기존 실행근거가 있다. 특히 S08/S09/P20/W11/V04 최신 보강을 제외한 감사는 과도한 공백 판정을 낸다.

- P1: 실제 실습 차단·오학습 가능성·핵심 경계 연결 문제. 즉시 제품 버그라는 뜻은 아니다.
- P2: 설명은 있으나 조건·실무 적용·평가 과제가 약하다.
- P3: 핵심 내용과 실행근거가 충분하며 재제작보다 기존자료 연결·역량 확인을 우선한다.

주제 파일 목록은 이 디렉터리 INDEX.json, 실제 읽기 범위·SHA·main 비교는 SCOPE-MANIFEST.json에 있다. 생성 HTML은 대표 화면의 실제 파일과 보강 데이터/검사코드까지 읽었지만 브라우저 픽셀/조작은 재검증하지 않았다. JSON 전체 hash 계산은 전체 의미 검토와 다르며 read_mode를 구분했다.

우선 처리 대상은 C08 P20 원문 복사 컴파일 및 생성자 치트시트 모순, C09 공유 주입 EntityManager와 실제 컨텍스트의 관계, C14 Transactional import와 readOnly 비교, C19 collection fetch pagination 정확성 대안, C21~C23 외부 practice/starter 참조 및 테스트 원문/보강의 실행 정합성이다.

범위 경고: 현재 main 학습자의 의도적 TODO는 결함이 아니다. 기존실행기록은 이번실행이 아니다. S09의 API maxResults 이상은 이미 기록된 관측이며 원인/upstream 미확인이다. V04 원문 Testcontainers compile-only와 별도 native MySQL/H2/추가 Boot TCP 실행을 합쳐 “원문 모두 통과”라고 할 수 없다.

추가 Java 전이 감사: C25 nullable wrapper/Optional/예외는 이번 learner NPE 실측에 연결, C26 generics/interface/다형성은 현재 Repository 타입계약, C27 Clock/시간/금액은 저장 정밀도와 업무값 의미를 다룬다.

## 병행 작업에 따른 스냅샷 한정

감사 도중 common-learning-foundation worktree가 추가됐다. 여기의 learner NPE·annotation 관찰은 $REPO_ROOT 의 main 스냅샷과 그 격리복사본 기준이며 새 worktree 소스 전체의 상태로 확대하지 않는다. 새 기반 소스 비교·검증은 메인 담당자의 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/common-foundation-comparison.json 및 전체 감사 보고서를 따른다.

최종 추가 관측: common 기반에서는 primitive heart로 main의 NPE가 해소되어 빈 tags POST/목록 GET이200·like=false다. 요청 밖 Entity→DTO는 LazyInitializationException, nonempty tags는 tag.title/기존tag.name 제약 불일치가 재현됐다. C08/C17/C19/C25에 메인의 감사테스트·XML·복사본 소스를 연결했다. source-id로 확인한 일반계약과 환경별 미실행을 구분하도록 기존 보류 문구도 정리했다.
