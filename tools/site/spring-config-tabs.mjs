import { CONFIG_GROUP, withSpringConfigVariants, toPropertiesFiles } from '../course/spring-config.mjs';
const esc = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const code = (text, lang) => `<pre><code class="language-${lang}">${esc(text)}</code></pre>`;
// Markdown도 같은 변환기를 거친다. 생성된 properties 블록을 중복 렌더링하지 않는다.
export function renderSpringConfigTabs(source) {
  let count = 0;
  return withSpringConfigVariants(source).replace(CONFIG_GROUP, (_, filename, body) => {
    const yaml = body.match(/^(`{3,}|~{3,})(?:yaml|yml)\s*\n([\s\S]*?)^\1\s*$/m)?.[2].replace(/\n$/, '');
    if (yaml === undefined) throw new Error('Spring 설정 묶음에 YAML 블록이 없다');
    const { files, note } = toPropertiesFiles(yaml, filename);
    const id = `spring-config-${++count}`;
    const panel = (format, content) => `<div id="${id}-${format}-panel" role="tabpanel" aria-labelledby="${id}-${format}" tabindex="0" data-config-panel="${format}">${content}</div>`;
    return `<div id="${id}" class="spring-config" data-config-tabs data-config-file="${esc(filename)}">
<div class="spring-config-tabs" role="tablist" aria-label="Spring 설정 형식" hidden>${['yml', 'properties'].map(format => `<button type="button" id="${id}-${format}" role="tab" aria-controls="${id}-${format}-panel" aria-selected="${format === 'yml'}" tabindex="${format === 'yml' ? 0 : -1}" data-config-format="${format}">${format}</button>`).join('')}</div>
${panel('yml', `<p class="spring-config-file">${esc(filename)}</p>${code(yaml, 'yaml')}`)}
${panel('properties', `${note ? `<p class="spring-config-note">${esc(note)}</p>` : ''}${files.map(f => `<p class="spring-config-file">${esc(f.name)}</p>${code(f.content, 'properties')}`).join('')}`)}
</div>\n`;
  });
}
