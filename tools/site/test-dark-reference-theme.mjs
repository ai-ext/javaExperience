import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';

test('개념 목록과 P16이 고정 light 테마로 공통 다크 토큰을 덮지 않는다',()=>{
  const catalog=fs.readFileSync(new URL('./knowledge-catalog.css',import.meta.url),'utf8');
  const p16=fs.readFileSync(new URL('./p16-json-visual.css',import.meta.url),'utf8');
  const home=fs.readFileSync(new URL('./home-visual.css',import.meta.url),'utf8');
  for(const css of [catalog,p16,home])assert.equal(/color-scheme:\s*light/.test(css),false,'고정 다크를 native 컨트롤까지 유지한다');
  assert.match(catalog,/--kc-ink:\s*var\(--fg\)/);
  assert.match(catalog,/--kc-muted:\s*var\(--muted\)/);
  assert.match(p16,/--p16-ink:\s*var\(--fg\)/);
});
