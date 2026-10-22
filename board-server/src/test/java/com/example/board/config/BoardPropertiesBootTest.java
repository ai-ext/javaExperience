package com.example.board.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
class BoardPropertiesBootTest {

    @Autowired
    BoardProperties properties;

    @Autowired
    MockMvc mockMvc;

    @Test
    void application_yml_값으로_정상_기동한다() throws Exception {
        assertThat(properties.forbiddenWords().ignoreCase()).isTrue();
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
