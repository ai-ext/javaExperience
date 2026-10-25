// 기능 과제의 정적 HTML. 원문과 학생 서버 소스는 변경하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FUNCTIONAL_TASKS, FUNCTIONAL_TASK_BY_ID, FUNCTIONAL_CONTRACT } from './functional-scenario-data.mjs';
import { readFunctionalCodeFile } from './functional-code.mjs';
import { renderFunctionalRuntimeVisual } from './functional-runtime-visual.mjs';
import { renderFunctionalQueryVisual } from './functional-query-visual.mjs';
import { renderFunctionalNewPostFocus } from './functional-new-post-focus.mjs';
import { FUNCTIONAL_LIKE_TASKS } from './functional-like-data.mjs';
import { renderFunctionalProjectContext } from './functional-project-context.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const shortTitles = { create: '작성', detail: '상세 조회', list: '목록 조회', update: '부분 수정', delete: '삭제' };
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const list = (items, className = '') => `<ul${className ? ` class="${className}"` : ''}>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
const pre = (text, lang = '') => `<pre><code${lang ? ` class="language-${esc(lang)}"` : ''}>${esc(text)}</code></pre>`;
const json = value => JSON.stringify(value, null, 2);
const payload = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const href = (rootPrefix, source, anchor = '', query = '') => esc(rootPrefix + source.replace(/\.md$/, '.html') + (query ? '?' + query : '') + (anchor ? '#' + anchor : ''));
const taskHref = (task, rootPrefix) => href(rootPrefix, task.sourcePath);

// 원문 본문은 유지하고, 공개 과제 ID로 들어온 참고 읽기에만 맥락을 표시한다.
export function renderFunctionalReferenceContext({ rootPrefix, sourcePath, legacyPaths, knowledgePaths }) {
  const pagePath = sourcePath.replace(/\.md$/, '.html');
  const isLegacy = legacyPaths.includes(pagePath);
  if (!isLegacy && !knowledgePaths.includes(pagePath)) return '';
  const data = {
    version: 1, pagePath, rootHref: rootPrefix + 'index.html', legacyPaths, knowledgePaths,
    tasks: [...FUNCTIONAL_TASKS, ...FUNCTIONAL_LIKE_TASKS].map(task => ({
      id: 'flow-' + task.id, title: task.title, api: task.api,
      href: task.sourcePath.replace(/\.md$/, '.html'),
    })),
  };
  const context = isLegacy ? `<aside class="functional-reference-context" data-frc-root hidden aria-label="현재 기능 과제의 참고자료"><p class="frc-kicker">참고자료 읽는 중</p><p class="frc-task-line"><span>현재 과제 · <strong data-frc-task></strong></span><span class="frc-api"><b data-frc-method></b> <code data-frc-api></code></span></p><a class="frc-open" data-frc-open target="_blank" rel="noopener noreferrer">현재 과제 열기 ↗</a><p class="frc-notice">이 문서는 다른 단계의 설명입니다. 원리는 이 자료에서, 이번 구현 범위는 현재 과제에서 확인하세요.</p></aside>` : '';
  return context + `<script type="application/json" data-frc-data>${payload(data)}</script>`;
}

function methodCode(task, taskId) {
  const source = readFunctionalCodeFile(task.target.path, { taskId });
  const lines = source.split('\n');
  const start = lines.findIndex(line => new RegExp(`^\\s*public\\s+.*\\s${task.target.symbol}\\(`).test(line));
  if (start < 0) throw new Error(`시작 코드에 메서드가 없습니다: ${task.target.symbol}`);
  let depth = 0, opened = false, end = start;
  for (; end < lines.length; end++) {
    for (const char of lines[end]) {
      if (char === '{') { depth++; opened = true; }
      if (char === '}') depth--;
    }
    if (opened && depth === 0) break;
  }
  const first = lines[start - 1]?.trim().startsWith('@') ? start - 1 : start;
  return lines.slice(first, end + 1).map(line => line.replace(/^    /, '')).join('\n');
}

function imageAsset(task, assets) {
  let candidate;
  if (Object.hasOwn(assets, task.id)) candidate = assets[task.id];

  if (typeof candidate !== 'string' || path.isAbsolute(candidate) || candidate.split('/').includes('..')
      || /^F\d+-/i.test(path.posix.basename(candidate)) || !/\.(png|jpe?g|webp|avif|gif)$/i.test(candidate)) return null;
  const absolute = path.resolve(root, candidate);
  return absolute.startsWith(root + path.sep) && fs.existsSync(absolute) && fs.statSync(absolute).isFile() ? candidate : null;
}

function navigation(task, rootPrefix) {
  return `<nav class="fw-nav" aria-label="게시글 기능 과제"><a class="fw-nav-heading" href="${href(rootPrefix, 'scenario/flow/README.md')}">게시글 기능</a><ol>${FUNCTIONAL_TASKS.map(item => `<li><a class="fw-task-link" href="${taskHref(item, rootPrefix)}"${task?.id === item.id ? ' aria-current="page"' : ''}><span class="fw-task-number">${item.order}</span>${shortTitles[item.id]}</a></li>`).join('')}</ol><a class="fw-preparation-link" href="${href(rootPrefix, 'scenario/README.md', 'legacy-scenarios')}">선택 준비자료 · 기존 전체 시나리오</a></nav>`;
}

function renderStates(task) {
  const lanes = [['code', '지금 실행하는 코드'], ['object', 'Java 객체 값'], ['context', '영속성 컨텍스트'], ['sql', 'SQL · 트랜잭션'], ['database', '앱 트랜잭션의 DB 상태'], ['observer', '별도 DB 클라이언트 관찰']];
  const options = { viewCount: ['create', 'detail'].includes(task.id) ? 0 : 1 };
  const renderNative = ['create', 'detail', 'delete'].includes(task.id) ? renderFunctionalRuntimeVisual : renderFunctionalQueryVisual;
  const multiple = task.visualization.states.length > 1;
  const tabs = multiple ? `<div class="fw-state-tabs" role="tablist" aria-label="예상 상태 비교">${task.visualization.states.map(state => {
    const selected = state.id === task.visualization.initialState;
    return `<button type="button" role="tab" id="fw-tab-${state.id}" data-fw-state="${state.id}" aria-controls="fw-panel-${state.id}" aria-selected="${selected}" tabindex="${selected ? 0 : -1}">${esc(state.title)}</button>`;
  }).join('')}</div>` : '';
  return `${tabs}${task.visualization.states.map(state => `<div class="fw-state-panel" id="fw-panel-${state.id}"${multiple ? ` role="tabpanel" aria-labelledby="fw-tab-${state.id}" tabindex="0"` : ''} data-fw-state-panel="${state.id}"${state.id === task.visualization.initialState ? '' : ' hidden'}><p class="fw-state-summary">${esc(state.summary)}</p>${state.branch ? `<p class="fw-branch">${esc(task.visualization.states.find(item => item.id === state.branch)?.title || state.branch)}에서 갈라지는 별도 결과입니다.</p>` : ''}${renderNative({ taskId: task.id, stateId: state.id, options, idPrefix: `fw-model-${task.id}-${state.id}` })}<details class="fw-state-explanation"><summary>${task.id === 'update' ? '기본 제목 요청 예시 · 코드·SQL·관찰 설명' : '코드·SQL·관찰 설명 자세히'}</summary><div class="fw-state-grid">${lanes.map(([key, title]) => `<section class="fw-lane fw-lane-${key}"><h3>${title}</h3>${key === 'code' || key === 'sql' ? pre(state[key].join('\n'), key === 'code' ? 'java' : 'sql') : list(state[key])}</section>`).join('')}</div>${state.changes.length ? `<p class="fw-changes"><strong>관찰할 변화</strong> ${esc(state.changes.join(' · '))}</p>` : ''}</details></div>`).join('')}`;
}

function renderVisual(task, image, rootPrefix) {
  const overviewId = `fw-overview-${task.id}`;
  const compareId = `fw-compare-${task.id}`;
  const overviewTabId = `fw-view-overview-${task.id}`;
  const compareTabId = `fw-view-compare-${task.id}`;
  const visualTitle = task.id === 'create' ? '저장되는 값을 연결해서 보기'
    : task.id === 'list' ? '목록 조건과 페이지 비교하기' : '같은 글의 값과 동작 비교하기';
  const assumption = task.id === 'detail'
    ? '설명용 연속 사례: 작성 직후 조회수 v=0으로 시작합니다. 조회 허용 분기는 0→1, 404 분기는 0 유지를 비교하며 실제 DB 관측값이 아닙니다.'
    : ['update', 'delete'].includes(task.id)
      ? '설명용 연속 사례: 상세 조회를 한 번 마친 뒤 viewCount=1을 유지한다고 가정합니다. 아래 기호와 시각은 실제 DB 관측값이 아닙니다.'
      : '';
  return `<section class="fw-visual" data-fw-visual aria-labelledby="fw-visual-title"><div class="fw-section-heading"><h2 id="fw-visual-title">${esc(visualTitle)}</h2><span class="fw-badge">실행 전 기대 · 설명용</span></div>${image ? `<div class="fw-view-tabs" role="tablist" data-fw-views aria-label="학습 시각 자료 보기"><button type="button" role="tab" id="${overviewTabId}" data-fw-view="overview" aria-controls="${overviewId}" aria-selected="true" tabindex="0">전체 흐름 그림</button><button type="button" role="tab" id="${compareTabId}" data-fw-view="compare" aria-controls="${compareId}" aria-selected="false" tabindex="-1">값 직접 비교</button></div>` : ''}<p class="fw-visual-notice">설명용 예시 · 실제 요청은 전송하지 않습니다.</p>${image ? `<div class="fw-overview" id="${overviewId}" data-fw-overview role="tabpanel" aria-labelledby="${overviewTabId}">${renderImage(task, image, rootPrefix)}</div>` : ''}<div class="fw-compare" id="${compareId}" data-fw-compare role="tabpanel" aria-labelledby="${image ? compareTabId : 'fw-visual-title'}"${image ? ' hidden' : ''}>${assumption ? `<p class="fw-model-assumption">${esc(assumption)}</p>` : ''}${renderStates(task)}</div><details class="fw-visual-reference"><summary>예시의 가정·SQL 표시 기준</summary><p>${esc(task.visualization.disclaimer)}${task.id === 'update' ? ' 상태 설명은 기본 제목·tags=[] 예시이며, 다른 PATCH 요청은 아래 모델에서 따로 비교합니다.' : ''} ${task.visualization.states.length > 1 ? '상태는 선택 비교용이며 필수 진행 단계가 아닙니다.' : '조건 변경은 실제 요청이나 학습 진도를 바꾸지 않습니다.'}</p></details></section>`;
}

function renderSetup(task, rootPrefix) {
  const command = text => `<pre tabindex="0"><code>${esc(text)}</code></pre>`;
  const docHref = rootPrefix + task.sourcePath.replace(/\.md$/, '.html');
  return `<details class="fw-starting-state" id="functional-setup"><summary>실행 준비 확인 · 처음 시작과 이어서 학습</summary>
    <p><strong>이미 앞 과제를 구현했다면 같은 프로젝트·서버·DB에서 이어갑니다.</strong> 이번에는 ${esc(task.target.symbol)} 메서드 본문만 구현하고, 다음 ZIP을 덮어쓰거나 새 폴더에서 DB를 다시 만들지 않습니다. DB와 Compose는 처음 준비한 한 폴더에서 계속 관리합니다.</p>
    <p>아래는 snapshot으로 만든 <strong>별도 교육용 패키지</strong>의 설정입니다. 저장소 루트의 학생용 <code>src/main/resources/application.yml</code>과 다를 수 있습니다. 준비물은 JDK 21·Docker 런타임·터미널이며, 명령은 압축을 푼 프로젝트 루트에서 실행합니다. 각 명령 블록의 글자를 선택해 복사할 수 있습니다.</p>
    <section class="fw-doc-server"><h3>실제 요청을 보내는 학습 화면 열기</h3><p>이미 HTTP 주소로 이 화면을 열었다면 그대로 사용하세요. <code>file://</code>로 열었을 때만, 학습 HTML이 있는 javaExperience 저장소 루트에서 아래 명령을 실행하세요. ZIP을 푼 starter 폴더와는 다릅니다.</p>${command('python3 -m http.server 3000 --bind 127.0.0.1')}<p><a href="${esc(docHref)}">현재 학습 화면 열기</a>. 문서 서버는 학습 HTML을 제공하고, 요청을 받는 백엔드 앱 <code>http://localhost:8080</code>과 다릅니다. 앱·DB는 아래 안내대로 별도 starter 폴더에서 실행합니다. 이 안내는 서버를 자동 실행하거나 연결 완료를 판정하지 않습니다.</p></section>
    <ol class="fw-setup-steps">
      <li class="fw-setup-step"><h3>새로 시작하거나 중간 합류할 때만 · ZIP과 IDE</h3><p><a href="${esc(rootPrefix + task.packagePath)}" download>이 과제의 시작 ZIP 받기</a>를 별도의 새 학습 폴더에 풀고 IntelliJ에서 Gradle 프로젝트로 엽니다. 기존 학생 코드 위에 풀지 않습니다. JDK 출력이 21인지 직접 확인합니다.</p>${command('java -version\nchmod +x gradlew')}<p>명령은 macOS/Linux 기준입니다. Windows에서는 <code>chmod</code> 없이 <code>./gradlew</code> 대신 <code>gradlew.bat</code>를 씁니다. 자세한 준비 방법은 ZIP의 <code>README-LEARNING.md</code>에 있습니다.</p></li>
      <li class="fw-setup-step"><h3>DB가 처음인 경우만 · 처음 준비한 DB 폴더에서</h3><p>이미 이 학습용 community DB가 실행 중이면 그대로 사용하고 Compose를 다시 올리지 않습니다. 처음 준비할 때만 Docker 런타임에서 실행합니다.</p>${command('DB_PORT=13308 docker compose up -d mysql\ndocker compose ps mysql')}<p>출력에서 mysql이 <code>healthy</code>인지 직접 확인합니다. 준비되지 않으면 같은 폴더의 <code>docker compose logs mysql</code>로 원인을 확인합니다. 기본 접속은 <code>localhost:13308</code>의 <code>community</code> DB, 계정은 <code>community / community</code>입니다. 기존 DB 데이터는 보존합니다.</p></li>
      <li class="fw-setup-step"><h3>컴파일한 뒤 서버 실행</h3>${command('./gradlew compileJava\n./gradlew bootRun')}<p><code>bootRun</code> 터미널은 켜 둡니다. 기본 서버 주소는 <code>http://localhost:8080</code>입니다. 코드 수정 후에는 자동 반영되지 않습니다. 실행 중인 <code>bootRun</code> 터미널에서 <code>Ctrl+C</code>로 앱만 종료하고, 같은 프로젝트 폴더에서 <code>./gradlew bootRun</code>을 다시 실행합니다. DB·Compose·작성 응답 id는 유지하며, 서버 주소도 그대로 사용합니다. DB 포트를 바꿨다면 앱의 datasource URL도 같은 포트로 지정하는 방법을 ZIP의 README에서 확인하세요.</p></li>
      <li class="fw-setup-step"><h3>다른 터미널에서 연결 확인 · 연습 토큰 준비</h3>${command('curl -i http://localhost:8080/api/start/ping')}<p>직접 받은 본문이 <code>pong</code>인지 확인합니다. ping은 서버 연결 확인이며 CRUD 메서드 구현 통과를 뜻하지 않습니다. 쓰기 요청의 공개 fixture 토큰 예시는 <code>tok-kimjava</code>이며, community DB의 김자바 회원으로 <code>dev</code> 게시판에 작성할 때 사용합니다. DB 접속 계정과 다릅니다.</p>${command('Authorization: Bearer tok-kimjava')}<p>토큰은 <a href="#fw-request">요청 폼</a>에 직접 입력하고, 구현을 마친 뒤 전송 버튼으로 요청하세요. 이 안내는 명령·토큰을 자동 실행하거나 입력하지 않습니다. 아직 미구현인 메서드의 실패는 서버 준비 완료나 기능 완성을 증명하지 않습니다.</p></li>
    </ol>
    <details><summary>이번 메서드와 이미 제공된 기반</summary>${list(task.startingState.provided)}<p>${esc(task.startingState.learnerWork)}</p><p>${esc(task.id === 'create' ? task.startingState.note.replace('ZIP은 중간 합류용', '작성 ZIP은 첫 준비·중간 합류용') : task.startingState.note)}</p></details>
    <p>패키지 컴파일 검사는 서버·DB의 실제 실행을 증명하지 않습니다. 이 화면에서 JDK·DB·서버의 실행 여부를 자동 판정하지 않습니다.</p>
  </details>`;
}

function renderImage(task, image, rootPrefix) {
  if (!image) return '';
  const url = esc(rootPrefix + image);
  return `<figure class="fw-image"><a class="fw-image-open" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${esc(task.title)} 학습 이미지 원본 크게 보기 · 새 탭"><img src="${url}" width="1536" height="1024" alt="${esc(task.title)}의 요청·객체·SQL·DB 흐름 학습 이미지" loading="lazy"><span>원본 크게 보기 · 새 탭 ↗</span></a><figcaption class="fw-image-legend">요청 → Java 객체 → SQL·트랜잭션 → MySQL 행을 연결해 봅니다. 별도 DB 클라이언트는 요청 경로 밖의 관찰 도구입니다. 작은 화면에서 글자가 작으면 원본을 열어 확대하세요. SQL은 변경 의미를 나타낸 예시이며 실제 실행 로그·전체 열 목록이 아닙니다. 아래에서 정본 기반 상태와 값을 비교할 수 있습니다.</figcaption></figure>`;
}


function renderDbChecks(task) {
  return task.expected.dbChecks.map(item => {
    const code = pre(item.sql, 'sql');
    const query = item.sql.split('\n').length > 10
      ? `<details><summary>조회 SQL 펼치기</summary>${code}</details>` : code;
    return `<article class="fw-db-example"><h4>${esc(item.label)}</h4><p>${esc(item.compare)}</p>${query}</article>`;
  }).join('');
}

function renderDbTimePrecision() {
  const sql = `SELECT COLUMN_NAME, DATETIME_PRECISION
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'post'
  AND DATA_TYPE IN ('datetime', 'timestamp');
SELECT @@session.sql_mode;`;
  return `<aside class="fw-field-note" data-fw-time-precision aria-label="시각 값을 비교할 때">
  <p><strong>응답과 DB의 시각은 정밀도를 확인한 뒤 비교하세요.</strong> 응답에 소수초가 있고 DB 열이 초 단위라면 문자열 전체가 다를 수 있습니다. 같은 글 id의 값과 실제 열 정밀도를 확인하세요.</p>
  <details>
    <summary>시각 열의 정밀도 확인 SQL</summary>
    <p>DATETIME_PRECISION은 소수초 자릿수입니다. 특정 값이 나온다고 가정하지 말고 사용하는 DB에서 확인하세요. 변경되면 안 되는 시각은 같은 DB 열의 요청 전후 값을 비교합니다. 정밀도 차이를 이유로 실제 값 변경을 통과 처리하지 않습니다.</p>
    ${pre(sql, 'sql')}
  </details>
</aside>`;
}

function renderRequest(task) {
  const requiredId = task.api.path.includes('{id}');
  const idLabel = task.request.idLabel || (task.id === 'create' ? '생성된 글 id · 응답 후 연결' : task.id === 'list' ? 'DB에서 비교할 글 id · 목록 요청에는 미사용' : '같은 글의 id');
  const parameterLabels = { slug: '게시판 slug', page: '페이지 · 0부터', size: '페이지당 개수 · 1~50' };
  const pathFields = Object.entries(task.request.pathParams).filter(([key]) => key !== 'id').map(([key, value]) => `<label>${esc(parameterLabels[key] || key)}<input data-fw-path="${esc(key)}" value="${esc(value)}" required autocomplete="off"></label>`).join('');
  const queries = Object.entries(task.request.query).map(([key, value]) => `<label>${esc(parameterLabels[key] || key)}<input data-fw-query="${esc(key)}" type="number" value="${esc(value)}" min="${key === 'size' ? 1 : 0}"${key === 'size' ? ' max="50"' : ''} required></label>`).join('');
  return `<section class="fw-request" id="fw-request" aria-labelledby="fw-request-title"><div class="fw-section-heading"><h2 id="fw-request-title">요청하고 결과 확인하기</h2><span class="fw-badge">직접 연결한 서버의 응답만 표시</span></div><p>${esc(task.request.exampleLabel)}</p><p class="fw-field-note">코드 수정 후에는 <a href="#functional-setup">앱만 재시작</a>한 뒤 요청하세요. DB와 작성 응답 id는 유지합니다.</p><div class="fw-request-grid"><form class="fw-request-form" data-fw-form><h3>내 서버로 보낼 요청</h3><p class="fw-field-note fw-file-note" data-fw-file-note hidden>학습 화면을 파일로 열었습니다. 정본 서버와 요청을 주고받으려면 <a href="#functional-setup">실행 준비에서 문서 주소를 여세요</a>. 그림·값 비교는 이 상태에서도 볼 수 있습니다.</p><label>실습 서버 주소<input data-fw-base type="url" value="http://localhost:8080" placeholder="http://localhost:8080" required autocomplete="off"></label><label>Bearer 토큰 · 이 화면에서만 사용<input data-fw-token type="password" value="" placeholder="유효한 토큰을 직접 입력" autocomplete="off" spellcheck="false"></label><p class="fw-field-note">교육용 패키지의 공개 fixture 토큰 예시: <code>tok-kimjava</code>. 직접 입력해야 하며 자동 저장·전송하지 않습니다. ${esc(task.request.authentication)}</p><div class="fw-request-params"><label>${esc(idLabel)}<input data-fw-id inputmode="numeric" pattern="[1-9][0-9]*" placeholder="${task.id === 'create' ? '작성 요청 후 응답 id가 연결됩니다' : '작성 응답에서 받은 id'}"${task.id === 'create' ? ' readonly' : ''}${requiredId ? ' required' : ''} autocomplete="off"></label>${pathFields}${queries}</div>${task.request.body !== null ? `<label>요청 본문 · JSON<textarea data-fw-body rows="${task.id === 'create' ? 11 : 5}" spellcheck="false">${esc(json(task.request.body))}</textarea></label>` : '<p class="fw-no-body">이 요청은 본문을 보내지 않습니다.</p>'}${task.request.variants ? `<div class="fw-variants" aria-label="전송하지 않고 본문 예시 선택">${task.request.variants.map((variant, index) => `<button type="button" data-fw-variant="${index}">${esc(variant.label)}</button>`).join('')}</div>` : ''}<p class="fw-field-note" data-fw-startup role="status">요청 도구를 준비하고 있습니다. 버튼이 계속 비활성 상태라면 페이지를 새로고침하거나 <a href="#functional-setup">실행 준비 안내</a>를 확인하세요.</p><noscript><p class="fw-field-note">이 요청 도구는 JavaScript가 필요합니다. 요청 내용을 복사해 IDE나 API 클라이언트에서 직접 확인할 수 있습니다.</p></noscript><p class="fw-request-preview" data-fw-request-preview>${esc(task.api.method)} ${esc(task.api.path)}</p><div class="fw-send-actions"><button class="fw-send" type="submit" data-fw-send disabled>요청 전송</button><button class="fw-copy-request" type="button" data-fw-copy-request disabled>요청 복사 · curl</button></div><p class="fw-field-note">입력한 토큰도 함께 복사됩니다. 명령은 자동 실행하지 않습니다.</p><p class="fw-copy-status" data-fw-copy-status role="status" aria-live="polite"></p><label class="fw-curl-fallback" data-fw-curl-fallback hidden>클립보드를 사용할 수 없습니다. 아래 명령을 선택해 직접 복사하세요.<textarea data-fw-curl-text readonly rows="6" spellcheck="false" autocomplete="off"></textarea></label><p class="fw-field-note">${task.group === 'like' ? '전송 버튼을 누를 때만 요청합니다. 좋아요 설정·취소도 DB를 변경합니다.' : '전송 버튼을 누를 때만 요청합니다. 상세 GET도 조회수를 씁니다.'}</p></form><section class="fw-actual" aria-labelledby="fw-actual-title"><h3 id="fw-actual-title">실제 응답</h3><p class="fw-request-status" data-fw-status role="status" aria-live="polite">미실행</p><pre data-fw-response tabindex="0">아직 요청하지 않았습니다. 기대 결과는 실행 결과가 아닙니다.</pre><p class="fw-captured">연속 학습 id: <strong data-fw-captured>아직 없음</strong></p><p data-fw-storage class="fw-field-note"></p></section><section class="fw-expected"><h3>기대 결과 · 입력값과 비교</h3><p class="fw-field-note">기본 성공 요청의 기준입니다. 본문·토큰·페이지를 바꿨다면 보낸 값과 비교하세요. 실패 요청의 상태는 아래 실패 조건을 따릅니다.</p><p class="fw-expected-status">HTTP ${task.expected.status}${task.expected.status === 204 ? ' · 본문 없음' : ''}</p>${Object.keys(task.expected.headers).length ? pre(Object.entries(task.expected.headers).map(([key, value]) => `${key}: ${value}`).join('\n')) : ''}${list(task.expected.checks)}<details><summary>응답 필드와 실패 조건</summary>${list(task.expected.fields)}${list(Object.entries(task.expected.failures).map(([status, description]) => `${status}: ${description}`))}${list(task.expected.caveats)}${requiredId ? '<p class="fw-field-note">이 폼의 id는 양의 정수만 허용합니다. 숫자가 아닌 경로의 400을 확인하려면 정상 id로 curl을 복사한 뒤, API 클라이언트에서 경로의 id만 abc로 바꿔 별도로 실행하세요. 복사만으로 요청하지 않습니다.</p>' : ''}</details></section><section class="fw-db-check"><h3>직접 DB 확인 · 응답과 별도</h3><p>${esc(FUNCTIONAL_CONTRACT.observation)}</p>${renderDbChecks(task)}${renderDbTimePrecision()}<p class="fw-field-note">${task.group === 'like' ? ':capturedId는 위 글 id, :memberId는 실제 인증 회원 id로 바꿉니다.' : ":capturedId는 위 id로 바꿉니다. 목록의 :boardSlug는 따옴표를 포함한 게시판 값(예: 'dev'), :viewerId는 토큰 회원 id 또는 NULL, :size와 :offset은 숫자로 직접 바꿉니다."} 위 SQL은 검산용 예시이며 실제 Hibernate 로그가 아닙니다. 이 화면은 DB 쿼리를 실행하거나 저장을 자동 판정하지 않습니다.</p>${task.expected.unchanged.length ? `<p><strong>함께 비교할 유지 값</strong> ${esc(task.expected.unchanged.join(', '))}</p>` : ''}</section></div></section>`;
}

export function renderFunctionalWorkspace({ task, rootPrefix = '../../', assets = {} } = {}) {
  if (typeof task === 'string') task = FUNCTIONAL_TASK_BY_ID[task];
  if (!task || !FUNCTIONAL_TASK_BY_ID[task.id]) throw new Error('정의된 기능 과제가 필요합니다.');
  const image = imageAsset(task, assets);
  const focusImage = task.id === 'create' ? imageAsset({ id: 'newPostFocus' }, assets) : null;
  const newPostFocus = task.id === 'create'
    ? renderFunctionalNewPostFocus({ idPrefix: 'fw-new-post', image: focusImage ? rootPrefix + focusImage : '' })
    : '';
  const fileCopyControl = `<button type="button" class="fw-copy-file" data-fw-file-copy data-fw-file-copy-path="${esc(task.target.path)}" disabled>파일 경로 복사</button>`;
  const fileCopyFeedback = `<p class="fw-file-copy-status" data-fw-file-copy-status role="status" aria-live="polite" hidden></p><label class="fw-file-copy-fallback" data-fw-file-copy-fallback hidden>직접 복사할 파일 경로<input data-fw-file-copy-text value="${esc(task.target.path)}" readonly autocomplete="off"></label>`;
  const next = FUNCTIONAL_TASK_BY_ID[task.nextTask];
  return `<div class="functional-workspace" data-fw-root data-fw-task="${task.id}" data-task-id="${task.id}" data-fw-self-complete="false" data-fw-request-state="idle">${renderFunctionalProjectContext({ rootPrefix })}<div class="fw-shell">${navigation(task, rootPrefix)}<div class="fw-main"><header class="fw-header"><p class="fw-eyebrow">기능 ${task.order} / ${FUNCTIONAL_TASKS.length} · 같은 프로젝트에서 이어 만들기</p><h1>${esc(task.title)}</h1><p class="fw-mobile-target"><span>수정할 파일 · 메서드</span><strong>${esc(path.posix.basename(task.target.path))}</strong><code>#${esc(task.target.symbol)}</code></p><p class="fw-goal">${esc(task.goal)}</p><div class="fw-begin-row"><button type="button" data-fw-begin>이 기능 구현 시작</button><a class="fw-setup-link" href="#functional-setup">실행 준비 확인</a><p data-fw-home-status role="status" aria-live="polite">시작 버튼으로 학습 기록을 남길 수 있습니다.</p></div></header><div class="fw-task-context" role="region" aria-label="${esc(task.title)} · 현재 API"><span class="fw-context-title">${esc(task.title)}</span><p class="fw-api"><strong>${task.api.method}</strong> <code>${esc(task.api.path)}</code></p><a href="#fw-request">결과 확인 ↓</a></div><div class="fw-work-grid"><section class="fw-actions-panel"><h2>구현할 일</h2><p class="fw-situation">${esc(task.situation)}</p><ol class="fw-actions">${task.actions.map(action => `<li>${esc(action)}</li>`).join('')}</ol><div class="fw-primary-actions"><a class="fw-start-link" href="${esc(rootPrefix + task.packagePath)}" download>시작 코드 받기 · ${task.id === 'create' ? '첫 준비·중간 합류용' : '중간 합류용'}</a>${fileCopyControl}<a class="fw-run-link" href="#fw-request">요청 · 결과 확인</a></div>${fileCopyFeedback}</section><section class="fw-code-panel" aria-labelledby="fw-implementation-title"><h2 id="fw-implementation-title" tabindex="-1">지금 구현할 메서드</h2><p class="fw-target"><strong>${esc(path.posix.basename(task.target.path))}#${esc(task.target.symbol)}</strong><span>${esc(task.target.path)}</span></p>${pre(methodCode(task, task.id), 'java')}${newPostFocus}<p class="fw-field-note">시작 패키지의 실제 코드 · 이번 메서드 본문만 구현</p></section></div>${renderSetup(task, rootPrefix)}${renderVisual(task, image, rootPrefix)}${renderRequest(task)}<section class="fw-completion" aria-labelledby="fw-completion-title"><h2 id="fw-completion-title">완료 기준 · 나의 확인</h2><p>직접 구현·요청·DB 확인을 마친 항목만 체크하세요. 자기확인 기록이며 자동 채점 결과가 아닙니다.</p><div class="fw-checks">${task.completion.map(item => `<label><input type="checkbox" data-fw-check value="${esc(item.id)}"><span>${esc(item.text)}<small class="fw-check-guide">${esc(item.verification)}</small></span></label>`).join('')}</div><p data-fw-progress role="status" aria-live="polite">0 / ${task.completion.length}개 자기확인</p></section><section class="fw-references"><h2>막힐 때 볼 자료</h2><p class="fw-field-note">전체 설명과 원문은 새 탭에서 엽니다. 현재 과제의 입력과 비교 상태는 원래 탭에 유지됩니다.</p><div class="fw-reference-grid"><section><h3>현재 작업과 연결된 개념</h3>${task.concepts.map(item => `<p><a data-fw-concept href="${href(rootPrefix, item.path, item.anchor, 'fromTask=flow-' + task.id)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.label)} 전체 설명 · 새 탭">${esc(item.label)} <small>전체 설명 · 새 탭 ↗</small></a><span>${esc(item.reason)}</span></p>`).join('')}</section><section><h3>원문 · 기존 단계</h3><p class="fw-field-note">이전 단계의 계약이 포함되어 있습니다. 이번 구현 범위는 위의 API와 완료 기준을 따릅니다.</p>${task.legacy.map(item => `<p><a data-fw-legacy href="${href(rootPrefix, item.path, item.anchor, 'fromTask=flow-' + task.id)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(item.label)} 원문 · 새 탭">${esc(item.label)} <small>새 탭 ↗</small></a><span>${esc(item.reason)}</span></p>`).join('')}</section></div><details class="fw-answer"><summary>참고 정답 · ${esc(task.target.symbol)} 메서드</summary><p>공통 3-2 snapshot의 파일별 blob과 완성 패키지가 기준입니다. 먼저 직접 구현한 뒤 비교하세요.</p>${pre(methodCode(task, 'reference'), 'java')}<a href="${esc(rootPrefix + task.referencePackagePath)}" download>전체 완성 코드 받기 · 참고용</a></details></section><footer class="fw-task-footer">${next ? `<a class="fw-next" data-fw-next href="${taskHref(next, rootPrefix)}">다음 기능 · ${esc(next.title)} →</a><p>같은 프로젝트·서버·DB와 작성 응답의 id로 이어갑니다. 자동 이동하지 않습니다.</p>` : `<a class="fw-next" data-fw-next href="${href(rootPrefix, 'scenario/flow/like-post.md')}">다음 확장 · 좋아요 설정 →</a><p>다섯 기능을 만든 뒤 태그·권한·트랜잭션·성능 확장을 선택합니다.</p>`}</footer></div></div><script type="application/json" data-fw-data>${payload({ id: task.id, pagePath: task.sourcePath.replace(/\.md$/, '.html'), api: task.api, variants: task.request.variants || [], completionIds: task.completion.map(item => item.id), expectedStatus: task.expected.status })}</script></div>`;
}

export function renderFunctionalCatalog({ rootPrefix = '../' } = {}) {
  // 요약은 공통 3-2 계약의 status·카운터·PATCH·soft delete 정책을 따른다.
  const outcomes = {
    create: 'DB 저장 · 201 · 생성 id · Location',
    detail: '같은 id 조회 · 조회수 +1 · 가시성 실패 404',
    list: '페이지 items · 같은 조건 COUNT · 조회수 유지',
    update: '보낸 값 반영 · 생략/null 유지 · tags [] 해제',
    delete: '204 빈 본문 · 행·연결 보존 · 일반 조회 제외',
  };
  const firstTask = FUNCTIONAL_TASKS[0];
  return `<section class="functional-catalog">${renderFunctionalProjectContext({ rootPrefix })}<header class="fw-header"><p class="fw-eyebrow">서비스 만들기 · 게시글 기능</p><h1>서비스 만들기 · 게시글 기능</h1><p class="fw-goal">게시글 API 만들기. 글 작성부터 삭제까지, 완성할 기능을 골라 바로 구현합니다.</p></header>
    <section class="fw-common-start" aria-labelledby="fw-common-start-title"><div><h2 id="fw-common-start-title">공통 시작 코드</h2><p>Controller · DTO · 인증 · Entity · Repository 제공</p></div><a href="${esc(rootPrefix + firstTask.packagePath)}" download>시작 코드 받기 · 첫 준비·중간 합류용</a><p>처음에는 이 ZIP을 새 폴더에 풀어 별도의 학습 프로젝트를 준비합니다. 현재 저장소의 학생 코드와는 별도이며, 이후에는 같은 프로젝트·DB에서 Service 메서드 다섯 개를 이어서 구현합니다. <a href="${taskHref(firstTask, rootPrefix)}#functional-setup">실행 준비 확인</a></p></section>
    <div class="fw-catalog-columns" aria-hidden="true"><span>완성할 기능</span><span>이번에 구현할 메서드 · API</span><span>완성 결과</span><span>과제 열기</span></div>
    <ol class="fw-catalog-list">${FUNCTIONAL_TASKS.map(task => `<li class="fw-catalog-row"><div class="fw-catalog-name"><span class="fw-task-number">${task.order}</span><h2>${esc(task.title)}</h2></div><div class="fw-catalog-implementation"><strong class="fw-catalog-method">${esc(path.posix.basename(task.target.path))}#${task.target.symbol}</strong><p class="fw-catalog-api"><strong>${task.api.method}</strong> <code>${esc(task.api.path)}</code></p></div><p class="fw-catalog-outcome">${esc(outcomes[task.id])}</p><a class="fw-catalog-open fw-task-link" href="${taskHref(task, rootPrefix)}" aria-label="${esc(task.title)} 과제 열기">${task.id === 'create' ? '구현하기' : '열기'} →</a></li>`).join('')}</ol>
    <p class="fw-catalog-continuity">POST 실제 응답의 id를 다음 기능에서 이어 씁니다. 같은 프로젝트·서버·DB를 유지합니다.</p>
    <section class="functional-like-catalog" aria-labelledby="fw-like-catalog-title"><h2 id="fw-like-catalog-title">게시글 다음 · 좋아요 추가</h2><p>기존 CRUD 코드를 유지하고 반응 기능을 더합니다. 삭제한 글의 id 대신 다른 회원의 새 글을 준비합니다.</p>${FUNCTIONAL_LIKE_TASKS.map(item => `<p><a class="fw-task-link" href="${taskHref(item, rootPrefix)}">${esc(item.title)} →</a> <code>${item.api.method} ${item.api.path}</code></p>`).join('')}<a href="${esc(rootPrefix + 'scenario/flow/packages/like/like-extension.zip')}" download>기존 프로젝트용 추가 자료 받기</a></section>
    <details class="fw-catalog-preparation"><summary>API 구현이 처음이라면 · 선택 준비자료</summary><p>success만 반환하는 API, Java 문법, 요청·응답 기초는 준비 경로에서 연습할 수 있습니다.</p><a href="${href(rootPrefix, 'scenario/README.md', 'legacy-scenarios')}">기존 전체 시나리오와 준비자료 보기</a></details>
    <p class="fw-catalog-note">앞 과제부터 학습했다면 다음 ZIP을 덮어쓰지 않고 다음 메서드만 구현하세요. 이후 과제의 ZIP은 중간 합류를 위한 선택지입니다. <a href="${href(rootPrefix, 'scenario/README.md', 'legacy-scenarios')}">원본 단계 · 정답 참고</a></p>
  </section>`;
}

// 확장 과제에서도 검증된 명시 요청·응답·DB 확인 UI를 사용한다.
export { renderRequest as renderFunctionalRequest };
