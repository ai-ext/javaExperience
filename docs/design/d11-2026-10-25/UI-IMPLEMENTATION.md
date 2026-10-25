# D11 학습 UI 구현 기록

## 구현 범위

- D11 전용 data, renderer, controller, stylesheet, browser bundle을 추가했다. 공통 knowledge reader와 원문 Markdown은 수정하지 않았다.
- 질문 12개와 상태 38개를 연결하고 `object-ownership / own-order`에서 시작한다.
- question selector, 상태별 버튼, 이전·다음, image focus/zoom, 전체 이미지 링크, 현재 값, 짧은 근거 종류, 코드·설명 발췌를 제공한다.
- 실제 Python/SQLite/Chrome 관측과 원문 설명 모델을 다른 `evidenceKind`로 표시한다. 설명 모델의 코드는 실행 코드가 아님을 표시하고 HTTP 요청을 다시 보내는 UI는 두지 않았다.
- CORS와 DOM의 전체 JSON, SQLite raw log, source fragment 경로, scope 설명은 접힌 영역에 두고 현재 상태의 값·근거 종류·코드 발췌는 기본 표시한다. raw source 파일 링크도 제공한다.
- 각 상태의 현재 판단에 해당하는 코드 줄만 강조한다. CORS preflight의 기본 코드는 현재 OPTIONS 서버 분기이며 Origin/case 조건과 허용 method/header를 포함한다. client 요청·추가 응답 helper는 접힌 출처 상세에 정확 발췌한다. DOM의 text/markup 상태는 각각 해당 setter handler를 기본 발췌로 사용한다.
- Spring Security 체인 code copy는 Markdown fence 없는 원문 Java 본문이다. 버전 상태는 기존 원문 산문으로 유지한다. HSTS 세 상태는 imagegen과 `learn.example.test` 호스트를 쓰며 remembered 정책의 `max-age=31536000`과 다음 단계 `includeSubDomains`를 구분한다. `cookie-token` crop은 footer가 아니라 왼쪽 browser/cookie 요청 영역이다.
- image alt는 한국어로 작성했다. 14개 선택 JPEG를 manifest SHA/bytes와 대조하고 38개 상태의 focus 좌표를 `FOCUS-DESIGN.json`에 맞췄다.
- 공통 P09 평면 레이아웃을 유지하고 D11의 독립 카드 셸은 추가하지 않았다. 확대 프레임은 focus aspect ratio를 유지하고 높이 540px 기준 폭을 제한한다. 폰트·그림을 늘이거나 잘라 읽지 않으며 actual PC crop acceptance는 부모 검증에 남긴다.
- reader 전환 뒤에도 현재 D11 상태를 유지한다. D11 상태는 별도 history key에 저장하고 foreign history state를 보존한다. 복사 완료/실패는 generation과 request ID가 현재 화면과 일치할 때만 알린다.

## 보존 확인

- 원문 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D11-web-security-basics.md`는 314줄, SHA-256 `a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba`다.
- 생성 HTML의 `#d11-original` 안 `.knowledge-chapters`와 기존 개념 지도는 HEAD 생성본과 DOM subtree가 각각 일치한다. 원문 개념 지도는 `.d11-legacy`에 한 번만 존재한다.
- 생성된 페이지에서 D11 controller와 common reader를 초기화한 뒤 장면 모드와 읽기 모드 각각 한 개의 visible H1을 확인한다.

## 검증 범위

- `test-d11-learning.mjs`: 질문/상태 ID, 선정 이미지 14개 SHA/bytes, 독립 이미지 매핑, 38 focus bounds/coordinates, 4개 객체 조회와 bind, 4개 CORS case, 2개 DOM case, 원문/fixture line ranges, 선택·탐색·zoom·copy race/fallback·history·source hash를 검사한다.
- `test-d11-generated.mjs`: 생성 페이지, 원문/legacy subtree, 고유 ID, 1 visible H1, reader·D11 bundle 전환, embed payload를 검사한다.
- Main actual PC에서는 38개 상태별 crop, 복사, 폭 1280/1440/1672, 원문 jump와 실제 이미지 확대를 별도로 수용 확인해야 한다. 이 문서의 automated harness 통과를 실제 PC acceptance로 확장하지 않는다.

## 실제 판독 보정과 독립 검수 보강

- `chain-rules` 원문 Java 발췌는 184~197행으로 시작 fence 없이 복사한다. `version-pinned`는 원문 설명 문장 발췌를 유지한다.
- CORS 허용 상태 표는 `Allow-Methods`와 `Allow-Headers`로 표기한다. HSTS 첫 입력·기억된 입력은 시안의 `learn.example.test`와 맞추고, 기본 정책 `max-age=31536000`과 다음 장면의 `includeSubDomains`를 분리한다.
- `cookie-token` focus는 FOCUS-DESIGN.json, 데이터, 독립 테스트 기대값에 `[1, 56, 56, 24]`로 동일하게 지정했다.
- `test:d11`은 38개 실제 DOM 출처/evidence 라벨을 독립 map과 대조한다. 원문 Spring 실행을 주장하는 source label 메모리 변이는 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/ui-luna-logs/09-rendered-code-kind-mutant.json`에서 assertion 실패로 검출된다.
- 재검증: `npm run build`, `npm run test:d11`, `npm run test:p09`, `npm run test:concept-reader`, `npm run test:concept-dark`, `git diff --check` 통과. W15 생성 HTML과 HEAD blob SHA-256은 `964e56e13fa8b30762b32c20039f2b23ab44e9a99f4a7e4e35e20aa239e4ad03`로 일치한다.
