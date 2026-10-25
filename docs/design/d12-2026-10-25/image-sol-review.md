# D12 선정 이미지 독립 검수

**명세 PASS / 품질 PASS WITH MINOR — Critical 0 / Important 0 / Minor 1.** 선정16개를 모두 개별 native 크기로 실제 열어 보았다. 거절2개도 거절사유를 직접 확인했다. 기존 proof 검수는 보존했다.

선정16개 모두 외부raw PNG와 동일1672×941 크기이며, JPEG Q92를 /tmp에 독립 재변환한 결과가 선정JPG와 SHA-256 byte 동일했다. manifest SHA·bytes·format·prompt·generation record를 대조했다. 대상 폴더에 PNG는 없다.

## 이미지별 확인

| 이미지 | 실제 눈검수 | 사실·경계 |
|---|---|---|
| redirect-order | PASS | a.log out+err, b.log out; second parent stdout err; exits7; order arrows correct |
| shell-boundary | PASS | pwd/type cd/cd /tmp/pwd; /proof→builtin→/tmp |
| append-overwrite | PASS | a before out+err after out+err+append; b before out after replace; parentstreams absent; exits0 |
| pipeline-status | PASS | stdout passes cat, stderr direct parent; producer7/cat0; PIPESTATUS[7,0]; aggregate0 vs7 |
| environment-path | PASS | DEMO_ONLY local→child unset; exported→synthetic; path-first and path-second actual paths select first/second |
| file-permissions | PASS | file UID1000/GID2000 mode640; 1000:2000 RW,1001:2000 R-only,1002:3000 none errno13 |
| directory-permissions-v2 | PASS | root-owned no-x700+known644 denied; x-no-read711+known644 read known but list denied; UID1002-owned entry-delete700 removes root-owned444 entry |
| socket-http | PASS | 127.0.0.1:44397 LISTEN,TCPexit0,HTTP503 warming and200 ready,curl0 without --fail |
| ssh-transfer | PASS | server host key/known_hosts distinct from client private key/authorized_keys; local rsync new.txt listed,dst SHA unchanged |
| signal-lifecycle-v2 | PASS | TERM PID40 commandexit0→ack/alivetrue→release Popen0; separate sleep30 PID44 KILL commandexit0→Popen-9 |
| systemd-start | PASS | Type=exec/User=orders/Group=orders/WorkingDirectory=/opt/orders/EnvironmentFile=-/etc/orders/orders.env and After=network.target match original excerpt; - prefix permits missing file; KEY=value not shell execution |
| unit-application | PASS | edited filev2/managerv1/processv1; reload filev2/managerv2/processv1; successful restart assumed newv2; enable vs enable --now requests distinguished |
| disk-unlink | PASS | 8MiB8388608; /tmp/d12-proof/disk/8m.bin; available134176768→125788160→125788160→134176768; du file8388608 then absent exit1; unlink while fdopen,close frees |
| container-observation | PASS | idle PID1 sleep300; additional exec shell PID19; before/after PID1 sleep; D12 synthetic bootline matches original Docker stdout |
| log-sources | PASS | systemd journal vs app.log; journalctl -u orders versus grep -n ERROR app.log and tail -f app.log; different query scopes |
| memory-available | PASS_WITH_MINOR | df filesystem space vs du selected path allocation vs free memory; available considers reclaimable cache; no measured free values |

## 경미한 표현 한계

df는 tmpfs 등도 포함한 마운트된 파일시스템을 기준으로 보고하므로 물리 디스크/파티션 단위와 동일하다고 일반화하면 부정확하다. 같은 카드 제목과 bullet에는 파일시스템 단위라고 정확히 적혀 있어 전체 의미를 차단하는 결함은 아니다.

DOM 핵심 설명에서 df의 측정 단위는 파일시스템이며 물리 디스크/파티션과 반드시 같지 않음을 명확히 한다. 재생성 시 해당 문장을 파일시스템 단위로 통일한다.

## 검증 범위

PID40/44, loopback44397, file UID1000:GID2000, 관측1000:2000·1001:2000·1002:3000, 640/700/711/444, exit7/0/Popen-9, 8MiB8388608과available134176768→125788160→125788160→134176768을 canonical attempt0665 원출력과 대조했다. idle PID1sleep300/exec19/bootline도 일치한다.

SSH rsync 명령은 이미지의 축약 표기이며 실제 -av·절대경로 argv와 동일한 리터럴 명령으로 부르면 안 된다. producer와 basename 명령도 도식 표기와 실제 argv를 구분한다. systemd/journal/free는 미실행 설명이다. container표는 관측대상만 고른 도식으로 전체 ps 원출력이 아니다.

거절 directory-permissions는 /data·readonly파일 UID1002 소유자를 발명했고, signal-lifecycle는 실측없는12:34:56.789·Python sleep60을 추가했다. 둘 다 선정manifest에서 제외되어 있으며 UI 연결 대상이 아니다.

FOCUS-DESIGN의45좌표는 design/pending 상태다. 이 보고서는 실제 UI crop·540px 확대·DOM실제argv·복사·reader·검색·overflow 검증을 완료했다고 표시하지 않는다. fullDocumentComplete=false다.

전체 보고: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-review.json

16개 자산검증 원출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-sol-logs/assets-16-selected.json

선정manifest: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/selected-images.json

생성·거절 이력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/image-records.json

이미지·구현·기존 proof·보호문서는 수정하지 않았고 커밋하지 않았다.
