# P1. 명세서 v2 · D1~D15 순서표 · 말하기 카드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 개편 과정의 기준 문서 세 개를 만든다. 명세서 v2, 일자별 순서표(데이터), 말하기 카드다. 셋이 서로 어긋나지 않는지 자동으로 검사하는 검증기도 함께 만든다.

**Architecture:**
- 순서표는 사람이 읽는 문서가 아니라 `course/roadmap.json` 데이터로 둔다. P2~P5가 이 데이터에서 정답 구현 범위, Java 과제 배치, 일자 페이지를 만든다.
- 검증기 `tools/course/validate.mjs`(Node, 의존성 없음)는 세 가지를 대조한다. 명세서의 엔드포인트 표, 순서표의 참조, 말하기 카드 ID다.
- 사이트 빌드(`tools/site/build.mjs`)가 `course/`도 렌더링하고 링크를 검사하게 한다.

**Tech Stack:** Node 26(`node:test`, `node:assert`), 기존 `tools/site` 빌드(marked). Java 코드는 이 계획에 없다.

**Spec:** `~/research/java-onboarding/14-redesign-design.md` (근거 자료 05~13은 같은 폴더)

## Global Constraints

- 저장소 `~/code/javaExperience`. 작업은 worktree `.worktrees/p1-spec-roadmap`, 브랜치 `course/p1-spec-roadmap`에서 한다. main에 직접 커밋하지 않는다. push와 PR은 사용자 승인 후에만 한다.
- 문서는 한국어로 쓴다. 기술 용어·식별자는 원문 그대로 둔다. 코드 주석도 한글이다.
- 스택 표기는 정확히 다음과 같다: Java 21, Spring Boot 4.1, Spring Security, JPA(Hibernate 7), MyBatis, MySQL 8.4, Redis(Spring Data Redis·Lettuce), Testcontainers, WireMock(+Toxiproxy).
- `course/` 안에는 `studymate`, `3주 만에 3~6년차` 문구를 쓰지 않는다. 로컬 환경은 제품을 제한하지 않는 Docker 런타임으로 적는다.
- 도메인은 커뮤니티 게시판 + 관리자 + 포인트·쿠폰 상점이다. 게임 운영 용어는 쓰지 않는다.
- 일정은 D1~D15다. 1단계 D1~D10(build), 2단계 D11~D14(maintain), 마무리 D15(wrap). Java는 J0(선택)과 J1~J15이며, Jn은 Dn과 짝이다.
- 1단계 각 순서(step)에서 만드는 파일은 1~3개다. 하루 순서는 3~6개, 하루 말하기 카드는 3~5개다.
- 기존 `scenario/`, `tickets/`, `docs/` 파일은 이 계획에서 수정하지 않는다.

## Review Focus

1. 순서표가 명세서에 없는 경로를 참조하거나, 경로 변수 이름이 다르다. 예: `{id}`와 `{postId}`. 검증기는 문자열 그대로 비교해야 한다. Task 1에서 `{id}` 불일치 테스트로 고정한다.
2. 명세서에 있는데 어느 날에도 나오지 않는 엔드포인트가 있다. 그러면 정답 서버(P2)에서 빠진다. Task 1에서 커버리지 테스트로 고정한다.
3. 말하기 카드 ID가 중복되거나 형식이 깨졌다(`TC-D3-1`처럼 두 자리가 아님). Task 1에서 중복·형식 테스트로 고정한다.
4. 한글 제목 앵커 때문에 `course/` 링크가 사이트 빌드에서 깨진다. Task 5에서 실제 빌드로 확인한다.
5. 금지 문구가 들어간다(Global Constraints). Task 1에서 금지어 검사 테스트로 고정한다.

---

### Task 1: 검증기와 빌드 연결

**Files:**
- Create: `tools/course/validate.mjs`
- Create: `tools/course/validate.test.mjs`
- Create: `tools/course/fixtures/` (테스트용 최소 spec·roadmap·cards)
- Modify: `tools/site/build.mjs:77` — walk 목록에 `'course'` 추가
- Modify: `tools/site/package.json` — `"validate:course": "node ../course/validate.mjs"`, `"test:course": "node --test ../course/validate.test.mjs"`

**Interfaces:**
- Produces (모두 `validate.mjs`에서 named export):
  - `parseSpecEndpoints(md: string): string[]`. 명세서의 엔드포인트 표 행 `| GET | /api/posts/{postId} | ...`에서 `"GET /api/posts/{postId}"`를 뽑는다. 표 머리는 `| 메서드 | 경로 |`로 시작한다.
  - `parseTalkCardIds(md: string): string[]`. `### TC-D03-1` 형식의 제목에서 ID를 뽑는다.
  - `validate({ spec: string, roadmap: object, cards: string, courseFiles: Record<string,string> }): string[]`. 오류 메시지 배열을 돌려주고, 빈 배열이면 통과다.
  - CLI: `node tools/course/validate.mjs`는 실제 `course/` 파일을 읽는다. 오류가 있으면 한 줄씩 출력하고 exit 1, 없으면 `course OK: N endpoints, 15 days, M cards`를 출력한다.
- roadmap.json 스키마(이후 Task 3·4가 채운다):

```json
{
  "version": 1,
  "days": [{
    "id": "D01", "phase": "build", "title": "프로젝트 뼈대", "java": "J01",
    "steps": [{ "no": 1, "title": "...", "files": ["..."], "done": ["..."], "trap": "..." , "specRefs": ["GET /actuator/health"], "tickets": [] }],
    "talkCards": ["TC-D01-1"], "tomorrow": "..."
  }],
  "java": [{ "id": "J00", "day": null, "optional": true, "topic": "...", "basics": "...", "typeCut": null, "habit": null }]
}
```

- [ ] **Step 1: worktree 생성**

```bash
cd ~/code/javaExperience && git fetch origin main
git rev-list --left-right --count main...origin/main   # 0 0이어야 한다. 아니면 git merge --ff-only origin/main
git worktree add .worktrees/p1-spec-roadmap -b course/p1-spec-roadmap main
```

- [ ] **Step 2: 실패하는 테스트 작성** (`validate.test.mjs`, `node:test`)

테스트 이름과 단언은 다음과 같다.
- `parseSpecEndpoints는 엔드포인트 표만 읽는다`: 표 2행 + 다른 표 1행이 들어 있는 md를 넣으면 `['POST /api/posts', 'GET /api/posts/{postId}']`가 나온다.
- `parseTalkCardIds는 TC-Dnn-n 제목만 읽는다`: `### TC-D01-1`, `### TC-D01-2`, `### 기타`를 넣으면 길이가 2다.
- `정상 픽스처는 오류가 없다`: fixtures의 유효한 조합을 넣으면 `[]`가 나온다.
- `일자 수가 15가 아니면 오류`: days가 14개면 오류 메시지에 `15`가 들어간다.
- `build 단계 순서의 파일이 4개면 오류`: 메시지에 `D01` 과 `step 1` 이 들어간다.
- `명세에 없는 specRef는 오류`: `GET /api/posts/{id}`(명세는 `{postId}`)를 넣으면 메시지에 그 문자열이 들어간다.
- `어느 날에도 쓰이지 않은 엔드포인트는 오류`: 메시지에 `미사용`과 해당 엔드포인트가 들어간다.
- `talkCards가 카드 문서에 없으면 오류`, `카드 ID 중복이면 오류`, `카드 ID 형식(TC-D\d{2}-\d)이 아니면 오류`.
- `하루 카드가 3개 미만이면 오류`.
- `Jn이 Dn과 짝이 아니면 오류`: D05의 java가 `J04`인 경우.
- `maintain 단계에서 B01~B16 중 빠진 티켓이 있으면 오류`.
- `금지어가 course 파일에 있으면 오류`: courseFiles에 `Docker Desktop`이 들어간 문자열을 넣으면 파일 이름이 메시지에 들어간다. `studymate`(대소문자 무시), `3주 만에 3~6년차`도 각각 검사한다.

- [ ] **Step 3: 실패 확인**

Run: `cd tools/site && node --test ../course/validate.test.mjs`
Expected: FAIL (`validate.mjs`가 아직 없음)

- [ ] **Step 4: `validate.mjs` 구현**

규칙 목록은 테스트와 일대일로 대응한다. 단계별 규칙은 아래와 같다.
- `build` 단계: steps 3~6개, step마다 files 1~3개, specRefs 1개 이상.
- `maintain` 단계: files 0~3개, tickets 1개 이상.
- `wrap` 단계: steps 1개 이상.

경로 비교는 문자열 완전 일치로 한다.

- [ ] **Step 5: 통과 확인**

Run: `cd tools/site && node --test ../course/validate.test.mjs`
Expected: 모든 테스트 PASS

- [ ] **Step 6: 빌드 연결**

`build.mjs:77`에 `'course'`를 추가하고, `package.json`에 스크립트 두 개를 추가한다. `course/`는 아직 없으니 `fs.existsSync`로 감싼다. 디렉터리가 없으면 건너뛴다.

Run: `cd tools/site && npm install && npm run build`
Expected: 기존과 같이 성공. 깨진 링크 0개.

- [ ] **Step 7: Commit**

```bash
git add tools/course tools/site/build.mjs tools/site/package.json
git commit -m "chore: course 검증기와 사이트 빌드 연결"
```

---

### Task 2: 명세서 v2

**Files:**
- Create: `course/spec-v2.md`
- Modify: `tools/course/validate.test.mjs`. 실제 파일을 읽는 테스트 1개를 추가한다.

**Interfaces:**
- Consumes: `parseSpecEndpoints` (Task 1)
- Produces: 엔드포인트 30개. P2·P4·P5는 이 문자열을 그대로 쓴다.

명세서 절 구성(순서 고정):
1. 개요(도메인 3영역, 스택)
2. 공통 규칙: 응답은 JSON, 에러는 ProblemDetail(`type`, `title`, `status`, `detail`, `instance`, `errors[]{field, reason}`), 시간은 ISO-8601 KST 오프셋, 목록은 커서(`cursor`, `size` 기본 20 최대 50, 응답 `items`, `nextCursor`)
3. 인증·권한: JWT `Authorization: Bearer`, 역할 USER/ADMIN, **경로별 공개 범위 표**(공개: 가입·로그인·헬스·공개 GET·Swagger·PG 콜백(서명 검증) / USER / ADMIN), CORS 허용 출처 `http://localhost:3000`, `http://127.0.0.1:8765`
4. 엔드포인트 표(아래)
5. 필드 규칙(엔드포인트별 요청 필드, 길이·필수·형식)
6. 데이터 모델(테이블 목록과 핵심 제약: `post_like` UNIQUE(post_id, member_id), `member_coupon` UNIQUE(coupon_id, member_id), `point_ledger` 적립·차감 이력, `pg_payment` UNIQUE(idempotency_key), `audit_log`)
7. 외부 PG 계약(WireMock): 승인 `POST /pg/v1/payments`, 조회 `GET /pg/v1/payments/{paymentKey}`, 콜백 서명 헤더 `X-PG-Signature`(HMAC-SHA256, 본문 기준)
8. 운영 값: 타임아웃(연결 1s, 응답 3s, 풀 대기 2s — HTTP), Hikari(`maximum-pool-size` 10, `connection-timeout` 2000ms), Redis 명령 타임아웃 500ms, 인기글 캐시 TTL 60s, 로그인 시도 5회/10분

엔드포인트 표 (정확히 이 30행, 표 머리 `| 메서드 | 경로 | 권한 | 설명 | 도입일 |`):

| 메서드 | 경로 | 권한 | 도입일 |
|---|---|---|---|
| GET | /actuator/health | 공개 | D01 |
| POST | /api/auth/signup | 공개 | D03 |
| POST | /api/auth/login | 공개 | D03 |
| GET | /api/members/me | USER | D03 |
| POST | /api/posts | USER | D04 |
| GET | /api/posts/{postId} | 공개 | D05 |
| PUT | /api/posts/{postId} | USER(작성자) | D05 |
| PATCH | /api/posts/{postId} | USER(작성자) | D05 |
| DELETE | /api/posts/{postId} | USER(작성자) | D05 |
| POST | /api/posts/{postId}/comments | USER | D05 |
| GET | /api/posts/{postId}/comments | 공개 | D05 |
| DELETE | /api/comments/{commentId} | USER(작성자)·ADMIN | D05 |
| PUT | /api/posts/{postId}/like | USER | D05 |
| DELETE | /api/posts/{postId}/like | USER | D05 |
| GET | /api/posts | 공개 | D06 |
| GET | /api/me/points | USER | D07 |
| GET | /api/me/points/history | USER | D07 |
| POST | /api/coupons/{couponId}/issue | USER | D07 |
| GET | /api/me/coupons | USER | D07 |
| GET | /api/shop/items | 공개 | D07 |
| POST | /api/shop/orders | USER | D07 |
| POST | /api/me/points/charges | USER | D08 |
| POST | /api/pg/callbacks | 공개(서명) | D08 |
| GET | /api/posts/popular | 공개 | D09 |
| GET | /api/rankings/activity | 공개 | D09 |
| POST | /api/posts/{postId}/reports | USER | D10 |
| GET | /api/admin/reports | ADMIN | D10 |
| POST | /api/admin/posts/{postId}/hide | ADMIN | D10 |
| POST | /api/admin/coupons/{couponId}/bulk-issue | ADMIN | D10 |
| GET | /api/admin/audit-logs | ADMIN | D10 |

(`설명` 열은 작성자가 채운다. `POST /api/shop/orders`와 `POST /api/me/points/charges`는 `Idempotency-Key` 헤더를 필수로 받는다.)

- [ ] **Step 1: 실패하는 테스트 추가** — `실제 spec-v2는 엔드포인트 30개`: `parseSpecEndpoints(read('course/spec-v2.md'))`의 길이가 30이다. `'POST /api/pg/callbacks'`와 `'GET /api/posts/{postId}'`가 들어 있다. 중복이 없다.
- [ ] **Step 2: 실패 확인** — Run: `cd tools/site && npm run test:course` → FAIL(파일 없음)
- [ ] **Step 3: `course/spec-v2.md` 작성** — 위 8절 구성과 표를 따른다. 설계 문서 4절(도메인)과 5-2절(일자별 만들 것)을 근거로 쓴다. 상단에 "기존 10장 명세와 응답 형식이 다르다(ApiResponse 래퍼 → ProblemDetail, 인터셉터 → Security)"는 안내를 둔다.
- [ ] **Step 4: 통과 확인** — Run: `cd tools/site && npm run test:course` → PASS
- [ ] **Step 5: Commit** — `git add course/spec-v2.md tools/course/validate.test.mjs && git commit -m "docs: 명세서 v2"`

---

### Task 3: 말하기 카드

**Files:**
- Create: `course/talk-cards.md`

**Interfaces:**
- Consumes: `parseTalkCardIds` (Task 1)
- Produces: 카드 ID `TC-D01-1` ~ `TC-D15-n`. Task 4의 `talkCards`가 이 ID를 참조한다.

카드 한 장의 형식(고정):

```markdown
### TC-D03-1
**질문** permitAll 규칙을 관리자 규칙보다 앞에 두면 어떤 일이 생기나요?
**답에 들어가야 할 것**
- 인가 규칙은 위에서부터 첫 번째로 매치된 것만 적용된다
- 넓은 패턴이 앞에 있으면 뒤의 관리자 규칙은 평가되지 않는다
- 테스트로 관리자 경로에 USER 토큰을 보내 403을 확인한다
**근거** 06 §6
```

- 하루 3~5장, 총 45~75장이다. 질문은 "문제 상황 → 원인 → 선택 → 결과"로 답하게 만든다. 정의를 묻는 질문("X란?")은 하루 1장 이하로 둔다.
- 출처: 05 역량 표의 "말할 수 있어야 하는 것", 06·07·08·10의 해당 절, 설계 5-2·5-3의 "겪을 것" 열.
- D11~D14 카드는 그날 다루는 티켓(B01~B16)의 원인을 설명하게 한다. D15 카드는 회고 질문이다.

- [ ] **Step 1: 실패하는 테스트 추가** — `실제 카드 문서는 일자마다 3~5장`: `parseTalkCardIds`로 뽑은 ID를 일자별로 묶는다. D01~D15 모두 3~5장이어야 하고, 중복이 없어야 한다.
- [ ] **Step 2: 실패 확인** — `npm run test:course` → FAIL
- [ ] **Step 3: `course/talk-cards.md` 작성** — 위 형식으로 쓴다. 일자별 `## D01 프로젝트 뼈대` 절 아래에 둔다.
- [ ] **Step 4: 통과 확인** — `npm run test:course` → PASS
- [ ] **Step 5: Commit** — `git commit -m "docs: 말하기 카드 D01~D15"`

---

### Task 4: 순서표 `roadmap.json`

**Files:**
- Create: `course/roadmap.json`

**Interfaces:**
- Consumes: 엔드포인트 문자열(Task 2), 카드 ID(Task 3), `validate()`(Task 1)
- Produces: P2(정답 서버의 일자별 범위), P3(J 과제 배치), P4(티켓 배정), P5(일자 페이지)가 읽는 단일 원천.

내용 기준:
- **D01~D10**: 설계 5-2절의 표를 순서(step)로 쪼갠다. 각 step에는 다음을 둔다.
  - `files`: 실제 경로. 예: `src/main/java/com/example/board/post/Post.java`. 패키지 루트는 `com.example.board`로 고정하고 도메인형(`member`, `post`, `comment`, `shop`, `point`, `coupon`, `payment`, `admin`, `common`, `config`)으로 나눈다.
  - `done`: 확인 요청이나 테스트 이름.
  - `trap`: 그날 "겪을 것" 가운데 하나.
  - `specRefs`: Task 2 표의 "도입일"과 같은 날에 나오게 한다.
- **D11~D14**: 설계 5-3절. D11은 인수인계 순서(코드 읽기 → 특성화 테스트 → 리뷰 메모 → ArchUnit 규칙)로 둔다. D12~D13은 티켓 처리, D14는 고도화 1건과 모의 장애 훈련이다. `tickets`에는 B01~B16을 모두 한 번 이상 배치한다. 학습자는 필수 B01~B04와 선택 1건을 고르지만, 순서표에는 후보로 다 올린다.
- **D15**: 설명 세션과 회고.
- **`java`**: J00(optional)과 J01~J15. 필드는 다음과 같다.
  - `topic`: 설계 5-5 주제 과제
  - `basics`: 기본기 반복
  - `typeCut`: 타입 한 컷 표
  - `habit`: 실무 습관 칸. J1·J2·J3·J5·J7·J8에만 둔다.
- 각 날의 `tomorrow`: 다음 날이 오늘의 어떤 결과를 쓰는지 한 줄.

- [ ] **Step 1: 실패하는 테스트 추가** — `실제 course 파일 전체가 검증을 통과한다`: `validate({ spec, roadmap, cards, courseFiles })`가 `[]`이어야 한다.
- [ ] **Step 2: 실패 확인** — `npm run test:course` → FAIL (`roadmap.json` 없음)
- [ ] **Step 3: `course/roadmap.json` 작성** — 위 기준을 따른다.
- [ ] **Step 4: 통과 확인** — Run: `npm run test:course && npm run validate:course` → PASS, `course OK: 30 endpoints, 15 days, N cards`
- [ ] **Step 5: Commit** — `git commit -m "docs: D1~D15 순서표와 J0~J15 배치"`

---

### Task 5: 과정 안내 문서와 빌드 확인

**Files:**
- Create: `course/README.md`

**Interfaces:**
- Consumes: Task 2~4의 파일

`course/README.md` 구성:
1. 이 과정이 약속하는 것. 설계 2절의 표현 "3~6년차가 쓰는 말과 판단을 직접 겪어 본 상태"를 그대로 쓴다.
2. 일정표: D0(J0 선택) → D1~D15 표. 열은 일, 마일스톤, 오늘의 Java, 말하기 카드 수. `roadmap.json`과 값이 같아야 한다.
3. 하루 진행 방법: 오늘 순서 → 확인 → 말하기 카드 → 채점 프롬프트.
4. 준비물: JDK 21, Docker 런타임, IntelliJ.
5. 링크: `spec-v2.md`, `talk-cards.md`, 기존 `scenario/`(참고 도감).

- [ ] **Step 1: 실패하는 테스트 추가** — `README 일정표가 roadmap과 일치`: README의 일정표 행에서 `D\d{2}`와 마일스톤 제목을 뽑는다. 이것이 `roadmap.days[].title`과 같은지 확인한다.
- [ ] **Step 2: 실패 확인** — `npm run test:course` → FAIL
- [ ] **Step 3: `course/README.md` 작성**
- [ ] **Step 4: 전체 확인**
  - Run: `cd tools/site && npm run test:course && npm run validate:course && npm run build`
  - Expected: 테스트 PASS, `course OK`, 빌드 성공(깨진 링크 0). `course/*.html` 3개 생성(README, spec-v2, talk-cards. `roadmap.json`은 렌더링 대상이 아니다).
- [ ] **Step 5: 생성 HTML 확인** — `python3 -m http.server 8765 --bind 127.0.0.1`로 띄운다. `course/README.html`을 gstack browse로 열어 콘솔 오류가 0인지, 표가 렌더링되는지 본다.
- [ ] **Step 6: Commit** — `git add course && git commit -m "docs: course 안내 문서"`

---

## 실행 후

- 사용자에게 보고할 것: 브랜치 이름, 커밋 목록, `validate:course` 출력, 빌드 결과.
- push와 PR은 사용자 승인을 받은 뒤에 한다(저장소는 public, 소유자 ai-ext).
- P2 계획은 이 결과(엔드포인트 30개, `roadmap.json`의 D01~D10 files)를 입력으로 작성한다.
