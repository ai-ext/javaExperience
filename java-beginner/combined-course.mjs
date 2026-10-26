export function combineCourses(beginnerCourse, serviceCourse) {
  const beginnerModules=beginnerCourse.modules.map(module=>({...module,source:'beginner',days:module.days.map(day=>({...day,progressId:day.day}))}));
  const serviceModules=serviceCourse.modules.map(module=>({...module,source:'service',days:module.days.map(day=>({...day,progressId:`service:${day.id}`}))}));
  return {
    ...beginnerCourse,
    mode:'combined',
    modules:[...beginnerModules,...serviceModules],
    serviceModuleIds:serviceModules.map(module=>module.id),
  };
}
