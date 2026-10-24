# L-H9. H9. CSV 내려받기와 시간 다루기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/H9-csv-and-time.md](../../../../../lessons/H9-csv-and-time.md)

원문 SHA-256: `f3fdc5a588b29f839882ec2dfa3fd05b0093e708cc4edf87ad551e0ddfd75ef8`

## 판정

바이트/CSV parsing과 spreadsheet 동작, wall-clock/instant와 session timezone을 다른 관찰로 분리한다. Excel 및 대량 export는 H9에서 검증되지 않았고 linked 13-6/확장 실험으로 이어진다.

## 목표·선수 지식·학습자 작업

CSV 응답의 UTF-8/BOM, Content-Disposition, 따옴표 규칙, 스프레드시트 수식 처리와 LocalDateTime/Instant/offset/zone, Clock, MySQL DATETIME/TIMESTAMP/session timezone을 연결한다.

문서 안의 Csv cell/safeCell/controller, synthetic rows, Python csv parse, fixed Clock JSON 및 MySQL timezone 명령을 수행한다. 원문은 Excel을 열어 보지 않았다고 명시한다. lesson-specific runnable project/test는 repo에 없다.

## 요구·구현·검사 대조

### 1. CSV는 UTF-8 bytes/BOM/header, filename*, RFC-style quoting/CRLF 및 formula cell 처리를 포함하고 parser round-trip으로 shape를 확인한다. 고정 instant와 JVM/DB session timezone에서 time type별 차이를 관찰한다.

구현 대조: 원문 저자 관찰은 7행×3열 Python CSV round-trip, efbbbf BOM, quote/comma/newline/formula sample, fixed Clock JSON, DATETIME/TIMESTAMP의 +09/+00 session 출력이다. Excel test는 수행하지 않았다.

검사 대조: Python csv reader와 MySQL session 명령 결과가 출력돼 있지만 lesson 전용 JUnit/실행 프로젝트는 없다. 실제 scenario 13-6에는 ReportCsvServiceTest 및 수동 Excel/Postman check가 문서에 있다. 이번 감사는 이를 실행하지 않았다.

공백 또는 한계: 예시는 전체 CSV를 StringBuilder/byte[]로 만들고 large export heap/connection lifetime을 측정하지 않는다. formula mitigation은 spreadsheet app별 차이가 있으며 source도 Excel 미검증/재저장 한계를 밝힌다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H9-csv-and-time.md](../../../../../lessons/H9-csv-and-time.md) — 1~274행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DATETIME은 wall-clock 값, TIMESTAMP는 세션 시간대 기준 변환을 보여 준다. LocalDateTime에 zone 정보가 없고 JVM default와 database session/driver zone은 독립 설정이다. 캐릭터 데이터는 bytes/header와 CSV parser, spreadsheet application 동작을 따로 검증해야 한다.

- 현재 난이도: 독립 개념 레슨(파일 전송·시간 타입 기초)
- 판정 이유: 짧은 synthetic dataset으로 CSV serialization과 instant/wall-clock 해석을 연결한다.
- 다음 단계: 13-6은 운영자 권한 CSV, tests 및 수동 Excel 확인; W20/13-1/13-3/15-1은 timezone/Clock 업무 계약으로 연결한다. H2는 filename*를 먼저 소개한다.

## 부족한 점

### L-H9-G1 · medium

Python csv parse는 CSV 문법을 확인하지만 Excel formula execution, locale/제품 차이, 저장 후 재열기 동작을 증명하지 않는다. StringBuilder/byte[] example도 large export memory를 검증하지 않는다.

판정 범위: source는 Excel을 열지 않았고 StreamingResponseBody는 후속이라고 명시한다. 이를 확인 성공으로 포장하지 않고 13-6/운영 확장에 남긴다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H9-csv-and-time.md](../../../../../lessons/H9-csv-and-time.md) — 90~142행
- [$WORKTREE_ROOT/concept-census-20261021/lessons/H9-csv-and-time.md](../../../../../lessons/H9-csv-and-time.md) — 177~207행

## 확장 개발 명세

### CSV parser와 spreadsheet/timezone 소비 결과 분리 확인

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

RFC 형식이 맞는 것, Excel에서 한글이 보이는 것, 수식 문자열이 실행되지 않는 것, 대량 export가 안전한 것은 서로 다른 검증이다. 시간 serialization도 JVM/driver/session zone을 포함한다.

**시작 상태**

7개 synthetic row, isolated practice table lesson_h9_time, MySQL version/session timezone 및 JVM 기본 timezone을 기록한다. 결과 파일은 repo 밖에 둔다.

**학습자가 할 일**

- BOM on/off로 CSV 다운로드를 받고 Content-Type, filename*, 처음 3 bytes 및 UTF-8 text를 기록한다.
- Python csv로 7 row/3 columns round-trip을 검사한다. 쉼표, quote, embedded newline이 포함된 필드 값을 원본과 비교한다.
- =,+,-,@,TAB,CR,LF 및 전각 formula prefix 값을 각각 저장하고 serialized cell을 확인한다. 이를 spreadsheet 실행 test와 혼동하지 않는다.
- 보안 acceptance가 필요하면 target Excel/Numbers 버전에서 직접 열어 BOM/no BOM, formula cell, save/reopen 뒤 값을 관찰하고 제품/버전을 적는다.
- Clock을 2026-10-10T05:30:00Z에 고정해 Instant, LocalDateTime, OffsetDateTime, ZonedDateTime 및 JSON 지역 정보 유무를 비교한다.
- MySQL session +09에서 insert/select하고 +00에서 다시 읽어 DATETIME/TIMESTAMP를 기록한다. global/system/session zone과 2038 경계도 별도 확인한다.
- 대량 조회 확장은 chunk read/stream write로 바꾸고 peak heap/DB connection lifetime을 측정한다. byte[] sample을 대량 대응으로 간주하지 않는다.

**정상 사례**

- Python parser에서 7행 3열이 회복되고 delimiter/quote/embedded newline이 원문으로 돌아온다.
- 같은 Instant는 유지되고 LocalDateTime은 선택한 Clock zone에 따라 달라진다.
- 같은 DB row에서 DATETIME display는 유지되고 TIMESTAMP display는 session timezone 변경에 따라 바뀐다.

**실패·경계 사례**

- quote/comma/newline escape가 잘못되면 column 또는 record boundary가 깨진다.
- BOM/header charset와 실제 bytes encoding이 다를 수 있다.
- apostrophe-prefix formula defense는 spreadsheet product 및 save/reopen 과정에서 달라질 수 있다.
- JVM/driver/session timezone 불명은 값의 해석이 어긋나게 한다.
- 전체 export를 StringBuilder/byte[]로 만들면 응답 크기만큼 memory를 쓴다.

**동시성·성능**

H9에는 대량 데이터 성능 측정이 없다. 13-6도 메모리 생성 구현 한계를 서술하며 StreamingResponseBody/chunk read를 후속으로 둔다.

**DB 관찰**

- 응답 headers, raw BOM bytes, parsed rows/columns와 개별 cell.
- 대상 spreadsheet 제품/버전 및 열기·저장·다시 열기 결과.
- JVM zone, 주입된 Clock zone, MySQL global/system/session zone 및 두 타입 조회값.
- Streaming 확장에서는 행 수, peak heap, DB connection/transaction 지속 시간.

**합격 기준**

- 7개의 synthetic row가 3개 column으로 parser round-trip되고 exact quoted values가 일치한다.
- Excel/formula safety는 실제 지원 target app으로 확인한 경우에만 verified라고 기록한다.
- JVM/driver/MySQL session timezone을 명시한 상태에서 time value 변환을 설명한다.
- large export 성능은 별도 streaming 실험 전에는 미검증으로 남긴다.

**기존 과제와 중복·연결**

13-6은 report download/authorized CSV tests를, H2는 filename*를, W20/13-1/13-3/15-1은 time/Clock contract를 담당한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H9/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H9/screen.jpg`)
- 관찰: HTML 및 캡처를 열어 보지 않았다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H9/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H9/dom.txt`)

- source: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/H9-csv-and-time.md](../../../../../lessons/H9-csv-and-time.md)
- source_same: 예
- html: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/H9-csv-and-time.html](../../../../../lessons/H9-csv-and-time.html)
- html_same: 아니오
- difference: source는 corpus상 동일. HTML 차이 원인과 실제 화면은 미검토.

- 저자 실행 로그는 원문에 기록된 과거 관찰이며 이번 감사에서 실행하지 않았다.
- CSV/time 외부 근거는 2026-10-22에 확인해 sources/lessons-h.md에 기록했다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H9-csv-and-time.md](../../../../../lessons/H9-csv-and-time.md) — 1~274행 (CSV/time 원리, 코드, byte/JSON/SQL 관찰, 고의 오류와 후속 경로)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-H9.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-H9.json`)
