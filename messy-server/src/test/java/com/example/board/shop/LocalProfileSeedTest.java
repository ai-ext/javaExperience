package com.example.board.shop;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;

/** local 프로파일로 기동하면 시드가 들어가고, 한 번 더 실행해도 늘어나지 않는다. 시드는 local 설정에만 연결된다. */
@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles({"test", "local"})
class LocalProfileSeedTest {

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    javax.sql.DataSource dataSource;

    int count(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }

    @Test
    void local_기동_뒤_시드가_들어_있고_다시_실행해도_그대로다() throws Exception {
        try (var c = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(c, new EncodedResource(new ClassPathResource("data-local.sql"), "UTF-8"));
        }

        assertThat(count("SELECT COUNT(*) FROM member WHERE email = 'admin@board.local' AND role = 'ADMIN'"))
                .isEqualTo(1);
        assertThat(passwordEncoder.matches("Admin1234!",
                jdbc.queryForObject("SELECT password_hash FROM member WHERE email = 'admin@board.local'", String.class)))
                .isTrue();
        assertThat(count("SELECT COUNT(*) FROM coupon WHERE id = 1 AND total_quantity = 10")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM coupon")).isEqualTo(1);
        assertThat(count("SELECT DATEDIFF(expires_at, created_at) FROM coupon WHERE id = 1")).isEqualTo(30);
        assertThat(count("SELECT COUNT(*) FROM shop_item")).isEqualTo(3);
    }

    @Test
    void 시드는_local_프로파일_설정에만_연결되어_있다() throws Exception {
        assertThat(read("/application-local.yml")).contains("data-locations: classpath:data-local.sql");
        assertThat(read("/application.yml")).doesNotContain("data-local");
        assertThat(read("/application-prod.yml")).doesNotContain("data-local");
    }

    private String read(String path) throws Exception {
        try (var in = getClass().getResourceAsStream(path)) {
            return new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}
