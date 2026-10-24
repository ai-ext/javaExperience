// 색상 의사 상태 규칙마다 실제로 표시되는 대표 요소를 고른다.
export function interactionTargets() {
  const out = [], seen = new Set();
  function walk(rules) {
    for (const rule of rules) {
      if (rule.conditionText && rule.constructor.name === 'CSSMediaRule' && !matchMedia(rule.conditionText).matches) continue;
      if (rule.cssRules) walk(rule.cssRules);
      if (!rule.selectorText || !/color|background|fill|stroke|outline|border|opacity/.test(rule.style.cssText)) continue;
      for (const type of ['hover', 'focus']) {
        if (!rule.selectorText.includes(`:${type}`)) continue;
        for (const selector of rule.selectorText.split(/,(?![^()]*\))/)) {
          let elements;
          try { elements = document.querySelectorAll(selector.replace(/:hover|:focus-visible|:focus(?!-)/g, '')); } catch { continue; }
          for (const e of elements) {
            if (!e.getClientRects().length || e.closest('[hidden]')) continue;
            const key = `${type}|${selector}|${e.tagName}|${e.className}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const id = out.length;
            e.setAttribute('data-contrast-interaction', `${e.getAttribute('data-contrast-interaction') || ''} ${id}`.trim());
            out.push({ id, type, selector });
            break;
          }
        }
      }
    }
  }
  for (const sheet of document.styleSheets) { try { walk(sheet.cssRules); } catch {} }
  return out;
}
