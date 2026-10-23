# Spring 확장 조사 기술 근거

공식 문서를 직접 열어 핵심 근거로 사용했다. 확인일은 2026-10-21이다. 문서의 코드 예제 실행 여부와 외부 문서 확인은 별개의 검증 축이다.

## S14 — Spring Kafka Message Listener Containers
- URL: https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html
- 확인일: 2026-10-21
- 문서 버전: Spring for Apache Kafka 4.1.1
- 한계: consumer container가 poll·listener·offset 제어를 관리하는 일차 문서. 전달 보장 전반을 단독으로 보증하지 않음
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S15 — Spring Batch What’s New
- URL: https://docs.spring.io/spring-batch/reference/whatsnew.html
- 확인일: 2026-10-21
- 문서 버전: Spring Batch 6.0.5
- 한계: 6.0 변경 목록/인프라 근거. chunk 처리 일반 의미와 사용 애플리케이션 재시작을 대신 검증하지 않음
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S16 — Spring Boot Observability
- URL: https://docs.spring.io/spring-boot/reference/actuator/observability.html
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.1.1
- 한계: Observation, low/high cardinality, context propagation 근거. 실제 registry/exporter 수집은 별도 검증 필요
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S16 — Spring Boot Metrics
- URL: https://docs.spring.io/spring-boot/reference/actuator/metrics.html
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.1.1
- 한계: Micrometer registry 자동 구성 및 metrics facade 근거
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S17 — Spring Boot Common Application Properties
- URL: https://docs.spring.io/spring-boot/appendix/application-properties/index.html
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.1.1
- 한계: 설정 속성 참조. 환경별 override/실제 server 동작은 애플리케이션 시험이 필요
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S18 — Spring Boot Testcontainers
- URL: https://docs.spring.io/spring-boot/reference/testing/testcontainers.html
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.1.1
- 한계: Testcontainers/JUnit 연동과 service connection 공식 참조. Docker 실제 실행은 이 감사에서 하지 않음
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S19 — Spring Boot Efficient Deployments
- URL: https://docs.spring.io/spring-boot/reference/packaging/efficient.html
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.1.1
- 한계: jarmode tools extract 및 exploded layout의 효율성/실행 근거
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S19 — Spring Boot Cloud Native Buildpacks
- URL: https://docs.spring.io/spring-boot/reference/packaging/container-images/cloud-native-buildpacks.html
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.1.1
- 한계: Maven/Gradle Buildpacks 지원과 resource metadata 한계 근거
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S20 — Spring Cloud Train Reference
- URL: https://docs.spring.io/spring-cloud-release/reference/index.html
- 확인일: 2026-10-21
- 문서 버전: Spring Cloud Release 2025.1.3; supported Boot 4.0.8-SNAPSHOT
- 한계: 실제 조회 당시 지원 버전 표기; Boot 4.1.1 지원을 뜻하지 않으며 문서가 SNAPSHOT 기준
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S21 — Spring Boot 4.0 Migration Guide
- URL: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide
- 확인일: 2026-10-21
- 문서 버전: Spring Boot 4.0 migration; page edited 2026-06-28
- 한계: 최신 3.5.x 선행 권고의 공식 출처. 개별 서비스 의존성의 직접 호환 테스트는 별도
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S22 — Spring Modulith Verifying Application Module Structure
- URL: https://docs.spring.io/spring-modulith/reference/verification.html
- 확인일: 2026-10-21
- 문서 버전: Spring Modulith 2.1.1
- 한계: 순환/internal package/API dependency verify 규칙. Boot 4.1.1 호환 매트릭스 확정 증거가 아님
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.

## S23 — OpenAPI Specification 3.1.1
- URL: https://spec.openapis.org/oas/v3.1.1.html
- 확인일: 2026-10-21
- 문서 버전: OpenAPI 3.1.1, published 2024-10-24
- 한계: HTTP API description normative specification; Swagger UI/springdoc behavior is implementation-specific
- 접근 결과: 공식 문서 페이지를 직접 열어 내용 확인.
