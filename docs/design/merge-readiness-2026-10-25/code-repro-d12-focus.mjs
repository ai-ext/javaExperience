import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const require = createRequire(path.join(ROOT, 'tools/site/package.json'));
const { JSDOM } = require('jsdom');
const cases = [];
for (const kind of ['d11', 'd12']) {
  const file = kind === 'd11' ? 'D11-web-security-basics.html' : 'D12-linux-terminal-basics.html';
  for (const implementation of ['source', 'bundle']) {
    for (const direction of ['next', 'prev']) {
      const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs/knowledge', file), 'utf8'), {
        url: `https://example.test/docs/knowledge/${file}`, runScripts: 'outside-only',
      });
      const doc = dom.window.document;
      if (implementation === 'bundle') dom.window.eval(fs.readFileSync(path.join(ROOT, `tools/site/${kind}-learning.bundle.js`), 'utf8'));
      else {
        const module = await import(pathToFileURL(path.join(ROOT, `tools/site/${kind}-learning.js`)));
        module[kind === 'd11' ? 'initD11Learning' : 'initD12Learning'](doc, dom.window);
      }
      const stages = [...doc.querySelectorAll(`[data-${kind}-stage]`)];
      const initial = direction === 'next' ? stages.at(-2) : stages[1];
      const expected = direction === 'next' ? stages.at(-1) : stages[0];
      initial.click();
      const button = doc.querySelector(`[data-${kind}-${direction}]`);
      button.focus();
      const before = { activeIsMovementButton: doc.activeElement === button, disabled: button.disabled };
      button.click();
      cases.push({ kind, implementation, direction, before, after: {
        movementButtonDisabled: button.disabled,
        activeIsMovementButton: doc.activeElement === button,
        activeIsSelectedStage: doc.activeElement === expected,
        selectedStage: doc.querySelector(`[data-${kind}-stage][aria-current="step"]`)?.dataset[`${kind}Stage`],
        expectedStage: expected.dataset[`${kind}Stage`],
      } });
      dom.window.close();
    }
  }
}
const report = {
  checkedAt: new Date().toISOString(),
  boundary: 'JSDOM event/DOM observation only; no real-browser rendering or keyboard dispatch claim.',
  meaning: 'A reproduced defect is an observation, not a passing product assertion.',
  cases,
};
fs.writeFileSync(path.join(HERE, 'code-repro-d12-focus.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
