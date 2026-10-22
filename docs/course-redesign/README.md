# 온보딩 과정 개편 (course v2) — 작업 기록

2026-10-22 작업분. 설계·조사·계획 문서와 진행 원장이다.

| 폴더 | 내용 |
|---|---|
| [research/](research/README.md) | 현 시나리오 평가(01~04), 3~6년차 기준선·Spring·DB·장애·운영·커뮤니티·넷마블 조사(05~13), **개편 설계(14)** |
| [plans/](plans/2026-10-22-00-overall-roadmap.md) | 전체 계획 지도(P1~P7), P1·P2 상세 계획, 원장(판단 기록 포함) |

## 현재 상태

- **P1 완료**: `course/` — 명세서 v2(엔드포인트 30개), `roadmap.json`(D1~D15 순서표, J0~J15, 티켓 B1~B16 배정), 말하기 카드 68장, 검증기 `tools/course/`(테스트 24개)
- **P2 진행 중 (D01~D08 완료)**: 정답 서버 `board-server/` — 순서별 커밋 `answer(Dnn-m)`, 로컬 태그 `answer-d01`~`answer-d08`, 테스트 252개 통과. D09·D10 남음
- P3~P7 미착수

## 이어서 할 일

1. 우선순위 재검토: 정답 서버(P2)보다 시나리오·화면(P5)을 먼저 할지 결정
2. P2 남은 일: D09(Redis), D10(관리자·AOP·엑셀) — 계획 `plans/2026-10-22-p2-answer-server.md` Task 9·10
3. 미뤄 둔 수정 (원장 `minor (deferred)`):
   - `course/roadmap.json` 문구의 환경 변수 `JWT_SECRET`·`PG_SECRET` → `BOARD_JWT_SECRET`·`BOARD_PG_SECRET`
   - `course/spec-v2.md` §5-4에 쿠폰 할인율(10%)·재고 부족 409 `/errors/out-of-stock` 반영
   - `PostLikeService.like`가 `DataIntegrityViolationException` 전체를 삼킴 → 중복 키만 구분
   - `board-server/src/main/resources/application-prod.yml` 주석 정정(기동 실패는 `ProdSecretsCheck`가 담당)
   - 같은 새 태그 동시 생성 시 UNIQUE 충돌 — P4 티켓 후보

## 실행 메모

- 호스트에 JDK가 없으면 `tools/course/gradle-docker.sh board-server test` (JDK 21 컨테이너 + Colima 소켓)
- 문서 검증: `cd tools/site && npm run test:course && npm run validate:course`
