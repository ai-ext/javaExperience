import { loadCourseSources } from './sources.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as builder from './build-days.mjs';

const read = p => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const roadmap = loadCourseSources().roadmap;
const hints = loadCourseSources().hints;

test('층은 파일 역할·직접 설계로 계산하고 테스트 파일 이름의 역할은 중복 계산하지 않는다', () => {
  assert.equal(typeof builder.stepLayers, 'function');
  assert.deepEqual(builder.stepLayers({ title: '테이블 직접 설계', files: ['PostRepository.java', 'PostServiceImpl.java', 'PostController.java', 'PostMapper.xml', 'PostServiceTest.java'] }), ['DB', '쿼리', '서비스', '컨트롤러', '테스트']);
  assert.deepEqual(builder.stepLayers({ title: '검증', files: ['src/test/java/PostControllerTest.java', 'PostRepositoryTests.java', 'logback-spring.xml'] }), ['테스트']);
  assert.deepEqual(builder.stepLayers({ title: 'DTO', files: ['PostRequest.java', 'PostResponse.java'] }), ['컨트롤러']);
  assert.deepEqual(builder.stepLayers({ title: '공통 설정', files: ['application.yml'] }), []);
});

test('공통 가이드는 과정 안내와 D04 머리에서 같은 일곱 단계·완료 확인을 제공한다', () => {
  assert.equal(typeof builder.apiGuide, 'function');
  const guide = builder.apiGuide(hints.apiGuide);
  assert.equal(hints.apiGuide.steps.length, 7);
  assert.ok(read('course/README.md').includes(guide));
  assert.match(guide, /명세.*\n.*테이블.*\n.*이 날 데이터 넣기.*\n.*쿼리.*\n.*서비스.*\n.*컨트롤러.*\n.*테스트/);
  assert.match(guide, /끝났는지 아는 법/);
});

test('여러 층을 구현하는 API 순서는 진행 순서 힌트로 시작하고 2단계는 보존한다', () => {
  assert.equal(typeof builder.stepLayers, 'function');
  for (const d of roadmap.days.filter(d => d.phase === 'build')) for (const s of d.steps.filter(s => s.specRefs.length)) {
    const layers = builder.stepLayers(s).filter(x => x !== '테스트');
    if (layers.length > 1) assert.match(hints.days[d.id].steps[s.no][0], /^이 순서는 DB → 쿼리 → 서비스 → 컨트롤러 순으로:/, `${d.id}-${s.no}`);
  }
  for (const d of roadmap.days.filter(d => d.phase === 'maintain')) for (const hs of Object.values(hints.days[d.id].steps)) assert.doesNotMatch(hs[0], /^이 순서는 DB →/);
});

test('seed 테이블 조각은 원본 INSERT 전부를 한 번씩 포함하고 공통 머리·트랜잭션을 갖는다', () => {
  assert.equal(typeof builder.splitSeedTables, 'function');
  for (const [day, blocks] of builder.parseDaySql(read('course/start/dummy/seed.sql'))) {
    const sql = blocks.join('');
    const chunks = builder.splitSeedTables(sql);
    const inserts = s => [...s.matchAll(/INSERT INTO\s+(\w+)[\s\S]*?;/g)].map(m => m[0]);
    assert.deepEqual(chunks.flatMap(c => inserts(c.sql)).sort(), inserts(sql).sort(), day);
    assert.equal(new Set(chunks.map(c => c.table)).size, chunks.length);
    for (const c of chunks) {
      assert.deepEqual([...new Set([...c.sql.matchAll(/INSERT INTO\s+(\w+)/g)].map(m => m[1]))], [c.table]);
      assert.match(c.sql, /SET @seed_at = '2026-01-01 09:00:00.000000';/);
      assert.match(c.sql, /START TRANSACTION;/);
      assert.match(c.sql, /COMMIT;\s*$/);
    }
    if (day === 'D05') assert.match(chunks.find(c => c.table === 'post_like').sql, /UPDATE post p SET like_count/);
    if (['D07', 'D08'].includes(day)) assert.match(chunks.find(c => c.table === 'point_ledger').sql, /UPDATE member SET point_balance/);
  }
});

test('INSERT 문은 문자열 속 세미콜론·주석을 자르지 않고 같은 테이블을 묶는다', () => {
  assert.equal(typeof builder.splitSeedTables, 'function');
  const chunks = builder.splitSeedTables("-- 안내;\nSET @seed_at='a;b';\nSTART TRANSACTION;\nINSERT INTO `demo` VALUES ('a;--b', 'it''s');\nINSERT INTO demo VALUES ('c');\nCOMMIT;");
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].table, 'demo');
  assert.ok(chunks[0].sql.includes("VALUES ('a;--b', 'it''s');"));
  assert.match(chunks[0].sql, /INSERT INTO demo VALUES/);
});

test('모든 seed 조각은 준비 순서로 복귀하고 bulk 실험은 D06 ⑤로 복귀한다', () => {
  const seed = read('course/start/dummy/seed.sql');
  for (const [id, blocks] of builder.parseDaySql(seed)) {
    const prepared = Object.values(builder.DATA_STEPS[id]).flat();
    for (const {table} of builder.splitSeedTables(blocks.join(''))) assert.ok(prepared.includes(table), `${id} ${table}: 준비·복귀 누락`);
  }
  assert.ok(builder.DATA_STEPS.D06[5].includes('bulk'));
});

test('D13 카드 연결은 로드맵 과제·티켓과 일치하고 D10 진단 증거를 완료·채점에서 요구한다', () => {
  const d13=roadmap.days.find(d=>d.id==='D13');
  for(const [id,step,ticket] of [['TC-D13-1',5,'B06'],['TC-D13-2',2,'B07'],['TC-D13-3',3,'B09'],['TC-D13-4',4,'B10']]) {
    assert.deepEqual(d13.talkCardLinks?.[id],{step,ticket});
    assert.ok(d13.steps.find(s=>s.no===step).tickets.includes(ticket));
  }
  assert.match(roadmap.days.find(d=>d.id==='D10').steps[5].done.join(' '),/스레드.*메트릭.*slow log.*EXPLAIN ANALYZE/);
  assert.match(hints.days.D10.grader.focus.join(' '),/진단.*관찰/);
});
