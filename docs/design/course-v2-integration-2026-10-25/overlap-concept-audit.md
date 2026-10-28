# 과정 v2 통합 중복·개념 연결 감사

- 확인일: 2026-10-28 (현재 checkout 정적 자료 대조)
- 범위: `java-beginner/course.mjs`, `java-service/merge-plan.json`, `java-service/combined-course.mjs`, `java-service/service-course.mjs`, `service/features/*.json`, `service/course-view/*.json`, `service/api-contracts.json`, 개념 문서 카탈로그·빌드 설정.
- 실행 상태: 파일 구조와 JSON 원문만 대조했다. 포트·브라우저·API·DB 실행은 하지 않았다. 코드·데이터·생성 HTML은 수정하지 않았고 이 보고서만 작성한다.
- 배치표 현황: 94개 feature; extend 75, link 10, append 9. `service-course.mjs` 변환기는 모든 project variant를 펼쳐 138단계를 만든다.

## 요약

| 판정 | 개수 | 기준 |
|---|---:|---|
| 완전 중복 | 0 | 동일 method/path와 같은 학습 결과를 재구현하는 단계 |
| 부분 중복 | 19 | 같은 API 또는 결과 일부가 겹치나 입력·권한·정책이 추가됨 |
| 심화 | 47 | 같은 API·결과가 겹치지 않고 다음 단계로 이어짐 |
| 배치 어색 | 28 | anchor 회차의 주제·선수 관계가 기능의 중심 학습과 맞지 않음 |

완전 중복으로 확정한 항목은 없다. 동일한 method/path가 있다는 사실만으로 동일 계약으로 판정하지 않았다. 입문 과정은 `board` 프로젝트, 실무 feature는 `community`·`project-v1` 등 프로젝트 계약을 쓰며, 저장 여부·인증·응답·실패 정책이 다른 사례는 부분 중복으로만 분류했다. 아래 표의 경로 겹침은 method/path 비교이며 의미상 계약 동일 판정과 구분한다.

### 우선 처리할 상위 10개

1. `comments`: Day 14의 `GET /api/posts/{postId}/comments`와 댓글 목록이 겹친다. 실무 목록·삭제 단계를 재구현하지 말고 이미 배운 부분을 표시한 뒤 답글·편집·동시성 정책만 남긴다.
2. `posts-edit-remove`: Day 5의 `PUT /api/posts/{postId}`와 같은 전체 수정이 겹치고 Day 6 삭제도 입문 기능에 있다. 중복 CRUD 단계는 접고 PATCH·소프트 삭제만 확장한다.
3. `posts-create-read`: Day 1 `POST /api/posts`와 같은 경로지만 입문은 DB 저장 전 DTO 수신만 확인한다. 두 결과를 혼동하지 않게 메모리 요청과 영속화·인증·태그로 나눈다.
4. `integrated-search`: 댓글 있는 글 삭제(Day 14) 뒤에 검색을 둔 것은 주제 연결이 약하다. Day 10 검색 뒤로 이동한다.
5. `dynamic-query`: Day 14은 댓글 삭제 트랜잭션이며 조건 조합이 없다. Day 10 검색 심화로 옮긴다.
6. `monthly-archive`: 댓글 삭제 뒤 배치되어 있다. Day 9~10 목록·검색 뒤 또는 독립 기능으로 옮긴다.
7. `likes`·`bookmarks`·`follow-feed`: 현 anchor가 인증 소개 전(Day 14)이다. 회원 인증/권한(Day 22) 이후로 재배치한다.
8. `post-visibility`: 팔로우·차단·관리자별 404/200 정책은 CRUD 연결(Day 8)보다 권한 단원(Day 22) 뒤가 자연스럽다.
9. `runtime-ready`: 입문 Day 51과 실무 단계가 모두 `GET /actuator/health → 200`을 사용한다. 같은 확인 동작을 반복하지 말고 프로파일/DB 설정 추가분만 유지한다.
10. 화면·확인 자료: 화면 정의가 빈 feature 23개, API recipe가 없는 단계 24개, API 계약의 DB SQL이 없는 단계 112개다. 위 중복 수정을 먼저 한 뒤 화면과 검증 계약을 보완한다.

## A. 중복·배치 대조

아래 anchor 표는 각 merge-plan 항목이 참조하는 입문 회차의 `title`, `concept`, `goal`, `tasks`, `check`, `apiIds`와 입문 API 정의의 method/path·상태·응답 필드를 적었다. 같은 anchor에 붙은 여러 feature는 이 표를 공유한다. 비교 대상 실무 단계와 route는 다음 94행에 연결했다.

| 입문 기능/회차 | title | concept | goal | tasks | check | 입문 API 정의 (apiId · method/path · 성공 · 응답) |
|---|---|---|---|---|---|---|
| board / 8 | 게시판 기능을 한 흐름으로 완성하기 | 생성자 주입·인터페이스와 구현 객체·Service·단위 테스트 | 생성→조회→수정→삭제가 같은 글로 연결됩니다. | Controller/Service/Repository가 각각 무엇을 받는지 간단히 적는다. Repository interface 자체와 Spring이 만들어 주입한 구현 객체를 구분한다. / Service의 필수 규칙을 JUnit으로 검증하고 생성→상세→수정→삭제를 직접 실행한다. / 기획서의 정상/실패 확인 결과와 남은 문제를 작은 변경 설명으로 작성한다. | 새 id 하나로 전체 CRUD가 이어진다. / 직접 작성한 서비스 로직과 Spring Data 기본 메서드를 구분한다. | post-create POST /api/posts → 201; 응답 id/title/content/authorName/createdAt/updatedAt<br>post-detail GET /api/posts/{postId} → 200; 응답 id/title/content/authorName/createdAt/updatedAt<br>post-update PUT /api/posts/{postId} → 200; 응답 id/title/content/authorName/createdAt/updatedAt<br>post-delete DELETE /api/posts/{postId} → 204; 응답 본문 없음 |
| search-comments / 14 | 댓글 있는 글 삭제를 한 번에 처리하기 | 트랜잭션 첫 경험·실패 시 원상 복구 | 댓글과 글 삭제가 함께 성공하거나 함께 취소됩니다. | 댓글을 가진 공지의 삭제 정책을 기존 글 삭제에 적용한다. / Service의 한 트랜잭션 안에서 자식과 부모를 삭제한다. / 삭제 중 실패를 테스트에서 유발하고 두 데이터가 함께 남는지 확인한다. | 성공하면 글/댓글 모두 사라진다. / 실패하면 일부만 사라지지 않는다. | comment-list GET /api/posts/{postId}/comments → 200; 응답 items |
| members / 22 | 권한별 회귀 테스트 만들기 | MockMvc·인증 테스트·접근 행렬 | 회원/글/댓글 권한을 자동으로 확인합니다. | 비로그인/A/B/ADMIN의 생성·수정·삭제 결과 표를 작성한다. / 각 결과와 CSRF 유무를 MockMvc 테스트로 고정한다. / 공개 읽기 API와 초기 공지 데이터도 계속 조회되는지 확인한다. | 401/403/404를 의도대로 구분한다. / 로그인·권한 테스트가 자동 실행에서 모두 통과한다. | owned-post POST /api/posts → 201; 응답 id/title/content/authorName/createdAt/updatedAt/authorId<br>owned-update PUT /api/posts/{postId} → 200; 응답 id/title/content/authorName/createdAt/updatedAt/authorId<br>me GET /api/members/me → 200; 응답 id/email/displayName/role |
| files / 26 | DB와 파일 실패를 따로 처리하기 | DB 트랜잭션·보상 처리·재시도 | 두 저장소가 어긋나는 실패 경로를 다룹니다. | 파일 생성 뒤 DB 저장 실패를 테스트에서 재현한다. / 업로드 실패 파일 정리와 삭제 실패 파일 재정리 절차를 만든다. / 파일시스템까지 @Transactional로 복구된다고 설명하지 않는다. | DB 실패 후 불필요한 업로드 파일을 정리한다. / 정리 실패를 기록하고 같은 작업 재실행이 안전하다. | file-upload POST /api/posts/{postId}/attachments → 201; 응답 id/originalName/sizeBytes/contentType<br>file-delete DELETE /api/attachments/{attachmentId} → 204; 응답 본문 없음 |
| orders / 38 | 실패 주문을 자동 테스트하기 | 통합 테스트·격리 데이터·상태 검증 | HTTP 결과와 실제 저장 상태를 함께 검증합니다. | MySQL Testcontainers 또는 격리한 테스트 DB로 주문 테스트를 만든다. / 품절/판매중지/다른 회원 취소/중간 예외를 재현한다. / 테스트가 기존 학습 DB를 지우거나 의존하지 않게 한다. | 오류 상태뿐 아니라 주문·품목·재고의 불변을 확인한다. / 컴파일/서버 시작/API 성공을 구분해 기록한다. | order-create POST /api/orders → 201; 응답 id/status/totalAmount/lines<br>order-cancel POST /api/orders/{orderId}/cancel → 200; 응답 id/status/totalAmount/lines |
| concurrency / 42 | 동시 취소와 재고 불변 확인하기 | 상태 조건 갱신·재시도·불변식 | 경합 중에도 재고 복구를 한 번만 수행합니다. | 같은 주문 취소를 두 요청으로 동시에 실행한다. / 상태 전이를 원자적으로 제한하고 복구를 같은 트랜잭션에 둔다. / 정상/초과 주문/재시도/동시 취소 테스트를 함께 실행한다. | 재고가 판매 전 수량을 넘지 않는다. / 테스트 결과와 채택한 DB 제어 방식을 기록한다. | order-cancel POST /api/orders/{orderId}/cancel → 200; 응답 id/status/totalAmount/lines<br>product-detail GET /api/products/{productId} → 200; 응답 id/name/price/stock/active |
| performance / 46 | 성능 변경을 회귀 테스트와 설명으로 남기기 | 회귀·동일 조건 비교·리뷰 설명 | 속도와 정확성을 함께 설명합니다. | 동일 데이터에서 개선 전후 여러 번 측정한다. / 페이지/권한/정렬이 보존되는 자동 테스트를 실행한다. / 문제→원인→변경→실측→남은 한계 순서로 변경 설명을 쓴다. | 측정 조건과 결과를 다른 사람이 재현할 수 있다. / 한 번 빨랐다는 이유로 개선을 확정하지 않는다. | order-perf GET /api/orders → 200; 응답 items/page/size/total |
| quality / 50 | API 문서와 리뷰 가능한 변경 설명 쓰기 | OpenAPI·변경 영향·리뷰 | 다른 개발자가 새 계약을 사용할 수 있습니다. | 선택한 Boot 버전에 맞는 springdoc 호환성을 공식 문서로 확인한다. / 직접 만든 서버의 Swagger UI 또는 이 도구로 구/신 요청을 확인한다. / 문제/변경 동작/호환/검증 결과를 작은 PR 설명 초안으로 쓴다. | 문서의 필드/필수 여부가 실제 JSON과 같다. / 문서 생성 성공과 API 실행 성공을 구분한다. | urgent-create POST /api/posts → 201; 응답 id/title/content/authorName/createdAt/updatedAt/urgent/authorId |
| operations / 53 | 상태와 로그로 문제 찾기 | Actuator·식별자·운영 관찰 | 서버가 살아 있음과 업무 요청 성공을 구분합니다. | health 공개 범위와 민감 정보 숨김을 설정한다. / 요청 식별자로 HTTP 오류와 서버 로그를 연결한다. / 격리 환경에서 DB 중단→오류 관찰→복구를 연습한다. | health 200/503을 실제 환경 상태와 비교한다. / 관찰한 원인과 추측을 나누어 기록한다. | health GET /actuator/health → 200; 응답 status |
| recovery / 57 | 운영 변경 배포와 문제 발생 대응 연습 | 호환 배포·원인 추적·안전한 rollback | 데이터와 삭제 정책을 지키는 배포·대응 절차를 만듭니다. | DB 사본에서 컬럼 추가/호환 버전/정책 활성화 순서를 리허설한다. / 예전 클라이언트의 DELETE 요청과 204 응답, 생성/조회/주문 회귀를 확인한다. / 배포 뒤 글이 잘못 보이는 사례를 로그/SQL로 추적하고 삭제 필터가 유지되는 복구 버전을 정한다. | 구버전 클라이언트가 그대로 동작하며 기존 데이터가 보존된다. / 삭제 필터 없는 서버 버전으로 되돌리지 않는 이유와 대체 복구 절차를 설명한다. | post-soft-delete DELETE /api/posts/{postId} → 204; 응답 본문 없음<br>deleted-posts GET /api/admin/posts/deleted → 200; 응답 items/page/size/total |
| handover / 60 | 동료에게 넘길 수 있는 상태로 마무리하기 | 인수인계·장애 대응·리뷰 | 구현·검증·실행·복구를 재현할 수 있게 만듭니다. | 새 환경에서 실행 문서대로 앱을 띄우고 핵심 API를 재확인한다. / 요청 한 건의 Controller→Service→Repository→SQL→DB→응답을 실제 값으로 설명한다. / 변경 설명·테스트 결과·남은 문제·복구 절차를 쓰고 관련 없는 파일은 제외한다. | 다른 사람이 정상/실패 요청과 DB 확인을 재현할 수 있다. / 배운 것과 아직 도움 필요한 부분을 구분하고 다음 작은 기능을 스스로 설계한다. | restock POST /api/admin/products/{productId}/restocks → 201; 응답 id/productId/quantity/stockAfter/reason |
| board / 5 | 제목과 본문 수정하기 | 객체 메서드·필드 변경·UPDATE | 수정 가능한 값과 유지할 값을 구분합니다. | PUT에서 제목/본문을 모두 받는다. / 기존 글을 읽고 두 값과 updatedAt만 변경한다. / Service에서 DTO 변환을 유지하고 수정 전후 DB 행을 비교한다. | id/작성자/createdAt은 유지된다. / 본문을 생략하면 400이며 기존 행이 바뀌지 않는다. | post-update PUT /api/posts/{postId} → 200; 응답 id/title/content/authorName/createdAt/updatedAt |
| search-comments / 10 | 제목으로 공지 검색하기 | WHERE·LIKE·Repository 조회 메서드 | 키워드에 맞는 글만 페이지로 제공합니다. | 제목에 배포가 포함된 글과 없는 글을 섞어 만든다. / keyword 공백을 정리하고 제목 검색 조건을 추가한다. / 검색 결과 total도 동일한 검색 조건으로 계산한다. | 검색 결과 모든 제목에 키워드가 들어 있다. / 결과 없음은 200과 빈 items/total=0이다. | post-search GET /api/posts → 200; 응답 items/page/size/total |
| members / 16 | 비밀번호와 중복 가입 안전하게 처리하기 | PasswordEncoder·DB 제약·409 | 비밀번호를 해시하고 중복 경쟁을 DB에서도 막습니다. | Spring Security PasswordEncoder로 단방향 해시를 저장한다. / 이메일 조회와 DB UNIQUE 오류를 구분해 409로 응답한다. / 같은 원문을 matches로 검증하며 평문 문자열 비교를 하지 않는다. | 같은 이메일 대소문자/공백 변형이 409다. / DB의 값이 원문과 다르고 원문 비밀번호가 로그에 없다. | signup POST /api/members → 201; 응답 id/email/displayName |
| files / 23 | 파일 업로드와 메타데이터 저장하기 | MultipartFile·IO·메타데이터 | 파일 본체와 첨부 행을 따로 저장합니다. | multipart file을 받는 경로를 만든다. / 랜덤 저장 키와 원본 표시 이름을 분리한다. / 실제 파일과 attachments 행을 각각 확인한다. | 일반 JSON 전송과 multipart 전송의 차이를 설명한다. / 파일 경로가 응답에 노출되지 않는다. | file-upload POST /api/posts/{postId}/attachments → 201; 응답 id/originalName/sizeBytes/contentType |
| orders / 35 | 주문과 재고를 함께 저장하기 | @Transactional·flush·commit·rollback | 일부 저장만 남는 주문을 막습니다. | 주문/품목 저장과 재고 차감을 Service 트랜잭션에 넣는다. / 재고 차감 뒤 예외가 나는 테스트를 만든다. / SQL 로그와 별도 DB 클라이언트에서 확정된 값을 구분한다. | 성공 시 10→8이고 주문/품목이 함께 생긴다. / 실패 시 원래 재고와 행 수로 돌아온다. | order-create POST /api/orders → 201; 응답 id/status/totalAmount/lines |
| performance / 43 | 느린 주문 조회를 재현하고 측정하기 | 가설·쿼리 로그·측정 조건 | 어떤 요청이 왜 느린지 근거를 모읍니다. | 일회용 성능 DB와 데이터 건수를 기록한다. / 동일 회원의 목록을 반복하고 쿼리 수/시간을 기록한다. / 네트워크 시간과 SQL 실행 시간을 구분한다. | 실제 측정값과 예시값이 분리되어 있다. / 기존 실습 DB를 지우거나 대량 데이터로 바꾸지 않는다. | order-perf GET /api/orders → 200; 응답 items/page/size/total |
| quality / 47 | 기존 요청을 먼저 테스트로 고정하기 | 계약 테스트·회귀 기준 | 새 요구를 넣기 전 현재 약속을 확인합니다. | 현재 공지/회원/주문 정상·실패 회귀 목록을 만든다. / urgent 없는 생성 요청과 필수 응답 키를 테스트로 남긴다. / 변경될 것/유지할 것을 짧은 명세에 적는다. | 기존 테스트가 변경 전 실제로 통과한다. / 전체 정답 구현을 복사하지 않고 현재 계약을 설명한다. | owned-post POST /api/posts → 201; 응답 id/title/content/authorName/createdAt/updatedAt/authorId<br>post-detail GET /api/posts/{postId} → 200; 응답 id/title/content/authorName/createdAt/updatedAt |
| operations / 51 | 환경 설정을 코드에서 분리하기 | 프로파일·환경 변수·비밀값 | 서로 다른 DB 주소로 같은 코드를 실행합니다. | local/test 프로파일의 연결 대상을 분리한다. / 비밀번호를 환경 변수로 받고 실제 값은 커밋하지 않는다. / 실행 명령과 필수 설정 이름만 문서화한다. | 환경이 달라도 Java 소스 수정 없이 실행한다. / 테스트가 개발 DB에 연결되지 않는다. | health GET /actuator/health → 200; 응답 status |
| recovery / 55 | 관리자 복구와 작업 이력 연결 | 상태 전이·감사 이력·서버 시각 | 관리자가 공지를 복구하고 실행자를 추적할 수 있습니다. | 기존 삭제 API의 204 계약을 유지하며 논리 삭제로 바꾼다. / 관리자 삭제 목록과 30일 이내 복구를 구현한다. / 삭제/복구와 post_events INSERT를 같은 트랜잭션으로 묶고 이력 실패를 재현한다. | 삭제→관리자 목록→복구→동일 id 상세 흐름이 이어진다. / 재복구/기간 경과는 409이고 이력 저장 실패는 상태도 rollback한다. | post-soft-delete DELETE /api/posts/{postId} → 204; 응답 본문 없음<br>deleted-posts GET /api/admin/posts/deleted → 200; 응답 items/page/size/total<br>post-restore POST /api/admin/posts/{postId}/restore → 200; 응답 id/title/content/authorName/createdAt/updatedAt/authorId/urgent |
| board / 1 | 공지 등록 요청 받기 | 요청 DTO·기본 생성자·getter/setter | DB 연결 전에 기획의 세 입력을 JSON으로 받습니다. | 제목/본문/작성자 이름을 일반 클래스 요청 DTO로 받는다. / 요청마다 별도의 객체로 값이 들어오는지 로그로 확인한다. / 응답 예시와 필수 입력을 문서에 적고 id/일시를 아직 저장했다고 표시하지 않는다. | 한글과 줄바꿈 본문이 들어온다. / 미저장 단계와 DB 저장 완료를 구분한다. | post-create POST /api/posts → 201; 응답 id/title/content/authorName/createdAt/updatedAt |

### Merge-plan 항목별 판정

각 행은 merge-plan의 실제 `type/module/after/day`, 원본 feature 제목과 variant별 단계 제목, 단계 `recipeIds`가 가리키는 API 계약을 대조한다. 단계가 여러 variant에 있으면 각각 적었다.

| feature | 배치 및 입문 anchor | 실무 feature/단계 | 경로 겹침 (method/path) | 판정 | 권장 처리 및 실무 계약 예 |
|---|---|---|---|---|---|
| badword-policy | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 금칙어가 들어간 글을 거절하기<br>community/정해진 필드와 일치 규칙으로 금칙어 판단하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/admin/banned-words → 201<br>community POST /api/posts → 201<br>community POST /api/posts → 400<br>community GET /api/admin/banned-words → 200 |
| post-drafts | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 글을 임시저장했다가 발행하기<br>community/초안과 공개 상태 구분해 전환하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/posts → 201<br>community POST /api/posts/{{P0.body.id}}/publish → 200<br>community POST /api/posts/{{P0.body.id}}/publish → 409<br>community GET /api/me/drafts → 200 |
| post-history | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 글을 바꾸기 전 내용을 이력으로 남기기<br>community/수정과 이력을 함께 남기고 조회하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/posts → ?<br>community PATCH /api/posts/{{H0.body.id}} → 200<br>community PATCH /api/posts/{{H0.body.id}} → 400<br>community GET /api/posts/{{H0.body.id}}/revisions → 200 |
| post-copy | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 기존 글을 복사해 새 글 만들기<br>community/원본을 보존하고 새 id로 글 복사하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community POST /api/posts/2/copies?copyTags=true → 201<br>community POST /api/posts/2/copies?copyTags=false → 201<br>community POST /api/posts/2/copies?copyTags=maybe → 400<br>community POST /api/posts/2/copies → 400 |
| post-tags | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 글에 붙은 태그 목록 보여 주기<br>community/태그 연결을 목록 응답으로 바꾸기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community GET /api/posts/2/tags → 200<br>community GET /api/posts/{{taglessPostId}}/tags → 200<br>community GET /api/posts/999999/tags → 404 |
| pinned-posts | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 게시판 위에 공지 글 고정하기<br>community/게시판별 세 개 제한과 순서 지키기 | 없음 | 배치 어색 | 관리자 권한(Day 22 이후) 뒤로 옮겨 노출 상한·정렬만 확장.<br>실무 recipe: community DELETE /api/boards/free/pinned-posts/14 → ?<br>community DELETE /api/boards/free/pinned-posts/12 → ?<br>community DELETE /api/boards/free/pinned-posts/9 → ?<br>community PUT /api/boards/free/pinned-posts/14 → 200 |
| post-visibility | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 공개 범위와 차단에 맞게 글 보여 주기<br>community/작성자·팔로우·차단에 따른 접근 판정하기 | 없음 | 배치 어색 | 권한 학습(Day 22) 이후로 이동.<br>실무 recipe: community GET /api/posts/6 → 404<br>community GET /api/posts/6 → 200<br>community GET /api/posts/7 → 200<br>community GET /api/posts/7 → 404 |
| post-rate-limit | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 짧은 시간의 반복 글쓰기 제한하기<br>community/허용량 초과 쓰기는 저장 없이 거절하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/posts → 201/429<br>community POST /api/posts → 429<br>community POST /api/posts → 400<br>community GET /api/posts/2 → 200 |
| scheduled-publish | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 정해진 시각에 초안 발행하기<br>community/실행 시각이 지난 대상을 한 번 발행하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/posts → 201<br>community POST /api/admin/jobs/scheduled-publish/run?at=2026-10-05T08:59:59 → 200<br>community POST /api/admin/jobs/scheduled-publish/run?at=2026-10-05T09:00:00 → 200<br>community GET /api/posts/{{P1.body.id}} → 200 |
| purge-trash | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 오래된 휴지통 글을 작은 묶음으로 정리하기<br>community/자식 관계부터 지우고 다음 묶음 이어 가기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community POST /api/admin/jobs/trash-purge/run → 200<br>community POST /api/admin/jobs/trash-purge/run?date=2026-10-06 → 400<br>community POST /api/admin/jobs/trash-purge/run → 403<br>community POST /api/admin/jobs/trash-purge/run → 401 |
| post-view-dedupe | extend → board Day 8 “게시판 기능을 한 흐름으로 완성하기” | 같은 사람의 조회수를 하루에 한 번만 세기<br>community/날짜와 회원을 구분해 조회 집계하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/posts → 201<br>community GET /api/posts/{{W0.body.id}} → 200<br>community GET /api/boards/free/posts?size=1 → 200 |
| integrated-search | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 제목·본문·작성자로 글 검색하기<br>community/검색 범위와 결과 정렬 지키기 | 없음 | 배치 어색 | Day 10 검색 뒤로 이동하고 검색 조건만 실무 확장.<br>실무 recipe: community POST /api/posts → ?<br>community GET /api/search/posts?q=zq{{S0.body.id}}x → 200<br>community GET /api/search/posts?q=zq{{S0.body.id}}x&in=title → 200<br>community GET /api/search/posts?q=zq{{S0.body.id}}x&in=content → 200 |
| dynamic-query | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 검색 조건을 조합해 글 찾기<br>community/없는 조건은 빼고 여러 조건은 함께 적용하기 | 없음 | 배치 어색 | Day 10 뒤로 이동해 조건 조합을 심화.<br>실무 recipe: community GET /api/posts/search?tag=jpa&size=5 → ?<br>community GET /api/posts/search?board=qna&tag=spring&size=5 → ?<br>community GET /api/posts/search?author=2&from=2026-09-01&to=2026-09-30 → ?<br>community GET /api/posts/search?q=n%2B1&size=5 → ? |
| monthly-archive | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 월별 글 수와 해당 월의 글 보여 주기<br>community/연·월 경계를 기준으로 목록 묶기 | 없음 | 배치 어색 | Day 9~10 목록/검색 뒤 또는 독립 feature로 이동.<br>실무 recipe: community GET /api/boards/free/archive → 200<br>community GET /api/boards/free/archive/2026/9?size=20 → 200<br>community GET /api/boards/free/archive/2026/0 → 400<br>community GET /api/boards/nope/archive → 404 |
| comments | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 글에 댓글과 답글 남기기<br>board/댓글 작성·목록·삭제 연결하기<br>community/댓글 작성·목록·삭제 연결하기<br>community/댓글을 수정하고 수정됨 표시하기<br>project-v1/댓글 작성·목록·삭제 연결하기 | POST /api/posts/{id}/comments<br>GET /api/posts/{id}/comments | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board POST /api/posts/{postId}/comments → 201<br>board GET /api/posts/{postId}/comments → 200<br>board DELETE /api/comments/{commentId} → 204<br>community GET /api/posts/11/comments → 200 |
| likes | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 좋아요를 누르고 취소하기<br>board/반복·동시 요청에서도 좋아요 수 일치시키기<br>community/반복·동시 요청에서도 좋아요 수 일치시키기<br>project-v1/반복·동시 요청에서도 좋아요 수 일치시키기 | 없음 | 배치 어색 | 로그인·권한 학습(Day 22) 뒤로 옮기고 카운트/중복 정책만 확장.<br>실무 recipe: board PUT /api/posts/{postId}/like → 204<br>board DELETE /api/posts/{postId}/like → 204<br>community PUT /api/posts/{id}/like → 200<br>community DELETE /api/posts/{id}/like → 200 |
| emoji-reactions | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 글에 공감 종류 하나 선택하기<br>community/선택·변경·취소와 종류별 수 일치시키기 | 없음 | 배치 어색 | 게시글 상호작용 묶음으로 재배치하거나 append.<br>실무 recipe: community PUT /api/posts/13/reaction → 200<br>community GET /api/posts/13/reactions → 200<br>community PUT /api/posts/13/reaction → 400<br>community DELETE /api/posts/13/reaction → 200 |
| polls | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 글에 투표를 만들고 한 표 행사하기<br>community/선택지·중복 투표·결과 집계 관리하기 | 없음 | 배치 어색 | 게시글 상호작용 묶음으로 재배치하거나 append.<br>실무 recipe: community POST /api/posts → ?<br>community POST /api/posts/{{V1.body.id}}/poll → 201<br>community POST /api/posts/{{V1.body.id}}/poll/votes → 201<br>community POST /api/posts/{{V1.body.id}}/poll/votes → 409 |
| bookmarks | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 북마크를 폴더에 보관하기<br>community/글을 폴더에 담고 메모·목록 관리하기 | 없음 | 배치 어색 | 회원 인증 완료(Day 22) 뒤로 이동.<br>실무 recipe: community PUT /api/posts/2/bookmark → 200<br>community PUT /api/posts/2/bookmark → 404<br>community PUT /api/posts/999999/bookmark → 404<br>community PUT /api/posts/2/bookmark → 401 |
| recent-history | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 최근 본 글 스무 개 보여 주기<br>community/회원별 최근 열람 순서와 보관량 지키기 | 없음 | 배치 어색 | 회원 인증 완료(Day 22) 뒤로 이동.<br>실무 recipe: community DELETE /api/me/recent-posts → 204<br>community GET /api/posts/12 → ?<br>community GET /api/posts/13 → ?<br>community GET /api/posts/14 → ? |
| my-marked-posts | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 내가 표시한 글을 모아 보기<br>community/좋아요·북마크 조건으로 내 목록 이어 보기 | 없음 | 배치 어색 | 회원 인증 완료(Day 22) 뒤로 이동.<br>실무 recipe: community GET /api/me/likes?size=3 → 200<br>community GET /api/me/likes?size=3&cursor={{M1.body.nextCursor}} → 200<br>community GET /api/me/likes?size=20 → 200<br>community GET /api/me/likes → 401 |
| tag-related-posts | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 태그가 겹치는 관련 글 추천하기<br>community/공유 태그 수와 동률 규칙으로 추천하기 | 없음 | 배치 어색 | 태그/검색(Day 10) 또는 독립 feature로 이동.<br>실무 recipe: community POST /api/posts → 201<br>community GET /api/posts/{{K1.body.id}}/related → 200<br>community GET /api/posts/{{K1.body.id}}/related?size=0 → 400 |
| follow-feed | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 팔로우한 사람의 글 이어 보기<br>community/팔로우·뮤트 조건을 피드에 적용하기 | 없음 | 배치 어색 | 회원·팔로우 기능(Day 22 이후)으로 이동.<br>실무 recipe: community DELETE /api/members/6/follow → 200<br>community PUT /api/members/6/follow → 200<br>community GET /api/me/feed?size=2 → 200<br>community GET /api/me/feed?size=2&cursor={{A1.body.nextCursor}} → 200 |
| follow-recommendations | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 관계에 따라 팔로우 후보 추천하기<br>community/맞팔과 친구의 친구를 중복 없이 찾기 | 없음 | 배치 어색 | 회원·팔로우 기능(Day 22 이후)으로 이동.<br>실무 recipe: community GET /api/members/2/mutuals → ?<br>community GET /api/members/4/mutuals → ?<br>community GET /api/me/follow-back → ?<br>community GET /api/me/suggestions?limit=5 → ? |
| activity-summary | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 회원별 글·댓글·좋아요 활동 요약하기<br>community/활동이 없는 회원도 올바르게 집계하기 | 없음 | 배치 어색 | 활동 집계/순위 feature로 재배치 또는 append.<br>실무 recipe: community GET /api/stats/member-activity → 200 |
| activity-ranking | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 회원 활동에 따라 순위 보여 주기<br>board/댓글 포인트와 활동 순위 연결하기 | POST /api/posts/{id}/comments | 배치 어색 | 활동 집계/순위 feature로 재배치 또는 append.<br>실무 recipe: board POST /api/posts → 201<br>board GET /api/rankings/activity → 200<br>board POST /api/posts/{postId}/comments → 201 |
| ranking-window | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 기간 안의 인기글 순위 계산하기<br>community/고정한 기준 시각으로 기간 순위 계산하기 | 없음 | 배치 어색 | 인기/순위 feature로 재배치 또는 append.<br>실무 recipe: community GET /api/posts/popular?days=7&limit=5 → 200<br>community GET /api/posts/popular?days=30&limit=3 → ?<br>community GET /api/posts/popular?days=7&limit=50 → ?<br>community GET /api/posts/popular?days=31 → 400 |
| weekly-snapshots | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 주간 순위를 그때의 값으로 보관하기<br>community/기간 경계와 재실행에서도 같은 스냅샷 지키기 | 없음 | 배치 어색 | 배치·순위 feature로 재배치 또는 append.<br>실무 recipe: community POST /api/admin/jobs/weekly-ranking/run?date=2026-10-05 → 200<br>community POST /api/admin/jobs/weekly-ranking/run?date=2026-09-28 → 200<br>community GET /api/rankings/weekly?weekStart=2026-09-21 → 200<br>community GET /api/rankings/weekly?weekStart=2026/09/21 → 400 |
| hall-of-fame | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 매일 인기글을 명예의 전당에 기록하기<br>community/날짜별 선정 결과를 중복 없이 남기기 | 없음 | 배치 어색 | 배치·순위 feature로 재배치 또는 append.<br>실무 recipe: community POST /api/admin/jobs/hall-of-fame/run?date=2026-10-04 → 200<br>community POST /api/admin/jobs/hall-of-fame/run?date=2026-10-05 → 200<br>community GET /api/hall-of-fame → 200<br>community POST /api/admin/jobs/hall-of-fame/run?date=2026-10-06 → 400 |
| popular-cache | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 인기글을 빠르고 정확하게 보여 주기<br>board/캐시 장애에도 목록을 반환하고 변경 후 갱신하기<br>board/동시에 비어도 한 요청만 다시 채우기 | 없음 | 배치 어색 | 성능(Day 43~46) 뒤로 옮기고 캐시 정책만 남김.<br>실무 recipe: board GET /api/posts/popular → 200<br>board DELETE /api/posts/{postId} → 204<br>board POST /api/posts → 201<br>board POST /api/admin/posts/{postId}/hide → 200 |
| community-popular-cache | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 커뮤니티 인기글을 캐시하고 숨김 즉시 반영하기<br>community/재사용 기간과 무효화 시점 지키기 | 없음 | 배치 어색 | 성능(Day 43~46) 뒤로 이동해 캐시 무효화만 다룸.<br>실무 recipe: community GET /api/posts/popular?days=7&limit=10 → 200<br>community PATCH /api/posts/144 → 200<br>community PATCH /api/posts/144 → 403 |
| counter-reconcile | extend → search-comments Day 14 “댓글 있는 글 삭제를 한 번에 처리하기” | 실제 관계와 어긋난 숫자 바로잡기<br>community/관계 수를 다시 세고 필요한 행만 보정하기 | 없음 | 배치 어색 | 집계·성능 또는 데이터 정합성 주제로 옮김.<br>실무 recipe: community POST /api/admin/recount → 200<br>community POST /api/admin/recount → 403<br>community POST /api/admin/recount → 401 |
| legacy-members | extend → members Day 22 “권한별 회귀 테스트 만들기” | 명세 프로젝트 회원 가입·로그인 만들기<br>project-v1/회원 가입부터 내 정보까지 연결하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: project-v1 POST /api/v1/users → 201<br>project-v1 POST /api/v1/users → 409<br>project-v1 POST /api/v1/users → 400<br>project-v1 POST /api/v1/users → ? |
| sessions | extend → members Day 22 “권한별 회귀 테스트 만들기” | 쿠키로 로그인 상태 이어 가기<br>project-v1/로그인·내 정보·로그아웃을 같은 세션으로 확인하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: project-v1 GET /api/v1/session/csrf → ?<br>project-v1 POST /api/v1/session/login → 200<br>project-v1 GET /api/v1/session/me → 200<br>project-v1 POST /api/v1/session/logout → 204 |
| token-lifecycle | extend → members Day 22 “권한별 회귀 테스트 만들기” | 로그아웃·만료 뒤 토큰 사용을 제어하기<br>board/토큰 수명과 폐기 정책을 정하고 검증하기 | POST /api/auth/login<br>GET /api/members/me | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board POST /api/auth/login → 200<br>board GET /api/members/me → 200<br>board   → ? |
| login-rate-limit | extend → members Day 22 “권한별 회귀 테스트 만들기” | 반복 로그인 시도 제한하기<br>board/정해진 시간 안의 로그인 시도 제한하기 | POST /api/auth/login | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board POST /api/auth/login → 200 |
| member-suspension | extend → members Day 22 “권한별 회귀 테스트 만들기” | 정지 기간 동안 글쓰기 제한하기<br>community/운영자가 기간 정지하고 만료 후 허용하기 | POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community PUT /api/admin/members/9/suspension → 200<br>community POST /api/posts → 403<br>community DELETE /api/admin/members/9/suspension → 204<br>community POST /api/posts → 201 |
| request-context | extend → members Day 22 “권한별 회귀 테스트 만들기” | 다음 요청에 다른 사람 정보가 남지 않게 하기<br>board/정상·예외·취소 뒤 요청 문맥 정리하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| link-preview | extend → files Day 26 “DB와 파일 실패를 따로 처리하기” | 외부 링크를 제한 시간 안에 미리 보여 주기<br>community/외부 지연·오류를 제한하고 안전한 응답 만들기 | 없음 | 배치 어색 | 파일 저장 단원에서 분리해 외부 HTTP feature/append로 둠.<br>실무 recipe: community GET /fake-site/base → ?<br>community GET /fake-site/page?title=hello&delay=0 → ?<br>community POST /api/posts → 201<br>community GET /api/posts/{{F.body.id}} → 200 |
| points-charge | extend → orders Day 38 “실패 주문을 자동 테스트하기” | 결제 결과에 맞게 포인트 충전하기<br>board/느린 결제에도 중복 없이 충전 접수하기<br>board/서명된 결제 알림으로 결과 확정하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board POST /api/me/points/charges → 201/202<br>board GET /api/me/points → 200<br>board POST /api/pg/callbacks → 200 |
| points-coupon-shop | extend → orders Day 38 “실패 주문을 자동 테스트하기” | 포인트와 쿠폰으로 상품 구매하기<br>board/활동 포인트 적립·잔액·이력 확인하기<br>board/한 사람에게 쿠폰 한 장 발급하기<br>board/상품을 조회하고 포인트·쿠폰으로 구매하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board GET /api/me/points → 200<br>board GET /api/me/points/history → 200<br>board POST /api/posts → 201<br>board POST /api/coupons/{couponId}/issue → 201 |
| coupon-bulk | extend → orders Day 38 “실패 주문을 자동 테스트하기” | 엑셀로 여러 회원에게 쿠폰 지급하기<br>board/정상 행은 지급하고 잘못된 행은 구분하기 | 없음 | 배치 어색 | 쿠폰 발급 뒤로 이동하거나 독립 append로 연결.<br>실무 recipe: board POST /api/admin/coupons/{couponId}/bulk-issue → 200<br>board GET /api/admin/audit-logs → 200 |
| time-policy | extend → orders Day 38 “실패 주문을 자동 테스트하기” | 쿠폰 만료 시각과 할인 정책을 확인 가능하게 만들기<br>board/고정한 시각과 같은 입력으로 정책 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| coupon-limits | extend → concurrency Day 42 “동시 취소와 재고 불변 확인하기” | 동시에 받아도 쿠폰 수량 지키기<br>board/경쟁 요청에서도 DB 수량과 발급을 일치시키기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board POST /api/coupons/{couponId}/issue → 201 |
| multi-process-load | extend → concurrency Day 42 “동시 취소와 재고 불변 확인하기” | 앱 두 개의 캐시와 지급 병목 측정하기<br>board/같은 조건에서 성능과 결과를 함께 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → ?<br>board GET /api/posts/popular → 200 |
| shared-state-isolation | extend → concurrency Day 42 “동시 취소와 재고 불변 확인하기” | 다른 트랜잭션의 변경과 공유 태그 수명 확인하기<br>board/캐시와 격리 수준의 재조회 차이 확인하기<br>board/글 하나를 지워도 다른 글의 태그 보존하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board DELETE /api/posts/{postId} → 204<br>board GET /api/posts/{postId} → 200 |
| db-list-queries | extend → performance Day 46 “성능 변경을 회귀 테스트와 설명으로 남기기” | 목록 응답에서 SQL 조건과 조회 방식 찾기<br>practice/목록·태그·커서를 같은 글 집합으로 맞추기<br>practice/같은 목록을 다섯 접근 방식으로 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| db-result-integrity | extend → performance Day 46 “성능 변경을 회귀 테스트와 설명으로 남기기” | JOIN과 집계에서도 빠지거나 늘지 않는 결과 만들기<br>practice/선택 정보·집계·존재 조건을 정확하게 조립하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| query-options | extend → performance Day 46 “성능 변경을 회귀 테스트와 설명으로 남기기” | 같은 조회 결과를 여러 DB 접근 방식으로 만들기<br>community/누락·중복 없이 상세와 목록 정보 조립하기<br>community/저장 기술을 바꿔도 같은 공개 글 읽기<br>practice/누락·중복 없이 상세와 목록 정보 조립하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community GET /api/boards/free/posts?size=20 → 200<br>community GET /api/members/3/posts?board=dev → 200<br>community GET /api/members/4/posts?board=dev → 200<br>community GET /api/members/999999/posts?board=dev → 404 |
| index-lifecycle | extend → performance Day 46 “성능 변경을 회귀 테스트와 설명으로 남기기” | 실제 조회를 측정하며 인덱스 선택하기<br>community/실행계획과 데이터 분포로 인덱스 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community GET /api/me/likes?size=5 → 200 |
| diagnose-slow-requests | extend → performance Day 46 “성능 변경을 회귀 테스트와 설명으로 남기기” | 느린 요청의 대기 지점 찾아 고치기<br>board/결제가 느려도 글 목록은 계속 응답하기<br>board/느린 목록의 실행계획과 실제 비용 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board GET /api/posts → 200<br>board POST /api/me/points/charges → 201/202 |
| jvm-capacity | extend → performance Day 46 “성능 변경을 회귀 테스트와 설명으로 남기기” | CPU·대기·메모리 원인을 구분하고 용량 정하기<br>board/세 가지 부하를 나누어 측정하고 설정 하나 바꾸기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| api-compatibility | extend → quality Day 50 “API 문서와 리뷰 가능한 변경 설명 쓰기” | 기존 앱도 계속 쓰게 예약 API 바꾸기<br>board/목록 전체 개수 또는 다음 목록 정보를 정해 반영하기<br>board/예약 접수와 실제 쿠폰 지급을 다르게 응답하기<br>board/이전 앱과 새 화면을 자동 테스트로 함께 확인하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → ?<br>board   → 201<br>board   → 200 |
| read-change-safely | extend → quality Day 50 “API 문서와 리뷰 가능한 변경 설명 쓰기” | 기존 동작을 지키며 구조 개선하기<br>board/요청 경로와 기존 동작을 실행으로 확인하기<br>board/설정·민감 정보 문제를 골라 수정하기 | POST /api/posts | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board GET /api/members/me → 200<br>board POST /api/posts → 201<br>board POST /api/auth/login → 200 |
| decision-review | extend → quality Day 50 “API 문서와 리뷰 가능한 변경 설명 쓰기” | 새 운영 조건에 맞게 설계 결정 고치기<br>board/늘어난 대상·정합성·마감 반론을 비용과 함께 검토하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| independent-repair | extend → quality Day 50 “API 문서와 리뷰 가능한 변경 설명 쓰기” | 서로 다른 두 문제를 증거로 고치기<br>board/첫 문제의 실패를 남기고 최소 수정하기<br>board/다른 영역의 문제도 같은 기준으로 해결하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| explain-handoff | extend → quality Day 50 “API 문서와 리뷰 가능한 변경 설명 쓰기” | 직접 만든 기능과 운영 절차를 근거로 설명하기<br>board/첫 구현 경험을 말하고 문제 다섯 개 정리하기<br>board/후반 사례로 다시 설명하고 약점 두 개 정하기<br>board/다른 사람이 실행·복구할 운영 절차 검증하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| legacy-runtime | extend → operations Day 53 “상태와 로그로 문제 찾기” | 커뮤니티와 명세 프로젝트 실행 준비하기<br>community/커뮤니티 실행과 요청 오류 확인하기<br>project-v1/별도 명세 프로젝트와 DB 준비하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community GET /api/start/hello?name=김자바 → 200<br>community GET /api/start/hello → 200<br>community GET /api/start/ping → 200<br>community GET /api/start/pong → 404 |
| async-dispatch | extend → operations Day 53 “상태와 로그로 문제 찾기” | 느린 알림을 글쓰기 응답과 분리하기<br>community/제한된 실행기로 알림 보내고 포화 처리하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community PUT /api/admin/fake-push → 200<br>community PUT /api/admin/fake-push → 403<br>community PUT /api/admin/fake-push → 400<br>community POST /api/posts → 201 |
| bounded-workers | extend → operations Day 53 “상태와 로그로 문제 찾기” | 작업이 몰려도 수용량과 종료 시간 지키기<br>board/작업 수용·거절·종료를 확인하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| job-run-records | extend → operations Day 53 “상태와 로그로 문제 찾기” | 배치 실행 결과를 남기고 다시 실행하기<br>community/실패·재실행을 실행 이력으로 구분하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community GET /api/admin/jobs/runs?job=weekly-ranking&status=FAILED → 200<br>community POST /api/admin/jobs/weekly-ranking/retry-failed → 200<br>community GET /api/rankings/weekly?weekStart=2026-09-14 → 200<br>community GET /api/admin/jobs/runs?job=weekly-ranking&size=100 → 200 |
| notification-channels | extend → operations Day 53 “상태와 로그로 문제 찾기” | 새 알림 채널을 기존 기능에 연결하기<br>board/채널을 늘려도 기존 알림 계약 지키기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board POST /api/posts → 201 |
| release-containers | extend → operations Day 53 “상태와 로그로 문제 찾기” | 실행 중인 요청을 지키며 앱 교체하기<br>board/별도 환경에서 이미지 기동·정상 종료 확인하기 | GET /actuator/health | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board   → 201<br>board   → 200<br>board GET /actuator/health → 200<br>board POST /api/auth/login → 200 |
| incident-response | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 장애 영향을 줄이고 복구 근거 남기기<br>board/캐시 장애 대응을 실제로 연습하기<br>board/증상만 받고 원인을 좁혀 복구하기<br>board/다른 새 장애를 도움 범위와 함께 진단하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| release-recovery | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 실패한 배포를 멈추고 데이터 복원 확인하기<br>board/앱 복귀와 별도 DB 복원을 나누어 실행하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → 200 |
| flush-observation | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 저장 직후 SQL 조회 결과 확인하기<br>project-v1/같은 트랜잭션의 JPA 쓰기와 SQL 읽기 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: project-v1 POST /api/v1/auth/login → ?<br>project-v1 POST /api/v1/posts → 201<br>project-v1 PUT /api/v1/posts/{{P.body.data.id}} → 200<br>project-v1 GET /api/v1/posts?q=10-12%20%EC%88%98%EC%A0%95%20%ED%9B%84&size=1 → 200 |
| transaction-observation | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 객체 값과 확정된 DB 값을 구분해 확인하기<br>board/같은 행의 flush·commit·rollback 비교하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| legacy-schema-evolution | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 기존 데이터 보존하며 스키마 바꾸기<br>community/기준선·추가·백필·이름 변경 순서 지키기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| reservation-schema-evolution | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 기존 앱을 유지하며 예약 메모 추가하기<br>board/이전 앱도 읽고 쓰는 nullable 메모 추가하기<br>board/백필을 재시작하고 메모 필수 조건으로 전환하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → 201<br>board   → 200 |
| audit-log | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 관리자 변경 내역 남기고 조회하기<br>board/민감한 작업의 감사 이력 보관하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board POST /api/admin/posts/{postId}/hide → 200<br>board GET /api/admin/audit-logs → 200<br>board GET /api/posts/{postId} → 200 |
| report-csv | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 신고 내역을 CSV로 내려받기<br>community/운영 권한과 CSV 형식을 지켜 내보내기 | 없음 | 배치 어색 | 삭제 복구와 분리해 신고/내보내기 feature로 이동.<br>실무 recipe: community GET /api/admin/reports/export → 200<br>community GET /api/admin/reports/export?status=PENDING → 200<br>community GET /api/admin/reports/export?status=DONE → 400<br>community GET /api/admin/reports/export → 403 |
| report-moderation | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 신고를 받고 운영자가 글 숨기기<br>board/신고 접수와 관리자 목록 연결하기<br>board/권한과 숨김 이후 상태 함께 확인하기 | 없음 | 배치 어색 | Day 57 삭제 복구에서 분리해 신고·운영 feature로 이동.<br>실무 recipe: board POST /api/posts/{postId}/reports → 201<br>board GET /api/admin/reports → 200<br>board GET /api/posts/{postId} → 200<br>board GET /api/posts/popular → 200 |
| community-moderation | extend → recovery Day 57 “운영 변경 배포와 문제 발생 대응 연습” | 신고를 처리하고 글 공개 상태 관리하기<br>community/신고 접수부터 운영자 숨김·복구·처리 연결하기 | 없음 | 배치 어색 | Day 57 복구와 분리해 신고·moderation feature로 이동.<br>실무 recipe: community POST /api/reports → 201/409<br>community PATCH /api/admin/posts/12/status → 200<br>community GET /api/posts/12 → 404<br>community POST /api/reports → 201 |
| change-delivery | extend → handover Day 60 “동료에게 넘길 수 있는 상태로 마무리하기” | 새 취소 요구를 합의하고 기존 예약에 반영하기<br>board/취소 사유 또는 새 업무 하나를 끝까지 구현하기<br>board/시작한 예약의 미지급 대상 취소 요구 반영하기 | 없음 | 배치 어색 | 재입고(Day 60)와 다른 예약 취소 요구이므로 append/예약 feature에 배치.<br>실무 recipe: board   → ? |
| independent-change | extend → handover Day 60 “동료에게 넘길 수 있는 상태로 마무리하기” | 새 요구를 설계부터 배포 확인까지 직접 완성하기<br>board/처음 받은 작은 요구를 독립 구현하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → ? |
| posts-edit-remove | link → board Day 5 “제목과 본문 수정하기” | 내 글을 수정하고 삭제하기<br>board/전체 교체와 부분 변경으로 내 글 수정하기<br>board/삭제한 글을 일반 조회에서 제외하기<br>community/전체 교체와 부분 변경으로 내 글 수정하기<br>community/삭제한 글이 다시 노출되지 않게 하기<br>project-v1/전체 교체와 부분 변경으로 내 글 수정하기<br>project-v1/삭제한 글을 일반 조회에서 제외하기 | PUT /api/posts/{id}<br>DELETE /api/posts/{id}<br>GET /api/posts/{id}<br>GET /api/posts<br>POST /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board PUT /api/posts/{postId} → 200<br>board PATCH /api/posts/{postId} → 200<br>board DELETE /api/posts/{postId} → 204<br>board GET /api/posts/{postId} → 200 |
| posts-find | link → search-comments Day 10 “제목으로 공지 검색하기” | 조건에 맞는 글 목록 이어 보기<br>board/글·태그·검색 조건을 같은 목록에 적용하기<br>community/글·태그·검색 조건을 같은 목록에 적용하기<br>project-v1/글·태그·검색 조건을 같은 목록에 적용하기 | GET /api/posts | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board GET /api/posts → 200<br>community GET /api/boards/{slug}/posts → 200<br>community GET /api/boards/free/posts?page=0&size=5 → 200<br>community GET /api/boards/free/posts?page=2&size=5 → 200 |
| members-auth | link → members Day 16 “비밀번호와 중복 가입 안전하게 처리하기” | 회원 가입과 로그인 만들기<br>board/회원 정보를 안전하게 등록하기<br>board/토큰으로 로그인하고 내 정보 확인하기 | POST /api/auth/login<br>GET /api/members/me | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board POST /api/auth/signup → 201<br>board POST /api/auth/login → 200<br>board GET /api/members/me → 200 |
| post-images | link → files Day 23 “파일 업로드와 메타데이터 저장하기” | 글에 이미지를 첨부하기<br>community/이미지 업로드·대표 이미지·정렬 관리하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community POST /api/images → 201<br>community GET /api/images/{{I0.body.fileName}} → 200<br>community POST /api/images → 415<br>community POST /api/images → 401 |
| transaction-consistency | link → orders Day 35 “주문과 재고를 함께 저장하기” | 실패해도 주문과 포인트 상태 맞추기<br>board/실패와 같은 키 경쟁에서도 상태 일치시키기 | 없음 | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board POST /api/shop/orders → 201 |
| db-query-measure | link → performance Day 43 “느린 주문 조회를 재현하고 측정하기” | 실제 스키마와 실행계획으로 느린 조회 개선하기<br>practice/추정·실측을 나누어 인덱스 효과 비교하기<br>practice/실제 테이블에서 API의 SQL 수와 병목 찾기 | 없음 | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: recipe 연결 없음 |
| contract-tests | link → quality Day 47 “기존 요청을 먼저 테스트로 고정하기” | 내 API의 정상·실패 동작을 테스트로 남기기<br>community/HTTP부터 실제 DB까지 알맞은 범위로 확인하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| runtime-ready | link → operations Day 51 “환경 설정을 코드에서 분리하기” | 서버를 실행하고 안전하게 설정하기<br>board/서버·DB를 켜고 실행 환경 나누기 | GET /actuator/health | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board GET /actuator/health → 200 |
| trash-restore | link → recovery Day 55 “관리자 복구와 작업 이력 연결” | 삭제한 글을 휴지통에서 복구하기<br>community/내 휴지통 목록에서 글 되살리기 | 없음 | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: community POST /api/posts → ?<br>community GET /api/me/trash → 200<br>community POST /api/posts/{{R0.body.id}}/restore → 200<br>community POST /api/posts/{{R0.body.id}}/restore → 409 |
| api-docs | append → append — 신규 기능 | 내 API를 실행 가능한 문서로 공개하기<br>community/명세와 실제 API의 입력·응답 맞추기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community GET /v3/api-docs/public → 200<br>community GET /v3/api-docs/admin → 200<br>community GET /v3/api-docs/swagger-config → 200<br>community GET /swagger-ui/index.html → 200 |
| browser-access | append → append — 신규 기능 | 허용한 브라우저에서 API 호출하기<br>board/실제 요청과 사전 요청을 함께 허용하기 | 없음 | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board POST /api/posts → 201 |
| notifications | append → append — 신규 기능 | 내게 온 알림을 확인하고 읽음 처리하기<br>community/알림 저장과 커서 목록·읽음 상태 연결하기<br>community/커밋한 글과 좋아요 달성에 알림 연결하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community POST /api/posts/15/comments → 201<br>community GET /api/me/notifications?size=2 → 200<br>community PUT /api/posts/1/like → 200<br>community PUT /api/posts/1/like → ? |
| post-series | append → append — 신규 기능 | 여러 글을 시리즈로 묶기<br>community/시리즈 순서와 이전·다음 글 연결하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community POST /api/series → 201<br>community PUT /api/series/{{S1.body.id}}/posts/12 → 200<br>community PUT /api/series/{{S1.body.id}}/posts/6 → 200<br>community PUT /api/series/{{S1.body.id}}/posts/14 → 200 |
| share-folder | append → append — 신규 기능 | 북마크 폴더를 읽기 전용 링크로 공유하기<br>community/공유 키로 읽되 비공개 데이터는 보호하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: community POST /api/me/bookmark-folders → 201<br>community PUT /api/posts/6/bookmark → 200<br>community PUT /api/posts/12/bookmark → 200<br>community POST /api/me/bookmark-folders/{{F1.body.id}}/share → 201 |
| reservation-plan | append → append — 신규 기능 | 미래에 쿠폰을 지급할 예약 규칙 정하기<br>board/예약 대상과 지급 사실을 구분해 모델 검증하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| reservation-history-query | append → append — 신규 기능 | 예약과 지급 이력을 빠짐없이 조회하기<br>board/집계·커서·빈 결과가 맞는 조회 만들기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: recipe 연결 없음 |
| reservation-api | append → append — 신규 기능 | 쿠폰 지급 예약을 만들고 취소하기<br>board/예약 생성과 같은 예약 상세 연결하기<br>board/같은 요청의 중복과 취소 경계 지키기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → 201<br>board   → 200<br>board   → ? |
| reservation-jobs | append → append — 신규 기능 | 예약한 쿠폰을 지급하고 실패 항목만 다시 처리하기<br>board/작은 묶음을 지급하고 항목별 결과 보여 주기<br>board/중간에 멈춰도 누락 없이 이어 지급하기<br>board/앱 두 개가 실행해도 같은 회원에게 한 번만 지급하기 | 없음 | 심화 | extend/append 유지; 입력·정책·결과가 새로 더해지는 순서를 이어 준다.<br>실무 recipe: board   → ? |
| posts-create-read | link → board Day 1 “공지 등록 요청 받기” | 글을 등록하고 다시 읽기<br>board/글 등록하기<br>board/저장한 글 상세 보기<br>community/글 등록하기<br>community/저장한 글 상세 보기<br>project-v1/명세에 맞춰 글 등록하기<br>project-v1/명세 상세에서 조회수와 댓글 트리 보여 주기 | POST /api/posts<br>GET /api/posts/{id} | 부분 중복 | 이미 link면 유지한다. extend로 다시 구현하는 행위는 입문 회차 뒤 link로 바꾸고, 같은 CRUD 단계는 생략해 신규 정책·결과만 실무 단계에 남긴다.<br>실무 recipe: board POST /api/posts → 201<br>board GET /api/posts/{postId} → 200<br>community POST /api/posts → 201<br>community GET /api/posts/{id} → 200 |

### 중복 판단 메모

- `post-create` 응답은 HTTP 201과 `id,title,content,authorName,createdAt,updatedAt` 목표 예시지만 Day 1 목표·check는 아직 DB 미저장이라고 명시한다. 실무 `posts-create-read:create`의 Location, 인증 회원, 글-태그 트랜잭션과 결과가 같다고 하지 않는다.
- Day 5 `PUT`은 제목·본문 전체 교체, ID·작성자·작성일 유지다. 실무 `posts-edit-remove`에는 같은 전체 교체가 variant별로 있고 PATCH 및 삭제 가시성 정책이 추가되어 부분 중복이다.
- Day 10은 `GET /api/posts`에서 제목 keyword·page·size와 동일 조건 total을 반환한다. `posts-find`의 route는 겹치나 프로젝트/커서·태그 계약이 달라 전부 동일 구현으로 간주하지 않는다.
- Day 14의 입력 API는 댓글 목록 조회와 삭제 트랜잭션 확인이다. 실무 `comments`의 목록 결과가 겹치지만 create/reply/edit 및 project별 계약이 추가되어 부분 중복이다.
- Day 51/53의 actuator health 응답은 `{status:"UP"}`이다. 서비스 runtime-ready와 release-containers가 동일 경로를 포함하더라도 각각 실행 환경/컨테이너 종료 조건이 더 있어 전체 기능 중복은 아니다.

## B. 개념 학습 연결

### 페이지 카탈로그 확인

- `tools/site/build.mjs`는 `docs/knowledge/*.md`와 `lessons/*.md`를 생성 대상으로 순회한다. `docs/knowledge/README.md`는 개념 문서 ID·제목·경로 색인이고 빌드 결과는 같은 이름의 `.html`이다.
- 실제 HTML 원문 수: `docs/knowledge/[A-Z]nn-*.html` 134개, `lessons`의 개별 개념 레슨 50개, `lessons/concept-core.html` 1개. README 목록 페이지는 학습 페이지 수에서 제외했다. 합계 185개 상세 페이지다.
- `docs/design/concept-curriculum-2026-10-25/classification.json`의 분류 축은 6개(문서 134개): Java 31, Spring 21, HTTP·API 20, DB·JPA 29, 테스트 7, 개발·운영 26. `docs/knowledge/README.md`의 원문 목차는 P/W/V/R/B/D/J/S 8개 문서군으로 따로 구성되어 있어 분류 6개와 혼동하지 않는다.
- 필수 기초 6단원은 `lessons/concept-core.html?unit=C01..C06`: C01 객체·생성자, C02 Spring/Boot·앱 시작, C03 애노테이션 처리 시점, C04 IoC·DI·생성자 주입, C05 Lombok 생성 코드, C06 Bean 생명주기다. 단원 원문 연결은 P09/P04, P01, P03/P27/J06, P12/P11, W19/P11, S01이다.
- 전체 문서 목록은 `docs/knowledge/README.md`와 `lessons/README.md`의 표·목차에서 확인할 수 있다. 현재 두 과정 HTML에는 개념 학습 카탈로그로 가는 링크가 없다.

#### 개념 페이지 전체 목록 (134개)

**Java (31)**

| ID | 문서 | HTML 경로 |
|---|---|---|
| P04 | P04. 객체 생성 — 생성자·정적 팩토리·Builder 패턴·생성자 주입 | `docs/knowledge/P04-constructors-builder.html` |
| P09 | P09. Java 문법 기초 — 클래스·필드·메서드·생성자를 선언하고 호출하기 | `docs/knowledge/P09-java-syntax-basics.html` |
| P10 | P10. 자료구조 실무 사용법 — 배열·List·Set·Map·Queue·Deque·PriorityQueue | `docs/knowledge/P10-data-structures-usage.html` |
| P29 | P29. static 완전 정리 — 클래스 변수·정적 메서드·상수, 그리고 Spring에서의 static | `docs/knowledge/P29-static-complete.html` |
| P31 | P31. Stream 실무 패턴 모음 — for문과 나란히, 언제 무엇을 | `docs/knowledge/P31-stream-patterns.html` |
| W19 | W19. Lombok을 쓸까 말까 — 편리함과 함정 | `docs/knowledge/W19-lombok-or-not.html` |
| W21 | W21. null 처리 전략 — Optional·JSpecify·DB NULL | `docs/knowledge/W21-null-handling.html` |
| W26 | W26. 네이밍 컨벤션 — camelCase부터 Controller·Impl까지, 왜 그렇게 짓나 | `docs/knowledge/W26-naming-conventions.html` |
| J01 | J01. 기본 타입·참조 타입·박싱·String | `docs/knowledge/J01-types-string.html` |
| J02 | J02. OOP와 Object 규약 | `docs/knowledge/J02-oop-object-contracts.html` |
| J03 | J03. 제네릭 | `docs/knowledge/J03-generics.html` |
| J04 | J04. 예외 처리 | `docs/knowledge/J04-exceptions.html` |
| J05 | J05. 모던 문법 (Java 10~25) | `docs/knowledge/J05-modern-syntax.html` |
| J06 | J06. enum·애노테이션·리플렉션 | `docs/knowledge/J06-enum-annotation-reflection.html` |
| J07 | J07. 컬렉션 프레임워크 내부 | `docs/knowledge/J07-collections-internals.html` |
| J08 | J08. 람다·함수형 인터페이스 | `docs/knowledge/J08-lambda-functional.html` |
| J09 | J09. Stream API | `docs/knowledge/J09-stream-api.html` |
| J10 | J10. 스레드와 Java Memory Model | `docs/knowledge/J10-jmm-threads.html` |
| J11 | J11. java.util.concurrent | `docs/knowledge/J11-juc.html` |
| J12 | J12. Virtual Threads·Structured Concurrency·Scoped Values | `docs/knowledge/J12-virtual-threads.html` |
| J13 | J13. JVM 구조·클래스 로딩·바이트코드 | `docs/knowledge/J13-jvm-classloading.html` |
| J14 | J14. 메모리 구조와 GC | `docs/knowledge/J14-memory-gc.html` |
| J15 | J15. JIT·성능 분석·프로파일링 | `docs/knowledge/J15-jit-profiling.html` |
| J16 | J16. 컨테이너 환경의 JVM | `docs/knowledge/J16-jvm-in-containers.html` |
| J17 | J17. Java 버전 로드맵·LTS·마이그레이션 | `docs/knowledge/J17-versions-roadmap.html` |
| J20 | J20. I/O·NIO·HttpClient·JDBC 기초 | `docs/knowledge/J20-io-nio-jdbc.html` |
| J21 | J21. 디자인 패턴과 SOLID — Spring 안에서 찾기 | `docs/knowledge/J21-design-patterns-solid.html` |
| J22 | J22. 코딩테스트 알고리즘 — Java로 빠르게 구현하기 | `docs/knowledge/J22-coding-test-algorithms.html` |
| J23 | J23. 트리 자료구조와 순회 — 이진 트리·BST | `docs/knowledge/J23-tree-traversal.html` |
| J24 | J24. 컴파일 언어 vs 인터프리터 언어 — Java는 어떻게 실행되나 | `docs/knowledge/J24-compiled-vs-interpreted.html` |
| J25 | J25. 자료구조 개념 지도 — 배열·연결 리스트·스택·큐·힙·해시·트리·그래프 | `docs/knowledge/J25-data-structures-map.html` |

**Spring (21)**

| ID | 문서 | HTML 경로 |
|---|---|---|
| P01 | P01. Spring vs Spring Boot — 무엇이 다르고 프로젝트는 어떻게 시작하나 | `docs/knowledge/P01-spring-vs-boot.html` |
| P02 | P02. MVC 패턴과 계층형 구조 — Controller·Service·Repository | `docs/knowledge/P02-mvc-layered-architecture.html` |
| P03 | P03. 애노테이션이란 — 그리고 실무에서 매일 쓰는 애노테이션 총정리 | `docs/knowledge/P03-annotations-cheatsheet.html` |
| P07 | P07. Spring Boot로 개발할 때 꼭 알아야 할 것들 — 개발 습관과 에러 해결 | `docs/knowledge/P07-boot-dev-essentials.html` |
| P11 | P11. 빈 등록과 의존성 주입 따라 하기 — @Component부터 private final + @RequiredArgsConstructor까지 | `docs/knowledge/P11-bean-registration-di.html` |
| P12 | P12. Spring 처음 — 왜 new 대신 빈으로 받나 (IoC·DI 입문) | `docs/knowledge/P12-why-beans-ioc-intro.html` |
| P27 | P27. 애노테이션은 누가·언제 실행하나 — 시점별 동작 지도 | `docs/knowledge/P27-annotations-when-how.html` |
| P28 | P28. Spring Boot가 기본으로 만드는 빈들 — 무엇이, 왜, 어떻게 확인·교체하나 | `docs/knowledge/P28-default-beans.html` |
| P30 | P30. 스케줄링 실무 — @Scheduled부터 서버 여러 대·Quartz·CronJob까지 | `docs/knowledge/P30-scheduling-practical.html` |
| W02 | W02. 왜 Controller·Service·Repository로 나누나 — 안 나누면 생기는 일 | `docs/knowledge/W02-why-layers.html` |
| W12 | W12. 인터페이스는 왜 만드나 — DI·테스트, 그리고 과잉 추상화 | `docs/knowledge/W12-why-interfaces.html` |
| W14 | W14. 동기 vs 비동기, 블로킹 vs 논블로킹 — 백엔드에서 언제 | `docs/knowledge/W14-sync-async-blocking.html` |
| W25 | W25. 스프링은 왜 멀티스레드인가 — 요청마다 스레드, 공유되는 싱글턴 빈 | `docs/knowledge/W25-spring-multithreading.html` |
| S01 | S01. IoC 컨테이너·DI·빈 생명주기 | `docs/knowledge/S01-ioc-di.html` |
| S02 | S02. AOP와 프록시 | `docs/knowledge/S02-aop-proxy.html` |
| S03 | S03. Spring Boot 자동 구성 원리 | `docs/knowledge/S03-boot-autoconfig.html` |
| S04 | S04. 외부 설정·프로파일 | `docs/knowledge/S04-config-profiles.html` |
| S07 | S07. WebFlux·리액티브와 Virtual Threads 선택 | `docs/knowledge/S07-webflux-vs-vt.html` |
| S15 | S15. 비동기·스케줄링·Spring Batch | `docs/knowledge/S15-async-scheduling-batch.html` |
| S21 | S21. Spring Boot 3→4·Framework 7 변화와 마이그레이션 | `docs/knowledge/S21-boot4-migration.html` |
| S22 | S22. 아키텍처 스타일과 DDD 기초 — 코드를 어떻게 나눌까 | `docs/knowledge/S22-architecture-ddd.html` |

**HTTP · API (20)**

| ID | 문서 | HTML 경로 |
|---|---|---|
| P06 | P06. 첫 CRUD API 만들기 — 처음부터 끝까지 따라 하기 | `docs/knowledge/P06-first-crud-api.html` |
| P16 | P16. JSON·Jackson 실무 — 요청/응답 직렬화에서 막히는 것들 | `docs/knowledge/P16-json-jackson-practical.html` |
| P17 | P17. 파일 업로드·다운로드와 외부 스토리지 | `docs/knowledge/P17-file-upload-storage.html` |
| P25 | P25. 외부 API 연동 실무 — RestClient·HTTP Interface | `docs/knowledge/P25-external-api-client.html` |
| P26 | P26. 메일 발송 실무 — JavaMailSender와 로컬 테스트 | `docs/knowledge/P26-mail-notification.html` |
| W01 | W01. API 하나 만들 때 실제 작업 순서 — DB부터? 컨트롤러부터? | `docs/knowledge/W01-api-dev-order.html` |
| W08 | W08. 예외는 어디서 잡나 — 계층별 처리와 전역 핸들러 | `docs/knowledge/W08-where-to-handle-exceptions.html` |
| W09 | W09. DTO는 왜 쓰나 — 엔티티를 그대로 반환하면 생기는 일 | `docs/knowledge/W09-why-dto.html` |
| W10 | W10. 검증은 어디서 하나 — 프론트·서버·DB, 왜 둘 다 하나 | `docs/knowledge/W10-where-to-validate.html` |
| W13 | W13. 프론트와 백엔드의 경계 — 무엇을 서버에서만 해야 하나 | `docs/knowledge/W13-frontend-backend-boundary.html` |
| W18 | W18. REST vs GraphQL vs gRPC — 선택 기준 | `docs/knowledge/W18-rest-graphql-grpc.html` |
| B01 | B01. 계정 생명주기 API — 이메일·휴대폰 인증, 비밀번호 재설정, 로그인 시도 제한 | `docs/knowledge/B01-account-lifecycle.html` |
| D02 | D02. 서버·네트워크 기초 용어 — 요청이 서버에 닿기까지 | `docs/knowledge/D02-server-network-basics.html` |
| D03 | D03. REST API 개발 과정 — 요구사항에서 배포 가능한 API까지 | `docs/knowledge/D03-rest-api-dev-process.html` |
| D11 | D11. 웹 보안 기초 — 백엔드 개발자가 막아야 할 것들 | `docs/knowledge/D11-web-security-basics.html` |
| S05 | S05. Spring MVC 요청 처리 흐름 | `docs/knowledge/S05-mvc-request-flow.html` |
| S06 | S06. REST API 설계와 HTTP 클라이언트 | `docs/knowledge/S06-rest-api-clients.html` |
| S12 | S12. Spring Security 아키텍처 | `docs/knowledge/S12-security-architecture.html` |
| S13 | S13. JWT·OAuth2·OIDC | `docs/knowledge/S13-jwt-oauth2.html` |
| S23 | S23. OpenAPI·Swagger UI — API 계약을 문서로 확인하기 | `docs/knowledge/S23-openapi-swagger.html` |

**DB · JPA (29)**

| ID | 문서 | HTML 경로 |
|---|---|---|
| P18 | P18. 동시성 문제 실전 — 재고 차감·좌석 예약을 안전하게 | `docs/knowledge/P18-concurrency-inventory.html` |
| P19 | P19. MySQL 연결과 JPA 설정 — 의존성부터 연결 에러까지 | `docs/knowledge/P19-mysql-jpa-setup.html` |
| P20 | P20. JPA 엔티티·연관관계 매핑 따라 하기 | `docs/knowledge/P20-jpa-entity-mapping.html` |
| P21 | P21. QueryDSL 설정과 동적 쿼리 실무 | `docs/knowledge/P21-querydsl-setup.html` |
| P22 | P22. 데이터소스 여러 개 쓰기와 읽기 복제본 라우팅 | `docs/knowledge/P22-multiple-datasources.html` |
| P23 | P23. Redis 연결과 사용 실무 | `docs/knowledge/P23-redis-practical.html` |
| W03 | W03. DB 접근 방식 총비교 — JDBC부터 JPA·MyBatis·QueryDSL·jOOQ까지 | `docs/knowledge/W03-db-access-comparison.html` |
| W04 | W04. MyBatis XML 쿼리 실무 — mapper·동적 SQL·#{}와 ${} | `docs/knowledge/W04-mybatis-xml-practical.html` |
| W05 | W05. JPA vs MyBatis — 언제 무엇을, 섞어 쓰는 전략 | `docs/knowledge/W05-jpa-vs-mybatis-strategy.html` |
| W11 | W11. 트랜잭션은 왜 서비스 계층에 거나 | `docs/knowledge/W11-why-tx-in-service.html` |
| W15 | W15. 페이징 — OFFSET vs 커서(키셋), 무엇을 언제 | `docs/knowledge/W15-paging-offset-vs-cursor.html` |
| W16 | W16. ID 생성 전략 — AUTO_INCREMENT vs UUID vs ULID·Snowflake | `docs/knowledge/W16-id-generation.html` |
| W17 | W17. 캐시는 어디에 — 브라우저·CDN·서버 로컬·Redis·DB | `docs/knowledge/W17-where-to-cache.html` |
| W20 | W20. 시간·타임존은 왜 매번 문제인가 | `docs/knowledge/W20-time-timezone.html` |
| W23 | W23. 캐시와 인메모리 — 무엇이고, 왜 빠르고, 왜 쓰나 | `docs/knowledge/W23-cache-and-in-memory.html` |
| W24 | W24. DB는 왜 쓰나 — 파일이나 메모리에 저장하면 안 되나 | `docs/knowledge/W24-why-database.html` |
| R01 | R01. DB 서버란 무엇인가 — DBMS·데이터베이스·스키마·테이블, 그리고 MySQL·PostgreSQL | `docs/knowledge/R01-what-is-db-server.html` |
| R02 | R02. RDB vs NoSQL — MongoDB·Redis·Cassandra는 무엇이고 언제 쓰나 | `docs/knowledge/R02-rdb-vs-nosql.html` |
| R03 | R03. 스키마와 테이블 설계 — 데이터 타입, VARCHAR(255)의 의미, PK·FK·제약 | `docs/knowledge/R03-schema-types-constraints.html` |
| R04 | R04. SQL로 데이터 다루기 — INSERT·SELECT·UPDATE·DELETE, JOIN, 트랜잭션 | `docs/knowledge/R04-sql-crud-join.html` |
| R05 | R05. 인덱스와 B-Tree — 왜 빨라지고, 언제 안 타나 | `docs/knowledge/R05-index-btree.html` |
| R06 | R06. DB 클라이언트 도구 — DBeaver는 무엇이고 왜 여러 DB에 붙을 수 있나 | `docs/knowledge/R06-db-client-tools.html` |
| R07 | R07. 백업과 복원 — DB와 서버에서 각각 무엇을, 어떻게 지키나 | `docs/knowledge/R07-backup-restore.html` |
| R08 | R08. 앱 서버와 DB 서버는 어떻게 연결되나 — 요청 하나가 DB까지 가는 전체 그림 | `docs/knowledge/R08-app-to-db-connection.html` |
| D10 | D10. DB 기초 — 백엔드 개발자가 알아야 할 관계형 데이터베이스 | `docs/knowledge/D10-database-basics.html` |
| S08 | S08. 트랜잭션 관리 | `docs/knowledge/S08-transactions.html` |
| S09 | S09. JPA·Hibernate | `docs/knowledge/S09-jpa-hibernate.html` |
| S10 | S10. Spring Data와 쿼리 도구 | `docs/knowledge/S10-spring-data-query.html` |
| S11 | S11. 캐시·Redis·DB 마이그레이션 | `docs/knowledge/S11-cache-redis-migration.html` |

**테스트 (7)**

| ID | 문서 | HTML 경로 |
|---|---|---|
| V01 | V01. 무엇을 어떻게 테스트하나 — 대상 고르기부터 테스트 하나의 구조까지 | `docs/knowledge/V01-what-and-how-to-test.html` |
| V02 | V02. 계층별 테스트 따라 하기 — Controller·Service·Repository·통합 | `docs/knowledge/V02-layered-tests-handson.html` |
| V03 | V03. mock 실전 — 무엇을 가짜로 바꾸고 무엇은 실제로 두나 | `docs/knowledge/V03-mocking-in-practice.html` |
| V04 | V04. 테스트 DB 전략 — H2 vs Testcontainers, 데이터 준비, @Transactional의 함정 | `docs/knowledge/V04-test-db-strategy.html` |
| V05 | V05. 까다로운 대상 테스트하기 — 보안·예외·비동기·동시성·파일 | `docs/knowledge/V05-testing-tricky-things.html` |
| V06 | V06. 현업 테스트 실무 — 레거시에 테스트 붙이기, 버그 재현, CI, 커버리지 | `docs/knowledge/V06-testing-at-work.html` |
| J19 | J19. Java 단위 테스트 (JUnit·Mockito·AssertJ) | `docs/knowledge/J19-testing-junit.html` |

**개발 · 운영 (26)**

| ID | 문서 | HTML 경로 |
|---|---|---|
| P05 | P05. jar·war란 무엇인가 — 빌드 결과물과 실행 | `docs/knowledge/P05-jar-war-packaging.html` |
| P08 | P08. Maven·Gradle 실무 — 빌드 파일 읽고, 의존성 넣고, 에러 고치기 | `docs/knowledge/P08-maven-gradle-practical.html` |
| P13 | P13. Git 실무 — 충돌 해결·되돌리기·브랜치 작업 | `docs/knowledge/P13-git-practical.html` |
| P14 | P14. Docker·docker compose로 로컬 개발 환경 만들기 | `docs/knowledge/P14-docker-compose-local.html` |
| P15 | P15. IntelliJ IDEA 실무 — 프로젝트 열기부터 디버깅·리팩토링까지 | `docs/knowledge/P15-intellij-practical.html` |
| P24 | P24. Kafka 연결과 사용 실무 | `docs/knowledge/P24-kafka-practical.html` |
| W06 | W06. 디버깅은 왜 서버에선 브레이크포인트·로그로, 프론트에선 console.log로 하나 | `docs/knowledge/W06-why-server-debugging.html` |
| W07 | W07. 왜 System.out.println 대신 로거(SLF4J)를 쓰나 | `docs/knowledge/W07-why-logger.html` |
| W22 | W22. 로컬에선 되는데 서버에선 왜 안 되나 — 환경 차이 점검 | `docs/knowledge/W22-works-locally-not-on-server.html` |
| D01 | D01. 코드가 운영 서버에 올라가기까지 — 개발 전 과정 한 장 | `docs/knowledge/D01-dev-lifecycle-overview.html` |
| D04 | D04. 빌드란 무엇인가 — 소스 코드가 실행 파일·이미지가 되기까지 | `docs/knowledge/D04-build-pipeline-explained.html` |
| D05 | D05. 디버깅 방법론 — 재현·관찰·가설·검증 | `docs/knowledge/D05-debugging-methodology.html` |
| D06 | D06. 배포란 무엇인가 — 환경·방식·무중단 배포·롤백 | `docs/knowledge/D06-deployment-concepts.html` |
| D07 | D07. 온프레미스 vs 클라우드 — 서버는 어디에 있고 누가 관리하나 | `docs/knowledge/D07-onprem-vs-cloud.html` |
| D08 | D08. CI/CD와 협업 흐름 — Git 브랜치부터 파이프라인·GitOps까지 | `docs/knowledge/D08-cicd-collaboration.html` |
| D09 | D09. 운영과 관측 — 배포 이후 서버를 지켜보는 법 | `docs/knowledge/D09-operations-observability.html` |
| D12 | D12. 리눅스·터미널 기본 — 서버에서 살아남기 | `docs/knowledge/D12-linux-terminal-basics.html` |
| D13 | D13. 백엔드 개발 용어 사전 — 회의에서 들리는 말 전부 | `docs/knowledge/D13-backend-glossary.html` |
| D14 | D14. 백엔드 개발자를 위한 운영체제 기초 — 프로세스·스레드·메모리·I/O | `docs/knowledge/D14-os-basics-backend.html` |
| D15 | D15. 서버 사양은 어떻게 정하나 — CPU·메모리·디스크·네트워크를 숫자로 잡는 법 | `docs/knowledge/D15-server-sizing.html` |
| S14 | S14. 메시징 (Kafka·RabbitMQ) | `docs/knowledge/S14-messaging.html` |
| S16 | S16. Actuator·관측성 (메트릭·트레이싱·로깅) | `docs/knowledge/S16-actuator-observability.html` |
| S17 | S17. Spring Boot 애플리케이션 성능 | `docs/knowledge/S17-performance-tuning.html` |
| S18 | S18. Spring Boot 테스트 | `docs/knowledge/S18-spring-testing.html` |
| S19 | S19. 패키징·컨테이너화·배포 | `docs/knowledge/S19-packaging-deploy.html` |
| S20 | S20. Spring Cloud·MSA 패턴 | `docs/knowledge/S20-spring-cloud-msa.html` |

#### Java·Spring 레슨 상세 목록 (50개)

| 문서 | HTML 경로 |
|---|---|
| A0. API 개발이 뭔가 — API 하나를 띄우고 직접 고쳐 보기 | `lessons/A0-first-api.html` |
| A1. 클라이언트와 서버 — 요청 한 번이 오가는 길 | `lessons/A1-client-server-http.html` |
| A2. HTTP 해부 — 요청·응답 글을 칸별로 | `lessons/A2-http-anatomy.html` |
| A3. 서버 프로그램 — 포트·프로세스·localhost·로그 | `lessons/A3-server-process-port.html` |
| A4. Spring Boot가 해 주는 것 — main 한 줄 뒤의 큰 그림 | `lessons/A4-what-spring-boot-does.html` |
| A5. REST API 설계와 명세서 읽기 | `lessons/A5-rest-api-design.html` |
| B1. 타입과 변수·메서드 — 타입이 이름 앞에 온다 | `lessons/B1-types-variables-methods.html` |
| B2. 클래스·객체·생성자·this — 객체를 찍어 내는 틀 | `lessons/B2-classes-objects-constructors.html` |
| B3. static과 안쪽 클래스 — DTO 함정의 뿌리 | `lessons/B3-static-and-inner-classes.html` |
| B4. record·getter·불변 — DTO가 record인 이유 | `lessons/B4-record-getter-immutable.html` |
| B5. 인터페이스와 구현 — 왜 Repository는 인터페이스인가 | `lessons/B5-interfaces.html` |
| B6. List·Map·Optional·람다 맛보기 — 목록 거르기·바꾸기와 없는 값 | `lessons/B6-collections-optional-lambda.html` |
| B7. 예외 — try/catch, 체크·언체크 | `lessons/B7-exceptions.html` |
| B8. 어노테이션은 무엇인가 — 붙여 둔 표시, 읽는 쪽은 따로 있다 | `lessons/B8-annotations.html` |
| C1. IntelliJ — 프로젝트 열기·실행·중단점 디버깅 | `lessons/C1-intellij-run-debug.html` |
| C2. Gradle — 의존성은 무엇이고 어디서 오나 | `lessons/C2-gradle-dependencies.html` |
| C3. application.yml과 프로필 — 코드는 그대로, 설정만 바꾸기 | `lessons/C3-application-yml-profiles.html` |
| C4. 로그와 스택트레이스 — 한 줄의 구조와 읽는 순서 | `lessons/C4-logs-and-stack-traces.html` |
| D1. JSON과 Jackson — 본문이 객체가 되기까지 | `lessons/D1-json-jackson.html` |
| E1. 계층을 나누는 이유 | `lessons/E1-why-layers.html` |
| E2. DB와 테이블·SQL 기초 | `lessons/E2-db-sql-basics.html` |
| E3. JPA는 무엇인가 | `lessons/E3-what-is-jpa.html` |
| E4. JPA 연관관계 첫걸음 — 글·작성자·태그·댓글을 잇기 | `lessons/E4-jpa-associations.html` |
| E5. MyBatis 첫걸음 — SQL을 내가 쥐는 방식 | `lessons/E5-mybatis-first-steps.html` |
| E6. 저장소 메서드 만들기 — 이름으로 쿼리·@Query·페이지 | `lessons/E6-repository-methods.html` |
| E7. JPA로 수정·삭제하기 — 변경 감지·삭제·대량 수정 | `lessons/E7-jpa-update-delete.html` |
| F1. 검증과 에러 응답(ProblemDetail) | `lessons/F1-validation-errors.html` |
| F2. 인증과 토큰 | `lessons/F2-auth-token.html` |
| F3. CORS — 브라우저가 막는 이유 | `lessons/F3-cors.html` |
| F4. 비밀번호 저장 — 해시·salt·BCrypt | `lessons/F4-password-storage.html` |
| F5. JWT 해부 — 토큰 안에 무엇이 있나 | `lessons/F5-jwt-anatomy.html` |
| F6. 입력 검증 실전 — null·빈 값·길이, 400과 500이 갈리는 곳 | `lessons/F6-validation-in-practice.html` |
| F7. 권한과 역할 — 관리자·내 것만 | `lessons/F7-roles-and-ownership.html` |
| F8. 요청 수 제한·도배 방지 — 429와 Retry-After | `lessons/F8-rate-limiting.html` |
| G1. 페이징과 정렬 | `lessons/G1-paging-and-sorting.html` |
| G2. 권한 규칙을 한 곳에 | `lessons/G2-access-rules-in-one-place.html` |
| G3. 트랜잭션 첫 만남 — 왜 한 번에 커밋하나 | `lessons/G3-first-transaction.html` |
| G4. 트랜잭션 실전 — 롤백 규칙·readOnly·전파·프록시 함정 | `lessons/G4-transaction-in-practice.html` |
| H1. 동시성 맛보기 — 두 요청이 동시에 오면 | `lessons/H1-concurrency-taste.html` |
| H2. 파일 업로드·다운로드 — multipart, 저장 이름, 받는 이름 | `lessons/H2-file-upload-download.html` |
| H3. 스케줄링 — @Scheduled와 "지금 실행" API | `lessons/H3-scheduling.html` |
| H4. 대량 데이터 처리 — 나눠서 지우고 바꾸기 | `lessons/H4-bulk-processing.html` |
| H5. Spring 이벤트 — 저장이 끝난 뒤에 알리기 | `lessons/H5-spring-events.html` |
| H6. @Async와 스레드 풀 — 느린 일은 뒤에서 | `lessons/H6-async-thread-pool.html` |
| H7. 캐시 — @Cacheable과 무효화 | `lessons/H7-cache-cacheable-evict.html` |
| H8. 외부 HTTP 호출 — RestClient와 타임아웃 | `lessons/H8-rest-client-timeout.html` |
| H9. CSV 내려받기와 시간 다루기 | `lessons/H9-csv-and-time.html` |
| I1. 테스트는 왜 쓰나·무엇을 시험하나 | `lessons/I1-why-tests.html` |
| J1. 실행 계획(EXPLAIN) 읽기 | `lessons/J1-reading-explain.html` |
| J2. 마이그레이션은 왜 필요한가 | `lessons/J2-why-migrations.html` |

**필수 기초 단원 페이지:** `lessons/concept-core.html?unit=C01`, `C02`, `C03`, `C04`, `C05`, `C06` (같은 HTML, query별 단원).

### 연결 가능 수와 미연결 항목

- 입문 concept 문자열은 60/60회차 모두 적어도 하나의 관련 문서로 연결할 수 있다. 아래 JSON은 제목·용어 기준의 매핑 초안이며 실제 화면의 링크가 아니다. 페이지 ID와 전체 slug는 `docs/knowledge/README.md`를 대조해 구성했다.
- 실무 138단계 중 stage 원문 `concepts[].href`가 `docs/knowledge/` 개념 페이지를 직접 가리키는 곳은 24단계다. 나머지 114단계는 개념 페이지 링크가 데이터에 없다. 이 숫자는 해당 개념을 다루는 문서가 저장소에 없다는 증거가 아니라 **회차→개념 페이지 명시 연결 부재**다.
- 단계 원문의 개념 링크가 없는 목록은 C절의 “개념 링크 미연결 단계”에 전부 열거했다. 제목·goal의 용어와 비슷한 문서가 있을 수 있으므로 이는 후보 페이지를 더 검토할 대상으로 보며, 저장소에 해당 주제의 문서가 전혀 없다는 의미로 확정하지 않았다.
- 제안하는 입문 매핑은 회차별 개념 링크를 구현할 수 있는 최소 초안이다. 실무는 단계 제목·`brief.task`에서 개념 명사를 뽑아 같은 카탈로그에 연결하되, SQL 검증과 실행 범위도 검토한 뒤 확정한다.

#### 입문 60회차 → 개념 페이지 매핑 JSON 초안

경로는 저장소 루트 기준이다. 각 항목은 실제 문서의 전체 slug와 `.html` 경로를 넣었다. “연결 가능 60”은 의미상 후보 페이지가 있다는 뜻이고, 검증 완료나 화면 반영 수가 아니다.

```json
{
  "source": "java-beginner/course.mjs",
  "catalog": "docs/knowledge/README.md",
  "days": [
    {
      "day": 1,
      "title": "공지 등록 요청 받기",
      "concept": "요청 DTO·기본 생성자·getter/setter",
      "pages": [
        "docs/knowledge/W09-why-dto.html",
        "docs/knowledge/P16-json-jackson-practical.html"
      ]
    },
    {
      "day": 2,
      "title": "공지 한 건을 DB에 저장하기",
      "concept": "Entity·PK·Repository interface·제네릭·INSERT",
      "pages": [
        "docs/knowledge/P19-mysql-jpa-setup.html",
        "docs/knowledge/P20-jpa-entity-mapping.html"
      ]
    },
    {
      "day": 3,
      "title": "공지 상세와 없는 글 처리하기",
      "concept": "Optional·조건 분기·SELECT",
      "pages": [
        "docs/knowledge/J04-exceptions.html",
        "docs/knowledge/P20-jpa-entity-mapping.html"
      ]
    },
    {
      "day": 4,
      "title": "공지 여러 건을 목록으로 보기",
      "concept": "List·제네릭·반복·정렬",
      "pages": [
        "docs/knowledge/P10-data-structures-usage.html",
        "docs/knowledge/J03-generics.html",
        "docs/knowledge/J09-stream-api.html"
      ]
    },
    {
      "day": 5,
      "title": "제목과 본문 수정하기",
      "concept": "객체 메서드·필드 변경·UPDATE",
      "pages": [
        "docs/knowledge/P09-java-syntax-basics.html",
        "docs/knowledge/P20-jpa-entity-mapping.html"
      ]
    },
    {
      "day": 6,
      "title": "공지 삭제하고 다시 확인하기",
      "concept": "DELETE·반환 없음·HTTP 204",
      "pages": [
        "docs/knowledge/P06-first-crud-api.html",
        "docs/knowledge/R04-sql-crud-join.html"
      ]
    },
    {
      "day": 7,
      "title": "잘못된 공지를 저장하지 않기",
      "concept": "Bean Validation·예외 처리·400",
      "pages": [
        "lessons/F1-validation-errors.html",
        "docs/knowledge/J04-exceptions.html"
      ]
    },
    {
      "day": 8,
      "title": "게시판 기능을 한 흐름으로 완성하기",
      "concept": "생성자 주입·인터페이스와 구현 객체·Service·단위 테스트",
      "pages": [
        "docs/knowledge/P02-mvc-layered-architecture.html",
        "docs/knowledge/P11-bean-registration-di.html",
        "docs/knowledge/V02-layered-tests-handson.html"
      ]
    },
    {
      "day": 9,
      "title": "공지를 10개씩 나누어 보기",
      "concept": "Pageable·기본값·정렬",
      "pages": [
        "docs/knowledge/W15-paging-offset-vs-cursor.html",
        "docs/knowledge/P10-data-structures-usage.html"
      ]
    },
    {
      "day": 10,
      "title": "제목으로 공지 검색하기",
      "concept": "WHERE·LIKE·Repository 조회 메서드",
      "pages": [
        "docs/knowledge/R04-sql-crud-join.html",
        "docs/knowledge/S10-spring-data-query.html"
      ]
    },
    {
      "day": 11,
      "title": "댓글 데이터를 설계하기",
      "concept": "FK·1:N·NOT NULL",
      "pages": [
        "docs/knowledge/P20-jpa-entity-mapping.html",
        "docs/knowledge/R03-schema-types-constraints.html"
      ]
    },
    {
      "day": 12,
      "title": "댓글 목록과 삭제 만들기",
      "concept": "관계 조건 조회·경로 변수 두 개",
      "pages": [
        "docs/knowledge/S10-spring-data-query.html",
        "docs/knowledge/R04-sql-crud-join.html"
      ]
    },
    {
      "day": 13,
      "title": "긴 목록과 잘못된 입력 점검하기",
      "concept": "경계값·파라미터 검증·응답 DTO",
      "pages": [
        "lessons/F1-validation-errors.html",
        "docs/knowledge/W10-where-to-validate.html",
        "docs/knowledge/P16-json-jackson-practical.html"
      ]
    },
    {
      "day": 14,
      "title": "댓글 있는 글 삭제를 한 번에 처리하기",
      "concept": "트랜잭션 첫 경험·실패 시 원상 복구",
      "pages": [
        "docs/knowledge/S08-transactions.html",
        "docs/knowledge/W11-why-tx-in-service.html"
      ]
    },
    {
      "day": 15,
      "title": "회원 데이터와 브라우저 인증 준비하기",
      "concept": "UNIQUE·Security 기본 설정·CSRF 준비",
      "pages": [
        "docs/knowledge/R03-schema-types-constraints.html",
        "docs/knowledge/S12-security-architecture.html",
        "lessons/F2-auth-token.html"
      ]
    },
    {
      "day": 16,
      "title": "비밀번호와 중복 가입 안전하게 처리하기",
      "concept": "PasswordEncoder·DB 제약·409",
      "pages": [
        "lessons/F4-password-storage.html",
        "docs/knowledge/R03-schema-types-constraints.html"
      ]
    },
    {
      "day": 17,
      "title": "세션으로 로그인 유지하기",
      "concept": "SecurityContext·세션·쿠키",
      "pages": [
        "docs/knowledge/S12-security-architecture.html",
        "lessons/F2-auth-token.html"
      ]
    },
    {
      "day": 18,
      "title": "브라우저 인증과 CSRF 연결하기",
      "concept": "CSRF·쿠키·인증과 인가",
      "pages": [
        "docs/knowledge/S12-security-architecture.html",
        "lessons/F2-auth-token.html"
      ]
    },
    {
      "day": 19,
      "title": "작성자 입력을 로그인 회원으로 바꾸기",
      "concept": "마이그레이션·FK·서버 신뢰 값",
      "pages": [
        "docs/knowledge/P20-jpa-entity-mapping.html",
        "docs/knowledge/R03-schema-types-constraints.html",
        "docs/knowledge/W16-id-generation.html"
      ]
    },
    {
      "day": 20,
      "title": "본인 글과 다른 사람 글 구분하기",
      "concept": "인증 401·인가 403·소유권",
      "pages": [
        "docs/knowledge/S12-security-architecture.html",
        "lessons/G2-access-rules-in-one-place.html"
      ]
    },
    {
      "day": 21,
      "title": "로그아웃과 만료된 세션 처리하기",
      "concept": "세션 무효화·상태 변화·기밀 정보",
      "pages": [
        "docs/knowledge/S12-security-architecture.html",
        "lessons/F2-auth-token.html"
      ]
    },
    {
      "day": 22,
      "title": "권한별 회귀 테스트 만들기",
      "concept": "MockMvc·인증 테스트·접근 행렬",
      "pages": [
        "docs/knowledge/V02-layered-tests-handson.html",
        "docs/knowledge/S18-spring-testing.html"
      ]
    },
    {
      "day": 23,
      "title": "파일 업로드와 메타데이터 저장하기",
      "concept": "MultipartFile·IO·메타데이터",
      "pages": [
        "docs/knowledge/P17-file-upload-storage.html"
      ]
    },
    {
      "day": 24,
      "title": "파일 크기와 형식 검증하기",
      "concept": "byte·입력 검증·예외 경계",
      "pages": [
        "docs/knowledge/P17-file-upload-storage.html",
        "lessons/F6-validation-in-practice.html"
      ]
    },
    {
      "day": 25,
      "title": "첨부 다운로드와 삭제 만들기",
      "concept": "바이너리 응답·헤더·권한",
      "pages": [
        "docs/knowledge/P17-file-upload-storage.html"
      ]
    },
    {
      "day": 26,
      "title": "DB와 파일 실패를 따로 처리하기",
      "concept": "DB 트랜잭션·보상 처리·재시도",
      "pages": [
        "docs/knowledge/S08-transactions.html",
        "docs/knowledge/P17-file-upload-storage.html"
      ]
    },
    {
      "day": 27,
      "title": "상품 기획을 테이블과 API로 옮기기",
      "concept": "도메인·스키마·PK·자료형 선택",
      "pages": [
        "docs/knowledge/P20-jpa-entity-mapping.html",
        "docs/knowledge/R03-schema-types-constraints.html"
      ]
    },
    {
      "day": 28,
      "title": "관리자 상품 등록하기",
      "concept": "권한 재사용·검증·생성 응답",
      "pages": [
        "docs/knowledge/S12-security-architecture.html",
        "lessons/F1-validation-errors.html"
      ]
    },
    {
      "day": 29,
      "title": "판매 상품 목록과 상세 만들기",
      "concept": "조건 조회·페이징·DTO 재사용",
      "pages": [
        "docs/knowledge/W15-paging-offset-vs-cursor.html",
        "docs/knowledge/S10-spring-data-query.html"
      ]
    },
    {
      "day": 30,
      "title": "가격을 바꾸고 판매 중지하기",
      "concept": "전체 수정·변경 가능 필드",
      "pages": [
        "docs/knowledge/S06-rest-api-clients.html",
        "docs/knowledge/P06-first-crud-api.html"
      ]
    },
    {
      "day": 31,
      "title": "상품 경계와 권한 테스트하기",
      "concept": "서비스 테스트·인가 테스트",
      "pages": [
        "docs/knowledge/V02-layered-tests-handson.html",
        "docs/knowledge/S18-spring-testing.html"
      ]
    },
    {
      "day": 32,
      "title": "주문에 넘길 상품 계약 확정하기",
      "concept": "계약·스냅샷·변경 영향",
      "pages": [
        "docs/knowledge/S06-rest-api-clients.html",
        "docs/knowledge/S23-openapi-swagger.html"
      ]
    },
    {
      "day": 33,
      "title": "주문과 품목 테이블 설계하기",
      "concept": "1:N·스냅샷·Enum",
      "pages": [
        "docs/knowledge/P20-jpa-entity-mapping.html",
        "docs/knowledge/J06-enum-annotation-reflection.html"
      ]
    },
    {
      "day": 34,
      "title": "상품 가격으로 주문 금액 계산하기",
      "concept": "서버 검증·long·도메인 규칙",
      "pages": [
        "docs/knowledge/P09-java-syntax-basics.html",
        "docs/knowledge/J01-types-string.html"
      ]
    },
    {
      "day": 35,
      "title": "주문과 재고를 함께 저장하기",
      "concept": "@Transactional·flush·commit·rollback",
      "pages": [
        "docs/knowledge/S08-transactions.html",
        "docs/knowledge/W11-why-tx-in-service.html"
      ]
    },
    {
      "day": 36,
      "title": "내 주문 목록과 상세 제공하기",
      "concept": "회원 조건·JOIN·응답 조합",
      "pages": [
        "docs/knowledge/R04-sql-crud-join.html",
        "docs/knowledge/S10-spring-data-query.html"
      ]
    },
    {
      "day": 37,
      "title": "주문 취소하고 재고 복구하기",
      "concept": "상태 전이·중복 부작용",
      "pages": [
        "docs/knowledge/S08-transactions.html",
        "docs/knowledge/W11-why-tx-in-service.html"
      ]
    },
    {
      "day": 38,
      "title": "실패 주문을 자동 테스트하기",
      "concept": "통합 테스트·격리 데이터·상태 검증",
      "pages": [
        "docs/knowledge/S18-spring-testing.html",
        "docs/knowledge/V02-layered-tests-handson.html"
      ]
    },
    {
      "day": 39,
      "title": "마지막 재고 주문 경합 재현하기",
      "concept": "스레드·동시 시작·경쟁 조건",
      "pages": [
        "docs/knowledge/J10-jmm-threads.html",
        "docs/knowledge/J11-juc.html"
      ]
    },
    {
      "day": 40,
      "title": "재고 차감을 DB에서 원자적으로 만들기",
      "concept": "비관적 락 또는 조건부 UPDATE",
      "pages": [
        "docs/knowledge/P18-concurrency-inventory.html",
        "docs/knowledge/R05-index-btree.html"
      ]
    },
    {
      "day": 41,
      "title": "주문 재시도에 같은 결과 돌려주기",
      "concept": "멱등성·복합 UNIQUE·트랜잭션",
      "pages": [
        "docs/knowledge/S06-rest-api-clients.html"
      ]
    },
    {
      "day": 42,
      "title": "동시 취소와 재고 불변 확인하기",
      "concept": "상태 조건 갱신·재시도·불변식",
      "pages": [
        "docs/knowledge/S08-transactions.html",
        "docs/knowledge/P18-concurrency-inventory.html"
      ]
    },
    {
      "day": 43,
      "title": "느린 주문 조회를 재현하고 측정하기",
      "concept": "가설·쿼리 로그·측정 조건",
      "pages": [
        "docs/knowledge/R04-sql-crud-join.html",
        "docs/knowledge/S17-performance-tuning.html"
      ]
    },
    {
      "day": 44,
      "title": "목록의 N+1 쿼리 줄이기",
      "concept": "지연 로딩·JOIN·DTO projection",
      "pages": [
        "docs/knowledge/S09-jpa-hibernate.html",
        "docs/knowledge/P20-jpa-entity-mapping.html"
      ]
    },
    {
      "day": 45,
      "title": "복합 인덱스 후보 비교하기",
      "concept": "WHERE·ORDER BY·EXPLAIN",
      "pages": [
        "docs/knowledge/R05-index-btree.html",
        "docs/knowledge/S17-performance-tuning.html"
      ]
    },
    {
      "day": 46,
      "title": "성능 변경을 회귀 테스트와 설명으로 남기기",
      "concept": "회귀·동일 조건 비교·리뷰 설명",
      "pages": [
        "docs/knowledge/V02-layered-tests-handson.html",
        "docs/knowledge/J19-testing-junit.html"
      ]
    },
    {
      "day": 47,
      "title": "기존 요청을 먼저 테스트로 고정하기",
      "concept": "계약 테스트·회귀 기준",
      "pages": [
        "docs/knowledge/S18-spring-testing.html",
        "docs/knowledge/S23-openapi-swagger.html"
      ]
    },
    {
      "day": 48,
      "title": "긴급 표시를 기존 데이터와 함께 추가하기",
      "concept": "DB migration·기본값·호환",
      "pages": [
        "docs/knowledge/R07-backup-restore.html",
        "docs/knowledge/D03-rest-api-dev-process.html"
      ]
    },
    {
      "day": 49,
      "title": "계층별 테스트와 CI 묶기",
      "concept": "단위/슬라이스/통합·테스트 격리",
      "pages": [
        "docs/knowledge/S18-spring-testing.html",
        "docs/knowledge/V02-layered-tests-handson.html"
      ]
    },
    {
      "day": 50,
      "title": "API 문서와 리뷰 가능한 변경 설명 쓰기",
      "concept": "OpenAPI·변경 영향·리뷰",
      "pages": [
        "docs/knowledge/S23-openapi-swagger.html",
        "docs/knowledge/S06-rest-api-clients.html"
      ]
    },
    {
      "day": 51,
      "title": "환경 설정을 코드에서 분리하기",
      "concept": "프로파일·환경 변수·비밀값",
      "pages": [
        "docs/knowledge/S04-config-profiles.html",
        "docs/knowledge/P07-boot-dev-essentials.html"
      ]
    },
    {
      "day": 52,
      "title": "컨테이너에서 같은 서버 띄우기",
      "concept": "JAR·Dockerfile·네트워크·볼륨",
      "pages": [
        "docs/knowledge/S19-packaging-deploy.html",
        "docs/knowledge/P14-docker-compose-local.html"
      ]
    },
    {
      "day": 53,
      "title": "상태와 로그로 문제 찾기",
      "concept": "Actuator·식별자·운영 관찰",
      "pages": [
        "docs/knowledge/S16-actuator-observability.html",
        "docs/knowledge/D09-operations-observability.html"
      ]
    },
    {
      "day": 54,
      "title": "삭제 정책 변경과 기존 데이터 이관 설계",
      "concept": "논리 삭제·NULL 기본값·배포 순서",
      "pages": [
        "docs/knowledge/R07-backup-restore.html",
        "docs/knowledge/S10-spring-data-query.html"
      ]
    },
    {
      "day": 55,
      "title": "관리자 복구와 작업 이력 연결",
      "concept": "상태 전이·감사 이력·서버 시각",
      "pages": [
        "docs/knowledge/S08-transactions.html",
        "docs/knowledge/S16-actuator-observability.html"
      ]
    },
    {
      "day": 56,
      "title": "삭제 글이 다른 경로로 새지 않게 하기",
      "concept": "공통 조회 조건·권한·회귀 테스트",
      "pages": [
        "docs/knowledge/S10-spring-data-query.html",
        "docs/knowledge/S12-security-architecture.html"
      ]
    },
    {
      "day": 57,
      "title": "운영 변경 배포와 문제 발생 대응 연습",
      "concept": "호환 배포·원인 추적·안전한 rollback",
      "pages": [
        "docs/knowledge/S19-packaging-deploy.html",
        "docs/knowledge/R07-backup-restore.html",
        "docs/knowledge/D09-operations-observability.html"
      ]
    },
    {
      "day": 58,
      "title": "새 재입고 업무를 직접 설계하기",
      "concept": "요구 명세·상태 변화·API 계약",
      "pages": [
        "docs/knowledge/S06-rest-api-clients.html"
      ]
    },
    {
      "day": 59,
      "title": "재입고 구현과 실패·경합 테스트하기",
      "concept": "원자적 증가·통합 검증·회귀",
      "pages": [
        "docs/knowledge/P18-concurrency-inventory.html",
        "docs/knowledge/J11-juc.html"
      ]
    },
    {
      "day": 60,
      "title": "동료에게 넘길 수 있는 상태로 마무리하기",
      "concept": "인수인계·장애 대응·리뷰",
      "pages": [
        "docs/knowledge/D08-cicd-collaboration.html",
        "docs/knowledge/S18-spring-testing.html"
      ]
    }
  ]
}
```

## C. 통합본에서 빠지거나 비어 있는 부분

### 화면 설계

`service/course-view/<feature>.json`에서 `screens`가 비어 있는 feature 23개다. feature 원본 JSON에도 자체 화면 목록이 없고, sourceUnits는 관련 기획 원문 위치를 제공한다. 원문 근거가 있으므로 입력·상태·출력 사례를 참고해 화면안을 만들 수는 있으나, 빈 목록을 원문이 이미 설계한 화면처럼 채우면 안 된다. 각 sourceUnit의 실제 문서에서 필요한 화면 동작을 확인하고 별도 설계해야 한다.

- `follow-recommendations` — overlay screens 0개; sourceUnits: legacy:8-3; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `request-context` — overlay screens 0개; sourceUnits: course:D01-4, course:D12-4, course:D19-1, course:D19-2, support:course/tickets/B05.md, support:course/java/J19.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `time-policy` — overlay screens 0개; sourceUnits: course:D20-1, course:D13-3, support:course/tickets/B09.md, support:course/java/J09.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `db-result-integrity` — overlay screens 0개; sourceUnits: support:scenario/db-query-journey/db-03-detail-join.md, support:scenario/db-query-journey/db-05-aggregate-fanout.md, support:scenario/db-query-journey/db-06-exists-not-exists.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `jvm-capacity` — overlay screens 0개; sourceUnits: course:D39-1, course:D39-2, support:course/java/J39.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `api-compatibility` — overlay screens 0개; sourceUnits: course:D30-1, course:D30-2, support:course/java/J30.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `decision-review` — overlay screens 0개; sourceUnits: course:D41-1, course:D41-2, support:course/java/J41.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `independent-repair` — overlay screens 0개; sourceUnits: course:D16-1, course:D16-2, course:D17-1, course:D17-2, support:course/java/J16.md, support:course/java/J17.md, course:D18-1, course:D18-2, support:course/java/J18.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `explain-handoff` — overlay screens 0개; sourceUnits: course:D15-1, course:D15-2, support:course/java/J15.md, course:D42-1, course:D42-2, support:course/java/J42.md, course:D43-1, course:D43-2, support:course/java/J43.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `bounded-workers` — overlay screens 0개; sourceUnits: course:D20-2, support:course/java/J20.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `incident-response` — overlay screens 0개; sourceUnits: course:D14-6, support:course/tickets/drill.md, course:D40-1, course:D40-2, support:course/java/J40.md, course:D45-1, course:D45-2, support:course/java/J45.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `release-recovery` — overlay screens 0개; sourceUnits: course:D29-1, course:D29-2, support:course/java/J29.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `transaction-observation` — overlay screens 0개; sourceUnits: course:D21-1, course:D21-2, support:course/java/J21.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `legacy-schema-evolution` — overlay screens 0개; sourceUnits: legacy:9-1, legacy:9-3, legacy:9-5; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `reservation-schema-evolution` — overlay screens 0개; sourceUnits: course:D27-1, course:D27-2, course:D13-5, support:course/tickets/B06.md, support:course/java/J27.md, course:D28-1, course:D28-2, support:course/java/J28.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `change-delivery` — overlay screens 0개; sourceUnits: course:D35-1, course:D35-2, course:D36-1, course:D36-2, support:course/java/J35.md, support:course/java/J36.md, course:D37-1, course:D37-2, support:course/java/J37.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `independent-change` — overlay screens 0개; sourceUnits: course:D44-1, course:D44-2, support:course/java/J44.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `db-query-measure` — overlay screens 0개; sourceUnits: support:scenario/db-query-journey/DB-08-explain-hypothesis.md, support:scenario/db-query-journey/DB-09-explain-analyze.md, support:scenario/db-query-journey/DB-10-performance-fixture.md, support:scenario/db-query-journey/DB-11-index-lifecycle.md, support:scenario/db-query-journey/db-12-join-exists-explain.md, support:scenario/db-query-journey/db-13-list-api-n-plus-one.md, support:scenario/db-query-journey/db-14-live-schema-to-slow-query.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `contract-tests` — overlay screens 0개; sourceUnits: legacy:7-1, legacy:7-2, legacy:7-3; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `reservation-plan` — overlay screens 0개; sourceUnits: course:D23-1, course:D23-2, support:course/java/J23.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `reservation-history-query` — overlay screens 0개; sourceUnits: course:D24-1, course:D24-2, support:course/java/J24.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `reservation-api` — overlay screens 0개; sourceUnits: course:D25-1, support:course/java/J25.md, course:D25-2; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.
- `reservation-jobs` — overlay screens 0개; sourceUnits: course:D32-1, course:D32-2, support:course/java/J32.md, course:D33-1, course:D33-2, support:course/java/J33.md, course:D34-1, course:D34-2, support:course/java/J34.md; feature screens: 필드 없음. 원문은 단계 근거는 제공하지만 화면 fields/actions는 구조화해 두지 않음.

### 단계별 실행 확인 누락

전체 138 variant-stage를 세었다. API recipe가 비었다는 뜻은 해당 단계의 `recipeIds`가 `service/api-contracts.json`의 계약을 가리키지 않는 경우이고, DB SQL이 비었다는 뜻은 연결 recipe 중 `manualDb[].sql`이 하나도 없는 경우다. `executionChecks` 테스트 명령과는 별도 필드다.

- API 테스트용 계약(recipeIds) 부재: 24단계. 목록: `request-context:board:context`, `time-policy:board:policy`, `shared-state-isolation:board:snapshots`, `db-list-queries:practice:list`, `db-list-queries:practice:styles`, `db-result-integrity:practice:joins`, `jvm-capacity:board:capacity`, `decision-review:board:decision`, `independent-repair:board:first`, `independent-repair:board:second`, `explain-handoff:board:initial`, `explain-handoff:board:later`, `explain-handoff:board:handoff`, `bounded-workers:board:queue`, `incident-response:board:guided`, `incident-response:board:unknown`, `incident-response:board:independent`, `transaction-observation:board:observe`, `legacy-schema-evolution:community:migrate`, `db-query-measure:practice:plans`, `db-query-measure:practice:live`, `contract-tests:community:verify`, `reservation-plan:board:model`, `reservation-history-query:board:history`.
- DB 확인 SQL 부재: 112단계. 목록은 다음과 같다.

- `badword-policy:community:filter`
- `post-drafts:community:publish`
- `post-history:community:history`
- `post-copy:community:copy`
- `post-tags:community:tags`
- `pinned-posts:community:pin`
- `post-visibility:community:visibility`
- `scheduled-publish:community:schedule`
- `purge-trash:community:purge`
- `post-view-dedupe:community:view`
- `integrated-search:community:search`
- `dynamic-query:community:search`
- `monthly-archive:community:archive`
- `comments:board:comments`
- `comments:community:comments`
- `comments:community:edit`
- `comments:project-v1:comments`
- `likes:project-v1:likes`
- `emoji-reactions:community:react`
- `polls:community:vote`
- `bookmarks:community:save`
- `recent-history:community:recent`
- `my-marked-posts:community:marked`
- `tag-related-posts:community:related`
- `follow-feed:community:feed`
- `follow-recommendations:community:recommend`
- `activity-summary:community:summary`
- `weekly-snapshots:community:weekly`
- `hall-of-fame:community:daily`
- `popular-cache:board:reload`
- `community-popular-cache:community:cache`
- `counter-reconcile:community:repair`
- `legacy-members:project-v1:auth`
- `sessions:project-v1:session`
- `token-lifecycle:board:lifecycle`
- `login-rate-limit:board:limit`
- `member-suspension:community:suspend`
- `request-context:board:context`
- `link-preview:community:preview`
- `points-charge:board:charge`
- `points-charge:board:callback`
- `points-coupon-shop:board:coupons`
- `points-coupon-shop:board:purchase`
- `coupon-bulk:board:upload`
- `time-policy:board:policy`
- `coupon-limits:board:issue`
- `multi-process-load:board:load`
- `shared-state-isolation:board:snapshots`
- `db-list-queries:practice:list`
- `db-list-queries:practice:styles`
- `db-result-integrity:practice:joins`
- `query-options:community:join`
- `query-options:community:implementations`
- `query-options:practice:join`
- `index-lifecycle:community:measure`
- `jvm-capacity:board:capacity`
- `api-compatibility:board:list`
- `api-compatibility:board:state`
- `api-compatibility:board:compat`
- `read-change-safely:board:change`
- `decision-review:board:decision`
- `independent-repair:board:first`
- `independent-repair:board:second`
- `explain-handoff:board:initial`
- `explain-handoff:board:later`
- `explain-handoff:board:handoff`
- `legacy-runtime:community:community`
- `legacy-runtime:project-v1:project`
- `async-dispatch:community:async`
- `bounded-workers:board:queue`
- `job-run-records:community:jobs`
- `release-containers:board:release`
- `incident-response:board:guided`
- `incident-response:board:unknown`
- `incident-response:board:independent`
- `release-recovery:board:recover`
- `flush-observation:project-v1:flush`
- `transaction-observation:board:observe`
- `legacy-schema-evolution:community:migrate`
- `reservation-schema-evolution:board:expand`
- `reservation-schema-evolution:board:contract`
- `report-csv:community:export`
- `community-moderation:community:report`
- `change-delivery:board:change`
- `change-delivery:board:revise`
- `independent-change:board:deliver`
- `posts-edit-remove:project-v1:edit`
- `posts-edit-remove:project-v1:delete`
- `posts-find:project-v1:list`
- `members-auth:board:register`
- `members-auth:board:login`
- `post-images:community:images`
- `transaction-consistency:board:rollback`
- `db-query-measure:practice:plans`
- `db-query-measure:practice:live`
- `contract-tests:community:verify`
- `runtime-ready:board:run`
- `trash-restore:community:restore`
- `api-docs:community:docs`
- `notifications:community:inbox`
- `notifications:community:events`
- `post-series:community:series`
- `share-folder:community:share`
- `reservation-plan:board:model`
- `reservation-history-query:board:history`
- `reservation-api:board:reserve`
- `reservation-api:board:cancel`
- `reservation-jobs:board:chunk`
- `reservation-jobs:board:restart`
- `reservation-jobs:board:ownership`
- `posts-create-read:project-v1:create`
- `posts-create-read:project-v1:read`

- 질문형 힌트: 0단계에서 질문형 hint가 없었다. (물음표 또는 한국어 의문 종결 표현 기준.)
- 완료 기준: 0단계에서 `brief.done`, `done`, `brief.success`, `success`가 모두 비어 있었다.
- `executionChecks`는 별도 확인 명령·기대·기록란이다. 위 누락은 이를 대신하지 않으며, API recipe 부재 단계가 항상 검증 불가라는 뜻도 아니다. 현재 API 계약을 묶어 실행하는 직접 경로가 데이터에 없다는 의미다.

#### 개념 링크 미연결 단계

아래 목록은 `stage.concepts[].href`가 `docs/knowledge/`를 가리키지 않는 실무 단위다. 명칭은 feature:variant:stage이며 총 114개다. 일부는 scenario/lesson 참조가 있거나 다른 필드에 개념 설명이 있을 수 있다.

- `badword-policy:community:filter`
- `post-drafts:community:publish`
- `post-history:community:history`
- `post-copy:community:copy`
- `pinned-posts:community:pin`
- `post-rate-limit:community:limit`
- `scheduled-publish:community:schedule`
- `purge-trash:community:purge`
- `post-view-dedupe:community:view`
- `integrated-search:community:search`
- `monthly-archive:community:archive`
- `comments:board:comments`
- `comments:project-v1:comments`
- `likes:board:likes`
- `likes:project-v1:likes`
- `emoji-reactions:community:react`
- `polls:community:vote`
- `recent-history:community:recent`
- `tag-related-posts:community:related`
- `follow-feed:community:feed`
- `activity-ranking:board:rank`
- `weekly-snapshots:community:weekly`
- `hall-of-fame:community:daily`
- `popular-cache:board:cache`
- `popular-cache:board:reload`
- `community-popular-cache:community:cache`
- `legacy-members:project-v1:auth`
- `sessions:project-v1:session`
- `token-lifecycle:board:lifecycle`
- `login-rate-limit:board:limit`
- `member-suspension:community:suspend`
- `request-context:board:context`
- `link-preview:community:preview`
- `points-charge:board:charge`
- `points-charge:board:callback`
- `points-coupon-shop:board:points`
- `points-coupon-shop:board:coupons`
- `points-coupon-shop:board:purchase`
- `coupon-bulk:board:upload`
- `time-policy:board:policy`
- `coupon-limits:board:issue`
- `multi-process-load:board:load`
- `shared-state-isolation:board:snapshots`
- `shared-state-isolation:board:shared-tag`
- `db-list-queries:practice:list`
- `db-list-queries:practice:styles`
- `db-result-integrity:practice:joins`
- `query-options:community:implementations`
- `query-options:practice:join`
- `diagnose-slow-requests:board:pg`
- `diagnose-slow-requests:board:query`
- `jvm-capacity:board:capacity`
- `api-compatibility:board:list`
- `api-compatibility:board:state`
- `api-compatibility:board:compat`
- `read-change-safely:board:understand`
- `read-change-safely:board:change`
- `decision-review:board:decision`
- `independent-repair:board:first`
- `independent-repair:board:second`
- `explain-handoff:board:initial`
- `explain-handoff:board:later`
- `explain-handoff:board:handoff`
- `legacy-runtime:project-v1:project`
- `async-dispatch:community:async`
- `bounded-workers:board:queue`
- `job-run-records:community:jobs`
- `notification-channels:board:channel`
- `release-containers:board:release`
- `incident-response:board:guided`
- `incident-response:board:unknown`
- `incident-response:board:independent`
- `release-recovery:board:recover`
- `flush-observation:project-v1:flush`
- `transaction-observation:board:observe`
- `reservation-schema-evolution:board:expand`
- `reservation-schema-evolution:board:contract`
- `audit-log:board:record`
- `report-csv:community:export`
- `report-moderation:board:report`
- `report-moderation:board:verify`
- `community-moderation:community:report`
- `change-delivery:board:change`
- `change-delivery:board:revise`
- `independent-change:board:deliver`
- `posts-edit-remove:board:edit`
- `posts-edit-remove:board:delete`
- `posts-edit-remove:project-v1:edit`
- `posts-edit-remove:project-v1:delete`
- `posts-find:board:list`
- `posts-find:project-v1:list`
- `members-auth:board:register`
- `members-auth:board:login`
- `post-images:community:images`
- `transaction-consistency:board:rollback`
- `db-query-measure:practice:plans`
- `db-query-measure:practice:live`
- `runtime-ready:board:run`
- `trash-restore:community:restore`
- `api-docs:community:docs`
- `browser-access:board:cors`
- `notifications:community:inbox`
- `notifications:community:events`
- `post-series:community:series`
- `share-folder:community:share`
- `reservation-plan:board:model`
- `reservation-history-query:board:history`
- `reservation-api:board:reserve`
- `reservation-api:board:cancel`
- `reservation-jobs:board:chunk`
- `reservation-jobs:board:restart`
- `reservation-jobs:board:ownership`
- `posts-create-read:project-v1:create`
- `posts-create-read:project-v1:read`

### 필드 구성 차이

| 항목 | 입문 회차 | 실무 단계 변환 | 영향 |
|---|---|---|---|
| 업무 요청서 | `ticket`을 회차에 붙여 요청자·상황·요청·제약·acceptance 표시. 현재 입문 원본 ticket 14개 | service 변환의 `stageData`는 ticket 필드를 만들지 않음. feature-level brief는 있으나 요청자별 ticket 형태가 아님 | 실무 회차에서는 업무 요청의 주체/배경이 회차마다 보이지 않는다. 원문 scenario를 재구성할 수 있으나 원문 없는 요청자를 만들면 안 됨 |
| 오늘 필요한 개념 | 회차 `concept` 원문 문자열 | `stage.concepts[].label`을 합치거나 비어 있으면 “원문에 개념 이름이 등록되지 않았습니다.” 표시 | 개념 이름과 링크를 일관되게 제공하지 않음. 위 매핑 초안 형식으로 concept id/href를 별도 보강 |
| 목표/할 일/확인 | `goal/tasks/check` 필드 | `brief.task/work/done/success`를 goal/tasks/check로 변환 | 구조는 대응하지만 업무 요청서는 별도 |
| API 계약 | 회차 `apiIds`가 입문 과정 자체 API 정의 참조 | 실무 `recipeIds`를 project별 recipe에 연결 | route 이름만 같아도 project/인증/요청·응답·정책이 다를 수 있어 대조 필요 |
| DB 확인 | 입문 기능의 공통 API/DB 탭에 회차 확인이 있음 | recipe의 `manualDb`에서만 SQL을 모음 | SQL이 없는 단계는 직접 DB 확인 경로가 약해짐 |

## 다음에 구현할 일

| 순위 | 무엇 | 대상 파일 | 예상 규모 |
|---:|---|---|---|
| 1 | 중복·부자연스러운 anchor 수정. `comments`, `posts-edit-remove`의 재확인 단계는 줄이고 신규 정책만 남김 | `java-service/merge-plan.json`, 필요하면 `java-service/combined-course.mjs` | 매핑 약 10~20건 재배치/범위 정리; 코드 변경은 표현 조정이 필요할 때 |
| 2 | concept page id/href 정식 필드와 입문 60회차 매핑 추가, 두 과정 화면에서 “오늘 필요한 개념” 링크 노출 | `java-beginner/course.mjs`, `java-beginner/view.mjs`, `java-service/service-course.mjs`, `java-service/view.mjs` | 입문 60개 매핑 + 실무 138단계 연결 backlog; 렌더러 2개 |
| 3 | 비어 있는 23개 화면 목록을 sourceUnit 원문 대조 후 입력·상태·결과로 설계 | `service/course-view/<id>.json` 23개 | overlay 23개, 실제 screens 개수는 원문별 검토 후 결정 |
| 4 | API recipe 24단계 보강 여부 판정, SQL 112단계는 원문 근거가 있을 때만 추가 | `service/features/*.json`, `service/api-contracts.json` (계약 생성 경로 확인 후) | 총 136단계 근거 검토, 실제 추가 건수는 근거에 따라 확정 |
| 5 | 실무 회차 업무 요청 주체/상황을 원문 근거로 ticket 또는 동등 표현에 연결 | `service/features/*.json`, `java-service/service-course.mjs`, `java-service/view.mjs` | 138단계 source 검토 + 데이터 연결/표현 각 1곳 |
| 6 | 질문형 힌트·완료 기준 정합성 검사 범위를 정하고 회귀 확인 | 검증 도구 경로는 현재 미확정 | 정적 검사 규칙 2~3개, 도구 위치 확인 필요 |

## 근거 파일과 한계

- 배치 기준: `java-service/merge-plan.json`; 통합 흐름: `java-service/combined-course.mjs`.
- 입문 회차와 API: `java-beginner/course.mjs`; 입문 화면 표현: `java-beginner/view.mjs`.
- 실무 단계·원문 근거: `service/features/<id>.json`; 문체/화면 overlay: `service/course-view/<id>.json`.
- project별 요청/응답 및 DB 확인 SQL: `service/api-contracts.json`의 recipe `id/project/method/path/expected/manualDb`.
- 실무 회차 변환 시 concept, tasks, check, hints, executionChecks, sourceLinks: `java-service/service-course.mjs`; 보이는 화면: `java-service/view.mjs`.
- 개념 페이지/빌드 위치: `tools/site/build.mjs`, `tools/site/concept-curriculum.mjs`, `docs/knowledge/README.md`, `lessons/concept-core.md`.
- 이 감사는 정적 원문·구조 검토다. 실제 browser/API/DB 동작, 생성 HTML의 실제 UI, 모든 sourceUnit 원문의 시각적 사실은 실행·시각 검증하지 않았다. 화면 연결·응답 형식의 실동작을 통과로 간주하지 않는다.
