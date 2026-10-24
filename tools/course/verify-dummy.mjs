// CSV를 다시 읽어 관계·불변식과 manifest를 검증한다. MySQL 실행 검증과 구분한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const DEFAULT_DIR = fileURLToPath(new URL('../../course/start/dummy/', import.meta.url));

export function parseCsv(text) {
  const rows=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(ch==='"') { if(quoted && text[i+1]==='"') {cell+='"';i++;} else quoted=!quoted; }
    else if(!quoted && (ch===',' || ch==='\n')) {row.push(cell);cell='';if(ch==='\n') {rows.push(row);row=[];}}
    else cell+=ch;
  }
  assert.ok(!quoted,'닫히지 않은 CSV 인용');
  if(cell || row.length) {row.push(cell);rows.push(row);}
  const head=rows.shift();
  return rows.map(r=>{assert.equal(r.length,head.length,'CSV 열 수');return Object.fromEntries(head.map((h,i)=>[h,r[i]]));});
}
export function verify(dir=DEFAULT_DIR) {
  const errors=[], data={}, manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  let bytes=0;
  for(const [file,meta] of Object.entries(manifest.files)) {
    const buf=fs.readFileSync(path.join(dir,file)); bytes+=buf.length;
    data[file.slice(0,-4)]=parseCsv(buf.toString('utf8'));
    if(meta.bytes!==buf.length || meta.sha256!==createHash('sha256').update(buf).digest('hex') || meta.rows!==data[file.slice(0,-4)].length) errors.push(`${file}: manifest 불일치`);
  }
  if(bytes>=10000000 || bytes!==manifest.totalBytes) errors.push('CSV 크기 제한/합계 불일치');
  const unique=(name,fields)=> {const seen=new Set();for(const r of data[name]) {const k=JSON.stringify(fields.map(f=>r[f]));if(seen.has(k)) errors.push(`${name}: 중복 ${fields}`);seen.add(k);}};
  for(const [name,rows] of Object.entries(data)) if(rows[0] && 'key' in rows[0]) unique(name,['key']);
  for(const [n,f] of [['members',['email']],['members',['nickname']],['tags',['label']],['post-tags',['post_key','tag_key']],['likes',['post_key','member_key']],['member-coupons',['coupon_key','member_key']],['orders',['member_key','request_key']],['payments',['request_key']],['payments',['order_ref']],['banned-words',['text']],['common-codes',['group','code']],['reports',['post_key','reporter_key']]]) unique(n,f);
  const paymentRefs=data.payments.map(r=>r.payment_ref).filter(Boolean);if(new Set(paymentRefs).size!==paymentRefs.length) errors.push('PG 식별 중복');
  const refs={posts:{author_key:'members'},'post-tags':{post_key:'posts',tag_key:'tags'},comments:{post_key:'posts',author_key:'members'},likes:{post_key:'posts',member_key:'members'},'member-coupons':{coupon_key:'coupons',member_key:'members'},orders:{member_key:'members',item_key:'items',member_coupon_key:'member-coupons'},'point-history':{member_key:'members'},payments:{member_key:'members'},reports:{post_key:'posts',reporter_key:'members'},'audit-events':{actor_key:'members',target_key:'coupons'}};
  const ids=Object.fromEntries(Object.entries(data).map(([n,rows])=>[n,new Set(rows.map(r=>r.key))]));
  for(const [n,fields] of Object.entries(refs)) for(const [f,target] of Object.entries(fields)) for(const r of data[n]) if(r[f] && !ids[target].has(r[f])) errors.push(`${n}.${f}: 참조 없음 ${r[f]}`);
  const totals=new Map();
  for(const r of data['point-history']) {
    const sum=(totals.get(r.member_key)||0)+Number(r.delta);totals.set(r.member_key,sum);
    if(sum!==Number(r.balance_after)||sum<0 || !['EARN','SPEND','CHARGE'].includes(r.kind) || (r.kind==='SPEND')!==(Number(r.delta)<0)) errors.push('포인트 순서/잔액/부호 불일치');
    const source={POST:'posts',ORDER:'orders',PG_PAYMENT:'payments'}[r.source_kind];
    if(!source || !ids[source].has(r.source_key)) errors.push('포인트 사유 참조 없음');
    if(source==='posts' && data.posts.find(p=>p.key===r.source_key)?.author_key!==r.member_key) errors.push('활동 이력 작성자 참조 불일치');
  }
  for(const r of data.members) if(Number(r.balance)!==(totals.get(r.key)||0)) errors.push('회원 잔액 대사 불일치');
  for(const r of data.items) if(Number(r.stock)<0 || Number(r.price)<=0) errors.push('아이템 재고/가격 위반');
  for(const r of data.coupons) if(Number(r.issued)>Number(r.capacity)||Number(r.issued)<0 || Number(r.issued)!==data['member-coupons'].filter(c=>c.coupon_key===r.key).length) errors.push('쿠폰 발급량 위반');
  for(const r of data.orders) if(Number(r.quantity)<1||Number(r.quantity)>10 || Number(r.paid_amount)!==Number(data.items.find(i=>i.key===r.item_key)?.price)*Number(r.quantity)) errors.push('주문 금액/수량 위반');
  for(const r of data.payments) {
    const credits=data['point-history'].filter(h=>h.source_kind==='PG_PAYMENT'&&h.source_key===r.key);
    if(credits.length!==(r.state==='DONE'?1:0) || credits.some(h=>h.member_key!==r.member_key||Number(h.delta)!==Number(r.amount))) errors.push('결제 적립 불일치');
  }
  for(const [s,count] of Object.entries(manifest.postStates)) if(data.posts.filter(r=>r.state===s).length!==count) errors.push('글 상태 집계 불일치');
  if(data.comments.filter(r=>r.is_deleted==='0').length!==manifest.visibleComments) errors.push('공개 댓글 수 불일치');
  const tagCounts=new Map();
  for(const r of data['post-tags']) tagCounts.set(r.post_key,(tagCounts.get(r.post_key)||0)+1);
  for(const n of tagCounts.values()) if(n>5) errors.push('태그 개수 위반');
  return {errors,files:Object.keys(data).length,totalRows:Object.values(data).reduce((s,r)=>s+r.length,0),totalBytes:bytes};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {const result=verify();console.log(JSON.stringify(result,null,2));if(result.errors.length) process.exitCode=1;}
