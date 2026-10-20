import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderMybatisFocused } from './mybatis-focused.mjs';

const root = new URL('../../', import.meta.url);
const source = fs.readFileSync(new URL('docs/knowledge/W04-mybatis-xml-practical.md', root), 'utf8');
const markup = renderMybatisFocused();
const built = fs.readFileSync(new URL('docs/knowledge/W04-mybatis-xml-practical.html', root), 'utf8');
for (const term of ['Book findById(@Param("id") long id)', 'BookMapper.xml', 'namespace + id', 'WHERE id = ?', '값과 SQL 문장이 분리']) assert.ok(markup.includes(term) || markup.includes(term.replaceAll('<','&lt;').replaceAll('>','&gt;')));
assert.match(source, /#\{id\}/);
assert.ok(source.includes('${column}'));
assert.match(markup, /data-mybatis-panel="binding" hidden/);
assert.match(built, /mybatis-focused\.css/);
assert.match(built, /mybatis-focused\.js/);
console.log('W04 Mapper/XML·값 바인딩 두 화면의 원문·생성 HTML 계약 통과');
