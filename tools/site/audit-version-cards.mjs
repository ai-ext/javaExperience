import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const html = fs.readFileSync(path.join(root, 'docs/knowledge/S09-jpa-hibernate.html'), 'utf8');
const section = html.match(/<section class="version-cards"[\s\S]*<\/section>\s*<p>주요 근거:/);
if (!section) throw new Error('S09 버전 카드 또는 카드 뒤의 근거 문단이 없다. 사이트를 먼저 빌드해야 한다.');
const cards = [...section[0].matchAll(/<article class="version-card">([\s\S]*?)<\/article>/g)].map((match) => match[1]);
const expected = ['Hibernate 6.0', 'Hibernate 7.0', 'Hibernate 7.4', 'Spring Boot 4.1.1 기준'];
if (cards.length !== expected.length) throw new Error(`버전 카드 ${expected.length}개 필요, 현재 ${cards.length}개`);
for (const [index, title] of expected.entries()) {
  if (!cards[index].includes(title)) throw new Error(`${index + 1}번째 카드 제목이 ${title}이 아니다`);
  for (const label of ['왜 바뀌었나', '실무에서 확인']) if (!cards[index].includes(label)) throw new Error(`${title}: ${label} 구획이 없다`);
}
if (!section[0].includes('<details class="version-original">') || !section[0].includes('<table>')) throw new Error('접힌 원문 표를 보존하지 않았다');
for (const url of ['https://docs.hibernate.org/orm/7.0/migration-guide/', 'https://docs.hibernate.org/orm/7.4/introduction/html_single/', 'https://docs.hibernate.org/orm/7.4/migration-guide/', 'https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html']) {
  if (!html.includes(url)) throw new Error(`문서 출처가 보존되지 않았다: ${url}`);
}
console.log('S09 version cards: 4 cards, separated why/impact, collapsed source table, and citations verified.');
