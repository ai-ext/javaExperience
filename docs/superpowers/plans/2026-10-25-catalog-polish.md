# 개념 목록 PC 다크 정렬과 검색 결과 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 메뉴와 목록의 서로 다른 정렬 기준을 없애고 DTO 검색과 기본 진입의 정보 위계를 개선한다.

**Architecture:** 기존 catalog DOM/controller 계약과 원문을 유지한다. catalog에 한정한 PC dark CSS로 폭과 여백, 결과 행을 교정하고 view의 설명 순서만 조정한다. 홈과 상세 페이지의 레이아웃은 이번 변경에 포함하지 않는다.

**Tech Stack:** 기존 vanilla HTML/CSS, Node build, JSDOM, 실제 Chrome.

**지원 범위:** 사용자가 모바일·라이트는 신경 쓰지 말고 모바일 구성을 폐기해도 된다고 명시했다. 이번 지원·검증은 PC 1280px 이상 다크이며, 새 모바일 분기나 모바일 검증은 추가하지 않는다.

## 확인한 원인과 설계

- 실제 Chrome 1668×832에서 nav 로고 x24, main x238/width1192/padding36, catalog x274/width1120. 서로 다른 정렬 기준이다.
- dark override가 transparent 결과행을 panel로 바꾸는데 행은 padding24px 0라서 글자·버튼이 경계에 붙는다. 필터도 무조건 panel 배경을 가져 탭 위계를 흐린다.
- 공통 catalog gutter clamp(24px, 2.4vw, 48px)를 nav와 main에 사용한다. catalog max-width 제한을 제거하고 긴 산문은 개별 문단의 읽기 폭을 조절한다.
- 결과는 평평한 ruled row, 안쪽 여백22px 24px, 제목/짧은 설명/원문·일치근거, 관련 과제, 128px 읽기 버튼의 세 열. 1280px에서도 세 열을 유지하되 불필요한 간격과 글자 잘림을 없앤다.
- 검색 화면의 사라진 소개 영역 뒤 불필요한 이중 구분선·공백을 줄인다. 기본 탐색의 시작·학습 순서·전체 문서 링크는 보존한다.
- 실제 imagegen 참조 catalog-reference.jpg는 배치 참고다. 이미지 P06의 임의 관련 과제와 부정확한 작은 문구는 구현하지 않는다. 정확한 데이터134/분류31·31·29·43/DTO7은 기존 코드가 기준이다. 미리캔버스는 기존 concept-ia 조사 패턴 참고이며 이번에 새 MCP 호출했다고 표시하지 않는다.

## Task 1: 한정 구현 → 코드와 기본 회귀 검사

- [x] Luna high: tools/site/knowledge-catalog-view.mjs의 설명을 제목 바로 다음에 두고 class kc-result-description을 붙인다. source/match 이유·모든 data 속성·링크·ARIA·134행을 보존한다.
- [x] Luna high: tools/site/knowledge-dark.css의 catalog 전용 후속 규칙으로 shared gutter, max-width 제거, input 일체형, flat tabs, padded result rows, 독립적으로 패딩 있는 읽기 버튼, 계층별 글자/간격을 구현한다. 필요시 knowledge-catalog.css의 기존 선언을 최소 수정한다. 라이브러리·controller 변경·학습 코드 수정 금지.
- [x] npm run build && npm run test:knowledge-catalog && npm run test:concept-dark && npm run test:concept-reader && npm run test:navigation.
- [x] Sol high: spec 검수 통과 뒤 quality 검수. 최종 diff와 source/generated 일치를 확인하고 결함 수정 후 재검수한다.

## Task 2: 메인 실제 화면 검증 → 증거와 장부

- [x] 기본1668×832에서 before/after JPG와 nav/main/catalog 좌표 측정. 추가1280/1440/1920 PC 폭에서 가로 넘침·줄바꿈·주요 조작 검증.
- [x] DTO7건/분야필터/정렬/없는검색/수정중검색어/지우기/기본탐색/원문목차/설명읽기→검색복귀/키보드를 실제 Chrome에서 확인한다.
- [x] npm run audit:visual && npm run audit:version-cards && npm run audit:parity 및 inventory 갱신. 신규 단위는 근거 범위에 맞게 기록하고 개별 문서 완료로 승격하지 않는다.
- [x] 원문135·learner17·dirty2·과거proof1366·초기24review 해시를 보존한다. 결과 보고서에 바뀐 범위/남은 전체 작업을 분리한다. push/PR/merge 없음.
