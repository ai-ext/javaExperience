# 온보딩 과정 개편 (course v2) — 작업 기록

2026-10-22 작업분. 설계·조사·계획 문서와 진행 원장이다.

| 폴더 | 내용 |
|---|---|
| [research/](research/README.md) | 현 시나리오 평가(01~04), 3~6년차 기준선·Spring·DB·장애·운영·커뮤니티·넷마블 조사(05~13), **개편 설계(14)** |
| [plans/](plans/2026-10-22-00-overall-roadmap.md) | 전체 계획 지도(P1~P7), P1·P2 상세 계획, 원장(판단 기록 포함) |

## 현재 상태

- **P1 완료**: `course/` — 명세서 v2(엔드포인트 30개), `roadmap.json`(D1~D15 순서표, J0~J15, 티켓 B1~B16 배정), 말하기 카드 68장, 검증기 `tools/course/`(테스트 24개)
- **P2 완료 (D01~D10)**: 정답 서버 `board-server/` — 순서별 커밋 `answer(Dnn-m)`, 로컬 태그 `answer-d01`~`answer-d10`, 테스트 366개
- **P3 완료**: Java 트랙 `java-track/`(J00~J15 학습 테스트, 뼈대 `src/main`·정답 `src/answer`) + 페이지 `course/java/J00~J15.md`. J마다 커밋 `java(Jnn)` 하나. `./gradlew :java-track:check`(정답 전부 통과 + J 클래스마다 뼈대 실패 확인)
- P4~P7 미착수

## 이어서 할 일

1. P4(어수선한 서버와 티켓 B1~B16) 계획 작성 — 출발점 `answer-d10`
2. 미뤄 둔 수정 (원장 `minor (deferred)`): 문서 3건은 반영했다. 남은 것은 P4 티켓 후보로 넘긴다.
   - `PostLikeService.like`가 `DataIntegrityViolationException` 전체를 삼킴 → 중복 키만 구분
   - 같은 새 태그 동시 생성 시 UNIQUE 충돌
   - 같은 회원의 댓글·좋아요 동시 요청 잠금 순서 교차(D09-5)
   - 작성자 수정이 관리자 숨김 사이에 끼면 `status`가 ACTIVE로 되돌아갈 수 있음(D10)

## 실행 메모

- 호스트에 JDK 21이 있으면 `cd board-server && ./gradlew test`. 없으면 `tools/course/gradle-docker.sh board-server test` (JDK 21 컨테이너 + Colima 소켓, Colima 전용)
- Java 트랙: `./gradlew :java-track:test --tests 'J05*'`(학습자 상태, 뼈대면 실패), `./gradlew :java-track:check`(정답 검증). 루트 `./gradlew test`는 java-track을 돌리지 않는다
- 문서 검증: `cd tools/site && npm run test:course && npm run validate:course`
