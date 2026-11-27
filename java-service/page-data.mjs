const unique = values => [...new Set(values)];

function firstServiceStage(stage, featureId) {
  if (!stage) return null;
  return {
    id:stage.id,
    day:stage.day,
    featureId:stage.featureId || featureId,
    project:stage.project,
    mode:'service',
  };
}

function compactServiceDay(day) {
  if (day.mode!=='service'||!day.brief) return day;
  const {story,scope,excluded,examples,...brief}=day.brief;
  return {...day,brief};
}

export function preparePageData(course) {
  const modules=[...course.modules,...(course.attachedModules||[])];
  const apiById=new Map();
  for (const module of modules) for (const api of module.apis||[]) {
    apiById.set(api.id,{...api,moduleId:module.id});
  }

  const compactModule=module=>{
    const {apis:moduleApis=[],serviceExtensions=[],serviceLinks=[],...rest}=module;
    const compact={
      ...rest,
      days:module.days.map(compactServiceDay),
      apiIds:unique([...(module.apiIds||[]),...moduleApis.map(api=>api.id)]),
      serviceExtensions:serviceExtensions.map(service=>({
        id:service.id,
        title:service.title,
        stageCount:service.days.length,
        firstStage:firstServiceStage(service.days[0],service.id),
      })),
      serviceLinks:serviceLinks.map(link=>({
        ...link,
        serviceModule:{
          id:link.serviceModule.id,
          title:link.serviceModule.title,
          mode:'service',
          firstStage:firstServiceStage(link.serviceModule.days[0],link.feature),
        },
      })),
    };
    if (module.source==='service') {
      compact.brief={purpose:module.brief.purpose};
      delete compact.tables;
      delete compact.sourceRefs;
      delete compact.manualDb;
    }
    return compact;
  };

  return {
    ...course,
    apis:[...apiById.values()],
    modules:course.modules.map(compactModule),
    attachedModules:(course.attachedModules||[]).map(compactModule),
  };
}
