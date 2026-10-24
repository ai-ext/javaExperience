# 최신 기능형 과제 — create

원문: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/create-post.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/create-post.md)

기준 worktree: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign. 화면/현행 소스 확인 HEAD 9ce57dd9ba9c5961ebc7a65d30408e970990d57f. 기존225단위와 동일한 단계 원문을 재배치한 최신7개를 별도 대조했다. 독립 새 기능232개라는 뜻이 아니다.

## 과제와 직접 구현 범위

로그인한 회원의 글을 DB에 저장하고, 생성된 id와 글 정보를 201 응답으로 돌려줍니다.

`POST /api/posts`

1. boardSlug로 게시판을 찾고 없으면 BoardNotFoundException을 던집니다.
2. 인증 회원을 작성자로 연결하고 운영자 전용 게시판의 쓰기 권한을 검사합니다.
3. visibility가 null이면 PUBLIC으로 정하고, PUBLISHED·카운터 0인 Post를 만듭니다.
4. 제공된 resolveTags로 태그를 찾아 연결하고 postRepository.save로 저장합니다.
5. 트랜잭션 안에서 응답에 필요한 작성자·태그를 읽은 Post를 반환합니다.

## 완료 조건과 검사 방법

- 201과 Location: /api/posts/{capturedId}를 받고 body.id를 다음 과제에 전달합니다.
  - 확인: 요청·응답: 작성 토큰으로 전송해 201, Location과 body.id 일치를 확인합니다.

- 인증 작성자·게시판·본문·태그 연결이 저장되고 카운터 0, deleted_at NULL입니다.
  - 확인: DB: 아래 글 한 행·태그 연결 SELECT를 응답 id로 조회합니다.

- 글·새 태그·연결은 같은 트랜잭션입니다. 중간 실패 시 전체 저장이 취소됩니다.
  - 확인: 코드·실패 검증: create의 @Transactional과 태그/글 저장이 같은 경계인지 봅니다. 저장 중 실패를 재현하는 격리 통합 테스트가 필요하며 201 한 번으로 체크하지 않습니다.

- visibility 생략/null은 PUBLIC이며 유효하지 않은 DTO 입력은 400으로 처리됩니다.
  - 확인: 요청: visibility를 생략한 경우와 null인 경우 각각 PUBLIC인지 봅니다. title을 빈 문자열로 보낸 경우 400인지 별도로 확인합니다.

## 실패·한계

{
  "400": "빈 필수 필드·길이·공개 범위·깨진 JSON",
  "401": "토큰 없음·잘못된 형식·만료·폐기",
  "403": "비활성 회원 또는 게시판 쓰기 권한 없음",
  "404": "게시판 없음"
}

- POST 태그는 최대 5개, 원소는 null 불가·1~30자입니다. 정본 DTO에는 원소 @NotBlank가 없어 공백 문자열 검증이 PATCH와 다릅니다.
- IDENTITY의 INSERT와 id 할당은 commit 완료를 뜻하지 않습니다.

## 추가 개발 판단

새 태그 동시 생성(T-018)과 응답 유실 멱등(X10)으로 확장한다. 입력 검증/인증까지 학습자가 처음부터 설계한 것으로 채점하지 않는다. 제공된 부분과 직접 구현한 부분을 구분한다.

## 이번 확인과 검증 한계

메인이 실제 첫 화면과 DOM을 열어 구현할 메서드·해야 할 일·요청 결과 확인 진입을 보았다. 시작 코드의 미완성 메서드는 의도된 학습 부분이다. 설명용 상태와 서버 실측을 구분하는 문구가 있다. 전체 브라우저 조작/모바일/7개 API를 이번에 다시 실행한 결과는 아니다.

최신 계약·원문 보존·검증 안내·좋아요 데이터/모델 검사와 시각 정밀도 안내 검사6개 스크립트는 이번에 통과했다. 이는 화면/계약 검사이며 API 성능 검증이 아니다.

화면: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/create-post/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/create-post/screen.jpg)
