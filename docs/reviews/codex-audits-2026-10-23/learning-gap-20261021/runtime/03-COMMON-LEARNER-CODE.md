# 새 통합 기반의 학습자 코드 추가 검증

확인일: 2026-10-21 KST. 감사 도중 다른 작업이 만든 $WORKTREE_ROOT/common-learning-foundation 을 추가로 확인했다. 당시 HEAD는 `73a7a0c2363cd4cc0e2bd7b5d2e709a1602f52ad`이며 미커밋 변경도 읽기 대상으로 포함했다.

## 먼저 정정할 현재 상태

이 기반에서는 `PostService.createPost()`가 이미 태그 Entity 목록을 만들고 `saveAll()` 뒤 게시글을 저장한다. `PostEntity`에 단방향 `@OneToMany @JoinColumn(name="post_id")`가 있고 `heart`도 primitive `boolean`으로 바뀌었다.

따라서 초기 main 복사본에서 확인한 nullable heart NPE를 최신 통합 기반에도 남은 문제라고 주장하면 틀리다. “Service가 전부 비어 있다” 또는 “1:N을 전혀 구현하지 않았다”는 판정도 맞지 않는다.

## 증거 보존과 실행

- 새 기반과 기존 네 checkout 간 소스 비교: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/common-foundation-comparison.json
- 32개 원본 파일→복사본 SHA-256: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/common-runtime-source-manifest.json
- 실행 복사본: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/
- 원본 테스트 로그: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-baseline.log
- 감사 테스트: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java
- 최종 로그: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-probes.log
- 최종 XML: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml

원본 구현 변경 없이 Java21·Boot4.1.1·Hibernate7.4.5.Final·Testcontainers MySQL8.4.11에서 실행했다. 기존 `/hello` 1개와 감사용 관찰 4개가 통과했다. **관찰 테스트의 통과는 아래 문제 동작의 재현 성공도 포함한다.**

## 이번 실제 관찰 4개

| 입력·조건 | 관찰 | 해석 |
|---|---|---|
| 태그 없는 정상 JSON POST → GET | HTTP200 → HTTP200, `like=false` | 초기 main의 heart null 경로는 이 기반에서 해소 |
| 태그 `["audit-tag"]`를 포함해 Service 생성 | `DataIntegrityViolationException`, `Field 'name' doesn't have a default value` | Entity는 `tag.title`을 쓰는데 저장소가 제공한 seed의 `tag.name`은 NOT NULL |
| 위 실패 후 별도 DB 검사 | tag 행 수 기존 그대로, post_txt 0개 | 저장 실패가 트랜잭션으로 원복되는 것도 확인 |
| HTTP 요청 밖에서 `getPosts()` 반환 Entity를 DTO로 변환 | `LazyInitializationException` | Service 밖의 LAZY 컬렉션 접근이며, HTTP 요청의 OSIV가 있던 성공 경로와 다름 |
| 짧은 제목 POST | HTTP200/본문401 | HTTP 계약 오류는 새 기반에도 동일하게 남음 |

표의 태그 실패·롤백은 하나의 감사 테스트에서 함께 검사했다. 테스트 개수는 4개다. 첫 번째 GET은 현재 기본 OSIV가 적용되는 MockMvc 요청이다. “모든 GET이 실패한다” 또는 “조회 서비스에 무조건 @Transactional만 붙이면 해결”이라고 해석하면 안 된다. 필요한 데이터를 조회 경계 안에서 구성해 DTO로 반환하는 설계를 평가해야 한다.

## 출처와 연결할 학습 내용

1. $WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/domain/entity/TagsEntity.java:7-15은 `tag` 테이블의 `title`을 매핑한다. 제공된 $WORKTREE_ROOT/common-learning-foundation/docker/mysql/init/01-community.sql 의 `tag`는 `name` 열을 요구한다. ORM 설정의 `ddl-auto=update`는 기존 `name`을 `title`로 의도에 맞게 마이그레이션해 주지 않는다.
2. $WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/domain/entity/PostEntity.java:24-26은 게시글이 태그 행을 소유하는 1:N이다. 시나리오가 요구하는 “태그 이름 재사용 + post_tag 연결”과는 모델이 다르다. **단방향 1:N 자체가 불법 매핑인 것은 아니다.** 업무상 태그가 공유되는지, 게시글 종속 값인지 먼저 결정하는 과제가 필요하다.
3. $WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/service/PostService.java:28-35는 매 요청마다 새 태그를 생성한다. 중복 이름·재사용·대소문자 정규화·동시 생성 정책을 아직 결정하지 않는다.
4. 같은 파일 40-44행은 Entity 목록을 반환하고 $WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/dto/PostResponseDto.java:34는 그 이후 `tags.stream()`을 호출한다. OSIV 유무·LAZY 로딩·트랜잭션 범위·DTO 조립 위치를 함께 다루는 과제가 직접 연결된다.
5. $WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/global/GlobalExceptionHandler.java:18-22의 활성 코드는 모든 `IllegalArgumentException`을 HTTP404로 바꾼다. 아래 주석의 400 예시와 실제 동작을 혼동하면 안 된다. 오류 종류별 계약을 분리해야 한다.

## 보완 과제의 합격 기준

- 현재 1:N 매핑과 공유 태그 N:M 관계를 각각 테이블 행으로 그려서 선택 근거를 설명한다.
- Entity·실제 DDL·seed·migration 네 항목이 같은 컬럼 계약을 쓰는지 확인한다.
- 태그 없이 성공하는 경로만 시험하지 않고 태그 있음·중복·새 이름·기존 이름·동시 생성·후행 실패를 검사한다.
- Controller 밖에서도 결과 DTO를 사용할 수 있도록 필요한 데이터와 조회 경계를 설계한다.
- 저장 성공 뒤 조회와 JSON 직렬화까지 한 흐름으로 검증한다.

이 결과는 **저장소에 포함된 seed를 사용한 일회용 DB**의 결과다. 사용자가 개인 개발 DB에서 `tag` 스키마를 이미 바꾸었는지는 확인하지 않았다. 그 개발 DB가 지금 실패한다고 단정하지 않는다.
