export function validateMergePlan(plan, beginnerCourse, serviceCourse) {
  const entries=plan.entries;
  if(!Array.isArray(entries) || entries.length!==serviceCourse.modules.length) throw new Error(`배치표는 실무 ${serviceCourse.modules.length}개 기능을 한 번씩 포함해야 합니다.`);
  const ids=serviceCourse.modules.map(module=>module.id);
  const assigned=entries.map(entry=>entry.feature);
  if(new Set(assigned).size!==assigned.length || ids.some(id=>!assigned.includes(id)) || assigned.some(id=>!ids.includes(id))) throw new Error('배치표의 실무 기능이 중복되거나 누락되었습니다.');
  const modules=new Map(beginnerCourse.modules.map(module=>[module.id,module]));
  for(const entry of entries){
    if(!['extend','link','append'].includes(entry.type)) throw new Error(`잘못된 배치 유형: ${entry.feature}`);
    if(entry.type==='append') continue;
    const module=modules.get(entry.module);
    if(!module) throw new Error(`입문 기능을 찾을 수 없습니다: ${entry.module}`);
    if(entry.type==='extend' && !module.days.some(day=>day.day===entry.after)) throw new Error(`입문 회차를 찾을 수 없습니다: ${entry.module}/${entry.after}`);
    if(entry.type==='link' && !module.days.some(day=>day.day===entry.day)) throw new Error(`입문 회차를 찾을 수 없습니다: ${entry.module}/${entry.day}`);
  }
  const append=entries.filter(entry=>entry.type==='append').map(entry=>entry.order).sort((a,b)=>a-b);
  if(new Set(append).size!==append.length || append.some((order,index)=>order!==index+13)) throw new Error('append 순서는 13부터 중복 없이 이어져야 합니다.');
  return true;
}

export function combineCourses(beginnerCourse, serviceCourse, plan) {
  validateMergePlan(plan,beginnerCourse,serviceCourse);
  const byId=new Map(serviceCourse.modules.map(module=>[module.id,module]));
  const beginnerModules=beginnerCourse.modules.map(module=>{
    const extensions=plan.entries.filter(entry=>entry.type==='extend'&&entry.module===module.id).map(entry=>byId.get(entry.feature));
    return {...module,source:'beginner',days:[...module.days.map(day=>({...day,progressId:day.day})),...extensions.flatMap(feature=>feature.days.map(day=>({...day,mode:'service',source:'service',featureId:feature.id,progressId:`service:${day.id}`,attachedTo:module.id})))],
    serviceExtensions:extensions,
    serviceLinks:plan.entries.filter(entry=>entry.type==='link'&&entry.module===module.id).map(entry=>({...entry,serviceModule:byId.get(entry.feature)})),
  };});
  const serviceModules=plan.entries.filter(entry=>entry.type==='append').sort((a,b)=>a.order-b.order).map((entry,index)=>({...byId.get(entry.feature),number:String(entry.order).padStart(2,'0'),appendOrder:entry.order,source:'service',days:byId.get(entry.feature).days.map(day=>({...day,progressId:`service:${day.id}`}))}));
  return {
    ...beginnerCourse,
    mode:'combined',
    modules:[...beginnerModules,...serviceModules],
    attachedModules:plan.entries.filter(entry=>entry.type!=='append').map(entry=>({...byId.get(entry.feature),source:'service',merge:entry,days:byId.get(entry.feature).days.map(day=>({...day,progressId:`service:${day.id}`}))})),
    serviceModuleIds:serviceModules.map(module=>module.id),
  };
}
