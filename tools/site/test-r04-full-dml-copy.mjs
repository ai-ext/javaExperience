import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import * as data from './r04-lesson-data.mjs';
import {renderR04Learning} from './r04-learning.mjs';
import {initR04Learning} from './r04-learning.js';

const root=new URL('../../',import.meta.url);
const source=fs.readFileSync(new URL('docs/design/r04-2026-10-20/source-proof/original/block-13.sql',root));
assert.equal(typeof data.R04_FULL_DML_TRANSACTION,'string','browser data module에 원문 SQL 상수가 있어야 한다');
const full=Buffer.from(data.R04_FULL_DML_TRANSACTION,'utf8');
assert.deepEqual(full,source,'전체 트랜잭션 문자열은 원문 SQL 바이트와 끝 개행까지 같아야 한다');
assert.ok(data.R04_FULL_DML_TRANSACTION.startsWith('START TRANSACTION;\n'));
assert.match(data.R04_FULL_DML_TRANSACTION,/ROLLBACK;\n\nSELECT id, stock FROM product WHERE id = 1;[\s\S]*SELECT COUNT\(\*\) member_coupon_rows FROM member_coupon WHERE id = 300;\n$/);
assert.match(data.R04_LESSONS.find(lesson=>lesson.id==='dml').sourceNote,/START TRANSACTION→ROLLBACK 중간 발췌/);
const bundle=fs.readFileSync(new URL('tools/site/r04-learning.bundle.js',root),'utf8');
assert.doesNotMatch(bundle,/node:fs|from ['"]fs['"]/,'브라우저 bundle에 Node fs가 들어가면 안 된다');

const dom=new JSDOM(renderR04Learning(),{url:'https://learn.example/docs/knowledge/R04-sql-crud-join.html'});
const {document:doc}=dom.window,win=dom.window;
const $=selector=>doc.querySelector(selector),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const writes=[];
Object.defineProperty(win.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{writes.push(text);}}});
initR04Learning(doc,win);
const topic=$('[data-r04-topic]'),fullButton=$('[data-r04-copy-full]'),regularButton=$('[data-r04-copy]');
assert.ok(fullButton,'전체 복사 버튼이 있어야 한다');
const choose=id=>{topic.value=id;topic.dispatchEvent(new win.Event('change'));};
choose('select');assert.equal(fullButton.hidden,true,'DML 질문 밖에서는 전체 복사 버튼을 숨긴다');
choose('dml');assert.equal(fullButton.hidden,false,'DML 질문에서는 전체 복사 버튼을 표시한다');
const currentStage=data.R04_LESSONS.find(lesson=>lesson.id==='dml').stages[0];
assert.equal($('[data-r04-code]').textContent,currentStage.code,'기본 코드는 현재 장면의 기존 발췌를 유지한다');
regularButton.click();await tick();assert.equal(writes.at(-1),currentStage.code,'일반 복사는 기존 장면 발췌만 복사한다');
fullButton.click();await tick();assert.equal(writes.at(-1),data.R04_FULL_DML_TRANSACTION,'전체 버튼은 block13 원문 전체를 복사한다');
assert.match($('[data-r04-copy-status]').textContent,/전체 트랜잭션.*복사했습니다/);

let rejectWrite;
win.navigator.clipboard.writeText=()=>new Promise((_,reject)=>{rejectWrite=reject;});
fullButton.click();rejectWrite(new Error('clipboard denied'));await tick();
assert.match($('[data-r04-copy-status]').textContent,/실패.*원문 전체.*직접 선택해 복사/);
assert.doesNotMatch($('[data-r04-copy-status]').textContent,/복사했습니다/);
assert.equal($('[data-r04-full-manual]').open,true,'복사 실패 뒤 전체 원문 수동 복사 영역을 연다');
assert.equal($('[data-r04-full-code]').textContent,data.R04_FULL_DML_TRANSACTION);

let resolveFull;
win.navigator.clipboard.writeText=()=>new Promise(resolve=>{resolveFull=resolve;});
choose('dml');fullButton.click();choose('select');resolveFull();await tick();
assert.equal($('[data-r04-copy-status]').textContent,'','이전 전체 복사 promise가 새 질문에 상태를 쓰면 안 된다');

let resolveRegular;
win.navigator.clipboard.writeText=()=>new Promise(resolve=>{resolveRegular=resolve;});
regularButton.click();choose('dml');resolveRegular();await tick();
assert.equal($('[data-r04-copy-status]').textContent,'','이전 일반 복사 promise도 새 질문에 상태를 쓰면 안 된다');
win.close();
console.log('R04 DML 전체 복사: 원문 byte·끝 개행, 일반 발췌 복사, 전체 복사, 실패 수동 안내, 두 handler 장면 전환 guard 통과');
