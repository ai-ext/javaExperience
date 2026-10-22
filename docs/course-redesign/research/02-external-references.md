# 02. 비교할 만한 Java / Spring Boot 온보딩·과제 레퍼런스 (2026-10-22 조사)

조사 방법: GitHub API `pushed_at`·README, URL 200 응답. **[확인]**은 레포·문서를 직접 열어 본 것이고 **[부분]**은 URL만 확인하고 상세는 일반 지식인 것이다.

| 이름 | URL | 형식 | 채점 | 최근 갱신 | 차용할 점 |
|---|---|---|---|---|---|
| 우테코 java-jdbc / java-mvc / java-http [확인] | github.com/woowacourse/java-{jdbc,mvc,http} | `study/` **학습 테스트**(깨진 테스트 통과시키기) → 미션 | 테스트 통과 + PR 리뷰 | 2026-10 | 단계 초입에 개념 학습 테스트를 선행시키기 |
| 우테코 spring-roomescape-* [부분] | github.com/woowacourse/spring-roomescape-{admin,member,auth,waiting,payment} | 한 도메인을 관리자→회원→인증→대기→결제로 확장. 요구사항은 LMS(비공개) | PR 리뷰 | 2025-06~2026-09 | 도메인 하나를 점진 확장 (우리 101단계와 같은 축) |
| 우테코 프리코스 [확인] | github.com/woowacourse-precourse/java-{racingcar,lotto,baseball}-6 | README 요구사항 + 기능 목록 작성 + 제공 테스트 | PR 제출 | 2024 | 프론트 출신의 Java 워밍업 |
| NEXTSTEP atdd-subway-* [확인] | github.com/next-step/atdd-subway-{map,path,favorite,fare} | **인수 테스트가 요구사항**(RestAssured) | 개인 브랜치 + 리뷰어 자동 배정 PR | 2024 (정체) | C/D 표를 인수 테스트로 바꾸면 자동 채점 |
| NEXTSTEP ddd-legacy (키친포스) [확인] | github.com/next-step/ddd-legacy | 레거시 코드 + 요구사항·용어사전 **빈칸을 학습자가 채움** | PR 리뷰 | 2025 | 티켓 착수 전에 "현행 동작을 문서·테스트로 고정" 단계 |
| NEXTSTEP codereview 문서 [확인] | github.com/next-step/nextstep-docs/tree/master/codereview | 미션 시작 → ID 브랜치 생성·리뷰어 배정 → 단계별 PR | 사람 | 2026-02 | 운영 절차(브랜치·PR·merge 의례) |
| spring-petclinic [확인] | github.com/spring-projects/spring-petclinic | 완성 참조 앱 | 없음 | 2026-09 | 모범 코드 비교용 |
| Spring Guides [부분] | spring.io/guides | `initial`/`complete` 쌍 튜토리얼 | 자가 | 2026-09 | 단계별 시작점·완성점 쌍 (우리 snapshots와 같은 발상) |
| RealWorld (Conduit) [확인] | github.com/realworld-apps/realworld, github.com/raeperd/realworld-springboot-java | **API 명세만** 주고 구현 자유 | 명세 API 테스트 | 2026-10 | 게시판과 도메인 거의 동일. 10장(명세서 프로젝트)의 대조군 |
| roadmap.sh Backend Projects [부분] | roadmap.sh/backend/projects | 25개 프로젝트, 난이도 3단 | 확인 불가 | — | 과제 아이디어 풀 |
| CodeCrafters [부분] | codecrafters.io/challenges | 아주 작은 단계 + push 시 서버 테스트 (유료) | 자동 | — | 101단계와 가장 닮음. 즉시 피드백 |
| Exercism Java [부분] | exercism.org/tracks/java | 문제 + JUnit | 자동 + 멘토 | 2026-10 | Java 문법 보충 병행 |
| Gilded Rose Kata [확인] | github.com/emilybache/GildedRose-Refactoring-Kata | 요구사항 문서(한국어 있음) + 레거시 + 기능 추가 | 없음 | 2026-08 | 티켓의 단순 원형. 1~2시간 워밍업 |
| Trip Service Kata [확인] | github.com/sandromancuso/trip-service-kata | 의존성 끊고 테스트 100% → 리팩터 | 없음 | 2024-06 | T-030(엔티티 누출 리팩터) 전 연습 |

## 확인하지 못한 것

- 카카오·토스·당근·라인의 공개 신입 과제·온보딩 레포 — 검색에서 안 나옴.
- 동시성·락·N+1 장애를 **티켓 형식**으로 재현시키는 공개 레포 — 찾지 못함. javaExperience의 T-017~T-029가 공개 범위에서는 드문 자산으로 보인다(공개 검색 범위 안의 판단).
- 우테코 roomescape·coupon의 단계별 요구사항 본문(LMS 전용), CodeCrafters 테스트러너·Exercism 멘토링·Hyperskill 상세.

## 과제 제시 형식 패턴

| 패턴 | 사례 | 장점 | 단점 |
|---|---|---|---|
| 학습 테스트 통과 | 우테코 java-*, spring-learning-test | 자동 채점, 개념 격리 | 사용법 편중, 설계력 X |
| 한 도메인 단계 확장 | roomescape, **javaExperience 시나리오** | 현실 감각, 누적 | 앞 단계 부실 시 연쇄 붕괴 |
| 인수 테스트 = 요구사항 | atdd-subway | 요구사항이 곧 채점 | 내부 설계 품질 못 잡음 |
| 작은 단계 + 즉시 피드백 | CodeCrafters, Exercism | 완주율 | 큰 그림 설계 경험 부족 |
| 명세만 주고 자유 구현 | RealWorld, **javaExperience 10장** | 판단력, 비교 가능 | 신입에겐 막막 |
| 레거시 + 변경 요구 | Gilded Rose, ddd-legacy, **javaExperience 티켓** | 실무 감각 | 자동 채점 어려움 |
| PR + 사람 리뷰어 | 우테코, NEXTSTEP | 피드백 질 | 리뷰어 병목 |
| 완성본 참조 | petclinic, Spring Guides | 막힐 때 비교 | 베끼기 |
