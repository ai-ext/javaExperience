javaExperience v8 — 개념 학습 탐색·검색·대표 상세 개발 인계

1. 먼저 열 파일
javaExperience-v8-knowledge-handoff.html
  최종 시안 9장이 각각 크게 포함되어 있습니다. 각 화면 바로 아래에 목적, 실제 데이터,
  모든 보이는 제어와 동적 분야 행의 목적지, 저장/복원, 모바일, 인수 조건을 연결했습니다.
  P16 학습 데이터는 문서 안에서 네 상태와 390px 배치로 전환해 볼 수 있습니다.
  이 전환 도구는 인계서용이며 실제 API/IDE/DB를 실행하지 않습니다.

javaExperience-v8-concept-queue.html
  134개 원문 문서별 고유 질문, 원문 예시, 변화 단계, 시각화와 조작 제안,
  앵커, 관련 과제 근거, 미확인 범위, 진행 상태를 검색·필터로 확인합니다.
  각 개념의 전문/정답/출처 검토 및 신규 상세 시안 완료를 뜻하지 않습니다.

2. 개발 데이터
javaExperience-v8-screen-spec.json: K01~K06의 최종 9개 화면과 변형 상태, 공통 제어,
  4분야 12개 대표행 링크, history/session/manual read 계약, 우선순위.
javaExperience-v8-source-manifest.json: 첨부의 134개 문서, 3,113개 기존 앵커,
  원문 제목·참고 링크·본문 해시.
javaExperience-v8-search-index.json + knowledge-search.mjs: 실제 원문 제목/소제목 검색,
  명시 질문 연결, 분야 선택, 정렬, 선택 이유. DOM·네트워크·진도 의존성 없는 순수 모듈.
javaExperience-v8-ui-copy.json: 최종 시안과 같은 질문/설명/선택 이유 표시 문구.
javaExperience-v8-P16-lesson.json: 원문 코드·keyboard/2·예상 200 응답·오류 비교·장면 상태.
javaExperience-v8-P16-*.svg 4종: 정확한 학습 본문용 값 비교 자산.
  UI 생성 이미지에서 코드나 값을 잘라 쓰지 않고 JSON/DOM/SVG로 렌더합니다.
javaExperience-v8-concept-queue.json / .tsv: 전체 134개 대기표의 구조화 데이터.
javaExperience-v8-validation.json: 무결성 검사 및 검색 모듈 15개 검증 묶음의 실제 결과.

3. 핵심 구현 순서
원문 보존/색인 → K01~K04 → 기존 router와 복원 coordinator 연결 →
P16 정상 3장면/오류 비교 → K06 모바일/키보드 → 개념별 고유 상세 순차.
홈 구현과 최신 로컬 상태 키는 이번 작업에서 읽거나 변경하지 않았습니다.
다음 화면 설계는 서비스 만들기 목록 → 기능 상세 → 실전 미션 목록 → 미션 상세입니다.

4. 보존과 확인 범위
내용 정본: 첨부 javaExperience-all-in-one(1).html.
SHA-256: dbc574bc7fdc53e258b38fb100c7a72997feac66d6eea8cad347cebf4b453363
확인일: 2026-10-19 Asia/Seoul.
첨부 본문·정답·참고문헌·기존 route/anchor를 수정하지 않았습니다.
이 묶음은 신규 설계/색인/자산이며 기존 첨부 213MB 원본을 중복 포함하지 않습니다.
기존 #/route#anchor 계약은 그대로 연결합니다. 명세의 '· view=...' 등은 상태 설명이며
URL에 query를 붙이라는 지시가 아닙니다. 검색 상태의 URL 공유는 이번 범위가 아닙니다.
원격 GitHub 조회와 git ls-remote는 연결 실패로 원격 커밋을 확인하지 못했습니다.
사용자가 설명한 최신 로컬 홈 변경은 검증하지 않았습니다.

5. 완료 표시의 의미
시안은 실제 생성 이미지이며 구현 앱 캡처가 아닙니다.
P16의 200/400과 응답 값은 원문 예상 예시이며 실측 서버 결과가 아닙니다.
0-1은 작은 Java API, 1-1은 200 success와 DB 미저장, 1-2부터 201 및 DB 행 확인입니다.
new/flush/commit/rollback과 별도 DB 연결에서 관찰하는 시점을 구분합니다.
읽음은 학습자의 명시적인 취소 가능한 기록이며, 과제 통과나 IDE 자동 감지가 아닙니다.
