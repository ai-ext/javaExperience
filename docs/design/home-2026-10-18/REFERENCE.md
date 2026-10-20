# 홈 참고 시안 출처

- 생성일: 2026-10-18
- 생성 방식: 내장 `image_gen` (`ui-mockup`)
- 파일: `home-desktop-reference.png` · 1536×1024
- 근거: 사용자가 전달한 H01–H06 텍스트 설명, `intent.md`, 0-1·1-1·1-2 및 DB-01 원문.
- 기존 H01–H06 원본을 확보하지 못해 새로 만든 구현 참고 시안이다. 기존 시안의 복원본 또는 실제 화면 캡처가 아니다.
- 이미지의 인사말 문장부호·작은 코드보다 0-1 원문의 `김자바님, 반가워요`와 실제 DTO 필드 계약을 우선했다.
- 적용 범위: 밝은 셸, 메뉴, 목적 소개, 현재 과제·API·작성 파일·완료 목표, 예시 입력과 응답, 학습 흐름, 미션·개념 진입.
- 하단 FAQ·환경 안내·원문 접기·모달·재방문·완료·모바일은 전달받은 텍스트 설계로 구현했다. 이 한 장에 모두 그려져 있다고 주장하지 않는다.
- 같은 뷰포트의 브라우저 캡처·픽셀 비교·모바일 실기 검증은 미완료. `file://` 자동 열기는 URL 보안 정책으로 거절됐고 다른 경로로 우회하지 않았다.

## 생성 프롬프트 원문

```text
Use case: ui-mockup. Create one high fidelity desktop website home page screenshot for javaExperience Korean backend learning service. This is a new implementation reference derived from an approved textual home specification; not a reconstruction of unavailable original H01-H06. Landscape 1536x1024, flat straight-on pixel-perfect real product screenshot, no device frame, no annotations. Light white and very pale blue-gray background, blue #315DE8 primary, slate typography, thin crisp dividers, generous whitespace, refined Korean UI text, readable 16px body, beautiful restrained precision. Header logo small blue square code icon javaExperience left; nav 홈 active, 서비스 만들기, 실전 미션, 개념 학습; right 개발 환경. Center max width 1200. Intro eyebrow 직접 만들며 배우는 백엔드 then large title '작은 API부터, 하나의 서비스까지.' and short intro '요구사항을 읽고 직접 구현한 뒤, 응답과 DB 결과로 확인하세요.' Main 2 columns below. Left current task no deeply nested cards: blue small 첫 시작 · 0-1, title '이름을 받아 인사하는 첫 API', short description, neat API code GET /api/start/hello, 지금 할 일 Greeting.java와 GreetingController.java 만들기, 완료 목표 이름에 따라 달라지는 JSON 응답 확인. Strong blue button '첫 API 만들기 →' and quiet '시작점 바꾸기'. Right beautiful actual HTML-like interactive preview with little caption 이번 과제의 완성 예시, small 예시 데이터 badge, browser panel with name input 김자바 and 요청 보내기 button, below clean dark navy JSON response code name 김자바, message 김자바님 반가워요, nameLength 3; concise disclaimer 학습용 예시 · 내 서버 실행 결과와 별도. Under hero discreet three milestones 첫 API → 게시글 저장 → 조회와 확장. Below, start of section '이렇게 배우면 됩니다' with three horizontal numbered editorial steps 상황 이해, 직접 구현, 결과 확인 and small simple precise visuals of API request, Java file, response. Show bottom edge beginning two side-by-side entry blocks 실전 미션 and 시각 자료로 개념 이해, concept small refined new Greeting -> object(name 김자바) visual. Avoid gradients, huge marketing typography, overly technical dense charts, overdecorated illustrations, extra dashboard metrics, deep cards, meaningless icons, login/account.
```
