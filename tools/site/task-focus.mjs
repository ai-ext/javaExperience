import fs from 'node:fs';
import { renderFirstApiJourney } from './first-api-journey.mjs';
import { renderFirstJavaJourney } from './first-java-journey.mjs';
import { renderAnnotationJourney } from './annotation-journey.mjs';
import { renderRequestPlacesJourney } from './request-places-journey.mjs';
import { renderProfileDtoJourney } from './profile-dto-journey.mjs';
import { renderMemberDebugJourney } from './member-debug-journey.mjs';
import { renderConfigJourney } from './config-journey.mjs';
import { renderFirstDbJourney } from './first-db-journey.mjs';
import { renderFirstTransactionJourney } from './first-transaction-journey.mjs';
import { renderCompletePostMappingJourney } from './complete-post-mapping-journey.mjs';
import { renderValidationJourney } from './validation-journey.mjs';
import { renderTokenAuthorJourney } from './token-author-journey.mjs';
import { renderJwtLoginJourney } from './jwt-login-journey.mjs';
import { renderLikeConcurrencyJourney } from './like-concurrency-journey.mjs';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const guides = Object.assign({}, ...['0-9', '10-16'].map((part) =>
  JSON.parse(fs.readFileSync(new URL(`./task-focus-data-${part}.json`, import.meta.url), 'utf8'))));
const slug = (text) => text.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');

/** 원문과 대조한 단계별 안내만 쓴다. 첫 API 자동 추출은 과제·관찰 경로를 혼동시킨다. */
export function renderTaskFocus(level, source) {
  if (level.id === '0-1') return renderFirstJavaJourney(source);
  if (level.id === '0-2') return renderAnnotationJourney(source);
  if (level.id === '0-3') return renderRequestPlacesJourney(source);
  if (level.id === '0-4') return renderProfileDtoJourney(source);
  if (level.id === '0-5') return renderMemberDebugJourney(source);
  if (level.id === '0-6') return renderConfigJourney(source);
  if (level.id === '1-1') return renderFirstApiJourney();
  if (level.id === '1-2') return renderFirstDbJourney();
  if (level.id === '1-3') return renderFirstTransactionJourney();
  if (level.id === '1-4') return renderCompletePostMappingJourney();
  if (level.id === '1-5') return renderValidationJourney();
  if (level.id === '1-6') return renderTokenAuthorJourney();
  if (level.id === '4-2') return renderLikeConcurrencyJourney(source);
  if (level.id === '10-4') return renderJwtLoginJourney();
  const guide = guides[level.id];
  if (!guide) throw new Error(`${level.id}: 검토된 첫 과제 안내가 없다`);
  const headings = [...source.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  const guideHeading = headings.find((heading) => /^(구현 가이드|따라 치기|구현|코드)(?:\s|$)/.test(heading));
  const target = `#${slug(guideHeading || '만들 것')}`;
  const primaryLabel = guideHeading ? '구현 가이드 열고 시작하기' : '만들 것 확인하고 시작하기';
  const file = guide.file ? `<p class="task-focus-file"><span>열 파일</span><code>${esc(guide.file)}</code></p>` : '';
  return `<section class="task-focus" aria-labelledby="task-focus-title" data-stage="${esc(level.id)}">
    <div class="task-focus-hero">
      <div class="task-focus-work"><p class="task-focus-eyebrow">이번 과제 · ${esc(level.id)}</p>
        <h2 id="task-focus-title">${esc(guide.action)}</h2>
        ${guide.route ? `<code class="task-focus-route">${esc(guide.route)}</code>` : ''}
        ${file}
        <a class="task-focus-primary" href="${target}" data-task-open="true" data-task-start="true">${primaryLabel} <span aria-hidden="true">→</span></a>
      </div>
    </div>
    <details class="task-focus-next"><summary>만든 뒤 보낼 요청·기대 결과 보기</summary>
      <div class="task-focus-after"><div><strong>직접 해볼 일</strong><p>${esc(guide.run)}</p></div><a href="#직접-확인" data-task-open="true">요청 실행 화면 열기 ↗</a></div>
      <aside class="task-focus-expected" aria-label="구현 뒤 비교할 기대 결과">
        <p class="task-focus-eyebrow">확인할 결과 <span>실행 전 기대값</span></p>
        <strong>${esc(guide.result)}</strong>
        <p class="task-focus-boundary">${esc(guide.boundary)}</p>
      </aside>
    </details>
    <details class="task-focus-context"><summary>시작 전 개념과 이번에 배우는 것</summary><p><strong>먼저 익힐 것</strong> ${esc(guide.prerequisite)}</p><p><strong>이번 핵심</strong> ${esc(guide.newConcept)}</p><a href="#만들-것" data-task-open="true">전체 요구사항 보기 →</a></details>
  </section>`.replace(/[ \t]+\n/g, '\n');

}
