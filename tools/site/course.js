// 과정 v2 화면 동작 — 일자 페이지의 순서 체크·프롬프트 복사·정답 지연 하이라이트, 홈의 "오늘 할 일"과 15일 진도.
// file://로 열어도 동작하도록 import 없는 일반 스크립트다. 저장소를 못 써도 화면은 그대로 읽힌다.
(function () {
  'use strict';
  var KEY = 'javaexperience.course.progress.v1';
  var STEP_ID = /^D\d{2}-\d+$/;

  function storage() { try { return window.localStorage; } catch (e) { return null; } }
  // 반환: { ok: 저장소 사용 가능 여부, done: Set(순서 id) }
  function readProgress(store) {
    if (!store) return { ok: false, done: new Set() };
    try {
      var raw = store.getItem(KEY);
      var value = raw ? JSON.parse(raw) : null;
      var done = new Set();
      if (value && value.version === 1 && value.steps && typeof value.steps === 'object') {
        Object.keys(value.steps).forEach(function (id) { if (STEP_ID.test(id) && value.steps[id] === true) done.add(id); });
      }
      return { ok: true, done: done };
    } catch (e) { return { ok: false, done: new Set() }; }
  }
  function writeProgress(store, done) {
    if (!store) return false;
    var steps = {};
    done.forEach(function (id) { steps[id] = true; });
    try { store.setItem(KEY, JSON.stringify({ version: 1, steps: steps })); return true; } catch (e) { return false; }
  }
  // 오늘 할 일: 체크가 있는 가장 늦은 날이 덜 끝났으면 그날, 다 끝났으면 다음 날. 체크가 없으면 첫날.
  // 마지막 날까지 끝냈는데 앞에 덜 끝낸 날이 있으면 그 첫 날로 돌아간다. 모든 순서를 끝냈을 때만 complete다.
  function nextDay(days, done) {
    var finished = function (day) { return day.steps.every(function (s) { return done.has(s.id); }); };
    var last = -1;
    days.forEach(function (day, index) { if (day.steps.some(function (s) { return done.has(s.id); })) last = index; });
    if (last < 0) return { day: days[0], mode: 'first' };
    var current = days[last];
    if (!finished(current)) return { day: current, mode: 'continue' };
    if (last + 1 < days.length) return { day: days[last + 1], mode: 'next' };
    for (var i = 0; i < days.length; i++) if (!finished(days[i])) return { day: days[i], mode: 'remaining' };
    return { day: current, mode: 'complete' };
  }
  // reason: '' = 저장됨, 'blocked' = 저장소를 아예 못 씀, 'unsaved' = 쓰기만 실패해 이 화면에만 남은 체크가 있음
  function storageNote(reason) {
    var text = reason === 'blocked' ? '지금 브라우저에서는 저장소를 쓸 수 없어 체크가 새로고침하면 사라집니다.'
      : reason === 'unsaved' ? '체크를 저장하지 못했습니다. 이 화면에는 남아 있지만 새로고침하거나 다른 탭에서 열면 사라집니다.' : '';
    document.querySelectorAll('[data-course-storage]').forEach(function (node) { node.textContent = text; });
  }

  // ------------------------------------------------------------ 일자 페이지
  function initDay(page) {
    var store = storage();
    var state = readProgress(store);
    // 쓰기에 실패한 체크가 있으면 true. 그동안은 저장값으로 화면을 덮지 않는다(덮으면 방금 한 체크가 사라진다).
    var unsaved = false;
    var inputs = Array.prototype.slice.call(page.querySelectorAll('input.step-check[data-step]'));
    var ids = [];
    inputs.forEach(function (input) { if (ids.indexOf(input.dataset.step) < 0) ids.push(input.dataset.step); });
    var counter = page.querySelector('[data-day-progress]');
    function paint() {
      inputs.forEach(function (input) { input.checked = state.done.has(input.dataset.step); });
      page.querySelectorAll('.day-chip[data-step], .day-step[data-step]').forEach(function (node) {
        node.classList.toggle('is-done', state.done.has(node.dataset.step));
      });
      var count = ids.filter(function (id) { return state.done.has(id); }).length;
      if (counter) counter.textContent = count + '/' + ids.length + ' 끝냄';
      storageNote(!state.ok ? 'blocked' : unsaved ? 'unsaved' : '');
    }
    // 저장값을 다시 읽는다(다른 탭의 체크 반영). 이 화면에 저장 못 한 체크가 있으면 읽지 않는다.
    function reload() {
      if (unsaved) return;
      var latest = readProgress(store);
      if (latest.ok) state = latest;
    }
    inputs.forEach(function (input) {
      input.addEventListener('change', function () {
        reload();
        if (input.checked) state.done.add(input.dataset.step); else state.done.delete(input.dataset.step);
        var saved = writeProgress(store, state.done);
        // 저장소 자체를 못 쓰는 경우(state.ok=false)와 쓰기만 실패한 경우를 나눈다. 둘 다 메모리의 체크는 지킨다.
        if (state.ok) unsaved = !saved;
        paint();
      });
    });
    window.addEventListener('pageshow', function () { reload(); paint(); });
    window.addEventListener('storage', function (e) { if (e.key !== null && e.key !== KEY) return; reload(); paint(); });
    paint();

    // 정답은 펼칠 때만 하이라이트한다. syntax-highlight.js가 새로 붙은 code 노드를 처리하도록 노드를 바꿔 끼운다.
    page.querySelectorAll('details.step-answer').forEach(function (details) {
      details.addEventListener('toggle', function () {
        if (!details.open) return;
        details.querySelectorAll('code[data-lazy-lang]').forEach(function (code) {
          var fresh = code.cloneNode(true);
          fresh.className = 'language-' + code.dataset.lazyLang;
          fresh.removeAttribute('data-lazy-lang');
          code.replaceWith(fresh);
        });
      });
    });
  }

  // ------------------------------------------------------------ 복사 버튼
  function initCopy() {
    document.querySelectorAll('button[data-copy-target]').forEach(function (button) {
      var status = button.parentNode.querySelector('.copy-status');
      button.addEventListener('click', function () {
        var target = document.getElementById(button.dataset.copyTarget);
        if (!target) return;
        var text = target.textContent;
        function done(ok) {
          if (status) status.textContent = ok ? '복사했어요. Codex 또는 Claude Code에 붙여 넣으세요.' : '자동 복사가 막혔어요. 선택된 프롬프트를 직접 복사하세요(⌘C / Ctrl+C).';
        }
        function fallback() {
          var ok = false;
          try {
            var range = document.createRange();
            range.selectNodeContents(target);
            var selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            ok = document.execCommand('copy');
          } catch (e) { ok = false; }
          done(ok);
        }
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
            return;
          }
        } catch (e) { /* 아래 대체 경로 */ }
        fallback();
      });
    });
  }

  // ------------------------------------------------------------ 홈
  function initHome(home) {
    var dataNode = document.getElementById('course-days-data');
    if (!dataNode) return;
    var all;
    try { all = JSON.parse(dataNode.textContent); } catch (e) { return; }
    var days = all.filter(function (d) { return d.steps.length > 0; });
    var store = storage();
    var $ = function (selector) { return home.querySelector(selector); };
    var NUMS = '①②③④⑤⑥⑦⑧⑨⑩';
    function render() {
      var state = readProgress(store);
      var pick = nextDay(days, state.done);
      var day = pick.day;
      var tags = { first: '오늘 할 일 · 처음 시작', continue: '오늘 할 일 · 이어서', next: '오늘 할 일 · 다음 날', remaining: '오늘 할 일 · 남은 순서가 있는 날', complete: '15일 과정 · 모두 체크함' };
      $('[data-today-tag]').textContent = tags[pick.mode];
      $('[data-today-id]').textContent = day.id;
      $('[data-today-title]').textContent = day.title;
      var doneHere = day.steps.filter(function (s) { return state.done.has(s.id); }).length;
      $('[data-today-meta]').textContent = day.phaseLabel + ' · 순서 ' + day.steps.length + '개' + (doneHere ? ' 중 ' + doneHere + '개 끝냄' : '') + ' · 오늘의 Java ' + day.java;
      var list = $('[data-today-steps]');
      list.replaceChildren.apply(list, day.steps.map(function (s, i) {
        var li = document.createElement('li');
        if (state.done.has(s.id)) li.className = 'is-done';
        var no = document.createElement('span');
        no.setAttribute('aria-hidden', 'true');
        no.textContent = NUMS[i] || String(i + 1);
        li.append(no, ' ' + s.title + (state.done.has(s.id) ? ' (끝냄)' : ''));
        return li;
      }));
      var open = $('[data-today-open]');
      open.href = day.href;
      open.firstChild.textContent = day.id + ' 열기 ';
      var java = $('[data-today-java]');
      if (day.javaHref) { java.href = day.javaHref; java.textContent = '오늘의 Java ' + day.java + ' →'; java.hidden = false; } else java.hidden = true;
      $('[data-today-note]').hidden = pick.mode !== 'first';
      var total = 0, checked = 0;
      days.forEach(function (d) {
        var n = d.steps.filter(function (s) { return state.done.has(s.id); }).length;
        total += d.steps.length; checked += n;
        var cell = home.querySelector('.ch-day[data-day="' + d.id + '"]');
        if (!cell) return;
        cell.classList.toggle('is-today', d.id === day.id);
        cell.classList.toggle('is-done', n === d.steps.length);
        var count = cell.querySelector('[data-day-count]');
        if (count) count.textContent = n + '/' + d.steps.length;
        var bar = cell.querySelector('.ch-bar i');
        if (bar) bar.style.width = Math.round((n / d.steps.length) * 100) + '%';
      });
      $('[data-progress-summary]').textContent = '체크한 순서 ' + checked + '/' + total;
      storageNote(state.ok ? '' : 'blocked');
    }
    window.addEventListener('pageshow', render);
    // 다른 탭(일자 페이지)에서 체크하면 열린 홈의 오늘 할 일·진도도 다시 그린다. 홈은 저장값을 쓰지 않으므로 덮을 변경이 없다.
    window.addEventListener('storage', function (e) { if (e.key === null || e.key === KEY) render(); });
    render();
  }

  window.jxCourseProgress = { KEY: KEY, readProgress: readProgress, writeProgress: writeProgress, nextDay: nextDay };
  function start() {
    var page = document.querySelector('[data-day-page]');
    if (page) initDay(page);
    var home = document.querySelector('[data-course-home]');
    if (home) initHome(home);
    initCopy();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
