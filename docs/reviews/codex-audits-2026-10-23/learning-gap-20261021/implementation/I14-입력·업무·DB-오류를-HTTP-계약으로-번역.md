# I14 입력·업무·DB 오류를 HTTP 계약으로 번역

우선순위: **P0** / 판정: **검증 자료 있음 · 실제 학습자 오류 처리에서 전이 필요**

검토일: 2026-10-21 KST. 읽기 전용 정적 감사이며 이 담당자는 원본 수정·빌드·테스트·DB 실행을 하지 않았다. 현재 작업 중인 worktree의 파일을 읽었으므로 아래 SHA256 manifest 시점의 판단이다. 기존 문서의 실행 성공 기록은 과거 기록이며 이번 실행으로 표시하지 않는다. 학습자 미구현은 의도된 실습 상태다. 아래 기존 학습자 상태는 main 및 기존 두 worktree의 확보 시점 기준이다. 감사 중 별도로 발견한 common-learning-foundation의 새 학습자 소스는 해당 항목의 추가 확인 단락으로 구분한다.

## 학습 계약

JSON 타입/필드 검증은 요청 경계, DB존재·권한·현재상태는 Service, 최종고유성/FK는 DB에서 확인한다. 실패는 일관된 HTTP 상태와 ProblemDetail로 변환하며 DB부분저장은 남기지 않는다.

## 실제 학습자 코드·정답·문서·UI의 상태

학습자 Controller는 title.length 직접검사와 body status401을 반환한다. 1-5와 이후 시나리오는 필수/null/빈값/상하한/형식표, @Valid, 예외처리, 400/401/403/404/409를 갖춘다. 정답 PostCreateRequest tags 원소는 @NotNull+@Size이고 functional도 공백태그가 PATCH와 다르다는 한계를 표시한다. 이번 메인 담당자 실행에서 짧은 제목은 HTTP200/본문status401, 정상 JSON은 hi 헤더 없이도 저장성공이었다. 이중 annotation이 반드시 헤더 누락400을 낸다는 가설은 실제 결과로 폐기됐다.

## 빠진 설명·직접 연습·합격 판정

“어디에 검사하나”를 스스로 분류하는 오류표가 필요하다. HTTP200의 body401과 실제HTTP401은 다르며 title null은 길이검사 이전에 실패할 수 있다. 모든 DataIntegrityViolationException을 특정중복409로 바꾸면 다른 제약 위반 원인을 오분류할 수 있어 constraint별 근거를 확인해야 한다. 정답 오류코드를 외우는 것으로 끝내면 검증누락을 찾지 못한다.

## 보완할 과제: 입력·전후 상태·SQL·실패

입력표: title 누락/null/공백/200/201자, tags null/[]/[null]/[공백]/6개, 없는board, 중복folder, 깨진JSON, ID소수. 요청형태·서비스정책·DB제약·응답상태·errors필드를 한 줄씩 작성한다. 실패 전후 post/tag/count SQL을 비교한다. 동일값이 POST와 PATCH에서 다르게 처리되는 이유를 정책으로 설명한다.

## 관찰 가능한 합격 기준

필드문제400과 인증401을 구분, HTTP status와 본문 코드 일치, 정상경계 허용, 실패부분저장없음, DB예외는 실제 제약에 맞게 번역. null에 의한500을 단순 제목오류로 숨기지 않는다.

## 한계와 정확성 확인

기존 코드의 미완성 오류를 감사자가 임의 수정하지 않는다. 특정 프레임워크가 소수를 Long으로 변환하는 여부는 현재 설정·실측 기준으로 확인한다.

## 추가 common worktree 확인

common에는 @RestControllerAdvice가 추가되어 IllegalArgumentException을 HTTP404로 번역한다. 예외 처리 자체가 없다는 평가 대신 어떤 업무예외를404로 보내야 하는지와 모든IllegalArgumentException 일괄404의 범위를 검토한다. 주석 속 badRequest 예시는 활성코드가 아니다. common의 짧은 제목도 이번 실행에서 HTTP200/body401이었다. 활성 Advice가 생겨도 직접 DTO를 반환하는 검증 실패 경로는 자동으로400이 되지 않는다.

## 근거: 절대경로와 라인

- [$WORKTREE_ROOT/scenario-crud-redesign/src/main/java/org/example/controller/PostController.java:30](../../../../../src/main/java/org/example/controller/PostController.java) (L30–L56) — 실제 학습자 Controller
- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/snapshots/blobs/d04b43c0bb41d71e836ddfee16a2781cabb5776f.txt:10](../../../../../scenario/snapshots/blobs/d04b43c0bb41d71e836ddfee16a2781cabb5776f.txt) (L10–L26) — 1-5 정답의 src/main/java/org/example/post/PostCreateRequest.java
- $WORKTREE_ROOT/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:67 (기록 경로: `$WORKTREE_ROOT/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:67`) (L67–L71) — 직접 읽은 원문/코드
- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/snapshots/blobs/da82cd72deb891ae45a6ad41f1824903c3e345b4.txt:76](../../../../../scenario/snapshots/blobs/da82cd72deb891ae45a6ad41f1824903c3e345b4.txt) (L76–L83) — 6-2 정답의 src/main/java/org/example/bookmark/BookmarkFolderService.java
- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/ch5-comment/5-2-reply.md:546](../../../../../scenario/ch5-comment/5-2-reply.md) (L546–L548) — 직접 읽은 원문/코드
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md:24 (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md:24`) (L24–L46) — 메인 담당자 이번 감사 실행, 검토자는 결과를 읽음
- [$WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/service/PostService.java:24](../../../../../src/main/java/org/example/service/PostService.java) (L24–L43) — 감사 중 확인한 common worktree 최신 학습자 Service
- [$WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/domain/entity/PostEntity.java:24](../../../../../src/main/java/org/example/domain/entity/PostEntity.java) (L24–L40) — common의 OneToMany 태그와 primitive heart
- [$WORKTREE_ROOT/common-learning-foundation/src/main/java/org/example/global/GlobalExceptionHandler.java:15](../../../../../src/main/java/org/example/global/GlobalExceptionHandler.java) (L15–L23) — common의 활성 예외 처리
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java:20 (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java:20`) (L20–L52) — 메인 담당자 common 격리 실행의 관찰 테스트
- $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml:1 (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml:1`) (L1–L7) — 이번 common 관찰4개 실패0; 문제행동 재현도 성공조건

## 구분해서 읽기

학습자 src는 본인이 구현 중인 프로젝트다. snapshot manifest와 blobs는 단계별 완성 참조 코드다. functional 화면은 제공된 공통 부분과 Service 구현 빈칸을 조합한 별도 과제다. 개념 worktree의 supplemental은 별도 모델/환경의 실험 기록이므로 게시판 API가 구현됐다는 증거가 아니다. HTML은 정적 내용과 참조 연결만 확인했으며 이 담당자는 브라우저에서 실행하지 않았다.
