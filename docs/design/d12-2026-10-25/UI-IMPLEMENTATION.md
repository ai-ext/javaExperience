# D12 Task26 UI 구현 기록

## 범위

- D11의 flat PC learning reader 흐름을 따라 D12 질문 12개와 상태 45개를 렌더링한다.
- 화면 상태는 보관된 관측을 선택해 읽는다. 실험 명령이나 서버·systemd 동작은 실행하지 않는다.
- 기존 D12 Markdown 원문, 기존 generic map, 원문 anchor와 learner 코드는 변경하지 않았다.
- canonical proof 연결은 `selected-proof.json`의 단일 attempt `attempt-0665b1344c5b.json` 및 `linux-output-0665b1344c5b.json`을 따른다. proof.py SHA-256은 `68db36173308d620a1baa12cd2d097c62fca11c3ed59084fda183c302b8c21a9`이다. 원문 SHA-256은 `bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c`이며 `fullDocumentComplete=false`를 유지한다.

## 데이터와 경계

- 각 상태에 관측값, 코드 또는 설명, `codeKind`, `evidenceKind`, 정확한 원문/proof source fragment를 연결한다.
- 실제 Linux Bash 호출은 기록된 `argv[-1]`를 그대로 코드 보기와 복사에 사용한다. 추가 Python probe와 Docker `argv`는 원문 실습 명령과 다른 코드 유형으로 표시한다.
- `LEAD-DESIGN.json`의 설명 문장 45개를 각 상태에 그대로 연결하고 누락·변경을 테스트에서 차단한다.
- 원문 Bash·INI는 미실행으로 구분한다. SSH host/user key, systemd 시작·재읽기·재시작·enable은 설명 모델 또는 원문 예시로만 표시한다.
- `log-sources`와 `memory-available`은 원문 산문으로 표시한다. 산문은 코드 블록에 넣지 않고 산문 복사로 제공하며, available의 회수 가능 cache 설명은 SPEC 보강으로 원문 근거와 구분한다.
- memory 보강 문장의 공식 근거는 [PRIMARY-SOURCES-ADDENDUM.md](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/PRIMARY-SOURCES-ADDENDUM.md)에 연결했다. 원문 D12는 free보다 available을 보라고만 안내한다. cache 등을 고려한다는 정의는 SPEC 보강과 Linux kernel 문서에 귀속하며, 원문에 있던 내용처럼 말하지 않는다.
- TERM ACK 뒤 생존과 release 뒤 반환을 분리한다. KILL은 별도 child의 Python Popen `-9`를 표시하며 cleanup 비교를 주장하지 않는다.
- socket/TCP/HTTP 상태를 구분하고, curl `--fail` 미사용과 503/exit 0을 함께 표시한다. 디스크 값은 컨테이너 `/tmp` tmpfs이며 host APFS로 일반화하지 않는다.
- 컨테이너 주 proof의 PID 1 `python3`와 별도 idle 컨테이너의 PID 1 `sleep`을 분리한다.
- 전체 proof JSON은 학습 화면에 반복 삽입하지 않는다. 핵심 조건·결과는 화면에 표시하고 canonical 원자료는 출처 링크로 연다.
- `selected-proof.json`의 canonical attempt/Linux output 경로, nonce, source/runner SHA-256, embedded `linuxActual`, attempt stdout JSON, 분리 Linux JSON과 selected port/PID anchor를 검증한다. 변이된 port/raw/경로/runner hash는 테스트에서 거부한다.
- Linux kernel 공식 정의를 대조했으며, 실제 `free` 실행이나 호스트 메모리 상태 조회는 하지 않았다.

## UI 동작

- 질문 선택, 상태 버튼, 이전/다음, 좌우·Home·End 키 이동을 제공한다.
- `topic`/`stage` query parameter와 history state를 갱신하고 `read`, 검색 등 다른 query parameter를 보존한다. 재로드 시 같은 질문·상태로 복귀한다.
- 복사는 화면에 표시된 코드/설명만 대상으로 한다. 동일 상태 재선택, A→B→A, 역순 완료에서 오래된 요청의 성공·실패가 새 상태에 반영되지 않도록 generation/request guard를 둔다. Clipboard 거부 시 현재 표시 코드를 선택하는 안내를 제공한다.
- 원문 산문 상태는 일반 문단으로 렌더링하고 산문 복사로 구분한다. 실제 코드 상태는 코드 블록과 코드 복사를 유지한다.
- 원문 링크는 `#d12-original`을 연다. source fragment와 원자료는 접힌 출처 영역에서 연다.
- D12 전용 CSS는 PC dark 영역만 구성하며 mobile breakpoint, light variant, gradient, shadow를 추가하지 않는다. reader의 후속 stylesheet보다 더 높은 D12 전용 selector로 full-width figure와 아래쪽 관측값/코드 2열을 유지한다. 코드 14px, 관측값 17px을 사용한다.

## 이미지

- `selected-images.json`의 `selected` JPG만 해시·byte 수·1672×941을 확인하고 연결한다. 현재 선택이 끝난 이미지에만 사용하며 미선택 상태는 임의 이미지로 대체하지 않는다.
- `FOCUS-DESIGN.json`의 상태별 45개 좌표를 선택한 이미지에 연결했다. main-browser 검수 후 overwrite·directory search/list·container exec focus를 교정했다. 내부 검수 상태는 UI에 표시하지 않는다.
- 선택 이미지 manifest의 selected JPG를 모두 연결하고 파일 해시·byte 수·1672×941을 확인한다. 미선택 draft는 연결하지 않는다.

## 검증과 남은 확인

- Sol attempt3 독립 검토는 명세 PASS, 품질 PASS, C0/I0/M0이다. [attempt3 보고서](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/ui-sol-review-attempt3.md)를 보존한다. attempt1/2 실패 보고서와 candidate snapshot도 변경하지 않았다.
- Sol attempt2 Q1은 45상태 source label/href/heading/body의 독립 파일 범위 대조로, Q2는 stale rejection의 A→B→A·동일 A 무효화, newer reject 뒤 older resolve, visible prose fallback `Range` 검사로 닫았다. 최초 Sol 실패 보고와 candidate-source snapshot은 수정하지 않았다.
- `pipefail` 상태의 “mutant 제거” 행은 기본 학습값에서 뺐다. raw proof 원문과 assertion은 변경하지 않았다. 메인이 수정한 `overwrite-output` focus 좌표 `[2,62,96,27]`을 그대로 불러온다.
- `cd tools/site && npm run test:d12` 통과. 테스트는 12/45 식별자/lead, canonical attempt/raw 결속과 port·runner/path mutant, 독립 상태값, source range와 실제 Bash argv, 원문 산문·모델·미실행 유형, 누락 상태/이미지/focus·설명 모델 승격 mutant, 전체 상태 표시·복사·확대, query 보존·재로드, 키보드, clipboard race/fallback을 확인한다.
- `npm run test:concept-reader` 통과. 공통 reader의 134개 원문·코드·ID·Markdown baseline 및 history/hash/catalog 계약을 확인한다.
- 생성 HTML에서 D12 bundle과 공통 `knowledge-reader.js`를 함께 실행해 45 상태, 16 이미지 URL, query/read 전환, 원문·generic map 보존을 확인한다.
- `node --check`로 D12 renderer/controller/data와 `build.mjs` 구문을 확인했다.
- 최종 `npm run build` 통과. docs/scenario HTML 301개 중 사전·사후 SHA-256 변경은 [D12 페이지](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/D12-linux-terminal-basics.html) 1개뿐이고, 생성/삭제 파일은 없다.
- 메인 실제 PC 검수는 45상태 × normal/zoom 90개 캡처와 45행 matrix로 확인했다. matrix overflow는 0이며, 메인이 교정한 overwrite·known path·directory list·container exec zoom도 현재 FOCUS 좌표에 반영되어 있다. [main-browser matrix](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-browser/matrix-final.json)와 [캡처 manifest](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/main-browser/captures.json)를 참조한다.

## 후보 SHA-256

2026-10-25 현재 candidate fingerprint:

| 파일 | SHA-256 |
|---|---|
| `tools/site/d12-learning.js` | `db4c371cbe8f36dea306bfae3e34dcc56787f20895b72ab360e8cc929bc91b70` |
| `tools/site/d12-learning.mjs` | `162f23c3443bc43d2d45115bfd5d07885102d4fc0e6791a4f1b8cca1adc3d782` |
| `tools/site/d12-lesson-data.mjs` | `42aae3b2ea48f31a8c502a36b3921d7731db300881f9ffa32a5f38fd2bb76518` |
| `tools/site/d12-learning.css` | `2c404ea4f548331b5938d66341fb3f7c61b36482c09dc2176b25f7a3af46fff1` |
| `tools/site/test-d12-learning.mjs` | `e35e2db2b40427f0711eb7dd0478ba6dee7314b4fe94714ae97301d3c178f391` |
| `tools/site/test-d12-generated.mjs` | `5cbd45c91ece563361d9657e6ccb3a6324b5f671f760f9bfca96b6493e5501bc` |
| `tools/site/d12-learning.bundle.js` | `ff5042d5958cfade898c41a63f3265af8e3eb81c1db2a729114d79c5cb1527b7` |
| `docs/knowledge/D12-linux-terminal-basics.html` | `692d5ef27d6f5b20bd0462179772abbcf83c02deb4cfd14d7489913004b4543d` |
| `docs/design/d12-2026-10-25/selected-proof.json` | `74a9b801ea3cb176e3873efc5625c61a191f083d17956db2e8deb29c62690da9` |
| `docs/design/d12-2026-10-25/selected-images.json` | `7147e84659b0f8ad69e1c62f6bf59cb9780b2a5d379db79da172cfe69df282d5` |
| `docs/design/d12-2026-10-25/FOCUS-DESIGN.json` | `f69ef53da85b0a0e9262e675ec28fdb705bb85ed22d57ec063f74fe6ca58ee1b` |
| `docs/design/d12-2026-10-25/LEAD-DESIGN.json` | `dd14cc735bb8f16ba5f50a27aee67a4c3ee0133eade517edc5737d0db6c4aaec` |
| `docs/design/d12-2026-10-25/PRIMARY-SOURCES-ADDENDUM.md` | `b18ae69682847653dcd08077132951205c923360d7288e951a738e9c6ae2cb9a` |
