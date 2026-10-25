# P19 개념 학습 준비

1. 원문450줄/현재실행구성/공식출처를대조 → 버전별조건/예제와실제레포환경분리.
2. Docker/MySQL접근가능성확인 → 실제응답없으면MySQL실행결과를만들지않는다.
3. 별도JDK21/H2/Hikari/Hibernate/Spring구성으로가능한경계만실행 → MySQL/Java25/원문전체앱과구분.
4. 사실확인한의미장면별imagegen/질문/교정 → 좁은UI위임.
5. 원문보존/실제브라우저/필수감사/독립리뷰 → 로컬커밋. 통합/push없음.

Docker Desktop backend프로세스는실행중이지만server version은8초내응답하지않았다. context는desktop-linux다. 읽기조회만중단했고Docker재시작/다른container조작/learnerDB접속은하지않았다. Docker앱AX읽기도timeout이다. 원인확정아님. 실제MySQL은미검증으로두고가능한독립실험과문헌을계속한다.
