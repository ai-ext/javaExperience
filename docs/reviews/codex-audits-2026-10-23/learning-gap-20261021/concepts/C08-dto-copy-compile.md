# C08. DTO·엔티티 접근성 — P20 복사 실행의 차단점

판정: **원문 결함·최신 화면에 교정 안내 존재** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

원문 전체 코드를 복사한 학습자가 DTO까지 컴파일하고, 트랜잭션 안에서 복사한 값이 컨텍스트 종료 뒤에도 사용 가능해야 한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:238](../../../../knowledge/P20-jpa-entity-mapping.md) — 확인 범위 238–277행.

  발췌: `@Entity @Table(name="order_lines") public class OrderLine {   @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;   @Column(nullable=false, length=120) private String productName;`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:314](../../../../knowledge/P20-jpa-entity-mapping.md) — 확인 범위 314–330행.

  발췌: `## 4. 치트시트  | 이름 | 용도 | 예시 | 주의 | |---|---|---|---|`
- $WORKTREE_ROOT/concept-learning-night/tools/site/p20-lesson-data.mjs:222 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/p20-lesson-data.mjs:222`) — 확인 범위 222–289행.

  발췌: `export const P20_LESSONS = [   {     "id": "compile",     "question": "원문 전체 코드는 왜 DTO에서 컴파일되지 않을까?",`
- [$WORKTREE_ROOT/concept-learning-night/tickets/030-entity-out-of-controller.md:125](../../../../../tickets/030-entity-out-of-controller.md) — 확인 범위 125–141행.

  발췌: `## 채점 기준  C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)`

P20 최신 첫 장면은 원문 LineStatus 접근성 컴파일 오류와 별도 String.valueOf 교정 fixture를 정확히 드러낸다. W09·T030은 민감 필드/LAZY/순환/변환 위치/회귀 가드를 갖춘다. DTO 필요성 자체는 충분하다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

P20 원문은 여전히 package-private enum 반환값에 다른 패키지 DTO가 name()을 호출한다. 화면에서 알려 줬다고 원문 복사 실행이 성공하지 않는다. 같은 문서 318행 “final·무인자 생성자 금지”는 9·15행 무인자 생성자 필수와 모순된다. 이미 알려진 오류임과 원문 미교정을 분리한다.

## 실습 수행 가능성과 보완 과제

정답 원문 수정은 별도 승인 작업으로 분리하되, 우선 다운로드/복사 대상이 원문인지 검증된 교정본인지 명시하고 원문-교정본의 차이를 한 곳에 제시하는 보완 요구를 남긴다.

검증 기대값: 제시된 정확한 패키지 구성으로 원문 컴파일은 접근성 오류, 교정본은 compile 성공. DTO JSON은 order 역참조가 없고 컨텍스트 종료 전후 같아야 한다. 무인자 생성자 설명은 본문과 일치해야 한다.

선수 관계: Java 접근 제어 → C07/C09 → T030

## 검증 수준과 제한

기존실행근거: P20 source-proof의 javac 실패 기록과 H2 교정 실행 및 JSON. 이번실행 없음. 원문 소스는 수정하지 않았다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-persistence-entity-class` — [Jakarta Persistence 3.2 Entity Class Requirements](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#the-entity-class)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.

## 최신 common 기반 추가 실행 결과

메인 담당자가 common 기반의 새 learner 소스를 격리복사해 실행했다. 감사용 4개 테스트가 실패0으로 끝났으며, 실패 현상 자체를 기대값으로 확인한 테스트도 포함하므로 기능 전체 정상 판정이 아니다. 본 담당자는 다음 검사 코드·XML·복사 소스를 읽어 결과 범위를 확인했다.

- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java`)
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml`)
- 통합 설명: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md`) — 메인 담당자의 완성 보고서를 추가로 읽고 대조했다.

새 기반 DTO도 Entity를 받고 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/dto/PostResponseDto.java:34 (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/dto/PostResponseDto.java:34`)에서 LAZY tags를 순회한다. 메인 실행은 요청 밖의 Entity→DTO에서 LazyInitializationException을 관찰했다. P20의 package-private enum 컴파일 문제와는 별개인 런타임 변환 경계 문제다. 서비스 내부에서 필요한 조회와 DTO 완성을 끝내는 T030 과제를 현재 학습자 코드에 연결할 근거가 생겼다.

common 실행의 DB는 저장소 seed를 사용한 일회용 MySQL이다. 개인 개발 DB의 스키마 변경 여부는 확인하지 않았으므로 개발 DB 전체가 같은 오류라고 단정하지 않는다.
