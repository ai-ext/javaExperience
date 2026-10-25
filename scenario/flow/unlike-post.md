# 좋아요 취소

같은 글과 같은 회원의 좋아요를 취소합니다. 관계가 있을 때만 그 행을 제거하고 전체 카운터를 줄입니다. 이미 관계가 없으면 추가 감소하지 않습니다.

- API: DELETE /api/posts/{id}/like, 본문 없음, 성공200. 게시글 삭제204와 구별합니다.
- 수정: src/main/java/org/example/like/LikeService.java의 unlike 메서드 본문.
- 시작: 앞에서 추가한 파일과 같은 프로젝트·서버·DB를 유지합니다. LikeService 전체를 덮어쓰지 않습니다.
- 중간 합류: [새 폴더용 시작 ZIP](packages/like/unlike.zip)은 like 구현을 제공하고 unlike만 미구현입니다.
- 데이터: 앞에서 좋아요 성공을 확인한 글 id를 이어 쓰며 토큰은 다시 직접 입력합니다. 새 페이지에서 자동 전송하지 않습니다.
- 완료: DELETE 두 번의200·liked=false·likeCount와 직접 SQL을 비교합니다. 내 관계만 제거되고 다른 회원의 관계 id·시각과 글은 유지되어야 합니다.
- 권한: canView와 PUBLISHED를 먼저 확인합니다. PUT의 본인 글400 검사를 복사하지 않습니다. 관계 없는 본인 글 DELETE는200·false입니다.

정본은 [4-1 manifest](../snapshots/4-1.json)입니다. 관계 삭제와 카운터 변경은 같은 트랜잭션이고 실패 시 DB 변경을 함께 취소합니다. Java 객체의 자동 원복이나 모든 동시 요청의 정합성을 보장한다는 뜻은 아닙니다. [원문](../ch4-like/4-1-like-toggle.md)과 [다음 동시성 확장](../ch4-like/4-2-like-concurrency.md)을 보존합니다.
