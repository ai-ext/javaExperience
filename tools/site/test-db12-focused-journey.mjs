import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDb12FocusedJourney } from './db12-focused-journey.mjs';

const root=new URL('../../',import.meta.url);
const source=fs.readFileSync(new URL('scenario/db-query-journey/db-12-join-exists-explain.md',root),'utf8');
const markup=renderDb12FocusedJourney(source);
assert.deepEqual([...markup.matchAll(/data-db12-panel="([^"]+)"/g)].map((match)=>match[1]),['scenario','contract','relation','like-join','like-exists','like-result','tag-scope','tag-join','tag-exists','tag-result','plans','conclusion']);
const first=markup.slice(markup.indexOf('data-db12-panel="scenario"'),markup.indexOf('data-db12-panel="contract"'));
assert.match(first,/만들 것/);
assert.match(first,/직접 할 것/);
assert.doesNotMatch(first,/LIMIT 21|EXPLAIN|R1 전체|tag.name|actual rows/);
const sql=[...source.matchAll(/```sql\n([\s\S]*?)\n```/g)].map((match)=>match[1]);
assert.equal(sql.length,5);
for(const snippet of sql)assert.ok(markup.includes(snippet.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')),'원문 SQL 다섯 블록을 정확히 보여야 한다');
for(const query of sql.slice(0,2)){
  for(const condition of ['l.member_id = 12',"p.status = 'PUBLISHED'","p.visibility = 'PUBLIC'",'p.deleted_at IS NULL','LIMIT 21;'])assert.ok(query.includes(condition));
}
assert.match(markup,/R1 전체 권한의 팔로워·차단·운영자 예외는 이 연습 쌍에 없습니다/);
assert.match(markup,/기존 M1 API에 tag 요청 파라미터가 있다고 가정하지 않습니다/);
assert.equal((markup.match(/data-db12-record="/g)||[]).length,12);
assert.equal((markup.match(/data-db12-copy="/g)||[]).length,9);
const built=fs.readFileSync(new URL('scenario/db-query-journey/db-12-join-exists-explain.html',root),'utf8');
for(const asset of ['first-db-journey.css','db12-focused-journey.css','db12-focused-journey.js'])assert.ok(built.includes(asset));
assert.equal((built.match(/data-db12-panel="/g)||[]).length,12);
assert.match(built,/class="db12-original"/);
assert.match(built,/AND p.visibility = 'PUBLIC'<\/code><\/pre>/);
console.log('DB-12 열두 장면·M3/M1 분리·원문 네 SELECT와 계획·결과 게이트 검사 통과');
