# P09 implementation verification log

Worktree: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night`  
Branch: `docs/concept-learning-night`  
Base task commit: `8c851029`  
Verification recorded: 2026-10-25

## Test-first observation

Before the implementation, `node test-p09-boundaries.mjs` failed at the expected missing lesson contract:

```text
AssertionError [ERR_ASSERTION]: shared-state 질문 등록
    at tools/site/test-p09-boundaries.mjs:18:8
```

During source-fragment development, the contract caught that `sumEmpty` and `sumItems` share one raw source line. Column-bounded fragment ranges were added; the Java source stayed unchanged.

## Final commands

| Command | Result |
|---|---|
| `npm run build` | exit 0; 339 HTML files generated; 0 broken links |
| `npm run test:p09` | exit 0; 22 lessons, 93 current states, historic 84-state set preserved, new 9-state contract passed |
| `npm run test:concept-reader` | exit 0; reader baseline and navigation contracts passed |
| `npm run test:concept-dark` | exit 0; dark-scope and 136-page baseline passed |
| `git diff --check` | exit 0 |

`test-p09-boundaries.mjs` checks all nine lesson states against the generated HTML and bundle, all displayed source fragments against the pinned Java source SHA, the thirteen recorded output lines, exact selected JPEG hashes, per-state UI values/code/emphasis/history, and each normal copy payload against the current displayed code. It also checks clipboard completion races (scene change, A→B→A, topic change, both reverse-resolution orders, rejection and current fallback).

## PC crop correction

The parent review found the `choose-empty` zoom crop clipped the leading `c` at the third card and included part of the shared heading. The selected source JPG was reopened and compared with that capture. All six varargs focus boxes were moved inward to match the actual card content. The new contract pins the six focus rectangles and checks that each rectangle stays within the source image bounds. The JPG and proof inputs remain unchanged.

## Sol mutation findings and follow-up

The first Sol mutation run exposed two surviving mutations: `sum-items` array length `2 → 99` and `sum-array` elements `[4, 6] → [40, 60]`. The earlier contract compared rendered values only with the same lesson data. The contract now compares every row for all nine states with a separate expected-value map. Shared observations map to the recorded initial/afterA/afterB tuples; sum and choose results map to native output; inputs, array contents/length, helper labels, and overload call text have independent expectations. The recheck runner is `quality-mutation-recheck.mjs`; results in `quality-mutation-recheck.json` show both mutations killed by the full-stage value assertion. Its isolated bundles are generated in memory only.

The independently approved Java proof was hash- and output-checked, not recompiled in this implementation run. Actual desktop browser review, inventory refresh and the wider harness remain with the parent task.

The same Sol reviewer approved attempt2 at Spec/Quality PASS, C0/I0/M0 with no open findings. The reviewer independently checked the full expected-value map, both surviving mutations, all seven quality mutants and the updated focus/bounds. See `ui-sol-review.md` and `ui-sol-logs/attempt2/`. Actual PC crop readability remains a separate parent-owned visual gate.
