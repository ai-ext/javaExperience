import fs from 'node:fs';
import path from 'node:path';
import { lexer } from 'marked';

/**
 * README 표 순서와 원문 메타데이터를 보존한다. 분류는 호출자가 별도로 연결한다.
 * href는 docs/knowledge/README.html 기준, sourcePath는 저장소 루트 기준이다.
 * search는 제목과 실제 Markdown h1~h3만 포함하며 요약·본문은 넣지 않는다.
 */
export function loadKnowledgeCatalog(root) {
  const readme = fs.readFileSync(path.join(root, 'docs/knowledge/README.md'), 'utf8');
  const documents = [];
  for (const line of readme.split(/\r?\n/)) {
    const row = line.match(/^\s*\|\s*\[([^\]]+)\]\(([^)]+\.md)\)\s*\|\s*(.*?)\s*\|\s*$/);
    if (!row) continue;
    const [, title, filename, summary] = row;
    const id = title.match(/^([A-Z]\d{2})\./)?.[1];
    if (!id || !filename.startsWith(`${id}-`)) throw new Error(`개념 카탈로그의 문서 ID와 파일명이 다릅니다: ${filename}`);
    const sourcePath = path.posix.join('docs/knowledge', filename);
    const markdown = fs.readFileSync(path.join(root, sourcePath), 'utf8');
    const headings = lexer(markdown).filter((token) => token.type === 'heading' && token.depth <= 3).map((token) => token.text);
    const search = [title, ...headings].join(' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<[^>]*>/g, '')
      .replace(/[`*_~]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ko');
    documents.push({ id, title, summary, href: filename.replace(/\.md$/, '.html'), sourcePath, search });
  }
  return documents;
}
