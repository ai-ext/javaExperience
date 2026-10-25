# D11 격리 proof 독립 Sol 검토

2026-10-25 KST. HEAD `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`. 명세 검토를 먼저 PASS로 기록한 뒤 quality를 별도 실행했다. 결과는 **spec PASS / quality PASS, C/I/M 0/0/0**다. 범위는 추가 격리 proof이며 UI/images는 제외한다.

1. 원문 314줄 SHA `a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba`, PLAN/SPEC, 원문·공식 리서치 보고서, source-proof 4개, 구현 기록과 최초 실행 로그를 대조했다. 최초 로그의 proof/runner/fixture/smoke SHA는 현재 바이트와 모두 같다.
2. reviewer 기대값을 실행 전에 별도 고정했다. 현재 native Python `3.14.3`, SQLite `3.53.0`에서 원 proof를 직접 재실행해 stdout/stderr/argv/SHA를 기록했다. reviewer 소유 `:memory:` DB의 합성 2행으로 exact SQL/binds/result 7개를 재실행했다. ID-only 타 소유 행/owner predicate 빈 결과/UUID alias+owner 빈 결과, 연결 시 2행/동일 값 바인딩 시 빈 결과, 정렬 allow-list 허용 및 미허용 입력의 SQL trace 증가 0을 확인했다. 숫자 principal 변환은 Python 추가 예시라는 경계가 유지된다.
3. 소스를 디스크에 고치지 않고 expected만 9999로 바꾼 경우와 실제 합성 owner만 9로 바꾼 경우를 별도 프로세스에서 실행했다. 둘 다 실제 assertion 실패로 종료했다. actual과 expected를 서로 복사해 통과시키는 구조가 아니다.
4. 자기소유 Python fixture 프로세스에 loopback ephemeral 두 포트와 임시 이벤트 파일만 주었다. `http.client`로 simple POST, denied OPTIONS, allowed OPTIONS→POST, credentials wildcard 헤더/응답/원래 case 카운터를 각각 검증했다. 원래 case 이벤트 5개, 별도 Origin 불일치 반례 2개, 통제용 GET 이벤트 0개다. cookie 원문을 기록하지 않고 전용 합성 이름 존재 boolean만 남겼다. 정상 종료 0, 소유 두 포트 닫힘 및 임시 이벤트 원본 삭제를 확인했다.
5. HTTP로 받은 실제 fixture 페이지를 JSDOM에서 실행해 `<b>주문1002</b>`의 textContent literal/자식 0개와 innerHTML B 노드 1개를 확인했다. 실행 공격 코드는 없다. fetch mock의 서버 수신 숫자를 17/19, 응답 status를 201, 본문을 reviewer 표식으로 바꾼 8가지 전달 검사는 **mock 데이터 흐름 검사**로 명시했다. 이를 실제 HTTP/CORS 관찰값으로 부르지 않는다. JS는 실제 fetch 예외/응답, 관측 API 및 DOM getter에서 값을 얻고, 기대 숫자를 관찰값 상수로 넣지 않는다. 고유 nonce 8개와 reset/case/observations 순서를 확인했다.
6. 기존 dirty 2개, 역사 proof 1366개, 초기 review 24개, 원문135개, learner17개는 해당 baseline/HEAD 대비 해시 불일치 0개다. source-proof 4개도 변경하지 않았다. 기존8765/8766/8769 서비스, 기존 DB·학습자·글로벌 설정·기존 proof를 조작하지 않았다. 커밋/push/외부CLI/다른LLM 위임은 없다.

실제 Chrome CORS 강제와 실제 화면 DOM 검증은 부모 담당자의 별도 관문이다. 이 검토는 부모 브라우저 결과에 의존하지 않는다. Spring Boot4.1.1/Java25 원문, MySQL/JPA/JDBC server prepare, HSTS 브라우저 상태, 실제 키 회전, SCA/CVE 및 비밀번호 성능은 실행하지 않았다.

검토 JSON: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-review.json

명세 기록: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-logs/attempt1/01-spec-review.json

quality 기록: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-logs/attempt1/09-quality-review.json

raw·재실행 스크립트: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-logs/attempt1

## 추가 비교 proof 2건 검토

추가 범위만 별도 **spec PASS → quality PASS, C/I/M 0/0/0**다. 승인 소스는 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/source-proof/sqlite_compare_addendum.py`와 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/source-proof/sqlite_compare_addendum_runner.py` 두 개이며, source SHA는 `b947c0a9a8ef71be708ddec9a38a77c95796ace5f33a2a17f830efdda6fb5e1a`다. 기존 승인 소스 4개와 기존 실행 로그의 변경은 0건이다.

기대값을 실행 전에 고정한 뒤 native Python 3.14.3/SQLite 3.53.0에서 독립 재실행했다. reviewer 소유 새 `:memory:`의 동일 합성2행으로 exact SQL/binds를 실행해 ID-only1002는 `[{"id":1002,"owner_id":7}]`, UUID-only1003는 `[{"id":1003,"owner_id":8}]`를 얻었다. 기존 own-scoped1002의 동일 행과 UUID+owner7의 빈 결과도 독립 DB에서 대조했다. 입력 행은 기존 proof의 합성행과 정확히 같다.

expected만 바꾼 반례 2개와 actual seed owner만 바꾼 반례 1개는 모두 실제 assertion 실패로 종료했다. 원 runner는 디스크 수정 없이 `runpy`로 로드하고 기록 폴더의 메모리 바인딩만 reviewer 산출물로 돌려 실행했으며, 실제 subprocess stdout/stderr/argv/sourceSHA/runnerSHA 기록을 확인했다. 추가 source/runner/최초 로그와 이전 승인 산출물은 검토 전후 해시 불일치 0개다.

이 승인은 비교 관측2개만 추가한다. 제품 UI·이미지 정합의 최종 승인이 아니며, 브라우저·Git·외부CLI·다른모델을 호출하지 않았다. 실제 Spring/Java/MySQL/JPA/JDBC 실행으로 확대하지 않는다.

추가 spec: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-logs/addendum/01-spec-review.json

추가 quality: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-logs/addendum/08-quality-review.json

추가 raw/재실행 스크립트: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/proof-sol-logs/addendum
