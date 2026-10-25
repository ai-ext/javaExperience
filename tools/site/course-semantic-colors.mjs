// 의미가 명시된 표시만 색으로 구분하고 코드 원문과 문장 내용은 보존한다.
import { JSDOM } from 'jsdom';

export const HTTP_COLORS = {
  '200':'#8ed7ad', '201':'#c1e88b', '202':'#96e5d7', '204':'#79dfbf',
  '400':'#ffd07d', '401':'#ffb68b', '403':'#ff9fae', '404':'#d5b2ff',
  '405':'#f6c39e', '408':'#b8c0ff', '409':'#ff9de0', '415':'#b9df80',
  '422':'#ede482', '429':'#81d9ed', '500':'#ff9b94', '502':'#aebeff',
  '503':'#f4a9f0', '504':'#ffc2ad', '4xx':'#ffdca5', '5xx':'#ffb5c5', timeout:'#c9bfff',
};
export const LAYER_COLORS = {
  database:'#f2ce87', query:'#a3de8c', repository:'#a5c9ff', service:'#c2b2ff',
  controller:'#81dbde', test:'#f3a9cd', dto:'#f4b597', entity:'#c3d780',
  config:'#e3b5e8', security:'#a0d8c4', client:'#aac7de', external:'#ecba79',
  cache:'#c9c78a', event:'#e8ace2', observe:'#98dbb4', runtime:'#bac1f0',
};
const NODE_KINDS = {
  client:'client',browser:'client',filter:'security',security:'security',cors:'security',jwt:'security',authz:'security',rules:'security',
  controller:'controller',api:'controller',service:'service',point:'service',aop:'service',
  repository:'repository',mapper:'query',mysql:'database',db:'database',data:'entity',
  redis:'cache',pg:'external',listener:'event',app:'runtime',config:'config',bean:'entity',
  handler:'controller',actuator:'observe',datasource:'database',pool:'database',log:'observe',
  thread:'runtime',code:'query',clock:'runtime',response:'dto',symptom:'observe',observe:'observe',
};
export function fileLayer(text) {
  if (/Test(?:s)?\b|[Tt]est\.java|[Tt]est[s]?\/|테스트/.test(text)) return 'test';
  if (/Controller|컨트롤러|Handler|Advice/.test(text)) return 'controller';
  if (/Service|서비스|AOP|프록시/.test(text)) return 'service';
  if (/Mapper|\.xml\b|쿼리|SQL|\.sql\b/.test(text)) return 'query';
  if (/Repository|DAO|리포지토리|저장소/.test(text)) return 'repository';
  if (/DTO|Dto|Request|Response|요청.*응답/.test(text)) return 'dto';
  if (/Entity|엔티티|모델|도메인/.test(text)) return 'entity';
  if (/MySQL|DB|DataSource|테이블|데이터베이스/.test(text)) return 'database';
  if (/Security|Filter|인증|인가|보안/.test(text)) return 'security';
  if (/Config|\.ya?ml\b|\.properties\b|설정/.test(text)) return 'config';
  return null;
}

export function annotateSemanticColors(root) {
  const doc = root.ownerDocument || root;
  for (const el of root.querySelectorAll('.file-layer,.file-name,.file-path,.file-paths code,.fact-layers li,.fact-layers code,.step-layer,.relation-node')) {
    if (el.closest('.knowledge-reader-original')) continue;
    const layer = fileLayer(el.textContent);
    if (layer) el.dataset.fileLayer = layer;
  }
  for (const el of root.querySelectorAll('.flow-node[data-node],.flow-step[data-node]')) {
    if (el.closest('.knowledge-reader-original')) continue;
    if (!el.classList.contains('is-masked') && NODE_KINDS[el.dataset.node]) el.dataset.nodeKind = NODE_KINDS[el.dataset.node];
  }
  for (const el of root.querySelectorAll('.visual-procedure li,.visual-flow li,.guide-day-flow li,.task-visual-sequence > ol > li,.task-visual-timeline > ol > li')) {
    if (el.closest('.knowledge-reader-original')) continue;
    el.dataset.sequence = String([...el.parentElement.children].indexOf(el) % 6 + 1);
  }
  for (const label of root.querySelectorAll('.fact-layers p:not(.fact-label),.fact-layers li,.step-layer')) {
    if (label.closest('.knowledge-reader-original')) continue;
    const labels = doc.createTreeWalker(label, 4), parts = [];
    while (labels.nextNode()) parts.push(labels.currentNode);
    for (const part of parts) {
      if (part.parentElement.closest('[data-file-layer]')) continue;
      const fragment = doc.createDocumentFragment();
      let cursor = 0;
      for (const match of part.textContent.matchAll(/Controller|Service|Repository|Mapper|DTO|Entity|SQL|MySQL|DB|Test|컨트롤러|서비스|리포지토리|쿼리|엔티티|테스트/g)) {
        fragment.append(part.textContent.slice(cursor, match.index));
        const span = doc.createElement('span'); span.className = 'semantic-layer-label';
        span.dataset.fileLayer = fileLayer(match[0]); span.textContent = match[0]; fragment.append(span);
        cursor = match.index + match[0].length;
      }
      if (cursor) { fragment.append(part.textContent.slice(cursor)); part.replaceWith(fragment); }
    }
  }
  const walker = doc.createTreeWalker(root, 4);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  for (const text of texts) {
    const parent = text.parentElement;
    if (!parent || parent.closest('.knowledge-reader-original,pre,script,style,textarea,option,svg,[data-http-status],.file-path,.file-name,input')) continue;
    const matches = [...text.textContent.matchAll(/\b(?:200|201|202|204|400|401|403|404|405|408|409|415|422|429|500|502|503|504|4xx|5xx)\b|\btimeout\b|타임아웃/gi)];
    if (!matches.length) continue;
    const context = parent.closest('tr,li,p,dd,dt,h2,h3,h4,.flow-values,.visual-comparison,.request-response')?.textContent || parent.textContent;
    const isResponse = /HTTP|응답|상태|오류|요청|성공|생성|조회|저장|삭제|실패|GET|POST|PUT|PATCH|DELETE|success|OK|not.found|validation|forbidden|타임아웃|timeout|DTO|400|404/i.test(context);
    if (!isResponse) continue;
    const fragment = doc.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      const before = text.textContent[match.index - 1] || '';
      const after = text.textContent[match.index + match[0].length] || '';
      if (/[\w./-]/.test(before) || /[\w./가-힣-]/.test(after)) continue;
      fragment.append(text.textContent.slice(cursor, match.index));
      const badge = doc.createElement('span');
      badge.dataset.httpStatus = /timeout|타임아웃/i.test(match[0]) ? 'timeout' : match[0].toLowerCase();
      badge.className = 'semantic-http-status';
      badge.textContent = match[0];
      fragment.append(badge);
      cursor = match.index + match[0].length;
    }
    if (!cursor) continue;
    fragment.append(text.textContent.slice(cursor));
    text.replaceWith(fragment);
  }
}

export function renderSemanticColors(body) {
  // 코드·스크립트의 원문 직렬화는 색 주석과 관계없이 그대로 돌려준다.
  const originals = [];
  const protectedBody = body.replace(/<(pre|script|style|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi, original => {
    const index = originals.push(original) - 1;
    return `<template data-color-original="${index}"></template>`;
  });
  const dom = new JSDOM(`<body>${protectedBody}</body>`);
  annotateSemanticColors(dom.window.document.body);
  const result = dom.window.document.body.innerHTML.replace(/<template data-color-original="(\d+)"><\/template>/g, (_,index) => originals[Number(index)]);
  dom.window.close();
  return result;
}
