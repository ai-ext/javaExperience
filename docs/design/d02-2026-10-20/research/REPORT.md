# D02 서버·네트워크 개념 리서치 보고서

- 확인일: 2026-10-20 (Asia/Seoul)
- 대상 원문: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D02-server-network-basics.md` (읽기 전용)
- 조사 범위: 요청한 URL, DNS, listener, TCP/QUIC, TLS, NGINX, Forwarded, Spring Boot/Tomcat/Java 21 개념과 예정 실험의 주장 한계
- 조사 방식: 공식 규격·프로젝트 문서의 직접 URL 열기. 사이트 검색 결과 snippet은 직접 본문 확인과 구분해 기록.

## 핵심 주장 및 원문 정정 제안

1. **URL / origin / fragment** — `https://host:8443/path?q#f`의 fragment는 URL의 클라이언트 측 구성요소이며 HTTP request-target에 보내지 않는다. HTTP origin은 일반적인 웹 보안 맥락에서 scheme/host/port tuple로 설명하되, WHATWG의 origin 알고리즘은 특수 URL 및 opaque origin 예외를 둔다. 따라서 “origin은 보통 scheme·host·port”의 ‘보통’을 유지하고 모든 URL에 무조건 적용되는 정의처럼 쓰지 않는다. URI 문법상 fragment 전체가 HTTP에 실리지 않는다고 단정하는 RFC 9110 설명과 WHATWG URL parsing/serialization 규칙을 함께 근거로 삼는다.
2. **DNS 레코드 / 실패 / 캐시** — A는 IPv4 주소, AAAA는 IPv6 주소, CNAME RDATA는 alias owner의 canonical/primary name을 가리키는 DNS 이름이다. CNAME은 HTTP redirect가 아니다. `NXDOMAIN`은 응답 코드상 이름이 존재하지 않는다는 Name Error이고, `SERVFAIL`은 name server가 문제 때문에 query를 처리하지 못한 실패다. `SERVFAIL`만으로 권한 서버 장애·DNSSEC·네트워크 등 구체 원인을 단정할 수 없다. 성공 답은 resolver cache, TTL, CNAME chain, authoritative/referral 상황에 따라 달라질 수 있고, RFC 2308에 따라 NXDOMAIN 등 negative answer 및 제한된 server failure도 캐시될 수 있다. 그러므로 “캐시가 유효하면 루트부터 다시 묻지 않는다”는 간략 설명은 맞지만, 매 질의가 루트에서 시작하거나 캐시가 항상 같은 층에 있다고 오해하지 않도록 한다.
3. **127.0.0.1 / wildcard bind / LISTEN / 외부 도달** — `127.0.0.1`은 IPv4 loopback에서만 접근 가능한 bind 목적지다. `INADDR_ANY`/`0.0.0.0`은 wildcard local address bind로 IPv4 로컬 인터페이스 주소들에 수신을 걸겠다는 뜻이지 원격 클라이언트가 사용할 접속 주소나 외부 도달성 보증이 아니다. IPv6 wildcard는 별도 address-family/dual-stack 설정의 영향을 받으므로 IPv4 `0.0.0.0` 실험을 IPv6까지 일반화하지 않는다. `LISTEN`은 커널 소켓의 대기 상태 증거일 뿐 route, 방화벽, NAT, VM/container 경계의 허용 여부를 증명하지 않는다. 원문 “로컬 앱이 127.0.0.1에 bind하면 서버 내부에서만”은 동일 network namespace 내 기준으로 한정한다.
4. **TCP / QUIC / HTTP/3** — TCP는 연결형 reliable ordered byte stream transport. HTTP/3은 HTTP semantics를 QUIC 위에 매핑하며 QUIC은 UDP를 사용하고 TLS 1.3 이상을 handshake/security layer로 통합한다. HTTP/3에서도 HTTP semantics는 이어지지만 TCP SYN 단계나 TCP port listener를 관찰하는 실험으로 측정할 수 없다. UDP 차단 등 QUIC 연결 실패 시 TCP 기반 버전으로 fallback할 수 있다는 규격 설명도 특정 client의 동작을 보장하는 실측 결과와 구분한다.
5. **TLS 인증서와 termination** — 클라이언트 검증은 신뢰 가능한 PKIX certification path와 요청한 service identity/hostname 일치를 모두 포함한다. 인증서 chain을 서버가 보내는 것만으로 신뢰가 성립하지 않는다. TLS가 LB/proxy에서 terminate되면 그 지점까지의 TLS peer만 직접 인증된 것이며 upstream 구간은 별도 TLS 설정이 없으면 평문일 수 있다. HTTP 응답을 얻었다는 사실만으로 브라우저식 인증서 검증이 수행되었다고 주장하지 않는다. 인증서 검증을 비활성화하는 실험은 하지 않는다.
6. **NGINX `proxy_pass` URI rewrite** — URI가 붙은 `proxy_pass`는 normalized request URI 중 location과 매칭된 부분을 directive의 URI로 교체한다. URI가 없는 형식은 조건에 따라 원래 URI 또는 전체 normalized URI를 전달한다. 예외 조건(rewrite, regex/named location, 변수 사용 등)이 있으므로 “path가 항상 그대로 전달” 또는 한 사례를 모든 설정으로 일반화하지 말고, 설정·upstream 관측 path를 함께 기록한다. Python toy proxy 실험은 URI rewrite 원리를 설명하는 사용자 정의 동작일 뿐 NGINX 실측·동일성 증명이 아니다.
7. **`Forwarded` 신뢰 경계** — RFC 7239는 `Forwarded` 값이 잘못되거나 악의적으로 변경될 수 있고, 앞선 proxy/address chain은 신뢰되지 않을 수 있다고 명시한다. 신뢰하도록 지정한 proxy가 직접 작성/정제한 정보만 정해진 경계 안에서 사용해야 한다. loopback mini proxy의 헤더 예시는 실제 인터넷 신뢰 proxy 체인, 클라이언트 IP 식별, Spring 설정의 안전성을 입증하지 않는다.
8. **Spring Boot 4.1.1 / Tomcat / Java 21** — Boot 공식 System Requirements는 4.1.1의 최소 Java를 17, 최대 호환 버전을 26으로 명시한다. Java 21은 이 범위 안이다. Boot servlet 문서는 내장 Tomcat/Jetty 지원과 기본 HTTP port 8080을 설명한다. 다만 제안 실험은 원문 코드 및 별도의 Java 21 Gradle 환경에서 실제 할당된 port(예: port 0이면 시작 로그로 확정한 ephemeral port)로 TCP 확인을 계획하므로, 이것을 원문의 Java 25·8080 설정을 그대로 실행한 실측이라고 표현하지 않는다. `@GetMapping("/probe")` 원문 코드와 추가 경로가 다르면 `/probe` 외 404 여부를 설정 및 실제 결과와 함께 해석한다.

## 추가 예정 실험의 범위와 결과 보고 규칙

| 실험 | 직접 관측할 수 있는 것 | 여기서 주장하면 안 되는 것 |
|---|---|---|
| 새 loopback / port 0 Python DNS UDP toy | 자체 코드가 생성한 제한된 DNS request/response, 로컬 port binding, toy에서 정의한 응답·cache 동작 | 시스템 resolver/hosts 동작, 일반 DNS 상호운용성, 실제 authoritative delegation, 인터넷 A/AAAA, 운영 DNS 캐시 특성 |
| mini TLS termination proxy | 테스트 전용 client→proxy TLS와 proxy→upstream의 실제 구성, 관측된 HTTP 전달/종료 지점 | TLS 전체 PKI를 포괄하는 검증, 실제 LB/Nginx 동작, 외부 TLS 종단 구성 |
| 원문 `ProbeApplication.java` 그대로 + 추가 Java 21 Gradle 환경의 Boot/Tomcat | 실행한 버전/설정/주소/port에서의 TCP 접속과 응답 status/body, `/probe` 및 명시적으로 추가한 경로의 관측 | 원문에 없던 `/probe200ok/404` route를 원문 코드 결과라고 하기, Boot 전체 버전 지원의 재검증, 외부 도달성 |

- 모든 키/인증서/설정/로그는 새 `0700` run directory와 `0600` 파일 안의 일회용 테스트 자산으로만 둔다. 기존 시스템 DNS, hosts, firewall, truststore, service는 변경하지 않고 기존 서비스로 연결하지 않는다.
- 실험을 아직 실행하지 않았으므로 본 보고서는 계획만 기록한다. 어떤 planned output/status도 결과로 채워 넣지 않는다.
- HTTP 200/404/502 같은 status는 응답을 만든 계층을 단독으로 확정하지 않는다. 대상 주소/port, 실제 route/path, 응답 헤더/body, proxy 및 app 로그, 실행 설정이 함께 있어야 원인을 좁힐 수 있다. 오류 status 하나만으로 DNS/TCP/TLS 문제를 확정하지 않는다.
- 원문에 기록된 Java 25/8080 예시, `dig` 외부 조회, NGINX 제품 실측, HTTP/3/QUIC, LB/NAT, 외부 경로 접근은 이번 추가 실험에서 실행되지 않았다. 실제 실행 전후를 구분해 보고해야 한다.
- 이 자료는 개념 검토이지 외부 서비스의 현재 상태 조사나 보안 인증서 점검이 아니다.

## 출처 (공식 1차 자료)

1. RFC 9110, HTTP Semantics, §4.2 및 URI/fragment 관련 설명: https://www.rfc-editor.org/rfc/rfc9110.html
2. WHATWG URL Standard, URL components, origin, fragment serialization: https://url.spec.whatwg.org/
3. RFC 1034, Domain Names—Concepts and Facilities, recursive/nonrecursive resolution and cache: https://www.rfc-editor.org/rfc/rfc1034.html
4. RFC 1035, Domain Names—Implementation and Specification, A/AAAA/CNAME and RCODE: https://www.rfc-editor.org/rfc/rfc1035.html
5. RFC 8499, DNS Terminology, NXDOMAIN/SERVFAIL definitions: https://www.rfc-editor.org/rfc/rfc8499.html
6. RFC 2308, Negative Caching of DNS Queries, NXDOMAIN/NODATA and SERVFAIL cache bounds: https://www.rfc-editor.org/rfc/rfc2308.html
7. RFC 9293, Transmission Control Protocol (TCP): https://www.rfc-editor.org/rfc/rfc9293.html
8. RFC 9114, HTTP/3: https://www.rfc-editor.org/rfc/rfc9114.html
9. RFC 9000, QUIC: A UDP-Based Multiplexed and Secure Transport: https://www.rfc-editor.org/rfc/rfc9000.html
10. RFC 8446, TLS 1.3: https://www.rfc-editor.org/rfc/rfc8446.html
11. RFC 9525, Service Identity in TLS: https://www.rfc-editor.org/rfc/rfc9525.html
12. NGINX `ngx_http_proxy_module`, `proxy_pass`: https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass
13. RFC 7239, Forwarded HTTP Extension, §8.1: https://www.rfc-editor.org/rfc/rfc7239.html
14. Spring Boot 4.1.1 System Requirements: https://docs.spring.io/spring-boot/system-requirements.html
15. Spring Boot 4.1 Servlet Web Applications, embedded servlet container: https://docs.spring.io/spring-boot/4.1/reference/web/servlet.html
16. Apache Tomcat 11 HTTP Connector, address binding: https://tomcat.apache.org/tomcat-11.0-doc/config/http.html
17. Java SE 21 `ServerSocket` API, bind/address/port: https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/net/ServerSocket.html

## 확인 한계

- 확인 날짜는 2026-10-20. WHATWG URL은 living standard여서 이후 바뀔 수 있다.
- RFC는 규범 문서이며 운영체제·JVM·resolver·client의 실제 구현과 설정을 대신하지 않는다.
- Spring Boot 4.1 문서 URL은 일부 요청에서 현재 일반 문서로 redirect되었다. Boot 4.1.1 최소/최대 Java 범위는 별도 4.1.1 System Requirements 페이지에서 직접 확인했다. 요청한 `/system-requirements.html` URL은 직접 열기 실패로 기록했으며, 동등한 공식 `/system-requirements.html` 페이지는 검색 결과 및 canonical URL로 직접 확인했다.
- 현재 보고서에는 원문을 바꾼 패치가 포함되지 않는다. 문서 수정은 별도 작업이다.
