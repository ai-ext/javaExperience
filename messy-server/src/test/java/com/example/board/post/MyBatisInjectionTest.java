package com.example.board.post;

import java.io.IOException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MyBatisInjectionTest extends ApiTestSupport {

    @BeforeEach
    void setUp() {
        clearPosts();
    }

    @Test
    void keyword에_OR_1_eq_1을_넣어도_0건() throws Exception {
        Member m = newMember(Role.USER);
        insertPost(m, "제목", "내용", "ACTIVE");
        insertPost(m, "다른 제목", "다른 내용", "ACTIVE");

        mockMvc.perform(get("/api/posts").param("keyword", "' OR 1=1 --"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)));
        mockMvc.perform(get("/api/posts").param("tag", "x' OR '1'='1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)));
        // 대조군: 같은 데이터에서 정상 검색은 걸린다
        mockMvc.perform(get("/api/posts").param("keyword", "다른"))
                .andExpect(jsonPath("$.items", hasSize(1)));
    }

    @Test
    void 매퍼_XML_어디에도_달러_중괄호가_없다() throws IOException {
        Resource[] xmls = new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/**/*.xml");

        assertThat(xmls).isNotEmpty();
        for (Resource xml : xmls) {
            assertThat(new String(xml.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8))
                    .as(xml.getFilename()).doesNotContain("${");
        }
    }
}
