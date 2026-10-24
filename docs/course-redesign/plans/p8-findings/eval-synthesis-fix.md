# 종합 평가 실행안 1~8 구현 결과

확인일: 2026-10-24(KST). 작업 공간: `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap`. 브랜치: `course/p1-spec-roadmap`. 기준 HEAD: `46dd523a523574fb2f7eba0159f7f29db3bc2d7e`. 작업 시작 시 clean이었다. 아래 변경은 미커밋 상태다.

## 근거와 범위

[/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/synthesis.md](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/synthesis.md)의 3절·4절과 A-learner-walkthrough.md, B-sequencing.md, C-api-workflow.md, screen-D2.md, screen-E2.md의 해당 원 근거를 대조했다. C의 이미 반영된 누락과 남은 누락을 구분했다. 데이터 영역 맨 위 이동·전 과제 층별 분할·참고 도감 제거·D11 준비 절차 숨김은 하지 않았다. 2단계 신규 공개 문구는 목적·증상·결과 조건만 설명하며 원인·해법은 기존 접기 안에 유지했다.

## 실행안별 상태

| 실행안 | 상태 | 해결 묶음 | 구현 결과 | 바꾼 원본·검사 파일 |
|---|---|---|---|---|
| 1 | 완료 | 다02·다03 | D03 회원 INSERT와 중복 확인 SQL에서 잔액 의존을 제거했다. D07에서 잔액 도입을 안내하고, 생략 컬럼·감사 컬럼·복합 키·COUNT 설계에 맞춘 SQL 조정 예를 제공했다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/start/dummy/seed.sql](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/start/dummy/seed.sql)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/start/dummy/README.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/start/dummy/README.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/hints.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/hints.json)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/seed-sql.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/seed-sql.test.mjs) |
| 2 | 완료 | 다01·다04 | 75순서의 files를 create/modify/inspect로 구분했다. C의 남은 기존 파일 6순서·Repository 4순서·신규 DTO를 채우고, 제목에 명시된 기존 PG 설정·재시도 연결도 보완했다. 핵심 7순서에만 트랜잭션 경계·설계 이유·실패 결과를 완료 조건에 추가했다. 생성기와 검증기가 같은 파일 계약을 사용한다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/validate.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/validate.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/file-actions.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/file-actions.test.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/validate.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/validate.test.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs) |
| 3 | 완료 | 가02·나04 | D01~D15 머리에 실제 존재하는 섹션만 바로가기로 표시한다. 준비 순서에서 테이블별 데이터로 이동하고 해당 순서로 복귀한다. D08 원장 조각·D06 실험 복귀도 연결했다. D04 bulk는 D05 준비 이후 D06의 별도 실험 DB 진입점으로 유도한다. 원래 데이터 영역 위치는 유지했다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.test.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/api-guide.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/api-guide.test.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.css](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.css)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs) |
| 4 | 완료 | 가03·가04 | 기존 javaexperience.course.progress.v1의 version:1·steps를 보존하고 optional selectedTicket/preparation을 추가했다. D11에서 증상·관찰 도구·수행일·훈련 영향을 비교해 1건을 선택한다. D14·홈에 같은 선택과 E01·훈련 바로가기를 표시한다. 미선택 후보는 추가 연습, E01·훈련과 D11 공통 작업은 필수로 유지한다. 구현 체크와 채점 결과를 구분하고 SQL·말하기·채점 마무리 링크를 제공한다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.css](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.css)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/package.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/package.json) |
| 5 | 완료 | 가01·가05·가08 | 공통 상단 메뉴에 과정 v2 일자 목록·지도를 추가했다. 15일 목적과 D06 JPA 쓰기→MyBatis 읽기 선택 이유를 보강했다. D10에 1단계 완성과 별도 인수인계 서버 전환을 명시했다. D11의 폴더·DB·기동·기준 테스트 절차는 노출하고 준비 기록을 구현 진도와 분리했다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/site-navigation.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/site-navigation.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-site-navigation.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-site-navigation.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js) |
| 6 | 완료 | 나01·나02·나03 | D02에 싱글톤 빈·요청 스레드 공유의 최소 설명과 J07 연결을 추가했다. D10 자기 서버에서 jcmd 스레드 덤프·Actuator metrics·slow log·EXPLAIN ANALYZE 관찰 및 해석·임시 설정 복원을 요구한다. 이 증거를 완료 조건과 채점 focus에도 연결했다. E01은 선행 자료와 동시 적재→대기 상한→무효화 경쟁의 결과 조건을 공개한다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/hints.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/hints.json)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/tickets/E01.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/tickets/E01.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/learning-links.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/learning-links.test.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs) |
| 7 | 완료 | 가07·다05 | J09→D13 B09를 연결하고 J11~J14의 목적만 접기 밖에 추가했다. J13은 당일 전략 구현 과제를 추가하지 않는다. D13 카드 ID별 과제·티켓을 질문과 roadmap talkCardLinks에 연결했다(1=⑤B06, 2=②B07, 3=③B09, 4=④B10). TC-D05-5는 인덱스 이유까지 질문에 명시했다. 카드 ID와 기존 상세 접기를 유지했다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J09.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J09.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J11.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J11.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J12.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J12.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J13.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J13.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J14.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J14.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/talk-cards.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/talk-cards.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/learning-links.test.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/learning-links.test.mjs) |
| 8 | 완료 | 가06·가09·가10 | D01~D15 채점 프롬프트 제공 현황으로 안내를 수정했다. SQL 자동 복사 실패 시 길게 눌러 복사·파일 받기를 안내하고, 다른 기기·브라우저에서는 일자 목록에서 하던 날로 직접 재진입하도록 안내한다. | [/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/README.md](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/README.md)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs)<br>[/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs](/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-synthesis.mjs) |

생성 Markdown·HTML은 직접 편집하지 않고 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site`에서 `npm run build`로 갱신했다. 공통 메뉴 변경 때문에 기존 도감 HTML도 재생성됐다. `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/docs/design/visual-inventory.jsonl`과 요약·체크리스트는 inventory 생성기로 갱신했고 새 항목을 임의로 verified로 올리지 않았다.

## RED → GREEN

- seed: D03 최소 스키마 적재와 D07 잔액 도입 계약을 먼저 실패시킨 뒤 수정했다. seed 관련 5개가 최종 통과했다.
- 파일 작업 구분: 누락 파일·3분류 정확한 분할·경계 완료 조건·목적·D10 전환·D08 PG 연결을 회귀로 추가했다. 초기 신규 실패를 확인한 뒤 관련 검사에서 통과했다.
- 학습 연결: J09/B09·J11~J14 공개 목적·카드 매핑·질문 범위·E01 순서를 먼저 실패시킨 뒤 수정했다. raw HTML 순서 앵커를 Markdown 링크로 써서 빌드가 실패한 경우도 회귀로 추가해 교정했다.
- 화면: 섹션 바로가기, 선택 저장/변경/해제, 기존 진도·다른 탭 보존, 저장 실패, D11 준비 분리, 후보/필수 구분, 복사 대체, B14 관찰 도구, E01·훈련 바로가기를 먼저 실패시킨 뒤 수정했다. 신규 화면 검사 10개가 최종 통과했다.
- 통합 검사에서 D08 원장 복귀 매핑과 테이블별 복사 버튼의 속성 매칭 회귀도 확인·수정했다. 새 앵커 id가 있어도 테이블별 복사·원문 동일성 검사가 통과한다.

실패·성공 로그: [/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/logs](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/logs). seed 로그는 [/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/mysql](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/mysql)에 있다.

## 브라우저 확인

요청된 `python3 -m http.server 18981 --bind 127.0.0.1`과 `/Users/ds/.claude/skills/gstack/node_modules/playwright`의 Chromium을 사용했다. 1440×900·390×900 각각에서 D01~D15, 과정 안내·더미 안내·말하기 전체·J09/J11~J14·E01·일자 목록·지도·홈을 열었다. 최종 54개 화면 확인, 14개 조작 기록, pageerror/검증 오류 0, 스크린샷 74개다.

- D11에서 선택 도구를 클릭해 B14 선택 → 준비·구현 체크 → 새로고침 → D14·홈에서 동일 선택을 확인했다.
- 다른 탭의 D11에서 B16으로 변경하자 열린 홈에 반영됐다. D14에 201/200·1초 이내 훈련 기준이 표시됐다.
- B14 선택 상태에서도 D14⑤ E01·⑥ 훈련은 필수로 유지되고 각 과제 바로가기가 실제 이동한다. 고르지 않은 후보는 추가 연습으로 표시된다.
- D04 테이블 준비→tag 데이터→원래 ② 과제 복귀, SQL 섹션 이동, 테이블별 복사 버튼 3개, 자동 복사 실패 시 터치 안내·실제 파일 다운로드를 확인했다.
- J09→D13 B09 링크와 SQL 섹션 이동 뒤 제목이 상단 메뉴에 가리지 않는지 좌표로 확인했다. 두 폭 모두 가로 넘침이 없었다.
- D11 선택·준비 기록, D14 선택·훈련 기준, D04 데이터 왕복·복사, 홈 선택 요약, D10 진단 관찰 캡처를 직접 열어 문구·배치를 확인했다.

캡처·재현 스크립트·상태 기록: [/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18). 최종 결과: [/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/browser-result.json](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/browser-result.json). HTTP 서버는 종료했고 18981 LISTEN이 없는 것을 확인했다.

## 실제 MySQL 확인

일회용 `mysql:8.4` 컨테이너의 실제 버전은 8.4.11였다.

- 잔액 컬럼 없는 D03 회원 테이블에 D03 블록 적재 성공: 20명, ADMIN 1명·USER 19명. `point_balance` 컬럼 존재 수 0. D03 두 SQL 문항도 같은 최소 테이블에서 확인했다.
- 수정하지 않은 board-server schema.sql 전체 + seed 전체 + bulk 적재 성공. 회원 20·글 20,100·댓글 40,080·좋아요 40,150·원장 42·회원 잔액 합계 20,000. 좋아요 카운터·잔액 불일치 각각 0.
- D01~D10 SQL 예시 23문항 실행. D02·D03 중복 삽입 문항의 의도된 1062 오류 각 2건 외 오류 0. 일자별 기본 seed와 별도 bulk 실험 DB를 구분했다.
- D06 EXISTS·JOIN 결과 각 16,080행이 일치했다. SQL 결과 행 수·집계·불변식도 비교했으며 단순 구문 성공만으로 판정하지 않았다.
- 메인이 현재 schema/seed/bulk의 SHA-256과 실행 당시 원본을 대조했다. hints.json에는 이후 진단 안내·채점 문구가 추가됐으나 실행한 SQL 23개는 현재 예시와 바이트 단위로 일치한다.
- 검증 컨테이너 `course-fix18-seed-mysql`은 삭제했고 동일 이름의 잔존 컨테이너가 없다.

원본 SQL·표준 출력·표준 오류·검증 코드: [/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/mysql](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/mysql). 집계는 `result.json`, 메인 현재 원문 대조는 `main-current-verification.json`에 있다.

## 최종 검사

최초 빌드는 x64 Node와 arm64 esbuild 불일치로 실패했다. 설치된 arm64 Node를 사용하도록 `PATH=/opt/homebrew/bin:$PATH`를 지정해 재실행했으며 의존성·lock 파일은 바꾸지 않았다.

| 검사 | 결과 |
|---|---|
| `npm run build` | 통과 · HTML 396개 · 링크 오류 0 |
| `npm run test:course` | 통과 · 38/38 |
| `npm run validate:course` | 통과 · 엔드포인트 30 · 일자 15 · 카드 68 · 일자 페이지 17 |
| `npm run test:course-pages` | 통과 · 기존 12/12 + 신규 10/10 · 흐름·조작·누출 검사 통과 |
| `npm run audit:visual` | 통과 · failures 0 |
| `npm run audit:version-cards` | 통과 |
| `npm run audit:parity` | 통과 · 기록 446개 검사 · verified 0 유지 |
| `npm run test:navigation` | 통과 · 기존 339쪽과 index, 추가 course 경로 분류 검사 |
| `npm run test:home` | 통과 |
| 루트 `node --test tools/course/*.test.mjs` | 통과 · 113/113 |
| 실제 Chromium 1440·390 | 통과 · 화면 54 · 조작 14 · 오류 0 |
| 실제 MySQL | 통과 · D03 최소 스키마·전체 seed/bulk·SQL 23문항 |

최종 명령 로그: [/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/logs](/private/tmp/claude-501/-Users-ds-orca-workspaces-javaExperience-pleco/272c0b18-3a88-4698-8151-fd238e411541/scratchpad/eval/shots-fix18/logs).

## 검증 범위와 남긴 사항

- 실행안 1~8에서 미구현·미실행으로 남긴 필수 항목은 없다. 원 보고서 5절의 라 전체 재디자인과 6절 D16~D30 설계는 이번 요청 범위가 아니다.
- D10 진단 관찰은 학습자의 자기 서버에서 수행할 안내·완료 조건·채점 요구를 구현한 것이다. 이번 구현 검증에서 학습자 애플리케이션을 새로 작성하거나 그 서버의 실제 덤프·메트릭을 대신 측정하지 않았다. 백엔드 Gradle 전체 테스트도 요청된 문서·사이트 검사와 구분하며 실행하지 않았다.
- imagegen 시안을 새로 만들지 않았으므로 신규 시안 대조 항목을 verified로 올리지 않았다. 실제 브라우저 동작 검증과 기존 parity 장부의 통과는 별도다.
- 추가 점검한 `git diff --check`는 생성 문서의 trailing whitespace 때문에 실패한다. 구현 예시에 보존된 원본 diff의 공백 문맥 줄과 HTML 템플릿 빈 줄이다. 요청된 검사에는 포함되지 않으며 원문 diff 보존을 위해 생성물을 직접 정리하지 않았다. 로그는 `fix18-whitespace.log`다.
- board-server·messy-server의 추적 파일 변경은 0이다. 커밋·stage·stash·reset·checkout·push는 실행하지 않았다. 변경은 컨트롤러가 검토·커밋할 상태로 남겼다.
