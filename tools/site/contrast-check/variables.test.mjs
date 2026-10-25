import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const site = fileURLToPath(new URL('../',import.meta.url));
test('색상 변수 참조 이름과 단일 테마 선언을 보존한다', () => {
  const files=fs.readdirSync(site).filter(name=>name.endsWith('.css')).map(name=>path.join(site,name));
  const scenario=fileURLToPath(new URL('../../../scenario/db-query-journey/',import.meta.url));
  files.push(...fs.readdirSync(scenario).filter(name=>name.endsWith('.md')).map(name=>path.join(scenario,name)));
  for(const file of files) {
    const source=fs.readFileSync(file,'utf8');
    const css=file.endsWith('.md')?[...source.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n'):source;
    for(const match of css.matchAll(/var\(\s*([^,)]+)/g))assert.match(match[1].trim(),/^--[\w-]+$/,path.basename(file)+': '+match[0]);
    if(file.endsWith('.css'))assert.doesNotMatch(css,/prefers-color-scheme|\[data-theme|color-scheme\s*:\s*light/,path.basename(file));
  }
});
