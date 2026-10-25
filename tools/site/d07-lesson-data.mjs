// 원문 Java의 한정된 native 관측8상태와 미실행 분류 모델28상태를 분리한다.
export const d07AssetRoot = '../design/d07-2026-10-21/images/';
export const D07_RUNS = {
  "checks": [
    "source-bodies-preserved-java25-container-unrun",
    "additional-java21-gradle-runtime",
    "pinned-runtime-artifacts-and-sha",
    "original-java-compiled-on-added-target21",
    "executable-jar-keeps-original-compiled-classes",
    "same-jar-two-own-path-copies",
    "two-own-local-http-processes-not-two-azs",
    "literal-health-is-not-actuator-or-db-diagnosis",
    "stopping-one-local-process-leaves-other-answering",
    "all-own-http-processes-and-ports-closed"
  ],
  "facts": {
    "source-bodies-preserved-java25-container-unrun": {
      "sourceSHA256": "0945450013d203109827f96fe2450233a1c79de1ce6caa4e904ccebd3da228b2",
      "lines": 300,
      "blocks": 8,
      "javaByteExact": true,
      "dockerfileByteExact": true,
      "originalJava25Executed": false,
      "dockerBuildOrRunExecuted": false
    },
    "additional-java21-gradle-runtime": {
      "java": "21.0.6",
      "gradle": "9.8.0",
      "scope": "additional Gradle build; original source Java unchanged, original Java25 environment unrun"
    },
    "pinned-runtime-artifacts-and-sha": {
      "artifacts": 39,
      "springBoot": "4.1.1",
      "springFramework": "7.0.9",
      "tomcat": "11.0.24",
      "allArtifactSHA256Matched": true,
      "snapshot": [
        {
          "coordinate": "ch.qos.logback:logback-classic:1.5.38",
          "sha256": "afb439c61fa287c9e1925523b13baab03617e724406a389d48b61c2c3e46b700"
        },
        {
          "coordinate": "ch.qos.logback:logback-core:1.5.38",
          "sha256": "a855a0fc97b1d06f4efb1c3bba5ebd0eb508d8b58e68e89e4bbc23a85135c883"
        },
        {
          "coordinate": "com.fasterxml.jackson.core:jackson-annotations:2.21",
          "sha256": "53ca085f4a150f703f49e1aabd935bd03b43e1ea3d55d135438292af22cef56b"
        },
        {
          "coordinate": "commons-logging:commons-logging:1.3.6",
          "sha256": "f8ead8943401081dea0aa824b5b1ba40a0e4ed297a572a0f02258150a0b62357"
        },
        {
          "coordinate": "io.micrometer:micrometer-commons:1.17.1",
          "sha256": "f2cee6ef046e72eec8128474c7f58c6217173b45ae373c30de0289f2a56ab0fd"
        },
        {
          "coordinate": "io.micrometer:micrometer-observation:1.17.1",
          "sha256": "eb34f0cd84a879393ae5c21160fc06385ccdc74f36a4d1e31b199f59acfdaf71"
        },
        {
          "coordinate": "jakarta.annotation:jakarta.annotation-api:3.0.0",
          "sha256": "b01f55552284cfb149411e64eabca75e942d26d2e1786b32914250e4330afaa2"
        },
        {
          "coordinate": "org.apache.logging.log4j:log4j-api:2.25.5",
          "sha256": "64777f73ea0b3104c04eb82befbdccc30a425a19e83ad06cb2f93aa303511863"
        },
        {
          "coordinate": "org.apache.logging.log4j:log4j-to-slf4j:2.25.5",
          "sha256": "b68e8b47342dbc9b35644a14fe2efc0b7bf18da703910cd05ad5501ffe07bba1"
        },
        {
          "coordinate": "org.apache.tomcat.embed:tomcat-embed-core:11.0.24",
          "sha256": "e7b966dcaac8c5ffa4f10e44031ebf5b71f2123560c08ac8b7120028615aea08"
        },
        {
          "coordinate": "org.apache.tomcat.embed:tomcat-embed-el:11.0.24",
          "sha256": "ad0546f12dace008aacce18ba13222137760b310ca719e173d3e13021b9af6c6"
        },
        {
          "coordinate": "org.apache.tomcat.embed:tomcat-embed-websocket:11.0.24",
          "sha256": "825160101f0da4a10e19b5730c2ae2f99f8c2c7a7211ac05562726c5e97ab91e"
        },
        {
          "coordinate": "org.jspecify:jspecify:1.0.1",
          "sha256": "070d75f261fe4c5b8202508366715f7f2d4660f88c8ef7e6d3575e48c9683b66"
        },
        {
          "coordinate": "org.slf4j:jul-to-slf4j:2.0.18",
          "sha256": "cbb7d1aaaa9e871eb1a06594abd911bf97027152976edf1edc315be75239204e"
        },
        {
          "coordinate": "org.slf4j:slf4j-api:2.0.18",
          "sha256": "44508fd1576500688c790b190acdd16fec4f8c79a3e0b900afd70503cf055f55"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-autoconfigure:4.1.1",
          "sha256": "59228756ddd76cea050f95d86deff334789bc53b6688beaa673b1af2b9794592"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-http-converter:4.1.1",
          "sha256": "52a167430a918c223b2ccd2eb62aff91a8e43e6daebe5a07caa37b9a04c61cb9"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-jackson:4.1.1",
          "sha256": "69a9b4d8850a0532a5e44ff7306a03621485b26596e7f9481de7d28e68a2dd42"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-servlet:4.1.1",
          "sha256": "4dcb156e311a4c1ad5f1ed7eabd94a78ea74510b05c429a4fcfdcf8beb9d5882"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-starter-jackson:4.1.1",
          "sha256": "d30e594a3e0f3a090438fc22000a87ab577a3b80c674180a10544ca331207f24"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-starter-logging:4.1.1",
          "sha256": "8eca7d72c8434f5c3b935385c656cd5337f473434bdbcb4913b3b3a34897d178"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-starter-tomcat-runtime:4.1.1",
          "sha256": "580f0d9a9d02a1a6e387640e422af42f9dbdf302836d562ec595fdb2b31a1c29"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-starter-tomcat:4.1.1",
          "sha256": "f224d8504be3b413825ee85ef549a7b1598ee8512e062c6bd5ddce1043cd388a"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-starter-webmvc:4.1.1",
          "sha256": "4aec3edbdf6317fefe23db1b989d8bba143a45a51c1fc32346146ecebf67d625"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-starter:4.1.1",
          "sha256": "de5b2dd28400eda20914fd4a6054d0c201e68d2e4de35a25a4d89f054ccc2e63"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-tomcat:4.1.1",
          "sha256": "17f65629e4eb3c979c0572b69b57d630bb12e64869e9d7520adddaa6734256b6"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-web-server:4.1.1",
          "sha256": "6912fb1fdf7f657a61ac050760fa835fb1e7496399291697e2901f82887a4fee"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot-webmvc:4.1.1",
          "sha256": "9f08c1fb938c45a8693fec5f3065be3aca203948a7ab4d56b06444986f75a6b2"
        },
        {
          "coordinate": "org.springframework.boot:spring-boot:4.1.1",
          "sha256": "0d92b532b1d4020640e72d78c31af175c23db8e0ddd45b81855b7fdf4c9c70f0"
        },
        {
          "coordinate": "org.springframework:spring-aop:7.0.9",
          "sha256": "b8c5d6bfcb1f4993f2cc124f7ab7fac40edf5256b9e43c2f7250a733cb5510e9"
        },
        {
          "coordinate": "org.springframework:spring-beans:7.0.9",
          "sha256": "ff218b827a25c9e8929b0cd56dfb56916cea9d5b669ed97dc7cb262508ff548b"
        },
        {
          "coordinate": "org.springframework:spring-context:7.0.9",
          "sha256": "7552a2fcfa30cea53eb14d7a65a7a8e1b1dd82e832a7164fb7e6fb105f438858"
        },
        {
          "coordinate": "org.springframework:spring-core:7.0.9",
          "sha256": "5195f4722699b39878d99a832549fe65df2890b159d063b88fff31b1ca65ae36"
        },
        {
          "coordinate": "org.springframework:spring-expression:7.0.9",
          "sha256": "046434c40f43819729b9b1db0e6c659dfa68184c1c2c2efa5f7b3a5b27c4e2e2"
        },
        {
          "coordinate": "org.springframework:spring-web:7.0.9",
          "sha256": "941ced476427bde2533872f293da535fd0258de3f3a650a7f1bfe01ed2927302"
        },
        {
          "coordinate": "org.springframework:spring-webmvc:7.0.9",
          "sha256": "8f114c1461692c5e534e82b27de23b7fb23370db8dee7ce0c92d5106906c9555"
        },
        {
          "coordinate": "org.yaml:snakeyaml:2.6",
          "sha256": "c8f7a98e7394adda02f6317249710e4d1b4c7a25aa8c7eace0c2eea52eb8bf85"
        },
        {
          "coordinate": "tools.jackson.core:jackson-core:3.1.5",
          "sha256": "9431b7fa2673bbb618c11d865fe15e13222fd182a214ff998cb7e56afd8f35d2"
        },
        {
          "coordinate": "tools.jackson.core:jackson-databind:3.1.5",
          "sha256": "3a2338d996fd3056791df8d335fa9ba8a62a706ed4245ecf81b3e583df37d08a"
        }
      ]
    },
    "original-java-compiled-on-added-target21": {
      "sourceJavaByteExact": true,
      "compiledSourceClasses": {
        "DemoApplication.class": 65,
        "HealthController.class": 65
      },
      "classfileTargetJava": 21
    },
    "executable-jar-keeps-original-compiled-classes": {
      "file": "d07-native-proof-1.0.0.jar",
      "bytes": 19902934,
      "sha256": "bfc2d0740b6425f8a1c9057f2b1b53cb9fd8badae043f5c9b98dd785c162c471",
      "nestedLibraries": 34,
      "startClass": "com.example.demo.DemoApplication",
      "sourceClassBytesExact": true
    },
    "same-jar-two-own-path-copies": {
      "copies": 2,
      "aliases": [
        "local-a/app.jar",
        "local-b/app.jar"
      ],
      "sameSHA256": "bfc2d0740b6425f8a1c9057f2b1b53cb9fd8badae043f5c9b98dd785c162c471",
      "sameBytes": 19902934,
      "rebuiltBetweenCopies": false
    },
    "two-own-local-http-processes-not-two-azs": {
      "processes": 2,
      "sameMac": true,
      "differentAllocatedLoopbackPorts": true,
      "explicitProfileSelected": false,
      "statuses": [
        200,
        200
      ],
      "bodies": [
        "ok",
        "ok"
      ],
      "VMOrAZExperiment": false
    },
    "literal-health-is-not-actuator-or-db-diagnosis": {
      "manualHealthStatus": 200,
      "manualHealthBody": "ok",
      "actuatorHealthStatus": 404,
      "actuatorDependencyPresent": false,
      "sourceChecksExternalState": false,
      "DBNodeRegionDiagnosticsProven": false
    },
    "stopping-one-local-process-leaves-other-answering": {
      "stoppedAExitCode": 143,
      "stoppedAPortClosed": true,
      "bAlive": true,
      "bHealthStatus": 200,
      "bHealthBody": "ok",
      "scope": "direct request to still-running own JVM; no automatic routing/VM/AZ/HA proof"
    },
    "all-own-http-processes-and-ports-closed": {
      "trackedLongRunningHTTPJVMs": 2,
      "exitCodes": [
        143,
        143
      ],
      "allPIDsGone": true,
      "allPortsClosed": true,
      "killFallbackUsed": false,
      "artifactCopiesUnchanged": true,
      "scope": "only these two HTTP JVMs; separate command JVMs exit0"
    }
  },
  "models": {
    "deployment-models": {
      "executed": false,
      "scope": "NIST SP800-145의 분류를 설명하는 모델이며 실제 클라우드 배치가 아니다.",
      "characteristics": [
        "on-demand self-service",
        "broad network access",
        "resource pooling",
        "rapid elasticity",
        "measured service"
      ],
      "services": [
        "IaaS",
        "PaaS",
        "SaaS"
      ],
      "deployments": [
        "private",
        "community",
        "public",
        "hybrid"
      ],
      "boundaries": [
        "private는 전용성 기준이며 off-premises 또는 제3자 운영도 가능",
        "IDC/colocation의 위치·시설 제공과 cloud 운영 모델은 다른 축",
        "hybrid는 별개 cloud infrastructure의 결합이며 multicloud는 이 네 목록의 다섯째 항목이 아님",
        "시설·장비·OS의 실제 담당은 계약에 따라 확인"
      ]
    },
    "service-responsibility": {
      "executed": false,
      "scope": "Azure의 illustrative governance matrix와 AWS 서비스별 책임 설명; 계약·보안 인증이 아니다.",
      "columns": [
        "on-premises",
        "IaaS",
        "PaaS",
        "SaaS"
      ],
      "rows": {
        "customer data": [
          "customer",
          "customer",
          "customer",
          "customer"
        ],
        "configurations and settings": [
          "customer",
          "customer",
          "customer",
          "customer"
        ],
        "identities and users": [
          "customer",
          "customer",
          "customer",
          "customer"
        ],
        "applications (broad area)": [
          "customer",
          "customer",
          "shared",
          "shared"
        ],
        "network controls": [
          "customer",
          "customer",
          "shared",
          "provider"
        ],
        "operating system": [
          "customer",
          "customer",
          "provider",
          "provider"
        ],
        "physical hosts/network/datacenter": [
          "customer",
          "provider",
          "provider",
          "provider"
        ]
      },
      "boundaries": [
        "SaaS Applications Shared는 고객이 공급자의 제품 소스코드를 운영한다는 뜻이 아님",
        "고객 설정·자체 확장 코드가 있으면 그 코드·사용자 접근·데이터와 공급자의 제품 운영을 구분",
        "PaaS/SaaS의 플랫폼 OS/runtime 운영 위임과 고객 app/data/access 책임은 별개",
        "EKS managed nodes/Fargate 같은 실행 옵션마다 worker OS·kernel 경계가 달라 일반화하지 않음"
      ]
    },
    "virtualization-packaging": {
      "executed": false,
      "scope": "일반 Linux host의 VM/container와 원문 Dockerfile 설명; 실제 Docker/VM 실행 없음.",
      "boundaries": [
        "VM은 guest OS/kernel, 같은 Linux host의 보통 container들은 그 Linux kernel 공유",
        "VM 안에서도 container 실행 가능",
        "Docker Desktop Mac의 Linux container는 Linux VM 안에서 실행하며 Darwin kernel 공유라고 표시하지 않음",
        "Fargate Pod별 compute/kernel 경계 같은 제품별 예외를 일반 Linux host 그림과 섞지 않음",
        "EXPOSE8080은 metadata이며 host publish와 다름",
        "COPY wildcard의 다중 source는 directory 목적지가 필요; 실제 Docker build 결과는 관찰 안 함",
        "원문 eclipse-temurin:25-jre tag/Dockerfile은 보존·미실행; Java21 native는 해당 image 실행 증거가 아님",
        "registry 저장·배포와 app process 실행은 다른 역할"
      ]
    },
    "traffic-resilience": {
      "executed": false,
      "scope": "DNS/LB/AZ/app/data 계층의 책임·실패 도메인 모델; 실제 AZ/HA/DR 실험 없음.",
      "boundaries": [
        "DNS 정책/health 설정, LB target probe, app 응답, DB 복제·세션·복구를 구분",
        "복수 AZ 자체로 자동 무중단·일관성·재해복구를 인증하지 않음",
        "literal ok의 /health는 외부 의존·노드·리전 상태 검사 아님",
        "한 Mac의 두 own JVM은 두 VM/AZ나 자동 failover의 증거가 아님"
      ]
    },
    "catalog-storage-cost": {
      "executed": false,
      "scope": "기능별 제품 예와 저장·비용 항목의 설명; 상품 선택·호환성·실제 요금 인증이 아니다.",
      "boundaries": [
        "AWS/Azure/GCP 비교는 유사 기능 예이며 API·책임·세부 SKU의 완전 호환 표가 아님",
        "ECR은 image/artifact registry이며 app runtime이 아님; scan은 설정과 별도 검토가 필요",
        "S3 key/prefix/delimiter의 logical folder와 OS directory를 구분",
        "Azure HNS의 directory semantics/atomic operations를 모든 POSIX 동작 보장으로 확대하지 않음",
        "on-prem 장비·전력·상면·회선·운영과 cloud compute/storage/request/log/backup/network를 비교",
        "실제 rate/할인율/청구·절감액·성능 숫자를 만들지 않음"
      ]
    },
    "migration-choice": {
      "executed": false,
      "scope": "AWS7R와 구매 방식의 선택 경계 모델; 실제 이전·약정·결제·중단 없음.",
      "strategies": [
        "Retire",
        "Retain",
        "Rehost",
        "Relocate",
        "Repurchase",
        "Replatform",
        "Refactor/re-architect"
      ],
      "boundaries": [
        "Rehost·일부 platform 최적화·구조 변경의 범위를 구분",
        "AWS의 대규모 migration guidance를 모든 조직의 필수 순서로 표시하지 않음",
        "On-demand, 사용 commitment, 회수 가능한 Spot의 책임/유연성은 별도",
        "모든 app을 Refactor하거나 cloud가 항상 저렴하다는 결론을 내리지 않음"
      ]
    }
  }
};
export const D07_ASSETS = {
  "D07-artifact": {
    "file": "artifact-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "원문 앱과 실행한 JAR는 어떻게 연결될까요?",
    "focus": {
      "artifact-source": [
        1,
        18,
        19,
        49
      ],
      "artifact-build": [
        20,
        18,
        21,
        49
      ],
      "artifact-copies": [
        41,
        18,
        21,
        49
      ]
    }
  },
  "D07-health": {
    "file": "health-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "literal ok의 /health는 무엇을 확인할까요?",
    "focus": {
      "health-ok": [
        70,
        23,
        29,
        18
      ],
      "health-actuator": [
        70,
        43,
        29,
        23
      ]
    }
  },
  "D07-lifecycle": {
    "file": "lifecycle-v4.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "한 로컬 JVM을 종료하면 다른 JVM은 어떻게 되나요?",
    "focus": {
      "lifecycle-two": [
        1,
        26,
        28,
        47
      ],
      "lifecycle-one": [
        30,
        26,
        40,
        47
      ],
      "lifecycle-clean": [
        70,
        26,
        29,
        47
      ]
    }
  },
  "D07-placement": {
    "file": "placement-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "서버 위치·전용성·운영 주체는 같은 기준일까요?",
    "focus": {
      "placement-onprem": [
        1,
        8,
        49,
        63
      ],
      "placement-private": [
        50,
        8,
        24,
        63
      ],
      "placement-hybrid": [
        61,
        72,
        38,
        23
      ]
    }
  },
  "D07-taxonomy": {
    "file": "taxonomy-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "NIST의5·3·4는 무엇을 분류할까요?",
    "focus": {
      "taxonomy-five": [
        1,
        10,
        98,
        31
      ],
      "taxonomy-service": [
        1,
        42,
        98,
        24
      ],
      "taxonomy-deploy": [
        1,
        67,
        98,
        24
      ]
    }
  },
  "D07-responsibility": {
    "file": "responsibility-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "플랫폼을 맡기면 고객 책임은 무엇이 남을까요?",
    "focus": {
      "responsibility-infra": [
        1,
        61,
        78,
        14
      ],
      "responsibility-platform": [
        51,
        25,
        28,
        50
      ],
      "responsibility-saas": [
        80,
        46,
        19,
        51
      ]
    }
  },
  "D07-virtualization": {
    "file": "virtualization-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "VM·container·Mac의 kernel 경계는 어떻게 다를까요?",
    "focus": {
      "virtualization-vm": [
        1,
        8,
        41,
        52
      ],
      "virtualization-container": [
        42,
        8,
        41,
        52
      ],
      "virtualization-mac": [
        1,
        61,
        67,
        37
      ]
    }
  },
  "D07-dockerfile": {
    "file": "dockerfile-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "Dockerfile의 metadata와 실제 publish는 같을까요?",
    "focus": {
      "dockerfile-build": [
        1,
        11,
        63,
        70
      ],
      "dockerfile-publish": [
        64,
        43,
        35,
        20
      ],
      "dockerfile-copy": [
        64,
        64,
        35,
        17
      ]
    }
  },
  "D07-traffic": {
    "file": "traffic-v4.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "DNS·LB·앱·데이터는 어떤 실패 경계를 가질까요?",
    "focus": {
      "traffic-normal": [
        1,
        9,
        98,
        31
      ],
      "traffic-failure": [
        38,
        40,
        61,
        31
      ]
    }
  },
  "D07-managed": {
    "file": "managed-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "관리형 서비스에서 무엇을 맡기고 무엇을 정할까요?",
    "focus": {
      "managed-platform": [
        67,
        9,
        32,
        48
      ],
      "managed-k8s": [
        34,
        9,
        32,
        48
      ],
      "managed-catalog": [
        1,
        58,
        98,
        30
      ]
    }
  },
  "D07-storage": {
    "file": "storage-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "object key와 directory 의미는 어디서 갈릴까요?",
    "focus": {
      "storage-key": [
        1,
        11,
        49,
        63
      ],
      "storage-hns": [
        50,
        11,
        49,
        63
      ]
    }
  },
  "D07-cost": {
    "file": "cost-v2.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "비용 비교에는 어떤 항목과 책임을 넣을까요?",
    "focus": {
      "cost-onprem": [
        1,
        15,
        39,
        43
      ],
      "cost-cloud": [
        61,
        15,
        38,
        45
      ],
      "cost-buying": [
        1,
        73,
        98,
        20
      ]
    }
  },
  "D07-migration": {
    "file": "migration-v3.jpg",
    "width": 1672,
    "height": 941,
    "ready": true,
    "alt": "7R은 같은 이전을 일곱 번 하는 순서일까요?",
    "focus": {
      "migration-keep": [
        1,
        38,
        29,
        49
      ],
      "migration-move": [
        30,
        38,
        26,
        49
      ],
      "migration-change": [
        56,
        38,
        43,
        49
      ]
    }
  }
};
export const D07_LESSONS = [
  {
    "id": "artifact",
    "question": "원문 앱과 실행한 JAR는 어떻게 연결될까요?",
    "source": "원문 Java byte exact + 추가 Java21 Gradle 빌드",
    "sourceNote": "D07에는 원문 Java가 있습니다. 원문 Java/Dockerfile을 그대로 보존했고 원문 Java는 추가 Java21.0.6·Gradle9.8.0·Boot4.1.1에서 실행했습니다. 원문 Java25 환경·Dockerfile은 미실행입니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "artifact-source",
        "title": "원문 두 class를 그대로 사용",
        "lead": "표시된 DemoApplication·HealthController는 원문 그대로입니다. 원문 Java25/Docker 명령을 실행한 것으로 바꾸어 말하지 않습니다.",
        "values": [
          [
            "원문 Java / Dockerfile bytes",
            "보존 true / true"
          ],
          [
            "원문 Java25 / Docker 실행",
            "false / false"
          ]
        ],
        "checks": [
          "source-bodies-preserved-java25-container-unrun"
        ],
        "runKeys": [
          "facts.source-bodies-preserved-java25-container-unrun"
        ],
        "code": "@SpringBootApplication\npublic class DemoApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(DemoApplication.class, args);\n    }\n}\n\n@RestController\nclass HealthController {\n    @GetMapping(\"/health\")\n    String health() {\n        return \"ok\";\n    }\n}",
        "active": [
          3,
          11
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-artifact"
      },
      {
        "id": "artifact-build",
        "title": "추가 빌드와 실행 JAR 식별",
        "lead": "원문 두 class는 추가 target21/major65로 컴파일됐습니다. 해석 dependency39개와 JAR nested lib34개는 다른 집합입니다.",
        "values": [
          [
            "추가 Java / Gradle",
            "21.0.6 / 9.8.0"
          ],
          [
            "원문 두 class major",
            "DemoApplication.class=65 / HealthController.class=65"
          ],
          [
            "dependency / nested lib",
            "39 / 34 · 서로 다른 목록"
          ],
          [
            "JAR file / bytes",
            "d07-native-proof-1.0.0.jar / 19902934"
          ],
          [
            "JAR SHA256",
            "bfc2d0740b6425f8a1c9057f2b1b53cb9fd8badae043f5c9b98dd785c162c471"
          ]
        ],
        "checks": [
          "additional-java21-gradle-runtime",
          "pinned-runtime-artifacts-and-sha",
          "original-java-compiled-on-added-target21",
          "executable-jar-keeps-original-compiled-classes"
        ],
        "runKeys": [
          "facts.additional-java21-gradle-runtime",
          "facts.pinned-runtime-artifacts-and-sha",
          "facts.original-java-compiled-on-added-target21",
          "facts.executable-jar-keeps-original-compiled-classes"
        ],
        "code": "plugins { id 'java'; id 'org.springframework.boot' version '4.1.1' }\nrepositories { mavenCentral() }\njava { toolchain { languageVersion = JavaLanguageVersion.of(21) } }\nversion = '1.0.0'\nspringBoot { mainClass = 'com.example.demo.DemoApplication' }\nsourceSets.main.java.srcDirs = ['java']",
        "active": [
          2,
          3,
          4
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-artifact"
      },
      {
        "id": "artifact-copies",
        "title": "같은 JAR를 두 own 경로로 복사",
        "lead": "local-a/app.jar·local-b/app.jar는 같은 JAR 사본입니다. local-a/b는 관찰기 별칭이며 profile이나 실제 JVM 시스템 이름이 아닙니다.",
        "values": [
          [
            "사본 경로 별칭",
            "local-a/app.jar / local-b/app.jar"
          ],
          [
            "sameBytes / copies",
            "19902934 / 2"
          ],
          [
            "rebuiltBetweenCopies",
            "false"
          ],
          [
            "sameSHA256",
            "bfc2d0740b6425f8a1c9057f2b1b53cb9fd8badae043f5c9b98dd785c162c471"
          ]
        ],
        "checks": [
          "same-jar-two-own-path-copies"
        ],
        "runKeys": [
          "facts.same-jar-two-own-path-copies"
        ],
        "code": "    for name in ['local-a','local-b']:\n        path = run/name/'app.jar'\n        path.parent.mkdir()\n        shutil.copy2(jar,path)\n        copies.append(path)",
        "active": [
          0,
          3,
          4
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-artifact"
      }
    ]
  },
  {
    "id": "health",
    "question": "literal ok의 /health는 무엇을 확인할까요?",
    "source": "원문 HealthController + 실제 own HTTP",
    "sourceNote": "/health는 기본 HTTP 프로브 응답으로 사용할 수 있습니다. literal ok는 외부 DB·노드·리전 진단이나 Actuator의 UP가 아닙니다. /actuator/health는 등록되지 않은 경로의 실제404이며 JSON 본문은 원자료에 보존합니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "health-ok",
        "title": "원문 /health는200·ok",
        "lead": "한 Mac의 두 own 프로세스에 직접 요청해 각각200/ok를 관찰했습니다. DB나 AZ 상태를 검사한 코드는 아닙니다.",
        "values": [
          [
            "A/B status",
            "200 / 200"
          ],
          [
            "A/B body",
            "ok / ok"
          ],
          [
            "sourceChecksExternalState",
            "false"
          ],
          [
            "프로브 의미",
            "기본 HTTP 응답 확인 · 외부 진단 아님"
          ]
        ],
        "checks": [
          "two-own-local-http-processes-not-two-azs"
        ],
        "runKeys": [
          "facts.two-own-local-http-processes-not-two-azs"
        ],
        "code": "class HealthController {\n    @GetMapping(\"/health\")\n    String health() {\n        return \"ok\";\n    }",
        "active": [
          3
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-health"
      },
      {
        "id": "health-actuator",
        "title": "등록 없는 Actuator 경로는404",
        "lead": "실제 local-a/app.jar로 시작한 A에 /actuator/health를 요청하면404였습니다. Actuator dependency/등록 route가 없으며 실제 본문은 application/json입니다.",
        "values": [
          [
            "요청 대상",
            "관찰기 local-a · local-a/app.jar"
          ],
          [
            "/actuator/health status",
            "404 · 미등록 경로"
          ],
          [
            "실제 Content-Type",
            "application/json"
          ],
          [
            "실제 JSON의 안정된 필드",
            "status=404 / error=Not Found / path=/actuator/health"
          ],
          [
            "actuatorDependencyPresent",
            "false"
          ]
        ],
        "checks": [
          "literal-health-is-not-actuator-or-db-diagnosis"
        ],
        "runKeys": [
          "facts.literal-health-is-not-actuator-or-db-diagnosis"
        ],
        "code": "    missing = request(a,'/actuator/health','a-actuator-unconfigured')",
        "active": [
          0
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-health"
      }
    ]
  },
  {
    "id": "lifecycle",
    "question": "한 로컬 JVM을 종료하면 다른 JVM은 어떻게 되나요?",
    "source": "실제 own 두 JVM·직접 HTTP·SIGTERM 관측",
    "sourceNote": "이 주제는 native 관측이며 미실행 모델이 아닙니다. 같은 Mac·서로 다른 loopback 임시 port의 own 두 HTTP JVM입니다. 두 VM/AZ·자동 LB failover나 고가용성 증거는 아닙니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "lifecycle-two",
        "title": "같은 Mac의 두 own JVM",
        "lead": "같은 JAR 사본 두 개를 서로 다른 own loopback port에서 실행했습니다. 명시 profile을 선택하지 않았습니다.",
        "values": [
          [
            "tracked HTTP JVMs / sameMac",
            "2 / true"
          ],
          [
            "differentAllocatedLoopbackPorts",
            "true"
          ],
          [
            "explicitProfileSelected",
            "false"
          ],
          [
            "VMOrAZExperiment",
            "false"
          ]
        ],
        "checks": [
          "two-own-local-http-processes-not-two-azs"
        ],
        "runKeys": [
          "facts.two-own-local-http-processes-not-two-azs"
        ],
        "code": "    pa,a = start('local-a',copies[0])\n    pb,b = start('local-b',copies[1])\n    first = request(a,'/health','a-before-stop')\n    second = request(b,'/health','b-before-stop')",
        "active": [
          0,
          1
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-lifecycle"
      },
      {
        "id": "lifecycle-one",
        "title": "A 종료 뒤 직접 B는200",
        "lead": "A를 자체 SIGTERM143으로 종료해 port가 닫힌 뒤 계속 실행 중인 B에 직접 요청해200/ok를 받았습니다. 자동 경로 전환은 하지 않았습니다.",
        "values": [
          [
            "A exit / portClosed",
            "143 / true"
          ],
          [
            "B alive / status / body",
            "true / 200 / ok"
          ],
          [
            "자동 LB failover",
            "미실행 · 직접 B 요청"
          ]
        ],
        "checks": [
          "stopping-one-local-process-leaves-other-answering"
        ],
        "runKeys": [
          "facts.stopping-one-local-process-leaves-other-answering"
        ],
        "code": "    stop(pa,a)\n    alive = pb.poll() is None\n    remaining = request(b,'/health','b-after-a-stopped')",
        "active": [
          0,
          2
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-lifecycle"
      },
      {
        "id": "lifecycle-clean",
        "title": "최종 두 own HTTP JVM 모두 종료",
        "lead": "최종 B도143으로 종료돼 두 PID/port가 사라졌고 kill fallback은 없었습니다.2개는 추적한 장기 HTTP JVM 분모이며 별도 version/build 명령은 exit0입니다.",
        "values": [
          [
            "trackedLongRunningHTTPJVMs",
            "2"
          ],
          [
            "exitCodes",
            "[143,143]"
          ],
          [
            "allPIDsGone / allPortsClosed",
            "true / true"
          ],
          [
            "killFallbackUsed / copiesUnchanged",
            "false / true"
          ],
          [
            "별도 version/build 명령",
            "각 exit0 · HTTP JVM 분모와 별도"
          ]
        ],
        "checks": [
          "all-own-http-processes-and-ports-closed"
        ],
        "runKeys": [
          "facts.all-own-http-processes-and-ports-closed"
        ],
        "code": "    stop(pb,b)",
        "active": [
          0
        ],
        "codeKind": "native-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-lifecycle"
      }
    ]
  },
  {
    "id": "placement",
    "question": "서버 위치·전용성·운영 주체는 같은 기준일까요?",
    "source": "미실행 deployment-models 분류 JSON",
    "sourceNote": "위치·시설 제공과 cloud 운영 모델은 다른 축입니다. private의 전용성·운영 주체·시설 책임은 서비스와 계약을 구분해 읽으며 실제 배치하지 않았습니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "placement-onprem",
        "title": "온프레미스와 IDC 위치를 분리",
        "lead": "IDC/colocation은 위치·시설 제공입니다. 장비·OS의 담당과 cloud 운영 모델이 그 위치만으로 정해지지 않습니다.",
        "values": [
          [
            "분류 축",
            "위치·시설 / 전용성 / 운영 주체"
          ],
          [
            "IDC·colocation",
            "시설 제공과 cloud 모델은 별개"
          ],
          [
            "실제 배치",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.deployment-models"
        ],
        "code": "[\n  \"private는 전용성 기준이며 off-premises 또는 제3자 운영도 가능\",\n  \"IDC/colocation의 위치·시설 제공과 cloud 운영 모델은 다른 축\",\n  \"hybrid는 별개 cloud infrastructure의 결합이며 multicloud는 이 네 목록의 다섯째 항목이 아님\",\n  \"시설·장비·OS의 실제 담당은 계약에 따라 확인\"\n]",
        "active": [
          2,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.deployment-models.boundaries",
        "codeKeys": null,
        "image": "D07-placement"
      },
      {
        "id": "placement-private",
        "title": "private는 전용성 기준",
        "lead": "특정 조직 전용의 cloud 모델은 off-premises나 제3자 운영도 가능합니다. 회사 건물 안이라는 뜻으로 고정하지 않습니다.",
        "values": [
          [
            "private 기준",
            "특정 조직 전용"
          ],
          [
            "가능한 위치·운영",
            "off-premises / 제3자 운영도 가능"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.deployment-models"
        ],
        "code": "[\n  \"private는 전용성 기준이며 off-premises 또는 제3자 운영도 가능\",\n  \"IDC/colocation의 위치·시설 제공과 cloud 운영 모델은 다른 축\",\n  \"hybrid는 별개 cloud infrastructure의 결합이며 multicloud는 이 네 목록의 다섯째 항목이 아님\",\n  \"시설·장비·OS의 실제 담당은 계약에 따라 확인\"\n]",
        "active": [
          1
        ],
        "codeKind": "model-json",
        "codePath": "models.deployment-models.boundaries",
        "codeKeys": null,
        "image": "D07-placement"
      },
      {
        "id": "placement-hybrid",
        "title": "hybrid와 multicloud를 구분",
        "lead": "NIST hybrid는 별개 cloud infrastructure의 결합입니다. multicloud를 네 배치 모델의 다섯째 항목으로 추가하지 않습니다.",
        "values": [
          [
            "hybrid",
            "별개 cloud infrastructure 결합"
          ],
          [
            "multicloud",
            "NIST 네 배치 목록의 다섯째 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.deployment-models"
        ],
        "code": "[\n  \"private는 전용성 기준이며 off-premises 또는 제3자 운영도 가능\",\n  \"IDC/colocation의 위치·시설 제공과 cloud 운영 모델은 다른 축\",\n  \"hybrid는 별개 cloud infrastructure의 결합이며 multicloud는 이 네 목록의 다섯째 항목이 아님\",\n  \"시설·장비·OS의 실제 담당은 계약에 따라 확인\"\n]",
        "active": [
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.deployment-models.boundaries",
        "codeKeys": null,
        "image": "D07-placement"
      }
    ]
  },
  {
    "id": "taxonomy",
    "question": "NIST의5·3·4는 무엇을 분류할까요?",
    "source": "미실행 NIST SP800-145 모델 JSON",
    "sourceNote": "다섯 특성·세 서비스 모델·네 배치 모델은 서로 다른 분류입니다. 실제 cloud 구축·보안 인증이나 제품별 전체 계약을 검증한 것이 아닙니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "taxonomy-five",
        "title": "클라우드의 다섯 특성",
        "lead": "NIST 모델의 특성은 self-service·network access·pooling·elasticity·measured service입니다.",
        "values": [
          [
            "특성5개",
            "on-demand self-service\nbroad network access\nresource pooling\nrapid elasticity\nmeasured service"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.deployment-models"
        ],
        "code": "[\n  \"on-demand self-service\",\n  \"broad network access\",\n  \"resource pooling\",\n  \"rapid elasticity\",\n  \"measured service\"\n]",
        "active": [
          1,
          2,
          3,
          4,
          5
        ],
        "codeKind": "model-json",
        "codePath": "models.deployment-models.characteristics",
        "codeKeys": null,
        "image": "D07-taxonomy"
      },
      {
        "id": "taxonomy-service",
        "title": "서비스 모델은 IaaS·PaaS·SaaS",
        "lead": "서비스를 어떤 수준으로 제공하는지의 세 분류입니다. private/community/public/hybrid의 네 배치 모델과 구분합니다.",
        "values": [
          [
            "서비스 모델3개",
            "IaaS / PaaS / SaaS"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.deployment-models"
        ],
        "code": "[\n  \"IaaS\",\n  \"PaaS\",\n  \"SaaS\"\n]",
        "active": [
          1,
          2,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.deployment-models.services",
        "codeKeys": null,
        "image": "D07-taxonomy"
      },
      {
        "id": "taxonomy-deploy",
        "title": "배치 모델은 네 가지",
        "lead": "NIST 모델의 private/community/public/hybrid를 읽습니다. 실제 데이터센터나 계정을 만들지 않았습니다.",
        "values": [
          [
            "배치 모델4개",
            "private / community / public / hybrid"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.deployment-models"
        ],
        "code": "[\n  \"private\",\n  \"community\",\n  \"public\",\n  \"hybrid\"\n]",
        "active": [
          1,
          2,
          3,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.deployment-models.deployments",
        "codeKeys": null,
        "image": "D07-taxonomy"
      }
    ]
  },
  {
    "id": "responsibility",
    "question": "플랫폼을 맡기면 고객 책임은 무엇이 남을까요?",
    "source": "미실행 service-responsibility 책임표 JSON",
    "sourceNote": "열 순서는 on-premises/IaaS/PaaS/SaaS입니다. Azure broad Applications Shared는 고객이 공급자 제품 소스를 운영한다는 뜻이 아닙니다. 설정·자체 확장 코드가 있으면 그 코드·접근·데이터와 공급자 제품 운영을 나눕니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "responsibility-infra",
        "title": "IaaS 물리층과 guest OS를 분리",
        "lead": "IaaS의 물리 host/network/datacenter는 provider이고 guest OS는 customer입니다. VM 생성 서비스 제공과 고객의 생성 요청·VM 구성도 구분합니다.",
        "values": [
          [
            "IaaS 물리층",
            "provider"
          ],
          [
            "IaaS guest OS",
            "customer"
          ],
          [
            "VM 생성 역할",
            "서비스 제공=provider / 생성 요청·구성=customer"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.service-responsibility"
        ],
        "code": "{\n  \"operating system\": [\n    \"customer\",\n    \"customer\",\n    \"provider\",\n    \"provider\"\n  ],\n  \"physical hosts/network/datacenter\": [\n    \"customer\",\n    \"provider\",\n    \"provider\",\n    \"provider\"\n  ]\n}",
        "active": [
          1,
          7
        ],
        "codeKind": "model-json",
        "codePath": "models.service-responsibility.rows",
        "codeKeys": [
          "operating system",
          "physical hosts/network/datacenter"
        ],
        "image": "D07-responsibility"
      },
      {
        "id": "responsibility-platform",
        "title": "PaaS의 OS·runtime 위임과 앱 책임",
        "lead": "플랫폼 OS/runtime 운영을 맡겨도 고객 app/data/access·설정 책임이 사라지지 않습니다. scaling 서비스와 고객의 정책 설정도 별개입니다.",
        "values": [
          [
            "PaaS/SaaS OS·runtime 운영",
            "provider · 서비스별 계약 확인"
          ],
          [
            "고객에게 남는 것",
            "app/data/access·설정"
          ],
          [
            "scaling 역할",
            "서비스 제공과 고객 정책 설정 구분"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.service-responsibility"
        ],
        "code": "[\n  \"customer\",\n  \"customer\",\n  \"provider\",\n  \"provider\"\n]",
        "active": [
          3,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.service-responsibility.rows.operating system",
        "codeKeys": null,
        "image": "D07-responsibility"
      },
      {
        "id": "responsibility-saas",
        "title": "SaaS Shared는 제품 소스 운영이 아님",
        "lead": "broad Applications의 Shared는 고객 설정·확장·사용자 접근·데이터와 공급자 제품 운영을 나눠 읽어야 합니다.",
        "values": [
          [
            "표의 broad Applications",
            "PaaS shared / SaaS shared"
          ],
          [
            "공급자 제품 운영",
            "provider"
          ],
          [
            "고객 영역",
            "설정·확장 코드가 있으면 해당 코드·접근·데이터"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.service-responsibility"
        ],
        "code": "[\n  \"customer\",\n  \"customer\",\n  \"shared\",\n  \"shared\"\n]",
        "active": [
          3,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.service-responsibility.rows.applications (broad area)",
        "codeKeys": null,
        "image": "D07-responsibility"
      }
    ]
  },
  {
    "id": "virtualization",
    "question": "VM·container·Mac의 kernel 경계는 어떻게 다를까요?",
    "source": "미실행 virtualization-packaging 모델 JSON",
    "sourceNote": "일반 Linux host 모델과 제품별 compute/kernel 옵션을 구분합니다. VM·Docker Desktop·Fargate를 실제 실행하거나 격리·성능을 측정하지 않았습니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "virtualization-vm",
        "title": "VM은 guest OS·kernel을 가짐",
        "lead": "VM과 container는 다른 층이므로 VM 안에서도 container를 실행할 수 있습니다.",
        "values": [
          [
            "VM 모델",
            "guest OS/kernel 경계"
          ],
          [
            "조합",
            "VM 안 container 가능"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.virtualization-packaging"
        ],
        "code": "[\n  \"VM은 guest OS/kernel, 같은 Linux host의 보통 container들은 그 Linux kernel 공유\",\n  \"VM 안에서도 container 실행 가능\",\n  \"Docker Desktop Mac의 Linux container는 Linux VM 안에서 실행하며 Darwin kernel 공유라고 표시하지 않음\",\n  \"Fargate Pod별 compute/kernel 경계 같은 제품별 예외를 일반 Linux host 그림과 섞지 않음\",\n  \"EXPOSE8080은 metadata이며 host publish와 다름\",\n  \"COPY wildcard의 다중 source는 directory 목적지가 필요; 실제 Docker build 결과는 관찰 안 함\",\n  \"원문 eclipse-temurin:25-jre tag/Dockerfile은 보존·미실행; Java21 native는 해당 image 실행 증거가 아님\",\n  \"registry 저장·배포와 app process 실행은 다른 역할\"\n]",
        "active": [
          1,
          2
        ],
        "codeKind": "model-json",
        "codePath": "models.virtualization-packaging.boundaries",
        "codeKeys": null,
        "image": "D07-virtualization"
      },
      {
        "id": "virtualization-container",
        "title": "같은 Linux host의 보통 container",
        "lead": "일반적인 같은 Linux host container는 해당 Linux kernel을 공유합니다. 모든 제품·Pod별 옵션에 같은 경계를 강제하지 않습니다.",
        "values": [
          [
            "일반 Linux host 모델",
            "container들이 그 Linux kernel 공유"
          ],
          [
            "제품별 예외",
            "compute/kernel 경계 확인"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.virtualization-packaging"
        ],
        "code": "[\n  \"VM은 guest OS/kernel, 같은 Linux host의 보통 container들은 그 Linux kernel 공유\",\n  \"VM 안에서도 container 실행 가능\",\n  \"Docker Desktop Mac의 Linux container는 Linux VM 안에서 실행하며 Darwin kernel 공유라고 표시하지 않음\",\n  \"Fargate Pod별 compute/kernel 경계 같은 제품별 예외를 일반 Linux host 그림과 섞지 않음\",\n  \"EXPOSE8080은 metadata이며 host publish와 다름\",\n  \"COPY wildcard의 다중 source는 directory 목적지가 필요; 실제 Docker build 결과는 관찰 안 함\",\n  \"원문 eclipse-temurin:25-jre tag/Dockerfile은 보존·미실행; Java21 native는 해당 image 실행 증거가 아님\",\n  \"registry 저장·배포와 app process 실행은 다른 역할\"\n]",
        "active": [
          1,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.virtualization-packaging.boundaries",
        "codeKeys": null,
        "image": "D07-virtualization"
      },
      {
        "id": "virtualization-mac",
        "title": "Mac Linux container는 Linux VM 안",
        "lead": "Docker Desktop Mac의 Linux container를 Darwin kernel 공유로 그리지 않습니다. 이 항목은 문헌 모델이며 실제 VM/container 실행은 아닙니다.",
        "values": [
          [
            "Mac 모델",
            "Linux VM → Linux container"
          ],
          [
            "Darwin kernel 공유 주장",
            "하지 않음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.virtualization-packaging"
        ],
        "code": "[\n  \"VM은 guest OS/kernel, 같은 Linux host의 보통 container들은 그 Linux kernel 공유\",\n  \"VM 안에서도 container 실행 가능\",\n  \"Docker Desktop Mac의 Linux container는 Linux VM 안에서 실행하며 Darwin kernel 공유라고 표시하지 않음\",\n  \"Fargate Pod별 compute/kernel 경계 같은 제품별 예외를 일반 Linux host 그림과 섞지 않음\",\n  \"EXPOSE8080은 metadata이며 host publish와 다름\",\n  \"COPY wildcard의 다중 source는 directory 목적지가 필요; 실제 Docker build 결과는 관찰 안 함\",\n  \"원문 eclipse-temurin:25-jre tag/Dockerfile은 보존·미실행; Java21 native는 해당 image 실행 증거가 아님\",\n  \"registry 저장·배포와 app process 실행은 다른 역할\"\n]",
        "active": [
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.virtualization-packaging.boundaries",
        "codeKeys": null,
        "image": "D07-virtualization"
      }
    ]
  },
  {
    "id": "dockerfile",
    "question": "Dockerfile의 metadata와 실제 publish는 같을까요?",
    "source": "원문 Dockerfile·bash의 미실행 발췌 / 모델",
    "sourceNote": "원문 eclipse-temurin:25-jre Dockerfile과 bash는 보존·미실행입니다. 추가 Java21 native 실행이 해당 image의 실행 증거가 아닙니다. COPY의 조건과 실제 Docker build 결과를 구분합니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "dockerfile-build",
        "title": "원문 image 실행은 하지 않음",
        "lead": "FROM/WORKDIR/ENTRYPOINT는 원문 image 구성입니다. 실제 Docker build/run이나 registry 조작을 하지 않았습니다.",
        "values": [
          [
            "원문 base tag",
            "eclipse-temurin:25-jre · 미실행"
          ],
          [
            "Java21 native와 관계",
            "해당 image 실행 증거 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.virtualization-packaging"
        ],
        "code": "FROM eclipse-temurin:25-jre\nWORKDIR /app\nCOPY build/libs/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-jar\", \"/app/app.jar\"]",
        "active": [
          0,
          1,
          4
        ],
        "codeKind": "unrun-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-dockerfile"
      },
      {
        "id": "dockerfile-publish",
        "title": "EXPOSE와 -p publish는 다름",
        "lead": "EXPOSE8080은 metadata입니다. 원문 -p8080:8080은 host publish 명령 표현이며 실제 실행 결과가 아닙니다.",
        "values": [
          [
            "EXPOSE 8080",
            "metadata"
          ],
          [
            "-p 8080:8080",
            "host publish 명령 표현 · 미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.virtualization-packaging"
        ],
        "code": "./gradlew clean bootJar\ndocker build -t d07-demo:local .\ndocker run --rm -p 8080:8080 d07-demo:local\ncurl -i http://localhost:8080/health",
        "active": [
          2
        ],
        "codeKind": "unrun-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-dockerfile"
      },
      {
        "id": "dockerfile-copy",
        "title": "wildcard COPY는 source 수 조건이 있음",
        "lead": "원문 COPY의 wildcard가 여러 source에 매치되면 directory 목적지가 필요합니다. source 하나라는 조건과 다중 source 조건을 나눠 읽습니다.",
        "values": [
          [
            "COPY 원문",
            "build/libs/*.jar → app.jar"
          ],
          [
            "다중 source 조건",
            "directory 목적지·trailing slash 필요"
          ],
          [
            "실제 Docker build 결과",
            "미관측"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.virtualization-packaging"
        ],
        "code": "FROM eclipse-temurin:25-jre\nWORKDIR /app\nCOPY build/libs/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-jar\", \"/app/app.jar\"]",
        "active": [
          2
        ],
        "codeKind": "unrun-source",
        "codePath": null,
        "codeKeys": null,
        "image": "D07-dockerfile"
      }
    ]
  },
  {
    "id": "traffic",
    "question": "DNS·LB·앱·데이터는 어떤 실패 경계를 가질까요?",
    "source": "미실행 traffic-resilience 모델 JSON",
    "sourceNote": "DNS 정책·LB probe·app 응답·data 복제/세션/복구는 서로 다른 증거입니다. own 두 JVM의 직접 HTTP를 실제 AZ/HA/DR이나 자동 failover로 표시하지 않습니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "traffic-normal",
        "title": "정상 요청도 여러 계층을 지남",
        "lead": "DNS/LB/app/data의 역할을 분리합니다. literal ok는 외부 DB·node·region 상태 검사가 아닙니다.",
        "values": [
          [
            "분리할 계층",
            "DNS 정책 / LB target probe / app / data"
          ],
          [
            "literal /health",
            "외부 DB·node·region 진단 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.traffic-resilience"
        ],
        "code": "[\n  \"DNS 정책/health 설정, LB target probe, app 응답, DB 복제·세션·복구를 구분\",\n  \"복수 AZ 자체로 자동 무중단·일관성·재해복구를 인증하지 않음\",\n  \"literal ok의 /health는 외부 의존·노드·리전 상태 검사 아님\",\n  \"한 Mac의 두 own JVM은 두 VM/AZ나 자동 failover의 증거가 아님\"\n]",
        "active": [
          1,
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.traffic-resilience.boundaries",
        "codeKeys": null,
        "image": "D07-traffic"
      },
      {
        "id": "traffic-failure",
        "title": "복수 AZ만으로 자동복구는 아님",
        "lead": "복수 AZ는 앱·데이터 배치, 복제·세션·복구를 자동 인증하지 않습니다. 한 Mac의 두 JVM도 별도 AZ 증거가 아닙니다.",
        "values": [
          [
            "자동 보장하지 않는 것",
            "무중단·일관성·재해복구"
          ],
          [
            "한 Mac 두 own JVM",
            "VM/AZ·자동 failover 증거 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.traffic-resilience"
        ],
        "code": "[\n  \"DNS 정책/health 설정, LB target probe, app 응답, DB 복제·세션·복구를 구분\",\n  \"복수 AZ 자체로 자동 무중단·일관성·재해복구를 인증하지 않음\",\n  \"literal ok의 /health는 외부 의존·노드·리전 상태 검사 아님\",\n  \"한 Mac의 두 own JVM은 두 VM/AZ나 자동 failover의 증거가 아님\"\n]",
        "active": [
          2,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.traffic-resilience.boundaries",
        "codeKeys": null,
        "image": "D07-traffic"
      }
    ]
  },
  {
    "id": "managed",
    "question": "관리형 서비스에서 무엇을 맡기고 무엇을 정할까요?",
    "source": "미실행 service-responsibility / catalog 모델 JSON",
    "sourceNote": "상품별 책임·설정·실행 옵션을 구분합니다. provider의 서비스 제공과 고객의 생성 요청·구성·정책 설정은 같은 책임이 아니며 제품별 계약을 인증한 표도 아닙니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "managed-platform",
        "title": "플랫폼 서비스와 고객 정책을 구분",
        "lead": "provider가 플랫폼/scaling 서비스를 제공해도 고객은 app 배포·설정·접근·scaling 정책을 정합니다.",
        "values": [
          [
            "provider",
            "플랫폼 OS/runtime·scaling 서비스"
          ],
          [
            "customer",
            "app/data/access·구성·scaling 정책"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.service-responsibility"
        ],
        "code": "[\n  \"SaaS Applications Shared는 고객이 공급자의 제품 소스코드를 운영한다는 뜻이 아님\",\n  \"고객 설정·자체 확장 코드가 있으면 그 코드·사용자 접근·데이터와 공급자의 제품 운영을 구분\",\n  \"PaaS/SaaS의 플랫폼 OS/runtime 운영 위임과 고객 app/data/access 책임은 별개\",\n  \"EKS managed nodes/Fargate 같은 실행 옵션마다 worker OS·kernel 경계가 달라 일반화하지 않음\"\n]",
        "active": [
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.service-responsibility.boundaries",
        "codeKeys": null,
        "image": "D07-managed"
      },
      {
        "id": "managed-k8s",
        "title": "worker OS·kernel은 실행 옵션별로",
        "lead": "EKS managed nodes/Fargate 같은 옵션마다 worker OS/kernel 경계가 다릅니다. 관리형 control plane이라는 이름만으로 모든 patch/workload 책임이 없어지지 않습니다.",
        "values": [
          [
            "실행 옵션 경계",
            "managed nodes / Fargate 등 서비스별 확인"
          ],
          [
            "고객 영역",
            "workload·image·access·정책"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.service-responsibility"
        ],
        "code": "[\n  \"SaaS Applications Shared는 고객이 공급자의 제품 소스코드를 운영한다는 뜻이 아님\",\n  \"고객 설정·자체 확장 코드가 있으면 그 코드·사용자 접근·데이터와 공급자의 제품 운영을 구분\",\n  \"PaaS/SaaS의 플랫폼 OS/runtime 운영 위임과 고객 app/data/access 책임은 별개\",\n  \"EKS managed nodes/Fargate 같은 실행 옵션마다 worker OS·kernel 경계가 달라 일반화하지 않음\"\n]",
        "active": [
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.service-responsibility.boundaries",
        "codeKeys": null,
        "image": "D07-managed"
      },
      {
        "id": "managed-catalog",
        "title": "유사 기능 표는 완전 호환 표가 아님",
        "lead": "AWS/Azure/GCP 비교는 기능상 예시입니다. ECR은 image/artifact registry이지 app runtime이 아니며 scan 설정도 별도입니다.",
        "values": [
          [
            "기능 비교",
            "API·책임·SKU 완전 호환 보장 아님"
          ],
          [
            "ECR",
            "image/artifact registry · app runtime 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.catalog-storage-cost"
        ],
        "code": "[\n  \"AWS/Azure/GCP 비교는 유사 기능 예이며 API·책임·세부 SKU의 완전 호환 표가 아님\",\n  \"ECR은 image/artifact registry이며 app runtime이 아님; scan은 설정과 별도 검토가 필요\",\n  \"S3 key/prefix/delimiter의 logical folder와 OS directory를 구분\",\n  \"Azure HNS의 directory semantics/atomic operations를 모든 POSIX 동작 보장으로 확대하지 않음\",\n  \"on-prem 장비·전력·상면·회선·운영과 cloud compute/storage/request/log/backup/network를 비교\",\n  \"실제 rate/할인율/청구·절감액·성능 숫자를 만들지 않음\"\n]",
        "active": [
          1,
          2
        ],
        "codeKind": "model-json",
        "codePath": "models.catalog-storage-cost.boundaries",
        "codeKeys": null,
        "image": "D07-managed"
      }
    ]
  },
  {
    "id": "storage",
    "question": "object key와 directory 의미는 어디서 갈릴까요?",
    "source": "미실행 catalog-storage-cost 모델 + 공식 범위 보충",
    "sourceNote": "flat S3 설명은 general purpose bucket 예시로 한정합니다. directory bucket은 hierarchical namespace라 모든 S3를 flat이라고 하지 않습니다. prefix의 List API 검색·정책 조건 용도와 OS directory를 구분합니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "storage-key",
        "title": "general purpose bucket의 key/prefix",
        "lead": "general purpose bucket의 flat key 모델에서 prefix/delimiter를 논리적 계층·API listing에 사용합니다. prefix는 표시 장식만이 아니며 설정된 정책 조건에도 쓰일 수 있습니다.",
        "values": [
          [
            "예시 범위",
            "Amazon S3 general purpose bucket"
          ],
          [
            "key/prefix/delimiter",
            "logical hierarchy·List API 검색·정책 조건"
          ],
          [
            "directory bucket",
            "hierarchical namespace · 이 flat 예시와 별개"
          ],
          [
            "OS directory 의미",
            "그대로 동일하지 않음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.catalog-storage-cost"
        ],
        "code": "[\n  \"AWS/Azure/GCP 비교는 유사 기능 예이며 API·책임·세부 SKU의 완전 호환 표가 아님\",\n  \"ECR은 image/artifact registry이며 app runtime이 아님; scan은 설정과 별도 검토가 필요\",\n  \"S3 key/prefix/delimiter의 logical folder와 OS directory를 구분\",\n  \"Azure HNS의 directory semantics/atomic operations를 모든 POSIX 동작 보장으로 확대하지 않음\",\n  \"on-prem 장비·전력·상면·회선·운영과 cloud compute/storage/request/log/backup/network를 비교\",\n  \"실제 rate/할인율/청구·절감액·성능 숫자를 만들지 않음\"\n]",
        "active": [
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.catalog-storage-cost.boundaries",
        "codeKeys": null,
        "image": "D07-storage"
      },
      {
        "id": "storage-hns",
        "title": "Azure HNS도 모든 POSIX 보장은 아님",
        "lead": "HNS의 directory semantics/atomic directory operations를 구분합니다. 이를 모든 POSIX 동작의 보장으로 확대하지 않습니다.",
        "values": [
          [
            "HNS 범위",
            "directory semantics / atomic directory operations"
          ],
          [
            "모든 POSIX 동작 보장",
            "하지 않음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.catalog-storage-cost"
        ],
        "code": "[\n  \"AWS/Azure/GCP 비교는 유사 기능 예이며 API·책임·세부 SKU의 완전 호환 표가 아님\",\n  \"ECR은 image/artifact registry이며 app runtime이 아님; scan은 설정과 별도 검토가 필요\",\n  \"S3 key/prefix/delimiter의 logical folder와 OS directory를 구분\",\n  \"Azure HNS의 directory semantics/atomic operations를 모든 POSIX 동작 보장으로 확대하지 않음\",\n  \"on-prem 장비·전력·상면·회선·운영과 cloud compute/storage/request/log/backup/network를 비교\",\n  \"실제 rate/할인율/청구·절감액·성능 숫자를 만들지 않음\"\n]",
        "active": [
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.catalog-storage-cost.boundaries",
        "codeKeys": null,
        "image": "D07-storage"
      }
    ]
  },
  {
    "id": "cost",
    "question": "비용 비교에는 어떤 항목과 책임을 넣을까요?",
    "source": "미실행 비용 항목·구매 방식 모델 JSON",
    "sourceNote": "실제 rate·할인율·청구·절감액·성능은 측정하지 않았습니다. Usage×Rate는 사용기반 성분의 단순 예시이며 fixed/tiered/commitment·남은 팀 운영비를 포함한 TCO 공식이 아닙니다. 구매 옵션 자체는 autoscale 구현이 아닙니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "cost-onprem",
        "title": "장비 외 시설·운영 비용도 비교",
        "lead": "on-prem 항목은 장비·전력·상면·회선·운영을 포함합니다. 위치만으로 총비용을 결론내리지 않습니다.",
        "values": [
          [
            "on-prem 항목",
            "장비·감가·전력·상면·회선·운영"
          ],
          [
            "실제 비용·절감액",
            "미측정"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.catalog-storage-cost"
        ],
        "code": "[\n  \"AWS/Azure/GCP 비교는 유사 기능 예이며 API·책임·세부 SKU의 완전 호환 표가 아님\",\n  \"ECR은 image/artifact registry이며 app runtime이 아님; scan은 설정과 별도 검토가 필요\",\n  \"S3 key/prefix/delimiter의 logical folder와 OS directory를 구분\",\n  \"Azure HNS의 directory semantics/atomic operations를 모든 POSIX 동작 보장으로 확대하지 않음\",\n  \"on-prem 장비·전력·상면·회선·운영과 cloud compute/storage/request/log/backup/network를 비교\",\n  \"실제 rate/할인율/청구·절감액·성능 숫자를 만들지 않음\"\n]",
        "active": [
          5
        ],
        "codeKind": "model-json",
        "codePath": "models.catalog-storage-cost.boundaries",
        "codeKeys": null,
        "image": "D07-cost"
      },
      {
        "id": "cost-cloud",
        "title": "cloud 사용료와 남은 운영비도 포함",
        "lead": "compute/storage/request/log/backup/network와 고객 팀의 남은 운영비를 함께 봅니다. 단일 Usage×Rate 식을 전체 TCO로 제시하지 않습니다.",
        "values": [
          [
            "cloud 성분",
            "compute·storage·request·log·backup·network"
          ],
          [
            "추가 고려",
            "fixed/tiered/commitment·남은 팀 운영비"
          ],
          [
            "Usage×Rate",
            "사용기반 성분 단순 예시 · TCO 공식 아님"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.catalog-storage-cost"
        ],
        "code": "[\n  \"AWS/Azure/GCP 비교는 유사 기능 예이며 API·책임·세부 SKU의 완전 호환 표가 아님\",\n  \"ECR은 image/artifact registry이며 app runtime이 아님; scan은 설정과 별도 검토가 필요\",\n  \"S3 key/prefix/delimiter의 logical folder와 OS directory를 구분\",\n  \"Azure HNS의 directory semantics/atomic operations를 모든 POSIX 동작 보장으로 확대하지 않음\",\n  \"on-prem 장비·전력·상면·회선·운영과 cloud compute/storage/request/log/backup/network를 비교\",\n  \"실제 rate/할인율/청구·절감액·성능 숫자를 만들지 않음\"\n]",
        "active": [
          5,
          6
        ],
        "codeKind": "model-json",
        "codePath": "models.catalog-storage-cost.boundaries",
        "codeKeys": null,
        "image": "D07-cost"
      },
      {
        "id": "cost-buying",
        "title": "구매 옵션과 용량 조절은 다름",
        "lead": "On-demand·사용 commitment·회수 가능한 Spot은 유연성·중단 조건이 다릅니다. 할인율을 만들거나 구매만으로 autoscale이 된다고 하지 않습니다.",
        "values": [
          [
            "구매 방식",
            "On-demand / usage commitment / 회수 가능 Spot"
          ],
          [
            "구매 옵션 ≠ autoscale",
            "실행 수량·정책은 별도"
          ],
          [
            "실제 약정·가격·중단 실험",
            "미실행"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.migration-choice"
        ],
        "code": "[\n  \"Rehost·일부 platform 최적화·구조 변경의 범위를 구분\",\n  \"AWS의 대규모 migration guidance를 모든 조직의 필수 순서로 표시하지 않음\",\n  \"On-demand, 사용 commitment, 회수 가능한 Spot의 책임/유연성은 별도\",\n  \"모든 app을 Refactor하거나 cloud가 항상 저렴하다는 결론을 내리지 않음\"\n]",
        "active": [
          3
        ],
        "codeKind": "model-json",
        "codePath": "models.migration-choice.boundaries",
        "codeKeys": null,
        "image": "D07-cost"
      }
    ]
  },
  {
    "id": "migration",
    "question": "7R은 같은 이전을 일곱 번 하는 순서일까요?",
    "source": "미실행 AWS7R 선택 모델 JSON",
    "sourceNote": "AWS 대규모 migration guidance를 모든 조직의 필수 순서로 표시하지 않습니다. 실제 이전·약정·결제·중단 실험이 아니며 항상 cloud가 싸거나 Rehost가 최속/자동 운영 부담 감소라고 하지 않습니다.",
    "note": "강조는 실제 실행 줄이나 cloud 조작이 아니라 현재 읽는 코드·분류의 의미 위치입니다. 실측·미실행 모델·서비스별 조건을 구분합니다.",
    "stages": [
      {
        "id": "migration-keep",
        "title": "Retire·Retain도 선택지",
        "lead": "없애거나 유지할 대상을 평가하는 선택입니다. 모든 앱을 Refactor하거나 즉시 이전해야 한다는 뜻이 아닙니다.",
        "values": [
          [
            "선택",
            "Retire / Retain"
          ],
          [
            "필수 순서",
            "아님 · 수명·규제·의존성·위험 비교"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.migration-choice"
        ],
        "code": "[\n  \"Retire\",\n  \"Retain\",\n  \"Rehost\",\n  \"Relocate\",\n  \"Repurchase\",\n  \"Replatform\",\n  \"Refactor/re-architect\"\n]",
        "active": [
          1,
          2
        ],
        "codeKind": "model-json",
        "codePath": "models.migration-choice.strategies",
        "codeKeys": null,
        "image": "D07-migration"
      },
      {
        "id": "migration-move",
        "title": "Rehost·Relocate의 변경 범위를 구분",
        "lead": "Relocate는 같은 platform/app 구조를 보존한 환경·region·account 이전 범위로 읽습니다. OS/runtime 변경을 Relocate 예시로 넣지 않습니다.",
        "values": [
          [
            "Rehost",
            "이전 범위와 남는 운영 책임을 확인"
          ],
          [
            "Relocate",
            "같은 platform/app 구조 보존 · 환경/region/account 범위"
          ],
          [
            "OS/runtime 변경 예시",
            "Relocate로 섞지 않음"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.migration-choice"
        ],
        "code": "[\n  \"Retire\",\n  \"Retain\",\n  \"Rehost\",\n  \"Relocate\",\n  \"Repurchase\",\n  \"Replatform\",\n  \"Refactor/re-architect\"\n]",
        "active": [
          3,
          4
        ],
        "codeKind": "model-json",
        "codePath": "models.migration-choice.strategies",
        "codeKeys": null,
        "image": "D07-migration"
      },
      {
        "id": "migration-change",
        "title": "구매·플랫폼·구조 변경을 구분",
        "lead": "Repurchase·Replatform·Refactor/re-architect의 변경 범위를 나눕니다. 선택마다 실제 검증과 운영 책임 판단이 필요합니다.",
        "values": [
          [
            "선택",
            "Repurchase / Replatform / Refactor/re-architect"
          ],
          [
            "범위 구분",
            "제품 구매 전환 / 플랫폼 변경 / 구조 변경"
          ]
        ],
        "checks": [],
        "runKeys": [
          "models.migration-choice"
        ],
        "code": "[\n  \"Retire\",\n  \"Retain\",\n  \"Rehost\",\n  \"Relocate\",\n  \"Repurchase\",\n  \"Replatform\",\n  \"Refactor/re-architect\"\n]",
        "active": [
          5,
          6,
          7
        ],
        "codeKind": "model-json",
        "codePath": "models.migration-choice.strategies",
        "codeKeys": null,
        "image": "D07-migration"
      }
    ]
  }
];
export const d07Run = path => path.split('.').reduce((value, key) => value?.[key], D07_RUNS);
