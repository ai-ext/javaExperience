# 07. DB 실무 사건 시나리오 소재 조사 (3~6년차 온보딩)

작성일: 2026-10-22. 대상: Java/Spring Boot + MySQL 백엔드 온보딩.
기존 실습(EXPLAIN/EXPLAIN ANALYZE, 복합 인덱스 전후, Flyway, expand-contract, 백필, N+1, 커서 페이징)은 전제로 두고, 그보다 실무에 가까운 "사건"을 모았다.

표기 규칙
- [직접확인] 이번 조사에서 원문을 열어 본문 내용을 확인한 출처
- [본문확인] 원 fetch가 403이어서 브라우저로 본문 전체를 읽고 확인한 출처 (2026-10-22)
- [스니펫] 검색 결과 발췌만 보고 본문은 열지 못한 출처 (하단 "확인 불가" 참조)
- 수치는 원문에 있는 것만 옮겼다. 우리 환경에서 재현한 값이 아니다.

---

## 1. 슬로우 쿼리 발견 → 분석 절차

**실무 상황**: 장애는 "DB CPU 상승 / API 지연 알람"으로 시작한다. 어떤 쿼리인지부터 찾아야 한다. 슬로우 로그, APM/DB 모니터링, performance_schema 세 갈래 중 하나로 후보를 잡고 EXPLAIN으로 내려간다.

**판단 기준·절차**
- slow query log: `long_query_time` 기본 10초(마이크로초 단위 지정 가능), `log_queries_not_using_indexes`는 기본 꺼짐(쓰면 로그가 빠르게 불어나므로 `log_throttle_queries_not_using_indexes`로 제한), `min_examined_row_limit`, 요약은 `mysqldumpslow`. 락 대기 시간은 실행 시간에 포함되지 않는다. (MySQL 공식 문서 [직접확인])
- sys 스키마: `statement_analysis`, `schema_unused_indexes`, `schema_redundant_indexes`, `innodb_lock_waits` 뷰 제공 (MySQL 공식 문서 [직접확인]).
- 알림 파이프라인 사례(인프랩): RDS 쿼리 로그를 CloudWatch에 쌓고 Lambda가 3초 이상 쿼리를 Slack으로 알림, 애플리케이션별 자주 쓰는 쿼리는 Datadog DBM으로 분석. 이 쿼리 최적화 덕분에 DB scale down을 진행 [직접확인].
- 호갱노노(직방) MySQL 8.0.34 사례 [본문확인]: 실거래 약 203만 건 테이블에서 `거래년월 >= 202306`(134,176건)은 range scan, `>= 202305`(173,069건)는 풀스캔으로 바뀐다. 전체의 약 6.6%에서 8.5% 사이에서 플랜이 바뀐 셈이다. 저자는 이 지점을 "인덱스 손익분기점"이라 부르고, 옵티마이저 풀스캔과 힌트로 강제한 인덱스 스캔의 IO를 비교했다. 논리 IO는 풀스캔 62,071 대 인덱스 259,723(약 4.2배), 물리 IO는 풀스캔 15,344 대 인덱스 2,278(약 14%)이다. 즉 "인덱스를 안 탄다 = 옵티마이저 오류"가 아니라, 많은 행을 인덱스로 찾으면 랜덤 액세스 때문에 논리 IO가 더 커져서 풀스캔이 합리적일 수 있다는 결론이다. 교훈: 소량 조회에만 인덱스가 맞고, 대량 조회는 조회 전략 자체를 바꾼다. 풀스캔이 항상 나쁜 것은 아니다.
- 같은 글의 "인덱스는 타는데 느린" 절차 [본문확인]: `EXPLAIN`만 보면 `IDX_02(지역코드, 거래년월)`을 range로 잘 타는 것처럼 보이지만, `EXPLAIN ANALYZE`에서는 `지역코드 like '11%'` 범위 조건 때문에 뒤쪽 `거래년월`이 액세스 조건이 못 되고 필터로 동작해 167,787행을 읽고 140,289행을 버렸다(최종 약 16%만 사용, 132ms 대 34.6ms). 선행 컬럼을 26개 IN-list로 펼치면 읽은 행 27,498 = 사용한 행 27,498로 바뀐다. 저자는 IN 값이 너무 많으면 오히려 나빠질 수 있다고 덧붙였다(`eq_range_index_dive_limit`).

**흔한 사고와 결과**: 원인 쿼리를 못 찾고 인스턴스만 키운다. 슬로우 로그 임계값이 기본 10초라 아무것도 안 잡힌다. 어제까지 빠르던 쿼리가 통계/데이터 분포 변화로 갑자기 느려진다(플랜 변경).

**시나리오 소재**
- A. "알람은 울리는데 어떤 쿼리인지 모른다": 부하 스크립트로 느린 쿼리 3개가 섞인 트래픽을 흘리고, 학습자가 slow log(+`long_query_time=0.5`) → `sys.statement_analysis` → EXPLAIN ANALYZE 순으로 범인을 찾는다.
- B. "어제까지 빨랐던 쿼리": 데이터를 대량 적재해 같은 SQL의 플랜이 인덱스에서 풀스캔으로 바뀌는 지점을 만든다. `ANALYZE TABLE`, 인덱스 힌트, 쿼리 재작성 중 무엇을 쓸지 판단하게 한다. 호갱노노 글처럼 힌트로 인덱스를 강제한 쪽의 논리 IO(`Innodb_buffer_pool_read_requests` 차이)를 실제로 재서 "옵티마이저가 맞았다"를 확인하는 단계를 넣을 수 있다.
- C. "EXPLAIN은 range인데 느리다": 선행 컬럼 범위 조건 때문에 후행 컬럼이 필터로 밀려난 복합 인덱스 쿼리를 준다. `EXPLAIN ANALYZE`의 읽은 행 대비 출력 행으로 비효율을 찾고, IN-list 전개와 커버링 인덱스 중 무엇이 맞는지 판단하게 한다. 호갱노노 글 기준 커버링 인덱스(`지역코드, 거래년월, 거래금액`)는 읽기 IO를 457,927에서 16,785로(약 3%) 줄였지만, 인덱스를 늘리는 대가는 2절에서 다룬다.

**출처**
- https://dev.mysql.com/doc/refman/8.0/en/slow-query-log.html
- https://dev.mysql.com/doc/refman/8.0/en/sys-schema.html
- https://tech.inflab.com/20240227-finops-for-startup/
- https://medium.com/zigbang/mysql-%EC%9D%B8%EB%8D%B1%EC%8A%A4-%ED%8A%9C%EB%8B%9D-18e183e9246d (호갱노노, 브라우저로 본문 확인, 2026-10-22 [본문확인])

---

## 2. 인덱스 설계 판단

**실무 상황**: 쿼리 하나를 빠르게 하려고 인덱스를 추가하면 끝나는 게 아니다. 쓰기 증폭, 중복 인덱스, 정렬·범위 조건 위치, 옵티마이저의 선택까지 같이 본다.

**판단 기준·절차**
- 복합 인덱스는 최좌측 접두사만 사용 가능: (c1,c2,c3)은 c1 / c1,c2 / c1,c2,c3 조회에 쓰이고 c2만으로는 쓰이지 않는다 (MySQL 공식 [직접확인]).
- `ORDER BY ... LIMIT`은 인덱스가 정렬을 제공할 때만 빠르다. 동률 값은 순서가 비결정적이라 `ORDER BY category, id`처럼 유니크 컬럼을 붙여야 한다 (MySQL 공식 [직접확인]). 이 점은 커서/페이징 정확성과도 직결된다.
- 정리 대상 탐색: `sys.schema_unused_indexes`(performance_schema `table_io_waits_summary_by_index_usage`의 count가 0인지로 판단, 서버 재시작 후 누적이므로 월말 배치 같은 주기를 포함해 관찰), `sys.schema_redundant_indexes`(DROP 구문까지 출력). 인덱스 사용 패턴은 인스턴스마다 다르므로 Primary와 Replica 모두 조회. unique 인덱스는 `schema_unused_indexes`에서 제외됨 (hoing.io [직접확인]).
- 토스 정산: 조회가 정산일자 기준이라 날짜 Range 파티셔닝 + 정산일자 선두 복합 인덱스 [직접확인].
- 호갱노노 중복 인덱스 실험 [본문확인]: 아파트 실거래 테이블에 `(전용면적)`, `(거래일자)`, `(아파트코드,전용면적,거래일자)`, `(아파트코드,전용면적)`, `(아파트코드)` 5개를 둔 경우와 필요한 2개만 남긴 경우, 인덱스 없는 경우를 같은 스키마로 만들어 10,000건 INSERT의 block IO를 비교했다. write IO는 중복 인덱스 199,677 > 통폐합 80,328(약 2.5배 차) > 인덱스 없음 20,475, read IO는 434,212 > 159,073 > 41,428이다. 인덱스 용량은 176.34MB(테이블 82.61MB 대비 약 210%)에서 30.56MB로 줄었다. 저자는 중복 인덱스 정리가 해당 컬럼을 쓰는 모든 쿼리의 실행계획에 영향을 주므로 신중히 하라고 경고한다. 단 로컬 docker 기본 설정에서 잰 block IO이지 운영 TPS가 아니다.
- 카카오페이 사례는 튜닝용 인덱스가 INSERT/UPDATE 성능과 용량 부담이라 구조 변경을 택했다고 서술 [스니펫].

**흔한 사고와 결과**: 읽기 인덱스를 계속 추가해 쓰기 전용 테이블이 느려진다. 중복 인덱스 방치. 유니크 인덱스 때문에 삭제하면 안 되는 것을 미사용으로 오인.

**시나리오 소재**
- A. "인덱스 7개짜리 테이블": 주문성 테이블에 누적된 인덱스 중 미사용 2개, 중복 1개가 섞여 있고 INSERT TPS가 낮다(호갱노노 실험의 5개 인덱스 구성, 접두사가 겹치는 `(a)`, `(a,b)`, `(a,b,c)`를 본뜰 수 있다). 학습자가 sys 뷰로 후보를 뽑고, 삭제 전 안전 확인(유니크/FK 용도, 주기 쿼리) 후 TPS 전후를 비교한다. 단 TPS 수치는 사내 환경에서 직접 측정해야 한다.
- B. "ORDER BY 동률 사고": created_at 동률이 많은 데이터에서 LIMIT 페이징이 중복/누락을 낸다. 정렬 키에 id를 추가해 고친다 (주제 5와 연결).

**출처**
- https://dev.mysql.com/doc/refman/8.0/en/multiple-column-indexes.html
- https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html
- https://hoing.io/archives/7097
- https://toss.tech/article/42671
- https://medium.com/zigbang/mysql-%EC%9D%B8%EB%8D%B1%EC%8A%A4-%ED%8A%9C%EB%8B%9D-18e183e9246d (호갱노노, 브라우저로 본문 확인, 2026-10-22 [본문확인])

---

## 3. 운영 중 스키마 변경: Online DDL / gh-ost / pt-osc / MDL

**실무 상황**: 컬럼 추가나 인덱스 추가를 "온라인이니까 안전"하다고 가정하고 돌렸다가, 긴 트랜잭션 하나 때문에 테이블 전체가 막힌다.

**판단 기준·절차**
- 컬럼 추가는 8.0.12부터 `ALGORITHM=INSTANT`가 기본, 컬럼 데이터 타입 변경은 `ALGORITHM=COPY`만 지원 (MySQL 공식 [직접확인]). 같은 문서에서 FK의 CASCADE/SET NULL 동작이 ALTER를 다른 트랜잭션 커밋까지 기다리게 할 수 있다고 명시.
- MDL: 열린 트랜잭션에서 접근한 테이블의 메타데이터 락은 트랜잭션 종료까지 유지된다. 다른 세션의 ALTER/DROP/LOCK TABLE WRITE는 그때까지 블록된다 (MySQL 공식 [직접확인]). 즉 "SELECT만 하고 커밋 안 한" 유휴 세션이 DDL을 막고, DDL 뒤에 들어오는 DML도 줄줄이 대기한다 (netdata/Code With Karani 계열 설명 [스니펫], 일반 원리는 공식 문서로 확인).
- 사고 형태 사례(velog): ALTER 중 lock wait timeout, 원인은 Sleep 상태 세션이 쥔 MDL, `SHOW FULL PROCESSLIST` 확인 후 KILL로 해소 [스니펫].
- Aurora 특이점: writer에서 DDL을 실행하면 reader의 장시간 트랜잭션이 MDL 확보를 위해 강제 종료될 수 있다. 증상은 에러 2013/2006, mydumper 같은 논리 백업 중단 (Percona [직접확인]).
- 사전 점검: `information_schema.innodb_trx`로 오래된 트랜잭션 확인, `lock_wait_timeout`을 짧게 두어 DDL이 무한 대기하며 뒤 쿼리를 쌓지 않게 한다 (영문 가이드들 [스니펫]. 공식 문서 직접 확인은 못함).
- 도구 선택: pt-osc는 트리거로 동기화, 트리거가 이미 있으면 못 쓰고, FK가 참조하면 `--alter-foreign-keys-method` 필요, `--max-lag`(기본 1s)로 복제본 지연 시 복사 일시정지 (Percona 공식 [직접확인]). gh-ost는 트리거 오버헤드·락 경합을 피하려는 triggerless 설계 (gh-ost 공식 doc [직접확인]).
- 한국 사례: 당근 "MySQL Online-DDL"(저자 Sunguck Lee) [본문확인]. 매뉴얼의 "duplicate entry ... only temporary"가 무엇인지 재현으로 푼 글이다. 20만 행 테이블(컬럼 30개 추가로 용량을 키움)에서 `DROP PRIMARY KEY, DROP INDEX ux_uid, ADD PRIMARY KEY(uid), ADD UNIQUE INDEX ux_id(id), ALGORITHM=inplace, LOCK=none`을 돌리는 동안 다른 세션이 1초 뒤 UNIQUE 키 값이 중복되는 DML을 실행하면, DDL이 맨 마지막 "로그 적용" 단계에서 `ERROR 1062 Duplicate entry '1' for key 'dup_error.PRIMARY'`로 실패한다.
  - 원인: Online DDL은 스토리지 엔진 수준에서 동작해 DML이 SQL로 무엇이었는지 모르고, 변경을 임시 로그에 쌓았다가 끝에 순서대로 적용한다. 중복 키 값이 한 번이라도 저장되면(INSERT 실패, `INSERT ... ON DUPLICATE KEY UPDATE`가 UPDATE로 처리, 심지어 트랜잭션 ROLLBACK까지) 로그상 INSERT + DELETE로 남아, 적용 중 일시적 중복이 생겨 DDL이 실패한다. 매뉴얼은 "possible"이라 했지만 저자는 이 조건이면 100% 실패한다고 본다.
  - 시간 비용: 에러가 마지막 단계에서만 나므로 3~4시간 걸리는 DDL이 시작 직후 들어온 DML 때문에 끝에서 실패할 수 있고, 한 번 나는 DB는 재시도해도 또 날 가능성이 높다.
  - 예외: `INSERT ... ON DUPLICATE KEY UPDATE`에서 auto-increment PK에 NULL(컬럼 생략 포함)을 넣을 때만 실패했고, PK 값을 명시하면 성공했다. 저자 제안은 먼저 SELECT로 INSERT/UPDATE를 가르는 쿼리로 바꾸는 것, 그러나 그보다 pt-online-schema-change가 낫다는 것이다. UNIQUE 인덱스를 만드는 경우 대부분 이 가능성을 안고 있다고 한다. 단 pt-osc도 자체 자원 낭비와 문제가 있으니 상황에 맞게 고르라고 덧붙였다.
  - 스니펫 요약("동시 DML과 충돌해 실패")은 과하게 넓었다. 실제로는 UNIQUE 키 중복 값이 DDL 중에 저장되는 경우에 한정된다. 또 글에 MySQL 버전 명시는 없고 테스트 결과는 저자의 로컬 재현이다.
- 초대형 테이블: Sendbird는 gh-ost/pt-osc/fb-osc가 단일 프로세스·진행 미저장이라 중단 시 재개 불가, 수백 GB~TB에서 수 주~수 개월로 늘어난다고 보고 SB-OSC를 자체 개발. 약 2억 행·인덱스 2개 기준 부하 없을 때 22분 vs gh-ost 1시간 52분, 부하 시 27분 vs gh-ost 1일 이상(약 50%에서 중단) (Sendbird 측 측정치 [직접확인]).

**흔한 사고와 결과**: `ALGORITHM`/`LOCK`을 명시하지 않아 COPY로 조용히 폴백. 배포 직전 리포트성 긴 트랜잭션과 겹쳐 서비스 전체 정지. PK 없는 테이블에서 gh-ost 불가.

**시나리오 소재**
- A. "금요일 오후 ALTER 한 줄": 한 세션이 `BEGIN; SELECT ...` 후 방치. 학습자가 ALTER를 실행하면 해당 테이블 전체 쿼리가 대기. `performance_schema.metadata_locks`/`sys.schema_table_lock_waits`(공식 sys 스키마 뷰 목록에서 존재 확인은 못했으므로 사용 전 8.0 문서에서 확인 필요)로 차단자를 찾아 KILL, 이후 `lock_wait_timeout`과 `ALGORITHM=INSTANT/INPLACE, LOCK=NONE` 명시 습관을 적용한다.
- B. "타입 변경 INT → BIGINT": COPY 필요를 확인하고, 모든 선택지(점검창, gh-ost/pt-osc, expand-contract로 새 컬럼 추가+백필+전환)를 비교하게 한다.
- C. "UNIQUE 키 교체 DDL이 3시간 뒤 실패": 당근 글의 `dup_error` 테이블을 20만 행 이상으로 만들고, 학습자가 PK/UNIQUE 교체 ALTER를 돌리는 동안 부하 스크립트가 `INSERT ... ON DUPLICATE KEY UPDATE`(auto-increment PK에 NULL)를 흘린다. 맨 끝에서 1062로 실패하는 것을 보고, 원인(로그 적용 시점의 일시적 중복)을 설명하게 한 뒤 PK 값 명시, SELECT 분기, pt-osc 중 선택하게 한다. 단 MySQL 버전별로 재현되는지는 우리 환경에서 먼저 확인해야 한다.

**출처**
- https://dev.mysql.com/doc/refman/8.0/en/innodb-online-ddl-operations.html
- https://dev.mysql.com/doc/refman/8.0/en/metadata-locking.html
- https://www.percona.com/blog/impact-of-ddl-operations-on-aurora-mysql-readers/
- https://docs.percona.com/percona-toolkit/pt-online-schema-change.html
- https://github.com/github/gh-ost/blob/master/doc/why-triggerless.md
- https://aws.amazon.com/ko/blogs/tech/how-sendbird-developed-and-applied-sb-osc-for-very-large-amazon-aurora-mysql-operations
- https://medium.com/daangn/mysql-online-ddl-faf47439084c (당근, 브라우저로 본문 확인, 2026-10-22 [본문확인])

---

## 4. 데이터 마이그레이션·백필

**실무 상황**: 컬럼/테이블 구조 전환, 레거시 원장 이관. 청크 처리만이 아니라 "구/신 계산 결과 비교, 누락 보정, 롤백 경로"가 핵심이다.

**판단 기준·절차 (실제 사례)**
- 토스 결제 원장: 취소를 UPDATE에서 INSERT-only로 바꿔 불변성·데드락 방지·이력 추적. 신규 원장 적재는 비동기, RO DB 기반 검증 배치가 매시 5분마다 누락 재적재, 두 원장 불일치 시 기존 원장 기준으로 5분마다 보정 배치, 이벤트 중복은 헤더 멱등키로 구분 [직접확인].
- 토스 정산: 레거시와 신규가 각각 계산 → 일치하면 신규 투입, 불일치하면 레거시 투입 + 원인 추적(병행 계산 검증). 계산 시점의 계약 조건을 스냅샷으로 저장해 재현 가능. 거래 단위 상태 기록으로 실패 건만 재처리. 병렬 처리는 모듈러 연산으로 스레드별 대상을 미리 분할해 중복/누락 방지 [직접확인].
- 쿠팡: 큰 테이블을 청크로 나눠 소스/복제본 체크섬을 비교하는 백업·복구 검증 플랫폼 [스니펫. 본문 미열람].
- Sendbird SB-OSC: 정수 PK 기준 청크 분할 벌크 복사와 binlog DML 반영을 분리, 진행 상황을 DB에 기록해 중단 지점부터 재개 [직접확인].

**흔한 사고와 결과**: 백필이 운영 DB 부하/복제 지연을 유발. 새 컬럼 읽기 전환 후 누락 데이터 발견. 컬럼 삭제를 롤링 배포와 같은 릴리스에 넣어 구버전 인스턴스가 깨짐.

**시나리오 소재**
- A. "백필 중 복제 지연": 청크 크기·sleep 없이 백필하면 replica lag가 증가(주제 8과 결합). `--max-lag`류 스로틀(복제 지연 확인 후 일시정지) 로직을 학습자가 구현한다.
- B. "구/신 병행 계산 검증": 신규 정산 로직을 만들고 레거시 결과와 비교해 불일치 건을 분류하고 롤백(레거시 사용) 스위치를 설계한다. 컬럼 삭제는 별도 릴리스로 분리한다는 원칙은 expand-contract 일반 가이드(DEV.to 등)에 공통이나 국내 기업 실사고 출처는 확보 못함.

**출처**
- https://toss.tech/article/payments-legacy-5
- https://toss.tech/article/42671
- https://aws.amazon.com/ko/blogs/tech/how-sendbird-developed-and-applied-sb-osc-for-very-large-amazon-aurora-mysql-operations
- https://medium.com/coupang-engineering/towards-a-robust-cloud-based-database-backup-and-recovery-platform-6732f476e3a3

---

## 5. 페이징·대량 조회

**실무 상황**: 어드민 목록, 배치 reader가 뒤 페이지로 갈수록 느려진다. 총 건수(count) 쿼리가 본 쿼리보다 비싸다.

**판단 기준·절차**
- 우아한형제들: offset은 뒤로 갈수록 앞 행을 읽고 버린다. No Offset(`id < 마지막id ORDER BY id DESC LIMIT n`)로 86.9만 건 21분 → 4분 36초, 118.9만 건 55분 → 2분 27초. 제약: 정렬이 PK 등 단순해야 하고 복잡한 정렬엔 부적합 [직접확인].
- 카카오페이 배치 reader 비교: 300만 건 기준 JpaPagingItemReader 약 112분, ZeroOffset/ExposedCursor 약 4분대. JpaCursorItemReader는 전량 메모리 적재로 OOM 위험 [직접확인].
- 총 건수: 조건에 맞는 COUNT를 매번 실행하는 비용 문제는 Slice(다음 페이지 유무만) 또는 count 생략으로 대응하는 논의가 일반적이나, 국내 기업 블로그 근거는 확보 못함 (아래 "확인 불가").
- 커서에서 정렬 키가 유니크하지 않으면 중복/누락 (MySQL 공식 ORDER BY LIMIT 비결정성 [직접확인]).

**흔한 사고와 결과**: 배치가 수 시간에서 수십 분으로 늘어나다 어느 날 타임아웃. 정렬 키 동률로 일부 건 누락 처리.

**시나리오 소재**
- A. "수백만 건 어드민 엑스포트": offset 방식 reader의 시간이 페이지에 따라 선형 증가하는 그래프를 그려 보고 zero-offset으로 바꾼다. 정렬 키가 created_at일 때 누락이 생기는 함정을 포함.
- B. "count가 느리다": 필터 조건 있는 목록 API의 count 쿼리를 EXPLAIN으로 분석하고 Slice/무한 스크롤/상한 count 중 요구사항별로 선택하게 한다.

**출처**
- https://techblog.woowahan.com/2662/
- https://tech.kakaopay.com/post/ifkakao2022-batch-performance-read/
- https://dev.mysql.com/doc/refman/8.0/en/limit-optimization.html

---

## 6. 락·데드락·격리수준

**실무 상황**: 부하가 올라가야만 재현되는 데드락. 코드 리뷰나 단위 테스트로는 안 잡힌다.

**판단 기준·절차**
- 공식: 트랜잭션을 짧게, 테이블·행 접근 순서 통일, UPDATE/SELECT FOR UPDATE의 WHERE 컬럼에 인덱스. 감지는 기본 활성, 한쪽을 롤백(victim), 애플리케이션은 롤백된 트랜잭션 재시도 처리 필요. `SHOW ENGINE INNODB STATUS`의 LATEST DETECTED DEADLOCK, 전체 로깅은 `innodb_print_all_deadlocks` [직접확인].
- 공식 락 규칙: INSERT는 먼저 insert intention gap lock, 중복 키 오류 시 기존 행에 공유 락을 건다 [직접확인].
- KINTO(Aurora MySQL 3 결제 시스템) 사례: 결제 폭주 시 약 30분간 데드락. 1단계 `SELECT ... WHERE request_id=? FOR UPDATE`(중복 확인)가 결과 없어도 gap lock을 잡고, 3단계 INSERT의 insert intention lock과 서로 대기. request_id가 상품ID-날짜-순번이라 연속 증가해 같은 인덱스 구간에 몰렸고, 부하 테스트는 랜덤 UUID라 재현되지 않았다. curl 2개 동시 요청으로 재현, 중복 확인 쿼리 제거 + 요청 수신 시 임시 등록 후 즉시 커밋으로 해결 [직접확인].
- 컬리 VSMS 재고 차감: 두 트랜잭션이 같은 상품들을 반대 순서로 잠가 순환 대기. 차감 대상 정렬 3줄 PR로 해결. 120 TPS 수준에서 시작해 이후 튜닝으로 924 TPS, 1500 TPS 이상 [직접확인].
- 컬리 REPEATABLE READ 스냅샷: INSERT 후 다른 세션 SELECT가 안 보임. autocommit=false, open-in-view로 커넥션 유지, RR 스냅샷 고정이 원인. 격리수준을 낮추면 Phantom Read 등 부작용, 잠금 읽기는 락 경합 증가라 조회 메서드에 `@Transactional(readOnly=true)`로 해결했다고 서술 [직접확인].
- 낙관/비관 락 선택: 이번 조사에서 국내 기업 근거 글을 확보하지 못했다 (아래 "확인 불가").

**흔한 사고와 결과**: 부하 테스트 데이터가 운영 키 분포와 달라 데드락 미재현. 데드락 후 재시도 로직 부재로 사용자 결제 실패.

**시나리오 소재**
- A. "결제 중복 확인 FOR UPDATE": KINTO 사례를 그대로 재구성. 연속 증가 request_id 부하와 UUID 부하 두 가지를 돌려 보고, 데드락 로그를 읽어 gap lock 대기 쌍을 찾게 한다. 해결안 비교(중복 확인 제거 + 유니크 제약 + 예외 처리, 격리수준 RC 등).
- B. "재고 N개 동시 차감": 반대 순서 잠금으로 데드락 → 정렬로 해결. 이어서 재시도 처리.

**출처**
- https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlocks.html
- https://dev.mysql.com/doc/refman/8.0/en/innodb-locks-set.html
- https://blog.kinto-technologies.com/posts/2024-12-11-mysql-deadlock/
- https://helloworld.kurly.com/blog/vsms-performance-experiment/
- https://helloworld.kurly.com/blog/commit-mvcc-set-autocommit/

---

## 7. 트랜잭션과 커넥션 풀

**실무 상황**: 트랜잭션 안의 외부 호출, 중첩 트랜잭션, 커넥션 누수가 풀 고갈로 나타난다. 풀 크기만 키우면 DB로 병목이 이동한다.

**판단 기준·절차 (실제 사례)**
- 우아한형제들 HikariCP 풀락: `@GeneratedValue(AUTO)`가 MySQL에서 `hibernate_sequence` 테이블 `FOR UPDATE` 서브 트랜잭션을 돌려 작업당 커넥션 2개 필요. 스레드 16, 풀 10이면 상위 트랜잭션이 풀을 다 잡고 채번용 커넥션을 서로 기다려 `SQLTransientConnectionException`(약 30초). 점검법: 풀 크기를 1로 두고 단건 실행해 타임아웃 나면 교착 가능. 공식 `Tn×(Cm−1)+Tn/Cm`(16×1+8=24), `PooledLoThreadLocalOptimizer`(increment 1000) [직접확인].
- 카카오페이 JPA @Transactional: DBA 알림으로 발견. 전체 QPS 약 24K 중 `set_option` 약 14K. readOnly 트랜잭션이 호출당 추가 쿼리를 최대 6개 유발, 클래스 레벨 `@Transactional`과 트랜잭션 안의 3rd party API 호출이 커넥션을 오래 점유. 단건 트랜잭션 제거, `SUPPORTS` 전파 커스텀 어노테이션 등으로 조회 처리량 약 2~3배, API 응답 약 2배 개선 [직접확인].
- 카카오페이 주니어 이슈 글: 한 트랜잭션에 외부 클라이언트 호출이 묶여 응답이 들쭉날쭉하고 타임아웃 → 외부 호출을 트랜잭션 밖으로 분리, 외부 실패 시 빈 리스트로 대체 [직접확인].
- 컬리 커넥션 누수: EC2 OOM 반복, 힙 덤프에 `ConnectionImpl` 약 13,689개. HikariCP max-lifetime 50초(기본 30분의 36배 빠른 재생성)로 `AbandonedConnectionCleanupThread`(단일 스레드)가 따라가지 못함. mysql-connector-j 8.0.22+ 와 `-Dcom.mysql.cj.disableAbandonedConnectionCleanup=true`로 해결 [직접확인].
- 우아한형제들 MySQL `GET_LOCK` 분산락: JdbcTemplate은 쿼리마다 커넥션을 반환하므로 락 획득/해제가 다른 커넥션에서 실행되어 락 미해제 또는 남의 락 해제 위험. 한 커넥션으로 처리하도록 변경 [직접확인].

**흔한 사고와 결과**: 외부 API 지연 시 풀 소진으로 무관한 API까지 타임아웃. 풀 증설로 DB 연결 한계에 닿음.

**시나리오 소재**
- A. "결제사 응답 지연": 결제 API mock에 5초 지연을 주고 `@Transactional` 안에서 호출하는 서비스에 부하를 걸어 Hikari pending/active 지표와 타임아웃을 관찰. TransactionTemplate 분리, 외부 호출 타임아웃으로 개선하고 풀 증설이 해결이 아님을 확인한다.
- B. "풀 크기 1 테스트": 우아한형제들 방법 그대로, 중첩 트랜잭션/채번 서브트랜잭션이 풀을 2개 요구하는 코드를 찾아낸다.

**출처**
- https://techblog.woowahan.com/2663/ (2664는 이론편 [스니펫])
- https://tech.kakaopay.com/post/jpa-transactional-bri/
- https://tech.kakaopay.com/post/troubleshooting-logs-as-a-junior-developer/
- https://helloworld.kurly.com/blog/connection-leak/
- https://techblog.woowahan.com/2631/

---

## 8. 읽기 복제(Replica)와 복제 지연

**실무 상황**: 쓰기 직후 읽기가 replica로 가서 "방금 만든 데이터가 없다". readOnly 트랜잭션이 의도대로 라우팅되지 않는 문제도 있다.

**판단 기준·절차**
- AWS RDS: MySQL 복제는 비동기, `ReplicaLag` 지표는 `SHOW REPLICA STATUS`의 `Seconds_Behind_Master` [스니펫].
- 국내 사례(velog): INSERT 직후 SELECT가 ProxySQL 경유로 Slave에 가서 데이터가 안 보임. 초기엔 주요 로직을 Master 직결, 이후 `AbstractRoutingDataSource` + AOP로 "INSERT 후 SELECT 필요 로직"만 Master 조회. ProxySQL은 트랜잭션 내 요청을 Master로 보내므로 INSERT도 트랜잭션으로 감쌈. 동시 사용자 간 경합은 남는다는 한계도 명시 [직접확인].
- 컬리 사례: 같은 Master 세션 문제가 아니라 RR 스냅샷 문제였던 것이 핵심 교훈. 복제 지연으로 오인하기 쉽다 (주제 6 [직접확인]).
- Aurora의 reader는 같은 클러스터 볼륨을 공유(binlog 복제 아님)하여 복제 지연 성격이 다르고, DDL 시 reader 쿼리가 종료될 수 있음 (Percona [직접확인]).
- 라우팅 구현 시 `LazyConnectionDataSourceProxy` 사용 논의는 개인 실험 저장소(read-replica-routing-lab) 수준 [스니펫].

**흔한 사고와 결과**: 가입/주문 직후 조회 404. 백필·배치로 lag 증가 시 오래된 데이터 노출.

**시나리오 소재**
- A. "방금 가입했는데 회원이 없대요": docker로 비동기 복제(지연 주입) 환경을 구성. readOnly 라우팅 후 쓰기 직후 읽기 실패를 재현하고, 선택지(쓰기 직후 읽기는 Primary, 트랜잭션 내 읽기, 지연 임계 시 폴백)를 평가한다. 원인이 복제 지연인지 RR 스냅샷인지 구분하는 단계 포함.
- B. 백필로 lag를 키우는 주제 4-A와 결합.

**출처**
- https://velog.io/@12onetwo12/DB-Replication-%EB%B3%B5%EC%A0%9C-%EC%A7%80%EC%97%B0-%ED%95%B4%EA%B2%B0
- https://helloworld.kurly.com/blog/commit-mvcc-set-autocommit/
- https://www.percona.com/blog/impact-of-ddl-operations-on-aurora-mysql-readers/
- https://docs.aws.amazon.com/ko_kr/AmazonRDS/latest/UserGuide/USER_MySQL.Replication.ReadReplicas.Monitor.html

---

## 9. JPA 실무 쿼리 이슈

**실무 상황**: N+1 외에 collection fetch join + 페이징(HHH000104), 벌크 연산 후 영속성 컨텍스트 불일치, JDBC 배치 미적용, 복잡 쿼리 도구 선택.

**판단 기준·절차**
- HHH000104: collection fetch join에 페이징을 걸면 SQL에 LIMIT가 없고 메모리에서 자름. 데이터가 적을 땐 경고만 나오다 증가 후 성능 문제. 해결: ID 먼저 페이징 후 fetch join하는 2단계 쿼리, 또는 Hibernate 6 window function(`dense_rank()`). 탐지용 `hibernate.query.fail_on_pagination_over_collection_fetch` (Vlad Mihalcea 본문 [직접확인], 탐지 설정은 [스니펫]). 우아한형제들 글은 `hibernate.default_batch_fetch_size` 또는 ID 조회 후 IN 절을 제시 [스니펫].
- 배치 insert: `GenerationType.IDENTITY`는 batch insert가 비활성화됨, MySQL은 `rewriteBatchedStatements=true` 필요, `spring.jpa.properties.hibernate.jdbc.batch_size` 위치 주의 (우아한형제들 [직접확인]). 토스 정산은 결과 저장을 건별 INSERT에서 JDBC batchUpdate로 변경 [직접확인].
- 벌크 연산: 영속성 컨텍스트를 거치지 않아 불일치. `clearAutomatically` 기본 false. 전 flush/후 clear 권장 (인프런·velog 요약 [스니펫]. 국내 기업 실사고 글은 확보 못함).
- 도구 선택 사례(SK DevOcean 빌링): Kotlin data class 불변성 때문에 JPA 엔티티와 별도 DTO가 늘어나고, QueryDSL은 GROUP_CONCAT/JSON_ARRAYAGG 등 서브쿼리 표현 한계로 native query, 원작자 유지보수 종료로 OpenFeign fork 의존. 조회부터 jOOQ로 점진 전환 [직접확인]. MyBatis 대 JPA를 국내 기업이 비교한 글은 확보 못함.
- 컬리 JPA 삽질: UUID PK 관련 글이 존재하나 본문은 미열람 [스니펫].

**흔한 사고와 결과**: 개발 데이터가 적어 경고를 무시, 운영에서 전량 로딩으로 OOM/지연. 벌크 update 후 stale 엔티티를 읽어 잘못 저장. 배치 insert가 IDENTITY 때문에 건별 실행.

**시나리오 소재**
- A. "주문 목록 페이징 + 주문상세 fetch join": 로그의 HHH000104 경고를 발견하고 쿼리 로그에서 LIMIT 부재 확인, 2단계 쿼리로 수정. 데이터 10만 건 전후 응답 시간 비교.
- B. "상태 일괄 변경 벌크 후 엔티티 조회": `@Modifying` 쿼리 뒤 같은 트랜잭션에서 엔티티를 읽으면 옛 값. `clearAutomatically` 적용.
- C. "10만 건 INSERT가 느리다": IDENTITY와 `rewriteBatchedStatements` 확인, 로그(`profileSQL`)로 실제 전송 쿼리 검증.

**출처**
- https://vladmihalcea.com/fix-hibernate-hhh000104-entity-fetch-pagination-warning-message/
- https://techblog.woowahan.com/2695/
- https://devocean.sk.com/blog/techBoardDetail.do?ID=167463&boardType=techBlog
- https://toss.tech/article/42671

---

## 10. 정합성: 카운터 컬럼, 배치 재계산, 유니크 제약

**실무 상황**: 좋아요 수, 재고, 한도 같은 값이 어긋난다. 동시 요청이 규칙(사용자당 N개)을 깬다.

**판단 기준·절차**
- Tecoble(우아한테크코스) 좋아요: 조인 조회에서 `like_count` 컬럼으로 조회 시간 0.68초 → 0.0013초. 읽고 +1 하면 Lost Update. 조회 락은 대기, 원자적 UPDATE는 같은 row에 쓰기 집중. like 테이블 기준 주기 동기화(Sync Schedule)는 다음 동기화 전까지 부정확(궁극적 일관성)이라는 트레이드오프, 서비스 상황에 따라 선택 [직접확인].
- 우아한형제들 MySQL `GET_LOCK`: 여러 서버에서 Card 생성 20건이 동시 입력되어 User당 2개 제한이 깨지고 20개 생성 [직접확인]. (DB 유니크 제약으로 막을 수 없는 "N개 제한" 규칙의 대표 예.)
- 카카오페이: 버튼 연타(따닥)로 포인트 중복 지급 → Redis 분산 락(퀴즈ID:유저ID, TTL 3초). 플랫폼 API가 중복 요청에 예외를 던져 응답이 달라지는 문제는 지급 이력 저장 후 저장 결과 반환으로 멱등화 [직접확인].
- 토스: 불일치 시 기존 원장 기준 보정 배치, RO DB로 매시 누락 검증, 멱등키 [직접확인].
- 공식: 중복 키 오류 시 INSERT가 기존 행에 공유 락을 걸어 동시 INSERT가 데드락 가능 (MySQL 공식 [직접확인]). 즉 "유니크 제약으로 중복 방지"는 데드락과 예외 처리(`DuplicateKeyException` 후 조회 반환) 설계를 함께 가져야 한다.

**흔한 사고와 결과**: 카운터와 실제 건수 불일치 누적, 중복 지급/생성, 유니크 제약 위반 예외가 500으로 노출.

**시나리오 소재**
- A. "좋아요 100명이 동시에 누르면": 읽기-수정-쓰기 방식 vs `SET cnt=cnt+1` vs 주기 재집계를 비교하고 불일치를 만든 뒤 재계산 쿼리/배치로 복구한다.
- B. "쿠폰 1인 1매": 유니크 제약 + 중복 예외를 멱등 응답으로 변환. 반면 "사용자당 N개"처럼 유니크로 표현 안 되는 규칙은 락 필요함을 비교.

**출처**
- https://tecoble.techcourse.co.kr/post/2022-10-10-like-count/
- https://techblog.woowahan.com/2631/
- https://tech.kakaopay.com/post/troubleshooting-logs-as-a-junior-developer/
- https://toss.tech/article/payments-legacy-5
- https://dev.mysql.com/doc/refman/8.0/en/innodb-locks-set.html

---

## 온보딩 시나리오에 넣을 DB 사건 목록

| # | 사건 | 실무 근거 사례(출처) | 학습자가 겪을 증상 | 해결에서 배우는 것 | 난이도 |
|---|------|------|------|------|------|
| 1 | ALTER 한 줄에 테이블 전체 정지 (MDL 대기열) | MySQL 공식 metadata-locking, Percona Aurora DDL | ALTER 후 해당 테이블 모든 쿼리 대기, `Waiting for table metadata lock` | 차단 세션 탐색/KILL, `lock_wait_timeout`, `ALGORITHM/LOCK` 명시 | 중상 |
| 2 | 결제 중복 확인 `FOR UPDATE`가 만든 gap lock 데드락 | KINTO Tech Blog (Aurora MySQL 3) | 부하 시 간헐적 데드락 롤백, 결제 실패. UUID 부하에서는 재현 안 됨 | `LATEST DETECTED DEADLOCK` 읽기, gap/insert intention lock, 테스트 데이터 분포의 중요성 | 상 |
| 3 | 재고 차감 반대 순서 잠금 데드락 | 컬리 VSMS 성능 실험 | 동시 차감에서 데드락, TPS 저조 | 잠금 순서 통일(정렬), 재시도 설계 | 중 |
| 4 | 외부 API 호출을 품은 트랜잭션이 풀을 고갈 | 카카오페이 JPA Transactional, 카카오페이 주니어 이슈 글 | 외부 지연 시 무관 API 포함 전체 타임아웃, Hikari pending 증가 | 트랜잭션 경계 축소, 타임아웃, 풀 증설이 해법이 아닌 이유 | 중 |
| 5 | 풀 크기 vs 중첩 트랜잭션 풀락 (채번 서브 트랜잭션) | 우아한형제들 HikariCP Dead lock 실전편 | 부하 시 30초 후 `SQLTransientConnectionException` | 풀 크기 1 점검법, 커넥션 2개 필요 코드 식별, ID 생성 전략 | 상 |
| 6 | "방금 만든 데이터가 안 보인다" (복제 지연 vs RR 스냅샷) | velog 복제 지연 사례, 컬리 commit/MVCC | 쓰기 직후 조회 누락, 재시도하면 보임 | 원인 구분(replica lag/격리수준/open-in-view), 쓰기 직후 읽기 라우팅 | 중상 |
| 7 | 어제까지 빠르던 쿼리가 풀스캔으로 (플랜 변경) | 호갱노노 인덱스 튜닝 (본문확인), MySQL 슬로우 로그/sys 문서 | 특정 시점부터 DB CPU 급증, 슬로우 로그 급증 | slow log → `sys.statement_analysis` → EXPLAIN ANALYZE, 인덱스 손익분기점 이해(힌트 강제 시 논리 IO 비교), 통계 갱신/쿼리 재작성 | 중 |
| 8 | 인덱스 과다 테이블의 쓰기 저하와 중복·미사용 인덱스 정리 | MySQL sys 스키마 문서, hoing.io, 호갱노노(본문확인, 10,000건 INSERT write IO 약 2.5배 차), 카카오페이(스니펫) | INSERT/UPDATE 느림, 용량 증가 | `schema_unused/redundant_indexes`, 관찰 주기, unique/FK 용 인덱스 주의, 삭제 전 롤백 계획 | 중 |
| 9 | 수백만 건 배치가 뒤로 갈수록 느려짐 (offset + 정렬 동률 누락) | 우아한형제들 Spring Batch와 Querydsl, 카카오페이 Batch Reader, MySQL LIMIT 문서 | 처리 시간 선형 증가, 어느 날 타임아웃, 일부 건 누락 | zero-offset/커서, 유니크 정렬 키 | 중 |
| 10 | collection fetch join + 페이징 (HHH000104) | Vlad Mihalcea, 우아한형제들 Hibernate 배치 글 | 로컬은 빠르고 운영에서 느림/OOM, SQL에 LIMIT 없음 | 2단계 쿼리, batch fetch size, 실패 탐지 설정 | 중 |
| 11 | 벌크 UPDATE 후 stale 엔티티와 IDENTITY 배치 미적용 | 우아한형제들 Hibernate 배치 설정, 인프런/velog 요약(스니펫) | 벌크 후 조회 값이 옛 값, 10만 건 INSERT가 건별 실행 | `clearAutomatically`, flush/clear 순서, `rewriteBatchedStatements`, 쿼리 로그 확인 | 중 |
| 12 | 좋아요/카운터 컬럼 어긋남과 재집계 배치 | Tecoble 좋아요 수 최적화, 토스 보정 배치 | 동시 요청 후 카운트 ≠ 실제 건수 | 원자적 증감 vs 주기 동기화 트레이드오프, 재계산 쿼리, 허용 오차 합의 | 중 |
| 13 | "사용자당 N개" 규칙 동시 위반과 중복 지급 | 우아한형제들 GET_LOCK 분산락, 카카오페이 따닥 | 동시 요청 시 한도 초과(20개 생성), 중복 지급 | 유니크 제약 한계, 락/멱등키, 중복 키 예외의 멱등 응답화, duplicate-key 공유락 데드락 | 중상 |
| 14 | 신·구 로직 병행 계산 검증과 보정 배치 (원장/정산 이관) | 토스 결제 원장 5부, 토스 정산 개편 | 신규 결과가 레거시와 불일치, 누락 이벤트 | 병행 검증 + 스위치 롤백, 설정 스냅샷, 멱등키, 보정 주기 | 상 |
| 15 | 초대형 테이블 타입 변경 (INT→BIGINT) 도구 선택 | MySQL Online DDL 문서(COPY 필요), Percona pt-osc, gh-ost, Sendbird SB-OSC | ALTER가 수 시간, 복제 지연, 중단 시 재개 불가 | 점검창/gh-ost·pt-osc/expand-contract 비교, 스로틀과 FK·트리거 제약 | 상 |
| 16 | UNIQUE 키 교체 Online DDL이 마지막 단계에서 Duplicate entry로 실패 | 당근 MySQL Online-DDL (본문확인), MySQL Online DDL 문서 | DDL이 수 시간 진행 후 끝에서 1062 실패, 재시도해도 반복 | 일시적 중복 + 로그 적용 원리, PK 명시/SELECT 분기/pt-osc 선택, DDL 전 DML 패턴(`ON DUPLICATE KEY`) 점검 | 상 |

권장 편성: 입문 후 단계는 7→9→10 (읽기 중심), 중간은 1→4→6→12, 심화는 2→5→13→14→15→16.

---

## 확인 불가 (이번 조사에서 확인하지 못한 것)

- **MDL 장애 국내 기업 회고**: 우아한형제들/토스/카카오 등에서 "ALTER가 MDL에 걸려 서비스 전체가 멈춘" 회고를 찾지 못했다. 일반 원리는 MySQL 공식 문서와 Percona로, 사례 형태는 velog 개인 글(스니펫)로만 뒷받침했다.
- **gh-ost 국내 도입 후기**: 한국어 gh-ost 실사용 후기는 검색에서 찾지 못했다 (youngju.dev는 개인 정리글이며 직접 열람하지 않아 미사용).
- **`sys.schema_table_lock_waits` 등 MDL 진단 뷰의 공식 문서 확인**: sys 스키마 페이지에서는 `statement_analysis`, `schema_unused_indexes`, `schema_redundant_indexes`, `innodb_lock_waits`만 확인했다. MDL 대기 진단용 뷰와 `performance_schema.metadata_locks` 사용법은 시나리오 작성 전 8.0 문서에서 별도로 확인해야 한다.
- **`lock_wait_timeout`의 DDL 대기 제한 효과, `information_schema.innodb_trx` 사전 점검**: 영문 가이드(oneuptime 등) 스니펫에만 근거하며 공식 문서 직접 확인은 못했다.
- **낙관적/비관적 락 선택 기준**, **QueryDSL 도입 판단**, **JPA vs MyBatis 선택**: 국내 대기업 기술블로그 근거를 확보하지 못했다. 확인한 것은 SK DevOcean의 JPA+QueryDSL → jOOQ 전환 사례 하나이며, MyBatis 대 JPA 직접 비교 출처는 없다.
- **COUNT 쿼리 비용 국내 사례**: 카카오페이 "Count 병목부터 커서 기반 페이지네이션까지" 같은 제목이 검색 중 언급되었으나 URL과 본문을 확인하지 못해 인용하지 않았다.
- **벌크 연산·영속성 컨텍스트 불일치**: 인프런 Q&A/velog 요약 수준만 확인. 국내 기업 실사고 글 없음.
- **중복 인덱스 제거 후 쓰기 성능 개선 실측 사례**: 운영 사례는 찾지 못했다. 호갱노노 글(본문확인)에 로컬 실험의 block IO 비교는 있으나 TPS가 아니다. 시나리오 8의 전후 TPS는 사내 환경에서 직접 측정해야 한다.
- **쿠팡 DB 백업·복구 플랫폼**: 검색 요약만 확인, 본문 미열람. 시나리오 근거 비중은 낮게 둘 것.
- **expand-contract 국내 기업 사고 사례**: 일반 가이드(영문 DEV.to 등)만 확인, 국내 기업 사례 URL은 확보하지 못해 표에 넣지 않았다.
- **복제 지연의 우아한형제들/토스 사례**: 우아한형제들 글은 DR용 Aurora 구성(2604) 하나만 나왔고 읽기 분리·지연은 다루지 않았다. 국내 사례는 개인 velog 1건뿐.
- 본 문서의 수치(TPS, 시간, 건수)는 모두 원문 저자의 환경 측정값이며 우리 환경에서 재현하지 않았다.
