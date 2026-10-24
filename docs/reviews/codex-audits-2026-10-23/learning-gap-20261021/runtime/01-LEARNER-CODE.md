# 학습자 코드 실제 실행 검증

확인일: 2026-10-21 KST. 이 문서는 학습자의 현재 진척을 채점해서 실패 처리하는 문서가 아니다. 학습 자료가 다음 구현으로 이어져야 하는 지점을 실제 코드와 실행으로 확인한 기록이다. 원본 소스는 수정하지 않았다.

## 대상과 재현 환경

- 원본: /Users/ds/code/javaExperience/src/
- 복사본: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-project/
- 원본→복사본 23개 파일의 출처·SHA-256: /Users/ds/research/javaexperience-learning-gap-audit-20261021/_data/runtime-source-manifest.json
- Java 21.0.6, Spring Boot 4.1.1, Hibernate 7.4.5.Final, Testcontainers MySQL 8.4.11.
- 실제 개발 DB가 아니라 `test` 프로파일의 일회용 MySQL에서 실행했다. 검사 후 삭제한 행도 이 컨테이너의 `post_txt`에 한정했다.

## 기존 테스트의 증명 범위

/Users/ds/code/javaExperience/src/test/java/org/example/HelloControllerTest.java:21-25는 `GET /hello`의 HTTP 200과 문자열 `hello`를 검사한다. 기존 테스트 1개는 통과했다.

근거: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/baseline-test.log

이 결과는 컨텍스트 시작과 해당 엔드포인트만 증명한다. 게시글 저장·목록, 관계 매핑, 트랜잭션 실패, 좋아요, 권한, 동시성의 통과 근거가 아니다.

## 감사용 관찰 테스트

검사 코드: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-project/src/test/java/org/example/LearningGapAuditTest.java

최종 실행: 기존 1개 + 감사용 6개 = 7개, 실패 0개. 감사 테스트는 **문제 동작을 재현하는 것도 통과 조건**으로 삼는 관찰 테스트다. 따라서 7개 통과를 기능 정상 판정으로 읽으면 안 된다.

| 검사 | 이번에 관찰한 결과 | 학습 연결 |
|---|---|---|
| 정상 JSON POST, `hi` 헤더 없음 | HTTP 200, 저장 행 1개 | 이 스택에서는 `@RequestBody` 해석이 사용됐다. 이중 어노테이션만 보고 필수 헤더 누락 400이라고 단정할 수 없다 |
| Service 직접 저장과 별도 Repository 조회 | 행 1개, 태그 2개 왕복 성공 | 저장 트랜잭션 자체는 구현돼 있다. `List<String>`은 현재 Hibernate에서 JSON으로 저장되므로 무조건 매핑 실패라고 할 수 없다 |
| 저장한 Entity → `ListResponseDto` | `NullPointerException` | nullable `Boolean heart`를 primitive `boolean`으로 반환하면서 실패 |
| 짧은 제목 POST | HTTP 200, 본문 `status=401`, 저장 0개 | HTTP 상태와 JSON 필드는 다르며, 입력 검증과 인증 실패를 분리해야 함 |
| 저장 후 `GET /api/lists` | MockMvc 호출에서 처리되지 않은 NPE 전파 | 쓰기 성공만으로 다음 읽기 기능의 성공을 보장하지 못함 |
| 외부 트랜잭션에서 저장 후 RuntimeException | 최종 행 0개 | 기존 `jakarta.transaction.Transactional`도 Spring에서 트랜잭션에 참여한다. 어노테이션 선택 자체를 오답으로 보지 않음 |

검사 결과 XML:

/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-project/build/test-results/test/TEST-org.example.LearningGapAuditTest.xml

실행 로그:

/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-probes-verified.log

## 관찰과 원인 연결

1. /Users/ds/code/javaExperience/src/main/java/org/example/domain/PostEntity.java:30-31은 nullable `Boolean heart`이고 생성자(35-41행)에서 값을 정하지 않는다. 67-68행의 `boolean getLike()`가 자동 언박싱한다. /Users/ds/code/javaExperience/src/main/java/org/example/dto/ListResponseDto.java:35가 이를 호출한다. 이것이 이번 NPE의 실제 경로다.
2. /Users/ds/code/javaExperience/src/main/java/org/example/service/PostService.java:18-25는 DTO→Entity→save를 이미 구현했다. 필요한 교육은 단순히 빈 Service를 하나 만드는 것이 아니라 조회·권한·불변식·여러 테이블 변경·실패 처리의 순서를 결정하도록 확장하는 것이다.
3. /Users/ds/code/javaExperience/src/main/java/org/example/controller/PostController.java:34-41은 오류도 정상도 HTTP 응답 객체의 상태를 지정하지 않고 JSON DTO를 반환한다. 짧은 제목을 HTTP 200/본문 401로 내보내는 현상을 실제로 확인했다.
4. /Users/ds/code/javaExperience/src/main/java/org/example/domain/PostEntity.java:24-25의 태그 컬렉션을 저장할 때 SQL에 `cast(? as json)`이 나타난다. 이는 태그 값 목록 저장이지 `tag`와 `post_tag` 관계 설계를 완료한 것이 아니다.
5. `heart` 하나로는 회원 A와 B가 각각 좋아요했는지 기록할 수 없다. 이 점은 실행 예외와 별개의 데이터 모델링 한계다. 사용자별 관계 행·유일 제약·집계 수치로 전환하는 과제가 필요하다.

## 폐기한 가설도 보존

처음에는 같은 매개변수에 `@RequestHeader`와 `@RequestBody`가 있으면 헤더 누락 400이 발생할 것으로 예상했다. 실제 결과는 200이어서 해당 가설을 폐기했다. 실패 원인은 제품 코드가 아니라 감사 테스트의 잘못된 예상이었다. 첫 실패 XML과 로그를 보존하고, 실제 결과에 맞게 관찰 테스트를 수정했다.

- /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-probes-first-results/
- /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-probes.log

## 다음 학습 과제의 합격 기준

- 정상 POST 후 목록 GET까지 한 흐름으로 검사하고 모든 응답 필드의 null 계약을 설명한다.
- 제목 형식 오류를 HTTP 400으로, 인증 실패와 권한 거부를 각각 별도 계약으로 구분한다.
- `tags` JSON 컬렉션과 `post_tag` 관계 엔티티의 차이를 설명하고, 둘 중 어떤 모델을 요구사항에 선택하는지 근거를 쓴다.
- 동일 글에 회원 두 명이 각각 좋아요하는 상태를 Boolean 하나와 관계 테이블로 그려 보고, 취소 시 다른 회원의 상태가 유지되는지 확인한다.
- 저장 후 후행 실패를 주입하고 새 트랜잭션의 조회에서 원복을 확인한다. 기존 RuntimeException 시험을 checked exception·catch·readOnly로 확장할 때 기대값과 어노테이션 종류를 먼저 적는다.

실제 HTTP 서버를 띄운 네트워크 상태 코드 시험과 모든 입력 조합은 이 검사에서 수행하지 않았다. 특히 MockMvc의 미처리 NPE를 네트워크 HTTP 500을 직접 관찰한 것처럼 표현하지 않는다.
