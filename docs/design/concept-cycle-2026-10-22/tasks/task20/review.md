# task20 D06 독립 감사

판정은 **needs_fix**이며 전체 문서 완료는 false다. 원문 범위는 **needs_completion**, 품질은 spec 미통과 상태의 진단이다. 확정 이슈는 important 1건이다.

- 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`
- 원문: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D06-deployment-concepts.md` · 264줄 · SHA `0e67f2ea37cbf166229fc256d1cd3a5b81a9e48a164a9680840b4ec21e0f63f1`
- 새 검사: `npm --prefix tools/site run test:d06` · UTC `2026-10-22T00:13:45.569362+00:00` → `2026-10-22T00:13:49.252298+00:00` · actual exit `0`
- 원시 출력/소스 SHA: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task20/runs/sol-audit-20261022T001345Z/`

## spec: 원문 보존과 전체 커버리지를 구별

전문 주요 의미 단위 93개를 `source-coverage.json`에 sourceLines/stageIds/evidence/gap으로 대응했다. 집계: {"covered": 32, "partial": 48, "missing": 8, "unrun": 5}. covered는 제한된 개념 설명/관측이 있음을 뜻하며 실제 운영 인증이 아니다. sourcePreserved는 모든 단위에서 별도 기록했다. 원문에 남아 있는 설명을 새 장면 완료로 계산하지 않았다. 기존 legacy map은 8개 절의 목차 링크이며 공백을 메우는 상세 학습 장면은 아니다.

현재12질문·30상태에서 동일 artifact/프로필, 공개 greeting 설정우선순위, startup flag, health/readiness와 business, own routing/canary, 단일 요청 graceful, 별도 H2의 schema/data 복구 차이는 근거가 연결된다. 반면 secret/DB대상 경계, 환경차이, roll-forward, flag 관리, 운영 체크리스트, 지표·시간·편향에 따른 선택, 호환앱 쓰기/읽기전환 및 대규모 backfill은 공백/부분 범위다. 원문 Java25/8080 명령과 선택 운영플랫폼 실행은 unrun으로 남겼다. 선택 과제 미실행을 결함으로 취급하지 않았다.

## quality: 진단용 확정 finding

**D06-Q1 · important** — `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/d06-lesson-data.mjs:1656`가 사용하는 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d06-2026-10-21/images/promotion-v4.jpg` 상단 Local / Dev 상자는 두 환경을 `Used for individual development and local testing`이라고 함께 설명한다. 원문 L38–39·65는 local 개인 확인과 dev 공유 통합 목적을 구별한다. 현재 장면 값은 이름만 열거하여 그림의 잘못된 역할을 교정하지 않는다.

수정은 local/dev 역할을 이미지와 같은 장면의 텍스트에서 구별하는 범위다. 모델/실제 운영 미실행 표시는 유지한다. 새 이미지를 직접 읽고 원문과 대조하며 해당 의미를 검사에 추가해야 한다. 현재 test:d06은 이미지 SHA·노출·고정 JSON·문자열 일치를 검사하므로 이 의미 오류가 있어도 exit0이다.

## 기술 경계와 실행 근거

이번 새 실행은 Node/JSDOM 검사뿐이다. 기존 runner/fixture/raw를 읽어 A 동일 SHA와 B 별도 산출물, 같은 Mac 두 profile/JVM, CLI 한 key 선택, startup flag 변수 경계, B의200UP/업무500와 별도A readiness503·직접200, toy route 복귀, 유한10건7/3분배, 20s설정/1s별도override, Boot6개 SIGTERM143과 별도 SchemaProof exit0을 대조했다. H2는 앱과 연결되지 않은 한행 in-memory 수동예이며13→12 공백 손실과42S22를 다룬다. 실제 배포/DB/무중단·성능·통계·외부보상 인증으로 확대할 근거는 없다. 기존 native 재현이 있었다는 기록과 이번 fresh test를 구별한다.

## 직접 열람한 시각 자료와 한계

선정 원본6개: artifact-v3, health-v3, drain, strategy, promotion-v4, config-v2 JPG. 기존 캡처3개: desktop-artifact, desktop-health, mobile-drain JPG를 실제 view_image로 열었다. 나머지7개 선정 그림/23개 역사 캡처는 이번 직접 열람 대상이 아니다. 모바일 drain은 확대 그림의 일부가 보이고 가로 이동을 전제로 한다. 새 browser 동작·전수pixel·학습자 이해는 검증하지 않았다. 자세한 절대경로는 review.json에 있다.

## 남은 작업 묶음

1. D06-Q1을 먼저 좁게 교정하고 spec→quality 재검토.
2. 환경·설정/secret·운영 결정/기록과 지표 기반 선택 장면.
3. flag 수명·교체 용량/종료 정책과 실패 경계.
4. 호환앱·이관검증·읽기전환·구사용 중단·contract 흐름.
5. 메인의 현재 desktop/mobile 검증 및 미열람 시각 자료 검수.

판정: needs_fix (spec needs_completion; quality 진단, 승인 아님)
fullDocumentComplete: false
커버리지: 93 의미 단위 / {"covered": 32, "partial": 48, "missing": 8, "unrun": 5}
이슈 수: critical 0 / important 1 / minor 0
actual exit: 0
