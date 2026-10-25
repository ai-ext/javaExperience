import fs from 'node:fs';
import cp from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),site=root+'/tools/site',out=root+'/docs/design/d12-2026-10-25/ui-sol-logs/attempt2/';
if(JSON.parse(fs.readFileSync(out+'01-spec-review.json')).specVerdict!=='PASS')throw Error('spec gate must PASS first');
const {build}=createRequire(site+'/package.json')('esbuild');
const sources={data:fs.readFileSync(site+'/d12-lesson-data.mjs','utf8'),controller:fs.readFileSync(site+'/d12-learning.js','utf8')};
const mutants=[
 {id:'control',kind:'control'},
 {id:'wrong-rendered-code-kind-label',kind:'controller',before:"'additional-linux-bash': '추가 Linux · Bash 실제 관측 · 실제 argv[-1]'",after:"'additional-linux-bash': '원문 Bash 실제 실행'"},
 {id:'wrong-evidence-kind',kind:'data',before:"evidenceKind: '실제 Linux · Bash 실제 관측'",after:"evidenceKind: '원문 Bash 실제 실행'"},
 {id:'wrong-observed-port',kind:'data',before:"['ephemeral port', String(network.ephemeral_port)]",after:"['ephemeral port', String(network.ephemeral_port + 1)]"},
 {id:'wrong-file-mode-value',kind:'data',before:"['파일 mode', '0444']",after:"['파일 mode', '0777']"},
 {id:'wrong-prose-kind',kind:'data',before:"codeKind: 'original-prose', evidenceKind: '원문 산문 · 실행 코드 아님'",after:"codeKind: 'explanatory-model', evidenceKind: '원문 산문 · 실행 코드 아님'"},
 {id:'wrong-rendered-image-src',kind:'controller',before:'image.src = assetRoot + asset.file;',after:"image.src = assetRoot + asset.file.replace('images/', '');"},
 {id:'wrong-asset-root-path',kind:'data',before:"export const d12AssetRoot = '../design/d12-2026-10-25/';",after:"export const d12AssetRoot = '../design/wrong/';"},
 {id:'wrong-source-range',kind:'data',before:"obs('environment_path_cd').cd_builtin, [92, 110]",after:"obs('environment_path_cd').cd_builtin, [93, 110]"},
 {id:'wrong-rendered-source-label',kind:'controller',before:"element('a', `${fragment.path}:${fragment.start}-${fragment.end}`)",after:"element('a', `WRONG_SOURCE:${fragment.start}-${fragment.end}`)"},
 {id:'wrong-rendered-source-content',kind:'controller',before:"element('code', fragment.content)",after:"element('code', 'WRONG_SOURCE_CONTENT')"},
 {id:'missing-focus-coordinate',kind:'data',before:'D12_ASSETS[imageId].focus[id] = focus;',after:"if (id !== 'terminal-shell') D12_ASSETS[imageId].focus[id] = focus;"},
 {id:'wrong-learning-lead',kind:'data',before:'state.lead = leadDesign.states[state.id];',after:"state.lead = leadDesign.states[state.id] + ' MUTANT';"},
 {id:'missing-copy-generation-success-guard',kind:'controller',before:'request === copyRequestId && currentGeneration === generation',after:'request === copyRequestId'},
 {id:'missing-copy-request-success-guard',kind:'controller',before:'request === copyRequestId && currentGeneration === generation',after:'currentGeneration === generation'},
 {id:'missing-copy-request-failure-guard',kind:'controller',before:'if (request !== copyRequestId || currentGeneration !== generation) return;',after:'if (currentGeneration !== generation) return;'},
 {id:'missing-copy-generation-failure-guard',kind:'controller',before:'if (request !== copyRequestId || currentGeneration !== generation) return;',after:'if (request !== copyRequestId) return;'},
 {id:'wrong-copied-code-payload',kind:'controller',before:'await win.navigator.clipboard.writeText(payload);',after:"await win.navigator.clipboard.writeText(payload + ' MUTANT');"},
 {id:'wrong-prose-fallback-selection',kind:'controller',before:"const selectedContent = lesson.stages[index].codeKind === 'original-prose' ? $('[data-d12-prose]') : $('[data-d12-code]');",after:"const selectedContent = $('[data-d12-code]');"},
];
const results=[];
for(const m of mutants.filter(x=>x.kind==='control'||['wrong-rendered-source-label','wrong-rendered-source-content','missing-copy-request-success-guard','missing-copy-generation-failure-guard','wrong-prose-fallback-selection'].includes(x.id))){let text=sources[m.kind];if(m.kind!=='control'){if(!text.includes(m.before))throw Error('mutation anchor unavailable: '+m.id);text=text.replace(m.before,m.after);}
 const b=await build({entryPoints:[out+'04-quality-independent-probe.mjs'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',logLevel:'silent',define:{'import.meta.url':JSON.stringify(pathToFileURL(site+'/test-d12-learning.mjs').href)},plugins:[{name:'reviewer-memory-only',setup(b){b.onLoad({filter:/d12-(?:lesson-data\.mjs|learning\.js)$/},args=>{if((m.kind==='data'&&args.path===site+'/d12-lesson-data.mjs')||(m.kind==='controller'&&args.path===site+'/d12-learning.js'))return{contents:text,loader:'js',resolveDir:site};});}}]});
 const p=cp.spawnSync(process.execPath,['--input-type=module'],{cwd:root,input:b.outputFiles[0].text,encoding:'utf8',maxBuffer:5e6});
 const result={id:m.id,kind:m.kind,exit:p.status,detected:m.kind==='control'?p.status===0:p.status!==0,stdout:p.stdout,stderr:p.stderr,before:m.before,after:m.after};fs.writeFileSync(out+'independent-mutant-'+m.id+'.json',JSON.stringify(result,null,2)+'\n');results.push(result);console.log(JSON.stringify({id:m.id,exit:p.status,detected:result.detected}));
}
const summary={specGate:'PASS',controlPass:results[0].detected,mutantCount:results.length-1,killed:results.filter(x=>x.kind!=='control'&&x.detected).length,survived:results.filter(x=>x.kind!=='control'&&!x.detected).map(x=>x.id),results:results.map(({id,exit,detected})=>({id,exit,detected}))};fs.writeFileSync(out+'05-independent-mutation-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
