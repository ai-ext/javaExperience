// 외부 라이브러리 없이 코드 텍스트를 토큰별 span으로 감싼다. HTML은 항상 text node로 유지한다.
(() => {
  const patterns = {
    java: [
      ['comment', /\/\*[\s\S]*?\*\/|\/\/[^\n]*/y],
      ['string', /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y],
      ['annotation', /@[A-Za-z_$][\w$]*/y],
      ['keyword', /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|record|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while|yield)\b/y],
      ['literal', /\b(?:true|false|null)\b/y],
      ['number', /\b\d+(?:\.\d+)?(?:[fFdDlL])?\b/y],
      ['time', /\b(?:Clock|DateTimeException|Duration|Instant|LocalDate|LocalDateTime|LocalTime|MonthDay|OffsetDateTime|OffsetTime|Period|Year|YearMonth|ZoneId|ZoneOffset|ZonedDateTime)\b/y],
      ['type', /\b[A-Z][A-Za-z_$\d]*\b/y],
      ['function', /\b[A-Za-z_$][\w$]*(?=\s*\()/y],
    ],
    json: [
      ['string', /"(?:\\.|[^"\\])*"/y],
      ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
      ['literal', /\b(?:true|false|null)\b/y],
    ],
    sql: [
      ['comment', /--[^\n]*|\/\*[\s\S]*?\*\//y],
      ['string', /'(?:''|\\.|[^'\\])*'/y],
      ['keyword', /\b(?:ADD|ALTER|AS|ASC|BEGIN|BY|CASCADE|CHECK|COLUMN|COMMIT|CONSTRAINT|CREATE|DATABASE|DEFAULT|DELETE|DESC|DISTINCT|DROP|EXISTS|FOREIGN|FROM|GROUP|HAVING|INDEX|INSERT|INTO|IS|JOIN|KEY|LEFT|LIMIT|NOT|NULL|ON|ORDER|PRIMARY|REFERENCES|RENAME|SELECT|SET|TABLE|TRANSACTION|UNIQUE|UPDATE|VALUES|WHERE)\b/iy],
      ['type', /\b(?:BIGINT|BOOLEAN|CHAR|DATE|DATETIME|DECIMAL|INT|INTEGER|JSON|TEXT|TIME|TIMESTAMP|VARCHAR)\b/iy],
      ['number', /\b\d+(?:\.\d+)?\b/y],
    ],
  };

  function language(code) {
    const declared = [...code.classList].find((name) => name.startsWith('language-'))?.slice(9).toLowerCase();
    if (declared === 'java' || declared === 'json' || declared === 'sql') return declared;
    const file = code.closest('.snapshot-file')?.querySelector('summary')?.textContent || code.closest('.code-file')?.querySelector('summary')?.textContent || '';
    const extension = file.split('.').at(-1)?.toLowerCase();
    if (extension === 'java') return 'java';
    if (extension === 'sql') return 'sql';
    if (extension === 'json') return 'json';
    return '';
  }

  function highlight(code) {
    if (code.dataset.highlighted) return;
    const lang = language(code);
    const rules = patterns[lang];
    if (!rules) return;
    const source = code.textContent;
    const fragment = document.createDocumentFragment();
    let pos = 0;
    while (pos < source.length) {
      let token = null;
      for (const [kind, regex] of rules) {
        regex.lastIndex = pos;
        const match = regex.exec(source);
        if (match && match.index === pos) { token = { kind, text: match[0] }; break; }
      }
      if (!token) {
        fragment.append(document.createTextNode(source[pos]));
        pos++;
        continue;
      }
      const span = document.createElement('span');
      span.className = `syntax-${token.kind}`;
      span.textContent = token.text;
      fragment.append(span);
      pos += token.text.length;
    }
    code.replaceChildren(fragment);
    code.dataset.highlighted = 'true';
    code.dataset.language = lang;
  }

  function scan(root = document) { root.querySelectorAll('pre > code, pre code').forEach(highlight); }
  scan();
  new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches('pre > code, pre code')) highlight(node);
    scan(node);
  }))).observe(document.documentElement, { childList: true, subtree: true });
})();
