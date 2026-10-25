# D12 Linux proof 독립 재검수 2차

**명세 PASS, 품질 PASS WITH MINOR — Critical 0 / Important 0 / Minor 1.** 기존 FAIL 보고서는 보존했다. 문장 1건을 정정하면 되며 Linux 재실행은 필요 없다.

검수 대상: attempt-0665b1344c5b.json. proof.py SHA-256 `68db36173308d620a1baa12cd2d097c62fca11c3ed59084fda183c302b8c21a9`; run_proof.py `e2a87cc5aeffebc4b39b53d1db5e8b8c26c7cbf2be6829e427a6e19f17f682ac`. 원문330행 SHA-256 `bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c` 일치를 확인했다.

## 명세 검수

- 원본 baseline exit0. active pipefail만 비활성화한 독립 temp mutant는 exit1이며 실제 aggregate status assertion에서 거절됐다. `$?`와 PIPESTATUS 동시 캡처는 default0/pipefail7, 단계별7/0을 구분했다.
- df는 실제 write 전후, unlink-open, close 네 시점으로 분리됐다. 별도 독립 실험에서 Used0→8388608→8388608→0 및 free block32768→30720→30720→32768을 관측했다.
- import 및 호스트 직접 실행 거절 전 mkdir/chmod 호출0, Docker override 제거·비Unix/빈 endpoint 거절·고정 --host, ID/nonce 불일치 cleanup 보류 등9건을 통과했다. negative guard/cleanup은 실제 소스에 mock subprocess를 적용했으며 원격 호출이나 타인 자원 삭제는 하지 않았다.
- 동일 소스의 스트림·export/PATH/cd·nonroot 권한·자식 신호·HTTP503→200·unlink-open·local rsync dry-run을 독립 Linux 컨테이너에서 확인했다. 별도 컨테이너의 실제 PID1 sleep과 exec 전후 불변도 확인했다.
- 자기 nonce/이름/ID 컨테이너4개만 동일 fullID로 정리하고 모두 부재를 확인했다.

## 품질 검수

소스와 원출력의 경계를 대조했다. root는 fixture 계정·소유권을 준비하는 orchestrator이며 권한 결론은 UID1000/1001/1002와 빈 supplementary groups에서 얻었다. HTTP는 network none 컨테이너 내부 loopback 실측으로 외부 접근성을 증명하지 않는다. SSH/systemd/Spring Boot는 실행하지 않았다. TERM/KILL의 실측은 ack후생존→release후exit0 및 KILL Popen-9이고 cleanup marker 비교실험은 아니다.

**Q-M1 Minor:** PROOF-IMPLEMENTATION.md가 proof.py 자체 guard가 read-only mount를 확인한다고 적었다. 실제 guard는 파일 존재와 읽기 permission bit만 확인한다. readonly bind는 runner의 Docker create 옵션 및 inspect 근거다.

정정 문장: proof.py는 import 때 filesystem 변경을 하지 않는다. Linux, /.dockerenv, 명시적인 lab marker, /proof/proof.py 파일과 읽기 permission bit를 확인한 뒤에만 /tmp/d12-proof를 만들고 mode를 설정한다. read-only bind mount는 runner의 Docker 생성 옵션과 실행 전 inspect로 확인한다.

기존18개 attempt는 실패15·성공3으로 현재 파일을 다시 집계했다. 초기 실패의 source fingerprint 부재는 남는 역사적 검증 한계다. 과거 성공 기록이 새 source까지 증명한다고 취급하지 않았다.

## 증거

전체 보고: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-review-attempt2.json

실제 Linux 원출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-logs/independent-attempt2-d9c6399f991486bd.json

guard·소유 ID 반례 원출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-logs/guard-checks-attempt2.json

기존 attempt 해시·실패 집계: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-logs/attempt2-original-attempt-index.json

기존 FAIL 보고서: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-review.json

AGENTS·RESUME·구현·이미지·UI·기존원출력은 이 리뷰에서 수정하지 않았다. 커밋하지 않았다.
