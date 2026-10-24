# P8-6 — minor (deferred) 전수 분류

확인일: 2026-10-24. 기준 HEAD: `aefa4cab` (`course/p1-spec-roadmap`). 작업 루트: `$WORKTREE_ROOT/p1-spec-roadmap`.

원장 23줄(P2 15·P4 1·P6 2·P8 5)을 복합 항목별 **34건**으로 분리했다. 같은 원장 줄의 할인율/재고 부족, 당시 HTML 생성, 장부/계획 이력 등도 각각 센다. 표의 파일:줄은 이 작업 트리의 줄 번호이며, 원장의 옛 SHA는 이력 재작성 전 값일 수 있다. 원장 원문은 보존한다.

서버 동작의 티켓 후보는 현재 소스의 경로·경계와 원장을 대조한 **정적 판정**이다. 이번에 서버·DB·HTTP 결함을 재현하거나 정상 동작을 검증한 결과가 아니다. Java·SQL·서버 설정·정답 커밋은 바꾸지 않았다.

## 출처와 기존 티켓 대조 범위

- P2: `docs/course-redesign/plans/2026-10-22-p2-ledger.md`
- P4: `docs/course-redesign/plans/2026-10-23-p4-ledger.md`
- P6: `docs/course-redesign/plans/2026-10-23-p6-ledger.md`
- P8: `docs/course-redesign/plans/2026-10-23-p8-ledger.md`

`course/map-tickets.json:15`와 `course/tickets/B01.md`~`B16.md`의 원인·정답·확인 테스트를 대조했다. B01 외부 호출/풀, B02 목록 인덱스, B03 트랜잭션 경계, B04 구조, B05 공유 상태, B06 MDL, B07 쿠폰 gap lock, B08 엔티티 응답, B09 날짜, B10 결제 재시도, B11 환경 변수 우선순위, B12~B14 Security, B15 캐시 무효화 시점, B16 Redis 장애 전파다. 아래 “없음”은 현재 B01~B16에 같은 원인의 해결·확인 기준이 없다는 뜻이며 주제의 유사성만으로 포함 처리하지 않았다. E01도 필요한 항목에서 별도 대조했다.

## 항목별 결과

| 번호 | 출처 원장 | 항목 | 분류 | 근거 파일:줄 | 이번 수정 내용·판정 이유 |
|---|---|---|---|---|---|
| 01 | P2:23 | prod 설정 주석: 환경 변수 누락과 기동 실패 주체 | **이미 해결** | `board-server/src/main/resources/application-prod.yml:1`; `board-server/src/main/java/com/example/board/config/ProdSecretsCheck.java:24` | 4965ed6a에서 주석 수정. 자리표시자 자체가 아닌 ProdSecretsCheck 검사임을 명시하고 있다. 변경 없음. |
| 02 | P2:32 | D03 JWT_SECRET 환경 변수명 | **이미 해결** | `course/roadmap.json:267`; `board-server/src/main/resources/application-prod.yml:9` | 4965ed6a에서 BOARD_JWT_SECRET으로 통일. 변경 없음. |
| 03 | P2:33 | D03-2~6의 RED 미실행 이력 | **보류** | `docs/course-redesign/plans/2026-10-22-p2-ledger.md:33` | 당시 TDD 절차는 사후에 바꿀 수 없다. 과거 미실행 기록을 보존한다. |
| 04 | P2:37 | 새 태그 동시 생성 UNIQUE 충돌 재시도 없음 | **티켓 후보** | `board-server/src/main/java/com/example/board/post/PostServiceImpl.java:46`; `board-server/src/main/resources/schema.sql:55` | B01~B16에 없음. B07은 쿠폰 gap lock이고 태그의 조회→INSERT 경합과 다르다(`course/tickets/B07.md:53`). 서로 다른 회원의 같은 새 태그 작성으로 후속 재현할 후보. 서버 수정 없음. |
| 05 | P2:41 | 좋아요가 DataIntegrityViolationException 전체를 삼킴 | **티켓 후보** | `board-server/src/main/java/com/example/board/post/PostLikeService.java:39` | B01~B16에 없음. B03의 rollback-only 처리와 달리 UNIQUE와 FK 오류를 구별하지 않는 문제(`course/tickets/B03.md:58`). 실제 FK 위반이 204로 숨는 반례를 후속 확인할 후보. 서버 수정 없음. |
| 06 | P2:52 | 명세 §5-4 쿠폰 할인율 | **이미 해결** | `course/spec-v2.md:155`; `board-server/src/main/java/com/example/board/shop/OrderService.java:27`; `board-server/src/main/java/com/example/board/shop/OrderService.java:83` | 4965ed6a에서 10%·할인액 소수점 이하 버림을 명세에 반영. 정수 연산과 일치. 변경 없음. |
| 07 | P2:52 | 명세 §5-4 재고 부족 409 | **이미 해결** | `course/spec-v2.md:153`; `board-server/src/main/java/com/example/board/shop/OrderService.java:87` | 4965ed6a에서 409 /errors/out-of-stock 반영. 변경 없음. |
| 08 | P2:58 | D08-5 PG_SECRET 환경 변수명 | **이미 해결** | `course/roadmap.json:871`; `board-server/src/main/resources/application-prod.yml:12` | 4965ed6a에서 BOARD_PG_SECRET으로 통일. 변경 없음. |
| 09 | P2:75 | 같은 회원의 댓글·좋아요 잠금 순서 교차 | **티켓 후보** | `board-server/src/main/java/com/example/board/comment/CommentService.java:42`; `board-server/src/main/java/com/example/board/comment/CommentService.java:44`; `board-server/src/main/java/com/example/board/post/PostLikeService.java:33` | B07과 잠금 분석 주제만 겹친다(`course/tickets/B07.md:53`). B07의 없는 member_coupon 행 gap lock과 달리 회원 X→글 FK S / 글 X→회원 FK S 교차이므로 기존 티켓으로 해결되지 않는다. 후속 혼합 요청 재현 후보. 서버 수정 없음. |
| 10 | P2:76 | 쿠폰 restore 유실 뒤 만료 없는 Redis 재고가 계속 409 | **티켓 후보** | `board-server/src/main/java/com/example/board/coupon/CouponStockCounter.java:29`; `board-server/src/main/java/com/example/board/coupon/CouponStockCounter.java:70`; `board-server/src/main/java/com/example/board/config/RedisGuard.java:27` | B16과 장애 건너뛰기 경로만 겹친다(`course/tickets/B16.md:65`). B07은 DB gap lock, B16은 지연·예외 전파를 고치며 복구 뒤 수량 정합성은 확인하지 않는다. 후속 restore 유실 재현 후보. 서버 수정 없음. |
| 11 | P2:77 | 건너뛰기 창의 ZINCRBY 유실로 랭킹 과소 집계 | **티켓 후보** | `board-server/src/main/java/com/example/board/point/ActivityRankingService.java:51`; `board-server/src/main/java/com/example/board/config/RedisGuard.java:39` | B16은 가용성 폴백을 다루며 유실분 재처리는 다루지 않는다(`course/tickets/B16.md:65`). 이벤트 원장 재처리 또는 안전한 재구축은 별도 티켓 후보. 서버 수정 없음. |
| 12 | P2:77 | prod REDIS_HOST 누락 시 localhost·경고만 | **보류** | `board-server/src/main/resources/application.yml:12`; `board-server/src/main/resources/application-prod.yml:2`; `board-server/src/main/java/com/example/board/config/RedisConfig.java:21` | Redis 없는 기동과 DB 폴백은 현재 의도다. B11은 JWT 만료 환경 변수 우선순위(`course/tickets/B11.md:54`)이고 이 설정을 필수로 바꾸는 티켓이 아니다. 운영 배포 정책 확정 전 보류. 서버 설정 수정 금지. |
| 13 | P2:88 | 작성자 update·patch와 관리자 숨김 경합으로 ACTIVE 복원 | **티켓 후보** | `board-server/src/main/java/com/example/board/post/PostServiceImpl.java:64`; `board-server/src/main/java/com/example/board/post/PostServiceImpl.java:74`; `board-server/src/main/java/com/example/board/post/Post.java:52`; `board-server/src/main/java/com/example/board/admin/AdminService.java:69` | B15는 캐시 삭제 시점이고 엔티티 전체 UPDATE의 상태 덮어쓰기는 다루지 않는다(`course/tickets/B15.md:56`). 낙관적 잠금·조건부 갱신 등은 후속 재현과 설계 대상. 서버 수정 없음. |
| 14 | P2:89 | 10MB 초과 업로드가 400 대신 연결 끊김 | **티켓 후보** | `board-server/src/main/resources/application.yml:23`; `board-server/src/main/resources/application.yml:40`; `course/spec-v2.md:190` | B01~B16에 업로드 전송 한도 티켓 없음. 서블릿 400 매핑 전에 연결이 닫히는 경계는 실제 HTTP로 후속 확인한다. 원장의 실측을 현재 재실행 결과로 취급하지 않는다. 서버 설정 수정 없음. |
| 15 | P2:89 | 업무 커밋 뒤 감사 로그 실패 시 응답 500 | **티켓 후보** | `board-server/src/main/java/com/example/board/admin/AuditLogAspect.java:39`; `board-server/src/main/java/com/example/board/admin/AuditLogAspect.java:49`; `board-server/src/main/java/com/example/board/admin/AuditLogWriter.java:20` | B03의 동일 트랜잭션 롤백과 다르며 B01~B16에 없음. 성공 업무와 별도 감사 트랜잭션의 응답 정책을 재현·합의할 후보. 서버 수정 없음. |
| 16 | P2:89 | 엑셀 DOM(XSSF) 판독 | **보류** | `board-server/src/main/java/com/example/board/admin/ExcelMemberIdReader.java:33`; `board-server/src/main/java/com/example/board/admin/ExcelMemberIdReader.java:34`; `board-server/src/main/java/com/example/board/admin/ExcelMemberIdReader.java:69` | 현재 5MB·1,000행 제한에서 DOM 사용 자체는 결함 확정 근거가 아니다. 대량·압축 팽창 한계 검증이나 스트리밍 전환은 별도 성능 범위로 보류. 서버 수정 없음. |
| 17 | P2:99 | 랭킹 rebuild의 RENAME이 동시 정상 적립을 덮어씀 | **티켓 후보** | `board-server/src/main/java/com/example/board/point/ActivityRankingService.java:86`; `board-server/src/main/java/com/example/board/point/ActivityRankingService.java:96` | B16은 장애 전파, 고도화 E01도 인기글 재적재를 다루므로 활동 랭킹 rebuild는 미포함(`course/tickets/B16.md:65`; `course/map-tickets.json:32`). 원장 스냅샷과 증분 재처리 경계를 별도로 검증할 후보. 서버 수정 없음. |
| 18 | P2:100 | file 파트 누락 시 errors[] 없음 | **티켓 후보** | `board-server/src/main/java/com/example/board/common/GlobalExceptionHandler.java:124`; `board-server/src/main/java/com/example/board/common/GlobalExceptionHandler.java:134` | file 누락 전용 핸들러가 없고 공통 핸들러는 type·instance만 보정한다. 다른 업로드 검증 errors[] 보완과 구별한다. B01~B16에 업로드 요청 검증 티켓 없음. 후속 HTTP 확인 후보. 서버 수정 없음. |
| 19 | P2:100 | 쪽 사이 캐시 재적재 시 위치 커서 겹침·누락 | **티켓 후보** | `board-server/src/main/java/com/example/board/post/PopularPostService.java:101`; `board-server/src/main/java/com/example/board/point/ActivityRankingService.java:62` | B15·E01은 인기글 재노출/동시 적재를 다루며 페이지 간 스냅샷 유지와 다르다(`course/tickets/B15.md:56`; `course/map-tickets.json:32`). 현재 위치 커서의 명시된 한계다. 스냅샷 토큰 또는 변경 가능한 순위 허용 계약은 별도 티켓 후보. 서버 수정 없음. |
| 20 | P2:110 | 옛 0패딩 Redis member 잔여(개발 환경 한정) | **보류** | `board-server/src/main/java/com/example/board/point/ActivityRankingService.java:51`; `board-server/src/main/java/com/example/board/point/ActivityRankingService.java:85`; `docs/course-redesign/plans/2026-10-22-p2-ledger.md:107` | 과거 이력을 실행한 개발 DB의 잔여다. 이 작업은 해당 Redis 존재를 확인하거나 지우지 않는다. 해당 환경만 모든 활동 쓰기를 멈추고 개발용 Spring 컨텍스트에서 rebuild를 호출·검증해야 한다(온라인 rebuild 금지, HTTP 엔드포인트 없음). 공유 Redis FLUSH는 안내하지 않는다. |
| 21 | P2:110 | Redis→DB 전환 테스트가 실제 폴백 원천을 단언하지 않음 | **보류** | `board-server/src/test/java/com/example/board/point/ActivityRankingApiTest.java:153`; `board-server/src/test/java/com/example/board/point/ActivityRankingApiTest.java:175` | 5초 건너뛰기와 결과 목록만 보고 원천을 구별하는 spy·Redis 전용 오염 데이터 단언은 없다. B16에도 이 정렬 전환 증거는 없음. 현재 정렬 규칙 일치와 별개인 테스트 증거 공백이며 Java 테스트 수정 금지 범위라 보류. |
| 22 | P4:39 | probe 가입·로그인 실패 뒤 빈 토큰으로 반복 | **이미 해결** | `messy-server/drills/probe.sh:21`; `docs/course-redesign/plans/p7-findings/R2.md:140` | R2 m10·a6e6d8d6에서 빈 토큰이면 복구 안내 후 exit 1. 직접 확인, 변경 없음. |
| 23 | P4:39 | 당시 course/tickets HTML 미생성 | **이미 해결** | `course/tickets/B04.html:65`; `tools/site/package.json:7` | 현재 HEAD에도 갱신된 제출물 HTML이 있다. 이번 npm run build로 전체 HTML도 다시 생성했다. 과거 원장을 현재 미완료로 해석하지 않는다. |
| 24 | P6:13 | 공부자료 12개의 없는 starter compose 전제 | **고침** | `docs/knowledge/README.md:7`; `docs/knowledge/R06-db-client-tools.md:17`; `docs/knowledge/R08-app-to-db-connection.md:172`; `compose.yaml:25` | da4dbe74·1ba4df4f가 없는 예제임을 이미 고지했다. 이번에는 해당 12개 자료와 자료 목차에 실제 루트 compose 링크를 연결하고 R08에 현재 DB 확인 명령을 추가했다. 상품 테이블·과거 측정·테스트를 게시판용 결과로 바꾸지 않았다. 아래 전수 목록 참고. |
| 25 | P6:13 | README의 VM 기반 Docker 런타임 Testcontainers 환경 변수 현장 미실행 | **보류** | `README.md:113` | VM 기반 Docker 런타임 장비에서 Docker 소켓·네트워크 구성을 실행 검증하지 않았다. 문서에 있는 설정을 현재 환경에서 검증 완료로 올리지 않는다. 문서 기준과 런타임 확인을 구분해 보류. |
| 26 | P6:17 | --compact 덤프를 초기화 뒤 복원하는 절차 없음 | **고침** | `docker/mysql/dump.sh:11`; `docker/mysql/dump.sh:35`; `README.md:57` | 시드와 중복되지 않게 앱 정지·대상 DB 삭제 후 빈 DB 복원을 설명했다. community는 대상 인자 필요, practice·project는 CREATE/USE 포함, project 백업 없으면 건너뜀. 백업 시점 행 수·대표 조회와 복원 뒤 대조를 명시. 복원은 실행하지 않았다. |
| 27 | P6:17 | down -v 안내 일부에 CloudBeaver 초기화 누락 | **고침** | `compose.yaml:51`; `scenario/ch10-project/10-1-new-project.md:197`; `scenario/README.md:214` | 루트 README 및 해당 시나리오 7개 문서의 모든 초기화 언급에 세 DB·CloudBeaver 작업 공간 삭제와 별도 보관 범위를 명시했다. 외부 예제 compose의 볼륨 범위까지 확대하지 않았다. |
| 28 | P8:16 | drills/lib.sh 죽은 잠금 동시 정리 경합 | **고침** | `messy-server/drills/lib.sh:16`; `messy-server/drills/lib.sh:17` | 죽은 pid를 본 실행자도 자동 rm하지 않고 실패한다. 모든 start·inject·recover 실행이 끝났음을 확인한 뒤 해당 잠금만 수동 정리하도록 안내한다. 정상 mkdir 잠금·대기는 유지. 자동 복구 대신 안전한 중단을 택했다. 동시 접근 8개와 정상 획득·대기·해제 검사 통과. |
| 29 | P8:17 | PgClientTest의 macOS 127.0.0.2 미할당 전제 | **보류** | `board-server/src/test/java/com/example/board/payment/PgClientTest.java:132`; `board-server/src/test/java/com/example/board/payment/PgClientTest.java:150` | 별칭 할당 호스트에서 준비가 실패할 수 있는 테스트 이식성 문제다. Java 테스트 변경 금지 범위라 보류하며 B01~B16의 서비스 결함과 구별한다. 호스트 별칭 설정을 임의 변경하지 않았다. |
| 30 | P8:32 | roadmap 2단계 제목·겪을 것의 원인 노출 5곳 | **이미 해결** | `course/roadmap.json:1226`; `tools/site/test-course-pages.mjs:500` | 7cf88b56 이후 D11 ④·D12 ③·D13의 B09/B07 순서·D14 ④를 현재 JSON과 대조했다. 원인 핵심어가 아닌 증상·중립 작업으로 교체돼 있다. 현재 B07은 D13 ②, B09는 D13 ③이며 원장에 지적된 각 순서의 노출 문구가 제거되어 있다. 누출 검사는 이번 실행 결과를 따른다. |
| 31 | P8:36 | B04 제출물의 ArchUnit·필드 주입 금지 직접 노출 | **이미 해결** | `course/tickets/B04.md:25`; `course/tickets/B04.html:65` | e835a527에서 구체 원인인 필드 주입 금지를 빼고 ArchUnit 규칙 1개로 이번 원인의 재발 막기라는 제출 도구만 남겼다. ArchUnit 자체는 허용된 작업 도구다. 변경 없음. |
| 32 | P8:36 | visual-inventory.jsonl에 남은 옛 순서 제목 | **보류** | `docs/design/visual-inventory.jsonl:2637` | 시점별 시각화 장부의 옛 기록을 현재 학습 페이지처럼 덮어쓰지 않는다. 검토·검증 상태를 새 근거 없이 변경하지 않는다. |
| 33 | P8:36 | P2 계획에 남았다는 옛 순서 제목 | **보류** | `docs/course-redesign/plans/2026-10-23-p8-ledger.md:36`; `docs/course-redesign/plans/2026-10-22-p2-answer-server.md:34` | 현재 P2 계획에서 확인되는 것은 정답 제작의 필드 주입 금지 원칙이며, 원장이 말한 옛 D11 순서 제목의 정확한 위치는 저장소에서 확인하지 못했다. 계획·이력을 추정으로 고치지 않는다. 현재 학습 화면의 제목은 항목 30에서 별도로 확인했다. |
| 34 | P8:40 | B04 repro.sh 내부 @Lazy 원인 단서 | **보류** | `messy-server/tickets/B04/repro.sh:145`; `messy-server/tickets/B04/repro.sh:146` | 실제 재현은 일회용 복사본에서 그 어노테이션을 정확히 제거해야 한다. 출력만 숨겨도 소스의 조작 대상은 남는다. 재현을 난독화하거나 의도된 서버 소스를 바꾸지 않고, 스크립트 열람 단서 허용 여부는 학습 정책으로 보류한다. |

## 공부자료 12개 전수 확인(항목 24)

`practice/starter`와 상품 API의 원래 코드·과거 실행 결과는 별도 예제임을 유지한다. 기존 부재 안내만으로는 실제 설정 파일을 찾아가기 어려워 현재 루트 compose 링크를 추가했다. R01은 이전 수정에서 이미 루트 DB로 이전되어 있었고 링크만 보강했다. W25는 과거 관찰 바로 뒤에 현재 실행 환경을 덧붙였다. R08은 현재 저장소 명령과 별도 상품 예제 절차를 구분했다.

- `docs/knowledge/R01-what-is-db-server.md:35`
- `docs/knowledge/R06-db-client-tools.md:17`
- `docs/knowledge/R08-app-to-db-connection.md:13`
- `docs/knowledge/P27-annotations-when-how.md:99`
- `docs/knowledge/P28-default-beans.md:44`
- `docs/knowledge/V01-what-and-how-to-test.md:83`
- `docs/knowledge/V02-layered-tests-handson.md:22`
- `docs/knowledge/V03-mocking-in-practice.md:214`
- `docs/knowledge/V04-test-db-strategy.md:36`
- `docs/knowledge/V05-testing-tricky-things.md:24`
- `docs/knowledge/V06-testing-at-work.md:26`
- `docs/knowledge/W25-spring-multithreading.md:53`

자료 목차도 `docs/knowledge/README.md:7`에서 실제 compose로 연결한다. 이 수정은 외부 상품 API의 테스트 12개를 현재 저장소에서 실행 가능하게 만드는 이식 작업이 아니다.

## 검증

- 최초 `npm run build`는 임시 index의 `git apply --cached`가 원본 `.git/objects`에 객체를 쓰려다 `Operation not permitted`로 실패했다. 적용 시점 검사가 이 예외를 패치 문맥 불일치로 표시했다.
- 저장소를 수정하지 않고 쓰기 가능한 임시 `GIT_OBJECT_DIRECTORY`와 읽기 전용 원본 `GIT_ALTERNATE_OBJECT_DIRECTORIES`로 분리해 같은 빌드·검사를 실행했다. 원본 Git index·refs·객체 저장소에는 쓰지 않았다.
- 셸 확인: `bash -n messy-server/drills/lib.sh`와 README 복원 코드 블록의 `bash -n` 통과. 임시 디렉터리에서 정상 획득·해제, 죽은 pid 잠금 동시 접근 8건의 모두 실패·잠금 보존, 살아 있는 소유자 해제 뒤 대기자의 획득을 실행해 확인했다.
- DB 복원·VM 기반 Docker 런타임·Java 서버 테스트·B04 재현은 실행하지 않았다. DB 초기화나 Redis 삭제도 실행하지 않았다.

| 검사 | 결과 |
|---|---|
| `cd tools/site && npm run build` | 통과: HTML 395개·링크 오류 0 |
| `npm run test:course` | 통과: 35/35 |
| `npm run validate:course` | 통과: endpoints 30·days 15·cards 68·day pages 17 |
| `npm run test:course-pages` | 통과: 5/5, 근거 문자열 293개·조작·원인 누출 검사 |
| `npm run audit:visual` | 통과: failures 없음 |
| `npm run audit:version-cards` | 통과: 4 cards |
| `npm run audit:parity` | 통과: 446건, verified 0건(상태 승격 없음) |
| 루트 `node --test tools/course/build-days.test.mjs` | 통과: 37/37 |
| `bash -n messy-server/drills/lib.sh` | 통과 |
| README 복원 코드 블록 `bash -n` | 통과(명령 실행 없음) |
| `git diff --check` | 통과 |

사이트 명령은 `tools/site`에서 실행했다. 최초 권한 오류 뒤 빌드와 build-days 검사는 위 임시 객체 저장소 환경을 사용했다. 초기화 관련 문구는 루트 compose의 실제 named volume 두 개 및 dump.sh의 옵션·세 DB 파일 구조와 대조했다.

## 변경 파일 목록

소스 파일(절대경로):

- `$WORKTREE_ROOT/p1-spec-roadmap/README.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/P27-annotations-when-how.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/P28-default-beans.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/R01-what-is-db-server.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/R06-db-client-tools.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/R08-app-to-db-connection.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/README.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V01-what-and-how-to-test.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V02-layered-tests-handson.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V03-mocking-in-practice.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V04-test-db-strategy.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V05-testing-tricky-things.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V06-testing-at-work.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/W25-spring-multithreading.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/messy-server/drills/lib.sh`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/README.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch1-create-post/1-3-service-layer.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch1-create-post/1-4-save-to-db.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch10-project/10-1-new-project.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch10-project/10-3-signup.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch10-project/10-7-post-list.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch9-schema-change/9-1-flyway.md`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/course-redesign/plans/p8-findings/deferred.md` (이 보고서)

생성 파일(자동 빌드):

- `$WORKTREE_ROOT/p1-spec-roadmap/README.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/P27-annotations-when-how.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/P28-default-beans.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/R01-what-is-db-server.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/R06-db-client-tools.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/R08-app-to-db-connection.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/README.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V01-what-and-how-to-test.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V02-layered-tests-handson.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V03-mocking-in-practice.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V04-test-db-strategy.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V05-testing-tricky-things.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/V06-testing-at-work.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/W25-spring-multithreading.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/index.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/README.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch1-create-post/1-3-service-layer.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch1-create-post/1-4-save-to-db.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch10-project/10-1-new-project.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch10-project/10-3-signup.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch10-project/10-7-post-list.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/scenario/ch9-schema-change/9-1-flyway.html`
- `$WORKTREE_ROOT/p1-spec-roadmap/docs/scenario-visual-state.json`

`docs/scenario-visual-state.json`의 R08 topic 17→18·전체 1773→1774는 별도 상품 예제 소제목 추가를 빌드가 반영한 값이다. Java·SQL·서버 설정 변경 0건, 생성 일자 Markdown 직접 변경 0건, 원장 원문 변경 0건, Git stage·commit·stash·reset·checkout·rebase 실행 0건이다.


## 집계

| 분류 | 건수 |
|---|---:|
| 이미 해결 | 9 |
| 고침 | 4 |
| 티켓 후보 | 11 |
| 보류 | 10 |
| 합계 | 34 |
