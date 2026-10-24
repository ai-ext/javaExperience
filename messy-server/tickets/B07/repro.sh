#!/usr/bin/env bash
# B07 재현: 선착순 쿠폰을 동시에 받을 때 가끔 실패한다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311, Redis 16380)
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl, jq, docker compose(MySQL 셸 접속용)
#
# 실행: bash tickets/B07/repro.sh   (N=30 bash ... 로 인원을 바꿀 수 있다)
#
# 하는 일: 수량 N장짜리 쿠폰을 새로 만들고 회원 N명이 동시에 발급을 누른다. 응답 코드를 세고,
#          이번 실행 동안 MySQL이 낸 데드락 오류(1213) 수와 SHOW ENGINE INNODB STATUS의 LATEST DETECTED DEADLOCK 절을 출력한다.
#          데드락 기록은 실행 전 기록과 시각이 같으면(이번 실행에서 새로 난 데드락이 아니면) 그렇다고 알려 준다.
#          진단 조회(performance_schema, INNODB STATUS)는 PROCESS 권한이 필요해 root로 한다(compose의 DB_ROOT_PASSWORD, 기본 root).
# 기대 증상(결함 상태): 수량이 충분한데도 일부가 500으로 실패한다. 서버 로그에 `Deadlock found when trying to get lock`(1213),
#   데드락 절에는 두 트랜잭션이 보인다. 한쪽은 member_coupon의 uk_member_coupon_coupon_member 인덱스 락(`lock_mode X`, 새 쿠폰이면 supremum)을
#   쥔 채 coupon 행 락(update coupon)을 기다리고, 다른 쪽은 그 coupon 행 락을 쥔 채 같은 자리의 `insert intention` 락을 기다린다.
#   수정 뒤에는 N명 모두 201이고 1213 증가는 0이다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
if ! curl -sf -o /dev/null "$BASE/actuator/health"; then
  echo "서버($BASE)에 닿지 않는다. 맨 위 주석의 전제(docker compose up -d, bootRun)를 먼저 확인하라." >&2
  exit 1
fi
N=${N:-20}
sql() { docker compose exec -T mysql mysql --default-character-set=utf8mb4 -uboard -pboard board -N -e "$1" 2>/dev/null; }
# root 진단 조회. 비밀번호 경고만 지우고 오류는 그대로 보인다.
rootsql() { docker compose exec -T mysql mysql -uroot -p"${DB_ROOT_PASSWORD:-root}" -N -e "$1" 2> >(grep -v 'Using a password' >&2); }
deadlock_errors() { rootsql "SELECT SUM_ERROR_RAISED FROM performance_schema.events_errors_summary_global_by_error WHERE ERROR_NUMBER = 1213"; }
latest_deadlock() { rootsql "SHOW ENGINE INNODB STATUS\G" | sed -n '/LATEST DETECTED DEADLOCK/,/^TRANSACTIONS$/p'; }

token_for() {
  local email="b07-$1-$RANDOM$RANDOM@t.com" nick="b07u$1x$RANDOM"
  curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"$nick\"}" >/dev/null
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken
}

sql "INSERT INTO coupon (name, total_quantity, issued_quantity, expires_at, created_at, updated_at)
     VALUES ('B07 선착순', $N, 0, NOW(6) + INTERVAL 1 DAY, NOW(6), NOW(6))"
cid=$(sql "SELECT MAX(id) FROM coupon")
echo "쿠폰 ${cid}번(수량 ${N}장), 회원 ${N}명 준비"
tokens=()
for i in $(seq 1 "$N"); do tokens+=("$(token_for "$i")"); done

deadlocks_before=$(deadlock_errors)
deadlock_stamp_before=$(latest_deadlock | sed -n 3p)
out=$(mktemp)
for t in "${tokens[@]}"; do
  curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/coupons/$cid/issue" -H "Authorization: Bearer $t" >>"$out" &
done
wait
echo "응답 코드 분포(기대: 201 ${N}건):"
sort "$out" | uniq -c
echo "issued_quantity=$(sql "SELECT issued_quantity FROM coupon WHERE id = $cid"), 발급 행=$(sql "SELECT COUNT(*) FROM member_coupon WHERE coupon_id = $cid")"
rm -f "$out"

echo "이번 실행에서 MySQL이 낸 데드락 오류(1213): $(( $(deadlock_errors) - deadlocks_before ))건"
echo "--- LATEST DETECTED DEADLOCK"
record=$(latest_deadlock)
if [ -z "$record" ]; then
  echo "(데드락 기록이 없다)"
elif [ "$(sed -n 3p <<<"$record")" = "$deadlock_stamp_before" ]; then
  echo "(기록 시각이 실행 전과 같다: 이번 실행에서 새로 난 데드락이 아니다 — $deadlock_stamp_before)"
else
  head -60 <<<"$record"
fi
