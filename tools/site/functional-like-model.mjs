// 정본 4-1에 근거한 설명용 계산이다. HTTP 실행이나 Hibernate 계측을 대신하지 않는다.
const clone = value => JSON.parse(JSON.stringify(value));
const LIKE_DIR = 'src/main/java/org/example/like/';
const SOURCE = {
  snapshot: '4-1', manifest: 'scenario/snapshots/4-1.json',
  files: [
    [LIKE_DIR+'LikeService.java','29e6db5641f1633141c441961668f56f14a9ecc3'],
    [LIKE_DIR+'LikeController.java','d7f014e6017711370254bbe3339efe848d152aff'],
    [LIKE_DIR+'LikeResponse.java','218043925d4c82f5a340cab78016f7855f99bd54'],
    [LIKE_DIR+'PostLike.java','3a105ceb2b579e17e8c8f66b27f68b9a89859ea8'],
    [LIKE_DIR+'PostLikeRepository.java','717396e51da0a3036c22cb12a341516966fe1eb5'],
    [LIKE_DIR+'SelfLikeNotAllowedException.java','4c6de7442388688d195ccb4b60a701ab33909937'],
    ['src/main/java/org/example/post/Post.java','1d457910458b3a1d2c43b538b80f1f3ce7dd91c3'],
    ['src/main/java/org/example/post/PostAccessPolicy.java','21c2bef66b5f9bd2b2dd08c586d54df6059955d3'],
    ['src/main/java/org/example/common/ApiExceptionHandler.java','4e33a3e28a006909156a5bd4d74f58ad4b2de56d'],
    ['docker/mysql/init/01-community.sql','f4c9c3dcf0940e0b8026e055856c879c4f7bccac'],
  ].map(([path,blob])=>({path,blob})),
};
export const LIKE_VISUAL_PHASES = Object.freeze(['before','service','flushed','commit','repeat','rollback']);
const SCENARIOS = ['normal','own','anonymous','inactive','missing','hidden','draft','deleted'];
const SQL_LIMIT = 'SQL은 변경 의미 예시입니다. IDENTITY INSERT는 save 중 먼저 실행될 수 있고, 파생 DELETE도 명시한 SQL 발행 시점이 아닙니다. 정본에 명시적 flush는 없으며 실제 열 목록·순서·쿼리 수는 미측정입니다.';
const OBSERVATION = '별도 연결에서 새 autocommit SELECT로 관찰하는 모델입니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.';

/** 내 관계 한 행과 전체 카운트, 객체 값과 DB 확정 시점을 구별한다. */
export function getLikeVisualModel(options = {}) {
  const {method='PUT',phase='before',scenario='normal',initialLiked=method==='DELETE'}=options;
  if (!['PUT','DELETE'].includes(method)) throw new RangeError('좋아요 메서드는 PUT 또는 DELETE입니다.');
  if (!LIKE_VISUAL_PHASES.includes(phase)) throw new RangeError('알 수 없는 좋아요 설명 시점입니다.');
  if (!SCENARIOS.includes(scenario)) throw new RangeError('알 수 없는 좋아요 설명 조건입니다.');
  if (typeof initialLiked!=='boolean') throw new TypeError('initialLiked는 boolean이어야 합니다.');
  const authorId=scenario==='own'?2:4;
  const original={
    post:{id:42,author_id:authorId,title:'새 게시글',status:scenario==='draft'?'DRAFT':scenario==='hidden'?'HIDDEN':'PUBLISHED',deleted_at:scenario==='deleted'?'tDeleted':null,like_count:initialLiked?3:2},
    post_like:[{post_id:42,member_id:3},{post_id:42,member_id:6},...(initialLiked?[{post_id:42,member_id:2}]:[])],
  };
  // 없는 글 분기는 대상 글만 없고, 설명용 다른 글이나 전체 DB를 비웠다고 표현하지 않는다.
  if(scenario==='missing') { original.post=null;original.post_like=[]; }
  const before=clone(original);
  const result={
    kind:'educational-example',actualRuntime:false,method,phase,scenario,
    request:{method,path:'/api/posts/42/like',memberId:scenario==='anonymous'?null:2,body:null},
    fixture:{postId:42,authorId,memberId:2,otherMemberIds:[3,6],initialLiked,label:'고정 설명 예시 · 실제 작성 응답 id와 다름'},
    source:clone(SOURCE),before,
    java:{post:original.post?{id:42,title:original.post.title,likeCount:original.post.like_count,author:{$ref:`Member@${authorId}`}}:null,
      member:scenario==='anonymous'?null:{id:2},relationExists:initialLiked&&scenario!=='missing'},
    appDatabase:clone(original),observer:clone(original),response:null,
    changes:{relationDelta:0,counterDelta:0},
    transaction:{status:'not-started',objectAutomaticallyRestored:false,guaranteesConcurrentRequests:false},
    sql:{mutations:[],limit:SQL_LIMIT},observation:OBSERVATION,
    code:[],note:'요청 전 상태입니다. 다른 회원 3·6의 좋아요와 내 관계를 구분하세요.',
    limits:[
      'id=42와 회원·시각은 학습용 고정 예시이며 실제 API·DB 실행 결과가 아닙니다.',
      '이 상태 설정은 순차 재요청의 멱등을 설명합니다. 동시 요청의 카운터 정합성은 다음 4-2 확장입니다.',
      'post_like의 UNIQUE(post_id,member_id)는 중복 행을 막지만 모든 동시 요청이 200으로 성공하거나 카운트가 항상 맞음을 보장하지 않습니다.',
      '인증·가시성 규칙은 정본을 호출하는 흐름만 설명하며 이 계산기를 실제 인증·인가로 사용하지 않습니다.',
    ],
  };
  if(phase==='before') return result;

  const failure=scenario==='anonymous'?401:scenario==='inactive'?403:
    ['missing','hidden','draft','deleted'].includes(scenario)?404:
    scenario==='own'&&method==='PUT'?400:null;
  if(failure) {
    result.phase='rejected';result.response={status:failure,body:null};
    result.transaction.status=[401,403].includes(failure)?'not-opened':'rolled-back';
    result.code=[failure===401?'인증 실패':failure===403?'회원 상태 검사 실패':failure===400?'findLikeablePost(...) → 작성자 본인 → SelfLikeNotAllowedException':'findLikeablePost(...) → 404'];
    result.note=`HTTP ${failure} · 쓰기 전에 거절합니다. 오류 본문의 상세 필드는 실제 응답에서 확인합니다.`;
    return result;
  }

  const wantsLike=method==='PUT';
  const desired=clone(original);
  desired.post_like=original.post_like.filter(row=>row.member_id!==2);
  if(wantsLike) desired.post_like.push({post_id:42,member_id:2});
  desired.post.like_count=desired.post_like.length;
  // repeat는 첫 성공을 확정한 뒤 같은 요청을 새 트랜잭션으로 한 번 더 보내는 시점이다.
  if(phase==='repeat') {result.before=clone(desired);result.fixture.initialLiked=wantsLike;}
  const starting=result.before;
  const delta=desired.post.like_count-starting.post.like_count;
  result.changes={relationDelta:delta,counterDelta:delta};
  result.java.post.likeCount=desired.post.like_count;result.java.relationExists=wantsLike;
  result.code=[
    'findLikeablePost(postId, loginMember)',
    ...(wantsLike?['작성자 본인이면 SelfLikeNotAllowedException']:[]),
    `existsByPost_IdAndMember_Id(42, 2) → ${starting.post_like.some(row=>row.member_id===2)}`,
    ...(delta===1?['save(new PostLike(post, member, now))','post.increaseLikeCount()']:
      delta===-1?['deleteByPost_IdAndMember_Id(42, 2)','post.decreaseLikeCount()']:['관계와 카운터를 추가 변경하지 않음']),
    `new LikeResponse(postId, ${wantsLike}, post.getLikeCount())`,
  ];
  result.sql.mutations=delta===1?[
    'INSERT INTO post_like (post_id, member_id, created_at) VALUES (42, 2, :now)',
    'UPDATE post SET like_count = 3, ... WHERE id = 42',
  ]:delta===-1?[
    'DELETE FROM post_like WHERE post_id = 42 AND member_id = 2',
    'UPDATE post SET like_count = 2, ... WHERE id = 42',
  ]:[];
  if(phase==='service') {
    result.appDatabase=null;result.observer=clone(original);result.transaction.status='active';
    result.note='Service가 반환할 객체 값입니다. SQL이 어느 지점까지 실행됐는지는 이 시점의 모델에서 고정하지 않습니다. save의 IDENTITY INSERT는 이미 실행됐을 수 있습니다. 아직 성공 HTTP 응답을 보낸 단계가 아닙니다.';
  } else if(phase==='flushed') {
    result.appDatabase=clone(desired);result.observer=clone(original);result.transaction.status='active';
    result.note='남은 변경이 동기화된 시점을 따로 관찰하는 설명입니다. 정본 코드의 명시적 flush 호출이 아닙니다. 앱 Tx 내부 값이 바뀌어도 다른 연결에는 이전 확정 값이 보입니다.';
  } else if(phase==='rollback') {
    result.transaction.status='rolled-back';
    result.note='객체 변경 뒤 남은 SQL을 동기화하다 RuntimeException이 발생하는 별도 실패 분기입니다. 앞선 저장 호출에서 바로 실패한 경우까지 같은 Java 값을 보장하지 않습니다. DB는 요청 전 상태이며 Java 객체 필드의 자동 원복을 뜻하지 않습니다. 정해지지 않은 실패 HTTP 상태는 표시하지 않습니다.';
  } else {
    result.appDatabase=clone(desired);result.observer=clone(desired);result.transaction.status='committed';
    result.response={status:200,body:{postId:42,liked:wantsLike,likeCount:desired.post.like_count}};
    result.note=phase==='repeat'?'첫 성공 뒤 같은 요청을 한 번 더 보냈습니다. 상태를 뒤집거나 숫자를 한 번 더 바꾸지 않습니다.':
      wantsLike?'내 관계 한 행과 전체 숫자 증가가 함께 확정됐습니다. 다른 회원의 관계는 유지됩니다.':
      '내 관계만 제거됐습니다. 게시글 행과 다른 회원의 두 관계는 유지됩니다.';
  }
  return result;
}
