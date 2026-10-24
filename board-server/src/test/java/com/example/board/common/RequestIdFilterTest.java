package com.example.board.common;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

import jakarta.servlet.ServletException;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class RequestIdFilterTest {

    private static final Pattern UUID_PATTERN =
            Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$");

    @Autowired
    MockMvc mockMvc;

    @Test
    void 헤더가_없으면_UUID를_만들어_응답에_붙인다() throws Exception {
        String id = mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-Id"))
                .andReturn().getResponse().getHeader("X-Request-Id");

        assertThat(id).matches(UUID_PATTERN);
    }

    @Test
    void 헤더가_있으면_같은_값이_돌아온다() throws Exception {
        mockMvc.perform(get("/actuator/health").header("X-Request-Id", "client-req-123"))
                .andExpect(header().string("X-Request-Id", "client-req-123"));
    }

    @Test
    void 로그를_오염시킬_수_있는_값은_버리고_새로_만든다() throws Exception {
        String id = mockMvc.perform(get("/actuator/health").header("X-Request-Id", "a b%0d%0afake"))
                .andReturn().getResponse().getHeader("X-Request-Id");

        assertThat(id).matches(UUID_PATTERN);
    }

    @Test
    void 요청_처리_중에는_MDC에_있고_끝나면_지운다() throws Exception {
        RequestIdFilter filter = new RequestIdFilter();
        AtomicReference<String> inside = new AtomicReference<>();
        MockFilterChain chain = new MockFilterChain(new jakarta.servlet.http.HttpServlet() {
            @Override
            protected void service(jakarta.servlet.http.HttpServletRequest req,
                    jakarta.servlet.http.HttpServletResponse res) {
                inside.set(MDC.get("requestId"));
            }
        });
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest(), response, chain);

        assertThat(inside.get()).isEqualTo(response.getHeader("X-Request-Id"));
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    void 예외가_나도_MDC를_지운다() {
        RequestIdFilter filter = new RequestIdFilter();
        jakarta.servlet.FilterChain failing = (req, res) -> {
            throw new ServletException("boom");
        };

        assertThatThrownBy(() -> filter.doFilter(
                new MockHttpServletRequest(), new MockHttpServletResponse(), failing))
                .isInstanceOf(ServletException.class);
        assertThat(MDC.get("requestId")).isNull();
    }

    @Test
    void logback_패턴에_requestId가_들어_있다() throws Exception {
        String xml = Files.readString(Path.of("src/main/resources/logback-spring.xml"));

        assertThat(xml).contains("%X{requestId}");
    }
}
