# I07 Soft delete와 관계 데이터 수명

우선순위: **P1** / 판정: **계약·전후 화면 있음 · 관계별 삭제 설계 전이 부족**

검토일: 2026-10-21 KST. 읽기 전용 정적 감사이며 이 담당자는 원본 수정·빌드·테스트·DB 실행을 하지 않았다. 현재 작업 중인 worktree의 파일을 읽었으므로 아래 SHA256 manifest 시점의 판단이다. 기존 문서의 실행 성공 기록은 과거 기록이며 이번 실행으로 표시하지 않는다. 학습자 미구현은 의도된 실습 상태다. 아래 기존 학습자 상태는 main 및 기존 두 worktree의 확보 시점 기준이다. 감사 중 별도로 발견한 common-learning-foundation의 새 학습자 소스는 해당 항목의 추가 확인 단락으로 구분한다.

## 학습 계약

글 삭제를 행 제거와 분리하고, 조회 정책 및 관계 행 수명에 미치는 영향을 설명한다. 수정·삭제 권한이 같은지 따로 판단한다.

## 실제 학습자 코드·정답·문서·UI의 상태

3-2와 functional 삭제는 deleted_at/updated_at만 갱신, post_tag·tag·좋아요·댓글 보존, canView 후 작성자 또는 ADMIN, 재삭제404를 명시한다. 삭제 API가 없다는 판단은 틀리다.

## 빠진 설명·직접 연습·합격 판정

학습자는 deleteById 호출이 아니라 상태 전이를 선택해야 하는 이유를 관계별로 직접 정해야 한다. 삭제된 글이 내좋아요에서는 제외되고 북마크에서는 unavailable로 남는 다른 정책을 한 lifecycle 표로 연결하는 연습이 부족하다. cascade/orphanRemoval 용어만 보고 적용하면 보존 계약을 깨뜨린다.

## 보완할 과제: 입력·전후 상태·SQL·실패

입력: 댓글1·좋아요1·태그2가 달린 자기 글 id. 전후 post 행수1, 관계 행수 불변, deleted_at null→시간. SQL UPDATE post만 의도되며 관계 DELETE는 없어야 한다. 그 뒤 GET/PATCH/DELETE 재요청과 목록·내좋아요·북마크를 각각 확인한다. 관리자가 FOLLOWERS를 무조건 볼 수 있다고 가정하지 않는다.

## 관찰 가능한 합격 기준

204 본문 없음, 다음 GET404, 목록 제외, 관계 보존, 다른 사람403/숨긴글404. 삭제된 글 복구가 나중 단계라면 기존 관계가 어떻게 재노출되는지도 후속 과제로 분리한다.

## 한계와 정확성 확인

API DELETE의 멱등성과 반복 응답코드가 같다는 것은 별개다. 본편 재삭제404 계약을 오류라고 판정하지 않는다.

## 근거: 절대경로와 라인

- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/snapshots/blobs/ca164f353bb47e76f139a5d1054df57b8642fd57.txt:176](../../../../../scenario/snapshots/blobs/ca164f353bb47e76f139a5d1054df57b8642fd57.txt) (L176–L192) — 3-2 정답의 src/main/java/org/example/post/PostService.java
- $WORKTREE_ROOT/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:137 (기록 경로: `$WORKTREE_ROOT/scenario-crud-redesign/tools/site/functional-scenario-data.mjs:137`) (L137–L153) — 직접 읽은 원문/코드
- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/ch3-update-delete/3-2-soft-delete.md:410](../../../../../scenario/ch3-update-delete/3-2-soft-delete.md) (L410–L419) — 직접 읽은 원문/코드
- [$WORKTREE_ROOT/scenario-crud-redesign/practice/MISSIONS.md:111](../../../../../practice/MISSIONS.md) (L111–L117) — 직접 읽은 원문/코드

## 구분해서 읽기

학습자 src는 본인이 구현 중인 프로젝트다. snapshot manifest와 blobs는 단계별 완성 참조 코드다. functional 화면은 제공된 공통 부분과 Service 구현 빈칸을 조합한 별도 과제다. 개념 worktree의 supplemental은 별도 모델/환경의 실험 기록이므로 게시판 API가 구현됐다는 증거가 아니다. HTML은 정적 내용과 참조 연결만 확인했으며 이 담당자는 브라우저에서 실행하지 않았다.
