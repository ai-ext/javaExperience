import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderJpaFocused } from './jpa-focused.mjs';

const root = new URL('../../', import.meta.url);
const source = fs.readFileSync(new URL('docs/knowledge/S09-jpa-hibernate.md', root), 'utf8');
const html = renderJpaFocused();
assert.deepEqual([...html.matchAll(/data-jpa-panel="([^"]+)"/g)].map((item) => item[1]), ['roles','context','flush','lifecycle','nplusone']);
for (const term of ['준영속', 'merge(detached)', 'LAZY', 'fetch join', '실측 아님', '서로 다른 작성자 3명']) assert.ok(html.includes(term));
for (const file of ['20-managed-detached-v2.png','21-lazy-n-plus-one-v4.png']) {
  assert.ok(html.includes(file));
  assert.ok(fs.existsSync(new URL(`docs/design/mockups-2026-10-15-batch2/${file}`, root)));
}
assert.ok(source.includes('merge(detached)'));
assert.ok(source.includes('상태를 복사한 관리 인스턴스를 반환'));
assert.match(source, /LAZY 연관관계는 초기 SQL을 줄이지만/);
const client = fs.readFileSync(new URL('tools/site/jpa-focused.js', root), 'utf8');
assert.match(client, /merge\(\)가 준영속 상태를 관리 객체로 복사/);
assert.match(client, /authorAccess\.size/);
assert.match(client, /실제 SQL과 행 수는 실행해 확인/);
const built = fs.readFileSync(new URL('docs/knowledge/S09-jpa-hibernate.html', root), 'utf8');
assert.match(built, /jpa-image-scenes\.css/);
assert.match(built, /data-jpa-panel="nplusone" hidden/);
console.log('S09 사용자 시안 20·21 상태·merge·N+1 예시 경계 통과');
