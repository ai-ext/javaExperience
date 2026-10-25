# D11 격리 proof 구현 기록

작성일: 2026-10-25 (KST)
범위: D11 제품 UI 전 단계의 Python/SQLite proof와 loopback 브라우저 fixture 준비

## 파일

- `source-proof/sqlite_proof.py`: 임시 `:memory:` SQLite에 합성 주문 2건을 넣고 소유자 조건, ID-only 조회, UUID+소유자 조건, 문자열 연결/값 바인딩, 정렬 allow-list를 실행한다. 프로그램 내부의 고정 `EXPECTED` 값과 실제 결과를 별도로 비교하며, JSON의 `actual`·`expected`, SQL·bind 배열·행 배열을 함께 출력한다.
- `source-proof/sqlite_runner.py`: proof 프로세스를 별도로 시작해 Python 실행 경로와 argv, proof/runner SHA-256, stdout·stderr·종료 코드를 `proof-logs/`에 기록한다. 실행 중인 proof 파일 자체가 결과를 바꾸는 자기참조 기록을 피한다.
- `source-proof/browser_fixture.py`: `127.0.0.1`의 서로 다른 ephemeral port 두 개에 페이지 A와 API B를 연다. 시작 즉시 실제 URL·PID·정책을 JSON 한 줄로 출력하고 flush한다. Ctrl+C에서 두 server를 닫는다.
- `source-proof/smoke_test.py`: 표준 `http.client`로 별도 fixture 프로세스를 띄워 HTML/헤더/수신 카운터/종료와 JSONL을 확인한다. 브라우저의 CORS 강제나 DOM 클릭 동작은 검사하지 않는다.
- `proof-logs/`: 실행 JSON과 API가 수집한 통제 이벤트 JSONL을 둔다.

## 재현 명령

저장소 루트 기준:

```bash
python3 docs/design/d11-2026-10-25/source-proof/sqlite_runner.py
python3 docs/design/d11-2026-10-25/source-proof/smoke_test.py
```

브라우저 담당자는 실제 CUA 확인 때 fixture를 별도 터미널에서 직접 시작할 수 있다. 브라우저 확인 후 Ctrl+C로 종료한다.

```bash
python3 docs/design/d11-2026-10-25/source-proof/browser_fixture.py --port-a 0 --port-b 0 --events-file /tmp/d11-browser-events.jsonl
```

시작 JSON의 `pageURL`을 열고 네 개의 CORS 버튼과 두 개의 DOM 버튼을 각각 눌러 확인한다. 이 준비 작업에서는 이 명령으로 server를 장시간 실행하지 않았다.

## 관측 결과

2026-10-24 16:12 UTC 실행에서 Python `3.14.3`, SQLite `3.53.0`을 사용했다.

- SQLite: user 7의 소유 주문은 `1002/7`; ID-only 조회는 `1003/8`; `owner_id=7`을 붙인 ID와 UUID 조회는 빈 배열이다. 가짜 title 입력 `"' OR 1=1 --"`은 문자열 연결에서 합성 2행, 동일 문자열의 바인딩과 owner 7 조건에서는 빈 배열이다. `createdAt`은 allow-list로 허용되고 낯선 정렬 문자열은 SQL 실행 전에 거절됐다. owner 7의 정렬 조회는 `1002/7`이다.
- principal 변환은 Python `int("7") == 7`, `int("alice@example.test")`의 `ValueError`를 보조 예시로만 기록했다. Java `Authentication` 또는 Spring 실행 결과가 아니다.
- 브라우저 fixture smoke: 두 loopback server를 시작하고 종료했다. 페이지 응답/합성 Set-Cookie/버튼 표식, denied OPTIONS `1/POST 0`, allowed OPTIONS·POST `1/1`, simple POST `0/1`, wildcard credentials 헤더 및 cookie 이름 존재 boolean을 확인했다. control-plane GET은 JSONL에 들어가지 않았고 JSONL에는 OPTIONS/POST 이벤트 5개만 있다.

로그:

- SQLite: `proof-logs/sqlite-proof-20261024T161249Z.json` — source SHA-256 `8af9d011896e7049f291bed9849c0ec12db8233be3fbaf0a892e9a2afa720d6e`, 종료 코드 0, stderr 비어 있음.
- HTTP fixture smoke: `proof-logs/browser-fixture-smoke-20261024T161336Z.json` — fixture SHA-256 `942907a6b3648c45ddb0270c0d625f9f302982f04688534dd99caedba0501163`, 종료 코드 0.
- 해당 smoke 이벤트: `proof-logs/browser-fixture-smoke-events-20261024T161335Z.jsonl`.

## 범위와 한계

- 두 loopback port는 서로 다른 origin이지만 같은 loopback host이므로 같은 site 범위다. 이 fixture는 cross-site CSRF 공격 재현이 아니다.
- `http.client` smoke 결과만으로 브라우저가 CORS 응답을 차단하거나 DOM을 실제 표시했다고 판정할 수 없다. 네 개 CORS case와 textContent/innerHTML DOM 결과는 부모 담당자가 실제 브라우저에서 확인해야 한다.
- SQLite 결과는 추가 Python/SQLite 격리 실행이다. MySQL, JPA, JDBC driver의 server-side prepare 동작을 증명하지 않는다.
- 기존 Java/Spring learner, 기존 DB·서버, global settings, frozen/history, 기존 proof, `AGENTS.md`, `RESUME.md`, 제품 HTML은 변경하지 않았다.
