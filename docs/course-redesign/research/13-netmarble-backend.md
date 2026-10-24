# 13. 넷마블 투입용 Java/Spring 백엔드: 공고·기술자료·도메인 역량 조사

조사일 2026-10-22. 원칙: 열어서 확인한 출처만 기재. 확인 수준은 [원문] 직접 읽음 / [요약] 페이지 읽기 도구가 요약한 결과(원문 그대로 아님) / [본문확인] 웹 아카이브로 본문을 끝까지 읽음(2-1절) / [스니펫] 검색 결과 발췌만 확인 / [추측] 로 표시.

## 0. 먼저 알아야 할 결론

- 공고에 나온 넷마블 Java 백엔드는 "게임 서버(실시간)"보다 **게임 퍼블리싱 플랫폼(인증, 결제, 쿠폰, 운영툴, 로그, 푸시)** 쪽이 중심이다. 직무 소개 페이지도 "인증, 푸시, 로그, 채팅 등" 퍼블리싱용 서버·웹 서비스를 플랫폼 및 서비스개발 직무로 설명한다.
- 확인한 공고 모두에서 **MyBatis 언급은 0건**. **JPA 언급은 2019년 공고 1건**뿐. 스택은 Java + Spring(Boot) + MySQL/MSSQL + Redis(+Aerospike) + Linux WAS + Docker/Kubernetes/GCP로 수렴한다.
- 거의 모든 공고가 "마감" 표시이면서 마감일은 "상시채용"으로 모순 표기된다. 현재 모집 여부는 확인 불가(아래 절 참조).

## 1. 채용 공고 (원문 확인한 것만)

넷마블 본사 공고만 확인됨. 자회사(넷마블엔투·넥서스·몬스터·네오)의 Java/Spring 경력 백엔드 공고 원문은 확인하지 못했다(4절 참조).
Wanted 페이지는 읽기 도구가 요약해 준 결과라 문장이 원문 그대로가 아니다. 사람인 2건과 #1 일부 항목은 원문 인용에 가깝다.

| # | 공고 | URL | 경력 | 확인 수준 |
|---|------|-----|------|-----------|
| 1 | 플랫폼 백엔드 개발자 | https://www.wanted.co.kr/wd/239276 | 6년 이상 | 요약 + 3자 미러 대조 |
| 2 | 웹 백엔드 개발자 | https://www.wanted.co.kr/wd/282831 | 3년 이상 | 요약 |
| 3 | 서버 개발자(웹/TCP 서버) | https://www.wanted.co.kr/wd/46887 | 3~10년 | 요약 |
| 4 | 서버 개발자(TAS/BAS) | https://www.wanted.co.kr/wd/311524 | 5년 이상 | 요약 |
| 5 | 게임퍼블리싱플랫폼 서버개발자 | https://www.wanted.co.kr/wd/31765 | 3~7년 | 요약 |
| 6 | 서비스 자동화 솔루션 개발 | https://www.wanted.co.kr/wd/36462 | 4~10년 | 요약 |
| 7 | 글로벌 서비스 인프라 개발자(백엔드 서버 개발 포함, 2019-11~12) | https://www.saramin.co.kr/zf_user/jobs/view?rec_idx=37209041 | 백엔드 4년 이상 | 원문에 가까움 |
| 8 | 웹/모바일 서비스 백엔드 개발자(마감 2023-08-01) | https://m.saramin.co.kr/job-search/view?rec_idx=41413368&cn=job-industry&cns=job-list | 5~15년 | 태그만(본문은 이미지) |
| 9 | 플랫폼 프론트엔드 개발자(운영도구) | https://www.wanted.co.kr/wd/239278 | 5년 이상 | 요약 |
| 10 | 사내 시스템 개발(e-HR) | https://www.wanted.co.kr/wd/244778 | 3년 이상 | 요약(게임 서비스 아님, 참고용) |

### 공고별 내용

**#1 플랫폼 백엔드 개발자** (서울 구로 G-Tower)
- 담당: 글로벌 환경에서의 인증 서비스 개발 및 운영.
- 자격: Java 백엔드 6년+, Spring Boot/Framework, MySQL·MSSQL 등 RDB와 Redis 등 NoSQL 설계·개발, 컴퓨터공학 지식, 협업 역량.
- 우대(넷마블컴퍼니 공고를 옮긴 3자 미러 https://www.incu-career.kr/0accd5ba-cfe6-4813-9a71-2b823999a10e 기준, Wanted에는 우대 항목 없음): 대용량 트래픽 서비스, GCP/AWS 운영, Kubernetes/Docker, 대규모 아키텍처 설계, MSA, OAuth·IdP 연동 인증 경험, 글로벌 서비스 경험, AI 활용 능력. 미러의 신뢰도는 낮다(넷마블 공식 URL 본문은 내가 열지 못함).
- 스택: Java, Spring Boot, MySQL, MSSQL, Redis. MyBatis/JPA 언급 없음.

**#2 웹 백엔드 개발자**
- 담당: **구독·쿠폰 등 결제 시스템 개발/운영, PG 연동, 결제 운영 툴, 웹 상점, 웹 이벤트 페이지.**
- 자격: 웹 백엔드 3년+, Java·Spring Framework, Linux에서 WAS/웹서버 운영, MySQL·MSSQL, 공통화·모듈화·자동화를 고려한 설계, RESTful API.
- 이번 조사에서 "결제·쿠폰·운영툴·이벤트"를 직접 명시한 유일한 공고. 3~6년차 투입 시나리오와 가장 일치한다.

**#3 서버 개발자(웹/TCP 서버)**
- 담당: 웹 서버와 TCP 서버 개발, 부수적 웹 프론트, 기술 블로그·특허·연구회 활동.
- 자격: 컴퓨터공학 기초, IT 서비스 개발·운영 3년+, Java와 백엔드 프레임워크 이해.
- 스택(공고 기재): Java, Spring Framework, Netty, SQL / GCP·프라이빗 클라우드·Kubernetes·Docker / Jira, GitLab, Crucible / IntelliJ.

**#4 서버 개발자(TAS/BAS)**
- 담당: 사내 테스트 자동화 시스템(TAS) 서버 개발·운영, 빌드 분석 시스템(BAS) 지원, AI 기법 연구.
- 자격: Java 백엔드 5년+, Spring, Linux WAS 운영, RDBMS 설계(MySQL/MSSQL), 컨테이너 CI/CD, Spring Boot 웹앱 설계·운영, Docker/Kubernetes.

**#5 게임퍼블리싱플랫폼 서버개발자**
- 담당: 게임 퍼블리싱 플랫폼 서비스 백엔드·프론트 개발, 레거시 유지보수.
- 자격: Java 기반 서버 서비스 개발·운영, Spring 기반 서버 서비스 개발·운영, Linux에서 WAS·웹서버 설치/설정.
- 스택(공고 기재): Java, JavaScript, SQL, Spring, Angular / Kubernetes, Tomcat, nginx, Apache httpd / **MySQL, MSSQL, Aerospike, Redis** / 온프레미스 및 GCP VM. 시점은 불명(공고 번호상 오래된 편, [추측]).

**#6 서비스 자동화 솔루션 개발**
- 담당: Netmarble Operating System API 서버 유지보수, 컨테이너 서비스 구성·관리 툴, 배포·운영 자동화.
- 자격: Java, 다른 언어 1개 이상, MySQL(MariaDB)/MS-SQL, NoSQL, 빌드·테스트·배포 자동화, Agile.

**#7 글로벌 서비스 인프라 개발자 (2019)**
- 백엔드 서버 개발자: 게임 런칭·패치·운영 자동화 백엔드. 자격: 웹 API 서버 4년+, MSA, RESTful API, 데이터 파이프라인, CI/CD. 스킬: **Java, Spring Boot, JUnit, RDBMS, JPA, GitFlow, Jenkins**. 우대: 클라우드, NoSQL, DevOps, Airflow, Python/Bash.
- 같은 공고에 에이전트 개발자(C/C++), 클라우드, 글로벌 서비스 엔지니어 직군이 함께 있음.

**#8 웹/모바일 서비스 백엔드 개발자 (2023)**: 본문이 이미지라 담당·자격 확인 불가. 태그는 Java, Kotlin, Spring, SpringBoot, AWS, Docker, Kubernetes, Linux. 서울 구로·금천.

**#9 플랫폼 프론트엔드**: 글로벌 이용자용 웹 서비스 UI와 **게임 퍼블리싱 운영에 쓰는 운영도구** 개발. 자격: 프론트 5년+, AngularJS/Vue/React 중 경험. (백엔드는 운영툴 API를 제공하는 쪽이라는 점에서 참고)

**#10 e-HR**: HR 시스템 운영·개발, OOP 기반 설계·구현. 게임 서비스와 무관하나 "넷마블 사내 시스템"도 Java 웹 개발 수요가 있다는 참고.

### 공고 종합

| 항목 | 관찰 |
|------|------|
| 언어/프레임워크 | Java + Spring(Boot) 전 공고 공통. Kotlin은 2023 태그 1건. C#/C++/Node는 이번 백엔드 공고에서 확인 못함(에이전트 개발자만 C/C++) |
| DB | MySQL, MSSQL(거의 공통), Redis, Aerospike(1건) |
| 영속 계층 | MyBatis 0건, JPA 1건(2019). 어느 쪽도 우선 요구가 아니다. 즉 "JPA만"이나 "MyBatis만"으로 한정해 가르칠 근거가 공고에는 없다([추측]: 실제 코드베이스는 입사 후 확인 필요) |
| 운영 환경 | Linux WAS/웹서버 운영 경험을 3개 공고(#2, #4, #5)가 명시, Docker/Kubernetes, GCP/AWS, 컨테이너 CI/CD |
| 설계 요구 | 공통화·모듈화·자동화, MSA, REST API, 대용량 트래픽(#1 우대) |
| 도메인 | 인증(OAuth/IdP), 결제(구독·쿠폰·PG), 운영툴, 웹 상점·이벤트 페이지, 로그/푸시 |
| 비기능 | JUnit, GitFlow, Jenkins, 기술 블로그·특허 활동(#3) |

## 2. 넷마블 공개 기술 자료

넷마블 기술 블로그(https://netmarble.engineering/)는 존재한다. **그러나 내 환경에서는 본문과 목록 페이지가 읽히지 않았다**(페이지가 빈 껍데기로 응답). 아래 글들은 검색 결과 발췌로만 확인했으며 [스니펫] 수준이다. 본문 세부는 직접 열어 확인해야 한다.
**추가(2026-10-22): 웹 아카이브로 4건의 본문을 확보했다. 표에서 [본문확인]으로 표시한 항목과 아래 2-1절이 그것이다.**

| 글(검색 발췌 기준) | URL | 도메인 연결 |
|------|-----|------|
| 게임 서버 시스템을 위한 HikariCP 옵션 및 권장 설정 / JDBC와 Timeout 이해하기 (JDBC 태그 목록에 표시) | https://netmarble.engineering/tag/jdbc/ | 커넥션 풀, 타임아웃. [본문확인] "WAS+DB용 권장 설정을 게임 서버에 그대로 적용하는 문제"를 다룸(2-1절 가, 나) |
| 데이터 파이프라인 기본 원리와 원칙은 시간이 지나도 유효해야 한다(1/2) | https://netmarble.engineering/data-pipeline-design-principles-a/ | 로그 수집. 신뢰성·확장성·유지보수성, 수집 단계 전달 보장 부재 시 클라이언트 재전송 + logkey 기반 중복 제거, HDFS Namenode 이중화(발췌 요약) |
| 옵저버빌리티: 로그라고해서 다 같은 로그가 아니다(2/2, 2021-09-06로 추정) | https://netmarble.engineering/author/yakkity_yaffle/ 에 목록 표시 | 수천 VM·수백 K8S 클러스터·200여 서비스 운영 규모, 로그 품질 관리 |
| RESTful API 서버를 위협하는 한 글자, 슬래시 - CVE-2016-5007 | https://netmarble.engineering/spring-security-path-matching-inconsistency-cve-2016-5007/ | Spring Security URL 매칭 우회. 권한 체크 |
| 스프링 프레임워크의 OAuth 인증을 무력화하는 오픈 리다이렉터 - CVE-2019-3778 | https://netmarble.engineering/open-redirector-cve-2019-3778/ | 인증/OAuth (#1 공고의 OAuth·IdP 우대와 연결) |
| OWASP Top 10 - 2021 톺아보기(1/2) | https://netmarble.engineering/owasp-top-10-2021-1/ | 웹 보안 |
| WAS 태그(로그 레벨·포맷·디렉터리 권한 등) | https://netmarble.engineering/tag/was/ | WAS 운영 |
| 탈 자바 8과 스프링부트 3.0을 위한 NIO HttpClient를 찾아서 (2023-03-22) | https://netmarble.engineering/java-nio-httpclient-test/ | [본문확인] Java 17/Spring Boot 3.0 전환 준비 중 HttpClient 후보를 비교한 글. 앞선 "spring 태그 발췌" 추정이 맞았고 제목·URL도 확정(2-1절 다) |

그 외 공식 페이지:
- 직무소개(서버, 게임플랫폼, 플랫폼 및 서비스개발, 데이터 엔지니어, 인프라/보안): https://company.netmarble.com/careers [요약]
- 결론: 넷마블 블로그에서 **결제, 쿠폰, 우편함, 랭킹, 이벤트, 운영툴, GM툴**을 직접 다룬 글은 이번 조사에서 찾지 못했다. NDC·if(kakao) 등에서 넷마블이 이들 주제로 발표한 자료도 찾지 못했다(검색 결과 0건). 존재하지 않는다는 뜻은 아니다.

## 2-1. 넷마블 기술블로그 (아카이브로 본문 확인)

출처: 각 글의 원 URL (웹 아카이브로 본문 확인, 2026-10-22; 블로그는 현재 서비스 종료). 4건 모두 본문 끝까지 읽었다. 확인 수준은 전부 [본문확인]이다. 글 안에 지시문처럼 보이는 문장은 없었다.
한계: 두 JDBC 글의 산정 공식은 아카이브 본문에서 "katex is not defined"로 깨져 있어 **공식 자체는 읽지 못했다.** 값과 근거 문장만 확인했고, 값이 공식에서 어떻게 계산되는지는 재구성하지 않았다. 도표·차트(성능 비교, 실행 시간)는 이미지라 본문 텍스트에 수치가 없다.

### 가. 게임 서버 시스템을 위한 JDBC와 Timeout 이해하기 (2022-11-03, 박정욱, TPM실 기술분석팀)
- 원 URL: https://netmarble.engineering/jdbc-timeout-for-game-server/
- 문제 제기: HikariCP 권장 설정 자료는 대부분 "WAS + DB" 시스템 최적화용이라 **게임 서버용 권장 설정은 전무**하다. 이 글은 권장값을 도출하기 위한 이해 편이다.
- 구조: DataAccess 계층(Repository/DAO, MyBatis 같은 SQL Mapper 또는 Hibernate 같은 ORM) -> JDBC 구현 계층(Driver + DataSource). HikariCP는 풀만 관리하고 물리 연결은 Driver가 맡는다.
- 소켓 타임아웃 두 종류: Connection Timeout(연결 맺는 시간 임계), Socket Timeout(연결 후 개별 패킷 임계). Java 소켓은 Write Timeout이 없어 Socket Timeout은 사실상 **Read Timeout**이다.
- TCP 재전송 근거(타임아웃 하한을 정하는 논리):
  - 재전송 시 RTO가 매번 2배. RTT 측정 전에는 initialRTO(Linux·Windows 1000ms, 구버전 3000ms), 측정 후에는 max(estimatedRTO, minRTO)(Linux 200ms, Windows 300ms).
  - 3-way handshake 중 SYN 또는 SYN+ACK가 유실되면 initialRTO가 적용되므로 **Connection Timeout은 1초보다 커야** 재전송 기회가 생긴다. 마지막 ACK 유실은 재전송이 일어나지 않는다.
  - DATA 패킷 유실은 minRTO 기준이라 Socket Timeout은 200ms보다 커야 하고, Read Timeout은 **서버 Processing Time + minRTO 보다 커야** 한다(JDBC Driver 대부분이 동기 소켓 기반).
- Statement Timeout과 Socket Timeout의 역할 분리(핵심 판단 근거):
  - Socket Timeout: 연결 구간의 네트워크 장애 감지용. Statement Timeout: SQL 한 문장의 실행 시간 제한용.
  - Statement Timeout만 3초로 두고 Socket Timeout이 0(기본값)이면 네트워크 장애를 전혀 감지하지 못할 수 있다.
  - 반대로 Socket Timeout을 쿼리 제한 용도로 짧게 두면 쿼리 취소와 롤백이 "연결이 끊겨서" 일어난다. 정상 절차가 아니며 재연결과 Statement 레벨 롤백이 한 번 더 도는 부작용이 있다.
  - **결론: Statement Timeout을 설정하면 Socket Timeout도 반드시 설정하고, Socket Timeout > Statement Timeout.**

### 나. 게임 서버 시스템을 위한 HikariCP 옵션 및 권장 설정 (2022-11-09, 박정욱)
- 원 URL: https://netmarble.engineering/hikaricp-options-optimization-for-game-server/
- 전제: HikariCP는 튜닝 없이도 대부분 충분하다. 다만 WAS용 권장 설정을 게임 서버에 그대로 쓰면 순간 응답 저하나 예상 밖 장애가 난다. **게임 서버는 추구하는 바가 WAS와 다르기 때문**이다. 권장값은 "권장일 뿐 절대적이지 않으며, 게임 장르·상황에 맞춰 튜닝하고 참고 정도로 써도 무방"하다고 글이 직접 밝힌다.

**권장 설정 요약표(원문 표 그대로)**

| 옵션 | 권장값 | 판단 근거(본문) |
|------|--------|------|
| autoCommit | true(명시 설정 권장) | DBMS 트랜잭션 모드와 일치. 다만 대다수 로직이 복합 SQL이면 false도 가능하고, 핵심은 `setAutoCommit()` 호출 횟수 최소화(드라이버가 매번 SET autocommit 쿼리를 DB로 보냄) |
| maximumPoolSize = minimumIdle | 동일값(풀 고정) | 유휴 연결이 부족해 새 연결을 맺는 시간만큼 응답 지연이 생기면 유저 경험이 나빠진다. 게임 서버는 "항상 busy"로 간주 |
| 풀 크기 산정 | 성능 테스트로 결정. 시작은 CPU 코어 수 | 게임 서버는 한 스레드가 커넥션을 중첩 획득하는 일이 드물어 Pool-locking을 가정하지 않고 DB 리소스·DB당 서버 수로 산정. 테스트 기준 DB CPU 60%. IdleConnections 크면 축소, PendingConnections 크면 증가, DB 사용률이 임계 초과면 축소 또는 서버 수 축소 |
| connectionTestQuery | null(기본) | JDBC 4.0 드라이버는 `isValid()`로 더 가볍게 검사 |
| validationTimeout | 500ms | criticalRTT 200ms(지구 반대편 왕복 이론치)와 minRTO 200ms를 고려 |
| connectionTimeout | 2000ms | 풀에서 커넥션을 얻는 대기 시간(물리 연결 시간이 아님). validationTimeout과 Statement Timeout을 고려, 재시도 1회 포함. 초과 시 SQLTransientConnectionException |
| maxLifetime | 0 (무한) | 항상 활성 시스템 |
| idleTimeout | 0 | 항상 활성 시스템 |
| keepaliveTime | 30000ms(최솟값, HikariCP 4.0+) | DB의 유휴 연결 강제 종료 방지 |
| JDBC Statement Timeout | 1000ms | 슬로 쿼리 임계 200~1000ms(장르별), 평균 500ms를 기준으로 삼음. 반드시 설정 |
| JDBC Connection Timeout | 3000ms (HostName 사용 시 13000ms) | criticalRTT, initialRTO, Fast Failover 고려. handshake 재전송 1회 포함. 호스트명이면 DNS 조회 시간을 더함 |
| JDBC Read Timeout | 10000ms | 허용 쿼리 임계 시간 기준. 장시간 배치가 없으면 10초 이내를 기본으로. 배치가 3초 걸리는데 2초로 두면 배치가 중간에 끊긴다 |
| transactionIsolation | DBA와 상의 | - |

- 드라이버별 속성명(본문 표): MySQL Connector/J는 `connectionTimeout`/`socketTimeout`, SQL Server는 `loginTimeout`/`socketTimeout`, PostgreSQL은 `connectTimeout`/`socketTimeout`, Oracle은 `oracle.net.CONNECT_TIMEOUT`/`oracle.jdbc.ReadTimeout`.
- 주의 1: **MySQL의 DataSource 구현체는 Network Timeout(Connection/Socket)이 정상 설정되지 않으므로 MySQL이면 `jdbcUrl`을 써야 한다.** `dataSourceClassName`과 `jdbcUrl`을 둘 다 주면 `dataSourceClassName`이 적용된다.
- 주의 2: `driverClassName`은 `jdbcUrl`과 함께 항상 명시 권장(오래된 드라이버 대응).

**WAS와 게임 서버의 차이(본문이 직접 드는 것)**
| 항목 | WAS 쪽 일반 권장 | 게임 서버 권장 |
|------|------|------|
| 유휴 연결 | minimumIdle로 줄여 자원 절약 | 줄이지 않음. max = min, 풀 고정 |
| 연결 수명 | maxLifetime/idleTimeout로 순환 | 0(무한), keepalive 30초 |
| 풀 크기 근거 | 스레드 수와 Pool-locking 방지 공식(우아한형제들 글 인용) | 중첩 획득이 드물다고 보고 DB 자원·성능 테스트 |
| 지연의 파급 | - | 서버끼리 유기적으로 연결돼 한 서버의 응답 지연이 다른 서버로 전파되므로 Statement Timeout 필수 |

**타임아웃 계층 정리(두 글 종합)**
| 계층 | 값 | 무엇을 막는가 |
|------|-----|------|
| 풀 대기(connectionTimeout) | 2000ms | 풀 고갈 시 스레드 무한 대기 |
| 헬스 체크(validationTimeout) | 500ms | 죽은 연결을 반환 |
| TCP 연결(JDBC Connection Timeout) | 3000ms(호스트명 13000ms) | 연결 맺기 실패·SYN 유실 |
| 문장(Statement Timeout) | 1000ms | 슬로 쿼리, 정상 취소 경로 |
| 소켓 읽기(Read/Socket Timeout) | 10000ms | 네트워크 장애 감지. 항상 Statement보다 길게 |
- **트랜잭션 단위 타임아웃은 이 두 글에서 다루지 않았다**(Spring `@Transactional(timeout)` 등 언급 없음). autoCommit과 명시적 트랜잭션의 `setAutoCommit(false)` 설명만 있다. 이 계층은 이 글들로 확인되지 않는다.

### 다. 탈 자바 8과 스프링부트 3.0을 위한 NIO HttpClient를 찾아서 (2023-03-22, 최승관, 플랫폼개발실 플랫폼개발2팀)
- 원 URL: https://netmarble.engineering/java-nio-httpclient-test/
- 배경: Spring 6.0/Boot 3.0이 Java 17을 최소로 요구해 Java 17 업그레이드를 준비하며, Java 11에 정식 추가된 HttpClient(JEP 110)의 영향을 살폈다. JEP 110의 성능 목표(HttpURLConnection, Apache, Netty, Jetty와 동등한 성능·메모리)도 인용한다.
- 테스트: OpenJDK 17 + Spring Boot 3.0.2, 동일 장비·옵션. Mock 서버(약 8ms 응답)에 1만 건 일괄 요청을 일정 간격으로 100회, 매 시도 전체 응답 완료 시간을 측정(동기식 논블로킹). 측정 항목은 CPU, 메모리, 처리 속도.
- 후보와 설정(본문):
| 후보 | 주요 설정 | 본문이 든 특징 |
|------|------|------|
| OpenJDK HttpClient (17) | thread 3, connectionTimeout 1000ms, httpRequestTimeout 2000ms | 별도 의존성 불필요, header/querystring 개발 효율 낮음, **retry 없음(직접 구현)** |
| Unirest 3.14.1 (Apache 4.5.x 기반) | max total 40, max per route 40, connectionTimeout 1000ms, socketTimeout 60s(기본) | 개발 쉬움, JSON 변환 기본, route 단위 동시성, keepalive 옵션 별도 없음 |
| Apache HttpComponents client5 5.1.4 | IoThreadCount 3, SoTimeout 60s, max total/per route 40 | 기능·설정 풍부, keepalive 커스터마이징, **IoThreadCount를 늘려도 효과 없고 max per route를 늘려야 함** |
| Netty + WebClient (webflux 6.0.5, reactor-netty 1.0.21) | connectionTimeout 1000ms, responseTimeout 2000ms, read/write 60s, keepalive true | Micrometer 연동 |
| Jetty 12 + WebClient | connectionTimeout 1000ms, MaxConnectionsPerDestination 40 | 요청 큐 크기·DNS 타임아웃·요청별 타임아웃 설정 가능 |
- 결과(본문 서술, 수치는 대부분 차트라 텍스트로만 확인):
  - WebClient 오버헤드: Apache vs Apache+WebClient는 CPU 둘 다 약 40%, 메모리는 오히려 Apache 최대 사용량이 더 큼, 처리시간은 Apache가 200ms 정도 빠르다고 서술. 다만 같은 라이브러리인데 동작 방식이 달라 OpenJDK로 재검증했고 **OpenJDK vs OpenJDK+WebClient는 CPU·메모리·처리시간이 거의 동일 -> WebClient는 성능에 거의 영향 없음**으로 결론.
  - Netty: Apache보다 처리시간 약 100ms 느리고 CPU 약 60%. Jetty: CPU 높은 편, 속도는 OpenJDK와 비슷하거나 조금 빠름. Unirest: CPU 높은 편, 처리시간은 Jetty와 유사.
  - 종합: 블로킹과 논블로킹 차이만큼 의미 있는 성능 차이는 없고 서로 미세한 차이. 사용 목적·환경에 맞게 고르면 된다.
- 선택 기준(본문 결론): 빠른 처리가 중요하면 CPU가 낮았던 **Apache HttpComponents client5**. 모듈 형태로 배포해 라이브러리 충돌을 피해야 하면 **OpenJDK HttpClient**. Spring 환경이면 **WebClient + Apache 또는 WebClient + OpenJDK**(리소스 절약과 유지보수 편의).
- 기타: Spring Cloud OpenFeign은 생산성은 돋보이나 당시 블로킹 IO만 지원하고 성능이 많이 낮아 비교 대상에서 제외(NIO 준비 중이라고 언급). HTTPS, 파일 업로드, 요청·응답 크기 등 조건이 다르면 결과가 달라질 수 있다고 본인이 단서를 단다.
- 한계: 이 글은 HttpClient 타임아웃의 권장 기준값을 제시하지 않는다. 비교용 설정만 나온다(연결 1초, 응답 2초 등은 이 테스트 설정이지 권장값이 아니다).

### 라. 실행 시간 효율을 위한 클래스 데이터 공유(CDS)와 Layered Jar (2024-02-21, 이동근, QA실 QA시스템팀)
- 원 URL: https://netmarble.engineering/class-data-sharing-cds-and-layered-jar/
- 주제는 DB·HTTP 설정이 아니라 **JVM 기동 시간**이다. 크래시리포트(QA 시스템) 백엔드를 Spring Boot로 개발한 경험이다.
- 기동 시간 단축 3가지: GraalVM Native Image(효과 크지만 제약 많음, **MyBatis 앱은 네이티브 이미지화가 특히 어려워 대대적 코드 수정 필요**), Project CRaC(Linux 전용, Spring Boot 3.2부터 지원, 저자는 시도하다 중단), Project Leyden(정적 이미지, 정식 공개 전).
- 적용: Application CDS(OpenJDK 12+, Spring Framework 6.1.3에서 정식 지원) + Layered Jar(Spring Boot 2.3+). 환경은 JDK 21, Spring Boot 3.2.2, MyBatis(본문 표기 3.0.3), MariaDB 드라이버. `-XX:ArchiveClassesAtExit`로 `application.jsa` 생성, `-XX:SharedArchiveFile`로 실행. 클래스 18,034개 중 81.25%가 캐시에서 로딩.
- 결과: 기동 시간 **83초 -> 56초(약 30% 단축)**. GraalVM보다 개선율은 낮지만 적은 노력으로 가능하며, 오토스케일링이 잦고 네이티브 이미지를 못 쓰는 환경에서 고려할 만하다.
- 이 글은 "넷마블의 일부 팀(QA실)이 MyBatis + Spring Boot 3 + MariaDB를 쓴다"는 정황 근거다. 퍼블리싱 플랫폼 팀의 영속 계층을 뜻하지는 않는다(1절 공고 분석의 MyBatis 0건과 따로 본다).

### 이 글들로 확인된 것과 확인되지 않은 것
- 확인됨: HikariCP·JDBC 글이 "WAS용 권장을 게임 서버에 그대로 쓰면 안 된다"는 문제를 다룬다는 것(기존 [스니펫] 추정), 구체 권장값 전부, Java 17/Spring Boot 3 전환 시 HttpClient 글의 제목·URL.
- 확인 안 됨: 산정 공식 원문, 트랜잭션 타임아웃, HttpClient 성능의 정확한 수치(차트), 이 설정들을 넷마블 어느 서비스가 실제로 쓰는지.

## 3. 게임 플랫폼/운영 백엔드 기능별 공개 근거와 요구 역량

넷마블 자료가 없는 항목은 타사·공식 문서를 썼다. 각 항목의 "확인 수준"에 주의.

### 3.1 인앱결제 영수증 검증
- 근거(공식, 원문 인용 확인): Google Play Billing 문서 https://developer.android.com/google/play/billing/integrate 와 https://developer.android.com/google/play/billing/security
  - 구매는 서버로 보내 검증 후 권한 부여. `Purchases.products:get` / `subscriptionsv2:get`로 확인하고 **PURCHASED일 때만 지급, PENDING은 별도 처리.**
  - **purchaseToken을 전 구매에 대해 기록하고 PK로 사용해 중복 확인. orderId는 모든 구매에 생성되지 않으므로 중복 판정 키로 쓰지 말 것.**
  - 지급 후 즉시 acknowledge, 3일 내 미처리 시 자동 환불. 소모성 상품은 `Purchases.products:consume`.
  - "consume 요청은 간혹 실패하므로 purchase token 사용 여부를 백엔드에서 확인해 여러 번 지급하지 않게 하라."
  - 검증 실패/부정 구매는 acknowledge·consume 하지 말고 즉시 revoke+refund. `obfuscatedAccountId`를 백엔드에서 대조.
- 근거(Apple): App Store Server API 문서 https://developer.apple.com/documentation/appstoreserverapi (공식 JSON으로 `GET /inApps/v2/history/{anyTransactionId}`, 1회 최대 20건·revision 토큰 페이징 확인). 그 외 엔드포인트 표(Get Transaction Info, Notification History, Consumption Information 등)는 읽기 도구가 기억에서 정리한 것이라 **[추측/미검증]**.
- 타임아웃·재시도 정책 자체를 다룬 국내 게임사 공개 글은 찾지 못함. 이 부분은 공식 문서 + 일반 원칙으로 가르쳐야 한다.
- 요구 역량: 외부 API 장애 시 타임아웃/재시도, 멱등 키(purchaseToken/transactionId) 유니크 제약, 지급-확인 2단계의 상태 머신, 대사(정산) 배치. #2 공고의 "PG 연동, 결제 운영 툴"과 직결.

### 3.2 쿠폰 발급·사용
- 근거(공식 문서, 확인): NHN Cloud Gamebase 쿠폰 https://docs.nhncloud.com/ko/Game/Gamebase/ko/oper-coupon/
  - 시리얼형(임의 번호)·키워드형, 1회 발급 요청 최대 100만 개, 유저당 사용 수 제한(최대 99, 0은 무제한), 사용 기간, 코드/유저ID/쿠폰명별 사용 이력 조회.
  - 코드 단위 "1회 사용" 설명은 페이지에 없음.
- 동시성 설계 참고는 게임사 자료를 못 찾아 개인/커뮤니티 자료만 [스니펫]: 조건부 UPDATE, (event_id, member_id) unique 제약 등. 근거로 쓰기엔 약하다.
- 요구 역량: 원자적 상태 전이(`UPDATE ... WHERE used=0`), unique 제약, 무차별 대입 방어, 대량 코드 생성 배치. #2의 "구독·쿠폰 결제 시스템"과 연결.

### 3.3 우편함/보상 지급 (멱등, 대량)
- 게임사 공개 글은 못 찾음. 가장 가까운 공개 근거: 카카오페이 기술블로그 https://tech.kakaopay.com/post/troubleshooting-logs-as-a-junior-developer/ [요약 확인] (게임 아님, 리워드 지급).
  - 빠른 연타로 중복 지급 -> Redis SETNX 락(키 `quizId:userId:earnReward`, TTL 3초), 락 실패 시 빠르게 실패.
  - **지급 이력을 먼저 조회해 이미 있으면 외부 호출 없이 같은 응답 반환(멱등)**, 외부 호출 실패 시 실패 이력 저장.
- 요구 역량: 지급 이력 테이블, 멱등 키, 부분 실패 재처리, 대량 지급 배치(청크, 재시작 가능).

### 3.4 이벤트 기간·출석
- 게임사 공개 글 미확보. 공지/커뮤니티 수준에서 "서버 기준 자정 리셋, 게임별 리셋 시각 상이(예: UTC+0 자정=한국 09시)"가 확인됨 [스니펫, 신뢰도 낮음]. 데브시스터즈 런칭 회고(아래 3.7)도 "자정 컨텐츠 리셋 시점에 평소 2~3배 피크"를 언급.
- 요구 역량: 타임존/기준 시각 설정화, 하루 1회 보상의 중복 요청 방지, 기간 경계 테스트. #2의 "웹 이벤트 페이지 개발"과 연결.

### 3.5 랭킹
- 근거(공식 튜토리얼, 확인): Redis 리더보드 https://redis.io/tutorials/howtos/leaderboard/ . ZADD/ZINCRBY/ZREVRANGE/ZREVRANK, 삽입·갱신 O(log N), 범위 조회 O(log N + M).
- 동점 처리(점수 소수부에 시간 인코딩 등), 일/주/시즌 키 분리는 일반 자료 [스니펫]. 국내 게임사 랭킹 구현 글은 못 찾음.
- 요구 역량: 정렬/집계 설계, 캐시 TTL, Redis 유실 시 DB 재구축 전략. #1·#5 공고의 Redis/Aerospike 요구와 연결.

### 3.6 운영툴 (권한, 감사 로그, 대량 지급, 공지·점검)
- 근거(국내, 2016): 넥슨 NDC16 운영툴 발표 기사 http://www.hungryapp.co.kr/news/news_view.php?bcode=news&pid=44713&catecode=010 [요약 확인] 통합 운영툴에 유저관리·권한관리·사용 이력·로그 대량 처리, 대량 아이템 등록 유저 전송, 문제 시 로그로 추적. 공지/점검 내용은 기사에 없음. 엑셀 업로드·감사 로그 설계 세부 없음.
- 보조: PlayFab Game Manager는 "게임 관리자 내 모든 작업이 감사 로그에 기록"된다고 설명 https://learn.microsoft.com/ko-kr/xbox/playfab/live-service-management/gamemanager/reference [스니펫].
- 점검: NHN Cloud Gamebase는 점검 중에도 테스트 단말기는 접근 가능하게 하는 설정을 제공 https://docs.nhncloud.com/ko/Game/Gamebase/ko/oper-app/ [요약, 문서 뒤 20% 미열람]. 점검·공지 기능 자체의 설명은 확인 못함.
- 요구 역량: RBAC, 모든 변경의 감사 로그(누가/언제/무엇을), 엑셀 업로드 검증과 승인 워크플로, 대량 처리 멱등. #2(결제 운영 툴), #9(운영도구)와 연결.

### 3.7 점검/트래픽 몰림/커넥션 풀
- 근거(국내 게임사, 확인): 데브시스터즈 쿠키런: 킹덤
  - 런칭 회고 https://tech.devsisters.com/posts/cookierun-kingdom-launch-revisited/ [요약]: 목표 동시접속에 2~3배 버퍼, 부하 테스트 79회, 런칭 후 스토리지 증가 추세 계산, 서비스 공방전(장애 훈련)을 못 한 아쉬움.
  - 장애 복원기 https://tech.devsisters.com/posts/crk-launch-storage-postmortem/ [요약]: CockroachDB 노드 손상으로 약 30시간 50분 점검, **재오픈 직후 대기 유저의 로그인 폭주로 플랫폼(DevPlay) DB 장애, 자정 트래픽으로 2차 점검(총 약 36.5시간)**, "프로덕션 인프라 작업은 2인 이상" 교훈.
- 넷마블: 기술 블로그의 HikariCP/JDBC Timeout 글 2건 [본문확인](2-1절 가, 나). 게임 서버 권장값(풀 고정, validation 500ms, connection 2000ms, statement 1000ms, read 10000ms)과 그 근거를 확인.
- 요구 역량: 커넥션 풀 크기·타임아웃 설정, 점검 후 재접속 폭주 대비(대기열/레이트 리밋), 부하 테스트, 장애 대응·회고. #1의 "대용량 트래픽" 우대와 연결.

### 3.8 제재/어뷰징 탐지
- 근거(국내 게임사, 확인): 카카오게임즈 KARS https://www.kakaocorp.com/page/detail/11819 [요약]
  - 여러 게임의 실시간 로그를 Kafka로 수집해 데이터 레이크에 적재, 운영자 작성 SQL을 주기 실행해 탐지, 결과가 사내 시스템과 연동돼 알림·제재 자동 실행. 유형: 부정 이용, 매크로·봇, 테러, 계정 도용. 2025년 누적 제재 약 75만 건.
- 요구 역량: 로그 스키마 설계, 탐지 결과 -> 제재 처리 파이프라인, 오탐 시 되돌리기와 이력 관리. 넷마블은 직무소개에 데이터 엔지니어(대량 게임 데이터 수집·전달)를 두고 있음.

## 4. 넷마블 투입용 백엔드 온보딩에 반드시 넣을 것

시나리오는 "게시판" 또는 "게임 운영(점검·보상)" 도메인으로 겪게 하는 방법이다. 근거 번호는 1절 공고 번호, 3.x는 위 절.

| # | 항목 | 왜 필요한가(근거) | 게시판/게임 운영 시나리오로 겪게 할 방법 |
|---|------|------|------|
| 1 | Spring Boot + Spring Framework 기본기와 계층 설계 | 거의 전 공고의 공통 자격. #1,#2,#3,#4,#5,#7 | 게시판 CRUD를 만들고 공통 예외·응답 포맷·모듈 분리를 "공통화/모듈화" 기준으로 리뷰 |
| 2 | MySQL(+MSSQL) 설계·인덱스·트랜잭션, JPA와 MyBatis 둘 다 읽고 쓰기 | RDB 요구 전 공고, 영속 계층 선호는 공고상 미정(MyBatis 0건, JPA 1건). 3.1~3.3 | 같은 게시판 조회를 JPA와 MyBatis로 각각 구현해 N+1, 페이징, 실행 계획 비교. 사내 실제 코드베이스는 확인 후 비중 조정 |
| 3 | 동시성: 조건부 UPDATE, unique 제약, 락 | 쿠폰/결제/지급의 핵심. #2, 3.2, 3.3 | "선착순 100명 이벤트 쿠폰"을 락 없이 만들어 300명 동시 요청으로 초과 발급을 재현하고 고치기 |
| 4 | 멱등성과 지급 이력 테이블 | 중복 지급 방지(3.1, 3.3 카카오페이 사례) | 우편함 보상 수령 API를 연타/재시도해도 1회만 지급, 실패 이력 남기고 재처리 |
| 5 | 외부 API 연동: 타임아웃·재시도·서킷 | 결제 PG·스토어 API 연동(#2, 3.1) | 모의 스토어 서버가 지연/5xx를 내도록 하고 영수증 검증 API를 구현. PENDING/중복 purchaseToken 처리까지. **[본문확인 보강]** 넷마블 NIO HttpClient 글(2-1절 다): 후보는 OpenJDK, Apache client5, WebClient 조합 등이고 성능 차이는 미세, 선택은 용도별(속도=Apache, 모듈 배포=OpenJDK, Spring=WebClient+Apache/OpenJDK). OpenJDK HttpClient는 retry가 없어 직접 구현해야 하고 Apache는 max per route가 병목 손잡이. 게시판 서버 시나리오: 모의 스토어 서버 호출 클라이언트를 WebClient+OpenJDK와 Apache client5로 각각 구현해 연결 1s/응답 2s 타임아웃과 직접 만든 재시도를 붙이고, 지연·5xx 주입 시 동작과 per-route 한도 고갈을 비교 |
| 6 | 인증/인가: OAuth, Spring Security, 권한 | 글로벌 인증 서비스(#1), 넷마블 블로그의 Spring Security·OAuth CVE 글(2절) | 게시판에 로그인·소셜 로그인·관리자 권한 추가, URL 패턴 우회 케이스(슬래시)를 직접 공격/방어 |
| 7 | Redis: 캐시, 분산 락, 랭킹(Sorted Set) | Redis 요구(#1,#5), 3.5 | 게시판 인기글/게임 주간 랭킹을 Sorted Set으로, 동점 처리와 TTL, Redis 유실 시 DB 재구축 |
| 8 | 운영툴: RBAC, 감사 로그, 엑셀 대량 지급 | 결제 운영 툴(#2), 운영도구(#9), 3.6 | 어드민에서 공지 수정과 엑셀로 1만 명 우편 지급. 모든 작업을 감사 로그로, 승인 단계와 부분 실패 리포트 포함 |
| 9 | 대량 배치와 재시작 가능한 지급 | 이벤트 보상·대량 지급(3.3, 3.6) | 1만~10만 건 일괄 보상 배치를 청크 처리하고 중간에 죽여도 이어서 실행, 중복 없음 확인 |
| 10 | 커넥션 풀/타임아웃/부하 테스트 | 대용량 트래픽 우대(#1), 넷마블 HikariCP·Timeout 글(2절), 쿠키런 점검 후 폭주(3.7) | 점검 종료 직후 로그인 폭주를 부하 테스트로 재현, 풀 고갈과 데드락을 보고 설정 조정. **[본문확인 보강]** 넷마블 HikariCP 글(2-1절 나): 게임 서버는 풀 고정(max=min), maxLifetime·idleTimeout 0, keepalive 30s, 풀 시작값 CPU 코어 수, DB CPU 60% 기준으로 Idle/Pending 지표를 보며 조정. 단 이는 "항상 busy"인 게임 서버 가정이며 WAS와 다르다고 글이 스스로 구분한다. 게시판 서버 시나리오: 게시판은 WAS형에 가까우니 기본값 풀과 고정 풀을 둘 다 두고, 점검 직후 폭주 부하 테스트에서 Pending/Idle 지표와 DB CPU로 어느 쪽이 맞는지 직접 판단(글의 값은 출발점일 뿐 절대값이 아님) |
| 11 | Linux WAS(Tomcat/nginx) 운영, Docker, Kubernetes 기본 | Linux WAS 운영 명시(#2,#4,#5), 컨테이너 요구(#1,#3,#4) | 게시판을 Tomcat/nginx 뒤에 배포하고 컨테이너화, 무중단 배포와 로그 위치 확인 |
| 12 | 로그 설계와 수집(로그 레벨·포맷·중복 제거) | 로그는 플랫폼 핵심 서비스(직무소개), 넷마블 데이터 파이프라인·WAS 로그 글(2절), KARS(3.8) | 구조화 로그 + logkey 중복 제거를 넣고, "비정상 반복 수령" 탐지 쿼리와 제재 처리 작성 |
| 13 | 테스트·CI/CD·Git 워크플로 | JUnit, GitFlow, Jenkins, 컨테이너 CI/CD(#4, #7) | 동시성·멱등 시나리오를 JUnit 통합 테스트로 고정하고 파이프라인에서 실행 |
| 14 | 장애 대응·회고 습관 | 쿠키런 장애 회고(3.7)의 2인 작업 원칙, 공방전 훈련 | 점검 중 의도적 장애(DB 지연)를 주입해 대응 후 blameless 회고 작성 |
| 15 | JDBC 타임아웃 계층(커넥션·소켓·쿼리)의 정합성 | 넷마블 JDBC Timeout·HikariCP 글(2-1절 가, 나) [본문확인]: Connection Timeout > initialRTO 1s, Socket(Read) Timeout > Statement Timeout, Statement Timeout 미설정+Socket 0이면 장애 미감지. 권장값 validation 500ms / pool 대기 2000ms / connect 3000ms / statement 1000ms / read 10000ms (게임 서버 기준, 참고값). 트랜잭션 타임아웃은 글에 없음 | 게시판 서버(MySQL)에서 jdbcUrl에 connectTimeout/socketTimeout을 주고 `Statement.setQueryTimeout` 또는 Spring 쿼리 타임아웃을 설정. (1) `SELECT SLEEP(3)`으로 statement 1s 초과 시 정상 취소되는지, (2) socketTimeout을 statement보다 짧게 두면 연결이 끊기며 취소되는 부작용, (3) 방화벽으로 패킷을 막아 socketTimeout 감지 확인. 트랜잭션 단위 타임아웃은 Spring `@Transactional(timeout)`으로 별도 실습(근거는 이 글이 아니라 Spring 문서) |

참고: 3~6년차이므로 1·2번은 읽고 비교하는 수준으로 압축하고 3~10번에 시간을 배분하는 것이 공고 요구와 맞는다([추측]: 학습자 수준 기준).

## 확인 불가

- **현재 모집 중인 공고**: 대부분 "마감된 공고"와 "상시채용"이 모순 표기. 지금 열려 있는지 판단 불가. 넷마블 공식 채용 사이트(career.netmarble.com)의 개별 공고(예: anno_id=1131) 본문은 JS 렌더링이라 읽히지 않았다.
- **자회사(넷마블엔투·넥서스·몬스터·네오) 경력 Java/Spring 백엔드 공고 원문**: 확인 못함. 검색에서 보인 것은 넷마블네오 채용전환형 인턴(서버)과 넷마블몬스터 신입 서버 프로그래머(C++/Java, 약 2022, SNU 게시판 https://cse.snu.ac.kr/ko/community/notice/20812)이며, 후자는 본문을 열지 못해 목록에 넣지 않았다. 사람인·잡코리아의 현재 공고도 직접 열지 못함.
- **C#/C++/Node 백엔드 공고**: 넷마블 본사 백엔드 공고에서는 확인 못함(에이전트 개발자의 C/C++만 있음).
- **Wanted 공고 문장은 요약본**: 원문 대조 안 됨. #1 우대사항은 3자 미러에만 있음.
- **넷마블 기술 블로그**: 블로그는 현재 서비스 종료 상태다. 직접 접근은 불가하고 웹 아카이브로 4건만 본문을 확인했다(2-1절). 해결된 것: HikariCP·JDBC Timeout 권장값과 근거, Java 17/Spring Boot 3 HttpClient 글의 제목·URL. 여전히 불가: 위 4건 외 글(데이터 파이프라인, 옵저버빌리티, CVE 2건, OWASP, WAS 태그 글)은 [스니펫] 수준 그대로이고, 두 JDBC 글의 산정 공식은 아카이브에서 깨져(katex) 읽지 못했으며, HttpClient 글의 성능 수치는 차트 이미지라 텍스트로 확보하지 못했다. 트랜잭션 타임아웃은 4건 어디에도 없다. 이 권장값을 넷마블의 어떤 서비스가 실제로 쓰는지, 웹 아카이브 본문이 원본과 동일한지(수정본 여부)도 확인 불가.
- **넷마블의 결제/쿠폰/우편함/랭킹/이벤트/운영툴 구조 공개 자료, NDC·if(kakao) 넷마블 발표**: 찾지 못함. 인터뷰도 못 찾음.
- **국내 게임사의 영수증 검증 재시도·타임아웃, 쿠폰 동시성, 우편함 대량 지급, 랭킹 구현 공개 글**: 못 찾음. 3.1~3.5의 근거는 공식 문서와 비게임 사례(카카오페이)로 대체했다.
- **App Store Server API 엔드포인트 전체 표**: 공식 JSON으로는 transaction history만 검증. 나머지는 미검증.
- **넥슨 운영툴 발표(2016)** 는 오래된 기사 요약이며 공지·점검·엑셀 업로드 세부는 없음.
- **MyBatis/JPA 실사용 비중**: 공고 근거로는 판단 불가. 입사 후 코드베이스 확인 필요.
