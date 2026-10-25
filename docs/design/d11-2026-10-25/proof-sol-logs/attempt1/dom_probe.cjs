const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const jsdomPackage = path.join(root,'tools/site/node_modules/jsdom');
const {JSDOM} = require(jsdomPackage);
const out = path.join(root,'docs/design/d11-2026-10-25/proof-sol-logs/attempt1');
const html = fs.readFileSync(path.join(out,'fixture-page.html'),'utf8');
const expected = JSON.parse(fs.readFileSync(path.join(out,'02-quality-expected.json'),'utf8')).expected;
const requests=[];
let activeCase=''; let runBehavior='success';
const dom = new JSDOM(html, { url:'http://127.0.0.1:12345/', runScripts:'dangerously', beforeParse(window) {
 window.fetch=async (url,options={})=>{
  requests.push({url:String(url),options});
  if (String(url).includes('/observations')) return {json:async()=>({case:activeCase,optionsCount:17,postCount:19,events:[{method:'reviewer-marker'}]})};
  if(runBehavior==='failure')throw new window.TypeError('reviewer controlled rejection');
  return {status:201,text:async()=>`reviewer controlled body ${activeCase}`};
 };
}});
const d=dom.window.document;
const observations=[];
for(const [id,key] of [['dom-text-content','text'],['dom-inner-html','markup']]){
 d.getElementById(id).click();
 const actual=JSON.parse(d.getElementById('dom-result').textContent);
 for(const k of Object.keys(expected.DOM[key]))assert.deepEqual(actual[k],expected.DOM[key][k]);
 observations.push(actual);
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const fetchResults=[];
 for(const c of ['simple-blocked-read','preflight-denied','preflight-allowed','wildcard-credentials']){
  for(const behavior of ['success','failure']){
   activeCase=c;runBehavior=behavior;
   const start=requests.length;
   d.getElementById('case-'+c).click();
   for(let i=0;i<5;i++)await tick();
   const result=JSON.parse(d.getElementById('case-result').textContent);
   assert.equal(result.serverObservation.optionsCount,17);
   assert.equal(result.serverObservation.postCount,19);
   assert.equal(result.fetch.ok,behavior==='success');
   assert.equal(result.observedBody,c==='preflight-allowed'&&behavior==='success'?`reviewer controlled body ${c}`:null);
   if(behavior==='success')assert.equal(result.fetch.status,201);
   else assert.match(result.fetch.errorLabel,/TypeError/);
   const calls=requests.slice(start);assert.equal(calls.length,3);
   assert.match(calls[0].url,/reset=1/);assert.match(calls[1].url,/\/case\//);assert.match(calls[2].url,/\/observations\?/);
   assert.equal(new URL(calls[1].url).searchParams.get('run'),result.run);
   assert.equal(calls[1].options.credentials,c==='wildcard-credentials'?'include':'omit');
   fetchResults.push({case:c,behavior,result,calls});
  }
 }
 assert.equal(new Set(fetchResults.map(x=>x.result.run)).size,8);
 fs.writeFileSync(path.join(out,'07-dom-and-js-dataflow.json'),JSON.stringify({verdict:'PASS',runtime:{node:process.version,jsdom:require(path.join(jsdomPackage,'package.json')).version},domObservations:observations,fetchResults,scope:'JSDOM actual fixed safe DOM parsing and controlled mock dataflow only; mocks are labelled; browser CORS enforcement NOT tested'},null,2)+'\n');
 dom.window.close();console.log(JSON.stringify({verdict:'PASS',domCases:2,mockDataflowCases:8,uniqueNonces:8}));
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
