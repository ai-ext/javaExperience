# SOURCE.md 보충 노트 (원문 보존용)

아래는 원문을 직접 수정하지 않고, 정확한 위치에 덧붙일 수 있는 사실과 문구다. 직접 열람한 공식 출처만 인용했다. 미확인 항목은 확정 문구로 추가하지 않는다.

## 1. 용어 사전: branch / tag / commit

추가 권장: “Git ref는 commit 등의 객체를 가리키는 이름이다. branch는 이동 가능한 ref다. lightweight tag는 객체를 직접 가리키고 annotated tag는 tag 객체를 가리킨다. Git 객체 모델 자체는 tag ref의 변경을 막지 않으므로 release tag의 불변성은 호스팅 정책으로 보장해야 한다.”

근거: https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell , https://git-scm.com/docs/git-tag

## 3.1 브랜치와 PR 직후

추가 권장: “GitHub Actions의 `pull_request` 이벤트는 보통 `refs/pull/<번호>/merge`를 `GITHUB_REF`로, 시험 merge commit을 `GITHUB_SHA`로 사용한다. `actions/checkout` 기본 동작도 이 ref를 검사한다. PR head만 검사하려면 `github.event.pull_request.head.sha`를 지정한다. `push` 이벤트의 SHA와 목적이 다르다.”

근거: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

추가 권장: “필수 리뷰·필수 체크·최신 base 요구·승인 stale dismissal은 repository branch protection/ruleset 정책으로 설정한다. strict check는 최신 base를 요구하고, loose는 요구하지 않는다. 새 diff 또는 base 변경에 대한 승인 무효화도 켜 둔 정책의 조건에 따라 발생한다.”

근거: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

## 3.3 CI 파이프라인 / job과 artifact 설명

기존 “GitHub Actions는 ... 각 job은 runner에서 step을 실행” 뒤에 추가 권장: “job 간 동일 작업 디렉터리 공유를 가정하지 않는다. 다른 job에서 필요한 파일은 workflow artifact 등의 명시적 전달 수단을 사용한다. `needs`로 의존하는 job은 선행 job의 상태에 따라 기본적으로 실행되지 않을 수 있다. 실패 처리·정리 목적의 후속 작업은 `if: always()` 등 조건을 명시하고 배포 단계에는 별도 성공 조건을 둔다.”

GitHub 공식 출처: https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts , https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching

“캐시는 재생성 가능한 반복 데이터의 속도 개선, artifact는 실행 산출물 저장·공유” 문장은 유지하되, cache를 job 간 산출물 전달 수단으로 표현하지 않는다.

## 3.4 GitOps와 Argo CD

“repository server는 Git의 revision에서 매니페스트를 생성한다. application controller는 live state와 desired state를 비교해 OutOfSync를 판단하고 설정에 따라 교정한다. Sync 결과와 health 평가는 별도 상태다.”

근거: https://argo-cd.readthedocs.io/en/stable/operator-manual/architecture/

현재 자동 sync 설명 뒤에 추가 권장: “자동 sync는 기본적으로 활성화되는 전역 보장이 아니다. `prune`와 `selfHeal`은 별도 옵션이다. 자동 sync는 동일 commit SHA/parameter 조합에서 중복 실행을 제한하고, 같은 조합의 실패 sync를 자동으로 다시 시도하지 않는다. retry 정책을 별도로 설정할 수 있으며 self-heal은 drift 처리에 영향을 준다. rollback 동작은 자동 sync 설정의 제약을 받는다.”

근거: https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/

조정 주기 “120초 + 최대 60초 jitter”는 현행 설치의 고정값처럼 쓰지 않는다. 이번 조사에서 stable alias 문서 본문에서 수치를 직접 재확인하지 못했다. 사용하려면 대상 Argo CD 버전 문서 및 `timeout.reconciliation` 설정을 확인한 뒤 버전·설정 조건을 함께 기록한다.

## 4.2 GitHub Actions YAML 예시

요청된 YAML의 `actions/checkout@v4`와 `actions/setup-java@v4`는 보존한다. 바로 아래 주석/캡션에 다음을 붙인다: “이 예시의 action major는 보존된 예시 버전이다. 2026-10-21 조사 시점의 upstream README는 checkout v5를 표시하며, setup-java는 v6를 최신 안정판으로 안내하고 v1-v4를 deprecated로 표시한다. 신규 workflow에서는 현재 공식 release와 조직의 pinning 정책을 확인한다.”

근거: https://github.com/actions/checkout , https://github.com/actions/setup-java

## 5. 자주 하는 오해: secret 항목에 보충

기존 “포크 코드나 로그가 민감 값을 노출할 수 있다” 뒤에 추가 권장: “일반 `pull_request`의 fork 실행은 기본적으로 write token 권한과 repository secrets가 제한된다(저장소/조직 설정 예외와 Dependabot 제한을 확인). `pull_request_target`은 base/default branch의 privileged 문맥으로 동작한다. 이 문맥에서 untrusted fork 코드를 checkout해 실행하면 위험하므로 이벤트만으로 안전하다고 판단하지 말고, 권한·checkout 대상·실행 경로를 함께 검토한다.”

근거: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows , https://docs.github.com/en/actions/reference/security/secure-use

## 6. Delivery, immutable image

문장 보충: “수동 운영 승인은 Continuous Delivery와 양립한다. 운영 자동 반영까지 무인으로 수행하는 Continuous Deployment와 구분한다. 컨테이너 tag는 가변 별칭일 수 있으므로, 검증한 동일 콘텐츠를 승격한다는 보장은 digest 또는 레지스트리 불변 태그 정책으로 표현한다.”

## 미확인으로 남긴 항목

- Spring Boot 4.1-SNAPSHOT 문서 URL은 직접 열기에 실패했다. Boot 4.1 안정판 및 Java 25/Gradle 조합 호환성을 확정하지 않는다.
- Gradle current compatibility 표에서 Java 25 항목을 찾지 못했다. 사용 중인 Gradle wrapper 버전을 확인하지 않았으므로 실제 빌드 지원 여부는 미확인이다.
- Sonar 서버/플러그인/품질 게이트 및 DB 서비스 기반 통합 테스트는 로컬에서 실행하지 않았다.
- Argo CD 120초 + 60초 jitter의 현행 적용 여부는 설치 버전과 설정값 확인 전까지 고정 사실로 인용하지 않는다.
- registry digest 조회/promotion, CI job isolation/`needs`·`always()`의 상세 YAML 의미는 이번 공식 페이지 열람에서 각각 독립 문서로 완전 검증되지 않았으므로 D08 예시를 일반 패턴으로 한정한다.
