import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKnowledgeCatalog } from './knowledge-catalog-data.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const catalog = loadKnowledgeCatalog(root);
assert.equal(catalog.length, 134);
assert.equal(new Set(catalog.map(({ id }) => id)).size, 134, '문서 ID 중복 없음');
assert.deepEqual(catalog.filter(({ search }) => search.includes('dto')).map(({ id }) => id).sort(), ['P02', 'P03', 'P06', 'P16', 'P25', 'W09', 'W10']);
assert.equal(catalog[0].id, 'P01', '원본 표 순서 유지');
assert.ok(catalog.every(({ href, sourcePath }) => href.endsWith('.html') && sourcePath === `docs/knowledge/${href.replace(/\.html$/, '.md')}`));
assert.ok(catalog.every(({ sourcePath }) => fs.existsSync(path.join(root, sourcePath))));
assert.equal(catalog.find(({ id }) => id === 'P02').title, 'P02. MVC 패턴과 계층형 구조 — Controller·Service·Repository');
assert.equal(catalog.find(({ id }) => id === 'P02').summary, 'MVC는 HTTP 요청과 응답을 다루는 표현 계층의 방식이다.');
assert.ok(catalog.every((document) => !('category' in document)), '미확정 분류를 데이터에서 추정하지 않음');

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'javaexperience-catalog-'));
try {
  const dir = path.join(fixture, 'docs/knowledge');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'README.md'), '| 문서 | 한 줄 요약 |\n|---|---|\n| [P01. 예시 제목](P01-example.md) | DTO는 요약에만 있습니다. |\n');
  fs.writeFileSync(path.join(dir, 'P01-example.md'), '# P01. 예시 제목\n\n본문에 DTO가 있어요.\n\n## **객체**와 `값`\n\n### 생성자 설명\n\n#### 숨은 DTO 제목\n\n```md\n# DTO 코드 예시\n```\n\n<h3>DTO HTML 장식</h3>\n');
  const [example] = loadKnowledgeCatalog(fixture);
  assert.ok(example.search.includes('객체') && example.search.includes('생성자 설명'));
  assert.ok(!example.search.includes('dto'), '요약·본문·h4·코드블록·HTML 장식은 검색하지 않음');
  assert.equal(example.href, 'P01-example.html');
  assert.equal(example.sourcePath, 'docs/knowledge/P01-example.md');
  assert.equal(example.search, example.search.toLocaleLowerCase('ko'), '검색 데이터는 대소문자를 통일');
} finally {
  fs.rmSync(fixture, { recursive: true });
}
console.log(`개념 카탈로그 ${catalog.length}건: 중복·링크·원문 메타데이터·h1~h3 검색 범위 통과; DTO=P02,P03,P06,P16,P25,W09,W10`);
