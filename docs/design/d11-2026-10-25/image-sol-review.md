# D11 선정 이미지 독립 검수 — 최종 attempt 2

2026-10-25 KST. **spec PASS / quality PASS, 현재 C/I/M 0/0/0**. 최종 선정 JPG14장을 모두 `view_image(detail=original)`로 다시 열어 판독했다. 기록21장 중 draft7장은 미선정이다. 첫 검수의 minor3건은 삭제하지 않고 attempt1에 보존했다.

PC 다크 학습 시안 품질은 **B+**다. 제목·핵심 레이블·주문/소유자와 주요 결과는 native1672×941에서 판독 가능하다. 작은 코드·범위 본문은 native/확대 판독용이며, 정확한 selectable/copyable DOM 코드를 함께 제공하는 명세 범위에서 수용한다. 이 판정은 실제1280/1440/1672 UI 렌더링·복사·reader·학습자 이해도 검증을 뜻하지 않는다.

## 수정 재검수

- **D11-IMG-M01 해결** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-own-order-v2-pc-dark.jpg — 1002/7 강조와 두 쿼리→1002/7 결과 그대로, 잘못 남은 상향 화살표 제거 확인. GET /orders/1002, 추가SQLite/HTTP실행아님 라벨 유지. M01 해결. SHA256: `76d05b3419c80fc7198a8955c7c3d1fc4ff4820db1ddc59ef584eb35725dcdf8`.
- **D11-IMG-M02 해결** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/cors-requests-v3-pc-dark.jpg — 거부된 preflight의 전송 셀 OPTIONS(POST 미전송), API OPTIONS만 도착, JS 읽기 불가로 수정. 나머지 세 행 수신/읽기 및 cross-origin/same-site 그대로. fixture 네 결과와 일치. M02 해결. SHA256: `b2900a5611ec6d77a6114e1e169b373647c4a096b22a11b3c19fbbedb23b88fb`.
- **D11-IMG-M03 해결** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/sql-boundary-v2-pc-dark.jpg — 모호한 where quote 조각 삭제, 설명용 표현 배지와 SQL 조각 + 입력값 + SQL 조각으로 교체. 하단 WHERE title의 작은따옴표와 우측 ? 두 값/owner7/createdAt→created_at/DB실행전거부 그대로. 비코드 모델과 exact proof DOM 분리 명확. M03 해결. SHA256: `44b89a89d4532aece98f1ee4f59c6502bd3f65b12fe869480da881b418b0fc2f`.

## 출처·형식 검증

최종14/14 actual SHA·bytes·native1672×941·selected/record가 일치한다. 각 참조 raw PNG를 `/usr/bin/sips -s format jpeg -s formatOptions 92`로 다시 변환한 JPG가 선정 JPG와 14/14 byte-exact다. 원문 D11 314줄, 기존 proof 소스 및 지정 로그는 attempt1 SHA와 모두 동일하다. SPEC의 v2 한정 잔존 문구가 선정한 최신 수정본으로 바뀐 것도 실제 문장에서 확인했다.

최종 메타·실제열람 목록: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/image-sol-logs/attempt2-metadata-and-views.json

출처 snapshot: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/image-sol-logs/attempt2-source-snapshot.json

첫 판정 보존: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/image-sol-logs/attempt1-review.json 및 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/image-sol-logs/attempt1-review.md

## 14장 개별 판독

- **object-ownership · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-ownership-pc-dark.jpg — 1003/owner8, current7, ID-only 행1003/8, owner-scoped [] 일치. SQL literal은 bind를 풀어쓴 설명. 자체 HTTP 미실행 라벨은 DOM에도 상시 표시 필요.
- **request-boundaries · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/request-boundaries-pc-dark.jpg — 주체7/주문1003/소유자8 일치. 경계 지도만 수용. 화살표를 SQL/filter 실행순서로 일반화 금지; 객체권한검사가 조회와 결합 가능하다는 DOM note 필수.
- **principal-mapping · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/principal-mapping-pc-dark.jpg — Long.valueOf(authentication.getName())/name="7"/alice@example.test literal 판독. Java 전제 분석과 Python int 추가 fixture 구분. verified principal→ID7은 별도 검증매핑 예시.
- **csrf-credentials-v2 · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/csrf-credentials-v2-pc-dark.jpg — cookie 자동첨부 조건과 앱 명시 Authorization 구분. HttpOnly를 전송 조건으로 넣지 않았고 SameSite를 사이트 기준으로 표기. 실제 cross-site 재현 아님 표시.
- **output-context · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/output-context-pc-dark.jpg — <b>주문1002</b> literal, textContent B0, innerHTML B1 및 표시 주문1002 일치. script 실행/공격 재현 주장 없음.
- **security-config · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/security-config-pc-dark.jpg — authorize lambda명은 auth와 동등하나 원문 literal 발췌 아님. matcher /actuator/health,/css/**; permitAll/anyRequest.authenticated literal 유효. 원문 Boot4.1.1/Java25·미실행. endpoint 생성과 정책 분리.
- **hsts-boundary · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/hsts-boundary-pc-dark.jpg — learn.example.test, Strict-Transport-Security,max-age=31536000 literal. 신뢰HTTPS→기억정책→HTTP upgrade 모델, 유효인증서/IP제외/하위도메인 운영 주의. 실제 브라우저 상태실험 없음.
- **password-verification · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/password-verification-pc-dark.jpg — fake password123!, H(password,salt,cost), algorithm/cost/salt/hash 메타데이터, 성공로그인 재해시 검토. H는 symbolic pseudo이며 실제 hash/성능/권장수치 없음.
- **secret-log-lifecycle-v2 · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/secret-log-lifecycle-v2-pc-dark.jpg — String key = System.getenv("DEMO_KEY"); / history fake DEMO_ONLY_NOT_A_SECRET / credential=[REDACTED] / NEW_DEMO_KEY 판독. 실제 ENV조회·키회전 없음.
- **dependency-response-v2 · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/dependency-response-v2-pc-dark.jpg — web-app→helper-lib→codec-lib 왼쪽 chain과 중앙 plain component list 일관. 가상 예시/실제CVE스캔아님, 빈 예외등록부 책임자/만료일/근거. 실제 패치성공 주장 없음.
- **object-uuid-order · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-uuid-order-pc-dark.jpg — 상단/좌SQL/우SQL literal 모두 00000000-0000-4000-8000-000000001003. ID-only UUID→1003/8, owner7 조건→[]; addendum과 원 proof 구분.
- **object-own-order-v2 · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/object-own-order-v2-pc-dark.jpg — 1002/7 강조와 두 쿼리→1002/7 결과 그대로, 잘못 남은 상향 화살표 제거 확인. GET /orders/1002, 추가SQLite/HTTP실행아님 라벨 유지. M01 해결.
- **cors-requests-v3 · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/cors-requests-v3-pc-dark.jpg — 거부된 preflight의 전송 셀 OPTIONS(POST 미전송), API OPTIONS만 도착, JS 읽기 불가로 수정. 나머지 세 행 수신/읽기 및 cross-origin/same-site 그대로. fixture 네 결과와 일치. M02 해결.
- **sql-boundary-v2 · B+ · PASS** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d11-2026-10-25/sql-boundary-v2-pc-dark.jpg — 모호한 where quote 조각 삭제, 설명용 표현 배지와 SQL 조각 + 입력값 + SQL 조각으로 교체. 하단 WHERE title의 작은따옴표와 우측 ? 두 값/owner7/createdAt→created_at/DB실행전거부 그대로. 비코드 모델과 exact proof DOM 분리 명확. M03 해결.

## 승인 범위와 한계

원문 D11, SPEC, 추가 SQLite 소스2개와 main-browser-cors/DOM 기록을 대조한 정적·시각 자산검수다. raw PNG는 시각 판독하지 않았고 raw→JPG 일치로 변환 출처를 검증했다. 이 작업에서 Java/Spring/HTTP·HSTS·password hash·secret rotation·SCA를 새로 실행하지 않았다. 이미지나 parser를 실행 사실의 근거로 취급하지 않는다.

경계 지도는 실제 SQL/filter 호출 순서가 아니며 객체권한 검사와 DB조회가 결합 가능하다는 DOM note를 유지한다. 실제 proof 코드·SQL·bind값과 원문 Java, 설명 모델을 codeKind/evidenceKind로 구분하고 기본노출해야 한다. CORS의 서버수신·JS읽기·status/body관측도 분리한다. 제품 UI 동작과 폭별 가독성은 이후 검증 대상이다.

검수 산출물만 기록했다. 제품·자산·manifest·원문·proof는 수정하지 않았다. 판독 확대 crop은 의미 편집 없는 검수 자료이며 보관본은 JPEG92다.
