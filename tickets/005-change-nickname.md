# T-005. 닉네임 변경 API

> 난이도 쉬움 · 유형 새 API · DB community · 예상 40분

## 티켓

> **요청자** 기획 · **배경** 가입 때 정한 닉네임을 못 바꾼다는 문의가 계속 온다. 마이페이지에 "닉네임 변경"을 넣는다.

- 로그인한 회원이 자기 닉네임을 바꾸는 API를 만들어 주세요. 앞뒤 공백은 잘라서 저장하고, 자른 뒤 2~20자여야 합니다.
- 다른 회원이 쓰고 있는 닉네임이면 거절(409)합니다. 지금 내 닉네임을 그대로 다시 저장하는 건 성공이어야 합니다(프론트가 다른 항목과 같이 저장 버튼을 누르는 경우).
- **완료 조건**: 바꾼 뒤 내가 쓰는 글·댓글의 작성자 이름이 새 닉네임으로 나온다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 회원 2(`tok-kimjava`)의 닉네임은 `김자바`, 회원 3은 `이스프링`.

## 지금 코드

- 회원 엔티티는 조회만 하고 있어 값을 바꾸는 메서드가 없다. 회원 테이블에 닉네임 UNIQUE 제약이 있는지 확인한다.
- "이름 앞뒤 공백 자르고 길이 검사 → 중복이면 409"와 거의 같은 규칙을 이미 쓰는 기능이 하나 있다(내 북마크 폴더 이름). 그 서비스를 참고한다.
- 토큰으로 로그인한 회원을 컨트롤러 매개변수로 받는 방법은 다른 "내 것" API(`/api/me/...`)를 본다.

## 화면 시나리오

```screen
{
  "title": "마이페이지 — 닉네임 변경",
  "summary": "새 닉네임을 저장하면 응답의 nickname으로 화면 상단 이름을 바로 바꾼다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "마이페이지", "right": "김자바" },
    { "type": "field", "id": "nickname", "label": "닉네임", "value": "  자바왕  " },
    {
      "type": "actions",
      "id": "buttons",
      "items": [{ "id": "save", "label": "저장", "variant": "primary" }]
    },
    { "type": "toast", "id": "toast-ok", "value": "닉네임을 바꿨어요", "tone": "success" },
    { "type": "field", "id": "nickname-error", "label": "닉네임", "value": "이스프링", "error": "이미 사용 중인 닉네임입니다." }
  ],
  "flows": [
    {
      "name": "닉네임 바꾸기",
      "steps": [
        { "kind": "user", "text": "'  자바왕  '을 입력하고 [저장]을 누른다", "focus": ["nickname", "save"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/me",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"nickname\": \"  자바왕  \"}"
        },
        { "kind": "server", "text": "공백을 자르고(자바왕) 길이를 본 뒤, 나 말고 같은 닉네임을 쓰는 회원이 있는지 확인하고 바꾼다" },
        { "kind": "db", "sql": "UPDATE member SET nickname = '자바왕', updated_at = ? WHERE id = 2" },
        { "kind": "response", "status": 200, "body": "{\"id\": 2, \"email\": \"kimjava@example.invalid\", \"nickname\": \"자바왕\"}" },
        { "kind": "screen", "text": "상단 이름이 '자바왕'으로 바뀐다", "focus": ["bar", "toast-ok"] }
      ]
    },
    {
      "name": "남이 쓰는 닉네임",
      "steps": [
        { "kind": "user", "text": "'이스프링'을 입력하고 [저장]을 누른다", "focus": ["nickname-error", "save"] },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/me",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"nickname\": \"이스프링\"}"
        },
        { "kind": "server", "text": "회원 3이 이미 쓰고 있다 → 409" },
        { "kind": "response", "status": 409, "body": "{\"status\": 409, \"detail\": \"이미 사용 중인 닉네임입니다.\"}" },
        { "kind": "screen", "text": "입력칸 아래에 오류 문구를 띄우고 닉네임은 그대로", "focus": ["nickname-error"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `PATCH /api/me` |
| 인증 | 필수(토큰 없으면 `401` — 인터셉터가 이미 막는다) |
| 요청 본문 | `{"nickname": "자바왕"}` |
| 규칙 | 앞뒤 공백을 자른 값을 저장. 자른 뒤 2~20자 아니면(없음·빈 값 포함) `400` |
| 중복 | 다른 회원이 쓰는 닉네임이면 `409`. 지금 내 닉네임과 같으면 `200`(바뀐 것 없음) |
| 응답 | `200` `{"id": 2, "email": "kimjava@example.invalid", "nickname": "자바왕"}` — 이 세 필드 |
| DB 변화 | `member.nickname`, `member.updated_at` |

- 두 요청이 동시에 같은 닉네임을 노려도 결국 하나만 성공해야 한다 — 마지막 방어선은 DB의 UNIQUE 제약이고, 그때 나는 예외도 `409`로 바꾼다.

## 직접 확인

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-kimjava'

curl -s -X PATCH "$BASE/api/me" -H "$H" -H 'Content-Type: application/json' -d '{"nickname":"  자바왕  "}'   # 요청 A
curl -i -X PATCH "$BASE/api/me" -H "$H" -H 'Content-Type: application/json' -d '{"nickname":"이스프링"}'      # 요청 B — 남의 닉네임
curl -i -X PATCH "$BASE/api/me" -H "$H" -H 'Content-Type: application/json' -d '{"nickname":" 자 "}'          # 요청 C — 1자
curl -i -X PATCH "$BASE/api/me" -H "$H" -H 'Content-Type: application/json' -d '{"nickname":"가나다라마바사아자차카타파하가나다라마바사"}'  # 요청 D — 21자
curl -s -X PATCH "$BASE/api/me" -H "$H" -H 'Content-Type: application/json' -d '{"nickname":"자바왕"}'        # 요청 E — 지금 닉네임 그대로
curl -i -X PATCH "$BASE/api/me" -H 'Content-Type: application/json' -d '{"nickname":"아무나"}'                # 요청 F — 토큰 없음
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"free","title":"[T-005] 닉네임 확인","content":"작성자 이름 확인"}'                         # 요청 G — 새 글의 작성자
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "닉네임 바꾸기(앞뒤 공백)",
      "method": "PATCH",
      "path": "/api/me",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "nickname": "  자바왕  " }
    },
    {
      "id": "B",
      "title": "남이 쓰는 닉네임",
      "method": "PATCH",
      "path": "/api/me",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "nickname": "이스프링" }
    },
    {
      "id": "C",
      "title": "1자",
      "method": "PATCH",
      "path": "/api/me",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "nickname": " 자 " }
    },
    {
      "id": "D",
      "title": "21자",
      "method": "PATCH",
      "path": "/api/me",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "nickname": "가나다라마바사아자차카타파하가나다라마바사" }
    },
    {
      "id": "E",
      "title": "지금 닉네임 그대로",
      "method": "PATCH",
      "path": "/api/me",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "nickname": "자바왕" }
    },
    { "id": "F", "title": "토큰 없음", "method": "PATCH", "path": "/api/me", "body": { "nickname": "아무나" } },
    {
      "id": "G",
      "title": "새 글의 작성자 이름",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[T-005] 닉네임 확인", "content": "작성자 이름 확인" }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [{ "path": "$", "equals": { "id": 2, "email": "kimjava@example.invalid", "nickname": "자바왕" } }]
      }
    },
    { "id": "C2", "request": "B", "expect": { "status": 409 } },
    {
      "id": "C3",
      "all": [
        { "request": "C", "expect": { "status": 400 } },
        { "request": "D", "expect": { "status": 400 } }
      ]
    },
    { "id": "C4", "request": "E", "expect": { "status": 200, "json": [{ "path": "$.nickname", "equals": "자바왕" }] } },
    { "id": "C5", "request": "F", "expect": { "status": 401 } },
    { "id": "C6", "request": "G", "expect": { "status": 201, "json": [{ "path": "$.author.nickname", "equals": "자바왕" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `200`, 본문이 정확히 `{"id": 2, "email": "kimjava@example.invalid", "nickname": "자바왕"}` — 공백이 잘렸다 |
| C2 | 요청 B | `409` |
| C3 | 요청 C·D | 둘 다 `400`(자른 뒤 1자, 21자) |
| C4 | 요청 E | 지금 닉네임 그대로 다시 저장해도 `200` — 내 닉네임을 "중복"으로 보지 않는다 |
| C5 | 요청 F | `401` |
| C6 | 요청 G | 새 글 응답의 `author.nickname`이 `자바왕` |
| D1 | `SELECT id, nickname FROM member WHERE id IN (2, 3) ORDER BY id` | `2 자바왕` · `3 이스프링` — B가 실패했으니 회원 3은 그대로 |
| D2 | `SELECT COUNT(*) FROM member WHERE nickname <> TRIM(nickname)` | `0` — 공백 붙은 닉네임이 저장되지 않았다 |
| R1 | 계층 | 컨트롤러는 로그인 회원 id와 요청만 넘기고, 길이·중복 규칙은 서비스, 값 바꾸기는 엔티티 메서드(`changeNickname` 등 — setter를 열지 않는다) |
| R2 | 중복 확인 | "나를 뺀" 중복 확인(`...AndIdNot`)이다. 그냥 `existsByNickname`이면 C4가 409가 된다 |
| R3 | 동시 요청 | 확인과 저장 사이 경쟁은 UNIQUE 제약이 막고, 그 예외(`DataIntegrityViolationException`)를 `409`로 바꾼다(`saveAndFlush`로 그 자리에서 터지게) |
| R4 | 오류 응답 | 400·409가 다른 API와 같은 Problem Details 모양이다(전역 핸들러에 추가) |

## 필요한 지식

- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 서비스 검증과 DB 제약을 둘 다 두는 이유(R3)
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 409·400을 전역 핸들러로
- [S06 REST API 설계 — 메서드와 상태 코드](../docs/knowledge/S06-rest-api-clients.md) — PATCH, 409 Conflict
- [P20 JPA 엔티티·연관관계 매핑 따라 하기](../docs/knowledge/P20-jpa-entity-mapping.md) — 변경 감지로 UPDATE하기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 모양</summary>

`record NicknameChangeRequest(String nickname)`, `record MeResponse(Long id, String email, String nickname)`. 컨트롤러 `@PatchMapping("/api/me")`에서 `@LoginMember AuthenticatedMember me`와 `@RequestBody`를 받는다.
</details>

<details>
<summary>힌트 2 — 서비스</summary>

`strip()` → 길이 검사(아니면 400 예외) → `memberRepository.existsByNicknameAndIdNot(nickname, me.id())`면 409 예외 → `member.changeNickname(nickname, now)` → `saveAndFlush`를 `try/catch (DataIntegrityViolationException)`로 감싸 409. 북마크 폴더 이름 변경 서비스가 같은 순서다.
</details>
