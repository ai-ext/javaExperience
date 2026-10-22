package com.example.board;

import java.util.UUID;

import jakarta.persistence.EntityManagerFactory;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.example.board.config.JwtProvider;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;

/** D05 이후 API 테스트가 공유하는 도우미. 회원·토큰 생성과 SQL 횟수 측정을 제공한다. */
@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
public abstract class ApiTestSupport {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected MemberRepository memberRepository;

    @Autowired
    protected JwtProvider jwtProvider;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected EntityManagerFactory emf;

    protected Member newMember(Role role) {
        return memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", "hash",
                "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), role));
    }

    protected String bearer(Member member) {
        return "Bearer " + jwtProvider.issue(member.getId(), member.getRole());
    }

    protected Statistics statistics() {
        return emf.unwrap(SessionFactory.class).getStatistics();
    }

    protected Long newPost(Member author) {
        jdbc.update("INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)"
                + " VALUES (?, '제목', '내용', 'ACTIVE', 0, NOW(6), NOW(6))", author.getId());
        return jdbc.queryForObject("SELECT MAX(id) FROM post WHERE member_id = ?", Long.class, author.getId());
    }
}
