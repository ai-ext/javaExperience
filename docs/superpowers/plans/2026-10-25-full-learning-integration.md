# 기존 학습 개편 결과의 실제 통합 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. 단순 수집·이식은 Luna, 설계·계약·검증은 메인이 수행한다.

**Goal:** 기존 시나리오 기능형7과제·시작패키지·시각화·개념왕복, 개념26종과134공통reader, 최신stepper와현재API도구를 하나의worktree에서 사용할 수 있게 결합한다.
**Architecture:** 현재feat/course-learning-integration을유지한다. 안전한main기반개념후보를병합하고, 공개제외이력이있는원본scenario브랜치는파일단위로이식한다. 같은URL을쓰더라도community실습과board과정의서버·DB·응답계약을명확히구별한다. 원본worktree와학습자서버코드는읽기전용이다.
**Tech Stack:** 기존NodeESM/esbuild/JSDOM/정적HTML,ChromeCUA,별도교육용ZIP/JDK21,격리MySQL/Redis검증.

## 1. 전체 대조·보존
- [x] 등록16worktree의HEAD·dirty·untracked·포함관계와statusSHA 수집. 현재작업a2fdba44는기존복원검증백업에있다.
- [x] scenario9ce57dd9의기준이후2,557경로및현재타깃과의동일/상이/부재·import를파일별수집했다.
- [ ] visual-learning-next와p1-spec-roadmap의WIP도현재기반에포함된것/후속변경/보존전용을경로별판정한다. AGENTS와사용자미완성코드는이식하지않는다.
- [ ] 입력ref고정: stepper ec0e0b87, concept a2f4c4e, scenario9ce57dd9. 원본dirty/index/untracked는변경하지않는다.

## 2. 최신 stepper·개념 확장 결합
- [ ] ec0e0b87의부품·의미색·긴본문개선을유지하되,메뉴이동수정과6개주메뉴/보조메뉴분리는보존한다. 이전에검증한안정적메뉴를되돌리지않는다.
- [ ] 안전한concept후보a2f4c4e를현재브랜치에병합한다.26개학습모듈/추가이미지/134reader/검색·돌아오기/본문폭/QA/확대를보존한다.
- [ ] 공통build/package/inventory는기능합집합으로해결한다.생성HTML은수동선택으로끝내지않고소스로재생성한다.장부충돌은동일ID별기록을남기고최대상태로승격하지않는다.

## 3. 기존 기능형 실습7종 이식
- [ ] tools/site/functional-*와의존모듈·검사·generator, scenario/flow의원문/ZIP/코드,필요한docs/design의선택이미지·모델·근거·manifest를복사하고원본SHA를기록한다.학생src·공개제외3캡처·과거PNG·중복공통기반은복사하지않는다.
- [ ] 작성/상세/목록/수정/삭제/좋아요/취소의기존실습은community패키지의정본계약그대로유지한다.과정v2의board-server와같은API라고안내하지않는다.서비스목록에서실행프로젝트·도달기능·시작위치를분명히한다.
- [ ] 기능형화면의요구사항/코드/요청·실제응답/DB확인/예상상태·쿼리비교/시작ZIP을유지한다.기존state29·영역42의전체의미검토가완료됐다고표시하지않는다.
- [ ] 제공된legacyZIP의소스와SHA·컴파일결과를대조한다.원본Git객체나원본worktree가없어도학습사이트와시작패키지를사용할수있어야한다.

## 4. 하나의 진입·왕복 동선
- [ ] 서비스만들기에서기능형7과제를직접선택하고기존101단계는참고로찾게한다.45일과정과별도community실습의진도/ID/토큰/서버맥락은섞지않는다.
- [ ] 기능형과제→관련개념(새26장면·공통reader)→같은과제로복귀를실제로연결한다.모든참고링크의fromTask는검증된경로만허용한다.
- [ ] 홈/과정의관련진입에서도이식결과가노출되게한다.파일만보관해놓고통합이라고표시하지않는다.

## 5. 검증·백업
- [ ] 최신과정검사와26개념하네스/reader/catalog/dark,기능형CRUD/like/ZIP/원문보존검사및4audit실행.원본검증기록은바꾸지않고새통합실행기록을별도로남긴다.
- [ ] Chrome에서홈→기능형작성/상세/목록/수정/삭제/좋아요·취소,개념검색/장면/확대/복귀,과정API도구를실제조작한다.PC1366/1440/1920과공통메뉴안정성을확인한다.
- [ ] 독립서버/일회용DB에서community의201JSON/like200JSON과board의201빈본문/like204를구별해확인한다.원본서버/DB를사용하거나중지하지않는다.
- [ ] 학습자서버와과정의기준원문보존,공개제외이력/경로0,최종생성물재생성,로컬커밋/독립복원백업을완료한다.push/mainmerge는하지않는다.

## 명시적 판정
과거공통홈/검색은이미main기반에있어중복이식하지않는다.p1 WIP중이미stepper에반영된교육내용/스타일은중복추가하지않는다.새개념108개의신규제작은이번통합범위가아니며현재존재하는26종과공통reader전체를가져오는것이범위다.이통합이기존134문서또는모든시나리오의전수교육검토완료를뜻하지않는다.
