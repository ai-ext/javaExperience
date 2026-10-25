// native 폼 응답·별도 SQL·홈/개념 관찰을 독립 대조한다. 서버나 브라우저를 실행하지 않는다.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const defaultDir=path.join(root,'docs/design/scenario-like-2026-10-21/browser-api-2026-10-21');
const read=(dir,name)=>JSON.parse(readFileSync(path.join(dir,name),'utf8'));
// 삭제 연결 수정 후 실제4HTTP에 사용한 소스와 대조한다. 전체23회 중 앞19회는 수정 전 기록이다. 허용하는 새 차이는 도움말 연결뿐이다.
export function compareLikeControllerSources(current,tested) {
  const hashLine="    window.addEventListener('hashchange', openAnchor);\n";
  const bindingLine="    root.querySelectorAll('a[href=\"#functional-setup\"]').forEach(link => link.addEventListener('click', openAnchor));\n";
  if(current===tested)return {match:'exact',transportCodeUnchanged:true};
  const block=hashLine+bindingLine;
  assert.equal(current.split(block).length,2,'알려진 도움말 변경의 위치·횟수');
  assert.equal(current.replace(block,hashLine),tested,'도움말 연결 외의 코드는 실제 검증 소스와 같아야 함');
  return {match:'setup-click-binding-only',transportCodeUnchanged:true,note:'새 도움말 클릭은 별도 native/DOM 검사 대상이다. 저장 소스는 실제23HTTP 중 수정 후4회에 대응하며 앞19회는 수정 전 기록이다.'};
}
export function loadLikeBrowserEvidence(dir=defaultDir) {
  return {runtime:read(dir,'report.json'),browser:read(dir,'browser-observations.json'),cleanup:read(dir,'cleanup-observed.json'),
    scope:read(dir,'scope-after-new-own-post.json'),beforeFix:read(dir,'known-delete-before-fix.json'),afterFix:read(dir,'known-delete-after-fix.json'),
    homeResume:read(dir,'home-resume.json'),reload:read(dir,'resume-reload.json'),homeComplete:read(dir,'home-like-complete.json'),next:read(dir,'home-next-unlike.json'),homeFinal:read(dir,'home-after-browsing-other-tasks.json'),
    concept:read(dir,'concept-caller.json'),conceptParent:read(dir,'concept-parent-preserved.json'),tokenCopy:read(dir,'concept-token-copy-proof.json'),patched:read(dir,'patched-client.json'),schema:read(dir,'schema-observation.json')};
}
export function verifyLikeBrowserEvidence(evidence) {
  const {runtime:r,browser,cleanup}=evidence;
  assert.equal(r.status,'browser_session_recorded');assert.equal(r.requests.length,0,'CLI가 과제 HTTP를 보내지 않음');
  assert.equal(r.browserPackage.canonicalFilesCompared,82);assert.equal(r.browserPackage.supplementalFilesCompared,7);
  const packageManifest=read(path.join(root,'scenario/flow/packages/like'),'manifest.json');
  assert.equal(r.browserPackage.sha256,packageManifest.packages.find(p=>p.taskId==='reference').sha256);
  assert.equal(r.cleanupErrors,undefined);assert.ok(r.cleanup.some(s=>s.includes('removed own ID/name/run-label matched container')));
  assert.equal(cleanup.containerAbsent,true);assert.ok(cleanup.ports.length===3&&cleanup.ports.every(p=>p.closed));
  const records=browser.records;assert.equal(records.length,23);const byStage=new Map(records.map(x=>[x.stage,x]));assert.equal(byStage.size,records.length);
  const observations=new Map(r.likeObservations.map(x=>[x.stage,x]));assert.equal(observations.size,18);
  const record=stage=>{assert.ok(byStage.has(stage),stage);return byStage.get(stage);};
  const sql=stage=>{assert.ok(observations.has(stage),stage);return observations.get(stage);};
  const first=record('create-other-member'),own=record('create-own-member'),fixed=record('fix-create-other');
  const firstId=first.json.id,ownId=own.json.id,fixId=fixed.json.id;
  assert.deepEqual([first.json.author.id,own.json.author.id,fixed.json.author.id],[4,2,4]);
  assert.ok(firstId>21&&ownId>firstId&&fixId>ownId);
  for(const [stage,status] of Object.entries({'create-other-member':201,'fresh-put':200,'fresh-put-repeat':200,'fresh-delete':200,'fresh-delete-repeat':200,'others-put':200,'others-put-repeat':200,'others-delete':200,'others-delete-repeat':200,'create-own-member':201,'own-put-rejected':400,'own-delete-allowed':200,'anonymous-delete':401,'inactive-delete':403,'missing-put':404,'resume-preparation-put':200,'home-next-delete':200,'delete-reacted-post':204,'deleted-post-put-rejected':404,'fix-create-other':201,'fix-put-before-delete':200,'fix-known-delete':204,'fix-deleted-put-rejected':404})) {
    const row=record(stage);assert.ok(row.status.startsWith('HTTP '+status+' '),stage);
    assert.ok(row.raw.includes('\nHTTP '+status+'\n'),stage);
    assert.equal(row.raw.slice(row.raw.indexOf('\n\n')+2),row.body,'본문을 표시 원문에서 그대로 분리했는지 확인');
    assert.equal(row.base,r.isolation.appPort?`http://127.0.0.1:${r.isolation.appPort}`:null);
    if(row.json!==null)assert.deepEqual(JSON.parse(row.body),row.json,'표시 원문과 저장 JSON의 일치');
    if(status>=400)assert.equal(row.json.status,status);
    if(status===204)assert.equal(row.body,'(본문 없음)','빈 본문의 UI 표지와 실제 JSON을 구별');
  }
  const success=[['fresh-put',true,1],['fresh-put-repeat',true,1],['fresh-delete',false,0],['fresh-delete-repeat',false,0],['others-put',true,3],['others-put-repeat',true,3],['others-delete',false,2],['others-delete-repeat',false,2],['resume-preparation-put',true,3],['home-next-delete',false,2]];
  for(const [stage,liked,count] of success)assert.deepEqual(record(stage).json,{postId:firstId,liked,likeCount:count},stage);
  assert.deepEqual(record('own-delete-allowed').json,{postId:ownId,liked:false,likeCount:0});
  assert.deepEqual(record('fix-put-before-delete').json,{postId:fixId,liked:true,likeCount:1});
  assert.ok(record('anonymous-delete').raw.includes('WWW-Authenticate: Bearer'));
  for(const stage of ['own-put-rejected','anonymous-delete','inactive-delete','missing-put','deleted-post-put-rejected','fix-deleted-put-rejected'])assert.equal(record(stage).captured,'유효한 좋아요 응답 id 없음');
  for(const row of records.slice(0,16))assert.equal(row.checked,0,'HTTP 응답이 자기확인을 자동 완료하지 않음');
  for(const o of observations.values()){assert.equal(o.post.like_count,o.post_like.length);assert.equal(o.post.relations.likes,o.post_like.length);assert.ok(o.post_like.every(x=>x.post_id===o.post.id));}
  const base=sql('created-other-member').post;
  for(const [stage,count] of [['fresh-put',1],['fresh-put-repeat',1],['fresh-delete',0],['fresh-delete-repeat',0],['two-other-members-fixture',2],['others-put',3],['others-delete',2],['others-delete-repeat',2],['after-auth-and-missing-errors',2],['resume-preparation-put',3],['home-next-delete',2]]) {
    const o=sql(stage);assert.equal(o.post.id,firstId);assert.equal(o.post.like_count,count,stage);
    for(const key of Object.keys(base))if(!['like_count','relations'].includes(key))assert.deepEqual(o.post[key],base[key],stage+' '+key);
  }
  assert.deepEqual(sql('fresh-put').post_like,sql('fresh-put-repeat').post_like,'순차 재요청의 관계 id·시각 보존');
  const otherRows=sql('two-other-members-fixture').post_like;
  assert.deepEqual(otherRows.map(x=>x.member_id),[3,6]);
  for(const stage of ['others-put','others-delete','others-delete-repeat','after-auth-and-missing-errors','resume-preparation-put','home-next-delete','deleted-post-after-rejected-like'])assert.deepEqual(sql(stage).post_like.filter(x=>x.member_id!==2),otherRows,'다른 회원 행 보존: '+stage);
  assert.deepEqual(sql('own-put-rejected'),{...sql('own-delete-allowed'),stage:'own-put-rejected'});
  const deleted=sql('deleted-post-after-rejected-like');assert.ok(deleted.post.deleted_at);assert.equal(deleted.post.deleted_at,deleted.post.updated_at);assert.equal(deleted.post.like_count,2);
  const beforeDelete=sql('fix-put-before-delete'),afterDelete=sql('fix-known-delete');
  assert.deepEqual(beforeDelete.post_like,afterDelete.post_like);assert.equal(afterDelete.post.like_count,1);assert.equal(afterDelete.post.id,fixId);
  assert.ok(afterDelete.post.deleted_at);assert.deepEqual(sql('fix-after-deleted-put'),{...afterDelete,stage:'fix-after-deleted-put'});
  assert.equal(evidence.scope.coreOwnPost,ownId);assert.equal(evidence.scope.likeScopeStill.id,String(firstId));assert.equal(evidence.scope.likeScopeStill.tokenEmpty,true);
  assert.equal(evidence.beforeFix.id,String(firstId),'수정 전 이미 삭제한 id가 남는 문제 재현');
  assert.equal(evidence.afterFix.nextLike.id,'');assert.equal(evidence.afterFix.nextLike.captured,'아직 없음');
  assert.equal(evidence.afterFix.deletionNotice.id,String(fixId));assert.equal(evidence.afterFix.deletionNotice.captured,String(fixId));assert.ok(evidence.afterFix.deletionNotice.notice.includes('좋아요 이어가기 id를 해제'));
  assert.equal(evidence.homeResume.title,'좋아요 설정');assert.ok(evidence.homeResume.work.includes('LikeService.java'));
  assert.equal(evidence.reload.checked,3);assert.equal(evidence.reload.id,String(firstId));assert.equal(evidence.reload.tokenEmpty,true);assert.equal(evidence.reload.status,'미실행');
  assert.ok(evidence.homeComplete.href.endsWith('/unlike-post.html'));assert.ok(evidence.homeComplete.progress.includes('자동 채점 통과를 뜻하지'));
  assert.equal(evidence.next.title,'좋아요 취소');assert.equal(evidence.next.id,String(firstId));assert.equal(evidence.next.checked,0);assert.equal(evidence.next.tokenEmpty,true);
  assert.equal(evidence.homeFinal.title,'좋아요 취소');assert.ok(evidence.homeFinal.progress.includes('자동 채점 통과를 뜻하지'));
  assert.equal(evidence.concept.readingTone,true);assert.equal(evidence.concept.bodyBackground,'rgb(255, 255, 255)');assert.ok(evidence.concept.taskHref.endsWith('/like-post.html'));
  assert.equal(evidence.conceptParent.id,String(firstId));assert.equal(evidence.conceptParent.checked,3);assert.equal(evidence.conceptParent.selected,'like-flushed');
  // 비밀번호 DOM 조회의 literal 일치 결과 대신 페이지가 생성한 공개 fixture의 curl을 대조한다.
  assert.equal(evidence.tokenCopy.beforeAuth,true);assert.equal(evidence.tokenCopy.afterAuth,true);assert.equal(evidence.tokenCopy.clipboardRestored,true);assert.equal(evidence.tokenCopy.afterTokenMeta.empty,false);
  const testedController=readFileSync(path.join(defaultDir,'tested-controller.js'),'utf8');
  assert.equal(createHash('sha256').update(testedController).digest('hex'),evidence.patched.clientSha256);
  const sourceComparison=compareLikeControllerSources(readFileSync(path.join(root,'tools/site/functional-scenario.js'),'utf8'),testedController);
  assert.ok(evidence.schema.result.includes('created_at\t0'));
  return {status:'passed',nativeHttpRequests:records.length,separateSqlObservationGroups:observations.size,normalSequence:[0,1,1,0,0],othersSequence:[2,3,3,2,2],serverPackage:r.browserPackage.sha256,sourceComparison,
    limitations:['타회원 사례의 두 번째 PUT 직후 SQL은 별도 촬영하지 않았다. 원시 HTTP의 숫자와 후속 SQL·행 보존을 구분한다.','요청 중 Java heap·SQL 발행 시점·동시성은 측정하지 않았다.','홈 자기확인 클릭은 독립 QA origin의 동작 테스트이며 학습자의 구현 채점이 아니다.','소수부가 있는 LocalDateTime 응답과 DATETIME_PRECISION=0 DB 값을 문자열 전체 동일로 가정하지 않는다.','첫19HTTP는 기존 클라이언트, 뒤4HTTP는 삭제 연결 수정 후 클라이언트다.']};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const result=verifyLikeBrowserEvidence(loadLikeBrowserEvidence());
  if(process.argv.includes('--write'))writeFileSync(path.join(defaultDir,'independent-check.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}
