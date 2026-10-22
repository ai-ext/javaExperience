package com.example.board.point;

import org.junit.jupiter.api.Test;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AttendanceApiTest extends ApiTestSupport {

    @Test
    void 출석하면_10포인트가_쌓이고_같은_날_두_번째는_409다() throws Exception {
        Member m = newMember(Role.USER);

        mockMvc.perform(post("/api/me/attendance").header("Authorization", bearer(m)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.earnedPoints").value(10))
                .andExpect(jsonPath("$.attendedOn").isString());
        mockMvc.perform(post("/api/me/attendance").header("Authorization", bearer(m)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/duplicate"));

        mockMvc.perform(get("/api/me/points").header("Authorization", bearer(m)))
                .andExpect(jsonPath("$.balance").value(10));
        mockMvc.perform(get("/api/me/points/history").header("Authorization", bearer(m)))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].refType").value("ATTENDANCE"));
    }

    @Test
    void 로그인하지_않으면_401이다() throws Exception {
        mockMvc.perform(post("/api/me/attendance")).andExpect(status().isUnauthorized());
    }
}
