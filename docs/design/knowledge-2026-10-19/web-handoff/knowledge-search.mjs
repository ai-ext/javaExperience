/**
 * Pure, dependency-free search for javaExperience v8.
 *
 *   const result = search(index, {
 *     query: 'DTO', categoryId: 'all', sort: 'relevance',
 *     currentTaskRoute: 'scenario/ch1-create-post/1-1-receive-request.html'
 *   });
 *   // result.items, result.total, result.counts, result.query
 *
 * Load the JSON index in the calling application. This module performs no
 * network requests, IDE/API/DB checks, DOM updates, or progress persistence.
 * Preserve result.query when clearing a category filter. The caller owns URL,
 * history, focus/scroll restoration and explicitly recorded learning progress.
 * Use textContent/framework text interpolation for all labels, never innerHTML.
 */

export function normalize(value) {
  if (typeof value !== 'string') throw new TypeError('Search text must be a string.');
  return value.normalize('NFKC').toLowerCase().trim().replace(/\s+/gu, ' ');
}

function tokenize(value) {
  const normalized = normalize(value);
  return normalized ? [...new Set(normalized.split(' '))] : [];
}

function codePointCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function resolveQuery(index, query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return { mode: 'empty', normalizedQuery, effectiveQuery: '', tokens: [], exactDocId: null, alias: null };
  }
  const exactDocId = Object.hasOwn(index.exactQuestionLookup, normalizedQuery)
    ? index.exactQuestionLookup[normalizedQuery] : null;
  if (exactDocId) {
    return { mode: 'exact-question', normalizedQuery, effectiveQuery: query, tokens: [], exactDocId, alias: null };
  }
  const alias = index.questionAliases.find(item => normalize(item.question) === normalizedQuery);
  const effectiveQuery = alias ? alias.literalQuery : query;
  return {
    mode: alias ? 'question-alias' : 'literal',
    normalizedQuery,
    effectiveQuery,
    tokens: tokenize(effectiveQuery),
    exactDocId: null,
    alias: alias ? { question: alias.question, literalQuery: alias.literalQuery } : null,
  };
}

function headingHref(doc, heading) {
  return heading.anchorId && doc.originalAnchors.includes(heading.anchorId)
    ? `${doc.href}#${encodeURIComponent(heading.anchorId)}` : null;
}

function reasonFor(queryState, match) {
  if (queryState.mode === 'exact-question') {
    return { kind: 'exact-question', text: '입력한 질문과 이 문서의 학습 질문이 일치해요.' };
  }
  if (match.currentTaskMatch) {
    return { kind: 'current-task', text: '지금 과제와의 연결을 원문에서 확인했어요.' };
  }
  if (match.titleMatchedTokens.length) {
    return { kind: 'title', text: `문서 제목에서 ‘${match.titleMatchedTokens.join(' · ')}’를 찾았어요.` };
  }
  if (queryState.mode === 'empty') {
    return { kind: 'browse', text: '학습 질문을 보고 필요한 개념을 선택하세요.' };
  }
  return { kind: 'heading', text: `원문 소제목에서 ‘${queryState.tokens.join(' · ')}’를 찾았어요.` };
}

/**
 * Search original document titles and headings with AND-token literal matching.
 * Full display-question equality and explicit question aliases are separate,
 * disclosed lookup modes; displayQuestion is never searched as a text corpus.
 *
 * Relevance: a verified current-task relation, then the number of title tokens,
 * then the numeric editorial order, then docId. There is no model-generated score.
 * `sort: 'title'` uses the complete preserved original title in Korean collation.
 *
 * Facet counts are calculated after the query and before category filtering.
 * Thus query DTO + category java returns total 0 and counts.all 7, making the
 * category-reset action explicit while preserving the submitted query.
 *
 * @param {object} index javaExperience-v8-search-index.json contents
 * @param {{query?:string, categoryId?:string, sort?:string, currentTaskRoute?:string|null}} options
 * @returns {object} query metadata, counts and original-route-backed items
 */
export function search(index, options = {}) {
  if (!index || !Array.isArray(index.documents) || !Array.isArray(index.categories)) {
    throw new TypeError('A v8 knowledge-search index is required.');
  }
  const { query = '', categoryId = 'all', sort = 'relevance', currentTaskRoute = null } = options;
  const categories = index.categories.map(category => category.id);
  if (categoryId !== 'all' && !categories.includes(categoryId)) {
    throw new RangeError(`Unknown categoryId: ${categoryId}`);
  }
  if (!['relevance', 'title'].includes(sort)) throw new RangeError(`Unknown sort: ${sort}`);
  if (currentTaskRoute !== null && typeof currentTaskRoute !== 'string') {
    throw new TypeError('currentTaskRoute must be an original route string or null.');
  }
  const queryState = resolveQuery(index, query);
  const allowedRoutes = new Set(index.originalRouteAllowlist);
  const allowedTaskRoutes = new Set(index.verifiedTaskRouteAllowlist);
  const activeTask = allowedTaskRoutes.has(currentTaskRoute) ? currentTaskRoute : null;
  const counts = Object.fromEntries(['all', ...categories].map(id => [id, 0]));
  const matches = [];

  for (const doc of index.documents) {
    // Route values come exclusively from the original document allowlist.
    if (!allowedRoutes.has(doc.route)) continue;
    const title = normalize(doc.title);
    const headings = doc.headings.map(heading => ({ heading, normalized: normalize(heading.text) }));
    const literalMatch = queryState.tokens.every(token =>
      title.includes(token) || headings.some(item => item.normalized.includes(token)));
    const isMatch = queryState.mode === 'exact-question'
      ? doc.docId === queryState.exactDocId : literalMatch;
    if (!isMatch) continue;
    counts.all += 1;
    counts[doc.categoryId] += 1;
    if (categoryId !== 'all' && doc.categoryId !== categoryId) continue;
    const relatedTasks = doc.relatedTasks.filter(task =>
      task.verification === 'sourceLinkAndRelationshipReviewed' && allowedTaskRoutes.has(task.route));
    const currentTaskMatch = Boolean(activeTask && relatedTasks.some(task => task.route === activeTask));
    const titleMatchedTokens = queryState.tokens.filter(token => title.includes(token));
    const matchedHeadings = queryState.tokens.length ? headings.flatMap(({ heading, normalized }) => {
      const matchedTokens = queryState.tokens.filter(token => normalized.includes(token));
      return matchedTokens.length ? [{
        text: heading.text,
        anchorId: heading.anchorId,
        href: headingHref(doc, heading),
        matchedTokens,
      }] : [];
    }) : [];
    matches.push({ doc, relatedTasks, currentTaskMatch, titleMatchedTokens, matchedHeadings });
  }

  const titleCollator = new Intl.Collator('ko', { numeric: true, sensitivity: 'base' });
  matches.sort((a, b) => {
    if (sort === 'title') {
      return titleCollator.compare(a.doc.title, b.doc.title) || codePointCompare(a.doc.docId, b.doc.docId);
    }
    return Number(b.currentTaskMatch) - Number(a.currentTaskMatch)
      || b.titleMatchedTokens.length - a.titleMatchedTokens.length
      || a.doc.curationOrder - b.doc.curationOrder
      || codePointCompare(a.doc.docId, b.doc.docId);
  });

  const items = matches.map(match => ({
    docId: match.doc.docId,
    route: match.doc.route,
    href: match.doc.href,
    title: match.doc.title,
    displayQuestion: match.doc.uiCopy?.searchQuestion ?? match.doc.displayQuestion,
    conceptQuestion: match.doc.displayQuestion,
    uiCopy: { ...(match.doc.uiCopy ?? {}) },
    categoryId: match.doc.categoryId,
    categoryLabel: match.doc.categoryLabel,
    relatedTasks: match.relatedTasks.map(task => ({
      ...task, evidence: task.evidence.map(evidence => ({ ...evidence })),
    })),
    relatedPractice: match.doc.relatedPractice ? { ...match.doc.relatedPractice } : null,
    matchedHeadings: match.matchedHeadings,
    selectionReason: match.doc.uiCopy?.selectionReason
      ? { kind: "learning-purpose", text: match.doc.uiCopy.selectionReason }
      : reasonFor(queryState, match),
    matchReason: reasonFor(queryState, match),
    ranking: {
      currentTaskMatch: match.currentTaskMatch,
      titleMatchedTokens: match.titleMatchedTokens,
      curationOrder: match.doc.curationOrder,
    },
  }));
  return {
    query,
    normalizedQuery: queryState.normalizedQuery,
    effectiveQuery: queryState.effectiveQuery,
    matchMode: queryState.mode,
    alias: queryState.alias,
    tokens: [...queryState.tokens],
    categoryId,
    sort,
    currentTaskRoute,
    currentTaskRecognized: Boolean(activeTask),
    total: items.length,
    counts,
    totalDocuments: index.documents.length,
    canClearCategory: categoryId !== 'all',
    countAfterCategoryReset: counts.all,
    items,
  };
}

export default search;
