# B01 계정 생명주기 개념 보강 계획

범위는 docs/knowledge/B01-account-lifecycle.md의 개념 학습뿐이다. 학습자 서버·scenario·practice를 수정하거나 실제 계정·메일·SMS를 만들지 않는다.

1. 원문 전문·기존HTML·7fence를 추출 → SHA/코드/앵커/기존지도 기준을 실제 추출 수로 기록한다.
2. 기존연구와원문대조·Luna/OpenAI직접공식조사 → OWASP/Redis/Spring/JDK의 문헌과 메인 실제 실행을 구분한다.
3. 원문 완전Java2개를 그대로컴파일·추가관찰wrapper로실행 → 고정Clock/공개test입력·HMAC/digest/발송stub/PasswordEncoder검증, 소스부분코드는추가adapter표시.
4. 새privateMySQL에외부schema사본·원문migration실행 → UNIQUE/추가조건부challenge/reset·1회경합/rollback과버전·세션행을구분한다. 실제JWT/HTTP/메일미구현.
5. 가능하면공식고정Redis source를연구폴더에만localcompile → 새0700socket/loopback/ownPID·persistenceOFF·두client/Lua/TTL/오류rollback구분검증. 불가시미실행명시.
6. 실제결과frozen·freshreplay·독립재현 → 원문/추가fixture/문헌/미실행을정확히연결한다.
7. image_gen별도개념시안과10내외질문단계UI → 원문보존/짧은설명과시각사례먼저/긴근거만접기.
8. 실제Chrome desktop/mobile·copy/history/nativepan·원문/링크 → build/관련suite/필수3audit·SHA보존·로컬commit. verified/merge/push/PR하지않는다.

완료는 이번 선택 장면의 검증 가능한 부분 보강이며134개전체완료나프로덕션인증안전성판정이아니다.
