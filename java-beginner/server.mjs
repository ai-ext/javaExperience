import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const htmlPath=new URL('../java-beginner.html',import.meta.url);
const localHosts=new Set(['localhost','127.0.0.1','[::1]']);
const noForward=new Set(['host','connection','content-length','transfer-encoding','upgrade','keep-alive','te','trailer','proxy-authorization','proxy-authenticate','origin','referer','accept-encoding']);
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}

export function createCourseServer({target='http://127.0.0.1:8080'}={}) {
  const upstream=new URL(target);
  if(!localHosts.has(upstream.hostname) || !['http:','https:'].includes(upstream.protocol) || upstream.username || upstream.password || upstream.pathname!=='/' || upstream.search || upstream.hash) throw new Error('JAVA_BEGINNER_API에는 로컬 API 서버의 origin만 입력하세요. 예: http://127.0.0.1:8080');
  return createServer(async(req,res)=>{
    const host=req.headers.host || '';
    let own;
    try {own=new URL(`http://${host}`);} catch {return json(res,400,{code:'INVALID_HOST',message:'로컬 주소로 접속하세요.'});}
    if(!localHosts.has(own.hostname)) return json(res,403,{code:'LOCAL_ONLY',message:'로컬 주소에서만 사용합니다.'});
    const origin=req.headers.origin;
    const rawPath=(req.url || '/').split('?')[0];
    if(rawPath==='/__config' && req.method==='GET') return json(res,200,{target:upstream.origin});
    if(rawPath.startsWith('/__api/')) {
      if((origin && origin!==own.origin) || req.headers['sec-fetch-site']==='cross-site') return json(res,403,{code:'ORIGIN_REJECTED',message:'실행기가 제공한 로컬 페이지에서 요청하세요.'});
      const targetPath=req.url.slice('/__api'.length);
      let decoded;
      try {decoded=targetPath.split('?')[0];for(let i=0;i<3;i++) decoded=decodeURIComponent(decoded);} catch {return json(res,400,{code:'INVALID_PATH',message:'경로를 확인하세요.'});}
      if(decoded.startsWith('//') || /[\\\u0000-\u0020]/.test(decoded) || decoded.split('/').some(s=>s==='.' || s==='..')) return json(res,400,{code:'INVALID_PATH',message:'같은 서버의 API 경로를 입력하세요.'});
      if(!['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(req.method)) return json(res,405,{code:'METHOD_NOT_ALLOWED',message:'지원하지 않는 메서드입니다.'});
      try {
        const parts=[];let size=0;
        for await(const part of req){size+=part.length;if(size>3*1024*1024) return json(res,413,{code:'REQUEST_TOO_LARGE',message:'실행기의 전송 한도 3MiB를 넘었습니다.'});parts.push(part);}
        const headers={};
        for(const [key,value] of Object.entries(req.headers)) if(!noForward.has(key) && !key.startsWith('sec-') && value!==undefined) headers[key]=value;
        const body=Buffer.concat(parts);
        const response=await fetch(new URL(targetPath,upstream),{method:req.method,headers,body:['GET','HEAD'].includes(req.method)||!body.length?undefined:body,redirect:'manual',signal:AbortSignal.timeout(30000)});
        if(response.status>=300 && response.status<400) return json(res,502,{code:'API_REDIRECT',message:'API가 리다이렉트했습니다. 로그인 HTML 대신 JSON 오류를 반환하도록 서버의 API 설정을 확인하세요.'});
        const responseHeaders={};
        for(const key of ['content-type','content-disposition','x-request-id','x-csrf-token','www-authenticate']) {const value=response.headers.get(key);if(value) responseHeaders[key]=value;}
        responseHeaders['Cache-Control']='no-store';
        responseHeaders['X-Content-Type-Options']='nosniff';
        const cookies=response.headers.getSetCookie();
        if(cookies.length) responseHeaders['Set-Cookie']=cookies.map(cookie=>cookie.replace(/;\s*Domain=[^;]*/ig,'').replace(/;\s*Path=([^;]*)/i,(_,p)=>`; Path=/__api${p.startsWith('/')?p:'/'}`));
        const bytes=Buffer.from(await response.arrayBuffer());
        // 본문까지 완전히 수신한 뒤에만 실제 API 응답으로 표시한다.
        res.setHeader('X-Java-Beginner-Upstream','true');
        res.writeHead(response.status,responseHeaders);res.end(req.method==='HEAD'?undefined:bytes);
      } catch(error) {
        if(!res.headersSent) json(res,502,{code:'API_CONNECTION_FAILED',message:'API 서버에 연결하지 못했습니다. 직접 만든 Spring 서버의 실행 상태와 JAVA_BEGINNER_API 포트를 확인하세요.'});
        else res.end();
      }
      return;
    }
    if(req.method==='GET' && ['/', '/java-beginner.html'].includes(rawPath)) {
      try {const html=await readFile(htmlPath);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(html);} catch {json(res,500,{code:'HTML_NOT_BUILT',message:'저장소 루트에서 node java-beginner/build.mjs를 실행하세요.'});}
      return;
    }
    if(rawPath==='/favicon.ico'){res.writeHead(204);res.end();return;}
    json(res,404,{code:'NOT_FOUND',message:'독립 학습 HTML과 API 전달 경로만 제공합니다.'});
  });
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const port=Number(process.env.JAVA_BEGINNER_PORT || 8787);
  if(!Number.isInteger(port) || port<1 || port>65535) throw new Error('JAVA_BEGINNER_PORT는 1~65535 숫자여야 합니다.');
  const target=process.env.JAVA_BEGINNER_API || 'http://127.0.0.1:8080';
  const server=createCourseServer({target});
  server.on('error',error=>{process.stderr.write(`실행기를 열지 못했습니다: ${error.message}\n`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>process.stdout.write(`Java 입문 과정: http://127.0.0.1:${port}\nAPI 대상: ${target}\n종료: Ctrl+C\n`));
}
