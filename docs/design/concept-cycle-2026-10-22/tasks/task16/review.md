# task16 · D02 독립 감사

판정: **needs_completion**, 전체 문서 완료 **false**. spec 미통과이므로 quality는 진단용이며 승인하지 않았다.

기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`, 원문 SHA256 `6f2fe2c7c720eef33f939ed06b459c2311a8615fbc53ce68acc890a18c80fbaf` / 304줄.

`npm --prefix tools/site run test:d02` 새 실행 exit0 (2026-10-22T00:06:26.499044+00:00 ~ 2026-10-22T00:06:38.880716+00:00). 원시 출력·exit·14개 파일 SHA·전후 불변은 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task16/test-d02.command.json` 및 stdout/stderr 파일에 저장했다. 새 native 서버·네트워크·Java·DB·브라우저·외부 조사/LLM 실행은 없다.

## spec → quality

주요 의미 단위 64행: partial 31 / missing 10 / covered 16 / unrun 7. 중첩 절과 반복 Q&A를 포함하므로 전체 개념의 백분율이 아니다. `covered`도 실제 실행과 개념 모델을 구분하며, 마지막 참고문헌 행은 자료 보존 판정이다.

원문 전문14172자·code6·Mermaid3·id23·기존map1 보존 검사는 통과했다. 그러나 새 장면이 없는 내용이 접힌 원문에 남아 있다는 사실은 학습 장면 완료를 뜻하지 않는다. 전체 요청 여정/역방향 응답, 일부 용어 역할·주소 대역·origin, DNS 위임, NAT/L4/L7/gateway·health/target, 계층별 다음 진단 절차와 일부 Q&A가 남았다. 원문 Java25/8080/Kotlin 설정 및 외부 진단 명령은 명시적으로 미실행이다.

### 확정 품질 finding

- **D02-Q01 · minor**: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d02-2026-10-20/source-proof/run-proof.py:164`는 upstream 정상 반환 뒤에만 `proxy_requests.append`를 한다. 같은 파일190~195의 `httpHandlerCallsAdded`는 handler 진입 횟수보다 약한 지표다. 현재 TLS거부 관찰을 뒤집는 결함은 아니며, 직접 진입 counter로 측정하거나 완료 요청 수로 라벨을 좁힐 필요가 있다. 새 네트워크 재현은 하지 않았다. 수정·검증 조건은 review.json의 finding에 명시했다.

확인한 critical0 / important0 / minor1 (quality 진단). spec의 important 공백2묶음은 별도이며 quality 승인으로 덮지 않았다. 공통 clipboard race는 재현하지 않았다.

## 기술 경계

- URL 예시는 Python parser 입력뿐이다. 별도 client serializer가 path/query로 만든 `/api/probe?expand=items`를 실제 loopback TLS proxy가 받았으며 fragment는 없었다. 브라우저 패킷 증거가 아니다.
- UDP DNS toy의 A/AAAA/CNAME과 RCODE3/2·TTL60은 고정 fixture다. Root/TLD/운영 resolver·OS cache는 미실행이며 t0/t30/t60은 fixed-clock 모델이다.
- bind-only timeout, listen 뒤 TCP, 연결 뒤 의도된0byte/read deadline을 구분한다. 0.2는 설정값이고 성능·방화벽 원인의 실측이 아니다.
- TLS는 client-local demoCA를 사용하고 인증서/hostname 검증을 유지했다. Python proxy에서 TLS가 끝나고 내부HTTP로 rewrite200/미변환404가 돌아왔다. Nginx/LB의 제품 검증이 아니다.
- `관측 Host=d02.test`는 proxy ingress 헤더다. upstream은 별도 HTTPConnection이 생성한다. upstream Host 보존·host routing·XFF/Forwarded 신뢰정책·실제 외부 경로를 검증한 결과가 아니다.
- 원문Java는 과거 추가Java21/Boot4.1.1/Tomcat11.0.24/loopback-port0에서 실행했다. 원문Java25/8080/Kotlin 설정 실행과 다르며 port0은 실제수신포트값이 아니다.

## 시각·현재 브라우저

선정10JPG를 모두 실제 열람했고 과거 대표 캡처3개(desktop URL, mobile proxy, desktop transport)를 열람했다. 파일 전체 경로는 review.json에 열거했다. 선정 헤더/크기는 모두 일치(bind만1672×940, 나머지1672×941). 대표 캡처는 full-page 크기이며 기록 viewport1672×941/360×800와 구분했다. mobile proxy 캡처에는 외부 번역 overlay와 수평 pan 안내가 보인다.

과거54관찰행 code/title/values를 현재27stage와 정적으로 대조해 불일치0이었다. 과거20캡처 전수 열람이나 현재 native 브라우저 조작을 했다는 뜻은 아니다. draft3장·나머지17캡처·전수pixel·학습자이해는 미검증이다. 메인의 현재 desktop/mobile 관문이 필요하다.

## 원문 의미 단위 전수표

| 원문 절/의미 | 줄 | stageIds | 판정 | 남은 범위 |
|---|---:|---|---|---|
|도입: URL→서버·계층별 장애|1–5|url-parts, dns-a, socket-bound, tls-valid, proxy-rewrite, app-probe, diagnose-layers|partial|한 요청의 전 여정·응답 역방향을 함께 따라가는 새 장면 없음.|
|1. 큰 그림: 요청 여정·응답 역방향|7–20|url-parts, dns-a, socket-listen, tls-valid, proxy-termination, app-probe|partial|브라우저→resolver→NAT/firewall→LB→Tomcat/MVC→controller→응답 연결 장면 필요.|
|1. 예시 URL·fragment·다중 서버|22–24|url-parts, url-target, proxy-termination|partial|DNS가 CDN/LB를 답하고 여러 앱이 뒤에 있는 토폴로지/D01·D07 연결은 접힌 원문뿐.|
|2. 클라이언트·서버는 통신 역할|30–30|없음|missing|역할 전환 사례 필요. 원문 보존은 장면 커버리지로 세지 않음.|
|2. 물리 서버·VM·컨테이너|31–31|없음|missing|D07 연결과 역할 구분의 짧은 장면 또는 명확한 안내 필요.|
|2. host·IP·도달 가능성|32–32|url-parts, bind-loopback, bind-wildcard|partial|도메인→여러IP→실제 접속주소 선택 연결 없음.|
|2. 공인·사설 IPv4 대역|33–33|없음|missing|주소 대역/라우팅/보안 허용의 차이 장면 필요.|
|2. port와 TCP/UDP socket|34–34|url-parts, socket-bound, socket-listen, app-start|partial|80/443/8080 기본값·TCP/UDP별 socket 식별은 접힌 원문뿐.|
|2. localhost·wildcard bind|35–35|bind-loopback, bind-wildcard|covered|wildcard·외부환경 실제 실행은 별도 unrun이며 현재 모델을 실측으로 올리지 말 것.|
|2. 도메인·DNS와 HTTP 상태|36–36|dns-a, dns-aaaa, dns-cname|covered|운영 resolver 검증을 뜻하지 않음.|
|2. 재귀 resolver·권한 DNS 역할|37–37|dns-a, cache-hit|partial|누가 누구에게 위임을 따라 질의하는지 역할 장면이 없음.|
|2. A·AAAA·CNAME 구분|38–38|dns-a, dns-aaaa, dns-cname|covered|고정 UDP toy 범위이며 주소로 HTTP를 보내지 않음.|
|2. URL·origin|39–39|url-parts, url-target|partial|scheme/host/port 변경으로 origin을 비교하는 장면 없음.|
|2. TCP·QUIC·HTTP/3|40–40|transport-protocol|covered|TCP SYN 패킷/QUIC의 실제 실행은 없음.|
|2. HTTP·TLS·인증서·비밀키|41–41|tls-valid, tls-wrong, tls-untrusted, proxy-termination|partial|인증서 공개자료/개인키 비밀자료·HTTPS와 업무/코드안전성 구분은 원문·긴근거에만 있음.|
|2. 포워드·리버스 proxy|42–42|proxy-termination, proxy-rewrite|partial|회사 forward proxy와 배치·관리주체 비교 없음.|
|2. LB·L4/L7|43–43|없음|missing|연결주소/port와 host/path 규칙 및 DNS라운드로빈 차이 필요.|
|2. API gateway|44–44|없음|missing|인증/쿼터/버전route와 L7/LB의 기능겹침 비교 필요.|
|2. 웹서버·WAS|45–45|app-start, app-probe|partial|정적응답/proxy/Servlet실행 역할과 제품경계가 절대적이지 않음은 원문뿐.|
|2. 방화벽·보안그룹|46–46|bind-wildcard|partial|규칙 기반 허용/차단과 OS/클라우드 SG 차이 장면 없음.|
|2. NAT·listener·target group|47–47|socket-listen, bind-wildcard|partial|NAT 주소변환·LB listener/rule·target group 역할 연결 없음.|
|2. URL도표·기본port·여러IP|49–54|url-parts, url-target|partial|기본80/443 생략·credentials금지·DNS다중IP와 실제연결주소 차이 추가 필요.|
|2. 비교: forward/reverse·L4/L7·LISTEN/외부도달|56–60|proxy-termination, socket-listen, bind-wildcard|partial|forward/reverse·L4/L7 비교표의 핵심 차이는 새 장면에 없음.|
|3.1 URL분해·DNS질의 주체/입출력|64–68|url-parts, dns-a, dns-aaaa, dns-errors|partial|browser/OS/resolver/authority의 실제/개념 흐름 연결, dig/nslookup 관찰은 없음.|
|3.1 cache 유효·만료|66–70|cache-miss, cache-hit, cache-expired|covered|실제 OS/browser/resolver cache가 아님을 유지.|
|3.1 Root→TLD→권한 위임|70–82|없음|missing|cache miss일 때 resolver가 위임을 따라가는 개념 장면 필요; 실제외부조회로 가장하지 말 것.|
|3.2 TCP3way·QUIC 전송|84–87|socket-listen, transport-protocol|partial|SYN→SYNACK→ACK·라우팅/NAT/firewall/listener 통과의 연결 장면 없음; packet은 미실행.|
|3.2 refused·connect timeout·read timeout|88–88|socket-bound, socket-listen, socket-silent, diagnose-layers|partial|refused는 실측하지 않음. 증상→다음확인명령 비교 장면을 보완할 것.|
|3.2 localhost·IPv4/IPv6 mismatch|90–90|bind-loopback, bind-wildcard|partial|localhost→::1과 IPv4전용 listener mismatch 사례 없음.|
|3.2 NAT outbound/inbound|92–92|없음|missing|사설출발패킷→변환주소/port→응답 및 unsolicited inbound 차이 개념 장면 필요.|
|3.3 TCP→TLS→HTTP·검증/종료점|94–98|tls-valid, tls-wrong, tls-untrusted, proxy-termination|covered|추가 loopback 범위. 외부기관·만료/폐기·TLSpassthrough 검증없음.|
|3.3 보안보장 경계·검증끄기 금지|100–100|tls-valid, proxy-termination|partial|업무상진실성/앱취약점과 TLS보장을 비교하는 새 장면 없음.|
|3.4 L4/L7·health·listener/rule/target|102–105|proxy-termination|partial|L4연결분산/L7host/path규칙/health check/target상태 단계 없음.|
|3.4 rewrite와200/404|104–106|proxy-rewrite, proxy-no-rewrite|covered|Python prefix4 fixture이며 Nginx proxy_pass 일반동등성/제품실행 아님.|
|3.4 502/503/504·발생주체|106–106|diagnose-layers|partial|upstream실패·대기만료·다른응답주체 비교와 다음확인명령 없음.|
|3.4 Forwarded/XFF 신뢰·gateway겹침|108–108|transport-trust|partial|누가 헤더를 위조하고 신뢰proxy가 어떻게 제거/덮어쓰는지 값비교 없음; gateway정책도 없음.|
|3.5 Tomcat→Servlet/MVC→controller|110–116|app-start, app-probe, app-missing|partial|Servlet/MVC handler선택, method/headers/body, 사설Tomcat/LB앞단 토폴로지·정적웹응답은 별도 장면 없음.|
|3.5 전체sequence·다른연결모델|118–139|proxy-termination, app-probe|partial|동일요청의 단계별 전진/응답역방향, HTTP3/TLSpassthrough와 차이 장면 필요.|
|4.1 Java25·GradleKotlin·Boot4.1.1 전체설정|143–161|app-start|unrun|원문설정 실행 또는 unrun유지. 기존loopback 결과로 대체하면 안 됨.|
|4.1 application.properties8080|163–167|app-start|unrun|원문8080 실행없음. 할당설정0과 실제port59724도 구분할 것.|
|4.1 원문Java main/controller|169–191|app-start, app-probe|covered|추가Java21환경의 과거실행. 새Java native실행 없음.|
|4.1 wrapper/bootRun/curl 원문명령|193–204|app-probe, app-missing|unrun|java25/bootRun/curl -v 목적지/요청/응답 확인 절차의 원문실행은 미검증.|
|4.2 dig A/AAAA·nslookup|206–212|dns-a, dns-aaaa|unrun|외부 DNS 원문명령·실제resolver 결과없음.|
|4.2 lsof·Linux ss listener|214–218|socket-listen, bind-loopback|unrun|OS별 실제LISTEN출력과 bind주소 비교 필요/현재미실행.|
|4.2 openssl SNI/hostname 명령|220–223|tls-valid, tls-wrong|unrun|외부example.com s_client 명령은 미실행.|
|4.2 curl --resolve·Host/SNI|225–225|url-parts, tls-valid|unrun|문서용IP 교체, DNS만우회하면서 URLhostname/Host/SNI보존 관찰 장면 없음.|
|4.2 진단순서·404 도달한계|227–227|diagnose-layers, app-missing|partial|dig→실제IP:port→TLS→status/proxy·app로그→listener 순서로 다음검증을 고르는 장면 없음.|
|5. 오해1: DNS성공≠서버정상|231–231|dns-a, app-probe|covered|서로다른 fixture 결과를 동일 외부서비스 종단검사로 합치지 말 것.|
|5. 오해2~4: localhost·LISTEN·wildcard|232–234|bind-loopback, bind-wildcard, socket-listen|covered|외부클라이언트 실제시험은 미실행.|
|5. 오해5~6: TLS종료·pathrewrite|235–236|proxy-termination, proxy-rewrite, proxy-no-rewrite|covered|Nginx제품동등성은 미검증.|
|5. 오해7: 외부IP≠앱서버IP|237–237|없음|missing|외부주소/target/내부주소를 함께보는 토폴로지 필요.|
|5. 오해8: 전달헤더항상신뢰|238–238|transport-trust|covered|신뢰정책 실제검증은 없음.|
|5. 오해9: HTTP3에TCPhandshake적용|239–239|transport-protocol|covered|QUIC 실제 연결을 검증한 것은 아님.|
|6. 시각설계1: 요청여정 전체|241–243|url-parts, dns-a, socket-listen, tls-valid, proxy-termination, app-probe|partial|요청/응답 여정 개념 장면 필요.|
|6. 시각설계2: DNS위임확대|244–244|cache-miss, cache-hit, cache-expired, dns-a|partial|Root/TLD/authority 위임과 browser/OS/resolver 역할 없음.|
|6. 시각설계3: 장애계층분기|245–245|diagnose-layers, dns-errors, socket-bound, tls-wrong, app-missing|partial|refused·502/504·계층별명령·응답발생주체 분기 보완.|
|7. Q1 DNS성공후timeout|249–253|dns-a, socket-bound, socket-silent, diagnose-layers|partial|refused/timeout에 대한 다음확인명령·선택/자가점검 없음.|
|7. Q2 localhost/외부도달|255–259|bind-loopback, bind-wildcard|covered|lsof/ss·외부route/firewall 실제진단은 없음; Q&A 자체 상호작용검증 아님.|
|7. Q3 인증서·TLS시점·종료점|261–265|tls-valid, tls-wrong, tls-untrusted, proxy-termination|partial|인증서/공개키/개인키·TCP→TLS→HTTP 한연결 순서/자가점검은 부분.|
|7. Q4 L4/L7·gateway|267–271|없음|missing|L4연결정보/L7HTTP규칙/API정책 역할 비교 필요.|
|7. Q5 Nginx→Tomcat·502/404주체|273–277|proxy-termination, proxy-rewrite, app-probe, app-missing|partial|응답역방향·access/error/upstream/app로그·502발생주체 분기 필요.|
|7. Q6 NAT와firewall/outbound|279–283|없음|missing|사설서버 outbound와 unsolicited inbound, NAT vs firewall 개념 장면 필요.|
|7. Q7 HTTP3·QUIC·TLS1.3|285–289|transport-protocol|covered|실제QUIC/packet실행/자가점검응답은 미검증.|
|8. 참고문헌과기존공식검증|291–304|없음|covered|자료보존 covered이며 새학습장면수로 계산하지 않음. 이감사에서 새웹조회없음/현재본문·링크가용성 미검증.|

## 다음 묶음

1. 전여정·역할/주소 → 같은한요청의 URL→DNS→route/NAT/firewall→LB/proxy→Tomcat/MVC/controller→역방향응답, 역할/공인사설IP/port/forwardproxy/L4L7/gateway/targetgroup 개념 장면. 외부미실행 상태 유지 가능.
2. DNS위임·origin·IPv6·NAT → resolver/authority·Root/TLD 위임과 cache, origin비교, localhost::1 mismatch, NAT outbound/unsolicited inbound 의미 장면.
3. 진단·보안경계·자가점검 → 계층별증상→다음명령/로그/응답주체, 502/503/504·refused를 개념/미실행으로 설명, Host ingress/upstream·XFF/신뢰경계·TLS 개인키/만료 경계·Q&A 보완.
4. 원문환경·외부실행 → Java25/KotlinGradle/8080/bootRun·curl·dig/nslookup·lsof/ss·openssl_s_client·curl--resolve 미실행을 유지. 재실행 필요성/권한은 메인이 확정; 이감사 결과로 요구되는 즉시실행 아님.
5. 측정라벨·최종관문 → D02-Q01 handler카운터/라벨 수정사양 확정, spec→quality 재감사 및 메인 현재 desktop/mobile 브라우저. 전체pixel/학습자이해 미검증 유지.

전체 판정: needs_completion / fullDocumentComplete=false
새 검사: test:d02 exit0, HEAD·SHA·UTC·raw 보존
확정 품질 finding: minor1, critical0/important0; quality 미승인
시각: 선정10JPG + 과거대표3캡처 직접 열람, 현재브라우저 미실행
남은 일: 전여정·DNS위임·NAT/LB/진단·원문환경경계·메인브라우저
