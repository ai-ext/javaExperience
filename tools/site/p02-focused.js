const focused = document.querySelector('.p02-focused');
if (focused) {
  const screens = [...focused.querySelectorAll('[data-p02-screen]')];
  const show = (name) => {
    screens.forEach((screen) => { screen.hidden = screen.dataset.p02Screen !== name; });
    focused.dataset.p02Mode = name;
    focused.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  focused.querySelectorAll('[data-p02-go]').forEach((button) =>
    button.addEventListener('click', () => show(button.dataset.p02Go)));
  const meanings = {
    controller: 'Controller는 /hello 요청을 받고 name 값을 Model에 담은 뒤 View 이름 hello를 반환합니다.',
    model: 'Model은 View에 건넬 값을 담습니다. DB 저장소가 아닙니다.',
    view: 'View인 hello.html이 Model의 name을 읽어 화면 문장을 만듭니다.',
  };
  focused.querySelectorAll('[data-mvc-step]').forEach((button) => button.addEventListener('click', () => {
    for (const item of focused.querySelectorAll('[data-mvc-step]')) item.setAttribute('aria-pressed', String(item === button));
    focused.querySelector('[data-mvc-explain]').textContent = meanings[button.dataset.mvcStep];
  }));
  focused.querySelector('[data-p02-demo-input]')?.addEventListener('input', (event) => {
    for (const value of focused.querySelectorAll('[data-p02-demo-name]')) value.textContent = event.target.value;
  });
  const responseObservations = {
    html: 'GET /hello는 hello.html을 렌더링해 HTML을 응답합니다.',
    json: 'GET /api/memos는 MemoResponse 목록을 JSON 본문으로 보냅니다. 서버의 HTML View는 렌더링하지 않습니다.',
  };
  focused.querySelectorAll('[data-p02-response]').forEach((button) => button.addEventListener('click', () => {
    const selected = button.dataset.p02Response;
    for (const item of focused.querySelectorAll('[data-p02-response]')) item.setAttribute('aria-pressed', String(item === button));
    focused.querySelector('[data-p02-response-mode]').dataset.p02ResponseMode = selected;
    focused.querySelector('[data-p02-response-observation]').textContent = responseObservations[selected];
  }));
  const revealSource = () => {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
  };
  focused.querySelectorAll('[data-p02-source]').forEach((link) => link.addEventListener('click', revealSource));
  window.addEventListener('hashchange', revealSource);
  revealSource();
  const copy = focused.querySelector('[data-p02-copy]');
  copy?.addEventListener('click', async () => {
    const code = focused.querySelector('[data-p02-screen="json"] pre code');
    const command = code.textContent;
    const state = focused.querySelector('[data-p02-copy-state]');
    try { await navigator.clipboard.writeText(command); state.textContent = 'curl 명령을 복사했습니다.'; }
    catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      let copied = false;
      try { copied = document.execCommand('copy'); } catch {}
      state.textContent = copied ? 'curl 명령을 복사했습니다.' : '자동 복사가 막혔습니다. 선택된 명령을 직접 복사하세요.';
      if (copied) selection.removeAllRanges();
    }
  });
  const routeStates = {
    post: {
      request: 'POST /api/memos', body: '{"title":"첫 메모","content":"계층을 나눴다"}',
      method: 'MemoController.create(request)', mapping: '@PostMapping',
      result: 'Service가 새 메모를 저장하면 Controller가 201 Created와 MemoResponse를 반환합니다. id는 실행 후 정해집니다.',
    },
    get: {
      request: 'GET /api/memos', body: '요청 본문 없음',
      method: 'MemoController.findAll()', mapping: '@GetMapping',
      result: 'Service가 저장된 메모를 조회하고 Controller가 MemoResponse 목록을 JSON으로 반환합니다. 이 예제의 상태는 200 OK입니다.',
    },
  };
  focused.querySelectorAll('[data-p02-route]').forEach((button) => button.addEventListener('click', () => {
    const state = routeStates[button.dataset.p02Route];
    focused.querySelectorAll('[data-p02-route]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    for (const [selector, value] of Object.entries({
      '[data-p02-route-request]': state.request,
      '[data-p02-route-body]': state.body,
      '[data-p02-route-method]': state.method,
      '[data-p02-route-mapping]': state.mapping,
      '[data-p02-route-result] p': state.result,
    })) focused.querySelector(selector).textContent = value;
  }));
  const boundaryStates = [
    ['01 · 클라이언트', 'POST /api/memos', 'title과 content를 JSON으로 보냅니다.'],
    ['02 · 요청 DTO', 'MemoCreateRequest', 'Spring이 JSON을 title과 content가 있는 요청 객체로 변환합니다.'],
    ['03 · HTTP 경계', 'MemoController.create(request)', 'Controller가 Service에 요청 객체를 전달합니다.'],
    ['04 · 업무 처리', 'MemoService.create(request)', '저장소 계약 save를 호출하고 저장된 Memo를 응답 DTO로 바꿉니다.'],
    ['05 · 응답 DTO', 'MemoResponse', '저장된 id·title·content를 담습니다. id는 실행할 때 정해집니다.'],
    ['06 · HTTP 응답', '201 Created', 'Controller가 상태 코드와 DTO를 돌려주고 JSON으로 직렬화됩니다.'],
  ];
  focused.querySelectorAll('[data-p02-boundary]').forEach((button) => button.addEventListener('click', () => {
    const state = boundaryStates[Number(button.dataset.p02Boundary)];
    focused.querySelectorAll('[data-p02-boundary]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    focused.querySelector('[data-p02-boundary-index]').textContent = state[0];
    focused.querySelector('[data-p02-boundary-value]').textContent = state[1];
    focused.querySelector('[data-p02-boundary-explain]').textContent = state[2];
  }));
  const ruleStates = {
    controller: ['Controller에만 둔 경우', '웹 요청은 검사할 수 있지만 다른 진입점에는 같은 판단을 다시 구현해야 합니다.'],
    service: ['MemoService', '두 진입점 모두 같은 규칙을 거치게 설계할 수 있습니다.'],
  };
  focused.querySelectorAll('[data-p02-rule]').forEach((button) => button.addEventListener('click', () => {
    const state = ruleStates[button.dataset.p02Rule];
    focused.querySelectorAll('[data-p02-rule]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    focused.querySelector('[data-p02-rule-target]').textContent = state[0];
    focused.querySelector('[data-p02-rule-explain]').textContent = state[1];
  }));
  const memoryStates = {
    saved: ['메모 1건 보관', 'id=1 · title="첫 메모"', '이 예시에서는 GET /api/memos가 저장된 메모를 돌려줍니다.'],
    restarted: ['저장소가 비어 있습니다', 'ConcurrentHashMap = {}', '새 앱의 메모리에는 이전 프로세스의 메모가 남아 있지 않습니다.'],
  };
  focused.querySelectorAll('[data-p02-memory]').forEach((button) => button.addEventListener('click', () => {
    const state = memoryStates[button.dataset.p02Memory];
    focused.querySelectorAll('[data-p02-memory]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    const shelf = focused.querySelector('.p02-memory-state');
    shelf.dataset.empty = String(button.dataset.p02Memory === 'restarted');
    focused.querySelector('[data-p02-memory-title]').textContent = state[0];
    focused.querySelector('[data-p02-memory-row]').textContent = state[1];
    focused.querySelector('[data-p02-memory-note]').textContent = state[2];
  }));
  const dtoRequestStates = {
    allowed: ['{"title":"첫 메모","content":"계층을 나눴다"}', '현재 DTO가 받도록 선언한 두 값입니다.'],
    extra: ['{"title":"첫 메모","content":"계층을 나눴다","internalFlag":true}', 'internalFlag는 MemoCreateRequest에 선언돼 있지 않습니다. 처리 방식은 Jackson 설정에 따라 확인해야 합니다.'],
  };
  focused.querySelectorAll('[data-p02-dto-request]').forEach((button) => button.addEventListener('click', () => {
    const state = dtoRequestStates[button.dataset.p02DtoRequest];
    focused.querySelectorAll('[data-p02-dto-request]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    focused.querySelector('[data-p02-dto-input]').textContent = state[0];
    focused.querySelector('[data-p02-dto-explain]').textContent = state[1];
  }));
  const dtoSideStates = {
    internal: ['내부 도메인 record · Memo', '저장소가 보관한 Memo', 'id = 실행 뒤 정해짐\ntitle = "첫 메모"\ncontent = "계층을 나눴다"'],
    external: ['HTTP 응답 record · MemoResponse', 'API에 공개되는 값', 'id = 실행 뒤 정해지는 숫자\ntitle = "첫 메모"\ncontent = "계층을 나눴다"'],
  };
  focused.querySelectorAll('[data-p02-dto-side]').forEach((button) => button.addEventListener('click', () => {
    const state = dtoSideStates[button.dataset.p02DtoSide];
    focused.querySelectorAll('[data-p02-dto-side]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    focused.querySelector('[data-p02-dto-side-label]').textContent = state[0];
    focused.querySelector('[data-p02-dto-side-title]').textContent = state[1];
    focused.querySelector('[data-p02-dto-side-value]').textContent = state[2];
  }));
  const typeStates = {
    record: ['현재 P02 코드', 'MemoResponse · 불변 값 전달', 'public record MemoResponse(long id, String title, String content) {}', 'record 구성 요소는 생성 뒤 다시 대입할 수 없습니다. 이 실습은 인메모리 저장소를 사용합니다.'],
    entity: ['별도 JPA 설명 예시 · 현재 P02에 없음', 'JPA Entity · DB 영속 상태', '@Entity\nclass MemoEntity {\n    @Id Long id;\n    String title;\n}', '영속성 컨텍스트에서 관리되면 상태 변경을 추적할 수 있습니다. 이 타입은 P02 실습 코드에 만들지 않습니다.'],
  };
  focused.querySelectorAll('[data-p02-type]').forEach((button) => button.addEventListener('click', () => {
    const state = typeStates[button.dataset.p02Type];
    focused.querySelectorAll('[data-p02-type]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    for (const [selector, value] of [['[data-p02-type-kicker]',state[0]],['[data-p02-type-title]',state[1]],['[data-p02-type-code]',state[2]],['[data-p02-type-explain]',state[3]]]) focused.querySelector(selector).textContent = value;
  }));
  focused.querySelectorAll('[data-p02-di-phase]').forEach((button) => button.addEventListener('click', () => {
    const isRequest = button.dataset.p02DiPhase === 'request';
    focused.querySelectorAll('[data-p02-di-phase]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    focused.querySelector('.p02-di-flow').hidden = isRequest;
    focused.querySelector('.p02-di-call').hidden = !isRequest;
    focused.querySelector('[data-p02-di-explain]').textContent = isRequest
      ? '요청 중에는 이미 조립된 객체들의 메서드를 Controller → Service → Repository 순서로 호출합니다.'
      : '앱 시작 시 Spring이 구현체·Service·Controller를 만들고 생성자 의존성을 연결합니다.';
  }));
  const packageStates = {
    feature: ['현재 실습 · 기능별 최상위', 'com.example.memo\n├─ api/          MemoController · MemoCreateRequest · MemoResponse\n├─ application/  MemoService\n├─ domain/       Memo\n└─ repository/   MemoRepository · InMemoryMemoRepository', '메모 기능을 찾을 때 관련 파일이 가까이 있습니다.'],
    layer: ['비교 예시 · 계층별', 'com.example.memo\n├─ controller/  MemoController\n├─ service/     MemoService\n└─ repository/  MemoRepository · InMemoryMemoRepository', '작은 프로젝트에서는 단순하지만 기능이 늘면 한 기능의 파일이 흩어질 수 있습니다.'],
  };
  focused.querySelectorAll('[data-p02-package]').forEach((button) => button.addEventListener('click', () => {
    const state = packageStates[button.dataset.p02Package];
    focused.querySelectorAll('[data-p02-package]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    focused.querySelector('[data-p02-package-caption]').textContent = state[0];
    focused.querySelector('[data-p02-package-tree]').textContent = state[1];
    focused.querySelector('[data-p02-package-explain]').textContent = state[2];
  }));
  focused.querySelectorAll('[data-p02-command]').forEach((button) => button.addEventListener('click', async () => {
    const code = button.closest('div').querySelector('pre code');
    const state = focused.querySelector('[data-p02-command-state]');
    try {
      await navigator.clipboard.writeText(code.textContent);
      state.textContent = `${button.dataset.p02Command.toUpperCase()} 명령을 복사했습니다.`;
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      state.textContent = '명령을 선택했습니다. 직접 복사해 주세요.';
    }
  }));
}
