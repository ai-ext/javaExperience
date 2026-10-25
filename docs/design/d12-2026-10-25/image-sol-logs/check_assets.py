import datetime,hashlib,json,pathlib,subprocess,tempfile
B=pathlib.Path(__file__).resolve().parent.parent;W=B.parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
selected=json.loads((B/'selected-images.json').read_text());history=json.loads((B/'image-generation-history.json').read_text())
results=[]
for item in selected:
 raw=pathlib.Path(item.get('rawPath',item['rawImage']));dest=W/item['destination'];prompt=W/item['prompt']
 assert raw.is_file() and dest.is_file() and prompt.is_file()
 with tempfile.TemporaryDirectory(prefix='d12-image-replay-',dir='/tmp') as tmp:
  replay=pathlib.Path(tmp)/'replay.jpg'
  cmd=['sips','-s','format','jpeg','-s','formatOptions','92',str(raw),'--out',str(replay)]
  p=subprocess.run(cmd,capture_output=True,text=True,check=True)
  metaCmd=['sips','-g','format','-g','pixelWidth','-g','pixelHeight',str(raw),str(dest)]
  meta=subprocess.run(metaCmd,capture_output=True,text=True,check=True)
  r={'id':item['id'],'rawPath':str(raw),'rawSha256':sha(raw),'destination':str(dest),'destinationSha256':sha(dest),'manifestSha256':item['sha256'],'bytes':dest.stat().st_size,'manifestBytes':item['bytes'],'nativeCanvas':item['canvas'],'manifestFormat':item['format'],'replaySha256':sha(replay),'q92ReplayByteIdentical':sha(replay)==sha(dest),'replayCommand':cmd,'replayExit':p.returncode,'replayStdout':p.stdout,'replayStderr':p.stderr,'metadataCommand':metaCmd,'metadataStdout':meta.stdout,'formatSignatureHex':dest.read_bytes()[:3].hex(),'promptPath':str(prompt),'promptSha256':sha(prompt)}
  assert r['destinationSha256']==r['manifestSha256']==r['replaySha256'] and r['bytes']==r['manifestBytes'] and dest.read_bytes()[:3]==b'\xff\xd8\xff'
  assert 'format: png' in meta.stdout and 'format: jpeg' in meta.stdout and meta.stdout.count('pixelWidth: 1672')==2 and meta.stdout.count('pixelHeight: 941')==2
  results.append(r)
report={'schema':'d12-image-asset-verification-v1','checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'selectedCount':len(selected),'manifestSha256':sha(B/'selected-images.json'),'historySha256':sha(B/'image-generation-history.json'),'results':results,'rejectedDrafts':[{'id':x['id'],'destination':str(W/x['destination']),'sha256':sha(W/x['destination']),'reason':x.get('rejectionReason',x.get('selectionReason')),'inSelectedManifest':any(y['id']==x['id'] for y in selected)} for x in history if x.get('selection')=='draft-rejected']}
for x in report['rejectedDrafts']:assert not x['inSelectedManifest']
out=B/'image-sol-logs'/f"assets-{len(selected)}-selected.json";out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'count':len(results),'allQ92ReplayIdentical':all(x['q92ReplayByteIdentical'] for x in results),'allNative1672x941':True,'rejectedExcluded':len(report['rejectedDrafts']),'report':str(out)}))
