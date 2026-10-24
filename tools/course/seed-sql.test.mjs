// SQLite로 데이터 관계·집계를 검증한다. MySQL 문법·실행 계획 검증은 컨트롤러에서 별도 수행한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { splitSeedTables } from './build-days.mjs';

const read = name => fs.readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8');
const schema = read('board-server/src/main/resources/schema.sql');
const seed = read('course/start/dummy/seed.sql');
const bulk = read('course/start/dummy/bulk.sql');
const hints = JSON.parse(read('course/hints.json')).days;
function database() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON;');
  db.function('MOD', (a, b) => a % b);
  // 원본 열·PK·FK·UNIQUE·CHECK는 유지하고 MySQL DDL 표기만 SQLite에 맞춘다.
  db.exec(schema.replace(/--[^\n]*/g, '')
    .replace(/\bAUTO_INCREMENT\b/g, '')
    .replace(/UNIQUE KEY \w+\s*\(/g, 'UNIQUE (')
    .replace(/,\s*KEY \w+\s*\([^)]*\)/g, '')
    .replace(/\) ENGINE[^;]*;/g, ');'));
  return db;
}
function execute(db, sql) {
  db.exec(sql.replace(/--[^\n]*/g, '')
    .replace(/^SET .*;\s*$/gm, '')
    .replace(/@(?:seed|bulk)_at/g, "'2026-01-01 09:00:00.000000'")
    .replace(/START TRANSACTION/g, 'BEGIN')
    .replace(/UPDATE post p SET/g, 'UPDATE post AS p SET')
    .replace(/CREATE TEMPORARY TABLE/g, 'CREATE TEMP TABLE')
    .replace(/DROP TEMPORARY TABLE/g, 'DROP TABLE')
    .replace(/(INSERT INTO course_bulk_seq \(n\))\s*(WITH RECURSIVE[^;]+?)\n(SELECT n FROM seq;)/, '$2\n$1\n$3'));
}
const count = (db, sql) => Number(Object.values(db.prepare(sql).get())[0]);
const size = (db, table) => count(db, `SELECT COUNT(*) FROM ${table}`);
const blocks = seed.split(/(?=-- 이 블록을 쓰는 날: D\d+)/).slice(1);
function invariants(db) {
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  assert.equal(count(db, 'SELECT COUNT(*) FROM (SELECT post_id,member_id FROM post_like GROUP BY post_id,member_id HAVING COUNT(*)>1)'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) FROM post p WHERE like_count<>(SELECT COUNT(*) FROM post_like l WHERE l.post_id=p.id)'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) FROM member m WHERE point_balance<>COALESCE((SELECT SUM(amount) FROM point_ledger l WHERE l.member_id=m.id),0)'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) FROM shop_item WHERE stock<0'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) FROM coupon c WHERE issued_quantity<>(SELECT COUNT(*) FROM member_coupon mc WHERE mc.coupon_id=c.id)'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) FROM (SELECT balance_after,SUM(amount) OVER (PARTITION BY member_id ORDER BY created_at,id) AS running FROM point_ledger) WHERE balance_after<>running'), 0);
  assert.equal(count(db, 'SELECT COUNT(*) FROM shop_order o JOIN shop_item i ON i.id=o.item_id WHERE o.paid_amount<>o.quantity*i.price OR o.quantity<1'), 0);
}

test('seed의 날별 블록·원본 스키마·잔액·참조와 D02~D10 기대값', () => {
  const db = database();
  try {
    assert.ok(Buffer.byteLength(seed) < 50000);
    assert.equal(blocks.length, 7);
    blocks.forEach((block, i) => {
      execute(db, block);
      invariants(db);
      if (i === 1) assert.equal(count(db, 'SELECT SUM(point_balance) FROM member'), 0);
      if (i === 4) assert.equal(count(db, 'SELECT SUM(point_balance) FROM member'), 18000);
    });
    const expected = { banned_word:3, common_code:5, member:20, post:100, tag:4, post_tag:150, comment:80, post_like:150, point_ledger:42, coupon:2, member_coupon:20, shop_item:3, shop_order:20, pg_payment:8, report:6, audit_log:3 };
    for (const [table, n] of Object.entries(expected)) assert.equal(size(db, table), n, table);
    assert.equal(count(db, "SELECT COUNT(*) FROM member WHERE password_hash LIKE '$2a$10$%'"), 20);
    assert.equal(count(db, "SELECT COUNT(*) FROM member WHERE role='ADMIN'"), 1);
    const page1 = db.prepare("SELECT id FROM post WHERE status='ACTIVE' ORDER BY id DESC LIMIT 20").all();
    const page2 = db.prepare("SELECT id FROM post WHERE status='ACTIVE' AND id<? ORDER BY id DESC LIMIT 20").all(page1.at(-1).id);
    assert.deepEqual([page1.length, page1.at(-1).id, page2.length, page2[0].id, page2.at(-1).id], [20,76,20,75,52]);
    assert.equal(count(db, "SELECT COUNT(*) FROM post WHERE status='ACTIVE'"), 80);
    assert.equal(count(db, "SELECT COUNT(*) FROM comment c JOIN post p ON p.id=c.post_id WHERE p.status='ACTIVE' AND NOT c.deleted"), 60);
    assert.equal(count(db, "SELECT COUNT(*) FROM post p WHERE status='ACTIVE' AND NOT EXISTS (SELECT 1 FROM comment c WHERE c.post_id=p.id AND NOT c.deleted)"), 48);
    assert.deepEqual(db.prepare(hints.D05.sql.questions[1].example).all().map(r => r.id), [99,95,87,83,79,75,67,63,59,55]);
    assert.equal(count(db, 'SELECT COUNT(*) FROM post WHERE member_id=20'), 0);
    assert.equal(count(db, 'SELECT SUM(point_balance) FROM member'), 20000);
    assert.equal(count(db, "SELECT COUNT(*) FROM point_ledger WHERE type='CHARGE'"), 2);
    assert.equal(count(db, "SELECT COUNT(*) FROM report WHERE status='OPEN'"), 4);
    assert.equal(db.prepare(hints.D09.sql.questions[1].example).all().length, 20);
    assert.equal(count(db, "SELECT COUNT(*) FROM (SELECT member_id,SUM(amount) AS score FROM point_ledger WHERE type='EARN' AND ref_type IN ('POST','COMMENT') GROUP BY member_id) WHERE score<>1000"), 0);
    assert.equal(count(db, "SELECT COUNT(*) FROM point_ledger l LEFT JOIN post p ON l.ref_type='POST' AND p.id=l.ref_id LEFT JOIN comment c ON l.ref_type='COMMENT' AND c.id=l.ref_id WHERE l.type='EARN' AND COALESCE(p.member_id,c.member_id,0)<>l.member_id"), 0);
    assert.equal(count(db, "SELECT COUNT(*) FROM pg_payment p WHERE (SELECT COUNT(*) FROM point_ledger l WHERE l.ref_type='PG_PAYMENT' AND l.ref_id=p.id)<>CASE WHEN p.status='DONE' THEN 1 ELSE 0 END"), 0);
  } finally { db.close(); }
});

test('bulk의 결정적 증가량·댓글 삭제·공유 태그·좋아요 카운터', () => {
  const results = [];
  for (let run = 0; run < 2; run++) {
    const db = database();
    try {
      blocks.slice(0, 4).forEach(block => execute(db, block));
      execute(db, bulk);
      invariants(db);
      for (const [table, n] of Object.entries({member:20, post:20100, post_tag:30150, comment:40080, post_like:40150})) assert.equal(size(db, table), n, table);
      assert.equal(count(db, 'SELECT COUNT(*) FROM comment WHERE NOT deleted'), 36072);
      assert.equal(count(db, "SELECT COUNT(*) FROM post WHERE status='ACTIVE'"), 16080);
      const exists = db.prepare(hints.D06.sql.questions[0].example.split(';')[0]).all();
      const join = db.prepare(hints.D06.sql.questions[0].example.split(';')[1]).all();
      assert.equal(exists.length, 16080);
      assert.deepEqual(exists, join);
      results.push(exists.map(r => r.id));
    } finally { db.close(); }
  }
  assert.deepEqual(results[0], results[1]);
  assert.doesNotMatch(seed + bulk, /\b(?:RAND|NOW|CURRENT_TIMESTAMP)\s*\(/i);
});


test('테이블별 조각을 순서대로 실행하면 원본 블록의 행·카운터·잔액과 같다', () => {
  const full = database(), fragments = database();
  try {
    for (const block of blocks) {
      execute(full, block);
      for (const chunk of splitSeedTables(block)) execute(fragments, chunk.sql);
      invariants(fragments);
      for (const { name } of full.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()) {
        assert.deepEqual(fragments.prepare(`SELECT * FROM ${name} ORDER BY id`).all(), full.prepare(`SELECT * FROM ${name} ORDER BY id`).all(), name);
      }
    }
  } finally { full.close(); fragments.close(); }
});
