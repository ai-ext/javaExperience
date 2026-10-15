# 학습 화면 이미지 시안과 구현 대조

이번 시안은 내장 `imagegen`으로 만든 실제 래스터 이미지다. 기존 StudyMate 스타일 이미지는 시각적 참고로만 사용했다. 이미지의 작은 본문·예제 코드는 자동 생성된 배치 예시이며 기술 사실의 근거가 아니다. 화면에 들어가는 사실·코드·링크는 저장소의 시나리오·정답·공부자료 원문에서만 가져온다.

| 시안 | 화면에서 검토할 배치 | 구현 대조 |
| --- | --- | --- |
| [Hibernate 공부자료](hibernate-knowledge-screen-v1.png) | 버전 4개 카드, `왜 바뀌었나`/`실무에서 확인`, 원문 표 접기, 근거 링크, JPA 경로, 모바일 1열 | S09의 버전 표를 원문 기반 카드로 변환한다. P19·P20·S09·S10 JPA 경로 그림은 기존 구현을 유지한다. |
| [시나리오 전체 코드](scenario-code-workbench-v1.png) | 역할별 파일 목록, 선택한 파일의 구문 강조 코드, 변경 파일/현재 전체 코드, 모바일 역할 칩 | 101개 단계의 답안·누적 스냅샷과 대조해 표시한다. 이미지 속 예제 코드를 복사하지 않는다. |
| [JPA Entity·DB 행 여정](jpa-entity-db-journey-v1.png) | 게시글 한 건의 DB 행과 Java 객체를 구분하고 조회·수정·flush·commit/rollback 결과를 나란히 본다 | S09 상단에 `id=42` 단계별 값 비교를 **부분 적용**했다. 다른 화면에 같은 시안을 그대로 이식하지는 않았다. |
| [P20 Order 매핑 시안](p20-order-entity-mapping-v1.png) | 실제 P20의 `Order`·`OrderLine` 코드에서 `orders`·`order_lines` 행으로 필드와 외래 키를 연결하고, 생성 후 저장 흐름을 단계별로 보여 준다 | P20 상단의 객체·행 대응 화면에 **부분 적용**했다. 이미지의 ID·SQL은 실행 결과가 아닌 예시다. |
| [DB API→쿼리 여정 초안](db-api-query-journey-draft-v1.png) | 요청, SQL 유도, 실행 계획, 응답을 한 줄로 잇고 우측에 인덱스 전후 관찰을 둔다 | **미적용 초안.** 배치 가능성만 검토한다. 이미지의 SQL·테이블·API 파라미터·막대 수치는 실제 레포와 다르므로 구현 원본으로 쓰지 않는다. |
| [DB-01 텍스트 없는 화면 시안](db-01-query-workspace-mockup-v1.png) | 응답 필드 → 관계 → 조건 → 행을 4단으로 묶고 아래에 SQL과 결과 행을 병렬 배치한다 | DB-01 원문에 4단 흐름과 SQL·행 비교를 **부분 적용**했다. 밝은 셸·측면 코치·같은 뷰포트 비교는 미완료다. |
| [DB-02 커서 경계 화면 시안](db-02-cursor-query-mockup-v1.png) | API → 결과 행 → 마지막 행의 커서 → 다음 SQL을 4단으로 연결하고 하단에 SQL·페이지 전환을 둔다 | 텍스트 없는 배치 시안이다. 실제 값·경로·SQL은 M1과 시드에서 따로 확정했다. HTML과 같은 뷰포트 대조는 진행 중이다. |
| [DB-03 상세 JOIN 시안](db-03-detail-join-mockup-v1.png) | 필수 board/member 선과 선택 좋아요/북마크 점선을 한 글의 결과 행으로 모은다 | 구조 참고 시안이다. 글 145·viewer 7의 실제 관계와 SQL은 시드에서 확인하고 구현한다. |
| [DB-06 NOT EXISTS 시안](db-06-exists-mockup-v1.png) | 좋아요 행과 북마크 행을 짝짓고 남는 행, 별도의 NULL 함정을 보여 준다 | 구조 참고 시안이다. 이미지의 임의 행을 실제 practice 정답으로 읽지 않도록 원문과 구분한다. |
| [DB 인덱스 실험 초안](db-index-experiment-draft-v1.png) | 같은 `GET /api/me/likes`를 기존·인덱스 추가·INVISIBLE 상태로 비교하고, 추정 계획과 실제 실행을 분리하며 DBeaver를 관찰 경로 밖에 둔다 | 9-2에 3상태·계획/실측 탭·기록란을 **부분 적용**했다. 실제 화면은 어두운 테마이며 모바일 시안 대조와 실제 API 실행은 남았다. |

| [DB-04 태그 JOIN 시안](db-04-tag-join-mockup-v1.png) | 글 하나에서 조건 태그 둘로 갈라진 행과 EXISTS 한 행 비교 | 실제 글 2의 두 태그를 seed와 대조했다. 화면에는 JOIN 중복과 EXISTS 결과를 구현했고 같은 뷰포트 캡처 비교는 대기한다. |
| [DB-05 집계 행 곱셈 시안](db-05-aggregate-mockup-v1.png) | 좋아요·댓글의 원시 JOIN과 사전 집계의 대비 | 이미지의 아이콘 개수는 기술 수치가 아니다. 화면은 별도 합성 데이터 2×3=6으로 정확한 행 수를 설명한다. |
| [DB-07 다섯 쿼리 방식 시안](db-07-query-styles-mockup-v1.png) | 하나의 API가 다섯 구현 방식으로 갈라져 동일 응답으로 모인다 | 이 이미지의 코드는 추상 획이다. L12~L14 복원 실습과 루트 앱 구현 범위를 별도로 표시한다. |
| [DB-12 JOIN·EXISTS 계획 비교 시안](db-12-join-exists-plan-mockup-v1.png) | 두 SQL의 결과 동일성 점검 후 실행 계획을 비교한다 | 이미지 막대는 측정치가 아니다. 쿼리 결과·계획은 실제 MySQL에서 직접 기록한다. |
| [DB-13 N+1 추적 시안](db-13-n-plus-one-trace-mockup-v1.png) | GET 요청의 계층 흐름과 반복 SQL 대 일괄 조회를 비교한다 | 시안의 반복 수·막대는 설명 배치다. M1 실제 쿼리 횟수는 아직 계측하지 않았다. |

## 이미지 생성 지시

- **Hibernate 시안:** 기존 학습 화면의 흰색·남색·파란색 시각 언어를 참고한다. S09 `5. 버전별 변화`의 4개 행을 버전별 카드로 재배치하고 변화 이유/실무 확인을 나눈다. 원문 표·근거는 펼쳐 볼 수 있게 두고, JPA 실행 경로와 DBeaver의 별도 MySQL 직접 접속 경로, 코드 탭, 모바일 형태를 함께 보여준다. 버전명은 Hibernate 6.0·7.0·7.4, Spring Boot 4.1.1 기준만 사용한다. 생성 중 근거 없는 연도가 들어가 2차 편집으로 제거했다.
- **코드 시안:** 같은 시각 언어로 `POST /api/posts`의 펼친 `전체 구현 코드`를 설계한다. Browser → Controller → Request DTO → Service → Repository/JPA → MySQL, 역할별 파일 탐색기, 구문 강조 코드·복사·설명 레일, 변경 파일과 누적 코드 선택, 모바일 역할 칩을 보여준다. 코드는 배치 예시로만 사용한다.
- **JPA 시안:** `post.id=42`, 제목 `첫 글 → 수정된 글` 한 행을 고정해 `EntityManager.find`의 SELECT, 컨텍스트가 추적하는 Entity와 원본 스냅샷, setter 이후 메모리 변경, flush의 SQL 실행, commit 뒤 별도 연결에서 확인한 결과를 시각화한다. rollback은 commit의 다음 단계가 아니라 flush 뒤의 **다른 선택**이다. 실제 화면에서 DBeaver/CloudBeaver의 별도 연결과 트랜잭션 내 값·타 연결 관찰 값을 정확히 구분한다. 이미지의 작은 글자와 SQL은 설명 배치 예시이며 실행 증거가 아니다.
- **P20 시안:** 먼저 Post 예시로 생성했으나 P20 원문이 `Order`·`OrderLine` 예제라는 것을 확인해 두 번째 imagegen 편집으로 바로잡았다. 최종 시안은 `Order.id`·`ordererName`과 `orders`의 열, `OrderLine.order`와 `order_lines.order_id`, 부모·자식 예시 행을 연결한다. `lines` 컬렉션이 `orders`의 단일 열이 아니라는 점, `EntityManager`·Hibernate·DBeaver의 서로 다른 역할, `persist` 뒤 트랜잭션과 commit 이후 관찰을 구분한다. **시안 작은 코드의 `OrderLine extends BaseEntity`와 `flush에서만 INSERT`처럼 읽힐 수 있는 표현은 P20 원문과 다르므로 실제 HTML에 복제하지 않는다.** `OrderLine`은 별도 엔티티이며, IDENTITY 식별자는 `persist` 때 INSERT가 먼저 실행될 수 있다. 시안의 SQL·숫자는 예시이고 문서 코드 및 DB 동작의 근거는 아니다.
- **DB API→쿼리 초안:** 내장 `imagegen`으로 `GET /api/boards/dev/posts`의 요청→SQL→계획→응답 레이아웃을 탐색했다. 생성 이미지에 `page/offset`, `posts`, `board_type`, 임의의 EXPLAIN 수치가 들어갔다. 실제 연습 계약은 `size/cursor`이고 스키마·실행 계획은 원문과 DB 실행 결과로 다시 확정해야 한다. 따라서 이 이미지는 `draft`로 두고, 정확한 데이터·레이블을 넣은 후속 시안과 같은 뷰포트의 실제 HTML 캡처가 나오기 전에는 적용·검증 상태를 올리지 않는다.
- **DB-01 텍스트 없는 화면 시안:** 내장 `imagegen`으로 구체적 코드·수치를 그리지 않고 4단 학습 경로, 하단 SQL·DB 결과, 우측 도움말의 배치를 탐색했다. 실제 DB-01 문서에는 M1 계약과 practice seed에서 확인한 경로·값을 사용한다. 시안의 시각적 위계와 밝은 전체 배치까지 동일하게 반영한 상태는 아니며, 브라우저 캡처 비교 후 차이를 추적한다.
- **DB-02 커서 경계 시안:** 텍스트를 넣은 첫 imagegen 결과에는 현재 프로젝트와 다른 `posts` 테이블, 2024년 날짜, `id`만 쓰는 커서 조건이 섞여 있어 버렸다. 최종 텍스트 없는 시안은 4단 배치만 참고한다. 실제 화면은 `post` 테이블과 `(published_at,id)` 커서, practice seed의 2026년 10월 행을 원문에서 가져온다.
- **DB 인덱스 실험 초안:** 내장 `imagegen`으로 기존 인덱스, 새 인덱스, `INVISIBLE` 상태를 나란히 보는 구성을 만들었다. B-tree와 행 읽기 표현, `EXPLAIN`/`EXPLAIN ANALYZE` 분리, 별도 DBeaver 관찰 위치는 설계 후보이다. 이미지가 표시한 개선·동일 응답·읽은 행 수는 측정하지 않았으므로 실제 SQL과 DB 실행 결과로 확인하고, 눈에 보이는 상태 변경이 DB 스키마에 어떤 영향을 주는지도 명시한 다음에만 구현한다.

## 검증 원칙

이미지와 실제 HTML을 데스크톱·360px에서 나란히 확인한다. 원문 표, 인용 링크, 정답 코드, 내부 앵커는 시안 적용 뒤에도 유지한다. 실제 Spring Boot 호출을 계측하지 않은 흐름에는 예상 흐름이라고 명시한다.
