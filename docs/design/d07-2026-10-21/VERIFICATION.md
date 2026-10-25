# D07 서버 배치·책임 개념 부분 보강 · 2026-10-21

온프레미스·클라우드 원문에 **13개 질문·36개 상태(native8, 미실행28)**를 보강했다. 134개 개념 전체나 D07의 모든 독립 장면 완료가 아니다.

## 원문과 실행

원문300줄·8fence(Mermaid4/Java1/bash2/Dockerfile1)를 보존했다. Java 본문을 byte 그대로 추가 Java21.0.6·Gradle9.8.0·Spring Boot4.1.1·Framework7.0.9·Tomcat11.0.24 환경에서 컴파일·실행했다. 원문 Java25 JRE Dockerfile과 container 명령은 미실행이다. fixture4개는 원문 Java/Dockerfile 사본2개와 추가 Gradle 설정2개다.

실행10CHECK·미실행6모델은 [execution.json](source-proof/execution.json)에 구분했다. 메인 freeze 뒤 fresh 실행과 무수정 private 사본의 독립 재현 전체가 고정 기준과 일치했다. 초기 요약 PASS 문장은 추가 CHECK나 모델 PASS가 아니며 이후 FULL_EXECUTION_MATCH로 교정했고 고정 JSON은 바꾸지 않았다.

해석 dependency39개 SHA와 JAR nested library34개를 구분했다. 원문 class2개의 major65와 실행 JAR 19,902,934bytes/SHA bfc2d0740b6425f8a1c9057f2b1b53cb9fd8badae043f5c9b98dd785c162c471을 대조했다. 같은 bytes의 local-a/app.jar, local-b/app.jar를 한 Mac의 다른 loopback 임시 포트에서 실행했다. local-a/b는 관찰기 별칭이며 profile·실제 JVM 시스템 이름이 아니다. server.port=0은 할당 설정이며 실제 포트0에 요청한 것이 아니다.

실제 HTTP4건은 A/health200 plain ok, B/health200 plain ok, A/actuator/health404, A 종료 뒤 직접 B/health200 ok다. 실제404는 JSON이며 raster에는 status404만 표시한다. literal ok는 HTTP 응답 확인·프로브에 쓸 수 있으나 DB·노드·리전 검사나 Actuator UP/readiness는 아니다. A/B를 각각 own SIGTERM143으로 종료했고2PID·2포트가 닫혔으며 kill fallback은 없다.2개는 추적한 장기 HTTP JVM 수이고 별도 build/version 명령은 각exit0이다. graceful 시작·완료 로그는 읽었으나 D07에서는 진행 중 요청 drain을 실험하지 않았다. 자동 LB failover·VM·AZ·HA 증거가 아니다.

## 공식 근거와 분류

직접 Codex CLI0.163.0, gpt-6-luna/OpenAI의 ACCESS_OK와 research exit0/web13/turncompleted/errors0를 확인했다. LiteLLM·다른 모델·provider 전환·nested LLM은 없다. 연구자가 기본 config만 보고 접근 미확인으로 추정한 raw REPORT 문장은 실제 명시 호출 성공과 모순돼 메인 정정 기록을 덧붙였다. 용량·quota 실패가 보고된 실행이 아니다. raw REPORT는 그대로 보존했고 현재 Actuator4.1.1과 공식24문헌을 메인이 대조했다.

NIST5특성/3서비스/4배치 모델과 물리 위치를 나누고 private/community의 off-premises·제3자 운영 가능성을 표시했다. hybrid는 구별되는 cloud infrastructure의 기술적 결합이며 반드시 서로 다른 배치 모델이어야 한다고 하지 않는다. SaaS 제공자 제품 코드와 고객 데이터·설정·권한·선택한 확장 책임을 구분한다. 일반 Linux host의 container kernel 공유, Mac의 Linux VM, 제품별 Fargate compute/kernel 경계 예외를 나누었다.

EXPOSE metadata와 실제 listener·publish를 구분하고 COPY glob 다중 source 조건을 설명한다. raster의 COPY는 operation summary이며 정확한 원문 명령은 DOM 코드에 보존한다. DNS는 주소 조회 뒤 직접 HTTPS로 LB에 접근하는 흐름이고 복수 AZ가 DB 복제·세션·복구를 자동 보장하지 않는다. 서비스 비교는 기능 예시이며 SKU/API/runtime 호환 인증이 아니다.

S3 flat key는 GENERAL PURPOSE bucket 예시로 한정하고 directory bucket의 hierarchical namespace는 별개로 구분했다. prefix는 API listing·설정 정책에도 쓰며 OS directory는 아니다. ADLS HNS는 directory·atomic operation·ACL 범위이며 전체 POSIX 보장을 주장하지 않는다. 비용은 usage component의 기호식·항목 비교이며 실제 요금·할인·TCO 측정이 없다. 약정·구매 옵션과 autoscale, Relocate와 OS/runtime 플랫폼 변경을 구분했다.

## 이미지와 화면

`gpt-image-prompt`/`imagegen` 스킬과 학습 계약·검수 기준으로 actual imagegen35회를 제작했다. 메인이35개를 실제 열람하고 **JPG92 13개 선정·draft22개**를 기록했다. 최종13개 독립 검토의 미해결 지적은0이다. [전체 프롬프트](image-all-generations.json), [크기·형식·SHA](image-records.json), [최종 이미지 검토](image-final-review.json)에 남겼다.

선정 JPG는10,343,543bytes, 대응 생성 PNG는29,279,063bytes이며13개 모두1672×941 원본 해상도다. 생성 PNG는 외부 생성 폴더에 있고 작업 이미지·캡처는 JPG다. 출처·JVM 별칭·실제404·가짜 PID 제거·NIST/책임·kernel·EXPOSE/COPY·트래픽 대안·S3 범위·비용/7R·깨진 문장 등을 실제 재생성해 교정했다.

Chrome1672×941/360×800에서36상태씩 총72행의 코드·강조·값·전체 JSON·이미지·focus·접기·문서폭을 대조했다. parsed run78개와 양쪽26JPG 대표 캡처를 보존했다. 독립 실제 캡처 검토에서 desktop lifecycle의 긴 dt가 값에 겹치는 Minor1을 발견해 D07 dt 줄바꿈만 고쳤다. 이전2캡처를 checks/initial-captures에 보존하고 해당 desktop/mobile2장만 재캡처했다. 수정 후2캡처 상태와 전체72상태를 다시 대조한74행/parsed run80개가 모두 통과했다. desktop 긴 dt의 clientWidth=scrollWidth179와 dd 경계 분리도 확인했다.

메인은 대표5캡처를 실제 열람했다. 캡처 독립 전수검토(최종26장 실제 열람, 초기 life2 포함 총28뷰)의 미해결 Critical/Important/Minor는0이다. 초기72행/run78과 수정후74행/run80, 모든 viewport 쌍과 최종 SHA·사실 대조는 [capture-review.json](capture-review.json)을 기준으로 한다. 원본72행과 수정 후74행은 서로 다른 기록이며 중복을 고유 상태 수로 세지 않는다. 대표26장 밖23상태의 별도 시각 캡처는 없다. 최종 lifecycle2캡처는 원문이 열려 있고 다른24장은 접힌 상태다. full-page sticky 메뉴 paint와 모바일 확대의 잘린 영역은 캡처·UI 특성이다. 전수 pixel 일치·학습자 이해를 인증하지 않는다.

코드 복사286자·빈줄1, native 가로 이동30px, 끝단 focus, 확대·접기·resize, End/Enter, back/forward/reload 등10개 조작이 통과했다. 기존 앵커2개와 원문13,022자·code4·id24·map1·Mermaid SVG4가 보존됐다. 최신 console500창의 own URL/message 일치0이다. ChatGPT 탭·기본 viewport를 복원했고 D07 preview 탭은 유지했다.

## 검사와 보존

최종 build는 HTML339·링크 오류0이다. D07 unit/generated와 기존29suite로 총30suite가 통과했고 dt 수정 뒤 D07도 재통과했다. 필수 visual/version-cards/parity 감사3개는 모두exit0이다. 검사·시도 범위는 [checks](checks/)를 따른다.

원문135·학습자 서버17·dependency39·fixture4·원문8block SHA가 일치한다. 원본3403개 중3398개가 같고 외부5변경과 root AGENTS 메모를 보존했다. 사용자 변경은 stage에서 제외한다. parity는674행 prefix 바이트를 보존해13행 추가687, verified0이다. inventory는 기존45,001개 내용·상태가 같고 D07 state36+toggle29의65개만 추가45,066이다. 새 D07 state36만 implemented, 전체 implemented695·기존 verified6이다.

로컬 체크포인트만 만들며 merge/push/PR은 하지 않는다. 실제 Java25·Docker·VM·cloud·운영 배포·가격·장애복구·전체 원문 장면·전체134개념은 미완료다.
