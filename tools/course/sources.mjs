// 날짜별 편집 원본을 읽는다. 호환용 합본은 입력으로 사용하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const GENERATED_NOTICE = '생성물: course/days/Dnn.json과 _common.json에서 tools/course/build-sources.mjs가 만든다. 직접 읽거나 고치지 마라. tools/site에서 npm run build로 재생성한다.';
const read = (file) => fs.readFileSync(file, 'utf8');

export function loadCourseSources(root = ROOT) {
  const dir = path.join(root, 'course/days');
  const common = JSON.parse(read(path.join(dir, '_common.json')));
  for (const [key, reserved] of [['roadmap', ['days', 'java']], ['hints', ['days']]]) {
    if (!common[key] || typeof common[key] !== 'object' || Array.isArray(common[key])) throw new Error(`_common.json: ${key} 객체가 필요하다`);
    for (const field of reserved) if (field in common[key]) throw new Error(`_common.json: ${key}.${field}는 날짜 파일에서만 관리한다`);
  }
  if (typeof common.cardsPreamble !== 'string') throw new Error('_common.json: cardsPreamble 문자열이 필요하다');
  const names = fs.readdirSync(dir).filter((name) => /^D.*\.json$/.test(name)).sort();
  for (const name of names) if (!/^D\d{2}\.json$/.test(name)) throw new Error(`course/days/${name}: 파일명은 Dnn.json이어야 한다`);
  if (!names.length) throw new Error('course/days/D00.json이 없다');
  const days = [];
  const java = [];
  const hintsDays = {};
  let cards = common.cardsPreamble;
  for (const [index, name] of names.entries()) {
    const id = `D${String(index).padStart(2, '0')}`;
    if (name !== `${id}.json`) throw new Error(`course/days/${id}.json이 없거나 날짜 순서가 어긋났다`);
    const day = JSON.parse(read(path.join(dir, name)));
    const fail = (field) => { throw new Error(`course/days/${name}: ${id} ${field}가 날짜 계약과 다르다`); };
    if (day.id !== id) fail('id');
    const javaId = `J${id.slice(1)}`;
    if (day.java?.id !== javaId || day.java.day !== (index === 0 ? null : id)) fail('java');
    if (index === 0) {
      if (day.roadmap !== null || day.hints !== null || day.cards !== '') fail('D00 roadmap·hints·cards');
    } else {
      if (day.roadmap?.id !== id || day.roadmap.java !== javaId) fail('roadmap');
      if (day.hints !== null && (!day.hints || typeof day.hints !== 'object' || Array.isArray(day.hints))) fail('hints');
      if (typeof day.cards !== 'string') fail('cards');
      const headings = [...day.cards.matchAll(/^## (D\d{2}) .+$/gm)].map((m) => m[1]);
      const cardIds = [...day.cards.matchAll(/^###\s+(TC-\S+)/gm)].map((m) => m[1]);
      if (headings.length !== 1 || headings[0] !== id || !Array.isArray(day.roadmap.talkCards)
          || cardIds.join(',') !== day.roadmap.talkCards.join(',')
          || new Set(cardIds).size !== cardIds.length || cardIds.some((c) => !c.startsWith(`TC-${id}-`))) fail('cards');
      days.push(day.roadmap);
      if (day.hints !== null) hintsDays[id] = day.hints;
    }
    java.push(day.java);
    cards += day.cards;
  }
  // 기존 합본의 키 순서까지 보존한다(apiGuide는 days 뒤에 있었다).
  const { apiGuide, ...hintsCommon } = common.hints;
  return {
    roadmap: { ...common.roadmap, days, java },
    hints: { ...hintsCommon, days: hintsDays, ...(apiGuide === undefined ? {} : { apiGuide }) },
    cards,
  };
}

export function sourceBundles({ roadmap, hints, cards }) {
  const json = (data) => `${JSON.stringify({ $comment: GENERATED_NOTICE, ...data }, null, 2)}\n`;
  return new Map([
    ['course/roadmap.json', json(roadmap)],
    ['course/hints.json', json(hints)],
    ['course/talk-cards.md', cards],
  ]);
}

export function checkSourceBundles(root = ROOT) {
  return [...sourceBundles(loadCourseSources(root))].filter(([rel, content]) => {
    const file = path.join(root, rel);
    return !fs.existsSync(file) || read(file) !== content;
  }).map(([rel]) => rel);
}
