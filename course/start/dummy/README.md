# 내 테이블에 매핑하는 더미 CSV

이 파일들은 **1단계(D01~D10) 내 프로젝트**에서 쓰는 논리 데이터다. CSV 한 파일이 테이블 하나여야 하는 것은 아니다. 먼저 [데이터 요구사항 §6](../../spec-v2.md#6-데이터-요구사항)으로 테이블·키·제약·인덱스를 직접 설계하고, 열을 내 저장 구조에 매핑한다. `board-server`는 비교할 구현 예시다. **messy-server에는 넣지 않는다**. 2단계는 자체 스키마와 티켓 재현 스크립트를 쓴다.

실험은 내 프로젝트의 비어 있는 전용 DB에서 한다. 기존 업무·practice DB에 덮어 넣지 않는다. 파일은 SQL 초기화 디렉터리에 자동 마운트되지 않으며 자동 적재도 하지 않는다.

## 재생성·규모·기준값

저장소 루트에서 실행한다(Node.js 기본 모듈만 사용).

```bash
node tools/course/gen-dummy.mjs
node tools/course/verify-dummy.mjs
node --test tools/course/gen-dummy.test.mjs
```

시드 `20261024`, UTF-8, 쉼표 구분, 첫 행 헤더, 줄 끝 LF, 문자열 인용은 `"`이고 안쪽 `"`는 `""`로 이스케이프한다. 빈 필드는 논리적으로 값 없음이며 MySQL NULL로 옮길지는 적재 SQL에서 결정한다. 시각은 **Asia/Seoul의 벽시계 값**이며 2026년 1월부터 분포한다. 생성기는 시스템 현재 시각·지역 설정·난수를 사용하지 않는다. `manifest.json`에는 CSV별 행 수·바이트·SHA-256과 상태 집계를 기록한다.

| 파일 | 행 수 | 핵심 확인값 |
|---|---:|---|
| members.csv | 200 | ADMIN 1 · USER 199 |
| posts.csv | 20,000 | ACTIVE 16,000 · HIDDEN 2,000 · DELETED 2,000 |
| tags.csv | 40 | spring 포함 |
| post-tags.csv | 40,000 | 글마다 서로 다른 태그 2개, spring의 공개 글 500건 |
| comments.csv | 50,000 | 미삭제 45,000 · 삭제 5,000(모든 상태 글에 작성 기록 존재) |
| likes.csv | 32,000 | 회원·글 쌍 중복 없음, 인기 편향 포함 |
| coupons.csv | 10 | 각 총량 100 · 발급 20 |
| member-coupons.csv | 200 | 모두 UNUSED |
| items.csv | 20 | 재고 0 아이템 포함 |
| orders.csv | 200 | 회원마다 구매 1건 · 쿠폰 미사용 · 결제 100 |
| point-history.csv | 420 | EARN 200 · SPEND 200 · CHARGE 20 |
| payments.csv | 80 | 네 상태 각 20건, 각 상태 요청 금액 합 20,000 |
| banned-words.csv | 3 | 중복 없음 |
| common-codes.csv | 5 | 그룹 안 코드 중복 없음 |
| reports.csv | 300 | 대상 글 30개 각 10건, OPEN 200 · RESOLVED 100 |
| audit-events.csv | 30 | BULK_ISSUE_COUPON 30건 |

CSV 합계 **5,086,814바이트(10MB 미만)**다. 이 규모는 인덱스·조회 실험용 입력이며 특정 실행 계획이나 속도를 보장하지 않는다. 정렬·인덱스·데이터 분포를 실제 EXPLAIN으로 확인한다. 상태를 섞은 과거 기록이므로 비공개 글에도 댓글·좋아요가 남아 있다. 공개 조회에서 내 상태·삭제 정책으로 걸러야 한다.

## 로그인 정보

- 이메일: `learner001@example.test`~`learner200@example.test`. 첫 계정만 ADMIN이다.
- 공통 비밀번호: **`Course1234`** (로컬 학습 전용).
- `password_hash`는 이 비밀번호의 BCrypt(cost 10, `$2y$`) 해시다. 고정된 동일 해시를 그대로 재사용하므로 생성 결과가 같다. 별도 생성마다 BCrypt를 다시 계산하지 않는다.
- 내 테이블에 해시를 원문 그대로 옮긴다. 이 값을 다시 BCrypt로 해시하면 로그인할 수 없다. 내 앱의 PasswordEncoder·정규화·계정 활성 정책에 맞춰 실제 로그인도 확인한다. CSV 정합성 검사는 앱 로그인 성공을 뜻하지 않는다.

## 열 설명과 관계

`key`는 CSV 안에서 쓰는 **논리 식별자**다. 아래 열 이름은 내 테이블의 열 이름을 지시하지 않는다. 여러 CSV를 한 저장 구조로 합치거나 한 CSV를 나눠 넣어도 된다. 내 키를 새로 발급한다면 `CSV key → 내 PK` 매핑을 별도 임시 데이터에 남긴 뒤 모든 참조를 바꿔 넣는다.

| 파일 | 열과 의미 | 참조 |
|---|---|---|
| members | key: 회원 논리 식별 · email: 이메일 · password_hash: BCrypt · nickname: 정규화 닉네임 · role: 역할 · balance: 최종 잔액 · joined_at: 가입 시각 | 없음 |
| posts | key: 글 식별 · author_key: 작성자 · title: 제목 · body: 본문 · state: ACTIVE/HIDDEN/DELETED · written_at: 작성 시각 | author_key → members.key |
| tags | key: 태그 식별 · label: 이름 | 없음 |
| post-tags | post_key: 글 · tag_key: 태그 | posts.key · tags.key |
| comments | key: 댓글 식별 · post_key: 글 · author_key: 작성자 · body: 내용 · is_deleted: 0/1 · written_at: 작성 시각 | posts.key · members.key |
| likes | post_key: 글 · member_key: 누른 회원 · liked_at: 누른 시각 | posts.key · members.key |
| coupons | key: 쿠폰 식별 · label: 이름 · capacity: 총량 · issued: 누적 발급 · expires_at: 만료 시각 | 없음 |
| member-coupons | key: 보유 식별 · coupon_key: 쿠폰 · member_key: 소유자 · state: UNUSED/USED · used_at: 사용 시각(빈 값은 미사용) | coupons.key · members.key |
| items | key: 상품 식별 · label: 이름 · price: 정수 포인트 가격 · stock: 현재 재고 | 없음 |
| orders | key: 주문 식별 · member_key: 구매자 · item_key: 상품 · quantity: 수량 · paid_amount: 결제 포인트 · member_coupon_key: 사용 쿠폰(전부 빈 값) · request_key: 멱등 키 · ordered_at: 주문 시각 | members.key · items.key · 값 있는 member_coupon_key → member-coupons.key |
| point-history | key: 이력 식별 · member_key: 회원 · kind: EARN/SPEND/CHARGE · delta: 부호 있는 증감액 · balance_after: 직후 잔액 · source_kind: 사유 종류 · source_key: 사유 식별 · happened_at: 발생 시각 | member_key → members.key; POST는 posts.key의 작성 글, ORDER는 orders.key, PG_PAYMENT는 payments.key |
| payments | key: 충전 식별 · member_key: 요청자 · order_ref: 서버 주문 문자열 · amount: 요청 금액 · payment_ref: 외부 결제 식별(미확정·실패는 빈 값) · state: REQUESTED/DONE/FAILED/UNKNOWN · request_key: 충전 멱등 키 · requested_at: 요청 시각 · responded_at: 응답 시각(REQUESTED는 빈 값) | members.key |
| banned-words | key: 논리 식별 · text: 금칙어 | 없음 |
| common-codes | group: 그룹 · code: 코드 · label: 표시 이름 | 그룹과 코드로 논리 식별 |
| reports | key: 신고 식별 · post_key: 대상 · reporter_key: 신고자 · reason: SPAM · detail: 상세 · state: OPEN/RESOLVED · reported_at: 신고 시각 | posts.key · members.key |
| audit-events | key: 감사 식별 · actor_key: 관리자 · action: 동작 · target_kind: 대상 종류(COUPON) · target_key: 대상 · detail: 상세 · happened_at: 발생 시각 | actor_key → members.key; target_key → coupons.key(감사 보존 정책상 물리 FK를 강제한다는 뜻은 아님) |

샘플 활동 적립은 회원별 작성 글 1건을 사유로 1,000점을 부여한 가상의 초기 이력이다. 실제 앱이 요청마다 지급하는 포인트 값이나 생성 로그를 재현한 자료는 아니다.

원본 좋아요 수는 `likes`를 글별로 집계해 구한다. 내 설계가 집계 카운터를 저장한다면 이 값으로 맞춘다. 내 설계에 필요한 생성·수정 시각이 CSV에 하나만 있으면 같은 원본 시각을 매핑한다. 관계 CSV에 별도 식별/시각이 없으면 내 키 전략과 연관된 글 시각 등 명시한 규칙으로 생성한다. 구매·차감·쿠폰 발급은 이미 반영된 **스냅샷**이므로 적재하며 재고를 또 차감하거나 API 이벤트를 재발행하지 않는다. CSV의 금전·감사 데이터는 가상의 대사용이며 실제 거래가 아니다.

## 넣는 순서와 날별 범위

1. D01: 연결·설정·메타데이터만 확인한다. 테이블이 0개여도 정상이다.
2. D02: 금칙어 → 공통코드.
3. D03: 회원. **D07 이전에는 잔액 열이 없을 수 있으므로 balance는 임시 적재 영역에만 보관하거나 무시하고, 잔액을 만들었다면 0으로 시작한다.** 로그인·가입만 확인한다.
4. D04: 태그 → 글 → 글-태그 관계. 회원 참조를 먼저 매핑한다.
5. D05~D06: 댓글 → 좋아요. 저장 카운터가 있으면 관계 수와 대사한다.
6. D07: 아이템·쿠폰 → 회원 보유 쿠폰 → 주문 → 이력의 EARN/SPEND만. 잔액은 해당 이력 합(모든 회원 900)으로 맞춘다. PG_PAYMENT 사유의 CHARGE 데이터는 D08까지 임시 영역에 보관한다. 적재 중 서비스 요청을 멈추고 적재 완료 시점에 잔액·이력·발급량을 대사한다.
7. D08: 충전 요청 → CHARGE 이력 20건 추가 → 최종 잔액을 대사한다. 최종적으로 완료 충전 회원 20명은 1,900, 나머지 180명은 900이다. DONE 외에는 적립하지 않는다.
8. D10: 신고 → 감사 기록. 대상 참조·보존 정책을 확인한다.

이미 적재한 데이터를 재적재할 때 `IGNORE`로 조용히 넘기지 말고 매핑·중복 여부를 확인한다. 위 순서는 논리 참조 순서이며, 내 FK가 사유 참조를 강제한다면 임시 적재 영역에서 부모 데이터를 먼저 준비한다. 빈 전용 DB에서 다시 시작할지는 학습자가 결정한다. 생성기는 DB를 삭제하지 않는다.

## 내 테이블에 넣는 방법

먼저 CSV 헤더와 내 저장 구조의 매핑 메모를 쓴다. **CSV 열 순서 → 입력 변수 → 내 열·변환식**을 적고 소량을 시험한 뒤 전체를 넣는다. 빈 값은 `NULLIF(@값,'')`, 새 키가 필요하면 임시 매핑 JOIN을 사용한다. 기본값·감사 필드·상태 표현도 내 설계에 맞춘다.

### LOAD DATA LOCAL INFILE의 열 매핑

아래 `my_members`, `my_id` 등의 이름은 문법 설명용이다. 내 실제 테이블·열과 파일의 절대경로로 바꾼다. D03에는 CSV의 최종 balance를 그대로 넣지 않는다.

```sql
LOAD DATA LOCAL INFILE '/absolute/path/to/members.csv'
INTO TABLE my_members
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@key,@email,@hash,@nickname,@role,@balance,@joined)
SET my_id=CAST(@key AS UNSIGNED), my_email=@email,
    my_password_hash=@hash, my_nickname=@nickname,
    my_role=@role, my_joined_at=@joined;
SHOW WARNINGS;
```

D07에 잔액을 만들면 그날 이력 합으로 채우고 D08의 CHARGE 이후 최종 CSV balance와 비교한다. 추가 필수 열이 있으면 `SET`에 내 열·기본값을 더한다. `LOAD DATA`는 경고가 있어도 계속할 수 있으므로 `SHOW WARNINGS`, 적재 건수, 부모 없는 행, 중복, 원본 집계값을 **모두** 확인한다. 경고가 있으면 적재 성공으로 보지 않는다.

### 임시 테이블 → INSERT ... SELECT

CSV 파일을 내 최종 테이블과 분리해 읽어야 할 때 쓴다. 아래는 회원 7열의 **임시 적재 형식**이며 서비스의 테이블 설계가 아니다. 같은 SQL 연결에서 실행한다.

```sql
CREATE TEMPORARY TABLE import_members (
  source_key VARCHAR(30), email VARCHAR(200), hash_value VARCHAR(100),
  nickname VARCHAR(100), role_value VARCHAR(30),
  final_balance VARCHAR(30), joined_value VARCHAR(40)
);
LOAD DATA LOCAL INFILE '/absolute/path/to/members.csv'
INTO TABLE import_members CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '"'
LINES TERMINATED BY '\n' IGNORE 1 LINES;
SHOW WARNINGS;
SELECT COUNT(*) FROM import_members;
SELECT email,COUNT(*) FROM import_members GROUP BY email HAVING COUNT(*)>1;
```

검증한 뒤 아래처럼 내 테이블로 옮긴다. 최종 INSERT는 내 설계·현재 날짜의 적재 범위에 맞게 바꾼다.

```sql
INSERT INTO my_members(my_id,my_email,my_password_hash,my_nickname,my_role,my_joined_at)
SELECT CAST(source_key AS UNSIGNED),email,hash_value,nickname,role_value,
       CAST(joined_value AS DATETIME)
FROM import_members;
```

내 PK를 새로 발급한다면 CSV key를 그대로 PK에 넣지 않는다. 예를 들어 이메일로 `import_members`와 내 회원 테이블을 JOIN해 원본 key와 새 PK의 임시 매핑을 만들고, 글의 author_key도 그 매핑을 JOIN해 바꾼다. 임시 테이블은 연결을 닫으면 사라진다. 여러 세션에서 쓸 영속 적재 테이블이 필요하면 별도 실험 DB에서 이름·정리 시점을 직접 정한다.

## 서버·클라이언트의 LOCAL 허용

[출발 compose](../compose.yaml)의 MySQL에는 `command: ["--local-infile=1"]`을 넣었다. 기존 복사본에도 이 설정을 반영하고 서비스 설정 변경을 적용한 뒤 `SHOW GLOBAL VARIABLES LIKE 'local_infile'`이 ON인지 확인한다. 이 옵션을 `board-server`나 `messy-server` 설정에 옮길 필요는 없다.

CSV는 LOCAL을 실행하는 **클라이언트 파일시스템**에서 읽는다. 호스트 mysql CLI 예시:

```bash
mysql --local-infile=1 --default-character-set=utf8mb4 \
  -h 127.0.0.1 -P 13310 -u board -p board
```

`-p` 뒤의 `board`는 DB 이름이며 비밀번호는 프롬프트에 입력한다. 컨테이너의 mysql CLI를 쓴다면 CSV를 해당 컨테이너의 임시 경로로 복사한 뒤 그 경로를 지정해야 한다. SQL에 적은 호스트 파일 경로가 컨테이너 안에 자동으로 나타나지는 않는다.

DBeaver/CloudBeaver는 MySQL 드라이버 연결 속성에서 `allowLoadLocalInfile=true`를 확인하고 재연결한다. CloudBeaver 서버에서 실행되는 JDBC는 브라우저 사용자의 로컬 파일 경로를 읽지 못한다. 서버가 읽을 수 있는 경로를 준비하거나 UI의 CSV 가져오기(제공되는 환경)를 쓰고, 그것도 불가하면 위 호스트 CLI로 적재한다. 해당 UI·드라이버 버전의 속성 제공 여부는 실제 연결에서 확인한다. 이번 변경에서는 MySQL 적재·CloudBeaver 가져오기·앱 로그인을 실행 검증하지 않았다.
