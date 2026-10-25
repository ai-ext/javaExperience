# 과정 통합 구현·검증 기록

2026-10-25 확인. 작업 위치는 `/Users/ds/code/javaExperience/.worktrees/course-learning-integration`, 브랜치는 `feat/course-learning-integration`이다. 원본 worktree와 main checkout은 수정하지 않았다. 원격 push/PR/main merge는 수행하지 않았다.

## 통합 기준과 실제 변경

초기 기준 `62d75618`은 origin/main `a70f1bd5`를 포함했다. 별도 worktree에 구현을 저장한 뒤, 작업 중 원본 stepper에 추가된 `3b35ff22`까지 로컬 병합했다. 최신 stepper의 콘텐츠 분류, Java→Spring 복귀, 진도 문구, SQL·운영 과제, 다크 대비 개선을 보존했다. 기존 생성 HTML을 한쪽으로 덮어써 완료 처리하지 않고 합친 소스에서 재생성했다.

- D04-5 생성: POST201 + Location, 빈 본문. CORS 때문에 Location을 못 읽으면 사실을 알리고 사용자가 확인한 id만 연결한다.
- D05-1 상세 GET200, D05-2 PUT/PATCH200·DELETE204, D05-6 like PUT/DELETE204, D06-4 items/nextCursor 목록 GET200. 총 8개 동작을 5개 순서에 연결했다.
- 요청은 명시적 클릭에서만 실행한다. 실제 상태·헤더·본문과 전송한 요청을 구분한다. SQL은 수동 확인 예시다. 과정 체크·채점에 손대지 않는다.
- 문서 간 이어가기는 별도 sessionStorage에 base/id/출처만 저장한다. 토큰·요청·응답은 저장하지 않는다. 같은 글의 DELETE204만 연결 id를 해제한다. 저장소·클립보드 차단과 늦은 응답도 처리한다.
- D04-4에서 객체 생성→관계 연결→INSERT 후→commit 또는 rollback의 5상태를 조작한다. Java 참조·필드, 현재 트랜잭션 DB 쓰기, 별도 새 SELECT를 같은 예시 값으로 비교한다. 정교한 imagegen 그림은 별도 그림 탭에서 확대해 볼 수 있다.
- 그림은 고정 설명 예시이고 API 실측 화면과 연결되지 않는다. rollback의 Java는 마지막 INSERT 스냅샷이며 현재 heap을 계측했다고 표시하지 않는다. 기존 태그 재사용 예시이고 새 태그 생성·포인트·캐시의 전체 흐름은 기본 그림의 범위 밖이다.
- 전 페이지의 공통 다크 토큰과 최신 stepper의 대비 규칙을 유지한다. 신규 검증 기준은 PC1366×768·1440×900·1920×1080이다.

## 실제 서버와 DB 증거

두 차례 모두 변경하지 않은 main board-server JAR과 자기 소유의 일회용 MySQL8.4·Redis7.4만 사용했다. 기존 사용자 DB와 서버는 변경하거나 종료하지 않았다.

1. 첫 실험: 브라우저 요청18건으로 8동작, like/unlike 재요청, 커서 다음 묶음, 삭제 뒤404, 미인증401, 입력오류400을 확인했다. SQL 관찰13건에는 utf8mb4 관찰 클라이언트 재확인1건이 포함된다. 첫 두 like 요청 사이에 각각 SQL을 읽었다고 주장하지 않는다. 이후 한 번을 더 요청해 relation1→1과 id/시각 불변을 확인했다. DELETE는 물리 제거가 아니라 DELETED 상태다.
2. 새 시각화 연결 후 두 번째 실험: 같은 bundle로 실제 브라우저 POST201/500 두 건, SQL 실행5건을 기록했다. 일회용 DB의 지연 trigger로 commit 전 시점을 만들었다. 별도 RR autocommit SELECT는 글42·관계42/7을 못 보고, READ UNCOMMITTED 외부 probe는 미확정 행을 봤다. 이 probe를 앱의 JDBC 연결이나 Java heap이라고 표현하지 않는다. commit 뒤 글·관계·포인트가 확정됐다. fixture를 리셋한 별도 실패 실험에서 원장 INSERT를 실패시켜 글·관계·포인트가 rollback되고 기존 태그7이 남는 것을 확인했다. 성공 뒤 같은 트랜잭션을 rollback한 실험이 아니다.
3. CLI 회원가입/로그인은 각 실험의 준비2건씩이며 브라우저 요청 수에 포함하지 않는다. 두 실험의 JVM·컨테이너를 종료하고 private credential 파일을 제거했다. `post-runtime-cleanup.json`과 `api-round1-cleanup-observed.json`을 참조한다.

첫 실험의 transport/client와 계약 파일은 최종본과 바이트가 같다. 두 번째 실험의 bundle SHA도 최종본과 같다. 최신 stepper 병합은 API 실행 코드를 바꾸지 않았다. `SOURCE-MANIFEST.json`에 해시와 범위를 기록했다.

## 검증 결과와 한계

- build: HTML459개, 기존 시나리오101개, 링크 오류0. 별도 검증 대시보드도 재생성한다.
- test:course-api: 단위23건 + 46일 페이지·5개 도구·대표5페이지 생성물 검사 통과.
- test:course-pages: 18+44+10건 통과. D00의 고정10ms 대기 검사는 실제 hashchange를 기다리도록 고쳤고 과정 로직은 바꾸지 않았다.
- test:course: 69건, check:course-data, validate:course 통과. 45일 과정·30엔드포인트·158말하기 카드 검증이다.
- test:home, test:knowledge-catalog(상태14건 및 데이터/생성물 검사), test:navigation 통과.
- audit:visual, audit:version-cards, audit:parity, audit:images 통과. 기존 parity27행은 원본시안6개가 실제 없었고 최신 stepper에서도 제거됐다. 삭제 전 행은 `legacy-missing-parity.jsonl`과 체크포인트 이력에 보존했다. 누락된 시각 검증을 통과로 바꾸지 않았다. 신규2행은 PC 범위의 implemented이며 mobileCapture를 만들어 verified로 올리지 않았다.
- 신규 imagegen JPG6개는 원본PNG와 1536×1024 픽셀이 같고 SHA·JPEG 디코딩을 확인했다. quality95/subsampling0이며 JPEG이므로 무손실 변환이라고 표현하지 않는다. 선택본은 API v2와 Post v4, 나머지는 draft다.
- 실제 Chrome의 최신 셸에서 값 비교/수정 도구/커서 목록×PC3크기, 총9개 배치 관찰의 가로 넘침·화면 밖 조작요소0. 홈·서비스·미션·개념목록·P16의 다크/가로폭 확인. 상태 탭·그림 보기·원본 이미지 로드 확인.
- 신규2패널의 보이는 HTML 텍스트·활성 조작 경계 대비 측정: Post 본문최저6.31:1/경계5.11:1, API본문4.72:1/경계5.67:1. 이미지 픽셀·SVG·hover·disabled controls의 전체 대비 검사 결과가 아니다.
- 기존 contrast 도구의 브라우저/CLI 자가검사4건은 Playwright 모듈이 없어 실행 실패했다. 환경 문제를 제품 통과로 바꾸지 않았고 임의로 패키지를 설치하지 않았다. 색상변수/단일테마 정적 검사1건은 통과했다. 실제 브라우저는 CUA로 확인했다.
- 초기918파일 SHA 보존과 별개로 최종918개 보호 파일을 최신 stepper3b35와 대조해 차이0을 확인했다. 일자 원본의 후속 내용 변화는 upstream 커밋이며 통합에서 재작성한 것이 아니다. 서버·학습자 구현 소스는 main과 같다.

최종 생성물 재생성 일치와 백업 복원 검사는 로컬 커밋 뒤 수행하고 별도 실행 결과에 기록한다.

## 확인할 화면과 남은 범위

- http://localhost:3000/index.html
- http://localhost:3000/course/spring/D04.html#step-d04-4 — 객체/DB 값 비교와 그림
- http://localhost:3000/course/spring/D04.html#step-d04-5 — 생성 요청 도구
- http://localhost:3000/course/spring/D05.html#step-d05-2 — 수정·삭제 도구
- http://localhost:3000/course/spring/D06.html#step-d06-4 — 커서 목록 도구

Python은 이 worktree만 127.0.0.1:3000에서 제공한다. API 확인은 학습자가 실행한 서버 주소와 토큰을 입력해야 한다. 격리 검증 backend는 정리됐으며 응답 예시를 실제처럼 남겨 두지 않는다.

전체134개 개념의 그림/조작 재제작, 이전 concept-learning-night 전체 이식, 전 사이트 픽셀·상호작용 대비 검증은 후속 범위다. 신규 모바일·light 화면은 만들지 않았다. 이번 결과는 main 기반 과정 안에 선택한 기능을 실제로 통합한 로컬 구현이다.
