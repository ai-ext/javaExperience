# D02 원문 Java와 추가 loopback 실험

원문304줄·9fence(Mermaid3/text1/Kotlin1/properties1/Java1/bash2)를 전문 검토하고 SHA·원문 바이트를 보존했다. 이전 연구 Markdown도 현재 원문과 바이트가 같았다. block-07.java를 ProbeApplication.java로 그대로 복사해 컴파일·실행했다. 추가 Gradle/JDK21 환경·실행 인수만 다르며 원문 Java25/8080/Kotlin 전체 설정·외부 dig/openssl 명령을 그대로 실행한 결과가 아니다.

실제 Java21.0.6/Boot4.1.1/Spring7.0.9/Tomcat11.0.24와 runtime dependency39개의 SHA를 기록했다. Boot는 매번 새0700 run의 자체 프로세스이며 server.address=127.0.0.1/server.port=0 인수로 임시 포트를 할당했다. 포트는 시작 로그에서 읽고 해당 자체 주소에만 요청했다. /probe는200/body ok, /not-mapped는404다. 실제 TCP 요청이며 MockMvc가 아니다. sourceJava의 /probe 외 새 route를 추가하지 않았다. DB·학습자 서버·기존8080·외부 클라이언트·방화벽·NAT를 사용하지 않았다.

URL parser 예제 https://api.example.com:8443/orders/42?expand=items#history는 분해만 했다. 이 도메인으로 접속하지 않았다. 실제 별도 TLS 요청은 d02.test의 loopback proxy에 연결했고 /api/probe?expand=items가 관찰됐다. client의 fragment history를 serializer에서 제외했다. Python client와 proxy 관찰이며 브라우저 패킷 캡처가 아니다. DNS 예제의 documentation IP와 실제 loopback 연결 주소도 구분한다.

추가 자체 bound socket은 listen 전 이 Mac에서 connect timeout을 관찰했고 listen 뒤에는 TCP 연결·accept가 성공했다. 후자는 HTTP 응답 검사가 아니다. 별도 socket은 연결한 뒤 앱이 의도적으로 아무 byte도 보내지 않아 설정한 read deadline0.2초에 도달했다. 0.2초는 설정값이며 측정 지연·성능이 아니다. 첫 관찰기는 미수신 socket이 ECONNREFUSED일 것이라고 잘못 가정해 실패했다. 최소 재현에서 TimeoutError/errno없음을 확인하고 실제 실패 종류를 기록하도록 교정했다. timeout만으로 방화벽·패킷손실·일반 OS 동작을 확정하지 않는다.

별도 UDP DNS toy는 새 loopback port에서 고정 packet을 주고받았다. A=203.0.113.10, AAAA=2001:db8::10, CNAME=origin.d02.test, 정상 TTL60/answer1, NXDOMAIN RCODE3/answer0, SERVFAIL RCODE2/answer0이다. 원문 외부 DNS·OS resolver·root/TLD·위임·실제 authoritative 운영·DNSSEC·대규모 상호운용성을 실행하지 않았다. CNAME packet이 이름을 답한 것과 HTTP redirect는 별개이며 위 IP에 HTTP를 보내지 않았다. 고정 clock의 t0 miss/t30 hit/t60 expired·누적 query2는 추가 Python cache 모델이고 실제 기다림·OS/browser cache 관찰이 아니다.

TLS는 매회 새 demo CA/leaf와 RSA key를 자체 run 안에 만들었다. 개인키2개는0600이고 상위run0700이다. 모든 일반 로그가0600이라고 주장하지 않는다. CA는 이 client의 SSLContext에만 넣었고 OS/브라우저 truststore는 변경하지 않았다. 인증서·hostname 검증과 strict X509를 유지한다. 첫 CA에는 keyUsage가 없어 Python 기본 strict 검증이 거부했다. CA/leaf의 basicConstraints·keyUsage·식별자를 보완했고 검증 옵션을 끄지 않았다. 정상 chain/name/SNI d02.test는 성공하고 wrong.d02.test와 신뢰 CA가 없는 client는 TLS 검증에서 거부돼 HTTP handler 추가0이었다. 만료·폐기/CRL/전체 PKI·운영 인증서를 검증한 결과가 아니다.

추가 Python TLS termination proxy는 HTTP upstream으로 원문 Boot에 전달했다. /api/probe?expand=items를 /probe?expand=items로 바꾸면200/ok였고, 추가 X-D02-Rewrite=off 입력으로 변환을 끄면 /api/probe 그대로 전달돼404였다. 이 제어 header는 실험 분기용이며 Forwarded 신뢰 정책과 별개다. Nginx proxy_pass 제품·일반 URI 정규화 동등성·LB·운영 TLS 구간을 실측한 결과가 아니다. 앞단 TLS가 내부 HTTP까지 암호화한다는 뜻도 아니다.

실제17CHECK와 별도3모델을 구분한다. bind-and-route의0.0.0.0/외부 경로, transport-and-trust의HTTP3/QUIC와Forwarded 신뢰는 원문 개념이다. wildcard bind/외부 노출·실제 L4/L7·QUIC·TCP handshake packet capture·신뢰 proxy 정책 적용은 없다. HTTP404와 TLS 거부·connect/read deadline은 실행한 계층과 입력이 달라 생긴 관찰이며 상태나 증상 하나만으로 일반 원인을 단정하지 않는다.

finally에서 자체 DNS thread/socket·proxy server/thread와 Boot subprocess만 종료했다. 자체 Boot 포트 닫힘과 프로세스 종료를 확인했다. 전역 kill·서비스·DNS/hosts/firewall/trust 설정을 바꾸지 않았다. main final freeze 뒤 새 run의 일반 replay와 별도 temp 사본의 독립 재현에서17검사·3모델 전체 frozen이 일치했다. 일반 재현은 `python3 docs/design/d02-2026-10-20/source-proof/run-proof.py --runtime-root /Users/ds/research/javaexperience-d02-20261020/_data/runtime`이며 --freeze를 넣지 않는다.

런타임 버전은 실행별 runtime-last.json으로 구분한다. main 마지막 replay는 Python3.14.3/linkedOpenSSL3.6.3/CLI OpenSSL3.6.3, 독립 담당자의 환경은 Python3.13.1/linkedOpenSSL3.6.2/CLI3.6.2였다. 두 경로의 canonical 관찰은 같고 모두 strict 검증·TLS1.3을 확인했다. 그 전에 별도 shell에서 조회한 CLI OpenSSL3.6.2를 main 최종 실행 버전으로 쓰지 않는다. 날짜·임시 PID/port/CA bytes·인증서 기간·로그 시간과 절대 경로는 raw 자료이며 frozen 비교값으로 위조하거나 고정하지 않았다.

공식 조사에서 RFC1035는 A/CNAME/RCODE, AAAA는 RFC3596으로 근거를 나눴다. DNS 용어는8499보다 새9499도 대조했다. Boot4.1 servlet URL이 current generic 문서로 redirect된 점과 actual4.1.1 runtime을 구분한다. 원문 Java25·기존 설정 전체·외부 DNS·Nginx·운영 경로·패킷/SLA/보안 인증·모든 네트워크 계층을 완료했다는 주장은 하지 않는다.
