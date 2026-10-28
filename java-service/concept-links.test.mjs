import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {course} from '../java-beginner/course.mjs';
import {loadServiceCourse} from './service-course.mjs';
import {combineCourses} from './combined-course.mjs';
import {moduleMarkup} from './view.mjs';

const conceptLinks=JSON.parse(readFileSync(new URL('./concept-links.json',import.meta.url),'utf8'));
const hrefs=markup=>[...markup.matchAll(/data-concept-link[^>]*href="([^"]+)"/g)].map(match=>match[1]);

test('입문 60회차 모두 제목과 저장소 문서 경로가 있는 개념 링크를 가진다',()=>{
  const days=course.modules.flatMap(module=>module.days);
  assert.equal(Object.keys(conceptLinks).length,days.length);
  for(const day of days){
    const links=conceptLinks[String(day.day)];
    assert.ok(Array.isArray(links)&&links.length>0,`Day ${day.day} 개념 링크 누락`);
    for(const link of links){
      assert.ok(link.label,`Day ${day.day} 링크 제목 누락`);
      assert.ok(link.href&&!link.href.startsWith('/'),`Day ${day.day} 루트 상대 경로가 아님: ${link.href}`);
      assert.ok(existsSync(resolve(link.href.split(/[?#]/)[0])),`Day ${day.day} 문서 파일 없음: ${link.href}`);
    }
  }
});

test('통합본의 모든 입문·실무 개념 링크가 실제 파일을 가리킨다',()=>{
  const combined=combineCourses(course,loadServiceCourse(),JSON.parse(readFileSync(new URL('./merge-plan.json',import.meta.url),'utf8')));
  const beginnerMarkup=course.modules.flatMap(module=>module.days.map(day=>moduleMarkup(module,day,'task',[]))).join('\n');
  const serviceModules=[...combined.attachedModules,...combined.modules.filter(module=>module.source==='service')];
  const serviceMarkup=serviceModules.flatMap(module=>module.days.map(day=>moduleMarkup(module,day,'task',[]))).join('\n');
  const beginnerHrefs=hrefs(beginnerMarkup);
  const serviceHrefs=hrefs(serviceMarkup);
  assert.equal(beginnerHrefs.length,122);
  assert.equal(serviceHrefs.length,97);
  for(const href of [...beginnerHrefs,...serviceHrefs]){
    assert.ok(!href.startsWith('/'),`개념 링크가 루트 절대 경로임: ${href}`);
    assert.ok(existsSync(resolve(href.split(/[?#]/)[0])),`개념 링크 문서 파일 없음: ${href}`);
  }
  assert.ok(serviceHrefs.includes('docs/knowledge/R04-sql-crud-join.html'));
});
