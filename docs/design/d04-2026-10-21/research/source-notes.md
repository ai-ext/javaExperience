# 공식 출처 확인 메모

확인일: 2026-10-21. 발췌는 각 source에서 최대 25 English words 이내. 나머지는 요약이며, 웹 도구가 표시한 본문을 직접 열어 확인했다.

## Gradle current (확인 문서 version 9.8.2)

- https://docs.gradle.org/current/userguide/build_lifecycle.html — 발췌(19 words): “A build has three distinct phases. Gradle runs these phases in order”; task graph가 실행 순서를 결정하고 비의존 작업은 병렬 가능. 9.8.2.
- https://docs.gradle.org/current/userguide/java_plugin.html — 발췌(21 words): “`build` Depends on: `check`, `assemble`”; check/test, assemble/jar와 compile/resource/test task 관계 및 기본 source set output 경로 확인. 9.8.2.
- https://docs.gradle.org/current/userguide/base_plugin.html — 발췌(16 words): “Depends on: `check`, `assemble`”; build full project, assemble artifact, check verification의 생명주기 설명. 9.8.2.
- https://docs.gradle.org/current/userguide/command_line_interface.html — 발췌(18 words): “Run Gradle with all task actions disabled. Use this to show which task would have executed.” `--dry-run`; `--continue`도 task failure 이후 실행 계속. 9.8.2.
- https://docs.gradle.org/current/userguide/build_cache.html — 발췌(20 words): “reusing outputs produced by other builds”; inputs 기준 task output 재사용, 로컬/원격 cache 및 up-to-date 검사와 차이를 확인. 9.8.2.
- https://docs.gradle.org/current/userguide/incremental_build.html — 발췌(20 words): “avoid doing work that has already been done”; inputs/outputs, 생략과 incremental 실행 조건 설명. 9.8.2.
- https://docs.gradle.org/current/userguide/dependency_resolution.html — 발췌(21 words): “First, the graph resolution phase constructs the dependency graph ... Second, the artifact resolution phase fetches the actual files.” 9.8.2.
- https://docs.gradle.org/current/userguide/dependency_locking.html — 발췌(17 words): “Gradle saves the resolved versions of dependencies to a lock file”; 동적 버전 및 transitive 선택 안정화 설명. 9.8.2.
- https://docs.gradle.org/current/userguide/dependency_verification.html — 발췌(19 words): “If the computed checksum doesn’t match the expected value, the build fails instead of using the tampered file.” checksum/metadata 역할. 9.8.2.
- https://docs.gradle.org/current/userguide/platforms.html — BOM/platform dependency constraints를 정렬·전달하는 Gradle 개념. 이번 broad open에는 직접 성공 결과가 없으므로 URL은 리포트 보강용 공식 페이지로만 포함; 문구 직접 인용 없음.
- https://docs.gradle.org/current/userguide/working_with_files.html — 발췌(11 words): “Starting with Gradle 9, archives are reproducible by default.” Archive timestamp/order options 존재 및 재현성 주의. 9.8.2.

## Oracle, JUnit, SemVer, Docker

- https://docs.oracle.com/en/java/javase/25/docs/specs/man/javac.html — 발췌(18 words): “Compiles source code according to the rules ... generating class files which target that release.” `--release`와 source/target 구별. JDK 25 문서.
- https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html — JDK 21 javac 명령 문서 직접 열림; `--release` 개념 교차 확인. 버전 문서이지 Java 25 설치/실험 증거가 아님.
- https://junit.org/junit5/docs/current/user-guide/ — current URL이 https://docs.junit.org/6.1.3/overview.html 로 리다이렉트; 발췌(12 words): “JUnit requires Java 17 (or higher) at runtime.” JUnit 6.1.3 문서만 직접 확인.
- https://semver.org/ — 발췌(21 words): “MAJOR version when you make incompatible API changes”; 공개 API 버전 의미. Gradle resolution과 별도.
- https://docs.docker.com/get-started/docker-concepts/building-images/build-tag-and-publish-an-image/ — 발췌(17 words): “Once you have an image built and tagged, you're ready to push it to a registry.” build/tag/push 단계 분리와 인증 필요.

## 직접 접근 실패

- https://docs.gradle.org/9.8.0/userguide/build_lifecycle.html, `/java_plugin.html`, `/build_cache.html`, `/incremental_build.html`, `/command_line_interface.html`, `/dependency_resolution.html`, `/dependency_locking.html`, `/dependency_verification.html`, `/working_with_files.html` — 도구가 9.8.0 URL들을 접근 불가/내부 오류로 반환. 부모가 확인한 wrapper 버전과는 별도로, 문서 본문 검증에는 현행 9.8.2를 사용했다. 이를 9.8.0 고유 동작의 증명으로 보지 않는다.
- https://docs.spring.io/spring-boot/4.1.1/gradle-plugin/getting-started.html, `/index.html`, `/reference/htmlsingle/`, `/reference/html/` — 도구 오류/접근 불가. Boot 4.1.1 Gradle plugin 요구조건, Java 25 호환, `bootJar`/plain archive의 버전별 정확 동작을 검증하지 못함. 실패를 비호환 증거로 해석하지 않는다.
