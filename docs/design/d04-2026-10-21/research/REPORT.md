# D04 원문 기술 사실 검수 자료

확인 기준일: 2026-10-21. 대상은 이 디렉터리의 `SOURCE.md` 325줄이다. 아래는 개념·도식에서 바로잡거나 주의 표시할 사항이며, 원문을 수정하지 않았다. 공식 페이지의 직접 접근 가능 여부와 관측 버전은 [`source-access.json`](source-access.json)에, 짧은 발췌 및 요약은 [`_data/source-notes.md`](_data/source-notes.md)에 정리했다.

## 핵심 검수 항목

### 1. Gradle 생명주기와 그래프

**주장:** Gradle 빌드는 initialization → configuration → execution 세 단계다. 초기화는 참여 프로젝트/포함 빌드를 결정하고, 구성은 프로젝트를 설정하고 태스크 그래프를 만들며, 실행은 그래프상 태스크를 수행한다. 의존관계 없는 작업은 병렬 실행될 수 있다. 따라서 태스크 실행 목록은 화살표 그래프의 위상적 순서이지 사용자가 적은 명령어 순서의 단순 복사가 아니다.

**근거:** [Gradle Build Lifecycle](https://docs.gradle.org/current/userguide/build_lifecycle.html) (직접 읽은 현재 문서는 9.8.2; 9.8.0 URL은 접근 실패). 공식 설명은 phases와 graph를 직접 정의한다.

**이미지 주의:** `build`를 노드 하나로 그린 뒤 `test → jar`를 고정 순서처럼 표현하지 말 것. 실제 순서는 해당 프로젝트의 plugins와 task dependencies로 확인해야 한다. 독립 가지는 병렬 가능성으로 표시한다.

### 2. `build`, `check`, `assemble`: 테스트 성공이 패키징보다 늘 먼저인가?

**주장:** 기본 Java/Base 플러그인 관계에서 `build`는 `check`와 `assemble`에 의존하고, Java 플러그인은 `check → test`, `assemble → jar`를 연결한다. 이것은 두 가지가 모두 `build`의 prerequisite라는 뜻이지 모든 프로젝트에서 테스트가 패키징보다 시간상 먼저 끝난다는 보장은 아니다. `check`와 `assemble` 가지는 서로 독립적일 수 있어 JAR 제작과 테스트가 병렬로 진행될 수 있다. `test` 실패는 기본적으로 전체 build를 실패시키지만, 이미 생성되었거나 이전 실행에서 남은 JAR이 존재할 수 있다. 실패 뒤 기존 파일 존재만으로 현재 테스트를 통과한 artifact라고 결론내리지 말 것. `--continue`, custom task wiring, 별도 task 요청도 관측을 바꾼다.

**근거:** [Gradle Java Plugin](https://docs.gradle.org/current/userguide/java_plugin.html), [Gradle Base Plugin](https://docs.gradle.org/current/userguide/base_plugin.html). Java plugin 문서는 `assemble`이 `jar`, `check`가 `test`, `build`가 양쪽에 의존한다고 적는다. Gradle 실행 옵션 문서는 `--continue`가 실패 뒤 task execution을 계속하게 함을 밝힌다.

**이미지/관측 주의:** `test 통과 → JAR 생성` 단방향 순서를 일반 법칙으로 그리지 말 것. 필요하면 “일반 플러그인의 prerequisite 관계”와 “실제 실행 순서는 task graph/병렬성에 따름”을 병기한다. 재현 실습에서 이전 JAR 혼입을 피하려면 격리된 새 fixture에서 `clean` 후 실행하고 JAR 타임스탬프/hash 및 task 결과를 함께 확인해야 한다.

### 3. `--dry-run`

**주장:** 현재 Gradle CLI 문서는 `--dry-run`이 모든 task action을 비활성화하고 실행됐을 태스크를 보여준다고 명시한다. 그러므로 명령 출력은 실행 계획/태스크 열거이지 테스트 결과, 파일 복사, JAR 생성의 증거가 아니다. 구성 단계의 build script 평가가 전혀 없다는 뜻도 아니다.

**근거:** [Gradle Command-Line Interface](https://docs.gradle.org/current/userguide/command_line_interface.html), `--dry-run` 항목. `--task-graph`는 현재 문서상 9.1.0부터로 표기되어 있으므로 9.8.0 wrapper에서는 CLI 도움말 확인 없이 그 옵션을 권하지 않는다.

**이미지 주의:** dry-run 그림에는 task 노드/계획만 출력하고 산출물 파일 아이콘을 만들지 않는다.

### 4. Java task와 JAR 경계

**주장:** 기본 Java 플러그인에서 `compileJava`는 production Java를 컴파일하고 `processResources`는 main 리소스를 복사한다. `classes`는 둘에 의존한다. `compileTestJava`는 test source 컴파일, `processTestResources`는 test resource 처리, `testClasses`는 둘에 의존, `test`는 테스트 실행이다. 기본 `jar`는 `classes`를 입력으로 main source set의 production JAR을 만든다. 기본 출력 경로는 보통 `build/classes/java/<sourceSet>` 및 `build/resources/<sourceSet>`이나 source set 설정으로 바뀔 수 있다.

**근거:** [Gradle Java Plugin](https://docs.gradle.org/current/userguide/java_plugin.html) 태스크와 layout 절. Oracle [javac JDK 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html)는 컴파일 옵션과 출력·release 의미를 설명한다.

**이미지 주의:** test class가 일반 production JAR에 들어가는 것처럼 연결하지 말 것. `jar`는 “실행 가능”을 자동 의미하지 않는다. SOURCE의 Spring Boot `bootJar` 및 `plain.jar` 설명은 이번 접근에서 지정된 Boot 4.1.1 공식 문서를 열지 못해 이 자료만으로 검증 불가다. Boot plugin은 통상 실행 가능한 아카이브와 plain archive를 구분하지만, 4.1.1의 정확한 task 이름·classifier·기본 설정을 이미지에 넣기 전에 성공한 해당 버전 문서나 fixture 관측이 필요하다.

### 5. Boot 4.1.1, Gradle/JDK, Java 25

**주장:** SOURCE는 Boot Gradle plugin 4.1.1과 Java 25 toolchain을 한 실행 설정처럼 제시한다. 지정된 Boot 4.1.1 공식 URL들이 직접 열리지 않아 해당 버전의 plugin 요구 Gradle, 최소/지원 Java, 9.8.0과의 호환은 확인하지 못했다. 문서가 열리지 않은 사실을 호환/비호환으로 추정하면 안 된다. Parent가 확인한 wrapper 9.8.0 및 기존 설치 Java 21.0.6은 별도 실행 맥락이며, 이 환경에 JDK 25가 설치되지 않았으므로 Java 25 실험 결과로 묘사할 수 없다.

**근거:** 접근 실패한 URL 및 성공한 [Oracle javac JDK 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html), [Oracle javac JDK 21](https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html). `javac --release`는 해당 Java SE release 규칙/API로 컴파일하도록 설명한다. Toolchain language version, compiler source/target/release, Gradle 실행 JVM은 구별해야 한다. SOURCE 예제의 `languageVersion=25` 한 줄만으로 실제 JDK 공급·설치 여부나 Gradle daemon JVM까지 증명하지 않는다.

**이미지 주의:** “Boot 4.1.1 + Java25 실험” 라벨은 실측 없이 쓰지 않는다. 검증 전에는 “구성 예시(환경 실행 미확인)”로 표현하고, Java 21 관측을 Java 25 결과와 합치지 않는다.

### 6. 태스크 생략 결과, 증분 컴파일, build cache

**주장:** `UP-TO-DATE`는 이전 로컬 task output이 선언 input/output 검사에서 유효해 작업을 다시 하지 않는 결과다. `FROM-CACHE`는 입력 키가 일치한 다른 task 실행의 output을 cache에서 가져온 경우다. `NO-SOURCE`는 해당 task가 처리할 source가 비어 생략된 결과다. `SKIPPED`는 조건/설정 등으로 실행에서 제외될 수 있으므로 원인을 함께 봐야 한다. 상태 문구가 달라도 태스크 그래프의 dependency 관계와 동일 개념이 아니다.

증분 빌드는 현재 workspace에서 변경 입력에 대응하는 작업량을 줄이는 동작이며 Java incremental compilation은 컴파일러 수준의 영향 분석을 포함한다. Build cache는 선언된 task input에서 output을 키잉해 이전 실행물을 재사용하며 로컬/원격, 다른 workspace 간 재사용도 가능하다. Up-to-date check와 output cache는 같은 것이 아니다. 잘못 선언된 누락 입력은 캐시 정합성과 결과를 해칠 수 있다.

**근거:** [Gradle Incremental Build](https://docs.gradle.org/current/userguide/incremental_build.html), [Gradle Build Cache](https://docs.gradle.org/current/userguide/build_cache.html), Java plugin의 [Incremental Java compilation](https://docs.gradle.org/current/userguide/java_plugin.html).

**이미지/관측 주의:** 네 상태를 전부 “실행 성공” 한 범주로 합치지 말 것. `NO-SOURCE`는 테스트 0건/검증 완료와 같지 않다. 캐시 hit도 task가 현재 입력에 맞는 output으로 보고 재사용했다는 뜻일 뿐 독립 빌드 재현성 증명은 아니다.

### 7. 의존성 그래프, artifact, BOM·lock·verification

**주장:** Gradle 의존성 해석은 먼저 선언·메타데이터·요청 attributes로 component/variant 그래프를 정하는 graph resolution, 이어 선택된 variant의 실제 artifact 파일을 찾거나 받는 artifact resolution으로 구분된다. 직접 모듈이 요구하는 transitive dependency도 결과 그래프에 포함될 수 있다. BOM/platform은 버전 정렬/제약을 전달하는 방식이고 dependency locking은 해석된 버전 선택을 lock state로 고정하는 데 쓰인다. 파일 checksum/signature 검증은 다운로드 파일의 내용 무결성·출처 확인 정책으로 별도다. Lock만으로 파일 바이트나 repository 가용성을 보증하지 않고, verification metadata만으로 모듈 버전 선택을 고정하지 않는다.

**근거:** [Gradle Dependency Resolution](https://docs.gradle.org/current/userguide/dependency_resolution.html), [Dependency Locking](https://docs.gradle.org/current/userguide/dependency_locking.html), [Dependency Verification](https://docs.gradle.org/current/userguide/dependency_verification.html), [Platforms (BOMs)](https://docs.gradle.org/current/userguide/platforms.html).

**이미지 주의:** “잠금 파일=체크섬”으로 합치지 말고 그래프 선택(버전/variant)과 artifact bytes 검증을 별도 레이어로 표현한다. BOM 역시 실행 파일/의존성 JAR 자체와 혼동하지 않는다.

### 8. 새 private fixture와 최초 실패 증거

**주장:** JUnit 실패, 컴파일 실패, 캐시 효과를 원본 소스 변경 없이 설명하려면 private fixture를 새 디렉터리에 만들고 최소 입력을 고정한다. fixture에는 Wrapper/Gradle, JDK, plugin/dependency 버전, repository/lock, source/resource/test files, 환경변수·locale/timezone, cache enablement와 clean 상태를 기록한다. 별도 프로세스/작업 디렉터리에서 성공 baseline을 먼저 실행하고, 한 번에 한 입력만 바꿔 실패 조건을 만든다. 컴파일 오류(예: `compileJava`/`compileTestJava`)와 런타임 테스트 assertion(`test`)을 구별하고, 로그에서 첫 실패 task와 첫 원인 예외/컴파일 진단을 우선 읽는다. 이어 `--stacktrace`/테스트 report 및 task outcome을 보조 근거로 사용한다. 이는 권장 통제 절차이며 이번 조사에서 fixture 실행을 수행했다는 뜻은 아니다.

**근거:** [Gradle Java Plugin](https://docs.gradle.org/current/userguide/java_plugin.html) task prerequisite, [JUnit User Guide](https://junit.org/junit5/docs/current/user-guide/) (현재 리다이렉트 문서는 JUnit 6.1.3; JUnit 실행 최소 Java 17), [Gradle CLI](https://docs.gradle.org/current/userguide/command_line_interface.html) 옵션.

**이미지 주의:** 로그 재현은 빌드 환경의 다른 요인들을 통제해야 한다. 기존 `build/`와 사용자 캐시를 성공/실패 원인으로 섞지 않고, 실패 출력에서 마지막 `BUILD FAILED`만 확대하지 말 것.

### 9. 재현 가능한 JAR의 범위

**주장:** Gradle 현재 문서는 Gradle 9부터 archive가 기본 재현 가능하다고 밝히며 archive entry time/order 등 archive task 특성을 통제한다. 이는 이 모든 애플리케이션 JAR이 전체 환경에서 항상 바이트 동일하다는 보증으로 확대할 수 없다. manifest에 주입된 버전·시간·환경값, 생성 파일, 압축/도구 버전, 비결정적인 task/plugin 입력 등이 결과에 영향을 줄 수 있다. 동일 input SHA는 소스 트리 일치만 말하고, cache hit는 output 재사용 사실만 말한다. 어느 것도 단독으로 두 독립 clean build의 JAR byte-for-byte 동등성을 입증하지 않는다.

**근거:** [Gradle Working With Files — Reproducible archives](https://docs.gradle.org/current/userguide/working_with_files.html) (현행 9.8.2 문서), [Build Cache](https://docs.gradle.org/current/userguide/build_cache.html). archive task에서 timestamp 유지·filesystem order 옵션이 달라질 수 있음을 공식 문서가 보여준다.

**이미지/관측 주의:** 재현성 주장은 서로 격리된 clean 환경에서 JAR을 만들어 `sha256` 비교하고 입력 목록/manifest를 함께 기록한 경우에만 관측 결과로 쓴다. 현재 wrapper 9.8.0은 현행 9.8.2의 Gradle 9 동작 설명과 버전이 같다고 단정하지 않는다.

### 10. 이미지 생성·태깅·push는 별도 선택 과정

**주장:** Docker 공식 문서는 build context와 Dockerfile로 이미지를 빌드하고 tag로 이름을 붙인 뒤 별도 `docker push`로 registry에 올리는 흐름을 설명한다. JAR build 성공은 Docker build 성공이나 registry upload 성공을 의미하지 않는다. 이번 작업에서는 Docker 실험, 로그인, registry push를 수행하지 않았다.

**근거:** [Docker: Build, tag, and publish an image](https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/). push에는 인증이 필요하고 이미지 이름에 registry/repository/tag 요소가 있다는 내용을 직접 확인했다.

**이미지 주의:** local image와 remote registry artifact를 서로 다른 산출물로 그리고, push 화살표를 선택적으로 표시한다. 실행한 것처럼 Docker 명령 결과·속도를 꾸미지 않는다.

### 11. JUnit 현재 버전과 SemVer 한계

**주장:** 공식 JUnit “current” 진입점은 확인 당시 6.1.3 문서로 리다이렉트했고, 해당 overview는 runtime Java 17 이상을 명시한다. 이를 SOURCE에서 언급한 임의 버전의 구체 설정이 검증됐다는 뜻으로 쓰지 않는다. SemVer 2.0.0은 공개 API 호환성 변화에 MAJOR/MINOR/PATCH 규칙을 정의하지만 Gradle의 버전 선택 알고리즘, 이미지 tag, dependency locking을 정의하지 않는다.

**근거:** [JUnit User Guide current](https://junit.org/junit5/docs/current/user-guide/) → [JUnit 6.1.3 overview](https://docs.junit.org/6.1.3/overview.html), [Semantic Versioning 2.0.0](https://semver.org/).

### 12. 검수 결론과 그림 편집 우선순위

원문의 핵심 비유(컴파일은 빌드의 일부, task graph와 선택적 Docker 흐름)는 개념 소개로 유효하다. 단, 세 부분은 반드시 조건을 붙인다: (a) 테스트 다음 JAR이라는 보편적 시간 순서는 task graph가 보장하지 않음, (b) dry-run은 task action을 하지 않아 산출물 생성 근거가 아님, (c) Boot 4.1.1 + Java 25 구체 호환/실행과 `bootJar`/plain JAR 동작은 지정 공식 문서 접근 실패로 이 조사에서는 미확인. 그림은 task prerequisite DAG, 산출물의 기존/새 생성 구분, dry-run의 무산출, Docker push 선택성을 표현하는 것이 안전하다.
