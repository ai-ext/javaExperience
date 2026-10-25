// 실제 요청 결과는 상태별 표식을 갱신한다. 결과 문자열은 그대로 유지한다.
(function () {
  'use strict';
  var codes = /\b(?:200|201|202|204|400|401|403|404|405|408|409|415|422|429|500|502|503|504)\b|timeout|타임아웃/gi;
  function colorResult(el) {
    var text = el.textContent;
    if (el.dataset.coloredResult === text) return;
    var fragment = document.createDocumentFragment(), cursor = 0;
    for (var match of text.matchAll(codes)) {
      fragment.append(text.slice(cursor, match.index));
      var badge = document.createElement('span');
      badge.dataset.httpStatus = /timeout|타임아웃/i.test(match[0]) ? 'timeout' : match[0];
      badge.className = 'semantic-http-status'; badge.textContent = match[0]; fragment.append(badge);
      cursor = match.index + match[0].length;
    }
    fragment.append(text.slice(cursor));
    el.dataset.coloredResult = text;
    el.replaceChildren(fragment);
  }
  var selector = '.response-status,.request-status,.p16-endpoint,.p16-error-status';
  document.querySelectorAll(selector).forEach(colorResult);
  new MutationObserver(function (changes) {
    var results = new Set();
    changes.forEach(function (change) {
      var parent = change.target.nodeType === 1 ? change.target : change.target.parentElement;
      var result = parent && parent.closest(selector); if (result) results.add(result);
      change.addedNodes.forEach(function (node) {
        if (node.nodeType !== 1) return;
        if (node.matches(selector)) results.add(node);
        node.querySelectorAll(selector).forEach(function (el) { results.add(el); });
      });
    });
    results.forEach(colorResult);
  }).observe(document.querySelector('main') || document.body, {childList:true,subtree:true,characterData:true});
}());
