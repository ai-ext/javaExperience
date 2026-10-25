# D07 학습 화면 구현 계약

시안은 artifact-v3 및 health/lifecycle/placement/taxonomy/responsibility/virtualization/dockerfile/traffic/managed/storage/cost/migration의13개다. 나머지12개 실제 imagegen이 진행 중이다. 이미지 생성·검토 전에는 최종 구현/검증 상태를 올리지 않는다. 파일명·크기·focus·ready는 메인이 실제 이미지 검수 후 확정한다.

## 반드시 지킬 사실

- D07은 **원문 Java가 있다**. `source-proof/original/block-04.java`를 byte 그대로 복사해 추가 Gradle/Java21.0.6·Boot4.1.1 환경에서 실행했다. D06의 “모든Java추가/원문Java없음” 문구를 이식하지 않는다. 원문Java25명령·Dockerfile은미실행이다.
- 원문300줄8fence(Mermaid4/Java1/bash2/Dockerfile1), 기존 본문14250/도표제외13022자·code4/id24/map1을 보존한다. fixture4개는 원문Java/Dockerfile사본2개+추가Gradle/build설정2개다.
- 실행CHECK10/미실행모델6은 mainfreeze→fresh→독립전체frozen이일치한다. 원문2class major65, dependencies39개와JARnested34개를구분한다.39는애플리케이션을포함한파일수가아니라해석된dependency파일수다.
- JAR `d07-native-proof-1.0.0.jar`,1.0.0,19,902,934bytes,SHA `bfc2d0740b6425f8a1c9057f2b1b53cb9fd8badae043f5c9b98dd785c162c471`. 동일사본local-a/app.jar/local-b/app.jar. local-a/b는관찰기processalias이며실제JVM이름이나profile이아니다. 명시profile선택없다.
- 자체2JVM/한Mac/differentloopbackephemeralports.4HTTP관측순서는 Ahealth200ok/Bhealth200ok/Aactuator404/B-after-Astophealth200ok다. literalok는DB·노드·리전진단이아니며별도Actuator의UP도아니다. /health는HTTP프로브응답에는사용할수있다.
- A자체SIGTERM143·portclosed후직접B요청200이며자동LBfailover가아니다. 최종B도143/PIDgone/portclosed/killfallback없다.2개는추적한장기HTTPJVM분모일뿐모든Java실행수가아니다. version/build명령은별도exit0.
- 위치/전용성/운영주체·NIST5/3/4·AzurebroadApplicationsShared의granularity·MacLinuxVM/Darwin·EXPOSE/publish·wildcardCOPY조건·AZ/데이터·서비스별managednode·S3vsHNS·비용항목/7R는모델6과공식출처로읽으며PASS를붙이지않는다. source-proof/models.json과 research/main-verification.json/README.md를우선한다. 원본연구의기본설정만보고Luna접근불가추정은이번명시override/성공실행으로정정했다.

## 질문과 상태: 13주제·36상태

| topic / image | stages | 근거 |
|---|---|---|
| artifact / artifact-v3.jpg | artifact-source, artifact-build, artifact-copies | facts source-bodies / additionalruntime / pinnedartifacts / originalcompiledclasses / executablejar / samecopies. 원문Java·추가Gradle·관찰기코드는각실제파일의정확발췌. |
| health / health.jpg | health-ok, health-actuator | facts two-own-local-http-processes-not-two-azs / literal-health-is-not-actuator-or-db-diagnosis. 원문HealthController와추가관찰기request줄. |
| lifecycle / lifecycle.jpg | lifecycle-two, lifecycle-one, lifecycle-clean | facts two-own... / stopping-one... / all-own-http...의실제관찰기. |
| placement / placement.jpg | placement-onprem, placement-private, placement-hybrid | models.deployment-models |
| taxonomy / taxonomy.jpg | taxonomy-five, taxonomy-service, taxonomy-deploy | models.deployment-models |
| responsibility / responsibility.jpg | responsibility-infra, responsibility-platform, responsibility-saas | models.service-responsibility |
| virtualization / virtualization.jpg | virtualization-vm, virtualization-container, virtualization-mac | models.virtualization-packaging |
| dockerfile / dockerfile.jpg | dockerfile-build, dockerfile-publish, dockerfile-copy | models.virtualization-packaging; 원문Dockerfile/미실행bash의정확발췌가능. |
| traffic / traffic.jpg | traffic-normal, traffic-failure | models.traffic-resilience |
| managed / managed.jpg | managed-platform, managed-k8s, managed-catalog | models.service-responsibility / models.catalog-storage-cost |
| storage / storage.jpg | storage-key, storage-hns | models.catalog-storage-cost |
| cost / cost.jpg | cost-onprem, cost-cloud, cost-buying | models.catalog-storage-cost / models.migration-choice |
| migration / migration.jpg | migration-keep, migration-move, migration-change | models.migration-choice |

native8상태/모델28상태. models만보는상태는checks=[]이며runKeys가models로시작한다. 모델은JSON/분류·책임표의선택가능한근거로표시하며실행한Java/명령인척하지않는다. 의미있는강조줄을고르고index0고정으로채우지않는다. 각상태의짧은설명/값/관련근거/그림focus가함께바뀐다.

## 구현 파일과 검증 경계

UI는 tools/site/d07-lesson-data.mjs, d07-learning.mjs, d07-learning.js, d07-learning.css, d07-supplement.mjs, test-d07-learning.mjs, test-d07-generated.mjs 7개만작성한다. D06패턴의history/keyboard/copy/접기/모바일확대를보존하며D07고유내용으로쓴다. 핵심코드·현재값·출처는기본노출,긴원문·fullraw·미실행모델세부근거는이름이분명한details에보존한다. header는“함께읽을코드·분류”처럼모델JSON과실제코드를구분할수있게한다.

초기모든asset은ready=false, temporaryfocus로남긴다. 최종dims/focus/alt/readytrue/registry는메인이수정한다. 공유build/package/inventory/preview/HTML/원장·원문MD/학습자서버/AGENTS/다른주제파일은건드리지않는다. build·원장실행·preview재시작·commit·실제서버/VM/container/cloud조작도하지않는다. 단위/standalone/syntax만실행하고결과를보고한다. 최종generated검사는메인의공유등록/build후수행한다.
