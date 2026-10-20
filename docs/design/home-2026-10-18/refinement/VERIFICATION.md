# 홈 개선 4개 항목 · 구현 및 검증

확인일: 2026-10-18. 작업 브랜치 docs/visual-learning-next. 사용자 승인 범위는 이전 홈 분석의 4개 지적이다.

## 1. 최종 서비스와 큰 시각 학습

- imagegen으로 만든 service-preview-reference.png를 기준으로 실제 HTML 게시판을 구현했다. 3개 예시 글, 목록/상세 병치, 글쓰기, 빈 입력 오류, 예시 글 추가, 모바일 단일 화면 전환을 지원한다. 예시는 내 서버·DB·진도 저장과 분리한다.
- new의 학습 그림 5장을 만들었다. 선언 → new 평가 → 참조 대입 → 참조 공유 → 별도 객체 생성의 코드와 같은 값을 나란히 보여준다. 원본 03~05의 화살표가 필드에 연결되는 오해를 줄이도록 객체 header의 접점으로 교정한 v2를 선택했다.
- 이미지 텍스트·객체 수·참조 연결을 직접 눈으로 확인했다. HTML에도 정확한 필드값과 설명을 병기했다. 이미지 자체 확인과 실제 페이지 렌더 확인은 다른 검증이다.
- 원문의 Greeting.java를 추출해 Java 21로 컴파일·실행했다. same == greeting은 true, another == greeting은 false, 두 record 값의 equals는 true이며 기록한 서로 다른 Greeting 인스턴스는 2개였다. source-proof/의 소스와 결과를 보존했다. 실제 메모리 주소나 DB 저장으로 표현하지 않는다.
- 생성 프롬프트 전체는 imagegen-prompts.json, 10개 원본/초안/교정본의 크기·SHA-256·선택 여부는 asset-index.json에 있다. 실제로 선택한 것은 참고 시안 1개와 학습 자산 5개다.

## 2. 메뉴·목차 이름과 현재 공간

- 공통 header를 홈 / 서비스 만들기 / 실전 미션 / 개념 학습으로 통일했다.
- 전체 문서의 소속 폴더에 따라 aria-current를 표시하며, 오류 문서는 특정 공간으로 오인하지 않는다.
- 시나리오/미션/지식 목차의 표시 h1과 브라우저 탭 이름도 서비스 만들기/실전 미션/개념 학습으로 맞췄다. 기존 제목의 부연 설명, id, permalink와 원문 Markdown 본문은 유지한다.
- 생성된 339쪽과 index.html에서 이름·현재 공간·상대 링크를 모두 검사했다.

## 3. 시작점 적용 결과

- 선택 적용만으로 큰 과제 카드와 오른쪽 예시가 선택한 과제로 바뀐다. 기존 active 과제와 마지막 장면은 바꾸지 않는다.
- 보관한 과제의 이름·마지막 위치·이어가기 링크를 별도 영역에 표시한다. 이 링크로 돌아가면 선택 대기를 해제하고 기존 이력을 유지한다.
- 새 과제 시작 버튼에서만 active를 전환한다. 첫 방문·재선택·기존 과제 선택·새로고침·완료 이력·다중 탭·손상 저장소를 검사했다.

## 4. 시작 버튼 곁의 환경 준비

- 주 시작 버튼 바로 아래에 IDE·서버·DB 준비 버튼을 두고 짧은 4단계 dialog로 연결했다.
- build.gradle의 JDK 21과 application.yml의 활성 MySQL localhost:3306, compose.yaml의 기본 localhost:13308을 실제로 읽는다. 포트가 다를 때만 차이를 안내한다. 주석 처리된 H2를 활성 설정으로 오인하지 않는다.
- 전체 설치·실행 안내로 이동할 때 dialog를 닫고 원문을 펼쳐 포커스를 이동한다.
- 준비 완료를 자동 추정하지 않으며 과제 열람을 차단하거나 학생의 설정·DB를 변경하지 않는다.

## 실제 실행한 검사

- npm run build: HTML 339개, 시나리오 101단계, 링크 오류 0.
- npm run test:home: 상태/홈 통합/이미지·코드 5장면/최종 게시판/환경 준비 검사 통과.
- npm run test:navigation: 모든 339쪽+index.html의 메뉴·현재 표시·상대 링크 및 3개 목차의 h1/탭 제목 통과.
- npm run audit:visual, audit:version-cards, audit:parity: 통과. parity는 파일·기록 형식 검사이며 시각 일치의 증명이 아니다.
- 관련 회귀: test:learning-entry, test:task-focus, test:first-java, test:annotations, test:first-db, test:db01-focused, test:db02-focused 통과.
- 홈 관련 CSS 544개 규칙 파싱, 홈 중복 ID·깨진 ARIA 참조 없음.
- git diff --check 통과. 학습자 서버 소스·build.gradle·compose.yaml 변경 없음.

## 문서 실행 방식 보완

홈 제어 소스는 esbuild 0.28.2로 일반 script인 home-learning.bundle.js로 생성한다. 브라우저의 file:// ESM import에 의존하지 않게 했다. 생성 번들을 그대로 평가하는 DOM 검사도 통과했다. 진도 공유·API 요청을 포함한 전체 실습은 README의 HTTP 문서 서버 방식을 안내한다. 이 변경은 브라우저 도구 접근 권한과 관계없다.

## 남은 검증

앞선 로컬 페이지 자동 열기 보안 정책 거절을 다른 URL·브라우저·실행 도구로 우회하지 않았다. 실제 데스크톱·360px 렌더, 같은 뷰포트의 시안 비교, native dialog 포커스/스크롤/터치·브라우저 콘솔·실제 자동 script 로딩은 미검증이다. 새 parity 항목은 implemented이며 verified로 올리지 않는다. 위 검사 통과를 실제 사용성·디자인 완성도 검증과 같게 표현하지 않는다.
