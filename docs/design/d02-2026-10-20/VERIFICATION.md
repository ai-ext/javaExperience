# D02 서버·네트워크 부분 보강

2026-10-20, /Users/ds/code/javaExperience/.worktrees/concept-learning-night 의 개념 전용 작업이다.10질문27상태·선정PNG10장/실제imagegen13개·draft3개를 구현했다. 원문 전체 장면·전수 픽셀·학습자 이해도나134문서 전체를 완료 처리하지 않는다. merge·push·PR은 하지 않았다.

## 원문과 실제 실행

원문304줄9fence(Mermaid3/text1/Kotlin1/properties1/Java1/bash2)를 전문 검토·SHA 보존했다. 기존 연구 Markdown도 byte동일했다. 완전한 ProbeApplication.java는 원문 그대로 컴파일·실행했다. 추가 Java21.0.6/Boot4.1.1/FW7.0.9/Tomcat11.0.24/Gradle9.8.0 환경의 실제 TCP이며 MockMvc가 아니다.39개 runtime artifact SHA를 기록했다. 새127.0.0.1/port0 인수로 할당한 자체 포트에서 /probe200/bodyok·/not-mapped404를 확인했다. 원문 Java25/8080/Kotlin전체 설정·외부 점검 명령을 실행한 것은 아니다.

추가 Python URL 분해와 실제 별도 TLS 요청을 구분했다. 예시 api.example.com:8443은 parser입력뿐이고 연결하지 않았다. d02.test loopback proxy가 관찰한 request-target은 /api/probe?expand=items이며 fragment history는 제외됐다. 브라우저 패킷 캡처가 아니다.

추가 own bound socket은 listen전 이 Mac에서 connect timeout, listen뒤 TCP/accept 성공을 관찰했다. TCP만 연결한 사례는 HTTP검사가 아니다. 별도 연결은 앱이 의도적으로0bytes를 보내 설정readdeadline0.2초에 도달했다. 원인/지연/방화벽 실측으로 일반화하지 않는다. 최초 ECONNREFUSED 가정은 최소재현의 TimeoutError에 근거해 관찰기를 고쳤으며 원문은 바꾸지 않았다.

추가 loopback UDP DNS toy는 A203.0.113.10/AAAA2001:db8::10/CNAMEorigin.d02.test·TTL60/answer1, NXDOMAINrcode3/answer0·SERVFAILrcode2/answer0이었다. documentation IP에 HTTP를 보내지 않았다. 운영 resolver·OS DNS·root/TLD·DNSSEC·위임을 검증하지 않았다. TTL cache의 t0miss/t30hit/t60expired·누적queries2는 고정clock 추가모델이다.

새0700 run의 demoCA/leaf·0600개인키2개를 사용하고 인증서·hostname·strictX509 검증을 유지했다. CA의keyUsage누락으로 한차례거부된 뒤 CA/leaf의필수확장을보완했고 검증을끄지않았다. 해당clientcontext만demoCA를신뢰하며 시스템truststore는변경하지않았다. chain/name/SNI d02.test 정상과 wrongname·신뢰CA부재거부/HTTP handler추가0을 재현했다. 추가PythonTLSproxy는 내부HTTP로원문Boot에전달하며 /api/probe?expand=items→/probe?expand=items는200/ok, 변환생략/api/probe는404였다. Nginx/LB/Forwarded정책 실행이 아니다.

실제17CHECK와 별도3모델을 구분한다. bind/wildcard/외부도달 및 TCP·QUIC/신뢰경계는 모델·원문 개념이며 wildcardbind·firewall/NAT·외부경로·QUIC/packet handshake·신뢰proxy정책은미실행이다. main최종freeze 뒤 새run의일반replay와 독립temp사본재현이17검사/3모델전체JSON에서frozen과일치했다. 자체BootPID종료/포트닫힘·proxy/DNSthread종료를확인했다. 전역서비스·DNS/hosts/firewall/trust설정수정코드는없으며 전체시스템설정의전후snapshot을비교한것은아니다.

main마지막Python3.14.3/linked·CLI OpenSSL3.6.3과독립Python3.13.1/linked·CLI3.6.2를구분했다. 둘다TLS1.3/검증유지/동일canonical결과다. 먼저다른shell에서조회한CLI3.6.2를main최종버전으로쓰지않는다. 임시PID/port·CA bytes·시각·절대경로는raw자료이고frozen숫자로고정하지않았다. 상세는source-proof/README.md·runtime-last.json·independent-replay.json이다.

## 시안과 실제 화면

실제image_gen13개중10장을선정했다. DNS응답코드를querytype으로그린초안·Java publicmodifier와Tomcat8080혼동·서로다른fixture를sameapplication으로그린부분3개를actualedit로교정했다. 메인은13장전체, 독립담당자는선정10장을실제열람했다. 이미지는원문/actual/모델범위를표시하고개인키bytes를포함하지않는다.

Chrome1672×941/360×800에서27개씩총54관찰/20캡처를저장했다. 값·정확code/title/CHECK/runJSON·PNG로드/자연크기·기본로그접힘·핵심접기밖·본문넘침을대조했다. 모바일url영문제목의client336/scroll357잘림을실제재현한뒤'URL의여섯구성요소'로줄였다. 관련2상태×2의4관찰과2캡처를다시취득해client/scroll336일치를확인했다. 나머지상태값·코드·이미지는변경하지않았다.

특수10건은clipboard완료뒤223자정확일치/모바일ArrowRightpan20px/logzoomresize/keyboardfocus와activate/sourceanchor/reload/catalog·actualBack/Forward다. 이복사표본의빈줄0개를명시하며blankline보존은별도unit계약이다. 기존화면2건은원문Mermaid제외13210자/code6/id23/map1와liveMermaid3SVG·parse오류없음을확인했다. 생성HTML은Mermaid원문까지포함14172자와도표3개를보존한다.

메인은대표캡처5개와URL교정후모바일을다시열람했다. 독립담당자는교체URL2장포함최종20캡처전부열람·54행을현행data/cases와대조하고unit/generated를독립exit0으로확인했다. 특수10/legacy2저장기록도대조했다. 미해결Critical/Important/Minor0이다. 원시warn/error151개는모두chrome-extension URL이며사이트필터0이다. 전체Chrome이력의콘솔0을주장하지않는다. 모바일내부pan·외부번역overlay/전수pixel·learner미검증을유지한다.

## 최종 검사와 보존

최종build exit0/HTML339·링크0,관련19suite·필수3audit모두exit0이다. 원문135/학습자서버17/원본worktree3403파일SHA·원래HEAD/NULstatus·의존성39SHA/추가fixture3SHA가일치하고루트main은clean이다. parity기존619개바이트prefix를보존해10append(629/verified0), inventory44772개중543implemented/기존verified6이다. 이번27개는미검토→시안준비→구현만올렸다.

공식조사는CodexCLI gpt-6-luna/OpenAI직접/noLiteLLM이다. 메인13개공식·1차본문을별도대조했고RFC1035와AAAA의RFC3596·최신DNS용어9499·BootversionedURL의currentredirect·Python문서현재3.14.8과actual3.14.3을구분했다. URL·DNS·TLS·proxy문헌과추가실험을일반서비스검증으로확장하지않는다. 근거는research/,source-proof/,browser-*.json,image-*.json,checks/,REVIEW.md다.

원시compile.log2행의끝공백1개만정확한SHA/줄번호로한정해보존했다. 그밖staged diff-check는exit0이며근거는checks/whitespace-exceptions.json·diff-check.json이다.
