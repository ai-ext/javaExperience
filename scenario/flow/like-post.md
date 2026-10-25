# 좋아요 설정

다른 회원이 작성한 새 PUBLIC 글에 좋아요를 설정합니다. 같은 PUT을 다시 보내도 관계를 추가하거나 상태를 뒤집지 않습니다. 현재 구현은 순차 요청의 상태 설정이며 동시성은 별도 4-2 확장입니다.

- API: PUT /api/posts/{id}/like, 본문 없음, 성공200.
- 수정: src/main/java/org/example/like/LikeService.java의 like 메서드 본문.
- 시작: 기존 CRUD를 유지하는 [추가 자료](packages/like/like-extension.zip). 새 파일6개와 작은 patch만 추가합니다.
- 중간 합류: [새 폴더용 시작 ZIP](packages/like/like.zip). 기존 프로젝트 위에 풀지 않습니다.
- 데이터: 앞에서 삭제한 CRUD id가 아닌, 다른 회원이 새로 작성한 실제 응답 id를 사용합니다. 교육용 작성 tok-park, 좋아요 tok-kimjava를 직접 입력합니다.
- 완료: 내 관계 한 행과 카운터 증가를 함께 확인하고, 두 번째 PUT의 값 유지와 다른 회원의 관계 보존을 비교합니다.
- 실패: 본인 글400, 인증401, 정지403, 없는/보이지 않는/미발행/삭제 글404를 구분합니다.

정본은 [4-1 manifest](../snapshots/4-1.json)의 files[].blob이며 [전체 원문](../ch4-like/4-1-like-toggle.md)을 보존합니다. 응답은 postId·liked·likeCount이고, 개인 liked는 Post 필드가 아닌 관계의 존재를 표현합니다. 실제 서버 응답과 설명용 시각화는 구분합니다.

[다음 기능 · 좋아요 취소](unlike-post.md)
