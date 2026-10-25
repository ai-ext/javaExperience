from pathlib import Path
import subprocess,json,hashlib,datetime
root=Path.cwd(); out=root/'docs/design/concept-cycle-2026-10-22/repairs/priority/sol-logs'; sha=lambda b:hashlib.sha256(b).hexdigest(); baseline='4b0493af52b1a06decca909d6bf9a8b6f9610686'
p=json.loads((root/'docs/design/concept-learning-night-2026-10-20/preservation-baseline.json').read_text());results={}
for key in ['documents','learnerServer']:
 entries={e['path']:e['sha256'] for e in p[key]} if isinstance(p[key],list) else p[key]; results[key]={'count':len(entries),'mismatches':[],'currentSHA256':{}}
 for path,expected in entries.items():
  actual=sha((root/path).read_bytes()); results[key]['currentSHA256'][path]=actual
  if actual!=expected:results[key]['mismatches'].append({'path':path,'expected':expected,'actual':actual})
audit=json.loads((root/'docs/design/concept-cycle-2026-10-22/infrastructure/audit-baseline.json').read_text()); results['audit24']={'count':len(audit['inputs']),'mismatches':[]}
for x in audit['inputs']:
 actual=sha((root/x['file']).read_bytes())
 if actual!=x['sha256']:results['audit24']['mismatches'].append({'path':x['file'],'expected':x['sha256'],'actual':actual})
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',baseline,'docs/design/r03-2026-10-20','docs/design/r04-2026-10-20','docs/design/d06-2026-10-21','docs/knowledge','src'],text=True).splitlines(); chosen=[s for s in paths if s.startswith(('docs/design/r03-','docs/design/r04-','docs/design/d06-','src/')) or s.endswith('.md')]; mismatches=[]
for path in chosen:
 expected=subprocess.check_output(['git','show',baseline+':'+path]); actual=(root/path).read_bytes()
 if sha(expected)!=sha(actual):mismatches.append(path)
results['baselineTrackedProtected']={'baselineHEAD':baseline,'filesChecked':len(chosen),'mismatches':mismatches}
results['checkedAtUTC']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'preservation.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps({k:{x:y for x,y in v.items() if x!='currentSHA256'} if isinstance(v,dict) else v for k,v in results.items()},indent=2))
assert all(not v['mismatches'] for v in results.values() if isinstance(v,dict))
