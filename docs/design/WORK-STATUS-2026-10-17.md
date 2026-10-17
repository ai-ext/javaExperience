# javaExperience 작업 상태 · 2026-10-17

## 브랜치와 PR

- 작업 트리: `$HOME/IdeaProjects/javaExperience-repo/.worktrees/visual-learning-next`
- 브랜치: `docs/visual-learning-next` · HEAD `c90e2fe`, `origin/main`보다 로컬 커밋 2개 앞섬 · 기존 변경을 보존하며 작업 중
- 원격: `ai-ext/javaExperience`
- `git ls-remote --heads origin docs/visual-learning-next` 결과: **같은 이름의 원격 브랜치 없음**. `gh pr list --state all --head docs/visual-learning-next` 결과: **이 브랜치의 PR 없음**. 로컬 커밋 2개가 있고 이번 추가 변경은 미커밋이다. 이 상태는 조회 시점의 기록이며 원격 상태는 다시 확인할 수 있다.

## 의도와 기록 위치

루트 [intent.md](../../intent.md)는 “첫 화면에서 API·Java 객체·SQL·DB 행을 쉽게 연결하고 기술 깊이는 보존한다”는 목표와 `verified` 완료 조건이다. 원문·생성 HTML의 항목별 전수조사는 `visual-inventory.jsonl`과 `open-panel-census.jsonl`, 페이지별 진행은 `verification-page-ledger.jsonl`, 이미지별 진행은 `verification-image-ledger.jsonl`과 `visual-parity.jsonl`에 기록한다. 사람이 읽는 [검증 진행표](VERIFICATION-BOARD.md)와 [사용자 이미지 체크표](USER-IMAGE-HTML-CHECKLIST.md)는 이 기록을 요약한다.

## 이번 확인 및 구현

- 현재 HTML **339쪽** · 시안 대조 기록 **430건** · 일부 장면 적용 **43쪽** · 의미 장면 미분할 **296쪽** · 페이지 전체 검증 완료 **0쪽**.
- 사용자가 처음 전달한 21장과 추가 28장은 각각 의미 장면의 HTML 구현 근거를 대조했다. 이는 시안의 모든 상태나 원문 전체를 이관·검증한 판정이 아니다. 두 묶음의 데스크톱·360px 동일 뷰포트 검증 및 학습자 이해 검증은 남았다.
- 홈의 주 버튼을 **0-1 첫 API**로 연결하고, 1-1 게시글 API와 DB-01 SQL은 보조 첫 경로로 정리했다. 시나리오 목차에도 같은 시작 경로를 추가하고, “저장 후 id 받기”가 실제로 일어나는 단계를 1-1이 아닌 **1-2**로 교정했다. 0-1과 1-1에는 DB 저장이 없다는 경계를 표시했다.
- P02에 기존 시안 05의 `name` 값 전달 조작, 시안 06의 HTML/JSON 경로 선택 장면을 추가했다. 기존 이미지는 참조 링크로 보존했다. S09 시안 03은 이미 있는 객체·스냅샷·SQL·별도 DB 연결의 상세 시뮬레이션을 확인해 `implemented`로 기록했다.
- 사이트 빌드: HTML 339개·링크 오류 0. 사이트 정적 테스트 39/39, HTML 구조 감사 339쪽에서 중복 ID·깨진 ARIA 참조·깨진 내부 앵커 0. `audit:visual`, `audit:version-cards`, `audit:parity`, `git diff --check` 통과. 정적 검사 통과를 브라우저·서버 실행 완료로 쓰지 않는다.
- Chrome에서 현 브랜치의 `index.html`을 실제로 열어 확인했다. 이번 변경 뒤 홈·시나리오 목차·P02의 최신 데스크톱/360px 조작은 아직 다시 확인하지 못했다. 브라우저 자동 보안 검토가 `file://` 탭 관찰을 허용하지 않아 우회 없이 중단했다. 사용 중인 기존 `http(s)` 미리보기 주소가 있다면 그 환경에서 이어서 확인한다. 이전 실제 화면 확인 범위는 [라이브 HTML QA 기록](LIVE-HTML-QA-2026-10-17.md)에 적었다.

## 남은 에이전트 검증과 사용자 검토

1. 홈과 시나리오 목차에서 0-1, 1-1, DB-01로 실제 이동하고 360px의 시작 경로를 확인한다. 허용된 `http(s)` 미리보기 주소가 필요하며 `file://` 차단을 다른 브라우저·서버 우회로 넘지 않는다.
2. P02의 `name` 입력, HTML/JSON 선택, 이전·다음 장면, 키보드 포커스를 데스크톱·360px에서 확인하고 시안 05·06과 같은 뷰포트로 대조한다.
3. 시안이 연결된 43쪽의 각 장면·토글을 원문과 시안에 대조하고, 현재 캡처·조작 증거를 남긴다. 296쪽은 의미 장면 분할부터 진행한다. 각 페이지의 기술 검증과 실제 Spring/API/DB 결과는 별도로 기록한다.
4. 에이전트 게이트가 끝난 화면부터 사용자에게 **첫 행동의 명확성, 고등학생에게 전달되는지, 깊이·타이포·재질의 완성도**를 검토받는다. 사용자 답변 전에는 학습자 검증 완료로 표시하지 않는다.
