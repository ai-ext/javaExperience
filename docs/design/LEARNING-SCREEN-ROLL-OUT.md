# javaExperience 학습 화면 재구성 기준과 전수 대기열

2026-10-16 현재. 이 문서는 구현 완료 선언이 아니라 [의미 장면별 대기열](semantic-screen-queue.jsonl)의 작업 기준이다.

## 첫 화면의 약속

시나리오를 열면 먼저 사용자의 상황을 한 문장으로 읽는다. 그다음 **무엇을 만들지**와 **어떤 요청을 보낼지**만 본다. 에이전트 프롬프트가 필요한 단계라면 그 용도를 이 흐름에 추가한다. 응답·DB 행·채점·오류 실험은 만들기, 요청 실행, DB 관찰 화면에서 각각 보여 준다. 한 장면의 글씨를 줄이거나 토글을 겹쳐 더 담는 대신 장면을 늘린다.

개념은 한 화면에 한 질문으로 시작한다. JPA의 표준/구현/Repository 구분, 영속성 컨텍스트의 관리 객체와 스냅샷, flush와 commit, MyBatis의 메서드/XML 연결과 값 바인딩은 각각 독립 장면이다. 값이 언제 달라지는지 조작하게 하며 설명용 상태와 실제 실행을 구별한다. 깊은 원문·코드·버전 정보는 보존하되 처음 볼 장면을 가리지 않는다. 공부자료는 제목과 소제목 검색으로 찾아간다.

참고한 [서버 모니터링 분석 가이드](https://kciter.so/posts/server-monitoring-analysis-guide/)의 시각 요소는 시간과 조건이 바뀔 때 그래프의 의미를 드러낸다. 이 원칙을 객체→스냅샷→SQL→행, 요청→응답, commit/rollback 분기에 적용한다. 글 내용이나 모니터링 수치를 복제하지 않는다.

## 전수조사의 단위

현재 생성 HTML **339쪽**에서 시각 구성 요소 **43,741개**, 펼친 패널의 블록 **76,125개**를 조사했다. 이 둘은 중복되는 서로 다른 조사 단위이며 이미지 개수로 합산하지 않는다. 의미 장면 수는 원문을 페이지마다 분할해 확정해야 한다.

| 문서군 | 페이지 |
|---|---:|
| 시나리오 본편 | 101 |
| DB 쿼리 여정 | 14 |
| 추가 랩 | 5 |
| 공부자료 개념 | 134 |
| 짧은 레슨 | 50 |
| 실무 티켓 | 30 |
| 홈·목차·미션·오류 참고 | 5 |

현재 [시안 대조 기록](visual-parity.jsonl)은 281개 장면이고, 적어도 일부 기록이 있는 페이지는 30쪽이며 장면 범위가 아직 확정되지 않은 페이지는 309쪽이다. 전 페이지 단위로 완료 판정된 것은 **0쪽**이다. 기존 대량 DOM 항목의 `unreviewed`를 공통 템플릿 적용만으로 `verified`로 바꾸지 않는다.

## 적용한 선행 장면

- **1-1 첫 API:** 상황 → Controller/DTO 만들기 → 실제 POST 요청. 시작 화면은 상황·만들 것·보낼 것만 표시한다.
- **1-2 첫 DB 저장:** 상황 → Post 엔티티/Repository → Controller의 201·Location → 실제 POST → 응답 id로 DB 조회. id는 동적이며 기대 행을 실측으로 표시하지 않는다.
- **1-3 첫 트랜잭션:** 상황 → PostService 경계 → 태그 중복 처리 → 정상 POST → `post_tag` 연결 조회 → 태그 행 개수 → 실패 관찰 O2 → 새 태그 롤백 DB 조회. 정상/실패 요청은 기존 실행 패널을 이동해 사용하고, DB 값은 직접 조회 전 기대값으로만 표시한다.
- **1-4 엔티티·테이블 일치:** 상황 → `Post.java` 누락 컬럼 → `ddl-auto: validate`의 검출 한계 → Member 작성자 → 정상 POST → 발행 시각/행 값 DB 조회 → DEFAULT와 NULL → O1 관찰 → 7개/13개 INSERT 컬럼의 출처 비교. 현재 서버·DB 실행 결과와 원문 재현 로그를 구별한다.
- **P02 MVC:** Controller/Model/View의 역할을 한 장면에서 조작한 뒤 `/hello`의 HTML View와 별도 `/api/memos`의 JSON 응답을 본다. 기존 전체 역할 지도는 참조로 보존했다.
- **S09 JPA:** JPA/Spring Data JPA/Hibernate의 역할 → 관리 객체와 스냅샷 → flush 이후 commit/rollback 선택. 기존 상세 시뮬레이션은 보존했다.
- **W04 MyBatis:** Mapper 메서드와 XML statement 연결 → `#{}` 값 바인딩과 `${}` 문법 치환. 원문의 Java/XML 이름과 타입을 화면 텍스트로 교정했다.
- **W11·S08 트랜잭션:** Service 경계가 없는 부분 저장과 한 DB 트랜잭션의 전부 되돌림을 비교한다. 이어서 외부 호출→Spring 프록시→TransactionManager의 시작, 정상 commit, RuntimeException rollback을 한 시점씩 보여 준다.
- **공부자료 색인:** 문서 제목·소제목 검색. `영속성 컨텍스트` 검색으로 S09 이동을 확인했다.

선택 시안은 [batch7](mockups-2026-10-15-batch7/asset-index.json), [batch8](mockups-2026-10-15-batch8/asset-index.json), [batch9](mockups-2026-10-15-batch9/asset-index.json), [batch10](mockups-2026-10-15-batch10/asset-index.json), [batch11](mockups-2026-10-15-batch11/asset-index.json), [batch12](mockups-2026-10-15-batch12/asset-index.json), [batch13](mockups-2026-10-15-batch13/asset-index.json), [batch14](mockups-2026-10-15-batch14/asset-index.json), [batch15](mockups-2026-10-15-batch15/asset-index.json), [batch16](mockups-2026-10-15-batch16/asset-index.json), [batch17](mockups-2026-10-15-batch17/asset-index.json)에 있다. 화면별 데스크톱·360px 캡처는 [검수 폴더](verification-2026-10-15/)에, 원문 대조·차이·동작 한계는 시안 대조 기록에 둔다.

## 이후 페이지를 처리하는 순서

1. [의미 장면별 대기열](semantic-screen-queue.jsonl)에서 원문과 현재 HTML을 읽고, 학습자의 질문·첫 행동·관찰 결과가 바뀌는 지점마다 장면을 나눈다. 복잡한 과제는 2~5장보다 더 많아도 된다.
2. 장면별로 실제 `imagegen`을 호출한다. 고해상도 재질·타이포·정렬 품질을 유지하면서 보이는 정보만 줄인다. 이미지의 코드·필드·SQL·상태는 원문과 DB DDL/요청 계약으로 교정한다.
3. 이미지의 레이아웃과 상태 변화를 HTML/CSS/JS로 구현한다. 기존 요청 패널·코드·채점 기준을 보존하고 예상값과 실제값을 분리한다.
4. 같은 뷰포트와 360px에서 캡처하고, 화면 이동·키보드·링크·실제 요청 또는 설명용 시뮬레이션을 확인한다. 실제 학습자 서버·DB를 실행하지 않았다면 그렇게 기록한다.
5. 해당 장면의 대조 기록만 갱신한다. 해당 페이지의 나머지 장면과 펼친 패널을 확인하기 전에는 페이지 완료로 표시하지 않는다.

1-5 입력 검증은 11개 장면과 V1–V12 원문 요청, D1–D3 SQL로 정리했다. batch16 이미지 12장을 참조하되 예시 데이터가 원문과 다른 부분은 HTML에서 원문 기준으로 교정했다. 브라우저 URL 보안 정책으로 이 페이지의 실제 화면·모바일·HTTP 확인은 미완료다. 다음 구현군은 1장 나머지 API·DB 흐름, 인증의 JWT 후 세션, 쿼리/성능/동시성 실습 순서다. 새 기능의 정확한 순서는 시나리오 원문과 현재 manifest를 다시 대조한다.

## 1-6 토큰 작성자 장면

1-6은 이미 발급된 `api_token` DB 행을 조회하는 과제다. JWT 발급·서명 검증(10-4)과 이름만 비슷한 것으로 합치지 않는다. 시나리오·토큰 확인 위치·T1 정상·T2 본문 작성자 위조·T3–T7 401·T9 인증 우선순위·T8 정지 회원 403·T10/T11 공지 권한·D1/D2 DB 증거·CORS OPTIONS를 10개 장면으로 나눴다. batch17 이미지 10장을 만들고 원문 T1–T11 요청 패널을 장면 안으로 이동했다. `npm run build`, 관련 구조 검사와 감사는 통과했지만 브라우저 보안 정책 때문에 동일 뷰포트 대조·모바일·실제 HTTP 전송은 미검증이다.

## 10-4 JWT 로그인과 내 정보

JWT 로그인은 batch18의 시안 15장과 15개 장면으로 분리했다. 첫 장면은 사람의 상황·만들 것·먼저 보낼 로그인 요청만 둔다. build.gradle 의존성, application.yml 설정, 로그인 발급, 실제 L 요청, JWT 구조, M 내 정보 조회, W/U 동일 오류, K 이메일 정규화, V/V1–V4 검증, M0 필수 로그인, M1–M4 토큰 실패, P 비밀번호 경계, V5/V6 BAD_JSON, M5 수동 OPTIONS가 다음 장면이다. 실제 원문 요청 18개를 재사용한다. JWT 서명 검증과 users DB 조회를 분리하고, 1-6의 api_token 방식 및 뒤의 L15 세션과 혼동하지 않는다. 정적 빌드·구조 검사는 통과했지만 브라우저/실제 서버 확인은 미완료다.

## L15 세션 인증 비교

L15는 JWT 10-4 뒤의 선택 실습으로 batch19 12장면을 만든 뒤 HTML에 구현했다. 같은 회원의 실제 가입 id N을 준비하고, GET /csrf 익명 세션, CSRF 누락 403을 먼저 확인한 뒤 동일 쿠키·올바른 CSRF의 POST /login, changeSessionId, 새 쿠키 /me, 다른 쿠키 401, logout 204, 로그아웃 뒤 JWT와 세션 수명 차이, 재로그인 뒤 idle timeout, 쿠키의 HttpOnly/SameSite/Secure·CSRF 역할을 나눴다. 원문 curl의 쿠키 jar 방식을 복사 가능한 명령으로 유지했고 쿠키·CSRF·JWT 원문을 페이지에 입력하거나 저장하지 않게 했다. 빌드·정적 구조 검사는 통과했지만 브라우저/실제 서버 검증은 미완료다.

## L16 interface/impl와 JPA·JDBC 계약

L16은 batch20의 시안 15장과 15개 HTML 장면으로 구현했다. 시나리오→PostSummaryReader interface/DTO→JPA 공개 조건→JDBC 바인딩 SQL→조건부 빈 하나 선택→두 후보/0 후보 시작 실패 관찰→JPA와 JDBC를 한 서버씩 실행→비공개 seed 404·id≤0 400→community DB 행 관찰→두 설정의 통합 계약 테스트→가짜 Reader 단위 테스트→boardSlug 확장 순서다. 원문의 curl 명령과 SQL은 복사 가능하고 실제 결과는 빈 상태에서 시작한다. 실제 서버/DB 실행·모바일/데스크톱 시각 대조는 미완료다.

## DB-01 목록 응답에서 첫 SQL까지

DB-01은 batch21 6장 시안으로 상황→응답 필드와 테이블 연결→공개/발행/미삭제·정렬→메인 SELECT→practice seed 첫 행 대조→태그 일괄 조회로 재배치했다. 기존 4단 흐름과 SQL·전체 설명은 상세 영역에 보존한다. 현재 체크아웃에는 M1 HTTP API가 없으므로 DB 클라이언트에서 직접 SELECT로 확인하게 하며 API 실측을 주장하지 않는다. `post.id=145`, member.id=6, tag java와 카운트는 practice seed에 대조했다. DB-02 커서는 뒤 화면으로 넘긴다. 빌드·정적 사실 검사는 통과했지만 동일 뷰포트 시각 대조와 실제 DB 실행은 미완료다.

## L12 기초 파생 메서드·MyBatis SQL

L12는 [batch22](mockups-2026-10-16-batch22/asset-index.json)의 imagegen 시안 16장을 원문 Q01–Q08과 구조화된 P·A–K 요청에 대조해 16개 집중 화면으로 구현했다. 시나리오 첫 장면은 사람의 상황·만들 것·보낼 것만 보여 준다. JPA 파생 메서드의 조건과 MyBatis 매퍼/XML·공개 조건은 별도 장면이고, 공개 글 생성→같은 id의 JPA/MyBatis 조회→게시판·작성자·제목·존재·개수·페이지 조회→숨김→404 확인→복구는 각각 한 요청 화면이다. Q04는 예시의 고정 작성자 5가 아닌 실제 P 응답의 작성자 id를 쓰고, Q08은 구조화된 H 요청인 `page=1&size=2`를 쓴다. 원문의 구현 파일 전문과 준비 과정은 접어 보존한다. 빌드·정적 계약 검사는 통과했으나 브라우저와 practice 서버·DB에서 실제 실행/시각 대조는 미완료다.

## DB-02 목록의 커서 경계

DB-02는 [batch23](mockups-2026-10-16-batch23/asset-index.json) 시안 5장을 생성하고 원문의 practice seed·SQL과 대조해 상황→정렬된 네 행→마지막 행 144의 두 키→읽기 전용 SQL→새 글 삽입 시 offset/cursor 비교를 다섯 장면으로 구현했다. 잘못된 제목·날짜·테이블을 만든 이미지 초안은 제외했다. 첫 장면은 만들 SQL과 DB에서 보낼 SELECT만 보여 준다. 기존 원문의 네 단계 흐름과 SQL·비교표는 접어 보존한다. `LIMIT 3`은 size 2 + hasNext 확인용 한 행이며 화면 반환 행은 143·140이다. M1 HTTP 구현과 실제 DB 실행, 동일 뷰포트 이미지·모바일 대조는 미완료다.

## DB-03 상세 JOIN과 접근 정책

DB-03은 [batch24](mockups-2026-10-16-batch24/asset-index.json)의 선택 시안 5장을 기준으로 상세 데이터 요구→post에서 board/member로 갈라지는 필수 JOIN→viewer 7의 선택 LEFT JOIN→원문과 같은 읽기 SQL·seed 결과 대조→Java PostAccessPolicy를 별도 장면으로 구현했다. imagegen이 원문에 없는 글 제목·날짜·테이블을 만든 초안은 제외하고 다시 생성했다. 원문 전체와 접근 정책 설명은 상세 영역에 보존한다. 현재 M1 HTTP API가 없어 실제 API 실행을 주장하지 않으며, practice DB 실행과 동일 뷰포트 대조도 미완료다.

## DB-04 태그 JOIN·DISTINCT·EXISTS

DB-04는 [batch25](mockups-2026-10-16-batch25/asset-index.json)의 source-checked 시안 7장으로 상황→community seed의 post 2와 spring/jpa 두 연결 행→JOIN 두 결과 행→원문 JOIN/DISTINCT SQL→원문 EXISTS SQL→선택 열에 따른 DISTINCT 결과→글 페이지를 먼저 고른 뒤 태그 배열을 일괄 조립하는 흐름을 구현했다. 관계·투영 선택을 조작할 수 있다. 시나리오 첫 장면에는 만들 SQL과 DB SELECT만 두고, 기존 원문은 접어 보존했다. 실제 MySQL·브라우저·동일 뷰포트 대조는 미완료다.

## DB-05 좋아요·댓글 1:N 행 곱셈

DB-05는 [batch26](mockups-2026-10-16-batch26/asset-index.json) 시안 9장으로 합성 입력 2+3행→JOIN 여섯 조합→잘못된 COUNT 6/6→읽기 전용 합성 CTE→관계별 사전 집계→M6 기간·점수→M9 회원 30의 0 처리→디버깅 순서를 구현했다. 원문에 합성 CTE SQL을 추가해 실제 seed를 변경하지 않고 여섯 쌍을 재현할 수 있게 했다. 해당 CTE는 SQLite 인메모리에서 기대 여섯 쌍을 확인했고, MySQL 컨테이너는 실행 중이지 않아 MySQL 검증이라고 기록하지 않는다. 원문 집계·M6 SQL은 그대로 보존한다. 브라우저/실제 서버 검증은 미완료다.

## DB-06 좋아요에서 북마크 제외

DB-06은 [batch27](mockups-2026-10-16-batch27/asset-index.json) 시안 10장을 원문 SQL 네 개·practice DDL과 대조해 상황→설명용 101/102/103 차집합→한 좋아요 행의 상관 키→NOT EXISTS→반대 EXISTS→현재 NOT NULL 스키마의 NOT IN→별도 가상 NULL 함정→LEFT JOIN anti-join→실행 결과 기록 대조→Service/JPA/MyBatis 구현 위치로 나눴다. 네 SQL은 원문에서 가져와 복사할 수 있으며, 실제 post_id 결과는 비어 있는 입력으로 시작한다. SQLite 인메모리 가상 데이터에서 NOT EXISTS/NOT IN/LEFT JOIN의 동일한 결과와 NULL의 UNKNOWN을 확인했지만 practice MySQL 결과로 표시하지 않는다. 브라우저·동일 뷰포트·실제 MySQL 확인은 미완료다.

## DB-07 같은 M1 목록의 다섯 조회 방식

DB-07은 [batch28](mockups-2026-10-16-batch28/asset-index.json) 시안 13장으로 사람의 상황→공통 M1 계약→읽기 전용 기준 SQL→Controller/Service 뒤 한 구현 선택→파생·JPQL·native·MyBatis·QueryDSL 원문 코드→태그 일괄 조회→다섯 방식의 실행 기록→실제 SQL 로그→cursor 확장 경계로 나눴다. 원문 공통 SQL과 각 구현 코드 조각을 빌드 시 그대로 가져오고, 구현 방식 선택은 설명용 상태이며 서버 빈을 전환하지 않는다. 루트 앱에 M1 엔드포인트가 없고 L12–L14는 별도 복원 overlay이므로 실제 API 성공을 주장하지 않는다. 첫 다섯 ID는 practice seed 기대값, 화면의 실행 결과·SQL 로그는 빈 상태로 둔다. 브라우저 같은 뷰포트·모바일·실서버/DB 검증은 미완료다.

## DB-08~11 실행 계획·인덱스 수명 집중 화면

DB-08은 [batch29](mockups-2026-10-16-batch29/asset-index.json) 시안 8장과 8개 장면으로 회원 12의 `post_like` 핵심 SELECT→EXPLAIN의 후보/선택/추정 행/정렬 신호→가설을 분리했다. DB-09는 [batch30](mockups-2026-10-16-batch30/asset-index.json) 7장과 7개 장면으로 격리 DB 안전 범위→실제 실행되는 EXPLAIN ANALYZE→TREE 노드의 actual rows/loops/time→같은 조건 기록을 분리했다. DB-10은 [batch31](mockups-2026-10-16-batch31/asset-index.json) 8장과 8개 장면으로 `(member_id, created_at, id)` 열 순서→변경 전 계획→전용 fixture에서 CREATE·ANALYZE TABLE→변경 후 계획→반환 ID 순서/개선 근거를 분리했다. DB-11은 [batch32](mockups-2026-10-16-batch32/asset-index.json) 8장과 8개 장면으로 대상 확인→없으면 생성→VISIBLE 기준→INVISIBLE→같은 SELECT 비교→VISIBLE 복원→선택적 DROP을 분리했다. 이미지에 생긴 잘못된 SQL·테이블·응답·인덱스 이름과 EXPLAIN ANALYZE의 잘못된 표 형식은 제외했으며 실제 DOM 텍스트는 원문 SQL을 사용한다. 정적 계약 검사와 [격리 MySQL 10만 행 단일 실행](DB08-11-FIXTURE-CHECK-2026-10-16.md)에서 계획·TREE·가시성 복원을 확인했다. 전용 컨테이너는 제거했다. 실제 API와 동일 뷰포트 데스크톱/모바일 시각 대조는 미완료다.

## DB-12 같은 조건의 JOIN·EXISTS 비교

DB-12는 [batch33](mockups-2026-10-16-batch33/asset-index.json) 시안 12장과 12개 집중 장면으로 재구성했다. M3의 공개 글 예시와 전체 R1 권한을 구분한 뒤 post_like→post 단일 관계, JOIN/EXISTS 원문 SQL, 좋아요 결과 일치를 먼저 확인한다. 이후 기존 M1 API 파라미터로 오해하지 않도록 태그 조건은 별도 SQL 확장 실습으로 제시하고, 태그 JOIN/EXISTS의 결과를 비교한 뒤 네 계획과 대표 실제 TREE를 읽는다. [일회용 practice 시드 복사본](DB12-PRACTICE-COPY-CHECK-2026-10-16.md)에서 두 SQL 쌍의 결과 일치와 MySQL 명령 실행을 확인하고 컨테이너를 제거했다. 실제 API·브라우저/모바일 동일 뷰포트 검증은 남았다.

## DB-13 한 요청의 SQL 수 추적

DB-13은 [batch34](mockups-2026-10-16-batch34/asset-index.json) 시안 12장과 12개 집중 장면으로 재구성했다. M1 계약·Controller 입력·Service/Repository 역할을 각각 다른 화면에 두고, 반복문 속 조회의 1+N(+N)은 설명용 패턴으로 명시했다. JPA와 MyBatis의 계측 방법을 구분하고 size 5/20의 실제 SQL 수는 빈 입력으로 둔다. 작성자 projection과 태그 일괄 SQL을 원문 그대로 보여 준 다음 같은 응답 계약과 SQL 수를 재측정하게 한다. [일회용 MySQL practice 시드 복사본](DB13-PRACTICE-COPY-CHECK-2026-10-16.md)에서는 예시 SQL이 동작하는 것만 확인했다. 현재 루트 M1 API 측정, 같은 뷰포트 이미지/DOM 대조 및 브라우저·모바일 실조작은 아직 하지 않았다.

## DB-14 격리 스키마에서 목록 쿼리와 복원까지

DB-14는 [batch35](mockups-2026-10-16-batch35/asset-index.json) 시안 16장과 16개 집중 장면으로 재구성했다. 관계·요구·도구 세 열을 한 장에 놓은 이전 첫 화면은 접어 보존하고, 격리 fixture와 연결 대상·DDL/FK·응답 출처·조회 조건·JOIN·기준선·계획·인덱스·복원을 한 행동씩 진행한다. [일회용 합성 10만 행 확인](DB14-FIXTURE-CHECK-2026-10-16.md)에서 7테이블·FK 8개, board-03의 조회 결과·인덱스 전후·제거 후 계획과 동일 ID/응답을 확인했다. 기본 50만 행이나 실제 API 성능으로 일반화하지 않는다. 이미지의 가공 스키마·가짜 GET 명령·틀린 실행 계획 출력 초안은 제외했다. 동일 뷰포트·모바일/브라우저 화면 검증은 남아 있다.
