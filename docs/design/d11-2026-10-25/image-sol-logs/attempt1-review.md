# D11 선정 이미지 독립 검수 — attempt 1

2026-10-25 KST. 선정 14 JPG를 `view_image(detail=original)`로 하나씩 판독했다. **spec PASS / quality PASS WITH MINOR FINDINGS, C/I/M 0/0/3**. 부모가 세 항목을 imagegen으로 교정하기로 결정하여 수정본 재검수를 기다린다. 제품 UI나 학습자 이해도를 통과시킨 판정이 아니다.

전체 품질은 정확한 DOM 코드·수치와 함께 쓰는 PC 다크 학습 시안으로 B+다. 큰 제목과 핵심 레이블, 주문/소유자와 결과는 native1672×941에서 읽힌다. 작은 코드와 범위 본문은 native/확대 판독용이며, 1280/1440에서 실제 표시되는 가독성은 제품 검증 범위다. 전체 코드를 raster만으로 제공하는 구성은 승인하지 않는다.

## 메타·출처

14/14 실제 SHA·bytes·native1672×941·selected/record 동일. raw PNG를 `/usr/bin/sips -s format jpeg -s formatOptions 92`로 재인코딩한 결과가 최종 JPG와 14/14 byte-exact다. Pillow 품질92와의 불일치는 인코더 차이이며 품질 오류가 아니다. selected14와 기록18 중 draft4 미선정도 확인했다.

증거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/image-sol-logs/metadata-and-views.json 및 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/image-sol-logs/attempt1-source-snapshot.json

## 발견 사항

- **D11-IMG-M01 (M)** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-own-order-pc-dark.jpg; native x≈125..143,y≈593..631; 좌측 표 아래 요청한 ID: 1002 상향 지시선. 1002 행은 y≈458..522에 파란색으로 강조되어 있지만 짧은 노란 상향 화살표 끝은 표 하단/1003 행 아래에 머문다. 숫자·강조·쿼리 결과는 모두 1002/7로 정확하다. 교정: 지시선을 제거하거나 1002 강조행에 정확히 연결한다. 재현: 원본 JPG를 native1672×941로 열어 좌측 요청 ID 주석의 화살표와 강조 행을 비교한다.
- **D11-IMG-M02 (M)** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/cors-requests-v2-pc-dark.jpg; 둘째 행 × JavaScript 응답 읽기 열의 POST 미전송. 관측은 OPTIONS1/POST0/fetch실패로 정확하지만, JS 읽기 열의 셀이 전송 여부를 말한다. 마지막 열이 이 행에서만 의미가 달라진다. 교정: 브라우저 전송 열에 OPTIONS와 POST 미전송을 두고 마지막 열에 읽기 불가를 둔다. 재현: CORS 표 네 행의 마지막 열을 비교하고 main-browser-cors.json case=preflight-denied를 확인한다.
- **D11-IMG-M03 (M)** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/sql-boundary-pc-dark.jpg; native x≈55..786,y≈395..438; 좌상단 where = 조립 표현. 확대 판독에서 title = 뒤 quote 묶음이 두 double-quote처럼 읽힌다. 작은따옴표와 문자열 경계를 명료하게 구분하기 어렵다. 실제 Python 소스와 동일한 문장도 아니다. 설명용 조각이며 native code가 아니라는 계약 때문에 실행 결함으로 분류하지 않는다. 교정: 정확하고 짧은 유효 조립 표현으로 다시 생성하고, 실제 proof 발췌·bind값은 별도 DOM에 제공한다. 재현: 원본과 판독용 2배 crop을 비교한다. source-proof/sqlite_proof.py:79-84의 실제 f-string/바인딩과 그림의 설명 조각을 구분한다.

## 개별 판독

- **object-ownership · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-ownership-pc-dark.jpg — 1003/owner8, current7, ID-only 행1003/8, owner-scoped [] 일치. SQL literal은 bind를 풀어쓴 설명. 자체 HTTP 미실행 라벨은 DOM에도 상시 표시 필요.
- **request-boundaries · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/request-boundaries-pc-dark.jpg — 주체7/주문1003/소유자8 일치. 경계 지도만 수용. 화살표를 SQL/filter 실행순서로 일반화 금지; 객체권한검사가 조회와 결합 가능하다는 DOM note 필수.
- **principal-mapping · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/principal-mapping-pc-dark.jpg — Long.valueOf(authentication.getName())/name="7"/alice@example.test literal 판독. Java 전제 분석과 Python int 추가 fixture 구분. verified principal→ID7은 별도 검증매핑 예시.
- **csrf-credentials-v2 · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/csrf-credentials-v2-pc-dark.jpg — cookie 자동첨부 조건과 앱 명시 Authorization 구분. HttpOnly를 전송 조건으로 넣지 않았고 SameSite를 사이트 기준으로 표기. 실제 cross-site 재현 아님 표시.
- **cors-requests-v2 · B** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/cors-requests-v2-pc-dark.jpg — 0/1/false;1/0/false;1/1/true;0/1/false 기록과 일치. cross-origin/same-site 표기. M02 열 의미 혼합.
- **sql-boundary · B** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/sql-boundary-pc-dark.jpg — WHERE title = ? AND owner_id = ?, current7, createdAt→created_at, unknown DB실행전 거부 일치. M03 quote 판독 주의. exact proof코드 별도 DOM 필수.
- **output-context · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/output-context-pc-dark.jpg — <b>주문1002</b> literal, textContent B0, innerHTML B1 및 표시 주문1002 일치. script 실행/공격 재현 주장 없음.
- **security-config · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/security-config-pc-dark.jpg — authorize lambda명은 auth와 동등하나 원문 literal 발췌 아님. matcher /actuator/health,/css/**; permitAll/anyRequest.authenticated literal 유효. 원문 Boot4.1.1/Java25·미실행. endpoint 생성과 정책 분리.
- **hsts-boundary · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/hsts-boundary-pc-dark.jpg — learn.example.test, Strict-Transport-Security,max-age=31536000 literal. 신뢰HTTPS→기억정책→HTTP upgrade 모델, 유효인증서/IP제외/하위도메인 운영 주의. 실제 브라우저 상태실험 없음.
- **password-verification · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/password-verification-pc-dark.jpg — fake password123!, H(password,salt,cost), algorithm/cost/salt/hash 메타데이터, 성공로그인 재해시 검토. H는 symbolic pseudo이며 실제 hash/성능/권장수치 없음.
- **secret-log-lifecycle-v2 · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/secret-log-lifecycle-v2-pc-dark.jpg — String key = System.getenv("DEMO_KEY"); / history fake DEMO_ONLY_NOT_A_SECRET / credential=[REDACTED] / NEW_DEMO_KEY 판독. 실제 ENV조회·키회전 없음.
- **dependency-response-v2 · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/dependency-response-v2-pc-dark.jpg — web-app→helper-lib→codec-lib 왼쪽 chain과 중앙 plain component list 일관. 가상 예시/실제CVE스캔아님, 빈 예외등록부 책임자/만료일/근거. 실제 패치성공 주장 없음.
- **object-own-order · B** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-own-order-pc-dark.jpg — GET /orders/1002,current7,1002/7 highlighted, 두 조회1002/7 일치. M01 지시선만 부정확.
- **object-uuid-order · B+** — LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-uuid-order-pc-dark.jpg — 상단/좌SQL/우SQL literal 모두 00000000-0000-4000-8000-000000001003. ID-only UUID→1003/8, owner7 조건→[]; addendum과 원 proof 구분.

## 승인 한계

원문 D11 314줄과 지정 proof 소스·로그를 정적으로 대조했다. raw PNG는 직접 시각 판독하지 않았으며 raw→JPG 일치만 검증했다. 새로운 Java/Spring/HTTP·HSTS·password hash·secret rotation·SCA 실험은 수행하지 않았다. 원문 미실행 분석, 추가 SQLite/브라우저 관측, 설명 모델을 분리한다. 경계 지도는 SQL/filter 실행 순서가 아니며 객체권한 검사가 DB 조회와 결합 가능하다는 DOM note가 필요하다. 정확한 selectable/copyable DOM과 source/evidence 링크, 비실행 표시를 제공하는 명세 조건 안에서의 시안 검수다.

판독 확대 crop은 의미 편집 없는 검수 자료다. 보관 crop은 JPEG92로 저장했고 임시 PNG는 `/tmp/javaexperience-d11-image-sol-inspection`로 이동했다. 제품·manifest·원문·proof 소스·선정 JPG는 수정하지 않았다.
