# 추가 감사: 개념 이름을 모르는 학습자의 발견 가능성

확인일: 2026-10-21 KST. 대상은 /Users/ds/code/javaExperience/.worktrees/common-learning-foundation 의 현재 자료·생성 HTML·카탈로그 검색 구현이다. 원본 코드를 수정하지 않았다. 실제 브라우저 클릭·시선·사용자 이해도 실험이 아니라 현재 검색 조건을 생성 HTML의 134개 문서에 적용해 재현한 정적/로직 검증이다.

## 결론

요청한 IoC·DI·빈 생명주기·MyBatis·JPA·MVC·계층형 구조·모놀리스·MSA·N:1·N:N·LAZY/EAGER에 대응하는 설명은 있다. 그러나 모든 주제가 같은 깊이의 입문 실습으로 완성되었다거나, 이름을 모르는 사용자가 필요한 개념을 발견할 수 있도록 잘 연결되어 있다고 판정할 수 없다. 앞선45개 감사는 개념/업무 구현 연결에 집중했고, 전체 개념 지도와 초보자 발견 경로는 별도 검증하지 않았으므로 이번에 보충한다.

## 실제 수록 위치와 깊이 차이

| 주제 | 수록 문서 | 구별할 점 |
|---|---|---|
| IoC·DI·Bean | P11/P12/S01 | 입문부터 생명주기까지 있지만 시작 순서 안내에 연결되지 않음 |
| 빈 생명주기 | S01 | 생성·초기화·종료·scope 설명 있음. 언제 이 문서를 읽어야 하는지 초보자가 판단하기 어려움 |
| JDBC·MyBatis·JPA | W03/W04/W05/P19/S09 | 선택 비교와 상세 내용 있음. DB에 저장하려는 문제에서 도구 차이로 안내하는 통합 시작 경로는 약함 |
| MVC·Layered Architecture | P02/W02/S22 | 두 분류의 차이를 설명함. 영문 layered architecture 검색 별칭 없음 |
| Monolith·MSA | S22/S20 | 모듈러 모놀리스와 서비스 경계·운영 부담 설명 있음. 독립 모놀리스 입문 단계보다는 아키텍처 심화 속에 있음 |
| N:1·1:N·N:N | P20/E4, 댓글·태그 시나리오 | 매핑/중간Entity 설명 있음. 기호·다대일 검색 접근이 부족 |
| LAZY·EAGER | P20/S09와 조회 관련 자료 | EAGER가 본문에는 있어도 현재 검색 대상에 잡히지 않음 |

위 ID는 /Users/ds/code/javaExperience/.worktrees/common-learning-foundation/docs/knowledge/README.md에서 실제 파일로 연결된다. E4는 /Users/ds/code/javaExperience/.worktrees/common-learning-foundation/lessons/E4-jpa-associations.md다.

## 현재 탐색 기능 중 있는 것

- 공통 메뉴의 개념 학습 진입점, 분야 필터, 전체134문서 원문 목록.
- 질문형 문서 카드, 일부 관련 과제 연결, 검색 결과 복귀와 학습 위치 복귀.
- '처음이라면' 안내와 P09 → P04 → P16 → W09의 네 단계 순서.
- DTO/new/트랜잭션의 등록 질문 별칭(공백 유무 포함6개).

따라서 '탐색 기능이 전혀 없다'는 판단도 틀리다.

## 확인한 결함과 공백

1. **개념의 전체 지도와 선수 관계가 부족하다.** 현재 네 단계 순서는 객체/생성자/DTO까지만 다루며, IoC/DI/계층/DB접근/관계/트랜잭션/조회전략/배포구조로 이어지지 않는다.
2. **검색은 제목과 Markdown h1~h3, 등록 질문 중심이다.** 본문/요약/h4/코드/HTML 장식 제목 전체를 찾지 않는다. 개념이 본문에만 있어도 없다고 보인다.
3. **별칭이 매우 제한적이다.** 한글/영문/기호/현상 표현을 연결하지 않아 같은 개념도 입력에 따라 결과0이 된다.
4. **자연어 질문의 단어를 모두 포함해야 한다.** 정확 등록 질문 외에는 단어별 부분문자열 AND이므로 '서비스에 뭘 써야 해' 같은 문장이 검색에 불리하다.
5. **너무 짧은 영문은 잡음이 생긴다.** DI는 독립 개념이 아니라 문자열 일부로 매칭되어 이 조건에서25개 문서가 나온다.
6. **현재 과제에 따른 대표 추천은 네 과제만 정의돼 있다.** Controller/DTO 이후 Service와 관계구현의 단계별 추천으로 확장되지 않았다.
7. **용어 존재와 초보자 완주 검증은 다르다.** S20/S22의 내용은 있지만 처음배우는 사람에게 모놀리스부터 이해시키는 순서가 갖춰졌다는 증거는 없다.

## 검색 재현 결과(category=all)

| 입력 | 결과 수 | 문서 ID |
|---|---:|---|
| `IoC` | 2 | P12, S01 |
| `DI` | 25 | P10, P12, P13, P17, P18, P19, P20, P23, W12, W17, W23, V04, R02, J07, J14, J22, S01, S03, S04, S09, S10, S11, S16, S19, S20 |
| `빈 생명주기` | 1 | S01 |
| `MyBatis` | 3 | W03, W04, W05 |
| `JPA` | 16 | P03, P16, P19, P20, P21, W03, W05, W14, W16, W19, W20, V01, V04, S09, S18, S22 |
| `MVC` | 11 | P02, P25, P27, W14, V01, V03, V06, D03, S05, S07, S18 |
| `계층형` | 2 | P02, S19 |
| `layered architecture` | 0 | 없음 |
| `모놀리스` | 1 | S22 |
| `모놀리식` | 0 | 없음 |
| `모놀로직` | 0 | 없음 |
| `MSA` | 2 | S20, S22 |
| `N:1` | 0 | 없음 |
| `N:N` | 0 | 없음 |
| `다대일` | 0 | 없음 |
| `다대다` | 1 | P20 |
| `Lazy` | 5 | P20, P22, V04, S09, S17 |
| `Eager` | 0 | 없음 |
| `객체는 누가 만들어` | 0 | 없음 |
| `서비스에 뭘 써야 해` | 0 | 없음 |
| `글 하나에 댓글 여러 개` | 0 | 없음 |
| `왜 조회할 때 SQL이 나가` | 0 | 없음 |
| `저장하면 DB에 언제 들어가` | 0 | 없음 |

## 재현 근거 파일

- /Users/ds/code/javaExperience/.worktrees/common-learning-foundation/tools/site/knowledge-catalog-data.mjs: 제목/Markdown h1~h3 검색어 생성.
- /Users/ds/code/javaExperience/.worktrees/common-learning-foundation/tools/site/knowledge-catalog-view.mjs: 네 단계 학습 순서·검색 안내.
- /Users/ds/code/javaExperience/.worktrees/common-learning-foundation/tools/site/knowledge-catalog-controller.mjs: question exact match/단어별 includes와 네 과제 contextMap.
- /Users/ds/code/javaExperience/.worktrees/common-learning-foundation/docs/knowledge/README.html: 현재134개 항목과 질문별칭6개.
- /Users/ds/research/javaexperience-learning-gap-audit-20261021/_data/discoverability-search.json: 검색 입력/결과 전체.

## 보완할 기준

개념명을 입력하는 검색 외에 '서버가 요청을 받는다 → 업무를 결정한다 → DB에 저장한다 → 관계를 읽는다 → 실패를 원복한다 → 배포한다' 경로가 필요하다. 각 단계에서 처음 보는 용어가 무엇을 해결하는지, 지금 알아야 하는지/나중에 볼 것인지, 선수개념은 무엇인지, 다음 과제는 무엇인지 알려야 한다. MVC/Layered/Monolith/MSA처럼 분류 축이 다른 개념도 같은 선택지처럼 나열하지 않는다.

합격은 개념명을 모르는 학습자에게 '글 하나에 댓글 여러 개를 저장하고 싶다', 'save했는데 값이 왜 DB에 안 보이나', 'Service에 무엇을 써야 하나' 같은 요구를 주고 필요한 입문 설명과 실습으로 이동할 수 있는지 실제 브라우저에서 확인하는 것이다. 이번에는 그 UI·이해도 시험을 수행하지 않았으므로 탐색이 충분하다는 완료 판정은 하지 않는다.
