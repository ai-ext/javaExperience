// 과정 지도 동작 — 노드를 고르면 관계 보기(직접 연결·상하류 전체·영향 주는 쪽·영향 받는 쪽)에 맞는 노드만 밝히고,
// 넓은 화면에서는 레인 사이 연결선을 그린다. 스크립트가 없어도 아래 연결 흐름에 모든 연결이 있다.
(function () {
  'use strict';
  var root = document.querySelector('[data-course-map]');
  var dataNode = document.getElementById('course-map-data');
  if (!root || !dataNode) return;
  var graph;
  try { graph = JSON.parse(dataNode.textContent); } catch (e) { return; }
  var SVG = 'http://www.w3.org/2000/svg';
  var board = root.querySelector('[data-cm-board]');
  var svg = root.querySelector('[data-cm-lines]');
  var status = root.querySelector('[data-cm-status]');
  var detail = root.querySelector('[data-cm-detail]');
  var buttons = Array.prototype.slice.call(root.querySelectorAll('.cm-node[data-node]'));
  var nodeById = {};
  graph.nodes.forEach(function (n) { nodeById[n.id] = n; });
  var VIEW_LABEL = { direct: '직접 연결', both: '상·하류 전체', up: '영향 주는 쪽', down: '영향 받는 쪽' };
  var EDGE_LABEL = { practice: '같은 날 연결 실험 (J44·J45는 수행 중·사후)', ticket: '그날 다루는 티켓', area: '결함 영역' };
  var selected = root.dataset.currentDay || 'D01';
  var exploring = false;
  var explore = document.createElement('button');
  explore.type = 'button'; explore.className = 'cm-explore'; explore.dataset.cmExplore = '';
  explore.textContent = '전체 연결 탐색'; explore.setAttribute('aria-pressed', 'false');
  root.querySelector('[data-cm-current]').after(explore);
  var tools = document.createElement('details'); tools.className = 'cm-tools';
  var toolsTitle = document.createElement('summary'); toolsTitle.textContent = '관계 범례·보기 설정';
  tools.appendChild(toolsTitle);
  var legend = root.querySelector('.cm-legend'), toolbar = root.querySelector('.cm-toolbar');
  legend.before(tools); tools.append(legend, toolbar);
  tools.addEventListener('toggle', function () { draw(selected ? related(selected, view()).edges : null); });
  explore.addEventListener('click', function () { exploring = !exploring; explore.setAttribute('aria-pressed', String(exploring)); explore.textContent = exploring ? '현재 연결만 보기' : '전체 연결 탐색'; apply(); });

  // 긴 관계 목록은 분류별로 읽고, 스크립트가 없을 때는 원래 목록을 그대로 제공한다.
  var tables = document.querySelector('.cm-tables');
  if (tables) {
    var fold = document.createElement('div'); fold.className = 'cm-relations-fold'; fold.id = 'cm-table-all';
    var tabs = document.createElement('div'); tabs.className = 'cm-relation-tabs section-switcher'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', '연결 목록 분류');
    var headings = Array.prototype.slice.call(tables.querySelectorAll(':scope > h3'));
    var panels = [], tabButtons = [];
    function chooseTab(index, focus, save) {
      panels.forEach(function (panel, i) { panel.hidden = index !== 0 && i + 1 !== index; });
      tabButtons.forEach(function (tab, i) { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
      if (index === 0 && phaseFilter) { phaseFilter.value = ''; dayFilter.value = ''; filterRelations(); }
      if (focus) tabButtons[index].focus({ preventScroll: true });
      if (save) {
        var hash = '#' + (index === 0 ? fold.id : headings[index - 1].id);
        if (window.location.hash !== hash) {
          var previous = window.location.href;
          window.history.pushState(null, '', hash);
          window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL: previous, newURL: window.location.href }));
        }
      }
    }
    function createTab(id, label, index, controls) {
      var tab = document.createElement('button'); tab.type = 'button'; tab.id = id; tab.textContent = label; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', controls);
      tab.addEventListener('click', function () { chooseTab(index, false, true); });
      tab.addEventListener('keydown', function (event) {
        var count = tabButtons.length;
        var next = event.key === 'ArrowRight' ? (index + 1) % count : event.key === 'ArrowLeft' ? (index + count - 1) % count : event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : null;
        if (next === null) return; event.preventDefault(); chooseTab(next, true, true);
      });
      tabs.appendChild(tab); tabButtons.push(tab);
    }
    createTab('cm-table-all-tab', '전체', 0, headings.map(function (heading) { return heading.id + '-panel'; }).join(' '));
    headings.forEach(function (heading, i) {
      var list = heading.nextElementSibling;
      var panel = document.createElement('section'); panel.className = 'cm-relation-panel'; panel.id = heading.id + '-panel'; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', heading.id + '-tab');
      createTab(heading.id + '-tab', ['일자별', '티켓별', '결함 영역별'][i], i + 1, panel.id);
      panel.append(heading, list); fold.appendChild(panel); panels.push(panel);
    });
    tables.append(tabs, fold); if (panels.length) chooseTab(1, false);
    var phaseFilter, dayFilter;
    var relationRows = panels[0] ? Array.prototype.slice.call(panels[0].querySelectorAll(':scope > ol > li, :scope > ul > li')) : [];
    function dayPhase(id) { var day = Number(id.slice(1)); return day <= 10 ? 'build' : day <= 15 ? 'maintain' : 'extend'; }
    function filterRelations() {
      relationRows.forEach(function (row) {
        var id = row.querySelector('h4 b')?.textContent || '';
        row.hidden = Boolean((phaseFilter.value && dayPhase(id) !== phaseFilter.value) || (dayFilter.value && id !== dayFilter.value));
      });
    }
    if (relationRows.length) {
      var filters = document.createElement('div'); filters.className = 'cm-relation-filters';
      var phaseLabel = document.createElement('label'); phaseLabel.textContent = '단계 ';
      phaseFilter = document.createElement('select'); phaseFilter.setAttribute('aria-label', '일자 연결 목록 단계');
      [['', '모든 단계'], ['build', '1단계 · 만들기'], ['maintain', '2단계 · 유지보수'], ['extend', '3단계 · 확장']].forEach(function (entry) { var option = document.createElement('option'); option.value = entry[0]; option.textContent = entry[1]; phaseFilter.append(option); });
      var dayLabel = document.createElement('label'); dayLabel.textContent = '일자 ';
      dayFilter = document.createElement('select'); dayFilter.setAttribute('aria-label', '일자 연결 목록 일자');
      var allDays = document.createElement('option'); allDays.value = ''; allDays.textContent = '모든 일자'; dayFilter.append(allDays);
      graph.nodes.filter(function (node) { return node.kind === 'day'; }).forEach(function (node) { var option = document.createElement('option'); option.value = node.id; option.textContent = node.id + ' ' + node.title; dayFilter.append(option); });
      dayFilter.value = root.dataset.currentDay || 'D01';
      phaseLabel.append(phaseFilter); dayLabel.append(dayFilter); filters.append(phaseLabel, dayLabel);
      panels[0].querySelector('h3').after(filters);
      phaseFilter.addEventListener('change', function () { if (dayFilter.value && phaseFilter.value && dayPhase(dayFilter.value) !== phaseFilter.value) dayFilter.value = ''; filterRelations(); });
      dayFilter.addEventListener('change', function () { if (dayFilter.value) phaseFilter.value = dayPhase(dayFilter.value); filterRelations(); });
      filterRelations();
    }
    function revealAnchor() {
      var id; try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
      var target = document.getElementById(id); var index = panels.findIndex(function (panel) { return target && panel.contains(target); });
      if ((!id || id === tables.id || id === 'cm-table-title') && panels.length) chooseTab(1, false);
      else if (id === fold.id) chooseTab(0, false);
      else if (index !== -1) { if (index === 0 && phaseFilter) { phaseFilter.value = ''; dayFilter.value = ''; filterRelations(); } chooseTab(index + 1, false); }
    }
    window.addEventListener('hashchange', revealAnchor);
    window.addEventListener('popstate', revealAnchor);
    revealAnchor();
  }

  function name(id) { var n = nodeById[id]; return n.kind === 'area' ? n.title : n.id; }
  function walk(start, forward) {
    var seen = new Set(), queue = [start];
    while (queue.length) {
      var id = queue.shift();
      graph.edges.forEach(function (e) {
        var next = forward ? (e.from === id ? e.to : null) : (e.to === id ? e.from : null);
        if (next && !seen.has(next) && next !== start) { seen.add(next); queue.push(next); }
      });
    }
    return seen;
  }
  // 반환: 밝힐 노드 집합과 밝힐 연결선 집합
  function related(id, view) {
    var nodes = new Set();
    if (view === 'direct') {
      graph.edges.forEach(function (e) { if (e.from === id) nodes.add(e.to); if (e.to === id) nodes.add(e.from); });
    } else {
      if (view === 'up' || view === 'both') walk(id, false).forEach(function (n) { nodes.add(n); });
      if (view === 'down' || view === 'both') walk(id, true).forEach(function (n) { nodes.add(n); });
    }
    // 상류 집합 안의 연결, 하류 집합 안의 연결만 밝힌다(층이 J → D → 티켓 → 영역으로 한 방향이라 경로 밖 연결이 섞이지 않는다).
    function inside(set) { return function (e) { return set.has(e.from) && set.has(e.to); }; }
    var edges;
    if (view === 'direct') edges = graph.edges.filter(function (e) { return e.from === id || e.to === id; });
    else {
      var upAll = walk(id, false); upAll.add(id);
      var downAll = walk(id, true); downAll.add(id);
      edges = graph.edges.filter(function (e) {
        return ((view === 'up' || view === 'both') && inside(upAll)(e)) || ((view === 'down' || view === 'both') && inside(downAll)(e));
      });
    }
    return { nodes: nodes, edges: edges };
  }
  function view() { var checked = root.querySelector('input[name="cm-view"]:checked'); return checked ? checked.value : 'direct'; }

  function draw(highlight) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!window.matchMedia('(min-width: 900px)').matches) return;
    var box = board.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    var defs = document.createElementNS(SVG, 'defs');
    ['practice', 'ticket', 'area'].forEach(function (kind) {
      var marker = document.createElementNS(SVG, 'marker');
      marker.setAttribute('id', 'cm-arrow-' + kind);
      marker.setAttribute('viewBox', '0 0 8 8'); marker.setAttribute('refX', '7'); marker.setAttribute('refY', '4');
      marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '8'); marker.setAttribute('orient', 'auto');
      marker.setAttribute('markerUnits', 'userSpaceOnUse');
      var path = document.createElementNS(SVG, 'path');
      path.setAttribute('d', 'M0 0 L8 4 L0 8 Z'); path.setAttribute('class', 'cm-arrow edge-' + kind);
      marker.appendChild(path); defs.appendChild(marker);
    });
    svg.appendChild(defs);
    graph.edges.forEach(function (e) {
      var a = root.querySelector('.cm-node[data-node="' + e.from + '"]');
      var b = root.querySelector('.cm-node[data-node="' + e.to + '"]');
      if (!a || !b || a.hidden || b.hidden) return;
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      var x1 = ra.right - box.left, y1 = ra.top + ra.height / 2 - box.top;
      var x2 = rb.left - box.left - 2, y2 = rb.top + rb.height / 2 - box.top;
      var mid = (x1 + x2) / 2;
      var line = document.createElementNS(SVG, 'path');
      line.setAttribute('d', 'M' + x1 + ' ' + y1 + ' C' + mid + ' ' + y1 + ' ' + mid + ' ' + y2 + ' ' + x2 + ' ' + y2);
      var on = highlight ? highlight.some(function (h) { return h.from === e.from && h.to === e.to; }) : false;
      line.setAttribute('class', 'cm-edge edge-' + e.kind + (highlight ? (on ? ' is-on' : ' is-dim') : ''));
      line.setAttribute('marker-end', 'url(#cm-arrow-' + e.kind + ')');
      svg.appendChild(line);
    });
  }

  function link(id) {
    var n = nodeById[id];
    var text = name(id) + (n.kind === 'area' ? '' : ' ' + n.title);
    if (!n.href) { var span = document.createElement('span'); span.textContent = text; return span; }
    var a = document.createElement('a'); a.href = n.href; a.textContent = text; return a;
  }
  function relationList(title, edges, pick) {
    var wrap = document.createElement('div');
    var h = document.createElement('p'); h.className = 'cm-detail-label'; h.textContent = title; wrap.appendChild(h);
    if (!edges.length) { var none = document.createElement('p'); none.className = 'cm-none'; none.textContent = '없음'; wrap.appendChild(none); return wrap; }
    var ul = document.createElement('ul');
    edges.forEach(function (e) {
      var li = document.createElement('li');
      li.appendChild(link(pick(e)));
      var small = document.createElement('small'); small.textContent = ' · ' + EDGE_LABEL[e.kind]; li.appendChild(small);
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
    return wrap;
  }
  function renderDetail(id) {
    detail.replaceChildren();
    if (!id) { detail.hidden = true; return; }
    var n = nodeById[id];
    var head = document.createElement('p'); head.className = 'cm-detail-title';
    var strong = document.createElement('strong'); strong.textContent = name(id); head.appendChild(strong);
    head.append(' ' + (n.kind === 'area' ? '결함 영역' : n.title) + (n.note ? ' · ' + n.note : ''));
    detail.appendChild(head);
    if (n.href) { var open = document.createElement('a'); open.className = 'cm-detail-open'; open.href = n.href; open.textContent = name(id) + ' 페이지 열기 →'; detail.appendChild(open); }
    detail.appendChild(relationList('영향 주는 쪽 (들어오는 연결)', graph.edges.filter(function (e) { return e.to === id; }), function (e) { return e.from; }));
    detail.appendChild(relationList('영향 받는 쪽 (나가는 연결)', graph.edges.filter(function (e) { return e.from === id; }), function (e) { return e.to; }));
    detail.hidden = false;
  }

  function updateLanes() {
    root.classList.toggle('is-exploring', exploring);
    Array.prototype.forEach.call(board.querySelectorAll('.cm-lane'), function (lane) {
      lane.hidden = !exploring && !Array.prototype.some.call(lane.querySelectorAll('.cm-node'), function (button) { return !button.hidden; });
    });
  }
  function apply() {
    var v = view();
    if (!selected) {
      board.classList.remove('has-selection');
      buttons.forEach(function (b) { b.classList.remove('is-related', 'is-selected'); b.setAttribute('aria-pressed', 'false'); b.hidden = !exploring && b.dataset.node !== (root.dataset.currentDay || 'D01'); });
      status.textContent = '노드를 고르면 관계 보기에 맞는 노드만 밝힙니다. 아래 연결 흐름에 모든 연결이 글로 있습니다.';
      renderDetail(null);
      updateLanes();
      draw(null);
      return;
    }
    var rel = related(selected, v);
    board.classList.add('has-selection');
    buttons.forEach(function (b) {
      var id = b.dataset.node;
      b.hidden = !exploring && id !== selected && !rel.nodes.has(id);
      b.classList.toggle('is-selected', id === selected);
      b.classList.toggle('is-related', rel.nodes.has(id));
      b.setAttribute('aria-pressed', String(id === selected));
    });
    var names = []; rel.nodes.forEach(function (id) { names.push(name(id)); });
    status.textContent = name(selected) + ' · ' + VIEW_LABEL[v] + ': ' + (names.length ? names.length + '개 (' + names.join(', ') + ')' : '연결 없음') + (exploring ? ' · 전체 노드 탐색 중' : ' · 현재 연결만 표시');
    renderDetail(selected);
    updateLanes();
    draw(rel.edges);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      selected = selected === b.dataset.node ? null : b.dataset.node;
      apply();
      if (selected) {
        if (!window.matchMedia('(min-width: 1100px)').matches) detail.scrollIntoView({ behavior: 'instant', block: 'center' });
        var open = detail.querySelector('.cm-detail-open');
        if (open) open.focus({ preventScroll: true });
      }
    });
  });
  root.querySelectorAll('input[name="cm-view"]').forEach(function (input) { input.addEventListener('change', apply); });
  root.querySelector('[data-cm-clear]').addEventListener('click', function () { selected = null; apply(); });
  var pending = 0;
  window.addEventListener('resize', function () { cancelAnimationFrame(pending); pending = requestAnimationFrame(apply); });
  window.addEventListener('load', apply);
  function showCurrent() {
    selected = root.dataset.currentDay || selected;
    apply();
    var node = root.querySelector('.is-learning');
    var scroller = root.querySelector('.cm-board-scroll');
    if (node && scroller) scroller.scrollTop += node.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 70;
  }
  root.addEventListener('course-location', function() { if (!selected) showCurrent(); });
  root.querySelector('[data-cm-current]').addEventListener('click', showCurrent);
  if (root.dataset.currentDay) showCurrent();
  window.jxCourseMap = { related: related };
  apply();
})();
