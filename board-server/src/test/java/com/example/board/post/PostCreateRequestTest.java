package com.example.board.post;

import java.util.List;
import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PostCreateRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private Set<String> invalidFields(PostCreateRequest request) {
        return validator.validate(request).stream().map(v -> v.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    void 정상_요청은_통과한다() {
        assertThat(validator.validate(new PostCreateRequest("제목", "내용", List.of("a", "b")))).isEmpty();
        assertThat(validator.validate(new PostCreateRequest("제목", "내용", null))).isEmpty();
    }

    @Test
    void 공백만_있는_제목을_거절한다() {
        assertThat(invalidFields(new PostCreateRequest("   ", "내용", null))).containsExactly("title");
    }

    @Test
    void 제목_101자와_내용_5001자를_거절한다() {
        assertThat(invalidFields(new PostCreateRequest("a".repeat(101), "내용", null))).containsExactly("title");
        assertThat(invalidFields(new PostCreateRequest("제목", "a".repeat(5001), null))).containsExactly("content");
        assertThat(validator.validate(new PostCreateRequest("a".repeat(100), "a".repeat(5000), null))).isEmpty();
    }

    @Test
    void 내용이_비면_거절한다() {
        assertThat(invalidFields(new PostCreateRequest("제목", "", null))).containsExactly("content");
    }

    @Test
    void 태그_6개를_거절한다() {
        assertThat(invalidFields(new PostCreateRequest("제목", "내용", List.of("a", "b", "c", "d", "e", "f"))))
                .containsExactly("tags");
        assertThat(validator.validate(new PostCreateRequest("제목", "내용", List.of("a", "b", "c", "d", "e")))).isEmpty();
    }

    @Test
    void 태그_21자와_빈_태그를_거절한다() {
        Set<ConstraintViolation<PostCreateRequest>> v1 =
                validator.validate(new PostCreateRequest("제목", "내용", List.of("a".repeat(21))));
        assertThat(v1).hasSize(1);
        assertThat(validator.validate(new PostCreateRequest("제목", "내용", List.of("")))).hasSize(1);
        assertThat(validator.validate(new PostCreateRequest("제목", "내용", List.of("a".repeat(20))))).isEmpty();
    }
}
