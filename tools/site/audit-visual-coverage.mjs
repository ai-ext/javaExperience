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
    ...(widget.items?.map((item) => item && typeof item === 'object' ? item.id : null) || []),
  ]).filter(Boolean);
  for (const id of screenIds) {
    if (!html.includes(`data-screen-id="${id}"`)) failures.push(`${level.id}: 화면 요소 ${id} 누락`);
  }
  const steps = scene.flows.flatMap((flow) => flow.steps || []);
  const renderedSteps = (html.match(/class="flow-step"/g) || []).length;
  if (renderedSteps !== steps.length) failures.push(`${level.id}: 흐름 ${steps.length}단계 중 ${renderedSteps}단계 출력`);
  if (!html.includes('class="scenario-preview"')) failures.push(`${level.id}: 화면 시안 누락`);
  if (!svg.includes(`${level.id} `)) failures.push(`${level.id}: SVG 제목 누락`);
  if (!html.includes('class="scenario-flow-panel"')) failures.push(`${level.id}: 흐름 패널 누락`);
  const roleMaps = (html.match(/class="implementation-route"/g) || []).length;
  const lessonCards = (html.match(/class="lesson-scene lesson-/g) || []).length;
  if (roleMaps !== 1) failures.push(`${level.id}: 정답 파일 역할 지도 ${roleMaps}개`);
  if (lessonCards < 4) failures.push(`${level.id}: 학습 절 카드 ${lessonCards}개`);
  if (html.includes('class="stage-sketch"')) failures.push(`${level.id}: 중복 SVG 시안 표시`);
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
    roleMaps,
    lessonCards,
    requestPractice: requestButtons ? 'browser_button' : requestSteps ? 'manual_or_test_flow' : 'no_http_request',
  });
}

const totals = {
  levels: items.length,
  visuals: items.length,
  widgets: items.reduce((sum, item) => sum + item.widgets, 0),
  screenElements: items.reduce((sum, item) => sum + item.widgetIds.length, 0),
  flows: items.reduce((sum, item) => sum + item.flows, 0),
  flowSteps: items.reduce((sum, item) => sum + item.steps, 0),
  requestSteps: items.reduce((sum, item) => sum + item.requestSteps, 0),
  requestButtons: items.reduce((sum, item) => sum + item.requestButtons, 0),
  roleMaps: items.reduce((sum, item) => sum + item.roleMaps, 0),
  lessonCards: items.reduce((sum, item) => sum + item.lessonCards, 0),
  manualOrTestFlowLevels: items.filter((item) => item.requestPractice === 'manual_or_test_flow').map((item) => item.id),
};
if (items.length !== 101) failures.push(`단계 수 ${items.length}/101`);
const report = {
  schemaVersion: 2,
  status: failures.length ? 'failed' : 'verified',
  scope: '101개 단계 화면의 시안·요소·흐름·코드 역할 지도·학습 카드 정적 대조',
  design: [
    '단계 본문은 화면 JSON에서 그린 실제 DOM 시안과 선택 가능한 요청 흐름을 나란히 보여준다.',
    '정답 변경 파일의 역할 지도는 화면 시나리오와 구분하고, DBeaver는 MySQL 직접 접속의 별도 경로로 둔다.',
    '같은 SVG를 단계 화면에 중복하지 않고 카탈로그 미리보기에만 사용한다.',
    '장문 절은 단계별 카드에 넣고 요청 버튼·원문 코드·채점 기준을 보존한다.',
  ],
  limits: [
    '빛으로 표시하는 계층은 시나리오의 예상 흐름이며 실제 Spring Boot 내부 호출 추적이 아니다.',
    '정답 파일 역할 지도는 해당 단계의 변경 파일을 기준으로 하며 기존 파일 전체의 호출 그래프가 아니다.',
    '실습 API의 실제 HTTP·DB 채점은 학습자가 구현한 서버를 대상으로 별도로 실행해야 한다.',
  ],
  totals, failures, levels: items,
};
fs.writeFileSync(path.join(root, 'docs/scenario-visual-state.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, totals, failures }, null, 2));
if (failures.length) process.exitCode = 1;
