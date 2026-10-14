import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const labels = {
  user: '사용자', request: 'HTTP 요청', server: '서버', db: 'DB',
  response: 'HTTP 응답', screen: '화면',
};

function valueText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(valueText).join(' · ');
  if (typeof value === 'object') {
    const chosen = value.label ?? value.title ?? value.value ?? value.name;
    return chosen == null ? JSON.stringify(value) : valueText(chosen);
  }
  return String(value);
}

/** Studymate의 screen JSON을 로그인 없이 읽을 수 있는 정적 화면·흐름으로 그린다. */
export function renderScreen(text) {
  const scene = JSON.parse(text);
  const widgets = (scene.screen || []).map((item) => {
    const label = item.label || item.title || item.type;
    const value = item.value ?? item.right ?? item.text ?? item.items ?? '';
    return `<div class="screen-widget screen-${esc(item.type)}"><strong>${esc(label)}</strong><span>${esc(valueText(value))}</span></div>`;
  }).join('');
  const flows = (scene.flows || []).map((flow) => {
    const steps = (flow.steps || []).map((step) => {
      const title = labels[step.kind] || step.kind;
      const primary = step.text || [step.method, step.path].filter(Boolean).join(' ') || '';
      const rest = Object.entries(step).filter(([key]) => !['kind', 'text', 'method', 'path', 'focus'].includes(key))
        .map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(valueText(value))}</dd>`).join('');
      return `<li><span class="flow-kind">${esc(title)}</span><p>${esc(primary)}</p>${rest ? `<dl>${rest}</dl>` : ''}</li>`;
    }).join('');
    return `<details class="scenario-flow"><summary>${esc(flow.name || '흐름 보기')}</summary><ol>${steps}</ol></details>`;
  }).join('');
  return `<section class="scenario-preview" aria-label="화면 시나리오"><div class="scenario-display"><h3>${esc(scene.title || '화면')}</h3><p>${esc(scene.summary || '')}</p><div class="screen-widgets">${widgets}</div></div><div class="scenario-flows">${flows}</div></section>`;
}

function roleOf(file) {
  const name = path.basename(file.path);
  if (file.path.startsWith('src/test/') || /Tests?\.java$/.test(name)) return '테스트';
  if (name.endsWith('.sql')) return 'DB / SQL';
  if (name.endsWith('.xml')) return 'MyBatis / XML';
  if (/Mapper\.java$/.test(name)) return 'MyBatis / Mapper';
  if (/Scheduler\.java$/.test(name)) return 'Scheduler / 배치';
  if (/Controller/.test(name)) return 'Controller / 요청';
  if (/Request|Response|Dto|DTO|Row|Projection|Condition|Query/.test(name) && name.endsWith('.java')) return 'DTO';
  if (/Service|Policy|Validator|Gate/.test(name)) return 'Service / 규칙';
  if (/Repository/.test(name)) return 'Repository / DB 접근';
  if (/\.java$/.test(name) && /@(?:Entity|Embeddable|MappedSuperclass)\b/.test(file.content)) return 'Entity';
  if (/Config\.java$/.test(name)) return '설정';
  if (name.endsWith('.java')) return 'Java / 보조 코드';
  return '설정 / 기타';
}

function codeFiles(files) {
  return files.map((file) => {
    const title = `${roleOf(file)} — ${file.path}`;
    const code = file.status === 'deleted'
      ? '<p>이 단계에서 삭제한 파일이다.</p>'
      : `<pre><code>${esc(file.content)}</code></pre>`;
    return `<details class="code-file"><summary>${esc(title)}</summary>${code}</details>`;
  }).join('\n');
}

export function withImplementationCode(md, root, id, pagePath) {
  const answerPath = path.join(root, 'scenario/answers', `${id}.json`);
  if (!fs.existsSync(answerPath)) throw new Error(`정답 코드가 없습니다: ${id}`);
  const answer = JSON.parse(fs.readFileSync(answerPath, 'utf8'));
  if (answer.id !== id) throw new Error(`정답 단계가 다릅니다: ${id}`);
  let code = `## 전체 구현 코드\n\n### 이 단계에서 바뀐 파일\n\n이 단계에서 변경된 파일의 전문입니다.\n\n${codeFiles(answer.files)}`;
  if (pagePath) {
    const snapshotPath = path.relative(path.dirname(pagePath), path.join(root, 'scenario/snapshots', `${id}.json`)).split(path.sep).join('/');
    code += `\n\n### 현재 전체 코드\n\n현재 시나리오의 전체 구현입니다. 역할을 펼친 뒤 파일을 열어 전문을 불러오세요.\n\n<details class="cumulative-code" data-snapshot-url="${esc(snapshotPath)}"><summary>현재 전체 코드 불러오기</summary><p class="snapshot-status" role="status" aria-live="polite">열면 코드 목록을 불러옵니다.</p><div class="snapshot-content"></div></details>`;
  }
  const mybatis = path.join(root, 'scenario/alternatives/mybatis', `${id}.json`);
  if (fs.existsSync(mybatis)) {
    const alternative = JSON.parse(fs.readFileSync(mybatis, 'utf8'));
    code += `\n\n## MyBatis 대체 구현 코드\n\n기본 JPA 구현과 같은 HTTP 계약을 지키는 선택 경로입니다.\n\n${codeFiles(alternative.files)}`;
  }
  if (id === '9-5') {
    const phases = [
      ['9-5-v5.json', '1. JPA — V5·memo 읽기·양쪽 쓰기'],
      ['9-5-v5-mybatis.json', '1. MyBatis — V5·양쪽 쓰기'],
      ['9-5-note-read.json', '2. JPA — V6·note 읽기'],
      ['9-5-note-read-mybatis.json', '2. MyBatis — note 읽기'],
      ['9-5-note-only.json', '3. JPA·MyBatis — note 전용'],
      ['9-5-v7-drop.json', '4. DB — 마지막 서버 교체 뒤 memo 삭제'],
    ];
    code += '\n\n## 배포 단계별 구현 코드\n\n각 시점의 코드를 순서대로 확인하세요.';
    for (const [name, title] of phases) {
      const phase = JSON.parse(fs.readFileSync(path.join(root, 'scenario/alternatives/transitions', name), 'utf8'));
      code += `\n\n### ${title}\n\n${codeFiles(phase.files)}`;
    }
  }
  const marker = '## 직접 확인';
  const at = md.indexOf(marker);
  if (at < 0) throw new Error(`직접 확인 절이 없습니다: ${id}`);
  return md.slice(0, at) + code + '\n\n' + md.slice(at);
}
