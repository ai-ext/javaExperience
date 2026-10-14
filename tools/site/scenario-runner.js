(() => {
  const baseInput = document.querySelector('#scenario-base-url');
  if (!baseInput) return;
  const responses = new Map();
  const baseUrl = () => baseInput.value.trim().replace(/\/+$/, '');
  function updateUrl(article) {
    article.querySelector('.postman-url').textContent = `${baseUrl()}${article.querySelector('.request-path').value}`;
  }
  document.querySelectorAll('.api-request').forEach((article) => {
    const button = article.querySelector('.send-request');
    const status = article.querySelector('.request-status');
    const response = article.querySelector('.request-response');
    const hasOriginHeader = [...article.querySelectorAll('.request-header')]
      .some((input) => input.dataset.name.toLowerCase() === 'origin');
    if (hasOriginHeader) {
      const note = document.createElement('p');
      note.className = 'origin-header-note';
      note.textContent = `브라우저는 Origin을 페이지 주소(${location.origin})로 자동 전송합니다. 지정한 Origin 값의 테스트는 Postman에서 수행하세요.`;
      article.querySelector('.request-fields').append(note);
    }
    article.querySelector('.request-path').addEventListener('input', () => updateUrl(article));
    baseInput.addEventListener('input', () => document.querySelectorAll('.api-request').forEach(updateUrl));
    updateUrl(article);

    const setStatus = (message, state = 'ready') => {
      status.textContent = message;
      status.dataset.state = state;
    };

    button.addEventListener('click', async () => {
      const method = article.dataset.method;
      const requestPath = article.querySelector('.request-path').value;
      const bodyInput = article.querySelector('.request-body');
      const concurrentCount = Number(article.dataset.concurrentCount || 0);
      const repeatCount = Number(article.dataset.repeat || 0);
      let defaults = {};
      try { defaults = JSON.parse(article.dataset.concurrentVars || '{}'); } catch {}
      const entered = new Map([...article.querySelectorAll('.request-var-values')]
        .map((input) => [input.dataset.name, input.value.split(/\r?\n/).map((value) => value.trim())]));
      const custom = new Map([...article.querySelectorAll('.request-variable')]
        .map((input) => [input.dataset.ref, input.value.trim()]));
      const count = concurrentCount || repeatCount || 1;
      const contexts = Array.from({ length: count }, (_, index) => Object.fromEntries(Object.entries(defaults).map(([name, values]) => {
        const supplied = entered.get(name);
        const sensitive = /token|auth|^tok$/i.test(name);
        return [name, sensitive ? (supplied?.[index] || '') : (supplied?.[index] ?? values[index] ?? values[0] ?? '')];
      })));
      if (concurrentCount && Object.keys(defaults).some((name) => /token|auth|^tok$/i.test(name) && contexts.some((context) => !context[name]))) {
        setStatus(`동시 요청 ${count}개의 토큰을 한 줄에 하나씩 직접 입력하세요.`, 'error');
        return;
      }

      const resolve = (value, context, unresolved, { allowResponse = true } = {}) => String(value).replace(/\{\{([^}]+)\}\}/g, (whole, expression) => {
        const [requestId, ...parts] = expression.split('.');
        if (Object.hasOwn(context, expression)) return context[expression];
        if (allowResponse && parts[0] === 'body' && responses.has(requestId)) {
          let current = responses.get(requestId);
          for (const part of parts.slice(1)) {
            const match = part.match(/^([^[]+)(?:\[(\d+)\])?$/);
            if (!match) { current = undefined; break; }
            current = current?.[match[1]];
            if (match[2] !== undefined) current = current?.[Number(match[2])];
          }
          if (current == null) { unresolved.add(whole); return whole; }
          return String(current);
        }
        if (custom.has(whole) && custom.get(whole)) return custom.get(whole);
        unresolved.add(whole);
        return whole;
      });

      const resolveJson = (value, context, unresolved) => {
        if (typeof value === 'string') {
          const exact = value.match(/^\{\{([^}]+)\}\}$/);
          if (exact) {
            const expression = exact[1];
            if (Object.hasOwn(context, expression)) return context[expression];
            const [requestId, ...parts] = expression.split('.');
            if (parts[0] === 'body' && responses.has(requestId)) {
              let current = responses.get(requestId);
              for (const part of parts.slice(1)) {
                const match = part.match(/^([^[]+)(?:\[(\d+)\])?$/);
                if (!match) { current = undefined; break; }
                current = current?.[match[1]];
                if (match[2] !== undefined) current = current?.[Number(match[2])];
              }
              if (current != null) return current;
            }
          }
          return resolve(value, context, unresolved);
        }
        if (Array.isArray(value)) return value.map((item) => resolveJson(item, context, unresolved));
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveJson(item, context, unresolved)]));
        return value;
      };

      const sendOne = async (context) => {
        const unresolved = new Set();
        const url = `${baseUrl()}${resolve(requestPath, context, unresolved)}`;
        const headers = {};
        for (const input of article.querySelectorAll('.request-header')) {
          const name = input.dataset.name;
          // Fetch가 Origin을 페이지 출처로 관리하므로 요청 정의의 임의 값은 브라우저에 넘기지 않는다.
          if (name.toLowerCase() === 'origin') continue;
          const isAuth = /^authorization$/i.test(name);
          const value = isAuth
            ? (input.value.trim() || (input.dataset.template.includes('{{') ? resolve(input.dataset.template, context, unresolved) : ''))
            : resolve(input.value || input.dataset.template, context, unresolved);
          if (value.trim()) headers[name] = value.trim();
        }
        const options = { method, headers };
        if (bodyInput && !['GET', 'HEAD'].includes(method)) {
          if (bodyInput.dataset.bodyKind === 'json') {
            try {
              options.body = JSON.stringify(resolveJson(JSON.parse(bodyInput.value), context, unresolved));
            } catch (error) {
              if (error instanceof SyntaxError) options.body = resolve(bodyInput.value, context, unresolved);
              else throw error;
            }
          } else options.body = resolve(bodyInput.value, context, unresolved);
          if (bodyInput.dataset.bodyKind === 'json' && !Object.keys(headers).some((name) => name.toLowerCase() === 'content-type')) {
            options.headers['Content-Type'] = 'application/json';
          }
        }
        if (unresolved.size) throw new Error(`먼저 값을 준비하세요: ${[...unresolved].join(', ')}`);
        const result = await fetch(url, options);
        const text = await result.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch {}
        return {
          status: `${result.status} ${result.statusText}`,
          url,
          headers: [...result.headers.entries()].map(([key, value]) => `${key}: ${value}`).join('\n'),
          body: text || '(본문 없음)', parsed,
        };
      };

      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      article.dataset.state = 'loading';
      setStatus(concurrentCount ? `${count}개 요청을 동시에 보내는 중…` : repeatCount ? `${count}개 요청을 순서대로 보내는 중…` : '요청 보내는 중…', 'loading');
      response.hidden = true;
      const requestId = article.dataset.requestId;
      responses.delete(requestId);
      for (let index = 1; index <= count; index++) responses.delete(`${requestId}#${index}`);
      try {
        let results;
        if (concurrentCount) results = await Promise.all(contexts.map(sendOne));
        else {
          results = [];
          for (const context of contexts) results.push(await sendOne(context));
        }
        const last = results.at(-1);
        results.forEach((item, index) => {
          if (item.parsed !== undefined) responses.set(`${requestId}#${index + 1}`, item.parsed);
        });
        if (last.parsed !== undefined) responses.set(requestId, last.parsed);
        const urlDisplay = article.querySelector('.postman-url');
        urlDisplay.textContent = results.map((item, index) => results.length > 1 ? `#${index + 1} ${item.url}` : item.url).join('\n');
        if (!urlDisplay.querySelector('button')) {
          const copyButton = document.createElement('button');
          copyButton.type = 'button';
          copyButton.className = 'copy-request-url';
          copyButton.textContent = 'URL 복사';
          copyButton.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(urlDisplay.dataset.resolvedUrl || urlDisplay.textContent.replace(/\n#\d+ /g, '\n'));
              status.textContent = '실행 URL을 복사했습니다.';
            } catch { status.textContent = 'URL 복사를 지원하지 않습니다. URL을 선택해 복사하세요.'; }
          });
          urlDisplay.append(copyButton);
        }
        urlDisplay.dataset.resolvedUrl = results.map((item) => item.url).join('\n');
        article.querySelector('.response-status').textContent = results.map((item, index) => `${results.length > 1 ? `#${index + 1} ` : ''}${item.status}`).join('\n');
        article.querySelector('.response-headers').textContent = results.map((item, index) => `${results.length > 1 ? `#${index + 1}\n` : ''}${item.headers || '(브라우저에서 읽을 수 있는 응답 헤더 없음)'}`).join('\n\n');
        article.querySelector('.response-body').textContent = results.length === 1 ? last.body : JSON.stringify(results.map(({ status: code, body }) => ({ status: code, body })), null, 2);
        response.hidden = false;
        response.open = true;
        article.dataset.state = 'success';
        setStatus(`${results.length}개 요청 응답을 받았습니다. 후속 요청은 마지막 응답을 참조할 수 있습니다.`, 'success');
      } catch (error) {
        article.dataset.state = 'error';
        setStatus(error.message.startsWith('먼저 값을 준비하세요:')
          ? error.message
          : `네트워크 오류: ${error.message}. 서버 실행 주소와 CORS 허용 출처를 확인하세요.`, 'error');
        response.hidden = true;
      } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    });
  });
})();
