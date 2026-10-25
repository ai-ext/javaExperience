// 앱·own router·별도 H2 SchemaProof·설명 모델과 관측 종료 시점을 구분한다.
export const d06AssetRoot = '../design/d06-2026-10-21/images/';
export const D06_RUNS = {
  "checks": [
    "source-fragments-preserved-added-java21",
    "actual-pinned-runtime-and-separate-h2",
    "actual-executable-jar-preserves-source-yaml",
    "same-jar-two-profile-labels",
    "external-greeting-source-precedence",
    "deployed-artifact-and-feature-release-differ",
    "versioned-artifact-b-does-not-rebuild-a",
    "health-up-does-not-test-business-success",
    "toy-route-switch-and-rollback",
    "readiness-is-signal-not-direct-request-blocking",
    "readiness-restored-without-restarting-app",
    "finite-scheduled-canary-not-general-error-probability",
    "fixture-stop-rule-restores-blue-route",
    "own-router-socket-closed",
    "own-inflight-request-drains-after-sigterm",
    "explicit-timeout-variant-does-not-guarantee-completion",
    "separate-memory-schema-expand-keeps-old-query",
    "contract-breaks-old-column-query",
    "down-ddl-does-not-restore-lossy-data",
    "all-own-jvms-and-target-ports-closed"
  ],
  "facts": {
    "actual-executable-jar-preserves-source-yaml": {
      "bootLayout": true,
      "bytes": 21988506,
      "h2Packaged": false,
      "sha256": "b01aed8a89b4c1837ec0ef304575ee5f2260c97de6f8c0c9e63c1fb6c9422619",
      "sourceTimeout": "20s"
    },
    "actual-pinned-runtime-and-separate-h2": {
      "artifacts": 50,
      "boot": "4.1.1",
      "framework": "7.0.9",
      "h2": "2.4.240",
      "proofArtifacts": 1,
      "runtimeArtifacts": 49,
      "scope": "H2 is separate proofRuntime, not app DB/health or packaged dependency",
      "tomcat": "11.0.24"
    },
    "all-own-jvms-and-target-ports-closed": {
      "allPortsClosed": true,
      "artifactAUnchanged": true,
      "dependencyBytesUnchanged": true,
      "exitCodes": [
        143,
        143,
        143,
        143,
        143,
        143
      ],
      "ownJvmCount": 6,
      "scope": "native proof JVMs/router only; separate learning preview can remain running",
      "sourceFixtureUntouched": true
    },
    "contract-breaks-old-column-query": {
      "oldQuerySqlState": "42S22",
      "removedColumn": "full_name",
      "scope": "old SELECT fails after own H2 column drop; route/app rollback does not recreate schema"
    },
    "deployed-artifact-and-feature-release-differ": {
      "flagOff": {
        "released": false,
        "status": 404
      },
      "flagOn": {
        "released": true,
        "status": 200
      },
      "sameArtifact": "1.0.0",
      "scope": "startup flag differs between own JVMs, not hot runtime toggle/provider/cohort service"
    },
    "down-ddl-does-not-restore-lossy-data": {
      "original": "Ada  Lovelace",
      "originalLength": 13,
      "originalRestored": false,
      "ownConnectionClosed": true,
      "recreated": "Ada Lovelace",
      "recreatedLength": 12,
      "rowCount": 1,
      "scope": "specific manual normalization lost one space; down DDL executable is not data-equality proof"
    },
    "explicit-timeout-variant-does-not-guarantee-completion": {
      "addedCliOverride": "1s",
      "artifactSourceTimeout": "20s",
      "completed200": false,
      "gateReleased": false,
      "portClosed": true,
      "processExitCode": 143,
      "scope": "specific own bounded fixture; raw exception/status retained outside canonical, no universal supervisor timing claim"
    },
    "external-greeting-source-precedence": {
      "profile": [
        "local"
      ],
      "scope": "same demo.greeting conflict; active profile selects config and is a separate role",
      "selected": "from-cli",
      "sourcesHighToLow": [
        {
          "tier": "CLI",
          "value": "from-cli"
        },
        {
          "tier": "system",
          "value": "from-system"
        },
        {
          "tier": "environment",
          "value": "from-env"
        },
        {
          "tier": "profile-local",
          "value": "from-local"
        },
        {
          "tier": "base-properties",
          "value": "from-artifact"
        }
      ]
    },
    "finite-scheduled-canary-not-general-error-probability": {
      "observations": [
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "1.0.0",
          "route": "blue",
          "status": 200
        },
        {
          "artifact": "2.0.0",
          "route": "green",
          "status": 500
        },
        {
          "artifact": "2.0.0",
          "route": "green",
          "status": 500
        },
        {
          "artifact": "2.0.0",
          "route": "green",
          "status": 500
        }
      ],
      "observedFailures": 3,
      "requests": 10,
      "schedule": [
        "blue",
        "blue",
        "blue",
        "blue",
        "blue",
        "blue",
        "blue",
        "green",
        "green",
        "green"
      ],
      "scope": "deterministic toy schedule/finite observations; no random population estimate, performance benchmark or recommended production ratio"
    },
    "fixture-stop-rule-restores-blue-route": {
      "afterStopRoute": "blue",
      "afterStopStatus": 200,
      "fixtureRule": "any observed500 stops expansion",
      "greenDirectStatus": 500,
      "scope": "route change did not fix B property/data or undo external side effects"
    },
    "health-up-does-not-test-business-success": {
      "artifact": "2.0.0",
      "businessBody": {
        "artifact": "2.0.0",
        "business": "FAILED"
      },
      "businessStatus": 500,
      "health": {
        "groups": [
          "liveness",
          "readiness"
        ],
        "status": "UP"
      },
      "readiness": {
        "status": "UP"
      },
      "scope": "fixture business default false; default availability indicator has no business check"
    },
    "own-inflight-request-drains-after-sigterm": {
      "body": {
        "artifact": "1.0.0",
        "slow": "completed"
      },
      "inflightStatus": 200,
      "portClosed": true,
      "processExitCode": 143,
      "releasedAfterShutdownCommenced": true,
      "requestEnteredBeforeSignal": true,
      "scope": "one controlled own request, not all background jobs/connections or production SLA",
      "signal": "SIGTERM",
      "sourceTimeout": "20s",
      "waitingBeforeReleaseObserved": true
    },
    "own-router-socket-closed": {
      "socketClosed": true,
      "threadJoined": true
    },
    "readiness-is-signal-not-direct-request-blocking": {
      "directBusiness": 200,
      "globalHealth": {
        "body": {
          "groups": [
            "liveness",
            "readiness"
          ],
          "status": "OUT_OF_SERVICE"
        },
        "status": 503
      },
      "liveness": {
        "body": {
          "status": "UP"
        },
        "status": 200
      },
      "readiness": {
        "body": {
          "status": "OUT_OF_SERVICE"
        },
        "status": 503
      },
      "readinessState": "REFUSING_TRAFFIC",
      "routerBypassed": 200,
      "routerGuarded": 503,
      "scope": "application publication alone does not enforce HTTP exclusion; own router must read the signal"
    },
    "readiness-restored-without-restarting-app": {
      "appRestarted": false,
      "readinessState": "ACCEPTING_TRAFFIC",
      "routerStatus": 200
    },
    "same-jar-two-profile-labels": {
      "local": {
        "artifact": "1.0.0",
        "businessOk": true,
        "feature": false,
        "greeting": "from-local",
        "greetingSources": [
          {
            "tier": "profile-local",
            "value": "from-local"
          },
          {
            "tier": "base-properties",
            "value": "from-artifact"
          }
        ],
        "profiles": [
          "local"
        ],
        "readiness": "ACCEPTING_TRAFFIC",
        "shutdownTimeout": "20s"
      },
      "sameJarSHA256": "b01aed8a89b4c1837ec0ef304575ee5f2260c97de6f8c0c9e63c1fb6c9422619",
      "scope": "two own JVM/profile labels on one computer; not real staging/production promotion",
      "stg": {
        "artifact": "1.0.0",
        "businessOk": true,
        "feature": true,
        "greeting": "from-stg",
        "greetingSources": [
          {
            "tier": "profile-stg",
            "value": "from-stg"
          },
          {
            "tier": "base-properties",
            "value": "from-artifact"
          }
        ],
        "profiles": [
          "stg"
        ],
        "readiness": "ACCEPTING_TRAFFIC",
        "shutdownTimeout": "20s"
      }
    },
    "separate-memory-schema-expand-keeps-old-query": {
      "autoCommit": true,
      "backfillFamily": "Lovelace",
      "backfillGiven": "Ada",
      "backfillOldQuery": "Ada  Lovelace",
      "db": "H2 2.4.240 in-memory",
      "expandOldQuery": "Ada  Lovelace",
      "oldFullName": "Ada  Lovelace",
      "originalLength": 13,
      "rows": 1,
      "scope": "separate manual seed/backfill, not application DB, universal name splitting, MySQL/Flyway or online migration"
    },
    "source-fragments-preserved-added-java21": {
      "addedJava": "21.0.6",
      "originalAppProvided": false,
      "originalJava": 25,
      "originalPort": 8080,
      "scope": "all Java/bootstrap/router/schema are added fixtures",
      "sourceActuatorBlockPreserved": true,
      "sourceYaml20sPreserved": true,
      "wrapper": "9.8.0"
    },
    "toy-route-switch-and-rollback": {
      "artifactARebuilt": false,
      "artifacts": [
        "1.0.0",
        "2.0.0",
        "1.0.0"
      ],
      "routes": [
        "blue",
        "green",
        "blue"
      ],
      "scope": "own Python loopback router; not DNS/LB/Kubernetes/production blue-green or zero downtime proof",
      "statuses": [
        200,
        500,
        200
      ]
    },
    "versioned-artifact-b-does-not-rebuild-a": {
      "artifactA": {
        "bytes": 21988506,
        "sha256": "b01aed8a89b4c1837ec0ef304575ee5f2260c97de6f8c0c9e63c1fb6c9422619",
        "version": "1.0.0"
      },
      "artifactB": {
        "bytes": 21988510,
        "sha256": "88d048d99181c9324a4399f2fe69de24c9b7255a9ea5a50a6d85b30257f940e3",
        "version": "2.0.0"
      },
      "scope": "B changes fixture version/default business property; no repository/registry deployment"
    }
  },
  "models": {
    "environments-and-promotion": {
      "modelOnly": [
        "local/dev/QA/stg/prod responsibilities",
        "approval/freeze/hotfix/launch decisions"
      ],
      "nativeSubset": "same A JAR copied to two own profile-labeled paths and launched locally",
      "notRealProduction": true
    },
    "rollback-and-incomplete-evidence": {
      "modelOnly": [
        "session/message compatibility",
        "real external side-effect compensation",
        "general canary confidence/observability thresholds"
      ],
      "nativeSubset": "finite10 requests, own route rollback, separate H2 lossy manual example",
      "noUniversalDataRecoveryOrPerformanceClaim": true
    },
    "strategies-and-platform-responsibilities": {
      "modelOnly": [
        "Rolling capacity/maxUnavailable/maxSurge",
        "real LB/DNS/Kubernetes Service/Gateway weights",
        "nohup/systemd/container/PaaS lifecycle"
      ],
      "nativeSubset": "own finite Python route changes and startup flag",
      "noZeroDowntimeOrSlaClaim": true
    }
  }
};
export const D06_ASSETS = {
  "D06-artifact": {
    "file": "artifact-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 설정과 실행한 산출물은 무엇이 다를까요?",
    "focus": {
      "artifact-fragment": [
        64,
        17,
        34,
        25
      ],
      "artifact-copy": [
        35,
        41,
        63,
        26
      ]
    }
  },
  "D06-config": {
    "file": "config-v2.jpg",
    "width": 1671,
    "height": 941,
    "ready": true,
    "alt": "같은 설정 키가 여러 곳에 있으면 무엇을 선택할까요?",
    "focus": {
      "config-selected": [
        68,
        10,
        31,
        64
      ],
      "config-sources": [
        1,
        10,
        66,
        64
      ]
    }
  },
  "D06-feature": {
    "file": "feature-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "시작한 앱의 기능 flag가 다르면 무엇이 달라질까요?",
    "focus": {
      "feature-off": [
        1,
        13,
        33,
        53
      ],
      "feature-on": [
        65,
        13,
        34,
        53
      ]
    }
  },
  "D06-health": {
    "file": "health-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "health와readiness UP이면 업무도 성공할까요?",
    "focus": {
      "health-status": [
        31,
        17,
        35,
        40
      ],
      "health-business": [
        31,
        57,
        35,
        25
      ]
    }
  },
  "D06-readiness": {
    "file": "readiness.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "준비 거부 신호가 직접 HTTP도 막을까요?",
    "focus": {
      "readiness-refuse": [
        1,
        17,
        28,
        56
      ],
      "readiness-guard": [
        29,
        35,
        70,
        38
      ],
      "readiness-accept": [
        1,
        73,
        98,
        19
      ]
    }
  },
  "D06-routing": {
    "file": "routing-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "경로를 되돌리면 새 버전도 고쳐질까요?",
    "focus": {
      "routing-blue": [
        1,
        50,
        33,
        33
      ],
      "routing-green": [
        35,
        50,
        33,
        33
      ],
      "routing-rollback": [
        68,
        50,
        31,
        33
      ]
    }
  },
  "D06-canary": {
    "file": "canary.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "10건의 한정된 분배로 어디까지 말할 수 있을까요?",
    "focus": {
      "canary-schedule": [
        1,
        33,
        98,
        34
      ],
      "canary-stop": [
        1,
        67,
        98,
        22
      ]
    }
  },
  "D06-drain": {
    "file": "drain.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "종료 신호 뒤 진행 중 요청은 언제 끝날까요?",
    "focus": {
      "drain-entered": [
        1,
        8,
        98,
        39
      ],
      "drain-released": [
        51,
        17,
        48,
        30
      ],
      "drain-timeout": [
        1,
        48,
        98,
        35
      ]
    }
  },
  "D06-schema": {
    "file": "schema-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "앱 경로와 별도 DB 변경은 어떻게 구분할까요?",
    "focus": {
      "schema-original": [
        1,
        9,
        32,
        77
      ],
      "schema-expand": [
        33,
        9,
        34,
        77
      ],
      "schema-contract": [
        67,
        9,
        32,
        77
      ]
    }
  },
  "D06-restore": {
    "file": "restore-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "down DDL이 실행되면 원본 데이터도 같을까요?",
    "focus": {
      "restore-loss": [
        1,
        42,
        98,
        32
      ],
      "restore-cleanup": [
        58,
        74,
        41,
        25
      ]
    }
  },
  "D06-strategy": {
    "file": "strategy.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "전략 이름만으로 무중단을 보장할까요?",
    "focus": {
      "strategy-capacity": [
        1,
        8,
        24,
        53
      ],
      "strategy-router": [
        26,
        8,
        73,
        53
      ],
      "strategy-platform": [
        1,
        61,
        98,
        26
      ]
    }
  },
  "D06-promotion": {
    "file": "promotion-v5.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "환경 승격과 복구 판단에는 무엇이 더 필요할까요?",
    "focus": {
      "promotion-environments": [
        1,
        13,
        98,
        38
      ],
      "promotion-limits": [
        1,
        51,
        98,
        48
      ]
    }
  },
  "D06-versions": {
    "file": "versions-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "서로 다른 A1.0.0과 B2.0.0 JAR의 크기·SHA·설정 비교",
    "focus": {
      "artifact-jar": [
        16,
        20,
        82,
        34
      ]
    }
  }
};
export const D06_LESSONS = [
  {
    "id": "artifact",
    "question": "원문 설정과 실행한 산출물은 무엇이 다를까요?",
    "source": "미실행 원문 fragment + 추가 실행 JAR",
    "sourceNote": "원문은 Java 앱을 제공하지 않습니다. 모든 Java/bootstrap/router/schema는 추가 fixture이며 원문 Java25/8080은 미실행입니다. runtime49+별도 H2 proof1=50 해석 파일과 각 JAR nested lib42개는 다른 집합입니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "artifact-fragment",
        "title": "원문20s 설정을 보존",
        "lead": "표시 코드는 원문 YAML입니다. Actuator dependency와 YAML20s는 보존했고 추가 Java21.0.6·Wrapper9.8.0·Boot4.1.1에서 실행했습니다.",
        "code": "spring:\n  lifecycle:\n    timeout-per-shutdown-phase: 20s",
        "active": [
          2
        ],
        "values": [
          [
            "원문 앱 Java 제공",
            "false · 모든 Java는 추가"
          ],
          [
            "원문 Java/port",
            "25 / 8080 · 미실행"
          ],
          [
            "추가 Java/Wrapper",
            "21.0.6 / 9.8.0"
          ],
          [
            "원문 timeout 보존",
            "20s"
          ]
        ],
        "checks": [
          "source-fragments-preserved-added-java21",
          "actual-pinned-runtime-and-separate-h2"
        ],
        "runKeys": [
          "facts.source-fragments-preserved-added-java21",
          "facts.actual-pinned-runtime-and-separate-h2"
        ],
        "image": "D06-artifact"
      },
      {
        "id": "artifact-jar",
        "title": "추가 A/B JAR의 bytes와 SHA",
        "lead": "B는 version/default business property가 다른 추가 산출물입니다. A를 재빌드한 것으로 표시하지 않습니다. H2 driver는 앱 JAR에 없습니다.",
        "code": "tasks.named('processResources') {\n inputs.property('proofVersion', project.version)\n filesMatching('application.properties') {\n  expand(artifactVersion: project.version.toString(), businessOk: project.version.toString() == '1.0.0' ? 'true' : 'false')\n }\n}",
        "active": [
          1,
          3
        ],
        "values": [
          [
            "A version / bytes",
            "1.0.0 / 21988506"
          ],
          [
            "A SHA256",
            "b01aed8a89b4c1837ec0ef304575ee5f2260c97de6f8c0c9e63c1fb6c9422619"
          ],
          [
            "B version / bytes",
            "2.0.0 / 21988510"
          ],
          [
            "B SHA256",
            "88d048d99181c9324a4399f2fe69de24c9b7255a9ea5a50a6d85b30257f940e3"
          ],
          [
            "JAR nested lib / H2 driver",
            "각42개 / 미포함"
          ]
        ],
        "checks": [
          "actual-executable-jar-preserves-source-yaml",
          "versioned-artifact-b-does-not-rebuild-a"
        ],
        "runKeys": [
          "facts.actual-executable-jar-preserves-source-yaml",
          "facts.versioned-artifact-b-does-not-rebuild-a"
        ],
        "image": "D06-versions"
      },
      {
        "id": "artifact-copy",
        "title": "같은 A를local/stg 이름으로 실행",
        "lead": "동일 A JAR를 두 own 경로로 복사해 같은 Mac에서 profile 이름local/stg로 실행했습니다. 실제 환경 승격은 아닙니다.",
        "code": "    for name in ['local-label', 'stg-label']:\n        target = run / 'environment-copies' / name / 'app.jar'\n        target.parent.mkdir(parents=True)\n        shutil.copy2(jar_a, target)\n        copies.append(target)",
        "active": [
          0,
          3,
          4
        ],
        "values": [
          [
            "sameJarSHA256",
            "b01aed8a89b4c1837ec0ef304575ee5f2260c97de6f8c0c9e63c1fb6c9422619"
          ],
          [
            "profile / greeting",
            "local=from-local / stg=from-stg"
          ],
          [
            "환경 범위",
            "한 Mac의 두 own JVM·profile 이름"
          ]
        ],
        "checks": [
          "same-jar-two-profile-labels"
        ],
        "runKeys": [
          "facts.same-jar-two-profile-labels"
        ],
        "image": "D06-artifact"
      }
    ]
  },
  {
    "id": "config",
    "question": "같은 설정 키가 여러 곳에 있으면 무엇을 선택할까요?",
    "source": "추가 demo.greeting source 충돌 관측",
    "sourceNote": "공개 demo.greeting 하나만 관찰했습니다. profile은 설정 파일 선택 역할이며 모든 환경 설정을 출력하거나 secret 정책을 검증하지 않았습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "config-selected",
        "title": "CLI 값from-cli가 선택됨",
        "lead": "같은 demo.greeting을 CLI/system/environment/profile/base에 두었을 때 selected는from-cli였습니다.",
        "code": "    precedence = App('precedence-a', jar_a, system=['-Ddemo.greeting=from-system'],\n                     options=['--demo.greeting=from-cli'], environment={'DEMO_GREETING': 'from-env'})",
        "active": [
          1
        ],
        "values": [
          [
            "selected greeting",
            "from-cli"
          ],
          [
            "같은 key",
            "demo.greeting"
          ],
          [
            "active profile",
            "[local]"
          ]
        ],
        "checks": [
          "external-greeting-source-precedence"
        ],
        "runKeys": [
          "facts.external-greeting-source-precedence"
        ],
        "image": "D06-config"
      },
      {
        "id": "config-sources",
        "title": "하위 source도 순서대로 남음",
        "lead": "관측한 우선순위는 CLI→system→environment→profile-local→base-properties입니다. profile 이름 자체가 이 우선순위와 같은 개념은 아닙니다.",
        "code": "        for (PropertySource<?> source : environment.getPropertySources()) {\n            String name = source.getName(), tier = null;\n            if (name.equals(\"commandLineArgs\")) tier = \"CLI\";\n            else if (name.equals(\"systemProperties\")) tier = \"system\";\n            else if (name.equals(\"systemEnvironment\")) tier = \"environment\";\n            else if (name.contains(\"application-local.properties\")) tier = \"profile-local\";\n            else if (name.contains(\"application-stg.properties\")) tier = \"profile-stg\";\n            else if (name.contains(\"application.properties\")) tier = \"base-properties\";\n            Object value = source.getProperty(\"demo.greeting\");\n            if (tier != null && value != null) sources.add(Map.of(\"tier\", tier, \"value\", value));\n        }",
        "active": [
          3,
          4,
          5
        ],
        "values": [
          [
            "sourcesHighToLow",
            "CLI > system > environment > profile-local > base-properties"
          ],
          [
            "하위 값",
            "from-system / from-env / from-local / from-artifact"
          ],
          [
            "profile 역할",
            "local 설정 파일 선택"
          ]
        ],
        "checks": [
          "external-greeting-source-precedence"
        ],
        "runKeys": [
          "facts.external-greeting-source-precedence"
        ],
        "image": "D06-config"
      }
    ]
  },
  {
    "id": "feature",
    "question": "시작한 앱의 기능 flag가 다르면 무엇이 달라질까요?",
    "source": "동일 A JAR · 두 JVM의 시작 설정",
    "sourceNote": "비교한 두 JVM은 local/stg profile도 다릅니다. 유일 변수flag 실험이나 hot toggle이 아니며 이 추가 /feature endpoint의 코드 분기만 feature 값을 사용합니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "feature-off",
        "title": "local 시작flag false는404",
        "lead": "A local JVM의 feature=false 시작 설정에서 /feature는404/released=false였습니다. JAR가 실행 중인 것과 이 endpoint 공개를 구분합니다.",
        "code": "    @GetMapping(\"/feature\")\n    ResponseEntity<Map<String, Object>> feature() {\n        return ResponseEntity.status(feature ? 200 : 404).body(Map.of(\"artifact\", artifact, \"released\", feature));\n    }\n\n    @GetMapping(\"/business\")\n    ResponseEntity<Map<String, Object>> business() {\n        return ResponseEntity.status(businessOk ? 200 : 500).body(Map.of(\"artifact\", artifact, \"business\", businessOk ? \"OK\" : \"FAILED\"));\n    }",
        "active": [
          2
        ],
        "values": [
          [
            "profile / startup flag",
            "local / false"
          ],
          [
            "/feature status / released",
            "404 / false"
          ],
          [
            "artifact",
            "1.0.0 · 같은 A"
          ]
        ],
        "checks": [
          "deployed-artifact-and-feature-release-differ"
        ],
        "runKeys": [
          "facts.deployed-artifact-and-feature-release-differ"
        ],
        "image": "D06-feature"
      },
      {
        "id": "feature-on",
        "title": "stg 시작flag true는200",
        "lead": "같은 A의 stg JVM은 feature=true로 시작해200/released=true였습니다. 실행 중 flag를 바꾼 관측은 아닙니다.",
        "code": "    @GetMapping(\"/feature\")\n    ResponseEntity<Map<String, Object>> feature() {\n        return ResponseEntity.status(feature ? 200 : 404).body(Map.of(\"artifact\", artifact, \"released\", feature));\n    }\n\n    @GetMapping(\"/business\")\n    ResponseEntity<Map<String, Object>> business() {\n        return ResponseEntity.status(businessOk ? 200 : 500).body(Map.of(\"artifact\", artifact, \"business\", businessOk ? \"OK\" : \"FAILED\"));\n    }",
        "active": [
          2
        ],
        "values": [
          [
            "profile / startup flag",
            "stg / true"
          ],
          [
            "/feature status / released",
            "200 / true"
          ],
          [
            "hot runtime toggle",
            "아님 · 두 시작 설정 비교"
          ]
        ],
        "checks": [
          "deployed-artifact-and-feature-release-differ"
        ],
        "runKeys": [
          "facts.deployed-artifact-and-feature-release-differ"
        ],
        "image": "D06-feature"
      }
    ]
  },
  {
    "id": "health",
    "question": "health와readiness UP이면 업무도 성공할까요?",
    "source": "추가 A/B 앱과 Actuator·business 관측",
    "sourceNote": "같은 B 프로세스의 global health/readiness와 business 응답을 비교했습니다. B는 versioned fixture의 business-ok=false로 제어한500이며 Boot 자체 오류나 실제 DB 장애가 아닙니다. H2는 앱과 별도입니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "health-status",
        "title": "같은 B의health·readiness는UP",
        "lead": "B2.0.0의 global health와 readiness는 둘 다200/UP였습니다. 이 두 endpoint 관측을 업무 성공의 증명으로 읽지 않습니다.",
        "code": "    green_b = App('green-b-stg', jar_b, 'stg', options=['--demo.feature=true'])\n    health, readiness, business = green_b.get('/actuator/health'), green_b.get('/actuator/health/readiness'), green_b.get('/business')",
        "active": [
          1
        ],
        "values": [
          [
            "B artifact",
            "2.0.0 · 같은 own JVM"
          ],
          [
            "global health status/body",
            "200 / UP"
          ],
          [
            "readiness status/body",
            "200 / UP"
          ]
        ],
        "checks": [
          "health-up-does-not-test-business-success"
        ],
        "runKeys": [
          "facts.health-up-does-not-test-business-success"
        ],
        "image": "D06-health"
      },
      {
        "id": "health-business",
        "title": "B health UP · business500",
        "lead": "B의 global health/readiness는UP인데 business는500/FAILED였습니다. 기본 availability health가 이 추가 업무 분기를 검사하지 않습니다.",
        "code": "    @GetMapping(\"/business\")\n    ResponseEntity<Map<String, Object>> business() {\n        return ResponseEntity.status(businessOk ? 200 : 500).body(Map.of(\"artifact\", artifact, \"business\", businessOk ? \"OK\" : \"FAILED\"));\n    }",
        "active": [
          2
        ],
        "values": [
          [
            "B health / readiness",
            "UP / UP · 둘 다200"
          ],
          [
            "B business status/body",
            "500 / FAILED"
          ],
          [
            "원인 범위",
            "추가 business-ok=false 시작 property"
          ]
        ],
        "checks": [
          "health-up-does-not-test-business-success"
        ],
        "runKeys": [
          "facts.health-up-does-not-test-business-success"
        ],
        "image": "D06-health"
      }
    ]
  },
  {
    "id": "readiness",
    "question": "준비 거부 신호가 직접 HTTP도 막을까요?",
    "source": "추가 blue-a-local / A1.0.0 readiness 발행 · own router 제어",
    "sourceNote": "이 관측의 대상은 blue-a-local / A1.0.0이며 앞의 B2.0.0 business 실패 관측과 별도입니다. 앱의 readiness publication과 router가 신호를 읽고 배제하는 동작은 다릅니다. 실제 LB/Kubernetes probe 정책을 실행한 것이 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "readiness-refuse",
        "title": "refuse 뒤 health503 · 직접업무200",
        "lead": "REFUSING_TRAFFIC을 발행하면 global health/readiness는503이지만 liveness와 직접 business는200이었습니다.",
        "code": "    @PostMapping(\"/__fixture/readiness/{state}\")\n    Map<String, Object> readiness(@PathVariable String state) {\n        AvailabilityChangeEvent.publish(context, state.equals(\"refuse\") ? ReadinessState.REFUSING_TRAFFIC : ReadinessState.ACCEPTING_TRAFFIC);\n        return Map.of(\"readiness\", availability.getReadinessState().name());\n    }",
        "active": [
          2
        ],
        "values": [
          [
            "대상 app/artifact",
            "blue-a-local / A1.0.0"
          ],
          [
            "readinessState",
            "REFUSING_TRAFFIC"
          ],
          [
            "global health / readiness",
            "503 / 503"
          ],
          [
            "liveness / direct business",
            "200 / 200"
          ]
        ],
        "checks": [
          "readiness-is-signal-not-direct-request-blocking"
        ],
        "runKeys": [
          "facts.readiness-is-signal-not-direct-request-blocking"
        ],
        "image": "D06-readiness"
      },
      {
        "id": "readiness-guard",
        "title": "own router guard503 · bypass200",
        "lead": "같은 거부 상태에서 own router가 readiness를 확인하면503, guard를 우회하면200이었습니다. 신호만으로 모든 HTTP가 차단되는 것은 아닙니다.",
        "code": "            if routing['guardReadiness']:\n                ready = request(targets[alias], '/actuator/health/readiness', label='router-readiness-' + alias)\n                if ready['status'] != 200:\n                    self.respond(503, {'route': alias, 'reason': 'readiness refused', 'readinessStatus': ready['status']})\n                    return\n            response = request(targets[alias], self.path, label='router-forward-' + alias)\n            self.respond(response['status'] or 502, {'route': alias, 'backendStatus': response['status'], 'body': response.get('body')})",
        "active": [
          0,
          2,
          3
        ],
        "values": [
          [
            "대상 app/artifact",
            "blue-a-local / A1.0.0"
          ],
          [
            "routerGuarded / routerBypassed",
            "503 / 200"
          ],
          [
            "직접 business",
            "200"
          ]
        ],
        "checks": [
          "readiness-is-signal-not-direct-request-blocking"
        ],
        "runKeys": [
          "facts.readiness-is-signal-not-direct-request-blocking"
        ],
        "image": "D06-readiness"
      },
      {
        "id": "readiness-accept",
        "title": "accept 뒤 재시작 없이복귀",
        "lead": "ACCEPTING_TRAFFIC으로 되돌리고 router guard를 유지한 채200을 확인했습니다. 앱을 재시작하지 않았습니다.",
        "code": "    blue.get('/__fixture/readiness/accept', 'POST')\n    routing.update(guardReadiness=True, schedule=['blue'], position=0)\n    accepted = request(router_port, '/business', label='router-readiness-restored')",
        "active": [
          0,
          2
        ],
        "values": [
          [
            "대상 app/artifact",
            "blue-a-local / A1.0.0"
          ],
          [
            "readinessState",
            "ACCEPTING_TRAFFIC"
          ],
          [
            "routerStatus / appRestarted",
            "200 / false"
          ]
        ],
        "checks": [
          "readiness-restored-without-restarting-app"
        ],
        "runKeys": [
          "facts.readiness-restored-without-restarting-app"
        ],
        "image": "D06-readiness"
      }
    ]
  },
  {
    "id": "routing",
    "question": "경로를 되돌리면 새 버전도 고쳐질까요?",
    "source": "추가 Python loopback router · A/B 실제 HTTP",
    "sourceNote": "blue/green은 own router alias입니다. DNS·실제 LB·Kubernetes·운영 blue-green·무중단 증명이 아니며 경로 복귀는 B property/data 수리가 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "routing-blue",
        "title": "blue A는200",
        "lead": "own router의 blue 기준 경로가 A1.0.0 business200을 전달했습니다.",
        "code": "    route_blue = request(router_port, '/business', label='router-blue-baseline')\n    routing.update(schedule=['green'], position=0)\n    route_green = request(router_port, '/business', label='router-green-switch')\n    routing.update(schedule=['blue'], position=0)\n    route_rollback = request(router_port, '/business', label='router-blue-rollback')",
        "active": [
          0
        ],
        "values": [
          [
            "route / artifact / status",
            "blue / 1.0.0 / 200"
          ]
        ],
        "checks": [
          "toy-route-switch-and-rollback"
        ],
        "runKeys": [
          "facts.toy-route-switch-and-rollback"
        ],
        "image": "D06-routing"
      },
      {
        "id": "routing-green",
        "title": "green B로바꾸면500",
        "lead": "own 경로를 green으로 바꾸면 B2.0.0의 제어된 business500이 전달됐습니다.",
        "code": "    route_blue = request(router_port, '/business', label='router-blue-baseline')\n    routing.update(schedule=['green'], position=0)\n    route_green = request(router_port, '/business', label='router-green-switch')\n    routing.update(schedule=['blue'], position=0)\n    route_rollback = request(router_port, '/business', label='router-blue-rollback')",
        "active": [
          1,
          2
        ],
        "values": [
          [
            "route / artifact / status",
            "green / 2.0.0 / 500"
          ]
        ],
        "checks": [
          "toy-route-switch-and-rollback"
        ],
        "runKeys": [
          "facts.toy-route-switch-and-rollback"
        ],
        "image": "D06-routing"
      },
      {
        "id": "routing-rollback",
        "title": "blue A로복귀하면200",
        "lead": "경로만 A로 돌려200을 확인했습니다. artifact A를 다시 빌드하지 않았으며 B를 수정한 결과가 아닙니다.",
        "code": "    route_blue = request(router_port, '/business', label='router-blue-baseline')\n    routing.update(schedule=['green'], position=0)\n    route_green = request(router_port, '/business', label='router-green-switch')\n    routing.update(schedule=['blue'], position=0)\n    route_rollback = request(router_port, '/business', label='router-blue-rollback')",
        "active": [
          3,
          4
        ],
        "values": [
          [
            "route / artifact / status",
            "blue / 1.0.0 / 200"
          ],
          [
            "artifactARebuilt",
            "false"
          ],
          [
            "복구 범위",
            "own route 복귀 · B 수리 아님"
          ]
        ],
        "checks": [
          "toy-route-switch-and-rollback"
        ],
        "runKeys": [
          "facts.toy-route-switch-and-rollback"
        ],
        "image": "D06-routing"
      }
    ]
  },
  {
    "id": "canary",
    "question": "10건의 한정된 분배로 어디까지 말할 수 있을까요?",
    "source": "추가 deterministic toy schedule · 실제10 HTTP",
    "sourceNote": "7blue/3green은 이 fixture의 정해진 순서입니다. 무작위 모집단 오류확률·추천 운영 비율·성능 또는 일반 canary 안전성을 추정하지 않습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "canary-schedule",
        "title": "정해진7blue200 +3green500",
        "lead": "명시한10건 순서대로 요청해 blue7건200·green3건500을 관찰했습니다.3/10은 이 유한 관측의 실패 수입니다.",
        "code": "    routing.update(schedule=['blue'] * 7 + ['green'] * 3, position=0)\n    batch = [request(router_port, '/business', label='finite-canary-' + str(i + 1)) for i in range(10)]",
        "active": [
          0,
          1
        ],
        "values": [
          [
            "정해진 schedule",
            "blue×7 → green×3"
          ],
          [
            "requests / observedFailures",
            "10 / 3"
          ],
          [
            "관측 status",
            "blue7건200 / green3건500"
          ]
        ],
        "checks": [
          "finite-scheduled-canary-not-general-error-probability"
        ],
        "runKeys": [
          "facts.finite-scheduled-canary-not-general-error-probability"
        ],
        "image": "D06-canary"
      },
      {
        "id": "canary-stop",
        "title": "10건 뒤 정지규칙으로blue복귀",
        "lead": "기록한 fixture 정지규칙으로 확대를 멈추고 blue200으로 복귀했습니다. 후속 직접 B는 여전히500이며 첫500에서 요청10개를 중도 중단한 실험이 아닙니다.",
        "code": "    routing.update(schedule=['blue'], position=0)\n    after_stop = request(router_port, '/business', label='canary-stop-to-blue')",
        "active": [
          0,
          1
        ],
        "values": [
          [
            "fixtureRule",
            "관측500이 있으면 확대 중단"
          ],
          [
            "afterStopRoute / afterStopStatus",
            "blue / 200"
          ],
          [
            "후속 greenDirectStatus",
            "500 · B 수리 아님"
          ]
        ],
        "checks": [
          "fixture-stop-rule-restores-blue-route"
        ],
        "runKeys": [
          "facts.fixture-stop-rule-restores-blue-route"
        ],
        "image": "D06-canary"
      }
    ]
  },
  {
    "id": "drain",
    "question": "종료 신호 뒤 진행 중 요청은 언제 끝날까요?",
    "source": "추가 own /slow gate · SIGTERM · 원문20s/추가1s",
    "sourceNote": "하나의 제어된 요청 관측이며 모든 백그라운드 작업·SLA 보장이 아닙니다.20s는 원문 artifact 설정이고1s는 별도 JVM의 명시 CLI override입니다. HTTP 앱 종료는 SIGTERM143입니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "drain-entered",
        "title": "요청 진입 뒤SIGTERM · gate대기",
        "lead": "/slow가 진입한 것을 확인하고 SIGTERM 뒤 graceful 시작 로그와 gate를 기다리는 상태를 관찰했습니다. 아직 release 전 시점입니다.",
        "code": "    worker, completion = slow_request(drain, 'slow-drain')\n    await_condition(enter.exists, 'slow request entered')\n    drain.process.terminate()\n    await_condition(lambda: 'Commencing graceful shutdown' in drain.log.read_text(), 'graceful shutdown commenced')\n    waiting_while_gate_held = drain.process.poll() is None and not release.exists()",
        "active": [
          2,
          4
        ],
        "values": [
          [
            "requestEnteredBeforeSignal",
            "true"
          ],
          [
            "signal / sourceTimeout",
            "SIGTERM / 20s"
          ],
          [
            "waitingBeforeReleaseObserved",
            "true · release 전"
          ]
        ],
        "checks": [
          "own-inflight-request-drains-after-sigterm"
        ],
        "runKeys": [
          "facts.own-inflight-request-drains-after-sigterm"
        ],
        "image": "D06-drain"
      },
      {
        "id": "drain-released",
        "title": "release 뒤 기존요청200 · 종료",
        "lead": "graceful 시작 뒤 gate를 release해 이미 진행 중인 요청이200/slow=completed로 끝났습니다. 자체 앱은143으로 종료됐습니다.",
        "code": "    release.write_text('release\\n')\n    drain_exit = drain.process.wait(timeout=25)\n    worker.join(timeout=5)\n    drain.stop()",
        "active": [
          0,
          1,
          2
        ],
        "values": [
          [
            "releasedAfterShutdownCommenced",
            "true"
          ],
          [
            "inflightStatus / slow",
            "200 / completed"
          ],
          [
            "processExitCode / portClosed",
            "143 / true"
          ]
        ],
        "checks": [
          "own-inflight-request-drains-after-sigterm"
        ],
        "runKeys": [
          "facts.own-inflight-request-drains-after-sigterm"
        ],
        "image": "D06-drain"
      },
      {
        "id": "drain-timeout",
        "title": "별도1s·미해제는completed200아님",
        "lead": "별도 CLI1s JVM은 gate를 release하지 않은 채 종료돼 completed200=false였습니다. raw 예외/status를 모든 플랫폼의 고정 응답으로 일반화하지 않습니다.",
        "code": "    bounded = App('timeout-one-second-a', jar_a, options=['--spring.lifecycle.timeout-per-shutdown-phase=1s',\n                  '--demo.enter-file=' + str(timeout_enter), '--demo.release-file=' + str(timeout_release)])",
        "active": [
          0
        ],
        "values": [
          [
            "artifactSourceTimeout / addedCliOverride",
            "20s / 1s"
          ],
          [
            "gateReleased / completed200",
            "false / false"
          ],
          [
            "processExitCode / portClosed",
            "143 / true"
          ]
        ],
        "checks": [
          "explicit-timeout-variant-does-not-guarantee-completion"
        ],
        "runKeys": [
          "facts.explicit-timeout-variant-does-not-guarantee-completion"
        ],
        "image": "D06-drain"
      }
    ]
  },
  {
    "id": "schema",
    "question": "앱 경로와 별도 DB 변경은 어떻게 구분할까요?",
    "source": "앱 A/B와 별도인 SchemaProof · in-memory H2",
    "sourceNote": "모든 schema/seed/backfill Java는 추가 fixture입니다. App A/B가 DB에 연결한 것이 아니며 MySQL/Flyway·온라인 DDL·보편 이름 파싱은 미실행입니다. Ada··Lovelace의 ·는 공백1개입니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "schema-original",
        "title": "별도 H2 원본은중간공백2개",
        "lead": "SchemaProof의 row1 full_name은 Ada··Lovelace, 길이13입니다. 표시 별칭 ·는 공백이며 raw/code의 실제 두 공백도 보존했습니다.",
        "code": "                statement.execute(\"CREATE TABLE people(id BIGINT PRIMARY KEY, full_name VARCHAR(100))\");\n                try (PreparedStatement insert = connection.prepareStatement(\"INSERT INTO people(id,full_name) VALUES(1,?)\")) {\n                    insert.setString(1, \"Ada  Lovelace\"); insert.executeUpdate();\n                }",
        "active": [
          2
        ],
        "values": [
          [
            "실험 대상",
            "별도 H2 2.4.240 in-memory · App DB 아님"
          ],
          [
            "원본 full_name 표시",
            "Ada··Lovelace · ·=공백1개"
          ],
          [
            "originalLength / rows / autoCommit",
            "13 / 1 / true"
          ]
        ],
        "checks": [
          "separate-memory-schema-expand-keeps-old-query"
        ],
        "runKeys": [
          "facts.separate-memory-schema-expand-keeps-old-query"
        ],
        "image": "D06-schema"
      },
      {
        "id": "schema-expand",
        "title": "추가·수동 backfill 뒤 old값유지",
        "lead": "given_name/family_name을 추가해 수동 Ada/Lovelace로 채웠지만 옛 full_name은 Ada··Lovelace/길이13을 유지했습니다.",
        "code": "                statement.execute(\"ALTER TABLE people ADD given_name VARCHAR(100)\");\n                statement.execute(\"ALTER TABLE people ADD family_name VARCHAR(100)\");\n                System.out.println(\"EXPAND_OLD=\" + name(connection));\n                statement.executeUpdate(\"UPDATE people SET given_name='Ada', family_name='Lovelace' WHERE id=1\");\n                try (ResultSet rows = statement.executeQuery(\"SELECT given_name,family_name FROM people WHERE id=1\")) {\n                    rows.next(); System.out.println(\"BACKFILL_NEW=\" + rows.getString(1) + \"|\" + rows.getString(2));\n                }\n                System.out.println(\"BACKFILL_OLD=\" + name(connection));",
        "active": [
          0,
          1,
          3,
          7
        ],
        "values": [
          [
            "backfillGiven / backfillFamily",
            "Ada / Lovelace"
          ],
          [
            "expand/backfill old SELECT",
            "Ada··Lovelace · 실제길이13 유지"
          ]
        ],
        "checks": [
          "separate-memory-schema-expand-keeps-old-query"
        ],
        "runKeys": [
          "facts.separate-memory-schema-expand-keeps-old-query"
        ],
        "image": "D06-schema"
      },
      {
        "id": "schema-contract",
        "title": "옛 컬럼 제거 후old query42S22",
        "lead": "별도 H2에서 full_name을 DROP한 뒤 기존 SELECT는 SQLState42S22였습니다. 앱 route rollback이 컬럼을 재생성하는 것은 아닙니다.",
        "code": "                statement.execute(\"ALTER TABLE people DROP COLUMN full_name\");\n                try { name(connection); throw new AssertionError(\"old query unexpectedly succeeded\"); }\n                catch (SQLException missing) { System.out.println(\"CONTRACT_OLD_SQLSTATE=\" + missing.getSQLState()); }",
        "active": [
          0,
          2
        ],
        "values": [
          [
            "removedColumn",
            "full_name"
          ],
          [
            "oldQuerySqlState",
            "42S22"
          ]
        ],
        "checks": [
          "contract-breaks-old-column-query"
        ],
        "runKeys": [
          "facts.contract-breaks-old-column-query"
        ],
        "image": "D06-schema"
      }
    ]
  },
  {
    "id": "restore",
    "question": "down DDL이 실행되면 원본 데이터도 같을까요?",
    "source": "별도 H2의 손실 변환 / 검증 마지막 cleanup",
    "sourceNote": "Ada··Lovelace와 Ada·Lovelace에서 ·는 공백1개입니다. row1은 연결 닫기 전 COUNT이고 ownConnectionClosed는 별도 시점입니다. 앱6개 종료와 router 종료도 전체 관측 뒤 cleanup 근거로 구분합니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "restore-loss",
        "title": "한 공백concat은길이12 · 원본아님",
        "lead": "down DDL로 full_name을 다시 만들고 한 공백으로 concat하면 Ada·Lovelace/길이12입니다. 원본 두 공백/길이13과 같지 않았습니다.",
        "code": "                statement.execute(\"ALTER TABLE people ADD full_name VARCHAR(100)\");\n                statement.executeUpdate(\"UPDATE people SET full_name=given_name || ' ' || family_name WHERE id=1\");\n                String restored = name(connection);\n                System.out.println(\"DOWN_RECREATED=\" + restored);\n                System.out.println(\"DOWN_LENGTH=\" + restored.length());\n                System.out.println(\"ORIGINAL_BYTES_RESTORED=\" + original.equals(restored));",
        "active": [
          1,
          5
        ],
        "values": [
          [
            "original 표시 / length",
            "Ada··Lovelace / 13"
          ],
          [
            "recreated 표시 / length",
            "Ada·Lovelace / 12"
          ],
          [
            "originalRestored",
            "false"
          ]
        ],
        "checks": [
          "down-ddl-does-not-restore-lossy-data"
        ],
        "runKeys": [
          "facts.down-ddl-does-not-restore-lossy-data"
        ],
        "image": "D06-restore"
      },
      {
        "id": "restore-cleanup",
        "title": "별도 연결닫힘·검증종료를구분",
        "lead": "별도 SchemaProof는 row1 확인 뒤 연결을 닫고 exit0으로 끝났습니다. 전체 관측이 끝난 cleanup에서 Boot HTTP6개는 모두143·HTTP6+router1 port가 닫혔습니다.",
        "code": "        System.out.println(\"OWN_MEMORY_CONNECTION_CLOSED=true\");",
        "active": [
          0
        ],
        "values": [
          [
            "연결 닫기 전 rowCount",
            "1"
          ],
          [
            "ownConnectionClosed / SchemaProof exit",
            "true / 0 · 별도 단발 JVM"
          ],
          [
            "전체 관측 뒤 Boot HTTP 종료",
            "6개 · 모두 SIGTERM143"
          ],
          [
            "전체 관측 뒤 own port 종료",
            "HTTP6 + router1 = 7 · 닫힘"
          ]
        ],
        "checks": [
          "down-ddl-does-not-restore-lossy-data",
          "own-router-socket-closed",
          "all-own-jvms-and-target-ports-closed"
        ],
        "runKeys": [
          "facts.down-ddl-does-not-restore-lossy-data",
          "facts.own-router-socket-closed",
          "facts.all-own-jvms-and-target-ports-closed"
        ],
        "image": "D06-restore"
      }
    ]
  },
  {
    "id": "strategy",
    "question": "전략 이름만으로 무중단을 보장할까요?",
    "source": "원문 전략·플랫폼 책임 모델 · native PASS 없음",
    "sourceNote": "Rolling 용량·실제 LB/DNS/Kubernetes 가중치·nohup/systemd/container/PaaS 운영은 미실행 모델입니다. own router·startup flag 관측과 같은 범위로 표시하지 않습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "strategy-capacity",
        "title": "Rolling에는남는용량이필요",
        "lead": "원문 모델은 교체 중 용량·readiness·호환을 따로 확인합니다. maxUnavailable/maxSurge 실험이나 무중단 보장이 아닙니다.",
        "code": "'Rolling capacity/maxUnavailable/maxSurge'",
        "active": [
          0
        ],
        "values": [
          [
            "모델",
            "Rolling capacity/maxUnavailable/maxSurge"
          ],
          [
            "무중단·SLA 보장",
            "없음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.strategies-and-platform-responsibilities"
        ],
        "image": "D06-strategy"
      },
      {
        "id": "strategy-router",
        "title": "실제 LB·K8s와toy router는다름",
        "lead": "finite own Python route 실험을 실제 LB·DNS·Kubernetes Service/Gateway 가중치 검증으로 확대하지 않습니다.",
        "code": "'real LB/DNS/Kubernetes Service/Gateway weights'",
        "active": [
          0
        ],
        "values": [
          [
            "모델",
            "real LB/DNS/Kubernetes Service/Gateway weights"
          ],
          [
            "실제 제품·cluster 라우팅",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.strategies-and-platform-responsibilities"
        ],
        "image": "D06-strategy"
      },
      {
        "id": "strategy-platform",
        "title": "실행방식마다운영책임이다름",
        "lead": "원문 nohup/systemd/container/PaaS는 수명·재시작·플랫폼 책임을 비교하는 모델이며 이 환경에서 등록·배포하지 않았습니다.",
        "code": "'nohup/systemd/container/PaaS lifecycle'",
        "active": [
          0
        ],
        "values": [
          [
            "모델",
            "nohup/systemd/container/PaaS lifecycle"
          ],
          [
            "OS service/container/PaaS 배포",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.strategies-and-platform-responsibilities"
        ],
        "image": "D06-strategy"
      }
    ]
  },
  {
    "id": "promotion",
    "question": "환경 승격과 복구 판단에는 무엇이 더 필요할까요?",
    "source": "원문 조직·복구 경계 모델 · native PASS 없음",
    "sourceNote": "local/stg profile 이름으로 실행한 사실은 실제 조직의 환경·승인·freeze·release나 운영 확률·외부 부작용 보상 검증이 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 앱·라우터·별도 schema와 각 관측 시점/종료 검증을 구분합니다.",
    "stages": [
      {
        "id": "promotion-environments",
        "title": "환경·승인·freeze는조직모델",
        "lead": "원문은 local/dev/QA/stg/prod 책임과 approval/freeze/hotfix/launch 결정을 나눕니다. 실제 승격이나 승인 실행은 아닙니다.",
        "code": "['local/dev/QA/stg/prod responsibilities', 'approval/freeze/hotfix/launch decisions']",
        "active": [
          0
        ],
        "values": [
          [
            "조직·환경 모델",
            "local/dev/QA/stg/prod responsibilities"
          ],
          [
            "판단 모델",
            "approval/freeze/hotfix/launch"
          ],
          [
            "실제 운영 승격",
            "미실행"
          ],
          [
            "배포동결(freeze)",
            "특정 기간 운영 변경 제한 · 예외는 조직 정책"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.environments-and-promotion"
        ],
        "image": "D06-promotion"
      },
      {
        "id": "promotion-limits",
        "title": "외부 부작용·보편 오류확률은별도",
        "lead": "own route rollback·유한10건·H2 손실 예시는 session/message 호환·외부 보상·보편 canary confidence를 해결한 증거가 아닙니다.",
        "code": "['session/message compatibility', 'real external side-effect compensation', 'general canary confidence/observability thresholds']",
        "active": [
          0
        ],
        "values": [
          [
            "모델 경계",
            "session/message · external side-effect compensation · canary confidence"
          ],
          [
            "보편 복구·성능 보장",
            "없음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.rollback-and-incomplete-evidence"
        ],
        "image": "D06-promotion"
      }
    ]
  }
];
export const d06Run = path => path.split('.').reduce((value, key) => value?.[key], D06_RUNS);
