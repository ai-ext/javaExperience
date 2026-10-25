# D08 보충 학습 UI 계약

원문319줄8fence/기존지도/원문135·서버17은보존한다. 새로운14질문40상태를 기존D07처럼독립D08namespace로추가한다. 핵심코드·현재값·짧은설명·sourceNote는기본노출, 긴raw/원문만접는다. imagegen시안먼저제작중이며ASSETS14readyfalse/임시focus로기다린다. 실제값은source-proof/execution.json22CHECK6models와원문8block/추가fixture12/run-proof.py에서읽는다. 원문Java는없고추가Java21Boot4.1.1Gradle9.8/JUnit6.0.3예시이다. 실제원격CI/PR/배포/HTTP/Docker/K8s/Argo/secret은실행하지않았다.

|topic|image candidate|stage IDs|내용|
|---|---|---|---|
|refs|refs.jpg|refs-working,refs-index,refs-commit,refs-tag|실제value0→working1/index1/working2→commit1·feature ref이동/trunk고정→tag고정후branch이동. native|
|integration|integration.jpg|integration-merge,integration-rebase,integration-squash|각독립toyGit의2parents·parent+SHA변경·동일tree지만feature조상아님. native|
|conflict|conflict.jpg|conflict-markers,conflict-resolved|실제merge exit1/result.pyU/left2right3마커→명시양쪽의도합산Python5/2parents. native|
|testgate|testgate.jpg|testgate-ungated,testgate-failed,testgate-fixed|추가 ungated testfail1이어도bootJar먼저/JAR존재→명시dependsOn추가뒤testfail1/JAR없음→Java수정2+3=5/JUnit1pass/exit0. native|
|artifact|artifact.jpg|artifact-jar,artifact-mapping,artifact-copies|실제9102150bytes/SHAcb98...·nested20/클래스major65/runtime21test29union29→실제검증commit97f2...외부관측매핑(notembedded)→같은JAR3로컬dev/stg/prod사본(notrealpromotion). native|
|pr|pr-v2.jpg|pr-merge,pr-head,pr-gates|열린merge가능pull_request 기본M1merge ref vsH2head만명시checkout/selected2gate·acceptedcheck≠모든job실행성공/승인·strictstale옵션별도. models.pr-policy|
|syntax|syntax.jpg|syntax-actions,syntax-gitlab,syntax-jenkins,syntax-azure|원문block05yaml/06yaml/07groovy/08yaml그대로짧은발췌·의미강조, 모두미실행source. 도구별agent·runner/JDK25/Executor조건구분. models.pipeline-structure|
|dag|dag-v2.jpg|dag-success,dag-failed|미실행추가DAG/test·analysis형제병렬eligible/needs→package→publish별도gate/실패뒤skip/cleanup명시always는eligible. Gradletask와CIjob층구분. models.pipeline-structure|
|cache|cache.jpg|cache-input,cache-output|재생성데이터재사용vs실행artifact보관전달, miss재취득은입력/네트워크조건필요·native는복사한privatecacheoffline이며miss성공실험아님. models.artifact-cache-promotion|
|delivery|delivery.jpg|delivery-approval,delivery-auto|Delivery운영수동판단가능vsDeployment정한검사뒤운영자동. environment이름만으로승인/격리보장없음. models.delivery-gitops|
|gitops|gitops.jpg|gitops-principles,gitops-actors,gitops-status|OpenGitOps4원칙→CI/Git/repo-server/controller/live역할→OutOfSyncHealthy/SyncedProgressing독립사례. R2D2symbolic. models.delivery-gitops|
|argo|argo-policy-v2.jpg|argo-enabled,argo-prune,argo-drift,argo-retry|모델원문의absence모호성은model-clarifications.json4경우를sourceNote/JSONprojection기본노출;frozenraw보존. prune별도/false, selfHeal별도/false+multi-source다른trigger예외, 실패sameSHAparams기본새autosync재시도없음vsretry별도/설정120+jitter60문헌default≠완료시간. models.argo-policy+clarification|
|trust|trust.jpg|trust-original,trust-current,trust-context|원문actionsv4/Java25그대로보존미실행→부모문헌checkout7/setupjava6/Gradle25≥9.1/Boot4.1.1호환은native21과구분→권한event·untrusted코드조합;실제secret값없음. models.permissions-versions|
|promotion|promotion.jpg|promotion-tag,promotion-digest|TagT가D1→D2가리킬수있음/digest는contentID·JARsha아님/indexvsplatform선택구분/동일D1선언승격모델≠native3foldercopies. models.artifact-cache-promotion|

모든model/unrun-source상태는checks[]이며PASS부모숨김. native15상태가실제22CHECK를의미맞게커버한다. native snippet은immutablefixture/run-proof실제부분문자열이며model snippet은frozenmodel의명시JSONprojection 또는clarification이다. 강조줄은의미있는설명위치(실시간실행줄아님)·빈줄원본보존·전체runs JSON은fullfrozen경로해석으로연결. 6models를nativePASS로표시하지않는다. 원문YAML/Groovy는실제원격실행로그처럼보이지않게codeKind='unrun-source'로구분한다.

새파일7개만: tools/site/d08-lesson-data.mjs, d08-learning.mjs/js/css, d08-supplement.mjs, test-d08-learning.mjs, test-d08-generated.mjs. sharedbuild/package/inventory/preview등록은main소유다. 원문/sourceproof/frozen/이미지변경금지. generatedHTML검사는main등록·readytrue·build이후실행한다. D07dtwrap개선·manualzoom/history foreignfields·sourcehash reveal·mobile끝focus·copyblank 유지한다. supplement에original8/fixture12/runner/rawfrozen/model6/clarification/연구메인검증범위를보존. 코드복사·same-stage근거유지/다른stage접힘·End/Enter/historyrestore·좁은폭nooverflow검사. 기술회귀검사는 ungatedfailJAR존재/gatedfailnojar/fixedpass3관찰과명시dependsOn조건·같은JARlocalcopies/notCI·Argo4경우·refs/M1H2·모델noPASS·原文생성보존을의미있게검사한다.

최종 연결은 layout-reference.json/image-records.json과 실제 D08_ASSETS가 기준이다. 위 candidate 파일명은 시안 제작 전 계약이며, 교정 후refs-v3/integration-v3/conflict-v2/testgate-v3/artifact-v2/syntax-v2/delivery-v2/trust-v2/promotion-v3 등으로선정했다.
