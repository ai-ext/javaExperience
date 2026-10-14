import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const labels = {
  user: '사용자 화면', request: 'HTTP 요청', server: '서버', db: 'MySQL',
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

function widget(item) {
  const type = String(item.type || 'text').toLowerCase();
  const id = item.id || '';
  const label = item.label || item.title || '';
  const value = item.value ?? item.right ?? item.text ?? '';
  const focus = `data-screen-id="${esc(id)}"`;
  const heading = label ? `<span class="screen-widget-label">${esc(label)}</span>` : '';
  if (type === 'bar') return `<header class="mock-bar" ${focus}><strong>${esc(label || value)}</strong><span>${esc(item.right || '')}</span></header>`;
  if (type === 'field' || type === 'select') return `<div class="mock-control screen-${type}" ${focus}><label>${esc(label || id)}</label>${type === 'select' ? `<div class="mock-select">${esc(value)} <span aria-hidden="true">⌄</span></div>` : item.multiline ? `<div class="mock-field mock-multiline">${esc(value)}</div>` : `<div class="mock-field">${esc(value)}</div>`}</div>`;
  if (type === 'actions') {
    const buttons = (item.items || []).map((action) => `<span class="mock-button mock-${esc(action.variant || 'secondary')}" ${action.id ? `data-screen-id="${esc(action.id)}"` : ''}>${esc(action.label || action.value || '')}</span>`).join('');
    return `<div class="mock-actions" ${focus}>${buttons}</div>`;
  }
  if (type === 'chips') return `<div class="mock-chip-group" ${focus}>${heading}${(item.items || []).map((chip) => `<span class="mock-chip">${esc(valueText(chip))}</span>`).join('')}</div>`;
  if (type === 'stats' || type === 'list') {
    const items = (item.items || []).map((entry) => {
      if (entry && typeof entry === 'object') return `<div class="mock-${type}-item" ${entry.id ? `data-screen-id="${esc(entry.id)}"` : ''}><span>${esc(entry.label || entry.title || entry.name || '')}</span><strong>${esc(valueText(entry.value ?? entry.right ?? entry.text ?? ''))}</strong></div>`;
      return `<div class="mock-${type}-item"><span>${esc(valueText(entry))}</span></div>`;
    }).join('');
    return `<div class="mock-${type}" ${focus}>${heading}${items}</div>`;
  }
  if (type === 'code') return `<div class="mock-code" ${focus}>${heading}<pre>${esc(value)}</pre></div>`;
  if (type === 'toast') return `<div class="mock-toast tone-${esc(item.tone || 'neutral')}" ${focus}><span class="mock-toast-icon" aria-hidden="true">${item.tone === 'error' ? '!' : item.tone === 'success' ? '✓' : 'i'}</span><span>${esc(value)}</span></div>`;
  return `<div class="mock-copy emphasis-${esc(item.emphasis || 'body')} tone-${esc(item.tone || 'default')}" ${focus}>${esc(value)}</div>`;
}

function architectureNodes(step, context = {}) {
  if (step.kind === 'user') return ['client'];
  if (step.kind === 'request') return ['request'];
  if (step.kind === 'response') return ['response'];
  if (step.kind === 'screen') return ['screen'];
  if (step.kind === 'db') return ['mysql'];
  const text = `${step.text || ''} ${step.class || ''} ${step.target || ''} ${step.layer || ''} ${step.role || ''}`;
  const knownParts = Array.isArray(context.architecture) ? context.architecture.map((part) => typeof part === 'string' ? part : valueText(part?.name ?? part?.class ?? part?.role ?? part?.path)) : [];
  const matchedPart = knownParts.find((part) => part && text.toLowerCase().includes(part.toLowerCase()));
  const knownText = `${text} ${matchedPart || ''}`;
  const detected = [];
  if (/controller|컨트롤러/i.test(knownText)) detected.push('controller');
  if (/dto|record|request 객체|response 객체/i.test(knownText)) detected.push('dto');
  if (/service|서비스/i.test(knownText)) detected.push('service');
  if (/mybatis|mapper|매퍼/i.test(knownText)) detected.push('mybatis');
  else if (/jpa|hibernate/i.test(knownText)) detected.push('jpa');
  else if (/repository|레포지토리/i.test(knownText)) detected.push('repository');
  if (/mysql|my\s*sql|database|데이터베이스|테이블/i.test(knownText)) detected.push('mysql');
  return detected.length ? detected : ['controller'];
}

/** Studymate의 screen JSON을 로그인 없이 읽을 수 있는 정적 화면·흐름으로 그린다. */
export function renderScreen(text, context = {}) {
  const scene = JSON.parse(text);
  const widgets = (scene.screen || []).map(widget).join('');
  const stageVisual = /^[a-z0-9-]+$/.test(context.stageId || '')
    ? `<details class="stage-sketch"><summary>이 단계의 이미지 시안 보기</summary><img src="../visuals/${esc(context.stageId)}.svg" alt="${esc(scene.title || '시나리오')}의 화면 이미지 시안" loading="lazy"></details>`
    : '';
  const allNodes = [
    ['client', 'React / 화면'], ['request', 'HTTP 요청'], ['controller', 'Controller'],
    ['dto', 'DTO'], ['service', 'Service'], ['repository', 'Repository'],
    ['jpa', 'JPA'], ['mybatis', 'MyBatis'], ['mysql', 'MySQL'],
    ['response', 'HTTP 응답'], ['screen', '응답 반영'],
  ];
  const usedNodes = new Set((scene.flows || []).flatMap((flow) => (flow.steps || []).flatMap((step) => architectureNodes(step, context))));
  const nodes = allNodes.filter(([id]) => usedNodes.has(id));
  const hasDatabaseWork = usedNodes.has('mysql');
  const path = nodes.map(([id, label], index) => `<span class="flow-node" data-node="${id}" data-index="${index}"><span class="flow-node-number">${index + 1}</span>${label}</span>`).join('');
  const flows = (scene.flows || []).map((flow, flowIndex) => {
    const steps = (flow.steps || []).map((step) => {
      const title = labels[step.kind] || step.kind;
      const primary = step.text || [step.method, step.path].filter(Boolean).join(' ') || '';
      const rest = Object.entries(step).filter(([key]) => !['kind', 'text', 'method', 'path', 'focus', 'body'].includes(key))
        .map(([key, value]) => `<span class="flow-step-detail"><b>${esc(key)}</b> ${esc(valueText(value))}</span>`).join('');
      const stepNodes = architectureNodes(step, context);
      const node = stepNodes[0];
      const method = step.method ? `<span class="flow-method method-${esc(step.method.toLowerCase())}">${esc(step.method)}</span>` : '';
      const pathText = step.path ? `<code class="flow-path">${esc(step.path)}</code>` : '';
      const payload = step.body != null ? `<details class="flow-payload"><summary>본문 예시 보기</summary><pre>${esc(step.body)}</pre></details>` : '';
      return `<li><button type="button" class="flow-step" data-node="${node}" data-nodes="${stepNodes.join(' ')}" data-method="${esc(step.method || '')}" data-path="${esc(step.path || '')}" data-focus="${esc(Array.isArray(step.focus) ? step.focus.join('|') : '')}" aria-pressed="false"><span class="flow-step-meta">${method}<span class="flow-kind">${esc(title)}</span>${pathText}</span><span class="flow-step-text">${esc(primary)}</span>${rest ? `<span class="flow-step-details">${rest}</span>` : ''}</button>${payload}</li>`;
    }).join('');
    return `<details class="scenario-flow"${flowIndex === 0 ? ' open' : ''}><summary>${esc(flow.name || '흐름 보기')}<span class="scenario-flow-count">${(flow.steps || []).length}단계</span></summary><ol>${steps}</ol></details>`;
  }).join('');
  const architecture = context.architecture;
  const optional = Array.isArray(architecture) ? architecture.map((node) => `<span class="architecture-context">${esc(valueText(node))}</span>`).join('') : '';
  const dbeaver = hasDatabaseWork ? `<aside class="db-observer" aria-label="별도 데이터베이스 관찰 경로"><span class="observer-caption">API와 분리된 관찰 경로</span><span class="observer-line" aria-hidden="true">┄ ┄ ┄</span><span class="observer-tool">DBeaver / CloudBeaver</span><span class="observer-caption">직접 MySQL에 접속해 저장 결과를 조회</span></aside>` : '';
  return `<section class="scenario-preview" aria-label="화면 시나리오"><div class="scenario-mockup"><div class="mockup-topline"><span class="mockup-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>화면 미리보기</span><span class="mockup-live"><i></i> 예시</span></div><div class="scenario-display"><div class="scenario-display-heading"><div><span class="scenario-kicker">화면 상태</span><h3>${esc(scene.title || '화면')}</h3><p>${esc(scene.summary || '')}</p></div></div><div class="mock-screen" aria-label="${esc(scene.title || '화면')} 미리보기">${widgets || '<p class="mock-empty">화면 요소가 없습니다.</p>'}</div>${stageVisual}</div></div><div class="scenario-flow-panel"><div class="flow-panel-heading"><div><span class="scenario-kicker">요청의 여정</span><h4>단계를 선택해 경로 따라가기</h4></div><span class="flow-hint">빛의 이동은 이 시나리오에 적힌 예상 계층을 보여줍니다. 응답 상태는 실제 브라우저 요청 결과입니다.</span></div><div class="flow-track" aria-label="요청 처리 경로">${path}</div>${dbeaver}${optional ? `<div class="architecture-context-list" aria-label="전달된 아키텍처 정보">${optional}</div>` : ''}<p class="flow-selection-status" role="status" aria-live="polite">흐름의 한 단계를 선택하면 관련 경로를 표시합니다.</p><div class="scenario-flows">${flows}</div></div></section><script>
(() => {
  for (const preview of document.querySelectorAll('.scenario-preview:not([data-flow-ready])')) {
    preview.dataset.flowReady = 'true';
    const buttons = [...preview.querySelectorAll('.flow-step')];
    const nodes = [...preview.querySelectorAll('.flow-node')];
    const status = preview.querySelector('.flow-selection-status');
    const labels = { client: 'React / 화면', request: 'HTTP 요청', controller: 'Controller', dto: 'DTO', service: 'Service', repository: 'Repository', jpa: 'JPA', mybatis: 'MyBatis', mysql: 'MySQL', response: 'HTTP 응답', screen: '응답 반영' };
    let animation;
    const stopAnimation = () => { if (animation) clearInterval(animation); animation = null; };
    const normalize = (path) => (path || '').split('?')[0].split('/').map((part) => part.startsWith('{') || /^[0-9]+$/.test(part) ? '{}' : part).join('/');
    document.addEventListener('scenario:request', (event) => {
      const detail = event.detail || {};
      const request = buttons.find((button) => button.dataset.node === 'request' && button.dataset.method === detail.method && normalize(button.dataset.path) === normalize(detail.path));
      if (!request) return;
      stopAnimation();
      request.closest('.scenario-flow').open = true;
      const flowButtons = [...request.closest('ol').querySelectorAll('.flow-step')];
      const relevant = flowButtons.flatMap((button) => (button.dataset.nodes || button.dataset.node || '').split(' ').filter(Boolean)).filter((id) => ['client', 'request', 'controller', 'dto', 'service', 'repository', 'jpa', 'mybatis', 'mysql', 'response', 'screen'].includes(id));
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button === request)));
      nodes.forEach((node) => node.classList.remove('is-active', 'is-past', 'is-expected', 'is-error'));
      if (detail.phase === 'start') {
        const routeNodes = [...new Set(relevant)].filter((id) => !['client', 'screen', 'response'].includes(id));
        let index = 0;
        const activate = (nodeId) => {
          nodes.forEach((node) => {
            const nodeIndex = routeNodes.indexOf(node.dataset.node);
            node.classList.toggle('is-past', nodeIndex >= 0 && nodeIndex < routeNodes.indexOf(nodeId));
            node.classList.toggle('is-expected', node.dataset.node === nodeId);
            node.classList.toggle('is-active', node.dataset.node === nodeId);
          });
        };
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches && routeNodes.length) {
          activate(routeNodes[0]);
          animation = setInterval(() => { index = (index + 1) % routeNodes.length; activate(routeNodes[index]); }, 620);
        } else {
          nodes.find((node) => node.dataset.node === 'request')?.classList.add('is-active');
        }
        status.textContent = '실제 HTTP 요청 전송 중 · 빛의 이동은 설계된 계층 순서이며 서버 내부 계측은 아닙니다.';
      } else {
        nodes.forEach((node) => node.classList.remove('is-expected', 'is-active'));
        const failed = detail.phase === 'http-error' || detail.phase === 'error';
        preview.querySelector('[data-node="response"]')?.classList.add(failed ? 'is-error' : 'is-active');
        status.textContent = detail.phase === 'error'
          ? '네트워크 요청 실패 · ' + (detail.message || '서버 주소와 요청 값을 확인하세요.')
          : (failed ? '실제 HTTP 오류 응답 ' : '실제 HTTP 응답 ') + (detail.status || '') + ' · 내부 경로는 시나리오에 적힌 구현 예시이며 서버 실행 추적은 아닙니다.';
      }
    });
    buttons.forEach((button) => button.addEventListener('click', () => {
      stopAnimation();
      const selectedNodes = (button.dataset.nodes || button.dataset.node || '').split(' ').filter(Boolean);
      const selected = selectedNodes[0];
      buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      nodes.forEach((node) => {
        const active = selectedNodes.includes(node.dataset.node);
        node.classList.toggle('is-active', active);
        node.classList.toggle('is-past', false);
      });
      preview.querySelectorAll('[data-screen-id]').forEach((item) => item.classList.remove('is-focus'));
      for (const id of (button.dataset.focus || '').split('|').filter(Boolean)) {
        preview.querySelectorAll('[data-screen-id]').forEach((item) => { if (item.dataset.screenId === id) item.classList.add('is-focus'); });
      }
      status.textContent = labels[selected] + ' 단계 · ' + button.querySelector('.flow-step-text').textContent.trim();
    }));
  }
})();
</script>`;
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
