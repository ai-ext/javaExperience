# W11 서비스 트랜잭션 개념 계획

원문전문과Java5블록을읽었다. B/C가같은OrderUseCase이름을선택지별로정의하므로동시에합쳐컴파일하지않고독립sourceSet/JVM으로분리한다. 원문코드수정없이공통저장소/Controller/CheckedOrderUseCase를각variant와함께컴파일한다.

1. 원문추출/SHA·각variant컴파일 → 추가H2스키마/seed와standaloneSpring7.0.9/JDK21환경을분리한다.
2. sourceB부분commit/sourceAController proxy/sourceCservice원자성/sourceD외부risk조회전구간을실행 → 실제SQL/바인딩/연결/동일writer·별도observer·commitrollback을시점별기록한다. Controller는실제Spring빈의Java호출이며HTTP/MVC응답으로표시하지않는다.
3. sourceClistener는비어있는no-op다. 추가observer가super원문handler호출을기록하는경우실제알림전송과구분한다. 외부RiskClient도제어stub이며네트워크·가격조회·결제·broker/outbox/CDC/Java25를실행하지않는다.
4. 최근S08공식조사재사용+Luna직접추가자원동기화근거확인→실제imagegen/단계화면. 원문/기존집중화면/앵커/학습자서버를보존하고실제Chrome양쪽검증·필수감사·독립리뷰후로컬checkpoint한다.
