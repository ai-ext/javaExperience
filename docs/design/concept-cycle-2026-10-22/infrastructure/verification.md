# 하네스 인프라 검증 기록

- RED 실행: `python3 docs/design/concept-cycle-2026-10-22/test-harness.py` — exit 1. 최초에는 `run-harness.py`가 아직 없어 import 단계에서 실패했다. 구현 후 8개 중 7개가 통과했고, 남은 실패는 macOS 임시 경로가 `/private/var/...`로 정규화되는 실제 환경과 테스트 기대값의 차이였다.
- GREEN 실행: `python3 docs/design/concept-cycle-2026-10-22/test-harness.py` — exit 0, 12 tests, OK.
- 별도 CLI 경계 확인: `--task task110`, `--task task25`, `--task task0` 각각 exit 2, npm runner 호출 없이 task 범위/번호 오류를 출력.
- 검증 범위: 허용 argv와 `shell=False`, 저장소 루트 cwd, 성공/실패 exit, 고정 argv 이외 레지스트리 명령 거부, 잘못된 task 및 queued task 거부, 누락 npm script 사전 차단, timeout, launch error, source hash 변경, HEAD 변경, 결과 경로 탈출/symlink 차단, timestamp별 raw 결과 보존, existing24 실패 후 나머지 실행 지속 및 전체 nonzero.
- 기존 npm 테스트 `--task taskN` / `--existing24`는 실행하지 않았다. 이 기록은 fake runner를 사용하는 하네스 단위 테스트만 나타낸다.

## Sol 독립 재현 후 회귀 수정 — 2026-10-22

- 재현 근거: `sol-edge-cases.log`에서 HEAD 미확보가 통과 처리됨, registry source hash가 적용되지 않음, 안정된 HEAD에서 코드 변경을 감지하지 못함, tasks root symlink 외부 쓰기, task1 symlink를 통한 task2 최신 결과 덮어쓰기를 확인했다. `sol-static-checks.log`는 first24의 등록 source hash와 실제 원문 hash가 일치하며 npm 스크립트가 존재한다고 기록한다. Sol 검토는 subprocess fake와 임시 저장소만 사용했고 npm/browser/DB는 실행하지 않았다.
- RED 실행: `python3 -B docs/design/concept-cycle-2026-10-22/test-harness.py -v` — exit 1, 추가 경계 테스트에서 HEAD 미확보 2경우, stale source hash, 코드 변경, tasks root symlink, task 디렉터리 symlink 사례가 실패했다.
- GREEN 실행: `python3 -B docs/design/concept-cycle-2026-10-22/test-harness.py -v` — exit 0, 18 tests, OK. 기존 12개 테스트를 유지하고 6개 경계 테스트를 추가했다.
- 수정: 실행 전 HEAD 미확보 시 검사 시작을 막고 전후 HEAD를 모두 확보해야 성공, registry source SHA-256 사전 대조, `tools/site/`의 `.mjs/.js/.css/.json` manifest 및 집계 hash 전후 대조, fingerprint 미확보 fail-closed, 출력 경로 전체의 symlink 거부.
- 기존 24개 npm 검사는 실행하지 않았다. 커밋하지 않았다.

## Sol 재검토 후 출력 경계 수정 — 2026-10-22

- 재현 근거: `sol-rereview-edge-cases.log`에서 runner가 새 run 폴더를 symlink로 교체하면 외부에 `stdout.log`, `stderr.log`, `result.json`이 생성되고, 예측 가능한 `.harness.json.<pid>.tmp` symlink를 통해 외부 sentinel이 덮어써지는 것을 확인했다.
- RED 실행: `python3 -B docs/design/concept-cycle-2026-10-22/test-harness.py -v` — exit 1, 추가한 run-directory symlink와 PID 임시 파일 symlink 두 회귀가 실패했다.
- GREEN 실행: 같은 명령 — exit 0, 21 tests, OK. 이전 18개는 유지했다. 두 재현 회귀와 raw stdout/stderr/result 항목의 exclusive 생성 확인을 포함한다.
- 수정: runner 실행 후 결과 쓰기 직전에 raw 및 latest 경로의 tasks root containment와 symlink를 재검증한다. raw 파일은 `open("x")`로 새로만 만들고, latest JSON은 `tempfile.mkstemp`가 만든 exclusive 임시 파일로 교체한다.
- 실제 기존 npm 검사와 commit은 수행하지 않았다. 이 변경은 재현된 경로 쓰기 문제를 막으며 npm 스크립트의 OS 수준 샌드박스를 제공한다고 주장하지 않는다.
