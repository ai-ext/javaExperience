// 번호가 바뀌어도 예전 인사 API의 완료를 게시판 완료로 바꾸지 않는다.
// v1 원본 저장 키는 삭제하지 않고 v2에 새 번호로 복사한다.
export function migrateLegacyProgress(saved) {
  if(!Array.isArray(saved)) return [];
  return [...new Set(saved.filter(n=>Number.isInteger(n)&&n>=5&&n<=60).map(n=>n<=57?n-4:n))];
}

export function readServiceProgress(storage, course) {
  let saved={version:1,completed:{},stages:{}};
  try {const parsed=JSON.parse(storage?.getItem('javaexperience.service.progress.v1')||'null');if(parsed?.version===1&&parsed.completed&&typeof parsed.completed==='object')saved={...parsed,stages:parsed.stages&&typeof parsed.stages==='object'?parsed.stages:{}};} catch {}
  return [...course.modules,...(course.attachedModules||[])].filter(module=>module.source==='service'||module.mode==='service').flatMap(module=>module.days.filter(day=>Boolean(saved.stages?.[module.id]?.[day.project]?.[day.sourceStageId || day.id.split(':').at(-1)])).map(day=>day.progressId||day.day));
}

export function readBeginnerProgress(storage) {
  const key='java-beginner.standalone.progress.v2';
  try {
    const current=storage?.getItem(key);
    const saved=current===null?migrateLegacyProgress(JSON.parse(storage?.getItem('java-beginner.standalone.progress.v1')||'[]')):JSON.parse(current);
    const progress=Array.isArray(saved)?[...new Set(saved.filter(n=>Number.isInteger(n)&&n>=1&&n<=60))]:[];
    if(current===null) storage?.setItem(key,JSON.stringify(progress));
    return progress;
  } catch { return []; }
}

export function readCourseProgress(storage, course) {
  return [...readBeginnerProgress(storage),...readServiceProgress(storage,course)];
}

export function writeServiceProgress(storage, course, day, done) {
  const key='javaexperience.service.progress.v1';
  let saved={version:1,completed:{},stages:{}};
  try {const parsed=JSON.parse(storage?.getItem(key)||'null');if(parsed?.version===1&&parsed.completed&&typeof parsed.completed==='object')saved={...parsed,stages:parsed.stages&&typeof parsed.stages==='object'?parsed.stages:{}};} catch {}
  saved.stages[day.featureId] ||= {};
  saved.stages[day.featureId][day.project] ||= {};
  saved.stages[day.featureId][day.project][day.sourceStageId] = Boolean(done);
  const feature=[...course.modules,...(course.attachedModules||[])].find(module=>module.id===day.featureId);
  saved.completed[day.featureId]=Boolean(feature?.variants.some(variant=>variant.stageIds.length>0&&variant.stageIds.every(id=>{const item=feature.days.find(candidate=>candidate.id===id);return item&&Boolean(saved.stages?.[day.featureId]?.[item.project]?.[item.sourceStageId]);})));
  try {storage?.setItem(key,JSON.stringify(saved));} catch {}
  return readCourseProgress(storage,course);
}
