# C10. 영속 상태·merge·remove — 상태와 행을 구분

판정: **추가 실행으로 강하게 보강됨** · 우선순위 **P3** · 확인일 2026-10-21 KST.

## 검사 기준

new/managed/detached/removed와 DB 행 존재를 별개로 판단하고 merge 반환값을 사용한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:33](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:33) — 확인 범위 33–42행.

  발췌: `### 엔티티 상태  | 상태 | 의미 | 다음 전이 예 | |---|---|---|`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:754](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:754) — 확인 범위 754–756행.

  발췌: `"id": "merge",     "question": "merge는 원본을 managed로 바꿀까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 detached 원본과 반환 객체",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:866](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:866) — 확인 범위 866–868행.

  발췌: `"id": "remove",     "question": "remove 직후 contains=false면 DB에서도 없을까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 remove·flush·commit",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:353](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:353) — 확인 범위 353–355행.

  발췌: `"id": "cache",     "question": "id가 있는 객체는 이미 영속 상태일까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 생성·저장·find",`

최신 S09는 assigned id42여도 new, persist 등록, 같은 컨텍스트 find 동일성, merge 원본과 반환값 분리, remove 직후 contains=false이지만 외부 행 존재를 실제 Hibernate/H2 관측으로 보여 준다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

상태 전이 기본 실습 공백은 거의 없다. 원문의 “예제 미실행”만 읽으면 최신 보강을 놓친다. 남는 부분은 이 native probe의 같은 ID 모델을 학습자 Repository.save의 새 상태 판단과 연결하는 C20 과제다.

## 실습 수행 가능성과 보완 과제

정답을 가린 상태로 각 장면의 contains/객체 동일성/SQL/observer 행을 먼저 예측하게 한다. merge 원본만 바꾸기와 반환값 바꾸기를 서로 다른 케이스로 낸다.

검증 기대값: 원본 detached는 관리되지 않고 반환 객체가 managed. remove 직후 외부 행은 남으며 flush 뒤 내부에서 사라지고 commit 뒤 observer에서도 사라진다. 실제 공급자별 상태 내부 API와 JPA 계약을 구분한다.

선수 관계: C07/C09 → C11/C20

## 검증 수준과 제한

기존실행근거: S09 native Hibernate7.4.5/H2, execution.json 및 source-proof. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-entitymanager-api` — [EntityManager API Javadoc](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
