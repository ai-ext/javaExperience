// 기존 앵커를 주소로 유지하며 메뉴가 선택한 본문만 연다.
(function () {
  'use strict';
  function start() {
    var main = document.querySelector('main');
    if (!main || main.dataset.sectionViewsReady) return;
    main.dataset.sectionViewsReady = 'true';
    var siteHeader = document.querySelector('.site-topbar');
    function measureHeader() { if (siteHeader) document.documentElement.style.setProperty('--course-header-height',siteHeader.getBoundingClientRect().height + 'px'); }
    measureHeader(); window.addEventListener('resize',measureHeader);
    if (siteHeader && window.ResizeObserver) new ResizeObserver(measureHeader).observe(siteHeader);
    if (main.querySelector('[data-day-page]')) return;
    var menus = Array.from(main.querySelectorAll('.guide-index, .exercise-route, .knowledge-page-steps, .lesson-atlas, .request-steps, .mission-visual nav, .mission-visual-shortcuts'));
    var entries = [], panels = [], originalHidden = new WeakMap();
    function addPanel(panel) {
      if (!panel) return null;
      if (panels.indexOf(panel) < 0) { panels.push(panel); originalHidden.set(panel,panel.hidden); panel.dataset.sectionPanel = ''; }
      return panel;
    }
    function owner(target) {
      if (!target) return null;
      var panel = target.closest('[data-section-panel], .guide-section, .exercise-section, .knowledge-chapter, .lesson-scene, .api-request, .ticket-flow');
      if (panel) return addPanel(panel);
      if (/^H[23]$/.test(target.tagName)) {
        panel = document.createElement('section'); panel.className = 'section-view-panel';
        target.before(panel); panel.append(target);
        while (panel.nextElementSibling && !panel.nextElementSibling.matches('h1,h2,h3,script,nav')) panel.append(panel.nextElementSibling);
        return addPanel(panel);
      }
      return addPanel(target.closest('section,article,details') || target);
    }
    function entry(id, label, panel, phase) {
      if (!panel || entries.some(function (e) { return e.id === id; })) return;
      panel.id ||= 'section-panel-' + (panels.indexOf(panel) + 1);
      entries.push({id:id,label:label.replace(/^#\s*/, '').trim(),panel:panel,phase:phase || ''});
    }
    var guide = main.querySelector('.course-guide');
    if (guide) {
      // 일정 원문에는 표 앞의 대제목이 독립 노드로 남아 있다.
      Array.from(guide.querySelectorAll('.guide-content > h2')).forEach(owner);
      guide.querySelectorAll('.guide-section,.exercise-section,.ticket-flow').forEach(addPanel);
    }
    menus.forEach(function (menu) {
      menu.querySelectorAll('a[href^="#"]').forEach(function (link) {
        var id; try { id = decodeURIComponent(link.hash.slice(1)); } catch (e) { return; }
        var target = document.getElementById(id);
        var phase = target && target.matches('.schedule-card') ? target.dataset.phase : '';
        entry(id, link.querySelector('.request-step-title,strong,.chip-title')?.textContent || link.textContent, owner(target), phase);
      });
    });
    var home = main.querySelector('[data-course-home]');
    if (home) {
      [['.ch-hero','home-today','오늘 할 일'],['.ch-progress','home-progress','45일 진도'],['.ch-ticket-summary','home-tickets','선택 티켓'],['.ch-entries','home-resources','학습 자료'],['.home-reference','home-reference','참고 도감']].forEach(function (item) {
        var panel = main.querySelector(item[0]); if (!panel) return;
        panel.id ||= item[1]; entry(panel.id,item[2],addPanel(panel));
      });
      var environment = document.getElementById('home-environment');
      if (environment) entry(environment.id,'개발 환경',addPanel(environment));
      main.querySelectorAll('.home-reference > :not(script),.home-visual > :not(script)').forEach(addPanel);
    }
    var journey = main.querySelector('.learning-journey');
    if (journey) {
      [['.journey-dashboard','journey-overview','학습 흐름'],['.visual-catalog','visual-catalog','단계별 시안'],['.journey-browser','journey-all-apis','API 찾기'],['.journey-chapters','journey-chapters-view','장별 경로']].forEach(function (item) {
        var panel = journey.querySelector(item[0]); if (!panel) return;
        panel.id ||= item[1]; entry(panel.id,item[2],addPanel(panel));
      });
      journey.querySelectorAll(':scope > .journey-entry').forEach(addPanel);
    }
    var catalog = main.querySelector('.kc-catalog');
    if (catalog) {
      [['.kc-browse','kc-browse-view','개념 분야'],['.kc-sequence','kc-sequence','학습 순서'],['#kc-original','kc-original','원문 전체']].forEach(function (item) {
        var panel = main.querySelector(item[0]); if (!panel) return;
        panel.id ||= item[1]; entry(panel.id,item[2],addPanel(panel));
      });
      catalog.querySelectorAll('.kc-context,.kc-intro,.kc-original-link').forEach(addPanel);
    }
    var missions = main.querySelector('.mission-visual');
    if (journey || catalog || missions) {
      Array.from(main.querySelectorAll(':scope > h2')).forEach(owner);
      main.querySelectorAll(':scope > section,:scope > article,:scope > details,:scope > div,:scope > p:not(.crumbs)').forEach(addPanel);
      if (missions) main.querySelectorAll('.mission-detail-card').forEach(addPanel);
    }
    var map = main.querySelector('.course-map'), tables = main.querySelector('.cm-tables');
    if (map && tables) {
      map.id ||= 'course-map-view'; tables.id ||= 'course-relations-view';
      entry(map.id,'관계 지도',addPanel(map)); entry(tables.id,'연결 목록',addPanel(tables));
    }
    if (menus.some(function(menu) { return menu.matches('.knowledge-page-steps,.lesson-atlas,.request-steps'); })) {
      main.querySelectorAll(':scope > section,:scope > article,:scope > details,:scope > div,.knowledge-chapter,.lesson-scene,.api-request').forEach(addPanel);
    }
    if (!entries.length) return;
    var nav = document.createElement('nav'); nav.className = 'section-switcher';
    nav.setAttribute('aria-label','이 페이지 내용 선택'); nav.setAttribute('role','tablist');
    var all = {id:'section-all',label:'전체',panel:null,phase:''};
    entries.unshift(all);
    entries.forEach(function (item,index) {
      var button = document.createElement('button'); button.type = 'button'; button.id = 'section-tab-' + index;
      button.setAttribute('role','tab'); button.textContent = item.label; button.dataset.sectionTarget = item.id;
      if (item.panel) button.setAttribute('aria-controls',item.panel.id);
      button.addEventListener('click',function () { choose(item,true); });
      button.addEventListener('keydown',function (event) {
        var next = event.key === 'ArrowRight' ? (index + 1) % entries.length : event.key === 'ArrowLeft' ? (index + entries.length - 1) % entries.length : event.key === 'Home' ? 0 : event.key === 'End' ? entries.length - 1 : null;
        if (next === null) return; event.preventDefault(); choose(entries[next],true); entries[next].button.focus({preventScroll:true});
      });
      item.button = button; nav.append(button);
    });
    main.prepend(nav); main.classList.add('has-section-switcher');
    menus.forEach(function (menu) { menu.hidden = true; menu.dataset.replacedBySections = ''; });
    var active = all;
    function paint(item) {
      active = item;
      panels.forEach(function (panel) {
        panel.hidden = item.panel ? panel !== item.panel && !panel.contains(item.panel) && !item.panel.contains(panel) : originalHidden.get(panel);
      });
      main.querySelectorAll('.schedule-card[data-phase]').forEach(function (card) { card.hidden = !!item.phase && card.dataset.phase !== item.phase; });
      entries.forEach(function (candidate) {
        var selected = candidate === item;
        candidate.button.setAttribute('aria-selected',String(selected)); candidate.button.tabIndex = selected ? 0 : -1;
      });
      if (item.panel) {
        item.panel.setAttribute('role','tabpanel'); item.panel.setAttribute('aria-labelledby',item.button.id);
        var fold = item.panel.closest('details');
        while (fold) { fold.open = true; fold = fold.parentElement.closest('details'); }
        if (item.panel.matches('details')) item.panel.open = true;
      }
      main.querySelectorAll('.exercise-work-grid').forEach(function (grid) { grid.hidden = !Array.from(grid.children).some(function(child) { return !child.hidden; }); });
    }
    function align() {
      var header = document.querySelector('.site-topbar');
      var top = header ? header.getBoundingClientRect().height : 0;
      // 내용을 바꾼 뒤에도 다음 메뉴를 같은 위치에서 선택할 수 있게 보정한다.
      if (window.scrollY > nav.offsetTop - top) window.scrollTo({top:Math.max(0,window.scrollY + nav.getBoundingClientRect().top - top),behavior:'instant'});
    }
    function choose(item,push) {
      paint(item);
      if (push && window.location.hash !== '#' + encodeURIComponent(item.id)) history.pushState(history.state,'','#' + encodeURIComponent(item.id));
      var menuBox = nav.getBoundingClientRect(), buttonBox = item.button.getBoundingClientRect();
      if (buttonBox.right > menuBox.right) nav.scrollLeft += buttonBox.right - menuBox.right + 8;
      else if (buttonBox.left < menuBox.left) nav.scrollLeft -= menuBox.left - buttonBox.left + 8;
      align();
    }
    function reveal(scroll) {
      var id; try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
      if (!id || id === all.id) { paint(all); if (scroll) align(); return; }
      var item = entries.find(function (candidate) { return candidate.id === id; });
      if (!item && /^visual-grade-/.test(id)) item = entries.find(function(candidate) { return candidate.id === 'visual-catalog'; });
      if (!item && /^kc-category-/.test(id)) item = entries.find(function(candidate) { return candidate.id === 'kc-browse-view'; });
      var target = document.getElementById(id);
      if (!item && target) {
        // 내부 링크는 가장 가까운 본문을 선택하며 접힌 원문도 연다.
        var candidates = entries.filter(function(candidate) { return candidate.panel && candidate.panel.contains(target); });
        item = candidates.find(function(candidate) { return !candidates.some(function(other) { return other !== candidate && candidate.panel.contains(other.panel) && other.panel.contains(target); }); });
      }
      if (!item) return;
      paint(item);
      if (target && target !== item.panel) {
        var fold = target.closest('details');
        while (fold) { fold.open = true; fold = fold.parentElement.closest('details'); }
      }
      if (scroll) align();
    }
    // pushState로 주소만 갱신하고 기존 내부 링크도 같은 전환 경로에서 처리한다.
    document.addEventListener('click',function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var id; try { id = decodeURIComponent(link.hash.slice(1)); } catch(e) { return; }
      var target = document.getElementById(id);
      if (!entries.some(function(item) { return item.id === id || (target && item.panel && item.panel.contains(target)); })) return;
      event.preventDefault(); history.pushState(history.state,'',link.hash); reveal(true);
    },true);
    window.addEventListener('popstate',function () { reveal(true); });
    window.addEventListener('hashchange',function () { reveal(true); });
    document.addEventListener('click',function (event) { if (event.target.closest('button[data-kc-category]')) reveal(true); });
    document.addEventListener('keydown',function (event) {
      if (event.target.matches('button[data-kc-category]') && ['ArrowLeft','ArrowRight','Home','End'].indexOf(event.key) >= 0) reveal(true);
    });
    document.addEventListener('submit',function (event) { if (event.target.matches('.kc-search')) reveal(true); });
    var beforePrint;
    window.addEventListener('beforeprint',function () { beforePrint = active; paint(all); });
    window.addEventListener('afterprint',function () { paint(beforePrint || all); });
    paint(all); reveal(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
