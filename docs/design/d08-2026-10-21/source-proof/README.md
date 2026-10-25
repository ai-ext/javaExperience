# D08 추가 native 관찰과 원문 경계

원문 `docs/knowledge/D08-cicd-collaboration.md` 319줄·8개 fence(mermaid3/bash1/YAML3/Groovy1)는 `source.json`과 `original/`의 SHA·byte로 보존했다. 원문에는 Java 앱 코드가 없다. `fixture/`의 Java·JUnit·Gradle·충돌 Python 예시는 이 검증을 위해 추가한 코드이며 학습자의 정답 구현이 아니다. 원문 Java25 명령·YAML/Groovy 파이프라인을 실행하지 않았다.

## 재현

```bash
python3 docs/design/d08-2026-10-21/source-proof/run-proof.py \
  --project-root LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night \
  --runtime-root LOCAL_HOME/research/javaexperience-d08-20261021/_data/native
```

`--project-root`는 읽을 원문·현재 wrapper가 있는 프로젝트 루트를, `--runtime-root`는 새 실행 디렉터리를 만들 부모를 지정한다. runner 파일이 있는 `source-proof/`에 실행 기록을 쓴다. 별도 사본의 runner에서도 두 인자를 지정할 수 있다. `--probe`는 native 관찰 후 체크포인트를 만들거나 비교하지 않는다. 최초 `--freeze`만 체크포인트를 `open('x')`로 생성하며 기존 frozen 파일이 있으면 실행 전에 거부한다. 보통 재현은 전체 `execution.json`을 `checkpoints/expected-execution.json`과 비교한다.

새 runtime은 mode0700이다. Git 저장소 6개·Gradle 프로젝트·산출물 사본을 그 안에서 만든다. 기존 `modules-2`와 Gradle9.8 wrapper 배포본을 private Gradle user home으로 복사해 `GRADLE_USER_HOME`을 지정한다. 기존 캐시를 삭제하거나 쓰는 실험이 아니다. wrapper 명령에는 `--offline --no-daemon --max-workers=2`를 사용한다(버전 조회는 worker 작업이 없다). 이 상태는 필요한 의존성이 있는 복사 cache를 사용한 결과이며, cache miss·속도·비어 있는 offline cache의 성공을 검증한 것이 아니다.

## 관찰 단위

고유 native CHECK ID 22개와 미실행 설명 모델 6개다. 22개가 독립 실험 22회라는 뜻은 아니다. 모델은 `models.json`을 그대로 `execution.models`에 넣으며 native PASS를 붙이지 않는다.

- branch toy: working file `value=1`만 바꾸었을 때 두 ref는 baseline을 가리킨다. index에1을 저장하고 working을2로 바꾼 뒤 commit하면 committed/index1과 working2가 다르다. 추가 commit 때 branch는 움직이지만, 이동 명령을 하지 않은 lightweight `demo-v1` tag는 기존 commit을 가리킨다. tag가 원천적으로 이동 불가능하다는 증거가 아니다.
- merge/rebase/squash는 각각 독립 toy 저장소다. `--no-ff` merge의 parent2개와 기존 feature ancestor, rebase의 parent·SHA 변화, squash 후 feature와 같은 tree이지만 feature commit2개는 trunk ancestor가 아님을 실제 Git으로 검사한다. feature ref의 원래 commit 객체가 삭제됐다는 뜻은 아니다.
- conflict toy는 같은 Python 한 줄을2와3으로 바꿔 실제 conflict·unmerged file을 만든다. 추가 resolved 예시는 양쪽 값을 보존해 `2+3=5`를 assert하고 stdout5·merge parent2개를 확인한다. Java Calculator와 별개 예시다.
- 모든 toy 저장소 remote0이다. 고정 test author/time을 사용해 사본·경로와 무관하게 이 예시의 commit SHA가 재현되도록 한다. 사용자 프로젝트 Git에는 변경 명령을 실행하지 않는다. 로컬 trunk를 호스팅 보호 브랜치나 실제 PR로 부르지 않는다.

## 명령 나열과 테스트 게이트는 다르다

같은 추가 Calculator는 `add(2,3)`의 정답5를 검사한다. bad 버전은 `left-right`여서 -1, fixed 버전은 `left+right`여서5다. Jupiter6.0.3의 테스트 메서드1개를 아래 세 번 실행한다.

1. `build-ungated.gradle`: `clean test bootJar`가 exit1이고 JUnit1fail이지만, 실제 task 로그에서 bootJar가 test보다 먼저 실행되어 JAR가 이미 존재한다. frozen fact `ungated-test-failure-can-leave-boot-jar`에 task 순서·JAR byte/SHA가 있다.
2. `build.gradle`: 추가로 `tasks.named('bootJar') { dependsOn tasks.named('test') }`를 명시한 commit을 만든다. 같은 bad Java·같은 명령에서 clean 후 test실패, bootJar 미실행·JAR목록빈값을 확인한다. 여기서 nojar는 명시한 추가 의존성 조건 아래의 관찰이다.
3. Java만 fixed 버전으로 바꿔 commit한다. 같은 명령이 exit0/JUnit1pass이고 Boot JAR를 생성한다.

원문 명령의 task 나열만으로 테스트 실패 시 항상 JAR가 없다고 일반화하지 않는다. Gradle task 의존성과 CI job의 `needs`·후속 job skipped는 다른 층이다. 실제 GitHub/GitLab/Jenkins/Azure job이나 승인·필수 상태 체크는 실행하지 않았다.

첫 probe의 잘못된 nojar 예상은 `attempt-01-ungated/`에 원 build·실제 로그·JAR 관찰과 함께 남겼다. 그 뒤 gated 관찰이 모두 통과한 probe에서 harness의 CHECK 개수 상수20과 실제21이 달랐던 오류는 `attempt-02-counter-assertion/`에 남겼다. 최종 runner는 ungated 관찰까지 매번 재현하고 실제22개 ID를 검증한다. 과거 실패 로그를 최종 성공 근거로 사용하지 않는다.

## Java·artifact 근거

- 추가 Java21.0.6/Gradle9.8.0/Boot4.1.1/Spring core7.0.9/Jupiter6.0.3. Calculator·NativeApplication main class major65와 JAR 안의 class byte를 대조한다.
- resolved runtime artifact21, test artifact29, 두 목록의 coordinate 합집합29. 빌드 플러그인 전체 의존성 수가 아니다. JAR nested library20은 다른 분모다. `dependencies.json`에 coordinate/SHA, `runtime-last.json`에는 실제 private 파일 경로를 남긴다.
- ungated bad JAR: 9,102,149bytes, SHA256 `33c4378dbfc45d9f8b16809c0fd15217497a98049745594d4985cb8d431d178f`.
- gated fixed JAR: 9,102,150bytes, SHA256 `cb98ccd236de823588ba31801de2b82cffd89649b4d35209ae881c0f4c40e295`.
- 실제 commit↔source file SHA↔build exit↔JAR SHA를 별도 관찰 metadata에 연결한다. JAR 안에 Git SHA를 넣었다고 주장하지 않는다. archive timestamp 제거·순서 고정은 이 예시의 재현 설정이며 모든 OS/JDK/빌드 입력의 보편적 재현성 인증이 아니다.
- 같은 fixed JAR를 private `dev/app.jar`, `stg/app.jar`, `prod/app.jar` 폴더로 복사해 byte/SHA 동일을 확인한다. 실제 환경·컨테이너 image·registry digest·승격·서비스 기동이 아니다.
- `records/freeze/`, `records/replay/`에는 해당 명령 stdout/stderr와 실제 JUnit XML·리포트 HTML을 보존한다. XML의 시간·소요시간, 로그의 runtime 경로는 원자료이고 canonical execution의 비교값이 아니다. `runtime-last.json`과 private runtime의 `runtime.json`은 명령별 argv/exit/실제 로그 위치를 보존한다.

## 미실행·한계

원문 Java25, 원문 bash/YAML/Groovy 파이프라인, hosted CI/PR/approval/branch protection, remote push, credentials/secrets, Docker/image registry, Kubernetes/Argo, 실제 조직 dev/stg/prod, DB·HTTP·앱 기동·동시성·배포·성능·보편 오류율은 검증하지 않았다. NativeApplication은 compile/Boot JAR만 만들었고 `java -jar`로 시작하지 않았다. JUnit은 Calculator를 직접 생성한 단위 테스트이며 Spring context·proxy·HTTP 검사가 아니다. 고정 Git author/date와 같은 머신의 재현은 실제 CI 보안·승인·릴리스 정책을 증명하지 않는다.

모델6은 main 담당자가 공식 문헌과 대조한 미실행 설명이며 native CHECK와 구분한다. 연구·UI·실제 이미지 검수는 이 runner 범위 밖이다. 코드·fixture/frozen의 SHA 및 재현 전체 일치는 `fixture-manifest.json`, `freeze-verification.json`, `main-fresh-verification.json`과 실제 로그를 기준으로 확인한다.
