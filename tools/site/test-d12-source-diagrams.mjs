import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const generatedD12 = readFileSync(new URL('../../docs/knowledge/D12-linux-terminal-basics.html', import.meta.url), 'utf8');
const generatedDocument = new JSDOM(generatedD12).window.document;
const generatedAnchorGuard = [...generatedDocument.querySelectorAll('script:not([type])')]
  .find(script => script.textContent.includes('d12InitialHashCaptured'))?.textContent;
assert.ok(generatedAnchorGuard, 'generated HTML contains the classic pre-CDN hash guard');

function makeFixture({ mode = 'scene', openOriginal = mode === 'read', openChapter = mode === 'read', measuredWidth = 700, hash = '' } = {}) {
  const dom = new JSDOM(`<!doctype html><main>
    <div class="kr-reader ${mode === 'read' ? 'is-reading' : 'is-scene'}" data-knowledge-reader data-kr-mode="${mode}">
      <section id="kr-scene" data-kr-scene${mode === 'read' ? ' hidden' : ''}><div data-d12-learning></div></section>
      <section id="kr-reading" data-kr-reading${mode === 'read' ? '' : ' hidden'}>
        <div class="knowledge-reader-original">
          <details id="d12-original" class="d12-original"${openOriginal ? ' open' : ''}>
            <details class="knowledge-chapter"${openChapter ? ' open' : ''}>
              <pre class="mermaid">flowchart TD\n  A[원문 diagram 1] --&gt; B[원문 diagram 1 끝]</pre>
              <pre class="mermaid">sequenceDiagram\n  A-&gt;&gt;B: 원문 diagram 2</pre>
              <pre class="mermaid">flowchart LR\n  C[원문 diagram 3] --&gt; D[끝]</pre>
              <h2 id="4-직접-해보기">실습 절</h2>
              <h2 id="alternate-source-target">다른 원문 절</h2>
            </details>
          </details>
        </div>
        <h2 id="outside-source-target">다른 설명 절</h2>
      </section>
    </div>
  </main>`, { pretendToBeVisual: true, runScripts: 'outside-only', url: `https://javaexperience.test/docs/knowledge/D12-linux-terminal-basics.html${hash}` });
  const { document } = dom.window;
  const reader = document.querySelector('[data-knowledge-reader]');
  const reading = document.querySelector('[data-kr-reading]');
  const original = document.querySelector('#d12-original');
  const chapter = document.querySelector('.knowledge-chapter');
  const nodes = [...document.querySelectorAll('.d12-original pre.mermaid')];
  const sources = nodes.map(node => node.textContent);
  const anchor = document.getElementById('4-직접-해보기');
  const alternateAnchor = document.getElementById('alternate-source-target');
  const outsideAnchor = document.getElementById('outside-source-target');
  const anchorScrolls = [];
  const pathIsVisible = () => reader.dataset.krMode === 'read' && !reading.hidden && original.open && chapter.open;
  const readingAreaVisible = () => reader.dataset.krMode === 'read' && !reading.hidden;
  for (const node of nodes) {
    Object.defineProperties(node, {
      getBoundingClientRect: { configurable: true, value: () => {
        const visible = pathIsVisible();
        const width = visible ? measuredWidth : 0;
        return { width, height: visible ? 120 : 0, top: 0, left: 0, right: width, bottom: visible ? 120 : 0, x: 0, y: 0, toJSON() { return this; } };
      } },
      getClientRects: { configurable: true, value: () => pathIsVisible() ? [node.getBoundingClientRect()] : [] },
    });
  }
  for (const target of [anchor, alternateAnchor, outsideAnchor]) Object.defineProperties(target, {
    getBoundingClientRect: { configurable: true, value: () => {
      const width = readingAreaVisible() ? measuredWidth : 0;
      return { width, height: width ? 30 : 0, top: 500, left: 0, right: width, bottom: width ? 530 : 0, x: 0, y: 500, toJSON() { return this; } };
    } },
    getClientRects: { configurable: true, value: () => readingAreaVisible() ? [target.getBoundingClientRect()] : [] },
    scrollIntoView: { configurable: true, value: options => anchorScrolls.push({ target: target.id, options, allDiagramsRendered: nodes.every(node => node.querySelector('svg.rendered')) }) },
  });
  return { dom, document, reader, reading, original, chapter, nodes, sources, anchor, alternateAnchor, outsideAnchor, anchorScrolls, setMeasuredWidth: width => { measuredWidth = width; } };
}

function fakeMermaid() {
  let calls = 0;
  let active = 0;
  let maxConcurrent = 0;
  let holdNext = false;
  let heldRelease = null;
  let failNext = false;
  let errorSvgNext = false;
  const startWaiters = [];
  const run = async ({ nodes }) => {
    calls += 1; active += 1; maxConcurrent = Math.max(maxConcurrent, active);
    for (const waiter of [...startWaiters]) if (calls >= waiter.target) { startWaiters.splice(startWaiters.indexOf(waiter), 1); waiter.resolve(); }
    try {
      if (nodes.some(node => node.getBoundingClientRect().width <= 0)) throw new Error('fake Mermaid refused a width=0 source node');
      if (holdNext) {
        holdNext = false;
        await new Promise(resolve => { heldRelease = resolve; });
      }
      if (failNext) {
        failNext = false;
        nodes[0].innerHTML = '<svg class="error"><text>Syntax error in text</text></svg>';
        nodes[0].setAttribute('data-processed', 'true');
        throw new Error('fake Mermaid syntax error');
      }
      if (errorSvgNext) {
        errorSvgNext = false;
        nodes[0].innerHTML = '<svg><g class="error-icon"></g><text>Mermaid version error</text></svg>';
        nodes[0].setAttribute('data-processed', 'true');
        return;
      }
      for (const node of nodes) {
        node.innerHTML = '<svg class="rendered"><text>diagram rendered</text></svg>';
        node.setAttribute('data-processed', 'true');
      }
    } finally { active -= 1; }
  };
  return {
    api: { run },
    get calls() { return calls; },
    get maxConcurrent() { return maxConcurrent; },
    set holdNext(value) { holdNext = value; },
    set failNext(value) { failNext = value; },
    set errorSvgNext(value) { errorSvgNext = value; },
    waitForCall(target) { return calls >= target ? Promise.resolve() : new Promise(resolve => startWaiters.push({ target, resolve })); },
    releaseHeld() { if (!heldRelease) throw new Error('no Mermaid run is being held'); const release = heldRelease; heldRelease = null; release(); },
  };
}

function instrumentGuardListeners(win, root) {
  const guardEvents = ['wheel','touchmove','pointerdown','keydown','hashchange','popstate'];
  const captureOf = options => options === true || (typeof options === 'object' && options !== null && options.capture === true);
  const registeredWindow = new Map(guardEvents.map(type => [type, new Map()]));
  const windowWrappers = new Map(guardEvents.map(type => [type, new Map()]));
  const windowInvocations = new Map(guardEvents.map(type => [type, 0]));
  const addRegistration = (registry, listener, capture) => {
    let captures = registry.get(listener);
    if (!captures) registry.set(listener, captures = new Set());
    captures.add(capture);
  };
  const removeRegistration = (registry, listener, capture) => {
    const captures = registry.get(listener);
    if (!captures) return;
    captures.delete(capture);
    if (!captures.size) registry.delete(listener);
  };
  const registrationCount = registry => [...registry.values()].reduce((count, captures) => count + captures.size, 0);
  const nativeWindowAdd = win.addEventListener.bind(win);
  const nativeWindowRemove = win.removeEventListener.bind(win);
  win.addEventListener = (type, listener, options) => {
    if (!registeredWindow.has(type)) return nativeWindowAdd(type, listener, options);
    addRegistration(registeredWindow.get(type), listener, captureOf(options));
    const wrapped = function(event) {
      windowInvocations.set(type, windowInvocations.get(type) + 1);
      return listener.call(this, event);
    };
    windowWrappers.get(type).set(listener, wrapped);
    return nativeWindowAdd(type, wrapped, options);
  };
  win.removeEventListener = (type, listener, options) => {
    if (!registeredWindow.has(type)) return nativeWindowRemove(type, listener, options);
    const capture = captureOf(options);
    const wrappers = registeredWindow.get(type);
    const wasRegistered = wrappers.get(listener)?.has(capture) || false;
    const eventWrappers = windowWrappers.get(type);
    const wrapped = eventWrappers.get(listener) || listener;
    removeRegistration(wrappers, listener, capture);
    if (wasRegistered) eventWrappers.delete(listener);
    return nativeWindowRemove(type, wrapped, options);
  };
  const registeredRoot = new Map();
  const rootWrappers = new Map();
  const nativeRootAdd = root.addEventListener.bind(root);
  const nativeRootRemove = root.removeEventListener.bind(root);
  root.addEventListener = (type, listener, options) => {
    if (type !== 'd12-initial-anchor-settled') return nativeRootAdd(type, listener, options);
    const capture = captureOf(options);
    const once = typeof options === 'object' && options?.once;
    const wrapped = function(event) {
      try { return listener.call(this, event); }
      finally {
        if (once) {
          removeRegistration(registeredRoot, listener, capture);
          rootWrappers.delete(listener);
        }
      }
    };
    rootWrappers.set(listener, { wrapped, capture });
    addRegistration(registeredRoot, listener, capture);
    return nativeRootAdd(type, wrapped, options);
  };
  root.removeEventListener = (type, listener, options) => {
    if (type !== 'd12-initial-anchor-settled') return nativeRootRemove(type, listener, options);
    const capture = captureOf(options);
    const entry = rootWrappers.get(listener);
    const wrapped = entry?.wrapped || listener;
    if (entry?.capture === capture) {
      removeRegistration(registeredRoot, listener, capture);
      rootWrappers.delete(listener);
    }
    return nativeRootRemove(type, wrapped, options);
  };
  return {
    windowCounts: () => Object.fromEntries([...registeredWindow].map(([type, listeners]) => [type, registrationCount(listeners)])),
    windowCaptures: () => Object.fromEntries([...registeredWindow].map(([type, listeners]) => [type, [...listeners.values()].flatMap(captures => [...captures])])),
    windowInvocations: () => Object.fromEntries(windowInvocations),
    windowListenerCount: () => [...registeredWindow.values()].reduce((sum, listeners) => sum + registrationCount(listeners), 0),
    rootCaptures: () => [...registeredRoot.values()].flatMap(captures => [...captures]),
    rootListenerCount: () => registrationCount(registeredRoot),
  };
}

function assertGuardInactiveAfter(harness, instrumentation, label) {
  const { dom } = harness;
  const root = harness.document.querySelector('[data-d12-learning]');
  assert.equal(instrumentation.windowListenerCount(), 0, `${label}: no tracked window intent listeners remain`);
  assert.equal(instrumentation.rootListenerCount(), 0, `${label}: no tracked settled listener remains`);
  const before = instrumentation.windowInvocations();
  for (const type of ['wheel','touchmove','pointerdown','keydown','hashchange','popstate']) {
    const event = type === 'keydown'
      ? new dom.window.KeyboardEvent(type, { key: 'Tab' })
      : new dom.window.Event(type);
    dom.window.dispatchEvent(event);
  }
  assert.deepEqual(instrumentation.windowInvocations(), before, `${label}: dispatch after cleanup invokes no removed intent listener`);
  assert.equal(root.dataset.d12InitialAnchorCanceled, 'false', `${label}: post-cleanup event dispatch does not invoke the old guard`);
}

const wrongCaptureGuardFixture = makeFixture({ mode: 'read', hash: '#4-직접-해보기' });
const wrongCaptureGuardRoot = wrongCaptureGuardFixture.document.querySelector('[data-d12-learning]');
const wrongCaptureGuardListeners = instrumentGuardListeners(wrongCaptureGuardFixture.dom.window, wrongCaptureGuardRoot);
const wrongCaptureGuard = generatedAnchorGuard.replace(
  "win.removeEventListener('wheel', onUserMove, true);",
  "win.removeEventListener('wheel', onUserMove, false);",
);
assert.notEqual(wrongCaptureGuard, generatedAnchorGuard, 'capture mismatch probe mutates the serialized guard');
wrongCaptureGuardFixture.dom.window.eval(wrongCaptureGuard);
wrongCaptureGuardFixture.dom.window.dispatchEvent(new wrongCaptureGuardFixture.dom.window.Event('wheel'));
assert.equal(wrongCaptureGuardListeners.windowListenerCount(), 1, 'capture mismatch leaves the wheel (callback, capture=true) registration tracked');
assert.equal(wrongCaptureGuardRoot.dataset.d12InitialAnchorCanceled, 'true', 'dispatch invokes the native wheel handler left by wrong-capture removal');
wrongCaptureGuardFixture.dom.window.dispatchEvent(new wrongCaptureGuardFixture.dom.window.Event('wheel'));
assert.equal(wrongCaptureGuardListeners.windowInvocations().wheel, 2, 'post-cleanup wheel dispatch still reaches the native handler left by wrong-capture removal');
assert.equal(wrongCaptureGuardListeners.rootListenerCount(), 0, 'settled listener still cleans up with matching capture=false');
wrongCaptureGuardRoot.dispatchEvent(new wrongCaptureGuardFixture.dom.window.Event('d12-initial-anchor-settled'));

async function waitForMutation(harness, mutate) {
  const { dom, reader, reading, original, chapter } = harness;
  const promise = new Promise(resolve => {
    const observer = new dom.window.MutationObserver(records => { observer.disconnect(); resolve(records); });
    observer.observe(reader, { attributes: true, attributeFilter: ['class', 'data-kr-mode'] });
    observer.observe(reading, { attributes: true, attributeFilter: ['hidden'] });
    observer.observe(original, { attributes: true, attributeFilter: ['open'] });
    observer.observe(chapter, { attributes: true, attributeFilter: ['open'] });
  });
  mutate();
  return promise;
}

// RED reproduction: the old page-wide startOnLoad behavior tries to render hidden source nodes.
const hidden = makeFixture({ mode: 'scene' });
const legacyMermaid = fakeMermaid();
await assert.rejects(legacyMermaid.api.run({ nodes: hidden.nodes }), /width=0/);
assert.equal(hidden.nodes[0].getBoundingClientRect().width, 0);
const initialRead = makeFixture({ mode: 'read' });
const controlMermaid = fakeMermaid();
await controlMermaid.api.run({ nodes: initialRead.nodes });
assert.equal(controlMermaid.calls, 1);
assert.ok(initialRead.nodes.every(node => node.querySelector('svg.rendered')));

let sourceDiagramModule;
try { sourceDiagramModule = await import('./d12-source-diagrams.mjs'); }
catch (error) {
  console.error('RED: hidden-source render reproduced; visible-only D12 renderer is not implemented yet.');
  throw error;
}
const { initD12SourceDiagrams, installD12InitialAnchorGuard } = sourceDiagramModule;

for (const hash of ['', '#4-직접-해보기']) {
  const cdnWait = makeFixture({ mode: 'scene', hash });
  cdnWait.dom.window.eval(generatedAnchorGuard);
  cdnWait.dom.window.dispatchEvent(new cdnWait.dom.window.Event('wheel'));
  if (!hash) {
    cdnWait.dom.window.location.hash = '#4-직접-해보기';
    cdnWait.dom.window.dispatchEvent(new cdnWait.dom.window.Event('hashchange'));
  }
  cdnWait.reader.dataset.krMode = 'read'; cdnWait.reader.className = 'kr-reader is-reading';
  cdnWait.reading.hidden = false; cdnWait.original.open = true; cdnWait.chapter.open = true;
  const cdnWaitRenderer = fakeMermaid();
  const cdnWaitController = initD12SourceDiagrams(cdnWait.document, cdnWait.dom.window, cdnWaitRenderer.api);
  await cdnWaitController.whenIdle();
  assert.equal(cdnWait.anchorScrolls.length, 0, `initial anchor ${JSON.stringify(hash)} is canceled by movement before helper startup`);
  cdnWaitController.dispose();
}

const readerMode = makeFixture({ mode: 'scene' });
const renderer = fakeMermaid();
const controller = initD12SourceDiagrams(readerMode.document, readerMode.dom.window, renderer.api);
assert.equal(initD12SourceDiagrams(readerMode.document, readerMode.dom.window, renderer.api), controller, 'duplicate init returns the same controller');
await controller.whenIdle();
assert.equal(renderer.calls, 0, 'scene mode never renders hidden source');
assert.deepEqual(readerMode.nodes.map(node => node.textContent), readerMode.sources);
await waitForMutation(readerMode, () => {
  readerMode.reader.dataset.krMode = 'read'; readerMode.reader.className = 'kr-reader is-reading';
  readerMode.reading.hidden = false; readerMode.original.open = true; readerMode.chapter.open = true;
});
await controller.whenIdle();
assert.equal(renderer.calls, 3, 'all source diagrams render once after becoming measurable');
assert.ok(readerMode.nodes.every(node => node.querySelector('svg.rendered')));
assert.ok(readerMode.nodes.every(node => node.getAttribute('data-processed') === 'true'));
assert.equal(renderer.maxConcurrent, 1, 'renders run serially');
controller.dispose();

const helperControl = makeFixture({ mode: 'read' });
const helperControlRenderer = fakeMermaid();
const helperControlController = initD12SourceDiagrams(helperControl.document, helperControl.dom.window, helperControlRenderer.api);
await helperControlController.whenIdle();
assert.equal(helperControlRenderer.calls, 3, 'initial read=1 visibility renders all three source diagrams');
assert.ok(helperControl.nodes.every(node => node.querySelector('svg.rendered')));
helperControlController.dispose();

const widthGate = makeFixture({ mode: 'read', measuredWidth: 0 });
const widthGateRenderer = fakeMermaid();
const widthGateController = initD12SourceDiagrams(widthGate.document, widthGate.dom.window, widthGateRenderer.api);
await widthGateController.whenIdle();
assert.equal(widthGate.nodes[0].getClientRects().length, 1, 'the open read-mode node has a layout rect');
assert.equal(widthGate.nodes[0].getBoundingClientRect().width, 0);
assert.equal(widthGateRenderer.calls, 0, 'an open source with zero actual width is still deferred');
widthGate.setMeasuredWidth(700);
widthGate.dom.window.dispatchEvent(new widthGate.dom.window.Event('resize'));
await widthGateController.whenIdle();
assert.equal(widthGateRenderer.calls, 3, 'positive width triggers serial rendering on resize');
widthGateController.dispose();

const completed = makeFixture({ mode: 'read' });
const completedRenderer = fakeMermaid();
const completedController = initD12SourceDiagrams(completed.document, completed.dom.window, completedRenderer.api);
await completedController.whenIdle();
assert.equal(completedRenderer.calls, 3);
await waitForMutation(completed, () => {
  completed.reader.dataset.krMode = 'scene'; completed.reader.className = 'kr-reader is-scene';
  completed.reading.hidden = true; completed.original.open = false; completed.chapter.open = false;
});
await completedController.whenIdle();
assert.ok(completed.nodes.every(node => node.querySelector('svg.rendered')), 'completed SVG remains attached while its source is hidden');
await waitForMutation(completed, () => {
  completed.reader.dataset.krMode = 'read'; completed.reader.className = 'kr-reader is-reading';
  completed.reading.hidden = false; completed.original.open = true; completed.chapter.open = true;
});
await completedController.whenIdle();
assert.equal(completedRenderer.calls, 3, 'completed SVG is reused after a scene/read toggle');
completedController.dispose();

const nestedGate = makeFixture({ mode: 'read', openOriginal: true, openChapter: false });
const nestedRenderer = fakeMermaid();
const nestedController = initD12SourceDiagrams(nestedGate.document, nestedGate.dom.window, nestedRenderer.api);
await nestedController.whenIdle();
assert.equal(nestedRenderer.calls, 0, 'a closed inner source chapter is not rendered');
await waitForMutation(nestedGate, () => { nestedGate.chapter.open = true; });
await nestedController.whenIdle();
assert.equal(nestedRenderer.calls, 3, 'opening the inner source chapter schedules its diagrams');
nestedController.dispose();

const inflight = makeFixture({ mode: 'read' });
const slowRenderer = fakeMermaid(); slowRenderer.holdNext = true;
const inflightController = initD12SourceDiagrams(inflight.document, inflight.dom.window, slowRenderer.api);
const firstRun = slowRenderer.waitForCall(1);
await firstRun;
assert.equal(slowRenderer.calls, 1);
await waitForMutation(inflight, () => {
  inflight.reader.dataset.krMode = 'scene'; inflight.reader.className = 'kr-reader is-scene';
  inflight.reading.hidden = true; inflight.original.open = false; inflight.chapter.open = false;
});
assert.deepEqual(inflight.nodes.map(node => node.textContent), inflight.sources, 'leaving read mode restores source while render is in flight');
await waitForMutation(inflight, () => {
  inflight.reader.dataset.krMode = 'read'; inflight.reader.className = 'kr-reader is-reading';
  inflight.reading.hidden = false; inflight.original.open = true; inflight.chapter.open = true;
});
assert.equal(slowRenderer.calls, 1, 'rapid return to read mode remains single-flight');
slowRenderer.releaseHeld();
await inflightController.whenIdle();
assert.equal(slowRenderer.calls, 4, 'visible state retries once after the hidden in-flight render is discarded');
assert.ok(inflight.nodes.every(node => node.querySelector('svg.rendered')));
assert.equal(slowRenderer.maxConcurrent, 1);
inflightController.dispose();

const failure = makeFixture({ mode: 'read' });
const failingRenderer = fakeMermaid(); failingRenderer.errorSvgNext = true;
const failureController = initD12SourceDiagrams(failure.document, failure.dom.window, failingRenderer.api);
await failureController.whenIdle();
assert.equal(failingRenderer.calls, 3, 'a visible error SVG does not retry forever');
assert.equal(failure.nodes[0].textContent, failure.sources[0], 'failed source restores exact original text');
assert.equal(failure.nodes[0].hasAttribute('data-processed'), false);
assert.ok(failure.nodes.slice(1).every(node => node.querySelector('svg.rendered')), 'neighboring diagrams can still render');
assert.equal(failure.original.querySelector('[data-d12-mermaid-error]').textContent, '도식을 표시하지 못했습니다. 도식 원문을 확인할 수 있습니다.');
await waitForMutation(failure, () => {
  failure.original.open = false; failure.chapter.open = false;
  failure.original.open = true; failure.chapter.open = true;
});
await failureController.whenIdle();
assert.equal(failure.original.querySelector('[data-d12-mermaid-error]'), null, 'source toggled hidden then visible clears the error notice');
assert.equal(failingRenderer.calls, 4, 'reopening the source allows one bounded retry for the failed diagram');
assert.ok(failure.nodes.every(node => node.querySelector('svg.rendered')));
failureController.dispose();

const rejected = makeFixture({ mode: 'read' });
const rejectedRenderer = fakeMermaid(); rejectedRenderer.failNext = true;
const rejectedController = initD12SourceDiagrams(rejected.document, rejected.dom.window, rejectedRenderer.api);
await rejectedController.whenIdle();
assert.equal(rejectedRenderer.calls, 3, 'a rejected Mermaid render does not retry forever');
assert.equal(rejected.nodes[0].textContent, rejected.sources[0]);
assert.equal(rejected.original.querySelector('[data-d12-mermaid-error]').textContent, '도식을 표시하지 못했습니다. 도식 원문을 확인할 수 있습니다.');
rejectedController.dispose();

const queued = makeFixture({ mode: 'read' });
const queuedRenderer = fakeMermaid();
const queuedController = initD12SourceDiagrams(queued.document, queued.dom.window, queuedRenderer.api);
queuedController.dispose();
await queuedController.whenIdle();
assert.equal(queuedRenderer.calls, 0, 'dispose cancels a queued render before it starts');
assert.deepEqual(queued.nodes.map(node => node.textContent), queued.sources);

const disposeSuccess = makeFixture({ mode: 'read' });
const disposeSuccessRenderer = fakeMermaid(); disposeSuccessRenderer.holdNext = true;
const disposeSuccessController = initD12SourceDiagrams(disposeSuccess.document, disposeSuccess.dom.window, disposeSuccessRenderer.api);
await disposeSuccessRenderer.waitForCall(1);
const disposeSuccessIdle = disposeSuccessController.whenIdle();
disposeSuccessController.dispose();
disposeSuccessRenderer.releaseHeld();
await disposeSuccessIdle;
await disposeSuccessController.whenIdle();
assert.deepEqual(disposeSuccess.nodes.map(node => node.textContent), disposeSuccess.sources, 'dispose drops a late successful result and restores source');
assert.ok(disposeSuccess.nodes.every(node => !node.hasAttribute('data-processed')));
assert.equal(disposeSuccess.original.querySelector('[data-d12-mermaid-error]'), null);

const disposeReject = makeFixture({ mode: 'read' });
const disposeRejectRenderer = fakeMermaid(); disposeRejectRenderer.holdNext = true; disposeRejectRenderer.failNext = true;
const disposeRejectController = initD12SourceDiagrams(disposeReject.document, disposeReject.dom.window, disposeRejectRenderer.api);
await disposeRejectRenderer.waitForCall(1);
const disposeRejectIdle = disposeRejectController.whenIdle();
disposeRejectController.dispose();
disposeRejectRenderer.releaseHeld();
await disposeRejectIdle;
await disposeRejectController.whenIdle();
assert.deepEqual(disposeReject.nodes.map(node => node.textContent), disposeReject.sources, 'dispose drops a late rejection and restores source');
assert.ok(disposeReject.nodes.every(node => !node.hasAttribute('data-processed')));
assert.equal(disposeReject.original.querySelector('[data-d12-mermaid-error]'), null, 'late failure after dispose does not insert an error notice');

const anchored = makeFixture({ mode: 'read', hash: '#4-직접-해보기' });
const anchoredRenderer = fakeMermaid(); anchoredRenderer.holdNext = true;
const anchoredGuardListeners = instrumentGuardListeners(anchored.dom.window, anchored.document.querySelector('[data-d12-learning]'));
anchored.dom.window.eval(generatedAnchorGuard);
assert.equal(anchoredGuardListeners.windowListenerCount(), 6, 'serialized pre-CDN guard registers six intent listeners');
assert.equal(anchoredGuardListeners.rootListenerCount(), 1, 'serialized pre-CDN guard registers one settled listener');
assert.deepEqual(anchoredGuardListeners.windowCaptures(), Object.fromEntries(['wheel','touchmove','pointerdown','keydown','hashchange','popstate'].map(type => [type, [true]])), 'window guard listeners use capture=true');
assert.deepEqual(anchoredGuardListeners.rootCaptures(), [false], 'settled listener uses capture=false by default');
anchored.dom.window.eval(generatedAnchorGuard);
assert.equal(anchoredGuardListeners.windowListenerCount(), 6, 'serialized guard is idempotent');
const anchoredController = initD12SourceDiagrams(anchored.document, anchored.dom.window, anchoredRenderer.api);
await anchoredRenderer.waitForCall(1);
assert.equal(anchored.anchorScrolls.length, 0, 'initial TOC anchor does not move during diagram render');
anchoredRenderer.releaseHeld();
await anchoredController.whenIdle();
assert.equal(anchoredRenderer.calls, 3);
assert.deepEqual(anchored.anchorScrolls, [{ target: '4-직접-해보기', options: { block: 'start' }, allDiagramsRendered: true }], 'valid initial anchor is restored once after the first visible batch');
assert.equal(anchoredGuardListeners.windowListenerCount(), 0, 'settled anchor removes all intent listeners');
assert.equal(anchoredGuardListeners.rootListenerCount(), 0, 'settled anchor removes its root event listener');
assertGuardInactiveAfter(anchored, anchoredGuardListeners, 'settled');
anchored.dom.window.dispatchEvent(new anchored.dom.window.Event('resize'));
await anchoredController.whenIdle();
assert.equal(anchored.anchorScrolls.length, 1, 'resize and idle after initial correction do not scroll twice');
anchoredController.dispose();

const emptyAnchor = makeFixture({ mode: 'scene', hash: '' });
const emptyGuardListeners = instrumentGuardListeners(emptyAnchor.dom.window, emptyAnchor.document.querySelector('[data-d12-learning]'));
emptyAnchor.dom.window.eval(generatedAnchorGuard);
assert.equal(emptyGuardListeners.windowListenerCount(), 6);
emptyAnchor.dom.window.history.replaceState(null, '', '#4-직접-해보기');
emptyAnchor.reader.dataset.krMode = 'read'; emptyAnchor.reader.className = 'kr-reader is-reading';
emptyAnchor.reading.hidden = false; emptyAnchor.original.open = true; emptyAnchor.chapter.open = true;
const emptyAnchorRenderer = fakeMermaid();
const emptyAnchorController = initD12SourceDiagrams(emptyAnchor.document, emptyAnchor.dom.window, emptyAnchorRenderer.api);
await emptyAnchorController.whenIdle();
assert.equal(emptyAnchor.anchorScrolls.length, 0, 'late history.replaceState cannot become an anchor when initial hash was empty');
assert.equal(emptyGuardListeners.windowListenerCount(), 0, 'empty initial hash settles and removes input listeners');
assert.equal(emptyGuardListeners.rootListenerCount(), 0);
emptyAnchorController.dispose();

const alternateAnchor = makeFixture({ mode: 'read', hash: '#4-직접-해보기' });
alternateAnchor.dom.window.eval(generatedAnchorGuard);
alternateAnchor.dom.window.history.replaceState(null, '', '#alternate-source-target');
const alternateRenderer = fakeMermaid();
const alternateController = initD12SourceDiagrams(alternateAnchor.document, alternateAnchor.dom.window, alternateRenderer.api);
await alternateController.whenIdle();
assert.equal(alternateAnchor.anchorScrolls.length, 0, 'hash changed without hashchange event cannot scroll to another source target');
alternateController.dispose();

for (const options of [
  { mode: 'read' },
  { mode: 'read', hash: '#missing-target' },
  { mode: 'read', hash: '#outside-source-target' },
  { mode: 'read', openOriginal: false, openChapter: false, hash: '#4-직접-해보기' },
  { mode: 'read', openOriginal: false, openChapter: false, hash: '#d12-original' },
]) {
  const skippedAnchor = makeFixture(options);
  const skippedRenderer = fakeMermaid();
  const skippedController = initD12SourceDiagrams(skippedAnchor.document, skippedAnchor.dom.window, skippedRenderer.api);
  await skippedController.whenIdle();
  assert.equal(skippedAnchor.anchorScrolls.length, 0, 'no hash, invalid/outside hash, or closed target never auto-scrolls');
  skippedController.dispose();
}

async function assertUserMoveCancels(cancel) {
  const moved = makeFixture({ mode: 'read', hash: '#4-직접-해보기' });
  const movedRenderer = fakeMermaid(); movedRenderer.holdNext = true;
  const movedGuardListeners = instrumentGuardListeners(moved.dom.window, moved.document.querySelector('[data-d12-learning]'));
  moved.dom.window.eval(generatedAnchorGuard);
  const movedController = initD12SourceDiagrams(moved.document, moved.dom.window, movedRenderer.api);
  assert.equal(movedGuardListeners.windowListenerCount(), 6);
  assert.equal(movedGuardListeners.rootListenerCount(), 1);
  await movedRenderer.waitForCall(1);
  cancel(moved);
  assert.equal(movedGuardListeners.windowListenerCount(), 0, 'early user movement removes all registered intent listeners');
  assert.equal(movedGuardListeners.rootListenerCount(), 0, 'early user movement removes the settled listener');
  movedRenderer.releaseHeld();
  await movedController.whenIdle();
  assert.equal(moved.anchorScrolls.length, 0, 'user navigation cancels initial anchor correction');
  movedController.dispose();
}
await assertUserMoveCancels(h => h.dom.window.dispatchEvent(new h.dom.window.Event('wheel')));
await assertUserMoveCancels(h => h.dom.window.dispatchEvent(new h.dom.window.Event('touchmove')));
await assertUserMoveCancels(h => h.dom.window.dispatchEvent(new h.dom.window.Event('pointerdown')));
for (const key of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End',' ','Tab']) {
  await assertUserMoveCancels(h => h.dom.window.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key, code: key === ' ' ? 'Space' : key })));
}
await assertUserMoveCancels(h => h.dom.window.dispatchEvent(new h.dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })));
await assertUserMoveCancels(h => {
  h.dom.window.location.hash = '#outside-source-target';
  h.dom.window.dispatchEvent(new h.dom.window.Event('hashchange'));
});
await assertUserMoveCancels(h => h.dom.window.dispatchEvent(new h.dom.window.PopStateEvent('popstate')));

const scrollEventOnly = makeFixture({ mode: 'read', hash: '#4-직접-해보기' });
const scrollEventRenderer = fakeMermaid(); scrollEventRenderer.holdNext = true;
const scrollEventController = initD12SourceDiagrams(scrollEventOnly.document, scrollEventOnly.dom.window, scrollEventRenderer.api);
await scrollEventRenderer.waitForCall(1);
scrollEventOnly.dom.window.dispatchEvent(new scrollEventOnly.dom.window.Event('scroll'));
scrollEventRenderer.releaseHeld();
await scrollEventController.whenIdle();
assert.equal(scrollEventOnly.anchorScrolls.length, 1, 'scroll events alone are not treated as manual navigation');
scrollEventController.dispose();

const anchorDispose = makeFixture({ mode: 'read', hash: '#4-직접-해보기' });
const anchorDisposeRenderer = fakeMermaid(); anchorDisposeRenderer.holdNext = true;
const disposeGuardListeners = instrumentGuardListeners(anchorDispose.dom.window, anchorDispose.document.querySelector('[data-d12-learning]'));
anchorDispose.dom.window.eval(generatedAnchorGuard);
const anchorDisposeController = initD12SourceDiagrams(anchorDispose.document, anchorDispose.dom.window, anchorDisposeRenderer.api);
await anchorDisposeRenderer.waitForCall(1);
anchorDisposeController.dispose();
anchorDisposeRenderer.releaseHeld();
await anchorDisposeController.whenIdle();
assert.equal(anchorDispose.anchorScrolls.length, 0, 'dispose cancels pending initial anchor correction');
assert.equal(disposeGuardListeners.windowListenerCount(), 0, 'dispose removes every early intent listener');
assert.equal(disposeGuardListeners.rootListenerCount(), 0, 'dispose removes the initial-anchor-settled listener');
assertGuardInactiveAfter(anchorDispose, disposeGuardListeners, 'dispose');

console.log('D12 source diagrams visible-only rendering and fallback passed');
