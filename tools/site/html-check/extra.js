// check.js 가 보지 않는 사이트 전용 검사. run-site.sh 가 check.js 다음에 붙여 실행한다.

// 가로 넘침: 문서가 화면보다 넓거나(가로 스크롤), html·body 의 overflow-x hidden/clip 때문에 스크롤 없이 화면 밖으로 잘린 요소.
// 이 사이트는 html{overflow-x:hidden} body{overflow-x:clip} 이라 scrollWidth 만 보면 넘침이 0 으로 보인다.
// 표·코드처럼 자체 가로 스크롤 상자 안의 요소는 제외한다. 화면 오른쪽 밖으로 나간 가장 안쪽 요소를 돌려준다.
function __hscroll() {
  const over = document.scrollingElement.scrollWidth - innerWidth;
  const where = el => { const p = []; for (let e = el, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) p.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : "")); return p.join(">"); };
  const boxed = el => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const ox = getComputedStyle(e).overflowX; if (ox !== "visible") return true; } return false; };
  const outside = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > innerWidth + 1; };
  const out = [...document.body.querySelectorAll("*")].filter(e => outside(e) && !boxed(e) && getComputedStyle(e).position !== "fixed" && ![...e.children].some(outside));
  if (over <= 0 && !out.length) return null;
  return { over, n: out.length, where: out.slice(0, 3).map(e => `${where(e)} (right ${Math.round(e.getBoundingClientRect().right)})`).join(" | ") };
}

// 흐름 재생(course-flow.js) 조작부: 이전·다음·재생·일시정지·속도가 동작하고, 멈춘 상태에서도 단계 글이 다 보이는지.
// 끝나면 1단계·1× 로 되돌린다. 문제가 없으면 'ok'.
async function __flowCheck() {
  const r = document.querySelector("section.flow[data-flow]");
  if (!r) return "ok(흐름 없음)";
  const q = s => r.querySelector(s), bad = [], wait = ms => new Promise(res => setTimeout(res, ms));
  const player = q("[data-flow-player]");
  if (!player || player.hidden) return "조작부가 숨어 있음";
  // 기본 단계가 접힌 준비 자료 안에 있으면 실제 단계 링크로 연다.
  const owner = r.closest('[data-day-panel]');
  if (owner) document.querySelector('[data-panel-link][href="#' + owner.id + '"]')?.click();
  for (let parent = r.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true;
  await wait(50);
  const cnt = () => q("[data-flow-count]").textContent.trim();
  const flat = s => s.replace(/\s+/g, " ").trim();
  const prev = q("[data-flow-prev]"), next = q("[data-flow-next]"), play = q("[data-flow-play]");
  while (!prev.disabled) prev.click();
  const steps = [...r.querySelectorAll(".flow-steps > .flow-step")].filter(li => !li.closest("details:not([open])"));
  const n = Number(cnt().split("/")[1]);
  if (n !== steps.length) bad.push(`단계 수 ${n} ≠ 목록 ${steps.length}`);
  if (cnt() !== `1 / ${n}`) bad.push("처음 " + cnt());
  next.click(); if (cnt() !== `2 / ${n}`) bad.push("다음 후 " + cnt());
  prev.click(); if (cnt() !== `1 / ${n}`) bad.push("이전 후 " + cnt());
  const sp2 = q('[data-flow-speed="2"]');
  sp2.click(); if (sp2.getAttribute("aria-pressed") !== "true") bad.push("2× 눌림 표시 없음");
  play.click(); if (play.getAttribute("aria-pressed") !== "true") bad.push("재생 눌림 표시 없음");
  await wait(1500);
  if (cnt() === `1 / ${n}`) bad.push("2× 재생 1.5초 뒤에도 1단계");
  play.click(); const at = cnt();
  if (play.getAttribute("aria-pressed") !== "false") bad.push("일시정지 안 됨");
  await wait(1500);
  if (cnt() !== at) bad.push(`일시정지 뒤에도 진행 ${at}→${cnt()}`);
  // 전체 모드의 원문 목록 또는 원문에서 만든 표에서 모든 단계의 글을 확인한다.
  const allMode = q('[data-flow-mode="all"]'), stepMode = q('button[data-flow-mode="step"]');
  if (allMode) allMode.click();
  const compact = q('[data-flow-overview] table');
  steps.forEach((li, i) => {
    const text = flat(li.textContent);
    if (!text) { bad.push(`단계${i + 1} 글 없음`); return; }
    const row = compact && [...compact.querySelectorAll('tbody tr')].find(row => flat(row.textContent).includes(flat(li.querySelector('.flow-step-title')?.textContent || text)));
    const shown = row || li, cs = getComputedStyle(shown), rc = shown.getBoundingClientRect();
    if (cs.visibility === "hidden" || +cs.opacity < 0.5 || !rc.height) bad.push(`단계${i + 1} 전체 모드에서 안 보임`);
  });
  if (stepMode) stepMode.click();
  const cur = r.querySelector(".flow-step.is-current"), now = flat(q("[data-flow-now]").textContent);
  if (!cur || !now.includes(flat(cur.textContent).slice(0, 20))) bad.push("지금 단계 칸 ≠ 목록의 현재 항목");
  q('[data-flow-speed="1"]').click();
  while (!prev.disabled) prev.click();
  return bad.length ? bad.join("; ") : "ok";
}

// 화면 낭독기 전용 글(1px 로 잘라 둔 .sr-only 류)은 보이는 글이 아니다. check.js 가 이를 잘림·반복으로 세지 않도록 검사 전에 뺀다.
function __hideSrOnly() {
  let n = 0;
  document.querySelectorAll("body *").forEach(e => { const cs = getComputedStyle(e), r = e.getBoundingClientRect();
    if (r.width <= 1 && r.height <= 1 && e.textContent.trim() && (cs.clip.startsWith("rect(0") || cs.clipPath.startsWith("inset(50%") || cs.position === "absolute" && cs.overflow === "hidden")) { e.style.display = "none"; n++; } });
  return n;
}
