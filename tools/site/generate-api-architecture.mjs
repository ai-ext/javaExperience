import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const blobDir = path.join(root, 'scenario/snapshots/blobs');
const output = path.join(root, 'scenario/api-architecture.json');
const inputSets = [
  { id: 'community-board', label: '게시판 실습 프로젝트', description: '16-4 공개 스냅샷에 입문 0-8과 나중에 추가된 1-9 태그 조회를 보충한 하나의 Spring 프로젝트.', snapshot: 'scenario/reference/16-4.json', supplementalSnapshots: ['scenario/snapshots/0-8.json', 'scenario/snapshots/1-9.json'], commit: 'dfad04f5ada4d9cd1236b8a5dbde6922815f7f0d' },
  { id: 'spec-board', label: '명세서 프로젝트', description: '10-12 별도 Spring 프로젝트. /api/v1 게시판 명세 구현.', snapshot: 'scenario/snapshots/10-12.json', commit: 'a431326e3db54f4c355a7f0d2fc8498b113dfd9b' },
];
const methodAnnotations = new Map([
  ['GetMapping', ['GET']], ['PostMapping', ['POST']], ['PutMapping', ['PUT']],
  ['PatchMapping', ['PATCH']], ['DeleteMapping', ['DELETE']],
]);
const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'TRACE'];
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]); }
function readCheckRequests() {
  const docs=[];
  for(const file of walk(path.join(root,'scenario')).filter(f=>f.endsWith('.md'))){
    const rel=path.relative(path.join(root,'scenario'),file).split(path.sep).join('/');
    const stage=path.basename(file).match(/^(\d{1,2}-\d{1,2})-/)?.[1]; if(!stage) continue;
    const text=fs.readFileSync(file,'utf8');
    for(const block of text.matchAll(/```check\s*\n([\s\S]*?)\n```/g)){
      try { const data=JSON.parse(block[1]); for(const req of data.requests??[]) if(req.method&&req.path) docs.push({stage,file:rel,method:req.method.toUpperCase(),path:req.path.split('?')[0]}); }
      catch { /* malformed checks do not create speculative links */ }
    }
  }
  return docs;
}
const checkRequests=readCheckRequests();
function stageCompare(a,b){const nums=x=>x.startsWith('L')?[99,Number(x.slice(1))]:x.split('-').map(Number);const aa=nums(a),bb=nums(b);return aa[0]-bb[0]||aa[1]-bb[1];}
function matchSpecificity(template, concrete){
  const a=norm(template).split('/').filter(Boolean), b=norm(concrete).split('/').filter(Boolean); if(a.length!==b.length)return -1;
  let score=0; for(let i=0;i<a.length;i++){if(/^\{[^}]+\}$/.test(a[i]))score+=1;else if(a[i]===b[i])score+=4;else return -1;} return score;
}
function featureFor(route){
  const p=route.path;
  if(/\/comments?(?:\/|$)/.test(p))return '댓글';
  if(/\/(?:like|likes)(?:\/|$)/.test(p))return '좋아요';
  if(/\/(?:bookmark|bookmarks|bookmark-folders)(?:\/|$)/.test(p))return '북마크';
  if(/\/(?:poll|votes)(?:\/|$)/.test(p))return '투표';
  if(/\/(?:reaction|reactions)(?:\/|$)/.test(p))return '반응';
  if(/\/series(?:\/|$)/.test(p))return '시리즈';
  if(/\/posts?(?:\/|$)/.test(p))return '게시글';
  if(/\/boards?(?:\/|$)/.test(p))return '게시판';
  if(/\/users?(?:\/|$)|\/auth(?:\/|$)|\/members?(?:\/|$)/.test(p))return '회원·인증';
  if(/\/start(?:\/|$)/.test(p))return '입문 API';
  if(/\/admin(?:\/|$)/.test(p))return '운영·관리';
  if(/\/search(?:\/|$)/.test(p))return '검색';
  if(/\/rankings?(?:\/|$)/.test(p))return '랭킹';
  if(/\/stats?(?:\/|$)/.test(p))return '통계';
  if(/\/images?(?:\/|$)/.test(p))return '이미지';
  if(/\/feed(?:\/|$)/.test(p))return '피드';
  const parts=p.split('/').filter(Boolean).filter(s=>s!=='api'&&s!=='me'&&!/^\{/.test(s));
  const names={'fake-site':'가짜 외부 사이트','hello':'hello 응답','ping':'헬스 확인','notifications':'알림','recent-posts':'최근 본 글','drafts':'임시저장 글','trash':'휴지통','follow':'팔로우','follow-back':'맞팔','mute':'뮤트','suggestions':'추천','mutuals':'공통 관계','reports':'신고','hall-of-fame':'명예의 전당','shared':'공유'};
  return names[parts[0]]??parts[0]?.replace(/-/g,' ')??'기타 API';
}
const srcText = (file) => fs.readFileSync(path.join(blobDir, `${file.blob}.txt`), 'utf8');
const simple = (p) => path.posix.basename(p);
function values(annotation) {
  const m = annotation.match(/@\w+\s*\(([^)]*)\)/s);
  if (!m) return [''];
  const body = m[1];
  const matches = [...body.matchAll(/(?:value|path)?\s*=\s*(\{[^}]*\}|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g)];
  let raw = matches.flatMap(x => x[1].startsWith('{') ? [...x[1].matchAll(/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g)].map(y => y[1] ?? y[2]) : [x[1].slice(1,-1)]);
  if (!raw.length) raw = [...body.matchAll(/"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'/g)].map(x => x[1] ?? x[2]);
  return raw.length ? raw : [''];
}
const norm = (p) => ('/' + p.split('/').filter(Boolean).join('/')).replace(/\{[^/]+?:(.*?)\}/g, '{$1}').replace(/\/$/, '') || '/';
const routeKeyPath = (p) => norm(p).replace(/\{[^}]+\}/g,'{}');
function annotationAt(source, index) {
  const prefix = source.slice(0, index);
  const annotations = [...prefix.matchAll(/@([A-Za-z][\w.]*)\s*(?:\((?:[^()]|\([^()]*\))*\))?/g)];
  const last = annotations.at(-1);
  if (!last || prefix.slice(last.index + last[0].length).trim()) return null;
  return last[0];
}
function classes(source) {
  const out=[];
  const re=/\b(?:class|record|interface|enum)\s+(\w+)/g; let m;
  while((m=re.exec(source))) out.push({name:m[1], index:m.index});
  return out;
}
function mapSource(project, snapshot) {
  const files=snapshot.files.filter(f=>f.path.endsWith('.java')).map(f=>({...f, source:srcText(f)}));
  const fileByName=new Map(files.map(f=>[simple(f.path),f]));
  const result=new Map();
  let recognized=0, resolved=0;
  for(const f of files){
    const src=f.source;
    const isController=/@(?:RestController|Controller)\b/.test(src) || /Controller\.java$/.test(f.path);
    if(!isController) continue;
    const classIndex=src.search(/\bclass\s+\w+/);
    const prefix=src.slice(0,classIndex);
    const baseAnn=[...prefix.matchAll(/@(RequestMapping)\s*(?:\((?:[^()]|\([^()]*\))*\))?/g)].at(-1)?.[0] ?? null;
    const basePaths=baseAnn?values(baseAnn):[''];
    const methodRe=/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\((?:[^()]|\([^()]*\))*\))?/g; let m;
    while((m=methodRe.exec(src))){
      if(m.index < classIndex) continue;
      recognized++;
      const ann=m[0], name=m[1], methods=methodAnnotations.get(name) ?? (()=>{
        const meth=ann.match(/(?:method\s*=\s*)\{?\s*RequestMethod\.(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)/g);
        return meth ? [...new Set(meth.map(x=>x.match(/RequestMethod\.(\w+)/)[1]))] : ['GET','POST','PUT','PATCH','DELETE'];
      })();
      const localPaths=values(ann);
      const after=src.slice(methodRe.lastIndex);
      const declaration=after.match(/(?:public|protected|private)\s+(?:static\s+)?[\w.$<>?, \[\]]+\s+(\w+)\s*\(([^)]*)\)/s);
      if(!declaration) continue;
      resolved++;
      const before=src.slice(Math.max(classIndex,src.lastIndexOf('\n',m.index-1)-240),m.index);
      const stageMatches=[...before.matchAll(/(?:^|\n)\s*\/\/[^\n]*?\b(\d{1,2}-\d{1,2}|L\d{1,2})\b/g)].map(x=>x[1]);
      const stages=[...new Set(stageMatches.slice(-2))];
      for(const base of basePaths) for(const local of localPaths) for(const method of methods){
        const p=norm(`${base}/${local}`); const key=`${method} ${routeKeyPath(p)}`;
        let route=result.get(key);
        if(!route){route={method,path:p,feature:'',firstStage:stages[0]??null,stages,controller:[],service:[],repository:[],requestDto:[],responseDto:[],entity:[],db:[]};result.set(key,route)}
        route.controller.push(simple(f.path));
        const paramText=declaration[2];
        // Find the declared type after @RequestBody; annotation arguments may include nested parentheses.
        const bodyParams=[...paramText.matchAll(/@RequestBody(?:\([^)]*\))?\s+([\w.$<>?,]+)\s+\w+/g)].map(x=>x[1].split('.').at(-1).replace(/<.*$/,''));
        route.requestDto.push(...bodyParams.filter(t=>t!=='JsonNode'));
        const returnType=after.match(/(?:public|protected|private)\s+(?:static\s+)?([\w.$<>?, \[\]]+)\s+\w+\s*\(/s)?.[1]?.trim();
        if(returnType) for(const t of returnType.match(/[A-Z]\w+/g)??[]) if(/Response|View|Dto|Result|Summary|Item/.test(t) && !['ResponseEntity','ApiResponse'].includes(t)) route.responseDto.push(t);
        const methodBody=after.slice(declaration.index + declaration[0].length).split(/\n\s*@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\b/)[0];
        const serviceFields=[...src.matchAll(/private\s+final\s+(\w+Service)\s+(\w+)/g)].filter(x=>new RegExp(`\\b${x[2]}\\s*\\.`).test(methodBody)).map(x=>x[1]);
        for(const service of serviceFields){
          const sf=fileByName.get(`${service}.java`); if(!sf) continue;
          route.service.push(`${service}.java`);
          for(const repo of [...sf.source.matchAll(/(?:private\s+final\s+|\b)(\w+Repository|\w+Mapper)\s+\w+/g)].map(x=>x[1])) if(fileByName.has(`${repo}.java`)) {
            route.repository.push(`${repo}.java`);
            const rf=fileByName.get(`${repo}.java`);
            for(const entity of [...rf.source.matchAll(/extends\s+JpaRepository\s*<\s*(\w+)/g)].map(x=>x[1])) if(fileByName.has(`${entity}.java`)) route.entity.push(`${entity}.java`);
          }
          for(const entity of [...sf.source.matchAll(/\b(?:new\s+|\w+\s+)(\w+Entity)\b/g)].map(x=>x[1])) if(fileByName.has(`${entity}.java`)) route.entity.push(`${entity}.java`);
        }
      }
    }
  }
  const sourceMappingCount=files.filter(f=>/@(?:RestController|Controller)\b/.test(f.source)||/Controller\.java$/.test(f.path)).reduce((n,f)=>n+[...f.source.matchAll(/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\((?:[^()]|\([^()]*\))*\))?/g)].filter(m=>m.index >= f.source.search(/\bclass\s+\w+/)).length,0);
  if(recognized!==sourceMappingCount || resolved!==recognized) throw new Error(`${project.id}: mapping annotation coverage mismatch (recognized ${recognized}/${sourceMappingCount}, resolved ${resolved})`);
  if(result.size!==new Set([...result.keys()]).size) throw new Error(`${project.id}: duplicate method+path key after normalization`);
  const routeList=[...result.values()];
  const links=new Map(routeList.map(r=>[r,[]]));
  for(const q of checkRequests){
    const candidates=routeList.filter(r=>r.method===q.method).map(r=>({r,score:matchSpecificity(r.path,q.path)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score);
    if(candidates.length) links.get(candidates[0].r).push(q);
  }
  for(const r of result.values()){
    for(const key of ['controller','service','repository','requestDto','responseDto','entity','db']) r[key]=[...new Set(r[key])].sort();
    r.stages=[...new Set([...r.stages,...links.get(r).map(x=>x.stage)])].sort(stageCompare);
    r.firstStage=r.stages[0]??null; r.feature=featureFor(r);
  }
  return [...result.values()].sort((a,b)=>a.path.localeCompare(b.path,'en')||methodOrder.indexOf(a.method)-methodOrder.indexOf(b.method));
}
const projects=[];
for(const spec of inputSets){
  const snapshot=JSON.parse(fs.readFileSync(path.join(root,spec.snapshot),'utf8'));
  const routes=mapSource(spec,snapshot);
  const seenRoutes=new Set(routes.map(route=>`${route.method} ${routeKeyPath(route.path)}`));
  for(const supplementalPath of spec.supplementalSnapshots??[]){
    const supplemental=JSON.parse(fs.readFileSync(path.join(root,supplementalPath),'utf8'));
    for(const route of mapSource(spec,supplemental)){
      const key=`${route.method} ${routeKeyPath(route.path)}`;
      if(!seenRoutes.has(key)){routes.push(route);seenRoutes.add(key);}
    }
  }
  routes.sort((a,b)=>a.path.localeCompare(b.path,'en')||methodOrder.indexOf(a.method)-methodOrder.indexOf(b.method));
  const methods=Object.fromEntries(methodOrder.map(m=>[m,routes.filter(r=>r.method===m).length]).filter(([,n])=>n));
  const routeKeys=new Set(routes.map(r=>`${r.method} ${r.path}`));
  const createReadDelete=spec.id==='community-board'
    ? ['POST /api/posts','GET /api/posts/{id}','DELETE /api/posts/{id}']
    : spec.id==='spec-board'
      ? ['POST /api/v1/posts','GET /api/v1/posts/{postId}','DELETE /api/v1/posts/{postId}']
      : [];
  const continuity=createReadDelete.length && createReadDelete.every(key=>routeKeys.has(key))
    ? `${createReadDelete[0]}로 글을 만들고 응답의 ID로 ${createReadDelete[1]}을 조회한 뒤, 같은 ID로 ${createReadDelete[2]}을 실행한다.`
    : undefined;
  projects.push({id:spec.id,label:spec.label,description:spec.description,methods,...(continuity?{continuity}:{}),routes});
}
const labRoutes=[];
for(const [id, controllerPath] of [
  ['L12','scenario/labs/l12-query-methods/code/src/main/java/org/example/querypractice/BasicQueryController.java'],
  ['L13','scenario/labs/l13-declared-queries/code/src/main/java/org/example/querypractice/DeclaredQueryController.java'],
  ['L14','scenario/labs/l14-querydsl-extension/code/src/main/java/org/example/querypractice/QuerydslQueryController.java'],
]){
  const src=fs.readFileSync(path.join(root,controllerPath),'utf8');
  const codeDir=path.dirname(path.join(root,controllerPath));
  const sourceFiles=new Set(walk(codeDir).filter(file=>file.endsWith('.java')).map(file=>path.basename(file)));
  const service=src.match(/private\s+final\s+(\w+Service)\s+\w+/)?.[1];
  const serviceSrc=service&&sourceFiles.has(`${service}.java`)?fs.readFileSync(path.join(codeDir,`${service}.java`),'utf8'):'';
  const repositories=[...serviceSrc.matchAll(/private\s+final\s+(\w+Repository)\s+\w+/g)].map(match=>`${match[1]}.java`).filter(file=>sourceFiles.has(file));
  const mappers=[...serviceSrc.matchAll(/private\s+final\s+(\w+Mapper)\s+\w+/g)].map(match=>`${match[1]}.java`).filter(file=>sourceFiles.has(file));
  const base=src.match(/@RequestMapping\s*\(([^)]*)\)/)?.[1]??'';
  const basePath=(base.match(/"([^"]+)"/)??[])[1]??'';
  const methods=[...src.matchAll(/@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\(([^)]*)\))?\s*public\s+[\w.$<>?, \[\]]+\s+(\w+)\s*\(/g)];
  for(const m of methods){
    const verb={GetMapping:'GET',PostMapping:'POST',PutMapping:'PUT',PatchMapping:'PATCH',DeleteMapping:'DELETE'}[m[1]]??'GET';
    const suffix=(m[2]?.match(/"([^"]*)"/)??[])[1]??'';
    const returnType=m[0].match(/public\s+([\w.$<>?, \[\]]+)\s+\w+\s*\(/)?.[1]??'';
    const responseDto=[...returnType.matchAll(/\b[A-Z]\w+\b/g)].map(match=>match[0]).filter(name=>sourceFiles.has(`${name}.java`));
    labRoutes.push({method:verb,path:norm(`${basePath}/${suffix}`),feature:`${id} 쿼리 연습`,firstStage:id,stages:[id],controller:[path.posix.basename(controllerPath)],service:service?[`${service}.java`]:[],repository:repositories,mapper:mappers,requestDto:[],responseDto,entity:[],db:[]});
  }
}
projects.push({id:'query-practice',label:'쿼리 설계 연습 프로젝트',description:'L12·L13·L14 query-practice 실습 코드. 엔진 경로 변수는 공통 URL로 유지.',methods:Object.fromEntries(methodOrder.map(m=>[m,labRoutes.filter(r=>r.method===m).length]).filter(([,n])=>n)),routes:labRoutes.sort((a,b)=>a.path.localeCompare(b.path,'en'))});
const nonHttp=[{id:'scheduled-and-batch',label:'스케줄러·배치 작업',description:'HTTP route 집계에서 제외. 16-4 스냅샷의 스케줄러·배치 구현 파일이며 Controller 파일은 제외한다.',files:JSON.parse(fs.readFileSync(path.join(root,inputSets[0].snapshot),'utf8')).files.filter(f=>f.path.endsWith('.java')&&!/Controller\.java$/.test(f.path)).filter(f=>/@Scheduled\b|JobLauncher|JobBuilder|StepBuilder/.test(srcText(f))).map(f=>f.path).sort()},{id:'database-assets',label:'DB·SQL',description:'HTTP route가 아닌 SQL 스키마·마이그레이션·쿼리 자산. 각 항목에 스냅샷 출처를 표시한다.',files:inputSets.flatMap(spec=>JSON.parse(fs.readFileSync(path.join(root,spec.snapshot),'utf8')).files.filter(f=>/\.(sql|xml)$/.test(f.path)).map(f=>`${spec.id}: ${f.path}`)).sort()}];
const routeProjects=projects.filter(p=>p.id!=='query-practice');
const routeCount=routeProjects.reduce((n,p)=>n+p.routes.length,0);
const linkedCount=routeProjects.reduce((n,p)=>n+p.routes.filter(r=>r.stages.length).length,0);
const outputData={schemaVersion:1,generatedFrom:inputSets.map(({id,snapshot,supplementalSnapshots,commit})=>({id,snapshot,...(supplementalSnapshots?{supplementalSnapshots}:{}),commit})),systemContext:[{id:'client',label:'React',role:'브라우저 클라이언트',connectsTo:'Spring Boot',notes:'사용자가 요청을 보내고 응답을 표시한다.'},{id:'api',label:'Spring Boot',role:'HTTP API 서버',connectsTo:'MySQL',notes:'컨트롤러·서비스·저장소를 통해 요청을 처리한다.'},{id:'database',label:'MySQL',role:'관계형 데이터베이스',notes:'실습 데이터와 애플리케이션 데이터를 저장한다.'},{id:'inspector',label:'DBeaver',role:'DB 관리·조회 도구',connectsTo:'MySQL',notes:'API 요청 경로에 포함되지 않고 MySQL에 직접 연결해 데이터를 확인한다.'}],coverage:{mappingAnnotations:'기본 스냅샷 2개와 0-8·1-9 보충 스냅샷에서 인식된 메서드 매핑을 모두 추출',snapshotRoutes:routeCount,stageLinkedRoutes:linkedCount,stageUnlinkedRoutes:routeCount-linkedCount,checkRequestsRead:checkRequests.length,queryPracticeRoutes:labRoutes.length},projects,nonHttp,limitations:['stages는 scenario/*.md의 ```check 요청에서 method/path를 대조하거나 매핑 가까이 있는 단계 주석으로 확인되는 경우만 연결한다. 변수 경로는 세그먼트 수와 리터럴 일치 우선순위로 보수적으로 맞춘다.','service·repository·DTO·entity는 스냅샷 안에서 직접 확인되는 파일만 표시한다. 서비스의 저장소 목록은 해당 서비스가 선언한 의존성 전체이며, 각 API 메서드가 실제 호출하는 저장소만을 뜻하지 않는다. 프레임워크가 생성하는 프록시나 간접 DB 접근은 표현하지 않는다.','React는 사용자 요청에 지정된 전체 구조의 클라이언트 역할로 표기한다. 이 저장소의 Java 스냅샷은 서버 코드이며 React 소스 자체는 포함하지 않는다.','1-9 태그 조회는 16-4 참조 스냅샷 이후 추가되어 해당 단계 스냅샷에서 보충했다.','@RequestMapping에 method가 생략된 메서드는 가능한 동사로 확장한다. 다만 대상 스냅샷에서는 해당 케이스가 없었다.']};
fs.writeFileSync(output,`${JSON.stringify(outputData,null,2)}\n`);
console.log(JSON.stringify({output: path.relative(root,output),projects:projects.map(p=>({id:p.id,routes:p.routes.length,methods:p.methods})),nonHttp:nonHttp.map(x=>({id:x.id,files:x.files.length}))},null,2));
