# 기능을 완성하는 게시글 시나리오

API 하나를 구현할 수 있는 학습자가 게시글 작성부터 삭제까지 실제 기능 다섯 개를 완성합니다. 각 과제의 화면에서 현재 요구사항·수정할 메서드·보낼 요청·완료 기준을 바로 확인하고 구현을 시작합니다. 예상 값 시각화의 상태 전환은 선택 기능이며 장표를 순서대로 통과할 필요가 없습니다.

| 과제 | 주 API | 이번 구현 메서드 | 성공 상태 |
|---|---|---|---|
| [게시글 작성](create-post.md) | `POST /api/posts` | `PostService.java.create` | 201 |
| [게시글 상세 조회](read-post.md) | `GET /api/posts/{id}` | `PostQueryService.java.getDetail` | 200 |
| [게시글 목록 조회](list-posts.md) | `GET /api/boards/{slug}/posts` | `PostQueryService.java.list` | 200 |
| [게시글 부분 수정](update-post.md) | `PATCH /api/posts/{id}` | `PostService.java.patch` | 200 |
| [게시글 삭제](delete-post.md) | `DELETE /api/posts/{id}` | `PostService.java.delete` | 204 |

## 같은 프로젝트와 DB로 이어가기

계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. 첫 POST 응답의 id를 기록하고 상세·수정·삭제에 사용합니다. 목록은 같은 게시판 dev를 조회합니다. 과제마다 새 DB를 만들거나 고정 id를 사용하지 않습니다.

시작 ZIP은 중간 합류를 위해 새 폴더에서 시작하는 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 않습니다. 진행 패키지에는 앞 과제의 구현만 포함되고 현재 및 이후 기능은 미구현입니다. 이번 과제의 범위는 표시된 Service 메서드 본문 하나이며, 이후 API의 미구현 오류는 현재 과제의 실패가 아닙니다.

Controller·DTO·인증·예외 처리·Repository·Entity·가시성 정책·검증 및 태그 helper는 공통으로 제공합니다. [참고 완성본](packages/reference.zip)은 [3-2 manifest](../snapshots/3-2.json)의 파일별 blob을 사용합니다. 기록된 commit의 Git tree와 통합 snapshot 파일은 다르므로 git archive로 대체하지 않습니다.

코드를 수정했다면 기존 bootRun 터미널에서 Ctrl+C로 앱만 종료하고 같은 프로젝트 폴더에서 `./gradlew bootRun`을 다시 실행합니다. DB·Compose·작성 응답 id는 유지합니다.

## 무엇을 직접 확인하나

- 작성: 저장·201·Location·생성 id
- 상세: 가시성 통과 후 조회수 v+1, 없는/숨겨진 글 404
- 목록: 같은 조건의 정렬·페이징·COUNT, DB 값 불변
- 수정: non-null 값만 변경, tags 생략/null 유지·[] 연결 해제
- 삭제: deleted_at·updated_at 갱신, 행/연결 보존, 일반 조회 제외

학습용 예상 장면과 실제 응답은 구분합니다. id·조회수·전체 건수·시각을 측정한 것처럼 고정하지 않습니다. 실제 서버 상태는 기본 미실행이며, 응답과 별도 DB 클라이언트의 새 SELECT를 각각 대조합니다. INSERT·flush·commit은 같은 시점이 아니고 rollback은 commit 다음 단계가 아닌 실패 분기입니다. 취소되는 것은 DB 변경이며 이미 바뀐 Java 객체의 자동 원복을 뜻하지 않습니다. 정적 설명은 기본 요청·태그 예시 범위이고 다른 요청 옵션은 계산된 모델과 비교합니다. t1>t0는 설명 가정이며 실제 수정 시각이 반드시 이전과 달라지는 것은 아닙니다.

## 원문과 확장 학습

기존 [전체 101단계](../README.md), 코드 정답, 앵커와 학생 서버 소스는 유지합니다. success만 반환하는 [첫 요청 입문](../ch1-create-post/1-1-receive-request.md)은 선택 준비자료입니다. 기능을 완성한 뒤 각 과제에 연결된 원문·관련 개념에서 검증·권한·트랜잭션·조회 성능의 배경과 확장 요구를 확인합니다.


## 게시글 다음 · 좋아요 기능 추가

기본5개를 완성했다면 같은 프로젝트에 [좋아요 설정](like-post.md)과 [좋아요 취소](unlike-post.md)를 추가합니다. [기존 프로젝트용 추가 자료](packages/like/like-extension.zip)는 새 파일6개와 작은 patch만 포함하며, CRUD 메서드를 교체하지 않습니다. 중간 합류 ZIP은 각 과제의 준비 안내에서 별도의 새 폴더용으로 구분합니다.

삭제한 CRUD id는 자동으로 넘기지 않습니다. 같은 서버에서 다른 회원의 새 PUBLIC 글을 작성하고 실제 id로 PUT을 확인한 뒤, 그 성공 id를 DELETE로 이어 씁니다. 토큰은 각 페이지에 직접 입력하며 저장하지 않습니다.
