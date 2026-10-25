# D10 추가 SQLite 번역 probe와 원문 경계

원문 `docs/knowledge/D10-database-basics.md` 449줄·13fence(Mermaid4/SQL4/sh3/Kotlin1/properties1)를 `source.json`·`original/`의 byte/SHA로 보존한다. 이 proof는 원문 PostgreSQL18/MySQL8.4/Docker/Java25·JDBC 예제를 실행한 결과가 아니다. native PostgreSQL을 찾지 못한 뒤 main이 허용한 추가 stdlib Python3.14.3/SQLite3.53.0의 별도 번역 예시다. 원문 PostgreSQL DDL·EXPLAIN·격리·행 락·성능을 SQLite로 인증하지 않는다. 원문 MySQL block11은 PostgreSQL 예제와 달리 FK/CHECK가 없는 별도 DDL이며 같은 제약 스키마라고 부르지 않는다. 기존 R04/MySQL 등의 결과를 이 D10이나 practice 검증으로 승계하지 않는다.

## 실행과 현재 단계

```bash
python3 -B docs/design/d10-2026-10-21/source-proof/run-proof.py \
  --probe \
  --project-root /Users/ds/code/javaExperience/.worktrees/concept-learning-night \
  --runtime-root /Users/ds/research/javaexperience-d10-20261021/_data/native
```

최초 준비 단계는 모델0의 probe였고 해당 기록은 그대로 보존했다. main의 정적 검토가 끝난 미실행 모델6을 포함해 최초 freeze와 별도 author fresh를 실행했으며, 현재 고유27CHECK/모델6 전체 JSON이 frozen expected와 일치했다. 이 두 실행은 exit0이다. main/독립 재현은 별도 범위이며 정확한 명령·SHA·run·정리 근거는 freeze-verification.json/author-fresh-verification.json과 로그에 있다. `--probe`는 `probe-execution.json`에 실제 관찰을 쓰고 기대값을 생성/비교하지 않는다. 이후 최초 `--freeze`는 main 모델6의 executed=false를 확인하고 checkpoint를 `open('x')`로 한 번만 생성한다. 기존 checkpoint가 있으면 실행 전에 거부한다. 일반 재현은 전체 execution과 expected를 비교한다. `--project-root`는 읽을 원문 루트, `--runtime-root`는 새 private run 부모다.

첫 probe는 exit0·고유 native CHECK27개·모델0개였다. 이는 사전에 정한27이라는 숫자를 맞춘 것이 아니다. fixture가 실제로 출력한 PASS ID 순서와 observed.json의 ID/facts key를 대조하고 중복 없음·실제 개수를 계산한다. 27개의 독립 실험이나 PostgreSQL27검사가 아니다. fixture9개의 SQL/Python/seed와 runner SHA는 `fixture-manifest.json`에 있다.

## 기존 DB 학습 경로와의 연결

`docs/design/DB-SCENARIO-PLAN.md`의 기존 practice 보존 원칙을 확인했다. M1 목록 API/응답→테이블, M3 좋아요 인덱스, M6/M9 집계, M10 쿼리 수, 8장 JOIN/집계/추천/검색, 9-2 인덱스·계획, L12~14의 동일 API를 JPA/MyBatis/QueryDSL로 옮기는 경로를 참고한다. 이 독립 개념 proof는 그 미션 정답·API·실행 데이터·성능 검증을 대신하거나 새 DB 시나리오 구현으로 표시하지 않는다. practice/학습자 source/기존DB/서비스/cache는 열거나 변경하지 않는다. 설치·Docker·네트워크 서버 접속·외부 CLI 조사도 하지 않는다.

## SQLite 타입 번역과 수강 제약

`college-sqlite.sql`은 student/course/offering/enrollment의 업무 규칙을 별도 SQLite DDL로 명시 번역했다. INTEGER PRIMARY KEY는 SQLite rowid alias로 PG BIGINT GENERATED ALWAYS AS IDENTITY와 다르다. SQLite에서는 이 alias에 NULL을 넣어 자동 id가 생길 수 있으므로 PG의 PK/IDENTITY 의미 전체를 인증하지 않는다. 복합 enrollment PK에는 원문처럼 두 FK 열의 NOT NULL을 명시했다. TEXT는 VARCHAR 길이 제한·TIMESTAMPTZ의 timezone 의미가 아니고 SQLite NUMERIC affinity는 원문 NUMERIC(12,2) 정밀도/scale 보장이 아니다. 같은 형식의 고정 ISO문자열을 명시했으며 PG DATE/TIMESTAMP/INTERVAL 연산은 실행하지 않았다. 원문의 시간 기본식과 실제 seed 시각도 혼합하지 않는다.

추가 seed는 학생2(course와 별개 이름 학생A/B), 과목1(DB101), 분반2(offering10/11), 신청1(student1,offering10)이다. 실제 값은 `seeds.json`에 전부 있다. 원문이나 기존 practice의 실행값이라고 부르지 않는다. 모든 새 연결에서 PRAGMA foreign_keys=ON을 설정하고1을 읽어 확인한다.

- student 대리 PK 중복과 campus_no/email UK 중복을 각각 거부했다.
- student.name·enrollment.enrolled_at의 tested NOT NULL 위반을 거부했다. 모든 열/타입의 모든 입력을 검증한 범위는 아니다.
- course_code UK, offering(course_id,term_code,section_no)의3열 UK, 없는 course parent와 section0을 거부했다.
- enrollment의 중복(student,offering) 쌍, 없는 student/offering, WAITING 상태를 거부했다.
- 실제 sqlite_errorname/extended code/message·SQL·바인딩을 기록했다. 이들13개 잘못된 시도는 각각 savepoint 안전장치 안에서 되돌렸고 네 원본 테이블의 전체 seed 행을 전후 대조해 보존했다.
- 별도 nullable_unique toy는 NULL2개를 허용하고 required_unique의 NOT NULL+UNIQUE는 NULL1299/중복2067을 거부했다. 이 SQLite3.53 예시를 모든 제품의 NULL/UNIQUE 규칙으로 일반화하지 않는다. student 업무 키의 NOT NULL을 뺀 실험도 아니다.

대표 SQLite 오류 코드는 PK1555, UNIQUE2067, NOT NULL1299, FK787, CHECK275다. 실제 오류 이름은 facts의 각 attempt에서 확인한다. SQLite 오류를 PG SQLSTATE/MySQL errno로 표시하지 않는다.

## 별도 고객·주문 query toy

고객1 ada/2 bob/3 cy는 고정2026 시각이다. 고객1은 PAID125·PAID75·PENDING50, 고객2는 CANCELLED25, 고객3은 주문이 없다. SQL의 금액은 이 명시 seed의 NUMERIC affinity 정수 값이며 PG의 decimal 정밀도 검증이 아니다. 고객 cutoff는2026-01-01T00:00:00Z, 최근 주문 cutoff는2026-09-01T00:00:00Z다. 필요한 observer id정렬·COUNT(*) 추가·ISO TEXT bind는 별도 번역/변형으로 표시했다.

- `left-on-paid.sql`은 **원문 HAVING을 제거하고 COUNT(*)를 더한 추가 중간행/query 변형**이다. 고객1의 countStar/countId/sum은2/2/200, 고객2와3은각1/0/0이다. 원문 최종 HAVING 결과가 고객3명이라는 뜻이 아니다.
- `where-paid.sql`의 추가 비교는 오른쪽 PAID를 WHERE에 두어 고객1만 남긴다.
- `having-paid.sql`은 원문 최종 HAVING COUNT(o.id)>=1을 고정 ISO bind로 번역해 고객1/orderCount2/paidTotal200만 반환한다.
- `exists-recent.sql`은 status 필터 없이 최근 주문이 있는 고객1/2를 반환한다. 고객2의 CANCELLED도 조건에 맞는다. id정렬은 추가 observer 규칙이고 원문 EXISTS가 순서를 보장한다는 뜻이 아니다.
- 위 조회 관측은 주문501 추가 전이다. 그 다음 별도 쓰기 단계에서501 PENDING/25000/명시 ISO시각을 넣고 PAID로 UPDATE한 cursor rowcount1, 같은 guard의 두 번째0, CANCELLED 조건 DELETE0을 확인한다. 최종501 PAID 행을 보존했다. source CURRENT_TIMESTAMP의 실행 시각이나 MySQL affected-row mode 관측이 아니다.

## 같은 own 파일의 SQLite WAL 두 연결

writer/observer는 같은 새 `wal-concurrency.sqlite` 파일을 사용한다. :memory: 두 개나 서로 다른 DB 파일이 아니다. 실제 dbFile·phase·SQL/bindings·시점 marker는 raw에 남긴다. Python 한 프로세스가 두 연결의 트랜잭션을 통제된 순서로 겹친 것이며 다중 앱 인스턴스·thread 부하 시험이 아니다.

1. 초기 state10에서 writer BEGIN IMMEDIATE→20 미커밋일 때 writer는20, 다른 연결은10을 읽는다. commit 뒤 다른 연결의 새 autocommit 읽기는20이다.
2. observer BEGIN 후 첫 읽기20으로 snapshot을 잡는다. writer가30을 commit해도 observer 같은 transaction은20을 읽고, transaction을 끝낸 새 읽기는30이다. SQLite WAL read snapshot 사례이며 PostgreSQL READ COMMITTED/InnoDB REPEATABLE READ를 실행한 것이 아니다.
3. writer가 BEGIN IMMEDIATE·40을 미커밋으로 보유할 때 observer의 BEGIN IMMEDIATE가 timeout0 설정 아래 실제 SQLITE_BUSY/code5(database is locked)다. 이는 SQLite 단일 writer 경합이고 행 락·PG deadlock·대기시간 측정이 아니다. writer rollback 뒤 두 연결 모두30이다.
4. 별도 stock5에 qty3 guard UPDATE를 같은 own writer transaction에서 두 번 실행해 rowcount1→0, commit 후 observer quantity2를 확인했다. 실제 동시 부하·oversell 보편 증명이 아니다.

## 작은 disposable SQLite EQP

`plan.sqlite`의 별도512행은 `seeds.json`의 고정 생성 규칙이다. 고객/주문 query toy나 practice에 추가한 데이터가 아니다. 동일 SELECT·동일 bind·동일 결과 정렬로 before-index→create→drop→restore를 비교했다. INDEXED BY/optimizer 강제 힌트나 ANALYZE를 사용하지 않았다. `cached_statements=0`은 schema 변경 뒤 오래된 prepared EQP를 재사용하지 않게 한 관찰 설정이며 optimizer에게 index 사용을 강제하지 않는다.

첫 SQLite3.53 probe의 actual EQP는 baseline/drop에서 `SCAN orders`와 `USE TEMP B-TREE FOR ORDER BY`, index추가/복원에서 `SEARCH orders USING INDEX orders_customer_created_idx`였다. 네 SELECT 결과14개와 순서는 모두 같다. 이는 반환 결과14개이지 물리적으로 읽은 행 수가 아니다. raw tuple의 숫자(예:216/51)는 해석하지 않은 SQLite EQP 필드로 보존할 뿐 PG cost/rows/ms로 이름붙이지 않는다. EXPLAIN QUERY PLAN은 SQLite의 선택 계획 표시이고 별도로 실행한 SELECT 결과를 그 명령의 actual scan rows/latency처럼 섞지 않는다. 원문 EXPLAIN은 추정 계획 명령이고 원문 지시문에 실제행·시간 언급이 있어도 그 EXPLAIN 출력으로 지어내지 않는다.

이 표본의 SCAN/SEARCH 선택만 기록하며 모든 데이터·버전에서 인덱스를 쓰거나 빨라진다는 결론은 없다. 선택이 예상과 다르면 fixture가 실패 관찰과 실제 raw plan을 보존하며 힌트로 성공을 강제하지 않는다. PostgreSQL EXPLAIN ANALYZE, MySQL invisible index, 속도/I/O/물리 examined rows는 미실행이다.

## 정리·원자료·미실행

새 DB파일4개/연결5개 각각 FK pragma1·foreign_key_check빈값·integrity ok를 확인했다. 모든 own 연결은 실제 close 뒤 SELECT가 ProgrammingError로 거부되는 것으로 종료를 확인한다. own 파일은 증거로 남기고 원본 DB·서비스를 정리한다는 명령은 없다. 장기 서버/포트/외부 네트워크·Docker는 시작하지 않았다.

`records/<mode>/<own-run>/`의 sqlite-probe.log/observed.json/raw-sqlite.json과 own runtime을 보존한다. raw는 실제 SQLite trace callback, wrapper SQL template/bindings/cursor rowcount/fetched result, 동일 DB 경로·시점 marker를 구분한다. 이것을 네트워크 SQL wire 수나 물리 I/O/scan 계측이라고 부르지 않는다. canonical facts는 안정된 alias·고정 입력·관찰값만 가지며 actual timestamp·임시 경로는 raw에만 둔다. 원문13/fixture SHA는 전후 보존한다. 모델·제품 비교·PG/MySQL row lock/deadlock·풀·복제·샤딩·NoSQL·실제 앱·학습자·전체pixel 검증은 이 native 범위가 아니다.
