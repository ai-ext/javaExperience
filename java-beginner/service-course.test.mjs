import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {convertServiceCourse} from './service-course.mjs';
import {moduleMarkup,route} from './view.mjs';
import {readServiceProgress,writeServiceProgress} from './progress.mjs';

test('서비스 원본 94개 feature의 138단계와 참조 recipe 계약을 모두 변환한다', async () => {
  const {course} = await import('./course.mjs');
  const {loadServiceCourse} = await import('./service-course.mjs');
  const service=loadServiceCourse();
  const contracts=JSON.parse(readFileSync(new URL('../service/api-contracts.json',import.meta.url),'utf8'));
  const contractById=new Map(contracts.recipes.map(recipe=>[recipe.id,recipe]));
  const days=service.modules.flatMap(module=>module.days);
  const apiById=new Map(service.modules.flatMap(module=>module.apis.map(api=>[api.id,api])));
  assert.equal(service.modules.length,94);
  assert.equal(days.length,138);
  assert.equal(new Set(service.modules.map(module=>module.id)).size,94);
  assert.equal(new Set(service.modules.map(module=>module.group)).size,11);
  assert.equal(new Set(service.modules.map(module=>module.color)).size,11);
  assert.equal(apiById.size,769);
  assert.ok(service.modules.every(module=>Array.isArray(module.screens)));
  for(const module of service.modules){
    assert.equal(module.mode,'service');
    assert.ok(module.title&&module.result&&module.level&&module.color);
    assert.ok(module.brief.purpose&&module.brief.story!==undefined&&module.brief.scope!==undefined&&module.brief.excluded!==undefined);
    for(const key of ['policies','acceptance','tables','apis','screens','variants'])assert.ok(Array.isArray(module[key]),`${module.id}: ${key} 배열 필드 누락`);
    assert.deepEqual(module.projectOptions.map(option=>option.project).sort(),['board','community','practice','project-v1']);
    for(const day of module.days){
      assert.ok(day.title&&day.goal&&day.tasks.length&&day.check.length&&day.concept);
      for(const key of ['purpose','story','scope','excluded','inputs','preconditions','scenarios','policies','success','failures','examples','done'])assert.ok(Object.hasOwn(day.brief,key),`${module.id}/${day.id}: brief.${key} 필드 누락`);
      assert.ok(day.brief.purpose&&day.brief.scope&&day.brief.excluded);
      for(const key of ['hints','executionChecks','sourceUnits','sourceLinks','concepts','references','tables','screens','apiIds'])assert.ok(Array.isArray(day[key]),`${module.id}/${day.id}: ${key} 배열 필드 누락`);
      for(const id of day.apiIds){
        const recipe=apiById.get(id);
        const contract=contractById.get(id);
        assert.ok(recipe,`${module.id}/${day.project}/${day.sourceStageId}: API recipe ${id} 누락`);
        assert.ok(contract,`${id}: 원본 API recipe 누락`);
        assert.equal(recipe.project,day.project,`${id}: 프로젝트 계약 불일치`);
        assert.equal(recipe.path,contract.path,`${id}: API recipe 경로가 원본 계약과 다름`);
        assert.equal(recipe.method,contract.method,`${id}: API method가 원본 계약과 다름`);
        assert.ok(Array.isArray(recipe.requestFields)&&Array.isArray(recipe.responseFields)&&Array.isArray(recipe.cases),`${id}: API 필드 또는 사례 배열 누락`);
        assert.ok(recipe.cases.some(item=>item.expectedStatuses?.some(status=>status<400)||item.label==='정상 요청'),`${id}: 정상 사례 누락`);
        assert.ok(recipe.cases.some(item=>item.expectedStatuses?.some(status=>status>=400)||item.label?.startsWith('기획서 실패 사례 · ')),`${id}: 원문 실패 사례 누락`);
      }
    }
  }
  assert.equal(course.modules.length,12,'입문 과정 원본을 변환기가 수정하지 않는다');
  assert.equal(course.modules.flatMap(module=>module.days).length,60);
  const multi=service.modules.find(module=>module.variants.length>1);
  const first=multi.days.find(day=>day.concepts.length) || multi.days[0];
  const markup=moduleMarkup(multi,first,'task',[]);
  assert.match(markup,/id="project-select"/);
  assert.match(markup,/data-hint-open/);
  assert.match(markup,/실행 확인/);
  assert.match(markup,/관련 개념/);
  assert.match(route(multi,first),new RegExp(`^#feature=${multi.id}&project=${first.project}&stage=${encodeURIComponent(first.id)}&d=\\d+&t=task$`));
});

test('서비스 진도는 기존 v1 저장 구조·키를 보존하며 feature·project·stage별로 기록한다',()=>{
  const storage={value:JSON.stringify({version:1,completed:{existing:true},stages:{keep:{board:{old:true}}},untouched:'keep'}),getItem(){return this.value;},setItem(key,value){assert.equal(key,'javaexperience.service.progress.v1');this.value=value;}};
  const course=convertServiceCourse({features:[{id:'f',title:'기능',summary:'요약',difficulty:'기초',group:'게시글과 소통',prerequisites:[],variants:[{id:'board',project:'board',stages:[{id:'create',title:'생성',brief:{purpose:'목적',task:'할 일',work:['만들기'],done:['확인']},recipeIds:[]}]}]}],contracts:{recipes:[]},sourceIndex:{units:[]}});
  const day=course.modules[0].days[0];
  assert.deepEqual(readServiceProgress(storage,course),[]);
  assert.deepEqual(writeServiceProgress(storage,course,day,true),[1]);
  const saved=JSON.parse(storage.value);
  assert.equal(saved.stages.f.board.create,true);
  assert.equal(saved.completed.f,true);
  assert.equal(saved.stages.keep.board.old,true);
  assert.equal(saved.untouched,'keep');
});

test('변환기는 주어진 원본 묶음에서도 빈 필드를 만들지 않는다',()=>{
  const feature={id:'sample',title:'샘플 기능',summary:'기능 요약',difficulty:'기초',group:'개발 준비',prerequisites:[],variants:[{id:'board',project:'board',stages:[{id:'first',title:'첫 단계',sourceUnits:[],brief:{purpose:'목적',task:'작업',work:['구현'],done:['확인'],data:[],policies:[],inputs:[],success:[],failures:[],examples:[],preconditions:[],scenario:[]},hints:[],executionChecks:[],recipeIds:[],concepts:[],references:[]}]}]};
  const converted=convertServiceCourse({features:[feature],contracts:{recipes:[]},sourceIndex:{units:[]}});
  const day=converted.modules[0].days[0];
  assert.equal(converted.modules.length,1);
  assert.equal(day.brief.purpose,'목적');
  assert.equal(day.goal,'작업');
  assert.deepEqual(day.check,['확인']);
});

test('#14 문체 덧씌우기는 화면 문구만 바꾸고 회차 원문·API·진도 식별자를 유지한다',()=>{
  const feature={id:'sample',title:'원본 제목',summary:'원본 요약',difficulty:'기초',group:'개발 준비',prerequisites:[],variants:[{id:'board',project:'board',stages:[{id:'first',title:'원본 회차',sourceUnits:[],brief:{purpose:'목적',task:'작업',work:['구현'],done:['확인']},hints:['원문 힌트'],recipeIds:[]}]}]};
  const view={id:'sample',title:'덧씌운 기능',result:'덧씌운 결과',brief:{purpose:'새 목적',story:'새 이야기',scope:'새 범위',excluded:'제외'},screens:[{name:'목록',columns:['제목'],actions:'읽기'}],policies:['새 정책'],acceptance:['새 완료 기준'],days:{'board:first':{title:'덧씌운 회차',goal:'새 목표',concept:'새 개념'}}};
  const converted=convertServiceCourse({features:[feature],contracts:{recipes:[]},sourceIndex:{units:[]},courseViews:{sample:view}});
  const module=converted.modules[0],day=module.days[0];
  assert.equal(module.title,'덧씌운 기능');assert.equal(module.result,'덧씌운 결과');
  assert.deepEqual(module.brief,{purpose:'새 목적',story:'새 이야기',scope:'새 범위',excluded:'제외'});
  assert.deepEqual(module.screens,view.screens);assert.deepEqual(module.policies,view.policies);assert.deepEqual(module.acceptance,view.acceptance);
  assert.equal(day.title,'덧씌운 회차');assert.equal(day.goal,'새 목표');assert.equal(day.concept,'새 개념');
  assert.deepEqual(day.hints,['원문 힌트']);assert.equal(day.id,'sample:board:first');assert.equal(day.sourceStageId,'first');
});
