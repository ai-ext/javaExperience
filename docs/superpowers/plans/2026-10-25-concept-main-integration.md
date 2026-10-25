# 최신 main 기반 개념 학습 통합 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development. 단순 이식·집계는 Luna high, 독립 검수는 Sol high, 공통 설계·충돌 결합·실제 UI 판정은 메인이 맡는다.

**Goal:** 최신 main의 과정·서버 기능과 공개 이력을 유지하면서 현재 개념 작업과 미커밋 PC 폭 개선을 별도 후보에 선별 이식한다.

**Architecture:** main a70f1bd5에서 시작한 integrate/concept-learning-main에 파일 내용만 옮긴다. 원본 개념 branch의 commit을 부모로 합치지 않는다. 3-way 계산은 내용 대응 참고이며 충돌 마커를 실제 소스에 넣거나 원본 조상을 merge하지 않는다. 사용자 원본 worktree와 기본 main은 보존한다.

**Tech Stack:** 기존 Node/vanilla HTML/CSS/JS 정적 빌드·Python 하네스·Git worktree.

## Task 1: 기준 고정과 비충돌 내용 이식 → 보존 manifest

- [x] main 기반 새 worktree와 새 branch를 만들고 기존 원본 변경을 로컬 검토 snapshot으로 고정한다. 공개 제외 캡처의 PNG/JPG와 원본 aed347fc 조상은 후보에 넣지 않는다.
- [x] main 상태에서 build·course/home/navigation 검사를 실행해 시작 상태를 기록한다. 기존 failure가 있으면 이번 변경과 구분해 원인을 조사하고 승인된 통합 범위에서 해결한다.
- [x] 비충돌 내용만 후보로 옮긴다. main의 server/course/MD/공통JPG는 보존한다. 생성 HTML·bundle·공통 장부는 이 단계에서 복사하지 않고 이후 재생성한다.

## Task 2: 공통 소스 결합 → 양쪽 기능 검사

- [x] build.mjs: main의 course 선행 생성·수집·설정 형식 탭·6메뉴·과정 홈·주입 링크 검사와 개념26장면·reader·dark·D12 도식 guard를 구간별로 결합한다.
- [x] package.json: main build 명령과7개 전용 검사, 개념33개 전용 검사를 모두 보존한다. 공통 메뉴/홈은 main 동작을 기준으로 개념 읽기 직접 진입을 보존한다. catalog 설명 순서와 read=1 링크는 개념 구현을 적용한다.
- [x] inventory: main course52화면과 개념 reader·26종 상태 수집기를 결합한다. 장부는 ID·출처로 대조하며 기존 상태를 임의 승격하지 않는다.
- [x] D12 양 끝 단계 이동 후 초점 복구를 수정하고 기존 반례가 실패→통과하는 것을 확인한다.

## Task 3: 원문·자산·증거 대응 → 공개 제외 검사

- [x] main과 개념의 원문 차이를 읽고 main 최신 수정은 유지한다. 보존 기준이 과거 sourceSHA를 가리키면 원래 증거를 덮지 않고 통합 기준·차이 근거를 별도 기록한 뒤 승인된 보존 검사를 새 기준과 대조한다.
- [x] 공통 JPG는 main 바이트를 유지하고 신규 개념 JPG/실행 증거/진행표는 출처를 보존해 이식한다. 오래된 PNG 재유입 없이 실사용 경로·장부를 검증한다.
- [x] source 원본과 후보의 보호 경로·기술 텍스트·ID·코드·관측 원자료를 대조한다. 후보 tree 및 이력에서 제외 캡처와 원본 조상 도달 불가를 확인한다.

## Task 4: 통합 실행·독립 검수 → 준비된 후보

- [x] main 과정/설정 탭/home/navigation 및 개념26하네스/reader/dark/catalog, build·image/visual/version/parity 감사 실행.
- [x] 실제 PC 다크에서 과정 홈→개념 검색→설명·장면 전환/검색 복귀, 코드 복사·그림 확대·목차·긴 표를 확인한다. 새 캡처는 JPG. 모바일·라이트 신규 작업 없음.
- [x] 독립 Sol spec→quality 검수 후 결함을 해결하고 필요한 검사를 재실행한다.
- [x] 진행표에 통합한 범위·남은108개 보강·전수 미검증 범위를 기록한다. 의미 단위 로컬 후보 커밋과 merge 가능 상태를 보고한다. main 직접 merge/push/PR은 수행하지 않는다.
