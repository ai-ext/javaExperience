document.querySelectorAll('a[data-task-open="true"]').forEach((link) => {
  link.addEventListener('click', () => {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target) return;
    const scene = target.closest('details.lesson-scene');
    if (scene) scene.open = true;
    if (link.hasAttribute('data-task-start') && scene) {
      const firstCode = [...scene.querySelectorAll('details')].find((item) => /Controller|코드|구현/.test(item.querySelector('summary')?.textContent || ''));
      if (firstCode) firstCode.open = true;
    }
  });
});

function revealHashTarget() {
  if (!location.hash) return;
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!target) return;
  for (let parent = target.parentElement; parent; parent = parent.parentElement) {
    if (parent.tagName === 'DETAILS') parent.open = true;
  }
}
window.addEventListener('hashchange', revealHashTarget);
revealHashTarget();

document.querySelectorAll('.first-api-journey').forEach((journey) => {
  const scenario = journey.querySelector('[data-journey-screen="scenario"]');
  const build = journey.querySelector('[data-journey-screen="build"]');
  const run = journey.querySelector('[data-journey-screen="run"]');
  const request = document.getElementById('browser-request-1-1');
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  if (request && serverUrl) {
    journey.querySelector('[data-journey-server-slot]').append(serverUrl);
    journey.querySelector('[data-journey-request-slot]').append(request);
    const observedStatus = journey.querySelector('[data-journey-observed-status]');
    const observedBody = journey.querySelector('[data-journey-observed-body]');
    const updateObserved = () => {
      const response = request.querySelector('.request-response');
      const status = request.querySelector('.request-status');
      observedStatus.textContent = response.hidden
        ? (status.textContent.trim() || '아직 실행하지 않았어요')
        : response.querySelector('.response-status').textContent.trim();
      observedBody.textContent = response.hidden ? '' : response.querySelector('.response-body').textContent;
    };
    new MutationObserver(updateObserved).observe(request, { childList: true, subtree: true, attributes: true, characterData: true });
    updateObserved();
  }
  const show = (stage) => {
    const isRun = stage === 'run';
    const isScenario = stage === 'scenario';
    scenario.hidden = !isScenario;
    build.hidden = isRun || isScenario;
    run.hidden = !isRun;
    journey.dataset.journey = isRun ? 'run' : isScenario ? 'scenario' : 'build';
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-journey-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.journeyGo)));
  const revealRequest = () => { if (location.hash === '#browser-request-1-1') show('run'); };
  window.addEventListener('hashchange', revealRequest);
  revealRequest();
});
