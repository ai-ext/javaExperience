// 원문 Controller와 별도 SourceProbe/Resource/DebugTarget/ThreadTarget/Git·모델을 구분한다.
export const d05AssetRoot = '../design/d05-2026-10-21/images/';
export const D05_RUNS = {
  "checks": [
    "original-source-preserved-added-java21",
    "resolved-runtime-and-test-artifacts",
    "original-contract-two-junit-tests",
    "source-exception-cause-and-first-app-frame",
    "stack-common-frames-are-elided",
    "logger-level-does-not-decide-method-execution",
    "try-with-resources-suppressed-is-not-cause",
    "actual-http-normal-repeat",
    "actual-http-simulated-failure-repeat",
    "http-error-body-is-not-raw-server-stack",
    "binding-400-differs-from-handler-500",
    "own-http-process-and-port-closed",
    "controlled-single-branch-mutation-fails-regression",
    "restored-original-regression-passes",
    "jdwp-own-loopback-ephemeral-listener",
    "actual-jdb-breakpoint-and-locals",
    "actual-jdb-evaluation-changes-target-state",
    "actual-jdb-step-into-out-over",
    "evaluation-changes-later-observed-result",
    "two-own-thread-dumps-distinguish-monitor-and-latch",
    "own-thread-fixture-released-and-exited",
    "private-git-bisect-finds-controlled-first-bad",
    "bisect-reset-preserves-own-start-and-no-remotes"
  ],
  "facts": {
    "original-source-preserved-added-java21": {
      "sourceJava": 25,
      "sourceExecutedAtJava25": false,
      "addedJava": "21.0.6",
      "wrapper": "9.8.0",
      "originalJavaBytesPreserved": true
    },
    "resolved-runtime-and-test-artifacts": {
      "artifactCount": 47,
      "boot": "4.1.1",
      "framework": "7.0.9",
      "tomcat": "11.0.24",
      "logback": "1.5.38",
      "junit": "6.0.3"
    },
    "original-contract-two-junit-tests": {
      "tests": 2,
      "failures": 0,
      "errors": 0,
      "skipped": 0
    },
    "source-exception-cause-and-first-app-frame": {
      "top": "java.lang.IllegalStateException",
      "message": "order lookup failed",
      "firstAppFrame": "com.example.debuglab.OrderController.find",
      "sourceLine": 29,
      "cause": "java.sql.SQLException",
      "causeMessage": "simulated database timeout",
      "suppressed": 0,
      "dbCall": false,
      "scope": "source constructs a simulated exception; no JDBC/DB execution"
    },
    "stack-common-frames-are-elided": {
      "elidedCommonFrames": 2,
      "bottomIsAutomaticRootCause": false,
      "scope": "this SourceProbe call shares two frames; HTTP stack differs"
    },
    "logger-level-does-not-decide-method-execution": {
      "INFO": {
        "debugMarkerVisible": false,
        "methodResult": "OK"
      },
      "DEBUG": {
        "debugMarkerVisible": true,
        "methodResult": "OK"
      },
      "scope": "additional direct Logback logger level controls; not automatic request-ID/tracing"
    },
    "try-with-resources-suppressed-is-not-cause": {
      "primary": "java.lang.IllegalArgumentException:body failed",
      "cause": null,
      "suppressed": [
        "java.lang.IllegalStateException:close failed"
      ],
      "scope": "separate added Resource example, not OrderController/DB"
    },
    "actual-http-normal-repeat": {
      "id": 7,
      "statuses": [
        200,
        200
      ],
      "body": {
        "id": 7,
        "status": "OK"
      },
      "scope": "own loopback Boot, original Java at added Java21"
    },
    "actual-http-simulated-failure-repeat": {
      "id": 13,
      "statuses": [
        500,
        500
      ],
      "dbCall": false,
      "messageIsSimulated": true
    },
    "http-error-body-is-not-raw-server-stack": {
      "status": 500,
      "error": "Internal Server Error",
      "path": "/orders/13",
      "keys": [
        "error",
        "path",
        "status",
        "timestamp"
      ],
      "exceptionClassInBody": false,
      "scope": "actual default error JSON in this fixture; not all possible Boot configurations"
    },
    "binding-400-differs-from-handler-500": {
      "malformedPathVariable": 400,
      "missingRoute": 404,
      "handlerId13": 500
    },
    "own-http-process-and-port-closed": {
      "processExited": true,
      "portClosed": true,
      "scope": "own process terminated after observations; no existing service touched"
    },
    "controlled-single-branch-mutation-fails-regression": {
      "tests": 2,
      "failures": 2,
      "errors": 0,
      "skipped": 0,
      "changedCondition": "id == 13 -> id == 7",
      "scope": "only private copy mutated; source intentionally simulates failure at13"
    },
    "restored-original-regression-passes": {
      "tests": 2,
      "failures": 0,
      "errors": 0,
      "skipped": 0,
      "originalBytesRestored": true,
      "scope": "restore original intended 7=OK/13=simulated failure, not repairing DB"
    },
    "jdwp-own-loopback-ephemeral-listener": {
      "host": "127.0.0.1",
      "port": "allocated ephemeral P_DEBUG",
      "suspendAtStartup": false,
      "scope": "own added DebugTarget only; no IDE/Kubernetes/user JVM attach"
    },
    "actual-jdb-breakpoint-and-locals": {
      "method": "example.debug.DebugTarget.inspect",
      "id": 13,
      "counterBefore": 0,
      "scope": "actual JDK21 jdb CLI breakpoint, not IntelliJ UI"
    },
    "actual-jdb-evaluation-changes-target-state": {
      "expression": "example.debug.DebugTarget.bump()",
      "returned": 1,
      "counterBefore": 0,
      "counterAfter": 1,
      "scope": "additional DebugTarget field changed by own jdb method invocation; not source OrderController or IDE UI"
    },
    "actual-jdb-step-into-out-over": {
      "stepIntoTop": "DebugTarget.compute",
      "stepUpTop": "DebugTarget.inspect",
      "stepUpCallerLine": 11,
      "firstNextBeforeResultAssignmentLine": 12,
      "secondNextAfterAssignmentLine": 13,
      "nextResult": 27,
      "scope": "actual jdb step/step up/next; IDE conditional/log/exception breakpoint configurations remain model only"
    },
    "evaluation-changes-later-observed-result": {
      "withoutDebuggerEvaluation": 26,
      "afterBumpEvaluation": 27,
      "counter": 1,
      "ownDebugPortClosed": true
    },
    "two-own-thread-dumps-distinguish-monitor-and-latch": {
      "snapshots": [
        {
          "d05-holder": "WAITING",
          "d05-blocked": "BLOCKED",
          "d05-waiting": "WAITING"
        },
        {
          "d05-holder": "WAITING",
          "d05-blocked": "BLOCKED",
          "d05-waiting": "WAITING"
        }
      ],
      "blockedReason": "monitor held by d05-holder",
      "waitingReason": "CountDownLatch release",
      "scope": "own controlled threads/two snapshots; not production deadlock, CPU usage, heap or latency proof"
    },
    "own-thread-fixture-released-and-exited": {
      "releaseLatch": true,
      "threadsJoined": true,
      "exitCode": 0
    },
    "private-git-bisect-finds-controlled-first-bad": {
      "commits": [
        "C1",
        "C2",
        "C3",
        "C4",
        "C5",
        "C6",
        "C7"
      ],
      "knownGood": "C1",
      "knownBad": "C7",
      "firstBad": "C4",
      "branchMutation": "id == 13 -> id == 7",
      "predicate": "same Java21/dependencies; 7=OK and13=simulated SQLException cause",
      "actualPredicateRuns": [
        {
          "commit": "C4",
          "exit": 1
        },
        {
          "commit": "C3",
          "exit": 0
        }
      ],
      "scope": "private source-copy history; bisect identifies contract regression boundary, not universal causal proof"
    },
    "bisect-reset-preserves-own-start-and-no-remotes": {
      "resetTo": "C7",
      "remotes": 0,
      "scope": "own temp repository only; product worktree never bisected"
    }
  },
  "models": {
    "hypothesis-evidence": {
      "observation": "id13 repeatedly500; original code constructs simulated cause",
      "rejectedInference": "message alone proves real DB timeout",
      "singleVariable": "same source/environment, compare id7 and13",
      "limits": "not measured DB pool, SQL, network, cache, latency or operating incident"
    },
    "ide-breakpoint-and-evaluation": {
      "modelOnly": [
        "IntelliJ conditional/exception/log breakpoint",
        "All vs Thread suspension",
        "IDE Evaluate"
      ],
      "nativeObservedSeparately": "jdb method breakpoint/step/step up/next/eval changed added counter",
      "sameUIClaim": false
    },
    "incident-http-sql-boundary": {
      "modelOnly": [
        "request ID generation/propagation",
        "Chrome Network UI",
        "SQL/bind/plan and pool wait",
        "metrics/traces/heap/Kubernetes/rollback/deploy"
      ],
      "nativeObservedSeparately": [
        "own loopback HTTP",
        "two own Thread.print snapshots"
      ],
      "noRealDBOrProductionClaim": true
    }
  }
};
export const D05_ASSETS = {
  "D05-http": {
    "file": "http-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 Controller의 id7은200, id13은가상 예외500이며 long 변환400·미등록404를 구분한다. 추가 Java21 loopback 관측이다.",
    "focus": {
      "http-normal": [
        1,
        9,
        32,
        82
      ],
      "http-failure": [
        34,
        9,
        32,
        82
      ],
      "http-binding": [
        67,
        9,
        32,
        82
      ]
    }
  },
  "D05-stack": {
    "file": "stack.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 SourceProbe의 IllegalStateException·첫앱프레임·SQLException cause와 공통2frame생략을 별도 관계로 읽는다. 실제DB timeout 증거는 없다.",
    "focus": {
      "stack-top": [
        1,
        11,
        59,
        55
      ],
      "stack-cause": [
        61,
        48,
        38,
        38
      ],
      "stack-common": [
        1,
        68,
        59,
        20
      ]
    }
  },
  "D05-suppressed": {
    "file": "suppressed-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "별도 추가 Resource 예시에서 body failed가 primary이고 close failed가 suppressed 참조1개로 보존되며 cause는null이다.",
    "focus": {
      "suppressed-primary": [
        35,
        11,
        37,
        35
      ],
      "suppressed-close": [
        36,
        46,
        63,
        43
      ]
    }
  },
  "D05-logger": {
    "file": "logger.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "같은 find(7)이 실행돼OK를 반환해도 INFO에서는 추가 DEBUG marker가 숨겨지고 DEBUG에서는 보인다.",
    "focus": {
      "logger-info": [
        1,
        11,
        49,
        77
      ],
      "logger-debug": [
        51,
        11,
        48,
        77
      ]
    }
  },
  "D05-regression": {
    "file": "regression-v3.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "직접 JUnit2개는 원문 조건13에서통과, private조건7변이에서2실패, 원문복원뒤통과한다. Map의 status 선택필드만 발췌한다.",
    "focus": {
      "regression-original": [
        1,
        10,
        32,
        80
      ],
      "regression-mutant": [
        34,
        10,
        32,
        80
      ],
      "regression-restored": [
        67,
        10,
        32,
        80
      ]
    }
  },
  "D05-debugger": {
    "file": "debugger-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "별도 DebugTarget의 jdb평가가 counter를0에서1로 바꿔 후속결과를 baseline26에서27로 만든다. 자체 loopback 임시JDWP와 원문 Controller를 구분한다.",
    "focus": {
      "debugger-breakpoint": [
        1,
        10,
        34,
        64
      ],
      "debugger-evaluation": [
        35,
        20,
        32,
        54
      ],
      "debugger-result": [
        1,
        75,
        98,
        17
      ]
    }
  },
  "D05-stepping": {
    "file": "stepping-v2.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "실제 jdb는 compute로step, caller11bci4로stepup, next로대입전12, 둘째next로대입후13/result27에 멈춘다. 반환한compute는 caller stack에서 빠진다.",
    "focus": {
      "stepping-into": [
        39,
        33,
        60,
        12
      ],
      "stepping-caller": [
        39,
        45,
        60,
        13
      ],
      "stepping-next": [
        39,
        57,
        60,
        31
      ]
    }
  },
  "D05-threads": {
    "file": "threads-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "별도 ThreadTarget에서 holder는monitor를잡은채release latch에WAITING, blocked는monitor진입BLOCKED, waiting은monitor밖latchWAITING이다. held setup latch는생략했다.",
    "focus": {
      "threads-monitor": [
        1,
        35,
        39,
        43
      ],
      "threads-latch": [
        20,
        18,
        38,
        61
      ],
      "threads-released": [
        1,
        80,
        98,
        13
      ]
    }
  },
  "D05-bisect": {
    "file": "bisect-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "임시Git의같은Java회귀판정에서 C4bad와C3good만실제probe해첫badC4를찾고resetC7로복귀한다. C별칭과미실행commit을구분한다.",
    "focus": {
      "bisect-range": [
        1,
        10,
        98,
        33
      ],
      "bisect-run": [
        67,
        44,
        32,
        47
      ],
      "bisect-reset": [
        55,
        90,
        44,
        9
      ]
    }
  },
  "D05-hypothesis": {
    "file": "hypothesis-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "실제200·500관측과서버의가상SQLException메시지를 실제DB장애추론과분리한다. 동일source·환경에서입력id만바꾸는설명모델이다.",
    "focus": {
      "hypothesis-observation": [
        1,
        9,
        98,
        56
      ],
      "hypothesis-single": [
        1,
        64,
        51,
        24
      ]
    }
  },
  "D05-boundaries": {
    "file": "boundaries-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "IDE·DB·운영도구모델과 실제loopbackHTTP·별도DebugTarget jdb·ThreadTarget dump·직접JUnit·임시Git 증거를분리한다.",
    "focus": {
      "boundaries-ide": [
        1,
        17,
        98,
        13
      ],
      "boundaries-sql": [
        1,
        31,
        98,
        13
      ],
      "boundaries-operations": [
        1,
        45,
        98,
        13
      ]
    }
  }
};
export const D05_LESSONS = [
  {
    "id": "http",
    "question": "같은 원문 요청을 반복하면 무엇이 관찰될까요?",
    "source": "원문 Java byte exact + 추가 loopback Boot HTTP",
    "sourceNote": "원문 Java25/8080 환경은 미실행입니다. 실제 Java21.0.6·Boot4.1.1/FW7.0.9/Tomcat11.0.24·추가47 runtime/test 파일 환경의 관측입니다. 원문 SQLException은 생성한 가상 cause이며 실제 DB 호출은 없습니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "http-normal",
        "title": "id7은 두 번 모두200 OK",
        "lead": "추가 loopback 앱에서 원문 /orders/7을 두 번 호출해 같은 id7/statusOK 응답을 확인했습니다.",
        "code": "    private static final Logger log = LoggerFactory.getLogger(OrderController.class);\n\n    @GetMapping(\"/orders/{id}\")\n    Map<String, Object> find(@PathVariable long id) {\n        log.info(\"order lookup id={}\", id);\n        if (id == 13) {\n            throw new IllegalStateException(\n                    \"order lookup failed\",\n                    new SQLException(\"simulated database timeout\"));\n        }\n        return Map.of(\"id\", id, \"status\", \"OK\");\n    }",
        "active": [10],
        "values": [
          [
            "추가 요청",
            "GET /orders/7 · 두 번"
          ],
          [
            "실제 statuses",
            "[200,200]"
          ],
          [
            "실제 body",
            "id=7 / status=OK"
          ],
          [
            "원문 Java bytes / 추가 Java",
            "보존 true / 21.0.6"
          ]
        ],
        "checks": [
          "original-source-preserved-added-java21",
          "resolved-runtime-and-test-artifacts",
          "actual-http-normal-repeat"
        ],
        "runKeys": [
          "facts.original-source-preserved-added-java21",
          "facts.resolved-runtime-and-test-artifacts",
          "facts.actual-http-normal-repeat"
        ],
        "image": "D05-http"
      },
      {
        "id": "http-failure",
        "title": "id13은500 · 본문은서버 스택과 다름",
        "lead": "/orders/13은 두 번 모두500입니다. 실제 default error JSON에는 error/path/status/timestamp가 있고 예외 class는 없었습니다.",
        "code": "    private static final Logger log = LoggerFactory.getLogger(OrderController.class);\n\n    @GetMapping(\"/orders/{id}\")\n    Map<String, Object> find(@PathVariable long id) {\n        log.info(\"order lookup id={}\", id);\n        if (id == 13) {\n            throw new IllegalStateException(\n                    \"order lookup failed\",\n                    new SQLException(\"simulated database timeout\"));\n        }\n        return Map.of(\"id\", id, \"status\", \"OK\");\n    }",
        "active": [5, 6, 7, 8],
        "values": [
          [
            "실제 statuses",
            "[500,500]"
          ],
          [
            "default error",
            "Internal Server Error"
          ],
          [
            "JSON keys",
            "[error,path,status,timestamp]"
          ],
          [
            "exceptionClassInBody",
            "false"
          ],
          [
            "실제 DB 호출",
            "없음 · 가상 SQLException"
          ]
        ],
        "checks": [
          "actual-http-simulated-failure-repeat",
          "http-error-body-is-not-raw-server-stack"
        ],
        "runKeys": [
          "facts.actual-http-simulated-failure-repeat",
          "facts.http-error-body-is-not-raw-server-stack"
        ],
        "image": "D05-http"
      },
      {
        "id": "http-binding",
        "title": "변환400 · 미등록404 · handler500",
        "lead": "not-a-long 경로 변수는400, /missing은404, handler id13은500입니다. 관측 뒤 자체 HTTP process/port를 종료했습니다.",
        "code": "    malformed, missing = request('/orders/not-a-long'), request('/missing')",
        "active": [
          0
        ],
        "values": [
          [
            "/orders/not-a-long",
            "400 · path 변환"
          ],
          [
            "/missing",
            "404 · 미등록 경로"
          ],
          [
            "/orders/13",
            "500 · 원문 handler"
          ],
          [
            "HTTP process/port",
            "own 관측 뒤 종료"
          ]
        ],
        "checks": [
          "binding-400-differs-from-handler-500",
          "own-http-process-and-port-closed"
        ],
        "runKeys": [
          "facts.binding-400-differs-from-handler-500",
          "facts.own-http-process-and-port-closed"
        ],
        "image": "D05-http"
      }
    ]
  },
  {
    "id": "stack",
    "question": "최상위·첫 앱 프레임·cause는 어떻게 다를까요?",
    "source": "원문 예외 + 추가 direct SourceProbe",
    "sourceNote": "SourceProbe가 원문 Controller를 직접 부른 별도 관측입니다. common2는 이 SourceProbe 호출의 생략이며 HTTP 전체 스택의 생략 수가 아닙니다. SQLException 메시지는 실제 DB timeout 증거가 아닙니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "stack-top",
        "title": "최상위 예외와 첫 앱 프레임",
        "lead": "직접 SourceProbe에서 IllegalStateException과 첫 앱 프레임 OrderController.find/source line29를 관찰했습니다. 맨 아래를 자동 수정 위치로 삼지 않습니다.",
        "code": "            throw new IllegalStateException(\n                    \"order lookup failed\",\n                    new SQLException(\"simulated database timeout\"));",
        "active": [0, 1],
        "values": [
          [
            "top / message",
            "java.lang.IllegalStateException / order lookup failed"
          ],
          [
            "firstAppFrame",
            "com.example.debuglab.OrderController.find"
          ],
          [
            "SourceProbe sourceLine",
            "29"
          ]
        ],
        "checks": [
          "source-exception-cause-and-first-app-frame"
        ],
        "runKeys": [
          "facts.source-exception-cause-and-first-app-frame"
        ],
        "image": "D05-stack"
      },
      {
        "id": "stack-cause",
        "title": "cause는 만들어 넣은SQLException",
        "lead": "원문이 new SQLException으로 만든 cause는 simulated database timeout입니다. JDBC나 DB를 실행한 결과가 아닙니다.",
        "code": "            throw new IllegalStateException(\n                    \"order lookup failed\",\n                    new SQLException(\"simulated database timeout\"));",
        "active": [2],
        "values": [
          [
            "cause / causeMessage",
            "java.sql.SQLException / simulated database timeout"
          ],
          [
            "dbCall",
            "false"
          ],
          [
            "원문 예외 suppressed",
            "0"
          ]
        ],
        "checks": [
          "source-exception-cause-and-first-app-frame"
        ],
        "runKeys": [
          "facts.source-exception-cause-and-first-app-frame"
        ],
        "image": "D05-stack"
      },
      {
        "id": "stack-common",
        "title": "...2 more는 이 호출의 공통 프레임",
        "lead": "추가 SourceProbe 출력에서 공통 frame2개가 생략됐습니다. cause·호출자·생략 표기를 한 종류의 원인으로 읽지 않습니다.",
        "code": "            failure.printStackTrace(System.out);",
        "active": [
          0
        ],
        "values": [
          [
            "elidedCommonFrames",
            "2 · SourceProbe 호출 한정"
          ],
          [
            "bottomIsAutomaticRootCause",
            "false"
          ],
          [
            "HTTP 전체 stack의 생략 수",
            "이 값으로 일반화하지 않음"
          ]
        ],
        "checks": [
          "stack-common-frames-are-elided"
        ],
        "runKeys": [
          "facts.stack-common-frames-are-elided"
        ],
        "image": "D05-stack"
      }
    ]
  },
  {
    "id": "suppressed",
    "question": "본문 실패와 자원 종료 실패는 어떻게 연결될까요?",
    "source": "별도 추가 SuppressedProbe.Resource",
    "sourceNote": "OrderController/SQLException/DB와 다른 예시입니다. body failed가 primary이며 close failed는 suppressed 연결이고 cause는null입니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "suppressed-primary",
        "title": "본문 예외가primary · cause는null",
        "lead": "별도 Resource try-with-resources 본문이 IllegalArgumentException을 던졌습니다. 관측 primary는body failed이고 cause는null입니다.",
        "code": "        try (Resource resource = new Resource()) {\n            throw new IllegalArgumentException(\"body failed\");",
        "active": [1],
        "values": [
          [
            "primary",
            "java.lang.IllegalArgumentException:body failed"
          ],
          [
            "cause",
            "null"
          ],
          [
            "출처",
            "별도 추가 Resource 예시"
          ]
        ],
        "checks": [
          "try-with-resources-suppressed-is-not-cause"
        ],
        "runKeys": [
          "facts.try-with-resources-suppressed-is-not-cause"
        ],
        "image": "D05-suppressed"
      },
      {
        "id": "suppressed-close",
        "title": "close 실패는suppressed",
        "lead": "자원 close의 IllegalStateException:close failed가 suppressed1개로 보존됐습니다. primary를 대체한 cause가 아닙니다.",
        "code": "        @Override public void close() { throw new IllegalStateException(\"close failed\"); }",
        "active": [
          0
        ],
        "values": [
          [
            "suppressed",
            "[java.lang.IllegalStateException:close failed]"
          ],
          [
            "suppressed 개수",
            "1"
          ],
          [
            "cause와 관계",
            "별도 연결 · cause=null"
          ]
        ],
        "checks": [
          "try-with-resources-suppressed-is-not-cause"
        ],
        "runKeys": [
          "facts.try-with-resources-suppressed-is-not-cause"
        ],
        "image": "D05-suppressed"
      }
    ]
  },
  {
    "id": "logger",
    "question": "DEBUG가 안 보이면 메서드도 실행되지 않았을까요?",
    "source": "추가 SourceProbe의 직접 Logback level 제어",
    "sourceNote": "추가 D05_DEBUG_MARKER와 원문 find(7)의 method result를 비교했습니다. request ID/trace 전파·운영 로깅 정책을 자동 구현한 것이 아닙니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "logger-info",
        "title": "INFO에서는marker가 안 보여도OK",
        "lead": "직접 logger level을 INFO로 두면 추가 debug marker는 보이지 않았지만 find(7)의 결과는OK였습니다.",
        "code": "        for (Level level : new Level[] {Level.INFO, Level.DEBUG}) {\n            log.setLevel(level);\n            System.out.println(\"LEVEL_BEGIN=\" + level);\n            log.debug(\"D05_DEBUG_MARKER\");\n            System.out.println(\"METHOD_RESULT=\" + controller.find(7).get(\"status\"));\n            System.out.println(\"LEVEL_END=\" + level);\n        }",
        "active": [1, 4],
        "values": [
          [
            "추가 logger level",
            "INFO"
          ],
          [
            "debugMarkerVisible",
            "false"
          ],
          [
            "methodResult",
            "OK"
          ]
        ],
        "checks": [
          "logger-level-does-not-decide-method-execution"
        ],
        "runKeys": [
          "facts.logger-level-does-not-decide-method-execution"
        ],
        "image": "D05-logger"
      },
      {
        "id": "logger-debug",
        "title": "DEBUG에서는marker와OK 모두보임",
        "lead": "같은 추가 관찰의 DEBUG level에서는 marker가 보이고 methodResult도OK였습니다. 로그 출력 여부만으로 실행 여부를 판단하지 않습니다.",
        "code": "        for (Level level : new Level[] {Level.INFO, Level.DEBUG}) {\n            log.setLevel(level);\n            System.out.println(\"LEVEL_BEGIN=\" + level);\n            log.debug(\"D05_DEBUG_MARKER\");\n            System.out.println(\"METHOD_RESULT=\" + controller.find(7).get(\"status\"));\n            System.out.println(\"LEVEL_END=\" + level);\n        }",
        "active": [3, 4],
        "values": [
          [
            "추가 logger level",
            "DEBUG"
          ],
          [
            "debugMarkerVisible",
            "true"
          ],
          [
            "methodResult",
            "OK"
          ]
        ],
        "checks": [
          "logger-level-does-not-decide-method-execution"
        ],
        "runKeys": [
          "facts.logger-level-does-not-decide-method-execution"
        ],
        "image": "D05-logger"
      }
    ]
  },
  {
    "id": "regression",
    "question": "한 조건을 바꾸면 회귀 테스트가 무엇을 잡을까요?",
    "source": "추가 OrderRegressionTest + private 원문 사본 변이",
    "sourceNote": "원문의 의도는7=OK·13=가상 실패입니다. private 사본의 조건13→7만 바꿨다 원문을 복원했습니다. DB 버그를 수정하거나 학습자 소스를 고친 결과가 아닙니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "regression-original",
        "title": "원문 계약은JUnit2개 통과",
        "lead": "추가 JUnit6.0.3 테스트는7의OK와13의가상 SQLException cause를 확인해2개 통과했습니다.",
        "code": "    @Test void sevenIsNormal() { assertEquals(\"OK\", new OrderController().find(7).get(\"status\")); }\n    @Test void thirteenIsSimulatedFailure() {\n        IllegalStateException failure = assertThrows(IllegalStateException.class, () -> new OrderController().find(13));\n        assertInstanceOf(java.sql.SQLException.class, failure.getCause());\n        assertEquals(\"simulated database timeout\", failure.getCause().getMessage());\n    }",
        "active": [0, 2, 3, 4],
        "values": [
          [
            "tests / failures / errors / skipped",
            "2 / 0 / 0 / 0"
          ],
          [
            "추가 테스트 계약",
            "7=OK / 13=simulated SQLException cause"
          ]
        ],
        "checks": [
          "original-contract-two-junit-tests"
        ],
        "runKeys": [
          "facts.original-contract-two-junit-tests"
        ],
        "image": "D05-regression"
      },
      {
        "id": "regression-mutant",
        "title": "private 조건13→7이면2개 실패",
        "lead": "원문 사본의 조건 하나를 id==7로 바꾸자 두 회귀 테스트가 실패했습니다. 변경은 private 사본 안에만 있었습니다.",
        "code": "    mutant = original.replace('if (id == 13)', 'if (id == 7)')",
        "active": [
          0
        ],
        "values": [
          [
            "changedCondition",
            "id == 13 → id == 7"
          ],
          [
            "tests / failures / errors / skipped",
            "2 / 2 / 0 / 0"
          ]
        ],
        "checks": [
          "controlled-single-branch-mutation-fails-regression"
        ],
        "runKeys": [
          "facts.controlled-single-branch-mutation-fails-regression"
        ],
        "image": "D05-regression"
      },
      {
        "id": "regression-restored",
        "title": "원문 복원 뒤2개 다시통과",
        "lead": "private 사본을 원문 bytes로 복원해7=OK·13=가상 실패 계약이 다시2개 통과했습니다.",
        "code": "    sourcefile.write_text(original)\n    command('restored-regression', gradle + ['test'])",
        "active": [0, 1],
        "values": [
          [
            "tests / failures / errors / skipped",
            "2 / 0 / 0 / 0"
          ],
          [
            "originalBytesRestored",
            "true"
          ]
        ],
        "checks": [
          "restored-original-regression-passes"
        ],
        "runKeys": [
          "facts.restored-original-regression-passes"
        ],
        "image": "D05-regression"
      }
    ]
  },
  {
    "id": "debugger",
    "question": "평가식은 실행 상태를 바꿀 수 있을까요?",
    "source": "별도 추가 DebugTarget / JDK21 jdb CLI",
    "sourceNote": "원문 OrderController의 id13과 다른 예시입니다. 자체 loopback JDWP의 동적 port P_DEBUG에 jdb CLI로 연결했습니다. IDE UI/사용자 JVM/Kubernetes attach는 실행하지 않았습니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "debugger-breakpoint",
        "title": "inspect 중단 · id13/counter0",
        "lead": "own JDWP는127.0.0.1의 임시 port이며 suspend=n이었습니다. 실제 jdb method breakpoint에서 inspect의 id13과 counter0을 확인했습니다.",
        "code": "    debugger.send('stop in example.debug.DebugTarget.inspect')",
        "active": [
          0
        ],
        "values": [
          [
            "JDWP host / port",
            "127.0.0.1 / P_DEBUG · 동적 port 별칭"
          ],
          [
            "suspendAtStartup",
            "false"
          ],
          [
            "실제 method",
            "example.debug.DebugTarget.inspect"
          ],
          [
            "locals id / counterBefore",
            "13 / 0"
          ]
        ],
        "checks": [
          "jdwp-own-loopback-ephemeral-listener",
          "actual-jdb-breakpoint-and-locals"
        ],
        "runKeys": [
          "facts.jdwp-own-loopback-ephemeral-listener",
          "facts.actual-jdb-breakpoint-and-locals"
        ],
        "image": "D05-debugger"
      },
      {
        "id": "debugger-evaluation",
        "title": "bump() 평가 뒤counter1",
        "lead": "실제 jdb eval은 추가 DebugTarget.bump()를 호출해1을 반환했고 counter를0→1로 바꿨습니다. 관찰만 한 식이 아닙니다.",
        "code": "    evaluated = jdb('eval example.debug.DebugTarget.bump()')\n    after = jdb('print example.debug.DebugTarget.counter')",
        "active": [0, 1],
        "values": [
          [
            "expression",
            "example.debug.DebugTarget.bump()"
          ],
          [
            "returned",
            "1"
          ],
          [
            "counterBefore → counterAfter",
            "0 → 1"
          ]
        ],
        "checks": [
          "actual-jdb-evaluation-changes-target-state"
        ],
        "runKeys": [
          "facts.actual-jdb-evaluation-changes-target-state"
        ],
        "image": "D05-debugger"
      },
      {
        "id": "debugger-result",
        "title": "별도 baseline26 · 평가후27",
        "lead": "평가 없는 별도 DebugTarget 실행은26, bump 평가를 한 실행은27을 출력했습니다. 자체 debug port도 종료했습니다.",
        "code": "    static int counter = 0;\n    static int bump() { return ++counter; }\n    static int compute(int id) { return id * 2; }\n    static int inspect(int id) {\n        int doubled = compute(id);\n        int result = doubled + counter;\n        return result;\n    }",
        "active": [1, 4, 5, 6],
        "values": [
          [
            "withoutDebuggerEvaluation",
            "26 · 별도 baseline 실행"
          ],
          [
            "afterBumpEvaluation",
            "27"
          ],
          [
            "counter / ownDebugPortClosed",
            "1 / true"
          ]
        ],
        "checks": [
          "evaluation-changes-later-observed-result"
        ],
        "runKeys": [
          "facts.evaluation-changes-later-observed-result"
        ],
        "image": "D05-debugger"
      }
    ]
  },
  {
    "id": "stepping",
    "question": "정지한 줄은 이미 실행된 줄일까요?",
    "source": "같은 추가 DebugTarget / 실제 jdb step·step up·next",
    "sourceNote": "IDE Step UI가 아닌 jdb CLI 관측입니다. caller line11과 첫 next의line12는 result 대입 완료 시점이 아닙니다. 둘째 next의line13에서 result27을 관찰했습니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "stepping-into",
        "title": "step은compute 안으로",
        "lead": "실제 jdb step 후 최상위 frame은 DebugTarget.compute였습니다. 추가 입력은inspect(13)이며 원문 Controller가 아닙니다.",
        "code": "    into = jdb('step')\n    into_where = jdb('where')",
        "active": [
          0
        ],
        "values": [
          [
            "stepIntoTop",
            "DebugTarget.compute"
          ],
          [
            "예시 입력",
            "추가 DebugTarget.inspect(13)"
          ]
        ],
        "checks": [
          "actual-jdb-step-into-out-over"
        ],
        "runKeys": [
          "facts.actual-jdb-step-into-out-over"
        ],
        "image": "D05-stepping"
      },
      {
        "id": "stepping-caller",
        "title": "step up은caller line11로",
        "lead": "실제 step up 후 compute frame을 벗어나 DebugTarget.inspect의 caller line11로 돌아왔습니다. line 번호만으로 모든 대입 완료를 가정하지 않습니다.",
        "code": "    out = jdb('step up')\n    out_where = jdb('where')",
        "active": [
          0
        ],
        "values": [
          [
            "stepUpTop",
            "DebugTarget.inspect"
          ],
          [
            "stepUpCallerLine",
            "11"
          ]
        ],
        "checks": [
          "actual-jdb-step-into-out-over"
        ],
        "runKeys": [
          "facts.actual-jdb-step-into-out-over"
        ],
        "image": "D05-stepping"
      },
      {
        "id": "stepping-next",
        "title": "line12 대입전 → line13/result27",
        "lead": "next 첫 정지는line12의 result 대입 전입니다. 두 번째 next는line13으로 가서 result27을 확인했습니다.",
        "code": "    over = jdb('next')\n    over_assignment = jdb('next')\n    result = jdb('print result')",
        "active": [0, 1, 2],
        "values": [
          [
            "첫 next 정지",
            "line12 · result 대입 전"
          ],
          [
            "둘째 next 정지",
            "line13 · 대입 뒤"
          ],
          [
            "nextResult",
            "27"
          ]
        ],
        "checks": [
          "actual-jdb-step-into-out-over"
        ],
        "runKeys": [
          "facts.actual-jdb-step-into-out-over"
        ],
        "image": "D05-stepping"
      }
    ]
  },
  {
    "id": "threads",
    "question": "monitor 대기와latch 대기는 같은 상태일까요?",
    "source": "별도 추가 ThreadTarget / own jcmd Thread.print2회",
    "sourceNote": "자체 제어 thread 두 snapshot의 관측입니다. 운영 deadlock·CPU·heap·지연 증거가 아닙니다. holder는 monitor를 잡은 채 release latch를 기다립니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "threads-monitor",
        "title": "monitor 진입 대기는BLOCKED",
        "lead": "두 snapshot 모두 d05-blocked는 holder가 가진 monitor에 진입하려고 BLOCKED였습니다.",
        "code": "        Thread blocked = new Thread(() -> { synchronized (monitor) { System.out.println(\"BLOCKED_RELEASED\"); } }, \"d05-blocked\");",
        "active": [
          0
        ],
        "values": [
          [
            "두 snapshot d05-blocked",
            "BLOCKED / BLOCKED"
          ],
          [
            "blockedReason",
            "monitor held by d05-holder"
          ]
        ],
        "checks": [
          "two-own-thread-dumps-distinguish-monitor-and-latch"
        ],
        "runKeys": [
          "facts.two-own-thread-dumps-distinguish-monitor-and-latch"
        ],
        "image": "D05-threads"
      },
      {
        "id": "threads-latch",
        "title": "holder와waiting은WAITING",
        "lead": "두 snapshot에서 d05-holder와d05-waiting은 release CountDownLatch에서 WAITING입니다. holder의 WAITING이 그 monitor를 풀었다는 뜻은 아닙니다.",
        "code": "        Thread holder = new Thread(() -> { synchronized (monitor) { held.countDown(); try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } } }, \"d05-holder\");\n        holder.start(); held.await();\n        Thread blocked = new Thread(() -> { synchronized (monitor) { System.out.println(\"BLOCKED_RELEASED\"); } }, \"d05-blocked\");\n        Thread waiting = new Thread(() -> { try { release.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); } }, \"d05-waiting\");",
        "active": [0, 3],
        "values": [
          [
            "두 snapshot d05-holder",
            "WAITING / WAITING"
          ],
          [
            "두 snapshot d05-waiting",
            "WAITING / WAITING"
          ],
          [
            "waitingReason",
            "CountDownLatch release"
          ]
        ],
        "checks": [
          "two-own-thread-dumps-distinguish-monitor-and-latch"
        ],
        "runKeys": [
          "facts.two-own-thread-dumps-distinguish-monitor-and-latch"
        ],
        "image": "D05-threads"
      },
      {
        "id": "threads-released",
        "title": "latch 해제·join 뒤exit0",
        "lead": "추가 latch를 해제하고 세 thread를 join한 뒤 자체 ThreadTarget이 exit0으로 끝났습니다.",
        "code": "        release.countDown(); holder.join(); blocked.join(); waiting.join();",
        "active": [
          0
        ],
        "values": [
          [
            "releaseLatch / threadsJoined",
            "true / true"
          ],
          [
            "exitCode",
            "0"
          ]
        ],
        "checks": [
          "own-thread-fixture-released-and-exited"
        ],
        "runKeys": [
          "facts.own-thread-fixture-released-and-exited"
        ],
        "image": "D05-threads"
      }
    ]
  },
  {
    "id": "bisect",
    "question": "같은 판정으로 첫 실패commit을 찾으면 무엇을 알까요?",
    "source": "추가 private Git 원문 사본 history / actual bisect run",
    "sourceNote": "C1..C7은 실제 private commit의 설명 별칭입니다. 같은 Java21/의존성과7=OK·13=가상 cause 계약으로 판정했습니다. 사용자 저장소 bisect·원격 작업·보편 인과 증명은 아닙니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "bisect-range",
        "title": "알고 있는 범위는C1 good/C7 bad",
        "lead": "추가 private history는7개 commit이며 C4부터 조건13→7 변이가 있습니다. 알려진 goodC1/badC7으로 bisect를 시작했습니다.",
        "code": "    command('bisect-start', ['git', 'bisect', 'start', commits[-1], commits[0]], gitdir)",
        "active": [
          0
        ],
        "values": [
          [
            "commits · 설명 별칭",
            "[C1,C2,C3,C4,C5,C6,C7]"
          ],
          [
            "knownGood / knownBad",
            "C1 / C7"
          ],
          [
            "판정 기준",
            "같은 Java21/의존성 · 7=OK / 13=가상 cause"
          ]
        ],
        "checks": [
          "private-git-bisect-finds-controlled-first-bad"
        ],
        "runKeys": [
          "facts.private-git-bisect-finds-controlled-first-bad"
        ],
        "image": "D05-bisect"
      },
      {
        "id": "bisect-run",
        "title": "실제C4 bad·C3 good → 첫badC4",
        "lead": "실제 predicate 실행은C4 exit1과C3 exit0이었고 controlled first bad는C4였습니다. 실행하지 않은 중간 commit 판정을 만들지 않습니다.",
        "code": "    bisected, _ = command('bisect-run', ['git', 'bisect', 'run', sys.executable, str(criterion)], gitdir)",
        "active": [
          0
        ],
        "values": [
          [
            "actualPredicateRuns",
            "C4 exit1 → C3 exit0"
          ],
          [
            "firstBad",
            "C4"
          ],
          [
            "변이",
            "id == 13 → id == 7"
          ]
        ],
        "checks": [
          "private-git-bisect-finds-controlled-first-bad"
        ],
        "runKeys": [
          "facts.private-git-bisect-finds-controlled-first-bad"
        ],
        "image": "D05-bisect"
      },
      {
        "id": "bisect-reset",
        "title": "reset은시작C7로 · remote0",
        "lead": "탐색 뒤 private Git이 C7로 돌아왔고 remotes는0입니다. 제품 worktree를 bisect하지 않았습니다.",
        "code": "    command('bisect-reset', ['git', 'bisect', 'reset'], gitdir)",
        "active": [
          0
        ],
        "values": [
          [
            "resetTo / remotes",
            "C7 / 0"
          ],
          [
            "대상",
            "own temp repository만"
          ]
        ],
        "checks": [
          "bisect-reset-preserves-own-start-and-no-remotes"
        ],
        "runKeys": [
          "facts.bisect-reset-preserves-own-start-and-no-remotes"
        ],
        "image": "D05-bisect"
      }
    ]
  },
  {
    "id": "hypothesis",
    "question": "관측한500이 실제DB timeout을 뜻할까요?",
    "source": "원문·실측을 구분한 hypothesis-evidence 모델",
    "sourceNote": "관측과 추론을 나누는 설명 모델입니다. 원문이 simulated cause를 생성한다는 증거 외에 DB pool/SQL/네트워크/cache/latency/운영 incident를 측정하지 않았습니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "hypothesis-observation",
        "title": "500·가상cause 관측과DB 추론 분리",
        "lead": "id13 반복500과 원문 new SQLException은 관측입니다. 메시지만으로 실제 DB timeout을 입증한다는 추론은 이 모델에서 배제합니다.",
        "code": "'rejectedInference': 'message alone proves real DB timeout'",
        "active": [
          0
        ],
        "values": [
          [
            "관측 · 모델에 사용",
            "id13 반복500 / 원문 simulated cause 생성"
          ],
          [
            "배제한 추론",
            "메시지만으로 실제 DB timeout 입증"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.hypothesis-evidence"
        ],
        "image": "D05-hypothesis"
      },
      {
        "id": "hypothesis-single",
        "title": "입력id 하나만 바꿔 비교",
        "lead": "같은 source/environment에서 id7과13을 비교한다는 모델입니다. 시간·DB·cache 변화를 추가 실측한 것이 아닙니다.",
        "code": "'singleVariable': 'same source/environment, compare id7 and13'",
        "active": [
          0
        ],
        "values": [
          [
            "모델 singleVariable",
            "같은 source/environment · id7과13 비교"
          ],
          [
            "추가 성능·DB·운영 측정",
            "없음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.hypothesis-evidence"
        ],
        "image": "D05-hypothesis"
      }
    ]
  },
  {
    "id": "boundaries",
    "question": "어디까지 실측했고 무엇은 별도 증거가 필요할까요?",
    "source": "원문 IDE·SQL·운영 경계 모델",
    "sourceNote": "IDE UI·Chrome Network UI·request ID/trace 전파·SQL/bind/plan·pool wait·운영 metrics/traces/heap/Kubernetes/rollback/deploy는 미실행입니다. 별도 native jdb/HTTP/own Thread.print 관측과 섞지 않습니다.",
    "note": "강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·각 추가 예시·실측·모델을 구분하고 측정하지 않은 원인은 단정하지 않습니다.",
    "stages": [
      {
        "id": "boundaries-ide",
        "title": "jdb CLI와IDE UI는다른근거",
        "lead": "실제 jdb method breakpoint/step/eval은 추가 DebugTarget에서 관찰했습니다. IntelliJ 조건부·예외·로그 breakpoint와IDE Evaluate UI는 모델입니다.",
        "code": "'sameUIClaim': False",
        "active": [
          0
        ],
        "values": [
          [
            "nativeObservedSeparately",
            "추가 jdb method breakpoint/step/eval"
          ],
          [
            "sameUIClaim",
            "false"
          ],
          [
            "IDE UI",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.ide-breakpoint-and-evaluation"
        ],
        "image": "D05-boundaries"
      },
      {
        "id": "boundaries-sql",
        "title": "HTTP 응답만으로SQL·DB는모름",
        "lead": "own loopback HTTP는 관찰했지만 Chrome Network UI·생성 SQL·bind·실행계획·pool wait는 이 실험에서 측정하지 않았습니다.",
        "code": "'noRealDBOrProductionClaim': True",
        "active": [
          0
        ],
        "values": [
          [
            "관측한 native 증거",
            "own loopback HTTP"
          ],
          [
            "SQL/bind/plan/pool wait",
            "미측정"
          ],
          [
            "실제 DB/운영 증거 주장",
            "없음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.incident-http-sql-boundary"
        ],
        "image": "D05-boundaries"
      },
      {
        "id": "boundaries-operations",
        "title": "운영 지표·trace·K8s는미실행",
        "lead": "own Thread.print 두 snapshot을 운영 CPU/heap/trace·Kubernetes 진단으로 확대하지 않습니다. 원문의 운영 증거 사다리는 별도 모델입니다.",
        "code": "'metrics/traces/heap/Kubernetes/rollback/deploy'",
        "active": [
          0
        ],
        "values": [
          [
            "관측한 native 증거",
            "own Thread.print2회"
          ],
          [
            "metrics/traces/heap/Kubernetes/배포",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.incident-http-sql-boundary"
        ],
        "image": "D05-boundaries"
      }
    ]
  }
];
export const d05Run = path => path.split('.').reduce((value, key) => value?.[key], D05_RUNS);
