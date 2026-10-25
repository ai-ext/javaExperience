# 개념 학습 재구성 진행표

2026-10-25 · 기준 main `f6d82d705e279a0e74a5e6287a35cc51953e49ba` · 로컬 브랜치 `feat/concept-curriculum` · PC 다크 화면 범위

| 작업 | 최종 상태 | 확인 범위 |
|---|---|---|
| task1 분류·선수·원문 대응 모델 | PASS · 독립 검수 통과 | 기존 개념 134개 ID·원문 SHA, 필수/선택·분야·깊이, 선수 연결·오류 guard |
| task2 공식 근거·실행 관찰 | PASS · C01–C06 범위 | 공식 출처 19개·claim 22개; 직접 Luna 조사 1회에서 본문 18/19와 S14 snippet-only를 확인한 뒤, 메인 지시 표적 Luna 후속 1회로 S14 본문까지 확인(최종 19/19). 각 실행 shell 0·nested delegation 0. Java 21/Spring Boot 4.1.1 fixture 8 test, 독립 Sol 재현 8개·변이 6개·control 2개 |
| task3 목록·필터·검색 복귀 | PASS · PC 실제 탐색 | 필수·기초 기본값, 6개 필터 조합, `IoC` 검색 후 상세 진입·검색/필터 복귀 |
| task4 핵심 6개 단원 | PASS · PC 다크 | 3개 폭 × 6단원 × 3단계의 54 DOM 상태, 1440px 단원 화면 6개와 목록 캡처 직접 확인 |
| task5 통합 검증 | PASS · 로컬 범위 | 기존 45명령 PASS 이후 core 전용 변경의 표적 재검증, 공통 HTML 보존, 독립 코드 리뷰 PASS |

| 단원 | 새 실행 근거 | 화면 근거 |
|---|---|---|
| C01 객체·생성자 | fixture 관찰과 단계 설명이 연결됨 | PC 다크, 1280/1440/1920 DOM 상태 통과; 1440 캡처 직접 확인 |
| C02 Spring과 Boot·앱 시작 | DB 없는 최소 앱의 HTTP 응답·종료 관찰 | PC 다크, 3개 폭 DOM 상태 통과; 1440 캡처 직접 확인 |
| C03 애노테이션 처리 주체·시점 | retention·명시 호출을 실제 관찰과 구분; 네 처리 시점은 설명 지도이며 AOP 실행 근거가 아님 | PC 다크, 3개 폭 DOM 상태 통과; 1440 캡처 직접 확인 |
| C04 IoC·DI·생성자 주입 | 수동/컨테이너 조립 및 필수 의존성 누락 관찰 | PC 다크, 3개 폭 DOM 상태 통과; 1440 캡처 직접 확인 |
| C05 Lombok 생성 코드 | processor·delombok·컴파일 결과와 제한 범위 연결 | PC 다크, 3개 폭 DOM 상태 통과; 1440 캡처 직접 확인 |
| C06 Bean 생명주기 | setter 주입, 초기화, 사용, 정상 close 관찰 | PC 다크, 3개 폭 DOM 상태 통과; 1440 캡처 직접 확인 |

54개 화면 상태와 카탈로그 6개 필터 조합의 브라우저 결과는 [`BROWSER-QA.json`](BROWSER-QA.json)에 있다. 새 `core_learning_state` 18개는 브라우저에서 C01–C06 × 3단계를 확인한 근거를 연결해 `implemented`로 기록했다. `verified`로 올린 새 항목은 0개이며 기존 `verified` 6개는 보존했다. core 페이지 전체 장부 상태는 나머지 unreviewed 항목 때문에 `in_progress`다.

최종 출처 대조는 첫 직접 조사에서 본문을 연 18개와 표적 후속에서 연 S14 1개를 합쳐 19/19다. 최초 ledger가 S14를 `read`로 표시했지만 실제로는 snippet-only였음을 정정했고 C06 claim C21을 최종 본문에 맞췄다. 메인 본문 표본 대조는 별도로 7개 URL이며, 초기 재귀 CLI 미채택 건과 구분한다. 실행 경로와 대조 수는 [`research/sources.json`](research/sources.json)에 남겼다.

catalog 문구/구조 변경으로 main 기준 implemented 옛 ID 5개가 current live에서 retired됐다. 원본 5행은 [`historical-catalog-records.json`](historical-catalog-records.json)에 exact-copy로 보존했다. 옛 ID를 live로 되살리거나 새 대응 row로 evidence·상태를 자동 이관하지 않았으며, 새 5행은 unreviewed다. 현재 live implemented는 기존 905개 + 신규 core 18개 = 923개, 기존 verified 6개는 그대로다.

완료 범위는 기본 API 입문용 핵심 6단원의 PC 다크 구현·브라우저 확인이다. 기존 134개 상세 문서의 전체 내용 사실 검증·각 예제 실행 또는 개별 화면 개선 완료를 뜻하지 않는다. 모바일·라이트 테마와 imagegen 시안 parity도 확인하지 않았다. C03 설명 지도는 Spring AOP 실행 실험이 아니다.

복사 UI는 각 단원에서 성공 응답 문구가 표시됐다. 실제 OS clipboard round-trip은 자동화에서 현재 페이지/번들에 없는 이전 텍스트가 반환되고 native CUA fallback도 시작되지 않아 **미확정**이다. 앱 데이터·copy API의 원인 결함은 확정하지 않았다. 이 제한은 [`REPORT.md`](REPORT.md)와 [`FINAL-STATUS.json`](FINAL-STATUS.json)에 남기며 별도 follow-up으로 다룬다.
