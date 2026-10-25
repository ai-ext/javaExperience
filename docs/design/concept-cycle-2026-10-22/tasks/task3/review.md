# task3 · P16 독립 감사

기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 원문335줄을 전부 읽고 spec을 먼저 판정했다. **문서 전체는 미완료이며 기존 보충 범위의 값/코드 정확성과 구분한다.**

새 `npm --prefix tools/site run test:p16`는 exit0. UTC 2026-10-21T23:38:12.695642+00:00 ~ 2026-10-21T23:38:17.285802+00:00. 관련 소스/현재 HTML/보관 근거의 전후 SHA가 동일하다. 원시 출력과 해시는 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/test-p16-run.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/test-p16-run.json), [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/test-p16.stdout.txt](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/test-p16.stdout.txt)에 보존했다. Java24/MockMvc11은 과거 근거이며 새 실행이 아니다.

## spec 검토

의미 단위 46개(자가점검의 반복 주제 포함): partial 16, covered 18, missing 10, unrun 2. `covered`는 기존 장면과 값·코드·보관 근거의 한정 정합성 판정이다. 원문 전체 보존이 장면 전체 완료를 뜻하지 않는다.

| 원문 의미 단위 | 줄 | stageIds | 판정 | 공백 |
|---|---:|---|---|---|
| 요약·§1 JSON 값 종류, 직렬화·역직렬화, 엔티티 노출 위험 | [1, 11] | request, response-json | partial | 객체·배열·문자열·수·불리언·null 전체 값 종류 및 엔티티 보안/지연로딩은 전용 장면 없음. |
| §2.1 Member DTO와 canonical constructor/API-저장 모델 분리 | [15, 36] | request, response-object, response-json, creator-record | partial | Member name/email/validation 예제 전용 장면과 엔티티 내부 필드 대비 없음. 주문 예제를 Member 예제 실행으로 오인하면 안 됨. |
| §2.2 converter 선택과 입력/반환 경계 | [38, 49] | request, response-object, response-json | covered | 해당 단위 한정 대조 완료 |
| §2.2 Content-Type 415 및 타입 불일치400 | [50, 51] | request | covered | 해당 단위 한정 대조 완료 |
| §2.3 JsonProperty 외부 이름 쓰기/읽기 | [53, 60] | property-out, property-in | covered | 해당 단위 한정 대조 완료 |
| §2.3 Jackson2/3 annotation namespace 구분 | [62, 62] | property-out | partial | 패키지 이동/호환 예외 전용 장면·컴파일 실패 비교 없음. 현행 공식 문서 재검증 없음. |
| §2.3 전역 SNAKE_CASE 계약과 도입 범위 | [64, 72] |  | missing | 원래 이름·전역 naming·필드 예외를 같은 입력으로 비교하는 장면/실행 근거 필요. |
| §2.4 NON_NULL null/빈 문자열 구분 | [74, 87] | inclusion-null, inclusion-empty | covered | 해당 단위 한정 대조 완료 |
| §2.4 NON_NULL의 숫자0 유지 및 NON_EMPTY 계약 | [87, 87] |  | missing | null/empty/0을 출력 정책별로 비교하고 없음/빈 값 계약의 차이 설명 필요. |
| §2.4 JsonIgnore 읽기/쓰기 및 요청/응답 DTO 분리 | [76, 87] | inclusion-null, inclusion-empty, inclusion-ignore | covered | 해당 단위 한정 대조 완료 |
| §2.5 record 및 명시 creator | [89, 91] | creator-record, creator-explicit | covered | 해당 단위 한정 대조 완료 |
| §2.5 introspection·전역 private 필드 공개 회피 | [91, 91] | creator-explicit | partial | getter/setter/field introspection 비교와 잘못된 전역 공개 사례 없음. |
| §2.6 LocalDate/LocalDateTime/Instant/offset 의미 | [93, 104] | time-instant, time-local, time-offset | covered | 해당 단위 한정 대조 완료 |
| §2.6 JsonFormat 레거시 포맷 | [106, 111] |  | missing | 동일 offset 값을 ISO/레거시 포맷으로 직렬화·복원하는 장면과 실제 근거 필요. |
| §2.6 UTC 저장/전송 및 format과 순간 의미 분리 | [113, 113] | time-offset | partial | 서버 기본 시간대 변경·JsonFormat 설정 전후 동일 순간 검증과 저장 계약은 미실행/장면 없음. DB 실행으로 확장하면 안 됨. |
| §2.7 재정의 없는 Enum 기본 출력 | [115, 123] | enum-default | covered | 해당 단위 한정 대조 완료 |
| §2.7 별도 Enum의 명시 외부 값 | [125, 132] | enum-contract | covered | 해당 단위 한정 대조 완료 |
| §2.7 unknown Enum 거부/UNKNOWN 정책 설계 | [134, 134] | enum-unknown | partial | UNKNOWN 설계/대체의 데이터 손실 대비·검사는 없음. 정확한 exception subtype/원인 경로도 저장 stdout에 없음. |
| §2.8 unknown 기본/명시 strict/DTO 단위 완화 | [136, 145] | unknown-default, unknown-strict, unknown-webhook | covered | 해당 단위 한정 대조 완료 |
| §2.8 필수 입력 검증은 unknown 호환성과 별개 | [138, 145] | unknown-default, unknown-webhook | partial | 누락된 필수 필드/오타를 validation 또는 생성자 정책으로 거부하는 장면·검사 없음. |
| §2.9 엔티티 순환/지연로딩 및 참조 annotation 한계 | [147, 149] |  | missing | Team↔Member 순환, 닫힌 세션, DTO로 경계 끊기와 필요한 ID만 복사하는 장면 및 격리 실행 근거 필요. |
| §3 소개·3.1 Boot4.1.1/Java25 프로젝트와 Gradle/Maven | [151, 184] |  | unrun | 원문 환경의 Gradle Kotlin DSL 앱·의존성 구성·자동 JsonMapper Bean은 이번에도 실행하지 않음. 과거 MockMvc 성공으로 대체 불가. |
| §3.2 주문 DTO/Controller 고정값과200 응답 | [186, 224] | request, response-object, response-json | covered | 원문 Boot 실행을 covered로 판정한 것이 아니라 값/흐름 장면 및 제한된 역사 MockMvc 일치만 판정. |
| §3.2 quantity="two" 입력400 및 본문 미호출 | [224, 224] | request | covered | 해당 단위 한정 대조 완료 |
| §3.3 직접 JsonMapper 원문 Kim29 왕복 | [226, 248] | creator-record | covered | 해당 단위 한정 대조 완료 |
| §3.3 운영 singleton mapper Bean 주입 | [248, 248] |  | missing | 원문 생성 예제와 운영 Bean 소유/재사용 경계를 설명하는 전용 장면/자동구성 근거 없음. |
| §4 치트시트 기능과 주의 전체 | [250, 264] | property-out, inclusion-null, inclusion-ignore, time-instant, unknown-strict, creator-record | partial | Format/Accept/converter Bean 정책 전부를 치트시트 항목별로 완성한 화면은 아님. |
| §4 JacksonComponent custom serializer Bean 등록 | [265, 265] |  | missing | DTO 우선 선택과 custom serializer Bean 개입을 비교하는 장면/실행 근거 필요. |
| §4 Jackson2/3 package·annotations 예외·migration | [267, 267] |  | partial | 각 migration 동작/지원 상태 현행 공식 출처 재확인 및 컴파일 비교 없음. |
| §5 오류1 parse/type/date/Enum 경로·클라이언트 노출 방지 | [269, 271] | request, enum-unknown | partial | malformed JSON·날짜 타입 실패·through reference chain·예외 응답 비노출을 보여 주는 상태/검사 없음. |
| §5 오류2 문자열→객체 creator 불일치 | [273, 273] |  | missing | 문자열 vs 객체 입력·creator 선택의 실패/수정 비교 필요. |
| §5 오류3 InvalidDefinition/no Creators | [275, 275] | creator-explicit | partial | creator 없는 불변 클래스의 실패→명시 creator 수정 전후와 예외 근거 없음. |
| §5 오류4 Infinite recursion | [277, 277] |  | missing | 양방향 graph의 반복값·실패와 DTO 출력 방향/깊이 비교 필요. |
| §5 오류5 LazyInitialization/서비스 트랜잭션 DTO/OSIV | [279, 279] |  | missing | 트랜잭션 종료 전후 관찰 경계·DTO 변환·OSIV 차이의 장면/근거 없음. |
| §5 오류6 415 converter/Content-Type 진단 | [281, 281] | request | covered | 해당 단위 한정 대조 완료 |
| §6 MVC변환 흐름 및 metadata | [283, 285] | request, response-object, response-json, creator-explicit | covered | 해당 단위 한정 대조 완료 |
| §6 Jackson3 Java17/패키지·Boot자동구성/migration | [287, 287] |  | partial | Java17 최소기준/Boot자동구성/지원 라이프사이클은 현행 문서 또는 원문환경 재실행 없음. |
| §6 S05/S06/S09/S03 심화 연결 | [289, 289] |  | partial | 관련 학습 화면 이동/연결/원문 anchor의 실제 브라우저 검증은 메인 미실행 항목. |
| §7 Q1 converter,415vs400 | [291, 296] | request | covered | 해당 단위 한정 대조 완료 |
| §7 Q2 엔티티·JsonBackReference의 한계 | [298, 301] |  | missing | 순환을 끊어도 내부필드/쿼리/지연로딩이 남는 사례 필요. |
| §7 Q3 타입 선택·지역예약·JsonFormat 한계 | [303, 306] | time-instant, time-local, time-offset | partial | 지역 벽시계 예약의 지역/offset 별도 보존 및 JsonFormat의 한계 사례 없음. |
| §7 Q4 unknown 호환성/필수검증/응답 진화 | [308, 311] | unknown-default, unknown-strict, unknown-webhook | partial | 필수 필드 검사와 응답에 새 필드 추가 시 호환성 계약 테스트는 없음. |
| §7 Q5 record/creator/getter 및 mutable setter 선택 | [313, 318] | creator-record, creator-explicit | covered | 해당 단위 한정 대조 완료 |
| §7 Q6 JSON객체 키/배열 순서 | [320, 322] | shape-object, shape-array | covered | 해당 단위 한정 대조 완료 |
| §7 Q6 JsonPropertyOrder 특수 순서 계약 | [323, 324] | shape-object | partial | JsonPropertyOrder 및 정규화/서명/해시의 별도 계약 사례 없음. |
| §8 공식 참고문헌 현재 유효성 | [326, 335] |  | unrun | 외부 web 금지에 따라 현재 링크 접근·버전/사실 재확인은 미실행; 역사 확인을 이번 확인으로 승격하지 않음. |

상세 evidence는 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/source-coverage.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/source-coverage.json)에 단위별로 기록했다. 중요한 남은 범위는 전역 naming, NON_EMPTY/0, 레거시 JsonFormat, 엔티티 순환/지연로딩, creator 실패 진단, JacksonComponent/Bean, 필수입력/응답진화다. 원문 Boot/Java25 환경은 미실행으로 분리했다.

## quality 진단

spec 미통과 상태이므로 quality 전체 승인을 하지 않는다. 검토한 부분에서 critical/important 기술 오류는 발견하지 못했다. 원문 주문 keyboard2/id1 고정값과 추가 Mina7, 원문 Kim29와 ImmutableName Mina, HTTP/mapper/Java시간 비교, 406의 본문 호출 여부를 구분한 구현은 보관 근거와 일치한다.

- **P16-Q1 · minor** — [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-p16-contract-learning.mjs:60](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-p16-contract-learning.mjs:60). 코드 textContent·복사 일치만 검사하고 active index 유효성/실제 mark 구간은 검사하지 않아 강조 누락 회귀가 통과한다. 현재 데이터의 강조가 잘못됐다는 판정은 아니다.
  - 근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/highlight-diagnostic-run.json: property-out.active=[999]를 프로세스 메모리에서만 바꿔 기존 contract test를 import해도 exit0. property-out의 코드3줄 어디에도 mark가 생성되지 않는 변이를 검출하지 못함.
  - 최소 수정: 현재20상태에서 active가 비어 있지 않고 모든 index가 코드 줄 범위 내인지, 생성된 mark의 줄/텍스트가 의도한 코드 구간인지 검사한다. 모든 markup 세부를 고정하지 말고 핵심 의미 줄을 확인한다.
  - 검증: active=[999] 변이는 nonzero가 되고 정상20상태는 통과해야 한다. 앱/원문은 변경하지 않아도 되는 검사 보강이다.

## 직접 열람한 이미지와 캡처

- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/images/P16-unknown-v4.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/images/P16-unknown-v4.jpg) — JPEG 1672×941, 선택 이미지
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/images/P16-creator-v3.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/images/P16-creator-v3.jpg) — JPEG 1672×941, 선택 이미지
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/images/P16-null-v2.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/images/P16-null-v2.jpg) — JPEG 1672×941, 선택 이미지
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/desktop-unknown.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/desktop-unknown.jpg) — JPEG 1672×3776, 과거 full-page 캡처
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/mobile-creator.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/mobile-creator.jpg) — JPEG 360×5592, 과거 full-page 캡처
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/mobile-null.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/mobile-null.jpg) — JPEG 360×5275, 과거 full-page 캡처

선택 그림에서 unknown 기본/strict/DTO 예외, record/불변 creator, int/Integer null의 값·타입 분리가 코드와 일치했다. 과거 desktop은 전체그림과 DOM값/코드를 함께 보여 주며, 과거 mobile은 확대 구간 일부와 가로 이동 안내를 보여 준다. 모바일 상단 번역 overlay도 보인다. 이 관찰은 현재 브라우저 조작 증거가 아니다.

## 미검증 경계

- 새 실제 브라우저 조작·현재 desktop/mobile viewport·overflow·화면별 확대/scroll·복사·원문 anchor는 메인 검증이 남았다. JSDOM은 레이아웃 검증이 아니다.
- 현재 Java/MockMvc/Boot4.1.1/Java25/JPA/DB/소켓 실행은 하지 않았다. 저장된 Java 소스와 stdout의 정합성만 읽고, 새 test:p16은 Node검사다.
- 선택8그림 중3개와 과거16캡처 중3개만 실제 열람했다. 나머지5그림/13캡처의 픽셀 정확성·학습자 이해도는 미검증.
- Enum toString 재정의, unknown/null default의 라이브러리 일반성·현행 공식 출처는 이 감사에서 실행/웹 검증하지 않았다. 버전이 고정된 역사 근거와 현재 UI의 제한 설명을 대조했다.
- 원문 전체135문서/학습자서버17파일 보존 전수 검사는 이 task의 실행 범위가 아니다. npm의 P16 원문SHA·원문DOM baseline 검사는 새로 통과했다.

boundedVerdict: needs_completion
fullDocumentComplete: false
커버리지: 46단위 · partial 16 / covered 18 / missing 10 / unrun 2
이슈수: critical 0 / important 0 / minor 1 (spec 공백 별도)
실제exit: test:p16 0 / 강조검사 진단 0(변이 미검출) / Java·브라우저·DB 미실행
