import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {rasterDimensions} from './raster-size.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/design/jpg-2026-10-20/conversion-manifest.json'),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const questions=JSON.parse(fs.readFileSync(path.join(root,'docs/design/p09-2026-10-20/questions.json'),'utf8')).questions;
const pngEvidenceEntries=questions.flatMap(question=>question.imageEvidence||[]).filter(file=>file.endsWith('.png'));
const pngEvidence=[...new Set(pngEvidenceEntries)];
assert.equal(pngEvidenceEntries.length,79,'질문 원본의 PNG 증거 항목은 보존한다');
const manifestBySource=new Map(manifest.images.map(row=>[row.source,row]));
const rowForSource=source=>{const row=manifestBySource.get(source);assert.ok(row,source+' conversion-manifest source 등록');return row;};
const verifySourceBlob=row=>assert.equal(sha(execFileSync('git',['cat-file','blob',row.sourceGitBlob],{maxBuffer:32*1024*1024})),row.sourceSHA256,row.source+' historical Git blob SHA');
const verifyDestination=row=>{const file=path.join(root,row.destination);assert.ok(fs.existsSync(file),row.source+' destination 실제 파일');assert.equal(sha(fs.readFileSync(file)),row.sha256,row.source+' destination SHA chain');};
assert.throws(()=>rowForSource(pngEvidence[0]+'-unregistered'),/conversion-manifest source 등록/,'미등록 source 변이 거부');
for(const source of pngEvidence){
 const row=rowForSource(source);
 assert.ok(row.sourceSHA256&&row.sourceGitBlob,source+' 원본 SHA/Git blob 근거');
 verifySourceBlob(row);verifyDestination(row);
}
assert.throws(()=>verifySourceBlob({...manifest.images[0],sourceSHA256:'0'.repeat(64)}),/historical Git blob SHA/,'source SHA 불일치 변이 거부');
assert.throws(()=>verifyDestination({...manifest.images[0],sha256:'0'.repeat(64)}),/destination SHA chain/,'destination SHA 불일치 변이 거부');
let retained=0,removed=0,before=0,after=0;
for(const row of manifest.images){
 const bytes=fs.readFileSync(path.join(root,row.destination));
 assert.equal(path.extname(row.destination),'.jpg');assert.equal(sha(bytes),row.sha256);
 assert.deepEqual(rasterDimensions(bytes),{format:'jpeg',width:row.sourceWidth,height:row.sourceHeight});
 assert.equal(bytes.length,row.bytes);assert.equal(row.quality,92);assert.ok(row.sourceGitBlob);
 if(row.retainPNG){retained++;assert.equal(sha(fs.readFileSync(path.join(root,row.source))),row.sourceSHA256);}
 else{removed++;assert.equal(fs.existsSync(path.join(root,row.source)),false);}
 before+=row.sourceBytes;after+=row.bytes;
}
assert.equal(manifest.images.length,419);assert.equal(retained,56);assert.equal(removed,363);
assert.equal(before,manifest.beforeBytes);assert.equal(after,manifest.afterBytes);assert.ok(after<before);
let references=0;
for(const file of fs.readdirSync(path.join(root,'docs/knowledge')).filter(file=>file.endsWith('.html'))){
 const page=path.join(root,'docs/knowledge',file),html=fs.readFileSync(page,'utf8');
 for(const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:png|jpg)(?:\?[^"']*)?)["']/g)){
  const target=match[1].split('?')[0];if(/^(https?:|data:)/.test(target))continue;
  assert.equal(path.extname(target),'.jpg',file+' 학습 이미지');assert.ok(fs.existsSync(path.resolve(path.dirname(page),target)));references++;
 }
}
assert.ok(references>=96);
console.log(`JPG 전환: ${manifest.images.length}개 실제 형식·크기·SHA/용량, PNG 작업복사${removed}개 제거·공유원본${retained}개 보존, 개념HTML 참조${references}개 JPG 통과`);
