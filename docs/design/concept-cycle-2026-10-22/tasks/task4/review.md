# task4 · W09 독립 감사

판정은 **needs_completion**, 문서 전체 완료는 **false**다. 기존 6질문·18상태의 제한 범위는 근거와 일치하고 새 JS/생성 HTML 검사는 exit 0이다. 원문 전체 보강은 완료되지 않았다. 현재 구현의 재현 가능한 critical/important/minor 결함은 0/0/0으로 관찰했지만 spec 미완료이므로 quality 승인을 부여하지 않았다.

- 검토자: gpt-6.1-sol / high.
- 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`.
- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W09-why-dto.md (388줄, SHA256 `168007fa2f8a3205c00186c9e96c11dc826aa235baff5076237a07a3997b8468`).
- 실행: `npm --prefix tools/site run test:w09`, UTC 2026-10-21T23:38:19.788482+00:00 ~ 2026-10-21T23:38:22.542498+00:00, exit **0**. 입력 13파일 해시는 실행 전후 같다.

## 1. Spec 검토

원문 1~388줄을 빠짐없이 연속된 50 의미 단위에 배정했다. 범위/근거/장면/남은 작업은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/source-coverage.json에 기록했다. 집계는 `{"partial": 27, "unrun": 1, "covered": 7, "missing": 15}`다. 중복 Q&A도 원문 단위로 대응하므로 이 수치는 학습진척률이나 문서 완료율이 아니다.

covered는 해당 제한 장면과 근거가 대응한다는 뜻이며 이번 Java/DB 재실행을 뜻하지 않는다. missing/partial은 보강 화면의 공백이다. 원문 유실은 아니다. 현재 HTML은 기존 전문15871자·Java9블록·기존id10개를 보존했고 중복id가 없었다.

전체 공백은 다음과 같다.

1. 요청DTO→@Valid→Command, role/ownerId·내부상태의 대량할당 경계. 응답DTO의 allow-list로 요청 안전성까지 검증했다고 볼 수 없다.
2. Controller 반환 뒤 converter, OSIV의 요청 EntityManager와 트랜잭션 수명. 직접 열린 Hibernate Session 실험은 실제 OSIV/HTTP 요청이 아니다.
3. ModelMapper·인터페이스/중첩 projection·MapStruct 의미 오류/미매핑 정책, mapper 선택 기준.
4. 엔티티 필드/스키마 변경과 API계약·버전 호환 분리, @JsonIgnore 이후 남는 위험.
5. Spring Data Repository 경로·생성자/쿼리 오류·정렬/페이지·fetch 대안/실행계획. 원문 단건 JPQL은 직접 Hibernate 실행이다.
6. 신규/레거시/SI/작은팀의 적용 기준·변환 위치·DTO 남발 판단과 자가점검. 국내 사용빈도 근거 한계와 참고문헌 최신성도 새 검증이 아니다.

이미 기존 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/VERIFICATION.md가 이 제한을 명시했다. 기존 부분 보강의 범위 위반으로 판단하지 않고, 전체 원문 완료까지의 남은 작업으로 분리한다.

## 2. Quality 진단 (승인 아님)

실제 구현 결함 finding은 0건이다. 따라서 severity/path/line/evidence/fix/validation을 갖는 결함 행은 만들지 않았다. 파일/줄과 근거가 있는 범위 공백은 source-coverage와 review.json의 remainingWork에 기록했다.

- Entity 직접 직렬화와 DTO: 별도 plainCustomer의 Mina/m@example.com/internal-only가 직접 JSON3필드로 나오는 것과 같은 객체에서 name만 복사한 CustomerPublic JSON1필드를 구분한다. DTO 생성은 권한검사가 아니다.
- lazy: 닫힌 Session 뒤 getter는 LIE·추가ORM0, 별도JDBC는 같은 committed행 관찰, 독립 새 열린Session은 고객 SELECT1이다. 관찰자 SELECT는 ORM계수 밖이다.
- 순환: 열린Session의 전체 Jackson 실행에서 customer/items SQL2 뒤 StreamConstraintsException, 완성 JSON 반환 실패다. 첫3장면은 종단SQL/원문getter로 재구성한 설명이며 getter별 멈춤계측이 아니다. 별도 plain 순환도 기록돼 있다.
- 쿼리: 주문3/서로다른고객3·새Session·batch0·L2off 조건에서 수동4/MapStruct4/목록projection1. 원문 단건projection1과 추가 목록variant를 섞지 않는다. SQL의 ?바인딩은 미기록이며 Java입력 id1과 별개다.
- 상태: seed tx.commit 뒤 관찰하고 직렬화 읽기 실험 종료는 rollback이다. 새로운 쓰기의 flush/commit/rollback 결과를 관측한 실험으로 확대하지 않는다.
- 모델: 원문3엔티티·OrderSummary+수동mapper·MapStruct 추출5파일은 원문과 정확히 일치한다. 실제 생성mapper는 customer getter를 읽는다. ItemList는 별도 pureJava record이며 copyOf는 요소까지 복사하지 않는다.

/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-w09-learning.mjs는 보관된 28PASS/SQL/JSON을 현재18상태와 연결하고 복사·history·키보드·끝포커스·확대/resize를 JSDOM으로 검사한다. /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-w09-generated.mjs는 현재 HTML 전문·코드·id·실제bundle18상태와 이미지6개 크기를 검사한다. 두 검사는 이번 native Java28검사 재실행이 아니다.

## 3. 실제 이미지 열람

`tools.view_image`로 선택 시안6개 전부와 과거 저장캡처3개를 직접 열었다. 모든 파일의 실제 JPEG 헤더·크기·SHA는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/image-html-proof.json에 있다.

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/images/W09-session-v3.jpg — 1671×941, 선택 시안 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/images/W09-serialization-v3.jpg — 1672×941, 선택 시안 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/images/W09-public-contract-v3.jpg — 1672×941, 선택 시안 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/images/W09-query-plan-v2.jpg — 1672×941, 선택 시안 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/images/W09-projection-v4.jpg — 1672×941, 선택 시안 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/images/W09-record-v3.jpg — 1672×941, 선택 시안 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/desktop-serialization.jpg — 1672×2081, 과거 full-page 캡처 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/mobile-projection.jpg — 360×2305, 과거 full-page 캡처 실제 열람.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/w09-2026-10-20/mobile-session.jpg — 360×2468, 과거 full-page 캡처 실제 열람.

선택 그림의 값·SQL계수·순환·생성자 열연결·제한 표시는 현재 data/과거 execution과 일치했다. 모바일 저장캡처2개에는 번역확장 overlay가 있어 일부 그림을 가린다. 이는 사이트 UI 결함으로 간주하지 않는다. 저장화면9개 나머지와 draft12개는 열지 않았다. full-page 캡처 높이를 viewport 높이로 해석하지 않는다. 과거 browser JSON의 PNG 경로는 보존 증거이며 현재 JPG 로드/브라우저 조작을 입증하지 않는다.

## 4. 실행 범위와 한계

현재 브라우저·native Java/Gradle/H2·MySQL·Boot·OSIV·실제HTTP·Java25·Spring Data Repository·외부웹·추가LLM/CLI/에이전트는 실행하지 않았다. 현재 desktop/mobile 조작과 학습자 이해 확인은 메인 검증 관문이다. 원문/실행/그림이 보존됐고 JS 검사가 통과했다는 사실을 전체문서완료로 승격하지 않는다.

원시 stdout: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/test-w09.stdout.txt

원시 stderr: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/test-w09.stderr.txt

실행 UTC/HEAD/소스해시/exit: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task4/test-w09.meta.json

boundedVerdict: needs_completion
fullDocumentComplete: false
coverage: 50 units; partial=27, unrun=1, covered=7, missing=15
issues: implementation critical=0 important=0 minor=0; whole-document work groups=6; current-browser gate=1
actualExit: test:w09=0; nativeJavaDB=unrun; currentBrowser=unrun
