# B01 계정 생명주기 보충 학습 검증

2026-10-20, /Users/ds/code/javaExperience/.worktrees/concept-learning-night 의 개념 전용 부분 보강이다.10질문·27상태/선택10PNG(31생성21draft)를 구현했다. 원문의 모든 의미 장면·전수 픽셀·학습자 이해도를 완료 처리하지 않는다. merge·push·PR은 하지 않았다.

## 원문과 실행 구분

원문301줄·7fence(Kotlin1/properties1/SQL1/Java4)를 전문 검토했다. 완전한 VerificationCodeService/CodeMac2개는 그대로 컴파일·직접 new로 실행했다. reset/Redis 부분Java2개는 원문 내용 그대로 추가 wrapper 안에 넣었다. 원문 migration은 별도 private MySQL의 외부 study schema/seed SHA 사본에 적용했다. 원문/사본의 SHA와 전체 코드 보존을 검사했다.

실제 실행은 JDK21.0.6·Spring7.0.9·Security Crypto7.1.1·DataRedis4.1.1·Lettuce7.5.2.RELEASE·BOM4.1.1이다. runtimeClasspath53 artifact SHA를 확인했다. 원문 Java25·Boot 앱·Kotlin/properties 전체 설정·HTTP·실제 가입/로그인·메일/SMS·JWT/session middleware는 실행하지 않았다. 고정 Clock/deterministic RNG·공개 demo key·메모리 sender/store와 추가 Python/Java 관찰자·DB helper를 구분한다. 운영 RNG/키 보관·시간 동등성·보안 인증을 검증한 결과가 아니다.

## Java·Redis·MySQL 관찰

- 원문 issue는 limit→replace→email/SMS stub 순서였다.6자리/앞자리0·MAC64hex·fixedUTC00:00→00:05/300초를 확인했다. 제한 stub 거부는 새 쓰기0, sender 예외 뒤 이번 memory write1은 남았다. DBcommit/outbox/retry 관찰이나 실제 발송이 아니다.
- HmacSHA256 공개 고정 vector와 추가 byte 비교에서 같은 입력 true/바뀐 입력 false·32bytes였다. timing은 미측정이며 원문 verifier가 구현된 것은 아니다. reset 부분코드는32 demo bytes→Base64URL43자/no padding→digest32bytes·15분·mailstub1이었다. 실제 token/link는 기록하지 않았다.
- 실제 standalone DelegatingPasswordEncoder는 {bcrypt}/정답 matches true/오답 false였다. DB의 demo-hash-v1/v2는 상징적 marker이고 이 실제 해시와 별개다. version0/1 비교는 추가 정수 계산이며 실제 JWT filter가 아니다.
- 원문 Lua/failed 부분코드는 추가 SpringDataRedis wrapper에서 실행했다. 독립 Lettuce client A→B의 순차1/2는 동일 절대 expiry/관측TTL0초초과60초이내였다. 같은 JVM의 두 worker/client가30회씩 같은 key를 호출해 고유결과1..60·최종60이었다. 실제 앱/프로세스2개·로그인HTTP가 아니다. local30+30이면60/shared count≤40이면40 허용은 추가 판단 계산이며 원문은 count만 반환한다.
- 추가 INCR 뒤 EXPIRE 미전송은1/TTL-1, 원문 Lua에 추가 invalid expiry를 준 runtime error 뒤에도1/TTL-1이었다. atomic은 오류 전체 rollback이 아니다. 원문 Duration999ms.toSeconds0은 EXPIRE0으로 두 호출 반환1,1/키 없음이었다. 별도1초 창은 실제 만료 뒤 없음/다음1을 확인했다. 절대expiry·clientID/PTTL 실측 숫자는 raw로만 보존하고 frozen은 실제 비교한 동등/범위값을 기록했다. 속도·메모리·방어 성능은 미측정이다.
- MySQL의 두 연결은 같은 literal email을 사전조회0/0한 뒤 성공표식1/오류1062·최종행1을 남겼다. 성공표식1은 관찰기가 반환한 값이고 INSERT 영향 행 수를 별도 계측한 값이 아니다. 이메일 정규화·HTTP409 시험이 아니다. 원문 migration 뒤 status DEFAULT PENDING/version DEFAULT0/hash nullableYES였고 backfill/NOT NULL 전환은 미실행이다.
- 추가 conditional consume와 email-only 활성화를 한 TX에 넣어 consume1/독립observer commit전PENDING·뒤ACTIVE/재소비0을 봤다. owner guard와 만료 거부는각0·두회원PENDING이다. 별도 같은challenge 소비 경합은정렬[0,1],expires==now/attempts3에서0이다. 한도3은추가정책이다.
- 추가 wrong increment는rollback하면0, 세commit의영향각1뒤attempts3/정답소비0이었다. 순차재발급은oldfixture11삭제1/new12생성뒤commit, old소비0/new1이다.11/12는실제BINARY16 id를만드는추가fixture호칭이고인증코드가아니다. 새INSERT영향행수/동시재발급은별도관측하지않았다.
- 추가 reset은 token/member_id guard·token소비·hashmarker·version·같은DB의session/audit행을묶었다. owner불일치는영향0/양쪽상태불변이다. 중간실패rollback은v1/version0/tokenUsed0/session2/unusedReset2/audit0, commit은v2/version1/tokenUsed1/session0/unusedReset0/audit1·재사용0이었다. tokenUsed는선택token의flag이며총사용token행수가아니다. 같은token동시두연결도[0,1]/version1이었다. 외부session/Redis/JWT폐기가아니다.
- 추가fixture4테이블은0/원본member행수200유지를확인했다. 전체seed모든값비교나운영인증/인가완성을주장하지않는다.

Java10/Redis9/MySQL14 고유ASSERT33은 서로 연결된 관찰 단위다.33개 독립 보안 시험으로 합산하지 않는다. 메인 최종freeze→새replay 및 독립 임시복사 재현에서 전체 JSON이 일치했다. 이전31집합의 범위 검토 뒤 owner/활성화 negative2개를 추가했고 기존12 MySQL facts는 유지됐다. 원문은 바꾸지 않았다.

## 전용 자원과 권한

Redis8.10.2는 공식tar SHA-256을 공식 hash 목록과 대조한 뒤 연구 폴더 안에서만 local make했다. urllib403 뒤 같은 공식 URL의 curl이 성공했다. 전역 install/서비스·Docker 설정 변경은 없다. 새0700 run/socket디렉터리·새loopbackport/자체PID·protected mode/requirepass/persistenceOFF를 guard했고 암호는 매회 새 값·로그/CLI인수/Git에 기록하지 않았다. 임시config는0700 run안0600파일이다.4longliving key와별도short key·DBSIZE0 및ownshutdownexit0/TCP닫힘을확인했다.

MySQL8.4.11은0700 run아래 새datadir·0700 socket디렉터리/자체PID/skipNetworking1·port0/mysqlxOFF였다. 관찰계정은private ds_practice CRUD만, root는private bootstrap/shutdown만 사용했다. 기존DB/3306·서비스·학습자데이터는 사용하지 않았다. ownshutdownexit0/socket제거를 확인했다.

독립 검토에서 datadir0700 표현 오류를 발견했다. B01/W15/V04의 마지막 보존 run을 실제 stat해 상위run0700/datadir0750을 확인하고 관련 authored7파일을 고쳤다. V04 Java의root/DDL권한 부재와 private bootstraproot 사용도 구분했다. 권한 자체·nativefrozen·원문·rawlog는 바꾸지 않았다. V04 생성HTML은 보충p1개만 바뀌고 W15 HTML은HEAD와 byte동일이다. 근거는 datadir-permission-correction.json이다.

## 이미지·화면·검사

실제 image_gen31회 중10장을 선정하고21장은draft로 보존했다. 임의코드/MAC/이메일/테이블, 시도한도뒤정답거부, consumeUPDATE와INSERT, usedflag와행수,client와app인스턴스,TTL과epoch,한Lua호출의정수반환과두호출결과를교정했다. 독립 검토의 Minor3건(가입 성공표식,challenge호칭,순차두client주체)도최종그림에서해소했다. 메인은31생성본, 독립검토자는선정10장과교정본3장을실제열람했다.

10질문·27상태에서그림/현재값/정확코드/설명을함께전환한다. 모바일에는native장면select·확대그림내부pan·전체그림전환을제공한다. 관찰기CHECK/JSONplumbing으로길어진11개코드는실제source발췌로줄였고,isEqual/≤40은실제predicate를표시했다. 전체원문·추가코드·검사JSON은접힌근거에보존했다. 빈코드줄에공백을추가하지않아정확한표시/복사/fallback을유지한다.

최종Chrome1672×941/360×800 각27·총54관찰/20캡처에서title/code/values/CHECK/runJSON·PNG로드/실제크기·로그기본접기·핵심접기밖·본문가로넘침없음을확인했다. 코드축약뒤전체54/20을재취득했다. 특수10은nativepan40px·완료메시지뒤blankline포함clipboard501자일치·log/zoom/resize·keyboard·sourceanchor/reload/catalogBack/실제Forward다. 기존지도/원문검사2개와 live B01 12,955자/code7/id16/map1 정확일치를기록했다. siteURL필터warn/error0이며boundedraw139로그는전부외부extensionURL이다. 확장설정을바꾸지않았고전체browserhistory의console0을주장하지않는다.

독립 담당자는최종20캡처를전부실제열람하고54관찰/27cases를현행data와대조, unit/generated를독립exit0으로확인했다. runMatches는기록된경로/성공값대조이며실제브라우저로그본문전체를독립재구성한것이아니다. 모바일그림은pan이필요하고번역overlay가남았다. wholepixel·learner미검증을유지한다.

최종build exit0/HTML339·링크0, 관련17suite·필수3audit모두exit0다. 원문135/학습자서버17/원본worktree3403 SHA불변·루트main clean/의존성53SHA/외부study2SHA를확인했다. parity기존599bytesprefix를유지해10append(609/verified0), inventory44,690중491implemented/기존verified6이며이번27은미검토→시안준비→구현만기록했다.

공식조사는 CodexCLI gpt-6-luna/OpenAI 직접경로/noLiteLLM이며메인은공식8출처와실제실행을별도대조했다. 실제API/처리시간동등성·발송·IP/proxy/쿨다운일일비용정책·운영RNG/키관리·본래서비스인증/인가·JWT/session/분산outbox·Java25/Boot/Docker·보안/성능인증·전수pixel/learner는미검증이다. 근거는 source-proof/, research/, browser-*.json, image-records.json, checks/, REVIEW.md에있다.

원시Gradle출력3파일의2행끝공백3건은정확한파일SHA/줄번호로한정한예외다. 원시진단을자르거나정리하지않았고그밖staged diff-check는exit0이다. checks/whitespace-exceptions.json과diff-check.json에기록했다.
