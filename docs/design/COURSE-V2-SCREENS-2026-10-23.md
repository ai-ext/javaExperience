# 과정 v2 화면 구현 기록 (P5-2, 2026-10-23)

설계 §5-1·§6·§7과 P5 계획 순서 2번(렌더러·홈·과정 지도)의 구현 범위와 확인 결과다. 흐름 재생과 미캔 요소는 P5-3 범위라 여기서는 자리만 둔다.

## 구현한 것

| 화면 | 원문 | 렌더러 | 구성 |
|---|---|---|---|
| 일자 페이지 D00~D15 | `course/spring/Dnn.md`(생성물) | `tools/site/course-pages.mjs` `renderDayPage` | 머리(단계·Java·순서 수 칩), [오늘 순서] 체크 칩, [오늘의 Java] 카드, 순서 칸(만들 파일·겪을 것·완료 조건·명세, 2단계는 티켓 배지), 칸 끝 체크, 힌트·정답 접기(정답 닫힘, 펼칠 때 하이라이트), 채점 프롬프트 복사, 이전·다음 날 |
| 홈 | `README.md` → `index.html` | `renderCourseHome` + `renderHomeReference` | 첫 화면 = 과정 v2(오늘 할 일 Day N, 15일 진도, Spring·Java·티켓·지도 진입). 기존 홈 전체는 아래 "참고 도감"으로 내림(링크·이어하기 유지) |
| 과정 지도 | `course/map.md` + `roadmap.json` + `course/map-tickets.json` | `renderCourseMap` | 레인 4개(Java·Spring 일자·티켓·결함 영역), 범례(노드 종류·연결선 3종과 방향), 관계 보기 4종, 선택 상세, 정지 상태 대체 관계 표 3개 |

- 진도: `localStorage` 키 `javaexperience.course.progress.v1`, 형식 `{version:1, steps:{"D04-1":true}}`. 읽기·쓰기 실패 시 화면은 그대로 두고 안내 문장만 바꾼다(`tools/site/course.js`).
- 오늘 할 일: 체크가 있는 가장 늦은 날이 덜 끝났으면 그날, 다 끝났으면 다음 날, 체크가 없으면 D01(+D00 워밍업 안내).
- 결함 영역은 설계 §5-3 티켓 표의 "심은 원인" 열을 9개로 묶은 편집 분류다(`course/map-tickets.json`). E01(D14-5 고도화)은 roadmap에 티켓 ID가 없어 같은 파일에 날·순서를 적었다.
- 참고 화면 `~/reference/devops-repo-map.html`은 이 기기에 없어(`mdfind`·`find` 결과 없음) 설계 §7의 문구(노드·연결선 범례, 관계 보기 4종)만 기준으로 했다.
- 공통 자산(`site.css`, `syntax-highlight.js`, `home-visual.css`, `home-learning` 번들, `site-navigation.mjs`)은 고치지 않았다. 새 자산 `course.css`·`course.js`·`course-map.js`는 일자 페이지·지도·홈에만 붙는다.
- `course/` 페이지에서는 공부자료 ID 자동 링크를 끈다. D01·B01·J04가 `docs/knowledge/D01-…`, `B01-account-lifecycle` 같은 다른 문서로 잘못 이어지고 있었다.

## 확인

- 자동: `npm run build`(링크 오류 0), `npm run test:course-pages`(일자 16쪽 배치·체크 동기화·저장 실패·정답 지연 하이라이트, 홈 Day N·15일 진도·진입 링크, 지도 노드 58·간선 59와 관계 표 대조, 관계 보기 계산), 기존 `test:home`·`test:navigation`·`test:learning-entry` 통과(기대값 변경 없음).
- 브라우저(Playwright + Chrome, `python3 -m http.server`): 홈·D00·D04·D10·D12·지도를 1440·390 폭, 라이트·다크에서 열어 콘솔 오류 0, 스크롤 컨테이너(pre·표) 밖에서 뷰포트를 넘는 요소 0. 조작: D04 칩 제목 클릭은 이동만 하고 체크는 바뀌지 않음, 칩과 칸 끝 체크 동기화, 정답 펼침 후 하이라이트 4블록, 복사 버튼 성공 문구, 같은 출처 홈에서 오늘 할 일 = D04·진도 2/74, 지도 D12 + 상·하류 전체에서 9개 노드·연결선 10개 강조.
- 스크린숏은 커밋하지 않았다(세션 scratchpad `p5-2-shots/`).

## 남은 것

- imagegen 시안·시안 대조(`visual-parity.jsonl`)는 하지 않았다. 목록 상태는 `unreviewed → mockup_ready → implemented` 순서로만 오르므로, 시안이 없는 새 항목(과정 v2 20쪽, 홈의 과정 영역)은 모두 `unreviewed`로 두었다. 위 확인 결과는 시안이 생긴 뒤 상태를 올릴 때의 구현 근거로 쓴다.
- D15 무작위 10문항 뽑기, 2단계 정답 칸 연결(P5-4), 흐름 재생 컴포넌트와 미캔 요소(P5-3)는 이 범위 밖이다.

## P5-3 흐름 재생 (2026-10-23)

| 화면 | 원문·데이터 | 렌더러 | 구성 |
|---|---|---|---|
| 일자 페이지 D01~D10 [오늘 흐름] | `course/flows/days.json` | `tools/site/course-flow.mjs` `renderDayFlow` (자리: `section.day-java` 바로 뒤) | 대표 요청 1개의 노드 지도(그날 만든 층은 "오늘 만듦"), 재생 조작(이전·재생/일시정지·다음·0.5/1/2배속·단계 수), 지금 단계 카드, 정지 상태 단계 목록(단계마다 위치·관찰 시점·값과 꼬리표 예시/코드/대표) |
| 일자 페이지 D11~D14 | `course/flows/tickets.json` + roadmap 티켓 | `renderDayTicketLinks` | 그날 티켓의 장애 흐름으로 가는 목록. 증상 단계 수만 보여 주고, 원문이 커밋되지 않은 티켓은 "준비 중" |
| 티켓 페이지 [장애 흐름] | `course/flows/tickets.json` | `injectTicketFlow` (빌드 때 '받은 티켓' 다음에 넣음, 원문은 고치지 않음) | 증상·관찰 지점 단계는 펼쳐 둔다. 원인 단계는 닫힌 접기 안에만 있다. 펼치면 재생 순서에 끼어든다 |

- D00·D15는 흐름이 없다(빈 자리 유지). D11~D14는 요청 흐름 대신 티켓 흐름으로 잇는다(Ruling).
- 시각 요소의 출처와 판단: [COURSE-V2-MIRICANVAS-2026-10-23.md](COURSE-V2-MIRICANVAS-2026-10-23.md)
- 확인: `npm run test:course-pages`
  - 정지 상태의 단계·값을 데이터와 대조한다.
  - 값의 근거 문자열 285개를 확인한다. 일자 흐름은 그날 정답 커밋의 파일, 티켓 흐름은 원문의 접기 밖·원인과 정답 안을 본다.
  - 원인 단계 누출을 검사한다. 접기를 지운 티켓 HTML에 원인 문장이 남아 있지 않아야 한다.
  - 재생 조작을 검사한다: 이전·다음·Home·End·←→, 2배속 1.3초·0.5배속 5.2초, 마지막에서 멈춤, 원인 접기 열고 닫기.
- 브라우저 확인(Playwright + Chrome): D04·D08·D09·B01·B16(+D12)을 1440·390 폭, 라이트·다크에서 열었다.
  - 콘솔 오류 0, 가로 스크롤 없음.
  - 조작이 위 검사와 같게 동작했다.
  - 스크린숏은 세션 scratchpad `p5-3-shots/`에만 있다.
