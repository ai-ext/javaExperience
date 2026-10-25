// 과정 v2 화면 동작 — 일자 페이지의 순서 체크·프롬프트 복사·정답 지연 하이라이트, 홈의 "오늘 할 일"과 일자 진도.
// file://로 열어도 동작하도록 import 없는 일반 스크립트다. 저장소를 못 써도 화면은 그대로 읽힌다.
(function () {
  'use strict';
  var KEY = 'javaexperience.course.progress.v1';
  var STEP_ID = /^D\d{2}-\d+$/;
  var CHOICE = /^B(?:12|13|14|15|16)$/;
  var PREP_ID = /^D11-[1-6]$/;

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
      var preparation = {};
      if (value && value.version === 1) Object.keys(value.preparation || {}).forEach(function(id) { if (PREP_ID.test(id) && value.preparation[id] === true) preparation[id] = true; });
      return { ok: true, done: done, selectedTicket: value && value.version === 1 && CHOICE.test(value.selectedTicket) ? value.selectedTicket : '', preparation: preparation };
    } catch (e) { return { ok: false, done: new Set() }; }
  }
  function writeProgress(store, done, records) {
    if (!store) return false;
    var steps = {};
    done.forEach(function (id) { steps[id] = true; });
    var latest = readProgress(store);
    var value = { version: 1, steps: steps };
    var selected = records && 'selectedTicket' in records ? records.selectedTicket : latest.selectedTicket;
    var preparation = records && records.preparation ? records.preparation : latest.preparation;
    if (CHOICE.test(selected)) value.selectedTicket = selected;
    if (preparation && Object.keys(preparation).length) value.preparation = preparation;
    try { store.setItem(KEY, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  // 공통 구현 순서: 선택·연습 티켓만 다루는 추가 순서(extra)를 뺀 나머지. 그날 순서가 모두 추가면 전부 센다.
  function coreSteps(day) {
    var core = day.steps.filter(function (s) { return !s.extra; });
    return core.length ? core : day.steps;
  }
  function selectedSteps(day, selectedTicket) {
    return day.steps.filter(function (s) { return s.extra && selectedTicket && (s.choiceTickets || []).indexOf(selectedTicket) >= 0; });
  }
  // 공통 구현에 실제로 선택한 후보의 순서만 더한다.
  function progressSteps(day, selectedTicket) {
    var selected = selectedSteps(day, selectedTicket), core = coreSteps(day);
    return day.steps.filter(function (s) { return core.indexOf(s) >= 0 || selected.indexOf(s) >= 0; });
  }
  // 오늘 할 일: 체크가 있는 가장 늦은 날이 덜 끝났으면 그날, 다 끝났으면 다음 날. 체크가 없으면 첫날.
  // 이미 지난 날에 선택한 티켓이 남아 있으면 그날로 복귀한다.
  // 마지막 날까지 끝냈는데 앞에 덜 끝낸 날이 있으면 그 첫 날로 돌아간다. 진도로 세는 순서를 모두 끝냈을 때만 complete다.
  function nextDay(days, done, selectedTicket) {
    var finished = function (day) { return progressSteps(day, selectedTicket).every(function (s) { return done.has(s.id); }); };
    var last = -1;
    days.forEach(function (day, index) { if (day.steps.some(function (s) { return done.has(s.id); })) last = index; });
    if (last < 0) return { day: days[0], mode: 'first' };
    var pendingChoice = days.slice(0, last + 1).find(function (day) {
      return selectedSteps(day, selectedTicket).some(function (s) { return !done.has(s.id); });
    });
    if (pendingChoice) return { day: pendingChoice, mode: 'continue' };
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
    // 쓰기에 실패해 저장값에 아직 없는 이 화면의 체크·해제(id → true/false). 저장에 성공하면 비운다.
    // 저장값을 다시 읽을 때 이 키만 덮고 나머지 키(다른 탭이 저장한 진도)는 그대로 둔다.
    var pending = {};
    var inputs = Array.prototype.slice.call(page.querySelectorAll('input.step-check[data-step]'));
    var ids = [];
    inputs.forEach(function (input) { if (ids.indexOf(input.dataset.step) < 0) ids.push(input.dataset.step); });
    // 홈 진도와 같은 기준: 선택·연습 티켓 순서(data-extra)는 따로 센다. 그날 순서가 모두 추가면 전부 센다.
    var extraIds = [];
    inputs.forEach(function (input) { if (input.hasAttribute('data-extra') && extraIds.indexOf(input.dataset.step) < 0) extraIds.push(input.dataset.step); });
    if (extraIds.length === ids.length) extraIds = [];
    var coreIds = ids.filter(function (id) { return extraIds.indexOf(id) < 0; });
    var day = { steps: ids.map(function (id) {
      var chip = page.querySelector('.day-chip[data-step="' + id + '"]');
      return { id: id, extra: extraIds.indexOf(id) >= 0, choiceTickets: chip && chip.dataset.choiceTickets ? chip.dataset.choiceTickets.split(',') : [] };
    }) };
    var counter = page.querySelector('[data-day-progress]');
    var meter = page.querySelector('[data-day-meter]');
    var resume = page.querySelector('[data-day-resume]');
    function paint() {
      inputs.forEach(function (input) { input.checked = state.done.has(input.dataset.step); });
      page.querySelectorAll('.day-chip[data-step], .day-step[data-step]').forEach(function (node) {
        node.classList.toggle('is-done', state.done.has(node.dataset.step));
      });
      var doneOf = function (list) { return list.filter(function (id) { return state.done.has(id); }).length; };
      var selectedIds = selectedSteps(day, state.selectedTicket).map(function (s) { return s.id; });
      var countedIds = progressSteps(day, state.selectedTicket).map(function (s) { return s.id; });
      var practiceIds = extraIds.filter(function (id) { return selectedIds.indexOf(id) < 0; });
      if (counter) counter.textContent = (selectedIds.length ? '공통 구현 완료 ' : '구현 완료 ') + doneOf(coreIds) + '/' + coreIds.length
        + (selectedIds.length ? ' · 선택 티켓 ' + state.selectedTicket + ' ' + doneOf(selectedIds) + '/' + selectedIds.length : '')
        + (practiceIds.length ? ' · 선택·연습 ' + doneOf(practiceIds) + '/' + practiceIds.length : '');
      if (meter) { meter.max = countedIds.length; meter.value = doneOf(countedIds); }
      if (counter) counter.classList.toggle('is-complete', doneOf(countedIds) === countedIds.length);
      var nextId = countedIds.find(function (id) { return !state.done.has(id); });
      page.querySelectorAll('.day-chip[data-step]').forEach(function (node) {
        node.classList.toggle('is-current', node.dataset.step === nextId);
      });
      if (resume) {
        var nextChip = nextId && page.querySelector('.day-chip[data-step="' + nextId + '"]');
        resume.href = nextChip ? nextChip.querySelector('a').getAttribute('href') : '#오늘의-sql';
        resume.textContent = nextChip ? nextChip.querySelector('.chip-no').textContent + ' ' + (doneOf(coreIds) ? '이어서 하기' : '시작하기') + ' →' : '구현 체크 완료 · 오늘의 SQL 확인 →';
      }
      storageNote(!state.ok ? 'blocked' : Object.keys(pending).length ? 'unsaved' : '');
    }
    // 최신 저장값(다른 탭의 체크 포함)을 다시 읽고 그 위에 이 화면의 미저장 변경을 얹는다.
    // 읽기에 실패하면 지금 화면 상태를 기준으로 한다.
    function reload() {
      var latest = readProgress(store);
      if (latest.ok || !state.ok) state = latest;
      Object.keys(pending).forEach(function (id) { if (pending[id]) state.done.add(id); else state.done.delete(id); });
    }
    inputs.forEach(function (input) {
      input.addEventListener('change', function () {
        pending[input.dataset.step] = input.checked;
        reload();
        // 저장소 자체를 못 쓰는 경우(state.ok=false)와 쓰기만 실패한 경우 모두 미저장 변경을 지켜 다음 저장 때 다시 얹는다.
        if (writeProgress(store, state.done)) pending = {};
        paint();
      });
    });
    window.addEventListener('course-records-change', function () { reload(); paint(); });
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


  // 해시를 기존 앵커 그대로 사용한다. 숨겨진 패널의 내부 앵커도 해당 패널을 먼저 연다.
  function initDayStepper(page) {
    var panels = Array.prototype.slice.call(page.querySelectorAll('.day-stepper-main > [data-day-panel]'));
    if (!panels.length) return;
    var toggle = page.querySelector('[data-day-expand]');
    var position = page.querySelector('[data-day-position]');
    var links = Array.prototype.slice.call(page.querySelectorAll('[data-panel-link]'));
    var expanded = false, active = panels.find(function (panel) { return panel.matches('.day-step'); }) || panels[0];
    var canonicalPanels = panels.slice();
    var defaultActive = active;
    function rebuildChoiceRoute(selectedTicket) {
      if (page.dataset.dayPage !== 'D14') return;
      var selection = typeof selectedTicket === 'string' ? selectedTicket : readProgress(storage()).selectedTicket;
      var choicePanels = canonicalPanels.filter(function (panel) {
        var chip = page.querySelector('.day-chip[data-step="' + panel.dataset.step + '"]');
        return chip && chip.hasAttribute('data-choice-tickets');
      });
      var selectedPanel = choicePanels.find(function (panel) {
        var chip = page.querySelector('.day-chip[data-step="' + panel.dataset.step + '"]');
        return (chip.dataset.choiceTickets || '').split(',').indexOf(selection) >= 0;
      });
      var additional = choicePanels.filter(function (panel) { return panel !== selectedPanel; });
      panels = canonicalPanels.filter(function (panel) { return additional.indexOf(panel) < 0; }).concat(additional);
      defaultActive = selectedPanel || (selection ? canonicalPanels.find(function (panel) { return panel.id === 'step-d14-5'; }) : canonicalPanels[0]);
      var list = page.querySelector('.day-chips');
      panels.forEach(function (panel, index) {
        panel.style.order = index;
        var link = links.find(function (item) { return item.getAttribute('href') === '#' + panel.id; });
        if (list && link) link.parentElement.style.order = index;
        var previous = panel.querySelector('.step-prev');
        if (previous && index > 0) {
          previous.href = '#' + panels[index - 1].id;
          previous.textContent = /-prep$/.test(panels[index - 1].id) ? '← 준비 자료' : '← 이전 순서';
        }
        var nextPanel = panels[index + 1];
        var next = panel.querySelector('.step-next');
        if (!next && nextPanel) {
          next = document.createElement('a');
          next.className = 'step-next';
          panel.querySelector('.step-footer').append(next);
        }
        if (next) {
          next.hidden = !nextPanel;
          if (nextPanel) {
            next.href = '#' + nextPanel.id;
            next.textContent = additional.indexOf(nextPanel) >= 0 ? '추가 연습 →' : '다음 순서 →';
          } else next.remove();
        }
        panel.classList.toggle('is-additional-ticket', additional.indexOf(panel) >= 0);
      });
    }
    rebuildChoiceRoute();
    if (page.dataset.dayPage === 'D14') active = defaultActive;
    var printDetails = [];
    var wrapPanels = Array.prototype.slice.call(page.querySelectorAll('[data-wrap-panel]'));
    var wrapLinks = Array.prototype.slice.call(page.querySelectorAll('[data-wrap-target]'));
    var wrapActive = wrapPanels[0];
    var wrapTabs = page.querySelector('.day-wrap-tabs');
    if (wrapTabs) wrapTabs.hidden = false;
    var stageKey = 'javaexperience.course.stages.v1';
    var stageInputs = Array.prototype.slice.call(page.querySelectorAll('[data-stage-check]'));
    var stageState = {}, stagePending = {}, stageStore = storage();
    function loadStages() {
      try { var value = stageStore && JSON.parse(stageStore.getItem(stageKey) || '{}'); if (value && typeof value === 'object') stageState = value; } catch (e) { /* 저장 불가 시 현재 화면의 기록을 유지한다. */ }
      Object.keys(stagePending).forEach(function (id) { stageState[id] = stagePending[id]; });
      stageInputs.forEach(function (input) { input.checked = stageState[input.dataset.stageCheck] === true; input.parentElement.classList.toggle('is-done', input.checked); });
      var stageProgress = page.querySelector('[data-stage-progress]');
      if (stageProgress) stageProgress.textContent = stageInputs.map(function(input) {
        var label = /-prep$/.test(input.dataset.stageCheck) ? '준비' : /-data$/.test(input.dataset.stageCheck) ? '데이터' : '마무리';
        return label + (input.checked ? ' 확인' : ' 미확인');
      }).join(' · ');
    }
    stageInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        var checked = input.checked;
        loadStages();
        stageState[input.dataset.stageCheck] = checked;
        stagePending[input.dataset.stageCheck] = checked;
        try { if (stageStore) { stageStore.setItem(stageKey, JSON.stringify(stageState)); stagePending = {}; } } catch (e) { /* 구현 진도와 분리하여 이 화면에 보존한다. */ }
        loadStages();
      });
    });
    window.addEventListener('pageshow', loadStages);
    window.addEventListener('storage', function (event) { if (event.key === stageKey || event.key === null) loadStages(); });
    loadStages();
    function paint() {
      panels.forEach(function (panel) {
        panel.hidden = !expanded && panel !== active;
        panel.classList.toggle('is-active', panel === active);
      });
      links.forEach(function (link) {
        var selected = link.getAttribute('href') === '#' + active.id;
        if (selected) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
        link.parentElement.classList.toggle('is-active', selected);
        var ownerIndex = panels.findIndex(function (panel) { return '#' + panel.id === link.getAttribute('href'); });
        link.parentElement.classList.toggle('is-following', ownerIndex === panels.indexOf(active) + 1);
      });
      if (toggle) { toggle.setAttribute('aria-pressed', String(expanded)); toggle.textContent = expanded ? '한 순서씩 보기' : '모두 펼쳐 보기'; }
      if (position) position.textContent = expanded ? '전체 ' + panels.length + '개 단계 · 내부 코드는 개별 펼침' : '현재 화면 ' + (panels.indexOf(active) + 1) + ' / ' + panels.length;
      page.classList.toggle('day-show-all', expanded);
      wrapPanels.forEach(function (panel) { panel.hidden = !expanded && panel !== wrapActive; });
      wrapLinks.forEach(function (link) {
        var selected = wrapActive && link.dataset.wrapTarget === wrapActive.id;
        if (selected) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
      });
    }
    function revealHash(scroll, targetHash) {
      var id;
      try { id = decodeURIComponent((targetHash === undefined ? window.location.hash : targetHash).slice(1)); } catch (e) { return; }
      var target = id && document.getElementById(id);
      var owner = target && target.closest('[data-day-panel]');
      if (owner && panels.indexOf(owner) >= 0) {
        active = owner;
        var wrapOwner = target.closest('[data-wrap-panel]');
        if (wrapOwner) wrapActive = wrapOwner;
        // 사용자 내부 링크만 접기를 연다. 초기 선택은 힌트·정답을 펼치지 않는다.
        if (target !== owner) {
          var fold = target.closest('details');
          while (fold && owner.contains(fold)) { fold.open = true; fold = fold.parentElement.closest('details'); }
        }
        paint();
        if (scroll && target.scrollIntoView) target.scrollIntoView({ block: 'start' });
      } else if (!id) {
        active = defaultActive;
        paint();
      }
    }
    function refreshChoiceRoute(event) {
      if (page.dataset.dayPage !== 'D14') return;
      if (event.type === 'storage' && event.key !== null && event.key !== KEY) return;
      rebuildChoiceRoute(event.detail && event.detail.selectedTicket);
      paint();
    }
    window.addEventListener('course-records-change', refreshChoiceRoute);
    window.addEventListener('storage', refreshChoiceRoute);
    window.addEventListener('pageshow', refreshChoiceRoute);
    page.classList.add('day-stepper-ready');
    if (toggle) {
      toggle.hidden = false;
      toggle.addEventListener('click', function () { expanded = !expanded; paint(); });
    }
    window.addEventListener('hashchange', function () { revealHash(true); });
    // 같은 앵커를 다시 누른 경우 hashchange가 없어도 패널을 연다.
    page.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (link) revealHash(true, link.hash);
    });
    var beforePrintExpanded;
    window.addEventListener('beforeprint', function () {
      beforePrintExpanded = expanded;
      expanded = true;
      printDetails = Array.prototype.slice.call(page.querySelectorAll('details:not([open])'));
      printDetails.forEach(function (fold) { fold.open = true; });
      paint();
    });
    window.addEventListener('afterprint', function () {
      expanded = beforePrintExpanded === true;
      printDetails.forEach(function (fold) { fold.open = false; });
      printDetails = [];
      paint();
    });
    // 브라우저 찾기 전에 모든 패널을 노출한다. 브라우저 기본 검색은 그대로 실행한다.
    window.addEventListener('keydown', function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { expanded = true; paint(); }
    });
    paint();
    revealHash(false);
  }

  // 준비·선택 기록은 구현 체크와 별도로 관리한다. 저장 실패한 변경은 이 화면에서 보존한다.
  function initRecords() {
    var store = storage(), pending = {}, pendingPrep = {};
    var choice = document.querySelector('[data-ticket-choice]');
    var preps = Array.prototype.slice.call(document.querySelectorAll('[data-prep]'));
    var data = document.getElementById('course-choice-data');
    var choices = data ? JSON.parse(data.textContent) : [];
    function current() {
      var state = readProgress(store);
      state.preparation = state.preparation || {};
      if ('selectedTicket' in pending) state.selectedTicket = pending.selectedTicket;
      Object.keys(pendingPrep).forEach(function(id) { if (pendingPrep[id]) state.preparation[id] = true; else delete state.preparation[id]; });
      return state;
    }
    function paint() {
      var state = current();
      if (choice) choice.value = state.selectedTicket || '';
      preps.forEach(function(input) { input.checked = state.preparation[input.dataset.prep] === true; });
      var selected = choices.find(function(t) { return t.id === state.selectedTicket; });
      document.querySelectorAll('[data-selected-ticket-compact]').forEach(function(node) {
        node.textContent = selected ? '내 선택 ' + selected.id + ' · ' + selected.day + ' 수행 · 고르지 않은 후보는 추가 연습' : '선택 기록 없음 · D11에서 한 건을 고르세요.';
        node.hidden = !selected && !!node.closest('[data-course-home]');
      });
      document.querySelectorAll('[data-selected-ticket]').forEach(function(node) {
        node.replaceChildren();
        if (!selected) { node.textContent = '선택 기록 없음 · D11에서 한 건을 고르세요. E01·모의 장애 훈련은 모두 수행합니다.'; return; }
        var link = document.createElement('a'); link.href = selected.href; link.textContent = selected.id + ' · ' + selected.title;
        node.append('내 선택: ', link, ' · ' + selected.day + '에서 수행 · E01·모의 장애 훈련은 모두 수행. ' + (selected.id === 'B16' ? '훈련: 201/200·1초 이내로 확인합니다.' : '훈련: 실패 여부와 대응 근거를 기록합니다.'));
      });
      document.querySelectorAll('[data-choice-tickets]').forEach(function(node) {
        var mine = node.dataset.choiceTickets.split(',').indexOf(state.selectedTicket) >= 0;
        var kind = node.querySelector('.chip-copy > [data-step-kind]');
        if (kind) kind.textContent = mine ? '내 선택 티켓 포함' : state.selectedTicket ? '고르지 않은 후보 · 추가 연습' : '선택 후보 · D11에서 1건 선택';
        node.classList.toggle('is-selected-ticket', mine);
        node.classList.toggle('is-additional-ticket', !mine);
      });
      document.querySelectorAll('[data-criterion-ticket]').forEach(function (fold) {
        var mine = fold.dataset.criterionTicket === state.selectedTicket;
        fold.open = mine;
        fold.classList.toggle('is-my-criterion', mine);
      });
      var note = document.querySelector('[data-record-storage]');
      if (note) note.textContent = !state.ok ? '저장소를 쓸 수 없어 새로고침하면 기록이 사라집니다.' : Object.keys(pending).length || Object.keys(pendingPrep).length ? '기록을 저장하지 못했습니다. 이 화면에만 남아 있습니다.' : '';
    }
    function save() {
      var state = current();
      if (writeProgress(store, state.done, state)) { pending = {}; pendingPrep = {}; }
      paint();
      window.dispatchEvent(new CustomEvent('course-records-change', { detail: { selectedTicket: state.selectedTicket || '' } }));
    }
    if (choice) choice.addEventListener('change', function() { pending.selectedTicket = choice.value; save(); });
    preps.forEach(function(input) { input.addEventListener('change', function() { pendingPrep[input.dataset.prep] = input.checked; save(); }); });
    window.addEventListener('pageshow', paint);
    window.addEventListener('storage', function(e) { if (e.key === null || e.key === KEY) paint(); });
    paint();
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
          if (button.closest('.code-toolbar')) { if (status) status.textContent = ok ? '복사됨' : '복사하지 못했습니다. 코드를 선택해 복사하세요.'; return; }
          if (status) status.textContent = ok ? '복사했어요. Codex 또는 Claude Code에 붙여 넣으세요.' : '자동 복사가 막혔어요. 선택된 프롬프트를 길게 눌러 복사하거나 ⌘C / Ctrl+C를 쓰세요.';
        }
        function fallback() {
          var ok = false;
          try {
            // 접힌 프롬프트도 자동 복사가 막히면 펼쳐서 직접 선택할 수 있게 한다.
            var fold = target.closest('details.grader-source');
            if (fold) fold.open = true;
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

  // ------------------------------------------------------------ 일자 더미 SQL
  function initDaySql() {
    document.querySelectorAll('[data-day-sql]').forEach(function (entry) {
      var status = entry.querySelector('[role="status"]');
      var copy = entry.querySelector('[data-sql-copy]');
      var download = entry.querySelector('[data-sql-download]');
      if (!copy || !download) return;
      var target = document.getElementById(copy.dataset.sqlCopy);
      if (!target) return;
      entry.querySelectorAll('[data-sql-copy]').forEach(function (button) {
        var fragment = button.closest('[data-sql-table]') || entry;
        var copyStatus = fragment.querySelector('[role="status"]');
        var copyTarget = document.getElementById(button.dataset.sqlCopy);
        if (!copyTarget) return;
        function fallback() {
          fragment.querySelector('details').open = true;
          var range = document.createRange();
          range.selectNodeContents(copyTarget);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          copyStatus.textContent = '자동 복사가 막혔어요. 선택된 SQL을 길게 눌러 복사하거나 파일 받기를 쓰세요(⌘C / Ctrl+C도 가능).';
        }
        button.addEventListener('click', function () {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(copyTarget.textContent).then(function () {
                copyStatus.textContent = 'SQL을 복사했어요. MySQL 편집기에 붙여 넣으세요.';
              }, fallback);
              return;
            }
          } catch (e) { /* 선택으로 대체한다 */ }
          fallback();
        });
      });
      download.addEventListener('click', function () {
        var url;
        try {
          var blob = new Blob([target.textContent], { type: 'text/sql;charset=utf-8' });
          url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = entry.dataset.sqlFilename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          status.textContent = '파일 받기를 시작했어요.';
        } catch (e) {
          status.textContent = '파일을 받지 못했어요. SQL 복사를 이용하세요.';
        } finally {
          if (url) window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        }
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
      var pick = nextDay(days, state.done, state.selectedTicket);
      var day = pick.day;
      var tags = { first: '오늘 할 일 · 처음 시작', continue: '오늘 할 일 · 이어서', next: '오늘 할 일 · 다음 날', remaining: '오늘 할 일 · 남은 순서가 있는 날', complete: days.length + '일 과정 · 필수 구현 체크 끝 · 채점 결과 별도' };
      $('[data-today-tag]').textContent = tags[pick.mode];
      $('[data-today-id]').textContent = day.id;
      $('[data-today-title]').textContent = day.title;
      var core = coreSteps(day);
      var selected = selectedSteps(day, state.selectedTicket);
      var extraCount = day.steps.length - progressSteps(day, state.selectedTicket).length;
      var doneHere = core.filter(function (s) { return state.done.has(s.id); }).length;
      $('[data-today-meta]').textContent = day.phaseLabel + (selected.length
        ? ' · 공통 구현 ' + doneHere + '/' + core.length + ' · 선택 티켓 ' + state.selectedTicket + ' ' + selected.filter(function (s) { return state.done.has(s.id); }).length + '/' + selected.length
        : ' · 순서 ' + core.length + '개' + (doneHere ? ' 중 ' + doneHere + '개 끝냄' : ''))
        + (extraCount ? ' · 선택·연습 ' + extraCount + '개' : '') + ' · 오늘의 Java ' + day.java;
      var wrapup = $('[data-course-wrapup]');
      if (wrapup) {
        wrapup.replaceChildren();
        var lastChecked = days.filter(function(d) { return d.steps.some(function(s) { return state.done.has(s.id); }); }).pop();
        if (lastChecked && progressSteps(lastChecked, state.selectedTicket).every(function(s) { return state.done.has(s.id); })) {
          wrapup.append('구현 체크 뒤 SQL·말하기·채점을 확인하세요: ');
          [['SQL','#오늘의-sql'],['말하기','#말하기-카드'],['채점','#ai-채점-프롬프트']].forEach(function(item) {
            var a=document.createElement('a'); a.href=lastChecked.href+item[1]; a.textContent=lastChecked.id+' '+item[0]; wrapup.append(a,' ');
          });
        }
      }
      var list = $('[data-today-steps]');
      list.replaceChildren.apply(list, day.steps.map(function (s, i) {
        var li = document.createElement('li');
        if (state.done.has(s.id)) li.className = 'is-done';
        var no = document.createElement('span');
        no.setAttribute('aria-hidden', 'true');
        no.textContent = NUMS[i] || String(i + 1);
        var task = document.createElement('a');
        task.href = day.href + '#step-' + s.id.toLowerCase();
        task.textContent = s.title + (s.requirement ? ' · ' + s.requirement : '') + (selected.indexOf(s) >= 0 ? ' (내 선택 ' + state.selectedTicket + ')' : s.extra && core.length < day.steps.length ? ' (선택·연습)' : '') + (state.done.has(s.id) ? ' (끝냄)' : '');
        li.append(no, ' ', task);
        return li;
      }));
      var returning = state.done.size > 0;
      home.classList.toggle('is-returning', returning);
      var resume = $('[data-today-resume]');
      var pending = progressSteps(day, state.selectedTicket).find(function(s) { return !state.done.has(s.id); });
      if (resume) {
        resume.hidden = !returning;
        resume.href = day.href + (pending ? '#step-' + pending.id.toLowerCase() : '#오늘의-sql');
        resume.textContent = pending ? day.id + ' ' + NUMS[day.steps.indexOf(pending)] + ' 이어서 하기 →' : day.id + ' SQL·말하기·채점 확인 →';
      }
      var open = $('[data-today-open]');
      open.href = day.href;
      var pendingTicket = selected.find(function (s) { return !state.done.has(s.id); });
      if (pendingTicket && doneHere === core.length) open.href = day.href + '#step-' + pendingTicket.id.toLowerCase();
      open.textContent = 'Spring ' + day.id + (pendingTicket && doneHere === core.length ? ' · ' + state.selectedTicket + ' 이어서' : '');
      var java = $('[data-today-java]');
      if (day.javaHref) { java.href = day.javaHref; java.textContent = 'Java ' + day.java; java.hidden = false; } else java.hidden = true;
      var during = day.javaTiming === 'during-or-after';
      var flow = $('[data-today-flow]');
      var grade = $('[data-today-grade]');
      var first = returning || during ? open : java;
      var second = returning || during ? java : open;
      [java, open].forEach(function (link) {
        link.classList.toggle('ch-primary', !returning && link === first);
        link.classList.toggle('ch-secondary', returning || link !== first);
      });
      if (during) java.textContent += ' · 수행 중·사후 증거';
      // CSS 순서만 바꾸지 않고 키보드·스크린리더도 같은 순서로 읽게 한다.
      var arrow = function () { var span = document.createElement('span'); span.setAttribute('aria-hidden', 'true'); span.textContent = '→'; return span; };
      flow.replaceChildren(first, arrow(), second, arrow(), grade);
      grade.href = day.href + '#ai-채점-프롬프트';
      $('[data-today-note]').hidden = pick.mode !== 'first';
      var total = 0, checked = 0, choiceTotal = 0, choiceChecked = 0;
      days.forEach(function (d) {
        var counted = progressSteps(d, state.selectedTicket);
        var n = counted.filter(function (s) { return state.done.has(s.id); }).length;
        var choice = selectedSteps(d, state.selectedTicket);
        choiceTotal += choice.length;
        choiceChecked += choice.filter(function (s) { return state.done.has(s.id); }).length;
        total += counted.length; checked += n;
        var cell = home.querySelector('.ch-day[data-day="' + d.id + '"]');
        if (!cell) return;
        cell.classList.toggle('is-today', d.id === day.id);
        cell.classList.toggle('is-done', n === counted.length);
        var count = cell.querySelector('[data-day-count]');
        if (count) count.textContent = n + '/' + counted.length;
        var bar = cell.querySelector('.ch-bar i');
        if (bar) bar.style.width = Math.round((n / counted.length) * 100) + '%';
      });
      $('[data-progress-summary]').textContent = choiceTotal
        ? '공통 구현 ' + (checked - choiceChecked) + '/' + (total - choiceTotal) + ' · 선택 티켓 ' + state.selectedTicket + ' ' + choiceChecked + '/' + choiceTotal
        : '체크한 순서 ' + checked + '/' + total;
      storageNote(state.ok ? '' : 'blocked');
    }
    window.addEventListener('pageshow', render);
    // 다른 탭(일자 페이지)에서 체크하면 열린 홈의 오늘 할 일·진도도 다시 그린다. 홈은 저장값을 쓰지 않으므로 덮을 변경이 없다.
    window.addEventListener('storage', function (e) { if (e.key === null || e.key === KEY) render(); });
    render();
  }

  // 설정 형식은 모든 블록에서 공유한다. 저장 실패는 현재 화면 조작을 막지 않는다.
  function initConfigTabs() {
    var key = 'javaexperience.course.config-format.v1';
    var groups = Array.from(document.querySelectorAll('[data-config-tabs]'));
    var store = storage(), selected = 'yml';
    try { if (store && store.getItem(key) === 'properties') selected = 'properties'; } catch (e) {}
    function select(format, persist) {
      groups.forEach(function (group) {
        group.querySelectorAll('[role="tab"]').forEach(function (tab) {
          var active = tab.dataset.configFormat === format;
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
        });
        group.querySelectorAll('[data-config-panel]').forEach(function (panel) { panel.hidden = panel.dataset.configPanel !== format; });
      });
      if (persist) { try { if (store) store.setItem(key, format); } catch (e) {} }
    }
    groups.forEach(function (group) {
      group.querySelector('[role="tablist"]').hidden = false;
      var tabs = Array.from(group.querySelectorAll('[role="tab"]'));
      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () { select(tab.dataset.configFormat, true); });
        tab.addEventListener('keydown', function (e) {
          var next;
          if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = tabs.length - 1;
          else return;
          e.preventDefault();
          select(tabs[next].dataset.configFormat, true);
          tabs[next].focus();
        });
      });
    });
    select(selected, false);
  }

  function initMapProgress() {
    var root = document.querySelector('[data-course-map]');
    var data = document.getElementById('course-days-data');
    if (!root || !data) return;
    var days = JSON.parse(data.textContent), store = storage();
    function paint() {
      var state = readProgress(store), pick = nextDay(days, state.done, state.selectedTicket), day = pick.day;
      var steps = progressSteps(day, state.selectedTicket);
      var next = steps.find(function(s) { return !state.done.has(s.id); });
      var count = steps.filter(function(s) { return state.done.has(s.id); }).length;
      root.querySelector('[data-cm-progress]').textContent = '이어서 할 곳: ' + day.id + ' · ' + count + '/' + steps.length + (next ? ' · 다음 ' + '①②③④⑤⑥⑦⑧⑨⑩'[day.steps.indexOf(next)] : ' · 구현 체크 끝, 마무리 확인') + ' · 지금 학습 중 표시는 관계 선택과 별개입니다.';
      root.querySelectorAll('[data-node]').forEach(function(node) {
        var current = node.dataset.node === day.id;
        node.classList.toggle('is-learning', current);
        if (current) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
      });
      root.dataset.currentDay = day.id;
      root.dispatchEvent(new CustomEvent('course-location'));
    }
    window.addEventListener('pageshow', paint);
    window.addEventListener('storage', function(e) { if (e.key === KEY || e.key === null) paint(); });
    paint();
  }
  function initHeaderOffset() {
    var header = document.querySelector('.site-topbar');
    if (!header) return;
    function measure() { document.documentElement.style.setProperty('--course-header-height', Math.ceil(header.getBoundingClientRect().height) + 'px'); }
    measure();
    if (window.ResizeObserver) new ResizeObserver(measure).observe(header);
    window.addEventListener('resize', measure);
  }
  function initDataReturn() {
    if (!/\/course\/start\/dummy\/README\.html$/.test(window.location.pathname)) return;
    var day = new URLSearchParams(window.location.search).get('day');
    if (!/^D(?:0[1-9]|[1-3][0-9]|4[0-5])$/.test(day || '')) return;
    var content = document.querySelector('.guide-content');
    if (!content) return;
    var link = document.createElement('a');
    link.className = 'data-guide-return'; link.href = '../../spring/' + day + '.html#step-' + day.toLowerCase() + '-data';
    link.textContent = day + ' 데이터 넣기로 돌아가기 →';
    content.prepend(link);
    var region = content.querySelector('[data-day-guide]');
    var reference = content.querySelector('[data-day-guide-reference]');
    var data = document.getElementById('course-day-data-guide');
    if (!region || !reference || !data) return;
    var payload;
    try { payload = JSON.parse(data.textContent)[day]; } catch (e) { return; }
    if (!payload || payload.id !== day || !Array.isArray(payload.files) || !Array.isArray(payload.steps) || !Array.isArray(payload.checks)) return;
    function node(tag, className, text) {
      var element = document.createElement(tag);
      if (className) element.className = className;
      if (text !== undefined) {
        String(text).split(/(`[^`]+`)/g).forEach(function (part) {
          if (/^`[^`]+`$/.test(part)) {
            var code = document.createElement('code'); code.textContent = part.slice(1, -1); element.append(code);
          } else element.append(document.createTextNode(part));
        });
      }
      return element;
    }
    function listSection(className, title, items, ordered, tag) {
      if (!items || !items.length) return null;
      var section = node(tag || 'section', className);
      section.append(node('h3', '', title));
      var list = node(ordered ? 'ol' : 'ul');
      items.forEach(function (item) { list.append(node('li', '', item)); });
      section.append(list);
      return section;
    }
    var heading = node('h2', '', day + ' · ' + payload.title);
    heading.id = 'day-data-guide-title';
    region.replaceChildren(heading, node('p', 'day-guide-context', payload.context));
    region.dataset.contentKind = 'practice';
    var warnings = listSection('day-guide-warnings', '실행 전에 주의', payload.warnings, false, 'aside');
    if (warnings) region.append(warnings);
    var files = node('section', 'day-guide-files');
    files.append(node('h3', '', '이 날 실행할 파일·범위'));
    if (payload.files.length) {
      var fileList = node('ul');
      payload.files.forEach(function (file) {
        var item = node('li');
        var fileLink = node('a', '', file.name); fileLink.href = file.href;
        item.append(fileLink, node('span', '', file.scope));
        fileList.append(item);
      });
      files.append(fileList);
    } else files.append(node('p', '', '이 날 새로 적재할 SQL 파일은 없습니다. 아래 실행 범위를 따르세요.'));
    region.append(files);
    var grid = node('div', 'day-guide-grid');
    var prerequisites = listSection('day-guide-prerequisites', '먼저 확인할 조건', payload.prerequisites);
    var steps = listSection('day-guide-steps', '실행 순서', payload.steps, true);
    if (prerequisites) grid.append(prerequisites);
    if (steps) grid.append(steps);
    var checks = node('section', 'day-guide-checks');
    checks.append(node('h3', '', '확인할 성질·원문 기준 기대값'));
    var checkList = node('ol');
    payload.checks.forEach(function (check) {
      var item = node('li');
      item.append(node('p', 'day-guide-check-task', check.task), node('p', 'day-guide-check-expect', check.expect));
      checkList.append(item);
    });
    checks.append(checkList); grid.append(checks);
    region.append(grid);
    var action = node('a', 'day-guide-action', payload.returnLabel); action.href = payload.returnHref;
    region.append(action);
    var full = node('details', 'day-guide-all');
    full.append(node('summary', '', '전체 더미 SQL 안내'));
    reference.before(full); full.append(reference);
    content.classList.add('has-day-guide');
    region.hidden = false;
    function revealReference(hash, scroll) {
      var id;
      try { id = decodeURIComponent((hash || '').slice(1)); } catch (e) { return; }
      var target = id && document.getElementById(id);
      if (!target || !reference.contains(target)) return;
      full.open = true;
      var parent = target.closest('details');
      while (parent && reference.contains(parent)) { parent.open = true; parent = parent.parentElement.closest('details'); }
      if (scroll && target.scrollIntoView) target.scrollIntoView({ block: 'start' });
    }
    (content.closest('.course-guide') || content).addEventListener('click', function (event) {
      var anchor = event.target.closest('a[href^="#"]');
      if (anchor) revealReference(anchor.hash, false);
    });
    window.addEventListener('hashchange', function () { revealReference(window.location.hash, true); });
    revealReference(window.location.hash, true);
  }

  window.jxCourseProgress = { KEY: KEY, readProgress: readProgress, writeProgress: writeProgress, nextDay: nextDay };
  function start() {
    initHeaderOffset();
    initConfigTabs();
    initMapProgress();
    initDataReturn();
    var page = document.querySelector('[data-day-page]');
    if (page) { initDay(page); initDayStepper(page); }
    var home = document.querySelector('[data-course-home]');
    if (home) initHome(home);
    initCopy();
    initDaySql();
    initRecords();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
