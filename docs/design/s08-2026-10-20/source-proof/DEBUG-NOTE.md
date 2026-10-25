# 추가 fixture의 AFTER_COMMIT 예외 가정 정정

원문 listener를 바꾸지 않았다. 첫 fixture는 gateway의 IllegalStateException이 extra.event 호출자에게 전파될 것으로 예상해 catch 뒤 assertion을 두었다. 실제 실행은 afterCompletion 오류를 로그로 기록한 뒤 정상 반환해 fixture의 AssertionError가 났다. 실패 stdout/stderr는 checkpoints/listener-exception-assumption-failure.txt에 있다.

systematic-debugging 절차로 전체 스택을 읽고 Spring v7.0.9의 TransactionalApplicationListenerSynchronization.PlatformSynchronization.afterCompletion과 TransactionSynchronizationUtils.invokeAfterCompletion을 대조했다. 전자는 AFTER_COMMIT enum phase를 afterCompletion에서 실행하고 후자는 Throwable을 catch/log한다. TransactionPhase.AFTER_COMMIT Javadoc도 direct TransactionSynchronization.afterCommit과 다른 경로임을 명시한다.

가설은 예외 타입이 아니라 callback 경로를 잘못 가정했다는 것이다. 기존 fixture의 예상만 정상 반환으로 한정 교정하고 DB ledger order행 보존, 로그의 실제 gateway-failure/afterCompletion 예외를 검사했다. 최종42PASS/frozen JSON 및 verify-source 재실행이 통과했다. 커밋 이전 실패·direct afterCommit·reactive 경로로 일반화하지 않는다. gatewayInvocations는 메모리 메서드 호출 기록이며 broker 전달 성공을 뜻하지 않는다. callback의 active=true 플래그도 이미 완료된 물리 commit을 취소하지 않는다.

공식 URL 및 Luna 조회 실패와 메인의 성공한 최신 공식 원문 대조는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s08-2026-10-20/research/main-verification.json 에 있다. Luna의 이벤트 URL 접근은 실패했고 모델/제공자 전환은 하지 않았다. 메인은 출처 검증 범위에서 같은 공식7.0.9페이지를 열었다.
