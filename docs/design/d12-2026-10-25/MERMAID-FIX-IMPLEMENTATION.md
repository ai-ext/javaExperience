# D12 Mermaid 렌더 시점 수정

## 범위와 원인

- 원문 Markdown의 Mermaid source, proof/raw, 공통 reader/CSS, 다른 문서 초기화는 변경하지 않았다.
- 기존 `build.mjs`는 Mermaid가 있는 모든 페이지에서 `startOnLoad: true`를 사용했다. D12는 reader의 기본 scene에서 원문을 접어 두므로 Mermaid가 폭 0인 숨은 source를 먼저 읽었다. 수정 전 재현에서 scene의 첫 SVG에 `Syntax error in text`가 남았고, 같은 URL의 `?read=1` 대조군은 세 SVG가 오류 없이 생성됐다. D11 같은-width 숨은 source 대조는 오류가 없어 범위를 D12에 한정했다.
- 재현/대조 evidence를 [mermaid-investigation](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/evidence.json)에 보존했다. JSON은 byte-identical copy이며 이미지 source는 JPEG magic·1280×941을 확인한 뒤 JPEG92로 복사했다. `/tmp/d12-browser` 원본은 유지했다.

## 구현

- D12 문서만 Mermaid 11.4.1을 `startOnLoad: false`, dark theme으로 초기화한 뒤 [d12-source-diagrams.mjs](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/d12-source-diagrams.mjs)를 호출한다. 다른 문서는 기존 `startOnLoad: true` 분기를 유지한다.
- helper는 reader가 read mode이고, 원문 경로의 모든 `details`가 열렸으며, source node 실제 layout width가 양수일 때만 Mermaid `run`을 직렬 호출한다.
- 중복 초기화를 막고, 한 node가 처리 중이면 추가 render를 한 번만 예약한다. 숨겨지거나 재전환이 일어나면 in-flight 결과를 버리고 원문 text와 기존 `data-processed` 상태를 복원한 뒤 현재 보이는 상태에서 다시 시도한다. 이미 완료된 SVG는 scene/read 전환에서 재사용한다.
- width 0이지만 layout rect가 존재하는 경우도 render를 막고, resize 뒤 실폭이 양수가 되면 재평가한다.
- Mermaid가 error SVG를 반환하거나 Promise를 reject하면 해당 node의 원문을 복원하고 짧은 오류 안내 “도식을 표시하지 못했습니다. 도식 원문을 확인할 수 있습니다.”를 표시한다. 실패한 source는 계속 보이는 동안 무한 retry하지 않으며, 접었다 다시 열 때 한 번 재시도한다.
- `dispose()`는 queued job을 취소하고 pending success/reject 결과를 버린다. waiter와 retry flag를 완료 상태로 정리하며 이후 error notice나 rendering을 재개하지 않는다.
- Sol Mermaid attempt2에서 지적한 무효 CSS 한 줄을 제거했다. 현재 D12 CSS는 Mermaid 수정 전 candidate snapshot과 byte-identical이다.

## 초기 직접 TOC hash 보정

- CDN Mermaid module을 기다리는 동안 hash가 늦게 선택되는 경우를 막기 위해 D12 전용 classic inline guard가 CDN module보다 먼저 초기 hash(빈 hash 포함)를 저장한다. wheel/touch/pointer, Tab/Shift+Tab, Arrow/PageUp/PageDown/Home/End/space, hashchange/popstate는 초기 보정을 취소한다. 빈 초기 hash 뒤 `history.replaceState`로 hash만 늦게 바뀌어도 helper는 저장한 빈 hash를 유지한다. 일반 `scroll` listener는 두지 않는다.
- helper는 저장한 최초 hash를 사용한다. 최초 visible Mermaid batch가 안정된 뒤 hash/read mode/target 연결·details-open/layout width 조건이 여전히 맞고 수동 이동이 없을 때만 `scrollIntoView({block:'start'})`를 한 번 호출한다. hashchange 없이 current hash가 바뀐 경우도 비교해 취소한다. browser가 먼저 적용한 hash scroll을 그래프 높이 변경 후 보정한다.
- 실제 수정 전 재현은 target top `-602.8359375px`, banner bottom `68px`이었다. 동일 URL의 안정 control은 target top `96.1640625px`, banner bottom `68px`이었다. [19번째 direct-anchor repro observation](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/mermaid-final.json), [stable TOC control](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/mermaid-anchor-stable-control.json), [repro screenshot](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/mermaid-final-source-anchor.jpg)를 보존했다.
- in-memory guard 제거 변이는 빈 초기 hash 뒤 늦게 선택된 hash로 스크롤하는 오류를 재현했다. RED 원출력은 [anchor-guard-cdn-empty-red.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/anchor-guard-cdn-empty-red.json)에 보존했다. JSDOM 검사는 조건과 1회 호출만 확인하며 실제 target 위치는 Chrome 재검수가 필요하다.
- 빈 초기 hash 뒤 input/event 없이 history.replaceState로 target hash를 넣는 test도 포함한다. 이 검사를 먼저 두어 guard가 없으면 1회 자동 이동으로 실패한다. 단독 guard 제거 mutant 출력은 [anchor-empty-history-red.json](LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/mermaid-investigation/anchor-empty-history-red.json)에 보존했다.

## RED/GREEN 및 검증

- RED: `node test-d12-source-diagrams.mjs`에서 수정 전 가짜 global `startOnLoad` 경로가 hidden width=0 source를 거부하는 재현/visible-read 대조가 먼저 통과한 뒤, 새 helper가 없어 `ERR_MODULE_NOT_FOUND`로 실패했다.
- 추가 RED: 생성된 classic guard에서 Tab/Shift+Tab 취소 검사를 넣자 조기 guard 리스너 6개가 정리되지 않아 테스트가 실패했다. helper의 scroll-key 집합에 `Tab`을 추가하고 HTML을 다시 생성한 뒤 통과했다.
- GREEN: `npm run build`, `npm run test:d12`, `npm run test:concept-reader` 통과. fake renderer가 hidden width=0 거부, read-mode rect/width 조건과 resize, initial read, inner-details 열기, duplicate init, 직렬 실행, in-flight hide/빠른 복귀, 완료 SVG 재사용, error SVG/reject fallback, bounded retry, queued/in-flight dispose 후 resolve·reject 완료를 확인한다. 테스트는 생성 HTML에서 classic guard script 본문을 추출해 `window.eval`로 module lexical scope 밖에서 실행하고, 6개 window intent listener와 root settled listener가 초기화·중복 초기화·settled·취소·dispose 후 각각 정리되는지 계측한다. delayed-CDN 취소에는 Tab/Shift+Tab도 포함한다. JSDOM은 실제 브라우저 layout과 CDN Mermaid를 재현하지 않으므로 real Mermaid/Chrome 수용은 메인이 별도로 확인한다.
- 수정 후 실제 D12 Chrome 재현/대조 재검수는 메인 검증 대상으로 남긴다.

## 수정 candidate SHA-256

| 파일 | SHA-256 |
|---|---|
| `tools/site/d12-source-diagrams.mjs` | `26fd0af705ba665cffe04e9f976184f4f081af7fdf94fbe0c84715d6bb2e0d02` |
| `tools/site/test-d12-source-diagrams.mjs` | `2f816de3c289ea60812c451feadc4188a0c1ecf1a0808eda7aead4bed9e2db03` |
| `tools/site/build.mjs` | `b0b09457abb5f1eb0ac0bae6e1070ed900db5e64f31543e57561b51ff9abff8a` |
| `tools/site/package.json` | `48955d431fd72f7d8460ef6812381831284c3a308f9db07bb257c414d707078a` |
| `tools/site/d12-learning.css` | `2c404ea4f548331b5938d66341fb3f7c61b36482c09dc2176b25f7a3af46fff1` |
| `docs/knowledge/D12-linux-terminal-basics.html` | `38d29a1acfe207a058c339b69c53e687d8efab0bc83329118a5dbaa8f7eef0b3` |
