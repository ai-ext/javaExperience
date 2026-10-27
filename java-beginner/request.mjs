const methods = new Set(['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']);
const blockedHeaders = /^(?:cookie|cookie2|host|origin|referer|connection|content-length|transfer-encoding|upgrade|expect|set-cookie|sec-.*|proxy-.*)$/i;

export function buildRequest({method, path, vars = {}, query = '', headers = '{}', body = '', token = '', csrf = '', file = null, multipart = false}) {
  method = String(method).toUpperCase();
  if (!methods.has(method)) throw new Error('지원하지 않는 HTTP 메서드입니다.');
  path = String(path).trim();
  path = path.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (_, key) => {
    const value = String(vars[key] ?? '').trim();
    if (!value) throw new Error(`${key}에 실제 생성된 번호를 입력하세요.`);
    if (!/^\d+$/.test(value) && !/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error(`${key} 경로 값에 사용할 수 없는 문자가 있습니다.`);
    return encodeURIComponent(value);
  });
  let decoded = path;
  try { for (let i=0;i<3;i++) decoded=decodeURIComponent(decoded); } catch { throw new Error('경로의 인코딩을 확인하세요.'); }
  if (!path.startsWith('/') || path.startsWith('//') || /[\\#?{}\u0000-\u0020]/.test(decoded) || decoded.split('/').some(s=>s==='.' || s==='..')) {
    throw new Error('주소는 /api/... 형태의 같은 서버 경로여야 합니다. 쿼리는 아래 입력칸에 적으세요.');
  }
  let parsedHeaders;
  try {parsedHeaders=typeof headers==='string'?JSON.parse(headers || '{}'):headers;} catch {throw new Error('헤더가 올바른 JSON 객체가 아닙니다.');}
  if(!parsedHeaders || Array.isArray(parsedHeaders) || typeof parsedHeaders!=='object') throw new Error('헤더는 JSON 객체여야 합니다.');
  const headerObject={};
  for(const [key,value] of Object.entries(parsedHeaders)) {
    if(blockedHeaders.test(key) || !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(key) || typeof value!=='string' || /[\r\n]/.test(value)) throw new Error(`설정할 수 없는 헤더입니다: ${key}`);
    headerObject[key]=value;
  }
  if(token.trim()) headerObject.Authorization=`Bearer ${token.trim()}`;
  if(csrf.trim()) headerObject['X-CSRF-TOKEN']=csrf.trim();
  const init={method,headers:headerObject,credentials:'same-origin',redirect:'error'};
  if(!['GET','HEAD'].includes(method)) {
    if(multipart) {
      if(!file) throw new Error('multipart 요청에 보낼 실제 파일을 선택하세요.');
      const form=new FormData();form.append('file',file);
      for(const key of Object.keys(headerObject)) if(key.toLowerCase()==='content-type') delete headerObject[key];
      init.body=form;
    } else if(String(body).trim()) {
      try {JSON.parse(body);} catch {throw new Error('요청 본문의 JSON 문법을 확인하세요. 아직 전송하지 않았습니다.');}
      if(!Object.keys(headerObject).some(k=>k.toLowerCase()==='content-type')) headerObject['Content-Type']='application/json';
      init.body=body;
    }
  }
  const params=new URLSearchParams(String(query).replace(/^\?/,''));
  return {url:`/__api${path}${params.size?'?'+params.toString():''}`,init,path};
}

export function inspectResponse(status, body, {expect, fields = []}) {
  const statusMatch=status===Number(expect);
  const fieldsMatch=fields.every(key=>body!==null && typeof body==='object' && Object.hasOwn(body,key));
  return {statusMatch,fieldsMatch};
}

export function captureResource(id, body) {
  const map={
    'post-create':'postId','owned-post':'postId','urgent-create':'postId',
    'comment-create':'commentId','file-upload':'attachmentId','product-create':'productId',
    'order-create':'orderId','order-idempotent':'orderId'
  };
  const key=map[id];
  if(!key || !body || !/^\d+$/.test(String(body.id ?? ''))) return {};
  return {[key]:String(body.id)};
}
