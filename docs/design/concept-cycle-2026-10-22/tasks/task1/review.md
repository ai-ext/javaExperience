# task1 · P09 독립 검토

- 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`
- 판정: **needs_completion / fullDocumentComplete=false**. 현재 보강에서 critical 0·important 0·minor 2. spec 전체 완료 미충족으로 quality 최종 승인은 부여하지 않는다.
- 원문 489줄 전문을 대조했다. 20주제·84상태 연결과 Java 핵심 설명은 대체로 일치하지만 부분 보강을 전체 문서 완료로 계산하지 않는다.

## 1. spec: 원문 의미 단위 대조

`covered`는 현재 상태 모델의 의미·값·코드가 원문/저장 근거와 맞는다는 뜻이다. 새 브라우저나 전수 이미지 승인, 새 JVM 실행을 뜻하지 않는다. `partial`은 보존만 되었거나 일부 의미가 상태로 풀리지 않은 항목, `unrun`은 원문의 실행 검증이 이번에도 미실행인 항목이다. 원문을 접기에 보존한 사실과 새 교구로 설명한 범위를 구분했다.

| 원문 절·줄 | stageIds | 판정 | 근거·남은 범위 |
|---|---|---|---|
| 서두·§1 클래스 상태/동작·값 전달 [1, 9] | constructor-declaration, fields, signature-parts, mutation-copy | covered | 필드·생성자·반환 타입·참조값 복사를 각 모델에서 설명하며 원문 서두도 HTML에 보존. covered는 의미 모델 대조 판정이며 전수 화면 승인 아님.  |
| §2.1 소스 파일·패키지·import [13, 23] | package, import, filename | covered | data23~28: 경로·전체 타입명·짧은 import명·공개 클래스 파일명 연결. WrongFilename 역사 javac 거부 진단 존재. 이름 없는 패키지는 원문 접기에만 남음. |
| §2.2 클래스 구성·생성자 [25, 36] | constructor-declaration, constructor-parameter, constructor-assignment | covered | data32~37: 반환 타입 없는 생성자, 직접 생성자 선언 시 자동 no-arg 없음, this.number/number 분리. 고정 Invoice number 미지정 명시. 멤버 배치 관례는 원문 보존 중심. |
| §2.3 변수 종류·기본값·스코프 [38, 55] | fields, local, scope-end, array-defaults | partial | retryCount=0·issuedCount=0·attempt=1/블록 종료, int/boolean/String 배열 기본값 0/false/null 확인 모델. 객체별 필드와 클래스 공유 필드를 두 객체로 비교하거나 요청 상태를 static에 둘 때의 문제는 별도 상태 없음. 기본 규칙은 설명됨. |
| §2.4 메서드 선언 해부 [57, 65] | signature-parts, return | covered | data54~55: 접근·반환·이름·매개변수·throws·반환식의 타입. 미지정 total/rate에 숫자 생성 안 함.  |
| §2.5 호출·this·return [67, 74] | instance-call, class-qualified-call, implicit-this, constructor-assignment, void-early, overdue-return | covered | 객체 수신자/클래스 한정자/같은 this 호출 구분, void 두 경로와 boolean 반환식 설명. 구현 없는 total()/parse(...)는 문법 예제로 명시.  |
| §2.6 접근 제어 [76, 87] | access-private, access-package, access-protected, access-public | covered | data154~157: 원문 표와 protected 다른 패키지 수신자 제약, private 중첩 포함을 보완. 역사 verification.json에 같은 패키지·Sub 수신자 허용/다른 패키지 Base 수신자 거부 진단. 공식문헌은 이번 재접속하지 않음. |
| §2.7 캡슐화·getter/setter [89, 100] | quantity-read, quantity-reject, quantity-accept | covered | 추가값3→거부-1이면3유지→허용2. P09StateProof.java24~30,50~55와 stdout 대조; 원문 수치 아님 명시.  |
| §2.7 final [102, 102] | final-reference, final-mutable, final-members | covered | 참조 재대입 금지와 같은 객체의 필드 변경 구분. final 클래스/메서드 거부 역사 javac 케이스 존재.  |
| §2.8 오버로딩 [104, 111] | format-one, format-inner, format-repeat, error-return | covered | format(String) vs format(String,int), 동일 this 내부 호출 후 repeat. 반환 타입/매개변수 이름만 다르면 중복 선언 오류의 역사 진단 존재. find(long)/find(String) 원문은 접기 보존; 동등한 format 예제로 의미 보강. |
| §2.8 varargs·sum·선택되는 시그니처 [113, 123] | varargs-values, varargs-array, varargs-empty | partial | 인자 one/two→배열 원소, 배열 전달,0개 호출을 모델·MethodsProbe 역사 stdout과 대조. int sum 누적과 varargs가 다른 오버로드와 겹칠 때의 선택은 상태 없음. 원문 보존뿐. |
| §2.9 항상 값 전달 [125, 127] | mutation-before, mutation-copy, mutation-write, mutation-return, reassignment-before, reassignment-local, reassignment-return, primitive-before, primitive-assignment, primitive-return | covered | A Ada→Grace와 두 번째 호출의 A Grace 유지/B Local only 분리. 숫자 복사1→매개변수99→호출자1. 역사 원문 stdout·추가 실행 코드와 일치.  |
| §2.10 main [129, 135] | main-entry, main-args | covered | static/void/args String[]·SpringApplication.run 전달 설명; 고정 인자 없음.  |
| 연산자 표: 산술·크기/동등 비교 [137, 150] | subtotal, discounted, eligible, string-identity, boolean-condition | covered | 3600/3240,quantity>=3·discounted>=3000,별도new String identity false/content true. 숫자 조건 컴파일 실패 진단 존재.  |
| 연산자 표: 부호·증감·논리/비트 [143, 148] | postfix, prefix, postfix-decrement, prefix-decrement, unary-plus, unary-minus, not-false, not-true, bitwise, and, or, boolean-and | partial | ++,-- 식결과/저장값,!,int6&3=2·&#124;=7·^=5, boolean& 양쪽평가. 추가값/독립초기값 구분. boolean &#124;·^는 설명만 있고 별도 실행 상태 없음. 모든 표의 연산자 조합을 전수 실습한 것은 아님. |
| 정수 나눗셈·0·overflow·금액 [152, 152] | division-mod, zero-division, overflow, decimal | covered | 7/3=2,7%3=1,0분모 ArithmeticException,MAX+1=MIN, double0.30000000000000004와 문자열 BigDecimal0.3. 원문 규칙/추가값 구분. UI 출처는 잘못 155줄을 가리킴: P09-M1. |
| 우선순위·결합·연쇄 비교 [154, 167] | precedence, left-to-right, logical-grouping, boolean-condition, eligible | partial | 2+3*4=14,10+6/2*3=19,a&#124;&#124;b&&c vs 괄호 true/false,연쇄 비교 javac 거부 대조. 전체 우선순위 표의 삼항/대입 묶음 등은 원문 보존 중심. |
| 단락 평가·가드·부수효과 [169, 173] | and, or, boolean-and, zero-guard | partial | calls0/0/1·safe=false/RHS미평가와 boolean&실행을 구분. user!=null&&user.isActive()의 null 가드와 필수 부수효과를 RHS에 두는 실패 사례는 별도 상태 없음. |
| OperatorsDemo 전체 코드/출력 [175, 212] | subtotal, discounted, precedence, left-to-right, eligible, zero-guard, and, or, boolean-and | covered | 원문코드와 저장된 OperatorsDemo.java 바이트 일치, stdout 전체 일치(이번은 읽기 비교). 상태값과 원문 기대값 대조.  |
| §3 실습 환경 경계 [217, 219] | main-setup, greeting-json | unrun | Boot4.1.1·Java25 HTTP 미실행과 순수Java JDK21 역사 실행을 분리. Spring/Java25를 새 실행하지 않음. 모델을 실행 관측으로 승격 불가. |
| §3 단계1 프로젝트·Gradle/Maven 설정 [221, 266] | main-setup | partial | syntax-demo·Boot4.1.1·Java25·bootRun 요약;원문 Gradle 전체 및 Maven 설명 HTML 보존. 디렉터리→설정파일→도구확인→의존성 준비의 단계별 상태/실행결과 없음. Wrapper/compile/실행 준비를 요약만으로 완료 판정 불가. |
| §3 단계2 Spring 시작 [268, 286] | main-entry, main-args, main-setup | unrun | main 코드의 run 인자와 static 경계는 설명. 실제 Boot 시작/로그·Gradle/Maven run 미실행. |
| §3 단계3 Controller→지역값→모델 [288, 329] | greet-entry, normalized, greeting-constructor, greeting-return | covered | Ada→trim결과Ada→Hello, Ada 생성자매개변수/this.message→getter. HTTP 미실행 모델임 명시. 원문 Java25/Boot 컴파일 미실행. covered는 예상 데이터 흐름 설명 범위. |
| §3 단계4 HTTP·404·빈 JSON [331, 345] | greeting-json | unrun | 예상 JSON 정확하고 stage에 HTTP 미실행·DB없음 표시. HTTP 실측,404 경로/annotation 오류,빈JSON/getter 진단 상태·재현 없음. |
| §3 PassByValueDemo 원문 실행 [347, 376] | mutation-before, mutation-copy, mutation-write, mutation-return, reassignment-before, reassignment-local, reassignment-return, primitive-before, primitive-assignment, primitive-return | covered | source-proof 원문Java·stdout3줄 정확 일치. P09StateProof는 다른 추가계측임 구분. A/B는 주소 아님·GC시점 미지정.  |
| §3 MethodsDemo 원문 실행 [378, 411] | methods-create, format-one, format-inner, format-repeat, static-call, varargs-values | covered | prefix끝공백/created=1/중첩format 및 repeat 문자열 끝공백 보존. 저장된 원문Java·stdout 바이트 대조,MethodsProbe 추가6출력 대조.  |
| §4 치트시트 [413, 426] | package, fields, static-call, constructor-declaration, return, access-public, format-inner, varargs-values, constructor-assignment, main-entry | partial | 각 개념의 상태는 존재하며 원문 표11행은 보존 검사에 포함. 통합 치트시트를 요약/선택/연결하는 별도 상태는 없고 원문 접기에서만 그대로 읽음. |
| §5 오류1 파일명 [430, 430] | filename, error-symbol | covered | WrongFilename 역사 javac 거부와 Invoice.java 필요파일명 안내.  |
| §5 오류2 cannot find symbol [431, 431] | error-symbol | partial | 이름→import→시그니처 확인 안내는 있음. 실제 error-symbol 코드는 정상 Invoice 선언. 누락심볼/잘못된import·인자 오류의 실패→수정 대비와 역사 javac 재현은 없음. |
| §5 오류3 static 문맥 [432, 432] | error-static, class-qualified-call | covered | static Object value(){return this;}와 non-static 진단,객체수신자 해결방향. 역사 StaticThis stderr 일치.  |
| §5 오류4 반환 누락·반환타입 불일치 [433, 433] | error-return, return, void-early | partial | enabled=false 정상종료에 return없음·missing return 역사 진단 존재. incompatible types 반환타입 불일치의 별도 실패/수정 예시는 없음. |
| §5 오류5 지역 미초기화 [434, 434] | error-local | covered | int x;return x;→거부 진단,읽기 전 모든경로 대입 설명.  |
| §5 오류7 재할당 오해 [435, 435] | reassignment-local, reassignment-return, return-reference-before, return-reference-assignment | covered | 같은객체 필드변경 vs 매개변수대입/반환값을 호출자변수에 대입 분리. normalize는 별도예시 명시.  |
| §6 한 단계 더 [437, 441] | signature-parts, fields, access-public, implicit-this, static-call | partial | 선언읽기/소유자/인자/this 관련 모델 연결. P02/P11/J02/J05/J03 기존원문 링크 보존. 타입/상속/동등성 후속자료는 원문 링크 접근만이며 이 문서 보강 상태에 통합하지 않음. |
| §7 Q1 초기화와 참조 null [445, 449] | fields, local, scope-end, array-defaults, error-local | covered | 필드0/false/null과 지역명시대입 구별,참조null은 문자열아님 명시.  |
| §7 Q2 값 전달·새객체 반환 [451, 455] | mutation-copy, mutation-write, reassignment-local, reassignment-return, return-reference-before, return-reference-assignment | covered | A/B분리·호출자대입의 각기다른 결과 설명.  |
| §7 Q3 반환타입/매개변수이름 [457, 461] | format-inner, error-return | covered | 정상format오버로드·ReturnOnlyOverload/ParameterNameOnly 역사 중복진단. 다만 QA 자체는 원문 접기.  |
| §7 Q4 static this/인스턴스호출 [463, 467] | static-call, class-qualified-call, error-static | covered | this없음·obj.method 해결방향의 모델. Q&A는 원문 접기.  |
| §7 Q5 캡슐화 [469, 473] | quantity-read, quantity-reject, quantity-accept | covered | 거부경로가 필드값3 보존하며 허용규칙/불필요 setter 지양 설명. Q&A는 원문 접기.  |
| §7 Q7 varargs [475, 479] | varargs-values, varargs-array, varargs-empty | partial | 0개·개별·배열,마지막매개변수 규칙/VarargsPosition 역사 거부진단. 다른 오버로드가 겹칠때 실제 시그니처 선택은 별도예시 없음. 원문의 Q6 누락을 임의수정 안 함. |
| §8 참고문헌 [481, 489] | 없음 | partial | 현재HTML 원문외부링크9개 존재;참고문헌 원문보존 검사는통과. 이번 검토는 외부URL에재접속하지 않아 현행내용/지원여부미확인. 참고문헌만으로 미실행코드승인불가. |

의미 단위 41건 분류: {'covered': 26, 'partial': 12, 'unrun': 3}. 이를 문서 완료율로 계산하지 않는다.

## 2. quality: 현재 보강 진단

### P09-M1 · minor · numeric-boundary의 원문 출처가 155줄로 표시되지만 해당 원문155줄은 빈 줄이며 정수/금액 경계 설명은152줄이다.
- 위치: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-lesson-data.mjs:210
- 재현 근거: data210 source=§2 연산 보강 · 원문 155줄. 원문152에 정수나눗셈·0·overflow·BigDecimal 설명,155 빈줄. questions.json1916도155 사용.
- 최소 수정: 원문은 보존하고 lesson 출처와 현재 질문 메타데이터를152줄로 교정한다. 과거 생성/실행 이력은 덮어쓰지 않는다.
- 검증 조건: numeric-boundary 선택 시출처152줄 표시, static source line 대조·기존 test:p09 통과 및 메인브라우저확인.

### P09-M2 · minor · 질문별 imageEvidence 검사는 배열길이만 확인하여 현행근거로 따라갈수없는 PNG경로를 놓친다. 현재 questions의 imageEvidence79항목(고유44경로)이 모두 미존재 PNG다.
- 위치: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/test-p09-coverage.mjs:27
- 재현 근거: task1/static-evidence.json 실측. 예questions.json1150 P09-06.png부재;실제렌더러와asset-review는JPG. asset-review45개현재파일/해시는모두일치해제품이미지깨짐은아님. 역사browser이미지경로PNG는당시관측이므로보존해야함.
- 최소 수정: 기존역사PNG근거는유지하고질문마다currentImageEvidence또는변환manifest/assetID기반해결을명시한다. coverage검사는현재파일/변환연결존재를검증한다.
- 검증 조건: 79개연결이현행JPG또는명시변환매핑으로해결되고,존재하지않는경로를주입하면검사실패. 과거관찰로그를현재실행으로덮어쓰지않음.

기술적으로 확인한 점:
- 참조값복사/동일객체필드변경/매개변수재할당/호출자반환대입을분리하며A/B를실제주소로표시하지않음.
- 순수Java원문3코드/저장stdout은현재원문과정확일치. 원문Methods둘째줄끝공백보존.
- format-inner와format-repeat는activeToken으로같은줄의다른연산강조. currentcode는선택가능DOM이며참조예제주변코드는별도보존.
- 음수setter는throw뒤대입미도달/기존값유지,0분모ArithmeticException과단락가드를구분.
- GreetingHTTP미실행·DB없음·고정total/rate/due없음·추가예시경계·GC시점미정명시.

## 3. 새 하네스와 기존 실행 근거

- 새 명령: `npm --prefix tools/site run test:p09` / exitCode=0 / UTC 2026-10-21T23:33:09.494161+00:00 → 2026-10-21T23:33:15.240928+00:00.
- 원시 stdout: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/test-p09.stdout.txt
- 원시 stderr: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/test-p09.stderr.txt
- HEAD·소스해시·시점: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/test-p09.execution.json
- 정적 대조 상세: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/static-evidence.json
- 새 test:p09 5 suite 통과: 기계 연결20주제84상태27질문, DOM 상호작용, 모바일 참조, 준비 장면, 원문135/서버17 및 P09 코드23/앵커32 보존.
- 저장된 원문 Java 3개와 stdout를 현재 Markdown에 바이트 대조했다. 모두 일치했으며 MethodsDemo 둘째 줄 끝 공백도 유지된다. 이것은 새 JVM 실행이 아니다.
- 기존 source-proof의 JDK21 실행/추가34상태/Methods6/javac12/protected 증거는 역사 근거다. 추가계측 코드와 원문 코드는 분리했다.
- 기존 browser-all-states168관찰은 당시 PNG 로드/렌더링 기록이다. 현재 JPG 브라우저를 다시 조작한 결과로 사용하지 않았다.
- Java/DB/Boot/HTTP/외부서비스/웹/CLI/다른 LLM/서브에이전트를 실행하지 않았다.

## 4. 실제 이미지 열람 범위

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/images/P09-07.jpg — tools.view_image 직접 열람. 원문 p.nickname="Grace"; 두변수가같은A헤더로연결,필드Ada→Grace.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/images/P09-09.jpg — tools.view_image 직접 열람. 원문 p=new Profile("Local only"); 호출자A Grace유지,매개변수B로분리.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/images/P09-12-overload-v3.jpg — tools.view_image 직접 열람. format(name)후String.repeat(count),같은this.prefix,반환문자열끝공백이명시됨.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/browser-evidence/mobile-P09-09.jpg — tools.view_image 직접 열람. 모바일DOM호출자p→A Grace/매개변수p→B Local only,현재원문코드일치. 번역확장overlay가호출자위쪽을가림.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/browser-evidence/desktop-P09-07.jpg — tools.view_image 직접 열람. 필드변경이미지와DOM A/A/Grace및현재코드강조일치. 전체그림영문작은글씨는원본보다작아DOM보완에의존.

시안3장+과거캡처2장만 직접 열람했다. 모든84상태·모든45선택이미지·모든캡처의 전수 시각 검토라고 주장하지 않는다. 현재브라우저는 메인에서 검증해야 한다. 선택45개 파일·해시 일치는 정적 검증이며 눈으로 본 범위와 다르다.

## 5. 남은 작업

- P09-M1 출처줄 수정
- P09-M2 질문별 현재이미지근거 연결 및 검사의 누락 보완
- 원문 단위 partial 항목을 다음 구현 범위로 명시: Spring 설정/빌드준비, sum누적/varargs오버로드 선택, static공유요청상태, null가드/오류실패→수정 대비 등
- 메인이 현재JPG버전의desktop/mobile주제선택·단계이동·확대/가로이동·복사·원문앵커·overflow를실제브라우저로확인
- 선택45이미지와84상태의나머지시각검토·학습자검증, 원문Boot/Java25/HTTP실행은승인범위에따라별도계획

## 핵심 5줄

1. 기존 Java 핵심 보강의 참조·값·코드 모델은 원문과 대체로 일치한다.
2. 새 test:p09 5 suite는 기준 HEAD에서 exit 0이며 원시 로그·소스해시를 보관했다.
3. quality 발견은 minor 2건(출처 줄, 현재 이미지 근거 경로 검사 누락)이고 critical/important는 확인되지 않았다.
4. Spring 준비/실행, 일부 varargs·오류·우선순위·정적 공유 맥락 등은 partial/unrun이며 전체 문서 완료가 아니다.
5. 실제 view_image는 시안3·과거캡처2뿐이고 새 브라우저·nativeJava·DB·HTTP 검증은 수행하지 않았다.
