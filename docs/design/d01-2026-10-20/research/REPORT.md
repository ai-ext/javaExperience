# D01 개발생명주기 문서 사실검증 보고서

- 대상 사본: `_data/D01-source.md`
- 확인일: 2026-10-20
- 판정 범위: 공식·원저자 자료와 개념 정확성 대조. 원문은 수정하지 않았다.

## 총평

문서는 커밋/브랜치/PR/CI/아티팩트/환경/배포/릴리스/장애 대응을 구별하려는 방향이 대체로 정확하다. 다만 전체 흐름 그림과 일부 단계 문구는 브랜치 검토에서 운영까지 하나의 필연적인 자동 경로처럼 보일 수 있다. GitHub Flow는 협업을 위한 lightweight branch-based workflow다. GitHub 문서의 흐름은 branch 생성, 변경·commit·push, PR 피드백과 설정된 checks, 승인·merge이며 기본 브랜치에 변경이 나타난다는 설명까지다. 운영 배포가 이에 자동 결합된다는 뜻은 아니다. 승인(review approval)과 status check/CI는 서로 별개다. 저장소 정책에 따라 승인 수, 특정 팀 승인, 필수 check 등이 달라질 수 있다. Git branch는 commit을 가리키는 이동 가능한 참조(pointer)다. 따라서 폴더 복사본이나 서버·배포 환경이 아니다. 이 핵심 설명은 정확하다.

CI 설명도 핵심은 맞지만, Fowler 정의에 맞추려면 “자동화 서버 설치”보다 팀의 잦은 통합과 각 통합에 대한 테스트 포함 자동 빌드, 빠른 오류 피드백을 강조해야 한다. pipeline/job은 작업 순서·조건이고 runner는 job의 명령을 실행하는 작업 환경이다. 애플리케이션 운영 서버와는 역할이 다르다. Gradle Java plugin에서 `check`는 `test`에 의존하는 검증 집계 작업, `assemble`은 `jar`에 의존하는 archive 조립 작업, `build`는 `check`와 `assemble`에 의존하는 집계 작업이다. 따라서 `assemble`로 JAR가 만들어질 수 있어도 테스트 검증 성공을 뜻하지 않는다. `build`의 실패와 산출물 파일의 존재 여부도 별개의 사실이다. 게이트는 어떤 검사 성공을 배포 조건으로 삼는지 정책을 확인해야 한다. 이 구분은 Boot plugin 등의 추가 task 구성에 따라 세부 결과가 달라질 수 있다.

GitHub Actions artifact는 workflow/job에서 생성해 보관하거나 job 사이 전달하는 결과 파일이고, cache는 재생성 비용이 큰 의존성·중간 파일의 재사용을 돕는다. artifact에는 build/test 결과, binary 등이 포함될 수 있다. artifact 보관만으로 commit 식별·변조 방지·동일 byte의 환경 간 승격이 자동 보장되지는 않는다. 문서는 commit SHA, 체크섬 또는 provenance/attestation 등 연결 근거를 기록하고, 검증한 artifact/image를 각 환경에서 재사용하는 방식을 권한다. 환경별 재빌드는 같은 소스여도 빌드 입력과 시점 차이가 생길 수 있다. Docker tag는 다시 가리키는 대상이 바뀔 수 있고 digest는 특정 이미지 콘텐츠를 식별한다. digest 고정은 동일 이미지 참조에 유용하지만 배포 실행이나 런타임 상태까지 증명하지 않는다. Docker는 실행하지 않았다.

12-Factor의 config는 배포마다 달라지는 값을 코드와 분리해 환경 변수 등으로 주입하라는 원칙이며, dev/prod parity는 개발·운영 간 차이를 줄이자는 원칙이다. build-release-run은 빌드, 설정을 결합한 release, 실행 단계를 구분한다. 이 원칙들이 local/dev/stg/prod라는 고정 4단계나 서버 4대를 요구하지 않는다. 각 명칭과 개수는 팀의 목적·구성에 따른다. GitHub Actions environments는 deployment target을 나타내고 승인 요구, branch 제한, 보호 규칙, secrets 접근 제한을 설정할 수 있지만, 실제로 설정된 정책과 GitHub 상품·저장소 조건의 범위 안에서만 작동한다. 환경 기능을 썼다는 이유만으로 모든 배포에 보호가 자동 적용된다고 일반화하지 않는다.

배포(deployment)는 소프트웨어를 환경에 설치·실행하는 기술적 행위, release는 기능을 사용자가 이용할 수 있도록 공개하는 결정/시점으로 구분하는 편이 정확하다. 기능 플래그는 배포와 공개를 분리하는 한 방법이다. 폴더에 artifact를 복사하거나 개발용 JAR를 만들거나 CLI 명령이 성공했다는 사실만으로 원격 환경 배포, 서비스 기동, 사용자 공개가 입증되지는 않는다.

롤백은 앱 버전을 되돌리는 절차이지 DB schema, 이미 발행한 메시지나 외부 부작용까지 자동 역변환하는 보장이 아니다. 이전 버전이 변경된 schema·데이터와 호환되는지 확인하고, 복구 후 지표로 회복을 관찰해야 한다. 위험과 영향에 따라 rollback, 기능 flag 비활성화, hotfix 등 완화책을 선택한다. Google SRE의 blameless postmortem은 개인 탓 대신 기여 요인과 시스템 개선을 다루며, 후속 action에는 소유자와 추적·확인 기준을 붙여 실제 완료를 관리한다. 회고를 적었다는 것만으로 재발 방지가 완성되지는 않는다.

## 원문 시각화·실행 예시에서 오해가 생길 수 있는 지점

1. 첫 lifecycle Mermaid(원문 9행): branch/PR에서 CI를 통과하고 artifact가 dev→stg→prod로 순차 승격되는 흐름은 개념도다. 실제 workflow, 자동 배포, 환경 수, 승인 조건이 구성됐다는 증거가 아니다. `CI 실패→구현` 또한 가능한 피드백이지 모든 실패 원인의 해결 경로는 아니다.
2. sequenceDiagram(92행): `CI 통과→Reg`, 동일 버전 승격, 리뷰어가 환경 검증에 참여하는 역할은 구현 예시다. GitHub Flow만으로 registry 업로드·환경 배포·검증 주체를 보장하지 않는다. 승인과 CI 통과가 독립 조건임을 유지해야 한다.
3. 장애 flowchart(126행): 이전 버전이 안전할 때 rollback, 기능만 차단 가능한 경우 flag, 수정이 더 안전하면 hotfix라는 선택은 의사결정 예다. DB·메시지 호환성·외부 효과를 자동 판단하거나 각 경로를 실행하는 도구가 아니다.
4. 1절의 `운영 배포`, “검증한 결과물은 dev·stg를 거쳐 운영으로 승격” 문구는 구성된 배포 파이프라인의 전형을 설명하도록 한정해야 한다. branch/merge/CI와 운영 적용을 직접 연결하는 일반 규칙은 아니다.
5. 3절 표의 처리 시간은 “경험적 감각”으로 표시되어 있지만 근거 있는 일반 수치가 아니다. 독자에게 SLA나 보장치로 기억될 수 있어 이 검증에서는 사실로 확인하지 않았다. 수치 추정은 채택하지 말고 삭제하거나 팀 데이터에 기반한 별도 설명으로 바꾸는 편이 낫다.
6. 4절에는 fenced 실행 명령 예시가 6개 있다(163, 174, 182, 191, 197행 주변). 전제인 Boot 4.1.1/Java 25 프로젝트, Gradle wrapper와 파일 구조가 이 조사에서 확인되지 않았다. `./gradlew clean build` 및 `find build/libs`는 로컬 검증 예일 뿐 원격 CI, registry, 배포 증거가 아니다. 테스트 실패와 artifact 유무는 나눠 판정해야 한다. `git pull`, branch push는 원격 저장소와 인증·정책이 있어야 하며, 운영 반영을 뜻하지 않는다. Spring profile·DB 설정도 예시일 뿐 해당 코드 구성에서 실제 동작한다고 확인하지 않았다.
7. 세 Mermaid 그림 및 Gradle/Kotlin·shell 블록은 원문 파일에 적힌 예시다. 이번 확인은 문서를 실행하거나 Java 25/Boot build, CI, Docker, 원격 저장소·registry, dev/stg/prod를 실행하지 않았다. 실행 성공, 파일 생성, 이미지 digest, 배포·공개를 관찰한 결과로 인용해서는 안 된다.

## 우선 정정 권고

- “아티팩트와 commit을 연결”에 SHA/digest/provenance를 기록하고, 동일 byte를 다음 환경에 승격하는 전제와 예외를 붙인다.
- Gradle 예시는 `assemble` 산출물과 `check` 검증을 구별한다. 테스트가 실패해도 별도 `assemble` 실행은 JAR를 만들 수 있으며, artifact 존재를 release gate 통과로 취급하지 않는다.
- lifecycle 그림과 단계표에 “예시 흐름; 자동화·환경·승인 설정은 팀별”을 표시하고 merge/deploy/release를 서로 다른 사건으로 명료화한다.
- 실습 안내에 미실행·미검증 범위를 눈에 띄게 붙인다. 실제 배포를 확인하려면 대상 환경의 deployment 기록, 실행 버전/commit, 관측 지표 등 별도 증거가 필요하다.
- 시간 감각 표는 일반 사실처럼 보이지 않도록 제거하거나 현장 측정값으로 대체한다.

출처 접근 상태는 `_data/source-access.json`, 대조 메모는 `_data/source-notes.md`에 기록했다.
