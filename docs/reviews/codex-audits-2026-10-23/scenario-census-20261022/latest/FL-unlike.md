# 최신 기능형 과제 — unlike

원문: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/unlike-post.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/unlike-post.md)

기준 worktree: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

내 관계만 지우고 숫자를 한 번 줄이며, 이미 취소한 요청은 추가 변경하지 않습니다.

`DELETE /api/posts/{id}/like`

1. findLikeablePost로 볼 수 있는 PUBLISHED 글인지 확인합니다.
2. postId와 인증 회원 id의 관계가 있을 때만 그 관계를 삭제합니다.
3. 실제 관계를 삭제한 경우에만 decreaseLikeCount를 함께 호출합니다.
4. liked=false와 현재 카운트를 반환합니다. 이미 관계가 없으면 숫자를 다시 줄이지 않습니다.

## 완료 조건과 검사 방법

- DELETE와 재요청 모두200·liked=false이며 추가 감소하지 않습니다.
  - 확인: 같은 id·회원의 DELETE 두 응답과 각각의 DB 카운트를 비교합니다.

- 내 관계만 없어지고 다른 회원의 관계와 게시글은 남습니다.
  - 확인: post_like의 post_id+member_id로 내 행만 사라졌는지, 다른 행의 id·시각이 같은지 확인합니다.

- 가시성·PUBLISHED를 먼저 검사하고 PUT의 본인 글400 규칙을 복사하지 않습니다.
  - 확인: 별도 본인 글의 관계 없는 DELETE200과 숨겨진 글404를 비교합니다.

- 관계 삭제와 숫자 감소가 함께 확정되거나 취소됩니다.
  - 확인: 같은 @Transactional 경계를 검토하고 별도 일회용 DB에서 카운터 동기화 실패 뒤 관계 보존을 확인합니다.

## 실패·한계

{
  "400": "숫자가 아닌 id",
  "401": "인증 없음·유효하지 않은 토큰",
  "403": "비활성 회원",
  "404": "없는 글·삭제 글·볼 수 없는 글·PUBLISHED 아님"
}

- 순차 재요청의 상태 설정입니다. 동시 요청의 전체 정합성은 다음4-2 확장입니다.
- 개인 liked와 전체 likeCount는 다릅니다.
- SQL은 별도 검산용이며 Hibernate의 전체 SQL 로그가 아닙니다.

## 추가 개발 판단

내 관계만 제거하고 타인 관계의id/created_at을 유지하는 검사를 한다. 관계가 없는 본인 글 DELETE는200이라는 계약을 PUT의본인글400과혼동하지 않는다. 동시 취소와쓰기경합은4-2후속이다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/unlike-post/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/unlike-post/screen.jpg)
