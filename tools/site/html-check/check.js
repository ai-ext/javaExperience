// 출처: ~/reference/tools/html-check/check.js 를 그대로 들여왔다(이 줄만 추가). 고칠 때는 원본과 함께 고친다.
// 화면 검사: 브라우저 안에서 그려진 요소를 재서 문제를 JSON으로 돌려준다 (스크린샷 대신).
// 사용: gstack browse 의 js 로 이 파일 내용 + `__htmlCheck(root?)` 를 실행한다. root 를 안 주면 보이는 화면 전체.
// 판정 기준은 아래 LIMIT 에서 바꾼다.
function __htmlCheck(rootSel) {
  const LIMIT = { minFontPx: 9, shrink: 0.7, overlapRatio: 0.25, perType: (window.__CHECK_PER_TYPE || 6) };
  const root = rootSel ? document.querySelector(rootSel) : document.body;
  const vis = el => { const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false; if (e.tagName === "DETAILS" && !e.open && e !== el && !el.closest("summary")) return false; } return true; };
  const where = el => { const parts = []; for (let e = el, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) parts.unshift(e.tagName.toLowerCase() + (e.id ? "#" + e.id : e.classList.length ? "." + [...e.classList].slice(0, 2).join(".") : "")); return parts.join(">"); };
  const txt = el => (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const items = [], add = (type, el, detail) => items.push({ type, where: where(el), text: txt(el), detail });
  const svgs = [...root.querySelectorAll("svg")].filter(vis);
  // 1) 그림 축소: viewBox 폭 대비 실제 그려진 폭
  svgs.forEach(s => { const vb = s.viewBox && s.viewBox.baseVal; if (!vb || vb.width < 300) return; const k = s.getBoundingClientRect().width / vb.width; if (k < LIMIT.shrink) add("shrink", s, `${Math.round(k * 100)}% 로 축소 (viewBox ${vb.width} → ${Math.round(s.getBoundingClientRect().width)}px)`); });
  // 2) 너무 작은 글자: SVG text 는 화면 배율까지 곱한 실제 크기
  const texts = svgs.flatMap(s => [...s.querySelectorAll("text")]).filter(t => vis(t) && t.textContent.trim());
  texts.forEach(t => { const m = t.getScreenCTM(); const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.a, m.b) : 1); if (px < LIMIT.minFontPx) add("minFont", t, `${px.toFixed(1)}px`); });
  [...root.querySelectorAll("p,span,small,b,i,em,li,code,button,a,h3,h4,div")].filter(e => e.childElementCount === 0 && e.textContent.trim() && vis(e)).forEach(e => { const fo = e.closest("foreignObject"), m = fo && fo.getScreenCTM && fo.parentNode.getScreenCTM(); const px = parseFloat(getComputedStyle(e).fontSize) * (m ? Math.hypot(m.a, m.b) : 1); if (px < LIMIT.minFontPx) add("minFont", e, `${px.toFixed(1)}px`); });
  // 3) 글자 겹침: 같은 SVG 안 text 끼리
  svgs.forEach(s => { const ts = [...s.querySelectorAll("text")].filter(t => vis(t) && t.textContent.trim()).map(t => [t, t.getBoundingClientRect()]);
    for (let i = 0; i < ts.length; i++) for (let j = i + 1; j < ts.length; j++) { const [a, ra] = ts[i], [b, rb] = ts[j]; const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w > 0 && h > 0 && w * h > LIMIT.overlapRatio * Math.min(ra.width * ra.height, rb.width * rb.height)) add("overlap", a, `"${txt(a)}" ↔ "${txt(b)}"`); } });
  // 4) 넘침: foreignObject 안 내용이 칸보다 큼, 같은 g 안 rect 밖으로 나간 text
  [...root.querySelectorAll("foreignObject")].filter(vis).forEach(fo => { const d = fo.firstElementChild; if (!d) return; const r = fo.getBoundingClientRect(), k = r.height / (fo.height.baseVal.value || 1);
    if (d.scrollHeight * k > r.height + 2 || d.scrollWidth * k > r.width + 2) add("overflow", fo, `내용 ${Math.round(d.scrollWidth)}×${Math.round(d.scrollHeight)} > 칸 ${Math.round(fo.width.baseVal.value)}×${Math.round(fo.height.baseVal.value)}`); });
  // 같은 g 안의 상자 모양(rect · 닫힌 path · polygon) 중 가장 큰 것을 그 글자의 상자로 본다
  texts.forEach(t => { const g = t.parentNode; if (!g || g.tagName !== "g") return; const rc = [...g.children].filter(x => x !== t && (x.tagName === "rect" || x.tagName === "polygon" || (x.tagName === "path" && /z\s*$/i.test(x.getAttribute("d") || "")))).sort((x, y) => { const a2 = x.getBoundingClientRect(), b2 = y.getBoundingClientRect(); return b2.width * b2.height - a2.width * a2.height; })[0]; if (!rc) return; const a = t.getBoundingClientRect(), b = rc.getBoundingClientRect(); if (b.width < 20) return;
    // 글자 중심이 상자 안에 있을 때만 그 상자의 글자로 본다 (상자 밖에 일부러 둔 머리표는 제외)
    const cx = (a.left + a.right) / 2, cy = (a.top + a.bottom) / 2; if (cx < b.left || cx > b.right || cy < b.top || cy > b.bottom) return;
    if (a.left < b.left - 2 || a.right > b.right + 2) add("overflow", t, `글자 ${Math.round(a.width)}px 가 상자 ${Math.round(b.width)}px 밖으로`); });
  [...root.querySelectorAll("*")].filter(e => { const cs = getComputedStyle(e); return (cs.overflow === "hidden" || cs.textOverflow === "ellipsis") && e.childElementCount === 0 && e.textContent.trim(); }).filter(vis).forEach(e => { if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).textOverflow !== "ellipsis") add("overflow", e, `잘림 ${e.scrollWidth}>${e.clientWidth}`); });
  // 5) 안 그려진 것: 이미지 로드 실패, 상자 기준 그러데이션을 쓴 납작한 선(높이나 폭 0이면 안 그려진다)
  [...root.querySelectorAll("img")].filter(vis).forEach(im => { if (im.complete && !im.naturalWidth) add("broken", im, "이미지 로드 실패 " + im.getAttribute("src")); });
  svgs.forEach(s => [...s.querySelectorAll("path,line,polyline")].forEach(p => { const st = p.getAttribute("stroke") || ""; const m = st.match(/url\(#([^)]+)\)/); if (!m) return; const gr = s.ownerDocument.getElementById(m[1]); if (!gr || gr.getAttribute("gradientUnits") === "userSpaceOnUse") return; let bb; try { bb = p.getBBox(); } catch (e) { return; } if (bb.width < .5 || bb.height < .5) add("broken", p, `그러데이션 선이 납작함(${bb.width.toFixed(0)}×${bb.height.toFixed(0)}) — gradientUnits=userSpaceOnUse 필요`); }));
  // 6) 같은 문구 반복: 4자 이상이 바로 이어 반복 ("AI가 한다 · AI가 한다"). CSS ::before 로 붙은 글자도 합쳐 본다. 가장 안쪽 요소만 보고
  const pse = (e, w) => { const c = getComputedStyle(e, w).content; return c && c !== "none" && c !== "normal" ? c.replace(/^"|"$/g, "") : ""; };
  const deep = e => pse(e, "::before") + " " + [...e.childNodes].map(n => n.nodeType === 3 ? n.textContent : n.nodeType === 1 && vis(n) ? deep(n) : "").join(" ") + " " + pse(e, "::after");
  const full = e => deep(e).replace(/\s+/g, " ").trim();
  const rep = t => { if (t.length < 8 || t.length > 160) return null; const m = t.match(/(\S[^·:|]{3,}?)\s*[·:|]?\s*\1(?=\s|$|[·:|])/); return m && !/^(.)\1+$/.test(m[1]) ? m[1] : null; };
  [...root.querySelectorAll("*")].filter(e => e.children.length <= 4 && vis(e)).forEach(e => { const r = rep(full(e)); if (r && ![...e.children].some(c => rep(full(c)) === r)) add("dup", e, `"${r}" 반복`); });
  const counts = {}; items.forEach(x => { counts[x.type] = (counts[x.type] || 0) + 1; });
  const seen = new Set(), uniq = items.filter(x => { const k = x.type + x.where + x.text; if (seen.has(k)) return false; seen.add(k); return true; });
  // 유형마다 앞에서 몇 개만 (한 유형이 목록을 다 채워 다른 유형이 안 보이는 것을 막는다)
  const per = {}, kept = uniq.filter(x => (per[x.type] = (per[x.type] || 0) + 1) <= LIMIT.perType);
  return JSON.stringify({ ok: !items.length, counts, items: kept });
}
