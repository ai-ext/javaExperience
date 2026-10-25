# 최신 main 기반 개념 학습 통합

2026-10-25. 작업 후보는 /Users/ds/code/javaExperience/.worktrees/concept-learning-integration, 브랜치는 integrate/concept-learning-main이다. 기준은 원격 main a70f1bd531c1b72077d56e7363ff424ba5795143이며 원본 개념 작업은 별도로 보존했다. 아래 초기 통합 결과는 구현 커밋 bc1651ec 기준의 기록이다. 이후 사용자 요청으로 PR 게시를 준비했으며 추가 교정·현재 검증은 마지막 절과 PR-PREFLIGHT.json을 따른다. main merge는 수행하지 않는다.

## 결합한 범위

개념 전용 렌더러·26종 학습 화면·공통 reader·PC 다크 목록/본문 폭·실행 근거·진행표를 최신 main 위에 내용만 옮겼다. 원본 branch의 조상 이력은 후보의 부모로 넣지 않았다. HEAD 이후의 미커밋 변경도 고정한 private 입력 snapshot에 포함했다. 원본 worktree의 HEAD와 전체 dirty 목록/바이트 보존은 INPUT.json 및 최종 보존 기록으로 확인한다. 입력 객체는 로컬 private ref로만 보존한다.

공통 build·package·메뉴·홈·수집기는 양쪽 기능을 결합했다. main의 45일 과정, 6개 메뉴, 과정 우선 홈, yml/properties 탭과 중립적인 Docker 런타임 안내를 유지한다. main 서버·과정 원본·학습 원문135개와 공통 JPG602개는 main 입력의 바이트를 유지했다. 기능 연결 외에 과정이나 학습자 서버의 답안을 새로 구현하지 않았다.

공개 제외 캡처의 PNG/JPG를 복사하지 않았다. 과거 공통 PNG도 되살리지 않고 main JPG를 사용했다. 자산은 고정 입력 JPG2345개와 이번 검증 캡처10개이며 현재 공개 대상 PNG는0개다. 조상·제외 blob의 최종 검사는 로컬 커밋 뒤 재확인한다.

## 검증 기준을 옮긴 방법

main과 옛 개념 원문24개가 달라 과거 SHA를 현재 원문에 그대로 대조할 수 없었다. 원래 실행 기록·리뷰·baseline JSON은 변경하지 않고, main 원문과134개 chapter 본문·코드·ID를 먼저 독립 대조한 뒤 통합 baseline8개를 별도 작성했다. 본문133개는 main과 같고 R03의 기존 숫자 범위 tilde 렌더링 교정만 정확히4문자 예외다. 원문 코드134개는 main과 같다.

실험 당시 원문이 필요한5개 학습 검사는 고정한 당시 사본의 SHA와 기존 proof를 대조하며 현재 main 원문의 SHA도 별도로 확인한다. D07 전체 근거에는 실행 당시 사본과 현재 설명의 기준 시점을 명시했다. D11/D12 생성 검사는 변하는 HEAD 대신 고정 원문 DOM fixture의 SHA를 사용한다. 기존 worktree 절대경로를 비교하던 자산 검사는 승인된 원본 경로를 후보의 같은 상대경로로 대응시키고 원래 JPEG SHA/치수 검사를 유지한다.

과거 PNG→JPG receipt419개와 imageEvidence79개는 그대로 보존했다. 조립 시점에 원래 PNG와 JPG를 검증해 provenance를 기록했고, 공개 검사에서는 private PNG/Git 객체 재보관을 요구하지 않는다. main602개와 새 개념1743개 JPG의 고정 입력 SHA·크기·치수를 모두 검사한다. 신규 QA 캡처는 그 합계와 분리해 등록·검사한다. 원래 검사 원문도 historical-tests에 보존했다.

## 수정한 결함

- D12 경계 이동 후 초점 유실: render 전 Boolean 대신 요소 참조를 보존하고 render 후 disabled를 확인한다. 회귀검사 실패→통과와 실제 Chrome 양방향 경계에서 선택 stage 버튼 초점 복구를 확인했다.
- 통합 과정의 syntax-highlight 중복 주입: 한 번만 등록하도록 수정했다. 생성물 단일 등록 회귀검사와 독립 검수를 통과했다.
- D07의 남은 현재 원문/과거 실행 원문 혼동: 고정 실행 사본을 기준으로 supplementary 내용과 검사를 일치시켰다. 현재 main 설명은 변경하지 않았다.

## 실행 결과

| 확인 | 결과·범위 |
|---|---|
| main 시작 상태 | build/course-data/validate/course/course-pages/home/navigation 통과 |
| 통합 build | HTML459개·링크 오류0 |
| 개념 하네스 | 26/26 통과, 현재460개 코드 manifest와 전후 지문 일치 |
| 공통 검사 | course-pages26개·home·navigation·catalog14개·reader·dark 통과 |
| 자산·감사 | 고정JPG2345개+QA10개·PNG0·raster·main image audit·visual·version-cards·parity 통과 |
| 독립 Sol 검수 | spec→quality, 발견 항목 교정 후 미해결 C0/I0/M0 |
| 실제 PC Chrome | 과정 홈·6메뉴·지도·설정 탭5개 동기화·진도1/4 표시/원복·DTO검색·P16읽기/검색복귀·4PC폭·복사·확대·긴 표·D12초점 확인 |

초기 실패·중간 캡처 미등록 실패는 로그에 보존했다. 최신 결과는 HARNESS26.json, final-checks.json과 그 JPG 실패를 대체하는 final-registered-jpg.log, BROWSER-QA.json, SOL-REVIEW.md를 따른다. legacy check:html은 별도 브라우저 실행기와 강제 테마 변경을 쓰므로 실행하지 않았고, 관련 PC 흐름은 실제 Chrome/CUA로 확인했다. 새 모바일·라이트나 전 사이트 대비 전수 검사를 했다는 뜻이 아니다. main의 서버 원문은 유지했으며 Gradle/Docker/DB native 전체를 이번 통합에서 다시 실행하지 않았다.

## 진행사항

현재 수집기는 main의 과정52화면을 포함한391화면·53963항목을 수집한다. 기존 개념 근거가 있는 P09의 동일 원문/ID/label5개는 기존 implemented 상태와 근거를 유지했다. implemented910, 과거 verified6이며 새 verified 승격은0이다. main 장부와 새 개념 ID를 결합하고 같은 ID의 양쪽 과거 기록은 sidecar에 보존했다.

진행표는 /Users/ds/code/javaExperience/.worktrees/concept-learning-integration/docs/design/concept-cycle-2026-10-24/PROGRESS.md 다. 개념26개 범위별 구현과134개 공통 reader 적용을, 나머지108개 맞춤 보강 및 개별 문서 전수 완료 승인과 구분한다. 기존 원본 브랜치의 직접 merge 보류와 새 main 기반 후보의 검증 상태도 분리한다. 초기 통합의 로컬 커밋·생성물 재빌드 일치·제외 이력 최종 확인은 아래 기록처럼 완료했다.

## 로컬 구현 커밋 이후 확인

구현 커밋은 `bc1651ec8fd15d99b69e1eff158643d30af2987b`이며 부모는 main a70f1bd5 하나다. 원본 common/source snapshot은 조상이 아니고 제외 캡처 blob 도달0, main 대비 가상병합 exit0·결과tree=후보tree를 확인했다. `npm run check:generated`는 커밋 후 재빌드한 HTML이 커밋과 같음을 확인했다. 이 구현 커밋 다음 검증 커밋 a2f4c4e9까지는 검증 기록·장부·진행표만 추가했다. 아래 PR 준비 단계에서는 별도 동작 교정을 수행했다. main에서 원래 보이던 D04-5/D07-1 답안 경로 경고2건은 그대로다.

원본 파일 읽기 차단 진단에서도26검사/86Node프로세스/시도0이었다. 역사자료1422개와 보완한rawHTML8개는 SHA/byte가원본과같다. Git 공백검사에는 원본로그·렌더HTML과 D08학습용 Git충돌문자열이경고로남는다. D08번들은 원본과byte동일하고Node문법검사·canonical검사가통과하며 실제미해결충돌이아니다. STAGED-HYGIENE.json에경고원문을기록했다. 제품소스 trailing whitespace는0이다.

## PR 게시 전 추가 교정

독립 Sol 검수에서 21개 학습 화면의 복사 요청이 장면 이동 뒤 완료되면 새 장면에 이전 성공 안내를 표시하거나 새 코드를 fallback 선택하는 경계 문제를 재현했다. 각 handler에 장면 세대와 요청 순서 검사를 추가해 클릭 당시 payload는 유지하고 현재 요청에만 안내·선택을 허용한다. Luna가 구현했고 메인과 Sol이 검증한다. 정상 성공·거절, 장면 이동 후 성공·거절, A→B→A 복귀, 같은 장면 요청 역순 완료를 21×6=126개 회귀 사례로 검사한다. 수정 전 실패와 수정 후 통과 로그를 보존한다.

이 변경으로 21개 bundle과 연결 HTML을 다시 생성했다. 위 D08 bundle의 원본 byte 동일 판정은 초기 통합 커밋에 대한 역사적 기록이며 현재 bundle에는 복사 guard가 추가됐다. 교육용 충돌 문자열은 유지한다. 원본 proof·리뷰·실행 기록은 수정하지 않는다.

현재 검증은 PR-PREFLIGHT.json에 정확한 코드 지문과 26개 하네스·공통 검사 명령 및 결과를 기록한다. FINAL-VERIFICATION.json과 HARNESS26.json은 초기 통합 검증의 고정 기록으로 보존한다. 전체 134개 개별 상세화면 완성을 주장하지 않으며 남은 맞춤 보강 108개는 기존 진행표에서 추적한다.
