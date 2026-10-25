import { initHomeServicePreview } from './home-service-preview.js';
import { initHomeNewVisual } from './home-new-visual.js';
import { TASKS, PROGRESS_KEY, readProgress, startTask, saveScene, completeTask, reopenTask, chooseStart, homeView } from './home-state.mjs';
import { readReferenceContext } from './functional-reference-context.mjs';

// 학습자 서버를 호출하지 않는다. 홈 예시는 오직 로컬 화면의 값만 바꾼다.
export function initLearning(doc = document, win = window) {
  const marker = doc.querySelector('[data-home-controller]');
  if (!marker) return;
  const root = new URL(marker.dataset.homeRoot, win.location.href);
  let storageAvailable = true;
  const storage = {
    getItem(key) { try { return win.localStorage.getItem(key); } catch { storageAvailable = false; return null; } },
    setItem(key, value) { try { win.localStorage.setItem(key, value); } catch { storageAvailable = false; } },
  };
  let state = readProgress(storage);
  // 다른 탭이 선택한 과제를 이전 탭의 오래된 상태로 덮어쓰지 않는다.
  const refreshState = () => {
    if (!storageAvailable) return;
    const latest = readProgress(storage);
    if (storageAvailable) state = latest;
  };
  const changeProgress = (change, ...args) => {
    refreshState();
    state = change(state, ...args, storage);
  };
  const $ = (selector) => doc.querySelector(selector);
  const href = (task) => new URL(task.href, root).href;
  const listenStart = (anchor, id) => {
    anchor.href = href(TASKS[id]);
    anchor.onclick = () => { changeProgress(startTask, id); };
  };
  const storageNote = () => {
    const note = $('[data-home-storage]');
    if (note) note.textContent = storageAvailable ? '학습 기록은 이 브라우저에 저장됩니다.' : '브라우저 저장소를 사용할 수 없어, 다시 방문할 때 이어하기 기록이 유지되지 않습니다.';
  };

  if ($('.home-visual')) {
    let view;
    const response = $('[data-demo-response]');
    const demoStatus = $('[data-demo-status]');
    const postDrafts = { functional: { title: '새 게시글', content: '본문' }, legacy: { title: $('#home-demo-post-title').value, content: $('#home-demo-post-content').value } };
    let postPreviewMode = 'legacy';
    function renderPreview(task) {
      const preview = task.functionalId && task.preview === 'store' ? 'receive' : task.preview;
      doc.querySelectorAll('[data-demo]').forEach((el) => { el.hidden = el.dataset.demo !== preview; });
      $('[data-demo-path]').textContent = task.api;
      const result = $('[data-demo-result]');
      result.hidden = ['query', 'cursor'].includes(task.preview);
      const showResult = (title, content, meta) => {
        $('[data-demo-result-title]').textContent = title;
        $('[data-demo-result-content]').textContent = content;
        $('[data-demo-result-meta]').textContent = meta;
      };
      const responseTitle = $('[data-demo-response-title]');
      if (task.functionalId && task.preview !== 'store') {
        const descriptions = {
          detail: ['새 게시글', '본문과 태그가 포함된 상세 조회 예시', '200 OK\nviewCount: 요청 전 v → v+1\n없는 글·삭제 글·볼 수 없는 글: 404'],
          list: ['새 게시글', '목록 항목 예시 · 본문 제외 · publishedAt DESC, id DESC', '200 OK\nitems / page / size / totalElements / totalPages / hasNext\n같은 조건의 COUNT와 DB 값 불변을 직접 확인'],
          update: ['수정한 제목', '제목만 보내면 생략한 본문과 태그는 유지됩니다.', 'PATCH /api/posts/{capturedId}\n{"title":"수정한 제목"}\n\n200 OK\n보낸 non-null 값만 변경 · 생략/null 유지 · tags=[] 연결 해제'],
          delete: ['수정한 제목', '삭제 뒤에도 행·태그·좋아요·댓글 연결을 보존하는 예시', '204 No Content\n본문 없음\n같은 id 상세/PATCH/재삭제 404 · 목록 제외'],
          like: ['다른 회원의 새 게시글', '다른 회원 관계는 유지하며 내 관계만 추가합니다.', '200 OK\nliked: true\n기존 관계가 없을 때만 likeCount +1 · 반복 요청 멱등'],
          unlike: ['좋아요를 설정한 같은 글', '내 관계만 제거하고 다른 회원의 좋아요와 글은 유지합니다.', '200 OK\nliked: false\n내 관계가 있던 경우만 likeCount -1 · 반복 요청 멱등'],
        };
        const [title, content, example] = descriptions[task.functionalId];
        showResult(title, content, '학습용 기대 결과 · 실제 서버·DB 미실행');
        response.textContent = example;
        responseTitle.textContent = '완료할 기능의 기대 결과 보기';
      } else if (task.preview === 'greeting') {
        const name = $('#home-demo-name').value || '익명';
        const message = `${name}님, 반가워요`;
        showResult(message, '입력한 이름으로 인사말이 달라집니다.', `이름 글자 수: ${name.length}`);
        response.textContent = JSON.stringify({ name, message, nameLength: name.length }, null, 2);
        responseTitle.textContent = '응답 JSON 보기';
      } else if (task.preview === 'ping') {
        showResult('pong', '주소와 Controller가 연결되면 짧은 응답이 돌아옵니다.', '정상 매핑의 기대 화면 · 실제 서버 실행 전');
        response.textContent = '200 OK\npong';
        responseTitle.textContent = '응답 데이터 보기';
      } else if (task.preview === 'cursor') {
        response.textContent = "마지막 반환 행: id 144\npublished_at: 2026-10-02 21:57:53\n\n다음 묶음의 조건\np.published_at < '2026-10-02 21:57:53'\nOR (p.published_at = '2026-10-02 21:57:53'\n    AND p.id < 144)\n\n정렬: published_at DESC, id DESC";
        responseTitle.textContent = '다음 묶음을 고르는 조건 보기';
      } else if (task.preview === 'query') {
        response.textContent = '응답 필드     ← 테이블의 열\ntitle       ← post.title\nauthorNickname ← member.nickname\nlikeCount   ← post.like_count';
        responseTitle.textContent = '응답 필드의 출처 보기';
      } else {
        const nextMode = task.functionalId ? 'functional' : 'legacy';
        if (postPreviewMode !== nextMode) {
          postDrafts[postPreviewMode] = { title: $('#home-demo-post-title').value, content: $('#home-demo-post-content').value };
          $('#home-demo-post-title').value = postDrafts[nextMode].title;
          $('#home-demo-post-content').value = postDrafts[nextMode].content;
          postPreviewMode = nextMode;
        }
        const title = $('#home-demo-post-title').value;
        const content = $('#home-demo-post-content').value;
        const stored = task.preview === 'store';
        showResult(title || '(제목이 비어 있어요)', content || '(본문이 비어 있어요)', stored ? '저장 후 만들어 갈 모습 · 실제 DB 저장 전' : '요청 접수 예시 · 이 단계에서는 DB에 저장하지 않습니다.');
        response.textContent = `${JSON.stringify({ boardSlug: 'dev', title, content, tags: task.functionalId ? ['spring', '새태그'] : [], visibility: 'PUBLIC' }, null, 2)}\n\n${stored ? '201 Created\nLocation: /api/posts/{capturedId}\nid: DB가 생성 → 같은 id의 행 직접 확인' : '200 OK\nsuccess\n아직 DB에 저장하지 않습니다.'}`;
        responseTitle.textContent = stored ? '요청·저장 흐름 보기' : '요청·응답 데이터 보기';
      }
      demoStatus.textContent = '학습용 미리보기 · 내 서버에 요청하지 않습니다.';
    }
    function render() {
      view = homeView(state);
      const { task, mode, record, next, returnTask, returnRecord } = view;
      const intro = $('[data-home-intro-title]');
      const introDescription = $('[data-home-intro-description]');
      if (mode === 'first') {
        const emphasis = doc.createElement('span'); emphasis.textContent = '하나의 서비스까지.';
        intro.replaceChildren('작은 API부터, ', emphasis);
        introDescription.textContent = '글 작성·조회·소통이 되는 게시판을 직접 만듭니다. 기능 하나씩 구현하고, 응답과 DB 결과로 확인하세요.';
      } else if (mode === 'selection') {
        intro.textContent = '새 시작점을 골랐어요.';
        introDescription.textContent = '선택한 과제와 완성 예시를 확인하세요. 새 과제를 시작하기 전까지 하던 과제의 진도는 그대로 보관합니다.';
      } else {
        intro.textContent = mode === 'resume' ? '하던 기능부터 이어가 볼까요?' : '만든 결과를 직접 확인했어요.';
        introDescription.textContent = mode === 'resume' ? '마지막으로 보던 학습 위치부터 이어가세요. 필요한 설명은 언제든 다시 열어볼 수 있습니다.' : '지금까지 확인한 기능을 바탕으로 다음 과제를 시작해 보세요.';
      }
      $('[data-home-tag]').textContent = `${mode === 'resume' ? '이어서 만들기' : mode === 'complete' ? '직접 확인 완료' : mode === 'selection' ? '선택한 시작점' : '첫 시작'} · ${task.functionalId ? task.title : task.id}`;
      $('[data-home-title]').textContent = task.title;
      $('[data-home-description]').textContent = task.description;
      $('[data-home-api]').textContent = task.api;
      $('[data-home-work]').textContent = record?.scene?.label && mode === 'resume' ? record.scene.label : task.work;
      $('[data-home-goal]').textContent = task.goal;
      const start = $('[data-home-start]');
      const target = mode === 'complete' ? next : task;
      if (target) {
        listenStart(start, target.id);
        start.textContent = mode === 'resume' ? '하던 작업 이어가기 →' : mode === 'complete' ? `다음 ${next.id} 시작하기 →` : mode === 'selection' ? `${task.id} ${record?.status === 'complete' ? '다시 보기' : '학습 시작하기'} →` : `${task.id} ${task.id === '0-1' ? '첫 API 만들기' : '시작하기'} →`;
      } else {
        start.href = new URL(task.nextHref || 'scenario/README.html', root).href;
        start.onclick = null;
        start.textContent = '다음 과제 살펴보기 →';
      }
      $('[data-home-progress]').textContent = mode === 'resume' ? `마지막 학습 위치를 기억했어요. 코드·서버 결과는 직접 확인해 주세요.` : mode === 'complete' ? '내가 직접 확인한 기록입니다. 자동 채점 통과를 뜻하지 않습니다.' : mode === 'selection' ? '이 시작 버튼을 누르면 선택한 과제를 이어갈 작업으로 저장합니다.' : '개발은 내 IDE에서, 안내와 결과 확인은 여기서.';
      const note = $('[data-home-next]');
      note.replaceChildren(); note.hidden = true;
      if (mode === 'complete' && next) { note.hidden = false; note.textContent = `다음 기능 · ${next.title}`; }
      const returnCard = $('[data-home-return-card]');
      returnCard.hidden = !returnTask;
      if (returnTask) {
        const returnLink = $('[data-home-return]');
        listenStart(returnLink, returnTask.id);
        returnLink.textContent = `${returnTask.id} · ${returnTask.title} ${returnRecord?.status === 'complete' ? '다시 보기' : '이어가기'} →`;
        $('[data-home-return-position]').textContent = returnRecord?.scene?.label || returnTask.work;
      }
      renderPreview(task); storageNote();
    }
    render();
    win.addEventListener('pageshow', () => { refreshState(); render(); });
    win.addEventListener('storage', (event) => { if (event.key === null || event.key === PROGRESS_KEY) { refreshState(); render(); } });

    const startDialog = $('#home-start-dialog');
    const conceptDialog = $('#home-concept-dialog');
    const prepareDialog = $('#home-prepare-dialog');
    initHomeServicePreview(doc);
    initHomeNewVisual(doc);
    let opener, scrollTop;
    function openDialog(dialog, button) {
      opener = button; scrollTop = win.scrollY;
      dialog.showModal();
      doc.documentElement.style.overflow = 'hidden';
    }
    for (const dialog of [startDialog, conceptDialog, prepareDialog]) {
      dialog.addEventListener('close', () => {
        doc.documentElement.style.overflow = '';
        opener?.focus({ preventScroll: true });
        win.scrollTo({ top: scrollTop, behavior: 'instant' });
      });
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
    }
    const selection = $('[data-home-selection]');
    const choices = startDialog.querySelector('fieldset');
    if (choices && !choices.querySelector('input[value="flow-create"]')) {
      const label = doc.createElement('label'); label.className = 'home-choice';
      const input = doc.createElement('input'); input.type = 'radio'; input.name = 'start'; input.value = 'flow-create';
      const text = doc.createElement('span'); const title = doc.createElement('strong'); title.textContent = '게시글 기능부터';
      const description = doc.createElement('small'); description.textContent = 'API 하나를 만들 수 있다면 저장·201 응답부터 시작합니다.';
      text.append(title, description); label.append(input, text); choices.append(label);
    }
    function updateSelection() {
      const chosen = TASKS[startDialog.querySelector('input:checked').value];
      selection.replaceChildren();
      const title = doc.createElement('strong'); title.textContent = chosen.functionalId ? chosen.title : `${chosen.id} · ${chosen.title}`;
      const description = doc.createElement('p'); description.textContent = `${chosen.work} · ${chosen.goal}`;
      selection.append(title, description);
    }
    $('[data-home-choose]').addEventListener('click', (event) => {
      (startDialog.querySelector(`input[value="${state.selected}"]`) || startDialog.querySelector('input[value="0-1"]')).checked = true;
      updateSelection(); openDialog(startDialog, event.currentTarget);
    });
    startDialog.addEventListener('change', updateSelection);
    $('[data-home-apply]').addEventListener('click', () => {
      changeProgress(chooseStart, startDialog.querySelector('input:checked').value);
      render(); startDialog.close();
    });
    $('[data-home-concept]').addEventListener('click', (event) => openDialog(conceptDialog, event.currentTarget));
    $('[data-home-close]').addEventListener('click', () => conceptDialog.close());
    $('[data-home-prepare]').addEventListener('click', (event) => openDialog(prepareDialog, event.currentTarget));
    $('[data-home-prepare-close]').addEventListener('click', () => prepareDialog.close());
    $('#home-greeting-form').addEventListener('submit', (event) => {
      event.preventDefault(); renderPreview(view.task);
      demoStatus.textContent = '입력한 이름으로 예시 화면을 바꿨어요. 실제 요청은 과제에서 내 서버로 보냅니다.';
    });
    $('form[data-demo="receive"]').addEventListener('submit', (event) => {
      event.preventDefault(); renderPreview(view.task);
      demoStatus.textContent = '예시 데이터를 보냈다고 가정한 화면입니다. 실제 서버·DB 실행 결과가 아닙니다.';
    });
    $('[data-demo-ping]').addEventListener('click', () => { renderPreview(view.task); demoStatus.textContent = '정상 매핑의 기대 응답 예시입니다. 실제 서버 결과가 아닙니다.'; });
    doc.querySelectorAll('[data-home-setup]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      const reveal = () => {
        const original = $('#전체-안내'); original.open = true;
        win.location.hash = '전체-안내';
        original.scrollIntoView?.({ block: 'start' });
        original.querySelector('summary').focus({ preventScroll: true });
      };
      if (prepareDialog.open) { prepareDialog.addEventListener('close', reveal, { once: true }); prepareDialog.close(); }
      else reveal();
    }));
    // README의 원래 앵커로 들어와도 접힌 원문을 실제로 읽을 수 있게 연다.
    function revealOriginal() {
      let target; try { target = doc.getElementById(decodeURIComponent(win.location.hash.slice(1))); } catch { return; }
      if (target?.closest('.home-original')) { $('#전체-안내').open = true; target.scrollIntoView?.({ block: 'start' }); }
    }
    win.addEventListener('hashchange', revealOriginal); revealOriginal();
  }

  const functionalRoot = doc.querySelector('[data-fw-root][data-fw-task]');
  const functionalTask = functionalRoot && TASKS[`flow-${functionalRoot.dataset.fwTask}`];
  const task = functionalTask || TASKS[marker.dataset.homeTask];
  if (task?.functionalId && functionalRoot) {
    const begin = functionalRoot.querySelector('[data-fw-begin]');
    const status = functionalRoot.querySelector('[data-fw-home-status]');
    function updateFunctionalStatus() {
      const active = state.active === task.id;
      if (begin) begin.hidden = active;
      if (status) status.textContent = active
        ? state.records[task.id]?.status === 'complete'
          ? '완료 기준을 직접 확인한 기록입니다. 자동 채점과 별도입니다.'
          : storageAvailable ? '홈에서 이 기능을 이어갈 수 있습니다. 완료 기준은 직접 확인해 체크하세요.' : '현재 기능을 시작했습니다. 저장소가 차단되어 다음 방문에는 기록이 유지되지 않습니다.'
        : '둘러보기 중입니다. 이 기능 시작하기를 누르면 홈의 이어하기에 남습니다.';
    }
    function syncSelfChecks() {
      if (!functionalRoot.dataset.fwInitialized) return;
      refreshState();
      if (state.active !== task.id) { updateFunctionalStatus(); return; }
      const checks = [...functionalRoot.querySelectorAll('[data-fw-check]')];
      const complete = checks.length > 0 && checks.every((check) => check.checked);
      if (complete !== (state.records[task.id]?.status === 'complete')) changeProgress(complete ? completeTask : reopenTask, task.id);
      updateFunctionalStatus();
    }
    begin?.addEventListener('click', () => {
      changeProgress(startTask, task.id);
      updateFunctionalStatus();
      const implementation = functionalRoot.querySelector('#fw-implementation-title');
      implementation?.focus({ preventScroll: true });
      implementation?.scrollIntoView?.({ block: 'start' });
    });
    doc.addEventListener('functional-progress-change', (event) => {
      const progress = event.detail;
      if (typeof progress?.taskId !== 'string' || typeof progress.complete !== 'boolean' || !Array.isArray(progress.checkedIds)) return;
      const eventTaskId = progress.taskId.startsWith('flow-') ? progress.taskId : `flow-${progress.taskId}`;
      if (eventTaskId !== task.id) return;
      refreshState();
      if (state.active === task.id) changeProgress(progress.complete ? completeTask : reopenTask, task.id);
      updateFunctionalStatus();
    });
    const syncAfterRestore = () => win.queueMicrotask(syncSelfChecks);
    doc.addEventListener('DOMContentLoaded', syncAfterRestore, { once: true });
    win.addEventListener('pageshow', () => { refreshState(); updateFunctionalStatus(); syncAfterRestore(); });
    win.addEventListener('storage', (event) => {
      if (event.key === null || event.key === PROGRESS_KEY || event.key === 'javaExperience.functional.selfChecks.v1') {
        refreshState(); updateFunctionalStatus(); syncAfterRestore();
      }
    });
    updateFunctionalStatus(); syncAfterRestore();
  } else if (task && !task.functionalId && readReferenceContext(doc, win.location)?.kind !== 'legacy') {
    const bar = doc.createElement('section'); bar.className = 'learning-progress-bar'; bar.setAttribute('aria-label', '홈 이어하기와 직접 확인 기록');
    const status = doc.createElement('span'); status.className = 'learning-progress-status'; status.setAttribute('role', 'status');
    const begin = doc.createElement('button'); begin.type = 'button'; begin.textContent = '이 과제 시작하기';
    const complete = doc.createElement('button'); complete.type = 'button'; complete.textContent = '직접 확인 완료';
    const home = doc.createElement('a'); home.href = root.href; home.textContent = '홈으로';
    bar.append(status, begin, complete, home); doc.querySelector('main').prepend(bar);
    let journey = task.journey ? doc.querySelector(task.journey) : null;
    function currentScene() {
      const panel = journey && [...journey.querySelectorAll(`[${task.panel}]`)].find((el) => !el.hidden);
      return panel ? { attribute: task.panel, value: panel.getAttribute(task.panel), label: panel.querySelector('h2,h3')?.textContent.trim() || task.work } : null;
    }
    function updateBar() {
      const active = state.active === task.id;
      begin.hidden = active; complete.hidden = !active;
      complete.textContent = state.records[task.id]?.status === 'complete' ? '완료 취소' : '직접 확인 완료';
      status.textContent = active ? state.records[task.id]?.status === 'complete' ? '직접 확인 완료 · 자동 채점과 별도' : storageAvailable ? '홈에서 이 학습 위치를 이어갈 수 있어요.' : '저장소가 차단되어 다음 방문에 이어할 수 없어요.' : '지금은 과제 둘러보기입니다. 시작하면 홈에 이어하기가 남습니다.';
    }
    begin.addEventListener('click', () => { changeProgress(startTask, task.id); changeProgress(saveScene, task.id, currentScene()); updateBar(); });
    complete.addEventListener('click', () => {
      // 목표를 확인하고 명시적으로 누른 사용자 기록이다. 서버 테스트 결과로 표기하지 않는다.
      refreshState();
      changeProgress(state.records[task.id]?.status === 'complete' ? reopenTask : completeTask, task.id); updateBar();
    });
    complete.title = task.goal;
    if (journey && state.active === task.id) {
      const saved = state.records[task.id]?.scene;
      if (saved?.attribute === task.panel) {
        const button = [...journey.querySelectorAll(`[${task.go}]`)].find((el) => el.getAttribute(task.go) === saved.value);
        button?.click();
      }
    }
    if (journey) new win.MutationObserver(() => {
      refreshState();
      const scene = currentScene();
      const previous = state.records[task.id]?.scene;
      if (scene && JSON.stringify(scene) !== JSON.stringify(previous)) changeProgress(saveScene, task.id, scene);
    }).observe(journey, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    win.addEventListener('pageshow', () => { refreshState(); updateBar(); });
    win.addEventListener('storage', (event) => {
      if (event.key === null || event.key === PROGRESS_KEY) { refreshState(); updateBar(); }
    });
    updateBar();
  }
  return { getState: () => state };
}
if (typeof document !== 'undefined') initLearning();
