# 9-5. 서비스를 멈추지 않는 이름 변경 — expand와 contract

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "`bookmark.memo` 컬럼 이름을 `note`로 바꾸기로 했어요. 근데 서버를 멈출 수는 없어요."

`ALTER TABLE … RENAME COLUMN` 한 줄이면 이름은 바뀐다. 문제는 **배포하는 동안** 생긴다. 서버가 여러 대면 새 코드와 옛 코드가 잠깐 함께 돈다. 이름을 바꾸는 순간 옛 서버는 `memo`를 찾다가 전부 실패한다.

그래서 이름 변경을 **넓히기(expand) → 옮기기 → 좁히기(contract)** 로 나눠 배포한다. 그리고 바깥 계약(API JSON의 `memo` 필드)은 바뀌지 않는다는 것도 확인한다. 컬럼 이름과 API 필드 이름은 다른 것이다.

## 만들 것

| 순서 | 마이그레이션·코드 | 그 시점에 옛 서버는? |
|---|---|---|
| 1. 넓히기 | `V5__add_bookmark_note.sql` — `note VARCHAR(200) NULL` 추가 + `UPDATE bookmark SET note = memo` | `memo`만 읽고 쓴다 — 문제없음 |
| 2. 양쪽 쓰기 | 코드: 쓸 때 `memo`와 `note`에 **둘 다** 쓰고, 읽을 때는 `note`를 읽는다 | 옛 서버가 `memo`에 쓴 값도 남아 있다 |
| 3. 다시 채우기 | 2를 배포하는 동안 옛 서버가 `memo`에만 쓴 행을 맞춘다 — `V6`에 `UPDATE bookmark SET note = memo WHERE note IS NULL AND memo IS NOT NULL` | 모든 서버가 새 코드 |
| 4. 좁히기 | `V6__drop_bookmark_memo.sql` — 3의 UPDATE 다음에 `ALTER TABLE bookmark DROP COLUMN memo`. 코드에서 `memo` 매핑 제거 | 없음 |

실습에서는 서버가 한 대라 V5와 V6을 차례로 적용하면 된다. 다만 **V5와 V6은 반드시 따로**(한 파일에 합치지 않는다) 두고, 2의 코드가 V6 전에도 동작하게 만든다.

- API(6-1·6-3)의 JSON 필드 이름은 계속 `memo`다.

## 직접 확인

학습용 DB에는 메모가 있는 북마크가 51개 있다. 9번 북마크(회원 10)의 메모는 `예제 따라 해 보기`.

```bash
BASE=http://localhost:8080
T='Authorization: Bearer tok-p10'; J='Content-Type: application/json'
curl -s -H "$T" "$BASE/api/me/bookmarks?size=100" | python3 -c 'import sys,json; print([(i["bookmarkId"], i["memo"]) for i in json.load(sys.stdin)["items"] if i["bookmarkId"] == 9])'   # Q1
curl -s -X PUT "$BASE/api/posts/2/bookmark" -H "$T" -H "$J" -d '{"memo":"[채점] 이름 변경 뒤"}'; echo                                                                    # Q2
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT GROUP_CONCAT(column_name ORDER BY column_name) FROM information_schema.columns WHERE table_schema = 'practice' AND table_name = 'bookmark' AND column_name IN ('memo', 'note')` | `note` — `memo`는 없다 |
| D2 | `SELECT note FROM bookmark WHERE id = 9` | `예제 따라 해 보기` — 옛 값이 옮겨졌다 |
| D3 | `SELECT COUNT(*) FROM bookmark WHERE note IS NOT NULL` | `51` 이상 |
| D4 | `SELECT GROUP_CONCAT(version ORDER BY installed_rank) FROM flyway_schema_history WHERE success = 1` | `1,2,3,4,5,6`(앞에 `1`은 기준선) — V5·V6이 따로 있다 |
| C1 | Q1 | `[(9, '예제 따라 해 보기')]` — API 필드 이름은 여전히 `memo` |
| C2 | Q2 | `200`, `memo`=`[채점] 이름 변경 뒤` |
| D5 | Q2 뒤 `SELECT note FROM bookmark WHERE member_id = 10 AND post_id = 2` | `[채점] 이름 변경 뒤` |
| R1 | 단계 이유 | 한 번에 이름을 바꾸면 배포 중에 무엇이 깨지는지, 각 단계가 그걸 어떻게 막는지 설명할 수 있다 |
| R2 | 양쪽 쓰기 흔적 | 2단계(양쪽 쓰기) 코드를 거쳤다는 것이 커밋 기록이나 설명으로 남아 있다(바로 4단계로 건너뛰지 않았다) |
| R3 | 계약 분리 | DTO 필드(`memo`)와 엔티티 컬럼(`note`)이 분리되어 있어서 API 사용자는 아무것도 바꿀 필요가 없다 |
| R4 | 되돌리기 | 4단계(DROP) 뒤에는 데이터 없이 되돌릴 수 없다는 것과, 그 전에 백업·확인을 하는 이유를 안다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../../docs/knowledge/S11-cache-redis-migration.md)
- [D06 배포 개념](../../docs/knowledge/D06-deployment-concepts.md) — 무중단 배포(롤링)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 저장 구조와 API 계약 분리
- [R07 백업과 복원](../../docs/knowledge/R07-backup-restore.md)

## 다음 단계

끝. 9장까지 오면 API를 만들고, 쿼리를 키우고, 데이터가 이미 있는 DB의 구조를 안전하게 바꾸는 데까지 해 본 것이다.
