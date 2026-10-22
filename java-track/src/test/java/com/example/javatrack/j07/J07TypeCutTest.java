package com.example.javatrack.j07;

import static org.assertj.core.api.Assertions.assertThat;

import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

/**
 * 타입 한 컷: boolean vs Boolean, is 접두어와 JSON 직렬화 — 응답 필드 이름이 바뀌는 문제.
 * 응답 이름은 JSON 라이브러리(Jackson)가 getter 이름으로 정한다. 이 모듈에는 Jackson이 없으므로 같은 이름 규칙을 쓰는
 * JDK의 JavaBeans 분석기(java.beans.Introspector)로 확인한다. 여기 나오는 getter 모양(getX·boolean isX)에서는 둘의 결과가 같다.
 */
class J07TypeCutTest {

    private static List<String> beanNames(Class<?> type) throws IntrospectionException {
        return Arrays.stream(Introspector.getBeanInfo(type, Object.class).getPropertyDescriptors())
                .map(PropertyDescriptor::getName)
                .toList();
    }

    @Test
    void getter_이름_규칙대로_필드마다_응답_이름을_구한다() throws IntrospectionException {
        List<String> names = JsonNames.jsonNames(LombokCouponResponse.class);

        assertThat(names).containsExactly("name", "used", "expired", "issued", "isHidden", "autoRenew");
        assertThat(names).containsExactlyInAnyOrderElementsOf(beanNames(LombokCouponResponse.class));
    }

    @Test
    void 함정_boolean_필드를_isExpired로_지으면_응답_필드는_expired가_된다() throws Exception {
        String name = JsonNames.jsonName(LombokCouponResponse.class.getDeclaredField("isExpired"));

        // 프런트엔드가 response.isExpired를 읽으면 undefined다
        assertThat(beanNames(LombokCouponResponse.class)).contains("expired").doesNotContain("isExpired");
        assertThat(name).isEqualTo("expired");
    }

    @Test
    void 함정_null을_담으려고_Boolean으로만_바꿔도_getIsExpired가_되어_응답_이름이_isExpired로_바뀐다() throws Exception {
        String primitive = JsonNames.jsonName(LombokCouponResponse.class.getDeclaredField("isExpired"));
        String wrapper = JsonNames.jsonName(WrapperExpiredResponse.class.getDeclaredField("isExpired"));

        assertThat(beanNames(WrapperExpiredResponse.class)).containsExactly("isExpired");
        assertThat(primitive).isEqualTo("expired");
        assertThat(wrapper).isEqualTo("isExpired");
    }

    @Test
    void is_다음이_소문자면_접두어가_아니라_issued는_그대로다() throws Exception {
        String name = JsonNames.jsonName(LombokCouponResponse.class.getDeclaredField("issued"));

        // "is"로 시작한다고 무조건 떼면 "sued"가 된다
        assertThat(name).isEqualTo("issued");
        assertThat(beanNames(LombokCouponResponse.class)).contains("issued");
    }
}
