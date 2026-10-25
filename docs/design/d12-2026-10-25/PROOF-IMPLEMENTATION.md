# D12 실제 Linux 격리 proof 구현

## 실행 개요

- 기준 원문: `docs/knowledge/D12-linux-terminal-basics.md` 330행, SHA-256 `bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c`.
- 대상 image: 공식 `python:3.12-slim`; 실행 당시 base digest, 최종 image ID·크기·platform은 최신 성공 attempt JSON에 기록했다. 로컬 Docker Desktop의 Unix socket context를 확인한 뒤에만 pull/build/run했다.
- 컨테이너: 비특권, `network=none`, read-only rootfs, `/tmp` 128 MiB 전용 tmpfs, CPU 1, memory 256 MiB, PID limit 128. `/proof`에는 이 폴더만 read-only bind mount했다. 실제 PID namespace와 PID 1을 사용하며 host PID/network/root/Docker socket은 공유하지 않는다.
- 실험은 Linux kernel/container의 합성 fixture다. macOS/APFS, 운영 서비스·DB·로그, 사용자 계정·환경, 네트워크 외부 경로를 관찰하거나 변경하지 않았다. 프로그램은 `/.dockerenv`, Linux platform, 고정 lab marker 확인 후에만 `/tmp/d12-proof`를 만든다.

## 실행 및 증거

호스트 실행은 `python3 docs/design/d12-2026-10-25/source-proof/run_proof.py`다. runner는 Docker 명령을 `subprocess` argv와 `shell=False`로 실행하고, 원본 stdout/stderr/exit status 및 전체 명령을 보존한다. 매 실행에 임의 nonce를 붙이고 Docker label·이름·ID 일치 확인 후 자체 컨테이너만 정리한다. 재현을 위해 소유 image는 남긴다.

- `source-proof/proof.py`: Linux 내부 fixture 및 독립 assertion.
- `source-proof/run_proof.py`: host Docker 격리·수집·소유 자원 정리.
- `Dockerfile`: 공식 slim image에 Debian 공식 저장소의 필요한 진단 패키지만 설치.
- `proof-logs/attempt-<nonce>.json`: 성공/실패 실행 기록, Docker argv·원출력, source SHA-256, base image digest, image ID/크기/platform, 제한·mount·cleanup, 실제 Linux JSON 결과와 사전 독립 기대값.
- `proof-logs/linux-output-<nonce>.json`: 컨테이너에서 출력한 원본 JSON 그대로.

실패한 시도도 지우지 않았다. 초기 시도에서 확인된 문제는 redirection 적용 범위, Bash pipeline status 캡처, tmpfs 기본 noexec, Bash `type cd` 출력 표기, 제한된 `PATH`에 Python 경로가 없는 점, fixture 상위 디렉터리 탐색 권한이었다. 원출력에 근거해 fixture/harness를 수정했고, 기대값을 실제 결과에 맞추지는 않았다. 이 검토 수정 착수 전 기존 15개 파일은 13 실패·2 성공으로 집계됐다. 이후 추가한 endpoint 시험 실패, runner 인덱싱 실패, 최신 성공을 포함한 현재 누계는 파일 목록에서 동적으로 계산한다. Attempt JSON은 append-only로 둔다.

### Sol 재검토 반영

- Bash pipeline은 pipeline 직후 `snapshot=("$?" "${PIPESTATUS[@]}")` 한 명령 확장에서 종료 상태와 각 단계 상태를 함께 보존한다. 최신 Linux 관측은 기본 모드 전체 pipeline exit 0, `STATUS=0 PIPESTATUS=7 0`; `pipefail` 전체 exit 7, `STATUS=7 PIPESTATUS=7 0`이었다. `set -o pipefail` 제거 mutant는 exit 0으로 관측되어 요구 exit 7 assertion에서 거부됐다.
- `df_before_write`는 8 MiB 실제 쓰기 전에 실행한다. `df_after_write`, `df_after_unlink_open_fd`, `df_after_close`를 나눠 기록하고, 각 시점에 대응하는 `statvfs`도 보존한다. `/tmp` 전용 tmpfs 수치만 의미가 있다.
- Runner는 `DOCKER_HOST`, `DOCKER_CONTEXT`, TLS/cert/API override 환경변수를 제거한 환경에서 설정된 `desktop-linux` context endpoint가 Unix socket인지 검증한다. 이후 모든 Docker CLI argv에 `docker --host unix:///Users/ds/.docker/run/docker.sock`을 지정했다.
- Cleanup은 컨테이너 이름이 아닌 생성 당시 저장한 container ID로 inspect한다. ID와 nonce label이 모두 일치한 경우에만 같은 ID로 `docker rm --force`를 실행한다. 최신 두 container cleanup의 명령 exit는 각각 0이다.
- `proof.py`는 import 때 filesystem 변경을 하지 않는다. Linux, `/.dockerenv`, 명시적인 lab marker, `/proof/proof.py` 파일과 읽기 permission bit를 확인한 뒤에만 `/tmp/d12-proof`를 만들고 mode를 설정한다. read-only bind mount는 runner의 Docker 생성 옵션과 실행 전 inspect로 확인한다.

## 실제 관측과 원문 예시의 경계

| 원문 주제 | 이번 Linux 실행에서 확인한 것 | 구현 차이 및 범위 |
|---|---|---|
| Bash stream/redirection/pipeline | `>`, `2>&1`의 순서별 파일·부모 stream·exit, 덮어쓰기/추가, 기본 pipeline status와 `pipefail`, `PIPESTATUS` | 원문 명령의 실제 producer 대신 합성 producer가 `out`, `err`, exit 7을 냈다. 실제 `journalctl`/서비스 로그는 실행하지 않았다. |
| `export`, `PATH`, `cd` | 깨끗한 합성 Bash 환경에서 export 전후 자식 변수, 두 PATH 순서의 선택 실행파일, `pwd`와 builtin 확인 | `JAVA_HOME`, host `PATH`, host 환경 전문은 읽거나 출력하지 않았다. Bash는 `PATH=/usr/bin:/bin`, `LC_ALL=C`와 명시한 demo 변수만 받았다. |
| 권한·경로 탐색 | `/tmp` fixture 640 파일을 UID/GID 1000:2000, 1001:2000, 1002:3000으로 실제 open. 상위 x 없음, x만 있고 r 없음, 444 파일에 대한 부모 디렉터리 w+x unlink도 관측. UID 0 표본은 별도 | 사용자/그룹은 container 내부 숫자 ID, groups는 빈 배열이다. root 표본은 non-root 결론에 합치지 않았다. ACL·LSM·운영 mount를 조사하지 않았다. |
| PID/signal | 직접 시작한 child의 PID와 `/proc/<pid>/stat` starttime 확인 후 `kill -TERM`; handler ack 뒤 release 전 생존, release 후 exit. 별도 child에 KILL 후 Python Popen의 실제 종료 표현 기록 | `ps`, `kill`은 자기 fixture PID만 대상으로 했다. `systemctl`, 기존 프로세스, 전체 프로세스 목록은 조회하지 않았다. |
| socket/TCP/HTTP readiness | 별도 Python HTTP child가 `127.0.0.1` ephemeral port에서 실제 listen. `ss`, `nc`, curl 503 `warming` 후 제어 ready flag로 200 `ready`를 관측 | 이는 Python fixture process/HTTP이며 `systemd Type=exec` 또는 Spring Boot 기동 결과가 아니다. network 외부, ICMP ping, 운영 포트는 확인하지 않았다. |
| `df`/`du`와 unlink-open | tmpfs에 8 MiB를 실제 write·flush·fsync. `stat`, `st_blocks`, `du`, `df`, `statvfs`; fd를 연 채 unlink 후 닫기 전후 공간을 기록 | 값은 해당 컨테이너 tmpfs의 이번 관측뿐이며 호스트 APFS나 운영 디스크 수치로 일반화하지 않는다. |
| `rsync --dry-run` | 로컬 합성 source/destination에서 dry-run 출력과 전후 destination SHA-256이 동일함을 확인 | SSH, identity key, 원격 호스트, 실제 복사는 사용하지 않았다. 이 결과는 SSH 인증/전송 증거가 아니다. |
| Docker logs/exec | 자체 label의 두 번째 컨테이너에서 synthetic bootline, 실제 PID 1 comm/cmdline, `docker exec` 추가 shell PID와 exec 후 불변 PID 1을 확인 | PID 1이 systemd라고 가정하지 않았다. host PID namespace가 아니며, 원문 `docker logs/exec`를 실제 이 추가 disposable container에 적용했다. |

## 실행하지 않은 원문 명령·주제

실제 `ssh`, `scp`, Java 25 jar, `systemctl`, systemd unit 변경/기동, `journalctl`, `sudo`, `free`, `ping`/ICMP, `lsof`, 운영 파일·서비스 명령은 실행하지 않았다. systemd/SSH 문장은 원문·공식 문서의 개념 설명으로 남기며 runtime 성공으로 표현하지 않는다. 로컬 rsync 실측은 D12의 원격 dry-run 예시와 다른 명령 범위다.

세부 assertion의 실제 값과 오류 코드, 명령별 stdout/stderr/exit, container 자원 상태, Docker cleanup 기록, source/image 식별자는 `proof-logs/` JSON을 기준으로 본다. source-only Python compile·import guard 검사와 실제 Docker Linux 실행을 구분한다. Attempt 수는 `python3 -c 'import glob,json,collections; fs=glob.glob("proof-logs/attempt-*.json"); c=collections.Counter("failure" if json.load(open(f)).get("failure") else "success" for f in fs); print(len(fs),dict(c))'`로 현재 파일 목록에서 계산한다. 이번 재검토 실행 후 목록 집계는 18개(실패 15, 성공 3)다.
