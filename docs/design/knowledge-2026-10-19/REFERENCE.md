# 웹 ChatGPT 원본과 로컬 적용

- 요청한 대화: https://chatgpt.com/c/6ad3294e-ed5c-83e8-9237-bccf275f7fe2
- 사용자 지시로 기존 Pro 대화에 web-request.txt를 전송했다. 웹 응답은 66분 20초 처리 후 완료됐고, 이미지 12장과 개발 인계 ZIP을 실제 다운로드했다. 최종 선택 화면은 9장이다.
- ZIP 보존: /Users/ds/research/javaExperience-chatgpt-design-handoff-2026-10-18/_data/javaExperience-v8-knowledge-package.zip
- ZIP SHA-256: 3299e91484380826bf22ed7a9c5e28f11d4484e3c349ba91ab0226d3a8df1b72
- 화면·버튼별 인계 HTML: /Users/ds/html/javaExperience-knowledge-v8/javaExperience-v8-knowledge-handoff.html
- 개념별 대기표 HTML: /Users/ds/html/javaExperience-knowledge-v8/javaExperience-v8-concept-queue.html
- 원본 JSON·SVG·참고 검색 모듈: web-handoff/ 아래 보존. 외부 참고 검색 모듈을 그대로 실행하거나 기존 빌더를 덮어쓰지 않았다. 현재 Markdown을 읽는 기존 사이트에 필요한 데이터만 연결했다.
- 실제 요청·최종 응답 DOM·수신 증거 캡처: /Users/ds/research/javaExperience-chatgpt-design-handoff-2026-10-18/_data/

## 원본 범위

웹 분석의 근거는 대화에 첨부된 단일 HTML이다. 원격 GitHub와 최신 로컬 홈은 웹 실행자가 확인하지 못했다. 로컬에서는 134개 문서 ID·경로와 실제 본문 제목, 4개 분류의 31/31/29/43건, 웹 선택 앵커 348개 및 전체 앵커 3,113개를 HTMLParser로 다시 대조했다. 미확인 역링크 112개는 추천으로 승격하지 않았다.

웹 문서의 티켓 5건은 첨부 스냅샷 기준이고 현재 로컬은 30개다. 후속 실전 미션 설계에서는 현재 자료를 다시 읽어야 한다. S23의 README 표시명과 본문 제목은 다르지만 같은 실제 문서이며 기존 README 표시명을 보존했다.

## 적용 시 달라진 부분

- 실제 저장소는 각 문서가 별도 HTML이다. 첨부의 해시 라우터 대신 원래 상대 HTML 경로와 같은 문서의 query/history를 사용한다. 원래 hash 앵커는 유지한다.
- 검색 본문은 현재 Markdown 제목과 h1~h3다. 장식용 UI 제목·코드·정답 본문은 색인에 넣지 않았다. DTO 7건은 동일하며 객체는 13건, 트랜잭션은 20건으로 재계산된다(웹 첨부의 렌더된 제목 색인은 16/22건).
- P16 원문은 같은 페이지 아래에 보존하고 펼친다. 웹 명세의 별도 원문 탭과 다른 구현이다. 원문 깊은 앵커와 검색 목록으로 돌아가는 기능은 유지한다.
- 모바일 다음 버튼은 문서 흐름 안에 두어 하단 메뉴가 내용이나 조작을 가리지 않게 했다. 같은 뷰포트의 실제 화면 비교는 미검증이다.
- 134개 대기표의 전문 검토·개별 상세 완료 0이라는 원본 범위를 그대로 보존한다. 로컬 적용은 공통 탐색과 P16 §3.2 대표 예제뿐이며 모든 P16 절을 새로 검증한 것이 아니다.
