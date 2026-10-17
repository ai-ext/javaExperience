# javaExperience 전수 검증 진행표

재계산: 2026-10-17 05:16 UTC · 현재 작업 트리 기준

체크의 뜻을 분리한다. HTML·링크 빌드가 지나도 실제 화면, 모바일, 조작, 기술 계약, 학습자 이해는 별도 검증이다. 상태 파일의 이전 캡처는 현재 HTML의 증거로 자동 승격하지 않는다.

- 페이지: 339쪽 · 일부 장면 적용 43쪽 · 의미 장면 미분할 296쪽 · 전체 검증 완료 0쪽
- 시안 기록: 430건 · 데스크톱 현재 증거 0건 / 이전 캡처 48건 / 없음 382건
- 모바일 현재 증거 0건 / 이전 캡처 48건 / 없음 382건
- 이전 캡처 중 시안과 데스크톱 크기가 같은 파일 43건, 너비 360px 모바일 파일 47건. 둘 다 현재 HTML보다 이전 자료다.
- 실제 브라우저 클릭·키보드·360px 넘침·API/DB 실행 결과·학습자 이해: 현재 전수 완료 증거 없음

- HTML 구조 감사: 339쪽 검사 · 중복 ID 0건 · 깨진 ARIA 참조 0건 · 깨진 페이지 내 앵커 0건

- 사이트의 범위별 정적 검사: 39/39개 통과. 이 수치는 브라우저·모바일 검증 수가 아님.

- 개별 테스트와 파일 경로가 연결된 페이지 46쪽. 참조된 테스트가 통과해도 해당 페이지의 모든 상태가 검증된 것은 아님.

- 101단계 첫 과제 카드: 원문 경로·파일·근거 줄 정적 대조 101/101건. 실제 구현과 학습자 이해 검증은 별개.

- [현재 실습 서버 실행 확인](RUNTIME-CHECK-2026-10-16.md): compileJava 통과, 테스트 1개 통과, GET /hello 200, GET /api/lists 500. 다른 시나리오의 기대 응답을 현재 서버 실측으로 취급하지 않음.

## 검증 게이트

1. 에이전트: 원문·코드·요청/DB 계약을 화면의 모든 상태와 비교한다.
2. 에이전트: 현재 HTML을 데스크톱과 360px에서 렌더·캡처해 시안과 줄바꿈·배치·재질·대비를 비교한다.
3. 에이전트: 장면 이동, 요청 버튼, 복사, 토글, 키보드 포커스와 콘솔 오류를 확인한다.
4. 에이전트: 실행 가능한 실습은 실제 Spring Boot/API/DB의 응답·행·로그를 예상값과 구분해 확인한다.
5. 사용자: 위 검사가 끝난 화면을 보고 이해 용이성, 표현의 정교함, 학습 순서와 난도를 판단한다. 사용자 의견 전에는 학습자 검증 완료로 표시하지 않는다.

## 페이지별 현재 상태

| 종류 | 페이지 | 적용 | 시안 기록 | 관련 정적 검사 | HTML 구조 | 현재 데스크톱 | 현재 360px | 조작·실행 | 사용자 검토 | 에이전트 다음 일 |
|---|---|---|---:|---|---|---|---|---|---|---|
| navigation-or-reference | [README.md](../../README.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/B01-account-lifecycle.md](../../docs/knowledge/B01-account-lifecycle.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D01-dev-lifecycle-overview.md](../../docs/knowledge/D01-dev-lifecycle-overview.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D02-server-network-basics.md](../../docs/knowledge/D02-server-network-basics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D03-rest-api-dev-process.md](../../docs/knowledge/D03-rest-api-dev-process.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D04-build-pipeline-explained.md](../../docs/knowledge/D04-build-pipeline-explained.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D05-debugging-methodology.md](../../docs/knowledge/D05-debugging-methodology.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D06-deployment-concepts.md](../../docs/knowledge/D06-deployment-concepts.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D07-onprem-vs-cloud.md](../../docs/knowledge/D07-onprem-vs-cloud.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D08-cicd-collaboration.md](../../docs/knowledge/D08-cicd-collaboration.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D09-operations-observability.md](../../docs/knowledge/D09-operations-observability.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D10-database-basics.md](../../docs/knowledge/D10-database-basics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D11-web-security-basics.md](../../docs/knowledge/D11-web-security-basics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D12-linux-terminal-basics.md](../../docs/knowledge/D12-linux-terminal-basics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D13-backend-glossary.md](../../docs/knowledge/D13-backend-glossary.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D14-os-basics-backend.md](../../docs/knowledge/D14-os-basics-backend.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/D15-server-sizing.md](../../docs/knowledge/D15-server-sizing.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J01-types-string.md](../../docs/knowledge/J01-types-string.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J02-oop-object-contracts.md](../../docs/knowledge/J02-oop-object-contracts.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J03-generics.md](../../docs/knowledge/J03-generics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J04-exceptions.md](../../docs/knowledge/J04-exceptions.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J05-modern-syntax.md](../../docs/knowledge/J05-modern-syntax.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J06-enum-annotation-reflection.md](../../docs/knowledge/J06-enum-annotation-reflection.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J07-collections-internals.md](../../docs/knowledge/J07-collections-internals.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J08-lambda-functional.md](../../docs/knowledge/J08-lambda-functional.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J09-stream-api.md](../../docs/knowledge/J09-stream-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J10-jmm-threads.md](../../docs/knowledge/J10-jmm-threads.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J11-juc.md](../../docs/knowledge/J11-juc.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J12-virtual-threads.md](../../docs/knowledge/J12-virtual-threads.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J13-jvm-classloading.md](../../docs/knowledge/J13-jvm-classloading.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J14-memory-gc.md](../../docs/knowledge/J14-memory-gc.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J15-jit-profiling.md](../../docs/knowledge/J15-jit-profiling.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J16-jvm-in-containers.md](../../docs/knowledge/J16-jvm-in-containers.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J17-versions-roadmap.md](../../docs/knowledge/J17-versions-roadmap.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J19-testing-junit.md](../../docs/knowledge/J19-testing-junit.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J20-io-nio-jdbc.md](../../docs/knowledge/J20-io-nio-jdbc.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J21-design-patterns-solid.md](../../docs/knowledge/J21-design-patterns-solid.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J22-coding-test-algorithms.md](../../docs/knowledge/J22-coding-test-algorithms.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J23-tree-traversal.md](../../docs/knowledge/J23-tree-traversal.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J24-compiled-vs-interpreted.md](../../docs/knowledge/J24-compiled-vs-interpreted.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/J25-data-structures-map.md](../../docs/knowledge/J25-data-structures-map.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P01-spring-vs-boot.md](../../docs/knowledge/P01-spring-vs-boot.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P02-mvc-layered-architecture.md](../../docs/knowledge/P02-mvc-layered-architecture.html) | 부분 | 28 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/P03-annotations-cheatsheet.md](../../docs/knowledge/P03-annotations-cheatsheet.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P04-constructors-builder.md](../../docs/knowledge/P04-constructors-builder.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P05-jar-war-packaging.md](../../docs/knowledge/P05-jar-war-packaging.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P06-first-crud-api.md](../../docs/knowledge/P06-first-crud-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P07-boot-dev-essentials.md](../../docs/knowledge/P07-boot-dev-essentials.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P08-maven-gradle-practical.md](../../docs/knowledge/P08-maven-gradle-practical.html) | 부분 | 6 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/P09-java-syntax-basics.md](../../docs/knowledge/P09-java-syntax-basics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P10-data-structures-usage.md](../../docs/knowledge/P10-data-structures-usage.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P11-bean-registration-di.md](../../docs/knowledge/P11-bean-registration-di.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P12-why-beans-ioc-intro.md](../../docs/knowledge/P12-why-beans-ioc-intro.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P13-git-practical.md](../../docs/knowledge/P13-git-practical.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P14-docker-compose-local.md](../../docs/knowledge/P14-docker-compose-local.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P15-intellij-practical.md](../../docs/knowledge/P15-intellij-practical.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P16-json-jackson-practical.md](../../docs/knowledge/P16-json-jackson-practical.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P17-file-upload-storage.md](../../docs/knowledge/P17-file-upload-storage.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P18-concurrency-inventory.md](../../docs/knowledge/P18-concurrency-inventory.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P19-mysql-jpa-setup.md](../../docs/knowledge/P19-mysql-jpa-setup.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P20-jpa-entity-mapping.md](../../docs/knowledge/P20-jpa-entity-mapping.html) | 미분할 | 0 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P21-querydsl-setup.md](../../docs/knowledge/P21-querydsl-setup.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P22-multiple-datasources.md](../../docs/knowledge/P22-multiple-datasources.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P23-redis-practical.md](../../docs/knowledge/P23-redis-practical.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P24-kafka-practical.md](../../docs/knowledge/P24-kafka-practical.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P25-external-api-client.md](../../docs/knowledge/P25-external-api-client.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P26-mail-notification.md](../../docs/knowledge/P26-mail-notification.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P27-annotations-when-how.md](../../docs/knowledge/P27-annotations-when-how.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P28-default-beans.md](../../docs/knowledge/P28-default-beans.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P29-static-complete.md](../../docs/knowledge/P29-static-complete.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P30-scheduling-practical.md](../../docs/knowledge/P30-scheduling-practical.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/P31-stream-patterns.md](../../docs/knowledge/P31-stream-patterns.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R01-what-is-db-server.md](../../docs/knowledge/R01-what-is-db-server.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R02-rdb-vs-nosql.md](../../docs/knowledge/R02-rdb-vs-nosql.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R03-schema-types-constraints.md](../../docs/knowledge/R03-schema-types-constraints.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R04-sql-crud-join.md](../../docs/knowledge/R04-sql-crud-join.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R05-index-btree.md](../../docs/knowledge/R05-index-btree.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R06-db-client-tools.md](../../docs/knowledge/R06-db-client-tools.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R07-backup-restore.md](../../docs/knowledge/R07-backup-restore.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/R08-app-to-db-connection.md](../../docs/knowledge/R08-app-to-db-connection.html) | 부분 | 2 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| navigation-or-reference | [docs/knowledge/README.md](../../docs/knowledge/README.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S01-ioc-di.md](../../docs/knowledge/S01-ioc-di.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S02-aop-proxy.md](../../docs/knowledge/S02-aop-proxy.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S03-boot-autoconfig.md](../../docs/knowledge/S03-boot-autoconfig.html) | 부분 | 2 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/S04-config-profiles.md](../../docs/knowledge/S04-config-profiles.html) | 부분 | 8 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/S05-mvc-request-flow.md](../../docs/knowledge/S05-mvc-request-flow.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S06-rest-api-clients.md](../../docs/knowledge/S06-rest-api-clients.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S07-webflux-vs-vt.md](../../docs/knowledge/S07-webflux-vs-vt.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S08-transactions.md](../../docs/knowledge/S08-transactions.html) | 부분 | 3 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/S09-jpa-hibernate.md](../../docs/knowledge/S09-jpa-hibernate.html) | 부분 | 6 | 2 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/S10-spring-data-query.md](../../docs/knowledge/S10-spring-data-query.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S11-cache-redis-migration.md](../../docs/knowledge/S11-cache-redis-migration.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S12-security-architecture.md](../../docs/knowledge/S12-security-architecture.html) | 부분 | 1 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/S13-jwt-oauth2.md](../../docs/knowledge/S13-jwt-oauth2.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S14-messaging.md](../../docs/knowledge/S14-messaging.html) | 부분 | 2 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/S15-async-scheduling-batch.md](../../docs/knowledge/S15-async-scheduling-batch.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S16-actuator-observability.md](../../docs/knowledge/S16-actuator-observability.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S17-performance-tuning.md](../../docs/knowledge/S17-performance-tuning.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S18-spring-testing.md](../../docs/knowledge/S18-spring-testing.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S19-packaging-deploy.md](../../docs/knowledge/S19-packaging-deploy.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S20-spring-cloud-msa.md](../../docs/knowledge/S20-spring-cloud-msa.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S21-boot4-migration.md](../../docs/knowledge/S21-boot4-migration.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S22-architecture-ddd.md](../../docs/knowledge/S22-architecture-ddd.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/S23-openapi-swagger.md](../../docs/knowledge/S23-openapi-swagger.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/V01-what-and-how-to-test.md](../../docs/knowledge/V01-what-and-how-to-test.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/V02-layered-tests-handson.md](../../docs/knowledge/V02-layered-tests-handson.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/V03-mocking-in-practice.md](../../docs/knowledge/V03-mocking-in-practice.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/V04-test-db-strategy.md](../../docs/knowledge/V04-test-db-strategy.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/V05-testing-tricky-things.md](../../docs/knowledge/V05-testing-tricky-things.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/V06-testing-at-work.md](../../docs/knowledge/V06-testing-at-work.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W01-api-dev-order.md](../../docs/knowledge/W01-api-dev-order.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W02-why-layers.md](../../docs/knowledge/W02-why-layers.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W03-db-access-comparison.md](../../docs/knowledge/W03-db-access-comparison.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W04-mybatis-xml-practical.md](../../docs/knowledge/W04-mybatis-xml-practical.html) | 부분 | 2 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/W05-jpa-vs-mybatis-strategy.md](../../docs/knowledge/W05-jpa-vs-mybatis-strategy.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W06-why-server-debugging.md](../../docs/knowledge/W06-why-server-debugging.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W07-why-logger.md](../../docs/knowledge/W07-why-logger.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W08-where-to-handle-exceptions.md](../../docs/knowledge/W08-where-to-handle-exceptions.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W09-why-dto.md](../../docs/knowledge/W09-why-dto.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W10-where-to-validate.md](../../docs/knowledge/W10-where-to-validate.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W11-why-tx-in-service.md](../../docs/knowledge/W11-why-tx-in-service.html) | 부분 | 2 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/W12-why-interfaces.md](../../docs/knowledge/W12-why-interfaces.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W13-frontend-backend-boundary.md](../../docs/knowledge/W13-frontend-backend-boundary.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W14-sync-async-blocking.md](../../docs/knowledge/W14-sync-async-blocking.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W15-paging-offset-vs-cursor.md](../../docs/knowledge/W15-paging-offset-vs-cursor.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W16-id-generation.md](../../docs/knowledge/W16-id-generation.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W17-where-to-cache.md](../../docs/knowledge/W17-where-to-cache.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W18-rest-graphql-grpc.md](../../docs/knowledge/W18-rest-graphql-grpc.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W19-lombok-or-not.md](../../docs/knowledge/W19-lombok-or-not.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W20-time-timezone.md](../../docs/knowledge/W20-time-timezone.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W21-null-handling.md](../../docs/knowledge/W21-null-handling.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W22-works-locally-not-on-server.md](../../docs/knowledge/W22-works-locally-not-on-server.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W23-cache-and-in-memory.md](../../docs/knowledge/W23-cache-and-in-memory.html) | 부분 | 3 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 |
| knowledge | [docs/knowledge/W24-why-database.md](../../docs/knowledge/W24-why-database.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W25-spring-multithreading.md](../../docs/knowledge/W25-spring-multithreading.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| knowledge | [docs/knowledge/W26-naming-conventions.md](../../docs/knowledge/W26-naming-conventions.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| navigation-or-reference | [errors.md](../../errors.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/A0-first-api.md](../../lessons/A0-first-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/A1-client-server-http.md](../../lessons/A1-client-server-http.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/A2-http-anatomy.md](../../lessons/A2-http-anatomy.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/A3-server-process-port.md](../../lessons/A3-server-process-port.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/A4-what-spring-boot-does.md](../../lessons/A4-what-spring-boot-does.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/A5-rest-api-design.md](../../lessons/A5-rest-api-design.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B1-types-variables-methods.md](../../lessons/B1-types-variables-methods.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B2-classes-objects-constructors.md](../../lessons/B2-classes-objects-constructors.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B3-static-and-inner-classes.md](../../lessons/B3-static-and-inner-classes.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B4-record-getter-immutable.md](../../lessons/B4-record-getter-immutable.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B5-interfaces.md](../../lessons/B5-interfaces.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B6-collections-optional-lambda.md](../../lessons/B6-collections-optional-lambda.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B7-exceptions.md](../../lessons/B7-exceptions.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/B8-annotations.md](../../lessons/B8-annotations.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/C1-intellij-run-debug.md](../../lessons/C1-intellij-run-debug.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/C2-gradle-dependencies.md](../../lessons/C2-gradle-dependencies.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/C3-application-yml-profiles.md](../../lessons/C3-application-yml-profiles.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/C4-logs-and-stack-traces.md](../../lessons/C4-logs-and-stack-traces.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/D1-json-jackson.md](../../lessons/D1-json-jackson.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E1-why-layers.md](../../lessons/E1-why-layers.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E2-db-sql-basics.md](../../lessons/E2-db-sql-basics.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E3-what-is-jpa.md](../../lessons/E3-what-is-jpa.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E4-jpa-associations.md](../../lessons/E4-jpa-associations.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E5-mybatis-first-steps.md](../../lessons/E5-mybatis-first-steps.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E6-repository-methods.md](../../lessons/E6-repository-methods.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/E7-jpa-update-delete.md](../../lessons/E7-jpa-update-delete.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F1-validation-errors.md](../../lessons/F1-validation-errors.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F2-auth-token.md](../../lessons/F2-auth-token.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F3-cors.md](../../lessons/F3-cors.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F4-password-storage.md](../../lessons/F4-password-storage.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F5-jwt-anatomy.md](../../lessons/F5-jwt-anatomy.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F6-validation-in-practice.md](../../lessons/F6-validation-in-practice.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F7-roles-and-ownership.md](../../lessons/F7-roles-and-ownership.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/F8-rate-limiting.md](../../lessons/F8-rate-limiting.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/G1-paging-and-sorting.md](../../lessons/G1-paging-and-sorting.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/G2-access-rules-in-one-place.md](../../lessons/G2-access-rules-in-one-place.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/G3-first-transaction.md](../../lessons/G3-first-transaction.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/G4-transaction-in-practice.md](../../lessons/G4-transaction-in-practice.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H1-concurrency-taste.md](../../lessons/H1-concurrency-taste.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H2-file-upload-download.md](../../lessons/H2-file-upload-download.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H3-scheduling.md](../../lessons/H3-scheduling.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H4-bulk-processing.md](../../lessons/H4-bulk-processing.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H5-spring-events.md](../../lessons/H5-spring-events.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H6-async-thread-pool.md](../../lessons/H6-async-thread-pool.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H7-cache-cacheable-evict.md](../../lessons/H7-cache-cacheable-evict.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H8-rest-client-timeout.md](../../lessons/H8-rest-client-timeout.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/H9-csv-and-time.md](../../lessons/H9-csv-and-time.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/I1-why-tests.md](../../lessons/I1-why-tests.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/J1-reading-explain.md](../../lessons/J1-reading-explain.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lesson | [lessons/J2-why-migrations.md](../../lessons/J2-why-migrations.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| navigation-or-reference | [practice/MISSIONS.md](../../practice/MISSIONS.html) | 미분할 | 0 | 2 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| navigation-or-reference | [scenario/README.md](../../scenario/README.html) | 미분할 | 0 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch0-first-steps/0-1-ts-to-java.md](../../scenario/ch0-first-steps/0-1-ts-to-java.html) | 부분 | 20 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch0-first-steps/0-2-annotations.md](../../scenario/ch0-first-steps/0-2-annotations.html) | 부분 | 16 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch0-first-steps/0-3-request-four-places.md](../../scenario/ch0-first-steps/0-3-request-four-places.html) | 부분 | 21 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch0-first-steps/0-4-dto-rules.md](../../scenario/ch0-first-steps/0-4-dto-rules.html) | 부분 | 20 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch0-first-steps/0-5-read-stack-trace.md](../../scenario/ch0-first-steps/0-5-read-stack-trace.html) | 부분 | 18 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch0-first-steps/0-6-gradle-and-yml.md](../../scenario/ch0-first-steps/0-6-gradle-and-yml.html) | 부분 | 7 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch0-first-steps/0-7-lombok-dto.md](../../scenario/ch0-first-steps/0-7-lombok-dto.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch0-first-steps/0-8-java-types-and-methods.md](../../scenario/ch0-first-steps/0-8-java-types-and-methods.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch1-create-post/1-1-receive-request.md](../../scenario/ch1-create-post/1-1-receive-request.html) | 부분 | 16 | 2 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch1-create-post/1-2-dto-response.md](../../scenario/ch1-create-post/1-2-dto-response.html) | 부분 | 5 | 2 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch1-create-post/1-3-service-layer.md](../../scenario/ch1-create-post/1-3-service-layer.html) | 부분 | 8 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch1-create-post/1-4-save-to-db.md](../../scenario/ch1-create-post/1-4-save-to-db.html) | 부분 | 12 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch1-create-post/1-5-validation.md](../../scenario/ch1-create-post/1-5-validation.html) | 부분 | 12 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch1-create-post/1-6-token-auth.md](../../scenario/ch1-create-post/1-6-token-auth.html) | 부분 | 10 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch1-create-post/1-7-direct-db-dml.md](../../scenario/ch1-create-post/1-7-direct-db-dml.html) | 미분할 | 0 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch1-create-post/1-8-copy-post.md](../../scenario/ch1-create-post/1-8-copy-post.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch1-create-post/1-9-list-post-tags.md](../../scenario/ch1-create-post/1-9-list-post-tags.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-1-new-project.md](../../scenario/ch10-project/10-1-new-project.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-10-like-toggle.md](../../scenario/ch10-project/10-10-like-toggle.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-11-idempotent-like.md](../../scenario/ch10-project/10-11-idempotent-like.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-12-jpa-mybatis-flush.md](../../scenario/ch10-project/10-12-jpa-mybatis-flush.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-2-common-response.md](../../scenario/ch10-project/10-2-common-response.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-3-signup.md](../../scenario/ch10-project/10-3-signup.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-4-login-jwt.md](../../scenario/ch10-project/10-4-login-jwt.html) | 부분 | 16 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch10-project/10-5-create-post.md](../../scenario/ch10-project/10-5-create-post.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-6-post-detail.md](../../scenario/ch10-project/10-6-post-detail.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-7-post-list.md](../../scenario/ch10-project/10-7-post-list.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-8-update-delete.md](../../scenario/ch10-project/10-8-update-delete.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch10-project/10-9-comments.md](../../scenario/ch10-project/10-9-comments.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch11-post-advanced/11-1-draft-publish.md](../../scenario/ch11-post-advanced/11-1-draft-publish.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch11-post-advanced/11-2-image-upload.md](../../scenario/ch11-post-advanced/11-2-image-upload.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch11-post-advanced/11-3-view-count.md](../../scenario/ch11-post-advanced/11-3-view-count.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch11-post-advanced/11-4-search.md](../../scenario/ch11-post-advanced/11-4-search.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch11-post-advanced/11-5-trash-restore.md](../../scenario/ch11-post-advanced/11-5-trash-restore.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch11-post-advanced/11-6-revisions.md](../../scenario/ch11-post-advanced/11-6-revisions.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch12-community-features/12-1-comment-edit.md](../../scenario/ch12-community-features/12-1-comment-edit.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch12-community-features/12-2-mention-notification.md](../../scenario/ch12-community-features/12-2-mention-notification.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch12-community-features/12-3-notification-inbox.md](../../scenario/ch12-community-features/12-3-notification-inbox.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch12-community-features/12-4-follow.md](../../scenario/ch12-community-features/12-4-follow.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch12-community-features/12-5-feed-mute.md](../../scenario/ch12-community-features/12-5-feed-mute.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch12-community-features/12-6-report.md](../../scenario/ch12-community-features/12-6-report.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-1-roles-and-hide.md](../../scenario/ch13-operations/13-1-roles-and-hide.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-2-report-handling.md](../../scenario/ch13-operations/13-2-report-handling.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-3-member-suspension.md](../../scenario/ch13-operations/13-3-member-suspension.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-4-banned-words.md](../../scenario/ch13-operations/13-4-banned-words.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-5-rate-limit.md](../../scenario/ch13-operations/13-5-rate-limit.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-6-csv-export.md](../../scenario/ch13-operations/13-6-csv-export.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch13-operations/13-7-api-docs.md](../../scenario/ch13-operations/13-7-api-docs.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-1-reactions.md](../../scenario/ch14-more-with-posts/14-1-reactions.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-2-polls.md](../../scenario/ch14-more-with-posts/14-2-polls.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-3-pinned-posts.md](../../scenario/ch14-more-with-posts/14-3-pinned-posts.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-4-series.md](../../scenario/ch14-more-with-posts/14-4-series.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-5-recent-views.md](../../scenario/ch14-more-with-posts/14-5-recent-views.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-6-related-posts.md](../../scenario/ch14-more-with-posts/14-6-related-posts.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-7-monthly-archive.md](../../scenario/ch14-more-with-posts/14-7-monthly-archive.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch14-more-with-posts/14-8-shared-folder.md](../../scenario/ch14-more-with-posts/14-8-shared-folder.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch15-scheduling-batch/15-1-hall-of-fame.md](../../scenario/ch15-scheduling-batch/15-1-hall-of-fame.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch15-scheduling-batch/15-2-weekly-ranking-snapshot.md](../../scenario/ch15-scheduling-batch/15-2-weekly-ranking-snapshot.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch15-scheduling-batch/15-3-scheduled-publish.md](../../scenario/ch15-scheduling-batch/15-3-scheduled-publish.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch15-scheduling-batch/15-4-trash-purge.md](../../scenario/ch15-scheduling-batch/15-4-trash-purge.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch15-scheduling-batch/15-5-like-milestone.md](../../scenario/ch15-scheduling-batch/15-5-like-milestone.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch15-scheduling-batch/15-6-job-runs-retry.md](../../scenario/ch15-scheduling-batch/15-6-job-runs-retry.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch16-events-async-cache/16-1-new-post-event.md](../../scenario/ch16-events-async-cache/16-1-new-post-event.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch16-events-async-cache/16-2-async-notification.md](../../scenario/ch16-events-async-cache/16-2-async-notification.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch16-events-async-cache/16-3-popular-cache.md](../../scenario/ch16-events-async-cache/16-3-popular-cache.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch16-events-async-cache/16-4-link-preview.md](../../scenario/ch16-events-async-cache/16-4-link-preview.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch2-read-post/2-1-get-one.md](../../scenario/ch2-read-post/2-1-get-one.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch2-read-post/2-2-board-list.md](../../scenario/ch2-read-post/2-2-board-list.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch2-read-post/2-3-visibility.md](../../scenario/ch2-read-post/2-3-visibility.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch2-read-post/2-4-n-plus-1.md](../../scenario/ch2-read-post/2-4-n-plus-1.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch2-read-post/2-5-guided-jpa-query.md](../../scenario/ch2-read-post/2-5-guided-jpa-query.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch3-update-delete/3-0-put-replace.md](../../scenario/ch3-update-delete/3-0-put-replace.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch3-update-delete/3-1-patch.md](../../scenario/ch3-update-delete/3-1-patch.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch3-update-delete/3-2-soft-delete.md](../../scenario/ch3-update-delete/3-2-soft-delete.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch4-like/4-0-set-like.md](../../scenario/ch4-like/4-0-set-like.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch4-like/4-1-like-toggle.md](../../scenario/ch4-like/4-1-like-toggle.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch4-like/4-2-like-concurrency.md](../../scenario/ch4-like/4-2-like-concurrency.html) | 부분 | 2 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| scenario | [scenario/ch4-like/4-3-my-likes.md](../../scenario/ch4-like/4-3-my-likes.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch5-comment/5-0-comment-list.md](../../scenario/ch5-comment/5-0-comment-list.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch5-comment/5-1-create-comment.md](../../scenario/ch5-comment/5-1-create-comment.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch5-comment/5-2-reply.md](../../scenario/ch5-comment/5-2-reply.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch5-comment/5-3-comment-list-delete.md](../../scenario/ch5-comment/5-3-comment-list-delete.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch6-bookmark/6-0-set-bookmark.md](../../scenario/ch6-bookmark/6-0-set-bookmark.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch6-bookmark/6-1-bookmark.md](../../scenario/ch6-bookmark/6-1-bookmark.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch6-bookmark/6-2-folders.md](../../scenario/ch6-bookmark/6-2-folders.html) | 미분할 | 0 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch6-bookmark/6-3-my-bookmarks.md](../../scenario/ch6-bookmark/6-3-my-bookmarks.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch6-bookmark/6-4-patch-bookmark-memo.md](../../scenario/ch6-bookmark/6-4-patch-bookmark-memo.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch6-bookmark/6-5-my-marked-posts.md](../../scenario/ch6-bookmark/6-5-my-marked-posts.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch7-tests/7-1-controller-slice.md](../../scenario/ch7-tests/7-1-controller-slice.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch7-tests/7-2-service-unit.md](../../scenario/ch7-tests/7-2-service-unit.html) | 미분할 | 0 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch7-tests/7-3-integration.md](../../scenario/ch7-tests/7-3-integration.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch8-query-deep/8-1-activity-summary.md](../../scenario/ch8-query-deep/8-1-activity-summary.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch8-query-deep/8-2-popular-ranking.md](../../scenario/ch8-query-deep/8-2-popular-ranking.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch8-query-deep/8-3-relations.md](../../scenario/ch8-query-deep/8-3-relations.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch8-query-deep/8-4-dynamic-search.md](../../scenario/ch8-query-deep/8-4-dynamic-search.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch8-query-deep/8-5-recount-batch.md](../../scenario/ch8-query-deep/8-5-recount-batch.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch9-schema-change/9-1-flyway.md](../../scenario/ch9-schema-change/9-1-flyway.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch9-schema-change/9-2-index-explain.md](../../scenario/ch9-schema-change/9-2-index-explain.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch9-schema-change/9-3-add-column-backfill.md](../../scenario/ch9-schema-change/9-3-add-column-backfill.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch9-schema-change/9-4-notifications.md](../../scenario/ch9-schema-change/9-4-notifications.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| scenario | [scenario/ch9-schema-change/9-5-expand-contract.md](../../scenario/ch9-schema-change/9-5-expand-contract.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| db-query-journey | [scenario/db-query-journey/DB-07-same-api-five-query-styles.md](../../scenario/db-query-journey/DB-07-same-api-five-query-styles.html) | 부분 | 13 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/DB-08-explain-hypothesis.md](../../scenario/db-query-journey/DB-08-explain-hypothesis.html) | 부분 | 8 | 2 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/DB-09-explain-analyze.md](../../scenario/db-query-journey/DB-09-explain-analyze.html) | 부분 | 7 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/DB-10-performance-fixture.md](../../scenario/db-query-journey/DB-10-performance-fixture.html) | 부분 | 8 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/DB-11-index-lifecycle.md](../../scenario/db-query-journey/DB-11-index-lifecycle.html) | 부분 | 8 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-01-response-to-query.md](../../scenario/db-query-journey/db-01-response-to-query.html) | 부분 | 6 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-02-select-cursor.md](../../scenario/db-query-journey/db-02-select-cursor.html) | 부분 | 5 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-03-detail-join.md](../../scenario/db-query-journey/db-03-detail-join.html) | 부분 | 5 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-04-tag-filter-and-exists.md](../../scenario/db-query-journey/db-04-tag-filter-and-exists.html) | 부분 | 7 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-05-aggregate-fanout.md](../../scenario/db-query-journey/db-05-aggregate-fanout.html) | 부분 | 9 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-06-exists-not-exists.md](../../scenario/db-query-journey/db-06-exists-not-exists.html) | 부분 | 10 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-12-join-exists-explain.md](../../scenario/db-query-journey/db-12-join-exists-explain.html) | 부분 | 12 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-13-list-api-n-plus-one.md](../../scenario/db-query-journey/db-13-list-api-n-plus-one.html) | 부분 | 12 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| db-query-journey | [scenario/db-query-journey/db-14-live-schema-to-slow-query.md](../../scenario/db-query-journey/db-14-live-schema-to-slow-query.html) | 부분 | 16 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| lab | [scenario/labs/l12-query-methods/README.md](../../scenario/labs/l12-query-methods/README.html) | 부분 | 16 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| lab | [scenario/labs/l13-declared-queries/README.md](../../scenario/labs/l13-declared-queries/README.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lab | [scenario/labs/l14-querydsl-extension/README.md](../../scenario/labs/l14-querydsl-extension/README.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| lab | [scenario/labs/l15-session-auth/README.md](../../scenario/labs/l15-session-auth/README.html) | 부분 | 13 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| lab | [scenario/labs/l16-interface-implementations/README.md](../../scenario/labs/l16-interface-implementations/README.html) | 부분 | 16 | 1 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교 → 실제 Spring/DB 결과 대조 |
| ticket | [tickets/001-board-list-api.md](../../tickets/001-board-list-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/002-post-edited-flag.md](../../tickets/002-post-edited-flag.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/003-board-list-sort.md](../../tickets/003-board-list-sort.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/004-huge-page-number.md](../../tickets/004-huge-page-number.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/005-change-nickname.md](../../tickets/005-change-nickname.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/006-normalize-tags.md](../../tickets/006-normalize-tags.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/007-post-thumbnail.md](../../tickets/007-post-thumbnail.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/008-notification-post-title.md](../../tickets/008-notification-post-title.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/009-null-tag-500.md](../../tickets/009-null-tag-500.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/010-tag-stats-api.md](../../tickets/010-tag-stats-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/011-member-profile-api.md](../../tickets/011-member-profile-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/012-following-feed-api.md](../../tickets/012-following-feed-api.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/013-admin-hide-post.md](../../tickets/013-admin-hide-post.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/014-list-liked-bookmarked-by-me.md](../../tickets/014-list-liked-bookmarked-by-me.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/015-comment-delete-permission.md](../../tickets/015-comment-delete-permission.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/016-notification-skip-deleted.md](../../tickets/016-notification-skip-deleted.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/017-view-count-lost-update.md](../../tickets/017-view-count-lost-update.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/018-new-tag-race-500.md](../../tickets/018-new-tag-race-500.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/019-comment-list-block-n-plus-1.md](../../tickets/019-comment-list-block-n-plus-1.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/020-popular-range-index.md](../../tickets/020-popular-range-index.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/021-last-commented-at.md](../../tickets/021-last-commented-at.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/022-error-code-refactor.md](../../tickets/022-error-code-refactor.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/023-comment-deadlock.md](../../tickets/023-comment-deadlock.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/024-like-burst-pool-exhaustion.md](../../tickets/024-like-burst-pool-exhaustion.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/025-post-edit-conflict.md](../../tickets/025-post-edit-conflict.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/026-idempotency-key.md](../../tickets/026-idempotency-key.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/027-board-list-cursor.md](../../tickets/027-board-list-cursor.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/028-popular-cache.md](../../tickets/028-popular-cache.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/029-comment-body-mediumtext.md](../../tickets/029-comment-body-mediumtext.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |
| ticket | [tickets/030-entity-out-of-controller.md](../../tickets/030-entity-out-of-controller.html) | 미분할 | 0 | 0 | 통과 | 대기 | 대기 | 대기 | 에이전트 검증 뒤 | 원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관 |

## 사용자에게 검토받을 기준

시나리오·DB 실습은 첫 화면의 만들 파일·보낼 요청·실제 확인 경로가 바로 보이는지 묻는다. 공부자료는 이미지가 개념의 값을 쉽게 보여 주면서도 기술 깊이와 시각적 정교함이 충분한지 묻는다. 레슨·티켓은 정답 누출과 힌트 순서를, 목차는 출발점과 탐색을 묻는다. 실제 요청은 에이전트 검증을 마친 페이지 묶음마다 구체적 캡처와 함께 한다.
