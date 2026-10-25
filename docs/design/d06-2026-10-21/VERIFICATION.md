# D06 배포 개념 부분 보강 · 2026-10-21

D06 원문을 읽고 산출물, 설정, 기능 공개, health/readiness, 경로 전환, 종료, 별도 DB 변경을 **12개 질문·30개 상태**로 보강했다. D06의 모든 독립 장면이나 전체 134개 개념의 완료 기록은 아니다.

## 원문과 실행 근거

원문은 264줄·8개 fence이며 앱 Java 코드를 제공하지 않는다. 원문의 Actuator Groovy 블록과 YAML의 `20s`를 byte 단위로 보존했다. Java25·8080 원문 명령은 실행하지 않았다. 원문 SHA와 8개 블록은 [source.json](source-proof/source.json)에 있다.

추가 fixture 8개는 Java21.0.6, Gradle9.8.0, Spring Boot4.1.1, Framework7.0.9, Tomcat11.0.24를 사용한다. 해석 파일 50개는 runtime49개와 별도 H2 proof1개이며 SHA를 대조했다. 각 Boot JAR의 nested library42개와는 다른 집합이다. H2 2.4.240 driver는 앱 JAR에 포함되지 않는다.

추가 실행 CHECK20개와 미실행 설명 모델3개를 [execution.json](source-proof/execution.json)에 구분했다. 메인 freeze 후 새 실행과 [독립 private 사본 재현](source-proof/independent-replay.json)의 전체 execution이 고정한 기준과 일치했다. 첫 probe와 원자료도 보존했다.

- **산출물:** A1.0.0은21,988,506bytes, B2.0.0은21,988,510bytes다. B는 version/default business property가 다른 별도 산출물이며 A를 재빌드하지 않았다. 같은 A 사본을 local/stg profile 이름으로 실행한 비교는 한 Mac의 실험이다.
- **설정과 기능:** 한 JVM에 CLI/system/environment/profile/base 값이 모두 있을 때 `from-cli`를 선택했다. 전체 PropertySource 순서나 다섯 번의 fallback 실행을 검증한 것은 아니다. `/feature`의404/200 비교는 profile도 다른 두 시작 설정이며 hot toggle이 아니다.
- **health와 readiness:** 같은 B에서 health/readiness는200UP이고 제어한 business는500이었다. 별도 blue A의 REFUSING_TRAFFIC에서는 global health/readiness503, liveness200, 직접 business200이었다. own router의 guard503/bypass200과 재시작 없는 accept 복원을 구분했다.
- **경로와 canary:** own router의 A200→B500→A200, 고정10요청의7blue200/3green500, 전체 batch 뒤 정지 규칙과 다음 blue200을 관찰했다. 직접 B의500은 유지됐다. 실제 LB/Kubernetes 가중치, SLA, 모집단 오류확률은 검증하지 않았다.
- **종료:** own 요청의 gate 진입 후 SIGTERM과 graceful 시작을 확인하고, gate를 해제한 뒤 진행 중 요청200을 받았다. `20s`는 원문 설정값이며 측정 시간이 아니다. 별도 CLI1s·gate 미해제에서는 completed200=false였다. Boot HTTP JVM6개는 의도한 SIGTERM143, 별도 단발 SchemaProof는exit0이다. HTTP6개와 router1개의7포트가 닫혔다.
- **별도 DB:** H2 memory의 한 행에서 실제 `Ada  Lovelace`는 공백2개·길이13이었다. 수동 backfill과 expand 뒤 옛 SELECT를 보존했고, contract 뒤42S22를 확인했다. down DDL과 한 공백 concat 결과는길이12, originalRestored=false였다. `·`는 공백 표시 alias이며 실제 공백도 원자료에 보존했다. Boot 앱이 이 DB에 연결한 실험은 아니다.

## 이미지와 화면

`gpt-image-prompt`/`imagegen` 스킬과 학습 계약·검수 기준을 적용해 actual imagegen27회로 제작했다. 메인이27개를 실제 열람했고 **JPG92 13개 선정·draft14개**를 기록했다. 최종13개 독립 검토의 미해결 지적은0이다. [전체 프롬프트](image-all-generations.json), [형식·크기·SHA 기록](image-records.json), [검토 이력](image-final-review.json)을 보존했다.

파일명, B의 bytes, 응답 필드, profile, build tool 표현, 공백 alias, freeze 정의, 환경 전환 범위를 교정했다. B500와 별도 A readiness200의 문단 혼동은 회귀 검사 실패→수정→통과와 독립 검토로 해소했다. A/B 비교 상태에는 전용 versions 그림을 연결했다.

선정 JPG 합계는8,827,859bytes이고 생성 PNG 합계는25,966,118bytes다. 원본 해상도를 유지했으며 config-v2만1671×941, 나머지12개는1672×941다. 생성 PNG는 외부 생성 폴더에 있고 작업 산출물과 화면 캡처는 JPG다.

실제 Chrome에서 explicit 탭 대상을 사용해 전후 viewport를 기록했다. 1672×941과360×800에서 각30상태, 총60행의 코드·강조·값·전체 JSON·이미지 크기·focus·접기·페이지 폭 검사가 통과했다. asset13개에 대응하는 양쪽26개 JPG 캡처를 동결했고 메인은 대표5개를 실제 열람했다. 독립 검토에서도26개 캡처를 모두 실제 열람하고60행·parsed run68개·전후 viewport60쌍과 캡처 후26개 viewport를 대조했다. 미해결 지적은0이며 [검토 기록](capture-review.json)에 한계를 남겼다.

실제 복사428자/빈줄1, 키보드 가로 이동40px, 모바일 끝점 focus, 확대·접기·resize, End/Enter, back/forward/reload 등10개 조작 검사가 통과했다. 원문 앵커2개와 본문13,326자·code5개·id20개·기존 map1개·Mermaid SVG3개를 보존했다. 최신 콘솔500행 창에서 own URL/message에 일치하는 항목은0이다. ChatGPT 탭과 기본 viewport를 복원했고 개념 preview 탭은 유지했다. [브라우저 기록](browser-comparison.json)에 범위와 한계가 있다.

## 검사와 보존

최종 build는 HTML339개·링크 오류0이다. D06 unit/generated와 기존28개 회귀검사, 총29suite를 통과했고 필수 visual/version-cards/parity 감사도 모두exit0이다. 첫 작업 경로 오류로 이미지 후보 상태 갱신이 빠진 build는 최종 결과에서 제외하고 [시도 이력](build-attempts.json)에 보존했다.

원문135개·학습자 서버17개·fixture8개·의존 파일50개·원문8블록의 SHA가 일치한다. 원본3403파일 중3398개가 같고 외부5변경과 root AGENTS 메모는 보존했다. 사용자 변경은 stage에서 제외한다. [검사 기록](checks/)에 근거를 둔다.

parity는 기존661행을 보존하고13행을 더해674개, verified0개다. inventory는기존44,938항목이 모두 같고 D06 항목63개만 추가돼45,001개다. D06 상태30개는 implemented이며 전체 implemented659개·기존 verified6개다. 구현과 한정 브라우저 확인을 전수 검증으로 올리지 않았다.

## 남은 범위

전수 pixel 일치, 학습자 이해, 모든 원문 장면, 실제 운영 배포·클라우드·Kubernetes·systemd·registry·장애복구 인증은 하지 않았다. 모바일은 확대한 구간을 가로로 읽으며 그림의 모든 글자가 동시에 보이지 않는다. full-page 캡처의 sticky 메뉴는 현재 scroll 위치에 그려질 수 있다.26개 캡처는 asset별 대표 상태이고 나머지 상태별 시각 캡처는 따로 검토하지 않았다. 로컬 체크포인트만 만들며 merge/push/PR은 하지 않는다.
