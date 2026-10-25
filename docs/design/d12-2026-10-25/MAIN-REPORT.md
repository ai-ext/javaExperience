# D12 개념 학습 한정 보강 — 메인 검수 결과

D12에 PC 다크 전용 질문 12개·상태 45개와 실제 imagegen JPG 시안 16개를 구현했다. 현재 코드 fingerprint에서 기존24개와 D11·D12를 합친 하네스26개가 모두 통과했다. 이 결과는 D12의 이번 보강 범위에 대한 구현·검증이며, 원문 전체 또는 134개 문서 전체의 완료 판정은 아니다. fullDocumentComplete는 false다.

작업 위치는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night, 브랜치는 docs/concept-learning-night다. 검증 당시 HEAD는 7e824f893aa3d78eb5e21100169865cfb0f6a6d1이며, 미커밋 코드까지 포함한 최종 tools/site fingerprint는 0e2d190b2f8bd721b0b8e556b32312186a4e47b2dba611ba4dd45881f399bf18이다. 통합·push·PR·merge는 수행하지 않았다.

기계 판독 결과: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-summary.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-summary.json)

## 구현과 교육 범위

- 쉘과 터미널, 리다이렉션 순서·추가·덮어쓰기, 파이프와 pipefail, export·PATH, 파일/디렉터리 권한, TERM/KILL, 소켓·TCP·HTTP, SSH 키와 로컬 dry-run, systemd 시작 조건·unit 반영, 로그·용량·메모리, Docker PID1·exec를 나눴다.
- 각 상태에 짧은 조건 설명과 현재 값, 함께 읽을 코드·산문, 실제 관측/원문 미실행/설명 모델의 구분을 기본 노출했다. 긴 원출력과 출처는 펼쳐서 읽는다.
- 시안은 19회 실제 imagegen으로 제작했다. 선택16개와 거절·대체3개를 구분하고 JPEG quality92로 보관했다. D12 폴더에는 실제 PNG 파일이 없다. 원본 imagegen PNG는 도구 기본 외부 경로에 보존했다.
- 이미지 기본 표시를 넓게 두고 관측값·코드를 아래 두 열에 배치했다. 공통 reader CSS가 처음 의도한 배치를 덮어쓰는 문제를 D12 국소 선택자로 교정했다. 새 모바일·라이트 구성은 만들지 않았다.
- 원문 D12 330행의 SHA-256은 bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c로 유지했다. 기존 map·원문·anchor를 보존했다.

설계 계약: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/SPEC.md](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/SPEC.md), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/LEAD-DESIGN.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/LEAD-DESIGN.json), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/FOCUS-DESIGN.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/FOCUS-DESIGN.json)

## 실제 Linux 관측과 미실행 모델

공식 Python slim 기반의 비특권 Linux Docker lab에서 합성 데이터만 사용했다. network none, 읽기 전용 root/proof mount, 자체 tmpfs와 CPU·메모리·PID 제한을 적용했다. 소유 nonce·전체 ID를 확인한 컨테이너만 정리했고 운영 서비스·기존 DB·호스트 환경이나 키를 실험하지 않았다.

실제 관측은 stdout/stderr/종료값, export 전후 자식 값과 PATH 선택, 비-root UID별 640 open·상위 경로 탐색·entry 삭제, 자체 child의 PID/starttime와 TERM 후 생존·종료 및 별도 KILL의 Popen -9, 내부 loopback의 LISTEN/nc와 HTTP503→200, 실제 8MiB 쓰기·열린 fd의 unlink/close 공간 변화, 로컬 rsync dry-run SHA 불변, 별도 idle Docker의 PID1 sleep와 추가 exec PID다.

선택한 canonical 성공은 attempt-0665b1344c5b다. proof.py SHA는 68db36173308d620a1baa12cd2d097c62fca11c3ed59084fda183c302b8c21a9, runner SHA는 e2a87cc5aeffebc4b39b53d1db5e8b8c26c7cbf2be6829e427a6e19f17f682ac이다. 과거 실패 원출력은 보존했고, 처음의 파이프 종료값 수동 선택·df 시점 오표기·guard/endpoint/cleanup 계약을 교정해 독립 재실행으로 검증했다. 초기 실패 기록의 소스 식별 한계는 해당 검수 보고서에 남겼다.

SSH/scp, 실제 systemd/systemctl/journalctl, Java25 jar 서비스, free, ICMP는 실행하지 않았다. 해당 화면은 원문 분석·설명 모델이다. TERM/KILL cleanup 파일 생성 여부를 비교한 실험도 아니다. available 보강은 원문 귀속과 구분하고 공식 kernel MemAvailable 본문으로 대조했다.

근거: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/selected-proof.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/selected-proof.json), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/PROOF-IMPLEMENTATION.md](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/PROOF-IMPLEMENTATION.md), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/PRIMARY-SOURCES-ADDENDUM.md](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/PRIMARY-SOURCES-ADDENDUM.md)

## 메인의 실제 PC 검수

- Chrome 1672×941에서 45개 상태 선택·복사·확대를 확인했다. 최종 45행 모두 표시 payload와 clipboard가 같고 가로 넘침이 없다. current 기본/확대 JPEG는90개다.
- 확대45개와 선택 이미지별 대표 기본 화면16개를 실제로 열어 봤다. 나머지 기본29개도 보존하지만 개별 눈검수를 했다고 확대하지 않는다. 잘린 주변 글자가 있던 구간과 내부 문서명 노출은 교정 후 다시 봤다.
- PC 폭1280·1440·1672에서 장면4개/읽기1개씩 총15조건을 확인했다. 가로 넘침0, 화면 코드14px·관측값17px이다.
- 불투명 단색 HTML 텍스트13조건·690표본에서 대비 실패0을 관측했다. SVG·이미지·그라데이션·투명·disabled는 제외했고 이 결과로 이미지 전체의 대비를 보증하지 않는다.
- Q&A8개 초기 닫힘과 Q1만 열림, 원문 목차, ArrowRight 포커스/Enter 선택, 다음 버튼 경계, 새로고침 상태 복원, 원문 직접 이동을 확인했다. 검색은 입력 후 제출하는 UI이며, 리눅스 검색의 D12 읽기 진입 뒤 같은 query·결과1개·D12 포커스로 돌아왔다.
- 별도 추가 화면7개 중 width1280 원문 사진에서 Mermaid 오류를 발견했다. 그 사진은 before_fix로 남겼고 정상 수용 사진과 구분했다.

행렬과 원자료: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-browser/matrix-final.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-browser/matrix-final.json), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-browser/captures.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-browser/captures.json), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MAIN-VISUAL-REVIEW.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MAIN-VISUAL-REVIEW.json)

## 원문 도식의 실제 회귀를 찾아 수정한 과정

처음 장면으로 열면 숨긴 원문 폭0에서 Mermaid 자동 렌더가 시작돼 D12 첫 도식에 Syntax error SVG가 남았다. 같은 원문을 처음부터 읽기로 연 대조군은 정상이었다. D11 대조군은 같은 조건에서 Syntax error가 없었으므로 모든 문서에 일반화하지 않았다.

D12만 자동 시작을 끄고 읽기 영역·열린 경로·양수 폭에서 직렬 렌더하게 했다. 중간 숨김/재진입은 원문 복원과 재시도로, 완료 SVG는 재사용으로 처리한다. 실패 시 오류 그림을 정상으로 위장하지 않고 원문과 짧은 안내를 남긴다. dispose와 단일 실행의 회귀도 검증했다.

도식 높이가 바뀐 뒤 초기 직접링크 제목이 메뉴 위로 밀리는 별도 현상도 재현했다. CDN보다 앞 classic guard가 빈 초기 hash와 사용자 입력을 기록하며, 안정된 첫 batch 뒤 유효한 초기 원문 anchor만 한 번 정렬한다. 사용자 이동·다른 선택·dispose는 취소한다. 리스너 정리는 실제 EventTarget capture 규칙까지 검증했다.

최종 실제 Chrome의 read+hash 3폭과 hash-only 진입4건은 제목94~98px, 메뉴 하단68px, SVG3개·오류0이다. 실제 Down/Tab 입력은 도식1/3일 때 취소 flag가 켜지고 최종3SVG로 끝났다. 빈 hash 기본 진입은 scene0SVG→read3SVG이며 읽기 제목95.789px을 유지했다. 완료 SVG 재사용과 빠른 전환도 별도 관측했다. 초기 source 도식14node를 상·하단 두 화면으로 나눠 실제로 확인했다.

관찰 기록의 실패·대조·중간·최종은 역할별로 구분했다. locator 재포커스가 포함된 PageDown 관측은 취소 입증으로 쓰지 않는다. Chrome extension 오류100건과 preview source 오류0의 console tail은 도식 정상 렌더의 증명이 아니므로 실제 SVG와 사진을 따로 봤다.

근거: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-ROOT-CAUSE.md](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-ROOT-CAUSE.md), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-BROWSER-ROLES.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-BROWSER-ROLES.json), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/MERMAID-BROWSER-SUMMARY.md](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/MERMAID-BROWSER-SUMMARY.md)

## 독립 검수와 최종 검사

Luna high가 구현하고 Sol high가 spec 통과 뒤 quality를 검수했다. 메인은 실제 브라우저와 원출력을 검증했다. 초기 FAIL과 변이 원출력은 보존했다.

UI 변이19개, 도식 기본17개와 anchor11개·Tab1개·capture2개의 의미 변이를 검출했다. 같은 source의 기존 결과를 유지한 한정 검수와 실제 재실행을 구분했고, 의미상 동등한 once 자동 정리 대조군은 정상 PASS로 남겼다. JSDOM 모사는 실제 Chrome 위치·CDN 실행을 대신하지 않는다. 최초 RED에 MODULE_NOT_FOUND가 포함된 한계도 기록했다.

최종 검수는 모두 C0/I0/M0다.

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-doc-addendum.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-doc-addendum.json)
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-memory-addendum.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-memory-addendum.json)
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/ui-sol-polish-addendum.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/ui-sol-polish-addendum.json)
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-SOL-REVIEW-final.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-SOL-REVIEW-final.json)
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-ANCHOR-SOL-REVIEW-final.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/MERMAID-ANCHOR-SOL-REVIEW-final.json)

최종 하네스26개는 모두 현재 코드 fingerprint와 일치한다. build HTML339개·링크 오류0, audit:visual·audit:version-cards·audit:parity가 모두 통과했다. 최종 재빌드에서 코드 fingerprint와 inventory가 바뀌지 않았다.

검사 원출력: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/final-checks/checks.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/final-checks/checks.json), [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/final-checks/harness-current26.json](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/final-checks/harness-current26.json)

## 장부와 보존

inventory는47,304행이다. 새 typed45개만 implemented로 올리고 추가 toggle5개는 unreviewed로 남겼다. 기존47,254행의 status/evidence/updatedDate 변화는0이다. 전체 unreviewed46,388·implemented910·기존 verified6·mockup_ready0이며 새 verified는 없다.

parity는기존750행 byte prefix를 보존하고16개 implemented만 추가해766행이다. verified는0이다. task26만 현재 보강 완료로 기록하며 다른133개 task를 승격하지 않는다. 원문135개·학습자17개·미커밋2개·과거 proof1366개·최초24 review를 해시로 대조했다. 새로운 코드는 이 격리 worktree에만 두었다.

HTTP Chrome PC에서 검증했다. 모바일·라이트·file URL 오프라인 수용, 실제 운영 배포·학습자의 실력·서버 구현 완료는 판정하지 않는다. 다음 등록 문서는 task27 D13이며 이번 문서로134개 전체 완료를 표시하지 않는다.

Git 공백 검사는 실제 원출력5개 파일의 EOF 빈 줄만 예외로 보존했다. 작성 문서3개의 EOF만 정리했고, 생성된45상태 payload가 현재 데이터와 그대로 같음을 확인했다. 상세 예외와 해시는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/final-checks/whitespace-exceptions.json 에 있다.

최종 실제 화면: [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/FINAL-PC-DARK.jpg](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/FINAL-PC-DARK.jpg)
