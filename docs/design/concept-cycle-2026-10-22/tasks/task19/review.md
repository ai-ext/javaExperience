# task19 D05 독립 감사

판정: **needs_completion**, fullDocumentComplete=false. 확정 기술 결함 critical/important/minor=0/0/0. spec 미충족 상태의 quality는 진단이며 승인이 아니다.

기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 원문 `c3a875fb1940e05020301d8b0c5e88c607c870acb4c86c100f2c696155ff03e9`, 343줄 전문. 11질문·30상태.

`npm --prefix tools/site run test:d05`를 2026-10-22T00:12:42.312238+00:00에 새 실행했고 exit0·stderr0이다. 로그와 HEAD·소스 해시는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task19/runs/20261022T001242.310928Z 에 있다. Node/jsdom/static 산출물 검사이며 native Java나 현재 browser 재실행이 아니다.

원문 보존은 통과한다. 생성 HTML의 원문13876자/도표제외12865자·code6/Mermaid3/id16/map1 및 원문/fixture9/47deps 해시가 일치한다. 이것은 원문 전체 학습 장면 완료와 다르다.

커버리지 **88 의미 단위: covered20/partial38/missing11/unrun19**. 원문 전문과 용어28개·오해11개·Q&A6개를 개별 대조했다. 단위 크기와 반복이 달라 백분율로 환산하지 않는다. missing은 삭제가 아니라 보충 장면 부재, unrun은 경계가 표시된 다른 도구·환경 미실행이다.

## 기술·품질 진단

- 예외·HTTP 경계: 일치. source-probe.log의 top IllegalStateException/frame OrderController.find:29/cause SQLException/tail2/suppressed0과 HTTP raw 200,200,500,500,400,404. boot-http.log의 서버예외와 500 error JSON 내용 구분. DB연결은없음.
- 별도 Resource·로그·직접 JUnit: 일치. suppressed-probe.log primary body IllegalArgumentException/cause null/close IllegalStateException suppressed1. SourceProbe INFO/DEBUG에서 find(7) OK 동일. mutant log2실패, restored XML2pass. DB수정이나 HTTP JUnit이아님.
- jdb·bytecode·평가 부작용: 일치. raw jdb id13/counter0→bump1→compute9→caller11 bci4→next line12 bci5→next line13 bci11/result27. 별도 baseline26. 선정 stepping 그림은 bci4에서 doubled not yet stored 명시. 원문 Controller/IntelliJ UI와분리.
- 두 thread dump·종료: 일치. 두dump에서 holder와blocked는동일monitor 0x00000006f1c1d068, holder/waiting은동일latch 0x00000006f1c1d2a0. holder WAITING이어도 locked소유. ThreadTarget release/join/THREADS_DONE/exit0; 운영성능결론없음.
- temp Git bisect: 일치. raw predicates C4 bc7bc77.. exit1/C3 5e70592.. exit0→firstbadC4; reset lesson/C7. C2/C5/C6 실행없음. code와note.txt 모두commit간변하지만predicate는원문사본조건계약을검증; 보편인과확정아님.
- 실제 vs 모델·환경: 일치. 30상태중hypothesis2/boundaries3은checks=[]/models.*이고PASS없음. 새검사는정적/Node/jsdom artifact 검사. 역사native는Java21.0.6/Gradle9.8/Boot4.1.1,47deps/9fixture. Java25/IDE/실DB/운영/K8s미실행.
- 시각 전달: 대표6개에서확정오류없음. selected stack/stepping/threads 및 역사desktop-stack/mobile-stepping/desktop-threads actual view. 모바일캡처는확대영역의우측이첫뷰에서잘리고pan안내/별도현재값이노출됨; 캡처만으로끝단pan이나현재browser조작을확정하지않음.

품질 finding은 0개다. 위 관찰은 spec 승인 이후의 quality 승인으로 쓰지 않는다. task9 clipboard race는 요청에 따라 중복 등록하지 않았다.

## 대표 이미지 실제 열람

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/images/stack.jpg — actual view_image original, 1672×941, SHA `c5790d1ed06811c63700e2ea968bb6b13b6bfda6ff24c0713dd167a5176f44ab`.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/images/stepping-v2.jpg — actual view_image original, 1671×941, SHA `528326f7f1ca4c9e7350f0b28e7cd39fa7d2c3add377c51f25930e852723c227`.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/images/threads-v3.jpg — actual view_image original, 1672×941, SHA `a1f3540823d55e07eaf7d665c5624b7e43bb655466736ff0ca57bdfc4e3e4445`.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/captures/desktop-stack.jpg — actual view_image original, 1672×2292, SHA `e9bc3e008667c8e23827db9c91040f4c8e079d3bf2e60bd7719735ed3e579867`.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/captures/mobile-stepping.jpg — actual view_image original, 360×2075, SHA `e2d48a186a91499dbca00d41ce4ff06cd1ce43010aaaf649d212d21afc9851de`.
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/captures/desktop-threads.jpg — actual view_image original, 1672×2243, SHA `a0121c8f28e18a2556e3131e28c28b9fcf62770148133c646c006ebea42d886e`.

선정3/11·역사캡처3/22만 보았다. 모바일 그림 우측은 첫뷰에 잘리고 pan안내와 별도 현재값이 보인다. 캡처만으로 현재 pan·확대/복사·overflow 동작을 승인하지 않는다. 현재 browser는 메인이 검증한다.

## 남은 묶음

- **전체 순환·재현 조건·가설 검증**: 실패 문맥 표→정상과 차이→최소 재현 축소→예측→반증/채택→회귀·재발 루프를 한 사례로 연결. 확인 기준: 변경 변수 하나와 기대/실제·채택/폐기를 각 단계에 표시; 미재현을 완료로 표시하지 않음.
- **용어와 로그 정책·상관 ID**: bug/incident·배포/릴리스·ERROR/WARN/TRACE·민감값 제한·requestId/traceId 전파와 단절·로그vs중단 선택을 보강. 확인 기준: 원문 의미마다 새 stageIds/명시 모델을 연결하고 운영 미측정은 유지; 예시 로그에서 허용/제외 필드 구분.
- **HTTP→서버→ORM/DB 증거 연결**: 헤더/payload/timing·proxy/auth/cache와 SQL/bind/plan/lock/pool wait를 한 요청에서 구분. 확인 기준: 새 실제 실행을 하려면 별도 승인된 범위로 격리; 명시 모델이면 입력/출력/경계 사례를 제공하고 실측 PASS를 붙이지 않음.
- **운영 증거 사다리·원인 유형·안전한 JDWP**: 영향·지표→로그→trace→필요 dump와 설정/데이터/동시성/외부의존/배포 차이, 권한·보존·종료 선택을 보강. 확인 기준: controlled ThreadTarget을 운영 deadlock/CPU/heap/지연 증명으로 바꾸지 않으며 미실행을 구분.
- **원문 Java25/IDE/bootRun-curl/JAR/K8s 환경**: 원문 환경 미실행을 별도 상태로 유지; jdb 대체 근거와 IntelliJ 조건/예외/로그 UI 범위를 분리. 확인 기준: 추가 Java21/JDWP port0 기록을 원문 Java25/8080/5005/IDE 실행이라고 승격하지 않음; 이번 감사는 해당 native 실행을 하지 않음.
- **회귀·bisect 한계와 원문 연결**: 직접 JUnit/HTTP통합/DB통합의 경계, 배포 후 관찰, flaky/skip125/과거 빌드 불가·의존성 차이와 관련 문서 연결 보강. 확인 기준: 2개 직접 JUnit 통과를 HTTP/DB 회귀 통과로 일반화하지 않음; temp bisect의 C2/C5/C6 미probe 유지.
- **현재 브라우저·전수 시각·학습자 이해 관문**: 메인이 현재 preview desktop/mobile에서 조작·복사·확대/pan·원문·overflow 확인; 잔여8선정이미지/19역사캡처 미열람 범위와 learner미검증 유지. 확인 기준: reviewer는 공유 browser를 쓰지 않았음; 역사 screenshot·jsdom 결과로 현재 browser나 전수 pixel/이해도를 승인하지 않음.

## 원문 의미 단위 전수표

| 단위 | 원문 줄 | 의미 | stageIds | 판정 | 근거 | 남은 범위 |
|---|---|---|---|---|---|---|
| D05-U001 | 1–5 | 도입: 재현→한 가설→회귀·도구 선택 | hypothesis-observation, hypothesis-single, regression-mutant, regression-restored | partial | 가상 원인 배제·입력 비교·회귀 복원은 구체화됨 | 재현 불가와 운영 도구 선택을 연결하는 전체 순환 없음 |
| D05-U002 | 7–26 | 1 전체 디버깅 순환 | hypothesis-single, regression-original, regression-mutant, regression-restored | partial | 원문 Mermaid 보존; 신규 장면은 입력 비교와 회귀 일부 | 재현 불가→조건 수집, 가설 반증 루프, 배포 후 관찰·재발 루프 없음 |
| D05-U003 | 28–28 | 1 시각·영향·환경 차이 및 운영 완화·롤백 전 보존 | http-normal, http-failure | partial | 정상·실패 id 비교만 실행 증거 | 역할/프로파일/버전/외부응답 비교 및 완화와 증거 보존 판단 없음 |
| D05-U004 | 30–30 | 1 최소 재현·관찰/추측·예측 | hypothesis-observation, hypothesis-single | partial | 동일 환경 id 단일 변수 비교 | 전체 실패조건을 줄여 최소 재현을 도출하거나 예측을 반증하는 사례 없음 |
| D05-U005 | 32–32 | 1 D01/P07/J15/S16 연결 | 없음 | missing | 접힌 원문 문장 보존 | 새 장면에 전체 개발 피드백·관련 문서 역할 연결 없음 |
| D05-U006 | 38–38 | 2 용어: 디버깅 | regression-original, regression-mutant, regression-restored | partial | 회귀 검사가 의도적 계약 변이를 검출 | 실제 결함 원인→최소 수정→배포 후 확인까지 없음 |
| D05-U007 | 39–39 | 2 용어: 버그와 장애 | 없음 | missing | 원문 용어 표 보존 | 기대/실제 차이와 사용자 영향 사건 비교 장면 없음 |
| D05-U008 | 40–40 | 2 용어: 증상 | http-failure, hypothesis-observation | covered | 500 관측과 실제 DB 원인 추론을 분리 | 지정 의미 범위 충족 |
| D05-U009 | 41–41 | 2 용어: incident | 없음 | missing | 원문 표 보존 | 사용자 영향 및 외부 장애를 포함하는 incident 설명 장면 없음 |
| D05-U010 | 42–42 | 2 용어: 재현 | http-normal, http-failure | covered | 두 id 각각 같은 요청 두 번의 실제 HTTP 기록 | 지정 의미 범위 충족 |
| D05-U011 | 43–43 | 2 용어: 최소 재현 | hypothesis-single | partial | 하나의 id 비교 모델 | 실패를 남기면서 조건을 덜어내는 과정 없음 |
| D05-U012 | 44–44 | 2 용어: 범위 좁히기 | hypothesis-single, bisect-range, bisect-run | partial | 입력과 커밋 범위 축소 | 환경/리전/의존 계층의 범위 축소 없음 |
| D05-U013 | 45–45 | 2 용어: 가설 | hypothesis-observation, hypothesis-single | partial | 메시지로 실DB를 단정하는 추론을 배제 | 반증 가능한 예측→실험→폐기/채택의 완결 사례 없음 |
| D05-U014 | 46–46 | 2 용어: 로그 | logger-info, logger-debug | partial | 시점 로그·메서드 결과와 가시성 비교 | 메트릭 집계와 사건 로그 비교 없음 |
| D05-U015 | 47–47 | 2 용어: 로그 레벨 | logger-info, logger-debug | partial | INFO/DEBUG marker 가시성 제어 | WARN/ERROR/TRACE 목적·운영 대상 패키지 제한 선택 없음 |
| D05-U016 | 48–48 | 2 용어: 스택트레이스 | stack-top, stack-common | covered | SourceProbe 생성 프레임·호출 프레임·공통 tail2 구분 | 지정 의미 범위 충족 |
| D05-U017 | 49–49 | 2 용어: cause | stack-cause | covered | 직접 new SQLException을 cause로 생성; 실DB 없음 | 지정 의미 범위 충족 |
| D05-U018 | 50–50 | 2 용어: suppressed | suppressed-primary, suppressed-close | covered | 별도 Resource body primary/cause null/close suppressed1 | 지정 의미 범위 충족 |
| D05-U019 | 51–51 | 2 용어: 브레이크포인트 | debugger-breakpoint, boundaries-ide | partial | jdb method breakpoint의 실제 id13/counter0 | 라인 breakpoint/로그포인트 차이는 경계 목록뿐 |
| D05-U020 | 52–52 | 2 용어: 조건부 중단 | boundaries-ide | unrun | IDE 조건부 중단은 명시 모델 | 실제 IDE 조건식 설정·평가 비용/타이밍 관찰 미실행 |
| D05-U021 | 53–53 | 2 용어: 로그포인트 | boundaries-ide | unrun | IDE log breakpoint 모델 표시 | 정지 없이 기록하는 설정/비교 미실행 |
| D05-U022 | 54–54 | 2 용어: step | stepping-into, stepping-caller, stepping-next | covered | 실제 jdb step/step up/next 두 회와 대입 시점 | 지정 의미 범위 충족 |
| D05-U023 | 55–55 | 2 용어: Evaluate Expression | debugger-evaluation, debugger-result, boundaries-ide | partial | 추가 jdb bump가 counter0→1/result26→27 | IDE UI 및 getter의 추가 DB 조회는 미실행 |
| D05-U024 | 56–56 | 2 용어: 상관 ID | boundaries-sql | unrun | request ID/trace 전파 미실행 명시 | 여러 계층 식별자 연결과 단절 관찰 없음 |
| D05-U025 | 57–57 | 2 용어: HTTP 캡처 | http-normal, http-failure, boundaries-sql | partial | 실제 status/body/header raw는 존재 | Network payload/timing/initiator와 서버 로그 비교 UI 미실행 |
| D05-U026 | 58–58 | 2 용어: 바인딩 값 | boundaries-sql | unrun | SQL/bind 미측정 표시 | SQL 문장과 실제 값의 별도 증거 없음 |
| D05-U027 | 59–59 | 2 용어: 실행 계획 | boundaries-sql | unrun | plan/pool wait 미측정 표시 | 예상 계획과 실제 통계 비교 없음 |
| D05-U028 | 60–60 | 2 용어: 스레드 덤프 | threads-monitor, threads-latch, threads-released | covered | 같은 monitor/latch의 두 Thread.print와 종료 증거 | 지정 의미 범위 충족 |
| D05-U029 | 61–61 | 2 용어: 힙 덤프 | boundaries-operations | unrun | heap 미실행 경계 | 객체 참조 분석·수집 영향/보존 판단 모델 미구현 |
| D05-U030 | 62–62 | 2 용어: 원격 디버깅 | debugger-breakpoint, boundaries-ide | partial | own loopback ephemeral JDWP+jdb만 관찰 | 접근 통제·IDE/K8s 실습 미실행 |
| D05-U031 | 63–63 | 2 용어: git bisect | bisect-range, bisect-run, bisect-reset | covered | temp history C4 exit1/C3 exit0→firstbadC4, resetC7 | 지정 의미 범위 충족 |
| D05-U032 | 64–64 | 2 용어: 회귀 테스트 | regression-original, regression-mutant, regression-restored | covered | JUnit 직접 호출2 pass→조건 변이2 fail→복원2 pass | 지정 의미 범위 충족 |
| D05-U033 | 65–65 | 2 용어: 롤백 | boundaries-operations | unrun | rollback/deploy 미실행 표시 | 영향 완화와 원인 수정 분리 사례 없음 |
| D05-U034 | 67–67 | 2 배포·릴리스·기능플래그 용어 범위 | 없음 | missing | 원문 용어 주의 문장 보존 | 배포/트래픽 전환/기능 노출 차이 장면 없음 |
| D05-U035 | 71–73 | 3.1 실패 요청 문맥 기록 | http-normal, http-failure | partial | 같은 code/environment에서 id7/13 반복 | 시간대·역할·데이터상태·프로파일·외부응답을 고정하는 입력표/비교 없음 |
| D05-U036 | 75–75 | 3.1 비식별·부수효과·미재현 조건 관찰 | 없음 | missing | 원문 문장 보존 | 민감값 제거·격리 재시도와 타이밍/동시성/버전 차이 수집 장면 없음 |
| D05-U037 | 77–81 | 3.2 변수 분리와 반증 가능한 예측 | hypothesis-observation, hypothesis-single | partial | id 하나 비교·실DB 추론 배제 | pool wait/SQL시간 구분, cache 예측 검증·가설 폐기·변경 기록 없음 |
| D05-U038 | 83–93 | 3.3 스택/예외체인/첫앱프레임 | stack-top, stack-cause, stack-common | covered | 원문 그림 보존+실제 SourceProbe top/cause/frame29/tail2 | 지정 의미 범위 충족 |
| D05-U039 | 95–95 | 3.3 SQLTimeout 진단·생략·suppressed·생성시점 | stack-common, suppressed-primary, suppressed-close, hypothesis-observation | partial | 공통2frame와 suppressed 별도 관계 | DataAccessException/SQLTimeout의 pool/DB/network 분해는 미측정이며 해당 예시는 원문 SQLException과 다름 |
| D05-U040 | 97–99 | 3.4 로그 선택·형식·기본Logback·레벨 설정 | logger-info, logger-debug | partial | 실제 Logback level로 marker 가시성만 달라짐 | 로그vs디버거 선택 기준/로그 필드 구성/환경 로거 설정 분석은 원문뿐 |
| D05-U041 | 101–102 | 3.4 ERROR/WARN/INFO/DEBUG/TRACE 정책 | logger-info, logger-debug | partial | INFO/DEBUG marker 실험 | ERROR/WARN 사건과 TRACE 세밀도·선택 기준 비교 없음 |
| D05-U042 | 103–103 | 3.4 비밀값·개인정보·로그 접근/보존 | 없음 | missing | 원문 주의 문장 보존 | 허용/제외 필드와 접근·보존 정책 선택 장면 없음 |
| D05-U043 | 104–104 | 3.4 requestId/traceId 전파·단절 | boundaries-sql | unrun | 전파 구현하지 않음을 명시 | 같은 요청의 여러 계층 연결·식별자 단절 관찰 없음 |
| D05-U044 | 106–106 | 3.4 IDE 라인/조건/로그/예외 breakpoint와Step | stepping-into, stepping-caller, stepping-next, boundaries-ide | unrun | jdb step은 별도 native 근거로 구분 | IntelliJ UI의 조건/타입 제한·오탐 예외 비교는 미실행 |
| D05-U045 | 108–108 | 3.4 평가 부작용·getter조회·운영 중단 | debugger-evaluation, debugger-result | partial | bump 상태 변경은 별도 native 관측 | getter DB 조회 및 운영 전체 요청 영향 사례는 미실행 |
| D05-U046 | 110–112 | 3.5 실제 Network/curl·인증/CORS/HAR | http-normal, http-failure, http-binding, boundaries-sql | partial | HTTP status/header/body와 서버예외 다름은 실측 | Chrome Network/인증·쿠키/CORS·proxy·redirect·cache·HAR 제거 비교 없음; curl -i 그대로 미실행 |
| D05-U047 | 114–114 | 3.5 SQL/실제bind/계획·시간·show_sql·실행위험 | boundaries-sql | unrun | SQL/bind/plan/pool wait 미실행 표시 | 버전 logger·EXPLAIN ANALYZE 실행 위험과 별도 계층 증거 관찰 없음 |
| D05-U048 | 116–139 | 3.6 운영 증거 사다리·분포·권한/보존 | threads-monitor, threads-latch, boundaries-operations | partial | 원문 sequence 보존+추가 thread 두 snapshot; 모델 목록 명시 | 지표→요청 로그→trace 경계→필요한 dump 판단을 따라가는 운영 장면 없음; 운영 native는 미실행 |
| D05-U049 | 141–141 | 3.6 개발Pod JDWP/port-forward 접근 통제 | debugger-breakpoint, boundaries-operations | unrun | 자체 local JDWP와 K8s 미실행 명시 | 개발Pod 포워딩·비공개·종료 정책은 미실행 |
| D05-U050 | 147–147 | 3.6 원인 후보 분류: 설정 | 없음 | missing | 원문 유형/단서/확인표 보존 | 정상/실패의 설정 증거를 고르고 가설을 좁히는 구체 장면 없음 |
| D05-U051 | 148–148 | 3.6 원인 후보 분류: 데이터 | hypothesis-single | partial | 원문 유형/단서/확인표 보존; id 데이터 입력 비교만 존재 | 정상/실패의 데이터 증거를 고르고 가설을 좁히는 구체 장면 없음 |
| D05-U052 | 149–149 | 3.6 원인 후보 분류: 동시성 | 없음 | missing | 원문 유형/단서/확인표 보존 | 정상/실패의 동시성 증거를 고르고 가설을 좁히는 구체 장면 없음 |
| D05-U053 | 150–150 | 3.6 원인 후보 분류: 외부 의존 | 없음 | missing | 원문 유형/단서/확인표 보존 | 정상/실패의 외부 의존 증거를 고르고 가설을 좁히는 구체 장면 없음 |
| D05-U054 | 151–151 | 3.6 원인 후보 분류: 배포 차이 | 없음 | missing | 원문 유형/단서/확인표 보존 | 정상/실패의 배포 차이 증거를 고르고 가설을 좁히는 구체 장면 없음 |
| D05-U055 | 153–155 | 3.7 회귀·단위/통합 경계·배포 후 확인 | regression-original, regression-mutant, regression-restored | partial | 직접 JUnit 계약 변이 검출 및 복원 | JUnit은 direct Controller 단위 호출; HTTP/DB 통합 회귀 및 배포 후 지표 확인 없음 |
| D05-U056 | 157–169 | 3.7 bisect 범위·good/bad/reset·자동판정 | bisect-range, bisect-run, bisect-reset | partial | temp7commit·동일 javac/Java predicate의 C4bad/C3good과 reset | 실행불가/skip125·flaky·의존서비스 변화로 인한 판정 한계의 학습 장면 없음 |
| D05-U057 | 171–173 | 4 원문Boot4.1.1/Java25/Initializr 환경 | http-normal, boundaries-ide | unrun | 원문25는미실행/추가21.0.6 사용 명시 | 원문 환경 전체 재현은 미실행; 별도Java21 결과로 승격하지 않음 |
| D05-U058 | 175–211 | 4 원문Java Controller·가상cause | http-normal, http-failure, stack-top, stack-cause | covered | 원문 byte와 fixture 일치; 추가21 HTTP 반복200/500; DB호출없음 | 지정 의미 범위 충족 |
| D05-U059 | 213–217 | 4 application.properties DEBUG | logger-info, logger-debug | partial | 원문properties byte복사 및 추가Logback 제어 | Boot의 원문DEBUG 설정과 직접setLevel의 효과를 같은 실행으로 일반화하지 않음 |
| D05-U060 | 219–230 | 4 bootRun/curl8080 실행 절차 | http-normal, http-failure | unrun | own127.0.0.1 port0 앱을 java-cp로 실행한 역사 증거 | 문서의 gradlew bootRun/curl-i 8080 명령 그대로는 미실행 |
| D05-U061 | 232–232 | 4 HTTP200/500·서버stack·가상DB 경계 | http-normal, http-failure, stack-top, stack-cause, hypothesis-observation | covered | 실제HTTP/errorJSON과 source-probe/서버raw 모두 일치; new SQLException은 가상 | 지정 의미 범위 충족 |
| D05-U062 | 234–234 | 4 IDE 조건부/StepOver/Evaluate/log/exception | debugger-evaluation, stepping-next, boundaries-ide | unrun | jdb는 다른프로그램/다른도구임을 명시 | 원문Controller IntelliJ 관찰·조건/log/exception UI는 미실행 |
| D05-U063 | 236–242 | 4 JDWP jar localhost5005/Remote 구성 | debugger-breakpoint, boundaries-ide | unrun | 별도DebugTarget 자체loopback 임시포트만 관찰 | 원문JAR/고정5005/IntelliJ Remote UI 구성은 미실행 |
| D05-U064 | 244–244 | 4 개발Kubernetes 선택실습 | boundaries-operations | unrun | K8s 미실행 표시 | 승인Pod/port-forward 시연 미실행 |
| D05-U065 | 246–246 | 4 Thread.print·heap 판단 | threads-monitor, threads-latch, threads-released, boundaries-operations | partial | 추가ThreadTarget 두 dump와 release/join/exit0 | heap영향/보안·수집 여부 판단은 미구현/미실행 |
| D05-U066 | 248–248 | 4 별도DB·Hibernate버전·SQL/bind/plan | boundaries-sql | unrun | SQL만으로실DB상태를단정하지않는경계 | 원문별도DB 연결과SQL/bind/plan은 미실행 |
| D05-U067 | 252–252 | 5 오해: 마지막 예외 문구 | stack-top, stack-cause | covered | top/cause와실DB미호출을분리 | 지정 의미 범위 충족 |
| D05-U068 | 253–253 | 5 오해: 맨아래=수정위치 | stack-top, stack-common | covered | caller와공통tail/첫앱프레임을구분 | 지정 의미 범위 충족 |
| D05-U069 | 254–254 | 5 오해: 미재현=해결 | 없음 | missing | 원문오해목록보존 | 미재현을결과로남기고증거수집을넓히는장면없음 |
| D05-U070 | 255–255 | 5 오해: 많은로그 | logger-info, logger-debug | partial | 가시성/실행여부분리 | 중복/고카디널리티/민감정보와검색비용장면없음 |
| D05-U071 | 256–256 | 5 오해: 운영DEBUG안전 | logger-info, logger-debug | partial | level제어원리만실험 | 운영대상/시간범위/종료정책없음 |
| D05-U072 | 257–257 | 5 오해: breakpoint는관찰만 | debugger-evaluation, debugger-result | covered | 실제bump가후속결과를26→27로변경 | 지정 의미 범위 충족 |
| D05-U073 | 258–258 | 5 오해: 사내JDWP안전 | debugger-breakpoint, boundaries-ide | partial | loopback/ownPID/임시port경계 | 접근통제/짧은활성화의선택장면부족 |
| D05-U074 | 259–259 | 5 오해: SQL만보면DB | boundaries-sql | unrun | 미측정경계명시 | 실제bind/lock/plan/pool증거없음 |
| D05-U075 | 260–260 | 5 오해: 여러설정동시변경 | hypothesis-single, regression-mutant | covered | 입력id또는한분기조건변이만분리 | 지정 의미 범위 충족 |
| D05-U076 | 261–261 | 5 오해: 덤프우선 | threads-monitor, boundaries-operations | partial | 자체dump관측과운영미실행분리 | 저비용증거우선·필요질문/수집권한판단부족 |
| D05-U077 | 262–262 | 5 오해: bisect주관판정 | bisect-range, bisect-run | covered | 같은실제javac/Java계약predicate로두중간commit판정 | 지정 의미 범위 충족 |
| D05-U078 | 266–267 | 6 순환 시각화 설계 | hypothesis-single, regression-restored | partial | 원문Mermaid와부분장면 | 반증/재발화살표와배포후같은지표판정전체없음 |
| D05-U079 | 269–270 | 6 스택 관계 시각화 설계 | stack-top, stack-cause, stack-common, suppressed-close | covered | 실제선정stack이미지의callframe/cause/생략과별도Resource그림 | 지정 의미 범위 충족 |
| D05-U080 | 272–273 | 6 HTTP→DB 한요청 추적 설계 | http-failure, boundaries-sql | partial | 응답과서버stack구분 | browser/proxy/service/ORM/DB에같은ID·시간·SQL/bind/plan연결없음 |
| D05-U081 | 275–276 | 6 운영 증거 사다리 설계 | boundaries-operations | partial | 미실행도구목록모델 | 알림→지표→로그→trace→dump의단계적선택장면없음 |
| D05-U082 | 280–287 | 7 Q1 미재현 시작·격리·확신 한계 | hypothesis-single | partial | 입력하나비교모델 | 조건수집/격리/회귀미확보확신도를결정하는Q&A장면없음 |
| D05-U083 | 289–295 | 7 Q2 cause·첫app·suppressed | stack-top, stack-cause, suppressed-primary, suppressed-close | covered | 직접SourceProbe와별도Resource로관계를구분 | 지정 의미 범위 충족 |
| D05-U084 | 297–303 | 7 Q3 로그vs디버거·간헐오류 | logger-info, debugger-evaluation, boundaries-ide | partial | level가시성과평가부작용 | 사후비교/정지타이밍/로그포인트선택사례없음 |
| D05-U085 | 305–311 | 7 Q4 browser500/서버로그없음·HAR | http-failure, boundaries-sql | partial | 응답과서버stack불일치의기본경계 | gateway/CDN·인증/CORS/쿠키·HAR정제추적없음 |
| D05-U086 | 313–319 | 7 Q5 SQL/bind·plan/lock/pool | boundaries-sql | unrun | 별도증거필요경계명시 | 대상버전bindlogger/DB추적/실행시간·잠금·pool관찰없음 |
| D05-U087 | 321–327 | 7 Q6 운영JDWP·승인/영향/종료 | debugger-breakpoint, debugger-evaluation, boundaries-ide | partial | 자체JDWP와평가변경범위설명 | 운영지연/권한·담당자·종료시각평가의선택사례없음 |
| D05-U088 | 330–343 | 8 참고문헌 | 없음 | covered | 생성HTML의접힌원문에11개참고문헌과URL보존; 새웹검증없음 | 지정 의미 범위 충족 |

## 실행·변경 경계

기존 native raw를 직접 읽었다. boot-http exit143(SIGTERM), debug baseline/target·jdb·ThreadTarget exit0, mutant-regression exit1은 의도한 실패다. 이를 이번 감사의 native 재현이나 전부 exit0이라고 쓰지 않는다. Java25/IDE UI/실DB/운영/K8s는 미실행이다. 새 Java서버·DB·browser·web·외부CLI·다른에이전트/LLM을 실행하지 않았다. application·원문·기존 증거·공유 장부·Git·다른task를 수정하지 않고 task19 출력만 썼다.

판정: needs_completion
fullDocumentComplete: false
커버리지: 88 (covered20/partial38/missing11/unrun19)
이슈수: 확정결함0; 범위/실행 미충족68
actualexit: test:d05=0
