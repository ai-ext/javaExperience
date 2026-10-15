# 학습 화면 이미지 시안과 구현 대조

이번 시안은 내장 `imagegen`으로 만든 실제 래스터 이미지다. 기존 StudyMate 스타일 이미지는 시각적 참고로만 사용했다. 이미지의 작은 본문·예제 코드는 자동 생성된 배치 예시이며 기술 사실의 근거가 아니다. 화면에 들어가는 사실·코드·링크는 저장소의 시나리오·정답·공부자료 원문에서만 가져온다.

| 시안 | 화면에서 검토할 배치 | 구현 대조 |
| --- | --- | --- |
| [Hibernate 공부자료](hibernate-knowledge-screen-v1.png) | 버전 4개 카드, `왜 바뀌었나`/`실무에서 확인`, 원문 표 접기, 근거 링크, JPA 경로, 모바일 1열 | S09의 버전 표를 원문 기반 카드로 변환한다. P19·P20·S09·S10 JPA 경로 그림은 기존 구현을 유지한다. |
| [시나리오 전체 코드](scenario-code-workbench-v1.png) | 역할별 파일 목록, 선택한 파일의 구문 강조 코드, 변경 파일/현재 전체 코드, 모바일 역할 칩 | 101개 단계의 답안·누적 스냅샷과 대조해 표시한다. 이미지 속 예제 코드를 복사하지 않는다. |
| [JPA Entity·DB 행 여정](jpa-entity-db-journey-v1.png) | 게시글 한 건의 DB 행과 Java 객체를 구분하고 조회·수정·flush·commit/rollback 결과를 나란히 본다 | S09 상단에 `id=42` 단계별 값 비교를 **부분 적용**했다. 다른 화면에 같은 시안을 그대로 이식하지는 않았다. |
| [P20 Order 매핑 시안](p20-order-entity-mapping-v1.png) | 실제 P20의 `Order`·`OrderLine` 코드에서 `orders`·`order_lines` 행으로 필드와 외래 키를 연결하고, 생성 후 저장 흐름을 단계별로 보여 준다 | P20 상단의 객체·행 대응 화면에 **부분 적용**했다. 이미지의 ID·SQL은 실행 결과가 아닌 예시다. |

## 이미지 생성 지시

- **Hibernate 시안:** 기존 학습 화면의 흰색·남색·파란색 시각 언어를 참고한다. S09 `5. 버전별 변화`의 4개 행을 버전별 카드로 재배치하고 변화 이유/실무 확인을 나눈다. 원문 표·근거는 펼쳐 볼 수 있게 두고, JPA 실행 경로와 DBeaver의 별도 MySQL 직접 접속 경로, 코드 탭, 모바일 형태를 함께 보여준다. 버전명은 Hibernate 6.0·7.0·7.4, Spring Boot 4.1.1 기준만 사용한다. 생성 중 근거 없는 연도가 들어가 2차 편집으로 제거했다.
- **코드 시안:** 같은 시각 언어로 `POST /api/posts`의 펼친 `전체 구현 코드`를 설계한다. Browser → Controller → Request DTO → Service → Repository/JPA → MySQL, 역할별 파일 탐색기, 구문 강조 코드·복사·설명 레일, 변경 파일과 누적 코드 선택, 모바일 역할 칩을 보여준다. 코드는 배치 예시로만 사용한다.
- **JPA 시안:** `post.id=42`, 제목 `첫 글 → 수정된 글` 한 행을 고정해 `EntityManager.find`의 SELECT, 컨텍스트가 추적하는 Entity와 원본 스냅샷, setter 이후 메모리 변경, flush의 SQL 실행, commit 뒤 별도 연결에서 확인한 결과를 시각화한다. rollback은 commit의 다음 단계가 아니라 flush 뒤의 **다른 선택**이다. 실제 화면에서 DBeaver/CloudBeaver의 별도 연결과 트랜잭션 내 값·타 연결 관찰 값을 정확히 구분한다. 이미지의 작은 글자와 SQL은 설명 배치 예시이며 실행 증거가 아니다.
- **P20 시안:** 먼저 Post 예시로 생성했으나 P20 원문이 `Order`·`OrderLine` 예제라는 것을 확인해 두 번째 imagegen 편집으로 바로잡았다. 최종 시안은 `Order.id`·`ordererName`과 `orders`의 열, `OrderLine.order`와 `order_lines.order_id`, 부모·자식 예시 행을 연결한다. `lines` 컬렉션이 `orders`의 단일 열이 아니라는 점, `EntityManager`·Hibernate·DBeaver의 서로 다른 역할, `persist` 뒤 트랜잭션과 commit 이후 관찰을 구분한다. **시안 작은 코드의 `OrderLine extends BaseEntity`와 `flush에서만 INSERT`처럼 읽힐 수 있는 표현은 P20 원문과 다르므로 실제 HTML에 복제하지 않는다.** `OrderLine`은 별도 엔티티이며, IDENTITY 식별자는 `persist` 때 INSERT가 먼저 실행될 수 있다. 시안의 SQL·숫자는 예시이고 문서 코드 및 DB 동작의 근거는 아니다.

## 검증 원칙

이미지와 실제 HTML을 데스크톱·360px에서 나란히 확인한다. 원문 표, 인용 링크, 정답 코드, 내부 앵커는 시안 적용 뒤에도 유지한다. 실제 Spring Boot 호출을 계측하지 않은 흐름에는 예상 흐름이라고 명시한다.
