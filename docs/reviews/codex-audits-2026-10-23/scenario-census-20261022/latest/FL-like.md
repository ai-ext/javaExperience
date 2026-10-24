# 최신 기능형 과제 — like

원문: $WORKTREE_ROOT/scenario-crud-redesign/scenario/flow/like-post.md (기록 경로: `$WORKTREE_ROOT/scenario-crud-redesign/scenario/flow/like-post.md`)

기준 worktree: $WORKTREE_ROOT/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

같은 요청을 다시 보내도 내 좋아요 관계 한 행과 전체 숫자를 한 번만 바꿉니다.

`PUT /api/posts/{id}/like`

1. findLikeablePost로 볼 수 있는 PUBLISHED 글인지 확인합니다.
2. 작성자 본인이면 SelfLikeNotAllowedException으로 400을 응답합니다.
3. postId와 인증 회원 id의 관계가 없을 때만 PostLike를 저장하고 increaseLikeCount를 함께 호출합니다.
4. 같은 트랜잭션에서 변경 후 카운트와 liked=true를 반환합니다. 이미 관계가 있으면 추가 쓰기를 하지 않습니다.

## 완료 조건과 검사 방법

- PUT을 반복해도 좋아요 상태가 유지됩니다.
  - 확인: 같은 id·회원으로 PUT 두 번을 보내 두 응답의 postId·liked=true·likeCount를 비교합니다.

- 내 관계 한 행과 숫자 증가가 함께 저장되고 다른 회원의 관계는 유지됩니다.
  - 확인: 다른 회원의 관계가 있는 별도 사례에서 요청 전후 SQL로 내 관계 수와 전체 COUNT·like_count, 타회원 행의 id·시각을 비교합니다. 0행만으로 타회원 보존을 확인했다고 처리하지 않습니다.

- 본인 글400과 인증·회원 상태·가시성 실패를 구별합니다.
  - 확인: 본인 글은 별도 작성 응답 id로 확인하고, 실패 요청이 DB를 변경하지 않았는지 비교합니다.

- 관계 저장 또는 카운터 동기화 실패 때 DB 일부만 남지 않습니다.
  - 확인: @Transactional과 같은 경계의 두 쓰기를 확인하고 별도 일회용 DB의 실패 주입 테스트로 rollback을 확인합니다. 성공200 한 번으로 체크하지 않습니다.

## 실패·한계

{
  "400": "본인 글 좋아요 또는 숫자가 아닌 id",
  "401": "인증 없음·유효하지 않은 토큰",
  "403": "비활성 회원",
  "404": "없는 글·삭제 글·볼 수 없는 글·PUBLISHED 아님"
}

- 순차 재요청의 상태 설정입니다. 동시 요청의 전체 정합성은 다음4-2 확장입니다.
- 개인 liked와 전체 likeCount는 다릅니다.
- SQL은 별도 검산용이며 Hibernate의 전체 SQL 로그가 아닙니다.

## 추가 개발 판단

순차 PUT 멱등과 관계/카운터 원자성을 구분한다. 다른 회원 관계가0인 fixture만으로 타인 보존을 통과시키지 않는다. 동시성은4-2/X09로 이어간다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/like-post/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/like-post/screen.jpg`)
