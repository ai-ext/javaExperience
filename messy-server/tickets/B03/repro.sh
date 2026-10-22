#!/usr/bin/env bash
# B03 재현: 예외를 잡았는데도 구매가 롤백된다 / 안 된다.
#
# 전제
#   1) messy-server에서 `docker compose up -d` (MySQL 13311)
#   2) 구매 감사 쿠폰 이벤트를 켜고 기동:
#      `./gradlew bootRun --args='--spring.profiles.active=local --board.shop.thanks-coupon-id=9001'` (포트 8080)
#   3) curl, jq, docker compose(MySQL 셸 접속용)
#
# 실행: bash tickets/B03/repro.sh
#
# 하는 일과 기대 증상(결함 상태)
#   A. 포인트가 모자란 회원이 쿠폰을 써서 주문 → 409 insufficient-points.
#      그런데 재고가 1 줄고, 쿠폰은 USED, 주문 행도 남는다(롤백이 안 된다).
#   B. 감사 쿠폰(9001)이 다 떨어진 상태에서 포인트가 충분한 회원이 주문 → 201이어야 하는데 500.
#      그런데 주문 행은 생기고 포인트도 빠져 있다.
#   서버 로그(`logging.level.org.springframework.transaction=DEBUG`를 붙이면 더 잘 보인다)에서
#   `UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only`를 찾는다.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
sql() { docker compose exec -T mysql mysql -uboard -pboard board -N -e "$1" 2>/dev/null; }

token_for() {
  local email="b03-$1-$RANDOM$RANDOM@t.com" nick="b03u$1x$RANDOM"
  curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\",\"nickname\":\"$nick\"}" >/dev/null
  curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"passw0rd1\"}" | jq -r .accessToken
}
member_id() { curl -s "$BASE/api/members/me" -H "Authorization: Bearer $1" | jq -r .id; }
order() {
  curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/shop/orders" -H "Authorization: Bearer $1" \
    -H "Idempotency-Key: $(uuidgen)" -H 'Content-Type: application/json' -d "$2"
}

# 감사 쿠폰 9001: 1장짜리를 이미 다 나눠 준 상태로 만든다. 할인 쿠폰 9002는 넉넉하게.
sql "INSERT IGNORE INTO coupon (id, name, total_quantity, issued_quantity, expires_at, created_at, updated_at)
     VALUES (9001, '구매 감사 쿠폰', 1, 1, NOW(6) + INTERVAL 30 DAY, NOW(6), NOW(6)),
            (9002, 'B03 할인 쿠폰', 100, 0, NOW(6) + INTERVAL 30 DAY, NOW(6), NOW(6));
     UPDATE coupon SET issued_quantity = total_quantity WHERE id = 9001;"

echo "== A. 포인트 부족 + 쿠폰 사용 주문"
ta=$(token_for a); ida=$(member_id "$ta")
mc=$(curl -s -X POST "$BASE/api/coupons/9002/issue" -H "Authorization: Bearer $ta" | jq -r .memberCouponId)
before=$(sql "SELECT stock FROM shop_item WHERE id = 3")
echo "응답: $(order "$ta" "{\"itemId\":3,\"quantity\":1,\"memberCouponId\":$mc}") (기대 409)"
echo "재고 $before → $(sql "SELECT stock FROM shop_item WHERE id = 3") (그대로여야 한다)"
echo "쿠폰 상태: $(sql "SELECT status FROM member_coupon WHERE id = $mc") (UNUSED여야 한다)"
echo "주문 행: $(sql "SELECT COUNT(*) FROM shop_order WHERE member_id = $ida") (0이어야 한다)"

echo "== B. 감사 쿠폰 소진 뒤 일반 주문"
tb=$(token_for b); idb=$(member_id "$tb")
sql "UPDATE member SET point_balance = 5000 WHERE id = $idb"
echo "응답: $(order "$tb" '{"itemId":1,"quantity":1}') (기대 201)"
echo "주문 행: $(sql "SELECT COUNT(*) FROM shop_order WHERE member_id = $idb"), 잔액: $(sql "SELECT point_balance FROM member WHERE id = $idb")"
