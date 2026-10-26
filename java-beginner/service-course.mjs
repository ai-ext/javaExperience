import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GROUP_COLORS = {
  '포인트와 상점': 'amber', '조회와 성능': 'cyan', '예약과 지급': 'orange', '개발과 검증': 'blue',
  '자동화와 작업': 'violet', '운영과 안전': 'rose', '게시글과 소통': 'teal', '회원과 접근': 'indigo',
  '데이터 정합성': 'green', '개발 준비': 'slate', '배포와 복구': 'lime',
};
const PROJECT_LABELS = { board: '게시판', community: '커뮤니티', 'project-v1': '프로젝트 v1', practice: '실습' };
const asArray = (value) => Array.isArray(value) ? value : [];
const text = (value) => typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);
const unique = (values) => [...new Set(values.filter(Boolean))];

function readJson(file) { return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')); }

function recipeApi(recipe, allRecipes) {
  const statuses = recipe.expected?.statuses || [];
  const failures = asArray(recipe.sourceCases).map((item) => ({
    label: item.label || item.condition || item.id,
    expect: asArray(item.expected?.statuses)[0], expectedStatuses:asArray(item.expected?.statuses),
    note: item.expected?.description || item.condition || '',
  }));
  const siblingCases = allRecipes.filter((item) => item.project === recipe.project && item.method === recipe.method && item.path === recipe.path && item.id !== recipe.id && item.expected?.statuses?.some(status => status >= 400));
  for (const item of siblingCases) failures.push({label: item.label || item.id, expect: asArray(item.expected?.statuses)[0], expectedStatuses:asArray(item.expected?.statuses), note: item.expected?.description || ''});
  const fields = asArray(recipe.requestFields).map((field) => ({ name: field.name, type: field.type || '미정', required: Boolean(field.required), note: field.constraint || field.in || '' }));
  return {
    id: recipe.id, title: recipe.label || recipe.id, project:recipe.project, method: recipe.method, path: recipe.path,
    success: statuses[0], status: statuses[0], body: recipe.bodyKind === 'json' ? recipe.body : undefined,
    query: Object.entries(recipe.query || {}).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&'),
    headers: recipe.headers, auth: Boolean(recipe.requiresToken), multipart: recipe.bodyKind === 'multipart',
    response: recipe.expected?.bodyMode === 'empty' ? null : { expectedFields: asArray(recipe.expected?.fields), description: recipe.expected?.description },
    requestFields: fields,
    responseFields: recipe.expected?.bodyMode==='empty'?[]:asArray(recipe.expected?.fields).map(name => ({name,type:'원문 계약',note:recipe.expected?.description || ''})),
    prepare: asArray(recipe.prepare).join(' '), note: asArray(recipe.manualCheck).join(' '),
    capture: recipe.capture, manualDb: asArray(recipe.manualDb),
    cases: [{label:'정상 요청', expect:statuses[0], expectedStatuses:statuses, body:recipe.bodyKind === 'json' ? recipe.body : undefined, headers:recipe.headers, query:undefined}, ...failures],
  };
}

function stageData(feature, variant, stage, recipeById, sourceIndex) {
  const brief = stage.brief || {};
  const sql = unique(asArray(stage.recipeIds).flatMap(id => asArray(recipeById.get(id)?.manualDb).map(item => item.sql)));
  const dataItems = asArray(brief.data).map(item => ({
    name: text(item.name || item.label || '데이터'), reason: text(item.reason || item.description || item.value),
  }));
  if (sql.length) dataItems.push(...sql.map((query, index) => ({name:`DB 확인 SQL ${index + 1}`,reason:query})));
  const table = dataItems.length ? [{
    name: `${PROJECT_LABELS[variant.project] || variant.project} · ${stage.title} 데이터`,
    fields: dataItems.map(item => ({name:item.name,type:'원문 설계 항목',required:false,note:item.reason})),
    check: sql.join('\n\n') || '단계 원문에는 별도 확인 SQL이 없습니다.', sample:{items:dataItems.map(item=>item.name)}, note:'원문의 데이터 항목과 recipe DB 확인 SQL을 모았습니다. 테이블·필드 이름을 임의로 확정하지 않습니다.',
  }] : [];
  const scenarios = asArray(brief.scenario).map((item) => [item.start,item.action,item.result,item.after].filter(Boolean).join(' → '));
  const errors = asArray(brief.failures).map(item => `${item.when || item.condition || '실패 조건'}: ${item.result || item.expected || ''}${item.unchanged ? ` · 유지: ${item.unchanged}` : ''}`);
  const screenSource=stage.screens ?? brief.screens ?? feature.screens;
  const screens=asArray(screenSource).map((item,index)=>({name:text(item.name||item.title||`원문 화면 ${index+1}`),columns:asArray(item.columns||item.fields).map(field=>text(typeof field==='string'?field:field.label||field.name)),actions:text(item.actions||item.description||'')}));
  const common = {
    purpose: brief.purpose || feature.summary || '',
    story: [...scenarios, ...asArray(brief.preconditions)].join('\n'),
    scope: [brief.task, ...asArray(brief.inputs), ...asArray(brief.success), ...asArray(brief.work)].filter(Boolean).join('\n'),
    excluded: [...asArray(brief.failures).map(item => item.unchanged).filter(Boolean), ...errors].join('\n'),
  };
  return {
    mode:'service', day:0, id:`${feature.id}:${variant.project}:${stage.id}`, featureId:feature.id, sourceStageId:stage.id, project:variant.project,
    title:stage.title, goal:brief.task || brief.purpose || feature.summary,
    tasks:asArray(brief.work).length ? brief.work : [brief.task || stage.title],
    check:asArray(brief.done).length ? brief.done : asArray(brief.success),
    concept:asArray(stage.concepts).map(item => item.label || item.title).join(' · ') || '원문에 개념 이름이 등록되지 않았습니다.',
    apiIds:asArray(stage.recipeIds), brief: {
      ...common,
      purpose:common.purpose,
      story:common.story || brief.purpose || '',
      scope:common.scope || brief.task || '',
      excluded:common.excluded || '원문에 별도 제외 범위가 등록되지 않았습니다.',
      inputs:asArray(brief.inputs), preconditions:asArray(brief.preconditions), scenarios,
      policies:asArray(brief.policies), success:asArray(brief.success), failures:errors,
      examples:asArray(brief.examples), done:asArray(brief.done),
    }, hints:asArray(stage.hints), executionChecks:asArray(stage.executionChecks),
    sourceUnits:asArray(stage.sourceUnits), sourceLinks:asArray(stage.sourceUnits).map(id=>sourceIndex?.units?.find(unit=>unit.id===id)).filter(Boolean).map(unit=>({label:unit.title || unit.id,href:unit.href})).filter(item=>item.href), concepts:asArray(stage.concepts), references:asArray(stage.references),
    tables:table, screens,
  };
}

function apisForModule(ids, days, apiById) {
  return ids.map(id=>{
    const api=apiById.get(id);
    if(!api)return null;
    const failures=days.filter(day=>day.apiIds.includes(id)).flatMap(day=>day.brief.failures).map(note=>({
      label:`기획서 실패 사례 · ${note}`, note, expectedStatuses:[],
    }));
    const cases=api.cases.length>1?api.cases:[...api.cases,...failures];
    return {...api,cases};
  }).filter(Boolean);
}

export function convertServiceCourse({root=ROOT, features, contracts, sourceIndex, courseViews={}}={}) {
  const files = features || fs.readdirSync(path.join(root,'service/features')).filter(file => file.endsWith('.json')).sort().map(file => JSON.parse(fs.readFileSync(path.join(root,'service/features',file),'utf8')));
  const apiContracts = contracts || JSON.parse(fs.readFileSync(path.join(root,'service/api-contracts.json'),'utf8'));
  const recipes = asArray(apiContracts.recipes);
  const recipeById = new Map(recipes.map(recipe => [recipe.id,recipe]));
  const apiById = new Map(recipes.map(recipe => [recipe.id,recipeApi(recipe,recipes)]));
  let dayNumber=0;
  const modules=files.map((feature,index) => {
    const variants=asArray(feature.variants);
    const overlay=courseViews[feature.id]||{};
    const days=variants.flatMap(variant => asArray(variant.stages).map(stage => {
      const day=stageData(feature,variant,stage,recipeById,sourceIndex);
      const copy=overlay.days?.[`${variant.id}:${stage.id}`]||{};
      return {...day,title:copy.title||day.title,goal:copy.goal||day.goal,concept:copy.concept||day.concept};
    })).map(day=>({...day,day:++dayNumber}));
    const apiIds=unique(days.flatMap(day=>day.apiIds));
    const sqls=unique(apiIds.flatMap(id=>asArray(recipeById.get(id)?.manualDb).map(item=>item.sql)));
    const policies=unique(variants.flatMap(variant=>asArray(variant.stages).flatMap(stage=>asArray(stage.brief?.policies))));
    const acceptance=unique(variants.flatMap(variant=>asArray(variant.stages).flatMap(stage=>asArray(stage.brief?.done))));
    const mappedVariants=variants.map(variant=>({id:variant.id,project:variant.project,label:variant.label || PROJECT_LABELS[variant.project] || variant.project,stageIds:asArray(variant.stages).map(stage=>`${feature.id}:${variant.project}:${stage.id}`)}));
    return {
      id:feature.id,mode:'service',number:String(index+1).padStart(2,'0'),title:overlay.title||feature.title,label:feature.group || '기능',
      color:GROUP_COLORS[feature.group] || 'slate',level:feature.difficulty,result:overlay.result||feature.summary,
      group:feature.group, prerequisites:asArray(feature.prerequisites), variants:mappedVariants, days,
      projectOptions:Object.entries(PROJECT_LABELS).map(([project,label])=>({project,label})),
      brief:{purpose:overlay.brief?.purpose||feature.summary,story:overlay.brief?.story||days.map(day=>day.brief.story).filter(Boolean).join('\n\n'),scope:overlay.brief?.scope||days.map(day=>day.brief.scope).filter(Boolean).join('\n\n'),excluded:overlay.brief?.excluded||unique(days.map(day=>day.brief.excluded)).join('\n\n')},
      policies:overlay.policies||policies,acceptance:overlay.acceptance||acceptance,screens:overlay.screens||days.flatMap(day=>day.screens),tables:days.flatMap(day=>day.tables),apis:apisForModule(apiIds,days,apiById),
      manualDb:sqls, sourceRefs:asArray(sourceIndex?.units).filter(unit=>asArray(unit.sourceUnits).some(id=>days.some(day=>day.sourceUnits.includes(id)))),
    };
  });
  return {
    mode:'service',title:'서비스 만들기 · 실무 과정',subtitle:'기능 요구사항을 읽고 구현한 뒤 요청과 데이터로 확인합니다.',
    version:'94개 기능 · 138단계',hours:'기능 단위로 나누어 진행',
    introduction:'원문 feature JSON의 요구사항과 프로젝트별 API 계약을 단계별 화면에 담았습니다. 각 기능의 프로젝트와 단계를 골라 진행하세요.',
    routine:[['읽기','오늘 할 일','단계 기획서와 성공·실패 기준을 확인합니다.'],['구현','기능 작업','선택한 프로젝트의 요청·데이터 흐름을 구현합니다.'],['확인','API·DB','직접 요청을 보내고 DB 확인 SQL을 별도 클라이언트에서 실행합니다.'],['기록','결과 정리','실행 확인과 원문 링크를 남깁니다.']],
    outcomes:[['기능','요구사항을 작은 단계로 구현한다.'],['계약','프로젝트별 API 요청과 실패 조건을 확인한다.'],['데이터','실행 결과와 원문 기반 SQL을 직접 대조한다.'],['진도','기능·프로젝트·단계별 완료를 기록한다.']],
    limits:'실행 결과는 자동 채점되지 않습니다. API 응답과 DB 저장은 각자 직접 확인합니다.',
    setup:['서비스 실행기는 이 저장소의 로컬 중계 서버를 사용합니다.','각 프로젝트 서버 주소는 API 테스트 화면에서 로컬 주소로 선택합니다.','기획서의 예시와 원문 API 계약을 구분하고, 실제 id와 실행 결과를 기록하세요.'],
    sources:[], modules,
  };
}

export function loadServiceCourse() {
  const directory=path.join(ROOT,'service/course-view');
  const courseViews={};
  if(fs.existsSync(directory)) for(const file of fs.readdirSync(directory).filter(name=>name.endsWith('.json'))) {
    const item=JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
    if(item?.id&&file===`${item.id}.json`) courseViews[item.id]=item;
  }
  return convertServiceCourse({sourceIndex:readJson('service/generated-source-index.json'),courseViews});
}
