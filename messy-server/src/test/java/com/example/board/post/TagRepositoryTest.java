package com.example.board.post;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class TagRepositoryTest {

    @Autowired
    TagRepository tagRepository;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void 같은_이름의_태그는_새로_만들지_않고_재사용한다() {
        String name = "t" + UUID.randomUUID().toString().substring(0, 8);
        Tag first = tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name)));
        Tag second = tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name)));

        assertThat(second.getId()).isEqualTo(first.getId());
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM tag WHERE name = ?", Integer.class, name);
        assertThat(count).isEqualTo(1);
    }

    @Test
    void 이름_UNIQUE가_최종_방어선() {
        String name = "u" + UUID.randomUUID().toString().substring(0, 8);
        tagRepository.saveAndFlush(Tag.create(name));

        assertThatThrownBy(() -> tagRepository.saveAndFlush(Tag.create(name)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
