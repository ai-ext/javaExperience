// 조회 전용 검산 예시. 정본 3-2의 스키마·Repository 조건을 따르며 실행 로그가 아니다.
const postRow = 'SELECT id, board_id, author_id, title, content, status, visibility,\n       view_count, like_count, comment_count,\n       created_at, updated_at, published_at, deleted_at\nFROM post\nWHERE id = :capturedId;';
const tagLinks = 'SELECT pt.post_id, t.id AS tag_id, t.name\nFROM post_tag pt\nJOIN tag t ON t.id = pt.tag_id\nWHERE pt.post_id = :capturedId\nORDER BY t.id;';
const tagRows = 'SELECT id, name\nFROM tag\nORDER BY id;';
const relationCounts = 'SELECT\n  (SELECT COUNT(*) FROM post_tag WHERE post_id = :capturedId) AS tag_links,\n  (SELECT COUNT(*) FROM post_like WHERE post_id = :capturedId) AS likes,\n  (SELECT COUNT(*) FROM comment WHERE post_id = :capturedId) AS comments;';

// 목록과 COUNT가 다른 조건으로 계산되지 않도록 같은 WHERE를 사용한다.
export const FUNCTIONAL_LIST_CHECK_WHERE = `p.board_id = (SELECT id FROM board WHERE slug = :boardSlug)
  AND p.deleted_at IS NULL
  AND p.status = 'PUBLISHED'
  AND (
    p.visibility = 'PUBLIC'
    OR (:viewerId IS NOT NULL AND p.author_id = :viewerId)
    OR (:viewerId IS NOT NULL AND EXISTS (
      SELECT 1 FROM follow f
      WHERE f.follower_id = :viewerId AND f.followee_id = p.author_id
    ))
  )
  AND (
    :viewerId IS NULL OR NOT EXISTS (
      SELECT 1 FROM member_block b
      WHERE (b.blocker_id = :viewerId AND b.blocked_id = p.author_id)
         OR (b.blocked_id = :viewerId AND b.blocker_id = p.author_id)
    )
  )`;

const check = (label, sql, compare) => ({ label, sql, compare });
export const FUNCTIONAL_DB_CHECKS = {
  create: [
    check('작성 후 · 저장된 글 한 행', postRow, '응답 id의 행이 있고 제목·본문·작성자·게시판이 요청과 맞는지 확인합니다. status=PUBLISHED, 카운터 0, deleted_at=NULL입니다.'),
    check('작성 후 · 글에 연결된 태그', tagLinks, '요청의 태그 이름 집합과 비교합니다. 입력 순서나 tag id를 고정하지 않습니다.'),
  ],
  detail: [
    check('GET 전·후 · 같은 SELECT를 두 번', postRow, '전송 전 view_count를 v로 기록합니다. 정상 GET 뒤 v+1이고 created_at·updated_at·published_at은 같습니다. 비교용 GET을 추가 호출하면 조회수가 또 증가하므로 DB SELECT로 비교합니다.'),
  ],
  list: [
    check('목록과 같은 조건 · 전체 건수', `SELECT COUNT(*) AS total_elements\nFROM post p\nWHERE ${FUNCTIONAL_LIST_CHECK_WHERE};`, '같은 게시판·조회자에서 응답 totalElements와 비교합니다. 익명은 :viewerId를 NULL로, 로그인은 토큰 회원의 실제 id로 바꿉니다. 건수가 고정 14라고 가정하지 않습니다.'),
    check('같은 조건 · 정렬된 글 id', `SELECT p.id, p.title, p.published_at\nFROM post p\nWHERE ${FUNCTIONAL_LIST_CHECK_WHERE}\nORDER BY p.published_at DESC, p.id DESC\nLIMIT :size OFFSET :offset;`, '응답 items의 id 순서를 비교합니다. :offset은 page × size입니다. API와 DB 조회 사이에 데이터가 바뀌면 같은 시점의 결과가 아니므로 조용한 실습 DB에서 비교합니다.'),
    check('목록 요청 전·후 · 글 값 유지', postRow, '목록 GET 전·후의 같은 글을 비교합니다. view_count·시각·내용이 모두 같습니다.'),
  ],
  update: [
    check('PATCH 전·후 · 보낸 필드와 유지 값', postRow, '보낸 non-null 값은 반영되고 생략/null인 값은 유지됩니다. updated_at에는 서버 now를 대입하며 조회수는 증가하지 않습니다.'),
    check('PATCH 전·후 · 글과 태그의 연결', tagLinks, 'tags 생략/null은 같은 연결, []는 연결 0개, 값 배열은 중복을 제거한 이름 집합인지 비교합니다.'),
    check('PATCH 전·후 · 태그 원본 보존', tagRows, 'tags=[] 요청 전에 있던 tag id·이름이 후에도 남는지 비교합니다. 연결 수 0과 tag 원본 삭제를 구분합니다. 큰 DB에서는 요청 전에 기록한 tag id로 조회 범위를 좁히세요.'),
  ],
  delete: [
    check('DELETE 전·후 · 행과 두 시각', postRow, '행은 남고 deleted_at·updated_at에 같은 now가 저장됩니다. 나머지 값은 요청 전에 기록한 값과 같습니다.'),
    check('DELETE 전·후 · 연관 행 수', relationCounts, '삭제 전에 세 수를 기록하고 삭제 후 같은지 비교합니다. 같은 수만으로 행 id·모든 내용의 보존까지 입증하지는 않습니다. 코드에 repository.delete나 연관 삭제 호출이 없는지도 확인합니다. 원래 0개인 관계만으로는 검증이 충분하지 않습니다.'),
    check('DELETE 전·후 · 태그 원본', tagRows, '삭제 전에 기록한 tag id·이름이 후에도 남는지 비교합니다. 실제 tag 원본과 글의 post_tag 연결을 별도로 봅니다.'),
  ],
};

// 완료 항목을 어떤 증거로 판단할지 바로 옆에 제시한다. 자동 채점은 하지 않는다.
export const FUNCTIONAL_COMPLETION_GUIDES = {
  create: {
    created: '요청·응답: 작성 토큰으로 전송해 201, Location과 body.id 일치를 확인합니다.',
    saved: 'DB: 아래 글 한 행·태그 연결 SELECT를 응답 id로 조회합니다.',
    atomic: '코드·실패 검증: create의 @Transactional과 태그/글 저장이 같은 경계인지 봅니다. 저장 중 실패를 재현하는 격리 통합 테스트가 필요하며 201 한 번으로 체크하지 않습니다.',
    defaults: '요청: visibility를 생략한 경우와 null인 경우 각각 PUBLIC인지 봅니다. title을 빈 문자열로 보낸 경우 400인지 별도로 확인합니다.',
  },
  detail: {
    visible: '요청: 앞 작성 응답 id로 상세를 열고 글·작성자·태그를 비교합니다.',
    increment: '전후 비교: DB 값을 기록하고 GET 한 번 뒤 v+1을 확인합니다. 다른 요청이 없는 상태에서 한 번 더 요청하면 v+2입니다.',
    missing: '실패 요청: DB에서 없는 것으로 확인한 id로 404를 봅니다. 삭제·가시성 거절 시 조회수 증가가 없도록 canView 호출 순서를 코드에서 확인합니다. 기존 삭제/비공개 fixture가 있다면 해당 조회자로 검증하고, 새 글의 삭제 뒤 404는 마지막 과제에서 다시 확인합니다.',
    timestamps: 'DB: GET 전·후 같은 SELECT의 created_at·updated_at·published_at을 비교합니다.',
  },
  list: {
    page: '응답: items와 페이지 메타데이터를 보고 각 items에 content가 없는지 확인합니다.',
    filter: '조건 비교: 아래 SQL에서 API와 같은 viewerId·boardSlug로 검산합니다. 익명/본인/팔로우/양방향 차단별 fixture가 없으면 코드 대조까지만 한 상태입니다.',
    order: 'DB·응답: 같은 조건 COUNT와 정렬 id를 비교합니다. page=0/size=1 뒤 page=1/size=1을 각각 요청해 순서·hasNext도 봅니다.',
    'read-only': 'DB: 목록 요청 전·후의 글 한 행이 같은지 비교합니다. 비교를 위해 상세 GET을 호출하면 그 GET이 조회수를 쓰므로 사용하지 않습니다.',
  },
  update: {
    partial: '요청·DB: title을 직접 정한 값으로 보내 비교하고, 다른 필드는 생략/null인 별도 요청으로 유지되는지 확인합니다.',
    tags: '요청·DB: [] 전후에 아래 태그 연결과 tag 원본 SELECT를 기록해 연결만 사라졌는지 봅니다.',
    owner: '권한 요청: 공개 글을 볼 수 있고 양방향 차단이 없는 다른 활성 회원 토큰으로 PATCH하면 403입니다. 예제의 김자바 글은 tok-lee로 비교할 수 있습니다. 볼 수 없는 글은 먼저 404입니다. ADMIN도 남의 글 PATCH를 허용하는 조건을 넣지 않습니다.',
    rollback: '실패 요청·DB: {"title":"실패 전 변경","content":"   "}를 보내 400을 확인합니다. 요청 전후 SELECT의 title·content·updated_at이 같은지 봅니다. Java 객체의 자동 원복을 채점하지 않습니다.',
    touch: '요청·DB: {}를 보내 200을 확인하고 updated_at 대입과 조회수 유지를 봅니다. 시각 정밀도에 따라 전후 시각이 같을 수 있으므로 항상 큰 값이라고 채점하지 않습니다.',
  },
  delete: {
    empty: '응답: 204와 본문 빈 문자열을 확인합니다. JSON 파싱 성공을 요구하지 않습니다.',
    soft: 'DB: 삭제 전후 글 한 행을 비교해 행 보존·두 시각 일치·다른 값 유지를 확인합니다.',
    relations: 'DB·격리 테스트: 관계 수와 tag 원본을 전후 비교합니다. 관계가 원래 모두 0이면 Docker가 켜진 상태에서 ./gradlew test --tests org.example.post.PostDeleteControllerTest로 제공 검사를 실행합니다. Gradle이 test 프로필을 켜고 일회용 MySQL을 만듭니다. 이 검사는 Tx 내부 flush이며 별도 연결의 commit 관찰과 구분합니다.',
    after: '후속 요청: 같은 id의 GET, PATCH {}, DELETE가 각각 404인지 확인하고, 같은 게시판 목록에서 그 id가 없는지 봅니다.',
    permission: '삭제 전 코드·권한 요청: canView 다음 작성자/ADMIN 검사 순서를 봅니다. 양방향 차단 없이 글을 볼 수 있는 다른 일반 회원은 403입니다. 예제의 김자바 글은 삭제 전에 tok-lee로 비교합니다. 접근할 수 없는 글은 먼저 404이며, 이미 삭제한 id에서도 403을 기대하지 않습니다.',
  },
};
