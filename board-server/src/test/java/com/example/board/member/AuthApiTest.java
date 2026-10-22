package com.example.board.member;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
class AuthApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    MemberRepository memberRepository;

    static String email() {
        return UUID.randomUUID() + "@t.com";
    }

    static String nick() {
        return "n" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    ResultActions signup(String email, String password, String nickname) throws Exception {
        String body = "{\"email\":\"%s\",\"password\":\"%s\",\"nickname\":\"%s\"}".formatted(email, password, nickname);
        return mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    @Test
    void 가입은_201이고_비밀번호는_BCrypt_해시로_저장된다() throws Exception {
        String email = email();
        signup(email, "password1", nick()).andExpect(status().isCreated()).andExpect(jsonPath("$.id").isNumber());

        Member saved = memberRepository.findByEmail(email).orElseThrow();
        assertThat(saved.getPasswordHash()).startsWith("$2").isNotEqualTo("password1");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void 닉네임은_정규화되어_저장된다() throws Exception {
        String email = email();
        String nick = "Kim" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        signup(email, "password1", nick).andExpect(status().isCreated());

        assertThat(memberRepository.findByEmail(email).orElseThrow().getNickname()).isEqualTo(nick.toLowerCase());
    }

    @Test
    void 같은_이메일로_다시_가입하면_409_duplicate() throws Exception {
        String email = email();
        signup(email, "password1", nick()).andExpect(status().isCreated());

        signup(email, "password1", nick())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/duplicate"));
    }

    @Test
    void 대소문자만_다른_닉네임도_409() throws Exception {
        String nick = "Dup" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        signup(email(), "password1", nick).andExpect(status().isCreated());

        signup(email(), "password1", nick.toUpperCase()).andExpect(status().isConflict());
    }

    @Test
    void 비밀번호_7자는_400_errors_password() throws Exception {
        signup(email(), "passwo1", nick())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("password"));
    }

    @Test
    void 비밀번호에_숫자가_없으면_400() throws Exception {
        signup(email(), "onlyletters", nick())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("password"));
    }
}
