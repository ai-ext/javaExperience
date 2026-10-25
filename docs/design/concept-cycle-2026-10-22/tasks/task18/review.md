# task18 D04 독립 감사

기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686` · 검토 UTC `2026-10-22T00:11:50.225708+00:00` · reviewer gpt-6.1-sol/high.
원문 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D04-build-pipeline-explained.md` 전문325줄·9fence SHA `eeadf83f4e342eba3befc7034aa31234c3617150368baea5b94f66419875b0a8`.

부분 보강의 관측값/경계는 현재 데이터·controller·renderer·테스트·생성 HTML·source-proof와 일치한다. 새 `npm --prefix tools/site run test:d04` exit0이다. 전체 의미 단위는 86개로 분해했으며 covered 33, partial 45, missing 4, unrun 4다. 보존 원문이 존재하는 것과 장면 coverage를 구분했다. fullDocumentComplete=false.

## Spec → quality

Spec는 needs_completion이다. 따라서 quality는 진단만 기록하고 전체 승인을 내리지 않았다. 현재 보강의 확정 critical/important 결함은0개다. 공통 clipboard race는 중복 finding에 넣지 않았다. 용어·lifecycle·진단·직접실습·Q&A의 공백은 구현 오류와 별도 후속 묶음이다.

## 확정 finding

- **D04-Q1 · minor · 원문 잔존 설명 상충.** `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d04-learning.mjs:26`의 원문 링크에는 원문L23/L108의 “테스트 통과 뒤 JAR”라는 선형 설명이 고정 task 순서를 보장하지 않는다는 별도 정정 안내가 없다. 생성 HTML L2899/L3079에도 남는다. 반대로 보강 graph-classes/assemble-boundary와 실제 direct graph는 build→assemble/check 두 갈래이고 historical baseline/twin raw에서 bootJar/jar/assemble이 test보다 앞이다. 보강 graph 자체는 올바르다. 원문을 보존한 채 링크/원문 details 바깥에 해당 문장들의 범위와 보강 장면으로 연결하는 짧은 주석을 추가하는 좁은 사양을 권고한다. 검증은 원문SHA 불변·새 주석 DOM 검사·D04검사 exit0·메인 원문이동 브라우저 확인이다. 자세한 evidence/fix/validation은 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task18/review.json`에 있다.

## 기술 대조와 실행 경계

직접 선행관계와 실제 시간순서를 구분했다. build=[assemble,check], assemble=[bootJar,jar]이며 classes를 공유한다. JAR 유무와 현재 build 통과는 다르다. JUnit2개실행/1실패, main/test 컴파일 실패, NO-SOURCE/onlyIf SKIPPED/UP-TO-DATE/FROM-CACHE가 각각 다르게 표시된다. Boot JAR lib20과 testRuntimeClasspath artifact29는 다른 집합이다.

추가 실험의 Java21.0.6·Wrapper9.8.0·Boot4.1.1·JUnit6.0.3은 원문 Java25 실행이 아니다. 추가 non-web launcher의 명시 인자는 web-application-type=none/banner/logging이며 active profile 변화는 시험하지 않았다. `/lesson.properties` 읽기 성공을 profile별 설정·HTTP·DB·배포 성공으로 확대할 수 없다. 원문은 profile 실험 자체를 요구하지 않으므로 이를 새 구현 요구로 만들지 않았다.

새 native 실행 없이 historical20개 로그를 읽고 독립 twin JAR 실물을 ZIP으로 검사했다. 9,103,378bytes / SHA `19be540e7682740e6d04d338fde021222c0c6e3a83dbaeb0935c3a85d928d16e` / lib20 / lesson.message=build-ready / test class 제외가 일치한다. baseline은 cache-on, twin은 cache-off이며 보편 재현성 또는 속도 개선 결과가 아니다. version lock과 private expected checksum 불일치 거부를 분리했다. `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task18/historical-readback.json`에 파일/로그 SHA와 주요 원문줄을 고정했다.

새 D04검사 UTC 2026-10-22T00:07:08.658861+00:00 ~ 2026-10-22T00:07:16.390903+00:00, exit 0. 원시 stdout/stderr와 HEAD·sourceSHA·관련8파일 SHA는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task18/runs/independent-20261022T000708.613828Z/result.json`에 있다. 이 실행은 Node/JSDOM/frozen/static hash 대조이며 fresh Gradle/Java 실행이 아니다. 원문9개 fence를 원문본문에서 직접 추출하여 각각 byte exact도 확인했다.

## 시각 직접 열람

`view_image`로 다음6개를 실제 열람했다. 선정11개 전체 또는58상태 전수 시각 검수라고 주장하지 않는다.

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/images/graph-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/images/repro-v5.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/images/delivery-v2.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/captures/desktop-graph.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/captures/mobile-package.jpg
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/captures/mobile-delivery.jpg

시안 graph는 selected dependencies/edge 생략·고정 timing 아님을 표시한다. repro는 두 scoped clean JAR와 별도의 resource 입력 변경을 구분한다. delivery는 MODEL ONLY/NOT EXECUTED를 반복한다. desktop graph의 기본 코드·값과 mobile package/delivery의 줄바꿈·부분 확대 상태를 확인했다. 과거캡처는 현재브라우저를 대신하지 않는다. 현재 browser는 메인 검수 범위다.

## 남은 묶음

1. 저장소·전이 graph/variant·artifact·snapshot/release/SemVer·tag의 정의/차이 장면.
2. settings 초기화→플러그인 구성→요청 그래프→action/출력과 독립 태스크 경계.
3. 오류 신호→최초 실패 task→책임 입력/다음 설정·보고서 연결; 모델 장애는 미실행 명시.
4. 기본 네 출력경로/source set와 tasks/version/--info/find 실습 연결. 원문 Java25·CI/Docker는 실행 허용/환경 확보 전 unrun 유지.
5. 전이 충돌·파일존재+해석실패·CLI순서·cache 비결정성·push 실패 Q&A의 구체 사례.
6. Q1의 원문 잔존 설명 안내와 메인의 현재 desktop/mobile 브라우저 종합.

## 의미 단위 전수표

covered는 해당 의미를 충분히 설명한다는 범위 판정이며 현재 native 실행 승인이 아니다. partial/missing은 원문보존과 별개인 보강 공백이다. unrun은 실제 원문환경·외부실습 실행이 없다는 경계다. sourceLines는 포함 범위다.

| 단위 | 원문 | stageIds | 판정 | 공백/후속 |
|---|---|---|---|---|
| D04-U001 | L3–5 도입: 빌드·태스크·환경 입력 | graph-branches, graph-classes, repro-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U002 | L9–25 §1 큰 그림: 소스에서 선택 전달까지 | graph-branches, outputs-class, outputs-resource, junit-pass, package-boot, delivery-images | partial | 소스→모듈 해석→class/resource→검증/조립→선택 전달을 한 입력으로 연결한 전체 장면이 없음. L23의 테스트 뒤 JAR라는 고정 순서 표현은 관측과 상충; Q1 참조 |
| D04-U003 | L27–27 §1 초기화·구성·실행 | graph-classes, dryrun-plan | partial | settings 평가→프로젝트 탐색→플러그인 등록→요청 그래프 선택의 값/코드 전환이 없음 |
| D04-U004 | L29–29 §1 D01 문서 경계 | delivery-images | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U005 | L35–35 §2 빌드 | graph-branches, assemble-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U006 | L36–36 §2 컴파일 | outputs-class | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U007 | L37–37 §2 태스크 | graph-branches, skip-only-if | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U008 | L38–38 §2 태스크 그래프 | graph-branches, graph-classes | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U009 | L39–39 §2 의존성 | dependencies-bom | partial | 외부 모듈과 import/컴파일 클래스패스의 관계는 정의·전환 없음 |
| D04-U010 | L40–40 §2 전이 의존성 | dependencies-bom | partial | 직접 의존성→전이 모듈의 구체 edge·충돌/선택 변화 없음 |
| D04-U011 | L41–41 §2 의존성 해석 | dependencies-bom, dependencies-lock | partial | 그래프·변형 선택과 파일 확보를 나눈 장면 없음 |
| D04-U012 | L42–42 §2 저장소 | — | missing | Maven/플러그인 저장소와 Git 저장소의 역할 비교 장면 없음 |
| D04-U013 | L43–43 §2 아티팩트 | dependencies-bom, package-boot | partial | 이름/버전으로 교환하는 의존 아티팩트·산출물의 같은 개념 연결은 명시하지 않음 |
| D04-U014 | L44–44 §2 리소스 | outputs-resource | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U015 | L45–45 §2 패키징 | package-boot, package-plain, assemble-fresh | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U016 | L46–46 §2 JAR | package-boot, package-plain, package-launch | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U017 | L47–47 §2 이미지 | delivery-images | partial | 런타임 파일시스템/설정과 실행 컨테이너 인스턴스의 차이를 실제 예시로 설명하지 않음 |
| D04-U018 | L48–48 §2 레지스트리 | delivery-images | partial | 의존성 저장소와 레지스트리의 형식/목적 대조 없음 |
| D04-U019 | L49–49 §2 태그 | delivery-images | partial | latest가 최신 보증이 아니라는 구체 예시·태그 변경 관찰 없음 |
| D04-U020 | L50–50 §2 스냅샷 | — | missing | 변경 가능 버전 관례·Gradle 태스크와 구분하는 장면 없음 |
| D04-U021 | L51–51 §2 릴리스 | — | missing | 공개 버전 확정과 deploy의 차이 장면 없음 |
| D04-U022 | L52–52 §2 SemVer | — | missing | MAJOR.MINOR.PATCH와 API 호환성·Gradle 선택 정책 분리 장면 없음 |
| D04-U023 | L53–53 §2 Wrapper | graph-source, repro-boundary | partial | Wrapper와 전역 gradle, JDK 선택 책임의 구체 비교 부족 |
| D04-U024 | L54–54 §2 빌드 캐시 | cache-up-to-date, cache-from-cache | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U025 | L55–55 §2 증분 빌드 | cache-resource | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U026 | L56–56 §2 재현 가능한 빌드 | repro-equal, repro-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U027 | L57–57 §2 CI 빌드 | delivery-ci | partial | commit checkout→격리 빌드라는 실제 구간을 구체 값으로 전환하지 않음 |
| D04-U028 | L59–59 §2 SemVer·버전 선택·태그 구분 | dependencies-lock, delivery-images | partial | SemVer와 의존성 버전·이미지 태그를 한 예로 비교하는 연결 없음 |
| D04-U029 | L65–69 §3.1 Wrapper·settings·build·플러그인·그래프 | graph-source, graph-branches, dryrun-plan | partial | initialization과 configuration의 입력/시점/산출물 없음; settings 포함 빌드 탐색 코드도 핵심 화면에 없음 |
| D04-U030 | L71–71 §3.1 다운로드·플러그인 설정 실패 | delivery-failures | partial | URL/프록시/플러그인 ID·버전/저장소를 분기하는 다음 행동 없음 |
| D04-U031 | L73–84 §3.1 의존과 독립 태스크·출력/생략 | graph-classes, skip-only-if, cache-up-to-date | partial | 초기화→구성→실행의 단계 전환 및 독립 태스크 병렬 가능성의 구체 시각적 연결 없음 |
| D04-U032 | L88–88 §3.2 전이·그래프·변형·파일 확보 | dependencies-bom | partial | 모듈 graph/variant 결정→로컬캐시/원격 파일 확보 순서의 구분 없음 |
| D04-U033 | L90–90 §3.2 repositories·인증·캐시 역할 | dependencies-bom, delivery-failures | partial | repositories/인증/캐시 각각 실패 시 책임 주체·입력 비교 없음 |
| D04-U034 | L92–92 §3.2 lock 한계와 파일 무결성 | dependencies-lock, dependencies-checksum | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U035 | L94–94 §3.2 resolution 실패 신호·다음 행동 | dependencies-checksum, delivery-failures | partial | Could not resolve/find·401/403·PKIX·No matching variant 각 신호/좌표/인증/인증서/변형 분기 없음 |
| D04-U036 | L98–98 §3.3 javac·class·리소스 | outputs-class, outputs-resource | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U037 | L98–100 §3.3 toolchain·소스호환성·역할 | graph-source | partial | classpath 심볼 확인·JDK API/바이트코드·source compatibility 불일치의 값/오류 예시 없음 |
| D04-U038 | L102–102 §3.3 기본 네 출력 경로·source set | outputs-class, outputs-resource, junit-pass | partial | 테스트 class/resources 경로와 source set 변경 가능성을 한눈에 보여주는 장면 없음 |
| D04-U039 | L104–104 §3.3 compile/resource 실패 분류 | junit-main-compile, junit-test-compile | partial | incompatible types·invalid source release와 리소스 충돌/권한/필터 오류의 다음 행동 없음 |
| D04-U040 | L108–110 §3.4 테스트 실행·검증과 조립 | junit-pass, graph-branches, assemble-boundary, skip-no-source | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U041 | L112–112 §3.4 보고서·JAR 출력 | junit-pass, package-boot, package-plain | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U042 | L114–114 §3.4 compileTestJava vs assertion 실패 | junit-test-compile, junit-assertion | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U043 | L116–131 §3.4 플러그인별 그래프·dry-run | graph-branches, graph-classes, dryrun-plan | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U044 | L136–140 §3.5 image build·Dockerfile·컨텍스트 | delivery-images | partial | Dockerfile/.dockerignore/기반 이미지/컨텍스트 입력→이미지 파일시스템·설정 변화는 설명 부족 |
| D04-U045 | L142–142 §3.5 이미지/레지스트리 실패 | delivery-failures | partial | failed to solve와 unauthorized/denied를 빌드/연결/인증/권한으로 분리하는 다음 행동 없음 |
| D04-U046 | L144–161 §3.5 로컬→Git→CI→저장소→registry | delivery-ci, delivery-images | unrun | 실제 CI checkout/build 및 registry 게시 실행 증거 없음. 실험 재실행 허용 전에는 미실행 유지 |
| D04-U047 | L165–165 §3.6 첫 실패 원인 | junit-main-compile, junit-test-compile, junit-assertion, delivery-failures | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U048 | L169–169 §3.6 설정·플러그인 | delivery-failures | partial | Wrapper·플러그인 ID/버전·저장소·구문으로 분기하는 조작/다음 행동 없음 |
| D04-U049 | L170–170 §3.6 의존성 해석 | delivery-failures | partial | 좌표·URL·인증/변형 속성의 구체 신호와 조치 없음 |
| D04-U050 | L171–171 §3.6 컴파일 | delivery-failures, junit-main-compile, junit-test-compile | partial | 실제 cannot find symbol 이외 JDK/classpath/생성 코드 진단 분기 없음 |
| D04-U051 | L172–172 §3.6 테스트 | delivery-failures, junit-assertion | partial | assertion 이외 CI 시간·외부 서비스·설정 비교 없음 |
| D04-U052 | L173–173 §3.6 패키징 | delivery-failures | partial | 중복 리소스·출력 경로·권한 실패 사례/조치 없음 |
| D04-U053 | L174–174 §3.6 메모리 | delivery-failures | partial | daemon/compiler/test JVM의 경계와 CI 한도/앞부분 로그를 연결하지 않음 |
| D04-U054 | L175–175 §3.6 이미지·업로드 | delivery-failures | partial | Dockerfile/컨텍스트/태그·registry 인증/권한을 분리하는 구체 조치 없음 |
| D04-U055 | L177–177 §3.6 중복 원인·info·로그 공유 | delivery-failures | partial | 동일 원인 후속실패를1개로 세는 핵심 장면 및 --info/민감환경값 공유 전 확인은 없음 |
| D04-U056 | L181–197 §4 Java25/Boot4.1.1 Kotlin 직접 실습 | graph-source | unrun | 원문 Java25 구성 전체 실행 없음. Java21 추가 관측으로 통과 처리 금지 |
| D04-U057 | L199–204 §4 플랫폼·버전·등록 태스크 확인 | graph-source | partial | tasks --all의 등록 태스크/Wrapper Windows 차이와 명령→관찰값을 연결한 장면 없음 |
| D04-U058 | L205–208 §4 dry-run | dryrun-plan, dryrun-outputs | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U059 | L210–217 §4 clean build --info·find 출력 | outputs-class, outputs-resource, junit-pass, package-boot | partial | 원문 find 네 경로/--info 첫 실패 진단을 연결한 실습 장면 없음. Java25 원문 실행과 다름 |
| D04-U060 | L219–223 §4 원문 demo JAR 실행 | package-launch | unrun | Java25 원문 demo JAR 미실행. 추가 fixture JAR 결과는 별도 근거 |
| D04-U061 | L225–233 §4 선택 Docker build/image ls/push | delivery-images | unrun | Docker build/login/push·레지스트리 실제 실행/권한 관측 없음 |
| D04-U062 | L235–235 §4 재현성 통제·깨끗한 PR CI | repro-equal, repro-boundary, dependencies-lock | partial | 원문 JDK25/깨끗한 PR CI 미실행; dynamic version/OS/환경값 변동을 통제/비교하는 구체 장면 없음 |
| D04-U063 | L237–237 §4 P08/P05/S19 연결 | package-boot, delivery-images | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U064 | L241–241 §5 컴파일은 전체 빌드 완료 아님 | outputs-class, junit-pass, assemble-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U065 | L243–243 §5 build는 하나의 action 아님 | graph-branches, dryrun-plan | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U066 | L245–245 §5 로컬 성공과 CI 성공 | delivery-ci | partial | 미커밋/대소문자/캐시의 숨은 차이 구체 입력과 최초 실패 사례 없음 |
| D04-U067 | L247–247 §5 버전 문자열과 실제 선택 | dependencies-lock, dependencies-bom | partial | 동적 버전/메타데이터/전이 충돌 사례와 lock 전후 선택 변화 없음 |
| D04-U068 | L249–249 §5 cache off와 재현성 | repro-equal, repro-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U069 | L251–251 §5 test 실패와 compile 오류 | junit-assertion, junit-test-compile | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U070 | L253–253 §5 JAR과 image | package-boot, delivery-images | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U071 | L259–259 §6 시각화 제안 전체 소스→운영 산출물 | outputs-class, package-boot, delivery-images | partial | 전체 연결 시퀀스는 없고 개별 관측+모델로 분리 |
| D04-U072 | L260–260 §6 시각화 제안 태스크 선행과 실패 | graph-branches, graph-classes, junit-main-compile | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U073 | L261–261 §6 시각화 제안 로컬/CI 입력 비교 | delivery-ci, repro-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U074 | L262–262 §6 시각화 제안 실패 로그 분류·다음 행동 | delivery-failures | partial | 계층 분류 이름까지만; 키워드→원인→보고서/설정 다음 행동 없음 |
| D04-U075 | L266–272 §7 Q1 컴파일/빌드·파일없음 | outputs-class, junit-pass, assemble-boundary, package-boot | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U076 | L274–276 §7 Q2 초기화·구성·의존관계 | graph-classes, dryrun-plan | partial | 의존그래프는 충분하지만 초기화/구성 의미 전환과 독립 병렬 구체 예시 없음 |
| D04-U077 | L278–280 §7 Q2 CLI 선택/순서 꼬리질문 | graph-branches, dryrun-plan | partial | 순서 일반화 금지는 명시하나 두 태스크 명령줄 순서/제약을 비교한 실제 예시 없음 |
| D04-U078 | L282–284 §7 Q3 전이 의존·충돌 | dependencies-bom, dependencies-lock | partial | 구체 전이 edge/충돌·선택 변화 없음 |
| D04-U079 | L286–288 §7 Q3 JAR 존재와 resolution 실패 | dependencies-checksum, delivery-failures | partial | checksum 거부는 다른 사례. metadata/variant/auth mismatch와 파일 존재를 연결하는 사례 없음 |
| D04-U080 | L290–292 §7 Q4 CI 입력 비교 | delivery-ci | partial | 입력 목록은 있음; 시크릿/네트워크·미커밋을 비교하며 최초 차이를 찾는 단계 없음 |
| D04-U081 | L294–296 §7 Q4 Wrapper의 보장 범위 | graph-source, repro-boundary | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U082 | L298–300 §7 Q5 cache/증분 차이 | cache-up-to-date, cache-from-cache, cache-resource | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U083 | L302–304 §7 Q5 비결정성·cache 삭제 | repro-boundary, repro-equal | partial | 보편 재현성 아님은 명시하나 시스템시각/동적 버전이 결과를 바꾸는 반례 없음 |
| D04-U084 | L306–308 §7 Q6 JAR/image/게시 경계 | package-boot, delivery-images | covered | 해당 의미 단위 설명/보존 대조 |
| D04-U085 | L310–312 §7 Q6 image 성공/push 실패 진단 | delivery-failures, delivery-images | partial | 두 단계 모델만 있고 로컬 image 존재와 registry push 로그 첫 실패를 비교하지 않음 |
| D04-U086 | L314–325 §8 공식 참고문헌10개 | — | covered | 해당 의미 단위 설명/보존 대조 |

판정: needs_completion
fullDocumentComplete: false
커버리지: 86단위 · covered 33 / partial 45 / missing 4 / unrun 4
이슈수: critical 0 / important 0 / minor 1 (원문 잔존 상충)
exit: 0 (`npm --prefix tools/site run test:d04`)
