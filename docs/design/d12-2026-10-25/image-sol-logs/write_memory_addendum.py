import datetime,hashlib,json,pathlib,subprocess,tempfile
B=pathlib.Path(__file__).resolve().parent.parent;W=B.parents[2];O=B/'image-sol-logs'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
prior=json.loads((B/'image-sol-review.json').read_text());sel=json.loads((B/'selected-images.json').read_text());history=json.loads((B/'image-generation-history.json').read_text());records=json.loads((B/'image-records.json').read_text())['images']
assert len(sel)==16 and 'memory-available' not in {x['id'] for x in sel}
new=next(x for x in sel if x['id']=='memory-available-v2');old=next(x for x in prior['images'] if x['id']=='memory-available')
assert sha(pathlib.Path(old['destination']))==old['sha256AtView']
unchanged=[]
for x in sel:
 if x['id']=='memory-available-v2':continue
 before=next(y for y in prior['images'] if y['id']==x['id']);assert sha(W/x['destination'])==x['sha256']==before['sha256AtView'];unchanged.append(x['id'])
assert len(unchanged)==15
raw=pathlib.Path(new['rawPath']);dest=W/new['destination'];prompt=W/new['prompt']
with tempfile.TemporaryDirectory(prefix='d12-memory-addendum-',dir='/tmp') as tmp:
 replay=pathlib.Path(tmp)/'replay.jpg';cmd=['sips','-s','format','jpeg','-s','formatOptions','92',str(raw),'--out',str(replay)]
 run=subprocess.run(cmd,capture_output=True,text=True,check=True)
 metaCmd=['sips','-g','format','-g','pixelWidth','-g','pixelHeight',str(raw),str(dest)];meta=subprocess.run(metaCmd,capture_output=True,text=True,check=True)
 replaySha=sha(replay);assert replaySha==new['sha256']==sha(dest) and dest.stat().st_size==new['bytes']
 assert meta.stdout.count('pixelWidth: 1672')==meta.stdout.count('pixelHeight: 941')==2 and 'format: png' in meta.stdout and 'format: jpeg' in meta.stdout and dest.read_bytes()[:3]==b'\xff\xd8\xff'
 asset={'rawPath':str(raw),'rawSha256':sha(raw),'destination':str(dest),'sha256':sha(dest),'manifestSha256':new['sha256'],'replaySha256':replaySha,'q92ReplayByteIdentical':True,'bytes':dest.stat().st_size,'canvas':new['canvas'],'format':'JPEG','quality':92,'promptPath':str(prompt),'promptSha256':sha(prompt),'replayCommand':cmd,'replayStdout':run.stdout,'replayStderr':run.stderr,'replayExit':run.returncode,'metadataCommand':metaCmd,'metadataStdout':meta.stdout}
for collection in (history,records):
 o=next(x for x in collection if x['id']=='memory-available');n=next(x for x in collection if x['id']=='memory-available-v2')
 assert o['selection']=='draft-superseded' and o['supersededBy']=='memory-available-v2' and n['selection']=='selected' and n['supersedes']=='memory-available'
assert sha(B/'FOCUS-DESIGN.json')==prior['manifests'][str(B/'FOCUS-DESIGN.json')]
for name,expected in prior['proof']['sourceSha256'].items():
 path=W/'docs/knowledge'/name if name=='D12-linux-terminal-basics.md' else B/name if name in ('Dockerfile','source-manifest.json') else B/'source-proof'/name
 assert sha(path)==expected
assert not list(B.rglob('*.png'))
report={'schema':'d12-image-memory-bounded-addendum-v1','checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'memory-available-v2 이미지의 IMG-M1 교정과 나머지15개 자산불변/한계보존만 재검수','specVerdict':'PASS','qualityVerdict':'PASS','counts':{'Critical':0,'Important':0,'Minor':0},'closedFinding':'IMG-M1','priorReportPreserved':str(B/'image-sol-review.json'),'priorReportSha256':sha(B/'image-sol-review.json'),'actualViewed':True,'viewEvidence':'tools.view_image(detail=original)로 선택된 memory-available-v2 JPEG 전체1672x941을 실제 열어 문장/명령/제목/아이콘/레이아웃/미실행 표시를 확인','correctedParagraph':'마운트된 파일시스템의 전체·사용·여유 공간을 확인합니다. tmpfs도 포함하며, 물리 디스크나 파티션의 크기와 같다고 볼 수 없습니다.','otherImageContentPreserved':{'title':'디스크 공간과 메모리 여유는 어떻게 구분하나요?','unrunBoundary':'원문 도구 설명 · free 실제 측정 없음','commands':['$ df -h','$ du -sh /경로','$ free -h'],'availableConcept':'회수 가능한 cache 등을 고려한 메모리 여유 추정. 단순 free 값만으로 메모리 부족을 단정하지 않음.','measurementBoundary':'디스크의 available과 메모리의 available은 측정 대상이 다름.','inventedMeasurementsAdded':False,'readability':'교정문장과나머지본문모두native크기읽힘','layout':'같은3열구조/available띠/하단경계유지; actualUIcrop은별도'},'asset':asset,'selectedCount':16,'otherSelectedImagesUnchanged':unchanged,'oldMemoryImagePreserved':{'path':old['destination'],'sha256':old['sha256AtView'],'status':'draft-superseded','selected':False},'generationHistory':{'count':len(history),'selected':sum(x.get('selection')=='selected' for x in history),'draftRejected':sum(x.get('selection')=='draft-rejected' for x in history),'draftSuperseded':sum(x.get('selection')=='draft-superseded' for x in history),'manifestReferences':{str(B/n):sha(B/n) for n in ('selected-images.json','image-records.json','image-generation-history.json','imagegen-memory-v2-result.json')}},'focusCoordinatesUnchanged':True,'uiCropVerified':False,'sourceProofAndDockerfileUnchanged':True,'dockerRerunPerformed':False,'repositoryPngFiles':0,'imagesOrImplementationEditedByReviewer':False,'commitCreated':False,'boundariesPreserved':prior['requiredUiBoundaries'][:-1],'fullDocumentComplete':False}
(O/'memory-v2-asset-check.json').write_text(json.dumps(asset,ensure_ascii=False,indent=2)+'\n')
(B/'image-sol-memory-addendum.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
md=['# D12 메모리 이미지 보충 검수','', '**PASS — Critical 0 / Important 0 / Minor 0.** IMG-M1을 실제 imagegen 교정 이미지에서 종결했다. 기존16개 WITH MINOR 보고서는 그대로 보존했다.','', '교정문장: '+report['correctedParagraph'],'', '선정된 memory-available-v2 JPG 전체를 실제 native크기로 열어 확인했다. free 미측정표시, df/du/free 구분, available의 회수가능cache추정, 단순free만으로부족단정금지, 디스크/메모리측정대상구분과 기존3열/하단구조가 유지됐다. 새측정값·PID·시각은 추가되지 않았다.','', '외부raw PNG→/tmp JPEGQ92 재변환SHA가 선정JPG `'+asset['sha256']+'`와 byte동일하다. raw/선정1672×941, format/bytes/manifest/prompt가 일치한다. 나머지15개 선정JPG의 해시는 기존16개 검수 때와 같다.','', '전체선정수는16이다. 구memory-available은이미지그대로보존하고draft-superseded로선정목록에서제외했다. 생성이력은19개(선정16/거절2/교체이전1)다. FOCUS45좌표와sourceproof/Dockerfile은변경없다. 실제UIcrop확인은여전히별도이며Docker를재실행하지않았다.','', '보충 보고: '+str(B/'image-sol-memory-addendum.json'),'', '교정 이미지: '+str(dest),'', 'Q92검증 원출력: '+str(O/'memory-v2-asset-check.json'),'', '기존보고: '+str(B/'image-sol-review.json'),'', '이미지·구현·proof·기존보고서를수정하거나커밋하지않았다.']
(B/'image-sol-memory-addendum.md').write_text('\n'.join(md)+'\n')
print('PASS C0 I0 M0; memory-v2 actually viewed; Q92 replay SHA equal; other15 unchanged; selected16/history19; focus/proof unchanged')
