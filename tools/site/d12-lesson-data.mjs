import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// 모든 실측은 검수된 attempt 하나와 그 실행에서 분리 보존한 Linux 원출력에서 읽는다.
export const d12AssetRoot = '../design/d12-2026-10-25/';
const repo = new URL('../../', import.meta.url);
const readText = path => readFileSync(new URL(path, repo), 'utf8');
const proofPath = 'docs/design/d12-2026-10-25/source-proof/proof.py';
const dockerPath = 'docs/design/d12-2026-10-25/source-proof/run_proof.py';
const sourcePath = 'docs/knowledge/D12-linux-terminal-basics.md';
const specPath = 'docs/design/d12-2026-10-25/SPEC.md';
const selectedProofPath = 'docs/design/d12-2026-10-25/selected-proof.json';
const selectedProof = JSON.parse(readText(selectedProofPath));
const proofRawPath = 'docs/design/d12-2026-10-25/proof-logs/attempt-0665b1344c5b.json';
const linuxRawPath = 'docs/design/d12-2026-10-25/proof-logs/linux-output-0665b1344c5b.json';
const proofRaw = JSON.parse(readText(proofRawPath));
const linuxRaw = JSON.parse(readText(linuxRawPath));
const expectedSha = '68db36173308d620a1baa12cd2d097c62fca11c3ed59084fda183c302b8c21a9';
const expectedRunnerSha = 'e2a87cc5aeffebc4b39b53d1db5e8b8c26c7cbf2be6829e427a6e19f17f682ac';
const expectedDocumentSha = 'bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c';
const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
const stableJson = value => JSON.stringify(stableValue(value));

export function validateD12CanonicalProof(
  meta = selectedProof,
  raw = proofRaw,
  separateLinux = linuxRaw,
  proofSource = readText(proofPath),
  runnerSource = readText(dockerPath),
  documentSource = readText(sourcePath),
) {
  if (meta.canonicalAttempt !== proofRawPath || meta.linuxOutput !== linuxRawPath) {
    throw new Error('D12 selected proof path does not match the fixed canonical attempt and Linux output.');
  }
  if (meta.reviewStatus !== 'spec PASS / quality PASS / C0 I0 M0 after bounded documentation addendum'
    || meta.fullDocumentComplete !== false || raw.nonce !== '0665b1344c5b'
    || meta.sourceSha256?.proof !== expectedSha || raw.sourceSha256?.['proof.py'] !== expectedSha
    || createHash('sha256').update(proofSource).digest('hex') !== expectedSha) {
    throw new Error('D12 canonical proof.py identity or SHA-256 mismatch.');
  }
  if (meta.sourceSha256?.runner !== expectedRunnerSha || raw.sourceSha256?.['run_proof.py'] !== expectedRunnerSha
    || createHash('sha256').update(runnerSource).digest('hex') !== expectedRunnerSha) {
    throw new Error('D12 canonical runner SHA-256 mismatch.');
  }
  if (meta.sourceSha256?.document !== expectedDocumentSha || raw.sourceSha256?.['D12-linux-terminal-basics.md'] !== expectedDocumentSha
    || createHash('sha256').update(documentSource).digest('hex') !== expectedDocumentSha) {
    throw new Error('D12 canonical proof does not match the original lesson source.');
  }
  let fixtureOutput;
  try { fixtureOutput = JSON.parse(raw.linuxFixtureOutput?.stdout || ''); }
  catch { throw new Error('D12 canonical attempt stdout is not valid Linux fixture JSON.'); }
  if (raw.linuxFixtureOutput?.exit !== 0
    || stableJson(raw.linuxActual) !== stableJson(separateLinux)
    || stableJson(fixtureOutput) !== stableJson(separateLinux)
    || stableJson(raw.linuxCommandArgv) !== stableJson(raw.linuxFixtureOutput.argv)) {
    throw new Error('D12 separated Linux output does not match canonical attempt evidence.');
  }
  const canonicalCases = Object.fromEntries(separateLinux.cases.map(item => [item.case, item]));
  const signals = canonicalCases.signals?.observations;
  const network = canonicalCases.network_readiness?.observations;
  const idle = raw.idleContainer;
  const execPid = Number(idle?.execProcess?.stdout?.match(/exec_pid=(\d+)/)?.[1]);
  if (signals?.pid !== meta.imageValues?.termPid || signals?.kill_kill?.pid !== meta.imageValues?.killPid
    || network?.ephemeral_port !== meta.imageValues?.loopbackPort || idle?.pid1Comm?.stdout?.trim() !== meta.imageValues?.idlePid1
    || execPid !== meta.imageValues?.idleExecPid) {
    throw new Error('D12 canonical native observations differ from selected proof anchors.');
  }
  return true;
}
validateD12CanonicalProof();
const caseData = Object.fromEntries(linuxRaw.cases.map(item => [item.case, item]));
const proofCase = name => caseData[name] || (() => { throw new Error(`Canonical D12 case not found: ${name}`); })();
const obs = name => proofCase(name).observations;
const excerpt = (path, start, end) => {
  const content = readText(path).replace(/\r\n/g, '\n').split('\n').slice(start - 1, end).join('\n');
  if (!content || content.split('\n').length !== end - start + 1) throw new Error(`D12 source range unavailable: ${path}:${start}-${end}`);
  return { path, start, end, content };
};
const fragment = (path, start, end) => [excerpt(path, start, end)];
const command = record => record.argv.at(-1);
const actualBash = (id, title, values, record, range, extra = {}) => ({
  id, title, values, code: command(record), codeKind: 'additional-linux-bash',
  evidenceKind: '실제 Linux · Bash 실제 관측', sourceFragments: fragment(proofPath, ...range),
  evidence: `실제 Bash argv[-1] · exit ${record.exit} · stdout/stderr는 원출력 상세에서 분리 확인`,
  evidencePath: linuxRawPath, ...extra,
});
const actualCode = (id, title, values, code, path, range, rawCase, evidenceKind = '실제 Linux 격리 fixture 관측', extra = {}) => ({
  id, title, values, code, codeKind: 'additional-linux-python', evidenceKind,
  sourceFragments: fragment(path, ...range), evidence: proofCase(rawCase).condition
    ? `조건: ${JSON.stringify(proofCase(rawCase).condition)}` : 'canonical Linux fixture의 실제 관측값',
  evidencePath: linuxRawPath, ...extra,
});
const modelStage = (id, title, values, text, range, note, extra = {}, path = sourcePath) => ({
  id, title, values, code: text, codeKind: 'explanatory-model', evidenceKind: '설명 모델 · 명령 실행 결과 아님',
  sourceFragments: fragment(path, ...range), evidence: note, ...extra,
});
const attach = (topic, id, details) => {
  const target = D12_LESSONS.find(item => item.id === topic)?.stages.find(item => item.id === id);
  if (!target) throw new Error(`D12 state not found: ${topic}/${id}`);
  Object.assign(target, details);
};
const imageManifestPath = 'docs/design/d12-2026-10-25/selected-images.json';
const imageManifest = JSON.parse(readText(imageManifestPath));
const imageAlt = {
  'redirect-order': 'stdout과 stderr 리다이렉션 순서에 따른 파일과 부모 출력 비교',
  'shell-boundary': '터미널 창과 Bash, 현재 쉘의 작업 위치 변화',
  'append-overwrite': '>> 추가와 > 덮어쓰기 뒤 파일 내용 비교',
  'pipeline-status': '기본 파이프와 pipefail의 exit 및 PIPESTATUS 비교',
  'environment-path': 'export 전후 자식 변수와 PATH 실행 파일 선택 비교',
  'file-permissions': '0640 파일의 소유자·그룹·기타 읽기와 쓰기 결과',
  'directory-permissions-v2': '디렉터리 탐색·이름 목록·파일 항목 삭제 권한 비교',
  'socket-http': 'loopback LISTEN, TCP 연결, HTTP warming과 ready 응답 비교',
  'ssh-transfer': '서버 키 확인과 사용자 키 인증 모델, 로컬 rsync dry-run',
  'signal-lifecycle-v2': 'TERM 응답 뒤 생존·release와 별도 KILL 결과',
  'systemd-start': 'Type=exec 시작 확인과 HTTP 준비 상태 구분',
  'unit-application': '파일 정의·관리자 보유 정의·프로세스·부팅 등록 모델',
  'disk-unlink': '열린 파일을 지운 뒤 df·du·파일시스템 여유 비교',
  'container-observation': 'idle 컨테이너 PID 1, docker exec 추가 프로세스, 로그',
  'log-sources': 'systemd journal과 일반 텍스트 파일 로그 구분',
  'memory-available-v2': '메모리 available과 파일시스템 용량 범위 구분',
};
const focusDesignPath = 'docs/design/d12-2026-10-25/FOCUS-DESIGN.json';
const focusDesign = JSON.parse(readText(focusDesignPath));
const leadDesignPath = 'docs/design/d12-2026-10-25/LEAD-DESIGN.json';
const leadDesign = JSON.parse(readText(leadDesignPath));
const expectedFocusIds = [
  'terminal-shell','cd-builtin','stdout-first','stderr-first','append-output','overwrite-output','default-pipeline','pipefail-pipeline',
  'variable-local','variable-exported','path-first','path-second','mode-owner','mode-group','mode-other','parent-no-search','known-path-search',
  'directory-no-list','directory-unlink','term-ack-alive','term-released','kill-observed','socket-listen','tcp-connected','http-warming','http-ready',
  'ssh-host-key','ssh-user-key','rsync-dry-run','unit-context','exec-boundary','network-ordering','unit-edited','daemon-reloaded','process-restarted',
  'boot-enabled','enable-now','log-sources','disk-written','disk-unlinked-open','disk-closed','memory-available','container-pid1','container-exec','container-logs',
];
if (Object.keys(focusDesign.states || {}).length !== 45 || expectedFocusIds.some(id => !focusDesign.states[id])) {
  throw new Error('D12 focus design must cover all 45 states.');
}
if (Object.keys(leadDesign.states || {}).length !== 45 || expectedFocusIds.some(id => !leadDesign.states[id]?.trim())) {
  throw new Error('D12 lead design must provide learning copy for all 45 states.');
}
for (const [id, rect] of Object.entries(focusDesign.states)) {
  if (!Array.isArray(rect) || rect.length !== 4 || rect.some(value => !Number.isFinite(value))
    || rect[0] < 0 || rect[1] < 0 || rect[2] <= 0 || rect[3] <= 0 || rect[0] + rect[2] > 100 || rect[1] + rect[3] > 100) {
    throw new Error(`D12 focus rectangle is invalid: ${id}`);
  }
}
export const D12_ASSETS = Object.fromEntries(imageManifest.filter(item => item.status === 'selected').map(item => {
  const designPrefix = 'docs/design/d12-2026-10-25/';
  if (!item.destination.startsWith(designPrefix)) throw new Error(`D12 image destination is outside the design directory: ${item.id}`);
  const file = item.destination.slice(designPrefix.length);
  const bytes = readFileSync(new URL(`../../${item.destination}`, import.meta.url));
  if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256
    || item.format !== 'JPEG92' || item.canvas.width !== 1672 || item.canvas.height !== 941) {
    throw new Error(`D12 selected image manifest mismatch: ${item.id}`);
  }
  return [item.id, {
    file, width: item.canvas.width, height: item.canvas.height, sha256: item.sha256,
    alt: imageAlt[item.id] || '선택한 D12 학습 상태와 연결된 그림', focus: {},
  }];
}));

const lesson = (id, question, source, states) => ({
  id,
  question,
  source,
  note: '각 상태의 출력·관측값과 근거 유형을 함께 읽습니다.',
  stages: states.map(([stateId, title]) => ({ id: stateId, title })),
});

export const D12_LESSONS = [
  lesson('shell-boundary', '터미널 창과 Bash는 어떻게 다른가요?', '원문 §3.1 · 실습 A · Q1', [
    ['terminal-shell', '터미널과 쉘 · 설명 모델'],
    ['cd-builtin', 'cd builtin · 현재 쉘 작업 위치 변경 관측'],
  ]),
  lesson('redirect-order', '순서만 바꿨는데 오류 출력은 어디로 갔나요?', '원문 §3.1 · Q2', [
    ['stdout-first', 'stdout 먼저 연결'],
    ['stderr-first', 'stderr 먼저 연결'],
    ['append-output', '파일 끝에 추가'],
    ['overwrite-output', '기존 파일 덮어쓰기'],
  ]),
  lesson('pipeline-status', '앞 명령이 실패했는데 왜 파이프는 0인가요?', '원문 §3.1 · Q2', [
    ['default-pipeline', '기본 파이프 상태'],
    ['pipefail-pipeline', 'pipefail 상태'],
  ]),
  lesson('environment-path', '자식이 받는 변수와 실행 파일은 어떻게 정해지나요?', '원문 §3.1 · 실습 A', [
    ['variable-local', 'export 전 쉘 변수'],
    ['variable-exported', 'export 후 자식 변수'],
    ['path-first', 'PATH에서 첫 경로 선택'],
    ['path-second', 'PATH 순서를 바꾼 선택'],
  ]),
  lesson('file-directory-permissions', '파일 rwx와 디렉터리 x는 무엇을 허용하나요?', '원문 §3.2 · 실습 B · Q3', [
    ['mode-owner', '파일 소유자 권한'],
    ['mode-group', '같은 그룹 권한'],
    ['mode-other', '기타 사용자 권한'],
    ['parent-no-search', '상위 디렉터리 탐색 거절'],
    ['known-path-search', '알려진 이름 경로 탐색'],
    ['directory-no-list', '디렉터리 이름 목록 거절'],
    ['directory-unlink', '쓰기 없는 파일의 디렉터리 항목 삭제'],
  ]),
  lesson('signal-lifecycle', 'TERM 요청을 보냈으면 종료한 걸까요?', '원문 §3.2 · 실습 B · Q4', [
    ['term-ack-alive', 'TERM 승인 응답 후 생존'],
    ['term-released', '같은 자식의 해제 후 종료'],
    ['kill-observed', '별도 자식에 보낸 KILL 관측'],
  ]),
  lesson('socket-http', '포트가 열리면 HTTP도 준비됐나요?', '원문 §3.2 · §3.4 · Q6', [
    ['socket-listen', '로컬 LISTEN 소켓'],
    ['tcp-connected', 'TCP 연결 성공'],
    ['http-warming', 'HTTP 503 warming 응답'],
    ['http-ready', 'HTTP 200 ready 응답'],
  ]),
  lesson('ssh-transfer', 'SSH의 서버 확인과 사용자 인증은 같은가요?', '원문 §3.3 · 실습 D · Q8', [
    ['ssh-host-key', 'SSH 서버 host key · 설명 모델'],
    ['ssh-user-key', '사용자 공개키 인증 · 설명 모델'],
    ['rsync-dry-run', 'rsync 로컬 dry-run · 추가 Linux 실측'],
  ]),
  lesson('systemd-start', 'Type=exec가 확인하는 시작은 어디까지인가요?', '원문 §3.3 · unit · Q6', [
    ['unit-context', '원문 unit 조건 · 미실행'],
    ['exec-boundary', 'exec와 HTTP 준비 경계 · 설명 모델'],
    ['network-ordering', 'After=network.target · 원문 모델'],
  ]),
  lesson('unit-application', 'unit 편집·재읽기·재시작·자동 등록은 어떻게 다른가요?', '원문 실습 D · Q5', [
    ['unit-edited', '파일 정의 편집'],
    ['daemon-reloaded', '관리자 정의 재읽기'],
    ['process-restarted', '프로세스 재시작 · 조건부 모델'],
    ['boot-enabled', '부팅 자동 등록'],
    ['enable-now', '자동 등록과 즉시 시작 요청'],
  ]),
  lesson('logs-disk', '경로를 지웠는데 왜 파일시스템 공간은 그대로인가요?', '원문 §3.4 · 실습 C · Q7', [
    ['log-sources', 'journal과 텍스트 파일 로그'],
    ['disk-written', '파일 기록 뒤 df와 du'],
    ['disk-unlinked-open', '열린 파일 경로 삭제 뒤 관측'],
    ['disk-closed', '파일 닫은 뒤 파일시스템 관측'],
    ['memory-available', 'free -h available · 원문 설명'],
  ]),
  lesson('container-observation', '컨테이너 안에서는 어떤 프로세스와 로그를 보나요?', '원문 실습 C · Q8', [
    ['container-pid1', 'idle 컨테이너 PID 1'],
    ['container-exec', 'exec 추가 프로세스'],
    ['container-logs', '합성 컨테이너 로그'],
  ]),
];

attach('shell-boundary', 'terminal-shell', modelStage('terminal-shell', '터미널·쉘·프롬프트를 구분', [
  ['터미널', '문자 입출력 창'], ['Bash', '명령을 해석·실행하는 쉘'], ['프롬프트 모양', 'uid 증명 아님'],
], '터미널 = 문자 입출력 창\nBash = 명령 해석·실행기\n프롬프트 모양 ≠ uid 증명', [21, 21], '설명 모델이며 실제 터미널 emulator 실행 결과가 아닙니다.', {}, specPath));
attach('shell-boundary', 'cd-builtin', actualBash('cd-builtin', 'cd는 현재 쉘의 작업 위치를 바꿉니다', [
  ['처음 pwd', '/proof'], ['type cd', 'cd is a shell builtin'], ['cd /tmp 뒤 pwd', '/tmp'], ['exit', '0'],
], obs('environment_path_cd').cd_builtin, [92, 110], { note: 'Linux 컨테이너의 Bash 실제 관측입니다. 터미널 emulator 자체를 Linux에서 실행했다는 뜻은 아닙니다.' }));

const streams = obs('streams');
attach('redirect-order', 'stdout-first', actualBash('stdout-first', 'stdout을 파일에 먼저 연결', [
  ['실제 argv[-1]', command(streams.redirect_stdout_then_stderr)], ['파일 a.log', streams.a_bytes], ['부모 stdout', JSON.stringify(streams.redirect_stdout_then_stderr.stdout)], ['부모 stderr', JSON.stringify(streams.redirect_stdout_then_stderr.stderr)], ['exit', String(streams.redirect_stdout_then_stderr.exit)],
], streams.redirect_stdout_then_stderr, [57, 89], { note: 'producer 전체에 `> a.log 2>&1`이 적용되었습니다. 초기 stale 파일 내용은 덮어써졌습니다.' }));
attach('redirect-order', 'stderr-first', actualBash('stderr-first', 'stderr를 이전 stdout 대상으로 먼저 연결', [
  ['실제 argv[-1]', command(streams.redirect_stderr_then_stdout)], ['파일 b.log', streams.b_bytes], ['부모 stdout', JSON.stringify(streams.redirect_stderr_then_stdout.stdout)], ['부모 stderr', JSON.stringify(streams.redirect_stderr_then_stdout.stderr)], ['exit', String(streams.redirect_stderr_then_stdout.exit)],
], streams.redirect_stderr_then_stdout, [57, 89], { note: '`2>&1` 시점의 stdout은 아직 부모 stdout입니다. 그 뒤 stdout만 b.log로 이동합니다.' }));
attach('redirect-order', 'append-output', actualBash('append-output', '>>가 기존 파일 뒤에 내용을 추가', [
  ['실제 argv[-1]', command(streams.append)], ['append 전 a.log', streams.a_bytes], ['append 후 a.log', streams.a_after_append], ['exit', String(streams.append.exit)],
], streams.append, [70, 73], { note: 'a.log의 앞부분과 append 뒤 결과를 구분합니다. 기존 파일을 삭제하지 않았습니다.' }));
attach('redirect-order', 'overwrite-output', actualBash('overwrite-output', '>가 기존 파일 내용을 교체', [
  ['실제 argv[-1]', command(streams.overwrite)], ['덮어쓰기 전 b.log', streams.b_bytes], ['덮어쓰기 후 b.log', streams.b_after_overwrite], ['exit', String(streams.overwrite.exit)],
], streams.overwrite, [70, 73], { note: '실습 fixture의 b.log만 덮어썼습니다.' }));

attach('pipeline-status', 'default-pipeline', actualBash('default-pipeline', '기본 파이프는 마지막 명령 상태를 반환', [
  ['명령 전체 exit', String(streams.pipeline_default.exit)], ['producer exit', '7'], ['cat exit', '0'], ['캡처된 stdout', streams.pipeline_default.stdout], ['stderr', streams.pipeline_default.stderr],
], streams.pipeline_default, [74, 89], { note: 'STATUS와 PIPESTATUS를 같은 Bash 실행 안에서 함께 캡처한 출력입니다.' }));
attach('pipeline-status', 'pipefail-pipeline', actualBash('pipefail-pipeline', 'pipefail은 오른쪽에서 가장 마지막 nonzero 상태를 반환', [
  ['명령 전체 exit', String(streams.pipeline_pipefail.exit)], ['PIPESTATUS', '7 0'], ['캡처된 stdout', streams.pipeline_pipefail.stdout], ['stderr', streams.pipeline_pipefail.stderr],
], streams.pipeline_pipefail, [74, 89], { note: '이 실행의 결과는 producer 7, cat 0, 전체 7입니다. 첫 배열 값 선택 규칙으로 일반화하지 않습니다.' }));

const envPath = obs('environment_path_cd');
attach('environment-path', 'variable-local', actualBash('variable-local', 'export 전 변수는 자식 Bash에 전달되지 않음', [
  ['부모 shell 변수', 'DEMO_ONLY=synthetic'], ['자식 출력', envPath.unexported_child.stdout.trim()], ['exit', String(envPath.unexported_child.exit)], ['실험 환경', JSON.stringify(envPath.controlled_environment)],
], envPath.unexported_child, [92, 110], { note: 'DEMO_ONLY는 synthetic fixture 값이며 host 환경 변수를 조회하지 않았습니다.' }));
attach('environment-path', 'variable-exported', actualBash('variable-exported', 'export 뒤에는 자식 Bash가 변수를 받음', [
  ['부모 export', 'DEMO_ONLY=synthetic'], ['자식 출력', envPath.exported_child.stdout.trim()], ['exit', String(envPath.exported_child.exit)], ['실험 환경', JSON.stringify(envPath.controlled_environment)],
], envPath.exported_child, [92, 110], { note: '깨끗한 합성 환경에서 자식 프로세스의 값을 비교했습니다. JAVA_HOME이나 host 환경은 측정하지 않았습니다.' }));
attach('environment-path', 'path-first', actualBash('path-first', 'PATH에서 먼저 나오는 demo 선택', [
  ['command -v demo', envPath.path_first_then_second.stdout.split('\n')[0]], ['demo 출력', envPath.path_first_then_second.stdout.split('\n')[1]], ['실제 PATH 순서', '/tmp/d12-proof/path-first:/tmp/d12-proof/path-second'], ['exit', String(envPath.path_first_then_second.exit)],
], envPath.path_first_then_second, [92, 110], { note: '합성 실행 파일 두 개를 둔 격리된 PATH 비교입니다.' }));
attach('environment-path', 'path-second', actualBash('path-second', 'PATH 순서를 뒤집으면 다른 demo 선택', [
  ['command -v demo', envPath.path_second_then_first.stdout.split('\n')[0]], ['demo 출력', envPath.path_second_then_first.stdout.split('\n')[1]], ['실제 PATH 순서', '/tmp/d12-proof/path-second:/tmp/d12-proof/path-first'], ['exit', String(envPath.path_second_then_first.exit)],
], envPath.path_second_then_first, [92, 110], { note: 'PATH에서 먼저 발견된 합성 파일을 실행했습니다. JAVA_HOME은 별도 설정입니다.' }));

const permissions = obs('permissions');
const probe = record => JSON.parse(record.stdout);
const permissionProbe = (id, title, probeRecord, keys, note) => actualCode(id, title, keys, probeRecord.argv[2], proofPath, [117, 123], 'permissions', '실제 Linux Python 권한 probe', { codeKind: 'additional-linux-python-probe', note });
attach('file-directory-permissions', 'mode-owner', permissionProbe('mode-owner', '640 파일의 소유자는 읽고 쓸 수 있음', permissions['640_matrix'].owner_uid1000_gid2000, [
  ['mode', permissions.file_stat.mode], ['소유 UID:GID', `${permissions.file_stat.uid}:${permissions.file_stat.gid}`], ['관측 UID:GID:groups', `${probe(permissions['640_matrix'].owner_uid1000_gid2000).uid}:${probe(permissions['640_matrix'].owner_uid1000_gid2000).gid}:${JSON.stringify(probe(permissions['640_matrix'].owner_uid1000_gid2000).groups)}`], ['read', String(probe(permissions['640_matrix'].owner_uid1000_gid2000).checks.read.ok)], ['write', String(probe(permissions['640_matrix'].owner_uid1000_gid2000).checks.write.ok)],
], '유효한 소유자 UID 1000, GID 2000의 Linux probe입니다.'));
attach('file-directory-permissions', 'mode-group', permissionProbe('mode-group', '같은 그룹은 읽지만 파일을 쓸 수 없음', permissions['640_matrix'].group_uid1001_gid2000, [
  ['mode', permissions.file_stat.mode], ['관측 UID:GID:groups', `${probe(permissions['640_matrix'].group_uid1001_gid2000).uid}:${probe(permissions['640_matrix'].group_uid1001_gid2000).gid}:${JSON.stringify(probe(permissions['640_matrix'].group_uid1001_gid2000).groups)}`], ['read', String(probe(permissions['640_matrix'].group_uid1001_gid2000).checks.read.ok)], ['write', `거절 · errno ${probe(permissions['640_matrix'].group_uid1001_gid2000).checks.write.errno}`],
], '보조 그룹은 비어 있고 기본 GID만 2000인 probe입니다.'));
attach('file-directory-permissions', 'mode-other', permissionProbe('mode-other', '기타 사용자는 읽기와 쓰기가 모두 거절됨', permissions['640_matrix'].other_uid1002_gid3000, [
  ['mode', permissions.file_stat.mode], ['관측 UID:GID:groups', `${probe(permissions['640_matrix'].other_uid1002_gid3000).uid}:${probe(permissions['640_matrix'].other_uid1002_gid3000).gid}:${JSON.stringify(probe(permissions['640_matrix'].other_uid1002_gid3000).groups)}`], ['read', `거절 · errno ${probe(permissions['640_matrix'].other_uid1002_gid3000).checks.read.errno}`], ['write', `거절 · errno ${probe(permissions['640_matrix'].other_uid1002_gid3000).checks.write.errno}`],
], '실제 UID 1002, GID 3000 조건입니다. root probe는 별도 원자료에만 있으며 이 비교에 합치지 않았습니다.'));
const argvRecord = (id, title, record, values, range, note) => actualCode(id, title, values, JSON.stringify(record.argv), proofPath, range, 'permissions', '실제 Linux argv(JSON) · 실행 예시 아님', { codeKind: 'additional-linux-argv-json', note });
attach('file-directory-permissions', 'parent-no-search', argvRecord('parent-no-search', '상위 디렉터리에 x가 없어 알려진 파일도 열 수 없음', permissions.parent_without_x_known_file_644, [
  ['파일 mode', '0644'], ['상위 디렉터리', '소유자 외 UID 1002에 x 없음'], ['cat exit', String(permissions.parent_without_x_known_file_644.exit)], ['stderr', permissions.parent_without_x_known_file_644.stderr.trim()],
], [126, 128], '파일 자체가 0644여도 상위 경로의 탐색 권한이 없으면 접근이 거절됩니다.'));
attach('file-directory-permissions', 'known-path-search', argvRecord('known-path-search', '디렉터리 x로 알려진 경로는 열지만 목록은 못 봄', permissions.parent_x_without_r_read_known_path, [
  ['상위 디렉터리 mode', '0711'], ['UID 1002 cat exit', String(permissions.parent_x_without_r_read_known_path.exit)], ['알려진 파일 내용', permissions.parent_x_without_r_read_known_path.stdout.trim()],
], [129, 132], '디렉터리 x는 이름을 알고 있는 경로의 탐색입니다. 디렉터리 r 권한을 뜻하지 않습니다.'));
attach('file-directory-permissions', 'directory-no-list', argvRecord('directory-no-list', '디렉터리 x만으로 이름 목록을 읽을 수 없음', permissions.parent_x_without_r_listing, [
  ['상위 디렉터리 mode', '0711'], ['UID 1002 ls exit', String(permissions.parent_x_without_r_listing.exit)], ['stderr', permissions.parent_x_without_r_listing.stderr.trim()],
], [129, 132], '같은 0711 디렉터리에서 알려진 경로 cat은 성공했고 ls 목록은 거절됐습니다.'));
attach('file-directory-permissions', 'directory-unlink', argvRecord('directory-unlink', '디렉터리 쓰기·탐색으로 파일 항목 제거', permissions.dir_wx_unlink_file_444, [
  ['디렉터리 소유자 UID:GID', '1002:3000'], ['파일 mode', '0444'], ['rm exit', String(permissions.dir_wx_unlink_file_444.exit)], ['항목 존재 여부', String(permissions.entry_exists_after_unlink)],
], [133, 150], '파일 쓰기 비트가 아니라 이 격리 fixture의 부모 디렉터리 항목 권한으로 삭제했습니다. ACL·LSM·sticky bit 조건은 범위 밖입니다.'));

attach('signal-lifecycle', 'term-ack-alive', actualCode('term-ack-alive', 'TERM handler가 응답해도 같은 PID는 살아 있음', [
  ['PID + /proc starttime', `${obs('signals').pid} · ${obs('signals').proc_starttime}`], ['kill -TERM exit', String(obs('signals').kill_term.exit)], ['handler 응답', JSON.stringify(obs('signals').handler_ack)], ['응답 직후 동일 프로세스 생존', String(obs('signals').alive_after_ack_before_release)], ['후속 ps', obs('signals').ps_after_ack.stdout.trim()],
], JSON.stringify(obs('signals').kill_term.argv), proofPath, [153, 189], 'signals', '실제 Linux · 자기 소유 child만 signal', { codeKind: 'additional-linux-argv-json', note: 'PID와 starttime을 확인한 뒤 보냈습니다. ack 뒤 release 파일을 만들기 전까지 같은 프로세스가 살아 있었습니다.' }));
attach('signal-lifecycle', 'term-released', actualCode('term-released', 'release 이후 같은 child가 정상 반환', [
  ['TERM handler ack', JSON.stringify(obs('signals').handler_ack)], ['release 파일', obs('signals').release_file], ['같은 child parent returncode', String(obs('signals').parent_returncode)], ['증명 범위', '이 fixture child의 종료 관측'],
], excerpt(proofPath, 153, 189).content, proofPath, [153, 189], 'signals', '실제 Linux child의 handler·release 절차', { codeKind: 'additional-linux-python' }));
attach('signal-lifecycle', 'kill-observed', actualCode('kill-observed', '별도 sleep child의 KILL 결과는 Python Popen -9', [
  ['대상 PID + starttime', `${obs('signals').kill_kill.pid} · ${obs('signals').kill_kill.proc_starttime}`], ['실제 argv', JSON.stringify(obs('signals').kill_kill.kill_command.argv)], ['Python Popen returncode', String(obs('signals').kill_kill.python_popen_returncode)], ['KILL 정리 marker', '관측 없음'],
], JSON.stringify(obs('signals').kill_kill.kill_command.argv), proofPath, [177, 189], 'signals', '실제 Linux · 별도 자기 소유 sleep child', { codeKind: 'additional-linux-argv-json', note: '원출력은 Python Popen의 -9입니다. shell 종료 코드 137로 바꾸지 않았고 handler cleanup 비교도 하지 않았습니다.' }));

const network = obs('network_readiness');
const nativeArgv = (id, title, values, record, range, note) => actualCode(id, title, values, JSON.stringify(record.argv), proofPath, range, 'network_readiness', '실제 Linux argv(JSON) · 실행 예시 아님', { codeKind: 'additional-linux-argv-json', note });
attach('socket-http', 'socket-listen', nativeArgv('socket-listen', '프로세스와 loopback LISTEN 소켓을 관측', [
  ['fixture PID + starttime', `${network.pid} · ${network.proc_starttime}`], ['주소', network.loopback_address], ['ephemeral port', String(network.ephemeral_port)], ['PID 생존 확인', String(network.proc_alive_before_probes)], ['ss exit', String(network.ss_listen.exit)], ['ss 관측', network.ss_listen.stdout.trim()],
], network.ss_listen, [192, 225], '프로세스와 로컬 LISTEN 소켓의 존재만 확인했습니다.'));
attach('socket-http', 'tcp-connected', nativeArgv('tcp-connected', 'nc TCP 연결은 성공하지만 HTTP는 판정하지 않음', [
  ['주소:포트', `${network.loopback_address}:${network.ephemeral_port}`], ['nc exit', String(network.nc_tcp.exit)], ['stderr', network.nc_tcp.stderr.trim()], ['HTTP 판정', '이 상태만으로는 없음'],
], network.nc_tcp, [192, 225], 'TCP 연결 성공은 HTTP 상태 코드나 외부 도달을 증명하지 않습니다.'));
attach('socket-http', 'http-warming', nativeArgv('http-warming', 'curl exit 0이어도 응답은 HTTP 503 warming', [
  ['curl argv', JSON.stringify(network.curl_before_ready.argv)], ['curl exit', String(network.curl_before_ready.exit)], ['HTTP status', '503'], ['body', 'warming'], ['curl --fail', '사용하지 않음'],
], network.curl_before_ready, [192, 225], 'curl은 `--fail` 없이 실행되어 HTTP 503이어도 종료 코드는 0입니다.'));
attach('socket-http', 'http-ready', nativeArgv('http-ready', 'ready flag 뒤 실제 HTTP 200 응답', [
  ['주소:포트', `${network.loopback_address}:${network.ephemeral_port}`], ['ready flag', network.ready_flag.trim()], ['curl exit', String(network.curl_after_ready.exit)], ['HTTP status', '200'], ['body', 'ready'],
], network.curl_after_ready, [192, 225], '내부 loopback Python fixture 결과입니다. 외부 도달·ICMP·Java·systemd 증거가 아닙니다.'));

attach('ssh-transfer', 'ssh-host-key', modelStage('ssh-host-key', '서버 host key로 접속 대상 키를 확인', [
  ['서버 host key', '접속 대상의 서버 키 확인'], ['known_hosts', '이전에 신뢰한 서버 키 기록'], ['실제 SSH 접속·키 지문', '없음'],
], '서버 host key → 접속 대상 키 확인\nknown_hosts → 이전에 신뢰한 서버 키 기록', [56, 56], '설명 모델입니다. 실제 SSH 연결·호스트 키·지문 검증을 수행하지 않았습니다.', { codeKind: 'explanatory-model' }, specPath));
attach('ssh-transfer', 'ssh-user-key', modelStage('ssh-user-key', '개인키 소유 증명과 계정 공개키 허용을 구분', [
  ['클라이언트 개인키', '사용자 소유 증명'], ['서버 계정 authorized_keys', '허용할 공개키 목록'], ['실제 사용자 인증', '없음'],
], '클라이언트 개인키 → 사용자 소유 증명\n서버 계정 authorized_keys → 허용 공개키', [57, 57], '설명 모델입니다. 원문 SSH 명령은 미실행이며 서비스 정상 여부를 판정하지 않았습니다.', { codeKind: 'explanatory-model' }, specPath));
const rsync = obs('local_rsync_dry_run');
attach('ssh-transfer', 'rsync-dry-run', actualCode('rsync-dry-run', '로컬 dry-run은 new.txt를 표시하고 대상 hash는 유지', [
  ['실제 argv', JSON.stringify(rsync.dry_run.argv)], ['rsync exit', String(rsync.dry_run.exit)], ['목록', rsync.dry_run.stdout], ['대상 SHA 전후 동일', String(JSON.stringify(rsync.destination_sha256_before) === JSON.stringify(rsync.destination_sha256_after))], ['SSH/원격 전송', '아님'],
], JSON.stringify(rsync.dry_run.argv), proofPath, [260, 269], 'local_rsync_dry_run', '추가 Linux 실제 rsync argv · dry-run', { codeKind: 'additional-linux-argv-json', note: '다른 Linux fixture에서 실행한 로컬 DRY RUN입니다. 실제 복사나 원격 SSH 전송은 하지 않았습니다.' }));

attach('systemd-start', 'unit-context', {
  id: 'unit-context', title: '권한·경로·환경·실행 파일은 원문 unit 전제',
  values: [['User/Group', 'orders / orders'], ['WorkingDirectory', '/opt/orders'], ['EnvironmentFile', '-/etc/orders/orders.env'], ['ExecStart', '/usr/lib/jvm/java-25-openjdk/bin/java -jar /opt/orders/app.jar'], ['전제', 'Boot 4.1.x · Java 25 · 서버 경로 준비'], ['실행 여부', '원문 INI 미실행']],
  code: readText(sourcePath).replace(/\r\n/g, '\n').split('\n').slice(213, 231).join('\n'),
  codeKind: 'original-ini-unrun', evidenceKind: '원문 INI 코드 분석 · 미실행', sourceFragments: fragment(sourcePath, 214, 231),
  evidence: '원문 unit과 그 앞의 서버 경로 전제입니다. EnvironmentFile KEY=value는 쉘 스크립트 실행이 아닙니다.',
});
attach('systemd-start', 'exec-boundary', modelStage('exec-boundary', 'Type=exec는 실행 파일 시작을 확인', [
  ['systemd', 'fork/execve로 실행 파일 시작'], ['Type=exec', '실행 파일 시작 확인'], ['HTTP readiness', '별도 요청으로 확인'], ['실제 systemd 실행', '없음'],
], 'systemd → fork/execve(Java)\nType=exec → 실행 파일 시작 확인\nHTTP readiness → 별도 요청으로 확인', [61, 61], 'execve가 반환된다고 설명하지 않습니다. 이 화면에서 systemd를 실행하거나 HTTP 준비를 확인하지 않았습니다.', { codeKind: 'explanatory-model' }, specPath));
attach('systemd-start', 'network-ordering', {
  id: 'network-ordering', title: 'After=network.target은 unit 순서 조건',
  values: [['원문 설정', 'After=network.target'], ['보장', '시작 순서 관계'], ['연결·가용성', '보장하지 않음'], ['실제 unit 실행', '미실행']],
  code: 'After=network.target', codeKind: 'original-ini-unrun', evidenceKind: '원문 INI 코드 분석 · 미실행',
  sourceFragments: fragment(specPath, 62, 62), evidence: 'network-online.target도 HTTP 응답이나 지속 가용성 확인과 같지 않습니다.',
});

attach('unit-application', 'unit-edited', modelStage('unit-edited', '파일 정의만 v2로 편집', [
  ['파일 정의', 'v2'], ['systemd 관리자 보유 정의', 'v1'], ['실행 프로세스', 'v1'], ['부팅 등록', '변경 없음'],
], '파일 정의 v2\nsystemd 관리자 보유 정의 v1\n실행 프로세스 v1\n부팅 등록 변경 없음', [65, 65], '성공 명령이나 실제 서비스 상태가 아닌 분리 설명 모델입니다.', {}, specPath));
attach('unit-application', 'daemon-reloaded', modelStage('daemon-reloaded', 'daemon-reload로 관리자 정의를 재읽기', [
  ['파일 정의', 'v2'], ['systemd 관리자 보유 정의', 'v2'], ['실행 프로세스', 'v1'], ['실제 daemon-reload', '미실행'],
], '파일 정의 v2\nsystemd 관리자 보유 정의 v2\n실행 프로세스 v1', [66, 66], '정의 재읽기가 이미 실행 중인 프로세스를 바꾸지는 않는다는 설명 모델입니다.', {}, specPath));
attach('unit-application', 'process-restarted', modelStage('process-restarted', 'restart 성공 조건에서 새 프로세스 v2 가정', [
  ['파일 정의', 'v2'], ['systemd 관리자 보유 정의', 'v2'], ['실행 프로세스', 'v2 · 성공 조건 모델'], ['실패 가능성', '있음'],
], '정의 v2\n관리자 v2\n새 프로세스 v2 · restart 성공 조건의 설명 모델', [67, 67], 'restart는 실패할 수 있습니다. 실제 PID·active 상태·성공 출력을 관측하지 않았습니다.', {}, specPath));
attach('unit-application', 'boot-enabled', modelStage('boot-enabled', 'enable은 부팅 자동 등록을 요청', [
  ['파일 정의', 'v2'], ['부팅 자동 등록', '요청'], ['지금 시작 요청', '없음'], ['현재 프로세스', '유지 모델'],
], 'systemctl enable → 부팅 자동 등록\n지금 시작 요청 없음\n현재 프로세스 유지 모델', [68, 68], '실제 boot enable을 실행하거나 부팅 결과를 확인하지 않았습니다.', {}, specPath));
attach('unit-application', 'enable-now', modelStage('enable-now', 'enable --now는 등록과 현재 시작을 함께 요청', [
  ['부팅 자동 등록', '요청'], ['지금 start', '요청'], ['이미 active인 서비스', 'restart가 아님'], ['HTTP readiness', '별도 확인 필요'],
], 'systemctl enable --now → 부팅 등록 + 지금 start 요청\nHTTP readiness는 별도 요청으로 확인', [69, 69], '명령 성공·active·PID·부팅 결과를 확인하지 않은 설명 모델입니다.', {}, specPath));

attach('logs-disk', 'log-sources', {
  id: 'log-sources', title: 'journal과 일반 텍스트 파일은 다른 로그 경로',
  values: [['journal', 'systemd 로그 수집·조회 체계'], ['텍스트 파일 로그', '일반 텍스트 파일'], ['journal 실측', '없음'], ['host 운영 로그', '열지 않음']],
  code: '원문 설명: journal 로그는 파일 경로와 별도로 조회할 수 있습니다. 일반 텍스트 파일 로그와는 저장·조회 경로가 다릅니다.',
  codeKind: 'original-prose', evidenceKind: '원문 산문 · 실행 코드 아님',
  sourceFragments: [...fragment(sourcePath, 49, 49), ...fragment(sourcePath, 197, 197)],
  evidence: '원문 산문을 정리했습니다. journal과 실제 앱 로그 파일은 조회하지 않았습니다.',
  note: '원문 산문: journal은 파일 경로와 별도로 다룰 수 있고, 일반 텍스트 파일 로그와 구분됩니다.',
});
const disk = obs('disk_df_du_deleted_open');
const dfRow = record => record.stdout.split('\n').find(line => line.trim().startsWith('tmpfs'))?.trim().split(/\s+/) || [];
const dfBefore = dfRow(disk.df_before_write), dfWritten = dfRow(disk.df_after_write), dfUnlinked = dfRow(disk.df_after_unlink_open_fd), dfClosed = dfRow(disk.df_after_close);
attach('logs-disk', 'disk-written', actualCode('disk-written', '8 MiB 실제 기록 뒤 df와 du를 각각 관측', [
  ['실제 기록 bytes', String(disk.written_bytes)], ['stat blocks · 512B units', String(disk.stat_blocks_512b_units)], ['du 파일', disk.du_file_before_unlink.stdout.trim()], ['df 기록 전 · used/available bytes', `${dfBefore[2]} / ${dfBefore[3]}`], ['df 기록 후 · used/available bytes', `${dfWritten[2]} / ${dfWritten[3]}`], ['filesystem', '컨테이너 /tmp tmpfs'],
], excerpt(proofPath, 228, 257).content, proofPath, [228, 257], 'disk_df_du_deleted_open', '실제 Linux tmpfs 파일 기록·관측 코드', { codeKind: 'additional-linux-python', note: '8 MiB payload를 실제로 기록·fsync했습니다. df는 파일시스템, du는 파일 경로를 관측했습니다.' }));
attach('logs-disk', 'disk-unlinked-open', actualCode('disk-unlinked-open', '경로를 unlink해도 열린 fd가 블록을 유지', [
  ['열린 fd', String(disk.unlink_while_fd_open)], ['du 삭제 경로 exit', String(disk.du_path_after_unlink.exit)], ['du stderr', disk.du_path_after_unlink.stderr.trim()], ['df unlink 후 · used/available bytes', `${dfUnlinked[2]} / ${dfUnlinked[3]}`], ['statvfs bfree', String(disk.statvfs_after_unlink_open_fd.bfree)],
], excerpt(proofPath, 238, 257).content, proofPath, [228, 257], 'disk_df_du_deleted_open', '실제 Linux unlink·열린 fd 관측 코드', { codeKind: 'additional-linux-python', note: 'du 삭제 경로는 ENOENT입니다. 디렉터리 전체 du가 0이라는 뜻으로 바꾸지 않습니다.' }));
attach('logs-disk', 'disk-closed', actualCode('disk-closed', 'fd를 닫은 뒤 tmpfs 여유가 관측됨', [
  ['unlink 직후 statvfs bfree', String(disk.statvfs_after_unlink_open_fd.bfree)], ['fd close 후 statvfs bfree', String(disk.statvfs_after_close.bfree)], ['df close 후 · used/available bytes', `${dfClosed[2]} / ${dfClosed[3]}`], ['측정 filesystem', '컨테이너 /tmp tmpfs'],
], excerpt(proofPath, 241, 257).content, proofPath, [228, 257], 'disk_df_du_deleted_open', '실제 Linux statvfs 관측 코드', { codeKind: 'additional-linux-python', note: '이 값은 sample tmpfs 결과이며 host APFS나 다른 마운트의 결과가 아닙니다.' }));
attach('logs-disk', 'memory-available', {
  id: 'memory-available', title: 'free -h에서 available을 살펴보기',
  values: [['원문 도구', 'free -h'], ['확인할 항목', 'available'], ['실제 명령 실행', '없음'], ['숫자 관측값', '없음'], ['디스크와 구분', '파일시스템(tmpfs 포함) 단위 ≠ 물리 디스크/파티션 크기']],
  code: '원문 설명: free -h에서는 단순 free보다 available을 봅니다.\n보강 설명: available은 회수 가능한 cache 등을 고려한 추정값입니다.\n이 fixture에서 free -h는 실행하지 않았고 숫자 관측값도 없습니다.',
  codeKind: 'original-prose', evidenceKind: '원문 산문 · 실행 코드 아님',
  sourceFragments: [...fragment(sourcePath, 122, 124), ...fragment(specPath, 75, 75)],
  evidence: '원문은 available을 볼 항목으로 제시합니다. 회수 가능한 cache 등을 고려한 보강 설명이며 실측값은 아닙니다.',
  note: '보강 설명: available은 회수 가능한 cache 등을 고려한 추정값입니다. free -h는 실행하지 않았으며 수치 관측값도 없습니다.',
});

const idle = proofRaw.idleContainer;
const dockerFragment = fragment(dockerPath, 103, 123);
const dockerStage = (id, title, values, record, note) => ({
  id, title, values, code: JSON.stringify(record.argv), codeKind: 'additional-linux-argv-json',
  evidenceKind: '별도 idle Docker 컨테이너 실제 관측', sourceFragments: dockerFragment,
  evidence: note, evidencePath: proofRawPath,
});
attach('container-observation', 'container-pid1', dockerStage('container-pid1', 'idle 컨테이너 PID 1은 sleep', [
  ['PID 1 comm', idle.pid1Comm.stdout.trim()], ['PID 1 cmdline', idle.pid1Cmdline.stdout.trim()], ['systemd 추정', String(idle.pid1IsSystemdAssumed)], ['컨테이너 역할', '별도 idle 컨테이너 · 주 proof는 PID 1 python'],
], idle.pid1Comm, 'selected-proof의 별도 idle container에서 /proc/1/comm과 cmdline을 읽었습니다.'));
attach('container-observation', 'container-exec', dockerStage('container-exec', 'docker exec는 추가 PID를 만들고 PID 1을 유지', [
  ['exec PID', idle.execProcess.stdout.trim()], ['PID 1 전', idle.pid1Comm.stdout.trim()], ['PID 1 후', idle.pid1AfterExec.stdout.trim()], ['PID 1 동일', String(proofRaw.idleUnchangedPid1)], ['host PID namespace 공유', String(idle.hostPidNamespace)],
], idle.execProcess, 'docker exec 전후 PID 1을 독립 관측해 같은 sleep임을 확인했습니다.'));
attach('container-observation', 'container-logs', dockerStage('container-logs', 'Docker logs에서 합성 bootline을 읽음', [
  ['실제 stdout', JSON.stringify(idle.logs.stdout)], ['실제 stderr', JSON.stringify(idle.logs.stderr)], ['서비스 정상 판정', '아님'], ['컨테이너 진단 도구', '이미지에 없을 수 있음'],
], idle.logs, '별도 idle 컨테이너의 Docker logs stdout입니다. 앱 서비스 상태나 journal 파일 로그가 아닙니다.'));

const imageFor = (topic, ids, imageId) => {
  if (!D12_ASSETS[imageId]) return;
  for (const id of ids) {
    const focus = focusDesign.states[id];
    if (!focus) throw new Error(`D12 focus rectangle is missing: ${id}`);
    D12_ASSETS[imageId].focus[id] = focus;
    attach(topic, id, { image: imageId });
  }
};
imageFor('shell-boundary', ['terminal-shell', 'cd-builtin'], 'shell-boundary');
imageFor('redirect-order', ['stdout-first', 'stderr-first'], 'redirect-order');
imageFor('redirect-order', ['append-output', 'overwrite-output'], 'append-overwrite');
imageFor('pipeline-status', ['default-pipeline', 'pipefail-pipeline'], 'pipeline-status');
imageFor('environment-path', ['variable-local', 'variable-exported', 'path-first', 'path-second'], 'environment-path');
imageFor('file-directory-permissions', ['mode-owner', 'mode-group', 'mode-other'], 'file-permissions');
imageFor('file-directory-permissions', ['parent-no-search', 'known-path-search', 'directory-no-list', 'directory-unlink'], 'directory-permissions-v2');
imageFor('signal-lifecycle', ['term-ack-alive', 'term-released', 'kill-observed'], 'signal-lifecycle-v2');
imageFor('socket-http', ['socket-listen', 'tcp-connected', 'http-warming', 'http-ready'], 'socket-http');
imageFor('ssh-transfer', ['ssh-host-key', 'ssh-user-key', 'rsync-dry-run'], 'ssh-transfer');
imageFor('systemd-start', ['unit-context', 'exec-boundary', 'network-ordering'], 'systemd-start');
imageFor('unit-application', ['unit-edited', 'daemon-reloaded', 'process-restarted', 'boot-enabled', 'enable-now'], 'unit-application');
imageFor('logs-disk', ['disk-written', 'disk-unlinked-open', 'disk-closed'], 'disk-unlink');
imageFor('container-observation', ['container-pid1', 'container-exec', 'container-logs'], 'container-observation');
imageFor('logs-disk', ['log-sources'], 'log-sources');
imageFor('logs-disk', ['memory-available'], 'memory-available-v2');
for (const state of D12_LESSONS.flatMap(item => item.stages)) state.lead = leadDesign.states[state.id];

export function validateD12LearningData(lessons = D12_LESSONS, assets = D12_ASSETS) {
  const stages = lessons.flatMap(item => item.stages || []);
  if (lessons.length !== 12 || stages.length !== 45 || new Set(stages.map(item => item.id)).size !== 45) {
    throw new Error('D12 learning data must retain the fixed 12-question, 45-state inventory.');
  }
  for (const state of stages) {
    if (!state.values?.length || !state.lead?.trim() || !state.code || !state.codeKind || !state.evidenceKind || !state.sourceFragments?.length) {
      throw new Error(`D12 state is missing values, learning lead, code, evidence type or source: ${state.id}`);
    }
    if (state.codeKind === 'explanatory-model' && !state.evidenceKind.includes('설명 모델 · 명령 실행 결과 아님')) {
      throw new Error(`D12 explanatory model was promoted to execution evidence: ${state.id}`);
    }
    if (state.evidenceKind.includes('설명 모델 · 명령 실행 결과 아님') && state.codeKind !== 'explanatory-model') {
      throw new Error(`D12 explanatory model was promoted to execution evidence: ${state.id}`);
    }
    if (['original-bash-unrun', 'original-ini-unrun'].includes(state.codeKind) && !state.evidenceKind.includes('미실행')) {
      throw new Error(`D12 original command is missing its unrun boundary: ${state.id}`);
    }
    if (!state.image || !assets[state.image]) throw new Error(`D12 state points to a missing selected image: ${state.id}`);
    if (!assets[state.image].focus?.[state.id]) throw new Error(`D12 state has no selected focus rectangle: ${state.id}`);
    for (const source of state.sourceFragments) {
      const exact = excerpt(source.path, source.start, source.end);
      if (source.content !== exact.content) throw new Error(`D12 source fragment changed: ${state.id}`);
    }
  }
  for (const id of ['ssh-host-key', 'ssh-user-key', 'unit-context', 'exec-boundary', 'network-ordering', 'unit-edited', 'daemon-reloaded', 'process-restarted', 'boot-enabled', 'enable-now']) {
    const state = stages.find(item => item.id === id);
    if (/additional-linux|native/.test(state.codeKind)) throw new Error(`D12 SSH/systemd model must remain unexecuted: ${id}`);
  }
  return true;
}
validateD12LearningData();
