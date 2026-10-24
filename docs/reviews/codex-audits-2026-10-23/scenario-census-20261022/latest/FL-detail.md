# 최신 기능형 과제 — detail

원문: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/read-post.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/read-post.md)

기준 worktree: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

작성한 글의 상세를 반환하고, 볼 수 있는 글의 조회수만 1 증가시킵니다.

`GET /api/posts/{id}`

1. findById로 글을 찾고 없으면 PostNotFoundException을 던집니다.
2. 제공된 accessPolicy.canView를 먼저 검사하고 실패하면 조회수를 바꾸지 않고 404를 냅니다.
3. post.increaseViewCount를 호출합니다. 이 GET은 쓰기 트랜잭션입니다.
4. 제공된 toDetailResponse로 트랜잭션 안에서 작성자·태그를 DTO에 옮겨 반환합니다.

## 완료 조건과 검사 방법

- 가시성 검사를 통과한 글은 200 상세 DTO를 반환합니다.
  - 확인: 요청: 앞 작성 응답 id로 상세를 열고 글·작성자·태그를 비교합니다.

- 응답과 DB의 조회수는 요청 전 v에서 v+1이 됩니다. 연속 2회는 v+2입니다.
  - 확인: 전후 비교: DB 값을 기록하고 GET 한 번 뒤 v+1을 확인합니다. 다른 요청이 없는 상태에서 한 번 더 요청하면 v+2입니다.

- 없는 글·삭제 글·볼 수 없는 글은 404이며 조회수 변화가 없습니다.
  - 확인: 실패 요청: DB에서 없는 것으로 확인한 id로 404를 봅니다. 삭제·가시성 거절 시 조회수 증가가 없도록 canView 호출 순서를 코드에서 확인합니다. 기존 삭제/비공개 fixture가 있다면 해당 조회자로 검증하고, 새 글의 삭제 뒤 404는 마지막 과제에서 다시 확인합니다.

- 상세 GET은 updated_at·created_at·published_at을 바꾸지 않습니다.
  - 확인: DB: GET 전·후 같은 SELECT의 created_at·updated_at·published_at을 비교합니다.

## 실패·한계

{
  "400": "숫자가 아닌 id",
  "404": "없는 글·삭제된 글·canView 실패",
  "401/403": "선택 토큰의 인증 오류·비활성 회원"
}

- 현재 정본은 잠금·@Version 없는 객체 read-modify-write입니다. 동시 GET N건의 정확한 +N을 보장하지 않습니다.

## 추가 개발 판단

현재 read-modify-write 조회수의 동시성 한계는 명시되어 있다. T-017로 연결하고 동시 N건의 +N을 이 기초 과제의 기존 보장으로 주장하지 않는다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/read-post/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/read-post/screen.jpg)
