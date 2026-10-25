const POST_BODY = { title: '첫 게시글', content: '본문을 저장합니다.', tags: ['spring'] };
const SOURCE = {
  controller: 'board-server/src/main/java/com/example/board/post/PostController.java',
  create: 'board-server/src/main/java/com/example/board/post/PostCreateRequest.java',
  detail: 'board-server/src/main/java/com/example/board/post/PostDetailResponse.java',
  update: 'board-server/src/main/java/com/example/board/post/PostUpdateRequest.java',
  patch: 'board-server/src/main/java/com/example/board/post/PostPatchRequest.java',
  list: 'board-server/src/main/java/com/example/board/post/PostListRequest.java',
  query: 'board-server/src/main/java/com/example/board/post/PostQueryService.java',
  mapper: 'board-server/src/main/resources/mapper/PostQueryMapper.xml',
  likeController: 'board-server/src/main/java/com/example/board/post/PostLikeController.java',
  likeService: 'board-server/src/main/java/com/example/board/post/PostLikeService.java',
  schema: 'board-server/src/main/resources/schema.sql',
  service: 'board-server/src/main/java/com/example/board/post/PostServiceImpl.java',
};

const postSql = [
  { title: '글 행 확인 예시', sql: 'SELECT id, member_id, title, status, like_count, created_at, updated_at FROM post WHERE id = :postId;', explanation: 'postId 자리에 확인할 글 ID를 넣습니다. 삭제 뒤에도 행이 남고 status가 DELETED인지 살펴봅니다.' },
];
const detailChecks = ['응답 JSON에 id, title, content, tags 배열이 있는지 확인합니다.', '반환된 본문은 서버의 실제 응답 그대로이며 조회수 증가를 가정하지 않습니다.'];

export const COURSE_API_CONTRACTS = [
  {
    id: 'create', stepId: 'D04-5', label: '게시글 생성', method: 'POST', path: '/api/posts', expectedStatus: 201,
    bodyKind: 'empty', requestBody: POST_BODY, requiresId: false, requiresAuth: true,
    sourceFiles: [SOURCE.controller, SOURCE.create, SOURCE.service], dbSql: [
      { title: '생성한 글 확인 예시', sql: 'SELECT id, member_id, title, status, like_count, created_at, updated_at FROM post WHERE id = :postId;', explanation: '생성 응답의 Location에서 확인한 ID를 사용합니다. post와 회원·태그 관계를 직접 확인하는 예시이며 SQL은 자동 실행하지 않습니다.' },
    ],
    expectedChecks: ['상태가 201인지 확인합니다.', '성공 본문은 비어 있어야 합니다.', '응답 Location이 노출되면 같은 서버의 /api/posts/{양의 정수}인지 확인합니다. 본문 id를 대신 사용하지 않습니다.'],
    description: '게시글 생성 요청입니다. main 구현은 201과 Location 헤더를 반환하고 응답 본문은 비웁니다.',
  },
  {
    id: 'detail', stepId: 'D05-1', label: '게시글 상세 조회', method: 'GET', path: '/api/posts/{postId}', expectedStatus: 200,
    bodyKind: 'detail', requestBody: null, requiresId: true, requiresAuth: false,
    sourceFiles: [SOURCE.controller, SOURCE.detail, SOURCE.service], dbSql: postSql,
    expectedChecks: detailChecks,
    description: '게시글 상세를 조회합니다. 조회수 변경이나 증가를 가정하지 않고 실제 JSON을 확인합니다.',
  },
  {
    id: 'replace', stepId: 'D05-2', label: '게시글 전체 수정', method: 'PUT', path: '/api/posts/{postId}', expectedStatus: 200,
    bodyKind: 'detail', requestBody: POST_BODY, requiresId: true, requiresAuth: true,
    sourceFiles: [SOURCE.controller, SOURCE.update, SOURCE.detail, SOURCE.service], dbSql: postSql,
    expectedChecks: [...detailChecks, 'PUT은 필수 title과 content를 보내는 전체 수정 요청입니다. tags는 생략할 수 있으며, 생략하면 서버에서 빈 태그 목록으로 교체해 기존 태그를 제거합니다.'],
    description: '게시글의 전체 수정 요청입니다. 성공하면 수정된 상세 JSON을 반환합니다.',
  },
  {
    id: 'partial', stepId: 'D05-2', label: '게시글 일부 수정', method: 'PATCH', path: '/api/posts/{postId}', expectedStatus: 200,
    bodyKind: 'detail', requestBody: { title: '수정한 제목' }, requiresId: true, requiresAuth: true,
    sourceFiles: [SOURCE.controller, SOURCE.patch, SOURCE.detail, SOURCE.service], dbSql: postSql,
    expectedChecks: [...detailChecks, 'PATCH는 보낸 필드만 변경합니다. 생략한 필드는 기존 값을 유지합니다.'],
    description: '게시글 일부 수정 요청입니다. 예시 본문은 제목만 변경하며 성공 응답은 상세 JSON입니다.',
  },
  {
    id: 'delete', stepId: 'D05-2', label: '게시글 삭제', method: 'DELETE', path: '/api/posts/{postId}', expectedStatus: 204,
    bodyKind: 'empty', requestBody: null, requiresId: true, requiresAuth: true,
    sourceFiles: [SOURCE.controller, SOURCE.service, SOURCE.schema], dbSql: [
      { title: '삭제 후 상태 확인 예시', sql: 'SELECT id, member_id, title, status, like_count, created_at, updated_at FROM post WHERE id = :postId;', explanation: 'main 구현의 삭제는 행을 남기고 status를 DELETED로 바꿉니다. postId를 실제 ID로 바꾸어 확인합니다. SQL은 실행하지 않습니다.' },
    ],
    expectedChecks: ['상태가 204이고 응답 본문이 비어 있는지 확인합니다.', '행 수가 0인지가 아니라 같은 id의 status가 DELETED인지 확인합니다.'],
    description: '게시글 삭제 요청입니다. 성공 응답은 204이며 본문이 없습니다. main 구현은 논리 삭제합니다.',
  },
  {
    id: 'like', stepId: 'D05-6', label: '좋아요 등록', method: 'PUT', path: '/api/posts/{postId}/like', expectedStatus: 204,
    bodyKind: 'empty', requestBody: null, requiresId: true, requiresAuth: true,
    sourceFiles: [SOURCE.likeController, SOURCE.likeService, SOURCE.schema], dbSql: [
      { title: '좋아요 행 확인 예시', sql: 'SELECT post_id, member_id, created_at FROM post_like WHERE post_id = :postId;', explanation: '해당 글의 좋아요 관계 행을 확인합니다. 현재 사용자만 좁히려면 AND member_id = :memberId를 추가합니다.' },
      { title: '좋아요 수 확인 예시', sql: 'SELECT id, like_count FROM post WHERE id = :postId;', explanation: 'post.like_count와 post_like 행 수가 일치하는지 관찰합니다. 학습자의 DB 설계에 맞게 조정하고 직접 실행합니다.' },
    ],
    expectedChecks: ['상태가 204이고 응답 본문이 비어 있는지 확인합니다.', '같은 회원의 반복 요청은 멱등이며 좋아요 행과 like_count를 직접 관찰합니다.'],
    description: '현재 인증 회원의 좋아요 등록 요청입니다. 성공 응답은 204이며 본문이 없습니다.',
  },
  {
    id: 'unlike', stepId: 'D05-6', label: '좋아요 취소', method: 'DELETE', path: '/api/posts/{postId}/like', expectedStatus: 204,
    bodyKind: 'empty', requestBody: null, requiresId: true, requiresAuth: true,
    sourceFiles: [SOURCE.likeController, SOURCE.likeService, SOURCE.schema], dbSql: [
      { title: '좋아요 행 확인 예시', sql: 'SELECT post_id, member_id, created_at FROM post_like WHERE post_id = :postId;', explanation: '취소 뒤 해당 회원의 관계 행이 사라졌는지 확인합니다. 현재 사용자만 좁히려면 AND member_id = :memberId를 추가합니다.' },
      { title: '좋아요 수 확인 예시', sql: 'SELECT id, like_count FROM post WHERE id = :postId;', explanation: '취소 뒤 like_count와 남은 post_like 행 수를 관찰합니다. SQL은 자동 실행하지 않습니다.' },
    ],
    expectedChecks: ['상태가 204이고 응답 본문이 비어 있는지 확인합니다.', '좋아요 관계 행과 like_count 변화를 직접 관찰합니다.'],
    description: '현재 인증 회원의 좋아요 취소 요청입니다. 성공 응답은 204이며 본문이 없습니다.',
  },
  {
    id: 'list', stepId: 'D06-4', label: '게시글 목록 조회', method: 'GET', path: '/api/posts', expectedStatus: 200,
    bodyKind: 'cursor', requestBody: null, requiresId: false, requiresAuth: false,
    sourceFiles: [SOURCE.controller, SOURCE.list, SOURCE.query, SOURCE.mapper, SOURCE.schema], dbSql: [
      { title: '최근 게시글 순서 확인 예시', sql: "SELECT id, member_id, title, status, like_count, created_at, updated_at FROM post WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 20;", explanation: 'main 구현은 활성 글을 id 내림차순으로 읽습니다. 커서가 있으면 직전 페이지의 마지막 id보다 작은 id부터 이어집니다.' },
    ],
    expectedChecks: ['응답 JSON에 items 배열과 nextCursor 문자열 또는 null이 있는지 확인합니다.', '목록은 활성 글을 id 내림차순으로 반환하며 다음 요청에는 cursor를 사용합니다.', '지원 query는 cursor, size, keyword, tag, sort이며 page는 사용하지 않습니다.'],
    description: '게시글 목록 조회입니다. cursor 기반 페이지네이션을 사용하고 main SQL의 정렬은 id 내림차순입니다.',
  },
];

const contractsByStep = new Map();
for (const contract of COURSE_API_CONTRACTS) {
  const contracts = contractsByStep.get(contract.stepId) ?? [];
  contracts.push(contract);
  contractsByStep.set(contract.stepId, contracts);
}

export function contractsForStep(stepId) {
  return contractsByStep.get(stepId) ?? [];
}

export function normalizeApiBase(base) {
  if (typeof base !== 'string' || !base.trim()) throw new Error('API 주소를 입력해 주세요.');
  let url;
  try { url = new URL(base.trim()); } catch { throw new Error('API 주소가 올바르지 않습니다.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('API 주소는 HTTP 또는 HTTPS의 origin만 입력해 주세요.');
  }
  return url.origin;
}

export function readCreatedPostId(location, requestUrl) {
  if (typeof location !== 'string' || !location.trim() || typeof requestUrl !== 'string') return null;
  try {
    const request = new URL(requestUrl);
    const target = new URL(location, request);
    if (target.origin !== request.origin || target.search || target.hash) return null;
    const match = /^\/api\/posts\/([1-9][0-9]*)$/.exec(target.pathname);
    return match?.[1] ?? null;
  } catch { return null; }
}

function positiveId(id) {
  return typeof id === 'string' && /^[1-9][0-9]*$/.test(id);
}

export function makeRequest(contract, { base, id, body, query, token } = {}) {
  if (!contract || !COURSE_API_CONTRACTS.includes(contract)) throw new Error('알 수 없는 API 계약입니다.');
  const origin = normalizeApiBase(base);
  let path = contract.path;
  if (contract.requiresId) {
    if (!positiveId(id)) throw new Error('글 ID는 0으로 시작하지 않는 양의 정수 문자열이어야 합니다.');
    path = path.replace('{postId}', id);
  }
  const url = new URL(path, `${origin}/`);
  if (contract.id === 'list' && query && typeof query === 'object') {
    for (const key of ['cursor', 'size', 'keyword', 'tag', 'sort']) {
      const value = query[key];
      if (value != null && String(value) !== '') url.searchParams.set(key, String(value));
    }
  }
  const headers = {};
  if (typeof token === 'string' && token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  const result = { url: url.href, method: contract.method, headers };
  if (contract.requestBody !== null) {
    const requestBody = body === undefined ? contract.requestBody : body;
    result.headers['Content-Type'] = 'application/json';
    result.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
  }
  return result;
}

export function evaluateApiResponse(contract, { status, body, location, requestUrl } = {}) {
  const statusMatches = Number(status) === contract?.expectedStatus;
  let parsed;
  let parseError = false;
  if (typeof body === 'string') {
    if (body.trim() !== '') {
      try { parsed = JSON.parse(body); } catch { parseError = true; }
    }
  } else if (body != null && body !== '') parsed = body;

  let bodyMatches = false;
  if (contract?.bodyKind === 'empty') {
    bodyMatches = typeof body === 'string' ? body.trim() === '' : body == null || body === '';
  } else if (!parseError && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (contract.bodyKind === 'detail') {
      bodyMatches = Object.hasOwn(parsed, 'id') && Object.hasOwn(parsed, 'title') && Object.hasOwn(parsed, 'content') && Array.isArray(parsed.tags);
    } else if (contract.bodyKind === 'cursor') {
      bodyMatches = Array.isArray(parsed.items) && (typeof parsed.nextCursor === 'string' || parsed.nextCursor === null);
    }
  }

  const createdId = contract?.id === 'create' && statusMatches && bodyMatches
    ? readCreatedPostId(location, requestUrl)
    : null;
  let note;
  if (!contract) note = 'API 계약을 확인할 수 없습니다.';
  else if (!statusMatches) note = `기대 상태는 ${contract.expectedStatus}이지만 실제 상태는 ${status ?? '확인 불가'}입니다. 아래 본문은 서버가 반환한 원문입니다.`;
  else if (parseError) note = '응답 본문이 JSON 형식이 아닙니다. 서버가 반환한 원문을 그대로 확인해 주세요.';
  else if (!bodyMatches) note = contract.bodyKind === 'empty'
    ? '성공 상태 코드와 달리 응답 본문이 비어 있지 않습니다. 서버 원문을 확인해 주세요.'
    : '응답 JSON의 필수 구조가 기대한 형태와 다릅니다. 서버 원문을 확인해 주세요.';
  else if (contract.id === 'create' && !location) note = '201과 빈 본문은 확인했습니다. Location 헤더를 읽을 수 없어 생성 ID는 판별하지 못했습니다.';
  else if (contract.id === 'create' && !createdId) note = '201과 빈 본문은 확인했지만 Location이 같은 서버의 정확한 /api/posts/{양의 정수} 경로가 아닙니다. ID를 추정하지 않았습니다.';
  else note = `기대 상태 ${contract.expectedStatus}와 응답 본문 형식을 확인했습니다. 이는 형식 확인이며 학습 과제의 자동 채점 결과가 아닙니다.`;
  return { statusMatches, bodyMatches, createdId, note };
}
