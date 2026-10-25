// 원문3클래스와 명시한 추가 Spring/JDBC fixture의 관측을 구분한다.
export const s08AssetRoot = '../design/s08-2026-10-20/images/';
export const S08_RUNS = {
  "versions": {
    "spring": "7.0.9",
    "h2": "2.4.240",
    "java": 21
  },
  "observerConnection": {
    "autoCommit": true,
    "jdbcIsolation": 2
  },
  "originalTransfer": {
    "timeline": [
      {
        "label": "original-repository-debit",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": 2,
        "connection": 6
      },
      {
        "label": "after-debit-values",
        "writer": [
          750,
          100
        ],
        "observer": [
          1000,
          100
        ]
      },
      {
        "label": "original-repository-credit",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": 2,
        "connection": 6
      }
    ],
    "resourceActions": [
      {
        "connection": 6,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 6,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 6,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 6,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      750,
      350
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "originalCheckedRollback": {
    "timeline": [
      {
        "label": "original-repository-debit",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": 2,
        "connection": 11
      },
      {
        "label": "after-debit-values",
        "writer": [
          750,
          100
        ],
        "observer": [
          1000,
          100
        ]
      }
    ],
    "resourceActions": [
      {
        "connection": 11,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 11,
        "method": "rollback",
        "argument": null
      },
      {
        "connection": 11,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 11,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "directOriginal": {
    "timeline": [
      {
        "label": "original-repository-debit",
        "active": false,
        "synchronization": false,
        "readOnly": false,
        "isolation": null,
        "connection": null
      },
      {
        "label": "after-debit-values",
        "writer": [
          750,
          100
        ],
        "observer": [
          750,
          100
        ]
      }
    ],
    "resourceActions": [
      {
        "connection": 16,
        "method": "close",
        "argument": null
      },
      {
        "connection": 17,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      750,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "defaultChecked": {
    "timeline": [
      {
        "label": "default-checked",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 22
      }
    ],
    "resourceActions": [
      {
        "connection": 22,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 22,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 22,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 22,
        "method": "close",
        "argument": null
      },
      {
        "connection": 23,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "checked"
    ],
    "gatewayInvocations": []
  },
  "defaultRuntime": {
    "timeline": [
      {
        "label": "default-runtime",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 28
      }
    ],
    "resourceActions": [
      {
        "connection": 28,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 28,
        "method": "rollback",
        "argument": null
      },
      {
        "connection": 28,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 28,
        "method": "close",
        "argument": null
      },
      {
        "connection": 29,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "noRollbackFor": {
    "timeline": [
      {
        "label": "no-rollback-runtime",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 34
      }
    ],
    "resourceActions": [
      {
        "connection": 34,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 34,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 34,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 34,
        "method": "close",
        "argument": null
      },
      {
        "connection": 35,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "no-rollback"
    ],
    "gatewayInvocations": []
  },
  "caughtRuntime": {
    "timeline": [
      {
        "label": "catch-in-same-method",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 40
      }
    ],
    "resourceActions": [
      {
        "connection": 40,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 40,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 40,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 40,
        "method": "close",
        "argument": null
      },
      {
        "connection": 41,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "caught"
    ],
    "gatewayInvocations": []
  },
  "selfInvocation": {
    "timeline": [
      {
        "label": "default-runtime",
        "active": false,
        "synchronization": false,
        "readOnly": false,
        "isolation": null,
        "connection": null
      }
    ],
    "resourceActions": [
      {
        "connection": 46,
        "method": "close",
        "argument": null
      },
      {
        "connection": 47,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "runtime"
    ],
    "gatewayInvocations": []
  },
  "originalImportSuccess": {
    "timeline": [
      {
        "label": "original-import-repository",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 52
      }
    ],
    "resourceActions": [
      {
        "connection": 52,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 52,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 52,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 52,
        "method": "close",
        "argument": null
      },
      {
        "connection": 53,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "import-ok"
    ],
    "gatewayInvocations": []
  },
  "originalImportRollbackOnly": {
    "timeline": [
      {
        "label": "original-import-repository",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 58
      }
    ],
    "resourceActions": [
      {
        "connection": 58,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 58,
        "method": "rollback",
        "argument": null
      },
      {
        "connection": 58,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 58,
        "method": "close",
        "argument": null
      },
      {
        "connection": 59,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "afterCommit": {
    "timeline": [
      {
        "label": "event-publish-before",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 64
      },
      {
        "label": "event-publish-after",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 64
      },
      {
        "label": "original-after-commit-gateway",
        "active": true,
        "synchronization": false,
        "readOnly": false,
        "isolation": null,
        "connection": 64
      }
    ],
    "resourceActions": [
      {
        "connection": 64,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 64,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 64,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 64,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "order"
    ],
    "gatewayInvocations": [
      77
    ]
  },
  "eventRollback": {
    "timeline": [
      {
        "label": "event-publish-before",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 69
      },
      {
        "label": "event-publish-after",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 69
      }
    ],
    "resourceActions": [
      {
        "connection": 69,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 69,
        "method": "rollback",
        "argument": null
      },
      {
        "connection": 69,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 69,
        "method": "close",
        "argument": null
      },
      {
        "connection": 70,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "eventNoTransaction": {
    "timeline": [],
    "resourceActions": [],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "afterCommitFailure": {
    "timeline": [
      {
        "label": "event-publish-before",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 79
      },
      {
        "label": "event-publish-after",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 79
      },
      {
        "label": "original-after-commit-gateway",
        "active": true,
        "synchronization": false,
        "readOnly": false,
        "isolation": null,
        "connection": 79
      }
    ],
    "resourceActions": [
      {
        "connection": 79,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 79,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 79,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 79,
        "method": "close",
        "argument": null
      },
      {
        "connection": 80,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "order"
    ],
    "gatewayInvocations": [
      77
    ]
  },
  "requiredRollbackOnly": {
    "timeline": [
      {
        "label": "outer-required-start",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 85
      },
      {
        "label": "inner-required",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 85
      },
      {
        "label": "outer-required-caught",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 85
      },
      {
        "label": "outer-rollback-only",
        "rollbackOnly": true
      }
    ],
    "resourceActions": [
      {
        "connection": 85,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 85,
        "method": "rollback",
        "argument": null
      },
      {
        "connection": 85,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 85,
        "method": "close",
        "argument": null
      },
      {
        "connection": 86,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "requiresNew": {
    "timeline": [
      {
        "label": "outer-new-start",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 91
      },
      {
        "label": "inner-new",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 92
      },
      {
        "label": "outer-new-resumed",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 91
      }
    ],
    "resourceActions": [
      {
        "connection": 91,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 92,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 92,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 92,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 92,
        "method": "close",
        "argument": null
      },
      {
        "connection": 91,
        "method": "rollback",
        "argument": null
      },
      {
        "connection": 91,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 91,
        "method": "close",
        "argument": null
      },
      {
        "connection": 93,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "inner-new"
    ],
    "gatewayInvocations": []
  },
  "nested": {
    "timeline": [
      {
        "label": "outer-nested-start",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 98
      },
      {
        "label": "inner-nested",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 98
      },
      {
        "label": "outer-nested-caught",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 98
      }
    ],
    "resourceActions": [
      {
        "connection": 98,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 98,
        "method": "setSavepoint",
        "argument": "SAVEPOINT_1"
      },
      {
        "connection": 98,
        "method": "rollback",
        "argument": "savepoint"
      },
      {
        "connection": 98,
        "method": "releaseSavepoint",
        "argument": "savepoint"
      },
      {
        "connection": 98,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 98,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 98,
        "method": "close",
        "argument": null
      },
      {
        "connection": 99,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "outer"
    ],
    "gatewayInvocations": []
  },
  "contractsOutside": {
    "timeline": [
      {
        "label": "inner-supports",
        "active": false,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": null
      },
      {
        "label": "inner-not-supported",
        "active": false,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": null
      },
      {
        "label": "inner-never",
        "active": false,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": null
      }
    ],
    "resourceActions": [],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "contractsInside": {
    "timeline": [
      {
        "label": "outer-contracts",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 108
      },
      {
        "label": "inner-supports",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 108
      },
      {
        "label": "inner-mandatory",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 108
      },
      {
        "label": "inner-not-supported",
        "active": false,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": null
      },
      {
        "label": "never-rejected",
        "active": true,
        "synchronization": true,
        "readOnly": false,
        "isolation": null,
        "connection": 108
      }
    ],
    "resourceActions": [
      {
        "connection": 108,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 108,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 108,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 108,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [],
    "gatewayInvocations": []
  },
  "readOnlyHint": {
    "timeline": [
      {
        "label": "read-only-write",
        "active": true,
        "synchronization": true,
        "readOnly": true,
        "isolation": null,
        "connection": 113
      }
    ],
    "resourceActions": [
      {
        "connection": 113,
        "method": "setReadOnly",
        "argument": true
      },
      {
        "connection": 113,
        "method": "setAutoCommit",
        "argument": false
      },
      {
        "connection": 113,
        "method": "commit",
        "argument": null
      },
      {
        "connection": 113,
        "method": "setAutoCommit",
        "argument": true
      },
      {
        "connection": 113,
        "method": "setReadOnly",
        "argument": false
      },
      {
        "connection": 113,
        "method": "close",
        "argument": null
      },
      {
        "connection": 114,
        "method": "close",
        "argument": null
      }
    ],
    "observerBalances": [
      1000,
      100
    ],
    "ledger": [
      "read-only-write"
    ],
    "gatewayInvocations": []
  },
  "scope": "Original3Java blocks unchanged. Additional JDBC repository implementations and annotated variants; standalone Spring CGLIB context/DataSourceTransactionManager/H2/JDK21 with Boot4.1.1 BOM only. No Boot app/JPA/MySQL/Java25/HTTP/Docker/reactive/broker/CDC/process-kill/outbox runtime. Observer uses separate autocommit JDBC. Tracking logs connection methods, not wire SQL or latency. gatewayInvocations are in-memory method calls, NOT broker delivery acknowledgments. The AFTER_COMMIT callback can still expose active=true thread resources after the physical commit; that flag is not proof of an uncommitted DB transaction. readOnly and propagation results limited to this manager/driver.",
  "additionalRepositoryBehavior": {
    "transfer": "Additional account seed id1=1000/id2=100; debit fail flag throws original checked exception after an UPDATE, not a real insufficient-funds implementation.",
    "import": "Additional deliberate INSERT-then-false implementation exercises original setRollbackOnly branch; not a real insertIfAbsent/duplicate-key algorithm.",
    "notification": "Memory invocation record with controlled failure flag; not a message broker."
  },
  "checks": 42,
  "checkNames": [
    "original-transfer-is-cglib-proxy",
    "original-transfer-commits-both",
    "original-transfer-repository-active",
    "original-transfer-one-bound-connection",
    "original-transfer-writer-uncommitted-observer-old",
    "original-transfer-commit-recorded",
    "original-rollbackFor-checked-restores-both",
    "direct-new-annotation-no-transaction",
    "direct-new-debit-autocommits",
    "default-checked-commits",
    "default-runtime-rolls-back",
    "noRollbackFor-runtime-commits",
    "caught-runtime-normal-return-commits",
    "self-invocation-bypasses-advice",
    "self-invocation-write-autocommits",
    "original-import-true-result",
    "original-import-true-commits",
    "original-import-false-result",
    "original-import-setRollbackOnly-removes-insert",
    "original-listener-after-commit-notifies",
    "original-listener-after-publish-return",
    "rollback-skips-original-after-commit",
    "event-rollback-row-absent",
    "no-transaction-skips-original-listener",
    "listener-after-completion-failure-not-propagated",
    "listener-failure-does-not-undo-commit",
    "required-caught-inner-still-rolls-back-all",
    "required-caught-is-rollback-only",
    "required-shares-one-bound-connection",
    "required-physical-rollback-recorded",
    "requires-new-survives-outer-rollback",
    "requires-new-different-inner-connection-outer-resumes",
    "requires-new-inner-commit-outer-rollback",
    "nested-savepoint-keeps-outer-only",
    "nested-one-physical-connection",
    "nested-savepoint-rollback-and-final-commit",
    "supports-without-transaction-inactive",
    "supports-can-have-synchronization",
    "mandatory-without-transaction-rejects",
    "not-supported-suspends-physical-transaction",
    "never-rejects-existing-transaction",
    "read-only-hint-does-not-block-this-h2-write"
  ]
};
const scope = '독립 Spring 7.0.9 CGLIB / DataSourceTransactionManager / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용';
const limits = 'Boot 앱·JPA·MySQL·Java 25·HTTP·Docker·reactive·broker·CDC·outbox는 실행하지 않았습니다.';
const find = (run, label) => S08_RUNS[run].timeline.find(item => item.label === label);
const conn = (run, label) => { const id = find(run,label)?.connection; return id == null ? 'bound connection 없음' : 'tracked connection ' + id; };
const flags = (run, label) => { const item=find(run,label); return `active=${item.active} / sync=${item.synchronization}`; };
const stage = (topic,id,title,lead,code,values,checks=[],runKeys=[],extra={}) => ({id:topic+'-'+id,title,lead,code,values,checks,runKeys,active:[0],image:'S08-'+topic,...extra});
const transferNote = '원문 TransferService를 그대로 사용하고 저장소만 추가 fixture로 붙였습니다. 초기 계정 id1=1000·id2=100이며 failDebit는 UPDATE 뒤 원문 checked 예외를 강제 발생시킵니다. 실제 잔액 부족 판정 알고리즘이 아닙니다.';
const ruleNote = '이 네 메서드는 원문 기본 규칙을 확인한 추가 ExtraRules 변형입니다. 각 run은 독립적으로 ledger를 비우고 시작합니다. 원문 TransferService의 명시 rollbackFor와 섞지 않습니다.';
export const S08_LESSONS = [
  {id:'transfer',question:'한 번의 이체에서 어느 값이 아직 미커밋일까?',source:scope+' · 원문 TransferService + 추가 계정 fixture',sourceNote:transferNote,note:transferNote+' writer와 별도 autocommit READ_COMMITTED observer를 구분합니다. timeout=3은 설정된 초 단위 제한이며 지연시간을 측정한 값이 아닙니다. '+limits,stages:[
    stage('transfer','debit','debit 뒤 writer만750','CGLIB 프록시로 원문 transfer(1,2,250)를 호출했습니다. 추가 debit 구현이 계정1을 차감한 뒤, 같은 writer는750/100이고 별도 observer는 아직1000/100입니다.','repository.debit(from, cents);\n// 추가 repository: UPDATE 뒤 writer/observer를 기록',[['추가 초기 계정1 / 계정2','1000 / 100'],['debit 뒤 writer','750 / 100'],['같은 시점 별도 observer','1000 / 100'],['저장소 active / sync',flags('originalTransfer','original-repository-debit')],['debit / credit 연결',conn('originalTransfer','original-repository-debit')+' · 같은 연결']],['original-transfer-is-cglib-proxy','original-transfer-repository-active','original-transfer-one-bound-connection','original-transfer-writer-uncommitted-observer-old'],['originalTransfer']),
    stage('transfer','commit','credit 후 commit하면750/350','원문 credit까지 완료하고 프록시가 transaction을 commit했습니다. 최종 observer 잔액은750/350이며 트래킹 로그에 commit이 있습니다.','repository.credit(to, cents);\n// 프록시가 원문 transfer 정상 반환 뒤 commit',[['최종 별도 observer','750 / 350'],['자원 동작','tracked connection 6 · commit'],['메서드 입력','from=1 / to=2 / cents=250']],['original-transfer-commits-both','original-transfer-commit-recorded'],['originalTransfer']),
    stage('transfer','checked','별도 checked 실패는 원상태','별도 run에서 추가 failDebit=true가 차감 UPDATE 뒤 InsufficientFundsException을 던졌습니다. 원문의 rollbackFor가 적용돼 observer는1000/100이며 credit에는 도달하지 않습니다.','@Transactional(isolation = Isolation.READ_COMMITTED, timeout = 3,\n               rollbackFor = InsufficientFundsException.class)\n// 추가 제어: failDebit = true; transfer.transfer(1,2,250);',[['강제 예외 위치','추가 debit UPDATE 뒤'],['예외 타입','원문 InsufficientFundsException · checked'],['최종 별도 observer','1000 / 100'],['credit 호출','도달하지 않음']],['original-rollbackFor-checked-restores-both'],['originalCheckedRollback'],{active:[0,1,2]}),
  ]},
  {id:'rules',question:'예외를 던지면 언제나 rollback될까?',source:scope+' · 추가 ExtraRules',sourceNote:ruleNote,note:ruleNote+' 프록시 밖으로 나온 예외와 같은 메서드 안에서 잡은 예외를 구분합니다. '+limits,stages:[
    stage('rules','checked','기본 checked 예외는 commit','추가 checked()가 ledger에 checked를 넣고 IOException을 던졌습니다. 기본 롤백 규칙에서는 checked가 대상이 아니어서 행이 남았습니다.','@Transactional public void checked() throws IOException {\n    jdbc.update("insert into ledger values(\'checked\')");\n    throw new IOException("checked");\n}',[['프록시 밖 예외','IOException · checked'],['최종 ledger','[checked]'],['자원 동작','commit']],['default-checked-commits'],['defaultChecked'],{active:[0,2]}),
    stage('rules','runtime','기본 runtime 예외는 rollback','추가 runtime()의 IllegalStateException이 프록시로 나왔습니다. ledger runtime 삽입은 rollback돼 최종 행이 없습니다.','@Transactional public void runtime() {\n    jdbc.update("insert into ledger values(\'runtime\')");\n    throw new IllegalStateException("runtime");\n}',[['프록시 밖 예외','IllegalStateException'],['최종 ledger','[]'],['자원 동작','rollback']],['default-runtime-rolls-back'],['defaultRuntime'],{active:[0,2]}),
    stage('rules','no-rollback','noRollbackFor면 runtime도 commit','별도 추가 noRollback()은 IllegalStateException을 명시 noRollbackFor로 지정했습니다. 같은 종류 예외가 나와도 이 run의 ledger 행은 남았습니다.','@Transactional(noRollbackFor=IllegalStateException.class)\npublic void noRollback() {\n    jdbc.update("insert into ledger values(\'no-rollback\')");\n    throw new IllegalStateException("keep");\n}',[['명시 규칙','noRollbackFor=IllegalStateException.class'],['최종 ledger','[no-rollback]'],['자원 동작','commit']],['noRollbackFor-runtime-commits'],['noRollbackFor'],{active:[0,3]}),
    stage('rules','caught','같은 메서드가 잡으면 정상 반환','추가 caught()는 자기 메서드 안에서 runtime 예외를 잡고 정상 반환했습니다. 이 경우 프록시로 예외가 나오지 않았고 ledger caught가 commit됐습니다.','@Transactional public void caught() {\n    jdbc.update("insert into ledger values(\'caught\')");\n    try { throw new IllegalStateException("caught"); }\n    catch (IllegalStateException ignored) {}\n}',[['예외 처리 위치','같은 대상 메서드 안'],['프록시 관찰','정상 반환'],['최종 ledger','[caught]']],['caught-runtime-normal-return-commits'],['caughtRuntime'],{active:[2,3]}),
  ]},
  {id:'proxy',question:'같은 애노테이션도 호출 경로에 따라 달라질까?',source:scope+' · 원문 직접 new / 추가 self-invocation / 추가 외부 프록시',sourceNote:'직접 new한 원문 서비스와 추가 selfInvoke/runtime 변형을 구분합니다. 애노테이션 존재와 실제 프록시 경계 적용은 다른 관측입니다.',note:transferNote+' ExtraRules.runtime은 추가 변형입니다. JDBC autocommit 결과를 Spring transaction commit과 같다고 표시하지 않습니다. '+limits,stages:[
    stage('proxy','direct','직접 new는 transaction 없음','원문 서비스를 직접 new해 같은 강제 checked 실패를 호출했습니다. active=false이며 debit은 autocommit되어 observer가750/100을 읽었습니다.','new TransferService(ctx.getBean(TransferRepository.class))\n    .transfer(1, 2, 250);',[['호출 경로','원문 TransferService 직접 new'],['repository active / sync',flags('directOriginal','original-repository-debit')],['최종 별도 observer','750 / 100'],['결과 경계','추가 debit autocommit · 원문 rollbackFor 프록시 미적용']],['direct-new-annotation-no-transaction','direct-new-debit-autocommits'],['directOriginal'],{active:[0,1]}),
    stage('proxy','self','this.runtime은 advice 우회','프록시 빈의 selfInvoke()는 자체 transaction 선언이 없고 this.runtime()으로 호출합니다. 내부 runtime의 애노테이션 경계를 통과하지 않아 active=false이고 runtime 행이 남았습니다.','public void selfInvoke() { this.runtime(); }\n// 추가 ExtraRules.runtime()은 @Transactional 선언',[['호출 경로','추가 selfInvoke → this.runtime'],['내부 active / sync',flags('selfInvocation','default-runtime')],['최종 ledger','[runtime] · autocommit']],['self-invocation-bypasses-advice','self-invocation-write-autocommits'],['selfInvocation']),
    stage('proxy','external','외부 프록시 호출은 rollback','동일한 추가 runtime 메서드를 빈 프록시의 외부에서 직접 호출하면 active=true이며 예외로 rollback됩니다. 앞 self-invocation run과 별개입니다.','extra.runtime();\n// 추가 @Transactional public void runtime()',[['호출 경로','외부 → CGLIB 프록시 → runtime'],['active / sync',flags('defaultRuntime','default-runtime')],['최종 ledger','[]']],['default-runtime-rolls-back'],['defaultRuntime']),
  ]},
  {id:'template',question:'정상 반환하면서 rollbackOnly를 표시할 수 있을까?',source:scope+' · 원문 ImportService + 추가 저장소 fixture',sourceNote:'추가 ImportRepository는 의도적으로 INSERT한 뒤 제어 플래그에 따라 false를 반환합니다. 실제 insertIfAbsent·중복 키 구현이 아닙니다.',note:'원문 TransactionTemplate의 분기를 그대로 실행했습니다. true/false run은 별도 초기화하며 false는 실제 중복을 발견한 결과가 아니라 추가 fixture의 강제 반환입니다. '+limits,stages:[
    stage('template','true','true면 행과 반환값 유지','추가 저장소가 import-ok를 INSERT하고 true를 반환했습니다. 원문 importOne도 true를 반환하고 ledger의 import-ok가 commit됐습니다.','return Boolean.TRUE.equals(transactions.execute(status -> {\n    boolean inserted = repository.insertIfAbsent(key, value);\n    if (!inserted) {\n        status.setRollbackOnly();\n    }\n    return inserted;\n}));',[['추가 저장소 반환','true'],['원문 importOne 반환','true'],['최종 ledger','[import-ok]']],['original-import-true-result','original-import-true-commits'],['originalImportSuccess']),
    stage('template','rollback-only','false와 setRollbackOnly','추가 저장소가 import-false를 INSERT한 뒤 false를 반환하도록 강제했습니다. 원문이 setRollbackOnly를 호출해 예외 없이 false로 반환하되 행은 rollback됐습니다.','return Boolean.TRUE.equals(transactions.execute(status -> {\n    boolean inserted = repository.insertIfAbsent(key, value);\n    if (!inserted) {\n        status.setRollbackOnly();\n    }\n    return inserted;\n}));',[['추가 저장소 동작','INSERT 후 강제 false'],['원문 importOne 반환','false'],['최종 ledger','[]'],['자원 동작','rollback']],['original-import-false-result','original-import-setRollbackOnly-removes-insert'],['originalImportRollbackOnly'],{active:[2,3,5]}),
  ]},
  {id:'required',question:'안쪽 예외를 잡았는데 왜 바깥 commit도 실패할까?',source:scope+' · 추가 Outer/Inner REQUIRED',sourceNote:'추가 Outer와 Inner를 각각 프록시로 호출합니다. 같은 메서드 내부 catch 예제와 달리 안쪽 프록시가 먼저 rollback-only를 표시합니다.',note:'inner.required 실패를 outer가 잡아도 같은 물리 transaction의 rollback-only가 남았습니다. 최종 UnexpectedRollbackException과 전체 rollback을 구분해 봅니다. '+limits,stages:[
    stage('required','inner','두 논리 범위는 같은 연결','추가 outer-required-start와 inner-required는 모두 active=true이며 같은 tracked connection85였습니다. 각각 outer와 inner-required 삽입을 시도했습니다.','// 추가 Outer.requiredCaught의 호출·catch 구간 발췌\ntry { inner.required(); }\ncatch (IllegalArgumentException ignored) { snap("outer-required-caught"); }',[['outer 연결',conn('requiredRollbackOnly','outer-required-start')],['inner 연결',conn('requiredRollbackOnly','inner-required')],['active / sync',flags('requiredRollbackOnly','inner-required')],['관계','REQUIRED 참여 · 같은 물리 transaction']],['required-shares-one-bound-connection'],['requiredRollbackOnly'],{active:[1]}),
    stage('required','caught','바깥 catch 뒤에도 rollbackOnly','inner.required의 runtime 예외를 outer가 잡은 시점에도 active=true입니다. 하지만 currentTransactionStatus.isRollbackOnly()는 true였습니다.','try { inner.required(); }\ncatch (IllegalArgumentException ignored) {\n    // 추가 probe에서 rollbackOnly 상태 기록\n}',[['outer catch 시 연결',conn('requiredRollbackOnly','outer-required-caught')],['rollbackOnly','true'],['정상처럼 보이는 범위','outer 메서드가 예외를 잡은 뒤']],['required-caught-is-rollback-only'],['requiredRollbackOnly'],{active:[0,1]}),
    stage('required','final','최종 UnexpectedRollbackException','바깥 경계가 commit을 시도할 때 UnexpectedRollbackException이 발생했습니다. 실제 자원 동작은 rollback이고 최종 ledger는 비었습니다.','try { outer.requiredCaught(); }\ncatch (UnexpectedRollbackException expected) {}',[['호출자 관찰','UnexpectedRollbackException'],['최종 ledger','[] · outer와 inner-required 모두 없음'],['자원 동작','rollback 기록 있음 / commit 기록 없음']],['required-caught-inner-still-rolls-back-all','required-physical-rollback-recorded'],['requiredRollbackOnly'],{active:[0,1]}),
  ]},
  {id:'new',question:'REQUIRES_NEW의 안쪽 commit은 바깥 rollback과 같을까?',source:scope+' · 추가 REQUIRES_NEW 독립 경계',sourceNote:'추가 run의 tracked connection91(outer)과92(inner)를 비교합니다. 이 번호는 트래킹용 연결 식별자이며 DB 세션 번호나 풀 사용량 계측이 아닙니다.',note:'보류된 outer와 독립 inner의 물리 경계를 비교한 추가 실험입니다. 이 실행에서 풀 고갈·연결 지연시간을 측정하지 않았습니다. '+limits,stages:[
    stage('new','outer','바깥 연결91에서 시작','추가 outer transaction이 outer 행을 INSERT하고 안쪽 프록시를 호출합니다. 바깥은 tracked connection91에 묶여 있습니다.','@Transactional public void newThenFail() {\n    jdbc.update("insert into ledger values(\'outer\')");\n    inner.independent();\n    throw new IllegalArgumentException("outer-failure");\n}',[['outer 연결',conn('requiresNew','outer-new-start')],['outer active / sync',flags('requiresNew','outer-new-start')],['후속 호출','inner.independent · REQUIRES_NEW']],[],['requiresNew'],{active:[0,2]}),
    stage('new','inner','안쪽은 연결92로 독립 commit','안쪽 REQUIRES_NEW는 tracked connection92를 사용했습니다. resourceActions에는 inner 연결의 commit이 기록됐으며 outer와 다른 연결입니다.','@Transactional(propagation=Propagation.REQUIRES_NEW)\npublic void independent() {\n    jdbc.update("insert into ledger values(\'inner-new\')");\n}',[['inner 연결',conn('requiresNew','inner-new')],['outer와 동일 여부','서로 다른 tracked connection'],['inner 자원 동작','connection92 commit']],['requires-new-inner-commit-outer-rollback'],['requiresNew'],{active:[0,2]}),
    stage('new','resumed','outer 재개·rollback 뒤 inner만 남음','inner 종료 후 같은 outer 연결91이 재개됐습니다. outer가 runtime 예외로 rollback해도 최종 ledger에는 독립 commit한 inner-new가 남았습니다.','inner.independent();\nsnap("outer-new-resumed");\nthrow new IllegalArgumentException("outer-failure");',[['재개한 outer 연결',conn('requiresNew','outer-new-resumed')],['최종 ledger','[inner-new] · outer 없음'],['자원 동작','inner92 commit / outer91 rollback']],['requires-new-survives-outer-rollback','requires-new-different-inner-connection-outer-resumes'],['requiresNew'],{active:[0,1,2]}),
  ]},
  {id:'nested',question:'NESTED의 부분 rollback은 독립 commit일까?',source:scope+' · 추가 JDBC savepoint 실험',sourceNote:'이 DataSourceTransactionManager/H2 조합의 NESTED 실측입니다. 다른 관리자·JPA·드라이버에서 같은 지원을 보장한 결과가 아닙니다.',note:'같은 tracked connection98 안에서 savepoint를 만들고 그 지점으로 rollback했습니다. 안쪽의 독립 commit이 아니라 바깥 물리 transaction의 부분 rollback입니다. '+limits,stages:[
    stage('nested','same','안팎은 같은 연결98','outer-nested-start와 inner-nested는 같은 연결98에서 실행됐습니다. 안쪽은 NESTED 선언으로 savepoint 경계를 사용합니다.','@Transactional(propagation=Propagation.NESTED)\npublic void nested() {\n    snap("inner-nested");\n    jdbc.update("insert into ledger values(\'inner-nested\')");\n    throw new IllegalArgumentException("nested-failure");\n}',[['outer 연결',conn('nested','outer-nested-start')],['inner 연결',conn('nested','inner-nested')],['물리 연결 관계','같은 연결 · REQUIRES_NEW와 다름']],['nested-one-physical-connection'],['nested']),
    stage('nested','savepoint','savepoint로 안쪽만 rollback','안쪽 예외를 바깥에서 잡았습니다. 트래킹 기록은 setSavepoint, rollback(savepoint), releaseSavepoint이며 연결 전체 rollback이 아니었습니다.','try { inner.nested(); }\ncatch (IllegalArgumentException ignored) { snap("outer-nested-caught"); }',[['실측 자원 동작','setSavepoint → rollback(savepoint) → releaseSavepoint'],['재개 연결',conn('nested','outer-nested-caught')],['물리 전체 rollback','기록 없음']],['nested-savepoint-rollback-and-final-commit'],['nested'],{active:[0,1]}),
    stage('nested','commit','마지막 commit은 outer만 확정','outer가 정상 종료해 같은 연결98의 물리 transaction을 commit했습니다. 최종 ledger에는 outer만 있고 inner-nested는 없습니다.','outer.nestedCaught();\n// 같은 물리 transaction 최종 commit',[['최종 ledger','[outer]'],['안쪽 inner-nested 행','없음 · savepoint rollback'],['최종 자원 동작','connection98 commit']],['nested-savepoint-keeps-outer-only'],['nested']),
  ]},
  {id:'contracts',question:'transaction active와 synchronization은 같은 뜻일까?',source:scope+' · 추가 SUPPORTS / MANDATORY / NOT_SUPPORTED / NEVER',sourceNote:'active는 실제 transaction 활성 표시이고 synchronization은 동기화 범위 표시입니다. active=false여도 sync=true일 수 있습니다.',note:'전파 계약은 이 Spring JDBC 관리자에서 관찰했습니다. 자원 정리 중 남은 thread-local 표시나 synchronization만으로 DB commit 여부를 판단하지 않습니다. '+limits,stages:[
    stage('contracts','outside','바깥 transaction 없는 SUPPORTS','추가 inner.supports()는 기존 transaction 없이 호출됐습니다. active=false지만 synchronization=true였고 bound connection은 없었습니다. MANDATORY는 이 바깥 조건에서 거부됐습니다.','inner.supports();\n// 별도 호출: inner.mandatory() → IllegalTransactionStateException',[['SUPPORTS active / sync',flags('contractsOutside','inner-supports')],['bound connection',conn('contractsOutside','inner-supports')],['transaction 없는 MANDATORY','IllegalTransactionStateException']],['supports-without-transaction-inactive','supports-can-have-synchronization','mandatory-without-transaction-rejects'],['contractsOutside'],{active:[0,1]}),
    stage('contracts','inside','안에서는 SUPPORTS·MANDATORY 참여','추가 outer transaction 안에서 두 메서드를 호출했습니다. SUPPORTS와 MANDATORY는 모두 active=true이고 outer의 연결108을 공유했습니다.','inner.supports();\ninner.mandatory();',[['outer 연결',conn('contractsInside','outer-contracts')],['SUPPORTS 연결',conn('contractsInside','inner-supports')],['MANDATORY 연결',conn('contractsInside','inner-mandatory')],['두 메서드 active','true']],[],['contractsInside'],{active:[0,1]}),
    stage('contracts','suspended','NOT_SUPPORTED는 보류·NEVER는 거부','같은 outer 안에서 NOT_SUPPORTED는 active=false·bound connection 없음으로 관찰됐습니다. 이후 NEVER 호출은 기존 transaction 때문에 거부됐습니다.','inner.notSupported();\ntry { inner.never(); }\ncatch (IllegalTransactionStateException expected) { snap("never-rejected"); }',[['NOT_SUPPORTED active / sync',flags('contractsInside','inner-not-supported')],['NOT_SUPPORTED bound connection',conn('contractsInside','inner-not-supported')],['NEVER 호출','IllegalTransactionStateException · 대상 never 본문 진입 안 함'],['거부 뒤 outer 연결',conn('contractsInside','never-rejected')]],['not-supported-suspends-physical-transaction','never-rejects-existing-transaction'],['contractsInside'],{active:[0,1,2]}),
  ]},
  {id:'readonly',question:'readOnly=true면 이 DB의 쓰기를 막았을까?',source:scope+' · 추가 readOnlyWrite',sourceNote:'readOnly는 권한 규칙이 아닌 힌트입니다. 여기서는 setReadOnly(true) 호출과 H2의 실제 쓰기 결과를 각각 확인했습니다.',note:'추가 H2 JDBC 결과를 다른 DB·드라이버·JPA 최적화·보안 권한으로 일반화하지 않습니다. '+limits,stages:[
    stage('readonly','hint','readOnly 표시와 JDBC 힌트','추가 readOnlyWrite 진입 시 readOnly=true였고 실제 연결 메서드 setReadOnly(true)가 기록됐습니다. 이 사실만으로 쓰기 차단을 주장하지 않습니다.','@Transactional(readOnly=true)\npublic void readOnlyWrite() {\n    snap("read-only-write");\n    jdbc.update("insert into ledger values(\'read-only-write\')");\n}',[['진입 active / sync',flags('readOnlyHint','read-only-write')],['transaction readOnly','true'],['JDBC 호출 기록','connection113 setReadOnly(true)']],[],['readOnlyHint']),
    stage('readonly','write','이 H2 쓰기는 commit됨','추가 read-only-write 삽입은 이 H2에서 성공하고 commit됐습니다. 최종 ledger에 행이 있으며 종료 정리에서 setReadOnly(false)도 기록됐습니다.','extra.readOnlyWrite();\n// 최종 ledger: read-only-write',[['최종 ledger','[read-only-write]'],['실측 자원 동작','commit · 정리 중 setReadOnly(false)'],['해석 범위','이 관리자/H2 쓰기 결과 · 쓰기 금지 보안 규칙 아님']],['read-only-hint-does-not-block-this-h2-write'],['readOnlyHint']),
  ]},
  {id:'events',question:'AFTER_COMMIT 알림 실패가 DB commit을 되돌릴까?',source:scope+' · 원문 OrderNotificationListener + 추가 발행자·gateway',sourceNote:'NotificationGateway는 메모리 호출 기록과 제어 실패를 제공하는 추가 fixture입니다. broker 전달·ack·outbox·CDC를 실행한 결과가 아닙니다.',note:'원문 AFTER_COMMIT 리스너는 이 버전에서 afterCompletion 경로로 실행됐습니다. callback에서 active=true·sync=false여도 물리 DB가 미커밋이라는 뜻이 아닙니다. 메모리 gateway 호출을 내구성 있는 메시지 전달로 해석하지 않습니다. '+limits,stages:[
    stage('events','commit','commit 뒤 원문 gateway 호출','추가 event(false)가 order 행과 이벤트77을 발행했습니다. 발행 메서드 안의 after 지점보다 뒤에 원문 리스너의 gateway가 호출됐고 DB commit은 유지됐습니다.','@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)\npublic void afterCommit(OrderCommitted event) {\n    gateway.publishOrderCommitted(event.orderId());\n}',[['최종 ledger','[order]'],['gateway 메모리 호출','[77]'],['관측 timeline 순서','event-publish-before → event-publish-after → original-after-commit-gateway'],['callback active / sync',flags('afterCommit','original-after-commit-gateway')],['commit 해석','callback active 플래그는 DB 미커밋 증거 아님']],['original-listener-after-commit-notifies','original-listener-after-publish-return'],['afterCommit'],{active:[0,2]}),
    stage('events','rollback','rollback이면 원문 리스너 미호출','별도 추가 event(true)가 발행 뒤 runtime 예외를 던졌습니다. transaction이 rollback되어 order 행이 없고 gateway 호출 기록도 없습니다.','try { extra.event(true); }\ncatch (IllegalArgumentException expected) {}',[['최종 ledger','[]'],['gateway 메모리 호출','[]'],['원문 AFTER_COMMIT','이번 rollback에서는 실행 안 함']],['rollback-skips-original-after-commit','event-rollback-row-absent'],['eventRollback']),
    stage('events','no-tx','transaction 밖 이벤트도 기본 미호출','추가 컨텍스트에서 transaction 없이 이벤트88을 발행했습니다. 원문 리스너에는 fallbackExecution=true가 없으므로 gateway 호출은 없었습니다.','ctx.publishEvent(new OrderCommitted(88L));',[['발행 입력','OrderCommitted(88) · transaction 없음'],['gateway 메모리 호출','[]'],['원문 설정','AFTER_COMMIT · fallbackExecution 기본 false']],['no-transaction-skips-original-listener'],['eventNoTransaction']),
    stage('events','gateway-failure','실패는 로그로 남고 정상 반환','추가 failGateway=true에서 gateway는77 호출을 기록한 뒤 IllegalStateException을 던졌습니다. afterCompletion 오류가 로그에 남았지만 event(false)는 정상 반환했고 order 행은 commit된 채 남았습니다.','failGateway = true;\nextra.event(false);\n// gateway: notifications.add(id); 이후 gateway-failure 예외',[['gateway 메모리 호출','[77] · broker ack 아님'],['gateway 제어 실패','IllegalStateException: gateway-failure'],['호출자 결과','event(false) 정상 반환 · 예외 전파 안 됨'],['최종 ledger','[order] · DB commit 유지'],['로그 경로','TransactionSynchronization.afterCompletion threw exception']],['listener-after-completion-failure-not-propagated','listener-failure-does-not-undo-commit'],['afterCommitFailure'],{active:[0,1,2]}),
  ]},
];
export const S08_ASSETS = {
  "S08-transfer": {
    "file": "S08-transfer-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "한 번의 이체에서 어느 값이 아직 미커밋일까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "transfer-debit": [
        0.5,
        13,
        35,
        81
      ],
      "transfer-commit": [
        36,
        13,
        30,
        81
      ],
      "transfer-checked": [
        66.6,
        13,
        32.8,
        81
      ]
    }
  },
  "S08-rules": {
    "file": "S08-rules-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "예외를 던지면 언제나 rollback될까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "rules-checked": [
        1,
        8,
        48.7,
        44.6
      ],
      "rules-runtime": [
        50.2,
        8,
        48.8,
        44.6
      ],
      "rules-no-rollback": [
        1,
        53.5,
        48.7,
        43
      ],
      "rules-caught": [
        50.2,
        53.5,
        48.8,
        43
      ]
    }
  },
  "S08-proxy": {
    "file": "S08-proxy-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 애노테이션도 호출 경로에 따라 달라질까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "proxy-direct": [
        50.4,
        6.5,
        49,
        47
      ],
      "proxy-self": [
        50.4,
        55,
        49,
        41
      ],
      "proxy-external": [
        0.7,
        55,
        49,
        41
      ]
    }
  },
  "S08-template": {
    "file": "S08-template-v4.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "정상 반환하면서 rollbackOnly를 표시할 수 있을까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "template-true": [
        0.8,
        12.5,
        48.7,
        80
      ],
      "template-rollback-only": [
        50.5,
        12.5,
        48.7,
        80
      ]
    }
  },
  "S08-required": {
    "file": "S08-required-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "안쪽 예외를 잡았는데 왜 바깥 commit도 실패할까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "required-inner": [
        0.5,
        10.5,
        36,
        71
      ],
      "required-caught": [
        38.2,
        10.5,
        28.3,
        71
      ],
      "required-final": [
        68,
        10.5,
        31.5,
        71
      ]
    }
  },
  "S08-new": {
    "file": "S08-new-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "REQUIRES_NEW의 안쪽 commit은 바깥 rollback과 같을까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "new-outer": [
        1.1,
        18,
        31.4,
        40
      ],
      "new-inner": [
        34.8,
        18,
        30.7,
        42
      ],
      "new-resumed": [
        67.7,
        18,
        31.1,
        63.7
      ]
    }
  },
  "S08-nested": {
    "file": "S08-nested-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "NESTED의 부분 rollback은 독립 commit일까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "nested-same": [
        1.2,
        21.6,
        30.4,
        47.5
      ],
      "nested-savepoint": [
        34.1,
        21.6,
        31.1,
        47.5
      ],
      "nested-commit": [
        68.8,
        21.6,
        30.3,
        47.5
      ]
    }
  },
  "S08-contracts": {
    "file": "S08-contracts-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "transaction active와 synchronization은 같은 뜻일까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "contracts-outside": [
        1.2,
        27.5,
        51.1,
        39
      ],
      "contracts-inside": [
        1.2,
        68,
        48.4,
        28
      ],
      "contracts-suspended": [
        50.2,
        68,
        49,
        28
      ]
    }
  },
  "S08-readonly": {
    "file": "S08-readonly-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "readOnly=true면 이 DB의 쓰기를 막았을까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "readonly-hint": [
        1.2,
        12.3,
        48.6,
        82.2
      ],
      "readonly-write": [
        50.3,
        12.3,
        48.9,
        82.2
      ]
    }
  },
  "S08-events": {
    "file": "S08-events-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "AFTER_COMMIT 알림 실패가 DB commit을 되돌릴까? 원문 세 클래스와 명시한 추가 Spring/H2 저장소·제어 예제를 구분한 설명 그림.",
    "focus": {
      "events-commit": [
        0.5,
        9.3,
        49,
        46
      ],
      "events-rollback": [
        50.3,
        9.3,
        49,
        46
      ],
      "events-no-tx": [
        0.5,
        56.3,
        49,
        38.5
      ],
      "events-gateway-failure": [
        50.3,
        56.3,
        49,
        38.5
      ]
    }
  }
};
