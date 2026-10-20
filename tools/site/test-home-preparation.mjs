import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { renderHomePreparation } from './home-preparation.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const html = renderHomePreparation(root);
const dom = new JSDOM(html);
const doc = dom.window.document;
const dialog = doc.querySelector('dialog#home-prepare-dialog.home-dialog');
assert.ok(dialog);
assert.equal(dialog.getAttribute('aria-labelledby'), 'home-prepare-title');
assert.equal(doc.querySelector('#home-prepare-title').textContent, '첫 실행 준비');
assert.equal(dialog.querySelector('[data-home-prepare-close]').type, 'button');
assert.equal(dialog.querySelector('[data-home-prepare-close]').getAttribute('aria-label'), '닫기');
const steps = [...dialog.querySelectorAll('ol.home-preparation-steps > li')];
assert.equal(steps.length, 4);
assert.ok(steps.every((step) => step.querySelector('strong') && step.querySelector('p')), '각 단계는 요약과 설명을 함께 제공');
assert.ok([...dialog.querySelectorAll('pre')].every((code) => code.closest('details')), '긴 명령은 선택해서 읽기');
assert.equal(dialog.querySelectorAll('details[open]').length, 0);
assert.equal(dialog.querySelectorAll('input, [disabled], [aria-checked], [data-prepared]').length, 0, '준비 상태를 자동 확정하거나 과제를 막지 않음');
const fullGuide = dialog.querySelector('a[data-home-setup]');
assert.equal(fullGuide.getAttribute('href'), '#전체-안내');
assert.equal(fullGuide.textContent.trim(), '전체 설치·실행 안내 보기');
assert.doesNotMatch(html, /down\s+(?:-v|--volumes)|volume\s+(?:rm|prune)|drop\s+(?:database|table)|rm\s+-rf/i, '데이터 삭제 명령 없음');

const gradle = fs.readFileSync(path.join(root, 'build.gradle'), 'utf8');
const java = gradle.match(/JavaLanguageVersion\.of\((\d+)\)/)[1];
assert.match(steps[0].textContent, new RegExp(`JDK ${java}`));
const yml = fs.readFileSync(path.join(root, 'src/main/resources/application.yml'), 'utf8');
const active = yml.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');
const appPort = active.match(/jdbc:mysql:\/\/localhost:(\d+)\//)[1];
const compose = fs.readFileSync(path.join(root, 'compose.yaml'), 'utf8');
const dockerPort = compose.match(/\$\{DB_PORT:-(\d+)\}/)[1];
assert.match(steps[1].textContent, new RegExp(`localhost:${appPort}`));
assert.match(steps[1].textContent, new RegExp(`localhost:${dockerPort}`));
assert.equal(Boolean(dialog.querySelector('[data-home-port-mismatch]')), appPort !== dockerPort);

// 주석의 옛 URL에 반응하지 않고 실제 활성 설정이 맞으면 주의를 표시하지 않는다.
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'javaexperience-preparation-'));
try {
  fs.mkdirSync(path.join(fixture, 'src/main/resources'), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'build.gradle'), gradle);
  fs.writeFileSync(path.join(fixture, 'compose.yaml'), compose);
  fs.writeFileSync(path.join(fixture, 'src/main/resources/application.yml'), `# url: jdbc:mysql://localhost:9999/community\nspring:\n  datasource:\n    url: jdbc:mysql://localhost:${dockerPort}/community\n`);
  const aligned = new JSDOM(renderHomePreparation(fixture));
  assert.equal(aligned.window.document.querySelector('[data-home-port-mismatch]'), null);
  assert.doesNotMatch(aligned.window.document.body.textContent, /9999/);
  aligned.window.close();
} finally {
  fs.rmSync(fixture, { recursive: true });
}
dom.window.close();
console.log('첫 실행 준비: 4단계·실제 JDK/활성 DB/Compose 대조·포트 불일치 조건·선택형 명령·비파괴 안내 통과');
