import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {FUNCTIONAL_TASKS} from './functional-scenario-data.mjs';
import {FUNCTIONAL_LIKE_TASKS} from './functional-like-data.mjs';
import {renderFunctionalWorkspace} from './functional-scenario.mjs';
import {renderFunctionalLikeWorkspace} from './functional-like-workspace.mjs';

test('7개 과제의 수동 DB 확인에서 실제 정밀도를 조회하고 원래 응답·완료 판정을 유지한다',()=>{
  for(const task of [...FUNCTIONAL_TASKS,...FUNCTIONAL_LIKE_TASKS]) {
    const html=task.group==='like'?renderFunctionalLikeWorkspace({task}):renderFunctionalWorkspace({task});
    const dom=new JSDOM(html);const d=dom.window.document;
    const note=d.querySelector('[data-fw-time-precision]');
    assert.ok(note,task.id+': 시각 비교 기준이 필요함');
    assert.equal(d.querySelectorAll('[data-fw-time-precision]').length,1);
    assert.ok(note.closest('.fw-db-check'));
    assert.equal(note.closest('form'),null);
    const intro=note.querySelector('p');assert.equal(intro.closest('details'),null);
    assert.match(intro.textContent,/같은 글 id/);
    assert.match(intro.textContent,/다를 수 있습니다/);
    const sql=note.querySelector('details pre code').textContent;
    assert.match(sql,/TABLE_SCHEMA = DATABASE\(\)/);
    assert.match(sql,/TABLE_NAME = 'post'/);
    assert.match(sql,/DATETIME_PRECISION/);
    assert.match(sql,/@@session.sql_mode/);
    assert.doesNotMatch(sql,/\b(?:UPDATE|DELETE|INSERT|ALTER|DROP)\b/i);
    assert.match(note.textContent,/요청 전후/);
    assert.match(note.textContent,/통과 처리하지 않습니다/);
    assert.equal(d.querySelector('[data-fw-status]').textContent,'미실행');
    assert.equal(d.querySelectorAll('[data-fw-check]:checked').length,0);
    dom.window.close();
  }
});
