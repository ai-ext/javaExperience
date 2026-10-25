import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { FUNCTIONAL_TASKS } from './functional-scenario-data.mjs';
import { FUNCTIONAL_DB_CHECKS, FUNCTIONAL_LIST_CHECK_WHERE } from './functional-verification-data.mjs';
import { renderFunctionalWorkspace } from './functional-scenario.mjs';

for (const task of FUNCTIONAL_TASKS) {
  assert.deepEqual(task.expected.dbChecks, FUNCTIONAL_DB_CHECKS[task.id], `${task.id}: 설명과 조회용 SQL을 분리`);
  for (const item of task.expected.dbChecks) {
    assert.ok(item.label && item.compare);
    assert.match(item.sql, /^SELECT\b/);
    assert.doesNotMatch(item.sql, /\b(?:INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE)\b/i, 'DB 확인은 조회만 제공');
    assert.equal(item.sql.split(';').filter(x => x.trim()).length, 1, '예시 하나는 조회 한 문장');
  }
  assert.ok(task.completion.every(item => item.verification?.trim()), `${task.id}: 자기확인에 판단 방법 제공`);
  const dom = new JSDOM(renderFunctionalWorkspace({ task }));
  const d = dom.window.document;
  const examples = [...d.querySelectorAll('.fw-db-example')];
  assert.equal(examples.length, task.expected.dbChecks.length);
  for (const [index, example] of examples.entries()) {
    assert.equal(example.querySelector('pre code').textContent, task.expected.dbChecks[index].sql);
    assert.equal(example.querySelector('h4').textContent, task.expected.dbChecks[index].label);
    assert.ok(example.textContent.includes(task.expected.dbChecks[index].compare));
  }
  assert.equal(d.querySelectorAll('.fw-check-guide').length, task.completion.length);
  assert.match(d.querySelector('.fw-expected').textContent, /보낸 값|입력값/);
  assert.match(d.querySelector('.fw-db-check').textContent, /viewerId|capturedId/);
  dom.window.close();
}

const list = FUNCTIONAL_DB_CHECKS.list;
assert.ok(list[0].sql.includes(FUNCTIONAL_LIST_CHECK_WHERE));
assert.ok(list[1].sql.includes(FUNCTIONAL_LIST_CHECK_WHERE));
assert.match(list[0].sql, /^SELECT COUNT\(\*\)/);
assert.doesNotMatch(list[0].sql, /LIMIT|OFFSET/);
assert.match(list[1].sql, /ORDER BY p\.published_at DESC, p\.id DESC\nLIMIT :size OFFSET :offset/);

// 실제 정본의 물리 스키마·JPQL에서 이름과 정책의 근거를 다시 읽는다.
const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('scenario/snapshots/3-2.json', root)));
const blob = file => fs.readFileSync(new URL(`scenario/snapshots/blobs/${manifest.files.find(x => x.path === file).blob}.txt`, root), 'utf8');
const schema = blob('docker/mysql/init/01-community.sql');
for (const table of ['post', 'board', 'post_tag', 'tag', 'post_like', 'comment', 'follow', 'member_block']) {
  assert.ok(schema.includes('CREATE TABLE `' + table + '`'), `정본에 ${table} 테이블 존재`);
}
for (const column of ['follower_id', 'followee_id', 'blocker_id', 'blocked_id', 'published_at', 'author_id']) {
  assert.ok(schema.includes('`' + column + '`'), `정본에 ${column} 열 존재`);
}
const repository = blob('src/main/java/org/example/post/PostRepository.java');
assert.match(repository, /f\.follower\.id = :viewerId AND f\.followee = p\.author/);
assert.match(repository, /b\.blocker\.id = :viewerId AND b\.blocked = p\.author/);
assert.match(repository, /b\.blocked\.id = :viewerId AND b\.blocker = p\.author/);
assert.doesNotMatch(FUNCTIONAL_LIST_CHECK_WHERE, /ADMIN|visibility = 'FOLLOWERS'/, '정본에 없는 우회/추가 조건을 넣지 않음');
const deleteGuide = FUNCTIONAL_TASKS.find(x => x.id === 'delete').completion.find(x => x.id === 'relations').verification;
const namedTest = /\b(Post\w+Test)\b/.exec(deleteGuide)?.[1];
assert.ok(namedTest && manifest.files.some(x => x.path.endsWith(`/${namedTest}.java`)), '안내한 통합 테스트가 실제 패키지에 존재');
assert.doesNotMatch(JSON.stringify(FUNCTIONAL_TASKS.find(x => x.id === 'update').expected.checks), /title=수정한 제목/, '바꿀 수 있는 요청 값을 고정 결과로 채점하지 않음');
// 공개 글이어도 양방향 차단이 있으면 canView가 먼저 404를 만든다.
const updateOwner = FUNCTIONAL_TASKS.find(x => x.id === 'update').completion.find(x => x.id === 'owner').verification;
const deletePermission = FUNCTIONAL_TASKS.find(x => x.id === 'delete').completion.find(x => x.id === 'permission').verification;
assert.match(updateOwner, /양방향 차단이 없는/);
assert.match(deletePermission, /삭제 전/);
assert.match(deletePermission, /이미 삭제한 id/);
assert.ok(schema.includes("(1,6,2,'2026-09-25"), '다른 ACTIVE 공개글 요청이라도 차단된 fixture가 실제 존재');
assert.match(FUNCTIONAL_TASKS.find(x => x.id === 'detail').completion.find(x => x.id === 'missing').verification, /마지막 과제에서 다시/);
console.log('기능 검산 안내: 읽기 전용 SQL/정본 스키마·가시성 조건/같은 WHERE/자기확인 근거/요청값 비교 통과 (실제 DB 실행 아님)');
