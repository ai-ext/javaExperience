# B01 원문과 추가 실험

원문301줄/7fence: Kotlin·properties·SQL1개씩, Java4개다. 완전한 VerificationCodeService/CodeMac2개를 byte그대로 복사해 컴파일/직접new호출했다. reset/Redis부분2개는원문내용을그대로추가wrapper안에넣었다. source.json과원문SHA로검사한다. Java25/Boot앱/HTTP는실행하지않았고실제JDK21.0.6·Spring7.0.9·Securitycrypto7.1.1·DataRedis4.1.1·Lettuce7.5.2.RELEASE/BOM4.1.1이다. 53runtimeartifact의SHA를기록했다.

원문Clock·RNG는공개재현용fixed/deterministic대역을주입했다. HMAC은공개testkey/RFC형식고정벡터를비교했고출력길이64hex/32byte를확인했다. 메일·SMS·store는메모리대역이라외부발송/실제DB저장/Springproxy/쿨다운정책이아니다. sender실패후memorywrite1잔존은DBcommit결과가아니다. 원문에는실제verifier/outbox가없다. 추가MessageDigest.isEqual비교는timing검증이아니며SQLMACpredicate도상수시간보장을주장하지않는다. resetfragment는32고정demobyte/URL43자/digest32byte/15분/mailstub1이며운영난수엔트로피나실제링크발송을증명하지않는다. 실제DelegatingPasswordEncoder standalone은{bcrypt}/정답true/오답false만확인했고비용을측정하지않았다. version0/1비교는추가정수계산이며JWT필터가아니다.

Redis8.10.2는공식tar공식SHA b9ffee226b5eecdba98a679260dad764b2a4ebd90dce4ad5ac9e9f3eef9c02b3 일치뒤연구폴더에make -j2 MALLOC=libc redis-server redis-cli만했다. 전역install/서비스변경없다. urllib403뒤같은공식URL의curl성공은provenance에구분했다. 매번새0700socket/dataDir/ownPID/새127port/requirepass·protectedmode/persistenceOFF를CONFIG·INFOguard로확인했다. 암호는매회새값이며CLI인수·로그·Git에남기지않았다. runtime config는0700연구run안0600파일이다. Java가보는PID/port도대조했다.

두LettuceConnectionFactory의서로다른clientID를확인한추가client/workerthread실험이다. 두app인스턴스/프로세스/실제로그인HTTP가아니다. 원문Lua/failed메서드를그대로호출해첫1/둘째2의절대만료가같고TTL은0초초과60초이하였다. 30회씩동시호출한결과집합은1..60/고유60/최종60이다. local30+30이면60허용/공유count<=40이면40허용은추가정책계산이지원문Lua가응답을제한한것이아니다. 원문은count만반환한다.

INCR뒤EXPIRE를일부러안보낸추가case는count1/TTL-1이다. 원문Lua에추가비정수expiry입력을줘runtimeerror뒤에도INCR1/TTL-1이남는것을확인했다. 원자실행은오류전체rollback이아니다. Duration999ms는toSeconds0→EXPIRE0이라반복호출1,1/키없음이었다. 양의whole-second설정검증이별도로필요하며원문에는없다. 별도1초window는실제만료뒤없음/다음1을관찰했다. PEXPIRETIME·clientID·PTTL실측숫자는매run원자료로만보존하고frozen은같은만료/범위·다른client라는실제비교값만기록한다. 4longlivingkey삭제/나머지shortkey별도정리/DBSIZE0,ownshutdownexit0/TCP닫힘을확인했다. NettymacOSDNSnativeproviderwarn은127.0.0.1직결시험과구분하고시스템설정을바꾸지않았다.

MySQL8.4.11은0700 run 아래 새datadir(실측0750)·0700 socket디렉터리/ownPID/mysqlxOFF/skip-networking의socket-only서버에서만실행했다. 외부study schema/seed SHA사본을privateguard후적재하고원문migrationSQL을그대로실행했다. 애플리케이션관찰계정은새암호+SELECT/INSERT/UPDATE/DELETE만갖는다. root는privatebootstrap/shutdown에만쓴다. 기존DB/3306/서비스/학습자코드는사용하지않는다. 원문password_hash backfill/NOT NULL단계는미실행이다.

추가두연결signup사전조회각0뒤INSERT는성공1/오류1062/행1이었다. 정규화알고리즘/HTTP409시험이아니다. 추가conditionalUPDATE의challenge소비1과email-only회원ACTIVE갱신을한TX에두었고독립observer는commit전PENDING/뒤ACTIVE,재사용0을봤다. 별도동시consume영향[0,1],expires==now0/attempts3에서0이다. 한도3은추가정책이다. 실패incrementrollback뒤0/commit세번영향각1뒤attempts3/정답도소비0을봤다. 원문실제store구현이아니며rollback되는예외로횟수증가를잃을수있다는추가사례다. 재전송은추가한TX에서oldchallenge11삭제1/new12생성뒤oldconsume0/new1이며순차실험이고동시재전송을검증하지않았다.

추가reset은동일DB의symbolic demo-hash-v1/v2·credential_version·b01_session/b01_audit행이다. 실제PasswordEncoder결과의DB저장이나외부session/Redis/JWT폐기가아니다. token소비/marker변경뒤강제실패하면tokenused0/hashv1/version0/session2/unusedreset2/audit0으로복구됐다. commit은tokenused1/hashv2/version1/session0/unusedreset0/audit1,재사용0이다. 두연결동시동일token도영향[0,1]/version1이었다. 추가fixture테이블4개는0/원본member행수200유지후자체서버를정상종료했다. 전체seed모든값동등성/운영안전성/실제사용자정책/부하·보안성능검증은아니다.

Java10/Redis9/MySQL14 고유ASSERT33은겹칠수있는관찰/검사단위이지33독립프로덕션보안시험이아니다. main최종freeze뒤새인스턴스freshreplay두경로가exit0/전체frozen일치했다. 독립임시복사재현도Java10/Redis9/MySQL14와전체frozen일치/53dependencySHA·정상종료를확인했다. run-redis-proof.py/run-mysql-proof.py의--freeze는의도한새관측을확정할때만쓰고일반재현에서는빼야한다. 일치하지않으면원인부터조사한다.

실제API계약201/202/204/409/429/423·계정열거시간동등성·외부메일/SMS/SMTP·쿨다운일일비용상한·IPproxy/계정정규화·risk/MFA·실제인증이벤트/HTTP핸들러·세션/JWT검증·분산원자성/outbox·Docker·원문Java25/Boot실행은이번범위밖이다. 문헌과코드주장을관찰결과로부르지않는다.

추가negative2개: activate는member_id가일치하는consume1일때만ACTIVE를갱신한다. 다른owner/만료이면각0·두회원PENDING이다. reset도조건에member_id를묶어다른owner/token조합은0이며양쪽상태가불변이었다. initial-mysql31-set.json은guardnegative추가전의12개결과보관본이고현재진실값은expected-mysql14다. 기존12facts값은유지됐다. HTTP인증/인가의증명으로일반화하지않는다.
