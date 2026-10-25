# 독립 통합 검수 최종 보고 — Sol high

main 기준은 `a70f1bd531c1b72077d56e7363ff424ba5795143`, concept sourceSnapshot은 `af274f94e72ee2a344329c1e3bd3f1f70737c690`이다. 최종 미해결 Critical 0건, Important 0건, Minor 0건이다. 초기 발견 2건은 수정·재검증으로 닫았다. 최종 코드 fingerprint는 `cbb81d8e9f3d5b94c625fedf582fcbcbea5089096201658e9a916d1248b75726`이며, 실행 중·현재 파일 일치 여부를 아래와 같이 직접 대조했다.

## 발견과 해결

- **SOL-001 · 초기 Minor · 해결 완료:** `tools/site/build.mjs:758–759`의 syntax-highlight.js 중복 등록. 소스에서 한 차례만 남기고 최종 재생성 뒤 main 기준 HTML 461개를 검사했다. script가 있는 460개에서 중복 0건이었다. 이로써 전역 MutationObserver의 중복 설치도 제거됐다.
- **SOL-002 · 초기 Important · 해결 완료:** `tools/site/test-d07-generated.mjs:184`가 historical supplement에서 현재 main Markdown을 찾던 연결 누락. `readHistoricalSource`로 실행 당시 원문과 대조하도록 수정됐다. 최종 생성 HTML에서 해당 테스트를 직접 실행해 exit 0을 확인했다(`sol-delta-d07-generated.log`). 현재 main Markdown SHA·reader 본문 검사는 별도로 유지한다.

## spec과 보존 경계

main 개념 Markdown 135개, JPG/JPEG 602개, 보호 대상 비HTML 2,191개는 Git blob과 동일했다. 제외 캡처 세 이름의 PNG/JPG와 main에 없던 PNG는 발견되지 않았다. main npm script 55개는 그대로이고 concept 33개가 더해져 88개다. main의 course generator/validator, course/flow/tokens CSS와 runtime, config-tabs 조건 등록, 기존 탐색 6개, 홈의 course 우선 배치·JPG·Docker 문구를 대조했다. concept 직접 링크·catalog read=1·reader와 26개 scene의 등록도 보존됐다.

main의 134개 상세 `.knowledge-chapters`와 candidate reader 본문을 JSDOM으로 비교했다. 133개는 정규화 텍스트가 같고, 134개 모두 코드가 같았다. R03은 scoped del renderer가 숫자 범위 tilde 네 글자를 원문대로 남긴 경우이며, 그 네 글자만 제거하면 main 텍스트와 정확히 같다. 본문 손실로 분류하지 않았다. S09의 flush/commit 문구 차이는 sourceSnapshot 이후 main 원문의 실제 정정이며 현재 본문은 main과 같았다(`sol-main-content.log`).

별도 통합 baseline 8개는 생성 전에 main Git 객체의 원문·chapter 본문·코드·main ID를 대조한다. helper가 과거 기준 SHA와 새 기준 SHA를 모두 검사한다. 원기준 8개는 sourceSnapshot과 바이트가 같고, 새 기준 digest도 일치했다. historical ID 제거는 0건, main 학습자 파일 29개도 main SHA와 같았다. D07 과거 길이 guard와 R03 두 교정 assertion을 유지했으며 private 학습자 파일을 복사하지 않았다.

실행 당시 Markdown 사본 6개는 sourceSnapshot SHA와, 현재 Markdown은 main SHA와 각각 일치했다. D11·D12 고정 DOM fixture는 원본 full HTML SHA 및 Git 객체의 chapter/map 정확 추출 문자열과 일치했다. 기존 outerHTML·Mermaid·지도 비교 assertion은 유지됐다. 자산 경로 adapter는 허용된 source worktree 내부 경로만 candidate로 옮기며 상대·외부·prefix 충돌·상위 탈출 경로를 거부했다(`sol-delta-integrity.log`). D11·D12 generated도 직접 exit 0이었다.

JPG 생성기는 고정 입력 2,345개를 원본 Git blob과 대조하고 PNG 원본 419개·원본 JPG provenance를 연결한다. 공개 검사는 SHA·bytes·치수·receipt/questions/provenance digest·PNG 0개·변이 거부를 유지한다. 새 QA 캡처는 통합 폴더 최상위 JPG만 extras에 SHA·bytes·치수·origin·pinnedInput:false로 등록하며 고정 expectedJpgs는 바꾸지 않는다. 최종 직접 JPG 검사는 고정 2,345개·캡처 9개·PNG 0개·HTML 참조 114개로 통과했다(`sol-closure-jpg.log`). 진행 중 미등록 catalog 캡처를 거부한 이전 실패 로그도 보존했다. raster의 IHDR·CRC·SOF 13종·오류 assertion은 유지됐고 직접 검사도 통과했다.

registry의 historical tasks 사본은 sourceSnapshot과 바이트가 같았다. 현재 134개 task의 source SHA는 main 및 현재 Markdown과 같으며, 변경된 23개는 과거 SHA를 별도 필드로 정확히 남겼다. P09 장부 5건도 main/sourceSnapshot/current Markdown 바이트가 같고 ID·label·implemented 상태·evidence·updatedDate가 source와 같음을 직접 확인했다. 이는 main 우선 seed로 사라졌던 기존 근거의 이관이다. 새 verified 승격은 0건이다. 최종 inventory는 391 pages·53,963 units·implemented 910·verified 6이다(`sol-final-closure.log`).

## 실행 근거와 실제 PC 검증의 범위

HARNESS26.json의 26개 latestRun에 있는 원시 result.json을 모두 읽어 passed/exit 0, source 변경 없음, 실행 전후 동일 코드 fingerprint를 확인했다. 마지막 raw manifest의 460개 파일 SHA를 현재 파일과 직접 대조해 불일치 0건이었다. final-checks.json의 build는 HTML 459개·링크 오류 0이며 course/home/navigation/catalog/reader/dark/raster와 audit 검사도 exit 0이다. 당시 JPG exit 1은 캡처 미등록 중간 상태이고, 이후 post-qa-jpg.log와 검수자의 sol-closure-jpg.log가 모두 통과했다. 설정 탭 5개·concept history 5페이지도 앞서 직접 통과했다.

실제 브라우저 조작은 root가 수행했고, Sol은 BROWSER-QA.json의 원시 관측을 검토했다. PC 다크 1280/1440/1668/1920에서 P16 overflow 0·syntax script 1개, 탐색 6개, DTO 결과 7개와 P16 복귀 focus, 과정 지도, 설정 5개 블록 properties 동기화, 화면에 표시된 1/4 진행, P09 clipboard exactMatch, P04 zoom, S09 긴 표의 내부 scroll, D12 경계 이동 뒤 enabled BUTTON focus/aria-current=step이 기록돼 있다. 초기 progress wrapper의 null/빈 값과 닫힌 답 영역 안의 탭 클릭은 성공 근거에서 제외됐고 후속 visible 관측으로 구분됐다. 이 검수자가 직접 브라우저나 screenshot의 시각 품질을 재검증한 것은 아니다.

## 검수 한계와 종료 상태

대용량 proof raw·fixture 전체의 의미와 과거 API/DB 실행을 새로 전수 재검증하지 않았다. 본문 비교는 `.knowledge-chapters` 범위이며 모든 보조 지도의 교육적 완성을 뜻하지 않는다. 실제 PC 검증은 기록된 흐름과 폭의 범위이며 mobile/light 검증은 요청 범위가 아니다. 134개 개념·전 사이트의 학습 완성을 주장하지 않는다.

제품 파일 수정·브라우저 조작·외부 CLI·merge·commit·push·PR은 Sol이 수행하지 않았다. 허용된 SOL 보고서와 sol-*.log만 작성했다. 최종 상태는 미해결 결함 0건이며 이 보고서 쓰기 작업을 종료한다. 상세 fingerprints와 근거 파일 digest는 SOL-REVIEW.json에 있다.


## 최종 역사 증거·이동성 감사 추가 확인

자동 이식의 일반 HTML 제외에서 빠졌던 D08 과거 실행 보고서 7개와 D11 과거 fixture HTML 1개가 복원됐다. 이 8개를 sourceSnapshot Git 객체와 직접 바이트 비교했고, historicalProof byteManifest 전체 1,422개를 현재 SHA·bytes와 대조해 불일치 0건을 확인했다. 이는 과거 기록 복원이며 학습 소스 변경은 아니다. 최종 harness 코드 manifest 460개도 다시 현재 SHA와 대조해 불일치 0건이었다.

PORTABILITY.json, guarded task 결과 26개와 source-read-guard.jsonl 원시 86줄을 읽었다. 26개 task 모두 exit 0이며 기록된 원본 source worktree 접근 attempt는 0건이다. preload는 지정된 Node fs read/open/existence 메서드와 promises.readFile에 대해 원본 경로 접근을 기록하고 거부한다. 이 계측 경로에서 원본 폴더의 우연한 읽기 의존이 없음을 뒷받침하며 OS sandbox나 모든 파일·프로세스 API를 봉쇄했다는 뜻은 아니다.

STAGED-HYGIENE의 기록 시점 경고는 434건이다. 검수 시점 cached diff도 직접 확인해 D08 bundle의 학습용 conflict marker 4건과 제품 소스 공백 경고 0건을 확인했다. 현재 파싱 수는 433건으로 기록 시점과 한 건 차이가 있으므로 과거 434건을 현재 고정 수치로 단정하지 않는다. 나머지는 보존 로그·Markdown·렌더 HTML 등의 공백·들여쓰기 경고다. D08 bundle은 sourceSnapshot과 바이트가 같고 SHA는 `451c9d2f66cfc607aef405af6258339c72f8e6d2e6ac3451a9f2fbb28e0d06d2`이며 직접 `node --check` exit 0이었다. 미해결 merge 소스라고 판정할 근거는 없으며 경고를 숨기기 위해 역사 문자열이나 원문 공백을 삭제하지 않았다.

직접 근거는 sol-final-preservation.log에 남겼다. 이 추가 확인 뒤에도 미해결 Critical/Important/Minor 0/0/0이며, SOL 보고서 쓰기를 다시 종료한다. 이후 staging·로컬 commit·check-generated는 root의 후속 범위다.
