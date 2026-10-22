# T-006. 태그 입력 정리(#·공백·대소문자)

> 난이도 쉬움 · 유형 기존 API 변경 · DB community · 예상 30분

## 티켓

> **요청자** 운영 · **배경** 태그 검색에서 `spring`을 누르면 `#Spring`, ` spring `으로 달린 글이 안 나온다. DB를 보니 `#Spring`·` JPA `·`#JPA` 같은 태그가 따로 생겨 있다. 프론트 태그 입력칸이 `#`을 붙여 보내기도 하고, 공백만 있는 태그(`"  "`)도 그대로 저장된다.

- 글 작성·수정 때 태그 이름을 정리해서 저장해 주세요: **앞뒤 공백 제거 → 앞에 붙은 `#` 제거 → 소문자**.
- 정리한 뒤에 같은 이름은 하나로 합칩니다(`#Spring`과 `spring`은 같은 태그).
- 정리하고 나니 빈 이름(`"  "`, `"#"`)이면 400으로 거절합니다. 이미 잘못 저장된 태그 정리(데이터 보정)는 이 티켓 범위가 아닙니다.
- **완료 조건**: 작성(POST)·수정(PATCH) 어느 쪽으로 들어와도 같은 규칙이 적용된다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 태그는 `java`·`spring`·`jpa`·`mysql`·`docker`·`테스트`·`회고`·`질문` 8개.

## 지금 코드

- 글 작성과 글 부분 수정이 태그 이름을 태그 행으로 바꾸는 과정(찾고 없으면 만들기, 중복 제거)을 같은 메서드로 처리한다. 그 메서드를 찾으면 고칠 곳은 한 군데다.
- 작성 요청은 Bean Validation이 먼저 길이(1~30자)를 본다. 공백 두 칸(`"  "`)은 길이 2라서 통과한다는 점에 주의한다.
- 400 응답에 `errors: [{field, message}]`를 담는 예외가 이미 있다(수정 API가 쓴다).

## 화면 시나리오

```screen
{
  "title": "글쓰기 — 태그 입력",
  "summary": "사용자가 #을 붙이거나 대소문자를 섞어 써도 서버가 같은 태그로 정리해 저장한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "새 글 쓰기", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "[T-006] 태그 정리" },
    { "type": "chips", "id": "tags-input", "label": "입력한 태그", "items": ["#Spring", " JPA ", "spring", "#JPA"] },
    { "type": "chips", "id": "tags-saved", "label": "저장된 태그", "items": ["spring", "jpa"] },
    {
      "type": "actions",
      "id": "buttons",
      "items": [{ "id": "save", "label": "저장", "variant": "primary" }]
    },
    { "type": "toast", "id": "toast", "value": "빈 태그는 쓸 수 없어요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "섞어 쓴 태그 저장",
      "steps": [
        { "kind": "user", "text": "태그 네 개를 입력하고 [저장]을 누른다", "focus": ["tags-input", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"dev\", \"title\": \"[T-006] 태그 정리\", \"content\": \"태그 정리 확인\", \"tags\": [\"#Spring\", \" JPA \", \"spring\", \"#JPA\"]}"
        },
        { "kind": "server", "text": "이름마다 공백 제거 → # 제거 → 소문자. spring·jpa·spring·jpa → 중복을 합쳐 spring·jpa. 이미 있는 태그 행을 찾아 연결한다" },
        { "kind": "db", "sql": "SELECT * FROM tag WHERE name = 'spring'; SELECT * FROM tag WHERE name = 'jpa'; INSERT INTO post_tag …" },
        { "kind": "response", "status": 201, "body": "{\"id\": 22, ..., \"tags\": [\"spring\", \"jpa\"], ...}" },
        { "kind": "screen", "text": "저장된 글에는 정리된 태그 두 개만 보인다", "focus": ["tags-saved"] }
      ]
    },
    {
      "name": "빈 태그",
      "steps": [
        { "kind": "user", "text": "태그 칸에 #만 넣고 저장한다", "focus": ["tags-input", "save"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"dev\", \"title\": \"[T-006] 빈 태그\", \"content\": \"빈 태그\", \"tags\": [\"#\"]}"
        },
        { "kind": "server", "text": "정리하니 빈 이름 → 저장하지 않고 400(errors의 field는 tags)" },
        { "kind": "response", "status": 400, "body": "{\"status\": 400, \"errors\": [{\"field\": \"tags\", \"message\": \"태그 이름은 1~30자여야 합니다.\"}]}" },
        { "kind": "screen", "text": "오류를 띄우고 글은 저장되지 않는다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `POST /api/posts`, `PATCH /api/posts/{id}`의 `tags` |
| 정리 순서 | ① 앞뒤 공백 제거 ② 앞에 붙은 `#` 모두 제거(`##spring`도) ③ 다시 앞뒤 공백 제거 ④ 소문자(로케일 무관) |
| 중복 | 정리한 이름 기준으로 합친다. 응답의 태그 순서는 보장하지 않는다(글의 태그는 `Set`이다) |
| 빈 이름·너무 김 | 정리한 뒤 비었거나 30자를 넘으면 `400`, `errors`의 `field`가 `tags`로 시작 |
| 응답 | 기존과 같은 모양. `tags`에는 정리된 이름 |
| DB 변화 | 정리된 이름으로만 `tag` 행이 생긴다(없을 때만). 400이면 글·태그 모두 저장되지 않는다 |

- 태그 개수 제한(5개)은 지금처럼 요청에 온 개수 기준으로 둔다. 한국어 태그(`회고`)는 소문자 변환에 영향이 없다.

## 직접 확인

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-kimjava'

# 요청 A — 섞어 쓴 태그
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[T-006] 태그 정리","content":"태그 정리 확인","tags":["#Spring"," JPA ","spring","#JPA"]}'
# 요청 B — 공백만 / 요청 C — #만
curl -i -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-006] 공백 태그","content":"x","tags":["  "]}'
curl -i -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' -d '{"boardSlug":"dev","title":"[T-006] 빈 태그","content":"x","tags":["#"]}'
# 요청 D — A에서 만든 글({id})의 태그를 수정
curl -s -X PATCH "$BASE/api/posts/{id}" -H "$H" -H 'Content-Type: application/json' -d '{"tags":["#Docker","MySQL","##docker"]}'
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "섞어 쓴 태그로 작성",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-006] 태그 정리", "content": "태그 정리 확인", "tags": ["#Spring", " JPA ", "spring", "#JPA"] }
    },
    {
      "id": "B",
      "title": "공백만 있는 태그",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-006] 공백 태그", "content": "x", "tags": ["  "] }
    },
    {
      "id": "C",
      "title": "#만 있는 태그",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "dev", "title": "[T-006] 빈 태그", "content": "x", "tags": ["#"] }
    },
    {
      "id": "D",
      "title": "수정으로 태그 바꾸기",
      "method": "PATCH",
      "path": "/api/posts/{{A.body.id}}",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "tags": ["#Docker", "MySQL", "##docker"] }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 201,
        "json": [
          { "path": "$.tags", "length": 2 },
          { "path": "$.tags", "contains": "spring" },
          { "path": "$.tags", "contains": "jpa" }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        { "request": "B", "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "matches": "^tags" }] } },
        { "request": "C", "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "matches": "^tags" }] } }
      ]
    },
    {
      "id": "C3",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.tags", "length": 2 },
          { "path": "$.tags", "contains": "docker" },
          { "path": "$.tags", "contains": "mysql" }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `201`, `tags`가 `spring`·`jpa` 두 개(순서 무관) |
| C2 | 요청 B·C | 둘 다 `400`, `errors[0].field`가 `tags`로 시작 |
| C3 | 요청 D | `200`, `tags`가 `docker`·`mysql` 두 개(순서 무관) — 수정 API에도 같은 규칙 |
| D1 | `SELECT name FROM tag WHERE name LIKE '#%' OR BINARY name <> BINARY LOWER(TRIM(name)) OR TRIM(name) = ''` | 0행 — `#`·공백·대문자가 남은 태그가 없다 |
| D2 | `SELECT COUNT(*) FROM tag` | `8` — 새 태그 행이 생기지 않았다(전부 이미 있던 태그에 연결) |
| D3 | `SELECT COUNT(*) FROM post WHERE title IN ('[T-006] 공백 태그', '[T-006] 빈 태그')` | `0` — 400이면 글도 저장되지 않는다 |
| R1 | 한 곳 | 정리 규칙이 작성·수정이 함께 지나가는 한 메서드에 있다. 컨트롤러나 요청 DTO마다 따로 쓰지 않는다 |
| R2 | 순서 | 정리한 **뒤에** 중복을 합친다(앞에서 합치면 `#Spring`과 `spring`이 둘 다 남는다) |
| R3 | 로케일 | `toLowerCase(Locale.ROOT)`처럼 서버 로케일에 영향받지 않게 한다 |
| R4 | DB 정렬 규칙 | MySQL 정렬 규칙(`utf8mb4_0900_ai_ci`)은 대소문자를 구분하지 않아 `Spring`으로 찾으면 `spring` 행이 나온다는 것, 그래도 저장 값을 정리해야 하는 이유(응답·다른 저장소·검색엔진)를 말할 수 있다 |

## 필요한 지식

- [W10 검증은 어디서 하나](../docs/knowledge/W10-where-to-validate.md) — 프론트가 정리해 보내도 서버가 다시 하는 이유
- [J01 기본 타입·참조 타입·박싱·String](../docs/knowledge/J01-types-string.md) — `strip`·`trim`·`toLowerCase`
- [R03 스키마와 테이블 설계](../docs/knowledge/R03-schema-types-constraints.md) — 문자열 정렬 규칙(collation)과 UNIQUE

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어디를 고치나</summary>

글 서비스에서 "이름으로 찾고 없으면 만든다"는 메서드와, 그 안에서 쓰는 "요청 안의 중복 제거" 메서드를 찾는다. 중복 제거 전에 이름마다 정리 함수를 거치게 바꾸면 작성·수정이 같이 바뀐다.
</details>

<details>
<summary>힌트 2 — 정리 함수</summary>

```java
String name = raw.strip();
while (name.startsWith("#")) name = name.substring(1);
name = name.strip().toLowerCase(Locale.ROOT);
if (name.isEmpty() || name.length() > 30) throw new InvalidPostFieldException("tags", "태그 이름은 1~30자여야 합니다.");
```
정리한 이름을 `LinkedHashSet`에 넣으면 순서를 지키며 중복이 빠진다.
</details>
