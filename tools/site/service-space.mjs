// CSS 패널의 면적을 기준으로 재현 가능한 배치 밀도를 측정한다. 픽셀/문자 밀도 검사는 아니다.
export function measureServiceSpace() {
  const root = document.querySelector('[data-sf-catalog], [data-sf-feature]');
  if (!root) return null;
  const bounds = root.getBoundingClientRect();
  const candidates = root.querySelectorAll('.sf-view-tabs,.sf-catalog-header,.sf-section-heading,.sf-filters,.sf-feature-group>h3,.sf-feature-card,.sf-api-explorer,.sf-catalog-original,.sf-feature-head,.sf-stage-nav button,.sf-stage-nav h3,.sf-progress,.sf-stage-title,.sf-stage-completion,.sf-purpose,.sf-brief-section,.sf-aside-stage,.sf-choices,.sf-api-contract,.sf-stage-api,.sf-execution,.sf-references,.sf-manual-progress');
  const rects = [...candidates].filter(e => e.checkVisibility() && !e.closest('[hidden]')).map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
  const scan = (bottom) => {
    let empty = 0, total = 0, run = 0, maximum = 0;
    for (let y = bounds.top + 4; y < bottom; y += 8) {
      let occupied = 0;
      for (let x = bounds.left + 4; x < bounds.right; x += 8) {
        const hit = rects.some(r => x >= r.left && x < r.right && y >= r.top && y < r.bottom);
        total++; if (!hit) empty++; else occupied++;
      }
      run = occupied ? 0 : run + 8; maximum = Math.max(maximum, run);
    }
    return {blankRatio: total ? +(empty / total).toFixed(4) : 1, maxBlankHeight: maximum};
  };
  const stage = document.querySelector('[data-sf-stage-panel]:not([hidden])');
  return {firstViewport: scan(Math.min(bounds.bottom, 900)), fullContent: scan(bounds.bottom),
    contentWidth: bounds.width, stageWidthRatio: stage ? +(stage.getBoundingClientRect().width / bounds.width).toFixed(4) : null};
}
