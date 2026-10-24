# 최신 기능형 과제 — delete

원문: $WORKTREE_ROOT/scenario-crud-redesign/scenario/flow/delete-post.md (기록 경로: `$WORKTREE_ROOT/scenario-crud-redesign/scenario/flow/delete-post.md`)

기준 worktree: $WORKTREE_ROOT/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

작성자 또는 권한 있는 운영자가 삭제 시각을 기록하고, 이후 상세와 목록에서 글을 제외합니다.

`DELETE /api/posts/{id}`

1. findById로 글을 찾고 canView 실패를 먼저 404로 처리합니다.
2. 인증 회원이 작성자 또는 ADMIN인지 검사하고 그 외는 PostForbiddenException을 던집니다.
3. post.delete(LocalDateTime.now())를 호출해 deletedAt과 updatedAt을 함께 변경합니다.
4. repository.delete나 연관 삭제를 호출하지 않습니다. Controller의 빈 204 응답을 확인합니다.
5. 삭제 후 같은 id의 상세·PATCH·DELETE 404와 목록 제외를 확인합니다.

## 완료 조건과 검사 방법

- 삭제 성공은 204이며 응답 본문이 없습니다.
  - 확인: 응답: 204와 본문 빈 문자열을 확인합니다. JSON 파싱 성공을 요구하지 않습니다.

- 행은 남고 deleted_at과 updated_at만 같은 now로 바뀝니다.
  - 확인: DB: 삭제 전후 글 한 행을 비교해 행 보존·두 시각 일치·다른 값 유지를 확인합니다.

- post_tag·tag·좋아요·댓글을 물리 삭제하지 않습니다.
  - 확인: DB·격리 테스트: 관계 수와 tag 원본을 전후 비교합니다. 관계가 원래 모두 0이면 Docker가 켜진 상태에서 ./gradlew test --tests org.example.post.PostDeleteControllerTest로 제공 검사를 실행합니다. Gradle이 test 프로필을 켜고 일회용 MySQL을 만듭니다. 이 검사는 Tx 내부 flush이며 별도 연결의 commit 관찰과 구분합니다.

- 삭제 뒤 상세/PATCH/재삭제는 404이고 목록에서 제외됩니다.
  - 확인: 후속 요청: 같은 id의 GET, PATCH {}, DELETE가 각각 404인지 확인하고, 같은 게시판 목록에서 그 id가 없는지 봅니다.

- canView → 작성자 또는 ADMIN 순서를 지킵니다.
  - 확인: 삭제 전 코드·권한 요청: canView 다음 작성자/ADMIN 검사 순서를 봅니다. 양방향 차단 없이 글을 볼 수 있는 다른 일반 회원은 403입니다. 예제의 김자바 글은 삭제 전에 tok-lee로 비교합니다. 접근할 수 없는 글은 먼저 404이며, 이미 삭제한 id에서도 403을 기대하지 않습니다.

## 실패·한계

{
  "401": "인증 없음·오류",
  "403": "비활성 회원 또는 볼 수 있으나 작성자/ADMIN 아님",
  "404": "없는 글·이미 삭제·볼 수 없는 글"
}

- 연관 행이 원래 0개라면 보존 검증이 충분하지 않습니다. 제공된 삭제 통합 테스트는 일회용 DB에 연결을 넣고 확인합니다.
- 삭제는 status=HIDDEN 변경과 다릅니다. status는 유지됩니다.

## 추가 개발 판단

실제 관계가 있는 글을 삭제해 post_tag/like/comment 보존과 상세/목록 제외를 확인한다. 기존 통합/edge 실행 기록이 있다. 휴지통/영구 삭제는11-5/15-4가 담당한다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/delete-post/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/delete-post/screen.jpg`)
