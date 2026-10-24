// 학습용 Spring 설정 변환을 한곳에서 수행한다. 외부 패키지는 필요 없다.
// 맵·배열·단일행 스칼라만 지원한다. 앵커·태그·플로 맵·
// 여러 행 스칼라는 오변환을 피하기 위해 빌드 오류로 처리한다.
const PROFILE = 'spring.config.activate.on-profile';
export const DIFF_NOTE = 'properties를 쓰면 같은 키를 `key=value`로 옮긴다. 목록은 `key[0]=value`로 적는다.';

// 따옴표·자리표시자 안의 구분자는 구조로 해석하지 않는다.
function delimiters(text, separator) {
  let quote = '', depth = 0;
  const positions = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (quote === '"' && c === '\\') { i++; continue; }
      if (c === quote) {
        if (quote === "'" && text[i + 1] === "'") { i++; continue; }
        quote = '';
      }
      continue;
    }
    if ((c === '"' || c === "'") && (i === 0 || /[\s\[:,]/.test(text[i - 1]))) { quote = c; continue; }
    if (c === '$' && text[i + 1] === '{') { depth++; i++; continue; }
    if (c === '}' && depth) { depth--; continue; }
    if (c === '[') { depth++; continue; }
    if (c === ']') { depth--; continue; }
    if (!depth && c === separator && (separator !== ':' || i + 1 === text.length || /\s/.test(text[i + 1]))) positions.push(i);
    if (!depth && c === '#' && (i === 0 || /\s/.test(text[i - 1]))) break;
  }
  if (quote || depth) throw new Error(`닫히지 않은 따옴표·목록·자리표시자: ${text}`);
  return positions;
}
function withoutComment(text) {
  const at = delimiters(text, '#')[0];
  return (at === undefined ? text : text.slice(0, at)).trimEnd();
}
function scalar(raw) {
  const text = withoutComment(raw).trim();
  if (text.startsWith('[')) {
    if (!text.endsWith(']')) throw new Error(`잘못된 목록: ${text}`);
    const body = text.slice(1, -1);
    if (!body.trim()) return [];
    const cuts = [-1, ...delimiters(body, ','), body.length];
    return cuts.slice(1).map((end, i) => scalar(body.slice(cuts[i] + 1, end)));
  }
  if (/^[&*!{|>]/.test(text) || /^<<\s*:/.test(text)) throw new Error(`지원하지 않는 YAML 문법: ${text}`);
  if (text.startsWith('"')) return JSON.parse(text);
  if (text.startsWith("'")) {
    if (!text.endsWith("'")) throw new Error('닫히지 않은 문자열');
    return text.slice(1, -1).replace(/''/g, "'");
  }
  if (/^(null|~)$/i.test(text)) return '';
  return text;
}
function parseDocument(source) {
  const lines = source.split('\n').flatMap((raw, i) => {
    if (/^\s*\t/.test(raw)) throw new Error(`YAML ${i + 1}행: 탭 들여쓰기`);
    const text = withoutComment(raw.trimStart());
    if (!text.trim() || text === '...') return [];
    return [{ indent: raw.length - raw.trimStart().length, text }];
  });
  let at = 0;
  const pair = (text) => {
    const colon = delimiters(text, ':')[0];
    if (colon === undefined) throw new Error(`키와 값이 필요하다: ${text}`);
    const key = scalar(text.slice(0, colon));
    if (typeof key !== 'string' || !key || key === '<<') throw new Error('지원하지 않는 YAML 키');
    return [key, text.slice(colon + 1).trim()];
  };
  function block(indent) {
    const list = /^-(?:\s|$)/.test(lines[at]?.text ?? '');
    const result = list ? [] : new Map();
    const add = (map, key, raw, parentIndent) => {
      if (map.has(key)) throw new Error(`중복 YAML 키: ${key}`);
      if (raw) map.set(key, scalar(raw));
      else if (lines[at]?.indent > parentIndent) map.set(key, block(lines[at].indent));
      else map.set(key, '');
    };
    while (at < lines.length && lines[at].indent === indent) {
      const line = lines[at++];
      if (list) {
        if (!/^-(?:\s|$)/.test(line.text)) throw new Error('목록과 맵의 혼용');
        const value = line.text.slice(1).trimStart();
        if (!value) result.push(lines[at]?.indent > indent ? block(lines[at].indent) : '');
        else if (delimiters(value, ':').length) {
          const item = new Map();
          const [key, raw] = pair(value);
          const itemIndent = indent + 2;
          add(item, key, raw, itemIndent);
          if (lines[at]?.indent === itemIndent) {
            const rest = block(itemIndent);
            if (!(rest instanceof Map)) throw new Error('객체 목록의 키가 필요하다');
            for (const [k, v] of rest) {
              if (item.has(k)) throw new Error(`중복 YAML 키: ${k}`);
              item.set(k, v);
            }
          }
          result.push(item);
        } else result.push(scalar(value));
      } else {
        const [key, raw] = pair(line.text);
        add(result, key, raw, indent);
      }
      if (lines[at]?.indent > indent) throw new Error(`잘못된 들여쓰기: ${lines[at].text}`);
    }
    return result;
  }
  if (!lines.length) return new Map();
  if (lines[0].indent !== 0) throw new Error('최상위 설정은 들여쓰지 않는다');
  const result = block(0);
  if (at !== lines.length || !(result instanceof Map)) throw new Error('Spring 설정의 최상위는 키·값이어야 한다');
  return result;
}
function flatten(node, prefix = '', out = new Map()) {
  if (node instanceof Map) for (const [key, value] of node) flatten(value, prefix ? `${prefix}.${key}` : key, out);
  else if (Array.isArray(node)) node.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  else {
    if (out.has(prefix)) throw new Error(`겹치는 properties 키: ${prefix}`);
    out.set(prefix, node);
  }
  return out;
}
function escapeValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\f/g, '\\f').replace(/^ /, '\\ ');
}
function properties(entries) {
  return [...entries].map(([key, value]) => `${key.replace(/[\\\s:=#!]/g, c => /\s/.test(c) ? '\\ ' : `\\${c}`)}=${escapeValue(value)}`).join('\n');
}
export function toPropertiesFiles(yaml, filename = 'application.yml') {
  const name = filename.split('/').at(-1).replace(/\.ya?ml$/, '.properties');
  const documents = yaml.replace(/\r\n/g, '\n').split(/^---\s*(?:#.*)?$/m).filter(s => s.trim()).map(s => flatten(parseDocument(s)));
  const profiles = documents.map(d => d.get(PROFILE));
  const canSplit = name === 'application.properties' && !profiles[0] && profiles.slice(1).every(p => /^[a-zA-Z0-9_-]+$/.test(p ?? '')) && new Set(profiles).size === profiles.length;
  let files, note = '';
  if (documents.length > 1 && canSplit) {
    files = documents.map((d, i) => {
      const entries = new Map(d); entries.delete(PROFILE);
      return { name: i ? `application-${profiles[i]}.properties` : name, content: properties(entries) };
    });
    note = 'properties는 프로파일별 파일(application-local.properties 등)로 나눈다. 해당 프로파일을 활성화하면 기본 파일에 덮어쓴다. 같은 위치의 YAML과 properties를 동시에 두지 말고 한 형식만 사용한다.';
  } else {
    files = [{ name, content: documents.map(properties).join('\n#---\n') }];
    if (documents.length > 1) note = '복합 프로파일 표현식·중복 프로파일·기본 문서의 적용 순서를 보존하기 위해 Spring Boot의 properties 다중 문서 구분자 #---를 사용한다. 단순한 프로파일은 application-local.properties 같은 프로파일별 파일로 나눌 수 있다.';
  }
  if (documents.some(d => [...d.keys()].some(k => k.includes('[')))) note += `${note ? ' ' : ''}목록은 [0]부터 인덱스를 붙인다. 객체 목록도 같은 프로파일 파일 안에 키별로 둔다. 프로파일별 목록은 병합되지 않고 교체된다.`;
  return { files, note };
}
export function isSpringYaml(text) {
  return /^(?:spring|server|management|board|logging|mybatis|security)(?:\s*:|\.[^\n]*:)/m.test(text) && !/^services\s*:/m.test(text);
}
const FENCE = /^([ \t]*)(`{3,}|~{3,})([^\n]*)\n([\s\S]*?)^\1\2[ \t]*$/gm;
export const CONFIG_GROUP = /<!-- spring-config:start ([^\n]+) -->\n([\s\S]*?)\n<!-- spring-config:end -->/g;
export function withSpringConfigVariants(markdown) {
  // 이미 생성한 묶음은 보관해 중복 생성을 피한다.
  const groups = [];
  let source = markdown.replace(CONFIG_GROUP, group => `\u0000CONFIG${groups.push(group) - 1}\u0000`);
  let lastFile = 'application.yml';
  let cursor = 0;
  source = source.replace(FENCE, (block, indent, tick, info, text, offset) => {
    const before = source.slice(cursor, offset);
    const mentions = [...before.matchAll(/(?:[\w./-]*\/)?(application(?:-[\w-]+)?\.ya?ml)\b/g)];
    if (mentions.length) lastFile = mentions.at(-1)[1];
    cursor = offset + block.length;
    if (/^diff\b/.test(info) && (/application[^\s]*\.ya?ml/.test(text) || isSpringYaml(text.replace(/^[+ -]/gm, '')))) return source.slice(cursor).trimStart().startsWith(DIFF_NOTE) ? block : `${block}\n\n${DIFF_NOTE}`;
    if (!/^(?:yaml|yml)\s*$/.test(info) || !isSpringYaml(text)) return block;
    const variant = toPropertiesFiles(text, lastFile);
    const props = variant.files.map(f => `**${f.name}**\n\n${tick}properties\n${f.content}\n${tick}`).join('\n\n');
    return `<!-- spring-config:start ${lastFile} -->\n${block}\n\n${variant.note ? variant.note + '\n\n' : ''}${props}\n<!-- spring-config:end -->`;
  });
  // 코드 펜스와 링크 경로는 보존하고 본문의 설정 파일 안내만 보충한다.
  const code = [];
  source = source.replace(FENCE, block => `\u0000CODE${code.push(block) - 1}\u0000`);
  source = source.replace(/`([^`\n]*\bapplication(?:-[\w{}-]+)?\.ya?ml)`(?!\(또는 )/g, (_, file) => `\`${file}\`(또는 \`${file.replace(/\.ya?ml$/, '.properties')}\`)`);
  source = source.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => code[i]);
  source = source.replace(/\u0000CONFIG(\d+)\u0000/g, (_, i) => groups[i]);
  return source;
}
