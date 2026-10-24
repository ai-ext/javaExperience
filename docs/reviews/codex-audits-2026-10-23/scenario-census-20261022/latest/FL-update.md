# 최신 기능형 과제 — update

원문: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/update-post.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/update-post.md)

기준 worktree: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

작성자가 보낸 값만 검증해 바꾸고, 생략·null·빈 태그 배열의 의미를 구분합니다.

`PATCH /api/posts/{id}`

1. 글을 찾고 canView 실패를 404로 처리한 다음 작성자 여부를 검사합니다.
2. 제목·본문·태그·공개 범위가 non-null일 때만 제공된 validate helper로 검사합니다.
3. 검사한 값만 changeTitle/changeContent/replaceTags/changeVisibility로 변경합니다.
4. tags가 []이면 연결을 비웁니다. null이나 생략이면 태그를 유지합니다.
5. 성공한 요청은 빈 객체여도 touchUpdatedAt(now)를 호출하고 필요한 연관을 읽어 Post를 반환합니다.

## 완료 조건과 검사 방법

- 보낸 non-null 값만 변경되고 생략/null인 필드는 유지됩니다.
  - 확인: 요청·DB: title을 직접 정한 값으로 보내 비교하고, 다른 필드는 생략/null인 별도 요청으로 유지되는지 확인합니다.

- tags=[]는 post_tag 연결만 없애며 기존 tag 행은 삭제하지 않습니다.
  - 확인: 요청·DB: [] 전후에 아래 태그 연결과 tag 원본 SELECT를 기록해 연결만 사라졌는지 봅니다.

- canView → 작성자 순서로 검사합니다. ADMIN도 남의 글 수정 권한은 없습니다.
  - 확인: 권한 요청: 공개 글을 볼 수 있고 양방향 차단이 없는 다른 활성 회원 토큰으로 PATCH하면 403입니다. 예제의 김자바 글은 tok-lee로 비교할 수 있습니다. 볼 수 없는 글은 먼저 404입니다. ADMIN도 남의 글 PATCH를 허용하는 조건을 넣지 않습니다.

- 나중 필드 검증이 실패해도 앞서 바꾼 객체 값을 DB에 일부 저장하지 않습니다.
  - 확인: 실패 요청·DB: {"title":"실패 전 변경","content":"   "}를 보내 400을 확인합니다. 요청 전후 SELECT의 title·content·updated_at이 같은지 봅니다. Java 객체의 자동 원복을 채점하지 않습니다.

- {}와 all-null 성공 요청도 updated_at은 갱신하고 조회수는 올리지 않습니다.
  - 확인: 요청·DB: {}를 보내 200을 확인하고 updated_at 대입과 조회수 유지를 봅니다. 시각 정밀도에 따라 전후 시각이 같을 수 있으므로 항상 큰 값이라고 채점하지 않습니다.

## 실패·한계

{
  "400": "검증 실패(첫 필드 오류) 또는 JSON·타입 오류",
  "401": "인증 없음·오류",
  "403": "비활성 회원 또는 볼 수 있으나 작성자 아님",
  "404": "없는 글·삭제 글·볼 수 없는 글"
}

- updated_at은 서버 현재 시각입니다. 화면의 t1>t0는 설명 가정이며, 실제 updated_at이 항상 이전과 다른 시각임을 보장하지 않습니다.
- 검증 오류의 errors와 JSON 파싱 오류 응답은 형태가 같다고 가정하지 않습니다.

## 추가 개발 판단

기존 reference에 PATCH 실패 rollback 실행 기록이 있다. 새로 없다고 만들지 말고 자동 영구 회귀로 연결한다. 같은 초 안의 updated_at은 초 정밀도 DB에서 같을 수 있음을 유지한다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/update-post/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/update-post/screen.jpg)
