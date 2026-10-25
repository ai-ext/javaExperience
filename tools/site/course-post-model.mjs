const COURSE_POST_STATES = [
  { id: 'created', label: '객체 생성' },
  { id: 'linked', label: '관계 연결' },
  { id: 'inserted', label: 'INSERT 후' },
  { id: 'committed', label: 'commit' },
  { id: 'rolled-back', label: 'rollback' },
];

const scope = 'D04-4 고정 설명 예시입니다. 기존 Tag id=7(name=spring)가 존재하는 경우의 축약 코드이며 main 전체 메서드 원문이 아닙니다. 실제 API 조회·실행 결과가 아닙니다. observer는 별도 새 autocommit SELECT(RR/RC)에서 그때 확정된 값을 봅니다. 이미 열린 RR snapshot 또는 READ UNCOMMITTED는 다르게 보일 수 있습니다. t0는 시각을 대신하는 설명 기호입니다. SQL은 의미 예시이며 실제 로그나 전체 실행 순서가 아닙니다.';
const limits = '이 모델은 D04-4의 게시글·기존 태그 관계만 다룹니다. 최종 PostServiceImpl.create에는 PointService.earn과 커밋 후 캐시 이벤트가 있지만 각각 D07·D09 범위이므로 기본 Java/DB 장면에는 넣지 않습니다. 포인트 값은 표시하지 않습니다. Java heap의 현재값이나 SQL 실행 로그를 계측한 모델이 아닙니다.';

const basePost = (id = null, createdAt = null) => ({
  ref: 'Post@A', id, title: '첫 게시글', content: '본문을 저장합니다.',
  status: 'ACTIVE', likeCount: 0, createdAt, memberRef: 2, tags: [],
});
const dbPost = () => ({
  id: 42, member_id: 2, title: '첫 게시글', content: '본문을 저장합니다.',
  status: 'ACTIVE', like_count: 0, created_at: 't0', updated_at: 't0',
});
const linkRow = () => ({ post_id: 42, tag_id: 7 });
const javaCode = [
  'Member member = memberRepository.findByIdForUpdate(2L).orElseThrow();',
  'Post post = Post.create(member, "첫 게시글", "본문을 저장합니다.");',
  'Tag existingTag7 = tagRepository.findByName("spring").orElseThrow();',
  'post.addTag(existingTag7);',
  'Long postId = postRepository.save(post).getId();',
];

function makeState(id, label, options = {}) {
  const {
    note, post = basePost(), appPost = [], appPostTag = [], observerPost = [], observerPostTag = [],
    transaction = 'active', http = { status: null, body: null, location: null },
    snapshot = 'current-object', management = '비관리 객체', sql = [], code = javaCode, branchFrom = null,
  } = options;
  return {
    id, label, note: `${scope} ${note}`,
    code: [...code], sql: [...sql],
    java: {
      snapshot, management,
      post,
    },
    app: { post: appPost, postTag: appPostTag, tag: [{ id: 7, name: 'spring' }] },
    observer: { post: observerPost, postTag: observerPostTag, tag: [{ id: 7, name: 'spring' }] },
    transaction, http: { ...http }, scope, limits, branchFrom,
  };
}

const insertedPost = basePost(42, 't0');
insertedPost.tags = [{ tagRef: 7, postRef: 'Post@A' }];
const insertedRows = [dbPost()];
const insertedLinks = [linkRow()];

const models = {
  created: makeState('created', '객체 생성', {
    note: 'Post.create의 new Post(member, title, content) return 직후입니다. 생성자는 전달받은 기존 Member 참조를 필드에 두지만 Post 자체는 아직 영속성 컨텍스트에 관리되지 않습니다. 기존 Member나 Tag가 컨텍스트에 없다고 단정하지 않습니다. BaseEntity 감사 필드 createdAt은 저장 전 null입니다. 서비스 트랜잭션은 이미 active이고 앞서 Member SELECT FOR UPDATE가 수행됐으므로 이 장면을 SQL이 전혀 없었던 때라고 설명하지 않습니다.',
    code: [javaCode[0], javaCode[1]],
    sql: ['앞선 서비스 단계: SELECT ... FROM member WHERE id = 2 FOR UPDATE (의미 예시)', 'Post 생성 자체는 아직 post/post_tag 행을 만들지 않음'],
  }),
  linked: makeState('linked', '관계 연결', {
    note: '기존 Tag id=7(name=spring)를 조회한 뒤 post.addTag(tag)를 호출해 PostTag 관계 객체를 만든 상태입니다. PostTag.post는 Post@A를 참조하며 Post의 id가 null이어도 참조 자체는 null이 아닙니다. PostTag는 아직 DB 행이 아니며 새 Tag INSERT도 없습니다.',
    post: { ...basePost(), tags: [{ tagRef: 7, postRef: 'Post@A' }] },
    code: javaCode.slice(0, 4),
    sql: ['SELECT ... FROM tag WHERE name = "spring" (기존 행 조회, 의미 예시)', 'post_tag INSERT는 아직 없음'],
  }),
  inserted: makeState('inserted', 'INSERT 후', {
    note: 'commit 전의 INSERT 및 표시한 관계 동기화 뒤를 나타내는 한 시점입니다. IDENTITY 키 생성에 필요한 INSERT와 관계 cascade 동기화가 이 시점까지 이뤄졌다고 표현합니다. 이는 save() 반환 직후에 모든 SQL이 이 순서로 끝났다는 주장이 아닙니다. Post@A는 같은 참조이며 현재 트랜잭션에서 관리됩니다. t0는 생성 감사시각의 설명 기호입니다.',
    post: insertedPost, appPost: insertedRows, appPostTag: insertedLinks,
    management: '현재 트랜잭션에서 관리', snapshot: 'last-insert-snapshot',
    code: [...javaCode],
    sql: ['INSERT INTO post (...) VALUES (...) (IDENTITY 키 생성, 의미 예시)', 'INSERT INTO post_tag (post_id, tag_id) VALUES (42, 7) (관계 동기화, 의미 예시)'],
  }),
  committed: makeState('committed', 'commit', {
    note: '정상 종료 후 확정된 DB 상태입니다. Java 쪽은 저장 시점의 설명 스냅샷이며 트랜잭션 종료 뒤 같은 관리 객체 참조를 재사용한다고 나타내지 않습니다. observer는 별도 새 autocommit SELECT 관점입니다.',
    post: insertedPost, appPost: insertedRows, appPostTag: insertedLinks,
    observerPost: insertedRows, observerPostTag: insertedLinks,
    management: '트랜잭션 종료 · 객체 참조 재사용 안 함', snapshot: 'last-insert-snapshot', transaction: 'committed',
    http: { status: 201, body: '', location: '/api/posts/42' },
    code: [...javaCode, '// 정상 반환 → transaction commit'], branchFrom: 'inserted',
    sql: ['commit (의미 예시)'],
  }),
  'rolled-back': makeState('rolled-back', 'rollback', {
    note: 'INSERT 후 커밋 전에 예외가 난 독립 실패 분기입니다. DB rollback은 Java 필드의 자동 원복이나 초기화를 보장하지 않습니다. Java 현재 실제값은 계측하지 않았으며 id=42/createdAt=t0 표시는 마지막 INSERT 스냅샷입니다. observer의 새 autocommit SELECT에서는 post/post_tag 행이 없고 기존 Tag 행은 남습니다.',
    post: insertedPost, management: '트랜잭션 종료 · 참조 재사용 안 함', snapshot: 'last-insert-snapshot', transaction: 'rolled-back',
    code: [...javaCode, '// 커밋 전 예외 → transaction rollback'], branchFrom: 'inserted',
    sql: ['ROLLBACK (의미 예시)'],
  }),
};

export { COURSE_POST_STATES };

export function getCoursePostModel(id = 'created') {
  if (!Object.hasOwn(models, id)) throw new RangeError(`알 수 없는 게시글 상태: ${id}`);
  return structuredClone(models[id]);
}
