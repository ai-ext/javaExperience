// 좋아요 확장 과제의 정본 계약·패키지·코드 연결. 브라우저 동작은 별도 구현한다.
import {readFileSync} from 'node:fs';
const SERVICE='src/main/java/org/example/like/LikeService.java';
const source=symbol=>({snapshot:'4-1',path:SERVICE,symbol});
const completion=(id,text,verification,symbol)=>({id,text,verification,source:source(symbol)});
const checks=[
  {label:'글의 전체 카운트와 실제 관계 수',compare:'응답 likeCount, post.like_count, 모든 회원의 관계 수를 비교합니다. 요청 전 값도 별도로 기록합니다.',sql:'SELECT p.id, p.author_id, p.like_count,\n       (SELECT COUNT(*) FROM post_like pl WHERE pl.post_id=p.id) AS relation_count\nFROM post p WHERE p.id=:capturedId;'},
  {label:'내 관계와 다른 회원의 관계',compare:':memberId는 실제 토큰 회원 id입니다. 내 관계 수와 타회원의 기존 id·created_at을 비교합니다. 응답의 postId를 고정 예시42로 바꾸지 않습니다.',sql:'SELECT id, post_id, member_id, created_at\nFROM post_like WHERE post_id=:capturedId ORDER BY member_id;\nSELECT COUNT(*) AS my_relation_count FROM post_like\nWHERE post_id=:capturedId AND member_id=:memberId;'},
];
const base={
  group:'like',captureScope:'like',contractSnapshot:'4-1',
  extensionPackagePath:'scenario/flow/packages/like/like-extension.zip',
  referencePackagePath:'scenario/flow/packages/like/reference.zip',
  sourceManifest:'scenario/snapshots/4-1.json',
  sourceUsage:'원문 파일명이나 commit tree 대신 4-1의 files[].blob을 정본으로 사용합니다.',
  expected:{status:200,headers:{},fields:['postId','liked','likeCount'],dbChecks:checks,
    unchanged:['post.id','author_id','title','content','view_count','updated_at','deleted_at','다른 회원의 post_like'],
    caveats:['순차 재요청의 상태 설정입니다. 동시 요청의 전체 정합성은 다음4-2 확장입니다.','개인 liked와 전체 likeCount는 다릅니다.','SQL은 별도 검산용이며 Hibernate의 전체 SQL 로그가 아닙니다.']},
};
// 공통 표시 계약을 공유해도 개별 과제의 완료 상태는 공유하지 않는다.
export const FUNCTIONAL_LIKE_TASKS=[
  {
    ...base,id:'like',order:1,title:'좋아요 설정',file:'like-post',sourcePath:'scenario/flow/like-post.md',
    api:{method:'PUT',path:'/api/posts/{id}/like'},target:source('like'),nextTask:'unlike',
    goal:'같은 요청을 다시 보내도 내 좋아요 관계 한 행과 전체 숫자를 한 번만 바꿉니다.',
    situation:'응답이 늦어 같은 요청을 다시 보내도 좋아요는 유지되어야 합니다.',
    packagePath:'scenario/flow/packages/like/like.zip',
    request:{body:null,pathParams:{id:'{capturedId}'},query:{},idLabel:'좋아요에 사용할 새 글 id',authentication:'작성자와 다른 활성 회원의 토큰이 필요합니다. 교육용 기본 요청자는 회원2입니다.',
      exampleLabel:'앞 CRUD에서 삭제한 id는 사용하지 않습니다. 같은 서버에서 다른 회원(tok-park)의 새 PUBLIC 글을 POST한 실제 id를 직접 입력하세요. 본문은 보내지 않습니다.'},
    actions:['findLikeablePost로 볼 수 있는 PUBLISHED 글인지 확인합니다.','작성자 본인이면 SelfLikeNotAllowedException으로 400을 응답합니다.','postId와 인증 회원 id의 관계가 없을 때만 PostLike를 저장하고 increaseLikeCount를 함께 호출합니다.','같은 트랜잭션에서 변경 후 카운트와 liked=true를 반환합니다. 이미 관계가 있으면 추가 쓰기를 하지 않습니다.'],
    expected:{...base.expected,checks:['200과 같은 postId, liked=true','새 글에 첫 좋아요는0→1 · 내 관계 없을 때만 전체 +1','같은 PUT 재요청은 관계 한 행·카운트 유지','다른 회원의 관계 id와 생성 시각 유지'],failures:{400:'본인 글 좋아요 또는 숫자가 아닌 id',401:'인증 없음·유효하지 않은 토큰',403:'비활성 회원',404:'없는 글·삭제 글·볼 수 없는 글·PUBLISHED 아님'}},
    completion:[
      completion('state','PUT을 반복해도 좋아요 상태가 유지됩니다.','같은 id·회원으로 PUT 두 번을 보내 두 응답의 postId·liked=true·likeCount를 비교합니다.','like'),
      completion('relation','내 관계 한 행과 숫자 증가가 함께 저장되고 다른 회원의 관계는 유지됩니다.','다른 회원의 관계가 있는 별도 사례에서 요청 전후 SQL로 내 관계 수와 전체 COUNT·like_count, 타회원 행의 id·시각을 비교합니다. 0행만으로 타회원 보존을 확인했다고 처리하지 않습니다.','like'),
      completion('permission','본인 글400과 인증·회원 상태·가시성 실패를 구별합니다.','본인 글은 별도 작성 응답 id로 확인하고, 실패 요청이 DB를 변경하지 않았는지 비교합니다.','like'),
      completion('transaction','관계 저장 또는 카운터 동기화 실패 때 DB 일부만 남지 않습니다.','@Transactional과 같은 경계의 두 쓰기를 확인하고 별도 일회용 DB의 실패 주입 테스트로 rollback을 확인합니다. 성공200 한 번으로 체크하지 않습니다.','like'),
    ],
  },
  {
    ...base,id:'unlike',order:2,title:'좋아요 취소',file:'unlike-post',sourcePath:'scenario/flow/unlike-post.md',
    api:{method:'DELETE',path:'/api/posts/{id}/like'},target:source('unlike'),nextTask:null,
    goal:'내 관계만 지우고 숫자를 한 번 줄이며, 이미 취소한 요청은 추가 변경하지 않습니다.',
    situation:'같은 취소 요청을 다시 보내도 다른 회원의 좋아요는 남아야 합니다.',
    packagePath:'scenario/flow/packages/like/unlike.zip',
    request:{body:null,pathParams:{id:'{capturedId}'},query:{},idLabel:'좋아요 성공을 확인한 글 id',authentication:'앞에서 좋아요를 설정한 같은 회원으로 요청합니다. 토큰은 페이지 사이에 전달하지 않습니다.',
      exampleLabel:'좋아요를 설정한 같은 글 id와 회원으로 요청합니다. 게시글 삭제 API와 달리 취소 성공은200이며 liked=false와 남은 전체 likeCount를 응답합니다.'},
    actions:['findLikeablePost로 볼 수 있는 PUBLISHED 글인지 확인합니다.','postId와 인증 회원 id의 관계가 있을 때만 그 관계를 삭제합니다.','실제 관계를 삭제한 경우에만 decreaseLikeCount를 함께 호출합니다.','liked=false와 현재 카운트를 반환합니다. 이미 관계가 없으면 숫자를 다시 줄이지 않습니다.'],
    expected:{...base.expected,checks:['200과 같은 postId, liked=false','내 좋아요만 있던 새 글은1→0 · 내 관계 있을 때만 -1','같은 DELETE 재요청은 숫자 추가 감소 없음','게시글 행과 다른 회원의 관계 유지','본인 글 관계가 없으면200·false (PUT의 본인 글400 검사 없음)'],failures:{400:'숫자가 아닌 id',401:'인증 없음·유효하지 않은 토큰',403:'비활성 회원',404:'없는 글·삭제 글·볼 수 없는 글·PUBLISHED 아님'}},
    completion:[
      completion('state','DELETE와 재요청 모두200·liked=false이며 추가 감소하지 않습니다.','같은 id·회원의 DELETE 두 응답과 각각의 DB 카운트를 비교합니다.','unlike'),
      completion('relation','내 관계만 없어지고 다른 회원의 관계와 게시글은 남습니다.','post_like의 post_id+member_id로 내 행만 사라졌는지, 다른 행의 id·시각이 같은지 확인합니다.','unlike'),
      completion('permission','가시성·PUBLISHED를 먼저 검사하고 PUT의 본인 글400 규칙을 복사하지 않습니다.','별도 본인 글의 관계 없는 DELETE200과 숨겨진 글404를 비교합니다.','unlike'),
      completion('transaction','관계 삭제와 숫자 감소가 함께 확정되거나 취소됩니다.','같은 @Transactional 경계를 검토하고 별도 일회용 DB에서 카운터 동기화 실패 뒤 관계 보존을 확인합니다.','unlike'),
    ],
  },
];
export const FUNCTIONAL_LIKE_TASK_BY_ID=Object.fromEntries(FUNCTIONAL_LIKE_TASKS.map(t=>[t.id,t]));
export function getFunctionalLikeTask(value) {
  if(typeof value!=='string')return undefined;
  const normalized=value.replaceAll('\\','/').replace(/^\.\//,'').replace(/\.html$/,'.md');
  return (Object.hasOwn(FUNCTIONAL_LIKE_TASK_BY_ID,normalized)?FUNCTIONAL_LIKE_TASK_BY_ID[normalized]:undefined)||FUNCTIONAL_LIKE_TASKS.find(t=>normalized===t.sourcePath||normalized.endsWith('/'+t.sourcePath));
}
export function readFunctionalLikeMethod(taskId,{reference=false}={}) {
  const task=Object.hasOwn(FUNCTIONAL_LIKE_TASK_BY_ID,taskId)?FUNCTIONAL_LIKE_TASK_BY_ID[taskId]:null;if(!task)throw new Error('정의된 좋아요 과제가 필요합니다.');
  const source=readFileSync(new URL(`../../scenario/flow/packages/like/code/${reference?'reference':task.id}/LikeService.java`,import.meta.url),'utf8');
  const lines=source.split('\n');const start=lines.findIndex(l=>new RegExp(`^    public LikeResponse ${task.target.symbol}\\(`).test(l));
  if(start<0)throw new Error('패키지에서 대상 메서드를 찾을 수 없습니다.');
  let depth=0,opened=false,end=start;
  for(;end<lines.length;end++) {
    for(const c of lines[end]){if(c==='{'){depth++;opened=true;}if(c==='}')depth--;}
    if(opened&&depth===0)break;
  }
  return lines.slice(lines[start-1]?.trim()==='@Transactional'?start-1:start,end+1).map(l=>l.replace(/^    /,'')).join('\n');
}
