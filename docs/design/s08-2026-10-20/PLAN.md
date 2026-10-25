# S08 트랜잭션 개념 보강 계획

원문 전체와 Java3블록을 읽었다. 기존tx-life-focused 예상 흐름은 보존한다. 추가 JDBC 구현·Spring standalone context·H2 실험은 원문 클래스와 명시적으로 구분하고, 학습자 서버를 고치지 않는다.

1. 원문 TransferService/ImportService/OrderNotificationListener 추출·SHA 대조 → 별도 JDBC repository와 Spring proxy 환경에서 실행한다.
2. default checked/runtime·rollbackFor·직접호출/프록시·TransactionTemplate·AFTER_COMMIT을 격리한 fixture → DB 행/계좌 값·transaction active·독립 observer·예외/이벤트 순서를 대조한다.
3. REQUIRED rollback-only / REQUIRES_NEW 독립커밋 / NESTED savepoint와 나머지전파 계약을 추가 예제로 분리 → Spring JDBC/H2 조건만 주장한다. 전체 DB 격리수준·JPA·reactive·broker/CDC·장애복구를 실행한 것으로 쓰지 않는다.
4. 직접 Luna/OpenAI 공식 조사 후 메인 출처 대조 → source/runtime 값을 기반으로 실제imagegen 개념 시안과 단계화면을 만든다.
5. 원문/앵커/기존UI 보존·실제Chrome양쪽전체상태·필수build/audit·독립검토 후 implemented까지만 기록하고 로컬checkpoint한다.
