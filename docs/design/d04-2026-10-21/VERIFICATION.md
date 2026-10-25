# D04 빌드 개념 부분 보강 — 2026-10-21

원문을 보존하고 11개 질문·29개 장면에서 태스크 그래프, 실제 파일, JUnit, JAR, 캐시와 전달 경계를 비교한다. 원문 전체 실습이나 배포를 완료했다는 기록은 아니다.

## 원문과 실행 범위

- 원문325줄·9fence(Mermaid4/Kotlin1/bash4)를 전문 검토·추출했다. SHA는 eeadf83f4e342eba3befc7034aa31234c3617150368baea5b94f66419875b0a8이다. 생성 원문13435자·code5·id21·map1을 보존했고 live 본문12289자(렌더링 Mermaid 제외), 실제 Mermaid SVG4개를 확인했다. 원문Markdown135개와 학습자 서버17개 SHA가 초기 기준과 같다.
- 원문의 Kotlin build 설정 Java25는 그대로 보존했다. java_home에 등록된 JVM5개에서25를 찾지 못했으며, 미등록 JDK까지 전수 검색했다고 주장하지 않는다. 추가 fixture에서만 Java21.0.6·Wrapper9.8.0·Boot plugin4.1.1·JUnit Jupiter/launcher6.0.3을 사용했다. Java25 원문 전체 설정의 실행 결과로 표시하지 않는다.
- 추가 fixture6개와 해석된 testRuntimeClasspath artifact29개의 SHA를 고정했다. 플러그인 전체 classpath29개라는 뜻이 아니다. 새0700 private 프로젝트마다 실행했고 별도 .task-cache를 사용했다. 사용자 전역 캐시를 삭제·이동·바이트 변경하지 않았다. 정상 Gradle 실행의 캐시 재사용·메타데이터 갱신과 구분한다.
- 첫 full freeze는20CHECK 뒤 pluginclasspath io.spring.gradle:dependency-management-plugin:1.1.7의 offline 메타데이터 누락으로 실패했다. 같은 원인이 Gradle 메시지2개로 중복됐다. 실패로그·runtime·부분 verification metadata를 보존했다. 같은 고정 버전/기본 declared plugin portal·Maven Central에서 일반 online write-verification metadata가 성공한 후 전체 offline freeze21CHECK·3models가 통과했다. 메인 fresh와 독립 temp 재현 모두 전체 frozen JSON이 같았다. 디스크나 LLM 사용량 문제로 단정하지 않는다.

## 실제로 관측한 차이

- build는 assemble/check를, check는 test를, assemble은 bootJar/jar를 요구했다. classes는 compileJava/processResources를 공유한다. 선택된 직접 선행 관계를 보여 주며 테스트 후에만 JAR이 생기는 고정 시간 순서로 일반화하지 않는다.
- dry-run은 configuration을 평가했으나 task action은 실행하지 않았고 build 출력도 없었다. compileJava 뒤 class major65만, processResources 뒤 lesson.properties 바이트 복사만 각각 확인했다.
- 실제 test는2개·failure/error/skipped0이었다. 별도 assertion 실패 입력에서는2개 중1개 failure였고 이전 정상 JAR은 그대로 남았다. main compile 오류와 test compile 오류에서는 JUnit 실행 보고서가 없었다. clean test만 요청한 테스트 컴파일 실패에서 JAR은 요청하지 않았다.
- 테스트 Java 파일을 자체 복사본에서 제거했을 때(디렉터리는 남음) compileTestJava/test가 NO-SOURCE였다. onlyIf false 태스크는 SKIPPED였고 action 파일도 없었다. assemble만 실행하면 JAR은 있으나 test는 선택되지 않고 JUnit 보고서도 없었다.
- Boot JAR은 BOOT-INF/classes와 lib20개를 포함했고 plain JAR은 루트 클래스 경로였다. 테스트 class는 두 JAR에 없었다. 추가 non-web Boot 프로세스에서 실제 java -jar 출력 D04_RESOURCE=build-ready/D04_POLICY=READY 및 exit0을 확인했다. HTTP·Docker·레지스트리·배포 실행이 아니다.
- 같은 입력 재실행은 compileJava/processResources/test/bootJar가 UP-TO-DATE였다. clean 뒤 private cache에서는 compileJava/test가 FROM-CACHE였고 resources와 bootJar는 EXECUTED였다. 모든 출력이 캐시에서 왔다고 표시하지 않는다.
- 리소스만 바꾼 clean 없는 build에서 compileJava/class는 그대로였고 processResources/bootJar와 JAR 바이트는 바뀌었다. 별도 fresh 두 clean build(기준 --build-cache, twin --no-build-cache)의 실행 JAR은9103378bytes, SHA19be540e7682740e6d04d338fde021222c0c6e3a83dbaeb0935c3a85d928d16e로 같았다. 이 입력·환경의 관측이며 보편적인 재현성·캐시 속도 측정이 아니다.
- lock에는 선택 spring-boot4.1.1이 기록됐다. private verification XML에만 예상 SHA를0으로 바꿨을 때 실제 dependency verification이 실패했고 공유29artifact의 바이트는 그대로였다. 버전 잠금과 파일 무결성 검사는 구분한다.
- 로컬/CI 입력, Docker/registry 경계, 실패 계층은 명시적인 모델3개다. 실행하지 않은 장면에 실제 PASS를 붙이지 않았다.

## 조사·이미지·화면

- 현재 Codex CLI0.163 도움말/접근 검증 후 gpt-6-luna·OpenAI direct로 조사했다. LiteLLM/profile/다른 모델·제공자로 전환하지 않았다. 완료 web4/nested model CLI0/error0/turn.completed를 확인했다. 연구의 version-prefix URL 실패를 보존했고 메인은 canonical11개 공식 근거를 직접 대조했다. 현재 Gradle 문서9.8.2/JUnit 문서6.1.3과 실제9.8.0/6.0.3을 구분한다. source-access의28attempt/note30 잔재도 검증 한계에 명시했다.
- gpt-image-prompt와 학습 계약·검수 기준을 실제 적용했다. imagegen27개 생성·교정 중 JPG11개 선정,16개 draft를 보존했다. graph 중복/classes self-edge, 잘못된 리소스/XML 경로, 기존 JAR과 태스크 선택, 가짜 캐시 처리, Kotlin DSL/Java 구분, 재현 입력·모델 범위를 실제 imagegen으로 교정했다. 선정본은 원해상도 JPEG quality92이며 raw 생성 PNG는 도구 외부 원본이다. 최종 이미지 독립 리뷰 미해결0이다.
- build는339HTML/링크 오류0, 관련27suite가 통과했다. code/값/CHECK/전체 run JSON·모델noPASS·선정11JPG 실제 크기/SHA와 원문 보존 검사도 통과했다. 필수3audit 결과는 checks/audits.json에 별도 기록한다.
- 명시적 탭 인자와 각 case 전후 실제 viewport assertion으로 desktop1672×941/mobile360×800의29상태씩58관찰·22topic 캡처를 취득했다. 코드·값·lead·fullrun·이미지/alt/focus·핵심 기본 노출·기본 근거 접힘·페이지 넘침·제목 폭을 검사했다. 메인은 대표5개 캡처를 실제 열람했고 독립 전체 캡처 검토는 capture-review.json으로 별도 고정한다.
- native 코드 복사450자/빈줄1 정확 일치, 모바일 키보드 pan40px, 끝단 초점, zoom 뒤 근거 열림 유지, 단계 변경 뒤 근거 접힘, resize/End+Enter/실제back·forward·reload 등 특수10개가 통과했다. 기존 앵커2개와 live 원문 본문12289/code5/id21/map1/Mermaid4SVG를 확인했다.
- site URL/message로 필터한 console error/warn0, raw221개다. 다른 raw 메시지의 내용을 전부 분류했다고 주장하지 않는다. viewport reset과 요청 ChatGPT 탭의 기존 대화 복원, preview/요청 탭 deliverable 표시를 마쳤다.

## 보존과 한계

원본 worktree 초기3403개 중3398개는 같고5개는 별도 사용자 작업의 .gitignore/AGENTS/비공개 캡처3개 변경이다. 원본 HEAD는 같으나 NUL status는 다르며 root에도 별도 AGENTS 메모가 있다. 해당 외부 변경을 덮어쓰거나 이번 커밋에 stage하지 않았다. 원본 전체 불변/root clean이라고 주장하지 않는다.

원문 Java25 전체·Docker/registry·실제 CI/PR/운영 배포, 네트워크/인증 장애, 성능 개선·모든 환경의 재현성은 미검증이다. 모든 픽셀의 동일성·모바일 가로 이동 밖 모든 텍스트의 동시 가독성·학습자 이해도도 미검증이다. parity650/verified0, inventory44871/implemented599/과거verified6에 한정해 기록한다. 전체134문서와 goal은 미완료이며 merge/push/PR 없이 로컬 체크포인트로 남긴다.

공백 검사 예외: 원시 Gradle 로그3개의2행과 생성 HTML에 그대로 보존한 동일 진단줄1개 끝 U+0020을 filename/line/index byte SHA로 고정했다. staged-diff-check.json에 정확 경고를 남기고 나머지 staged 파일은 diff --check exit0이다. 원시 로그를 trim하지 않았다.

최종 독립 검수: topic JPG22개를 모두 original 크기로 실제 열람하고 치수/bytes/SHA를 불변 manifest와 대조했다. 58raw행 및 parsed run60객체를 현재 데이터와 deepEqual 비교해 미해결 Critical/Important/Minor0이다. 각 raw행은 실제 viewport1개와 viewportExact를 남기므로 메인의 전후 assertion을 독립 두시점 재관측했다고 확대하지 않는다. 22대표 캡처 외18개 상태의 시각 전수 검토·모바일 가로 이동 끝의 모든 영역은 미검증이다. 보조 검사의 H1 위치 가정 오류1개는 실제 outerH1+inner20 구조로 교정하고 제품은 바꾸지 않았다. 필수3audit 모두 exit0이다.
