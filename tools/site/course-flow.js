// 흐름 재생 — 일자 페이지 [오늘 흐름]·티켓 페이지 [장애 흐름]의 이전·다음·재생·일시정지·속도.
// 단계 내용은 모두 HTML 목록에 이미 있다. 이 스크립트는 지금 단계를 고르고 지도·목록에 표시만 한다(스크립트가 없어도 목록은 다 읽힌다).
// 티켓의 원인 단계는 접기(details.flow-cause)가 열려 있을 때만 재생 순서에 넣는다. 다른 곳에 원인 내용을 복사해 두지 않는다.
// file://로 열어도 동작하도록 import 없는 일반 스크립트다.
(function () {
  'use strict';
  var BASE_MS = 2600;

  function reducedMotion() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  function setup(root) {
    var player = root.querySelector('[data-flow-player]');
    if (!player) return;
    var nodes = Array.prototype.slice.call(root.querySelectorAll('.flow-node'));
    var now = root.querySelector('[data-flow-now]');
    var count = root.querySelector('[data-flow-count]');
    var prevBtn = root.querySelector('[data-flow-prev]');
    var nextBtn = root.querySelector('[data-flow-next]');
    var playBtn = root.querySelector('[data-flow-play]');
    var speedBtns = Array.prototype.slice.call(root.querySelectorAll('[data-flow-speed]'));
    var causes = Array.prototype.slice.call(root.querySelectorAll('details.flow-cause'));
    var speed = 1;
    var timer = null;
    var index = 0;
    var steps = [];

    // 재생 순서: data-order 순. 닫힌 접기 안의 단계는 뺀다.
    function collect() {
      var all = Array.prototype.slice.call(root.querySelectorAll('.flow-steps > .flow-step'));
      steps = all.filter(function (li) {
        var fold = li.closest('details');
        return !fold || !root.contains(fold) || fold.open;
      }).sort(function (a, b) { return Number(a.dataset.order) - Number(b.dataset.order); });
    }
    function nodeIndex(id) {
      for (var i = 0; i < nodes.length; i++) if (nodes[i].dataset.node === id) return i;
      return -1;
    }

    function render() {
      var li = steps[index];
      var prev = steps[index - 1];
      var at = nodeIndex(li.dataset.node);
      var from = prev ? nodeIndex(prev.dataset.node) : -1;
      var lo = from < 0 ? at : Math.min(at, from);
      var hi = from < 0 ? at : Math.max(at, from);
      nodes.forEach(function (n, i) {
        n.classList.toggle('is-current', i === at);
        n.classList.toggle('is-from', i === from && from !== at);
        // 연결선은 각 노드의 ::before(앞 노드에서 오는 선)다. lo+1..hi 노드의 선이 지나온 길이다.
        n.classList.toggle('is-path', i > lo && i <= hi);
      });
      root.querySelectorAll('.flow-step.is-current').forEach(function (el) { el.classList.remove('is-current'); el.removeAttribute('aria-current'); });
      li.classList.add('is-current');
      li.setAttribute('aria-current', 'step');
      // 지금 단계: 목록의 그 항목을 그대로 옮겨 보여 준다(id만 지운다). 원인 단계는 접기가 열렸을 때만 steps에 들어온다.
      var copy = li.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.remove('is-current');
      copy.removeAttribute('aria-current');
      now.innerHTML = '';
      // 낭독용 위치(화면에는 조작부의 숫자가 보인다)
      var where = document.createElement('span');
      where.className = 'flow-sr';
      where.textContent = (index + 1) + ' / ' + steps.length + ' 단계. ';
      now.appendChild(where);
      while (copy.firstChild) now.appendChild(copy.firstChild);
      now.classList.toggle('is-cause', li.classList.contains('is-cause'));
      count.textContent = (index + 1) + ' / ' + steps.length;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === steps.length - 1;
    }

    function stop() {
      if (timer) { clearTimeout(timer); timer = null; }
      playBtn.setAttribute('aria-pressed', 'false');
      playBtn.textContent = index === steps.length - 1 ? '↺ 처음부터' : '▶ 재생';
    }
    function schedule() {
      timer = setTimeout(function () {
        if (index >= steps.length - 1) { stop(); return; }
        index += 1;
        render();
        if (index >= steps.length - 1) stop(); else schedule();
      }, BASE_MS / speed);
    }
    function play() {
      if (index >= steps.length - 1) { index = 0; render(); }
      playBtn.setAttribute('aria-pressed', 'true');
      playBtn.textContent = '❚❚ 일시정지';
      schedule();
    }
    function go(to) {
      stop();
      index = Math.max(0, Math.min(steps.length - 1, to));
      render();
      playBtn.textContent = index === steps.length - 1 ? '↺ 처음부터' : '▶ 재생';
    }

    prevBtn.addEventListener('click', function () { go(index - 1); });
    nextBtn.addEventListener('click', function () { go(index + 1); });
    playBtn.addEventListener('click', function () { if (timer) stop(); else play(); });
    speedBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        speed = Number(btn.dataset.flowSpeed) || 1;
        speedBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        if (timer) { clearTimeout(timer); schedule(); }
      });
    });
    // 키보드: 이 영역 안에 초점이 있을 때만. 접기 요약(summary)·링크 위에서는 기본 동작을 지킨다.
    root.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      var to = null;
      if (e.key === 'ArrowLeft') to = index - 1;
      else if (e.key === 'ArrowRight') to = index + 1;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = steps.length - 1;
      if (to === null) return;
      e.preventDefault();
      go(to);
    });
    // 원인 쪽 노드 이름: 접기가 열려 있을 때만 접기 안 원인 단계의 위치 이름을 지도에 보여 준다(다른 곳에 따로 싣지 않는다).
    var masked = nodes.filter(function (n) { return n.classList.contains('is-masked'); }).map(function (n) {
      var b = n.querySelector('.flow-node-text b');
      var small = n.querySelector('.flow-node-text small');
      return { node: n, b: b, small: small, label: b.textContent, sub: small ? small.textContent : '' };
    });
    function revealNodes() {
      var open = causes.some(function (d) { return d.open; });
      masked.forEach(function (m) {
        var source = open ? root.querySelector('details.flow-cause[open] .flow-step[data-node="' + m.node.dataset.node + '"] .flow-step-node') : null;
        m.node.classList.toggle('is-revealed', Boolean(source));
        m.b.textContent = source ? source.textContent : m.label;
        if (m.small) m.small.textContent = source ? '원인 단계' : m.sub;
      });
    }
    // 원인 접기를 열고 닫으면 재생 순서가 바뀐다. 지금 단계가 숨으면 가장 가까운 앞 단계로 옮긴다.
    causes.forEach(function (d) {
      d.addEventListener('toggle', function () {
        revealNodes();
        var current = steps[index];
        collect();
        var keep = steps.indexOf(current);
        if (keep < 0) {
          var order = Number(current.dataset.order);
          keep = 0;
          steps.forEach(function (li, i) { if (Number(li.dataset.order) <= order) keep = i; });
        }
        index = keep;
        render();
        if (timer) { clearTimeout(timer); schedule(); }
      });
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && timer) stop(); });

    var implementationFold = root.closest('details.implementation-flow');
    if (implementationFold) implementationFold.addEventListener('toggle', function () {
      if (!implementationFold.open) stop();
    });
    collect();
    if (!steps.length) return;
    if (reducedMotion()) root.classList.add('is-reduced-motion');
    root.setAttribute('data-flow-ready', '');
    player.hidden = false;
    render();
    stop();
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('section.flow[data-flow]'), setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
