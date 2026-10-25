# task8 · S08 독립 감사

판정: **needs_completion**, fullDocumentComplete=false. spec의 원문 전체 범위가 부족하므로 quality 승인은 하지 않는다. 한정된 기존 구현을 진단용으로 대조했을 때 확정 critical/important/minor 기술 결함은 발견하지 못했다. 원문 보존과 부분 보강의 정직성은 유지된다.

- 기준 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`
- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md (329줄, SHA256 `364142fe4a16b661ab5fee7ec388bcf1b4dca306d37ae9af521a7d40e6fc4e30`)
- 의미 단위: 63개 — covered 14, partial 27, missing 9, unrun 13. 단순 절 개수나 완료율이 아니다. 각 항목의 sourceLines/stageIds/evidence/gap은 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/source-coverage.json 참조.
- fresh `npm --prefix tools/site run test:s08`: UTC 2026-10-21T23:50:16.752111+00:00 → 2026-10-21T23:50:23.327818+00:00, exit0. 원시 stdout/stderr 및 HEAD·12소스 SHA는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/test-s08.execution.json과 동명 log에 보존했다.

## spec: 전체 문서 공백

10질문30단계는 이체·checked/runtime/noRollbackFor/catch·proxy·template·REQUIRED/NEW/NESTED·전파계약·readOnly·AFTER_COMMIT의 일부를 보강했다. 원문15066자/5코드/28id와 기존 집중 화면/지도는 fresh 검사로 보존 확인했다. **원문 보존은 새 학습 장면 완료와 다르다.**

격리4수준·4이상·DB별차이·DEFAULT, 기존 참여시 isolation/timeout 무시·검증모드, timeoutString/관리자선택/우선순위, 예외규칙 충돌/문자열/Error/ALL_EXCEPTIONS/Kotlin/Future/reactive, private·self REQUIRES_NEW·풀고갈, 이벤트 다른phase/fallbacktrue, outbox DDL/원자성/relay종료중복/멱등·재시도·정리는 선택 장면이 없거나 미실행이다. 버전 변화와 해당 자가점검도 장면으로 전부 연결되지 않았다. 기존 VERIFICATION의 미실행 선언과 일치하며, 이를 허위 성공 결함과 혼동하지 않는다.

## quality: 진단 관찰

- Spring 원문 import와 추가 probe는 `org.springframework.transaction.annotation.Transactional`이다. 학습자 PostService의 `jakarta.transaction.Transactional`은 다른 입력이며 이 실험 증거를 해당 서버의 속성 지원/동작 증거로 삼지 않았다.
- debit 직후 writer750/100·별도 READ_COMMITTED/autocommit observer1000/100, 정상commit750/350·명시checked rollback1000/100·direct new750/100이 Java fixture와 frozen JSON/lesson/현재HTML에서 일치한다. JDBC UPDATE 관측이며 JPA flush가 아니다.
- REQUIRED85 공유/catch후rollbackOnly/최종예외와rollback, NEW91→92→91 및 inner만보존, NESTED98 savepoint롤백 후outer만commit이 일치한다. sync=true와 실제transaction을 구분하고 tracked 번호를 DB세션/풀수치로 과장하지 않는다.
- readOnly flag·setReadOnly 요청·H2 쓰기성공을 분리한다. isolation=2는 단일 RC 관측이며 timeout=3은 초 단위 설정이다. 지연/만료·격리전수·풀고갈 실측을 주장하지 않는다.
- 기존 AFTER_COMMIT log는 afterCompletion 경로의 gateway예외를 기록하고 caller정상/order유지로 끝난다. callback active=true/sync=false를 미커밋 증거로 삼지 않는다. gateway[77]은 메모리호출이며 broker ack가 아니다.
- fresh npm은 frozen42PASS 이름·JSON 및 JSDOM/current bundle을 검사한다. **이번 Java42개 재실행은 없다.** SQL wire/latency/JPA/외부환경을 검증하지 않는다.

확정 finding 목록은 비어 있다. 향후 수정은 coverage gap과 다음 묶음을 사양으로 삼고, 변경 뒤 다시 spec→quality를 진행해야 한다.

## 시각 증거와 한계

실제 view_image로 최종 transfer-v3/required-v3/events-v3 이미지3장과 desktop-transfer/desktop-required/mobile-events 과거캡처3장을 열었다. 수치·호출순서·출처 구분을 확인했다. mobile-events에는 번역확장 overlay가 겹치므로 깨끗한 현재 증거로 재사용하면 안 된다. 나머지 selected7장/캡처17장은 미열람이다. 현재브라우저와 pixel 전수검증을 하지 않았으며 과거 viewport기록1672×941/390×844는 현재 DOM측정이 아니다.

## 남은 작업 묶음

1. 격리/속성/timeout의 미충족 의미 단위와 실행 경계를 작은 장면으로 보강한다.
2. 고급 예외규칙·private/self REQUIRES_NEW·스레드/reactive/Future의 조건과 결과를 추가한다.
3. 이벤트 다른phase·outbox business+event commit/relay실패/멱등·재시도·버전 변화를 보강한다.
4. Q&A·실무선택·전파 부재조건을 장면에 연결하고 메인이 현재 desktop/mobile 조작을 검증한다.

최종 판정: needs_completion.
자동 검사: fresh test:s08 exit0, 기존42PASS 증거 대조.
기술 진단: 확정 결함 없음, spec 미충족으로 quality 승인 없음.
시각 검토: selected3장·과거캡처3장 열람, 현재브라우저 미실행.
다음 작업: 격리/timeout·고급경계·outbox/버전·자가점검 보강 및 메인 현재브라우저.
