# 출처 확인 메모

확인일: 2026-10-20 (Asia/Seoul)

## 직접 본문을 열어 핵심 내용을 확인한 출처

- RFC 9110, RFC 1034, RFC 1035, RFC 8499, RFC 2308, RFC 9114, RFC 7239 및 RFC 9525: RFC Editor의 HTML 본문. 핵심 관련 위치는 URL fragment·HTTP semantics, recursive resolution/cache, CNAME, SERVFAIL/NXDOMAIN, negative caching, HTTP/3 over QUIC, Forwarded security considerations, TLS service identity.
- WHATWG URL Standard: `https://url.spec.whatwg.org/`, components, origin section link, URL serialization/fragment sections. Living Standard.
- NGINX `ngx_http_proxy_module`: `proxy_pass` URI-presence rewrite behavior와 edge cases.
- Spring Boot servlet docs: embedded servlet container와 default port 8080.
- Java SE 21 `ServerSocket` API: explicit bind endpoint와 ephemeral port behavior.
- Tomcat 11 HTTP Connector: connector address binding. 구현/버전별 설명으로만 사용.
- RFC 9293 / RFC 9000: URL 열기 시도보다 이번 주장에는 RFC 9114가 직접 설명하는 QUIC/TCP 차이만 인용해 핵심 근거로 채택하지 않음.

## 검색 결과 snippet만으로 관찰한 항목

- RFC 9110, RFC 9114의 첫 탐색은 web search result에 일부 본문 snippet도 노출됐지만, 이후 공식 HTML 직접 열기로 대조했다.
- Spring Boot 4.1.1 System Requirements: 검색 결과 snippet에 Java 17 이상/26 이하가 노출되었다. canonical 공식 URL 직접 열기 및 `Java 17` 문구 find로 대조했다.
- RFC 9525는 첫 결과가 `info` snippet 형태였으나 공식 RFC HTML도 이후 열었다.

검색 snippet은 최종 사실의 단독 근거로 사용하지 않았다.

## 실패 / redirect / 범위 한계

- 직접 URL `https://docs.spring.io/spring-boot/4.1/reference/system-requirements.html` 열기: web 도구 Internal Error. 공식 검색 결과의 canonical URL `https://docs.spring.io/spring-boot/system-requirements.html`은 별도 직접 열기에 성공했고, 페이지가 Boot 4.1.1로 명시됨.
- `https://docs.spring.io/spring-boot/4.1/reference/` 및 servlet docs는 `/spring-boot/reference/`로 redirect됨. 일반 reference가 아닌 version-specific 세부 문구 확인 시 이를 버전 고정 증거로 취급하지 않음.
- Java `INADDR_ANY`라는 C/POSIX 상수에 해당하는 직접 API 정의를 이번 출처에서 별도로 인용하지 않았다. loopback/wildcard 의미는 보고서에서 개념 경계로 설명하되, Java 21 실험의 binding 증거는 실제 주소/port 관측으로 남길 것.
- 본문을 읽지 않은 검색 snippet만으로 작성한 주장은 없다. 실제 실험 및 원문 수정은 미실행.
