// 원문 모델과 추가 ProbePost·버전별 관측을 구분한 S09 학습 데이터다.
export const s09AssetRoot = '../design/s09-2026-10-20/images/';
export const S09_SQL_PHASES = {
  "seedPersistSql": [],
  "seedFlushSql": [
    "insert into probe_post (title,version,id) values (?,?,?)"
  ],
  "seedCommitSql": [],
  "firstFindSql": [
    "select pp1_0.id,pp1_0.title,pp1_0.version from probe_post pp1_0 where pp1_0.id=?"
  ],
  "secondFindSql": [],
  "setterSql": [],
  "dirtyFlushSql": [
    "update probe_post set title=?,version=? where id=? and version=?"
  ],
  "dirtyCommitSql": [],
  "mergeReadSql": [
    "select pp1_0.id,pp1_0.title,pp1_0.version from probe_post pp1_0 where pp1_0.id=?"
  ],
  "mergeCommitSql": [
    "update probe_post set title=?,version=? where id=? and version=?"
  ],
  "removeScheduleSql": [],
  "removeFlushSql": [
    "delete from probe_post where id=? and version=?"
  ],
  "removeCommitSql": [],
  "batchRootSql": [
    "select po1_0.id,po1_0.version from PurchaseOrder po1_0 order by po1_0.id"
  ],
  "batchCollectionSql": [
    "select l1_0.order_id,l1_0.id,l1_0.quantity from order_line l1_0 where l1_0.order_id in (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) order by l1_0.id"
  ],
  "originalFetchJoinSql": [
    "select distinct po1_0.id,l1_0.order_id,l1_0.id,l1_0.quantity,po1_0.version from PurchaseOrder po1_0 left join order_line l1_0 on po1_0.id=l1_0.order_id order by po1_0.id,l1_0.id"
  ],
  "fetchJoinAccessSql": [],
  "extraFetchGraphSql": [
    "select po1_0.id,l1_0.order_id,l1_0.id,l1_0.quantity,po1_0.version from PurchaseOrder po1_0 left join order_line l1_0 on po1_0.id=l1_0.order_id order by po1_0.id,l1_0.id"
  ],
  "fetch-api-max1Sql": [
    "select distinct po1_0.id,l1_0.order_id,l1_0.id,l1_0.quantity,po1_0.version from PurchaseOrder po1_0 left join order_line l1_0 on po1_0.id=l1_0.order_id order by po1_0.id,l1_0.id"
  ],
  "fetch-api-first0-max1Sql": [
    "select distinct po1_0.id,l1_0.order_id,l1_0.id,l1_0.quantity,po1_0.version from PurchaseOrder po1_0 left join order_line l1_0 on po1_0.id=l1_0.order_id order by po1_0.id,l1_0.id"
  ],
  "fetch-memory-hint-max1Sql": [
    "select distinct po1_0.id,l1_0.order_id,l1_0.id,l1_0.quantity,po1_0.version from PurchaseOrder po1_0 left join order_line l1_0 on po1_0.id=l1_0.order_id order by po1_0.id,l1_0.id"
  ],
  "fetch-hql-limit1Sql": [
    "select po1_0.id,l1_0.order_id,l1_0.id,l1_0.quantity,po1_0.version from (select distinct po1_0.id,po1_0.version from PurchaseOrder po1_0 order by po1_0.id fetch first 1 rows only) po1_0(id,version) left join order_line l1_0 on po1_0.id=l1_0.order_id order by po1_0.id,l1_0.id"
  ],
  "plain-root-api-max1Sql": [
    "select po1_0.id,po1_0.version from PurchaseOrder po1_0 order by po1_0.id fetch first ? rows only"
  ],
  "originalAddLineServiceSql": [
    "insert into order_line (order_id,quantity,id) values (?,?,default)"
  ],
  "closedLazyFailureSql": [],
  "rollbackDirtyFlushSql": [
    "update probe_post set title=?,version=? where id=? and version=?"
  ],
  "lockBothReadsSql": [
    "select pp1_0.id,pp1_0.title,pp1_0.version from probe_post pp1_0 where pp1_0.id=?",
    "select pp1_0.id,pp1_0.title,pp1_0.version from probe_post pp1_0 where pp1_0.id=?"
  ],
  "lockACommitSql": [
    "update probe_post set title=?,version=? where id=? and version=?"
  ],
  "lockBFailureSql": [
    "update probe_post set title=?,version=? where id=? and version=?"
  ],
  "autoUnrelatedQuerySql": [
    "select po1_0.id,po1_0.version from PurchaseOrder po1_0"
  ],
  "autoOverlappingQuerySql": [
    "update probe_post set title=?,version=? where id=? and version=?",
    "select pp1_0.id,pp1_0.title,pp1_0.version from probe_post pp1_0"
  ]
};
export const S09_ASSETS = {
  "S09-cache": {
    "file": "S09-cache-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "id가 있는 객체는 이미 영속 상태일까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "cache-new": [
        1,
        8,
        32,
        47
      ],
      "cache-persist": [
        34,
        8,
        31,
        47
      ],
      "cache-seed-flush": [
        67,
        8,
        32,
        47
      ],
      "cache-seed-commit": [
        1,
        57,
        32,
        39
      ],
      "cache-find": [
        34,
        57,
        31,
        39
      ],
      "cache-find-again": [
        67,
        57,
        32,
        39
      ]
    }
  },
  "S09-flush": {
    "file": "S09-flush-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "Java 값·loadedState·DB 행은 언제 같아질까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "flush-change": [
        1,
        7,
        49,
        50
      ],
      "flush-flush": [
        51,
        7,
        48,
        50
      ],
      "flush-commit": [
        1,
        59,
        49,
        37
      ],
      "flush-rollback": [
        51,
        59,
        48,
        37
      ]
    }
  },
  "S09-merge": {
    "file": "S09-merge-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "merge는 원본을 managed로 바꿀까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "merge-detached": [
        1,
        11,
        31,
        80
      ],
      "merge-copied": [
        36,
        11,
        31,
        80
      ],
      "merge-returned-change": [
        68,
        11,
        30,
        80
      ]
    }
  },
  "S09-remove": {
    "file": "S09-remove-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "remove 직후 contains=false면 DB에서도 없을까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "remove-scheduled": [
        1,
        13,
        35,
        79
      ],
      "remove-flushed": [
        38,
        13,
        34,
        79
      ],
      "remove-committed": [
        74,
        13,
        25,
        42
      ]
    }
  },
  "S09-fetch": {
    "file": "S09-fetch-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 BatchSize와 fetch join은 무엇을 조회했을까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "fetch-batch": [
        1,
        20,
        32,
        71
      ],
      "fetch-join": [
        34,
        20,
        32,
        71
      ],
      "fetch-graph": [
        67,
        20,
        32,
        71
      ]
    }
  },
  "S09-service": {
    "file": "S09-service-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 서비스의 flush와 닫힌 LAZY 접근은 어떻게 달랐을까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "service-source-add": [
        1,
        10,
        52,
        83
      ],
      "service-closed-lazy": [
        55,
        10,
        44,
        83
      ]
    }
  },
  "S09-lock": {
    "file": "S09-lock.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 version0을 읽은 두 수정은 모두 저장될까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "lock-reads": [
        1,
        12,
        35,
        63
      ],
      "lock-a-commit": [
        38,
        12,
        27,
        63
      ],
      "lock-b-failure": [
        67,
        12,
        32,
        84
      ]
    }
  },
  "S09-auto": {
    "file": "S09-auto-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "AUTO flush는 모든 조회 전에 UPDATE할까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "auto-changed": [
        1,
        11,
        33,
        77
      ],
      "auto-unrelated": [
        35,
        11,
        30,
        77
      ],
      "auto-overlap": [
        66,
        11,
        33,
        77
      ]
    }
  },
  "S09-pagination": {
    "file": "S09-pagination-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "fetch join에 maxResults(1)을 주면 항상 부모1개일까? 원문 PurchaseOrder와 추가 ProbePost의 native Hibernate·H2 관찰을 구분한다.",
    "focus": {
      "pagination-api": [
        22,
        16,
        19,
        75
      ],
      "pagination-memory": [
        42,
        16,
        18,
        75
      ],
      "pagination-hql": [
        61,
        16,
        19,
        75
      ],
      "pagination-root": [
        81,
        16,
        18,
        75
      ]
    }
  }
};
export const S09_LESSONS = [
  {
    "id": "cache",
    "question": "id가 있는 객체는 이미 영속 상태일까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 생성·저장·find",
    "note": "ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. 이 ProbePost는 id를 직접 42로 지정합니다. 원문 PurchaseOrder의 IDENTITY 전략과 섞지 않습니다.",
    "stages": [
      {
        "id": "cache-new",
        "title": "id=42여도 아직 new",
        "lead": "추가 ProbePost에 id와 제목을 직접 넣었습니다. EntityManager는 아직 이 객체를 관리하지 않으므로 id 존재만으로 영속 상태라고 판단할 수 없습니다.",
        "code": "ProbePost fresh = new ProbePost(42L, \"첫 글\");",
        "values": [
          [
            "Java id / title / version",
            "42 / 첫 글 / 0"
          ],
          [
            "em.contains",
            "false"
          ],
          [
            "Hibernate Entry",
            "no-entry"
          ],
          [
            "Hibernate loadedState",
            "{} · 해당 객체 Entry 없음"
          ]
        ],
        "checks": [
          "assigned-id-can-still-be-new"
        ],
        "sqlPhases": [],
        "active": [
          0
        ],
        "image": "S09-cache"
      },
      {
        "id": "cache-persist",
        "title": "persist가 관리 상태로 등록",
        "lead": "persist 뒤 같은 fresh가 managed가 됐고 Hibernate loadedState에 첫 글·version0이 기록됐습니다. 이 assigned-id 조건에서는 아직 INSERT가 없고 observer에도 행이 없습니다.",
        "code": "em.persist(fresh);",
        "values": [
          [
            "Java id / title / version",
            "42 / 첫 글 / 0"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=첫 글 / version=0"
          ],
          [
            "이 구간 ORM SQL",
            "0 · INSERT 아직 없음"
          ],
          [
            "별도 observer",
            "id42 행 없음"
          ]
        ],
        "checks": [
          "persist-registered-managed",
          "assigned-persist-delays-insert",
          "persist-before-flush-observer-empty"
        ],
        "sqlPhases": [
          "seedPersistSql"
        ],
        "active": [
          0
        ],
        "image": "S09-cache"
      },
      {
        "id": "cache-seed-flush",
        "title": "첫 flush는 INSERT 실행",
        "lead": "명시 flush가 INSERT 한 문장을 실행했습니다. 같은 transaction JDBC에서는 첫 글 행을 읽지만 별도 observer는 아직 행을 읽지 못합니다.",
        "code": "em.flush();\n// 같은 transaction JDBC / 별도 observer 비교",
        "values": [
          [
            "같은 transaction DB 행",
            "id=42 / 첫 글 / version=0"
          ],
          [
            "별도 observer",
            "id42 행 없음"
          ],
          [
            "이 구간 ORM SQL",
            "INSERT 1문장"
          ],
          [
            "확정 여부",
            "아직 commit 아님"
          ]
        ],
        "checks": [
          "seed-flush-insert-one",
          "seed-flush-not-commit"
        ],
        "sqlPhases": [
          "seedFlushSql"
        ],
        "active": [
          0
        ],
        "image": "S09-cache"
      },
      {
        "id": "cache-seed-commit",
        "title": "commit 뒤 외부에 첫 글",
        "lead": "첫 저장 transaction을 commit하고 EntityManager를 닫았습니다. 별도 observer가 title=첫 글·version0인 행을 확인했습니다.",
        "code": "em.getTransaction().commit();\nem.close();",
        "values": [
          [
            "별도 observer DB 행",
            "id=42 / 첫 글 / version=0"
          ],
          [
            "이 구간 추가 SQL문",
            "0 · 이미 전송한 INSERT 확정"
          ],
          [
            "다음 조회",
            "새 EntityManager에서 진행"
          ]
        ],
        "checks": [
          "seed-commit-row-visible"
        ],
        "sqlPhases": [
          "seedCommitSql"
        ],
        "active": [
          0,
          1
        ],
        "image": "S09-cache"
      },
      {
        "id": "cache-find",
        "title": "새 컨텍스트의 첫 find",
        "lead": "새 EntityManager에서 id42를 find했습니다. SELECT 한 번으로 읽은 객체는 managed이며 Hibernate loadedState에도 첫 글·version0이 있습니다.",
        "code": "ProbePost first = em.find(ProbePost.class, 42L);",
        "values": [
          [
            "Java id / title / version",
            "42 / 첫 글 / 0"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=첫 글 / version=0"
          ],
          [
            "이번 find SQL",
            "SELECT 1문장"
          ]
        ],
        "checks": [
          "first-find-one-select"
        ],
        "sqlPhases": [
          "firstFindSql"
        ],
        "active": [
          0
        ],
        "image": "S09-cache"
      },
      {
        "id": "cache-find-again",
        "title": "같은 컨텍스트는 같은 객체",
        "lead": "같은 EntityManager에서 같은 타입·id를 다시 find했습니다. first == second가 true였고 두 번째 find의 추가 SELECT는 없었습니다.",
        "code": "ProbePost second = em.find(ProbePost.class, 42L);\n// first == second",
        "values": [
          [
            "객체 동일성",
            "first == second → true"
          ],
          [
            "현재 값",
            "id=42 / 첫 글 / version=0"
          ],
          [
            "두 번째 find 추가 SQL",
            "0"
          ],
          [
            "범위",
            "같은 영속성 컨텍스트 · 공유 애플리케이션 캐시 아님"
          ]
        ],
        "checks": [
          "second-find-same-instance",
          "second-find-no-select"
        ],
        "sqlPhases": [
          "secondFindSql"
        ],
        "active": [
          0
        ],
        "image": "S09-cache"
      }
    ]
  },
  {
    "id": "flush",
    "question": "Java 값·loadedState·DB 행은 언제 같아질까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 변경·commit / 별도 rollback DB",
    "note": "ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. commit 분기 s09_main과 rollback 분기 s09_rollback은 같은 초기 id42를 사용하는 별도 DB입니다. commit 다음에 같은 transaction을 rollback하는 순서가 아닙니다.",
    "stages": [
      {
        "id": "flush-change",
        "title": "setter 직후 Java만 변경",
        "lead": "first.title을 수정된 글로 바꿨습니다. Java 값과 loadedState가 달라졌지만 이 시점의 같은 transaction DB와 외부 DB는 모두 첫 글입니다.",
        "code": "first.setTitle(\"수정된 글\");",
        "values": [
          [
            "Java id / title / version",
            "42 / 수정된 글 / 0"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=첫 글 / version=0"
          ],
          [
            "같은 transaction DB",
            "첫 글 / version=0"
          ],
          [
            "별도 observer DB",
            "첫 글 / version=0"
          ],
          [
            "setter 추가 SQL",
            "0"
          ]
        ],
        "checks": [
          "changed-java-before-flush",
          "changed-before-flush-db-old",
          "setter-no-sql"
        ],
        "sqlPhases": [
          "setterSql"
        ],
        "active": [
          0
        ],
        "image": "S09-flush"
      },
      {
        "id": "flush-flush",
        "title": "flush가 UPDATE와 loadedState 갱신",
        "lead": "flush가 UPDATE를 실행한 뒤 Java version과 loadedState가 1로 바뀌었습니다. 같은 transaction은 수정된 글을 읽지만 별도 observer는 아직 첫 글입니다.",
        "code": "em.flush();\n// 같은 transaction DB와 별도 observer를 비교",
        "values": [
          [
            "Java id / title / version",
            "42 / 수정된 글 / 1"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=수정된 글 / version=1"
          ],
          [
            "같은 transaction DB",
            "수정된 글 / version=1"
          ],
          [
            "별도 observer DB",
            "첫 글 / version=0"
          ],
          [
            "flush ORM SQL",
            "UPDATE 1문장"
          ]
        ],
        "checks": [
          "dirty-flush-one-update",
          "loaded-state-refreshes-after-flush",
          "flush-inside-new-outside-old"
        ],
        "sqlPhases": [
          "dirtyFlushSql"
        ],
        "active": [
          0
        ],
        "image": "S09-flush"
      },
      {
        "id": "flush-commit",
        "title": "commit하면 외부도 수정된 글",
        "lead": "이 변경 transaction을 commit한 뒤 observer가 수정된 글·version1을 확인했습니다. commit 구간에 추가 DML 문장은 없었지만 확정 경계는 flush와 다릅니다.",
        "code": "em.getTransaction().commit();\nem.close();",
        "values": [
          [
            "별도 observer DB",
            "id=42 / 수정된 글 / version=1"
          ],
          [
            "commit 구간 추가 SQL문",
            "0"
          ],
          [
            "의미",
            "flush한 UPDATE의 transaction 확정"
          ]
        ],
        "checks": [
          "commit-outside-new-version-one"
        ],
        "sqlPhases": [
          "dirtyCommitSql"
        ],
        "active": [
          0,
          1
        ],
        "image": "S09-flush"
      },
      {
        "id": "flush-rollback",
        "title": "별도 분기: DB와 Java를 구분",
        "lead": "별도 s09_rollback DB에서도 수정된 글로 flush한 뒤 rollback했습니다. DB는 첫 글·version0이지만 EntityManager를 닫은 후의 같은 Java 객체는 수정된 글·version1로 남았습니다.",
        "code": "p.setTitle(\"수정된 글\");\nem.flush();\nem.getTransaction().rollback();\nem.close();\n// 같은 Java 객체의 getter 값과 별도 DB 행을 비교",
        "values": [
          [
            "rollback 전 flush 후 같은 transaction DB",
            "수정된 글 / version=1"
          ],
          [
            "rollback 전 별도 observer DB",
            "첫 글 / version=0"
          ],
          [
            "rollback·EM close 뒤 Java",
            "수정된 글 / version=1"
          ],
          [
            "rollback 뒤 DB",
            "첫 글 / version=0"
          ],
          [
            "주의",
            "rollback이 이 Java 필드 값까지 옛값으로 복구하지 않음"
          ]
        ],
        "checks": [
          "rollback-branch-flush-inside-new-outside-old",
          "rollback-does-not-revert-java-title-here",
          "rollback-restores-db-first-version-zero"
        ],
        "sqlPhases": [
          "rollbackDirtyFlushSql"
        ],
        "active": [
          1,
          2,
          3
        ],
        "image": "S09-flush",
        "note": "닫은 뒤에는 동일 Java 객체의 getter 값만 확인했습니다. raw JSON의 false/no-entry/{}는 view(null,p)의 기본 표기이며 contains나 닫힌 컨텍스트를 실제 조사한 결과가 아닙니다. ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. commit 분기 s09_main과 rollback 분기 s09_rollback은 같은 초기 id42를 사용하는 별도 DB입니다. commit 다음에 같은 transaction을 rollback하는 순서가 아닙니다."
      }
    ]
  },
  {
    "id": "merge",
    "question": "merge는 원본을 managed로 바꿀까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 detached 원본과 반환 객체",
    "note": "ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. 앞서 commit한 수정된 글·version1을 기준으로 별도 EntityManager에서 merge합니다. 원본 first와 반환된 merged는 서로 다른 객체입니다.",
    "stages": [
      {
        "id": "merge-detached",
        "title": "원본은 detached로 남음",
        "lead": "닫힌 이전 컨텍스트의 first를 준영속 수정으로 바꿨습니다. 새 컨텍스트에서 merge한 뒤에도 이 원본은 contains=false·no-entry였으며 원본 자체가 managed로 전환되지 않았습니다.",
        "code": "first.setTitle(\"준영속 수정\");\n// 새 EntityManager의 em.merge(first) 이후에도 원본 first는 detached",
        "values": [
          [
            "Java id / title / version",
            "42 / 준영속 수정 / 1"
          ],
          [
            "em.contains",
            "false"
          ],
          [
            "Hibernate Entry",
            "no-entry"
          ],
          [
            "Hibernate loadedState",
            "{} · 해당 객체 Entry 없음"
          ]
        ],
        "checks": [
          "merge-original-remains-detached"
        ],
        "sqlPhases": [],
        "active": [
          0
        ],
        "image": "S09-merge"
      },
      {
        "id": "merge-copied",
        "title": "복사받은 별도 managed 반환",
        "lead": "merge는 원본 상태를 복사한 별도 managed 객체를 반환했습니다. 현재 title은 준영속 수정이지만 로딩한 DB의 loadedState는 수정된 글·version1입니다.",
        "code": "ProbePost merged = em.merge(first);\n// merged != first && em.contains(merged)",
        "values": [
          [
            "Java id / title / version",
            "42 / 준영속 수정 / 1"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=수정된 글 / version=1"
          ],
          [
            "객체 구분",
            "merged != first → true"
          ]
        ],
        "checks": [
          "merge-returns-distinct-managed",
          "merge-copies-current-state"
        ],
        "sqlPhases": [
          "mergeReadSql"
        ],
        "active": [
          0
        ],
        "image": "S09-merge"
      },
      {
        "id": "merge-returned-change",
        "title": "반환 객체의 변경이 commit됨",
        "lead": "원본을 원본만 변경으로 고쳐도 merged는 따라 바뀌지 않았습니다. 별도로 merged를 반환 객체 수정으로 고쳐 commit하니 DB는 그 값·version2가 됐습니다.",
        "code": "first.setTitle(\"원본만 변경\");\nmerged.setTitle(\"반환 객체 수정\");\nem.getTransaction().commit();",
        "values": [
          [
            "detached 원본 Java",
            "원본만 변경 / version=1 / managed=false"
          ],
          [
            "commit 전 managed 반환 객체",
            "반환 객체 수정 / version=1 / loadedState=수정된 글·1"
          ],
          [
            "commit 뒤 별도 observer DB",
            "반환 객체 수정 / version=2"
          ]
        ],
        "checks": [
          "detached-edit-does-not-follow-merge",
          "merge-returned-edit-committed"
        ],
        "sqlPhases": [
          "mergeCommitSql"
        ],
        "active": [
          0,
          1,
          2
        ],
        "image": "S09-merge"
      }
    ]
  },
  {
    "id": "remove",
    "question": "remove 직후 contains=false면 DB에서도 없을까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 remove·flush·commit",
    "note": "ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. remove 직후 JPA contains와 Hibernate 내부 Entry 상태, DB 행 존재 여부를 분리합니다.",
    "stages": [
      {
        "id": "remove-scheduled",
        "title": "contains=false·Entry=DELETED",
        "lead": "새 EntityManager로 읽은 ProbePost를 remove했습니다. contains는 false이고 내부 Entry는 DELETED이지만 아직 DELETE SQL은 없고 observer 행도 남아 있습니다.",
        "code": "em.remove(removed);",
        "values": [
          [
            "Java id / title / version",
            "42 / 반환 객체 수정 / 2"
          ],
          [
            "em.contains",
            "false"
          ],
          [
            "Hibernate Entry",
            "DELETED"
          ],
          [
            "Hibernate loadedState",
            "title=반환 객체 수정 / version=2"
          ],
          [
            "별도 observer DB",
            "행 존재 · 반환 객체 수정 / version=2"
          ],
          [
            "추가 SQL문",
            "0 · 삭제 예약 상태"
          ]
        ],
        "checks": [
          "removed-not-contained",
          "remove-schedules-no-sql-yet",
          "removed-before-flush-outside-row-kept"
        ],
        "sqlPhases": [
          "removeScheduleSql"
        ],
        "active": [
          0
        ],
        "image": "S09-remove"
      },
      {
        "id": "remove-flushed",
        "title": "flush 뒤 내부는 없고 외부는 존재",
        "lead": "flush가 버전 조건을 포함한 DELETE 한 문장을 실행했습니다. 같은 transaction JDBC에서는 행이 없고 observer는 commit 전의 행을 읽습니다.",
        "code": "em.flush();\n// 내부 JDBC / 별도 observer 비교",
        "values": [
          [
            "같은 transaction DB",
            "id42 행 없음"
          ],
          [
            "별도 observer DB",
            "반환 객체 수정 / version=2 행 존재"
          ],
          [
            "flush ORM SQL",
            "DELETE 1문장"
          ]
        ],
        "checks": [
          "remove-flush-one-delete",
          "removed-inside-gone-outside-kept"
        ],
        "sqlPhases": [
          "removeFlushSql"
        ],
        "active": [
          0
        ],
        "image": "S09-remove"
      },
      {
        "id": "remove-committed",
        "title": "commit 뒤 외부도 행 없음",
        "lead": "삭제 transaction을 commit한 뒤 별도 observer에도 id42 행이 없습니다. 이 구간의 추가 DML 문장은 0이며 앞의 DELETE를 확정했습니다.",
        "code": "em.getTransaction().commit();\nem.close();",
        "values": [
          [
            "별도 observer DB",
            "id42 행 없음"
          ],
          [
            "commit 구간 추가 SQL문",
            "0"
          ]
        ],
        "checks": [
          "remove-commit-outside-gone"
        ],
        "sqlPhases": [
          "removeCommitSql"
        ],
        "active": [
          0
        ],
        "image": "S09-remove"
      }
    ]
  },
  {
    "id": "fetch",
    "question": "원문 BatchSize와 fetch join은 무엇을 조회했을까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 원문 PurchaseOrder / OrderLine · 추가 seed 3부모·6자식",
    "note": "이 주제는 ProbePost가 아닌 원문 PurchaseOrder·OrderLine입니다. 각 부모의 자식은 2개이며 원문의 @BatchSize(size=32)를 유지했습니다. 캐시 비활성화·default_batch_fetch_size=0 조건입니다. raw JDBC 행 수는 ORM SQL을 별도 연결에서 재실행해 센 값이지 Hibernate가 전송받은 wire 행 계측이 아닙니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다.",
    "stages": [
      {
        "id": "fetch-batch",
        "title": "root1 + batch collection1",
        "lead": "새 컨텍스트에서 부모 3개를 읽었을 때 컬렉션은 미초기화였습니다. 첫 컬렉션 접근의 배치 SELECT가 세 부모의 총 자식 6개를 준비해 추가 SQL 누계는 각 접근 후에도 1입니다.",
        "code": "@OrderBy(\"id ASC\") @BatchSize(size = 32)\nprivate List<OrderLine> lines = new ArrayList<>();\n// 추가 probe: for (PurchaseOrder o : orders) o.getLines().size();",
        "values": [
          [
            "원문 모델",
            "PurchaseOrder 3개 / OrderLine 총 6개"
          ],
          [
            "초기 컬렉션",
            "세 부모 모두 미초기화"
          ],
          [
            "원문 설정",
            "@BatchSize(size=32) 유지"
          ],
          [
            "접근별 추가 SQL 누계",
            "order1: 1 / order2: 1 / order3: 1"
          ],
          [
            "총 ORM SQL",
            "root SELECT 1 + batch SELECT 1 = 2"
          ]
        ],
        "checks": [
          "original-list-root-one-query",
          "original-list-three-parents",
          "original-collections-initially-lazy",
          "original-batch32-one-additional-query"
        ],
        "sqlPhases": [
          "batchRootSql",
          "batchCollectionSql"
        ],
        "active": [
          0,
          2
        ],
        "image": "S09-fetch"
      },
      {
        "id": "fetch-join",
        "title": "fetch join: 부모3·별도 재실행 행6",
        "lead": "원문 OrderReadService를 EntityManager를 넣은 일반 Java 객체로 호출했습니다. 한 SQL로 부모3·자식6을 읽고 컬렉션 접근 추가 SQL은 0입니다. 같은 SQL의 별도 JDBC 재실행은 행6개였습니다.",
        "code": "List<PurchaseOrder> fetched = readService.findOrdersWithLines();\n// 원문 HQL: select distinct o from PurchaseOrder o left join fetch o.lines order by o.id",
        "values": [
          [
            "ORM 반환 부모 / 총 자식",
            "3 / 6"
          ],
          [
            "fetch join SQL / 접근 추가 SQL",
            "1 / 0"
          ],
          [
            "별도 JDBC SQL 재실행 행 수",
            "6 · Hibernate wire 행 수 계측 아님"
          ],
          [
            "원문 서비스 호출 방식",
            "직접 Java · 수동 transaction · Spring 프록시 아님"
          ]
        ],
        "checks": [
          "original-read-service-one-query",
          "original-fetchjoin-access-no-extra-query",
          "fetchjoin-six-jdbc-rows-not-three"
        ],
        "sqlPhases": [
          "originalFetchJoinSql",
          "fetchJoinAccessSql"
        ],
        "active": [
          0,
          1
        ],
        "image": "S09-fetch"
      },
      {
        "id": "fetch-graph",
        "title": "추가 fetch graph도 이 조건에서1",
        "lead": "원문 모델에 추가 EntityGraph(lines)를 적용한 별도 조회입니다. 이 조건에서는 SQL1·부모3·자식6이었으며 그래프가 언제나 SQL 한 번을 보장한다는 뜻은 아닙니다.",
        "code": "EntityGraph<PurchaseOrder> graph = em.createEntityGraph(PurchaseOrder.class);\ngraph.addAttributeNodes(\"lines\");\nem.createQuery(\"select o from PurchaseOrder o order by o.id\", PurchaseOrder.class)\n    .setHint(\"jakarta.persistence.fetchgraph\", graph).getResultList();",
        "values": [
          [
            "추가 조회 설정",
            "jakarta.persistence.fetchgraph · lines"
          ],
          [
            "부모 / 자식",
            "3 / 6"
          ],
          [
            "실측 ORM SQL",
            "1 · 이 fixture 조건의 관측"
          ]
        ],
        "checks": [
          "extra-fetchgraph-one-query-here"
        ],
        "sqlPhases": [
          "extraFetchGraphSql"
        ],
        "active": [
          0,
          1,
          3
        ],
        "image": "S09-fetch"
      }
    ]
  },
  {
    "id": "service",
    "question": "원문 서비스의 flush와 닫힌 LAZY 접근은 어떻게 달랐을까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 원문 서비스 직접 호출 / 별도 closed-context 실험",
    "note": "원문 OrderService·OrderReadService를 직접 Java로 호출하며 transaction은 추가 probe가 수동으로 열었습니다. Spring @Transactional 프록시를 실행한 결과가 아닙니다. 닫힌 LAZY 실패 구간은 DB 행 존재 여부를 관찰한 실험이 아닙니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다.",
    "stages": [
      {
        "id": "service-source-add",
        "title": "원문 addLine: 자식2에서3",
        "lead": "기존 자식 2개가 있는 managed PurchaseOrder에 원문 addLine(1L,99)을 직접 호출했습니다. flush 후 자식3개·부모 version0이었고 측정 SQL은 자식 INSERT 한 문장이었습니다. 이 service 실험 transaction은 rollback했습니다.",
        "code": "new OrderService(em).addLine(1L, 99);\n// 원문 메서드 내부\norder.addLine(new OrderLine(quantity));\nentityManager.flush();",
        "values": [
          [
            "원문 모델",
            "PurchaseOrder id1 / OrderLine"
          ],
          [
            "메모리 자식 수 전 → 후",
            "2 → 3"
          ],
          [
            "flush 뒤 부모 version",
            "0"
          ],
          [
            "실측 SQL",
            "order_line INSERT 1문장"
          ],
          [
            "실험 종료",
            "수동 transaction rollback"
          ]
        ],
        "checks": [
          "original-service-direct-java-add-and-flush"
        ],
        "sqlPhases": [
          "originalAddLineServiceSql"
        ],
        "active": [
          0,
          2,
          3
        ],
        "image": "S09-service"
      },
      {
        "id": "service-closed-lazy",
        "title": "닫힌 뒤 컬렉션은 초기화 실패",
        "lead": "다른 EntityManager에서 원문 PurchaseOrder를 find했을 때 컬렉션은 LAZY였습니다. EntityManager를 닫고 getLines().size()를 호출하니 LazyInitializationException이 발생했고 추가 SQL은 0이었습니다.",
        "code": "PurchaseOrder closed = em.find(PurchaseOrder.class, 1L);\nem.close();\nclosed.getLines().size();",
        "values": [
          [
            "초기 컬렉션",
            "미초기화"
          ],
          [
            "접근 시점",
            "EntityManager 종료 뒤"
          ],
          [
            "실측 예외",
            "org.hibernate.LazyInitializationException"
          ],
          [
            "실패 구간 추가 SQL",
            "0"
          ],
          [
            "DB 행 관찰",
            "이 실패 구간에서는 미측정"
          ]
        ],
        "checks": [
          "original-closed-collection-starts-lazy",
          "original-closed-collection-lazy-fails",
          "closed-lazy-emits-no-query"
        ],
        "sqlPhases": [
          "closedLazyFailureSql"
        ],
        "active": [
          1,
          2
        ],
        "image": "S09-service"
      }
    ]
  },
  {
    "id": "lock",
    "question": "같은 version0을 읽은 두 수정은 모두 저장될까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 별도 s09_lock DB · 추가 ProbePost42",
    "note": "ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. 별도 DB에서 처음부터 첫 글·version0을 seed했습니다. 서로 다른 두 EntityManager의 resource-local transaction을 순서대로 진행한 실험이며 HTTP 동시 요청·thread 지연·비관적 락을 측정하지 않았습니다.",
    "stages": [
      {
        "id": "lock-reads",
        "title": "두 컨텍스트가 각각 version0",
        "lead": "서로 다른 a·b 컨텍스트에서 같은 id42를 읽었습니다. pa와 pb는 다른 Java 객체지만 둘 다 첫 글·version0과 각자의 loadedState를 가집니다.",
        "code": "ProbePost pa = a.find(ProbePost.class, 42L);\nProbePost pb = b.find(ProbePost.class, 42L);",
        "values": [
          [
            "A Java / loadedState",
            "첫 글·version0 / 첫 글·version0"
          ],
          [
            "B Java / loadedState",
            "첫 글·version0 / 첫 글·version0"
          ],
          [
            "객체 동일성",
            "pa != pb"
          ],
          [
            "별도 초기 DB",
            "s09_lock · id42 / 첫 글 / version0"
          ]
        ],
        "checks": [
          "two-contexts-read-version-zero"
        ],
        "sqlPhases": [
          "lockBothReadsSql"
        ],
        "active": [
          0,
          1
        ],
        "image": "S09-lock"
      },
      {
        "id": "lock-a-commit",
        "title": "A가 먼저 version1로 commit",
        "lead": "A의 제목을 A 수정으로 바꾸고 commit했습니다. 별도 observer의 DB version은 1입니다. B가 읽어 둔 버전은 여전히 0입니다.",
        "code": "pa.setTitle(\"A 수정\");\na.getTransaction().commit();",
        "values": [
          [
            "A 변경 입력",
            "A 수정"
          ],
          [
            "A commit 뒤 DB version",
            "1"
          ],
          [
            "B가 읽어 둔 version",
            "0"
          ],
          [
            "A 구간 ORM SQL",
            "version 조건 UPDATE 1문장"
          ]
        ],
        "checks": [
          "lock-a-commit-version-one"
        ],
        "sqlPhases": [
          "lockACommitSql"
        ],
        "active": [
          0,
          1
        ],
        "image": "S09-lock"
      },
      {
        "id": "lock-b-failure",
        "title": "B의 오래된 version은 거부",
        "lead": "B를 B 수정으로 바꾼 뒤 flush하자 OptimisticLockException이 발생했습니다. B를 rollback한 뒤 DB는 A 수정·version1을 유지했습니다.",
        "code": "pb.setTitle(\"B 수정\");\nb.flush();\n// 예외 뒤 B transaction rollback",
        "values": [
          [
            "B 입력 / 읽은 version",
            "B 수정 / 0"
          ],
          [
            "실측 예외",
            "jakarta.persistence.OptimisticLockException"
          ],
          [
            "DB 최종 관찰",
            "id42 / A 수정 / version1"
          ],
          [
            "실패 SQL",
            "UPDATE ... WHERE id=? AND version=?"
          ]
        ],
        "checks": [
          "stale-version-flush-rejected",
          "stale-update-does-not-overwrite-a"
        ],
        "sqlPhases": [
          "lockBFailureSql"
        ],
        "active": [
          0,
          1
        ],
        "image": "S09-lock"
      }
    ]
  },
  {
    "id": "auto",
    "question": "AUTO flush는 모든 조회 전에 UPDATE할까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 별도 s09_auto DB · 추가 ProbePost42와 원문 PurchaseOrder",
    "note": "ProbePost(id=42,title,version)는 원문에 없는 추가 엔티티이며 기존 Post42 예상 그림과 구분합니다. loadedState와 Entry는 Hibernate 내부 관찰값이지 표준 JPA 스냅샷 API가 아닙니다. 별도 JDBC observer는 READ_COMMITTED·autocommit이며 ORM SQL 구간과 분리합니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다. 같은 transaction 안의 서로 다른 쿼리 공간을 비교합니다. 이 실험의 AUTO 동작을 모든 native SQL·모든 flush mode·모든 공급자로 일반화하지 않습니다. 이 transaction은 마지막에 rollback했습니다.",
    "stages": [
      {
        "id": "auto-changed",
        "title": "기본 AUTO에서 제목 변경",
        "lead": "별도 DB에 첫 글·version0을 seed한 뒤 쿼리 전 변경으로 수정했습니다. 기본 flush mode는 AUTO였으며 이어지는 두 조회의 반영 시점을 비교합니다.",
        "code": "p.setTitle(\"쿼리 전 변경\");\n// em.getFlushMode() == FlushModeType.AUTO",
        "values": [
          [
            "Java id / title / version",
            "42 / 쿼리 전 변경 / 0"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=첫 글 / version=0"
          ],
          [
            "기본 flush mode",
            "AUTO"
          ]
        ],
        "checks": [
          "default-flush-mode-auto"
        ],
        "sqlPhases": [],
        "active": [
          0
        ],
        "image": "S09-auto"
      },
      {
        "id": "auto-unrelated",
        "title": "무관한 PurchaseOrder 조회",
        "lead": "ProbePost를 수정한 상태에서 PurchaseOrder를 조회했습니다. 관측 SQL은 PurchaseOrder SELECT 한 문장뿐이고 Java version0·loadedState 첫 글이 유지됐습니다.",
        "code": "em.createQuery(\"select o from PurchaseOrder o\", PurchaseOrder.class).getResultList();",
        "values": [
          [
            "Java id / title / version",
            "42 / 쿼리 전 변경 / 0"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=첫 글 / version=0"
          ],
          [
            "이번 SQL",
            "PurchaseOrder SELECT 1 · probe_post UPDATE 없음"
          ]
        ],
        "checks": [
          "unrelated-query-no-post-update"
        ],
        "sqlPhases": [
          "autoUnrelatedQuerySql"
        ],
        "active": [
          0
        ],
        "image": "S09-auto"
      },
      {
        "id": "auto-overlap",
        "title": "겹치는 ProbePost 조회 전 UPDATE",
        "lead": "이어서 ProbePost 자체를 조회하니 UPDATE 다음 SELECT가 실행됐습니다. Java와 loadedState는 쿼리 전 변경·version1이지만 observer는 여전히 첫 글입니다.",
        "code": "em.createQuery(\"select p from ProbePost p\", ProbePost.class).getResultList();",
        "values": [
          [
            "Java id / title / version",
            "42 / 쿼리 전 변경 / 1"
          ],
          [
            "em.contains",
            "true"
          ],
          [
            "Hibernate Entry",
            "MANAGED"
          ],
          [
            "Hibernate loadedState",
            "title=쿼리 전 변경 / version=1"
          ],
          [
            "관측 SQL 순서",
            "probe_post UPDATE → probe_post SELECT"
          ],
          [
            "별도 observer DB title",
            "첫 글 · AUTO flush도 commit 아님"
          ]
        ],
        "checks": [
          "overlap-auto-update-before-select",
          "auto-flush-still-not-commit"
        ],
        "sqlPhases": [
          "autoOverlappingQuerySql"
        ],
        "active": [
          0
        ],
        "image": "S09-auto"
      }
    ]
  },
  {
    "id": "pagination",
    "question": "fetch join에 maxResults(1)을 주면 항상 부모1개일까?",
    "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 API / hint / HQL / plain-control 관측",
    "note": "놀라운 API 동작의 추가 관측이며 페이지네이션 정확성 통과 판정이 아닙니다. 원인과 upstream 수정 여부는 미확인입니다. 온라인 가이드 7.4.13과 실행 런타임 7.4.5.Final을 구분합니다. raw 행 수는 별도 JDBC SQL 재실행값이며 Hibernate wire 수가 아닙니다. hint 강제·업그레이드·성능 개선을 권고하는 결과가 아닙니다. Boot 앱·Spring 프록시·HTTP·OSIV·MySQL·Java 25·Docker는 미실행입니다.",
    "stages": [
      {
        "id": "pagination-api",
        "title": "API max1인데 부모3개 관측",
        "lead": "같은 collection fetch join에 setMaxResults(1)을 준 두 변형을 기록했습니다. 기본 first0과 명시 setFirstResult(0) 모두 부모 [1,2,3]을 반환했습니다. PASS는 설정과 관측 SQL 기록의 확인입니다.",
        "code": "query.setMaxResults(1);\n// 두 번째 독립 변형에는 다음도 설정\nquery.setFirstResult(0);\nList<PurchaseOrder> actual = query.getResultList();",
        "values": [
          [
            "검사한 두 변형",
            "fetch-api-max1 / fetch-api-first0-max1"
          ],
          [
            "API 설정 max / first",
            "1 / 0 · 두 변형 모두"
          ],
          [
            "실제 부모 IDs / 자식 수",
            "[1,2,3] / [2,2,2]"
          ],
          [
            "별도 JDBC 재실행 행 수",
            "6 / 6"
          ],
          [
            "판정 범위",
            "설정·관측 검증 · 정확성 통과 아님"
          ]
        ],
        "checks": [
          "pagination-fetch-api-max1-one-statement-observed",
          "pagination-fetch-api-max1-configured-max-one",
          "pagination-fetch-api-first0-max1-one-statement-observed",
          "pagination-fetch-api-first0-max1-configured-max-one"
        ],
        "sqlPhases": [
          "fetch-api-max1Sql",
          "fetch-api-first0-max1Sql"
        ],
        "active": [
          0,
          2,
          3
        ],
        "image": "S09-pagination"
      },
      {
        "id": "pagination-memory",
        "title": "명시 memory hint는 부모1·raw6",
        "lead": "별도 변형에서 org.hibernate.limitInMemory=true와 maxResults(1)을 적용했습니다. 반환 부모는 [1]·자식2개였지만 같은 SQL의 별도 JDBC 재실행은 행6개입니다.",
        "code": "query.setMaxResults(1);\nquery.setHint(\"org.hibernate.limitInMemory\", true);\nList<PurchaseOrder> actual = query.getResultList();",
        "values": [
          [
            "추가 hint",
            "org.hibernate.limitInMemory=true"
          ],
          [
            "API 설정 max / first",
            "1 / 0"
          ],
          [
            "실제 부모 IDs / 자식 수",
            "[1] / [2]"
          ],
          [
            "별도 JDBC 재실행 행 수",
            "6"
          ],
          [
            "해석 한계",
            "hint 사용 권고·성능 측정 아님"
          ]
        ],
        "checks": [
          "pagination-fetch-memory-hint-max1-one-statement-observed",
          "pagination-fetch-memory-hint-max1-configured-max-one"
        ],
        "sqlPhases": [
          "fetch-memory-hint-max1Sql"
        ],
        "active": [
          0,
          1,
          2
        ],
        "image": "S09-pagination"
      },
      {
        "id": "pagination-hql",
        "title": "HQL inline limit는 부모1·raw2",
        "lead": "다른 변형은 HQL 끝에 limit 1을 썼습니다. API max는 설정하지 않아 getter 값은 2147483647이지만 반환 부모는 [1]이고 별도 JDBC 재실행 행은2개였습니다.",
        "code": "TypedQuery<PurchaseOrder> query = pageEm.createQuery(\n    fetchHql + \" limit 1\", PurchaseOrder.class);\nList<PurchaseOrder> actual = query.getResultList();",
        "values": [
          [
            "제한 표현",
            "HQL inline limit 1 · API max 미설정"
          ],
          [
            "API getMaxResults / first",
            "2147483647 / 0"
          ],
          [
            "실제 부모 IDs / 자식 수",
            "[1] / [2]"
          ],
          [
            "별도 JDBC 재실행 행 수",
            "2"
          ],
          [
            "해석 한계",
            "다른 런타임·MySQL·업그레이드 결과 아님"
          ]
        ],
        "checks": [
          "pagination-fetch-hql-limit1-one-statement-observed"
        ],
        "sqlPhases": [
          "fetch-hql-limit1Sql"
        ],
        "active": [
          0,
          1,
          2
        ],
        "image": "S09-pagination"
      },
      {
        "id": "pagination-root",
        "title": "plain root 대조군은 부모1·raw1",
        "lead": "컬렉션 fetch join이 없는 별도 root 쿼리에 같은 API max1을 적용했습니다. 부모 [1]을 반환했고 재실행할 SQL의 유일한 limit 파라미터에 1을 명시 바인딩한 JDBC 결과도1행입니다.",
        "code": "TypedQuery<PurchaseOrder> query = pageEm.createQuery(\n    \"select o from PurchaseOrder o order by o.id\", PurchaseOrder.class);\nquery.setMaxResults(1);",
        "values": [
          [
            "대조군",
            "plain-root-api-max1 · collection fetch 없음"
          ],
          [
            "실제 부모 IDs",
            "[1]"
          ],
          [
            "별도 JDBC 재실행",
            "유일한 limit 파라미터 1 → 1 바인딩 · 1행"
          ],
          [
            "컬렉션 크기",
            "이 대조군에서는 미측정"
          ],
          [
            "관측 해석",
            "원인·upstream 수정 여부 미확인"
          ]
        ],
        "checks": [
          "pagination-plain-root-api-max1-one-statement-observed",
          "pagination-plain-root-api-max1-configured-max-one",
          "pagination-plain-root-control-one-parent"
        ],
        "sqlPhases": [
          "plain-root-api-max1Sql"
        ],
        "active": [
          1,
          2
        ],
        "image": "S09-pagination"
      }
    ]
  }
];
