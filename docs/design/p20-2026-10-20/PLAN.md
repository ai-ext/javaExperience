# P20 보강 계획

개념학습만 변경한다. 원문386줄/Java8블록을 모두 읽었고 원문6Java파일의OrderResponse.getStatus().name()접근오류를JDK21로재현했다. 기존P20매핑화면/원문/앵커/학습자서버를보존한다. Docker무응답상태를변경하지않고격리H2추가실험으로범위를명시한다.

1. 원문컴파일실패와추가DTO한식교정을분리 → 원문SHA/추출6파일/diagnostics/교정diff확인.
2. 추가Bootnon-web/JDK21/H2에서객체양방향관계·IDENTITYpersist시점·별도DB관찰·commit/rollback·managedorphan삭제·DDL/auditing/DTO를실행 → 실제JSON/SQL/별도JDBC/조건별PASS를보관.
3. 공식JPA3.2/SpringData근거를직접Luna조사/메인대조 → enum예외/orphan상태/ownership/flushcommit구분. 측정없는SQL횟수·MySQL동등성주장금지.
4. 실제image_gen으로좁은의미장면을생성·교정 → source/프롬프트/SHA/실제PNG크기/한계기록. narrowUI는서브에이전트구현후메인검수.
5. 생성HTML원문보존·실제bundle/관련기존P20회귀·Chrome양쪽전상태·복사/키보드/원문흐름 → 필수build/visual/version/parity. 근거있는개별항목만implemented, verified아님.
6. 별도로컬feature커밋 → 원본worktree/main변경/merge/push/PR없음. 남은장면/실행한계를queue와VERIFICATION에기록한다.
