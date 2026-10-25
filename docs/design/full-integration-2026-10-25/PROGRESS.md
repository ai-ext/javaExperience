# 서비스 만들기 통합 진행표

확인일: 2026-10-25. 사용자가 전달한 「과정 v2 → 서비스 만들기 메뉴 통합 요청」 전체를 수락 기준으로 삼는다. 포인트·쿠폰 상점이나 D30 두 사례만 작업 대상으로 한 것이 아니다. **전체 완료 판정은 보류 상태다.**

## 작업 위치와 현재 기준

| 항목 | 실제 상태 |
|---|---|
| 작업 worktree | `/Users/ds/code/javaExperience/.worktrees/course-learning-integration` |
| 브랜치 | `feat/course-learning-integration` |
| 구현 커밋 | `8b144f50856e79dfe30f8a0e1216e7acedf50698` |
| 이 진행표 작성 전 기록 커밋 | `72589fe375510990cef3a38ce009735a41bbf106` |
| 통합한 main | `f6d82d705e279a0e74a5e6287a35cc51953e49ba` |
| 미리보기 | `http://localhost:3000/scenario/README.html` |
| 공개 상태 | 로컬 브랜치. 원격 push·PR 생성·main 브랜치 반영 없음 |
| 백업 | `/Users/ds/backups/javaExperience/course-learning-integration-final-20261025/manifest.json`에 복원 순서·대상 커밋·검증 결과 기록 |

## 사용자 요구사항별 진행

‘작성/구현’은 파일에 내용이나 코드가 있다는 뜻이고, ‘검증’은 실제 실행한 범위만 적었다. 자동 검사 통과만으로 모든 기획 내용의 질이나 실제 화면 완성도를 보증하지 않는다.

| 요구사항 | 작성·구현 상태 | 확인한 근거와 남은 일 |
|---|---|---|
| 과정 v2를 서비스 만들기로 통합, 과정 지도 유지 | 구현 | 공통 메뉴 5개·일자 소속 판정·홈 진입과 기존 일자 목록 연결 검사 통과 |
| 큰 학습 경로·게시글 여정·오른쪽 요청 흐름 제거 | 구현 | 목록 DOM에서 제거. 관련 과제 원문과 기존 앵커 159개는 보존 |
| 시안 검색·난이도·기능 펼치기·API Explorer 유지 | 구현 | 단일 기능 목록과 필터·그룹·정규 경로 162개 연결. DOM 검사 통과, native 화면 검증 남음 |
| 모든 작업을 사용 결과가 있는 기능 단위로 묶기 | 작성·연결 | 원본 ID 327개를 기능 94개·프로젝트별 단계 138개에 연결. 중복 사용 포함 대응 330행, 누락/프로젝트 혼합 감사 통과 |
| 모든 단계의 쉬운 할 일·세부기획서 | 작성 | 목적·시작 조건·입력·정책·데이터 이유·성공/실패·전후 사례·개발 과제·완료 기준 제공. 구조 검사와 원본 연결은 확인했으며, 사용자 관점의 최종 품질 리뷰는 남음 |
| 정답 조립 순서를 강제하지 않고 직접 설계하게 하기 | 구현 | 기획 요구를 먼저 표시하고 기존 긴 구현 예시는 참고 경로에 보존. 실제 읽기 흐름의 친절함은 native 리뷰 필요 |
| 기능별 질문형 힌트를 순서대로 열기 | 구현 | 138단계에서 첫 질문·다음 306회·이전 이동을 생성 DOM으로 확인. 답 입력/퀴즈 gate 없음 |
| 각 단계 실제 API 호출 또는 관련 실행 확인 | 구현 | 요청 폼 118개와 비HTTP 실행 확인 제공. 공유 도구 단위 검사 통과. **새 도구의 native 호출과 모든 학습자 API 실행은 미검증** |
| 실제 id 이어 쓰기·준비 데이터·정상/실패·재조회·DB 확인 | 작성·구현 | 프로젝트별 계약·편집/수동 변수·자원 id 연결과 실패 처리를 검사. 전체 실제 서버 조합의 정상/실패 재현을 완료한 것은 아님 |
| D30의 이전/새 계약·count·접수/지급 구분·자동 호환 | 작성·연결 | 3단계로 작성. D25의 학습자 정의 URI를 임의로 만들지 않고 계약 등록으로 연결. **실제 미완성 학습자 예약 서버의 자동 호환 검사는 미실행** |
| 기존 원문·코드·자료·URL·진도 보존 | 정적/DOM 확인 | 서버·학습자 소스와 개념 Markdown은 main과 동일. 45일 JSON은 presentation 제외 지정 stepper와 동일. 원문 236개 main HTML 보존 검사 및 새 95쪽 링크 5,212개 검사 통과 |
| 새 기능 진도와 기존 일자 진도 분리 | 구현 | 기능/프로젝트/단계별 수동 기록. 기존 값 보존·프로젝트 간 분리·힌트/API가 진도를 바꾸지 않는 DOM 검사 통과 |
| PC 다크 기준과 360px 조작성 | 코드 구현 | 다크 스타일·반응형 분기 존재. **새 화면의 실제 폭·넘침·메뉴 좌표·스크롤·키보드 확인 미완료** |
| 실제 imagegen 시안과 구현 화면 대조 | 시안·구현 있음 | 시안 6장/선정 4장. JPG는 원본 캔버스 유지, PNG 외부 보관. **최종 실제 캡처와 시안 대조 미완료**, 새 verified 승격 없음 |
| file://와 HTTP 실행 조건 구분 | 정적 확인 | 상대 파일/앵커와 classic bundle 연결 확인, HTTP 미리보기 200·디스크 일치 확인. **native file:// 직접 실행은 미검증** |
| 지정 빌드·감사와 기존 회귀 | 통과 | build, audit:visual/version-cards/parity, test:navigation/learning-entry/course-pages, check:course-data, 서비스/CRUD/홈/개념 회귀 및 개념 26 harness 통과. check:generated도 HTML 차이 0 |
| 원본 백업·독립 복원 | 확인 | bundle 순서로 새 bare에 복원해 HEAD/tree/13파일/fsck 대조. 원본 PNG 별도 보관, 제외 캡처 이력 재유입 없음 |

원본 ID 327개는 D00 1개 + D01~D45 작업 135개 + 기존 시나리오 101개 + 기능 화면 7개 + Java·티켓·DB 등 지원 자료 83개다. 지원 자료는 관련 기능의 준비/참고로 연결하며, 자료 수를 곧바로 새 주 진도 수로 세지 않는다.

## 요구사항의 일곱 공통 조건은 어떻게 관리하는가

1. 기능 단위 구성 → 기능/variant/stage와 원본 대응을 편집 가능한 JSON으로 관리한다.
2. 쉬운 할 일·결과 우선 → 각 stage의 purpose/task/scenario가 첫 내용이다.
3. 세부기획 → brief의 시작 조건·정책·입력·성공/실패·사례·완료 조건을 작성한다.
4. 학습자 설계 여지 → 확정 업무 규칙과 선택할 내부 구현을 구분한다.
5. 순차 질문 힌트 → stage별 hints를 이전/다음으로 열며 별도 진도로 세지 않는다.
6. 실제 확인 → recipeIds 또는 executionChecks를 연결하고 예상과 실측을 분리한다.
7. 보존과 확인 기록 → source-map/coverage-review/검사 로그에 원본·현재 상태·미실행을 남긴다.

위 조건 전부를 만족시키는 것이 목표다. 필드 존재 검사나 authored 표시를 전체 수락 조건 통과로 해석하지 않는다. 최종 리뷰에서 모호한 요구·반복된 질문·부족한 사례가 발견되면 해당 기능을 다시 수정한다.

## 다음 작업과 완료 기준

- [ ] 컴퓨터/브라우저 연결 복구 후 새 목록·대표 상세·힌트·프로젝트 선택·수동 진도를 실제로 조작한다. 현재 CUA 조회는 apps 0 / browsers 0 / native pipe startup failed다.
- [ ] PC에서 메뉴 좌표·읽기 폭·스크롤·키보드 동작을 확인하고 360px에서 넘침·잘린 조작 요소를 확인한다.
- [ ] 새 요청 도구를 격리 서버에서 정상·실패·생성 id 재사용·입력 변경·연결 실패로 직접 확인한다. 기존 community 도구의 native 13회 증거와 구분한다.
- [ ] native file:// 탐색과 HTTP 문서의 API 호출 조건을 각각 기록한다.
- [ ] 선정 시안과 같은 뷰포트의 실제 캡처를 비교하고, 차이를 수정·재확인한다. 실제 근거 없이 verified로 승격하지 않는다.
- [ ] 전체 기능 기획서를 사용자 관점으로 최종 재검토하고 위 요구사항 대응표의 미확인 항목을 갱신한다. 학습자 구현 전까지 실행할 수 없는 검사는 별도 미실행으로 유지한다.

## 상세 파일 안내

- 전체 설명: `/Users/ds/code/javaExperience/.worktrees/course-learning-integration/docs/design/full-integration-2026-10-25/REPORT.md`
- 원래 요구사항의 실행 계획: `/Users/ds/code/javaExperience/.worktrees/course-learning-integration/docs/superpowers/plans/2026-10-25-service-feature-consolidation.md`
- 원본별 작성·검증 범위: `/Users/ds/code/javaExperience/.worktrees/course-learning-integration/service/coverage-review.json`
- 기능↔원본 대응: `/Users/ds/code/javaExperience/.worktrees/course-learning-integration/service/source-map.json`
- 검사 결과: `/Users/ds/code/javaExperience/.worktrees/course-learning-integration/docs/design/full-integration-2026-10-25/FINAL-VERIFICATION.json`
- 기존 개념 26개 검사: `/Users/ds/code/javaExperience/.worktrees/course-learning-integration/docs/design/full-integration-2026-10-25/HARNESS26.json`
