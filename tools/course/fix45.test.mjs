import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildAll } from './build-days.mjs';
import { loadCourse, renderExerciseNavigation, renderCourseHome } from '../site/course-pages.mjs';
import { JSDOM } from '../site/node_modules/jsdom/lib/api.js';

const root = new URL('../../', import.meta.url).pathname;
const read = p => fs.readFileSync(root + p, 'utf8');
const day = n => JSON.parse(read(`course/days/D${n}.json`));
const generated = buildAll(root).files;

test('fix45-1: D27/D28은 구앱 종료와 최종 백필 이후에만 contract한다', () => {
  for (const n of [27,28]) assert.match(JSON.stringify(day(n).roadmap), /expand → 신앱 쓰기 전환 → 구앱 종료 → null 재유입 차단 확인 → 최종 백필 → 제약 강화/);
  assert.doesNotMatch(JSON.stringify(day(27)), /백필→제약 강화→옛 앱 종료/);
});
test('fix45-2: D35/D36은 기존 취소 계약을 바꾸고 이미 충족하면 새 요구를 협의한다', () => {
  const brief = JSON.stringify(day(35).roadmap);
  assert.match(brief, /취소 사유.*필수/);
  assert.match(brief, /이미 충족/);
  assert.match(brief, /정상 코드를 약화하지/);
  assert.match(JSON.stringify(day(36).roadmap), /이미.*통과.*D35/);
  assert.doesNotMatch(JSON.stringify(day(36)), /없으면 예약 취소와 실행 시작의 경쟁/);
  assert.match(JSON.stringify(day(36).hints.grader.focus), /D35.*취소 사유.*두 운영자 승인/);
  assert.match(generated.get('course/spring/D36.md').split('## AI 채점 프롬프트')[1], /D35.*취소 사유.*두 운영자 승인/);
});

test('round2-N1: MySQL은 TCP·인증·대상 DB 쿼리 뒤 두 앱을 시작한다', () => {
  const compose = read('course/start/ops/compose.yaml');
  const health = compose.match(/test: \["CMD-SHELL", "(.*?)"\]/)[1];
  assert.match(health, /mysql --protocol=TCP -h127\.0\.0\.1/);
  assert.match(health, /MYSQL_PWD=.*-uroot.*ops_lab.*SELECT 1/);
  assert.doesNotMatch(health, /mysqladmin ping/);
  assert.equal((compose.match(/mysql: \{condition: service_healthy\}/g) || []).length, 2);
});

test('round2-N2: 앱·probe 공통 준비에서 JDK 21 선택과 버전을 확인한다', () => {
  const ops = read('course/start/ops/README.md');
  const common = ops.split('학습자 앱을 사용하면')[0];
  assert.match(common, /export JAVA_HOME=\$\(\/usr\/libexec\/java_home -v 21\)/);
  assert.match(common, /export PATH="\$JAVA_HOME\/bin:\$PATH"/);
  assert.match(common, /"\$JAVA_HOME\/bin\/java" -version/);
  assert.match(common, /"\$JAVA_HOME\/bin\/javac" -version/);
});

test('round2-N3: 홈의 실제 DOM 순서와 주 버튼은 Java 수행 시점을 따른다', () => {
  const html = renderCourseHome(loadCourse(root));
  const dom = new JSDOM(html, {url:'http://localhost/',runScripts:'outside-only'});
  const {window:w} = dom;
  const home = w.document.querySelector('[data-course-home]');
  const data = JSON.parse(w.document.querySelector('#course-days-data').textContent);
  for (const [doneThrough,next] of [[42,43],[43,44],[44,45],[0,1]]) {
    const done = Object.fromEntries(data.filter(d => Number(d.id.slice(1))<=doneThrough).flatMap(d=>d.steps.map(s=>[s.id,true])));
    w.localStorage.setItem('javaexperience.course.progress.v1', JSON.stringify({version:1,steps:done}));
    if (!w.jxCourseProgress) { w.eval(read('tools/site/course.js')); w.document.dispatchEvent(new w.Event('DOMContentLoaded')); }
    else w.dispatchEvent(new w.Event('pageshow'));
    const id='D'+String(next).padStart(2,'0');
    assert.equal(home.querySelector('[data-today-id]').textContent,id);
    const flow=home.querySelector('[data-today-flow]');
    const links=[...flow.querySelectorAll('a')];
    const during=next>=44;
    assert.equal(links[0].hasAttribute(during?'data-today-open':'data-today-java'),true,id);
    assert.ok(links[0].classList.contains('ch-primary'),id);
    if(during) {
      assert.equal(data.find(d=>d.id===id).javaTiming,'during-or-after');
      assert.match(links[1].textContent,/수행 중·사후 증거/);
      assert.doesNotMatch(flow.textContent,/Java.*→.*Spring/);
    }
  }
  w.close();
});

test('round2-N4: D32는 한 chunk 증거·외부 발송 선택 분기, 중단 재시작은 D33', () => {
  const cards=day(32).cards;
  const checkpoint=cards.split('### TC-D32-2')[1].split('### TC-D32-3')[0];
  assert.match(checkpoint,/한 chunk.*commit.*checkpoint/);
  assert.match(checkpoint,/중단·재시작.*D33/);
  assert.doesNotMatch(checkpoint,/중단\/재실행의 지급/);
  const external=cards.split('### TC-D32-3')[1];
  assert.match(external,/미선택.*실패 경계.*대안.*설명/);
  assert.match(external,/선택.*실제 실험/);
});
test('fix45-3: 운영 날짜가 실행·통제·정리 가능한 출발 자료에 연결된다', () => {
  for (const n of [26,27,28,29,33,34,39]) assert.ok(day(n).hints.refs.includes('course/start/ops/README.md'), `D${n}`);
  const ops = read('course/start/ops/README.md');
  assert.doesNotMatch(ops, /Docker Desktop/);
  for (const word of ['Dockerfile','docker compose','SIGTERM','mysqldump','baseline','kill -STOP','kill -CONT','beforeCommit','afterCommit','jcmd','정리']) assert.ok(ops.includes(word), word);
  assert.doesNotMatch(ops, /kill -STOP 1|jcmd 1 Thread/);
  assert.match(read('course/start/ops/compose.yaml'), /init: true/);
  assert.match(read('course/start/ops/compose.yaml'), /control:\/control/);
  assert.match(ops, /T\(stopped\)/);
});
test('fix45-4: J 참조는 실제 주제를 지원하고 새 개념 실험을 설명한다', () => {
  for (const n of [18,34]) assert.ok(day(n).java.reuse.includes('J07'));
  for (const n of [20,31]) assert.ok(day(n).java.reuse.includes('J09'));
  for (const n of [22,39]) assert.ok(!day(n).java.reuse.includes(n === 22 ? 'J05' : 'J12'));
  for (const [n,words] of [[19,['ThreadLocal','finally','remove','submit']],[20,['ThreadPoolExecutor','ArrayBlockingQueue','AbortPolicy','CountDownLatch']],[39,['jcmd','Xmx','CPU']]]) {
    const page = generated.get(`course/java/J${n}.md`);
    for (const word of words) assert.ok(page.includes(word), `J${n}: ${word}`);
  }
});
test('fix45-5: 기존 Java 모듈과 확장 실험의 실행 위치를 구분한다', () => {
  const course = loadCourse(root);
  for (let n=15;n<=45;n++) {
    const html = renderExerciseNavigation(`course/java/J${n}.md`, `<h1>J${n}</h1>`, course);
    if (n < 16) assert.match(html, /java-track/);
    else { assert.match(html, /학습자 프로젝트 루트/); assert.doesNotMatch(html, /Java는 저장소의/); }
  }
});
test('fix45-6: 카드 세 줄은 질문별 답 요소이며 순서별 done 복제가 아니다', () => {
  for (let n=16;n<=45;n++) {
    const d = day(n);
    const cards = [...d.cards.matchAll(/\*\*질문\*\* (.*?)\n\*\*답에 들어가야 할 것\*\*\n([\s\S]*?)\n\*\*근거\*\*/g)];
    assert.equal(cards.length, 3);
    for (const [,q,body] of cards) {
      assert.equal(body.split('\n').filter(x => x.startsWith('- ')).length,3,q);
      assert.doesNotMatch(body, /선택한 요구·증상과 관찰 사실|결정 전의 가정과 반론 또는 새 정보/);
    }
  }
  const clock = day(20).cards.split('### TC-D20-2')[0];
  assert.match(clock, /직전.*정각.*직후/); assert.doesNotMatch(clock, /인터페이스 도입 비용/);
  const rollback = day(26).cards.split('### TC-D26-2')[1].split('### TC-D26-3')[0];
  assert.match(rollback, /데이터/); assert.doesNotMatch(rollback, /SIGTERM/);
});
test('fix45-7: 독립 평가의 Java는 요구·초기 진단 뒤 수행한다', () => {
  for (const n of [44,45]) {
    const d = day(n); assert.equal(d.java.timing,'during-or-after');
    for (const p of [`course/spring/D${n}.md`,`course/java/J${n}.md`]) {
      const md=generated.get(p); assert.match(md,/수행 중 증거|사후 확인/);
      assert.doesNotMatch(md,/Spring 순서를 시작하기 전에|선수 실험/);
    }
  }
});
test('fix45-8: D19~D22 SQL은 D23을 선행 조건으로 삼지 않는다', () => {
  for (let n=19;n<=22;n++) {
    assert.match(day(n).hints.sql.context,/1단계 모델/);
    assert.doesNotMatch(day(n).hints.sql.context,/D23에서 정한/);
  }
  assert.match(day(23).hints.sql.context,/D23에서 정한/);
});
test('fix45-9: 지도 노드 선택은 열기 링크가 있는 상세 패널로 이동한다', () => {
  const dom = new JSDOM(read('course/map.html'), {runScripts:'outside-only',pretendToBeVisual:true});
  let target;
  dom.window.matchMedia=()=>({matches:true});
  dom.window.HTMLElement.prototype.scrollIntoView=function(){target=this;};
  dom.window.eval(read('tools/site/course-map.js'));
  dom.window.document.querySelector('[data-node="D30"]').click();
  assert.ok(target?.querySelector('a.cm-detail-open[href*="D30"]'));
  assert.equal(dom.window.document.activeElement, target.querySelector('.cm-detail-open'));
  dom.window.close();
});

test('round2-weak: 이미 충족한 개인 과제는 미충족 새 계약을 먼저 합의한다', () => {
  assert.match(JSON.stringify(day(16).roadmap), /통과.*미충족.*새 계약/);
  for (const n of [17,18]) assert.match(JSON.stringify(day(n).roadmap), /이미.*통과.*D16/);
  const common=JSON.parse(read('course/days/_common.json')).hints.graderTemplates.extend;
  assert.match(common,/이미.*통과.*정상 코드를 약화/);
  assert.match(JSON.stringify(day(31).roadmap), /확인 불가.*합격.*보류/);
});

test('round2-weak-J: 통합·설계·재실행·JVM 관찰에 새 JUnit 파일을 일률 강제하지 않는다', () => {
  for(const n of [21,22,24,25,28,31,33,34,35,38,39,41,42,43]) {
    const md=generated.get(`course/java/J${n}.md`);
    assert.doesNotMatch(md,/`src\/test\/java\/J\d+EvidenceTest.java`를 만든다|직접 이 이름으로 만든 테스트/);
    assert.ok(day(n).java.evidence?.instructions?.length,`J${n}`);
  }
  assert.match(JSON.stringify(day(17).java),/예외 번역.*무관.*선택한 A/);
  assert.match(JSON.stringify(day(29).java),/이미지 복귀.*DB 복원/);
  assert.match(generated.get('course/java/J39.md'),/JvmSignals.java|D39.*jcmd/);
});

test('round2-weak-D38: 요청별 latency와 오류를 수집하고 백분위를 계산한다', async () => {
  const {createServer}=await import('node:http');
  const {spawn}=await import('node:child_process');
  const {once}=await import('node:events');
  const {mkdtempSync,rmSync}=await import('node:fs');
  const os=await import('node:os');
  const server=createServer((req,res)=>{res.statusCode=req.url==='/bad'?503:200;res.end('sample');});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const dir=mkdtempSync(os.tmpdir()+'/jx-load-test-');
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    const child=spawn('python3',[root+'course/start/ops/measure-http.py','--requests','6','--concurrency','2','--output',dir+'/samples.jsonl',base+'/ok',base+'/bad']);
    let stdout='',stderr=''; child.stdout.on('data',x=>stdout+=x); child.stderr.on('data',x=>stderr+=x);
    const [code]=await once(child,'close'); assert.equal(code,0,stderr);
    const summary=JSON.parse(stdout);
    assert.equal(summary.requests,6); assert.equal(summary.errors,3);
    assert.equal(summary.errorRate,0.5);
    assert.ok(summary.p50Ms<=summary.p95Ms && summary.p95Ms<=summary.p99Ms);
    const rows=fs.readFileSync(dir+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse);
    assert.equal(rows.length,6); assert.equal(rows.filter(x=>x.status===503).length,3);
    assert.ok(rows.every(x=>x.startedAt && x.finishedAt && x.latencyMs>=0));
    assert.match(JSON.stringify(day(38).hints),/measure-http.py/);
  } finally { await new Promise(resolve=>server.close(resolve)); rmSync(dir,{recursive:true}); }
});

async function collectD38(handler, paths, concurrency) {
  const {createServer}=await import('node:http');
  const {spawn}=await import('node:child_process');
  const {once}=await import('node:events');
  const os=await import('node:os');
  const server=createServer(handler);
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const dir=fs.mkdtempSync(os.tmpdir()+'/jx-deadline-test-');
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    const child=spawn('python3',[root+'course/start/ops/measure-http.py',
      '--requests',String(paths.length),'--concurrency',String(concurrency),
      '--timeout','1','--output',dir+'/samples.jsonl',...paths.map(p=>base+p)]);
    let stdout='',stderr=''; child.stdout.on('data',x=>stdout+=x); child.stderr.on('data',x=>stderr+=x);
    // 구현이 무한 대기하면 테스트 자식도 정리한다.
    const guard=setTimeout(()=>child.kill('SIGKILL'),8000);
    let code;
    try { [code]=await once(child,'close'); } finally { clearTimeout(guard); }
    assert.equal(code,0,stderr);
    return {summary:JSON.parse(stdout),rows:fs.readFileSync(dir+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse)};
  } finally {
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(dir,{recursive:true});
  }
}

test('round3-N6: 0.4초마다 1바이트씩 9바이트인 본문도 전체 deadline 1초에 실패한다', async t => {
  const {summary,rows}=await collectD38((req,res)=>{
    res.writeHead(200,{'Content-Length':'9'});
    res.flushHeaders();
    let sent=0;
    const timer=setInterval(()=>{res.write('x'); if(++sent===9) {clearInterval(timer);res.end();}},400);
    res.on('close',()=>clearInterval(timer));
  },['/slow'],1);
  assert.equal(summary.requests,1);
  assert.equal(summary.errors,1);
  assert.equal(summary.errorRate,1);
  assert.equal(rows.length,1);
  assert.ok(rows[0].error);
  assert.ok(rows[0].latencyMs>=800 && rows[0].latencyMs<1800,JSON.stringify(rows[0]));
  assert.ok(summary.elapsedSeconds<2,JSON.stringify(summary));
  assert.equal(summary.p99Ms,rows[0].latencyMs);
  t.diagnostic(JSON.stringify({summary,rows}));
  const hint=day(38).hints.steps['2'].join(' ');
  assert.match(hint,/--timeout.*연결부터 본문 수신 완료까지의 전체 deadline/);
  assert.match(hint,/HTTP 200이어도 실패/);
  assert.match(generated.get('course/spring/D38.md'),/--timeout.*연결부터 본문 수신 완료까지의 전체 deadline/);
});

test('round3-N7: Content-Length 100 중 1바이트 뒤 끊긴 응답과 정상 응답을 함께 요약한다', async t => {
  const {summary,rows}=await collectD38((req,res)=>{
    if(req.url==='/partial') {
      res.writeHead(200,{'Content-Length':'100','Connection':'close'});
      res.end('x');
    } else res.end('normal');
  },['/partial','/ok'],2);
  assert.equal(summary.requests,2);
  assert.equal(summary.errors,1);
  assert.equal(summary.errorRate,0.5);
  assert.equal(rows.length,2);
  assert.equal(rows.filter(x=>x.status===200 && !x.error).length,1);
  assert.equal(rows.filter(x=>x.error).length,1);
  assert.equal(rows.find(x=>x.error).status,200);
  assert.match(rows.find(x=>x.error).error,/IncompleteRead/);
  assert.ok(rows.every(x=>x.startedAt && x.finishedAt && x.latencyMs>=0));
  assert.equal(summary.p99Ms,Math.max(...rows.map(x=>x.latencyMs)));
  t.diagnostic(JSON.stringify({summary,rows}));
  assert.match(read('course/start/ops/README.md'),/부분 응답 포함/);
  assert.match(read('course/start/ops/README.md'),/개별 요청 실패.*요약 출력이 끝나면 exit 0/);
});

test('round3-N6-headers: 헤더가 조금씩 도착해도 같은 전체 deadline을 적용한다', async t => {
  const {summary,rows}=await collectD38((req,res)=>{
    res.socket.write('HTTP/1.1 200 OK\r\nX-Slow: ');
    let sent=0;
    const timer=setInterval(()=>{
      res.socket.write('x');
      if(++sent===9) {clearInterval(timer);res.socket.end('\r\nContent-Length: 0\r\n\r\n');}
    },400);
    res.on('close',()=>clearInterval(timer));
  },['/slow-headers'],1);
  assert.equal(summary.errors,1);
  assert.equal(rows[0].status,0);
  assert.match(rows[0].error,/TimeoutError/);
  assert.ok(rows[0].latencyMs>=800 && rows[0].latencyMs<1800,JSON.stringify(rows[0]));
  assert.ok(summary.elapsedSeconds<2,JSON.stringify(summary));
  t.diagnostic(JSON.stringify({summary,rows}));
});
