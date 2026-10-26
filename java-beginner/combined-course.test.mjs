import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {course} from './course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {combineCourses} from './combined-course.mjs';
import {moduleMarkup} from './view.mjs';
import {readCourseProgress, writeServiceProgress} from './progress.mjs';

test('두 과정의 기능 순서, 출처, 고유 회차 식별자를 합친다',()=>{
  const combined=combineCourses(course,loadServiceCourse());
  assert.equal(combined.modules.length,106);
  assert.deepEqual(combined.modules.slice(0,12).map(module=>module.id),course.modules.map(module=>module.id));
  assert.equal(combined.modules.filter(module=>module.source==='beginner').length,12);
  assert.equal(combined.modules.filter(module=>module.source==='service').length,94);
  assert.equal(new Set(combined.modules.flatMap(module=>module.days.map(day=>day.progressId))).size,198);
  assert.deepEqual(combined.modules.slice(0,12).flatMap(module=>module.days).map(day=>day.progressId),Array.from({length:60},(_,index)=>index+1));
  assert.equal(combined.modules[12].days[0].progressId,`service:${combined.modules[12].days[0].id}`);
});

test('서비스 단계와 입문 회차는 기존 진도 저장 키를 독립적으로 유지한다',()=>{
  const combined=combineCourses(course,loadServiceCourse());
  const stored=new Map([
    ['java-beginner.standalone.progress.v2',JSON.stringify([1,60])],
    ['javaexperience.service.progress.v1',JSON.stringify({version:1,completed:{},stages:{[combined.modules[12].id]:{[combined.modules[12].days[0].project]:{[combined.modules[12].days[0].sourceStageId]:true}}}})],
  ]);
  const storage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value)};
  assert.deepEqual(readCourseProgress(storage,combined),[1,60,combined.modules[12].days[0].progressId]);
  const serviceDay=combined.modules[12].days[0];
  writeServiceProgress(storage,combined,serviceDay,false);
  assert.deepEqual(JSON.parse(stored.get('java-beginner.standalone.progress.v2')),[1,60]);
  assert.equal(JSON.parse(stored.get('javaexperience.service.progress.v1')).stages[combined.modules[12].id][serviceDay.project][serviceDay.sourceStageId],false);
});

test('통합 뒤에도 입문 과정 60회차 화면이 기존 렌더링과 같다',()=>{
  const rows=[];
  for(const module of course.modules) for(const day of module.days) for(const tab of ['task','brief','data','api']) {
    rows.push([module.id,day.day,tab,moduleMarkup(module,day,tab,[]).replaceAll('java-service.html#feature=','#feature=')]);
  }
  const digest=createHash('sha256').update(rows.map(row=>row.join('\0')).join('\n')).digest('hex');
  assert.equal(rows.length,240);
  assert.equal(digest,'31c20d134c62d732c964a4ed7311ea9f25664d5216346aceeb1c6a5df94b4b41');
});
