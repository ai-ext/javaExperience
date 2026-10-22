package com.example.board.admin;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;
import com.example.board.config.JwtProvider;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * MockMvc의 multipart()는 서블릿 업로드 한도(spring.servlet.multipart)를 거치지 않는다.
 * 실제 톰캣에 HTTP로 올려 한도 초과가 413이 아니라 400 /errors/validation인지 확인한다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class BulkIssueUploadLimitTest {

    @Autowired
    Environment env;

    @Autowired
    JwtProvider jwtProvider;

    @Test
    void 서블릿_업로드_한도를_넘는_6MB_파일은_400_validation() throws Exception {
        HttpResponse<String> response = upload(new byte[6 * 1024 * 1024]);

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.headers().firstValue("Content-Type")).hasValueSatisfying(
                v -> assertThat(v).startsWith("application/problem+json"));
        assertThat(response.body()).contains("\"type\":\"/errors/validation\"")
                .contains("\"instance\":\"/api/admin/coupons/1/bulk-issue\"");
    }

    // 파일 한도(5MB)에서 읽기를 멈춘 뒤 남은 본문(4MB)이 톰캣 기본 max-swallow-size(2MB)를 넘어도 연결이 끊기지 않고 400을 받는다
    @Test
    void 한도_근처의_9MB_파일도_연결이_끊기지_않고_400() throws Exception {
        HttpResponse<String> response = upload(new byte[9 * 1024 * 1024]);

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.body()).contains("\"type\":\"/errors/validation\"");
    }

    private HttpResponse<String> upload(byte[] content) throws Exception {
        String boundary = "----board" + UUID.randomUUID();
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\n"
                + "Content-Disposition: form-data; name=\"file\"; filename=\"members.xlsx\"\r\n"
                + "Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n")
                .getBytes(StandardCharsets.UTF_8));
        body.write(content);
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        String port = env.getProperty("local.server.port");
        HttpRequest request = HttpRequest.newBuilder(
                        URI.create("http://localhost:" + port + "/api/admin/coupons/1/bulk-issue"))
                .header("Authorization", "Bearer " + jwtProvider.issue(1L, Role.ADMIN))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                .build();
        try (HttpClient client = HttpClient.newHttpClient()) {
            return client.send(request, HttpResponse.BodyHandlers.ofString());
        }
    }
}
