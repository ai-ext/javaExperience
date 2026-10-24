package com.example.board.tickets;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B09 확인 테스트: 출석의 "하루"는 KST 날짜다. 서버 시계는 운영처럼 UTC 영역으로 고정하고 시각만 바꿔 가며 부른다.
 * - 같은 KST 날짜에 여러 번 → 1회
 * - KST 자정을 넘기면 → 날짜마다 1회(합계 2회)
 * - KST 08:59:59 → 09:00:00(UTC 자정)은 같은 KST 날짜 → 1회
 * 판정은 포인트 이력의 출석 적립 건수와 잔액, 응답의 attendedOn으로 한다.
 */
class B09ConfirmTest extends ApiTestSupport {

    static final ZoneId KST = ZoneId.of("Asia/Seoul");
    static final AtomicReference<Instant> NOW = new AtomicReference<>(Instant.now());

    /** 운영 서버처럼 UTC 영역의 시계. 시각은 테스트가 바꾼다. */
    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock testClock() {
            return new MutableClock(NOW, ZoneOffset.UTC);
        }
    }

    static final class MutableClock extends Clock {

        private final AtomicReference<Instant> now;
        private final ZoneId zone;

        MutableClock(AtomicReference<Instant> now, ZoneId zone) {
            this.now = now;
            this.zone = zone;
        }

        @Override
        public ZoneId getZone() {
            return zone;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(now, zone);
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    }

    Member member;

    @BeforeEach
    void newMemberEachTest() {
        member = newMember(Role.USER);
    }

    static void setKst(String localDateTime) {
        NOW.set(LocalDateTime.parse(localDateTime).atZone(KST).toInstant());
    }

    MvcResult attend() throws Exception {
        return mockMvc.perform(post("/api/me/attendance").header("Authorization", bearer(member))).andReturn();
    }

    int attendanceEarnings() throws Exception {
        String body = mockMvc.perform(get("/api/me/points/history").param("size", "50")
                        .header("Authorization", bearer(member)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return body.split("\"refType\":\"ATTENDANCE\"", -1).length - 1;
    }

    void assertBalance(int expected) throws Exception {
        mockMvc.perform(get("/api/me/points").header("Authorization", bearer(member)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.balance").value(expected));
    }

    @Test
    void 같은_KST_날짜에_여러_번_출석해도_한_번만_적립된다() throws Exception {
        setKst("2026-10-23T10:00:00");
        MvcResult first = attend();
        setKst("2026-10-23T22:30:00");
        MvcResult second = attend();

        assertThat(first.getResponse().getStatus()).isEqualTo(201);
        assertThat(first.getResponse().getContentAsString()).contains("\"attendedOn\":\"2026-10-23\"");
        assertThat(second.getResponse().getStatus()).isEqualTo(409);
        assertThat(attendanceEarnings()).isEqualTo(1);
        assertBalance(10);
    }

    @Test
    void KST_자정을_넘기면_날짜마다_한_번씩_적립된다() throws Exception {
        setKst("2026-10-23T23:59:59");
        MvcResult before = attend();
        setKst("2026-10-24T00:00:00");
        MvcResult after = attend();

        assertThat(before.getResponse().getStatus()).isEqualTo(201);
        assertThat(before.getResponse().getContentAsString()).contains("\"attendedOn\":\"2026-10-23\"");
        assertThat(after.getResponse().getStatus()).as("KST 다음 날 첫 출석").isEqualTo(201);
        assertThat(after.getResponse().getContentAsString()).contains("\"attendedOn\":\"2026-10-24\"");
        assertThat(attendanceEarnings()).isEqualTo(2);
        assertBalance(20);
    }

    @Test
    void UTC_자정인_KST_09시를_넘겨도_같은_KST_날짜면_한_번만_적립된다() throws Exception {
        setKst("2026-10-23T08:59:59");
        MvcResult before = attend();
        setKst("2026-10-23T09:00:00");
        MvcResult after = attend();

        assertThat(before.getResponse().getStatus()).isEqualTo(201);
        assertThat(before.getResponse().getContentAsString()).contains("\"attendedOn\":\"2026-10-23\"");
        assertThat(after.getResponse().getStatus()).as("같은 KST 날짜의 두 번째 출석").isEqualTo(409);
        assertThat(attendanceEarnings()).isEqualTo(1);
        assertBalance(10);
    }
}
