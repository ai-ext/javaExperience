import { FUNCTIONAL_DB_CHECKS, FUNCTIONAL_COMPLETION_GUIDES } from './functional-verification-data.mjs';
// 기능형 시나리오의 표시 계약. 기술 정본은 3-2 manifest가 가리키는 blob이다.
// 예상 장면은 서버 계측이 아니며 id·시각·전체 건수는 실행 때 수집한다.
export const FUNCTIONAL_CONTRACT = {
  snapshot: '3-2',
  manifest: 'scenario/snapshots/3-2.json',
  provenance: '파일별 blob이 정본입니다. manifest의 commit으로 git archive한 소스와 같지 않습니다.',
  actualResult: '미실행',
  observation: '별도 DB 클라이언트에서 새 autocommit SELECT로 관찰합니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.',
  referencePackagePath: 'scenario/flow/packages/reference.zip',
};

const POST_DIR = 'src/main/java/org/example/post/';
const source = (file, symbol) => ({ snapshot: '3-2', path: POST_DIR + file + '.java', symbol });
const completion = (id, text, file, symbol) => ({ id, text, source: source(file, symbol) });
const concept = (label, file, anchor, reason) => ({ label, path: `docs/knowledge/${file}.md`, anchor, reason });
const legacy = (label, path, reason, anchor = '만들-것') => ({ label, path, anchor, reason });
const sharedProvided = [
  'Controller의 경로·HTTP 상태·DTO 변환',
  '요청·응답 DTO, 인증 토큰 확인, 예외 처리',
  'PostAccessPolicy와 목록 JPQL의 가시성 조건',
  'Repository, Entity의 상태 변경 메서드, 태그·검증 helper',
  'MySQL 스키마·연습 fixture·실행 설정',
];
const state = (id, title, summary, code, object, context, sql, database, observer, changes = [], branch = null) =>
  ({ id, title, summary, code, object, context, sql, database, observer, changes, ...(branch ? { branch } : {}) });
const visualization = (initialState, states) => ({
  label: '학습용 예상 흐름 · 실제 서버 미실행',
  disclaimer: 'SQL은 변경 의미를 보여 주는 개략 예시입니다. Hibernate의 실제 SQL 열·실행 순서·쿼리 수를 측정한 로그가 아닙니다.',
  initialState, states,
});
const capturedId = '{capturedId}';
const authorHeaders = { Authorization: 'Bearer tok-kimjava', 'Content-Type': 'application/json' };
const detailFields = ['id', 'boardSlug', 'title', 'content', 'tags', 'visibility', 'author.id', 'author.nickname', 'viewCount', 'likeCount', 'commentCount', 'createdAt'];
const taskSpecs = [
  {
    id: 'create', title: '게시글 작성', file: 'create-post', contractId: 'create',
    api: { method: 'POST', path: '/api/posts' },
    goal: '로그인한 회원의 글을 DB에 저장하고, 생성된 id와 글 정보를 201 응답으로 돌려줍니다.',
    situation: '회원이 dev 게시판에 제목·본문·태그를 입력해 등록합니다. 다음 과제는 이 응답에서 받은 id로 이어집니다.',
    target: source('PostService', 'create'),
    request: {
      headers: authorHeaders, query: {}, pathParams: {},
      body: { boardSlug: 'dev', title: '새 게시글', content: '본문', tags: ['spring', '새태그'], visibility: 'PUBLIC' },
      exampleLabel: '새 글의 예시입니다. 제목·본문을 바꿔 보낸 뒤 실제 응답의 id로 다음 기능을 이어갑니다.',
      sourcePath: 'scenario/ch3-update-delete/3-1-patch.md', sourceRequest: 'E0', sourceUsage: '계약 참고 · 예시값 재구성',
      rules: ['boardSlug·title·content는 공백 불가, title은 200자 이하', 'tags는 null 허용·최대 5개, 원소는 null 불가·1~30자', 'visibility 생략/null은 PUBLIC, 값이 있으면 PUBLIC 또는 FOLLOWERS'],
      authentication: '쓰기에는 유효한 Bearer 토큰이 필요합니다. 작성자는 본문의 authorId가 아니라 인증된 회원입니다.',
      capture: '응답 body.id를 capturedId로 기록하고 Location도 같은 id인지 확인합니다.',
    },
    actions: [
      'boardSlug로 게시판을 찾고 없으면 BoardNotFoundException을 던집니다.',
      '인증 회원을 작성자로 연결하고 운영자 전용 게시판의 쓰기 권한을 검사합니다.',
      'visibility가 null이면 PUBLIC으로 정하고, PUBLISHED·카운터 0인 Post를 만듭니다.',
      '제공된 resolveTags로 태그를 찾아 연결하고 postRepository.save로 저장합니다.',
      '트랜잭션 안에서 응답에 필요한 작성자·태그를 읽은 Post를 반환합니다.',
    ],
    completion: [
      completion('created', '201과 Location: /api/posts/{capturedId}를 받고 body.id를 다음 과제에 전달합니다.', 'PostController', 'create'),
      completion('saved', '인증 작성자·게시판·본문·태그 연결이 저장되고 카운터 0, deleted_at NULL입니다.', 'Post', 'Post'),
      completion('atomic', '글·새 태그·연결은 같은 트랜잭션입니다. 중간 실패 시 전체 저장이 취소됩니다.', 'PostService', 'create'),
      completion('defaults', 'visibility 생략/null은 PUBLIC이며 유효하지 않은 DTO 입력은 400으로 처리됩니다.', 'PostCreateRequest', 'PostCreateRequest'),
    ],
    expected: {
      status: 201, headers: { Location: '/api/posts/{capturedId}' },
      fields: ['id', 'boardSlug', 'title', 'content', 'tags', 'visibility', 'author.id', 'author.nickname', 'createdAt'],
      checks: ['id는 서버가 생성한 값', 'boardSlug는 보낸 값', 'title·content는 보낸 값', 'tags는 중복 제거된 이름 집합(순서에 의존하지 않음)', 'author는 입력한 유효 토큰의 회원'],
      dbChecks: FUNCTIONAL_DB_CHECKS.create,
      unchanged: [],
      failures: { 400: '빈 필수 필드·길이·공개 범위·깨진 JSON', 401: '토큰 없음·잘못된 형식·만료·폐기', 403: '비활성 회원 또는 게시판 쓰기 권한 없음', 404: '게시판 없음' },
      caveats: ['POST 태그는 최대 5개, 원소는 null 불가·1~30자입니다. 정본 DTO에는 원소 @NotBlank가 없어 공백 문자열 검증이 PATCH와 다릅니다.', 'IDENTITY의 INSERT와 id 할당은 commit 완료를 뜻하지 않습니다.'],
    },
    visualization: visualization('new-object', [
      state('new-object', '요청으로 객체 만들기', 'Post 생성자 직후입니다. 태그를 해석해 연결하기 전이며 아직 생성 id가 없습니다.', ['new Post(board, author, request.title(), request.content(), "PUBLISHED", visibility, now)'], ['id=null', 'title=새 게시글', 'content=본문', 'tags=[] (태그 연결 전)', 'viewCount=0 / likeCount=0 / commentCount=0', 'deletedAt=null'], ['새 객체: 아직 관리 상태 아님'], ['아직 post INSERT 전'], ['새 글 행 없음'], ['새 글을 조회할 수 없음'], ['request → Post']),
      state('identity-insert', 'save와 생성 id', '태그를 이름으로 해석·저장해 연결한 뒤 Post를 save합니다. IDENTITY id를 얻은 뒤에도 트랜잭션은 미확정입니다.', ['// 앞서 resolveTags(...)와 post.addTag(...) 수행', 'postRepository.save(post)'], ['id=DB가 생성한 capturedId', 'tags=[spring,새태그]', 'createdAt=updatedAt=publishedAt=now'], ['저장 객체는 관리 상태', '태그 연결도 같은 트랜잭션에 포함'], ['앞선 resolveTags: tag는 이름이 있으면 재사용하고 없으면 INSERT (Post save보다 먼저)', '현재 save: IDENTITY id 확보용 post INSERT', 'post_tag INSERT의 세부 시점은 미측정; flush 등에서 동기화'], ['앱 트랜잭션 내부: INSERT된 행', '아직 commit 전'], ['다른 연결의 일반 SELECT에는 아직 확정된 새 글이 없음'], ['id: null → capturedId']),
      state('create-commit', '정상 반환과 commit', 'Service 트랜잭션이 정상 종료된 뒤 Controller가 201 DTO를 응답합니다.', ['return saved;', 'ResponseEntity.created(URI.create("/api/posts/" + post.getId()))'], ['생성된 id·작성자·태그를 DTO로 변환'], ['flush 후 commit', 'OSIV=false: 필요한 연관은 서비스 안에서 읽음'], ['아직 미동기화된 연결 등 필요한 영속 변경을 자동 flush', 'COMMIT'], ['capturedId 행과 태그 연결 확정', 'status=PUBLISHED / deleted_at=NULL'], ['새 autocommit SELECT로 행·연결 관찰 가능'], ['DB 확정', '201 + Location']),
      state('create-rollback', '실패하면 저장 취소', '정상 commit과 다른 분기입니다. id를 받았어도 행이 확정됐다는 뜻은 아닙니다.', ['저장 도중 RuntimeException 발생'], ['메모리 객체의 id만으로 저장 성공을 판단하지 않음', '이미 바뀐 Java 객체의 자동 원복을 뜻하지 않음'], ['같은 트랜잭션의 DB 변경 전체 rollback'], ['ROLLBACK'], ['이번 글·새 태그·새 연결은 미반영', 'AUTO_INCREMENT 번호의 재사용은 보장하지 않음'], ['이번 요청의 새 글이 없음'], ['글·태그·연결 취소'], 'identity-insert'),
    ]),
    concepts: [concept('S09 · 영속 상태와 flush', 'S09-jpa-hibernate', '조회부터-변경-저장까지', 'save·flush·commit의 시점을 구분합니다.'), concept('P20 · ID와 기본 타입', 'P20-jpa-entity-mapping', '22-id와-기본-타입', 'IDENTITY id와 DB 열을 연결합니다.'), concept('W09 · DTO는 왜 쓰나', 'W09-why-dto', '', 'Entity와 HTTP 응답을 구분합니다.')],
    legacy: [legacy('1-4 · DB 저장의 기초', 'scenario/ch1-create-post/1-4-save-to-db.md', '이전 버전의 학습 설명입니다. 활성 API 계약은 공통 3-2입니다.'), legacy('1-5 · 입력 검증', 'scenario/ch1-create-post/1-5-validation.md', '필수값·길이 제약을 확인합니다.'), legacy('1-6 · 토큰 인증', 'scenario/ch1-create-post/1-6-token-auth.md', '인증된 작성자를 연결하는 근거입니다.')],
  },
  {
    id: 'detail', title: '게시글 상세 조회', file: 'read-post', contractId: 'detail',
    api: { method: 'GET', path: '/api/posts/{id}' },
    goal: '작성한 글의 상세를 반환하고, 볼 수 있는 글의 조회수만 1 증가시킵니다.',
    situation: '등록 직후 받은 id로 글을 엽니다. 없는 글과 볼 수 없는 글은 같은 404로 처리합니다.',
    target: source('PostQueryService', 'getDetail'),
    request: { headers: {}, query: {}, pathParams: { id: capturedId }, body: null, exampleLabel: '작성 응답에서 받은 id를 사용합니다.', authentication: 'Authorization 없이 조회할 수 있습니다. 선택해서 보낸 토큰은 유효해야 합니다.', capture: 'GET 전 DB view_count를 v로 기록하고 응답의 viewCount=v+1을 비교합니다.' },
    actions: ['findById로 글을 찾고 없으면 PostNotFoundException을 던집니다.', '제공된 accessPolicy.canView를 먼저 검사하고 실패하면 조회수를 바꾸지 않고 404를 냅니다.', 'post.increaseViewCount를 호출합니다. 이 GET은 쓰기 트랜잭션입니다.', '제공된 toDetailResponse로 트랜잭션 안에서 작성자·태그를 DTO에 옮겨 반환합니다.'],
    completion: [completion('visible', '가시성 검사를 통과한 글은 200 상세 DTO를 반환합니다.', 'PostQueryService', 'getDetail'), completion('increment', '응답과 DB의 조회수는 요청 전 v에서 v+1이 됩니다. 연속 2회는 v+2입니다.', 'Post', 'increaseViewCount'), completion('missing', '없는 글·삭제 글·볼 수 없는 글은 404이며 조회수 변화가 없습니다.', 'PostAccessPolicy', 'canView'), completion('timestamps', '상세 GET은 updated_at·created_at·published_at을 바꾸지 않습니다.', 'Post', 'increaseViewCount')],
    expected: { status: 200, headers: {}, fields: detailFields, checks: ['id=capturedId', 'viewCount=v+1', '작성한 title·content·tags·author를 반환', '숫자가 아닌 id는 400'], dbChecks: FUNCTIONAL_DB_CHECKS.detail, unchanged: ['title', 'content', 'tags', 'author', 'created_at', 'updated_at', 'published_at', 'deleted_at', 'like_count', 'comment_count'], failures: { 400: '숫자가 아닌 id', 404: '없는 글·삭제된 글·canView 실패', '401/403': '선택 토큰의 인증 오류·비활성 회원' }, caveats: ['현재 정본은 잠금·@Version 없는 객체 read-modify-write입니다. 동시 GET N건의 정확한 +N을 보장하지 않습니다.'] },
    visualization: visualization('detail-select', [
      state('detail-select', '행을 읽고 접근 판단', '같은 id의 행을 찾은 뒤 누가 볼 수 있는지 검사합니다.', ['findById(id)', 'accessPolicy.canView(viewer, post)'], ['id=capturedId', 'viewCount=v', 'updatedAt=t0'], ['조회한 Post는 관리 상태', '읽은 값 viewCount=v를 기준으로 변경 비교'], ['SELECT ... FROM post WHERE id = :capturedId'], ['view_count=v / updated_at=t0'], ['GET 전 SELECT 값을 기록: v, t0']),
      state('detail-change', '객체 조회수만 증가', '응답 DTO에는 증가한 값이 담깁니다. 아직 다른 연결의 행 값과 다를 수 있습니다.', ['post.increaseViewCount()', 'return toDetailResponse(post)'], ['viewCount=v+1', 'updatedAt=t0 유지'], ['관리 객체의 viewCount가 읽은 값과 다름'], ['변경 감지 UPDATE는 flush 시 실행'], ['flush 전 행은 view_count=v'], ['commit 전 새 글 상세 요청 결과를 DB 확정으로 오인하지 않음'], ['viewCount: v → v+1']),
      state('detail-commit', '조회수 변경 확정', 'GET이지만 DB 쓰기가 있으므로 readOnly 트랜잭션으로 바꾸지 않습니다.', ['@Transactional getDetail(...)'], ['응답 viewCount=v+1'], ['flush → commit'], ['UPDATE post SET ... view_count = :vPlusOne ... WHERE id = :capturedId', 'COMMIT'], ['view_count=v+1', 'updated_at=t0 그대로'], ['새 SELECT로 v+1과 시각 불변을 비교'], ['view_count만 의미상 변경']),
      state('detail-hidden', '보이지 않으면 404', '삭제된 글은 작성자·운영자라도 일반 상세에서 볼 수 없습니다.', ['if (!accessPolicy.canView(...)) throw new PostNotFoundException()'], ['조회수 증가 메서드 호출 안 함'], ['변경 없음 / 실패 응답'], ['UPDATE 없음'], ['조회수와 다른 값 모두 유지'], ['존재 여부와 관계없이 HTTP 404'], ['조회수 증가 없음'], 'detail-select'),
    ]),
    concepts: [concept('S09 · OSIV와 경계', 'S09-jpa-hibernate', 'osiv와-경계', '연관 데이터를 서비스 안에서 DTO로 읽는 이유입니다.'), concept('W09 · 응답 DTO', 'W09-why-dto', '', '상세 응답의 필드를 Entity 전체와 구분합니다.')],
    legacy: [legacy('2-1 · 상세와 404', 'scenario/ch2-read-post/2-1-get-one.md', '최소 상세 구현의 원문입니다. 최종 정책은 2-3도 함께 적용합니다.'), legacy('2-3 · 가시성', 'scenario/ch2-read-post/2-3-visibility.md', '삭제·상태·팔로우·양방향 차단 판단의 배경입니다.')],
  },
  {
    id: 'list', title: '게시글 목록 조회', file: 'list-posts', contractId: 'list',
    api: { method: 'GET', path: '/api/boards/{slug}/posts' },
    goal: '볼 수 있는 게시글을 최신순 한 페이지로 반환하고 전체 건수와 다음 페이지 여부를 알려줍니다.',
    situation: 'dev 게시판을 열면 방금 작성한 글을 포함한 목록을 봅니다. 전체 데이터 건수를 특정 숫자로 가정하지 않습니다.',
    target: source('PostQueryService', 'list'),
    request: { headers: {}, query: { page: 0, size: 10 }, pathParams: { slug: 'dev' }, body: null, exampleLabel: '작성한 dev 게시판을 조회합니다. 실제 건수는 DB에 따라 달라집니다.', authentication: '토큰 없이 조회할 수 있습니다. 선택 토큰이 있으면 그 회원의 가시성으로 조회합니다.' },
    actions: ['boardSlug로 게시판을 찾고 없으면 404 예외를 던집니다.', 'viewer가 없으면 viewerId=null로 정합니다.', 'publishedAt DESC, id DESC 순서의 PageRequest를 만듭니다.', '제공된 findViewableByBoard와 countViewableByBoard를 같은 조건으로 모두 호출합니다.', 'toListItem과 PostListResponse로 items·page·size·totalElements·totalPages·hasNext를 반환합니다.'],
    completion: [completion('page', '200과 items·페이지 메타데이터를 반환하고 본문 content는 목록 항목에서 제외합니다.', 'PostListResponse', 'PostListResponse'), completion('filter', 'PUBLISHED·미삭제·게시판·공개/본인/팔로우·양방향 차단 조건을 DB 쿼리에 적용합니다.', 'PostRepository', 'findViewableByBoard'), completion('order', 'publishedAt DESC, id DESC로 정렬하고 같은 조건의 전체 건수를 구합니다.', 'PostQueryService', 'list'), completion('read-only', '목록 조회는 글의 조회수·시각·내용을 변경하지 않습니다.', 'PostQueryService', 'list')],
    expected: { status: 200, headers: {}, fields: ['items[].id', 'items[].title', 'items[].author.id', 'items[].author.nickname', 'items[].tags', 'items[].likeCount', 'items[].commentCount', 'items[].viewCount', 'items[].publishedAt', 'page', 'size', 'totalElements', 'totalPages', 'hasNext'], checks: ['page·size는 보낸 값', 'items.length ≤ size', 'items 항목에 content 없음', 'totalElements는 같은 가시성 조건의 COUNT', '삭제 글은 목록에서 제외 (새로 작성한 글의 제외를 뜻하지 않음)'], dbChecks: FUNCTIONAL_DB_CHECKS.list, unchanged: ['모든 post 값', 'post_tag 연결', 'tag 행'], failures: { 400: 'page<0 또는 size가 1..50 밖', 404: '게시판 없음', '401/403': '선택 토큰 오류·비활성 회원' }, caveats: ['기존 2-2의 시드 14건은 최종 3-2의 고정 결과가 아닙니다.', 'author JOIN FETCH와 태그 배치 로딩은 제공됩니다. 실측 없이 쿼리 수나 속도를 고정하지 않습니다.'] },
    visualization: visualization('list-response', [
      state('list-response', '조건부터 한 페이지 응답까지', '조건·정렬·COUNT·페이지를 같은 화면에서 비교합니다. 페이지를 자른 뒤 Java에서 권한을 거르면 전체 건수와 결과가 어긋납니다.', ['PageRequest.of(page, size, Sort.by(desc("publishedAt"), desc("id")))', 'findViewableByBoard(board, viewerId, pageRequest)', 'countViewableByBoard(board, viewerId)', 'new PostListResponse(items, page, size, totalElements, totalPages, hasNext)'], ['board.slug=dev / viewerId=null 또는 인증 회원 id', 'List<Post> → 목록 DTO items', 'items에는 content 필드 없음'], ['readOnly 트랜잭션', '작성자 fetch join·태그 배치 로딩은 제공됨', '조회수는 증가하지 않음'], ['WHERE board_id = :boardId AND status = \'PUBLISHED\' AND deleted_at IS NULL', '공개·작성자·팔로우·차단을 같은 WHERE에 적용', 'ORDER BY published_at DESC, id DESC LIMIT :size OFFSET :offset', 'COUNT도 같은 WHERE · 쓰기 SQL 없음'], ['원본 행·태그 연결·카운터·시각 유지'], ['실제 건수는 실행 뒤 확인', 'HTTP 200의 items·page·size·totalElements·totalPages·hasNext 대조'], ['조건 → 정렬 → COUNT와 items를 한 모델에서 비교']),
    ]),
    concepts: [concept('S10 · 페이징 계약', 'S10-spring-data-query', '페이징은-정렬과-건수-계산의-계약이다', '조건·정렬·COUNT를 함께 판단합니다.'), concept('W15 · OFFSET 페이징', 'W15-paging-offset-vs-cursor', '', '현재 페이지 번호 방식의 선택을 이해합니다.'), concept('S09 · LAZY와 N+1', 'S09-jpa-hibernate', 'lazy와-n1', '제공된 fetch join·배치 로딩의 역할을 확인합니다.')],
    legacy: [legacy('2-2 · 게시판 목록', 'scenario/ch2-read-post/2-2-board-list.md', '페이지 메타데이터의 기초 설명이며 고정 시드 수는 재사용하지 않습니다.'), legacy('2-3 · 가시성', 'scenario/ch2-read-post/2-3-visibility.md', '최종 목록의 공개·차단 정책 배경입니다.'), legacy('2-4 · N+1', 'scenario/ch2-read-post/2-4-n-plus-1.md', '기능 완성 후 확인할 조회 성능 확장입니다.')],
  },
  {
    id: 'update', title: '게시글 부분 수정', file: 'update-post', contractId: 'patch',
    api: { method: 'PATCH', path: '/api/posts/{id}' },
    goal: '작성자가 보낸 값만 검증해 바꾸고, 생략·null·빈 태그 배열의 의미를 구분합니다.',
    situation: '작성한 글의 제목만 고칩니다. 본문과 태그는 유지하며, 태그를 전부 떼려면 별도로 빈 배열을 보냅니다.',
    target: source('PostService', 'patch'),
    request: { headers: authorHeaders, query: {}, pathParams: { id: capturedId }, body: { title: '수정한 제목' }, sourcePath: 'scenario/ch3-update-delete/3-1-patch.md', sourceRequest: 'E1', sourceUsage: '계약 참고 · 예시값 재구성', exampleLabel: '앞서 작성한 글의 제목을 바꿉니다. 실제 작성 응답에서 받은 id로 요청하세요.', authentication: '유효한 작성자 토큰이 필요합니다. 볼 수 있는 남의 글은 403, 볼 수 없는 글은 404입니다.', variants: [{ label: 'tags 생략 → 유지', body: { title: '수정한 제목' } }, { label: 'tags null → 유지', body: { tags: null } }, { label: 'tags [] → 연결 모두 해제', body: { tags: [] } }, { label: '빈 요청도 updatedAt 갱신', body: {} }] },
    actions: ['글을 찾고 canView 실패를 404로 처리한 다음 작성자 여부를 검사합니다.', '제목·본문·태그·공개 범위가 non-null일 때만 제공된 validate helper로 검사합니다.', '검사한 값만 changeTitle/changeContent/replaceTags/changeVisibility로 변경합니다.', 'tags가 []이면 연결을 비웁니다. null이나 생략이면 태그를 유지합니다.', '성공한 요청은 빈 객체여도 touchUpdatedAt(now)를 호출하고 필요한 연관을 읽어 Post를 반환합니다.'],
    completion: [completion('partial', '보낸 non-null 값만 변경되고 생략/null인 필드는 유지됩니다.', 'PostService', 'patch'), completion('tags', 'tags=[]는 post_tag 연결만 없애며 기존 tag 행은 삭제하지 않습니다.', 'Post', 'replaceTags'), completion('owner', 'canView → 작성자 순서로 검사합니다. ADMIN도 남의 글 수정 권한은 없습니다.', 'PostService', 'patch'), completion('rollback', '나중 필드 검증이 실패해도 앞서 바꾼 객체 값을 DB에 일부 저장하지 않습니다.', 'PostService', 'patch'), completion('touch', '{}와 all-null 성공 요청도 updated_at은 갱신하고 조회수는 올리지 않습니다.', 'PostService', 'patch')],
    expected: { status: 200, headers: {}, fields: detailFields, checks: ['보낸 title 값 반영 (생략/null은 유지)', '보내지 않은 content·tags·visibility 유지', 'tags null/생략 유지, []는 비움', 'title 1..200자·공백 불가, content 공백 불가', 'tags 최대 5개·각 원소 non-null/nonblank·30자 이하', 'PATCH 자체는 viewCount 증가 없음'], dbChecks: FUNCTIONAL_DB_CHECKS.update, unchanged: ['id', 'board_id', 'author_id', 'created_at', 'published_at', 'view_count', 'like_count', 'comment_count', 'deleted_at'], failures: { 400: '검증 실패(첫 필드 오류) 또는 JSON·타입 오류', 401: '인증 없음·오류', 403: '비활성 회원 또는 볼 수 있으나 작성자 아님', 404: '없는 글·삭제 글·볼 수 없는 글' }, caveats: ['updated_at은 서버 현재 시각입니다. 화면의 t1>t0는 설명 가정이며, 실제 updated_at이 항상 이전과 다른 시각임을 보장하지 않습니다.', '검증 오류의 errors와 JSON 파싱 오류 응답은 형태가 같다고 가정하지 않습니다.'] },
    visualization: visualization('patch-before', [
      state('patch-before', '수정 요청 전', '같은 글을 읽고 가시성과 작성자를 차례로 검사합니다. 아래 요청 예시를 고른 뒤 시작 값과 비교하세요.', ['findById(id)', 'canView(loginMember, post)', 'post.getAuthor().getId().equals(loginMember.id())'], ['title=새 게시글', 'content=본문', 'tags=[spring,새태그]', 'updatedAt=t0'], ['조회한 원래 값으로 변경을 비교'], ['SELECT ... WHERE id = :capturedId'], ['title=새 게시글 / updated_at=t0'], ['요청 전 값을 따로 기록']),
      state('patch-title', '객체 변경 · 동기화 전', '선택한 설명용 요청을 객체에 적용한 값입니다. 생략·null·빈 배열·값 배열의 차이를 같은 시점에서 비교합니다. post/post_tag는 아직 동기화 전입니다.', ['validateTitle(request.title())', 'post.changeTitle(request.title())', 'post.touchUpdatedAt(now)'], ['title=수정한 제목', 'content=본문', 'tags=[spring,새태그]', 'updatedAt=t1 (설명 가정)'], ['관리 객체의 title·updatedAt이 조회 당시 값과 다름', 'DB 변경은 아직 동기화 전'], ['post UPDATE는 아직 실행 전', '정본에 명시적 flush 호출은 없음'], ['title=새 게시글 / updated_at=t0', 'post_tag=[spring,새태그] 유지', 'view_count 변화 없음'], ['title=새 게시글 / updated_at=t0', '별도 연결에는 아직 원래 값'], ['객체 title 변경', '객체 updatedAt: t0 → t1 (설명 가정)']),
      state('patch-commit', '성공 후 DB 확정', '선택한 설명용 요청이 성공해 commit된 값입니다. 보낸 필드와 태그 방식에 따라 어떤 값과 연결이 유지되거나 바뀌는지 확인하세요.', ['return post;', '트랜잭션 정상 종료 후 Controller가 상세 DTO 응답'], ['title=수정한 제목', 'content=본문', 'tags=[spring,새태그]', 'updatedAt=t1 (설명 가정)'], ['변경 감지를 flush한 뒤 commit', 'createdAt·publishedAt·조회수는 유지'], ['기본 title 요청의 post 변경을 자동 동기화', 'COMMIT'], ['title=수정한 제목 / updated_at=t1', 'post_tag=[spring,새태그] 유지', 'tag 원본과 카운터 유지'], ['title=수정한 제목 / updated_at=t1', '새 autocommit SELECT로 확정 값과 태그 유지 확인'], ['HTTP 200', '제목·updated_at 확정']),
      state('patch-rollback', '실패하면 DB 변경 취소', '선택한 설명용 요청에 후행 검증 실패 값을 더한 별도 분기입니다. 아래 요청의 실패 필드를 확인하세요. DB 변경 취소는 이미 바뀐 Java 객체의 자동 원복을 뜻하지 않습니다.', ['changeTitle(...) 후 validateContent("   ") 실패'], ['title=수정한 제목이 메모리에 남을 수 있음', 'content 검증 실패로 touchUpdatedAt 전 중단'], ['RuntimeException → 트랜잭션 rollback', 'Java 객체의 자동 원복은 보장하지 않음'], ['ROLLBACK', '앞서 저장된 새 Tag도 같은 트랜잭션이면 취소'], ['요청 전 title·content·updated_at 유지', '관계와 tag 행도 이번 요청 전 상태'], ['400과 별도로 DB 원래 값 확인'], ['DB 부분 저장 없음'], 'patch-before'),
    ]),
    concepts: [concept('W21 · null 처리', 'W21-null-handling', '', '이 DTO는 생략과 null을 둘 다 유지로 해석합니다. 구분하는 다른 설계와 혼동하지 않습니다.'), concept('S09 · 변경 감지', 'S09-jpa-hibernate', '조회부터-변경-저장까지', '객체 변경과 DB 확정 시점을 연결합니다.'), concept('P20 · 다대다 연결', 'P20-jpa-entity-mapping', '25-cascade-orphanremoval-다대다', '태그 원본과 연결 해제를 구분합니다.')],
    legacy: [legacy('3-1 · 부분 수정', 'scenario/ch3-update-delete/3-1-patch.md', 'PATCH 필드별 규칙과 원문 검증 요청입니다.'), legacy('2-3 · 가시성', 'scenario/ch2-read-post/2-3-visibility.md', '수정 권한보다 먼저 글이 보이는지 판정합니다.')],
  },
  {
    id: 'delete', title: '게시글 삭제', file: 'delete-post', contractId: 'delete',
    api: { method: 'DELETE', path: '/api/posts/{id}' },
    goal: '작성자 또는 권한 있는 운영자가 삭제 시각을 기록하고, 이후 상세와 목록에서 글을 제외합니다.',
    situation: '글을 삭제한 뒤 기존 링크로 돌아가도 보이지 않아야 합니다. DB 행과 태그·좋아요·댓글은 보존합니다.',
    target: source('PostService', 'delete'),
    request: { headers: { Authorization: 'Bearer tok-kimjava' }, query: {}, pathParams: { id: capturedId }, body: null, exampleLabel: '앞 과제에서 만든 같은 글을 삭제합니다. 본문은 보내지 않습니다.', authentication: '작성자 또는 ADMIN이면서 canView를 먼저 통과해야 합니다. ADMIN이 FOLLOWERS를 무조건 우회하지 않습니다.' },
    actions: ['findById로 글을 찾고 canView 실패를 먼저 404로 처리합니다.', '인증 회원이 작성자 또는 ADMIN인지 검사하고 그 외는 PostForbiddenException을 던집니다.', 'post.delete(LocalDateTime.now())를 호출해 deletedAt과 updatedAt을 함께 변경합니다.', 'repository.delete나 연관 삭제를 호출하지 않습니다. Controller의 빈 204 응답을 확인합니다.', '삭제 후 같은 id의 상세·PATCH·DELETE 404와 목록 제외를 확인합니다.'],
    completion: [completion('empty', '삭제 성공은 204이며 응답 본문이 없습니다.', 'PostController', 'delete'), completion('soft', '행은 남고 deleted_at과 updated_at만 같은 now로 바뀝니다.', 'Post', 'delete'), completion('relations', 'post_tag·tag·좋아요·댓글을 물리 삭제하지 않습니다.', 'PostService', 'delete'), completion('after', '삭제 뒤 상세/PATCH/재삭제는 404이고 목록에서 제외됩니다.', 'PostAccessPolicy', 'canView'), completion('permission', 'canView → 작성자 또는 ADMIN 순서를 지킵니다.', 'PostService', 'delete')],
    expected: { status: 204, headers: {}, fields: [], checks: ['응답 본문 빈 문자열', '같은 id GET/PATCH/DELETE는 404', '목록에서 capturedId 제외', 'canView 통과한 작성자/ADMIN만 삭제 가능'], dbChecks: FUNCTIONAL_DB_CHECKS.delete, unchanged: ['id', 'title', 'content', 'status', 'visibility', 'created_at', 'published_at', 'view_count', 'like_count', 'comment_count', 'post_tag', 'tag', 'post_like', 'comment'], failures: { 401: '인증 없음·오류', 403: '비활성 회원 또는 볼 수 있으나 작성자/ADMIN 아님', 404: '없는 글·이미 삭제·볼 수 없는 글' }, caveats: ['연관 행이 원래 0개라면 보존 검증이 충분하지 않습니다. 제공된 삭제 통합 테스트는 일회용 DB에 연결을 넣고 확인합니다.', '삭제는 status=HIDDEN 변경과 다릅니다. status는 유지됩니다.'] },
    visualization: visualization('delete-before', [
      state('delete-before', '살아 있는 글과 권한', '앞서 제목을 수정한 같은 글의 모델입니다. 삭제 글은 canView의 첫 검사에서 거절됩니다.', ['findById(id)', 'accessPolicy.canView(loginMember, post)', 'isAuthor || isAdmin'], ['id=capturedId', 'deletedAt=null', 'updatedAt=t1'], ['Post는 관리 상태', '작성자/운영자 판단 전에 가시성 검사'], ['SELECT ... WHERE id = :capturedId'], ['deleted_at=NULL / updated_at=t1', '태그·좋아요·댓글은 기존 상태'], ['삭제 전 연결 수와 값을 기록']),
      state('delete-change', '삭제 시각 두 필드', 'Entity 메서드는 행 제거가 아니라 두 시각만 변경합니다.', ['post.delete(LocalDateTime.now())'], ['deletedAt=now', 'updatedAt=now', 'status=PUBLISHED 그대로'], ['삭제 시각과 수정 시각의 변경 감지'], ['flush 때 UPDATE post SET ... deleted_at=:now, updated_at=:now ...', 'DELETE FROM post 없음'], ['commit 전 확정되지 않은 변경'], ['다른 연결의 새 SELECT는 commit 전 기존 상태'], ['deletedAt: null → now', 'updatedAt: t1 → now']),
      state('delete-commit', '행 보존과 일반 조회 제외', 'HTTP 204 이후 별도 SELECT에는 행이 남고 일반 API에서는 제외됩니다.', ['정상 반환 → commit', 'Controller: 204 No Content'], ['id/title/status/counters 유지'], ['flush → COMMIT'], ['COMMIT', '후속 목록 WHERE deleted_at IS NULL'], ['deleted_at=updated_at=now', 'post_tag/tag/post_like/comment 보존'], ['직접 SELECT: 행 존재', '일반 상세: 404 / 목록: 제외'], ['204 본문 없음', '행과 연결 보존']),
      state('delete-again', '삭제한 글 재접근', '같은 id를 다시 지우거나 수정해도 404입니다.', ['canView: post.getDeletedAt() != null → false'], ['조회수·내용 추가 변경 없음'], ['실패 응답 / 변경 없음'], ['재삭제 UPDATE 없음'], ['첫 삭제 뒤 상태 그대로'], ['GET/PATCH/DELETE 404와 목록 제외를 대조'], ['재삭제 404'], 'delete-commit'),
    ]),
    concepts: [concept('P20 · 연관 삭제', 'P20-jpa-entity-mapping', '25-cascade-orphanremoval-다대다', '같이 지워지면 안 되는 연결을 판단합니다.'), concept('S09 · 변경 감지', 'S09-jpa-hibernate', '조회부터-변경-저장까지', 'delete 메서드 호출과 실제 SQL DELETE를 구분합니다.'), concept('R06 · 별도 DB 관찰', 'R06-db-client-tools', '', '행 보존은 API 응답과 별도로 SELECT로 확인합니다.')],
    legacy: [legacy('3-2 · soft delete', 'scenario/ch3-update-delete/3-2-soft-delete.md', '행과 연관 데이터를 보존하는 삭제 계약입니다.'), legacy('2-3 · 삭제 글 가시성', 'scenario/ch2-read-post/2-3-visibility.md', '상세와 목록에서 제외하는 공통 조건입니다.')],
  },
];

export const FUNCTIONAL_TASKS = taskSpecs.map((task, index) => {
  const previous = taskSpecs.slice(0, index).map(t => t.id);
  const pending = taskSpecs.slice(index).map(t => t.id);
  return {
    ...task,
    completion: task.completion.map(item => ({ ...item, verification: FUNCTIONAL_COMPLETION_GUIDES[task.id][item.id] })),
    order: index + 1,
    sourcePath: `scenario/flow/${task.file}.md`,
    packagePath: `scenario/flow/packages/${task.id}.zip`,
    referencePackagePath: FUNCTIONAL_CONTRACT.referencePackagePath,
    startingState: {
      provided: [...sharedProvided, previous.length ? `완성된 앞 과제: ${previous.map(id => taskSpecs.find(t => t.id === id).title).join(' → ')}` : '앞 과제 없음: API를 구현할 수 있는 학습자용 공통 기반부터 시작'],
      learnerWork: `${task.target.path}의 ${task.target.symbol}(...) 메서드 본문 한 개를 구현합니다.`,
      priorTask: index ? taskSpecs[index - 1].id : null,
      completedTasks: previous,
      pendingTasks: pending,
      note: '계속 학습할 때는 같은 프로젝트·서버·DB에서 다음 메서드만 구현합니다. ZIP은 중간 합류용 새 폴더 초기화 선택지입니다. 기존 사용자 코드 위에 전체 덮어쓰지 마세요. 현재 및 이후 기능은 미구현이므로 이후 API의 미구현 오류는 이번 과제의 실패가 아닙니다.',
    },
    files: [{ path: task.target.path, methods: [task.target.symbol], actions: task.actions, providedVsImplement: '구현: 이번 Service 메서드 본문 / 제공: 선언·주입 필드·helper·Entity 상태 변경 메서드' }],
    nextTask: taskSpecs[index + 1]?.id || null,
  };
});
export const FUNCTIONAL_TASK_BY_ID = Object.fromEntries(FUNCTIONAL_TASKS.map(task => [task.id, task]));
export function getFunctionalTask(sourcePath) {
  if (typeof sourcePath !== 'string') return undefined;
  const normalized = sourcePath.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\.html$/, '.md');
  return FUNCTIONAL_TASK_BY_ID[normalized] || FUNCTIONAL_TASKS.find(task => normalized === task.sourcePath || normalized.endsWith('/' + task.sourcePath));
}
