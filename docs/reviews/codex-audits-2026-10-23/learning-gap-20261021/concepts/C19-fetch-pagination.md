# C19. Fetch·N+1·컬렉션 페이징 — 정확성과 쿼리 수

판정: **관측 풍부·안전한 대안 완주 필요** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

반환 부모 수/자식 완전성/SQL수/전송행을 구분하고 목록 성능 개선이 결과를 깨뜨리지 않는지 검증한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:84](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:84) — 확인 범위 84–95행.

  발췌: `### LAZY와 N+1  LAZY 연관관계는 초기 SQL을 줄이지만, 객체 접근이 공짜가 되지는 않는다. 부모 목록 한 번 조회 후 각 부모의 컬렉션을 읽으면 아직 초기화되지 않은 컬렉션마다 SELECT가 나가 1+N이 된다. 해결은 전역 EAGER가 아니라 해당 유스케이스의 fetch 계획이다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:975](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:975) — 확인 범위 975–977행.

  발췌: `"id": "fetch",     "question": "원문 BatchSize와 fetch join은 무엇을 조회했을까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 원문 PurchaseOrder / OrderLine · 추가 seed 3부모·6자식",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:1425](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:1425) — 확인 범위 1425–1427행.

  발췌: `"id": "pagination",     "question": "fetch join에 maxResults(1)을 주면 항상 부모1개일까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 API / hint / HQL / plain-control 관측",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tickets/019-comment-list-block-n-plus-1.md:125](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tickets/019-comment-list-block-n-plus-1.md:125) — 확인 범위 125–134행.

  발췌: `| C1 | 요청 A | 비로그인: 최상위 6개 + 답글 2개 그대로 | | C2 | 요청 B | 회원 7: 회원 2의 댓글 172만 빠진다 | | C3 | 요청 C | 회원 10: 회원 11의 답글 253만 빠진다(답글 단위 판정) | | C4 | 요청 D | 회원 14: 회원 3의 최상위 221이 **답글째** 빠진다 |`

S09는 BatchSize를 유지한 부모3·자식6의 SQL2, fetchjoin/graph SQL1을 기록하고 collection fetch API max1에 부모3이 나온 특정 버전 이상까지 명시한다. T019는 댓글 수 증가에도 SQL≤6 테스트를 필수로 한다. N+1 실무 평가가 없다는 말은 틀리다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

특정 Hibernate7.4.5 API pagination 관측은 correctness PASS가 아니며 원인/upstream 미확인이다. 원문 권고인 부모ID 페이지→상세 조회를 같은 fixture로 끝까지 검증한 완주 비교는 S09 보강에 없다. hint나 HQL limit의 관측을 보편적 해결책으로 외우게 하면 위험하다.

## 실습 수행 가능성과 보완 과제

현재 관측 fixture에서 부모ID 페이지+fetch 상세를 구현하는 독립 학습과제를 제시하고 여러 자식 개수·0자식·동점 정렬·다음 페이지의 결과를 검증한다. T019처럼 응답 동일성과 비용을 함께 채점한다.

검증 기대값: page size1이면 부모 정확히1, 해당 부모 자식은 전부, 다음 페이지 중복/누락 없음. SQL수는 실제 측정하고 wire row와 별도 JDBC 재실행행을 혼동하지 않는다.

선수 관계: C17/C10/C16 → Repository pagination

## 검증 수준과 제한

기존실행근거: S09 pagination-first-observation.json 및 보강 데이터. 이번실행 없음; upstream 원인 미확인 유지. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `hibernate-7-4-user-guide` — [Hibernate ORM 7.4 User Guide](https://docs.hibernate.org/orm/7.4/userguide/html_single/)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.

## 최신 common 기반 추가 실행 결과

메인 담당자가 common 기반의 새 learner 소스를 격리복사해 실행했다. 감사용 4개 테스트가 실패0으로 끝났으며, 실패 현상 자체를 기대값으로 확인한 테스트도 포함하므로 기능 전체 정상 판정이 아니다. 본 담당자는 다음 검사 코드·XML·복사 소스를 읽어 결과 범위를 확인했다.

- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java)
- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml)
- 통합 설명: [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md) — 메인 담당자의 완성 보고서를 추가로 읽고 대조했다.

새 기반은 실제 웹 요청 모양의 MockMvc에서 빈 tags POST/GET이200이지만, 요청 밖에서 service.getPosts()가 반환한 Entity를 new PostResponseDto(post)로 변환하면 LazyInitializationException이 재현됐다. [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/dto/PostResponseDto.java:34](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/dto/PostResponseDto.java:34)의 tags.stream 접근이 관측 경로다. OSIV 안에서 보이는 성공과 서비스 반환 이후 컨텍스트 경계 밖에서의 실패를 구분하는 실습 증거다. **쿼리 수·N+1 개선·collection pagination 정확성을 이 네 테스트로 증명한 것은 아니다.**

common 실행의 DB는 저장소 seed를 사용한 일회용 MySQL이다. 개인 개발 DB의 스키마 변경 여부는 확인하지 않았으므로 개발 DB 전체가 같은 오류라고 단정하지 않는다.
