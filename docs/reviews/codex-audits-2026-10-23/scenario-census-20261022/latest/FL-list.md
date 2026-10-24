# 최신 기능형 과제 — list

원문: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/list-posts.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/list-posts.md)

기준 worktree: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

볼 수 있는 게시글을 최신순 한 페이지로 반환하고 전체 건수와 다음 페이지 여부를 알려줍니다.

`GET /api/boards/{slug}/posts`

1. boardSlug로 게시판을 찾고 없으면 404 예외를 던집니다.
2. viewer가 없으면 viewerId=null로 정합니다.
3. publishedAt DESC, id DESC 순서의 PageRequest를 만듭니다.
4. 제공된 findViewableByBoard와 countViewableByBoard를 같은 조건으로 모두 호출합니다.
5. toListItem과 PostListResponse로 items·page·size·totalElements·totalPages·hasNext를 반환합니다.

## 완료 조건과 검사 방법

- 200과 items·페이지 메타데이터를 반환하고 본문 content는 목록 항목에서 제외합니다.
  - 확인: 응답: items와 페이지 메타데이터를 보고 각 items에 content가 없는지 확인합니다.

- PUBLISHED·미삭제·게시판·공개/본인/팔로우·양방향 차단 조건을 DB 쿼리에 적용합니다.
  - 확인: 조건 비교: 아래 SQL에서 API와 같은 viewerId·boardSlug로 검산합니다. 익명/본인/팔로우/양방향 차단별 fixture가 없으면 코드 대조까지만 한 상태입니다.

- publishedAt DESC, id DESC로 정렬하고 같은 조건의 전체 건수를 구합니다.
  - 확인: DB·응답: 같은 조건 COUNT와 정렬 id를 비교합니다. page=0/size=1 뒤 page=1/size=1을 각각 요청해 순서·hasNext도 봅니다.

- 목록 조회는 글의 조회수·시각·내용을 변경하지 않습니다.
  - 확인: DB: 목록 요청 전·후의 글 한 행이 같은지 비교합니다. 비교를 위해 상세 GET을 호출하면 그 GET이 조회수를 쓰므로 사용하지 않습니다.

## 실패·한계

{
  "400": "page<0 또는 size가 1..50 밖",
  "404": "게시판 없음",
  "401/403": "선택 토큰 오류·비활성 회원"
}

- 기존 2-2의 시드 14건은 최종 3-2의 고정 결과가 아닙니다.
- author JOIN FETCH와 태그 배치 로딩은 제공됩니다. 실측 없이 쿼리 수나 속도를 고정하지 않습니다.

## 추가 개발 판단

가시성 WHERE와 count가 같은 조건인지 비교하고 두 페이지의 동률/경계 반례를 추가한다. 제공된 fetch join/배치 로딩을 직접 설계한 역량과 분리한다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/list-posts/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/list-posts/screen.jpg)
