# task9 W11 독립 감사

판정은 **needs_completion**이다. 기존 보강 6질문·19상태의 주문/재고·트랜잭션 관찰은 저장된 코드/JSON과 일치한다. 원문 전체 완료는 아니다. quality는 spec 뒤 **진단만 수행**했으며 전체 승인을 부여하지 않았다.

- 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`
- 원문: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W11-why-tx-in-service.md](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W11-why-tx-in-service.md) · 369줄 · SHA256 `4d9a55cb4ccf321ad91c0df27209536f5632f72bef2a242c061ae04f8ca27579`
- fresh 명령: `npm --prefix tools/site run test:w11` → **exit 0**, UTC `2026-10-21T23:50:36.709768+00:00`. 실행 전후 관련 소스 해시 불변.
- 원시 결과/귀속: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/test-w11.run.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/test-w11.run.json), [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/test-w11.stdout.log](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/test-w11.stdout.log), [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/test-w11.stderr.log](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/test-w11.stderr.log).

## 요구사항 검토

원문 전문과 현재 HTML·lesson data/controller/renderer/tests·기존 VERIFICATION·source-proof를 대조했다. 원문 5Java블록은 추출 파일과 바이트가 같고, 생성 HTML의 전체 원문14944자/code5/id22 및 기존 focused/map 보존 검사는 통과했다. 원문 보존은 보충 학습 커버리지 완료와 다르다.

49 의미 단위(자가점검 복습 중복 포함): covered 11 / partial 21 / missing 11 / unrun 6. covered는 이번 DB·현재 브라우저·학습자 이해를 인증하지 않는다. 전체 행은 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/source-coverage.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/source-coverage.json)에 sourceLines/stageIds/evidence/gap으로 남겼다.

| 원문 의미 단위 | 줄 | stageIds | 판정 | 공백/근거 요약 |
|---|---|---|---|---|
| W11-U01 제목·3줄 요약 | 1–5 | repository-partial, service-commit, required-shared, template-risk | partial | 업무 경계를 선택하는 짧은 판단 장면 |
| W11-U02 1. 질문: 재고 실패 후 주문 잔존 | 7–9 | repository-insert, repository-guard, repository-partial | covered | B 실패: INSERT conn1 seq2 → commit3 → guard UPDATE conn2 seq7 rows0 → rollback8; 최종 orders7/6·stock5. |
| W11-U03 1. 질문: 웹·배치·메시지 공통 경계 | 11–11 | controller-insert | partial | 호출자별 업무 경계 재사용 비교 |
| W11-U04 2. 짧은 답: 업무와 계층 경계 | 13–17 | repository-partial, service-commit, required-shared | covered | 원문 B/C와 최종값·중간 observer·Tx 수를 비교한다. Controller도 DB 원자성을 제공함을 유지한다. |
| W11-U05 2. 짧은 답: public·readOnly | 18–18 | 없음 | missing | public 진입점과 readOnly 힌트 구분 |
| W11-U06 2. 짧은 답: 외부 호출 분리·전달 전략 | 19–20 | template-risk, events-observed | partial | 느린 외부 작업·내구성·보상 분리 장면 |
| W11-U07 2. 짧은 답: 자기 호출 | 21–21 | 없음 | missing | 외부 proxy 호출 대 this 호출 |
| W11-U08 3. 업무 경계·Unit of Work | 23–29 | repository-partial, service-commit | partial | 업무 불변식과 계층 역할 요약 |
| W11-U09 3. 클래스명이 아닌 유스케이스·재사용 | 31–31 | 없음 | missing | 클래스명과 업무 경계 소유 분리 |
| W11-U10 3. 관리 활성화·manager·proxy 메타데이터 | 33–35 | required-separate, required-shared | partial | annotation 단독 적용 불가·인프라 전제 |
| W11-U11 3. proxy 시작/참여·정상 반환 commit | 37–54 | required-separate, required-shared, service-commit | covered | B useCase 비proxy/Repository proxy, C 모두proxy, B conn1→2/C conn1→1의 실제 저장 증거가 있다. |
| W11-U12 3. JDBC 동기화·pool·지연 연결 | 56–56 | required-shared, template-risk | partial | pool 점유와 지연 연결 예외의 개념 장면 |
| W11-U13 3. 기본 rollback 예외·규칙 | 58–58 | service-failure | partial | 예외 종류/규칙별 결과 비교 |
| W11-U14 3. rollback 전파·manager 자원 한계 | 60–60 | service-failure | partial | 동일 manager 자원과 분산 자원 구분 |
| W11-U15 3. Controller 메서드 경계·재사용 | 62–64 | controller-insert, controller-failure, controller-success | partial | Controller가 가능한 것과 유스케이스 소유 판단 |
| W11-U16 3. 응답 직렬화·뷰 렌더링 | 66–66 | controller-success | unrun | 현재 MVC 수명주기 검증 또는 이론 장면 |
| W11-U17 3. OSIV와 Tx 구분 | 68–68 | 없음 | unrun | OSIV/영속성 컨텍스트/DB Tx 수명 비교 |
| W11-U18 3. Repository별 부분 커밋 | 70–72 | repository-guard, repository-partial, required-shared | covered | A commit 뒤 B 실패라는 일반 원리를 원문 B orders/inventory case로 구체화했다. 기본 REQUIRED 참여도 비교한다. |
| W11-U19 3. 외부 결제 성공과 DB 실패 | 74–76 | template-risk | unrun | 외부 부작용의 원자성/보상 사례 |
| W11-U20 3. AFTER_COMMIT·Outbox·Saga | 78–78 | events-observed, events-failure | partial | 시점과 내구성·분산 보상 비교 |
| W11-U21 4. 선택지 표·판단 기준 | 80–89 | controller-success, repository-partial, service-commit, template-success | partial | 요구 조건에 따른 네 방식 선택 활동 |
| W11-U22 5. 원문 명시 실행환경 | 91–93 | repository-insert, service-insert | unrun | 원문 환경 재실행은 별도 승인된 검증 단계 |
| W11-U23 5. 공통 PlaceOrder·저장소·guard SQL | 95–138 | repository-insert, repository-guard, service-decrease | covered | 원문 5Java 추출 바이트와 SHA 일치. quantity6 guard 실행 rows0와 실제 바인딩6/7/6, qty2 rows1를 구분한다. |
| W11-U24 5.A Controller 코드와 설계 한계 | 140–170 | controller-insert, controller-failure, controller-success | partial | 다른 진입점/외부 지연 비교 |
| W11-U25 5.B Repository 각각 경계 | 172–199 | repository-insert, repository-guard, repository-partial, repository-success, required-separate | covered | 성공의 두 독립 commit과 실패의 commit1/rollback1·stock5/주문 잔존을 모두 설명한다. |
| W11-U26 5.C 서비스·커밋 후 이벤트 코드 | 201–245 | service-insert, service-decrease, service-commit, service-failure, events-observed, events-failure | partial | 발행 후 rollback과 리스너 실패·내구성 범위 |
| W11-U27 5.D TransactionTemplate·외부 조회 | 247–289 | template-risk, template-rejected, template-success, template-failure | partial | 부작용 조회 대 승인/결제, reactive 선택의 개념 범위 |
| W11-U28 6. 신규 서비스 기본 | 291–293 | service-commit, required-shared | covered | 함께 커밋할 저장을 상위 유스케이스에 묶고 원문 Repository annotation은 유지한다. |
| W11-U29 6. readOnly 힌트 | 295–295 | 없음 | missing | readOnly는 보안 장벽이 아님 |
| W11-U30 6. 레거시 점진 이관 | 297–297 | repository-partial, required-shared | partial | 레거시 이동 전후의 경계 검토 |
| W11-U31 6. SI·금융 manager/자원 구성 | 299–299 | 없음 | missing | manager·자원 구성 확인 활동 |
| W11-U32 6. 연결·대기·잠금·rollback 관측·청크 | 301–301 | 없음 | missing | 운영 지표와 청크 원자성/재시작 비교 |
| W11-U33 6. 외부 시스템 주문·재발행/보상 | 303–303 | template-risk, events-observed | partial | 필수 전달과 보상 경로 |
| W11-U34 7. 오해1: 응답 전송 전체 Tx | 307–307 | controller-success | unrun | 응답 처리 단계별 경계 |
| W11-U35 7. 오해2: Repository별이면 업무 원자적 | 308–308 | repository-partial, required-shared | covered | 부분 commit과 REQUIRED 참여의 저장 증거/값이 직접 연결된다. |
| W11-U36 7. 오해3: 자기 호출·private·AspectJ | 309–309 | 없음 | missing | 프록시 우회와 별도 빈 해결 |
| W11-U37 7. 오해4: 모든 예외 rollback·catch | 310–310 | 없음 | missing | 예외·catch별 commit/rollback 결과 |
| W11-U38 7. 오해5: readOnly 쓰기 방지 | 311–311 | 없음 | missing | 힌트/권한 통제 분리 |
| W11-U39 7. 오해6: 긴 작업 전체 Tx | 312–312 | template-risk | unrun | 외부 대기와 자원 점유 개념 비교 |
| W11-U40 7. 오해7: DB·브로커·HTTP 전체 원자성 | 313–313 | service-failure | partial | manager 자원 경계 |
| W11-U41 7. 오해8: 커밋 후 이벤트 유실 없음 | 314–314 | events-observed | partial | best-effort/Outbox 재발행 구분 |
| W11-U42 8.Q1: 서비스 이유·Repository annotation 유지 | 316–322 | repository-partial, required-shared | covered | B/C 양쪽 Repository annotation을 보존한 상태에서 상위 Tx 참여를 비교한다. |
| W11-U43 8.Q2: Controller·직렬화·OSIV | 324–328 | controller-insert, controller-success | partial | Controller 재사용 및 수명 비교 |
| W11-U44 8.Q3: 두 Repository 부분 실패 | 330–334 | repository-partial, required-shared, service-failure | covered | B의 두 독립 경계와 C의 한 경계 실패가 모두 수량6/재고5에서 비교된다. |
| W11-U45 8.Q4: 자기 호출과 해결 | 336–340 | 없음 | missing | 자기호출 대비 외부 빈 호출 |
| W11-U46 8.Q5: 외부 API 위험과 순서 | 342–346 | template-risk | partial | 조회와 부작용 확정의 순서 차이 |
| W11-U47 8.Q6: AFTER_COMMIT 보장 범위 | 348–352 | events-observed, events-failure | partial | 리스너 실패와 필수전달 |
| W11-U48 8.Q7: readOnly 기본값·효과 | 354–358 | 없음 | missing | readOnly 의도·기술별 효과·권한 |
| W11-U49 9. 참고문헌·S08/S02 연결 | 360–369 | required-shared, template-success, events-observed | covered | 원문 6출처와 S08/S02 링크 보존, supplement 근거 링크 유지. 이번 감사에서 웹 출처를 다시 열거나 현재성 확인한 것은 아니다. |

## 기존 구현 품질 진단

확정 implementation finding은 **minor 1개**, critical/important 0개다. 전체 문서 공백은 위 표와 후속 묶음이며 이 이슈 수에 섞지 않았다.

**W11-Q01 — 복사 완료와 장면 이동의 경쟁**: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/w11-learning.js:99](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/w11-learning.js:99). repository-insert에서 clipboard Promise를 보류하고 service-failure로 이동한 뒤 resolve하면, 현재 표시 코드와 clipboard는 다르지만 현재 장면에 `코드를 복사했습니다.`가 표시된다. 기대는 오래된 복사 완료가 새 장면 status/selection을 변경하지 않는 것이다. 시작 장면/요청 식별자로 콜백을 제한하고 지연 resolve/reject·연속복사 회귀 검사를 추가하는 좁은 수정을 권한다.

재현: `node docs/design/concept-cycle-2026-10-22/tasks/task9/repro-copy-race.mjs` exit0은 **결함 관찰 assert 성공**이며 제품 수정 통과가 아니다. 관측은 [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/copy-race.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/copy-race.json)에 있다. 최초 reviewer 스크립트는 import 상대경로 오류로 exit1이었고, task9 스크립트만 고친 재실행이 exit0이다. 제품 파일은 바꾸지 않았다.

기술 대조의 핵심은 다음과 같다.

- Repository B 실패는 conn1 INSERT seq2 → commit3 → conn2 guard UPDATE seq7(rows0) → rollback8이다. 첫 INSERT 직후 별도 observer에는 주문이 없고, 두 번째 guard 뒤에는 앞서 커밋한 주문7/6이 보인다. 최종 stock5다. rows0은 UPDATE 미실행이 아니다.
- C/A/D는 같은 DB/manager에서 두 저장을 같은 연결에 묶는다. C 성공에서 writer는 UPDATE 뒤 주문7/2·stock3, 별도 observer는 주문없음·stock5이며 commit 뒤 최종 observer도 새 값을 읽는다. C의 update3 < physical commit4 < 추가 observer5 순서를 확인했다.
- C 실패는 원문 inventory guard가 publishEvent **이전**에 예외를 던진 경우다. listener0을 이미 발행한 이벤트의 rollback 억제 증거로 쓰지 않았다. 원문 handler는 no-op이고 추가 subclass가 super 후 관찰한 것이며 실제 알림/broker가 아니다.
- C에서도 Repository annotation을 유지한 REQUIRED 참여를 확인한다. 자기호출·다른 propagation·checked/catch/readOnly는 이 실행으로 검증하지 않았다.
- 트래커 연결1/2는 run-local wrapper ID이며 DB session/pool 개수가 아니다. trackedConnections0은 setup/raw observer/assert 연결을 제외한다. 원문 DML과 관찰 SELECT·setup·assert를 구분한다.

추가 정적 검증 요약: [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/static-proof.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task9/static-proof.json). 원문 Boot4.1.1/Java25 구조 예제와, 추가 Spring7.0.9 CGLIB/DataSourceTransactionManager/H2 2.4.240/JDK21·Boot BOM만의 과거 실험을 구분했다. Controller는 Java proxy 호출이며 HTTP/201/직렬화 실측이 아니다. RiskClient는 제어된 메모리 stub이다. JDBC 예제이므로 JPA flush 장면/EntityManager 관측으로 확대하지 않았다.

## 직접 본 이미지와 한계

- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/images/W11-repository-v3.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/images/W11-repository-v3.jpg)
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/images/W11-service.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/images/W11-service.jpg)
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/desktop-repository.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/desktop-repository.jpg)
- [LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/mobile-service.jpg](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w11-2026-10-20/mobile-service.jpg)

시안2장+역사 desktop/mobile 캡처2장을 직접 열었다. repository/service의 writer·별도 observer·commit/rollback 값과 한계 문구를 확인했다. desktop 캡처의 전체 그림 글자는 작고 확대 조작에 의존하며, mobile-service에는 번역 확장 overlay가 보인다. 현재 application 결함이나 현재 가독성 통과로 단정하지 않았다. 나머지4시안·10캡처는 미열람이다. 직접 확인한 JPEG 헤더는 시안1672×941, desktop full-page1672×2402, mobile full-page390×3300이다. full-page JPG 높이와 기록된 viewport1672×941/390×844는 같지 않다. 현재 viewport·가로 넘침·모바일 pan·복사/링크는 메인이 별도로 검사해야 한다.

## 남은 작업 묶음

- W11-R01 (coverage_gap): this 자기 호출·private·별도 빈/AspectJ를 비교하는 학습 장면을 만든다.
- W11-R02 (coverage_gap): RuntimeException/Error/checked/rollbackFor/catch 정상반환의 경계 결과를 비교한다.
- W11-R03 (coverage_gap): public 유스케이스 진입·read-write 기본/readOnly 힌트·DB 권한 통제를 구분한다.
- W11-R04 (coverage_gap): 웹·배치·메시지 재사용, Controller 메서드/직렬화/OSIV 수명을 구분한다.
- W11-R05 (coverage_gap): 연결 풀/잠금/지연 획득 및 외부 부작용·다중 manager 자원 경계의 의미를 장면으로 보완한다.
- W11-R06 (coverage_gap): 이미 발행한 이벤트 뒤 rollback, listener 실패 뒤 commit 유지와 Outbox 내구성/재발행/Saga 보상을 구분한다.
- W11-R07 (coverage_gap): 네 경계 선택의 조건·장단점·비용을 학습자가 비교할 수 있게 한다.
- W11-R08 (coverage_gap): 레거시 이관·manager/실제 자원·운영 지표·batch 청크/재시작/멱등성을 보강한다.
- W11-R09 (runtime_boundary): 원문 Java25/Boot 앱 및 HTTP/JPA/OSIV/실제 외부 자원은 별도 검증 계획에서 실행하거나 명시적 미실행을 유지한다.
- W11-R10 (current_browser_gate): 메인이 현재 desktop/mobile에서 19상태·복사·원문·확대/가로 이동·넘침을 검증한다.
- W11-R11 (implementation_defect): 비동기 clipboard 완료와 장면 변경의 상태 경쟁을 좁게 수정하고 회귀 검사한다.

이번 reviewer는 새 Java/DB/브라우저/웹/외부 CLI/LLM/agent를 실행하지 않았다. Node/jsdom 자동검사 통과·과거 native 실행 증거의 정적 일치·보충 장면 커버리지·현재 브라우저·전체 완료는 별도 상태로 유지한다. 현재 소스 수정이나 장부 승격을 수행하지 않았다.

boundedVerdict: needs_completion
fullDocumentComplete: false
coverage: covered=11, partial=21, missing=11, unrun=6 (49 의미단위)
issues: critical=0, important=0, minor=1; remainingBundles=11
actualExit: test:w11=0; copy-race-repro=0 (결함 재현 성공)
