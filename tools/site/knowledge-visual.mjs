import fs from 'node:fs';
import path from 'node:path';
import { loadKnowledgeCatalog } from './knowledge-catalog-data.mjs';
import { renderKnowledgeCatalog } from './knowledge-catalog-view.mjs';
import { CORE_UNITS, DOMAINS, classifyConcept } from './concept-curriculum.mjs';

/** 웹 시안의 탐색 메타데이터를 현재 Markdown 제목·소제목과 결합한다. */
export function renderKnowledgeVisual(root) {
  const directory = path.join(root, 'docs/design/knowledge-2026-10-19/web-handoff');
  const index = JSON.parse(fs.readFileSync(path.join(directory, 'javaExperience-v8-search-index.json'), 'utf8'));
  const spec = JSON.parse(fs.readFileSync(path.join(directory, 'javaExperience-v8-screen-spec.json'), 'utf8'));
  const byId = new Map(index.documents.map((item) => [item.docId, item]));
  const featured = new Map(spec.browseVariants.flatMap((group) => group.rows.map((row, position) => [row.docId, { ...row, position }])));
  const documents = loadKnowledgeCatalog(root).map((source) => {
    const metadata = byId.get(source.id);
    const sourceTitle = fs.readFileSync(path.join(root, source.sourcePath), 'utf8').match(/^#\s+(.+)$/m)?.[1];
    if (!metadata || metadata.route !== source.sourcePath.replace(/\.md$/, '.html') || ![source.title, sourceTitle].includes(metadata.title)) throw new Error(`웹 시안과 현재 문서가 다릅니다: ${source.id}`);
    const copy = metadata.uiCopy || {};
    const practice = metadata.relatedPractice;
    // 관련 과제는 문맥을 검토한 네 연결만 사용한다. queue의 미확인 역링크는 승격하지 않는다.
    const relatedTasks = metadata.relatedTasks.filter((task) => task.verification === 'sourceLinkAndRelationshipReviewed').map((task) => ({
      href: path.posix.relative('docs/knowledge', task.route), title: task.title.split(' — ')[0],
    }));
    const classification = classifyConcept(source.id);
    return { ...source, category: classification.domain,
      priority: classification.priority, depths: classification.depths,
      classificationBasis: classification.classificationBasis,
      contentReview: classification.contentReview,
      question: copy.searchQuestion || copy.browseQuestion || metadata.displayQuestion,
      displayQuestion: metadata.displayQuestion,
      description: copy.description || source.summary.replace(/`/g, ''),
      reason: copy.selectionReason || '',
      rank: metadata.curationOrder,
      browseRank: featured.get(source.id)?.position ?? 1000,
      relatedTasks,
      practice: practice ? { href: source.href + '#' + encodeURIComponent(practice.anchorId), title: '코드 예제 읽기' } : null,
    };
  });
  const categories = DOMAINS;
  const aliases = Object.fromEntries(index.questionAliases.map(({question, literalQuery}) => [question, literalQuery]));
  return renderKnowledgeCatalog(documents, categories, aliases, CORE_UNITS);
}
