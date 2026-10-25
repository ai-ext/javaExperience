// 원문 Java25 설정과 추가 Java21 빌드 관측·모델을 구분한다.
export const d04AssetRoot = '../design/d04-2026-10-21/images/';
export const D04_RUNS = {
  "checks": [
    "actual-bom-and-transitive-runtime-files",
    "actual-bootjar-launch-loads-resource",
    "actual-junit-executes-two-tests",
    "actual-task-prerequisites-have-two-build-branches",
    "assemble-can-package-without-running-junit",
    "bootjar-and-plain-jar-have-different-structure",
    "clean-build-can-restore-compile-output-from-private-cache",
    "compile-failure-is-before-test-execution",
    "compile-produces-class-not-jar-resource-report",
    "dependency-lock-records-selected-versions",
    "dry-run-plan-is-not-task-output",
    "junit-failure-does-not-remove-existing-jar",
    "onlyif-skipped-action-was-not-run",
    "private-verification-mismatch-rejects-unchanged-dependency",
    "process-resources-copies-main-file",
    "resource-change-does-not-recompile-unchanged-java",
    "same-workspace-up-to-date-is-not-from-cache",
    "source-java25-preserved-added-java21-runtime",
    "test-compilation-failure-is-not-junit-assertion",
    "test-no-source-is-not-two-tests-passed",
    "two-scoped-clean-builds-have-equal-jar-bytes"
  ],
  "facts": {
    "source-java25-preserved-added-java21-runtime": {
      "originalJava": 25,
      "originalKotlinPreserved": true,
      "addedJava": "21.0.6",
      "wrapper": "9.8.0",
      "bootPlugin": "4.1.1",
      "scope": "added Java21 variant/bootstrap/tests/resources; source Java25 not run"
    },
    "actual-task-prerequisites-have-two-build-branches": {
      "graph": {
        "compileJava": [],
        "processResources": [],
        "classes": [
          "compileJava",
          "processResources"
        ],
        "compileTestJava": [
          "classes",
          "compileJava"
        ],
        "processTestResources": [],
        "testClasses": [
          "compileTestJava",
          "processTestResources"
        ],
        "test": [
          "classes",
          "compileJava",
          "compileTestJava",
          "testClasses"
        ],
        "check": [
          "test"
        ],
        "jar": [
          "classes",
          "compileJava"
        ],
        "bootJar": [
          "classes",
          "compileJava",
          "resolveMainClassName"
        ],
        "assemble": [
          "bootJar",
          "jar"
        ],
        "build": [
          "assemble",
          "check"
        ]
      },
      "scope": "direct prerequisites of this added plugin fixture, not a fixed chronological pipeline"
    },
    "actual-bom-and-transitive-runtime-files": {
      "artifacts": 29,
      "boot": "4.1.1",
      "junit": "6.0.3",
      "launcher": "6.0.3",
      "scope": "resolved files SHA; not independently authenticated upstream artifacts"
    },
    "dry-run-plan-is-not-task-output": {
      "plannedCompile": true,
      "plannedTest": true,
      "buildDirectoryExists": false,
      "scope": "configuration was evaluated; task actions disabled"
    },
    "compile-produces-class-not-jar-resource-report": {
      "classMajor": 65,
      "jarExists": false,
      "resourceCopied": false,
      "testReportExists": false
    },
    "process-resources-copies-main-file": {
      "resourceText": "lesson.message=build-ready\n",
      "classUnchanged": true,
      "jarExists": false
    },
    "actual-junit-executes-two-tests": {
      "tests": 2,
      "failures": 0,
      "errors": 0,
      "skipped": 0,
      "junit": "6.0.3",
      "jarExists": false,
      "scope": "additional standalone JUnit tests; no Docker/DB/source learner tests"
    },
    "bootjar-and-plain-jar-have-different-structure": {
      "bootClassPath": "BOOT-INF/classes/example/build/BuildPolicy.class",
      "bootLibraries": 20,
      "plainClassPath": "example/build/BuildPolicy.class",
      "testClassPackaged": false,
      "bootStartClass": "example.build.BuildDemoApplication",
      "plainClassifier": "plain"
    },
    "actual-bootjar-launch-loads-resource": {
      "exitCode": 0,
      "resource": "build-ready",
      "policy": "READY",
      "scope": "own non-web Boot process exited; no HTTP/container/registry/deploy"
    },
    "same-workspace-up-to-date-is-not-from-cache": {
      "compileJava": "UP-TO-DATE",
      "processResources": "UP-TO-DATE",
      "test": "UP-TO-DATE",
      "bootJar": "UP-TO-DATE",
      "scope": "unchanged declared inputs in same workspace"
    },
    "clean-build-can-restore-compile-output-from-private-cache": {
      "compileJava": "FROM-CACHE",
      "test": "FROM-CACHE",
      "processResources": "EXECUTED",
      "scope": "own project .task-cache populated by earlier clean build; no remote cache/global cache deletion"
    },
    "junit-failure-does-not-remove-existing-jar": {
      "firstFailedTask": "test",
      "tests": 2,
      "failures": 1,
      "errors": 0,
      "skipped": 0,
      "existingJarUnchanged": true,
      "scope": "JAR came from prior successful baseline; file presence is not current successful build"
    },
    "resource-change-does-not-recompile-unchanged-java": {
      "compileJava": "UP-TO-DATE",
      "processResources": "EXECUTED",
      "classUnchanged": true,
      "resourceText": "lesson.message=updated-resource\n",
      "jarBytesChanged": true,
      "scope": "task input boundary; not a measured performance improvement"
    },
    "compile-failure-is-before-test-execution": {
      "firstFailedTask": "compileJava",
      "diagnostic": "cannot find symbol",
      "junitReportExists": false
    },
    "test-compilation-failure-is-not-junit-assertion": {
      "firstFailedTask": "compileTestJava",
      "diagnostic": "cannot find symbol",
      "junitReportExists": false
    },
    "test-no-source-is-not-two-tests-passed": {
      "compileTestJava": "NO-SOURCE",
      "test": "NO-SOURCE",
      "junitReportExists": false,
      "scope": "own copied fixture test source removed; not learner source"
    },
    "onlyif-skipped-action-was-not-run": {
      "task": "policySkip",
      "outcome": "SKIPPED",
      "actionOutputExists": false
    },
    "assemble-can-package-without-running-junit": {
      "jarExists": true,
      "testTaskSelected": false,
      "junitReportExists": false,
      "scope": "fresh added fixture; assemble is not full build validation"
    },
    "two-scoped-clean-builds-have-equal-jar-bytes": {
      "sha256": "19be540e7682740e6d04d338fde021222c0c6e3a83dbaeb0935c3a85d928d16e",
      "twoJarBytesEqual": true,
      "scope": "same fixture/JDK21.0.6/Gradle9.8.0/dependency files, separate workspace; not universal reproducibility"
    },
    "dependency-lock-records-selected-versions": {
      "lockedBoot": "org.springframework.boot:spring-boot:4.1.1",
      "containsVersionSelection": true,
      "scope": "runtime lock state, not artifact checksum or repository availability guarantee"
    },
    "private-verification-mismatch-rejects-unchanged-dependency": {
      "diagnostic": "Dependency verification failed",
      "privateExpectedChecksumAltered": true,
      "globalDependencyBytesUnchanged": true,
      "scope": "only private project expected hash changed; no cache corruption or trust weakening"
    }
  },
  "models": {
    "local-vs-ci-inputs": {
      "kind": "source-derived input comparison model",
      "inputs": [
        "commit/tracked and untracked files",
        "Wrapper",
        "JDK/toolchain",
        "dependency selection/files",
        "OS/environment",
        "cache"
      ],
      "scope": "no actual CI runner or secret/config mutation"
    },
    "docker-registry-boundary": {
      "kind": "source-derived optional process model",
      "steps": [
        "JAR",
        "image build",
        "tag/reference",
        "registry push",
        "deployment"
      ],
      "scope": "no Docker build/login/push/deployment executed"
    },
    "failure-layers": {
      "kind": "source/literature diagnosis model",
      "layers": [
        "configuration/plugin",
        "dependency/verification",
        "compileJava/compileTestJava",
        "JUnit test",
        "packaging",
        "worker memory",
        "image/registry"
      ],
      "scope": "native observed subset distinguished; no real memory failure or registry incident fabricated"
    }
  }
};
export const D04_ASSETS ={
  "D04-graph": {
    "file": "graph-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 Java21 fixture의 build는 assemble과 check 두 갈래를 요구한다. classes를 한 노드로 공유하며 선행 관계와 고정 실행 순서를 구분한다.",
    "focus": {
      "graph-source": [
        1,
        86,
        98,
        12
      ],
      "graph-branches": [
        22,
        10,
        62,
        42
      ],
      "graph-classes": [
        7,
        52,
        89,
        32
      ]
    }
  },
  "D04-dryrun": {
    "file": "dryrun-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 dry-run은 계획의 SKIPPED만 보여주고 build 출력은 없다. 실제 compileJava는 major65 class를 만들며 리소스·JAR·테스트 보고서는 별도다.",
    "focus": {
      "dryrun-plan": [
        1,
        16,
        55,
        74
      ],
      "dryrun-outputs": [
        34,
        38,
        21,
        50
      ]
    }
  },
  "D04-outputs": {
    "file": "outputs.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 BuildPolicy.java의 READY는 compileJava의 major65 class로, lesson.message=build-ready 리소스는 processResources의 바이트 그대로 복사로 이어진다.",
    "focus": {
      "outputs-class": [
        1,
        10,
        98,
        31
      ],
      "outputs-resource": [
        1,
        43,
        98,
        28
      ]
    }
  },
  "D04-junit": {
    "file": "junit-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 JUnit2개 통과와1개 assertion 실패, compileJava·compileTestJava 실패를 분리한다. assertion 실패 때는 이전 성공 baseline JAR가 남는다.",
    "focus": {
      "junit-pass": [
        1,
        8,
        98,
        20
      ],
      "junit-assertion": [
        1,
        29,
        98,
        20
      ],
      "junit-main-compile": [
        1,
        50,
        98,
        22
      ],
      "junit-test-compile": [
        1,
        73,
        98,
        20
      ]
    }
  },
  "D04-assemble": {
    "file": "assemble-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "새 assemble-only는 JAR가 있어도 JUnit을 실행하지 않았다. build는 검증도 요구하며 이후 실패해도 이전 baseline JAR가 남을 수 있다.",
    "focus": {
      "assemble-fresh": [
        1,
        15,
        32,
        67
      ],
      "assemble-boundary": [
        1,
        15,
        66,
        67
      ]
    }
  },
  "D04-package": {
    "file": "package-v2.jpg",
    "width": 1673,
    "height": 940,
    "ready": true,
    "alt": "추가 Boot JAR는 BOOT-INF/classes와 lib20개를, plain은 root class·리소스를 담는다. 테스트 class는 제외되고 실제 non-web JAR는 리소스를 읽고 종료했다.",
    "focus": {
      "package-boot": [
        1,
        35,
        49,
        53
      ],
      "package-plain": [
        51,
        35,
        48,
        34
      ],
      "package-launch": [
        67,
        11,
        32,
        22
      ]
    }
  },
  "D04-cache": {
    "file": "cache-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 같은 작업공간의 UP-TO-DATE와 clean 뒤 private cache에서 compileJava·test 출력을 복원하는 FROM-CACHE를 구분한다. processResources와 bootJar는 실행됐다.",
    "focus": {
      "cache-up-to-date": [
        34,
        9,
        32,
        78
      ],
      "cache-from-cache": [
        67,
        9,
        32,
        78
      ]
    }
  },
  "D04-skip": {
    "file": "skip-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 테스트 Java 파일이 없는 NO-SOURCE, onlyIf false의 SKIPPED, 별도 실제 JUnit2개 실행을 구분한다. action 파일은 build 아래이며 생성되지 않았다.",
    "focus": {
      "skip-no-source": [
        1,
        16,
        33,
        70
      ],
      "skip-only-if": [
        35,
        16,
        32,
        70
      ]
    }
  },
  "D04-dependencies": {
    "file": "dependencies-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "추가 runtime+test29파일·Bootlib20과 BOM·lock의 선택 버전·private 예상 checksum 불일치 거부를 구분한다. global artifact 바이트는 바꾸지 않았다.",
    "focus": {
      "dependencies-bom": [
        1,
        9,
        33,
        76
      ],
      "dependencies-lock": [
        35,
        9,
        31,
        76
      ],
      "dependencies-checksum": [
        67,
        9,
        32,
        76
      ]
    }
  },
  "D04-repro": {
    "file": "repro-v5.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "동일 추가 fixture의 cache-on baseline과 별도 cache-off clean build JAR가 같은 SHA였다. 독립 리소스 변경은 Java class를 유지하고 resource·JAR를 바꿨다.",
    "focus": {
      "cache-resource": [
        1,
        57,
        98,
        30
      ],
      "repro-equal": [
        1,
        8,
        98,
        48
      ]
    }
  },
  "D04-delivery": {
    "file": "delivery-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문·문헌의 미실행 모델이다. 로컬/CI 입력 비교와 JAR·Docker image·tag·registry push·배포 경계를 구분하며 실제 CI·Docker·메모리 장애 관측으로 표시하지 않는다.",
    "focus": {
      "repro-boundary": [
        1,
        8,
        98,
        40
      ],
      "delivery-ci": [
        1,
        8,
        98,
        40
      ],
      "delivery-images": [
        1,
        80,
        98,
        18
      ],
      "delivery-failures": [
        69,
        53,
        30,
        26
      ]
    }
  }
};
export const D04_LESSONS =[
  {
    "id": "graph",
    "question": "build는 한 줄의 고정 순서일까요?",
    "source": "원문 설정 + 추가 Java21 fixture의 직접 선행 관계",
    "sourceNote": "원문 Kotlin/Java25는 미실행입니다. 추가 Java21 variant·bootstrap·리소스·JUnit으로 관찰했습니다. 아래 graph는 이 플러그인 fixture의 직접 선행 관계이며 보편적인 고정 시간 순서가 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "graph-source",
        "title": "원문25 · 추가 실행21 구분",
        "lead": "원문의 Java25 설정을 보존하고 추가 fixture에서는 Java21.0.6·Wrapper9.8.0·Boot plugin4.1.1을 사용했습니다. 표시 코드는 미실행 원문 설정입니다.",
        "code": "java {\n    toolchain {\n        languageVersion = JavaLanguageVersion.of(25)\n    }\n}",
        "active": [
          0
        ],
        "values": [
          [
            "원문 Java / 보존",
            "25 / true · 미실행"
          ],
          [
            "추가 Java / Wrapper",
            "21.0.6 / 9.8.0"
          ],
          [
            "추가 Boot plugin",
            "4.1.1"
          ]
        ],
        "checks": [
          "source-java25-preserved-added-java21-runtime"
        ],
        "runKeys": [
          "facts.source-java25-preserved-added-java21-runtime"
        ],
        "image": "D04-graph"
      },
      {
        "id": "graph-branches",
        "title": "build에는 조립·검증 두 갈래",
        "lead": "추가 plugin fixture에서 build의 직접 선행은 assemble/check입니다. assemble은 bootJar/jar, check는 test를 요구했습니다.",
        "code": "plugins {\n    java\n    id(\"org.springframework.boot\") version \"4.1.1\"\n}",
        "active": [
          0
        ],
        "values": [
          [
            "build 직접 선행",
            "[assemble,check]"
          ],
          [
            "assemble 직접 선행",
            "[bootJar,jar]"
          ],
          [
            "check 직접 선행",
            "[test]"
          ]
        ],
        "checks": [
          "actual-task-prerequisites-have-two-build-branches"
        ],
        "runKeys": [
          "facts.actual-task-prerequisites-have-two-build-branches"
        ],
        "image": "D04-graph"
      },
      {
        "id": "graph-classes",
        "title": "classes는 컴파일·리소스를 묶음",
        "lead": "직접 선행 관계에서 classes는 compileJava/processResources를 묶습니다. 독립 태스크의 실제 실행 순서는 별도의 관측이며 순차 파이프라인으로 고정하지 않습니다.",
        "code": "task.taskDependencies.getDependencies(task).map { it.name }.sorted()",
        "active": [
          0
        ],
        "values": [
          [
            "classes 직접 선행",
            "[compileJava,processResources]"
          ],
          [
            "bootJar 직접 선행",
            "[classes,compileJava,resolveMainClassName]"
          ],
          [
            "bootJar 직접 test 선행",
            "없음 · 이 fixture의 직접 관계"
          ]
        ],
        "checks": [
          "actual-task-prerequisites-have-two-build-branches"
        ],
        "runKeys": [
          "facts.actual-task-prerequisites-have-two-build-branches"
        ],
        "image": "D04-graph"
      }
    ]
  },
  {
    "id": "dryrun",
    "question": "dry-run에 태스크가 보여도 파일이 생길까요?",
    "source": "원문 명령 개념 + 추가 실제 dry-run",
    "sourceNote": "구성은 평가됐지만 task action은 비활성화됐습니다. dry-run의 계획 표시와 실제 실행·출력·JUnit 통과를 구분합니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "dryrun-plan",
        "title": "컴파일·테스트가 계획에 있음",
        "lead": "추가 clean build --dry-run 출력에는 compileJava와 test가 계획됐습니다. 이것은 action 실행 결과가 아닙니다.",
        "code": "    dry, _ = command(main, 'dry-run', 'clean', 'build', '--dry-run')",
        "active": [
          0
        ],
        "values": [
          [
            "plannedCompile / plannedTest",
            "true / true"
          ],
          [
            "계획의 의미",
            "구성 평가 · task action 비활성"
          ]
        ],
        "checks": [
          "dry-run-plan-is-not-task-output"
        ],
        "runKeys": [
          "facts.dry-run-plan-is-not-task-output"
        ],
        "image": "D04-dryrun"
      },
      {
        "id": "dryrun-outputs",
        "title": "계획 뒤 build 디렉터리는 없음",
        "lead": "해당 fresh main fixture의 dry-run 뒤 build 디렉터리는 없었습니다. 테스트가 계획에 보인다고 보고서가 생긴 것은 아닙니다.",
        "code": "    dry, _ = command(main, 'dry-run', 'clean', 'build', '--dry-run')",
        "active": [
          0
        ],
        "values": [
          [
            "buildDirectoryExists",
            "false"
          ],
          [
            "검증 범위",
            "추가 fixture의 dry-run 직후"
          ]
        ],
        "checks": [
          "dry-run-plan-is-not-task-output"
        ],
        "runKeys": [
          "facts.dry-run-plan-is-not-task-output"
        ],
        "image": "D04-dryrun"
      }
    ]
  },
  {
    "id": "outputs",
    "question": "컴파일과 리소스 처리는 무엇을 남길까요?",
    "source": "추가 compileJava / processResources 개별 실행",
    "sourceNote": "추가 Java21 class의 major65와 리소스 복사를 별도로 관찰했습니다. 클래스 파일은 JAR나 JUnit 보고서가 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "outputs-class",
        "title": "compileJava 뒤 class major65",
        "lead": "추가 compileJava 후 BuildPolicy.class의 major는65였습니다. 이 시점에는 JAR·리소스 복사·테스트 보고서가 없었습니다.",
        "code": "    _, tasks = command(main, 'compile-main', 'compileJava')",
        "active": [
          0
        ],
        "values": [
          [
            "classMajor",
            "65 · 추가 Java21"
          ],
          [
            "jarExists / resourceCopied",
            "false / false"
          ],
          [
            "testReportExists",
            "false"
          ]
        ],
        "checks": [
          "compile-produces-class-not-jar-resource-report"
        ],
        "runKeys": [
          "facts.compile-produces-class-not-jar-resource-report"
        ],
        "image": "D04-outputs"
      },
      {
        "id": "outputs-resource",
        "title": "processResources가 파일을 복사",
        "lead": "리소스를 처리한 뒤 lesson.properties 내용이 복사됐고 기존 class SHA는 같았습니다. 여전히 JAR는 없었습니다.",
        "code": "    command(main, 'resources', 'processResources')",
        "active": [
          0
        ],
        "values": [
          [
            "복사된 resourceText",
            "lesson.message=build-ready\n"
          ],
          [
            "classUnchanged",
            "true"
          ],
          [
            "jarExists",
            "false"
          ]
        ],
        "checks": [
          "process-resources-copies-main-file"
        ],
        "runKeys": [
          "facts.process-resources-copies-main-file"
        ],
        "image": "D04-outputs"
      }
    ]
  },
  {
    "id": "junit",
    "question": "컴파일 실패와 JUnit 실패는 같은가요?",
    "source": "추가 JUnit6.0.3 두 테스트 / 별도 실패 입력",
    "sourceNote": "학습자 테스트나 DB/Docker 시험은 아닙니다. main·test 컴파일과 JUnit assertion을 나누고 첫 실패 task·실제 보고서를 확인합니다. 기존 JAR가 있어도 현재 build 성공은 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "junit-pass",
        "title": "test 실행은2개 통과",
        "lead": "추가 Jupiter6.0.3 test가 실제2개를 실행해 실패·오류·skip0을 보고했습니다. 이 개별 test 실행 뒤 JAR는 없었습니다.",
        "code": "    @Test void policyReady() {\n        assertEquals(\"READY\", BuildPolicy.state());\n    }\n\n    @Test void classpathResourceExists() throws Exception {\n        try (InputStream stream = getClass().getResourceAsStream(\"/lesson.properties\")) {\n            assertNotNull(stream);\n            Properties properties = new Properties();\n            properties.load(stream);\n            assertNotNull(properties.getProperty(\"lesson.message\"));\n        }\n    }",
        "active": [
          0
        ],
        "values": [
          [
            "tests / failures / errors / skipped",
            "2 / 0 / 0 / 0"
          ],
          [
            "Jupiter / launcher",
            "6.0.3 / 6.0.3"
          ],
          [
            "jarExists",
            "false"
          ]
        ],
        "checks": [
          "actual-junit-executes-two-tests"
        ],
        "runKeys": [
          "facts.actual-junit-executes-two-tests"
        ],
        "image": "D04-junit"
      },
      {
        "id": "junit-assertion",
        "title": "JUnit2개 중1개 실패 · 기존 JAR 남음",
        "lead": "추가 기대값을 BLOCKED로 바꾼 build는 test에서 실패했습니다. 이전 성공 baseline의 JAR는 그대로 남았으므로 파일 존재가 현재 성공을 뜻하지 않습니다.",
        "code": "    test_file.write_text(original_test.replace('assertEquals(\"READY\",', 'assertEquals(\"BLOCKED\",'))",
        "active": [
          0
        ],
        "values": [
          [
            "firstFailedTask",
            "test"
          ],
          [
            "tests / failures / errors / skipped",
            "2 / 1 / 0 / 0"
          ],
          [
            "existingJarUnchanged",
            "true · 이전 성공 baseline JAR"
          ]
        ],
        "checks": [
          "junit-failure-does-not-remove-existing-jar"
        ],
        "runKeys": [
          "facts.junit-failure-does-not-remove-existing-jar"
        ],
        "image": "D04-junit"
      },
      {
        "id": "junit-main-compile",
        "title": "compileJava 실패면 JUnit 전 경계",
        "lead": "별도 broken 복사본에서 return 값을 없는 symbol로 바꿨습니다. 첫 실패는 compileJava·cannot find symbol이며 JUnit 보고서는 없었습니다.",
        "code": "    policy.write_text(policy.read_text().replace('return \"READY\";', 'return MISSING_VALUE;'))",
        "active": [
          0
        ],
        "values": [
          [
            "firstFailedTask",
            "compileJava"
          ],
          [
            "diagnostic",
            "cannot find symbol"
          ],
          [
            "junitReportExists",
            "false"
          ]
        ],
        "checks": [
          "compile-failure-is-before-test-execution"
        ],
        "runKeys": [
          "facts.compile-failure-is-before-test-execution"
        ],
        "image": "D04-junit"
      },
      {
        "id": "junit-test-compile",
        "title": "compileTestJava 실패도 assertion 아님",
        "lead": "별도 broken 복사본의 test 기대값 symbol이 없으면 compileTestJava에서 실패합니다. JUnit을 실행해 assertion이 실패한 결과가 아닙니다.",
        "code": "    broken_test.write_text(broken_test.read_text().replace('assertEquals(\"READY\",', 'assertEquals(UNKNOWN_EXPECTED,'))",
        "active": [
          0
        ],
        "values": [
          [
            "firstFailedTask",
            "compileTestJava"
          ],
          [
            "diagnostic",
            "cannot find symbol"
          ],
          [
            "junitReportExists",
            "false"
          ]
        ],
        "checks": [
          "test-compilation-failure-is-not-junit-assertion"
        ],
        "runKeys": [
          "facts.test-compilation-failure-is-not-junit-assertion"
        ],
        "image": "D04-junit"
      }
    ]
  },
  {
    "id": "assemble",
    "question": "assemble로 JAR를 만들면 테스트도 통과했을까요?",
    "source": "추가 fresh assemble-only 복사본",
    "sourceNote": "다른 관측에서 남은 JAR가 아니라 새 복사본의 assemble 관측입니다. 이 fixture의 graph에서 assemble은 검증 check/test를 요구하지 않습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "assemble-fresh",
        "title": "새 복사본 assemble은JAR 생성",
        "lead": "fresh fixture에서 assemble을 실행하면 JAR는 있지만 test 태스크가 선택되지 않고 JUnit 보고서도 없었습니다.",
        "code": "    assembly = project('assemble-only')\n    _, assembly_tasks = command(assembly, 'assemble-only', 'assemble')",
        "active": [
          0
        ],
        "values": [
          [
            "jarExists",
            "true"
          ],
          [
            "testTaskSelected",
            "false"
          ],
          [
            "junitReportExists",
            "false"
          ]
        ],
        "checks": [
          "assemble-can-package-without-running-junit"
        ],
        "runKeys": [
          "facts.assemble-can-package-without-running-junit"
        ],
        "image": "D04-assemble"
      },
      {
        "id": "assemble-boundary",
        "title": "assemble와 build의 검증 범위 구분",
        "lead": "이 fixture에서 build는 assemble/check를 요구하고 assemble은 bootJar/jar를 요구합니다. assemble 성공을 전체 build 검증으로 표시하지 않습니다.",
        "code": "plugins {\n    java\n    id(\"org.springframework.boot\") version \"4.1.1\"\n}",
        "active": [
          0
        ],
        "values": [
          [
            "build 직접 선행",
            "[assemble,check]"
          ],
          [
            "assemble 직접 선행",
            "[bootJar,jar]"
          ],
          [
            "assemble-only JUnit 실행",
            "없음"
          ]
        ],
        "checks": [
          "actual-task-prerequisites-have-two-build-branches",
          "assemble-can-package-without-running-junit"
        ],
        "runKeys": [
          "facts.actual-task-prerequisites-have-two-build-branches",
          "facts.assemble-can-package-without-running-junit"
        ],
        "image": "D04-assemble"
      }
    ]
  },
  {
    "id": "package",
    "question": "Boot JAR와 plain JAR 안에는 무엇이 다를까요?",
    "source": "추가 실제 ZIP entries / non-web Boot 실행",
    "sourceNote": "Boot JAR의 lib20개와 testRuntimeClasspath 해석 파일29개는 다른 집합입니다. 테스트 class는 두 JAR에 포함되지 않았습니다. 실행은 자체 non-web 프로세스이며 HTTP·container·registry·배포는 아닙니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "package-boot",
        "title": "Boot JAR는 classes와lib를 담음",
        "lead": "추가 baseline build의 Boot JAR에서 BOOT-INF/classes 아래 class와 lib JAR20개를 확인했습니다.",
        "code": "    with zipfile.ZipFile(boot) as archive:\n        entries = archive.namelist()\n        manifest = archive.read('META-INF/MANIFEST.MF').decode()",
        "active": [
          0
        ],
        "values": [
          [
            "bootClassPath",
            "BOOT-INF/classes/example/build/BuildPolicy.class"
          ],
          [
            "bootLibraries",
            "20"
          ],
          [
            "bootStartClass",
            "example.build.BuildDemoApplication"
          ],
          [
            "testClassPackaged",
            "false"
          ]
        ],
        "checks": [
          "bootjar-and-plain-jar-have-different-structure"
        ],
        "runKeys": [
          "facts.bootjar-and-plain-jar-have-different-structure"
        ],
        "image": "D04-package"
      },
      {
        "id": "package-plain",
        "title": "plain JAR는 class 경로가 다름",
        "lead": "같은 추가 build의 plain classifier JAR는 example/build 아래 class를 담았습니다. 테스트 class는 포함되지 않았습니다.",
        "code": "    with zipfile.ZipFile(plain) as archive:\n        plain_entries = archive.namelist()",
        "active": [
          0
        ],
        "values": [
          [
            "plainClassPath",
            "example/build/BuildPolicy.class"
          ],
          [
            "plainClassifier",
            "plain"
          ],
          [
            "testClassPackaged",
            "false"
          ]
        ],
        "checks": [
          "bootjar-and-plain-jar-have-different-structure"
        ],
        "runKeys": [
          "facts.bootjar-and-plain-jar-have-different-structure"
        ],
        "image": "D04-package"
      },
      {
        "id": "package-launch",
        "title": "Boot JAR가 리소스를 읽고 종료",
        "lead": "실제 java -jar로 추가 non-web Boot JAR를 실행해 resource=build-ready·policy=READY와 exit0을 확인했습니다.",
        "code": "        try (var context = SpringApplication.run(BuildDemoApplication.class,\n                \"--spring.main.web-application-type=none\", \"--spring.main.banner-mode=off\", \"--logging.level.root=OFF\");\n             InputStream stream = BuildDemoApplication.class.getResourceAsStream(\"/lesson.properties\")) {\n            Properties properties = new Properties();\n            properties.load(stream);\n            System.out.println(\"D04_RESOURCE=\" + properties.getProperty(\"lesson.message\"));\n            System.out.println(\"D04_POLICY=\" + BuildPolicy.state());",
        "active": [
          0
        ],
        "values": [
          [
            "exitCode",
            "0"
          ],
          [
            "resource / policy",
            "build-ready / READY"
          ],
          [
            "실행 범위",
            "자체 non-web Boot · HTTP/배포 아님"
          ]
        ],
        "checks": [
          "actual-bootjar-launch-loads-resource"
        ],
        "runKeys": [
          "facts.actual-bootjar-launch-loads-resource"
        ],
        "image": "D04-package"
      }
    ]
  },
  {
    "id": "cache",
    "question": "UP-TO-DATE와 FROM-CACHE는 무엇이 다를까요?",
    "source": "추가 같은 작업공간 / own .task-cache / 입력 변경",
    "sourceNote": "현재 작업공간 재사용과 clean 뒤 private cache 출력 복원을 구분합니다. global cache 삭제·remote cache·속도 향상 배수·성능 개선을 측정하지 않았습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "cache-up-to-date",
        "title": "같은 입력이면UP-TO-DATE",
        "lead": "같은 작업공간의 변경 없는 build는 compileJava/processResources/test/bootJar가 UP-TO-DATE였습니다. FROM-CACHE와 다른 관측입니다.",
        "code": "    _, repeated = command(main, 'same-input-build', 'build', '--build-cache')",
        "active": [
          0
        ],
        "values": [
          [
            "compileJava / processResources",
            "UP-TO-DATE / UP-TO-DATE"
          ],
          [
            "test / bootJar",
            "UP-TO-DATE / UP-TO-DATE"
          ]
        ],
        "checks": [
          "same-workspace-up-to-date-is-not-from-cache"
        ],
        "runKeys": [
          "facts.same-workspace-up-to-date-is-not-from-cache"
        ],
        "image": "D04-cache"
      },
      {
        "id": "cache-from-cache",
        "title": "clean 뒤 출력은FROM-CACHE 복원",
        "lead": "이전 clean build가 채운 own .task-cache에서 compileJava와 test 출력을 복원했고 processResources는 실행됐습니다. 이번 호출에서 JUnit2개를 새로 실행했다는 뜻은 아닙니다.",
        "code": "    _, cached = command(main, 'clean-cached-build', 'clean', 'build', '--build-cache')",
        "active": [
          0
        ],
        "values": [
          [
            "compileJava / test",
            "FROM-CACHE / FROM-CACHE"
          ],
          [
            "processResources",
            "EXECUTED"
          ],
          [
            "cache 범위",
            "own project .task-cache · remote 아님"
          ]
        ],
        "checks": [
          "clean-build-can-restore-compile-output-from-private-cache"
        ],
        "runKeys": [
          "facts.clean-build-can-restore-compile-output-from-private-cache"
        ],
        "image": "D04-cache"
      },
      {
        "id": "cache-resource",
        "title": "리소스 변경은Java 재컴파일 없이 반영",
        "lead": "추가 lesson.properties만 바꾸면 compileJava는 UP-TO-DATE·class 그대로이고 processResources가 실행됐습니다. 리소스와 JAR bytes는 바뀌었습니다.",
        "code": "    source_resource.write_text('lesson.message=updated-resource\\n')\n    _, changed = command(main, 'resource-input-change', 'build', '--build-cache')",
        "active": [
          0
        ],
        "values": [
          [
            "compileJava / processResources",
            "UP-TO-DATE / EXECUTED"
          ],
          [
            "classUnchanged / jarBytesChanged",
            "true / true"
          ],
          [
            "resourceText",
            "lesson.message=updated-resource\n"
          ]
        ],
        "checks": [
          "resource-change-does-not-recompile-unchanged-java"
        ],
        "runKeys": [
          "facts.resource-change-does-not-recompile-unchanged-java"
        ],
        "image": "D04-repro"
      }
    ]
  },
  {
    "id": "skip",
    "question": "NO-SOURCE와 SKIPPED도 테스트 통과일까요?",
    "source": "추가 빈 test-source 복사본 / onlyIf false",
    "sourceNote": "사용자 test source를 제거하지 않았습니다. 추가 복사본의 source 부재와 fixture의 onlyIf false action 생략이며 JUnit2개 통과와 구분합니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "skip-no-source",
        "title": "test source가 없으면NO-SOURCE",
        "lead": "별도 empty-test-source 복사본에서 추가 test 파일만 제거했습니다. compileTestJava/test가 NO-SOURCE이고 보고서가 없었습니다.",
        "code": "    empty = project('empty-test-source')\n    (empty / 'src/test/java/example/build/BuildPolicyTest.java').unlink()\n    _, empty_tasks = command(empty, 'no-source-tests', 'test')",
        "active": [
          0
        ],
        "values": [
          [
            "compileTestJava / test",
            "NO-SOURCE / NO-SOURCE"
          ],
          [
            "junitReportExists",
            "false"
          ],
          [
            "JUnit2개 통과 의미",
            "아님"
          ]
        ],
        "checks": [
          "test-no-source-is-not-two-tests-passed"
        ],
        "runKeys": [
          "facts.test-no-source-is-not-two-tests-passed"
        ],
        "image": "D04-skip"
      },
      {
        "id": "skip-only-if",
        "title": "onlyIf false는action 생략",
        "lead": "추가 policySkip의 onlyIf false로 SKIPPED가 관측됐고 action의 출력 파일은 생성되지 않았습니다.",
        "code": "tasks.register(\"policySkip\") {\n    onlyIf { false }\n    doLast { layout.buildDirectory.file(\"unexpected-skip-action.txt\").get().asFile.writeText(\"unexpected\") }\n}",
        "active": [
          0
        ],
        "values": [
          [
            "task / outcome",
            "policySkip / SKIPPED"
          ],
          [
            "actionOutputExists",
            "false"
          ]
        ],
        "checks": [
          "onlyif-skipped-action-was-not-run"
        ],
        "runKeys": [
          "facts.onlyif-skipped-action-was-not-run"
        ],
        "image": "D04-skip"
      }
    ]
  },
  {
    "id": "dependencies",
    "question": "버전 선택과 파일 checksum은 무엇이 다를까요?",
    "source": "추가 BOM·testRuntimeClasspath29·lock·private verification",
    "sourceNote": "testRuntimeClasspath 해석 파일29개와 실제 Boot JAR lib20개를 구분합니다. SHA 비교는 기록한 파일 무결성 관측이지 upstream 파일 독립 인증이 아닙니다. global dependency JAR를 바꾸지 않았습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "dependencies-bom",
        "title": "BOM 선택과 해석 파일29개",
        "lead": "추가 BOM4.1.1로 Boot4.1.1·Jupiter/launcher6.0.3이 선택됐습니다.29는 runtime+test 해석 파일 집합입니다.",
        "code": "dependencies {\n    implementation(platform(\"org.springframework.boot:spring-boot-dependencies:4.1.1\"))\n    implementation(\"org.springframework.boot:spring-boot-starter\")\n    testImplementation(platform(\"org.springframework.boot:spring-boot-dependencies:4.1.1\"))\n    testImplementation(\"org.junit.jupiter:junit-jupiter\")\n    testRuntimeOnly(\"org.junit.platform:junit-platform-launcher\")\n}",
        "active": [
          0
        ],
        "values": [
          [
            "testRuntimeClasspath artifacts",
            "29 · runtime+test 파일"
          ],
          [
            "Boot / Jupiter / launcher",
            "4.1.1 / 6.0.3 / 6.0.3"
          ],
          [
            "Boot JAR lib와 관계",
            "lib20과 다른 집합"
          ]
        ],
        "checks": [
          "actual-bom-and-transitive-runtime-files"
        ],
        "runKeys": [
          "facts.actual-bom-and-transitive-runtime-files"
        ],
        "image": "D04-dependencies"
      },
      {
        "id": "dependencies-lock",
        "title": "lock은 선택 버전을 기록",
        "lead": "추가 runtimeClasspath lock이 Boot4.1.1 선택을 기록했습니다. lock은 artifact checksum이나 저장소 가용성 보장이 아닙니다.",
        "code": "dependencyLocking { lockAllConfigurations() }",
        "active": [
          0
        ],
        "values": [
          [
            "lockedBoot",
            "org.springframework.boot:spring-boot:4.1.1"
          ],
          [
            "containsVersionSelection",
            "true"
          ],
          [
            "lock의 한계",
            "checksum/저장소 가용성 보장 아님"
          ]
        ],
        "checks": [
          "dependency-lock-records-selected-versions"
        ],
        "runKeys": [
          "facts.dependency-lock-records-selected-versions"
        ],
        "image": "D04-dependencies"
      },
      {
        "id": "dependencies-checksum",
        "title": "private 예상 checksum 불일치는거부",
        "lead": "추가 private verification metadata의 예상 hash만0으로 바꾸면 Dependency verification failed였습니다. 실제 global dependency 파일 bytes는 그대로였습니다.",
        "code": "                    child.set('value', '0' * 64)",
        "active": [
          0
        ],
        "values": [
          [
            "diagnostic",
            "Dependency verification failed"
          ],
          [
            "privateExpectedChecksumAltered",
            "true"
          ],
          [
            "globalDependencyBytesUnchanged",
            "true"
          ]
        ],
        "checks": [
          "private-verification-mismatch-rejects-unchanged-dependency"
        ],
        "runKeys": [
          "facts.private-verification-mismatch-rejects-unchanged-dependency"
        ],
        "image": "D04-dependencies"
      }
    ]
  },
  {
    "id": "repro",
    "question": "JAR bytes가 같으면 모든 빌드도 재현 가능할까요?",
    "source": "추가 두 own clean build의 bytes 비교",
    "sourceNote": "동일 fixture/JDK21.0.6/Gradle9.8.0/의존성 파일의 두 별도 작업공간 관측입니다. 캐시 적중·시간 단축·모든 빌드의 보편 재현성으로 확대하지 않습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "repro-equal",
        "title": "두 scoped clean build는같은SHA",
        "lead": "별도 twin 작업공간의 clean build JAR SHA가 baseline과 같았습니다. 아래 full SHA는 이 두 scoped build의 관측값입니다.",
        "code": "    twin = project('twin-clean-build')\n    command(twin, 'twin-clean-build', 'clean', 'build', '--no-build-cache')\n    twin_jar, _ = jars(twin)",
        "active": [
          0
        ],
        "values": [
          [
            "twoJarBytesEqual",
            "true"
          ],
          [
            "JAR SHA256",
            "19be540e7682740e6d04d338fde021222c0c6e3a83dbaeb0935c3a85d928d16e"
          ]
        ],
        "checks": [
          "two-scoped-clean-builds-have-equal-jar-bytes"
        ],
        "runKeys": [
          "facts.two-scoped-clean-builds-have-equal-jar-bytes"
        ],
        "image": "D04-repro"
      },
      {
        "id": "repro-boundary",
        "title": "같은 입력 범위를 따로 확인",
        "lead": "원문 비교 모델은 commit/파일·Wrapper·JDK·의존성·OS/환경·cache 입력을 나눕니다. 이 모델을 실제 CI 실행 결과로 표시하지 않습니다.",
        "code": "['commit/tracked and untracked files', 'Wrapper', 'JDK/toolchain', 'dependency selection/files', 'OS/environment', 'cache']",
        "active": [
          0
        ],
        "values": [
          [
            "모델 입력",
            "commit/파일 · Wrapper · JDK · 의존성 · OS/환경 · cache"
          ],
          [
            "보편 재현성 보장",
            "없음 · 입력 비교 모델"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.local-vs-ci-inputs"
        ],
        "image": "D04-delivery"
      }
    ]
  },
  {
    "id": "delivery",
    "question": "로컬 빌드 뒤 CI·이미지·장애까지 검증됐을까요?",
    "source": "원문·문헌에서 분리한 미실행 과정 모델",
    "sourceNote": "실제 CI runner·Docker build/login/push·registry·배포·메모리 장애는 실행하지 않았습니다. 관측한 native subset을 원문 전체 구현이나 운영 안전으로 확대하지 않습니다.",
    "note": "코드 강조는 설명 위치이며 실시간 실행 줄이 아닙니다. 원문·추가 fixture와 별도 복사본·관측 시점을 구분합니다. 태스크 그래프를 고정 실행 순서로 읽지 않습니다.",
    "stages": [
      {
        "id": "delivery-ci",
        "title": "CI는 입력 비교가 필요한별도환경",
        "lead": "원문 모델의 로컬/CI 입력 비교입니다. 실제 CI나 secret/config 변경을 실행하지 않았습니다.",
        "code": "['commit/tracked and untracked files', 'Wrapper', 'JDK/toolchain', 'dependency selection/files', 'OS/environment', 'cache']",
        "active": [
          0
        ],
        "values": [
          [
            "모델 입력",
            "commit/파일 · Wrapper · JDK/toolchain · 의존성 · OS/환경 · cache"
          ],
          [
            "실제 CI runner",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.local-vs-ci-inputs"
        ],
        "image": "D04-delivery"
      },
      {
        "id": "delivery-images",
        "title": "JAR·image build·push는별도단계",
        "lead": "표시 코드는 미실행 원문 Docker 명령입니다. 원문 선택 과정 모델의 JAR→image build→tag/reference→registry push→deployment를 구분합니다.",
        "code": "docker build -t registry.example.com/team/demo:1.0.0 .\ndocker image ls registry.example.com/team/demo\ndocker push registry.example.com/team/demo:1.0.0",
        "active": [
          0
        ],
        "values": [
          [
            "원문·모델 단계",
            "JAR → image build → tag/reference → registry push → deployment"
          ],
          [
            "Docker/login/push/배포",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.docker-registry-boundary"
        ],
        "image": "D04-delivery"
      },
      {
        "id": "delivery-failures",
        "title": "최초 실패 계층을 구분",
        "lead": "모델은 설정·의존성·compile·JUnit·packaging·worker memory·image/registry를 나눕니다. 실제 memory failure나 registry incident는 만들지 않았습니다.",
        "code": "['configuration/plugin', 'dependency/verification', 'compileJava/compileTestJava', 'JUnit test', 'packaging', 'worker memory', 'image/registry']",
        "active": [
          0
        ],
        "values": [
          [
            "원문·모델 계층",
            "configuration/plugin · dependency/verification · compile · JUnit · packaging · worker memory · image/registry"
          ],
          [
            "실제 메모리·registry 장애",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.failure-layers"
        ],
        "image": "D04-delivery"
      }
    ]
  }
];
export const d04Run = path => path.split('.').reduce((value, key) => value?.[key], D04_RUNS);
