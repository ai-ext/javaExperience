# 최신 기능형 7개 대조

CRUD5개는3-2 manifest, 좋아요2개는4-1 manifest가 정본이다. 225개 단계별 원문과 버전을 섞지 않았다. 현재 감사 기반에 통합된 결과라고 표시하지 않는다.

- create: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-create.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-create.md)
- detail: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-detail.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-detail.md)
- list: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-list.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-list.md)
- update: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-update.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-update.md)
- delete: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-delete.md)
- like: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-like.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-like.md)
- unlike: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-unlike.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/latest/FL-unlike.md)

기존 실행 증거: /Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/docs/design/scenario-crud-2026-10-20/mysql-runtime-verification/report.json 및 mysql-contract-edges/report.json은2026-10-20 격리 API/DB검증을 기록한다. 전자는기본CRUD,후자는PATCH반례/rollback·페이지·비어있지않은삭제관계를포함한다. 이번에는기존기록과현행소스를대조했으며그날의측정을오늘재실행한것처럼표시하지않았다.

이번검사: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/checks.json

파일해시와구조화계약: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/latest-flow/contracts.json

최신 화면/소스 확인 HEAD: `9ce57dd9ba9c5961ebc7a65d30408e970990d57f`. 최초 조사 시점의 debd0fcf 뒤에 DB시각 정밀도 안내 커밋이 추가되어 최신7개는 추가 확인했다. 기존225개 원문 감사 기준 HEAD와 구분한다.
