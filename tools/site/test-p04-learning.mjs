import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { P04_ASSETS, P04_LESSONS, P04_INITIALIZATION_STDOUT } from './p04-lesson-data.mjs';
import { renderP04Learning, p04AvailableLessons } from './p04-learning.mjs';
import { initP04Learning } from './p04-learning.js';

const proof = new URL('../../docs/design/p04-2026-10-20/source-proof/', import.meta.url);
assert.deepEqual(P04_INITIALIZATION_STDOUT, readFileSync(new URL('CreationDemo.stdout.txt', proof), 'utf8').trimEnd().split('\n').slice(0, 7));
assert.equal(P04_LESSONS.length, 14);
assert.equal(P04_LESSONS.flatMap(x => x.stages).length, 48);
assert.equal(new Set(P04_LESSONS.flatMap(x => x.stages.map(s => s.id))).size, 48);
const lombokProof = JSON.parse(readFileSync(new URL('Lombok.verification.json', proof), 'utf8'));
const constructorProof = JSON.parse(readFileSync(new URL('Constructor.verification.json', proof), 'utf8'));
const springProof = JSON.parse(readFileSync(new URL('Spring.verification.json', proof), 'utf8'));
assert.equal(lombokProof.checks, 12); assert.equal(lombokProof.compileExit, 0); assert.equal(lombokProof.runExit, 0);
assert.equal(lombokProof.version, '1.18.46');
assert.equal(constructorProof.implicitNoArgCompiles, true); assert.equal(constructorProof.explicitThisDelegationCompiles, true);
assert.equal(constructorProof.overrideChecks, 3);
for (const name of ['MissingNoArg', 'MissingFinal', 'BeforeSuper21', 'ExplicitBuilder']) assert.equal(constructorProof.negativeCases.find(item => item.name === name)?.rejected, true, name + '의 실제 컴파일 거부 증거');
assert.equal(springProof.checks, 9); assert.equal(springProof.exitCode, 0);
const springFixture = readFileSync(new URL('spring/P04SpringProof.java', proof), 'utf8');
assert.match(springFixture, /context.register\(OrderIdGenerator.class, OrderService.class, OrderController.class\)/);
assert.match(springFixture, /controller.create\(new OrderRequest\(" Mina ", 2\)\)/);
const verifiedOutputs = {
  'override-constructor': readFileSync(new URL('P04ConstructorProof.stdout.txt', proof), 'utf8'),
  'lombok-fields': readFileSync(new URL('P04LombokProof.stdout.txt', proof), 'utf8'),
  'builder-default': readFileSync(new URL('P04LombokProof.stdout.txt', proof), 'utf8'),
  'builder-target': readFileSync(new URL('P04LombokProof.stdout.txt', proof), 'utf8'),
  'noargs-force': readFileSync(new URL('P04LombokProof.stdout.txt', proof), 'utf8'),
  'constructor-injection': readFileSync(new URL('P04SpringProof.stdout.txt', proof), 'utf8'),
  'dto-entity': readFileSync(new URL('P04SpringProof.stdout.txt', proof), 'utf8'),
};
assert.deepEqual(P04_LESSONS.slice(0, 5).map(lesson => lesson.id), ['initialization', 'factory', 'builder', 'copy', 'record']);
assert.equal(P04_LESSONS.slice(0, 5).flatMap(lesson => lesson.stages).length, 25, '기존 5질문·25상태 보존');
assert.deepEqual(P04_LESSONS.slice(5).map(lesson => lesson.stages.length), [3, 2, 3, 3, 2, 2, 4, 2, 2]);
for (const lesson of P04_LESSONS.slice(5)) {
  assert.ok(P04_ASSETS[lesson.id]);
  for (const state of lesson.stages) {
    assert.ok(P04_ASSETS[state.image],state.id+'에 맞는 실제 장면 자산');
    if (!state.stdout) continue;
    assert.match(state.outputLabel, /추가 실험/);
    for (const line of state.stdout.split('\n')) assert.ok(verifiedOutputs[lesson.id].split('\n').includes(line), `${state.id}에 실제 추가 검증 stdout만 표시: ${line}`);
  }
}
const injection = P04_LESSONS.find(l=>l.id==='constructor-injection');
assert.notEqual(injection.stages[0].image,injection.stages.at(-1).image,'정상 주입과 누락 실패의 그림을 분리');
const dto = P04_LESSONS.find(l=>l.id==='dto-entity');
assert.notEqual(dto.stages[0].image,dto.stages[1].image,'DTO 거부 입력과 Entity 규칙의 그림을 분리');
// 이미지 검수 상태는 UI 단위 테스트와 분리한다. 테스트 중에만 준비된 자산으로 취급한다.
const saved = structuredClone(P04_ASSETS);
Object.values(P04_ASSETS).forEach(asset => { asset.ready = false; });
assert.equal(p04AvailableLessons().length, 0);
assert.match(renderP04Learning(), /준비 중/);
Object.values(P04_ASSETS).forEach(asset => { asset.ready = true; asset.focus = Object.fromEntries(P04_LESSONS.flatMap(l => l.stages.filter(s => s.image === asset.id).map(s => [s.id, [2, 20, 96, 60]]))); });

function setup(mobile = false) {
  const page = new JSDOM(renderP04Learning() + '<details id="p04-original"><summary>원문</summary><details><summary>코드</summary><h2 id="deep-source">원문 앵커</h2></details></details>', { url: 'https://learn.example/P04.html#deep-source' });
  const win = page.window, doc = win.document;
  win.matchMedia = () => ({ matches: mobile, addEventListener() {} });
  for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { throw Error('진도 저장 금지'); } });
  win.fetch = () => { throw Error('순수 Java 장면에서 서버 호출 금지'); };
  const copied = [];
  Object.defineProperty(win.navigator, 'clipboard', { value: { async writeText(value) { copied.push(value); } } });
  win.history.replaceState({ foreign: { keep: true } }, '');
  initP04Learning(doc, win);
  const $ = selector => doc.querySelector(selector);
  const topic = id => { $('[data-p04-topic]').value = id; $('[data-p04-topic]').dispatchEvent(new win.Event('change')); };
  const stage = id => { $(`[data-p04-stage="${id}"]`).click(); };
  return { win, doc, $, topic, stage, copied, values: () => $('[data-p04-state]').textContent };
}
const { win, doc, $, topic, stage, copied, values } = setup();
assert.equal(doc.getElementById('p04-original').open, true);
assert.equal(doc.getElementById('deep-source').closest('details').open, true);
const init = P04_LESSONS.find(l => l.id === 'initialization');
for (const [i, state] of init.stages.entries()) {
  stage(state.id);
  assert.equal($('[data-p04-stdout]').textContent, P04_INITIALIZATION_STDOUT.slice(0, i + 1).join('\n'));
  assert.match($('[data-p04-snapshot]').textContent, /완료/);
  assert.match(values(), /Parent\.marker/);
  assert.match(values(), /Child\.marker/);
  assert.match(values(), i < 3 ? /null/ : /Child field/);
}
assert.equal($('[data-p04-output]').open,true,'초기화 실제 출력은 기본 노출');
assert.match(init.note, /println.*return.*대입/);
assert.match(init.note, /한 Child 객체/);
topic('factory'); stage('factory-return');
assert.match(values(), /ORD-1 x 2 tags=\[\]/);
assert.doesNotMatch(values(), /ORD-2|gift/);
topic('builder'); stage('builder-empty');
assert.match(values(), /null/); assert.match(values(), /0/); assert.match(values(), /\[\]/);
for (const id of ['builder-id', 'builder-quantity', 'builder-tag']) { stage(id); assert.match(values(), /같은 Builder/); }
stage('builder-built'); assert.match(values(), /ORD-2 x 3 tags=\[gift\]/); assert.match(values(), /별도 Order/);
stage('builder-invalid'); assert.match(values(), /id is required/); assert.match($('[data-p04-lead]').textContent, /독립.*추가 실험/);
topic('copy'); stage('copy-before'); assert.match(values(), /\[gift\]/);
stage('copy-late'); assert.match(values(), /\[gift, late\]/); assert.match(values(), /기존 Order.*\[gift\]/);
stage('copy-rebuild'); assert.match(values(), /다음 Order.*\[gift, late\]/); assert.match($('[data-p04-note]').textContent, /얕은 복사/);
topic('record'); stage('record-email');
assert.match(values(), /매개변수 email.*user@example.com/); assert.match(values(), /필드.*아직/);
stage('record-validated'); assert.match(values(), /필드.*아직/);
stage('record-fields'); assert.match(values(), /SignupRequest\[email=user@example.com, displayName=Mina\]/);
stage('record-bad'); assert.match(values(), /email is invalid/); assert.match($('[data-p04-note]').textContent, /할당 자체/);
assert.doesNotMatch($('[data-p04-code]').textContent, /this\.email\s*=/, 'compact constructor의 암시적 필드 대입을 실제 본문 코드처럼 만들지 않는다');
$('[data-p04-copy]').click(); await Promise.resolve(); await Promise.resolve();
assert.equal(copied[0], P04_LESSONS.find(l => l.id === 'record').stages.at(-1).code);
assert.deepEqual(win.history.state.foreign, { keep: true }); assert.equal(win.history.length, 1);
const before = $('[data-p04-topic]').value; initP04Learning(doc, win); assert.equal($('[data-p04-topic]').value, before);
topic('initialization');
const buttons = [...doc.querySelectorAll('[data-p04-stage]')]; buttons[0].focus();
buttons[0].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'End', bubbles: true })); assert.equal(doc.activeElement, buttons.at(-1));
buttons.at(-1).dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Home', bubbles: true })); assert.equal(doc.activeElement, buttons[0]);
stage(init.stages.at(-2).id); $('[data-p04-next]').focus(); $('[data-p04-next]').click(); assert.equal(doc.activeElement.dataset.p04Stage, init.stages.at(-1).id);
assert.equal($('[data-p04-next]').disabled, true);
win.history.replaceState({ ...win.history.state, __javaExperienceP04: { topic: 'factory', stage: 'factory-return' } }, '');
win.dispatchEvent(new win.PopStateEvent('popstate')); assert.match(values(), /ORD-1 x 2/);
const valueOf = label => {
  const term = [...$('[data-p04-state]').querySelectorAll('dt')].find(node => node.textContent === label);
  assert.ok(term, '관찰할 값: ' + label); return term.nextElementSibling.textContent;
};
// 새 23상태의 질문·현재 코드·확인값·출력·자산 연결을 모두 실제 DOM에서 검사한다.
for (const lesson of P04_LESSONS.slice(5)) {
  topic(lesson.id);
  assert.equal($('[data-p04-question]').textContent, lesson.question);
  for (const [i, state] of lesson.stages.entries()) {
    stage(state.id);
    assert.equal($('[data-p04-code]').textContent, state.code);
    assert.equal($('[data-p04-lead]').textContent, state.lead);
    assert.equal($('[data-p04-note]').textContent, state.note || lesson.note);
    for (const [label, value] of state.values) assert.equal(valueOf(label), value);
    assert.equal($('[data-p04-stdout]').textContent, state.stdout);
    assert.equal($('[data-p04-output]').hidden, !state.stdout);
    if (state.stdout) { assert.equal($('[data-p04-output-title]').textContent, '추가 실행 검증 보기'); assert.equal($('[data-p04-output-note]').textContent,state.outputLabel); }
    assert.equal($('[data-p04-position]').textContent, `${i + 1} / ${lesson.stages.length}`);
    assert.match($('[data-p04-image]').getAttribute('src'), new RegExp(P04_ASSETS[state.image].file.replaceAll('.', '\\.')));
  }
}
topic('default-constructor'); stage('default-implicit');
assert.equal(valueOf('객체 필드'), '이 예제에 선언 없음');
assert.match($('[data-p04-code]').textContent, /class User \{\}/);
stage('default-missing'); assert.match(values(), /MissingNoArg 컴파일 거부/);
stage('default-explicit'); assert.equal(valueOf('위임 매개변수 name'), 'guest');
assert.doesNotMatch($('[data-p04-code]').textContent, /String name;|this.name|name\s*=/, '원문 User에 없는 객체 필드를 만들지 않는다');
topic('override-constructor'); stage('override-parent'); assert.equal(valueOf('그때 Child.label'), 'null');
assert.doesNotMatch($('[data-p04-code]').textContent + values(), /marker/, '독립 override 실험과 원문 marker를 혼합하지 않는다');
stage('override-ready'); assert.equal(valueOf('생성 완료 Child.label'), 'ready'); assert.equal(valueOf('앞서 기록한 seenDuringParent'), 'null');
topic('lombok-fields'); stage('lombok-required');
assert.equal(valueOf('required 인자'), 'Gateway gateway / String name');
stage('lombok-allargs'); assert.equal(valueOf('allargs 인자'), 'Gateway gateway / String name / int retries');
assert.equal(valueOf('all.retries'), '3'); assert.equal(valueOf('all.fixed'), '20'); assert.match(valueOf('fixed / shared'), /제외/);
stage('lombok-null'); assert.match(valueOf('첫 호출 gateway'), /null 허용/); assert.match(valueOf('별도 둘째 호출 name'), /NullPointerException/);
topic('builder-default');
for (const [id, expected] of [['builder-default-plain', '0'], ['builder-default-omitted', '20'], ['builder-default-explicit', '7']]) { stage(id); assert.equal(valueOf('생성 결과 limit'), expected); }
stage('builder-default-plain'); assert.match($('[data-p04-code]').textContent, /PlainConfig/); assert.doesNotMatch($('[data-p04-code]').textContent, /DefaultConfig|Order/);
stage('builder-default-omitted'); assert.match($('[data-p04-code]').textContent, /DefaultConfig/); assert.doesNotMatch($('[data-p04-code]').textContent, /PlainConfig|Order/);
topic('builder-target'); stage('builder-target-mismatch'); assert.match(values(), /ExplicitBuilder 컴파일 거부/);
stage('builder-target-constructor'); assert.equal(valueOf('정상 호출 결과 name'), 'Mina'); assert.match(valueOf('독립 생략 호출'), /name is required/);
assert.doesNotMatch($('[data-p04-code]').textContent, /ExplicitBuilder/, '컴파일 실패한 클래스와 성공한 생성자 대상 클래스를 섞지 않는다');
topic('noargs-force'); stage('force-result'); assert.equal(valueOf('생성 완료 forced.name'), 'null'); assert.equal(valueOf('생성 완료 forced.retries'), '0'); assert.equal(valueOf('도메인 유효성'), '보장하지 않음');
topic('constructor-injection'); stage('injection-generator'); assert.equal($('[data-p04-output]').open,false,'보조 검증 로그는 기본 접기'); $('[data-p04-output]').open=true; $('[data-p04-zoom]').click(); assert.equal($('[data-p04-output]').open,true,'같은 장면 확대 때 사용자가 연 검증 로그 유지'); assert.equal(valueOf('Service.idGenerator'), '같은 G1');
assert.match($('[data-p04-note]').textContent, /소스 파일 네 개.*세 Bean/);
stage('injection-service'); assert.equal(valueOf('Controller.service'), '같은 S1');
stage('injection-direct-call'); assert.equal(valueOf('response.customerName()'), 'Mina'); assert.equal(valueOf('response.quantity()'), '2'); assert.match(valueOf('response.id()'), /UUID.*고정 문자열 미제시/);
assert.doesNotMatch(values(), /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i, '실행 로그에 없는 고정 UUID를 만들지 않는다');
assert.match($('[data-p04-note]').textContent, /Boot 앱·HTTP·JPA·Java 25는 미실행/);
stage('injection-missing'); assert.match(values(), /NoSuchBeanDefinitionException/); assert.match($('[data-p04-lead]').textContent, /독립된 실패 실험/);
topic('dto-entity'); stage('dto-record'); assert.match(values(), /Mina.*0.*IllegalArgumentException/); assert.match(values(), /공백.*2.*IllegalArgumentException/);
stage('entity-rule'); assert.match(values(), /public 또는 protected 무인자/); assert.match(values(), /JPA 미실행.*DB 행·SQL 없음/);
assert.doesNotMatch($('[data-p04-code]').textContent, /@Entity|@Id|INSERT|SELECT|String name|Long id/, '상징적 Entity에 실제 필드·DB 결과를 만들지 않는다');
topic('java25-boundary'); stage('java21-reject'); const rejectedSource = $('[data-p04-code]').textContent;
assert.match(rejectedSource, /BeforeSuper21 extends Base/); assert.match(values(), /JDK 21.0.6.*거부/s);
stage('java25-described'); assert.equal($('[data-p04-code]').textContent, rejectedSource); assert.match(values(), /Java 25 미실행/); assert.match($('[data-p04-note]').textContent, /임의의 this 접근.*모든 코드/);
assert.deepEqual(win.history.state.foreign, { keep: true });
win.close();
const mobile = setup(true);
assert.equal(mobile.$('[data-p04-init-mobile]').hidden,false,'모바일 초기화는 한 Child 안의 두 필드를 함께 보여 줌');
assert.match(mobile.$('[data-p04-init-mobile]').textContent,/Parent.marker.*Parent field.*Child.marker.*null/s);
mobile.stage('init-4');assert.match(mobile.$('[data-p04-init-mobile]').textContent,/Child.marker.*Child field/s);
mobile.topic('builder');assert.equal(mobile.$('[data-p04-init-mobile]').hidden,true); mobile.stage('builder-invalid');
mobile.$('[data-p04-mobile-prev]').focus(); mobile.$('[data-p04-mobile-prev]').click();
assert.equal(mobile.doc.activeElement, mobile.$('[data-p04-mobile-prev]'));
mobile.$('[data-p04-stage-select]').value = 'builder-id'; mobile.$('[data-p04-stage-select]').dispatchEvent(new mobile.win.Event('change'));
mobile.$('[data-p04-mobile-prev]').focus(); mobile.$('[data-p04-mobile-prev]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-p04-stage-select]'));
assert.equal(mobile.$('.p09-image-frame').tabIndex, 0);
mobile.win.close();
for (const [key, value] of Object.entries(saved)) { Object.keys(P04_ASSETS[key]).forEach(k => delete P04_ASSETS[key][k]); Object.assign(P04_ASSETS[key], value); }
console.log('P04: 14질문·48상태(기존25+추가23), 추가검증12/4+2+3/9 대조, 원문 7줄, 값/코드/출력, 독립 실험, record 필드 시점, 전환·복사·history·원문·키보드·포커스·모바일·진도 분리 통과');
