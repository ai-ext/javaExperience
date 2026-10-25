# D12 Collector 및 task registry 연결

## 변경

- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/inventory-visual-work.mjs`에 `D12_LESSONS` import와 D12 source의 `d12_learning_state` 수집 항목을 추가했다. D11 import와 기존 수집 항목은 유지했다.
- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks.json`의 `task26.harnessCommand`만 `npm --prefix tools/site run test:d12`로 등록했다.
- task26의 `historicalStatus`는 `queued`로 유지했다. 실제 `status`는 변경 전부터 `waiting_existing24_audit`였고 그대로 보존했다. task26 외 133개 task는 깊은 비교에서 변경되지 않았다.
- 변경 전 registry 백업: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/registry-before-task26.json`
  - 백업 SHA-256: `2d361146f3e7826f2dc3351be187bda0faa1c5635f0c1b8bf0459764eaf09f39`

## 검증

- `node --check tools/site/inventory-visual-work.mjs` 통과.
- `tools/site/package.json`의 `test:d12`가 `node test-d12-learning.mjs && node test-d12-generated.mjs`를 가리키는 것을 확인했다.
- 변경 전후 registry를 task 단위로 비교했다. 총 134개 중 task26을 제외한 133개는 깊은 비교가 같고, task26은 `harnessCommand`만 변경됐다.
- `docs/design/concept-cycle-2026-10-22/infrastructure/audit-baseline.json`에 기록된 기존 24개 `review.json` SHA-256과 현재 파일을 대조해 모두 일치했다.
- 요청에 따라 inventory collector는 실제 실행하지 않았다. `run-harness.py`와 기존 inventory/parity 장부, main summary, 원문, AGENTS 및 RESUME 파일도 수정하지 않았다.

## 범위

실제 collector 결과 생성, task harness 실행, PC 및 독립 검수는 이 연결 작업의 범위가 아니며 실행하지 않았다. 따라서 task26 상태는 그대로 유지한다.
