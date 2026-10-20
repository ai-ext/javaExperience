// 생성된 101개 화면에서 시안·구성요소·흐름·요청 버튼의 누락을 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scenario/scenario.json'), 'utf8'));
const items = [];
const failures = [];
const knowledgeDocs = [];
const decodeCode = (value) => value.replace(/&#10;/g, '\n').replace(/&quot;/g, '"')
  .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

for (const filename of fs.readdirSync(path.join(root, 'docs/knowledge')).filter((name) => /^[A-Z]\d{2}-.*\.md$/.test(name))) {
  const sourcePath = path.join(root, 'docs/knowledge', filename);
  let fenced = false;
  let expectedTopics = 0;
  for (const line of fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (!fenced && /^### /.test(line)) expectedTopics++;
  }
  const htmlPath = sourcePath.replace(/\.md$/, '.html');
  if (!fs.existsSync(htmlPath)) { failures.push(`${filename}: 공부자료 HTML 없음`); continue; }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const headings = [...html.matchAll(/<details class="knowledge-chapter"><summary id="([^"]+)"/g)];
  const topics = [...html.matchAll(/<details class="knowledge-topic"><summary id="([^"]+)"/g)];
  const cards = (html.match(/<details class="knowledge-chapter">/g) || []).length;
  const mapSteps = (html.match(/class="knowledge-page-step"/g) || []).length;
  if (!cards || cards !== headings.length || cards !== mapSteps) failures.push(`${filename}: 공부자료 주제 지도 ${mapSteps}, 접기 카드 ${cards}, 앵커 ${headings.length}`);
  if (topics.length !== expectedTopics) failures.push(`${filename}: 하위 주제 카드 ${topics.length}/${expectedTopics}`);
  for (const [, id] of headings) {
    if (!html.includes(`href="#${id}"`)) failures.push(`${filename}: ${id} 앵커 링크 없음`);
  }
  if (new Set([...headings, ...topics].map(([, id]) => id)).size !== headings.length + topics.length)
    failures.push(`${filename}: 주제 앵커가 중복됨`);
  knowledgeDocs.push({ id: filename.slice(0, 3), sections: cards, topics: topics.length });
}

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
  const answer = JSON.parse(fs.readFileSync(path.join(root, 'scenario/answers', `${level.id}.json`), 'utf8'));
  const expectedFiles = [...answer.files];
  const mybatisPath = path.join(root, 'scenario/alternatives/mybatis', `${level.id}.json`);
  if (fs.existsSync(mybatisPath)) expectedFiles.push(...JSON.parse(fs.readFileSync(mybatisPath, 'utf8')).files);
  if (level.id === '9-5') {
    for (const filename of ['9-5-v5.json', '9-5-v5-mybatis.json', '9-5-note-read.json', '9-5-note-read-mybatis.json', '9-5-note-only.json', '9-5-v7-drop.json']) {
      expectedFiles.push(...JSON.parse(fs.readFileSync(path.join(root, 'scenario/alternatives/transitions', filename), 'utf8')).files);
    }
  }
  const codeFiles = [...html.matchAll(/<details class="code-file">([\s\S]*?)<\/details>/g)];
  const workbenches = (html.match(/class="code-workbench" data-code-workbench/g) || []).length;
  const expectedWorkbenchCount = 1 + Number(fs.existsSync(mybatisPath)) + (level.id === '9-5' ? 6 : 0);
  if (workbenches !== expectedWorkbenchCount)
    failures.push(`${level.id}: 코드 워크벤치 ${workbenches}/${expectedWorkbenchCount}`);
  if (!html.includes('class="cumulative-code"') || !html.includes('scenario-code-workbench.js'))
    failures.push(`${level.id}: 누적 코드 워크벤치 또는 상호작용 스크립트 누락`);
  if (roleMaps !== 1) failures.push(`${level.id}: 정답 파일 역할 지도 ${roleMaps}개`);
  if (lessonCards < 4) failures.push(`${level.id}: 학습 절 카드 ${lessonCards}개`);
  if (codeFiles.length !== expectedFiles.length) failures.push(`${level.id}: 전체 파일 코드 ${codeFiles.length}/${expectedFiles.length}`);
  if (codeFiles.some(([, body]) => /<pre><code>[\s\S]*?<p\b/.test(body) || body.includes('&amp;quot;')))
    failures.push(`${level.id}: 전체 코드 안에 문단 분리 또는 이중 이스케이프가 있음`);
  let exactCodeFiles = 0;
  expectedFiles.forEach((file, index) => {
    if (file.status === 'deleted') return;
    const encoded = codeFiles[index]?.[1].match(/<pre><code>([\s\S]*?)<\/code><\/pre>/)?.[1];
    if (encoded == null || decodeCode(encoded) !== file.content) failures.push(`${level.id}: ${file.path} 원문 코드 불일치`);
    else exactCodeFiles++;
  });
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
    codeFiles: codeFiles.length,
    codeWorkbenches: workbenches,
    exactCodeFiles,
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
  codeFiles: items.reduce((sum, item) => sum + item.codeFiles, 0),
  codeWorkbenches: items.reduce((sum, item) => sum + item.codeWorkbenches, 0),
  exactCodeFiles: items.reduce((sum, item) => sum + item.exactCodeFiles, 0),
  knowledgeDocs: knowledgeDocs.length,
  knowledgeSections: knowledgeDocs.reduce((sum, doc) => sum + doc.sections, 0),
  knowledgeTopics: knowledgeDocs.reduce((sum, doc) => sum + doc.topics, 0),
  manualOrTestFlowLevels: items.filter((item) => item.requestPractice === 'manual_or_test_flow').map((item) => item.id),
};
if (items.length !== 101) failures.push(`단계 수 ${items.length}/101`);
const imagegenMockups = [
  { path: 'docs/design/hibernate-knowledge-screen-v1.jpg', appliedTo: 'docs/knowledge/S09-jpa-hibernate.html', pattern: '버전 비교 카드와 원문 표' },
  { path: 'docs/design/scenario-code-workbench-v1.jpg', appliedTo: 'scenario/ch1-create-post/1-1-receive-request.html', pattern: '역할별 코드 탐색기와 누적 코드' },
];
for (const mockup of imagegenMockups) if (!fs.existsSync(path.join(root, mockup.path))) failures.push(`imagegen 시안 없음: ${mockup.path}`);
const report = {
  schemaVersion: 2,
  status: failures.length ? 'failed' : 'verified',
  scope: '101개 단계 화면의 시안·요소·흐름·전체 코드·학습 카드와 전체 공부자료 주제 지도의 정적 대조',
  imagegenMockups,
  design: [
    '단계 본문은 화면 JSON에서 그린 실제 DOM 시안과 선택 가능한 요청 흐름을 나란히 보여준다.',
    '정답 변경 파일의 역할 지도는 화면 시나리오와 구분하고, DBeaver는 MySQL 직접 접속의 별도 경로로 둔다.',
    '같은 SVG를 단계 화면에 중복하지 않고 카탈로그 미리보기에만 사용한다.',
    '장문 절은 단계별 카드에 넣고 요청 버튼·원문 코드·채점 기준을 보존한다.',
    '전체 코드 토글의 기본·MyBatis·배포 전환 파일을 모두 검사하고 삭제 파일을 제외한 코드를 원문과 문자 단위로 대조한다.',
    '공부자료의 실제 절과 하위 주제를 접기 카드로 연결하고 원문 본문·코드·앵커를 보존한다.',
  ],
  limits: [
    '빛으로 표시하는 계층은 시나리오의 예상 흐름이며 실제 Spring Boot 내부 호출 추적이 아니다.',
    '정답 파일 역할 지도는 해당 단계의 변경 파일을 기준으로 하며 기존 파일 전체의 호출 그래프가 아니다.',
    '실습 API의 실제 HTTP·DB 채점은 학습자가 구현한 서버를 대상으로 별도로 실행해야 한다.',
  ],
  totals, failures, levels: items, knowledgeDocs,
};
fs.writeFileSync(path.join(root, 'docs/scenario-visual-state.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, totals, failures }, null, 2));
if (failures.length) process.exitCode = 1;
