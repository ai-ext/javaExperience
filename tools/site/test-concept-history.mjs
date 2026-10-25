import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const projectRoot = new URL('../../', import.meta.url);
const cases = [
  ['P09', 'P09-java-syntax-basics.html', 'p09', '__javaExperienceP09', 'p09-learning.bundle.js'],
  ['P04', 'P04-constructors-builder.html', 'p04', '__javaExperienceP04', 'p04-learning.bundle.js'],
  ['P16', 'P16-json-jackson-practical.html', 'p16-contract', '__javaExperienceP16Contract', 'p16-contract-learning.bundle.js'],
  ['W09', 'W09-why-dto.html', 'w09', '__javaExperienceW09', 'w09-learning.bundle.js'],
  ['P19', 'P19-mysql-jpa-setup.html', 'p19', '__javaExperienceP19', 'p19-learning.bundle.js'],
];
const digest = value => createHash('sha256').update(value).digest('hex');
const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const reports = [];

for (const [pageId, filename, prefix, key, bundleName] of cases) {
  const htmlURL = new URL('docs/knowledge/' + filename, projectRoot);
  const htmlPath = fileURLToPath(htmlURL), html = readFileSync(htmlURL, 'utf8');
  const report = { page: pageId, html: htmlPath, checks: [] };
  reports.push(report);
  let win;
  const check = (name, actual, expected) => {
    const passed = same(actual, expected);
    report.checks.push(passed ? { name, passed } : { name, passed, expected, actual });
  };
  try {
    const consoleErrors = [], virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', error => consoleErrors.push(error.message));
    const page = new JSDOM(html, { url: 'https://learn.example/docs/knowledge/' + filename, runScripts: 'outside-only', virtualConsole });
    win = page.window;
    const doc = win.document;
    win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    const forbidden = [];
    for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { forbidden.push(name); throw Error(name + ' 접근 금지'); } });
    win.fetch = () => { forbidden.push('fetch'); throw Error('네트워크 요청 금지'); };
    win.scrollTo = () => {};
    win.HTMLElement.prototype.scrollIntoView = () => {};
    const external = { foreign: { keep: pageId }, __conceptHistoryExternal: { schema: 1, selected: 'unchanged' } };
    win.history.replaceState(structuredClone(external), '');
    // HTML에 선언된 해당 페이지 classic bundle만 실행한다. 공통 진도·기존 P16 화면 script는 실행하지 않는다.
    const script = [...doc.querySelectorAll('script[src]')].find(node => new URL(node.getAttribute('src'), pathToFileURL(htmlPath)).pathname.endsWith('/' + bundleName));
    if (!script) throw Error('생성 HTML에 classic bundle이 없음: ' + bundleName);
    const bundleURL = new URL(script.getAttribute('src'), pathToFileURL(htmlPath));
    if (bundleURL.protocol !== 'file:') throw Error('로컬 bundle만 허용');
    const bundlePath = fileURLToPath(bundleURL), bundle = readFileSync(bundlePath, 'utf8');
    report.bundle = bundlePath; report.bundleSHA256 = digest(bundle);
    const protectedNodes = [...doc.querySelectorAll('[id$="-original"], .p20-entity-map, [data-p16-visual]')];
    const protectedBefore = protectedNodes.map(node => node.outerHTML);
    win.eval(bundle + '\n//# sourceURL=' + bundleName);
    const root = doc.querySelector(`[data-${prefix}-learning]`);
    if (!root) throw Error('학습 root가 없음');
    const $ = selector => root.querySelector(selector);
    const topicSelect = $(`[data-${prefix}-topic]`), stageSelect = $(`[data-${prefix}-stage-select]`);
    if (!topicSelect || !stageSelect || !stageSelect.options.length) throw Error('classic bundle 초기화 실패');
    const view = () => {
      const result = { topic: topicSelect.value, stage: stageSelect.value };
      if (pageId === 'P09') result.comparison = $(`[data-${prefix}-compare]`).getAttribute('aria-pressed') === 'true';
      return result;
    };
    const initialView = view();
    function selectTopic(topic) {
      topicSelect.value = topic; topicSelect.dispatchEvent(new win.Event('change', { bubbles: true }));
    }
    function selectLast() {
      selectTopic(topicSelect.options[topicSelect.options.length - 1].value);
      stageSelect.value = stageSelect.options[stageSelect.options.length - 1].value;
      stageSelect.dispatchEvent(new win.Event('change', { bubbles: true }));
    }
    function missingRecord(label, state) {
      const before = view();
      win.history.pushState(state, '', '#concept-history-checkpoint-' + label);
      win.dispatchEvent(new win.PopStateEvent('popstate', { state }));
      check(label + ': current scene preserved', view(), before);
      const recorded = win.history.state?.[key];
      check(label + ': current entry stores own record', recorded ? { topic: recorded.topic, stage: recorded.stage, ...(pageId === 'P09' ? { comparison: recorded.comparison } : {}) } : null, before);
      if (state) for (const [name, value] of Object.entries(state)) check(label + ': preserves foreign ' + name, win.history.state?.[name], value);
    }
    selectLast();
    missingRecord('missing-key', structuredClone(external));
    selectLast();
    missingRecord('null-state', null);
    if (pageId === 'P09') {
      selectTopic('references');
      stageSelect.value = stageSelect.options[stageSelect.options.length - 1].value;
      stageSelect.dispatchEvent(new win.Event('change', { bubbles: true }));
      const compare = $(`[data-${prefix}-compare]`);
      if (compare.getAttribute('aria-pressed') !== 'true') compare.click();
      check('P09 comparison setup', view().comparison, true);
      missingRecord('missing-key-with-comparison', structuredClone(external));
    }
    // 실제 페이지 기록이 있는 popstate는 여전히 그 기록으로 복원해야 한다.
    selectLast();
    const supplied = { ...structuredClone(external), [key]: { ...initialView } };
    win.history.pushState(supplied, '', '#concept-history-checkpoint-valid');
    win.dispatchEvent(new win.PopStateEvent('popstate', { state: supplied }));
    check('valid record still restores supplied scene', view(), initialView);
    check('valid record preserves supplied history', win.history.state, supplied);
    check('source/map DOM unchanged', protectedNodes.map(node => node.outerHTML), protectedBefore);
    check('source file unchanged', digest(readFileSync(htmlURL)), digest(html));
    check('no storage/network/progress access', forbidden, []);
    check('no JSDOM runtime errors', consoleErrors, []);
  } catch (error) {
    report.checks.push({ name: 'page execution', passed: false, error: String(error?.stack || error) });
  } finally { win?.close(); }
  report.passed = report.checks.every(check => check.passed);
  // 원문 전체 HTML 같은 대형 문자열은 실패 보고에 넣지 않는다.
  for (const result of report.checks) if (result.name === 'source/map DOM unchanged' && !result.passed) {
    result.actual = result.actual.map(digest); result.expected = result.expected.map(digest);
  }
}
const output = {
  suite: 'concept-history-popstate',
  checkedAt: new Date().toISOString(),
  execution: 'generated HTML + page-specific classic bundle; JSDOM outside-only; no browser/backend/source mutation',
  summary: { pages: reports.length, failedPages: reports.filter(page => !page.passed).length, failedChecks: reports.reduce((sum, page) => sum + page.checks.filter(check => !check.passed).length, 0) },
  pages: reports.map(report => ({ ...report, checks: report.checks.filter(check => !check.passed), passedChecks: report.checks.filter(check => check.passed).length })),
};
process.stdout.write(JSON.stringify(output, null, 2) + '\n');
process.exitCode = output.summary.failedPages ? 1 : 0;
