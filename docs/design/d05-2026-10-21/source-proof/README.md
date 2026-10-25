# D05 원문 보존·추가 디버깅 실험

원문343줄9fence와 완전 Java/properties를 byte 그대로 보존한다. 원문 Java25/8080/IntelliJ/운영·DB 구성 전체의 실행 결과가 아니다. fixture9개는 원문2개 사본과 별도 도구·JUnit/Java21 Gradle 설정이다.

Java21.0.6·Gradle9.8.0·Boot4.1.1/FW7.0.9/Tomcat11.0.24/Logback1.5.38/JUnit6.0.3으로 실제 testRuntimeClasspath47artifact SHA를 기록했다. 새0700실험폴더/private loopbackport0의 자체 JVM만 제어하며 기존 사용자JVM·DB·IDE·Kubernetes·heap에 접근하지 않는다.

23고유CHECK/3명시모델을 freeze와 main fresh에서 전체 동일하게 재현했다. 원문7정상/13가상실패의HTTP각2회,malformed400/route404·errorJSON/rawstack경계,sourceCause/첫앱프레임/공통2frame생략,별도 Resource suppressed/Logback수준/JUnit2pass→private조건변이2fail→원문복구2pass를 관찰한다.

추가 DebugTarget은 원문controller와 다른 프로그램이다. 실제 JDK21 jdb로 breakpoint/id13/counter0→eval bump1→후속result27(평가없는별도실행26),step/stepup/next를 확인했다. 자체 JDWP127.0.0.1:0이며 실제 동적 포트는 runtime raw에 보존, 학습 설명 P_DEBUG는 별칭이다. Oracle jdb man page에 eval 설명이 없다는 문헌 한계와 설치된 jdb interactive help/실제성공을 구분한다. IntelliJ UI를 조작한 것이 아니다.

최초 관찰은 stepup의 caller line11→next line12에서 result가 아직 대입되지 않아 실패했다. 결과값을 바꾼 것이 아니라 두 번째 next로 line13에 멈춘 뒤 값을 읽도록 고쳤다. 실패 raw jdb/실행로그와 attempt-notes를 보존하며 frozen은 첫 전수 성공 뒤에만 생성했다.

자체 ThreadTarget의 두 Thread.print에서 monitor BLOCKED/latch WAITING을 구분하고 latch해제·join·exit0을 확인했다. production deadlock/CPU/heap/성능 결론은 아니다. 별도 tempGit7커밋/C1goodC7bad에서 같은 실제 javac+Java 회귀판정으로C4bad/C3good을 실행해firstbadC4를찾고bisectresetC7/remotes0을확인했다. product worktree를bisect하지않았다.

실행: run-proof.py --runtime-root <외부 전용 실행폴더>. --freeze는 최초 기대값이 없을 때만 허용하며 기존 기대값은 덮어쓰지 않는다. 기본 실행은 전체 JSON과 고정된 facts/models를 비교한다. raw 시각·PID·실제포트·커밋hash·dump주소는각실행폴더에남기고 canonical은명시별칭·해석한관측값만사용한다. 독립재현은 independent-replay.json에서별도로확인한다.
