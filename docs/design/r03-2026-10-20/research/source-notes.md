# R03 조사 원자료 노트

**확인 시각:** 2026-10-20 (Asia/Seoul) · **웹 조사 도구:** 공식 1차 출처 URL을 직접 열고 본문/검색 결과를 읽음. 파일 다운로드·서버 구동·SQL 실행 없음.

## 로컬 자료 직접 열람

- `/Users/ds/research/java-spring/R03-schema-types-constraints.md` — 기존 R03 전체 읽음. DB 타입 표, VARCHAR·인덱스, temporal, NULL/DEFAULT, PK/FK, UNIQUE/CHECK, 단계별 실습/DML과 DDL 관련 설명 확인.
- `/Users/ds/research/java-spring/practice/schema/schema.sql` — 전체 읽음. `DROP DATABASE IF EXISTS ds_practice`, schema 생성과 InnoDB/utf8mb4, PK/FK/CHECK/UNIQUE/DEFAULT, DECIMAL, DATE/DATETIME/TINYINT(1), 각 인덱스 정의 확인.
- `/Users/ds/research/java-spring/practice/schema/seed.sql` — 전체 읽음. `SET NAMES utf8mb4`, 기준일, 여러 테이블 데이터 작성 확인. 실행 안 함.
- 작업 디렉터리 파일 목록 조회에서 javaExperience 현재 저장소 내 `ds_practice` 스키마/seed가 확인되지 않았다. 이는 다른 MySQL 서비스/사용자 DB 부재를 입증하지 않는다.

## 공식 본문에서 직접 확인한 내용

1. [MySQL 8.4 다운로드 페이지](https://dev.mysql.com/downloads/mysql/8.4.html), 브라우저 검색 결과의 macOS 15 ARM64 TAR 행: MySQL Community Server 8.4.11 LTS, `mysql-8.4.11-macos15-arm64.tar.gz`, 160.2M, MD5 `6e89113f04f2af85d0a164573493db3a`, Signature 링크.
2. [MySQL 8.4 Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/), 문단 122, 130: 문서가 8.4.11까지 포함, 생성일 2026-10-01, revision 84959.
3. [macOS native package](https://dev.mysql.com/doc/refman/8.4/en/macos-installation-pkg.html) §§2.4.2 문단 257–303: dmg/pkg 흐름, 설치 경로 변경 불가, `/usr/local` 고정 설치 예시. Portable 경로와 구별.
4. [data directory init](https://dev.mysql.com/doc/refman/8.4/en/data-directory-initialization.html) §2.9.1 문단 305–320, 391–428: `--initialize-insecure`는 암호 없는 root; 초기화는 private data directory 사용 전제. 일반 실행/암호 설정 절차.
5. [CHAR/VARCHAR](https://dev.mysql.com/doc/refman/8.4/en/char.html) §13.3.2 문단 226–231, 260–265; [storage requirements](https://dev.mysql.com/doc/refman/8.4/en/storage-requirements.html) §13.7 문단 319–333: 길이/저장 방식과 문자셋 의존, 바이트 prefix, 행 크기 제한, collation padding 비교.
6. [CHECK](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html) §15.1.20.6 문단 589–598: TRUE/UNKNOWN 허용, FALSE 거부, enforcement clause. [8.0.16 Release Notes](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/news-8-0-16.html): CHECK 구문을 파싱만 하던 상태에서 실제 지원으로 변경.
7. [BOOL/BOOLEAN numeric type](https://dev.mysql.com/doc/refman/8.4/en/numeric-type-syntax.html) §13.1.1 검색 결과 본문: TINYINT(1)의 동의어, 2도 참으로 처리됨. [CREATE INDEX](https://dev.mysql.com/doc/refman/8.4/en/create-index.html) §15.1.15 검색 결과 본문: nullable column UNIQUE index permits multiple NULL.
8. [Foreign keys](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html) §15.1.20.5 문단 643–645, 673–681, 783–788: fixed precision FK column sign/size 호환, 인덱스, RESTRICT 기본 효과, 정의 오류 errno 일부 사례.
9. [CREATE TABLE](https://dev.mysql.com/doc/refman/8.4/en/create-table.html) §15.1.20 문단 798–806: LIKE는 빈 테이블의 컬럼 속성과 인덱스를 기반으로 함. FK 복제 여부는 이 조사에서 §15.1.20.3의 상세 원문 미확인.
10. [implicit commit](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html) §15.3.3 문단 589–597: 목록 DDL은 활성 트랜잭션을 종료하는 COMMIT과 같음, InnoDB CREATE TABLE은 user ROLLBACK으로 되돌리지 못함.
11. [InnoDB limits](https://dev.mysql.com/doc/refman/8.4/en/innodb-limits.html) §17.21 문단 377–383: row format별 key prefix, 16/8/4KiB page key 한계.
12. [date/time](https://dev.mysql.com/doc/refman/8.4/en/datetime.html) §13.2.2 문단 227–235: DATE/DATETIME 범위, TIMESTAMP UTC 범위 및 세션 타임존 변환.
13. [SQL modes](https://dev.mysql.com/doc/refman/8.4/en/sql-mode.html) §7.1.11 문단 637–646: strict mode와 transactional data-change statement 오류·롤백 조건.
14. [internal temporary tables](https://dev.mysql.com/doc/refman/8.4/en/internal-temporary-tables.html) §10.4.4 문단 499–503: TempTable VARCHAR 셀 기반/패딩 없음과 MEMORY fixed row/padding 차이.
15. [skip_networking](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html) 검색결과 본문 문단 4234–4244: TCP/IP 차단, Unix socket 등 local connection만 허용.
16. [PyMySQL Connection Object](https://pymysql.readthedocs.io/en/latest/modules/connections.html) 문단 25–27: `unix_socket`은 TCP/IP 대신 unix socket을 사용.

## 검색만 확인한 결과

- 웹 검색 `site:dev.mysql.com/downloads/file/?id mysql-8.4.11-macos15-arm64.tar.gz`, `site:downloads.mysql.com/archives/get/p/23/file/...`, exact filename 검색을 통해 공식 MySQL 8.4 download page snippet에서 portable 파일명·버전·플랫폼·크기·MD5가 확인됐다. 검색엔진 결과는 페이지 본문의 다운로드 버튼 href 또는 파일 payload가 아니다.
- 공식 다운로드 페이지 일반 open 응답은 첫 Windows 행만 반환했다. 검색결과 스니펫은 macOS 행을 노출했지만 직접 href는 응답에 실리지 않았다.
- 검색 중 archive/community 결과가 버전 선택 없이 최신 버전 화면으로 반환된 적이 있으며, 직접 URL `https://downloads.mysql.com/archives/community/?version=8.4.11` 열기는 “URL ... is not accessible via this tool”로 실패했다. 실패는 해당 버전 파일이 없다는 증거가 아니다.
- `CREATE TABLE LIKE` FK 복제와 정확한 부동소수점 CAST 식 검색은 검색어 일치 없이 끝났다. BOOLEAN/UNIQUE/CHECK 기능 시작점은 공식 검색 결과/릴리스 노트로 확인했다. FLOAT 비교 식은 실행하지 않았다.

## 시도했으나 실패/미확인

- Oracle 다운로드의 실제 tar.gz href, archive 8.4.11 필터 화면, Signature 대상/키 내용을 직접 열 수 없었음. 직접 다운로드 URL을 추측하지 않음.
- 로그인/약관 요구는 페이지에 나타난 정황이 없어도, 해당 흐름을 열 수 없으므로 “필요 없음”으로 결론 내릴 수 없음.
- `VARCHAR(768/769)` UNIQUE/nonunique/prefix DDL, 부호 다른 FK 오류번호, `CREATE TABLE LIKE` 결과, `CAST(0.1...)` 출력, 시간대 변환, CHECK NULL, TempTable/MEMORY 행동은 전부 실험하지 않음.
- 메인 Mac 환경의 사전 점검값(PATH, Homebrew Cellar 위치, Docker 응답)은 사용자 제공 기록을 전제로 보고서에 반영했다. 이번 조사에서 같은 실행파일 탐색을 다시 하거나 Docker를 재시작/호출하지 않았다.
