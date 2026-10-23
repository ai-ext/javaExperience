# 장애 훈련 스크립트 공통(start·inject·recover가 source한다). 부르기 전에 OUT을 정한다.
# macOS 기본 bash 3.2와 flock 없는 환경에서도 돌게 mkdir 잠금을 쓴다.

now() { date '+%Y-%m-%d %H:%M:%S %z'; }

LOCK="$OUT/toxiproxy.lock"

# 주입과 복구가 Toxiproxy를 동시에 바꾸지 않게 한다. 10초 안에 못 잡으면 실패.
lock() {
  local holder
  for _ in $(seq 1 100); do
    if mkdir "$LOCK" 2>/dev/null; then
      echo $$ >"$LOCK/pid"
      return 0
    fi
    # 잡은 프로세스가 죽고 남은 잠금은 치운다(pid를 아직 안 쓴 순간은 건드리지 않는다)
    holder=$(cat "$LOCK/pid" 2>/dev/null || true)
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
      rm -rf "$LOCK"
      continue
    fi
    sleep 0.1
  done
  return 1
}

unlock() {
  [ "$(cat "$LOCK/pid" 2>/dev/null)" = "$$" ] && rm -rf "$LOCK"
  return 0
}

# PID가 아직 start.sh의 예약 프로세스인지 본다(남은 pid 파일의 번호가 다른 프로세스에 재사용됐을 수 있다)
is_scheduler() {
  ps -p "$1" -o command= 2>/dev/null | grep -q 'start\.sh'
}
