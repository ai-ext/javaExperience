# 길찾기 재평가 지적 반영

- 확인일: 2026-10-24
- 작업 공간: `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap`
- 브랜치: `course/p1-spec-roadmap`
- 근거: `/Users/ds/.cache/jx-p8/reviews/scenario-eval2.md` 4절과 3절 7번. 아래 9개는 사용자가 지정한 구현 범위다.
- 시작 시 작업 트리는 깨끗했다. 저장소의 add·commit·stash·reset·checkout은 실행하지 않았다.

## 변경 소스

표의 기호는 아래 파일을 뜻한다. 생성 Markdown·HTML은 직접 편집하지 않고 사이트 빌드로 갱신했다.

| 기호 | 파일 |
|---|---|
| A | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/README.md` |
| B | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json` |
| C | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/hints.json` |
| D | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.mjs` |
| E | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course-pages.mjs` |
| F | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/build.mjs` |
| G | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/course.js` |
| T1 | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/course/build-days.test.mjs` |
| T2 | `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site/test-course-pages.mjs` |

## 항목별 대조와 처리

| 번호 | 직접 확인한 문제 | 반영 내용 | 수정 소스 | 상태·검증 |
|---|---|---|---|---|
| 1 | README 상단의 v2 안내 아래에서는 이전 101단계·루트 앱 실행으로 진입했다. | v2 홈 → 선택 D00/기본 D01, 도구, 출발 자료, Java/새 Spring 프로젝트 실행 위치를 먼저 배치했다. 이전 본문은 `참고 자료(이전 과정)` 아래 보존하고 시작 안내만 정정했다. | A, T1 | 구현 완료. 시작 경로·이전 본문의 보존 회귀 검사 추가. |
| 2 | D01의 출발 자료 복사 문장에 직접 링크가 없고 작업 위치가 구분되지 않았다. | 첫 순서 앞에 출발 안내와 실제 파일 4개 링크·복사 목적지·Java와 Spring 실행 위치를 추가했다. 순서 제목의 링크 없는 복사 문장은 파일 사용 안내로 바꾸고, 복사 행동은 머리의 실제 링크로 안내한다. | B, D, T1 | 구현 완료. 5개 링크와 두 실행 위치 검사. |
| 3 | D11은 코드 읽기부터 시작했다. 서버 전환 체크리스트가 없었다. | 1단계 앱·compose 종료 → 저장소의 messy-server로 전환 → compose 기동·상태 → local 앱 기동 → health 확인 → 수정 전 테스트 기록 → 티켓 규칙 순서를 추가했다. | D, T1 | 구현 완료. 명령·포트·규칙 링크 검사. 실제 서버 실행은 이번 범위에서 하지 않았다. |
| 4 | Java·티켓·훈련에 공통 복귀 링크와 Java 이전·다음 링크가 없었다. | 렌더러가 roadmap으로 Java 16쪽·티켓/훈련 18쪽의 머리·끝 복귀 링크를 만든다. 티켓은 사용하는 모든 일자·정확한 순서 앵커로, Java는 해당 날의 오늘 순서로 돌아간다. J00은 D00의 오늘 할 것으로 잇는다. Java 이전·다음도 roadmap 순서다. 훈련 진행 자료를 roadmap의 guides로 옮겨 수동 일자 매핑을 없앴다. | B, C, D, E, F, T2 | 구현 완료. 전체 34쪽의 양끝 링크·인접 J·대상 앵커 검사. 링크 이름은 일자·순서 번호·일자 제목만 사용한다. |
| 5 | D11 ②③ 완료 조건은 공통·연습·선택 결과가 섞여 있었다. | 본문이 채점 템플릿의 itemTickets와 같은 담당 판정 함수를 쓴다. D11~D14의 각 완료 조건에 공통 또는 티켓 ID·필수/연습/선택/고도화를 표시했다. | D, T1 | 구현 완료. 모든 2단계 C 항목의 본문 구분을 채점 담당과 대조한다. |
| 6 | D14 ⑤ 완료 조건은 E01 제출물 전체보다 좁았다. | E01 제출물 절 직접 링크와 “티켓 E01의 제출물 체크리스트 전부”를 완료 조건에 추가했다. 새 C5-3은 E01 고도화로 채점한다. | B, C, T1 | 구현 완료. 느린 적재·실패·삭제 경합·설계 메모·수정 diff까지 기존 티켓 체크리스트를 기준으로 삼는다. |
| 7 | J11·J14 설명이 실제 과제와 달랐다. 추가 전수 대조에서 J12·J13에도 과제 없는 선택 주제가 있었다. | J11 ThreadLocal, J12 정규식과 80줄, J13 record 패턴·text block·선택 switch, J14 JVM 메모리 소개를 실제 과제 설명으로 교정했다. Java 원문 과제는 바꾸지 않았다. | B, T1 | 구현 완료. J00~J15 대조는 아래 표. J11~J14 회귀 검사 추가. |
| 8 | 모든 관찰이 선택이며 필수 채점 제외라고 적혀 있었다. | observations를 text·required 구조로 바꾸었다. D05 ②의 flush 후 rollback·공유 태그 수명, D07 ①의 1차 캐시와 RC/RR을 꼭 할 관찰로 지정했다. 완료 조건과 AI 채점에 증거 제출을 포함하고, 겪을 것의 기존 선택·채점 제외 문구도 정정했다. 나머지 9개는 선택이다. | B, C, D, T1, T2 | 구현 완료. 12개 절차·순서 보존, 필수 정확히 3개, 완료·채점·접기 표시와 모순 문구 부재 검사. |
| 9 | 홈은 Java를 먼저 하라고 설명하면서 Spring 버튼을 우선했다. | Java(Jnn) → Spring(Dnn) → 채점의 링크를 한 행동 흐름으로 배치하고 Java를 주 행동으로 두었다. 이어하기에서는 세 링크를 같은 날로 함께 갱신한다. | E, G, T2 | 구현 완료. 첫 방문 J01/D01/채점과 D01 완료 뒤 J02/D02/채점 검사. 수동 진도 안내 유지. |

## D11 명령 근거

실제 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/messy-server/README.md`는 없다. 문서를 새로 만들거나 서버 코드를 고치지 않고 다음 파일과 대조했다.

- `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/messy-server/compose.yaml`: MySQL 13311, Redis·WireMock·Toxiproxy 서비스와 포트.
- `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/messy-server/src/main/resources/application-local.yml`: 앱 8080, local datasource 13311/board.
- `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/messy-server/build.gradle`: test의 JUnit Platform 설정.
- `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/messy-server/src/test/java/com/example/board/TestcontainersConfig.java`: 테스트 DB 격리 설정.
- `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/tickets/E01.md`와 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/tickets/drill.md`: compose와 local bootRun 실행 방식.
- `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/README.md`: 필수 B01~B04·선택 1건·E01·훈련 규칙.

기준 테스트는 “처음부터 모두 통과”라고 안내하지 않는다. 수정 전 성공·실패·로그를 남기고 수정 후와 비교하도록 안내한다. 1단계 종료 명령에는 볼륨 삭제 옵션을 넣지 않았다.

## Java 주제 설명 전수 대조

입력은 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/roadmap.json`의 java 항목, 대조 대상은 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J00.md`부터 `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/course/java/J15.md`까지의 상황·만들 것·타입 한 컷·확인 절이다.

| ID | 실제 주제·확인 대상 | 판정 |
|---|---|---|
| J00 | PostBoard·PostStreams·ValuePassing: 메서드·반복·값 전달·stream | 일치, 유지 |
| J01 | Member·record·Post: 생성자 검증·접근제어·방어적 복사 | 일치, 유지 |
| J02 | 예외 계층·Result·static, 선택 Lombok 코드 작성 | 일치, 유지 |
| J03 | Role·AuthMember·equals/hashCode·언박싱 | 일치, 유지 |
| J04 | DiscountPolicy 구현·추상 클래스·래퍼 동등성 | 일치, 유지 |
| J05 | DTO 변환·List/stream·Optional·중복 키 | 일치, 유지 |
| J06 | CursorPage·와일드카드·Comparator·Optional 지연 실행 | 일치, 유지 |
| J07 | Map/Set·공유 상태·AtomicInteger·synchronized·잔액 손실 | 일치, 유지 |
| J08 | Retrier.retry(Supplier, int)·예외 연결·try-with-resources | 일치, 유지 |
| J09 | Clock·TTL·KST 자정·시간 타입, 선택 DecimalAmount | 일치, 유지 |
| J10 | TimedProxy·리플렉션·동적 프록시·self-invocation | 일치, 유지 |
| J11 | 특성화 테스트·변형 6개·배열/Arrays.asList | ThreadLocal 과제 없음 → 설명 교정 |
| J12 | 76줄 PurchaseService를 검증·계산·저장으로 분리, OrderStatus enum | 정규식 선택 과제 없음·줄 수 다름 → 설명 교정 |
| J13 | DiscountPolicy 전략·CouponCode record 생성자 검증 | record 패턴·text block 과제 없음. switch 식은 연결부의 읽기 예시 → 과제 소개 교정 |
| J14 | Optional·빈 컬렉션, 선택 PointMath의 double/BigDecimal | JVM 메모리 과제 없음 → 선택 내용 교정 |
| J15 | 쿠폰 할인 계산기 종합·선택 타입 퀴즈 | 일치, 유지 |

## 회귀 검사와 최종 실행

RED 확인:

- 새 길찾기·관찰 검사 8건은 변경 전 일자 생성 결과에서 실패했다. 이 중 기존 관찰 검사도 새 입력 구조·필수 구분을 검사하도록 확장했다.
- 화면 검사 2건은 변경 전 생성 HTML에서 복귀 nav 부재와 홈 행동 흐름 부재로 실패했다.
- 필수 관찰의 기존 “하나만 선택·필수 채점 제외” 문구도 별도 단언으로 실패를 재현한 뒤 정정했다.
- 중간 생성기 실행의 새 테스트 한 건은 순서 칸 대신 위쪽 체크리스트를 고르는 테스트 파싱 오류였다. section 시작 태그로 범위를 고쳐 기능 검사로 바꿨다. 생성 중 소스를 바꿔 생긴 D04 최신성 실패도 최종 재빌드 뒤 통과했다.

실행 환경 보정:

- 임시 index를 쓰는 기존 검증기의 git apply가 기본 object 디렉터리에 쓰기를 시도해 sandbox에서 실패했다. `/tmp/jx-nav-objects`를 GIT_OBJECT_DIRECTORY로, `/Users/ds/code/javaExperience/.git/objects`를 GIT_ALTERNATE_OBJECT_DIRECTORIES로 지정했다. 저장소의 실제 index와 object는 수정하지 않는다.
- npm 하위 실행이 x64 Node를 선택하여 arm64 esbuild와 충돌했다. PATH 맨 앞에 `/opt/homebrew/bin`을 두어 arm64 Node로 실행했다. 패키지·전역 설정은 바꾸지 않았다.

최종 검사 상태: **요청한 9개 명령 모두 종료 코드 0**.

사이트 명령 작업 위치: `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap/tools/site`.
루트 명령 작업 위치: `/Users/ds/code/javaExperience/.worktrees/p1-spec-roadmap`.

| 명령 | 결과 | 최종 로그 |
|---|---|---|
| `npm run build` | HTML 395개·시나리오 101개·링크 오류 0 | `/tmp/jx-nav-final-build.log` |
| `npm run test:course` | 35/35 통과 | `/tmp/jx-nav-final-test-course.log` |
| `npm run validate:course` | 엔드포인트 30·일자 15·말하기 카드 68·일자 문서 17 검사 통과 | `/tmp/jx-nav-final-validate-course.log` |
| `npm run test:course-pages` | 명명 검사 9/9 및 본문의 전체 배치·진도·링크·복사·흐름·누출 검사 통과 | `/tmp/jx-nav-final-test-course-pages.log` |
| `npm run audit:visual` | failures 0, 기존 구조 검사 통과 | `/tmp/jx-nav-final-audit-visual.log` |
| `npm run audit:version-cards` | S09 카드 4개 검사 통과 | `/tmp/jx-nav-final-audit-version-cards.log` |
| `npm run audit:parity` | 기록 446개 검사 통과·verified 0 유지 | `/tmp/jx-nav-final-audit-parity.log` |
| `npm run test:navigation` | 공통 메뉴·생성물 339쪽+홈·목차 보존 검사 통과 | `/tmp/jx-nav-final-test-navigation.log` |
| `node --test tools/course/build-days.test.mjs` | 47/47 통과·생성물 최신성 통과 | `/tmp/jx-nav-final-days.log` |

추가 확인: `git diff --check` 통과. 서버 두 폴더 및 Java·티켓 원문 Markdown에 diff가 없음을 확인했다. HTML과 Spring 일자 Markdown은 빌드로만 갱신했다. 커밋·스테이징은 하지 않았다.

구현 항목별 회귀 검사는 T1·T2에 있으며 변경 전 RED와 최종 GREEN을 확인했다. 누출 검사는 티켓 페이지, Java 연결 문장, 모든 2단계 일자, 접기 제목과 접근성 속성까지 기존 검사 범위를 유지한다.

## 남은 검증과 범위

- 브라우저의 실제 렌더링·마우스 클릭·모바일 줄바꿈은 이번 실행에서 검증하지 않았다. JSDOM의 생성 DOM·링크·스크립트 동작 검사를 시각 검증으로 간주하지 않는다. parity verified 수를 올리지 않았다.
- 학습자의 Spring 앱·DB와 messy-server의 최초 기동·기준 테스트를 실제로 실행한 것은 아니다. 안내 명령은 위 실제 설정과 기존 실행 문서로 대조했다.
- board-server·messy-server 및 Java 원문 과제 내용은 변경하지 않았다. 2단계 원인·해법의 접기 밖 누출 검사는 최종 검사에 포함한다.
- 평가서의 D16~D30 확장 등 사용자 지정 9개 밖의 교육과정 재설계는 이번 범위에 포함하지 않았다.
