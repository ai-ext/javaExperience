import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {getCoursePostModel,COURSE_POST_STATES} from './course-post-model.mjs';
import {renderCoursePostVisual} from './course-post-visual.mjs';
import {mountCoursePostVisual} from './course-post-client.mjs';

test('main의 생성자·감사필드·기존태그·IDENTITY를 서로 다른 시점으로 설명한다',()=>{
  const fresh=getCoursePostModel('created');assert.equal(fresh.java.post.id,null);assert.equal(fresh.java.post.createdAt,null);assert.equal(fresh.java.post.status,'ACTIVE');assert.equal(fresh.java.post.likeCount,0);assert.equal(fresh.java.post.memberRef,2);assert.equal(fresh.java.post.tags.length,0);assert.equal(fresh.app.post.length,0);
  const linked=getCoursePostModel('linked');assert.equal(linked.java.post.id,null);assert.deepEqual(linked.java.post.tags,[{tagRef:7,postRef:'Post@A'}]);assert.equal(linked.app.postTag.length,0);
  const saved=getCoursePostModel('inserted');assert.equal(saved.java.post.id,42);assert.equal(saved.java.post.createdAt,'t0');assert.equal(saved.app.post[0].id,42);assert.deepEqual(saved.app.postTag,[{post_id:42,tag_id:7}]);assert.equal(saved.observer.post.length,0);assert.equal(saved.transaction,'active');
  for(const id of COURSE_POST_STATES.map(s=>s.id))assert.deepEqual(getCoursePostModel(id).observer.tag,[{id:7,name:'spring'}]);
});
test('commit과rollback은 같은 저장 뒤의 분기이며 Java 마지막스냅샷을 실제계측처럼 쓰지 않는다',()=>{
  const c=getCoursePostModel('committed');assert.equal(c.observer.post[0].id,42);assert.equal(c.http.status,201);assert.equal(c.http.body,'');assert.equal(c.http.location,'/api/posts/42');
  const r=getCoursePostModel('rolled-back');assert.equal(r.app.post.length,0);assert.equal(r.observer.postTag.length,0);assert.equal(r.java.snapshot,'last-insert-snapshot');assert.match(r.note,/자동.*원복|자동.*초기화/);assert.match(r.java.management,/재사용|종료/);assert.equal(r.http.status,null);assert.equal(c.branchFrom,'inserted');assert.equal(r.branchFrom,'inserted');
  assert.equal(getCoursePostModel('created').java.post.createdAt,null);assert.throws(()=>getCoursePostModel('bad'));
  const copy=getCoursePostModel('committed');copy.app.tag[0].name='changed';assert.equal(getCoursePostModel('committed').app.tag[0].name,'spring');
});
test('코드·객체·트랜잭션DB·별도연결을 같은값으로 표시하고 실제결과/완료기록과 섞지 않는다',()=>{
  const dom=new JSDOM(renderCoursePostVisual({stepId:'D04-4'}));const d=dom.window.document;
  assert.equal(d.querySelectorAll('[data-cpv-root]').length,1);assert.equal(d.querySelectorAll('[data-cpv-state]').length,5);assert.equal(d.querySelectorAll('[data-cpv-panel]:not([hidden])').length,1);
  for(const s of COURSE_POST_STATES){const panel=d.querySelector('[data-cpv-panel="'+s.id+'"]');assert.ok(panel);assert.match(panel.textContent,/spring/);assert.equal(panel.querySelector('[data-cpv-id]').textContent,getCoursePostModel(s.id).java.post.id===null?'null':'42');}
  assert.match(d.querySelector('[data-cpv-root]').textContent,/고정.*예시|설명.*예시/);assert.equal(d.querySelectorAll('input,.step-check,[data-step]').length,0);assert.equal(renderCoursePostVisual({stepId:'D04-3'}),'');dom.window.close();
});
test('시각화 탭이 실제 패널을 가리키고 전체 서비스 정답 대신 관찰할 코드 한 줄을 먼저 보여준다',()=>{
  const dom=new JSDOM(renderCoursePostVisual({stepId:'D04-4'}));const d=dom.window.document;
  for(const tab of d.querySelectorAll('[aria-controls]'))assert.ok(d.getElementById(tab.getAttribute('aria-controls')),tab.getAttribute('aria-controls'));
  for(const p of d.querySelectorAll('[data-cpv-panel]'))assert.ok(p.querySelector('pre code').textContent.split('\n').length<=2);
  dom.window.close();
});
test('예상상태 선택·키보드 이동은 실제API입력·진도·네트워크에 손대지 않는다',()=>{
  const dom=new JSDOM('<input data-ca-id value="99">'+renderCoursePostVisual({stepId:'D04-4'}),{url:'http://localhost:3000/'});const w=dom.window,d=w.document;w.localStorage.setItem('javaexperience.course.progress.v1','unchanged');let calls=0;w.fetch=()=>{calls++;throw Error('시각화는 요청하지 않는다');};
  mountCoursePostVisual(d);const first=d.querySelector('[data-cpv-state="created"]');first.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));assert.equal(d.querySelector('[data-cpv-state="rolled-back"]').getAttribute('aria-selected'),'true');
  assert.equal(d.querySelector('[data-cpv-panel="rolled-back"]').hidden,false);assert.equal(d.querySelector('[data-ca-id]').value,'99');assert.equal(w.localStorage.getItem('javaexperience.course.progress.v1'),'unchanged');assert.equal(calls,0);dom.window.close();
});
