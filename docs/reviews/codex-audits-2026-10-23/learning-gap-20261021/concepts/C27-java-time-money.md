# C27. 시간·Clock·BigDecimal — 값 의미와 저장 정밀도

판정: **설명·예제 충분·한 계약으로 엮는 실습 필요** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

생성시각·만료경계·금액의 Java/API/DB 표현을 선택하고 정밀도·시간대·반올림으로 생기는 차이를 설명한다. 사용자 목적에서 도출한 프로젝트별 기준이며 보편적인 경력연차 기준이 아니다.

## 읽은 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W20-time-timezone.md:15](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W20-time-timezone.md:15) — 15–35행. 발췌: `## 2. 짧은 답  - 이미 발생한 사건, 감사 로그, 토큰 만료, 결제 승인 시각은 ’Instant’로 표현한다. - 날짜만 의미하면 ’LocalDate’, 지역 시계의 미래 약속이면 ’LocalDateTime’ + IANA ’ZoneId’를 저장한다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W20-time-timezone.md:74](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W20-time-timezone.md:74) — 74–89행. 발췌: `Java 타입이 DB 컬럼 타입을 그대로 결정하지는 않는다. JDBC 드라이버와 Hibernate Dialect가 Java 타입을 JDBC/SQL 타입으로 매핑한다.  Hibernate 7.0 가이드에서 ’Instant’는 ’TIMESTAMP_UTC’, ’LocalDateTime’은 ’TIMESTAMP’, ’OffsetDateTime’은 Dialect에 따라 ’TIMESTAMP’ 또는 ’TIMESTAMP_WITH_TIMEZONE’에 대응한다. 실제 컬럼과 오프셋 보존은 DB 기능 및 Hibernate 저장 전략에 달려 있다.[3] `
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md:68](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md:68) — 68–72행. 발췌: `### 3.4 ’BigDecimal’의 값과 표현  ’BigDecimal’은 ’unscaledValue × 10^(-scale)’로 값을 나타낸다. ’1.00’은 100/scale 2, ’1.0’은 10/scale 1이어서 수치는 같지만 표현은 다르다. ’compareTo’는 수치, ’equals’는 수치와 scale을 비교하므로 테스트와 키 사용에서 차이를 고려한다. `
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md:191](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md:191) — 191–208행. 발췌: `### 2.7 시간과 난수는 작은 의존성으로 넣는다  ’now()’와 ’UUID.randomUUID()’를 정책 코드가 직접 호출하면 경계 조건을 재현하기 어렵다. 시간은 ’Clock’으로, ID는 ’Supplier<UUID>’ 또는 ’IdGenerator’로 감싼다. `
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-lesson-data.mjs:210](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-lesson-data.mjs:210) — 210–216행. 발췌: `    id:'numeric-boundary',question:'정수와 금액 연산의 경계는 어디일까요?',source:'§2 연산 보강 · 원문 155줄',     note:'아래 구체 수치는 원문 설명의 경계를 재현한 추가 순수 Java 실행입니다. 실습 API나 DB의 성능 측정값이 아닙니다.',     stages:[       state('division-mod','몫과 나머지','P09-division-mod','정수 나눗셈 7 / 3은 2, 나머지 연산 7 % 3은 1입니다. 정수 나눗셈은 소수 부분을 버립니다.','7 / 3\n7 % 3',[0,1],[['7 / 3','2'],['7 % 3','1'],['결과 타입','이 int 피연산자 예제는 int']]),`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E7-jpa-update-delete.md:239](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E7-jpa-update-delete.md:239) — 239–255행. 발췌: `### ⑥ 작성·수정 시각 자동 입력  ’’’text SQL: insert into lesson_post (author_id,board_id,content,created_at,deleted_at,status,title,updated_at,view_count) values (?,?,?,?,?,?,?,?,?)`

## 현재 커버리지

W20은 Instant/LocalDateTime/ZoneId·DATETIME/TIMESTAMP·Clock·DST와 나노초/DB정밀도를 다룬다. J01은 BigDecimal 문자열 생성·equals vs compareTo·반올림, P09 최신 화면은 double 합과 정확한 십진수를 비교한다. V03은 Clock.fixed, E7은 DB datetime 초 단위 반올림으로 객체와 재조회 시간이 달라진 실제 로그를 보여 준다.

## 남은 학습 공백

자료 부재가 아니라 여러 문서의 규칙을 실제 하나의 API 계약에 적용하는 통합평가가 약하다. 학습자가 createdAt을 “그냥 now()”로 구현하지 않고 누가 정하는 값인지, 만료 경계에서 ==인지, DB 재조회 정밀도 차이를 어떻게 비교할지 설명하는 과제가 필요하다. 금액 기능이 현재 게시판 요구에 없다면 선택 확장으로 두어야 한다.

## 보완 과제와 검증 기대값

게시글 작성/토큰 만료 테스트에서 Clock을 고정하고 경계 직전·동일·직후를 확인한다. 같은 시점을 UTC/서울로 표현한 JSON·DB 재조회값을 비교한다. 금액 확장 시 1.0/1.00의 업무동등성과 hash키 사용, 나눗셈 반올림 지점을 명시한다.

기대값: 같은 순간은 표시 timezone이 달라도 의미가 같아야 한다. DB저장 정밀도에 맞춘 재조회 비교를 하고 만료시점 동일 여부 정책을 assertion한다. 금액의 equals=false/compareTo=0 차이를 실제 수치오류로 오인하지 않고 요구정책과 구분한다.

선수 관계: J01 값타입 → C24 equality → V03 Clock → API/DB계약

## 실행 구분과 범위

기존실행근거: W20 JDK21 시간예제, J01 및 P09 숫자예제, E7 MySQL 시각로그. 본 통합과제 이번실행 없음. 원문과 최신 P09/P04 보강을 구분했으며 개념 worktree의 학생소스를 main 최신 구현으로 간주하지 않았다. 본문을 읽지 않은 134개 전체에 동일 판정을 확대하지 않는다.

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
