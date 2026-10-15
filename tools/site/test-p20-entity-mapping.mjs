import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderKnowledgePageVisual } from './knowledge-page-visual.mjs';

const source = fs.readFileSync(new URL('../../docs/knowledge/P20-jpa-entity-mapping.md', import.meta.url), 'utf8');
const visual = renderKnowledgePageVisual('/repo/docs/knowledge/P20-jpa-entity-mapping.md', '<h2 id="start">한 줄로 말하면</h2>');
const built = fs.readFileSync(new URL('../../docs/knowledge/P20-jpa-entity-mapping.html', import.meta.url), 'utf8');

// 화면의 코드 조각은 P20에 실제로 있는 매핑을 따라야 한다.
for (const excerpt of [
  '@Entity @Table(name="orders")',
  '@Column(nullable=false, length=100) private String ordererName;',
  '@OneToMany(mappedBy="order", cascade=CascadeType.ALL, orphanRemoval=true)',
  '@JoinColumn(name="order_id", nullable=false) private Order order;',
  'Order o=Order.create("kim");',
  'o.addLine(new OrderLine("coffee", new java.math.BigDecimal("4.50"), 2));',
  'em.persist(o);',
]) {
  assert.ok(source.includes(excerpt), `P20 source no longer contains the mapped code: ${excerpt}`);
  assert.ok(visual.includes(excerpt.replaceAll('&', '&amp;').replaceAll('"', '&quot;')), `visual excerpt is missing: ${excerpt}`);
}

for (const phrase of ['P20 엔티티 매핑 — Order 객체와 MySQL 행', 'aria-label="orders 예시 행"', 'orderer_name', 'order_lines.order_id', 'GenerationType.IDENTITY', '부모의 IDENTITY 키를 얻는 INSERT는 persist 중 앞당겨질 수 있고', 'cascade된 자식 INSERT 시점과 SQL 순서는 고정되어 있지 않습니다', '학습용 예상 흐름 · 실제 실행 로그 아님', 'Hibernate ORM User Guide · IDENTITY', 'Jakarta Persistence 3.2 · 관계의 owning side']) {
  assert.ok(visual.includes(phrase), `P20 entity map is missing: ${phrase}`);
}
assert.match(visual, /data-p20-stage="0" aria-pressed="true"/);
assert.match(visual, /data-p20-stage="1"[^>]*>.*?persist 요청/s);
assert.match(visual, /data-p20-stage="2"[^>]*>.*?INSERT 예시/s);
assert.match(visual, /data-p20-stage="3" aria-pressed="false"/);
assert.match(visual, /data-p20-value="db"/);
assert.match(visual, /data-p20-row="scalar"/);
assert.match(visual, /data-p20-row="relation"/);
assert.match(visual, /root\.dataset\.stage = button\.dataset\.p20Stage/);
assert.match(visual, /data-p20-column="fk"/);
assert.match(visual, /dataset\.activeLink = key/);
assert.ok(visual.indexOf('p20-entity-map') < visual.indexOf('jpa-concept"'), 'P20-specific visual should precede the generic concept map');
assert.ok(visual.indexOf('p20-entity-map') < visual.indexOf('knowledge-page-map'), 'entity mapping view should precede the document navigation');
assert.ok(built.indexOf('p20-entity-map') < built.indexOf('jpa-concept"'), 'generated P20 page should lead with the P20-specific view');
assert.ok(built.includes('id="1-한-줄로-말하면"'), 'P20 source section anchor must remain available in generated HTML');
assert.ok(built.includes('data-p20-stage="3"'), 'generated page should include the runtime panel controls');
assert.ok(built.includes('Order o=Order.create(&quot;kim&quot;);'), 'generated page should include the P20 create example');

console.log('P20 Entity-to-table mapping structural and source-alignment checks passed.');
