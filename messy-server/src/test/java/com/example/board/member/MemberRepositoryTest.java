package com.example.board.member;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class MemberRepositoryTest {

    @Autowired
    MemberRepository repository;

    @Test
    void 같은_email로_두_번_저장하면_DataIntegrityViolationException() {
        String email = UUID.randomUUID() + "@t.com";
        repository.saveAndFlush(Member.create(email, "hash", "nickA" + System.nanoTime() % 100000, Role.USER));

        assertThatThrownBy(() -> repository.saveAndFlush(Member.create(email, "hash", "nickB" + System.nanoTime() % 100000, Role.USER)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 저장하면_감사_필드와_기본값이_채워진다() {
        Member saved = repository.saveAndFlush(
                Member.create(UUID.randomUUID() + "@t.com", "hash", "n" + UUID.randomUUID().toString().substring(0, 8), Role.USER));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getPointBalance()).isZero();
        assertThat(saved.getRole()).isEqualTo(Role.USER);
    }
}
