# D12 Task26 UI 독립 검수 · attempt1

명세 **FAIL**, 품질 **명세 관문 미통과로 미실행**. C0 / I3 / M1.

검수 대상은 12질문45상태의 UI와 테스트이며 실제 PC 수용은 메인이 별도로 진행한다. 현재 원문 SHA와 canonical 분리raw는 정상 일치하지만, 분리raw만 바꾸는 반례가 기존 하네스에서 통과하므로 정상 경로의 PASS만으로 출처 결속을 보증할 수 없다.

## D12-UI-I1 · 원문 산문 두 상태의 근거 유형과 귀속이 계약과 다름

log-sources는 explanatory-model, memory-available은 original-bash-unrun이다. SPEC는 둘 다 original-prose를 요구한다. memory evidence는 원문이 cache 고려 추정값을 설명한다고 하나 실제 원문122~124는 free보다 available을 본다는 안내만 있다. free -h inline을 Bash 예제인 것처럼 표시하고 보강 설명을 원문에 귀속한다.

수정 기준: 두 상태를 실제 산문 fragment 및 original-prose로 표시하고 복사 payload도 코드인 척하지 않는 산문으로 제공한다. available 보강 설명은 SPEC/공식 원칙에 귀속해 기본 화면에서 읽히게 유지한다. 독립 기대표·DOM code/evidence label 검사도 수정한다.

## D12-UI-I2 · canonical 분리 Linux raw가 성공 attempt에 결속되지 않아 잘못된 관측값 변이를 허용

현재 분리 Linux JSON과 canonical attempt linuxActual은 같지만 validator는 이 동일성 및 고정 경로/runner raw SHA를 검사하지 않는다. 격리 사본에서 분리 raw network.ephemeral_port만44397→44398로 바꾸어도 기존 test-d12-learning.mjs exit0이다. metadata의 linuxOutput 가짜경로 또는 raw runnerSHA 0변이도 validateD12CanonicalProof가 true를 반환한다.

수정 기준: canonical path/nonce/sourceSHA와 분리 raw가 embedded canonical linuxActual 및 stdout에 바이트 또는 의미 동일한지 결속해 검사한다. meta/raw/source runnerSHA를 대조하고 잘못된 raw path/port/source hash 변이가 테스트에서 실패하도록 한다.

## D12-UI-I3 · 공통 reader CSS가 D12 flat PC 구조를 다시 2열로 덮음

reader selector (0,4,0)이 D12 selector (0,2,0)보다 우선한다. .p09-workspace를 grid로, 아래 observation을1열로 만든다. 메인 actual PC에서 root1280/figure720px로 관측했다고 전달받았으며 reviewer는 CSS cascade를 정적으로 독립 확인했다.

수정 기준: D12 국소 high-specificity 규칙으로 이미지 full-width, 아래 관측값·코드2열을 유지한다. common reader 파일은 변경하지 않는다. 전체 생성 HTML의 실제 스타일 순서에서 판정하는 검사를 추가한다.

## D12-UI-M1 · 기본 화면에 내부 검수·생성 대기 문구 노출

강조 영역 좌표 설계·실제 PC 확대 검수 대기, canonical proof, 이미지가 준비되지 않은 상태 설명이 기본 학습 화면에 보인다. 선택 이미지와 검수 상태는 내부 산출물에서 관리할 정보다.

수정 기준: 기본 caption/note를 현재 선택 영역·관측을 읽는 방법 등 학습 문구로 바꾼다. 내부 pending 상태는 보고서에 보관한다.

실행: npm run test:d12 exit0, 격리 사본 control exit0 / 잘못된 분리 port mutant exit0. source/spec 검사와 실패 재현까지 수행했으며 Docker·외부 CLI·제품 수정·커밋은 수행하지 않았다. 원출력과 최초 candidate source는 ui-sol-logs에 보존했다.
