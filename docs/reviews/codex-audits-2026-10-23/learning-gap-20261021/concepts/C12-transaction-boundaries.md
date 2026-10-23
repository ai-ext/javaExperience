# C12. 트랜잭션 경계 — Repository·Service·Controller

판정: **원자성 비교·실제 관측 있음** · 우선순위 **P3** · 확인일 2026-10-21 KST.

## 검사 기준

두 저장 작업의 성공/실패 단위를 API와 배치가 공유하도록 정하고 메서드 반환과 실제 commit을 구분한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W11-why-tx-in-service.md:90](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W11-why-tx-in-service.md:90) — 확인 범위 90–117행.

  발췌: `## 5. 코드로 보기  아래 예제는 주문 기록과 재고 차감을 네 방식으로 배치한다. Spring Boot 4.1.1 / Spring Framework 7.0.9 API와 Java 25 기준이며 실행 검증은 하지 않았다. 컨텍스트와 ’orders’, ’inventory’ 테이블이 필요한 구조 예제이므로 모두 **(미실행)**이다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w11-lesson-data.mjs:1607](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w11-lesson-data.mjs:1607) — 확인 범위 1607–1609행.

  발췌: `{id:'repository',question:'재고가 부족한데 주문은 왜 남았을까?',source:scope+' · 원문 B: Repository별 경계',sourceNote:'B의 OrderUseCase에는 transaction 경계가 없습니다. 원문 Repository 두 메서드의 @Transactional은 그대로입니다. B/C 동명 대안은 별도 JVM에서 실행했습니다.',note:context+' '+limits,stages:[     stage('repository','insert','첫 INSERT는 아직 writer에만','원문 B에 product7·quantity6을 요청했습니다. 첫 Repository의 INSERT가1행을 만들었지만, 그 문장 직후 독립 observer에는 아직 주문이 없고 재고는5입니다.',insertCode,[['원문 요청','productId=7 / quantity=6'],['첫 INSERT 바인딩','1=7 / 2=6'],['affected`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w11-lesson-data.mjs:1618](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/w11-lesson-data.mjs:1618) — 확인 범위 1618–1620행.

  발췌: `{id:'service',question:'서비스 경계에서 주문과 재고의 중간값은 어떻게 보일까?',source:scope+' · 별도 variantC 원문 서비스 경계',sourceNote:'원문 C의 @Transactional OrderUseCase를 별도 JVM에서 실행했습니다. Repository 코드는 B와 같으며 기존 @Transactional을 제거하지 않았습니다.',note:context+' C의 원문 listener는 빈 no-op body입니다. 추가 ObservedListener가 원문 super handler 뒤 관찰만 기록했으며 알림·broker 전송은 하지 않았습니다. '+limits,stages:[     stage('service','insert','C의 INSERT 뒤에도 observer는 이전 상태', '원문 C에 quantity2를 요청했습니다. 같은 transaction의 첫 INSERT 뒤 writer는 주문7/2·재고5이며 observer는 주`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/G3-first-transaction.md:144](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/G3-first-transaction.md:144) — 확인 범위 144–169행.

  발췌: `### createWithoutTx Creating new transaction with name [...SimpleJpaRepository.save] insert into lab_post (like_count,published_at,title) values (?,?,?) Committing JPA transaction ...`

W11은 Repository별 경계에서 주문이 남는 실패, Controller/Service 상위 경계에서 함께 rollback, TransactionTemplate로 위험 API를 경계 밖에 두는 추가 실험을 제공한다. G3는 SQL 및 JPA 로그와 DB 결과를 연결한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

왜 Service인지 설명이 없다는 공백은 아니다. W11의 Controller CGLIB 호출은 실제 HTTP가 아니므로 MVC 반환/직렬화와 commit 실패의 HTTP 응답을 하나의 실제 경로에서 평가하는 연결이 추가로 필요하다.

## 실습 수행 가능성과 보완 과제

게시글+태그 저장 중 두 번째 작업 실패를 넣고 서비스 경계의 최종 행 수를 확인한다. Controller 외 배치 진입에서도 같은 유스케이스의 원자성을 유지하는지 설계로 비교한다.

검증 기대값: 같은 성공 단위의 두 저장은 모두 남거나 모두 없어야 한다. Repository별 독립 경계 대조군에서는 첫 저장이 남는 실패를 재현한다. 외부 호출의 성공까지 DB 트랜잭션이 되돌린다고 주장하지 않는다.

선수 관계: C06/C11 → C13/C15

## 검증 수준과 제한

기존실행근거: W11 standalone Spring JDBC/H2, G3 MySQL 기록. W11 HTTP/Boot/JPA는 미실행 표기. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-data-jpa-tx` — [Transactionality — Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
