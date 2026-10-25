# 개념 학습 검증 계약 · 2026-10-22

최신 사용자 요청: 전체134문서를 task1~task134로 계획하고, 우선 기존24문서를 검증한다. 이후 구현은 gpt-6-luna/high, 독립 검증은 gpt-6.1-sol/high의 하네스 서브에이전트로 반복한다. 기존24개의 부분 보강 기록은 완료24개를 뜻하지 않는다.

작업 루트: /Users/ds/code/javaExperience/.worktrees/concept-learning-night
기준 HEAD: 4b0493af52b1a06decca909d6bf9a8b6f9610686
출력 루트: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22

## 첫24개 검증

각 task는 기존 queue의 순서를 유지한다. task1=P09, task2=P04 … task24=D10. 원문 전문, lesson data/controller/renderer/tests, 해당 VERIFICATION/source-proof/image-records와 현재 HTML을 읽는다. 기존 보고서 성공 문구를 그대로 채택하지 않는다.

1. 요구사항 검토 → 원문의 각 주요 절/의미 단위를 lesson/stage에 연결하고 covered/partial/missing/unrun을 판정한다. 이미 선언된 범위 제한도 기록하며 전체 문서 공백을 감추지 않는다.
2. 자동 하네스 → 기존 관련 npm 검사 명령을 새로 실행하고 원시 출력·exitCode·시점·HEAD·소스 해시를 보존한다. 자동검사 통과가 기술 내용·시각 전달·전체 범위 통과를 대신하지 않는다.
3. 기술·품질 검토 → 실제 코드/JSON/관찰 로그와 값·SQL·상태 전환·flush/commit/rollback·다른 DB 연결·원문 환경/추가 실험의 경계를 대조한다. 원본/시안과 실제 캡처를 직접 읽었으면 어떤 파일을 보았는지 적는다. 한 장만 보고 전체 이미지 검수라고 표시하지 않는다.
4. 현재 브라우저 → 메인이 별도 preview의 desktop/mobile에서 주제 선택·단계 이동·확대/가로 이동·복사·원문·가로 넘침을 확인한다. 기존 캡처는 역사 증거이며 새 브라우저 조작을 대신하지 않는다. JPG 헤더와 실제 viewport를 확인한다.
5. 메인 종합 → 각 reviewer 결과와 하네스 원시 결과를 직접 대조한다. 미해결 critical/important 또는 필수 검사 실패가 있으면 failed. 원문 범위 공백이면 needs_completion. 다른 환경 미실행·학습자 이해·pixel 미검증을 전체 완료로 승격하지 않는다.

Sol 검토는 두 단계: spec(범위/원문/상태/근거) 후 quality(기술 정확성/오류 경계/접근성/유지보수/검사가 놓친 경우). 요구사항 검토에 실패해도 진단용 품질 관찰은 기록할 수 있으나 quality 승인으로 건너뛰지 않는다. 실제 수정 이후에는 다시 spec→quality 승인을 받아야 한다.

## 검토 산출물 인터페이스

각 task 폴더에는 review.md와 review.json을 쓴다. JSON 필수 필드:
- taskId, documentId, reviewer(model/reasoning), reviewedHEAD, scope, filesRead, commandsRun
- specReview: coverage[{sourceSection, sourceLines, stageIds, verdict, evidence, gap}], verdict
- qualityReview: verdict, findings[{id,severity(critical/important/minor),path,line,problem,evidence,fix,validation}]
- visualReview: imagesViewed, capturesViewed, limitations (미열람은 미열람으로)
- runtimeReview: freshCommands, historicalEvidence, unexecuted (외부 DB/실험 재실행은 하지 않음)
- boundedVerdict(pass/needs_fix/needs_completion/unverified), fullDocumentComplete(boolean), remainingWork, limitations

reviewer는 application·원문·기존 증거·공유 장부·Git을 수정하지 않는다. 자기 task 출력만 쓴다. 원문135문서/학습자서버17/외부AGENTS/기존RESUME는 보존한다. 다른 reviewer 폴더를 수정하지 않는다. 브라우저는 메인만 사용해 공유 상태 충돌을 피한다. review task는 추가 에이전트나 LLM/외부 CLI를 호출하지 않는다. 새 웹 리서치가 필요하면 구체 쟁점을 메인에게 반환한다. 연구 모델을 Sol로 바꾸지 않는다.

## 수정 및 이후110개 사이클

메인이 근거와 실패 재현을 확인해 좁은 수정 사양을 쓴다 → Luna high가 관련 파일만 구현하고 필요한 RED/GREEN 기록을 작성한다 → 자동 하네스 → fresh Sol high spec 검토 → spec 통과 뒤 quality 검토 → 메인 실제 브라우저/보존 검증 → 상태 갱신/로컬 의미단위 커밋. 실패 항목은 같은 구현자에 구체 사유를 돌려주고 수정 후 독립 재검토한다. 통과 문구만으로 상태를 올리지 않는다.

새 이미지가 필요하면 gpt-image-prompt/imagegen 스킬과 실제 imagegen을 쓰고 최종 자산은 JPEG로 저장한다. 새 React/shadcn 구성, 학습자 정답 구현, home/scenario/practice 변경은 범위 밖이다. 기존 DB/서비스/포트와 Docker 데이터는 조작하지 않는다. 통합·push·PR·merge는 하지 않는다.

검사 결과는 명령·코드 해시에 귀속한다. 기준이 바뀌면 해당 결과를 stale로 표시하고 필요한 부분만 재실행한다. 계획/조사/구현/자동검사/독립검토/현재브라우저/전체완료를 서로 다른 필드로 관리한다.
