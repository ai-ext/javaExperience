// 사이트 빌드 — 레포의 .md를 같은 자리에 .html로 렌더링한다(클론 후 브라우저로 바로 열 수 있게).
//   대상: README.md, docs/knowledge/*.md, scenario/**/*.md, practice/*.md
//   - 제목에 앵커(id)를 붙이고, 상대 .md 링크는 .html로 바꾼다
//   - 본문에 나오는 문서 ID(예: P19)는 그 공부자료로 자동 링크한다
//   - scenario/scenario.json에 있는 단계 페이지에는 "결과 테스트 프롬프트" 칸과 이전/다음 이동을 붙인다
//   - scenario/README.md의 목차(<!-- toc:start --> ~ <!-- toc:end -->)를 scenario.json으로 다시 쓴다
//   - 상대 링크의 파일이나 앵커가 없으면 실패한다(깨진 링크를 커밋하지 않게)
// 실행: cd tools/site && npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderConceptLesson } from './concept-lesson.mjs';
import { renderInitialPage } from './initial-render.mjs';
import { Marked } from 'marked';
import { renderSpringConfigTabs } from './spring-config-tabs.mjs';
import { buildSync } from 'esbuild';
import { renderScreen, withImplementationCode } from './scenario-content.mjs';
import { renderCatalog, renderStage } from './api-architecture-view.mjs';
import { renderTaskFocus } from './task-focus.mjs';
import { renderLearningJourney } from './learning-journey.mjs';
import { renderKnowledgeVisual } from './knowledge-visual.mjs';
import { renderCoreLearning } from './core-learning.mjs';
import { validateCurriculum } from './concept-curriculum.mjs';
import { loadKnowledgeCatalog } from './knowledge-catalog-data.mjs';
import { renderP16JsonVisual } from './p16-json-visual.mjs';
import { renderP16ContractLearning } from './p16-contract-learning.mjs';
import { renderP16ExecutionEvidence } from './p16-execution-evidence.mjs';
import { renderP09Learning } from './p09-learning.mjs';
import { renderP04Learning } from './p04-learning.mjs';
import { renderW09Learning } from './w09-learning.mjs';
import { renderP19Learning } from './p19-learning.mjs';
import { renderP20Learning, renderP20Supplementary } from './p20-learning.mjs';
import { renderS09Learning, renderS09Supplementary } from './s09-learning.mjs';
import { renderS08Learning, renderS08Supplementary } from './s08-learning.mjs';
import { renderW11Learning, renderW11Supplementary } from './w11-learning.mjs';
import { renderR03Learning, renderR03Supplementary } from './r03-learning.mjs';
import { renderR04Learning, renderR04Supplementary } from './r04-learning.mjs';
import { renderW15Learning } from './w15-learning.mjs';
import { renderW15Supplementary } from './w15-supplement.mjs';
import { renderV04Learning } from './v04-learning.mjs';
import { renderV04Supplementary } from './v04-supplement.mjs';
import { renderB01Learning } from './b01-learning.mjs';
import { renderB01Supplementary } from './b01-supplement.mjs';
import { renderD01Learning } from './d01-learning.mjs';
import { renderD01Supplementary } from './d01-supplement.mjs';
import { renderD02Learning } from './d02-learning.mjs';
import { renderD03Learning } from './d03-learning.mjs';
import { renderD04Learning } from './d04-learning.mjs';
import { renderD05Learning } from './d05-learning.mjs';
import { renderD06Learning } from './d06-learning.mjs';
import { renderD07Learning } from './d07-learning.mjs';
import { renderD08Learning } from './d08-learning.mjs';
import { renderD09Learning } from './d09-learning.mjs';
import { renderD10Learning } from './d10-learning.mjs';
import { renderD11Learning } from './d11-learning.mjs';
import { renderD12Learning } from './d12-learning.mjs';
import { installD12InitialAnchorGuard } from './d12-source-diagrams.mjs';
import { renderD02Supplementary } from './d02-supplement.mjs';
import { renderD03Supplementary } from './d03-supplement.mjs';
import { renderD04Supplementary } from './d04-supplement.mjs';
import { renderD05Supplementary } from './d05-supplement.mjs';
import { renderD06Supplementary } from './d06-supplement.mjs';
import { renderD07Supplementary } from './d07-supplement.mjs';
import { renderD08Supplementary } from './d08-supplement.mjs';
import { renderD09Supplementary } from './d09-supplement.mjs';
import { renderD10Supplementary } from './d10-supplement.mjs';
import { renderKnowledgePageVisual, renderKnowledgePageSections } from './knowledge-page-visual.mjs';
import { renderKnowledgeReaderPage } from './knowledge-reader.mjs';
import { renderFunctionalWorkspace, renderFunctionalCatalog, renderFunctionalReferenceContext } from './functional-scenario.mjs';
import { getFunctionalTask } from './functional-scenario-data.mjs';
import { getFunctionalLikeTask } from './functional-like-data.mjs';
import { renderFunctionalLikeWorkspace } from './functional-like-workspace.mjs';
import { renderP02Focused } from './p02-focused.mjs';
import { renderConfigConceptScenes } from './config-concept-scenes.mjs';
import { renderMissionVisual } from './mission-visual.mjs';
import { renderMissionDetails } from './mission-detail-visual.mjs';
import { renderHomeVisual } from './home-visual.mjs';
import { renderNavigationCatalog } from './navigation-catalog.mjs';
import { renderSiteNavigation, renderSiteBreadcrumb, renderCatalogHeading, catalogPageTitle } from './site-navigation.mjs';
import { TASKS as HOME_TASKS } from './home-state.mjs';
import { renderLessonAtlas } from './lesson-atlas.mjs';
import { renderDbIndexExperiment } from './db-index-experiment.mjs';
import { renderSessionLabJourney } from './session-lab-journey.mjs';
import { renderInterfaceImplJourney } from './interface-impl-journey.mjs';
import { renderDb01FocusedJourney } from './db01-focused-journey.mjs';
import { renderDb02FocusedJourney } from './db02-focused-journey.mjs';
import { renderDb03FocusedJourney } from './db03-focused-journey.mjs';
import { renderDb04FocusedJourney } from './db04-focused-journey.mjs';
import { renderDb05FocusedJourney } from './db05-focused-journey.mjs';
import { renderDb06FocusedJourney } from './db06-focused-journey.mjs';
import { renderDb07FocusedJourney } from './db07-focused-journey.mjs';
import { renderDb08FocusedJourney } from './db08-focused-journey.mjs';
import { renderDb09FocusedJourney } from './db09-focused-journey.mjs';
import { renderDb10FocusedJourney } from './db10-focused-journey.mjs';
import { renderDb11FocusedJourney } from './db11-focused-journey.mjs';
import { renderDb12FocusedJourney } from './db12-focused-journey.mjs';
import { renderDb13FocusedJourney } from './db13-focused-journey.mjs';
import { renderDb14FocusedJourney } from './db14-focused-journey.mjs';
import { renderL12QueryJourney } from './l12-query-journey.mjs';
import { loadCourse, renderDayPage, renderExerciseNavigation, dayCrumbs, renderCourseHome, renderHomeReference, renderCourseMap, mapCrumbs, findInjectedLinkErrors, DAY_PAGE, MAP_PAGE } from './course-pages.mjs';
import { injectTicketFlow } from './course-flow.mjs';
import { renderCourseOutline } from './course-outline.mjs';
import { renderSemanticColors } from './course-semantic-colors.mjs';
import { renderContentKinds, renderContentVisual } from './course-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/core-learning.js')], outfile: path.join(ROOT, 'tools/site/core-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from core-learning.js by tools/site/build.mjs' } });
const SERVICE_PAGES_MODULE = path.join(ROOT, 'tools/site/service-feature-pages.mjs');
const servicePageRenderers = fs.existsSync(SERVICE_PAGES_MODULE) ? await import(SERVICE_PAGES_MODULE) : null;
function loadServicePageData() {
  const catalogPath = path.join(ROOT, 'service/catalog.json');
  if (!fs.existsSync(catalogPath) || !fs.existsSync(path.join(ROOT, 'service/generated-source-index.json')) || !fs.existsSync(path.join(ROOT, 'service/api-contracts.json'))) return null;
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const features = [];
  for (const entry of catalog.features || []) {
    if (!/^features\/[a-z0-9-]+\.json$/.test(entry.file || '')) throw new Error(`허용되지 않은 service feature 경로: ${entry.file}`);
    const featurePath = path.join(ROOT, 'service', entry.file || '');
    if (!entry.file || !fs.existsSync(featurePath)) return null;
    features.push(servicePageRenderers.mergeServiceFeatureEntry(entry, JSON.parse(fs.readFileSync(featurePath, 'utf8'))));
  }
  const apiContracts = JSON.parse(fs.readFileSync(path.join(ROOT, 'service/api-contracts.json'), 'utf8'));
  return {
    features,
    catalogFeatures: catalog.features || [],
    sourceIndex: JSON.parse(fs.readFileSync(path.join(ROOT, 'service/generated-source-index.json'), 'utf8')),
    apiRecipes: apiContracts.recipes || [],
    apiRoutes: apiContracts.routes || [],
  };
}
const SERVICE_PAGE_DATA = loadServicePageData();
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/p09-learning.js')], outfile: path.join(ROOT, 'tools/site/p09-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from p09-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/p04-learning.js')], outfile: path.join(ROOT, 'tools/site/p04-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from p04-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/p16-contract-learning.js')], outfile: path.join(ROOT, 'tools/site/p16-contract-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from p16-contract-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/w09-learning.js')], outfile: path.join(ROOT, 'tools/site/w09-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from w09-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/p19-learning.js')], outfile: path.join(ROOT, 'tools/site/p19-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from p19-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/p20-learning.js')], outfile: path.join(ROOT, 'tools/site/p20-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from p20-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/s09-learning.js')], outfile: path.join(ROOT, 'tools/site/s09-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from s09-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/s08-learning.js')], outfile: path.join(ROOT, 'tools/site/s08-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from s08-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/w11-learning.js')], outfile: path.join(ROOT, 'tools/site/w11-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from w11-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/r03-learning.js')], outfile: path.join(ROOT, 'tools/site/r03-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from r03-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/r04-learning.js')], outfile: path.join(ROOT, 'tools/site/r04-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from r04-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/w15-learning.js')], outfile: path.join(ROOT, 'tools/site/w15-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from w15-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/v04-learning.js')], outfile: path.join(ROOT, 'tools/site/v04-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from v04-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/b01-learning.js')], outfile: path.join(ROOT, 'tools/site/b01-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from b01-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d01-learning.js')], outfile: path.join(ROOT, 'tools/site/d01-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d01-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d02-learning.js')], outfile: path.join(ROOT, 'tools/site/d02-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d02-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d03-learning.js')], outfile: path.join(ROOT, 'tools/site/d03-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d03-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d04-learning.js')], outfile: path.join(ROOT, 'tools/site/d04-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d04-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d05-learning.js')], outfile: path.join(ROOT, 'tools/site/d05-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d05-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d06-learning.js')], outfile: path.join(ROOT, 'tools/site/d06-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d06-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d07-learning.js')], outfile: path.join(ROOT, 'tools/site/d07-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d07-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d08-learning.js')], outfile: path.join(ROOT, 'tools/site/d08-learning.bundle.js'), bundle: true, supported: { 'template-literal': false }, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d08-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d09-learning.js')], outfile: path.join(ROOT, 'tools/site/d09-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d09-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d10-learning.js')], outfile: path.join(ROOT, 'tools/site/d10-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d10-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d11-learning.js')], outfile: path.join(ROOT, 'tools/site/d11-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d11-learning.js by tools/site/build.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/d12-learning.js')], outfile: path.join(ROOT, 'tools/site/d12-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated from d12-learning.js by tools/site/build.mjs' } });
// 홈은 file://로 직접 열어도 초기화되도록 ESM 소스를 일반 script로 묶는다.
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/home-learning.mjs')], outfile: path.join(ROOT, 'tools/site/home-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated by tools/site/build.mjs from home-learning.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/knowledge-catalog-controller.mjs')], outfile: path.join(ROOT, 'tools/site/knowledge-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated by tools/site/build.mjs from knowledge-catalog-controller.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/course-api-entry.mjs')], outfile: path.join(ROOT, 'tools/site/course-api.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated by tools/site/build.mjs from course-api-entry.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/functional-visual-learning.mjs')], outfile: path.join(ROOT, 'tools/site/functional-visual-learning.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated by tools/site/build.mjs from functional-visual-learning.mjs' } });
buildSync({ entryPoints: [path.join(ROOT, 'tools/site/functional-reference-entry.mjs')], outfile: path.join(ROOT, 'tools/site/functional-reference.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated by tools/site/build.mjs from functional-reference-entry.mjs' } });
if (fs.existsSync(path.join(ROOT, 'tools/site/service-feature-entry.mjs'))) buildSync({ entryPoints: [path.join(ROOT, 'tools/site/service-feature-entry.mjs')], outfile: path.join(ROOT, 'tools/site/service-feature.bundle.js'), bundle: true, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'none', banner: { js: '// Generated by tools/site/build.mjs from service-feature-entry.mjs' } });
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
// 과정 v2(course/) 데이터: days/Dnn.json + map-tickets.json. 일자 페이지·홈·과정 지도가 함께 쓴다.
const COURSE = loadCourse(ROOT);
const read = (p) => fs.readFileSync(p, 'utf8');
const assetUrl = (p, fromDir) => {
  const digest = createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 12);
  const relative = path.relative(fromDir, path.join(ROOT, p)).split(path.sep).join('/');
  return `${relative}?v=${digest}`;
};
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const R03_LITERAL_DEL_RAW = new Set(['~127, unsigned 0~', '~2⁶³-1 / unsigned 0~']);
const escapeTextarea = (s) => escapeHtml(s).replace(/\r/g, '&#13;').replace(/[ \t]+(?=\n|$)/gm, (trailing) => [...trailing].map((char) => char === '\t' ? '&#9;' : '&#32;').join(''));
const stripTags = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
// GitHub과 같은 규칙의 앵커: 소문자, 글자·숫자·공백·-·_만 남기고 공백은 -로
const slugify = (text) => text.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');

// ---------------------------------------------------------------- 대상 파일
function listMd() {
  const out = [path.join(ROOT, 'README.md')];
  const walk = (dir) => {
    // 날짜 원본과 편집 안내는 학습자 페이지로 렌더링하지 않는다.
    if (dir === path.join(ROOT, 'course/days')) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  out.push(path.join(ROOT, 'errors.md'));
  // 홈·과정 안내에서 여는 현재 확장 설계와 원장만 공개 문서로 렌더링한다.
  for (const name of ['2026-10-24-p9-d16-d30.md', '2026-10-24-p9-ledger.md']) {
    out.push(path.join(ROOT, 'docs/course-redesign/plans', name));
  }
  for (const d of ['docs/knowledge', 'scenario', 'practice', 'lessons', 'tickets', 'course']) if (fs.existsSync(path.join(ROOT, d))) walk(path.join(ROOT, d));
  return out;
}

// 공부자료 ID → 파일(예: P19 → docs/knowledge/P19-mysql-jpa-setup.md)
const DOC_DIR = path.join(ROOT, 'docs/knowledge');
const DOC_BY_ID = new Map(fs.readdirSync(DOC_DIR).filter((f) => /^[A-Z]\d{2}-.*\.md$/.test(f)).map((f) => [f.slice(0, 3), path.join(DOC_DIR, f)]));
const FUNCTIONAL_ASSETS = JSON.parse(read(path.join(ROOT, 'docs/design/scenario-crud-2026-10-20/approved-assets.json')));

// ---------------------------------------------------------------- 시나리오 목록(scenario.json)
const MANIFEST = JSON.parse(read(path.join(ROOT, 'scenario/scenario.json')));
const API_ARCHITECTURE = JSON.parse(read(path.join(ROOT, 'scenario/api-architecture.json')));
const CHAPTERS = [
  ...MANIFEST.chapters.filter((ch) => ch.project !== 'spec-board'),
  ...MANIFEST.chapters.filter((ch) => ch.project === 'spec-board'),
];
const LEVELS = []; // 준비된 단계만, 순서대로
for (const ch of CHAPTERS) {
  for (const lv of ch.levels) {
    if (ch.status !== 'planned' && lv.file) LEVELS.push({ ...lv, chapter: ch, abs: path.join(ROOT, 'scenario', ch.dir, lv.file) });
  }
}
const LEVEL_BY_ABS = new Map(LEVELS.map((l, i) => [l.abs, { ...l, index: i }]));
const REFERENCE_LEGACY_PATHS = LEVELS.map(level => rel(level.abs).replace(/\.md$/, '.html'));
const REFERENCE_KNOWLEDGE_PATHS = [path.join(DOC_DIR, 'README.md'), ...DOC_BY_ID.values()].map(file => rel(file).replace(/\.md$/, '.html'));
const LABS = fs.readdirSync(path.join(ROOT, 'scenario/labs'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(ROOT, 'scenario/labs', entry.name, 'README.md'))
  .filter((abs) => fs.existsSync(abs))
  .map((abs) => ({ abs, id: read(abs).match(/^# (L\d+)\./m)?.[1] }))
  .filter((lab) => lab.id);
const LAB_BY_ABS = new Map(LABS.map((lab) => [lab.abs, lab]));
const STAGE_BY_ID = new Map([...LEVELS, ...LABS].map((stage) => [stage.id, stage]));
const NON_API_STAGE_NOTES = {
  '1-7': 'DBeaver 또는 SQL 클라이언트가 MySQL에 직접 접속해 여러 테이블과 트랜잭션을 확인하는 단계입니다.',
  '7-1': 'Controller 테스트가 기존 HTTP 요청·응답 계약을 확인하는 단계입니다.',
  '7-2': 'Service 단위 테스트가 기존 비즈니스 규칙을 확인하는 단계입니다.',
  '7-3': '통합 테스트가 Spring Boot와 MySQL을 함께 확인하는 단계입니다.',
  '9-1': 'Flyway가 MySQL 스키마를 관리하는 단계입니다.',
  '13-7': '기존 API를 Swagger UI로 문서화하는 단계입니다. 새 Controller 경로는 만들지 않습니다.',
};

function writeToc() {
  const p = path.join(ROOT, 'scenario/README.md');
  const src = read(p);
  const lines = [];
  for (const ch of CHAPTERS) {
    const planned = ch.status === 'planned';
    lines.push(`### ${ch.title}${planned ? ' — 준비 중' : ''}`, '', ch.summary, '');
    for (const lv of ch.levels) {
      const grade = { basic: '기초', intermediate: '중급', advanced: '고급' }[lv.difficulty] || '';
      const label = `${lv.id}. ${lv.title}${grade ? ` · ${grade}` : ''}`;
      lines.push(planned || !lv.file ? `- ${label}` : `- [${label}](${ch.dir}/${lv.file})`);
    }
    lines.push('');
  }
  const toc = `<!-- toc:start — tools/site/build.mjs가 scenario.json으로 다시 쓴다. 직접 고치지 마라 -->\n${lines.join('\n')}<!-- toc:end -->`;
  const next = src.replace(/<!-- toc:start[\s\S]*?<!-- toc:end -->/, toc);
  if (next === src && !src.includes('<!-- toc:start')) throw new Error('scenario/README.md에 toc 표시가 없다');
  fs.writeFileSync(p, next);
}

// ---------------------------------------------------------------- 렌더링
function render(abs) {
  const dir = path.dirname(abs);
  const anchors = new Set();
  const links = []; // {href, target, hash}
  const seen = new Map();
  let hasMermaid = false;
  let hasDbIndexExperiment = false;
  let requestBlockCount = 0;
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(stripTags(html));
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        anchors.add(id);
        return `<h${depth} id="${escapeHtml(id)}"><a class="anchor" href="#${escapeHtml(id)}" aria-hidden="true">#</a>${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if ((lang || '').trim() === 'course-visual') return renderContentVisual(JSON.parse(text));
        if ((lang || '').trim() === 'check') return renderRequests(text, ++requestBlockCount, abs);
        if ((lang || '').trim() === 'db-index-experiment') {
          hasDbIndexExperiment = true;
          return renderDbIndexExperiment();
        }
        if ((lang || '').trim() === 'manual-command') return `<details class="manual-command"><summary>터미널 명령어 참고</summary><pre><code>${escapeHtml(text)}</code></pre></details>\n`;
        if ((lang || '').trim() === 'screen') {
          const stageId = LEVEL_BY_ABS.get(abs)?.id;
          const answerPath = stageId && path.join(ROOT, 'scenario/answers', `${stageId}.json`);
          const answerFiles = answerPath && fs.existsSync(answerPath)
            ? JSON.parse(fs.readFileSync(answerPath, 'utf8')).files : [];
          return renderScreen(text, { stageId, answerFiles });
        }
        if ((lang || '').trim() === 'mermaid') {
          hasMermaid = true;
          return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
        }
        const cls = lang ? ` class="language-${escapeHtml(lang.trim().split(/\s+/)[0])}"` : '';
        return `<pre><code${cls}>${escapeHtml(text)}</code></pre>\n`;
      },
      del(token) {
        if (abs === path.join(ROOT, 'docs/knowledge/R03-schema-types-constraints.md') && R03_LITERAL_DEL_RAW.has(token.raw)) {
          return escapeHtml(token.raw);
        }
        return false;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener">${text}</a>`;
        const [p, hash = ''] = href.split('#');
        const target = p ? path.resolve(dir, decodeURI(p)) : abs;
        links.push({ href, target, hash: decodeURIComponent(hash) });
        const out = p.endsWith('.md') ? p.slice(0, -3) + '.html' : p;
        return `<a href="${escapeHtml(out + (hash ? '#' + hash : ''))}"${t}>${text}</a>`;
      },
    },
  });
  const level = LEVEL_BY_ABS.get(abs);
  let source = level ? withImplementationCode(read(abs), ROOT, level.id, abs) : read(abs);
  if (level) {
    // HTTP 요청은 check 블록의 버튼으로 명시한다. 직접 확인에 curl이 남으면 중복 안내가 다시 생긴다.
    const directCheck = source.match(/## 직접 확인([\s\S]*?)(?=\n## |$)/)?.[1] || '';
    if (/\bcurl\b/.test(directCheck)) throw new Error(`${rel(abs)}: 직접 확인의 curl을 check 요청으로 옮겨야 한다`);
    // DB 조회와 빌드처럼 브라우저에서 할 수 없는 터미널 명령만 접어 둔다.
    source = source.replace(/(## 직접 확인[\s\S]*?)(?=\n## |$)/, (section) => section.replace(/```(?:bash|sh|shell)\n([\s\S]*?)\n```/g, '```manual-command\n$1\n```'));
  }
  if (rel(abs).startsWith('course/')) source = renderSpringConfigTabs(source);
  let html = marked.parse(source);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  if (abs === path.join(ROOT, 'scenario/README.md')) {
    html = collapseSection(html, '시나리오 데이터', '시나리오 데이터 · community DB');
    html = collapseSection(html, '8·9장은 학습용 데이터', '학습용 데이터 · practice DB');
    html = collapseSection(html, '브라우저에서 API 요청 보내기', '요청이 안 될 때 · 로컬 서버와 CORS 설정');
  }
  // course/의 D01·J04·B01은 일자·트랙·티켓 ID라서 같은 모양의 공부자료 ID 링크를 붙이지 않는다.
  if (!rel(abs).startsWith('course/')) html = autolinkDocIds(html, abs);
  // 일자 순서처럼 원문 HTML에 명시한 id도 Markdown 링크의 앵커 대상이다.
  // fenced 코드의 HTML은 이미 escape됐으므로 실제 태그에서만 수집한다.
  for (const match of html.matchAll(/<[a-z][^>]*\bid="([^"]+)"/gi)) anchors.add(match[1]);
  return { html, anchors, links, hasMermaid, hasDbIndexExperiment };
}

function collapseSection(html, headingText, summary) {
  const headings = [...html.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/g)];
  const heading = headings.find((match) => stripTags(match[0]).includes(headingText));
  if (!heading) throw new Error(`scenario/README.md에 접을 섹션이 없다: ${headingText}`);
  const start = heading.index;
  const next = headings.find((match) => match.index > start);
  const end = next?.index ?? html.length;
  return `${html.slice(0, start)}<details class="catalog-data"><summary>${summary}</summary>${html.slice(start, end)}</details>${html.slice(end)}`;
}

function leadWithVisualScenario(html, stageId) {
  const titleEnd = html.indexOf('</h1>') + 5;
  const visualStart = html.indexOf('<h2 id="화면-시나리오"', titleEnd);
  const visualEnd = html.indexOf('<h2', visualStart + 4);
  if (titleEnd < 5 || visualStart < titleEnd || visualEnd < visualStart) {
    throw new Error(`${stageId}: 화면 시나리오 구간을 찾지 못했다`);
  }
  return html.slice(0, titleEnd) + html.slice(visualStart, visualEnd)
    + html.slice(titleEnd, visualStart) + html.slice(visualEnd);
}

// 본문 텍스트의 "P19" 같은 문서 ID를 공부자료 링크로 바꾼다(코드·링크·제목 안은 건드리지 않는다)
function autolinkDocIds(html, abs) {
  const selfId = path.basename(abs).slice(0, 3);
  const parts = html.split(/(<[^>]+>)/);
  let skip = 0;
  return parts.map((part) => {
    if (part.startsWith('<')) {
      const m = part.match(/^<(\/?)(pre|code|a|h[1-6])\b/i);
      if (m) skip += m[1] ? -1 : 1;
      return part;
    }
    if (skip > 0) return part;
    return part.replace(/\b([BDJPRSVW]\d{2})\b/g, (id) => {
      const f = DOC_BY_ID.get(id);
      if (!f || id === selfId) return id;
      const href = path.relative(path.dirname(abs), f).split(path.sep).join('/').replace(/\.md$/, '.html');
      return `<a class="docref" href="${href}">${id}</a>`;
    });
  }).join('');
}

// ---------------------------------------------------------------- 결과 테스트 프롬프트
function promptTemplate(lv) {
  const mdPath = rel(lv.abs);
  const db = lv.db || lv.chapter.db || 'community';
  const dbNote = db === 'practice'
    ? "\n이 단계는 학습용 DB(practice)를 쓴다. 앱이 practice 프로파일로 떠 있어야 한다(README의 \"학습용 데이터로 앱 실행\"). 아니면 그 방법만 알려 주고 멈춰라."
    : '';
  return `[javaExperience 결과 테스트] ${lv.id}. ${lv.title}
레포 경로: {{REPO}}
서버 주소: {{BASE}}

너는 이 레포로 Spring Boot 백엔드를 배우는 사람의 리뷰어다.${dbNote}
지킬 것: 코드는 절대 수정하지 마라. DB는 SELECT만 한다. 서버를 대신 띄우거나 끄지 마라. 정답 코드를 통째로 주지 말고 방향과 힌트로 알려 줘라.

1. {{REPO_STEP}} \`${mdPath}\` 를 읽어라. 그 파일의 "채점 기준" 표가 통과/실패의 유일한 기준이다. 표에 없는 것으로 실패 처리하지 말고, 다른 단계의 기준은 보지 마라.
2. 서버 주소의 응답 가능 여부를 확인해라. 꺼져 있으면 README의 "실행" 방법만 알려 주고 멈춰라.
3. C 항목(HTTP)을 표의 순서대로 확인해라. 단계 페이지의 요청 정의(method·경로·헤더·본문)를 그대로 보내고, 동적 값은 앞선 응답의 참조 규칙을 따른다. 상태 코드·응답 헤더·본문을 기대값과 비교해라.
4. D 항목(DB)은 레포 루트에서 \`docker compose exec -T mysql mysql -ucommunity -pcommunity ${db} -e "<SELECT 문>"\` 으로 조회만 해라(SELECT·SHOW·EXPLAIN만, 바꾸는 문장 금지). "요청 전후"를 비교하는 항목은 해당 C 요청을 보내기 전에 먼저 조회해 둔다.
5. T 항목(테스트)은 레포 루트에서 표에 적힌 \`./gradlew test --tests ...\` 명령을 실행해 통과 여부를 본다. 실패하면 실패한 테스트 이름과 이유를 적는다. 테스트 코드도 고치지 마라.
6. R 항목(코드 리뷰)은 관련 코드를 찾아 읽고 판단해라. 지적할 때는 \`파일:줄\`을 붙여라.
7. 아래 형식으로만 답해라.
   ① 채점표 — | 항목 | 기대 | 실제 | 결과 |  (결과: 통과 / 실패 / 확인 불가)
   ② 잘한 점
   ③ 부족한 점과 이유 — 실패한 C·D·T 항목부터
   ④ 다음 단계 전에 고칠 것 — 우선순위순, 3개 이내
   ⑤ 더 볼 문서 — 단계 파일의 "필요한 지식" 중 부족한 점과 관련된 것만(파일 경로로)
   마지막 줄: \`결과: 필수 N/M 통과\` (필수 = C·D 항목, T는 선택)`;
}

function graderPanel(lv) {
  return `
<section class="grader" id="result-test">
  <h2>결과 테스트 프롬프트</h2>
  <p>다 만들었으면 <strong>서버를 띄운 채로</strong> 아래 프롬프트를 복사해 Codex 또는 Claude Code에 붙여 넣으세요. 에이전트가 API와 DB를 확인하고 채점표를 줍니다. 코드는 고치지 않습니다.</p>
  <div class="grader-inputs">
    <label>레포 경로 <input id="repo" autocomplete="off" placeholder="비워 두면 에이전트를 연 폴더(레포 루트)를 쓴다"></label>
  </div>
  <textarea id="prompt" readonly rows="20" aria-label="결과 테스트 프롬프트"></textarea>
  <div class="grader-actions"><button type="button" id="copy">프롬프트 복사</button><span id="copied" role="status"></span></div>
  <script type="application/json" id="prompt-template">${JSON.stringify(promptTemplate(lv)).replace(/</g, '\\u003c')}</script>
</section>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const tpl = JSON.parse($('prompt-template').textContent);
  const baseInput = $('scenario-base-url');
  const store = { get(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  $('repo').value = store.get('jx.repo');
  function fill() {
    const repo = $('repo').value.trim();
    const base = (baseInput?.value.trim() || 'http://localhost:8080').replace(/\\/+$/, '');
    $('prompt').value = tpl
      .replaceAll('{{REPO}}', repo || '(에이전트를 연 폴더 = 레포 루트)')
      .replaceAll('{{REPO_STEP}}', repo ? '레포 경로로 이동(cd)한 뒤' : '지금 작업 폴더(레포 루트)에서')
      .replaceAll('{{BASE}}', base);
    store.set('jx.repo', repo);
  }
  $('repo').addEventListener('input', fill);
  baseInput?.addEventListener('input', fill);
  fill();
  $('copy').addEventListener('click', async () => {
    const text = $('prompt').value;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) { $('prompt').select(); try { ok = document.execCommand('copy'); } catch {} }
    $('copied').textContent = ok ? '복사했어요. Codex 또는 Claude Code에 붙여 넣으세요.' : '자동 복사가 막혔어요. 위 칸을 전체 선택(⌘A)해서 복사하세요.';
  });
})();
</script>`;
}

// ---------------------------------------------------------------- 페이지 틀
function dedupeStylesheetLinks(html) {
  const seen = new Set();
  return html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (tag, href) => {
    if (seen.has(href)) return '';
    seen.add(href);
    return tag;
  });
}

function page({ abs, title, body, hasMermaid, hasDbIndexExperiment }) {
  const up = (p) => path.relative(path.dirname(abs), path.join(ROOT, p)).split(path.sep).join('/') || '.';
  const levelHref = (id) => {
    const target = STAGE_BY_ID.get(id)?.abs;
    return target ? path.relative(path.dirname(abs), target).split(path.sep).join('/').replace(/\.md$/, '.html') : null;
  };
  const lv = LEVEL_BY_ABS.get(abs);
  const lab = LAB_BY_ABS.get(abs);
  const isServiceFeaturePage = /^scenario\/features\/[^/]+\.md$/.test(rel(abs));
  const hasServicePageUI = Boolean(servicePageRenderers && SERVICE_PAGE_DATA);
  const isHome = abs === path.join(ROOT, 'README.md');
  const isCourse = rel(abs).startsWith('course/');
  const isCourseDesign = isCourse || isHome;
  const functionalTask = getFunctionalTask(rel(abs)) || getFunctionalLikeTask(rel(abs));
  const isFunctionalCatalog = rel(abs) === 'scenario/flow/README.md'
    || (rel(abs) === 'scenario/README.md' && !hasServicePageUI);
  const isFunctional = Boolean(functionalTask || isFunctionalCatalog);
  const functionalRoot = up('index.html').replace(/index\.html$/, '');
  const referenceContext = renderFunctionalReferenceContext({ rootPrefix: functionalRoot, sourcePath: rel(abs), legacyPaths: REFERENCE_LEGACY_PATHS, knowledgePaths: REFERENCE_KNOWLEDGE_PATHS });
  const isCorePage = abs === path.join(ROOT, 'lessons/concept-core.md');
  const isConceptDarkSurface = isHome || isCorePage
    || abs === path.join(DOC_DIR, 'README.md')
    || (abs.startsWith(`${DOC_DIR}${path.sep}`) && /^[A-Z]\d{2}-.*\.md$/.test(path.basename(abs)));
  const isD12Page = abs === path.join(ROOT, 'docs/knowledge/D12-linux-terminal-basics.md');
  const homeTask = Object.values(HOME_TASKS).find((task) => path.join(ROOT, task.href.replace(/\.html$/, '.md')) === abs);
  let crumbs = '';
  let pager = '';
  if (lv) {
    const grade = { basic: '기초', intermediate: '중급', advanced: '고급' }[lv.difficulty] || '';
    const project = lv.chapter.project === 'spec-board' ? '별도 명세서 프로젝트' : '게시판 본편';
    crumbs = `<p class="crumbs"><a href="${up('scenario/README.html')}">서비스 만들기</a> › ${escapeHtml(lv.chapter.title)} › ${escapeHtml(lv.id)}</p><p class="level-tags"><span>${escapeHtml(grade)}</span><span>${project}</span><span>DB ${escapeHtml(lv.db || lv.chapter.db || 'community')}</span></p>`;
    const prev = LEVELS[lv.index - 1]?.chapter.project === lv.chapter.project ? LEVELS[lv.index - 1] : null;
    const next = LEVELS[lv.index + 1]?.chapter.project === lv.chapter.project ? LEVELS[lv.index + 1] : null;
    const link = (l, label) => (l ? `<a href="${path.relative(path.dirname(abs), l.abs).split(path.sep).join('/').replace(/\.md$/, '.html')}">${label} ${escapeHtml(l.id)}. ${escapeHtml(l.title)}</a>` : '<span></span>');
    pager = `<nav class="pager">${link(prev, '← 이전')}${link(next, '다음 →')}</nav>`;
    const stageMap = renderStage(API_ARCHITECTURE, lv.id, levelHref);
    const stageNote = !stageMap && NON_API_STAGE_NOTES[lv.id]
      ? `<section class="api-map-stage"><h3>이 단계의 작업 위치</h3><p class="api-map-stage-note">${escapeHtml(NON_API_STAGE_NOTES[lv.id])}</p></section>`
      : '';
    const mockup = body.match(/<figure class="learning-mockup-figure">[\s\S]*?<\/figure>/)?.[0] || '';
    if (mockup) body = body.replace(mockup, '');
    body = leadWithVisualScenario(body, lv.id);
    const visualStart = body.indexOf('<h2 id="화면-시나리오"');
    const visualEnd = body.indexOf('<h2 id="상황"', visualStart);
    if (visualStart < 0 || visualEnd < visualStart) throw new Error(`${lv.id}: 화면 흐름 구간이 없다`);
    body = body.slice(0, visualStart)
      + `<details class="task-flow-details" id="task-flow-details"><summary>요청이 흐르는 길 · 화면과 서버 연결해서 보기</summary>${body.slice(visualStart, visualEnd)}</details>`
      + body.slice(visualEnd);
    const taskTitleEnd = body.indexOf('</h1>') + 5;
    const originalMockup = ['1-2', '1-3', '1-4', '1-5', '1-6', '10-4'].includes(lv.id) && mockup
      ? `<details class="db-journey-original-mockup"><summary>기존 전체 흐름 시안 보기</summary>${mockup}</details>`
      : mockup;
    body = body.slice(0, taskTitleEnd) + renderTaskFocus(lv, read(abs)) + originalMockup + body.slice(taskTitleEnd);
    const situationStart = body.indexOf('<h2 id="상황"');
    if (situationStart < 0) throw new Error(`${lv.id}: 상황 구간이 없다`);
    body = body.slice(0, situationStart) + `<details class="task-api-details"><summary>이 API의 전체 구현 흐름 · 역할과 파일 보기</summary>${stageMap}${stageNote}
      <p class="api-map-link"><a href="${up('scenario/README.html')}#api-map-title">전체 API 구조도 보기</a></p></details>`
      + body.slice(situationStart);
    const directCheck = body.indexOf('<h2 id="직접-확인"');
    if (directCheck < 0) throw new Error(`${lv.id}: 직접 확인 구간이 없다`);
    body = body.slice(0, directCheck) + requestPageTools(body.includes('class="api-practice"'))
      + body.slice(directCheck) + graderPanel(lv);
    body = renderLessonAtlas(body, lv.id);
    if (['0-1', '0-2', '0-3', '0-4', '0-5', '0-6', '4-2'].includes(lv.id)) {
      const journeyStart = body.indexOf('<section class="first-java-journey');
      const journeyEnd = body.indexOf('</section>', journeyStart) + '</section>'.length;
      if (journeyStart < 0 || journeyEnd < '</section>'.length) throw new Error('0-1 집중 화면을 찾지 못했다');
      body = body.slice(0, journeyEnd) + '<details class="first-java-original"><summary>원문 전체 · 코드 설명, 채점표, 오류 로그, 힌트 보기</summary>' + body.slice(journeyEnd) + '</details>';
    }
    if (!['0-1', '0-2', '0-3', '0-4', '0-5', '0-6', '4-2'].includes(lv.id)) {
      const graderStart = body.indexOf('<section class="grader" id="result-test">');
      if (graderStart < 0) throw new Error(`${lv.id} 결과 테스트 프롬프트를 찾지 못했다`);
      const className = lv.id === '1-1' ? 'first-api-grader' : 'task-grader-details';
      body = body.slice(0, graderStart) + `<details class="${className}"><summary>다 만든 뒤 전체 채점 프롬프트 열기</summary>` + body.slice(graderStart) + '</details>';
    }
  }
  if (lab) {
    const optionalLab = lab.id === 'L15' || lab.id === 'L16';
    crumbs = `<p class="crumbs"><a href="${up('scenario/README.html')}">서비스 만들기</a> › ${optionalLab ? '선택 심화 실습' : '쿼리 설계 연습'} › ${escapeHtml(lab.id)}</p>`;
    const exerciseCount = [...read(abs).matchAll(/^### Q\d+\./gm)].length;
    const stageMap = renderStage(API_ARCHITECTURE, lab.id, levelHref, exerciseCount);
    if (!stageMap && !optionalLab) throw new Error(`${lab.id} 랩의 API 구조도 매핑이 없다`);
    body = optionalLab ? body : requestPageTools(body.includes('class="api-practice"')) + (lab.id === 'L12' ? '' : stageMap + `<p class="api-map-link"><a href="${up('scenario/README.html')}#api-map-title">전체 API 구조도 보기</a></p>`) + body;
    if (lab.id === 'L12') {
      const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
      if (titleEnd < 5) throw new Error('L12 제목을 찾지 못했다');
      body = body.slice(0, titleEnd) + renderL12QueryJourney()
        + '<details class="l12-original" id="l12-original"><summary>Q03–Q08 포함 원문 구현 코드·실행 준비·전체 요청 펼치기</summary>'
        + stageMap + `<p class="api-map-link"><a href="${up('scenario/README.html')}#api-map-title">전체 API 구조도 보기</a></p>`
        + body.slice(titleEnd) + '</details>';
    }
    if (lab.id === 'L15') {
      const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
      if (titleEnd < 5) throw new Error('L15 제목을 찾지 못했다');
      body = body.slice(0, titleEnd) + renderSessionLabJourney()
        + '<details class="session-lab-original" id="session-lab-original"><summary>원문 계약·수동 명령·합격 기준 펼치기</summary>'
        + body.slice(titleEnd) + '</details>';
    }
    if (lab.id === 'L16') {
      const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
      if (titleEnd < 5) throw new Error('L16 제목을 찾지 못했다');
      body = body.slice(0, titleEnd) + renderInterfaceImplJourney()
        + '<details class="reader-lab-original" id="reader-original"><summary>원문 구현 계약·명령·합격 기준 펼치기</summary>'
        + body.slice(titleEnd) + '</details>';
    }
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-01-response-to-query.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-01 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb01FocusedJourney()
      + '<details class="db01-original" id="db01-original"><summary>원문 SQL·테이블 관계·전체 설명 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-02-select-cursor.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-02 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb02FocusedJourney()
      + '<details class="db02-original" id="db02-original"><summary>원문 전체 · 커서 흐름·SQL·offset 비교 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-03-detail-join.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-03 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb03FocusedJourney()
      + '<details class="db03-original" id="db03-original"><summary>원문 전체 · JOIN 경로·SQL·접근 정책 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-04-tag-filter-and-exists.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-04 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb04FocusedJourney(read(abs))
      + '<details class="db04-original" id="db04-original"><summary>원문 전체 · 관계·JOIN/EXISTS SQL·API 계약 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-05-aggregate-fanout.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-05 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb05FocusedJourney(read(abs))
      + '<details class="db05-original" id="db05-original"><summary>원문 전체 · 합성 2×3·집계 SQL·M6/M9 설명 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-06-exists-not-exists.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-06 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb06FocusedJourney(read(abs))
      + '<details class="db06-original" id="db06-original"><summary>원문 전체 · 관계·네 SQL·NULL 예외·스키마 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/DB-07-same-api-five-query-styles.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-07 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb07FocusedJourney(read(abs))
      + '<details class="db07-original" id="db07-original"><summary>원문 전체 · 공통 SQL·다섯 구현 코드·완료 기준 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/DB-08-explain-hypothesis.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-08 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb08FocusedJourney(read(abs))
      + '<details class="db08-original" id="db08-original"><summary>원문 전체 · fixture·SELECT·EXPLAIN·완료 기준 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/DB-09-explain-analyze.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-09 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb09FocusedJourney(read(abs))
      + '<details class="db09-original" id="db09-original"><summary>원문 전체 · 실제 실행 SQL·노드 해석·완료 기준 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/DB-10-performance-fixture.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-10 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb10FocusedJourney(read(abs))
      + '<details class="db10-original" id="db10-original"><summary>원문 전체 · fixture·전후 SQL·복원 절차 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/DB-11-index-lifecycle.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-11 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb11FocusedJourney(read(abs))
      + '<details class="db11-original" id="db11-original"><summary>원문 전체 · 대상·가시성·복원·삭제 SQL 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-12-join-exists-explain.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-12 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb12FocusedJourney(read(abs))
      + '<details class="db12-original" id="db12-original"><summary>원문 전체 · 네 SELECT·EXPLAIN·기술 경계 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-13-list-api-n-plus-one.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-13 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb13FocusedJourney(read(abs))
      + '<details class="db13-original" id="db13-original"><summary>원문 전체 · 계측 설명·Java 의사 코드·SQL·완료 기준 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  if (abs === path.join(ROOT, 'scenario/db-query-journey/db-14-live-schema-to-slow-query.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('DB-14 제목을 찾지 못했다');
    body = body.slice(0, titleEnd) + renderDb14FocusedJourney(read(abs))
      + '<details class="db14-original" id="db14-original"><summary>원문 전체 · 접속·DDL·SQL·계획·복원 기준 펼치기</summary>'
      + body.slice(titleEnd) + '</details>';
  }
  const isServiceFeatureSource = /^scenario\/features\/[^/]+\.md$/.test(rel(abs));
  const serviceData = (abs === path.join(ROOT, 'scenario/README.md') || isServiceFeatureSource) ? SERVICE_PAGE_DATA : null;
  if (abs === path.join(ROOT, 'scenario/README.md') && serviceData && servicePageRenderers?.renderServiceCatalog) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd < 5) throw new Error('scenario/README.md에 제목이 없다');
    const rootPrefix = `${path.relative(path.dirname(abs), ROOT).split(path.sep).join('/')}/`;
    const originalTitle = body.slice(0, titleEnd).replace('<h1 ', '<h2 ').replace('</h1>', '</h2>');
    const originalBody = body.slice(titleEnd);
    body = servicePageRenderers.renderServiceCatalog({ ...serviceData, apiRecipes: { recipes: serviceData.apiRecipes, routes: serviceData.apiRoutes }, rootPrefix })
      + '<details class="service-original-reference" id="legacy-scenarios"><summary>기존 시나리오·실행 준비·DB 자료 보기</summary>'
      + originalTitle + originalBody + '</details>'
      + renderCatalog(API_ARCHITECTURE, levelHref);
    const oldAnchors = JSON.parse(read(path.join(ROOT, 'docs/design/full-integration-2026-10-25/ORIGINAL-CATALOG-ANCHORS.json'))).ids;
    const presentIds = new Set([...body.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    const missingAnchors = oldAnchors.filter(id => !presentIds.has(id));
    body = missingAnchors.map(id => `<span class="service-anchor-compat" id="${escapeHtml(id)}" aria-hidden="true"></span>`).join('') + body;
  } else if (abs === path.join(ROOT, 'scenario/README.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    const tocStart = body.indexOf('<h2 id="목차"');
    const tocEnd = body.indexOf('<h2 id="진행-방법"', tocStart);
    if (titleEnd < 5 || tocStart < titleEnd || tocEnd < tocStart) throw new Error('scenario/README.md에 제목 또는 목차가 없다');
    body = body.slice(0, titleEnd) + renderLearningJourney(MANIFEST, API_ARCHITECTURE, levelHref)
      + '<details class="journey-intro"><summary>저장소 소개 · 시작 방법 보기</summary>'
      + body.slice(titleEnd, tocStart) + '</details>'
      + renderCatalog(API_ARCHITECTURE, levelHref)
      + '<details class="legacy-toc"><summary>전체 단계 텍스트 목차 보기</summary>'
      + body.slice(tocStart, tocEnd) + '</details>' + body.slice(tocEnd);
  }
  if (abs === path.join(ROOT, 'scenario/README.md') && (!serviceData || !servicePageRenderers?.renderServiceCatalog)) {
    const legacyTitleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (legacyTitleEnd < 5) throw new Error('scenario/README.md 기존 제목을 찾지 못했다');
    body = body.slice(0, legacyTitleEnd)
      .replace('<h1 ', '<span class="fw-original-title" aria-hidden="true" ').replace('</h1>', '</span>')
      + renderFunctionalCatalog({ rootPrefix: functionalRoot, assets: FUNCTIONAL_ASSETS })
      + '<details id="legacy-scenarios"><summary>선택 준비자료와 기존 전체 시나리오 · 101단계</summary>'
      + body.slice(legacyTitleEnd) + '</details>';
  }
  if (functionalTask) body = functionalTask.group === 'like'
    ? renderFunctionalLikeWorkspace({ task: functionalTask, rootPrefix: functionalRoot })
    : renderFunctionalWorkspace({ task: functionalTask, rootPrefix: functionalRoot, assets: FUNCTIONAL_ASSETS });
  if (rel(abs) === 'scenario/flow/README.md') body = renderFunctionalCatalog({ rootPrefix: functionalRoot, assets: FUNCTIONAL_ASSETS });
  if (abs === path.join(ROOT, 'docs/knowledge/README.md')) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    const firstSection = body.search(/<h2\b/);
    if (titleEnd < 5 || firstSection < titleEnd) throw new Error('공부자료 제목 또는 목차 시작을 찾을 수 없다');
    body = body.slice(0, titleEnd) + renderKnowledgeVisual(ROOT, abs)
      + '<details class="knowledge-original-index"><summary>문서 기준과 범위 확인</summary>' + body.slice(titleEnd, firstSection) + '</details>'
      + '<details class="knowledge-original-index" id="kc-original"><summary>기존 문서 전체 표 보기</summary>'
      + body.slice(firstSection).replace(/<h2\b/g, (() => { let group = 0; return () => `<span class="kc-legacy-anchor" id="knowledge-category-${++group}"><span id="knowledge-category-${group}-title"></span></span><h2`; })()) + '</details>';
    body = body.replace('<h1 ', '<h1 class="kc-original-title" ');
  }
  if (abs.startsWith(`${DOC_DIR}${path.sep}`) && path.basename(abs).match(/^[A-Z]\d{2}-.*\.md$/)) {
    const titleEnd = body.indexOf('</h1>') + '</h1>'.length;
    if (titleEnd > 5) {
      const isP16 = path.basename(abs) === 'P16-json-jackson-practical.md';
      const isP09 = path.basename(abs) === 'P09-java-syntax-basics.md';
      const isP04 = path.basename(abs) === 'P04-constructors-builder.md';
      const isW09 = path.basename(abs) === 'W09-why-dto.md';
      const isP19 = path.basename(abs) === 'P19-mysql-jpa-setup.md';
      const isP20 = path.basename(abs) === 'P20-jpa-entity-mapping.md';
      const isS09 = path.basename(abs) === 'S09-jpa-hibernate.md';
      const isS08 = path.basename(abs) === 'S08-transactions.md';
      const isW11 = path.basename(abs) === 'W11-why-tx-in-service.md';
      const isR03 = path.basename(abs) === 'R03-schema-types-constraints.md';
      const isR04 = path.basename(abs) === 'R04-sql-crud-join.md';
      const isW15 = path.basename(abs) === 'W15-paging-offset-vs-cursor.md';
      const isV04 = path.basename(abs) === 'V04-test-db-strategy.md';
      const isB01 = path.basename(abs) === 'B01-account-lifecycle.md';
      const isD01 = path.basename(abs) === 'D01-dev-lifecycle-overview.md';
      const isD02 = path.basename(abs) === 'D02-server-network-basics.md';
      const isD03 = path.basename(abs) === 'D03-rest-api-dev-process.md';
      const isD04 = path.basename(abs) === 'D04-build-pipeline-explained.md';
      const isD05 = path.basename(abs) === 'D05-debugging-methodology.md';
      const isD06 = path.basename(abs) === 'D06-deployment-concepts.md';
      const isD07 = path.basename(abs) === 'D07-onprem-vs-cloud.md';
      const isD08 = path.basename(abs) === 'D08-cicd-collaboration.md';
      const isD09 = path.basename(abs) === 'D09-operations-observability.md';
      const isD10 = path.basename(abs) === 'D10-database-basics.md';
      const isD11 = path.basename(abs) === 'D11-web-security-basics.md';
      const isD12 = path.basename(abs) === 'D12-linux-terminal-basics.md';
      const isP02 = abs === path.join(ROOT, 'docs/knowledge/P02-mvc-layered-architecture.md');
      const conceptScenes = renderConfigConceptScenes(abs);
      const originalVisual = isP02 ? '' : renderKnowledgePageVisual(abs, body);
      const visual = isD12 ? renderD12Learning() + '<details class="d12-legacy"><summary>기존 전체 Linux 개념 지도 보기</summary>' + originalVisual + '</details>' : isD11 ? renderD11Learning() + '<details class="d11-legacy"><summary>기존 전체 웹 보안 개념 지도 보기</summary>' + originalVisual + '</details>' : isD10 ? renderD10Learning() + renderD10Supplementary() + '<details class="d10-legacy"><summary>기존 전체 DB 기초 개념 지도 보기</summary>' + originalVisual + '</details>' : isD09 ? renderD09Learning() + renderD09Supplementary() + '<details class="d09-legacy"><summary>기존 전체 운영·관측 개념 지도 보기</summary>' + originalVisual + '</details>' : isD08 ? renderD08Learning() + renderD08Supplementary() + '<details class="d08-legacy"><summary>기존 전체 CI/CD·협업 개념 지도 보기</summary>' + originalVisual + '</details>' : isD07 ? renderD07Learning() + renderD07Supplementary() + '<details class="d07-legacy"><summary>기존 전체 온프레미스·클라우드 개념 지도 보기</summary>' + originalVisual + '</details>' : isD06 ? renderD06Learning() + renderD06Supplementary() + '<details class="d06-legacy"><summary>기존 전체 배포 개념 지도 보기</summary>' + originalVisual + '</details>' : isD05 ? renderD05Learning() + renderD05Supplementary() + '<details class="d05-legacy"><summary>기존 전체 디버깅 개념 지도 보기</summary>' + originalVisual + '</details>' : isD04 ? renderD04Learning() + renderD04Supplementary() + '<details class="d04-legacy"><summary>기존 전체 빌드 과정 개념 지도 보기</summary>' + originalVisual + '</details>' : isD03 ? renderD03Learning() + renderD03Supplementary() + '<details class="d03-legacy"><summary>기존 전체 REST API 개발 과정 개념 지도 보기</summary>' + originalVisual + '</details>' : isD02 ? renderD02Learning() + renderD02Supplementary() + '<details class="d02-legacy"><summary>기존 전체 서버·네트워크 개념 지도 보기</summary>' + originalVisual + '</details>' : isD01 ? renderD01Learning() + renderD01Supplementary() + '<details class="d01-legacy"><summary>기존 전체 개발 생명주기 개념 지도 보기</summary>' + originalVisual + '</details>' : isB01 ? renderB01Learning() + renderB01Supplementary() + '<details class="b01-legacy"><summary>기존 전체 계정 생명주기 개념 지도 보기 · 추가 실측과 구분</summary>' + originalVisual + '</details>' : isV04 ? renderV04Learning() + renderV04Supplementary() + '<details class="v04-legacy"><summary>기존 전체 테스트 DB 개념 지도 보기 · 추가 실측과 구분</summary>' + originalVisual + '</details>' : isW15 ? renderW15Learning() + renderW15Supplementary() + '<details class="w15-legacy"><summary>기존 전체 페이지네이션 개념 지도 보기 · 추가 실측과 구분</summary>' + originalVisual + '</details>' : isR04 ? renderR04Learning() + renderR04Supplementary() + '<details class="r04-legacy"><summary>기존 전체 SQL 개념 지도 보기 · 추가 실행 실측과 구분</summary>' + originalVisual + '</details>' : isR03 ? renderR03Learning() + renderR03Supplementary() + '<details class="r03-legacy"><summary>기존 전체 스키마 개념 지도 보기 · 추가 실행 실측과 구분</summary>' + originalVisual + '</details>' : isW11 ? renderW11Learning() + renderW11Supplementary() + '<details class="w11-legacy"><summary>기존 서비스 경계 예상 흐름·전체 지도 보기 · 추가 실행 실측과 구분</summary>' + originalVisual + '</details>' : isS08 ? renderS08Learning() + renderS08Supplementary() + '<details class="s08-legacy"><summary>기존 트랜잭션 예상 흐름·전체 지도 보기 · 추가 실행 실측과 구분</summary>' + originalVisual + '</details>' : isS09 ? renderS09Learning() + renderS09Supplementary() + '<details class="s09-legacy"><summary>기존 역할·Post42 예상 흐름·전체 지도 보기 · 추가 실행 실측과 구분</summary>' + originalVisual + '</details>' : isP20 ? renderP20Learning() + renderP20Supplementary() + '<details class="p20-legacy"><summary>기존 설명용 엔티티 지도·예상 단계 보기 · 추가 실행 실측과 구분</summary>' + originalVisual + '</details>' : isP19 ? renderP19Learning() : isW09 ? renderW09Learning() : isP04 ? renderP04Learning() : isP09 ? renderP09Learning() : isP16 ? renderP16JsonVisual() + renderP16ContractLearning() + renderP16ExecutionEvidence() : isP02 ? renderP02Focused() : conceptScenes
        ? `${conceptScenes}<details class="cc-original-map"><summary>기존 전체 개념 지도 보기</summary>${originalVisual}</details>`
        : originalVisual;
      const originalMap = isP02 ? renderKnowledgePageVisual(abs, body) : '';
      body = renderKnowledgePageSections(body);
      if (isP16) body = body.slice(0, titleEnd) + '<details class="p16-original" id="p16-original"><summary>원문 전체 · 코드·설명·참고문헌 보기</summary>' + originalVisual + body.slice(titleEnd) + '</details>';
      if (isP09) body = body.slice(0, titleEnd) + '<details class="p09-original" id="p09-original"><summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>' + originalVisual + body.slice(titleEnd) + '</details>';
      if (isP04) body = body.slice(0, titleEnd) + '<details class="p04-original" id="p04-original"><summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>' + originalVisual + body.slice(titleEnd) + '</details>';
      if (isW09) body = body.slice(0, titleEnd) + '<details class="w09-original" id="w09-original"><summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>' + originalVisual + body.slice(titleEnd) + '</details>';
      if (isP19) body = body.slice(0, titleEnd) + '<details class="p19-original" id="p19-original"><summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>' + originalVisual + body.slice(titleEnd) + '</details>';
      if (isP20) body = body.slice(0, titleEnd) + '<details class="p20-original" id="p20-original"><summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isS09) body = body.slice(0, titleEnd) + '<details class="s09-original" id="s09-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isS08) body = body.slice(0, titleEnd) + '<details class="s08-original" id="s08-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isW11) body = body.slice(0, titleEnd) + '<details class="w11-original" id="w11-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isR03) body = body.slice(0, titleEnd) + '<details class="r03-original" id="r03-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isR04) body = body.slice(0, titleEnd) + '<details class="r04-original" id="r04-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isW15) body = body.slice(0, titleEnd) + '<details class="w15-original" id="w15-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isV04) body = body.slice(0, titleEnd) + '<details class="v04-original" id="v04-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isB01) body = body.slice(0, titleEnd) + '<details class="b01-original" id="b01-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD01) body = body.slice(0, titleEnd) + '<details class="d01-original" id="d01-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD02) body = body.slice(0, titleEnd) + '<details class="d02-original" id="d02-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD03) body = body.slice(0, titleEnd) + '<details class="d03-original" id="d03-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD04) body = body.slice(0, titleEnd) + '<details class="d04-original" id="d04-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD05) body = body.slice(0, titleEnd) + '<details class="d05-original" id="d05-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD06) body = body.slice(0, titleEnd) + '<details class="d06-original" id="d06-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD07) body = body.slice(0, titleEnd) + '<details class="d07-original" id="d07-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD08) body = body.slice(0, titleEnd) + '<details class="d08-original" id="d08-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isD10) body = body.slice(0, titleEnd) + '<details class="d10-original" id="d10-original"><summary>원문 전체 · DB 예제·운영·자가점검 보기</summary>' + body.slice(titleEnd) + '</details>';
      if (isD11) body = body.slice(0, titleEnd) + '<details class="d11-original" id="d11-original"><summary>원문 전체 · 코드·위험 경계·자가점검 보기</summary>' + body.slice(titleEnd) + '</details>';
      if (isD12) body = body.slice(0, titleEnd) + '<details class="d12-original" id="d12-original"><summary>원문 전체 · 실습·경계·자가점검 보기</summary>' + body.slice(titleEnd) + '</details>';
      if (isD09) body = body.slice(0, titleEnd) + '<details class="d09-original" id="d09-original"><summary>원문 전체 · 코드·버전별 변화·실무 가이드·참고문헌</summary>' + body.slice(titleEnd) + '</details>';
      if (isP02) {
        const start = body.indexOf('<section class="p02-visual"');
        const close = body.indexOf('</section>', start) + '</section>'.length;
        if (start < 0 || close < start) throw new Error('P02 기존 MVC 장면의 경계를 찾지 못했다');
        body = body.slice(0, start) + `<details class="p02-legacy"><summary>기존 MVC 전체 역할 지도 보기</summary>${body.slice(start, close)}</details>` + body.slice(close);
        const afterLegacy = body.indexOf('</section></details>', start) + '</section></details>'.length;
        if (afterLegacy < start) throw new Error('P02 기존 역할 지도 닫힘 위치를 찾지 못했다');
        body = body.slice(0, afterLegacy) + `<details class="p02-original"><summary>원문 전체 · 구현 코드와 개념 깊이 보기</summary>${originalMap}${body.slice(afterLegacy)}</details>`;
      }
      const returnNavigation = '<nav class="kc-detail-navigation" aria-label="개념 학습으로 돌아가기"><a href="README.html?from=detail" data-kc-catalog-return>← 개념 목록·검색 결과</a><a data-kc-task-return hidden></a></nav>';
      if (isP09 || isP04 || isW09 || isP19) {
        const sourceTitle = body.slice(0, titleEnd);
        body = body.slice(0, titleEnd) + body.slice(titleEnd).replace('<summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>', '<summary>원문 전체 · 긴 코드·심화·자가점검·참고문헌</summary>' + sourceTitle);
      }
      const readerSourceTitle = isP16 ? body.slice(0, titleEnd).replace('<h1 ', '<h1 class="p16-original-title" ') : body.slice(0, titleEnd);
      body = renderKnowledgeReaderPage({ title: readerSourceTitle, navigation: returnNavigation, visual, source: body.slice(titleEnd) });
    }
  }
  if (abs === path.join(ROOT, 'practice/MISSIONS.md')) {
    const firstSection = body.search(/<h2\b/);
    const missionSection = body.indexOf('<h2 id="미션"');
    if (firstSection < 0 || missionSection < firstSection) throw new Error('미션 본문 구간을 찾을 수 없다');
    body = body.slice(0, firstSection) + renderMissionVisual(ROOT, abs)
      + '<details class="mission-setup"><summary>실행 준비 · 데이터 · 공통 업무 규칙 펼치기</summary>'
      + body.slice(firstSection, missionSection) + '</details>' + body.slice(missionSection);
    body = renderMissionDetails(ROOT, abs, body);
  }
  const isDayPage = DAY_PAGE.test(rel(abs));
  const isCourseMap = rel(abs) === MAP_PAGE;
  // 티켓 페이지(course/tickets/Bnn.md): 원문은 고치지 않고 빌드 때 [장애 흐름]을 '받은 티켓' 다음에 넣는다.
  const ticketFlow = /^course\/tickets\/[BE]\d{2}\.md$/.test(rel(abs)) ? COURSE.flows.tickets.get(path.basename(abs, '.md')) : null;
  if (ticketFlow) body = injectTicketFlow(body, ticketFlow);
  body = renderExerciseNavigation(rel(abs), body, COURSE);
  const hasFlow = isDayPage || (ticketFlow && body.includes('data-flow-kind="ticket"'));
  if (isDayPage) {
    crumbs = dayCrumbs(rel(abs), COURSE);
    body = renderDayPage(rel(abs), body, COURSE);
  }
  if (isCourseMap) {
    crumbs = mapCrumbs();
    body = body.replace('쓰는 Java를 먼저 연습하고', '쓰는 Java를 보통 먼저 연습하며 J44·J45는 요구 제시·초기 진단 뒤 수행 중 증거·사후 확인으로 연결하고');
    const marker = body.match(/<!-- course-map:[^>]*-->/);
    if (!marker) throw new Error('course/map.md에 지도 자리(<!-- course-map: … -->)가 없다');
    body = body.replace(marker[0], renderCourseMap(COURSE));
  }
  body = renderConceptLesson(rel(abs), body);
  body = renderNavigationCatalog(rel(abs), body, COURSE);
  const serviceFeatureMatch = rel(abs).match(/^scenario\/features\/([^/]+)\.md$/);
  if (serviceFeatureMatch && serviceData && servicePageRenderers?.renderServiceFeature) {
    const feature = serviceData.features.find((item) => item.id === serviceFeatureMatch[1]);
    if (!feature) throw new Error(`service catalog에 없는 기능 페이지: ${serviceFeatureMatch[1]}`);
    const rootPrefix = `${path.relative(path.dirname(abs), ROOT).split(path.sep).join('/')}/`;
    body = servicePageRenderers.renderServiceFeature({ feature, features: serviceData.catalogFeatures, apiRecipes: serviceData.apiRecipes, sourceIndex: serviceData.sourceIndex, rootPrefix });
  }
  body = renderCourseOutline(rel(abs), body);
  body = renderCatalogHeading(rel(abs), body);
  if (isCorePage) body = renderCoreLearning(ROOT) + '<details class="core-source-outline"><summary>학습 범위와 원문 연결 목차</summary>' + body.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/, '<p$1>$2</p>') + '</details>';
  if (abs === path.join(ROOT, 'README.md')) body = renderCourseHome(COURSE);
  body = renderContentKinds(rel(abs), body);
  body = renderSemanticColors(body);
  crumbs = renderContentKinds(rel(abs), crumbs);
  if (!crumbs) crumbs = renderSiteBreadcrumb(rel(abs));
  const mermaid = hasMermaid
    ? isD12Page
      ? `<script>(${installD12InitialAnchorGuard.toString()})(document, window);</script>
<script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
import { initD12SourceDiagrams } from '${assetUrl('tools/site/d12-source-diagrams.mjs', path.dirname(abs))}';
mermaid.initialize({ startOnLoad: false, theme: 'dark' });
initD12SourceDiagrams(document, window, mermaid);</script>`
      : `<script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
const css = getComputedStyle(document.documentElement);
const token = name => css.getPropertyValue(name).trim();
mermaid.initialize({ startOnLoad: true, theme: 'dark', themeVariables: {
  darkMode: true, background: token('--card'), primaryColor: token('--accent-soft'),
  primaryTextColor: token('--fg'), primaryBorderColor: token('--control-border'),
  lineColor: token('--muted'), secondaryColor: token('--card'), tertiaryColor: token('--course-rail'),
  noteBkgColor: token('--warn-soft'), noteTextColor: token('--fg'), actorBkg: token('--accent-soft'),
  actorTextColor: token('--fg'), actorBorder: token('--control-border'),
  signalColor: token('--muted'), signalTextColor: token('--fg')
} });</script>`
    : '';
  return dedupeStylesheetLinks(`<!doctype html>
<html lang="ko" data-theme="dark" style="background:#141619;color-scheme:dark">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(catalogPageTitle(rel(abs), title))}</title>
<link rel="stylesheet" href="${assetUrl('tools/site/site.css', path.dirname(abs))}">${isFunctional ? ['functional-scenario.css', 'functional-runtime-visual.css', 'functional-query-visual.css', 'functional-like-workspace.css'].map(name => `\n<link rel="stylesheet" href="${assetUrl(`tools/site/${name}`, path.dirname(abs))}">`).join('') : ''}
${/^course\/spring\/D(?:04|05|06)\.md$/.test(rel(abs)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/course-api-workspace.css', path.dirname(abs))}">
<script src="${assetUrl('tools/site/course-api.bundle.js', path.dirname(abs))}" defer></script>` : ''}
${rel(abs) === 'course/spring/D04.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/course-post-visual.css', path.dirname(abs))}">` : ''}
${/^course\/(?:java\/J\d{2}|tickets\/(?:[BE]\d{2}|drill)|spring\/D(?:10|11|15))\.md$/.test(rel(abs)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/course-exercise.css', path.dirname(abs))}">\n` : ''}${lv || lab || abs === path.join(ROOT, 'scenario/README.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/api-architecture.css', path.dirname(abs))}">\n` : ''}${lv ? `<link rel="stylesheet" href="${assetUrl('tools/site/scenario-visual.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/scenario-code-workbench.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/lesson-atlas.css', path.dirname(abs))}">\n` : ''}${hasServicePageUI && (isServiceFeaturePage || abs === path.join(ROOT, 'scenario/README.md')) && fs.existsSync(path.join(ROOT, 'tools/site/service-feature.css')) ? `<link rel="stylesheet" href="${assetUrl('tools/site/service-feature.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/README.md') && !hasServicePageUI ? `<link rel="stylesheet" href="${assetUrl('tools/site/learning-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'docs/knowledge/README.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/knowledge-catalog.css', path.dirname(abs))}">\n` : ''}${abs.startsWith(`${DOC_DIR}${path.sep}`) && path.basename(abs).match(/^[A-Z]\d{2}-.*\.md$/) ? `<link rel="stylesheet" href="${assetUrl('tools/site/knowledge-page-visual.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'practice/MISSIONS.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/mission-visual.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/mission-detail-visual.css', path.dirname(abs))}">\n` : ''}${isHome || homeTask ? `<link rel="stylesheet" href="${assetUrl('tools/site/home-visual.css', path.dirname(abs))}">\n` : ''}${isHome ? ['home-service-preview.css', 'home-new-visual.css', 'home-preparation.css'].map((name) => `<link rel="stylesheet" href="${assetUrl(`tools/site/${name}`, path.dirname(abs))}">\n`).join('') : ''}${hasDbIndexExperiment ? `<link rel="stylesheet" href="${assetUrl('tools/site/db-index-experiment.css', path.dirname(abs))}">\n` : ''}${rel(abs).startsWith('course/') || isHome ? ['course.css', 'course-stepper.css', 'course-tokens.css', ...(/^course\/spring\/D\d{2}\.md$/.test(rel(abs)) ? ['course-criteria.css'] : [])].map(name => `<link rel="stylesheet" href="${assetUrl(`tools/site/${name}`, path.dirname(abs))}">\n`).join('') : ''}${hasFlow ? `<link rel="stylesheet" href="${assetUrl('tools/site/course-flow.css', path.dirname(abs))}">\n` : ''}<script src="${assetUrl('tools/site/syntax-highlight.js', path.dirname(abs))}" defer></script>

${path.basename(abs) === 'D11-web-security-basics.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d11-learning.css', path.dirname(abs))}">\n` : path.basename(abs) === 'D12-linux-terminal-basics.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/d12-learning.css', path.dirname(abs))}">\n` : ''}
${abs.startsWith(`${DOC_DIR}${path.sep}`) ? `<link rel="stylesheet" href="${assetUrl('tools/site/knowledge-reader.css', path.dirname(abs))}">\n` : ''}
${['0-1-ts-to-java.md', '0-2-annotations.md', '0-3-request-four-places.md', '0-4-dto-rules.md', '0-5-read-stack-trace.md', '0-6-gradle-and-yml.md'].some((name) => abs === path.join(ROOT, 'scenario/ch0-first-steps', name)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/first-java-journey.css', path.dirname(abs))}">\n` : ''}${['0-2-annotations.md', '0-3-request-four-places.md', '0-4-dto-rules.md', '0-5-read-stack-trace.md', '0-6-gradle-and-yml.md'].some((name) => abs === path.join(ROOT, 'scenario/ch0-first-steps', name)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/annotation-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch0-first-steps/0-3-request-four-places.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/request-places-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch0-first-steps/0-4-dto-rules.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/profile-dto-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch0-first-steps/0-5-read-stack-trace.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/member-debug-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch0-first-steps/0-6-gradle-and-yml.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/config-journey.css', path.dirname(abs))}">\n` : ''}${lv ? `<link rel="stylesheet" href="${assetUrl('tools/site/task-focus.css', path.dirname(abs))}">\n` : ''}
${abs === path.join(ROOT, 'scenario/ch1-create-post/1-1-receive-request.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/first-api-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'docs/knowledge/P02-mvc-layered-architecture.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/p02-focused.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/p02-image-scenes.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/p02-data-scenes.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/p02-practice-scenes.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/p02-mvc-visual.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-1-receive-request.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/first-request-visual.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch4-like/4-2-like-concurrency.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/like-concurrency-visual.css', path.dirname(abs))}">\n` : ''}
${abs === path.join(ROOT, 'scenario/ch4-like/4-2-like-concurrency.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/first-java-journey.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/like-concurrency-journey.css', path.dirname(abs))}">\n` : ''}${['S14-messaging.md', 'W23-cache-and-in-memory.md', 'S12-security-architecture.md'].some((name) => abs === path.join(ROOT, 'docs/knowledge', name)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/concept-scenes.css', path.dirname(abs))}">\n` : ''}
${['P08-maven-gradle-practical.md','S03-boot-autoconfig.md','S04-config-profiles.md','R08-app-to-db-connection.md'].some((name) => abs === path.join(ROOT, 'docs/knowledge', name)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/config-concept-scenes.css', path.dirname(abs))}">\n` : ''}
${['1-2-dto-response.md', '1-3-service-layer.md', '1-4-save-to-db.md', '1-5-validation.md', '1-6-token-auth.md'].some((name) => abs === path.join(ROOT, 'scenario/ch1-create-post', name)) || (abs === path.join(ROOT, 'scenario/ch10-project/10-4-login-jwt.md') || (abs === path.join(ROOT, 'scenario/labs/l15-session-auth/README.md') || abs === path.join(ROOT, 'scenario/labs/l16-interface-implementations/README.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-01-response-to-query.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-02-select-cursor.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-03-detail-join.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-04-tag-filter-and-exists.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-05-aggregate-fanout.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-06-exists-not-exists.md') || abs === path.join(ROOT, 'scenario/db-query-journey/DB-07-same-api-five-query-styles.md') || abs === path.join(ROOT, 'scenario/db-query-journey/DB-08-explain-hypothesis.md') || abs === path.join(ROOT, 'scenario/db-query-journey/DB-09-explain-analyze.md') || abs === path.join(ROOT, 'scenario/db-query-journey/DB-10-performance-fixture.md') || abs === path.join(ROOT, 'scenario/db-query-journey/DB-11-index-lifecycle.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-12-join-exists-explain.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-13-list-api-n-plus-one.md') || abs === path.join(ROOT, 'scenario/db-query-journey/db-14-live-schema-to-slow-query.md') || abs === path.join(ROOT, 'scenario/labs/l12-query-methods/README.md'))) ? `<link rel="stylesheet" href="${assetUrl('tools/site/first-db-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-3-service-layer.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/first-transaction-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-4-save-to-db.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/complete-post-mapping-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-5-validation.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/validation-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-6-token-auth.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/token-author-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/ch10-project/10-4-login-jwt.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/jwt-login-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/labs/l15-session-auth/README.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/session-lab-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/labs/l16-interface-implementations/README.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/interface-impl-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-01-response-to-query.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db01-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-02-select-cursor.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db02-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-03-detail-join.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db03-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-04-tag-filter-and-exists.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db04-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-05-aggregate-fanout.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db05-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-06-exists-not-exists.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db06-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-07-same-api-five-query-styles.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db07-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-08-explain-hypothesis.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db08-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-09-explain-analyze.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db09-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-10-performance-fixture.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db10-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-11-index-lifecycle.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db11-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-12-join-exists-explain.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db12-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-13-list-api-n-plus-one.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db13-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-14-live-schema-to-slow-query.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/db14-focused-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'scenario/labs/l12-query-methods/README.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/l12-query-journey.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'docs/knowledge/S09-jpa-hibernate.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/jpa-focused.css', path.dirname(abs))}">\n<link rel="stylesheet" href="${assetUrl('tools/site/jpa-image-scenes.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'docs/knowledge/W04-mybatis-xml-practical.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/mybatis-focused.css', path.dirname(abs))}">\n` : ''}${['W11-why-tx-in-service.md', 'S08-transactions.md'].some((name) => abs === path.join(ROOT, 'docs/knowledge', name)) ? `<link rel="stylesheet" href="${assetUrl('tools/site/tx-why-focused.css', path.dirname(abs))}">\n` : ''}${abs === path.join(ROOT, 'docs/knowledge/S08-transactions.md') ? `<link rel="stylesheet" href="${assetUrl('tools/site/tx-lifecycle-focused.css', path.dirname(abs))}">\n` : ''}${path.basename(abs) === 'P16-json-jackson-practical.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p16-json-visual.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/p16-contract-learning.css', path.dirname(abs))}">` : ''}${abs.startsWith(`${DOC_DIR}${path.sep}`) ? `<link rel="stylesheet" href="${assetUrl('tools/site/knowledge-navigation.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'P09-java-syntax-basics.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'P04-constructors-builder.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/p04-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'W09-why-dto.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/w09-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'P19-mysql-jpa-setup.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/p19-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'P20-jpa-entity-mapping.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/p20-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'S09-jpa-hibernate.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/s09-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'S08-transactions.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/s08-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'W11-why-tx-in-service.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/w11-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'R03-schema-types-constraints.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/r03-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'R04-sql-crud-join.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/r04-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'W15-paging-offset-vs-cursor.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/w15-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'V04-test-db-strategy.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/v04-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'B01-account-lifecycle.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/b01-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D01-dev-lifecycle-overview.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d01-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D02-server-network-basics.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d02-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D03-rest-api-dev-process.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d03-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D04-build-pipeline-explained.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d04-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D05-debugging-methodology.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d05-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D06-deployment-concepts.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d06-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D07-onprem-vs-cloud.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d07-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D08-cicd-collaboration.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d08-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D09-operations-observability.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d09-learning.css', path.dirname(abs))}">` : ''}${path.basename(abs) === 'D10-database-basics.md' ? `<link rel="stylesheet" href="${assetUrl('tools/site/p09-learning.css', path.dirname(abs))}"><link rel="stylesheet" href="${assetUrl('tools/site/d10-learning.css', path.dirname(abs))}">` : ''}${isHome ? `<link rel="stylesheet" href="${assetUrl('tools/site/knowledge-dark.css', path.dirname(abs))}">` : ''}${abs.startsWith(`${DOC_DIR}${path.sep}`) || rel(abs).startsWith('lessons/') ? ['concept-content.css', 'concept-layout.css'].map(name => `<link rel="stylesheet" href="${assetUrl(`tools/site/${name}`, path.dirname(abs))}">`).join('') : ''}${isCorePage ? `<link rel="stylesheet" href="${assetUrl('tools/site/core-learning.css', path.dirname(abs))}">` : ''}${['course-tokens.css', 'course-content.css', 'contrast.css', 'course-navigation.css', 'course-data-blocks.css', 'course-semantics.css', 'course-flow-layout.css', 'section-switcher.css', 'site-frame.css'].map(name => `<link rel="stylesheet" href="${assetUrl(`tools/site/${name}`, path.dirname(abs))}">`).join('\n')}
${lv ? `<link rel="stylesheet" href="${assetUrl('tools/site/functional-reference-context.css', path.dirname(abs))}">` : ''}
${functionalTask?.id === 'create' ? `<link rel="stylesheet" href="${assetUrl('tools/site/functional-new-post-focus.css', path.dirname(abs))}">` : ''}
</head>
<body${isCorePage ? ' class="concept-core-page"' : isHome ? ' class="home-page"' : isCourse ? ' class="course-page"' : isFunctional ? ' class="functional-page"' : abs === path.join(DOC_DIR, 'README.md') ? ' class="knowledge-catalog-page"' : path.basename(abs) === 'P16-json-jackson-practical.md' ? ' class="knowledge-detail-page"' : ''}${abs === path.join(ROOT, 'scenario/ch0-first-steps/0-1-ts-to-java.md') ? ' class="first-java-page"' : abs === path.join(ROOT, 'scenario/ch0-first-steps/0-2-annotations.md') ? ' class="first-java-page annotation-page"' : abs === path.join(ROOT, 'scenario/ch0-first-steps/0-3-request-four-places.md') ? ' class="first-java-page request-places-page"' : abs === path.join(ROOT, 'scenario/ch0-first-steps/0-4-dto-rules.md') ? ' class="first-java-page profile-dto-page"' : abs === path.join(ROOT, 'scenario/ch0-first-steps/0-5-read-stack-trace.md') ? ' class="first-java-page member-debug-page"' : abs === path.join(ROOT, 'scenario/ch0-first-steps/0-6-gradle-and-yml.md') ? ' class="first-java-page config-page"' : abs === path.join(ROOT, 'scenario/ch1-create-post/1-1-receive-request.md') ? ' class="first-api-page"' : abs === path.join(ROOT, 'scenario/ch1-create-post/1-2-dto-response.md') ? ' class="first-db-page"' : abs === path.join(ROOT, 'scenario/ch1-create-post/1-3-service-layer.md') ? ' class="first-tx-page"' : abs === path.join(ROOT, 'scenario/ch1-create-post/1-4-save-to-db.md') ? ' class="post-mapping-page"' : abs === path.join(ROOT, 'scenario/ch1-create-post/1-5-validation.md') ? ' class="validation-page"' : abs === path.join(ROOT, 'scenario/ch1-create-post/1-6-token-auth.md') ? ' class="token-author-page"' : abs === path.join(ROOT, 'scenario/ch10-project/10-4-login-jwt.md') ? ' class="jwt-login-page"' : abs === path.join(ROOT, 'scenario/labs/l15-session-auth/README.md') ? ' class="session-lab-page"' : abs === path.join(ROOT, 'scenario/labs/l16-interface-implementations/README.md') ? ' class="interface-lab-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-01-response-to-query.md') ? ' class="db01-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-02-select-cursor.md') ? ' class="db02-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-03-detail-join.md') ? ' class="db03-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-04-tag-filter-and-exists.md') ? ' class="db04-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-05-aggregate-fanout.md') ? ' class="db05-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-06-exists-not-exists.md') ? ' class="db06-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/DB-07-same-api-five-query-styles.md') ? ' class="db07-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/DB-08-explain-hypothesis.md') ? ' class="db08-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/DB-09-explain-analyze.md') ? ' class="db09-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/DB-10-performance-fixture.md') ? ' class="db10-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/DB-11-index-lifecycle.md') ? ' class="db11-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-12-join-exists-explain.md') ? ' class="db12-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-13-list-api-n-plus-one.md') ? ' class="db13-focused-page"' : abs === path.join(ROOT, 'scenario/db-query-journey/db-14-live-schema-to-slow-query.md') ? ' class="db14-focused-page"' : abs === path.join(ROOT, 'scenario/labs/l12-query-methods/README.md') ? ' class="l12-focused-page"' : abs === path.join(ROOT, 'docs/knowledge/P02-mvc-layered-architecture.md') ? ' class="p02-focused-page"' : ''}${isConceptDarkSurface ? ' data-concept-surface="dark"' : ''}>
${renderSiteNavigation(rel(abs))}
<a class="site-skip" href="#site-main">본문으로 건너뛰기</a>
<main id="site-main"${hasDbIndexExperiment ? ' class="db-index-main"' : abs.startsWith(`${DOC_DIR}${path.sep}`) && /^[A-Z]\d{2}-.*\.md$/.test(path.basename(abs)) ? ' class="knowledge-main"' : ''}>
${crumbs}
${referenceContext}${body}
${pager}
</main>
${mermaid}
${lv || lab ? `<script src="${assetUrl('tools/site/scenario-runner.js', path.dirname(abs))}" defer></script>` : ''}${['0-1-ts-to-java.md', '0-2-annotations.md', '0-3-request-four-places.md', '0-4-dto-rules.md', '0-5-read-stack-trace.md', '0-6-gradle-and-yml.md'].some((name) => abs === path.join(ROOT, 'scenario/ch0-first-steps', name)) ? `<script src="${assetUrl('tools/site/first-java-journey.js', path.dirname(abs))}" defer></script>` : ''}${lv ? `<script src="${assetUrl('tools/site/scenario-code-workbench.js', path.dirname(abs))}" defer></script><script src="${assetUrl('tools/site/task-focus.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-2-dto-response.md') ? `<script src="${assetUrl('tools/site/first-db-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-3-service-layer.md') ? `<script src="${assetUrl('tools/site/first-transaction-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-4-save-to-db.md') ? `<script src="${assetUrl('tools/site/complete-post-mapping-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-5-validation.md') ? `<script src="${assetUrl('tools/site/validation-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/ch1-create-post/1-6-token-auth.md') ? `<script src="${assetUrl('tools/site/token-author-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/ch10-project/10-4-login-jwt.md') ? `<script src="${assetUrl('tools/site/jwt-login-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/labs/l15-session-auth/README.md') ? `<script src="${assetUrl('tools/site/session-lab-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/labs/l16-interface-implementations/README.md') ? `<script src="${assetUrl('tools/site/interface-impl-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-01-response-to-query.md') ? `<script src="${assetUrl('tools/site/db01-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-02-select-cursor.md') ? `<script src="${assetUrl('tools/site/db02-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-03-detail-join.md') ? `<script src="${assetUrl('tools/site/db03-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-04-tag-filter-and-exists.md') ? `<script src="${assetUrl('tools/site/db04-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-05-aggregate-fanout.md') ? `<script src="${assetUrl('tools/site/db05-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-06-exists-not-exists.md') ? `<script src="${assetUrl('tools/site/db06-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-07-same-api-five-query-styles.md') ? `<script src="${assetUrl('tools/site/db07-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-08-explain-hypothesis.md') ? `<script src="${assetUrl('tools/site/db08-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-09-explain-analyze.md') ? `<script src="${assetUrl('tools/site/db09-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-10-performance-fixture.md') ? `<script src="${assetUrl('tools/site/db10-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/DB-11-index-lifecycle.md') ? `<script src="${assetUrl('tools/site/db11-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-12-join-exists-explain.md') ? `<script src="${assetUrl('tools/site/db12-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-13-list-api-n-plus-one.md') ? `<script src="${assetUrl('tools/site/db13-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/db-query-journey/db-14-live-schema-to-slow-query.md') ? `<script src="${assetUrl('tools/site/db14-focused-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'scenario/labs/l12-query-methods/README.md') ? `<script src="${assetUrl('tools/site/l12-query-journey.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'docs/knowledge/S09-jpa-hibernate.md') ? `<script src="${assetUrl('tools/site/jpa-focused.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'docs/knowledge/W04-mybatis-xml-practical.md') ? `<script src="${assetUrl('tools/site/mybatis-focused.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'docs/knowledge/W11-why-tx-in-service.md') ? `<script src="${assetUrl('tools/site/tx-why-focused.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'docs/knowledge/S08-transactions.md') ? `<script src="${assetUrl('tools/site/tx-lifecycle-focused.js', path.dirname(abs))}" defer></script>` : ''}${abs === path.join(ROOT, 'docs/knowledge/P02-mvc-layered-architecture.md') ? `<script src="${assetUrl('tools/site/p02-focused.js', path.dirname(abs))}" defer></script>` : ''}${hasDbIndexExperiment ? `<script src="${assetUrl('tools/site/db-index-experiment.js', path.dirname(abs))}" defer></script>` : ''}
${abs === path.join(ROOT, 'scenario/ch4-like/4-2-like-concurrency.md') ? `<script src="${assetUrl('tools/site/first-java-journey.js', path.dirname(abs))}" defer></script>` : ''}${['S14-messaging.md', 'W23-cache-and-in-memory.md', 'S12-security-architecture.md'].some((name) => abs === path.join(ROOT, 'docs/knowledge', name)) ? `<script src="${assetUrl('tools/site/concept-scenes.js', path.dirname(abs))}" defer></script>` : ''}
${['P08-maven-gradle-practical.md','S03-boot-autoconfig.md','S04-config-profiles.md','R08-app-to-db-connection.md'].some((name) => abs === path.join(ROOT, 'docs/knowledge', name)) ? `<script src="${assetUrl('tools/site/config-concept-scenes.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D11-web-security-basics.md' ? `<script src="${assetUrl('tools/site/d11-learning.bundle.js', path.dirname(abs))}" defer></script>\n` : path.basename(abs) === 'D12-linux-terminal-basics.md' ? `<script src="${assetUrl('tools/site/d12-learning.bundle.js', path.dirname(abs))}" defer></script>\n` : '\n'}${abs.startsWith(`${DOC_DIR}${path.sep}`) ? `<script data-knowledge-initial>${fs.readFileSync(path.join(ROOT, 'tools/site/knowledge-learning.bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script')}</script><script src="${assetUrl('tools/site/knowledge-learning.bundle.js', path.dirname(abs))}" defer></script><script data-reader-initial>${fs.readFileSync(path.join(ROOT, 'tools/site/knowledge-reader.js'), 'utf8').replace(/<\/script/gi, '<\\/script')}\ninitKnowledgeReader(document, window);</script>` : ''}${path.basename(abs) === 'P09-java-syntax-basics.md' ? `<script src="${assetUrl('tools/site/p09-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'P04-constructors-builder.md' ? `<script src="${assetUrl('tools/site/p04-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'P16-json-jackson-practical.md' ? `<script src="${assetUrl('tools/site/p16-contract-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'W09-why-dto.md' ? `<script src="${assetUrl('tools/site/w09-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'P19-mysql-jpa-setup.md' ? `<script src="${assetUrl('tools/site/p19-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'P20-jpa-entity-mapping.md' ? `<script src="${assetUrl('tools/site/p20-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'S09-jpa-hibernate.md' ? `<script src="${assetUrl('tools/site/s09-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'S08-transactions.md' ? `<script src="${assetUrl('tools/site/s08-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'W11-why-tx-in-service.md' ? `<script src="${assetUrl('tools/site/w11-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'R03-schema-types-constraints.md' ? `<script src="${assetUrl('tools/site/r03-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'R04-sql-crud-join.md' ? `<script src="${assetUrl('tools/site/r04-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'W15-paging-offset-vs-cursor.md' ? `<script src="${assetUrl('tools/site/w15-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'V04-test-db-strategy.md' ? `<script src="${assetUrl('tools/site/v04-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'B01-account-lifecycle.md' ? `<script src="${assetUrl('tools/site/b01-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D01-dev-lifecycle-overview.md' ? `<script src="${assetUrl('tools/site/d01-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D02-server-network-basics.md' ? `<script src="${assetUrl('tools/site/d02-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D03-rest-api-dev-process.md' ? `<script src="${assetUrl('tools/site/d03-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D04-build-pipeline-explained.md' ? `<script src="${assetUrl('tools/site/d04-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D05-debugging-methodology.md' ? `<script src="${assetUrl('tools/site/d05-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D06-deployment-concepts.md' ? `<script src="${assetUrl('tools/site/d06-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D07-onprem-vs-cloud.md' ? `<script src="${assetUrl('tools/site/d07-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D08-cicd-collaboration.md' ? `<script src="${assetUrl('tools/site/d08-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D09-operations-observability.md' ? `<script src="${assetUrl('tools/site/d09-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${path.basename(abs) === 'D10-database-basics.md' ? `<script src="${assetUrl('tools/site/d10-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}
${isCorePage ? `<script data-core-initial>${fs.readFileSync(path.join(ROOT, 'tools/site/core-learning.bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script')}</script><script src="${assetUrl('tools/site/core-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}${rel(abs).startsWith('course/') || isHome || body.includes('data-config-tabs') ? `<script data-course-initial>${fs.readFileSync(path.join(ROOT, 'tools/site/course.js'), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>\n` : ''}${isCourseMap ? `<script src="${assetUrl('tools/site/course-map.js', path.dirname(abs))}" defer></script>\n` : ''}${hasFlow ? `<script src="${assetUrl('tools/site/course-flow.js', path.dirname(abs))}" defer></script>\n` : ''}<script src="${assetUrl('tools/site/course-semantic-colors.js', path.dirname(abs))}" defer></script>
<script data-section-initial>${(rel(abs).startsWith('lessons/') && !isCorePage ? fs.readFileSync(path.join(ROOT, 'tools/site/section-switcher.js'), 'utf8').replace('paint(all); reveal(false);', "paint(all); reveal(false); if (!window.location.hash) { var initial = main.querySelector('[data-concept-default]')?.dataset.conceptDefault; var first = entries.find(function(item) { return item.id === initial; }); if (first) paint(first); }") : abs === path.join(DOC_DIR, 'README.md') ? fs.readFileSync(path.join(ROOT, 'tools/site/section-switcher.js'), 'utf8').replace('window.location.hash.slice(1)', '(window.__javaExperienceConceptHash || window.location.hash).slice(1)') : fs.readFileSync(path.join(ROOT, 'tools/site/section-switcher.js'), 'utf8')).replace(/<\/script/gi, '<\\/script')}</script>
${homeTask ? `<script src="${assetUrl('tools/site/home-learning.bundle.js', path.dirname(abs))}" defer data-home-controller data-home-root="${up('index.html')}"${homeTask ? ` data-home-task="${homeTask.id}"` : ''}></script>\n` : ''}${isFunctional ? `<script src="${assetUrl('tools/site/functional-scenario.js', path.dirname(abs))}" defer></script>\n<script src="${assetUrl('tools/site/functional-visual-learning.bundle.js', path.dirname(abs))}" defer></script>` : ''}
${lv ? `<script src="${assetUrl('tools/site/functional-reference.bundle.js', path.dirname(abs))}" defer></script>` : ''}
${hasServicePageUI && (isServiceFeaturePage || abs === path.join(ROOT, 'scenario/README.md')) && fs.existsSync(path.join(ROOT, 'tools/site/service-feature.bundle.js')) ? `<script data-service-initial>${fs.readFileSync(path.join(ROOT, 'tools/site/service-feature.bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script')}</script><script src="${assetUrl('tools/site/service-feature.bundle.js', path.dirname(abs))}" defer></script>` : ''}
</body>
</html>
`);
}

function renderRequests(text, blockNumber, abs) {
  let data;
  try { data = JSON.parse(text); } catch (error) { throw new Error(`${rel(abs)} check 블록 JSON 오류: ${error.message}`); }
  const requests = Array.isArray(data) ? data : data.requests;
  if (!Array.isArray(requests)) return `<pre><code>${escapeHtml(text)}</code></pre>`;
  const checks = data.checks || [];
  const requestIds = new Set(requests.map((request) => request.id));
  const cards = requests.map((request, index) => {
    const cardId = `browser-request-${blockNumber}-${index + 1}`;
    const statusId = `request-status-${blockNumber}-${index + 1}`;
    const expect = checks.filter((check) => check.request === request.id || check.all?.some((item) => item.request === request.id))
      .map((check) => `${check.id}: ${JSON.stringify(check.expect || check.all?.find((item) => item.request === request.id)?.expect || {})}`).join('\n');
    const refs = new Set(`${request.path || ''} ${typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? '')}`.match(/\{\{([^}]+)\}\}/g) || []);
    const concurrentVars = request.concurrent?.vars || {};
    const clientConcurrentVars = Object.fromEntries(Object.entries(concurrentVars).map(([name, values]) => [
      name, /token|auth|^tok$/i.test(name) ? Array(values.length).fill('') : values,
    ]));
    const variables = [...refs].map((ref) => ({ ref, name: ref.slice(2, -2), response: requestIds.has(ref.slice(2, -2).split('.')[0]), grouped: Object.hasOwn(concurrentVars, ref.slice(2, -2)) }));
    const headerInputs = Object.entries(request.headers || {}).map(([name, value]) => {
      const isAuth = /^authorization$/i.test(name);
      const hasTemplate = String(value).includes('{{');
      // 공개 학습용 정적 예시 토큰은 바로 실행할 수 있게 표시하고 편집 가능하게 둔다.
      // 템플릿 토큰은 실제 값을 추측하지 않고 학습자가 입력하도록 비워 둔다.
      const shown = isAuth && hasTemplate ? '' : String(value);
      const placeholder = isAuth && hasTemplate ? '연습용 토큰을 직접 입력' : '';
      return `<label>헤더 · ${escapeHtml(name)} <input class="request-header" data-name="${escapeHtml(name)}" data-template="${escapeHtml(value)}" value="${escapeHtml(shown)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false"></label>`;
    }).join('');
    const bodyText = request.body === undefined ? '' : typeof request.body === 'string' ? request.body : JSON.stringify(request.body, null, 2);
    const bodyInput = request.body === undefined ? '' : `<label>Raw body <textarea class="request-body" data-body-kind="${typeof request.body === 'string' ? 'text' : 'json'}" rows="4" spellcheck="false">${escapeTextarea(bodyText)}</textarea></label>`;
    const groupedInputs = Object.entries(concurrentVars).map(([name, values]) => {
      const tokenVar = /token|auth|^tok$/i.test(name);
      return `<label>${escapeHtml(name)} — ${tokenVar ? '토큰을 직접 입력 (한 줄에 하나)' : '요청별 값'} <textarea class="request-var-values" data-name="${escapeHtml(name)}" rows="${Math.min(Math.max(values.length, 2), 6)}" placeholder="${values.length}개 값, 한 줄에 하나씩">${escapeTextarea(tokenVar ? '' : values.join('\n'))}</textarea></label>`;
    }).join('');
    const mode = request.concurrent ? `동시 요청 ${request.concurrent.count}개` : request.repeat ? `같은 요청 ${request.repeat}회 순차 전송` : '';
    const variableInputs = variables.length || groupedInputs ? `<div class="request-variables">${groupedInputs}${variables.filter((v) => !v.response && !v.grouped).map((v) => `<label>${escapeHtml(v.name)} <input class="request-variable" data-ref="${escapeHtml(v.ref)}" autocomplete="off"></label>`).join('')}<p>선행 요청 참조는 해당 요청을 먼저 보내면 응답 값으로 자동 채웁니다.</p></div>` : '';
    const expected = expect || '직접 확인 절의 기대 결과를 참고하세요.';
    return `<article id="${cardId}" class="api-request" data-request-id="${escapeHtml(request.id)}" data-method="${escapeHtml(request.method)}" data-request-index="${index}" data-concurrent-count="${String(request.concurrent?.count || 0)}" data-concurrent-vars="${escapeHtml(JSON.stringify(clientConcurrentVars))}" data-repeat="${String(request.repeat || 0)}"><header class="request-card-head"><div><p class="request-method">${escapeHtml(request.method)} · ${escapeHtml(request.id)}${mode ? ` · ${escapeHtml(mode)}` : ''}</p><h4>${escapeHtml(request.title || '요청')}</h4></div><span class="request-number">요청 ${index + 1}</span></header><div class="request-editor"><label>경로 <input class="request-path" value="${escapeHtml(request.path || '')}" autocomplete="off" spellcheck="false"></label>${variableInputs}<div class="request-fields">${headerInputs}</div>${bodyInput}<div class="request-actions"><button type="button" class="send-request" aria-describedby="${statusId}">${escapeHtml(request.method)} ${mode ? escapeHtml(mode) : '요청 보내기'}</button><p id="${statusId}" class="request-status" role="status" aria-live="polite"></p></div></div><details class="request-response" hidden><summary>응답 확인</summary><p class="response-status"></p><h5>Headers</h5><pre class="response-headers"></pre><h5>Body</h5><pre class="response-body"></pre></details><details class="postman"><summary>Postman 설정 보기</summary><dl><dt>Method</dt><dd>${escapeHtml(request.method)}</dd><dt>Full URL</dt><dd class="postman-url"></dd><dt>Headers</dt><dd><pre>${escapeHtml(JSON.stringify(request.headers || {}, null, 2))}</pre></dd><dt>Raw body</dt><dd><pre>${request.body === undefined ? '(본문 없음)' : escapeTextarea(bodyText)}</pre></dd><dt>Expected result</dt><dd><pre>${escapeHtml(expected)}</pre></dd></dl></details></article>`;
  }).join('');
  const steps = requests.map((request, index) => `<li data-method="${escapeHtml(request.method)}"><a href="#browser-request-${blockNumber}-${index + 1}"><span class="request-step-number">${index + 1}</span><span class="request-step-content"><span class="request-step-method">${escapeHtml(request.method)} · ${escapeHtml(request.id)}</span><span class="request-step-title">${escapeHtml(request.title || '요청')}</span></span></a></li>`).join('');
  const methodCounts = [...new Set(requests.map((request) => request.method))]
    .map((method) => `${method} ${requests.filter((request) => request.method === method).length}`).join(' · ');
  const stepsNav = requests.length > 8
    ? `<details class="request-steps"><summary>요청 순서 보기 <span>${escapeHtml(methodCounts)}</span></summary><nav aria-label="요청 실행 순서"><ol>${steps}</ol></nav></details>`
    : `<nav class="request-steps" aria-label="요청 실행 순서"><ol>${steps}</ol></nav>`;
  return `<section id="browser-requests-${blockNumber}" class="api-practice" aria-label="HTTP 요청 실행"><div class="request-panel-heading"><div><p class="request-eyebrow">직접 확인 · ${requests.length}개 요청</p><h3>브라우저에서 요청 보내기</h3></div><p>위 서버 주소를 확인하고 순서대로 실행하세요. 토큰은 입력 후에도 저장하지 않습니다.</p></div>${stepsNav}<div class="api-request-list">${cards}</div></section>`;
}

function requestPageTools(hasRequests) {
  return `<section class="server-url"><label>서버 주소 <input id="scenario-base-url" type="url" value="http://localhost:8080" spellcheck="false"></label><div class="server-url-help"><p>요청은 브라우저에서 전송됩니다. 서버의 CORS 설정에 이 페이지 출처가 허용되어 있어야 합니다.</p>${hasRequests ? '<a href="#browser-requests-1">이 단계의 요청으로 이동 ↓</a>' : ''}</div></section>`;
}

// ---------------------------------------------------------------- 실행
await validateCurriculum(loadKnowledgeCatalog(ROOT), { root: ROOT });
writeToc();
const files = listMd();
const results = new Map(files.map((f) => [f, render(f)]));
const errors = [];
for (const [f, r] of results) {
  for (const l of r.links) {
    if (!fs.existsSync(l.target)) { errors.push(`${rel(f)}: 없는 파일 → ${l.href}`); continue; }
    if (l.hash) {
      const t = results.get(l.target);
      if (!t) { errors.push(`${rel(f)}: 앵커 검사 불가(빌드 대상 아님) → ${l.href}`); continue; }
      if (!t.anchors.has(l.hash)) errors.push(`${rel(f)}: 없는 앵커 → ${l.href}`);
    }
  }
}
if (errors.length) {
  console.error(`깨진 링크 ${errors.length}개:\n` + errors.join('\n'));
  process.exit(1);
}
const outputs = new Map();
for (const [f, r] of results) {
  const title = (read(f).match(/^# (.+)$/m)?.[1] ?? path.basename(f)).replace(/[`*]/g, '');
  outputs.set(f.replace(/\.md$/, '.html'), renderInitialPage(page({ abs: f, title, body: r.html, hasMermaid: r.hasMermaid, hasDbIndexExperiment: r.hasDbIndexExperiment }), rel(f)));
  // 닫힌 JSDOM의 대기 이벤트를 비워 다음 문서 전에 회수할 수 있게 한다.
  await new Promise(resolve => setImmediate(resolve));
}
// index도 이번 빌드의 홈으로 검사한다. 디스크에 남은 이전 홈의 앵커를 보지 않는다.
outputs.set(path.join(ROOT, 'index.html'), outputs.get(path.join(ROOT, 'README.html')));
// 과정 v2 렌더러가 넣은 링크(홈 진입·지도·이전/다음·티켓 배지·흐름 목록, JSON 데이터의 href)는 위 marked 링크 검사를 거치지 않는다.
// 홈과 course/ 아래 페이지의 최종 HTML에서 파일·앵커를 다시 검사한다. 이번 빌드가 쓸 페이지도 있는 것으로 본다.
const injectedErrors = findInjectedLinkErrors(outputs, ROOT);
if (injectedErrors.length) {
  console.error(`렌더러가 넣은 링크 중 깨진 것 ${injectedErrors.length}개:\n` + injectedErrors.join('\n'));
  process.exit(1);
}
for (const [out, html] of outputs) fs.writeFileSync(out, html);
fs.copyFileSync(path.join(ROOT, 'README.html'), path.join(ROOT, 'index.html'));
console.log(`HTML ${results.size}개 생성 · 시나리오 단계 ${LEVELS.length}개 · 링크 오류 0`);
