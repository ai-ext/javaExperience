// 실제 추가 SQLite22상태와 미실행 모델18·원문4상태를 분리한다.
export const d10AssetRoot = "../design/d10-2026-10-21/images/";
export const D10_RUNS = {
  "checks": [
    "original-thirteen-blocks-preserved-unrun",
    "additional-sqlite-runtime-boundary",
    "college-four-relations-fixed-seed",
    "surrogate-pk-and-two-business-unique-keys",
    "required-column-not-null-rejections",
    "course-and-offering-business-rules",
    "enrollment-pair-fk-and-status-checks",
    "rejected-writes-preserve-college-seed",
    "nullable-unique-versus-required-unique-toy",
    "independent-customer-order-seed",
    "additional-left-on-intermediate-counts",
    "right-paid-where-removes-unmatched-customers",
    "translated-final-having-keeps-paid-customer-only",
    "translated-exists-has-no-status-filter",
    "guarded-write-501-one-zero-zero-and-paid-row",
    "sqlite-wal-uncommitted-change-hidden",
    "sqlite-wal-commit-visible-to-new-read",
    "sqlite-wal-read-snapshot-until-transaction-end",
    "sqlite-begin-immediate-writer-contention-busy",
    "sqlite-rollback-preserves-previous-state",
    "guarded-stock-update-one-then-zero",
    "sqlite-eqp-before-index-observed-scan",
    "sqlite-eqp-added-index-observed-search",
    "sqlite-eqp-drop-restore-and-results-match",
    "all-own-connections-fk-on-and-integrity-clean",
    "all-owned-sqlite-connections-closed",
    "own-files-runtime-and-source-fixtures-preserved"
  ],
  "facts": {
    "original-thirteen-blocks-preserved-unrun": {
      "sourceSHA256": "05e6f3eabfeb1d915d88a79a6cda1da555f05744285247b74539de16a9ee7226",
      "lines": 449,
      "blocks": 13,
      "originalSQLExecuted": false,
      "originalPostgreSQLMySQLDockerJava25CommandsExecuted": false,
      "scope": "original PostgreSQL DDL/query and distinct MySQL sample kept as bytes, not run or treated as one equivalent constraint schema"
    },
    "additional-sqlite-runtime-boundary": {
      "python": "3.14.3",
      "sqlite": "3.53.0",
      "sqliteOnly": true,
      "postgresqlMySQLDockerJava25Executed": false,
      "originalCommandsExecuted": false,
      "networkOrExistingServiceAccess": false,
      "scope": "explicitly translated additional own-file SQLite examples, not source PostgreSQL DDL/isolation/EXPLAIN certification"
    },
    "college-four-relations-fixed-seed": {
      "rows": {
        "student": [
          [
            1,
            "CAMPUS-001",
            "student-a@example.test",
            "학생A"
          ],
          [
            2,
            "CAMPUS-002",
            "student-b@example.test",
            "학생B"
          ]
        ],
        "course": [
          [
            1,
            "DB101",
            "Database Basics"
          ]
        ],
        "offering": [
          [
            10,
            1,
            "2026-FALL",
            1
          ],
          [
            11,
            1,
            "2026-FALL",
            2
          ]
        ],
        "enrollment": [
          [
            1,
            10,
            "2026-09-01T09:00:00Z",
            "ENROLLED"
          ]
        ]
      },
      "counts": {
        "student": 2,
        "course": 1,
        "offering": 2,
        "enrollment": 1
      },
      "enrollmentIdentity": [
        "student_id",
        "offering_id"
      ],
      "businessKeySeparateFromSurrogate": true,
      "scope": "additional fixed seed; not practice data or PostgreSQL original seed"
    },
    "surrogate-pk-and-two-business-unique-keys": {
      "attempts": [
        {
          "case": "student-pk",
          "rejected": true,
          "sql": "INSERT INTO student VALUES(?,?,?,?)",
          "bindings": [
            1,
            "CAMPUS-003",
            "student-c@example.test",
            "학생C"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_PRIMARYKEY",
          "sqliteErrorCode": 1555,
          "message": "UNIQUE constraint failed: student.id"
        },
        {
          "case": "student-campus-uk",
          "rejected": true,
          "sql": "INSERT INTO student VALUES(?,?,?,?)",
          "bindings": [
            3,
            "CAMPUS-001",
            "student-c@example.test",
            "학생C"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_UNIQUE",
          "sqliteErrorCode": 2067,
          "message": "UNIQUE constraint failed: student.campus_no"
        },
        {
          "case": "student-email-uk",
          "rejected": true,
          "sql": "INSERT INTO student VALUES(?,?,?,?)",
          "bindings": [
            3,
            "CAMPUS-003",
            "student-a@example.test",
            "학생C"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_UNIQUE",
          "sqliteErrorCode": 2067,
          "message": "UNIQUE constraint failed: student.email"
        }
      ],
      "scope": "SQLite duplicate PK/campus_no/email checks; surrogate id alone does not enforce business uniqueness"
    },
    "required-column-not-null-rejections": {
      "attempts": [
        {
          "case": "student-name-not-null",
          "rejected": true,
          "sql": "INSERT INTO student VALUES(?,?,?,?)",
          "bindings": [
            3,
            "CAMPUS-003",
            "student-c@example.test",
            null
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_NOTNULL",
          "sqliteErrorCode": 1299,
          "message": "NOT NULL constraint failed: student.name"
        },
        {
          "case": "enrollment-time-not-null",
          "rejected": true,
          "sql": "INSERT INTO enrollment VALUES(?,?,?,?)",
          "bindings": [
            2,
            11,
            null,
            "ENROLLED"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_NOTNULL",
          "sqliteErrorCode": 1299,
          "message": "NOT NULL constraint failed: enrollment.enrolled_at"
        }
      ],
      "scope": "these tested required columns only; no claim of all SQLite/PG type equivalence"
    },
    "course-and-offering-business-rules": {
      "attempts": [
        {
          "case": "course-code-uk",
          "rejected": true,
          "sql": "INSERT INTO course VALUES(?,?,?)",
          "bindings": [
            2,
            "DB101",
            "Other title"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_UNIQUE",
          "sqliteErrorCode": 2067,
          "message": "UNIQUE constraint failed: course.course_code"
        },
        {
          "case": "offering-three-column-uk",
          "rejected": true,
          "sql": "INSERT INTO offering VALUES(?,?,?,?)",
          "bindings": [
            12,
            1,
            "2026-FALL",
            1
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_UNIQUE",
          "sqliteErrorCode": 2067,
          "message": "UNIQUE constraint failed: offering.course_id, offering.term_code, offering.section_no"
        },
        {
          "case": "offering-missing-course",
          "rejected": true,
          "sql": "INSERT INTO offering VALUES(?,?,?,?)",
          "bindings": [
            12,
            999,
            "2026-FALL",
            3
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_FOREIGNKEY",
          "sqliteErrorCode": 787,
          "message": "FOREIGN KEY constraint failed"
        },
        {
          "case": "offering-section-zero",
          "rejected": true,
          "sql": "INSERT INTO offering VALUES(?,?,?,?)",
          "bindings": [
            12,
            1,
            "2026-FALL",
            0
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_CHECK",
          "sqliteErrorCode": 275,
          "message": "CHECK constraint failed: section_no > 0"
        }
      ],
      "offeringUniqueColumns": [
        "course_id",
        "term_code",
        "section_no"
      ]
    },
    "enrollment-pair-fk-and-status-checks": {
      "attempts": [
        {
          "case": "enrollment-duplicate-pair",
          "rejected": true,
          "sql": "INSERT INTO enrollment VALUES(?,?,?,?)",
          "bindings": [
            1,
            10,
            "2026-09-02T09:00:00Z",
            "ENROLLED"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_PRIMARYKEY",
          "sqliteErrorCode": 1555,
          "message": "UNIQUE constraint failed: enrollment.student_id, enrollment.offering_id"
        },
        {
          "case": "enrollment-missing-student",
          "rejected": true,
          "sql": "INSERT INTO enrollment VALUES(?,?,?,?)",
          "bindings": [
            999,
            10,
            "2026-09-02T09:00:00Z",
            "ENROLLED"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_FOREIGNKEY",
          "sqliteErrorCode": 787,
          "message": "FOREIGN KEY constraint failed"
        },
        {
          "case": "enrollment-missing-offering",
          "rejected": true,
          "sql": "INSERT INTO enrollment VALUES(?,?,?,?)",
          "bindings": [
            2,
            999,
            "2026-09-02T09:00:00Z",
            "ENROLLED"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_FOREIGNKEY",
          "sqliteErrorCode": 787,
          "message": "FOREIGN KEY constraint failed"
        },
        {
          "case": "enrollment-bad-status",
          "rejected": true,
          "sql": "INSERT INTO enrollment VALUES(?,?,?,?)",
          "bindings": [
            2,
            11,
            "2026-09-02T09:00:00Z",
            "WAITING"
          ],
          "sqliteErrorName": "SQLITE_CONSTRAINT_CHECK",
          "sqliteErrorCode": 275,
          "message": "CHECK constraint failed: status IN ('ENROLLED', 'DROPPED')"
        }
      ],
      "scope": "same student/offering pair once; missing parent and tested bad status rejected"
    },
    "rejected-writes-preserve-college-seed": {
      "before": {
        "student": [
          [
            1,
            "CAMPUS-001",
            "student-a@example.test",
            "학생A"
          ],
          [
            2,
            "CAMPUS-002",
            "student-b@example.test",
            "학생B"
          ]
        ],
        "course": [
          [
            1,
            "DB101",
            "Database Basics"
          ]
        ],
        "offering": [
          [
            10,
            1,
            "2026-FALL",
            1
          ],
          [
            11,
            1,
            "2026-FALL",
            2
          ]
        ],
        "enrollment": [
          [
            1,
            10,
            "2026-09-01T09:00:00Z",
            "ENROLLED"
          ]
        ]
      },
      "after": {
        "student": [
          [
            1,
            "CAMPUS-001",
            "student-a@example.test",
            "학생A"
          ],
          [
            2,
            "CAMPUS-002",
            "student-b@example.test",
            "학생B"
          ]
        ],
        "course": [
          [
            1,
            "DB101",
            "Database Basics"
          ]
        ],
        "offering": [
          [
            10,
            1,
            "2026-FALL",
            1
          ],
          [
            11,
            1,
            "2026-FALL",
            2
          ]
        ],
        "enrollment": [
          [
            1,
            10,
            "2026-09-01T09:00:00Z",
            "ENROLLED"
          ]
        ]
      },
      "unchanged": true,
      "trialRollbackSafety": true
    },
    "nullable-unique-versus-required-unique-toy": {
      "nullableRows": [
        [
          1,
          null
        ],
        [
          2,
          null
        ]
      ],
      "requiredRows": [
        [
          1,
          "alpha"
        ]
      ],
      "nullRejection": {
        "case": "required-unique-null",
        "rejected": true,
        "sql": "INSERT INTO required_unique VALUES(?,?)",
        "bindings": [
          2,
          null
        ],
        "sqliteErrorName": "SQLITE_CONSTRAINT_NOTNULL",
        "sqliteErrorCode": 1299,
        "message": "NOT NULL constraint failed: required_unique.token"
      },
      "duplicateRejection": {
        "case": "required-unique-duplicate",
        "rejected": true,
        "sql": "INSERT INTO required_unique VALUES(?,?)",
        "bindings": [
          2,
          "alpha"
        ],
        "sqliteErrorName": "SQLITE_CONSTRAINT_UNIQUE",
        "sqliteErrorCode": 2067,
        "message": "UNIQUE constraint failed: required_unique.token"
      },
      "scope": "separate SQLite3.53 toy, not student keys and not a cross-product NULL uniqueness rule"
    },
    "independent-customer-order-seed": {
      "customers": [
        [
          1,
          "ada@example.test",
          "2026-01-01T00:00:00Z"
        ],
        [
          2,
          "bob@example.test",
          "2026-01-02T00:00:00Z"
        ],
        [
          3,
          "cy@example.test",
          "2026-01-03T00:00:00Z"
        ]
      ],
      "orders": [
        [
          10,
          1,
          "PAID",
          125,
          "2026-09-02T10:00:00Z"
        ],
        [
          11,
          1,
          "PAID",
          75,
          "2026-08-20T10:00:00Z"
        ],
        [
          12,
          1,
          "PENDING",
          50,
          "2026-09-03T10:00:00Z"
        ],
        [
          20,
          2,
          "CANCELLED",
          25,
          "2026-09-04T10:00:00Z"
        ]
      ],
      "scope": "independent additional SQLite fixed ISO seed; original TIMESTAMPTZ/DATE arithmetic and DECIMAL precision unrun"
    },
    "additional-left-on-intermediate-counts": {
      "rows": [
        [
          1,
          "ada@example.test",
          2,
          2,
          200
        ],
        [
          2,
          "bob@example.test",
          1,
          0,
          0
        ],
        [
          3,
          "cy@example.test",
          1,
          0,
          0
        ]
      ],
      "columns": [
        "id",
        "email",
        "count_star",
        "order_count",
        "paid_total"
      ],
      "cutoff": "2026-01-01T00:00:00Z",
      "scope": "additional intermediate/query variant: original HAVING removed and COUNT(*) added; unmatched customers remain; not original final HAVING result"
    },
    "right-paid-where-removes-unmatched-customers": {
      "rows": [
        [
          1,
          "ada@example.test",
          2,
          2,
          200
        ]
      ],
      "scope": "additional SQLite comparison variant; moving right PAID condition to WHERE removes null-extended rows"
    },
    "translated-final-having-keeps-paid-customer-only": {
      "rows": [
        [
          1,
          "ada@example.test",
          2,
          200
        ]
      ],
      "columns": [
        "id",
        "email",
        "order_count",
        "paid_total"
      ],
      "scope": "SQLite translation of original final HAVING>=1 query; customer1 only; fixed ISO bind replaces PostgreSQL DATE literal"
    },
    "translated-exists-has-no-status-filter": {
      "rows": [
        [
          1,
          "ada@example.test"
        ],
        [
          2,
          "bob@example.test"
        ]
      ],
      "cutoff": "2026-09-01T00:00:00Z",
      "statusPredicatePresent": false,
      "observerIDOrderAdded": true,
      "scope": "SQLite fixed ISO comparison; customer2 qualifies via CANCELLED order; no PostgreSQL timestamp arithmetic executed"
    },
    "guarded-write-501-one-zero-zero-and-paid-row": {
      "updateRowcounts": [
        1,
        0
      ],
      "deleteRowcount": 0,
      "row501": [
        [
          501,
          1,
          "PAID",
          25000,
          "2026-10-01T12:00:00Z"
        ]
      ],
      "scope": "additional SQLite translation; explicit fixed ISO replaces source CURRENT_TIMESTAMP; SQLite cursor rowcounts, not MySQL affected-row mode"
    },
    "sqlite-wal-uncommitted-change-hidden": {
      "journalModes": {
        "writer": "wal",
        "observer": "wal"
      },
      "sameOwnDatabaseFile": true,
      "writerUncommittedValue": 20,
      "otherConnectionValue": 10,
      "scope": "controlled two-connection SQLite WAL case, not PostgreSQL/MySQL isolation or row-lock certification"
    },
    "sqlite-wal-commit-visible-to-new-read": {
      "otherConnectionNewRead": 20,
      "previousUncommittedRead": 10,
      "writerCommitCompleted": true
    },
    "sqlite-wal-read-snapshot-until-transaction-end": {
      "readerFirst": 20,
      "readerAfterOtherCommit": 20,
      "readerAfterTransactionEndNewRead": 30,
      "scope": "SQLite WAL read snapshot only; no PostgreSQL READ COMMITTED/InnoDB REPEATABLE READ execution"
    },
    "sqlite-begin-immediate-writer-contention-busy": {
      "secondWriterError": {
        "name": "SQLITE_BUSY",
        "code": 5,
        "message": "database is locked"
      },
      "timeoutSeconds": 0,
      "writerUncommittedValue": 40,
      "otherConnectionRead": 30,
      "scope": "SQLite single-writer contention, not a row lock, PostgreSQL deadlock or waiting-time measurement"
    },
    "sqlite-rollback-preserves-previous-state": {
      "writerObserverAfterRollback": [
        30,
        30
      ],
      "uncommitted40Persisted": false
    },
    "guarded-stock-update-one-then-zero": {
      "initialStock": 5,
      "requestedQuantityEach": 3,
      "rowcounts": [
        1,
        0
      ],
      "finalOtherConnectionQuantity": 2,
      "scope": "two sequential guarded statements in own writer transaction; not a concurrent load/oversell proof"
    },
    "sqlite-eqp-before-index-observed-scan": {
      "seedRows": 512,
      "querySQL": "-- 추가 disposable SQLite 표의 같은 SELECT. PG DATE/INTERVAL 실행이 아니다.\nSELECT id, status FROM orders\nWHERE customer_id = ? AND created_at >= ?\nORDER BY created_at, id;\n",
      "bindings": [
        1,
        "2026-09-15T00:00:00Z"
      ],
      "observed": {
        "phase": "before-index",
        "eqpRawTuples": [
          [
            3,
            0,
            216,
            "SCAN orders"
          ],
          [
            15,
            0,
            0,
            "USE TEMP B-TREE FOR ORDER BY"
          ]
        ],
        "results": [
          [
            1016,
            "PAID"
          ],
          [
            1128,
            "PAID"
          ],
          [
            1240,
            "PENDING"
          ],
          [
            1352,
            "PAID"
          ],
          [
            1464,
            "PAID"
          ],
          [
            1048,
            "PENDING"
          ],
          [
            1160,
            "PAID"
          ],
          [
            1272,
            "PAID"
          ],
          [
            1384,
            "PENDING"
          ],
          [
            1496,
            "PAID"
          ],
          [
            1080,
            "PAID"
          ],
          [
            1192,
            "PENDING"
          ],
          [
            1304,
            "PAID"
          ],
          [
            1416,
            "PAID"
          ]
        ],
        "indexNames": []
      },
      "scope": "actual SQLite3.53 EQP tuples only; no PostgreSQL cost/ms/EXPLAIN ANALYZE/physical examined-row claim"
    },
    "sqlite-eqp-added-index-observed-search": {
      "observed": {
        "phase": "after-index",
        "eqpRawTuples": [
          [
            4,
            0,
            51,
            "SEARCH orders USING INDEX orders_customer_created_idx (customer_id=? AND created_at>?)"
          ]
        ],
        "results": [
          [
            1016,
            "PAID"
          ],
          [
            1128,
            "PAID"
          ],
          [
            1240,
            "PENDING"
          ],
          [
            1352,
            "PAID"
          ],
          [
            1464,
            "PAID"
          ],
          [
            1048,
            "PENDING"
          ],
          [
            1160,
            "PAID"
          ],
          [
            1272,
            "PAID"
          ],
          [
            1384,
            "PENDING"
          ],
          [
            1496,
            "PAID"
          ],
          [
            1080,
            "PAID"
          ],
          [
            1192,
            "PENDING"
          ],
          [
            1304,
            "PAID"
          ],
          [
            1416,
            "PAID"
          ]
        ],
        "indexNames": [
          "orders_customer_created_idx"
        ]
      },
      "sameResultsAsBefore": true,
      "optimizerHintUsed": false,
      "scope": "this SQLite data/version chose SEARCH; no INDEXED BY, PostgreSQL plan or speed inference"
    },
    "sqlite-eqp-drop-restore-and-results-match": {
      "afterDrop": {
        "phase": "after-drop",
        "eqpRawTuples": [
          [
            3,
            0,
            216,
            "SCAN orders"
          ],
          [
            15,
            0,
            0,
            "USE TEMP B-TREE FOR ORDER BY"
          ]
        ],
        "results": [
          [
            1016,
            "PAID"
          ],
          [
            1128,
            "PAID"
          ],
          [
            1240,
            "PENDING"
          ],
          [
            1352,
            "PAID"
          ],
          [
            1464,
            "PAID"
          ],
          [
            1048,
            "PENDING"
          ],
          [
            1160,
            "PAID"
          ],
          [
            1272,
            "PAID"
          ],
          [
            1384,
            "PENDING"
          ],
          [
            1496,
            "PAID"
          ],
          [
            1080,
            "PAID"
          ],
          [
            1192,
            "PENDING"
          ],
          [
            1304,
            "PAID"
          ],
          [
            1416,
            "PAID"
          ]
        ],
        "indexNames": []
      },
      "afterRestore": {
        "phase": "after-restore",
        "eqpRawTuples": [
          [
            4,
            0,
            51,
            "SEARCH orders USING INDEX orders_customer_created_idx (customer_id=? AND created_at>?)"
          ]
        ],
        "results": [
          [
            1016,
            "PAID"
          ],
          [
            1128,
            "PAID"
          ],
          [
            1240,
            "PENDING"
          ],
          [
            1352,
            "PAID"
          ],
          [
            1464,
            "PAID"
          ],
          [
            1048,
            "PENDING"
          ],
          [
            1160,
            "PAID"
          ],
          [
            1272,
            "PAID"
          ],
          [
            1384,
            "PENDING"
          ],
          [
            1496,
            "PAID"
          ],
          [
            1080,
            "PAID"
          ],
          [
            1192,
            "PENDING"
          ],
          [
            1304,
            "PAID"
          ],
          [
            1416,
            "PAID"
          ]
        ],
        "indexNames": [
          "orders_customer_created_idx"
        ]
      },
      "allFourResultsIdentical": true,
      "scope": "own disposable SQLite index drop/restore only; cached_statements=0 avoids stale prepared EQP; no MySQL invisible index or performance measurement"
    },
    "all-own-connections-fk-on-and-integrity-clean": {
      "foreignKeysPragma": {
        "college": 1,
        "commerce": 1,
        "writer": 1,
        "observer": 1,
        "plans": 1
      },
      "foreignKeyCheck": {
        "college": [],
        "commerce": [],
        "writer": [],
        "observer": [],
        "plans": []
      },
      "integrity": {
        "college": "ok",
        "commerce": "ok",
        "writer": "ok",
        "observer": "ok",
        "plans": "ok"
      },
      "databaseFiles": 4,
      "connections": 5,
      "scope": "these own SQLite files/connections only; no existing database checked"
    },
    "all-owned-sqlite-connections-closed": {
      "closedAliases": {
        "college": true,
        "commerce": true,
        "writer": true,
        "observer": true,
        "plans": true
      },
      "allOwnedConnectionsClosed": true,
      "longRunningProcessesOrServicePortsStarted": 0,
      "existingServicesOrPracticeTouched": false
    },
    "own-files-runtime-and-source-fixtures-preserved": {
      "runMode": "0700",
      "fixtureFiles": [
        {
          "file": "college-sqlite.sql",
          "sha256": "49959a53613e0ae8bb558c8bab576fa596778316dc5bd3a2eaf1b6deb938cd71"
        },
        {
          "file": "commerce-sqlite.sql",
          "sha256": "2425a4fd79f3585f779adfbff57c70c51c4a1830c800075e8d56d98610730d90"
        },
        {
          "file": "exists-recent.sql",
          "sha256": "c0bd0acb11bb90c5469c59085608bfa567bb87cf534e00aa69f24dfa99f425e4"
        },
        {
          "file": "having-paid.sql",
          "sha256": "b69b6604a64c23f65e2cf429949c0b620996f5fa6c22aa828733386c5acdaace"
        },
        {
          "file": "left-on-paid.sql",
          "sha256": "49fbec83301aec88608afc2b3e26f9a6c453f6eee95d44f0487027ba3578521a"
        },
        {
          "file": "plan-query.sql",
          "sha256": "45f50cc95516dbade5403f161127607b2dc51b342d8bdb21f5186635d4038b6d"
        },
        {
          "file": "seeds.json",
          "sha256": "c1f4644c7ed14e1fc451e2f34ffba43553de224e2505173576025502f5ed9f37"
        },
        {
          "file": "sqlite_probe.py",
          "sha256": "60d2858b64d483374c491676fc67817433758015677631b8fcbee1b508e572c0"
        },
        {
          "file": "where-paid.sql",
          "sha256": "5a3dd74e40946dcb3b0440fda3a6e743a1dc5912dc6f9ddf093b93a0a887b295"
        }
      ],
      "allFixtureSHA256Matched": true,
      "sourceSHA256": "05e6f3eabfeb1d915d88a79a6cda1da555f05744285247b74539de16a9ee7226",
      "ownDatabaseFiles": 4,
      "allOwnedConnectionsClosed": true,
      "networkOrExistingServiceAccess": false,
      "practiceOrLearnerSourceModified": false
    }
  },
  "models": {
    "relational-model": {
      "executed": false,
      "scope": "원문 업무 규칙과 관계/키/정규화 문헌 모델. 추가 SQLite 거부 관찰은 별도 facts, PG18 DDL 실행 아님.",
      "entities": [
        {
          "entity": "student",
          "identity": "id 대리 PK",
          "businessRules": [
            "campus_no NOT NULL UNIQUE",
            "email NOT NULL UNIQUE"
          ],
          "meaning": "학생 한 명"
        },
        {
          "entity": "course",
          "identity": "id 대리 PK",
          "businessRules": [
            "course_code NOT NULL UNIQUE"
          ],
          "meaning": "과목 한 종류"
        },
        {
          "entity": "offering",
          "identity": "id 대리 PK",
          "businessRules": [
            "course_id FK",
            "UNIQUE(course_id,term_code,section_no)",
            "section_no > 0 / NOT NULL"
          ],
          "meaning": "과목의 학기별 개설 분반"
        },
        {
          "entity": "enrollment",
          "identity": "PRIMARY KEY(student_id,offering_id)",
          "businessRules": [
            "두 열 NOT NULL FK",
            "enrolled_at NOT NULL",
            "status ENROLLED/DROPPED"
          ],
          "meaning": "학생-분반 신청 사실 한 행"
        }
      ],
      "cardinality": [
        "course1 → offering0..N; 각offering은course1",
        "student1 → enrollment0..N; 각enrollment는student1",
        "offering1 → enrollment0..N; 각enrollment는offering1",
        "student와offering의N:M을enrollment두1:N으로푼다"
      ],
      "identityBoundary": [
        "대리 PK는 학번/이메일/개설 중복 방지 규칙을 대신하지 않음",
        "학생-분반 한 쌍의 한 행만 보존한다는 원문 가정; 재신청별 이력이 필요하면 attempt 등 업무 식별부터 재정의",
        "명사/테이블 이름만으로 키·카디널리티를 확정하지 않음"
      ],
      "constraints": {
        "pgPrimaryKey": "하나의 PK 제약은 단일/복합열의유일성+NOT NULL;여러UK별도",
        "pgUniqueNull": "기본NULLS DISTINCT;NULLS NOT DISTINCT옵션과NOT NULL은다른규칙",
        "pgCheck": "true또는NULL/unknown은통과;false거부;필수존재는NOT NULL별도",
        "pgForeignKey": "부모PK/적합한UNIQUE/비부분고유index참조;자식nullable참조의회피를막으려면NOT NULL조건",
        "childIndex": "PGFK는자식index자동생성안함;MySQL/InnoDB는필요선두FKindex없으면자동생성할수있음;검색설계까지완료아님"
      },
      "normalization": {
        "practical1NF": "원문은 검색·검증할 반복값/반복 열을 별도 관계로 검토하는 실무 요약이다. 선언한 속성·도메인과 업무 의미를 먼저 정한다.",
        "candidateKey": "행을식별하는최소superkey;선택한PK외다른candidatekey도고려",
        "primeAttribute": "어느candidatekey에라도포함되는속성;superkey포함만으로판단하지않음",
        "secondNormalForm": "관계/1NF를전제로모든candidatekey의proper subset X가비주요속성A를결정하는부분종속X→A가없어야함",
        "thirdNormalForm": "모든비자명FD X→A에서X가superkey이거나A가prime attribute여야함;prime예외를제거한BCNF와다름",
        "partialExample": {
          "assumption": "주문별상품한번이면(order_id,product_id)를candidatekey로가정",
          "dependency": "product_id → product_name",
          "problem": "비주요product_name이복합candidatekey일부에만종속될때갱신중복",
          "boundary": "같은상품여러주문줄허용이면키가정부터재검토"
        },
        "transitiveExample": {
          "assumption": "employee_id → department_id → department_name, department_id가superkey아니고name이nonprime",
          "separate": "department(department_id,department_name)로업무종속을별도보존",
          "boundary": "단순비키→비키금지만으로3NF전체정의를대신하지않음"
        },
        "priceSnapshot": "현재상품가격과거래당시합의단가는다른시점의사실;차이가있다고자동정규화오류아님. 통화/세금/할인/갱신주체정의"
      },
      "translation": [
        "추가SQLiteINTEGER PK는rowid alias,PGIDENTITY/BIGINT검증아님",
        "TEXT는VARCHAR길이/TIMESTAMPTZtimezone검증아님;NUMERICaffinity는PGNUMERIC(12,2)정밀도검증아님",
        "SQLite복합PK의NOT NULL명시와연결마다foreign_keys=ON확인",
        "원문MySQLblock11은FK/CHECK를선언하지않아PG원문과같은제약DDL아님"
      ],
      "sources": [
        "https://www.postgresql.org/docs/18/ddl-constraints.html",
        "https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html",
        "https://dev.mysql.com/doc/refman/8.4/en/create-index.html",
        "https://ranger.uta.edu/~cli/lecnotes/notes-db-normalization.pdf"
      ]
    },
    "query-semantics": {
      "executed": false,
      "scope": "SQL 의미·원문/추가query 경계 모델. nativeSQLite의실제rows/changes는별도facts.",
      "pipeline": [
        "FROM/JOIN·ON으로관계구성",
        "WHERE는true인행만남김(false/NULL제거)",
        "GROUP BY/aggregate로그룹계산",
        "HAVING은조건만족그룹만남김",
        "SELECT결과열/DISTINCT/ORDER BY등후속단계;원문순서보장여부따로"
      ],
      "datePredicates": {
        "paidAggregate": "c.created_at >= DATE 2026-01-01은고객생성시각필터,ON은o.status=PAID만;주문/결제일이후조건없음",
        "recentExists": "o.created_at >= TIMESTAMP 2026-09-01은주문시각필터;status조건없음",
        "sourceCorrection": "REPORT의그이후결제된표현을주문날짜필터로해석하지않음"
      },
      "leftJoin": {
        "on": "미매칭왼쪽행은오른쪽NULL로확장",
        "where": "오른쪽status=PAID를WHERE에두면NULL확장행은UNKNOWN으로제거",
        "having": "원문최종COUNT(o.id)>=1은주문0고객을제외;0고객남는추가중간query와다름",
        "count": "COUNT(*)는확장행포함입력행수,COUNT(o.id)는nonnull id수;emptySUM은NULL/COALESCE0정책"
      },
      "exists": {
        "meaning": "서브query한행이상존재여부;outer각행은여러matching주문만큼곱해지지않음",
        "status": "원문엔PAID조건없어최근CANCELLED도조건맞으면포함",
        "execution": "SELECT1관례,전체서브query실행·roworder를보장하지않음"
      },
      "mutation": {
        "guard": "id와기대상태를같은UPDATE WHERE에둠",
        "zero": "ID없음/상태변경/조건불일치등여러원인;0만으로원인확정아님",
        "source501": "원문PENDING INSERT뒤PAID UPDATE;CANCELLED조건DELETE는그상태에맞지않아0일수있음",
        "uniqueness": "app존재先조회만으로동시중복보장안됨;DBPK/UK와충돌처리필요",
        "engineCount": "추가SQLitecursorrowcount를다른제품·API·client설정의affected/matched count와같게일반화하지않음;trigger실행미검증"
      },
      "ordering": "ORDER BY없는결과순서보장없음;정렬동률은명시tie-breaker가필요. 추가observerid정렬은원문순서보장의증거아님",
      "sources": [
        "https://www.postgresql.org/docs/18/sql-select.html",
        "https://www.postgresql.org/docs/18/queries-table-expressions.html",
        "https://www.postgresql.org/docs/18/functions-aggregate.html",
        "https://www.postgresql.org/docs/18/functions-subquery.html",
        "https://www.postgresql.org/docs/18/sql-update.html"
      ]
    },
    "plans-indexes": {
      "executed": false,
      "scope": "PG18/engine차이문헌모델;추가SQLite512행EQP관찰은별도facts,대량성능/PGANALYZE실측아님.",
      "pgExplain": {
        "tree": "스캔노드출력이join/sort/aggregate상위노드로전달",
        "cost": "arbitraryplanner비용단위,ms아님;상위cost에는child비용포함",
        "rows": "노드의추정OUTPUT행수;물리읽은행/필터전입력행수와다름",
        "width": "추정평균출력행크기bytes",
        "analyze": "EXPLAIN ANALYZE는문장을실제실행;DML효과발생가능",
        "buffers": "hit/read등buffer관측과모든물리I/O·walltime은같지않음",
        "original": "원문직접명령은EXPLAIN뿐;지시문의실제시간요청을그명령출력으로지어내지않음"
      },
      "multicolumn": {
        "index": "B-tree(customer_id,created_at)",
        "typical": "선두등가+다음범위조건이검색범위를줄이는전형",
        "skipScan": "PG18은선두다른값수·분포/비용에따라후속열조건으로skipscan가능;선두없으면절대불가/항상효율둘다아님",
        "choice": "작은표/낮은선택도/통계·편향·정렬·쓰기공간비용으로계획선택"
      },
      "covering": {
        "include": "INCLUDE payload는반환값용,검색키나unique판정키와구분",
        "visibility": "필요열/indexmethod조건후에도MVCC visibilitymap에따라heap접근가능;필요열모두있음≠heap0보장"
      },
      "sqliteEQP": {
        "kind": "SQLite자체계획설명/interactive debugging;버전별format변경가능",
        "scanSearch": "SCAN은전체/index순회포함,SEARCH는subset탐색;detail에index/조건표시",
        "opaque": "추가rawtuple3번째216/51등을PGcost/rows/ms로해석하지않음",
        "result": "별도SELECT반환14행과EQP의물리스캔/시간측정은다름",
        "comparison": "같은data/query/bind/resultorder를보존하고index전후/drop/복원비교;SEARCH선택은속도향상증거아님"
      },
      "sources": [
        "https://www.postgresql.org/docs/18/using-explain.html",
        "https://www.postgresql.org/docs/18/indexes-multicolumn.html",
        "https://www.postgresql.org/docs/18/indexes-index-only-scans.html",
        "https://www.sqlite.org/eqp.html"
      ]
    },
    "transactions-locks": {
      "executed": false,
      "scope": "PG/InnoDB설명모델·실행안함;SQLiteWAL/단일writer의추가관찰로제품행락·deadlock인증하지않음.",
      "acid": "원자성/일관성/격리성/지속성은정한DBtransaction경계의성질;외부결제HTTP성공을자동rollback하는경계아님",
      "visibility": [
        {
          "engine": "PostgreSQL18 READ COMMITTED",
          "default": true,
          "snapshot": "각문장시작의committedsnapshot/자기이전미커밋변경은자기연결에보임",
          "writes": "충돌updater대기뒤RCWHERE를새버전에재검증할수있음"
        },
        {
          "engine": "PostgreSQL18 REPEATABLE READ",
          "default": false,
          "snapshot": "첫non-transaction-control문장시점snapshot;BEGIN발행시각과무조건같지않음",
          "writes": "동시변경에serializationfailure발생가능/전체transactionretry필요"
        },
        {
          "engine": "InnoDB8.4 REPEATABLE READ",
          "default": true,
          "snapshot": "일반consistentnonlockingread첫readsnapshot",
          "writes": "locking/currentread·UPDATE는최근상태기준잠금;uniqueexact조건record/range조건gap/next-key등구분"
        }
      ],
      "deadlock": {
        "model": "A가행1보유/행2대기,B가행2보유/행1대기→순환",
        "pgResponse": "detector가관련transaction중하나abort;victim선택고정안함",
        "application": "허용오류·멱등성·외부효과경계확인뒤필요하면전체transaction제한retry;자동모든요청성공아님",
        "prevention": "여러행잠금순서통일/짧은transaction/외부대기경계검토"
      },
      "sqliteBoundary": {
        "connections": "같은새파일의별도연결/WAL,sharedcache/readuncommitted를킨사례아님",
        "read": "자기미커밋과다른연결committed관찰/readeroldsnapshot은실제SQLite한정",
        "writer": "BEGIN IMMEDIATE/timeout0 SQLITE_BUSY는SQLite단일writer경합;PG행락/동시부하/실제deadlock아님",
        "stock": "한ownwritertransaction의순차guardedUPDATE둘은보편적oversell부하증명이아님",
        "python": "native는LEGACYdefault+isolation_levelNone/explicitSQLBEGINCOMMIT;Connection.autocommit추천문헌/엔진격리구분"
      },
      "sources": [
        "https://www.postgresql.org/docs/18/transaction-iso.html",
        "https://www.postgresql.org/docs/18/explicit-locking.html",
        "https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html",
        "https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html",
        "https://www.sqlite.org/isolation.html",
        "https://docs.python.org/3.14/library/sqlite3.html"
      ]
    },
    "connections-operations": {
      "executed": false,
      "scope": "풀/replica/backup/sharding모델,서비스/DBpool/replication/DR를실행하지않음.",
      "pool": {
        "budget": "전체인스턴스별max합+batch/admin/monitoring/reserve를DB한도안에서판단",
        "operation": "보통pool운영에서idle없고max도달시getConnection은설정connectionTimeout까지대기;pool특수상태/구성은별도",
        "diagnosis": "대기시간·긴query/lock/leak·DB포화를함께보고pool크기증가를처리량보장으로읽지않음"
      },
      "specifiedBudget": {
        "kind": "명시산술예시,실제설정/성능아님",
        "databaseMaximum": 120,
        "reserved": 20,
        "applicationInstanceCount": 4,
        "maxPerInstance": 20,
        "applicationMaximumTotal": 80,
        "batch": 10,
        "monitoring": 3,
        "plannedNonReserveTotal": 93,
        "availableAfterReserve": 100,
        "headroomAfterPlan": 7,
        "totalIncludingReserve": 113,
        "additionalInstancesCase": {
          "instances": 6,
          "applicationMaximumTotal": 120,
          "plannedIncludingReserve": 153,
          "overMaximum": 33
        }
      },
      "replica": {
        "primary": "쓰기기준서버,최신읽기는일관성요건에맞는경로선택",
        "async": "commit→전파지연때stale read가능/장애전환시미전파변경손실가능",
        "backup": "삭제/논리오류도전파가능해replica만으로역사백업대체안됨;보관/복원/서비스검증별도"
      },
      "recovery": "RPO허용손실기간/RTO서비스재개기간은목표와복구검증기준;백업파일존재/SQLite행수만으로달성인증안함",
      "sharding": {
        "replication": "같은데이터사본전달",
        "sharding": "키기준서로다른조각배치",
        "cost": "교차shardJOIN/집계/재분배/복구·전역제약조건의복잡성;단일DB부족을측정하지않고필수라고단정안함"
      },
      "sources": [
        "https://github.com/brettwooldridge/HikariCP",
        "https://www.postgresql.org/docs/18/high-availability.html",
        "https://www.postgresql.org/docs/18/backup-dump.html"
      ]
    },
    "product-boundaries": {
      "executed": false,
      "scope": "원문제품·환경을읽는모델. 원문SQL/Java25/Kotlin/JDBC·NoSQL제품미실행.",
      "patterns": [
        {
          "kind": "관계형",
          "question": "관계·제약·조인/transaction요구",
          "boundary": "RDB가JSON/확장기능을지원하지못한다고단정안함"
        },
        {
          "kind": "키값",
          "question": "키중심조회/캐시·만료",
          "boundary": "제품별자료구조·지속성/일관성/기능확인"
        },
        {
          "kind": "문서",
          "question": "중첩문서/문서단위접근·변동구조",
          "boundary": "중복갱신·문서크기·query/validation·transaction조건을제품별확인"
        },
        {
          "kind": "wide-column",
          "question": "분산쓰기/partitionkey중심query",
          "boundary": "임의관계JOIN을같이보장한다고가정안함"
        },
        {
          "kind": "그래프",
          "question": "연결자체의다단계탐색",
          "boundary": "관계의존도와질의/운영조건비교"
        }
      ],
      "mongoCounterexample": {
        "schema": "flexibledefault여도type/range등schemavalidation정책가능",
        "transaction": "다중문서ACIDtransaction지원,read/writeconcern·배치/구성조건검토",
        "limit": "한제품사례를모든NoSQL기능보장으로확대안함;NoSQL=무스키마검증/무transaction단정금지"
      },
      "sourceEnvironment": {
        "postgresql": "원문PostgreSQL18/Docker5432·최소수강DDL·고객주문DDL/EXPLAIN미실행",
        "mysql": "원문MySQL8.4/Docker3306의별도ordersDDL에는FK/CHECK가없음",
        "jvm": "원문Boot4.1.1/Java25/Kotlin설정/properties는미실행,Java앱source없음",
        "versions": "확인시점currentPG18.6/Development19RC1;Python문서3.14.8와실제3.14.3분리",
        "existing": "practice/M1~10/8·9장/L12~14·기존R03/R04native관찰을D10toy/API완료로승계안함"
      },
      "sources": [
        "https://www.mongodb.com/docs/manual/core/transactions/",
        "https://www.mongodb.com/docs/manual/core/schema-validation/",
        "https://www.postgresql.org/docs/18/index.html",
        "docs/knowledge/D10-database-basics.md"
      ]
    }
  }
};
export const D10_ASSETS = {
  "D10-schema": {
    "file": "schema-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "한 번의 신청을 어떤 행으로 저장할까요?",
    "focus": {
      "schema-relations": [
        1,
        10,
        98,
        73
      ],
      "schema-original": [
        1,
        11,
        28,
        30
      ],
      "schema-seed": [
        27,
        49,
        46,
        33
      ]
    }
  },
  "D10-keys": {
    "file": "keys-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "어떤 제약이 잘못된 행을 거부하나요?",
    "focus": {
      "keys-student": [
        1,
        9,
        20,
        83
      ],
      "keys-offering": [
        21,
        9,
        23,
        83
      ],
      "keys-enrollment": [
        45,
        9,
        18,
        83
      ],
      "keys-required": [
        64,
        9,
        17,
        83
      ],
      "keys-preserved": [
        82,
        9,
        17,
        83
      ]
    }
  },
  "D10-null": {
    "file": "null-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "UNIQUE만 있으면 값이 반드시 있나요?",
    "focus": {
      "null-native": [
        1,
        11,
        50,
        76
      ],
      "null-products": [
        52,
        11,
        47,
        76
      ]
    }
  },
  "D10-normalization": {
    "file": "normalization-v3.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "키를 기준으로 무엇이 중복됐나요?",
    "focus": {
      "normalization-keys": [
        1,
        9,
        33,
        80
      ],
      "normalization-partial": [
        35,
        9,
        30,
        80
      ],
      "normalization-transitive": [
        66,
        9,
        33,
        80
      ]
    }
  },
  "D10-join": {
    "file": "join-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "ON·WHERE·HAVING은 누구를 남기나요?",
    "focus": {
      "join-on": [
        1,
        19,
        33,
        70
      ],
      "join-where": [
        35,
        19,
        31,
        70
      ],
      "join-having": [
        67,
        19,
        32,
        70
      ]
    }
  },
  "D10-exists": {
    "file": "exists-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "최근 주문에는 CANCELLED도 포함되나요?",
    "focus": {
      "exists-native": [
        73,
        10,
        26,
        78
      ],
      "exists-predicate": [
        1,
        10,
        98,
        78
      ]
    }
  },
  "D10-mutation": {
    "file": "mutation-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "변경0행이면 어떤 조건을 다시 보나요?",
    "focus": {
      "mutation-update": [
        1,
        10,
        73,
        78
      ],
      "mutation-zero": [
        75,
        10,
        24,
        78
      ]
    }
  },
  "D10-visibility": {
    "file": "visibility-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 DB를 두 연결이 언제 보나요?",
    "focus": {
      "visibility-uncommitted": [
        1,
        10,
        33,
        76
      ],
      "visibility-commit": [
        35,
        10,
        31,
        76
      ],
      "visibility-snapshot": [
        67,
        10,
        32,
        76
      ]
    }
  },
  "D10-contention": {
    "file": "contention-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "다른 writer가 막히면 무엇을 보나요?",
    "focus": {
      "contention-busy": [
        1,
        10,
        35,
        80
      ],
      "contention-rollback": [
        37,
        10,
        30,
        80
      ],
      "contention-guard": [
        68,
        10,
        31,
        80
      ]
    }
  },
  "D10-index": {
    "file": "index-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "인덱스 전후에도 같은 행을 반환하나요?",
    "focus": {
      "index-before": [
        1,
        10,
        24,
        70
      ],
      "index-after": [
        26,
        10,
        24,
        70
      ],
      "index-restore": [
        51,
        10,
        48,
        70
      ]
    }
  },
  "D10-plans": {
    "file": "plans-v2.jpg",
    "width": 1672,
    "height": 940,
    "ready": true,
    "alt": "계획의 숫자는 실행 시간인가요?",
    "focus": {
      "plans-estimate": [
        1,
        10,
        31,
        80
      ],
      "plans-prefix": [
        33,
        10,
        29,
        80
      ],
      "plans-covering": [
        63,
        10,
        36,
        80
      ]
    }
  },
  "D10-isolation": {
    "file": "isolation-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 격리수준 이름이면 같나요?",
    "focus": {
      "isolation-pg-rc": [
        1,
        11,
        24,
        79
      ],
      "isolation-pg-rr": [
        26,
        11,
        24,
        79
      ],
      "isolation-innodb": [
        51,
        11,
        24,
        79
      ],
      "isolation-deadlock": [
        76,
        11,
        23,
        79
      ]
    }
  },
  "D10-operations": {
    "file": "operations-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "풀·복제·샤딩은 무엇을 나누나요?",
    "focus": {
      "operations-pool": [
        1,
        10,
        33,
        80
      ],
      "operations-replica": [
        35,
        10,
        32,
        80
      ],
      "operations-sharding": [
        68,
        10,
        31,
        80
      ]
    }
  },
  "D10-products": {
    "file": "products.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "제품 이름보다 어떤 접근을 요구하나요?",
    "focus": {
      "products-patterns": [
        1,
        11,
        55,
        61
      ],
      "products-mongo": [
        57,
        11,
        42,
        61
      ]
    }
  },
  "D10-original": {
    "file": "original-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 환경과 추가 관찰은 어떻게 다른가요?",
    "focus": {
      "original-postgres": [
        1,
        10,
        34,
        61
      ],
      "original-mysql": [
        36,
        10,
        25,
        61
      ],
      "original-jvm": [
        62,
        10,
        37,
        61
      ]
    }
  }
};
export const D10_LESSONS = [
  {
    "id": "schema",
    "question": "한 번의 신청을 어떤 행으로 저장할까요?",
    "source": "원문 §3.1 · 추가 college seed · 관계 모델",
    "sourceNote": "원문 PostgreSQL18 DDL과 추가 SQLite 번역은 다른 실행 범위입니다. INTEGER rowid alias·TEXT 시각·NUMERIC affinity를 PG IDENTITY/VARCHAR/TIMESTAMPTZ/NUMERIC 정밀도 검증으로 읽지 않습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "schema-relations",
        "title": "학생·과목·개설 분반·신청 사실",
        "lead": "과목과 학기별 분반을 나누고 학생-분반 N:M을 신청의 두 1:N 관계로 풉니다.",
        "values": [
          [
            "관계",
            "course1→offering0..N / student1→enrollment0..N"
          ],
          [
            "신청의 부모",
            "student1 + offering1"
          ],
          [
            "이력 가정",
            "학생-분반 쌍 한 행 · 재신청 이력은 별도 식별 설계"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.relational-model"
        ],
        "code": "[\n  \"course1 → offering0..N; 각offering은course1\",\n  \"student1 → enrollment0..N; 각enrollment는student1\",\n  \"offering1 → enrollment0..N; 각enrollment는offering1\",\n  \"student와offering의N:M을enrollment두1:N으로푼다\"\n]\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.relational-model.cardinality",
        "codeKeys": null,
        "image": "D10-schema"
      },
      {
        "id": "schema-original",
        "title": "원문의 PostgreSQL 제약 DDL",
        "lead": "원문 block03은 PostgreSQL18 예시입니다. 이 DDL을 PostgreSQL 서버에서 실행한 결과로 표시하지 않습니다.",
        "values": [
          [
            "원문 엔진",
            "PostgreSQL18 · 미실행"
          ],
          [
            "id",
            "GENERATED ALWAYS AS IDENTITY"
          ],
          [
            "업무 중복",
            "campus_no/email NOT NULL UNIQUE"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.product-boundaries"
        ],
        "code": "CREATE TABLE student (\n  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,\n  campus_no VARCHAR(20) NOT NULL UNIQUE,\n  email VARCHAR(254) NOT NULL UNIQUE,\n  name VARCHAR(100) NOT NULL\n);\n\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "unrun-source",
        "codePath": "original/block-03.sql",
        "codeKeys": null,
        "image": "D10-schema"
      },
      {
        "id": "schema-seed",
        "title": "추가 SQLite의 네 테이블 seed",
        "lead": "학생2·과목1·분반2·신청1을 별도 파일에 넣었습니다. 기존 practice의 결과나 원문 PG seed가 아닙니다.",
        "values": [
          [
            "실제 행 수",
            "student2 / course1 / offering2 / enrollment1"
          ],
          [
            "신청 쌍",
            "student_id1 / offering_id10 / ENROLLED"
          ],
          [
            "추가 엔진",
            "Python3.14.3 / SQLite3.53.0"
          ]
        ],
        "checks": [
          "original-thirteen-blocks-preserved-unrun",
          "additional-sqlite-runtime-boundary",
          "college-four-relations-fixed-seed"
        ],
        "runKeys": [
          "facts.original-thirteen-blocks-preserved-unrun",
          "facts.additional-sqlite-runtime-boundary",
          "facts.college-four-relations-fixed-seed"
        ],
        "code": "  \"college\": {\n    \"students\": [[1,\"CAMPUS-001\",\"student-a@example.test\",\"학생A\"],[2,\"CAMPUS-002\",\"student-b@example.test\",\"학생B\"]],\n    \"courses\": [[1,\"DB101\",\"Database Basics\"]],\n    \"offerings\": [[10,1,\"2026-FALL\",1],[11,1,\"2026-FALL\",2]],\n    \"enrollments\": [[1,10,\"2026-09-01T09:00:00Z\",\"ENROLLED\"]]\n  },\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/seeds.json",
        "codeKeys": null,
        "image": "D10-schema"
      }
    ]
  },
  {
    "id": "keys",
    "question": "어떤 제약이 잘못된 행을 거부하나요?",
    "source": "추가 SQLite 수강 신청 · 실제13거부 시도",
    "sourceNote": "원문 PostgreSQL18 DDL과 추가 SQLite 번역은 다른 실행 범위입니다. INTEGER rowid alias·TEXT 시각·NUMERIC affinity를 PG IDENTITY/VARCHAR/TIMESTAMPTZ/NUMERIC 정밀도 검증으로 읽지 않습니다. 오류 이름·확장 코드는 SQLite 전용이며 PostgreSQL SQLSTATE/MySQL errno가 아닙니다. 각 시도는 savepoint로 되돌렸습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "keys-student",
        "title": "대리 PK와 두 업무 UNIQUE",
        "lead": "id가 달라도 기존 학번이나 이메일이면 별도 UNIQUE가 거부합니다.",
        "values": [
          [
            "중복 id",
            "SQLITE_CONSTRAINT_PRIMARYKEY /1555"
          ],
          [
            "중복 학번·이메일",
            "SQLITE_CONSTRAINT_UNIQUE /2067"
          ],
          [
            "기존 학생",
            "2행 유지"
          ]
        ],
        "checks": [
          "surrogate-pk-and-two-business-unique-keys"
        ],
        "runKeys": [
          "facts.surrogate-pk-and-two-business-unique-keys"
        ],
        "code": "CREATE TABLE student (\n  id INTEGER PRIMARY KEY,\n  campus_no TEXT NOT NULL UNIQUE,\n  email TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL\n);\nCREATE TABLE course (\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/college-sqlite.sql",
        "codeKeys": null,
        "image": "D10-keys"
      },
      {
        "id": "keys-offering",
        "title": "과목·학기·분반 번호의 조합",
        "lead": "서로 다른 id만으로 같은 개설의 중복을 허용하지 않습니다. 없는 과목과 분반번호0도 각각 다른 규칙이 막습니다.",
        "values": [
          [
            "과목 코드·개설3열 중복",
            "UNIQUE2067"
          ],
          [
            "course_id999",
            "FOREIGNKEY787"
          ],
          [
            "section_no0",
            "CHECK275"
          ]
        ],
        "checks": [
          "course-and-offering-business-rules"
        ],
        "runKeys": [
          "facts.course-and-offering-business-rules"
        ],
        "code": "CREATE TABLE offering (\n  id INTEGER PRIMARY KEY,\n  course_id INTEGER NOT NULL REFERENCES course(id),\n  term_code TEXT NOT NULL,\n  section_no INTEGER NOT NULL CHECK (section_no > 0),\n  UNIQUE (course_id, term_code, section_no)\n);\nCREATE TABLE enrollment (\n",
        "active": [
          2,
          4,
          5
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/college-sqlite.sql",
        "codeKeys": null,
        "image": "D10-keys"
      },
      {
        "id": "keys-enrollment",
        "title": "학생-분반 복합 PK와 두 FK",
        "lead": "(1,10) 중복, 없는 학생/분반, WAITING 상태를 실제로 거부했습니다.",
        "values": [
          [
            "중복 신청 쌍",
            "PRIMARYKEY1555"
          ],
          [
            "없는 부모999",
            "FOREIGNKEY787"
          ],
          [
            "WAITING",
            "CHECK275"
          ]
        ],
        "checks": [
          "enrollment-pair-fk-and-status-checks"
        ],
        "runKeys": [
          "facts.enrollment-pair-fk-and-status-checks"
        ],
        "code": "CREATE TABLE enrollment (\n  student_id INTEGER NOT NULL REFERENCES student(id),\n  offering_id INTEGER NOT NULL REFERENCES offering(id),\n  enrolled_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  status TEXT NOT NULL CHECK (status IN ('ENROLLED', 'DROPPED')),\n  PRIMARY KEY (student_id, offering_id)\n);\n",
        "active": [
          1,
          2,
          4,
          5
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/college-sqlite.sql",
        "codeKeys": null,
        "image": "D10-keys"
      },
      {
        "id": "keys-required",
        "title": "값의 존재는 NOT NULL",
        "lead": "학생 이름과 신청 시각의 NULL을 거부했습니다. 모든 열·타입의 모든 입력을 검사한 범위는 아닙니다.",
        "values": [
          [
            "tested columns",
            "student.name / enrollment.enrolled_at"
          ],
          [
            "NULL 거부",
            "SQLITE_CONSTRAINT_NOTNULL /1299"
          ]
        ],
        "checks": [
          "required-column-not-null-rejections"
        ],
        "runKeys": [
          "facts.required-column-not-null-rejections"
        ],
        "code": "CREATE TABLE student (\n  id INTEGER PRIMARY KEY,\n  campus_no TEXT NOT NULL UNIQUE,\n  email TEXT NOT NULL UNIQUE,\n  name TEXT NOT NULL\n);\nCREATE TABLE course (\n",
        "active": [
          4
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/college-sqlite.sql",
        "codeKeys": null,
        "image": "D10-keys"
      },
      {
        "id": "keys-preserved",
        "title": "거부 뒤 기존 seed는 그대로",
        "lead": "잘못된 쓰기13건을 savepoint 안에서 되돌린 뒤 네 테이블 전체 행이 처음과 같은지 대조했습니다.",
        "values": [
          [
            "전후 행",
            "전체 seed 동일"
          ],
          [
            "관찰 범위",
            "13개 잘못된 시도 · 운영 데이터 아님"
          ]
        ],
        "checks": [
          "rejected-writes-preserve-college-seed"
        ],
        "runKeys": [
          "facts.rejected-writes-preserve-college-seed"
        ],
        "code": "def rejection(label,sql,params):\n    execute('college','SAVEPOINT constraint_trial')\n    try:\n        execute('college',sql,params)\n        result={'case':label,'rejected':False,'sql':sql,'bindings':list(params)}\n    except sqlite3.IntegrityError as error:\n        result={'case':label,'rejected':True,'sql':sql,'bindings':list(params),'sqliteErrorName':error.sqlite_errorname,'sqliteErrorCode':error.sqlite_errorcode,'message':str(error)}\n    finally:\n        execute('college','ROLLBACK TO constraint_trial');execute('college','RELEASE constraint_trial')\n    return result\n\ndef marker(name,**values):\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-keys"
      }
    ]
  },
  {
    "id": "null",
    "question": "UNIQUE만 있으면 값이 반드시 있나요?",
    "source": "별도 NULL toy · PG/MySQL 문헌 비교",
    "sourceNote": "student 업무 키의 NOT NULL을 뺀 실험이 아닙니다. 별도 SQLite 표의 관찰과 다른 제품의 문헌 정책을 분리합니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "null-native",
        "title": "NULL2개와 필수 값의 차이",
        "lead": "nullable_unique는 NULL2개를 허용했습니다. required_unique는 NULL1299와 alpha 중복2067을 거부했습니다.",
        "values": [
          [
            "nullable_unique",
            "(1,NULL), (2,NULL)"
          ],
          [
            "required_unique",
            "(1,alpha) 유지"
          ],
          [
            "NULL / alpha 중복",
            "NOTNULL1299 / UNIQUE2067"
          ]
        ],
        "checks": [
          "nullable-unique-versus-required-unique-toy"
        ],
        "runKeys": [
          "facts.nullable-unique-versus-required-unique-toy"
        ],
        "code": "    execute('college','CREATE TABLE nullable_unique(id INTEGER PRIMARY KEY, token TEXT UNIQUE)')\n    execute('college','CREATE TABLE required_unique(id INTEGER PRIMARY KEY, token TEXT NOT NULL UNIQUE)')\n    execute('college','INSERT INTO nullable_unique VALUES(1,NULL)');execute('college','INSERT INTO nullable_unique VALUES(2,NULL)')\n    execute('college','INSERT INTO required_unique VALUES(1,?)',('alpha',))\n    null_error=rejection('required-unique-null','INSERT INTO required_unique VALUES(?,?)',(2,None))\n    duplicate_error=rejection('required-unique-duplicate','INSERT INTO required_unique VALUES(?,?)',(2,'alpha'))\n    nullable_rows=fetch('college','SELECT * FROM nullable_unique ORDER BY id');required_rows=fetch('college','SELECT * FROM required_unique ORDER BY id')\n    check('nullable-unique-versus-required-unique-toy',nullable_rows==[[1,None],[2,None]] and required_rows==[[1,'alpha']] and null_error['sqliteErrorCode']==1299 and duplicate_error['sqliteErrorCode']==2067,\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-null"
      },
      {
        "id": "null-products",
        "title": "NULL 정책과 존재 조건은 별개",
        "lead": "PG의 NULLS NOT DISTINCT는 유일성 비교 정책이고 NOT NULL은 존재 조건입니다. MySQL의 nullable UNIQUE도 여러 NULL을 허용하는 문헌을 확인했습니다.",
        "values": [
          [
            "PG 일반 UNIQUE",
            "기본 NULLS DISTINCT"
          ],
          [
            "PG 선택 정책",
            "NULLS NOT DISTINCT"
          ],
          [
            "필수 존재",
            "NOT NULL 별도"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.relational-model"
        ],
        "code": "{\n  \"pgUniqueNull\": \"기본NULLS DISTINCT;NULLS NOT DISTINCT옵션과NOT NULL은다른규칙\",\n  \"pgCheck\": \"true또는NULL/unknown은통과;false거부;필수존재는NOT NULL별도\",\n  \"pgPrimaryKey\": \"하나의 PK 제약은 단일/복합열의유일성+NOT NULL;여러UK별도\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.relational-model.constraints",
        "codeKeys": [
          "pgUniqueNull",
          "pgCheck",
          "pgPrimaryKey"
        ],
        "image": "D10-null"
      }
    ]
  },
  {
    "id": "normalization",
    "question": "키를 기준으로 무엇이 중복됐나요?",
    "source": "원문 실무 요약 · UTA 정규화 문헌",
    "sourceNote": "정규화는 미실행 설명 모델입니다. 모든 candidate key와 prime attribute를 고려하며 가격 스냅샷은 현재 가격과 다른 시점의 사실일 수 있습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "normalization-keys",
        "title": "선택한 PK 외 후보키도 본다",
        "lead": "candidate key는 최소 superkey이고 prime 속성은 어느 candidate key에라도 포함됩니다.",
        "values": [
          [
            "candidate key",
            "최소 superkey"
          ],
          [
            "prime attribute",
            "어느 candidate key에라도 포함"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.relational-model"
        ],
        "code": "{\n  \"candidateKey\": \"행을식별하는최소superkey;선택한PK외다른candidatekey도고려\",\n  \"primeAttribute\": \"어느candidatekey에라도포함되는속성;superkey포함만으로판단하지않음\"\n}\n",
        "active": [
          1,
          2
        ],
        "codeKind": "model-json",
        "codePath": "models.relational-model.normalization",
        "codeKeys": [
          "candidateKey",
          "primeAttribute"
        ],
        "image": "D10-normalization"
      },
      {
        "id": "normalization-partial",
        "title": "부분 키에만 종속되면",
        "lead": "(order_id,product_id)를 후보키로 가정할 때 product_id만으로 결정되는 비주요 product_name의 부분 종속을 살핍니다.",
        "values": [
          [
            "2NF 기준",
            "모든 후보키의 proper subset과 비주요 속성"
          ],
          [
            "가정부터",
            "같은 상품의 여러 주문 줄이면 키 재검토"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.relational-model"
        ],
        "code": "{\n  \"secondNormalForm\": \"관계/1NF를전제로모든candidatekey의proper subset X가비주요속성A를결정하는부분종속X→A가없어야함\",\n  \"partialExample\": {\n    \"assumption\": \"주문별상품한번이면(order_id,product_id)를candidatekey로가정\",\n    \"dependency\": \"product_id → product_name\",\n    \"problem\": \"비주요product_name이복합candidatekey일부에만종속될때갱신중복\",\n    \"boundary\": \"같은상품여러주문줄허용이면키가정부터재검토\"\n  }\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.relational-model.normalization",
        "codeKeys": [
          "secondNormalForm",
          "partialExample"
        ],
        "image": "D10-normalization"
      },
      {
        "id": "normalization-transitive",
        "title": "3NF 조건과 거래 당시 사실",
        "lead": "비자명 X→A에서 X가 superkey이거나 A가 prime이어야 합니다. 현재 상품 가격과 합의 단가의 의미·시점도 구분합니다.",
        "values": [
          [
            "3NF",
            "X superkey OR A prime"
          ],
          [
            "가격 snapshot",
            "거래 시점 사실 · 자동 정규화 오류 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.relational-model"
        ],
        "code": "{\n  \"thirdNormalForm\": \"모든비자명FD X→A에서X가superkey이거나A가prime attribute여야함;prime예외를제거한BCNF와다름\",\n  \"priceSnapshot\": \"현재상품가격과거래당시합의단가는다른시점의사실;차이가있다고자동정규화오류아님. 통화/세금/할인/갱신주체정의\"\n}\n",
        "active": [
          1,
          2
        ],
        "codeKind": "model-json",
        "codePath": "models.relational-model.normalization",
        "codeKeys": [
          "thirdNormalForm",
          "priceSnapshot"
        ],
        "image": "D10-normalization"
      }
    ]
  },
  {
    "id": "join",
    "question": "ON·WHERE·HAVING은 누구를 남기나요?",
    "source": "추가 commerce SQL · 원문 HAVING 번역",
    "sourceNote": "조회는 주문501 추가 전입니다. 고객 날짜 조건은 c.created_at에만 있고 PAID 집계에는 주문/결제 시각 필터가 없습니다. 같은 형식의 명시 ISO문자열 bind로 번역했습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "join-on",
        "title": "HAVING을 제거한 추가 중간 query",
        "lead": "원문에서 HAVING을 제거하고 COUNT(*)를 더했습니다. 주문 없는 고객의 NULL 확장 행도 COUNT(*)는1로 셉니다.",
        "values": [
          [
            "customer1 count*/countid/sum",
            "2 /2 /200"
          ],
          [
            "customer2·3 각각",
            "1 /0 /0"
          ],
          [
            "변경 범위",
            "추가 중간 query · 원문 최종 결과 아님"
          ]
        ],
        "checks": [
          "independent-customer-order-seed",
          "additional-left-on-intermediate-counts"
        ],
        "runKeys": [
          "facts.independent-customer-order-seed",
          "facts.additional-left-on-intermediate-counts"
        ],
        "code": "-- 원문 HAVING을 제거한 추가 중간행/query 변형: fixed ISO문자열 bind, count(*) 추가, observer용 id정렬.\nSELECT c.id, c.email, COUNT(*) AS count_star, COUNT(o.id) AS order_count,\n       COALESCE(SUM(o.total_amount), 0) AS paid_total\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.id AND o.status = 'PAID'\nWHERE c.created_at >= ?\nGROUP BY c.id, c.email\nORDER BY c.id;\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/left-on-paid.sql",
        "codeKeys": null,
        "image": "D10-join"
      },
      {
        "id": "join-where",
        "title": "오른쪽 PAID를 WHERE로 옮기면",
        "lead": "오른쪽 NULL 확장 행이 WHERE를 통과하지 못해 고객1만 남았습니다.",
        "values": [
          [
            "실제 고객",
            "1만"
          ],
          [
            "count*/countid/paid_total",
            "2 /2 /200"
          ]
        ],
        "checks": [
          "right-paid-where-removes-unmatched-customers"
        ],
        "runKeys": [
          "facts.right-paid-where-removes-unmatched-customers"
        ],
        "code": "-- 오른쪽 PAID를 WHERE로 옮긴 추가 SQLite 비교 쿼리.\nSELECT c.id, c.email, COUNT(*) AS count_star, COUNT(o.id) AS order_count,\n       COALESCE(SUM(o.total_amount), 0) AS paid_total\nFROM customers AS c\nLEFT JOIN orders AS o ON o.customer_id = c.id\nWHERE c.created_at >= ? AND o.status = 'PAID'\nGROUP BY c.id, c.email\nORDER BY c.id;\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/where-paid.sql",
        "codeKeys": null,
        "image": "D10-join"
      },
      {
        "id": "join-having",
        "title": "최종 HAVING도 0건을 제외한다",
        "lead": "원문의 COUNT(o.id)>=1을 유지한 번역 query는 고객1·주문2·합200만 반환합니다.",
        "values": [
          [
            "실제 최종 행",
            "customer1 / order_count2 / paid_total200"
          ],
          [
            "고객2·3",
            "HAVING 조건으로 제외"
          ]
        ],
        "checks": [
          "translated-final-having-keeps-paid-customer-only"
        ],
        "runKeys": [
          "facts.translated-final-having-keeps-paid-customer-only"
        ],
        "code": "-- 원문 block04의 DATE literal을 명시 ISO TEXT bind로 번역한 별도 예시.\nSELECT c.id, c.email, COUNT(o.id) AS order_count,\n       COALESCE(SUM(o.total_amount), 0) AS paid_total\nFROM customers AS c\nLEFT JOIN orders AS o\n  ON o.customer_id = c.id AND o.status = 'PAID'\nWHERE c.created_at >= ?\nGROUP BY c.id, c.email\nHAVING COUNT(o.id) >= 1\nORDER BY paid_total DESC;\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/having-paid.sql",
        "codeKeys": null,
        "image": "D10-join"
      }
    ]
  },
  {
    "id": "exists",
    "question": "최근 주문에는 CANCELLED도 포함되나요?",
    "source": "원문 EXISTS · 추가 SQLite 번역",
    "sourceNote": "원문의 EXISTS에는 주문 시각 조건만 있고 PAID 상태 조건은 없습니다. 추가 observer id정렬을 원문의 순서 보장으로 읽지 않습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "exists-native",
        "title": "최근 CANCELLED가 있는 고객2도 포함",
        "lead": "고정 cutoff 이후 주문이 있는 고객1/2를 한 번씩 반환했습니다. 고객2는 CANCELLED 주문20으로 조건에 맞습니다.",
        "values": [
          [
            "cutoff",
            "2026-09-01T00:00:00Z"
          ],
          [
            "실제 고객",
            "1 ada /2 bob"
          ],
          [
            "status predicate",
            "없음"
          ]
        ],
        "checks": [
          "translated-exists-has-no-status-filter"
        ],
        "runKeys": [
          "facts.translated-exists-has-no-status-filter"
        ],
        "code": "-- TIMESTAMP literal 대신 fixed ISO TEXT bind. status조건없음/id정렬은명시추가.\nSELECT c.id, c.email\nFROM customers AS c\nWHERE EXISTS (\n  SELECT 1 FROM orders AS o\n  WHERE o.customer_id = c.id AND o.created_at >= ?\n)\nORDER BY c.id;\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/exists-recent.sql",
        "codeKeys": null,
        "image": "D10-exists"
      },
      {
        "id": "exists-predicate",
        "title": "PAID 집계와 같은 날짜 조건이 아니다",
        "lead": "집계의 고객 생성 시각과 EXISTS의 주문 생성 시각을 분리합니다. EXISTS는 matching 주문 수만큼 outer 고객을 곱하지 않습니다.",
        "values": [
          [
            "집계",
            "c.created_at + o.status=PAID"
          ],
          [
            "최근 존재",
            "o.created_at · status 없음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.query-semantics"
        ],
        "code": "{\n  \"paidAggregate\": \"c.created_at >= DATE 2026-01-01은고객생성시각필터,ON은o.status=PAID만;주문/결제일이후조건없음\",\n  \"recentExists\": \"o.created_at >= TIMESTAMP 2026-09-01은주문시각필터;status조건없음\",\n  \"sourceCorrection\": \"REPORT의그이후결제된표현을주문날짜필터로해석하지않음\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.query-semantics.datePredicates",
        "codeKeys": null,
        "image": "D10-exists"
      }
    ]
  },
  {
    "id": "mutation",
    "question": "변경0행이면 어떤 조건을 다시 보나요?",
    "source": "추가 SQLite501 상태 전이",
    "sourceNote": "PENDING/25000/고정 ISO시각은 명시 입력입니다. 실제 SQLite cursor rowcount이며 다른 제품·API의 affected/matched count와 같은 의미라고 일반화하지 않습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "mutation-update",
        "title": "첫 UPDATE1 · 같은 guard는0",
        "lead": "501을 PENDING으로 넣고 id501/statusPENDING guard로 PAID를 만들었습니다. 같은 guard를 다시 적용한 rowcount는0입니다.",
        "values": [
          [
            "명시 입력",
            "501 /1 /PENDING /25000"
          ],
          [
            "UPDATE rowcounts",
            "[1,0]"
          ],
          [
            "최종 상태",
            "PAID"
          ]
        ],
        "checks": [
          "guarded-write-501-one-zero-zero-and-paid-row"
        ],
        "runKeys": [
          "facts.guarded-write-501-one-zero-zero-and-paid-row"
        ],
        "code": "    execute('commerce','INSERT INTO orders VALUES(?,?,?,?,?)',SEEDS['commerce']['write501'])\n    first=execute('commerce',\"UPDATE orders SET status='PAID' WHERE id=501 AND status='PENDING'\").rowcount\n    second=execute('commerce',\"UPDATE orders SET status='PAID' WHERE id=501 AND status='PENDING'\").rowcount\n    deleted=execute('commerce',\"DELETE FROM orders WHERE id=501 AND status='CANCELLED'\").rowcount\n    row501=fetch('commerce','SELECT * FROM orders WHERE id=501')\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-mutation"
      },
      {
        "id": "mutation-zero",
        "title": "CANCELLED 조건 DELETE는0",
        "lead": "실제 최종501은 PAID로 남았습니다. 변경0만으로 ID 부재인지 상태 불일치인지 모든 원인을 단정할 수 없습니다.",
        "values": [
          [
            "DELETE rowcount",
            "0"
          ],
          [
            "최종501",
            "501 /1 /PAID /25000"
          ],
          [
            "판단",
            "실제 조건·상태를 다시 확인"
          ]
        ],
        "checks": [
          "guarded-write-501-one-zero-zero-and-paid-row"
        ],
        "runKeys": [
          "facts.guarded-write-501-one-zero-zero-and-paid-row"
        ],
        "code": "    first=execute('commerce',\"UPDATE orders SET status='PAID' WHERE id=501 AND status='PENDING'\").rowcount\n    second=execute('commerce',\"UPDATE orders SET status='PAID' WHERE id=501 AND status='PENDING'\").rowcount\n    deleted=execute('commerce',\"DELETE FROM orders WHERE id=501 AND status='CANCELLED'\").rowcount\n    row501=fetch('commerce','SELECT * FROM orders WHERE id=501')\n    check('guarded-write-501-one-zero-zero-and-paid-row',first==1 and second==0 and deleted==0 and row501==[[501,1,'PAID',25000,'2026-10-01T12:00:00Z']],{'updateRowcounts':[first,second],'deleteRowcount':deleted,'row501':row501,'scope':'additional SQLite translation; explicit fixed ISO replaces source CURRENT_TIMESTAMP; SQLite cursor rowcounts, not MySQL affected-row mode'})\n    phase='wal-setup'\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-mutation"
      }
    ]
  },
  {
    "id": "visibility",
    "question": "같은 DB를 두 연결이 언제 보나요?",
    "source": "같은 own SQLite 파일 · WAL 두 연결",
    "sourceNote": "Python 한 프로세스가 두 연결을 정해진 순서로 겹친 관찰입니다. PostgreSQL/MySQL 격리수준이나 ORM·flush 실행으로 표시하지 않습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "visibility-uncommitted",
        "title": "writer20 · 다른 연결10",
        "lead": "writer가20으로 바꾸고 아직 commit하지 않았을 때 다른 연결은 이전10을 읽었습니다.",
        "values": [
          [
            "같은 own 파일",
            "writer/observer WAL"
          ],
          [
            "writer / observer",
            "20 /10"
          ],
          [
            "writer 상태",
            "미커밋"
          ]
        ],
        "checks": [
          "sqlite-wal-uncommitted-change-hidden"
        ],
        "runKeys": [
          "facts.sqlite-wal-uncommitted-change-hidden"
        ],
        "code": "    phase='wal-uncommitted-visibility'\n    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=20 WHERE id=1')\n    writer20=fetch('writer','SELECT value FROM state WHERE id=1')[0][0];observer10=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]\n    marker('writer-uncommitted20-observer-old10',writer=writer20,observer=observer10)\n    check('sqlite-wal-uncommitted-change-hidden',writer20==20 and observer10==10 and modes=={'writer':'wal','observer':'wal'}, {'journalModes':modes,'sameOwnDatabaseFile':True,'writerUncommittedValue':writer20,'otherConnectionValue':observer10,'scope':'controlled two-connection SQLite WAL case, not PostgreSQL/MySQL isolation or row-lock certification'})\n    execute('writer','COMMIT');after_commit=fetch('observer','SELECT value FROM state WHERE id=1')[0][0];marker('commit-then-new-autocommit-read',observer=after_commit)\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-visibility"
      },
      {
        "id": "visibility-commit",
        "title": "commit 뒤 새 read는20",
        "lead": "writer COMMIT이 완료된 뒤 다른 연결의 새 autocommit read가20을 읽었습니다.",
        "values": [
          [
            "이전 다른 연결 read",
            "10"
          ],
          [
            "commit 뒤 새 read",
            "20"
          ]
        ],
        "checks": [
          "sqlite-wal-commit-visible-to-new-read"
        ],
        "runKeys": [
          "facts.sqlite-wal-commit-visible-to-new-read"
        ],
        "code": "    execute('writer','COMMIT');after_commit=fetch('observer','SELECT value FROM state WHERE id=1')[0][0];marker('commit-then-new-autocommit-read',observer=after_commit)\n    check('sqlite-wal-commit-visible-to-new-read',after_commit==20,{'otherConnectionNewRead':after_commit,'previousUncommittedRead':10,'writerCommitCompleted':True})\n",
        "active": [
          0,
          1
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-visibility"
      },
      {
        "id": "visibility-snapshot",
        "title": "같은 read transaction은20 유지",
        "lead": "observer가20을 읽어 snapshot을 잡은 뒤 writer가30을 commit해도 같은 observer transaction은20입니다. transaction을 끝낸 새 read는30입니다.",
        "values": [
          [
            "reader 첫 / 다른 commit 뒤",
            "20 /20"
          ],
          [
            "reader 종료 뒤 새 read",
            "30"
          ]
        ],
        "checks": [
          "sqlite-wal-read-snapshot-until-transaction-end"
        ],
        "runKeys": [
          "facts.sqlite-wal-read-snapshot-until-transaction-end"
        ],
        "code": "    phase='wal-read-snapshot'\n    execute('observer','BEGIN');snapshot_first=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]\n    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=30 WHERE id=1');execute('writer','COMMIT')\n    snapshot_again=fetch('observer','SELECT value FROM state WHERE id=1')[0][0];marker('reader-snapshot-after-writer-commit30',reader=snapshot_again,writerCommitted=30)\n    execute('observer','COMMIT');new_read=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]\n    check('sqlite-wal-read-snapshot-until-transaction-end',[snapshot_first,snapshot_again,new_read]==[20,20,30],{'readerFirst':snapshot_first,'readerAfterOtherCommit':snapshot_again,'readerAfterTransactionEndNewRead':new_read,'scope':'SQLite WAL read snapshot only; no PostgreSQL READ COMMITTED/InnoDB REPEATABLE READ execution'})\n    phase='wal-two-writer-busy'\n    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=40 WHERE id=1')\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-visibility"
      }
    ]
  },
  {
    "id": "contention",
    "question": "다른 writer가 막히면 무엇을 보나요?",
    "source": "추가 SQLite BEGIN IMMEDIATE · rollback · guard",
    "sourceNote": "timeout0은 설정값이지 측정한 대기시간이 아닙니다. SQLite 단일 writer 경합과 PostgreSQL 행락·실제 deadlock을 구분합니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "contention-busy",
        "title": "두 번째 writer는 SQLITE_BUSY5",
        "lead": "첫 writer가40을 미커밋으로 보유할 때 다른 BEGIN IMMEDIATE가 busy였고 다른 연결의 read는30이었습니다.",
        "values": [
          [
            "실제 오류",
            "SQLITE_BUSY /5"
          ],
          [
            "writer / 다른 read",
            "40 /30"
          ],
          [
            "timeoutSeconds",
            "0 · 설정"
          ]
        ],
        "checks": [
          "sqlite-begin-immediate-writer-contention-busy"
        ],
        "runKeys": [
          "facts.sqlite-begin-immediate-writer-contention-busy"
        ],
        "code": "    phase='wal-two-writer-busy'\n    execute('writer','BEGIN IMMEDIATE');execute('writer','UPDATE state SET value=40 WHERE id=1')\n    try:\n        execute('observer','BEGIN IMMEDIATE');busy=None\n    except sqlite3.OperationalError as error:\n        busy={'name':error.sqlite_errorname,'code':error.sqlite_errorcode,'message':str(error)}\n    held_writer=fetch('writer','SELECT value FROM state WHERE id=1')[0][0];other_old=fetch('observer','SELECT value FROM state WHERE id=1')[0][0]\n    marker('first-writer-held-second-busy',writer=held_writer,other=other_old,error=busy)\n    check('sqlite-begin-immediate-writer-contention-busy',busy is not None and busy['name']=='SQLITE_BUSY' and busy['code']==5 and held_writer==40 and other_old==30,\n          {'secondWriterError':busy,'timeoutSeconds':0,'writerUncommittedValue':held_writer,'otherConnectionRead':other_old,'scope':'SQLite single-writer contention, not a row lock, PostgreSQL deadlock or waiting-time measurement'})\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-contention"
      },
      {
        "id": "contention-rollback",
        "title": "rollback 뒤 두 연결30",
        "lead": "미커밋40을 rollback한 뒤 두 연결에서 이전30을 확인했습니다.",
        "values": [
          [
            "두 연결 read",
            "[30,30]"
          ],
          [
            "미커밋40 저장",
            "false"
          ]
        ],
        "checks": [
          "sqlite-rollback-preserves-previous-state"
        ],
        "runKeys": [
          "facts.sqlite-rollback-preserves-previous-state"
        ],
        "code": "    execute('writer','ROLLBACK');rolled_back=[fetch(alias,'SELECT value FROM state WHERE id=1')[0][0] for alias in ['writer','observer']]\n    check('sqlite-rollback-preserves-previous-state',rolled_back==[30,30],{'writerObserverAfterRollback':rolled_back,'uncommitted40Persisted':False})\n",
        "active": [
          0,
          1
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-contention"
      },
      {
        "id": "contention-guard",
        "title": "stock5에서 qty3 두 번은1→0",
        "lead": "한 writer transaction에서 순차 실행했습니다. 첫 guard는 수량2로 만들고 두 번째는 조건에 맞지 않았습니다. 동시 부하·보편적 oversell 증명은 아닙니다.",
        "values": [
          [
            "initial / each qty",
            "5 /3"
          ],
          [
            "rowcounts / 최종 observer",
            "[1,0] /2"
          ]
        ],
        "checks": [
          "guarded-stock-update-one-then-zero"
        ],
        "runKeys": [
          "facts.guarded-stock-update-one-then-zero"
        ],
        "code": "    phase='guarded-stock-update'\n    execute('writer','BEGIN IMMEDIATE')\n    stock_first=execute('writer','UPDATE stock SET quantity=quantity-? WHERE id=? AND quantity>=?',(3,1,3)).rowcount\n    stock_second=execute('writer','UPDATE stock SET quantity=quantity-? WHERE id=? AND quantity>=?',(3,1,3)).rowcount\n    execute('writer','COMMIT');stock=fetch('observer','SELECT quantity FROM stock WHERE id=1')[0][0]\n    check('guarded-stock-update-one-then-zero',stock_first==1 and stock_second==0 and stock==2,{'initialStock':5,'requestedQuantityEach':3,'rowcounts':[stock_first,stock_second],'finalOtherConnectionQuantity':stock,'scope':'two sequential guarded statements in own writer transaction; not a concurrent load/oversell proof'})\n    phase='eqp-disposable-seed'\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-contention"
      }
    ]
  },
  {
    "id": "index",
    "question": "인덱스 전후에도 같은 행을 반환하나요?",
    "source": "별도 disposable512행 · 실제 SQLite EQP",
    "sourceNote": "SQLite3.53 자체 계획입니다. raw 숫자216/51은 해석하지 않으며 PG cost/rows/ms가 아닙니다. 별도 SELECT 반환14행은 물리 scanned rows 측정이 아닙니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "index-before",
        "title": "추가 index 전 SCAN과 임시 정렬",
        "lead": "같은 SELECT/bind로 SCAN orders와 ORDER BY용 TEMP B-TREE를 관찰했습니다.",
        "values": [
          [
            "disposable rows",
            "512"
          ],
          [
            "actual EQP",
            "SCAN orders / USE TEMP B-TREE FOR ORDER BY"
          ],
          [
            "SELECT 결과",
            "14행"
          ]
        ],
        "checks": [
          "sqlite-eqp-before-index-observed-scan"
        ],
        "runKeys": [
          "facts.sqlite-eqp-before-index-observed-scan"
        ],
        "code": "-- 추가 disposable SQLite 표의 같은 SELECT. PG DATE/INTERVAL 실행이 아니다.\nSELECT id, status FROM orders\nWHERE customer_id = ? AND created_at >= ?\nORDER BY created_at, id;\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/plan-query.sql",
        "codeKeys": null,
        "image": "D10-index"
      },
      {
        "id": "index-after",
        "title": "추가 뒤 SEARCH · 같은14행",
        "lead": "힌트 없이 이 데이터/버전이 복합 index SEARCH를 선택했습니다. SELECT 결과와 순서는 같고 속도 향상을 측정한 것은 아닙니다.",
        "values": [
          [
            "index",
            "orders_customer_created_idx(customer_id,created_at)"
          ],
          [
            "actual EQP",
            "SEARCH orders USING INDEX orders_customer_created_idx"
          ],
          [
            "결과 동등",
            "true ·14행"
          ]
        ],
        "checks": [
          "sqlite-eqp-added-index-observed-search"
        ],
        "runKeys": [
          "facts.sqlite-eqp-added-index-observed-search"
        ],
        "code": "    phase='eqp-index-added';execute('plans','CREATE INDEX orders_customer_created_idx ON orders(customer_id,created_at)');after=plan_state('after-index')\n    check('sqlite-eqp-added-index-observed-search',any('SEARCH orders USING INDEX orders_customer_created_idx' in row[3] for row in after['eqpRawTuples']) and after['results']==before['results'],{'observed':after,'sameResultsAsBefore':True,'optimizerHintUsed':False,'scope':'this SQLite data/version chose SEARCH; no INDEXED BY, PostgreSQL plan or speed inference'})\n    phase='eqp-index-dropped';execute('plans','DROP INDEX orders_customer_created_idx');dropped=plan_state('after-drop')\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-index"
      },
      {
        "id": "index-restore",
        "title": "drop·복원과 최종 정리를 구분",
        "lead": "자기 index를 drop/복원한 네 결과가 같습니다. 모든 실험 뒤 별도 시점에 own 연결5개의 FK·integrity·close와 source/fixture 보존을 확인했습니다.",
        "values": [
          [
            "4 SELECT 결과",
            "동일14행·순서"
          ],
          [
            "최종 ownDB / 연결",
            "4파일 /5연결"
          ],
          [
            "최종 FK / integrity / close",
            "각1 /ok /모두closed"
          ]
        ],
        "checks": [
          "sqlite-eqp-drop-restore-and-results-match",
          "all-own-connections-fk-on-and-integrity-clean",
          "all-owned-sqlite-connections-closed",
          "own-files-runtime-and-source-fixtures-preserved"
        ],
        "runKeys": [
          "facts.sqlite-eqp-drop-restore-and-results-match",
          "facts.all-own-connections-fk-on-and-integrity-clean",
          "facts.all-owned-sqlite-connections-closed",
          "facts.own-files-runtime-and-source-fixtures-preserved"
        ],
        "code": "    phase='eqp-index-dropped';execute('plans','DROP INDEX orders_customer_created_idx');dropped=plan_state('after-drop')\n    phase='eqp-index-restored';execute('plans','CREATE INDEX orders_customer_created_idx ON orders(customer_id,created_at)');restored=plan_state('after-restore')\n    check('sqlite-eqp-drop-restore-and-results-match',dropped['eqpRawTuples']==before['eqpRawTuples'] and restored['eqpRawTuples']==after['eqpRawTuples'] and all(s['results']==before['results'] for s in [after,dropped,restored]),{'afterDrop':dropped,'afterRestore':restored,'allFourResultsIdentical':True,'scope':'own disposable SQLite index drop/restore only; cached_statements=0 avoids stale prepared EQP; no MySQL invisible index or performance measurement'})\n    phase='final-pragmas-integrity'\n    fks={alias:fetch(alias,'PRAGMA foreign_keys')[0][0] for alias in connections}\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "native-fixture",
        "codePath": "fixture/sqlite_probe.py",
        "codeKeys": null,
        "image": "D10-index"
      }
    ]
  },
  {
    "id": "plans",
    "question": "계획의 숫자는 실행 시간인가요?",
    "source": "PostgreSQL18 문헌 모델 · 실제 PG 실행 없음",
    "sourceNote": "SQLite EQP 관찰과 PG 문헌의 cost/output rows/ANALYZE를 다른 범위로 둡니다. 측정하지 않은 시간·I/O·속도는 만들지 않습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "plans-estimate",
        "title": "cost·rows·width는 추정의 종류",
        "lead": "cost는 planner 단위이고 rows는 노드가 내보낼 예상 행 수입니다. EXPLAIN ANALYZE는 문장을 실제 실행합니다.",
        "values": [
          [
            "cost",
            "planner units · ms 아님"
          ],
          [
            "rows / width",
            "추정 OUTPUT 행 /평균 출력 bytes"
          ],
          [
            "ANALYZE",
            "실제 문장 실행 · DML 효과 가능"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.plans-indexes"
        ],
        "code": "{\n  \"cost\": \"arbitraryplanner비용단위,ms아님;상위cost에는child비용포함\",\n  \"rows\": \"노드의추정OUTPUT행수;물리읽은행/필터전입력행수와다름\",\n  \"analyze\": \"EXPLAIN ANALYZE는문장을실제실행;DML효과발생가능\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.plans-indexes.pgExplain",
        "codeKeys": [
          "cost",
          "rows",
          "analyze"
        ],
        "image": "D10-plans"
      },
      {
        "id": "plans-prefix",
        "title": "선두 등가·다음 범위와 skip scan",
        "lead": "전형적인 복합 B-tree 사용 패턴과 PG18의 조건부 skip scan을 나눕니다. 선두가 없으면 절대 불가라는 규칙은 아닙니다.",
        "values": [
          [
            "전형",
            "customer_id 등가 + created_at 범위"
          ],
          [
            "skip scan",
            "고유값 분포·비용에 따라 가능"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.plans-indexes"
        ],
        "code": "{\n  \"index\": \"B-tree(customer_id,created_at)\",\n  \"typical\": \"선두등가+다음범위조건이검색범위를줄이는전형\",\n  \"skipScan\": \"PG18은선두다른값수·분포/비용에따라후속열조건으로skipscan가능;선두없으면절대불가/항상효율둘다아님\",\n  \"choice\": \"작은표/낮은선택도/통계·편향·정렬·쓰기공간비용으로계획선택\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.plans-indexes.multicolumn",
        "codeKeys": null,
        "image": "D10-plans"
      },
      {
        "id": "plans-covering",
        "title": "필요 열이 있어도 heap을 볼 수 있다",
        "lead": "INCLUDE payload와 검색 키를 구분하고 MVCC 가시성·visibility map 조건을 함께 봅니다.",
        "values": [
          [
            "INCLUDE",
            "반환 payload · 검색/unique 키와 구분"
          ],
          [
            "heap 접근0",
            "필요 열만으로 보장 안 됨"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.plans-indexes"
        ],
        "code": "{\n  \"include\": \"INCLUDE payload는반환값용,검색키나unique판정키와구분\",\n  \"visibility\": \"필요열/indexmethod조건후에도MVCC visibilitymap에따라heap접근가능;필요열모두있음≠heap0보장\"\n}\n",
        "active": [
          1,
          2
        ],
        "codeKind": "model-json",
        "codePath": "models.plans-indexes.covering",
        "codeKeys": null,
        "image": "D10-plans"
      }
    ]
  },
  {
    "id": "isolation",
    "question": "같은 격리수준 이름이면 같나요?",
    "source": "PG18/InnoDB8.4 · 미실행 격리·락 모델",
    "sourceNote": "SQLite WAL의 값·SQLITE_BUSY를 PostgreSQL 행락/deadlock의 재현으로 승계하지 않습니다. 아래는 모두 문헌 모델입니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "isolation-pg-rc",
        "title": "PG READ COMMITTED는 문장별",
        "lead": "각 문장 시점의 committed snapshot과 자기 이전 변경을 구분합니다. 충돌 updater의 대기·WHERE 재검증도 문헌 동작입니다.",
        "values": [
          [
            "문헌 기본",
            "PostgreSQL18 READ COMMITTED"
          ],
          [
            "snapshot",
            "문장별 · 자기 이전 변경은 자기에게 보임"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.transactions-locks"
        ],
        "code": "{\n  \"engine\": \"PostgreSQL18 READ COMMITTED\",\n  \"default\": true,\n  \"snapshot\": \"각문장시작의committedsnapshot/자기이전미커밋변경은자기연결에보임\",\n  \"writes\": \"충돌updater대기뒤RCWHERE를새버전에재검증할수있음\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.transactions-locks.visibility.0",
        "codeKeys": null,
        "image": "D10-isolation"
      },
      {
        "id": "isolation-pg-rr",
        "title": "PG REPEATABLE READ의 시작점",
        "lead": "첫 non-transaction-control 문장 시점이며 BEGIN 호출 시점과 무조건 같지 않습니다. serialization 실패는 전체 transaction 재시도가 필요할 수 있습니다.",
        "values": [
          [
            "snapshot 시작",
            "첫 non-transaction-control statement"
          ],
          [
            "동시 변경",
            "serialization failure /전체 transaction retry 조건"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.transactions-locks"
        ],
        "code": "{\n  \"engine\": \"PostgreSQL18 REPEATABLE READ\",\n  \"default\": false,\n  \"snapshot\": \"첫non-transaction-control문장시점snapshot;BEGIN발행시각과무조건같지않음\",\n  \"writes\": \"동시변경에serializationfailure발생가능/전체transactionretry필요\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.transactions-locks.visibility.1",
        "codeKeys": null,
        "image": "D10-isolation"
      },
      {
        "id": "isolation-innodb",
        "title": "InnoDB의 consistent와 locking read",
        "lead": "일반 consistent read snapshot과 최근 상태를 쓰는 locking/current 연산을 나눕니다. 정확한 unique 검색과 범위 조건의 잠금도 다릅니다.",
        "values": [
          [
            "문헌 기본",
            "InnoDB8.4 REPEATABLE READ"
          ],
          [
            "구분",
            "일반 consistent /locking-current"
          ],
          [
            "범위",
            "record /gap-next-key 조건별"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.transactions-locks"
        ],
        "code": "{\n  \"engine\": \"InnoDB8.4 REPEATABLE READ\",\n  \"default\": true,\n  \"snapshot\": \"일반consistentnonlockingread첫readsnapshot\",\n  \"writes\": \"locking/currentread·UPDATE는최근상태기준잠금;uniqueexact조건record/range조건gap/next-key등구분\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.transactions-locks.visibility.2",
        "codeKeys": null,
        "image": "D10-isolation"
      },
      {
        "id": "isolation-deadlock",
        "title": "순환 대기와 재시도 경계",
        "lead": "A는 행1을 잡고2를, B는2를 잡고1을 기다리는 모델입니다. detector의 victim은 고정하지 않고 안전한 전체 transaction 재시도를 검토합니다.",
        "values": [
          [
            "순환",
            "A hold1/wait2 · B hold2/wait1"
          ],
          [
            "victim",
            "관련 transaction 중 하나 · 선택 고정 안 함"
          ],
          [
            "실제 PG deadlock",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.transactions-locks"
        ],
        "code": "{\n  \"model\": \"A가행1보유/행2대기,B가행2보유/행1대기→순환\",\n  \"pgResponse\": \"detector가관련transaction중하나abort;victim선택고정안함\",\n  \"application\": \"허용오류·멱등성·외부효과경계확인뒤필요하면전체transaction제한retry;자동모든요청성공아님\",\n  \"prevention\": \"여러행잠금순서통일/짧은transaction/외부대기경계검토\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.transactions-locks.deadlock",
        "codeKeys": null,
        "image": "D10-isolation"
      }
    ]
  },
  {
    "id": "operations",
    "question": "풀·복제·샤딩은 무엇을 나누나요?",
    "source": "미실행 연결 예산·복제·복구 모델",
    "sourceNote": "제시한 숫자는 명시 산술 예시이며 실제 DB 설정·처리량·복제 지연·RPO/RTO 달성 결과가 아닙니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "operations-pool",
        "title": "최대 연결 합과 남길 여유",
        "lead": "명시 최대120/reserve20이면 비reserve 예산100입니다. 4×20+10+3=93이고 여유7, reserve 포함113입니다.",
        "values": [
          [
            "명시 maximum /reserve",
            "120 /20"
          ],
          [
            "4 instances ×20 +batch10 +monitor3",
            "93 · available100 · headroom7"
          ],
          [
            "reserve 포함 /6instance 대안",
            "113 /153 · maximum보다33 초과"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.connections-operations"
        ],
        "code": "{\n  \"kind\": \"명시산술예시,실제설정/성능아님\",\n  \"applicationMaximumTotal\": 80,\n  \"plannedNonReserveTotal\": 93,\n  \"headroomAfterPlan\": 7,\n  \"totalIncludingReserve\": 113,\n  \"additionalInstancesCase\": {\n    \"instances\": 6,\n    \"applicationMaximumTotal\": 120,\n    \"plannedIncludingReserve\": 153,\n    \"overMaximum\": 33\n  }\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.connections-operations.specifiedBudget",
        "codeKeys": [
          "kind",
          "applicationMaximumTotal",
          "plannedNonReserveTotal",
          "headroomAfterPlan",
          "totalIncludingReserve",
          "additionalInstancesCase"
        ],
        "image": "D10-operations"
      },
      {
        "id": "operations-replica",
        "title": "쓰기 전파와 역사 백업은 별개",
        "lead": "비동기 전파 지연·stale read와 장애 전환의 미전파 손실 가능성을 봅니다. 삭제도 복제될 수 있어 독립 백업·복원 확인이 필요합니다.",
        "values": [
          [
            "async replica",
            "commit 뒤 반영 지연 /stale read 가능"
          ],
          [
            "역사 백업",
            "replica만으로 대체 안 됨"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.connections-operations"
        ],
        "code": "{\n  \"primary\": \"쓰기기준서버,최신읽기는일관성요건에맞는경로선택\",\n  \"async\": \"commit→전파지연때stale read가능/장애전환시미전파변경손실가능\",\n  \"backup\": \"삭제/논리오류도전파가능해replica만으로역사백업대체안됨;보관/복원/서비스검증별도\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.connections-operations.replica",
        "codeKeys": null,
        "image": "D10-operations"
      },
      {
        "id": "operations-sharding",
        "title": "사본과 조각의 비용",
        "lead": "replication은 같은 데이터 사본, sharding은 키 기준 조각입니다. 교차 조회·집계·재분배·복구와 사용자 기능 검증은 별도 문제입니다.",
        "values": [
          [
            "replication /sharding",
            "같은 데이터 사본 /키별 조각"
          ],
          [
            "복구 목표",
            "RPO·RTO · 파일 존재만으로 인증 안 함"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.connections-operations"
        ],
        "code": "{\n  \"replication\": \"같은데이터사본전달\",\n  \"sharding\": \"키기준서로다른조각배치\",\n  \"cost\": \"교차shardJOIN/집계/재분배/복구·전역제약조건의복잡성;단일DB부족을측정하지않고필수라고단정안함\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.connections-operations.sharding",
        "codeKeys": null,
        "image": "D10-operations"
      }
    ]
  },
  {
    "id": "products",
    "question": "제품 이름보다 어떤 접근을 요구하나요?",
    "source": "원문 데이터 모델 분류 · MongoDB 공식 반례",
    "sourceNote": "아래는 제품을 실행하거나 운영 구성을 추천한 결과가 아닙니다. 관계·제약·질의·일관성 요구를 먼저 봅니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "products-patterns",
        "title": "관계·키·문서·파티션·연결 탐색",
        "lead": "같은 JSON이나 규모만으로 선택하지 않습니다. 표의 접근 패턴을 제품별 제약과 대조합니다.",
        "values": [
          [
            "관계형 /키값",
            "관계·제약·조인 /키 중심·만료"
          ],
          [
            "문서 /wide-column /graph",
            "중첩 문서 /partition key /다단계 연결"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.product-boundaries"
        ],
        "code": "{\n  \"kind\": \"관계형\",\n  \"question\": \"관계·제약·조인/transaction요구\",\n  \"boundary\": \"RDB가JSON/확장기능을지원하지못한다고단정안함\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.product-boundaries.patterns.0",
        "codeKeys": null,
        "image": "D10-products"
      },
      {
        "id": "products-mongo",
        "title": "유연한 schema에도 검증과 transaction",
        "lead": "MongoDB는 schema validation과 다중 문서 ACID transaction을 지원하는 공식 사례입니다. 이를 모든 NoSQL 제품의 기능 보장으로 확대하지 않습니다.",
        "values": [
          [
            "schema",
            "flexible default +validation 정책"
          ],
          [
            "transaction",
            "다중 문서 ACID · 설정/concern 조건"
          ],
          [
            "모든 NoSQL 공통 보장",
            "아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.product-boundaries"
        ],
        "code": "{\n  \"schema\": \"flexibledefault여도type/range등schemavalidation정책가능\",\n  \"transaction\": \"다중문서ACIDtransaction지원,read/writeconcern·배치/구성조건검토\",\n  \"limit\": \"한제품사례를모든NoSQL기능보장으로확대안함;NoSQL=무스키마검증/무transaction단정금지\"\n}\n",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.product-boundaries.mongoCounterexample",
        "codeKeys": null,
        "image": "D10-products"
      }
    ]
  },
  {
    "id": "original",
    "question": "원문 환경과 추가 관찰은 어떻게 다른가요?",
    "source": "원문 PG18/MySQL8.4/Java25 설정 · 미실행",
    "sourceNote": "Docker5432/3306·PG/MySQL SQL·Boot4.1.1/Java25/Kotlin/properties는 원문으로 보존했습니다. 추가 SQLite 파일 관찰을 원문 실행으로 바꾸지 않습니다.",
    "note": "강조는 설명하는 코드·조건의 위치이며 실시간 실행 줄이 아닙니다. 추가 SQLite 관찰·미실행 문헌 모델·보존한 원문을 구분해 읽습니다.",
    "stages": [
      {
        "id": "original-postgres",
        "title": "원문의 Docker·psql·EXPLAIN",
        "lead": "원문 block09의 연속 발췌입니다. 원문 EXPLAIN은 추정 계획 표시이며 실제 행 수·시간을 얻은 명령으로 표시하지 않습니다.",
        "values": [
          [
            "원문",
            "PostgreSQL18 /Docker5432 /미실행"
          ],
          [
            "원문 command",
            "EXPLAIN · ANALYZE 결과 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.product-boundaries"
        ],
        "code": "docker exec -i d10-postgres psql -U postgres -d shop <<'SQL'\nCREATE TABLE customers (\n  id BIGINT PRIMARY KEY,\n  email TEXT NOT NULL UNIQUE,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP\n);\nCREATE TABLE orders (\n  id BIGINT PRIMARY KEY,\n  customer_id BIGINT NOT NULL REFERENCES customers(id),\n  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "unrun-source",
        "codePath": "original/block-09.sh",
        "codeKeys": null,
        "image": "D10-original"
      },
      {
        "id": "original-mysql",
        "title": "별도 MySQL DDL의 규칙",
        "lead": "원문 MySQL orders에는 FK/CHECK를 선언하지 않았습니다. PG 예제와 같은 제약 schema로 읽지 않습니다.",
        "values": [
          [
            "원문",
            "MySQL8.4 /Docker3306 /미실행"
          ],
          [
            "이 DDL의 FK /CHECK",
            "둘 다 선언 없음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.product-boundaries"
        ],
        "code": "CREATE TABLE orders (\n  id BIGINT PRIMARY KEY, customer_id BIGINT NOT NULL,\n  status VARCHAR(16) NOT NULL, total_amount DECIMAL(12,2) NOT NULL,\n  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n);\nCREATE INDEX orders_customer_created_idx ON orders (customer_id, created_at);\nEXPLAIN SELECT id, status FROM orders\nWHERE customer_id = 1 AND created_at >= CURRENT_DATE - INTERVAL 7 DAY;\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "unrun-source",
        "codePath": "original/block-11.sql",
        "codeKeys": null,
        "image": "D10-original"
      },
      {
        "id": "original-jvm",
        "title": "Kotlin 설정과 JDBC 예시",
        "lead": "Java 앱 source가 아니라 Boot4.1.1/Java25의 미실행 설정입니다. 전체 properties와 Docker 명령도 아래 원문에 보존합니다.",
        "values": [
          [
            "원문 설정",
            "Boot4.1.1 /Java25 /Gradle Kotlin"
          ],
          [
            "원문 JDBC",
            "jdbc:postgresql://localhost:5432/shop · 미실행"
          ],
          [
            "추가 native",
            "Python3.14.3 /SQLite3.53 · own files"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.product-boundaries"
        ],
        "code": "plugins {\n    java\n    id(\"org.springframework.boot\") version \"4.1.1\"\n}\n\njava {\n    toolchain { languageVersion = JavaLanguageVersion.of(25) }\n}\n\ndependencies {\n",
        "active": [
          0,
          1,
          2
        ],
        "codeKind": "unrun-source",
        "codePath": "original/block-12.kt",
        "codeKeys": null,
        "image": "D10-original"
      }
    ]
  }
];
export const d10Run = path => path.split(".").reduce((value, key) => value?.[key], D10_RUNS);
