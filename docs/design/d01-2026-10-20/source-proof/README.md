# D01 개발 생명주기 추가 실행

원문 277줄·9개 fence(Mermaid 3, Kotlin 1, bash 5)를 source.json의 SHA 및 original/ 사본과 대조했다. 들여쓴 bash도 원문 바이트를 유지한다. 원문의 Java25/Spring Boot 앱과 pull·push·PR·CI·registry·Docker·배포 명령은 실행하지 않았다.

추가 fixture는 plain Java21.0.6/Gradle9.8.0 CLI다. 매회 연구 폴더의 새 0700 run 아래 새 Git 저장소를 만들고, 빈 template·격리된 Git 설정·공개 demo identity·고정 시험 날짜를 사용한다. Git 초기화 후 repo 권한은 실측 0755이며 상위 run 0700으로 보호된다. 사용자 저장소는 원문/gradlew 읽기와 HEAD 보존 비교만 한다. 원격은 0개다. 전체 35개 명령은 새 fixture에서 실행한다.

B0(ad83bab69c2a4a2142fc73af56bbabc9206a913a)는 baseline, F1(065fee8e02b20313e961b1a68741932a5f49e40e)은 의도한 중복 구현, F2(318b31f2e3688e584a8f18c833ecec05c2f53e4f)는 HashSet을 쓰는 수정이다. 고정 시험 입력으로 재현되는 이 SHA는 사용자 커밋이 아니다. baseline 포인터는 B0를 유지하고 feat/post-like-demo는 2개 커밋 뒤 F2를 가리킨다.

추가 계약은 post42/actor7 좋아요를 두 번 호출해 1개를 기대한다. F1 assemble은 exit0/JAR 생성이지만 CLI는 2개, check는 exit1이다. 추가 local copy gate는 실패한 check와 review=true 입력에서 사본을 만들지 않았다. 실제 PR 승인이나 branch protection이 아니다. F2 build는 exit0/관찰1/CLI contract PASS1이다. 기본 test 작업은 NO-SOURCE이며 JUnit·HTTP·DB·동시성 검사가 아니다. HashSet은 순차 메모리 사례로 DB UNIQUE나 인증·동시성 보장을 증명하지 않는다.

실제 JAR는 2859바이트, SHA-256 6e52d10485e682154f7f1a02a2f898eccab91e89608afb047e3d828f06c4fda0이다. manifest의 Main-Class=example.lifecycle.LikeDemo, Implementation-Version=1.0-demo, Source-Revision=F2 전체 SHA를 실물과 대조했다. Git SHA-1과 JAR SHA-256은 서로 다른 대상을 식별한다. 이미지 digest·서명·registry attestation 검사는 아니다.

같은 검증된 JAR를 한 머신의 environment-copies/dev·stg·prod/app.jar에 복사하고 바이트/SHA가 같은지 확인했다. 실제 서비스 배포가 아니다. 각 CLI 실행의 env 표시는 dev/stg/prod, DB 별칭 문자열은 d01-demo-dev/stg/prod, 좋아요1이었다. DB 연결·Spring profile·실제 환경 구성 없이 출력 문자열만 다르며 Git 브랜치는 그대로다. 같은 JAR의 추가 CLI flag=false는 좋아요0, true는1이다. 공개 릴리스·HTTP 트래픽·feature flag provider를 실행한 결과가 아니다. 12-factor의 release(build+config)와 사용자에게 기능을 공개한다는 의미는 구분한다.

새 fixture 프로젝트의 .gradle만 자체 run으로 이동해 archive JAR가 남는지 확인한 뒤 clean build를 실행했다. 결과 exit0/동일 JAR SHA다. 이 fixture는 Jar timestamp를 끄고 항목 순서를 고정했다. 모든 빌드의 재현성이나 속도를 주장하지 않는다. 글로벌 Gradle/의존성 캐시는 삭제·이동하지 않았고 Gradle이 재사용·갱신할 수 있다. 마지막 private Git clean/원문 SHA/사용자 HEAD 보존을 검사했다.

11개 CHECK는 위 실제 추가 실행의 검사 단위다. 별도 3개 모델을 운영 실험으로 세지 않는다. review-and-check는 check AND review의 네 Boolean 행, schema-compatibility는 oldRequires={like_count}와 컬럼 이름 집합만 비교해 기존 true/이름 변경 false/기존 이름을 남긴 추가 true를 계산한다. DB migration·rollback은 없다. incident-options의 조건부 rollback·flag·hotfix·회복 관찰·후속 조치는 원문에 근거한 미실행 선택지다. 실제 장애·알림·SLA·복구시간·postmortem을 측정하지 않았다.

일반 재현: `python3 docs/design/d01-2026-10-20/source-proof/run-proof.py --runtime-root /Users/ds/research/javaexperience-d01-20261020/_data/runtime`. --freeze는 새 관측을 의도적으로 확정할 때만 쓰며 일반 재현에는 넣지 않는다. main 최종 fresh replay와 별도 임시 사본의 독립 재현이 11개 검사·3개 모델 전체 JSON에서 frozen과 일치했다. raw Gradle 로그는 실패 표본도 그대로 보존한다. Gradle 공식 current 문서는 조사 시 9.8.2였고 버전 고정 9.8.0 웹 문서는 접근 실패했다. 실제 wrapper 9.8.0 실행과 current 문헌 확인을 혼동하지 않는다.
