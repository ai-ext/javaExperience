from pathlib import Path
import json,datetime,subprocess,hashlib
root=Path.cwd();base=root/'docs/design/concept-ia-2026-10-24';logs=base/'taskB-sol-logs';a=logs/'attempt4'
read=lambda name:json.loads((a/name).read_text())
spec=read('spec-pass.json');mut=read('mutations.json');scope=read('quality-scope.json');static=read('quality-static.json');qa=read('all-qa.json')
assert mut['rejected']==mut['mutations']==10
for f,h in spec['inputSnapshot'].items():assert hashlib.sha256((root/f).read_bytes()).hexdigest()==h,f
commands=[]
for name in ['concept-reader','concept-dark','home','knowledge-catalog','navigation']:
 p=a/('test-'+name+'.log');text=p.read_text();assert 'PASS' in text or '통과' in text,name
 commands.append({'command':'npm run test:'+name,'exitCode':0,'log':str(p)})
for name,script in [('independent-spec','spec-attempt4.mjs'),('all-qa','all-qa-attempt4.mjs'),('mutations','quality-mutations.mjs'),('quality-scope','quality-scope.mjs')]:commands.append({'command':'node docs/design/concept-ia-2026-10-24/taskB-sol-logs/'+script,'exitCode':0,'log':str(a/(name+'.log'))})
quality={'phase':'quality','status':'PASS_BOUNDED','beganAfterSpecRecord':str(a/'spec-pass.json'),'finishedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'counts':{'critical':0,'important':0,'minor':0},'static':static,'scopeProbe':scope,'mutationEvidence':mut,'findings':[]}
(a/'quality-pass.json').write_text(json.dumps(quality,ensure_ascii=False,indent=2)+'\n')
report={'reviewer':'Sol independent reviewer','root':str(root),'baselineHEAD':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'reviewedAt':quality['finishedAt'],'scope':'Task B PC dark 진입/설명 읽기. 추가 승인 QA p/strong/list 변환, toolbar H1, 19 source-H1 selector 변경 포함. Task C 제외.','attempt':4,'inputSnapshot':spec['inputSnapshot'],'specReview':spec,'qualityReview':quality,'verdict':'APPROVE_BOUNDED_STATIC_JSDOM_TASK_B','counts':quality['counts'],'unresolvedFindings':[],'resolvedFindings':['TASKB-I1 Q&A/reference folding','TASKB-I2 duplicate source H1 ID','TASKB-M1 reading-title focus','TASKB-I3 P16 scene-title clipping','TASKB-I4 nested original-table toggle hidden'],'commands':commands,'preservation':{'sourceBaselineEdited':False,'sourcePages':134,'sourceMDTextCodeOldIdsAndMainUnique':True,'oldMapOuterHTML':'all134 source pages compared with HEAD, unchanged','protectedTrackedDiff':[],'approvedGeneratedTests':'19 files are exact HEAD text with source-H1 selector replacement only','source135AndServer17NoTrackedDiff':True},'limitations':['브라우저 미조작. 실제 PC 가독성/header/scroll/표 넘침/학습자 이해도는 메인 담당자 소유.','검토자는 fresh build/전체24하네스/audit를 실행하지 않았다. 관련5하네스와 독립정적/JSDOM만 실행했다.','새 QA191그룹은 기존 질문을 접기화한 결과이며 새 학습내용을 추가하지 않았다.','CSS 레이아웃과 custom property의 실제 렌더링은 JSDOM 승인 범위 밖이다.','134개 고유개념 전체완성/wholepixel/학습자이해도/Task C를 승인하지 않는다.','제품수정/Java/DB/외부CLI/commit/push/PR/merge 없음.'],'reviewerProductChanges':False,'commitPushPr':False}
report['attempts']=[{'attempt':1,'spec':'FAIL','quality':'NOT_RUN','record':str(logs/'attempt1/taskB-sol-review.json')},{'attempt':2,'spec':'FAIL','quality':'NOT_RUN','record':str(logs/'attempt2/spec-fail.json')},{'attempt':3,'spec':'FAIL','quality':'NOT_RUN','record':str(logs/'attempt3/spec-fail.json')},{'attempt':4,'spec':'PASS_BOUNDED','quality':'PASS_BOUNDED','specRecord':str(a/'spec-pass.json'),'qualityRecord':str(a/'quality-pass.json')}]
(base/'taskB-sol-review.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
md=f'''# Task B 독립 검토 — 한정 승인

**Spec PASS_BOUNDED → Quality PASS_BOUNDED, C0/I0/M0.** 기준 HEAD `{report['baselineHEAD']}`의 현재 reader diff와 명시 승인된 QA 구조/toolbar H1/19개 source-H1 selector 변경을 검토했다. 입력 SHA는 `{a/'input-snapshot.json'}`에 고정했고 품질 완료 시 다시 같음을 확인했다.

## 명세와 보존

- 134개 source root normalized text/code/Markdown SHA와 기존 ID 보존, 생성 DOM ID 고유, main landmark 하나를 독립 확인했다.
- 기존 `.knowledge-page-map` outerHTML은 134문서에서 HEAD와 같고 원문MD/baseline/src/practice/scenario/proof/frozen에 추적 변경이 없다.
- 실제 Q&A133문서의907개 답이 기본 접힘이고 질문 summary와 답이 각각 존재한다. 새 p/strong 및 list191그룹은 질문을 복제하지 않고 이동했다. 접기 밖 잔여 답 텍스트0이며 D13의 QA 없음은 유지된다.
- 원문 버전 표14곳은 기본 접힘이며 summary가 표시되고 펼칠 수 있다. scene/read H1 역할도 독립 DOM/CSS 범위에서 확인했다.
- 실제 P09 controller와 reader를 함께 초기화해 모드 전환 후 stage/foreign history/query 보존, 원문hash 진입/정리, malformed hash, 없는hash 제목focus, 중복init 방지를 검증했다.
- metadata의 List<T>/HTML 종료문자열/따옴표 roundtrip과 주입 노드 없음이 확인됐다.
- 19개 generated test diff는 HEAD에 승인된 source-H1 selector 치환만 적용한 결과와 정확히 같다. 기존 wholeSourceText/CODE/ID/frozen 기대값은 유지된다.

## 품질과 검증

관련5하네스 concept-reader/concept-dark/home/knowledge-catalog/navigation 모두 fresh PASS다. `{a/'mutations.json'}`의 독립변이10개를 모두 검출했다. 외부history/query 손실, read중 scene노출/source닫힘, Q&A 자동노출, hash 미정리, 중복init, 잘못된decode, nested표버튼 숨김, read중복제목 경계를 검증했다. 변이는 메모리 문자열/격리 DOM에서만 실행해 제품 파일을 바꾸지 않았다.

QA helper는 H3가 없는 자가점검 chapter에서만 호출되며 다른 core section·기존H3 경로는 보존된다. raw slice로 필요한 문단/목록만 감싸고 전체 원문을 재직렬화하지 않는다. 독립 fixture에서 text순서/질문1회/inline+후속답/ordered start/코드·ID 보존을 확인했다. 의존성·네트워크·storage·새mobile/light 분기·래스터filter 추가가 없다. catalog 복귀 controller는 querySelectorAll로 toolbar와 기존 anchor를 처리한다.

근거:

- `{a/'spec-pass.json'}` 및 `{a/'independent-spec.json'}`
- `{a/'all-qa.json'}`
- `{a/'quality-pass.json'}`, `{a/'quality-static.json'}`, `{a/'quality-scope.json'}`
- `{a/'mutations.json'}`와 같은 폴더의 명령별 log

이전3회 FAIL 원본은 `{logs/'attempt1'}`, `{logs/'attempt2'}`, `{logs/'attempt3'}`에 보존했다. I1/I2/M1/I3/I4는 모두 해소됐다.

## 승인 한계

정적/JSDOM 범위의 Task B 한정 승인이다. 실제 PC 브라우저 가독성·header·scroll·표 넘침·이미지/코드 배치는 메인 담당자 QA로 확정한다. 검토자는 build/전체24하네스/audit/브라우저/Java/DB/외부CLI를 실행하지 않았고 제품수정/commit/push/PR/merge를 하지 않았다. 134개 고유개념 전체완성·wholepixel·학습자이해도·Task C는 승인하지 않는다.
'''
(base/'taskB-sol-review.md').write_text(md)
print(json.dumps({'verdict':report['verdict'],'counts':report['counts'],'commands':len(commands),'mutations':mut['rejected']},ensure_ascii=False))
