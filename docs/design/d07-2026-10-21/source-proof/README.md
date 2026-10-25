# D07 원문 Java의 한정된 로컬 관측

원문300줄8블록 중 Java와 Dockerfile은 byte 그대로 보존했다. 원문 Java는 추가 Gradle·Java21.0.6·Boot4.1.1 환경에서 실행했고 원문Java25/컨테이너명령은실행하지않았다. fixture4개는원문Java/Dockerfile사본2개와추가Gradle설정2개다.

실행CHECK10개와미실행설명모델6개는execution.json에구분했다. 메인 freeze 뒤 fresh 실행과 independent-replay.json의무수정사본 재현은전체고정기준과일치했다. 초기freeze로그의마지막PASS문장은요약출력일뿐추가등록CHECK나모델PASS가아니며, 이후출력은FULL_EXECUTION_MATCH로수정했다. 고정execution은수정하지않았다.

39개해석dependency파일SHA·원문2class major65·JAR34nestedlibrary·19,902,934bytes와SHA를대조했다. 같은JAR사본으로한Mac의자체2JVM을loopback/port0로시작했다. local-a/b는관찰기별칭이며profile이나실제JVM시스템이름이아니다.

실제HTTP4건은A/health200ok, B/health200ok, A/actuator/health404, A종료뒤직접B/health200ok다. literalok는DB·노드·리전진단이나Actuator의UP를의미하지않는다. A와B는각각ownSIGTERM143으로종료했고두PID와포트가닫혔으며killfallback은없다.2개는추적한장기HTTPJVM수이며별도version/build명령들은각exit0이다.

Docker·VM·AZ·cloud·registry·계정·기존서비스·DB/practice데이터를조작하지않았다.2개의same-Mac프로세스를독립호스트/커널/AZ/자동failover/고가용성증거로표시하지않는다. 미실행6모델은NIST분류/서비스책임/가상화·패키징/트래픽·복원력/저장·비용/7R선택의공식근거를담는다. 실제cloud배치·가격·복구결과·학습자의이해를검증한기록은아니다.
