import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const require = createRequire(root + '/tools/site/package.json');
const { JSDOM } = require('jsdom');
const { D11_LESSONS, D11_ASSETS } = await import(pathToFileURL(root + '/tools/site/d11-lesson-data.mjs'));
const { renderD11Learning } = await import(pathToFileURL(root + '/tools/site/d11-learning.mjs'));
const { initD11Learning } = await import(pathToFileURL(root + '/tools/site/d11-learning.js'));
const dom = new JSDOM(renderD11Learning(), { url: 'https://review.test/docs/knowledge/D11-web-security-basics.html' });
initD11Learning(dom.window.document, dom.window);
const $ = s => dom.window.document.querySelector(s);
const select = $('#d11-topic');
select.value = 'cors-requests'; select.dispatchEvent(new dom.window.Event('change'));
const cors = [];
for (const id of ['simple-blocked-read','preflight-denied','preflight-allowed','credential-wildcard']) {
  $(`[data-d11-stage="${id}"]`).click();
  const details = $('[data-d11-source-details]');
  const code = $('[data-d11-code]').textContent;
  cors.push({id, detailsOpen: details.open, displayedCode: code,
    visibleValues: $('[data-d11-state]').textContent,
    sourceHasResponseConditions: /Access-Control-Allow-(Origin|Headers|Methods|Credentials)/.test($('[data-d11-source-code]').textContent),
    displayedCodeHasResponseConditions: /Access-Control-Allow-(Origin|Headers|Methods|Credentials)/.test(code)});
}
const input = fs.readFileSync(root + '/tools/site/test-d11-learning.mjs','utf8');
const loop = input.slice(input.indexOf('for (const lesson of D11_LESSONS)', input.indexOf('const saved =')), input.indexOf('const racePromises'));
const matrix = D11_LESSONS.flatMap(l => l.stages.map(s => ({
  topic:l.id,id:s.id,values:s.values,bindParameters:s.bindParameters ?? null,
  codeKind:s.codeKind,active:s.active,image:D11_ASSETS[s.image].file,
  focus:D11_ASSETS[s.image].focus[s.id],sourceFragments:s.sourceFragments.map(({path,start,end})=>({path,start,end})),
  code:s.code,evidenceKind:s.evidenceKind,evidence:s.evidence,
})));
const result = {time:new Date().toISOString(),questionCount:D11_LESSONS.length,stageCount:matrix.length,
  cors, deniedAllowedCodeIdentical:cors[1].displayedCode===cors[2].displayedCode,
  harness:{allStateLoopHasCopy: /data-d11-copy/.test(loop), allStateLoopHasValueAssertions:/data-d11-state/.test(loop),
    allStateCodeExpectation:'stage.code (product data itself)',
    copyPayloadAssertion:'lines 206-207 only other-unscoped; race tests check messages/selection but not all38 payloads',
    abaPath:'own-order → other-unscoped → other-scoped → other-unscoped; does not return to original A'},
  matrix};
fs.writeFileSync(root+'/docs/design/d11-2026-10-25/ui-sol-logs/attempt1/01-spec-observations.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({questionCount:result.questionCount,stageCount:result.stageCount,cors:result.cors,deniedAllowedCodeIdentical:result.deniedAllowedCodeIdentical,harness:result.harness},null,2));
