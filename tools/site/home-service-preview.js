const SAMPLE_POSTS = [
  { id: '1', title: '처음 만든 게시글이 DB에 남았어요', author: '김자바', avatar: '김', color: 'blue', content: '제목과 본문을 받아 게시글을 저장하는 기능을 만들었어요.\n\n요청으로 보낸 값이 DB의 한 행으로 남는 것을 직접 확인했습니다. 다음에는 저장한 글을 다시 조회해 보려고 해요.', comment: true },
  { id: '2', title: 'DTO와 Entity, 이제 구분이 돼요', author: '이코딩', avatar: '이', color: 'green', content: '처음에는 둘 다 비슷한 객체처럼 보였어요.\n\n요청과 응답에 필요한 값은 DTO로 전달하고, DB와 연결된 데이터는 Entity로 다루며 역할을 나눠 봤습니다.', comment: false },
  { id: '3', title: '같은 글이 두 번 보이지 않으려면?', author: '박개발', avatar: '박', color: 'purple', content: '글 목록을 여러 번 불러오면서 같은 글이 겹치는 상황을 살펴봤어요.\n\n정렬 기준과 마지막으로 읽은 위치를 함께 사용하면 어떤 점이 달라질까요? 목록 조회 과제에서 확인해 보려고 합니다.', comment: false },
];

/** 외부 통신과 학습 진도 저장 없이 현재 DOM 안에서만 예시 게시판을 제어한다. */
export function initHomeServicePreview(doc = globalThis.document) {
  const board = doc?.querySelector('[data-service-board]');
  if (!board || board.dataset.serviceReady) return;
  board.dataset.serviceReady = 'true';
  const $ = (selector) => board.querySelector(selector);
  const posts = SAMPLE_POSTS.map((post) => ({ ...post }));
  let selected = posts[0].id;
  const form = $('[data-service-form]');
  const titleInput = $('#home-service-title');
  const contentInput = $('#home-service-content');
  const status = $('[data-service-status]');
  const detail = $('[data-service-detail]');
  const compose = $('[data-service-compose]');
  const list = $('[data-service-posts]');

  function showDetail(id, focus = true) {
    const post = posts.find((item) => item.id === id);
    if (!post) return;
    selected = id;
    board.dataset.serviceMode = 'detail';
    compose.hidden = true; detail.hidden = false;
    $('[data-service-detail-title]').textContent = post.title;
    $('[data-service-detail-author]').textContent = post.author;
    $('[data-service-detail-avatar]').textContent = post.avatar;
    $('[data-service-detail-avatar]').className = `home-service-avatar home-service-avatar-${post.color}`;
    $('[data-service-detail-content]').textContent = post.content;
    $('[data-service-comment]').hidden = !post.comment;
    for (const button of list.querySelectorAll('[data-service-post]')) {
      if (button.dataset.servicePost === selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    if (focus) $('[data-service-detail-title]').focus();
  }

  function renderList() {
    list.replaceChildren();
    for (const post of posts) {
      const button = doc.createElement('button');
      button.type = 'button'; button.className = 'home-service-post'; button.dataset.servicePost = post.id;
      const avatar = doc.createElement('span');
      avatar.className = `home-service-avatar home-service-avatar-${post.color}`; avatar.setAttribute('aria-hidden', 'true'); avatar.textContent = post.avatar;
      const copy = doc.createElement('span'); copy.className = 'home-service-post-copy';
      const title = doc.createElement('strong'); title.textContent = post.title;
      const excerpt = doc.createElement('span'); excerpt.className = 'home-service-excerpt'; excerpt.textContent = post.content.replaceAll('\n', ' ');
      const meta = doc.createElement('small'); meta.textContent = `${post.author} · 예시 게시글`;
      copy.append(title, excerpt, meta); button.append(avatar, copy);
      button.addEventListener('click', () => showDetail(post.id)); list.append(button);
    }
  }
  function showList() {
    compose.hidden = true; detail.hidden = false; board.dataset.serviceMode = 'list';
    list.querySelector(`[data-service-post="${selected}"]`)?.focus();
  }
  function validate(input, label) {
    const error = $(`#${input.id}-error`);
    const invalid = !input.value.trim();
    input.setAttribute('aria-invalid', String(invalid));
    error.hidden = !invalid; error.textContent = invalid ? `${label}을 입력해 주세요.` : '';
    return !invalid;
  }
  $('[data-service-write]').addEventListener('click', () => {
    detail.hidden = true; compose.hidden = false; board.dataset.serviceMode = 'write'; titleInput.focus();
  });
  $('[data-service-back]').addEventListener('click', showList);
  $('[data-service-cancel]').addEventListener('click', showList);
  for (const [input, label] of [[titleInput, '제목'], [contentInput, '본문']]) {
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(input, label); });
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const titleValid = validate(titleInput, '제목'); const contentValid = validate(contentInput, '본문');
    if (!titleValid || !contentValid) { (titleValid ? contentInput : titleInput).focus(); return; }
    const post = { id: String(posts.length + 1), title: titleInput.value.trim(), content: contentInput.value.trim(), author: '나', avatar: '나', color: 'blue', comment: false };
    posts.unshift(post); renderList(); showDetail(post.id); form.reset();
    status.textContent = '예시 글이 목록과 상세에 추가됐어요. 이 화면에서만 보이며, 실제 서버나 DB에는 저장되지 않습니다.';
  });
  renderList(); showDetail(selected, false); board.dataset.serviceMode = 'list';
}
