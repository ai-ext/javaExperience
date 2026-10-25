import fs from 'node:fs';import cp from 'node:child_process';import {createRequire} from 'node:module';
const root=process.cwd(),site=root+'/tools/site',out=root+'/docs/design/d12-2026-10-25/mermaid-sol-logs/attempt2/';if(JSON.parse(fs.readFileSync(out+'03-spec-review.json')).specVerdict!=='PASS')throw Error('spec gate');const {build}=createRequire(site+'/package.json')('esbuild');const original=fs.readFileSync(site+'/d12-source-diagrams.mjs','utf8');
const mutants=[
 {id:'control'},
 {id:'zero-width-render',before:'rect?.width > 0',after:'true'},
 {id:'wrong-read-mode-boundary',before:"reader.dataset.krMode !== 'read'",after:"reader.dataset.krMode === 'read'"},
 {id:'no-nested-details-observer',before:"  for (const details of original.querySelectorAll('details')) {\n    visibilityTargets.add(details);\n    observer.observe(details, { attributes: true, attributeFilter: ['open'] });\n  }",after:''},
 {id:'no-singleflight-return',before:'if (running) { renderAgain = true; return; }',after:'if (running) { renderAgain = true; }'},
 {id:'wrong-raw-source-cache',before:'source: node.textContent,',after:"source: node.textContent + ' MUTANT',"},
 {id:'lost-raw-source-restore',before:'state.node.textContent = state.source;',after:"state.node.textContent = '';"},
 {id:'stale-processed-marker',before:"if (state.processedAttribute === null) state.node.removeAttribute('data-processed');",after:"if (state.processedAttribute === null) state.node.setAttribute('data-processed', 'true');"},
 {id:'stale-fast-return-accepted',before:'if (!sourceIsVisible(state.node) || startVersion !== visibilityVersion) {',after:'if (!sourceIsVisible(state.node)) {'},
 {id:'error-svg-counted-as-success',before:"if (hasRenderError(state.node)) throw new Error('Mermaid returned an error SVG.');",after:''},
 {id:'missing-error-fallback',before:'showError(state);',after:'removeError(state);'},
 {id:'failed-source-never-retries',before:'if (visible && relevantRecords.length && state.failed) {',after:'if (false) {'},
 {id:'duplicate-initialization',before:'if (initialized.has(reader)) return initialized.get(reader);',after:''},
 {id:'discard-completed-svg-on-hide',before:'if (state.inFlight) restoreSource(state);',after:'if (state.rendered || state.inFlight) restoreSource(state);'},
 {id:'dispose-not-invalidated',before:'disposed = true;',after:'disposed = false;'},
 {id:'unawaited-render',before:'await mermaid.run({ nodes: [state.node] });',after:'mermaid.run({ nodes: [state.node] });'},
 {id:'late-success-after-dispose',before:'          if (disposed) {\n            restoreSource(state);\n            removeError(state);\n            continue;\n          }',after:''},
 {id:'late-error-after-dispose',before:'          if (disposed) {\n            removeError(state);\n            continue;\n          }',after:''},
];
const results=[];for(const m of mutants){if(m.before&&!original.includes(m.before))throw Error('missing mutation anchor '+m.id);const source=m.before?original.replace(m.before,m.after):original;const bundled=await build({entryPoints:[site+'/test-d12-source-diagrams.mjs'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',logLevel:'silent',plugins:[{name:'reviewer-memory-only',setup(b){b.onLoad({filter:/d12-source-diagrams\.mjs$/},args=>args.path===site+'/d12-source-diagrams.mjs'?{contents:source,loader:'js',resolveDir:site}:undefined);}}]});const p=cp.spawnSync(process.execPath,['--input-type=module'],{cwd:site,input:bundled.outputFiles[0].text,encoding:'utf8',maxBuffer:5e6,timeout:10000});const result={id:m.id,exit:p.status,signal:p.signal,spawnError:p.error?.code||null,detected:m.id==='control'?p.status===0:p.status!==0,stdout:p.stdout,stderr:p.stderr,before:m.before,after:m.after};fs.writeFileSync(out+'mutant-'+m.id+'.json',JSON.stringify(result,null,2)+'\n');results.push(result);console.log(JSON.stringify({id:m.id,exit:p.status,detected:result.detected,spawnError:result.spawnError}));}
const summary={specGate:'PASS',controlPass:results[0].detected,mutants:results.length-1,killed:results.filter(r=>r.id!=='control'&&r.detected).length,survived:results.filter(r=>r.id!=='control'&&!r.detected).map(r=>r.id),assertionErrors:results.filter(r=>r.id!=='control'&&r.stderr.includes('AssertionError')).length,timeouts:results.filter(r=>r.spawnError==='ETIMEDOUT').map(r=>r.id),results:results.map(({id,exit,detected,spawnError})=>({id,exit,detected,spawnError}))};fs.writeFileSync(out+'04-mutation-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
