# D01 개발 생명주기 부분 보강

2026-10-20, LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night 에서 개념 학습만 보강했다. 10질문·25상태·선정 PNG10장이다. 134문서 전체나 전수 픽셀·학습자 이해도를 완료 처리하지 않는다. merge·push·PR은 하지 않았다.

## 원문과 추가 실행

원문277줄·9fence(Mermaid3/Kotlin1/bash5)를 전문 검토하고 원문 SHA와 사본을 보존했다. 원문의 Java25/Boot 앱·원격 Git·PR·CI·registry·Docker·배포 명령은 실행하지 않았다. 추가 plain Java21.0.6/Gradle9.8.0 CLI를 새 임시 Git 저장소에서만 실행했다. 새 상위 run은0700, Git 초기화 뒤 repo는 실측0755다. 사용자 저장소·기존 서비스는 변경하지 않았다.

동일 post42/actor7의 두 호출에서 실패 구현은2, 수정 구현은1을 관찰했다. assemble은 exit0/JAR 생성이지만 check는 exit1일 수 있다. 수정 build는 exit0/관찰1/추가 CLI contract PASS1이다. JUnit·HTTP·DB·동시성 검사가 아니다. 추가 HashSet은 순차 메모리 예제이며 실제 중복 제약·인증을 구현한 결과로 일반화하지 않는다.

추가 저장소의 baseline B0는 유지되고 기능 브랜치는 F1/F2 두 커밋 뒤 F2를 가리킨다. remotes0/private Git clean을 확인했다. 고정 시험 날짜로 생성한 Git SHA와 실제2859바이트 JAR의 manifest/전체 SHA-256을 보존했다. 검증한 한 JAR의 dev/stg/prod 로컬 파일 사본과 clean 재빌드가 바이트 단위로 같았다. 이들은 실제 배포 환경이 아니다. 설정 env·DB 별칭은 CLI 문자열뿐이며 DB 연결은 없다. 같은 JAR의 추가 CLI flag false→0/true→1은 공개 릴리스 시험이 아니다.

새 프로젝트 .gradle만 이동했고 archive는 남았다. 글로벌 캐시는 삭제·이동하지 않았고 Gradle이 재사용·갱신할 수 있다. 재현성은 timestamp와 순서를 고정한 이 fixture의 결과다. 속도나 모든 빌드의 재현성을 측정하지 않았다. 상세 실행 조건·전체 SHA·실제35명령 범위는 source-proof/README.md와 execution.json에 있다.

main fresh replay와 별도 temp 사본의 독립 재현에서 실제11CHECK/별도3모델 전체 JSON이 frozen과 일치했다. 모델은 Boolean check AND review 네 행, 컬럼 이름 집합 비교, 원문 장애 대응 선택지다. 실제 승인·DB migration·rollback·운영 장애·알림·복구시간·SLA가 아니다. 실패한 raw Gradle 로그도 그대로 보존했다.

## 이미지와 화면

built-in image_gen19회 중10장을 선정하고9장은 draft로 남겼다. 존재하지 않는 main/F3/author·CLI 인수·가짜 해시·flag property·잘못된 manifest 키·Gradle Build Cache 혼동을 실제 edit로 교정했다. 메인은19장 전부, 독립 담당자는 선정10장과 마지막 교정2장을 실제 열람했다. 이미지 prompt/경로/SHA/실제 크기와 선택 여부는 image-*.json에 있다.

Chrome1672×941/360×800에서25상태씩 총50관찰·20캡처를 저장했다. title/code/values/PASS/runJSON·PNG 로드와 자연 크기·로그 기본 접힘·핵심 내용 접기 밖·본문 가로 넘침을 검사했다. 특수10건은 clipboard 완료 후269자 정확 일치, 모바일 ArrowRight 실제pan25px, log/zoom/resize, keyboard focus/activate, 원문 링크, reload, catalog와 실제 Back/Forward다. 이 복사 표본의 빈 줄은0개이며 빈 줄 보존은 별도 unit 계약으로 검증했다.

기존 화면2건에서 원문 Mermaid 제외12686자·code6·id16·map1을 정확히 대조하고 live Mermaid3개가 SVG3개로 오류 없이 렌더링된 것을 확인했다. 생성 HTML에서는 Mermaid 원문까지 포함한13875자와 원시 도표3개를 보존했다. 메인은 대표 캡처5개, 독립 담당자는 최종20장 전부를 실제 열람하고50행을 현재 데이터와 대조했다. 독립 unit/generated도 exit0이다. 미해결 Critical/Important/Minor0이다.

원시 warn/error173개는 모두 chrome-extension URL이며 사이트 URL 필터 결과0이다. 확장 설정을 바꾸지 않았고 전체 브라우저 이력의 콘솔0을 주장하지 않는다. 독립 담당자의 콘솔 검토는 범위 밖이다. 모바일 그림에는 내부pan이 필요하며 외부 번역 overlay가 남아 있다. 전체 픽셀·학습자 검증은 하지 않았다.

## 검사와 보존

최종 build exit0/HTML339·링크0, 관련18suite와 필수3audit 모두 exit0이다. 원문135·학습자 서버17·원본 워크트리3403파일의 SHA와 원래 HEAD/NUL 형식 status SHA를 대조했고 루트 main은 clean이었다. 최초 상태 비교의 인수 형식이 달라 생긴 SHA 차이는 원래 `--porcelain=v1 -z`로 다시 대조해 일치를 확인했다. 원본 파일 차이는 없었다.

parity 기존609개 바이트 prefix를 보존해10개를 추가했다(619/verified0). inventory44731개 중516implemented/기존verified6이며 이번25상태만 미검토→시안준비→구현으로 올렸다. 상태 이름이 audit 출력의 verified와 같다고 전체 학습 화면을 검증 완료로 해석하지 않는다.

공식 조사는 Codex CLI gpt-6-luna/OpenAI 직접 경로이며 LiteLLM을 사용하지 않았다. 메인이 공식·저자11페이지를 별도 대조했다. Gradle current 문서는9.8.2였고9.8.0 버전 고정 웹 문서는 접근 실패했다. 실제 wrapper9.8.0 실행과 문헌 버전을 구분한다. 12-factor release(build+config)와 기능 공개의 의미도 구분한다. 실제 운영 배포·원문 앱·전체 언어 설정·CI 정책·DB 호환성·장애 회복·성능·학습자 검증은 남아 있다.

원시 Gradle 로그4파일의2행과 생성HTML의동일본문2행, 총5파일6개끝공백만 SHA/줄번호를대조한예외다. raw bytes를보존했으며그밖staged diff-check는exit0이다. checks/whitespace-exceptions.json과diff-check.json에근거가있다.
