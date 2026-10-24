#!/usr/bin/env bash
# B12 재현: 새 프론트 도메인(http://127.0.0.1:8765)에서만 API 호출이 실패한다.
#
# 전제
#   1) messy-server에서 `docker compose up -d`
#   2) `./gradlew bootRun --args='--spring.profiles.active=local'` (포트 8080)
#   3) curl. 브라우저 확인(아래 browser 모드)에는 python3
#
# 실행
#   bash tickets/B12/repro.sh            curl로 브라우저의 preflight를 흉내 낸다
#   bash tickets/B12/repro.sh browser    127.0.0.1:8765에 작은 프론트 페이지를 띄운다(Ctrl+C로 종료).
#                                        브라우저로 http://127.0.0.1:8765/ 를 열고 개발자 도구 Network 탭에서
#                                        실패한 OPTIONS 요청과 Console의 CORS 오류를 본다. localhost:3000 대신
#                                        이 주소로 열어야 "새 도메인" 상황이 된다.
#
# 기대 증상(결함 상태): 기존 출처(localhost:3000)의 preflight는 200이고 Access-Control-Allow-Origin이 붙는다.
#                       새 출처(127.0.0.1:8765)의 preflight는 403 "Invalid CORS request"이고 허용 헤더가 없다.
#                       서버 로그에는 에러가 남지 않는다. 수정 뒤에는 두 출처 모두 200.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}

if [ "${1:-}" = "browser" ]; then
  dir=$(mktemp -d)
  cat >"$dir/index.html" <<HTML
<!doctype html><meta charset="utf-8"><title>새 프론트</title>
<p>개발자 도구(Network·Console)를 연 채로 버튼을 누른다.</p>
<button id="b">로그인 요청 보내기</button><pre id="out"></pre>
<script>
document.getElementById('b').onclick = async () => {
  const out = document.getElementById('out');
  try {
    const r = await fetch('$BASE/api/auth/login', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email: 'admin@board.local', password: 'Admin1234!'})});
    out.textContent = r.status + ' ' + await r.text();
  } catch (e) { out.textContent = '실패: ' + e; }
};
</script>
HTML
  echo "http://127.0.0.1:8765/ 를 브라우저로 연다 (Ctrl+C로 종료)"
  cd "$dir" && exec python3 -m http.server 8765 --bind 127.0.0.1
fi

preflight() {
  echo "== preflight OPTIONS $2  Origin: $1"
  curl -s -i -X OPTIONS "$BASE$2" -H "Origin: $1" \
    -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: authorization,content-type' \
    | grep -iE '^HTTP/|^access-control-|invalid cors' || true
  echo
}

preflight http://localhost:3000 /api/posts
preflight http://127.0.0.1:8765 /api/posts
preflight http://127.0.0.1:8765 /api/auth/login
