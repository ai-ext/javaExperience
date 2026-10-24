# 장애 훈련 스크립트 공통(start·inject·recover가 source한다). 부르기 전에 OUT을 정한다.
# macOS 기본 bash 3.2와 flock 없는 환경에서도 돌게 mkdir 잠금을 쓴다.

now() { date '+%Y-%m-%d %H:%M:%S %z'; }

LOCK="$OUT/toxiproxy.lock"

# 예약 등록·주입·복구가 동시에 끼어들지 않게 한다. 10초 안에 못 잡으면 실패.
lock() {
  local holder
  for _ in $(seq 1 100); do
    if mkdir "$LOCK" 2>/dev/null; then
      echo $$ >"$LOCK/pid"
      return 0
    fi
    # 죽은 잠금도 자동으로 지우지 않는다. 동시 정리자가 새 소유자의 잠금을 지울 수 있다.
    # pid를 아직 쓰지 않은 순간은 기다린다. 수동 정리는 모든 훈련 스크립트를 멈춘 뒤에만 한다.
    holder=$(cat "$LOCK/pid" 2>/dev/null || true)
    if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
      echo "죽은 프로세스의 잠금이 남았다($LOCK, pid=$holder)." >&2
      echo "모든 훈련 스크립트(start·inject·recover)를 멈추고 pid가 종료됐는지 확인한 뒤 이 잠금 디렉터리만 지우고 다시 실행한다." >&2
      return 1
    fi
    sleep 0.1
  done
  return 1
}

unlock() {
  [ "$(cat "$LOCK/pid" 2>/dev/null)" = "$$" ] && rm -rf "$LOCK"
  return 0
}

