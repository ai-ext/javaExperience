# 개념 학습의 원문 앵커 history 회귀 수정

2026-10-20 KST. P20 검증에서 원문 링크를 누르면 선택 장면이 초기화되는 동작을 실제 Chrome에서 발견했다. P20은 7ad3a7c에 수정했고, 같은 패턴의 P09/P04/P16 보충/W09/P19 다섯 controller를 별도 checkpoint로 검토했다.

앵커 이동은 page key가 없는 새 history 항목을 만들 수 있다. 기존 popstate listener가 restore(undefined)를 호출해 기본 질문/장면으로 돌아갔고 P09의 comparison도 false가 됐다. 수정은 해당 key의 record가 있으면 복원하고, 없으면 현재 장면/비교 상태를 새 항목에 저장하는 범위다. 기존 다른 소유 state는 spread로 보존한다. 학습 데이터·이미지·원문 내용·진도 저장은 바꾸지 않았다.

서브에이전트가 실제 생성 HTML과 해당 classic bundle을 JSDOM outside-only로 실행하는 회귀 검사를 작성했다. 원문/key 누락/null state/P09 비교/유효 record 복원/다른 소유 state/원문 map DOM/storage·network 미접근을 검사한다. 수정 전 BEFORE.json 및 메인 재실행 BEFORE-main.json에서 다섯 페이지·22검사 실패를 확인했다. 수정 뒤 AFTER.json에서 총65검사 통과·실패0을 확인했다. 일반적인 의미 없는 반복 테스트가 아니라 실제 앵커 오류의 회귀다.

실제 Chrome 1672×941/360×800에서 다섯 페이지×양쪽10흐름의 마지막 질문·장면을 선택하고 원문 링크와 새로고침 뒤 상태 유지를 확인했다. P16은 기존 전체 페이지의 다른 script도 함께 동작하는 조건이다. P09 references/reassignment-return에서 comparison=true를 유지한 양쪽2흐름을 추가로 확인했다. 모바일 P09의 실제 뒤로/앞으로도 같은 장면과 comparison=true였다. browser-history.json/browser-comparison.json/browser-back-forward.json/browser-validation.json에 관찰값을 보관한다.

화면 캡처12개는 조작 기록의 보조 증거다. 원문이 열린 상태와 smooth scroll 때문에 일부 viewport 캡처에는 선택한 학습 그림이 모두 나타나지 않는다. 이는 신규 이미지나 전체 시각 품질의 인증이 아니며 대표 comparison 전체 화면을 별도 보관한다. 원문/선택 상태의 판정은 DOM 관찰 기록과 bundle 회귀 검사에 근거한다. 번역 확장 overlay는 사이트 UI와 구분한다.

다섯 HTML은 7ad3a7c와 대조해 해당 학습 bundle의 cache hash만 달라졌다. 원문/지도/화면 문구의 변화는 없다. html-preservation.json 및 preservation.json에서 문서135/학습자서버17파일 SHA 불변을 확인했다. 새 시안이나 개념 내용을 생성한 변경이 아니므로 기존 parity/inventory 상태를 올리지 않았다.

필수 build·새회귀·P09/P04/P16/W09/P19/P20 테스트·catalog·visual/version/parity는 final-checks.txt에 명령·출력·exit를 기록한다. 독립 리뷰는 REVIEW.md에 기록한다. JSDOM과 Chrome 두 viewport에서 확인한 동작으로 한정하며 다른 브라우저·전수 pixel·실제 학습자 검증은 하지 않았다. 기존 모든 상태의 의미나 전체134문서 완료를 새로 인증하지 않는다. 원본 worktree/main의 통합·push·PR은 하지 않는다.
