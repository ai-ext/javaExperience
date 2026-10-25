# task2 · P04 독립 검토

판정: **needs_completion**. `fullDocumentComplete=false`. 기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 리뷰 모델 gpt-6.1-sol/high.

## 1. Spec 검토

원문328줄을 30개 의미 단위로 나눠 현재14질문48상태와 대응했다. covered 12, partial 14, missing 0, unrun 4. covered는 해당 설명의 제한 판정이며 실행·브라우저·문서 전체 완료를 뜻하지 않는다.

| 원문 절·라인 | 실제 stage IDs | 판정·근거·공백 |
|---|---|---|
| §1 생성자·factory·Builder·주입의 역할 · 7-11 | factory-call, builder-built, injection-generator | partial — tools/site/p04-lesson-data.mjs:491-515,555-559에 각각 생성 경로가 있으나 역할 선택 비교는 원문 details에 남음. **공백:** 같은 요구에 생성자/factory/Builder 중 무엇을 고를지 판단하는 비교 장면 없음. |
| §2-1 기본 생성자와 this 위임 · 15-22 | default-implicit, default-missing, default-explicit | covered — tools/site/p04-lesson-data.mjs:528-531; Constructor.verification.json의 긍정2개·MissingNoArg 거부; User에 없는 name 필드를 발명하지 않음. |
| §2-2 초기화 순서와 생성자 override 위험 · 24 | init-1, init-2, init-3, init-4, init-5, init-6, init-7, override-parent, override-ready | covered — tools/site/p04-lesson-data.mjs:467-491,533-535; CreationDemo stdout7줄과 P04ConstructorProof.java:5-24 대조. 필드 스냅샷은 완료 뒤 모델이며 stdout 발생 순간 계측이 아님. |
| §2-2 Java25 생성자 전처리 · 24 | java21-reject, java25-described | unrun — tools/site/p04-lesson-data.mjs:565-567; Constructor.verification.json은 JDK21 거부만 기록. **공백:** Java25 컴파일·실행 없음. Java25 허용 설명은 원문에 귀속하며 최신 공식 출처 재조회도 안 함. |
| §2-3 final과 방어 복사 · 26-30 | copy-before, copy-late, copy-rebuild | covered — tools/site/p04-lesson-data.mjs:505-508; P04StateProof.java:18-23의 기존 Order 유지/다음 Order 변경과 일치. List.copyOf는 얕은 구조 복사로 서술. |
| §2-4 of/from 관례·캐시·하위 타입 반환 · 32 | factory-call, factory-validated, factory-return | partial — tools/site/p04-lesson-data.mjs:492-495는 Order.of의 새 Order 생성만 모델링. 모든 factory가 새 할당이라는 일반화는 note에서 금지. **공백:** from 변환 입력, 캐시 재사용, 하위 타입 반환의 이름·값·반환 정체성 비교 없음. |
| §2-5 Builder와 단순 생성자 선택 · 34-38 | builder-empty, builder-id, builder-quantity, builder-tag, builder-built, builder-invalid | partial — tools/site/p04-lesson-data.mjs:497-503은 같은 Builder와 build 검증을 명확히 구분. **공백:** telescoping/위치 인자 오류와 단순 생성자·factory가 나은 경우의 판단 장면 없음. |
| §2-6 Lombok Builder.Default와 생성자 대상 · 40 | builder-default-plain, builder-default-omitted, builder-default-explicit, builder-target-mismatch, builder-target-constructor | covered — tools/site/p04-lesson-data.mjs:542-549; P04LombokProof.java:17-26,44-53 및 Constructor.verification의 ExplicitBuilder 실패 대조. |
| §2-7 Lombok 생성자 포함 필드·force · 42 | lombok-required, lombok-allargs, lombok-null, force-definition, force-result | covered — tools/site/p04-lesson-data.mjs:537-553; P04LombokProof.java:9-20,35-49. initialized final/static 제외와 final의 null 허용을 원문 축약보다 정확히 설명. |
| §2-8 단일 생성자 주입과 DTO/Entity 분리 · 44-49 | injection-generator, injection-service, dto-record, entity-rule | partial — tools/site/p04-lesson-data.mjs:555-563. Spring7 독립 컨텍스트 단일 생성자/동일성은 기존 실행근거가 있고 Entity는 상징적 타입. **공백:** Spring4.3 도입 시점은 원문 출처 설명만 보존. Entity 공급자 생성 동작은 미실행. |
| §3-1 Boot 의존성·도구체인·의존성 트리 · 53-73 | 없음 | unrun — 현재 HTML 원문 details에 Gradle Kotlin 코드와 확인 명령 보존. 14개 lesson 중 Boot setup stage 없음. **공백:** Boot4.1.1/Java25 초기화, Gradle/Maven 의존성 확인 미실행. 독립 Spring 컨텍스트로 대체 완료하지 않음. |
| §3-2 OrdersApplication과 원문 Bean/record 4파일 · 75-127 | injection-generator, injection-service, dto-record | partial — static-crosscheck.json: OrderRequest/OrderIdGenerator/OrderService/OrderController 추출본6개 중 해당4개 원문 byte 일치. P04SpringProof.java:17-38은 독립 명시 등록. **공백:** OrdersApplication/Boot 자동구성·component scanning 실행과 원문 compileJava/IDE 확인 없음. |
| §3-3 Controller API·HTTP 정상/실패 · 129-154 | injection-direct-call, dto-record | unrun — tools/site/p04-lesson-data.mjs:558은 HTTP 아님을 명시; dto-record는 직접 record 생성 거부만 확인. **공백:** bootRun/curl/JSON 역직렬화·응답·4xx 매핑은 실행하지 않았고 대응 조작 장면 없음. |
| §3-4 CreationDemo 전체 · 156-213 | init-1, init-2, init-3, init-4, init-5, init-6, init-7, factory-call, factory-validated, factory-return, builder-empty, builder-id, builder-quantity, builder-tag, builder-built | covered — static-crosscheck.json: 원문 CreationDemo.java 추출본 byte 일치, stdout9줄 원문 exact 일치. fresh test는 이 역사 stdout을 읽어 대조. 초기화7줄 뒤 ORD-1/2 값이 분리됨. |
| §3-5 RequestDemo·compact constructor 필드 시점 · 215-244 | record-input, record-email, record-name, record-validated, record-fields, record-bad | covered — static-crosscheck.json: RequestDemo source/stdout exact 일치. lesson-data:510-516에서 매개변수와 암시적 필드 대입·첫 예외 뒤 검사 미도달 분리. |
| §4 치트시트와 기본 선택 기준 · 246-260 | default-explicit, factory-call, builder-built, builder-default-omitted, lombok-required, lombok-allargs, force-result, record-fields, injection-generator | partial — 대부분 생성 API는 위 stage로 연결. 표 원문 전체는 현재 HTML details에 보존. **공백:** 복수 Bean 후보 @Qualifier 선택 장면과 생성 API 선택 비교 없음. |
| §5-1 기본 생성자 없음 오류 · 264 | default-missing, default-explicit | covered — tools/site/p04-lesson-data.mjs:530-531; Constructor.verification.json MissingNoArg diagnostic과 this guest 경로 대조. |
| §5-2 final 미초기화 오류 · 265 | default-explicit | partial — tools/site/p04-lesson-data.mjs:528 note에서 MissingFinal 거부를 언급하며 Constructor.verification.json에 실제 diagnostic 존재. **공백:** 별도 final 선언의 실패 경로/this 위임 후 대입 성공을 직접 비교하는 장면 없음. 현재 User에는 해당 필드가 없으므로 같은 예제로 오인하지 않아야 함. |
| §5-3 Builder 기본값 오류 · 266 | builder-default-plain, builder-default-omitted, builder-default-explicit | partial — tools/site/p04-lesson-data.mjs:543-545에서 Lombok 0/20/7이 실제 fixture와 일치. **공백:** 원문의 수동 Builder 필드 기본값/build 기본값 두 해결 경로는 별도 비교 없음. |
| §5-4 무인자 생성자와 final 충돌 · 267 | force-definition, force-result | partial — tools/site/p04-lesson-data.mjs:551-553은 force=true의 null/0 생성과 불변식 우회 위험을 표현. **공백:** force 없는 NoArgsConstructor의 컴파일 실패/안전한 생성 경로 비교는 없음. |
| §5-5 Entity 무인자 생성자 오류 · 268 | entity-rule | unrun — tools/site/p04-lesson-data.mjs:563은 public/protected 규칙과 상징적 Entity()만 표시하며 JPA 미실행 명시. **공백:** 공급자가 실패하는 실제 Entity와 protected 수정 성공은 미실행. 임의 SQL/행을 만들지 않음. |
| §6 생성 불변식·미완성 Builder · 270-274 | factory-validated, builder-empty, builder-built, builder-invalid, builder-target-constructor | covered — tools/site/p04-lesson-data.mjs:494,498-503,549는 생성자 검증 경로와 미완성 Builder/유효한 Order를 구분. |
| §6 Java 기능 이력·관련 개념 경계 · 276-278 | record-fields, java25-described | partial — record/Java25 기능 설명과 S01/J02/J05 연결 원문이 HTML에 보존. Java25 note는 실행 확대를 막음. **공백:** record14·15/Java22~24 preview 이력은 원문 산문에만 있으며 Java25는 미실행. |
| §7 Q1 기본 생성자·this/super · 282-286 | default-implicit, default-missing, default-explicit, init-1, java21-reject, java25-described | covered — 해당 선언·위임 경로·JDK21 거부/Java25 원문 설명의 경계로 답을 찾을 수 있음. Java25 실행 완료를 뜻하지 않음. |
| §7 Q2 factory/Builder 선택·컴파일 보장 · 288-292 | factory-call, builder-built, builder-invalid | partial — 필수값 검사는 build→constructor의 런타임 경로로 나타남. **공백:** 선택 질문의 of/from/단순 생성자 판단은 독립 사례 없이 원문 답안에 남음. |
| §7 Q3 final·가변 요소 · 294-298 | copy-before, copy-late, copy-rebuild | partial — tools/site/p04-lesson-data.mjs:505 note에서 요소까지 복제하지 않는다고 정확히 설명. **공백:** 실제 가변 요소 내부 상태가 함께 변하는 사례나 내부 참조 반환 문제의 장면·추가 로그 없음. 기존 String tags 실험은 구조 분리만 증명. |
| §7 Q4 생성자 주입·가짜 협력자·책임 분할 · 300-304 | injection-generator, injection-service, injection-missing | partial — 동일성/의존성 누락은 독립 Spring 컨텍스트 역사 근거와 대조됨. **공백:** 컨테이너 없는 fake 협력자 주입, 필드 주입 대비 시그니처 차이, 과도한 의존성과 책임 분할의 판단 장면 없음. |
| §7 Q5 Lombok 생성자 차이 · 306-310 | lombok-required, lombok-allargs, lombok-null, force-result | covered — P04LombokProof.java:9-20,35-49의 실제 시그니처/값/예외가 stage와 맞음. final 초기식 제외도 표시. |
| §7 Q6 DTO/Entity와 Java16 record · 312-316 | dto-record, entity-rule, record-fields | partial — record 생성 검증과 Entity 규칙 설명 분리. Java16/JEP395 정보는 원문 details에 있음. **공백:** Entity 실증 미실행. 요청 DTO를 Entity에 직접 바인딩하지 않는 역할 차이를 값 흐름으로 보여 주지는 않음. |
| §8 참고문헌 · 318-328 | 없음 | covered — 현재 HTML 원문 details의 외부 URL9개가 원문 참고문헌과 일치; current-html-inspection.json에 기록. **공백:** 새 웹 검증을 하지 않았으므로 문헌의 현재 내용·지원 버전 확정 근거로 쓰지 않음. |

## 2. Quality 진단 — Spec 완료 전 승인하지 않음

현재 구현의 확정 결함: Critical 0 / Important 0 / Minor 0. 아래 관찰은 제한 범위의 진단이며 quality 승인으로 간주하지 않는다.

- 제한된 검토에서 재현되거나 코드로 입증된 현재 구현 결함은 찾지 못했다. 범위 공백과 선언된 미실행은 specReview/remainingWork에 별도 기록하며 quality 승인으로 우회하지 않는다.
- 초기화의 stdout은 역사 raw이며 각 완료 뒤 marker 값은 소스에서 추론한 설명 모델이다. 그림 footer에도 이 구분이 있다.
- this 위임과 super 경로, factory의 빈 tags/검증 전후, mutable Builder same this/별도 Order, record 정규화/첫 예외 뒤 미도달, DI 참조 동일성/독립 실패를 구분한다.
- Lombok AllArgs의 initialized final/static 제외를 실제 fixture에 맞춰 바로잡아 설명한다. final 자체가 null을 막는다고 쓰지 않는다.
- fresh npm 테스트는 JSDOM/파일 fixture 대조이며 Java/Lombok/Spring을 재컴파일하지 않는다. test-p04-learning:55에서 focus를 단위테스트용으로 치환하므로 실제 시각 crop 검증으로 일반화하지 않는다.
- 과거 mobile record 캡처에 번역 확장 overlay가 있어 일부 그림을 가린다. browser-special-checks.json:14에도 명시되어 있으며 제품 결함으로 단정하지 않는다.

## 3. 직접 연 이미지·캡처

선정 원본2장과 과거캡처2장을 `view_image`로 직접 보았다. 나머지15선정원본/32캡처는 육안 미열람이다.

- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p04-2026-10-20/images/P04-initialization-v2.jpg`: 한 Child, this delegated→implicit super, 7개 완료 체크포인트; Parent/Child marker 분리 및 field values inferred from source 문구. 관찰한 stdout와 추론한 필드 값을 구분하며 현재 데이터와 내용 일치. 한계: 선정 이미지 원본2장 중1장 육안 확인; 나머지 이미지의 정확성으로 일반화하지 않음.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p04-2026-10-20/images/P04-constructor-injection-v4.jpg`: Controller C1→Service S1→Generator G1 참조, 명시등록3 Bean, 네 원문 소스, 직접Java Mina/2/UUID, noBoot/noHTTP/noJPA. 실제 필드 및 같은 참조 방향·비고정UUID 표현이 fixture와 일치. 한계: 실제 컨테이너 재실행·HTTP 검증 아님.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p04-2026-10-20/mobile-P04-record-v5.jpg`: 360px full-page, record-input 첫 장면, 매개변수 공백·필드 저장 전 값/코드. 현재 모델 텍스트와 일치. Translate/Dual/Settings 번역 확장 overlay가 그림 일부를 가림.. 한계: 과거 캡처이며 viewport 실제 새 조작 확인 아님. overlay 아래 픽셀은 판독 불가.
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p04-2026-10-20/desktop-P04-constructor-injection-v4.jpg`: desktop full-page, injection-generator, 전체그림 및 G1 동일성 값과 등록 코드. 원본 그림과 DOM 값/코드/한계 문구 연결 확인.. 한계: 과거 캡처이며 현재 브라우저 재검증 아님; 축소 표시로 미세 글꼴/픽셀 정밀 비교 불가.

## 4. 새 검사와 역사 실행 근거

`npm --prefix tools/site run test:p04` → exit 0. 시작 UTC 2026-10-21T23:33:18.303793+00:00, 종료 UTC 2026-10-21T23:33:21.163034+00:00. 14질문48상태·원문13,775자·코드15개·앵커14개·이미지17개 검사를 통과했다. 실행 전후 관련9파일의 SHA256은 같다. raw stdout/stderr와 HEAD/해시는 같은 폴더의 harness 파일에 보존했다.

추가 정적 대조는 exit 0: CreationDemo/RequestDemo 및 Spring 원문4파일의 추출본 byte 일치, 두 원문 stdout exact 일치, 선정17개 asset-review 해시/JPEG헤더 일치. 현재 HTML의14 topic option·원문14 summary·9개 참고문헌·bundle 경로도 직접 파싱해 기록했다. 이는 Java나 실제 브라우저 실행이 아니다.

- docs/design/p04-2026-10-20/source-proof/execution.json: 원문 CreationDemo/RequestDemo JDK21 stdout exact. 현재 원문·추출파일·기록 stdout의 정적 일치 재확인.
- docs/design/p04-2026-10-20/source-proof/P04StateProof.java: 15개 assertion + counter sanity. Builder identity/copy/record rejects; stdout labels are verification labels, not arbitrary source output.
- docs/design/p04-2026-10-20/source-proof/Constructor.verification.json: JDK21 컴파일 거부4/긍정2, override3 raw/source 연결. 이번에 native Java 재실행 안 함.
- docs/design/p04-2026-10-20/source-proof/Lombok.verification.json: Lombok1.18.46/JDK21 12검사 역사 기록·소스·stdout 연결. jar runtime 재검증 안 함.
- docs/design/p04-2026-10-20/source-proof/Spring.verification.json: 독립 Spring7.0.9 명시등록3 Bean, source4개, 직접Java create, UUID 형식9검사. HTTP/Boot 자동구성 아님.
- docs/design/p04-2026-10-20/source-proof/Spring.stderr.txt: outer UnsatisfiedDependencyException 문구 관찰, fixture cause-chain check는 NoSuchBeanDefinitionException 확인. 기록은 역사 관찰.

미실행: 이번 감사에서 native Java/Lombok/Spring 재컴파일·실행 없음. / Boot4.1.1/Java25·HTTP/curl·JPA/DB/SQL/flush/commit/rollback·외부DB클라이언트 관찰 없음. 이 문서의 기존근거에도 미실행으로 표시됨. / 현재 실제 브라우저 조작·17이미지/34캡처 전수 육안검수·학습자 이해도 없음.

## 5. 남은 일

- C1 [coverage_gap]: Boot 의존성/OrdersApplication/HTTP 요청·응답 실습의 현재 상태를 원문 범위에 맞게 보강. 현재는 unrun으로 유지. 확인: Boot·HTTP 실행을 새로 승인된 범위에서 수행하면 실제 raw/환경/응답을 보존. 미실행이면 화면도 그 경계 유지.
- C2 [coverage_gap]: 생성자/factory/Builder 선택, from·캐시·하위 타입 반환, qualifier·fake 주입·책임 분할의 원문 개념을 범위에 맞춰 단계화. 확인: 각 의미 단위↔stageIds를 연결하고 입력·코드·반환 값/참조·출처가 독립 검사에 일치.
- C3 [coverage_gap]: final 미초기화, force 없는 NoArgs 실패, 수동 Builder 기본값 해결 등 원문 오류·해결 경로를 비교 장면으로 보강. 확인: 기존 raw에 있는 것과 새 실험을 분리; 실패/성공 조건을 각각 검증.
- C4 [declared_unexecuted]: Java25/Entity는 현재 미실행 경계를 유지하고 전체 완료 판정에서 제외. 전체 실증이 필요하면 별도 안전한 검증 계획을 메인에서 결정. 확인: 기존 JDK21·독립Spring 증거를 Java25·JPA 실행으로 승격하지 않음.
- C5 [verification_gap]: 메인이 현재 desktop/mobile 브라우저 검증과 필요한 시각 재촬영 수행. 번역 overlay 없는 record 모바일 캡처 확보. 확인: 선정 원본↔같은viewport 실제 캡처 비교, 주제/단계/확대/가로이동/복사/원문/넘침 확인. 본 리뷰가 이를 수행했다고 표기하지 않음.

원문·application·기존 증거·장부·Git은 변경하지 않았다. 새 웹/외부CLI/LLM/추가 에이전트/브라우저/native Java/DB/서비스 실행도 하지 않았다. 테스트 통과와 제한 범위의 정확성은 전체 문서 완료를 대신하지 않는다.
