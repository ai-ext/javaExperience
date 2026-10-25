# task14 B01 독립 감사

판정은 **needs_completion**이다. 원문301줄은 보존되어 있고 fresh `npm --prefix tools/site run test:b01`은 exit0이지만 전체 API·정책·운영 경계의 학습 범위는 미완성이다. 기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`, 원문 SHA256 `1c77c1d160fcffaf98c352787ba4df445d9f1d782369b0101a3acd508e5e8576`.

## spec 검토

주요 의미단위56건: covered10 / partial26 / missing8 / unrun12. covered는 제한된 장면과 기존 관찰값의 정합성을 뜻하며 현재 native 또는 운영 검증을 뜻하지 않는다. missing은 원문 삭제가 아니라 새 학습 장면 부재다. 원문7fence를 이번에 exact 대조했고 생성HTML12955자/code7/id16/map1 보존 검사도 통과했다.

|원문 의미단위|원문 줄|stageIds|판정|남은 범위|
|---|---:|---|---|---|
|표제·요약·한 줄 정의|1–10|signup-schema, challenge-commit, reset-commit, counter-shared|partial|API 생명주기 전체의 입력→정책→저장→응답 흐름은 없음.|
|핵심1: 필수 연락처 인증·미인증 가입 만료|11–13|challenge-before, challenge-commit|partial|필수 연락처 조합, PHONE_CONFIRM 상태 갱신, 미인증 가입 만료 장면 없음.|
|핵심2: 이메일 정규화·UNIQUE·409·복구 응답|15–15|signup-precheck, signup-unique|partial|정규화, HTTP409 변환, 복구 응답 동등성 미실행.|
|핵심3: 짧은 코드·HMAC·TTL·온라인 횟수|17–17|issue-email, mac-vector, mac-compare, challenge-boundary, resend-attempts|covered|운영 RNG/키/상수시간 측정은 검증 범위 밖이며 별도 표기.|
|핵심4: 재전송·주소/일/IP/비용|19–19|resend-replace, issue-limit|partial|실제 쿨다운·일일/IP/비용 상한과 동시 재전송 없음.|
|핵심5: 계정 열거 방지·응답/시간·32byte token|21–21|reset-token|partial|존재/미존재의 동일 응답/시간 흐름 장면·실측 없음.|
|핵심6: 새 비밀번호와 세션 폐기·access token|23–23|reset-rollback, reset-commit, password-encoder, password-version|partial|실제 encoder DB 저장·session/JWT middleware 폐기 미실행.|
|핵심7: 계정+IP·일시 잠금/지수 지연|25–25|counter-decision|partial|계정/IP 조합·분산 공격·잠금 DoS·지연 정책 장면 없음.|
|핵심8: 공유 카운터·INCR와 최초EXPIRE|27–27|counter-fixed, counter-shared, counter-edge-split, counter-edge-error, counter-edge-window|covered|앱/프로세스2개나 실제 HTTP 방어 검증 아님을 명시.|
|핵심9: 감사 비밀값 제외·IP/연락처 최소수집|29–29||missing|어떤 필드가 기록/마스킹/제외되는지 학습 장면 없음.|
|따라 하기 버전·골격·Gradle 의존성|31–55||unrun|Java25/Boot4.1.1 원문 골격 빌드·실행 미검증.|
|Maven·Mailpit·application-local·환경변수·실행|57–71||unrun|Mailpit/SMTP·실제 설정 바인딩·환경비밀 공급·bootRun/mvn 실행 없음.|
|migration·운영 변경 순서·member 필드|73–85|signup-schema|partial|운영 기존값/제약 점검·무중단 순서·상태별 정책 장면 없음.|
|verification_challenge/reset_token 스키마|87–105|challenge-before, reset-commit|partial|컬럼/인덱스/FK·pepper_version 및 저장소 선택 이유를 따로 설명한 장면 없음.|
|신규 PENDING·hash backfill·NOT NULL|107–107|signup-schema|partial|기존 가입 데이터 전환과 최종 NOT NULL 단계 미실행.|
|인증 조건부 소비·DB정리/Redis복구·원문 비저장|107–107|challenge-before, challenge-commit, challenge-boundary|partial|만료행 cleanup 설계·Redis 복구/저장소 선택 장면 없음.|
|migration 로컬 명령·Clock/SecureRandom 빈|109–109|issue-email|unrun|원문 mysql 명령·Spring 빈 등록 자체는 실행하지 않음.|
|API: 가입201/PENDING·handle·중복409·비밀 응답금지|111–115|signup-unique|unrun|실제 HTTP 입력검증·응답 DTO·불투명 handle 발급 없음.|
|API: verification-codes handle·연락처 조회·429/Retry-After|116–116|issue-limit, issue-email, issue-sms|unrun|handle 인증/인가·서버 연락처 조회·429/Retry-After 미실행.|
|API: verifications204·일반 오류·횟수 소진|117–117|challenge-race, challenge-boundary, resend-attempts|unrun|API204와 잘못됨/만료/재사용 동일 오류 미실행.|
|API: reset 요청 동일202·본문·시간|118–118||unrun|존재/미존재 양쪽 HTTP 응답·유사 시간 미실행.|
|API: reset confirm204·동일 오류·세션폐기|119–119|reset-rollback, reset-commit, password-version|unrun|HTTP·실제 세션·인가·오류 계약 검증 없음.|
|API: 로그인200·429/423·Retry-After·존재 비노출|120–120|counter-decision|unrun|실제 인증 handler/응답/성공 초기화 미실행.|
|VerificationCodeService 주입·생성·발송 분기|122–160|issue-email, issue-sms, issue-limit, delivery-write|covered|실제 provider/Spring proxy 미실행을 표시; runtime환경 제한 별도 유지.|
|이전코드무효+새행 TX·outbox·handle/서버연락처|162–162|delivery-failure, resend-replace|partial|실제 store/outbox/retry·동시 재발급·handle→서버주소 인가 흐름 없음.|
|CodeMac·키 주입·HMAC 연산|164–189|mac-vector|covered|운영 key/random secret 공급·회전 검증 아님을 표기.|
|상수시간 비교·원자 실패횟수·Clock·조건부 소비|191–191|mac-compare, challenge-race, challenge-boundary, resend-attempts|partial|실제 verifier 없음. isEqual timing/SQL constanttime을 증명하지 않음.|
|Redis challenge·cooldown SET NX EX·정규화/E.164|193–193||missing|verification:{id}/cooldown 경쟁·재전송/TTL·주소 정규화 장면 없음.|
|reset32bytes·SHA256·URL/프록시/분석/Referer|195–197|reset-token|partial|토큰이 URL·로그·Referer로 새는 경로와 제3자리소스 제한 장면 없음.|
|reset token 발급 부분코드|199–207|reset-token|covered|보안난수 엔트로피/실제 링크·메일/운영token 없음 명시.|
|신뢰 public-base-url·Host/X-Forwarded-Host|209–209||missing|trusted base URL과 공격자 Host 입력 차이를 보여주는 장면 없음.|
|reset 조건부소비+새hash·version/session·나머지token/audit TX|209–209|reset-rollback, reset-commit, password-version|partial|실제 encoder DB 저장/외부 session/JWT 폐기는 추가 DB fixture로 대체 불가.|
|DelegatingPasswordEncoder·matches·cost·동일202/비동기|211–211|password-encoder|partial|F01: 표시코드에 matches 누락. cost 측정·동일202·비동기 발송은 미실행.|
|계정/IP Redis key HMAC·Lua 증가/최초expire|213–231|counter-fixed, counter-shared, counter-edge-error, counter-edge-window|partial|opaque key HMAC 생성이나 계정/IP 두차원 조합 구현은 없음.|
|사전제한·실패/성공handler·event·미존재·장애정책|233–233|counter-decision|missing|사전검사/실패increment/성공reset/HTTP응답/감사event·Redis 장애정책 학습 장면 필요.|
|수동 curl·Mailpit·인증1회·reset동등·429·성공reset|235–235||unrun|HTTP/Mailpit/실제 로그인 수동흐름 전부 미실행.|
|Clock만료·횟수·1회·가입/reset경합·공유counter 테스트|237–237|challenge-boundary, resend-attempts, signup-unique, password-version, counter-shared|covered|원문의 실제 Spring 서비스 통합테스트로 일반화하지 않음; native는 이번 미재실행.|
|치트시트: 이메일 중복|239–243|signup-precheck, signup-unique|partial|정규화→HTTP409 연결 없음.|
|치트시트: 6자리 인증코드|244–244|issue-email, mac-vector, challenge-boundary, resend-attempts|covered|운영 검증 아님.|
|치트시트: 재전송 cooldown 주소/IP/일일|245–245|resend-replace|partial|cooldown NX/EX와 주소/IP/일일한도 미실행.|
|치트시트: reset token|246–246|reset-token, reset-commit|covered|실제 HTTP/운영token 범위 아님.|
|치트시트: 비밀번호 해시·로그금지|247–247|password-encoder|partial|표시코드 predicate F01 및 raw 비밀번호 로그금지 경로 장면 없음.|
|치트시트: 분산제한·키식별자비저장|248–248|counter-fixed, counter-shared|partial|실제 이메일/IP HMAC key 생성 없음.|
|치트시트: 제한응답·존재유무비노출|249–249||unrun|429/Retry-After·잠금 응답 차이 미실행.|
|오류1~3: 중복·이전코드·만료|251–255|signup-unique, resend-replace, challenge-boundary|partial|409 변환·앱/DB시계 차이 시나리오 없음.|
|오류4: reset도메인변경|256–256||missing|설정URL과Host 공격 사례 없음.|
|오류5: RedisTTL미설정|257–257|counter-edge-split, counter-edge-error|covered|실제 crash/운영Redis 시험 아님.|
|오류6: 코드payload로깅|258–258||missing|발송payload 로그의 금지/마스킹 비교 장면 없음.|
|확장: HMAC·로그·동시성·CAPTCHA/MFA·교차참조|260–266|mac-vector, reset-token, challenge-race, signup-unique, counter-shared|partial|URL로그·risk/CAPTCHA/MFA·주제간연결 별도 장면 없음.|
|Q1 사전조회와 UNIQUE|268–272|signup-precheck, signup-unique|partial|가입409/복구숨김 꼬리 질문의 HTTP 대비 없음.|
|Q2 짧은코드 SHA256/HMAC·reset entropy|274–276|mac-vector, mac-compare, reset-token|partial|백만후보 전수대입과32byte entropy 차이를 직접 비교하는 텍스트 장면이 약함; 이미지 mac은 이번 미열람.|
|Q3 존재/미존재 reset응답·큐·시간|278–280||missing|같은202/본문/시간과 비동기 발송 비교 장면 없음.|
|Q4 token digest·1회·동시소비|282–284|reset-token, reset-commit, password-version|covered|실제 세션/JWT 인증 아님.|
|Q5 계정잠금 DoS·IP·지연·CAPTCHA|286–288||missing|분산공격/영구잠금DoS/위험기반대응 장면 없음.|
|Q6 Redis다중서버·INCR/EXPIRE·장애·HMAC키|290–292|counter-fixed, counter-shared, counter-decision|partial|장애시정책·식별자HMAC key 미커버.|
|참고문헌6개|294–301||unrun|새 웹/CLI 금지에 따라 이번 공식 URL 접근/현재내용 재검증 없음.|

## quality 진단

spec 미충족으로 quality 승인 없이 진단만 기록한다. critical0 / important0 / minor1.

- **B01-Q01 minor** — /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/b01-lesson-data.mjs:1271,1301. password-encoder의 화면은 matches true/false를 설명하면서 code는 encode만, password-version은 거부를 설명하면서 정수선언만 보여준다. 실제 predicate는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/source-proof/probe/example/account/B01Proof.java:58,61에 있다. 기존 검사는 발췌가 원본의 substring이면 통과하므로 이 누락을 놓친다. predicate 자체를 정확 발췌한 뒤 test:b01와 메인의 desktop/mobile 코드·값 동시독해를 검증한다.

공통 clipboard race는 중복 재현하지 않았다. 현재 DB guard가 HTTP 인가 전체를 증명한다거나 정수 version 비교가 JWT 폐기를 증명한다는 과장된 표시는 발견하지 못했다.

## 실행 근거와 한계

fresh 명령 UTC 2026-10-22T00:01:46.649641+00:00 → 2026-10-22T00:01:49.502172+00:00, exit0. stdout/stderr·소스/HTML/번들/test/package SHA는 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task14/fresh-test-b01.json에 보존했다. 이 명령은 Node/jsdom 및 보존된 frozen/로그를 검사하며 native 프로세스를 띄우지 않는다.

기존 Java10/Redis9/MySQL14=고유33 관찰은 독립33 보안 실험이 아니다. MySQL은 사본 migration 및 추가 direct SQL, Redis는 같은 JVM의 독립client/thread2개, Java는 direct new/추가 wrapper였다. DB marker/session/audit를 실제 encoder 저장·외부 session/JWT로 일반화하지 않는다. 원자 Lua는 오류 전 변경을 rollback하지 않고 999ms는0초로 잘린다. raw clientID/epoch/PTTL은 과거 run 값이다.

## 실제 열람한 이미지

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/images/B01-reset-v4.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/images/B01-counter-v4.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/images/B01-signup-v3.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/captures/desktop-reset.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/captures/mobile-counter.jpg
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/captures/desktop-signup.jpg

시안3/캡처3만 직접 열람했다. 그림의 성공 관찰기표식/해시marker/DB session행/두client와 추가threshold 경계는 자료와 일치한다. mobile-counter는 pan과 번역확장overlay가 보인다. 모든 이미지를 검수한 것으로 표시하지 않는다. JPEG헤더와 실측크기는 diagnostics.json에 보존했다. 기존 fullpage 캡처 저장크기와 당시 viewport는 구분했다. PNG src의 과거 브라우저기록은 현재 JPG 브라우저실행 증거가 아니다.

## 남은 묶음

1. 원문 범위 공백: 가입 미인증 만료·연락처 조합, 정규화/E.164, 감사/로그/URL 토큰 보호, Host 설정URL, 복구 응답·잠금 DoS·위험기반대응을 장면화한다.
2. 정책 공백: 쿨다운/일일/IP/비용, 실제 verifier·동시 resend·만료행정리/Redis복구·outbox·제한 handler/성공 초기화·Redis 장애정책을 별도 좁은 사양으로 확정한다.
3. F01의 코드 발췌를 보완한 뒤 fresh spec→quality 독립검토가 필요하다.
4. Java25/Boot/Kotlin/properties/HTTP/Mailpit/실제 인증·인가/session/JWT/외부발송은 미실행으로 유지한다. 실제 실행은 별도 승인 범위·구현이 있을 때 검증한다.
5. 메인이 별도 preview current desktop/mobile에서 선택/이동/확대/pan/복사/원문앵커/overflow를 확인한다. 기존 캡처는 현재 브라우저 대체물이 아니다.

전체 상세 및 파일/근거 목록: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task14/review.json
전수 sourceLines/stageIds/evidence 표: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task14/source-coverage.json

판정: needs_completion
커버리지: 56단위 = covered10 / partial26 / missing8 / unrun12
이슈수: critical0 / important0 / minor1 (문서범위 공백 별도)
exit: test:b01 = 0
fullDocumentComplete: false
