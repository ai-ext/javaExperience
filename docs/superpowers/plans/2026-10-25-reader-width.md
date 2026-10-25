# 개념 상세 PC 폭 조정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 개념 상세 공통 셸을 메뉴와 같은 좌우 여백으로 넓히고 산문은 가독성 폭, 코드·표·이미지는 가용 콘텐츠 폭을 사용한다.

**Architecture:** data-knowledge-reader가 있는 PC dark 문서에만 CSS를 적용한다. 기존134개 reader의 DOM/controller/원문·링크·조작은 그대로 두며, 최대1192/920px main 제한과 원문 전체74ch 제한을 분리한다. 기존 catalog/home/scenario/practice는 변경하지 않는다.

**Tech Stack:** 기존 vanilla CSS/HTML, Node build, JSDOM, 실제 Chrome.

지원은 사용자 지시에 따라 PC1280px 이상 다크에 한정한다. 모바일·라이트 신규 작업은 하지 않는다. 기존 catalog 작업과 AGENTS/RESUME dirty2를 보존한다. commit/push/PR/merge 없음.

## Task 1: 좁은 CSS 구현 → 기존 검사

- [x] Luna high: tools/site/knowledge-reader.css에서 body[data-concept-surface=dark]:has([data-knowledge-reader]) 전용 gutter clamp(24px,2.4vw,48px)를 설정한다. topbar와 main에 동일 gutter, main width100%/max-width:none/box-sizing:border-box/margin0/padding32px gutter60px, reader width100%/max-width:none을 적용한다. P16의 기존 main1192px와 일반문서 main920px를 실제 cascade에서 이겨야 한다.
- [x] reader220px목차+32pxgap+minmax(0,1fr) 콘텐츠를 보존한다. scene은 기존 목차 숨김/전체폭 동작을 보존한다. toolbar 상단 중복 여백을 줄여 콘텐츠가 더 빨리 보이게 한다.
- [x] .knowledge-reader-original은 width100%/max-width:none, 산문 p는74ch를 유지한다. 코드/pre와 표·figure/image는 해당 부모 내 전체 콘텐츠 폭을 사용한다. 가로 넘침은 긴 코드/표 내부 스크롤로만 둔다. 기존 원문 이미지의 viewport breakout width/left50%/translate는 reader 안에서만 부모폭100%로 교정한다. transform은 image zoom같은 내부조작에는 손대지 않는다.
- [x] P09 공통 scene root의 기존1100px 제한을 없애고, 그림/관찰 2열을 그대로 사용한다. P02 legacy .p02-focused의 breakout만 reader 안에서 부모폭100%/left:auto/transform:none으로 교정한다. 지어낸 UI/표/기술 설명을 추가하지 않는다.
- [x] build, test:concept-reader, test:concept-dark, test:knowledge-catalog, test:navigation 실행 후 원시 로그를 docs/design/reader-width-2026-10-25/ 에 남긴다. 테스트를 CSS 숫자 복제용으로 추가하지 않는다.
- [x] Sol high가 최종 변경에 spec→quality 순서로 독립 검수하고 결함 교정 후 재검수한다.

## Task 2: 메인 화면 확인 → 장부

- [x] P16 read/scene, P09 scene, W11 prose, S09 table/image, P02 legacy, D12 read/scene 대표를 실제 Chrome으로 확인한다. 1280/1440/1668/1920 PC 표본에서 메뉴와 reader 시작 좌표·overflow·가독성·코드/표 폭을 확인한다.
- [x] TOC 이동, 장면/설명 전환, Q&A 펼침, source table, 검색 복귀, scene 선택/확대/복사 대표 동작을 확인한다.
- [x] 실제 imagegen UI 참조는 reader-reference.jpg, 정확한 원문이 기술 근거다. 시안의 예시 비교표/축약 annotation·줄번호·강조문은 새 원문 데이터로 추가하지 않는다. 실제 같은1775×886 화면과 비교하고 차이를 기록한다. JPG만 보관한다.
- [x] build3audits/inventory 및 원문135·learner17·기존dirty2·proof1366·초기review24 해시 보존을 확인한다. 장부에 PC common-layout 적용 범위만 기록하고134개 전수 시각 검증·새 콘텐츠 완료로 승격하지 않는다.
