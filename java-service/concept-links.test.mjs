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
  assert.equal(Object.keys(conceptLinks).filter(key=>/^\d+$/.test(key)).length,days.length);
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
  const expectedServiceLinks=Object.values(conceptLinks.serviceStages).reduce((count,links)=>count+links.length,0);
  assert.ok(serviceHrefs.length>=expectedServiceLinks);
  for(const href of [...beginnerHrefs,...serviceHrefs]){
    assert.ok(!href.startsWith('/'),`개념 링크가 루트 절대 경로임: ${href}`);
    assert.ok(existsSync(resolve(href.split(/[?#]/)[0])),`개념 링크 문서 파일 없음: ${href}`);
  }
  assert.ok(serviceHrefs.some(href=>href.startsWith('docs/knowledge/')||href.startsWith('lessons/')));
});

test('실무 138단계의 개념 링크가 실제 문서를 가리킨다',()=>{
  const combined=combineCourses(course,loadServiceCourse(),JSON.parse(readFileSync(new URL('./merge-plan.json',import.meta.url),'utf8')));
  const serviceModules=[...combined.attachedModules,...combined.modules.filter(module=>module.source==='service')];
  const days=serviceModules.flatMap(module=>module.days);
  assert.equal(days.length,138);
  for(const day of days){
    assert.ok(Array.isArray(day.concepts),`${day.id} 개념 링크 목록 누락`);
    for(const link of day.concepts){
      assert.ok(link.label,`${day.id} 링크 제목 누락`);
      assert.ok(link.href&&!link.href.startsWith('/'),`${day.id} 루트 상대 경로가 아님: ${link.href}`);
      assert.ok(existsSync(resolve(link.href.split(/[?#]/)[0])),`${day.id} 문서 파일 없음: ${link.href}`);
    }
  }
});

test('실무 개념 링크는 단계 근거와 연결 수·문서 분포 기준을 지킨다',()=>{
  const stages=conceptLinks.serviceStages;
  assert.equal(Object.keys(stages).length,103);
  const uses=new Map();
  for(const [id,links] of Object.entries(stages)){
    assert.ok(Array.isArray(links),`${id} 링크는 배열이어야 함`);
    assert.ok(links.length<=2,`${id} 링크가 2개를 초과함`);
    const [featureId,variantId,stageId]=id.split(':');
    const feature=JSON.parse(readFileSync(new URL(`../service/features/${featureId}.json`,import.meta.url),'utf8'));
    const stage=feature.variants.find(item=>item.id===variantId)?.stages.find(item=>item.id===stageId);
    assert.ok(stage,`${id} 원문 단계가 없음`);
    for(const link of links){
      assert.ok(link.reason?.trim(),`${id} ${link.href} 연결 이유 누락`);
      assert.ok(link.reason.length<=60,`${id} 연결 이유가 60자를 초과함: ${link.reason}`);
      assert.ok(!/단계의 [“"].+[”"] 확인에 필요한 .+ 개념입니다\.?$/u.test(link.reason),`${id} 템플릿형 이유 금지: ${link.reason}`);
      const sourcePath=resolve(link.href.replace(/\.html$/u,'.md'));
      assert.ok(existsSync(sourcePath),`${id} 원본 학습 문서가 없음: ${sourcePath}`);
      const document=readFileSync(sourcePath,'utf8').slice(0,12000);
      assert.ok(document.length>300,`${id} 문서 본문이 비어 있음: ${link.href}`);
      uses.set(link.href,(uses.get(link.href)||0)+1);
    }
  }
  const exceptions={};
  for(const [href,count] of uses){
    if(count>Math.floor(Object.keys(stages).length*.25)) assert.ok(exceptions[href]?.trim(),`${href}가 실무 단계의 25% 초과 사용: ${count}`);
  }
});
