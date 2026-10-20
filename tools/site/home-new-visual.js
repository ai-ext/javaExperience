import { NEW_SCENES } from './home-new-visual.mjs';
export function initHomeNewVisual(doc = document) {
  const root = doc.querySelector('[data-home-new-visual]');
  if (!root) return;
  const $ = (selector) => root.querySelector(selector);
  const buttons = [...root.querySelectorAll('[data-object-scene]')];
  let current = 0;
  const show = (index) => {
    const scene = NEW_SCENES[index];
    if (!scene) return;
    current = index;
    const image = $('[data-object-image]'); image.src = scene.image; image.alt = scene.alt;
    $('[data-object-open-image]').setAttribute('href', scene.image);
    $('[data-object-count]').textContent = `이 예제의 Greeting 객체 ${scene.count}개`;
    const code = $('[data-object-code]'); code.replaceChildren();
    scene.code.split('\n').forEach((line, lineIndex) => {
      const el = doc.createElement(lineIndex === scene.activeLine ? 'mark' : 'span');
      el.textContent = line + '\n'; code.append(el);
    });
    $('[data-object-caption]').textContent = scene.caption;
    $('[data-object-reference]').textContent = scene.references;
    $('[data-object-empty]').hidden = scene.count !== 0;
    $('[data-object-card]').hidden = scene.count === 0;
    $('[data-object-second]').hidden = scene.count !== 2;
    $('[data-object-position]').textContent = `${index + 1} / ${NEW_SCENES.length}`;
    $('[data-object-previous]').disabled = index === 0;
    $('[data-object-next]').disabled = index === NEW_SCENES.length - 1;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  };
  buttons.forEach((button, index) => button.addEventListener('click', () => show(index)));
  $('[data-object-previous]').addEventListener('click', () => show(current - 1));
  $('[data-object-next]').addEventListener('click', () => show(current + 1));
  root.querySelector('.home-new-stepper').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? NEW_SCENES.length - 1 : Math.min(NEW_SCENES.length - 1, Math.max(0, current + (event.key === 'ArrowRight' ? 1 : -1)));
    event.preventDefault(); show(next); buttons[next].focus();
  });
  show(0);
}
