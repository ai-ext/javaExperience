# I06 PATCH와 PUT: 변경 의도와 관리 객체 변경

우선순위: **P1** / 판정: **계약·rollback 분기 있음 · 검증 책임 표현 정정 필요**

검토일: 2026-10-21 KST. 읽기 전용 정적 감사이며 이 담당자는 원본 수정·빌드·테스트·DB 실행을 하지 않았다. 현재 작업 중인 worktree의 파일을 읽었으므로 아래 SHA256 manifest 시점의 판단이다. 기존 문서의 실행 성공 기록은 과거 기록이며 이번 실행으로 표시하지 않는다. 학습자 미구현은 의도된 실습 상태다. 아래 기존 학습자 상태는 main 및 기존 두 worktree의 확보 시점 기준이다. 감사 중 별도로 발견한 common-learning-foundation의 새 학습자 소스는 해당 항목의 추가 확인 단락으로 구분한다.

## 학습 계약

생략/null/빈목록/값을 구분하고 기존 엔티티를 조회해 허용된 필드만 바꾼다. dirty checking, 응답값, rollback을 하나의 작업으로 설명한다.

## 실제 학습자 코드·정답·문서·UI의 상태

3-0 PUT과 3-1 PATCH가 따로 있다. functional PATCH는 null=유지, tags=[]=연결 해제, 빈요청도 updated_at 갱신, canView→작성자, 후행 validation 실패 rollback을 명확히 제시한다. 정답은 실제 post 변경 후 나중 필드 검증에서 예외가 날 수 있다.

## 빠진 설명·직접 연습·합격 판정

제공된 validate helper를 호출하는 데서 끝나면 빈값 계약을 직접 결정하는 연습이 부족하다. 정답 주석 “PATCH는 Bean Validation으로 표현할 수 없다”는 너무 강하다. 해당 @NotBlank를 그대로 재사용하기 곤란한 것이지 null 허용 제약·그룹·커스텀 제약 등 설계 전체가 불가능한 것은 아니다. PUT과 PATCH의 null 정책은 이 프로젝트 계약이며 보편적 HTTP 규칙으로 외우면 안 된다.

## 보완할 과제: 입력·전후 상태·SQL·실패

동일 글에 {title:A}, {tags:null}, {tags:[]}, {title:B,visibility:BAD}, {}를 순서대로 보낸다. 전후 title·updated_at·post_tag·tag를 표로 남긴다. 실패 요청은 메모리 title이 바뀌어도 DB title은 전값이어야 한다. SQL의 UPDATE·연결 DELETE가 어느 분기에서 필요한지 예측한다.

## 관찰 가능한 합격 기준

생략/null 유지, [] 연결만 해제, 공유 tag 행 보존, 403/404 순서, 실패 후 DB 전체불변을 검증한다. PUT 생략tags=빈목록과 PATCH 생략tags=유지를 같은 fixture로 대비한다.

## 한계와 정확성 확인

현재 빈 PATCH의 updated_at 갱신은 의도된 계약으로 확인되므로 감사자가 임의로 no-op이 옳다고 판정하지 않는다.

## 근거: 절대경로와 라인

- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/blobs/ca164f353bb47e76f139a5d1054df57b8642fd57.txt:28](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/blobs/ca164f353bb47e76f139a5d1054df57b8642fd57.txt:28) (L28–L32) — 3-2 정답의 src/main/java/org/example/post/PostService.java
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/blobs/ca164f353bb47e76f139a5d1054df57b8642fd57.txt:131](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/snapshots/blobs/ca164f353bb47e76f139a5d1054df57b8642fd57.txt:131) (L131–L173) — 3-2 정답의 src/main/java/org/example/post/PostService.java
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:118](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:118) (L118–L135) — 직접 읽은 원문/코드
- [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/ch3-update-delete/3-0-put-replace.md:34](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/ch3-update-delete/3-0-put-replace.md:34) (L34–L42) — 직접 읽은 원문/코드

## 구분해서 읽기

학습자 src는 본인이 구현 중인 프로젝트다. snapshot manifest와 blobs는 단계별 완성 참조 코드다. functional 화면은 제공된 공통 부분과 Service 구현 빈칸을 조합한 별도 과제다. 개념 worktree의 supplemental은 별도 모델/환경의 실험 기록이므로 게시판 API가 구현됐다는 증거가 아니다. HTML은 정적 내용과 참조 연결만 확인했으며 이 담당자는 브라우저에서 실행하지 않았다.

## 병행 변경 최종 재확인

감사 중 PATCH 화면의 설명이 갱신됐다. “제목 변경 요청”은 “수정 요청 전”으로, 객체·commit 설명은 선택한 요청의 필드/태그를 비교하도록, rollback 설명은 선택한 요청에 후행 검증 실패 값을 더하는 별도 분기로 명확해졌다. 생성 HTML에도 이 문구와 “기본 제목 요청 예시” 라벨이 반영되어 있다. 따라서 선택한 요청과 고정 예시를 혼동하는 설명상의 위험은 일부 줄었다. 기존 null/[]/권한/rollback 계약과 상태 ID·값 모델은 같으며, 이 항목의 핵심인 직접 계약 설계 연습과 과도한 Bean Validation 불가 표현에 대한 판정은 유지한다.

현재 원문: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:118-135. 현재 생성 화면: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/scenario/flow/update-post.html. 초기 SHA와 현재 SHA는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/implementation/CONCURRENT-CHANGE-RECHECK.json에 함께 보존했다. 본 담당자는 재빌드나 브라우저 동작 시험을 수행하지 않았다.
