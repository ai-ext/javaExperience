# 개념 학습 재구성 최종 보고서

기준일: 2026-10-25 · branch ref `feat/concept-curriculum` · 구현 커밋 `7601bd80372dd87117b149f32067851b04654642` · tree `ece5e0c6b3504073ca1a617f234b8fd41a9d8ca0` · 기준 main `f6d82d705e279a0e74a5e6287a35cc51953e49ba`

상태: **구현 로컬 커밋 완료 · post-commit `check:generated` PASS · C05 3단계 native clipboard readback 범위 확인**. C01–C06 PC 다크 경로는 코드·fixture·브라우저 범위에서 확인했다. main 반영이나 원격 공유는 하지 않았다.

## 커밋 시점과 현재 검증 상태

런타임 구현 커밋은 2026-10-25 17:44:05 +09에 생성됐다. 구현 커밋 SHA는 `7601bd80372dd87117b149f32067851b04654642`, tree는 `ece5e0c6b3504073ca1a617f234b8fd41a9d8ca0`이다. runtime code·HTML·proof·research가 이 커밋의 상태에 고정됐다. `head`는 이 구현 커밋을 뜻하며, branch ref `feat/concept-curriculum`은 후속 verification-only 커밋으로 이동할 수 있다. 상태 확인 시각은 2026-10-25 08:47:55 UTC다. `npm --prefix tools/site run check:generated`는 exit 0이고 로그의 최종 결과는 `생성 HTML = 커밋된 HTML`이다.

## 결과와 범위

| 결과 | 검증 이력·기준 시점 | 원문·기존 장부 보존 | 남은 사항 |
|---|---|---|---|
| C01–C06 개념 경로 구현 완료 | 2026-10-25 최종 code fingerprint `e1bbc746674443516932d6d57e6f3429f6619be92b0394f47a6e34fc8d8e9cc5`, code files 474 | 기존 135개 source 문서의 SHA는 기준 main과 같고, proof/research/review evidence 118개도 보존 검수에서 byte 동일을 확인. 기존 개념 134개 분류 guard도 독립 검수에서 대조. 상세 문서 134개의 전체 내용 검증·실행 완료로 해석하지 않음 | 기존 134개 개별 원문의 전수 보강·실행은 별도 범위 |
| fixture·공식 근거 확인 완료 | Java 21/Spring Boot 4.1.1 fixture 8 tests; 독립 Sol 재현 8, 의미 변이 6 거부, control 2 통과. 공식 출처 19·claim 22 | 직접 Luna/OpenAI/high 초기 조사 1회(본문 18/19, native web 8, shell 0, nested delegation 0)와 메인 지시 표적 Luna 후속 1회(S14 본문 확인, shell 0, nested delegation 0)를 합쳐 최종 본문 19/19. 메인이 공식 페이지 7개 본문을 표본 대조했고 현행 웹 버전과 fixture 차이를 기록 | 초기 S14 ledger의 `read` 판정은 검색 snippet만으로 잘못 부여됐다. 후속에서 본문을 직접 확인해 바로잡았다. 초기 재귀 CLI 시도는 별도로 미채택. C03 네 처리 시점은 설명 지도이며 AOP 실행 결과가 아니다. C06은 setter 주입·정상 close 범위 |
| PC 다크 브라우저 동작 확인 | native Chrome/CUA, 2026-10-25 08:17 UTC; 1280·1440·1920 × 높이 832에서 54/54 DOM 상태, overflow 0, 최대 code top 631.5859 px | 카탈로그와 C01–C06의 1440px JPEG 7개를 메인 담당자가 직접 확인; 연구 폴더에만 보관, 제품 raster 자산 추가 0 | 모바일·라이트, imagegen 시안 parity 미확인 |
| 카탈로그 이동·복귀 확인 | 필터 6조합, 검색 후 상세 진입/검색·필터 복귀, 단원 back/forward, W19 원문 anchor에서 C05 복귀 통과 | 기존 검색 query와 두 필터 상태가 URL로 보존됨 | 없음 |
| 최종 검증·독립 코드 검수 통과 | 초기 45개 명령 PASS 뒤 core delta의 build/inventory/core/core-inventory/visual/parity 6개 표적 검사 PASS. 불변성 근거로 공통 17개·하네스 26개 재사용. 새 Sol review PASS, C0/I0/M0; recommendation `local_preview_with_native_clipboard_limit`. post-commit `check:generated` exit 0, 2026-10-25 08:47:55 UTC | 스냅샷 HTML 428개 중 `lessons/concept-core.html`만 변경, 나머지 427개 byte 동일. 변경 코드 7개는 core 전용. 새 review JSON/MD는 연구 addendum에서 exact-copy | main merge, push, PR 없음 |
| 시각 inventory 상태 정리 | 2026-10-25 inventory collector 및 `test:core-inventory` 재실행 통과 | 현재 live implemented 923개는 기존 live 905개와 신규 core 18개로 구성. 기존 verified 6개 유지, 신규 verified 0개. main 기준 기존 catalog implemented 5개는 내용/구조 변경으로 생긴 이전 ID라 별도 historical archive에 exact 보존했고 live에서 되살리지 않았다. 새 catalog 대응 5개는 unreviewed이며 이전 evidence를 자동 이관하지 않았다. 비대상 53,998행은 core 18행 상태 갱신 전후 line hash와 순서가 같음 | concept-core 페이지 합계는 나머지 미검토 항목이 있어 `in_progress` |

## Clipboard 결과와 미확정 항목

각 단원의 코드 복사 UI에서 성공 응답 문구가 확인됐고, 과거 자동화 clipboard/paste 왕복은 현재 페이지나 bundle에 없는 이전 텍스트를 반환했으며 native CUA fallback은 startup에 실패했다. 후속으로 사용자가 C05 3단계에서 복사한 뒤 메인이 macOS의 `/usr/bin/pbpaste`로 실제 OS clipboard text를 읽어 예상 원문과 raw UTF-8 바이트를 비교했다. 두 값은 각각 139바이트로 같고 SHA-256은 `2b67a2e797fed16e75f4ac22fe3393f5c5ef9080ac3b73865c5efa63595e8ba7`로 일치한다. 원본 측정 기록은 [`CLIPBOARD-VERIFICATION.json`](CLIPBOARD-VERIFICATION.json)이다. 확인 주체는 사용자(UI 복사)와 메인(OS 읽기·비교)이며, 자동화 도구가 6개 UI paste를 OS에서 인증한 결과가 아니다. 따라서 native clipboard 상태는 **C05 3단계에 한해 확인**됐고, 나머지 자동화 readback은 미검증이다. UI 제어 연결은 여전히 미복구이며 이 결과만으로 과거 불일치의 원인이나 모든 브라우저의 동작을 확정하지 않는다. 제품 코드 결함 원인도 특정되지 않았다.

그 밖에 모바일·라이트 화면, 전체 134개 원문의 내용·실행·개별 보강 완료, 새 imagegen 시안 parity는 이 작업의 검증 범위가 아니다. 브라우저 수치는 C01–C06 PC 다크 화면에 한정된다.

## 명령 및 원문 보존 근거

| 증거 | 결과 |
|---|---|
| `CHECKS-FIRST-SNAPSHOT.json` · 2026-10-25 07:46 UTC | build/inventory + 공통 17 + 테스트 하네스 26, 총 45명령 exit 0 |
| `FINAL-CHECKS.json` · 최종 code fingerprint | 이후 core 전용 변경: 표적 6검사 exit 0, 불변성에 근거해 하네스 26 및 영향 없는 공통 검사 재사용 |
| 현재 inventory sync | `node tools/site/inventory-visual-work.mjs` exit 0; `npm --prefix tools/site run test:core-inventory` exit 0 |
| inventory counts | 392 source pages · 54,016 rows · unreviewed 53,087 · implemented 923 · verified 6 · mockup_ready 0 |
| 변경된 core row 18개 | before aggregate SHA-256: `0ec3a2f8938f0f40de00f375b818bf8f22dcda1d6ece25e8de1a3bbc8bbf919a`; after: `9aa3013f40a2de0a20d89158888677e5361f45d30b0a875a449a7b0a361ca2ab` |
| 변경되지 않은 기존 행 53,998개 | before/after ordered line aggregate SHA-256 모두 `52ea3511af29fbaade8260f3985f92dedcb2d0778307d6170d4804c6ef69e194` |
| independent code review | `SOL-FINAL-REVIEW.json`: PASS, Critical 0 / Important 0 / Minor 0 |
| independent review addendum | `SOL-FINAL-REVIEW.json` / `.md`와 `LOCAL_HOME/research/javaExperience-concept-curriculum-20261025/_data/FINAL-REVIEW.json` / `.md` exact SHA match; recommendation `local_preview_with_native_clipboard_limit`, code snapshot 474 files / `e1bbc746…` |
| commit state | implementation commit `7601bd80372dd87117b149f32067851b04654642`, tree `ece5e0c6b3504073ca1a617f234b8fd41a9d8ca0`; branch ref may advance for verification-only commit |
| post-commit generated check | `npm --prefix tools/site run check:generated` exit 0 · 2026-10-25 08:47:55 UTC · two roadmap warnings (D04-5, D07-1) · `_data/check-generated-postcommit.log`: `생성 HTML = 커밋된 HTML` |
| 최종 보존 확인 | `PRESERVATION-FINAL.json`: 금지된 캡처 blob reachable 0, 기존 source 문서/learner source 변경 0, main HEAD 기준 commit 불변. live implemented 905 기존 + 18 core = 923; retired catalog 5건 별도 exact archive; verified 6 유지, 새 verified 0 |
| 실행·출처 기록 | `proof/execution.json`: 8 tests; `research/sources.json`: 19 sources / 22 claims |
| exact source ledger copy | 제품 `research/sources.json`과 외부 `sources-verified-final.json` SHA-256 동일: `6799a456041e40d5734baf5f443cca283acfdd8e4270572135a3ae5af24ab2ce`; provenance.followups/sourceReadAudit 보존 |
| retired catalog history | `historical-catalog-records.json` 5 rows exact-copy SHA-256: `f511e400e45ed737e8674bd584e2c991d84477bc39cac3d5ca7ef62dcfa409fd`; old IDs live 0, five replacements remain unreviewed |

### 18개 core row line SHA-256 대조

| inventory ID | 상태 갱신 전 SHA-256 | 상태 갱신 후 SHA-256 |
|---|---|---|
| lessons/concept-core.md::core_learning_state::4d4967ad7732:1 | `cec6bfb9fe1737882e03852484de0504e4bd3c873279dbdc60457dc2e1ca4d62` | `e97e759606a9e5ae305247364c68611f5cbfb40a0378839b12b2fb4554c260d9` |
| lessons/concept-core.md::core_learning_state::c66b25a94394:1 | `3ff6c831191fbeea0a297e515f8bb691c6957e7b1942604cc91aaec17ee83c4a` | `e5d06a3698338902a8ba0f729022660ffef4f9b9b01b3387acf7317218bcc149` |
| lessons/concept-core.md::core_learning_state::4cfc926078a9:1 | `7e75e3fdadd4f84bf5e84e53dd6c811196ead89399f07a0118890bb317ea4927` | `cec950a2eeda0853ab3672395a786768218bb2a4803827e93be0aa3ea5b02cc6` |
| lessons/concept-core.md::core_learning_state::087df7e52e40:1 | `f7a483ae0a466002404202ef5de195f9f391c6bbca411dd9b61a484a3dd83e93` | `81a1c6cd62995099c73454f0aebde457d3f6fc46cd3e1ed041ac2df8d274a2ab` |
| lessons/concept-core.md::core_learning_state::a495d8dbc2c5:1 | `fc78120c864e0d11c7572185ab5aa4261735768aeee0d034c18612dba42c2788` | `c6cac6e7031351b03659fbc2f0e2c3c1b04edcedba16d07ca26790a201bee9fe` |
| lessons/concept-core.md::core_learning_state::afea5ec8555a:1 | `8941d5543bbd5752340f71ceb30cefe586dfa94acd60f2c5285ed405240bfa86` | `62b527b896388ca0297bd4b549ff7904669803e4254be7a8183f922b2374adcc` |
| lessons/concept-core.md::core_learning_state::a3780dcb047d:1 | `caf58f47049eb4f6a613df31c0eea787fb835cc156310d2dbac1db589690b166` | `c90306f0c71d09cfd2471426ea42ac119ad2c9af2a4ad4d6460a5785badbdb99` |
| lessons/concept-core.md::core_learning_state::a27180351de5:1 | `a54176dd231a712b6083a388be1f7499c958da980fa6ac0c9cd5526ad2a6787b` | `220aa14cf6f90648bc022588778d084f36ef4ad64c61214e7905b175b051e39d` |
| lessons/concept-core.md::core_learning_state::6ef0da63d068:1 | `bda34f43f4224d4004436976fb33fc7e4cce1a2265a6f18ac195928605bcd310` | `a43480693741ecc16fd557909b4e3834705a49248ee2ddb0bffc8dc067455860` |
| lessons/concept-core.md::core_learning_state::a8f584d663b2:1 | `300d93848be6054c2ab9b71687b6f954a7ddec00e95f6fda229716e4c0eafc2e` | `d27a4d681c88eeaeebecef97af4e6e0b8d55c1724a55fd259db7de46c6c9a680` |
| lessons/concept-core.md::core_learning_state::f00d405ef860:1 | `3a4f84931515078580c1139ad2d3283f801d8f8a3c44fde8003bb20e06b8ea4d` | `64c263ab23f9d9d0509661d961a5390257a94621ca7138efd724bb5bffb16f07` |
| lessons/concept-core.md::core_learning_state::c0d9b15729d0:1 | `f4788536f5f8cf18b87500ae2761b86b1b3f43a5e3453ade2d7dcad66b0208aa` | `7405c80c8d38161f56cece11b2a32ee418322c8ee4ccf2092741da12066eb603` |
| lessons/concept-core.md::core_learning_state::bafbabd2ffd4:1 | `5e39e16ca57ef21f1002872d48766c674530d96682cb844e87e69a95f15ce08b` | `079836cd95534e8c782254bdd668176a9fa2afae95c569e1849dbfe7738e5612` |
| lessons/concept-core.md::core_learning_state::b3cc44713659:1 | `49c10958055c1591d5f43ed0f5a33d066955650927efe7898f875a779cd654e1` | `2675cacc5c46d59ba15174d2aedfdde175c81b11676a6fa5bcb3fff3fad69d27` |
| lessons/concept-core.md::core_learning_state::8eb70bc9dedd:1 | `017dd79396719e5e2c43b90b2466cc7240b2553cef95af8df6d01398712dd5ab` | `7d7a33ddcb6def5e606f04cdc03a9bd75a109926bcd29f891ac784dcd8bb254d` |
| lessons/concept-core.md::core_learning_state::66268ce0cbf7:1 | `ccaddaddf5da5664c8e0be383bbe83fed7b26b479e9e26f80f7c0570b3bc5d14` | `c5bc040f5c673776ddd19bf3eff2c034ce2f2a713d0f6395c84cff7ff6372296` |
| lessons/concept-core.md::core_learning_state::9d22b0cb8736:1 | `4bee4e956bdcb464e8948e3a68b9c6357ff7c5f0a40e71a21cf7146f68781996` | `6ec367fcaa59fa2e273a3f76c74db375e19dd678aadf195e566fda7cd8011987` |
| lessons/concept-core.md::core_learning_state::fe188ace8017:1 | `4c2eb69261ab052d4f969d25dd07ce66cef215ec5032cdfeb01e811a0d4a2188` | `1d1731e566dd6c42cd1bdb9d2127017eedc5d7413b1e63372c4d9b64c9b9eab5` |

각 새 core row는 `unreviewed → implemented`와 evidence 경로·날짜만 갱신했다. 기존 live implemented 905개를 유지하고 core 18개를 더해 현재 live implemented는 923개다. 역사 catalog 5행은 이 live 수치에 포함하지 않고 archive에 보존했으며, 교체된 5개 live row는 unreviewed로 두었다. 상태 변경으로 core row 해시가 달라진다. 다른 53,998줄은 core 상태 갱신 전후 line 내용과 순서의 해시가 같다. 기존 verified 6개도 유지됐다.
## 통합 상태

`FINAL-STATUS.json`은 기계 판독용 상태와 범위 플래그를 담는다. 결과는 로컬 브랜치에 한정하며 main merge·push·PR은 발생하지 않았다.
