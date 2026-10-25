# task11 R04 독립 감사

판정은 **needs_fix**이며 전체 문서 완료는 false다. 기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`, 원문 SHA `78af924291e7161c8357e46a8ba08361a57d53509deab926262b0e81fbfaa780`. 원문351줄과 data/controller/renderer/tests/HTML·기존 실행 근거를 대조했다.

요구사항 검토: 의미 단위 62개 중 covered 45, partial 11, missing 2, unrun 4. 원문 보존과 학습 커버리지는 구분했다. 상세 전수표는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task11/source-coverage.json 에 있다. UNION/UNION ALL 독립 학습은 원문 필수범위에 없어 결함으로 계산하지 않았다.

품질 검토는 spec 미통과 뒤의 진단이다. **R04-Q01 important**: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/r04-lesson-data.mjs:1811 및1812~1814의 현재 DML 복사 조각은 transaction 시작과 rollback 종료가 없다. LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/r04-learning.js:99가 조각을 그대로 복사한다. 기본autocommit 연결에서 단독 실행하면 화면이 설명한 취소 경계를 유지할 수 없다. products도 START만 있고 종료가 없다. 원문 전체 rollback 스크립트 또는 독립적으로 rollback까지 닫히는 안전한 복사용 코드를 제공하고 clipboard 경계 회귀 검사를 추가한다. 새 DB는 실행하지 않았으며 조각/복사 동작은 정적 확정, 실제 DB영향은 기존autocommit근거에 따른 추론으로 구분한다.

핵심 값과 경계는 기존 근거와 일치한다: JOIN행수6/2/1/4/2, COUNT1/0, 17919×3=53757, 동금액300/100/200, GROUP20, EXISTS96, NULL/UNKNOWN, 원문JDBC의PAID필터차이, writer32/observer33, ROW_COUNT직전 추가writer조회없음, rollback초기복귀. 추가UPSERT의clientflag와 CHECK3819/제어순서실험을 일반화하지 않는다.

새 `npm --prefix tools/site run test:r04` 실제 exit0, stderr빈값, 입력SHA전후불변. 기록: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task11/runs/sol-20261021T235458.133041Z/result.json, stdout.log, stderr.log. 기존49CHECK를 읽는JSDOM/보존검사이며 새MySQL/JDBC49실험이 아니다.

시각 열람은 선정3장(outer/aggregate/dml)과 기존3캡처(desktopouter/mobileaggregate/desktopdml)에 한정했다. 수치/원문추가구분을 확인했고 mobile캡처의번역overlay·sticky겹침은 기존캡처한계다. 나머지시안7장/캡처17장, 현재브라우저·전수pixel·실제pan/복사는 이번범위밖이다. 파일별경로는review.json에있다.

남은 묶음은 복사경계 수정, 선집계/선택기준/허용목록/과다조건과바인딩 장면, 1062·1452·INSERT개수불일치 실패교정, 원문Java25/Boot/Kotlin/YAML/bash절차 미실행, 메인의 현재desktop/mobile검증이다. application/원문/기존근거/장부/Git/다른task는 변경하지 않았다.

판정: needs_fix
커버리지: covered 45/62, partial 11, missing 2, unrun 4
이슈수: critical 0 / important 1 / minor 0
actualexit: 0
fullDocumentComplete: false
