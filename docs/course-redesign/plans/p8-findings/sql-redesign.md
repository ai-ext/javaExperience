# 과정 v2 데이터 설계·매일 SQL 개편

> 이 문서의 기존 CSV 개편·검사 기록은 변경 전 이력이다. 현재 사용법·건수·검사 결과는 마지막 「더미 데이터 단순화」 절을 따른다.

확인일: 2026-10-24. 대상: course/p1-spec-roadmap. 구현 전 작업 트리는 깨끗했다.

## 실행 계획

1. `course/spec-v2.md` §6을 6-1~6-8 데이터 요구사항으로 바꾸고 기존 표는 구현 예시 접기로 보존한다. `course/roadmap.json`, `course/hints.json`, 말하기 카드·안내의 물리 이름 의존을 제거한다. → 엔드포인트·응답 계약 보존, 설계 메모·DB 불변식 확인 기준을 대조한다.
2. `tools/course/gen-dummy.mjs`와 독립 검증기로 CSV를 생성하고 `course/start/dummy/README.md`에 열·관계·적재 방법을 기록한다. → 2회 생성 SHA-256 일치, CSV 합계 10MB 미만, 관계·업무 불변식 검사.
3. `course/hints.json`의 날별 sql을 `tools/course/build-days.mjs`로 렌더링한다. 구현 순서 뒤·말하기 카드 앞에 배치하고 예시 SQL은 닫힌 details에 둔다. → 생성기 테스트와 생성 HTML DOM에서 전 일자·접기·2단계 누출을 검사한다.
4. 안내·홈·지도 문구를 맞추고 지정 빌드로만 생성물을 갱신한다. → 요청한 모든 검사 실행 및 실제 MySQL 미검증 범위를 기록한다.

Git add/commit/stash/reset/checkout은 실행하지 않는다. board-server와 messy-server는 읽기만 한다. 구현 예시 커밋의 코드 본문을 보존한다. 같은 세션에서 직접 구현한다.

## 결과

명세·순서·채점·힌트를 직접 설계 중심으로 바꾸고, 16종 CSV와 D01~D15 SQL 33문항을 추가했다. `board-server/`·`messy-server/`의 코드·스키마·설정은 변경하지 않았다. 원본 구현 예시 커밋의 파일 본문·diff를 기존 검사로 보존 확인했다. 현재 작업 저장소에서 add/commit/stash/reset/checkout·push는 수행하지 않았다. 기존 테스트의 임시 저장소 fixture 작성은 제품 저장소의 커밋과 구분한다.

## 바꾼 원칙

- §6은 물리 테이블 표 대신 저장할 사실·불변식·조회 패턴·보존/삭제 정책이다. 6-1 기동 기준 데이터, 6-2 회원, 6-3 글/태그, 6-4 댓글/좋아요, 6-5 포인트, 6-6 쿠폰/상점/주문, 6-7 PG, 6-8 신고/감사로 나눴다.
- 원래 표와 잔액 갱신 설명은 삭제하지 않고 `구현 예시의 설계(board-server)` 접기에 보존했다. 실제 schema.sql 링크와 예시 설명의 공통 감사 필드 예외도 밝혔다.
- 엔드포인트 30개, API 필드·상태 enum·오류 코드는 계약으로 유지한다. SQL 물리 이름·인덱스 이름·특정 실행 계획을 합격 기준으로 요구하지 않는다.
- 설계 순서마다 테이블·키·제약·인덱스의 이유와 버린 대안 1개를 메모하고, 직접 SQL의 거부 결과·대사·실패 원복을 제출한다. 합계·추가 전용 정책은 단일 CHECK가 모두 지킨다고 주장하지 않고 DB·트랜잭션·권한·앱의 책임을 나눈다. 채점자는 쓰기 SQL을 대신 실행하지 않고 제출 증거를 확인한다.
- CSV 파일과 열은 논리 형식이다. 테이블 수·이름·PK 전략은 자유다. 키를 새로 발급하면 원본 key→내 PK 매핑으로 모든 참조를 옮긴다. 잔액은 D03에서 먼저 넣지 않고 D07 이력 범위·D08 충전에 맞춰 대사한다.
- SQL 과제·확인할 성질은 모든 구현 순서 뒤, 말하기 카드 앞에 보인다. 예시 SQL만 닫힌 접기 안에 있다. 2단계는 기존 서버의 진단 SQL이며 CSV를 넣지 않는다.
- 기존 요청 흐름도 구체적인 예시 스키마를 보여 주므로 1단계에만 비교용 접기로 감쌌다. 원본 흐름 값·코드 근거는 유지했다. 바깥 접기를 열어도 재생이 초기화되지 않던 문제를 고쳤고 접으면 재생이 멈추게 했다. 티켓의 원인 접기 정책은 그대로다.

## 파일별 변경

| 원본 파일 | 변경 |
|---|---|
| `course/spec-v2.md` | 데이터 요구사항 6-1~6-8, 기존 표 접기 보존, 다른 절의 물리 이름 의존 제거 |
| `course/roadmap.json` | D02·D03·D04·D05·D07·D08·D10 설계 단계에 dataRefs·설계 메모·DB 불변식 확인 추가, D06 인덱스 실험 일반화 |
| `course/hints.json` | 고민할 지점 중심의 힌트, 물리 이름에 독립적인 채점 안내, 날별 sql.context/questions/refs |
| `course/talk-cards.md` | 1단계 카드의 고정 테이블·복합 인덱스·커서 이름을 설계 이유와 성질로 변경 |
| `course/README.md` | 직접 설계·매일 SQL·더미 적재·구현 예시 역할 안내 |
| `course/start/README.md` | 직접 설계·적재 출발점과 구현 예시 표현 |
| `course/start/compose.yaml` | 1단계 MySQL에 --local-infile=1 추가 |
| `course/start/dummy/README.md` | 16파일의 모든 열·관계·날별 적재 순서, 키 매핑·카운터·시각 처리, LOAD DATA와 임시 테이블 적재 SQL, 클라이언트 옵션·미검증 범위 |
| `course/start/dummy/*.csv`, `manifest.json` | 고정 시드로 생성한 CSV와 행 수·크기·SHA-256 기준값 |
| `tools/course/gen-dummy.mjs` | 시스템 시각·외부 패키지 없이 고정 시드 CSV 생성 |
| `tools/course/verify-dummy.mjs` | CSV를 다시 파싱해 manifest·참조·중복·수량·잔액·완료 충전 대사 검증 |
| `tools/course/gen-dummy.test.mjs` | 두 번 생성 바이트 비교와 중복 좋아요·없는 작성자 변형 거부 검사 |
| `tools/course/build-days.mjs` | 오늘의 SQL 렌더링, 데이터 요구사항 링크, 구현 예시 문구, D00·일자 목록 안내 |
| `tools/course/build-days.test.mjs` | 모든 일자의 SQL 절·배치·예시 접기, API 엔드포인트와 원래 표 보존, 직접 설계 기준 검사 및 기존 fixture 갱신 |
| `tools/course/validate.mjs` | 날별 SQL 구조·문항 수·과제/예시 분리·2단계 보이는 문구 누출 검사 |
| `tools/course/validate.test.mjs` | SQL 누락·예시 없음·원인 문구 변형 거부 검사 |
| `tools/site/course-pages.mjs` | 홈 안내와 데이터 요구사항 사실 칸 |
| `tools/site/course-flow.mjs` | 기존 1단계 요청 흐름을 구현 예시 접기에 배치 |
| `tools/site/course-flow.js` | 바깥 접기와 내부 원인 접기 구별, 바깥 접기 닫기 시 재생 정지 |
| `tools/site/test-course-pages.mjs` | 생성 DOM의 15일 SQL·문항·접기·누출·흐름 조작 검사 |
| `README.md`·`course/map.md` | 직접 설계·매일 SQL·더미 안내 |
| `docs/design/visual-inventory.jsonl`·`visual-inventory-summary.json`·`VISUAL-PAGES.md` | inventory 생성기로 현재 원본/화면 항목 갱신. 새 항목은 미검토 |
| 이 보고서 | 실행 계획·파일별 변경·33문항·규모·검사·한계 기록 |

생성물은 손으로 고치지 않았다. `npm run build`가 `course/spring/D00~D15.md`·일자 목록과 대응 HTML, 과정·명세·카드·출발 안내·더미 README·홈 HTML을 갱신했다. 티켓 B01~B16·E01 HTML의 공통 범례 문구도 생성기에서 `구현 예시 코드`로 바뀌었으며 티켓 Markdown과 원인·해법 본문은 수정하지 않았다.

## 일자별 오늘의 SQL (33문항)


### D01

1. 현재 DB·서버 버전·문자셋·local_infile 설정을 조회한다. → 접속 대상이 내 1단계 DB이며 버전·문자셋·서버 적재 허용 값을 기록한다.
2. SHOW TABLES와 information_schema로 내 DB의 테이블·열을 조사한다. → 두 목록의 테이블 집합이 같다. 아직 0개라면 그 결과와 D02 설계 계획을 적는다.

### D02

1. 금칙어·공통코드 CSV를 내가 설계한 테이블에 열 매핑해 적재하고 각각 센다. → 신규 격리 데이터 기준 3건·5건이다. 기동 적재 로그와 DB 건수가 같다.
2. 같은 금칙어와 같은 그룹의 같은 코드 INSERT를 각각 시도한다. → 두 중복은 DB에서 거부되고 기존 건수는 그대로다. 별도 실험에서 수행 후 원복한다.

### D03

1. 회원 CSV를 매핑해 적재하고 전체 수와 역할별 수를 구한다. → 신규 격리 데이터 기준 200명, ADMIN 1명·USER 199명이다. 원문 비밀번호는 조회 결과에 없다.
2. 기존 회원과 이메일만 같은 경우, 닉네임만 같은 경우를 분리해 직접 INSERT한다. → 서로 다른 두 중복 원인이 각각 DB에서 거부된다. 거부 결과를 설계 메모에 남긴다.

### D04

1. 공개 글 전체 수와 최신순 첫 20건을 조회한다. → 공개 글은 16,000건이며 첫 쪽은 20건이다. 정렬 동률에도 같은 순서를 재현한다.
2. 첫 쪽의 마지막 커서 값으로 다음 20건을 구한다. → 두 쪽의 글 식별 집합이 겹치지 않고 다음 쪽도 최신순이다. 내 정렬이 시각+식별이라면 커서에도 둘 다 반영한다.
3. 내가 만든 목록 인덱스가 있을 때 실행 계획을 읽는다. → key·rows·Extra와 필터·정렬 단계를 기록한다. 인덱스 사용이나 속도를 측정 전 단정하지 않는다.

### D05

1. 공개 글별 삭제되지 않은 댓글 수를 구한다. 댓글 없는 글도 0으로 남긴다. → 결과 행 수는 공개 글 16,000건과 같다. 댓글·좋아요를 동시에 JOIN해 수가 부풀지 않는지 확인한다.
2. 공개 글의 실제 좋아요 관계를 세어 많은 순 TOP 10을 구한다. → 동률은 내 식별 기준으로 고정하며 저장한 카운터를 쓰는 경우 실제 관계 수와도 대사한다.
3. 회원별 작성 글 수를 구한다. 작성 글이 없는 회원도 포함한다. → 결과는 회원 200명 각각 1행이며 합계는 전체 글 20,000건이다.

### D06

1. 지정 태그가 붙은 공개 글을 EXISTS와 JOIN 두 방식으로 조회한다. → 동일한 글 식별 집합·순서이며 중복 행이 없다. CSV의 spring 태그 공개 글은 500건이다.
2. 위 두 SQL의 실행 계획을 비교한다. → 결과 동등성을 먼저 확인하고 접근 경로·행 수·중복 제거 단계를 기록한다. 보편적으로 빠른 문법이라고 단정하지 않는다.

### D07

1. 전체 회원의 잔액과 부호 있는 이력 합을 대사해 어긋난 회원만 찾는다. → 그날 범위의 더미 이력과 잔액을 맞춘 뒤 결과 0행이다. 이력이 없는 회원을 추가해도 잔액 0이면 불일치로 잡히지 않는다.
2. 격리한 아이템에 남은 재고보다 큰 수량을 조건부 차감한다. → 영향 행 수 0이고 재고가 음수가 되지 않는다. 실제 재고와 과다 수량을 직접 정한 뒤 마지막에 ROLLBACK한다.
3. 쿠폰별 보유 관계 수와 기록된 발급량을 비교한다. → 더미 기준 쿠폰 10종 각각 보유 20건이며 불일치 0행이다.

### D08

1. 충전을 상태별로 묶어 건수와 요청 금액 합을 구한다. → REQUESTED·DONE·FAILED·UNKNOWN 각각 20건·20,000이다. 실패·미확정 금액을 잔액에 더하지 않는다.
2. 완료 충전과 충전 이력을 대조해 누락·중복·금액 불일치를 찾는다. → 더미에서 불일치 0행이다. 완료 20건에 충전 적립도 20건이다.

### D09

1. 인기글 캐시 응답의 식별·좋아요 수를 같은 시점의 DB 상위 목록과 대조한다. → 변경을 멈춘 상태에서 같은 정렬·페이지 조건의 결과가 같다. 캐시 생성·DB 조회 시각과 TTL을 함께 적는다. SQL이 Redis를 직접 읽는다고 가정하지 않는다.
2. 활동 적립만 회원별 집계해 랭킹 원천을 만든다. → 더미에서는 200명 모두 1,000점이다. 충전·지출은 활동 점수에 포함되지 않는다.

### D10

1. 글별 신고 누적과 미처리 건수를 구한다. → 더미에서 신고 대상 30개 각각 10건이며 전체 합계 300, OPEN 합계 200이다.
2. 관리자 동작별 감사 건수와 최신 기록 20건을 조회한다. → 더미 기준 대량 지급 기록 30건이며 최신 목록은 20건이다. 대상의 공개 여부와 무관하게 기록을 읽을 수 있다.

### D11

1. 현재 DB의 테이블·열·제약 목록을 조사해 코드의 저장 경로와 짝짓는다. → 실제 존재하는 이름과 관찰 시각을 지도에 기록한다. 예상 설계로 실제 결과를 대신하지 않는다.
2. 관찰할 요청 하나를 정하고 전후 관련 데이터 건수를 비교한다. → 읽은 경로와 건수 변화만 기록한다. 업무 요청은 해당 티켓 절차대로 학습자가 실행한다.

### D12

1. 재현 중 실행 중인 세션과 열린 트랜잭션을 같은 시각에 조회한다. → 세션 식별·시작 시각·현재 SQL을 증거로 남긴다. 관찰 권한이 없으면 그 오류를 기록한다.
2. 로그에서 실제 목록 SELECT를 찾아 실행 계획과 반환 건수를 비교한다. → 관찰한 쿼리·바인딩 값·key·추정 행 수를 남긴다. ANALYZE는 SELECT임을 확인한 뒤 실행하며 실행 부담도 기록한다.

### D13

1. 재현 중 DB의 대기 관계와 최근 엔진 진단 기록을 조회한다. → 관찰한 식별 값·시각·출력을 그대로 저장한다. 행이 없으면 그 사실을 적고 원인으로 단정하지 않는다.
2. 주문 요청별 데이터 건수와 회원별 잔액·이력 합을 대조한다. → 중복 또는 차이의 유무를 SQL 결과로 남긴다. 결과를 맞추려고 데이터를 수정하지 않는다.

### D14

1. 관찰 시각별로 공개 글의 DB 목록을 조회해 API에서 받은 식별 집합과 대조한다. → 쿼리·API 응답·양쪽 시각을 같이 남긴다. 차이가 있어도 해법을 추측해 결론으로 쓰지 않는다.
2. 요청 관찰 구간 전후 DB 문장 실행 횟수 누적값을 읽고 차이를 계산한다. → 같은 digest의 누적값 차이와 구간을 기록한다. 다른 요청도 함께 섞일 수 있으므로 전체 증가량을 한 요청의 값으로 단정하지 않는다.

### D15

1. 회원별 잔액·이력 합 대사를 다시 실행하고 D07 또는 D13 기록과 비교한다. → 불일치 유무와 그 사이 수행한 요청을 설명한다. 이전 숫자를 현재 결과로 복사하지 않는다.
2. 가장 설명하기 어려웠던 SELECT 하나를 골라 결과 행 수·실행 계획을 다시 기록한다. → 정렬·필터·조인 다중성이 결과에 미친 영향을 내 SQL과 실제 출력으로 설명한다.

선택 자료는 D04 커서/EXPLAIN, D05 집계, D06 EXISTS/JOIN·동적 검색, D12 ANALYZE에 연결했다. 기존 `scenario/db-query-journey/`·`scenario/ch8-query-deep/`는 별도 구 스키마를 전제한다는 안내를 링크 옆에 붙였다.

## 더미 규모와 검증

고정 시드 20261024, CSV 16종·143,508행·5,086,814바이트(10MB 미만). 회원 200, 글 20,000, 댓글 50,000, 좋아요 32,000, 태그 40, 글-태그 40,000, 쿠폰 10, 회원 쿠폰 200, 상품 20, 주문 200, 포인트 이력 420, 결제 80, 금칙어 3, 공통코드 5, 신고 300, 감사 30이다.

- `node tools/course/gen-dummy.mjs`를 연속 두 번 실행하고 manifest를 cmp로 대조했다. 모든 CSV의 SHA-256·행 수·바이트가 같았다. 생성 테스트에서는 모든 출력 파일을 바이트 단위로 직접 비교한다.
- `node tools/course/verify-dummy.mjs`: errors=[], 16파일·143,508행·5,086,814바이트. 중복 논리 키·이메일·닉네임·태그·좋아요·보유 쿠폰·주문/충전 멱등 키·신고, 부모 참조, 사유 참조, 활동 작성자, 잔액·순서별 잔액·부호, 쿠폰 총량/보유 수·재고·가격·주문 금액·완료 충전 적립을 확인했다.
- `node --test tools/course/gen-dummy.test.mjs`: 1/1 통과. 중복 좋아요 행 추가와 존재하지 않는 작성자 변형은 실제로 실패 판정됐다.
- 독립 Python csv 파서와 SQLite 임시 메모리 DB의 집계 대조: 공개 글 16,000, 공개 spring 글 500, 미삭제 댓글 45,000, 중복 좋아요 0, 잔액 차이 0, 완료 충전 20, OPEN 신고 200. 이것은 CSV 집계 의미 검증이며 MySQL 문법·실행 계획 검증은 아니다.
- 공통 비밀번호 Course1234의 고정 BCrypt 해시는 htpasswd 검증에서 일치했다. 앱 로그인 성공 검증과 구분한다.

## 검사 결과

아래는 최종 소스·생성물을 대상으로 실행했으며 모두 exit 0이다.

| 검사 | 결과 |
|---|---|
| `cd tools/site && npm run build` | HTML 396개, 링크 오류 0 |
| `npm run test:course` | 36/36 통과 |
| `npm run validate:course` | 30 endpoints, 15 days, 68 cards, 17 day pages |
| `npm run test:course-pages` | 10/10 통과, 일자 16쪽·티켓 17개 흐름·근거 문자열 293개·조작/누출 검사 포함 |
| `npm run audit:visual` | failures=[] |
| `npm run audit:version-cards` | 4카드 검사 통과 |
| `npm run audit:parity` | 446기록 검사 통과, verified 0 유지 |
| `npm run test:navigation` | 공통 메뉴·생성물·목차 검사 통과 |
| `npm run test:home` | 상태·DOM·이어하기·다중 탭·미리보기·환경 준비 검사 통과 |
| 루트 `node --test tools/course/build-days.test.mjs` | 49/49 통과, 원본 구현 예시 코드/diff 보존 검사 포함 |
| `node tools/site/inventory-visual-work.mjs` | 360화면·47,717항목: unreviewed 47,658, implemented 53, 기존 verified 6 |
| `git diff --check` | 오류 없음 |
| `git diff --exit-code -- board-server messy-server` 및 해당 경로 미추적 조회 | 변경·미추적 파일 없음 |

초기 검사에서 확인한 환경 문제와 조정:

1. 생성기는 임시 index로 구현 예시 diff를 조립하는 과정에서 Git 객체를 쓴다. 공유 `.git`은 쓰기 제한되어 처음에 Operation not permitted가 났다. `GIT_OBJECT_DIRECTORY=/private/tmp/course-sql-objects`, `GIT_ALTERNATE_OBJECT_DIRECTORIES=$(git rev-parse --path-format=absolute --git-common-dir)/objects`를 실행 환경에 지정해 임시 객체만 별도 위치에 썼다. 원본 Git 객체·index·브랜치 변경과 구분한다.
2. npm에서 실행된 x64 Node가 ARM esbuild 설치본을 자동 선택하지 못했다. `ESBUILD_BINARY_PATH`를 현재 worktree의 `tools/site/node_modules/@esbuild/darwin-arm64/bin/esbuild` 절대경로로 지정했다. 바이너리 0.28.2 실행을 확인했으며 의존성·lockfile·패키지 설정은 바꾸지 않았다.
3. 새 기능의 없는 SQL 데이터 테스트 실패를 확인하고 구현한 뒤 통과시켰다. 바깥 접기로 감싼 흐름에서 기존 재생 초기화가 실패하는 것도 화면 테스트로 확인하고 수정했다. 테스트가 성공 문구와 함께 비동기 AssertionError를 남기던 초기 실행은 통과로 세지 않았다. 최종 화면 로그에는 해당 오류가 없다.

실행 로그는 이 세션의 `/private/tmp/course-sql-final-*.log`에 있다. 임시 파일이므로 영구 증거로 의존하지 말고 위 명령으로 재검사한다. 데이터 파일별 해시는 저장소의 dummy/manifest.json으로 재현한다.

## 못 한 것과 검증 한계

- 실제 MySQL에 LOAD DATA LOCAL INFILE·임시 테이블→INSERT SELECT를 실행하지 않았다. 서버 설정은 출발 compose에 추가했으나 컨테이너를 실행해 ON 여부를 관찰하지 않았다.
- SQL 예시를 실제 MySQL에서 모두 실행하거나 EXPLAIN/속도를 측정하지 않았다. 계획과 성능을 측정 결과처럼 제시하지 않았다.
- CloudBeaver/DBeaver의 실제 가져오기, 학습자 앱 로그인, 2단계 재현 스크립트·장애 훈련을 실행하지 않았다.
- 이번 UI 검증은 생성 HTML/JSDOM 구조·조작 검사다. 실제 브라우저의 데스크톱·모바일 시각 대조 및 학습자 이해도는 미검증이다. 이미지 시안을 새로 제작하거나 새 inventory/parity 항목을 verified로 올리지 않았다.
- 예시 서버 코드가 모든 불변식을 만족한다는 판정은 하지 않는다. 추가 전용 이력·감사 정책은 학습자가 실제 권한과 저장소 경계로 검증해야 한다.


## 더미 데이터 단순화

확인일: 2026-10-24. 현재 작업 공간은 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap`, 브랜치 파일의 값은 `course/p1-spec-roadmap`, 읽은 ref는 `3397f80a6b3dd697a4dd44525575045107f6dbb0`이다. 위 CSV 방식·검사 결과는 변경 전 이력이며 이 절이 현재 SQL 방식의 기준이다.

### 변경과 실행 계획

1. 스키마·참조 문서·문항을 대조한다. → 실제 구현 예시의 16개 테이블·열과 seed/bulk 기준을 확정한다.
2. CSV 적재 도구를 지우고 작은 INSERT와 대량 INSERT SELECT로 바꾼다. → 참조·중복·상태·잔액·재고와 예상 집계를 독립 계산한다.
3. 생성기로 일자 Markdown·HTML을 다시 만들고 지정 검사를 실행한다. → 결과·미실행 범위를 아래에 기록한다.

삭제: `course/start/dummy/`의 CSV 16종(합계 5,086,814바이트), `manifest.json`, `tools/course/gen-dummy.mjs`, `tools/course/gen-dummy.test.mjs`, `tools/course/verify-dummy.mjs`. 삭제한 CSV는 members·posts·tags·post-tags·comments·likes·coupons·member-coupons·items·orders·point-history·payments·banned-words·common-codes·reports·audit-events다.

새 데이터 파일은 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/start/dummy/seed.sql`과 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/start/dummy/bulk.sql`이다. 스키마 출처는 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/board-server/src/main/resources/schema.sql`이다. INSERT의 테이블·컬럼은 원본 그대로 사용한다. 복사해 실행하는 SQL만 배포하고 CSV 재생성·파일 업로드·LOAD DATA·외부 생성기를 요구하지 않는다.

`course/hints.json`·과정/출발 README·루트 README·지도·일자 생성기·홈 렌더러의 안내를 SQL로 바꿨다. D00~D15와 일자 목록은 생성기로 갱신했다. D01의 local_infile 조회와 출발 compose의 `--local-infile=1`을 제거했다. 전체 도구와 package.json을 검색했으며 삭제 도구를 호출하는 스크립트는 없어서 package.json 변경은 불필요했다. 이전 CSV 테스트를 삭제하고 `tools/course/seed-sql.test.mjs`로 현재 데이터 관계·집계 회귀 검사를 추가했다. P8 장부에는 이 변경이 이전 CSV 기록을 대체한다고 덧붙였다.

### 파일 크기와 블록별 행 수

`seed.sql`: **39,315바이트**, `bulk.sql`: **2,296바이트**, SQL 합계 **41,611바이트**. seed는 50KB 미만이다. 둘 다 시각을 고정하고 무작위·현재 시각 함수를 사용하지 않는다.

| 실행 블록 | 추가하는 행 | 블록 직후의 성질 |
|---|---|---|
| D02 기준 데이터 | banned_word 3, common_code 5 | 금칙어·그룹/코드 중복 없음 |
| D03 회원 | member 20 | ADMIN 1·USER 19, 잔액 모두 0 |
| D04 글·태그 | tag 4, post 100, post_tag 150 | ACTIVE 80·HIDDEN 10·DELETED 10, spring 100개 글 공유, sql 50개 글 공유 |
| D05 댓글·좋아요 | comment 80, post_like 150 | 미삭제 댓글 72, 공개 글의 미삭제 댓글 60, 좋아요 카운터를 실제 관계 수로 갱신 |
| D07 포인트·쿠폰·상점·주문 | coupon 2, shop_item 3, member_coupon 20, shop_order 20, point_ledger 40 | 쿠폰마다 보유/발급 10, 상품 재고 80·0·10, 모든 회원 잔액 900 |
| D08 충전 | pg_payment 8, point_ledger 2 | 4상태 각각 2건, DONE 회원 1·5만 1,000씩 적립 |
| D10 신고·감사 | report 6, audit_log 3 | 글 2·3 각각 신고 3(OPEN 2), BULK_ISSUE_COUPON 3 |

seed 전체는 **616행**이다. 행 수는 INSERT만 센 값이며 D05의 카운터 UPDATE, D07·D08의 잔액 UPDATE는 추가 행이 아니다. 회원 비밀번호는 모두 Course1234이며 지정된 고정 해시의 접두어를 `$2a$`로 사용했다. `/usr/sbin/htpasswd -vb`로 이 해시와 비밀번호의 일치(exit 0)를 재확인했다. Spring 앱 로그인 실행과는 구분한다.

D07 적립은 회원 1~19의 본인 글(id=회원 id), 회원 20의 본인 댓글(id=37)을 사유로 한다. 모든 회원에게 EARN +1,000과 ORDER에 연결된 SPEND -100이 하나씩 있다. 회원별 누적 잔액은 1,000 → 900이고 D08의 두 완료 회원만 1,900이 된다. 최종 잔액 총합은 20×900+2×1,000=20,000이며 이력 합과 같다. 주문은 상품 1을 20개 구매한 가상 스냅샷(개당 100)이며 재고는 이미 반영된 80이다. 상품 2의 재고 0은 품절 경계다.

### bulk 결과와 계산 근거

bulk는 seed D05까지 넣은 별도 DB에서 전체를 한 번 실행한다. `INSERT INTO ... WITH RECURSIVE ... SELECT`로 임시 숫자 테이블에 **101~20,100 양끝 포함 20,000개**를 만들고 여러 INSERT SELECT에 재사용한다. MySQL의 `WITH ... INSERT` 순서로 쓰지 않았다. `cte_max_recursion_depth`를 세션에서 20,100으로 높이고, 종료 후 이전 값으로 돌리며 임시 테이블을 제거한다. 실패 시 COMMIT 없이 ROLLBACK하고 파일 끝의 정리 문장을 같은 연결에서 실행하도록 안내했다.

| 테이블·집계 | seed D05까지 | bulk 추가 | 합계 |
|---|---:|---:|---:|
| member | 20 | 0 | 20 |
| post | 100 | 20,000 | 20,100 |
| ACTIVE 글 | 80 | 16,000 | 16,080 |
| HIDDEN 글 | 10 | 2,000 | 2,010 |
| DELETED 글 | 10 | 2,000 | 2,010 |
| tag | 4 | 0 | 4 |
| post_tag | 150 | 30,000 | 30,150 |
| comment | 80 | 40,000 | 40,080 |
| 미삭제 comment | 72 | 36,000 | 36,072 |
| post_like | 150 | 40,000 | 40,150 |
| spring 태그 공개 글 | 80 | 16,000 | 16,080 |

글 상태는 id % 10이 0이면 DELETED, 1이면 HIDDEN, 나머지는 ACTIVE다. seed 100개와 bulk 20,000개는 모두 10의 배수이므로 8:1:1이다. 모든 글에 spring, 짝수 글에 sql을 하나씩 연결하므로 bulk 관계는 20,000+10,000이다. 댓글은 bulk 글마다 2개이며 5의 배수 글의 둘째 댓글만 삭제(4,000개)하므로 40,000-4,000=36,000개가 미삭제다. 좋아요는 seed 글 id % 4개(한 주기 합 6, 25주기=150), bulk 글마다 서로 다른 회원 2명씩이다. 작성자 다음 회원부터 순환해 본인 좋아요도 만들지 않는다. 고정 post id와 회원 순환식으로 (글, 회원) 중복이 없으며 bulk 글의 저장 카운터도 2다. 태그·댓글·좋아요 PK는 seed 범위와 겹치지 않도록 151 또는 81에서 시작한다. bulk는 회원·금전 이력을 변경하지 않는다.

### 문항별 기대값과 근거

D04·D05는 seed만 기준이다. D06은 seed D05+bulk 기준이며 별도 실험 DB에서 수행한다. D07 이후는 원래 seed DB로 돌아간다. D11~D14는 기존 messy-server DB, D15는 선택한 실제 DB 기준이다. 아래 33개 문항은 현재 hints.json과 같은 순서다. MySQL의 key·rows·Extra·성능은 계산으로 확정하지 않는다.

| 문항 | 데이터 기준 | 기대값 | 계산·판정 근거 |
|---|---|---|---|
| D01-1 | 적재 전 내 DB | DB·버전·문자셋 기록 | 연결된 서버에서 실제 조회; 고정 건수 없음 |
| D01-2 | 적재 전 내 DB | 테이블 집합 일치(0개 허용) | SHOW TABLES와 information_schema의 현재 DB 조건 비교 |
| D02-1 | seed D02 | 3건·5건 | 두 INSERT의 VALUES 3개·5개 |
| D02-2 | seed D02 | 중복 두 종류 거부, 3·5 유지 | word UNIQUE, (group_code,code) UNIQUE, 시도 후 ROLLBACK |
| D03-1 | seed D03 | 20명=ADMIN 1+USER 19, 잔액 0 | member id 1~20, id 1만 ADMIN |
| D03-2 | seed D03 | 중복 두 종류 거부, 20명 유지 | email·nickname 각각 UNIQUE; 트랜잭션 원복 |
| D04-1 | seed D04 | 공개 80, 첫 쪽 20, 마지막 id 76 | id % 10=2~9만 ACTIVE, DESC LIMIT 20 |
| D04-2 | seed D04 | 20건, id 75~52, 앞쪽과 겹침 0 | ACTIVE 중 id<76, DESC LIMIT 20 |
| D04-3 | seed D04 / 선택 대량 재실험 | 계획 실제 기록; 재실험 공개 16,080 | bulk는 별도 DB에 seed D05까지 넣은 뒤 추가; 80+16,000 |
| D05-1 | seed D05 | 80행, 미삭제 댓글 합 60, 0댓글 공개 글 48 | 댓글은 글 1~40에 2개: 공개 32×2-삭제 4=60; 나머지 공개 48개 |
| D05-2 | seed D05 | TOP 10 모두 3개; id 99,95,87,83,79,75,67,63,59,55 | ACTIVE 중 id % 4=3, 좋아요 DESC·id DESC; 실제 관계와 카운터 일치 |
| D05-3 | seed D05 | 20행, 글 합 100, 회원 20은 0 | 작성자는 1+(id-1)%19; LEFT JOIN이 미작성 회원 포함 |
| D06-1 | seed D05+bulk | 두 방식 모두 16,080행, 중복 0 | 모든 글이 spring을 공유; 공개 80+16,000 |
| D06-2 | seed D05+bulk | 결과 동등, 계획은 실제 기록 | 16,080 id 집합·정렬을 대조한 뒤 EXPLAIN |
| D07-1 | seed D07 | 불일치 0행, 모든 잔액 900 | 20명 각 +1,000-100; 미이력 회원의 0은 COALESCE |
| D07-2 | seed D07 | 영향 0행, 재고 80 유지 | 상품 1 stock=80<101이므로 WHERE stock>=101 불성립 |
| D07-3 | seed D07 | 불일치 0행; 2종 각 10 | 회원 id 홀짝으로 쿠폰 1·2에 10명씩; issued_quantity=10 |
| D08-1 | seed D08 | 4행; 각 2건·금액 합 2,000 | 8개 요청에 DONE/FAILED/UNKNOWN/REQUESTED 주기, 각 amount=1,000 |
| D08-2 | seed D08 | 두 불일치 조회 모두 0행, 완료/적립 각 2 | DONE id 1·5에만 CHARGE 1개씩; 잔액 1,900×2+900×18 |
| D09-1 | seed D08까지 | 같은 정렬·시점의 DB 20건과 캐시 대조 | 공개 80건이므로 LIMIT 20은 20건; Redis 일치·TTL은 실제 앱 관찰 |
| D09-2 | seed D08까지 | 20행, 모두 활동 점수 1,000 | 회원별 EARN 1개; 19 POST+1 COMMENT, SPEND·CHARGE 제외 |
| D10-1 | seed D10 | 2행, 각 total 3/open 2; 전체 6/open 4 | report 6개를 post 2·3에 3개씩, 각 셋째만 RESOLVED |
| D10-2 | seed D10 | 동작 집계 1행(3건), 최신 목록 3건 | audit_log 3개가 모두 BULK_ISSUE_COUPON; LIMIT 20은 상한 |
| D11-1 | messy-server 현재 DB | 현재 열·제약 목록 기록 | 1단계 SQL 미적재; 실제 DB 관찰 |
| D11-2 | messy-server 티켓 DB | 요청 전후 건수 실제 비교 | 고정 기대 건수 없음; 해당 티켓 재현 절차 |
| D12-1 | messy-server 재현 중 | 현재 세션·열린 트랜잭션 기록 | 접근 권한과 관찰 시각에 따라 실제 결과 사용 |
| D12-2 | messy-server 재현 중 | 관찰 쿼리·바인딩·계획·공개 글 수 기록 | 실제 티켓 DB이므로 seed 건수 적용 금지 |
| D13-1 | messy-server 재현 중 | 대기·엔진 진단 실제 기록 | 0행을 원인 부재로 단정하지 않음 |
| D13-2 | messy-server 재현 중 | 주문 중복·잔액 차이 유무 기록 | 현재 요청의 관계·부호 있는 이력 합으로 판정; 결과 수정 금지 |
| D14-1 | messy-server 관찰 시각 | DB·API id 집합과 시각 기록 | 실제 공개 글·좋아요 정렬, 고정 건수 없음 |
| D14-2 | messy-server 관찰 구간 | 같은 digest 누적값 차이 기록 | 동시 요청이 섞일 수 있음; 한 요청으로 단정하지 않음 |
| D15-1 | 선택한 1·2단계 DB | 이전 대사와 비교 | seed D07/D08 직후 무변경이면 불일치 0; 이후는 실제 요청에 따라 판정 |
| D15-2 | 선택한 1·2단계 DB | 행 수·계획과 이유 설명 | 선택한 SELECT·데이터셋·시각 기록; 고정 건수 없음 |

### 문법·불변식 검토와 실행 한계

- MySQL 원본 스키마의 테이블·열·NOT NULL·FK·UNIQUE·CHECK와 INSERT를 대조했다. NULL은 member_coupon.used_at·shop_order.member_coupon_id·미완료 결제 식별/응답 시각 등에만 사용한다. 문자 길이·상태 값·부호·사유 참조를 확인했다.
- 재귀 CTE의 시작 101·종료 20,100과 재귀 증가 +1, INSERT 뒤 WITH의 MySQL 문법 위치, 임시 테이블 재사용, 세션 재귀 깊이 복원, 파생 테이블 copies의 별칭, ORDER BY와 트랜잭션 경계를 검토했다. 명시 ID를 사용하므로 AUTO_INCREMENT 진행이나 실행 순서의 우연에 기대지 않는다.
- seed는 날별 블록마다 트랜잭션과 고정 시각을 선언한다. D03~D05에는 이력이 없어 잔액 0이고 D07~D08에서는 블록 완료 시점 잔액=이력 합이 성립한다. bulk도 글·댓글·관계·카운터를 한 트랜잭션으로 추가한다.
- `node --test tools/course/seed-sql.test.mjs`: 2/2 통과. SQLite 메모리 DB에 원본 DDL의 열·PK·FK·UNIQUE·CHECK를 유지하고 MySQL 표기만 변환해 실행했다. seed 블록별 잔액, 최종 16테이블 건수, FK·중복·카운터·잔액/누적 잔액·주문 금액·재고·쿠폰량·충전 적립·EARN 작성자와 문항 집계를 검사했다. bulk를 새 DB에 두 번 실행해 증가량·삭제 집계·EXISTS/JOIN id 집합·순서가 같음을 확인했다. 이것은 MySQL 구문 실행을 대체하지 않는다.
- 실제 MySQL·Docker·Spring 앱 로그인·Redis 캐시·EXPLAIN/속도는 실행하지 않았다. 사용자가 지정한 대로 실제 MySQL 실행은 컨트롤러가 담당한다. 새로운 이미지 생성·실제 브라우저 시각 대조 없이 parity/inventory 상태를 verified로 올리지 않는다.

### 단순화 후 검사 결과

아래 검사는 현재 SQL 방식의 소스·생성물을 대상으로 실행했으며 모두 exit 0이다.

| 검사 | 결과 |
|---|---|
| `cd tools/site && npm run build` | 일자 Markdown 17개·HTML 396개, 링크 오류 0 |
| `npm run test:course` | validate 테스트 36/36 통과 |
| `npm run validate:course` | 30 endpoints·15 days·68 cards·17 day pages |
| `npm run test:course-pages` | 10/10 통과; 전 일자 SQL 표시·예시 접기 검사 포함 |
| `npm run audit:visual` | failures=[] |
| `npm run audit:version-cards` | 4카드 검사 통과 |
| `npm run audit:parity` | 446기록 검사 통과, verified 0 유지 |
| `npm run test:navigation` | 공통 메뉴·생성물·목차 검사 통과 |
| `npm run test:home` | 상태·DOM·다중 탭·이어하기·서비스 미리보기·환경 준비 검사 통과 |
| 루트 `node --test tools/course/*.test.mjs` | 87/87 통과: build-days 49 + validate 36 + seed-sql 2. 요청한 build-days.test.mjs를 포함한 tools/course의 모든 테스트 실행 |
| `node tools/site/inventory-visual-work.mjs` | 360화면·47,682항목: unreviewed 47,623·implemented 53·기존 verified 6. 새 verified 없음 |
| 독립 파일 SHA-256 비교 | board-server 245개·messy-server 313개 파일이 작업 전과 모두 동일. 새 서버 파일도 없음 |
| 삭제 참조·공백 검사 | 현행 course·도구에서 이전 CSV 안내·생성기/검증기 참조·local_infile 없음. 삭제한 파일 20개 부재, 수동 변경 원본 14개에 후행 공백 없음. 생성된 구현 예시 코드의 원문 공백은 보존 |

빌드·테스트 환경에는 `GIT_OBJECT_DIRECTORY=/private/tmp/sql-redesign-objects`, `GIT_ALTERNATE_OBJECT_DIRECTORIES=/Users/ds/code/javaExperience/.git/objects`를 지정해 생성기의 임시 객체가 공유 .git에 쓰이지 않게 했다. 빌드에는 설치된 ARM esbuild의 `ESBUILD_BINARY_PATH=/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/node_modules/@esbuild/darwin-arm64/bin/esbuild`를 지정했다. Git 명령을 직접 호출하지 않았고, 요청한 기존 빌드·테스트 도구가 내부에서 읽는 이력과 임시 fixture 작성은 그대로 사용했다. 생성 HTML·일자 Markdown은 손으로 편집하지 않았다. 장부는 inventory 생성기로만 갱신했으며 두 서버 코드는 수정하지 않았다.

빌드를 처음 저장소 루트에서 호출한 실행은 package.json 부재로 실패했다. 요청한 `tools/site` 디렉터리로 바로잡은 빌드가 exit 0인 결과만 위 표에 기록했다. SQLite bulk 검사 초기에는 테스트 어댑터가 DROP TEMPORARY TABLE 표기를 변환하지 못해 실패했고, SQLite용 변환을 보완한 뒤 2/2 통과했다. 원본 MySQL SQL의 오류로 취급하지 않는다.

세션 로그는 `/private/tmp/sql-redesign-build.log`, `/private/tmp/sql-redesign-course-tests.log`, `/private/tmp/sql-redesign-home.log`, `/private/tmp/sql-redesign-inventory.log`에 있다. 임시 로그를 영구 증거로 의존하지 말고 위 명령으로 재실행한다. 실제 MySQL 실행과 실측 계획은 이 표에 포함되지 않는다.
