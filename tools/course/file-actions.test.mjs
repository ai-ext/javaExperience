import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as validator from './validate.mjs';

const roadmap = JSON.parse(fs.readFileSync(new URL('../../course/roadmap.json', import.meta.url), 'utf8'));
const step = (day, no) => roadmap.days.find(d => d.id === day).steps.find(s => s.no === no);
const file = (name, area) => `src/main/java/com/example/board/${area}/${name}.java`;

test('파일 동작은 모든 파일을 중복·누락 없이 새로 만들기/기존 수정/확인만으로 구분한다', () => {
  for (const day of roadmap.days) for (const s of day.steps) {
    assert.ok(s.fileActions, `${day.id}-${s.no}: fileActions 필요`);
    assert.deepEqual(Object.keys(s.fileActions).sort(), ['create', 'inspect', 'modify']);
    const all = Object.values(s.fileActions).flat();
    assert.equal(new Set(all).size, all.length, `${day.id}-${s.no}: 중복`);
    assert.deepEqual([...all].sort(), [...s.files].sort(), `${day.id}-${s.no}: 누락`);
  }
});

test('보고서에 남은 기존 통합 지점·Repository·신규 DTO를 작업 동작으로 찾는다', () => {
  const required = [
    ['D03',4,'modify','SecurityConfig','config'],
    ['D05',1,'modify','GlobalExceptionHandler','common'],
    ['D07',1,'modify','PostServiceImpl','post'],
    ['D08',5,'modify','ChargeService','payment'],
    ['D08',5,'modify','GlobalExceptionHandler','common'],
    ['D09',5,'modify','CommentService','comment'],
    ['D10',2,'modify','SecurityConfig','config'],
    ['D04',2,'create','TagRepository','post'],
    ['D07',1,'create','PointLedgerRepository','point'],
    ['D10',1,'create','ReportRepository','admin'],
    ['D10',3,'create','AuditLogRepository','admin'],
    ['D07',6,'create','OrderRequest','shop'],
    ['D07',6,'create','OrderResponse','shop'],
    ['D08',5,'create','PgCallbackRequest','payment'],
    ['D04',5,'inspect','GlobalExceptionHandler','common'],
  ];
  for (const [day,no,action,name,area] of required) assert.ok(step(day,no).fileActions?.[action].includes(file(name,area)), `${day}-${no} ${action} ${name}`);
});

test('트랜잭션 경계가 핵심인 순서의 완료 증거는 이유와 실패 결과를 요구한다', () => {
  for (const [day,no] of [['D05',6],['D07',1],['D07',4],['D07',6],['D08',3],['D08',5],['D09',3]]) {
    const done = step(day,no).done.join(' ');
    assert.match(done, /트랜잭션 경계.*이유/, `${day}-${no}`);
    assert.match(done, /실패.*(?:취소|rollback|롤백|유지)/, `${day}-${no}`);
  }
  assert.doesNotMatch(step('D04',3).done.join(' '), /트랜잭션 경계/);
});

test('날짜 목적과 D10 완성·별도 서버 인수인계가 명확하다', () => {
  for (const day of roadmap.days) assert.ok(day.purpose?.trim(), day.id);
  assert.match(roadmap.days.find(d=>d.id==='D06').purpose, /JPA.*쓰기.*MyBatis.*(?:목록|검색)/);
  assert.match(roadmap.days.find(d=>d.id==='D10').tomorrow, /1단계.*완성/);
  assert.match(roadmap.days.find(d=>d.id==='D10').tomorrow, /별도.*messy-server/);
});

test('검증기는 파일 동작의 누락·중복·미등록 파일·잘못된 배열을 거부한다', () => {
  assert.equal(typeof validator.validateFileActions, 'function');
  const check = actions => validator.validateFileActions(['Post.java'], actions, 'D04 step 1');
  assert.deepEqual(check({ create:['Post.java'],modify:[],inspect:[] }), []);
  for (const bad of [undefined, {create:[],modify:[],inspect:[]}, {create:['Post.java'],modify:['Post.java'],inspect:[]}, {create:['Post.java','Other.java'],modify:[],inspect:[]}, {create:'Post.java',modify:[],inspect:[]}]) {
    assert.ok(check(bad).length, JSON.stringify(bad));
  }
});

test('D08 PG 설정과 재시도는 기존 설정·호출 연결의 수정 지점을 포함한다', () => {
  for (const [no,name,area] of [[1,'BoardProperties','config'],[4,'PgClient','payment'],[4,'PgClientConfig','config'],[4,'ChargeService','payment']]) {
    assert.ok(step('D08',no).fileActions.modify.includes(file(name,area)), `D08-${no} 기존 수정 ${name}`);
  }
});
