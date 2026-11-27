import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {course} from '../java-beginner/course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {combineCourses,validateMergePlan} from './combined-course.mjs';
import {moduleMarkup,route} from './view.mjs';
import {readCourseProgress, writeServiceProgress} from './progress.mjs';
import {readFileSync} from 'node:fs';

const mergePlan=JSON.parse(readFileSync(new URL('./merge-plan.json',import.meta.url),'utf8'));

test('두 과정의 기능 순서, 출처, 고유 회차 식별자를 합친다',()=>{
  const combined=combineCourses(course,loadServiceCourse(),mergePlan);
  assert.equal(validateMergePlan(mergePlan,course,loadServiceCourse()),true);
  assert.equal(combined.modules.length,29);
  assert.deepEqual(combined.modules.slice(0,12).map(module=>module.id),course.modules.map(module=>module.id));
  assert.equal(combined.modules.filter(module=>module.source==='beginner').length,12);
  assert.equal(combined.modules.filter(module=>module.source==='service').length,17);
  assert.equal(combined.attachedModules.length,77);
  assert.equal(new Set([...combined.modules,...combined.attachedModules].flatMap(module=>module.days.map(day=>day.progressId))).size,198);
  assert.deepEqual(combined.modules.slice(0,12).flatMap(module=>module.days).map(day=>day.progressId).filter(Number.isInteger),Array.from({length:60},(_,index)=>index+1));
  assert.equal(combined.modules[0].days.filter(day=>day.source==='service').length,loadServiceCourse().modules.filter(module=>mergePlan.entries.some(entry=>entry.type==='extend'&&entry.module==='board'&&entry.feature===module.id)).flatMap(module=>module.days).length);
  const board=combined.modules[0],firstExtension=board.days.find(day=>day.source==='service');
  assert.ok(board.days.indexOf(firstExtension)>7);
  assert.match(route(board,firstExtension),new RegExp(`^#feature=${firstExtension.featureId}&project=${firstExtension.project}&stage=`));
  assert.match(moduleMarkup(board,board.days.find(day=>day.source==='service'),'task',[]),/feature=.+&project=.+&stage=/);
  const firstServiceModule=combined.modules.find(module=>module.source==='service');
  assert.match(moduleMarkup(firstServiceModule,firstServiceModule.days[0],'task',[]),/🐝 1단계/);
  const extensionStages=board.days.filter(day=>day.source==='service');
  for(const featureId of new Set(extensionStages.map(day=>day.featureId))){
    const featureStages=extensionStages.filter(day=>day.featureId===featureId);
    assert.deepEqual(featureStages.map(day=>day.stageNumber),featureStages.map((_,index)=>index+1));
  }
  assert.ok(extensionStages.every(day=>day.progressId===`service:${day.id}`));
  assert.equal(combined.modules[12].days[0].progressId,`service:${combined.modules[12].days[0].id}`);
  const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.match(app,/d\.project===params\.get\('project'\)&&d\.sourceStageId===params\.get\('stage'\)\)\|\|m\.days\.find\(d=>d\.day===Number\(params\.get\('d'\)\)\)/);
  assert.match(route(firstServiceModule,firstServiceModule.days[0]),/#feature=.+&project=.+&stage=.+&d=\d+&t=task$/);
  assert.equal(readFileSync(new URL('./progress.mjs',import.meta.url),'utf8').includes('javaexperience.service.progress.v1'),true);
  assert.throws(()=>validateMergePlan({...mergePlan,entries:mergePlan.entries.slice(1)},course,loadServiceCourse()),/94개/);
});

test('부분 중복 안내는 실제 입문 회차를 가리킨다',()=>{
  const combined=combineCourses(course,loadServiceCourse(),mergePlan);
  const overlapping=mergePlan.entries.filter(entry=>entry.overlap);
  assert.equal(overlapping.length,19);
  assert.deepEqual(overlapping.map(entry=>entry.feature).sort(),['badword-policy','browser-access','comments','db-query-measure','member-suspension','members-auth','post-drafts','post-history','post-rate-limit','post-view-dedupe','posts-create-read','posts-edit-remove','posts-find','release-containers','runtime-ready','scheduled-publish','token-lifecycle','transaction-consistency','trash-restore'].sort());
  assert.equal(validateMergePlan(mergePlan,course,loadServiceCourse()),true);
  for(const entry of overlapping){
    const module=[...combined.attachedModules,...combined.modules.filter(item=>item.source==='service')].find(item=>item.id===entry.feature);
    const markup=moduleMarkup(module,module.days[0],'task',[]);
    assert.equal((markup.match(/class="overlap-note service-extra"/g)||[]).length,entry.overlap.length,`${entry.feature} 겹침 안내가 렌더링되어야 합니다.`);
    for(const overlap of entry.overlap)assert.ok(markup.includes(`href="#m=${encodeURIComponent(overlap.beginnerModule||entry.module)}&d=${overlap.beginnerDay}&t=task"`),`${entry.feature} Day ${overlap.beginnerDay} 연결 누락`);
  }
  const commentDay=combined.attachedModules.find(module=>module.id==='comments').days[0];
  const markup=moduleMarkup(combined.attachedModules.find(module=>module.id==='comments'),commentDay,'task',[]);
  assert.match(markup,/🌱 Day 12에서 이미 만든 부분/);
  assert.match(markup,/href="#m=search-comments&d=12&t=task"/);
  assert.throws(()=>validateMergePlan({...mergePlan,entries:mergePlan.entries.map(entry=>entry.feature==='comments'?{...entry,overlap:[{beginnerDay:999,note:'잘못된 회차'}]}:entry)},course,loadServiceCourse()),/겹침 안내 입문 회차/);
  assert.throws(()=>validateMergePlan({...mergePlan,entries:mergePlan.entries.map(entry=>entry.feature==='comments'?{...entry,overlap:[{beginnerDay:14,note:''}]}:entry)},course,loadServiceCourse()),/겹침 안내 문구/);
});

test('서비스 단계와 입문 회차는 기존 진도 저장 키를 독립적으로 유지한다',()=>{
  const combined=combineCourses(course,loadServiceCourse(),mergePlan);
  const stored=new Map([
    ['java-beginner.standalone.progress.v2',JSON.stringify([1,60])],
    ['javaexperience.service.progress.v1',JSON.stringify({version:1,completed:{},stages:{[combined.attachedModules[0].id]:{[combined.attachedModules[0].days[0].project]:{[combined.attachedModules[0].days[0].sourceStageId]:true}}}})],
  ]);
  const storage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
  assert.deepEqual(readCourseProgress(storage,combined),[1,60,combined.attachedModules[0].days[0].progressId]);
  const serviceDay=combined.attachedModules[0].days[0];
  writeServiceProgress(storage,combined,serviceDay,false);
  assert.deepEqual(JSON.parse(stored.get('java-beginner.standalone.progress.v2')),[1,60]);
  assert.equal(JSON.parse(stored.get('javaexperience.service.progress.v1')).stages[serviceDay.featureId][serviceDay.project][serviceDay.sourceStageId],false);
});

test('통합 뒤에도 입문 과정 60회차 화면이 기존 렌더링과 같다',()=>{
  // 팀원 원본 페이지는 java-beginner/에 그대로 있다. 이 검사는 통합본 안의 입문 회차 화면이 바뀌지 않았는지 본다(폴더 이동으로 바뀐 실행기 경로만 맞춘다).
  const rows=[];
  for(const module of course.modules) for(const day of module.days) for(const tab of ['task','brief','data','api']) {
    rows.push([module.id,day.day,tab,moduleMarkup(module,day,tab,[]).replaceAll('java-service.html#feature=','#feature=').replaceAll('node java-service/server.mjs','node java-beginner/server.mjs').replace(/<nav class="concept-links[^>]*>[\s\S]*?<\/nav>/g,'').replace(/<section class="overlap-note[^>]*>[\s\S]*?<\/section>/g,'').replace(/<a href="#feature=([^\"]+)">[^<]+ ↗<\/a>/g,'<a href="#feature=$1">$1 ↗</a>')]);
  }
  const digest=createHash('sha256').update(rows.map(row=>row.join('\0')).join('\n')).digest('hex');
  assert.equal(rows.length,240);
  assert.equal(digest,'31c20d134c62d732c964a4ed7311ea9f25664d5216346aceeb1c6a5df94b4b41');
});
