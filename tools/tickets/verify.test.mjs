import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = fs.readFileSync(new URL('./verify.sh', import.meta.url), 'utf8');
const functions = script.slice(script.indexOf('summarize() {'), script.indexOf('apply_fix() {'));
const known = '연결_실패가_계속되면_백오프_후_3번째에_포기한다';
const xmlEscape = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function check(cases, expectedTests = cases.length) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-verifier-'));
  try {
    fs.mkdirSync(path.join(dir, 'results-full'));
    const bad = cases.filter((c) => c.type);
    fs.writeFileSync(path.join(dir, 'results-full/TEST-fixture.xml'), `<testsuite name="com.example.PgClientRetryTest" tests="${expectedTests}" failures="${bad.length}" errors="0" skipped="0">${cases.map((c) => `<testcase classname="com.example.${c.cls ?? 'PgClientRetryTest'}" name="${c.name ?? known}()">${c.type ? `<failure type="${c.type}" message="${xmlEscape(c.message ?? '')}">${xmlEscape(c.trace ?? '')}</failure>` : ''}</testcase>`).join('')}</testsuite>`);
    const harness = path.join(dir, 'check.sh');
    fs.writeFileSync(harness, `set -euo pipefail\nENV_FLAKY='PgClientRetryTest.${known}'\n${functions}\nrun_tests() { :; }\ncheck_full "$1" fixture\n`);
    return spawnSync('/bin/bash', [harness, dir], { encoding: 'utf8' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('정상 실행은 통과 1건과 환경 예외 0건으로 표시한다', () => {
  const r = check([{}]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /통과 1건.*환경 예외 0건.*실패 0건/);
});
test('알려진 이름도 일반 단언 실패면 실패다', () => {
  const r = check([{ type: 'org.opentest4j.AssertionFailedError', message: 'expected: 1 but was: 2' }]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /실패 1건/);
});
test('연결·타임아웃 원인이 있는 알려진 실패만 환경 예외다', () => {
  for (const c of [
    { type: 'java.net.ConnectException', message: 'Connection refused' },
    { type: 'java.util.concurrent.ExecutionException', trace: 'Caused by: java.net.SocketTimeoutException: Read timed out' },
    { type: 'org.opentest4j.AssertionFailedError', message: 'expected: UNREACHABLE\n but was: TIMEOUT' },
  ]) {
    const r = check([{}, c]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /통과 1건.*환경 예외 1건.*실패 0건/);
    assert.match(r.stdout, /통과\(환경 예외 1건:/);
    assert.match(r.stdout, new RegExp(c.type.replaceAll('.', '\\.')));
    assert.doesNotMatch(r.stdout, /전체 통과/);
  }
});
test('다른 이름·기대값만 TIMEOUT·컨텍스트 실패·복합 실패는 면제하지 않는다', () => {
  for (const c of [
    { cls: 'OtherTest', type: 'java.net.ConnectException', message: 'Connection refused' },
    { type: 'org.opentest4j.AssertionFailedError', message: 'expected: TIMEOUT but was: DONE' },
    { type: 'java.lang.IllegalStateException', message: 'Failed to load ApplicationContext' },
    { type: 'org.opentest4j.MultipleFailuresError', message: 'Connection refused; count expected 1 but was 2' },
    { type: 'org.opentest4j.AssertionFailedError', trace: 'at com.example.PgClientRetryTest.연결_실패가_계속되면_백오프_후_3번째에_포기한다(PgClientRetryTest.java:143)' },
  ]) assert.equal(check([c]).status, 1, JSON.stringify(c));
});
test('환경 예외와 실제 실패가 섞이면 실패하고 둘 다 센다', () => {
  const r = check([{ type: 'java.net.SocketTimeoutException' }, { type: 'java.lang.AssertionError', message: 'wrong count' }]);
  assert.equal(r.status, 1);
  assert.match(r.stdout + r.stderr, /통과 0건.*환경 예외 1건.*실패 1건/);
});
test('테스트 0건은 통과가 아니다', () => assert.equal(check([], 0).status, 1));
