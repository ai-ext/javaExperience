# D01 원자료 대조 메모

확인일은 모두 2026-10-20이다. 아래는 공식 문서 또는 주장 저자의 원문을 직접 열어 확인한 요점이다. 검색 결과 snippet만 확인된 자료는 본문 근거로 쓰지 않았다.

## 질문별 판정

1. **Git branch와 GitHub Flow — 확인.** Git Book은 branch를 commit을 가리키는 가벼운 이동 포인터로 설명한다. GitHub Flow 문서는 branch 생성, 수정 후 commit/push, PR feedback/checks, 승인 후 merge를 설명한다. branch는 폴더/환경이 아니며 GitHub Flow 자체는 운영 배포 절차를 보장하지 않는다. PR 승인과 configured status checks를 따로 봐야 한다.
2. **CI, runner, Gradle gate — 확인.** Fowler 원저는 팀원의 잦은 통합과 매 통합의 테스트 포함 자동 빌드, 빠른 통합 오류 탐지를 정의에 둔다. Gradle Java Plugin의 `assemble`→`jar`, `check`→`test`, `build`→`check`+`assemble` 의존관계를 공식 문서에서 열어 확인했다. `assemble`로 archive가 생기는 사실과 `check` 통과는 서로 다른 신호다. pipeline job/runner는 작업 실행, 운영 앱 서버는 제품 요청을 처리하는 별도 역할로 적는다.
3. **Artifact/cache, 동일 산출물, Docker — 확인.** GitHub Actions 문서는 artifact를 workflow 산출물의 보관·전달, cache를 반복 사용 파일 재사용으로 구분한다. artifact 기능만으로 immutable build 또는 같은 byte promotion이 자동 보장되지 않는다. Docker 공식 문서는 tag를 갱신 가능한 참조, digest를 특정 콘텐츠의 식별자로 설명한다. digest는 동일한 이미지를 참조하는 데 쓰되 실제 배포의 증거로 확대 해석하지 않는다.
4. **12-Factor와 환경 — 확인.** config 분리, dev/prod parity, build-release-run의 분리 원칙을 직접 확인했다. 원칙은 고정된 local/dev/stg/prod 4개 환경이나 물리 서버 4대를 규정하지 않는다. GitHub environments는 승인/branch/protection/secrets 정책을 설정 가능하게 하는 기능이지 무조건 적용되는 만능 배포 보증이 아니다.
5. **Deployment와 release — 확인.** Fowler CI 원문은 release to production을 사업 결정과 연결하며 CI/CD/continuous deployment를 구분한다. Fowler Feature Toggles 원문은 feature toggle을 통한 공개 제어 개념을 확인했다. 프로젝트 폴더 복사, 로컬 JAR 생성, CLI 명령 자체로 원격 배포나 공개를 단정할 수 없다.
6. **Rollback과 postmortem — 확인.** Google SRE 원문 및 Workbook은 blameless incident analysis, 기여 요인 분석, 후속 action의 소유·추적·완료를 강조한다. 앱 이미지 복원은 DB schema나 메시지/외부 부작용을 자동 취소하지 않는다. 복구 전략은 호환성을 확인하고 관측으로 회복을 검증하는 운영 판단이다.
7. **원문 시각화/실행 — 검토.** 세 Mermaid flow/sequence/flowchart는 예시 흐름이다. 승인·CI·artifact 저장·환경 승격·rollback 선택이 자동 또는 항상 구성된다는 뜻으로 읽히지 않도록 주석이 필요하다. 원문의 fenced shell 예시는 6개, Mermaid는 3개, Kotlin 구성 예시는 1개다. 이들 명령·빌드·배포를 실행하지 않았다. 버전·프로젝트 전제와 성공 결과를 확인한 것으로 표현하면 안 된다.

## 직접 확인 및 한계

- GitHub Flow 문서는 branch/commit/push/PR/review/check/merge 과정을 설명하지만 사용자의 실제 repository 설정을 말해주지 않는다.
- Gradle은 `current` 공식 문서를 확인했으며 페이지에 당시 표시된 버전은 9.8.2다. 원문 예시의 Gradle wrapper/Boot plugin 설정에 동일 task graph가 어떻게 추가됐는지는 로컬 프로젝트를 실행하지 않아 확인하지 않았다. Java plugin의 일반 관계만 주장한다.
- Google SRE 자료는 조직 경험과 권고다. 모든 팀에 동일 postmortem 절차가 법칙처럼 적용된다는 뜻은 아니다.
- 시간 수치, 비용/가격, SLA, 이 저장소의 workflow·환경·권한 상태는 확인하지 않았고 추정하지 않았다.
- 조사 자체는 문헌 웹 열람뿐이다. Java/GitHub CI/Gradle/Docker 실행, remote Git, registry, 실제 환경 배포는 수행하지 않았다.
