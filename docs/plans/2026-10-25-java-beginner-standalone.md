# Java 입문 기능별 학습 HTML 구현 계획

**Goal:** 기존 HTML과 실습 코드를 보존하고, 새 `java-beginner.html`에 60회차 기획서와 실제 API 요청 도구를 제공한다.

**Architecture:** 새 `java-beginner/` 폴더에 과정 데이터, 화면 소스, 빌드, 로컬 HTTP 실행기를 둔다. 빌드는 외부 라이브러리 없이 루트의 단일 HTML에 CSS/JS/데이터를 포함한다. 파일을 직접 열면 학습 내용을 읽을 수 있고, Node 실행기로 열면 같은 출처의 전달 경로로 로컬 Spring 서버를 호출한다. 서버 기능의 정답 구현은 제공하지 않는다.

**Tech Stack:** HTML, CSS, browser JavaScript, Node.js 내장 HTTP/test 모듈. 원격 배포·커밋·push는 범위 밖이다.

## 승인된 방향
- 사용자의 2026-10-25 요청: Java 입문, 점진적으로 어려운 현업 기능, 기능별 일자 할당, 간단한 세부 기획서, 화면 필드/저장 데이터/API/검증, 깔끔한 다크 HTML.
- 후속 교정: 기존 HTML 수정이 아닌 새로운 HTML 생성.
- 60회차/회차당 2~3시간은 권장 분량이며 개인 속도에 따라 나누어 진행한다. 기존 45일 과정과 진도는 공유하지 않는다.

## 작업과 검증
1. `java-beginner/course.test.mjs`에서 60회차 연속성, 기능별 기획/DB/API/검증 자료, 상대 참조의 유효성을 먼저 검사한다.
2. `java-beginner/course.mjs`에 12개 기능 묶음과 60회차를 작성한다. 클래스/DTO 기본 원리에서 시작하고 인증·동시성은 후속 기능으로 미룬다. DTO는 일반 클래스를 사용한다.
3. `java-beginner/request.mjs`, `request.test.mjs`에 경로/JSON 검증·요청/응답 판정·생성 id 이어 쓰기 동작을 준비한다. HTTP 오류와 연결 오류를 구분한다.
4. `java-beginner/server.mjs`, `server.test.mjs`로 정적 HTML과 고정 로컬 대상의 `/__api` 전달을 제공한다. 실제 HTTP fixture로 전달 메서드/본문/오류/쿠키를 확인한다. 테스트 fixture는 학습자의 API 구현 성공으로 보고하지 않는다.
5. `java-beginner/style.css`, `app.js`, `build.mjs`에서 다크 화면을 만들고 `java-beginner.html`을 생성한다. 목록/일자/기획/DB/API 탭, 검색, 수동 진도, 요청 편집과 응답을 제공한다. 요청/토큰/응답은 영구 저장하지 않는다.
6. 새 빌드와 Node 테스트를 실행하고 가능하면 브라우저로 목록·탭·요청과 연결 실패를 확인한다. 기존 HTML이나 서버 코드가 변경되지 않았는지 Git으로 대조한다.

## 제약과 근거
- Java 21은 현재 프로젝트 toolchain과 일치한다. 기존 실습 Java에는 학습 중인 코드가 있으므로 컴파일 성공을 가정하거나 임의 수정하지 않는다.
- Spring REST 시작: https://spring.io/guides/gs/rest-service/
- 비밀번호 저장: https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html
- Swagger 호환 참고: https://springdoc.org/ (Boot 4에는 springdoc 3.x 계열; 이 결과물은 별도 요청 도구이므로 기존 Gradle 의존성 변경 불필요.)
- 이 독립 결과물은 기존 사이트 빌드 파이프라인과 원본 Dnn JSON의 내용을 바꾸지 않는다. 독립 빌드와 개별 확인 결과를 기록하며 시안 대조 증거 없이 verified라고 표시하지 않는다.

## 후속 사용자 요청 반영

- 1단계를 사내 공지 게시판으로 바꾸고 쉬운 첫 요청 4회차를 제외한다.
- 60회차는 유지하며 운영 중 삭제 공지 복구/이력/데이터 이관/호환 배포의 4회차를 추가한다.
- 중간·마지막의 현업 요청을 14개 회차별 업무 요청서로 구체화한다.
- 기능 단위 공통 기획서와 일자별 구현 작업을 분명히 표시한다. 기획서 본문을 의미 없이 Day별로 복제하지 않는다.
- 번호 변경 전 진도는 원본을 보존하고 대응되는 새 회차로 옮긴다. 기존 준비 회차 완료를 게시판 완료로 오인하지 않도록 테스트한다.
