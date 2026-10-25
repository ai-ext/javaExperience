# V04 테스트 DB 전략 보강 계획

원문264줄과9fence를 전문 검토하고 원문SHA/블록을 고정했다. 옛 연구사본은 현재 원문과 다르다. 현재 Docker Unixsocket _ping은3초 한도의 읽기 전용 확인에서 접속거부였다. 컨테이너 원문 테스트는 실제로 실행했다고 표시하지 않는다. 기존 서버·DB·원문·학습자 코드는 수정하지 않는다.

1. 원문 완전한 RepositoryTest와 부분 패턴 구분 → Java1개 그대로 compile-only, SQL fixture2문장 보존, 미완성 Order/lazy/HTTP 예제는 가정 모델과 분리한다. 외부 study Product 관련6원문·ServiceUnitTest2케이스는 별도SHA사본으로 한정한다.
2. 실제 Boot4.1.1 테스트모듈·TC2.0.5 클래스·기본 replace=NON_TEST 확인 → 의존성 resolve/SHA·reflection·공식 근거 대조. 원문의 항상H2교체/NONE보편필수 일반화는 원문을 보존한 채 보충 설명에서 정정한다.
3. 새 private MySQL8.4.11/datadir/socket/자체PID/새loopbackport·guard·임시계정/TLS → 외부 study schema/seed사본만 적재한다. root는 setup뿐, Java는 목적별최소권한. 기존Docker/서비스/3306/학습자DB는 사용하지 않는다.
4. 추가 slice adapter에서 원문 assert body·@Sql 및 교체조건 대조 → static URL의 defaultNON_TEST/H2, DynamicPropertySource의defaultNON_TEST/MySQL, explicitNONE/MySQL, explicitANY/H2를 실제 엔진으로 확인한다. 이를 Testcontainers·ServiceConnection 실행으로 부르지 않는다. INFERRED/ISOLATED fixture와 rollback·cleanup을 실제행으로 확인한다.
5. DB 없는 실제 외부 ServiceUnitTest와 H2 MODE=MySQL/MySQL 차등 실험 → 같은e/é·대소문자/UNIQUE 입력의 실제값·collation/errorcode를 기록한다. 모드가 모든MySQLSQL에 실패한다거나엔진동등이라고 하지 않는다.
6. 추가 toy 모델의 TestContext 트랜잭션 → 열린 테스트TX가 lazy접근을 감추는 경우/닫힌서비스반환, assignedID flush지연/IDENTITY조기INSERT, rollback/명시TestTransaction commit과 fakeAFTER_COMMIT을 분리해 실제SQL/행/리스너를 확인한다. 모든provider/오류로일반화하지않는다.
7. 별도 추가 loopback HTTP toy app 가능성 검증 → 실제RANDOM_PORT와 같은threadMockMvc를 구분하고 테스트rollback 후 서버commit이남는지 확인한다. 원문OrderHttpTest/상품API를구현·실행했다고하지않는다. 자체서버만시작/종료하고포트·스레드·요청/DB행을대조한다. 실행하지못한부분은미실행으로남긴다.
8. freeze·새인스턴스재현·독립리뷰 → 실행한환경/원문/추가구성/미측정구분, raw로그·실제오류보존. measuredtiming없으면속도·재사용효율만들지않는다.
9. 실제image_gen·좁은UI5파일위임 → 원문/코드/앵커/map보존·모바일/데스크톱전상태·copy/history/keyboard·필수build+3감사·inventory/parity·로컬checkpoint. 전체pixel/learner증거없으면verified금지. merge/push/PR하지않는다.
