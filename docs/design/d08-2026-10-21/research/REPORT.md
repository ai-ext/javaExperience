# D08 리서치 검증 보고서

확인 시각: 2026-10-20 20:13:02 UTC / 2026-10-21 05:13:02 KST. 공식 문서와 프로젝트 저장소 문서를 직접 열어 확인했다. `_data/research.jsonl`에는 조사 수행 정보, `_data/source-baseline.json`에는 SOURCE의 참고 URL 목록이 있다. 본 보고서의 URL별 확인 결과는 [sources.json](sources.json)에 정리했다.

## 요약

D08의 핵심 흐름은 유효하다. 다만 GitHub PR 검증은 어떤 SHA를 체크아웃하는지, 보호 브랜치 옵션은 어떤 상태인지, GitHub Actions 보안 이벤트가 어떤 권한을 갖는지 구별해야 한다. Argo CD의 “자동 sync”도 승인·prune·self-heal·실패 재시도를 한꺼번에 뜻하지 않는다. 예시의 액션 v4는 보존하되 2026-10-21 현재 문서에서 확인되는 최신 major와 구버전 상태를 별도로 표시한다.

## 교정 사항

### Git 브랜치와 PR ref

Git 브랜치는 커밋 객체를 가리키는 이동 가능한 ref이고, commit은 부모를 가진 불변 이력 객체다. 태그는 ref 이름이지만 lightweight tag는 객체를 직접 가리키며 annotated tag는 별도 tag 객체를 가리킨다. 따라서 “태그는 항상 불변”은 Git 자체의 보장이 아니다. 릴리스 태그를 불변으로 취급하려면 호스팅 정책·권한으로 재지정/삭제를 막아야 한다. Rebase는 새 부모 위에 커밋을 다시 적용하므로 일반적으로 SHA가 바뀐다. Merge는 기존 이력을 연결하며, squash는 PR 변경을 하나의 새 커밋으로 만들 수 있다.

GitHub PR의 head branch/ref와 `refs/pull/<번호>/merge`는 구분한다. `pull_request` workflow에서 GitHub는 mergeable PR에 대해 merge ref를 `GITHUB_REF`로, 시험 merge commit의 SHA를 `GITHUB_SHA`로 제공하며 `actions/checkout` 기본값은 그 ref를 checkout한다. 이는 PR head 단독 검증과 다르다. head 커밋만 검사할 때에는 `github.event.pull_request.head.sha`를 명시한다. 이 SHA들은 원격 GitHub의 PR ref/시험 merge에 관한 값이며 로컬 브랜치의 커밋 SHA와 개념상 구분해야 한다.

### 보호 조건과 승인

Protected branch는 호스팅 정책이다. 필수 리뷰 수, code owner, 대화 해결, 서명, 선형 이력, status checks, merge queue 등은 설정 가능한 개별 조건이다. 필수 status check에서 “Require branches to be up to date”를 켠 strict 설정은 base 최신 상태를 요구한다. 끄면 loose 설정으로, 병합 전 최신화가 필수는 아니지만 병합 후 통합 문제가 생길 수 있다. 승인 stale dismissal도 옵션이다. diff에 영향을 주는 새 커밋이나 base 변경 등 문서가 정한 조건에서 기존 승인이 무효화될 수 있다. “항상 최신 SHA에서 승인해야 한다”를 보편 규칙으로 쓰지 말고 저장소 정책을 확인한다.

### Actions 이벤트와 보안 범위

`pull_request` 이벤트의 기본 merge ref/merge SHA와 `github.event.pull_request.head.sha`를 혼동하지 않는다. `push` 이벤트는 푸시 ref의 SHA를 기준으로 한다. 둘은 트리거와 검사 대상이 다르며, branch protection이 요구하는 검사 대상 및 merge queue 사용 여부까지 고려해야 한다.

`GITHUB_TOKEN`은 workflow 실행에 대해 발급되는 토큰이며 `permissions`로 필요한 권한만 설정할 수 있다. 일반적인 fork PR에서는 저장소 기본 보안 제한이 적용되어 write 권한과 repository secrets가 제공되지 않는 것이 기본이지만, 조직/저장소 설정으로 제한이 달라질 수 있다. Dependabot PR도 fork와 유사한 제한 대상이다. `pull_request_target`은 base/default branch 문맥에서 실행되므로 권한·secret에 접근할 수 있는 privileged trigger다. 여기에 신뢰할 수 없는 PR 코드를 checkout해 실행하면 위험하다. 실제 위험 조건은 privileged context와 untrusted code 실행/입력 결합이며, 모든 PR workflow를 일괄 위험으로 표현하지 않는다.

### 파이프라인 단위·캐시·artifact

GitHub Actions의 일반 구조는 event → workflow → job → runner → step이다. Azure Pipelines는 pipeline → stage → job → agent → step/task 용어를 쓴다. GitLab CI는 stages와 jobs, Jenkins Pipeline은 pipeline/stage/steps 및 agent/node를 사용한다. 이들은 유사한 역할을 설명하지만 제품 간 일대일 등가 구조는 아니다.

캐시는 반복 가능한 의존 데이터 재사용으로 실행 속도를 높인다. Artifact는 실행 결과를 보관하거나 job 간 전달하는 산출물이다. 두 목적은 다르며 캐시가 없어도 빌드가 성립해야 한다. GitHub Actions의 각 job은 지정 runner에서 수행되며 서로 다른 job 사이에 파일시스템 공유를 가정하지 않는다. 전달은 artifact 또는 명시된 저장소를 사용한다. `needs`는 job 의존성을 설정하고, 선행 job이 실패/건너뜀 상태이면 후속 job도 기본 성공 조건 때문에 건너뛸 수 있다. 실패 후 정리 작업에는 `if: always()` 등 명시 조건을 고려하되, 무조건 배포까지 실행시키는 용도로 쓰지 않는다.

### Delivery, Deployment, 이미지

Continuous Delivery는 배포 가능한 산출물과 릴리스 절차를 자동화하며 운영 승인/실행 단계가 남을 수 있다. Continuous Deployment는 통과한 변경을 운영에 자동 반영하는 방식이다. “CD”만으로 승인 경계를 판단하지 않는다. 배포 환경의 필수 reviewer는 별도 보호 설정이다.

이미지 tag는 이름표이며 `latest`나 버전 문자열은 레지스트리 정책상 덮어쓸 수 있다. digest는 이미지 콘텐츠를 식별하는 content-addressed 참조다. 검증된 동일 이미지를 환경에 승격하려면 digest를 추적·고정하는 방식이 재현성을 높인다. 이미지 빌드·태그 불변성·서명·promotion은 팀의 레지스트리와 배포 정책에 달려 있으며 Git 자체가 보장하지 않는다.

### OpenGitOps와 Argo CD

OpenGitOps의 네 원칙은 선언형(Declarative), 버전 및 불변성(Versioned and Immutable), 자동 pull(Pulled Automatically), 지속 조정(Continuously Reconciled)이다. 이를 “모든 배포 도구가 반드시 이 구현을 한다”는 규정으로 확대하지 않는다.

Argo CD repository server는 Git의 지정 revision에서 매니페스트를 생성·반환하고, application controller는 live state와 원하는 상태를 계속 비교해 OutOfSync를 판정하며 설정에 따라 수정 조치를 한다. Sync는 원하는 상태를 적용하는 작업이고 health는 리소스 상태의 건강도 평가다. Synced라고 반드시 Healthy인 것은 아니며, Healthy라고 원하는 revision과 일치한다고 단정할 수도 없다.

자동 sync는 기본적으로 켜져 있지 않다. `prune`(Git에서 제거된 리소스 삭제)와 `selfHeal`(클러스터의 수동 drift 재조정)은 별도 옵션이다. 자동 sync는 한 commit SHA/parameter 조합에 대해 한 번만 시도하며, 같은 조합의 이전 실패 sync를 자동 재시도하지 않는다. Retry는 `syncPolicy.retry`로 구성할 수 있는 별도 정책이다. `selfHeal`은 동일 revision drift 조정에 영향을 준다. 자동 sync 앱의 rollback 제약도 문서상 존재하므로 “자동 sync면 언제든 Argo rollback”으로 단순화하지 않는다.

문서의 기본 reconciliation 주기 120초 + 최대 60초 jitter는 Argo CD 버전과 `timeout.reconciliation` 설정에 조건부인 값이다. 이번 직접 열람한 stable 문서에서는 해당 숫자의 현재 문구를 재확인하지 못했다. 따라서 현행 고정 기본값으로 보고서에서 단정하지 않고, 설치 버전의 기본값 및 ConfigMap 설정 확인 대상으로 남긴다.

## Java/Gradle/Spring Boot/Sonar/DB의 검증 경계

SOURCE는 Java 25, Spring Boot 4.1, Gradle wrapper, Sonar, DB가 붙는 예시 조건을 제시한다. 이번 조사는 이 작업 폴더의 프로젝트를 native build/run 하지 않았고 실제 서비스, DB, CI, registry, Kubernetes를 사용하지 않았다. 따라서 실제 프로젝트가 해당 버전 조합으로 빌드되는지, Sonar 서버/품질 게이트 연결, 통합 테스트의 DB 구성은 검증되지 않았다.

직접 연 Gradle current compatibility 문서에서는 Java 25 항목을 찾지 못했다. Spring Boot 4.1-SNAPSHOT 공식 URL은 직접 열기에 실패했다. 따라서 현재 안정판 Boot 4.1 및 Gradle 조합 호환성은 미확인이다. GitHub의 `setup-java` 공식 저장소는 현재 v6 예시를 표시하며 v1–v4 deprecated라고 적는다. `checkout` 저장소는 v5를 최신 목차로 표시하지만 v4 전용 사용법도 보존한다. 요청된 기존 YAML의 `actions/checkout@v4`, `actions/setup-java@v4`는 역사적 예시로 그대로 둘 수 있으나 현재 권장 major처럼 제시하면 안 된다. 예시는 고정된 버전·runner image·Sonar 설정·DB 서비스를 보여주는 실행 검증본이 아니다.

## SOURCE에서 원문 수정 없이 보충할 권장 위치

정확한 추가 문구 후보는 [source-notes.md](source-notes.md)에 기록했다. 핵심은 3.1의 GitHub ref 문단, 3.3의 Actions 구조·job 격리 문단, 3.4의 Argo sync/health 및 버전 조건, 4.2의 v4 표기, 5절의 `pull_request_target`·GITHUB_TOKEN 설명이다.
