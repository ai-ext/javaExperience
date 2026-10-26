// 공개 학습 자료의 출처 인덱스를 현재 checkout의 원본만 사용해 생성한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'service/generated-source-index.json');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const localPath = (value) => String(value || '').replaceAll('\\', '/').replace(/^\.\//, '');
const unique = (values) => [...new Set(values.filter(Boolean))];

function linksIn(markdown) {
  return [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((href) => href && !/^(?:https?:|mailto:|#)/i.test(href))
    .map(localPath);
}

function apiChecks(text, refs = []) {
  const checks = [];
  const combined = [text, ...refs].filter(Boolean).join('\n');
  for (const match of combined.matchAll(/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(https?:\/\/[^\s`"'<>]+|\/[^\s`"'<>]*)/g)) {
    const pathValue = match[2].replace(/[),.;]+$/, '');
    const check = { method: match[1], path: pathValue, evidence: match[0] };
    if (!checks.some((item) => item.method === check.method && item.path === check.path)) checks.push(check);
  }
  return checks;
}

function structuredApiRefs(markdown) {
  const refs = [];
  let blockNo = 0;
  for (const block of markdown.matchAll(/```check\s*\n([\s\S]*?)\n```/g)) {
    blockNo += 1;
    const manifest = JSON.parse(block[1]);
    const requests = Array.isArray(manifest) ? manifest : manifest.requests;
    if (!Array.isArray(requests)) continue;
    const checks = Array.isArray(manifest.checks) ? manifest.checks : [];
    for (const request of requests) {
      if (!request.method || !request.path) continue;
      const requestChecks = checks.filter((check) => check.request === request.id || check.all?.some((item) => item.request === request.id));
      refs.push({
        requestId: request.id || null,
        method: request.method,
        path: request.path,
        sourceBlock: blockNo,
        checkIds: requestChecks.map((check) => check.id).filter(Boolean),
      });
    }
  }
  return refs;
}

function sectionListItems(markdown, names) {
  const sections = [...markdown.matchAll(/^##\s+(.+)\s*$/gm)];
  const items = [];
  for (let index = 0; index < sections.length; index += 1) {
    const title = sections[index][1].replace(/[`*]/g, '').trim();
    if (!names.test(title)) continue;
    const start = sections[index].index + sections[index][0].length;
    const end = sections[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(start, end);
    for (const line of section.split('\n')) {
      const item = line.match(/^\s*(?:[-*+]\s+|\d+\.\s+|\[[ xX]\]\s+)(.+)$/)?.[1]?.trim();
      if (item) items.push(item);
    }
  }
  return unique(items);
}

function courseUnits() {
  const files = fs.readdirSync(path.join(ROOT, 'course/days'))
    .filter((name) => /^D\d{2}\.json$/.test(name)).sort();
  if (files.length !== 46 || !files.includes('D00.json')) throw new Error(`course/days 원본 수가 예상과 다릅니다: ${files.length}`);
  const units = [];
  for (const file of files) {
    const rel = `course/days/${file}`;
    const day = readJson(rel);
    const dayId = day.id;
    const dayTitle = day.roadmap?.title || day.java?.topic || dayId;
    const searchAliases = unique([dayId, dayTitle, ...dayTitle.split(/[\s·,:/]+/).filter((term) => term.length > 1)]);
    if (dayId === 'D00') {
      units.push({
        id: 'course:D00', kind: 'course', title: day.java?.topic || 'Java 워밍업',
        dayId, dayTitle, searchAliases,
        href: 'course/spring/D00.html#오늘-할-것', project: 'board', required: true,
        requirements: day.java?.basics ? [day.java.basics] : [], hints: day.hints || [],
        apiRefs: [], sourceRefs: [{ path: rel, pointer: '/java' }, ...existingSourceRefs(['course/java/J00.md'])],
      });
      continue;
    }
    const steps = day.roadmap?.steps || [];
    steps.forEach((step, index) => {
      const sourceId = `${dayId}-${step.no ?? index + 1}`;
      const hintSet = day.hints?.steps?.[String(step.no ?? index + 1)] || [];
      const sourceFiles = [
        ...(step.files || []), ...(step.fileActions?.create || []), ...(step.fileActions?.modify || []), ...(step.fileActions?.inspect || []),
      ];
      const related = [
        ...(day.java ? [`course/java/${day.java}.md`] : []),
        ...(step.tickets || []).map((ticket) => `course/tickets/${ticket}.md`),
        ...(step.guides || []),
        ...(step.specRefs || []).flatMap((ref) => ref.match(/\b[A-Z]\d{2}\b/g) || []),
      ];
      units.push({
        id: `course:${sourceId}`, kind: 'course', title: step.title,
        dayId, dayTitle, searchAliases,
        href: `course/spring/${dayId}.html#step-${sourceId.toLowerCase()}`, project: 'board', required: true,
        requirements: unique([step.requirement, ...(step.done || [])]), hints: hintSet,
        apiRefs: apiChecks([...(step.done || []), ...(step.specRefs || [])].join('\n')),
        sourceRefs: [
          { path: rel, pointer: `/roadmap/steps/${index}` },
          ...existingSourceRefs([...sourceFiles, ...related]),
          ...(step.dayRefs || []).map((ref) => ({ path: `course/days/${ref.day}.json`, pointer: `/roadmap/steps/${index}/dayRefs` })),
        ],
      });
    });
  }
  return units;
}

function existingSourceRefs(paths) {
  return unique(paths.map(localPath)).filter((rel) => fs.existsSync(path.join(ROOT, rel))).map((rel) => ({ path: rel }));
}

function supportingProject(sourcePath) {
  if (sourcePath.startsWith('course/java/')) return 'java-track';
  if (sourcePath.startsWith('course/tickets/')) return 'board';
  if (sourcePath.includes('/l15-')) return 'project-v1';
  if (sourcePath.includes('/l16-')) return 'community';
  if (sourcePath.includes('/db-query-journey/') || /\/l1[234]-/.test(sourcePath)) return 'practice';
  return 'community';
}

function scenarioUnits() {
  const manifest = readJson('scenario/scenario.json');
  const units = [];
  for (const chapter of manifest.chapters) for (const level of chapter.levels) {
    if (!level.file) continue;
    const sourcePath = `scenario/${chapter.dir}/${level.file}`;
    if (!fs.existsSync(path.join(ROOT, sourcePath))) throw new Error(`scenario 원본 누락: ${sourcePath}`);
    const body = readText(sourcePath);
    const title = level.title || body.match(/^#\s+(.+)$/m)?.[1] || level.id;
    const requirementItems = sectionListItems(body, /만들 것|직접 확인|채점 기준|완료 기준|제출물/);
    const hints = sectionListItems(body, /^힌트/);
    units.push({
      id: `legacy:${level.id}`, kind: 'legacy-scenario', title,
      href: sourcePath.replace(/\.md$/, '.html'), project: String(level.id).startsWith('10-') ? 'project-v1' : 'community', required: !/\*\*선택 단계/.test(body.slice(0, 500)),
      requirements: requirementItems, hints, apiRefs: [...structuredApiRefs(body), ...apiChecks(body)],
      sourceRefs: [{ path: sourcePath }, ...existingSourceRefs(linksIn(body))],
    });
  }
  return units;
}

function supportingUnits() {
  const files = [];
  const collect = (folder, predicate) => {
    const absolute = path.join(ROOT, folder);
    if (!fs.existsSync(absolute)) return;
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && predicate(entry.name, full)) files.push(path.relative(ROOT, full).split(path.sep).join('/'));
      }
    };
    walk(absolute);
  };
  collect('scenario/db-query-journey', (name) => name.endsWith('.md'));
  collect('scenario/labs', (name, full) => name === 'README.md' && path.basename(path.dirname(full)) !== 'labs');
  collect('course/java', (name) => /^J\d{2}\.md$/.test(name));
  // 새 티켓 목록은 탐색용 진입점이다. 개별 과제와 중복해 학습 단위로 세지 않는다.
  collect('course/tickets', (name) => name.endsWith('.md') && name !== 'README.md');
  return unique(files).sort().map((sourcePath) => {
    const body = readText(sourcePath);
    const title = body.match(/^#\s+(.+)$/m)?.[1]?.replace(/[`*]/g, '').trim() || path.basename(sourcePath, '.md');
    const id = `support:${sourcePath}`;
    return {
      id,
      kind: sourcePath.startsWith('course/java/') ? 'java-exercise' : sourcePath.startsWith('course/tickets/') ? 'course-ticket' : sourcePath.includes('/labs/') ? 'database-lab' : 'database-journey',
      title,
      href: sourcePath.replace(/\.md$/, '.html'),
      project: supportingProject(sourcePath),
      required: false,
      requirements: sectionListItems(body, /만들 것|직접 확인|채점 기준|완료 기준|제출물/),
      hints: sectionListItems(body, /^힌트/),
      apiRefs: [...structuredApiRefs(body), ...apiChecks(body)],
      sourceRefs: [{ path: sourcePath }, ...existingSourceRefs(linksIn(body))],
    };
  });
}

function functionalUnits() {
  const features = [
    ['create', 'create-post'], ['detail', 'read-post'], ['list', 'list-posts'],
    ['update', 'update-post'], ['delete', 'delete-post'], ['like', 'like-post'], ['unlike', 'unlike-post'],
  ];
  return features.map(([id, filename]) => {
    const sourcePath = `scenario/flow/${filename}.md`;
    const body = readText(sourcePath);
    return {
      id: `functional:${id}`, kind: 'functional', title: body.match(/^#\s+(.+)$/m)?.[1] || id,
      href: sourcePath.replace(/\.md$/, '.html'), project: 'community', required: true,
      requirements: sectionListItems(body, /요구사항|만들 것|직접 확인|채점 기준|완료 기준|제출물/),
      hints: sectionListItems(body, /^힌트/), apiRefs: [...structuredApiRefs(body), ...apiChecks(body)], sourceRefs: [{ path: sourcePath }, ...existingSourceRefs(linksIn(body))],
    };
  });
}

export function buildSourceIndex() {
  const requiredUnits = [...courseUnits(), ...scenarioUnits(), ...functionalUnits()];
  const supportUnits = supportingUnits();
  const units = [...requiredUnits, ...supportUnits];
  const requiredIds = requiredUnits.map((unit) => unit.id);
  const counts = {
    courseDays: 46,
    courseUnits: requiredUnits.filter((unit) => unit.id.startsWith('course:')).length,
    scenarioCatalog: requiredUnits.filter((unit) => unit.id.startsWith('legacy:')).length,
    functionalFeatures: requiredUnits.filter((unit) => unit.id.startsWith('functional:')).length,
    requiredUnits: requiredUnits.length,
    supportingUnits: supportUnits.length,
  };
  const ids = units.map((unit) => unit.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (counts.courseUnits !== 136 || counts.scenarioCatalog !== 101 || counts.functionalFeatures !== 7 || counts.requiredUnits !== 244 || duplicates.length || requiredIds.length !== 244) {
    throw new Error(`source coverage 오류: ${JSON.stringify({ counts, duplicates })}`);
  }
  return { version: 1, units };
}

const index = buildSourceIndex();
const output = `${JSON.stringify(index, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== output) throw new Error('service/generated-source-index.json이 원본과 다릅니다. npm run build:service-sources 실행');
  console.log(`source index OK: ${index.units.length} units`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, output);
  console.log(`generated ${path.relative(ROOT, OUT)} (${index.units.length} units)`);
}
