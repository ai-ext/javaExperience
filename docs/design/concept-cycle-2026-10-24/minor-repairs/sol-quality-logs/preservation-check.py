import datetime,hashlib,json,pathlib,subprocess
root=pathlib.Path('/Users/ds/code/javaExperience/.worktrees/concept-learning-night');base=json.loads((root/'docs/design/concept-cycle-2026-10-24/baseline.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
report={'checkedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'HEAD':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()}
for key in ['preexistingDirty','historicalProofFiles','initial24Reviews']:
 rows=base[key];mismatch=[]
 for file,expected in rows.items():
  path=root/file
  if not path.exists() or sha(path.read_bytes())!=expected:mismatch.append(file)
 report[key]={'files':len(rows),'mismatches':mismatch}
for name,prefix,suffix in [('sourceMarkdown','docs/knowledge','.md'),('serverSource','src',None)]:
 files=subprocess.check_output(['git','ls-files',prefix],cwd=root,text=True).splitlines();files=[f for f in files if suffix is None or f.endswith(suffix)];mismatch=[]
 for file in files:
  if sha((root/file).read_bytes())!=sha(subprocess.check_output(['git','show','HEAD:'+file],cwd=root)):mismatch.append(file)
 report[name]={'files':len(files),'mismatches':mismatch}
(root/'docs/design/concept-cycle-2026-10-24/minor-repairs/sol-quality-logs/preservation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
