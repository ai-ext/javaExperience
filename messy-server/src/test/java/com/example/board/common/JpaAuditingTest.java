package com.example.board.common;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class JpaAuditingTest {

    @Autowired
    ApplicationContext context;

    @Test
    void JpaAuditing이_켜져_있다() {
        // @EnableJpaAuditing이 없으면 이 빈이 없고 created_at이 null로 들어간다
        assertThat(context.containsBean("jpaAuditingHandler")).isTrue();
    }

    @Test
    void BaseEntity는_감사_리스너를_단_매핑_슈퍼클래스다() {
        assertThat(BaseEntity.class).hasAnnotation(MappedSuperclass.class);
        assertThat(BaseEntity.class.getAnnotation(EntityListeners.class).value())
                .containsExactly(AuditingEntityListener.class);
    }
}
