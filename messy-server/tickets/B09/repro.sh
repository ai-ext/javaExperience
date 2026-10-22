#!/usr/bin/env bash
# B09 재현: 자정 전후 출석 포인트가 두 번 쌓인다.
#
# 전제
#   1) Docker 실행 중(테스트가 Testcontainers로 MySQL·Redis를 띄운다). compose·bootRun은 필요 없다.
#   2) JDK 21 (JAVA_HOME).
#   실행 중인 서버의 시계는 마음대로 돌릴 수 없어서, 시계(Clock 빈)를 고정한 일회용 테스트로 재현한다.
#
# 실행: bash tickets/B09/repro.sh
#
# 하는 일: messy-server를 임시 디렉터리에 복사하고(원본은 그대로), 서버 시계를 운영과 같은 UTC 영역으로 둔 채
#          시각만 바꿔 가며 POST /api/me/attendance를 두 번씩 부른다. 각 경우의 응답 코드·출석 날짜·적립 건수를 찍는다.
#   A) KST 2026-10-23 08:59:59 → 09:00:00  (같은 KST 날짜, 사이에 UTC 자정이 있다)
#   B) KST 2026-10-23 23:59:59 → 10-24 00:00:00  (KST 자정을 넘는다)
# 기대 증상(결함 상태)
#   A) 201, 201 — 같은 KST 날짜인데 출석 적립 2건(attendedOn 2026-10-22, 2026-10-23)
#   B) 201, 409 — 다음 날 첫 출석이 "이미 출석"으로 거절되고 적립 1건
#   운영 로그(UTC 시각)로 보면 A의 두 요청은 23:59:59와 00:00:00, 즉 "자정 전후"에 찍힌다.
# 수정 뒤: A) 201, 409 (1건)  B) 201, 201 (2건)
set -euo pipefail

src=$(cd "$(dirname "$0")/../.." && pwd -P)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
rsync -a --exclude build --exclude .gradle --exclude tickets "$src/" "$work/"
cd "$work"

cat > src/test/java/com/example/board/B09ReproTest.java <<'JAVA'
package com.example.board;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class B09ReproTest extends ApiTestSupport {

    static final AtomicReference<Instant> NOW = new AtomicReference<>(Instant.now());

    @TestConfiguration(proxyBeanMethods = false)
    static class UtcClock {
        @Bean
        @Primary
        Clock reproClock() {
            return new Clock() {
                public ZoneId getZone() { return ZoneOffset.UTC; }
                public Clock withZone(ZoneId z) { return Clock.fixed(NOW.get(), z); }
                public Instant instant() { return NOW.get(); }
            };
        }
    }

    void scenario(String name, String firstKst, String secondKst) throws Exception {
        Member m = newMember(Role.USER);
        StringBuilder out = new StringBuilder("B09 " + name + ":");
        for (String kst : new String[] {firstKst, secondKst}) {
            NOW.set(LocalDateTime.parse(kst).atZone(ZoneId.of("Asia/Seoul")).toInstant());
            var res = mockMvc.perform(post("/api/me/attendance").header("Authorization", bearer(m))).andReturn()
                    .getResponse();
            out.append(" [KST ").append(kst).append(" = UTC ").append(NOW.get()).append(" → ")
                    .append(res.getStatus()).append(' ').append(res.getContentAsString()).append(']');
        }
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ? AND ref_type = 'ATTENDANCE'",
                Long.class, m.getId());
        System.out.println(out.append(" 출석 적립 ").append(n).append("건"));
    }

    @Test
    void 재현() throws Exception {
        scenario("A 같은 KST 날짜(UTC 자정 전후)", "2026-10-23T08:59:59", "2026-10-23T09:00:00");
        scenario("B KST 자정 전후", "2026-10-23T23:59:59", "2026-10-24T00:00:00");
    }
}
JAVA

./gradlew --console=plain -q test --tests '*B09ReproTest*' >/dev/null 2>&1 || true
grep -ho 'B09 [^<]*건' build/test-results/test/*B09ReproTest*.xml | sed 's/&quot;/"/g'
