// UI 검증만을 위한 메모리 fixture. 학습용 정답 서버/실제 업무 API가 아닙니다.
import {createServer} from 'node:http';
import {createCourseServer} from '../server.mjs';
let post=null;
const fixture=createServer(async(req,res)=>{
  const chunks=[];for await(const part of req) chunks.push(part);
  let body={};try{body=JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{}
  const url=new URL(req.url,'http://localhost');
  let status=200,data;
  if(url.pathname==='/api/hello'){
    const name=(url.searchParams.get('name')||'').trim();
    if(!name){status=400;data={code:'NAME_REQUIRED',message:'이름이 필요합니다.'};}
    else data={message:`${name}님, 안녕하세요.`};
  }else if(url.pathname==='/api/posts' && req.method==='POST'){
    status=201;post={id:42,...body,createdAt:'2026-10-25T09:00:00',updatedAt:'2026-10-25T09:00:00'};data=post;
  }else if(url.pathname==='/api/posts/42' && post) data=post;
  else {status=404;data={code:'NOT_FOUND',message:'검증 fixture에 없는 경로입니다.'};}
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','X-Test-Fixture':'true'});res.end(JSON.stringify(data));
});
fixture.listen(18881,'127.0.0.1');
const app=createCourseServer({target:'http://127.0.0.1:18881'});
app.listen(18787,'127.0.0.1',()=>process.stdout.write('UI fixture only: http://127.0.0.1:18787\n'));
process.on('SIGINT',()=>{app.closeAllConnections();app.close();fixture.closeAllConnections();fixture.close();});
