# 처음 만드는 Java 실무

기존 학습 HTML과 별도로 만든 Java 입문자용 12개 기능·60회차 과정입니다.

## 학습 화면

저장소 루트의 `java-beginner.html`을 더블 클릭합니다. CSS/JavaScript/기획 데이터가 들어 있는 단일 파일이며 외부 폰트나 CDN이 필요 없습니다. 기능·개념 검색과 수동 진도를 제공합니다.

첫 기능은 사내 공지 게시판(Day 1~8)입니다. 인사 API 준비 회차는 제외하고 게시판을 만들며 필요한 Java 개념을 함께 익힙니다.

각 회차는 오늘 할 일 / 공통 기획서 / 화면·DB 설계 / API 테스트 탭으로 구성합니다. 공통 기획서는 기능 전체의 약속이라 같은 기능의 Day들에서 동일합니다. 오늘 할 일은 선택한 Day의 구현 과제와 확인 조건이며, 해당 회차에 배정된 업무 요청서도 여기서 읽습니다.

중간·후반에 보안/QA/운영/기획/물류 등 요청자와 상황·제약·결과를 담은 업무 요청서 14개를 둡니다. Day 54~57은 삭제 공지 보관·복구·감사 이력·기존 데이터 migration·배포 대응입니다.

회차당 2~3시간은 권장 분량이며 필요하면 나누어 진행합니다. 수동 진도만 독립 localStorage 키에 저장하고 요청·토큰·응답은 저장하지 않습니다. 회차 재편 시 v1 진도는 원본 키를 보존하고 v2의 대응 회차로 옮깁니다. 제외한 인사 API의 완료를 새 게시판 완료로 계산하지 않습니다.

## 브라우저 API 테스트

Node.js 20 이상을 준비하고 저장소 루트에서 실행합니다.

```powershell
node java-beginner/server.mjs
```

브라우저에서 `http://127.0.0.1:8787`을 엽니다. 별도 터미널에서 **직접 만든 Spring 프로젝트**를 8080 포트로 실행합니다. 이 Node 실행기는 HTML 제공과 로컬 HTTP 전달만 담당하며 학습용 정답 API를 구현하지 않습니다.

Spring 포트가 8081이면 PowerShell에서:

```powershell
$env:JAVA_BEGINNER_API = "http://127.0.0.1:8081"
node java-beginner/server.mjs
```

Git Bash에서는:

```bash
JAVA_BEGINNER_API=http://127.0.0.1:8081 node java-beginner/server.mjs
```

문서 포트를 바꾸려면 `JAVA_BEGINNER_PORT`를 설정합니다. 실행기는 loopback에서만 수신하고 고정한 로컬 API origin으로 요청을 전달합니다. CORS를 넓히기 위해 기존 Java 설정을 바꿀 필요가 없습니다. 세션 쿠키는 브라우저에서 관리하며 CSRF API가 준 token을 입력칸에 넣습니다.

목표 API는 과정에서 앞으로 만들 계약입니다. 기존 실습 서버가 이미 같은 JSON을 제공한다고 가정하지 않습니다. 인증·멱등성·긴급 표시를 추가하는 시점에 앞선 요청 형식도 함께 갱신합니다.

## 수정과 검증

내용은 `course.mjs`, 화면은 `view.mjs`/`style.css`/`app.js`, 요청 처리 규칙은 `request.mjs`, 전달 서버는 `server.mjs`에서 수정합니다. 루트 HTML은 이 독립 빌드로 재생성합니다.

```powershell
node java-beginner/build.mjs
node --test java-beginner/course.test.mjs java-beginner/progress.test.mjs java-beginner/request.test.mjs java-beginner/server.test.mjs
```

기존 `tools/site` 빌드·Dnn 과정·학습 HTML·Java 구현은 변경하지 않습니다. UI 검증용 `qa/browser-fixture.mjs`는 메모리 fixture이며 실제 Spring/DB 구현의 검증이 아닙니다. 현재 확인 범위는 `VERIFICATION.md`에 기록합니다.
