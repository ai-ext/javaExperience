// 홈의 추천·완료 기준은 각 시나리오 원문에서 명시한다. 첫 API를 저장 API로 오인하지 않게 한다.
export const TASKS = {
  '0-1': { id: '0-1', title: '이름을 받아 인사하는 첫 API', group: '백엔드 첫걸음', description: '이름 하나가 Java 코드로 들어와 JSON 응답이 되는 과정을 만듭니다.', api: 'GET /api/start/hello', work: 'Greeting.java와 GreetingController.java 만들기', goal: '이름을 넣은 요청과 이름 없는 요청의 JSON 응답 비교', href: 'scenario/ch0-first-steps/0-1-ts-to-java.html', next: '0-2', preview: 'greeting', panel: 'data-first-java-panel', go: 'data-first-java-go', journey: '.first-java-journey' },
  '0-2': { id: '0-2', title: '어노테이션으로 요청 경로 연결하기', group: '백엔드 첫걸음', description: 'Spring이 Controller와 요청 주소를 어떻게 찾는지 직접 확인합니다.', api: 'GET /api/start/ping', work: 'PingController.java 작성 후 어노테이션 실험', goal: '정상 요청의 pong과 매핑 제거 후 404 비교', href: 'scenario/ch0-first-steps/0-2-annotations.html', nextHref: 'scenario/ch0-first-steps/0-3-request-four-places.html', preview: 'ping', panel: 'data-first-java-panel', go: 'data-first-java-go', journey: '.first-java-journey' },
  '1-1': { id: '1-1', title: '게시글 작성 요청 받기', group: '서비스 만들기 · 게시글 작성', description: '제목과 본문을 받아 요청이 들어왔다는 응답을 돌려줍니다. DB 저장은 다음 단계에서 합니다.', api: 'POST /api/posts', work: '요청 DTO와 PostController.java 작성', goal: '요청 본문을 받고 200 success 응답 확인', href: 'scenario/ch1-create-post/1-1-receive-request.html', next: '1-2', preview: 'receive', panel: 'data-journey-screen', go: 'data-journey-go', journey: '.first-api-journey' },
  '1-2': { id: '1-2', title: '게시글을 DB에 저장하기', group: '서비스 만들기 · 게시글 작성', description: '객체와 테이블을 연결하고, 저장한 글의 id로 결과를 확인합니다.', api: 'POST /api/posts', work: 'Post.java부터 필드·생성자·매핑 작성', goal: '201 응답의 id와 같은 DB 행을 직접 확인', href: 'scenario/ch1-create-post/1-2-dto-response.html', nextHref: 'scenario/ch1-create-post/1-3-service-layer.html', preview: 'store', panel: 'data-db-panel', go: 'data-db-go', journey: '.first-db-journey' },
  'DB-01': { id: 'DB-01', title: '게시글 목록에서 첫 SQL까지', group: 'DB 학습 · practice', description: '응답에 필요한 제목과 작성자 이름을 테이블·열·SQL로 연결합니다.', api: 'GET /api/boards/dev/posts', work: 'practice DB에서 응답 필드의 출처 찾기', goal: '직접 실행한 SELECT 결과와 응답에 필요한 필드 비교', href: 'scenario/db-query-journey/db-01-response-to-query.html', next: 'DB-02', preview: 'query', panel: 'data-db01-panel', go: 'data-db01-go', journey: '.db01-focused' },
  'DB-02': { id: 'DB-02', title: '조건과 커서로 목록 나누기', group: 'DB 학습 · practice', description: '조회 조건과 정렬 기준을 맞춰 다음 목록을 가져오는 SQL을 만듭니다.', api: 'GET /api/boards/dev/posts', work: 'SELECT·WHERE·정렬과 커서 조건 비교', goal: '직접 실행한 목록의 순서와 다음 묶음 경계 확인', href: 'scenario/db-query-journey/db-02-select-cursor.html', nextHref: 'scenario/db-query-journey/db-03-detail-join.html', preview: 'cursor', panel: 'data-db02-panel', go: 'data-db02-go', journey: '.db02-focused' },
  'flow-create': { id: 'flow-create', functionalId: 'create', title: '게시글 작성', group: '기능 완성 · 게시글', description: '인증한 회원의 글과 태그를 DB에 저장하고, 생성된 글 정보를 응답합니다.', api: 'POST /api/posts', work: 'PostService.java의 create(...) 메서드 구현', goal: '201·Location·생성 id와 같은 DB 행 확인', href: 'scenario/flow/create-post.html', next: 'flow-detail', preview: 'store' },
  'flow-detail': { id: 'flow-detail', functionalId: 'detail', title: '게시글 상세 조회', group: '기능 완성 · 게시글', description: '작성한 글을 읽고, 볼 수 있는 글의 조회수만 1 올립니다.', api: 'GET /api/posts/{id}', work: 'PostQueryService.java의 getDetail(...) 메서드 구현', goal: '200·조회수 v+1, 없는 글과 볼 수 없는 글 404 확인', href: 'scenario/flow/read-post.html', next: 'flow-list', preview: 'detail' },
  'flow-list': { id: 'flow-list', functionalId: 'list', title: '게시글 목록 조회', group: '기능 완성 · 게시글', description: '볼 수 있는 글을 최신순으로 나누고 전체 건수와 다음 페이지 여부를 반환합니다.', api: 'GET /api/boards/{slug}/posts?page=0&size=10', work: 'PostQueryService.java의 list(...) 메서드 구현', goal: '조건·정렬·페이징과 같은 조건의 COUNT, DB 값 불변 확인', href: 'scenario/flow/list-posts.html', next: 'flow-update', preview: 'list' },
  'flow-update': { id: 'flow-update', functionalId: 'update', title: '게시글 부분 수정', group: '기능 완성 · 게시글', description: '작성자가 보낸 non-null 값만 고치고 태그 생략·null·빈 배열의 뜻을 구분합니다.', api: 'PATCH /api/posts/{id}', work: 'PostService.java의 patch(...) 메서드 구현', goal: '보낸 값만 변경, tags null/생략 유지·[] 연결 해제 확인', href: 'scenario/flow/update-post.html', next: 'flow-delete', preview: 'update' },
  'flow-delete': { id: 'flow-delete', functionalId: 'delete', title: '게시글 삭제', group: '기능 완성 · 게시글', description: '삭제 시각을 기록하고, 행과 연결을 보존하며 일반 조회에서 제외합니다.', api: 'DELETE /api/posts/{id}', work: 'PostService.java의 delete(...) 메서드 구현', goal: '204 빈 응답, deleted_at·updated_at 변경, 상세 404·목록 제외 확인', href: 'scenario/flow/delete-post.html', next: 'flow-like', preview: 'delete' },
  'flow-like': { id: 'flow-like', functionalId: 'like', title: '좋아요 설정', group: '기능 확장 · 좋아요', description: '다른 회원의 새 글에 좋아요를 설정하고 같은 요청의 결과를 유지합니다.', api: 'PUT /api/posts/{id}/like', work: 'LikeService.java의 like(...) 메서드 구현', goal: '200·liked=true·관계 한 행·전체 카운트와 반복 요청 비교', href: 'scenario/flow/like-post.html', next: 'flow-unlike', preview: 'like' },
  'flow-unlike': { id: 'flow-unlike', functionalId: 'unlike', title: '좋아요 취소', group: '기능 확장 · 좋아요', description: '내 관계만 제거하고 다른 회원의 좋아요와 글은 보존합니다.', api: 'DELETE /api/posts/{id}/like', work: 'LikeService.java의 unlike(...) 메서드 구현', goal: '200·liked=false·관계 한 행 제거·반복 DELETE 추가 감소 없음', href: 'scenario/flow/unlike-post.html', nextHref: 'scenario/ch4-like/4-2-like-concurrency.html', preview: 'unlike' },
};
export const PROGRESS_KEY = 'javaexperience.home.progress.v1';
const empty = () => ({ version: 1, selected: '0-1', active: null, pendingStart: null, records: {} });
const known = (id) => Object.hasOwn(TASKS, id);
export function readProgress(storage) {
  try {
    const value = JSON.parse(storage.getItem(PROGRESS_KEY));
    if (value?.version !== 1) return empty();
    const state = empty();
    if (['0-1', '1-1', 'DB-01', 'flow-create'].includes(value.selected)) state.selected = value.selected;
    for (const [id, record] of Object.entries(value.records || {})) {
      if (!known(id) || !['in-progress', 'complete'].includes(record?.status)) continue;
      const scene = record.scene;
      state.records[id] = { status: record.status, updatedAt: String(record.updatedAt || ''), scene: TASKS[id].panel && scene?.attribute === TASKS[id].panel && typeof scene.value === 'string' && scene.value.length < 80
        ? { attribute: scene.attribute, value: scene.value, label: String(scene.label || '').slice(0, 180) } : null };
    }
    if (known(value.active) && state.records[value.active]) state.active = value.active;
    if (state.active && value.pendingStart === state.selected && state.selected !== state.active) state.pendingStart = state.selected;
    return state;
  } catch { return empty(); }
}
function persist(state, storage) { try { storage.setItem(PROGRESS_KEY, JSON.stringify(state)); } catch {} return state; }
export function chooseStart(state, id, storage) {
  if (!['0-1', '1-1', 'DB-01', 'flow-create'].includes(id)) throw new Error('알 수 없는 시작점');
  return persist({ ...state, selected: id, pendingStart: state.active && state.active !== id ? id : null }, storage);
}
export function startTask(state, id, storage) {
  if (!known(id)) throw new Error('알 수 없는 과제');
  const record = state.records[id];
  return persist({ ...state, active: id, pendingStart: null, records: { ...state.records, [id]: { ...record, scene: record?.scene ?? null, status: record?.status || 'in-progress', updatedAt: new Date().toISOString() } } }, storage);
}
export function saveScene(state, id, scene, storage) {
  if (state.active !== id || state.records[id]?.status !== 'in-progress') return state;
  return persist({ ...state, records: { ...state.records, [id]: { ...state.records[id], scene, updatedAt: new Date().toISOString() } } }, storage);
}
export function completeTask(state, id, storage) {
  if (state.active !== id || !state.records[id]) return state;
  return persist({ ...state, records: { ...state.records, [id]: { ...state.records[id], status: 'complete', updatedAt: new Date().toISOString() } } }, storage);
}
export function homeView(state) {
  const previewingSelection = Boolean(state.active && state.pendingStart === state.selected && state.pendingStart !== state.active);
  const task = TASKS[previewingSelection ? state.pendingStart : state.active || state.selected] || TASKS['0-1'];
  const record = previewingSelection ? state.records[task.id] || null : state.records[state.active];
  return {
    task, record,
    mode: previewingSelection ? 'selection' : record?.status === 'complete' ? 'complete' : state.active ? 'resume' : 'first',
    next: TASKS[task.next] || null,
    previewingSelection,
    returnTask: previewingSelection ? TASKS[state.active] : null,
    returnRecord: previewingSelection ? state.records[state.active] : null,
  };
}

export function reopenTask(state, id, storage) {
  if (state.active !== id || state.records[id]?.status !== 'complete') return state;
  return persist({ ...state, records: { ...state.records, [id]: { ...state.records[id], status: 'in-progress', updatedAt: new Date().toISOString() } } }, storage);
}
