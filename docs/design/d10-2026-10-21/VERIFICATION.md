# D10 DB 기초 — 개념 화면 부분 보강 검증

확인일: 2026-10-21. 별도 `docs/concept-learning-night` worktree의 로컬 변경이다. 전체 개념 학습 작업의 24번째 부분 기록이며, 전체 작업 완료나 학습자 이해 인증이 아니다. 원문과 학습자 서버 구현은 보존했다.

## 구현과 근거

15개 질문에 44개 상태를 연결했다. 추가 SQLite 실행과 연결된 상태 22개, 미실행 문헌 모델 18개, 보존한 미실행 원문 4개를 구분한다. 현재 SQL·조건·행·관찰 시점과 관련 코드 강조를 기본 노출하고, 원문·긴 기록은 접어 둔다. 코드에는 실제 파일의 연속 구간 또는 정확한 모델 JSON을 사용했다.

| 질문 | 상태 | 근거와 검증 범위 |
|---|---:|---|
| 관계와 신청 사실 | 3 | 관계 모델, 원문 PG DDL, 추가 SQLite seed를 분리 |
| PK·업무 UNIQUE·FK·NOT NULL | 5 | 잘못된 쓰기 13회 거부, 각 savepoint rollback 후 전체 seed 유지 |
| UNIQUE와 NULL | 2 | 별도 nullable toy의 NULL 2행, required toy의 NULL·중복 거부; PG/MySQL은 문헌 |
| 후보키·2NF·3NF | 3 | 모든 후보키, prime attribute 예외, 함수 종속과 이력 가격의 의미를 명시한 모델 |
| ON·WHERE·HAVING | 3 | 추가 중간 ON 결과 3고객, WHERE/최종 HAVING은 고객1; 고객 날짜만 필터 |
| 최근 주문 EXISTS | 2 | 상태 필터가 없어 최근 CANCELLED를 가진 고객2도 포함 |
| 조건부 변경 | 2 | 주문501 UPDATE 1행, 재적용0행, CANCELLED DELETE0행, 최종 PAID 행 조회 |
| 두 연결의 가시성 | 3 | WAL의 미커밋20/다른 연결10, commit 뒤20, 기존 snapshot20/종료 뒤30 |
| writer 경합·rollback·guard | 3 | timeout0의 SQLITE_BUSY(5), rollback 후30, 별도 stock5/qty3 순차 guard1→0/최종2 |
| 인덱스 전후 | 3 | 별도512행의 SCAN→SEARCH→drop SCAN→복원 SEARCH, 같은14행·순서 |
| 계획·복합키·INCLUDE | 3 | PG 문헌 모델; 추정 cost/출력 rows와 실제 시간 구분, skip scan/visibility 조건 |
| 격리수준·deadlock | 4 | PG RC/RR·InnoDB 읽기 유형·순환 대기 모델; 실제 해당 엔진 실험 없음 |
| 풀·복제·샤딩 | 3 | 명시 산술93/가용100/예비포함113, 6인스턴스 대안133/예비포함153/상한초과33; 비동기 지연 |
| 제품·NoSQL | 2 | 접근 패턴과 제품 조건; MongoDB validation/트랜잭션을 모든 NoSQL에 일반화하지 않음 |
| 원문 환경 경계 | 3 | PostgreSQL18/MySQL8.4/Docker/Java25/JDBC 명령·설정은 미실행 |

`source-proof/checkpoints/expected-execution.json`은 27개 native CHECK와 6개 미실행 모델을 고정한다. CHECK는 고유 assertion ID이며 27개의 독립 실험이나 44개 상태 전부의 실행 PASS가 아니다. 원문 13block과 별도 fixture 9파일은 변경하지 않았다.

- frozen SHA256: `b9c9093ddb903e13afd3769ac095a7948fcc76fc3b5d94fa23950a50e1856afe`
- runner SHA256: `8341779128856983ae5cb9b3a86e0b8dd628970f1e880432aa916d40511c1c66`
- 메인 새 실행: `/Users/ds/research/javaexperience-d10-20261021/_data/main-runtime/run-lmzoevsf`
- 이전 독립 사본 실행: `/Users/ds/research/javaexperience-d10-20261021/_data/reviewer-runtime/run-byelj6w2`

작성자·메인 새 실행·이전 독립 사본의 전체 frozen이 일치했다. raw wrapper SQL 688행과 trace callback 688항목, 시점 marker 4개는 서로 다른 기록이다. 네트워크 SQL 수나 I/O 측정으로 부르지 않는다. 새 0700 runtime의 SQLite 파일4개·fixture 연결5개만 사용했고 모든 연결의 foreign_keys=1, 빈 foreign_key_check, integrity ok, 종료를 확인했다. 원문 PG/MySQL 명령, 기존 DB·practice 데이터·서비스 포트는 사용하지 않았다.

## 리서치·이미지

기존 연구를 먼저 읽고 Codex CLI 0.163.0의 직접 `gpt-6-luna`/OpenAI를 검증해 조사했다. LiteLLM·profile·모델 전환·중첩 위임은 없다. 조사 exit0/완료 웹 호출9개, 출처24개이며 메인은 공식 자료28페이지를 직접 대조했다. 조사자의 URL open 시도35/성공34/실패1과 웹 호출9는 다른 수치다. 실패한 정규화 PDF 대신 실제 UTA 원문을 확인했다.

메인 정정: 원문18533은 Unicode 문자 수이며 UTF8은31008bytes다. 집계 쿼리의 cutoff는 c.created_at이고 주문/결제 시각 조건이 아니다. MySQL UNIQUE NULL 근거와 MongoDB schema validation 근거는 별도 공식 페이지로 보완했다. PostgreSQL current의 표시와 고정18 문헌을 구분했다. 구체 URL·확인 시점·한계는 `research/main-verification.json`과 원시 조사 자료에 있다.

`gpt-image-prompt` 학습 계약과 실제 imagegen으로31개를 생성했다. 메인이31개를 실제 열람하고15개를 선정했다. 잘못된 FK 연결, 가짜 SQL/열, 저장 행과 거부 시도, 정규화 전후 관계, 관찰 시점, lock/deadlock 경계 등을 재생성으로 고쳤다. 이전 독립 schema 검토 이후 최신 사용자 지시에 따라 추가 설계·핵심 구현·기술 검수는 메인이 수행했다. Luna는 틀 복사, JPG 변환·해시, 명령 실행만 담당했다.

선정15개는 실제 JPEG quality92, 합계9005205bytes이며 원본 PNG는27550090bytes다. 원해상도를 유지했다. 선정 normalization-v3는1671×941, plans-v2는1672×940, 나머지는1672×941이다. draft16개는 미선정이다. 정확한 코드와 값은 선택·복사 가능한 DOM으로 제공한다.

## 브라우저와 보존

Chrome에서44상태×데스크톱1672×941/모바일360×800=88행을 확인했다. 코드의 빈 줄·끝 개행, 강조 줄, 제목·설명·출처, 값, PASS의 범위, full JSON100개, 이미지·alt·실제 크기·focus·zoom, 접기 밖 핵심 내용, document overflow를 대조했다. 최종 대표30캡처를 메인이 모두 실제 열람했고 해당30상태 DOM도 추가 대조했다.

최종 캡처는 desktop1672×819와 mobile360×800이다. 각 JPEG 실제 헤더와 그때의 DOM viewport가 일치한다. 이전 요청941px이 DOM에는 적용되지만 캡처가819px로 제공된 사례가 있어 최종 desktop을819px로 맞춰 다시 촬영했다. 일부 그림 아래에 치우친 캡처 등 중간90개는 `/Users/ds/research/javaexperience-d10-20261021/_data/browser-capture-attempts/`에 보존하고 코드 저장소에서 제외했다. 미확인 캡처를 최종 비교 증거로 쓰지 않는다.

실제 복사189문자(중간 빈 줄·끝 개행 포함), End→Enter 선택, 마지막 단계 disabled와 focus, 새로고침의 장면 복원, 모바일 다음 이동(이전 이동은 단위 검사), 확대 수동 설정의 resize 유지, 실제 가로 pan6.5px, 원문 열기, 기존 지도 토글, 단계 변경 시 근거 접기를 확인했다. pan 직후0을 읽은 초기 관측은 화면 갱신 후 관측과 분리한다. 뒤로/앞으로는 각 history 항목에 저장된 서로 다른 장면을 복원했다. 같은 장면이어야 한다는 초기 검사 가정은 수정했고 관측을 보존했다.

브라우저 원문 대조: 도표 제외16138문자 정확 일치, code9 정확 일치, id16 보존, 지도1, Mermaid SVG4. 정적 전체 원문17429문자와13원문 fence도 대조했다. 반환 console132항목은 모두 브라우저 확장 출처이고 ownURL0이다. 전체 세션 무오류를 주장하지 않는다.

원문135문서·학습자 서버17파일 SHA가 일치한다. 원본 worktree3403개 중3398개는 처음과 같고 외부 변경5개(.gitignore/AGENTS 및 별도 백업한 private capture3개)는 보존했다. 원본 HEAD도 유지했다. 기존 inventory45233행의 record bytes를 보존했고91개를 추가했다. 신규44상태만 implemented이며 다른 신규47항목은 unreviewed다. 총45324개 중 implemented818/기존 verified6/unreviewed44500이다. parity는 기존715행 prefix bytes 그대로 신규15개를 더한730개이며 verified0을 유지한다.

## 검사와 한계

빌드와 기존 회귀32개가 exit0으로 완료됐다. D10 generated 검사에서 잘못 대소문자를 쓴 `SQLite_BUSY5` 테스트 기대값을 실제 `SQLITE_BUSY5`로 정정한 후 통과했다. 마지막 빌드339개/링크 오류0·신규 D10 검사·3종 감사가 모두 exit0이다. 명령, exit code, 출력은 `checks/final-command-results.json`에 기록한다. 실제 완료한 출력만 성공 근거로 사용한다.

이 작업은 부분 implemented다. 학습자 이해, 모든 원문 의미 장면, 전수 pixel parity는 검증하지 않았다. 대표15상태의 두 viewport 캡처 외29상태에는 DOM 근거만 있다. 원문 PostgreSQL/MySQL/JVM 환경과 실제 행락·deadlock·부하·속도·RPO/RTO·운영 서비스는 실행하지 않았다. SQLite INTEGER/TEXT/NUMERIC은 PG IDENTITY/VARCHAR/TIMESTAMPTZ/NUMERIC 정밀도의 검증이 아니다. sequential guard를 동시 부하/oversell 증명으로 표시하지 않는다.

사용자는 나중에 통합한다. 이 브랜치는 dirty snapshot을 기반으로 하므로 전체 history를 push/merge/cherry-pick하지 않는다. 정리된 공통 기반과 현재 시나리오 빌더를 대조하는 별도 통합 절차가 필요하다. 현재는 로컬 커밋만 만들며 원격 push·PR·merge는 수행하지 않는다.
