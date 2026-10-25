from pathlib import Path
import json,datetime,hashlib
root=Path.cwd(); folder=root/'docs/design/concept-cycle-2026-10-22/repairs/priority'; logs=folder/'sol-logs'; absolute=lambda p:str(root/p)
manifest=json.loads((folder/'correction-manifest.json').read_text()); fresh=json.loads((logs/'fresh-tests.json').read_text()); preservation=json.loads((logs/'preservation.json').read_text()); extra=json.loads((logs/'independent-checks.stdout.json').read_text())
def evidence(path,line,observation):return {'path':absolute(path),'line':line,'observation':observation}
fixes=[
 {'id':'task10.fix1','originalSeverity':'important','specVerdict':'pass','qualityVerdict':'approved','evidence':[
 evidence('tools/site/build.mjs',123,'허용 raw token은 정확히 두 개. R03 절대경로 + token.raw 일치에서만 escaped literal 반환, 나머지는 false로 Marked 기본 처리.'),
 evidence('tools/site/test-r03-generated.mjs',14,'역사 baseline의 정확히 두 구절만 보정. 실제 TINYINT/BIGINT 두 cell의 정확한 textContent와 del 부재, code/ids/map 보존 검사.'),
 evidence('docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/independent-checks.mjs',18,'현재 build의 handler 본문을 추출해 fence/inline code/double~~/타문서 기본 렌더링을 실제 실행. manifest의 두 보정 및 원문/baseline SHA와 대조.')],
 'revalidation':'renderer token/문서 경로/Marked 버전 또는 생성 HTML이 바뀌면 test:r03 및 independent-checks.mjs를 다시 실행한다.'},
 {'id':'task10.fix2','originalSeverity':'important','specVerdict':'pass','qualityVerdict':'approved','evidence':[
 evidence('tools/site/r03-lesson-data.mjs',997,'활성 R03-foreign는 R03-foreign-v4.jpg이며 기존 asset의 file만 변경.'),
 evidence('docs/design/r03-2026-10-20/source-proof/execution.json',690,'오류1451의 실제 child는 article.author_id / fk_article_author / member.id.'),
 evidence('tools/site/test-r03-generated.mjs',42,'활성 ASSETS 경로 → 승인 targetJPEG → 실제 파일 SHA 연결 검사. 파일 존재만 확인하는 검사가 아님.')],
 'revalidation':'선정 이미지/ASSETS/manifest 변경 시 active 경로·실제 hash·native 크기와 실제 image view를 다시 대조한다.'},
 {'id':'task11.fix1','originalSeverity':'important','specVerdict':'pass','qualityVerdict':'approved','evidence':[
 evidence('tools/site/r04-lesson-data.mjs',1775,'정적 String.raw 상수는 원문 block-13.sql 33줄·마지막 개행까지 byte-equal. START TRANSACTION, ROLLBACK, 그 뒤 SELECT 모두 포함.'),
 evidence('tools/site/r04-lesson-data.mjs',1843,'DML sourceNote는 한 START→ROLLBACK 중간 발췌와 전체 복사의 범위를 명시.'),
 evidence('tools/site/r04-learning.js',58,'DML 밖에서 새 버튼/수동 영역 hidden, DML 진입에서는 수동 영역 collapsed.'),
 evidence('tools/site/r04-learning.js',104,'일반 복사는 캡처한 stage fragment만, 전체 복사는 static 원문 전체만 전송. 두 handler 모두 성공/실패 뒤 sceneVersion guard.'),
 evidence('tools/site/r04-learning.js',121,'전체 clipboard 실패 시 성공 문구 없이 전체 원문 수동 영역을 열고 안내.'),
 evidence('tools/site/r04-learning.css',17,'header/actions wrap, mobile column, manual SQL pre-wrap 등 폭 대응. 실제 배치 검증은 메인 소유.'),
 evidence('tools/site/test-r04-full-dml-copy.mjs',12,'바이트와 끝 개행, 두 payload, 실패 안내, 성공 race를 실제 DOM/clipboard stub으로 검사. 독립 검사에서 두 handler의 reject race도 실행.')],
 'revalidation':'SQL 원문/정적 상수/controller/renderer 변경 시 test:r04와 success/reject navigation race를 재실행하고 메인이 desktop/mobile clipboard 및 폭을 검증한다.'},
 {'id':'task20.fix1','originalSeverity':'important','specVerdict':'pass','qualityVerdict':'approved','evidence':[
 evidence('tools/site/d06-lesson-data.mjs',666,'활성 D06-promotion는 promotion-v5.jpg. 해당 file만 변경.'),
 evidence('docs/knowledge/D06-deployment-concepts.md',38,'원문 local 개인 확인/dev 공유 통합 및 조직별 QA 의미와 새 이미지 두 줄이 일치.'),
 evidence('tools/site/test-d06-generated.mjs',62,'활성 ASSETS 경로 → 승인 targetJPEG → 실제 SHA 연결 검사. 기존 나머지12자산은 기존 선정 metadata로 검사.')],
 'revalidation':'이미지/ASSETS/manifest 변경 시 원문 Local/Dev 및 나머지 모델·실측 경계를 실제 image view와 함께 재검증한다.'}
]
images=[]
for x in manifest['imageCorrections']:
 images.append({'path':x['targetJPEG'],'actualView':True,'method':'functions.view_image detail=original','dimensions':x['conversion']['targetDimensions'],'sha256':x['conversion']['targetSHA256'],'rawPNG':x['rawSource'],'rawSHA256':x['rawSourceSHA256'],'quality':92,'quality92ReproducedByteEqual':True,'observations':(['중앙 article (자식), author_id, fk_article_author와 ERROR1451/ROLLBACK 일치. 새 child id/count를 발명하지 않음.','좌측 orders.member_id 999999/1452, CASCADE 자식 제거, SET NULL 행 유지, BIGINT signed/unsigned 3780 및 private datadir/socket/TCP OFF/기존 DB 아님 footer 유지.'] if x['documentId']=='R03' else ['Local: individual checks / Dev: shared integration 두 줄이 분리되어 읽힘.','QA 조직별 의미/예시 순서 한계, Staging/Production, row2 schema/data/external/session/API 복구 한계, row3 local copies/router blue A/profiles not switched/finite10/H2별도, NOT EXECUTED HERE 모델 경계 유지.']),'limitations':['한 장의 새 활성 JPEG를 실제 열람했다. 전 문서/전 이미지 검수가 아니다.','현 desktop/mobile 화면에서의 축소 가독성과 배치는 메인의 별도 검증 대상이다.']})
read_files=['docs/design/concept-cycle-2026-10-22/repairs/priority/SPEC.md','docs/design/concept-cycle-2026-10-22/repairs/priority/correction-manifest.json','docs/design/concept-cycle-2026-10-22/repairs/priority/repair-log.md','docs/design/concept-cycle-2026-10-22/AUDIT-CONTRACT.md','docs/design/concept-cycle-2026-10-22/infrastructure/audit-baseline.json','docs/design/concept-learning-night-2026-10-20/preservation-baseline.json','tools/site/build.mjs','tools/site/r03-lesson-data.mjs','tools/site/r04-lesson-data.mjs','tools/site/r04-learning.js','tools/site/r04-learning.mjs','tools/site/r04-learning.css','tools/site/d06-lesson-data.mjs','tools/site/test-r03-generated.mjs','tools/site/test-r04-full-dml-copy.mjs','tools/site/test-d06-generated.mjs','tools/site/package.json','docs/design/r03-2026-10-20/source-proof/execution.json','docs/design/r03-2026-10-20/html-baseline.json','docs/design/r04-2026-10-20/source-proof/original/block-13.sql','docs/knowledge/D06-deployment-concepts.md','docs/design/concept-cycle-2026-10-22/repairs/r03/image-candidate.json','docs/design/concept-cycle-2026-10-22/repairs/d06/image-candidate.json']
review={'schemaVersion':1,'reviewedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':{'model':'gpt-6.1-sol','reasoning':'high','independent':True},'reviewedHEAD':fresh['HEAD'],'reviewedState':'4b0493af 위 현재 미커밋 priority repair 입력; clean worktree 아님','scope':{'only':[x['id'] for x in fixes],'approvalMeaning':'기존 중요 결함4개의 bounded 수정만 승인. 새 제품 전체완료/첫24 완료 승인이 아니다.','excluded':['기존 minor9개','전체 문서 교육 범위 공백','메인 현재 desktop/mobile 브라우저 검증','새 DB/native 서버/SQL 실행/웹 조사/외부 CLI/추가 agent']},'filesRead':[absolute(x) for x in read_files],'specReview':{'order':1,'verdict':'pass','coverage':[{'requirement':x['id'],'verdict':'pass','evidence':x['evidence']} for x in fixes],'preservation':{'documents135Unchanged':not preservation['documents']['mismatches'],'learnerServer17Unchanged':not preservation['learnerServer']['mismatches'],'audit24JSONUnchanged':not preservation['audit24']['mismatches'],'protectedTracked538Unchanged':not preservation['baselineTrackedProtected']['mismatches'],'evidence':str(logs/'preservation.json')}},'qualityReview':{'order':2,'enteredAfterSpecPass':True,'verdict':'approved','findingCounts':{'critical':0,'important':0,'minor':0},'findings':[],'fixedFindings':fixes},'visualReview':{'imagesViewed':images,'capturesViewed':[],'limitations':['실제 브라우저는 사용하지 않았다. 메인 소유 현재 desktop/mobile 검증 결과를 이 승인으로 대신하지 않는다.','정적 CSS와 DOM hidden/open 동작을 검증했으며 실제 렌더링 폭/OS clipboard는 메인이 확인해야 한다.']},'runtimeReview':{'freshCommands':fresh['runs'],'inputsUnchangedAcrossTests':fresh['inputsUnchanged'],'inputSHA256Preflight':str(logs/'input-sha-preflight.json'),'inputSHA256Postflight':str(logs/'input-sha-postflight.json'),'additionalChecks':extra,'additionalCommands':[{'command':'node docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/independent-checks.mjs','exitCode':0,'stdout':str(logs/'independent-checks.stdout.json'),'stderr':str(logs/'independent-checks.stderr.log')},{'command':'python3 docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs/check-preservation.py','exitCode':0,'stdout':str(logs/'preservation.stdout.log'),'stderr':str(logs/'preservation.stderr.log')}],'historicalEvidence':['source-proof 실행 JSON을 기술 내용 대조에만 사용했다. 새 DB 실행 결과라고 부르지 않는다.'],'unexecuted':['DB/MySQL/native 서버/SQL','실제 브라우저/OS clipboard','전체24 하네스/3audit/전체 build (메인 소유)']},'verdict':'approved','boundedVerdict':'pass','fullDocumentComplete':False,'remainingWork':['메인이 현재 desktop/mobile에서 R03 숫자범위·FK, R04 발췌/전체복사/수동영역/폭, D06 역할 그림을 최종 대조한다.','공유 build/전체24하네스/3audit은 메인 결과와 현재 SHA를 대조한다.','기존 minor9개와 문서 전체 공백은 본 네 수정 승인으로 해소되지 않는다.'],'limitations':['검토자는 application/원문/기존 증거/공유 장부/Git 상태를 수정하지 않았다. 출력은 sol-review.json, sol-review.md 및 sol-logs에 한정했다.','AGENTS.md와 RESUME.md의 기존 미커밋 상태는 범위 밖이며 저장소 전체 clean을 주장하지 않는다.']}
(folder/'sol-review.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
md=f'''# 첫24 중요 결함4개 수정 독립 검토

**approved — 네 수정에 한정한 승인.** spec 검토 pass 뒤 quality 검토 approved다. 신규 critical0/important0/minor0이며 제품 전체완료나 첫24문서 완료를 뜻하지 않는다. 검토 기준 HEAD는 `{fresh['HEAD']}`이고 현재 미커밋 수정의 입력 SHA에 귀속된다.

| 수정 | 결론 | 근거 |
|---|---|---|
| task10.fix1 | 승인 | `{absolute('tools/site/build.mjs')}:123,241`은 R03의 정확한 두 raw token만 literal 처리한다. 생성 두 cell의 범위 text와 del 부재, 코드/ID/map 보존 통과. 역사 baseline은 그대로 두고 `{absolute('tools/site/test-r03-generated.mjs')}:14`의 정확히 두 승인 보정만 manifest와 일치한다. 독립 실행에서 fence/inline code/double~~/타문서 기본 렌더링 유지. |
| task10.fix2 | 승인 | `{absolute('tools/site/r03-lesson-data.mjs')}:997` active→v4→승인 JPEG→실제 SHA 연결. 실제 image view에서 중앙 `article.author_id`, `fk_article_author`가 source-proof 오류1451과 일치. 1452/CASCADE/SET NULL/signed3780/footer 경계 유지. |
| task11.fix1 | 승인 | `{absolute('tools/site/r04-lesson-data.mjs')}:1775,1843`에서 33줄 원문 전체·끝 개행·ROLLBACK 뒤 SELECT byte-equal 및 중간 발췌 문맥 명시. 기존 모든 stage/code/강조/runtime는 기준 HEAD와 동등. `{absolute('tools/site/r04-learning.js')}:104,114` 두 payload와 성공/실패 scene guard, 진실한 실패/수동 복사 동작 통과. DML 밖 hidden/진입 시 collapsed 확인. |
| task20.fix1 | 승인 | `{absolute('tools/site/d06-lesson-data.mjs')}:666` active→v5→승인 JPEG→실제 SHA 연결. 실제 image view에서 Local 개인 확인/Dev 공유 통합 두 줄을 분리. QA 조직별 의미·staging/prod·row2 복구 한계·row3 local 관측·미실행 모델 유지. |

두 새 JPEG는 `view_image(detail=original)`로 실제 열었다. `{manifest['imageCorrections'][0]['targetJPEG']}`의 SHA는 `{manifest['imageCorrections'][0]['conversion']['targetSHA256']}`, `{manifest['imageCorrections'][1]['targetJPEG']}`의 SHA는 `{manifest['imageCorrections'][1]['conversion']['targetSHA256']}`다. raw PNG→sips JPEG quality92를 `{logs}` 안에 다시 생성한 결과 두 target과 바이트 SHA가 같고, PNG/JPEG 모두 native1672×941이다. 기존 이미지/리뷰/source-proof/raw/frozen은 보존했다.

새로 실행한 `npm --prefix tools/site run test:r03`, `test:r04`, `test:d06`는 모두 exit0이다(2026-10-22T00:46:49Z~00:47:00Z). `{logs/'fresh-tests.json'}`에 raw stdout/stderr 경로·UTC·exitCode, `{logs/'input-sha-preflight.json'}`와 `{logs/'input-sha-postflight.json'}`에 관련19입력 SHA를 남겼고 전후 동일하다. 독립 경계 검사는 `{logs/'independent-checks.stdout.json'}`에 있다.

원문135/학습자서버17은 지정 preservation baseline SHA와 동일하고 기존 감사24 JSON도 audit baseline SHA와 동일하다. R03/R04/D06의 기존 디자인 증거와 원문/서버를 포함한 tracked538파일은 4b0493af와 바이트가 같다. 근거는 `{logs/'preservation.json'}`이다. 저장소 전체 clean을 주장하지 않으며 기존 AGENTS/RESUME 변경은 범위 밖이다.

현재 desktop/mobile 브라우저와 실제 OS clipboard는 사용하지 않았다. 정적 CSS와 DOM 동작 승인은 실제 화면의 폭·축소 가독성 승인을 대신하지 않는다. 메인이 현재 화면과 전체24하네스/공유 build/3audit을 최종 확인해야 한다. 기존 minor9개·문서 전체 공백은 별도 잔여 작업이며 fullDocumentComplete=false를 유지한다.

재검증 조건: 관련 코드/원문/ASSETS/manifest/Marked 버전이 바뀌면 해당 npm 검사와 독립 경계 검사, 실제 이미지 열람, 메인 desktop/mobile 대조를 다시 실행한다. 본 검토에서 추가 수정 요구는 없다.
'''
(folder/'sol-review.md').write_text(md)
print(json.dumps({'verdict':review['verdict'],'spec':review['specReview']['verdict'],'quality':review['qualityReview']['verdict'],'files':[str(folder/'sol-review.json'),str(folder/'sol-review.md')]},ensure_ascii=False))
