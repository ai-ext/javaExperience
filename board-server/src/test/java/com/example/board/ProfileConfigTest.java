package com.example.board;

import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.yaml.snakeyaml.Yaml;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class ProfileConfigTest {

    private static final Pattern SECRET_KEY = Pattern.compile("(?i).*(password|secret).*");
    private static final Pattern PLACEHOLDER = Pattern.compile("^\\$\\{[A-Z][A-Z0-9_]*(:[^}]*)?}$");
    private static final Pattern REQUIRED_PLACEHOLDER = Pattern.compile("^\\$\\{[A-Z][A-Z0-9_]*}$");

    @Test
    void prod_yml_비밀값은_기본값_없는_자리표시자뿐이다() throws Exception {
        Map<String, String> flat = flatten("/application-prod.yml");

        assertThat(flat).containsKey("spring.datasource.password");
        flat.forEach((key, value) -> {
            if (SECRET_KEY.matcher(key).matches()) {
                assertThat(value).as(key).matches(REQUIRED_PLACEHOLDER);
            }
        });
    }

    @Test
    void 모든_yml의_비밀값은_자리표시자다() throws Exception {
        for (String file : new String[] {"/application.yml", "/application-local.yml", "/application-prod.yml"}) {
            flatten(file).forEach((key, value) -> {
                if (SECRET_KEY.matcher(key).matches()) {
                    assertThat(value).as(file + " " + key).matches(PLACEHOLDER);
                }
            });
        }
    }

    @Test
    void prod는_DB_PASSWORD_없이_기동하면_실패한다() {
        assumeTrue(System.getenv("DB_PASSWORD") == null, "DB_PASSWORD가 설정된 환경에서는 건너뛴다");

        assertThatThrownBy(() -> new SpringApplicationBuilder(BoardApplication.class)
                .profiles("prod")
                .web(WebApplicationType.NONE)
                .run("--spring.main.banner-mode=off", "--DB_URL=jdbc:mysql://localhost:1/x", "--DB_USERNAME=u"))
                .hasStackTraceContaining("Could not resolve placeholder 'DB_PASSWORD'");
    }

    @Test
    void local_yml에_server_port가_있다() throws Exception {
        assertThat(flatten("/application-local.yml")).containsKey("server.port");
    }

    private Map<String, String> flatten(String resource) throws Exception {
        Map<String, String> out = new LinkedHashMap<>();
        try (InputStream in = getClass().getResourceAsStream(resource)) {
            assertThat(in).as(resource).isNotNull();
            for (Object doc : new Yaml().loadAll(in)) {
                flattenInto("", doc, out);
            }
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private void flattenInto(String prefix, Object node, Map<String, String> out) {
        if (node instanceof Map<?, ?> map) {
            ((Map<String, Object>) map).forEach((k, v) -> flattenInto(prefix.isEmpty() ? k : prefix + "." + k, v, out));
        } else if (node != null) {
            out.put(prefix, String.valueOf(node));
        }
    }
}
