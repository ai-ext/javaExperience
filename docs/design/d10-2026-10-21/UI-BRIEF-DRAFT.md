# D10 UI 계약 초안 · native/model freeze 전

원문449줄13fence/기존지도·HTML17429/without16138/code9/Mermaid4/id16/map1을보존한다. 신규D10namespace만추가한다. actualnative는명시번역SQLite27고유CHECK이며PG18/MySQL8.4/Docker/Java25는원문미실행이다. 모델6독립정적검토뒤최초freeze/메인fresh/독립사본전체대조를해야하며그전UI완료주장은없다.

15질문44상태 후보(native22/model18/unrun4). 최종코드·값·CHECK·runKeys는freeze후실제facts/models로대조하고코드를만든다. 모든모델과원문checks[]·PASS부모숨김. 원문에없는SQLite번역SQL은codeKindnative-fixture와출처/차이를기본노출한다.

|topic|stageIDs 후보|실제/설명 범위|
|---|---|---|
|schema|schema-relations,schema-original,schema-seed|문헌카디널리티→원문block03PGDDL미실행→추가SQLitestudent2/course1/offering2/enrollment1/27CHECK중source·runtime·seed연결. model1/unrun1/native1|
|keys|keys-student,keys-offering,keys-enrollment,keys-required,keys-preserved|actualPK/2업무UK/과목코드·분반3열UK·FK/CHECK/신청pair·양parent·status/NOTNULL2시도/13거부뒤seed그대로. native5;각attemptSQL/bindings/errorcode유지|
|null|null-native,null-products|별도nullableUniqueNULL2/requiredUniqueNULL거부1299·중복2067→PGNULLSDISTINCT/NOTDISTINCT·MySQL·NOTNULL문헌비교. native1/model1|
|normalization|normalization-keys,normalization-partial,normalization-transitive|candidate/prime→2NF모든candidate/properSubset→3NFsuperkeyORprime/가격snapshot은다른시점사실. 전부미실행model3|
|join|join-on,join-where,join-having|추가HAVING제거/COUNTstar추가ONquery3고객2/2/200,1/0/0,1/0/0→WHEREPAID고객1only→최종HAVING고객1/2/200. independentcommerceSeed포함native3. date필터는c.created_at이며주문결제일필터아님|
|exists|exists-native,exists-predicate|최근orders시각>=cutoff/status없음고객1/2→PAID집계와날짜대상·분모·중복전파차이설명. native1/model1|
|mutation|mutation-update,mutation-zero|501명시PENDING입력→firstUPDATE1/second0→CANCELLEDDELETE0/finalPAID25000. 실제fact하나두초점native2;입력예시와actualread시점구분|
|visibility|visibility-uncommitted,visibility-commit,visibility-snapshot|같은SQLite파일두연결writer20/observer10미커밋→commit후새read20→reader20/다른writer30commit뒤도20/reader끝새read30. native3|
|contention|contention-busy,contention-rollback,contention-guard|SQLitewriter40미커밋/다른BEGINIMMEDIATEtimeout0BUSY5·다른read30→rollback양쪽30→stock5 qty3순차두guardchanges1,0/final2. native3;PG행락/deadlock/부하실험아님|
|index|index-before,index-after,index-restore|별도512행EQPSCAN+TEMPBTREE→SEARCHorders_customer_created_idx→drop/restore/4SELECT같은14결과·힌트없음. native3;globalFK5/integrity5/close5/fixture9source13보존CHECK는모든실험후별도cleanup시점으로연결. raw216/51은cost/ms/행수아님|
|plans|plans-estimate,plans-prefix,plans-covering|PGEXPLAIN추정OUTPUTrow/costunit/ANALYZE실행차이→leftprefix/skipscan조건→INCLUDE/visibilitymapheap조건. model3,새PG실행계획/속도없음|
|isolation|isolation-pg-rc,isolation-pg-rr,isolation-innodb,isolation-deadlock|PGRC문장snapshot→PGRR첫nontransactionstatement→InnoDBRRconsistentvslocking/currentread→2행cycle/victim불확정·전체trxretry. model4·실제SQLite값으로PG재현인증안함|
|operations|operations-pool,operations-replica,operations-sharding|명시120/reserve20/4x20+10+3=93/한도100/여유7,6instance153/초과33→asyncstale/backup별도→조각vs사본·복원서비스목표. model3;실제설정/부하/운영RPO/RTO없음|
|products|products-patterns,products-mongo|접근패턴별RDB/keyvalue/document/wide/graph→Mongoflexible+validation/다중문서ACID조건. model2·모든NoSQL보장/기능부재단정없음|
|original|original-postgres,original-mysql,original-jvm|block09PGDockerpsql/EXPLAIN원문미실행→block11MySQLDDL은FK/CHECK없음→block12Kotlin/13propertiesJava25Boot4.1.1미실행. unrun3/전체원문13은supplement보존|

현재코드/값/짧은문장/사실출처와번역경계는기본노출한다. 원문장문/raw/전체JSON만details. 실제코드snippet은연속원본부분문자열/빈줄끝개행보존,모델은정확한JSONprojection이다. 강조는설명위치이지실시간실행줄이아니다. native27CHECK가독립27실험/44전체PASS가되지않게한다.

실제imagegen15종선정과독립검토후JPGnative해상도로ready를올린다. 아직D10image없음/임시PNG또는SVG대체금지. public학생seed이름/테이블키/행수·금액/시점/엔진구분을검수하고오기는실제재생성한다. 새로운D10UI7파일과mainshared4변경은freeze+정식계약후담당을나눈다.

이 초안은 UI-BRIEF.md 정식계약으로 구체화됐으며 이후 실제 범위는 정식 파일이 기준이다.
