# main 병합 준비 검토 — 2026-10-25

**판정: 현재 원본 브랜치 그대로 main 병합은 보류한다. 최신 main 기반 정제 통합 후보를 만든 뒤 재검증해야 한다.** 미착수108개 개념을 모두 개발해야 기존 성과를 반영할 수 있다는 뜻은 아니다. 아래 공개 이력·충돌·통합 검증 관문을 먼저 해결하면 구현된 범위를 나눠 반영할 수 있다.

## 검토한 입력

| 구분 | 고정 값 |
|---|---|
| 작업 공간 | /Users/ds/code/javaExperience/.worktrees/concept-learning-night |
| 원본 브랜치 / HEAD | docs/concept-learning-night / b93457b577d913f2a7dbe2635f88c1a0d6e4920a |
| 최신 원격 main | a70f1bd531c1b72077d56e7363ff424ba5795143 — fetch 및 마지막 ls-remote 재확인 |
| 기존 로컬 main | 2c2556c5e6c348d82f895f8f405b2e2d26f1807b — 이동하지 않음 |
| WIP 포함 검토 snapshot | e6f837ab420d903ad7c4a21a75744502b44492ab — 브랜치/실제 index를 바꾸지 않은 검토용 Git 객체 |
| 포함 범위 | 원격 main에 없는 HEAD34개 커밋과 미커밋215파일. 기존 외부 dirty AGENTS/RESUME2는 제외·SHA 보존 |
| 수행하지 않은 작업 | 실제 merge/cherry-pick/통합 후보 checkout/commit/push/PR |

snapshot 뒤에는 이번 검사 로그·진행표·보고서만 추가했다. 제품 tools/site 전체는 snapshot과 현재 worktree가 동일함을 마지막 git diff로 확인했다. INPUT-SNAPSHOT.json이 재현 기준이다.

## 머지 전 필수 해결

| 항목 | 실제 확인 | 필요한 조치 |
|---|---|---|
| 공개 제외 자료 재유입 | 사용자 제외 승인된 브라우저 전체 캡처3PNG가 snapshot과 가상 병합 결과 모두에 있고 main에는 없다. 원본 aed347fc가 snapshot 조상이며 정제64b9a0a2는 main에만 조상이다. | 최신 main에서 필요한 변경만 선별 이식한다. 원본 조상을 부모로 합치지 않고 최종 tree와 도달 가능한 이력 모두에서 제외 blob을 검사한다. 파일 삭제만으로 이력을 정제했다고 판단하지 않는다. |
| 병합 충돌 | 실제 git merge-tree exit1. 고유431경로: 생성HTML340, 소스·검사·생성JS15, 장부15, 이미지56, 과거증거5. | 공통 소스부터 구간별 결합하고 HTML/bundle은 재생성한다. 한쪽 전체 파일 채택 금지. |
| main 기능 보존 | main은45일 과정·과정 메뉴·설정 형식 탭·도구 전제 정리 등을 포함한다. 공통 build의11개 충돌 블록과 scripts/메뉴를 결합해야 한다. | main 과정 선행 생성기·검사7개와 개념 검사33개,6메뉴,설정 탭·reader 주입을 보존한다. |
| 현재 WIP 포함 | 직전 목록/상세 PC 폭 변경은 HEAD 이후 미커밋이다. | HEAD만 대상으로 한 통합은 피하고 고정 snapshot의 필요한 변경을 포함한다. |
| 통합 후 실행 검증 | 현재 개념 브랜치는 통과했지만 충돌을 해결한 통합본은 아직 없다. | 격리 통합 후보에서 main 과정/홈/설정 탭 검사와 개념26검사·빌드·장부 감사·PC다크 UI를 다시 확인한다. |

원격 main의 course305파일과 tools/course20파일은 가상3-way 결과에서 main blob 그대로 보존됐다. 단순2-way diff에서 snapshot에 없다고 이 파일들이 삭제되는 회귀로 판정하지 않았다. 실제 충돌이 있는 공통 renderer와 연결부 보존이 핵심이다. 학습자 src/main·src/test·build.gradle·settings.gradle·compose.yaml도 분기 이후 개념 변경0을 확인했다.

제외3경로는 work/browser-qa/4-2-desktop-full.png, 4-2-p2-desktop-final-full.png, 4-2-p2-desktop-full.png다. 경로·blob과 미해결 가상 결과는 ASSET-AUDIT.json/VIRTUAL-MERGE-AUDIT.json, 조상/소스 결합 근거는 COMPAT-REVIEW.md 및 compat-review.json에 있다. 이미지 원본을 열거나 외부에 전송하지 않았다.

## 현재 작업 자체의 검증

| 검사 | 이번 결과 | 범위 |
|---|---|---|
| build | 통과, HTML339/링크 오류0 | 현재 개념 checkout. main의 과정 포함 통합본 결과가 아님 |
| 기존24 + D11/D12 하네스 | 26/26 통과 | 모든 실행 전후 및 현재442개 코드 파일 fingerprint 일치: 34b5de10918fd66b2e8b15ec374c3e20fc205a86587f88f02d8efdc86523fe9c |
| catalog/dark/reader/navigation | 모두 exit0 | 마지막 PC 목록·상세 CSS 포함. reader134원문/코드/ID/Markdown 보존 검사 포함 |
| visual/version-cards/parity | 모두 exit0 | parity768/verified0. 자동 검사 통과를134개 개별 콘텐츠 전수 완료로 확대하지 않음 |
| 독립 코드 검수 | 핵심16파일 중심 C0/I0/M1 | 코드 한정 READY_WITH_MINOR_FIXES. main 통합 승인과 분리 |
| 원문·기존 증거 보존 | 원문135/서버17/기존dirty2/과거proof1366/초기review24 변경0 | preservation-final.json |

현재 검증 로그는 check-results-partial.json, HARNESS26.json, build/harness24/harness25/harness26.log 및 test-/audit- 로그에 있다. 지난 reader-width의 PC6문서×4폭과 추가 표/이미지 검증은 그때의 실제 증거로 보존하고 이번에 모두 새로 브라우저 실행한 것으로 기록하지 않았다. 동일한 제품 소스가 유지됨은 별도로 확인했다.

## 발견한 후속 수정

**Minor1: D12 양 끝 단계 이동 후 키보드 초점 유실.** /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d12-learning.js:162–164에서 render 전 disabled Boolean을 읽어 render 후 변경을 놓친다. source/bundle JSDOM4경계와 메인 실제 Chrome2경계로 재현했다. 실제 Chrome은 다음→마지막/이전→처음에서 activeElement가 BODY가 됐다. 단계 데이터 자체는 정상 변경된다. CODE-REVIEW.md, code-repro-d12-focus.json, d12-focus-native.json 참조. 제품 코드는 수정하지 않았으며 진행표에 미완료로 등록한다. 하네스 녹색이 이 반례의 정상 동작을 뜻하지 않는다.

## 진행표와 다음 순서

완료한 범위·근거·전체 문서에 남은 공백·108개 미착수·머지 전 필수/후속 개발은 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-24/PROGRESS.md 에 기록했다. 26개는 범위별 학습 화면과 검증이 있는 문서 수이며134개 개별 문서의 전수 완료 승인 수가 아니다.

다음 순서는 **최신 main 기반 정제 이식 → 공통15경로의 양쪽 기능 결합 → 자산/장부 조정 → 생성물 재빌드 → 통합본 검사·PC다크 확인 → 병합 재판정**이다. 신규108개 문서 개발과 각 문서의 전체 범위 보강은 이 통합 관문과 구분해 후속 개발로 추적한다. 실제 main merge는 이번 요청에서 실행하지 않았다.
