import fs from 'node:fs';
import cp from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root=process.cwd(),site=root+'/tools/site',out=root+'/docs/design/d11-2026-10-25/ui-sol-logs/addendum1/';
const { build }=createRequire(site+'/package.json')('esbuild');
const source={data:fs.readFileSync(site+'/d11-lesson-data.mjs','utf8'),controller:fs.readFileSync(site+'/d11-learning.js','utf8')};
const mutants=[
 {id:'control',kind:'control'},
 {id:'wrong-own-result-owner',kind:'data',before:"['결과 행', '1002 · owner 7']",after:"['결과 행', '1002 · owner 8']"},
 {id:'wrong-bind-owner',kind:'data',before:'bindParameters: [1003, 7]',after:'bindParameters: [1003, 8]'},
 {id:'denied-header-condition-true',kind:'data',before:'case_name == preflight-allowed · false',after:'case_name == preflight-allowed · true'},
 {id:'wrong-source-range',kind:'data',before:"]], 153, 157, '원문 Java",after:"]], 154, 158, '원문 Java"},
 {id:'wrong-native-evidence-kind',kind:'data',before:"codeKind: 'additional-sqlite', evidenceKind: '추가 Python·SQLite 실제 관측'",after:"codeKind: 'additional-sqlite', evidenceKind: 'Spring Security 실제 실행'"},
 {id:'wrong-rendered-source-label',kind:'controller',before:"return 'Python fixture 서버 응답 조건 · Chrome 결과 별도';",after:"return '원문 Spring Security Java 실제 실행';"},
 {id:'missing-generation-guard',kind:'controller',before:'request === copyRequestId && generation === renderGeneration',after:'request === copyRequestId'},
 {id:'missing-request-guard-success',kind:'controller',before:'request === copyRequestId && generation === renderGeneration',after:'generation === renderGeneration'},
 {id:'missing-request-guard-rejection',kind:'controller',before:'if (request !== copyRequestId || generation !== renderGeneration) return;',after:'if (generation !== renderGeneration) return;'},
];
mutants.push(
 {id:'chain-java-fence-regression',kind:'data',before:"]], 184, 197, '원문 설정",after:"]], 183, 197, '원문 설정"},
 {id:'HSTS-host-model-regression',kind:'data',before:'http://learn.example.test',after:'http://reserved.test'},
 {id:'CORS-allow-label-regression',kind:'data',before:'허용 메서드(Allow-Methods)',after:'API response method'},
 {id:'cookie-focus-regression',kind:'data',before:'const py =',after:"D11_ASSETS['csrf-credentials-v2'].focus['cookie-token'] = [1,56,98,24];\nconst py ="}
);
const results=[];
for(const m of mutants){
 let changed=source[m.kind];
 if(m.kind!=='control'){
  if(!changed.includes(m.before))throw new Error('mutation anchor unavailable: '+m.id);
  changed=changed.replace(m.before,m.after);
 }
 const bundled=await build({entryPoints:[site+'/test-d11-learning.mjs'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',logLevel:'silent',define:{'import.meta.url':JSON.stringify(pathToFileURL(site+'/test-d11-learning.mjs').href)},plugins:[{name:'reviewer-memory-only',setup(b){b.onLoad({filter:/d11-(?:lesson-data\.mjs|learning\.js)$/},args=>{
   if(m.kind==='data'&&args.path===site+'/d11-lesson-data.mjs')return{contents:changed,loader:'js',resolveDir:site};
   if(m.kind==='controller'&&args.path===site+'/d11-learning.js')return{contents:changed,loader:'js',resolveDir:site};
  });}}]});
 const run=cp.spawnSync(process.execPath,['--input-type=module'],{cwd:site,input:bundled.outputFiles[0].text,encoding:'utf8',maxBuffer:5e6});
 const result={id:m.id,kind:m.kind,exit:run.status,detected:m.kind==='control'?run.status===0:run.status!==0,stdout:run.stdout,stderr:run.stderr,before:m.before,after:m.after};
 fs.writeFileSync(out+'mutant-'+m.id+'.json',JSON.stringify(result,null,2)+'\n');results.push(result);
 console.log(JSON.stringify({id:m.id,exit:result.exit,detected:result.detected}));
}
const builder=fs.readFileSync(site+'/build.mjs','utf8');
const headBuilder=cp.execFileSync('git',['show','HEAD:tools/site/build.mjs'],{cwd:root,encoding:'utf8'});
const w15=s=>s.match(/: isW15 \?[^\n]*?(?= : isR04 \?)/)?.[0];
const range={id:'existing-W15-literal-regression',kind:'reviewer-independent-scope-check',currentMatchesHEAD:w15(builder)===w15(headBuilder),mutantDetected:w15(builder.replace('기존 전체 페이지네이션 개념 지도 보기 · 추가 실측과 구분','기존 전체 페이지네이션 개념 지도 보기 · 추가 실행 실측과 구분'))!==w15(headBuilder)};
fs.writeFileSync(out+'03-range-regression.json',JSON.stringify(range,null,2)+'\n');
const summary={time:new Date().toISOString(),specGate:JSON.parse(fs.readFileSync(out+'01-spec-review.json','utf8')).specVerdict,controlPass:results[0].detected,mutants:results.slice(1).map(({id,detected,exit})=>({id,detected,exit})),survived:results.filter(r=>r.kind!=='control'&&!r.detected).map(r=>r.id),range};
fs.writeFileSync(out+'02-quality-mutation-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({summary}));
