package com.example.board.post;

import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.Set;

import jakarta.persistence.Entity;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import static org.assertj.core.api.Assertions.assertThat;

/** 엔티티 규칙(설계 5-2 D4): public 생성자와 public setter가 없어야 한다. @Setter·@AllArgsConstructor를 되살리면 실패한다. */
class EntityRulesTest {

    private static Set<Class<?>> entities() throws ClassNotFoundException {
        var scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Entity.class));
        var result = new java.util.HashSet<Class<?>>();
        for (BeanDefinition bd : scanner.findCandidateComponents("com.example.board")) {
            result.add(Class.forName(bd.getBeanClassName()));
        }
        return result;
    }

    @Test
    void 엔티티를_하나_이상_찾는다() throws Exception {
        assertThat(entities()).extracting(Class::getSimpleName).contains("Member", "Post", "Tag", "PostTag", "Report");
    }

    @Test
    void 엔티티는_public_생성자가_없다() throws Exception {
        for (Class<?> c : entities()) {
            assertThat(Arrays.stream(c.getDeclaredConstructors()).filter(k -> Modifier.isPublic(k.getModifiers())))
                    .as("%s의 public 생성자", c.getSimpleName()).isEmpty();
        }
    }

    @Test
    void 엔티티는_set으로_시작하는_public_메서드가_없다() throws Exception {
        for (Class<?> c : entities()) {
            assertThat(Arrays.stream(c.getMethods())
                    .filter(m -> m.getName().startsWith("set") && Modifier.isPublic(m.getModifiers())))
                    .as("%s의 public set 메서드", c.getSimpleName()).isEmpty();
        }
    }
}
