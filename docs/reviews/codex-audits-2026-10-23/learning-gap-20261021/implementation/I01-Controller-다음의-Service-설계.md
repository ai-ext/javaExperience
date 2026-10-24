# I01 Controller 다음의 Service 설계: 요청을 업무 결정 순서로 바꾸기

우선순위: **P0** / 판정: **내용 있음 · 설계 전이 연습 부족**

검토일: 2026-10-21 KST. 읽기 전용 정적 감사이며 이 담당자는 원본 수정·빌드·테스트·DB 실행을 하지 않았다. 현재 작업 중인 worktree의 파일을 읽었으므로 아래 SHA256 manifest 시점의 판단이다. 기존 문서의 실행 성공 기록은 과거 기록이며 이번 실행으로 표시하지 않는다. 학습자 미구현은 의도된 실습 상태다. 아래 기존 학습자 상태는 main 및 기존 두 worktree의 확보 시점 기준이다. 감사 중 별도로 발견한 common-learning-foundation의 새 학습자 소스는 해당 항목의 추가 확인 단락으로 구분한다.

## 학습 계약

요청 DTO의 각 값을 그대로 저장할지, DB에서 조회해 확인할지, 인증값·기본값으로 대체할지 결정하고 조회 → 거절 → 상태 변경 → 응답 순서를 직접 설계한다.

## 실제 학습자 코드·정답·문서·UI의 상태

학습자 postSave는 이미 DTO→PostEntity→save의 단순 저장을 구현했다. 빈 Service만 있는 상태가 아니다. 1-3은 서비스 책임·생성자 주입·태그 중복 제거·트랜잭션 및 일부러 망가뜨리기를 설명하고 정답 create 전체 코드를 제공한다. 새 functional create는 다섯 구현 행동과 Service 메서드 빈칸을 제공한다.

## 빠진 설명·직접 연습·합격 판정

1-3의 완성 코드를 따라 쓰는 것과 여러 저장소를 선택해 규칙을 발명하는 것은 다른 역량이다. functional의 Repository, accessPolicy, helper, Entity 메서드는 모두 제공되므로 메서드 본문 완성만으로 그 의존성을 스스로 설계했다고 볼 수 없다. 현재 학습자 boardSlug 문자열 저장에서 게시판 존재 확인·회원 참조·태그 해석으로 넘어가는 분해표와 점진적으로 helper를 걷어내는 과제가 부족하다.

## 보완할 과제: 입력·전후 상태·SQL·실패

입력: dev, 제목 A, tags=[spring,spring,새태그], 인증회원2. 먼저 코드 없이 필드별 출처표와 6칸 의사코드(입력, 조회, 정책, 생성, 저장, 반환)를 작성한다. 다음에는 게시판 없음·관리자 전용 게시판의 두 분기를 직접 넣는다. 세 번째에는 태그 helper를 비우고 구현한다. 전: 새 post 없음, spring만 존재. 후: post1, 새 tag1, post_tag2. SQL은 board SELECT·tag SELECT/조건부 INSERT·post INSERT·연결 INSERT로 분류한다.

## 관찰 가능한 합격 기준

정답을 닫은 채 같은 설계 방식을 댓글 작성에 옮긴다. 각 Repository를 왜 호출하는지 설명하고, 거절 시 쓰기 0건을 DB로 확인한다. 성공 HTTP만으로 합격시키지 않는다. 설계 표·실제 코드·실패 상태 비교가 모두 필요하다.

## 한계와 정확성 확인

학습자의 미완성 코드는 실패 판정이나 대신 구현할 대상이 아니다. 본 감사는 실습자료의 연결 강도를 평가한다.

## 추가 common worktree 확인

추가 common worktree에서는 Service가 이미 tagsEntities를 만들어 saveAll한 뒤 Post를 저장한다. 따라서 단순 save 단계보다 더 진행되었다. 새로 필요한 전이는 여러 저장 호출 자체가 아니라 기존 태그 조회/재사용·게시판/회원 확인·거절 조건·실패 원복의 설계다.

## 근거: 절대경로와 라인

- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/src/main/java/org/example/service/PostService.java:17](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/src/main/java/org/example/service/PostService.java:17) (L17–L26) — 실제 학습자 저장 구현
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/src/main/java/org/example/controller/PostController.java:30](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/src/main/java/org/example/controller/PostController.java:30) (L30–L56) — 실제 학습자 Controller
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/ch1-create-post/1-3-service-layer.md:3](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/ch1-create-post/1-3-service-layer.md:3) (L3–L39) — 직접 읽은 원문/코드
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/blobs/716a2d3a39c1e7e2197ba89d3d0806d385e7f281.txt:33](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/blobs/716a2d3a39c1e7e2197ba89d3d0806d385e7f281.txt:33) (L33–L58) — 1-3 정답의 src/main/java/org/example/post/PostService.java
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:37](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:37) (L37–L63) — 직접 읽은 원문/코드
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:17](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:17) (L17–L24) — functional 과제에서 이미 제공하는 부분
- [/Users/ds/code/javaExperience/.worktrees/common-learning-foundation/src/main/java/org/example/service/PostService.java:24](/Users/ds/code/javaExperience/.worktrees/common-learning-foundation/src/main/java/org/example/service/PostService.java:24) (L24–L43) — 감사 중 확인한 common worktree 최신 학습자 Service
- [/Users/ds/code/javaExperience/.worktrees/common-learning-foundation/src/main/java/org/example/domain/entity/PostEntity.java:24](/Users/ds/code/javaExperience/.worktrees/common-learning-foundation/src/main/java/org/example/domain/entity/PostEntity.java:24) (L24–L40) — common의 OneToMany 태그와 primitive heart

## 구분해서 읽기

학습자 src는 본인이 구현 중인 프로젝트다. snapshot manifest와 blobs는 단계별 완성 참조 코드다. functional 화면은 제공된 공통 부분과 Service 구현 빈칸을 조합한 별도 과제다. 개념 worktree의 supplemental은 별도 모델/환경의 실험 기록이므로 게시판 API가 구현됐다는 증거가 아니다. HTML은 정적 내용과 참조 연결만 확인했으며 이 담당자는 브라우저에서 실행하지 않았다.
