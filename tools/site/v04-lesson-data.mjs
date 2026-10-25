// V04 원문·외부 unit·추가 native/Boot/H2 관측을 구분한 최종 deep-snapshot 결과다.
export const v04AssetRoot = '../design/v04-2026-10-20/images/';
export const V04_RUNS = {
  "runtime": {
    "mysql": "8.4.11",
    "machine": "arm64",
    "os": "macos15",
    "sqlMode": "ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
    "autocommit": 1,
    "isolation": "REPEATABLE-READ",
    "timeZone": "+00:00"
  },
  "source": {
    "before": {
      "total": 80,
      "active": "79"
    },
    "after": {
      "total": 80,
      "active": "79"
    },
    "fixtureAfter": {
      "product": 0,
      "category": 0
    }
  },
  "java": {
    "checks": [
      "engine-private-probe-cleaned",
      "engine-same-comparison-mysql-ai-ci-vs-h2-mode",
      "engine-unique-accent-native1062-vs-h2-two",
      "http-committed-row-explicit-cleanup",
      "http-private-loopback-bound",
      "http-server-commit-survives-test-rollback",
      "http-sync-mockmvc-joins-test-thread-tx",
      "http-sync-mockmvc-write-rolled-back-with-test",
      "http-tcp-uses-other-thread-and-transaction",
      "observer-deep-snapshot-preserves-record-time",
      "replace-any-dynamic-is-h2",
      "replace-default-dynamic-keeps-mysql",
      "replace-default-static-is-h2",
      "replace-none-static-keeps-mysql",
      "sql-inferred-fixture-rolled-back",
      "sql-isolated-explicit-child-first-cleanup",
      "sql-isolated-fixture-survives-test-rollback",
      "toy-assigned-id-check-fails-at-flush",
      "toy-beforeall-seed-is-not-test-managed-tx",
      "toy-committed-test-row-explicit-cleanup",
      "toy-default-test-rollback-no-aftercommit",
      "toy-end-commit-fires-once-and-observes-committed-row",
      "toy-flagforcommit-alone-does-not-fire-listener",
      "toy-identity-check-fails-during-persist",
      "toy-no-flush-rollback-has-zero-insert-statements",
      "toy-no-outer-test-tx-lazy-exception",
      "toy-outer-test-tx-hides-lazy-boundary",
      "toy-requiresnew-commit-survives-test-rollback"
    ],
    "facts": {
      "adapter-source-finder-assert-body": {
        "product1Present": true,
        "product80Present": false,
        "engine": {
          "engine": "MySQL",
          "version": "8.4.11",
          "dataSourceClass": "com.zaxxer.hikari.HikariDataSource"
        }
      },
      "adapter-source-page-assert-body": {
        "content": 10,
        "total": 79,
        "pages": 8,
        "idsUnordered": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10
        ]
      },
      "engine-private-probe-cleaned": {
        "mysqlDeletedRows": 1
      },
      "engine-same-comparison-mysql-ai-ci-vs-h2-mode": {
        "mysqlCase": 1,
        "mysqlAccent": 1,
        "h2ModeCase": 0,
        "h2ModeAccent": 0,
        "mysqlColumnCollation": "utf8mb4_0900_ai_ci",
        "h2Settings": "MODE=MySQL;DATABASE_TO_LOWER=TRUE; no IGNORECASE/collation override",
        "caseSql": "SELECT CASE WHEN word='CAFE' THEN 1 ELSE 0 END FROM v04_extra.case_probe WHERE id=1",
        "accentSql": "SELECT CASE WHEN word='café' THEN 1 ELSE 0 END FROM v04_extra.case_probe WHERE id=1"
      },
      "engine-unique-accent-native1062-vs-h2-two": {
        "mysqlError": {
          "type": "java.sql.SQLIntegrityConstraintViolationException",
          "code": 1062,
          "state": "23000"
        },
        "mysqlRows": 1,
        "h2ModeRows": 2,
        "mysqlEngine": {
          "engine": "MySQL",
          "version": "8.4.11",
          "dataSourceClass": "org.springframework.jdbc.datasource.DriverManagerDataSource"
        },
        "h2Engine": {
          "engine": "H2",
          "version": "2.4.240 (2025-09-22)",
          "dataSourceClass": "org.springframework.jdbc.datasource.DriverManagerDataSource"
        }
      },
      "http-committed-row-explicit-cleanup": {
        "deletedServerRows": 1
      },
      "http-private-loopback-bound": {
        "address": "127.0.0.1",
        "portMatchesActualConnector": true,
        "scope": "additional Boot4.1.1/Tomcat11/JDBC H2 app, source OrderHttpTest not executed"
      },
      "http-server-commit-survives-test-rollback": {
        "testMarker100AfterRollback": 0,
        "server201AfterRollback": 1
      },
      "http-sync-mockmvc-joins-test-thread-tx": {
        "sameThread": true,
        "markerSeen": 1,
        "applicationTxActive": true,
        "testManagedTxActive": true,
        "scope": "synchronous dispatcher only, async MVC not tested"
      },
      "http-sync-mockmvc-write-rolled-back-with-test": {
        "marker110AfterRollback": 0,
        "mockmvc211AfterRollback": 0
      },
      "http-tcp-uses-other-thread-and-transaction": {
        "status": 201,
        "serverThreadDifferent": true,
        "uncommittedTestMarkerSeenByServer": 0,
        "serverApplicationTxActive": true,
        "serverTestManagedTxActive": false,
        "testThreadTestTransactionActive": true
      },
      "observer-deep-snapshot-preserves-record-time": {
        "capturedRows": 1,
        "capturedNestedId": 1,
        "originalListAfterClear": 0,
        "originalNestedAfterChange": 99
      },
      "observer-mutable-source": {
        "values": [
          {
            "id": 1
          }
        ]
      },
      "observer-trigger-rewrite": {
        "phase": "after original nested mutation and list clear"
      },
      "replace-any-dynamic-is-h2": {
        "engine": "H2",
        "version": "2.4.240 (2025-09-22)",
        "dataSourceClass": "org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseFactory$EmbeddedDataSourceProxy",
        "replace": "ANY"
      },
      "replace-default-dynamic-keeps-mysql": {
        "engine": "MySQL",
        "version": "8.4.11",
        "dataSourceClass": "com.zaxxer.hikari.HikariDataSource",
        "origin": "DynamicPropertySource URL, not Testcontainers"
      },
      "replace-default-static-is-h2": {
        "engine": "H2",
        "version": "2.4.240 (2025-09-22)",
        "dataSourceClass": "org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseFactory$EmbeddedDataSourceProxy",
        "annotationDefault": "NON_TEST"
      },
      "replace-none-static-keeps-mysql": {
        "engine": "MySQL",
        "version": "8.4.11",
        "dataSourceClass": "com.zaxxer.hikari.HikariDataSource",
        "replace": "NONE"
      },
      "sql-inferred-fixture-rolled-back": {
        "activeBeforeEnd": true,
        "productAfterRollback": 0,
        "categoryAfterRollback": 0
      },
      "sql-isolated-explicit-child-first-cleanup": {
        "deletedProduct": 1,
        "deletedCategory": 1,
        "productAfterCleanup": 0
      },
      "sql-isolated-fixture-survives-test-rollback": {
        "productAfterTestRollback": 1,
        "categoryAfterTestRollback": 1
      },
      "toy-assigned-id-check-fails-at-flush": {
        "beforeFlushHibernatePrepared": 0,
        "afterFlushHibernatePrepared": 1,
        "error": {
          "type": "org.h2.jdbc.JdbcSQLIntegrityConstraintViolationException",
          "code": 23513,
          "state": "23513"
        },
        "rowsAfterRollback": 0
      },
      "toy-beforeall-seed-is-not-test-managed-tx": {
        "beforeAllTestTransactionActive": false,
        "committedSeedOrder": 1,
        "committedSeedLine": 101
      },
      "toy-committed-test-row-explicit-cleanup": {
        "deletedRows": 1,
        "remainingRows": 0
      },
      "toy-default-test-rollback-no-aftercommit": {
        "callsBeforeEnd": 0,
        "callsAfterRollback": 0,
        "rowsAfterRollback": 0
      },
      "toy-end-commit-fires-once-and-observes-committed-row": {
        "calls": [
          {
            "id": 72,
            "independentConnectionRows": 1
          }
        ],
        "rowsAfterEnd": 1
      },
      "toy-flagforcommit-alone-does-not-fire-listener": {
        "activeAfterFlagBeforeEnd": true,
        "callsAfterFlagBeforeEnd": 0
      },
      "toy-identity-check-fails-during-persist": {
        "hibernatePreparedAtPersist": 1,
        "error": {
          "type": "org.h2.jdbc.JdbcSQLIntegrityConstraintViolationException",
          "code": 23513,
          "state": "23513"
        },
        "rowsAfterRollback": 0
      },
      "toy-no-flush-rollback-has-zero-insert-statements": {
        "negativeAmount": -1,
        "hibernatePreparedBeforeRollback": 0,
        "rowsAfterRollback": 0,
        "scope": "passing persist call alone did not test DB CHECK"
      },
      "toy-no-outer-test-tx-lazy-exception": {
        "testTransactionActive": false,
        "initializedBeforeSize": false,
        "error": "LazyInitializationException",
        "hibernatePreparedStatements": 1
      },
      "toy-outer-test-tx-hides-lazy-boundary": {
        "testTransactionActive": true,
        "initializedBeforeSize": false,
        "lines": 1,
        "hibernatePreparedStatements": 2,
        "scope": "additional H2 model/service, no DTO/HTTP"
      },
      "toy-requiresnew-commit-survives-test-rollback": {
        "outer74AfterRollback": 0,
        "inner73AfterOuterRollback": 1
      }
    }
  },
  "junit": [
    {
      "class": "com.example.practice.product.DefaultDynamicReplaceTest",
      "method": "dynamicUrlDefaultNonTestKeepsMySQL()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.DefaultStaticReplaceTest",
      "method": "staticUrlDefaultNonTestUsesH2()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.ExplicitAnyReplaceTest",
      "method": "explicitAnyReplacesDynamicWithH2()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.ExplicitNoneReplaceTest",
      "method": "explicitNoneKeepsStaticMySQL()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.NativeAdapterTest",
      "method": "countsActiveProductsWithMysql()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.NativeAdapterTest",
      "method": "excludesSoftDeletedProduct()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.ProductServiceUnitTest",
      "method": "mapsPageAndDelegatesPageable()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.ProductServiceUnitTest",
      "method": "mapsResponseAndThrowsForMissingProduct()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.SqlFixtureTest",
      "method": "inferredJoinsTestRollback()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "com.example.practice.product.SqlFixtureTest",
      "method": "isolatedCommitNeedsCleanup()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.extra.EngineDifferentialTest",
      "method": "mysqlModeDoesNotCopyMysqlCollation()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.http.HttpBoundaryTest",
      "method": "actualTcpServerCommitEscapesTestRollback()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.http.HttpBoundaryTest",
      "method": "synchronousMockMvcSharesTestTransaction()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.support.ObservationSnapshotTest",
      "method": "storesValueAtObservationTime()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "explicitFlushExposesAssignedIdConstraint()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "flagForCommitWaitsForEndAndListenerObservesCommit()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "identityNeedsInsertDuringPersist()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "noFlushRollbackNeverChecksDeferredConstraint()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "outerTestTransactionKeepsLazyOpen()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "requiresNewEscapesOuterTestRollback()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "rollbackDoesNotInvokeAfterCommit()",
      "passed": true,
      "skipped": false
    },
    {
      "class": "v04.toy.ToyTransactionTest",
      "method": "serviceAloneClosesLazyContext()",
      "passed": true,
      "skipped": false
    }
  ],
  "checks": [
    "private-native-mysql8.4.11",
    "source-seed-products80-active79",
    "private-http-server-stopped",
    "java-explicit-checks-match-stdout",
    "java-check-and-fact-ids-cover-declared-probes",
    "junit-exact22-cases-in11-expected-classes",
    "junit-all-discovered-cases-pass-no-skips",
    "source-tc-class-not-run",
    "source-seed-row-counts-preserved-fixture-cleaned"
  ]
};
export const v04Run=path=>path.split('.').reduce((object,key)=>object?.[key],V04_RUNS);
const fact=id=>'java.facts.'+id;
const stage=(topic,id,title,lead,code,values,checks=[],runKeys=[],extra={})=>({id:topic+'-'+id,title,lead,code,values,checks,runKeys,active:[0],image:'V04-'+topic,...extra});
const limits='원문 Testcontainers·ServiceConnection·OrderHttpTest와 학습자 상품 API·MySQL HTTP·Java25는 실행하지 않았습니다.';
const toyNote='LearnOrder·DeferredProbe·IdentityProbe·event_probe는 원문 상품 모델과 다른 추가 H2 toy입니다. Hibernate prepared counter는 observer JDBC 문장을 포함하지 않습니다.';
export const V04_LESSONS=[
{id:'unit',question:'DB 없는 Service unit은 무엇을 확인했을까?',source:'외부 study 원본 ProductServiceUnitTest2 · 직접 new Service/mock Repository',sourceNote:'원본 unit2는 실제 JUnit PASSED입니다. SQL·Spring proxy·DB 엔진·HTTP 상태를 검증한 테스트가 아닙니다.',note:'응답에서 assertion한 id·name·price와 page/items/totalPages만 표시합니다. mock page의 totalElements는 표시하지 않습니다.',stages:[
 stage('unit','dto','id7·키보드·9700과 없는id404','원본 unit은 mock Product id7을 키보드·가격9700으로 매핑했습니다. 별도 조회id404는 ProductNotFoundException이며 여기서404는 HTTP 상태 코드가 아닙니다.','ProductResponse response = service.getById(7L);\n// 별도 원본 assertion 대상\nservice.getById(404L);',[['원본 unit 결과','JUnit PASSED'],['assertion한 응답','id=7 / name=키보드 / price=9700'],['없는 조회 입력','product id404 · HTTP status 아님'],['예외','ProductNotFoundException: Product 404 was not found']],[],['junit.7'],{active:[0,2]}),
 stage('unit','page','page2·size2의 items21·22','원본 mock page unit은 service.getPage(2,2)를 호출해 items21·22와 page2·totalPages3, Repository에 page/size가 같은 Pageable 전달(equals 비교)을 확인했습니다. SQL 페이지 결과는 아닙니다.','ProductPageResponse response = service.getPage(2, 2);\nverify(repository).findAllByDeletedAtIsNull(request);',[['원본 unit 결과','JUnit PASSED'],['page / size','2 / 2'],['assertion한 items id','[21,22]'],['assertion한 totalPages','3'],['호출 검증','동일 page/size 값의 Pageable 전달 · equals 비교']],[],['junit.6'],{active:[0,1]}),
]},
{id:'replace',question:'DataJpaTest는 항상 H2로 바꿀까?',source:'추가 Boot4.1.1 DataJpaTest 교체4조건 · ddl-auto=none',sourceNote:'원문의 항상 교체 설명을 보충합니다. Boot4.1.1 default는 NON_TEST이며 recognized test DB는 예외입니다. 여기의 dynamic URL은 DynamicPropertySource이지 Testcontainers가 아닙니다.',note:'네 조건 모두 자동 구성 DataSource와 ddl-auto=none으로 실제 엔진을 확인했습니다. 테스트 DB 교체를 Container/ServiceConnection 실행 성공으로 일반화하지 않습니다. '+limits,stages:[
 stage('replace','static','default NON_TEST·static은 H2','일반 static URL을 지정한 추가 slice에서 default annotation 값은 NON_TEST였습니다. 이 조건의 실제 DataSource는 H2로 교체됐습니다.','@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=none"})\n// 추가 static datasource URL 조건',[['default replace','NON_TEST'],['연결 정보 기원','static URL'],['실제 엔진','H2 2.4.240'],['DDL 정책','none · 엔진 확인 전에 DDL 실행 안 함']],['replace-default-static-is-h2'],[fact('replace-default-static-is-h2')]),
 stage('replace','dynamic','default·dynamic은 MySQL 유지','별도 DynamicPropertySource URL 조건에서는 default NON_TEST가 MySQL8.4.11을 유지했습니다. 원문의 모든 embedded 교체 설명을 이 예외와 구분합니다.','// 추가 DefaultDynamicReplaceTest extends NativeProperties\n@DataJpaTest(properties={"spring.jpa.hibernate.ddl-auto=none"})',[['default replace','NON_TEST'],['연결 정보 기원','DynamicPropertySource URL'],['실제 엔진','MySQL8.4.11 유지'],['실행하지 않은 경로','Testcontainers/ServiceConnection']],['replace-default-dynamic-keeps-mysql'],[fact('replace-default-dynamic-keeps-mysql')]),
 stage('replace','none','NONE·static은 MySQL 유지','같은 static URL 조건이라도 explicit NONE은 교체를 끕니다. 추가 slice는 private MySQL8.4.11로 연결됐습니다.','@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.NONE)',[['명시 replace','NONE'],['연결 정보 기원','static URL'],['실제 엔진','MySQL8.4.11 유지']],['replace-none-static-keeps-mysql'],[fact('replace-none-static-keeps-mysql')]),
 stage('replace','any','ANY·dynamic은 H2로 교체','다른 추가 slice는 explicit ANY로 dynamic URL까지 교체했습니다. 이 조건의 실제 엔진은 H2이며 default NON_TEST 사례와 다릅니다.','@AutoConfigureTestDatabase(replace=AutoConfigureTestDatabase.Replace.ANY)',[['명시 replace','ANY'],['연결 정보 기원','DynamicPropertySource URL'],['실제 엔진','H2 2.4.240']],['replace-any-dynamic-is-h2'],[fact('replace-any-dynamic-is-h2')]),
]},
{id:'fixtures',question:'원문 assert body와 Sql fixture는 어디서 실행했을까?',source:'원문 Repository assert body2 + 추가 native adapter/@Sql',sourceNote:'원문 TC class 전체 실행이 아니라 assert body2를 복사한 추가 native adapter입니다. PageRequest는 정렬을 지정하지 않았고 idsUnordered는 관찰기가 membership만 정렬 기록한 값입니다.',note:'SQL9001은 원문 그대로입니다. INFERRED와 ISOLATED의 정리 경계를 구분하며 context cache가 DB 행을 삭제한다고 표시하지 않습니다. '+limits,stages:[
 stage('fixtures','adapter','native adapter는10·79·8 확인','추가 MySQL adapter는 원문 assert body에서 page content10·total79·pages8과 id1 present/id80 active finder empty를 확인했습니다. 원본 seed는 총80·active79입니다.','Page<Product> page = productRepository.findAllByDeletedAtIsNull(PageRequest.of(0, 10));\nassertThat(page.getContent()).hasSize(10);\nassertThat(page.getTotalElements()).isEqualTo(79);\nassertThat(page.getTotalPages()).isEqualTo(8);',[['추가 adapter 결과','content10 / total79 / pages8'],['active finder','id1 present=true / id80 present=false'],['seed 행 수','total80 / active79'],['정렬 한계','SQL ORDER BY 보장 아님 · idsUnordered는 membership 관측']],['private-native-mysql8.4.11','source-seed-products80-active79'],[fact('adapter-source-page-assert-body'),fact('adapter-source-finder-assert-body'),'source.before'],{active:[0,1,2,3]}),
 stage('fixtures','source','원문9001은 부모부터 추가','원문 fixture SQL은 category9001을 먼저, 이를 참조하는 product9001을 뒤에 INSERT합니다. 추가 @Sql 실험은 이 파일을 그대로 사용했습니다.',"INSERT INTO category (id, name, depth, sort_order, created_at, updated_at)\nVALUES (9001, '테스트 분류', 1, 1, '2026-09-01 00:00:00', '2026-09-01 00:00:00');\nINSERT INTO product (id, category_id, name, product_type, price, stock, sale_status, created_at, updated_at)\nVALUES (9001, 9001, '테스트 상품', 'GOODS', 12000, 3, 'ON_SALE', '2026-09-01 00:00:00', '2026-09-01 00:00:00');",[['원문 부모','category id9001'],['원문 자식','product id9001 / category_id9001'],['구분','원문 SQL 그대로 · 추가 native @Sql 실행']],[],[fact('sql-inferred-fixture-rolled-back'),fact('sql-isolated-fixture-survives-test-rollback')],{active:[0,1,2,3]}),
 stage('fixtures','inferred','INFERRED는 테스트 rollback에 참여','추가 @Sql의 기본 INFERRED fixture는 테스트 transaction 안에서 보였습니다. TestTransaction.end의 rollback 뒤 product9001·category9001은 모두0건입니다.','@Sql("/sql/product-fixture.sql")\n// 추가 test의 확인 뒤\nTestTransaction.end();',[['end 전 test transaction','active=true'],['rollback 뒤 product9001','0'],['rollback 뒤 category9001','0']],['sql-inferred-fixture-rolled-back'],[fact('sql-inferred-fixture-rolled-back')],{active:[0,2]}),
 stage('fixtures','isolated','ISOLATED는 남아서 자식부터 정리','추가 ISOLATED fixture는 테스트 rollback 뒤 product·category가 각각1건 남았습니다. product→category 순서로 각1행 DELETE했고 최종9001 두 테이블은0입니다.','@Sql(scripts="/sql/product-fixture.sql",config=@SqlConfig(transactionMode=SqlConfig.TransactionMode.ISOLATED))\n// 추가 test에서 바깥 rollback 뒤 정리\nint deletedProduct = jdbc.update("DELETE FROM product WHERE id=9001");\nint deletedCategory = jdbc.update("DELETE FROM category WHERE id=9001");',[['test rollback 뒤 product / category','1 / 1'],['명시 cleanup 순서','product → category'],['실제 DELETE 영향 행 수','1 / 1'],['최종9001 product / category','0 / 0']],['sql-isolated-fixture-survives-test-rollback','sql-isolated-explicit-child-first-cleanup','source-seed-row-counts-preserved-fixture-cleaned'],[fact('sql-isolated-fixture-survives-test-rollback'),fact('sql-isolated-explicit-child-first-cleanup'),'source.fixtureAfter','source.after'],{active:[0,2,3]}),
]},
{id:'dialect',question:'H2 MODE=MySQL이면 같은 문자열 결과일까?',source:'추가 case_probe · MySQL ai_ci / H2 MODE=MySQL',sourceNote:'같은 cafe/CAFE/café 입력을 비교한 별도 schema입니다. H2는 MODE=MySQL;DATABASE_TO_LOWER=TRUE이고 IGNORECASE/collation override는 없습니다.',note:'이 설정의 차이를 모든 H2 설정·모든 SQL 방언·잠금·성능으로 일반화하지 않습니다.',stages:[
 stage('dialect','compare','MySQL1/1·이 H2모드0/0','cafe 행을 넣고 CAFE·café와 각각 비교했습니다. MySQL utf8mb4_0900_ai_ci는 두 비교1, H2 모드 기본 문자열 비교는 두 값 모두0입니다.',"SELECT CASE WHEN word='CAFE' THEN 1 ELSE 0 END FROM v04_extra.case_probe WHERE id=1;\nSELECT CASE WHEN word='café' THEN 1 ELSE 0 END FROM v04_extra.case_probe WHERE id=1;",[['저장한 입력','cafe'],['MySQL case / accent 비교','1 / 1'],['H2 mode case / accent 비교','0 / 0'],['MySQL column collation','utf8mb4_0900_ai_ci']],['engine-same-comparison-mysql-ai-ci-vs-h2-mode'],[fact('engine-same-comparison-mysql-ai-ci-vs-h2-mode')],{active:[0,1]}),
 stage('dialect','unique','café UNIQUE는1062와2행으로 갈림','같은 cafe 뒤 café를 UNIQUE 컬럼에 넣었습니다. native MySQL은1062로 거부해1행이고 이 H2 모드는 받아2행입니다. 추가 native probe는 끝에1행 삭제했습니다.',"INSERT INTO v04_extra.case_probe VALUES(2,'café');",[['MySQL 결과','1062 / rowcount1'],['이 H2모드 결과','accepted / rowcount2'],['명시 native probe 정리','DELETE1 · 이 추가 probe만']],['engine-unique-accent-native1062-vs-h2-two','engine-private-probe-cleaned'],[fact('engine-unique-accent-native1062-vs-h2-two'),fact('engine-private-probe-cleaned')]),
]},
{id:'lazy',question:'테스트 transaction이 lazy 실패를 숨겼을까?',source:'추가 H2 LearnOrder1/LearnLine101 · service REQUIRED',sourceNote:toyNote+' @BeforeAll seed는 TestTransaction 비활성 상태에서 별도 commit했습니다.',note:'테스트의 바깥 transaction 유무만 나눈 추가 도메인입니다. 실제 상품·주문 API·OSIV·DTO를 검증한 결과가 아닙니다.',stages:[
 stage('lazy','outer','바깥 test transaction이면 size1','추가 service.getEntity(1) 반환 때 컬렉션은 미초기화였지만 바깥 테스트 transaction이 유지돼 getLines().size()가1입니다. Hibernate prepared는2문장이었습니다.','LearnOrder order = service.getEntity(1);\nboolean before = Hibernate.isInitialized(order.getLines());\nint n = order.getLines().size();',[['바깥 TestTransaction','active=true'],['size 전 컬렉션','미초기화'],['size 결과','1'],['Hibernate prepared statements','2 · observer JDBC 제외']],['toy-beforeall-seed-is-not-test-managed-tx','toy-outer-test-tx-hides-lazy-boundary'],[fact('toy-beforeall-seed-is-not-test-managed-tx'),fact('toy-outer-test-tx-hides-lazy-boundary')],{active:[0,1,2]}),
 stage('lazy','closed','바깥 없으면 서비스 종료 뒤 예외','다른 추가 test는 바깥 test transaction을 비활성화했습니다. service REQUIRED 종료 뒤 컬렉션 접근은 LazyInitializationException이고 Hibernate prepared는1문장이었습니다.','@Transactional(propagation=Propagation.NOT_SUPPORTED)\n// 추가 test의 서비스 반환 뒤 order.getLines().size()',[['바깥 TestTransaction','active=false'],['size 전 컬렉션','미초기화'],['관측 예외','LazyInitializationException'],['Hibernate prepared statements','1 · observer JDBC 제외']],['toy-no-outer-test-tx-lazy-exception'],[fact('toy-no-outer-test-tx-lazy-exception')]),
]},
{id:'flush',question:'persist 통과만으로 DB CHECK도 검증했을까?',source:'추가 H2 DeferredProbe / IdentityProbe · Hibernate 준비문장 계수',sourceNote:toyNote+' Product의 생성자·세터를 새로 만든 예제가 아닙니다.',note:'세 경우는 별도 test입니다. 같은 -1 입력이라도 키 전략과 flush 시점이 다르며 모든 save 호출로 일반화하지 않습니다.',stages:[
 stage('flush','none','81을 persist 후 flush없이 rollback','assigned id81·amount-1을 persist한 뒤 명시 flush 없이 테스트를 rollback했습니다. Hibernate 준비문장0·DB행0이어서 이 persist 통과는 DB CHECK 통과 증거가 아닙니다.','em.persist(new DeferredProbe(81,-1));\nlong statements = sf.getStatistics().getPrepareStatementCount();\nTestTransaction.end();',[['추가 입력','DeferredProbe id81 / amount=-1'],['rollback 전 Hibernate prepared','0'],['rollback 뒤 DB 행','0'],['검증한 범위','DB CHECK 실행 검증 아님']],['toy-no-flush-rollback-has-zero-insert-statements'],[fact('toy-no-flush-rollback-has-zero-insert-statements')],{active:[0,2]}),
 stage('flush','explicit','82는 explicit flush에서23513','별도 assigned id82·amount-1을 persist한 뒤 flush했습니다. 준비문장0→1에서 H2 CHECK23513을 확인했고 rollback 뒤 해당 행은0입니다.','em.persist(new DeferredProbe(82,-1));\nem.flush(); // 추가 test가 PersistenceException을 검증\nTestTransaction.end();',[['추가 입력','DeferredProbe id82 / amount=-1'],['Hibernate prepared 전 → 후','0 → 1'],['관측 DB 오류','H2 CHECK23513'],['rollback 뒤 DB 행','0']],['toy-assigned-id-check-fails-at-flush'],[fact('toy-assigned-id-check-fails-at-flush')],{active:[0,1,2]}),
 stage('flush','identity','IDENTITY는 persist 중23513','추가 IdentityProbe(-1)는 persist 호출 중 준비문장1과 H2 CHECK23513을 관찰했습니다. rollback 뒤 행은0이며 할당된 id 값은 측정하지 않았습니다.','em.persist(new IdentityProbe(-1));\n// 추가 test가 persist 시점 PersistenceException을 검증',[['추가 입력','IdentityProbe amount=-1'],['persist 시 Hibernate prepared','1'],['관측 DB 오류','H2 CHECK23513'],['rollback 뒤 DB 행','0'],['할당 id','미측정 · 임의 숫자 표시 안 함']],['toy-identity-check-fails-during-persist'],[fact('toy-identity-check-fails-during-persist')]),
]},
{id:'events',question:'flagForCommit과 end는 같은 시점일까?',source:'추가 H2 event_probe / 독립 연결 RowListener',sourceNote:'listener는 메일·결제를 보내지 않고 독립 connection의 행 수만 읽는 추가 관찰자입니다.',note:'관찰기 회귀·메타 ASSERT는 접힌 증거에만 둡니다. DB commit 관찰과 외부 전달 보장을 구분합니다.',stages:[
 stage('events','rollback','기본 rollback71은 호출0·행0','추가 테스트가 row71 INSERT와 이벤트를 발행한 뒤 기본 rollback했습니다. end 전에도0, rollback 뒤에도 listener0·DB행0입니다.','jdbc.update("INSERT INTO event_probe VALUES(71)");\npublisher.publishEvent(new ToyConfig.Created(71));\nTestTransaction.end();',[['테스트 종료 방식','기본 rollback'],['end 전 / 후 calls','0 / 0'],['rollback 뒤 row71','0']],['toy-default-test-rollback-no-aftercommit'],[fact('toy-default-test-rollback-no-aftercommit')],{active:[0,1,2]}),
 stage('events','flag','flag만 하면 active·calls0','추가 row72 test에서 flagForCommit만 호출한 시점은 아직 active=true이며 listener0입니다. 종료하거나 commit을 완료한 단계가 아닙니다.','TestTransaction.flagForCommit();\n// active/calls를 확인한 뒤 다음 단계에서 end',[['flag 직후 TestTransaction','active=true'],['flag 직후 calls','0'],['아직 수행 전','TestTransaction.end']],['toy-flagforcommit-alone-does-not-fire-listener'],[fact('toy-flagforcommit-alone-does-not-fire-listener')]),
 stage('events','end','end 뒤 calls72·독립행1','TestTransaction.end가 commit한 뒤 listener는 id72를 한 번 기록했고 별도 연결에서1행을 읽었습니다. 기록한 calls는id72/independentConnectionRows1입니다.','TestTransaction.end();',[['최종 listener calls','[{id:72,independentConnectionRows:1}]'],['rowsAfterEnd','1'],['의미','실제 commit 후 독립 연결 관찰 · 알림 전송 아님']],['toy-end-commit-fires-once-and-observes-committed-row','observer-deep-snapshot-preserves-record-time'],[fact('toy-end-commit-fires-once-and-observes-committed-row'),fact('observer-deep-snapshot-preserves-record-time')]),
 stage('events','cleanup','commit된72는 명시 DELETE','추가 row72는 commit됐으므로 별도 cleanup을 실행했습니다. DELETE 영향1과 remainingRows0을 직접 관찰했습니다.','int cleaned = jdbc.update("DELETE FROM event_probe WHERE id=72");',[['명시 DELETE 영향 행 수','1'],['remainingRows','0'],['자동 rollback과 구분','이 행은 commit 뒤 별도 삭제']],['toy-committed-test-row-explicit-cleanup'],[fact('toy-committed-test-row-explicit-cleanup')]),
]},
{id:'requiresnew',question:'안쪽 REQUIRES_NEW도 테스트 rollback이 지울까?',source:'추가 H2 TransactionTemplate · inner73/outer74',sourceNote:'추가 inner TransactionTemplate을 REQUIRES_NEW로 설정한 한 test입니다. 연결 개수·잠금·pool 대기·HTTP를 측정한 사례가 아닙니다.',note:'이 test는 관찰 뒤 DELETE73을 실행했지만 DELETE 영향 행 수·삭제 뒤 최종0은 별도 관측하지 않았습니다.',stages:[
 stage('requiresnew','survives','outer74는0·inner73은1','바깥 테스트 transaction의74와 독립 inner commit의73을 만들었습니다. 바깥 rollback 뒤 관찰은74=0·73=1이며 이후73 DELETE 호출은 결과 계측과 구분합니다.','jdbc.update("INSERT INTO event_probe VALUES(74)");\nvar inner = new TransactionTemplate(tm);\ninner.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);\ninner.executeWithoutResult(s -> jdbc.update("INSERT INTO event_probe VALUES(73)"));\nTestTransaction.end();',[['바깥 rollback 뒤 outer74','0'],['바깥 rollback 뒤 inner73','1'],['후속 cleanup','DELETE73 실행 · 영향/최종0 별도미측정']],['toy-requiresnew-commit-survives-test-rollback'],[fact('toy-requiresnew-commit-survives-test-rollback')],{active:[1,2,3]}),
]},
{id:'http',question:'추가 실제 TCP와 동기 MockMvc는 같은 transaction일까?',source:'추가 Boot4.1.1/JDBC/H2 toy app · 실제 Tomcat TCP / 동기 MockMvc',sourceNote:'이번에는 추가 Boot 앱·실제 TCP201을 실행했습니다. 원문 OrderHttpTest·학습자 상품 쓰기 API·MySQL HTTP·async MVC 실행 결과가 아닙니다.',note:'실제 source response/threadID/port 원자료는 따로 보존하고 frozen에는 관찰한 same/different·flag·행 수를 기록합니다.',stages:[
 stage('http','tcp','실제 TCP201은 다른 thread','추가 테스트의 미커밋 marker100을 서버는0개로 읽었습니다. 실제 TCP POST는 다른 worker에서 status201·TestManagedTx=false·ApplicationTx=true로 실행됐습니다.','HttpResponse<String> response = client.send(\n    HttpRequest.newBuilder(URI.create(url)).POST(HttpRequest.BodyPublishers.noBody()).build(),\n    HttpResponse.BodyHandlers.ofString());',[['추가 실제 TCP 상태','201'],['서버 thread','test thread와 다름'],['서버 TestManagedTx / ApplicationTx','false / true'],['test thread TestTransaction','active=true'],['서버가 본 미커밋 marker100','0']],['http-private-loopback-bound','http-tcp-uses-other-thread-and-transaction'],[fact('http-private-loopback-bound'),fact('http-tcp-uses-other-thread-and-transaction')],{active:[0,1,2]}),
 stage('http','rollback','test rollback 뒤 서버201은 남음','테스트 rollback 뒤 marker100은0이지만 서버가 별도 commit한 row201은1이었습니다. 이후 명시 DELETE는1행이며 실제 private HTTP socket 종료도 확인했습니다.','TestTransaction.end();\nint deleted = jdbc.update("DELETE FROM http_probe WHERE id=201");',[['test rollback 뒤 marker100','0'],['test rollback 뒤 서버 row201','1'],['명시 DELETE 영향 행 수','1'],['서버 연결 범위','추가127.0.0.1 actual connector · 종료 확인']],['http-server-commit-survives-test-rollback','http-committed-row-explicit-cleanup','private-http-server-stopped'],[fact('http-server-commit-survives-test-rollback'),fact('http-committed-row-explicit-cleanup')],{active:[0,1]}),
 stage('http','mockmvc','동기 MockMvc는 같은 thread·같은 test TX','추가 동기 MockMvc도 status201이지만 같은 thread·TestManagedTx=true입니다. 미커밋 marker110을1개로 보고 test rollback 뒤 marker110과 쓰기211은 모두0입니다.','mvc.perform(post("/v04/probe").param("id","211").param("marker","110"))\n    .andExpect(status().isCreated());\nTestTransaction.end();',[['추가 동기 MockMvc 상태','201'],['thread','test thread와 같음'],['TestManagedTx / ApplicationTx','true / true'],['같은 호출이 본 marker110','1'],['test rollback 뒤 marker110 / write211','0 / 0'],['범위','동기 dispatcher · async MVC 아님']],['http-sync-mockmvc-joins-test-thread-tx','http-sync-mockmvc-write-rolled-back-with-test'],[fact('http-sync-mockmvc-joins-test-thread-tx'),fact('http-sync-mockmvc-write-rolled-back-with-test')],{active:[0,1,2]}),
]},
{id:'containers',question:'원문 Testcontainers class는 어디까지 검증됐을까?',source:'원문 complete TC Java compile-only / 추가 native·H2·Boot 실행 범위',sourceNote:'Docker socket은 접속거부였고 TC·ServiceConnection·container lifetime은 실행하지 않았습니다. 원문 전체 class는 변경 없이 컴파일만 통과했습니다.',note:'static class 범위 공유·container Bean context 수명·reuse는 문헌 설명이며 이 실행에서 runtime 검증한 항목이 아닙니다. 메타 ASSERT/JUnit/facts는 겹치는 검증 단위입니다. '+limits,stages:[
 stage('containers','compile','원문 TC는 compile-only','원문 @Testcontainers/@ServiceConnection ProductRepositoryTest는 그대로 compile됐고 실행되지는 않았습니다. 별도로 원본 unit2·추가 native adapter·H2/Boot toy가 실행됐습니다.','@Testcontainers\n@DataJpaTest(properties = {"spring.sql.init.mode=always",\n        "spring.sql.init.schema-locations=file:../schema/schema.sql,file:../schema/seed.sql"})\n@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)\n// 원문 full class compile-only · container 미시작',[['원문 complete TC Java','compile PASS / runtime 미실행'],['추가 실행 범위','원본 unit2·native adapter·교체/H2 toy·실제 TCP/동기MockMvc'],['Docker / ServiceConnection','미실행']],['source-tc-class-not-run','java-explicit-checks-match-stdout','java-check-and-fact-ids-cover-declared-probes','junit-exact22-cases-in11-expected-classes','junit-all-discovered-cases-pass-no-skips'],['checks','java.checks','junit'],{active:[0,1,2]}),
 stage('containers','lifetime','수명 설명은 문헌 경계','static @Container의 클래스 공유, Boot container Bean의 context 수명, reusable의 잔존 특성은 원문 문헌 설명입니다. 이번 Docker/TC lifetime을 실행한 화면이 아닙니다.','// 원문 complete TC class의 선언\n@Container @ServiceConnection\nstatic final MySQLContainer mysql = new MySQLContainer("mysql:8.4")\n    .withDatabaseName("ds_practice").withUsername("practice").withPassword("practice");',[['static @Container','클래스 내 공유 · 이번 실행 검증 아님'],['container Bean','Spring context 수명 · 이번 실행 검증 아님'],['reusable','원문 문헌 설명 · runtime 미실행']],[],['checks'],{active:[1,2]}),
]},
];
export const V04_ASSETS={
  "V04-unit": {
    "file": "V04-unit-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "unit · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "unit-dto": [
        3,
        18,
        50,
        68
      ],
      "unit-page": [
        54,
        18,
        43,
        68
      ]
    }
  },
  "V04-replace": {
    "file": "V04-replace.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "replace · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "replace-static": [
        10,
        23,
        83,
        18
      ],
      "replace-dynamic": [
        10,
        40,
        83,
        10
      ],
      "replace-none": [
        10,
        49,
        83,
        10
      ],
      "replace-any": [
        10,
        58,
        83,
        10
      ]
    }
  },
  "V04-fixtures": {
    "file": "V04-fixtures-v2.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "fixtures · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "fixtures-adapter": [
        2,
        14,
        27,
        70
      ],
      "fixtures-source": [
        29,
        14,
        24,
        47
      ],
      "fixtures-inferred": [
        29,
        14,
        24,
        70
      ],
      "fixtures-isolated": [
        53,
        14,
        46,
        70
      ]
    }
  },
  "V04-dialect": {
    "file": "V04-dialect-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "dialect · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "dialect-compare": [
        11,
        18,
        79,
        34
      ],
      "dialect-unique": [
        11,
        52,
        79,
        34
      ]
    }
  },
  "V04-lazy": {
    "file": "V04-lazy-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "lazy · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "lazy-outer": [
        3,
        16,
        47,
        64
      ],
      "lazy-closed": [
        51,
        16,
        47,
        64
      ]
    }
  },
  "V04-flush": {
    "file": "V04-flush-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "flush · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "flush-none": [
        1,
        18,
        35,
        52
      ],
      "flush-explicit": [
        36,
        18,
        33,
        52
      ],
      "flush-identity": [
        69,
        18,
        30,
        52
      ]
    }
  },
  "V04-events": {
    "file": "V04-events-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "events · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "events-rollback": [
        1,
        11,
        43,
        65
      ],
      "events-flag": [
        44,
        11,
        20,
        65
      ],
      "events-end": [
        63,
        11,
        28,
        65
      ],
      "events-cleanup": [
        77,
        20,
        22,
        55
      ]
    }
  },
  "V04-requiresnew": {
    "file": "V04-requiresnew-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "requiresnew · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "requiresnew-survives": [
        2,
        16,
        96,
        63
      ]
    }
  },
  "V04-http": {
    "file": "V04-http-v3.jpg",
    "width": 1673,
    "height": 940,
    "ready": true,
    "alt": "http · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "http-tcp": [
        5,
        19,
        45,
        72
      ],
      "http-rollback": [
        5,
        51,
        45,
        40
      ],
      "http-mockmvc": [
        51,
        19,
        47,
        72
      ]
    }
  },
  "V04-containers": {
    "file": "V04-containers.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "containers · 원문 compile-only·원본 unit과 추가 native/H2/Boot TCP·MockMvc 관측 범위 구분",
    "focus": {
      "containers-compile": [
        2,
        13,
        96,
        50
      ],
      "containers-lifetime": [
        13,
        70,
        80,
        21
      ]
    }
  }
};
