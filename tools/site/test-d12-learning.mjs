import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { D12_ASSETS, D12_LESSONS, validateD12CanonicalProof, validateD12LearningData } from './d12-lesson-data.mjs';
import { renderD12Learning } from './d12-learning.mjs';
import { initD12Learning } from './d12-learning.js';

const EXPECTED_IDS = [
  'terminal-shell','cd-builtin','stdout-first','stderr-first','append-output','overwrite-output',
  'default-pipeline','pipefail-pipeline','variable-local','variable-exported','path-first','path-second',
  'mode-owner','mode-group','mode-other','parent-no-search','known-path-search','directory-no-list','directory-unlink',
  'term-ack-alive','term-released','kill-observed','socket-listen','tcp-connected','http-warming','http-ready',
  'ssh-host-key','ssh-user-key','rsync-dry-run','unit-context','exec-boundary','network-ordering',
  'unit-edited','daemon-reloaded','process-restarted','boot-enabled','enable-now',
  'log-sources','disk-written','disk-unlinked-open','disk-closed','memory-available',
  'container-pid1','container-exec','container-logs',
];
const selected = readFileSync(new URL('../../docs/design/d12-2026-10-25/selected-proof.json', import.meta.url), 'utf8');
const proofMeta = JSON.parse(selected);
const CANONICAL_ATTEMPT = 'docs/design/d12-2026-10-25/proof-logs/attempt-0665b1344c5b.json';
const CANONICAL_LINUX_OUTPUT = 'docs/design/d12-2026-10-25/proof-logs/linux-output-0665b1344c5b.json';
assert.equal(proofMeta.canonicalAttempt, CANONICAL_ATTEMPT);
assert.equal(proofMeta.linuxOutput, CANONICAL_LINUX_OUTPUT);
const proof = JSON.parse(readFileSync(new URL(`../../${CANONICAL_ATTEMPT}`, import.meta.url), 'utf8'));
const linux = JSON.parse(readFileSync(new URL(`../../${CANONICAL_LINUX_OUTPUT}`, import.meta.url), 'utf8'));
const leadDesign = JSON.parse(readFileSync(new URL('../../docs/design/d12-2026-10-25/LEAD-DESIGN.json', import.meta.url), 'utf8'));
const cases = Object.fromEntries(linux.cases.map(item => [item.case, item]));
const obs = name => cases[name].observations;
const parseProbe = record => JSON.parse(record.stdout);
const allStages = D12_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(D12_LESSONS.length, 12);
assert.deepEqual(allStages.map(stage => stage.id), EXPECTED_IDS);
assert.equal(new Set(allStages.map(stage => stage.id)).size, EXPECTED_IDS.length);

const s = obs('streams'), e = obs('environment_path_cd'), p = obs('permissions'), sig = obs('signals');
const net = obs('network_readiness'), disk = obs('disk_df_du_deleted_open'), rsync = obs('local_rsync_dry_run');
const owner = parseProbe(p['640_matrix'].owner_uid1000_gid2000), group = parseProbe(p['640_matrix'].group_uid1001_gid2000), other = parseProbe(p['640_matrix'].other_uid1002_gid3000);
const tmpfs = row => row.stdout.split('\n').find(line => line.trim().startsWith('tmpfs')).trim().split(/\s+/);
const before = tmpfs(disk.df_before_write), written = tmpfs(disk.df_after_write), unlinked = tmpfs(disk.df_after_unlink_open_fd), closed = tmpfs(disk.df_after_close);
const idles = proof.idleContainer;
const EXPECTED_VALUES = {
  'terminal-shell': [['터미널','문자 입출력 창'],['Bash','명령을 해석·실행하는 쉘'],['프롬프트 모양','uid 증명 아님']],
  'cd-builtin': [['처음 pwd','/proof'],['type cd','cd is a shell builtin'],['cd /tmp 뒤 pwd','/tmp'],['exit','0']],
  'stdout-first': [['실제 argv[-1]',s.redirect_stdout_then_stderr.argv.at(-1)],['파일 a.log',s.a_bytes],['부모 stdout',JSON.stringify(s.redirect_stdout_then_stderr.stdout)],['부모 stderr',JSON.stringify(s.redirect_stdout_then_stderr.stderr)],['exit',String(s.redirect_stdout_then_stderr.exit)]],
  'stderr-first': [['실제 argv[-1]',s.redirect_stderr_then_stdout.argv.at(-1)],['파일 b.log',s.b_bytes],['부모 stdout',JSON.stringify(s.redirect_stderr_then_stdout.stdout)],['부모 stderr',JSON.stringify(s.redirect_stderr_then_stdout.stderr)],['exit',String(s.redirect_stderr_then_stdout.exit)]],
  'append-output': [['실제 argv[-1]',s.append.argv.at(-1)],['append 전 a.log',s.a_bytes],['append 후 a.log',s.a_after_append],['exit',String(s.append.exit)]],
  'overwrite-output': [['실제 argv[-1]',s.overwrite.argv.at(-1)],['덮어쓰기 전 b.log',s.b_bytes],['덮어쓰기 후 b.log',s.b_after_overwrite],['exit',String(s.overwrite.exit)]],
  'default-pipeline': [['명령 전체 exit',String(s.pipeline_default.exit)],['producer exit','7'],['cat exit','0'],['캡처된 stdout',s.pipeline_default.stdout],['stderr',s.pipeline_default.stderr]],
  'pipefail-pipeline': [['명령 전체 exit',String(s.pipeline_pipefail.exit)],['PIPESTATUS','7 0'],['캡처된 stdout',s.pipeline_pipefail.stdout],['stderr',s.pipeline_pipefail.stderr]],
  'variable-local': [['부모 shell 변수','DEMO_ONLY=synthetic'],['자식 출력',e.unexported_child.stdout.trim()],['exit',String(e.unexported_child.exit)],['실험 환경',JSON.stringify(e.controlled_environment)]],
  'variable-exported': [['부모 export','DEMO_ONLY=synthetic'],['자식 출력',e.exported_child.stdout.trim()],['exit',String(e.exported_child.exit)],['실험 환경',JSON.stringify(e.controlled_environment)]],
  'path-first': [['command -v demo',e.path_first_then_second.stdout.split('\n')[0]],['demo 출력',e.path_first_then_second.stdout.split('\n')[1]],['실제 PATH 순서','/tmp/d12-proof/path-first:/tmp/d12-proof/path-second'],['exit',String(e.path_first_then_second.exit)]],
  'path-second': [['command -v demo',e.path_second_then_first.stdout.split('\n')[0]],['demo 출력',e.path_second_then_first.stdout.split('\n')[1]],['실제 PATH 순서','/tmp/d12-proof/path-second:/tmp/d12-proof/path-first'],['exit',String(e.path_second_then_first.exit)]],
  'mode-owner': [['mode',p.file_stat.mode],['소유 UID:GID',`${p.file_stat.uid}:${p.file_stat.gid}`],['관측 UID:GID:groups',`${owner.uid}:${owner.gid}:${JSON.stringify(owner.groups)}`],['read',String(owner.checks.read.ok)],['write',String(owner.checks.write.ok)]],
  'mode-group': [['mode',p.file_stat.mode],['관측 UID:GID:groups',`${group.uid}:${group.gid}:${JSON.stringify(group.groups)}`],['read',String(group.checks.read.ok)],['write',`거절 · errno ${group.checks.write.errno}`]],
  'mode-other': [['mode',p.file_stat.mode],['관측 UID:GID:groups',`${other.uid}:${other.gid}:${JSON.stringify(other.groups)}`],['read',`거절 · errno ${other.checks.read.errno}`],['write',`거절 · errno ${other.checks.write.errno}`]],
  'parent-no-search': [['파일 mode','0644'],['상위 디렉터리','소유자 외 UID 1002에 x 없음'],['cat exit',String(p.parent_without_x_known_file_644.exit)],['stderr',p.parent_without_x_known_file_644.stderr.trim()]],
  'known-path-search': [['상위 디렉터리 mode','0711'],['UID 1002 cat exit',String(p.parent_x_without_r_read_known_path.exit)],['알려진 파일 내용',p.parent_x_without_r_read_known_path.stdout.trim()]],
  'directory-no-list': [['상위 디렉터리 mode','0711'],['UID 1002 ls exit',String(p.parent_x_without_r_listing.exit)],['stderr',p.parent_x_without_r_listing.stderr.trim()]],
  'directory-unlink': [['디렉터리 소유자 UID:GID','1002:3000'],['파일 mode','0444'],['rm exit',String(p.dir_wx_unlink_file_444.exit)],['항목 존재 여부',String(p.entry_exists_after_unlink)]],
  'term-ack-alive': [['PID + /proc starttime',`${sig.pid} · ${sig.proc_starttime}`],['kill -TERM exit',String(sig.kill_term.exit)],['handler 응답',JSON.stringify(sig.handler_ack)],['응답 직후 동일 프로세스 생존',String(sig.alive_after_ack_before_release)],['후속 ps',sig.ps_after_ack.stdout.trim()]],
  'term-released': [['TERM handler ack',JSON.stringify(sig.handler_ack)],['release 파일',sig.release_file],['같은 child parent returncode',String(sig.parent_returncode)],['증명 범위','이 fixture child의 종료 관측']],
  'kill-observed': [['대상 PID + starttime',`${sig.kill_kill.pid} · ${sig.kill_kill.proc_starttime}`],['실제 argv',JSON.stringify(sig.kill_kill.kill_command.argv)],['Python Popen returncode',String(sig.kill_kill.python_popen_returncode)],['KILL 정리 marker','관측 없음']],
  'socket-listen': [['fixture PID + starttime',`${net.pid} · ${net.proc_starttime}`],['주소',net.loopback_address],['ephemeral port',String(net.ephemeral_port)],['PID 생존 확인',String(net.proc_alive_before_probes)],['ss exit',String(net.ss_listen.exit)],['ss 관측',net.ss_listen.stdout.trim()]],
  'tcp-connected': [['주소:포트',`${net.loopback_address}:${net.ephemeral_port}`],['nc exit',String(net.nc_tcp.exit)],['stderr',net.nc_tcp.stderr.trim()],['HTTP 판정','이 상태만으로는 없음']],
  'http-warming': [['curl argv',JSON.stringify(net.curl_before_ready.argv)],['curl exit',String(net.curl_before_ready.exit)],['HTTP status','503'],['body','warming'],['curl --fail','사용하지 않음']],
  'http-ready': [['주소:포트',`${net.loopback_address}:${net.ephemeral_port}`],['ready flag',net.ready_flag.trim()],['curl exit',String(net.curl_after_ready.exit)],['HTTP status','200'],['body','ready']],
  'ssh-host-key': [['서버 host key','접속 대상의 서버 키 확인'],['known_hosts','이전에 신뢰한 서버 키 기록'],['실제 SSH 접속·키 지문','없음']],
  'ssh-user-key': [['클라이언트 개인키','사용자 소유 증명'],['서버 계정 authorized_keys','허용할 공개키 목록'],['실제 사용자 인증','없음']],
  'rsync-dry-run': [['실제 argv',JSON.stringify(rsync.dry_run.argv)],['rsync exit',String(rsync.dry_run.exit)],['목록',rsync.dry_run.stdout],['대상 SHA 전후 동일',String(JSON.stringify(rsync.destination_sha256_before) === JSON.stringify(rsync.destination_sha256_after))],['SSH/원격 전송','아님']],
  'unit-context': [['User/Group','orders / orders'],['WorkingDirectory','/opt/orders'],['EnvironmentFile','-/etc/orders/orders.env'],['ExecStart','/usr/lib/jvm/java-25-openjdk/bin/java -jar /opt/orders/app.jar'],['전제','Boot 4.1.x · Java 25 · 서버 경로 준비'],['실행 여부','원문 INI 미실행']],
  'exec-boundary': [['systemd','fork/execve로 실행 파일 시작'],['Type=exec','실행 파일 시작 확인'],['HTTP readiness','별도 요청으로 확인'],['실제 systemd 실행','없음']],
  'network-ordering': [['원문 설정','After=network.target'],['보장','시작 순서 관계'],['연결·가용성','보장하지 않음'],['실제 unit 실행','미실행']],
  'unit-edited': [['파일 정의','v2'],['systemd 관리자 보유 정의','v1'],['실행 프로세스','v1'],['부팅 등록','변경 없음']],
  'daemon-reloaded': [['파일 정의','v2'],['systemd 관리자 보유 정의','v2'],['실행 프로세스','v1'],['실제 daemon-reload','미실행']],
  'process-restarted': [['파일 정의','v2'],['systemd 관리자 보유 정의','v2'],['실행 프로세스','v2 · 성공 조건 모델'],['실패 가능성','있음']],
  'boot-enabled': [['파일 정의','v2'],['부팅 자동 등록','요청'],['지금 시작 요청','없음'],['현재 프로세스','유지 모델']],
  'enable-now': [['부팅 자동 등록','요청'],['지금 start','요청'],['이미 active인 서비스','restart가 아님'],['HTTP readiness','별도 확인 필요']],
  'log-sources': [['journal','systemd 로그 수집·조회 체계'],['텍스트 파일 로그','일반 텍스트 파일'],['journal 실측','없음'],['host 운영 로그','열지 않음']],
  'disk-written': [['실제 기록 bytes',String(disk.written_bytes)],['stat blocks · 512B units',String(disk.stat_blocks_512b_units)],['du 파일',disk.du_file_before_unlink.stdout.trim()],['df 기록 전 · used/available bytes',`${before[2]} / ${before[3]}`],['df 기록 후 · used/available bytes',`${written[2]} / ${written[3]}`],['filesystem','컨테이너 /tmp tmpfs']],
  'disk-unlinked-open': [['열린 fd',String(disk.unlink_while_fd_open)],['du 삭제 경로 exit',String(disk.du_path_after_unlink.exit)],['du stderr',disk.du_path_after_unlink.stderr.trim()],['df unlink 후 · used/available bytes',`${unlinked[2]} / ${unlinked[3]}`],['statvfs bfree',String(disk.statvfs_after_unlink_open_fd.bfree)]],
  'disk-closed': [['unlink 직후 statvfs bfree',String(disk.statvfs_after_unlink_open_fd.bfree)],['fd close 후 statvfs bfree',String(disk.statvfs_after_close.bfree)],['df close 후 · used/available bytes',`${closed[2]} / ${closed[3]}`],['측정 filesystem','컨테이너 /tmp tmpfs']],
  'memory-available': [['원문 도구','free -h'],['확인할 항목','available'],['실제 명령 실행','없음'],['숫자 관측값','없음'],['디스크와 구분','파일시스템(tmpfs 포함) 단위 ≠ 물리 디스크/파티션 크기']],
  'container-pid1': [['PID 1 comm',idles.pid1Comm.stdout.trim()],['PID 1 cmdline',idles.pid1Cmdline.stdout.trim()],['systemd 추정',String(idles.pid1IsSystemdAssumed)],['컨테이너 역할','별도 idle 컨테이너 · 주 proof는 PID 1 python']],
  'container-exec': [['exec PID',idles.execProcess.stdout.trim()],['PID 1 전',idles.pid1Comm.stdout.trim()],['PID 1 후',idles.pid1AfterExec.stdout.trim()],['PID 1 동일',String(proof.idleUnchangedPid1)],['host PID namespace 공유',String(idles.hostPidNamespace)]],
  'container-logs': [['실제 stdout',JSON.stringify(idles.logs.stdout)],['실제 stderr',JSON.stringify(idles.logs.stderr)],['서비스 정상 판정','아님'],['컨테이너 진단 도구','이미지에 없을 수 있음']],
};
assert.deepEqual(Object.keys(EXPECTED_VALUES).sort(), [...EXPECTED_IDS].sort());
for (const stage of allStages) assert.deepEqual(stage.values, EXPECTED_VALUES[stage.id], `${stage.id} values match independent canonical oracle`);
assert.ok(allStages.every(stage => stage.code && stage.codeKind && stage.evidenceKind && stage.sourceFragments?.length), '45 states carry code, codeKind, evidenceKind and source fragments');
assert.ok(allStages.every(stage => stage.lead === leadDesign.states[stage.id] && stage.lead.trim()), '45 states use the exact reviewed teaching lead');
const EXPECTED_KINDS = {
  'terminal-shell':'explanatory-model','cd-builtin':'additional-linux-bash',
  'stdout-first':'additional-linux-bash','stderr-first':'additional-linux-bash','append-output':'additional-linux-bash','overwrite-output':'additional-linux-bash',
  'default-pipeline':'additional-linux-bash','pipefail-pipeline':'additional-linux-bash',
  'variable-local':'additional-linux-bash','variable-exported':'additional-linux-bash','path-first':'additional-linux-bash','path-second':'additional-linux-bash',
  'mode-owner':'additional-linux-python-probe','mode-group':'additional-linux-python-probe','mode-other':'additional-linux-python-probe',
  'parent-no-search':'additional-linux-argv-json','known-path-search':'additional-linux-argv-json','directory-no-list':'additional-linux-argv-json','directory-unlink':'additional-linux-argv-json',
  'term-ack-alive':'additional-linux-argv-json','term-released':'additional-linux-python','kill-observed':'additional-linux-argv-json',
  'socket-listen':'additional-linux-argv-json','tcp-connected':'additional-linux-argv-json','http-warming':'additional-linux-argv-json','http-ready':'additional-linux-argv-json',
  'ssh-host-key':'explanatory-model','ssh-user-key':'explanatory-model','rsync-dry-run':'additional-linux-argv-json',
  'unit-context':'original-ini-unrun','exec-boundary':'explanatory-model','network-ordering':'original-ini-unrun',
  'unit-edited':'explanatory-model','daemon-reloaded':'explanatory-model','process-restarted':'explanatory-model','boot-enabled':'explanatory-model','enable-now':'explanatory-model',
  'log-sources':'original-prose','disk-written':'additional-linux-python','disk-unlinked-open':'additional-linux-python','disk-closed':'additional-linux-python','memory-available':'original-prose',
  'container-pid1':'additional-linux-argv-json','container-exec':'additional-linux-argv-json','container-logs':'additional-linux-argv-json',
};
const EXPECTED_RANGES = {
  'terminal-shell':['docs/design/d12-2026-10-25/SPEC.md',21,21], 'cd-builtin':['docs/design/d12-2026-10-25/source-proof/proof.py',92,110],
  'stdout-first':['docs/design/d12-2026-10-25/source-proof/proof.py',57,89], 'stderr-first':['docs/design/d12-2026-10-25/source-proof/proof.py',57,89],
  'append-output':['docs/design/d12-2026-10-25/source-proof/proof.py',70,73], 'overwrite-output':['docs/design/d12-2026-10-25/source-proof/proof.py',70,73],
  'default-pipeline':['docs/design/d12-2026-10-25/source-proof/proof.py',74,89], 'pipefail-pipeline':['docs/design/d12-2026-10-25/source-proof/proof.py',74,89],
  'variable-local':['docs/design/d12-2026-10-25/source-proof/proof.py',92,110], 'variable-exported':['docs/design/d12-2026-10-25/source-proof/proof.py',92,110],
  'path-first':['docs/design/d12-2026-10-25/source-proof/proof.py',92,110], 'path-second':['docs/design/d12-2026-10-25/source-proof/proof.py',92,110],
  'mode-owner':['docs/design/d12-2026-10-25/source-proof/proof.py',117,123], 'mode-group':['docs/design/d12-2026-10-25/source-proof/proof.py',117,123],
  'mode-other':['docs/design/d12-2026-10-25/source-proof/proof.py',117,123], 'parent-no-search':['docs/design/d12-2026-10-25/source-proof/proof.py',126,128],
  'known-path-search':['docs/design/d12-2026-10-25/source-proof/proof.py',129,132], 'directory-no-list':['docs/design/d12-2026-10-25/source-proof/proof.py',129,132],
  'directory-unlink':['docs/design/d12-2026-10-25/source-proof/proof.py',133,150], 'term-ack-alive':['docs/design/d12-2026-10-25/source-proof/proof.py',153,189],
  'term-released':['docs/design/d12-2026-10-25/source-proof/proof.py',153,189], 'kill-observed':['docs/design/d12-2026-10-25/source-proof/proof.py',177,189],
  'socket-listen':['docs/design/d12-2026-10-25/source-proof/proof.py',192,225], 'tcp-connected':['docs/design/d12-2026-10-25/source-proof/proof.py',192,225],
  'http-warming':['docs/design/d12-2026-10-25/source-proof/proof.py',192,225], 'http-ready':['docs/design/d12-2026-10-25/source-proof/proof.py',192,225],
  'ssh-host-key':['docs/design/d12-2026-10-25/SPEC.md',56,56], 'ssh-user-key':['docs/design/d12-2026-10-25/SPEC.md',57,57],
  'rsync-dry-run':['docs/design/d12-2026-10-25/source-proof/proof.py',260,269], 'unit-context':['docs/knowledge/D12-linux-terminal-basics.md',214,231],
  'exec-boundary':['docs/design/d12-2026-10-25/SPEC.md',61,61], 'network-ordering':['docs/design/d12-2026-10-25/SPEC.md',62,62],
  'unit-edited':['docs/design/d12-2026-10-25/SPEC.md',65,65], 'daemon-reloaded':['docs/design/d12-2026-10-25/SPEC.md',66,66],
  'process-restarted':['docs/design/d12-2026-10-25/SPEC.md',67,67], 'boot-enabled':['docs/design/d12-2026-10-25/SPEC.md',68,68],
  'enable-now':['docs/design/d12-2026-10-25/SPEC.md',69,69], 'log-sources':['docs/knowledge/D12-linux-terminal-basics.md',49,49],
  'disk-written':['docs/design/d12-2026-10-25/source-proof/proof.py',228,257], 'disk-unlinked-open':['docs/design/d12-2026-10-25/source-proof/proof.py',228,257],
  'disk-closed':['docs/design/d12-2026-10-25/source-proof/proof.py',228,257], 'memory-available':['docs/knowledge/D12-linux-terminal-basics.md',122,124],
  'container-pid1':['docs/design/d12-2026-10-25/source-proof/run_proof.py',103,123], 'container-exec':['docs/design/d12-2026-10-25/source-proof/run_proof.py',103,123],
  'container-logs':['docs/design/d12-2026-10-25/source-proof/run_proof.py',103,123],
};
const EXTRA_RANGES = {
  'log-sources': [['docs/knowledge/D12-linux-terminal-basics.md',197,197]],
  'memory-available': [['docs/design/d12-2026-10-25/SPEC.md',75,75]],
};
const expectedRangesFor = id => [EXPECTED_RANGES[id], ...(EXTRA_RANGES[id] || [])];
const EXPECTED_IMAGES = {
  'terminal-shell':'shell-boundary','cd-builtin':'shell-boundary',
  'stdout-first':'redirect-order','stderr-first':'redirect-order','append-output':'append-overwrite','overwrite-output':'append-overwrite',
  'default-pipeline':'pipeline-status','pipefail-pipeline':'pipeline-status',
  'variable-local':'environment-path','variable-exported':'environment-path','path-first':'environment-path','path-second':'environment-path',
  'mode-owner':'file-permissions','mode-group':'file-permissions','mode-other':'file-permissions',
  'parent-no-search':'directory-permissions-v2','known-path-search':'directory-permissions-v2','directory-no-list':'directory-permissions-v2','directory-unlink':'directory-permissions-v2',
  'term-ack-alive':'signal-lifecycle-v2','term-released':'signal-lifecycle-v2','kill-observed':'signal-lifecycle-v2',
  'socket-listen':'socket-http','tcp-connected':'socket-http','http-warming':'socket-http','http-ready':'socket-http',
  'ssh-host-key':'ssh-transfer','ssh-user-key':'ssh-transfer','rsync-dry-run':'ssh-transfer',
  'unit-context':'systemd-start','exec-boundary':'systemd-start','network-ordering':'systemd-start',
  'unit-edited':'unit-application','daemon-reloaded':'unit-application','process-restarted':'unit-application','boot-enabled':'unit-application','enable-now':'unit-application',
  'log-sources':'log-sources','disk-written':'disk-unlink','disk-unlinked-open':'disk-unlink','disk-closed':'disk-unlink','memory-available':'memory-available-v2',
  'container-pid1':'container-observation','container-exec':'container-observation','container-logs':'container-observation',
};
const CODE_LABELS = {
  'explanatory-model':'설명 모델 · 명령 실행 결과 아님',
  'additional-linux-bash':'추가 Linux · Bash 실제 관측 · 실제 argv[-1]',
  'additional-linux-python':'추가 Linux 실제 Python fixture 코드',
  'additional-linux-python-probe':'추가 Linux 실제 Python 권한 probe',
  'additional-linux-argv-json':'실제 실행 argv(JSON) · 복사값은 명령 예시 아님',
  'original-ini-unrun':'원문 INI unit · 미실행',
  'original-bash-unrun':'원문 Bash 예시 · 미실행',
  'original-prose':'원문 산문 · 실행 코드 아님',
};
const EVIDENCE_LABELS = {
  'explanatory-model':'설명 모델 · 명령 실행 결과 아님',
  'additional-linux-bash':'실제 Linux · Bash 실제 관측',
  'additional-linux-python-probe':'실제 Linux Python 권한 probe',
  'additional-linux-argv-json':'실제 Linux argv(JSON) · 실행 예시 아님',
  'original-ini-unrun':'원문 INI 코드 분석 · 미실행',
  'original-bash-unrun':'원문 Bash 명령 · 미실행',
  'original-prose':'원문 산문 · 실행 코드 아님',
};
const EVIDENCE_OVERRIDES = {
  'term-released':'실제 Linux child의 handler·release 절차',
  'disk-written':'실제 Linux tmpfs 파일 기록·관측 코드',
  'disk-unlinked-open':'실제 Linux unlink·열린 fd 관측 코드',
  'disk-closed':'실제 Linux statvfs 관측 코드',
  'term-ack-alive':'실제 Linux · 자기 소유 child만 signal',
  'kill-observed':'실제 Linux · 별도 자기 소유 sleep child',
  'rsync-dry-run':'추가 Linux 실제 rsync argv · dry-run',
  'container-pid1':'별도 idle Docker 컨테이너 실제 관측',
  'container-exec':'별도 idle Docker 컨테이너 실제 관측',
  'container-logs':'별도 idle Docker 컨테이너 실제 관측',
};
assert.deepEqual(Object.keys(EXPECTED_KINDS).sort(), [...EXPECTED_IDS].sort());
assert.deepEqual(Object.keys(EXPECTED_RANGES).sort(), [...EXPECTED_IDS].sort());
assert.deepEqual(Object.keys(EXPECTED_IMAGES).sort(), [...EXPECTED_IDS].sort());
for (const stage of allStages) {
  assert.equal(stage.codeKind, EXPECTED_KINDS[stage.id], `${stage.id} code kind`);
  assert.equal(stage.evidenceKind, EVIDENCE_OVERRIDES[stage.id] || EVIDENCE_LABELS[EXPECTED_KINDS[stage.id]], `${stage.id} evidence kind`);
  assert.equal(stage.image, EXPECTED_IMAGES[stage.id], `${stage.id} selected image`);
  const ranges = expectedRangesFor(stage.id);
  assert.deepEqual(stage.sourceFragments.map(fragment => [fragment.path, fragment.start, fragment.end]), ranges, `${stage.id} source range`);
  for (const [index, [path, start, end]] of ranges.entries()) {
    assert.equal(stage.sourceFragments[index].content, readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n').split('\n').slice(start - 1, end).join('\n'), `${stage.id} exact source excerpt ${index + 1}`);
  }
}
const actualBash = {
  'cd-builtin':e.cd_builtin,'stdout-first':s.redirect_stdout_then_stderr,'stderr-first':s.redirect_stderr_then_stdout,
  'append-output':s.append,'overwrite-output':s.overwrite,'default-pipeline':s.pipeline_default,'pipefail-pipeline':s.pipeline_pipefail,
  'variable-local':e.unexported_child,'variable-exported':e.exported_child,'path-first':e.path_first_then_second,'path-second':e.path_second_then_first,
};
for (const [id, record] of Object.entries(actualBash)) assert.equal(allStages.find(stage => stage.id === id).code, record.argv.at(-1), `${id} exact executed Bash argv[-1]`);
const actualProbes = {
  'mode-owner':p['640_matrix'].owner_uid1000_gid2000,'mode-group':p['640_matrix'].group_uid1001_gid2000,'mode-other':p['640_matrix'].other_uid1002_gid3000,
};
for (const [id, record] of Object.entries(actualProbes)) assert.equal(allStages.find(stage => stage.id === id).code, record.argv[2], `${id} exact Python probe code`);
const argvPayloads = {
  'parent-no-search':p.parent_without_x_known_file_644,'known-path-search':p.parent_x_without_r_read_known_path,
  'directory-no-list':p.parent_x_without_r_listing,'directory-unlink':p.dir_wx_unlink_file_444,
  'term-ack-alive':sig.kill_term,'kill-observed':sig.kill_kill.kill_command,'socket-listen':net.ss_listen,'tcp-connected':net.nc_tcp,
  'http-warming':net.curl_before_ready,'http-ready':net.curl_after_ready,'rsync-dry-run':rsync.dry_run,
  'container-pid1':idles.pid1Comm,'container-exec':idles.execProcess,'container-logs':idles.logs,
};
for (const [id, record] of Object.entries(argvPayloads)) assert.equal(allStages.find(stage => stage.id === id).code, JSON.stringify(record.argv), `${id} exact raw argv JSON`);
for (const stage of allStages.filter(item => item.codeKind === 'additional-linux-python')) {
  const fragment = stage.sourceFragments[0];
  assert.ok(fragment.content.includes(stage.code), `${stage.id} code matches executed fixture source excerpt`);
}
const expectedExplanations = {
  'terminal-shell':'터미널 = 문자 입출력 창\nBash = 명령 해석·실행기\n프롬프트 모양 ≠ uid 증명',
  'ssh-host-key':'서버 host key → 접속 대상 키 확인\nknown_hosts → 이전에 신뢰한 서버 키 기록',
  'ssh-user-key':'클라이언트 개인키 → 사용자 소유 증명\n서버 계정 authorized_keys → 허용 공개키',
  'exec-boundary':'systemd → fork/execve(Java)\nType=exec → 실행 파일 시작 확인\nHTTP readiness → 별도 요청으로 확인',
  'unit-edited':'파일 정의 v2\nsystemd 관리자 보유 정의 v1\n실행 프로세스 v1\n부팅 등록 변경 없음',
  'daemon-reloaded':'파일 정의 v2\nsystemd 관리자 보유 정의 v2\n실행 프로세스 v1',
  'process-restarted':'정의 v2\n관리자 v2\n새 프로세스 v2 · restart 성공 조건의 설명 모델',
  'boot-enabled':'systemctl enable → 부팅 자동 등록\n지금 시작 요청 없음\n현재 프로세스 유지 모델',
  'enable-now':'systemctl enable --now → 부팅 등록 + 지금 start 요청\nHTTP readiness는 별도 요청으로 확인',
  'log-sources':'원문 설명: journal 로그는 파일 경로와 별도로 조회할 수 있습니다. 일반 텍스트 파일 로그와는 저장·조회 경로가 다릅니다.',
  'memory-available':'원문 설명: free -h에서는 단순 free보다 available을 봅니다.\n보강 설명: available은 회수 가능한 cache 등을 고려한 추정값입니다.\n이 fixture에서 free -h는 실행하지 않았고 숫자 관측값도 없습니다.',
};
for (const [id, expected] of Object.entries(expectedExplanations)) assert.equal(allStages.find(stage => stage.id === id).code, expected, `${id} exact explanatory text`);
assert.equal(allStages.find(stage => stage.id === 'unit-context').code, readFileSync(new URL('../../docs/knowledge/D12-linux-terminal-basics.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n').split('\n').slice(213,231).join('\n'));
assert.equal(allStages.find(stage => stage.id === 'network-ordering').code, 'After=network.target');
assert.equal(allStages.find(stage => stage.id === 'term-ack-alive').evidenceKind, '실제 Linux · 자기 소유 child만 signal');
assert.equal(allStages.find(stage => stage.id === 'http-warming').evidenceKind, '실제 Linux argv(JSON) · 실행 예시 아님');
assert.equal(allStages.find(stage => stage.id === 'unit-context').evidenceKind, '원문 INI 코드 분석 · 미실행');
assert.equal(allStages.find(stage => stage.id === 'exec-boundary').evidenceKind, '설명 모델 · 명령 실행 결과 아님');
assert.ok(validateD12LearningData());
assert.ok(validateD12CanonicalProof());
assert.equal(net.ephemeral_port, 44397, 'selected-proof independently pins the native port');
assert.throws(() => validateD12CanonicalProof({ ...proofMeta, linuxOutput: 'docs/design/d12-2026-10-25/proof-logs/other.json' }, proof, linux), /fixed canonical/);
assert.throws(() => validateD12CanonicalProof({ ...proofMeta, canonicalAttempt: 'docs/design/d12-2026-10-25/proof-logs/other.json' }, proof, linux), /fixed canonical/);
assert.throws(() => validateD12CanonicalProof({ ...proofMeta, sourceSha256: { ...proofMeta.sourceSha256, runner: '0'.repeat(64) } }, proof, linux), /runner SHA-256/);
assert.throws(() => validateD12CanonicalProof(proofMeta, { ...proof, sourceSha256: { ...proof.sourceSha256, 'proof.py': '0'.repeat(64) } }, linux), /SHA-256/);
const wrongLinuxPort = structuredClone(linux);
wrongLinuxPort.cases.find(item => item.case === 'network_readiness').observations.ephemeral_port = 44398;
assert.throws(() => validateD12CanonicalProof(proofMeta, proof, wrongLinuxPort), /separated Linux output/);
const wrongEmbeddedStdout = structuredClone(proof);
const embeddedPayload = JSON.parse(wrongEmbeddedStdout.linuxFixtureOutput.stdout);
embeddedPayload.cases.find(item => item.case === 'network_readiness').observations.ephemeral_port = 44398;
wrongEmbeddedStdout.linuxFixtureOutput.stdout = JSON.stringify(embeddedPayload);
assert.throws(() => validateD12CanonicalProof(proofMeta, wrongEmbeddedStdout, linux), /separated Linux output/);
const wrongRunnerRawSha = structuredClone(proof);
wrongRunnerRawSha.sourceSha256['run_proof.py'] = '0'.repeat(64);
assert.throws(() => validateD12CanonicalProof(proofMeta, wrongRunnerRawSha, linux), /runner SHA-256/);
const wrongSource = structuredClone(D12_LESSONS);
wrongSource[0].stages[0].sourceFragments[0].content += 'mutant';
assert.throws(() => validateD12LearningData(wrongSource), /source fragment changed/);
const promotedModel = structuredClone(D12_LESSONS);
promotedModel[0].stages[0].codeKind = 'additional-linux-bash';
assert.throws(() => validateD12LearningData(promotedModel), /explanatory model was promoted/);
const missingState = structuredClone(D12_LESSONS);
missingState.at(-1).stages.pop();
assert.throws(() => validateD12LearningData(missingState), /45-state inventory/);
const missingAsset = structuredClone(D12_LESSONS);
missingAsset[0].stages[0].image = 'unselected-mutant';
assert.throws(() => validateD12LearningData(missingAsset), /missing selected image/);
const missingFocusAssets = structuredClone(D12_ASSETS);
delete missingFocusAssets['shell-boundary'].focus['terminal-shell'];
assert.throws(() => validateD12LearningData(D12_LESSONS, missingFocusAssets), /no selected focus rectangle/);

const html = renderD12Learning();
const dom = new JSDOM(`<main><h1>D12 리눅스·터미널 기본</h1>${html}<details id="d12-original"><summary>원문</summary><h2 id="d12-source-anchor">원문</h2></details></main>`, {
  url: 'https://example.test/docs/knowledge/D12-linux-terminal-basics.html?read=1&catalogSearch=server',
});
const { document, Event, KeyboardEvent } = dom.window;
dom.window.matchMedia = () => ({ matches: false, addEventListener() {} });
let copied = [];
Object.defineProperty(dom.window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: async text => copied.push(text) },
});

initD12Learning(document, dom.window);
initD12Learning(document, dom.window);
const root = document.querySelector('[data-d12-learning]');
assert.ok(root);
assert.equal(root.querySelector('.d12-intro>p'), null, 'the first visual label is the learning question');
assert.equal(root.dataset.topic, 'shell-boundary');
assert.equal(root.dataset.stage, 'terminal-shell');
assert.equal(root.querySelectorAll('[data-d12-stage]').length, 2);
assert.equal(root.querySelector('[data-d12-pending]').hidden, true);
assert.equal(root.querySelector('[data-d12-copy]').disabled, false);
assert.equal(root.querySelector('[data-d12-zoom]').hidden, false);
assert.equal(root.querySelector('[data-d12-focus-status]'), null);
assert.doesNotMatch(root.querySelector('.d12-scope').textContent, /Task26|45개 상태|canonical|검수|준비/);
assert.equal(root.querySelector('[data-d12-source-details]').hidden, false);
assert.equal(root.querySelector('[data-d12-image]').getAttribute('src'), '../design/d12-2026-10-25/images/shell-boundary-pc-dark.jpg');
assert.match(root.querySelector('[data-d12-state]').textContent, /문자 입출력 창/);

const selector = root.querySelector('[data-d12-topic]');
selector.value = 'redirect-order';
selector.dispatchEvent(new Event('change', { bubbles: true }));
assert.equal(root.dataset.topic, 'redirect-order');
assert.equal(root.dataset.stage, 'stdout-first');
assert.equal(root.querySelector('[data-d12-position]').textContent, '1 / 4');
assert.equal(new URL(dom.window.location.href).searchParams.get('topic'), 'redirect-order');
assert.equal(new URL(dom.window.location.href).searchParams.get('stage'), 'stdout-first');
assert.equal(new URL(dom.window.location.href).searchParams.get('read'), '1');
assert.equal(new URL(dom.window.location.href).searchParams.get('catalogSearch'), 'server');
assert.match(root.querySelector('[data-d12-state]').textContent, /out.*err/s);
root.querySelector('[data-d12-stage="append-output"]').click();
assert.equal(root.dataset.stage, 'append-output');
assert.equal(root.querySelector('[data-d12-position]').textContent, '3 / 4');
root.querySelector('[data-d12-copy]').click();
await Promise.resolve();
assert.match(copied.at(-1), /append/);

const stateButtons = root.querySelectorAll('[data-d12-stage]');
stateButtons[2].focus();
root.querySelector('[data-d12-stages]').dispatchEvent(new KeyboardEvent('keydown', {
  key: 'ArrowRight', bubbles: true,
}));
assert.equal(document.activeElement, stateButtons[3]);
assert.equal(copied.length, 1);

root.querySelector('[data-d12-stage="stderr-first"]').click();
const middleNext = root.querySelector('[data-d12-next]');
middleNext.focus();
middleNext.click();
assert.equal(root.dataset.stage, 'append-output');
assert.equal(document.activeElement, middleNext, 'middle Next keeps focus on the enabled movement button');

root.querySelector('[data-d12-stage="append-output"]').click();
const lastNext = root.querySelector('[data-d12-next]');
lastNext.focus();
lastNext.click();
assert.equal(lastNext.disabled, true, 'Next is disabled after selecting the last stage');
assert.equal(document.activeElement, root.querySelector('[data-d12-stage="overwrite-output"]'), 'last-stage Next moves focus to the selected stage');

root.querySelector('[data-d12-stage="stderr-first"]').click();
const firstPrev = root.querySelector('[data-d12-prev]');
firstPrev.focus();
firstPrev.click();
assert.equal(firstPrev.disabled, true, 'Prev is disabled after selecting the first stage');
assert.equal(document.activeElement, root.querySelector('[data-d12-stage="stdout-first"]'), 'first-stage Prev moves focus to the selected stage');

for (const lesson of D12_LESSONS) {
  selector.value = lesson.id;
  selector.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(root.dataset.topic, lesson.id);
  assert.equal(root.querySelectorAll('[data-d12-stage]').length, lesson.stages.length);
  assert.equal(root.querySelector('[data-d12-question]').textContent, lesson.question);
  for (let index = 0; index < lesson.stages.length; index += 1) {
    const stage = lesson.stages[index];
    root.querySelector(`[data-d12-stage="${stage.id}"]`).click();
    assert.equal(root.dataset.stage, stage.id);
    assert.equal(root.querySelector('[data-d12-position]').textContent, `${index + 1} / ${lesson.stages.length}`);
    assert.equal(root.querySelector('[data-d12-lead]').textContent, stage.lead, `${stage.id} teaching lead`);
    assert.equal(root.querySelector('[data-d12-evidence-kind]').textContent, stage.evidenceKind);
    assert.equal(root.querySelector('[data-d12-code-kind]').textContent, CODE_LABELS[stage.codeKind], `${stage.id} native/model label`);
    const ranges = expectedRangesFor(stage.id);
    const sourceDetails = root.querySelector('[data-d12-source-details]');
    assert.equal(sourceDetails.hidden, false, `${stage.id} source detail is available`);
    const sourceLinks = [...root.querySelectorAll('[data-d12-source-fragments] a')];
    const sourceSections = [...root.querySelectorAll('[data-d12-source-code] section')];
    assert.equal(sourceLinks.length, ranges.length, `${stage.id} source link count`);
    assert.equal(sourceSections.length, ranges.length, `${stage.id} source body count`);
    for (const [fragmentIndex, [path, start, end]] of ranges.entries()) {
      const label = `${path}:${start}-${end}`;
      const expectedBody = readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n').split('\n').slice(start - 1, end).join('\n');
      assert.equal(sourceLinks[fragmentIndex].textContent, label, `${stage.id} rendered source label ${fragmentIndex + 1}`);
      assert.equal(new URL(sourceLinks[fragmentIndex].href).href, new URL(`../../${path}`, dom.window.location.href).href, `${stage.id} rendered source href ${fragmentIndex + 1}`);
      assert.equal(sourceSections[fragmentIndex].querySelector('h4').textContent, label, `${stage.id} rendered source heading ${fragmentIndex + 1}`);
      assert.equal(sourceSections[fragmentIndex].querySelector('pre code').textContent, expectedBody, `${stage.id} rendered exact source body ${fragmentIndex + 1}`);
    }
    const displayedValues = [...root.querySelectorAll('[data-d12-state] dt')].map((dt, i) => [dt.textContent, dt.nextElementSibling.textContent]);
    assert.deepEqual(displayedValues, stage.values, `${stage.id} rendered independent value rows`);
    const isProse = stage.codeKind === 'original-prose';
    assert.equal(root.querySelector('[data-d12-code-frame]').hidden, isProse, `${stage.id} prose is not presented in a code block`);
    assert.equal(root.querySelector('[data-d12-prose]').hidden, !isProse, `${stage.id} prose view visibility`);
    assert.equal(root.querySelector('[data-d12-code-heading]').textContent, isProse ? '원문 산문과 설명' : '함께 읽을 코드·설명');
    const payload = root.querySelector(isProse ? '[data-d12-prose]' : '[data-d12-code]').textContent;
    assert.equal(payload, stage.code, `${stage.id} displayed code/explanation`);
    assert.equal(root.querySelector('[data-d12-copy]').textContent, isProse ? '현재 산문 복사' : '현재 코드 복사');
    assert.equal(root.querySelector('[data-d12-copy]').disabled, false, `${stage.id} copy available`);
    const focus = stage.image ? D12_ASSETS[stage.image]?.focus?.[stage.id] : null;
    assert.equal(root.querySelector('[data-d12-zoom]').hidden, !focus, `${stage.id} zoom requires verified focus coordinates`);
    root.querySelector('[data-d12-zoom]').click();
    const asset = D12_ASSETS[stage.image];
    const ratio = asset.width * focus[2] / (asset.height * focus[3]);
    assert.equal(root.querySelector('.d12-image-frame').dataset.zoom, 'true', `${stage.id} zoom enabled`);
    assert.equal(root.querySelector('.d12-image-frame').style.getPropertyValue('--d12-zoom-width'), `${540 * ratio}px`, `${stage.id} zoom stays at 540px max height`);
    assert.equal(root.querySelector('[data-d12-focus]').hidden, true, `${stage.id} hides crop marker while zoomed`);
    root.querySelector('[data-d12-zoom]').click();
    assert.equal(root.querySelector('.d12-image-frame').dataset.zoom, 'false', `${stage.id} returns to full image`);
    root.querySelector('[data-d12-copy]').click();
    await Promise.resolve(); await Promise.resolve();
    assert.equal(copied.at(-1), payload, `${stage.id} copies only its displayed payload`);
    assert.equal(root.querySelector('[data-d12-copy-status]').textContent, isProse ? '현재 산문을 복사했습니다.' : '현재 코드를 복사했습니다.');
    assert.equal(root.querySelector('[data-d12-full-evidence]').open, false, `${stage.id} raw evidence stays collapsed`);
  }
}
Object.defineProperty(dom.window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: async () => { throw new dom.window.DOMException('permission denied', 'NotAllowedError'); } },
});
selector.value = 'logs-disk'; selector.dispatchEvent(new Event('change', { bubbles: true }));
root.querySelector('[data-d12-stage="memory-available"]').click();
assert.equal(root.querySelector('[data-d12-code-frame]').hidden, true);
assert.equal(root.querySelector('[data-d12-prose]').hidden, false);
assert.equal(root.querySelector('[data-d12-copy]').textContent, '현재 산문 복사');
root.querySelector('[data-d12-copy]').click(); await Promise.resolve(); await Promise.resolve();
assert.match(root.querySelector('[data-d12-copy-status]').textContent, /현재 표시된 산문을 선택했습니다/);
assert.equal(dom.window.getSelection().toString(), root.querySelector('[data-d12-prose]').textContent);
const proseRange = dom.window.getSelection().getRangeAt(0);
assert.equal(proseRange.startContainer, root.querySelector('[data-d12-prose]'), 'prose fallback selects the visible prose node');
assert.equal(proseRange.commonAncestorContainer, root.querySelector('[data-d12-prose]'));
assert.notEqual(proseRange.commonAncestorContainer, root.querySelector('[data-d12-code]'));
selector.value = 'container-observation'; selector.dispatchEvent(new Event('change', { bubbles: true }));
root.querySelector('[data-d12-stage="container-logs"]').click();
const reload = new JSDOM(`<main>${html}</main>`, { url: dom.window.location.href });
reload.window.matchMedia = () => ({ matches: false, addEventListener() {} });
Object.defineProperty(reload.window.navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
initD12Learning(reload.window.document, reload.window);
assert.equal(reload.window.document.querySelector('[data-d12-learning]').dataset.topic, 'container-observation');
assert.equal(reload.window.document.querySelector('[data-d12-learning]').dataset.stage, 'container-logs');

const pendingWrites = [];
Object.defineProperty(dom.window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: value => new Promise((resolve, reject) => pendingWrites.push({ value, resolve, reject })) },
});
const choose = (topic, stage) => {
  selector.value = topic; selector.dispatchEvent(new Event('change', { bubbles: true }));
  root.querySelector(`[data-d12-stage="${stage}"]`).click();
};
choose('redirect-order', 'stdout-first');
root.querySelector('[data-d12-copy]').click();
choose('redirect-order', 'append-output');
choose('redirect-order', 'stdout-first');
pendingWrites[0].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, '', 'A→B→A old completion is stale');

root.querySelector('[data-d12-copy]').click();
root.querySelector('[data-d12-stage="stdout-first"]').click();
pendingWrites[1].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, '', 'reselecting the same A invalidates an old copy');

root.querySelector('[data-d12-copy]').click();
root.querySelector('[data-d12-copy]').click();
pendingWrites[3].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, '현재 코드를 복사했습니다.');
pendingWrites[2].reject(new Error('older reverse completion')); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, '현재 코드를 복사했습니다.', 'older reverse completion cannot override the newest copy');

const deferredRejects = [];
Object.defineProperty(dom.window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: value => new Promise((resolve, reject) => deferredRejects.push({ value, resolve, reject })) },
});
choose('redirect-order', 'stdout-first');
root.querySelector('[data-d12-copy]').click();
choose('redirect-order', 'append-output');
choose('redirect-order', 'stdout-first');
deferredRejects[0].reject(new Error('stale A→B→A rejection')); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, '', 'A→B→A stale rejection cannot select old source');

root.querySelector('[data-d12-copy]').click();
root.querySelector('[data-d12-stage="stdout-first"]').click();
deferredRejects[1].reject(new Error('stale same-A rejection')); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, '', 'same-A stale rejection cannot select old source');

root.querySelector('[data-d12-copy]').click();
root.querySelector('[data-d12-copy]').click();
deferredRejects[3].reject(new dom.window.DOMException('newer denied', 'NotAllowedError')); await Promise.resolve(); await Promise.resolve();
const currentFallback = root.querySelector('[data-d12-copy-status]').textContent;
assert.match(currentFallback, /현재 표시된 코드를 선택했습니다/);
deferredRejects[2].resolve(); await Promise.resolve(); await Promise.resolve();
assert.equal(root.querySelector('[data-d12-copy-status]').textContent, currentFallback, 'newer rejection fallback survives older success');

Object.defineProperty(dom.window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: async () => { throw new dom.window.DOMException('permission denied', 'NotAllowedError'); } },
});
root.querySelector('[data-d12-copy]').click(); await Promise.resolve(); await Promise.resolve();
assert.match(root.querySelector('[data-d12-copy-status]').textContent, /현재 표시된 코드를 선택했습니다/);
assert.equal(dom.window.getSelection().toString(), root.querySelector('[data-d12-code]').textContent);

root.querySelector('[data-d12-original-link]').click();
assert.equal(document.getElementById('d12-original').open, true);

console.log('D12 learning UI and canonical 45-state contract passed');
