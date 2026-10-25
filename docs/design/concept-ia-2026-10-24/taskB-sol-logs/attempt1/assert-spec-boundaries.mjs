import assert from 'node:assert/strict';
import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync(new URL('./spec-probe.json',import.meta.url),'utf8'));
let failures=0;
const check=(name,fn)=>{try{fn();console.log('PASS '+name);}catch(error){failures++;console.log('FAIL '+name+': '+error.message);}};
for(const key of ['P09-java-syntax-basics','J01-types-string','S09-jpa-hibernate','W11-why-tx-in-service']){
 const chapters=p[key].specialChapters;
 check(key+' Q&A 질문 노출 및 답 접힘',()=>{const qa=chapters.find(x=>/자가점검/.test(x.label));assert.ok(qa.open);assert.ok(qa.topics.length>0);assert.ok(qa.topics.every(x=>x.open===false),'Q&A 질문 topic의 답이 자동으로 펼쳐짐');});
 check(key+' 참고문헌 접힘',()=>assert.equal(chapters.find(x=>/참고문헌/.test(x.label)).open,false));
}
check('새 title wrapper는 기존 ID를 중복하지 않음',()=>assert.deepEqual(p['P09-java-syntax-basics'].newDuplicateIds,[]));
check('hash 없는 읽기 모드 전환은 읽기 제목에 focus',()=>assert.match(p.modeFocus.actual,/class="kr-reading-title"/));
console.log(JSON.stringify({checks:10,failures}));
process.exitCode=failures?1:0;
