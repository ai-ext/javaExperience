import fs from 'node:fs';
import { JSDOM } from '../../../../../tools/site/node_modules/jsdom/lib/api.js';
const root = new URL('../../../../../', import.meta.url);
const doc = new JSDOM(fs.readFileSync(new URL('docs/knowledge/R03-schema-types-constraints.html', root), 'utf8')).window.document;
const rows = [...doc.querySelectorAll('#r03-original tr')].filter(row => ['TINYINT', 'BIGINT'].includes(row.cells[0]?.textContent.trim()));
const results = rows.map(row => ({type:row.cells[0].textContent, html:row.cells[1].innerHTML, text:row.cells[1].textContent, deleted:row.cells[1].querySelectorAll('del').length}));
console.log(JSON.stringify({expectation:'숫자 범위의 ~ 구분자를 보존하고 정수 범위에 취소선을 만들지 않는다.', rows:results}, null, 2));
if (results.length !== 2 || results.some(row => row.deleted !== 0 || !row.text.includes('~'))) process.exitCode = 1;
