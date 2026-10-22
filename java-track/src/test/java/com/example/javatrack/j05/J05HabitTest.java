package com.example.javatrack.j05;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

/** 실무 습관: Map 실무 API — getOrDefault·computeIfAbsent·merge. */
class J05HabitTest {

    @Test
    void 함정_처음_보는_키를_get으로_꺼내_add하면_NPE다_computeIfAbsent는_리스트를_만든다() {
        Map<String, List<Long>> plain = new HashMap<>();
        assertThatThrownBy(() -> plain.get("java").add(1L)).isInstanceOf(NullPointerException.class);

        TagIndex index = new TagIndex();
        index.add("java", 1L);

        assertThat(index.postIdsOf("java")).containsExactly(1L);
    }

    @Test
    void computeIfAbsent는_있는_키에는_새로_만들지_않고_이어_붙인다() {
        TagIndex index = new TagIndex();

        index.add("java", 1L);
        index.add("java", 3L);
        index.add("spring", 2L);

        assertThat(index.postIdsOf("java")).containsExactly(1L, 3L);
        assertThat(index.postIdsOf("spring")).containsExactly(2L);
    }

    @Test
    void 없는_태그를_찾으면_getOrDefault로_빈_리스트를_돌려준다() {
        TagIndex index = new TagIndex();

        assertThat(index.postIdsOf("kotlin")).isNotNull().isEmpty();
    }

    @Test
    void 함정_get에_1을_더해_넣으면_처음_보는_키에서_NPE다_merge는_없으면_1로_넣는다() {
        Map<String, Integer> plain = new HashMap<>();
        // get이 null을 돌려주고, null + 1에서 언박싱 NPE가 난다
        assertThatThrownBy(() -> plain.put("java", plain.get("java") + 1)).isInstanceOf(NullPointerException.class);

        List<Post> posts = List.of(
                new Post(1L, "첫 글", "자바초보", 0, PostStatus.ACTIVE, List.of("java", "spring")),
                new Post(2L, "둘째 글", "자바초보", 0, PostStatus.ACTIVE, List.of("java")));

        assertThat(TagIndex.countTags(posts)).containsOnly(Map.entry("java", 2), Map.entry("spring", 1));
    }
}
