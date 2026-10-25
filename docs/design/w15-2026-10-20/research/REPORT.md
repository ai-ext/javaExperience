# W15 OFFSET·커서 조사 보고서

확인일: 2026-10-20. 기준 원문은 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W15-paging-offset-vs-cursor.md`(283줄, SHA-256 `9937498a3b948f96099dca7bb625573bdc40879254c82c67afc465dee663108b`)이다. 5개 펜스 원본·해시는 `docs/design/w15-2026-10-20/source-proof/source.json` 및 `original/block-01..05.*`에서 확인했다. 실험·repo/DB 변경은 실행하지 않았다.

## 확인된 주장과 조건

- **OFFSET 깊이·동률:** MySQL 8.4 §10.2.1.19는 LIMIT이 ORDER BY 정렬을 조기 종료할 수 있으나, filesort면 LIMIT 없는 조건 일치 행을 대부분/전부 선택·정렬할 수 있다고 한다. ORDER BY 컬럼 값이 같은 행은 실행 계획에 따라 순서가 달라질 수 있어 유일 tie-breaker가 필요하다. Markus Winand 원저자 글은 OFFSET이 N개를 건너뛰도록 요구해 그 행들을 가져와 순서를 맞추는 일을 한다고 설명한다. 정량 성능 비율은 근거가 없으므로 쓰지 않는다.
- **계획 측정:** MySQL 8.4 §15.8.2에서 EXPLAIN은 옵티마이저가 예상하는 처리 계획이며 EXPLAIN ANALYZE는 실제 statement를 실행하고 TREE iterator마다 추정/실제 rows, first-row·iterator time(ms), loops를 보고한다(다중 loop time은 loop당 평균). 선택 인덱스, 필터 선택도, 정렬 충족 여부에 따라 결과가 달라진다. 따라서 원문 SQL의 깊은 OFFSET/커서 비교 결과는 실험 전 미확인이고, 실행계획이나 고정 시간·속도 배수를 만들지 않는다.
- **커서 경계:** DESC/DESC에서는 `(published_at < t) OR (published_at = t AND id < i)`가 사전식 다음 경계다. 혼합 DESC/ASC는 각 동률 단계의 부등호를 해당 방향에 맞춰 바꿔야 한다. MySQL LIMIT 문서의 결정적 정렬 요구와 키셋의 전체 정렬 tuple 조건에 부합한다. SQL NULL 비교와 Spring keyset nullable 제약 때문에 정렬키는 non-null이 안전하다. NULL 허용 시 NULL 순서·predicate·인덱스 조합은 실험/명시적 계약 전에는 보장하지 않는다.
- **동시성:** 키셋은 새 행이 맨 앞에 추가되어 offset 위치가 밀리는 현상을 완화한다. 원저자도 offset 중복을 설명한다. 그러나 각 HTTP 요청 사이에 하나의 DB 트랜잭션 스냅샷을 유지한다는 뜻은 아니다. MySQL InnoDB의 consistent read 스냅샷은 트랜잭션 읽기와 연결된다. 그러므로 별도 요청의 과거 시각 삽입, 경계 뒤 삽입, 삭제, 정렬키 수정은 후속 결과를 바꿀 수 있고 전체 스냅샷·완전 추출은 별도 보장이 필요하다. 구체적인 격리 수준·앱 트랜잭션 설계는 미조사다.
- **Spring Data 4.1.1:** 공식 Scrolling 및 반환형 레퍼런스는 Page=전체 수 정보, Slice=다음 조각 여부, Window=ScrollPosition 기반 창임을 확인한다. Window는 offset/keyset 중 시작 위치에 따라 달라진다. `offset()`은 시작 위치, `offset(0)`은 0번 행 위치이며 exclusive라 첫 행을 건너뛴다. Window는 보통 `size + 1` peek로 다음 창 존재를 판단하고 position은 마지막 반환 행에서 취한다. keyset은 정렬 필드와 PK를 보강해 unique order를 구성하고, nullable 정렬키를 지원하지 않으며, 정렬 속성이 반환 projection/entity에 포함되어야 한다.
- **Page COUNT:** Spring Data Commons 4.1.1 `PageableExecutionUtils` 원본은 content가 page size보다 짧을 때 첫 페이지면 content size, 비어 있지 않은 후속 페이지면 offset+size로 total을 산출하고 그 외에는 supplier를 호출한다. 따라서 Page가 항상 매번 COUNT를 실행한다는 문장은 틀리며, 정확히는 조건부 count 생략이다.
- **Java 파생 메서드:** 4.1.1 query-method 문서는 `find…By` 앞의 descriptive subject와 Page/Slice/Pageable 예제를 제공한다. 두 원문 메서드(`findByStatus`, `findSliceByStatus`)는 네이밍 문법상 predicate가 `By` 뒤 status인 형태다. 다만 JPA 런타임 컴파일/실행은 하지 않았고, 조회 실패한 repository 구현 세부는 확인하지 못했다. Spring Data JPA 3.1.1은 과거에도 Window/Scrolling/keyset 설명을 포함한다. 이는 역사적 사실이며 현재 4.1.1 API 동작과 혼동하지 않는다. 원문의 Boot 4.1.1 BOM 조합은 Boot 공식 페이지 조회 실패로 미확인; 메인 검증자가 실제 BOM/의존성 버전을 확인해야 한다.
- **토큰:** JDK 21 `Base64`는 인코딩/디코딩 API이고, `Mac` 문서는 HMAC을 공유 비밀키 기반 MAC으로 설명한다. RFC 2104 §1은 HMAC을 무결성 확인을 위한 keyed MAC으로 정의한다. MessageDigest는 단방향 digest다. 따라서 Base64만으로 무결성이 생기지 않는다. HMAC 검증은 토큰 무결성만 다루며 사용자 권한 확인·필터/정렬 지문 및 버전 검증은 별개다. JSON 예시의 `...signature`는 placeholder이고 HTTP/API는 검증하지 않았다.

## 메인 실행자에게 남기는 실험 경계

새 private MySQL 8.4.11 datadir/socket/loopback, SELECT 전용 계정의 격리 fixture에서 실행할 것. 기존 R03/R04 `ds_practice.article`에는 `status`가 없고 `published_at`이 nullable이므로 사용·쓰기 금지. 별도 `article(id,status,published_at,title)`에 예정 fixture(600 PUBLISHED+37 DRAFT, 첫 70개 동률, 첫 50개 마지막 키 id=700000/12:00)를 넣는다. 원문 OFFSET 450과 고정 cursor literal은 서로 다른 페이지일 수 있으므로 동일 내용 비교용 OFFSET 경계는 별도로 산출한다. 원문 SQL 3개 및 Java 2개만 그대로 검증하고 fixture의 Article/entity/schema/context/helper는 별도 보조물로 분리한다. `EXPLAIN ANALYZE`는 SELECT를 실제 실행하므로 결과 원자료를 보존하되 시간은 비결정값으로 기록하고 일반 성능비율로 일반화하지 않는다. cursor JSON placeholder/HTTP API는 실행 대상이 아니다.
