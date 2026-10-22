package com.example.javatrack.j01;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/** 타입 한 컷: int vs Integer — 요청 DTO에서 "값 없음"(null)과 "0"을 구분한다. */
class J01TypeCutTest {

    /** 값을 넣지 않은 필드가 무엇으로 시작하는지 보려는 작은 예. 생성자도 대입도 없다. */
    static class UnsetFields {
        int primitiveSize;
        Integer wrapperSize;
    }

    @Test
    void 대입하지_않은_필드는_int면_0이고_Integer면_null이다() {
        UnsetFields fields = new UnsetFields();

        // int는 "보내지 않음"도 0으로 시작해서 "0을 보냄"과 구분할 수 없다. Integer는 null로 시작한다
        assertThat(fields.primitiveSize).isZero();
        assertThat(fields.wrapperSize).isNull();
    }

    @Test
    void size를_보내지_않으면_null로_받고_기본값_20을_쓴다() {
        PostListRequest request = new PostListRequest(null);

        assertThat(request.size()).isNull();
        assertThat(request.sizeOrDefault()).isEqualTo(PostListRequest.DEFAULT_SIZE);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 20, 50})
    void 보낸_size가_범위_안이면_그대로_쓴다(int size) {
        PostListRequest request = new PostListRequest(size);

        assertThat(request.sizeOrDefault()).isEqualTo(size);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 51})
    void size_0은_값_없음이_아니라_잘못된_값이라_거절한다(int size) {
        assertThatThrownBy(() -> new PostListRequest(size))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void 함정_null인_Integer를_int로_꺼내면_NPE가_난다() {
        PostListRequest request = new PostListRequest(null);

        // int에는 null을 담을 수 없다. 언박싱(Integer → int) 순간 NPE가 난다
        assertThatThrownBy(() -> {
            int size = request.size();
        }).isInstanceOf(NullPointerException.class);
        // 그래서 꺼낼 때는 null을 먼저 처리한 메서드를 거친다
        assertThat(request.sizeOrDefault()).isEqualTo(20);
    }
}
