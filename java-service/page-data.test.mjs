import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {course} from '../java-beginner/course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {combineCourses} from './combined-course.mjs';
import {preparePageData} from './page-data.mjs';

const mergePlan=JSON.parse(readFileSync(new URL('./merge-plan.json',import.meta.url),'utf8'));

test('페이지 데이터는 API를 한 번만 담고 링크 목록에 필요한 요약만 남긴다',()=>{
  const source=combineCourses(course,loadServiceCourse(),mergePlan);
  const page=preparePageData(source);
  const modules=[...page.modules,...page.attachedModules];
  const apiIds=new Set(page.apis.map(api=>api.id));
  assert.equal(page.apis.length,apiIds.size);
  assert.ok(modules.every(module=>!Object.hasOwn(module,'apis')));
  assert.ok(modules.every(module=>module.apiIds.every(id=>apiIds.has(id))));
  assert.ok(modules.filter(module=>module.source==='service').every(module=>!Object.hasOwn(module,'tables')&&!Object.hasOwn(module,'sourceRefs')&&!Object.hasOwn(module,'manualDb')));
  assert.ok(modules.flatMap(module=>module.days).filter(day=>day.mode==='service').every(day=>!['story','scope','excluded','examples'].some(key=>Object.hasOwn(day.brief,key))));
  assert.ok(modules.every(module=>module.serviceExtensions?.every(link=>!Object.hasOwn(link,'days')&&link.firstStage?.mode==='service')));
  assert.ok(modules.every(module=>module.serviceLinks?.every(link=>!Object.hasOwn(link.serviceModule,'apis')&&link.serviceModule.firstStage?.mode==='service')));
  const app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
  assert.doesNotMatch(app,/current\.m\.apis|m\.apis\.map/);
  assert.match(app,/course\.apis/);
  assert.doesNotMatch(readFileSync(new URL('./view.mjs',import.meta.url),'utf8'),/d\.brief\.(story|scope|excluded|examples)/);
});
