import { COURSE_POST_STATES, getCoursePostModel } from './course-post-model.mjs';

const e = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const summaries = {
  created: 'new로 초기화한 Post가 생겼지만 새 DB 행은 없습니다.',
  linked: 'Java 관계 객체가 생겼습니다. PostTag.post는 같은 Post@A를 참조합니다.',
  inserted: 'INSERT가 반영됐어도 아직 commit 전입니다. 별도 새 SELECT와 비교하세요.',
  committed: 'commit으로 확정돼 새 연결에서도 글과 연결 행이 보입니다.',
  'rolled-back': '커밋 전 오류의 대안 분기입니다. Java는 현재 실측값이 아닌 마지막 INSERT 스냅샷입니다.',
};
const field = (label, value, attr = '') => `<div><dt>${e(label)}</dt><dd${attr}>${e(value)}</dd></div>`;
const dl = (items) => `<dl class="cpv-fields">${items.join('')}</dl>`;
function javaFields(m) {
  const p = m.java.post;
  return dl([
    field('ref', p.ref), field('id', p.id === null ? 'null' : p.id, ' data-cpv-id'),
    field('title', p.title), field('member', `→ Member#${p.memberRef}`), field('status', p.status),
    field('likeCount', p.likeCount), field('createdAt', p.createdAt ?? 'null'),
  ]);
}
function postRows(rows) {
  if (!rows.length) return '<p class="cpv-empty">새 글 행 없음</p>';
  return rows.map((p) => dl([
    field('id', p.id), field('member_id', p.member_id), field('title', p.title),
    field('status', p.status), field('like_count', p.like_count), field('created_at', p.created_at),
  ])).join('');
}
function relationRows(rows) {
  return rows.length ? `<table class="cpv-links"><thead><tr><th>post_id</th><th>tag_id</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${e(r.post_id)}</td><td>${e(r.tag_id)}</td></tr>`).join('')}</tbody></table>` : '<p class="cpv-empty">post_tag 행 없음</p>';
}
function databaseLane(title, data, tagBadge = false) {
  return `<section class="cpv-lane"><h5>${title}</h5><h6>post</h6>${postRows(data.post)}<h6>post_tag</h6>${relationRows(data.postTag)}<h6>tag</h6><div class="cpv-tag"><span>${e(data.tag[0].id)}</span><strong>${e(data.tag[0].name)}</strong>${tagBadge ? '<small>원래 있던 태그</small>' : ''}</div></section>`;
}
function panel(state) {
  const m = getCoursePostModel(state.id);
  const branch = state.id === 'committed' || state.id === 'rolled-back'
    ? '<p class="cpv-branch">같은 INSERT 상태의 대안</p>' : '';
  const tagText = m.java.post.tags.length
    ? `postTags → PostTag@T; PostTag.post → Post@A (현재 id ${m.java.post.id ?? 'null'}), PostTag.tag → Tag#7 (spring)`
    : 'postTags: 빈 컬렉션';
  const http = m.http.status === null ? '' : `<p class="cpv-http">기대 ${e(m.http.status)} · Location ${e(m.http.location)} · 본문 없음</p>`;
  const codeLines = {
    created: ['return new Post(member, title, content);', 'Post.java#create'],
    linked: ['postTags.add(PostTag.create(this, tag));', 'Post.java#addTag'],
    inserted: ['Long postId = postRepository.save(post).getId();', 'PostServiceImpl#create'],
    committed: ['return ResponseEntity.created(URI.create("/api/posts/" + postId)).build();', 'PostController#create'],
    'rolled-back': ['// 커밋 전 예외 → 같은 트랜잭션의 쓰기를 rollback', 'PostServiceImpl#create'],
  }[state.id];
  const snapshot = state.id === 'rolled-back' ? '마지막 INSERT 스냅샷 · rollback 뒤 Java 현재값 미계측'
    : state.id === 'created' ? '객체 생성 직후 · 저장 전'
      : state.id === 'linked' ? '관계 객체 생성 뒤 · 저장 전'
        : state.id === 'inserted' ? 'INSERT 반영 뒤 · commit 전'
          : 'commit 확정 뒤 · Java 저장 시점 스냅샷';
  const laneTitle = state.id === 'committed' ? 'DB · commit으로 확정'
    : state.id === 'rolled-back' ? 'DB · rollback 뒤'
      : 'DB · 이 트랜잭션의 쓰기';
  return `<article class="cpv-panel" id="cpv-panel-${e(state.id)}" tabindex="0" data-cpv-panel="${e(state.id)}" role="tabpanel" aria-labelledby="cpv-state-${e(state.id)}" aria-label="${e(state.label)} 값 비교"${state.id === 'created' ? '' : ' hidden'}>
    ${branch}<p class="cpv-summary">${e(summaries[state.id])}</p>
    <p class="cpv-snapshot">${e(snapshot)}</p>${http}
    <pre><code>${e(codeLines[0])}</code></pre><small class="cpv-code-label">${e(codeLines[1])} · 관찰할 한 줄 · 전체 정답은 기존 접기</small>
    <div class="cpv-columns"><section class="cpv-lane"><h5>Java</h5>${javaFields(m)}<h6>관리 상태</h6><p>${e(m.java.management)}</p><h6>관계 참조</h6><p>${e(tagText)}</p></section>
      ${databaseLane(laneTitle, m.app, true)}${databaseLane('별도 새 autocommit SELECT (RR/RC)', m.observer, true)}</div>
    <section class="cpv-sql"><h6>SQL 의미 예시</h6>${m.sql.map((line) => `<p>${e(line)}</p>`).join('')}<small>실행 로그가 아니라 의미 예시입니다.</small></section>
    <details class="cpv-details"><summary>예제의 전제와 코드 근거</summary><p>${e(m.note)}</p><p>${e(m.limits)}</p><p>모델 근거: tools/site/course-post-model.mjs</p><p>Java heap 계측은 없습니다. rollback이 Java 필드를 자동 초기화한다고 보장하지 않습니다.</p></details>
  </article>`;
}

export function renderCoursePostVisual({ stepId, rootPrefix = '../..' } = {}) {
  if (stepId !== 'D04-4') return '';
  const image = `${rootPrefix}/docs/design/course-integration-2026-10-24/images/Post-values-PC-dark-v4.jpg`;
  return `<section class="course-post-visual" data-cpv-root>
    <header class="cpv-header"><div><h3>객체·저장·확정을 값으로 비교</h3><p>회원 2 · 기존 태그 7(spring) · 예시 글 42. t0는 저장 시각을 뜻합니다. 실제 요청 결과와는 연결되지 않습니다.</p></div><span class="cpv-badge">고정 설명 예시 · 실제 API/DB 연결 없음</span></header>
    <div class="cpv-view-tabs" role="tablist" aria-label="설명 보기 선택">
      <button type="button" role="tab" id="cpv-view-values" aria-selected="true" aria-controls="cpv-values" data-cpv-view="values">단계별 값 비교</button>
      <button type="button" role="tab" id="cpv-view-figure" aria-selected="false" aria-controls="cpv-figure" data-cpv-view="figure" tabindex="-1">INSERT 후 그림</button>
    </div>
    <div data-cpv-values id="cpv-values" role="tabpanel" aria-labelledby="cpv-view-values"><p class="cpv-branch">객체 생성 → 관계 연결 → INSERT 후 → commit 또는 rollback</p><div class="cpv-state-tools" data-cpv-state-tools role="tablist" aria-label="설명 장면 선택">${COURSE_POST_STATES.map((s, i) => `<button type="button" role="tab" id="cpv-state-${e(s.id)}" data-cpv-state="${e(s.id)}" aria-controls="cpv-panel-${e(s.id)}" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}">${e(s.label)}</button>`).join('')}</div>
      ${COURSE_POST_STATES.map((s) => panel(s)).join('')}</div>
    <figure class="cpv-figure" data-cpv-figure id="cpv-figure" role="tabpanel" aria-labelledby="cpv-view-figure" hidden><a href="${e(image)}" target="_blank" rel="noopener noreferrer"><img src="${e(image)}" width="1536" height="1024" alt="Post INSERT 후·commit 전 상태를 보여 주는 고정 참조 그림"></a><a class="cpv-image-link" href="${e(image)}" target="_blank" rel="noopener noreferrer">그림 원본 크게 보기</a><figcaption>INSERT 후 commit 전, Post와 PostTag가 참조하는 값을 보여 주는 그림입니다. 단계별 값 비교는 왼쪽 탭에서 볼 수 있습니다.</figcaption></figure>
  </section>`;
}
