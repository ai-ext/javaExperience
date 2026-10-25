import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root=process.cwd(), out=root+'/docs/design/d11-2026-10-25/ui-sol-logs/attempt3/';
const { JSDOM }=createRequire(root+'/tools/site/package.json')('jsdom');
const { renderD11Learning }=await import(pathToFileURL(root+'/tools/site/d11-learning.mjs'));
const { initD11Learning }=await import(pathToFileURL(root+'/tools/site/d11-learning.js'));
const dom=new JSDOM(renderD11Learning(),{url:'https://review.test/docs/knowledge/D11-web-security-basics.html'});
initD11Learning(dom.window.document,dom.window);
const $=s=>dom.window.document.querySelector(s);
$('#d11-topic').value='cors-requests';$('#d11-topic').dispatchEvent(new dom.window.Event('change'));
const observations=[];
for(const id of ['simple-blocked-read','preflight-denied','preflight-allowed','credential-wildcard']){
 $(`[data-d11-stage="${id}"]`).click();
 const code=$('[data-d11-code]').textContent,values=$('[data-d11-state]').textContent;
 assert.equal($('[data-d11-source-details]').open,false);
 if(id==='simple-blocked-read'){assert.match(code,/send_json\(200, response\)/);assert.match(values,/allow_origin 미지정/);}
 if(id==='preflight-denied'){assert.match(code,/case_name == "preflight-allowed" and self.headers.get\("Origin"\) == PAGE_ORIGIN/);assert.match(values,/false/);assert.match(values,/Allow-\* 설정없음/);}
 if(id==='preflight-allowed'){assert.match(code,/Access-Control-Allow-Origin.*Access-Control-Allow-Methods.*POST.*Access-Control-Allow-Headers.*content-type,x-d11-probe/s);}
 if(id==='credential-wildcard'){assert.match(code,/wildcard=True, credentials=True/);assert.match(values,/API source ACAO\*API source ACACtrue/);}
 observations.push({id,code,values,label:$('[data-d11-code-kind]').textContent,detailsOpen:false});
}
const test=fs.readFileSync(root+'/tools/site/test-d11-learning.mjs','utf8');
for(const token of ['expectedValues','expectedBinds','expectedFragments','expectedCodeKinds','expectedEvidenceKinds','expectedPayload(stage.id)','renderedPairs(root)','copy payload','expectedCodeKindLabels','rendered source label','rendered evidence label'])assert.ok(test.includes(token),token);
const findings={specVerdict:'PASS',time:new Date().toISOString(),counts:{C:0,I:0,M:0},resolved:['D11-UI-I1','D11-UI-I2','D11-UI-Q1'],observations,
 scope:'기존 attempt1 FAIL 이후 두 지적과 수정 영향·명세를 대조. quality 실행 전 기록. 실제 PC 수용 제외.'};
fs.writeFileSync(out+'01-spec-review.json',JSON.stringify(findings,null,2)+'\n');console.log(JSON.stringify({spec:findings.specVerdict,counts:findings.counts}));
