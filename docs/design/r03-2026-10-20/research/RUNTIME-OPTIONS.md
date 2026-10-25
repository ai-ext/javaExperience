# MySQL 8.4 portable macOS ARM64 실행 경로

**조사일:** 2026-10-20 · **대상만:** Oracle MySQL Community Server 8.4 LTS 공식 portable TAR, macOS 15 ARM64.

## 공식 배포물 확인

- [MySQL 8.4 다운로드](https://dev.mysql.com/downloads/mysql/8.4.html) 페이지 검색 결과에 `mysql-8.4.11-macos15-arm64.tar.gz`, macOS 15 ARM 64-bit, Compressed TAR Archive, 160.2M, MD5 `6e89113f04f2af85d0a164573493db3a`, Signature 링크가 보인다. 8.4.11 LTS는 조사 시점 페이지의 표시 버전이다.
- 페이지의 [Oracle 다운로드 약관/접근 안내](https://dev.mysql.com/downloads/mysql/)에서 별도 로그인·약관 선행 요구 여부는 이 조사 도구로 확인하지 못했다. 목록에 파일명과 체크섬이 표시되는 사실은 다운로드 완료나 파일 URL 검증을 뜻하지 않는다.
- **직접 다운로드 URL 미확인.** 공식 페이지를 열어 macOS 파일 행/버튼의 실제 href를 얻지 못했다. `downloads.mysql.com/archives/community/`는 정상 열렸지만 결과는 필터 없는 기본 화면이었고, `?version=8.4.11` 직접 열기는 접근 불가 응답을 받았다. 따라서 다운로드 URL을 만들어 내거나 확정하지 않는다. MD5는 공식 페이지가 표시한 값만 기록했으며 GPG 서명은 서명 링크 존재만 확인, 키/서명 검증은 안 했다.

## portable 경로의 안전 설계

공식 [macOS 설치 문서](https://dev.mysql.com/doc/refman/8.4/en/macos-installation-pkg.html)는 pkg 설치가 고정 경로에 설치된다고 설명한다. 그러므로 이번 대상은 pkg가 아니라 위 목록의 TAR여야 한다. 공식 [데이터 디렉터리 초기화 문서](https://dev.mysql.com/doc/refman/8.4/en/data-directory-initialization.html) §§2.9.1와 [서버 시작 문서](https://dev.mysql.com/doc/refman/8.4/en/starting-server.html) §§2.9.2가 옵션 근거다.

사용자 승인 후 메인이 실행 여부를 판단할 때의 설계 예시다. 아래는 실행되지 않은 계획이며 경로는 설명용 placeholder다.

```sh
tar -xzf mysql-8.4.11-macos15-arm64.tar.gz -C "$PRIVATE_ROOT"
MYSQL_HOME="$PRIVATE_ROOT/mysql-8.4.11-macos15-arm64"
DATADIR="$PRIVATE_ROOT/data"
SOCKET="$PRIVATE_ROOT/mysql.sock"
mkdir -p "$DATADIR"

"$MYSQL_HOME/bin/mysqld" --no-defaults \
  --basedir="$MYSQL_HOME" --datadir="$DATADIR" \
  --initialize-insecure

"$MYSQL_HOME/bin/mysqld" --no-defaults \
  --basedir="$MYSQL_HOME" --datadir="$DATADIR" \
  --socket="$SOCKET" --skip-networking \
  --mysqlx=0

"$MYSQL_HOME/bin/mysql" --no-defaults \
  --protocol=SOCKET --socket="$SOCKET" -u root
```

`--no-defaults`는 MySQL program options 규칙상 프로그램 실행 시 첫 번째 옵션이어야 하므로 예시 순서를 유지한다. 초기화는 빈 전용 datadir에만 수행한다. `--initialize-insecure`는 빈 암호 root를 만든다고 공식 문서가 경고하므로 이 방법을 선택하면 임시 격리·서버 중지·삭제까지 통제되어야 한다. `--skip-networking`은 TCP/IP 수신을 끄고 Unix socket 접속만 남긴다. `--mysqlx=0`는 X Plugin을 끈다. 실행 시그니처·옵션 호환성은 문서 근거이지 실제로 검증한 결과가 아니다.

이 경로를 쓰게 되면 원본 SQL을 별도 복사해 전용 인스턴스에서만 실행한다. `schema.sql`에 `DROP DATABASE IF EXISTS ds_practice`가 있으므로 기존 사용자 DB 연결은 금지한다. 현재 저장소에 `ds_practice`가 없다는 사실만으로 다른 MySQL 인스턴스가 없다고 판단하지 않는다. 독립 datadir, socket, `--no-defaults`를 세션/명령에서 다시 검증해야 한다.

## 확인하지 않은 사항

- 파일 다운로드, checksum 계산, 서명 검증, 압축 해제, 실행 비트/동적 라이브러리 호환성.
- `mysqld --initialize-insecure`, server 시작 및 socket 클라이언트 접속.
- 실제 서버의 X Plugin/네트워크 바인딩 상태와 SQL 동작.
- archive에서 특정 8.4 버전 macOS 15 ARM64 파일을 직접 선택할 수 있는지.

PyMySQL이 필요하다면 공식 문서는 `unix_socket` 인자가 Unix socket 접속 용도라고 기술한다([PyMySQL Connection Object](https://pymysql.readthedocs.io/en/latest/modules/connections.html), 문단 25–27). 이 문서 확인은 드라이버 설치나 연결 실행을 뜻하지 않는다.
