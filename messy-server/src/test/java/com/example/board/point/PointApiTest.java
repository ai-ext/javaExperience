package com.example.board.point;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PointApiTest extends ApiTestSupport {

    @Autowired
    PointService pointService;

    @Test
    void 내_잔액은_200과_balance() throws Exception {
        Member m = newMember(Role.USER);
        pointService.earn(m.getId(), 10, "POST", 1L);
        pointService.earn(m.getId(), 2, "COMMENT", 2L);

        mockMvc.perform(get("/api/me/points").header("Authorization", bearer(m)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.balance").value(12));
    }

    // 함정: 이력이 없는 회원의 SUM은 null이다
    @Test
    void 이력이_없는_회원도_200이고_잔액_0_이력_빈_목록() throws Exception {
        Member m = newMember(Role.USER);

        mockMvc.perform(get("/api/me/points").header("Authorization", bearer(m)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.balance").value(0));
        mockMvc.perform(get("/api/me/points/history").header("Authorization", bearer(m)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void 이력은_최신순_커서로_이어_읽고_다른_회원_것은_안_섞인다() throws Exception {
        Member m = newMember(Role.USER);
        Member other = newMember(Role.USER);
        for (int i = 1; i <= 5; i++) {
            pointService.earn(m.getId(), i, "POST", (long) i);
        }
        pointService.earn(other.getId(), 99, "POST", 99L);

        String body = mockMvc.perform(get("/api/me/points/history").param("size", "2").header("Authorization", bearer(m)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].amount").value(5))
                .andExpect(jsonPath("$.items[0].type").value("EARN"))
                .andExpect(jsonPath("$.items[0].balanceAfter").value(15))
                .andExpect(jsonPath("$.items[0].refType").value("POST"))
                .andExpect(jsonPath("$.items[1].amount").value(4))
                .andReturn().getResponse().getContentAsString();
        String cursor = com.jayway.jsonpath.JsonPath.read(body, "$.nextCursor");

        mockMvc.perform(get("/api/me/points/history").param("size", "2").param("cursor", cursor)
                .header("Authorization", bearer(m)))
                .andExpect(jsonPath("$.items[0].amount").value(3))
                .andExpect(jsonPath("$.items[1].amount").value(2));
    }

    @Test
    void size_범위_밖과_엉뚱한_cursor는_400() throws Exception {
        Member m = newMember(Role.USER);
        mockMvc.perform(get("/api/me/points/history").param("size", "51").header("Authorization", bearer(m)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/me/points/history").param("cursor", "x!").header("Authorization", bearer(m)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void 토큰_없으면_401() throws Exception {
        mockMvc.perform(get("/api/me/points")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/me/points/history")).andExpect(status().isUnauthorized());
    }
}
