# L-J2. J2. 마이그레이션은 왜 필요한가

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md)

원문 SHA-256: `2595cf2883ca36b13adde16b6d0f0001db6ba654cdc0afd99def17d20d3599e9`

## 판정

구체적 Flyway 실패 사례를 제시하는 원리 레슨이며 실제 서비스 무중단 DDL·복구를 검증하는 시나리오가 아니다. CRC32는 체크섬 비유로 제한한다.

## 목표·선수 지식·학습자 작업

스키마 변경을 재현 가능한 Flyway migration 이력으로 관리하고 적용 순서와 수정 금지 원칙을 익힌다.

원리를 읽고 예시를 실행하거나 의도한 반례를 만들어 관찰값·실패 원인을 직접 설명한다. 기초 원리 레슨과 서비스 중단 없는 migration 보장은 구분; lock/DDL 알고리즘/복구는 실제 DB/version 별 검증.

## 요구·구현·검사 대조

### 1. 스키마 변경을 재현 가능한 Flyway migration 이력으로 관리하고 적용 순서와 수정 금지 원칙을 익힌다.

구현 대조: J2는 Flyway V1 CREATE TABLE memo(id,content)와 V2 ADD pinned 예시, 동일 버전 재적용의 duplicate-column 실패, V1 내용 변경 checksum mismatch, non-empty schema/history 부재 baseline 오류, 엔티티 pinned와 DB 열 불일치에 따른 ddl-auto validate 실패를 구분한다. 따라하기의 TEMPORARY TABLE+CRC32는 개념 모형이고 Flyway checksum algorithm과 같지 않다.

검사 대조: 문서에는 Flyway 12.4 / Spring Boot 4.1 빈 MySQL lesson_flyway에서 생성한 과거 로그와 임시테이블 SQL 결과가 실려 있다. 레슨 자동 test는 없으며 이번 감사에서 재실행하지 않았다. 실제 S9-1/3/5 실습은 각 단위 코드/검증 범위로 따로 대조한다.

공백 또는 한계: 본문 예제는 한 번의 과거 앱 실행 기록이며 learner가 직접 재현할 프로젝트는 포함되지 않는다. lesson 안내 shell은 studymate-mysql-1을 하드코딩하지만 현재 compose에는 mysql 서비스만 있어 연결 대상 확인이 필요하다. baseline은 비어 있지 않은 잘못된 schema에도 적용될 위험을 별도 실습으로 다뤄야 한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md:1) — 1~284행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

기초 원리 레슨과 서비스 중단 없는 migration 보장은 구분; lock/DDL 알고리즘/복구는 실제 DB/version 별 검증. 기존 연결: 9-1 baseline→9-3 backfill→9-5 expand-contract, 10장 project Flyway와 연결.

- 현재 난이도: 개념 레슨(입문~심화 전이)
- 판정 이유: 스키마 변경을 재현 가능한 Flyway migration 이력으로 관리하고 적용 순서와 수정 금지 원칙을 익힌다.
- 다음 단계: 9-1 baseline→9-3 backfill→9-5 expand-contract, 10장 project Flyway와 연결.

## 부족한 점

### L-J2-G1 · low

읽기 완료와 실제 환경에서 실패 진단 및 수정을 재현하는 것은 별도 acceptance다.

판정 범위: 레슨 하나에 고급 주제 전부를 요구하지 않고, 해당 후속 시나리오를 링크한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md:1) — 1~284행

## 확장 개발 명세

### Flyway 이력·불일치·기준선 오류를 분리 재현

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

적용 순서·checksum·baseline·엔티티 검증은 서로 다른 실패 원인이므로 오류 메시지와 DB 상태를 연결해야 한다.

**시작 상태**

레슨이 설명하는 격리 MySQL lesson_flyway와 Flyway 12.4/Spring Boot 4.1 예시를 기준으로 한다. 현재 repo compose를 쓴다면 service mysql에 연결해 schema/version을 먼저 기록하고 운영/공용 DB는 사용하지 않는다.

**학습자가 할 일**

- 빈 schema에서 V1__create_memo.sql을 적용하고 flyway_schema_history version 1 및 memo.content를 확인한 뒤 V2__add_memo_pinned.sql을 적용해 version 2와 pinned 열을 확인한다.
- V2 ALTER TABLE을 기록 확인 없이 다시 실행해 duplicate column 에러를 확인하고, 정상 실행의 history가 version 2에서 멈춘 사실과 대조한다.
- 적용된 V1의 content 길이를 VARCHAR(200)에서 VARCHAR(500)으로 바꿔 validate를 실행하고 version 1 checksum mismatch를 확인한다. 기존 V1 복원 후 변경을 새 V3로 추가하면 이력이 유지되는지 설명한다.
- memo 테이블은 남기고 history를 제거한 빈 이력 상태에서 시작 오류를 확인한다. baseline-on-migrate의 baselineVersion이 1일 때 V1을 재실행하지 않고 이후 migration만 적용되는지 격리 DB에서 검증한다.
- 엔티티에 pinned를 추가했지만 V2를 빠뜨린 상태에서 ddl-auto validate를 실행해 missing column [pinned]를 확인하고 V2 추가 후 정상 기동을 비교한다.
- 실패 후 schema/history의 실제 잔존 상태를 조회하고 복구는 disposable DB에서만 수행한다.

**정상 사례**

- 빈 DB: V1→history version 1→V2→version 2, 재기동 시 추가 migration 없음.
- 기준선이 V1인 기존 schema: baseline 기록 뒤 V2 이상만 적용되고 기존 데이터 행 수가 유지된다.

**실패·경계 사례**

- 같은 V2 ALTER 반복: pinned 열이 이미 존재해 duplicate-column 오류.
- 적용한 V1 수정: applied checksum과 resolved checksum 불일치로 validate 실패.
- history 없는 비어 있지 않은 schema: baseline 설정이 없으면 Flyway가 non-empty schema/no history로 중단.
- 엔티티만 pinned를 요구하고 DB 열이 없으면 ddl-auto validate가 missing column [pinned]로 중단.

**동시성·성능**

이 기초 레슨은 DDL lock 시간, online DDL, 병렬 배포 안전성, 장시간 backfill 성능을 보장하지 않는다. MySQL 버전과 실제 DDL 조건을 별도 실습에서 측정한다.

**DB 관찰**

- Flyway 버전, MySQL version/schema, flyway_schema_history의 version/script/checksum/success, SHOW CREATE TABLE memo, 각 실패 뒤 transaction/DDL 잔존 상태.
- baseline 적용 전후 행 수와 시작 version; CRC32 예시는 Flyway의 checksum과 같은 알고리즘으로 해석하지 않는다.

**합격 기준**

- 정상 순서 V1→V2에서 버전과 열을 확인하고 재기동에 migration 재실행이 없다.
- V2 중복·V1 checksum mismatch·history 부재 baseline·pinned 누락 validate의 네 오류를 각각 예상 원인과 실제 메시지로 연결한다.
- baseline 전후 데이터 행 수가 같고 적용 시작 버전이 문서 설정과 일치한다.
- 이미 적용한 migration을 고치지 않고 새 버전을 추가하는 원칙을 지킨다.

**기존 과제와 중복·연결**

9-1 baseline→9-3 backfill→9-5 expand-contract, 10장 project Flyway와 연결.

**우선순위**

low

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J2/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J2/screen.jpg)
- 관찰: 레슨 HTML 시각 검토 전
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J2/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-J2/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/J2-why-migrations.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/J2-why-migrations.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/J2-why-migrations.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/J2-why-migrations.html)
- html_same: 아니오
- difference: latest HTML未검토.

- lesson 실행은 하지 않음.
- 브라우저 렌더 미검토.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/J2-why-migrations.md:1) — 1~284행 (개념, 예시, 따라하기, 일부러 틀려 보기 및 확인 문제)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-J2.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-J2.json)
