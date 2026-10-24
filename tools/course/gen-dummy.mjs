// 학습자 스키마와 분리된 논리 CSV. 시드·기준 시각·BCrypt 해시를 고정한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const DEFAULT_DIR = fileURLToPath(new URL('../../course/start/dummy/', import.meta.url));
export const SEED = 20261024;
// Course1234의 BCrypt(cost 10). 로컬 학습 전용이며 생성할 때 다시 해시하지 않는다.
export const PASSWORD_HASH = '$2y$10$nziX3RcyE5RCFnbCbiuQdeUj48eflXdB9weckIL/RvJPhpb6pa8q.';
const csvCell = v => /[",\r\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v);
const time = hours => new Date(Date.UTC(2026,0,1) + hours*3600000).toISOString().slice(0,19).replace('T',' ');

export function generate(dir = DEFAULT_DIR) {
  fs.mkdirSync(dir,{recursive:true});
  let state = SEED;
  const rand = n => { state = (Math.imul(state,1664525)+1013904223)>>>0; return state % n; };
  const tables = {};
  const put = (file, columns, rows) => { tables[file] = {columns,rows}; };
  const posts = Array.from({length:20000},(_,i) => {
    const key = i+1;
    return [key,1+rand(200),`글${key}${key===1?', 매핑 연습':''}`,`서버 실습 ${key}`,key%10===0?'DELETED':key%10===1?'HIDDEN':'ACTIVE',time(Math.floor(i/5))];
  });
  const tags = ['spring','java','sql','mysql',...Array.from({length:36},(_,i)=>`tag${i+5}`)];
  const relations = posts.flatMap(p=>[[p[0],1+(p[0]%40)],[p[0],1+((p[0]+7)%40)]]);
  const comments = Array.from({length:50000},(_,i)=> {
    const p=posts[rand(posts.length)];
    return [i+1,p[0],1+rand(200),`댓글 ${i+1}`,i%10===0?1:0,time(Math.floor((p[0]-1)/5)+24+rand(48))];
  });
  const likes = posts.flatMap(p=>Array.from({length:p[0]%4+(p[0]<=100?20:0)},(_,i)=>[p[0],1+((p[0]*7+i*13)%200),time(Math.floor((p[0]-1)/5)+12)]));
  const ledger = [], balances = Array(200).fill(0);
  // 200명 모두 초기 적립과 지출, 일부는 충전 완료가 있다. 증감액은 부호 있는 값이다.
  for(let m=1;m<=200;m++) for(const [kind,amount,ref] of [['EARN',1000,'POST'],['SPEND',-100,'ORDER']]) {
    balances[m-1]+=amount;
    ledger.push([ledger.length+1,m,kind,amount,balances[m-1],ref,ref==='POST'?posts.find(p=>p[1]===m)[0]:m,time(5000+ledger.length)]);
  }
  const payments = Array.from({length:80},(_,i)=> {
    const status=['DONE','FAILED','UNKNOWN','REQUESTED'][i%4], m=i+1, at=time(5500+i);
    if(status==='DONE') { balances[m-1]+=1000; ledger.push([ledger.length+1,m,'CHARGE',1000,balances[m-1],'PG_PAYMENT',i+1,at]); }
    return [i+1,m,`CHG-dummy-${i+1}`,1000,status==='DONE'?`PAY-dummy-${i+1}`:'',status,`charge-dummy-${i+1}`,at,status==='REQUESTED'?'':at];
  });
  put('members',['key','email','password_hash','nickname','role','balance','joined_at'],balances.map((balance,i)=>[i+1,`learner${String(i+1).padStart(3,'0')}@example.test`,PASSWORD_HASH,`learner${i+1}`,i===0?'ADMIN':'USER',balance,time(0)]));
  put('posts',['key','author_key','title','body','state','written_at'],posts);
  put('tags',['key','label'],tags.map((v,i)=>[i+1,v]));
  put('post-tags',['post_key','tag_key'],relations);
  put('comments',['key','post_key','author_key','body','is_deleted','written_at'],comments);
  put('likes',['post_key','member_key','liked_at'],likes);
  put('coupons',['key','label','capacity','issued','expires_at'],Array.from({length:10},(_,i)=>[i+1,`쿠폰${i+1}`,100,20,time(20000)]));
  put('member-coupons',['key','coupon_key','member_key','state','used_at'],Array.from({length:200},(_,i)=>[i+1,1+(i%10),i+1,'UNUSED','']));
  put('items',['key','label','price','stock'],Array.from({length:20},(_,i)=>[i+1,`아이템${i+1}`,100,i===19?0:100-i]));
  put('orders',['key','member_key','item_key','quantity','paid_amount','member_coupon_key','request_key','ordered_at'],Array.from({length:200},(_,i)=>[i+1,i+1,1+(i%20),1,100,'',`order-dummy-${i+1}`,time(5000+2*i+1)]));
  put('point-history',['key','member_key','kind','delta','balance_after','source_kind','source_key','happened_at'],ledger);
  put('payments',['key','member_key','order_ref','amount','payment_ref','state','request_key','requested_at','responded_at'],payments);
  put('banned-words',['key','text'],[['1','금칙예시'],['2','spamword'],['3','blockedword']]);
  put('common-codes',['group','code','label'],[['POST_STATE','ACTIVE','공개'],['POST_STATE','HIDDEN','숨김'],['POST_STATE','DELETED','삭제'],['ROLE','USER','회원'],['ROLE','ADMIN','관리자']]);
  put('reports',['key','post_key','reporter_key','reason','detail','state','reported_at'],Array.from({length:300},(_,i)=>[i+1,2+(i%30),1+Math.floor(i/30),'SPAM',`신고${i+1}`,i%3===0?'RESOLVED':'OPEN',time(6000+i)]));
  put('audit-events',['key','actor_key','action','target_kind','target_key','detail','happened_at'],Array.from({length:30},(_,i)=>[i+1,1,'BULK_ISSUE_COUPON','COUPON',1+(i%10),`관리 작업${i+1}`,time(6500+i)]));
  const files = {};
  for(const [name,{columns,rows}] of Object.entries(tables)) {
    const body = [columns,...rows].map(r=>r.map(csvCell).join(',')).join('\n')+'\n';
    fs.writeFileSync(path.join(dir,`${name}.csv`),body);
    files[`${name}.csv`] = {rows:rows.length,bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')};
  }
  const manifest = {seed:SEED,encoding:'UTF-8',timezone:'Asia/Seoul (CSV 시각은 KST 벽시계)',files,totalBytes:Object.values(files).reduce((s,v)=>s+v.bytes,0),postStates:Object.fromEntries(['ACTIVE','HIDDEN','DELETED'].map(s=>[s,posts.filter(p=>p[4]===s).length])),visibleComments:comments.filter(c=>c[4]===0).length};
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return manifest;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) console.log(JSON.stringify(generate(),null,2));
