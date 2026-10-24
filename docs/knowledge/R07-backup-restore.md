# R07. 백업과 복원 — DB와 서버에서 각각 무엇을, 어떻게 지키나

> - 백업은 파일을 만드는 일이 아니라 정해진 RPO·RTO 안에 검증된 상태로 돌아오는 절차다.
> - DB 백업, 서버/디스크 스냅샷, 애플리케이션 파일·설정 백업은 서로 다른 장애를 복구한다.
> - 운영 기본은 전체 백업에 binlog/WAL을 이어 붙이는 시점 복구와 정기적인 복원 훈련이다.

## 1. 한 줄로 말하면

백업은 장애·삭제·훼손 뒤 필요한 데이터와 실행 환경을 복구할 수 있도록 복사본과 변경 로그를 보관하고, 복원 절차를 검증하는 일이다. 복구 목표는 RPO(허용할 데이터 손실 구간)와 RTO(서비스 중단 허용 시간)로 정한다. DB 파일을 복사해 둔 것만으로는 애플리케이션 파일이나 설정, 또는 원하는 시점의 데이터까지 돌아온다고 보장할 수 없다.

## 2. 당장 알아야 할 것

> **이 저장소에 없는 실습 환경** — 이 문서의 예제는 원래 공부자료가 전제한 쇼핑몰 연습 DB `ds_practice`(`practice/schema/schema.sql`·`seed.sql`로 만드는 `member`·`product`·`orders` 등)를 쓴다. 그 파일과 DB는 이 저장소에 없다. 그대로 따라 하려면 그런 MySQL을 직접 준비해야 하고, 명령에 적힌 포트(`3306` 등)·계정도 그때 정한 값으로 바꾼다. 이 저장소에서 바로 쓸 수 있는 DB는 루트 `compose.yaml`의 MySQL(`docker compose up -d` — 호스트 `localhost:13308`, 계정 `community`/`community`, DB `community`·`practice`·`project`)이고, 테이블은 게시판용(`member`·`post`·`comment`·`tag` 등)이라 이름과 열이 다르다. 이 저장소의 compose DB를 SQL 파일로 떠 두는 스크립트는 `docker/mysql/dump.sh`다.

1. **RPO와 RTO를 먼저 정한다.** RPO는 허용하는 데이터 손실 구간, RTO는 장애부터 서비스 복구까지 허용하는 최대 시간이다. RPO가 15분이면 일일 덤프만으로 부족하다. 두 목표는 조직이 정한다.

   ```text
   예: RPO 15분 / RTO 2시간
   ```

   위 값은 설계 연습 예시다. 실제 목표는 데이터 손실의 비용, 업무 시간, 복구 인력과 비용을 제품 담당자와 정한다.

2. **백업 계층을 구분한다.** 세 종류를 한 복사본으로 대신할 수 없다.

   | 계층 | 복구되는 것 | 그것만으로 복구되지 않는 것 | 예 |
   |---|---|---|---|
   | DB 백업 | 선택한 데이터베이스의 테이블 정의와 데이터, 도구가 포함한 뷰·루틴 등 | VM 운영체제, 애플리케이션 배포물, 별도 업로드 파일, DB 밖의 비밀 설정 | `mysqldump`, `pg_dump`, 물리 백업, RDS 백업 |
   | 서버·VM·디스크 스냅샷 | 해당 시점의 VM 디스크와 운영체제·설치 파일 등 로컬 상태 | 다른 디스크·외부 DB·오브젝트 스토리지, 항상 트랜잭션 일관된 DB 상태 | VM 이미지, 블록 볼륨 스냅샷 |
   | 애플리케이션 파일·설정 | JAR/컨테이너 이미지, 배포 설정, 업로드 파일 등 선택한 앱 자산 | DB 레코드와 DB 로그 | 아티팩트 저장소, 오브젝트 스토리지, 설정 백업 |

   Spring Boot 앱의 `application.yml`에는 접속 설정이 있지만 DB 레코드는 없다. `mysqldump`에는 JAR와 `uploads/` 파일이 없다. 비밀 값은 별도 비밀 관리 저장소에서 복구한다. 실행 중 DB의 스냅샷 일관성을 확인하고 DB 전용 백업·로그를 기본 복구 경로로 둔다.

   ```mermaid
   flowchart LR
     A["DB 백업: 스키마·행·로그"] --> A2["DB 복원: 검증 후 연결 전환"]
     B["VM·디스크 스냅샷: OS·로컬 상태"] --> B2["머신 복구"]
     C["앱 아티팩트·설정·업로드"] --> C2["애플리케이션 재배포"]
     A2 --> D["전체 서비스 복구"]
     B2 --> D
     C2 --> D
   ```

3. **논리·물리 백업은 목적이 다르다.** 논리 백업은 SQL 문과 행을 저장해 다른 인스턴스나 환경에 옮기기 쉽다. `mysqldump`·`pg_dump`가 대표적이며 복구는 SQL을 다시 실행하므로 큰 DB에서 느릴 수 있다. 물리 백업은 DB 파일을 엔진 형식 그대로 복사해 보통 빠르게 복원하지만 엔진·버전·파일 배치에 맞춰야 한다. MySQL 계열은 Percona XtraBackup, PostgreSQL은 `pg_basebackup`을 예로 들 수 있다.

   논리 백업은 작은 DB·이동·개발용, 물리 백업은 빠른 대용량 복원에 적합하다. 전체 백업은 단독 기준점이다. 증분은 변경분만 저장하지만 복구 시 기준 백업과 의존 증분을 조합해야 한다.

4. **온라인 덤프의 일관성 조건을 지킨다.** InnoDB만 사용하는 MySQL DB는 `--single-transaction`으로 덤프 시작 시점의 일관된 읽기를 할 수 있다. 이 옵션은 MyISAM 같은 비트랜잭션 테이블에는 같은 보장을 주지 않으며, 덤프 중 `ALTER TABLE`, `DROP TABLE`, `RENAME TABLE`, `TRUNCATE TABLE` 등이 겹치면 실패하거나 일관성이 깨질 수 있다. 큰 테이블에는 `--quick`을 함께 써 행을 메모리에 전부 쌓지 않는다.

   ```bash
   mysqldump --single-transaction --quick ds_practice > ds_practice.sql
   ```

5. **PITR은 전체 백업 하나로 되지 않는다.** MySQL은 백업 뒤의 binary log(binlog), PostgreSQL은 물리 base backup 뒤의 WAL을 이어서 재생해 원하는 시점으로 이동한다. 따라서 기준 백업, 로그 보관, 로그가 빠짐없이 전달되는지 확인하는 감시가 모두 있어야 한다. MySQL 8.4는 binlog가 기본 활성화지만, 실제 운영에서는 설정과 보관 위치를 직접 확인한다.

   ```bash
   # 백업 이후 로그를 사고 시각 직전까지 재생하는 형태의 예
   mysqlbinlog --stop-datetime="2026-10-04 10:14:59" binlog.000123 binlog.000124 | mysql -u restore_user -p
   ```

   이 명령은 복구용 별도 서버에서 검토한 로그만 적용하는 예다. `--stop-datetime`은 사고 이후의 이벤트를 잘라내는 기준이지 백업 파일을 대신하지 않는다. 운영 binlog 보관·암호화·권한 설정도 필요하다.

6. **관리형 DB도 복원 작업은 사용자 책임이다.** RDS 자동 백업은 인스턴스 전체를 대상으로 보관 기간 중 시점 복구를 제공하며, 수동 스냅샷은 별도로 보관·복사할 수 있다. RDS PITR은 원본 인스턴스를 덮어쓰지 않고 새 DB 인스턴스를 만든다. AWS 문서상 트랜잭션 로그를 S3에 5분마다 업로드하지만, 복구 가능한 최신 시점은 `LatestRestorableTime`으로 확인해야 한다. 업로드 주기를 보장 RPO로 오해하지 않는다.

   ```text
   aws rds describe-db-instances --db-instance-identifier <이름>
   # LatestRestorableTime을 확인하고 목표 시각으로 새 인스턴스 복구
   ```

7. **복사본을 분리한다.** 3-2-1은 사본 3개, 저장 매체 2종, 외부 위치 1곳을 뜻한다. 같은 계정·디스크에만 보관하면 고장이나 랜섬웨어로 함께 잃는다. 암호화하고 다른 계정/리전에 복사하며 삭제 권한을 제한한다. CISA도 오프라인·암호화 백업과 복구 검증을 권고한다.

8. **복구 결과를 확인한다.** 파일 크기와 SHA-256은 변조·잘림을 찾지만 업무 데이터의 정확성은 증명하지 않는다. 복구 뒤 테이블·행 수, 관계, 대표 쿼리와 헬스체크를 본다. 복원 훈련으로 권한·누락 객체·비밀 설정 오류를 미리 찾는다.

## 3. 따라 하기

다음 예는 로컬 MySQL 8.4 컨테이너 `ds-mysql`과 `ds_practice`를 쓴다. 원래 공부자료 저장소의 `practice/schema/schema.sql`과 README에 맞췄다(이 저장소에는 없다). 안내용 명령만 작성했고 Docker·MySQL은 실행하지 않았다. `local`은 로컬 연습 전용 비밀번호다.

### 1단계: 연습 DB 준비

컨테이너가 아직 없다면 시작하고, `practice/schema/`가 있는 그 저장소 루트에서 스키마와 시드를 넣는다. `schema.sql`은 `DROP DATABASE IF EXISTS ds_practice`를 포함하므로 이미 데이터가 든 DB에서 다시 실행하지 않는다.

```bash
docker run --name ds-mysql -e MYSQL_ROOT_PASSWORD=local -p 3306:3306 -d mysql:8.4
until docker exec ds-mysql mysqladmin ping -uroot -plocal --silent; do sleep 2; done
docker exec -i ds-mysql mysql -uroot -plocal < practice/schema/schema.sql
docker exec -i ds-mysql mysql -uroot -plocal ds_practice < practice/schema/seed.sql
```

> 로컬에 다른 MySQL이 이미 3306을 쓰고 있으면 `Bind for 0.0.0.0:3306 failed: port is already allocated`로 실패한다(포트 충돌). `-p 13306:3306`처럼 호스트 쪽 포트를 바꾸고, 접속할 때도 그 포트를 쓴다. (2026-10-04 이 절차를 MySQL 8.4에서 처음부터 끝까지 실행해 행 수·CHECKSUM 일치를 확인함)


**확인 방법:** `docker logs ds-mysql`에서 준비 로그를 확인하고 아래 질의로 16개 테이블을 본다. README의 시드 예상은 `member` 200행, `orders` 1,000행, `review` 400행이다.

```bash
docker exec ds-mysql mysql -uroot -plocal -e "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema='ds_practice' ORDER BY table_name;"
```

InnoDB의 `table_rows`는 추정치라 정확한 비교에는 쓰지 않는다.

### 2단계: 논리 백업 파일 만들기

컨테이너의 `mysqldump` 출력을 호스트 파일로 보낸다. 단일 DB 덤프이므로 복원 전에 대상 DB를 만든다. 루틴·이벤트도 명시적으로 포함한다.

```bash
mkdir -p /tmp/r07-backup
docker exec ds-mysql mysqldump -uroot -plocal \
  --single-transaction --quick --routines --events --triggers \
  ds_practice > /tmp/r07-backup/ds_practice.sql
test -s /tmp/r07-backup/ds_practice.sql
shasum -a 256 /tmp/r07-backup/ds_practice.sql
```

**확인 방법:** 종료 코드가 0이고 `test -s`가 성공해야 한다. 크기·해시·stderr를 기록하고, 자동화는 실패 덤프가 기존 파일을 덮지 않게 새 이름에 저장한다.

### 3단계: 실수 DELETE를 안전하게 재현

`review`를 트랜잭션 안에서 지운 상태와 롤백 결과를 본다. 원본 데이터는 보존된다.

```bash
docker exec -i ds-mysql mysql -uroot -plocal ds_practice <<'SQL'
START TRANSACTION;
DELETE FROM review;
SELECT COUNT(*) AS rows_after_delete FROM review;
ROLLBACK;
SELECT COUNT(*) AS rows_after_rollback FROM review;
SQL
```

**결과 (예상):** 삭제 직후 `0`, 롤백 뒤 시드 기준 약 `400`이다. 커밋된 운영 사고는 백업과 binlog로 별도 DB에 복구한다.

### 4단계: 새 DB에 복원

새 빈 DB를 만들어 덤프를 가져온다. 원본 `ds_practice`를 덮지 않아 비교와 애플리케이션 검증을 할 수 있다.

```bash
docker exec ds-mysql mysql -uroot -plocal -e \
  "CREATE DATABASE ds_practice_restored CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
docker exec -i ds-mysql mysql -uroot -plocal ds_practice_restored \
  < /tmp/r07-backup/ds_practice.sql
```

**확인 방법:** `docker exec ds-mysql mysql -uroot -plocal -e "SHOW TABLES FROM ds_practice_restored;"`에 16개 테이블이 나온다. 테이블 생성 오류나 `mysql`의 0이 아닌 종료 코드가 있으면 복원이 성공한 것으로 보지 않는다.

### 5단계: 행 수와 체크섬 비교

`COUNT(*)`는 실제 행 수를 센다. 핵심 업무 테이블을 원본과 복원본에서 나란히 확인하고, `CHECKSUM TABLE`로 나머지 테이블까지 내용을 비교한다.

```sql
SELECT 'member' AS table_name,
       (SELECT COUNT(*) FROM ds_practice.member) AS source_rows,
       (SELECT COUNT(*) FROM ds_practice_restored.member) AS restored_rows
UNION ALL
SELECT 'orders',
       (SELECT COUNT(*) FROM ds_practice.orders),
       (SELECT COUNT(*) FROM ds_practice_restored.orders)
UNION ALL
SELECT 'order_item',
       (SELECT COUNT(*) FROM ds_practice.order_item),
       (SELECT COUNT(*) FROM ds_practice_restored.order_item)
UNION ALL
SELECT 'payment',
       (SELECT COUNT(*) FROM ds_practice.payment),
       (SELECT COUNT(*) FROM ds_practice_restored.payment)
UNION ALL
SELECT 'review',
       (SELECT COUNT(*) FROM ds_practice.review),
       (SELECT COUNT(*) FROM ds_practice_restored.review);

CHECKSUM TABLE
  ds_practice.member, ds_practice_restored.member,
  ds_practice.category, ds_practice_restored.category,
  ds_practice.product, ds_practice_restored.product,
  ds_practice.product_option, ds_practice_restored.product_option,
  ds_practice.cart_item, ds_practice_restored.cart_item,
  ds_practice.orders, ds_practice_restored.orders,
  ds_practice.order_item, ds_practice_restored.order_item,
  ds_practice.payment, ds_practice_restored.payment,
  ds_practice.delivery, ds_practice_restored.delivery,
  ds_practice.subscription, ds_practice_restored.subscription,
  ds_practice.coupon, ds_practice_restored.coupon,
  ds_practice.member_coupon, ds_practice_restored.member_coupon,
  ds_practice.point_history, ds_practice_restored.point_history,
  ds_practice.article, ds_practice_restored.article,
  ds_practice.comment, ds_practice_restored.comment,
  ds_practice.review, ds_practice_restored.review;
```

**결과 (예상):** 각 쌍의 행 수·체크섬이 같다. 실제 값은 MySQL 8.4에서 확인한다. 체크섬 충돌 가능성이 있으므로 대표 업무 조회도 한다. `CHECKSUM TABLE`은 전체 행을 읽고 InnoDB에 읽기 잠금을 잡으므로 대형 운영 테이블은 부하를 고려한다.

실제 커밋된 대량 삭제 복구라면 검증된 별도 복구 DB의 접속 정보·스키마·행 수·결제/주문 대표 조회를 확인한 뒤 애플리케이션 연결을 전환한다. 원본 DB를 급히 덮으면 복구 전 상태를 비교할 증거와 추가 복구 선택지를 잃는다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `mysqldump` | MySQL 논리 전체 DB 백업 | `mysqldump --single-transaction --quick ds_practice > backup.sql` | 큰 DB는 복원 시간이 길다. 덤프 중 DDL을 피한다. |
| `--routines --events` | 프로시저·함수·이벤트 포함 | 위 실습 백업 명령에 추가 | 복원 계정에 객체 생성 권한 필요 |
| `mysql` | SQL 덤프 복원 | `mysql ds_practice_restored < backup.sql` | 대상 DB를 만들고, 중복 데이터 위에 재실행하지 않는다. |
| `mysqlbinlog` | MySQL binlog 열람·재생 | `mysqlbinlog --stop-datetime=... binlog.*` | 전체 기준 백업과 연속된 binlog가 있어야 PITR 가능 |
| `pg_dump` / `pg_restore` | PostgreSQL 논리 백업·복구 | `pg_dump -Fc -d appdb -f appdb.dump` | PostgreSQL의 물리 PITR용 base backup과 다른 경로 |
| `pg_basebackup` | PostgreSQL 클러스터 물리 base backup | `pg_basebackup -D /backup/base -Fp` | 특정 DB만이 아니라 전체 클러스터를 백업 |
| RDS 자동 백업 / 수동 스냅샷 | 관리형 인스턴스 복구 지점 | RDS PITR로 새 인스턴스 생성 | 최신 복구 시각, 보존기간, 계정·리전 복사 확인 |
| RPO / RTO | 복구 설계의 손실·시간 목표 | `RPO ≤ 15m`, `RTO ≤ 2h` | 숫자는 조직이 정하고 실제 복구 훈련으로 검증 |
| `CHECKSUM TABLE` | MySQL 테이블 내용 비교 | `CHECKSUM TABLE ds_practice.member;` | 전체 행 읽기·읽기 잠금으로 큰 테이블은 부하 주의 |

## 5. 자주 나는 에러와 해결

1. **`ERROR 1049 (42000): Unknown database 'ds_practice_restored'`** → 덤프 파일이 DB 생성까지 하는 `--databases` 형식이 아닌데 대상 DB를 만들지 않았다 → 새 DB를 생성한 뒤 복원한다. 실습 명령은 단일 DB 덤프이므로 이 순서다.

2. **`mysqldump: Got error: 1044: Access denied ...`** → 백업 계정에 대상 테이블의 `SELECT`, 뷰·트리거 등의 읽기 권한이 부족하다 → 필요한 객체에 최소 권한을 부여하고 다시 만든다. MySQL 문서는 덤프 객체에 따라 `SELECT`, `SHOW VIEW`, `TRIGGER` 등이 필요하다고 명시한다. 운영 백업에 상시 `root`를 쓰지 않는다.

3. **덤프 파일은 있지만 크기가 0이거나 복원 중 SQL이 잘린다.** → 디스크 부족, 권한 오류, 프로세스 실패를 무시하고 리다이렉션된 파일을 성공본으로 취급했다 → 종료 코드와 stderr, 파일 크기·해시를 확인하고 실패본을 격리한다. 스크립트에서 파이프를 쓸 때는 `set -o pipefail`로 앞 명령 실패도 감지한다.

4. **`ERROR 1050 (42S01): Table '...' already exists` 또는 중복 키 오류** → 이전 복원 데이터가 남은 DB에 다시 가져왔다 → 새 빈 DB에 복원하거나, 보존이 확인된 폐기 가능한 연습 DB만 초기화한다. 운영 DB에서 무심코 `DROP`하지 않는다.

5. **`--single-transaction` 덤프 중 일관성 오류 또는 테이블 정의 변경 메시지** → 동시에 실행한 DDL이 덤프의 일관된 읽기를 깨뜨렸다 → 백업 창에 DDL을 멈추고, 불가능하면 엔진에 맞는 잠금·물리 백업 방식을 선택한다. 이 옵션의 일관성 보장은 InnoDB 테이블에 한정된다.

6. **복원된 행은 맞는데 앱이 DB에 접속하지 못한다.** → DB 덤프에는 Spring Boot JAR/컨테이너 설정, DNS, DB 사용자·권한, 비밀 저장소 값, 업로드 파일이 포함되지 않는다 → `DB_URL` 등 외부 설정과 계정·권한 복구, 아티팩트 배포, 파일 저장소 복구를 각각 확인한 뒤 헬스체크한다.

7. **RDS 복원 직후 응답이 평소보다 느리다.** → AWS 문서상 복원된 인스턴스는 사용 가능 상태여도 스토리지 블록이 배경에서 초기화 중일 수 있다 → `StorageOperationStatus`와 진행률을 관찰하고, 성능이 회복되기 전 부하 시험·전환 판단을 서두르지 않는다.

## 6. 한 단계 더

전체 백업은 복구의 기준점이고, binlog/WAL은 기준점 이후의 변경을 복원해 RPO를 줄인다. 증분 백업은 저장·전송량을 아끼지만 이전 백업에 대한 의존성과 복원 단계를 늘린다. DB 스냅샷을 VM 스냅샷으로 대체하지 말고, DB·머신·애플리케이션 자산마다 소유자·보관기간·암호화·복구 명령을 적는다.

복원은 새 환경에서 먼저 수행하고, 행 수·체크섬·업무 쿼리·애플리케이션 연결을 확인한 뒤 전환한다. 복구 훈련 결과로 실제 RPO/RTO를 재고 목표보다 느리면 백업 주기나 물리 복구 방식을 바꾼다.

운영 장애 대응 → D09 참조 · 배포 롤백 → D06 참조 · 리눅스 명령 → D12 참조 · DB 서버 개념 → R01 참조.

## 7. 자가점검 Q&A (면접 대비)

**Q1. RPO와 RTO는 무엇이 다르고 백업 주기와 어떤 관계인가?**  
RPO는 허용하는 데이터 손실 구간이고 RTO는 복구 허용 시간이다. 일일 덤프만 있다면 RPO도 거의 하루가 될 수 있다. RTO는 파일 크기만이 아니라 복원·검증·전환 시간을 재야 한다.  
**꼬리질문: RPO 10분이면 10분마다 전체 덤프를 해야 하나?**  
아니다. 전체 기준 백업 뒤 binlog/WAL을 이어 보관하고 목표 시각까지 재생한다.

**Q2. 복제본이나 다중 AZ가 있으면 백업을 없애도 되나?**  
안 된다. 복제는 가용성·읽기 분산을 돕지만 잘못된 `DELETE`도 복제될 수 있다. 백업은 과거 복구 지점을 제공하므로 목적이 다르다.  
**꼬리질문: 복제 지연으로 삭제 전 행이 남아 있으면 복구하면 되나?**  
임시 조회는 가능해도 삭제가 전파되면 사라진다. 보존된 백업/PITR을 쓴다.

**Q3. `--single-transaction`이 일관성을 주는 조건과 한계는?**  
InnoDB의 일관된 읽기로 덤프 시작 시점의 스냅샷을 읽는다. DML을 받으며 덤프할 수 있지만 MyISAM에는 같은 보장이 없다. 덤프 중 DDL도 피해야 한다.  
**꼬리질문: `--lock-tables`를 같이 켜면 되나?**  
두 옵션은 상호 배타적이다. 엔진과 쓰기 허용 조건에 맞춰 하나를 선택한다.

**Q4. `mysqldump`와 물리 스냅샷 중 무엇을 고르나?**  
작고 이동·검토가 잦은 DB는 논리 덤프가 편하다. 대용량을 빨리 복원해야 하면 물리 백업이 유리하지만 엔진·버전·일관성 절차를 맞춘다. DB 백업은 앱 파일을 포함하지 않는다.  
**꼬리질문: RDS 스냅샷이면 VM의 앱 파일도 복구되나?**  
아니다. DB, VM, 앱 자산은 백업 범위를 각각 둔다.

**Q5. MySQL과 PostgreSQL의 PITR에 필요한 것은?**  
MySQL은 전체 기준 백업과 이후 binlog, PostgreSQL은 물리 base backup과 연속 WAL 아카이브가 필요하다. 로그를 목표 시각까지만 재생한다.

`pg_dump`는 PostgreSQL 논리 백업이므로 이 물리 PITR 경로와 다르다.
**꼬리질문: `--single-transaction`만으로 MySQL PITR이 되나?**  
아니다. 그 옵션은 덤프 일관성 옵션이며, 뒤의 binlog 보관·재생이 따로 필요하다.

**Q6. 해시가 맞으면 복원 검증은 끝났나?**  
아니다. 해시는 파일 바이트의 변화를 찾지만 데이터의 업무 정확성을 증명하지 않는다. 행 수·체크섬·관계·대표 조회·헬스체크를 확인하고 복구 훈련으로 실제 RPO/RTO를 잰다.  
**꼬리질문: 운영 DB에 직접 복원하면 더 빠르지 않나?**  
새 DB에서 검증한 뒤 전환해야 손상된 원본을 덮지 않고 선택지를 보존한다.

## 8. 참고문헌

- MySQL 8.4 Backup and Recovery — https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html — 백업·복구 개요.
- MySQL 8.4 Backup Types — https://dev.mysql.com/doc/refman/8.4/en/backup-types.html — 논리·물리 및 전체·증분 비교.
- MySQL 8.4 `mysqldump` — https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html — 옵션·일관성·복원 예.
- MySQL 8.4 Binary Log PITR — https://dev.mysql.com/doc/refman/8.4/en/point-in-time-recovery-binlog.html — binlog 재생 복구.
- MySQL 8.4 `CHECKSUM TABLE` — https://dev.mysql.com/doc/refman/8.4/en/checksum-table.html — 체크섬·잠금·비용.
- PostgreSQL 18 Backup and Restore — https://www.postgresql.org/docs/current/backup.html — 백업 유형 개요.
- PostgreSQL 18 `pg_basebackup` — https://www.postgresql.org/docs/18/app-pgbasebackup.html — 클러스터·증분 백업.
- PostgreSQL 18 Continuous Archiving and PITR — https://www.postgresql.org/docs/current/continuous-archiving.html — base backup과 WAL 재생.
- PostgreSQL 17 Release Notes — https://www.postgresql.org/docs/17/release-17.html — `pg_basebackup` 증분 백업 추가.
- Amazon RDS, Introduction to backups — https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html — 자동 백업·스냅샷.
- Amazon RDS, Point-in-time restore — https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html — 새 인스턴스 복구와 로그 업로드.
- AWS Well-Architected, DR objectives — https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html — RPO·RTO 정의.
- Percona XtraBackup 8.4 — https://docs.percona.com/percona-xtrabackup/8.4/index.html — MySQL 계열 온라인 백업.
- CISA, #StopRansomware Guide — https://www.cisa.gov/stopransomware/ransomware-guide — 오프라인 백업·복구 테스트 권고.
