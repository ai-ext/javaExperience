# 홈 구현과 검증 기록 · 2026-10-18

## 작업 위치·PR
- 저장소의 기존 `docs/visual-learning-next` worktree에서 홈을 수정했다.
- 확인 시 열린 PR 없음. PR #7은 이미 MERGED이며, 이번 홈 변경은 아직 로컬 미커밋 상태다.
- 기존 미추적 `work/`는 보존했다. 학습자 서버 코드·설정·DB는 변경하지 않았다.

## 구현
- 홈 전용 밝은 셸과 홈/서비스 만들기/실전 미션/개념 학습 메뉴. 다른 탭은 기존 목록 URL로 연결하며 해당 목록의 전면 개편은 이번 범위가 아니다.
- 처음/진행/직접 확인 완료에 맞춰 제목·현재 작업·주 버튼 변경.
- Java 0-1 / 게시글 1-1 / SQL DB-01 시작점 선택 모달. 취소는 변경 없음. 선택 적용은 추천만 변경하며, 시작 버튼을 눌러야 진행 과제가 바뀐다.
- 시작한 과제의 장면을 브라우저에 저장하고 홈에서 복귀. 연결 범위는 0-1, 0-2, 1-1, 1-2, DB-01, DB-02 여섯 과제다. 나머지 전 과제의 진도 저장을 완료한 것은 아니다.
- 수동 완료/취소와 다음 과제 연결. 자동 채점·HTTP·DB 검증과 구분한다.
- 입력한 이름/제목/본문으로 바뀌는 예시 화면. 실제 서버 요청이나 DB 쓰기 없음.
- `new` 설명 모달의 생성 전/객체 생성/참조 연결 세 장면. 변수·객체·DB 저장을 구분한다.
- 아래로 학습 방법, 미션/개념 학습 진입, FAQ 3개, 환경 안내, 원문 README 전체, 푸터 배치.
- 원래 README 앵커로 이동하면 접힌 원문을 열어 보존된 내용을 표시한다.

## 실행한 검사
- `npm run build`: HTML 339개, 시나리오 101단계, 링크 오류 0.
- `npm run test:home`: 상태 로직과 JSDOM 조작 검사 통과. 선택/취소, 예시 입력, 텍스트 삽입, 모달 닫기 후 focus 반환, 6개 실제 과제 script의 장면 저장/복원, 과제 둘러보기, 수동 완료, 손상·차단 저장소를 검사했다.
- `npm run audit:visual`, `npm run audit:version-cards`, `npm run audit:parity`: 통과. parity는 기록 형식·파일 존재 검사이며 실제 시각 일치의 증명이 아니다.
- 관련 회귀: `test:learning-entry`, `test:first-java`, `test:annotations`, `test:first-db`, `test:db01-focused`, `test:db02-focused`, `test:task-focus` 통과.
- CSS 파싱, 홈의 중복 ID·깨진 ARIA 참조 없음, `git diff --check` 통과.
- 시각 목록을 재생성했다. 새로 목록에 들어온 항목은 기본 미검토로 남기며, 새 참고 시안으로 확인한 홈의 첫 화면 영역만 구현 근거를 연결한다.

## 미검증 범위
- 사용자 H01–H06 이미지 원본 미확보. 새 참고 시안의 프롬프트·출처·적용 범위는 REFERENCE.md에 보관했다.
- 브라우저 도구가 `file://` 열기를 URL 보안 정책으로 거절했다. 다른 방식의 자동 브라우저 접근으로 우회하지 않았다.
- 따라서 실제 데스크톱/360px 렌더, 시안과 같은 뷰포트 캡처, native dialog의 Escape/focus trap, 실제 스크롤 복원, 모바일 터치는 미검증이다. DOM 검사가 이 검증을 대체하지 않는다.
- 전체 홈 또는 새 시안 항목을 verified로 올리지 않았다. 새 parity 항목은 implemented이며 캡처 필드는 비어 있다.

## 직접 실행
정적 문서 서버는 저장소 루트에서 실행한다. ES module을 사용하므로 파일을 직접 여는 방식보다 기존 README의 HTTP 문서 서버 방식으로 확인한다.

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

접속: `http://127.0.0.1:8765/index.html`

## 후속 개발 · 자료 정리 이후

사용자 요청으로 과거 public-scenario-catalog의 미추적 90개(109860088 bytes)를 `/Users/ds/Documents/Codex/2026-10-15/sjsms/outputs/javaExperience-worktree-archive-2026-10-18`에 상대 경로 그대로 보관했다. `archive-manifest.json`에 원래 경로·크기·SHA-256을 기록하고 90개 일치를 재확인한 뒤 해당 worktree를 제거했다. 기존 생성 원본과 로컬·원격 브랜치는 유지한다. 기본 checkout과 visual-learning-next worktree만 남았다.

홈에는 다음을 추가했다.

- 완성 화면을 먼저 보여주는 입력/결과 미리보기. 원시 요청·응답은 `응답 JSON 보기` 등 이름 있는 접기로 제공한다.
- 이름·게시글 입력의 form submit과 Enter 지원. 입력과 결과는 페이지 복귀 뒤에도 같은 값을 표시한다.
- 게시글 요청 예시의 boardSlug/title/content/tags/visibility 5필드. 게시판 dev, 빈 tags, PUBLIC은 미리보기용 기본값이며 실제 요청은 전송하지 않는다.
- DB-02는 DB-01 필드 연결과 별도 시각으로 첫 묶음 145·144, 다음 묶음 143·140 및 마지막 행의 두 커서 키를 표시한다. 기존 원문의 seed 기대값이며 실측 응답이 아니다.
- 설명·버튼의 글자 크기와 색 대비를 조정하고, 780px 이하에서 상단 메뉴와 히어로를 재배치했다.
- 다중 탭 오류 수정: 새 탭에서 1-1을 시작한 뒤 이전 0-1 탭에서 장면을 이동하면 active가 0-1로 돌아가는 실패를 재현했다. 기록 변경 전에 최신 저장소를 읽고 storage/pageshow에서 안내를 갱신하도록 수정해 재현 검사 통과.

후속 build, test:home, audit:visual, audit:version-cards, audit:parity와 7개 관련 과제 회귀 검사가 통과했다. 실제 브라우저 렌더·데스크톱/360px 캡처·native dialog 조작은 계속 미검증이며 verified 상태로 올리지 않았다. H01–H06 원본을 확보한 것으로 간주하지 않는다.

## 사용자 요청 4개 항목 반영

후속 분석에서 지적한 시각 자료·탭 이름·시작점 변경·가까운 환경 안내를 [개선 기록](refinement/VERIFICATION.md)에 따라 구현했다. 기존에 기록한 '원시 응답 먼저/작은 new 상태 상자/시작점 링크만 변경/홈에서만 다른 메뉴명/ESM 직접 로딩'은 이 후속 구현에서 대체됐다. 실제 브라우저 시각 검증이 남아 있다는 제한은 유지한다.
