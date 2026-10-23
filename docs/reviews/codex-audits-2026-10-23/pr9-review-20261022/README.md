# PR #9 총체 평가

확인일: 2026-10-22 KST. 대상: [PR #9](https://github.com/ai-ext/javaExperience/pull/9), `course/p1-spec-roadmap` → `main`.

- 평가 HEAD: `c9786af3b97c48ec118cade5777bc015fe282a88`
- base/merge-base: `1f443faae406324f8c5a3c87b2741ad0b74913a6`
- 마지막 원격 확인에서도 같은 HEAD. 변경217파일·55커밋. GitHub `CLEAN`/mergeable이며 draft는 아니지만, 연결된 check run·status check는0개다. `CLEAN`은 테스트 통과나 교육과정 완성을 뜻하지 않는다.

**판정: 커리큘럼 개편 방향과 계약 설계는 좋다. 그러나 아직 완성된 학습 과정이 아니며, 현재 정답 서버에는 재현된 데이터 정합성 문제가 있어 현 상태의 머지를 권하지 않는다.**

앞선225개 시나리오 감사는 실제로 시나리오의 요구·시작점·검사·심화 연결을 검토한 작업이다. 이번 PR은 그 감사 자료나 기존101개 화면 전체를 완성한 PR이 아니라, 별도의 course v2와 정답 서버를 추가하는1차 작업이다. 이전 감사의 통과 결과를 이번 코드의 검증으로 가져오지 않고 현재 HEAD에서 다시 검사했다.

## 이 PR에 들어 있는 것

| 구분 | 현재 산출물 | 평가 |
|---|---|---|
| P1 설계·명세 | 명세 v2,30개 엔드포인트, D01~D15 로드맵, Java J00~J15 항목, 말하기 카드68개 | API·오류·권한·데이터·운영 값을 함께 정의한 점이 좋다 |
| P1 검사 | 문서/로드맵/카드 사이 ID·참조·개수 검사24개 | 연결 오류를 잡는 유용한 구조 검사. 의미·실행·학습 효과까지 검증하는 검사는 아니다 |
| P2 정답 | 별도 board-server의 D01~D08, main Java103개, 테스트 Java59개 | 실제 구현·DB/동시성/PG 실패 테스트가 있다. D09·D10은 명시적으로 남아 있다 |
| P3 Java 트랙 | 배울 항목만 로드맵에 배정 | 실제 Gradle 학습 모듈·빈칸 테스트·Java 페이지는 아직 없다 |
| P4 유지보수 티켓 | B01~B16 배정 | 어수선한 서버·재현 스크립트·개별 티켓은 아직 없다 |
| P5 학습 화면 | course의 README/명세/말하기 카드3페이지가 렌더링됨 | 일자별 “오늘 만들 것→실행→실패→검증” 페이지는 아직 없다 |
| P6/P7 | 기존 자료 정리와 전 과정 재검증 계획 | 미착수로 명시돼 있다. 이번 PR의 숨은 구현 버그로 세지 않았다 |

근거: [현재 상태 문서](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/docs/course-redesign/README.md), [전체 계획](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/docs/course-redesign/plans/2026-10-22-00-overall-roadmap.md), [과정 안내](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/course/README.md).

## 머지 전에 해결할 문제

### F1 · P1 · 재시도 중 결과 불명 이력을 잃어 정상 결제를 복구하지 못한다

첫 PG 시도에서5xx를 받고 뒤의 두 시도가 연결 실패하면 `PgRetryPolicy`는 마지막 `UNREACHABLE`만 던진다. `ChargeService.fail`은 이를 “PG에 닿지 않았다”로 해석해 `FAILED`로 확정한다. 하지만 첫 시도는 이미 PG에 닿았다. 이후 올바른 서명의 DONE 콜백이 와도 `markDone`은 REQUESTED/UNKNOWN에서만 전이하므로 복구되지 않는다. reconcile도 FAILED를 재조회하지 않는다.

**관측:** 재시도3회 → 충전502 → DB FAILED → 정상 서명 DONE 콜백200 → 여전히 FAILED, 잔액0·충전 원장0. 외부 PG 호출만 대역으로 실패 시퀀스를 주입하고 실제 재시도 클래스·충전/콜백 서비스·MySQL로 확인했다. 실제 결제업체를 호출한 것은 아니다. 신뢰도9/10.

**수정 방향:** 시도 전체의 결과 불명 가능성을 보존한다. 최종 연결 실패만으로 과거 시도의 승인 가능성을 지우지 말고, 조회·콜백으로 확정할 수 있게 한다. 5xx→연결 실패, commit 후 응답 유실, 늦은 콜백을 회귀 검사에 넣는다.

근거: [마지막 예외만 전달하는 재시도](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/payment/PgRetryPolicy.java#L30), [FAILED 확정](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/payment/ChargeService.java#L146), [DONE 전이 조건](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/payment/PgPaymentRepository.java#L21).

### F2 · P1 · 게시글 수정이 좋아요 수를 되돌리고 삭제된 글을 되살릴 수 있다

`update/patch/delete`는 잠금 없는 `findActiveDetail`로 읽고 엔티티를 변경한다. Post에는 version 검사가 없으며 변경 감지 UPDATE가 이전에 읽은 like_count/status도 함께 쓴다. 다른 transaction의 원자적 좋아요 UPDATE나 삭제와 경합할 때 정합성이 깨진다.

**관측1:** 수정 transaction이 like_count0을 읽음 → 실제 LikeService가 관계1개와 카운터1을 commit → 앞선 객체를 patch/flush → **관계1개, like_count0**.

**관측2:** 수정 transaction이 ACTIVE를 읽음 → 실제 delete 서비스가 DELETED를 commit → 앞선 객체를 patch/flush → **ACTIVE로 되돌아옴**.

실제 Entity·Repository·쓰기 서비스를 사용해 서비스의 조회/변경/flush 구간을 barrier로 통제했다. 두 실제 HTTP 요청을 끝까지 경합시킨 테스트는 아니다. 신뢰도9/10.

**수정 방향:** 카운터 UPDATE·게시글 수정·삭제가 함께 지키는 경합 정책을 정한다. version만 선언하거나 UPDATE 열만 줄이는 것으로 모든 경로가 해결됐다고 가정하지 말고, 위 두 순서의 DB 불변식을 각각 검사한다.

근거: [수정·삭제 경로](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/post/PostServiceImpl.java#L57), [Post 매핑과 상태](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/post/Post.java#L29).

### F3 · P2 · 대소문자만 다른 태그를 한 번 보내도500

Java의 문자열 Set은 대소문자를 구별하지만 테스트 DB의 collation은 구별하지 않는다. 같은 요청의 `java`/`JAVA` 같은 값이 동일 Tag로 해석되어 post_tag 중복 제약에 걸린다. 문서에 이미 적힌 “같은 새 태그의 동시 생성”과 다른, **단일 요청** 반례다.

**관측:** 정상 길이의 태그2개를 대소문자만 달리해 POST →500, 글 행0. 신뢰도10/10.

**수정 방향:** 태그의 동등성 정책을 DB와 맞추고, 해석된 태그 ID 기준으로 연결 중복도 방어한다. create/PUT/PATCH 모두 같은 계약을 적용한다.

근거: [create의 중복 제거와 연결](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/post/PostServiceImpl.java#L40), [replaceTags](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/post/Post.java#L91).

### F4 · P2 · 명세상 허용되는 비밀번호가 BCrypt에서500

명세와 DTO는8~64자 및 영문·숫자 각1자 이상을 요구한다. `a1`+한글24자는26자라 통과하지만 UTF-8로74바이트여서 BCrypt 처리에서 실패한다.

**관측:** 가입500 `/errors/internal`, 회원 행0. 신뢰도10/10.

**수정 방향:** 입력 명세와 encoder의 허용 범위를 맞춘다. 명세가 허용하는 입력은 성공해야 하고, 정책상 제한할 입력은 명세와 검증을 함께 바꿔400으로 처리한다. 비밀번호를 조용히 잘라 저장하는 수정은 피한다.

근거: [문자 수 검증](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/member/SignupRequest.java#L8), [실제 encode](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/member/AuthService.java#L51).

### F5 · P2 · 현재 환경에서 원래 테스트2개가 반복 실패

원래 명령을 두 번 실행했고 모두 **252개 중250개 통과·2개 실패·skip0**이었다. `PgClientRetryTest`의 두 연결 실패 테스트다. `proxy.disable()` 뒤 연결 거부를 기대하지만 관측된 원인은 `NoHttpResponseException`이며 코드가 TIMEOUT으로 분류했다.

이는 현재 환경에서 재현된 테스트 실패다. 작성자의 Colima 컨테이너 실행에서252개가 통과했다는 과거 기록을 거짓이라고 단정하지 않는다. 또한 “응답 없음”을 무조건 UNREACHABLE로 바꿔 녹색으로 만드는 것은 결제 안전성을 해칠 수 있다.

**수정 방향:** 연결을 맺지 못한 실패와 전송 후 응답이 끊긴 실패를 안정적으로 구분하는 fixture를 사용한다. 지원 실행 환경에서 재현되는 CI 검사를 붙이고 결과를 갱신한다. 신뢰도10/10(이번 환경·명령의 반복 실패에 한정).

근거: [기존 연결 실패 테스트](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/test/java/com/example/board/payment/PgClientRetryTest.java#L114).

### F6 · P2 · “좋아요·취소 혼합” 테스트가 실제로는DELETE만 수행

이 테스트는 좋아요를 먼저 순차로 넣은 뒤, worker마다 DELETE 두 개를 실행한다. PUT/DELETE가 섞인 경합을 검증했다고 볼 수 없다. **검사 결함**이며 이 사실만으로 혼합 요청의 제품 동작이 깨졌다고 단정하지 않는다. 신뢰도10/10.

근거: [테스트 이름과 두 DELETE](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/test/java/com/example/board/post/PostLikeApiTest.java#L122).

## 추가 검토 항목 — 위 재현된 결함과 구분

승인·조회 경로는 PgApproval.amount와 저장된 요청 금액을 비교하지 않지만 콜백 경로에는 금액 검사가 있다. 외부 응답이 잘못됐을 때의 방어를 보강할 근거가 있다. 이번에는 잘못된 금액의 PG 응답을 실행하지 않았으므로 별도 정적 발견으로 둔다. 외부 PG를 공격할 수 있다는 뜻은 아니다. [ChargeService](https://github.com/ai-ext/javaExperience/blob/c9786af3b97c48ec118cade5777bc015fe282a88/board-server/src/main/java/com/example/board/payment/ChargeService.java#L124)

문서에 공개된 deferred5건은 새 발견으로 중복 집계하지 않았다. 그렇다고 사소하다는 뜻은 아니다. 특히 모든 DataIntegrityViolationException을 중복으로 삼키는 좋아요 경로, 태그 생성 경합, 명세와 구현의 쿠폰 정책 차이는 정답 품질 관점에서 함께 정리해야 한다. D09로 미룬 댓글 포인트 적립도 미착수 선언과 원장 결정을 확인해 D07 숨은 누락으로 세지 않았다.

## 교육과정 관점의 평가

**좋아진 점**

- 기능 목록을 넘어 업무 불변식을 다룬다. D07은 잔액·원장·재고·쿠폰·중복 구매를, D08은 외부 요청과 DB transaction의 경계·UNKNOWN 복구를 묶는다.
- 성공 응답만 보지 않고 DB 행·영향 행 수·동시 요청·SQL 수를 확인하는 테스트가 실제로 있다. 테스트252개는 이름만 붙인 검사가 아니다.
- 명세에 권한·필드·오류·커서·비밀값·timeout을 함께 적고 말하기 카드로 선택 이유를 설명하게 한 방향은 좋다.
- 시나리오·명세·정답·Java·티켓·화면·최종 검증의 산출물을 나눠 현재 상태를 숨기지 않았다.

**아직 학습자가 막힐 지점**

- “오늘 순서대로 만든다”는 안내에 대응하는 D01~D15 학습 페이지가 없다. JSON과 정답 서버가 있어도 초보자의 연속 학습 동선은 완성되지 않았다.
- Java 초보자에게 J00를 선택 반나절~1일로 두면서, 실제 Java 실습 모듈은 아직 없다. 문법·빌드·DB·Spring을 동시에 배워야 하는 부담을 진단할 선행 시험과 분기가 필요하다.
- 15일은 일정 틀이다. 초보/경험자의 수행 시간을 관찰한 근거가 없어 완주 기간이나3~6년차 역량을 보장하는 숫자로 쓰면 안 된다.
- DB 주제는 기존보다 좋아졌지만 모든 SQL·인덱스·운영 심화가 완결된 것은 아니다. 윈도 함수·집합 연산의 독립 문제, 데이터 분포/쓰기 비용 실험, 실제 복구 등은 기존 자료와 연결해 추가해야 한다.
- Flyway를 쓰지 않고 schema.sql로 시작하는 선택은 명시된 범위다. 다만 D13의 운영 스키마 변경으로 넘어갈 때 빈 DB의 CREATE IF NOT EXISTS와 이미 존재하는 DB의 이행을 분리해 가르쳐야 한다.

## 권고 순서

1. **현재 정답의 F1/F2 정합성 문제와 F3/F4 입력 계약을 고친다.** 학생에게 틀린 동작을 정답으로 제시하지 않도록 한다.
2. **F5/F6을 고치고 CI로 원래 검사를 재현한다.** 반례가 수정 전 실패·수정 후 통과하는 회귀 검사도 함께 둔다.
3. **Java 준비도 검사와 D01~D03의 학습자용 하루 흐름을 먼저 완성한다.** 설치→구현→실패→복구→검증→말하기까지 실제로 따라갈 수 있게 한다.
4. **D06/D07/D08을 대표 심화 일자로 검증한다.** SQL·DB 상태·동시성·외부 실패를 학습자가 직접 관찰한 뒤 설명하는지 확인한다.
5. **D09/D10 및 P3~P6을 채우고 P7을 수행한다.** P1 검사 통과나 정답 서버의 테스트 수로 학습 과정 전체 완료를 대신하지 않는다.

계획·명세 부분만 먼저 합치는 PR 분리는 선택 사항이다. 현재 PR을 그대로 유지한다면 적어도 위 정답 정합성과 재현 실패를 해결한 뒤 재검토하는 편이 맞다.

## 이번 검증 결과와 한계

| 검사 | 결과 |
|---|---|
| 문서 검사 테스트 | 24/24 통과 |
| 실제 course 참조 검사 | 30 endpoints /15 days /68 cards 통과 |
| 사이트 빌드 | HTML342개, 링크 오류0, 커밋된 생성물과 diff0 |
| 원래 서버 테스트1차 | 252 중250 통과·2 실패 |
| 같은 명령2차 | 동일한2개 실패 |
| 추가 반례 관찰 | 5개에서 예상한 잘못된 동작 재현. 제품 정상 통과 수에 합산하지 않음 |
| 원격 CI | 확인한 HEAD에 연결된 check0개 |
| 코드 보존 | 고정 검토 worktree의 git status clean. 제품 코드 수정·커밋·push·PR 댓글·머지 없음 |

교육 문서는 Luna가, 코드·테스트는 별도 검토자와 메인이 분담했다. adversarial 검토자는 테스트·fixture를 요약으로만 읽었고, 별도 계약 검토자와 메인이 필요한 테스트 본문 및 실제 실행을 확인했다. 외부 Claude CLI 검토는 수행하지 않았다. 브라우저·모바일·실제 학습자의15일 완주 시간은 이번에 검증하지 않았다.

주요 증거:

- [/Users/ds/research/javaexperience-pr9-review-20261022/_data/verification-summary.json](/Users/ds/research/javaexperience-pr9-review-20261022/_data/verification-summary.json)
- [/Users/ds/research/javaexperience-pr9-review-20261022/_data/original-failures.json](/Users/ds/research/javaexperience-pr9-review-20261022/_data/original-failures.json)
- [/Users/ds/research/javaexperience-pr9-review-20261022/_data/probe-tests/ReviewBoundaryProbeTest.java](/Users/ds/research/javaexperience-pr9-review-20261022/_data/probe-tests/ReviewBoundaryProbeTest.java)
- [/Users/ds/research/javaexperience-pr9-review-20261022/_data/probe-tests/payment/ReviewPgProbeTest.java](/Users/ds/research/javaexperience-pr9-review-20261022/_data/probe-tests/payment/ReviewPgProbeTest.java)
- [/Users/ds/research/javaexperience-pr9-review-20261022/curriculum-review.md](/Users/ds/research/javaexperience-pr9-review-20261022/curriculum-review.md)
- [/Users/ds/research/javaexperience-pr9-review-20261022/contract-tests-review.md](/Users/ds/research/javaexperience-pr9-review-20261022/contract-tests-review.md)
- [/Users/ds/research/javaexperience-pr9-review-20261022/adversarial-review.md](/Users/ds/research/javaexperience-pr9-review-20261022/adversarial-review.md)

보조 검토자의 “실행 미확인” 후보 중 F1~F4는 이후 메인의 위 실행으로 갱신했다. 상충하면 이 종합 보고서와 verification-summary의 실제 관측을 우선한다.
