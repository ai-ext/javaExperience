import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseTalkCards } from './build-days.mjs';

const read = p => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const publicText = md => md.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '');

test('J09는 출석 티켓의 목적만 연결하고 원인을 먼저 밝히지 않는다', () => {
  const links = read('course/java/J09.md').split('## 오늘 Spring에서 다시 만나는 곳')[1];
  assert.match(links, /<a href="\.\.\/spring\/D13\.html#step-d13-3">D13 ③ · B09<\/a>/);
  assert.match(links, /시각.*고정.*재현/);
  const b09 = links.split('\n').find(line => line.includes('B09'));
  assert.doesNotMatch(b09 ?? '', /UTC.*잘|Clock\.systemUTC|LocalDate\.ofInstant/);
});

test('J11~J14는 공개 목적과 작업 링크를 주고 상세 해설을 접어 둔다', () => {
  const expected = {
    J11: ['D11', '특성화'],
    J12: ['D12', '메서드'],
    J13: ['D13', '읽기'],
    J14: ['D14', '값'],
  };
  for (const [id, [day, purpose]] of Object.entries(expected)) {
    const section = read(`course/java/${id}.md`).split('## 오늘 Spring에서 다시 만나는 곳')[1];
    const beforeDetails = section.split('<details>')[0];
    assert.match(beforeDetails, new RegExp(`(?:\\[${day}[^\\]]*\\]\\(\\.\\./spring/${day}\\.md\\)|<a href="\\.\\./spring/${day}\\.html#[^"]+">${day}[^<]*</a>)`), id);
    assert.ok(beforeDetails.includes(purpose), `${id}: 학습 목적`);
    assert.match(section, /<details>\s*<summary>티켓을 마친 뒤 읽기<\/summary>/, id);
    assert.doesNotMatch(beforeDetails, /start\(|placeOnce|TransactionTemplate|AFTER_COMMIT|RedisGuard|passwordHash|GEN_KEY/, id);
  }
  const j13 = publicText(read('course/java/J13.md')).split('## 오늘 Spring에서 다시 만나는 곳')[1];
  assert.match(j13, /전략 패턴.*직접 구현.*요구하지/);
});

test('raw HTML 순서 앵커는 Markdown 제목 앵커 검사에 넣지 않는다', () => {
  for (const id of ['J09','J11','J12','J13','J14']) {
    assert.doesNotMatch(read(`course/java/${id}.md`), /\]\([^)]*#step-d\d{2}-\d+\)/, id);
  }
});

test('D13 카드의 과제 번호·티켓은 로드맵과 맞고 D05 인덱스 요구가 질문에 있다', () => {
  const roadmap = JSON.parse(read('course/roadmap.json'));
  const cards = parseTalkCards(read('course/talk-cards.md'));
  const day = roadmap.days.find(d => d.id === 'D13');
  for (const [id, no, ticket] of [['TC-D13-1',5,'B06'], ['TC-D13-2',2,'B07'], ['TC-D13-3',3,'B09'], ['TC-D13-4',4,'B10']]) {
    const step = day.steps.find(s => s.no === no);
    assert.ok(step.tickets.includes(ticket), id);
    assert.ok(cards.get(id).question.includes(`D13 ${'①②③④⑤'[no - 1]} · ${ticket}`), id);
  }
  assert.match(cards.get('TC-D05-5').question, /인덱스.*이유/);
});

test('E01은 선행 자료와 결과 조건의 세 단계를 공개하고 구현 예시는 숨긴다', () => {
  const md = read('course/tickets/E01.md');
  const section = publicText(md).split('## 진행 순서와 선행 자료')[1]?.split('## 환경과 재현')[0];
  assert.ok(section, '진행 순서가 환경 재현 앞에 있어야 한다');
  for (const path of ['../java/J07.md','../java/J12.md','../java/J14.md','../spring/D09.md','B15.md','B16.md']) assert.ok(section.includes(`](${path})`), path);
  assert.match(section, /1\..*동시 적재[\s\S]*2\..*대기 상한[\s\S]*3\..*무효화 경쟁/);
  assert.match(section, /100요청.*1회/);
  assert.match(section, /상한.*200/);
  assert.match(section, /삭제 응답 뒤.*그 글이 없/);
  assert.doesNotMatch(section, /Lua|CompletableFuture|ReentrantLock|세대 번호|SET NX/);
});
