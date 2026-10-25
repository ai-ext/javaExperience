# D10 개념 학습 계약 · 실행/문헌 대조 전 설계

현재 원문449줄/13fence와 기존 HTML을 고정했다. 아래는 앞으로 검증할 장면의 계약이며, 아직 실제 native 결과·최종 주제 수·이미지 ready·UI 구현을 뜻하지 않는다.

| 항목 | 계약 |
|---|---|
| 출처 | docs/knowledge/D10-database-basics.md §§3.1~3.6/§4/§7·original13·독립 정적 검토 source-review-independent.json, 기존R03/R04/S08/S09와DB-SCENARIO-PLAN 연결 |
| 시작 | 학습자가 업무 문장을 키/제약으로 바꾸고 같은 SQL의 필터·집계·트랜잭션 경계를 설명하려 한다. 기존DB·practice와 분리한 읽기용 추가 관찰이다. |
| 만들 것 | 새 학습자 서버 정답을 대신 쓰지 않는다. 별도 Python/SQLite fixture에 고정 데이터를 넣어 SQL·저장행·두 연결의 관찰 시점·거부 결과를 확인하는 개념 장면을 만든다. |
| 데이터 | 수강student1/2,course1,offering10/11,enrollment(1,10); 별도commerce customer1/2/3,PAID125+75/PENDING50/CANCELLED25; write501; 별도WAL재고와512행EQP. 실제 최종 값은 probe/frozen에서 확인하기 전 확정하지 않는다. |
| 처리 | 업무규칙→PK/UK/FK/CHECK→행 허용/거부; LEFT ON→WHERE→GROUP/HAVING; EXISTS의 독립필터; 조건부 UPDATE; 연결A 변경→다른연결B 관찰→commit/rollback; 동일 SELECT의 index 전후 계획과 결과 |
| 결과 | 실제 SQLite 행·sqlite_errorname·changes·두 연결의 시점값·EQP 문자열·integrity/closed를 원자료에 저장한다. 원문 PG18/MySQL8.4 명령·계획·Java25/Kotlin설정·서비스 성능은 미실행이다. |
| 경계 | SQLite는 명시번역이다. INTEGER PK rowid/NUMERIC affinity/TEXT시각·VARCHAR길이 차이를 기록한다. SQLite_BUSY는 PG 행락/deadlock victim이 아니고 SQLiteEQP는 PG cost/rows/ms가 아니다. |
| 응용 | HAVING을 빼면 0건 고객이 남는가, WHERE로 옮긴 PAID가 무엇을 지우는가, 최근 CANCELLED도 EXISTS에 맞는가, rowcount0의 이유는 무엇인가, 같은 데이터/결과를 유지했는가를 설명하게 한다. 학습자 이해 검증은 수행 전까지 미검증이다. |

## 장면 후보

1. 수강 요구와 관계·업무키/대리키·재신청 이력 가정 → 과목/분반과신청관계·키값을먼저읽는다.
2. 선언한 제약과 실제 거부 → 중복학번/이메일·잘못된FK·분반번호0·신청복합PK·status·NOTNULL은어느규칙이막았는지실제SQL과함께읽는다.
3. UNIQUE의 NULL과 NOTNULL → nativeSQLite의명시두NULL과제품문헌차이를분리한다.
4. 정규화 → candidate key/prime attribute/FD조건의미실행모델과실무요약·가격스냅샷을구분한다.
5. JOIN/COUNT/HAVING → 원문HAVING을제거한추가중간query와원문최종결과를분리한다.
6. EXISTS/조건부변경 → 결제상태필터없는최근주문과PAID집계의차이,501 PENDING→PAID→CANCELLED DELETE0의조건을따라간다.
7. 관찰시점 → 같은own파일의연결A/B·uncommitted/commit/rollback·WAL reader snapshot/새read를실제행으로구분한다. ORM/영속성컨텍스트를새로실행한척넣지않는다.
8. writer경합 → timeout0의SQLite_BUSY·ownrollback·guardedUPDATE결과만확인하고다른제품행락/데드락은별도문헌모델로둔다.
9. 계획/인덱스 → SQLite512행의실제EQP전후/복원·동일행과PG18의추정cost/outputrows/ANALYZE/skipscan/visibility모델을별도로연결한다. 속도수치는만들지않는다.
10. 운영/제품 → pool예산·primary/replica·backup/sharding·RDB/NoSQL접근패턴모델을둔다. 제품기능부재/트랜잭션무조건불가같은단정이나실제운영목표달성은없다.
11. 원문환경 → PostgreSQL18/MySQL8.4/Docker/Java25/Kotlin/properties의미실행전체를보존한다. MySQLblock11에없는FK/CHECK를그원문에있다고하지않는다.

실제 imagegen은 native facts·공식모델 검토 뒤에 제작한다. 현재질문·짧은설명·현재값·코드·근거출처는기본노출하고,긴원문/로그만접는다. 이미지/capture는JPG92·실제native해상도/헤더기준이다. 실제검증없는항목을verified로올리지않는다.
