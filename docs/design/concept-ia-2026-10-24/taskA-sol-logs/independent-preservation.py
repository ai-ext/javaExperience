import hashlib,json,pathlib,re,subprocess
root=pathlib.Path.cwd(); out=root/'docs/design/concept-ia-2026-10-24/taskA-sol-logs'
paths=[p for p in subprocess.check_output(['git','ls-files','-z']).decode().split('\0') if p]
baseline=json.loads((root/'docs/design/concept-ia-2026-10-24/source-baseline.json').read_text())
expected={p['file'] for p in baseline['pages']}|{'README.html'}
changed=[]; mismatches=[]; nontarget=[]
for p in paths:
 if not p.endswith('.html'): continue
 old=subprocess.check_output(['git','show','HEAD:'+p]); current=(root/p).read_bytes()
 if current==old: continue
 changed.append(p)
 if p not in expected: nontarget.append(p)
 normalized=current.replace(b' data-theme="dark"',b'').replace(b' data-concept-surface="dark"',b'')
 normalized=re.sub(rb'<link rel="stylesheet" href="[^"]*tools/site/knowledge-dark\.css\?v=[0-9a-f]{12}">',b'',normalized)
 if normalized!=old: mismatches.append(p)
css_digest=hashlib.sha256((root/'tools/site/knowledge-dark.css').read_bytes()).hexdigest()[:12]
wrong_digest=[p for p in expected if ('knowledge-dark.css?v='+css_digest) not in (root/p).read_text()]
source_paths=[p for p in paths if p.startswith('docs/knowledge/') and p.endswith('.md')]
source_changes=[p for p in source_paths if (root/p).read_bytes()!=subprocess.check_output(['git','show','HEAD:'+p])]
server_paths=[p for p in paths if p.startswith('src/')]
server_changes=[p for p in server_paths if (root/p).read_bytes()!=subprocess.check_output(['git','show','HEAD:'+p])]
result={'head':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'logical_pages':len(baseline['pages']),'expected_physical_html':len(expected),'changed_html':len(changed),'changes_match_target_set':set(changed)==expected,'non_target_changes':nontarget,'normalized_byte_mismatches':mismatches,'css_digest':css_digest,'stale_css_hrefs':wrong_digest,'knowledge_markdown_count':len(source_paths),'knowledge_markdown_changed':source_changes,'server_src_count':len(server_paths),'server_src_changed':server_changes,'readme_alias_same_bytes_as_index':(root/'README.html').read_bytes()==(root/'index.html').read_bytes()}
(out/'independent-preservation.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
