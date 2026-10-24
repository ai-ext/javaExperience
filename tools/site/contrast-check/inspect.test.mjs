import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlaywright } from './browser.mjs';
import { inspectDom } from './inspect.mjs';
test('실제 브라우저에서 글자·코드·placeholder·경계·SVG와 숨김 상태를 구분한다', async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    await page.setContent(`<style>body{background:#171a1f;color:#fff}button,input{border:1px solid #fff;background:#171a1f;color:#fff}input::placeholder{color:#fff}svg text{fill:#fff}pre{background:#171a1f;color:#fff}</style><p id="good">읽을 수 있는 본문</p><p hidden>숨긴 글</p><pre id="code">코드</pre><button id="button">확인</button><input id="input" placeholder="검색"><svg><g class="node"><rect width="140" height="50" fill="#171a1f"/><text x="10" y="30">도형 위 글자</text></g></svg>`);
    assert.deepEqual((await page.evaluate(inspectDom,'default')).findings, []);
    await page.addStyleTag({content:'#good,#code{color:#171a1f}button{border-color:#171a1f}input::placeholder{color:#171a1f}svg text{fill:#171a1f}'});
    const bad = (await page.evaluate(inspectDom,'default')).findings;
    for (const kind of ['text','code','placeholder','border','svg']) assert.ok(bad.some(f=>f.kind===kind&&f.ratio===1),kind);
    await browser.close();
  } finally { await browser.close(); }
});
test('큰 글자의 3:1과 작은 글자의 4.5:1 기준을 분리한다', async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<style>body{background:#000;color:#777}#large{font-size:24px}#small{font-size:16px;color:#666}</style><p id="large">큰 제목</p><p id="small">작은 설명</p>');
    const r = await page.evaluate(inspectDom,'default');
    assert.ok(!r.findings.some(f=>f.selector==='#large'));
    assert.ok(r.findings.some(f=>f.selector==='#small'&&f.threshold===4.5));
  } finally { await browser.close(); }
});
test('채움·외부 배경으로 식별되는 버튼과 실제 opacity 저대비를 구분한다', async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<style>body{background:#1d2025;color:#b6beca}button{background:#005eff;color:#fff;border:1px solid #8591a2}#dim{opacity:.4}#modern{color:color(srgb .114 .125 .145)}</style><button>확인</button><button disabled style="color:#005eff">사용 불가</button><p id="dim">옅은 설명</p><p id="modern">현대 색상 문법</p>');
    const r = await page.evaluate(inspectDom,'default');
    assert.ok(!r.findings.some(f=>f.kind==='border'));
    assert.ok(!r.findings.some(f=>f.text==='사용 불가'));
    assert.ok(r.findings.some(f=>f.selector==='#dim'&&f.ratio<3));
    assert.ok(r.findings.some(f=>f.selector==='#modern'&&f.ratio<1.1));
  } finally { await browser.close(); }
});
