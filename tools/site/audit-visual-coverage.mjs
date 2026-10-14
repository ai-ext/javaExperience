// 생성된 101개 화면에서 시안·구성요소·흐름·요청 버튼의 누락을 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scenario/scenario.json'), 'utf8'));
const items = [];
const failures = [];

for (const chapter of manifest.chapters) for (const level of chapter.levels) {
  if (!level.file) continue;
  const sourcePath = path.join(root, 'scenario', chapter.dir, level.file);
  const htmlPath = sourcePath.replace(/\.md$/, '.html');
  const visualPath = path.join(root, 'scenario', 'visuals', `${level.id}.svg`);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const match = source.match(/^```screen\s*\n([\s\S]*?)^```\s*$/m);
  if (!match) { failures.push(`${level.id}: screen 데이터가 없음`); continue; }
  const scene = JSON.parse(match[1]);
  if (!fs.existsSync(htmlPath) || !fs.existsSync(visualPath)) {
    failures.push(`${level.id}: HTML 또는 SVG가 없음`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const svg = fs.readFileSync(visualPath, 'utf8');
  const screenIds = scene.screen.flatMap((widget) => [
    widget.id,
    ...(widget.type === 'actions' ? widget.items?.map((item) => item.id) || [] : []),
  ]).filter(Boolean);
  for (const id of screenIds) {
    if (!html.includes(`data-screen-id="${id}"`)) failures.push(`${level.id}: 화면 요소 ${id} 누락`);
  }
  const steps = scene.flows.flatMap((flow) => flow.steps || []);
  const renderedSteps = (html.match(/class="flow-step"/g) || []).length;
  if (renderedSteps !== steps.length) failures.push(`${level.id}: 흐름 ${steps.length}단계 중 ${renderedSteps}단계 출력`);
  if (!html.includes('class="scenario-preview"')) failures.push(`${level.id}: 화면 시안 누락`);
  if (!html.includes(`visuals/${level.id}.svg`)) failures.push(`${level.id}: 단계별 SVG 연결 누락`);
  if (!svg.includes(`${level.id} `)) failures.push(`${level.id}: SVG 제목 누락`);
  if (!html.includes('class="scenario-flow-panel"')) failures.push(`${level.id}: 흐름 패널 누락`);
  const requestSteps = steps.filter((step) => step.kind === 'request').length;
  const requestButtons = (html.match(/class="send-request"/g) || []).length;
  items.push({
    id: level.id,
    difficulty: level.difficulty,
    html: path.relative(root, htmlPath),
    visual: path.relative(root, visualPath),
    widgets: scene.screen.length,
    widgetIds: screenIds,
    flows: scene.flows.length,
    steps: steps.length,
    requestSteps,
    requestButtons,
    requestPractice: requestButtons ? 'browser_button' : requestSteps ? 'manual_or_test_flow' : 'no_http_request',
  });
}

const totals = {
  levels: items.length,
  visuals: items.length,
  widgets: items.reduce((sum, item) => sum + item.widgets, 0),
  flows: items.reduce((sum, item) => sum + item.flows, 0),
  flowSteps: items.reduce((sum, item) => sum + item.steps, 0),
  requestSteps: items.reduce((sum, item) => sum + item.requestSteps, 0),
  requestButtons: items.reduce((sum, item) => sum + item.requestButtons, 0),
  manualOrTestFlowLevels: items.filter((item) => item.requestPractice === 'manual_or_test_flow').map((item) => item.id),
};
if (items.length !== 101) failures.push(`단계 수 ${items.length}/101`);
const report = { schemaVersion: 1, status: failures.length ? 'failed' : 'verified', totals, failures, levels: items };
fs.writeFileSync(path.join(root, 'docs/scenario-visual-state.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, totals, failures }, null, 2));
if (failures.length) process.exitCode = 1;
