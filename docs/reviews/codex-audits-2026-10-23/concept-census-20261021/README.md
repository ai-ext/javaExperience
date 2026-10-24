# javaExperience 개념 자료 전수 조사

확인일: **2026-10-21**. 조사 전용 브랜치: `audit/concept-census-20261021`.

**개념 자료134개 전부를 읽고, 문서별로 의미 단위 개념·쓰는 시점·선수개념·찾는 경로·시각 전달을 조사했다.** Luna3명이 원문과 화면을 분담했고 메인은 기술적 쟁점, 누락 후보의 중복/기존 자료, 실제 검색·DB·모바일 결과를 교차 확인했다.

결론은 **설명이 없는 것, 설명은 있지만 찾기 어려운 것, 설명은 있으나 시각적 전달/직접 실습 연결이 약한 것을 구분해야 한다**는 것이다. B-Tree·복합/커버링 인덱스·DTO·Entity·VO 등은 관련 설명이 이미 있다. 반면 SQL UNION/UNION ALL은 사용 예시는 있지만 독립적인 입문 설명·선택 기준·실습으로 연결되지 않는다.

## 먼저 볼 파일

- **문서134개 전체 평가:** $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/DOCUMENTS.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/DOCUMENTS.md`)
- **의미 단위 개념527개 항목:** $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/CONCEPTS.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/CONCEPTS.md`)
- **추가 필요 후보41건의 메인 교차 판정:** $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/NEEDED-CONCEPTS.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/NEEDED-CONCEPTS.md`)
- **어떤 질문에서 어디로 찾아가야 하는가:** $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/LEARNING-MAP.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/LEARNING-MAP.md`)
- **실제 화면과 탐색 문제:** $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/VISUAL-AND-DISCOVERY.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/VISUAL-AND-DISCOVERY.md`)

527은 문서 사이에 반복되는 개념을 포함한 **검토 항목 수**다. 고유한 개념527종이라는 뜻이 아니다. 후보41건도 서로 겹치며 기존 자료의 연결·실행·검색 보완을 포함하므로 누락 개념41종이라고 부르지 않는다.

## 조사 범위와 기록

| 영역 | 문서 수 |
|---|---:|
| P 실무 기초·구현 | 31 |
| W 선택 이유·설계 판단 | 26 |
| J Java·자료구조·알고리즘 | 24 |
| S Spring·아키텍처 | 23 |
| D 개발·네트워크·운영 | 15 |
| R DB·SQL | 8 |
| V 테스트 | 6 |
| B 계정 생명주기 | 1 |
| 합계 | 134 |

각 문서는 `documents/<ID>.md` 및 같은 ID의 JSON으로 기록했다. 실제 절대경로는 전체 문서 목록에 있다. 원문 SHA-256, 전문 읽기 범위, 개념별 정의/용도/대안/예/선수/보완점/근거 행, 탐색 문제, 정적 시각 구조, 실제 캡처 판정을 포함한다.

공개 공통 기반 `d66dc21a54b442175da6427654c1d5efb4659bc9`에서 별도 worktree를 만들었다. 진행 중 개념 보강23개는 공개본과 따로 비교했다. 아직 합쳐지지 않은 그림·실험을 공개 페이지에서 이미 볼 수 있다고 쓰지 않았다.

## 사용자가 명시한 개념의 판정

| 개념 | 현재 설명 | 찾아가기·시각 전달에서 보완할 점 |
|---|---|---|
| IoC·DI·Bean 생명주기 | P11/P12/S01 등에 있음 | 객체를 누가 만들고 연결/종료하는지 질문에서 진입하고, 같은 객체의 생성 순서를 관찰 |
| Entity·EntityManager·영속 상태 | P20/S09 등 설명과 부분 실행 보강 있음 | 주입 프록시·실제 컨텍스트·객체값·SQL·DB값을 구별하는 경로 |
| 트랜잭션/readOnly/rollback | S08/W11 등 설명·환경별 실험 있음 | import/전파/예외/flush/commit과 환경 차이를 자기 업무로 연결 |
| MyBatis·JPA | W03/W04/W05 등에 비교 있음 | DB에 저장/조회하려는 문제에서 제어권과 선택 기준으로 안내 |
| MVC·Layered·Monolith·MSA | P02/W02/S22/S20 등에 있음 | 웹 역할·내부 의존성·배포 경계라는 서로 다른 분류 축부터 설명 |
| N:1·1:N·N:N | P20·관계 레슨/시나리오에 있음 | 댓글·공유 태그의 행에서 FK/주인/중간 Entity를 도출하고 표기 별칭 연결 |
| LAZY·EAGER | P20/S09 등 설명 있음 | 언제 SQL이 나가는지, Entity/DTO 직렬화와 조회 범위의 실제 결과 비교 |
| 인덱스·B-Tree/B+Tree | R05에 페이지/리프 설명과 그림 있음 | 트리 높이·페이지 방문·범위 리프 이동을 한 데이터로 보여 주기; btree 표기 검색 보완 |
| 복합 인덱스 | R05에 선두 열·범위·정렬 설명 있음 | 띄어쓰기 별칭과 범위 탐색/전체 인덱스 스캔의 차이 |
| UK/UNIQUE | R03/W10 등에 있음 | UK 검색과 제약/인덱스/NOT NULL의 차이, 중복·NULL 관측을 연결 |
| 커버링 인덱스 | R05에 있음 | 검색 결과0 문제, 선택 열과 PK 재조회/ICP/전체 스캔의 차이를 시각화 |
| SQL UNION/UNION ALL | R07 검산 SQL에서 사용하지만 독립 입문 설명 부족 | 중복 제거/보존·호환 열·선택 기준·JOIN과 차이를 학습 단위로 추가. Union-Find와 검색 의미 분리 |
| Value Object·DTO·Entity | S22/J02/W09/P20 등 역할 설명 있음 | 같은 필드를 가진 타입이라도 의미·식별성·공개 경계가 다름을 같은 요청으로 연결 |
| DTO→Entity 저장 | 요청/생성/저장 예시가 있음 | 입력값·인증값·조회값·서버 생성값을 구분한 뒤 업무 객체 생성/변경을 결정 |
| Entity 직접 응답을 피하는 이유 | W09에 lazy·순환·노출·API 결합·쿼리 비용 설명 있음 | Entity/DTO 응답의 같은 데이터 비교와 OSIV/실제 HTTP 경계 관측 |

## 실제 확인한 검색 문제

Chrome에서16개 검색어를 실제 입력·제출해 화면 결과를 읽었다.

- `B-Tree`는 찾지만 `btree`는0개.
- `복합 인덱스`는 찾지만 `복합인덱스`는0개.
- `UK`, `커버링 인덱스`, `UNION ALL`, `value object`는0개.
- `UNION`은 SQL 자료 대신 J22 Union-Find만 나온다.
- `서비스에 뭘 써야 해`, `글 하나에 댓글 여러 개`는0개.

전체 개념명/별칭/제안 질문의 검색 행렬도 생성 HTML·실제 컨트롤러 조건으로 재현했다. 실제 브라우저16건과 결과 집합이 같은지 대조했다. 이 행렬은 모든 질문을 브라우저에 직접 입력한 결과가 아니며, 질문 작성 방식에 영향을 받으므로 사용자 탐색 성공률 점수로 해석하지 않는다.

## 실제 시각 조사

- 공개134문서 × 데스크톱/모바일/핵심 절3상태 =402장.
- 진행 중23문서 × 같은3상태 =69장.
- 목록·검색·P10 재검토6장을 포함해 JPEG477장 보존.
- 담당 Luna는 자기 문서의 캡처를 실제 이미지로 열어 검토했다. 메인은 핵심 쟁점과 상충 판정을 재검토했다.

공통 문제는 문서가 없는 것이 아니라 **목차/요약 뒤 핵심이 접혀 있거나 긴 설명 중심이라 값과 동작이 눈에 보이지 않는 것**이다. 보강 화면은 실제 상태 비교가 추가됐지만 어려운 환경 설명이나 작은 그림 라벨의 부담도 별도로 남는다.

P10은390px에서 긴 제목이 잘리는 것을 재확인했다. body 너비는468인데 overflow-x:clip이어서 documentElement 너비390만 검사하면 놓치는 문제였다.

**이 조사는 문서당 관찰한3상태의 시각 판정이다. 모든 하위 화면·버튼·키보드·전체 스크롤·학습자의 이해도를 검증했다는 뜻이 아니다.** 문서별 보완 제안과 미검증 범위를 따로 적었다.

## 메인이 추가로 확인한 기술 경계

일회용 MySQL8.4.11에서 UNIQUE/NULL, 중복 제약 오류, UNION/UNION ALL, 복합·커버링·비커버링·선두 열 없는 인덱스 접근, EXPLAIN/ANALYZE를 실제 확인했다. 생성/조회 자료는 합성 데이터이며 기존 개발 DB와 분리했다. 인덱스 사용 유무만으로 효율을 판단하지 않고, 실행계획의 접근 방식과 실제 관측을 구분했다.

- $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/SQL-INDEX-UNIQUE-UNION.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/SQL-INDEX-UNIQUE-UNION.md`)
- $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/DTO-ENTITY-VALUE-OBJECT.md (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/reviews/DTO-ENTITY-VALUE-OBJECT.md`)

## 먼저 교정할 설명

P20 치트시트318행은 `final·무인자 생성자 금지`라고 쓰지만 같은 문서9/15행과 Jakarta Persistence 명세는 public/protected 무인자 생성자를 요구한다. 이 항목은 단순 시각 보완과 구분해 **부정확/P0**로 추가 판정했다. 원문 자체는 이번 조사에서 수정하지 않았다.

## 보완 우선순위

1. 개념명 없이도 요구/증상에서 시작하는 학습 경로와 선수 링크.
2. SQL UNION/ALL의 독립 설명·선택·실습, 표기/동음이의어 검색 교정.
3. DTO·VO·Entity·Service·SQL·DB 행을 한 데이터로 잇는 학습 경로.
4. 인덱스 페이지·복합 키·커버링/ICP 비교의 의미 장면.
5. 핵심을 숨기는 접기 구조와 모바일 잘림, 첫 화면의 용어 부담.
6. 이미 있는 티켓/시나리오/부분 보강을 재사용해 실제 업무와 검증을 연결.
7. 이후 메시징/비동기/운영/보안의 심화 실험을 단계적으로 연결.

멱등성 키, Expand/Contract, JPA/MyBatis flush를 새 누락으로 제안한 후보는 기존 T-026,9-5,10-12 자료와 대조해 **기존 자료 재사용/연결**로 분류했다. 후보 목록을 새 문서 제작 목록으로 그대로 쓰지 않는다.

## 검증과 한계

재검증 명령과 결과는 $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/COMPLETION.md 에 있다. 공식 근거와 확인 날짜/버전/접근 한계는 $WORKTREE_ROOT/concept-census-20261021/audits/concept-census-20261021/sources/ 에 분야별로 기록했다. 이전 조사에서 실제 수집한 출처를 재사용한 경우에는 새로 fetch했다고 표시하지 않았다.

이번에는 조사 목록과 근거를 만들었다. 학습 화면·정답·서버 코드를 대신 수정하지 않았으며 실제 학습자에게 과제를 수행시켜 숙련도를 판정하지 않았다. 전수라는 범위는 개념 카탈로그134문서와 그 의미 단위이고, 모든 시나리오/티켓 전문을 별도 전수 감사했다는 뜻은 아니다.
